import { useState } from 'react';

export default function Sidebar({
  notebooks,
  activeNoteId,
  searchQuery,
  onSearchChange,
  onSelectNote,
  onAddNotebook,
  onRemoveNotebook,
  onFreeText,
  collapsedState,
  onToggleCollapse,
}) {
  return (
    <aside className="sidebar">
      {/* Header */}
      <div className="sidebar-header">
        <h1>📚 Notebooks</h1>
        <p>Markdown Lecture Viewer</p>
      </div>

      {/* Action Buttons */}
      <div className="sidebar-actions">
        <button className="action-btn" onClick={onAddNotebook}>
          📂 הוסף מחברת
        </button>
        <button className="action-btn" onClick={onFreeText}>
          ✏️ טקסט חופשי
        </button>
      </div>

      {/* Search */}
      <div className="sidebar-search">
        <input
          type="text"
          placeholder="🔍 חיפוש הערות..."
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
        />
      </div>

      {/* Notebook List */}
      <div className="notebook-list">
        {notebooks.length === 0 && (
          <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            לחץ "הוסף מחברת"<br />כדי לטעון תיקייה
          </div>
        )}

        {notebooks.map(nb => {
          const isCollapsed = collapsedState[nb.id] ?? false;

          // Filter notes by search
          const filteredNotes = nb.notes.filter(n =>
            !searchQuery || n.name.toLowerCase().includes(searchQuery.toLowerCase())
          );

          if (searchQuery && filteredNotes.length === 0) return null;

          return (
            <div className="notebook-group" key={nb.id}>
              <div className="notebook-header" onClick={() => onToggleCollapse(nb.id)}>
                <span className={`chevron ${!isCollapsed ? 'open' : ''}`}>▶</span>
                <span className="name">{nb.name}</span>
                <span className="count">{nb.notes.length}</span>
                <button
                  className="remove-btn"
                  title="הסר מחברת"
                  onClick={e => { e.stopPropagation(); onRemoveNotebook(nb.id); }}
                >
                  ✕
                </button>
              </div>

              {!isCollapsed && (
                <div className="note-list">
                  {filteredNotes.map(note => {
                    const displayName = note.name.replace('.md', '');
                    const num = parseInt(displayName);
                    const label = !isNaN(num) ? `הרצאה ${num}` : displayName;

                    return (
                      <div
                        key={note.id}
                        className={`note-item ${activeNoteId === note.id ? 'active' : ''}`}
                        onClick={() => onSelectNote(note.id)}
                      >
                        <span className="icon">📝</span>
                        <span>{label}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
}
