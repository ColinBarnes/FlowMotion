import { useState, useEffect, useCallback, useRef } from 'react';
import * as poseDetection from '@tensorflow-models/pose-detection';
import '@tensorflow/tfjs-backend-webgl';

function usePose() {
    const [poses, setPoses] = useState<poseDetection.Pose[] | [] >([]);
    const [detector, setDetector] = useState<poseDetection.PoseDetector | null>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const [animationFrameId, setAnimationFrameId] = useState<number>(-1);

    useEffect(() => {
        console.log('detector created');
        async function setupPoseDetector() {
            const detect = await poseDetection.createDetector(
                poseDetection.SupportedModels.MoveNet
            );
            setDetector(detect);
        }
    
        setupPoseDetector();
    
        return () => {
            if (detector) {
                detector.dispose();
            }
        };
    }, []);

    useCallback( (node: HTMLVideoElement) => {
        if(videoRef.current) {
            // clean up
            cancelAnimationFrame(animationFrameId);
        }

        async function updatePoses() {
            if (!detector || !node ) {
              //console.log('detector', detector);
              //console.log('videoRef', videoRef.current);
              return;
            }
            //console.log('we have both!');
            //console.log('detector', detector);
            //console.log('videoRef', videoRef.current);
            const newPoses = await detector.estimatePoses(videoRef.current);
            //console.log('poses', newPoses);
            
            setPoses(newPoses);
            requestAnimationFrame(updatePoses);
        }

        if(node) {
            if(detector) {
                
            }

        }

        videoRef.current = node;
    }, [detector])
}

export default usePose;