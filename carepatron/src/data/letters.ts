// Letters, calls and summaries: notes clinicians wrote outside a session.

import type { Appointment, Note, NoteType } from '../model';
import { clientId } from './clients';
import { html, p } from './html';
import { team, type ClinicianKey } from './practice';
import { stableId } from './random';
import { HANNAH_LEFT_AFTER } from './roster';
import type { Calendar, Day } from '../time';

interface Letter {
  client: string;
  author: ClinicianKey;
  week: number;
  day: Day;
  time: string;
  type: NoteType;
  title: string;
  /** Paragraphs. A function when it needs the client's history. */
  body: string[] | ((history: Appointment[], cal: Calendar) => string[]);
}

/** Hannah's handover note for each client she passed on when she left. */
const transfer = (client: string, to: string, summary: string): Letter => ({
  client,
  author: 'hannah',
  week: HANNAH_LEFT_AFTER,
  day: 'thu',
  time: '17:30',
  type: 'contact',
  title: 'Transfer of care',
  body: [
    `I am leaving Lakeshore Therapy Group at the end of this week. We talked about the transition over our last two sessions, and they agreed to continue care with ${to}.`,
    `<strong>Treatment so far:</strong> ${summary}`,
    `Warm handoff arranged. My notes are available to ${to.split(' ')[0]} in Carepatron.`,
  ],
});

const course = (name: string, history: Appointment[], cal: Calendar) => {
  const seen = history.filter((a) => a.status === 'completed');
  const day = (a: Appointment) =>
    new Date(a.startsAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', timeZone: cal.timeZone });
  return `${name} attended ${seen.length} sessions between ${day(seen[0])} and ${day(seen[seen.length - 1])}.`;
};

// prettier-ignore
const LETTERS: Letter[] = [
  {
    client: 'ben', author: 'maya', week: -3, day: 'fri', time: '14:30', type: 'contact', title: 'Coordination of care',
    body: [
      "Phone call with Dr. Alan Reed, the client's psychiatrist, after today's crisis session. Written consent on file.",
      "Shared that Ben had a sharp rise in intrusive memories after a near-miss on the freeway. Dr. Reed will see him on Monday to review his medication. The updated safety plan was shared with the client's agreement.",
    ],
  },
  {
    client: 'lily', author: 'priya', week: -9, day: 'wed', time: '16:10', type: 'contact', title: 'Phone call with parent',
    body: [
      'Mei (mother) called to say Lily had a panic attack before a math test on Tuesday and went home early.',
      'Talked through the coping plan Lily is practicing, and how Mei can prompt it without taking over. Agreed to pick this up at the next family session.',
    ],
  },
  {
    client: 'jayden', author: 'priya', week: -6, day: 'mon', time: '13:00', type: 'contact', title: 'School meeting',
    body: [
      "Joined Jayden's 504 plan meeting by video with his father and the school counselor (consent on file).",
      'Agreed accommodations: extended time on tests, seating near the front of the class, and a weekly planner check with the counselor.',
    ],
  },
  {
    client: 'emma', author: 'priya', week: -5, day: 'thu', time: '09:40', type: 'contact', title: 'Coordination of care',
    body: [
      'Sent EPDS results and a treatment update to Dr. Sarah Kline (OB/GYN), with written consent on file.',
      'Dr. Kline is considering a referral to perinatal psychiatry and will follow up with Emma directly.',
    ],
  },
  {
    client: 'robert', author: 'daniel', week: -4, day: 'wed', time: '12:15', type: 'contact', title: 'Phone call',
    body: [
      'Bob called to pause sessions for a few months while he works out of state.',
      "Discussed staying in touch with his PCP and keeping up his morning routine. He can resume by telehealth when he's back. Status changed to inactive.",
    ],
  },
  transfer('carlos', 'Daniel Reyes, LCSW', 'two months of trauma-focused work (CPT) for combat-related PTSD. Nightmares are less frequent; he still avoids crowds and fireworks.'),
  transfer('fatima', 'Daniel Reyes, LCSW', 'behavioral activation for recurrent depression. Mood is improving; she is back at work full time.'),
  transfer('ana-lucia', 'Priya Nair, LMFT', 'CBT for generalized anxiety, focused on worry about work and family. Using the worry window most days.'),
  {
    client: 'owen', author: 'hannah', week: HANNAH_LEFT_AFTER, day: 'thu', time: '17:00', type: 'discharge', title: 'Discharge summary',
    body: (history, cal) => [
      '<strong>Reason for discharge:</strong> Clinician leaving the practice. Client chose to end therapy rather than transfer, as his goals were largely met.',
      `<strong>Course of treatment:</strong> ${course('Owen', history, cal)} Work focused on adjusting to a divorce and a move, with problem-solving and support.`,
      '<strong>Recommendations:</strong> Return to therapy if needed; a referral list was provided.',
    ],
  },
  {
    client: 'mia', author: 'maya', week: -2, day: 'mon', time: '17:30', type: 'discharge', title: 'Discharge summary',
    body: (history, cal) => [
      '<strong>Reason for discharge:</strong> Treatment goals met. Client and clinician agreed to end therapy.',
      `<strong>Course of treatment:</strong> ${course('Mia', history, cal)} Stress and low mood after a job loss have resolved, and she has started a new role.`,
      '<strong>Recommendations:</strong> Return as needed. Employee assistance program details provided.',
    ],
  },
];

export function buildLetters(cal: Calendar, appointments: Appointment[]): Note[] {
  return LETTERS.flatMap((letter) => {
    const date = cal.dateOf(letter.week, letter.day);
    const at = cal.at(date, letter.time);
    if (at > cal.now) return [];
    const id = clientId(letter.client);
    const history = appointments.filter((a) => a.clientIds.includes(id));
    const body = typeof letter.body === 'function' ? letter.body(history, cal) : letter.body;
    return [
      {
        id: stableId('note', `letter:${letter.client}:${letter.title}`),
        clientId: id,
        appointmentId: null,
        authorId: team[letter.author].id,
        type: letter.type,
        template: letter.type === 'discharge' ? 'Discharge summary' : 'Contact note',
        title: letter.title,
        dateOfService: date,
        status: 'signed' as const,
        signedAt: at.toISOString(),
        createdAt: at.toISOString(),
        content: html(...body.map((paragraph) => p(paragraph))),
      },
    ];
  });
}
