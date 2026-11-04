// Line icons, drawn on a 24px grid.

import { raw } from 'hono/html';

const icon = (paths: string, size = 18) =>
  raw(
    `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`,
  );

export const icons = {
  home: icon('<path d="M3.5 10.5 12 3.5l8.5 7"/><path d="M5.5 9v11h13V9"/><path d="M10 20v-5.5h4V20"/>'),
  users: icon(
    '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.7-3.6 3.3-5.6 6.5-5.6s5.8 2 6.5 5.6"/><path d="M16 4.7a3.5 3.5 0 0 1 0 6.6"/><path d="M18.2 14.6c1.8.8 2.9 2.6 3.3 5.4"/>',
  ),
  calendar: icon('<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>'),
  note: icon('<path d="M14 3.5H7.5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2V8Z"/><path d="M14 3.5V8h4.5M9 12.5h6M9 16h6"/>'),
  settings: icon('<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>'),
  signOut: icon('<path d="M9.5 20H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h3.5"/><path d="m15.5 16 4-4-4-4M19.5 12H9.5"/>'),
  search: icon('<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4-4"/>', 16),
  left: icon('<path d="m14.5 6-6 6 6 6"/>', 16),
  right: icon('<path d="m9.5 6 6 6-6 6"/>', 16),
  back: icon('<path d="M19 12H5M11 18l-6-6 6-6"/>', 14),
  video: icon('<rect x="3" y="6.5" width="12.5" height="11" rx="2.5"/><path d="m15.5 10.5 5-3v9l-5-3"/>', 15),
  pin: icon('<path d="M12 21s-6.5-5.7-6.5-11a6.5 6.5 0 0 1 13 0c0 5.3-6.5 11-6.5 11Z"/><circle cx="12" cy="10" r="2.4"/>', 15),
  group: icon(
    '<circle cx="8" cy="9" r="2.8"/><circle cx="16" cy="9" r="2.8"/><path d="M3 19c.5-2.9 2.4-4.5 5-4.5s4.5 1.6 5 4.5M11 19c.5-2.9 2.4-4.5 5-4.5s4.5 1.6 5 4.5"/>',
    15,
  ),
};

const MARK =
  '<rect width="32" height="32" rx="9" fill="#2f6b4f"/><path d="M21 11.2a7 7 0 1 0 0 9.6" fill="none" stroke="#fff" stroke-width="2.8" stroke-linecap="round"/>';

export const logo = (size = 28) => raw(`<svg width="${size}" height="${size}" viewBox="0 0 32 32" aria-hidden="true">${MARK}</svg>`);

export const FAVICON = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">${MARK}</svg>`)}`;
