const MAX_BODY_BYTES = 450_000;

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
}

export async function readJson(request: Request): Promise<Record<string, unknown> | null> {
  const declared = Number(request.headers.get('content-length') ?? 0);
  if (declared > MAX_BODY_BYTES) return null;
  const body = request.body;
  if (!body) return null;
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let text = '';
  let finished = false;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) {
        finished = true;
        break;
      }
      text += decoder.decode(value, { stream: true });
      // Cap on actual bytes read, not just the declared content-length — a
      // client can lie about the length header for a chunked body.
      if (text.length > MAX_BODY_BYTES) return null;
    }
    text += decoder.decode();
  } finally {
    if (!finished) {
      try {
        await reader.cancel();
      } catch {
        /* stream already released */
      }
    } else {
      reader.releaseLock();
    }
  }
  try {
    const parsed: unknown = JSON.parse(text);
    if (typeof parsed !== 'object' || parsed === null) return null;
    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function methodNotAllowed(): Response {
  return json({ error: 'Method not allowed.' }, 405);
}