// dc.js — a small renderer for the app's markup.
//
// The screens in index.html are written as plain HTML with three additions:
//   {{ name }} / {{ a.b }}          a value from renderVals() (or a loop item)
//   <sc-if value="{{ x }}">          children render only while x is truthy
//   <sc-for list="{{ xs }}" as="x">  children render once per item
// Attributes: onClick / onChange / onKeyDown take a function, disabled and
// autoFocus take a boolean, value is a live property, style-hover is merged
// into style while the pointer is over the element, and a <select> takes its
// option list through options="{{ xs }}".
//
// Each render builds a light virtual tree and patches the live DOM by key, so
// inputs keep focus and caret, and an <sc-if> branch that switches on mounts
// fresh (its entry animation replays) instead of being recycled.

const HOLE = /\{\{\s*([^}]+?)\s*\}\}/g;
const SKIP_ATTR = /^hint-/;
let uid = 0;

function parseParts(str) {
  const parts = []; let last = 0, m;
  HOLE.lastIndex = 0;
  while ((m = HOLE.exec(str))) {
    if (m.index > last) parts.push(str.slice(last, m.index));
    parts.push({ path: m[1] });
    last = m.index + m[0].length;
  }
  if (last < str.length) parts.push(str.slice(last));
  return parts;
}

function lookup(path, scope) {
  if (path === 'true') return true;
  if (path === 'false') return false;
  if (path === 'null') return null;
  if (/^-?\d+(\.\d+)?$/.test(path)) return Number(path);
  const keys = path.split('.');
  let v = scope[keys[0]];
  for (let i = 1; i < keys.length && v != null; i++) v = v[keys[i]];
  return v;
}

function evalParts(parts, scope) {
  if (parts.length === 1 && typeof parts[0] !== 'string') return lookup(parts[0].path, scope);
  return parts.map(p => typeof p === 'string' ? p : (v => v == null || v === false ? '' : String(v))(lookup(p.path, scope))).join('');
}

// ── compile: template DOM → descriptors (done once) ──────────────
function compile(node) {
  if (node.nodeType === 3) {
    if (!node.data.trim() && !node.data.includes(' ')) return null;
    return { kind: 'text', uid: ++uid, parts: parseParts(node.data) };
  }
  if (node.nodeType !== 1) return null;
  const tag = node.localName;
  const children = [...node.childNodes].map(compile).filter(Boolean);
  if (tag === 'sc-if') return { kind: 'if', uid: ++uid, test: parseParts(node.getAttribute('value') || ''), children };
  if (tag === 'sc-for') return { kind: 'for', uid: ++uid, list: parseParts(node.getAttribute('list') || ''), as: node.getAttribute('as') || 'item', children };
  const attrs = [];
  for (const { name, value } of node.attributes) if (!SKIP_ATTR.test(name)) attrs.push([name, parseParts(value)]);
  return { kind: 'el', uid: ++uid, tag, ns: node.namespaceURI, attrs, children };
}

// ── render: descriptors + values → virtual nodes ─────────────────
function expand(descs, scope, prefix, out) {
  for (const d of descs) {
    const key = prefix + d.uid;
    if (d.kind === 'if') { if (evalParts(d.test, scope)) expand(d.children, scope, key + '/', out); }
    else if (d.kind === 'for') {
      const list = evalParts(d.list, scope) || [];
      list.forEach((item, i) => expand(d.children, { ...scope, [d.as]: item }, key + '#' + i + '/', out));
    } else if (d.kind === 'text') out.push({ text: evalParts(d.parts, scope), key });
    else {
      const v = { tag: d.tag, ns: d.ns, key, attrs: {}, on: {}, children: [] };
      for (const [name, parts] of d.attrs) {
        const val = evalParts(parts, scope);
        if (name === 'onclick') v.on.click = val;
        else if (name === 'onchange') v.on[d.tag === 'select' ? 'change' : 'input'] = val;
        else if (name === 'onkeydown') v.on.keydown = val;
        else v.attrs[name] = val;
      }
      expand(d.children, scope, '', v.children);
      out.push(v);
    }
  }
  return out;
}

// ── patch: virtual nodes → live DOM ──────────────────────────────
function dispatch(e) { const h = e.currentTarget._h && e.currentTarget._h[e.type]; if (typeof h === 'function') h(e); }

