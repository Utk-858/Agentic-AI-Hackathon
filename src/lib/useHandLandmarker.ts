import { useEffect, useState } from 'react';
import {
  FilesetResolver,
  HandLandmarker,
  HandLandmarkerResult,
} from '@mediapipe/tasks-vision';

export default function useHandLandmarker() {
  const [handLandmarker, setHandLandmarker] = useState<HandLandmarker | null>(null);

  // Load the MediaPipe model once
  useEffect(() => {
    const createLandmarker = async () => {
      const vision = await FilesetResolver.forVisionTasks('/wasm/');

      const handLandmarker = await HandLandmarker.createFromOptions(vision, {
  baseOptions: {
    modelAssetPath: '/wasm/hand_landmarker.task',
  },
  runningMode: 'IMAGE',
  numHands: 1,
});


      setHandLandmarker(handLandmarker);
    };

    createLandmarker();
  }, []);

  const detectHands = async (imageElement: HTMLImageElement) => {
    if (!handLandmarker) return null;
    const results: HandLandmarkerResult = await handLandmarker.detect(imageElement);
    return results;
  };

  return { handLandmarker, detectHands };
}
