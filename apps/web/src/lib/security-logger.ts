export enum SecurityEventType {
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILED = 'LOGIN_FAILED',
  REGISTER_SUCCESS = 'REGISTER_SUCCESS',
  REGISTER_FAILED = 'REGISTER_FAILED',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  INVALID_TOKEN = 'INVALID_TOKEN',
  UNAUTHORIZED_ACCESS = 'UNAUTHORIZED_ACCESS',
  REVENUE_ACCESS = 'REVENUE_ACCESS',
}

export interface SecurityLogEntry {
  timestamp: Date;
  eventType: SecurityEventType;
  userId?: string;
  email?: string;
  ip?: string;
  userAgent?: string;
  details?: string;
}

class SecurityLogger {
  private logs: SecurityLogEntry[] = [];
  private maxLogs = 10000; // Garder les 10000 derniers logs en mémoire

  log(entry: Omit<SecurityLogEntry, 'timestamp'>): void {
    const logEntry: SecurityLogEntry = {
      ...entry,
      timestamp: new Date(),
    };

    this.logs.push(logEntry);

    // Limiter la taille du tableau
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Log dans la console en développement
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[SECURITY] ${logEntry.eventType}`, {
        email: logEntry.email,
        userId: logEntry.userId,
        ip: logEntry.ip,
        details: logEntry.details,
      });
    }

    // En production, vous pourriez envoyer ces logs vers un service externe
    // comme Sentry, LogRocket, ou votre propre système de logging
  }

  getRecentLogs(limit: number = 100): SecurityLogEntry[] {
    return this.logs.slice(-limit);
  }

  getLogsByUser(userId: string, limit: number = 100): SecurityLogEntry[] {
    return this.logs
      .filter(log => log.userId === userId)
      .slice(-limit);
  }

  getFailedLoginAttempts(email: string, since: Date): number {
    return this.logs.filter(
      log =>
        log.eventType === SecurityEventType.LOGIN_FAILED &&
        log.email === email &&
        log.timestamp >= since
    ).length;
  }
}

export const securityLogger = new SecurityLogger();
