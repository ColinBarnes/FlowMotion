import {Pose} from '@tensorflow-models/pose-detection';
import useContain from "@/hooks/useContains";
import { Vector2 } from "three";
import { posesToWorldSpace } from '@/utils/poseToScreen';
import { useEffect } from 'react';

type Props = {
    videoResolution: Vector2,
    poses: Pose[] | [],
    setWorldSpacePoses: React.Dispatch<Pose[] | []>,
    setWorldSpaceVideoSize: React.Dispatch<[number, number, number] >,
    scale?: number
}

function PoseToWorldSpace({videoResolution, poses, setWorldSpacePoses, setWorldSpaceVideoSize, scale=1 }: Props) {
    const size = useContain( videoResolution.x, videoResolution.y, scale );
    
    useEffect( () => {
        if( poses.length > 0 ) {
            const screenPoses = posesToWorldSpace(poses, videoResolution.clone(), size);
            setWorldSpacePoses(screenPoses);
        }
        setWorldSpaceVideoSize(size);
    },[poses, videoResolution,size, setWorldSpacePoses, setWorldSpaceVideoSize]);
    
    return null;
}

export default PoseToWorldSpace;