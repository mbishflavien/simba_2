import React, { useRef, useEffect } from 'react';

interface FluidGradientMeshProps {
  className?: string;
  intensity?: number;
  speed?: number;
  interactive?: boolean;
  theme?: 'light' | 'dark' | 'auto';
  blurAmount?: string;
}

/**
 * High-performance, interactive WebGL/2D Canvas Fluid Gradient Mesh
 * Creates smooth organic marble/fluid swirls in emerald green, warm orange, amber, and cream.
 * Reacts dynamically to mouse coordinates with natural momentum and spring physics.
 */
export default function FluidGradientMesh({
  className = '',
  intensity = 1.0,
  speed = 1.0,
  interactive = true,
  theme = 'auto',
  blurAmount = '36px',
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

    // Fluid swirl particles / color control nodes matching Simba Rwanda palette
    const isDarkMode = theme === 'dark' || (theme === 'auto' && document.documentElement.classList.contains('dark'));

    const colors = isDarkMode
      ? [
          { r: 255, g: 107, b: 0 },   // Simba Brand Vibrant Orange
          { r: 245, g: 158, b: 11 },  // Golden Amber
          { r: 16, g: 185, b: 129 },  // Fresh Emerald Green
          { r: 234, g: 88, b: 12 },   // Deep Tangerine
          { r: 20, g: 20, b: 24 },    // Deep Obsidian
        ]
      : [
          { r: 255, g: 107, b: 0 },   // Vibrant Simba Orange
          { r: 245, g: 158, b: 11 },  // Warm Golden Amber
          { r: 16, g: 185, b: 129 },  // Fresh Emerald Green
          { r: 5, g: 150, b: 105 },   // Lush Herb Green
          { r: 254, g: 243, b: 199 }, // Warm Ivory Cream
        ];

    // Swirl nodes that drift in harmony
    const nodes = [
      { x: 0.25, y: 0.35, vx: 0.0006, vy: 0.0004, radius: 0.7, colorIdx: 0 },
      { x: 0.75, y: 0.3,  vx: -0.0005, vy: 0.0007, radius: 0.75, colorIdx: 1 },
      { x: 0.5,  y: 0.75, vx: 0.0008, vy: -0.0005, radius: 0.7, colorIdx: 2 },
      { x: 0.2,  y: 0.8,  vx: -0.0004, vy: -0.0006, radius: 0.65, colorIdx: 3 },
      { x: 0.8,  y: 0.85, vx: 0.0005, vy: 0.0003, radius: 0.8, colorIdx: 4 },
      { x: 0.5,  y: 0.2,  vx: 0.0003, vy: -0.0004, radius: 0.65, colorIdx: 0 },
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

      time += 0.007 * speed;

      // Smooth mouse lerping
      currentMouse.x += (targetMouse.x - currentMouse.x) * 0.05;
      currentMouse.y += (targetMouse.y - currentMouse.y) * 0.05;

      const normMouseX = (currentMouse.x / (width || 1) - 0.5) * 2;
      const normMouseY = (currentMouse.y / (height || 1) - 0.5) * 2;

      // Base background fill
      ctx.clearRect(0, 0, width, height);

      // Render layered radial gradient nodes to simulate marble fluid shear
      ctx.globalCompositeOperation = 'source-over';

      nodes.forEach((node, i) => {
        // Organic sinusoidal drifting with mouse deflection
        const mouseDist = Math.hypot(
          (node.x * width) - currentMouse.x,
          (node.y * height) - currentMouse.y
        );
        const mouseEffect = Math.max(0, 1 - mouseDist / (Math.max(width, height) * 0.75)) * intensity;

        const currentX = (node.x + Math.sin(time + i * 1.3) * 0.18 + (normMouseX * 0.08 * (i % 2 === 0 ? 1 : -1)) + (node.vx * time * 50) % 1) * width;
        const currentY = (node.y + Math.cos(time + i * 1.7) * 0.18 + (normMouseY * 0.08 * (i % 2 === 0 ? -1 : 1)) + (node.vy * time * 50) % 1) * height;

        const radius = Math.max(width, height) * (node.radius + Math.sin(time * 0.5 + i) * 0.12 + mouseEffect * 0.2);

        const col = colors[node.colorIdx];
        const alpha = (0.5 + Math.sin(time + i) * 0.12) * intensity;

        const grad = ctx.createRadialGradient(
          currentX,
          currentY,
          radius * 0.04,
          currentX,
          currentY,
          radius
        );

        grad.addColorStop(0, `rgba(${col.r}, ${col.g}, ${col.b}, ${alpha})`);
        grad.addColorStop(0.35, `rgba(${col.r}, ${col.g}, ${col.b}, ${alpha * 0.65})`);
        grad.addColorStop(0.7, `rgba(${col.r}, ${col.g}, ${col.b}, ${alpha * 0.2})`);
        grad.addColorStop(1, `rgba(${col.r}, ${col.g}, ${col.b}, 0)`);

        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);
      });

      // Swirling center eddy vortex simulation
      const vortexX = width * 0.5 + Math.sin(time * 0.8) * 90 + normMouseX * 60;
      const vortexY = height * 0.5 + Math.cos(time * 0.9) * 70 + normMouseY * 50;
      const vortexGrad = ctx.createRadialGradient(
        vortexX,
        vortexY,
        15,
        vortexX,
        vortexY,
        Math.max(width, height) * 0.6
      );
      vortexGrad.addColorStop(0, `rgba(255, 107, 0, ${0.4 * intensity})`);
      vortexGrad.addColorStop(0.4, `rgba(16, 185, 129, ${0.3 * intensity})`);
      vortexGrad.addColorStop(0.8, `rgba(245, 158, 11, ${0.15 * intensity})`);
      vortexGrad.addColorStop(1, 'rgba(255, 107, 0, 0)');

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
  }, [intensity, speed, interactive, theme]);

  return (
    <canvas
      ref={canvasRef}
      className={`w-full h-full block pointer-events-none ${className}`}
      style={{ filter: `blur(${blurAmount})`, transform: 'scale(1.1)' }}
    />
  );
}
