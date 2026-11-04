// Tiny helpers for writing note content as HTML.

export const esc = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
export const h3 = (text: string) => `<h3>${text}</h3>`;
/** A paragraph of sentences. Empty ones are skipped. */
export const p = (...sentences: (string | false | null | undefined)[]) => `<p>${sentences.filter(Boolean).join(' ')}</p>`;
export const ul = (items: string[]) => `<ul>${items.map((item) => `<li>${item}</li>`).join('')}</ul>`;
/** Blocks of HTML, one per line. Empty ones are skipped. */
export const html = (...blocks: (string | false | null | undefined)[]) => blocks.filter(Boolean).join('\n');
