import { useMemo, useRef } from "react";
import { FluidShader } from "./fluidShader";
import { useFrame, createPortal } from "@react-three/fiber";
import { useFBO } from "@react-three/drei";
import { FloatType, LinearFilter, RepeatWrapping, RGBAFormat, Scene, ShaderMaterial, OrthographicCamera, Vector2 } from "three";
import { FluidColorShader } from "./fluidColorShader";
import {DisplayShader} from './displayShader';
import useContain from "@/hooks/useContains";


type Props = {
    videoResolution: Vector2,
    scale?: number,
    hands?: Vector2[]
}

type HandForces = {
    pos: Vector2
    vel: Vector2
}[];

const noHands = [
    {
        pos: new Vector2(0,0),
        vel: new Vector2(0,0)
    },
    {
        pos: new Vector2(0,0),
        vel: new Vector2(0,0)
    },
];

function Fluid({videoResolution, scale=1, hands}: Props) {
    const handForces = useRef<HandForces>(noHands);
    const camera = useMemo( () => new OrthographicCamera(-1, 1, 1, -1, 1 / Math.pow(2, 53), 1), []); 

    // Simulation
    const fluidSimulationRef = useRef<ShaderMaterial>(null);
    const swap = useRef(false); // Used to swap render targets every frame
    const simulationScene = useMemo( () => new Scene(), []); 
    const simulationRenderTargetA = useFBO({
        minFilter: LinearFilter,
        magFilter: LinearFilter,
        wrapS: RepeatWrapping,
        wrapT: RepeatWrapping,
        format: RGBAFormat,
        stencilBuffer: false,
        type: FloatType,
    });
    const simulationRenderTargetB = useFBO({
        minFilter: LinearFilter,
        magFilter: LinearFilter,
        wrapS: RepeatWrapping,
        wrapT: RepeatWrapping,
        format: RGBAFormat,
        stencilBuffer: false,
        type: FloatType,
    });
    
    // Color
    const fluidColorRef = useRef<ShaderMaterial>(null);
    const colorScene = useMemo( () => new Scene(), []); 
    const colorRenderTargetA = useFBO({
        minFilter: LinearFilter,
        magFilter: LinearFilter,
        wrapS: RepeatWrapping,
        wrapT: RepeatWrapping,
        format: RGBAFormat,
        stencilBuffer: false,
        type: FloatType,
    });
    const colorRenderTargetB = useFBO({
        minFilter: LinearFilter,
        magFilter: LinearFilter,
        wrapS: RepeatWrapping,
        wrapT: RepeatWrapping,
        format: RGBAFormat,
        stencilBuffer: false,
        type: FloatType,
    });

    // Display
    const displayRef = useRef<ShaderMaterial>(null);
    const size = useContain(videoResolution.x, videoResolution.y, scale);

    function updateHandForces(prevForces: HandForces, hands: Vector2[] ): HandForces {
        return prevForces.map( (prev, i) => ({
            pos: hands[i],
            vel: hands[i].clone().sub( prev.pos )
        }) );
    }

    function videoSpaceToNormalized( hands: Vector2[], videoResolution: Vector2 ): Vector2[] {
        return hands.map( (hand) => new Vector2( hand.x / videoResolution.x, hand.y / videoResolution.y) );
    }

    useFrame( ( state ) => {
        const {gl, clock} = state;
        if(fluidSimulationRef.current && fluidColorRef.current && displayRef.current) {
            let forces: HandForces = noHands;
            if(hands) {
                forces = updateHandForces(handForces.current, videoSpaceToNormalized(hands, videoResolution) );
            }
            handForces.current = forces;

            // Simulation
            fluidSimulationRef.current.uniforms.iTime.value = clock.elapsedTime;
            fluidSimulationRef.current.uniforms.previousFrame.value = swap.current ? simulationRenderTargetB.texture : simulationRenderTargetA.texture;
            fluidSimulationRef.current.uniforms.Forces.value = forces;

            gl.setRenderTarget(swap.current ? simulationRenderTargetA : simulationRenderTargetB);
            gl.clear();
            gl.render(simulationScene, camera);
            //gl.setRenderTarget(null);

            // Color
            fluidColorRef.current.uniforms.iTime.value = clock.elapsedTime;
            fluidColorRef.current.uniforms.velocity.value = swap.current ? simulationRenderTargetA.texture : simulationRenderTargetB.texture;
            fluidColorRef.current.uniforms.previousFrame.value = swap.current ? colorRenderTargetB.texture : colorRenderTargetA.texture;
            fluidColorRef.current.uniforms.Forces.value = forces;

            gl.setRenderTarget(swap.current ? colorRenderTargetA : colorRenderTargetB);
            gl.clear();
            gl.render(colorScene, camera);
            gl.setRenderTarget(null);

            // Display
            displayRef.current.uniforms.color.value = swap.current ? colorRenderTargetA.texture : colorRenderTargetB.texture;

            swap.current = !swap.current;
        }
    })

    return (
        <>
            {createPortal(
                <mesh>
                    <planeGeometry args={[2,2]} />
                    <shaderMaterial ref={fluidSimulationRef}
                        depthWrite={false}
                        fragmentShader={FluidShader.fragmentShader}
                        vertexShader={FluidShader.vertexShader}
                        uniforms={FluidShader.uniforms}
                    />
                </mesh>,
                simulationScene
            )}
            {createPortal(
                <mesh>
                    <planeGeometry args={[2,2]} />
                    <shaderMaterial ref={fluidColorRef}
                        depthWrite={false}
                        fragmentShader={FluidColorShader.fragmentShader}
                        vertexShader={FluidColorShader.vertexShader}
                        uniforms={FluidColorShader.uniforms}
                    />
                </mesh>,
                colorScene
            )}
            <mesh>
                <planeGeometry args={size} />
                <shaderMaterial ref={displayRef}
                    depthWrite={false}
                    fragmentShader={DisplayShader.fragmentShader}
                    vertexShader={DisplayShader.vertexShader}
                    uniforms={DisplayShader.uniforms}
                />
            </mesh>
        </>
        
    )
}

export default Fluid;