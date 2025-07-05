'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import Logo from '@/components/Logo';
import { ArrowRight } from 'lucide-react';

export default function WelcomePage() {
  const [role, setRole] = useState<'student' | 'teacher'>('student');
  const [name, setName] = useState('');
  const router = useRouter();

  const handleStart = () => {
    if (name.trim()) {
      router.push(`/${role}/dashboard?name=${encodeURIComponent(name.trim())}`);
    }
  };

  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center p-4">
      <div className="absolute inset-0 -z-10 h-full w-full bg-background bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]"></div>
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="items-center text-center">
          <Logo className="h-16 w-16 mb-2 text-primary" />
          <CardTitle className="font-headline text-3xl font-bold">Welcome to GuruMitra</CardTitle>
          <CardDescription className="text-base">Your AI Learning Companion</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>First, tell us who you are:</Label>
            <RadioGroup value={role} onValueChange={(value) => setRole(value as 'student' | 'teacher')} className="grid grid-cols-2 gap-4">
              <div>
                <RadioGroupItem value="student" id="student" className="peer sr-only" />
                <Label htmlFor="student" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">
                  Student
                </Label>
              </div>
              <div>
                <RadioGroupItem value="teacher" id="teacher" className="peer sr-only" />
                <Label htmlFor="teacher" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">
                  Teacher
                </Label>
              </div>
            </RadioGroup>
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">And what's your name?</Label>
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
            {role === 'student' ? 'Start Learning' : 'Start Teaching'}
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
