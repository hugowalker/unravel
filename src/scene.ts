import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {bounds,features,maskImage,train,type Model} from './vision';
const rad=THREE.MathUtils.degToRad;
const mat=(color:number,emissive=0)=>new THREE.MeshStandardMaterial({color,roughness:.68,metalness:.2,emissive,emissiveIntensity:.25});
export function makeDrone(){
  const drone=new THREE.Group();const shell=mat(0xe0e3de),dark=mat(0x222a30),accent=mat(0xb8ef76,0x95cb5c);
  const body=new THREE.Mesh(new THREE.BoxGeometry(.5,.16,.32),shell);drone.add(body);
  const battery=new THREE.Mesh(new THREE.BoxGeometry(.23,.07,.24),dark);battery.position.y=.115;drone.add(battery);
  const props:THREE.Mesh[]=[];
  for(const x of [-1,1])for(const z of [-1,1]){
    const arm=new THREE.Mesh(new THREE.BoxGeometry(.52,.055,.075),shell);arm.position.set(x*.32,0,z*.22);arm.rotation.y=-x*z*.55;drone.add(arm);
    const motor=new THREE.Mesh(new THREE.CylinderGeometry(.075,.07,.095,12),shell);motor.position.set(x*.53,.035,z*.36);drone.add(motor);
    const prop=new THREE.Mesh(new THREE.BoxGeometry(.45,.018,.05),shell);prop.position.copy(motor.position);prop.position.y+=.062;drone.add(prop);props.push(prop);
    const leg=new THREE.Mesh(new THREE.BoxGeometry(.035,.16,.035),dark);leg.position.set(x*.28,-.12,z*.2);drone.add(leg);
  }
  const lens=new THREE.Mesh(new THREE.CylinderGeometry(.06,.06,.1,16),dark);lens.rotation.x=Math.PI/2;lens.position.set(0,-.04,.2);drone.add(lens);
  const stripe=new THREE.Mesh(new THREE.BoxGeometry(.12,.015,.2),accent);stripe.position.set(0,.088,0);drone.add(stripe);
  drone.userData.props=props;return drone;
}
export class LabScene{
  renderer:THREE.WebGLRenderer;scene=new THREE.Scene();overview=new THREE.PerspectiveCamera(45,1,.1,100);sensor=new THREE.PerspectiveCamera(55,16/9,.05,60);
  controls:OrbitControls;drone=makeDrone();target=new THREE.WebGLRenderTarget(320,180);bytes=new Uint8Array(320*180*4);image=new ImageData(320,180);
  mount=new THREE.Group();head=new THREE.Group();occluder:THREE.Mesh;light:THREE.DirectionalLight;frustum:THREE.CameraHelper;flightTime=0;
  constructor(public container:HTMLElement){
    this.target.texture.colorSpace=THREE.SRGBColorSpace;
    this.renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});this.renderer.setPixelRatio(Math.min(devicePixelRatio,2));this.renderer.setClearColor(0x141c25);container.append(this.renderer.domElement);
    this.scene.background=new THREE.Color(0x141c25);this.scene.fog=new THREE.Fog(0x141c25,16,32);
    this.overview.position.set(10,9,12);this.controls=new OrbitControls(this.overview,this.renderer.domElement);this.controls.target.set(0,1.2,0);this.controls.enableDamping=true;this.controls.maxPolarAngle=Math.PI*.47;this.controls.minDistance=5;this.controls.maxDistance=24;
    this.scene.add(new THREE.AmbientLight(0xd8e4ff,1.1));this.light=new THREE.DirectionalLight(0xffffff,2);this.light.position.set(3,8,5);this.scene.add(this.light);
    const floor=new THREE.Mesh(new THREE.BoxGeometry(12,.12,10),mat(0x151b22));floor.position.y=-.08;this.scene.add(floor);
    const grid=new THREE.GridHelper(12,24,0x34424d,0x242e38);grid.position.y=.001;this.scene.add(grid);
    // Dark room furnishings keep the synthetic contrast proposal stage explicit and inspectable.
    const wall=new THREE.Mesh(new THREE.BoxGeometry(12,4,.12),mat(0x151b23));wall.position.set(0,2,-5);this.scene.add(wall);
    const side=new THREE.Mesh(new THREE.BoxGeometry(.12,4,10),mat(0x11171d));side.position.set(-6,2,0);this.scene.add(side);
    for(let i=0;i<5;i++){const beam=new THREE.Mesh(new THREE.BoxGeometry(.03,3.7,.025),mat(0x2f3c49));beam.position.set(-5+i*2.5,2,-4.91);this.scene.add(beam);}
    for(const [x,z] of [[-4,-3],[4,-3],[4,2]]){const box=new THREE.Mesh(new THREE.BoxGeometry(1.3,1,1),mat(0x24303b));box.position.set(x,.5,z);this.scene.add(box);}
    const bench=new THREE.Mesh(new THREE.BoxGeometry(3,.13,1),mat(0x26333c));bench.position.set(-3,1.05,-3);this.scene.add(bench);
    for(const x of [-4,-2]){const leg=new THREE.Mesh(new THREE.BoxGeometry(.08,1,.08),mat(0x28323c));leg.position.set(x,.5,-3);this.scene.add(leg);}
    const base=new THREE.Mesh(new THREE.CylinderGeometry(.36,.44,.18,32),mat(0x76838c));base.position.y=.1;this.mount.add(base);
    const pillar=new THREE.Mesh(new THREE.CylinderGeometry(.06,.1,.9,12),mat(0x6a7680));pillar.position.y=.6;this.mount.add(pillar);
    const headBody=new THREE.Mesh(new THREE.BoxGeometry(.4,.26,.3),mat(0xb5ee79));this.head.add(headBody);this.head.position.y=1.25;this.mount.add(this.head);
    this.mount.position.set(0,0,3.7);this.scene.add(this.mount);this.sensor.position.set(0,1.25,3.7);
    this.frustum=new THREE.CameraHelper(this.sensor);this.frustum.visible=false;this.scene.add(this.frustum);
    this.occluder=new THREE.Mesh(new THREE.BoxGeometry(2,2.9,.18),mat(0x35434b));this.occluder.position.set(0,1.45,.3);this.occluder.visible=false;this.scene.add(this.occluder);
    this.scene.add(this.drone);this.setTime(0);new ResizeObserver(()=>this.resize()).observe(container);this.resize();
  }
  resize(){const w=this.container.clientWidth,h=this.container.clientHeight;if(w<1||h<1)return;this.renderer.setSize(w,h);this.overview.aspect=w/h;this.overview.updateProjectionMatrix();}
  setTime(t:number,pattern='ellipse'){
    this.flightTime=t;
    if(pattern==='hover')this.drone.position.set(.3,2,-.9);
    else if(pattern==='figure8')this.drone.position.set(Math.sin(t*.45)*3,2+Math.sin(t*.65)*.65,-1.5+Math.sin(t*.9)*1.1);
    else this.drone.position.set(Math.sin(t*.38)*3,2+Math.sin(t*.52)*.6,-1.4+Math.cos(t*.38)*1.2);
    this.drone.rotation.set(Math.sin(t*.6)*.05,t*.2,Math.cos(t*.4)*.06);
    (this.drone.userData.props as THREE.Mesh[]).forEach((p,i)=>p.rotation.y=t*35*(i%2?1:-1));
  }
  orient(pan:number,tilt:number){this.sensor.rotation.order='YXZ';this.sensor.rotation.set(rad(tilt),-rad(pan),0);this.sensor.updateMatrixWorld();this.head.rotation.set(rad(tilt),-rad(pan),0);this.frustum.update();}
  capture(){
    const mountVisible=this.mount.visible;this.mount.visible=false;this.frustum.visible=false;
    this.renderer.setRenderTarget(this.target);this.renderer.render(this.scene,this.sensor);this.renderer.readRenderTargetPixels(this.target,0,0,320,180,this.bytes);this.renderer.setRenderTarget(null);this.mount.visible=mountVisible;
    for(let y=0;y<180;y++)this.image.data.set(this.bytes.subarray((179-y)*1280,(180-y)*1280),y*1280);
    return this.image;
  }
  render(showFrustum:boolean){this.frustum.visible=showFrustum;this.controls.update();this.renderer.render(this.scene,this.overview);}
  async learn(progress:(p:number)=>void):Promise<Model>{
    const scene=new THREE.Scene();scene.background=new THREE.Color(0x121820);scene.add(new THREE.AmbientLight(0xffffff,2));
    const light=new THREE.DirectionalLight(0xffffff,2);light.position.set(2,4,4);scene.add(light);
    const drone=makeDrone();scene.add(drone);const camera=new THREE.PerspectiveCamera(45,1,.1,20);camera.position.set(0,0,3.2);camera.lookAt(0,0,0);
    const geometries=[new THREE.BoxGeometry(.8,.6,.4),new THREE.SphereGeometry(.4,16,12),new THREE.CylinderGeometry(.2,.3,.8,12),new THREE.TorusGeometry(.35,.07,8,16)];
    const negatives=geometries.map(g=>{const mesh=new THREE.Mesh(g,mat(0xe0e3de));mesh.visible=false;scene.add(mesh);return mesh;});
    const target=new THREE.WebGLRenderTarget(96,96);target.texture.colorSpace=THREE.SRGBColorSpace;const buf=new Uint8Array(96*96*4),img=new ImageData(96,96);
    const training:{x:number[];y:number}[]=[],validation:{x:number[];y:number}[]=[];
    let seed=7321;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
    for(let i=0;i<720;i++){
      const y=i%2===0?1:0;drone.visible=!!y;negatives.forEach(n=>n.visible=false);const obj=y?drone:negatives[Math.floor(rand()*negatives.length)];obj.visible=true;
      obj.rotation.set((rand()-.5)*1.8,rand()*Math.PI*2,(rand()-.5)*.4);light.intensity=1+rand()*2;
      this.renderer.setRenderTarget(target);this.renderer.render(scene,camera);this.renderer.readRenderTargetPixels(target,0,0,96,96,buf);
      for(let row=0;row<96;row++)img.data.set(buf.subarray((95-row)*384,(96-row)*384),row*384);
      const mask=maskImage(img),box=bounds(mask,96,96);if(box){const sample={x:features(mask,96,96,box),y};(i%10<2?validation:training).push(sample);}
      if(i%24===0){progress(i/720*.8);this.renderer.setRenderTarget(null);await new Promise(r=>setTimeout(r,0));}
    }
    this.renderer.setRenderTarget(null);progress(.85);await new Promise(r=>setTimeout(r,10));
    const model=train(training,validation);target.dispose();scene.traverse(o=>{if(o instanceof THREE.Mesh){o.geometry.dispose();(o.material as THREE.Material).dispose();}});progress(1);return model;
  }
}
