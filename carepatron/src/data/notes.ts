// Notes written after appointments, and the treatment plans that follow intakes.
// Each clinician has their own template: Maya uses SOAP, Daniel DAP, Priya BIRP,
// and Hannah wrote free-text narratives.

import type { Appointment, Client, Note } from '../model';
import { clientId } from './clients';
import { esc, h3, html, p, ul } from './html';
import { measure } from './measures';
import {
  BANKS,
  COUPLES_RESPONSES,
  FAMILY_FOCUS,
  GROUP_PARTICIPATION,
  GROUP_TOPICS,
  HISTORY,
  MENTAL_STATUS,
  PLANS,
  PRESENTING,
  RESPONSES,
  RISK,
  TELEHEALTH_CONSENT,
} from './phrases';
import { locations, services, team, type ClinicianKey, type ServiceKey } from './practice';
import { hash, random, stableId, type Random } from './random';
import { DIAGNOSES, GROUP, ROSTER, type Persona } from './roster';
import { addDays, addMinutes, ageOn, localDate, type Calendar } from '../time';

const TEMPLATE: Record<ClinicianKey, 'SOAP' | 'DAP' | 'BIRP' | 'Narrative'> = {
  maya: 'SOAP',
  daniel: 'DAP',
  priya: 'BIRP',
  hannah: 'Narrative',
};

const personaOf = new Map(ROSTER.map((p) => [clientId(p.key), p]));
const clinicianOf = new Map(Object.entries(team).map(([key, member]) => [member.id, key as ClinicianKey]));
const serviceOf = new Map(Object.entries(services).map(([key, service]) => [service.id, key as ServiceKey]));
const videoId = locations.video.id;

export function buildNotes(cal: Calendar, appointments: Appointment[], clients: Client[]): Note[] {
  const clientOf = new Map(clients.map((client) => [client.id, client]));
  const notes: Note[] = [];
  const sessions = new Map<string, number>();

  for (const appointment of appointments) {
    if (appointment.status !== 'completed') continue;
    const service = serviceOf.get(appointment.serviceId!)!;
    // Groups get a note per member; couples one note, on the first partner.
    const writtenFor = service === 'group' ? appointment.clientIds : appointment.clientIds.slice(0, 1);

    for (const id of writtenFor) {
      const session = sessions.get(id) ?? 0;
      sessions.set(id, session + 1);
      const rng = random(`note:${appointment.id}:${id}`);
      const fate = fateOf(rng, appointment, cal);
      if (fate === 'missing') continue;

      const written = write({
        appointment,
        persona: personaOf.get(id)!,
        client: clientOf.get(id)!,
        clinician: clinicianOf.get(appointment.clinicianId)!,
        service,
        session,
        rng,
        cal,
      });
      const created = earliest(addMinutes(new Date(appointment.endsAt), rng.int(5, 90)), cal.now);
      notes.push({
        id: stableId('note', `${appointment.id}:${id}`),
        clientId: id,
        appointmentId: appointment.id,
        authorId: appointment.clinicianId,
        type: written.type,
        template: written.template,
        title: written.title,
        dateOfService: localDate(new Date(appointment.startsAt), cal.timeZone),
        status: fate,
        signedAt: fate === 'signed' ? earliest(addMinutes(created, rng.int(15, 2880)), cal.now).toISOString() : null,
        createdAt: created.toISOString(),
        content: written.content,
      });
    }
  }

  return [...notes, ...plans(notes, cal)];
}

/** Older notes are signed. In the last week, some are drafts and a few aren't written yet. */
function fateOf(rng: Random, appointment: Appointment, cal: Calendar): 'missing' | 'draft' | 'signed' {
  const daysAgo = (cal.now.getTime() - new Date(appointment.endsAt).getTime()) / 86_400_000;
  if (daysAgo >= 7) return 'signed';
  const roll = rng.next();
  return roll < 0.2 ? 'missing' : roll < 0.55 ? 'draft' : 'signed';
}

const earliest = (a: Date, b: Date) => (a < b ? a : b);

// ── Writing ──────────────────────────────────────────────────────────────────

interface Session {
  appointment: Appointment;
  persona: Persona;
  client: Client;
  clinician: ClinicianKey;
  service: ServiceKey;
  /** How many of this client's appointments came before this one. */
  session: number;
  rng: Random;
  cal: Calendar;
}

type Written = Pick<Note, 'type' | 'template' | 'title' | 'content'>;

