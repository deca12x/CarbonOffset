"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger);

// Create a client-only version of the component
const AnimatedBackgroundClient = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [frameUrls, setFrameUrls] = useState<string[]>([]);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);

  const logDebug = useCallback((message: string) => {
    if (process.env.NODE_ENV === "development") {
      console.log(`[AnimatedBackground] ${message}`);
    }
  }, []);

  const generatedFrameUrls = useMemo(() => {
    const firstFrameNumber = 1;
    const lastFrameNumber = 121; // Adjust this based on your total frames
    const urls: string[] = [];

    for (let i = firstFrameNumber; i <= lastFrameNumber; i++) {
      const frameNumber = i.toString().padStart(4, "0");
      urls.push(`/animatedBackground/cropped_temp_frame_${frameNumber}.webp`);
    }

    return urls;
  }, []);

  useEffect(() => {
    logDebug(`Generated ${generatedFrameUrls.length} frame URLs`);
    setFrameUrls(generatedFrameUrls);
  }, [generatedFrameUrls, logDebug]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      logDebug("ERROR: Canvas element not found");
      return;
    }

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) {
      logDebug("ERROR: Could not get canvas context");
      return;
    }

    logDebug("Canvas initialized successfully");
    ctxRef.current = ctx;

    const updateCanvasSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      logDebug(`Canvas size updated: ${canvas.width}x${canvas.height}`);
    };

    updateCanvasSize();
    window.addEventListener("resize", updateCanvasSize);

    return () => {
      window.removeEventListener("resize", updateCanvasSize);
    };
  }, [logDebug]);

  const drawFrame = useCallback(
    (frameIndex: number) => {
      const ctx = ctxRef.current;
      const canvas = canvasRef.current;
      if (!ctx || !canvas) {
        logDebug("ERROR: Cannot draw frame - canvas or context not available");
        return;
      }

      const img = imagesRef.current[frameIndex];
      if (!img) {
        logDebug(`ERROR: Cannot draw frame ${frameIndex} - image not loaded`);
        return;
      }

      const scale =
        Math.max(canvas.width / img.width, canvas.height / img.height) * 1.1;

      const x = (canvas.width - img.width * scale) / 2;
      const y = (canvas.height - img.height * scale) / 2;

      ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
    },
    [logDebug]
  );

  const preloadImages = useCallback(async () => {
    if (frameUrls.length === 0) {
      logDebug("No frame URLs available for preloading");
      return;
    }

    logDebug(`Starting preload of ${frameUrls.length} frames`);
    const promises = frameUrls.map((url, index) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          imagesRef.current[index] = img;
          if (index === 0 && ctxRef.current && canvasRef.current) {
            drawFrame(0);
          }
          resolve(true);
        };
        img.onerror = () => {
          logDebug(`ERROR: Failed to load frame ${index + 1}: ${url}`);
          resolve(false);
        };
        img.src = url;
      });
    });

    try {
      const results = await Promise.all(promises);
      const successCount = results.filter(Boolean).length;

      if (successCount > 0 && ctxRef.current && canvasRef.current) {
        drawFrame(0);
      }

      setIsLoading(false);
    } catch (error) {
      logDebug(`ERROR during preload: ${error}`);
      setIsError(true);
    }
  }, [frameUrls, drawFrame, logDebug]);

  useEffect(() => {
    preloadImages();
  }, [preloadImages]);

  useEffect(() => {
    if (frameUrls.length === 0) {
      return;
    }

    const numFrames = frameUrls.length;

    ScrollTrigger.create({
      trigger: "body",
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self: ScrollTrigger) => {
        const scrollPercent = self.progress;
        const targetFrameIndex = Math.min(
          Math.floor(scrollPercent * (numFrames - 1)),
          numFrames - 1
        );

        drawFrame(targetFrameIndex);
      },
    });

    return () => {
      ScrollTrigger.getAll().forEach((trigger: ScrollTrigger) =>
        trigger.kill()
      );
    };
  }, [frameUrls, drawFrame]);

  return (
    <div className="fixed-background" style={{ zIndex: -1 }}>
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: "100vw",
          height: "100vh",
          zIndex: -1,
          backgroundColor: "#000",
          overflow: "hidden",
        }}
      />
      <div className="absolute inset-0 bg-black/30" style={{ zIndex: -1 }} />
    </div>
  );
};

const AnimatedBackgroundPlaceholder = () => (
  <div className="fixed-background" style={{ zIndex: -1 }}>
    <div
      className="w-full h-full"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: "100vw",
        height: "100vh",
        zIndex: -1,
        backgroundColor: "#000",
        overflow: "hidden",
      }}
    />
    <div className="absolute inset-0 bg-black/30" style={{ zIndex: -1 }} />
  </div>
);

export const AnimatedBackground = dynamic(
  () => Promise.resolve(AnimatedBackgroundClient),
  {
    ssr: false,
    loading: () => <AnimatedBackgroundPlaceholder />,
  }
);
