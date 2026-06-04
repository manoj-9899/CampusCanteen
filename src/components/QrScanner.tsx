"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, ImageIcon, Loader2 } from "lucide-react";

interface QrScannerProps {
  onScan: (decodedText: string) => void;
  onClose?: () => void;
}

type CameraDevice = { id: string; label: string };

function pickDefaultCamera(cameras: CameraDevice[]) {
  const smart = cameras.find((c) =>
    /smart|connect|link|phone|galaxy|continuity|droidcam|ivcam|virtual|external/i.test(
      c.label
    )
  );
  if (smart) return smart.id;
  const back = cameras.find((c) => /back|rear|environment/i.test(c.label));
  if (back) return back.id;
  return cameras[0]?.id ?? "";
}

async function safeStopScanner(
  scanner: { getState: () => number; stop: () => Promise<void> } | null
) {
  if (!scanner) return;
  try {
    const state = scanner.getState();
    if (state === 1 || state === 2) {
      await scanner.stop();
    }
  } catch {
    // ignore
  }
}

export function QrScanner({ onScan, onClose }: QrScannerProps) {
  const containerId = useRef(`qr-reader-${Math.random().toString(36).slice(2)}`);
  const fileInputId = useRef(`qr-file-${Math.random().toString(36).slice(2)}`);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanLoopRef = useRef<number | null>(null);
  const scannerRef = useRef<{ getState: () => number; stop: () => Promise<void> } | null>(
    null
  );
  const handledRef = useRef(false);
  const useNativeRef = useRef(false);

  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [selectedCamera, setSelectedCamera] = useState("");
  const [camerasLoading, setCamerasLoading] = useState(true);
  const [liveStatus, setLiveStatus] = useState<"idle" | "starting" | "scanning" | "error">(
    "idle"
  );
  const [fileBusy, setFileBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [scanMode, setScanMode] = useState<"native" | "library">("native");

  const finishScan = useCallback(
    (text: string) => {
      if (handledRef.current) return;
      handledRef.current = true;
      onScan(text);
    },
    [onScan]
  );

  const stopAll = useCallback(async () => {
    if (scanLoopRef.current) {
      cancelAnimationFrame(scanLoopRef.current);
      scanLoopRef.current = null;
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    await safeStopScanner(scannerRef.current);
    scannerRef.current = null;
    useNativeRef.current = false;
  }, []);

  const loadCameras = useCallback(async () => {
    setCamerasLoading(true);
    setErrorMsg("");
    try {
      // Prompt for permission so Smart Connect / virtual cameras appear in the list
      try {
        const probe = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        probe.getTracks().forEach((t) => t.stop());
      } catch {
        // continue — getCameras may still work
      }

      const { Html5Qrcode } = await import("html5-qrcode");
      const list = await Html5Qrcode.getCameras();
      const devices = list.map((c) => ({
        id: c.id,
        label: c.label || `Camera ${c.id.slice(0, 8)}`,
      }));
      setCameras(devices);
      setSelectedCamera((prev) => {
        if (prev && devices.some((d) => d.id === prev)) return prev;
        return pickDefaultCamera(devices);
      });
      if (devices.length === 0) {
        setErrorMsg(
          "No cameras found. In Brave: click the lock icon → allow Camera, then click Refresh cameras."
        );
      }
    } catch {
      setErrorMsg("Could not list cameras. Allow camera access for localhost in Brave.");
    } finally {
      setCamerasLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCameras();
    return () => {
      void stopAll();
    };
  }, [loadCameras, stopAll]);

  const startNativeScanner = async (deviceId: string) => {
    const video = videoRef.current;
    if (!video) throw new Error("Video element not ready");

    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        deviceId: { exact: deviceId },
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
      audio: false,
    });

    streamRef.current = stream;
    video.srcObject = stream;
    video.setAttribute("playsinline", "true");
    await video.play();

    if (!("BarcodeDetector" in window)) {
      throw new Error("BarcodeDetector not supported — switching scanner engine.");
    }

    const detector = new (window as unknown as { BarcodeDetector: new (o: object) => {
      detect: (source: HTMLVideoElement) => Promise<{ rawValue: string }[]>;
    } }).BarcodeDetector({ formats: ["qr_code"] });

    useNativeRef.current = true;
    setLiveStatus("scanning");

    const tick = async () => {
      if (!useNativeRef.current || !videoRef.current || handledRef.current) return;
      try {
        const codes = await detector.detect(videoRef.current);
        if (codes.length > 0 && codes[0].rawValue) {
          await stopAll();
          setLiveStatus("idle");
          finishScan(codes[0].rawValue);
          return;
        }
      } catch {
        // frame not ready yet
      }
      scanLoopRef.current = requestAnimationFrame(() => void tick());
    };

    scanLoopRef.current = requestAnimationFrame(() => void tick());
  };

  const startLibraryScanner = async (deviceId: string) => {
    const { Html5Qrcode } = await import("html5-qrcode");
    await safeStopScanner(scannerRef.current);
    const scanner = new Html5Qrcode(containerId.current);
    scannerRef.current = scanner;

    await scanner.start(
      deviceId,
      {
        fps: 10,
        aspectRatio: 1.333,
        qrbox: (w, h) => {
          const size = Math.floor(Math.min(w, h) * 0.75);
          return { width: size, height: size };
        },
      },
      (decodedText) => {
        void safeStopScanner(scanner).finally(() => {
          scannerRef.current = null;
          setLiveStatus("idle");
          finishScan(decodedText);
        });
      },
      () => {}
    );

    setLiveStatus("scanning");
    setScanMode("library");
  };

  const startLiveCamera = async () => {
    if (!selectedCamera) {
      setErrorMsg("Select a camera first (e.g. Smart Connect).");
      return;
    }

    handledRef.current = false;
    setErrorMsg("");
    setLiveStatus("starting");

    // Container must be visible BEFORE getUserMedia / scanner.start
    await new Promise((r) => requestAnimationFrame(r));

    try {
      await stopAll();
      try {
        await startNativeScanner(selectedCamera);
        setScanMode("native");
      } catch {
        await stopAll();
        setScanMode("library");
        await startLibraryScanner(selectedCamera);
      }
    } catch (err) {
      setLiveStatus("error");
      const msg = err instanceof Error ? err.message : "Could not start camera";
      setErrorMsg(
        msg.includes("NotAllowed") || msg.includes("Permission")
          ? "Camera blocked in Brave. Click the lock icon → allow Camera, then retry."
          : `${msg} Select “Smart Connect” in the list, or use Photo of QR.`
      );
    }
  };

  const stopLiveCamera = async () => {
    await stopAll();
    setLiveStatus("idle");
    onClose?.();
  };

  const scanFromFile = async (file: File) => {
    setFileBusy(true);
    setErrorMsg("");
    handledRef.current = false;
    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const scanner = new Html5Qrcode(containerId.current);
      const text = await scanner.scanFile(file, true);
      await scanner.clear();
      finishScan(text);
    } catch {
      setErrorMsg("Could not read QR from that image. Try again or enter the token manually.");
    } finally {
      setFileBusy(false);
    }
  };

  const showPreview = liveStatus === "starting" || liveStatus === "scanning";

  return (
    <div className="mt-4 space-y-3">
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">
          Select camera (choose Smart Connect if listed)
        </label>
        <select
          value={selectedCamera}
          onChange={(e) => setSelectedCamera(e.target.value)}
          disabled={liveStatus === "scanning" || liveStatus === "starting" || camerasLoading}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        >
          {camerasLoading && <option>Loading cameras…</option>}
          {!camerasLoading && cameras.length === 0 && (
            <option value="">No camera found</option>
          )}
          {cameras.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => void loadCameras()}
          disabled={camerasLoading || liveStatus !== "idle"}
          className="mt-1 text-xs text-orange-600 underline disabled:opacity-50"
        >
          Refresh cameras
        </button>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        {liveStatus === "scanning" || liveStatus === "starting" ? (
          <button
            type="button"
            onClick={() => void stopLiveCamera()}
            className="flex-1 rounded-lg bg-slate-800 py-2.5 text-sm font-medium text-white"
          >
            Stop camera
          </button>
        ) : (
          <button
            type="button"
            onClick={() => void startLiveCamera()}
            disabled={camerasLoading || !selectedCamera}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-orange-500 py-2.5 text-sm font-medium text-white disabled:opacity-60"
          >
            <Camera className="h-4 w-4" />
            Start live camera
          </button>
        )}

        <label
          htmlFor={fileInputId.current}
          className="inline-flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border border-orange-300 bg-orange-50 py-2.5 text-sm font-medium text-orange-800"
        >
          {fileBusy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ImageIcon className="h-4 w-4" />
          )}
          Photo of QR
        </label>
        <input
          id={fileInputId.current}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void scanFromFile(file);
            e.target.value = "";
          }}
        />
      </div>

      <div
        className={`qr-scanner-view overflow-hidden rounded-xl border bg-black ${
          showPreview ? "block min-h-[280px]" : "hidden"
        }`}
      >
        {/* Native video preview (Smart Connect / webcam) */}
        <video
          ref={videoRef}
          className={`h-full min-h-[280px] w-full object-cover ${
            scanMode === "native" && liveStatus === "scanning" ? "block" : "hidden"
          }`}
          muted
          playsInline
        />
        {/* html5-qrcode fallback mount point */}
        <div
          id={containerId.current}
          className={`${scanMode === "library" && liveStatus === "scanning" ? "block" : "hidden"}`}
        />
      </div>

      {liveStatus === "starting" && (
        <p className="flex items-center justify-center gap-2 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Starting {cameras.find((c) => c.id === selectedCamera)?.label ?? "camera"}…
        </p>
      )}

      {liveStatus === "scanning" && (
        <p className="text-center text-xs text-green-700">
          Live feed active — point at the student&apos;s QR code
        </p>
      )}

      {errorMsg && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{errorMsg}</p>
      )}
    </div>
  );
}
