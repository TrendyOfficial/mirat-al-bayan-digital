/**
 * Loads Turnstile script and returns a promise for the token
 */
export async function getTurnstileToken(siteKey: string, timeout = 30000): Promise<string> {
  if (typeof window === "undefined") throw new Error("Browser environment required");

  // Load script
  if (!(window as any).turnstile) {
    await new Promise<void>((resolve, reject) => {
      const s = document.createElement("script");
      s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error("Failed to load Turnstile"));
      document.head.appendChild(s);
    });
  }

  // Container for widget
  const container = document.createElement("div");
  container.style.position = "absolute";
  container.style.left = "-9999px";
  document.body.appendChild(container);

  return new Promise<string>((resolve, reject) => {
    let timeoutId = setTimeout(() => {
      cleanup();
      reject(new Error("Turnstile verification timed out"));
    }, timeout);

    const cleanup = () => {
      clearTimeout(timeoutId);
      if (container.parentNode) container.parentNode.removeChild(container);
    };

    try {
      const widgetId = (window as any).turnstile.render(container, {
        sitekey: siteKey,
        callback: (token: string) => {
          cleanup();
          resolve(token);
        },
        "error-callback": () => {
          cleanup();
          reject(new Error("Turnstile error"));
        },
        "expired-callback": () => {
          cleanup();
          reject(new Error("Turnstile expired"));
        },
      });
    } catch (err) {
      cleanup();
      reject(err);
    }
  });
}
