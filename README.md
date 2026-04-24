# LinguistAI

LinguistAI is a speech-learning web app. It helps the user:

- turn text into voice
- turn speech into text
- practice pronunciation
- understand speech with translation and vocabulary help

This guide is written for a non-technical user.

If you can copy and paste commands into `Command Prompt` or `PowerShell`, you can run this project.

## Before You Start

You need these 4 things:

1. `Git`
2. `Node.js`
3. `Python`
4. A `Gemini API key`

Important:

- The app does **not** include an API key.
- Each user must use **their own** Gemini API key.
- The key is entered inside the app.
- The backend does **not** save the key permanently.

## What You Need To Install

### 1. Install Git

Download and install:

`https://git-scm.com/downloads`

### 2. Install Node.js

Download and install the `LTS` version:

`https://nodejs.org/`

### 3. Install Python

Download and install Python `3.11` or newer:

`https://www.python.org/downloads/`

Very important during Python installation:

- enable `Add Python to PATH` if the installer shows that option

### 4. Create or get your Gemini API key

Get it from Google AI Studio / Gemini developer tools.

Direct link:

`https://aistudio.google.com/app/apikey`

You will paste it later inside the app, not in the code.

Privacy note:

- the app runs locally on the user's machine
- the user enters the API key directly in the app
- the backend does not permanently store the API key
- the repository does not include a private API key

## Quick Start

If you already installed Git, Node.js, and Python, follow these exact steps.

## Step 1. Download the Project

Open `Command Prompt` or `PowerShell`, then copy and paste:

```bash
git clone https://github.com/YOUR-USERNAME/YOUR-REPOSITORY.git
cd LinguistAI
```

If your folder name is different, go into that folder instead.

## Step 2. Start the Backend

Open a terminal inside the project folder and run these commands:

```bash
cd backend
python -m venv .venv
```

Now activate the virtual environment.

If you are using Windows Command Prompt:

```bash
.venv\Scripts\activate
```

If you are using Windows PowerShell:

```powershell
.venv\Scripts\Activate.ps1
```

Then install the backend packages:

```bash
pip install -r requirements.txt
```

Then start the backend server:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

When it works, you should see something similar to:

`Uvicorn running on http://0.0.0.0:8000`

Leave this terminal open.

## Step 3. Start the Frontend

Open a **second** terminal.

Go to the project folder and run:

```bash
cd frontend
npm install
npm run dev
```

When it works, you should see a local address like:

`http://localhost:5173`

Leave this terminal open too.

## Step 4. Open the App

Open your browser and go to:

`http://localhost:5173`

## Step 5. Enter Your Gemini API Key

Inside the app:

1. Open `Settings`
2. Find the API key field
3. Paste your Gemini API key
4. Wait for the message that says the key is approved

After that, you can use the app.

## What the User Can Do in the App

### Dashboard

See:

- learning profile
- scores
- recent practice
- weak points
- quick actions

### Text to Voice (TTS)

Use this page to:

- type text
- generate voice
- hear pronunciation audio

### Speech to Text (STT)

Use this page to:

- upload audio
- record audio
- get transcript
- get summary
- get vocabulary help
- use translation support

### Practice

Use this page to:

- generate a practice sentence
- write your own sentence
- update sentence guidance
- hear model audio
- record yourself
- analyze pronunciation

### Scenario Practice

Use this page to:

- generate a dialogue
- hear it
- practice one line

## If the User Wants to Practice With Custom Text

In `Practice`:

1. write your own sentence
2. click `Update sentence guidance`

That gives:

- Translation
- Explanation
- Focus Points
- Expected Challenges

Then the user can continue with:

- `Listen to the model voice`
- `Record yourself`
- `Analyze your pronunciation`

## Where To Find Word-by-Word Translation

After you get results in:

- `Speech to Text`
- or `Practice`

look for:

`Understand this content`

Inside that area, click:

`Word-by-word translation`

That opens the table:

- Word
- Meaning

## Very Simple Daily Usage

After everything is installed, next time the user only needs to do this:

### Terminal 1

```bash
cd LinguistAI\backend
.venv\Scripts\activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Terminal 2

```bash
cd LinguistAI\frontend
npm run dev
```

Then open:

`http://localhost:5173`

## Common Problems and Easy Fixes

### Problem: `python is not recognized`

Reason:

- Python is not installed
- or it was installed without PATH

Fix:

- install Python again
- enable `Add Python to PATH`

### Problem: `npm is not recognized`

Reason:

- Node.js is not installed correctly

Fix:

- install Node.js again from the official site

### Problem: `Failed to fetch`

Reason:

- backend is not running
- frontend is using the wrong port
- browser is still using an old page

Fix:

1. make sure backend terminal is still running
2. make sure frontend terminal is still running
3. open `http://localhost:5173`
4. refresh the browser with `Ctrl + F5`

### Problem: API key is rejected

Reason:

- wrong key
- expired key
- copied with extra spaces

Fix:

- paste the key again carefully
- try a new Gemini API key

### Problem: TTS says quota reached

Reason:

- free-tier Gemini TTS limit was reached

Fix:

- wait and try again later
- or use a Gemini project with more quota

### Problem: Practice says Gemini is overloaded

Reason:

- Gemini audio analysis is temporarily busy

Fix:

- wait a little
- try again

### Problem: PowerShell blocks activation script

If this happens in PowerShell, use Command Prompt instead.

Then run:

```bash
.venv\Scripts\activate
```

## Recommended Way for a Non-Technical User

If the user is not technical, the easiest path is:

1. Install Git
2. Install Node.js
3. Install Python
4. Copy the project from GitHub
5. Run the backend commands exactly as shown
6. Run the frontend commands exactly as shown
7. Open the browser
8. Paste Gemini API key in `Settings`

That is enough to use the project.

## Security Note

The app is designed so that:

- the Gemini API key is entered by the user
- the key is sent in request headers
- the backend does not store the key permanently
- there is no hardcoded secret in the repository

## Project Contact

Project author and contact:

- GitHub: `https://github.com/shoali2023`
- Email: `ali.shoeibi1@gmail.com`
- LinkedIn: `https://www.linkedin.com/in/ali-shoeibi01/`
- Location: `Salamanca, Spain`

## For GitHub Users

If you publish this project, users should know:

- they must install Python and Node.js
- they must run backend and frontend separately
- they must use their own Gemini API key
- some Gemini features may fail temporarily if quota is exceeded or the model is under high demand

## Copy-Paste Summary

If the user wants the shortest possible version, here it is.

### Backend

```bash
cd LinguistAI
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend

```bash
cd LinguistAI
cd frontend
npm install
npm run dev
```

### Open in browser

```text
http://localhost:5173
```

### Inside the app

1. Open `Settings`
2. Paste Gemini API key
3. Start using the app

## Project Purpose

- speech synthesis
- speech recognition
- pronunciation tutoring
- translation support
- adaptive language-learning workflows

It is designed to feel like a real product, not only a technical demo.
