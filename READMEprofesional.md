# LinguistAI Professional Guide

## Overview

LinguistAI is a full-stack speech learning platform powered by Gemini. It combines speech synthesis, speech recognition, pronunciation coaching, translation support, and adaptive learner profiling in a single web application.

The project was built as a university speech-technology platform, but its structure follows a product-oriented architecture:

- React frontend for the user experience
- FastAPI backend for API orchestration
- Gemini integration for TTS, STT, pronunciation analysis, translation, and learning feedback

The goal of the app is not only to process speech, but to help a learner understand, practice, and improve spoken language.

## Main Product Capabilities

LinguistAI currently supports:

- Text to Voice (Text-to-Speech / TTS)
- Speech to Text (Speech-to-Text / STT)
- Pronunciation analysis and tutoring
- Scenario-based dialogue practice
- Native-language learning support
- Smart Translation Assistant
- Adaptive learner profile and personalized practice

## Core User Experience

The user enters the app through a dashboard-based interface and works with guided flows instead of raw tools.

Main sections:

- `Dashboard`
- `Text to Voice (TTS)`
- `Speech to Text (STT)`
- `Practice`
- `Scenario Practice`
- `Settings`

The app is designed to feel like a calm, professional language-learning workspace rather than a developer demo.

## Requirements

To run the project locally, the user needs:

- `Git`
- `Node.js`
- `Python`
- a valid `Gemini API key`

Recommended versions:

- Node.js: current `LTS`
- Python: `3.11+`

Important:

- no Gemini API key is hardcoded in the repository
- each user provides their own Gemini API key in the frontend
- the backend does not permanently store the API key
- the application is intended to run locally for the user

Gemini API key creation link:

`https://aistudio.google.com/app/apikey`

## Project Structure

```text
LinguistAI/
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   └── app/
│       ├── prompts.py
│       ├── schemas.py
│       ├── routes/
│       ├── services/
│       └── utils/
├── frontend/
│   ├── package.json
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── services/
│       ├── state/
│       └── i18n/
├── README.md
└── READMEprofesional.md
```

## Frontend Architecture

The frontend is a React application built with Vite.

Main responsibilities:

- dashboard UI and navigation
- onboarding and learner profile setup
- API key session management
- local learner statistics
- multilingual UI support
- audio recording and playback
- rendering AI-generated learning results

Key frontend areas:

- `pages/`: feature-level screens
- `components/`: reusable UI blocks
- `services/api.js`: backend API communication
- `state/`: session, learner profile, and stats state
- `i18n/`: translation dictionary and interface adaptation

## Backend Architecture

The backend is a FastAPI application that acts as a stateless orchestration layer.

Main responsibilities:

- receive requests from the frontend
- validate headers and payloads
- create a Gemini client per request
- send prompts and media to Gemini
- normalize Gemini responses
- return structured JSON to the frontend

The backend includes:

- route layer
- schema layer
- prompt-building layer
- Gemini service layer
- audio utility layer

## API Key Flow

The security model is intentionally simple and stateless.

Flow:

1. The user enters the Gemini API key in the frontend
2. The frontend stores it in browser session storage
3. Every request sends the key in the `X-Gemini-API-Key` header
4. The backend reads the header and creates a Gemini client for that request only
5. The backend does not save the API key in a database or file

This means:

- the server remains stateless
- the repository contains no secret key
- each user controls their own Gemini usage
- the key is not intended to be stored permanently by the backend
- the local runtime keeps control in the user's environment

## Privacy and Local Runtime

LinguistAI is designed to be run locally during development or demonstration.

From a user perspective, this means:

- the frontend runs on the user's own machine
- the backend runs on the user's own machine
- the Gemini API key is entered by the user
- the backend forwards the key only for live API requests
- the backend does not store the key in a database or project file

Audio uploads are handled as temporary processing files and are cleaned up after use by the application flow.

## Learning Profile System

The app includes an adaptive learner profile.

The profile can contain:

- native language
- interface language
- target language
- current level
- learning goal
- preferred feedback style
- preferred voice style

This profile influences:

- interface language
- TTS behavior
- STT summaries
- pronunciation feedback
- scenario generation
- translation support
- personalized practice generation

## Feature Workflow

### 1. Text to Voice (TTS)

Purpose:

- convert written text into spoken output

The user can:

- write text
- choose a voice
- choose a style
- choose a learning mode
- generate audio

The backend:

- builds a profile-aware TTS prompt
- sends the request to Gemini TTS
- wraps the returned PCM into WAV
- sends audio back to the frontend

### 2. Speech to Text (STT)

Purpose:

- convert learner speech into text and study material

The user can:

