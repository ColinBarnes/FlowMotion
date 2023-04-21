import { useFrame, createPortal } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { fragShaderBasic, vertexShaderBasic } from "./Shaders";
import { useFBO } from "@react-three/drei";
import { FloatType, NearestFilter, OrthographicCamera, RGBAFormat, Scene, ShaderMaterial, Vector2 } from "three";
import { fragShaderSimulation, vertexShaderSimulation } from "./SimulationShaders";

type Props = {
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
    attractorStrength?: number
}

const simulationUniforms = {
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

const uniforms = {
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
    }
};
const MAXPARTICLES = 5_000;
const Particles = ( { 
    forcePointActive = true,
    forcePoint = new Vector2(0,0),
    hands,
    audioAnalyzer, 
    particleCount = MAXPARTICLES, 
    maxLifeTime = 5,
    maxSpeed = 10,
    volumeSensitivity = 25,
    emitterPos = null,
    gravityMagnitude = -10,
    attractorStrength = 10
}: Props) => {    
    const swap = useRef(false); // Used to swap render targets ever frame
    const shaderSimulationRef = useRef<ShaderMaterial>(null);
    const particleMaterialRef = useRef<ShaderMaterial>(null);
    const count = useMemo( () => Math.min( MAXPARTICLES, Math.max(0, particleCount) ), [particleCount]);
    const textureSize = useMemo( () => Math.ceil(Math.sqrt(count)), [count]);
    const scene = useMemo( () => new Scene(), []);
    const camera = useMemo( () => new OrthographicCamera(-1, 1, 1, -1, 1 / Math.pow(2, 53), 1), []);
    const audioTimeDomainData = useRef<Uint8Array | null>(null);

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

    useFrame( (state, delta) => {
        const {gl, clock} = state;

        if( shaderSimulationRef.current !== null && particleMaterialRef.current !== null ) {
            shaderSimulationRef.current.uniforms.iTime.value = clock.elapsedTime;
            shaderSimulationRef.current.uniforms.iTimeDelta.value = delta;
            shaderSimulationRef.current.uniforms.lastFrame.value = swap.current ? renderTargetB.texture : renderTargetA.texture;
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
            shaderSimulationRef.current.uniforms.particleCount.value = count;
            shaderSimulationRef.current.uniforms.forcePoint.value = forcePoint;
            shaderSimulationRef.current.uniforms.forcePointActive.value = forcePointActive ? 1 : 0;
            shaderSimulationRef.current.uniforms.MAXSPEED.value = maxSpeed;

            gl.setRenderTarget(swap.current ? renderTargetA : renderTargetB);
            gl.clear();

            gl.render(scene, camera);
            swap.current = !swap.current;

            gl.setRenderTarget(null);

            particleMaterialRef.current.uniforms.iTime.value = clock.elapsedTime;
            particleMaterialRef.current.uniforms.simulation.value = swap.current ? renderTargetA.texture : renderTargetB.texture;
            particleMaterialRef.current.uniforms.MAXLIFETIME.value = maxLifeTime;
            particleMaterialRef.current.uniforms.particleCount.value = count;

            if(audioAnalyzer?.current) {
                const bufferLength = audioAnalyzer.current.frequencyBinCount;
                if( !audioTimeDomainData.current) {
                    audioTimeDomainData.current = new Uint8Array( bufferLength );
                }
                audioAnalyzer.current.getByteTimeDomainData( audioTimeDomainData.current );
                const sumOfSquares = audioTimeDomainData.current.reduce((prev,curr) => prev + (curr-128)*(curr-128) ) / bufferLength;
                const scale = Math.min( Math.max( (sumOfSquares/16384) * volumeSensitivity , 0 ), 1); // map to [0,1]
                particleMaterialRef.current.uniforms.particleScale.value = scale;
                shaderSimulationRef.current.uniforms.volume.value = scale;
            }
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
                        uniforms={simulationUniforms}
                    />
                </mesh>,
                scene
            )}
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
                <shaderMaterial ref={particleMaterialRef}
                    depthWrite={false}
                    fragmentShader={fragShaderBasic}
                    vertexShader={vertexShaderBasic}
                    uniforms={uniforms}
                    transparent={true}
                />
            </instancedMesh>
        </>
    );
}

export default Particles;