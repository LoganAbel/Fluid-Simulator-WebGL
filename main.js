const SIM_RES = 256;

const ures = { value: new THREE.Vector2(SIM_RES, SIM_RES) }

const dye      = new RTPair(SIM_RES);
const vel      = new RTPair(SIM_RES);
const pressure = new RTPair(SIM_RES);
const divergence = newRT(SIM_RES);
const bounds = new RTPair(SIM_RES);

const usplat = {
  ures,
  upoint: { value: undefined },
  usrc: { value: undefined },
  ucolor: { value: undefined },
  uradius: { value: 0 }
}
const splat_pass = ShaderScene(splat_shader, usplat)

const udivergence = {
  ures,
  uvel: { value: undefined },
  ubounds: { value: undefined }
}
const divergence_pass = ShaderScene(divergence_shader, udivergence)

const uclear = { ures }
const clear_pass = ShaderScene(clear_shader, uclear)

const upressure = {
  ures,
  upressure: { value: undefined },
  udiv: { value: undefined }
}
const pressure_pass = ShaderScene(pressure_shader, upressure)

const ugradientsub = {
  ures,
  upressure: { value: undefined },
  uvel: { value: undefined }
}
const gradientsub_pass = ShaderScene(gradientsub_shader, ugradientsub)

const udiffuse = {
  ures,
  usrc: { value: undefined },
  udif: { value: 0 }
}
const diffuse_pass = ShaderScene(diffuse_shader, udiffuse)

const uadvect = {
  ures,
  uvel: { value: undefined },
  usrc: { value: undefined },
  udisipate: { value: 0 }
}
const advect_pass = ShaderScene(advect_shader, uadvect)

const udrawshaded = {
  ures,
  usrc: {value: undefined},
  ubounds: {value: undefined}
}
const drawshaded_pass = ShaderScene(drawshaded_shader, udrawshaded)

const udrawunshaded = {
  ures,
  usrc: {value: undefined},
  ubounds: {value: undefined}
}
const drawunshaded_pass = ShaderScene(drawunshaded_shader, udrawunshaded)

// ==========================================

const shaded_options = document.querySelector('#shading')

const diffuse_dye_option = document.querySelector('#diffuse-dye')
const diffuse_speed_option = document.querySelector('#diffuse-speed')

const disipate_dye_option = document.querySelector('#dissipate-dye')
const disipate_speed_option = document.querySelector('#dissipate-speed')

const radius_option = document.querySelector('#radius')

let mpos = [0,0]
let dmpos = undefined
let mldown = false
let mrdown = false
let mbounds_color = false;
let mcolor = undefined

canvas.addEventListener('contextmenu', e=> e.preventDefault())
canvas.onmousedown = e => {
  mldown = e.button == 0
  mrdown = e.button == 2
  mpos = mousePos(e.clientX, e.clientY);
  dmpos = [0,0];
  mcolor = HSVtoRGB(Math.random(), .5, 1)
  if(mrdown) {
    const read = new Float32Array( 4 );
    renderer.readRenderTargetPixels( bounds._read, mpos[0] * SIM_RES, mpos[1] * SIM_RES, 1, 1, read );
    mbounds_color = 1 - read[0]
  }
}
canvas.onmouseup = e => {
  mldown = false;
  mrdown = false;
}
canvas.onmousemove = e => {
  const new_mpos = mousePos(e.clientX, e.clientY)
  dmpos = [new_mpos[0] - mpos[0], new_mpos[1] - mpos[1]];
  mpos = new_mpos;
}

const render =()=> {
  if (mrdown) {
    usplat.uradius.value = radius_option.value / 400. * (1 + .5 * (mbounds_color < .5));
    usplat.upoint.value = mpos;
    usplat.ucolor.value = new THREE.Vector4(mbounds_color,mbounds_color,mbounds_color,mbounds_color);
    usplat.usrc.value = bounds.read
    renderer.setRenderTarget(bounds.write);
    renderer.render(splat_pass, camera);
    bounds.swap()
  }

  if (mldown && dmpos.some(v=>v!=0)) {
    usplat.uradius.value = radius_option.value / 200.;

    usplat.upoint.value = new THREE.Vector2(...mpos);
    usplat.ucolor.value = new THREE.Vector4(100*dmpos[0], 100*dmpos[1],0,0);
    usplat.usrc.value = vel.read
    renderer.setRenderTarget(vel.write);
    renderer.render(splat_pass, camera);
    vel.swap()

    usplat.upoint.value = mpos;
    usplat.ucolor.value = new THREE.Vector4(...mcolor,1);
    usplat.usrc.value = dye.read
    renderer.setRenderTarget(dye.write);
    renderer.render(splat_pass, camera);
    dye.swap()
  }

  for(let i = 0; i < 4; i ++) {
    udiffuse.udif.value = diffuse_speed_option.value;
    diffuse(vel)
    project()
    uadvect.udisipate.value = disipate_speed_option.value / 5000;
    advect(vel, vel)
    project()

    udiffuse.udif.value = diffuse_dye_option.value;
    diffuse(dye)
    uadvect.udisipate.value = disipate_dye_option.value / 5000;
    advect(dye, vel)
  }

  renderer.setRenderTarget(null);

  if(shaded_options.checked) {
    udrawshaded.ubounds.value = bounds.read
    udrawshaded.usrc.value = dye.read;
    renderer.render(drawshaded_pass, camera);
  } else {
    udrawunshaded.ubounds.value = bounds.read
    udrawunshaded.usrc.value = dye.read;
    renderer.render(drawunshaded_pass, camera);
  }

  requestAnimationFrame(render);
}
requestAnimationFrame(render);