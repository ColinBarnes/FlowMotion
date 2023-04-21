export const vertexShaderSimulation = `
uniform float iTime;

varying vec2 vUv;

void main() {
  vUv = uv; 
  
  vec4 modelViewPosition = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * modelViewPosition; 
}`;

export const fragShaderSimulation = `
uniform float iTime;
uniform float iTimeDelta;
uniform sampler2D lastFrame;
uniform bool emitterActive;
uniform vec2 emitterPos;
uniform float MAXLIFETIME;
uniform float particleCount;
uniform vec2 forcePoint;
uniform float forcePointActive;
uniform bool handsActive;
uniform vec2 hands[2];
uniform float MAXSPEED;
uniform float volume;
uniform float gravityMagnitude;

//float MAXSPEED = 5.;

varying vec2 vUv;

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

vec2 gridToUV( vec2 gv ) {
    vec2 uv = vec2( 0. );
    
    float dim = ceil( sqrt( particleCount ) );
    
    vec2 gridSize = vec2( 1. / dim );
    
    uv = gridSize * gv;
    uv += gridSize/2.;

    return uv;
}

vec2 pointToForce( vec2 p, vec2 uv  ) {
    vec2 dir = p - uv;
    return normalize(dir)/pow( length(dir), 2.);
}

void main()	{
    vec2 uv = vUv;

    float dim = ceil( sqrt( particleCount ) );
    vec2 gv = floor( uv * dim ); // Grid coordinates
    vec4 posVel = texture(lastFrame, gridToUV( gv ) );
    
    vec2 Pos = posVel.xy;
    vec2 Vel = posVel.zw;
    vec2 Acc = vec2(0., gravityMagnitude); // gravity

    Acc += pointToForce( forcePoint, Pos )*10. * forcePointActive;

    if(handsActive) {
        for(int i = 0; i < hands.length(); i++) {
            Acc += pointToForce( hands[i], Pos )*10.;
        }
    }
    
    Vel += Acc*iTimeDelta;

    // Speed limit
    Vel = min( length( Vel ), MAXSPEED ) * normalize( Vel );

    Pos += Vel*iTimeDelta;

    posVel = vec4(Pos, Vel);

    // Total lifetime of particle is between [minLifetim,MAXLIFETIME]
    float minLifetime = 1.;
    float lifeTime = hash21( uvec2( gv ) ) * max(0., MAXLIFETIME-minLifetime) + minLifetime ; // Must match the lifetime in particle

    // How far along in its lifetime is it
    float life = fract( iTime/lifeTime);
    
    // How far along was it during the last frame
    float lifeLast = fract( (iTime-iTimeDelta)/lifeTime );


    // Initially start with random positions and velocities
    if( iTime < 1.5 || life < lifeLast ) {
        Pos = emitterPos;

        // Debug
        /*
            Pos = hash22( uvec2( uint(gv.x) + pcg( 0u ) + pcg( uint(iTime*1000.) ) , uint(gv.y) + pcg( 0u ) + pcg( uint(iTime*1000.) ) ) );
            Pos = Pos*2. -1.;
            Pos *= 4.;
        */
        
        // Lissajous curve
        float s = .25;
        float w = 2.;
        float h = 2.;
        if(!emitterActive) {
            Pos = vec2( w*sin( 5.*iTime*s + 3.1415/2. ), h*sin( 4.*iTime*s ) );
        }        

        // Random velocity between [-1,1]
        Vel = hash22( uvec2( uint(gv.x) + pcg( uint(iTime*1000.) ), uint(gv.y) + pcg( uint(iTime*1000.) ) ) );
        
        // Disc sampling with Vel.x as radius
        // see: https://gieseanw.wordpress.com/2021/10/15/uniform-random-sampling-on-a-disc/
        Vel.x = sqrt(Vel.x)*4.* mix(1., 4., volume); 
        Vel = vec2( Vel.x*cos(Vel.y*2.*3.1415), Vel.x*sin(Vel.y*2.*3.1415) );

        if(!emitterActive) {
            Vel += vec2( 5. * w * s * cos( 5. * iTime*s + 3.1415/2. ),  4. * w * s * cos( 4. * iTime ) );
        }
        posVel = vec4(Pos, Vel);
    }

    gl_FragColor = posVel;
}`;