// The practice, stored in SQLite, which is built into Node. Each kind of record
// has a table, with a column for each field: `firstName` is `first_name`. Lists
// and nested details, such as an address, are stored as JSON. The tables and
// their foreign keys come straight from the schemas in model.ts.

import { DatabaseSync, type SQLInputValue, type SQLOutputValue } from 'node:sqlite';
import { PracticeFields, RESOURCES, type Dataset, type Id, type Kind, type Practice, type Row } from './model';

/** Records that others point at come first, so every reference holds while loading. */
const ORDER: Kind[] = ['team', 'locations', 'services', 'payers', 'clients', 'policies', 'appointments', 'notes'];

/** Just enough of a zod schema to read its type. */
interface Schema {
  _zod: { def: { type: string; innerType?: Schema; in?: Schema } };
  isInt?: boolean;
}

/** How a field is stored: its SQL type, whether it can be empty, and whether it's JSON. */
function storage(schema: Schema) {
  let nullable = false;
  let current = schema;
  for (;;) {
    const { type, innerType, in: input } = current._zod.def;
    if (type === 'nullable') nullable = true;
    if ((type === 'nullable' || type === 'optional' || type === 'default') && innerType) current = innerType;
    else if (type === 'pipe' && input) current = input;
    else break;
  }
  const type = current._zod.def.type;
  const json = type === 'object' || type === 'array';
  const sql = json ? 'TEXT' : type === 'number' ? (current.isInt ? 'INTEGER' : 'REAL') : type === 'boolean' ? 'INTEGER' : 'TEXT';
  return { sql, nullable, json, list: type === 'array' };
}

/**
 * A JSON column's value. Anything that isn't valid JSON of the right kind,
 * such as after an edit outside the app, reads as empty: [] for a list, or null.
 */
function parse(value: SQLOutputValue, list: boolean): unknown {
  const empty = list ? [] : null;
  if (value === null) return empty;
  try {
    const parsed: unknown = JSON.parse(String(value));
    return parsed !== null && typeof parsed === 'object' && Array.isArray(parsed) === list ? parsed : empty;
  } catch {
    return empty;
  }
}

const columnOf = (field: string) => field.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);

type WithId = { id: Id };

function table<T extends WithId>(db: DatabaseSync, name: string, shape: object, references: Record<string, string> = {}) {
  const fields = Object.entries(shape as Record<string, Schema>).map(([field, schema]) => ({
    field,
    column: columnOf(field),
    ...storage(schema),
  }));
  const definitions = fields.map(({ column, sql, nullable, json, field }) => {
    const target = references[field];
    return `${column} ${sql}${nullable ? '' : ' NOT NULL'}${target && !json ? ` REFERENCES ${target}(id)` : ''}`;
  });
  db.exec(`CREATE TABLE IF NOT EXISTS ${name} (id TEXT PRIMARY KEY, ${definitions.join(', ')})`);

  const columns = ['id', ...fields.map((f) => f.column)];
  const statements = {
    all: db.prepare(`SELECT * FROM ${name} ORDER BY rowid`),
    get: db.prepare(`SELECT * FROM ${name} WHERE id = ?`),
    insert: db.prepare(`INSERT INTO ${name} (${columns.join(', ')}) VALUES (${columns.map(() => '?').join(', ')})`),
    update: db.prepare(`UPDATE ${name} SET ${fields.map((f) => `${f.column} = ?`).join(', ')} WHERE id = ?`),
    remove: db.prepare(`DELETE FROM ${name} WHERE id = ?`),
    count: db.prepare(`SELECT count(*) AS count FROM ${name}`),
  };

  const read = (row: Record<string, SQLOutputValue>) =>
    Object.fromEntries([
      ['id', row.id],
      ...fields.map(({ field, column, json, list }) => [field, json ? parse(row[column], list) : row[column]]),
    ]) as T;
  const write = (record: T): SQLInputValue[] =>
    fields.map(({ field, json }) => {
      const value = (record as Record<string, unknown>)[field] ?? null;
      return json && value !== null ? JSON.stringify(value) : typeof value === 'boolean' ? Number(value) : (value as SQLInputValue);
    });

  return {
    all: () => statements.all.all().map(read),
    get: (id: Id) => {
      const row = statements.get.get(id);
      return row ? read(row) : undefined;
    },
    insert: (record: T) => void statements.insert.run(record.id, ...write(record)),
    update: (record: T) => void statements.update.run(...write(record), record.id),
    remove: (id: Id) => void statements.remove.run(id),
    count: () => Number(statements.count.get()!.count),
    clear: () => db.exec(`DELETE FROM ${name}`),
  };
}

export type Database = ReturnType<typeof openDatabase>;

/** Opens the database in `file` (or `:memory:`), creating its tables if they aren't there yet. */
export function openDatabase(file: string) {
  // Wait up to 5 seconds when another process (such as sqlite3) is writing, rather than failing.
  const db = new DatabaseSync(file, { timeout: 5000 });
  db.exec('PRAGMA foreign_keys = ON');

  const practice = table<Practice>(db, 'practice', PracticeFields.shape);
  const tables = Object.fromEntries(
    ORDER.map((kind) => {
      const { table: name, fields, references } = RESOURCES[kind];
      const targets = Object.fromEntries(Object.entries(references).map(([field, target]) => [field, RESOURCES[target as Kind].table]));
      return [kind, table(db, name, fields.shape, targets)];
    }),
  ) as unknown as { [K in Kind]: ReturnType<typeof table<Row<K>>> };

  function transaction(work: () => void) {
    db.exec('BEGIN');
    try {
      work();
      db.exec('COMMIT');
    } catch (error) {
      db.exec('ROLLBACK');
      throw error;
    }
  }

  return {
    close: () => db.close(),
    practice: () => practice.all()[0] as Practice | undefined,
    savePractice: (record: Practice) => (practice.get(record.id) ? practice.update(record) : practice.insert(record)),
    table: <K extends Kind>(kind: K) => tables[kind],
    /** Replaces everything with `data`, in one go. */
    replace(data: Dataset) {
      transaction(() => {
        for (const kind of [...ORDER].reverse()) tables[kind].clear();
        practice.clear();
        practice.insert(data.practice);
        for (const kind of ORDER) for (const row of data[kind] as Row<Kind>[]) tables[kind].insert(row as never);
      });
    },
  };
}
