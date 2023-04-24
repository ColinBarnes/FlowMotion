

const DisplayShader = {
    uniforms: {
        'color': { value: null }
    },

    vertexShader: /* glsl */`
		varying vec2 vUv;
		void main() {
			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
		}`,
    
        fragmentShader: /* glsl */`
		uniform sampler2D color;
        varying vec2 vUv;

		void main() {
            vec2 uv = vUv;

            vec3 col = texture2D( color, vec2(uv.x, 1. - uv.y ) ).rgb;

            //col = vec3(0.,1.,0.);
            gl_FragColor = vec4(col, 1.);
		}`

}

export { DisplayShader };