import { useRef, useEffect } from 'react';
import { markdownToHtml, renderMath } from '../utils/markdownPipeline';

export default function MarkdownRenderer({ content }) {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current) {
      renderMath(ref.current);
    }
  }, [content]);

  const html = markdownToHtml(content);

  return (
    <div
      ref={ref}
      className="markdown-body"
      dir="rtl"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
