// The practice's clients, and how each one is booked.
//
// Weeks count from the current week (0): -16 is sixteen weeks ago, 2 is the
// week after next. Everything else about a client (date of birth, contact
// details, insurance numbers, every appointment and note) is generated from
// this list, the same way every time.

import type { ClientStatus } from '../model';
import type { ClinicianKey, LocationKey, ServiceKey } from './practice';
import type { Day } from '../time';

export type Concern = 'anxiety' | 'depression' | 'trauma' | 'adjustment' | 'grief' | 'adhd' | 'couples' | 'perinatal';

/** Repeating appointments with one clinician. */
export interface Booking {
  clinician: ClinicianKey;
  day: Day;
  time: string;
  every: 1 | 2 | 4;
  service: ServiceKey;
  location: LocationKey;
  from: number;
  /** The week it stops, exclusive. Open-ended when absent. */
  until?: number;
  /** The first appointment is an initial assessment. Defaults to true for a client's first booking. */
  intake?: boolean;
  /** Other clients in the session: a partner, for couples. */
  with?: string[];
  memo?: string;
}

export interface OneOff {
  clinician: ClinicianKey;
  week: number;
  day: Day;
  time: string;
  service: ServiceKey;
  location: LocationKey;
  memo?: string;
}

export interface Coverage {
  /** The insurer's name as the front desk typed it. */
  payer: string;
  payerId: string | null;
  plan?: string;
  copay?: number;
  deductible?: number;
  /** The policy holder, when it isn't the client. */
  holder?: { relationship: 'spouse' | 'child'; first: string; last: string; age: number };
  /** An old policy, still on file. */
  ended?: boolean;
}

export interface Persona {
  key: string;
  first: string;
  last: string;
  preferred?: string;
  sex: 'female' | 'male';
  gender?: string;
  pronouns?: string;
  /** Null when the date of birth was never entered. */
  age: number | null;
  /** Null until the client has been assessed. */
  concern: Concern | null;
  diagnoses: string[];
  status: ClientStatus;
  clinician: ClinicianKey;
  bookings?: Booking[];
  oneOffs?: OneOff[];
  /** Absent for clients who pay for themselves. */
  coverage?: Coverage[];
  /** Pays out of pocket even with insurance on file. */
  selfPay?: true;
  guardian?: { first: string; last: string; relationship: string };
  /** Lives with this client, and shares their address. */
  household?: string;
  /** The same person, entered a second time. */
  duplicateOf?: string;
  /** Came over from this clinician when they left the practice. */
  transferredFrom?: ClinicianKey;
  /** What brought them in, when it isn't the usual story for their diagnosis. */
  story?: string;
  /** Their past mental health treatment, when it matters to the rest of their notes. */
  history?: string;
  referral?: string;
  quirks?: ('caps' | 'messy_phone' | 'no_email')[];
}

export const DIAGNOSES: Record<string, string> = {
  'F41.1': 'Generalized anxiety disorder',
  'F41.0': 'Panic disorder [episodic paroxysmal anxiety]',
  'F40.10': 'Social phobia, unspecified',
  'F42.2': 'Mixed obsessional thoughts and acts',
  'F43.10': 'Post-traumatic stress disorder, unspecified',
  'F33.0': 'Major depressive disorder, recurrent, mild',
  'F33.1': 'Major depressive disorder, recurrent, moderate',
  'F32.1': 'Major depressive disorder, single episode, moderate',
  'F43.23': 'Adjustment disorder with mixed anxiety and depressed mood',
  'F43.81': 'Prolonged grief disorder',
  'F90.0': 'Attention-deficit hyperactivity disorder, predominantly inattentive type',
  'F90.2': 'Attention-deficit hyperactivity disorder, combined type',
  'F53.0': 'Postpartum depression',
  'Z63.0': 'Problems in relationship with spouse or partner',
};

/** Maya's Thursday evening group. Members join in the week shown. */
export const GROUP = {
  title: 'Anxiety Skills Group',
  clinician: 'maya',
  day: 'thu',
  time: '18:00',
  service: 'group',
  location: 'lakeshore',
  from: -12,
  members: { ava: -12, lucas: -12, zara: -12, sofia: -9, ethan: -7 } as Record<string, number>,
} as const;

/** Hannah Brooks left the practice after this week; her clients moved on. */
export const HANNAH_LEFT_AFTER = -7;

