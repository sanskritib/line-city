import * as THREE from 'three';
import { InkBuilder, makeInkMaterial } from './ink';
import { makeRng, Rng } from './rng';

export const PAPER = '#f3eee4';
export const INK = '#1d1b19';

// City layout (world units)
const BLOCKS = 5;        // blocks per side
const BLOCK = 16;        // block size
const STREET = 6;        // street width
const SIDEWALK = 1.6;    // sidewalk band inside each block
export const EXTENT = BLOCKS * BLOCK + (BLOCKS + 1) * STREET;
const HALF = EXTENT / 2;

const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

export interface Walker { mesh: THREE.Object3D; x0: number; z0: number; w: number; d: number; s: number; speed: number; phase: number; }
export interface Car { group: THREE.Object3D; axis: 'x' | 'z'; dir: 1 | -1; lane: number; t: number; speed: number; }

export interface City {
  root: THREE.Group;
  ink: THREE.ShaderMaterial;
  drawTime: number;   // seconds until the last stroke is done
  walkers: Walker[];
  cars: Car[];
  dispose: () => void;
}

/** Paper-colored solid that hides lines behind it (that's what makes it read as a drawing, not a wireframe). */
function paperMaterial() {
  return new THREE.MeshBasicMaterial({ color: PAPER, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });
}

function blockOrigin(i: number) { return -HALF + STREET + i * (BLOCK + STREET); }

