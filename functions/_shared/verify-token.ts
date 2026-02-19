// 공유 유틸: HMAC 토큰 검증

export async function verifyToken(
  token: string,
  secret: string
): Promise<boolean> {
  if (!token || !secret) return false;

  const dotIndex = token.indexOf(".");
  if (dotIndex === -1) return false;

  const timestamp = token.slice(0, dotIndex);
  const providedSig = token.slice(dotIndex + 1);

  // 토큰 유효기간 30일
  const age = Date.now() - parseInt(timestamp, 10);
  if (isNaN(age) || age < 0 || age > 30 * 24 * 60 * 60 * 1000) return false;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const expectedSig = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(timestamp)
  );
  const expectedHex = Array.from(new Uint8Array(expectedSig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  // 타이밍 공격 방지를 위한 상수 시간 비교
  if (expectedHex.length !== providedSig.length) return false;
  let diff = 0;
  for (let i = 0; i < expectedHex.length; i++) {
    diff |= expectedHex.charCodeAt(i) ^ providedSig.charCodeAt(i);
  }
  return diff === 0;
}
