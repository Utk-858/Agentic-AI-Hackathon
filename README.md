# GuruMitra: Empowering Teachers in Multi-Grade Classrooms 📚

GuruMitra is an **Offline-First, Edge-Deployed, Agentic AI Platform** designed to empower teachers and students in under-resourced classrooms, especially in India, by providing personalized, multimodal learning experiences in over **22 Indian languages**, even **without internet**.

---

## The Problem: Bridging the Gap in Education 🌍
Teachers in multi-grade and under-resourced settings often face significant challenges like **limited resources**, **poor internet connectivity**, and **language barriers**. Existing solutions often often fall short, being online-only, student-centric, or unsuitable for low-end devices.

---

## Our Solution: GuruMitra's Impact ✨
GuruMitra directly addresses these gaps by offering an **offline-first**, **multilingual**, and **edge-optimized** AI platform. It functions efficiently on **low-end smartphones** and uses a **smart hybrid mode** to seamlessly integrate cloud capabilities (Gemini, Vertex AI, Google services) when online, unlocking advanced features. Teachers can also **edit, approve, and personalize AI-generated content**.

---

## Key Features 🚀

GuruMitra offers a suite of AI-powered tools for teachers:

### 1. Shiksha Sahayak - Content Generation Toolkit ✍️
A fully hybrid (offline-first), multimodal AI tutor powered by custom agents and a fine-tuned Gemma 2B model trained on 2L+ rows of Indian curriculum content in 22+ native languages. It generates multi-grade lesson plans, worksheets from textbook photos, and simplifies complex concepts with local analogies. It also auto-evaluates student worksheets. All features are accessible via voice commands in the teacher's native language.

---

### 2. Assistant Chatbot - The Teacher's AI Assistant 🤖
A fully hybrid (offline-first), modular AI agent that empowers teachers to manage multi-grade classrooms with zero preparation time. It helps plan lessons, generate worksheets, create blackboard visuals, and simplify complex topics all in the teacher's local language, even without internet.

---

### 3. LokSewaSync – Offline-First, Hybrid Sync Layer 🌐
This intelligent engine enables **full offline functionality** and **smart synchronization** with cloud services (like Gemini, Firestore, Vertex AI) when internet is available. It ensures secure on-device storage with no loss of functionality and seamless data flow between offline and online modes.

---

### 4. SwasthyaMitra - Multilingual Mental Health Companion 🧠
A dedicated, **offline**, multilingual agentic support system designed to promote emotional well-being among teachers and students. It is fully functional offline and finely tuned for India's socio-cultural sensitivities, listening, understanding, and supporting even when there's no internet or therapist around. It offers mood journals & wellness tips, and emotion-sensitive conversations.

---

### 5. ChalkBoard Scanner - Get Digital Notes 📝
Instantly converts handwritten notes from boards or notebooks into editable digital text and audio, **fully offline**. It preserves original layouts and supports multiple languages for clear, accurate digitization.

---

### 6. Smart Timetable Generator 🗓️
An agentic AI-powered tool that automatically creates **conflict-free, optimized class schedules** for schools and teachers. It balances class slots, breaks, faculty hours, holidays, and special demands and works offline-first, syncing when online.

---

## Tech Stack 🛠️

GuruMitra utilizes a hybrid tech stack:

* **Offline (Edge Devices - No Internet Required):**
    * **LLM & Vision Models:** TFLite-Gemma 2B (fine-tuned), BERT/TinyBERT/mBERT, MobileNet.
    * **OCR:** Tesseract (JNI).
    * **Speech-to-Text:** TFLite ASR (Edge STT).
    * **Text-to-Speech:** TFLite TTS (for Hindi, Marathi, etc.).
    * **Data Storage:** Firebase Firestore (Offline Persistence).
    * **Interaction Layer:** MediaPipe, Flutter.
    * **Agent Runtime:** Modular Agent Layer (StudentAgent, TeacherAgent, AudioAgent, etc.).

* **Online (Hybrid Mode - When Internet is Available):**
    * **LLM & Vision API:** Gemini API (Text), Gemini Pro, Gemini Vision.
    * **Audio APIs:** Vertex AI Speech-to-Text, Vertex AI Text-to-Speech.
    * **Sync Layer:** Firebase Cloud Functions.
    * **Database & Hosting:** Firebase Firestore (Cloud Mode).
    * **Deployment:** Firebase Studio, Firebase Hosting.
    * **Analytics/Logs:** Firebase Analytics, Firebase Crashlytics.

---

## Architecture Flow 📊

GuruMitra operates on a **Smart Switching System** that manages Hybrid Task Routing, Offline-First Logic, Data Synchronization, and Request Queuing.

The architecture involves:
* **Offline Mode (Default):** Utilizes on-device models like Gemma 2B (TFLite), mBERT/TinyBERT, TFLite ASR/TTS, Tesseract OCR, MediaPipe, and Local Firestore.
* **Online Mode:** Leverages Google Cloud services such as Gemini API, Vertex AI, Cloud Firestore, Vertex AI Speech, Gemini Vision, and Cloud Functions.

These modes seamlessly integrate to power core functionalities: Content Generation, Digital Assistance, and Classroom Tools. Specific features like Shiksha Sahayak, Assistant Chatbot, SwasthyaMitra, ChalkBoard Scanner, and Smart Timetable are built upon this hybrid architecture.

---

## Mockups & Demo 💻

You can view mockups of the GuruMitra interface, showcasing features like Content Generator, Grading Report, Shiksha Sahayak AI Tools, Board Buddy, and SwasthyaMitra Wellness.

While the backend is not publicly accessible for full interaction, you can try our deployed frontend with mock interactions: [https://agentic-ai-hackathon.vercel.app/](https://agentic-ai-hackathon.vercel.app/).

---

## Team Details 👥
* **Team Name:** GuruMitra
* **Team :** Himanshu Sharma, Utkarsh Bansal, Amisha Paliwal, Arnav Garg
* **Problem Statement:** Empowering Teachers in Multi-Grade Classrooms
