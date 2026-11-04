// A brand-new practice: what a practitioner has the day they sign up, before
// anything has been moved in. Just the practice and its owner.

import { LOGIN } from '../auth';
import type { Dataset } from '../model';

export function emptyPractice(): Dataset {
  return {
    practice: {
      id: 'prac_mine',
      name: 'My practice',
      legalName: null,
      npi: null,
      taxId: null,
      taxonomyCode: null,
      email: LOGIN.email,
      phone: null,
      website: null,
      address: null,
      timezone: 'America/Los_Angeles',
      currency: 'USD',
    },
    team: [
      {
        id: 'usr_owner',
        firstName: 'Practice',
        lastName: 'Owner',
        email: LOGIN.email,
        role: 'owner',
        title: null,
        credentials: null,
        npi: null,
        license: null,
        status: 'active',
      },
    ],
    locations: [],
    services: [],
    payers: [],
    clients: [],
    policies: [],
    appointments: [],
    notes: [],
  };
}
