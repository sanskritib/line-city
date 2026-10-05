import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { buildSeattle, Seattle, PAPER, BOUNDS } from './scene';
import { statusOf } from './hours';
import { Coffee, UtensilsCrossed, Utensils, HeartPulse, Smile, PersonStanding, Sparkles, Scissors, Hand, HandHeart, Wrench, Shirt, Footprints, Gift, Flower2, Menu, X } from 'lucide';
import type { Kind, Shop } from './data';
import { SHOPS } from './data';

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(PAPER);
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const VIEW = 118;
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -1000, 1000);
camera.position.set(110, 95, 70);
camera.lookAt(0, 0, 0);
function resize() {
  const aspect = window.innerWidth / window.innerHeight;
  const h = aspect > 1 ? VIEW : VIEW / aspect;
  camera.left = (-h * aspect) / 2; camera.right = (h * aspect) / 2;
  camera.top = h / 2; camera.bottom = -h / 2;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
resize();
window.addEventListener('resize', resize);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enablePan = true;
controls.screenSpacePanning = false;
controls.minZoom = 0.6;
controls.maxZoom = 7;
controls.minPolarAngle = 0.3;
controls.maxPolarAngle = 1.25;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.25;
controls.addEventListener('start', () => (controls.autoRotate = false));
controls.addEventListener('change', () => {
  // keep the target on the map
  controls.target.x = THREE.MathUtils.clamp(controls.target.x, BOUNDS.x0, BOUNDS.x1);
  controls.target.z = THREE.MathUtils.clamp(controls.target.z, BOUNDS.z0, BOUNDS.z1);
  controls.target.y = 0;
});

// ---- what fo can do here: groups, kinds, lucide icons, colors ----

type IconNode = [string, Record<string, string | number>][];
function svg(node: IconNode, color: string, size = 24, sw = 2) {
  const kids = node.map(([tag, attrs]) => `<${tag} ${Object.entries(attrs).map(([k, v]) => `${k}="${v}"`).join(' ')}/>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${kids}</svg>`;
}

// breakfast, lunch or dinner, going by the clock on the viewer's own device
function mealNow() { const h = new Date().getHours(); return h < 11 ? 'breakfast' : h < 16 ? 'lunch' : 'dinner'; }

interface KindInfo { label: string; icon: IconNode; does: string; ask: (n: string) => string }
interface Group { id: string; label: string; color: string; icon: IconNode; kinds: Kind[] }
const KINDS: Record<Kind, KindInfo> = {
  coffee: { label: 'coffee', icon: Coffee as IconNode, does: 'check for a seat', ask: (n) => `can you call ${n} and check if they have a free table for [1] right now? i want to sit and work for [about an hour], so outlets or wifi are a plus` },
  dinner: {
    get label() { return mealNow(); },
    icon: UtensilsCrossed as IconNode,
    get does() { return `book a table for ${mealNow()}`; },
    ask: (n) => `can you book me a table for ${mealNow()} at ${n}? party of [2], today around [time]. if that's taken, the closest time either side works`,
  },
  bakery: { label: 'cakes', icon: Utensils as IconNode, does: 'order a cake', ask: (n) => `can you call ${n} and order a custom cake for [date]? [size, flavor, what it should say on top]. ask the price and when i can pick it up` },
  dentist: { label: 'dentists', icon: Smile as IconNode, does: 'book a cleaning', ask: (n) => `can you call ${n} and book me a cleaning for [this week / next week]? first check they're taking new patients and accept my insurance ([insurance name])` },
  pt: { label: 'physical therapy', icon: PersonStanding as IconNode, does: 'book a first visit', ask: (n) => `can you book me a first physical therapy visit at ${n} for [what's bothering you]? check they take my insurance ([insurance name]) and whether i need a referral` },
  hair: { label: 'hair', icon: Scissors as IconNode, does: 'book a cut', ask: (n) => `can you book me a [haircut] at ${n} for [day and time]? ask the price too` },
  nails: { label: 'nails', icon: Hand as IconNode, does: 'book a manicure', ask: (n) => `can you book me a [gel manicure] at ${n} for [day and time]? ask the price too` },
  massage: { label: 'massage', icon: HandHeart as IconNode, does: 'book a massage', ask: (n) => `can you book me a 60 minute [deep tissue] massage at ${n} for [day and time]? ask the price first` },
  tailor: { label: 'tailors', icon: Shirt as IconNode, does: 'get a quote', ask: (n) => `can you call ${n} and ask what [hemming a pair of pants] costs and how soon it'd be ready?` },
  shoes: { label: 'shoe repair', icon: Footprints as IconNode, does: 'check turnaround', ask: (n) => `can you call ${n} and ask what [resoling a pair of boots] costs and how long it takes?` },
  flowers: { label: 'flowers', icon: Flower2 as IconNode, does: 'send a bouquet', ask: (n) => `can you order a bouquet from ${n} for delivery to [address] on [date], around [$60]? the card should say [message]` },
};
const GROUPS: Group[] = [
  { id: 'food', label: 'food', color: '#d9603b', icon: Utensils as IconNode, kinds: ['coffee', 'dinner', 'bakery'] },
  { id: 'health', label: 'health', color: '#2f6fae', icon: HeartPulse as IconNode, kinds: ['dentist', 'pt'] },
  { id: 'beauty', label: 'beauty', color: '#c0457a', icon: Sparkles as IconNode, kinds: ['hair', 'nails', 'massage'] },
  { id: 'fixes', label: 'fixes', color: '#4f8a3a', icon: Wrench as IconNode, kinds: ['tailor', 'shoes'] },
  { id: 'gifts', label: 'gifts', color: '#7b55b8', icon: Gift as IconNode, kinds: ['flowers'] },
];
const groupOf = (k: Kind) => GROUPS.find((g) => g.kinds.includes(k))!;
const kindOf = (s: { kind?: Kind }) => (s.kind ?? 'coffee') as Kind;
const COUNTS = SHOPS.reduce((m, s) => ((m[kindOf(s)] = (m[kindOf(s)] ?? 0) + 1), m), {} as Partial<Record<Kind, number>>);

// ---- marker badges: category color, lucide glyph, filled when open ----
const INK = '#1d1b19', PAPER_HEX = '#f3eee4';
function badge(k: Kind, open: boolean) {
  const color = groupOf(k).color;
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d')!;
  g.beginPath(); g.arc(64, 64, 55, 0, Math.PI * 2);
  g.fillStyle = open ? color : PAPER_HEX; g.fill();
  g.lineWidth = 7; g.strokeStyle = open ? INK : color; g.stroke();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  const img = new Image();
  img.onload = () => { g.drawImage(img, 28, 28, 72, 72); t.needsUpdate = true; };
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg(KINDS[k].icon, open ? PAPER_HEX : color, 72, 2.3));
  return t;
}
const TEX = {} as Record<string, THREE.CanvasTexture>;
for (const k of Object.keys(KINDS) as Kind[]) { TEX[k + '1'] = badge(k, true); TEX[k + '0'] = badge(k, false); }
const texFor = (k: Kind, open: boolean) => TEX[k + (open ? '1' : '0')];
const openTex = TEX.coffee1;
const closedTex = TEX.coffee0;

// ---- fo: text it to get things done ----
const FO_NUMBER = '+16283586116';
const SIGNUP_URL = 'https://wajo.ai'; // swap for a referral link later
const askFo = (s: Shop, k: Kind) => {
  const st = statusOf(s.hours);
  const t = st.today.toLowerCase();
  const when = t === 'closed' ? "they're closed today" : st.open ? `they're open now (${t} today)` : `they're closed right now (${t} today)`;
  return `hey fo, i found ${s.name} on the line city map. ${KINDS[k].ask(s.name)}\n\nit's at ${s.address}, seattle. ${when}.\n${s.maps}`;
};
const smsLink = (body: string) => `sms:${FO_NUMBER}?&body=${encodeURIComponent(body)}`;
// nothing picked = everything shows; picking a kind shows only the picked ones
const selected = new Set<Kind>();
const isShown = (k: Kind) => selected.size === 0 || selected.has(k);
let lastMeal = '';
let navReady = false;

let city: Seattle;
let t0 = performance.now();
function redraw() {
  if (city) { scene.remove(city.root); city.dispose(); }
  city = buildSeattle(Math.floor(Math.random() * 1e9), openTex, closedTex);
  scene.add(city.root);
  t0 = performance.now();
  refreshStatus();
}

// ---- open / closed, live in Seattle time ----
const countEl = document.getElementById('count')!;
function refreshStatus() {
  let open = 0, shown = 0;
  for (const mk of city.markers) {
    const s = statusOf(mk.shop.hours);
    if (isShown(kindOf(mk.shop))) { shown++; if (s.open) open++; }
    const mat = mk.sprite.material as THREE.SpriteMaterial;
    const want = texFor(kindOf(mk.shop), s.open);
    if (mat.map !== want) { mat.map = want; mat.needsUpdate = true; }
  }
  countEl.textContent = `${open} of ${shown} places open right now`;
  if (navReady && mealNow() !== lastMeal) renderNav();
}
redraw();
setInterval(refreshStatus, 30_000);
document.getElementById('redraw')!.addEventListener('click', redraw);
// ---- side nav: everything fo can do on this map ----
const navEl = document.getElementById('nav')!;
function renderNav() {
  lastMeal = mealNow();
  navEl.innerHTML = GROUPS.map((g) => {
    const kinds = g.kinds.filter((k) => COUNTS[k]);
    if (!kinds.length) return '';
    const total = kinds.reduce((n, k) => n + (COUNTS[k] ?? 0), 0);
    return `<div class="grp" style="--c:${g.color}">` +
      `<button class="ghead" data-g="${g.id}"><span class="gic">${svg(g.icon, '#f3eee4', 16, 2.2)}</span><b>${g.label}</b><span class="n">${total}</span></button>` +
      kinds.map((k) => `<button class="kind" data-k="${k}"><span class="kic">${svg(KINDS[k].icon, g.color, 15, 2.2)}</span><span class="kl">${KINDS[k].label}<em>fo can ${KINDS[k].does}</em></span><span class="n">${COUNTS[k]}</span></button>`).join('') +
      `</div>`;
  }).join('');
  paintNav();
}
function paintNav() {
  const picking = selected.size > 0;
  navEl.classList.toggle('picking', picking);
  navEl.querySelectorAll<HTMLButtonElement>('.kind').forEach((b) => b.classList.toggle('on', picking && selected.has(b.dataset.k as Kind)));
  navEl.querySelectorAll<HTMLButtonElement>('.ghead').forEach((b) => {
    const ks = GROUPS.find((x) => x.id === b.dataset.g)!.kinds.filter((k) => COUNTS[k]);
    b.classList.toggle('on', picking && ks.some((k) => selected.has(k)));
  });
}
function applyFilter() { paintNav(); closeTip(); if (city) refreshStatus(); }
function resetFilter() { if (selected.size) { selected.clear(); applyFilter(); } }
navEl.addEventListener('click', (e) => {
  const kb = (e.target as HTMLElement).closest<HTMLButtonElement>('.kind');
  const gb = (e.target as HTMLElement).closest<HTMLButtonElement>('.ghead');
  if (kb) {
    const k = kb.dataset.k as Kind;
    if (selected.has(k)) selected.delete(k); else selected.add(k);
  } else if (gb) {
    const ks = GROUPS.find((x) => x.id === gb.dataset.g)!.kinds.filter((k) => COUNTS[k]);
    const allIn = ks.every((k) => selected.has(k));
    ks.forEach((k) => (allIn ? selected.delete(k) : selected.add(k)));
  } else return;
  applyFilter();
});
renderNav();
navReady = true;
document.getElementById('showall')!.addEventListener('click', resetFilter);
const morePanel = document.getElementById('morecities')!;
document.getElementById('more')!.addEventListener('click', () => { morePanel.style.display = morePanel.style.display === 'block' ? 'none' : 'block'; });
const side = document.getElementById('side')!;
const toggle = document.getElementById('toggle')!;
function setCollapsed(c: boolean) {
  side.classList.toggle('collapsed', c);
  toggle.innerHTML = svg((c ? Menu : X) as IconNode, '#1d1b19', 18, 2.2);
  toggle.setAttribute('aria-label', c ? 'open menu' : 'close menu');
}
setCollapsed(window.innerWidth < 720);
toggle.addEventListener('click', () => setCollapsed(!side.classList.contains('collapsed')));
// ask-fo panel
const panel = document.getElementById('askpanel')!;
document.getElementById('ask')!.addEventListener('click', () => { panel.style.display = panel.style.display === 'block' ? 'none' : 'block'; });
document.getElementById('askclose')!.addEventListener('click', () => { panel.style.display = 'none'; });
(document.getElementById('asktext') as HTMLAnchorElement).href = smsLink('hey fo, can you find me a quiet cafe near pike place with outlets and check they have a free table?');
(document.getElementById('asksignup') as HTMLAnchorElement).href = SIGNUP_URL;
window.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeTip(); else if (e.key.toLowerCase() === 'r') redraw(); });

