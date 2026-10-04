import { useEffect, useRef } from "react";

const BURST_EXPAND_MS = 500;
const BURST_FADE_MS = 2000;
const BURST_LIFE_MS = BURST_EXPAND_MS + BURST_FADE_MS;
const TRAIL_LIFE_MS = 3200;
const TRAIL_MAX_POINTS = 180;

type BurstParticle = {
  angle: number;
  distance: number;
  hueOffset: number;
  phase: number;
  radius: number;
  wobble: number;
};

type InkBurst = {
  createdAt: number;
  hue: number;
  particles: BurstParticle[];
  seed: number;
  x: number;
  y: number;
};

type TrailPoint = {
  createdAt: number;
  hueOffset: number;
  radius: number;
  seed: number;
  x: number;
  y: number;
};

type InkTrail = {
  createdAt: number;
  hue: number;
  id: number;
  lastPointAt: number;
  points: TrailPoint[];
  seed: number;
};

type RenderPoint = {
  opacity: number;
  x: number;
  y: number;
};

const easeOutCubic = (value: number) => 1 - Math.pow(1 - value, 3);

function hsla(
  hue: number,
  saturation: number,
  lightness: number,
  alpha: number,
) {
  return `hsla(${hue}, ${saturation}%, ${lightness}%, ${alpha})`;
}

function randomHue() {
  return Math.round(Math.random() * 360);
}

function createBurst(x: number, y: number, now: number): InkBurst {
  const hue = randomHue();
  const particleCount = 15;
  const particles = Array.from({ length: particleCount }, (_, index) => {
    const spread = index / particleCount;

    return {
      angle: spread * Math.PI * 2 + (Math.random() - 0.5) * 0.62,
      distance: 18 + Math.random() * 64,
      hueOffset: (Math.random() - 0.5) * 48,
      phase: Math.random() * Math.PI * 2,
      radius: 18 + Math.random() * 30,
      wobble: 0.06 + Math.random() * 0.12,
    };
  });

  return {
    createdAt: now,
    hue,
    particles,
    seed: Math.random() * Math.PI * 2,
    x,
    y,
  };
}

function drawSoftBlob(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  hue: number,
  alpha: number,
  stretch = 1,
  rotation = 0,
) {
  if (radius <= 0.2 || alpha <= 0.004) {
    return;
  }

  const gradient = context.createRadialGradient(0, 0, 0, 0, 0, radius);
  gradient.addColorStop(0, hsla(hue, 100, 72, alpha * 0.9));
  gradient.addColorStop(0.34, hsla(hue, 100, 62, alpha * 0.7));
  gradient.addColorStop(0.68, hsla(hue, 100, 55, alpha * 0.27));
  gradient.addColorStop(1, hsla(hue, 100, 55, 0));

  context.save();
  context.translate(x, y);
  context.rotate(rotation);
  context.scale(stretch, 1 / stretch);
  context.fillStyle = gradient;
  context.shadowBlur = Math.min(38, radius * 0.52);
  context.shadowColor = hsla(hue, 100, 64, alpha * 0.82);
  context.beginPath();
  context.arc(0, 0, radius, 0, Math.PI * 2);
  context.fill();
  context.restore();
}

function drawBurst(
  context: CanvasRenderingContext2D,
  burst: InkBurst,
  now: number,
) {
  const age = now - burst.createdAt;

  if (age >= BURST_LIFE_MS) {
    return false;
  }

  const expansion = easeOutCubic(Math.min(age / BURST_EXPAND_MS, 1));
  const fadeProgress = Math.max(
    0,
    Math.min(1, (age - BURST_EXPAND_MS) / BURST_FADE_MS),
  );
  const fade = 1 - fadeProgress;
  const masterAlpha = Math.pow(fade, 1.15) * 0.72;

  if (masterAlpha <= 0.004) {
    return false;
  }

  context.save();
  context.globalCompositeOperation = "screen";

  const centerBreath = 1 + Math.sin(age * 0.008 + burst.seed) * 0.04;
  const centerRadius = 38 + 30 * expansion;

  drawSoftBlob(
    context,
    burst.x,
    burst.y,
    centerRadius * centerBreath,
    burst.hue,
    masterAlpha,
    1.08,
    burst.seed * 0.2,
  );

  for (const particle of burst.particles) {
    const drift = Math.sin(age * 0.0018 + particle.phase) * particle.wobble;
    const angle = particle.angle + drift;
    const distance =
      particle.distance *
      (0.12 + 0.88 * expansion) *
      (1 + Math.sin(age * 0.0025 + particle.phase) * 0.08);
    const x = burst.x + Math.cos(angle) * distance;
    const y = burst.y + Math.sin(angle) * distance;
    const radius =
      particle.radius *
      (0.32 + expansion * 0.78) *
      (1 + Math.sin(age * 0.006 + particle.phase) * 0.06);
    const stretch = 0.78 + Math.sin(particle.phase + age * 0.0012) * 0.3;

    drawSoftBlob(
      context,
      x,
      y,
      radius,
      burst.hue + particle.hueOffset,
      masterAlpha * 0.72,
      stretch,
      particle.angle,
    );
  }

  for (let index = 0; index < 9; index += 1) {
    const angle = burst.seed + index * 2.399 + age * 0.00065;
    const distance = (28 + ((index * 37) % 58)) * (0.28 + expansion * 0.72);
    const dropRadius = 2.5 + ((index * 11) % 7) * expansion;

    drawSoftBlob(
      context,
      burst.x + Math.cos(angle) * distance,
      burst.y + Math.sin(angle) * distance,
      dropRadius,
      burst.hue + (index % 3) * 19 - 19,
      masterAlpha * (0.72 - index * 0.035),
    );
  }

  context.restore();
  return true;
}

