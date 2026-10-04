import { useEffect, useRef } from "react";

declare global {
  interface Window {
    THREE: any;
  }
}

const POINT_COUNT = 6000;
const CLOUD_SIZE = 1200;

export function NebulaBackground() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const THREE = window.THREE;

    if (!container || !THREE) {
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.setAttribute("aria-hidden", "true");
    container.appendChild(canvas);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x02050d);

    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      1,
      3000,
    );
    camera.position.z = 220;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
    });
    renderer.setClearColor(0x02050d, 1);

    const positions = new Float32Array(POINT_COUNT * 3);

    for (let index = 0; index < positions.length; index += 3) {
      positions[index] = (Math.random() - 0.5) * CLOUD_SIZE;
      positions[index + 1] = (Math.random() - 0.5) * CLOUD_SIZE;
      positions[index + 2] = (Math.random() - 0.5) * CLOUD_SIZE;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: 0x4b9cff,
      size: 1.4,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.78,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const particleCloud = new THREE.Points(geometry, material);
    scene.add(particleCloud);

    const resize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      camera.aspect = width / height;
      camera.updateProjectionMatrix();

      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(width, height);
    };

    let animationFrame = 0;

    const animate = () => {
      animationFrame = window.requestAnimationFrame(animate);

      particleCloud.rotation.y += 0.0012;
      particleCloud.rotation.x += 0.0004;

      renderer.render(scene, camera);
    };

    window.addEventListener("resize", resize);
    resize();
    animate();

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", resize);

      geometry.dispose();
      material.dispose();
      renderer.dispose();
      canvas.remove();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="nebula-background pointer-events-none fixed inset-0 z-0 overflow-hidden"
    />
  );
}
