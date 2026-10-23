import fs from 'fs';
import path from 'path';

/**
 * Robust .env file reader that directly parses .env and updates process.env,
 * ensuring changes to .env take effect immediately even in long-running dev servers.
 */
export function ensureEnvLoaded(): void {
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      const lines = content.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx !== -1) {
          const key = trimmed.slice(0, eqIdx).trim();
          let val = trimmed.slice(eqIdx + 1).trim();
          if (
            (val.startsWith('"') && val.endsWith('"')) ||
            (val.startsWith("'") && val.endsWith("'"))
          ) {
            val = val.slice(1, -1);
          }
          process.env[key] = val;
        }
      }
    }
  } catch {
    if (typeof process.loadEnvFile === 'function') {
      try {
        process.loadEnvFile();
      } catch {
        // ignore
      }
    }
  }
}
