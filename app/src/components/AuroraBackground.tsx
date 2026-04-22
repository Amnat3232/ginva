import { useEffect, useRef } from 'react';
import * as THREE from 'three';

const vertexShader = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 1.0);
}
`;

const fragmentShader = `
precision mediump float;
varying vec2 vUv;
uniform float u_time;

float random(vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
}

float noise(vec2 st) {
  vec2 i = floor(st);
  vec2 f = fract(st);
  float a = random(i);
  float b = random(i + vec2(1.0, 0.0));
  float c = random(i + vec2(0.0, 1.0));
  float d = random(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

void main() {
  vec2 st = vUv;
  float n1 = noise(st * 3.0 + u_time * 0.05);
  float n2 = noise(st * 6.0 - u_time * 0.08);
  float n3 = noise(st * 12.0 + u_time * 0.02);
  float finalNoise = n1 * 0.5 + n2 * 0.3 + n3 * 0.2;

  vec3 col1 = vec3(0.07, 0.10, 0.075);
  vec3 col2 = vec3(0.165, 0.20, 0.165);
  vec3 col3 = vec3(0.24, 0.30, 0.23);
  vec3 accentColor = vec3(0.98, 0.41, 0.29);

  vec3 color = mix(col1, col2, finalNoise);
  color = mix(color, col3, smoothstep(0.3, 0.7, vUv.y + finalNoise * 0.2));

  float shimmer = noise(st * 8.0 + u_time * 0.5) * 0.05;
  color = mix(color, accentColor, shimmer * smoothstep(0.4, 0.9, vUv.y));

  gl_FragColor = vec4(color, 1.0);
}
`;

export default function AuroraBackground() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: { u_time: { value: 0.0 } },
    });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    let frame: number;
    const animate = () => {
      material.uniforms.u_time.value += 0.005;
      renderer.render(scene, camera);
      frame = requestAnimationFrame(animate);
    };
    animate();

    const handleResize = () => {
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-0 pointer-events-none"
    />
  );
}