function write(s: Session): Written {
  switch (s.service) {
    case 'intake':
      return { type: 'intake', template: 'Intake assessment', title: 'Intake assessment', content: intake(s) };
    case 'consult':
      return { type: 'contact', template: 'Consultation', title: 'Free consultation', content: consultation(s) };
    case 'group':
      return { type: 'progress', template: 'Group note', title: GROUP.title, content: groupNote(s) };
    case 'crisis':
      return { type: 'progress', template: 'SOAP', title: 'Crisis session', content: crisis() };
    case 'couples':
      return s.appointment.clientIds.length > 1
        ? { type: 'progress', template: 'BIRP', title: 'Couples session', content: couples(s) }
        : { type: 'progress', template: 'BIRP', title: 'Family session', content: family(s) };
    default: {
      const template = TEMPLATE[s.clinician];
      return { type: 'progress', template, title: 'Progress note', content: progress[template](s) };
    }
  }
}

const firstName = (persona: Persona) => esc(persona.preferred ?? persona.first);
const fullName = (persona: Persona) => esc(`${persona.first} ${persona.last}`);
const fill = (text: string, values: Record<string, string>) => text.replace(/\{(\w+)\}/g, (match, key: string) => values[key] ?? match);

/** Two different entries from a list. */
function two<T>(rng: Random, items: T[]): [T, T] {
  const first = rng.int(0, items.length - 1);
  const second = (first + rng.int(1, items.length - 1)) % items.length;
  return [items[first], items[second]];
}

/** The pieces a note is assembled from, picked for this session. */
function pieces(s: Session) {
  const bank = BANKS[s.persona.concern ?? 'adjustment'];
  const rating = String(s.rng.int(3, 8));
  const values = { rating };
  const [first, second] = two(s.rng, bank.reports).map((r) => fill(r, values));
  const [focus, next] = two(s.rng, bank.focus);
  const video = s.appointment.locationId === videoId;
  const every = s.appointment.recurrence?.match(/INTERVAL=(\d)/)?.[1];
  const cadence = every === '2' ? 'every other week' : every === '4' ? 'monthly' : 'weekly';
  const service = services[s.service];
  return {
    first,
    second,
    focus,
    next,
    video,
    cadence,
    assessment: s.rng.pick(bank.assessments),
    homework: s.rng.pick(bank.homework),
    risk: s.rng.pick(RISK),
    measure: s.session % 4 === 0 ? measure(s.persona, s.session) : null,
    billing: `${service.name.toLowerCase()} (${service.cptCode})`,
    telehealth: video ? TELEHEALTH_CONSENT : null,
  };
}

function mood(rng: Random): string {
  const [said, seen] = rng.pick(MENTAL_STATUS.moods);
  return `Mood "${said}"; affect ${seen}.`;
}

function mentalStatus(rng: Random, video: boolean): string {
  const arrival = rng.pick(video ? MENTAL_STATUS.telehealth : MENTAL_STATUS.inPerson);
  return `${arrival} ${rng.pick(MENTAL_STATUS.manner)} ${mood(rng)} ${rng.pick(MENTAL_STATUS.thought)}`;
}

const progress: Record<'SOAP' | 'DAP' | 'BIRP' | 'Narrative', (s: Session) => string> = {
  SOAP(s) {
    const c = pieces(s);
    return html(
      h3('Subjective'),
      p(`Client ${c.first}`, `Client also ${c.second}`),
      h3('Objective'),
      p(c.telehealth, mentalStatus(s.rng, c.video), `Session focused on ${c.focus}.`),
      c.measure && p(c.measure),
      h3('Assessment'),
      p(c.assessment, c.risk),
      h3('Plan'),
      ul([c.homework, `Continue ${c.cadence} ${c.billing}.`, `Next session: ${c.next}.`]),
    );
  },
  DAP(s) {
    const c = pieces(s);
    const name = firstName(s.persona);
    return html(
      h3('Data'),
      p(c.telehealth, `${name} ${c.first}`, `${name} also ${c.second}`, `Session focused on ${c.focus}.`),
      c.measure && p(c.measure),
      h3('Assessment'),
      p(c.assessment, mood(s.rng), c.risk),
      h3('Plan'),
      p(c.homework, `Continue ${c.cadence} sessions; next time we will look at ${c.next}.`),
    );
  },
  BIRP(s) {
    const c = pieces(s);
    return html(
      h3('Behavior'),
      p(`Client ${c.first}`, mentalStatus(s.rng, c.video), c.telehealth),
      h3('Intervention'),
      p(`Worked with client on ${c.focus}.`),
      h3('Response'),
      p(s.rng.pick(RESPONSES)),
      c.measure && p(c.measure),
      h3('Plan'),
      p(c.homework, `Return in ${c.cadence === 'weekly' ? 'one week' : 'two weeks'}.`),
    );
  },
  Narrative(s) {
    const c = pieces(s);
    const name = firstName(s.persona);
    const minutes = services[s.service].durationMinutes;
    return html(
      p(`Met with ${name} for a ${minutes}-minute session${c.video ? ' by video' : ''}.`, `${name} ${c.first}`, `${name} also ${c.second}`),
      p(`We spent most of the session on ${c.focus}.`, c.assessment, c.risk, c.measure),
      p(`Plan: ${c.homework}`, `See again ${c.cadence === 'weekly' ? 'next week' : 'in two weeks'}.`),
    );
  },
};

