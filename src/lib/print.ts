import { sanitizeText } from '@/lib/sanitize';
import { SUBJECT_LABELS, type Subject } from '@/types';
import type { PYQData } from '@/components/PYQRenderer';
import type { PaperData } from '@/components/SamplePaperRenderer';
import type { NotesData } from '@/components/RevisionNotesRenderer';
import type { WorksheetData } from '@/components/WorksheetRenderer';

const PRINT_STYLES = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Times New Roman', Times, serif;
    font-size: 12pt;
    line-height: 1.8;
    color: #000;
    background: #fff;
    padding: 2cm;
    max-width: 100%;
    word-wrap: break-word;
    overflow-wrap: break-word;
  }
  .header {
    text-align: center;
    border-top: 3px solid black;
    border-bottom: 3px solid black;
    padding: 10pt 0;
    margin-bottom: 16pt;
    page-break-after: avoid;
  }
  .header h1 { font-size: 14pt; font-weight: bold; text-transform: uppercase; }
  .header p { font-size: 11pt; margin-top: 4pt; }
  .header .meta { display: flex; justify-content: space-between; margin-top: 8pt; font-size: 11pt; font-weight: bold; }
  .instructions {
    border: 1px solid black;
    padding: 8pt 12pt;
    margin-bottom: 16pt;
    font-size: 11pt;
    page-break-inside: avoid;
  }
  .instructions h3 { font-weight: bold; margin-bottom: 6pt; }
  .instructions ol { padding-left: 20pt; }
  .instructions li { margin-bottom: 3pt; }
  .section-header {
    background: #f0f0f0;
    border: 1px solid #000;
    padding: 6pt 10pt;
    font-weight: bold;
    font-size: 12pt;
    margin: 16pt 0 8pt 0;
    page-break-after: avoid;
  }
  .section-instruction {
    font-style: italic;
    font-size: 11pt;
    margin-bottom: 8pt;
    page-break-after: avoid;
  }
  .question {
    display: flex;
    gap: 10pt;
    margin-bottom: 12pt;
    page-break-inside: avoid;
    max-width: 100%;
  }
  .q-number { 
    min-width: 22pt; 
    font-weight: bold; 
    font-size: 12pt; 
    flex-shrink: 0;
  }
  .q-content { 
    flex: 1; 
    min-width: 0;
    word-wrap: break-word;
    overflow-wrap: break-word;
  }
  .q-text { 
    font-size: 12pt; 
    margin-bottom: 6pt; 
    word-wrap: break-word;
    overflow-wrap: break-word;
  }
  .q-marks { 
    float: right; 
    font-weight: bold; 
    font-size: 11pt; 
    margin-left: 10pt;
  }
  .options { 
    padding-left: 16pt; 
    word-wrap: break-word;
    overflow-wrap: break-word;
  }
  .option { 
    display: block; 
    margin-bottom: 4pt; 
    font-size: 12pt; 
    word-wrap: break-word;
    overflow-wrap: break-word;
  }
  .or-divider {
    text-align: center;
    font-weight: bold;
    font-size: 12pt;
    margin: 8pt 0;
    letter-spacing: 4pt;
  }
  .given-data {
    border-left: 3px solid #666;
    padding-left: 10pt;
    margin: 6pt 0;
    font-size: 11pt;
    word-wrap: break-word;
    overflow-wrap: break-word;
  }
  .answer-section {
    margin-top: 20pt;
    border-top: 2px solid black;
    padding-top: 12pt;
    page-break-before: always;
  }
  .answer-header { 
    font-size: 14pt; 
    font-weight: bold; 
    text-align: center; 
    margin-bottom: 12pt; 
  }
  .answer-item { 
    margin-bottom: 12pt; 
    page-break-inside: avoid;
    word-wrap: break-word;
    overflow-wrap: break-word;
  }
  .answer-item-title { 
    font-weight: bold; 
    margin-bottom: 4pt; 
  }
  .answer-step {
    display: flex;
    gap: 8pt;
    margin-bottom: 6pt;
    padding: 4pt 8pt;
    background: #f9f9f9;
    border: 1px solid #ddd;
    word-wrap: break-word;
    overflow-wrap: break-word;
  }
  .step-num { 
    font-weight: bold; 
    min-width: 20pt; 
    flex-shrink: 0;
  }
  .final-answer {
    margin-top: 4pt;
    padding: 6pt 10pt;
    background: #e8f5e9;
    border: 1px solid #a5d6a7;
    font-weight: bold;
    word-wrap: break-word;
    overflow-wrap: break-word;
  }
  table { 
    border-collapse: collapse; 
    width: 100%; 
    margin: 8pt 0; 
    table-layout: fixed;
  }
  td, th { 
    border: 1px solid black; 
    padding: 5pt 8pt; 
    text-align: left; 
    font-size: 11pt; 
    word-wrap: break-word;
    overflow-wrap: break-word;
  }
  th { 
    background: #f0f0f0; 
    font-weight: bold; 
  }
  .notes-section { 
    margin-bottom: 16pt; 
    page-break-inside: avoid;
  }
  .notes-section h3 { 
    font-size: 13pt; 
    font-weight: bold; 
    margin-bottom: 8pt; 
    border-bottom: 1px solid #ccc; 
    padding-bottom: 4pt; 
  }
  .notes-item { 
    margin-bottom: 6pt; 
    font-size: 11pt; 
    word-wrap: break-word;
    overflow-wrap: break-word;
  }
  .notes-item strong { 
    font-weight: bold; 
  }
  .formula-box { 
    font-family: 'Courier New', monospace; 
    background: #f5f5f5; 
    padding: 4pt 8pt; 
    margin: 4pt 0; 
    border: 1px solid #ddd; 
    word-wrap: break-word;
    overflow-wrap: break-word;
    white-space: pre-wrap;
  }
  @page { 
    size: A4; 
    margin: 2cm; 
  }
  @media print { 
    body { 
      padding: 0; 
      max-width: none;
    }
    .question, .answer-item, .notes-section {
      break-inside: avoid;
    }
  }
