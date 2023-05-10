import { ShaderMaterial, WebGLRenderTarget } from "three";
import { TGALoader } from 'three/examples/jsm/loaders/TGALoader';
import { fragShaderBasic, fragShaderClassic, fragShaderFlipBook, vertexShaderBasic } from "./Shaders";
import { useEffect, useMemo, useRef } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import { ParticleTypes } from "./ParticlesSource";

const Uniforms = {
    iTime: {
        value: 0.0
    },
    MAXLIFETIME: {
        value: 5
    },
    simulation: {
        value: null
    },
    particleCount: {
        value: 10
    },
    particleScale: {
        value: 0
    },
    flipBook1: {
        value: null
    },
    flipBook2: {
        value: null
    },
    flipBook3: {
        value: null
    }
};

type Props = {
    particleType?: ParticleTypes,
    count: number,
    simulation: WebGLRenderTarget,
    maxLifeTime?: number,
    volume?: React.MutableRefObject<number | null>
}
const useClassic = false;
const useFlipBook = true;
function Renderer({count, simulation, maxLifeTime, volume, particleType='DEFAULT'}: Props) {
    const particleMaterialRef = useRef<ShaderMaterial>(null);
    
    const flipBook1 = useLoader(TGALoader, '/Assets/Flipbooks/WispySmoke01-flipbooks/WispySmoke01_8x8.tga');
    useEffect( () => {
        if(particleMaterialRef.current) {
            particleMaterialRef.current.uniforms.flipBook1.value = flipBook1;
        }
    }, [flipBook1]);

    const flipBook2 = useLoader(TGALoader, '/Assets/Flipbooks/WispySmoke02-flipbooks/WispySmoke02_8x8.tga');
    useEffect( () => {
        if(particleMaterialRef.current) {
            particleMaterialRef.current.uniforms.flipBook2.value = flipBook2;
        }
    }, [flipBook2]);

    const flipBook3 = useLoader(TGALoader, '/Assets/Flipbooks/WispySmoke03-flipbooks/WispySmoke03_8x8.tga');
    useEffect( () => {
        if(particleMaterialRef.current) {
            particleMaterialRef.current.uniforms.flipBook3.value = flipBook3;
        }
    }, [flipBook3]);

    const index = useMemo( () => {
        const index = new Float32Array( count );
        for(let i=0; i<count; i++) {
            index[i] = i;
        }
        return index;
    }, [count] ); 

    const particlesPosition = useMemo( () => {
        const pos = new Float32Array( count );
        for(let i=0; i<count; i++) {
            pos[i*3 + 0] = (Math.random() * 2. -1.)*4.;
            pos[i*3 + 1] = (Math.random() * 2. -1.)*4.;
            pos[i*3 + 2] = 0;
        }
        return pos;
    }, [count] );

    useFrame( (state, delta) => { 
        const {gl, clock} = state;

        if( particleMaterialRef.current !== null ) {
            particleMaterialRef.current.uniforms.iTime.value = clock.elapsedTime;
            particleMaterialRef.current.uniforms.simulation.value = simulation.texture;
            particleMaterialRef.current.uniforms.MAXLIFETIME.value = maxLifeTime;
            particleMaterialRef.current.uniforms.particleCount.value = count;
            particleMaterialRef.current.uniforms.particleScale.value = volume?.current;
        }        
    });

    return (
        <>
            <instancedMesh args={[undefined, undefined, count]} >
                <planeGeometry args={[2,2]}>
                    <instancedBufferAttribute
                        attach="attributes-index"
                        count={ count }
                        array={index}
                        itemSize={1}
                    />
                    <instancedBufferAttribute
                        attach="attributes-offset"
                        count={ count }
                        array={particlesPosition}
                        itemSize={3}
                    />
                </planeGeometry>
                {particleType == 'DEFAULT' && <shaderMaterial ref={particleMaterialRef}
                    depthWrite={false}
                    fragmentShader={fragShaderBasic}
                    vertexShader={vertexShaderBasic}
                    uniforms={Uniforms}
                    transparent={true}
                />}
                {particleType == 'SMOKE' && <shaderMaterial ref={particleMaterialRef}
                    depthWrite={false}
                    fragmentShader={fragShaderFlipBook}
                    vertexShader={vertexShaderBasic}
                    uniforms={Uniforms}
                    transparent={true}
                />}
            </instancedMesh>
        </>
    )
}

export default Renderer;