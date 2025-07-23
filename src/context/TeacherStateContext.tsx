'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

// Import all the necessary types from flows and schemas
import type { BlackboardDesignerOutput } from '@/ai/flows/blackboard-designer';
import type { ChalkboardScannerOutput } from '@/ai/flows/chalkboard-scanner';
import type { GenerateTimetableOutput } from '@/ai/schemas';

// State for Vidyasutra page
interface TextResult {
  type: 'lessonPlan' | 'worksheet' | 'simplify';
  title: string;
  content: string;
  answerKey?: string;
}
interface CorrectorResult {
  type: 'corrector';
  title: string;
  score: number;
  total: number;
  feedback: string;
}
type GenerationResult = TextResult | CorrectorResult;

interface VidyasutraState {
  result: GenerationResult | null;
  isLoading: Record<string, boolean>;
  studentSheetUri: string | null;
  answerKeyUri: string | null;
  studentInfo: { name: string; classVal: string; rollNo: string; language: string; specialRequest: string };
  isEditing: boolean;
  editableContent: string;
  showAnswerKey: boolean;
}

// State for Blackboard Designer page
interface BlackboardDesignerState {
  result: BlackboardDesignerOutput | null;
  isLoading: boolean;
}

// State for Chalkboard Scanner page
interface ChalkboardScannerState {
  result: ChalkboardScannerOutput | null;
  isLoading: boolean;
  imageDataUri: string | null;
}

// State for Timetable page
interface TimetableEntry {
  time: string;
  class: string;
  subject: string;
  teacher: string;
  room: string;
}

interface TimetableResult {
  timetable: Record<string, TimetableEntry[]>;
}

interface TimetableState {
  result: TimetableResult | null;
  isLoading: boolean;
  isPreviewOpen: boolean;
}


// Combine all states
interface TeacherContextState {
  vidyasutra: VidyasutraState;
  blackboardDesigner: BlackboardDesignerState;
  chalkboardScanner: ChalkboardScannerState;
  timetable: TimetableState;
}

interface TeacherContextType {
  state: TeacherContextState;
  setVidyasutraState: (update: Partial<VidyasutraState>) => void;
  setBlackboardDesignerState: (update: Partial<BlackboardDesignerState>) => void;
  setChalkboardScannerState: (update: Partial<ChalkboardScannerState>) => void;
  setTimetableState: (update: Partial<TimetableState>) => void;
}

const TeacherContext = createContext<TeacherContextType | undefined>(undefined);

const initialState: TeacherContextState = {
  vidyasutra: {
    result: null,
    isLoading: {},
    studentSheetUri: null,
    answerKeyUri: null,
    studentInfo: { name: '', classVal: '', rollNo: '', language: 'English', specialRequest: '' },
    isEditing: false,
    editableContent: '',
    showAnswerKey: true,
  },
  blackboardDesigner: {
    result: null,
    isLoading: false,
  },
  chalkboardScanner: {
    result: null,
    isLoading: false,
    imageDataUri: null,
  },
  timetable: {
    result: null,
    isLoading: false,
    isPreviewOpen: false,
  },
};

export function TeacherStateProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<TeacherContextState>(initialState);

  const setVidyasutraState = (update: Partial<VidyasutraState>) => {
    setState(prev => ({ ...prev, vidyasutra: { ...prev.vidyasutra, ...update } }));
  };

  const setBlackboardDesignerState = (update: Partial<BlackboardDesignerState>) => {
    setState(prev => ({ ...prev, blackboardDesigner: { ...prev.blackboardDesigner, ...update } }));
  };

  const setChalkboardScannerState = (update: Partial<ChalkboardScannerState>) => {
    setState(prev => ({ ...prev, chalkboardScanner: { ...prev.chalkboardScanner, ...update } }));
  };

  const setTimetableState = (update: Partial<TimetableState>) => {
    setState(prev => ({ ...prev, timetable: { ...prev.timetable, ...update } }));
  };

  const value = {
    state,
    setVidyasutraState,
    setBlackboardDesignerState,
    setChalkboardScannerState,
    setTimetableState,
  };

  return (
    <TeacherContext.Provider value={value}>
      {children}
    </TeacherContext.Provider>
  );
}

export function useTeacherState() {
  const context = useContext(TeacherContext);
  if (context === undefined) {
    throw new Error('useTeacherState must be used within a TeacherStateProvider');
  }
  return context;
}
