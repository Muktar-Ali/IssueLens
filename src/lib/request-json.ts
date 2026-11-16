export class RequestBodyTooLargeError extends Error {
  constructor(public readonly maximumBytes: number) {
    super(`The request body exceeds the ${maximumBytes}-byte limit`);
    this.name = "RequestBodyTooLargeError";
  }
}

export async function readLimitedJson(
  request: Request,
  maximumBytes: number,
): Promise<unknown> {
  const contentLength = request.headers.get("content-length");
  if (contentLength) {
    const declaredBytes = Number(contentLength);
    if (Number.isFinite(declaredBytes) && declaredBytes > maximumBytes) {
      throw new RequestBodyTooLargeError(maximumBytes);
    }
  }

  if (!request.body) return JSON.parse("") as unknown;

  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let bytesRead = 0;
  let body = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    bytesRead += value.byteLength;
    if (bytesRead > maximumBytes) {
      await reader.cancel();
      throw new RequestBodyTooLargeError(maximumBytes);
    }

    body += decoder.decode(value, { stream: true });
  }

  body += decoder.decode();
  return JSON.parse(body) as unknown;
}
