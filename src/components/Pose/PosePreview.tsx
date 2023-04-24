import { useVideoTexture } from "@react-three/drei";
import {Pose} from '@tensorflow-models/pose-detection';
import { MeshProps } from "@react-three/fiber";
import { posesToVectors } from "@/utils/poseToScreen";

type Props = {
    src: MediaStream,
    worldSpacePoses: Pose[] | [],
    worldSpaceVideoSize: [number, number, number]
}

function PosePreview({ src, worldSpacePoses, worldSpaceVideoSize }: Props) {
    return(
        <>  
            { posesToVectors( worldSpacePoses ).map( (pos, i) => <PreviewPoint key={i} position={pos} />)}
            <mesh scale={worldSpaceVideoSize} position={[0,0,-.2]}>
                <planeGeometry />
                <VideoMaterial src={src} />
            </mesh>
        </>

    ); 
}

type VideoMaterialProps = {
    src: MediaStream
}

function VideoMaterial({ src }: VideoMaterialProps) {
    const texture = useVideoTexture(src);
    return <meshBasicMaterial map={texture} toneMapped={false} />
}

function PreviewPoint(props: MeshProps) {
    return (
        <mesh {...props} >
            <circleGeometry args={[.25, 32]} />
            <meshStandardMaterial color={'white'} />
        </mesh>
    )
}

export default PosePreview;