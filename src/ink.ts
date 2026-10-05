import * as THREE from 'three';

// Collects every line in the city into ONE buffer, and gives each line a
// start time so the whole scene "draws itself" stroke by stroke.
export class InkBuilder {
  private pos: number[] = [];
  private seg: number[] = [];   // 0 at a line's start, 1 at its end
  private delay: number[] = []; // when this line starts drawing (seconds)
  maxDelay = 0;

  constructor(private rng: () => number) {}

  /** One clean stroke from a to b. */
  line(a: THREE.Vector3, b: THREE.Vector3, delay: number) {
    this.pos.push(a.x, a.y, a.z, b.x, b.y, b.z);
    this.seg.push(0, 1);
    this.delay.push(delay, delay);
    this.maxDelay = Math.max(this.maxDelay, delay);
  }

  /** A hand-drawn stroke: overshoots its ends a little, plus a second faint pass slightly off. */
  sketch(a: THREE.Vector3, b: THREE.Vector3, delay: number, overshoot = 0.35) {
    const dir = b.clone().sub(a).normalize();
    const o1 = overshoot * (0.5 + this.rng());
    const o2 = overshoot * (0.5 + this.rng());
    this.line(a.clone().addScaledVector(dir, -o1), b.clone().addScaledVector(dir, o2), delay);
    if (this.rng() < 0.55) {
      const j = () => (this.rng() - 0.5) * 0.14;
      const off = new THREE.Vector3(j(), j(), j());
      this.line(a.clone().add(off), b.clone().add(off), delay + 0.12);
    }
  }

  /** Closed outline through points (e.g. a floor line wrapping a building). */
  loop(points: THREE.Vector3[], delay: number, step = 0.04) {
    for (let i = 0; i < points.length; i++) {
      this.line(points[i], points[(i + 1) % points.length], delay + i * step);
    }
  }

  build(material: THREE.ShaderMaterial) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute('aSeg', new THREE.Float32BufferAttribute(this.seg, 1));
    g.setAttribute('aDelay', new THREE.Float32BufferAttribute(this.delay, 1));
    return new THREE.LineSegments(g, material);
  }
}

export function makeInkMaterial(color: string) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uDuration: { value: 0.55 }, // how long one stroke takes to draw
      uColor: { value: new THREE.Color(color) },
    },
    vertexShader: /* glsl */ `
      attribute float aSeg;
      attribute float aDelay;
      varying float vSeg;
      varying float vDelay;
      void main() {
        vSeg = aSeg;
        vDelay = aDelay;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform float uDuration;
      uniform vec3 uColor;
      varying float vSeg;
      varying float vDelay;
      void main() {
        float p = clamp((uTime - vDelay) / uDuration, 0.0, 1.0);
        if (p <= 0.0 || vSeg > p) discard; // the pen hasn't reached this part yet
        gl_FragColor = vec4(uColor, 1.0);
      }
    `,
  });
}
