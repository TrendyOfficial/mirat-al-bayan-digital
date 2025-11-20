import { useEffect, useState } from "react";

export default function TurnstileGate() {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
    script.async = true;
    document.body.appendChild(script);

    script.onload = () => {
      // @ts-ignore
      window.turnstile.render("#cf-turnstile", {
        sitekey: "0x4AAAAAACCDHi8H3fmnNIcf",
        callback: async (token: string) => {
          setLoading(true);
          try {
            const res = await fetch(
              "https://miratlbayan.dmin138p.workers.dev",
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token }),
              }
            );
            const data = await res.json();

            if (data.success) {
              localStorage.setItem("turnstile_passed", "true");
              window.location.href = "/";
            } else {
              alert("Verification failed. Try again.");
            }
          } catch (err) {
            alert("Error verifying Turnstile. Try again.");
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
      <h2>Please verify you are human</h2>
      <div id="cf-turnstile" style={{ marginTop: "20px" }}></div>
      {loading && <span>Verifying... ⏳</span>}
    </div>
  );
}
