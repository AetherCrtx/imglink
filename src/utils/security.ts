/**
 * Cryptographic SHA-256 hash calculator for zero-exposure route matching in client
 */
export async function computeSha256(text: string): Promise<string> {
  if (!text) return '';
  try {
    const msgBuffer = new TextEncoder().encode(text);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  } catch {
    return '';
  }
}

// SHA-256 one-way cryptographic fingerprint of the secret admin route
// Prevents plain-text route leakage in client bundles or console inspection
export const ADMIN_GATE_FINGERPRINT =
  'ead9505c7217327a7759c1b0c7f776d9b350716434390cfa99fc26e314c0fd97';
