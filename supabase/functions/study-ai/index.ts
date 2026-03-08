import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, type } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompts: Record<string, string> = {
      'sample-paper': `You are a CBSE Class 12 expert examiner. Generate papers exactly following CBSE 2024-25 board exam pattern and marking scheme. Include proper header with subject name, time, marks and instructions. Format with clear section headers (Section A, B, C, D). Use markdown formatting with ## for sections, **bold** for important text, and numbered questions.`,
      'worksheet': `You are a CBSE Class 12 Commerce expert teacher. Generate focused chapter worksheets with varied question types. For Accountancy, include proper journal entries, ledger problems, balance sheet problems with realistic numbers. For Economics, include diagram-based questions and numerical problems. Use markdown formatting.`,
      'revision-notes': `You are a CBSE Class 12 Commerce expert teacher. Create concise, exam-focused revision notes. Include: chapter overview (3-4 lines), key concepts as bullet points, important definitions (use **bold**), formulas with explanations, common exam mistakes to avoid, PYQ trends, and 5 most likely exam questions. Use clean markdown formatting.`,
      'mcq': `You are a CBSE Class 12 examiner. Generate MCQs strictly following CBSE pattern including assertion-reason type. Return ONLY valid JSON array. Each item must have: "question" (string), "options" (array of 4 strings), "correctAnswer" (0-3 index), "explanation" (string), "type" ("regular" or "assertion-reason"). Do not include any text outside the JSON array.`,
      'pyq': `You are a CBSE Class 12 expert. Generate questions in the exact style and pattern of CBSE board Previous Year Questions. Include competency-based questions and case studies matching CBSE 2024-25 pattern. Use markdown formatting.`,
      'answer-key': `You are a CBSE Class 12 expert examiner. Generate detailed answer keys with step-by-step solutions, marking scheme breakdowns, and examiner tips. Use markdown formatting.`,
    };

    const systemPrompt = systemPrompts[type] || systemPrompts['sample-paper'];
    const isStreaming = type !== 'mcq';

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: isStreaming,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI usage limit reached. Please add credits to continue." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI generation failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (isStreaming) {
      return new Response(response.body, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    } else {
      const data = await response.json();
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (e) {
    console.error("study-ai error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
