import { useEffect, useState } from "react";

export default function TurnstileGate() {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load Cloudflare Turnstile script
    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
    script.async = true;
    script.onload = () => {
      // @ts-ignore
      window.turnstile.render("#cf-turnstile", {
        sitekey: "0x4AAAAAACCDHi8H3fmnNIcf", // <-- replace with your site key
        callback: async (token: string) => {
          setLoading(true);
          try {
            const res = await fetch("https://miratlbayan.dmin138p.workers.dev", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ token }),
            });

            const data = await res.json();

            if (data.success) {
              localStorage.setItem("turnstile_passed", "true");
              setTimeout(() => {
                window.location.href = "/";
              }, 500); // slight delay for UX
            } else {
              alert("Verification failed. Try again.");
              window.location.reload();
            }
          } catch (err) {
            alert("Error verifying Turnstile. Try again.");
            window.location.reload();
          }
        },
      });
    };
    document.body.appendChild(script);
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
      {loading && (
        <div style={{ marginTop: "20px" }}>
          <span>Verifying... ⏳</span>
        </div>
      )}
    </div>
  );
}
