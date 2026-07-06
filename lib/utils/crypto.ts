// lib/utils/crypto.ts

type VerificationPayloadInput = {
  poNumber: string;
  vendorName: string;
  customerName: string;
  docType: string;
  issuedAt: string;
};

export function buildVerificationPayload(input: VerificationPayloadInput) {
  return JSON.stringify({
    po: input.poNumber,
    vendor: input.vendorName,
    customer: input.customerName,
    type: input.docType,
    issuedAt: input.issuedAt,
  });
}

/**
 * Generates a SHA-256 Cryptographic Hash from a given string payload.
 * Native Web Crypto API is used for zero-dependency, high-speed hashing.
 */
export async function generateDocumentHash(payload: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(payload);
  
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  
  // Convert bytes to hex string
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  return hashHex;
}