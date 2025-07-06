import { config } from 'dotenv';
config();

import '@/ai/flows/generate-lesson-plan.ts';
import '@/ai/flows/simplify-content.ts';
import '@/ai/flows/emotional-support.ts';
import '@/ai/flows/worksheet-generation.ts';
import '@/ai/flows/teacher-assistant.ts';
import '@/ai/flows/generate-timetable.ts';
import '@/ai/flows/worksheet-autocorrector.ts';
import '@/ai/flows/chalkboard-scanner.ts';
import '@/ai/flows/blackboard-designer.ts';
