import { useState, useCallback, useEffect } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import ContentArea from './components/ContentArea';

let nextNotebookId = 1;

export default function App() {
  const [notebooks, setNotebooks] = useState([]);
  const [activeNoteId, setActiveNoteId] = useState(null);
  const [mode, setMode] = useState('note'); // 'note' | 'freetext'
  const [searchQuery, setSearchQuery] = useState('');
  const [scrollPercent, setScrollPercent] = useState(0);

  // Persist collapsed state + notebook metadata
  const [collapsedState, setCollapsedState] = useLocalStorage('nb-collapsed', {});
  const [savedNotebookMeta, setSavedNotebookMeta] = useLocalStorage('nb-meta', []);

  // Find active note across all notebooks
  const activeNote = notebooks
    .flatMap(nb => nb.notes)
    .find(n => n.id === activeNoteId) || null;

  // Current title for top bar
  const getTitle = () => {
    if (mode === 'freetext') return 'טקסט חופשי';
    if (!activeNote) return 'בחר הרצאה מהתפריט';
    const display = activeNote.name.replace('.md', '');
    const num = parseInt(display);
    const notebook = notebooks.find(nb => nb.notes.some(n => n.id === activeNoteId));
    const prefix = notebook ? `${notebook.name} / ` : '';
    return prefix + (!isNaN(num) ? `הרצאה ${num}` : display);
  };

  // -- Notebook Management --

  const addNotebook = useCallback(async () => {
    // Create a hidden file input for folder selection
    const input = document.createElement('input');
    input.type = 'file';
    input.setAttribute('webkitdirectory', '');
    input.setAttribute('directory', '');

    input.addEventListener('change', () => {
      const files = Array.from(input.files).filter(f => f.name.endsWith('.md'));
      if (files.length === 0) return;

      // Derive notebook name from the folder path
      const firstPath = files[0].webkitRelativePath || files[0].name;
      const folderName = firstPath.split('/')[0] || 'Unnamed';

      // Read all files
      const readPromises = files.map(file => new Promise(resolve => {
        const reader = new FileReader();
        reader.onload = e => resolve({
          id: `note-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          name: file.name,
          content: e.target.result,
        });
        reader.readAsText(file);
      }));

      Promise.all(readPromises).then(notes => {
        // Sort notes numerically
        notes.sort((a, b) => {
          const na = parseInt(a.name) || 0;
          const nb2 = parseInt(b.name) || 0;
          if (na !== nb2) return na - nb2;
          return a.name.localeCompare(b.name, undefined, { numeric: true });
        });

        const nbId = `nb-${nextNotebookId++}`;
        const newNotebook = {
          id: nbId,
          name: folderName,
          notes,
        };

        setNotebooks(prev => {
          // Don't add duplicate by name
          if (prev.some(n => n.name === folderName)) {
            return prev.map(n => n.name === folderName ? newNotebook : n);
          }
          return [...prev, newNotebook];
        });

        // Save metadata
        setSavedNotebookMeta(prev => {
          const filtered = prev.filter(m => m.name !== folderName);
          return [...filtered, { name: folderName, noteCount: notes.length }];
        });

        // Auto-select first note
        if (notes.length > 0) {
          setActiveNoteId(notes[0].id);
          setMode('note');
        }
      });
    });

    input.click();
  }, [setSavedNotebookMeta]);

  const removeNotebook = useCallback((nbId) => {
    setNotebooks(prev => {
      const updated = prev.filter(nb => nb.id !== nbId);
      const removedNb = prev.find(nb => nb.id === nbId);
      if (removedNb) {
        setSavedNotebookMeta(m => m.filter(x => x.name !== removedNb.name));
      }
      // Clear active if belongs to removed
      if (removedNb && removedNb.notes.some(n => n.id === activeNoteId)) {
        setActiveNoteId(null);
      }
      return updated;
    });
  }, [activeNoteId, setSavedNotebookMeta]);

  const toggleCollapse = useCallback((nbId) => {
    setCollapsedState(prev => ({ ...prev, [nbId]: !prev[nbId] }));
  }, [setCollapsedState]);

  const selectNote = useCallback((noteId) => {
    setActiveNoteId(noteId);
    setMode('note');
    setScrollPercent(0);
  }, []);

  const openFreeText = useCallback(() => {
    setActiveNoteId(null);
    setMode('freetext');
    setScrollPercent(0);
  }, []);

  // -- Keyboard Navigation --
  useEffect(() => {
    function handleKeyDown(e) {
      if (mode !== 'note') return;
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      const allNotes = notebooks.flatMap(nb => nb.notes);
      const currentIdx = allNotes.findIndex(n => n.id === activeNoteId);

      if (e.key === 'ArrowDown' || e.key === 'j') {
        e.preventDefault();
        const next = currentIdx < allNotes.length - 1 ? currentIdx + 1 : 0;
        selectNote(allNotes[next].id);
      } else if (e.key === 'ArrowUp' || e.key === 'k') {
        e.preventDefault();
        const prev = currentIdx > 0 ? currentIdx - 1 : allNotes.length - 1;
        selectNote(allNotes[prev].id);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [notebooks, activeNoteId, mode, selectNote]);

  return (
    <>
      <Sidebar
        notebooks={notebooks}
        activeNoteId={activeNoteId}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSelectNote={selectNote}
        onAddNotebook={addNotebook}
        onRemoveNotebook={removeNotebook}
        onFreeText={openFreeText}
        collapsedState={collapsedState}
        onToggleCollapse={toggleCollapse}
      />
      <main className="main">
        <TopBar
          title={getTitle()}
          badge={activeNote ? 'Markdown' : (mode === 'freetext' ? '✏️' : null)}
          scrollPercent={mode === 'note' && activeNote ? scrollPercent : null}
        />
        <ContentArea
          activeNote={activeNote}
          mode={mode}
          onScroll={setScrollPercent}
        />
      </main>
    </>
  );
}
