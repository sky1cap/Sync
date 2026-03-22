// @ts-nocheck
"use client";

import { useState, useRef, useEffect, useCallback, useLayoutEffect, memo } from "react";
import * as THREE from "three";
import musicEqualizerData from "./music-equalizer.json";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Ear,
  Mic,
  PanelLeftClose,
  PanelLeftOpen,
  Pause,
  Play,
  RotateCcw,
  RotateCw,
  Search,
  Share2,
} from "lucide-react";

/* ═══════════════════ CONFIG ═══════════════════ */
const RECORD_SECONDS = 10;
const LRCLIB = "https://lrclib.net";
const SECOND_WINDOW_OFFSET = 1.2;
const COARSE_NUDGE_MS = 500;
const ACTIVE_LINE_PREROLL_MS = -90;
const AUTO_RESYNC_CLIP_SECONDS = 3.2;
const AUTO_RESYNC_DRIFT_THRESHOLD_SEC = 0.15;
const BEAT_CHECK_INTERVAL_MS = 5000;
const ONSET_THRESHOLD = 0.45;
const MAX_LOCAL_DRIFT_CORRECTION_MS = 200;
const DRIFT_LERP_DURATION_MS = 600;
const FALLBACK_RESYNC_DELAY_MS = 9000;
const LRC_DURATION_MISMATCH_SEC = 10;
const ENABLE_FALLBACK_AUDD_RESYNC = true;
const ENABLE_LOCAL_DRIFT_CORRECTION = true;
const LOCAL_DRIFT_MIN_RUNTIME_SEC = 12;
const LYRIC_LINE_HEIGHT_PX = 84;
const LYRICS_VISIBLE_LINES = 9;
const LYRIC_ROW_MIN_HEIGHT_PX = 56;
const ELAPSED_COMMIT_INTERVAL_MS = 100;
const MATCH_POSITION_IN_CLIP_RATIO = 0.9;

/* ═══════════════════ LRC PARSER ═══════════════════ */
function parseLRC(lrc) {
  if (!lrc) return [];
  const parsed = [];
  const rows = lrc.split(/\r?\n/);

  for (const row of rows) {
    const line = row.trim();
    if (!line) continue;

    // Supports [mm:ss], [mm:ss.xx], [mm:ss.xxx], and multiple tags in one row.
    const tags = [...line.matchAll(/\[(\d{1,2}):(\d{2})(?:[.:](\d{1,3}))?\]/g)];
    if (!tags.length) continue;

    const text = line.replace(/\[[^\]]+\]/g, "").trim() || "♪";
    for (const tag of tags) {
      const mm = Number.parseInt(tag[1], 10);
      const ss = Number.parseInt(tag[2], 10);
      const fracRaw = tag[3] || "0";
      const frac = Number.parseInt(fracRaw.padEnd(3, "0"), 10) / 1000;
      if (Number.isNaN(mm) || Number.isNaN(ss)) continue;
      parsed.push({ time: mm * 60 + ss + frac, text });
    }
  }

  return parsed.sort((a, b) => a.time - b.time);
}

function fmt(s) {
  if (!s || s < 0) s = 0;
  return `${Math.floor(s / 60)}:${Math.floor(s % 60)
    .toString()
    .padStart(2, "0")}`;
}

function parseAudDTimecode(raw) {
  if (!raw) return 0;
  if (typeof raw === "number") return raw;
  if (typeof raw !== "string") return 0;
  if (raw.includes(":")) return raw.split(":").reduce((a, b) => a * 60 + +b, 0);
  return parseFloat(raw) || 0;
}

