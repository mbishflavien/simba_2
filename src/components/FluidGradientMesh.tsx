import React, { useRef, useEffect } from 'react';

interface FluidGradientMeshProps {
  className?: string;
  intensity?: number;
  speed?: number;
  interactive?: boolean;
}

/**
 * High-performance, interactive WebGL/2D Canvas Fluid Gradient Mesh
 * Creates smooth organic marble/fluid swirls in emerald green, warm orange, and soft cream.
 * Reacts dynamically to mouse coordinates with natural momentum and spring physics.
 */
export default function FluidGradientMesh({
  className = '',
  intensity = 1.0,
  speed = 1.0,
  interactive = true,
}: FluidGradientMeshProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let isVisible = true;
    let width = (canvas.width = canvas.offsetWidth || 800);
    let height = (canvas.height = canvas.offsetHeight || 600);

    // Mouse coordinates with linear interpolation (lerp) for buttery momentum
    const targetMouse = { x: width * 0.5, y: height * 0.5, vx: 0, vy: 0 };
    const currentMouse = { x: width * 0.5, y: height * 0.5 };
    let lastMouse = { x: width * 0.5, y: height * 0.5 };

    // Fluid swirl particles / color control nodes matching video palette
    const colors = [
      { r: 45, g: 106, b: 79 },   // Deep Emerald Green
      { r: 244, g: 162, b: 97 },  // Warm Golden Amber
      { r: 238, g: 98, b: 40 },   // Vibrant Simba Orange
      { r: 82, g: 183, b: 136 },  // Lush Herb Green
      { r: 254, g: 250, b: 224 }, // Cream Warm Off-White
    ];

    // Swirl nodes that drift in harmony
    const nodes = [
      { x: 0.25, y: 0.35, vx: 0.0006, vy: 0.0004, radius: 0.65, colorIdx: 0 },
      { x: 0.75, y: 0.3,  vx: -0.0005, vy: 0.0007, radius: 0.75, colorIdx: 1 },
      { x: 0.5,  y: 0.75, vx: 0.0008, vy: -0.0005, radius: 0.7, colorIdx: 2 },
      { x: 0.2,  y: 0.8,  vx: -0.0004, vy: -0.0006, radius: 0.6, colorIdx: 3 },
      { x: 0.8,  y: 0.85, vx: 0.0005, vy: 0.0003, radius: 0.8, colorIdx: 4 },
      { x: 0.5,  y: 0.2,  vx: 0.0003, vy: -0.0004, radius: 0.65, colorIdx: 1 },
    ];

    const resize = () => {
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      ctx.scale(dpr, dpr);
    };

    resize();
    const resizeObserver = new ResizeObserver(() => resize());
    resizeObserver.observe(canvas);

    // Mouse & Touch interaction handlers
    const handleMouseMove = (e: MouseEvent) => {
      if (!interactive) return;
      const rect = canvas.getBoundingClientRect();
      targetMouse.x = e.clientX - rect.left;
      targetMouse.y = e.clientY - rect.top;
      targetMouse.vx = (targetMouse.x - lastMouse.x) * 0.1;
      targetMouse.vy = (targetMouse.y - lastMouse.y) * 0.1;
      lastMouse = { x: targetMouse.x, y: targetMouse.y };
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!interactive || e.touches.length === 0) return;
      const rect = canvas.getBoundingClientRect();
      targetMouse.x = e.touches[0].clientX - rect.left;
      targetMouse.y = e.touches[0].clientY - rect.top;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });

    // Intersection Observer to sleep animation when off-screen
    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        isVisible = entries[0]?.isIntersecting ?? true;
      },
      { threshold: 0.05 }
    );
    intersectionObserver.observe(canvas);

    let time = 0;

    const render = () => {
      if (!isVisible) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      time += 0.008 * speed;

      // Smooth mouse lerping
      currentMouse.x += (targetMouse.x - currentMouse.x) * 0.05;
      currentMouse.y += (targetMouse.y - currentMouse.y) * 0.05;

      const normMouseX = (currentMouse.x / (width || 1) - 0.5) * 2;
      const normMouseY = (currentMouse.y / (height || 1) - 0.5) * 2;

      // Base fill with warm soft cream
      ctx.fillStyle = '#fbf7ee';
      ctx.fillRect(0, 0, width, height);

      // Render layered radial gradient nodes to simulate marble fluid shear
      ctx.globalCompositeOperation = 'source-over';

      nodes.forEach((node, i) => {
        // Organic sinusoidal drifting with mouse deflection
        const mouseDist = Math.hypot(
          (node.x * width) - currentMouse.x,
          (node.y * height) - currentMouse.y
        );
        const mouseEffect = Math.max(0, 1 - mouseDist / (Math.max(width, height) * 0.75)) * intensity;

        const currentX = (node.x + Math.sin(time + i * 1.3) * 0.15 + (normMouseX * 0.08 * (i % 2 === 0 ? 1 : -1)) + (node.vx * time * 50) % 1) * width;
        const currentY = (node.y + Math.cos(time + i * 1.7) * 0.15 + (normMouseY * 0.08 * (i % 2 === 0 ? -1 : 1)) + (node.vy * time * 50) % 1) * height;

        const radius = Math.max(width, height) * (node.radius + Math.sin(time * 0.5 + i) * 0.1 + mouseEffect * 0.2);

        const col = colors[node.colorIdx];
        const alpha = (0.55 + Math.sin(time + i) * 0.1) * intensity;

        const grad = ctx.createRadialGradient(
          currentX,
          currentY,
          radius * 0.05,
          currentX,
          currentY,
          radius
        );

        grad.addColorStop(0, `rgba(${col.r}, ${col.g}, ${col.b}, ${alpha})`);
        grad.addColorStop(0.4, `rgba(${col.r}, ${col.g}, ${col.b}, ${alpha * 0.6})`);
        grad.addColorStop(0.8, `rgba(${col.r}, ${col.g}, ${col.b}, ${alpha * 0.15})`);
        grad.addColorStop(1, `rgba(${col.r}, ${col.g}, ${col.b}, 0)`);

        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);
      });

      // Swirling center eddy vortex simulation
      const vortexX = width * 0.5 + Math.sin(time * 0.8) * 80 + normMouseX * 60;
      const vortexY = height * 0.5 + Math.cos(time * 0.9) * 60 + normMouseY * 40;
      const vortexGrad = ctx.createRadialGradient(
        vortexX,
        vortexY,
        10,
        vortexX,
        vortexY,
        Math.max(width, height) * 0.55
      );
      vortexGrad.addColorStop(0, 'rgba(238, 98, 40, 0.45)');
      vortexGrad.addColorStop(0.4, 'rgba(82, 183, 136, 0.35)');
      vortexGrad.addColorStop(0.8, 'rgba(244, 162, 97, 0.15)');
      vortexGrad.addColorStop(1, 'rgba(254, 250, 224, 0)');

      ctx.fillStyle = vortexGrad;
      ctx.fillRect(0, 0, width, height);

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
    };
  }, [intensity, speed, interactive]);

  return (
    <canvas
      ref={canvasRef}
      className={`w-full h-full block pointer-events-none ${className}`}
      style={{ filter: 'blur(32px)', transform: 'scale(1.1)' }}
    />
  );
}
