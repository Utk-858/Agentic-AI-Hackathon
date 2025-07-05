'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import DailyDose from '@/components/DailyDose';
import { ArrowRight, BrainCircuit, Clock, HeartPulse, PencilRuler } from 'lucide-react';

function TeacherDashboardContent() {
    const searchParams = useSearchParams();
    const name = searchParams.get('name') || 'Teacher';
    const [greeting, setGreeting] = useState('');
    const [dateTime, setDateTime] = useState('');

     useEffect(() => {
        const updateDateTime = () => {
            const now = new Date();
            const hour = now.getHours();

            if (hour < 12) {
                setGreeting('Good Morning');
            } else if (hour < 18) {
                setGreeting('Good Afternoon');
            } else {
                setGreeting('Good Evening');
            }
            
            setDateTime(now.toLocaleString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: 'numeric',
                minute: 'numeric',
                hour12: true,
            }).replace(' at', ','));
        };
        
        updateDateTime();
        const intervalId = setInterval(updateDateTime, 60000); // Update every minute

        return () => clearInterval(intervalId);
    }, []);

    return (
        <div className="flex flex-1 flex-col gap-6 p-4 md:gap-8 md:p-8 bg-background">
            <Card className="border-0 shadow-none -m-4 -mb-0 md:-m-8 md:-mb-0 bg-gradient-to-br from-primary/10 via-background to-background rounded-none">
                <CardHeader className="p-4 md:p-8">
                    <div className="flex items-center justify-between">
                         <div className="grid gap-1">
                            <h1 className="font-headline text-3xl md:text-4xl font-bold text-primary">{greeting}, {name}!</h1>
                            <p className="text-muted-foreground text-lg">Let's empower the next generation of learners.</p>
                            <p className="text-muted-foreground text-lg">What will you create today?</p>
                        </div>
                        <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground bg-background/50 border rounded-lg px-3 py-1.5 whitespace-nowrap">
                            <Clock className="w-4 h-4" />
                            <span>{dateTime}</span>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
                <Card className="lg:col-span-3 shadow-sm">
                    <CardHeader>
                        <CardTitle>Your ShikshaSahayak AI Toolkit</CardTitle>
                        <CardDescription>How can I assist you today?</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4 sm:grid-cols-1 md:grid-cols-3">
                        <Link href="/teacher/vidyasutra" className="h-full">
                             <div className="p-4 bg-background rounded-lg border hover:bg-muted cursor-pointer h-full flex flex-col justify-between transition-colors">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <PencilRuler className="w-6 h-6 text-primary"/>
                                        <h3 className="font-headline text-lg font-semibold">Content Generators</h3>
                                    </div>
                                    <p className="text-sm text-muted-foreground">Generate lesson plans, create worksheets, and simplify content.</p>
                                </div>
                                <div className="text-primary font-semibold flex items-center gap-1 mt-4">
                                    Start creating <ArrowRight className="w-4 h-4" />
                                </div>
                            </div>
                        </Link>
                         <Link href="/teacher/assistant" className="h-full">
                             <div className="p-4 bg-background rounded-lg border hover:bg-muted cursor-pointer h-full flex flex-col justify-between transition-colors">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <BrainCircuit className="w-6 h-6 text-primary"/>
                                        <h3 className="font-headline text-lg font-semibold">AI Teaching Assistant</h3>
                                    </div>
                                    <p className="text-sm text-muted-foreground">Get instant help, brainstorm ideas, and ask questions.</p>
                                </div>
                                <div className="text-primary font-semibold flex items-center gap-1 mt-4">
                                    Start chatting <ArrowRight className="w-4 h-4" />
                                </div>
                            </div>
                        </Link>
                        <Link href="/teacher/swasthyamitra" className="h-full">
                            <div className="p-4 bg-background rounded-lg border hover:bg-muted cursor-pointer h-full flex flex-col justify-between transition-colors">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <HeartPulse className="w-6 h-6 text-primary"/>
                                        <h3 className="font-headline text-lg font-semibold">SwasthyaMitra</h3>
                                    </div>
                                    <p className="text-sm text-muted-foreground">A safe space for emotional support and wellness guidance.</p>
                                </div>
                                <div className="text-primary font-semibold flex items-center gap-1 mt-4">
                                    Find support <ArrowRight className="w-4 h-4" />
                                </div>
                            </div>
                        </Link>
                    </CardContent>
                </Card>
                <div className="lg:col-span-3">
                    <DailyDose />
                </div>
            </div>
        </div>
    )
}

export default function TeacherDashboard() {
    return (
        <Suspense fallback={<div className="flex-1 p-8">Loading...</div>}>
            <TeacherDashboardContent />
        </Suspense>
    )
}
