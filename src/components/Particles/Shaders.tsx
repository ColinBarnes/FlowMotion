export const vertexShaderBasic = `
uniform float iTime;
uniform float MAXLIFETIME;
uniform sampler2D simulation;
uniform float particleCount;
uniform float particleScale;

attribute float index;
attribute vec3 offset;

varying vec2 vUv;
varying float vindex;
varying float vlifetime;
varying float vseed;
varying float vparticleCount;
varying vec2 gv;

//----- From: https://www.shadertoy.com/view/XlGcRh

// https://www.pcg-random.org/
uint pcg(uint v)
{
	uint state = v * 747796405u + 2891336453u;
	uint word = ((state >> ((state >> 28u) + 4u)) ^ state) * 277803737u;
	return (word >> 22u) ^ word;
}

uvec2 pcg2d(uvec2 v)
{
    v = v * 1664525u + 1013904223u;

    v.x += v.y * 1664525u;
    v.y += v.x * 1664525u;

    v = v ^ (v>>16u);

    v.x += v.y * 1664525u;
    v.y += v.x * 1664525u;

    v = v ^ (v>>16u);

    return v;
}

float hash21(uvec2 p) {
    uint r = pcg(pcg(p.x) + p.y);
    return float(r) * (1.0/float(0xffffffffu));
}

vec2 hash22(uvec2 p) {
    uvec2 r = pcg2d( p );
    return vec2(r) * (1.0/float(0xffffffffu));
}

vec2 indexToGrid ( float i ) {
    vec2 gv = vec2(0.);
    
    float dim = ceil( sqrt( particleCount ) );
    
    gv.x = floor( i / dim );
    gv.y = mod( i , dim );
    
    return gv;
}

vec2 gridToUV( vec2 gv ) {
    vec2 uv = vec2( 0. );
    
    float dim = ceil( sqrt( particleCount ) );
    
    vec2 gridSize = vec2( 1. / dim );
    
    uv = gridSize * gv;
    uv += gridSize/2.;

    return uv;
}

void main() {
  vUv = uv;
  
  gv = indexToGrid( index );
  vec2 pos = texture(simulation, gridToUV( gv ) ).xy;

  // Debug
  //pos = offset.xy;

  float minLifetime = 1.;

  // How long this partilce lasts in seconds (different for each particle)
  vlifetime = hash21( uvec2( gv ) ) * max(0., MAXLIFETIME-minLifetime) + minLifetime ; // Must match the lifetime in the SimulationShader
  float scale = 1. - fract( (iTime -.016)/vlifetime); // Nudged time by approx one frame to prevent scale "popping"
  scale *= mix( 1., 3., particleScale );
  vec4 modelViewPosition = modelViewMatrix * vec4(position*scale + vec3(pos,0.), 1.0);
 
  vparticleCount = particleCount;
  vseed = float(pcg( uint(index) + pcg(1u) )); // A unique value per particle
  vindex = index; // particle number

  gl_Position = projectionMatrix * modelViewPosition; 
}`;

export const fragShaderBasic = `
uniform sampler2D simulation;
uniform float iTime;
uniform float particleCount;

varying vec2 vUv;
varying float vlifetime;

void main()	{
    vec2 uv = vUv*2. -1.;
    vec2 st = uv;
    uv *= 10.;

    float d = (1. - pow(length(st),1.3) )/length(uv);

    vec3 col = 0.5 + 0.5*cos(vlifetime + iTime+vec3(0,2,4) );
    //col *= d; // Dark 'glow'

    float d2 = pow(d, 2.);
    if( d2 < .1) discard; // Improve performance when many particles are stacked
    gl_FragColor = vec4(col,d2 );
}`;

export const fragShaderClassic = `
uniform float iTime;
varying vec2 vUv;

varying float vseed;

mat2 Rot(float a) {
    float s=sin(a), c=cos(a);
    return mat2(c, -s, s, c);
}

float icos( float a ) {
    return cos(a)*.5 +.5;
}

void main()	{
    vec2 uv = vUv;
    uv = (uv*2.) - 1.;
    
    float d = length(uv);

    vec3 col = vec3(0.);

    float star = .05/d;
    uv *= .25;
    uv *= Rot( vseed  + iTime );
    vec2 st = uv;
    st *= icos(iTime + vseed )*25. + 1.;
    star += max(0., 1. - abs(st.x*st.y*3000.));

    st *= Rot(3.1415/4. );
    star += max(0., 1. - abs(st.x*st.y*9000.)) ;

    col += star;

    col *= 0.5 + 0.5*cos(iTime+vUv.xyx+vec3(0,2,4) );


    // Output to screen
    gl_FragColor = vec4(col, star);
}`

export const fragShaderFlipBook = `
uniform sampler2D simulation;
uniform float iTime;
uniform float particleCount;

uniform sampler2D flipBook1;
uniform sampler2D flipBook2;
uniform sampler2D flipBook3;

varying vec2 vUv;
varying float vlifetime;
varying float vseed;

float duration = 2.;
float totalFrames = 64.;

vec2 frameToUV( float frame, vec2 uv ) {
    float dim = sqrt( totalFrames );
    float frameSize = 1./dim;
    float row = floor( frame / dim );
    //row = dim - row;
    float col = floor( frame - row*dim );
    vec2 gv = vec2( col, row );
    return (gv + uv)*frameSize;
}

// https://www.shadertoy.com/view/4tlSzl
vec3 firePalette(float i){

    float T = 1400. + 1300.*i; // Temperature range (in Kelvin).
    vec3 L = vec3(7.4, 5.6, 4.4); // Red, green, blue wavelengths (in hundreds of nanometers).
    L = pow(L,vec3(5)) * (exp(1.43876719683e5/(T*L)) - 1.);
    return 1. - exp(-5e8/L); // Exposure level. Set to "50." For "70," change the "5" to a "7," etc.
}


void main()	{
    vec2 uv = vUv;
    float t = fract( iTime / vlifetime );
    float frame = floor( t * totalFrames );
    vec2 st = frameToUV( frame, uv );

    float group = vseed * (1.0/float(0xffffffffu));
    float textNum = 3.;

    vec4 col = vec4(0.);
    if( group * textNum < 1. ) {
        col = texture2D(flipBook1, st);
        //col = vec4(col.r,0.,0.,col.a);
    } else if( group * textNum < 2. ) {
        col = texture2D(flipBook2, st);
        //col = vec4(0.,col.g,0.,col.a);
    } else {
        col = texture2D(flipBook3, st);
    }

    /* Fire
    vec3 fire = firePalette( 1. -  col.r );
    col.rgb = fire;
    */
    if( col.a < .1) discard; // Improve performance when many particles are stacked
    gl_FragColor = vec4(col.rgb, col.a*(1.-t) );
}`;