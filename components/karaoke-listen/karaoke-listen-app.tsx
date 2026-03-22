// @ts-nocheck
"use client";

import { useState, useRef, useEffect, useCallback, memo } from "react";
import * as THREE from "three";
import musicEqualizerData from "./music-equalizer.json";
import {
  AlertCircle,
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
}) {
  const containerRef = useRef(null);
  const stateRef = useRef({
    appState: 0.0, // 0 idle, 1 searching, 2 fail
    stateProgress: 0.0,
    introFade: 0.0,
  });

  useEffect(() => {
    const nextState =
      phase === "error" ? 2.0 : phase === "idle" ? 0.0 : 1.0;
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
          float baseLineWidth = mix(0.012, 0.028, audioLevel);
          float glowAmount = 0.005;

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

              float ripple = (playProgress > 0.0) ? sin(distortedUv.x * 4.0 + distortedUv.y * 4.0) * 0.03 * audioLevel * playProgress : 0.0;
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
      const targetRecognizeBlend = phase === "recognizing" ? 1.0 : 0.0;
      uniforms.recognizeBlend.value +=
        (targetRecognizeBlend - uniforms.recognizeBlend.value) * 0.03;

      const targetListeningBlend = phase === "listening" ? 1.0 : 0.0;
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
        const live = Math.max(0, Math.min(1, inputLevel || 0));
        smoothedLiveLevel += (live - smoothedLiveLevel) * 0.08;
        listeningRamp = Math.min(1, listeningRamp + 0.03);

        const listeningLevel = Math.max(
          0.08,
          Math.min(0.72, (baseWave * 0.72 + smoothedLiveLevel * 0.36) * listeningRamp + 0.07),
        );
        const recognizingLevel =
          baseWave +
          0.14 +
          Math.max(0.06, Math.sin(progress * Math.PI) * 0.18);

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
        (targetAudioLevel - uniforms.audioLevel.value) * 0.02;

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
  }, [phase, progress, inputLevel]);

  const listening = phase === "listening";
  const recognizing = phase === "recognizing";
  const secondsLeft = Math.max(
    0,
    Math.ceil(RECORD_SECONDS - progress * RECORD_SECONDS),
  );

  return (
    <div className="relative flex h-screen w-full flex-col items-center justify-center overflow-hidden bg-black font-sans">
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
        className={`animated-bg-search absolute inset-0 z-0 blur-[60px] transition-opacity duration-1000 ${
          phase === "idle" ? "opacity-20" : "opacity-100"
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
      <div ref={containerRef} className="absolute inset-0 z-10" />

      <div className="pointer-events-none relative z-20 flex h-full w-full flex-col items-center justify-center">
        {(phase === "idle" || listening || recognizing) && (
          <div className="pointer-events-auto absolute top-1/2 left-1/2 flex h-32 w-32 -translate-x-1/2 -translate-y-1/2 items-center justify-center">
            <div
              className={`pointer-events-none absolute inset-0 rounded-full blur-[30px] transition-all duration-700 ${
                phase === "idle"
                  ? "animate-pulse bg-blue-500/30 scale-100"
                  : phase === "recognizing"
                    ? "bg-pink-500/20 scale-125"
                    : "bg-blue-500/25 scale-120"
              }`}
            />
            {phase === "idle" ? (
              <button
                onClick={onStart}
                className="group relative flex cursor-pointer items-center justify-center border-none bg-transparent text-white transition-transform duration-300 ease-out hover:scale-110"
                aria-label="Start Listening"
              >
                <Mic
                  className="h-10 w-10 text-white drop-shadow-[0_0_15px_rgba(0,128,255,0.8)] transition-transform duration-300 group-hover:scale-95"
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
          <div className="animate-in fade-in zoom-in absolute top-[18%] left-1/2 flex -translate-x-1/2 flex-col items-center px-6 text-center duration-500">
            <AlertCircle className="mb-4 h-10 w-10 text-red-400 drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
            <span className="text-3xl font-bold tracking-tight text-white md:text-5xl">
              Try Again
            </span>
            <p className="mt-4 max-w-md text-sm text-red-200/80 md:text-base">{error}</p>
            <button
              onClick={onRetry}
              className="pointer-events-auto mt-8 rounded-full border border-red-400/50 px-6 py-2 text-red-200 transition-colors hover:bg-red-400/10"
            >
              Retry Listening
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
      ? "mx-auto w-[94%] origin-center text-center"
      : textAlign === "right"
        ? "ml-auto w-[90%] origin-right text-right"
        : "mr-auto w-[90%] origin-left text-left";
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
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [textAlign, setTextAlign] = useState("center");
  const [copiedBadge, setCopiedBadge] = useState(false);
  const lyricsInnerRef = useRef(null);
  const lyricsCurrentYRef = useRef(0);
  const lyricsTargetYRef = useRef(0);
  const lyricsRafRef = useRef(null);
  const lyricRowRefs = useRef([]);
  const lineLayoutRef = useRef({ centers: [], totalHeight: 0 });
  const copiedTimerRef = useRef(null);
  const safeLines =
    lines && lines.length > 0 ? lines : [{ time: 0, text: "No synced lyrics found" }];
  const lyricLines =
    safeLines.length > 0
      ? safeLines.map((line) => ({
          time: Number.isFinite(line?.time) ? line.time : 0,
          text:
            typeof line?.text === "string" && line.text.trim().length > 0
              ? line.text
              : "♪",
        }))
      : [{ time: 0, text: "No synced lyrics found" }];
  const hasOnlyFallback =
    lyricLines.length === 1 && lyricLines[0]?.text === "No synced lyrics found";
  const lyricViewportHeight = LYRICS_VISIBLE_LINES * LYRIC_LINE_HEIGHT_PX;

  const updateTargetFromIndex = useCallback(
    (index) => {
      if (index < 0 || lyricLines.length === 0) return;
      const clamped = Math.min(index, lyricLines.length - 1);
      const layout = lineLayoutRef.current;
      const centerOffset = lyricViewportHeight / 2;
      const centerY =
        layout.centers?.[clamped] ??
        clamped * LYRIC_LINE_HEIGHT_PX + LYRIC_LINE_HEIGHT_PX / 2;
      const maxY = Math.max(0, (layout.totalHeight || lyricLines.length * LYRIC_LINE_HEIGHT_PX) - lyricViewportHeight);
      const rawY = Math.max(0, centerY - centerOffset);
      lyricsTargetYRef.current = Math.min(maxY, rawY);
    },
    [lyricLines.length, lyricViewportHeight],
  );

  const measureLineLayout = useCallback(() => {
    const centers = [];
    let totalHeight = 0;
    for (let i = 0; i < lyricLines.length; i += 1) {
      const node = lyricRowRefs.current[i];
      if (!node) continue;
      const top = node.offsetTop;
      const height = node.offsetHeight;
      centers[i] = top + height / 2;
      totalHeight = Math.max(totalHeight, top + height);
    }
    lineLayoutRef.current = { centers, totalHeight };
    updateTargetFromIndex(activeIdx);
  }, [activeIdx, lyricLines.length, updateTargetFromIndex]);

  useEffect(() => {
    updateTargetFromIndex(activeIdx);
  }, [activeIdx, updateTargetFromIndex]);

  useEffect(() => {
    if (hasOnlyFallback) return;
    const run = () => measureLineLayout();
    const rafId = requestAnimationFrame(run);
    window.addEventListener("resize", run);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", run);
    };
  }, [hasOnlyFallback, measureLineLayout, lyricLines.length, textAlign]);

  useEffect(() => {
    lyricsCurrentYRef.current = 0;
    lyricsTargetYRef.current = 0;
    lyricRowRefs.current = [];
    lineLayoutRef.current = { centers: [], totalHeight: 0 };
    if (lyricsInnerRef.current) {
      lyricsInnerRef.current.style.transform = "translateY(0px)";
    }
  }, [song?.title, lyricLines.length, hasOnlyFallback]);


  useEffect(() => {
    cancelAnimationFrame(lyricsRafRef.current);
    if (hasOnlyFallback) return;

    const tick = () => {
      const diff = lyricsTargetYRef.current - lyricsCurrentYRef.current;
      if (Math.abs(diff) > 0.5) {
        const step = Math.min(0.16, Math.max(0.07, Math.abs(diff) / 260));
        lyricsCurrentYRef.current += diff * step;
      }
      else lyricsCurrentYRef.current = lyricsTargetYRef.current;

      if (lyricsInnerRef.current) {
        lyricsInnerRef.current.style.transform = `translateY(${-lyricsCurrentYRef.current}px)`;
      }
      lyricsRafRef.current = requestAnimationFrame(tick);
    };

    lyricsRafRef.current = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(lyricsRafRef.current);
      lyricsRafRef.current = null;
    };
  }, [hasOnlyFallback]);

  useEffect(
    () => () => {
      clearTimeout(copiedTimerRef.current);
    },
    [],
  );

  const copyShareLink = useCallback(async () => {
    const link = window.location.href;
    let copied = false;

    try {
      await navigator.clipboard.writeText(link);
      copied = true;
    } catch {
      try {
        const ta = document.createElement("textarea");
        ta.value = link;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        copied = document.execCommand("copy");
        document.body.removeChild(ta);
      } catch {
        copied = false;
      }
    }

    if (copied) {
      setCopiedBadge(true);
      clearTimeout(copiedTimerRef.current);
      copiedTimerRef.current = setTimeout(() => setCopiedBadge(false), 1500);
    } else {
      setCopiedBadge(false);
    }
  }, []);

  const approxDuration = Math.max(
    1,
    Math.ceil(lyricLines[lyricLines.length - 1]?.time ?? 0) + 4,
    Math.ceil(elapsed),
  );
  const cover =
    song?.cover ||
    "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=1200&auto=format&fit=crop";

  return (
    <div className="animate-fade-in relative flex min-h-screen w-full flex-col overflow-hidden bg-[#050505] text-white md:h-screen md:flex-row md:items-center">
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .text-shadow-glow { text-shadow: 0 0 20px rgba(255,255,255,0.7), 0 0 40px rgba(255,255,255,0.3), 0 0 10px rgba(255,255,255,0.5); }
        .animate-fade-in { animation: fadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes eq-bar {
          0%, 100% { transform: scaleY(0.35); opacity: 0.45; }
          50% { transform: scaleY(1); opacity: 1; }
        }
        .eq-bar {
          animation: eq-bar 1.05s ease-in-out infinite;
          transform-origin: center bottom;
        }
        .music-lottie,
        .music-lottie svg {
          background: transparent !important;
        }
        .music-lottie {
          filter: drop-shadow(0 0 18px rgba(255,255,255,0.45));
        }
        @keyframes fadeIn { from { opacity: 0; transform: scale(1.01); } to { opacity: 1; transform: scale(1); } }
        .lyric-line {
          display: flex;
          align-items: center;
          justify-content: center;
          border: 0;
          background: transparent;
          color: #d4d9e6;
          opacity: 0.56;
          transition: opacity 0.58s ease-out, transform 0.58s cubic-bezier(0.16, 1, 0.3, 1), color 0.58s ease-out, text-shadow 0.58s ease-out;
          will-change: opacity, transform;
          font-size: clamp(0.98rem, 1.6vw, 2.08rem);
          line-height: 1.16;
          letter-spacing: -0.02em;
          word-spacing: 0.12em;
          font-family: var(--font-plus-jakarta), var(--font-manrope), ui-sans-serif, system-ui, sans-serif;
          font-weight: 650;
        }
        .lyric-text {
          display: block;
          overflow: visible;
          white-space: normal;
          word-break: break-word;
          text-wrap: pretty;
        }
        .lyric-active {
          opacity: 1;
          color: #ffffff;
          font-size: clamp(1.62rem, 2.96vw, 3.65rem);
          font-weight: 780;
          text-shadow:
            0 0 22px rgba(255,255,255,0.95),
            0 0 52px rgba(255,255,255,0.58),
            0 0 94px rgba(255,255,255,0.3);
        }
        .lyric-instrumental {
          text-shadow: none !important;
        }
        .lyric-instrumental.lyric-active {
          text-shadow: none !important;
        }
        .lyric-near {
          opacity: 0.9;
          color: #e3e9f4;
          font-size: clamp(1.3rem, 2.26vw, 2.95rem);
          font-weight: 740;
          text-shadow: 0 0 12px rgba(255,255,255,0.18);
        }
        .lyric-past {
          opacity: 0.42;
          color: #99a4ba;
          transform: scale(1);
          text-shadow: none;
        }
        .lyric-future {
          opacity: 0.48;
          color: #a5afc3;
          transform: scale(1);
          text-shadow: none;
        }
        .platform-links {
          display: flex;
          gap: 12px;
          margin-top: 25px;
          margin-bottom: auto;
        }
        .platform-btn {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.1);
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background 0.3s, transform 0.2s;
          color: rgba(255,255,255,0.8);
        }
        .platform-btn:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: scale(1.05);
          color: #fff;
        }
        .platform-btn svg {
          width: 18px;
          height: 18px;
          fill: currentColor;
        }
        .player-controls {
          display: flex;
          flex-direction: column;
          width: 100%;
          margin-bottom: 10px;
        }
        .mini-lyric-swiper {
          width: 100%;
          height: 20px;
          position: relative;
          overflow: hidden;
          margin-bottom: 15px;
          mask-image: linear-gradient(to right, transparent 0%, rgba(0,0,0,0.5) 15%, black 45%, black 55%, rgba(0,0,0,0.5) 85%, transparent 100%);
          -webkit-mask-image: linear-gradient(to right, transparent 0%, rgba(0,0,0,0.5) 15%, black 45%, black 55%, rgba(0,0,0,0.5) 85%, transparent 100%);
        }
        .mini-lyric-track {
          position: absolute;
          left: 50%;
          top: 50%;
          display: flex;
          align-items: center;
          gap: 24px;
          transition: transform 0.4s cubic-bezier(0.2, 0.9, 0.4, 1);
          white-space: nowrap;
        }
        .mini-word {
          border: none;
          background: transparent;
          padding: 0;
          font-family: var(--font-plus-jakarta), var(--font-manrope), ui-sans-serif, system-ui, sans-serif;
          font-size: 13px;
          font-weight: 500;
          color: rgba(255,255,255,0.3);
          transition: all 0.3s ease;
          cursor: pointer;
          transform-origin: center center;
        }
        .mini-word:hover { color: rgba(255,255,255,0.7); }
        .mini-word.active {
          color: #ffffff;
          font-weight: 700;
          text-shadow: 0 0 8px rgba(255,255,255,0.6);
          transform: scale(1.15);
        }
        .mini-word.adjacent {
          color: rgba(255, 255, 255, 0.65);
          transform: scale(1.05);
        }
        .progress-wrapper {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          margin-bottom: 15px;
        }
        .time-text {
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.05em;
          color: rgba(210, 214, 226, 0.85);
          font-variant-numeric: tabular-nums;
          flex: 0 0 35px;
        }
        .time-text.current { text-align: left; }
        .time-text.total { text-align: right; }
        .progress-container {
          position: relative;
          flex: 1;
          height: 20px;
          display: flex;
          align-items: center;
          cursor: pointer;
        }
        .progress-track {
          position: relative;
          width: 100%;
          height: 6px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 3px;
        }
        .progress-fill {
          position: absolute;
          top: 0;
          left: 0;
          height: 100%;
          background: #ffffff;
          border-radius: 3px;
          width: 0%;
          pointer-events: none;
        }
        .progress-thumb {
          position: absolute;
          top: 50%;
          left: 0%;
          transform: translate(-50%, -50%);
          width: 14px;
          height: 14px;
          background: #ffffff;
          border-radius: 50%;
          box-shadow: 0 2px 6px rgba(0,0,0,0.5);
          opacity: 1;
          transition: width 0.2s, height 0.2s;
          pointer-events: none;
        }
        .progress-container:hover .progress-thumb {
          width: 18px;
          height: 18px;
        }
        .control-buttons {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 35px;
          margin-bottom: 15px;
        }
        .btn-icon {
          background: transparent;
          border: none;
          color: rgba(255,255,255,0.6);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s;
        }
        .btn-icon:hover {
          color: #fff;
          transform: scale(1.1);
        }
        .btn-play {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          background: #ffffff;
          color: #000000;
          box-shadow: 0 0 40px 10px rgba(255, 255, 255, 0.25);
          transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .btn-play:hover {
          transform: scale(1.05);
        }
        .btn-play:active {
          transform: scale(0.95);
        }
        .sync-info {
          text-align: center;
          font-size: 10px;
          color: #a7afc3;
          letter-spacing: 0.05em;
        }
        @media (prefers-reduced-motion: reduce) {
          .lyric-line { transition: none; }
        }
      `}</style>

      <div className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(circle_at_68%_52%,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0.02)_24%,rgba(0,0,0,0)_56%)]" />
      <div className="pointer-events-none absolute top-[-20%] left-[-10%] h-[50%] w-[50%] rounded-full bg-purple-900/30 blur-[120px]" />
      <div className="pointer-events-none absolute right-[-10%] bottom-[-20%] h-[60%] w-[60%] rounded-full bg-blue-900/20 blur-[150px]" />

      {!isSidebarOpen && (
        <div className="animate-fade-in absolute top-6 left-1/2 z-50 flex -translate-x-1/2 gap-2 rounded-full border border-white/10 bg-white/10 p-1.5 shadow-lg backdrop-blur-md transition-all hover:bg-white/15">
          <button
            onClick={() => setTextAlign("left")}
            className={`rounded-full p-2 transition-colors ${
              textAlign === "left"
                ? "bg-white/20 shadow-sm"
                : "text-white/60 hover:bg-white/10 hover:text-white"
            }`}
          >
            <AlignLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => setTextAlign("center")}
            className={`rounded-full p-2 transition-colors ${
              textAlign === "center"
                ? "bg-white/20 shadow-sm"
                : "text-white/60 hover:bg-white/10 hover:text-white"
            }`}
          >
            <AlignCenter className="h-5 w-5" />
          </button>
          <button
            onClick={() => setTextAlign("right")}
            className={`rounded-full p-2 transition-colors ${
              textAlign === "right"
                ? "bg-white/20 shadow-sm"
                : "text-white/60 hover:bg-white/10 hover:text-white"
            }`}
          >
            <AlignRight className="h-5 w-5" />
          </button>
        </div>
      )}

      <div className="absolute top-6 right-6 z-50 flex items-center gap-2">
        {!isSidebarOpen ? (
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="rounded-full border border-white/15 bg-white/10 p-3 text-white shadow-lg backdrop-blur-md transition-all hover:scale-105 hover:bg-white hover:text-black active:scale-95"
            title="Open panel"
          >
            <PanelLeftOpen className="h-5 w-5" />
          </button>
        ) : null}
        <button
          onClick={onNewSong}
          className="group flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-5 py-2.5 text-[15px] font-bold tracking-tight text-white shadow-lg backdrop-blur-md transition-all hover:scale-105 hover:border-white hover:bg-white hover:text-black active:scale-95"
        >
          <span className="w-0 overflow-hidden opacity-0 transition-all duration-200 group-hover:w-4 group-hover:opacity-100">
            <Ear className="h-4 w-4" />
          </span>
          New search
        </button>
      </div>

      <div
        className={`${
          isSidebarOpen
            ? "flex w-full opacity-100 md:w-[32%] lg:w-[28%] xl:w-[24%]"
            : "hidden w-0 opacity-0 md:flex md:overflow-hidden md:opacity-0"
        } relative z-20 flex-col overflow-hidden rounded-none border-0 shadow-[0_8px_32px_rgba(0,0,0,0.5)] transition-all duration-500 ease-in-out md:my-12 md:ml-14 md:h-[calc(100vh_-_6rem)] md:self-center md:rounded-[2.1rem] md:border md:border-t-white/30 md:border-l-white/30 md:border-white/20 shrink-0`}
      >
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
          <img
            src={cover}
            alt=""
            className="h-full w-full scale-125 object-cover brightness-[0.7] saturate-[2.0] blur-[60px] opacity-[0.92]"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/26 to-[#050505]/72" />
        </div>

        <div className="relative z-10 flex h-full flex-col bg-white/5 backdrop-blur-sm">
          <div className="relative aspect-square w-full shrink-0">
            <div
              className="pointer-events-none absolute top-0 left-0 z-20 h-28 w-full"
              style={{
                maskImage:
                  "linear-gradient(to bottom, rgba(0,0,0,1) 40%, rgba(0,0,0,0) 100%)",
                WebkitMaskImage:
                  "linear-gradient(to bottom, rgba(0,0,0,1) 40%, rgba(0,0,0,0) 100%)",
              }}
            >
              <div className="h-full w-full bg-black/40 backdrop-blur-xl" />
            </div>

            <img
              src={cover}
              alt="Album Cover"
              className="absolute inset-0 z-10 h-full w-full object-cover"
              style={{
                maskImage:
                  "linear-gradient(to bottom, rgba(0,0,0,1) 50%, rgba(0,0,0,0) 100%)",
                WebkitMaskImage:
                  "linear-gradient(to bottom, rgba(0,0,0,1) 50%, rgba(0,0,0,0) 100%)",
              }}
            />

            <div className="absolute top-0 left-0 z-30 flex w-full items-start justify-between p-4 md:p-6">
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="flex items-center justify-center rounded-full border border-white/10 bg-white/10 p-3 text-white shadow-lg backdrop-blur-md transition-colors hover:bg-white/20"
                title="Hide Panel"
              >
                <PanelLeftClose className="h-5 w-5" />
              </button>

              <div className="flex gap-2">
                <button
                  onClick={copyShareLink}
                  className="flex items-center justify-center rounded-full border border-white/10 bg-white/10 p-3 text-white shadow-lg backdrop-blur-md transition-colors hover:bg-white/20"
                  title="Share link"
                >
                  <Share2 className="h-5 w-5" />
                </button>
                {copiedBadge ? (
                  <span className="self-center rounded-full border border-white/25 bg-white/15 px-2.5 py-1 text-[11px] font-medium text-white">
                    Link copied
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          <div className="z-30 flex flex-grow flex-col justify-end p-6 md:p-8">
            <div className="relative mb-4 -mt-16 flex w-full flex-col items-start text-left drop-shadow-2xl md:-mt-24">
              <h1 className="mb-1 text-3xl font-bold tracking-tight text-white drop-shadow-lg md:text-4xl lg:text-5xl">
                {song.title}
              </h1>
              <h2 className="text-lg font-medium text-white/70 md:text-xl">{song.artist}</h2>
            </div>

            <div className="mt-auto mb-2 flex w-full flex-col">
              <div className="platform-links">
                <button className="platform-btn" aria-label="Apple Music" title="Apple Music">
                  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M14.28 2.87c.72-.88 1.2-2.02 1.06-3.17-1.02.04-2.22.68-2.95 1.56-.65.77-1.2 1.93-1.03 3.06 1.14.09 2.2-.56 2.92-1.45zm-3.32 15.6c-.73.02-1.78-.65-2.88-.67-1.43-.02-2.75.83-3.48 2.1-1.48 2.58-.38 6.38 1.06 8.47.7.99 1.5 2.08 2.57 2.04 1.03-.04 1.43-.67 2.68-.67 1.25 0 1.62.67 2.7.65 1.1-.02 1.81-1.01 2.51-2.02.8-1.18 1.13-2.32 1.15-2.38-.02-.01-2.23-.86-2.26-3.42-.03-2.14 1.75-3.16 1.83-3.21-1-1.46-2.55-1.65-3.1-1.68-1.34-.14-2.65.77-3.38.77z" transform="scale(0.8) translate(3, 1)" />
                  </svg>
                </button>
                <button className="platform-btn" aria-label="Spotify" title="Spotify">
                  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.52 17.34c-.24.36-.66.48-1.02.24-2.82-1.74-6.36-2.1-10.56-1.14-.42.12-.84-.12-.96-.54-.12-.42.12-.84.54-.96 4.56-1.02 8.52-.6 11.64 1.32.42.18.54.66.36 1.08zm1.44-3.3c-.3.48-.96.6-1.44.3-3.24-2.04-8.16-2.64-11.94-1.44-.54.18-1.08-.12-1.26-.66-.18-.54.12-1.08.66-1.26 4.32-1.38 9.72-.72 13.5 1.62.54.3.66.9.48 1.44zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.3c-.72.24-1.44-.12-1.68-.84-.24-.72.12-1.44.84-1.68 4.32-1.32 11.52-1.02 16.2 1.8.6.36.84 1.14.48 1.8-.36.6-1.14.84-1.8.48z" />
                  </svg>
                </button>
                <button className="platform-btn" aria-label="YouTube" title="YouTube">
                  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21.582 6.186c-.23-.86-.908-1.538-1.768-1.768C18.254 4 12 4 12 4s-6.254 0-7.814.418c-.86.23-1.538.908-1.768 1.768C2 7.746 2 12 2 12s0 4.254.418 5.814c.23.86.908 1.538 1.768 1.768C5.746 20 12 20 12 20s6.254 0 7.814-.418c.86-.23 1.538-.908 1.768-1.768C22 16.254 22 12 22 12s0-4.254-.418-5.814zM9.75 15.02v-6.04L15.01 12l-5.26 3.02z" />
                  </svg>
                </button>
              </div>

              <div className="mb-1 mt-3 flex items-center justify-between text-xs font-medium tracking-wider text-white/50">
                <span>{fmt(elapsed)}</span>
                <span>{fmt(approxDuration)}</span>
              </div>

              <div
                className="group relative h-2 w-full cursor-pointer overflow-hidden rounded-full bg-black/40 shadow-inner md:h-3"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const percent = (e.clientX - rect.left) / rect.width;
                  const targetTime = Math.max(0, Math.min(approxDuration, percent * approxDuration));
                  onSeekToTime(targetTime);
                }}
              >
                <div
                  className="relative h-full rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)] transition-all duration-100 ease-linear"
                  style={{ width: `${Math.min(100, (elapsed / approxDuration) * 100)}%` }}
                />
              </div>

              <div className="mt-4 flex items-center justify-center gap-6">
                <button
                  onClick={() => onNudge(-COARSE_NUDGE_MS)}
                  className="p-3 text-white/60 transition-all hover:scale-110 hover:text-white"
                  title="Nudge back 0.5s"
                >
                  <RotateCcw className="h-7 w-7" />
                </button>
                <button
                  onClick={playing ? onPause : onResume}
                  className="rounded-full bg-white p-4 text-black shadow-[0_0_25px_rgba(255,255,255,0.4)] transition-all hover:scale-105 active:scale-95 md:p-5"
                >
                  {playing ? (
                    <Pause className="h-7 w-7 fill-current md:h-8 md:w-8" />
                  ) : (
                    <Play className="ml-1 h-7 w-7 fill-current md:h-8 md:w-8" />
                  )}
                </button>
                <button
                  onClick={() => onNudge(COARSE_NUDGE_MS)}
                  className="p-3 text-white/60 transition-all hover:scale-110 hover:text-white"
                  title="Nudge forward 0.5s"
                >
                  <RotateCw className="h-7 w-7" />
                </button>
              </div>

              <div className="mt-2 text-center text-xs text-purple-300/80">
                {syncNote || "Tap any lyric line to resync instantly"}
                {offsetMs !== 0 ? ` · manual offset ${offsetMs > 0 ? "+" : ""}${(offsetMs / 1000).toFixed(1)}s` : ""}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="group relative h-[52vh] min-w-0 flex-1 overflow-hidden transition-all duration-500 ease-in-out md:h-screen md:min-h-screen">
        <div className="pointer-events-none absolute inset-0 z-[5] bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.09)_0%,rgba(255,255,255,0.03)_22%,rgba(0,0,0,0)_52%)]" />
        <div className="pointer-events-none absolute top-0 z-10 h-32 w-full bg-gradient-to-b from-[#050505] via-[#050505]/97 to-transparent md:h-48" />
        <div className="pointer-events-none absolute bottom-0 z-10 h-32 w-full bg-gradient-to-t from-[#050505] via-[#050505]/97 to-transparent md:h-48" />

        <div
          className={`absolute inset-0 z-20 overflow-y-hidden overflow-x-visible ${hasOnlyFallback ? "px-8 md:px-20 lg:px-28" : ""}`}
          style={{
            height: hasOnlyFallback
              ? undefined
              : `${lyricViewportHeight}px`,
            top: hasOnlyFallback ? 0 : "50%",
            transform: hasOnlyFallback ? undefined : "translateY(-50%)",
          }}
        >
          {hasOnlyFallback ? (
            <div className="flex min-h-full w-full items-center justify-center py-14 text-center">
              <p className="mx-auto max-w-[980px] text-sm text-white/45">
                We found the song, but timed lyrics were unavailable for this track.
              </p>
            </div>
          ) : (
            <div
              ref={lyricsInnerRef}
              className="mx-auto w-full max-w-[1120px] px-8 md:px-24 lg:px-32"
              style={{ willChange: "transform" }}
            >
              {lyricLines.map((lyric, index) => (
                <LyricLineItem
                  key={`${lyric.time}-${index}`}
                  rowRef={(el) => {
                    lyricRowRefs.current[index] = el;
                  }}
                  text={lyric.text}
                  isActive={index === activeIdx}
                  isPast={index < activeIdx}
                  distanceFromActive={index - activeIdx}
                  textAlign={textAlign}
                  onClick={() => onJumpTo(index)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════ APP ═══════════════════ */
export function KaraokeListenApp() {
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
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          channelCount: 1,
        },
      });
      startLiveMeter(stream);
      const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/mp4")
          ? "audio/mp4"
          : "";
      const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : {});
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
    } catch {
      if (runId !== runIdRef.current) return;
      stopLiveMeter();
      setPhase("error");
      setError("Mic access denied — please allow microphone.");
    }
  }, [startLiveMeter, stopDriftMonitor, stopLiveMeter]);

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
      setPhase("karaoke");
      startTicker(parsed, songAtRecEnd.current, recEndWall.current);
      scheduleOneTimeResync(runId);
    } catch {
      if (runId !== runIdRef.current) return;
      const fallback = [{ time: 0, text: "No synced lyrics found" }];
      setLines(fallback);
      linesRef.current = fallback;
      setHasSyncedLyricTiming(false);
      setSyncNote((prev) =>
        prev ? `${prev} · no synced lyrics` : "no synced lyrics",
      );
      setPhase("karaoke");
      startTicker(fallback, songAtRecEnd.current, recEndWall.current);
      scheduleOneTimeResync(runId);
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

  if (phase === "karaoke" && song) {
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
        onNewSong={listen}
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
    />
  );
}

export default KaraokeListenApp;
