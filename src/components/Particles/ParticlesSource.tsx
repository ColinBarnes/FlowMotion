import { FloatType, NearestFilter, RGBAFormat, Vector2 } from "three";
import Renderer from "./Renderer";
import Simulation from "./Simulation";
import { useFrame } from "@react-three/fiber";
import { useFBO } from "@react-three/drei";
import { useMemo, useRef, useState } from "react";
import { create } from "zustand";

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

export type ParticleTypes = 'DEFAULT' | 'SMOKE';

type ParticleTypeSettings = {
    displayName: string
    type: "DROPDOWN"
    value: ParticleTypes
    options: ParticleTypes[]
    setValue: (parType: ParticleTypes) => void
}

interface ParticleState {
    settings: ParticleTypeSettings
}


export const useParticleStore = create<ParticleState>()((set) => ({
    settings: {
        displayName: "Particle Type",
        type: "DROPDOWN",
        value: "DEFAULT",
        options: ['DEFAULT', 'SMOKE'],
        setValue: (parType) => set((state) => (
            {
                ...state, 
                settings: {
                    ...state.settings,
                    value: parType
                } 
            }))
    }
}));

const MAXPARTICLES = 5_000;
function ParticlesSource( { 
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
}: Props) {
    const swap = useRef(false); // Used to swap render targets every frame
    const count = useMemo( () => Math.min( MAXPARTICLES, Math.max(0, particleCount) ), [particleCount]);
    const textureSize = useMemo( () => Math.ceil(Math.sqrt(count)), [count]);
    const audioTimeDomainData = useRef<Uint8Array | null>(null);
    const volume = useRef<number | null>(null);

    const particleType = useParticleStore( (state) => state.settings.value );

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

    const [currFrame, setCurrFrame] = useState(renderTargetA);
    const [prevFrame, setPrevFrame] = useState(renderTargetB);

    useFrame( () => {        
        swap.current = !swap.current;
        setCurrFrame( swap.current ? renderTargetA : renderTargetB );
        setPrevFrame( swap.current ? renderTargetB : renderTargetA );

        if(audioAnalyzer?.current) {
            const bufferLength = audioAnalyzer.current.frequencyBinCount;
            if( !audioTimeDomainData.current) {
                audioTimeDomainData.current = new Uint8Array( bufferLength );
            }
            audioAnalyzer.current.getByteTimeDomainData( audioTimeDomainData.current );
            const sumOfSquares = audioTimeDomainData.current.reduce((prev,curr) => prev + (curr-128)*(curr-128) ) / bufferLength;
            const scale = Math.min( Math.max( (sumOfSquares/16384) * volumeSensitivity , 0 ), 1); // map to [0,1]
            volume.current = scale;
        }      
    });

    return(
        <>
            <Simulation  
                prevFrame={prevFrame}
                currFrame={currFrame}
                volume={volume}
                particleCount={particleCount}
                maxLifeTime={maxLifeTime}
                maxSpeed={maxSpeed}
                emitterPos={emitterPos}
                gravityMagnitude={gravityMagnitude}
                attractorStrength={attractorStrength}
                hands={hands}
                forcePoint={forcePoint}
                forcePointActive={forcePointActive}
            />
            <Renderer
                particleType={particleType}
                simulation={currFrame}
                volume={volume}
                count={particleCount}
                maxLifeTime={maxLifeTime}
            />
        </>
    )
}

export default ParticlesSource;