// ---- hover / tap ----
const tip = document.getElementById('tip')!;
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let hovered: (typeof city.markers)[number] | null = null;
let lastXY = { x: 0, y: 0 };

function esc(s: string) { return s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!)); }

function pick(clientX: number, clientY: number) {
  pointer.set((clientX / window.innerWidth) * 2 - 1, -(clientY / window.innerHeight) * 2 + 1);
  raycaster.setFromCamera(pointer, camera);
  const sprites = city.markers.filter((m) => m.sprite.visible).map((m) => m.sprite);
  const hit = raycaster.intersectObjects(sprites, false)[0];
  if (hit) return { marker: city.markers.find((m) => m.sprite === hit.object)!, landmark: null };
  const lm = raycaster.intersectObjects(city.landmarkHits.map((h) => h.object), false)[0];
  if (lm && performance.now() - t0 > city.drawTime * 700) return { marker: null, landmark: city.landmarkHits.find((h) => h.object === lm.object)! };
  return null;
}

function showTip(html: string, x: number, y: number) {
  tip.innerHTML = html;
  tip.style.display = 'block';
  const r = tip.getBoundingClientRect();
  let left = x + 16, top = y + 16;
  if (left + r.width > window.innerWidth - 8) left = x - r.width - 16;
  if (top + r.height > window.innerHeight - 8) top = y - r.height - 16;
  tip.style.left = `${Math.max(8, left)}px`;
  tip.style.top = `${Math.max(8, top)}px`;
}

