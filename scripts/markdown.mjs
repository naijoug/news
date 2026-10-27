function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function inline(text) {
  let out = text.replace(/\[([^\]\n]+)\]\((https:\/\/[^\s)]+)\)/g, (_match, label, url) => {
    return `<a href="${url}">${label}</a>`;
  });
  out = out.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>');
  out = out.replace(/\*([^*\n]+)\*/g, '<em>$1</em>');
  return out;
}

function renderBlock(block) {
  const lines = block.split('\n');
  if (lines.length > 0 && lines.every((line) => line.startsWith('- '))) {
    const items = lines.map((line) => `<li>${inline(line.slice(2))}</li>`).join('');
    return `<ul>${items}</ul>`;
  }
  return `<p>${lines.map((line) => inline(line)).join('<br />')}</p>`;
}

/** Escape HTML, then allow paragraphs, "- " lists, **bold**, *em*, and https links. */
export function renderMarkdown(source) {
  const escaped = escapeHtml(source).replaceAll('\r\n', '\n').trim();
  if (!escaped) return '';
  return escaped
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map(renderBlock)
    .join('');
}
