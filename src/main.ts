import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { buildCity, City, PAPER, perimeterPoint, HALF_EXTENT, EXTENT } from './city';

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(PAPER);
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();

// Isometric look = orthographic camera looking down the diagonal
const VIEW = EXTENT * 0.62;
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -1000, 1000);
camera.position.set(100, 82, 100);
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
controls.enablePan = false;
controls.minZoom = 0.6;
controls.maxZoom = 4;
controls.minPolarAngle = 0.35;
controls.maxPolarAngle = 1.2;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.35;
controls.addEventListener('start', () => (controls.autoRotate = false));

let city: City;
let t0 = performance.now();
function redraw() {
  if (city) { scene.remove(city.root); city.dispose(); }
  city = buildCity(Math.floor(Math.random() * 1e9));
  scene.add(city.root);
  t0 = performance.now();
}
redraw();
document.getElementById('redraw')!.addEventListener('click', redraw);
window.addEventListener('keydown', (e) => { if (e.key.toLowerCase() === 'r') redraw(); });

const clock = new THREE.Clock();
function tick() {
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = (performance.now() - t0) / 1000;
  city.ink.uniforms.uTime.value = t;

  // people and cars show up once most of the city is drawn
  const alive = t > city.drawTime * 0.7;
  for (const wk of city.walkers) {
    wk.mesh.visible = alive;
    if (!alive) continue;
    wk.s += wk.speed * dt;
    const [x, z] = perimeterPoint(wk, wk.s);
    wk.mesh.position.set(x, Math.abs(Math.sin(t * 7 + wk.phase)) * 0.08, z);
  }
  for (const car of city.cars) {
    car.group.visible = alive;
    if (!alive) continue;
    car.t += car.speed * car.dir * dt;
    if (car.t > HALF_EXTENT) car.t = -HALF_EXTENT;
    if (car.t < -HALF_EXTENT) car.t = HALF_EXTENT;
    if (car.axis === 'x') { car.group.position.set(car.t, 0, car.lane); car.group.rotation.y = car.dir > 0 ? 0 : Math.PI; }
    else { car.group.position.set(car.lane, 0, car.t); car.group.rotation.y = car.dir > 0 ? -Math.PI / 2 : Math.PI / 2; }
  }

  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}
tick();
