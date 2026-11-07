'use strict';

/* ---------- markdown ---------- */
function md(src) {
  const L = String(src || '')
    .replace(/\r/g, '')
    .split('\n');
  let o = '',
    i = 0;
  const inl = (t) =>
    esc(t)
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/(^|[\s(])\*([^*\s][^*]*?)\*(?=[\s).,;:!?]|$)/g, '$1<em>$2</em>')
      .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  while (i < L.length) {
    const l = L[i];
    if (/^```/.test(l)) {
      const buf = [];
      i++;
      while (i < L.length && !/^```/.test(L[i])) buf.push(L[i++]);
      o += `<pre><code>${esc(buf.join('\n'))}</code></pre>`;
      i++;
      continue;
    }
    const h = /^(#{1,6})\s+(.*)$/.exec(l);
    if (h) {
      const lv = Math.min(h[1].length + 2, 6);
      o += `<h${lv}>${inl(h[2])}</h${lv}>`;
      i++;
      continue;
    }
    if (/^\s*\|/.test(l)) {
      const rows = [];
      while (i < L.length && /^\s*\|/.test(L[i])) rows.push(L[i++]);
      const cells = (r) =>
        r
          .trim()
          .replace(/^\||\|$/g, '')
          .split('|')
          .map((c) => c.trim());
      const body = rows.filter((r) => !/^\s*\|?\s*:?-{3,}/.test(r));
      if (!body.length) continue;
      o +=
        '<div class="tbl"><table><thead><tr>' +
        cells(body[0])
          .map((c) => `<th>${inl(c)}</th>`)
          .join('') +
        '</tr></thead><tbody>' +
        body
          .slice(1)
          .map(
            (r) =>
              '<tr>' +
              cells(r)
                .map((c) => `<td>${inl(c)}</td>`)
                .join('') +
              '</tr>',
          )
          .join('') +
        '</tbody></table></div>';
      continue;
    }
    if (/^\s*([-*+]|\d+\.)\s+/.test(l)) {
      const ord = /^\s*\d+\./.test(l);
      const it = [];
      while (i < L.length && /^\s*([-*+]|\d+\.)\s+/.test(L[i]))
        it.push(L[i++].replace(/^\s*([-*+]|\d+\.)\s+/, ''));
      o +=
        `<${ord ? 'ol' : 'ul'}>` +
        it
          .map((x) => `<li>${inl(x.replace(/^\[( |x)\]\s*/i, (m, c) => (c.trim() ? '☑ ' : '☐ ')))}</li>`)
          .join('') +
        `</${ord ? 'ol' : 'ul'}>`;
      continue;
    }
    if (/^>\s?/.test(l)) {
      const buf = [];
      while (i < L.length && /^>\s?/.test(L[i])) buf.push(L[i++].replace(/^>\s?/, ''));
      o += `<blockquote>${inl(buf.join(' '))}</blockquote>`;
      continue;
    }
    if (/^\s*(---|\*\*\*)\s*$/.test(l)) {
      o += '<hr style="border:0;border-top:1px solid var(--line);margin:12px 0">';
      i++;
      continue;
    }
    if (!l.trim()) {
      i++;
      continue;
    }
    const buf = [];
    while (i < L.length && L[i].trim() && !/^(#{1,6}\s|```|\s*\||\s*([-*+]|\d+\.)\s|>|\s*---\s*$)/.test(L[i]))
      buf.push(L[i++]);
    o += `<p>${inl(buf.join(' '))}</p>`;
  }
  return o;
}

/* ---------- toast + tema ---------- */
let tt = null;
function toast(msg, kind) {
  const t = $('#toast');
  t.className = 'toast ' + (kind || '');
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(tt);
  tt = setTimeout(() => (t.hidden = true), kind === 'crit' ? 7000 : 3800);
}
const th = store.get('fabrica.theme');
if (th) document.documentElement.dataset.theme = th;
$('#btnTheme').onclick = () => {
  const cur =
    document.documentElement.dataset.theme ||
    (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  const nx = cur === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = nx;
  store.set('fabrica.theme', nx);
};
