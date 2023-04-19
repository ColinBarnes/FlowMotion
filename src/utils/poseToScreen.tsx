import { Vector2, Vector3 } from "three";
import {Pose} from '@tensorflow-models/pose-detection';


function lerp( x: number, y: number, a: number ): number {
    return x*(1-a) + y*a;
}
  
function mix( v1: Vector2, v2: Vector2, a: Vector2 ) {
    return new Vector2( lerp(v1.x, v2.x, a.x), lerp(v1.y, v2.y, a.y) );
}
  
  function videoSpaceToWorldSpace( videoCoord: Vector2, videoDim: Vector2, scale3: [number, number, number]): Vector2 {
    const scale = new Vector2( scale3[0], scale3[1] );
    const uv = videoCoord.clone().divide( videoDim );
    const topLeft = new Vector2( -scale.x/2, scale.y/2 );
    const bottomRight = new Vector2( scale.x/2, -scale.y/2 );
    return mix( topLeft, bottomRight, uv );
  } 

  export function posesToWorldSpace(poses: [] | Pose[], videoDim: Vector2, scale3: [number, number , number]):  [] | Pose[]{
    return poses.map( pose => {
        const keypoints = pose.keypoints.map( point => {
            const videoCoord = new Vector2(point.x, point.y);
            const screenCoord = videoSpaceToWorldSpace( videoCoord.clone(), videoDim.clone(), scale3);
            return {
                ...point,
                x: screenCoord.x,
                y: screenCoord.y
            }
        });
        return {
            ...pose,
            keypoints
        }
    });
}

export function posesToVectors( poses: Pose[] | [] ): Vector3[] {
    return poses.flatMap( pose => pose.keypoints ).map( point => new Vector3(point.x, point.y, 0) );
}