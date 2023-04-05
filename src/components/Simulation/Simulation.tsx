import { useFBO } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useControls } from "leva";
import { useMemo, useRef } from "react";

import { FloatType, NearestFilter, OrthographicCamera, RGBAFormat, Scene, ShaderMaterial, Vector2 } from "three";
import { fragShaderSimulation, vertexShaderSimulation } from "../Particles/SimulationShaders";


const Simulation = ( { count = 10, maxLifeTime = 5 } ) => {
    const textureSize = useMemo( () => Math.ceil(Math.sqrt(count)), [count]);

    const fragShader = useMemo( () => fragShaderSimulation, []);
    const vertexShader = useMemo( () => vertexShaderSimulation, []);
    const scene = useMemo( () => {
        return new Scene();
    }, []);
    const shaderSimulationRef = useRef<ShaderMaterial>(null);
    const swap = useRef(false);
    
    const camera = useMemo( () => new OrthographicCamera(-1, 1, 1, -1, 1 / Math.pow(2, 53), 1), []);
    
    const renderTargetA = useFBO(textureSize, textureSize, {
        minFilter: NearestFilter,
        magFilter: NearestFilter,
        format: RGBAFormat,
        stencilBuffer: false,
        type: FloatType,
    });

    const renderTargetB = useFBO(textureSize, textureSize, {
        minFilter: NearestFilter,
        magFilter: NearestFilter,
        format: RGBAFormat,
        stencilBuffer: false,
        type: FloatType,
    });
    
    
    //const renderTargetA = useFBO(simSize,simSize);
    //const renderTargetB = useFBO(simSize,simSize);
    const uniforms = useMemo( () => ({
        iTime: {
            value: 0.
        },
        iTimeDelta: {
            value: 0.
        },
        lastFrame: {
            value: swap.current ? renderTargetB.texture : renderTargetA.texture
        },
        emmiterPos: {
            value: new Vector2(0.5, 0.5)
        },
        MAXLIFETIME: {
            value: maxLifeTime
        },
        particleCount: {
            value: count
        }
    }), [count, maxLifeTime, renderTargetA.texture, renderTargetB.texture]);

    useFrame( (state, delta) => {
        const {gl, clock} = state;
        if(shaderSimulationRef.current !== null) {
            shaderSimulationRef.current.uniforms.MAXLIFETIME.value = maxLifeTime;
            shaderSimulationRef.current.uniforms.iTime.value = clock.elapsedTime;
            shaderSimulationRef.current.uniforms.iTimeDelta.value = delta;
            shaderSimulationRef.current.uniforms.lastFrame.value = swap.current ? renderTargetB.texture : renderTargetA.texture;
    
            gl.setRenderTarget(swap.current ? renderTargetA : renderTargetB);
            gl.clear();
            gl.render(scene, camera);
            swap.current = !swap.current;
            gl.setRenderTarget(null);   
        } 

    });

    return (
        <>
          <mesh>
            <planeGeometry args={[2,2]} />
            <shaderMaterial ref={shaderSimulationRef}
                depthWrite={false}
                fragmentShader={fragShader}
                vertexShader={vertexShader}
                uniforms={uniforms}
                transparent={false}
            />
          </mesh>  
        </>
    );
}

export default Simulation;