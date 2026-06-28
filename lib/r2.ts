import { AwsClient } from "aws4fetch";

import { getEnv } from "@/lib/env";

let cachedClient: AwsClient | null = null;

function getClient(): AwsClient {
  if (cachedClient) {
    return cachedClient;
  }

  const env = getEnv();
  cachedClient = new AwsClient({
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    service: "s3",
    region: "auto",
  });
  return cachedClient;
}

function endpointForKey(key: string): string {
  const env = getEnv();
  // Keep slashes in the key path unescaped; escape everything else.
  const encodedKey = key
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
  return `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${env.R2_BUCKET}/${encodedKey}`;
}

/** Public URL a photo is served from once uploaded. */
export function publicUrlForKey(key: string): string {
  const base = getEnv().R2_PUBLIC_BASE_URL.replace(/\/+$/, "");
  return `${base}/${key}`;
}

/**
 * Presign a PUT URL for a browser to upload a blob directly to R2.
 * The client uploads with `fetch(url, { method: "PUT", body: blob })`.
 */
export async function createPresignedPutUrl(
  key: string,
  expiresIn = 3600,
): Promise<string> {
  const url = new URL(endpointForKey(key));
  url.searchParams.set("X-Amz-Expires", String(expiresIn));

  const signed = await getClient().sign(url.toString(), {
    method: "PUT",
    aws: { signQuery: true },
  });

  return signed.url;
}
