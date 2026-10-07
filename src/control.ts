export type Detection = {box: [number,number,number,number]; confidence: number};
export type Mode = 'IDLE' | 'SEARCHING' | 'ACQUIRING' | 'TRACKING' | 'LOST' | 'MANUAL';
export const clamp = (x:number,a:number,b:number) => Math.max(a,Math.min(b,x));
export class Controller {
  pan=0; tilt=8; mode:Mode='IDLE'; hits=0; missing=0; direction=1; searchRow=0;
  limits={pan: [-160,160],tilt:[-15,55]};
  reset(){this.pan=0;this.tilt=8;this.mode='IDLE';this.hits=0;this.missing=0;this.searchRow=0;}
  update(d:Detection|null, dt:number, enabled:boolean, manual:boolean, fov=55) {
    dt=clamp(dt,0,0.15);
    if(!enabled){this.mode='IDLE';return;}
    if(manual){this.mode='MANUAL';this.hits=0;return;}
    if(d){
      this.hits++;this.missing=0;
      this.mode=this.hits>=3?'TRACKING':'ACQUIRING';
      const ex=(d.box[0]+d.box[2]/2)-.5, ey=(d.box[1]+d.box[3]/2)-.5;
      if(this.mode==='TRACKING'){
        const horizontalFov=2*Math.atan(Math.tan(fov*Math.PI/360)*16/9)*180/Math.PI;
        this.pan+=clamp(Math.abs(ex)>.025?ex*horizontalFov*2.4:0,-42,42)*dt;
        this.tilt+=clamp(Math.abs(ey)>.025?-ey*fov*2.4:0,-30,30)*dt;
      }
    } else {
      this.hits=0; this.missing+=dt;
      if(this.mode==='TRACKING'||this.mode==='ACQUIRING'||this.mode==='LOST'){
        this.mode='LOST'; if(this.missing<.65)return;
      }
      this.mode='SEARCHING';this.pan+=this.direction*35*dt;
      if(this.pan>=160||this.pan<=-160){this.direction*=-1;this.searchRow=(this.searchRow+1)%3;}
      this.tilt+=clamp(([8,25,-5][this.searchRow]-this.tilt)*2,-20,20)*dt;
    }
    this.pan=clamp(this.pan,...this.limits.pan as [number,number]);this.tilt=clamp(this.tilt,...this.limits.tilt as [number,number]);
  }
}
