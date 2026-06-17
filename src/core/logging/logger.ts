/**
 * Logging estructurado (JSON). Una sola linea por evento, con campos tipados.
 * En produccion estos JSON se ingieren tal cual; en dev se leen igual de bien.
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export type LogFields = Readonly<Record<string, unknown>>;

export interface Logger {
  debug(message: string, fields?: LogFields): void;
  info(message: string, fields?: LogFields): void;
  warn(message: string, fields?: LogFields): void;
  error(message: string, fields?: LogFields): void;
  /** Devuelve un logger hijo con campos fijos (p.ej. tenantId, module). */
  child(bindings: LogFields): Logger;
}

const order: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 };

const write = (level: LogLevel, message: string, base: LogFields, fields?: LogFields): void => {
  const entry = {
    level,
    time: new Date().toISOString(),
    message,
    ...base,
    ...fields,
  };
  const line = JSON.stringify(entry);
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);
};

const make = (minLevel: LogLevel, base: LogFields): Logger => {
  const enabled = (level: LogLevel): boolean => order[level] >= order[minLevel];
  return {
    debug: (m, f) => enabled('debug') && write('debug', m, base, f),
    info: (m, f) => enabled('info') && write('info', m, base, f),
    warn: (m, f) => enabled('warn') && write('warn', m, base, f),
    error: (m, f) => enabled('error') && write('error', m, base, f),
    child: (bindings) => make(minLevel, { ...base, ...bindings }),
  };
};

export const createLogger = (bindings: LogFields = {}): Logger => {
  const minLevel: LogLevel = process.env.NODE_ENV === 'production' ? 'info' : 'debug';
  return make(minLevel, bindings);
};
