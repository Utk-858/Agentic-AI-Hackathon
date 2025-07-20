'use client';

import { useState, useEffect, useRef } from 'react';
import Tesseract from 'tesseract.js';
import { saveScan, getAllScans, deleteScan, OfflineScan } from '@/lib/offlineStore';
import useHandLandmarker from '@/lib/useHandLandmarker';

export default function ChalkboardScannerClient() {
  const [image, setImage] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [scans, setScans] = useState<OfflineScan[]>([]);

  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { detectHands } = useHandLandmarker();

  useEffect(() => {
    loadScans();
  }, []);

  const loadScans = async () => {
    const all = await getAllScans();
    setScans(all.sort((a, b) => b.createdAt - a.createdAt));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      setImage(file);
      setImageUrl(URL.createObjectURL(file));
      setText('');
    }
  };

  const runOCR = async () => {
    if (!image || !imageUrl) return;

    setIsProcessing(true);
    setText('');

    try {
      // Wait for the image to be loaded
      await new Promise<void>((resolve) => {
        if (imageRef.current?.complete) {
          resolve();
        } else {
          imageRef.current!.onload = () => resolve();
        }
      });

      // Run hand detection
      const results = await detectHands(imageRef.current!);
      console.log('Hand landmarks:', results);

      if (results && results.landmarks.length > 0) {
        const hand = results.landmarks[0];
        const xs = hand.map((p) => p.x * imageRef.current!.width);
        const ys = hand.map((p) => p.y * imageRef.current!.height);

        const minX = Math.max(Math.min(...xs) - 20, 0);
        const minY = Math.max(Math.min(...ys) - 20, 0);
        const maxX = Math.min(Math.max(...xs) + 20, imageRef.current!.width);
        const maxY = Math.min(Math.max(...ys) + 20, imageRef.current!.height);

        // Draw to canvas and crop
        const canvas = canvasRef.current!;
        const ctx = canvas.getContext('2d')!;
        canvas.width = maxX - minX;
        canvas.height = maxY - minY;

        ctx.drawImage(
          imageRef.current!,
          minX,
          minY,
          maxX - minX,
          maxY - minY,
          0,
          0,
          maxX - minX,
          maxY - minY
        );

        // Convert cropped canvas to Blob for Tesseract
        const blob: Blob = await new Promise((resolve) =>
          canvas.toBlob((b) => resolve(b!), 'image/png')
        );

        const { data: { text: extractedText } } = await Tesseract.recognize(
          blob,
          'eng',
          { logger: m => console.log(m) }
        );

        setText(extractedText);
        await saveScan(extractedText);
        await loadScans();
      } else {
        console.log('No hand detected. Running full image OCR...');
        const { data: { text: extractedText } } = await Tesseract.recognize(
          image,
          'eng',
          { logger: m => console.log(m) }
        );
        setText(extractedText);
        await saveScan(extractedText);
        await loadScans();
      }
    } catch (error) {
      console.error('OCR failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const speakText = (text: string) => {
    if ('speechSynthesis' in window && text.trim()) {
      const utterance = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleDelete = async (id: number) => {
    await deleteScan(id);
    await loadScans();
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <input type="file" accept="image/*" onChange={handleFileChange} />
        {image && (
          <button
            onClick={runOCR}
            disabled={isProcessing}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            {isProcessing ? 'Processing...' : 'Scan Offline (Smart)'}
          </button>
        )}
      </div>

      {/* Hidden image + canvas for cropping */}
      {imageUrl && (
        <>
          <img ref={imageRef} src={imageUrl} alt="Uploaded" style={{ display: 'none' }} />
          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </>
      )}

      {text && (
        <div className="space-y-2">
          <h2 className="font-bold">Extracted Text (Last Scan):</h2>
          <pre className="bg-gray-100 p-2 rounded whitespace-pre-wrap">{text}</pre>
          <button
            onClick={() => speakText(text)}
            className="px-4 py-2 bg-green-600 text-white rounded"
          >
            Play Audio
          </button>
        </div>
      )}

      {scans.length > 0 && (
        <div className="space-y-4">
          <h2 className="font-bold">Saved Scans</h2>
          <ul className="space-y-2">
            {scans.map((scan) => (
              <li key={scan.id} className="border p-2 rounded bg-gray-50">
                <p className="text-xs text-gray-600 mb-1">
                  Saved: {new Date(scan.createdAt).toLocaleString()}
                </p>
                <pre className="whitespace-pre-wrap text-sm">{scan.text}</pre>
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => speakText(scan.text)}
                    className="px-3 py-1 bg-green-600 text-white rounded text-sm"
                  >
                    Play
                  </button>
                  <button
                    onClick={() => handleDelete(scan.id)}
                    className="px-3 py-1 bg-red-600 text-white rounded text-sm"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
            