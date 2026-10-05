import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { InkBuilder, makeInkMaterial } from '../ink';
import { makeRng } from '../rng';
import { LANDMARKS, Landmark, SHOPS, Shop } from './data';

export const PAPER = '#f3eee4';
export const INK = '#1d1b19';

// ---- map projection: lat/lng -> world units, rotated so the downtown grid lines up ----
const LAT0 = 47.6075, LNG0 = -122.337;
const ANG = (-32.6 * Math.PI) / 180;         // the avenues run about 32.6 deg west of north
const AX = Math.sin(ANG), AY = Math.cos(ANG); // along an avenue (towards Belltown)
const BX = Math.cos(ANG), BY = -Math.sin(ANG); // across the avenues (uphill, away from the water)
const S = 15;    // meters per unit on the ground
const VS = 7.5;  // meters per unit going up (heights are stretched 2x so the skyline reads)
const UC = 350, WC = 50; // map center in (u, w) meters

export function toUW(lat: number, lng: number) {
  const e = (lng - LNG0) * 75070, n = (lat - LAT0) * 111132;
  return { u: e * AX + n * AY, w: e * BX + n * BY };
}
const uwToXZ = (u: number, w: number) => ({ x: (w - WC) / S, z: -(u - UC) / S });
export function project(lat: number, lng: number) { const { u, w } = toUW(lat, lng); return uwToXZ(u, w); }

const U_MIN = -1150, U_MAX = 1850, W_MIN = -660, W_MAX = 720;
const SHORE_W = -330;
const AVENUES = [-300, -215, -118, -20, 78, 176, 274, 372, 470, 568, 666]; // Alaskan Way, Western, 1st..9th
const STREET_U0 = 90, STREET_STEP = 100;                                   // University St = 90, Union = 190, Pike ~ 290 ...
const AVE_HALF = 9, STREET_HALF = 8;

export const BOUNDS = (() => {
  const a = uwToXZ(U_MIN, W_MIN), b = uwToXZ(U_MAX, W_MAX);
  return { x0: Math.min(a.x, b.x), x1: Math.max(a.x, b.x), z0: Math.min(a.z, b.z), z1: Math.max(a.z, b.z) };
})();

const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

export interface Car { group: THREE.Object3D; x: number; z: number; dir: 1 | -1; speed: number; }
export interface Marker { shop: Shop; sprite: THREE.Sprite; pin: THREE.Line; base: number; }
export interface Hit { object: THREE.Object3D; title: string; note: string; }

export interface Seattle {
  root: THREE.Group;
  ink: THREE.ShaderMaterial;
  drawTime: number;
  cars: Car[];
  ferry: THREE.Object3D;
  markers: Marker[];
  landmarkHits: Hit[];
  dispose: () => void;
}

