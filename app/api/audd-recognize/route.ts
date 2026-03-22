import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

function getAudDToken() {
  return process.env.AUDD_API_TOKEN || "";
}

export async function POST(request: Request) {
  try {
    const token = getAudDToken();
    if (!token) {
      return NextResponse.json(
        {
          status: "error",
          error: {
            error_code: 0,
            error_message:
              "Missing AudD token on server. Set AUDD_API_TOKEN in .env.local and restart.",
          },
        },
        { status: 503 },
      );
    }

    const incoming = await request.formData();
    const outgoing = new FormData();
    outgoing.append("api_token", token);

    const file = incoming.get("file");
    const url = incoming.get("url");
    const ret = incoming.get("return");

    if (file instanceof File) {
      outgoing.append("file", file, file.name || "clip.webm");
    }
    if (typeof url === "string" && url.trim()) {
      outgoing.append("url", url.trim());
    }
    if (typeof ret === "string" && ret.trim()) {
      outgoing.append("return", ret.trim());
    }

    if (!outgoing.get("file") && !outgoing.get("url")) {
      return NextResponse.json(
        {
          status: "error",
          error: {
            error_code: 700,
            error_message: "Attach a file or pass url for AudD recognition.",
          },
        },
        { status: 400 },
      );
    }

    const upstream = await fetch("https://api.audd.io/", {
      method: "POST",
      body: outgoing,
      cache: "no-store",
    });
    const data = await upstream.json();
    return NextResponse.json(data, { status: upstream.ok ? 200 : upstream.status });
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        error: {
          error_code: 500,
          error_message:
            error instanceof Error ? error.message : "AudD proxy failed unexpectedly.",
        },
      },
      { status: 500 },
    );
  }
}
