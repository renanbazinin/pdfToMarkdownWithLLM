import { useRef } from 'react';
import MarkdownRenderer from './MarkdownRenderer';
import FreeTextEditor from './FreeTextEditor';

export default function ContentArea({ activeNote, mode, onScroll }) {
  const ref = useRef(null);

  function handleScroll() {
    if (!ref.current || !onScroll) return;
    const el = ref.current;
    const percent = el.scrollHeight <= el.clientHeight
      ? 100
      : Math.round((el.scrollTop / (el.scrollHeight - el.clientHeight)) * 100);
    onScroll(percent);
  }

  if (mode === 'freetext') {
    return (
      <div className="content-area" ref={ref}>
        <FreeTextEditor />
      </div>
    );
  }

  if (!activeNote) {
    return (
      <div className="content-area">
        <div className="empty-state">
          <div className="emoji">📚</div>
          <h3>ברוכים הבאים ל-Notebooks</h3>
          <p>הוסף מחברת (תיקייה) כדי להתחיל לקרוא הרצאות</p>
        </div>
      </div>
    );
  }

  return (
    <div className="content-area" ref={ref} onScroll={handleScroll}>
      <MarkdownRenderer content={activeNote.content} />
    </div>
  );
}