export function buildSeattle(seed: number, openTex: THREE.Texture, closedTex: THREE.Texture): Seattle {
  const rng = makeRng(seed);
  const root = new THREE.Group();
  const ink = new InkBuilder(rng.next);
  const paper = new THREE.MeshBasicMaterial({ color: PAPER, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });
  const disposables: { dispose: () => void }[] = [paper];
  const solidGeos: THREE.BufferGeometry[] = [];

  const core = uwToXZ(-150, 200);
  const delayAt = (x: number, z: number) => Math.hypot(x - core.x, z - core.z) * 0.032 + rng.range(0, 0.25);

  const addSolid = (geo: THREE.BufferGeometry, pos: THREE.Vector3, rotY = 0) => {
    const m = new THREE.Matrix4().makeRotationY(rotY).setPosition(pos);
    let g = geo.index ? geo.toNonIndexed() : geo.clone();
    geo.dispose();
    g.applyMatrix4(m);
    g.deleteAttribute('uv');
    g.deleteAttribute('normal');
    solidGeos.push(g);
  };

  // ---------- ground, border, shoreline, water ----------
  const { x0, x1, z0, z1 } = BOUNDS;
  const corners = [v(x0, 0, z0), v(x1, 0, z0), v(x1, 0, z1), v(x0, 0, z1)];
  for (let i = 0; i < 4; i++) ink.sketch(corners[i], corners[(i + 1) % 4], 0, 1.2);
  const ground = new THREE.PlaneGeometry(x1 - x0, z1 - z0);
  ground.rotateX(-Math.PI / 2);
  addSolid(ground, v((x0 + x1) / 2, 0, (z0 + z1) / 2));

  const shoreX = (SHORE_W - WC) / S;
  ink.sketch(v(shoreX, 0, z0), v(shoreX, 0, z1), 0.2, 0.4);
  ink.sketch(v(shoreX - 0.35, 0, z0), v(shoreX - 0.35, 0, z1), 0.4, 0.4);
  // little waves
  for (let n = 0; n < 380; n++) {
    const wx = rng.range(x0 + 1, shoreX - 1.2), wz = rng.range(z0 + 1, z1 - 1);
    const L = rng.range(0.5, 1.1), d = delayAt(wx, wz) * 0.8 + 0.3;
    ink.line(v(wx, 0.01, wz), v(wx + 0.18, 0.01, wz + L / 2), d);
    ink.line(v(wx + 0.18, 0.01, wz + L / 2), v(wx, 0.01, wz + L), d + 0.05);
  }

  // ---------- piers ----------
  const pierAt = (u: number, wEnd: number, delay: number) => {
    const a = uwToXZ(u - 15, SHORE_W), b = uwToXZ(u + 15, wEnd);
    const px0 = Math.min(a.x, b.x), px1 = Math.max(a.x, b.x), pz0 = Math.min(a.z, b.z), pz1 = Math.max(a.z, b.z);
    const h = 0.25;
    const g = new THREE.BoxGeometry(px1 - px0, h, pz1 - pz0);
    addSolid(g, v((px0 + px1) / 2, h / 2, (pz0 + pz1) / 2));
    const top = [v(px0, h, pz0), v(px1, h, pz0), v(px1, h, pz1), v(px0, h, pz1)];
    ink.loop(top, delay, 0.05);
    // piles
    for (let px = px0 + 0.5; px < px1; px += 1.0) { ink.line(v(px, 0, pz0), v(px, h, pz0), delay + 0.2); ink.line(v(px, 0, pz1), v(px, h, pz1), delay + 0.2); }
    return { px0, px1, pz0, pz1, h };
  };
  const wheel = LANDMARKS.find((l) => l.kind === 'wheel')!;
  const wheelUW = toUW(wheel.lat, wheel.lng);
  for (const pu of [-420, -250, wheelUW.u, 270, 480, 700]) {
    const p = pierAt(pu, pu === wheelUW.u ? -485 : -440, delayAt(shoreX, -(pu - UC) / S) + 0.4);
    if (pu !== wheelUW.u) addBox((p.px0 + p.px1) / 2 - 0.4, p.h, (p.pz0 + p.pz1) / 2, (p.px1 - p.px0) * 0.6, 1.3, (p.pz1 - p.pz0) * 0.7, delayAt(p.px0, p.pz0) + 0.6, false);
  }

  // ---------- streets ----------
  for (const aw of AVENUES) {
    const ax = (aw - WC) / S;
    for (const s of [-1, 1]) {
      const lx = ax + (s * (aw === -300 ? 15 : AVE_HALF)) / S;
      for (let t = z0 + 1; t < z1 - 1; t += 4.5) ink.line(v(lx, 0, t), v(lx, 0, Math.min(t + 3.8, z1 - 1)), delayAt(lx, t) * 0.7);
    }
  }

  // ---------- buildings ----------
  function addBox(x: number, y: number, z: number, w: number, h: number, d: number, delay: number, floors: boolean) {
    addSolid(new THREE.BoxGeometry(w, h, d), v(x, y + h / 2, z));
    const bx0 = x - w / 2, bx1 = x + w / 2, bz0 = z - d / 2, bz1 = z + d / 2, y1 = y + h;
    const base = [v(bx0, y, bz0), v(bx1, y, bz0), v(bx1, y, bz1), v(bx0, y, bz1)];
    const top = base.map((p) => v(p.x, y1, p.z));
    base.forEach((p, i) => ink.sketch(p, top[i], delay + i * 0.05, 0.2));
    for (let i = 0; i < 4; i++) ink.sketch(top[i], top[(i + 1) % 4], delay + 0.35 + i * 0.05, 0.15);
    for (let i = 0; i < 4; i++) ink.line(base[i], base[(i + 1) % 4], delay);
    if (floors && h > 1.5) {
      const floorH = rng.range(1.4, 2.2);
      for (let fy = y + floorH; fy < y1 - 0.5; fy += floorH) ink.loop(base.map((p) => v(p.x, fy, p.z)), delay + 0.2 + (fy - y) * 0.02, 0.03);
      if (h > 9 && rng.chance(0.55)) {
        const gap = rng.range(0.6, 1.0);
        for (let wx = bx0 + gap; wx < bx1 - 0.2; wx += gap) {
          ink.line(v(wx, y + floorH, bz1), v(wx, y1 - 0.3, bz1), delay + 0.6);
          ink.line(v(wx, y + floorH, bz0), v(wx, y1 - 0.3, bz0), delay + 0.6);
        }
        for (let wz = bz0 + gap; wz < bz1 - 0.2; wz += gap) {
          ink.line(v(bx1, y + floorH, wz), v(bx1, y1 - 0.3, wz), delay + 0.6);
          ink.line(v(bx0, y + floorH, wz), v(bx0, y1 - 0.3, wz), delay + 0.6);
        }
      }
    }
  }

  function addPyramid(x: number, y: number, z: number, w: number, d: number, h: number, delay: number) {
    const c = new THREE.ConeGeometry(Math.SQRT1_2, 1, 4);
    c.rotateY(Math.PI / 4);
    c.scale(w, h, d);
    addSolid(c, v(x, y + h / 2, z));
    const apex = v(x, y + h, z);
    for (const [cx, cz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) ink.sketch(v(x + (cx * w) / 2, y, z + (cz * d) / 2), apex, delay, 0.1);
  }

  function addTree(x: number, z: number, delay: number) {
    const h = rng.range(0.8, 1.3), r = rng.range(0.45, 0.75);
    ink.line(v(x, 0, z), v(x, h, z), delay);
    const g = new THREE.IcosahedronGeometry(r, 0);
    const rot = new THREE.Euler(rng.range(0, 3), rng.range(0, 3), 0);
    const mtx = new THREE.Matrix4().makeRotationFromEuler(rot).setPosition(x, h + r * 0.7, z);
    const edges = new THREE.EdgesGeometry(g);
    const p = edges.getAttribute('position');
    for (let i = 0; i < p.count; i += 2) {
      const a = v(p.getX(i), p.getY(i), p.getZ(i)).applyMatrix4(mtx);
      const b = v(p.getX(i + 1), p.getY(i + 1), p.getZ(i + 1)).applyMatrix4(mtx);
      ink.line(a, b, delay + 0.25 + i * 0.004);
    }
    edges.dispose();
    const gg = g.toNonIndexed(); g.dispose();
    gg.applyMatrix4(mtx); gg.deleteAttribute('uv'); gg.deleteAttribute('normal');
    solidGeos.push(gg);
  }

  const lmUW = LANDMARKS.map((l) => ({ l, ...toUW(l.lat, l.lng) }));
  const needle = lmUW.find((x) => x.l.kind === 'needle')!;
  const nearLandmark = (u: number, w: number, pad = 22) => lmUW.some((x) => x.l.kind !== 'wheel' && Math.hypot(x.u - u, x.w - w) < x.l.size / 2 + pad);

  function heightAt(u: number, w: number) {
    if (Math.hypot(u - needle.u, w - needle.w) < 330) return -1; // Seattle Center: park
    if (u < -640) return rng.range(16, 34) * (rng.chance(0.1) ? 1.8 : 1);       // Pioneer Square, low brick
    if (w < -160) return rng.range(12, 30);                                       // waterfront and the market
    if (u > 1250) return rng.range(12, 40);
    const d = Math.hypot(u + 150, (w - 200) * 1.2);
    let h = 26 + 150 * Math.exp(-((d / 520) ** 2));
    if (u > 430) h = 30 + rng.next() * 55 + (rng.chance(0.12) ? 70 : 0);        // Belltown, mid-rise towers
    return h * rng.range(0.45, 1.15) * (rng.chance(0.08) ? 1.5 : 1);
  }

  for (let ci = 0; ci < AVENUES.length; ci++) {
    const wa = ci === 0 ? SHORE_W + 10 : AVENUES[ci - 1] + (ci - 1 === 0 ? 15 : AVE_HALF);
    const wb = AVENUES[ci] - (ci === 0 ? 15 : AVE_HALF);
    if (ci === 0) continue; // Alaskan Way itself is the waterfront promenade
    for (let su = Math.ceil((U_MIN - STREET_U0) / STREET_STEP) * STREET_STEP + STREET_U0; su < U_MAX; su += STREET_STEP) {
      const ua = su + STREET_HALF, ub = su + STREET_STEP - STREET_HALF;
      if (ub > U_MAX - 10 || ua < U_MIN + 10) continue;
      const cu = (ua + ub) / 2, cw = (wa + wb) / 2;
      const cxz = uwToXZ(cu, cw);
      const d0 = delayAt(cxz.x, cxz.z);
      const p0 = uwToXZ(ua, wa), p1 = uwToXZ(ub, wb);
      const bx0 = Math.min(p0.x, p1.x), bx1 = Math.max(p0.x, p1.x), bz0 = Math.min(p0.z, p1.z), bz1 = Math.max(p0.z, p1.z);
      const curb = [v(bx0, 0, bz0), v(bx1, 0, bz0), v(bx1, 0, bz1), v(bx0, 0, bz1)];
      for (let i = 0; i < 4; i++) ink.sketch(curb[i], curb[(i + 1) % 4], d0 * 0.6, 0.3);
      const probe = heightAt(cu, cw);
      if (probe < 0) {
        if (Math.hypot(cu - needle.u, cw - needle.w) > 60) for (let t = 0; t < 4; t++) addTree(rng.range(bx0 + 0.6, bx1 - 0.6), rng.range(bz0 + 0.6, bz1 - 0.6), d0 + 0.2 + t * 0.1);
        continue;
      }
      const inset = 0.3, lw = (bx1 - bx0 - inset * 2) / 2, ld = (bz1 - bz0 - inset * 2) / 2;
      for (let li = 0; li < 2; li++) for (let lj = 0; lj < 2; lj++) {
        const lx = bx0 + inset + li * lw + lw / 2, lz = bz0 + inset + lj * ld + ld / 2;
        const lu = UC - lz * S, lwm = WC + lx * S;
        if (nearLandmark(lu, lwm)) continue;
        const hm = heightAt(lu, lwm);
        if (hm < 0) continue;
        const h = hm / VS;
        const w = rng.range(lw * 0.62, lw * 0.92), d = rng.range(ld * 0.62, ld * 0.92);
        const delay = delayAt(lx, lz) + 0.3;
        addBox(lx, 0, lz, w, h, d, delay, true);
        if (h > 12 && rng.chance(0.45)) addBox(lx, h, lz, w * 0.62, rng.range(1.5, 4), d * 0.62, delay + 0.8, true);
        else if (rng.chance(0.4)) addBox(lx + rng.range(-w / 4, w / 4), h, lz + rng.range(-d / 4, d / 4), rng.range(0.3, 0.7), rng.range(0.3, 0.6), rng.range(0.3, 0.7), delay + 0.9, false);
      }
    }
  }

  // ---------- landmarks ----------
  const landmarkHits: Hit[] = [];
  const hitMat = new THREE.MeshBasicMaterial({ visible: false });
  disposables.push(hitMat);
  const addHit = (l: Landmark, x: number, z: number, w: number, h: number, d: number) => {
    const g = new THREE.BoxGeometry(w, h, d);
    disposables.push(g);
    const m = new THREE.Mesh(g, hitMat);
    m.position.set(x, h / 2, z);
    root.add(m);
    landmarkHits.push({ object: m, title: l.name, note: l.note });
  };

  for (const { l, u, w } of lmUW) {
    const { x, z } = uwToXZ(u, w);
    const s = l.size / S, H = l.height / VS, dl = delayAt(x, z) + 0.2;
    switch (l.kind) {
      case 'box':
        addBox(x, 0, z, s, H, s * 0.85, dl, true);
        addBox(x, H, z, s * 0.4, 0.8, s * 0.35, dl + 1.0, false);
        break;
      case 'stepped':
        addBox(x, 0, z, s, H * 0.62, s, dl, true);
        addBox(x, H * 0.62, z, s * 0.8, H * 0.22, s * 0.8, dl + 0.8, true);
        addBox(x, H * 0.84, z, s * 0.58, H * 0.16, s * 0.58, dl + 1.2, true);
        break;
      case 'flare':
        addBox(x, 0, z, s * 0.62, H * 0.1, s * 0.62, dl, true);
        addBox(x, H * 0.1, z, s * 0.8, H * 0.1, s * 0.8, dl + 0.3, true);
        addBox(x, H * 0.2, z, s, H * 0.8, s * 0.9, dl + 0.6, true);
        break;
      case 'gable':
        addBox(x, 0, z, s, H * 0.84, s * 0.8, dl, true);
        addPyramid(x, H * 0.84, z, s, s * 0.8, H * 0.16, dl + 1.1);
        break;
      case 'notched':
        addBox(x, 0, z, s * 0.9, H * 0.88, s, dl, true);
        addBox(x, H * 0.88, z, s * 0.55, H * 0.12, s * 0.7, dl + 1.0, true);
        break;
      case 'pyramid':
        addBox(x, 0, z, s, H * 0.7, s, dl, true);
        addBox(x, H * 0.7, z, s * 0.62, H * 0.1, s * 0.62, dl + 0.8, true);
        addPyramid(x, H * 0.8, z, s * 0.62, s * 0.62, H * 0.2, dl + 1.1);
        ink.line(v(x, H, z), v(x, H + 1.2, z), dl + 1.4);
        break;
      case 'market':
        addBox(x, 0, z, 1.8, H, 7, dl, true);
        addPyramid(x, H, z, 1.8, 7, 0.8, dl + 0.5);
        // the clock and sign post on the corner
        ink.line(v(x + 1.2, 0, z + 3.2), v(x + 1.2, 3.2, z + 3.2), dl + 0.7);
        ink.loop([v(x + 1.2, 3.2, z + 2.2), v(x + 1.2, 3.2, z + 4.2), v(x + 1.2, 3.9, z + 4.2), v(x + 1.2, 3.9, z + 2.2)], dl + 0.8, 0.05);
        break;
      case 'needle': buildNeedle(x, z, H, dl); break;
      case 'wheel': buildWheel(x, z, dl); break;
    }
    const hw = l.kind === 'market' ? 2.2 : l.kind === 'wheel' ? 2.5 : l.kind === 'needle' ? 4.5 : s;
    const hd = l.kind === 'market' ? 7 : l.kind === 'wheel' ? 7.5 : l.kind === 'needle' ? 4.5 : s;
    const hh = l.kind === 'market' ? H + 1 : l.kind === 'wheel' ? 7.5 : H;
    addHit(l, x, z, hw, hh, hd);
  }

  function ring(cx: number, y: number, cz: number, r: number, n: number, delay: number) {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; pts.push(v(cx + Math.cos(a) * r, y, cz + Math.sin(a) * r)); }
    ink.loop(pts, delay, 0.02);
  }

  function buildNeedle(x: number, z: number, H: number, dl: number) {
    const prof: [number, number][] = [[0.9, 0.72], [1.35, 0.735], [2.35, 0.765], [2.3, 0.79], [1.65, 0.8], [1.2, 0.83], [0.55, 0.85], [0.15, 0.87]];
    const lathe = new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(r, y * H)), 24);
    addSolid(lathe, v(x, 0, z));
    addSolid(new THREE.CylinderGeometry(0.3, 0.3, 0.72 * H, 10), v(x, 0.36 * H, z));
    prof.forEach(([r, y], i) => ring(x, y * H, z, r, 20, dl + 1.2 + i * 0.08));
    for (let k = 0; k < 10; k++) {
      const a = (k / 10) * Math.PI * 2;
      for (let i = 0; i < prof.length - 1; i++) {
        const [r0, y0] = prof[i], [r1, y1] = prof[i + 1];
        ink.line(v(x + Math.cos(a) * r0, y0 * H, z + Math.sin(a) * r0), v(x + Math.cos(a) * r1, y1 * H, z + Math.sin(a) * r1), dl + 1.6);
      }
    }
    ink.line(v(x - 0.3, 0, z), v(x - 0.3, 0.72 * H, z), dl);
    ink.line(v(x + 0.3, 0, z), v(x + 0.3, 0.72 * H, z), dl);
    ink.line(v(x, 0.87 * H, z), v(x, H, z), dl + 2.0);
    for (let k = 0; k < 3; k++) {
      const a = (k / 3) * Math.PI * 2 + 0.3;
      for (const off of [-0.2, 0.2]) {
        const b = v(x + Math.cos(a + off) * 2.1, 0, z + Math.sin(a + off) * 2.1);
        const waist = v(x + Math.cos(a) * 0.5, 0.42 * H, z + Math.sin(a) * 0.5);
        const top = v(x + Math.cos(a + off * 0.6) * 0.95, 0.72 * H, z + Math.sin(a + off * 0.6) * 0.95);
        ink.sketch(b, waist, dl + 0.2, 0.1);
        ink.sketch(waist, top, dl + 0.6, 0.1);
      }
    }
    ring(x, 0.42 * H, z, 0.55, 12, dl + 0.7);
    ring(x, 0.2 * H, z, 1.25, 12, dl + 0.5);
  }

  function buildWheel(x: number, z: number, dl: number) {
    const R = 3.3, cy = R + 0.7, n = 28;
    for (const dx of [-0.22, 0.22]) {
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; pts.push(v(x + dx, cy + Math.sin(a) * R, z + Math.cos(a) * R)); }
      ink.loop(pts, dl + 0.4, 0.03);
    }
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2;
      ink.line(v(x, cy, z), v(x, cy + Math.sin(a) * R, z + Math.cos(a) * R), dl + 0.9 + i * 0.03);
      const g = v(x, cy + Math.sin(a) * (R + 0.35), z + Math.cos(a) * (R + 0.35));
      ink.loop([v(g.x - 0.2, g.y - 0.2, g.z - 0.2), v(g.x + 0.2, g.y - 0.2, g.z - 0.2), v(g.x + 0.2, g.y - 0.2, g.z + 0.2), v(g.x - 0.2, g.y - 0.2, g.z + 0.2)], dl + 1.3, 0.02);
    }
    for (const dx of [-0.9, 0.9]) for (const dz of [-1.6, 1.6]) ink.sketch(v(x + dx, 0.25, z + dz), v(x, cy, z), dl, 0.1);
  }

  // ---------- merge all paper solids into one mesh ----------
  const merged = mergeGeometries(solidGeos, false);
  solidGeos.forEach((g) => g.dispose());
  const solids = new THREE.Mesh(merged, paper);
  root.add(solids);
  disposables.push(merged);

  const inkMat = makeInkMaterial(INK);
  const lines = ink.build(inkMat);
  root.add(lines);
  disposables.push(lines.geometry, inkMat);
  const drawTime = ink.maxDelay + 0.6;

  // ---------- coffee markers ----------
  const pinMat = new THREE.LineBasicMaterial({ color: INK, depthTest: false, transparent: true, opacity: 0.75 });
  disposables.push(pinMat);
  const markers: Marker[] = SHOPS.map((shop, i) => {
    const { x, z } = project(shop.lat, shop.lng);
    const hgt = 3 + (i % 4) * 1.3;
    const sm = new THREE.SpriteMaterial({ map: openTex, depthTest: false, depthWrite: false, transparent: true });
    disposables.push(sm);
    const sprite = new THREE.Sprite(sm);
    sprite.position.set(x, hgt, z);
    sprite.renderOrder = 20;
    sprite.visible = false;
    root.add(sprite);
    const pg = new THREE.BufferGeometry().setFromPoints([v(x, 0, z), v(x, hgt, z)]);
    disposables.push(pg);
    const pin = new THREE.Line(pg, pinMat);
    pin.renderOrder = 19;
    pin.visible = false;
    root.add(pin);
    return { shop, sprite, pin, base: 1 };
  });
  void closedTex;

  // ---------- traffic on the avenues, a ferry on the bay ----------
  const outline = new THREE.LineBasicMaterial({ color: INK });
  disposables.push(outline);
  const makeVehicle = (len: number, wid: number, hh: number, cabin: number) => {
    const g = new THREE.Group();
    const bg = new THREE.BoxGeometry(wid, hh, len), cg = new THREE.BoxGeometry(wid * 0.85, hh * 0.7, len * cabin);
    disposables.push(bg, cg);
    const b = new THREE.Mesh(bg, paper); b.position.y = hh / 2 + 0.1;
    const c = new THREE.Mesh(cg, paper); c.position.set(0, hh + 0.1 + (hh * 0.7) / 2, -len * 0.08);
    const be = new THREE.LineSegments(new THREE.EdgesGeometry(bg), outline); be.position.copy(b.position);
    const ce = new THREE.LineSegments(new THREE.EdgesGeometry(cg), outline); ce.position.copy(c.position);
    disposables.push(be.geometry, ce.geometry);
    g.add(b, c, be, ce);
    g.visible = false;
    root.add(g);
    return g;
  };
  const cars: Car[] = [];
  for (let n = 0; n < 18; n++) {
    const ave = AVENUES[rng.int(1, AVENUES.length - 1)];
    const dir = rng.chance(0.5) ? 1 : -1;
    cars.push({ group: makeVehicle(1.3, 0.65, 0.45, 0.5), x: (ave - WC) / S + dir * 0.28, z: rng.range(z0, z1), dir, speed: rng.range(3, 6) });
  }
  const ferry = makeVehicle(5, 1.7, 0.7, 0.6);
  ferry.position.set(x0 + 5, 0, 0);

  return {
    root, ink: inkMat, drawTime, cars, ferry, markers, landmarkHits,
    dispose: () => disposables.forEach((d) => d.dispose()),
  };
}
