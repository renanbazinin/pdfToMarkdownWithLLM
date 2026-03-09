import { useState } from 'react';
import MarkdownRenderer from './MarkdownRenderer';

export default function FreeTextEditor() {
  const [text, setText] = useState('');
  const [rendered, setRendered] = useState(null);

  function handleRender() {
    if (text.trim()) {
      setRendered(text);
    }
  }

  if (rendered) {
    return (
      <div>
        <button
          className="action-btn"
          style={{ marginBottom: 16, width: 'auto', padding: '6px 16px', borderStyle: 'solid' }}
          onClick={() => setRendered(null)}
        >
          ← חזרה לעריכה
        </button>
        <MarkdownRenderer content={rendered} />
      </div>
    );
  }

  return (
    <div className="free-text-container">
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="הדבק כאן Markdown או LaTeX..."
      />
      <button className="render-btn" onClick={handleRender}>
        רנדר טקסט
      </button>
    </div>
  );
}
