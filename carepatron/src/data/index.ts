// The demo: Lakeshore Therapy Group, a practice that's fully set up, to show
// what Carepatron looks like with real work in it. The same practice on every
// run, with its calendar centred on the current week.

import type { Dataset } from '../model';
import { buildClients } from './clients';
import { buildLetters } from './letters';
import { buildNotes } from './notes';
import { locations, payers, practice, services, team } from './practice';
import { buildAppointments } from './schedule';
import { calendar } from '../time';

export function demoPractice(now = new Date()): Dataset {
  const cal = calendar(now, practice.timezone);
  const { clients, policies } = buildClients(cal);
  const appointments = buildAppointments(cal);
  const notes = [...buildNotes(cal, appointments, clients), ...buildLetters(cal, appointments)];

  return {
    practice,
    locations: Object.values(locations),
    services: Object.values(services),
    team: Object.values(team),
    payers: Object.values(payers),
    clients,
    policies,
    appointments,
    notes,
  };
}
