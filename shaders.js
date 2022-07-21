const vs = `
varying vec2 vC;
varying vec2 vL;
varying vec2 vR;
varying vec2 vT;
varying vec2 vB;

uniform vec2 ures;

void main()
{
    vC = uv;
    vL = uv + vec2(-1,0)/ures;
    vR = uv + vec2(1,0) /ures;
    vT = uv + vec2(0,1) /ures;
    vB = uv + vec2(0,-1)/ures;
    gl_Position = vec4(position, 1);
}
`

const diffuse_shader = `
varying vec2 vC;
varying vec2 vL;
varying vec2 vR;
varying vec2 vT;
varying vec2 vB;

uniform float udif;
uniform sampler2D usrc;

void main() {
  gl_FragColor = (texture2D(usrc, vC) + udif * (
    + texture2D(usrc, vL)
    + texture2D(usrc, vR)
    + texture2D(usrc, vT)
    + texture2D(usrc, vB)
  )) / (1. + udif * 4.);
}
`

const advect_shader = `
varying vec2 vC;
varying vec2 vL;
varying vec2 vR;
varying vec2 vT;
varying vec2 vB;

uniform vec2 ures;
uniform sampler2D usrc;
uniform sampler2D uvel;

uniform float udisipate;

void main() {
  gl_FragColor = texture2D(usrc, vC - texture2D(uvel, vC).xy / ures) / (1.0 + udisipate);
}
`

const splat_shader = `
varying vec2 vC;

uniform sampler2D usrc;
uniform vec2 upoint;
uniform vec4 ucolor;
uniform float uradius;

void main() {
  gl_FragColor = mix(texture2D(usrc, vC), ucolor, float(distance(vC, upoint) < uradius));
}
`

const divergence_shader = `
varying vec2 vC;
varying vec2 vL;
varying vec2 vR;
varying vec2 vT;
varying vec2 vB;

uniform sampler2D uvel;
uniform sampler2D ubounds;

void main() {
  float L = texture2D(uvel, vL).x;
  float R = texture2D(uvel, vR).x;
  float T = texture2D(uvel, vT).y;
  float B = texture2D(uvel, vB).y;

  vec2 C = texture2D(uvel, vC).xy;
  if (vL.x < 0.0 || texture2D(ubounds, vL).a > .5) { L = -C.x; }
  if (vR.x > 1.0 || texture2D(ubounds, vR).a > .5) { R = -C.x; }
  if (vT.y > 1.0 || texture2D(ubounds, vT).a > .5) { T = -C.y; }
  if (vB.y < 0.0 || texture2D(ubounds, vB).a > .5) { B = -C.y; }

  gl_FragColor = vec4(.5 * (R - L + T - B),0,0,1);
}
`

const clear_shader = `
void main() {
	gl_FragColor = vec4(0);
}
`

const pressure_shader = `
varying vec2 vC;
varying vec2 vL;
varying vec2 vR;
varying vec2 vT;
varying vec2 vB;

uniform sampler2D udiv;
uniform sampler2D upressure;

void main() {
  gl_FragColor = vec4(.25 * ( 
  	- texture2D(udiv, vC).x
  	+ texture2D(upressure, vR).x
  	+ texture2D(upressure, vL).x
  	+ texture2D(upressure, vT).x
  	+ texture2D(upressure, vB).x
  ),0,0,0);
}
`

const gradientsub_shader = `
varying vec2 vC;
varying vec2 vL;
varying vec2 vR;
varying vec2 vT;
varying vec2 vB;

uniform sampler2D uvel;
uniform sampler2D upressure;

void main() {
  gl_FragColor = vec4(
    texture2D(uvel, vC).xy - vec2(
      + texture2D(upressure, vR).x
      - texture2D(upressure, vL).x,
      + texture2D(upressure, vT).x
  	  - texture2D(upressure, vB).x
    ),
  0,0);
}	
`

const drawshaded_shader = `
varying vec2 vC;
varying vec2 vL;
varying vec2 vR;
varying vec2 vT;
varying vec2 vB;

uniform sampler2D usrc;
uniform vec2 ures;
uniform sampler2D ubounds;

void main() {
  float dx = texture2D(usrc, vR).a - texture2D(usrc, vL).a;
  float dy = texture2D(usrc, vT).a - texture2D(usrc, vB).a;

  vec3 n = normalize(cross(vec3(1./ures.x,0,dx),vec3(0,1./ures.y,dy)));
  vec3 l = normalize(vec3(0.0, 1.0, 1.0));

  gl_FragColor = texture2D(ubounds, vC).a > .5 ? vec4(0,0,0,1)
  	:  texture2D(ubounds, vT).a > .5
  	|| texture2D(ubounds, vL).a > .5
  	|| texture2D(ubounds, vB).a > .5
  	|| texture2D(ubounds, vR).a > .5 ? vec4(1)
  	: vec4(texture2D(usrc, vC).rgb * clamp(dot(n,l), 0.5, 1.), 1);
}
`

const drawunshaded_shader = `
varying vec2 vC;
varying vec2 vL;
varying vec2 vR;
varying vec2 vT;
varying vec2 vB;

uniform sampler2D usrc;
uniform vec2 ures;
uniform sampler2D ubounds;

void main() {
  gl_FragColor = 
  	texture2D(ubounds, vC).a > .5 ? vec4(0,0,0,1)
  	:  texture2D(ubounds, vT).a > .5
  	|| texture2D(ubounds, vL).a > .5
  	|| texture2D(ubounds, vB).a > .5
  	|| texture2D(ubounds, vR).a > .5 ? vec4(1)
  	: vec4(texture2D(usrc, vC).rgb, 1);
}
`