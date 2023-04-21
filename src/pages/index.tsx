import Head from 'next/head'
import { Canvas, ThreeEvent } from '@react-three/fiber'
import Particles from '@/components/Particles/Particles'
import { NoToneMapping, Vector2 } from 'three'
import { OrthographicCamera, Stats } from '@react-three/drei'
import { useEffect, useMemo, useRef, useState } from 'react'
import {Pose} from '@tensorflow-models/pose-detection';
import MicrophoneSettings from '@/components/MicrophoneSettings/MicrophoneSettings'
import WebcamSettings from '@/components/WebcamSettings/WebcamSettings'
import { IconContext } from 'react-icons'
import {HiSparkles} from 'react-icons/hi';
import {IoMdBody} from 'react-icons/io'
import SettingItem from '@/components/Menu/SettingItem'
import Webcam from '@/components/Webcam/Webcam'
import usePoseDetector from '@/hooks/usePoseDetector'
import PosePreview from '@/components/Pose/PosePreview'
import PoseToWorldSpace from '@/components/Pose/PoseToWorldSpace'
import { getChestVector, getHandsVector } from '@/utils/getPose'
import SubMenu from '@/components/Menu/SubMenu'
import Menu from '@/components/Menu/Menu'
import MenuItem from '@/components/Menu/MenuItem'

export default function Home() {
  // Input
  const [mouseLoc, setMouseLoc] = useState( new Vector2(0, 0) );
  
  // Camera
  const [camera, setCamera] = useState<MediaStream | null>(null);
  const cameraRef = useRef<HTMLVideoElement | null>(null);
  const cameraResolution = useMemo( () => {
    let res = new Vector2(0, 0);
    if( camera ) {
      const tracks = camera.getVideoTracks();
      console.log('# of tracks:', tracks.length);
      console.log('width', tracks[0].getSettings().width );
      console.log('height', tracks[0].getSettings().height );
      console.log('videoAspect', tracks[0].getSettings().aspectRatio);
      const {width = 0, height = 0} = camera.getVideoTracks()[0].getSettings();
      res = new Vector2(width, height);
    }     
    return res;
  }, [camera]);
  const [worldSpaceCameraSize, setWorldSpaceCameraSize] = useState<[number, number, number]>([1,1,1]);
  
  // Audio
  const [microphone, setMicrophone] = useState<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>( null );
  const audioAnalyzerRef = useRef<AnalyserNode | null>( null );
  const audioSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

  // Pose
  const [viewPoseSettings, setViewPoseSettings] = useState(false);
  const [viewPosePreview, setViewPosePreview] = useState(true);
  const [poseScale, setPoseScale] = useState(1);
  const videoSpacePoses = usePoseDetector(cameraRef);
  const [worldSpacePoses, setWorldSpacePoses] = useState<Pose[] | []>([]);

  // General Settings
  const [stats, setStats] = useState(false);

  // Particle Settings
  const [viewParticleSettings, setViewParticleSettings] = useState(false);
  const [particleCount, setParticleCount] = useState(5000);
  const [maxLifeTime, setMaxLifeTime] = useState(5);
  const [maxSpeed, setMaxSpeed] = useState(100);
  const [volumeSensitivity, setVolumeSensitivity] = useState(10);
  const [forcePointActive, setForcePointActive] = useState(true);
  const [gravityMagnitude, setGravityMagnitude] = useState(-10);
  const [attractorStrength, setAttractorStrength] = useState(10);

  const handlePointerMove = ( event: ThreeEvent<PointerEvent> ) => {
    setMouseLoc( new Vector2(event.unprojectedPoint.x, event.unprojectedPoint.y) );
  }

  const handlePointerDown = ( event: ThreeEvent<PointerEvent> ) => {
    setViewParticleSettings( false );
    setViewPoseSettings(false);
    handlePointerMove(event);
  }

  // Analyzer
  useEffect( () => {
    if(microphone ) {
      audioCtxRef.current = new AudioContext();
      console.log('audio context setup');
      audioAnalyzerRef.current = audioCtxRef.current.createAnalyser();
      console.log('analyzer setup');
      audioSourceRef.current = audioCtxRef.current.createMediaStreamSource( microphone );
      audioSourceRef.current.connect(audioAnalyzerRef.current);
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

              {/*Pose */}
              <PoseToWorldSpace 
                poses={videoSpacePoses}
                videoResolution={cameraResolution}
                setWorldSpacePoses={setWorldSpacePoses}
                setWorldSpaceVideoSize={setWorldSpaceCameraSize}
                scale={poseScale}
              />
              {camera && viewPosePreview && <PosePreview src={camera} worldSpacePoses={worldSpacePoses} worldSpaceVideoSize={worldSpaceCameraSize}/>}
              
              {/* Get world cordinates of pointer */}
              <mesh onPointerMove={handlePointerMove} onPointerDown={handlePointerDown}>
                <planeGeometry args={[100,100]} />
                <meshBasicMaterial transparent  opacity={0} />
              </mesh>
              
              <Particles 
                particleCount={particleCount}
                maxLifeTime={maxLifeTime}
                maxSpeed={maxSpeed}
                volumeSensitivity={volumeSensitivity}
                forcePoint={mouseLoc}
                forcePointActive={forcePointActive}
                audioAnalyzer={audioAnalyzerRef}
                gravityMagnitude={gravityMagnitude}
                emitterPos={ worldSpacePoses.length >0 ? getChestVector(worldSpacePoses) : null}
                hands={worldSpacePoses.length >0 ? getHandsVector(worldSpacePoses) : undefined } 
                attractorStrength={attractorStrength}
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
          <SubMenu visible={viewParticleSettings}>
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
              displayName='Gravity'
              min={-50}
              max={50}
              step={1}
              value={gravityMagnitude}
              setValue={setGravityMagnitude}
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
              displayName='Pointer Is Attractor'
              value={forcePointActive}
              setValue={setForcePointActive}
            />
            <SettingItem 
              type="FLOAT"
              displayName='Attractor Strength'
              min={0}
              max={200}
              step={1}
              value={attractorStrength}
              setValue={setAttractorStrength}
            />
            <SettingItem 
              type="TOGGLE"
              displayName='View FPS'
              value={stats}
              setValue={setStats}
            />
          </SubMenu>
          <SubMenu visible={viewPoseSettings}>
            <SettingItem 
              type="TOGGLE"
              displayName="View Video"
              value={viewPosePreview}
              setValue={setViewPosePreview}
            />
            <SettingItem 
              type="FLOAT"
              displayName='Scale'
              min={0}
              max={2}
              step={.01}
              value={poseScale}
              setValue={setPoseScale}
            />
          </SubMenu>
          <Menu>
            <IconContext.Provider value={{size: '2em'}}>
              <MicrophoneSettings onAudioStream={setMicrophone} />
              <WebcamSettings onVideoStream={setCamera} />
              <MenuItem 
                onClick={() => { setViewParticleSettings(!viewParticleSettings); setViewPoseSettings(false); }}
                label={'Particles'}>
                  <HiSparkles className="mb-2" />
              </MenuItem>
              <MenuItem 
                onClick={() => { setViewPoseSettings(!viewPoseSettings); setViewParticleSettings(false); }}
                label={'Pose'}>
                  <IoMdBody className="mb-2" />
              </MenuItem>
            </IconContext.Provider>
          </Menu>
          <div className='z-1 col-start-1 col-span-full row-start-5 row-span-1'>
            <Webcam 
              stream={camera}
              videoRef={cameraRef}
            />
          </div>
        </div>
      </main>
    </>
  )
}
