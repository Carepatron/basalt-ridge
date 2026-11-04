// Clients and their insurance policies, generated from the roster.

import type { Address, Client, Contact, DateString, InsurancePolicy } from '../model';
import { team } from './practice';
import { random, stableId, type Random } from './random';
import { DIAGNOSES, GROUP, ROSTER, type Coverage, type Persona } from './roster';
import { addDays, type Calendar } from '../time';

export const clientId = (key: string) => stableId('cl', key);

const byKey = new Map(ROSTER.map((persona) => [persona.key, persona]));

const HOMES: [street: string, city: string, postalCode: string][] = [
  ['Grand Ave', 'Oakland', '94610'],
  ['Park Blvd', 'Oakland', '94606'],
  ['Piedmont Ave', 'Oakland', '94611'],
  ['Telegraph Ave', 'Oakland', '94609'],
  ['MacArthur Blvd', 'Oakland', '94602'],
  ['Fruitvale Ave', 'Oakland', '94601'],
  ['Shattuck Ave', 'Berkeley', '94704'],
  ['Solano Ave', 'Berkeley', '94707'],
  ['College Ave', 'Berkeley', '94705'],
  ['Park St', 'Alameda', '94501'],
  ['San Pablo Ave', 'Emeryville', '94608'],
  ['Estudillo Ave', 'San Leandro', '94577'],
];

// Contacts are named to fit how they're related: a sister isn't called Jorge.
const NAMES = {
  female: ['Laura', 'Nina', 'Elise', 'Hana', 'Rita', 'Lucia'],
  male: ['Robert', 'Tomás', 'Jorge', 'Paul', 'Andrew', 'Kofi'],
};
const SURNAMES = ['Alvarez', 'Brennan', 'Cho', 'Dubois', 'Ellis', 'Fischer', 'Gupta', 'Hart', 'Ibarra', 'Jensen', 'Novak', 'Park'];
const RELATIONSHIPS: [relationship: string, sex: 'female' | 'male' | null, family: boolean][] = [
  ['Partner', null, false],
  ['Spouse', null, true],
  ['Mother', 'female', true],
  ['Father', 'male', true],
  ['Sister', 'female', true],
  ['Brother', 'male', true],
  ['Friend', null, false],
];

/** Ages on the roster are as of this year, so birthdays never move. */
const ROSTER_YEAR = 2026;

export function buildClients(cal: Calendar) {
  const clients: Client[] = [];
  const policies: InsurancePolicy[] = [];

  for (const persona of ROSTER) {
    const client = buildClient(persona, cal);
    clients.push(client);
    (persona.coverage ?? []).forEach((coverage, index) => policies.push(buildPolicy(persona, client, coverage, index)));
  }
  return { clients, policies };
}

function buildClient(persona: Persona, cal: Calendar): Client {
  // A duplicate record is the same person: same birthday, email and phone number.
  const person = byKey.get(persona.duplicateOf ?? persona.key)!;
  const rng = random(`person:${person.key}`);
  const quirks = new Set(persona.quirks);
  const name = (text: string) => (quirks.has('caps') ? text.toUpperCase() : text);
  const dateOfBirth = persona.age === null ? null : birthday(rng, persona.age);
  const visit = firstVisit(persona, cal);

  return {
    id: clientId(persona.key),
    firstName: name(persona.first),
    lastName: name(persona.last),
    preferredName: persona.preferred ?? null,
    dateOfBirth,
    sex: persona.sex,
    genderIdentity: persona.gender ?? null,
    pronouns: persona.pronouns ?? null,
    email: quirks.has('no_email') ? null : email(rng, person),
    phone: phone(rng, ROSTER.indexOf(person), quirks.has('messy_phone') ? random(`phone:${persona.key}`) : null),
    address: home(persona.household ?? person.key),
    status: persona.status,
    primaryClinicianId: team[persona.clinician].id,
    diagnoses: persona.diagnoses.map((code) => ({ code, description: DIAGNOSES[code] })),
    // A record that never led to an appointment is an old enquiry: just the basics.
    contacts: visit ? contacts(persona) : [],
    billingType: !persona.selfPay && persona.coverage?.some((c) => !c.ended) ? 'insurance' : 'self_pay',
    referralSource: persona.referral ?? null,
    createdAt: createdAt(persona, visit ?? cal.dateOf(-58, 'tue'), cal),
  };
}

