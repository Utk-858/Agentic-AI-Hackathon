'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Logo from '@/components/Logo';
import { ArrowRight } from 'lucide-react';

export default function WelcomePage() {
  const [name, setName] = useState('');
  const router = useRouter();

  const handleStart = () => {
    if (name.trim()) {
      router.push(`/teacher/dashboard?name=${encodeURIComponent(name.trim())}`);
    }
  };

  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center p-4">
      <div className="absolute inset-0 -z-10 h-full w-full bg-background bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]"></div>
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="items-center text-center">
          <Logo className="h-16 w-16 mb-2 text-primary" />
          <CardTitle className="font-headline text-3xl font-bold">Welcome to GuruMitra</CardTitle>
          <CardDescription className="text-base">Your AI Teaching Companion</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">What's your name?</Label>
            <Input 
              id="name" 
              placeholder="Enter your name..." 
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleStart()}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button size="lg" className="w-full" onClick={handleStart} disabled={!name.trim()}>
            Start Teaching
            <ArrowRight />
          </Button>
        </CardFooter>
      </Card>
      <footer className="absolute bottom-4 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} GuruMitra. All Rights Reserved.</p>
      </footer>
    </main>
  );
}