function getRenderTrailPoint(
  trail: InkTrail,
  index: number,
  now: number,
): RenderPoint {
  const points = trail.points;
  const point = points[index];
  const previous = points[Math.max(0, index - 1)];
  const next = points[Math.min(points.length - 1, index + 1)];
  const tangentX = next.x - previous.x;
  const tangentY = next.y - previous.y;
  const tangentLength = Math.hypot(tangentX, tangentY) || 1;
  const normalX = -tangentY / tangentLength;
  const normalY = tangentX / tangentLength;
  const age = now - point.createdAt;
  const amplitude = Math.min(18, 1.5 + age * 0.006);
  const wave =
    Math.sin(age * 0.0075 + index * 0.78 + trail.seed) * amplitude +
    Math.sin(age * 0.0032 + index * 0.31 + point.seed) * amplitude * 0.48;
  const longitudinalWave =
    Math.sin(age * 0.004 + index * 0.45 + point.seed * 2) * amplitude * 0.26;
  const fadeStart = 650;
  const opacity =
    age <= fadeStart
      ? 1
      : Math.max(0, 1 - (age - fadeStart) / (TRAIL_LIFE_MS - fadeStart));

  return {
    opacity,
    x:
      point.x +
      normalX * wave +
      (tangentX / tangentLength) * longitudinalWave,
    y:
      point.y +
      normalY * wave +
      (tangentY / tangentLength) * longitudinalWave,
  };
}

function drawTrail(
  context: CanvasRenderingContext2D,
  trail: InkTrail,
  now: number,
) {
  trail.points = trail.points.filter(
    (point) => now - point.createdAt < TRAIL_LIFE_MS,
  );

  if (trail.points.length < 2) {
    return trail.points.length > 0;
  }

  const renderPoints = trail.points.map((_, index) =>
    getRenderTrailPoint(trail, index, now),
  );

  context.save();
  context.globalCompositeOperation = "screen";
  context.lineCap = "round";
  context.lineJoin = "round";

  context.beginPath();
  context.moveTo(renderPoints[0].x, renderPoints[0].y);

  for (let index = 1; index < renderPoints.length - 1; index += 1) {
    const point = renderPoints[index];
    const next = renderPoints[index + 1];
    context.quadraticCurveTo(
      point.x,
      point.y,
      (point.x + next.x) * 0.5,
      (point.y + next.y) * 0.5,
    );
  }

  const lastPoint = renderPoints[renderPoints.length - 1];
  context.lineTo(lastPoint.x, lastPoint.y);
  context.strokeStyle = hsla(trail.hue, 100, 60, 0.18);
  context.lineWidth = 18;
  context.shadowBlur = 24;
  context.shadowColor = hsla(trail.hue, 100, 62, 0.78);
  context.stroke();

  for (let index = 1; index < renderPoints.length; index += 1) {
    const previous = renderPoints[index - 1];
    const point = renderPoints[index];
    const sourcePoint = trail.points[index];
    const opacity = Math.min(previous.opacity, point.opacity);

    if (opacity <= 0.01) {
      continue;
    }

    context.beginPath();
    context.moveTo(previous.x, previous.y);
    context.lineTo(point.x, point.y);
    context.strokeStyle = hsla(
      trail.hue + sourcePoint.hueOffset,
      100,
      64 + Math.sin(sourcePoint.seed + now * 0.004) * 7,
      opacity * 0.76,
    );
    context.lineWidth = sourcePoint.radius * (0.48 + opacity * 0.52);
    context.shadowBlur = 10;
    context.shadowColor = hsla(
      trail.hue + sourcePoint.hueOffset,
      100,
      64,
      opacity * 0.52,
    );
    context.stroke();

    if (index % 7 === 0) {
      drawSoftBlob(
        context,
        point.x,
        point.y,
        sourcePoint.radius * 0.9,
        trail.hue + sourcePoint.hueOffset,
        opacity * 0.28,
      );
    }
  }

  context.restore();
  return true;
}

