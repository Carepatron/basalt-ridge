// Lakeshore Therapy Group: who they are, where they work and what they offer.

import type { Location, Payer, Practice, Service, TeamMember } from '../model';
import { stableId } from './random';

const OFFICE = {
  line1: '3210 Lakeshore Ave',
  line2: 'Suite 200',
  city: 'Oakland',
  state: 'CA',
  postalCode: '94610',
  country: 'US',
};

export const practice: Practice = {
  id: stableId('prac', 'lakeshore'),
  name: 'Lakeshore Therapy Group',
  legalName: 'Lakeshore Therapy Group, PC',
  npi: '1234567893',
  taxId: '12-3456789',
  taxonomyCode: '261QM0801X',
  email: 'hello@lakeshore.example',
  phone: '(510) 555-0142',
  website: 'https://lakeshore.example',
  address: OFFICE,
  timezone: 'America/Los_Angeles',
  currency: 'USD',
};

const withId =
  <T>(prefix: string) =>
  (key: string, fields: Omit<T, 'id'>) =>
    ({ id: stableId(prefix, key), ...fields }) as T;

const location = withId<Location>('loc');
const service = withId<Service>('svc');
const member = withId<TeamMember>('usr');
const payer = withId<Payer>('pyr');

export const locations = {
  lakeshore: location('lakeshore', {
    name: 'Lakeshore office',
    kind: 'in_person',
    address: OFFICE,
    phone: '(510) 555-0142',
    placeOfService: { code: '11', description: 'Office' },
  }),
  rockridge: location('rockridge', {
    name: 'Rockridge office',
    kind: 'in_person',
    address: { line1: '5800 College Ave', line2: 'Floor 2', city: 'Oakland', state: 'CA', postalCode: '94618', country: 'US' },
    phone: '(510) 555-0187',
    placeOfService: { code: '11', description: 'Office' },
  }),
  video: location('video', {
    name: 'Telehealth',
    kind: 'telehealth',
    address: null,
    phone: null,
    placeOfService: { code: '10', description: "Telehealth provided in patient's home" },
  }),
};

export const services = {
  consult: service('consult', { name: 'Free consultation', cptCode: null, modifiers: [], durationMinutes: 15, rate: 0 }),
  intake: service('intake', { name: 'Initial assessment', cptCode: '90791', modifiers: [], durationMinutes: 60, rate: 225 }),
  therapy30: service('therapy30', { name: 'Individual therapy, 30 min', cptCode: '90832', modifiers: [], durationMinutes: 30, rate: 110 }),
  therapy45: service('therapy45', { name: 'Individual therapy, 45 min', cptCode: '90834', modifiers: [], durationMinutes: 45, rate: 165 }),
  therapy60: service('therapy60', { name: 'Individual therapy, 60 min', cptCode: '90837', modifiers: [], durationMinutes: 60, rate: 195 }),
  couples: service('couples', { name: 'Couples & family therapy', cptCode: '90847', modifiers: [], durationMinutes: 50, rate: 185 }),
  family: service('family', {
    name: 'Family session, client not present',
    cptCode: '90846',
    modifiers: [],
    durationMinutes: 50,
    rate: 175,
  }),
  group: service('group', { name: 'Group therapy', cptCode: '90853', modifiers: [], durationMinutes: 90, rate: 65 }),
  crisis: service('crisis', { name: 'Crisis session', cptCode: '90839', modifiers: [], durationMinutes: 60, rate: 240 }),
};

export const team = {
  maya: member('maya', {
    firstName: 'Maya',
    lastName: 'Okafor',
    email: 'maya@lakeshore.example',
    role: 'owner',
    title: 'Clinical Psychologist',
    credentials: 'PsyD',
    npi: '1987654328',
    license: { type: 'Psychologist', number: 'PSY 31842', state: 'CA', expiresOn: '2027-08-31' },
    status: 'active',
  }),
  daniel: member('daniel', {
    firstName: 'Daniel',
    lastName: 'Reyes',
    email: 'daniel@lakeshore.example',
    role: 'clinician',
    title: 'Clinical Social Worker',
    credentials: 'LCSW',
    npi: '1452369873',
    license: { type: 'Licensed Clinical Social Worker', number: 'LCSW 98231', state: 'CA', expiresOn: '2027-03-31' },
    status: 'active',
  }),
  priya: member('priya', {
    firstName: 'Priya',
    lastName: 'Nair',
    email: 'priya@lakeshore.example',
    role: 'clinician',
    title: 'Marriage & Family Therapist',
    credentials: 'LMFT',
    npi: '1763254988',
    license: { type: 'Licensed Marriage and Family Therapist', number: 'LMFT 120457', state: 'CA', expiresOn: '2027-12-31' },
    status: 'active',
  }),
  hannah: member('hannah', {
    firstName: 'Hannah',
    lastName: 'Brooks',
    email: 'hannah@lakeshore.example',
    role: 'clinician',
    title: 'Professional Clinical Counselor',
    credentials: 'LPCC',
    npi: '1627384955',
    license: { type: 'Licensed Professional Clinical Counselor', number: 'LPCC 4417', state: 'CA', expiresOn: '2028-01-31' },
    status: 'deactivated',
  }),
  sam: member('sam', {
    firstName: 'Sam',
    lastName: 'Whitaker',
    email: 'sam@lakeshore.example',
    role: 'practice_manager',
    title: 'Practice Manager',
    credentials: null,
    npi: null,
    license: null,
    status: 'active',
  }),
};

export const payers = {
  aetna: payer('aetna', { name: 'Aetna', electronicPayerId: '60054', type: 'commercial' }),
  anthem: payer('anthem', { name: 'Anthem Blue Cross of California', electronicPayerId: '47198', type: 'commercial' }),
  blueShield: payer('blue-shield', { name: 'Blue Shield of California', electronicPayerId: '94036', type: 'commercial' }),
  cigna: payer('cigna', { name: 'Cigna', electronicPayerId: '62308', type: 'commercial' }),
  united: payer('united', { name: 'UnitedHealthcare', electronicPayerId: '87726', type: 'commercial' }),
  medicare: payer('medicare', { name: 'Medicare Part B (Noridian JE)', electronicPayerId: '01112', type: 'medicare' }),
};

export type LocationKey = keyof typeof locations;
export type ServiceKey = keyof typeof services;
export type ClinicianKey = Exclude<keyof typeof team, 'sam'>;
