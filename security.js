export const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

export function safeUrl(value) {
  if (typeof value !== "string" || /[\u0000-\u0020\u007f]/.test(value)) return "";
  try {
    const url = new URL(value);
    if (!["https:", "http:"].includes(url.protocol) || url.username || url.password) return "";
    return url.href;
  } catch { return ""; }
}

export function contactUrl(kind, value) {
  if (typeof value !== "string" || !value.trim()) return "";
  const text = value.trim();
  if (/^[a-z][a-z\d+.-]*:/i.test(text)) return safeUrl(text);
  const prefixes = { telegram: "https://t.me/", github: "https://github.com/", linkedin: "https://www.linkedin.com/in/", site: "https://" };
  return prefixes[kind] ? safeUrl(prefixes[kind] + text.replace(/^@/, "")) : "";
}
