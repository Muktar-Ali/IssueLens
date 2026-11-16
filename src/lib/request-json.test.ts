import { describe, expect, it } from "vitest";
import { readLimitedJson, RequestBodyTooLargeError } from "./request-json";

describe("readLimitedJson", () => {
  it("parses JSON within the byte limit", async () => {
    const request = new Request("http://localhost/test", {
      method: "POST",
      body: JSON.stringify({ issueUrl: "https://github.com/example/project/issues/1" }),
    });

    await expect(readLimitedJson(request, 256)).resolves.toEqual({
      issueUrl: "https://github.com/example/project/issues/1",
    });
  });

  it("rejects a declared oversized body before reading it", async () => {
    const request = new Request("http://localhost/test", {
      method: "POST",
      headers: { "content-length": "4096" },
      body: "{}",
    });

    await expect(readLimitedJson(request, 2048)).rejects.toBeInstanceOf(
      RequestBodyTooLargeError,
    );
  });

  it("rejects streamed content that exceeds the limit", async () => {
    const request = new Request("http://localhost/test", {
      method: "POST",
      body: JSON.stringify({ value: "x".repeat(128) }),
    });

    await expect(readLimitedJson(request, 64)).rejects.toBeInstanceOf(
      RequestBodyTooLargeError,
    );
  });
});
