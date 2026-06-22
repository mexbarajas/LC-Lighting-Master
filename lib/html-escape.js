export function escapeHtml(text) {
  if (typeof text !== 'string') return ''

  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }

  return text.replace(/[&<>"']/g, char => map[char])
}

export function sanitizeEmailInput(value, maxLength = 1000) {
  if (typeof value !== 'string') return ''
  return escapeHtml(value.trim().slice(0, maxLength))
}