`;

const s = sanitizeText;

function wrapHTML(title: string, body: string): string {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${s(title)}</title><style>${PRINT_STYLES}</style></head><body>${body}</body></html>`;
}

export function openPrintView(html: string) {
  const w = window.open('', '_blank');
  if (!w) {
    alert('Please allow pop-ups to use Save as PDF.');
    return;
  }
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 500);
}

// ─── PYQ ───
export function printPYQ(data: PYQData, subject: Subject) {
  const totalMarks = data.questions.reduce((sum, q) => sum + q.marks, 0);
  const questionsHTML = data.questions.map(q => {
    const givenHTML = q.given_data?.length
      ? `<div class="given-data">${q.given_data.map(d => `• ${s(d)}`).join('<br>')}</div>` : '';
    const optionsHTML = q.options?.length
      ? `<div class="options">${q.options.map((o, i) => `<div class="option">${String.fromCharCode(97 + i)}) ${s(o)}</div>`).join('')}</div>` : '';
    const requiredHTML = q.required ? `<div style="margin-top:4pt;font-style:italic;">Required: ${s(q.required)}</div>` : '';
    return `<div class="question"><div class="q-number">${q.number}.</div><div class="q-content"><div class="q-marks">[${q.marks} mark${q.marks > 1 ? 's' : ''}]</div><div class="q-text">${s(q.text)}</div>${givenHTML}${requiredHTML}${optionsHTML}</div></div>`;
  }).join('');

  const answersHTML = data.questions.map(q => {
    const answer = q.answer;
    if (typeof answer === 'string') {
      return `<div class="answer-item"><div class="answer-item-title">Q${q.number}. [${q.marks} marks]</div><div>${s(answer)}</div></div>`;
    }
    if (!answer) return '';
    const stepsHTML = answer.steps?.map(st =>
      `<div class="answer-step"><div class="step-num">Step ${st.step}:</div><div>${s(st.description)} — ${s(st.working)} (${st.marks}m)</div></div>`
    ).join('') || '';
    const finalHTML = answer.final_answer ? `<div class="final-answer">Answer: ${s(answer.final_answer)}</div>` : '';
    return `<div class="answer-item"><div class="answer-item-title">Q${q.number}. [${q.marks} marks]</div>${stepsHTML}${finalHTML}</div>`;
  }).join('');

  const body = `
    <div class="header">
      <h1>CBSE Previous Year Questions</h1>
      <p>${s(data.subject)} (Class XII) — ${s(data.year)}</p>
      <div class="meta"><span>${data.questions.length} Questions</span><span>Total Marks: ${totalMarks}</span></div>
    </div>
    ${questionsHTML}
    <div class="answer-section"><div class="answer-header">MARKING SCHEME AND ANSWERS</div>${answersHTML}</div>
  `;
  openPrintView(wrapHTML(`PYQ ${data.subject} ${data.year}`, body));
}

