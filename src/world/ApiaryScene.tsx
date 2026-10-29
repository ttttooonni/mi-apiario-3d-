import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

type Props = { selectedId: string; onSelect: (id: string) => void; night: boolean };

export default function ApiaryScene({ selectedId, onSelect, night }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const selectRef = useRef(onSelect);
  const selectedRef = useRef(selectedId);
  useEffect(() => { selectRef.current = onSelect; }, [onSelect]);
  useEffect(() => { selectedRef.current = selectedId; }, [selectedId]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const scene = new THREE.Scene();
    const sky = night ? '#172c35' : '#b9dce5';
    scene.background = new THREE.Color(sky);
    scene.fog = new THREE.Fog(sky, 28, 82);

    const camera = new THREE.PerspectiveCamera(46, host.clientWidth / host.clientHeight, 0.1, 180);
    camera.position.set(12.5, 10.5, 15.5);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.7));
    renderer.setSize(host.clientWidth, host.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.domElement.setAttribute('aria-label', 'Vista 3D interactiva del apiario de demostración');
    host.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight(night ? 0x91a7c7 : 0xfff8e8, 0x697c4d, night ? 1.45 : 2.15));
    const sun = new THREE.DirectionalLight(night ? 0x8bb8ff : 0xffe6b0, night ? 1.45 : 3.1);
    sun.position.set(-9, 18, 10);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.left = -22; sun.shadow.camera.right = 22;
    sun.shadow.camera.top = 22; sun.shadow.camera.bottom = -22;
    sun.shadow.bias = -0.0005;
    scene.add(sun);

    const groundMaterial = new THREE.MeshStandardMaterial({ color: night ? '#405947' : '#91ad65', roughness: 1 });
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(120, 120), groundMaterial);
    ground.rotation.x = -Math.PI / 2; ground.position.y = -0.08; ground.receiveShadow = true; scene.add(ground);

    // A slightly winding pale-earth path gives the scene a clear visual centre.
    const pathMaterial = new THREE.MeshStandardMaterial({ color: night ? '#7e826a' : '#c9b48a', roughness: 1 });
    const path = new THREE.Mesh(new THREE.PlaneGeometry(3.8, 42), pathMaterial);
    path.rotation.x = -Math.PI / 2; path.position.set(0, -0.035, 0); scene.add(path);
    const pathEdgeMaterial = new THREE.MeshStandardMaterial({ color: night ? '#526747' : '#789655', roughness: 1 });
    for (const side of [-1, 1]) {
      const edge = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.035, 42), pathEdgeMaterial);
      edge.position.set(side * 1.98, -0.005, 0); scene.add(edge);
    }

    // Soft rolling hills and a distant tree line frame the apiary.
    for (let i = 0; i < 10; i++) {
      const hill = new THREE.Mesh(
        new THREE.SphereGeometry(1, 20, 14),
        new THREE.MeshStandardMaterial({ color: i % 3 === 0 ? '#8aa46a' : '#9fb77a', roughness: 1 })
      );
      hill.scale.set(5.5 + (i % 3) * 1.6, 1.4 + (i % 2) * 0.7, 4.2);
      hill.position.set((i % 2 ? 1 : -1) * (17 + (i % 3) * 2.5), -0.4, -22 + i * 4.5);
      hill.receiveShadow = true; scene.add(hill);
    }
    for (let i = 0; i < 24; i++) {
      const x = (i % 2 ? 1 : -1) * (7.8 + (i % 6) * 2.1);
      const z = -18 + Math.floor(i / 2) * 3.1;
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.2, 1.45, 8), new THREE.MeshStandardMaterial({ color: '#725039', roughness: 1 }));
      trunk.position.set(x, 0.72, z); trunk.castShadow = true; scene.add(trunk);
      const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(1.05 + (i % 3) * 0.22, 1), new THREE.MeshStandardMaterial({ color: i % 2 ? '#52784b' : '#6c8e52', roughness: 1 }));
      crown.position.set(x, 1.85, z); crown.castShadow = true; crown.receiveShadow = true; scene.add(crown);
    }

    // Small wildflowers add scale and colour without distracting from the hives.
    const flowerMaterials = ['#f6d66f', '#fff3d5', '#d88f9b'].map(color => new THREE.MeshStandardMaterial({ color, roughness: 0.8 }));
    const stemMaterial = new THREE.MeshStandardMaterial({ color: '#4e7843', roughness: 1 });
    for (let i = 0; i < 54; i++) {
      const angle = i * 2.399;
      const radius = 3.4 + (i % 9) * 0.72;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius * 0.72;
      if (Math.abs(x) < 2.5 && Math.abs(z) < 4.5) continue;
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.025, 0.22, 5), stemMaterial);
      stem.position.set(x, 0.11, z); scene.add(stem);
      const bloom = new THREE.Mesh(new THREE.SphereGeometry(0.075, 7, 6), flowerMaterials[i % flowerMaterials.length]);
      bloom.scale.set(1, 0.65, 1); bloom.position.set(x, 0.25, z); scene.add(bloom);
    }

    const hives: THREE.Group[] = [];
    const pickables: THREE.Object3D[] = [];
    const hiveColours = ['#dca544', '#e8cf91', '#c9913e', '#e0b95e', '#dfd0a1', '#c58c3d'];
    const trimMaterial = new THREE.MeshStandardMaterial({ color: '#f5e7c6', roughness: 0.75 });
    const roofMaterial = new THREE.MeshStandardMaterial({ color: '#5a4632', roughness: 0.82 });
    const standMaterial = new THREE.MeshStandardMaterial({ color: '#6d5238', roughness: 0.95 });
    const entranceMaterial = new THREE.MeshStandardMaterial({ color: '#392b20', roughness: 1 });

    for (let i = 0; i < 6; i++) {
      const id = `DEMO-00${i + 1}`;
      const group = new THREE.Group();
      const row = Math.floor(i / 3), col = i % 3;
      group.position.set((col - 1) * 3.25, 0, row * 3.9 - 2.0);
      group.userData.hiveId = id;

      const legs = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.42, 1.12), standMaterial);
      legs.position.y = 0.22; legs.castShadow = true; group.add(legs);
      const foot = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.12, 1.42), roofMaterial);
      foot.position.y = 0.47; foot.castShadow = true; group.add(foot);

      const bodyMaterial = new THREE.MeshStandardMaterial({ color: hiveColours[i], roughness: 0.78 });
      const lower = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.58, 1.22), bodyMaterial);
      lower.position.y = 0.82; lower.castShadow = true; lower.receiveShadow = true;
      lower.userData.hiveId = id; group.add(lower); pickables.push(lower);

      const seam = new THREE.Mesh(new THREE.BoxGeometry(1.46, 0.055, 1.26), trimMaterial);
      seam.position.y = 1.13; group.add(seam);
      const upper = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.42, 1.22), bodyMaterial);
      upper.position.y = 1.37; upper.castShadow = true; upper.receiveShadow = true;
      upper.userData.hiveId = id; group.add(upper); pickables.push(upper);

      // Thin horizontal front grooves make the wooden boxes read as hive supers.
      for (const y of [0.66, 0.83, 1.0, 1.28, 1.43, 1.55]) {
        const groove = new THREE.Mesh(new THREE.BoxGeometry(1.16, 0.018, 0.018), roofMaterial);
        groove.position.set(0, y, 0.621); group.add(groove);
      }
      const entrance = new THREE.Mesh(new THREE.BoxGeometry(0.43, 0.075, 0.045), entranceMaterial);
      entrance.position.set(0, 0.63, 0.635); group.add(entrance);
      for (let bee = 0; bee < 3; bee++) {
        const beeDot = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 5), new THREE.MeshStandardMaterial({ color: '#2f2920' }));
        beeDot.position.set(-0.14 + bee * 0.14, 0.66 + (bee % 2) * 0.05, 0.67); group.add(beeDot);
      }
      const lid = new THREE.Mesh(new THREE.BoxGeometry(1.68, 0.15, 1.46), roofMaterial);
      lid.position.y = 1.67; lid.castShadow = true; group.add(lid);
      const roofTop = new THREE.Mesh(new THREE.BoxGeometry(1.53, 0.06, 1.32), new THREE.MeshStandardMaterial({ color: '#816446', roughness: 0.8 }));
      roofTop.position.y = 1.775; group.add(roofTop);

      const canvas = document.createElement('canvas'); canvas.width = 256; canvas.height = 72;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#fff8e8'; ctx.fillRect(0, 0, 256, 72);
        ctx.strokeStyle = '#d9bd7a'; ctx.lineWidth = 4; ctx.strokeRect(3, 3, 250, 66);
        ctx.fillStyle = '#46351f'; ctx.font = 'bold 26px sans-serif'; ctx.fillText(id, 12, 45);
      }
      const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
      const label = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 0.36), new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide }));
      label.position.set(0, 1.37, 0.635); group.add(label);
      scene.add(group); hives.push(group);
    }

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; controls.dampingFactor = 0.06;
    controls.target.set(0, 0.75, 0); controls.maxPolarAngle = Math.PI / 2.03;
    controls.minDistance = 5.5; controls.maxDistance = 38;
    const raycaster = new THREE.Raycaster(), pointer = new THREE.Vector2();
    let downX = 0, downY = 0, dragged = false;
    const onDown = (event: PointerEvent) => { downX = event.clientX; downY = event.clientY; dragged = false; };
    const onMove = (event: PointerEvent) => { if (Math.hypot(event.clientX - downX, event.clientY - downY) > 6) dragged = true; };
    const handleClick = (event: PointerEvent) => {
      if (dragged) return;
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(pickables, false)[0];
      const id = hit?.object.userData.hiveId;
      if (typeof id === 'string') selectRef.current(id);
    };
    renderer.domElement.addEventListener('pointerdown', onDown);
    renderer.domElement.addEventListener('pointermove', onMove);
    renderer.domElement.addEventListener('pointerup', handleClick);

    let frame = 0;
    const animate = () => {
      frame = requestAnimationFrame(animate);
      controls.update();
      hives.forEach(hive => {
        const selected = hive.userData.hiveId === selectedRef.current;
        hive.children.forEach(child => {
          if (child instanceof THREE.Mesh && child.userData.hiveId === hive.userData.hiveId) {
            const material = child.material as THREE.MeshStandardMaterial;
            material.emissive.set(selected ? '#6d4b13' : '#000000');
            material.emissiveIntensity = selected ? 0.22 : 0;
          }
        });
      });
      renderer.render(scene, camera);
    };
    animate();

    const resize = () => {
      const width = host.clientWidth, height = host.clientHeight;
      if (!width || !height) return;
      camera.aspect = width / height; camera.updateProjectionMatrix(); renderer.setSize(width, height);
    };
    const observer = new ResizeObserver(resize); observer.observe(host);
    return () => {
      cancelAnimationFrame(frame); observer.disconnect();
      renderer.domElement.removeEventListener('pointerdown', onDown);
      renderer.domElement.removeEventListener('pointermove', onMove);
      renderer.domElement.removeEventListener('pointerup', handleClick);
      controls.dispose();
      scene.traverse(object => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          const material = object.material;
          if (Array.isArray(material)) material.forEach(item => item.dispose()); else material.dispose();
        }
      });
      renderer.dispose(); renderer.domElement.remove();
    };
  }, [night]);

  return <div className="three-host" ref={hostRef} role="img" aria-label="Escena 3D de un apiario de demostración. Selecciona una colmena para ver su ficha." />;
}