function hoverOn(e) { const el = e.currentTarget; if (el._hover && !el.disabled) el.style.cssText = (el._style || '') + ';' + el._hover; }
function hoverOff(e) { const el = e.currentTarget; el.style.cssText = el._style || ''; }

function create(v) {
  if (v.text != null) { const t = document.createTextNode(v.text); t._key = v.key; return t; }
  const el = v.ns && v.ns !== 'http://www.w3.org/1999/xhtml' ? document.createElementNS(v.ns, v.tag) : document.createElement(v.tag);
  el._key = v.key; el._h = {};
  update(el, v, true);
  if (v.attrs.autofocus) requestAnimationFrame(() => el.focus());
  return el;
}

function update(el, v, fresh) {
  const a = v.attrs, prev = el._attrs || {};
  for (const name in a) {
    const val = a[name];
    if (name === 'style') {
      el._style = val || '';
      if (!el.matches || !el.matches(':hover') || !el._hover) { if (el.style.cssText !== el._style) el.style.cssText = el._style; }
      else el.style.cssText = el._style + ';' + el._hover;
    } else if (name === 'style-hover') {
      if (!el._hover) { el.addEventListener('mouseenter', hoverOn); el.addEventListener('mouseleave', hoverOff); }
      el._hover = val;
    } else if (name === 'disabled') { el.disabled = !!val; }
    else if (name === 'autofocus') { /* handled on create */ }
    else if (name === 'options' && v.tag === 'select') {
      const list = (val || []).map(String), have = [...el.options].map(o => o.value);
      if (list.join('\u0000') !== have.join('\u0000')) { el.textContent = ''; for (const o of list) el.appendChild(new Option(o, o)); }
    } else if (name === 'value') { /* set after children (select needs its options first) */ }
    else if (val === false || val == null) { if (prev[name] !== undefined) el.removeAttribute(name); }
    else if (fresh || prev[name] !== val) el.setAttribute(name, val === true ? '' : String(val));
  }
  for (const name in prev) if (!(name in a)) el.removeAttribute(name);
  el._attrs = a;
  for (const type in v.on) { if (!(type in el._h)) el.addEventListener(type, dispatch); el._h[type] = v.on[type]; }
  for (const type in el._h) if (!(type in v.on)) el._h[type] = null;
  patchChildren(el, v.children);
  if ('value' in a) { const s = a.value == null ? '' : String(a.value); if (el.value !== s) el.value = s; }
}

function patchChildren(parent, vnodes) {
  const old = new Map();
  for (const n of parent.childNodes) if (n._key != null) old.set(n._key, n);
  let ref = parent.firstChild;
  for (const v of vnodes) {
    let n = old.get(v.key);
    const same = n && (v.text != null ? n.nodeType === 3 : n.nodeType === 1 && n.localName === v.tag);
    if (same) {
      old.delete(v.key);
      if (v.text != null) { if (n.data !== v.text) n.data = v.text; } else update(n, v, false);
    } else n = create(v);
    if (n !== ref) parent.insertBefore(n, ref); else ref = ref.nextSibling;
  }
  for (const n of old.values()) n.remove();
  // anything left that was not ours (e.g. stray nodes) after the last vnode
  while (ref) { const nx = ref.nextSibling; if (ref._key != null) ref.remove(); ref = nx; }
}

// ── component base ───────────────────────────────────────────────
// Mirrors the small React-like surface the screens are written against:
// state, setState, forceUpdate, props, componentDidMount, renderVals.
export class Logic {
  constructor(props = {}) { this.props = props; this.state = {}; this._queued = false; }
  setState(patch) { Object.assign(this.state, typeof patch === 'function' ? patch(this.state) : patch); this.forceUpdate(); }
  forceUpdate() {
    if (this._queued || !this._root) return;
    this._queued = true;
    queueMicrotask(() => { this._queued = false; this._render(); });
  }
  _render() { patchChildren(this._root, expand(this._tree, this.renderVals(), '', [])); }
  mount(root, template) {
    this._root = root;
    this._tree = [...template.content.childNodes].map(compile).filter(Boolean);
    this._render();
    if (this.componentDidMount) this.componentDidMount();
    return this;
  }
}
