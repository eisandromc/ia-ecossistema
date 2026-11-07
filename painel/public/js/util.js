'use strict';

/* ---------- utilidades ---------- */
const $ = (s) => document.querySelector(s),
  $$ = (s) => [...document.querySelectorAll(s)];
const NS = 'http://www.w3.org/2000/svg';
const esc = (s) =>
  String(s ?? '').replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );
const sleep = (ms, signal) =>
  new Promise((res, rej) => {
    const t = setTimeout(res, ms);
    signal &&
      signal.addEventListener(
        'abort',
        () => {
          clearTimeout(t);
          rej(abortErr());
        },
        { once: true },
      );
  });
const abortErr = () => {
  const e = new Error('Execução interrompida.');
  e.name = 'AbortError';
  return e;
};
const clip = (s, n) => {
  s = String(s ?? '');
  return s.length > n ? s.slice(0, n) + '…' : s;
};
const fmtMs = (ms) =>
  ms == null ? '—' : ms < 1000 ? Math.round(ms) + ' ms' : (ms / 1000).toFixed(1).replace('.', ',') + ' s';
const fmtClock = (ms) => {
  const s = ms / 1000;
  const m = Math.floor(s / 60);
  return String(m).padStart(2, '0') + ':' + (s % 60).toFixed(1).padStart(4, '0').replace('.', ',');
};
const fmtN = (n) => Math.round(Number(n || 0)).toLocaleString('pt-BR');
const slugify = (s) =>
  String(s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
const estTok = (s) => Math.ceil(String(s || '').length / 4);
const objeto = (v) => !!v && typeof v === 'object' && !Array.isArray(v);
// Respostas de LLM e manifestos importados podem trazer qualquer tipo no lugar de uma lista.
const listaDe = (v) => (Array.isArray(v) ? v.map(String) : []);
// Data local: toISOString() usa UTC e adianta o dia à noite no Brasil.
const hojeISO = () => {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const store = {
  get(k) {
    try {
      return localStorage.getItem(k);
    } catch {
      return null;
    }
  },
  set(k, v) {
    try {
      localStorage.setItem(k, v);
    } catch {}
  },
  sget(k) {
    try {
      return sessionStorage.getItem(k);
    } catch {
      return null;
    }
  },
  sset(k, v) {
    try {
      v == null ? sessionStorage.removeItem(k) : sessionStorage.setItem(k, v);
    } catch {}
  },
};
