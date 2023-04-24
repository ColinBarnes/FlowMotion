import { Vector2 } from "three";

const FluidColorShader = {

	uniforms: {

		'previousFrame': { value: null },
        'velocity': {value: null},
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
        uniform sampler2D velocity;

        struct Pose {
            vec2 pos;
            vec2 vel;        
        };
        
        uniform Pose Forces[ 2 ];

        varying vec2 vUv;

        // Helpers

        //----- From: https://www.alanzucconi.com/2017/07/15/improving-the-rainbow-2/

        // Based on GPU Gems
        // Optimised by Alan Zucconi
        vec3 bump3y (vec3 x, vec3 yoffset) {
            vec3 y = 1. - x * x;
            y = clamp(y-yoffset, 0., 1.);
            return y;
        }
        vec3 spectral_zucconi(float x) {
            // x: [0,   1]
            vec3 cs = vec3(3.54541723, 2.86670055, 2.29421995);
            vec3 xs = vec3(0.69548916, 0.49416934, 0.28269708);
            vec3 ys = vec3(0.02320775, 0.15936245, 0.53520021);
            return bump3y (    cs * (x - xs), ys);
        }

        //----- END

        float icos( float ang ) {
            return cos(ang)*.5 + .5;
        }

		void main() {
            vec2 uv = vUv;
            vec2 texel = vec2( dFdx(uv.x), dFdy(uv.y) );
            if( iTime < 1.5 ) {
                vec3 col = vec3(0.);
                gl_FragColor = vec4(col, 1.);
                return;
            }

            vec2 vel = texture2D( velocity, uv ).xy;
            
            vec3 col = texture2D( previousFrame, uv - vel * texel ).rgb; // Advection
            // Debuging
            //vec3 col = texture2D(previousFrame, uv).rgb;
            col *= .9; // Decay

            // Color Pose Forces
            for( int i =0; i < 2; i++ ) {
                if( length(Forces[i].vel) > 0. ) {
                    float dist = length( uv - Forces[i].pos );
                    col += ( .001 / (dist*dist) ) * spectral_zucconi(  icos(iTime) );
                }
            }

            // Debuging
            //col = texture2D( velocity, uv).rgb;
            //col = vec3(0.,1.,0.);
            gl_FragColor = vec4(col, 1.);

            //gl_FragColor = vec4(uv.x, uv.y, 0., 1.);
		}`

};

export { FluidColorShader };