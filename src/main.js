import * as THREE from 'three';
import './style.css';

const canvas = document.querySelector('#globe-canvas');
const hero = document.querySelector('.hero-art');
const menuToggle = document.querySelector('.menu-toggle');
const navigation = document.querySelector('.site-nav');
const year = document.querySelector('#current-year');

if (year) year.textContent = new Date().getFullYear();

menuToggle?.addEventListener('click', () => {
  const isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
  menuToggle.setAttribute('aria-expanded', String(!isOpen));
  menuToggle.setAttribute('aria-label', isOpen ? 'Open navigation' : 'Close navigation');
  navigation?.classList.toggle('is-open', !isOpen);
});

navigation?.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    navigation.classList.remove('is-open');
    menuToggle?.setAttribute('aria-expanded', 'false');
    menuToggle?.setAttribute('aria-label', 'Open navigation');
  });
});

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.section-kicker, .intro-layout, .intro-band, .section-heading-row, .product-card, .services-heading, .service-list a, .approach-image, .approach-copy, .collaborate-heading, .collaborate-options a, .contact-bar').forEach((element) => {
  element.classList.add('reveal');
  revealObserver.observe(element);
});

const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
let renderer;
let frameId;
let resizeObserver;

if (canvas && hero && !motionPreference.matches) {
  try {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
    camera.position.set(0, 0, 7.6);

    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
    renderer.setClearColor(0x000000, 0);

    const globeGroup = new THREE.Group();
    scene.add(globeGroup);

    const globeRadius = 2.05;
    const globe = new THREE.Mesh(
      new THREE.SphereGeometry(globeRadius, 40, 28),
      new THREE.MeshBasicMaterial({ color: 0x17251f, wireframe: true, transparent: true, opacity: 0.68 })
    );
    globeGroup.add(globe);

    const core = new THREE.Mesh(
      new THREE.SphereGeometry(globeRadius * 0.985, 32, 24),
      new THREE.MeshBasicMaterial({ color: 0x121b17, transparent: true, opacity: 0.8 })
    );
    globeGroup.add(core);

    const pointPositions = [];
    const connections = [];
    const rows = 24;
    const columns = 48;
    const nodeAt = (row, column) => {
      const latitude = Math.PI * (row / (rows - 1) - 0.5);
      const longitude = 2 * Math.PI * column / columns;
      const radius = globeRadius * 1.008;
      const x = radius * Math.cos(latitude) * Math.cos(longitude);
      const y = radius * Math.sin(latitude);
      const z = radius * Math.cos(latitude) * Math.sin(longitude);
      return new THREE.Vector3(x, y, z);
    };

    for (let row = 1; row < rows - 1; row += 1) {
      for (let column = 0; column < columns; column += 1) {
        const position = nodeAt(row, column);
        const wave = Math.sin(row * 1.83 + column * 0.49) * Math.cos(column * 0.35 - row * 0.17);
        if (wave > 0.15) pointPositions.push(position.x, position.y, position.z);
        if (column % 3 === 0 && wave > 0.32) {
          const next = nodeAt(row, (column + 8) % columns);
          connections.push(position.x, position.y, position.z, next.x, next.y, next.z);
        }
      }
    }

    const pointGeometry = new THREE.BufferGeometry();
    pointGeometry.setAttribute('position', new THREE.Float32BufferAttribute(pointPositions, 3));
    const nodes = new THREE.Points(pointGeometry, new THREE.PointsMaterial({ color: 0xc8ff58, size: 0.035, sizeAttenuation: true, transparent: true, opacity: 0.9 }));
    globeGroup.add(nodes);

    const connectionGeometry = new THREE.BufferGeometry();
    connectionGeometry.setAttribute('position', new THREE.Float32BufferAttribute(connections, 3));
    const connectionLines = new THREE.LineSegments(connectionGeometry, new THREE.LineBasicMaterial({ color: 0x8fbc51, transparent: true, opacity: 0.29 }));
    globeGroup.add(connectionLines);

    const orbitMaterial = new THREE.MeshBasicMaterial({ color: 0xf2f1e9, transparent: true, opacity: 0.25, side: THREE.DoubleSide });
    const orbitOne = new THREE.Mesh(new THREE.TorusGeometry(2.65, 0.004, 4, 160), orbitMaterial);
    orbitOne.rotation.set(0.98, 0.28, 0.14);
    globeGroup.add(orbitOne);
    const orbitTwo = new THREE.Mesh(new THREE.TorusGeometry(2.82, 0.003, 4, 160), new THREE.MeshBasicMaterial({ color: 0xc8ff58, transparent: true, opacity: 0.18, side: THREE.DoubleSide }));
    orbitTwo.rotation.set(0.35, 1.04, 0.78);
    globeGroup.add(orbitTwo);

    const markerGeometry = new THREE.SphereGeometry(0.052, 12, 10);
    const markerMaterial = new THREE.MeshBasicMaterial({ color: 0xff795f });
    const markers = [
      new THREE.Vector3(0.42, 0.54, 1.93),
      new THREE.Vector3(-1.18, 0.84, 1.37),
      new THREE.Vector3(1.42, -0.6, 1.28),
      new THREE.Vector3(-1.72, -0.24, 0.98)
    ];
    markers.forEach((position, index) => {
      const marker = new THREE.Mesh(markerGeometry, index === 0 ? markerMaterial : markerMaterial.clone());
      marker.position.copy(position).normalize().multiplyScalar(globeRadius * 1.04);
      globeGroup.add(marker);
      const halo = new THREE.Mesh(new THREE.TorusGeometry(0.095 + index * 0.008, 0.003, 4, 32), new THREE.MeshBasicMaterial({ color: index === 0 ? 0xff795f : 0xc8ff58, transparent: true, opacity: 0.66 }));
      halo.position.copy(marker.position);
      halo.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), marker.position.clone().normalize());
      globeGroup.add(halo);
    });

    const particleCount = 150;
    const particlePositions = new Float32Array(particleCount * 3);
    const particleSeeds = [];
    for (let index = 0; index < particleCount; index += 1) {
      const direction = new THREE.Vector3(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1).normalize();
      const radius = 2.35 + Math.random() * 1.35;
      particleSeeds.push({ direction, radius, phase: Math.random() * Math.PI * 2, speed: 0.15 + Math.random() * 0.22 });
      particlePositions[index * 3] = direction.x * radius;
      particlePositions[index * 3 + 1] = direction.y * radius;
      particlePositions[index * 3 + 2] = direction.z * radius;
    }
    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particles = new THREE.Points(particleGeometry, new THREE.PointsMaterial({ color: 0xe5edcf, size: 0.018, sizeAttenuation: true, transparent: true, opacity: 0.55 }));
    scene.add(particles);

    const pointer = new THREE.Vector2();
    let targetRotationX = 0.12;
    let targetRotationY = -0.24;
    hero.addEventListener('pointermove', (event) => {
      const bounds = hero.getBoundingClientRect();
      const x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
      const y = ((event.clientY - bounds.top) / bounds.height) * 2 - 1;
      pointer.set(x, y);
      targetRotationY = -0.24 + x * 0.18;
      targetRotationX = 0.12 + y * 0.1;
    }, { passive: true });
    hero.addEventListener('pointerleave', () => {
      targetRotationX = 0.12;
      targetRotationY = -0.24;
    }, { passive: true });

    const updateSize = () => {
      const bounds = hero.getBoundingClientRect();
      const width = Math.max(1, bounds.width);
      const height = Math.max(1, bounds.height);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.position.z = width < 600 ? 8.6 : 7.6;
      camera.updateProjectionMatrix();
    };
    resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(hero);
    updateSize();

    const clock = new THREE.Clock();
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();
      globeGroup.rotation.y += 0.0015;
      globeGroup.rotation.x += (targetRotationX - globeGroup.rotation.x) * 0.025;
      globeGroup.rotation.y += (targetRotationY - globeGroup.rotation.y) * 0.012;
      particles.rotation.y = elapsed * 0.025;
      particles.rotation.x = Math.sin(elapsed * 0.12) * 0.025;
      const positions = particleGeometry.attributes.position.array;
      particleSeeds.forEach((seed, index) => {
        const drift = Math.sin(elapsed * seed.speed + seed.phase) * 0.035;
        const offset = index * 3;
        positions[offset] = seed.direction.x * (seed.radius + drift);
        positions[offset + 1] = seed.direction.y * (seed.radius + drift);
        positions[offset + 2] = seed.direction.z * (seed.radius + drift);
      });
      particleGeometry.attributes.position.needsUpdate = true;
      renderer.render(scene, camera);
    };
    animate();
  } catch (error) {
    canvas.classList.add('webgl-unavailable');
    console.warn('Three.js scene unavailable; showing the static hero treatment.', error);
  }
} else {
  canvas?.classList.add('webgl-unavailable');
}

window.addEventListener('pagehide', () => {
  if (frameId) cancelAnimationFrame(frameId);
  resizeObserver?.disconnect();
  renderer?.dispose();
});
