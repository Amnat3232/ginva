import { useEffect, useRef } from "react";
import * as THREE from "three";
import Button from "../components/Button";
import gsap from "gsap";

const Starfield = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 50;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const starsGeometry = new THREE.BufferGeometry();
    const starsCount = 3000;
    const posArray = new Float32Array(starsCount * 3);

    for (let i = 0; i < starsCount * 3; i++) {
      posArray[i] = (Math.random() - 0.5) * 200;
    }

    starsGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(posArray, 3)
    );

    const starsMaterial = new THREE.PointsMaterial({
      size: 0.15,
      color: 0xffffff,
      transparent: true,
      opacity: 0.8,
    });

    const starsMesh = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(starsMesh);

    const animate = () => {
      requestAnimationFrame(animate);
      starsMesh.rotation.x += 0.0002;
      starsMesh.rotation.y += 0.0002;
      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 0,
        pointerEvents: "none",
      }}
    />
  );
};

const CTA = () => {
  useEffect(() => {
    gsap.fromTo(
      ".cta-content",
      { opacity: 0, y: 40 },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: "power3.out",
        scrollTrigger: {
          trigger: "#cta",
          start: "top 70%",
        },
      }
    );
  }, []);

  return (
    <section
      id="cta"
      style={{
        padding: "120px 20px",
        background: "linear-gradient(180deg, #0a0a0f 0%, #0f172a 100%)",
        position: "relative",
        overflow: "hidden",
        textAlign: "center",
      }}
    >
      <Starfield />

      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "600px",
          height: "600px",
          background:
            "radial-gradient(circle, rgba(245, 158, 11, 0.2) 0%, transparent 60%)",
          pointerEvents: "none",
        }}
      />

      <div
        className="cta-content"
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: "700px",
          margin: "0 auto",
        }}
      >
        <h2
          style={{
            fontFamily: "'Orbitron', sans-serif",
            fontSize: "clamp(36px, 6vw, 56px)",
            fontWeight: 700,
            color: "white",
            marginBottom: "25px",
            lineHeight: 1.2,
          }}
        >
          Ready to Unlock Your{" "}
          <span
            style={{
              background: "linear-gradient(135deg, #f59e0b 0%, #eab308 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Liquidity?
          </span>
        </h2>

        <p
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "clamp(16px, 2vw, 20px)",
            color: "rgba(255, 255, 255, 0.7)",
            marginBottom: "40px",
            maxWidth: "500px",
            margin: "0 auto 40px",
            lineHeight: 1.6,
          }}
        >
          Join thousands of users who are already leveraging their crypto assets
          for instant liquidity without selling.
        </p>

        <div
          style={{
            display: "flex",
            gap: "20px",
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <Button magnetic>Get Started Now</Button>
          <Button variant="outline">Read Documentation</Button>
        </div>

        <p
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "13px",
            color: "rgba(255, 255, 255, 0.4)",
            marginTop: "30px",
          }}
        >
          No KYC required • Start in seconds • Fully decentralized
        </p>
      </div>
    </section>
  );
};

export default CTA;
