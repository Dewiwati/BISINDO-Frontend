"use client";

import { useEffect, useRef, useState } from "react";
import { Hands } from "@mediapipe/hands";
import { Camera } from "@mediapipe/camera_utils";
import { drawConnectors, drawLandmarks } from "@mediapipe/drawing_utils";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
// Some cameras (especially front cameras) appear mirrored in the browser.
// Set this to true to force the display to match real-world left/right.
const UNMIRROR = true;

export default function Home() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [prediction, setPrediction] = useState<string>("-");
  const [wordBuffer, setWordBuffer] = useState<string[]>([]);
  const [status, setStatus] = useState<string>("Menunggu izin kamera...");
  const lastSentRef = useRef<number>(0);
  const lastCommittedRef = useRef<string>("-");

  useEffect(() => {
    let camera: Camera | null = null;
    let isMounted = true;

    const videoElement = videoRef.current;
    const canvasElement = canvasRef.current;

    if (!videoElement || !canvasElement) return;

    const canvasCtx = canvasElement.getContext("2d");
    if (!canvasCtx) return;

    const hands = new Hands({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
    });

    hands.setOptions({
      maxNumHands: 2,
      modelComplexity: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    hands.onResults(async (results) => {
      if (!isMounted) return;

      canvasCtx.save();
      canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
      canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

      if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        setStatus("Tangan terdeteksi");

        results.multiHandLandmarks.forEach((landmarks) => {
          drawConnectors(canvasCtx, landmarks, Hands.HAND_CONNECTIONS, { color: "#0b7a75", lineWidth: 4 });
          drawLandmarks(canvasCtx, landmarks, { color: "#e86a33", lineWidth: 2 });
        });

        const sortedHands = [...results.multiHandLandmarks].sort(
          (a, b) => a[0].x - b[0].x
        );

        const features: number[] = [];
        sortedHands.slice(0, 2).forEach((hand) => {
          const base = hand[0];
          hand.forEach((lm) => {
            features.push(lm.x - base.x, lm.y - base.y);
          });
        });

        while (features.length < 84) features.push(0.0);
        if (features.length > 84) features.length = 84;

        const now = Date.now();
        if (now - lastSentRef.current > 200) {
          lastSentRef.current = now;
          try {
            const response = await fetch(`${API_URL}/predict`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ features })
            });
            if (response.ok) {
              const data = await response.json();
              const next = data.stable_prediction || data.prediction || "-";
              setPrediction(next);
              if (next !== "-" && next !== lastCommittedRef.current) {
                lastCommittedRef.current = next;
                setWordBuffer((prev) => {
                  const updated = [...prev, next].slice(-12);
                  return updated;
                });
              }
            } else {
              setStatus("Gagal membaca prediksi dari server");
            }
          } catch {
            setStatus("Tidak bisa terhubung ke API");
          }
        }
      } else {
        setStatus("Arahkan tangan ke kamera");
      }

      canvasCtx.restore();
    });

    camera = new Camera(videoElement, {
      onFrame: async () => {
        await hands.send({ image: videoElement });
      },
      width: 960,
      height: 720
    });

    camera
      .start()
      .then(() => {
        if (!isMounted) return;
        setStatus("Kamera aktif");
      })
      .catch(() => {
        setStatus("Izin kamera ditolak atau kamera tidak tersedia");
      });

    return () => {
      isMounted = false;
      if (camera) camera.stop();
      hands.close();
    };
  }, []);

  return (
    <main className="min-h-screen px-6 pb-16 pt-10">
      <header className="mx-auto flex w-full max-w-6xl flex-col gap-4">
        <span className="inline-flex w-fit items-center gap-2 rounded-full bg-jade/10 px-4 py-2 text-xs uppercase tracking-[0.2em] text-jade">
          BISINDO realtime
        </span>
        <h1 className="text-3xl font-semibold tracking-tight text-ink sm:text-5xl">
          Sistem Penerjemah Gesture tangan BISINDO ke Bahasa Teks untuk Penyandang Tunarungu Menggunakan Computer Vision dan NLP
        </h1>
        <p className="max-w-2xl text-base leading-relaxed text-ink/70">
          Platform ini mendeteksi gestur tangan BISINDO secara real-time dan menampilkan huruf A-Z
          dengan cepat serta stabil. Didukung MediaPipe Hands dan model klasifikasi, hasil prediksi
          tampil interaktif di layar.
        </p>
      </header>

      <section className="mx-auto mt-10 grid w-full max-w-6xl gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="rounded-3xl bg-white/80 p-5 shadow-glow backdrop-blur">
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-black">
            <video
              ref={videoRef}
              className="absolute left-0 top-0 h-full w-full object-cover"
              style={{ transform: UNMIRROR ? "scaleX(-1)" : "scaleX(1)" }}
              autoPlay
              playsInline
              muted
            />
            <canvas
              ref={canvasRef}
              className="absolute left-0 top-0 h-full w-full"
              style={{ transform: UNMIRROR ? "scaleX(-1)" : "scaleX(1)" }}
              width={960}
              height={720}
            />
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-ink/70">
            <span>Status: {status}</span>
            <span className="rounded-full bg-ember/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-ember">
              Live
            </span>
          </div>
          <div className="mt-6 rounded-2xl bg-sand/70 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs uppercase tracking-[0.25em] text-ink/50">
                Hasil Sementara
              </p>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() =>
                    setWordBuffer((prev) => prev.slice(0, Math.max(prev.length - 1, 0)))
                  }
                  className="rounded-full bg-white/80 px-3 py-1 font-semibold text-ink/70 transition hover:bg-white"
                >
                  Backspace
                </button>
                <button
                  type="button"
                  onClick={() => setWordBuffer([])}
                  className="rounded-full bg-white/80 px-3 py-1 font-semibold text-ink/70 transition hover:bg-white"
                >
                  Clear
                </button>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {Array.from({ length: 12 }).map((_, index) => (
                <div
                  key={`slot-${index}`}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/70 text-sm font-semibold text-ink/60"
                >
                  {wordBuffer[index] || "-"}
                </div>
              ))}
            </div>
            <div className="mt-3" />
          </div>
        </div>

        <div className="flex h-full flex-col gap-6 rounded-3xl bg-white/85 p-6 shadow-glow backdrop-blur">
          <div className="rounded-2xl bg-ember/20 px-4 py-3 text-sm font-medium text-ink">
            Pastikan pencahayaan cukup dan tangan terlihat penuh.
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-ink/50">Prediksi</p>
            <h2 className="mt-2 text-6xl font-semibold text-ink sm:text-8xl">
              {prediction}
            </h2>
            <p className="mt-3 text-sm text-ink/60">Output huruf BISINDO A-Z</p>
          </div>
          <div className="mt-auto">
            <p className="text-xs uppercase tracking-[0.25em] text-ink/50">
              Contoh Gesture A-Z
            </p>
            <div className="mt-3 grid grid-cols-5 gap-3 text-xs">
              {"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map((letter) => (
                <GestureTile key={letter} letter={letter} />
              ))}
            </div>
            <div className="mt-3" />
          </div>
        </div>
      </section>

      <footer className="mx-auto mt-12 w-full max-w-6xl text-xs text-ink/50" />
    </main>
  );
}

function GestureTile({ letter }: { letter: string }) {
  const [imgOk, setImgOk] = useState(true);
  const jpgPath = `/gestures/${letter}.jpeg`;
  const pngPath = `/gestures/${letter}.png`;

  return (
    <div className="flex aspect-square w-full max-w-[88px] flex-col items-center justify-center gap-1 rounded-2xl bg-sand/70 p-2">
      {imgOk ? (
        <img
          src={jpgPath}
          onError={(event) => {
            const target = event.currentTarget;
            if (target.src.endsWith(".jpeg")) {
              target.src = pngPath;
            } else {
              setImgOk(false);
            }
          }}
          alt={`Gesture ${letter}`}
          className="h-10 w-10 object-contain sm:h-12 sm:w-12"
        />
      ) : (
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/70 text-sm font-semibold text-ink/70 sm:h-12 sm:w-12">
          {letter}
        </div>
      )}
      <span className="text-[10px] font-semibold text-ink/60">{letter}</span>
    </div>
  );
}
