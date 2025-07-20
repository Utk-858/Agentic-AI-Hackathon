'use client';

import React from 'react';
import { useRef, ChangeEvent, useEffect, useState } from 'react';
import Image from 'next/image';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, FileImage, X, Download, ScanLine, Bot } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import HtmlRenderer from '@/components/HtmlRenderer';
import { chalkboardScanner } from '@/ai/flows/chalkboard-scanner';
import { useTeacherState } from '@/context/TeacherStateContext';

// Remove global Tesseract import logic

export default function ChalkboardScannerPage() {
  const { state, setChalkboardScannerState } = useTeacherState();
  const { result, isLoading, imageDataUri } = state.chalkboardScanner;

  const { toast } = useToast();
  const contentRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [isTtsPlaying, setIsTtsPlaying] = useState(false);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) { // 4MB limit
        toast({ variant: 'destructive', title: 'File too large', description: 'Please upload an image smaller than 4MB.' });
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        setChalkboardScannerState({ imageDataUri: e.target?.result as string, result: null });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setChalkboardScannerState({ imageDataUri: null, result: null });
    if (inputRef.current) inputRef.current.value = '';
    if (audioRef.current) audioRef.current.pause();
  };

  const handleScan = async () => {
    if (!imageDataUri) {
      toast({ variant: 'destructive', title: 'No Image', description: 'Please upload an image of a chalkboard to scan.' });
      return;
    }
    setChalkboardScannerState({ isLoading: true, result: null });
    if (audioRef.current) audioRef.current.pause();

    try {
      let response;
      if (isOnline) {
        // Online: Use Gemini as before
        response = await chalkboardScanner({ imageDataUri });
      } else {
        // Offline: Dynamically import Tesseract.js here
        try {
          console.log('Offline scan triggered. imageDataUri:', imageDataUri?.slice(0, 100));
          const TesseractModule = await import('tesseract.js');
          console.log('TesseractModule:', TesseractModule);
          const Tesseract = TesseractModule.default || TesseractModule;
          response = await new Promise<{ htmlContent: string; audioDataUri: string }>((resolve, reject) => {
            Tesseract.recognize(
              imageDataUri,
              'eng',
              {
                logger: (m: any) => { console.log('Tesseract progress:', m); },
                workerPath: '/tesseract/worker.min.js',
                corePath: '/tesseract/tesseract-core-simd-lstm.wasm.js',
                langPath: '/tesseract/lang-data/', // Make sure eng.traineddata.gz is in this folder
              }
            ).then(({ data }: { data: { text: string } }) => {
              const htmlContent = `<p>${data.text.replace(/\n/g, '<br/>')}</p>`;
              let audioDataUri = '';
              if ('speechSynthesis' in window) {
                const utterance = new window.SpeechSynthesisUtterance(data.text);
                utterance.onstart = () => setIsTtsPlaying(true);
                utterance.onend = () => setIsTtsPlaying(false);
                window.speechSynthesis.speak(utterance);
              }
              resolve({ htmlContent, audioDataUri });
            }).catch((err: any) => {
              console.error('Tesseract recognize error:', err);
              reject(err);
            });
          });
        } catch (err: any) {
          console.error('Offline OCR process failed:', err);
          toast({
            variant: 'destructive',
            title: 'Offline OCR Error',
            description: err?.message || JSON.stringify(err) || 'Failed to run offline OCR. See console for details.',
          });
          setChalkboardScannerState({ result: null });
          return;
        }
      }
      setChalkboardScannerState({ result: response });
      toast({ title: 'Scan complete!', description: 'Digital notes and audio have been generated.' });
    } catch (error: any) {
      console.error('Error scanning chalkboard:', error);
      toast({
        variant: 'destructive',
        title: 'An error occurred',
        description: error.message || 'Failed to scan the chalkboard. Please try again.',
      });
      setChalkboardScannerState({ result: null });
    } finally {
      setChalkboardScannerState({ isLoading: false });
    }
  };

  const handleDownloadPdf = () => {
    const input = contentRef.current;
    if (input) {
      html2canvas(input, { scale: 2 }).then((canvas) => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4', true);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        const ratio = Math.min((pdfWidth - 20) / imgWidth, (pdfHeight - 30) / imgHeight);
        const imgX = (pdfWidth - imgWidth * ratio) / 2;
        const imgY = 15;
        pdf.setFontSize(20);
        pdf.text("Chalkboard Notes", pdfWidth / 2, 10, { align: 'center' });
        pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
        pdf.save('chalkboard_notes.pdf');
      });
    }
  };

  const renderResult = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-8">
          <Loader2 className="w-12 h-12 mb-4 animate-spin text-primary" />
          <p className="text-lg font-medium">Scanning chalkboard...</p>
          <p>AI is converting image to notes and audio.</p>
        </div>
      );
    }
    if (!result) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-8">
          <Bot className="w-12 h-12 mb-4" />
          <p className="text-lg font-medium">Your digital notes will appear here.</p>
          <p>Upload a chalkboard image and click "Scan" to begin.</p>
        </div>
      );
    }

    return (
      <div ref={contentRef} className="p-4">
        <HtmlRenderer content={result.htmlContent} />
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 md:p-6 flex flex-col">
      <div className="mb-6 flex items-center gap-4">
        <h1 className="font-headline text-2xl font-bold">Chalkboard Scanner</h1>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${isOnline ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{isOnline ? 'Online' : 'Offline'}</span>
      </div>
      <div className="grid flex-1 grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Upload Image</CardTitle>
              <CardDescription>Click below to upload a clear photo of your notes.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {imageDataUri ? (
                  <div className="relative w-full aspect-video rounded-md overflow-hidden border bg-muted/20">
                    <Image src={imageDataUri} alt="Chalkboard preview" layout="fill" objectFit="contain" />
                    <Button type="button" variant="destructive" size="icon" className="absolute top-2 right-2 h-7 w-7 z-10" onClick={handleRemoveImage} disabled={isLoading}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div
                    className="flex items-center justify-center w-full aspect-video border-2 border-dashed rounded-md cursor-pointer hover:bg-muted"
                    onClick={() => !isLoading && inputRef.current?.click()}
                  >
                    <div className="text-center">
                      <FileImage className="mx-auto h-12 w-12 text-muted-foreground" />
                      <p className="mt-2 text-sm text-muted-foreground">Click to upload image</p>
                      <p className="text-xs text-muted-foreground">PNG, JPG, etc. (Max 4MB)</p>
                    </div>
                  </div>
                )}
                <input type="file" ref={inputRef} onChange={handleFileChange} accept="image/*" className="hidden" disabled={isLoading} />
              </div>
              <Button onClick={handleScan} disabled={isLoading || !imageDataUri} className="w-full" size="lg">
                {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Scanning...</> : <><ScanLine className="mr-2 h-4 w-4" /> Scan Chalkboard</>}
              </Button>
            </CardContent>
          </Card>
        </div>
        <div className="h-full min-h-0 lg:col-span-2">
          <Card className="h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="font-headline">Digital Notes</CardTitle>
              {result && (
                <div className="flex items-center gap-2">
                  {result.audioDataUri && <audio ref={audioRef} src={result.audioDataUri} controls />}
                  <Button size="sm" variant="outline" onClick={handleDownloadPdf}>
                    <Download className="mr-2 h-4 w-4" /> PDF
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent className="flex-1 min-h-0">
              <ScrollArea className="h-full w-full rounded-md border min-h-[400px]">
                {renderResult()}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
