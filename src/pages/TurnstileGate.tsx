import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function TurnstileGate() {
  const navigate = useNavigate();
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  useEffect(() => {
    if (token) verifyToken(token);
  }, [token]);

  const verifyToken = async (token: string) => {
    const res = await fetch("/api/verify-turnstile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });

    const data = await res.json();

    if (data.success) {
      localStorage.setItem("turnstile_passed", "true");
      // ⬅️ FIXED REDIRECT
      window.location.href = "/"; 
    } else {
      alert("Verification failed. Try again.");
      window.location.reload();
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

      <div
        className="cf-challenge"
        data-sitekey="0x4AAAAAACCDHi8H3fmnNIcf"
        data-callback={(token: string) => setToken(token)}
        style={{ marginTop: "20px" }}
      ></div>
    </div>
  );
}
