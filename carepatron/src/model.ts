// Everything Carepatron stores: a zod schema for each record, and the type it
// describes. The API takes and returns these shapes, and GET /api/v1/schema
// publishes them, descriptions included, as JSON Schema.

import { z } from 'zod';
import { isTimeZone } from './time';

export type Id = string;
/** A calendar date: `2026-11-04`. */
export type DateString = string;
/** An instant in UTC, ISO 8601: `2026-11-04T17:00:00.000Z`. */
export type Timestamp = string;

// ── Building blocks ──────────────────────────────────────────────────────────

// Say "Required" when a field is missing, rather than zod's "expected string, received undefined".
z.config({ customError: (issue) => (issue.code === 'invalid_type' && issue.input === undefined ? 'Required' : undefined) });

const id = z.string().min(1);
const text = z.string().trim().min(1);
const date = z.iso.date({ error: 'Expected a date, like 2026-11-04' });
/** Any ISO 8601 timestamp with seconds and a time zone. Stored in UTC. */
const timestamp = z.iso
  .datetime({ offset: true, error: 'Expected a timestamp with a time zone, like 2026-11-04T17:00:00Z' })
  .transform((value) => new Date(value).toISOString());
const npi = z.string().regex(/^\d{10}$/, 'Expected a 10-digit NPI');
const money = z.number().nonnegative();

export const Address = z.strictObject({
  line1: text,
  line2: text.nullable().default(null),
  city: text,
  state: text,
  postalCode: text,
  country: text.default('US').describe('Two-letter country code'),
});
export type Address = z.infer<typeof Address>;

// ── Practice settings ────────────────────────────────────────────────────────

export const PracticeFields = z.object({
  name: text,
  legalName: text.nullable(),
  npi: npi.nullable().describe('Organisation (Type 2) NPI'),
  taxId: text.nullable().describe('Employer identification number, such as 12-3456789'),
  taxonomyCode: text.nullable().describe('NUCC provider taxonomy code'),
  email: z.email().nullable(),
  phone: text.nullable(),
  website: text.nullable(),
  address: Address.nullable(),
  timezone: z
    .string()
    .refine(isTimeZone, 'Expected an IANA time zone, like America/Los_Angeles')
    .describe('The IANA time zone the practice works in. Pages show times in it'),
  currency: z.string().regex(/^[A-Z]{3}$/, 'Expected a currency code, like USD'),
});
export const Practice = PracticeFields.extend({ id });
export type Practice = z.infer<typeof Practice>;

export const LocationFields = z.object({
  name: text,
  kind: z.enum(['in_person', 'telehealth']),
  address: Address.nullable(),
  phone: text.nullable(),
  placeOfService: z
    .strictObject({ code: z.string().regex(/^\d{2}$/, 'Expected a two-digit place of service code, like 11'), description: text })
    .nullable()
    .describe('The CMS place of service code claims use, such as 11 (office) or 10 (telehealth at home)'),
});
export const Location = LocationFields.extend({ id });
export type Location = z.infer<typeof Location>;

export const ServiceFields = z.object({
  name: text,
  cptCode: z
    .string()
    .regex(/^([0-9]{4}[0-9A-Z]|[A-Z][0-9]{4})$/, 'Expected a CPT or HCPCS code, like 90834')
    .nullable()
    .describe('CPT or HCPCS code. Null for services that are not billed to insurance'),
  modifiers: z
    .array(z.string().regex(/^[0-9A-Z]{2}$/, 'Expected a two-character modifier, like 95'))
    .max(4)
    .describe('Billing modifiers, such as 95 for telehealth'),
  durationMinutes: z.number().int().positive(),
  rate: money.describe("Fee, in the practice's currency"),
});
export const Service = ServiceFields.extend({ id });
export type Service = z.infer<typeof Service>;

export const TeamMemberFields = z.object({
  firstName: text,
  lastName: text,
  email: z.email(),
  role: z.enum(['owner', 'clinician', 'practice_manager']).describe('Every practice has one owner: the person who signed up'),
  title: text.nullable().describe('Job title, such as Clinical Psychologist'),
  credentials: text.nullable().describe('Letters after their name, such as LCSW'),
  npi: npi.nullable().describe('Individual (Type 1) NPI'),
  license: z
    .strictObject({
      type: text,
      number: text,
      state: z.string().regex(/^[A-Z]{2}$/, 'Expected a two-letter state'),
      expiresOn: date.nullable(),
    })
    .nullable(),
  status: z.enum(['active', 'deactivated']).describe('Deactivated members have left, but their records stay'),
});
export const TeamMember = TeamMemberFields.extend({ id });
export type TeamMember = z.infer<typeof TeamMember>;

