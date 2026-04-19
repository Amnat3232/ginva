import Button from "../components/Button";

const CTA = () => {
  return (
    <section
      id="cta"
      style={{
        padding: "120px 20px",
        background: "linear-gradient(180deg, #0F172A 0%, #020617 100%)",
        position: "relative",
        overflow: "hidden",
        textAlign: "center",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "600px",
          height: "600px",
          background: "radial-gradient(circle, rgba(245, 158, 11, 0.15) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: "700px",
          margin: "0 auto",
        }}
      >
        <h2
          style={{
            fontFamily: "'IBM Plex Sans', sans-serif",
            fontSize: "clamp(32px, 5vw, 48px)",
            fontWeight: 700,
            color: "#F8FAFC",
            marginBottom: "24px",
            lineHeight: 1.2,
          }}
        >
          Ready to Unlock Your{" "}
          <span
            style={{
              color: "#F59E0B",
            }}
          >
            Liquidity?
          </span>
        </h2>

        <p
          style={{
            fontFamily: "'IBM Plex Sans', sans-serif",
            fontSize: "clamp(16px, 2vw, 18px)",
            color: "rgba(248, 250, 252, 0.7)",
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
            gap: "16px",
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <Button>Get Started Now</Button>
          <Button variant="secondary">Read Documentation</Button>
        </div>

        <p
          style={{
            fontFamily: "'IBM Plex Sans', sans-serif",
            fontSize: "13px",
            color: "rgba(248, 250, 252, 0.5)",
            marginTop: "32px",
          }}
        >
          No KYC required • Start in seconds • Fully decentralized
        </p>
      </div>
    </section>
  );
};

export default CTA;
