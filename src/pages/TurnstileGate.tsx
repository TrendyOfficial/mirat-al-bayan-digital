import { useState } from "react";
import { getTurnstileToken } from "@/utils/turnstile";

export default function TurnstileGate() {
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    setLoading(true);
    try {
      const token = await getTurnstileToken("0x4AAAAAACCDHi8H3fmnNIcf");

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