export const PayerFields = z
  .object({
    name: text,
    electronicPayerId: text.nullable().describe('The ID claims are sent to through a clearinghouse, such as 60054'),
    type: z.enum(['commercial', 'medicare', 'medicaid', 'other']),
  })
  .describe('An insurance company the practice bills');
export const Payer = PayerFields.extend({ id });
export type Payer = z.infer<typeof Payer>;

// ── Clients ──────────────────────────────────────────────────────────────────

export const ClientStatus = z.enum(['active', 'inactive', 'discharged']);
export type ClientStatus = z.infer<typeof ClientStatus>;

export const Diagnosis = z.strictObject({
  code: z.string().regex(/^[A-Z][0-9][0-9A-Z](\.[0-9A-Z]{1,4})?$/, 'Expected an ICD-10-CM code, like F41.1'),
  description: text,
});
export type Diagnosis = z.infer<typeof Diagnosis>;

export const Contact = z.strictObject({
  name: text,
  relationship: text.describe('How they are related to the client, such as Mother or Friend'),
  phone: text.nullable().default(null),
  email: z.email().nullable().default(null),
  isEmergencyContact: z.boolean().default(false),
  isGuardian: z.boolean().default(false),
});
export type Contact = z.infer<typeof Contact>;

export const ClientFields = z.object({
  firstName: text.describe('Legal first name'),
  lastName: text,
  preferredName: text.nullable().describe('The name they go by, if it is not their first name'),
  dateOfBirth: date.nullable(),
  sex: z.enum(['female', 'male']).nullable().describe('Sex as recorded for insurance'),
  genderIdentity: text.nullable(),
  pronouns: text.nullable(),
  email: z.email().nullable(),
  phone: text.nullable(),
  address: Address.nullable(),
  status: ClientStatus,
  primaryClinicianId: id.nullable().describe('The team member who mainly sees them'),
  diagnoses: z.array(Diagnosis).describe('ICD-10-CM diagnoses'),
  contacts: z.array(Contact).describe('Emergency contacts and guardians'),
  billingType: z.enum(['insurance', 'self_pay']),
  referralSource: text.nullable().describe('How they found the practice'),
  createdAt: timestamp.describe('When they became a client'),
});
export const Client = ClientFields.extend({ id });
export type Client = z.infer<typeof Client>;

export const InsurancePolicyFields = z.object({
  clientId: id,
  coverage: z.enum(['primary', 'secondary', 'tertiary']).describe('Which policy pays first'),
  payerName: text.describe('The insurance company'),
  electronicPayerId: text.nullable().describe('The ID claims are sent to through a clearinghouse, such as 60054'),
  planName: text.nullable(),
  memberId: text,
  groupNumber: text.nullable(),
  subscriber: z
    .strictObject({
      relationship: z
        .enum(['self', 'spouse', 'child', 'other'])
        .describe('self when the client holds it, child when a parent does, spouse, or other'),
      firstName: text,
      lastName: text,
      dateOfBirth: date.nullable(),
    })
    .nullable()
    .describe('The person who holds the policy: the client (self), a spouse or a parent. Null when not recorded'),
  copay: money.nullable(),
  deductible: money.nullable(),
  effectiveFrom: date.nullable(),
  effectiveTo: date.nullable().describe('Null while the policy is current'),
  status: z.enum(['active', 'inactive']),
});
export const InsurancePolicy = InsurancePolicyFields.extend({ id });
export type InsurancePolicy = z.infer<typeof InsurancePolicy>;

// ── Scheduling and documentation ─────────────────────────────────────────────

export const AppointmentStatus = z.enum(['scheduled', 'completed', 'cancelled', 'late_cancelled', 'no_show']);
export type AppointmentStatus = z.infer<typeof AppointmentStatus>;

export const AppointmentFields = z.object({
  title: text.nullable().describe('A name for the session, such as a group'),
  startsAt: timestamp,
  endsAt: timestamp,
  status: AppointmentStatus,
  clientIds: z.array(id).min(1).describe('One client, two for couples, or everyone at a group'),
  clinicianId: id,
  serviceId: id.nullable(),
  locationId: id.nullable(),
  seriesId: text.nullable().describe('Appointments from the same repeating booking share a series'),
  recurrence: text.nullable().describe("The series' RFC 5545 rule, such as FREQ=WEEKLY;INTERVAL=2;BYDAY=TU"),
  memo: text.nullable().describe('A short internal note, such as why it was cancelled'),
});
export const Appointment = AppointmentFields.extend({ id });
export type Appointment = z.infer<typeof Appointment>;

export const NoteType = z.enum(['intake', 'progress', 'treatment_plan', 'contact', 'discharge']);
export type NoteType = z.infer<typeof NoteType>;
export const NoteStatus = z.enum(['draft', 'signed']);
export type NoteStatus = z.infer<typeof NoteStatus>;

