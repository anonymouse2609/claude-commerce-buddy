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
