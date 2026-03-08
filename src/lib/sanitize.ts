/**
 * Sanitizes AI-generated text by converting raw markdown/LaTeX/HTML to clean text.
 * Use this on every piece of text rendered from AI responses.
 */
export function sanitizeText(text: string): string {
  if (!text) return '';
  return text
    // LaTeX math
    .replace(/\\times/g, '×')
    .replace(/\\div/g, '÷')
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '$1/$2')
    .replace(/\\sqrt\{([^}]+)\}/g, '√($1)')
    .replace(/\\sum/g, 'Σ')
    .replace(/\\infty/g, '∞')
    .replace(/\\leq/g, '≤')
    .replace(/\\geq/g, '≥')
    .replace(/\\neq/g, '≠')
    .replace(/\\approx/g, '≈')
    .replace(/\\pi/g, 'π')
    .replace(/\\%/g, '%')
    // Remove $ math delimiters
    .replace(/\$([^$]+)\$/g, '$1')
    // HTML tags
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/?(?:p|div)>/gi, '\n')
    .replace(/<\/?(?:strong|b)>/gi, '')
    .replace(/<\/?(?:em|i)>/gi, '')
    .replace(/<\/?code>/gi, '')
    // Clean up extra whitespace
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Renders sanitized text as React elements, converting \n to <br/>.
 */
export function renderSanitizedText(text: string): React.ReactNode {
  const clean = sanitizeText(text);
  const parts = clean.split('\n');
  if (parts.length === 1) return clean;
  return parts.map((part, i) => (
    <span key={i}>
      {part}
      {i < parts.length - 1 && <br />}
    </span>
  ));
}
