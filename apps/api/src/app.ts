import express, { type NextFunction, type Request, type Response } from 'express'
import cors from 'cors'
import { itemsRouter } from './routes/items.js'
import { peopleRouter } from './routes/people.js'

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

// Routers group related routes. Everything in itemsRouter starts with /api/items.
app.use('/api/items', itemsRouter)
app.use('/api/people', peopleRouter)

// Error handler: catches anything a route throws (like a database error)
// and returns a clean JSON message instead of crashing or leaking details.
// Express recognizes it as an error handler because it takes 4 arguments.
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err)
  res.status(500).json({ message: 'Something went wrong on the server' })
})
