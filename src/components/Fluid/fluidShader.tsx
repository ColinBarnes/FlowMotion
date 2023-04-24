import { Vector2 } from "three";

const FluidShader = {

	uniforms: {

		'previousFrame': { value: null },
        'iTime': {value: 0.0},
        'Forces': {
            value: [
                {
                    pos: new Vector2(0,0),
                    vel: new Vector2(1,1)
                },
                {
                    pos: new Vector2(0,0),
                    vel: new Vector2(0,0)
                }
             ]
        }
	},

	vertexShader: /* glsl */`
		varying vec2 vUv;
		void main() {
			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
		}`,

	fragmentShader: /* glsl */`
        uniform float iTime;
		uniform sampler2D previousFrame;
        
        struct Pose {
            vec2 pos;
            vec2 vel;        
        };
        
        uniform Pose Forces[ 2 ];

        varying vec2 vUv;

		void main() {
            vec2 uv = vUv;
            vec2 texel = vec2( dFdx(uv.x), dFdy(uv.y) );

            if( iTime < 1.5 ) {
                //uv *= 5.;
                vec3 col = vec3( cos( 2. * 3.14159 * uv.y ), cos( 2. * 3.14159 * uv.x), 0.5 );
                //vec3 col = vec3(0.);
                //col = vec3(0.,1.,0.);
                gl_FragColor = vec4(col, 1.);
                return;
            }
            
            // Adapted from https://www.researchgate.net/publication/229039366_Simple_and_Fast_Fluids
            
            float dt = 0.15;
            float v = 0.5; // Viscosity
            float vorticity = .4;
            vec2 ExternalForces = vec2( 0. );
            vec4 CScale = vec4(.5);
            float K = .2;
            float S = K/dt;
            
            vec4 FC = texture2D( previousFrame, uv );
            vec4 FR = texture2D( previousFrame, fract(uv + vec2(1., 0.)*texel) );
            vec4 FL = texture2D( previousFrame, fract(uv - vec2(1., 0.)*texel) );
            vec4 FT = texture2D( previousFrame, fract(uv + vec2(0., 1.)*texel) );
            vec4 FD = texture2D( previousFrame, fract(uv - vec2(0., 1.)*texel) );
            
            // du/dx , du/dy
            vec4 UdX = (FR - FL) * CScale;
            vec4 UdY = (FT - FD) * CScale;

            
            float Udiv = UdX.x + UdY.y;
            vec2 DdX = vec2( UdX.z, UdY.z );
            
            
            //
            // Solve for density
            //
            FC.z -= dt * dot( vec3(DdX, Udiv) , FC.xyz );
            
            //
            // Solve for Velocity
            //
            vec2 PdX = S * DdX;
            vec2 Laplacian = ( FR + FL + FT + FD - 4.*FC ).xy;
            
        
            vec2 ViscosityForce = v*Laplacian;
            
            // Semi-lagrangian advection
            vec2 Was = uv - dt*FC.xy*texel;
            FC.xyw = texture2D( previousFrame, Was ).xyw;

            // Add Pose Forces
            for( int i =0; i < 2; i++ ) {
                if( length(Forces[i].vel) > 0. ) {
                    float dist = length( uv - Forces[i].pos );
                    ExternalForces += Forces[i].vel * ( 1. / (dist*dist) );
                }
            }
        
            
            FC.xy += dt*( ViscosityForce - PdX + ExternalForces );
            FC.xy *= .999; // Decay
            
            // Vorticity
            FC.w = FT.x - FD.x + FL.y - FR.y; // Curl
            vec2 dir;
            dir.x = abs( FD.w ) - abs( FT.w );
            dir.y = abs( FR.w ) - abs( FL.w );
            dir *= vorticity / ( length(dir) + .00001 );
            FC.xy += dt * FC.w * dir ;
        
            
            FC = clamp(FC, vec4(-10.,-10.,0.5, -10.), vec4(10.,10.,3.,10.));
        
            gl_FragColor = FC;
            //gl_FragColor = vec4(0., 0., 1., 1.);
            //gl_FragColor = vec4(uv.x, uv.y, 0., 1.);
		}`

};

export { FluidShader };