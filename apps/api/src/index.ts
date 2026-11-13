import { app } from './app.js'

// Use the PORT environment variable if a hosting service sets one,
// otherwise default to 3000 on your Mac.
const PORT = Number(process.env.PORT) || 3000

app.listen(PORT, () => {
  console.log(`API running at http://localhost:${PORT}`)
})
