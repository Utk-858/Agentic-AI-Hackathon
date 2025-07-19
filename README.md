# GuruMitra: Empowering Teachers in Multi-Grade Classrooms 🍎📚

GuruMitra is an innovative **Offline-First, Edge-Deployed, Agentic AI Platform** designed to revolutionize education in under-resourced classrooms, particularly in India. It aims to empower teachers and students by providing personalized, multimodal learning experiences in over 22 Indian languages, even without internet connectivity.

---

## The Problem: Challenges in Under-Resourced Classrooms 🌍
Teachers in multi-grade and under-resourced classrooms often face significant challenges:
* **Lack of Resources:** Limited access to up-to-date teaching materials and digital tools.
* **Connectivity Issues:** Unreliable or non-existent internet access, making online-only solutions impractical.
* **Language Barriers:** Difficulty in finding educational content tailored to diverse Indian languages.
* **Workload:** Managing multiple grades simultaneously with limited preparation time.
* **Lack of Support:** Existing AI tools are often student-centric, leaving teachers without adequate assistance.

---

## Our Solution: GuruMitra ✨
GuruMitra addresses these challenges with a suite of AI-powered features that prioritize offline functionality, multilingual support, and ease of use on low-end devices.

### Key Highlights
* **Offline-First & Edge-Deployed:** Operates fully without internet, running AI models directly on edge devices like smartphones.
* **Multilingual Support:** Delivers content in over 22 Indian languages, catering to diverse linguistic needs.
* **Agentic AI:** More than just a chatbot, GuruMitra offers context-aware, multi-step decisions and intelligent assistance.
* **Low-End Device Compatibility:** Optimized to run efficiently on low-end smartphones.
* **Hybrid Sync Mode:** Intelligently switches to cloud services (Gemini, Vertex AI) when internet is available to unlock advanced capabilities and sync data.
* **Human-in-the-Loop:** Teachers can edit, approve, and personalize AI-generated content.

---

## Features 🚀

GuruMitra provides a comprehensive set of tools to assist teachers:

### 1. Shiksha Sahayak - Content Generation Toolkit ✍️
A fully hybrid (offline-first), multimodal AI tutor, powered by a group of custom agents and a fine-tuned Gemma 2B model trained on 2L+ rows of Indian curriculum content in 22+ native languages. Teachers can interact using text, image, audio, or video and get instant support without internet.

* **Lesson Planner:** Creates multi-grade lesson plans with appropriate time breakdowns in the teacher's local language.
* **Worksheet Generator:** Generates grade-specific worksheets from textbook photos with various question types.
* **Content Simplifier:** Provides chalk-friendly diagrams and local-language analogies for complex concepts.
* **Worksheet Auto Evaluator:** Evaluates student worksheets by comparing with answer keys using AI, generating detailed report cards.
* **Voice Commands:** All features are accessible via voice commands in the teacher's native language.

**Agents Involved:**
* **Teacher Agent:** Orchestrates the entire flow - routes the input to appropriate agents based on input type (text/image/audio/video).
* **VisionAgent:** Extracts text and context from textbook images or recorded videos using OCR and frame parsing.
* **AudioAgent:** Converts student speech to text (STT) and reads responses aloud (TTS) in regional language.
* **ContentAgent:** Uses fine-tuned Gemma/mBERT to generate notes, quizzes, games, and visual explanations in local language.
* **KnowledgeAgent:** Adds extra context, relatable analogies, and simplified answers to student doubts.

---

### 2. Assistant Chatbot - The Teacher's AI Assistant 🤖
A fully hybrid (offline-first), modular AI agent that empowers teachers to manage multi-grade classrooms with zero preparation time. It helps plan lessons, generate worksheets, create blackboard visuals, and simplify complex topics, all in the teacher's local language, even without internet.

