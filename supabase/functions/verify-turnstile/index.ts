import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  try {
    const { token } = await req.json();
    const secret = Deno.env.get("TURNSTILE_SECRET_KEY");
    
    if (!secret) {
      throw new Error("TURNSTILE_SECRET_KEY not configured");
    }

    const result = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        body: new URLSearchParams({
          secret,
          response: token,
        }),
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      }
    );

    const data = await result.json();
    return new Response(JSON.stringify({ success: data.success }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return new Response(JSON.stringify({ success: false }), {
      headers: { "Content-Type": "application/json" },
    });
  }
});
