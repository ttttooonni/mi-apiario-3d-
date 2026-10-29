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
    const host = hostRef.current; if (!host) return;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(night ? '#172c35' : '#c7e5ed');
    scene.fog = new THREE.Fog(night ? '#172c35' : '#c7e5ed', 24, 75);
    const camera = new THREE.PerspectiveCamera(48, host.clientWidth / host.clientHeight, 0.1, 200);
    camera.position.set(13, 12, 17);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); renderer.setSize(host.clientWidth, host.clientHeight);
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; renderer.outputColorSpace = THREE.SRGBColorSpace;
    host.appendChild(renderer.domElement);
    scene.add(new THREE.HemisphereLight(night ? 0x7790b0 : 0xffffff, 0x6b7545, night ? 1.3 : 2.0));
    const sun = new THREE.DirectionalLight(night ? 0x8bb8ff : 0xfff0cf, night ? 1.1 : 3.0);
    sun.position.set(-8, 16, 8); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024); scene.add(sun);
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(100,100,32,32), new THREE.MeshStandardMaterial({ color: night ? '#405947' : '#91ad65', roughness: 1 }));
    ground.rotation.x = -Math.PI/2; ground.receiveShadow = true; scene.add(ground);
    const path = new THREE.Mesh(new THREE.PlaneGeometry(5,38), new THREE.MeshStandardMaterial({color:'#c9b48a',roughness:1}));
    path.rotation.x=-Math.PI/2; path.position.set(0,.015,0); scene.add(path);
    for(let i=0;i<8;i++){
      const hill=new THREE.Mesh(new THREE.SphereGeometry(1,16,12),new THREE.MeshStandardMaterial({color:i%2?'#7e9d62':'#9ab274',roughness:1}));
      hill.scale.set(5+(i%3),1.2+(i%2),3.8); hill.position.set((i%2?1:-1)*(18+(i%3)*3),-.5,-17+i*5); hill.receiveShadow=true; scene.add(hill);
    }
    for(let i=0;i<20;i++){
      const x=(i%2?1:-1)*(8+(i%5)*2), z=-15+Math.floor(i/2)*3.2;
      const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.13,.2,1.6,7),new THREE.MeshStandardMaterial({color:'#6d4b31'}));
      trunk.position.set(x,.8,z); trunk.castShadow=true; scene.add(trunk);
      const crown=new THREE.Mesh(new THREE.IcosahedronGeometry(1.1+(i%3)*.2,1),new THREE.MeshStandardMaterial({color:i%2?'#52784b':'#6c8e52',roughness:1}));
      crown.position.set(x,2,z); crown.castShadow=true; scene.add(crown);
    }
    const hives: THREE.Object3D[]=[]; const pickables: THREE.Object3D[]=[];
    for(let i=0;i<6;i++){
      const group=new THREE.Group(), row=Math.floor(i/3), col=i%3;
      group.position.set((col-1)*3.2,0,row*3.7-1.8); group.userData.hiveId=`DEMO-00${i+1}`;
      const base=new THREE.Mesh(new THREE.BoxGeometry(1.6,.18,1.45),new THREE.MeshStandardMaterial({color:'#554435'}));
      base.position.y=.5;base.castShadow=true;group.add(base);
      const body=new THREE.Mesh(new THREE.BoxGeometry(1.45,.85,1.3),new THREE.MeshStandardMaterial({color:['#e7b34d','#f1d28b','#d7a44c'][i%3],roughness:.82}));
      body.position.y=1;body.castShadow=true;body.receiveShadow=true;body.userData.hiveId=group.userData.hiveId;group.add(body);pickables.push(body);
      const lid=new THREE.Mesh(new THREE.BoxGeometry(1.62,.16,1.48),new THREE.MeshStandardMaterial({color:'#59432d',roughness:.75}));
      lid.position.y=1.51;lid.castShadow=true;group.add(lid);
      const entrance=new THREE.Mesh(new THREE.BoxGeometry(.5,.08,.05),new THREE.MeshStandardMaterial({color:'#382d24'}));
      entrance.position.set(0,.77,.66);group.add(entrance);scene.add(group);hives.push(group);
      const canvas=document.createElement('canvas');canvas.width=256;canvas.height=64;
      const ctx=canvas.getContext('2d')!;ctx.fillStyle='#fff8e6';ctx.fillRect(0,0,256,64);ctx.fillStyle='#46351f';ctx.font='bold 27px sans-serif';ctx.fillText(group.userData.hiveId,12,41);
      const texture=new THREE.CanvasTexture(canvas);
      const label=new THREE.Mesh(new THREE.PlaneGeometry(1.6,.4),new THREE.MeshBasicMaterial({map:texture,side:THREE.DoubleSide}));
      label.position.set(0,2,.72);group.add(label);
    }
    const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.target.set(0,.6,0);controls.maxPolarAngle=Math.PI/2.05;controls.minDistance=5;controls.maxDistance=42;
    const raycaster=new THREE.Raycaster(), pointer=new THREE.Vector2();
    let downX=0,downY=0, dragged=false;
    const onDown=(e:PointerEvent)=>{downX=e.clientX;downY=e.clientY;dragged=false;};
    const onMove=(e:PointerEvent)=>{if(Math.hypot(e.clientX-downX,e.clientY-downY)>6)dragged=true;};
    const handleClick=(event:PointerEvent)=>{
      if(dragged)return;
      const rect=renderer.domElement.getBoundingClientRect();pointer.x=((event.clientX-rect.left)/rect.width)*2-1;pointer.y=-((event.clientY-rect.top)/rect.height)*2+1;
      raycaster.setFromCamera(pointer,camera);const hit=raycaster.intersectObjects(pickables,false)[0];const id=hit?.object.userData.hiveId;
      if(typeof id==='string')selectRef.current(id);
    };
    renderer.domElement.addEventListener('pointerdown',onDown);renderer.domElement.addEventListener('pointermove',onMove);renderer.domElement.addEventListener('pointerup',handleClick);
    let frame=0;
    const animate=()=>{frame=requestAnimationFrame(animate);controls.update();hives.forEach(hive=>{
      const body=hive.children.find(child=>child.userData.hiveId===hive.userData.hiveId);
      if(body instanceof THREE.Mesh){const mat=body.material as THREE.MeshStandardMaterial;mat.emissive.set(hive.userData.hiveId===selectedRef.current?'#5c3b0d':'#000000');mat.emissiveIntensity=hive.userData.hiveId === selectedRef.current ? 0.32 : 0;}
    });renderer.render(scene,camera);};animate();
    const resize=()=>{camera.aspect=host.clientWidth/host.clientHeight;camera.updateProjectionMatrix();renderer.setSize(host.clientWidth,host.clientHeight);};
    const observer=new ResizeObserver(resize);observer.observe(host);
    return ()=>{cancelAnimationFrame(frame);observer.disconnect();renderer.domElement.removeEventListener('pointerdown',onDown);renderer.domElement.removeEventListener('pointermove',onMove);renderer.domElement.removeEventListener('pointerup',handleClick);controls.dispose();scene.traverse(o=>{if(o instanceof THREE.Mesh){o.geometry.dispose();const m=o.material;if(Array.isArray(m))m.forEach(x=>x.dispose());else m.dispose();}});renderer.dispose();renderer.domElement.remove();};
  },[night]);
  return <div className="three-host" ref={hostRef} role="img" aria-label="Escena 3D de un apiario de demostración. Selecciona una colmena para ver su ficha." />;
}