function buildPolicy(persona: Persona, client: Client, coverage: Coverage, index: number): InsurancePolicy {
  const family = payerFamily(coverage.payer);
  // Keyed by the person and insurer, so a duplicate client carries the same member ID.
  const rng = random(`policy:${persona.duplicateOf ?? persona.key}:${family}`);
  const earlier = persona.coverage!.slice(0, index).filter((c) => !c.ended).length;
  const holder = coverage.holder;

  return {
    id: stableId('pol', `${persona.key}:${index}`),
    clientId: client.id,
    coverage: coverage.ended || earlier === 0 ? 'primary' : 'secondary',
    payerName: coverage.payer,
    electronicPayerId: coverage.payerId,
    planName: coverage.plan ?? null,
    memberId: memberId(family, rng),
    groupNumber: family === 'medicare' ? null : rng.digits(6),
    subscriber: holder
      ? {
          relationship: holder.relationship,
          firstName: holder.first,
          lastName: holder.last,
          dateOfBirth: birthday(rng, holder.age),
        }
      : { relationship: 'self', firstName: client.firstName, lastName: client.lastName, dateOfBirth: client.dateOfBirth },
    copay: coverage.copay ?? null,
    deductible: coverage.deductible ?? null,
    // Current policies started before the client's first visit; old ones ended the year before.
    effectiveFrom: coverage.ended ? `${ROSTER_YEAR - 1}-01-01` : `${ROSTER_YEAR}-01-01`,
    effectiveTo: coverage.ended ? `${ROSTER_YEAR - 1}-12-31` : null,
    status: coverage.ended ? 'inactive' : 'active',
  };
}

// ── Details ──────────────────────────────────────────────────────────────────

function birthday(rng: Random, age: number): DateString {
  const year = ROSTER_YEAR - age;
  return `${year}-${String(rng.int(1, 12)).padStart(2, '0')}-${String(rng.int(1, 28)).padStart(2, '0')}`;
}

const plain = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z]/g, '')
    .toLowerCase();

function email(rng: Random, person: Persona): string {
  const first = plain(person.first);
  const last = plain(person.last);
  const local = rng.pick([`${first}.${last}`, `${first}${last}${rng.int(70, 99)}`, `${first[0]}${last}`]);
  return `${local}@${rng.pick(['example.com', 'example.com', 'example.org', 'example.net'])}`;
}

/** 555-0100 to 555-0199 are set aside for fiction, so none of these numbers are real. */
function phone(rng: Random, index: number, messy: Random | null): string {
  const area = rng.pick(['510', '510', '510', '415', '925']);
  const line = `01${50 + index}`;
  if (!messy) return `(${area}) 555-${line}`;
  return messy.pick([`${area}.555.${line}`, `${area}555${line}`, `+1 ${area} 555 ${line}`, `${area}-555-${line}`]);
}

function home(key: string): Address {
  const rng = random(`home:${key}`);
  const [street, city, postalCode] = rng.pick(HOMES);
  const unit = rng.chance(0.3) ? rng.pick([`Apt ${rng.int(1, 12)}${rng.pick(['A', 'B', 'C'])}`, `Unit ${rng.int(1, 40)}`]) : null;
  return { line1: `${rng.int(100, 4999)} ${street}`, line2: unit, city, state: 'CA', postalCode, country: 'US' };
}

