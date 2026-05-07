// AES-256-GCM 暗号化ユーティリティ。SESSION_SECRET から SHA-256 で 32byte 鍵を導出。
// 暗号文は `v1:<base64(iv|ciphertext|tag)>` のフォーマットで保存し、復号時にバージョン判定する。
// 既存の平文値（v1: prefix なし）は復号せずそのまま返すことで、データ移行をブロックしない。

const VERSION = "v1";

let cachedKey: CryptoKey | undefined;

async function getKey(): Promise<CryptoKey> {
  if (cachedKey) return cachedKey;
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is not set");
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(secret));
  cachedKey = await crypto.subtle.importKey(
    "raw",
    digest,
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"],
  );
  return cachedKey;
}

function toBase64(bytes: Uint8Array): string {
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s);
}

function fromBase64(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export async function encryptString(plain: string): Promise<string> {
  const key = await getKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cipher = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      new TextEncoder().encode(plain),
    ),
  );
  // iv (12) + cipher+tag を連結
  const combined = new Uint8Array(iv.length + cipher.length);
  combined.set(iv, 0);
  combined.set(cipher, iv.length);
  return `${VERSION}:${toBase64(combined)}`;
}

// 暗号化フォーマット (v1:...) なら復号、そうでなければ平文として扱う（後方互換）。
export async function decryptStringIfEncrypted(value: string | null | undefined): Promise<string | null> {
  if (!value) return null;
  if (!value.startsWith(`${VERSION}:`)) return value; // 平文（マイグレーション前）
  try {
    const key = await getKey();
    const combined = fromBase64(value.slice(VERSION.length + 1));
    const iv = combined.slice(0, 12);
    const cipher = combined.slice(12);
    const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, cipher);
    return new TextDecoder().decode(plain);
  } catch {
    return null; // 復号失敗（鍵ローテーション後など）
  }
}

export function isEncrypted(value: string | null | undefined): boolean {
  return !!value && value.startsWith(`${VERSION}:`);
}
