# Dots and Boxes

A real-time multiplayer web game built with Next.js 15, TypeScript, Tailwind CSS, Socket.IO, and a custom Node.js server.

## Features
- Real-time multiplayer gameplay
- Modern, responsive UI with animations
- Custom room system, player colors, and turn-based logic
- Production-ready code and architecture

## Tech Stack
- Next.js 15 App Router
- TypeScript
- Tailwind CSS
- Socket.IO (custom Node.js server)
- Zustand (state management)

## Setup & Run

1. **Install dependencies:**
   ```bash
   npm install
   ```
2. **Run development server:**
   ```bash
   npm run dev
   ```
   The app will be available at http://localhost:3000

3. **Build for production:**
   ```bash
   npm run build
   npm start
   ```

## Deployment (Vercel + Custom WebSocket Server)
- Deploy the Next.js frontend to Vercel as usual.
- Deploy the custom Socket.IO server (in `/server`) to a Node.js host (e.g., Render, Railway, or your own VPS).
- Set the WebSocket server URL in an environment variable (see `.env.example`).

## Folder Structure
- `app/` — Next.js App Router pages
- `components/` — UI components
- `hooks/` — Custom React hooks
- `lib/` — Shared libraries
- `server/` — Custom Node.js Socket.IO server
- `socket/` — Client socket logic
- `store/` — Zustand state management
- `types/` — TypeScript types
- `utils/` — Utility functions

## License
MIT
