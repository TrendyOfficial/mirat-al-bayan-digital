import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title, content, language } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log('Generating PDF for:', title);

    const prompt = language === 'ar' 
      ? `قم بإنشاء محتوى PDF منسق بشكل جميل باللغة العربية للمقالة التالية. قم بتضمين العنوان والمحتوى بتنسيق مناسب للطباعة:

العنوان: ${title}

المحتوى:
${content}

قم بإرجاع HTML منسق جيداً مع CSS مضمن مناسب لتحويله إلى PDF. استخدم خطوط عربية مناسبة وتأكد من أن النص من اليمين إلى اليسار.`
      : `Create a beautifully formatted PDF content in English for the following article. Include the title and content in a print-ready format:

Title: ${title}

Content:
${content}

Return well-formatted HTML with inline CSS suitable for conversion to PDF. Use appropriate fonts and ensure proper styling.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'You are a PDF content formatter. Generate clean, print-ready HTML with inline CSS.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Payment required. Please add credits to your workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error('AI Gateway error');
    }

    const data = await response.json();
    const htmlContent = data.choices[0].message.content;

    console.log('PDF HTML generated successfully');

    return new Response(
      JSON.stringify({ html: htmlContent }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in generate-pdf function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});