export function buildCity(seed: number): City {
  const rng: Rng = makeRng(seed);
  const root = new THREE.Group();
  const ink = new InkBuilder(rng.next);
  const paper = paperMaterial();
  const disposables: { dispose: () => void }[] = [paper];

  // Draw order: start at the center and spread outwards, bottom to top.
  const delayAt = (x: number, z: number) => Math.hypot(x, z) * 0.045 + rng.range(0, 0.25);

  // Ground (paper) + the outer border
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(EXTENT, EXTENT), paper);
  ground.rotation.x = -Math.PI / 2;
  root.add(ground);
  disposables.push(ground.geometry);
  const c = [v(-HALF, 0, -HALF), v(HALF, 0, -HALF), v(HALF, 0, HALF), v(-HALF, 0, HALF)];
  for (let i = 0; i < 4; i++) ink.sketch(c[i], c[(i + 1) % 4], 0, 1.2);

  // Dashed center lines down every street
  for (let k = 0; k <= BLOCKS; k++) {
    const s = -HALF + STREET / 2 + k * (BLOCK + STREET);
    for (let t = -HALF + 1; t < HALF - 1; t += 3) {
      ink.line(v(t, 0.01, s), v(t + 1.4, 0.01, s), 0.4 + Math.abs(t) * 0.02);
      ink.line(v(s, 0.01, t), v(s, 0.01, t + 1.4), 0.4 + Math.abs(t) * 0.02);
    }
  }

  const solids: THREE.Mesh[] = [];
  const addBox = (x: number, y: number, z: number, w: number, h: number, d: number, delay: number, floors: boolean) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), paper);
    m.position.set(x, y + h / 2, z);
    solids.push(m);
    const x0 = x - w / 2, x1 = x + w / 2, z0 = z - d / 2, z1 = z + d / 2, y1 = y + h;
    const base = [v(x0, y, z0), v(x1, y, z0), v(x1, y, z1), v(x0, y, z1)];
    const top = base.map((p) => v(p.x, y1, p.z));
    // verticals first (pen goes up), then the roof outline
    base.forEach((p, i) => ink.sketch(p, top[i], delay + i * 0.05));
    for (let i = 0; i < 4; i++) ink.sketch(top[i], top[(i + 1) % 4], delay + 0.35 + i * 0.05, 0.25);
    for (let i = 0; i < 4; i++) ink.line(base[i], base[(i + 1) % 4], delay);
    if (floors) {
      const floorH = rng.range(1.6, 2.4);
      for (let fy = y + floorH; fy < y1 - 0.6; fy += floorH) {
        const ring = base.map((p) => v(p.x, fy, p.z));
        ink.loop(ring, delay + 0.2 + (fy - y) * 0.03, 0.03);
      }
      // window mullions on taller buildings
      if (h > 9 && rng.chance(0.6)) {
        const gap = rng.range(1.0, 1.6);
        for (let wx = x0 + gap; wx < x1 - 0.3; wx += gap) {
          ink.line(v(wx, y + floorH, z1), v(wx, y1 - 0.4, z1), delay + 0.6);
          ink.line(v(wx, y + floorH, z0), v(wx, y1 - 0.4, z0), delay + 0.6);
        }
        for (let wz = z0 + gap; wz < z1 - 0.3; wz += gap) {
          ink.line(v(x1, y + floorH, wz), v(x1, y1 - 0.4, wz), delay + 0.6);
          ink.line(v(x0, y + floorH, wz), v(x0, y1 - 0.4, wz), delay + 0.6);
        }
      }
    }
  };

  const addTree = (x: number, z: number, delay: number) => {
    const h = rng.range(1.6, 2.6);
    const r = rng.range(0.8, 1.3);
    ink.line(v(x, 0, z), v(x, h, z), delay);
    const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 0), paper);
    crown.position.set(x, h + r * 0.7, z);
    crown.rotation.set(rng.range(0, 3), rng.range(0, 3), 0);
    solids.push(crown);
    crown.updateMatrix();
    const edges = new THREE.EdgesGeometry(crown.geometry);
    const p = edges.getAttribute('position');
    for (let i = 0; i < p.count; i += 2) {
      const a = v(p.getX(i), p.getY(i), p.getZ(i)).applyMatrix4(crown.matrix);
      const b = v(p.getX(i + 1), p.getY(i + 1), p.getZ(i + 1)).applyMatrix4(crown.matrix);
      ink.line(a, b, delay + 0.25 + i * 0.004);
    }
    edges.dispose();
  };

  const parks: { x0: number; z0: number }[] = [];

  for (let bi = 0; bi < BLOCKS; bi++) {
    for (let bj = 0; bj < BLOCKS; bj++) {
      const x0 = blockOrigin(bi), z0 = blockOrigin(bj);
      const cx = x0 + BLOCK / 2, cz = z0 + BLOCK / 2;
      const d0 = delayAt(cx, cz);
      // curb outline
      const curb = [v(x0, 0, z0), v(x0 + BLOCK, 0, z0), v(x0 + BLOCK, 0, z0 + BLOCK), v(x0, 0, z0 + BLOCK)];
      for (let i = 0; i < 4; i++) ink.sketch(curb[i], curb[(i + 1) % 4], d0 * 0.6, 0.6);

      const isPark = rng.chance(0.12);
      const inner = BLOCK - SIDEWALK * 2;
      const ix = x0 + SIDEWALK, iz = z0 + SIDEWALK;
      if (isPark) {
        parks.push({ x0, z0 });
        const pc = [v(ix, 0, iz), v(ix + inner, 0, iz), v(ix + inner, 0, iz + inner), v(ix, 0, iz + inner)];
        ink.loop(pc, d0, 0.05);
        // a winding path
        ink.line(v(ix, 0, iz + inner / 2), v(ix + inner, 0, iz + inner / 2), d0 + 0.3);
        ink.line(v(ix + inner / 2, 0, iz), v(ix + inner / 2, 0, iz + inner), d0 + 0.3);
        for (let t = 0; t < 9; t++) addTree(ix + rng.range(1, inner - 1), iz + rng.range(1, inner - 1), d0 + 0.2 + t * 0.08);
        continue;
      }

      // 2x2 lots per block; taller toward the center of the city
      const lot = inner / 2;
      const centerPull = 1 - Math.min(1, Math.hypot(cx, cz) / HALF);
      for (let li = 0; li < 2; li++) {
        for (let lj = 0; lj < 2; lj++) {
          const lx = ix + li * lot + lot / 2, lz = iz + lj * lot + lot / 2;
          const w = rng.range(lot * 0.6, lot * 0.9), d = rng.range(lot * 0.6, lot * 0.9);
          const h = 2.5 + rng.next() * (4 + centerPull * 22) * (rng.chance(0.15) ? 1.6 : 1);
          const delay = delayAt(lx, lz) + 0.3;
          addBox(lx, 0, lz, w, h, d, delay, true);
          // setback tower on top of some tall ones
          if (h > 12 && rng.chance(0.5)) {
            addBox(lx, h, lz, w * 0.6, rng.range(3, 8), d * 0.6, delay + 0.8, true);
          } else if (rng.chance(0.5)) {
            // rooftop box (AC unit / stair tower)
            addBox(lx + rng.range(-w / 4, w / 4), h, lz + rng.range(-d / 4, d / 4), rng.range(0.6, 1.4), rng.range(0.5, 1.2), rng.range(0.6, 1.4), delay + 0.9, false);
          }
        }
      }
      // street trees on the sidewalk
      for (let t = 0; t < 4; t++) {
        if (!rng.chance(0.5)) continue;
        const side = rng.int(0, 3), along = rng.range(2, BLOCK - 2), o = SIDEWALK / 2;
        const tx = side === 0 ? x0 + along : side === 1 ? x0 + BLOCK - o : side === 2 ? x0 + along : x0 + o;
        const tz = side === 0 ? z0 + o : side === 1 ? z0 + along : side === 2 ? z0 + BLOCK - o : z0 + along;
        addTree(tx, tz, d0 + 1.0);
      }
    }
  }
  solids.forEach((m) => { root.add(m); disposables.push(m.geometry); });

  const inkMat = makeInkMaterial(INK);
  const lines = ink.build(inkMat);
  root.add(lines);
  disposables.push(lines.geometry, inkMat);
  const drawTime = ink.maxDelay + 0.6;

  // ---- people: little ink figures walking around the blocks ----
  const figMat = new THREE.MeshBasicMaterial({ color: INK });
  const bodyGeo = new THREE.CylinderGeometry(0.16, 0.2, 0.75, 6);
  const headGeo = new THREE.SphereGeometry(0.16, 8, 6);
  disposables.push(figMat, bodyGeo, headGeo);
  const walkers: Walker[] = [];
  for (let n = 0; n < 90; n++) {
    const bi = rng.int(0, BLOCKS - 1), bj = rng.int(0, BLOCKS - 1);
    const fig = new THREE.Group();
    const body = new THREE.Mesh(bodyGeo, figMat); body.position.y = 0.38;
    const head = new THREE.Mesh(headGeo, figMat); head.position.y = 0.92;
    fig.add(body, head);
    fig.visible = false;
    root.add(fig);
    const inset = rng.chance(0.5) ? 0.55 : SIDEWALK - 0.5;
    walkers.push({
      mesh: fig,
      x0: blockOrigin(bi) + inset, z0: blockOrigin(bj) + inset,
      w: BLOCK - inset * 2, d: BLOCK - inset * 2,
      s: rng.range(0, 64), speed: rng.range(0.9, 1.8) * (rng.chance(0.5) ? 1 : -1), phase: rng.range(0, 6),
    });
  }

  // ---- cars: outlined boxes driving the streets ----
  const cars: Car[] = [];
  const carLine = new THREE.LineBasicMaterial({ color: INK });
  disposables.push(carLine);
  for (let n = 0; n < 16; n++) {
    const g = new THREE.Group();
    const bodyG = new THREE.BoxGeometry(2.4, 0.8, 1.2);
    const cabG = new THREE.BoxGeometry(1.2, 0.55, 1.0);
    disposables.push(bodyG, cabG);
    const body = new THREE.Mesh(bodyG, paper); body.position.y = 0.55;
    const cab = new THREE.Mesh(cabG, paper); cab.position.set(-0.2, 1.22, 0);
    const be = new THREE.LineSegments(new THREE.EdgesGeometry(bodyG), carLine); be.position.copy(body.position);
    const ce = new THREE.LineSegments(new THREE.EdgesGeometry(cabG), carLine); ce.position.copy(cab.position);
    disposables.push(be.geometry, ce.geometry);
    g.add(body, cab, be, ce);
    g.visible = false;
    root.add(g);
    const axis = rng.chance(0.5) ? 'x' : 'z';
    const dir = rng.chance(0.5) ? 1 : -1;
    const k = rng.int(0, BLOCKS);
    const center = -HALF + STREET / 2 + k * (BLOCK + STREET);
    cars.push({ group: g, axis, dir, lane: center + dir * 1.3, t: rng.range(-HALF, HALF), speed: rng.range(4, 8) });
  }

  return {
    root, ink: inkMat, drawTime, walkers, cars,
    dispose: () => disposables.forEach((d) => d.dispose()),
  };
}

export function perimeterPoint(wk: Walker, s: number) {
  const L = 2 * wk.w + 2 * wk.d;
  s = ((s % L) + L) % L;
  if (s < wk.w) return [wk.x0 + s, wk.z0, 0];
  if (s < wk.w + wk.d) return [wk.x0 + wk.w, wk.z0 + s - wk.w, 1];
  if (s < 2 * wk.w + wk.d) return [wk.x0 + wk.w - (s - wk.w - wk.d), wk.z0 + wk.d, 2];
  return [wk.x0, wk.z0 + wk.d - (s - 2 * wk.w - wk.d), 3];
}

export const HALF_EXTENT = HALF;