export const ROSTER: Persona[] = [
  // ── Maya Okafor, PsyD ──────────────────────────────────────────────────────
  {
    key: 'ava', first: 'Ava', last: 'Thompson', sex: 'female', pronouns: 'she/her', age: 34,
    concern: 'anxiety', diagnoses: ['F41.1'], status: 'active', clinician: 'maya',
    bookings: [{ clinician: 'maya', day: 'mon', time: '09:00', every: 1, service: 'therapy45', location: 'lakeshore', from: -16 }],
    coverage: [{ payer: 'Aetna', payerId: '60054', plan: 'Aetna Choice POS II', copay: 30, deductible: 1500 }],
    referral: 'Psychology Today',
  },
  {
    key: 'ben', first: 'Benjamin', last: 'Carter', preferred: 'Ben', sex: 'male', pronouns: 'he/him', age: 41,
    concern: 'trauma', diagnoses: ['F43.10'], status: 'active', clinician: 'maya',
    bookings: [{ clinician: 'maya', day: 'mon', time: '10:00', every: 1, service: 'therapy60', location: 'lakeshore', from: -15 }],
    oneOffs: [{ clinician: 'maya', week: -3, day: 'fri', time: '12:00', service: 'crisis', location: 'lakeshore', memo: 'Same-day crisis appointment' }],
    history: 'Sees a psychiatrist, Dr. Alan Reed, who prescribes sertraline and prazosin for sleep. No hospitalizations.',
    coverage: [{ payer: 'Blue Shield CA', payerId: '94036', plan: 'Blue Shield PPO', copay: 25 }],
    referral: 'Primary care physician',
  },
  {
    key: 'olivia', first: 'Olivia', last: 'Bennett', sex: 'female', pronouns: 'she/her', age: 38,
    concern: 'trauma', diagnoses: ['F43.10'], status: 'active', clinician: 'maya',
    bookings: [{ clinician: 'maya', day: 'mon', time: '13:00', every: 1, service: 'therapy60', location: 'lakeshore', from: -16 }],
    story: 'Lost her home in a house fire three years ago. Reports nightmares, panic at the smell of smoke, checking the stove many times a night, and avoiding the street where it happened.',
    coverage: [
      { payer: 'Anthem Blue Cross', payerId: '47198', plan: 'Anthem PPO', copay: 35, deductible: 2000 },
      { payer: 'Aetna', payerId: '60054', plan: 'Aetna Open Access', holder: { relationship: 'spouse', first: 'Michael', last: 'Bennett', age: 40 } },
    ],
    referral: 'Friend or family',
  },
  {
    key: 'henry', first: 'Henry', last: 'Walsh', sex: 'male', pronouns: 'he/him', age: 67,
    concern: 'depression', diagnoses: ['F33.1'], status: 'active', clinician: 'maya',
    bookings: [{ clinician: 'maya', day: 'mon', time: '14:00', every: 2, service: 'therapy45', location: 'lakeshore', from: -12 }],
    coverage: [{ payer: 'Medicare', payerId: '01112', plan: 'Original Medicare (Part B)' }],
    referral: 'Primary care physician',
  },
  {
    key: 'mia', first: 'Mia', last: 'Patel', sex: 'female', pronouns: 'she/her', age: 45,
    concern: 'adjustment', diagnoses: ['F43.23'], status: 'discharged', clinician: 'maya',
    bookings: [{ clinician: 'maya', day: 'mon', time: '14:00', every: 2, service: 'therapy45', location: 'lakeshore', from: -13, until: -2 }],
    coverage: [{ payer: 'Cigna Behavioral Health', payerId: '62308', plan: 'Open Access Plus', copay: 30 }],
    referral: 'Employee assistance program',
  },
  {
    key: 'sofia', first: 'Sofía', last: 'Ramírez', sex: 'female', pronouns: 'she/her', age: 27,
    concern: 'anxiety', diagnoses: ['F41.0'], status: 'active', clinician: 'maya',
    bookings: [{ clinician: 'maya', day: 'wed', time: '09:00', every: 1, service: 'therapy45', location: 'video', from: -10 }],
    coverage: [{ payer: 'Cigna', payerId: '62308', plan: 'Open Access Plus', copay: 40, deductible: 1000 }],
    referral: 'Google search',
  },
  {
    key: 'grace', first: 'Grace', last: 'Liu', sex: 'female', pronouns: 'she/her', age: 52,
    concern: 'anxiety', diagnoses: ['F41.1'], status: 'active', clinician: 'maya',
    bookings: [{ clinician: 'maya', day: 'wed', time: '10:00', every: 2, service: 'therapy60', location: 'video', from: -14 }],
    referral: 'Previous client',
  },
  {
    key: 'chloe', first: 'Chloe', last: 'Martin', sex: 'female', pronouns: 'she/her', age: 29,
    concern: 'anxiety', diagnoses: ['F40.10'], status: 'active', clinician: 'maya',
    bookings: [{ clinician: 'maya', day: 'wed', time: '13:00', every: 1, service: 'therapy45', location: 'video', from: -6 }],
    coverage: [{ payer: 'AETNA', payerId: '60054', copay: 30 }],
    referral: 'Psychology Today',
  },
  {
    key: 'ethan', first: 'Ethan', last: 'Nguyen', sex: 'male', pronouns: 'he/him', age: 22,
    concern: 'anxiety', diagnoses: ['F40.10'], status: 'active', clinician: 'maya',
    bookings: [{ clinician: 'maya', day: 'thu', time: '15:00', every: 1, service: 'therapy45', location: 'lakeshore', from: -8 }],
    coverage: [{ payer: 'UHC', payerId: '87726', plan: 'Choice Plus', copay: 20, holder: { relationship: 'child', first: 'Minh', last: 'Nguyen', age: 54 } }],
    referral: 'Campus counseling center',
  },
  {
    key: 'lucas', first: 'Lucas', last: 'Brown', sex: 'male', pronouns: 'he/him', age: 36,
    concern: 'anxiety', diagnoses: ['F41.1'], status: 'active', clinician: 'maya',
    oneOffs: [{ clinician: 'maya', week: -13, day: 'wed', time: '15:00', service: 'intake', location: 'lakeshore' }],
    referral: 'Psychology Today',
  },
  {
    key: 'zara', first: 'Zara', last: 'Ahmed', sex: 'female', pronouns: 'she/her', age: 26,
    concern: 'anxiety', diagnoses: ['F40.10'], status: 'active', clinician: 'maya',
    oneOffs: [{ clinician: 'maya', week: -13, day: 'thu', time: '13:00', service: 'intake', location: 'lakeshore' }],
    coverage: [{ payer: 'Blue Shield of California', payerId: '94036', plan: 'Trio HMO', copay: 15 }],
    referral: 'Friend or family',
  },

  // ── Daniel Reyes, LCSW ─────────────────────────────────────────────────────
  {
    key: 'james', first: 'James', last: 'Wilson', preferred: 'Jim', sex: 'male', pronouns: 'he/him', age: 48,
    concern: 'depression', diagnoses: ['F33.1'], status: 'active', clinician: 'daniel',
    bookings: [{ clinician: 'daniel', day: 'tue', time: '09:00', every: 1, service: 'therapy60', location: 'video', from: -16 }],
    coverage: [{ payer: 'UnitedHealthcare', payerId: '87726', plan: 'Choice Plus', copay: 20, deductible: 3000 }],
    referral: 'Insurance directory',
  },
  {
    key: 'marcus', first: 'Marcus', last: 'Johnson', sex: 'male', pronouns: 'he/him', age: 35,
    concern: 'depression', diagnoses: ['F32.1'], status: 'active', clinician: 'daniel',
    bookings: [{ clinician: 'daniel', day: 'tue', time: '10:00', every: 1, service: 'therapy45', location: 'lakeshore', from: -12 }],
    coverage: [{ payer: 'Aetna PPO', payerId: '60054', copay: 25 }],
    referral: 'Psychology Today',
  },
  {
    key: 'michael', first: 'Michael', last: 'Davis', sex: 'male', age: 55,
    concern: 'depression', diagnoses: ['F33.0'], status: 'active', clinician: 'daniel',
    bookings: [{ clinician: 'daniel', day: 'tue', time: '13:00', every: 2, service: 'therapy45', location: 'lakeshore', from: -16 }],
    coverage: [{ payer: 'UHC / Optum', payerId: '87726' }],
    referral: 'Primary care physician',
    quirks: ['caps', 'messy_phone'],
  },
  {
    key: 'robert', first: 'Robert', last: 'Garcia', preferred: 'Bob', sex: 'male', pronouns: 'he/him', age: 58,
    concern: 'depression', diagnoses: ['F33.1'], status: 'inactive', clinician: 'daniel',
    bookings: [{ clinician: 'daniel', day: 'tue', time: '13:00', every: 2, service: 'therapy45', location: 'lakeshore', from: -15, until: -4 }],
    coverage: [{ payer: 'United Healthcare', payerId: '87726', plan: 'Choice Plus', copay: 30 }],
    referral: 'Employee assistance program',
  },
  {
    key: 'elena', first: 'Elena', last: 'Petrova', sex: 'female', pronouns: 'she/her', age: 42,
    concern: 'adjustment', diagnoses: ['F43.23'], status: 'active', clinician: 'daniel',
    bookings: [{ clinician: 'daniel', day: 'wed', time: '11:00', every: 2, service: 'therapy45', location: 'video', from: -14 }],
    coverage: [
      { payer: 'Cigna', payerId: '62308', plan: 'Open Access Plus', copay: 35 },
      { payer: 'Anthem Blue Cross', payerId: '47198', plan: 'Anthem PPO', ended: true },
    ],
    referral: 'Google search',
  },
  {
    key: 'tyler', first: 'Tyler', last: 'Hughes', sex: 'male', pronouns: 'he/him', age: 24,
    concern: 'adhd', diagnoses: ['F90.0'], status: 'active', clinician: 'daniel',
    bookings: [{ clinician: 'daniel', day: 'wed', time: '15:00', every: 1, service: 'therapy45', location: 'lakeshore', from: -8 }],
    coverage: [{ payer: 'Anthem BC PPO', payerId: null, holder: { relationship: 'child', first: 'Karen', last: 'Hughes', age: 55 } }],
    referral: 'Campus counseling center',
  },
  {
    key: 'sophie', first: 'Sophie', last: 'Laurent', sex: 'female', pronouns: 'she/her', age: 68,
    concern: 'grief', diagnoses: ['F43.81'], status: 'active', clinician: 'daniel',
    bookings: [{ clinician: 'daniel', day: 'wed', time: '16:00', every: 1, service: 'therapy45', location: 'lakeshore', from: -12 }],
    coverage: [{ payer: 'Medicare Part B', payerId: '01112', plan: 'Original Medicare (Part B)' }],
    referral: 'Hospice bereavement program',
  },
  {
    key: 'jonathan', first: 'Jonathan', last: 'Pierce', sex: 'male', pronouns: 'he/him', age: 39,
    concern: 'anxiety', diagnoses: ['F41.1'], status: 'active', clinician: 'daniel',
    bookings: [{ clinician: 'daniel', day: 'fri', time: '09:00', every: 1, service: 'therapy45', location: 'lakeshore', from: -6 }],
    coverage: [{ payer: 'Aetna', payerId: '60054', copay: 30 }],
    referral: 'Psychology Today',
  },
  {
    key: 'jon', first: 'Jon', last: 'Pierce', sex: 'male', age: 39,
    concern: null, diagnoses: [], status: 'inactive', clinician: 'maya',
    duplicateOf: 'jonathan',
    quirks: ['messy_phone'],
  },
  {
    key: 'aisha', first: 'Aisha', last: 'Mohammed', sex: 'female', pronouns: 'she/her', age: 33,
    concern: 'depression', diagnoses: ['F32.1'], status: 'active', clinician: 'daniel',
    bookings: [{ clinician: 'daniel', day: 'fri', time: '10:00', every: 1, service: 'therapy60', location: 'video', from: -4 }],
    coverage: [{ payer: 'Blue Shield of CA', payerId: '94036', copay: 20 }],
    referral: 'Insurance directory',
  },
  {
    key: 'rosa', first: 'Rosa', last: 'Delgado', sex: 'female', age: null,
    concern: 'adjustment', diagnoses: ['F43.23'], status: 'active', clinician: 'daniel',
    bookings: [{ clinician: 'daniel', day: 'fri', time: '13:00', every: 2, service: 'therapy45', location: 'lakeshore', from: -6 }],
    referral: 'Friend or family',
    quirks: ['no_email', 'messy_phone'],
  },
  {
    key: 'kevin', first: 'Kevin', last: "O'Brien", sex: 'male', pronouns: 'he/him', age: 44,
    concern: 'adjustment', diagnoses: ['F43.23'], status: 'active', clinician: 'daniel',
    bookings: [{ clinician: 'daniel', day: 'fri', time: '14:00', every: 1, service: 'therapy45', location: 'video', from: -2 }],
    referral: 'Google search',
  },
  {
    key: 'carlos', first: 'Carlos', last: 'Mendoza', sex: 'male', pronouns: 'he/him', age: 37,
    concern: 'trauma', diagnoses: ['F43.10'], status: 'active', clinician: 'daniel',
    bookings: [
      { clinician: 'hannah', day: 'tue', time: '15:00', every: 1, service: 'therapy60', location: 'lakeshore', from: -16, until: -6 },
      { clinician: 'daniel', day: 'fri', time: '15:00', every: 1, service: 'therapy60', location: 'lakeshore', from: -5, intake: true },
    ],
    transferredFrom: 'hannah',
    story: 'Served two tours in Afghanistan and left the Army four years ago. Reports nightmares, scanning every room he enters, avoiding crowds and fireworks, and snapping at his partner. Sleeps four or five hours a night.',
    coverage: [{ payer: 'Optum Behavioral Health', payerId: '87726' }],
    referral: 'Veterans support network',
  },
  {
    key: 'fatima', first: 'Fatima', last: 'Hassan', sex: 'female', pronouns: 'she/her', age: 40,
    concern: 'depression', diagnoses: ['F33.1'], status: 'active', clinician: 'daniel',
    bookings: [
      { clinician: 'hannah', day: 'tue', time: '11:00', every: 1, service: 'therapy45', location: 'video', from: -16, until: -6 },
      { clinician: 'daniel', day: 'tue', time: '14:00', every: 1, service: 'therapy60', location: 'video', from: -5, intake: true },
    ],
    transferredFrom: 'hannah',
    coverage: [{ payer: 'Cigna', payerId: '62308', plan: 'Open Access Plus' }],
    referral: 'Primary care physician',
  },

  // ── Priya Nair, LMFT ───────────────────────────────────────────────────────
  {
    key: 'lily', first: 'Lily', last: 'Chen', sex: 'female', pronouns: 'she/her', age: 15,
    concern: 'anxiety', diagnoses: ['F41.1'], status: 'active', clinician: 'priya',
    bookings: [
      { clinician: 'priya', day: 'mon', time: '16:00', every: 1, service: 'therapy45', location: 'rockridge', from: -16 },
      { clinician: 'priya', day: 'thu', time: '17:00', every: 4, service: 'couples', location: 'rockridge', from: -13, intake: false, memo: 'Family session with Lily and her mother, Mei' },
    ],
    guardian: { first: 'Mei', last: 'Chen', relationship: 'Mother' },
    story: 'Worries most days about school, grades and friendships, with stomach aches before tests and trouble falling asleep. Has started staying home on days she feels overwhelmed.',
    coverage: [{ payer: 'Blue Shield California', payerId: null, holder: { relationship: 'child', first: 'Mei', last: 'Chen', age: 46 } }],
    referral: 'School counselor',
  },
  {
    key: 'jayden', first: 'Jayden', last: 'Williams', sex: 'male', pronouns: 'he/him', age: 16,
    concern: 'adhd', diagnoses: ['F90.2'], status: 'active', clinician: 'priya',
    bookings: [{ clinician: 'priya', day: 'mon', time: '15:00', every: 1, service: 'therapy45', location: 'rockridge', from: -10 }],
    guardian: { first: 'Andre', last: 'Williams', relationship: 'Father' },
    coverage: [{ payer: 'Anthem Blue Cross', payerId: '47198', plan: 'Anthem PPO', holder: { relationship: 'child', first: 'Andre', last: 'Williams', age: 45 } }],
    referral: 'School counselor',
  },
  {
    key: 'isabella', first: 'Isabella', last: 'Rossi', sex: 'female', pronouns: 'she/her', age: 36,
    concern: 'couples', diagnoses: ['Z63.0'], status: 'active', clinician: 'priya',
    bookings: [{ clinician: 'priya', day: 'tue', time: '17:00', every: 1, service: 'couples', location: 'rockridge', from: -10, intake: false, with: ['matteo'] }],
    referral: 'Friend or family',
  },
  {
    key: 'matteo', first: 'Matteo', last: 'Rossi', sex: 'male', pronouns: 'he/him', age: 38,
    concern: 'couples', diagnoses: ['Z63.0'], status: 'active', clinician: 'priya',
    household: 'isabella',
  },
  {
    key: 'emma', first: 'Emma', last: 'Schultz', sex: 'female', pronouns: 'she/her', age: 31,
    concern: 'perinatal', diagnoses: ['F53.0'], status: 'active', clinician: 'priya',
    bookings: [{ clinician: 'priya', day: 'tue', time: '11:00', every: 1, service: 'therapy60', location: 'video', from: -8 }],
    coverage: [{ payer: 'Cigna', payerId: '62308', plan: 'Open Access Plus', copay: 25 }],
    referral: 'OB/GYN',
  },
  {
    key: 'leah', first: 'Leah', last: 'Goldberg', sex: 'female', pronouns: 'she/her', age: 47,
    concern: 'depression', diagnoses: ['F32.1'], status: 'active', clinician: 'priya',
    bookings: [{ clinician: 'priya', day: 'thu', time: '11:00', every: 2, service: 'therapy60', location: 'rockridge', from: -15 }],
    coverage: [{ payer: 'Aetna Choice POS II', payerId: '60054', copay: 30 }],
    referral: 'Psychology Today',
  },
  {
    key: 'dana', first: 'Dana', last: 'Whitfield', sex: 'female', pronouns: 'she/her', age: 41,
    concern: 'couples', diagnoses: ['Z63.0'], status: 'active', clinician: 'priya',
    bookings: [{ clinician: 'priya', day: 'thu', time: '18:00', every: 2, service: 'couples', location: 'video', from: -6, intake: false, with: ['morgan'] }],
    referral: 'Google search',
  },
  {
    key: 'morgan', first: 'Morgan', last: 'Whitfield', sex: 'female', gender: 'Non-binary', pronouns: 'they/them', age: 39,
    concern: 'couples', diagnoses: ['Z63.0'], status: 'active', clinician: 'priya',
    household: 'dana',
  },
  {
    key: 'noah', first: 'Noah', last: 'Kim', sex: 'male', pronouns: 'he/him', age: 30,
    concern: null, diagnoses: [], status: 'active', clinician: 'priya',
    oneOffs: [
      { clinician: 'priya', week: -1, day: 'tue', time: '12:00', service: 'consult', location: 'video' },
      { clinician: 'priya', week: 1, day: 'thu', time: '12:00', service: 'intake', location: 'rockridge' },
    ],
    coverage: [{ payer: 'Kaiser Permanente', payerId: null, plan: 'Kaiser HMO' }],
    selfPay: true,
    referral: 'Google search',
  },
  {
    key: 'ana-lucia', first: 'Ana Lucía', last: 'Morales', sex: 'female', pronouns: 'she/her', age: 29,
    concern: 'anxiety', diagnoses: ['F41.1'], status: 'inactive', clinician: 'hannah',
    bookings: [{ clinician: 'hannah', day: 'thu', time: '10:00', every: 1, service: 'therapy45', location: 'video', from: -15, until: -6 }],
    coverage: [{ payer: 'Blue Shield of California', payerId: '94036', copay: 20 }],
    referral: 'Insurance directory',
  },
  {
    key: 'ana-lucia-2', first: 'Ana Lucia', last: 'Morales', sex: 'female', pronouns: 'she/her', age: 29,
    concern: 'anxiety', diagnoses: ['F41.1'], status: 'active', clinician: 'priya',
    duplicateOf: 'ana-lucia',
    transferredFrom: 'hannah',
    bookings: [{ clinician: 'priya', day: 'thu', time: '14:00', every: 1, service: 'therapy45', location: 'video', from: -5, intake: true }],
    coverage: [{ payer: 'Blue Shield CA', payerId: '94036', copay: 20 }],
    referral: 'Transfer from Hannah Brooks',
    quirks: ['messy_phone'],
  },

  // ── Hannah Brooks, LPCC (left the practice) ────────────────────────────────
  {
    key: 'owen', first: 'Owen', last: 'Fletcher', sex: 'male', pronouns: 'he/him', age: 50,
    concern: 'adjustment', diagnoses: ['F43.23'], status: 'discharged', clinician: 'hannah',
    bookings: [{ clinician: 'hannah', day: 'thu', time: '13:00', every: 2, service: 'therapy45', location: 'lakeshore', from: -14, until: -6 }],
    coverage: [{ payer: 'Aetna', payerId: '60054', copay: 30 }],
    referral: 'Employee assistance program',
  },
];
