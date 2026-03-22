# Karaoke Listen

Responsive Next.js web app MVP that:

1. asks for microphone permission
2. records 10 seconds in the browser
3. uploads the clip to `POST /api/recognize`
4. fingerprints audio server-side with Chromaprint `fpcalc`
5. looks up the song through AcoustID
6. fetches synced lyrics from LRCLIB
7. renders a dark karaoke screen with auto-scrolling highlighted lyrics

Product behavior:

- No download required
- No payment gate
- Works on phones, tablets, and desktop browsers
- Tries to start listening as soon as the site opens (with tap fallback when browsers require user interaction)

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS v4
- Framer Motion
- Browser `MediaRecorder`
- Server-side `ffmpeg` + Chromaprint `fpcalc`
- AcoustID as the primary free recognition route
- LRCLIB for synced/plain lyrics fallback

## Environment

Required:

```bash
ACOUSTID_API_KEY=your_free_acoustid_app_key
```

Important: use your own AcoustID app key. The public sample key often returns no matches for real-world clips.

Optional:

```bash
FFMPEG_PATH=/opt/homebrew/bin/ffmpeg
FPCALC_PATH=/opt/homebrew/bin/fpcalc
```

## System prerequisites

This MVP fingerprints audio on the backend, so the server must have these binaries installed:

- `ffmpeg`
- `fpcalc` from Chromaprint

macOS example:

```bash
brew install ffmpeg chromaprint
```

Ubuntu example:

```bash
sudo apt-get update
sudo apt-get install -y ffmpeg chromaprint-tools
```

## Local run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

You can start from:

```bash
cp .env.example .env.local
```

## How recognition works

- The browser never fingerprints audio.
- The client sends the recorded clip as multipart form data to `/api/recognize`.
- The backend normalizes the clip to mono WAV with `ffmpeg`.
- The backend runs `fpcalc -json` to generate `duration` + `fingerprint`.
- The backend calls AcoustID lookup with that fingerprint.
- The best match is used to request lyrics from LRCLIB.
- If synced lyrics are unavailable, the app falls back to plain lyrics.
- If LRCLIB has nothing, the UI shows `No synced lyrics found`.

## Swappable architecture

Recognition is intentionally split into provider modules:

- [`app/api/recognize/route.ts`](/Users/akashcetorelli/Documents/New%20project/app/api/recognize/route.ts)
- [`lib/server/recognition/providers.ts`](/Users/akashcetorelli/Documents/New%20project/lib/server/recognition/providers.ts)
- [`lib/server/recognition/acoustid.ts`](/Users/akashcetorelli/Documents/New%20project/lib/server/recognition/acoustid.ts)

To swap to AudD or ACRCloud later, add another provider implementing the same `RecognitionProvider` interface and register it in `getRecognitionProviders()`.

## MVP file tree

```text
/Users/akashcetorelli/Documents/New project
├── app
│   ├── api
│   │   └── recognize
│   │       └── route.ts
│   ├── favicon.ico
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components
│   └── karaoke-listen
│       ├── karaoke-listen-app.tsx
│       ├── karaoke-lyrics-panel.tsx
│       └── listening-orb.tsx
├── .env.example
├── lib
│   ├── karaoke
│   │   ├── lrc.ts
│   │   └── types.ts
│   ├── server
│   │   └── recognition
│   │       ├── acoustid.ts
│   │       ├── audio-processing.ts
│   │       ├── lrclib.ts
│   │       └── providers.ts
│   └── utils
│       └── cn.ts
├── next.config.ts
├── package.json
├── postcss.config.mjs
├── README.md
└── tsconfig.json
```

## Notes

- `MediaRecorder` support still varies by browser version, especially on older iOS builds.
- This MVP is optimized for localhost or a Node server with binary access. It is not set up for edge runtimes.
- AcoustID matching quality depends heavily on clip clarity and whether the sampled section is distinctive enough.
