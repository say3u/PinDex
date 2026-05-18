# Pindex

A real-time bowling performance tracker for league bowlers.

## Features
- Log shots frame-by-frame during a game
- Track spare conversion rates by pin configuration
- Identify which pins you leave most often
- Visualize performance trends across sessions and seasons
- League stats dashboard

## Stack
- **Mobile**: Expo (React Native)
- **Backend**: FastAPI + PostgreSQL (Supabase)
- **Web Dashboard**: Next.js

## Project Structure
```
bowling-tracker/
├── mobile/     # Expo app — shot logging during games
├── backend/    # FastAPI — API + business logic
└── web/        # Next.js — analytics dashboard
```

## Getting Started

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

### Mobile
```bash
cd mobile
npm install
npx expo start
```

### Web
```bash
cd web
npm install
npm run dev
```