- upload audio
- record audio
- transcribe it
- view summary and notes
- extract vocabulary
- review suggested practice
- use translation support

The backend:

- uploads audio to Gemini
- requests structured JSON
- normalizes fields
- returns transcript, summary, vocabulary, and study notes

### 3. Pronunciation Practice

Purpose:

- help the learner compare their spoken output against a target sentence

The guided loop is:

1. generate a sentence
2. listen to the model
3. record the learner
4. analyze pronunciation
5. listen to audio feedback
6. continue with the next exercise

For custom text:

- the user can type their own sentence
- click `Update sentence guidance`
- receive fresh translation, explanation, focus points, and expected challenges

### 4. Scenario Practice

Purpose:

- create real-world speaking contexts

The user can:

- choose a scenario
- generate a mini dialogue
- listen to the dialogue
- select one line
- practice that line
- analyze pronunciation

### 5. Smart Translation Assistant

Purpose:

- turn speech practice into language understanding

Available in:

- STT results
- Practice results

The user can:

- request full translation
- request word-by-word translation
- extract key vocabulary
- get learner-friendly explanations
- listen to translated content as audio

## Prompt Engineering

The app uses structured prompt-building functions for major tasks.

Examples:

- TTS prompts
- STT prompts
- pronunciation prompts
- scenario prompts
- translation prompts
- practice explanation prompts

Prompt design principles:

- profile-aware
- strict JSON when needed
- pedagogical output
- concise learner-friendly feedback
- fallback handling for unclear audio

## Audio Handling

The app handles audio at several stages:

- browser recording
- frontend playback
- upload to backend
- temporary file persistence
- Gemini file upload
- temporary cleanup after processing

Important backend behavior:

- audio files are stored temporarily
- cleanup is scheduled after request completion
- no long-term audio storage is required

## UI and UX Design Direction

The product follows a professional enterprise-style interface.

Design principles:

- calm dark UI
- sidebar navigation
- card-based layouts
- progressive disclosure
- guided step-by-step flows
- friendly non-technical copy
- multilingual support
- accessibility-aware contrast

The UX is designed to reduce cognitive load while keeping all advanced features available.

## How to Run the Project

## Backend

Open a terminal and run:

```bash
cd backend
python -m venv .venv
```

If you use Windows Command Prompt:

```bash
.venv\Scripts\activate
```

If you use PowerShell:

```powershell
.venv\Scripts\Activate.ps1
```

Then install dependencies and run the API:

```bash
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## Frontend

Open a second terminal and run:

```bash
cd frontend
npm install
npm run dev
```

## Open the Application

Use:

`http://localhost:5173`

## What the User Must Do After Opening the App

1. Open `Settings`
2. Paste a personal Gemini API key
3. Wait until the app confirms that the key is approved
4. Complete or review the learning profile
5. Start using TTS, STT, Practice, or Scenario Practice

## Typical Runtime Flow

A common session might look like this:

1. user opens the app
2. user enters API key
3. user selects learning profile
4. user generates a practice sentence
5. user listens to model audio
6. user records a response
7. user analyzes pronunciation
8. user opens translation support
9. user studies vocabulary and explanation

This is why LinguistAI should be understood as a full speech-and-learning platform, not only a speech tool.

## Error Handling and Known Runtime Limits

Some errors come from Gemini availability rather than from the app itself.

Common cases:

- `429`: user quota or rate limit reached
- `503`: Gemini model temporarily overloaded
- API key rejected: invalid key or access issue

The app includes user-friendly handling for many of these cases, but cloud-model availability can still affect runtime behavior.

## Current Limitations

Current system limitations include:

- no user account system
- no persistent database
- learning history stored locally in browser storage
- dependence on Gemini availability and quotas
- some interface translations are partial
- pronunciation scoring is AI-based feedback, not a phoneme-aligner

## Why This Project Matters

LinguistAI demonstrates how modern multimodal AI can support spoken-language learning through:

- synthesis
- recognition
- pronunciation assessment
- contrastive explanation
- learner-aware adaptation

This makes it relevant both as:

- a speech-technology academic project
- a realistic AI product prototype

## Summary

LinguistAI is a personalized speech-learning system with:

- React frontend
- FastAPI backend
- Gemini integration
- adaptive learning profile
- TTS, STT, practice, scenario, and translation tools

To run it, the user mainly needs:

- Python
- Node.js
- a Gemini API key
- two terminals

Once started, the app provides a guided multilingual language-learning experience built around speech and understanding.

## Project Links

- GitHub: `https://github.com/shoali2023`
- Email: `ali.shoeibi1@gmail.com`
- LinkedIn: `https://www.linkedin.com/in/ali-shoeibi01/`
- Location: `Salamanca, Spain`