function parseDurationSeconds(raw) {
  if (raw == null) return null;
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  if (typeof raw !== "string") return null;
  const value = raw.trim();
  if (!value) return null;
  if (value.includes(":")) {
    const parts = value.split(":").map((x) => Number.parseFloat(x));
    if (parts.some((x) => Number.isNaN(x))) return null;
    return parts.reduce((acc, cur) => acc * 60 + cur, 0);
  }
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeCompareText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function textOverlapScore(expected, actual) {
  const a = normalizeCompareText(expected);
  const b = normalizeCompareText(actual);
  if (!a || !b) return 0;
  if (a === b) return 1;
  if (b.includes(a) || a.includes(b)) return 0.86;
  const aWords = new Set(a.split(" ").filter(Boolean));
  const bWords = new Set(b.split(" ").filter(Boolean));
  let common = 0;
  for (const word of aWords) {
    if (bWords.has(word)) common += 1;
  }
  return common / Math.max(1, aWords.size);
}

function isInstrumentalLine(text) {
  const value = String(text || "").toLowerCase();
  if (!value) return false;
  if (value.trim() === "♪") return true;
  return (
    value.includes("instrumental") ||
    value.includes("music") ||
    value.includes("[music]") ||
    value.includes("(music)")
  );
}

function mapMicErrorToMessage(err) {
  const name = err?.name || "";
  const message = String(err?.message || "").toLowerCase();
  const isLocalhost =
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1");
  const insecure =
    typeof window !== "undefined" &&
    !window.isSecureContext &&
    !isLocalhost;

  if (insecure) {
    return "Microphone needs HTTPS on mobile. Open the HTTPS URL (not http://192.168...).";
  }
  if (name === "NotAllowedError" || name === "PermissionDeniedError") {
    return "Microphone permission denied. Please allow mic access and try again.";
  }
  if (name === "NotFoundError" || name === "DevicesNotFoundError") {
    return "No microphone was found on this device.";
  }
  if (name === "NotReadableError" || name === "TrackStartError") {
    return "Microphone is busy or blocked by another app.";
  }
  if (name === "NotSupportedError" || message.includes("mediarecorder")) {
    return "This browser doesn't support microphone recording in the current mode.";
  }
  if (name === "SecurityError") {
    return "Microphone is blocked by browser security settings.";
  }
  return "Could not start microphone capture. Please try again.";
}

function isDurationCompatible(leftSec, rightSec, toleranceSec = LRC_DURATION_MISMATCH_SEC) {
  if (!Number.isFinite(leftSec) || !Number.isFinite(rightSec)) return true;
  return Math.abs(leftSec - rightSec) <= toleranceSec;
}

function extractCoverFromAudDResult(result) {
  const apple = result?.apple_music?.artwork?.url || "";
  if (apple) return apple.replace("{w}", "1200").replace("{h}", "1200");
  const spotifyImage = result?.spotify?.album?.images?.[0]?.url;
  if (spotifyImage) return spotifyImage;
  const deezer = result?.deezer?.album?.cover_xl || result?.deezer?.album?.cover_big;
  if (deezer) return deezer;
  return "";
}

function pickBestLyricCandidate(items, title, artist, durationSec) {
  if (!Array.isArray(items) || items.length === 0) return null;
  let best = null;
  let bestCompatible = null;
  for (const item of items) {
    const titleScore = textOverlapScore(
      title,
      item?.trackName || item?.track_name || item?.name || "",
    );
    const artistScore = textOverlapScore(
      artist,
      item?.artistName || item?.artist_name || item?.artist || "",
    );
    const syncedBoost = item?.syncedLyrics ? 0.22 : 0;
    const candidateDuration =
      parseDurationSeconds(item?.duration) ??
      parseDurationSeconds(item?.durationSeconds) ??
      parseDurationSeconds(item?.length);
    const durationMismatch =
      Number.isFinite(durationSec) &&
      Number.isFinite(candidateDuration) &&
      !isDurationCompatible(durationSec, candidateDuration);
    const durationPenalty =
      durationSec && candidateDuration
        ? Math.min(0.35, Math.abs(candidateDuration - durationSec) / 120)
        : 0;
    const mismatchPenalty = durationMismatch ? 0.45 : 0;
    const score =
      titleScore * 0.58 + artistScore * 0.42 + syncedBoost - durationPenalty - mismatchPenalty;
    if (!best || score > best.score) {
      best = { item, score };
    }
    if (!durationMismatch && (!bestCompatible || score > bestCompatible.score)) {
      bestCompatible = { item, score };
    }
  }
  return bestCompatible?.item ?? best?.item ?? null;
}

async function fetchItunesArtwork(title, artist) {
  try {
    const term = encodeURIComponent(`${title} ${artist}`.trim());
    const url = `https://itunes.apple.com/search?term=${term}&entity=song&limit=5`;
    const res = await fetch(url);
    if (!res.ok) return "";
    const payload = await res.json();
    const candidates = Array.isArray(payload?.results) ? payload.results : [];
    const best = pickBestLyricCandidate(
      candidates.map((x) => ({
        trackName: x.trackName,
        artistName: x.artistName,
        duration: x.trackTimeMillis ? x.trackTimeMillis / 1000 : null,
        artwork: x.artworkUrl100 || x.artworkUrl60 || "",
      })),
      title,
      artist,
      null,
    );
    const artwork = best?.artwork || candidates[0]?.artworkUrl100 || "";
    if (!artwork) return "";
    return artwork
      .replace("100x100bb.jpg", "1200x1200bb.jpg")
      .replace("60x60bb.jpg", "1200x1200bb.jpg");
  } catch {
    return "";
  }
}

function audioBufferToWavBlob(audioBuffer, startSec, durationSec) {
  const sampleRate = audioBuffer.sampleRate;
  const startSample = Math.max(0, Math.floor(startSec * sampleRate));
  const durationSamples = Math.max(1, Math.floor(durationSec * sampleRate));
  const endSample = Math.min(audioBuffer.length, startSample + durationSamples);
  const frameCount = Math.max(0, endSample - startSample);

  if (frameCount < 32) {
    return null;
  }

  const channels = audioBuffer.numberOfChannels;
  const mono = new Float32Array(frameCount);

  for (let ch = 0; ch < channels; ch += 1) {
    const input = audioBuffer.getChannelData(ch);
    for (let i = 0; i < frameCount; i += 1) {
      mono[i] += input[startSample + i] / channels;
    }
  }

  const dataSize = frameCount * 2;
  const wavBuffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(wavBuffer);
  let offset = 0;

  const writeString = (value) => {
    for (let i = 0; i < value.length; i += 1) {
      view.setUint8(offset + i, value.charCodeAt(i));
    }
    offset += value.length;
  };

  writeString("RIFF");
  view.setUint32(offset, 36 + dataSize, true);
  offset += 4;
  writeString("WAVE");
  writeString("fmt ");
  view.setUint32(offset, 16, true);
  offset += 4;
  view.setUint16(offset, 1, true);
  offset += 2;
  view.setUint16(offset, 1, true);
  offset += 2;
  view.setUint32(offset, sampleRate, true);
  offset += 4;
  view.setUint32(offset, sampleRate * 2, true);
  offset += 4;
  view.setUint16(offset, 2, true);
  offset += 2;
  view.setUint16(offset, 16, true);
  offset += 2;
  writeString("data");
  view.setUint32(offset, dataSize, true);
  offset += 4;

  for (let i = 0; i < frameCount; i += 1) {
    const clamped = Math.max(-1, Math.min(1, mono[i]));
    view.setInt16(offset, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true);
    offset += 2;
  }

  return new Blob([wavBuffer], { type: "audio/wav" });
}

function findLyricIndexByTime(lines, timeSec) {
  if (!lines?.length) return -1;
  for (let i = 0; i < lines.length; i += 1) {
    const next = lines[i + 1]?.time ?? Number.POSITIVE_INFINITY;
    if (timeSec >= lines[i].time && timeSec < next) return i;
  }
  return lines.length - 1;
}

function buildFakeTimestamps(plainLines, songDurationSec) {
  const lines = (plainLines || []).map((line) => String(line || "").trim()).filter(Boolean);
  if (!lines.length) return [{ time: 0, text: "♪" }];

  const totalDuration =
    Number.isFinite(songDurationSec) && songDurationSec > 0
      ? songDurationSec
      : lines.length * 3.5;
  const charCounts = lines.map((line) => Math.max(line.length, 5));
  const totalChars = charCounts.reduce((a, b) => a + b, 0);
  const usableDuration = totalDuration * 0.9;
  const startOffset = totalDuration * 0.05;

  let currentTime = startOffset;
  return lines.map((text, index) => {
    const entry = { time: currentTime, text };
    const weight = charCounts[index] / Math.max(1, totalChars);
    currentTime += weight * usableDuration;
    return entry;
  });
}

function useLocalDriftCorrection({
  analyserRef,
  anchorRef,
  lyricsRef,
  isPlaying,
  phase,
  enabled,
  onCorrect,
}) {
  const prevSpectrumRef = useRef(null);
  const spectrumScratchRef = useRef(null);
  const onsetLogRef = useRef([]);
  const driftSamplesRef = useRef([]);
  const onsetRafRef = useRef(null);

  useEffect(() => {
    cancelAnimationFrame(onsetRafRef.current);
    onsetRafRef.current = null;
    prevSpectrumRef.current = null;
    spectrumScratchRef.current = null;
    onsetLogRef.current = [];
    driftSamplesRef.current = [];

    if (phase !== "karaoke" || !isPlaying || !enabled) return;

    const tick = () => {
      const analyser = analyserRef.current;
      const anchor = anchorRef.current;
      if (analyser && anchor != null) {
        const bufLen = analyser.frequencyBinCount;
        if (!spectrumScratchRef.current || spectrumScratchRef.current.length !== bufLen) {
          spectrumScratchRef.current = new Float32Array(bufLen);
        }
        const spectrum = spectrumScratchRef.current;
        analyser.getFloatFrequencyData(spectrum);

        if (prevSpectrumRef.current && prevSpectrumRef.current.length === bufLen) {
          let flux = 0;
          for (let i = 0; i < bufLen; i += 1) {
            const diff = spectrum[i] - prevSpectrumRef.current[i];
            if (diff > 0) flux += diff;
          }
          flux /= bufLen;

          if (flux > ONSET_THRESHOLD) {
            const songNow = (performance.now() - anchor) / 1000;
            onsetLogRef.current.push(songNow);
            if (onsetLogRef.current.length > 40) onsetLogRef.current.shift();
          }
        }

        prevSpectrumRef.current = new Float32Array(spectrum);
      }
      onsetRafRef.current = requestAnimationFrame(tick);
    };

    onsetRafRef.current = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(onsetRafRef.current);
      onsetRafRef.current = null;
    };
  }, [analyserRef, anchorRef, isPlaying, phase, enabled]);

  useEffect(() => {
    if (phase !== "karaoke" || !isPlaying || !enabled) return;

    const interval = setInterval(() => {
      const anchor = anchorRef.current;
      const lyrics = lyricsRef.current || [];
      if (anchor == null || !lyrics.length) return;

      const songNow = (performance.now() - anchor) / 1000;
      if (songNow < LOCAL_DRIFT_MIN_RUNTIME_SEC) return;
      const recentOnsets = onsetLogRef.current.filter((t) => t > songNow - 10);
      if (recentOnsets.length < 3) return;

      let totalDrift = 0;
      let matchCount = 0;

      for (const onset of recentOnsets) {
        let bestDist = Infinity;
        for (const line of lyrics) {
          const dist = line.time - onset; // expected - observed
          if (Math.abs(dist) < Math.abs(bestDist)) bestDist = dist;
        }
        if (Math.abs(bestDist) < 1.2) {
          totalDrift += bestDist;
          matchCount += 1;
        }
      }

      if (matchCount < 3) return;
      const avgDrift = totalDrift / matchCount;

      if (
        Math.abs(avgDrift) > 0.12 &&
        Math.abs(avgDrift) < MAX_LOCAL_DRIFT_CORRECTION_MS / 1000
      ) {
        driftSamplesRef.current.push(avgDrift);
        if (driftSamplesRef.current.length >= 3) {
          const last3 = driftSamplesRef.current.slice(-3);
          const sameDirection =
            Math.sign(last3[0]) === Math.sign(last3[1]) &&
            Math.sign(last3[1]) === Math.sign(last3[2]);
          const spread = Math.max(...last3) - Math.min(...last3);
          const similarMagnitude = spread < 0.08;
          if (sameDirection && similarMagnitude) {
            const correction = (last3[0] + last3[1] + last3[2]) / 3;
            onCorrect(correction);
            driftSamplesRef.current = [];
            onsetLogRef.current = [];
          }
        }
      }
    }, BEAT_CHECK_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [anchorRef, isPlaying, lyricsRef, onCorrect, phase, enabled]);
}

function ShaderLoadingScreen({
  phase,
  progress,
  inputLevel,
  error,
  onStart,
  onRetry,
  fadingOut = false,
}) {
  const containerRef = useRef(null);
  const phaseRef = useRef(phase);
  const progressRef = useRef(progress);
  const inputLevelRef = useRef(inputLevel);
  const stateRef = useRef({
    appState: 0.0, // 0 idle, 1 searching, 2 fail
    stateProgress: 0.0,
    introFade: 0.0,
  });

  useEffect(() => {
    phaseRef.current = phase;
    progressRef.current = progress;
    inputLevelRef.current = inputLevel;
  }, [phase, progress, inputLevel]);

  useEffect(() => {
    const nextState =
      phase === "idle" || phase === "error" ? 0.0 : 1.0;
    if (stateRef.current.appState !== nextState) {
      stateRef.current.appState = nextState;
      stateRef.current.stateProgress = 0.0;
    }
  }, [phase]);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    const vertexShader = `
      void main() {
        gl_Position = vec4( position, 1.0 );
      }
    `;

    const fragmentShader = `
      precision highp float;
      uniform vec2 resolution;
      uniform float time;
      uniform float audioLevel;
      uniform float introFade;
      uniform float stateProgress;
      uniform float appState;
      uniform float playProgress;
      uniform float recognizeBlend;

      mat2 rotate2d(float angle){
          return mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
      }

      float random(vec2 st){
          return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
      }

      void main(void) {
          vec2 uv = (gl_FragCoord.xy * 2.0 - resolution.xy) / min(resolution.x, resolution.y);
          uv *= 2.8;

          float t = time * 0.05;
          float currentRadius = length(uv);
          float easeOutro = pow(stateProgress, 3.0);

          float distAmount = appState == 1.0 ? mix(0.012, 0.055, audioLevel) : 0.012;
          if (appState == 2.0) distAmount = mix(distAmount, 0.0, stateProgress);

          vec2 distortedUv = uv + vec2(sin(uv.y * 4.0 + t * 2.0), cos(uv.x * 4.0 + t * 2.0)) * distAmount;
          distortedUv = rotate2d(t * 0.25) * distortedUv;

          float intensity = 0.0;
          float baseLineWidth = mix(0.009, 0.02, audioLevel);
          float glowAmount = 0.006;

          for(int i = 0; i < 7; i++) {
              float fi = float(i);
              float waveOffset = 0.4;
              float chaos = sin(t * 1.18 + fi * 2.1) * 0.5 + cos(t * 0.62 - fi * 1.4) * 0.5;
              float playingOffset = 0.4 + (chaos * 0.5 + 0.5) * (0.02 + audioLevel * 0.38) + (fi * 0.026 * audioLevel);

              if (appState <= 1.0) {
                  waveOffset = mix(0.4, playingOffset, playProgress);
              } else if (appState == 2.0) {
                  float prevOffset = mix(0.4, playingOffset, playProgress);
                  waveOffset = mix(prevOffset, 0.4, stateProgress);
              }

              float ripple = 0.0;
              if (playProgress > 0.0) {
                  float rippleMain = sin(distortedUv.x * 4.3 + distortedUv.y * 4.3 + t * 6.0) * 0.022 * (0.35 + audioLevel * 0.45) * playProgress;
                  float rippleDetail = cos(distortedUv.x * 2.6 - distortedUv.y * 3.1 + t * 4.2 + fi * 0.35) * 0.006 * playProgress;
                  ripple = rippleMain + rippleDetail;
              }
              float dist = abs(waveOffset - currentRadius + ripple);
              intensity += baseLineWidth / (dist + glowAmount);
          }

          vec3 coolBlue = vec3(0.0, 0.42, 0.98);
          vec3 electricBlue = vec3(0.0, 0.88, 1.0);
          vec3 blueColor = mix(coolBlue, electricBlue, sin(length(uv) * 2.15 - t * 0.9) * 0.5 + 0.5);
          vec3 deepRed = vec3(0.95, 0.08, 0.18);
          vec3 hotRed = vec3(1.0, 0.34, 0.12);
          vec3 analyzeColor = mix(deepRed, hotRed, sin(length(uv) * 2.6 - t * 1.15) * 0.5 + 0.5);
          float analyzeColorMix = clamp(recognizeBlend * (0.52 + playProgress * 0.48), 0.0, 1.0);
          vec3 baseColor = mix(blueColor, analyzeColor, analyzeColorMix);

          if (appState == 2.0) {
              baseColor = mix(baseColor, vec3(1.0, 0.0, 0.1), stateProgress);
          }

          vec3 finalColor = baseColor * intensity;
          finalColor += (random(uv + t) - 0.5) * 0.015;

          float alpha = introFade;
          if (appState == 2.0) {
              alpha *= (1.0 - easeOutro * 0.35);
          }

          gl_FragColor = vec4(finalColor * alpha, 1.0);
      }
    `;

    const camera = new THREE.Camera();
    camera.position.z = 1;

    const scene = new THREE.Scene();
    const geometry = new THREE.PlaneGeometry(2, 2);

    const uniforms = {
      time: { value: 1.0 },
      resolution: { value: new THREE.Vector2() },
      audioLevel: { value: 0.0 },
      introFade: { value: 0.0 },
      stateProgress: { value: 0.0 },
      appState: { value: 0.0 },
      playProgress: { value: 0.0 },
      recognizeBlend: { value: 0.0 },
    };

    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader,
      fragmentShader,
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    const onWindowResize = () => {
      renderer.setSize(container.clientWidth, container.clientHeight);
      uniforms.resolution.value.x = renderer.domElement.width;
      uniforms.resolution.value.y = renderer.domElement.height;
    };

    onWindowResize();
    window.addEventListener("resize", onWindowResize);

    let animationId;
    let targetAudioLevel = 0;
    let listeningRamp = 0;
    let smoothedLiveLevel = 0;
    let phaseListeningBlend = 0;
    let phaseRecognizingBlend = 0;

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      uniforms.time.value += 0.05;

      if (stateRef.current.introFade < 1.0) {
        stateRef.current.introFade += 0.01;
      }
      uniforms.introFade.value = stateRef.current.introFade;

      const targetState = stateRef.current.appState;
      uniforms.appState.value += (targetState - uniforms.appState.value) * 0.08;

      const targetPlayProgress = targetState === 1.0 ? 1.0 : 0.0;
      uniforms.playProgress.value +=
        (targetPlayProgress - uniforms.playProgress.value) * 0.038;
      const targetRecognizeBlend = phaseRef.current === "recognizing" ? 1.0 : 0.0;
      uniforms.recognizeBlend.value +=
        (targetRecognizeBlend - uniforms.recognizeBlend.value) * 0.03;

      const targetListeningBlend = phaseRef.current === "listening" ? 1.0 : 0.0;
      phaseListeningBlend += (targetListeningBlend - phaseListeningBlend) * 0.08;
      phaseRecognizingBlend += (targetRecognizeBlend - phaseRecognizingBlend) * 0.08;

      if (targetState === 2.0 && stateRef.current.stateProgress < 1.0) {
        stateRef.current.stateProgress += 0.015;
      } else if (targetState !== 2.0) {
        stateRef.current.stateProgress = Math.max(
          0,
          stateRef.current.stateProgress - 0.03,
        );
      }
      uniforms.stateProgress.value = Math.min(stateRef.current.stateProgress, 1.0);

      if (targetState === 1.0) {
        const t = uniforms.time.value;
        const baseWave =
          0.28 +
          Math.sin(t * 1.35) * 0.045 +
          Math.sin(t * 2.2 + 1.2) * 0.03;
        const live = Math.max(0, Math.min(1, inputLevelRef.current || 0));
        smoothedLiveLevel += (live - smoothedLiveLevel) * 0.08;
        listeningRamp = Math.min(1, listeningRamp + 0.03);

        const listeningLevel = Math.max(
          0.08,
          Math.min(
            0.4,
            (0.12 + baseWave * 0.24 + smoothedLiveLevel * 0.32) * listeningRamp,
          ),
        );
        const recognizingLevel =
          baseWave +
          0.14 +
          Math.max(0.06, Math.sin(progressRef.current * Math.PI) * 0.18);

        const blendSum = Math.max(0.001, phaseListeningBlend + phaseRecognizingBlend);
        const listenWeight = phaseListeningBlend / blendSum;
        const recognizeWeight = phaseRecognizingBlend / blendSum;
        targetAudioLevel = listeningLevel * listenWeight + recognizingLevel * recognizeWeight;
      } else {
        listeningRamp = 0;
        smoothedLiveLevel = 0;
        targetAudioLevel = 0.0;
      }

      uniforms.audioLevel.value +=
        (targetAudioLevel - uniforms.audioLevel.value) * 0.03;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      window.removeEventListener("resize", onWindowResize);
      cancelAnimationFrame(animationId);
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      geometry.dispose();
      material.dispose();
    };
  }, []);

  const listening = phase === "listening";
  const recognizing = phase === "recognizing";
  const secondsLeft = Math.max(
    0,
    Math.ceil(RECORD_SECONDS - progress * RECORD_SECONDS),
  );

  return (
    <div
      className={`relative flex h-screen w-full flex-col items-center justify-center overflow-hidden bg-black font-sans transition-all duration-200 ${
        fadingOut ? "opacity-0" : "opacity-100"
      }`}
    >
      <style>{`
        @keyframes bg-gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes dot-bounce {
          0%, 80%, 100% { transform: scale(0.5); opacity: 0.45; }
          40% { transform: scale(1); opacity: 1; }
        }
        .animated-bg-search {
          background: linear-gradient(-45deg, #050505, #260940, #09153d, #3d0c24, #050505);
          background-size: 300% 300%;
          animation: bg-gradient 6s ease infinite;
        }
      `}</style>

      <div
        className={`animated-bg-search absolute inset-0 z-0 blur-[60px] transition-opacity duration-200 ${
          fadingOut
            ? "opacity-0"
            : phase === "idle"
              ? "opacity-20"
              : phase === "error"
                ? "opacity-30"
                : "opacity-100"
        }`}
      />
      <div
        className={`pointer-events-none absolute top-8 left-8 z-30 transition-opacity duration-500 ${
          phase === "idle" ? "opacity-100" : "opacity-0"
        }`}
      >
        <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">
          Sync.
        </h1>
      </div>
      <div
        ref={containerRef}
        className={`absolute inset-0 z-10 transition-opacity duration-180 ${
          fadingOut || phase === "error" ? "opacity-0" : "opacity-100"
        }`}
      />

      <div
        className={`relative z-20 flex h-full w-full flex-col items-center justify-center transition-opacity duration-300 ${
          fadingOut ? "opacity-0" : "opacity-100"
        }`}
      >
        {(phase === "idle" || listening || recognizing) && (
          <div className="pointer-events-auto absolute top-1/2 left-1/2 flex h-32 w-32 -translate-x-1/2 -translate-y-1/2 items-center justify-center">
            <div
              className={`pointer-events-none absolute inset-0 rounded-full blur-[30px] transition-all duration-700 ${
                phase === "idle"
                  ? "animate-pulse bg-blue-500/30 scale-100"
                  : phase === "recognizing"
                    ? "bg-pink-500/20 scale-110"
                    : "animate-pulse bg-blue-500/24 scale-105"
              }`}
            />
            {phase === "idle" ? (
              <button
                onClick={onStart}
                className="relative flex cursor-pointer items-center justify-center border-none bg-transparent text-white"
                aria-label="Start Listening"
              >
                <Mic
                  className="h-10 w-10 text-white drop-shadow-[0_0_15px_rgba(0,128,255,0.8)]"
                  strokeWidth={1.5}
                />
              </button>
            ) : listening ? (
              <div className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full bg-white/90"
                  style={{ animation: "dot-bounce 1s ease-in-out infinite 0ms" }}
                />
                <span
                  className="h-2.5 w-2.5 rounded-full bg-white/90"
                  style={{ animation: "dot-bounce 1s ease-in-out infinite 140ms" }}
                />
                <span
                  className="h-2.5 w-2.5 rounded-full bg-white/90"
                  style={{ animation: "dot-bounce 1s ease-in-out infinite 280ms" }}
                />
              </div>
            ) : (
              <div className="relative flex items-center justify-center">
                <Search
                  className={`h-10 w-10 text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.4)] ${
                    recognizing ? "animate-spin" : "animate-pulse"
                  }`}
                  strokeWidth={1.5}
                />
              </div>
            )}
          </div>
        )}

        {phase === "idle" && (
          <div className="absolute top-[72%] left-1/2 -translate-x-1/2 text-center">
            <p className="text-sm uppercase tracking-[0.3em] text-white/45">Karaoke Listen</p>
            <p className="mt-3 text-xl font-medium tracking-widest text-white/70">
              Tap Mic To Start
            </p>
          </div>
        )}

        {listening && (
          <div className="absolute top-[74%] left-1/2 -translate-x-1/2 text-center">
            <p className="text-xl font-medium uppercase tracking-widest text-white/70">
              Listening...
            </p>
            <p className="mt-2 text-sm text-white/45">{secondsLeft}s left</p>
          </div>
        )}

        {recognizing && (
          <div className="absolute top-[74%] left-1/2 -translate-x-1/2 text-center">
            <p className="text-xl font-medium uppercase tracking-widest text-white/70">
              Finding Match...
            </p>
            <p className="mt-2 text-sm text-pink-300/70">Analyzing audio print</p>
          </div>
        )}

        {phase === "error" && (
          <div className="absolute top-[40%] left-1/2 z-50 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center px-6 text-center">
            <span className="error-title mb-2 text-4xl font-bold tracking-tight text-white md:text-5xl">
              Try Again
            </span>
            <p className="error-subtitle mb-7 max-w-[520px] text-sm text-white/70 md:text-base">
              {error || "Tap play to listen again."}
            </p>
            <button type="button" onClick={onRetry} className="error-try-btn" aria-label="Try Again">
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function MusicEqualizerLottie({ active }) {
  const hostRef = useRef(null);
  const animationRef = useRef(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoaded(false);
    const hostNode = hostRef.current;

    const boot = async () => {
      try {
        const lottieMod = await import("lottie-web");
        const lottie = lottieMod?.default || lottieMod;
        if (cancelled || !hostNode || !lottie?.loadAnimation || !musicEqualizerData) return;
        animationRef.current = lottie.loadAnimation({
          container: hostNode,
          renderer: "svg",
          loop: true,
          autoplay: true,
          animationData: musicEqualizerData,
          rendererSettings: { preserveAspectRatio: "xMidYMid meet" },
        });
        setLoaded(true);
      } catch {
        setLoaded(false);
      }
    };

    boot();
    return () => {
      cancelled = true;
      if (animationRef.current) {
        animationRef.current.destroy();
        animationRef.current = null;
      }
      if (hostNode) hostNode.innerHTML = "";
    };
  }, []);

  return (
    <span className="mx-auto flex w-full max-w-[130px] items-center justify-center">
      <span
        ref={hostRef}
        className={`music-lottie ${loaded ? "opacity-100" : "opacity-0"} pointer-events-none`}
        style={{
          width: active ? "86px" : "72px",
          height: active ? "86px" : "72px",
          transition: "opacity 260ms ease",
        }}
      />
      {!loaded && (
        <span
          className="flex items-end gap-1.5"
          aria-hidden="true"
          style={{ height: active ? "44px" : "38px" }}
        >
          <span className="eq-bar h-[30%] w-1.5 rounded-full bg-white/80" />
          <span className="eq-bar h-[75%] w-1.5 rounded-full bg-white/95 [animation-delay:120ms]" />
          <span className="eq-bar h-[45%] w-1.5 rounded-full bg-white/80 [animation-delay:220ms]" />
          <span className="eq-bar h-[85%] w-1.5 rounded-full bg-white/95 [animation-delay:320ms]" />
        </span>
      )}
    </span>
  );
}

const LyricLineItem = memo(function LyricLineItem({
  text,
  isActive,
  isPast,
  textAlign,
  distanceFromActive,
  onClick,
  rowRef,
}) {
  const isNear = !isActive && Math.abs(distanceFromActive) === 1;
  const stateClass = isActive ? "lyric-active" : isNear ? "lyric-near" : isPast ? "lyric-past" : "lyric-future";
  const alignClass =
    textAlign === "center"
      ? "mx-auto w-full origin-center text-center"
      : textAlign === "right"
        ? "ml-auto w-full origin-right text-right"
        : "mr-auto w-full origin-left text-left";
  const baseScale = isActive
    ? 1.01
    : isNear
      ? 0.99
      : Math.abs(distanceFromActive) <= 2
        ? 0.97
        : 0.95;
  const instrumental = isInstrumentalLine(text);
  const canSeek = !instrumental;

  return (
    <button
      ref={rowRef}
      type="button"
      onClick={canSeek ? onClick : undefined}
      className={`lyric-line ${stateClass} ${alignClass} ${instrumental ? "lyric-instrumental" : ""} max-w-[980px] px-2 ${canSeek ? "cursor-pointer" : "cursor-default"}`}
      style={{
        minHeight: `${LYRIC_ROW_MIN_HEIGHT_PX}px`,
        paddingTop: isActive ? "8px" : isNear ? "6px" : "4px",
        paddingBottom: isActive ? "8px" : isNear ? "6px" : "4px",
        transform: `scale(${baseScale})`,
        pointerEvents: "auto",
      }}
      aria-label={instrumental ? "Instrumental section" : undefined}
    >
      {instrumental ? (
        <MusicEqualizerLottie active={isActive || isNear} />
      ) : (
        <span className="lyric-text block w-full whitespace-normal font-semibold tracking-tight">
          {text}
        </span>
      )}
    </button>
  );
});

function KaraokePage({
  song,
  lines,
  activeIdx,
  elapsed,
  playing,
  offsetMs,
  syncNote,
  onPause,
  onResume,
  onJumpTo,
  onSeekToTime,
  onNudge,
  onNewSong,
  fadingOut = false,
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [alignment, setAlignment] = useState("left");
  const [isDragging, setIsDragging] = useState(false);
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [showEndSearchCTA, setShowEndSearchCTA] = useState(false);
  const [autoSearchCountdown, setAutoSearchCountdown] = useState(10);
  const miniTrackRef = useRef(null);
  const vertTrackRef = useRef(null);
  const progressContainerRef = useRef(null);

  const lyricLines =
    lines && lines.length
      ? lines.map((line) => ({
          time: Number.isFinite(line?.time) ? line.time : 0,
          text: typeof line?.text === "string" && line.text.trim() ? line.text : "♪",
        }))
      : [{ time: 0, text: "No synced lyrics found" }];

  const currentIdx = Math.max(0, Math.min(activeIdx < 0 ? 0 : activeIdx, lyricLines.length - 1));
  const verticalFocusIndex = showEndSearchCTA ? lyricLines.length : currentIdx;
  const metadataDuration = Number.isFinite(song?.duration) ? Math.ceil(song.duration) : 0;
  const totalDuration = Math.max(1, metadataDuration, Math.ceil(lyricLines[lyricLines.length - 1]?.time ?? 0) + 4);
  const currentTime = Math.max(0, elapsed);
  const hasEnded = currentTime >= totalDuration - 0.08;
  const progressPct = Math.max(0, Math.min(100, (currentTime / totalDuration) * 100));
  const cover =
    song?.cover ||
    "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=1200&auto=format&fit=crop";

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  useEffect(() => {
    if (typeof document === "undefined" || !document.fonts?.ready) {
      setFontsLoaded(true);
      return;
    }
    let mounted = true;
    const fallback = window.setTimeout(() => {
      if (mounted) setFontsLoaded(true);
    }, 1200);
    document.fonts.ready.then(() => {
      if (mounted) setFontsLoaded(true);
      window.clearTimeout(fallback);
    }).catch(() => {
      if (mounted) setFontsLoaded(true);
      window.clearTimeout(fallback);
    });
    return () => {
      mounted = false;
      window.clearTimeout(fallback);
    };
  }, []);

  useEffect(() => {
    if (!isDragging) return;
    const handleMouseMove = (e) => {
      if (!progressContainerRef.current) return;
      const rect = progressContainerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const pct = Math.max(0, Math.min(x / rect.width, 1));
      onSeekToTime(pct * totalDuration);
    };
    const handleMouseUp = () => setIsDragging(false);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, onSeekToTime, totalDuration]);

  useEffect(() => {
    if (!playing || !hasEnded) return;
    onPause();
    setShowEndSearchCTA(true);
    setAutoSearchCountdown(10);
  }, [hasEnded, onPause, playing]);

  useEffect(() => {
    if (!showEndSearchCTA) return;
    const timer = window.setInterval(() => {
      setAutoSearchCountdown((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer);
          onNewSong();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [onNewSong, showEndSearchCTA]);

  useEffect(() => {
    if (showEndSearchCTA && currentTime < totalDuration - 1) {
      setShowEndSearchCTA(false);
      setAutoSearchCountdown(10);
    }
  }, [currentTime, showEndSearchCTA, totalDuration]);

  useLayoutEffect(() => {
    if (!fontsLoaded || !miniTrackRef.current || !vertTrackRef.current) return;
    const actMini = miniTrackRef.current.children[currentIdx];
    const actVert = vertTrackRef.current.children[verticalFocusIndex];
    if (actMini) {
      const miniOffset = -(actMini.offsetLeft + actMini.offsetWidth / 2);
      miniTrackRef.current.style.transform = `translate(${miniOffset}px, -50%)`;
    }
    if (actVert) {
      const vertOffset = -(actVert.offsetTop + actVert.offsetHeight / 2);
      vertTrackRef.current.style.transform = `translateY(${vertOffset}px)`;
    }
  }, [currentIdx, verticalFocusIndex, alignment, lyricLines.length, fontsLoaded]);

  return (
    <div className={`lyric-player-root ${fadingOut ? "karaoke-fade-out" : ""}`}>
      <style>{`
        @keyframes karaokeFadeInRoot {
          from { opacity: 0; transform: scale(1.01); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes karaokeLeftIn {
          from { opacity: 0; transform: translateX(-14px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes karaokeRightIn {
          from { opacity: 0; transform: translateX(10px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes errorFadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .lyric-player-root {
          --bg-dark: #070709;
          --text-main: #ffffff;
          --text-dim: rgba(255,255,255,0.5);
          --sans: var(--font-plus-jakarta), var(--font-manrope), ui-sans-serif, system-ui, sans-serif;
          --lyrics-col-width: min(58%, 640px);
          position: absolute;
          inset: 0;
          background:
            linear-gradient(180deg, rgba(8,12,20,0.94) 0%, rgba(7,9,15,0.92) 100%),
            radial-gradient(1200px 680px at 62% 62%, rgba(14,32,86,0.42) 0%, rgba(7,9,15,0) 68%),
            radial-gradient(900px 520px at 34% 18%, rgba(45,10,60,0.16) 0%, rgba(7,9,15,0) 72%),
            var(--bg-dark);
          color: var(--text-main);
          overflow: hidden;
          animation: karaokeFadeInRoot .52s cubic-bezier(.2,.9,.4,1);
          transition: opacity .28s ease, transform .28s ease;
        }
        .karaoke-fade-out {
          opacity: 0;
          transform: scale(1.01);
          pointer-events: none;
        }
        .lyric-player-root * { box-sizing: border-box; }
        .app-dashboard { width: 100%; height: 100%; display: flex; justify-content:center; gap: 4px; align-items: stretch; padding: 26px 16px; position: relative; }
        .app-dashboard::before,
        .app-dashboard::after {
          content: "";
          position: absolute;
          left: 0;
          right: 0;
          pointer-events: none;
          z-index: 14;
        }
        .app-dashboard::before {
          top: 0;
          height: 170px;
          background: linear-gradient(to bottom, rgba(5,5,9,0.95), rgba(5,5,9,0.58), rgba(5,5,9,0));
        }
        .app-dashboard::after {
          bottom: 0;
          height: 170px;
          background: linear-gradient(to top, rgba(5,5,9,0.95), rgba(5,5,9,0.58), rgba(5,5,9,0));
        }
        .left-panel {
          position: relative;
          flex: 0 0 398px;
          overflow: hidden;
          border-right: 1px solid rgba(255,255,255,0.1);
          height: calc(100% - 118px);
          align-self: center;
          border-radius: 32px;
          transform: translateX(0);
          transition: all .5s cubic-bezier(.2,1,.3,1), transform .45s cubic-bezier(.2,1,.3,1);
          opacity: 1;
          display:flex;
          flex-direction:column;
          margin-left: 12px;
          z-index: 30;
          animation: karaokeLeftIn .56s cubic-bezier(.2,.9,.4,1) both;
        }
        .app-dashboard.collapsed .left-panel {
          flex: 0 0 0;
          opacity: 0;
          transform: translateX(-20px);
          margin-left: 0;
          border-width: 0;
          pointer-events: none;
        }
        .panel-bg-layer { position:absolute; inset:0; z-index:0; overflow:hidden; }
        .panel-bg-layer .bg-blur {
          width:100%; height:100%; object-fit:cover; filter: blur(60px) saturate(2) brightness(.7); transform: scale(1.25);
        }
        .panel-bg-layer .bg-gradient-overlay { position:absolute; inset:0; background: linear-gradient(to bottom, transparent 0%, rgba(0,0,0,.4) 50%, rgba(5,5,5,.95) 100%); }
        .panel-content-layer { position:relative; z-index:10; display:flex; flex-direction:column; height:100%; background: rgba(255,255,255,.05); backdrop-filter: blur(8px); }
        .album-art-wrapper { position:relative; width:100%; aspect-ratio:1/1; flex-shrink:0; }
        .top-gradient { position:absolute; top:0; left:0; width:100%; height:112px; z-index:2; background:linear-gradient(to bottom, rgba(0,0,0,.8), transparent); }
        .fg-art { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; z-index:1; mask-image: linear-gradient(to bottom, rgba(0,0,0,1) 50%, rgba(0,0,0,0) 100%); }
        .info-controls-wrapper { display:flex; flex-direction:column; flex:1; padding:0 40px 0; }
        .track-info { margin-top:-65px; margin-bottom:24px; position:relative; z-index:10; filter:drop-shadow(0 4px 15px rgba(0,0,0,.8)); }
        .track-info h1 { font-family:var(--sans); font-size:42px; font-weight:700; letter-spacing:-.02em; margin:0 0 2px; line-height:1.1; }
        .track-info h2 { font-family:var(--sans); font-size:18px; font-weight:500; color:rgba(255,255,255,.7); margin:0; }
        .platform-links { display:flex; gap:12px; margin-bottom:36px; }
        .platform-btn {
          width:40px; height:40px; border-radius:50%; border:1px solid rgba(255,255,255,.1); background:rgba(255,255,255,.05);
          display:flex; align-items:center; justify-content:center; color:rgba(255,255,255,.7); transition:all .3s; cursor:pointer;
        }
        .platform-btn:hover { background:rgba(255,255,255,.15); transform:scale(1.05); color:#fff; }
        .platform-btn svg { width:18px; height:18px; fill: currentColor; }
        .player-controls { display:flex; flex-direction:column; width:100%; margin-top:20px; margin-bottom:-2px; }
        .mini-lyric-swiper {
          width:100%; height:20px; overflow:hidden; margin-bottom:15px; position:relative;
          mask-image: linear-gradient(to right, transparent 0%, rgba(0,0,0,.5) 15%, black 45%, black 55%, rgba(0,0,0,.5) 85%, transparent 100%);
        }
        .mini-lyric-track { position:absolute; left:50%; top:50%; transform:translate(0,-50%); display:flex; gap:24px; align-items:center; transition:transform .4s cubic-bezier(.2,.9,.4,1); white-space:nowrap; }
        .mini-word { font-family:var(--sans); font-size:13px; font-weight:500; color:rgba(255,255,255,.3); transition:all .3s; cursor:pointer; }
        .mini-word.active { color:#fff; font-weight:700; transform:scale(1.15); text-shadow:0 0 8px rgba(255,255,255,.6); }
        .mini-word.adjacent { color:rgba(255,255,255,.65); transform:scale(1.05); }
        .progress-wrapper { display:flex; align-items:center; gap:12px; width:100%; margin-bottom:20px; }
        .time-text { font-size:11px; font-weight:500; letter-spacing:.05em; color:rgba(255,255,255,.6); font-variant-numeric:tabular-nums; flex:0 0 35px; }
        .progress-container { position:relative; flex:1; height:20px; display:flex; align-items:center; cursor:pointer; }
        .progress-track { position:relative; width:100%; height:6px; border-radius:3px; background:rgba(255,255,255,.2); }
        .progress-fill { position:absolute; top:0; left:0; height:100%; width:0; border-radius:3px; background:#fff; box-shadow:0 0 10px rgba(255,255,255,.5); }
        .progress-thumb { position:absolute; top:50%; left:0; transform:translate(-50%,-50%); width:14px; height:14px; border-radius:50%; background:#fff; box-shadow:0 2px 6px rgba(0,0,0,.5); transition:width .2s, height .2s; }
        .progress-container:hover .progress-thumb { width:18px; height:18px; }
        .control-buttons { display:flex; align-items:center; justify-content:center; gap:35px; margin-bottom:15px; }
        .btn-icon { background:transparent; border:0; color:rgba(255,255,255,.6); display:flex; align-items:center; justify-content:center; cursor:pointer; transition:all .3s; }
        .btn-icon:hover { color:#fff; transform:scale(1.1); }
        .btn-play { width:64px; height:64px; border-radius:50%; background:#fff; color:#000; box-shadow:0 0 40px 10px rgba(255,255,255,.25); }
        .sync-info { margin-top:8px; text-align:center; font-size:10px; color:rgba(255,255,255,.4); letter-spacing:.05em; }
        .main-container { flex:1; width:auto; min-width:0; min-height:0; height:calc(100% - 118px); align-self:center; position:relative; overflow:hidden; background: transparent; border-radius: 0; box-shadow:none; border:0; z-index: 8; transition: all .5s cubic-bezier(.2,1,.3,1); animation: karaokeRightIn .62s cubic-bezier(.2,.9,.4,1) .05s both; }
        .error-title {
          animation: errorFadeUp .42s cubic-bezier(.2,.9,.4,1) both;
        }
        .error-subtitle {
          animation: errorFadeUp .42s cubic-bezier(.2,.9,.4,1) .08s both;
        }
        .error-try-btn {
          pointer-events: auto;
          display: inline-block;
          padding: 11px 20px;
          border-radius: 12px;
          border: 0;
          background: #ffffff;
          color: #0a0d13;
          font-family: var(--sans);
          font-size: 15px;
          font-weight: 700;
          letter-spacing: -0.01em;
          box-shadow: 0 8px 24px rgba(0,0,0,0.28);
          transition: transform .2s ease, background .2s ease, border-color .2s ease;
          animation: errorFadeUp .42s cubic-bezier(.2,.9,.4,1) .12s both;
        }
        .error-try-btn:hover {
          transform: translateY(-1px);
          background: #f4f6fb;
        }
        .lyrics-top-header { position:absolute; top:25px; left:35px; right:35px; display:flex; justify-content:space-between; align-items:center; z-index:80; pointer-events:auto; }
        .header-btn { width:40px; height:40px; border-radius:10px; border:1px solid rgba(255,255,255,.08); background:rgba(255,255,255,.05); color:rgba(255,255,255,.6); display:flex; align-items:center; justify-content:center; cursor:pointer; }
        .header-btn:hover { color:#fff; background:rgba(255,255,255,.15); }
        .top-right-group { display:flex; align-items:center; gap:12px; }
        .align-group { position:absolute; left:50%; transform:translateX(-50%); display:flex; gap:4px; background:rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.08); border-radius:10px; padding:4px; }
        .align-btn { width:32px; height:32px; border:0; background:transparent; border-radius:6px; color:rgba(255,255,255,.4); display:flex; align-items:center; justify-content:center; cursor:pointer; }
        .align-btn.active { background:rgba(255,255,255,.15); color:#fff; }
        .center-glow { position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); width:400px; height:400px; background:radial-gradient(circle, rgba(255,255,255,.05), transparent 70%); pointer-events:none; z-index:0; }
        .vertical-lyrics-wrapper {
          position:absolute; inset:0; overflow:hidden; z-index:2;
        }
        .vertical-lyrics-track { position:absolute; top:50%; width:100%; display:flex; flex-direction:column; gap:38px; padding:0 72px; transition:transform .5s cubic-bezier(.2,.9,.4,1); align-items:center; }
        .vertical-lyrics-track[data-align="left"] { align-items:center; }
        .vertical-lyrics-track[data-align="center"] { align-items:center; }
        .vertical-lyrics-track[data-align="right"] { align-items:center; }
        .lyric-line2 { width:var(--lyrics-col-width, min(58%, 640px)); font-family:var(--sans); font-size:32px; font-weight:700; color:rgba(255,255,255,.42); letter-spacing:-.02em; line-height:1.2; transition:all .4s cubic-bezier(.2,.9,.4,1); cursor:pointer; }
        .vertical-lyrics-track[data-align="left"] .lyric-line2 { text-align:left; transform-origin:left center; }
        .vertical-lyrics-track[data-align="center"] .lyric-line2 { text-align:center; transform-origin:center center; }
        .vertical-lyrics-track[data-align="right"] .lyric-line2 { text-align:right; transform-origin:right center; }
        .lyric-line2.active { color:#fff; transform:scale(1.24); text-shadow:0 0 24px rgba(255,255,255,.9), 0 0 54px rgba(255,255,255,.5), 0 0 96px rgba(255,255,255,.28); }
        .lyric-line2.adjacent { color:rgba(255,255,255,.65); transform:scale(1.1); text-shadow:0 0 15px rgba(255,255,255,.1); }
        .panel-header-left { position:absolute; top:24px; right:28px; z-index:50; display:flex; justify-content:flex-end; }
        .panel-circle-btn { width:42px; height:42px; border-radius:999px; border:1px solid rgba(255,255,255,.14); background:rgba(255,255,255,.07); color:rgba(255,255,255,.88); display:flex; align-items:center; justify-content:center; cursor:pointer; backdrop-filter: blur(10px); transition: all .25s ease; }
        .panel-circle-btn:hover { transform: translateY(-1px) scale(1.03); background:#fff; color:#000; }
        .lyric-end-search-row { width:var(--lyrics-col-width, min(58%, 640px)); margin: 0 auto; display:flex; }
        .vertical-lyrics-track[data-align="left"] .lyric-end-search-row { justify-content:flex-start; }
        .vertical-lyrics-track[data-align="center"] .lyric-end-search-row { justify-content:center; }
        .vertical-lyrics-track[data-align="right"] .lyric-end-search-row { justify-content:flex-end; }
        .lyric-end-search-btn { display:inline-flex; align-items:center; gap:10px; border:1px solid rgba(255,255,255,.3); background:#fff; color:#08090d; border-radius:999px; padding:11px 16px; font-family:var(--sans); font-size:15px; font-weight:700; letter-spacing:-.01em; box-shadow:0 8px 24px rgba(0,0,0,.22); transition: all .2s ease; }
        .lyric-end-search-btn .ear-wrap { width:18px; overflow:hidden; opacity:.95; transition: width .2s ease, opacity .2s ease; display:flex; align-items:center; }
        .lyric-end-search-btn .count { font-size:12px; font-weight:600; color:#3b4354; margin-left:2px; }
        .lyric-end-search-btn:hover { transform:translateY(-1px) scale(1.02); }
        .lyric-end-search-btn:hover .ear-wrap { width:22px; opacity:1; }
        @media (max-width: 1024px) {
          .app-dashboard { padding: 0; gap: 0; }
          .left-panel { height: 100%; border-radius: 0; align-self:stretch; }
          .main-container { border-radius: 0; width:auto; min-width:0; height:100%; align-self:stretch; }
          .vertical-lyrics-track { gap: 30px; padding: 0 22px; }
          .lyric-player-root { --lyrics-col-width: min(84%, 620px); }
        }
      `}</style>

      <div className={`app-dashboard ${isCollapsed ? "collapsed" : ""}`}>
        <div className="left-panel">
          <div className="panel-bg-layer">
            <img src={cover} alt="" className="bg-blur" />
            <div className="bg-gradient-overlay" />
          </div>
          <div className="panel-content-layer">
            <div className="panel-header-left">
              <button className="panel-circle-btn" onClick={() => setIsCollapsed(true)} aria-label="Collapse Panel">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="9" x2="8" y2="9" />
                  <line x1="18" y1="15" x2="8" y2="15" />
                  <polyline points="11 6 7 12 11 18" />
                </svg>
              </button>
            </div>
            <div className="album-art-wrapper">
              <div className="top-gradient" />
              <img src={cover} alt="Album Art" className="fg-art" />
            </div>
            <div className="info-controls-wrapper">
              <div className="track-info">
                <h1>{song?.title || "Unknown Track"}</h1>
                <h2>{song?.artist || "Unknown Artist"}</h2>
              </div>
              <div className="platform-links">
                <a href="#" className="platform-btn" aria-label="Apple Music"><svg viewBox="0 0 24 24"><path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.62-1.48 3.608-2.947 1.144-1.688 1.616-3.323 1.635-3.414-.038-.013-3.183-1.223-3.216-4.868-.026-3.04 2.484-4.5 2.597-4.576-1.424-2.083-3.64-2.324-4.44-2.38-1.954-.216-3.864 1.121-4.43 1.121z"/></svg></a>
                <a href="#" className="platform-btn" aria-label="Spotify"><svg viewBox="0 0 24 24"><path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z"/></svg></a>
                <a href="#" className="platform-btn" aria-label="YouTube"><svg viewBox="0 0 24 24"><path d="M21.582 6.186c-.23-.86-.908-1.538-1.768-1.768C18.254 4 12 4 12 4s-6.254 0-7.814.418c-.86.23-1.538.908-1.768 1.768C2 7.746 2 12 2 12s0 4.254.418 5.814c.23.86.908 1.538 1.768 1.768C5.746 20 12 20 12 20s6.254 0 7.814-.418c.86-.23 1.538-.908 1.768-1.768C22 16.254 22 12 22 12s0-4.254-.418-5.814zM9.75 15.02v-6.04L15.01 12l-5.26 3.02z"/></svg></a>
              </div>
              <div className="player-controls">
                <div className="mini-lyric-swiper">
                  <div className="mini-lyric-track" ref={miniTrackRef}>
                    {lyricLines.map((line, i) => (
                      <span key={`mini-${i}`} className={`mini-word ${i === currentIdx ? "active" : i === currentIdx - 1 || i === currentIdx + 1 ? "adjacent" : ""}`} onClick={() => onJumpTo(i)}>
                        {line.text}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="progress-wrapper">
                  <span className="time-text">{formatTime(currentTime)}</span>
                  <div
                    className="progress-container"
                    ref={progressContainerRef}
                    onMouseDown={(e) => {
                      setIsDragging(true);
                      const rect = e.currentTarget.getBoundingClientRect();
                      const pct = Math.max(0, Math.min((e.clientX - rect.left) / rect.width, 1));
                      onSeekToTime(pct * totalDuration);
                    }}
                  >
                    <div className="progress-track">
                      <div className="progress-fill" style={{ width: `${progressPct}%` }} />
                    </div>
                    <div className="progress-thumb" style={{ left: `${progressPct}%` }} />
                  </div>
                  <span className="time-text">{formatTime(totalDuration)}</span>
                </div>
                <div className="control-buttons">
                  <button className="btn-icon" onClick={() => onSeekToTime(Math.max(0, currentTime - 10))} aria-label="Rewind"><RotateCcw className="h-6 w-6" /></button>
                  <button className="btn-icon btn-play" onClick={playing ? onPause : onResume} aria-label="Play/Pause">
                    {playing ? <Pause className="h-6 w-6 fill-current" /> : <Play className="ml-0.5 h-6 w-6 fill-current" />}
                  </button>
                  <button className="btn-icon" onClick={() => onSeekToTime(Math.min(totalDuration, currentTime + 10))} aria-label="Forward"><RotateCw className="h-6 w-6" /></button>
                </div>
                <div className="sync-info">
                  {syncNote || "synced from 4:30 · window +0.0s"}
                  {offsetMs !== 0 ? ` · offset ${offsetMs > 0 ? "+" : ""}${(offsetMs / 1000).toFixed(1)}s` : ""}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="main-container">
          <div className="lyrics-top-header">
            <div style={{ display: "flex", gap: 12 }}>
              {isCollapsed ? (
                <button className="header-btn" onClick={() => setIsCollapsed(false)} aria-label="Open Panel">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                </button>
              ) : null}
            </div>
            <div className="align-group">
              <button className={`align-btn ${alignment === "left" ? "active" : ""}`} onClick={() => setAlignment("left")}><AlignLeft className="h-4 w-4" /></button>
              <button className={`align-btn ${alignment === "center" ? "active" : ""}`} onClick={() => setAlignment("center")}><AlignCenter className="h-4 w-4" /></button>
              <button className={`align-btn ${alignment === "right" ? "active" : ""}`} onClick={() => setAlignment("right")}><AlignRight className="h-4 w-4" /></button>
            </div>
            <div className="top-right-group" />
          </div>
          <div className="center-glow" />
          <div className="vertical-lyrics-wrapper">
            <div className="vertical-lyrics-track" data-align={alignment} ref={vertTrackRef}>
              {lyricLines.map((line, i) => (
                <div key={`vert-${i}`} className={`lyric-line2 ${i === currentIdx ? "active" : i === currentIdx - 1 || i === currentIdx + 1 ? "adjacent" : ""}`} onClick={() => onJumpTo(i)}>
                  {line.text}
                </div>
              ))}
              {showEndSearchCTA ? (
                <div key="end-search-row" className="lyric-end-search-row">
                  <button className="lyric-end-search-btn" onClick={onNewSong} aria-label="New search">
                    <span className="ear-wrap">
                      <Ear className="h-4 w-4" />
                    </span>
                    <span>New Search</span>
                    <span className="count">Auto {autoSearchCountdown}s</span>
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════ APP ═══════════════════ */
export function KaraokeListenAppV2() {
  const [phase, setPhase] = useState("idle"); // idle | listening | recognizing | karaoke | error
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [song, setSong] = useState(null);
  const [lines, setLines] = useState([]);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [elapsed, setElapsed] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [offsetMs, setOffsetMs] = useState(0);
  const [syncNote, setSyncNote] = useState("");
  const [inputLevel, setInputLevel] = useState(0);
  const [hasSyncedLyricTiming, setHasSyncedLyricTiming] = useState(false);

  const chunks = useRef([]);
  const recorder = useRef(null);
  const recStartWall = useRef(0);
  const recEndWall = useRef(0);
  const recDurationSec = useRef(RECORD_SECONDS);
  const songAtRecEnd = useRef(0);
  const anchor = useRef(null);
  const raf = useRef(null);
  const progTimer = useRef(null);
  const stopTimer = useRef(null);
  const linesRef = useRef([]);
  const meterContextRef = useRef(null);
  const meterAnalyserRef = useRef(null);
  const meterRafRef = useRef(null);
  const meterDataRef = useRef(null);
  const resyncInFlightRef = useRef(false);
  const correctionRafRef = useRef(null);
  const fallbackResyncTimerRef = useRef(null);
  const phaseRef = useRef("idle");
  const playingRef = useRef(false);
  const driftContextRef = useRef(null);
  const driftAnalyserRef = useRef(null);
  const driftStreamRef = useRef(null);
  const runIdRef = useRef(0);
  const activeIdxRef = useRef(-1);
  const elapsedRef = useRef(0);
  const lastElapsedCommitRef = useRef(0);
  const transitionTimerRef = useRef(null);
  const newSongFadeTimerRef = useRef(null);

  useEffect(() => {
    linesRef.current = lines;
  }, [lines]);
  useEffect(() => {
    activeIdxRef.current = activeIdx;
  }, [activeIdx]);
  useEffect(() => {
    elapsedRef.current = elapsed;
  }, [elapsed]);
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);
  useEffect(() => {
    playingRef.current = playing;
  }, [playing]);
  useEffect(
    () => () => {
      cancelAnimationFrame(raf.current);
      cancelAnimationFrame(correctionRafRef.current);
      clearInterval(progTimer.current);
      clearTimeout(stopTimer.current);
      clearTimeout(fallbackResyncTimerRef.current);
      clearTimeout(transitionTimerRef.current);
      clearTimeout(newSongFadeTimerRef.current);
      cancelAnimationFrame(meterRafRef.current);
      if (
        driftContextRef.current &&
        driftContextRef.current.state &&
        driftContextRef.current.state !== "closed"
      ) {
        driftContextRef.current.close();
      }
      if (driftStreamRef.current) {
        driftStreamRef.current.getTracks().forEach((track) => track.stop());
        driftStreamRef.current = null;
      }
      if (
        meterContextRef.current &&
        meterContextRef.current.state &&
        meterContextRef.current.state !== "closed"
      ) {
        meterContextRef.current.close();
      }
    },
    [],
  );

  const stopLiveMeter = useCallback(() => {
    cancelAnimationFrame(meterRafRef.current);
    meterRafRef.current = null;
    meterAnalyserRef.current = null;
    meterDataRef.current = null;
    if (
      meterContextRef.current &&
      meterContextRef.current.state &&
      meterContextRef.current.state !== "closed"
    ) {
      meterContextRef.current.close();
    }
    meterContextRef.current = null;
    setInputLevel(0);
  }, []);

  const stopDriftMonitor = useCallback(() => {
    if (
      driftContextRef.current &&
      driftContextRef.current.state &&
      driftContextRef.current.state !== "closed"
    ) {
      driftContextRef.current.close();
    }
    driftContextRef.current = null;
    driftAnalyserRef.current = null;
    if (driftStreamRef.current) {
      driftStreamRef.current.getTracks().forEach((track) => track.stop());
      driftStreamRef.current = null;
    }
  }, []);

  const startDriftMonitor = useCallback(async () => {
    if (driftAnalyserRef.current) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          channelCount: 1,
        },
      });
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      const ctx = new AudioCtx();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.82;
      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyser);

      driftStreamRef.current = stream;
      driftContextRef.current = ctx;
      driftAnalyserRef.current = analyser;
    } catch {
      // Drift correction is optional; keep karaoke running if mic monitoring fails.
    }
  }, []);

  useEffect(() => {
    if (phase === "karaoke" && playing) startDriftMonitor();
    else stopDriftMonitor();
    return () => {
      if (phase !== "karaoke") stopDriftMonitor();
    };
  }, [phase, playing, startDriftMonitor, stopDriftMonitor]);

  const smoothAnchorCorrection = useCallback((driftSec, targetAnchorRef = anchor) => {
    if (targetAnchorRef.current == null) return;
    const totalShiftMs = driftSec * 1000;
    if (!Number.isFinite(totalShiftMs) || Math.abs(totalShiftMs) < 1) return;

    cancelAnimationFrame(correctionRafRef.current);
    const steps = Math.max(1, Math.ceil(DRIFT_LERP_DURATION_MS / 16));
    const shiftPerStep = totalShiftMs / steps;
    let step = 0;

    const tick = () => {
      if (targetAnchorRef.current == null || step >= steps) {
        correctionRafRef.current = null;
        return;
      }
      targetAnchorRef.current -= shiftPerStep;
      step += 1;
      correctionRafRef.current = requestAnimationFrame(tick);
    };

    correctionRafRef.current = requestAnimationFrame(tick);
  }, []);

  useLocalDriftCorrection({
    analyserRef: driftAnalyserRef,
    anchorRef: anchor,
    lyricsRef: linesRef,
    isPlaying: playing,
    phase,
    enabled: hasSyncedLyricTiming && ENABLE_LOCAL_DRIFT_CORRECTION,
    onCorrect: smoothAnchorCorrection,
  });

  const recordShortClip = useCallback(async (seconds) => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
        channelCount: 1,
      },
    });

    return new Promise((resolve, reject) => {
      const localChunks = [];
      const startedAt = performance.now();
      const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/mp4")
          ? "audio/mp4"
          : "";

      let rec;
      try {
        rec = new MediaRecorder(stream, mime ? { mimeType: mime } : {});
      } catch (err) {
        stream.getTracks().forEach((t) => t.stop());
        reject(err);
        return;
      }

      rec.ondataavailable = (e) => {
        if (e.data.size) localChunks.push(e.data);
      };
      rec.onerror = () => {
        stream.getTracks().forEach((t) => t.stop());
        reject(new Error("Failed to capture resync clip"));
      };
      rec.onstop = () => {
        const endedAt = performance.now();
        stream.getTracks().forEach((t) => t.stop());
        const outBlob = new Blob(localChunks, {
          type: localChunks[0]?.type || "audio/webm",
        });
        resolve({
          blob: outBlob,
          clipDurationSec: Math.max(0.25, (endedAt - startedAt) / 1000),
          clipEndWall: endedAt,
        });
      };

      rec.start(250);
      setTimeout(() => {
        if (rec.state === "recording") rec.stop();
      }, seconds * 1000);
    });
  }, []);

  const startLiveMeter = useCallback((stream) => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;

      const ctx = new AudioCtx();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.92;
      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyser);

      const bins = new Uint8Array(analyser.fftSize);
      meterContextRef.current = ctx;
      meterAnalyserRef.current = analyser;
      meterDataRef.current = bins;

      const tick = () => {
        const a = meterAnalyserRef.current;
        const arr = meterDataRef.current;
        if (!a || !arr) return;
        a.getByteTimeDomainData(arr);
        let sumSq = 0;
        for (let i = 0; i < arr.length; i += 1) {
          const centered = (arr[i] - 128) / 128;
          sumSq += centered * centered;
        }
        const rms = Math.sqrt(sumSq / arr.length);
        const mapped = Math.min(1, Math.pow(rms * 4.2, 0.9));
        setInputLevel((prev) => prev + (mapped - prev) * 0.08);
        meterRafRef.current = requestAnimationFrame(tick);
      };

      meterRafRef.current = requestAnimationFrame(tick);
    } catch {
      setInputLevel(0);
    }
  }, []);

  /* ═══════════════════ LISTEN ═══════════════════ */
  const listen = useCallback(async () => {
    const runId = runIdRef.current + 1;
    runIdRef.current = runId;
    clearTimeout(fallbackResyncTimerRef.current);
    clearTimeout(transitionTimerRef.current);
    clearTimeout(newSongFadeTimerRef.current);
    resyncInFlightRef.current = false;
    setError("");
    setPhase("listening");
    setProgress(0);
    setSyncNote("");
    setHasSyncedLyricTiming(false);
    setOffsetMs(0);
    setInputLevel(0);
    chunks.current = [];
    recStartWall.current = performance.now();
    recDurationSec.current = RECORD_SECONDS;
    stopLiveMeter();
    stopDriftMonitor();

    try {
      const isLocalhost =
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1";
      if (!window.isSecureContext && !isLocalhost) {
        throw new Error(
          "Microphone needs HTTPS on mobile. Open the HTTPS URL (not http://192.168...).",
        );
      }
      if (!navigator?.mediaDevices?.getUserMedia) {
        throw new Error("This browser cannot access microphone input.");
      }
      if (typeof MediaRecorder === "undefined") {
        throw new Error("This browser does not support audio recording.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          channelCount: 1,
        },
      });
      startLiveMeter(stream);
      const mimeCandidates = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/mp4;codecs=mp4a.40.2",
        "audio/mp4",
      ];
      const mime = mimeCandidates.find((m) => {
        try {
          return MediaRecorder.isTypeSupported(m);
        } catch {
          return false;
        }
      });
      let rec;
      try {
        rec = new MediaRecorder(stream, mime ? { mimeType: mime } : {});
      } catch (mediaErr) {
        stream.getTracks().forEach((t) => t.stop());
        throw mediaErr;
      }
      recorder.current = rec;

      rec.ondataavailable = (e) => {
        if (e.data.size) chunks.current.push(e.data);
      };
      rec.onstop = () => {
        if (runId !== runIdRef.current) {
          stream.getTracks().forEach((t) => t.stop());
          stopLiveMeter();
          return;
        }
        stream.getTracks().forEach((t) => t.stop());
        stopLiveMeter();
        recEndWall.current = performance.now();
        recDurationSec.current = Math.max(
          0.25,
          (recEndWall.current - recStartWall.current) / 1000,
        );
        const totalSize = chunks.current.reduce((sum, chunk) => sum + chunk.size, 0);
        if (totalSize < 1400) {
          setPhase("error");
          setError("No audio captured. Increase volume or move closer to the speaker.");
          return;
        }
        recognize(runId);
      };
      rec.start(500);

      const t0 = Date.now();
      progTimer.current = setInterval(
        () =>
          setProgress(
            Math.min(1, (Date.now() - t0) / (RECORD_SECONDS * 1000)),
          ),
        50,
      );
      stopTimer.current = setTimeout(() => {
        clearInterval(progTimer.current);
        setProgress(1);
        if (rec.state === "recording") rec.stop();
      }, RECORD_SECONDS * 1000);
    } catch (err) {
      if (runId !== runIdRef.current) return;
      stopLiveMeter();
      setPhase("error");
      setError(mapMicErrorToMessage(err));
    }
  }, [startLiveMeter, stopDriftMonitor, stopLiveMeter]);

  const startNewSongFlow = useCallback(() => {
    clearTimeout(newSongFadeTimerRef.current);
    pause();
    setPhase("karaoke_out");
    newSongFadeTimerRef.current = setTimeout(() => {
      listen();
    }, 280);
  }, [listen]);

  /* ═══════════════════ RECOGNIZE ═══════════════════ */
  const recognize = useCallback(async (runId) => {
    if (runId !== runIdRef.current) return;
    setPhase("recognizing");
    const blob = new Blob(chunks.current, {
      type: chunks.current[0]?.type || "audio/webm",
    });

    try {
      const attempts = [
        {
          label: "window +0.0s",
          blob,
          extension: "webm",
          clipDurationSec: recDurationSec.current,
          absoluteEndSec: recDurationSec.current,
          auddOffsetSec: 0,
        },
      ];

      const decodeContextClass = window.AudioContext || window.webkitAudioContext;
      const shiftedWindowDuration = recDurationSec.current - SECOND_WINDOW_OFFSET;

      if (decodeContextClass && shiftedWindowDuration > 4) {
        try {
          const decodeContext = new decodeContextClass();
          try {
            const raw = await blob.arrayBuffer();
            const decoded = await decodeContext.decodeAudioData(raw.slice(0));
            const shiftedBlob = audioBufferToWavBlob(
              decoded,
              SECOND_WINDOW_OFFSET,
              shiftedWindowDuration,
            );

            if (shiftedBlob) {
              attempts.push({
                label: `window +${SECOND_WINDOW_OFFSET.toFixed(1)}s`,
                blob: shiftedBlob,
                extension: "wav",
                clipDurationSec: shiftedWindowDuration,
                absoluteEndSec: recDurationSec.current,
                auddOffsetSec: SECOND_WINDOW_OFFSET,
              });
            }
          } finally {
            await decodeContext.close();
          }
        } catch {
          // If decode fails on a browser/codec combo, keep the base attempt only.
        }
      }

      let bestMatch = null;
      let lastApiError = "";

      for (let index = 0; index < attempts.length; index += 1) {
        const attempt = attempts[index];
        const fd = new FormData();
        fd.append("file", attempt.blob, `clip.${attempt.extension}`);
        fd.append("return", "lyrics,timecode");

        const res = await fetch("/api/audd-recognize", { method: "POST", body: fd });
        const data = await res.json();

        if (data.status === "error") {
          lastApiError = data.error?.error_message || "Recognition failed";
          const lowered = String(lastApiError).toLowerCase();
          if (lowered.includes("limit was reached")) {
            throw new Error(
              "AudD quota reached for this API token. Generate/upgrade a token in AudD dashboard.",
            );
          }
          continue;
        }

        if (!data.result) {
          continue;
        }

        const score = Number(
          data.result.score ?? data.result.confidence ?? data.result.score_confidence ?? 0,
        );

        const candidate = {
          score: score + (index === 0 ? 0.02 : 0),
          rawScore: score,
          data,
          attempt,
        };

        if (!bestMatch || candidate.score > bestMatch.score) {
          bestMatch = candidate;
        }
      }

      const picked = bestMatch;

      if (!picked) {
        throw new Error(
          lastApiError ||
            "No match — play a louder chorus, keep phone closer to speaker, and retry.",
        );
      }

      const timecode = parseAudDTimecode(picked.data.result.timecode);
      const estimatedMatchPointSec =
        picked.attempt.auddOffsetSec +
        picked.attempt.clipDurationSec * MATCH_POSITION_IN_CLIP_RATIO;
      const estimatedRemainingToClipEnd = Math.max(
        0,
        picked.attempt.absoluteEndSec - estimatedMatchPointSec,
      );
      let cover = extractCoverFromAudDResult(picked.data.result);
      if (!cover) {
        cover = await fetchItunesArtwork(
          picked.data.result.title,
          picked.data.result.artist,
        );
      }
      songAtRecEnd.current = Math.max(0, timecode + estimatedRemainingToClipEnd);
      setSong({
        title: picked.data.result.title,
        artist: picked.data.result.artist,
        timecode,
        score: picked.rawScore ?? picked.score,
        album: picked.data.result.album || "",
        cover,
        durationSec:
          parseDurationSeconds(picked.data.result.duration) ??
          parseDurationSeconds(picked.data.result.duration_seconds),
      });
      setSyncNote(
        timecode > 0
          ? `synced from ${fmt(timecode)} · ${picked.attempt.label}`
          : `${picked.attempt.label}`,
      );

      await fetchLyrics(
        picked.data.result.title,
        picked.data.result.artist,
        picked.data.result.album || "",
        picked.data.result.lyrics || "",
        parseDurationSeconds(picked.data.result.duration) ??
          parseDurationSeconds(picked.data.result.duration_seconds) ??
          null,
        runId,
      );
    } catch (e) {
      if (runId !== runIdRef.current) return;
      setPhase("error");
      setError(e.message);
    }
  }, []);

  const transitionToKaraoke = useCallback((runId) => {
    if (runId !== runIdRef.current) return;
    clearTimeout(transitionTimerRef.current);
    setPhase("transitioning");
    transitionTimerRef.current = setTimeout(() => {
      if (runId !== runIdRef.current) return;
      setPhase("karaoke");
    }, 420);
  }, []);

  /* ═══════════════════ LYRICS ═══════════════════ */
  const fetchLyrics = async (
    title,
    artist,
    album,
    auddLyrics = "",
    durationSec = null,
    runId = runIdRef.current,
  ) => {
    if (runId !== runIdRef.current) return;
    try {
      const p = new URLSearchParams({ track_name: title, artist_name: artist });
      if (album) p.set("album_name", album);
      if (durationSec) p.set("duration", String(Math.round(durationSec)));
      let r = await fetch(`${LRCLIB}/api/get?${p}`, {
        headers: { "Lrclib-Client": "KaraokeMVP/1.0" },
      });
      let d = r.ok ? await r.json() : null;
      const getDuration = parseDurationSeconds(
        d?.duration ?? d?.durationSeconds ?? d?.length,
      );

      const getLooksGood =
        d &&
        textOverlapScore(title, d?.trackName || d?.track_name || "") >= 0.45 &&
        textOverlapScore(artist, d?.artistName || d?.artist_name || "") >= 0.3 &&
        isDurationCompatible(durationSec, getDuration);

      if (!getLooksGood || !d?.syncedLyrics) {
        r = await fetch(
          `${LRCLIB}/api/search?q=${encodeURIComponent(`${title} ${artist}`)}`,
          { headers: { "Lrclib-Client": "KaraokeMVP/1.0" } },
        );
        const arr = r.ok ? await r.json() : [];
        const best = pickBestLyricCandidate(arr, title, artist, durationSec);
        d = best || (getLooksGood ? d : null);
      }

      let parsed;
      let usedSyncedLyrics = false;
      if (d?.syncedLyrics) {
        parsed = parseLRC(d.syncedLyrics);
        usedSyncedLyrics = parsed?.length > 1;
      }
      if (parsed?.length > 0 && Number.isFinite(durationSec)) {
        const lrcEnd = parsed[parsed.length - 1]?.time ?? 0;
        if (
          !isDurationCompatible(
            durationSec,
            lrcEnd,
            Math.max(24, LRC_DURATION_MISMATCH_SEC * 2.4),
          )
        ) {
          parsed = null;
          usedSyncedLyrics = false;
        }
      }
      if (parsed && parsed.length > 0) {
        const meaningful = parsed.filter((x) => x.text && x.text !== "♪").length;
        if (meaningful < 2 && d?.plainLyrics) {
          parsed = buildFakeTimestamps(d.plainLyrics.split("\n"), durationSec);
          usedSyncedLyrics = false;
        }
      }
      if ((!parsed || parsed.length === 0) && d?.plainLyrics)
        parsed = buildFakeTimestamps(d.plainLyrics.split("\n"), durationSec);
      if ((!parsed || parsed.length === 0) && auddLyrics)
        parsed = buildFakeTimestamps(String(auddLyrics).split("\n"), durationSec);
      if (!parsed || parsed.length === 0) {
        parsed = [{ time: 0, text: "No synced lyrics found" }];
        usedSyncedLyrics = false;
        setSyncNote((prev) =>
          prev ? `${prev} · no synced lyrics` : "no synced lyrics",
        );
      }

      if (runId !== runIdRef.current) return;
      setLines(parsed);
      linesRef.current = parsed;
      setHasSyncedLyricTiming(usedSyncedLyrics);
      startTicker(parsed, songAtRecEnd.current, recEndWall.current);
      scheduleOneTimeResync(runId);
      transitionToKaraoke(runId);
    } catch {
      if (runId !== runIdRef.current) return;
      const fallback = [{ time: 0, text: "No synced lyrics found" }];
      setLines(fallback);
      linesRef.current = fallback;
      setHasSyncedLyricTiming(false);
      setSyncNote((prev) =>
        prev ? `${prev} · no synced lyrics` : "no synced lyrics",
      );
      startTicker(fallback, songAtRecEnd.current, recEndWall.current);
      scheduleOneTimeResync(runId);
      transitionToKaraoke(runId);
    }
  };

  const autoResyncViaAudD = useCallback(async (runId = runIdRef.current) => {
    if (runId !== runIdRef.current) return;
    if (phaseRef.current !== "karaoke" || !playingRef.current) return;
    if (!song?.title || !song?.artist) return;
    if (resyncInFlightRef.current) return;
    if (!navigator?.mediaDevices?.getUserMedia) return;

    resyncInFlightRef.current = true;

    try {
      const clip = await recordShortClip(AUTO_RESYNC_CLIP_SECONDS);
      if (runId !== runIdRef.current || phaseRef.current !== "karaoke") return;

      const fd = new FormData();
      fd.append("file", clip.blob, "resync.webm");
      fd.append("return", "timecode");

      const res = await fetch("/api/audd-recognize", { method: "POST", body: fd });
      const data = await res.json();

      if (runId !== runIdRef.current) return;
      if (data?.status === "error" || !data?.result) return;

      const sameTitle = textOverlapScore(song.title, data.result.title || "") >= 0.45;
      const sameArtist = textOverlapScore(song.artist, data.result.artist || "") >= 0.35;
      if (!sameTitle || !sameArtist) return;

      const score = Number(
        data.result.score ?? data.result.confidence ?? data.result.score_confidence ?? 0.5,
      );
      if (Number.isFinite(score) && score < 0.25) return;

      const timecode = parseAudDTimecode(data.result.timecode);
      if (!Number.isFinite(timecode) || timecode <= 0) return;

      if (anchor.current == null) return;
      const networkLagSec = Math.max(0, (performance.now() - clip.clipEndWall) / 1000);
      const matchPointInResyncClip = clip.clipDurationSec * MATCH_POSITION_IN_CLIP_RATIO;
      const recognizedAtClipEnd = timecode + Math.max(0, clip.clipDurationSec - matchPointInResyncClip);
      const recognizedNow = recognizedAtClipEnd + networkLagSec;
      const localNow = (performance.now() - anchor.current) / 1000;
      const driftSec = recognizedNow - localNow;

      if (
        Math.abs(driftSec) >= AUTO_RESYNC_DRIFT_THRESHOLD_SEC &&
        Math.abs(driftSec) <= 6
      ) {
        smoothAnchorCorrection(driftSec);
      }
    } catch {
      // Keep karaoke running even if resync capture fails.
    } finally {
      resyncInFlightRef.current = false;
    }
  }, [recordShortClip, smoothAnchorCorrection, song]);

  const scheduleOneTimeResync = useCallback((runId) => {
    if (!ENABLE_FALLBACK_AUDD_RESYNC) return;
    clearTimeout(fallbackResyncTimerRef.current);
    fallbackResyncTimerRef.current = setTimeout(() => {
      if (runIdRef.current !== runId) return;
      if (phaseRef.current !== "karaoke") return;
      autoResyncViaAudD(runId);
    }, FALLBACK_RESYNC_DELAY_MS);
  }, [autoResyncViaAudD]);

  /* ═══════════════════ TICKER ═══════════════════ */
  const startTicker = (ll, songPosAtRecEnd, recEndTimestamp = null) => {
    let currentSongPos = songPosAtRecEnd;
    if (Number.isFinite(recEndTimestamp) && recEndTimestamp > 0) {
      const wallNow = Math.max(0, (performance.now() - recEndTimestamp) / 1000);
      currentSongPos = songPosAtRecEnd + wallNow;
    }
    cancelAnimationFrame(raf.current);
    anchor.current = performance.now() - currentSongPos * 1000;
    setPlaying(true);
    lastElapsedCommitRef.current = performance.now();
    const tick = () => {
      const now = (performance.now() - anchor.current) / 1000;
      const visualNow = Math.max(0, now + ACTIVE_LINE_PREROLL_MS / 1000);
      elapsedRef.current = now;
      const ts = performance.now();
      if (ts - lastElapsedCommitRef.current >= ELAPSED_COMMIT_INTERVAL_MS) {
        lastElapsedCommitRef.current = ts;
        setElapsed(now);
      }
      const L = ll || linesRef.current;
      let idx = -1;
      for (let i = L.length - 1; i >= 0; i--) {
        if (visualNow >= L[i].time) {
          idx = i;
          break;
        }
      }
      if (idx !== activeIdxRef.current) {
        activeIdxRef.current = idx;
        setActiveIdx(idx);
      }
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
  };

  const pause = () => {
    setPlaying(false);
    cancelAnimationFrame(raf.current);
  };
  const resume = () => startTicker(null, elapsedRef.current);
  const jumpTo = (i) => {
    if (i >= 0 && i < lines.length) startTicker(null, lines[i].time);
  };
  const seekToTime = (timeSec) => {
    const safeTime = Math.max(0, Number.isFinite(timeSec) ? timeSec : 0);
    startTicker(null, safeTime);
  };
  const nudge = (ms) => {
    setOffsetMs((p) => p + ms);
    if (anchor.current != null) anchor.current += ms;
  };
  const reset = () => {
    runIdRef.current += 1;
    resyncInFlightRef.current = false;
    clearTimeout(fallbackResyncTimerRef.current);
    clearTimeout(transitionTimerRef.current);
    clearTimeout(newSongFadeTimerRef.current);
    cancelAnimationFrame(correctionRafRef.current);
    pause();
    stopLiveMeter();
    stopDriftMonitor();
    setPhase("idle");
    setSong(null);
    setLines([]);
    setActiveIdx(-1);
    setElapsed(0);
    activeIdxRef.current = -1;
    elapsedRef.current = 0;
    setError("");
    setProgress(0);
    setOffsetMs(0);
    setSyncNote("");
    setHasSyncedLyricTiming(false);
    recStartWall.current = 0;
    recEndWall.current = 0;
    recDurationSec.current = RECORD_SECONDS;
  };

  if ((phase === "karaoke" || phase === "karaoke_out") && song) {
    return (
      <KaraokePage
        song={song}
        lines={lines}
        activeIdx={activeIdx}
        elapsed={elapsed}
        playing={playing}
        offsetMs={offsetMs}
        syncNote={syncNote}
        onPause={pause}
        onResume={resume}
        onJumpTo={jumpTo}
        onSeekToTime={seekToTime}
        onNudge={nudge}
        onNewSong={startNewSongFlow}
        fadingOut={phase === "karaoke_out"}
      />
    );
  }

  return (
    <ShaderLoadingScreen
      phase={phase}
      progress={progress}
      inputLevel={inputLevel}
      error={error}
      onStart={listen}
      onRetry={listen}
      fadingOut={phase === "transitioning"}
    />
  );
}

export default KaraokeListenAppV2;