let pinned = false;
let pinnedNow = false;
function closeTip() { pinned = false; tip.style.display = 'none'; }
function updateHover(x: number, y: number, touch: boolean, pin = false) {
  const p = pick(x, y);
  pinnedNow = pin;
  hovered = p?.marker ?? null;
  renderer.domElement.style.cursor = hovered ? 'pointer' : 'grab';
  if (p?.marker) {
    const s = p.marker.shop, st = statusOf(s.hours);
    const k = kindOf(s), g = groupOf(k);
    showTip(
      `<div class="pill" style="background:${g.color}">${svg(KINDS[k].icon, '#f3eee4', 12, 2.4)}${g.label} \u00b7 ${KINDS[k].label}</div>` +
      `<div class="name">${esc(s.name)}</div>` +
      `<div class="st ${st.open ? 'open' : 'closed'}">${st.line}</div>` +
      `<div class="sub">today ${esc(st.today.toLowerCase())}</div>` +
      `<div class="sub">${esc(s.address)} \u00b7 \u2605 ${s.rating} (${s.reviews.toLocaleString()})</div>` +
      (pinnedNow
        ? `<a class="fo" href="${smsLink(askFo(s, k))}">have fo ${KINDS[k].does} \u2192</a>` +
          `<div class="sub new">no fo yet? <a href="${SIGNUP_URL}" target="_blank" rel="noopener">get fo</a> first, it only answers its own people</div>` +
          `<a href="${s.maps}" target="_blank" rel="noopener">google maps \u2197</a>`
        : `<div class="sub hint">${touch ? 'tap' : 'click'} for fo + maps</div>`), x, y);
  } else if (p?.landmark) {
    showTip(`<div class="name">${esc(p.landmark.title)}</div><div class="sub">${esc(p.landmark.note)}</div>`, x, y);
  } else tip.style.display = 'none';
  pinned = pin && !!p?.marker;
}

