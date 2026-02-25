import { NextResponse } from "next/server";

export async function GET() {
  const upstream = process.env.OLLAMA_URL || "http://localhost:11434";
  const candidates = [
    "/api/tags", // Native Ollama
    "/v1/models", // OpenAI compatibility
    "/api/models", // Common proxy path
    "/models",
  ];

  for (const p of candidates) {
    const url = `${upstream.replace(/\/$/, "")}${p.startsWith("/") ? p : `/${p}`}`;
    try {
      const perReqController = new AbortController();
      // timeout after 5s
      const timeoutId = setTimeout(() => perReqController.abort(), 5000);

      const res = await fetch(url, {
        signal: perReqController.signal,
        // Ensure no cache to avoid stale model lists
        cache: "no-store",
      });

      clearTimeout(timeoutId);

      if (res.status === 404) {
        continue;
      }

      if (!res.ok) {
        const text = await res.text();
        try {
          const json = JSON.parse(text);
          return NextResponse.json(
            {
              error: json.error || `Upstream error: ${res.status}`,
              upstream: json,
            },
            { status: 502 },
          );
        } catch {
          return NextResponse.json(
            { error: `Upstream error: ${res.status}`, body: text },
            { status: 502 },
          );
        }
      }

      const text = await res.text();
      try {
        const json = JSON.parse(text);
        // Successfully found a working endpoint
        return NextResponse.json(json);
      } catch {
        // Fallback for non-JSON responses that are still 200 OK
        return new NextResponse(text, { status: 200 });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (
        msg?.toLowerCase().includes("abort") ||
        msg?.toLowerCase().includes("timeout")
      ) {
        continue;
      }
      // If it's a connection refused or other network error, we can try next candidate too
      // maybe the specific port/path is weird.
      console.warn(`[Ollama Discovery] Failed to reach ${url}: ${msg}`);
    }
  }

  return NextResponse.json(
    {
      error: `No reachable Ollama models endpoint found at ${upstream}. Ensure Ollama is running and accessible.`,
    },
    { status: 502 },
  );
}
