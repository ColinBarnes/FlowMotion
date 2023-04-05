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
  vlifetime = hash21( uvec2( gv ) ) * max(0., MAXLIFETIME-minLifetime) + minLifetime ; // Must match the lifetime in the SimulationShader
  float scale = 1. - fract( (iTime -.016)/vlifetime); // Nudged time by approx one frame to prevent scale "popping"
  scale *= mix( 1., 3., particleScale );
  vec4 modelViewPosition = modelViewMatrix * vec4(position*scale + vec3(pos,0.), 1.0);
 
  vparticleCount = particleCount;
  vseed = float(pcg( uint(index) + pcg(1u) ));
  vindex = index;

  gl_Position = projectionMatrix * modelViewPosition; 
}`;

export const fragShaderBasic = `
uniform sampler2D simulation;
uniform float iTime;
uniform float particleCount;

varying float vseed;
varying vec2 vUv;
varying float vlifetime;
varying float vindex;
varying float vparticleCount;
varying vec2 gv;

mat2 Rot(float a) {
    float s=sin(a), c=cos(a);
    return mat2(c, -s, s, c);
}

float icos( float a ) {
    return cos(a)*.5 +.5;
}

// Derivative of star
float dStar( float x ) {
    return step(0., x)*.5*x*x + step(0.,-x)*-.5*x*x;
}

vec4 star( vec2 uv ) {
    vec2 vUv = uv;
    uv = (uv*2.) - 1.;
    
    uv*= 2.;
    
    float d = length(uv);

    vec3 col = vec3(0.);

    float star = .05/d;
    uv *= .25;
    uv *= Rot( vseed  + iTime );
    vec2 st = uv;
    
    // Grow and shrink
    st *= icos(iTime + vseed )*25. + 1.;
    
    // Diagonal
    
    // Anti-aliasing
    // -------------
    // The function max(0., 1. - abs(st.x *st.y)*3000.) alias
    // We find the average value of that function covered by the pixel by
    // integrating and dividing by area covered. (Box Filter)
    
    // Determine the footprint of st
    vec2 dx = dFdx( st );
    vec2 dy = dFdy( st );
    
    // Determine area of the box to integrate
    vec2 w = max(abs(dx), abs(dy));
    vec2 uva = st - w/2.;
    vec2 uvb = st + w/2.;
    float res = (dStar(uvb.x)-dStar(uva.x))*(dStar(uvb.y)-dStar(uva.y));
    res /= (w.x*w.y);
    
    
    //star += max(0., 1. - abs(st.x*st.y)*3000.);
    star += max(0., 1. - res*3000.);
    
    // Rotate
    st *= Rot(3.1415/4. );
    
    // Diagonal
    // Anti-aliasing
    dx = dFdx( st );
    dy = dFdy( st );
    
    w = max(abs(dx), abs(dy));
    uva = st - w/2.;
    uvb = st + w/2.;
 
    
    res = (dStar(uvb.x)-dStar(uva.x))*(dStar(uvb.y)-dStar(uva.y));
    res /= (w.x*w.y);

    
    star += max(0., 1. - res*9000.) ;

    
    col += star;

    col *= 0.5 + 0.5*cos(iTime+vUv.xyx+vec3(0,2,4) );
    return vec4(col, star);
}

vec2 indexToGrid ( float i ) {
    vec2 gv = vec2(0.);
    
    float dim = ceil( sqrt( vparticleCount ) );
    
    gv.x = floor( i / dim );
    gv.y = mod( i , dim );
    
    return gv;
}

vec2 gridToUV( vec2 gv ) {
    vec2 uv = vec2( 0. );
    
    float dim = ceil( sqrt( vparticleCount ) );
    
    vec2 gridSize = vec2( 1. / dim );
    
    uv = gridSize * gv;
    uv += gridSize/2.;

    return uv;
}

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