import {Pose} from '@tensorflow-models/pose-detection';
import { Vector2 } from 'three';

type BodyPart = 'nose' | 'left_eye' | 'right_eye' | 'left_ear' | 'right_ear' | 'left_shoulder' | 'right_shoulder' | 'left_elbow' | 'right_elbow' | 'left_wrist' | 'right_wrist' | 'left_hip' | 'right_hip' | 'left_knee' | 'right_knee' | 'left_ankle' | 'right_ankle';

export const AllBodyParts: BodyPart[] = ['nose' , 'left_eye' , 'right_eye' , 'left_ear' , 'right_ear' , 'left_shoulder' , 'right_shoulder' , 'left_elbow' , 'right_elbow' , 'left_wrist' , 'right_wrist' , 'left_hip', 'right_hip' , 'left_knee' , 'right_knee' , 'left_ankle' , 'right_ankle'];
export const Face: BodyPart[] = ['nose' , 'left_eye' , 'right_eye' , 'left_ear' , 'right_ear'];
export const Arms: BodyPart[] = [ 'left_shoulder' , 'right_shoulder' , 'left_elbow' , 'right_elbow' , 'left_wrist' , 'right_wrist' ];
export const Legs: BodyPart[] = [  'left_hip', 'right_hip' , 'left_knee' , 'right_knee' , 'left_ankle' , 'right_ankle' ];
export const Torso: BodyPart[] = ['left_shoulder', 'right_shoulder', 'left_hip', 'right_hip'];

export function getChestVector( poses: Pose[] | [] ) {
    const chest: {x: number, y: number} = poses[0].keypoints
        .filter( ({name}) => name && Torso.includes(name as BodyPart) )
        .reduce( (prev, curr, i) => ({x: (curr.x + i*prev.x)/(i+1) , y: (curr.y + i*prev.y)/(i+1) }), {x: 0, y: 0} ); // Average points
    return new Vector2( chest.x, chest.y);
}