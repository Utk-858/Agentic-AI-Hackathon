'use client';

import ChalkboardScannerClient from '@/components/agents/ChalkboardScannerClient';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export default function ChalkboardScannerOfflinePage() {
  return (
    <main className="flex flex-col items-center justify-start min-h-screen p-6 bg-background">
      <div className="w-full max-w-4xl space-y-6">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-3xl font-bold">📸 Chalkboard Scanner (Offline)</CardTitle>
            <CardDescription>
              Scan chalkboard images offline using AI + MediaPipe Hand Tracking + Tesseract OCR. 
              This runs fully in-browser, works offline, and saves your notes locally.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChalkboardScannerClient />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
