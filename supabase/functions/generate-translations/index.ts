import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sourceText, targetLanguage, languageName } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a professional translator. Translate the provided JSON content to ${languageName}. 
            Maintain the exact JSON structure and keys - only translate the string values. 
            Keep the translation natural and culturally appropriate. 
            Return ONLY the translated JSON, no additional text.`
          },
          {
            role: "user",
            content: `Translate this JSON to ${languageName} (${targetLanguage}):\n\n${JSON.stringify(sourceText, null, 2)}`
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Translation failed", details: errorText }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const translatedText = data.choices[0]?.message?.content;

    if (!translatedText) {
      throw new Error("No translation received");
    }

    // Try to parse the translation as JSON
    let translatedJson;
    try {
      // Remove markdown code blocks if present
      const cleanedText = translatedText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      translatedJson = JSON.parse(cleanedText);
    } catch (e) {
      console.error("Failed to parse translation:", translatedText);
      throw new Error("Invalid JSON in translation response");
    }

    return new Response(
      JSON.stringify({ translation: translatedJson }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Translation error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});