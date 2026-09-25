const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

/** Escapes text for use in HTML content and attribute values. */
export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => HTML_ESCAPES[character]);
}

const LINE_SEPARATOR = String.fromCharCode(0x2028);
const PARAGRAPH_SEPARATOR = String.fromCharCode(0x2029);

/**
 * Serialises data for a JSON-LD script block.
 *
 * The less-than sign is written as a unicode escape so a title can never close
 * the script element; the two unicode line separators are escaped as well.
 */
export function jsonForScript(value: unknown): string {
  return JSON.stringify(value)
    .replaceAll('<', '\\u003c')
    .replaceAll(LINE_SEPARATOR, '\\u2028')
    .replaceAll(PARAGRAPH_SEPARATOR, '\\u2029');
}

/**
 * Renders an article's text as plain semantic HTML for crawlers.
 *
 * Understands the same small markup the admin editor documents: `#`, `##`,
 * `###` headings, `>` quotes, `-` lists, `---` rules and paragraphs. Everything
 * is escaped; the result contains only the tags produced here.
 */
export function renderArticleHtml(content: string): string {
  const html: string[] = [];
  let listOpen = false;
  const closeList = () => {
    if (listOpen) html.push('</ul>');
    listOpen = false;
  };

  for (const raw of content.split('\n')) {
    const line = raw.trim();
    if (!line) {
      closeList();
      continue;
    }
    if (line.startsWith('- ')) {
      if (!listOpen) html.push('<ul>');
      listOpen = true;
      html.push(`<li>${escapeHtml(line.slice(2))}</li>`);
      continue;
    }
    closeList();

    if (line === '---') html.push('<hr>');
    else if (line.startsWith('### ')) html.push(`<h3>${escapeHtml(line.slice(4))}</h3>`);
    else if (line.startsWith('## ')) html.push(`<h2>${escapeHtml(line.slice(3))}</h2>`);
    else if (line.startsWith('# ')) html.push(`<h2>${escapeHtml(line.slice(2))}</h2>`);
    else if (line.startsWith('> ')) html.push(`<blockquote>${escapeHtml(line.slice(2))}</blockquote>`);
    else html.push(`<p>${escapeHtml(line)}</p>`);
  }
  closeList();
  return html.join('\n');
}