// ─── Sample Paper ───
export function printSamplePaper(paper: PaperData, subject: Subject) {
  const totalQ = paper.sections.reduce((sum, sec) => sum + sec.questions.length, 0);
  const instructionsHTML = paper.instructions?.length
    ? `<div class="instructions"><h3>General Instructions:</h3><ol>${paper.instructions.map(i => `<li>${s(i)}</li>`).join('')}</ol></div>` : '';

  const sectionsHTML = paper.sections.map(section => {
    const instrHTML = section.instruction ? `<div class="section-instruction">${s(section.instruction)}</div>` : '';
    const qHTML = section.questions.map(q => {
      const optionsHTML = q.options?.length
        ? `<div class="options">${q.options.map((o, i) => `<div class="option">${String.fromCharCode(97 + i)}) ${s(o)}</div>`).join('')}</div>` : '';
      const orHTML = q.hasChoice && q.orQuestion
        ? `<div class="or-divider">OR</div><div class="q-text">${s(q.orQuestion)}</div>` : '';
      return `<div class="question"><div class="q-number">${q.number}.</div><div class="q-content"><div class="q-marks">[${q.marks} mark${q.marks > 1 ? 's' : ''}]</div><div class="q-text">${s(q.text)}</div>${optionsHTML}${orHTML}</div></div>`;
    }).join('');
    return `<div class="section-header">${s(section.name)}${section.subtitle ? ` — ${s(section.subtitle)}` : ''}</div>${instrHTML}${qHTML}`;
  }).join('');

  const answersHTML = paper.sections.map(section =>
    section.questions.filter(q => q.answer).map(q =>
      `<div class="answer-item"><div class="answer-item-title">Q${q.number}. [${q.marks} marks]</div><div>${s(q.answer!)}</div></div>`
    ).join('')
  ).join('');

  const body = `
    <div class="header">
      <h1>CBSE Sample Question Paper 2025-26</h1>
      <p>${s(paper.subject)} (Class ${paper.class || 'XII'})</p>
      <div class="meta"><span>Time Allowed: ${s(paper.time)}</span><span>Maximum Marks: ${s(paper.marks)}</span></div>
    </div>
    ${instructionsHTML}
    ${sectionsHTML}
    ${answersHTML ? `<div class="answer-section"><div class="answer-header">MARKING SCHEME AND ANSWERS</div>${answersHTML}</div>` : ''}
  `;
  openPrintView(wrapHTML(`Sample Paper ${paper.subject}`, body));
}

// ─── Revision Notes ───
export function printRevisionNotes(notes: NotesData, subject: Subject) {
  const conceptsHTML = notes.key_concepts?.length
    ? `<div class="notes-section"><h3>Key Concepts</h3>${notes.key_concepts.map(c =>
        `<div class="notes-item"><strong>${s(c.title)}:</strong> ${s(c.explanation)}</div>`
      ).join('')}</div>` : '';

  const defsHTML = notes.definitions?.length
    ? `<div class="notes-section"><h3>Important Definitions</h3><table><thead><tr><th>Term</th><th>Definition</th></tr></thead><tbody>${
        notes.definitions.map(d => `<tr><td>${s(d.term)}</td><td>${s(d.definition)}</td></tr>`).join('')
      }</tbody></table></div>` : '';

  const formulasHTML = notes.formulas?.length
    ? `<div class="notes-section"><h3>Formulas</h3>${notes.formulas.map(f =>
        `<div class="notes-item"><strong>${s(f.name)}:</strong><div class="formula-box">${s(f.formula)}</div><div style="font-size:10pt;color:#555;">${s(f.explanation)}</div></div>`
      ).join('')}</div>` : '';

  const mistakesHTML = notes.common_mistakes?.length
    ? `<div class="notes-section"><h3>Common Mistakes</h3><ol>${notes.common_mistakes.map(m => `<li class="notes-item">${s(m)}</li>`).join('')}</ol></div>` : '';

  const pyqHTML = notes.pyq_trends
    ? `<div class="notes-section"><h3>PYQ Trends</h3><div class="notes-item">${s(notes.pyq_trends)}</div></div>` : '';

  const questionsHTML = notes.likely_questions?.length
    ? `<div class="notes-section"><h3>Most Likely Exam Questions</h3><ol>${notes.likely_questions.map(q => `<li class="notes-item">${s(q)}</li>`).join('')}</ol></div>` : '';

  const body = `
    <div class="header">
      <h1>Revision Notes</h1>
      <p>${s(notes.subject)} — ${s(notes.chapter)} (Class XII)</p>
    </div>
    <div class="notes-section"><h3>Overview</h3><div class="notes-item">${s(notes.overview)}</div></div>
    ${conceptsHTML}${defsHTML}${formulasHTML}${mistakesHTML}${pyqHTML}${questionsHTML}
  `;
  openPrintView(wrapHTML(`Notes ${notes.subject} ${notes.chapter}`, body));
}

