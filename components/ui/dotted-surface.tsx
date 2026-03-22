"use client";

import * as React from "react";
import * as THREE from "three";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils/cn";

type DottedSurfaceProps = Omit<React.ComponentProps<"div">, "ref"> & {
  beatLevel?: number;
};

export function DottedSurface({
  className,
  beatLevel = 0,
  ...props
}: DottedSurfaceProps) {
  const { theme } = useTheme();
  const containerRef = React.useRef<HTMLDivElement>(null);
  const beatRef = React.useRef(beatLevel);

  React.useEffect(() => {
    beatRef.current = Math.max(0, Math.min(1.5, beatLevel));
  }, [beatLevel]);

  React.useEffect(() => {
    if (!containerRef.current) return;
    const containerNode = containerRef.current;

    const SEPARATION = 150;
    const AMOUNTX = 40;
    const AMOUNTY = 60;

    const scene = new THREE.Scene();
    const fogColor = theme === "dark" ? 0x050505 : 0xf8fafc;
    scene.fog = new THREE.Fog(fogColor, 2000, 10000);

    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      1,
      10000,
    );
    camera.position.set(0, 355, 1220);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(fogColor, 0);
    containerNode.appendChild(renderer.domElement);

    const geometry = new THREE.BufferGeometry();
    const positions: number[] = [];
    const colors: number[] = [];

    for (let ix = 0; ix < AMOUNTX; ix += 1) {
      for (let iy = 0; iy < AMOUNTY; iy += 1) {
        const x = ix * SEPARATION - (AMOUNTX * SEPARATION) / 2;
        const y = 0;
        const z = iy * SEPARATION - (AMOUNTY * SEPARATION) / 2;
        positions.push(x, y, z);

        if (theme === "dark") colors.push(205 / 255, 205 / 255, 205 / 255);
        else colors.push(0.15, 0.2, 0.24);
      }
    }

    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 8,
      vertexColors: true,
      transparent: true,
      opacity: theme === "dark" ? 0.68 : 0.45,
      sizeAttenuation: true,
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    let animationId = 0;
    let count = 0;
    let smoothedBeat = beatRef.current;

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      smoothedBeat += (beatRef.current - smoothedBeat) * 0.1;

      const pos = geometry.attributes.position.array as Float32Array;
      let i = 0;
      const waveAmp = 46 + smoothedBeat * 52;
      for (let ix = 0; ix < AMOUNTX; ix += 1) {
        for (let iy = 0; iy < AMOUNTY; iy += 1) {
          const index = i * 3;
          pos[index + 1] =
            Math.sin((ix + count) * 0.3) * waveAmp +
            Math.sin((iy + count) * 0.5) * waveAmp;
          i += 1;
        }
      }
      geometry.attributes.position.needsUpdate = true;
      renderer.render(scene, camera);
      count += 0.08 + smoothedBeat * 0.045;
    };

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener("resize", handleResize);
    animate();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationId);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      if (renderer.domElement.parentElement === containerNode) {
        containerNode.removeChild(renderer.domElement);
      }
    };
  }, [theme]);

  return (
    <div
      ref={containerRef}
      className={cn("pointer-events-none absolute inset-0", className)}
      {...props}
    />
  );
}
