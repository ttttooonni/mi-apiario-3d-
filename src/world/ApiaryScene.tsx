import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

type SceneHive = { id: string; name: string; kind: 'Colmena' | 'Núcleo'; status: 'Activa' | 'Revisar' | 'Atención'; queen: string; queenYear: number };
type Props = { selectedId: string; onSelect: (id: string) => void; onFrameInspect: (id: string, frameIndex: number) => void; night: boolean; hives: SceneHive[] };

export default function ApiaryScene({ selectedId, onSelect, onFrameInspect, night, hives: hiveData }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const selectRef = useRef(onSelect);
  const selectedRef = useRef(selectedId);
  const inspectRef = useRef(onFrameInspect);
  const hiveDataRef = useRef(hiveData);
  useEffect(() => { selectRef.current = onSelect; }, [onSelect]);
  useEffect(() => { selectedRef.current = selectedId; }, [selectedId]);
  useEffect(() => { inspectRef.current = onFrameInspect; }, [onFrameInspect]);
  useEffect(() => { hiveDataRef.current = hiveData; }, [hiveData]);

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
    const pmrem = new THREE.PMREMGenerator(renderer);
    const environment = pmrem.fromScene(new RoomEnvironment(), 0.04);
    scene.environment = environment.texture;
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
    const terrainGeometry = new THREE.PlaneGeometry(120, 120, 64, 64);
    const terrainPositions = terrainGeometry.attributes.position;
    for (let i = 0; i < terrainPositions.count; i++) {
      const x = terrainPositions.getX(i), z = terrainPositions.getY(i);
      const rolling = Math.sin(x * 0.16) * 0.22 + Math.cos(z * 0.13) * 0.19 + Math.sin((x + z) * 0.09) * 0.12;
      terrainPositions.setZ(i, rolling);
    }
    terrainGeometry.computeVertexNormals();
    const ground = new THREE.Mesh(terrainGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2; ground.position.y = -0.08; ground.receiveShadow = true; scene.add(ground);

    // Natural scattered stones and low scrub make the terrain feel less like a flat board.
    const stoneMaterial = new THREE.MeshStandardMaterial({ color: night ? '#59675a' : '#a9a28b', roughness: 1 });
    const scrubMaterials = ['#496d42', '#63834b', '#81965a'].map(color => new THREE.MeshStandardMaterial({ color, roughness: 1 }));
    for (let i = 0; i < 58; i++) {
      const angle = i * 2.399, radius = 6.5 + (i % 11) * 1.15;
      const x = Math.cos(angle) * radius, z = Math.sin(angle) * radius * 0.75;
      if (Math.abs(x) < 3.2 && z > -4.5 && z < 5.8) continue;
      if (i % 3 === 0) {
        const stone = new THREE.Mesh(new THREE.DodecahedronGeometry(0.12 + (i % 4) * 0.045, 0), stoneMaterial);
        stone.position.set(x, 0.04, z); stone.rotation.set(i * 0.4, i * 0.7, i * 0.2); stone.scale.y = 0.55; stone.castShadow = true; scene.add(stone);
      } else {
        const scrub = new THREE.Group();
        for (let leaf = 0; leaf < 3; leaf++) {
          const tuft = new THREE.Mesh(new THREE.IcosahedronGeometry(0.18 + ((i + leaf) % 3) * 0.05, 0), scrubMaterials[(i + leaf) % scrubMaterials.length]);
          tuft.position.set((leaf - 1) * 0.13, 0.12 + (leaf % 2) * 0.08, (leaf % 2) * 0.1); tuft.scale.y = 0.65; scrub.add(tuft);
        }
        scrub.position.set(x, 0, z); scene.add(scrub);
      }
    }

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
    const windFlowers: { group: THREE.Group; phase: number; strength: number }[] = [];
    for (let i = 0; i < 54; i++) {
      const angle = i * 2.399;
      const radius = 3.4 + (i % 9) * 0.72;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius * 0.72;
      if (Math.abs(x) < 2.5 && Math.abs(z) < 4.5) continue;
      const flower = new THREE.Group();
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.025, 0.22, 5), stemMaterial);
      stem.position.y = 0.11; flower.add(stem);
      const bloom = new THREE.Mesh(new THREE.SphereGeometry(0.075, 7, 6), flowerMaterials[i % flowerMaterials.length]);
      bloom.scale.set(1, 0.65, 1); bloom.position.y = 0.25; flower.add(bloom);
      flower.position.set(x, 0, z); scene.add(flower); windFlowers.push({ group: flower, phase: i * 0.8, strength: 0.025 + (i % 4) * 0.009 });
    }

    const hives: THREE.Group[] = [];
    const pickables: THREE.Object3D[] = [];
    const selectionMarkers: THREE.Mesh[] = [];
    const flightBees: { mesh: THREE.Group; phase: number; radius: number; speed: number; height: number }[] = [];
    const beeBodyMaterial = new THREE.MeshStandardMaterial({ color: '#28231b', roughness: 0.55 });
    const beeStripeMaterial = new THREE.MeshStandardMaterial({ color: '#f2bd36', roughness: 0.65 });
    const wingMaterial = new THREE.MeshStandardMaterial({ color: '#f5f2df', transparent: true, opacity: 0.78, side: THREE.DoubleSide });
    for (let i = 0; i < 14; i++) {
      const bee = new THREE.Group();
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.075, 8, 6), beeBodyMaterial); body.scale.set(1.25, 0.8, 1); bee.add(body);
      const stripe = new THREE.Mesh(new THREE.SphereGeometry(0.078, 8, 6), beeStripeMaterial); stripe.scale.set(0.42, 0.82, 1.03); stripe.position.x = -0.015; bee.add(stripe);
      for (const side of [-1, 1]) { const wing = new THREE.Mesh(new THREE.SphereGeometry(0.045, 7, 5), wingMaterial); wing.scale.set(0.65, 0.22, 1.5); wing.position.set(0, 0.055, side * 0.045); bee.add(wing); }
      scene.add(bee); flightBees.push({ mesh: bee, phase: i * 0.73, radius: 1.2 + (i % 5) * 0.65, speed: 0.55 + (i % 4) * 0.14, height: 0.85 + (i % 4) * 0.32 });
    }
    // Procedural wood grain: keeps the prototype self-contained without downloading image assets.
    const woodCanvas = document.createElement('canvas'); woodCanvas.width = 256; woodCanvas.height = 256;
    const woodCtx = woodCanvas.getContext('2d');
    if (woodCtx) {
      const gradient = woodCtx.createLinearGradient(0, 0, 256, 0);
      gradient.addColorStop(0, '#b98243'); gradient.addColorStop(0.5, '#e1b976'); gradient.addColorStop(1, '#a8753d');
      woodCtx.fillStyle = gradient; woodCtx.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 90; i++) {
        const y = (i * 37) % 256; woodCtx.strokeStyle = i % 4 === 0 ? 'rgba(91,53,25,.28)' : 'rgba(255,231,177,.2)';
        woodCtx.lineWidth = i % 7 === 0 ? 2 : 1; woodCtx.beginPath(); woodCtx.moveTo(0, y);
        woodCtx.bezierCurveTo(70, y + Math.sin(i) * 4, 160, y - Math.cos(i) * 5, 256, y + Math.sin(i * 0.4) * 3); woodCtx.stroke();
      }
    }
    const woodTexture = new THREE.CanvasTexture(woodCanvas);
    woodTexture.colorSpace = THREE.SRGBColorSpace;
    woodTexture.wrapS = THREE.RepeatWrapping; woodTexture.wrapT = THREE.RepeatWrapping;
    woodTexture.repeat.set(1, 1);
    // Monochrome grain map adds subtle physical relief under grazing light.
    const bumpCanvas = document.createElement('canvas'); bumpCanvas.width = 256; bumpCanvas.height = 256;
    const bumpCtx = bumpCanvas.getContext('2d');
    if (bumpCtx) {
      bumpCtx.fillStyle = '#888'; bumpCtx.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 150; i++) {
        const y = (i * 53) % 256, shade = 105 + ((i * 17) % 65);
        bumpCtx.strokeStyle = 'rgb(' + shade + ',' + shade + ',' + shade + ')';
        bumpCtx.lineWidth = i % 9 === 0 ? 3 : 1;
        bumpCtx.beginPath(); bumpCtx.moveTo(0, y);
        bumpCtx.bezierCurveTo(64, y + Math.sin(i) * 5, 190, y - Math.cos(i) * 4, 256, y + Math.sin(i * 0.4) * 2);
        bumpCtx.stroke();
      }
    }
    const woodBumpTexture = new THREE.CanvasTexture(bumpCanvas);
    woodBumpTexture.wrapS = THREE.RepeatWrapping; woodBumpTexture.wrapT = THREE.RepeatWrapping;
    woodBumpTexture.repeat.set(1, 1);
    const hiveColours = ['#dca544', '#e8cf91', '#c9913e', '#e0b95e', '#dfd0a1', '#c58c3d'];
    const statusColours: Record<SceneHive['status'], string> = { Activa: '#48a868', Revisar: '#e7b735', Atención: '#d9534f' };
    const queenColours: Record<string, string> = { Azul: '#2878d0', Blanco: '#f5f5ed', Amarillo: '#f2d12e', Rojo: '#d64040', Verde: '#319653', 'Sin marcar': '#8a9286' };
    const trimMaterial = new THREE.MeshStandardMaterial({ color: '#f5e7c6', roughness: 0.75 });
    const roofMaterial = new THREE.MeshStandardMaterial({ color: '#5a4632', roughness: 0.82 });
    const standMaterial = new THREE.MeshStandardMaterial({ color: '#6d5238', roughness: 0.95 });
    const entranceMaterial = new THREE.MeshStandardMaterial({ color: '#392b20', roughness: 1 });
    const metalMaterial = new THREE.MeshStandardMaterial({ color: '#777b79', metalness: 0.72, roughness: 0.34 });
    const screwMaterial = new THREE.MeshStandardMaterial({ color: '#353a38', metalness: 0.8, roughness: 0.3 });

    for (let i = 0; i < hiveData.length; i++) {
      const hiveRecord = hiveData[i];
      const id = hiveRecord.id;
      const group = new THREE.Group();
      const columns = Math.min(4, Math.max(2, Math.ceil(Math.sqrt(hiveData.length))));
      const row = Math.floor(i / columns), col = i % columns;
      group.position.set((col - (Math.min(hiveData.length, columns) - 1) / 2) * 3.25, 0, row * 3.9 - ((Math.ceil(hiveData.length / columns) - 1) * 1.95));
      group.userData.hiveId = id;
      const footprint = new THREE.Mesh(new THREE.CylinderGeometry(1.12, 1.22, 0.1, 28), new THREE.MeshStandardMaterial({ color: night ? '#39483a' : '#788c54', roughness: 1 }));
      footprint.position.y = 0.02; footprint.receiveShadow = true; group.add(footprint);
      const marker = new THREE.Mesh(new THREE.TorusGeometry(1.22, 0.045, 8, 48), new THREE.MeshBasicMaterial({ color: statusColours[hiveRecord.status], transparent: true, opacity: 0.95 }));
      marker.rotation.x = -Math.PI / 2; marker.position.y = 0.095; marker.visible = false; group.add(marker); selectionMarkers.push(marker);

      const legs = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.42, 1.12), standMaterial);
      legs.position.y = 0.22; legs.castShadow = true; group.add(legs);
      const foot = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.12, 1.42), roofMaterial);
      foot.position.y = 0.47; foot.castShadow = true; group.add(foot);

      const bodyMaterial = new THREE.MeshStandardMaterial({ color: hiveColours[i % hiveColours.length], map: woodTexture, bumpMap: woodBumpTexture, bumpScale: 0.045, roughness: 0.9 });
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
      // Landing board and dark entrance tunnel add beekeeper-grade details.
      const entrance = new THREE.Mesh(new THREE.BoxGeometry(0.43, 0.075, 0.045), entranceMaterial);
      entrance.position.set(0, 0.63, 0.635); group.add(entrance);
      const landing = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.045, 0.22), bodyMaterial);
      landing.position.set(0, 0.56, 0.72); landing.castShadow = true; group.add(landing);

      // Metal corner guards, roof edging and small fasteners break up the toy-like silhouette.
      for (const side of [-1, 1]) {
        const guard = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.82, 0.035), metalMaterial);
        guard.position.set(side * 0.67, 1.05, 0.625); guard.castShadow = true; group.add(guard);
        for (const y of [0.73, 1.02, 1.34, 1.51]) {
          const screw = new THREE.Mesh(new THREE.CylinderGeometry(0.027, 0.027, 0.012, 12), screwMaterial);
          screw.rotation.x = Math.PI / 2; screw.position.set(side * 0.67, y, 0.648); group.add(screw);
        }
      }
      const roofFrontEdge = new THREE.Mesh(new THREE.BoxGeometry(1.72, 0.035, 0.045), metalMaterial);
      roofFrontEdge.position.set(0, 1.68, 0.735); group.add(roofFrontEdge);
      for (let bee = 0; bee < 3; bee++) {
        const beeDot = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 5), new THREE.MeshStandardMaterial({ color: '#2f2920' }));
        beeDot.position.set(-0.14 + bee * 0.14, 0.66 + (bee % 2) * 0.05, 0.67); group.add(beeDot);
      }
      // Interior frames and hinged lid: the selected hive opens without rebuilding the scene.
      const frameGroup = new THREE.Group();
      frameGroup.userData.hiveId = id;
      for (let frameIndex = 0; frameIndex < 9; frameIndex++) {
        const frame = new THREE.Group();
        frame.userData.hiveId = id;
        frame.userData.frameIndex = frameIndex + 1;
        const frameWood = new THREE.Mesh(new THREE.BoxGeometry(0.085, 0.48, 0.78), new THREE.MeshStandardMaterial({ color: '#d6ad68', roughness: 0.88 }));
        frameWood.castShadow = true;
        frame.add(frameWood);
        const comb = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.39, 0.68), new THREE.MeshStandardMaterial({ color: frameIndex % 3 === 0 ? '#b77b35' : '#e5bf64', roughness: 0.95 }));
        comb.position.x = 0.047;
        frame.add(comb);
        frame.position.set((frameIndex - 4) * 0.115, 1.53, 0);
        frameGroup.add(frame);
        frame.traverse(object => { if ((object as THREE.Mesh).isMesh) { object.userData.hiveId = id; object.userData.frameIndex = frameIndex + 1; pickables.push(object); } });
      }
      group.add(frameGroup);
      const lidHinge = new THREE.Group();
      lidHinge.position.set(0, 1.69, -0.66);
      lidHinge.userData.hiveId = id;
      const lid = new THREE.Mesh(new THREE.BoxGeometry(1.68, 0.15, 1.46), new THREE.MeshStandardMaterial({ color: statusColours[hiveRecord.status], roughness: 0.78 }));
      lid.position.set(0, 0, 0.66); lid.castShadow = true; lid.userData.hiveId = id; lidHinge.add(lid);
      const roofTop = new THREE.Mesh(new THREE.BoxGeometry(1.53, 0.06, 1.32), new THREE.MeshStandardMaterial({ color: '#816446', roughness: 0.8 }));
      roofTop.position.set(0, 0.105, 0.66); roofTop.userData.hiveId = id; lidHinge.add(roofTop);
      group.add(lidHinge);
      group.userData.lidHinge = lidHinge;
      group.userData.frameGroup = frameGroup;

      const canvas = document.createElement('canvas'); canvas.width = 320; canvas.height = 104;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#fff8e8'; ctx.fillRect(0, 0, 320, 104);
        ctx.strokeStyle = statusColours[hiveRecord.status]; ctx.lineWidth = 7; ctx.strokeRect(3, 3, 314, 98);
        ctx.fillStyle = '#46351f'; ctx.font = 'bold 25px sans-serif'; ctx.fillText(hiveRecord.name.slice(0, 18), 12, 35);
        ctx.fillStyle = queenColours[hiveRecord.queen] ?? '#8a9286'; ctx.beginPath(); ctx.arc(20, 67, 9, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#5d513f'; ctx.lineWidth = 1; ctx.stroke();
        ctx.fillStyle = '#46351f'; ctx.font = '18px sans-serif'; ctx.fillText(hiveRecord.queen === 'Sin marcar' ? 'Reina sin marcar' : `Reina ${hiveRecord.queen} · ${hiveRecord.queenYear}`, 36, 73);
      }
      const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
      const label = new THREE.Mesh(new THREE.PlaneGeometry(1.65, 0.54), new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide }));
      label.position.set(0, 1.37, 0.635); group.add(label);
      // Tag meshes for selection; frame meshes retain their frame index.\n      group.traverse(object => { if ((object as THREE.Mesh).isMesh) { object.userData.hiveId = id; if (typeof object.userData.frameIndex !== 'number') pickables.push(object); } });\n      scene.add(group); hives.push(group);
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
      const frameIndex = hit?.object.userData.frameIndex;
      if (typeof id === 'string' && typeof frameIndex === 'number') { selectRef.current(id); inspectRef.current(id, frameIndex); }
      else if (typeof id === 'string') selectRef.current(id);
    };
    renderer.domElement.addEventListener('pointerdown', onDown);
    renderer.domElement.addEventListener('pointermove', onMove);
    renderer.domElement.addEventListener('pointerup', handleClick);

    let frame = 0;
    let disposed = false;
    let running = false;
    const animate = () => {
      if (disposed || document.hidden) { running = false; return; }
      running = true;
      frame = requestAnimationFrame(animate);
      // Smoothly bring the selected hive into focus, like a lightweight simulation game.
      const focusedHive = hives.find(hive => hive.userData.hiveId === selectedRef.current);
      hives.forEach(hive => {
        const hinge = hive.userData.lidHinge as THREE.Group | undefined;
        if (hinge) { const target = hive.userData.hiveId === selectedRef.current ? -1.02 : 0; hinge.rotation.x += (target - hinge.rotation.x) * 0.075; }
      });
      const focusPoint = focusedHive
        ? focusedHive.position.clone().add(new THREE.Vector3(0, 0.92, 0))
        : new THREE.Vector3(0, 0.75, 0);
      const cameraDestination = focusedHive
        ? focusedHive.position.clone().add(new THREE.Vector3(3.2, 4.4, 6.4))
        : new THREE.Vector3(12.5, 10.5, 15.5);
      controls.target.lerp(focusPoint, 0.035);
      camera.position.lerp(cameraDestination, 0.025);
      controls.update();
      hives.forEach(hive => {
        const selected = hive.userData.hiveId === selectedRef.current;
        const marker = selectionMarkers[hives.indexOf(hive)];
        if (marker) { marker.visible = selected; marker.scale.setScalar(1 + Math.sin(performance.now() * 0.003) * 0.035); }
        hive.children.forEach(child => {
          if (child instanceof THREE.Mesh && child.userData.hiveId === hive.userData.hiveId) {
            const material = child.material as THREE.MeshStandardMaterial;
            material.emissive.set(selected ? '#6d4b13' : '#000000');
            material.emissiveIntensity = selected ? 0.22 : 0;
          }
        });
      });
      const now = performance.now() * 0.001;
      windFlowers.forEach(flower => { flower.group.rotation.z = Math.sin(now * 1.35 + flower.phase) * flower.strength; });
      flightBees.forEach(bee => {
        const t = now * bee.speed + bee.phase;
        bee.mesh.position.set(Math.cos(t) * (3.2 + bee.radius), bee.height + Math.sin(t * 2.3) * 0.2, Math.sin(t * 0.82) * (2.8 + bee.radius * 0.5));
        bee.mesh.rotation.y = -Math.atan2(Math.cos(t * 0.82) * 0.82, -Math.sin(t));
      });
      renderer.render(scene, camera);
    };
    const onVisibilityChange = () => { if (document.hidden) { cancelAnimationFrame(frame); running = false; } else if (!running) animate(); };
    document.addEventListener('visibilitychange', onVisibilityChange);
    animate();

    const resize = () => {
      const width = host.clientWidth, height = host.clientHeight;
      if (!width || !height) return;
      camera.aspect = width / height; camera.updateProjectionMatrix(); renderer.setSize(width, height);
    };
    const observer = new ResizeObserver(resize); observer.observe(host);
    return () => {
      disposed = true; cancelAnimationFrame(frame); observer.disconnect();
      document.removeEventListener('visibilitychange', onVisibilityChange);
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
      woodTexture.dispose(); woodBumpTexture.dispose(); environment.texture.dispose(); pmrem.dispose();
    };
  }, [night, hiveData.map(h => `${h.id}:${h.name}`).join('|')]);

  return <div className="three-host" ref={hostRef} role="img" aria-label="Escena 3D de un apiario de demostración. Selecciona una colmena para ver su ficha." />;
}
