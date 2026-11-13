// A custom error that carries an HTTP status code.
// Routes throw it (e.g. `throw new HttpError(404, 'Item not found')`), and the
// error handler in app.ts turns it into a clean JSON response.
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown,
  ) {
    super(message)
  }
}