function intake(s: Session): string {
  const { persona, client, rng } = s;
  const video = s.appointment.locationId === videoId;
  const age = client.dateOfBirth ? ageOn(client.dateOfBirth, localDate(new Date(s.appointment.startsAt), s.cal.timeZone)) : null;
  const history = age !== null && age < 18 ? HISTORY.teen : HISTORY.adult;
  const noun = persona.gender === 'Non-binary' ? 'non-binary person' : persona.sex === 'female' ? 'woman' : 'man';
  const who = age === null ? `an adult ${noun}` : age < 18 ? `a ${age}-year-old high school student` : `a ${age}-year-old ${noun}`;
  const from = persona.transferredFrom && persona.transferredFrom !== s.clinician ? team[persona.transferredFrom] : null;
  const groupOnly = persona.key in GROUP.members && !persona.bookings?.length;
  const therapy = groupOnly ? `group therapy (${GROUP.title})` : persona.concern === 'couples' ? 'couples therapy' : 'individual therapy';
  const first = measure(persona, s.session);

  return html(
    h3('Identifying information'),
    p(
      `${fullName(persona)} is ${who}. Referral: ${esc(persona.referral ?? 'self-referred')}.`,
      persona.guardian &&
        `Attended with their ${persona.guardian.relationship.toLowerCase()}, ${esc(persona.guardian.first)}, who joined the first half of the session.`,
      from &&
        `Transferred from ${from.firstName} ${from.lastName}, ${from.credentials}, who has left the practice; previous notes reviewed.`,
      video ? TELEHEALTH_CONSENT : null,
    ),
    h3('Presenting problem'),
    p(persona.story ?? storyFor(persona)),
    h3('History'),
    p(persona.history ?? rng.pick(pastTreatment(persona, history.psychiatric)), rng.pick(HISTORY.medical), rng.pick(history.substances)),
    h3('Mental status'),
    p(mentalStatus(rng, video)),
    h3('Risk assessment'),
    p(`Denied current or past suicidal ideation, self-harm and homicidal ideation. Protective factors: ${rng.pick(history.protective)}.`),
    first && h3('Measures'),
    first && p(first),
    h3('Diagnosis'),
    ul(persona.diagnoses.map((dx) => `${dx} ${DIAGNOSES[dx]}`)),
    h3('Plan'),
    p(
      `Recommend ${therapy}. ${PLANS[persona.concern ?? 'adjustment'].interventions}`,
      'Informed consent, practice policies and the notice of privacy practices reviewed and signed.',
    ),
  );
}

/** The usual story for the client's diagnosis; clients who share one get different versions. */
function storyFor(persona: Persona): string {
  const stories = [PRESENTING[persona.diagnoses[0]]].flat();
  return stories[hash(persona.key) % stories.length];
}

/** Past treatment that fits: a first episode of depression can't have a previous one. */
function pastTreatment(persona: Persona, options: string[]): string[] {
  const firstEpisode = persona.diagnoses.some((code) => code.startsWith('F32') || code === 'F53.0');
  return firstEpisode ? options.filter((option) => !option.includes('episode of depression')) : options;
}

/** Noah's free consultation, the only one on the books. */
function consultation(s: Session): string {
  return html(
    p(`15-minute video consultation. ${firstName(s.persona)} is looking for help with anxiety at work and trouble sleeping.`),
    p(
      'Has Kaiser Permanente insurance, which the practice is out of network with. Discussed self-pay rates and superbills for out-of-network reimbursement.',
    ),
    p('Booked an initial assessment with Priya.'),
  );
}