renderer.domElement.addEventListener('pointermove', (e) => {
  if (e.pointerType !== 'mouse') return;
  lastXY = { x: e.clientX, y: e.clientY };
  if (pinned) { renderer.domElement.style.cursor = pick(e.clientX, e.clientY)?.marker ? 'pointer' : 'grab'; return; }
  updateHover(e.clientX, e.clientY, false);
});
renderer.domElement.addEventListener('pointerleave', () => { if (!pinned) { tip.style.display = 'none'; hovered = null; } });
let downAt = { x: 0, y: 0 };
renderer.domElement.addEventListener('pointerdown', (e) => { downAt = { x: e.clientX, y: e.clientY }; });
renderer.domElement.addEventListener('pointerup', (e) => {
  const moved = Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y) > 6;
  if (moved) return;
  const p = pick(e.clientX, e.clientY);
  if (p?.marker) updateHover(e.clientX, e.clientY, e.pointerType !== 'mouse', true);
  else if (p?.landmark) updateHover(e.clientX, e.clientY, e.pointerType !== 'mouse');
  else { closeTip(); resetFilter(); }
});

// ---- loop ----
const clock = new THREE.Clock();
function tick() {
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = (performance.now() - t0) / 1000;
  city.ink.uniforms.uTime.value = t;
  const alive = t > city.drawTime * 0.55;

  const size = 3.2 / camera.zoom;
  for (const mk of city.markers) {
    mk.sprite.visible = mk.pin.visible = alive && isShown(kindOf(mk.shop));
    const k = mk === hovered ? 1.4 : 1;
    mk.sprite.scale.set(size * k, size * k, 1);
  }
  for (const car of city.cars) {
    car.group.visible = alive;
    if (!alive) continue;
    car.z += car.speed * car.dir * dt;
    if (car.z > BOUNDS.z1 - 1) car.z = BOUNDS.z0 + 1;
    if (car.z < BOUNDS.z0 + 1) car.z = BOUNDS.z1 - 1;
    car.group.position.set(car.x, 0, car.z);
    car.group.rotation.y = car.dir > 0 ? 0 : Math.PI;
  }
  city.ferry.visible = alive;
  if (alive) {
    const zz = Math.sin(t * 0.04) * (BOUNDS.z1 - 12);
    const dir = Math.cos(t * 0.04) > 0 ? 0 : Math.PI;
    city.ferry.position.set(BOUNDS.x0 + 6, 0, zz);
    city.ferry.rotation.y = dir;
  }
  if (hovered && tip.style.display === 'block') { /* keep tooltip fresh while hovering */ }
  void lastXY;

  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}
tick();
