import { Subject, SUBJECT_LABELS } from '@/types';
import type { PaperData } from '@/components/SamplePaperRenderer';

const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/study-ai`;

export async function streamAI({
  type,
  messages,
  onDelta,
  onDone,
}: {
  type: string;
  messages: { role: string; content: string }[];
  onDelta: (text: string) => void;
  onDone: () => void;
}) {
  const resp = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ type, messages }),
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error || "AI request failed");
  }

  if (!resp.body) throw new Error("No response body");

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let newlineIdx: number;
    while ((newlineIdx = buffer.indexOf("\n")) !== -1) {
      let line = buffer.slice(0, newlineIdx);
      buffer = buffer.slice(newlineIdx + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (line.startsWith(":") || line.trim() === "") continue;
      if (!line.startsWith("data: ")) continue;
      const json = line.slice(6).trim();
      if (json === "[DONE]") { onDone(); return; }
      try {
        const parsed = JSON.parse(json);
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) onDelta(content);
      } catch { buffer = line + "\n" + buffer; break; }
    }
  }
  onDone();
}

function extractJSON(text: string): any {
  try {
    return JSON.parse(text);
  } catch {
    try {
      const stripped = text.replace(/```json/gi, '').replace(/```/g, '').trim();
      return JSON.parse(stripped);
    } catch {
      try {
        const start = text.indexOf('{');
        const end = text.lastIndexOf('}');
        if (start !== -1 && end !== -1) {
          return JSON.parse(text.slice(start, end + 1));
        }
        const aStart = text.indexOf('[');
        const aEnd = text.lastIndexOf(']');
        if (aStart !== -1 && aEnd !== -1) {
          return JSON.parse(text.slice(aStart, aEnd + 1));
        }
      } catch {
        console.error('All JSON parse attempts failed:', text.slice(0, 200));
      }
    }
  }
  return null;
}

async function callAI(type: string, messages: { role: string; content: string }[], maxTokens?: number): Promise<any> {
  const resp = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ type, messages, maxTokens }),
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error || "AI request failed");
  }

  const data = await resp.json();
  const raw = data.choices?.[0]?.message?.content || "";
  const parsed = extractJSON(raw);
  if (!parsed) throw new Error("Generation failed — please try again.");
  return parsed;
}

export async function generateJSON(type: string, messages: { role: string; content: string }[]): Promise<any> {
  return callAI(type, messages, 8000);
}

// Subject-specific question structure specs for CBSE papers
const PAPER_SPECS: Record<string, Record<number, string>> = {
  accountancy: {
    80: `Generate EXACTLY these questions:
PART A — Accounting for Partnership Firms and Companies:
Section A MCQs (1 mark each): EXACTLY 16 questions numbered 1 to 16
Section B Short Answer I (3 marks each): EXACTLY 4 questions numbered 17 to 20. Questions 19 and 20 must each have an OR option.
Section C Short Answer II (4 marks each): EXACTLY 2 questions numbered 21 to 22. Question 21 must have an OR option.
Section D Long Answer (6 marks each): EXACTLY 4 questions numbered 23 to 26. Questions 25 and 26 must each have an OR option.
PART B — Analysis of Financial Statements:
Section A MCQs (1 mark each): EXACTLY 4 questions numbered 27 to 30
Section B Short Answer I (3 marks each): EXACTLY 2 questions numbered 31 to 32. Question 32 must have an OR option.
Section C Long Answer (4 marks each): EXACTLY 1 question numbered 33
Section D Long Answer (6 marks each): EXACTLY 1 question numbered 34
Total: 34 questions, 80 marks. DO NOT skip any question numbers. Number them 1 through 34.`,
    60: `Generate EXACTLY these questions:
Section A MCQs (1 mark each): EXACTLY 12 questions numbered 1 to 12
Section B Short Answer (3 marks each): EXACTLY 6 questions numbered 13 to 18. Questions 16 and 17 must have OR options.
Section C Long Answer (5 marks each): EXACTLY 4 questions numbered 19 to 22. Questions 21 and 22 must have OR options.
Total: 22 questions, 60 marks. DO NOT skip any question numbers.`,
    40: `Generate EXACTLY these questions:
Section A MCQs (1 mark each): EXACTLY 8 questions numbered 1 to 8
Section B Short Answer (3 marks each): EXACTLY 4 questions numbered 9 to 12. Question 11 must have an OR option.
Section C Long Answer (5 marks each): EXACTLY 3 questions numbered 13 to 15. Question 15 must have an OR option.
Total: 15 questions, 40 marks. DO NOT skip any question numbers.`,
  },
  business: {
    80: `Generate EXACTLY these questions:
Section A MCQs (1 mark each): EXACTLY 20 questions numbered 1 to 20
Section B Short Answer I (3 marks each): EXACTLY 5 questions numbered 21 to 25. Questions 23 and 24 must have OR options.
Section C Short Answer II (4 marks each): EXACTLY 4 questions numbered 26 to 29. Questions 28 and 29 must have OR options.
Section D Long Answer (6 marks each): EXACTLY 3 questions numbered 30 to 32. Questions 31 and 32 must have OR options.
Total: 32 questions, 80 marks. DO NOT skip any question numbers.`,
    60: `Generate EXACTLY: Section A MCQs (1 mark) 15 questions numbered 1-15. Section B Short (3 marks) 5 questions 16-20. Section C Long (5 marks) 4 questions 21-24 with OR on 23-24. Total: 24 questions, 60 marks.`,
    40: `Generate EXACTLY: Section A MCQs (1 mark) 10 questions numbered 1-10. Section B Short (3 marks) 4 questions 11-14. Section C Long (5 marks) 2 questions 15-16 with OR on 16. Total: 16 questions, 40 marks.`,
  },
  economics: {
    80: `Generate EXACTLY these questions:
PART A — Introductory Microeconomics:
Section A MCQs (1 mark each): EXACTLY 10 questions numbered 1 to 10
Section B Short Answer (3 marks each): EXACTLY 3 questions numbered 11 to 13. Question 12 must have an OR option.
Section C Short Answer (4 marks each): EXACTLY 3 questions numbered 14 to 16. Question 16 must have an OR option.
Section D Long Answer (6 marks each): EXACTLY 1 question numbered 17 with an OR option.
PART B — Introductory Macroeconomics:
Section A MCQs (1 mark each): EXACTLY 10 questions numbered 18 to 27
Section B Short Answer (3 marks each): EXACTLY 3 questions numbered 28 to 30. Question 29 must have an OR option.
Section C Short Answer (4 marks each): EXACTLY 3 questions numbered 31 to 33. Question 33 must have an OR option.
Section D Long Answer (6 marks each): EXACTLY 1 question numbered 34 with an OR option.
Total: 34 questions, 80 marks. DO NOT skip any question numbers.`,
    60: `Generate EXACTLY: Part A Micro - MCQs (1 mark) 8 questions 1-8, Short (3 marks) 3 questions 9-11, Long (5 marks) 2 questions 12-13. Part B Macro - MCQs (1 mark) 8 questions 14-21, Short (3 marks) 2 questions 22-23, Long (5 marks) 2 questions 24-25. Total: 25 questions, 60 marks.`,
    40: `Generate EXACTLY: MCQs (1 mark) 10 questions 1-10. Short (3 marks) 4 questions 11-14. Long (5 marks) 3 questions 15-17 with OR on 17. Total: 17 questions, 40 marks.`,
  },
  english: {
    80: `Generate EXACTLY these questions:
Section A — Reading Skills:
Q1 (20 marks): One unseen passage with 10 MCQs and 2 short answer questions
Q2 (10 marks): One unseen case-based passage with 5 MCQs and 2 short answers
Section B — Creative Writing:
Q3 (5 marks): Notice/Invitation writing with OR option
Q4 (5 marks): Letter writing (formal) with OR option
Q5 (5 marks): Article/Report writing with OR option
Section C — Literature:
Q6-Q10 (1 mark each): 5 MCQs from Flamingo prose
Q11-Q14 (1 mark each): 4 MCQs from Flamingo poetry
Q15-Q16 (3 marks each): 2 short answer from prose with OR option on Q16
Q17-Q18 (3 marks each): 2 short answer from poetry
Q19 (5 marks): Long answer from Flamingo with OR option
Q20-Q21 (1 mark each): 2 MCQs from Vistas
Q22 (3 marks): Short answer from Vistas
Q23 (5 marks): Long answer from Vistas with OR option
Total: 80 marks. Number all questions consecutively.`,
    60: `Generate EXACTLY: Reading 1 passage with 8 MCQs (8 marks). Writing: notice + letter + article (15 marks). Literature: 8 MCQs + 4 short answers + 2 long answers (37 marks). Total ~60 marks.`,
    40: `Generate EXACTLY: Reading 1 passage 5 MCQs (5 marks). Writing: 2 tasks (10 marks). Literature: 5 MCQs + 3 short + 1 long (25 marks). Total ~40 marks.`,
  },
  marketing: {
    80: `Generate EXACTLY these questions:
Section A MCQs (1 mark each): EXACTLY 20 questions numbered 1 to 20
Section B Short Answer (3 marks each): EXACTLY 6 questions numbered 21 to 26. Questions 24 and 25 must have OR options.
Section C Long Answer (5 marks each): EXACTLY 4 questions numbered 27 to 30. Questions 29 and 30 must have OR options.
Total: 30 questions, 80 marks. DO NOT skip any question numbers.`,
    60: `Generate EXACTLY: MCQs (1 mark) 15 questions 1-15. Short (3 marks) 5 questions 16-20. Long (5 marks) 4 questions 21-24 with OR on 23-24. Total: 24 questions, 60 marks.`,
    40: `Generate EXACTLY: MCQs (1 mark) 10 questions 1-10. Short (3 marks) 4 questions 11-14. Long (5 marks) 2 questions 15-16 with OR on 16. Total: 16 questions, 40 marks.`,
  },
  applied_math: {
    80: `Generate EXACTLY these questions:
Section A MCQs (1 mark each): EXACTLY 20 questions numbered 1 to 20
Section B Short Answer (2 marks each): EXACTLY 6 questions numbered 21 to 26
Section C Short Answer (3 marks each): EXACTLY 6 questions numbered 27 to 32. Questions 31 and 32 must each have an OR option.
Section D Long Answer (5 marks each): EXACTLY 6 questions numbered 33 to 38. Questions 37 and 38 must each have an OR option.
Total: 38 questions, 80 marks. Include calculation-based and application-based questions. DO NOT skip any question numbers.`,
    60: `Generate EXACTLY these questions:
Section A MCQs (1 mark each): EXACTLY 15 questions numbered 1 to 15
Section B Short Answer (2 marks each): EXACTLY 6 questions numbered 16 to 21
Section C Short Answer (3 marks each): EXACTLY 5 questions numbered 22 to 26. Question 26 must have an OR option.
Section D Long Answer (5 marks each): EXACTLY 3 questions numbered 27 to 29. Questions 28 and 29 must each have an OR option.
Total: 29 questions, 60 marks. DO NOT skip any question numbers.`,
    40: `Generate EXACTLY these questions:
Section A MCQs (1 mark each): EXACTLY 10 questions numbered 1 to 10
Section B Short Answer (2 marks each): EXACTLY 5 questions numbered 11 to 15
Section C Short Answer (3 marks each): EXACTLY 4 questions numbered 16 to 19. Question 19 must have an OR option.
Section D Long Answer (5 marks each): EXACTLY 1 question numbered 20 with an OR option.
Total: 20 questions, 40 marks. DO NOT skip any question numbers.`,
  },
};

function validatePaper(paper: PaperData): { valid: boolean; totalMarks: number; totalQuestions: number; missing: number[] } {
  const allQuestions = paper.sections.flatMap(s => s.questions);
  const totalMarks = allQuestions.reduce((sum, q) => sum + (q.marks || 0), 0);
  const totalQuestions = allQuestions.length;
  const numbers = allQuestions.map(q => q.number).sort((a, b) => a - b);
  const maxNum = numbers.length > 0 ? numbers[numbers.length - 1] : 0;
  const expected = Array.from({ length: maxNum }, (_, i) => i + 1);
  const missing = expected.filter(n => !numbers.includes(n));
  return { valid: missing.length === 0 && totalQuestions >= 10, totalMarks, totalQuestions, missing };
}

export async function generateSamplePaper(
  subject: Subject,
  chapNames: string,
  marks: number,
  difficulty: string,
  onProgress?: (msg: string) => void,
): Promise<PaperData> {
  const spec = PAPER_SPECS[subject]?.[marks] || PAPER_SPECS[subject]?.[80] || '';
  const subjectName = SUBJECT_LABELS[subject];

  // For 80-mark papers with two parts (accountancy, economics), split into 2 calls
  const hasTwoParts = (subject === 'accountancy' || subject === 'economics') && marks === 80;

  if (hasTwoParts) {
    onProgress?.('Generating Part A...');
    const partASpec = spec.split(/PART B/i)[0].trim();
    const partBSpec = 'PART B' + spec.split(/PART B/i)[1];

    const partAPrompt = `Generate a Class 12 ${subjectName} paper — ${partASpec}
Chapters: ${chapNames}. Difficulty: ${difficulty}. Follow CBSE 2024-25 board format. Include answers for every question.`;

    const partBPrompt = `Generate a Class 12 ${subjectName} paper — ${partBSpec}
Chapters: ${chapNames}. Difficulty: ${difficulty}. Follow CBSE 2024-25 board format. Include answers for every question.`;

    const [partA, partB] = await Promise.all([
      callAI('sample-paper', [{ role: 'user', content: partAPrompt }], 8000),
      callAI('sample-paper', [{ role: 'user', content: partBPrompt }], 8000).then(r => {
        onProgress?.('Generating Part B...');
        return r;
      }),
    ]);

    // Merge parts
    const merged: PaperData = {
      title: partA.title || `CBSE Sample Question Paper 2024-25`,
      subject: subjectName,
      class: 'XII',
      time: '3 Hours',
      marks: String(marks),
      instructions: partA.instructions || [],
      sections: [
        ...(partA.sections || []).map((s: any) => ({ ...s, name: `Part A — ${s.name}` })),
        ...(partB.sections || []).map((s: any) => ({ ...s, name: `Part B — ${s.name}` })),
      ],
    };

    onProgress?.('Validating paper...');
    const validation = validatePaper(merged);
    if (!validation.valid && validation.totalQuestions < 10) {
      throw new Error('Paper generation incomplete — please try again.');
    }
    return merged;
  }

  // Single call for other subjects / marks
  onProgress?.('Generating paper...');
  const prompt = `Generate a Class 12 ${subjectName} sample paper covering ${chapNames} for ${marks} marks at ${difficulty} difficulty following CBSE 2024-25 board format.
${spec}
Include answers for every question.`;

  const paper = await callAI('sample-paper', [{ role: 'user', content: prompt }], 8000);

  onProgress?.('Validating paper...');
  const validation = validatePaper(paper);

  // Auto-retry once if paper is clearly incomplete
  if (!validation.valid && validation.totalQuestions < 10) {
    onProgress?.('Paper was incomplete — retrying...');
    const retry = await callAI('sample-paper', [{ role: 'user', content: prompt }], 8000);
    return retry;
  }

  return paper;
}

export { validatePaper };

export async function generateMCQs(messages: { role: string; content: string }[]): Promise<string> {
  const parsed = await callAI('mcq', messages, 8000);
  return JSON.stringify(parsed);
}
