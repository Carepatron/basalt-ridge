// Note content arrives from migrations, so it isn't trusted. Plain formatting
// tags survive, without their attributes; any other markup is dropped, and
// plain text keeps its paragraphs.

const TAGS = 'p|br|hr|h[1-6]|ul|ol|li|strong|b|em|i|u|s|blockquote|pre|code|table|thead|tbody|tr|th|td|div|span';
/** Inside an escaped tag: anything up to the closing &gt;, including escaped quotes. */
const INSIDE = '(?:[^&]|&quot;|&#39;|&amp;)*?';
const ALLOWED = new RegExp(`&lt;(/?)(${TAGS})(?:\\s${INSIDE})?\\s*/?&gt;`, 'gi');
const ANY_TAG = new RegExp(`&lt;/?[a-z]${INSIDE}&gt;`, 'gi');

/** Plain text as paragraphs, keeping single line breaks. */
const paragraphs = (text: string) =>
  text
    .split(/\n\s*\n/)
    .map((block) => `<p>${block.trim().replace(/\n/g, '<br>')}</p>`)
    .join('');

export function safeHtml(content: string): string {
  // HTML if it uses any tag we keep; "<with>" in a sentence is just text.
  const isHtml = new RegExp(`</?(${TAGS})\\b[^>]*>`, 'i').test(content);
  const hasBlocks = /<\/?(p|div|br|li|h[1-6]|ul|ol|table|blockquote|pre)\b/i.test(content);
  const escaped = content
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<(script|style)\b[\s\S]*?<\/\1\s*>/gi, '')
    .replace(/&(?!(?:[a-z]+|#\d+|#x[0-9a-f]+);)/gi, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
  if (!isHtml) return paragraphs(escaped);
  const html = escaped.replace(ALLOWED, (_, close: string, name: string) => `<${close}${name.toLowerCase()}>`).replace(ANY_TAG, '');
  // Inline-only HTML still has its line breaks in the text.
  return hasBlocks ? html : paragraphs(html);
}