export const NoteFields = z.object({
  clientId: id,
  appointmentId: id.nullable().describe('The appointment it was written for, if any. It must include the client'),
  authorId: id.describe('The team member who wrote it'),
  type: NoteType,
  template: text.nullable().describe('The template it was written in, such as SOAP, DAP or BIRP'),
  title: text,
  dateOfService: date,
  status: NoteStatus.describe('Signed notes are final'),
  signedAt: timestamp.nullable(),
  createdAt: timestamp,
  content: z.string().min(1).describe('HTML or plain text'),
});
export const Note = NoteFields.extend({ id });
export type Note = z.infer<typeof Note>;

export interface Dataset {
  practice: Practice;
  locations: Location[];
  services: Service[];
  team: TeamMember[];
  payers: Payer[];
  clients: Client[];
  policies: InsurancePolicy[];
  appointments: Appointment[];
  notes: Note[];
}

// ── What the API can create ──────────────────────────────────────────────────

const now = () => new Date().toISOString();

/**
 * Each kind of record the API can create, change and delete: its path in the
 * API, its table in the database, its ID prefix, the records it points at, and
 * what a new one starts with. Fields without a default are required when
 * creating one.
 */
export const RESOURCES = {
  locations: {
    path: 'locations',
    table: 'locations',
    references: {},
    prefix: 'loc',
    fields: LocationFields,
    defaults: () => ({ address: null, phone: null, placeOfService: null }),
  },
  services: {
    path: 'services',
    table: 'services',
    references: {},
    prefix: 'svc',
    fields: ServiceFields,
    defaults: () => ({ cptCode: null, modifiers: [], rate: 0 }),
  },
  team: {
    path: 'team',
    table: 'team_members',
    references: {},
    prefix: 'usr',
    fields: TeamMemberFields,
    defaults: () => ({ role: 'clinician' as const, title: null, credentials: null, npi: null, license: null, status: 'active' as const }),
  },
  payers: {
    path: 'payers',
    table: 'payers',
    references: {},
    prefix: 'pyr',
    fields: PayerFields,
    defaults: () => ({ electronicPayerId: null, type: 'commercial' as const }),
  },
  clients: {
    path: 'clients',
    table: 'clients',
    references: { primaryClinicianId: 'team' },
    prefix: 'cl',
    fields: ClientFields,
    defaults: () => ({
      preferredName: null,
      dateOfBirth: null,
      sex: null,
      genderIdentity: null,
      pronouns: null,
      email: null,
      phone: null,
      address: null,
      status: 'active' as const,
      primaryClinicianId: null,
      diagnoses: [],
      contacts: [],
      billingType: 'self_pay' as const,
      referralSource: null,
      createdAt: now(),
    }),
  },
  policies: {
    path: 'insurance-policies',
    table: 'insurance_policies',
    references: { clientId: 'clients' },
    prefix: 'pol',
    fields: InsurancePolicyFields,
    defaults: () => ({
      coverage: 'primary' as const,
      electronicPayerId: null,
      planName: null,
      groupNumber: null,
      subscriber: null,
      copay: null,
      deductible: null,
      effectiveFrom: null,
      effectiveTo: null,
      status: 'active' as const,
    }),
  },
  appointments: {
    path: 'appointments',
    table: 'appointments',
    references: { clientIds: 'clients', clinicianId: 'team', serviceId: 'services', locationId: 'locations' },
    prefix: 'appt',
    fields: AppointmentFields,
    defaults: () => ({
      title: null,
      status: 'scheduled' as const,
      serviceId: null,
      locationId: null,
      seriesId: null,
      recurrence: null,
      memo: null,
    }),
  },
  notes: {
    path: 'notes',
    table: 'notes',
    references: { clientId: 'clients', authorId: 'team', appointmentId: 'appointments' },
    prefix: 'note',
    fields: NoteFields,
    defaults: () => ({
      appointmentId: null,
      type: 'progress' as const,
      template: null,
      title: 'Note',
      status: 'draft' as const,
      signedAt: null,
      createdAt: now(),
    }),
  },
} as const;

export type Kind = keyof typeof RESOURCES;

interface Rows {
  locations: Location;
  services: Service;
  team: TeamMember;
  payers: Payer;
  clients: Client;
  policies: InsurancePolicy;
  appointments: Appointment;
  notes: Note;
}
export type Row<K extends Kind> = Rows[K];

/** The schema for creating a record: fields with a default may be left out. */
export function createSchema(kind: Kind) {
  const { fields, defaults } = RESOURCES[kind];
  const optional = Object.fromEntries(Object.keys(defaults()).map((key) => [key, true]));
  // zod types the mask with literal keys; these come from `defaults`, so they're fields.
  return (fields as z.ZodObject).partial(optional as never).strict();
}

/** The schema for changing a record: any subset of its fields. */
export const updateSchema = (kind: Kind) => (RESOURCES[kind].fields as z.ZodObject).partial().strict();
