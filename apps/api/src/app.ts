import express from 'express'
import cors from 'cors'

// Create the Express application.
// It's kept separate from index.ts (which starts the server) so tests can
// import the app and send it fake requests without opening a real port.
export const app = express()

// Middleware: code that runs on every request before it reaches a route.
app.use(cors()) // allow the React website (a different port) to call this API
app.use(express.json()) // turn JSON request bodies into JavaScript objects

// Route: GET /api/health
// A simple "are you alive?" check used by monitoring and CI smoke tests.
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'av-gear-tracker-api',
    timestamp: new Date().toISOString(),
  })
})
