# LLM-Mediated Video Information Reception Experiment

An online experiment studying how people interact with video content through LLM-mediated interfaces. Built with Empirica v2 for randomized controlled trial (RCT) design.

## Overview

This experiment investigates information reception from video content under varying conditions of LLM assistance. Participants watch videos on assigned topics and answer comprehension questions, with treatment conditions that vary whether and how an LLM can access the video content.

### Treatment Conditions

- **LLM with video understanding**: LLM has semantic access to video content via the Gemini API
- **LLM without video access**: LLM provides text-only assistance (no video context)
- **No LLM (control)**: Participants answer questions using only the video content

### Topics

The experiment includes multiple topic pools (e.g., news events, historical facts, scientific topics), each with short and long video content sourced from YouTube.

## Tech Stack

- **Empirica v2** -- Experiment framework (Node.js backend, React frontend)
- **React 18** -- Frontend UI
- **Gemini API** -- LLM integration with video understanding capabilities
- **shadcn/ui** -- Component library (Tailwind CSS)
- **YouTube IFrame API** -- Video playback and engagement tracking

## Setup

### Prerequisites

- Node.js (v18+)
- npm
- An Empirica installation (`npm install -g empirica`)
- A Google Gemini API key

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd <repository-directory>
   ```

2. Install dependencies:
   ```bash
   cd client && npm install && cd ..
   cd server && npm install && cd ..
   ```

3. Configure environment variables:
   ```bash
   cp .env.example .env
   # Edit .env and add your Gemini API key
   ```

4. Update Empirica configuration:
   - Edit `.empirica/empirica.toml` with your own `srtoken` and admin password

5. Run the experiment:
   ```bash
   empirica
   ```

6. Access the application:
   - Player view: `http://localhost:3000`
   - Admin panel: `http://localhost:3000/admin`

## Project Structure

```
.empirica/           # Empirica configuration and treatments
client/              # React frontend
  src/
    intro-exit/      # Pre/post-game survey steps
    stages/          # In-game experiment stages
    components/      # Reusable UI components
    config/          # Question banks and video pools
server/              # Node.js backend
  src/
    callbacks.js     # Game lifecycle hooks
    index.js         # Custom API endpoints (LLM integration)
```

## Data Export

```bash
empirica export
```

Produces CSV files for players, games, rounds, stages, and per-player stage data.

## License

This code is provided for review purposes.