// ─── Worksheet ───
export function printWorksheet(data: WorksheetData, subject: Subject) {
  const totalMarks = data.total_marks || data.sections.reduce((sum, sec) => sec.questions.reduce((s2, q) => s2 + q.marks, sum), 0);
  const totalQuestions = data.total_questions || data.sections.reduce((sum, sec) => sum + sec.questions.length, 0);

  const sectionsHTML = data.sections.map(section => {
    const instrHTML = section.instruction ? `<div class="section-instruction">${s(section.instruction)}</div>` : '';
    const qHTML = section.questions.map(q => {
      const wordLimitHTML = q.word_limit ? `<span style="font-size:10pt;color:#666;margin-left:8pt;">(${s(q.word_limit)})</span>` : '';
      const optionsHTML = q.options?.length
        ? `<div class="options">${q.options.map(o => `<div class="option">☐ ${s(o)}</div>`).join('')}</div>` : '';
      const hintHTML = q.hint ? `<div style="font-size:10pt;color:#666;font-style:italic;margin-top:4pt;">Hint: ${s(q.hint)}</div>` : '';

      // Determine answer space based on question type
      const isShort = q.word_limit?.includes('40') || q.word_limit?.includes('50') || q.marks <= 2;
      const isLong = q.word_limit?.includes('120') || q.word_limit?.includes('150') || q.marks >= 5;
      const isMCQ = !!q.options?.length;
      const isFillBlank = q.text.includes('_______');
      const lineCount = isMCQ || isFillBlank ? 0 : isLong ? 8 : isShort ? 4 : 5;
      const linesHTML = lineCount > 0
        ? `<div style="margin-top:8pt;">${Array(lineCount).fill('<div style="border-bottom:1px dotted #ccc;height:22pt;"></div>').join('')}</div>` : '';

      return `<div class="question"><div class="q-number">${q.number}.</div><div class="q-content"><div class="q-marks">[${q.marks} mark${q.marks > 1 ? 's' : ''}]</div><div class="q-text">${s(q.text)}${wordLimitHTML}</div>${hintHTML}${optionsHTML}${linesHTML}</div></div>`;
    }).join('');
    return `<div class="section-header">${s(section.name)}</div>${instrHTML}${qHTML}`;
  }).join('');

  const answersHTML = data.sections.map(section =>
    section.questions.filter(q => q.answer).map(q =>
      `<div class="answer-item"><div class="answer-item-title">Q${q.number}. [${q.marks} marks]</div><div>${s(q.answer!)}${q.explanation ? `<br><em>${s(q.explanation)}</em>` : ''}</div></div>`
    ).join('')
  ).join('');

  const body = `
    <div class="header">
      <h1>Chapter Worksheet</h1>
      <p>${s(data.subject)} — ${s(data.chapter)} (Class XII)</p>
      <div class="meta"><span>Total Questions: ${totalQuestions}</span><span>Total Marks: ${totalMarks}</span></div>
    </div>
    ${sectionsHTML}
    ${answersHTML ? `<div class="answer-section" style="page-break-before:always;"><div class="answer-header">ANSWER KEY</div>${answersHTML}</div>` : ''}
  `;
  openPrintView(wrapHTML(`Worksheet ${data.subject} ${data.chapter}`, body));
}
