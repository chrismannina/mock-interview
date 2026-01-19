# Round Zero - AI Interview Practice

Practice job interviews with an AI interviewer. Get realistic questions, real-time conversation with voice support, and actionable feedback to improve your interview skills.

## Features

- **Multiple Role Types**: Practice for specific roles including Director of Pharmacy Analytics, Software Engineer, Product Manager, Data Analyst, or general interviews
- **Custom Job Descriptions**: Paste a job description to get tailored interview questions
- **Single or Panel Interviews**: Choose between a one-on-one interview or a panel with multiple interviewers
- **Voice Conversation**: Speak your responses using speech recognition and hear AI responses with text-to-speech (uses built-in browser APIs - no additional cost)
- **Detailed Feedback**: Get comprehensive feedback including overall score, strengths, areas to improve, and question-by-question analysis with example better answers

## Setup

### Prerequisites

- Node.js 18+
- Azure OpenAI resource with a deployed model (GPT-4 or GPT-3.5 recommended)

### Installation

1. Clone the repository:
   ```bash
   git clone <repo-url>
   cd mock-interview
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   ```bash
   cp .env.example .env.local
   ```

4. Edit `.env.local` with your Azure OpenAI credentials:
   ```
   AZURE_OPENAI_ENDPOINT=https://your-resource-name.openai.azure.com/
   AZURE_OPENAI_API_KEY=your-api-key-here
   AZURE_OPENAI_DEPLOYMENT_NAME=your-deployment-name
   AZURE_OPENAI_API_VERSION=2024-02-15-preview
   ```

5. Run the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. **Landing Page**: Learn about Round Zero and click "Start Practicing"
2. **Setup Page**:
   - Select your target role type
   - Choose single or panel interview format
   - Optionally paste a job description for tailored questions
3. **Interview Session**:
   - The AI interviewer will introduce themselves and begin asking questions
   - Type your responses or use the microphone for voice input
   - Toggle auto-speak to hear AI responses read aloud
   - The interview will naturally conclude after 5-7 questions
4. **Feedback Page**:
   - View your overall score
   - See your strengths and areas to improve
   - Click each question for detailed feedback and example better answers
   - Practice again to improve!

## Voice Features

- **Speech Recognition**: Click the microphone button to speak your responses (Chrome/Edge recommended)
- **Text-to-Speech**: Toggle the speaker icon to have AI responses read aloud
- Both features use built-in browser Web Speech APIs - no additional API costs

## Tech Stack

- Next.js 15 with App Router
- TypeScript
- Tailwind CSS
- Azure OpenAI API
- Web Speech API (browser-native)

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── chat/route.ts      # Interview conversation API
│   │   └── feedback/route.ts  # Feedback generation API
│   ├── feedback/page.tsx      # Feedback results page
│   ├── interview/page.tsx     # Interview chat interface
│   ├── setup/page.tsx         # Interview configuration
│   ├── page.tsx               # Landing page
│   ├── layout.tsx             # Root layout
│   └── globals.css            # Global styles
├── hooks/
│   └── useSpeech.ts           # Speech recognition & synthesis hooks
└── types/
    └── interview.ts           # TypeScript type definitions
```
