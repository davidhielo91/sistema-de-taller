import crypto from "crypto";

const CLIENT_TOKEN_SECRET = process.env.CLIENT_TOKEN_SECRET || "str-client-portal-secret-2024";

export function generateClientToken(orderNumber: string, phone: string): string {
  const payload = `${orderNumber}:${phone.replace(/\D/g, "")}:${Date.now()}`;
  const signature = crypto.createHmac("sha256", CLIENT_TOKEN_SECRET).update(payload).digest("hex");
  const encoded = Buffer.from(payload).toString("base64url");
  return `${encoded}.${signature}`;
}

export function verifyClientToken(token: string): { orderNumber: string; phone: string } | null {
  try {
    if (!token || !token.includes(".")) return null;
    const [encoded, signature] = token.split(".");
    const payload = Buffer.from(encoded, "base64url").toString();
    const [orderNumber, phone, timestampStr] = payload.split(":");

    // Verify signature
    const expectedSig = crypto.createHmac("sha256", CLIENT_TOKEN_SECRET).update(payload).digest("hex");
    if (signature !== expectedSig) return null;

    // Check expiry (24 hours)
    const timestamp = parseInt(timestampStr, 10);
    if (Date.now() - timestamp > 24 * 60 * 60 * 1000) return null;

    return { orderNumber, phone };
  } catch {
    return null;
  }
}
