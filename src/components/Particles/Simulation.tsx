import { fragShaderSimulation, vertexShaderSimulation } from "./SimulationShaders";
import { useFrame, createPortal } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { OrthographicCamera, Scene, ShaderMaterial, Vector2, WebGLRenderTarget } from "three";

const Uniforms = {
    iTime: {
        value: 0.
    },
    iTimeDelta: {
        value: 0.
    },
    lastFrame: {
        value: null
    },
    emitterActive: {
        value: false
    },
    emitterPos: {
        value: new Vector2(0.5, 0.5)
    },
    MAXLIFETIME: {
        value: 5
    },
    particleCount: {
        value: 10
    },
    forcePoint: {
        value: new Vector2(0., 0.)
    },
    forcePointActive: {
        value: 1.
    },
    handsActive: {
        value: false
    },
    hands: {
        value: [new Vector2(0,0), new Vector2(0, 0)]
    },
    MAXSPEED: {
        value: 5.
    },
    volume: {
        value: 0.
    },
    gravityMagnitude: {
        value: -10
    },
    attractorStrength: {
        value: 10
    }
};

type Props = {
    prevFrame: WebGLRenderTarget,
    currFrame: WebGLRenderTarget,

    particleCount?: number,
    maxLifeTime?: number,
    maxSpeed?: number
    volumeSensitivity?: number
    forcePoint?: Vector2,
    forcePointActive?: boolean,
    hands?: Vector2[],
    gravityMagnitude?: number,
    audioAnalyzer?: React.MutableRefObject<AnalyserNode | null>,
    emitterPos?: Vector2 | null,
    attractorStrength?: number,
    volume?: React.MutableRefObject<number | null>
}

function Simulation({
    prevFrame, 
    currFrame,

    forcePointActive = true,
    forcePoint = new Vector2(0,0),
    hands,
    maxLifeTime = 5,
    maxSpeed = 10,
    emitterPos = null,
    gravityMagnitude = -10,
    attractorStrength = 10,
    particleCount,
    volume
}: Props) {
    const shaderSimulationRef = useRef<ShaderMaterial>(null);
    const scene = useMemo( () => new Scene(), []);
    const camera = useMemo( () => new OrthographicCamera(-1, 1, 1, -1, 1 / Math.pow(2, 53), 1), []);


    useFrame( (state, delta) => {
        const {gl, clock} = state;

        if( shaderSimulationRef.current !== null ) {
            shaderSimulationRef.current.uniforms.iTime.value = clock.elapsedTime;
            shaderSimulationRef.current.uniforms.iTimeDelta.value = delta;
            shaderSimulationRef.current.uniforms.lastFrame.value = prevFrame.texture;
            if(emitterPos) {
                shaderSimulationRef.current.uniforms.emitterActive.value = true;
                shaderSimulationRef.current.uniforms.emitterPos.value = emitterPos;
            }
            if(hands) {
                shaderSimulationRef.current.uniforms.handsActive.value = true;
                shaderSimulationRef.current.uniforms.hands.value = hands;
            }
            shaderSimulationRef.current.uniforms.attractorStrength.value = attractorStrength;
            shaderSimulationRef.current.uniforms.gravityMagnitude.value = gravityMagnitude;
            shaderSimulationRef.current.uniforms.MAXLIFETIME.value = maxLifeTime; 
            shaderSimulationRef.current.uniforms.particleCount.value = particleCount;
            shaderSimulationRef.current.uniforms.forcePoint.value = forcePoint;
            shaderSimulationRef.current.uniforms.forcePointActive.value = forcePointActive ? 1 : 0;
            shaderSimulationRef.current.uniforms.MAXSPEED.value = maxSpeed;
            shaderSimulationRef.current.uniforms.volume.value = volume?.current;

            gl.setRenderTarget(currFrame);
            gl.clear();
            gl.render(scene, camera);
            gl.setRenderTarget(null);
        }        
    });


    return (
        <>
            {createPortal(
                <mesh>
                    <planeGeometry args={[2,2]} />
                    <shaderMaterial ref={shaderSimulationRef}
                        depthWrite={false}
                        fragmentShader={fragShaderSimulation}
                        vertexShader={vertexShaderSimulation}
                        uniforms={Uniforms}
                    />
                </mesh>,
                scene
            )}
        </>
    )

}

export default Simulation;