function contacts(persona: Persona): Contact[] {
  const rng = random(`contacts:${persona.key}`);
  const contactPhone = () => `(${rng.pick(['510', '415', '925'])}) 555-01${String(rng.int(0, 41)).padStart(2, '0')}`;
  const contact = (name: string, relationship: string, isGuardian = false): Contact => ({
    name,
    relationship,
    phone: contactPhone(),
    email: isGuardian ? `${plain(name.split(' ')[0])}.${plain(persona.last)}@example.com` : null,
    isEmergencyContact: true,
    isGuardian,
  });

  if (persona.guardian) {
    const { first, last, relationship } = persona.guardian;
    return [contact(`${first} ${last}`, relationship, true)];
  }
  const partner = persona.household ?? ROSTER.find((p) => p.household === persona.key)?.key;
  if (partner) {
    const { first, last } = byKey.get(partner)!;
    return [contact(`${first} ${last}`, 'Spouse')];
  }
  const spouse = persona.coverage?.find((c) => c.holder?.relationship === 'spouse')?.holder;
  if (spouse) return [contact(`${spouse.first} ${spouse.last}`, 'Spouse')];
  if (!rng.chance(0.8)) return [];

  const [relationship, sex, family] = rng.pick(RELATIONSHIPS);
  const first = rng.pick(NAMES[sex ?? rng.pick(['female', 'male'] as const)]);
  return [contact(`${first} ${family ? persona.last : rng.pick(SURNAMES)}`, relationship)];
}

/** The date of the client's first appointment, if they ever had one. */
function firstVisit(persona: Persona, cal: Calendar): DateString | null {
  const owner = persona.household ? byKey.get(persona.household)! : persona;
  const dates = [
    ...(owner.bookings ?? []).map((b) => cal.dateOf(b.from, b.day)),
    ...(owner.oneOffs ?? []).map((o) => cal.dateOf(o.week, o.day)),
    ...(persona.key in GROUP.members ? [cal.dateOf(GROUP.members[persona.key], GROUP.day)] : []),
  ];
  return dates.sort()[0] ?? null;
}

/** Clients are added a few days to three weeks before they're first seen. */
function createdAt(persona: Persona, firstSeen: DateString, cal: Calendar): string {
  const rng = random(`created:${persona.key}`);
  const time = `${String(rng.int(9, 17)).padStart(2, '0')}:${String(rng.int(0, 59)).padStart(2, '0')}`;
  return cal.at(addDays(firstSeen, -rng.int(3, 21)), time).toISOString();
}

// ── Insurance numbers ────────────────────────────────────────────────────────

type PayerFamily = 'aetna' | 'anthem' | 'blue-shield' | 'cigna' | 'united' | 'medicare' | 'other';

function payerFamily(payerName: string): PayerFamily {
  const name = payerName.toLowerCase();
  if (name.includes('aetna')) return 'aetna';
  if (name.includes('anthem')) return 'anthem';
  if (name.includes('blue shield')) return 'blue-shield';
  if (name.includes('cigna')) return 'cigna';
  if (/uhc|united|optum/.test(name)) return 'united';
  if (name.includes('medicare')) return 'medicare';
  return 'other';
}

function memberId(family: PayerFamily, rng: Random): string {
  switch (family) {
    case 'aetna':
      return `W${rng.digits(9)}`;
    case 'anthem':
      return `${rng.pick(['XEH', 'JQU', 'XEA'])}${rng.digits(9)}`;
    case 'blue-shield':
      return `XEC${rng.digits(9)}`;
    case 'cigna':
      return `U${rng.digits(8)}01`;
    case 'united':
      return rng.digits(9);
    case 'medicare':
      return medicareId(rng);
    default:
      return rng.digits(10);
  }
}

/** A Medicare Beneficiary Identifier: 11 characters in a fixed pattern of digits and letters. */
function medicareId(rng: Random): string {
  const letters = 'ACDEFGHJKMNPQRTUVWXY';
  const digits = '0123456789';
  const pattern = ['123456789', letters, letters + digits, digits, letters, letters + digits, digits, letters, letters, digits, digits];
  return pattern.map((chars) => rng.pick(chars.split(''))).join('');
}
