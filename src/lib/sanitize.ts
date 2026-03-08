/**
 * Sanitizes AI-generated text by converting raw markdown/LaTeX/HTML to clean text.
 * Apply to 100% of text before rendering — no exceptions.
 */
export function sanitizeText(text: string | undefined | null): string {
  if (!text) return '';
  if (typeof text !== 'string') return String(text);
  return text
    // LaTeX math delimiters
    .replace(/\$([^$]+)\$/g, '$1')
    // LaTeX operators
    .replace(/\\times/g, '×')
    .replace(/\\div/g, '÷')
    .replace(/\\cdot/g, '·')
    .replace(/\\pm/g, '±')
    // LaTeX fractions
    .replace(/\\frac\{(\d+)\}\{(\d+)\}/g, '$1/$2')
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1)/($2)')
    // LaTeX misc
    .replace(/\\sqrt\{([^}]+)\}/g, '√($1)')
    .replace(/\\sum/g, 'Σ')
    .replace(/\\infty/g, '∞')
    .replace(/\\leq/g, '≤')
    .replace(/\\geq/g, '≥')
    .replace(/\\neq/g, '≠')
    .replace(/\\approx/g, '≈')
    .replace(/\\pi/g, 'π')
    .replace(/\\%/g, '%')
    .replace(/\\_/g, '_')
    .replace(/\\text\{([^}]+)\}/g, '$1')
    .replace(/\\mathrm\{([^}]+)\}/g, '$1')
    .replace(/\\left/g, '')
    .replace(/\\right/g, '')
    // HTML tags
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/?(?:p|div)>/gi, '\n')
    .replace(/<\/?(?:strong|b)>/gi, '')
    .replace(/<\/?(?:em|i)>/gi, '')
    .replace(/<\/?code>/gi, '')
    // Markdown bold/italic
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    // Markdown table remnants
    .replace(/^\|.*\|$/gm, (line) => {
      // Convert pipe-delimited lines to space-separated
      return line.replace(/\|/g, '  ').trim();
    })
    .replace(/^[\s|:-]+$/gm, '') // Remove table separator lines
    // Clean up
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
