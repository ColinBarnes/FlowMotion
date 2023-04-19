import { useState, useEffect } from 'react';
import * as poseDetection from '@tensorflow-models/pose-detection';
import '@tensorflow/tfjs-backend-webgl';
import useContain from './useContains';
import { Vector2 } from 'three';

function usePoseDetector(videoRef: React.MutableRefObject<HTMLVideoElement | null>) {
  const [poses, setPoses] = useState<poseDetection.Pose[] | [] >([]);
  const [detector, setDetector] = useState<poseDetection.PoseDetector | null>(null);

  useEffect(() => {
    async function setupPoseDetector() {
        const detectorConfig = {modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING};
        const detect = await poseDetection.createDetector(
            poseDetection.SupportedModels.MoveNet,
            detectorConfig
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

  useEffect(() => {
    let animationFrameId: number;
    async function updatePoses() {
      if (!detector || !videoRef.current) {
        animationFrameId = requestAnimationFrame(updatePoses);
        return;
      }

      // Can't have a width, height of 0,0
      if( videoRef.current.videoHeight === 0 && videoRef.current.videoWidth === 0 ) {
        console.warn('Cannot have a video with dimensions 0x0')
        animationFrameId = requestAnimationFrame(updatePoses);
        return;
      }

      try {
        const newPoses = await detector.estimatePoses(videoRef.current);
        setPoses(newPoses);
      } catch( err ) {
        console.log(err);
      }
      animationFrameId = requestAnimationFrame(updatePoses);
    }

    updatePoses();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [detector]);

  return poses;
}

export default usePoseDetector;