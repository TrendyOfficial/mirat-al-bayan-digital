import { useState } from "react";
import { getTurnstileToken } from "@/utils/turnstile";

export default function TurnstileGate() {
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    setLoading(true);
    try {
      const token = await getTurnstileToken("import { useEffect, useState } from "react";

export default function TurnstileGate() {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load Cloudflare Turnstile script
    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
    script.async = true;
    document.body.appendChild(script);

    script.onload = () => {
      // Render the visible Turnstile widget
      // @ts-ignore
      window.turnstile.render("#cf-turnstile", {
        sitekey: "0x4AAAAAACCDHi8H3fmnNIcf", // Replace with your site key
        callback: async (token: string) => {
          setLoading(true); // optional spinner
          try {
            const res = await fetch(
              "https://miratlbayan.dmin138p.workers.dev", // Your Worker URL
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token }),
              }
            );
            const data = await res.json();

            if (data.success) {
              localStorage.setItem("turnstile_passed", "true");
              setTimeout(() => {
                window.location.href = "/";
              }, 500); // small delay to show green check
            } else {
              alert("Verification failed. Try again.");
              window.location.reload();
            }
          } catch (err) {
            alert("Error verifying Turnstile. Try again.");
            window.location.reload();
          } finally {
            setLoading(false);
          }
        },
      });
    };
  }, []);

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <h2></h2>

      {/* This is where the Cloudflare square appears */}
      <div id="cf-turnstile" style={{ marginTop: "20px" }}></div>

      {loading && (
        <div style={{ marginTop: "20px" }}>
          <span>Verifying... ⏳</span>
        </div>
      )}
    </div>
  );
}
");

      const res = await fetch("https://miratlbayan.dmin138p.workers.dev", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const data = await res.json();

      if (data.success) {
        localStorage.setItem("turnstile_passed", "true");
        setTimeout(() => (window.location.href = "/"), 300);
      } else {
        alert("Verification failed. Try again.");
      }
    } catch (err) {
      alert("Error verifying Turnstile. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <h2>Please verify you are human</h2>
      <button
        style={{ marginTop: "20px", padding: "10px 20px", cursor: "pointer" }}
        onClick={handleVerify}
        disabled={loading}
      >
        {loading ? "Verifying..." : "Verify"}
      </button>
    </div>
  );
}
