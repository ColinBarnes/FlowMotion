import Head from 'next/head'
import { Canvas, ThreeEvent } from '@react-three/fiber'
import Particles from '@/components/Particles/Particles'
import { NoToneMapping, Vector2 } from 'three'
import { OrthographicCamera, Stats } from '@react-three/drei'
import { useEffect, useRef, useState } from 'react'
import { useControls } from 'leva'
import '@tensorflow/tfjs-backend-webgl'
import * as poseDetection from '@tensorflow-models/pose-detection'
import MicrophoneSettings from '@/components/MicrophoneSettings/MicrophoneSettings'
import WebcamSettings from '@/components/WebcamSettings/WebcamSettings'
import { IconContext } from 'react-icons'
import {HiSparkles} from 'react-icons/hi';
import SettingItem from '@/components/Menu/SettingItem'

export default function Home() {
  const [mouseLoc, setMouseLoc] = useState( new Vector2(0, 0) );
  const [microphone, setMicrophone] = useState<MediaStream | null>(null);
  const [camera, setCamera] = useState<MediaStream | null>(null);
  const [poseDetector, setPoseDetector] = useState<poseDetection.PoseDetector | null>(null);
  const audioCtx = useRef<AudioContext | null>( null );
  const audioAnalyzer = useRef<AnalyserNode | null>( null );
  const audioSource = useRef<MediaStreamAudioSourceNode | null>(null);

  // General Settings
  const [stats, setStats] = useState(false);

  // Particle Settings
  const [viewParticleSettings, setViewParticleSettings] = useState(false);
  const [particleCount, setParticleCount] = useState(5000);
  const [maxLifeTime, setMaxLifeTime] = useState(5);
  const [maxSpeed, setMaxSpeed] = useState(100);
  const [volumeSensitivity, setVolumeSensitivity] = useState(10);
  const [forcePointActive, setForcePointActive] = useState(true);

  const handlePointerMove = ( event: ThreeEvent<PointerEvent> ) => {
    setMouseLoc( new Vector2(event.unprojectedPoint.x, event.unprojectedPoint.y) );
  }

  const handlePointerDown = ( event: ThreeEvent<PointerEvent> ) => {
    if( viewParticleSettings ) {
      setViewParticleSettings( !viewParticleSettings );
    }
    handlePointerMove(event);
  }

  // Pose Detector
  useEffect(() => {
    const createDetector= async () => {
      const detector = await poseDetection.createDetector(poseDetection.SupportedModels.MoveNet);
      setPoseDetector(detector);
    }
    createDetector();
  }, []);

  // Analyzer
  useEffect( () => {
    if(microphone ) {
      audioCtx.current = new AudioContext();
      console.log('audio context setup');
      audioAnalyzer.current = audioCtx.current.createAnalyser();
      console.log('analyzer setup');
      audioSource.current = audioCtx.current.createMediaStreamSource( microphone );
      audioSource.current.connect(audioAnalyzer.current);
    } 
  }, [microphone]);

  // Workaround to prevent scrolling on mobile
  useEffect(() => {
    document.querySelector("html")?.classList.add("overscroll-none");
    document.querySelector("body")?.classList.add("overscroll-none");
    document.querySelector("#__next")?.classList.add("overscroll-none");

    document.querySelector("html")?.classList.add("overflow-hidden");
    document.querySelector("body")?.classList.add("overflow-hidden");
    document.querySelector("#__next")?.classList.add("overflow-hidden");
  });

  return (
    <>
      <Head>
        <title>FlowMotion</title>
        <meta name="description" content="An app to project visuals on a dancer" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className='absolute inset-0 bg-black text-white overscroll-none overflow-hidden'>
        <div className='h-full grid grid-rows-6 grid-cols-1 justify-items-stretch items-stretch overscroll-none'>
          <div className='col-start-1 col-span-full row-start-1 row-span-full'>
            <Canvas
              linear 
              gl={{ antialias: false, toneMapping: NoToneMapping }}>
              { stats && <Stats />}
              <ambientLight />
              <pointLight position={[10, 10, 10]} />
              <mesh onPointerMove={handlePointerMove} onPointerDown={handlePointerDown}>
                <planeGeometry args={[100,100]} />
                <meshBasicMaterial color={'black'} transparent />
              </mesh>
              <Particles 
                particleCount={particleCount}
                maxLifeTime={maxLifeTime}
                maxSpeed={maxSpeed}
                volumeSensitivity={volumeSensitivity}
                forcePoint={mouseLoc}
                forcePointActive={forcePointActive}
                audioAnalyzer={audioAnalyzer}
              />
              <OrthographicCamera
                makeDefault
                zoom={100}
                top={1}
                bottom={-1}
                left={1}
                right={-1}
                near={1}
                far={2000}
                position={[0, 0, 1]}
              />
            </Canvas>
          </div>
          { viewParticleSettings && <div className='px-10 w-full flex flex-row gap-32 col-start-1 col-span-full row-start-5 row-span-1 z-10 backdrop-blur-lg bg-white/10 overflow-x-auto'>
            <SettingItem 
              type="FLOAT"
              displayName='Particle Count'
              min={0}
              max={5000}
              value={particleCount}
              setValue={setParticleCount}
            />
            <SettingItem 
              type="FLOAT"
              displayName='Max Lifetime'
              min={0}
              max={60}
              step={.1}
              value={maxLifeTime}
              setValue={setMaxLifeTime}
            />
            <SettingItem 
              type="FLOAT"
              displayName='Max Speed'
              min={0}
              max={100}
              step={.5}
              value={maxSpeed}
              setValue={setMaxSpeed}
            />
            <SettingItem 
              type="FLOAT"
              displayName='Volume Sensitivity'
              min={0}
              max={100}
              step={.5}
              value={volumeSensitivity}
              setValue={setVolumeSensitivity}
            />
            <SettingItem 
              type="TOGGLE"
              displayName='Pointer Reactive'
              value={forcePointActive}
              setValue={setForcePointActive}
            />
            <SettingItem 
              type="TOGGLE"
              displayName='View FPS'
              value={stats}
              setValue={setStats}
            />
          </div> }
          <div className='transition-opacity duration-500 md:opacity-0 hover:opacity-100 col-start-1 col-span-full row-start-6 row-span-1 z-10 flex flex-row justify-evenly items-center overflow-x-auto'>
            <IconContext.Provider value={{size: '2em'}}>
              <MicrophoneSettings onAudioStream={setMicrophone} />
              {/*<WebcamSettings onVideoStream={setCamera} /> */}
              <div 
                onClick={ () => setViewParticleSettings(!viewParticleSettings)}
                className='flex flex-col items-center cursor-pointer' >
                <HiSparkles className="mb-2" />
                <div>Particles</div>
              </div>
            </IconContext.Provider>
          </div>
        </div>
      </main>
    </>
  )
}