**Capabilities:**
* **Lesson Plans:** Provides lesson plans for multiple grades based on teacher requests.
* **Voice Input:** Enables teachers to make requests using speech in their native language.
* **Grade Worksheets:** Generates tailored worksheets for specific grades from textbook pages.
* **Visuals:** Returns simple diagrams suitable for blackboards based on voice input.
* **Concept Simplification:** Explains complex concepts with local-language analogies for better understanding.

**Agents Involved:**
* **TeacherAgent:** Coordinates planning, worksheet, and voice task requests from teachers.
* **VisionAgent:** Extracts and processes content from textbook images.
* **AudioAgent:** Converts teacher voice commands to structured queries and reads content aloud.
* **PlannerAgent:** Align generated material with class-wise curriculum guidelines.
* **KnowledgeAgent:** Provides simplified explanations and analogies for difficult topics.

---

### 3. LokSewaSync – The Offline-First, Hybrid Sync Layer 🌐
A smart synchronization and deployment engine that powers GuruMitra's edge-first design. It enables full functionality without the internet and syncs intelligently with cloud services (like Gemini, Firestore, Vertex AI) when connectivity is available - making the platform both scalable and future-ready.

* **100% Offline Operation:** Generates a week's lessons, visuals, and quizzes fully offline, storing all outputs securely on-device with no loss of functionality.
* **Smart Sync on Internet:** Connects to Wi-Fi when available, syncing offline work, uploading feedback, and fetching Gemini-powered content enhancements.
* **Human-in-the-Loop Feedback:** Teachers review and accept AI-suggested refinements, which provides improved quiz versions or lesson content for the next class.
* **Task Routing & Coordination:** LokSewaSync coordinates agents and routes tasks offline or online as needed.

---

### 4. SwasthyaMitra - The Multilingual Mental Health Companion 🧠
A dedicated, multilingual agentic support system designed to promote emotional well-being among teachers and students. It is fully functional offline and finely tuned for India's socio-cultural sensitivities, listening, understanding, and supporting even when there's no internet or therapist around.

* **Mood Journals & Wellness Tips:** Logs patterns and suggests activities.
* **Multilingual & Culturally Aware:** Handles emotional contexts and localized support, supporting 22+ Indian languages.
* **Emotion-Sensitive Conversations:** Provides calming words, exercises, and tips.
* **Voice-Based Interaction:** Offers empathetic advice and time-management.

---

### 5. ChalkBoard Scanner - Get Digital Notes 📝
Instantly converts handwritten notes from boards or notebooks into editable digital text and audio, fully offline. It preserves original layouts and supports multiple languages for clear, accurate digitization.

**Process:**
1.  **Image Capture & Preprocessing:** Teacher uploads photo of chalkboard/whiteboard with handwritten notes.
2.  **Text Extraction:** Converts handwritten/drawn content into digital text while preserving structure.
3.  **Content Enhancement:** Cleans up extracted text, corrects errors, and organizes content logically.
4.  **Multimodal Conversion:** Generates searchable digital notes and optional audio version.
5.  **Interactive Output:** Provides editable digital notes with search and audio playback features.

---

### 6. Smart Timetable Generator 🗓️
An agentic AI-powered tool that automatically creates conflict-free, optimized class schedules for schools and teachers. It balances class slots, breaks, faculty hours, holidays, and special demands - all stored securely, works offline-first, and syncs when online.

**Features:**
* **Conflict-Free Scheduling:** Prevents clashes between classes, faculty, and rooms ensuring smooth operations.
* **Faculty Workload Balancer:** Distributes subjects based on max weekly hours and availability fairly.
* **Break Slot Integration:** Automatically adds fixed breaks into schedules, providing necessary pauses.
* **Holiday Adjustments:** Blocks non-working days and auto-adjusts remaining slots automatically.
* **Multi-Subject Handling:** Supports parallel classes with subject-specific rules, increasing flexibility.
* **Offline Smart Sync:** Works fully offline and syncs with the cloud when available.
* **Teacher Timetables:** Generates individual faculty views for easy tracking and management.
* **Export Options:** Allows teachers and students to export final schedules easily.

---

## Tech Stack 🛠️

