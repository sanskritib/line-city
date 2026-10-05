import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { buildSeattle, Seattle, PAPER, BOUNDS } from './scene';
import { statusOf } from './hours';
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

// ---- marker icons: a little coffee cup in a badge ----
function cupTexture(open: boolean) {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d')!;
  g.lineWidth = 7; g.lineJoin = 'round'; g.lineCap = 'round';
  g.beginPath(); g.arc(64, 64, 56, 0, Math.PI * 2);
  g.fillStyle = open ? '#d9603b' : '#f3eee4'; g.fill();
  g.strokeStyle = '#1d1b19'; g.stroke();
  const ink = open ? '#f3eee4' : '#1d1b19';
  g.strokeStyle = ink;
  // cup
  g.beginPath(); g.moveTo(36, 54); g.lineTo(42, 90); g.lineTo(78, 90); g.lineTo(84, 54); g.closePath(); g.stroke();
  // handle
  g.beginPath(); g.arc(88, 68, 9, -Math.PI / 2, Math.PI / 2); g.stroke();
  // steam
  for (const sx of [50, 62, 74]) { g.beginPath(); g.moveTo(sx, 44); g.quadraticCurveTo(sx - 6, 36, sx, 30); g.quadraticCurveTo(sx + 6, 24, sx, 18); g.stroke(); }
  if (!open) { g.globalAlpha = 0.35; g.fillStyle = '#f3eee4'; g.beginPath(); g.arc(64, 64, 54, 0, Math.PI * 2); g.fill(); }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}
const openTex = cupTexture(true);
const closedTex = cupTexture(false);

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
  let open = 0;
  for (const mk of city.markers) {
    const s = statusOf(mk.shop.hours);
    if (s.open) open++;
    const mat = mk.sprite.material as THREE.SpriteMaterial;
    const want = s.open ? openTex : closedTex;
    if (mat.map !== want) { mat.map = want; mat.needsUpdate = true; }
  }
  countEl.textContent = `${open} of ${SHOPS.length} coffee spots open right now`;
}
redraw();
setInterval(refreshStatus, 30_000);
document.getElementById('redraw')!.addEventListener('click', redraw);
window.addEventListener('keydown', (e) => { if (e.key.toLowerCase() === 'r') redraw(); });

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

function updateHover(x: number, y: number, touch: boolean) {
  const p = pick(x, y);
  hovered = p?.marker ?? null;
  renderer.domElement.style.cursor = hovered ? 'pointer' : 'grab';
  if (p?.marker) {
    const s = p.marker.shop, st = statusOf(s.hours);
    showTip(
      `<div class="name">${esc(s.name)}</div>` +
      `<div class="st ${st.open ? 'open' : 'closed'}">${st.line}</div>` +
      `<div class="sub">today ${esc(st.today.toLowerCase())}</div>` +
      `<div class="sub">${esc(s.address)} \u00b7 \u2605 ${s.rating} (${s.reviews.toLocaleString()})</div>` +
      `<a href="${s.maps}" target="_blank" rel="noopener">${touch ? 'open in google maps \u2197' : 'click for google maps \u2197'}</a>`, x, y);
  } else if (p?.landmark) {
    showTip(`<div class="name">${esc(p.landmark.title)}</div><div class="sub">${esc(p.landmark.note)}</div>`, x, y);
  } else tip.style.display = 'none';
}

renderer.domElement.addEventListener('pointermove', (e) => {
  if (e.pointerType !== 'mouse') return;
  lastXY = { x: e.clientX, y: e.clientY };
  updateHover(e.clientX, e.clientY, false);
});
renderer.domElement.addEventListener('pointerleave', () => { tip.style.display = 'none'; hovered = null; });
let downAt = { x: 0, y: 0 };
renderer.domElement.addEventListener('pointerdown', (e) => { downAt = { x: e.clientX, y: e.clientY }; });
renderer.domElement.addEventListener('pointerup', (e) => {
  const moved = Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y) > 6;
  if (moved) return;
  if (e.pointerType === 'mouse') { if (hovered) window.open(hovered.shop.maps, '_blank', 'noopener'); }
  else updateHover(e.clientX, e.clientY, true);
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
    mk.sprite.visible = mk.pin.visible = alive;
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
  void lastXY;

  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}
tick();
