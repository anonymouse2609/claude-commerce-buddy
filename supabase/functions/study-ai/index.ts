import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, type, maxTokens } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompts: Record<string, string> = {
      'sample-paper': `You are a CBSE Class 12 board exam paper setter. You must respond with ONLY valid JSON. No text before or after. No markdown. No backticks. No explanation. Just the raw JSON object starting with { and ending with }.

Generate papers STRICTLY based on previous year CBSE board questions from 2018-2024. Never invent new questions — only use authentic CBSE board exam style questions and patterns.

Your response must be this exact JSON structure:
{
  "title": "CBSE Sample Question Paper 2024-25",
  "subject": "Subject Name",
  "class": "XII",
  "time": "3 Hours",
  "marks": "80",
  "instructions": ["instruction1", "instruction2"],
  "sections": [
    {
      "name": "Section A",
      "subtitle": "Multiple Choice Questions",
      "instruction": "Each question carries 1 mark",
      "questions": [
        {
          "number": 1,
          "text": "Question text",
          "options": ["A", "B", "C", "D"],
          "marks": 1,
          "type": "mcq",
          "answer": "Answer with explanation"
        },
        {
          "number": 17,
          "text": "Question text",
          "marks": 3,
          "type": "short",
          "hasChoice": true,
          "orQuestion": "Alternative question",
          "answer": "Model answer"
        }
      ]
    }
  ]
}

CRITICAL: Generate EVERY question number consecutively. Do NOT skip any question numbers. Include ALL questions specified in the user prompt.`,
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
      'mcq': `You are a CBSE Class 12 examiner. You must respond with ONLY valid JSON. No text before or after. No markdown. No backticks. No explanation. Just the raw JSON array starting with [ and ending with ]. Generate MCQs strictly following CBSE pattern including assertion-reason type. Each item must have: "question" (string), "options" (array of 4 strings), "correctAnswer" (0-3 index), "explanation" (string), "type" ("regular" or "assertion-reason").`,
      'pyq': `You are a CBSE Class 12 expert. You must respond with ONLY valid JSON. No text before or after. No markdown. No backticks. No explanation. Just the raw JSON object starting with { and ending with }.

CRITICAL FORMATTING RULES — NEVER VIOLATE:
- NEVER use LaTeX: no \\times, no \\frac{}{}, no $ delimiters
- NEVER use markdown tables with | pipes
- NEVER use ** for bold
- Write all math in plain English:
  Write 'x' or 'multiplied by' instead of \\times
  Write '10/100' instead of \\frac{10}{100}
  Write 'Rs' instead of $
  Write numbers in plain text: '3,50,000' not '$3,50,000$'
- For tables use JSON objects: { "headers": ["Col1", "Col2"], "rows": [["val1", "val2"]] }
- Max marks for any single question is 6 marks — never exceed this

Return this exact JSON structure:
{
  "subject": "Subject Name",
  "year": "2024",
  "questions": [
    {
      "number": 1,
      "marks": 6,
      "type": "long",
      "text": "Full question text in plain English",
      "given_data": ["Data point 1", "Data point 2"],
      "required": "What the student needs to do",
      "answer": {
        "steps": [
          { "step": 1, "description": "Step description", "working": "Calculation in plain text using x not \\times", "marks": 1, "table": { "headers": ["Partner", "Amount"], "rows": [["A", "20,000"]] } }
        ],
        "final_answer": "Final answer text"
      }
    }
  ]
}
For MCQ type questions include "options": ["A", "B", "C", "D"] and answer can be a simple string.
The table field inside steps is optional — only include when the step involves tabular data.`,
      'answer-key': `You are a CBSE Class 12 expert examiner. Generate detailed answer keys with step-by-step solutions, marking scheme breakdowns, and examiner tips. Use markdown formatting.`,
    };

    const systemPrompt = systemPrompts[type] || systemPrompts['sample-paper'];
    const jsonTypes = ['mcq', 'sample-paper', 'revision-notes', 'pyq'];
    const isStreaming = !jsonTypes.includes(type);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        max_tokens: maxTokens || 8000,
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