GuruMitra leverages a robust tech stack, combining on-device processing for offline functionality with cloud services for enhanced capabilities.

### Offline Tech Stack (Runs on Edge Devices - No Internet Required)
* **LLM & Vision Models:** TFLite-Gemma 2B (fine-tuned) for offline content generation and 22+ Indian languages support. BERT/TinyBERT/mBERT for local understanding, question answering, and classification. MobileNet for visual generation (e.g., blackboard sketches).
* **OCR:** Tesseract (JNI) to extract text from textbook images.
* **Speech-to-Text:** TFLite ASR (Edge STT) to convert voice input to text locally.
* **Text-to-Speech:** TFLite TTS (Hindi, Marathi, etc.) to convert content to speech in local language.
* **Data Storage:** Firebase Firestore (Offline Persistence) for local data caching, agent memory, and class history.
* **Interaction Layer:** MediaPipe and Flutter for UI/UX, multi-modal input (text, audio, image, video), and gesture capture.
* **Agent Runtime:** Modular Agent Layer (StudentAgent, TeacherAgent, AudioAgent, etc.) where all agents run locally.

---

### Online Tech Stack (When Internet is Available - Hybrid Mode)
* **LLM & Vision API:** Gemini API (Text), Gemini Pro, Gemini Vision for advanced generation, visual parsing, and fallback logic.
* **Audio APIs:** Vertex AI Speech-to-Text and Vertex AI Text-to-Speech for high-quality transcription and audio synthesis in the cloud.
* **Sync Layer:** Firebase Cloud Functions for task routing, Gemini API gateway, and backend triggers.
* **Database & Hosting:** Firebase Firestore (Cloud Mode) for syncing local DB with the cloud.
* **Deployment:** Firebase Studio and Firebase Hosting for hosting PWA/APK, logs, crash analytics, and user onboarding.
* **Analytics/Logs:** Firebase Analytics and Firebase Crashlytics for performance monitoring and user behavior.

---

## Architecture Flow 📊

GuruMitra operates on a **Smart Switching System** that manages Hybrid Task Routing, Offline-First Logic, Data Synchronization, and Request Queuing.

The architecture involves:
* **Offline Mode (Default):** Utilizes on-device models like Gemma 2B (TFLite), mBERT/TinyBERT, TFLite ASR/TTS, Tesseract OCR, MediaPipe, and Local Firestore.
* **Online Mode:** Leverages Google Cloud services such as Gemini API, Vertex AI, Cloud Firestore, Vertex AI Speech, Gemini Vision, and Cloud Functions.

These modes seamlessly integrate to power core functionalities:
* **Content Generation:** AI-powered creation of lesson plans, worksheets, and teaching materials.
* **Digital Assistance:** 24/7 teaching support through chatbots and specialized tools.
* **Classroom Tools:** Practical utilities for daily teaching needs.

Specific features like Shiksha Sahayak (Content Generation Toolkit), Assistant Chatbot, SwasthyaMitra, ChalkBoard Scanner, and Smart Timetable are built upon this hybrid architecture, interacting with various components of the GuruMitra Application Layer (Flutter UI, Multimodal Input, 22+ Languages, LokSewaSync, Offline DB, TFLite Runtime, Tesseract OCR, Firebase, MediaPipe, Gemma 2B, mBERT, SwasthyaMitra).

---

## Mockups & Demo 💻

You can view mockups of the GuruMitra interface, showcasing features like Content Generator, Grading Report, Shiksha Sahayak AI Tools, Board Buddy, and SwasthyaMitra Wellness.

While the backend is not publicly accessible for full interaction, you can try our deployed frontend with mock interactions: [https://agentic-ai-hackathon.vercel.app/](https://agentic-ai-hackathon.vercel.app/).

---

## Team Details 👥
* **Team Name:** GuruMitra
* **Team :** Himanshu Sharma, Utkarsh Bansal, Amisha Paliwal, Arnav Garg
* **Problem Statement:** Empowering Teachers in Multi-Grade Classrooms