export function LiquidInkEffect() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const burstsRef = useRef<InkBurst[]>([]);
  const trailsRef = useRef<InkTrail[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const context = canvas.getContext("2d", { alpha: true });

    if (!context) {
      return;
    }

    const activePointers = new Map<number, InkTrail>();
    let animationFrame = 0;
    let dpr = 1;
    let nextTrailId = 1;
    let viewportWidth = window.innerWidth;
    let viewportHeight = window.innerHeight;

    const resizeCanvas = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      viewportWidth = window.innerWidth;
      viewportHeight = window.innerHeight;
      canvas.width = Math.round(viewportWidth * dpr);
      canvas.height = Math.round(viewportHeight * dpr);
      canvas.style.width = `${viewportWidth}px`;
      canvas.style.height = `${viewportHeight}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.clearRect(0, 0, viewportWidth, viewportHeight);
    };

    const renderFrame = (now: number) => {
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.clearRect(0, 0, viewportWidth, viewportHeight);

      burstsRef.current = burstsRef.current.filter((burst) =>
        drawBurst(context, burst, now),
      );
      trailsRef.current = trailsRef.current.filter((trail) =>
        drawTrail(context, trail, now),
      );

      animationFrame = window.requestAnimationFrame(renderFrame);
    };

    const addTrailPoint = (trail: InkTrail, x: number, y: number, now: number) => {
      const lastPoint = trail.points[trail.points.length - 1];

      if (lastPoint && Math.hypot(x - lastPoint.x, y - lastPoint.y) < 2.4) {
        return;
      }

      trail.points.push({
        createdAt: now,
        hueOffset: (Math.random() - 0.5) * 34,
        radius: 4.5 + Math.random() * 5.5,
        seed: Math.random() * Math.PI * 2,
        x,
        y,
      });
      trail.lastPointAt = now;

      if (trail.points.length > TRAIL_MAX_POINTS) {
        trail.points.splice(0, trail.points.length - TRAIL_MAX_POINTS);
      }
    };

    const handlePointerDown = (event: PointerEvent) => {
      if (event.pointerType === "mouse" && event.button !== 0) {
        return;
      }

      const now = performance.now();
      const x = event.clientX;
      const y = event.clientY;
      burstsRef.current.push(createBurst(x, y, now));

      const trail: InkTrail = {
        createdAt: now,
        hue: randomHue(),
        id: nextTrailId,
        lastPointAt: now,
        points: [],
        seed: Math.random() * Math.PI * 2,
      };

      nextTrailId += 1;
      addTrailPoint(trail, x, y, now);
      activePointers.set(event.pointerId, trail);
      trailsRef.current.push(trail);
    };

    const handlePointerMove = (event: PointerEvent) => {
      const trail = activePointers.get(event.pointerId);

      if (!trail) {
        return;
      }

      addTrailPoint(trail, event.clientX, event.clientY, performance.now());
    };

    const endPointer = (event: PointerEvent) => {
      const trail = activePointers.get(event.pointerId);

      if (!trail) {
        return;
      }

      trail.lastPointAt = performance.now();
      activePointers.delete(event.pointerId);
    };

    const preventNativeDrag = (event: Event) => {
      if (activePointers.size > 0) {
        event.preventDefault();
      }
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    window.addEventListener("pointerdown", handlePointerDown, { passive: true });
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerup", endPointer, { passive: true });
    window.addEventListener("pointercancel", endPointer, { passive: true });
    window.addEventListener("selectstart", preventNativeDrag);
    window.addEventListener("dragstart", preventNativeDrag);
    animationFrame = window.requestAnimationFrame(renderFrame);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", endPointer);
      window.removeEventListener("pointercancel", endPointer);
      window.removeEventListener("selectstart", preventNativeDrag);
      window.removeEventListener("dragstart", preventNativeDrag);
      activePointers.clear();
      burstsRef.current = [];
      trailsRef.current = [];
      context.clearRect(0, 0, viewportWidth, viewportHeight);
    };
  }, []);

  return (
    <canvas
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 z-[2147483647] block select-none"
      ref={canvasRef}
    />
  );
}
