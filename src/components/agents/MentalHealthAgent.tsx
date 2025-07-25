'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Mic, Send, Play, Pause, HeartPulse, Square } from 'lucide-react';
import { emotionalSupport } from '@/ai/flows/emotional-support';
import HtmlRenderer from '../HtmlRenderer';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '../ui/scroll-area';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { cn } from '@/lib/utils';
import Logo from '../Logo';

interface Message {
  role: 'user' | 'model';
  content: string;
  media?: string | null;
}

interface PlaybackState {
  isPlaying: boolean;
  messageIndex: number | null;
}

export default function MentalHealthAgent() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [playbackState, setPlaybackState] = useState<PlaybackState>({ isPlaying: false, messageIndex: null });
  const [isRecording, setIsRecording] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (scrollAreaRef.current) {
        scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  const stopCurrentAudio = () => {
    if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current = null;
    }
    setPlaybackState({ isPlaying: false, messageIndex: null });
  };

  const togglePlayback = (messageIndex: number, mediaUrl: string) => {
    if (playbackState.isPlaying && playbackState.messageIndex === messageIndex) {
        stopCurrentAudio();
    } else {
        stopCurrentAudio();
        const audio = new Audio(mediaUrl);
        audioRef.current = audio;
        audio.onplay = () => setPlaybackState({ isPlaying: true, messageIndex });
        audio.onpause = () => setPlaybackState({ isPlaying: false, messageIndex: null });
        audio.onended = () => setPlaybackState({ isPlaying: false, messageIndex: null });
        audio.play();
    }
  };

  const handleAudioSubmit = async (audioDataUri: string) => {
    stopCurrentAudio();
    setIsLoading(true);

    const userMessage: Message = { role: 'user', content: '[Audio Message]' };
    const newMessages: Message[] = [...messages, userMessage];
    setMessages(newMessages);

    const history = messages.map(({ role, content }) => ({ role, content }));

    try {
      const result = await emotionalSupport({ audioDataUri, history });
      setMessages(prev => [...prev, { role: 'model', content: result.response, media: result.media }]);
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'An error occurred',
        description: 'Failed to process your audio. Please try again.',
      });
      setMessages(messages);
    } finally {
      setIsLoading(false);
    }
  }

  const startRecording = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      return;
    }
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const options = { mimeType: 'audio/webm' };
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
      };
      
      mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: options.mimeType });
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = () => {
              const base64Audio = reader.result as string;
              if (base64Audio) handleAudioSubmit(base64Audio);
          };
          stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      toast({
          variant: 'destructive',
          title: 'Microphone access denied',
          description: 'Please allow microphone access in your browser settings to use this feature.',
      });
    }
  };

  const handleTextSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!query.trim()) return;

    stopCurrentAudio();
    setIsLoading(true);

    const userMessage: Message = { role: 'user', content: query };
    const newMessages: Message[] = [...messages, userMessage];
    setMessages(newMessages);

    const history = messages.map(({ role, content }) => ({ role, content }));

    try {
      const result = await emotionalSupport({ query, history });
      setMessages(prev => [...prev, { role: 'model', content: result.response, media: result.media }]);
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'An error occurred',
        description: 'Failed to get a response. Please try again.',
      });
      setMessages(messages);
    } finally {
      setIsLoading(false);
      setQuery('');
    }
  };

  return (
    <Card className="w-full h-full flex flex-col">
      <CardHeader>
        <CardTitle className="font-headline flex items-center gap-2">
          <HeartPulse className="text-primary"/> SwasthyaMitra Emotional Support
        </CardTitle>
        <CardDescription>A multilingual, confidential chatbot to listen and provide gentle, supportive guidance. Text and voice responses are available.</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-4 min-h-0">
        <ScrollArea className="flex-1 min-h-0 -mx-6" ref={scrollAreaRef}>
          <div className="px-6 space-y-4">
            {messages.length === 0 && !isLoading && (
              <div className="text-center text-muted-foreground h-full flex flex-col justify-center items-center p-8 rounded-lg bg-muted/30">
                  <p className="text-lg font-medium">Hello, I'm SwasthyaMitra.</p>
                  <p>How are you feeling today?</p>
              </div>
            )}
            {messages.map((message, index) => (
              <div key={index} className={cn("flex items-start gap-3", message.role === 'user' && "justify-end")}>
                {message.role === 'model' && (
                  <Avatar className="w-8 h-8 border">
                    <AvatarFallback><Logo className="w-5 h-5"/></AvatarFallback>
                  </Avatar>
                )}
                <div className={cn(
                  "p-3 rounded-lg max-w-sm md:max-w-md flex items-center gap-2", 
                  message.role === 'user' ? "bg-primary text-primary-foreground" : "bg-muted"
                )}>
                  <div className="prose prose-sm text-inherit max-w-none">
                    <HtmlRenderer content={message.content} className="bg-transparent p-0" />
                  </div>
                  {message.role === 'model' && message.media && (
                    <Button onClick={() => togglePlayback(index, message.media!)} size="icon" variant="ghost" className="shrink-0">
                      {playbackState.isPlaying && playbackState.messageIndex === index ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex items-start gap-3">
                <Avatar className="w-8 h-8 border">
                  <AvatarFallback><Logo className="w-5 h-5"/></AvatarFallback>
                </Avatar>
                <div className="p-3 rounded-lg bg-muted">
                    <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        <div className="pt-2">
          <form onSubmit={handleTextSubmit} className="relative">
            <Textarea
              placeholder="Share what's on your mind... or use the mic"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              rows={1}
              className="pr-[80px] min-h-[40px]"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && !isLoading) {
                  e.preventDefault();
                  handleTextSubmit(e as any);
                }
              }}
              disabled={isLoading || isRecording}
            />
            <div className="absolute top-1/2 -translate-y-1/2 right-2 flex items-center gap-1">
              <Button type="button" size="icon" variant="ghost" onClick={startRecording} disabled={isLoading} title={isRecording ? "Stop Recording" : "Start Recording"}>
                  {isRecording ? <Square className="h-5 w-5 fill-red-500 text-red-500 animate-pulse" /> : <Mic className="h-5 w-5"/>}
              </Button>
              <Button type="submit" size="icon" disabled={isLoading || !query.trim() || isRecording} title="Send">
                  {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
              </Button>
            </div>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}
