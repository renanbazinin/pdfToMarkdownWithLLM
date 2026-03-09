import { marked } from 'marked';
import renderMathInElement from 'katex/contrib/auto-render';

/**
 * Math-safe Markdown → HTML pipeline.
 * Extracts LaTeX before marked.js can mangle it, then restores after.
 */
export function markdownToHtml(md) {
  // Strip outer <div dir="rtl"> wrapper if present
  md = md.replace(/^\s*<div dir="rtl">\s*/i, '').replace(/\s*<\/div>\s*$/i, '');

  const mathBlocks = [];
  let counter = 0;

  // Extract block equations ($$...$$)
  md = md.replace(/\$\$([\s\S]+?)\$\$/g, (match) => {
    const id = `@@@MATHBLOCK${counter++}@@@`;
    mathBlocks.push({ id, text: match });
    return id;
  });

  // Extract inline equations ($...$)
  md = md.replace(/\$((?:\\.|[^$\n])+?)\$/g, (match) => {
    const id = `@@@MATHINLINE${counter++}@@@`;
    mathBlocks.push({ id, text: match });
    return id;
  });

  // Parse markdown
  let html = marked.parse(md);

  // Restore math
  mathBlocks.forEach(b => {
    html = html.replaceAll(b.id, b.text);
  });

  return html;
}

/**
 * Call after the DOM has been updated with HTML containing $...$ / $$...$$.
 * Runs KaTeX auto-render on the given DOM element.
 */
export function renderMath(element) {
  if (!element) return;
  try {
    renderMathInElement(element, {
      delimiters: [
        { left: '$$', right: '$$', display: true },
        { left: '$', right: '$', display: false },
      ],
      throwOnError: false,
    });
  } catch (e) {
    console.warn('KaTeX render error:', e);
  }
}