function groupNote(s: Session): string {
  const first = s.cal.dateOf(GROUP.from, GROUP.day);
  const date = localDate(new Date(s.appointment.startsAt), s.cal.timeZone);
  const number = Math.round((Date.parse(date) - Date.parse(first)) / (7 * 86_400_000)) + 1;
  return html(
    h3('Group topic'),
    p(`Session ${number}: ${GROUP_TOPICS[(number - 1) % GROUP_TOPICS.length]}.`),
    h3('Participation'),
    p(`Client ${s.rng.pick(GROUP_PARTICIPATION)}`),
    h3('Plan'),
    p("Continue weekly group. Practice this week's skill and bring one example to the next session."),
  );
}

function crisis(): string {
  return html(
    h3('Subjective'),
    p(
      'Client called the office this morning reporting a surge of intrusive memories and panic after a near-miss on the freeway yesterday. Slept about two hours. Same-day crisis session offered.',
    ),
    h3('Objective'),
    p('Arrived visibly distressed, tearful and shaking; calmer by the end of the session. Alert and oriented x4. Thought process logical.'),
    h3('Assessment'),
    p(
      'Acute rise in PTSD symptoms after a trauma reminder. Denied suicidal and homicidal ideation, intent or plan; no access to firearms. Risk assessed as low.',
    ),
    h3('Plan'),
    ul([
      'Grounding and paced breathing practiced in session.',
      'Safety plan reviewed and updated.',
      'Coordinate with psychiatrist (consent on file).',
      'Follow up at the regular Monday appointment.',
    ]),
  );
}

function couples(s: Session): string {
  const c = pieces(s);
  const partner = personaOf.get(s.appointment.clientIds[1])!;
  const values = { partner: firstName(partner) };
  return html(
    h3('Behavior'),
    p(`${firstName(s.persona)} ${fill(c.first, values)}`, c.telehealth),
    h3('Intervention'),
    p(`Worked with the couple on ${c.focus}.`),
    h3('Response'),
    p(fill(s.rng.pick(COUPLES_RESPONSES), values)),
    h3('Plan'),
    p(c.homework, `Continue ${c.cadence} couples sessions (90847).`),
  );
}

function family(s: Session): string {
  const c = pieces(s);
  return html(
    h3('Behavior'),
    p(`Family session with ${firstName(s.persona)} and her mother, Mei.`, `${firstName(s.persona)} ${c.first}`),
    h3('Intervention'),
    p(`Worked with ${firstName(s.persona)} and Mei on ${s.rng.pick(FAMILY_FOCUS)}.`),
    h3('Response'),
    p('Both were engaged. Mei said she feels more confident supporting Lily at home.'),
    h3('Plan'),
    p('Continue monthly family sessions alongside weekly individual therapy.'),
  );
}

// ── Treatment plans ──────────────────────────────────────────────────────────

/** A treatment plan a week after each client starts with a clinician. */
function plans(notes: Note[], cal: Calendar): Note[] {
  // Notes are in date order, so the first couples note seen for a client is their first session.
  const couples = new Set<string>();
  const starts = notes.filter((note) => {
    if (note.type === 'intake') return true;
    if (note.title !== 'Couples session' || couples.has(note.clientId)) return false;
    couples.add(note.clientId);
    return true;
  });
  return starts.flatMap((start) => {
    const persona = personaOf.get(start.clientId)!;
    const date = addDays(start.dateOfService, 7);
    if (date > cal.today || !persona.concern) return [];
    const plan = PLANS[persona.concern];
    const at = cal.at(date, '18:30');
    const review = new Date(`${addDays(date, 90)}T12:00:00Z`).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'UTC',
    });
    const content = html(
      h3('Diagnosis'),
      ul(persona.diagnoses.map((dx) => `${dx} ${DIAGNOSES[dx]}`)),
      h3('Goals'),
      `<ol>${plan.goals.map(([goal, objectives]) => `<li><strong>${goal}</strong>${ul(objectives)}</li>`).join('')}</ol>`,
      h3('Interventions'),
      p(plan.interventions),
      h3('Review'),
      p(
        `Review progress by ${review}.`,
        `${persona.concern === 'couples' ? 'Both partners' : 'Client'} took part in writing this plan and agreed to it.`,
      ),
    );
    return [
      {
        id: stableId('note', `plan:${start.id}`),
        clientId: start.clientId,
        appointmentId: null,
        authorId: start.authorId,
        type: 'treatment_plan' as const,
        template: 'Treatment plan',
        title: 'Treatment plan',
        dateOfService: date,
        status: at < cal.now ? ('signed' as const) : ('draft' as const),
        signedAt: at < cal.now ? at.toISOString() : null,
        createdAt: earliest(at, cal.now).toISOString(),
        content,
      },
    ];
  });
}
