// lib/logging.ts
// A simple logging utility. In a production environment, this would send logs
// to a centralized logging service (e.g., via a Next.js API route).

type LogLevel = "info" | "warn" | "error" | "debug"

interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  context?: Record<string, any>
}

export const log = (level: LogLevel, message: string, context?: Record<string, any>) => {
  const logEntry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    context,
  }

  // For demonstration, we'll just log to console.
  // In a real app, you might send this to a serverless function:
  // fetch('/api/log', { method: 'POST', body: JSON.stringify(logEntry) });

  switch (level) {
    case "info":
      console.info(`[INFO] ${logEntry.timestamp}: ${message}`, context || "")
      break
    case "warn":
      console.warn(`[WARN] ${logEntry.timestamp}: ${message}`, context || "")
      break
    case "error":
      console.error(`[ERROR] ${logEntry.timestamp}: ${message}`, context || "")
      break
    case "debug":
      console.debug(`[DEBUG] ${logEntry.timestamp}: ${message}`, context || "")
      break
    default:
      console.log(`[LOG] ${logEntry.timestamp}: ${message}`, context || "")
  }
}
