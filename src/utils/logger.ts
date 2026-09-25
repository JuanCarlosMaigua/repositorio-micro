
const sanitizeArgs = (args: any[]): any[] => {
  return args.map(arg => {
    if (typeof arg === 'object' && arg !== null) {
      const sanitized = { ...arg };
      for (const key of Object.keys(sanitized)) {
        if (['password', 'token', 'accessToken', 'refreshToken', 'ssn'].includes(key.toLowerCase())) {
          sanitized[key] = '[REDACTED]';
        }
      }
      return sanitized;
    }
    return arg;
  });
};

export const logger = {
    info: (message: string, ...args: any[]) => {
      console.log(`[INFO] ${message}`, ...sanitizeArgs(args));
    },
  
    error: (message: string, ...args: any[]) => {
      console.error(`[ERROR] ${message}`, ...sanitizeArgs(args));
    },
  
    warn: (message: string, ...args: any[]) => {
      console.warn(`[WARN] ${message}`, ...sanitizeArgs(args));
    },
  
    debug: (message: string, ...args: any[]) => {
      console.debug(`[DEBUG] ${message}`, ...sanitizeArgs(args));
    }
  };
  