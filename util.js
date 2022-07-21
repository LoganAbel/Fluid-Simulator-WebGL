const HSVtoRGB =(h, s, v)=> {
  const c = v * s;
  const x = c * (1 - Math.abs((h * 6) % 2 - 1))
  const m = v - c

  const i = Math.floor(h * 6 + 1) % 6
  let rgb = [m, m, m]
  rgb[Math.floor(i/2)%3] += c
  rgb[2-(i%3)] += x
  return rgb
}

const ShaderScene =(fragmentShader, uniforms)=> {
  const scene = new THREE.Scene();
  scene.add(new THREE.Mesh(
    new THREE.PlaneBufferGeometry(2, 2),
    new THREE.ShaderMaterial({
      fragmentShader,
      vertexShader: vs,
      uniforms
    })
  ));
  return scene
}

class RTPair {
  constructor(SIM_RES) {
    this.write = newRT(SIM_RES)
    this._read = newRT(SIM_RES)
    this.read = this._read.texture
  }
  swap() {
    [this.write, this._read] = [this._read, this.write]
    this.read = this._read.texture
  }
}

const newRT =(SIM_RES)=> new THREE.WebGLRenderTarget( 
  SIM_RES, SIM_RES, 
  { 
    type: THREE.FloatType, 
    wrapS: THREE.ClampToEdgeWrapping,
    wrapT: THREE.ClampToEdgeWrapping
  }
);

const mousePos=(x,y)=> {
  const rect = canvas.getBoundingClientRect();
  const style = window.getComputedStyle(document.querySelector("#canvas"))
  return [
    (x - rect.left) / +style.width.slice(0,-2),
    (rect.height - (y - rect.top) - 1) / +style.height.slice(0,-2)
  ]
}

const project =()=> {
  udivergence.ubounds.value = bounds.read;
  udivergence.uvel.value = vel.read;
  renderer.setRenderTarget(divergence);
  renderer.render(divergence_pass, camera)

  renderer.setRenderTarget(pressure.write);
  renderer.render(clear_pass, camera)
  pressure.swap()

  upressure.udiv.value = divergence.texture
  for(let i = 0; i < 6; i ++) {
    upressure.upressure.value = pressure.read
    renderer.setRenderTarget(pressure.write);
    renderer.render(pressure_pass, camera)
    pressure.swap()
  }

  ugradientsub.uvel.value = vel.read
  ugradientsub.upressure.value = pressure.read
  renderer.setRenderTarget(vel.write);
  renderer.render(gradientsub_pass, camera)
  vel.swap()
}

const advect =(src, vel)=> {
  uadvect.uvel.value = vel.read;
  uadvect.usrc.value = src.read;
  renderer.setRenderTarget(src.write);
  renderer.render(advect_pass, camera);
  src.swap()
}

const diffuse =src=> {
  for(let i = 0; i < 6; i ++) {
    udiffuse.usrc.value = src.read
    renderer.setRenderTarget(src.write);
    renderer.render(diffuse_pass, camera);
    src.swap()
  }
}

// ===========================================================
const canvas = document.querySelector("#canvas");
const renderer = new THREE.WebGLRenderer({canvas});
const camera = new THREE.OrthographicCamera(-1,1,1,-1,-1,1);
