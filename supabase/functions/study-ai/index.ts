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
      'sample-paper': `You are a CBSE Class 12 board exam paper setter. You must respond with ONLY valid JSON. No text before or after. No markdown. No backticks. No explanation. Just the raw JSON object starting with { and ending with }.

Generate papers STRICTLY based on previous year CBSE board questions from 2018-2024, frequently repeated question patterns, and official CBSE sample papers. Never invent new questions — only use authentic CBSE board exam style questions and patterns.

Your response must be this exact JSON structure:
{
  "title": "CBSE Sample Question Paper 2024-25",
  "subject": "Subject Name",
  "class": "XII",
  "time": "3 Hours",
  "marks": "80",
  "instructions": [
    "All questions are compulsory.",
    "Question numbers 1-16 carry 1 mark each.",
    "Question numbers 17-20 carry 3 marks each.",
    "Question numbers 21-26 carry 4 marks each.",
    "Question numbers 27-30 carry 6 marks each.",
    "There is no overall choice. However, internal choice has been provided."
  ],
  "sections": [
    {
      "name": "Section A",
      "subtitle": "Multiple Choice Questions",
      "instruction": "Each question carries 1 mark",
      "questions": [
        {
          "number": 1,
          "text": "Question text here",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "marks": 1,
          "type": "mcq",
          "answer": "Correct option letter and brief explanation"
        },
        {
          "number": 2,
          "text": "Question text here",
          "marks": 3,
          "type": "short",
          "hasChoice": true,
          "orQuestion": "Alternative question text",
          "answer": "Model answer text"
        }
      ]
    }
  ]
}`,
      'worksheet': `You are a CBSE Class 12 Commerce expert teacher. Generate focused chapter worksheets with varied question types. For Accountancy, include proper journal entries, ledger problems, balance sheet problems with realistic numbers. For Economics, include diagram-based questions and numerical problems. Use markdown formatting.`,
      'revision-notes': `You are a CBSE Class 12 Commerce expert teacher. You must respond with ONLY valid JSON. No text before or after. No markdown. No backticks. No explanation. Just the raw JSON object starting with { and ending with }.

Your response must be this exact JSON structure:
{
  "chapter": "Chapter Name",
  "subject": "Subject Name",
  "overview": "2-3 line chapter summary",
  "key_concepts": [
    { "title": "Concept name", "explanation": "Clear explanation in 2-3 sentences" }
  ],
  "definitions": [
    { "term": "Term name", "definition": "Precise definition text" }
  ],
  "formulas": [
    { "name": "Formula name", "formula": "Formula expression", "explanation": "What it means and when to use" }
  ],
  "common_mistakes": ["Mistake 1 description", "Mistake 2 description"],
  "pyq_trends": "What types of questions this chapter produces in CBSE boards, which years, frequency",
  "likely_questions": ["Most likely question 1", "Most likely question 2", "Most likely question 3", "Most likely question 4", "Most likely question 5"]
}`,
      'mcq': `You are a CBSE Class 12 examiner. Generate MCQs strictly following CBSE pattern including assertion-reason type. Return ONLY valid JSON array. Each item must have: "question" (string), "options" (array of 4 strings), "correctAnswer" (0-3 index), "explanation" (string), "type" ("regular" or "assertion-reason"). Do not include any text outside the JSON array.`,
      'pyq': `You are a CBSE Class 12 expert. Generate questions in the exact style and pattern of CBSE board Previous Year Questions. Include competency-based questions and case studies matching CBSE 2024-25 pattern. Use markdown formatting.`,
      'answer-key': `You are a CBSE Class 12 expert examiner. Generate detailed answer keys with step-by-step solutions, marking scheme breakdowns, and examiner tips. Use markdown formatting.`,
    };

    const systemPrompt = systemPrompts[type] || systemPrompts['sample-paper'];
    // sample-paper and revision-notes now use JSON (non-streaming), worksheet/pyq/answer-key still stream
    const jsonTypes = ['mcq', 'sample-paper', 'revision-notes'];
    const isStreaming = !jsonTypes.includes(type);

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
