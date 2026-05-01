  (function(){
    "use strict";

    localforage.config({ name: 'MemoraPro', storeName: 'notes_store' });
    const MAX_STORAGE_BYTES = 5 * 1024 * 1024 * 1024;

    const quill = new Quill('#quillEditor', {
      theme: 'snow',
      placeholder: 'Write your masterpiece...',
      modules: {
        toolbar: [
          [{ header: [1, 2, 3, false] }],
          ['bold', 'italic', 'underline', 'strike'],
          [{ list: 'ordered'}, { list: 'bullet' }],
          ['blockquote', 'code-block'],
          ['link', 'image'],
          [{ color: [] }, { background: [] }],
          ['clean']
        ]
      }
    });

    let notes = [];
    let currentNoteId = null;
    let isSaving = false;
    let debounceTimer = null;
    const categoriesSet = new Set();

    const notesContainer = document.getElementById('notesListContainer');
    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilterSelect');
    const noteTitleInput = document.getElementById('noteTitleInput');
    const categoryInput = document.getElementById('categoryInput');
    const categoryDatalist = document.getElementById('categoryList');
    const deleteBtn = document.getElementById('deleteNoteBtn');
    const newBtn = document.getElementById('newNoteBtn');
    const darkToggle = document.getElementById('darkmodeToggle');
    const storageText = document.getElementById('storageText');
    const storageBar = document.getElementById('storageBarFill');
    const wordCountDisplay = document.getElementById('wordCountDisplay');
    const saveStatusEl = document.getElementById('saveStatus');
    const lastModifiedSpan = document.getElementById('lastModifiedSpan');
    const exportBtn = document.getElementById('exportBtn');
    const importBtn = document.getElementById('importBtn');
    const importFileInput = document.getElementById('importFileInput');
    const clearAllBtn = document.getElementById('clearAllBtn');
    const duplicateBtn = document.getElementById('duplicateNoteBtn');
    const voiceBtn = document.getElementById('voiceDictationBtn');
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');

    function generateId() { return Date.now() + '-' + Math.random().toString(36).substr(2, 8); }
    function formatBytes(bytes) {
      if (bytes < 1024) return bytes + ' B';
      if (bytes < 1024*1024) return (bytes/1024).toFixed(1) + ' KB';
      if (bytes < 1024*1024*1024) return (bytes/(1024*1024)).toFixed(2) + ' MB';
      return (bytes/(1024*1024*1024)).toFixed(2) + ' GB';
    }

    async function updateStorageUsage() {
      const allNotes = await localforage.getItem('notes') || [];
      let totalSize = 0;
      for (let n of allNotes) totalSize += new Blob([JSON.stringify(n)]).size;
      const percent = (totalSize / MAX_STORAGE_BYTES) * 100;
      storageText.innerText = `${formatBytes(totalSize)} / 5 GB`;
      storageBar.style.width = Math.min(percent, 100) + '%';
    }

    function refreshCategoryUI() {
      const cats = Array.from(categoriesSet).sort();
      categoryDatalist.innerHTML = cats.map(c => `<option value="${c}">`).join('');
      const currentFilter = categoryFilter.value;
      categoryFilter.innerHTML = '<option value="ALL">All categories</option>';
      cats.forEach(c => { categoryFilter.innerHTML += `<option value="${c}">${c}</option>`; });
      categoryFilter.value = cats.includes(currentFilter) ? currentFilter : 'ALL';
    }

    function updateEditorMeta() {
      const text = quill.getText();
      const words = text.trim().split(/\s+/).filter(w => w.length).length;
      const chars = text.replace(/\s/g, '').length;
      wordCountDisplay.innerText = `${words} words · ${chars} chars`;
    }

    function loadNoteToEditor(note) {
      if (!note) return;
      currentNoteId = note.id;
      noteTitleInput.value = note.title || 'Untitled';
      categoryInput.value = note.category || '';
      try {
        quill.setContents(note.contentDelta ? JSON.parse(note.contentDelta) : []);
      } catch(e) { quill.setText(''); }
      lastModifiedSpan.innerText = note.updatedAt ? new Date(note.updatedAt).toLocaleString() : '—';
      updateEditorMeta();
      saveStatusEl.innerHTML = '<i class="fas fa-check-circle"></i> Saved';
      highlightActiveNote(note.id);
    }

    function clearEditor() {
      currentNoteId = null;
      noteTitleInput.value = '';
      categoryInput.value = '';
      quill.setText('');
      lastModifiedSpan.innerText = '—';
      updateEditorMeta();
      saveStatusEl.innerHTML = '<i class="fas fa-pencil"></i> New';
      highlightActiveNote(null);
    }

    function highlightActiveNote(id) {
      document.querySelectorAll('.note-item').forEach(el => {
        el.classList.toggle('active', el.dataset.id === id);
      });
    }

    async function saveCurrentNote() {
      if (isSaving) return;
      const title = noteTitleInput.value.trim() || 'Untitled';
      const category = categoryInput.value.trim();
      if (category) categoriesSet.add(category);
      const contentDelta = JSON.stringify(quill.getContents());
      const plainText = quill.getText();
      
      let note;
      if (currentNoteId) {
        const existing = notes.find(n => n.id === currentNoteId);
        note = existing ? { ...existing, title, category, contentDelta, plainText, updatedAt: Date.now() } :
                         { id: generateId(), title, category, contentDelta, plainText, createdAt: Date.now(), updatedAt: Date.now() };
      } else {
        note = { id: generateId(), title, category, contentDelta, plainText, createdAt: Date.now(), updatedAt: Date.now() };
      }
      
      isSaving = true;
      saveStatusEl.innerHTML = '<i class="fas fa-spinner fa-pulse"></i> Saving...';
      try {
        let allNotes = await localforage.getItem('notes') || [];
        const idx = allNotes.findIndex(n => n.id === note.id);
        if (idx >= 0) allNotes[idx] = note;
        else allNotes.push(note);
        await localforage.setItem('notes', allNotes);
        notes = allNotes;
        currentNoteId = note.id;
        await updateStorageUsage();
        refreshCategoryUI();
        renderNotesList();
        lastModifiedSpan.innerText = new Date(note.updatedAt).toLocaleString();
        saveStatusEl.innerHTML = '<i class="fas fa-check-circle"></i> Saved';
      } catch(e) {
        saveStatusEl.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Error';
      } finally {
        isSaving = false;
      }
    }

    function autoSave() {
      if (debounceTimer) clearTimeout(debounceTimer);
      saveStatusEl.innerHTML = '<i class="fas fa-edit"></i> Unsaved';
      debounceTimer = setTimeout(() => saveCurrentNote(), 650);
    }

    function renderNotesList() {
      const searchTerm = searchInput.value.toLowerCase();
      const catFilter = categoryFilter.value;
      const filtered = notes.filter(n => {
        const matchSearch = n.title.toLowerCase().includes(searchTerm) || (n.plainText||'').toLowerCase().includes(searchTerm);
        const matchCat = (catFilter === 'ALL' || n.category === catFilter);
        return matchSearch && matchCat;
      }).sort((a,b) => (b.updatedAt||0) - (a.updatedAt||0));
      
      notesContainer.innerHTML = filtered.map(n => `
        <div class="note-item" data-id="${n.id}">
          <div class="note-title">${n.title || 'Untitled'}</div>
          <div class="note-meta">
            <span>${n.plainText ? n.plainText.substring(0,35)+'…' : 'Empty'}</span>
            <span class="category-badge">${n.category || 'General'}</span>
          </div>
        </div>
      `).join('');
      
      document.querySelectorAll('.note-item').forEach(el => {
        el.addEventListener('click', () => {
          const note = notes.find(n => n.id === el.dataset.id);
          if (note) loadNoteToEditor(note);
          if (window.innerWidth <= 800) closeSidebar();
        });
      });
      if (currentNoteId) highlightActiveNote(currentNoteId);
    }

    async function deleteCurrentNote() {
      if (!currentNoteId || !confirm('Delete this note?')) return;
      let allNotes = await localforage.getItem('notes') || [];
      allNotes = allNotes.filter(n => n.id !== currentNoteId);
      await localforage.setItem('notes', allNotes);
      notes = allNotes;
      clearEditor();
      await updateStorageUsage();
      refreshCategoryUI();
      renderNotesList();
    }

    async function duplicateCurrentNote() {
      if (!currentNoteId) return;
      const original = notes.find(n => n.id === currentNoteId);
      if (!original) return;
      const newNote = { ...original, id: generateId(), title: (original.title||'') + ' (copy)', createdAt: Date.now(), updatedAt: Date.now() };
      let allNotes = await localforage.getItem('notes') || [];
      allNotes.push(newNote);
      await localforage.setItem('notes', allNotes);
      notes = allNotes;
      await updateStorageUsage();
      refreshCategoryUI();
      renderNotesList();
      loadNoteToEditor(newNote);
    }

    function closeSidebar() {
      sidebar.classList.remove('open');
      overlay.classList.remove('show');
    }

    async function initialize() {
      const storedNotes = await localforage.getItem('notes') || [];
      notes = storedNotes;
      notes.forEach(n => { if (n.category) categoriesSet.add(n.category); });
      refreshCategoryUI();
      renderNotesList();
      await updateStorageUsage();
      if (notes.length > 0) {
        loadNoteToEditor(notes[0]);
      } else {
        const welcome = {
          id: generateId(), title: '✨ Welcome to Memora', category: 'Personal',
          contentDelta: JSON.stringify({ ops: [{ insert: 'Your advanced notebook with 5GB storage, speech & dark mode.\n' }] }),
          plainText: 'Your advanced notebook ready.', createdAt: Date.now(), updatedAt: Date.now()
        };
        await localforage.setItem('notes', [welcome]);
        notes = [welcome]; categoriesSet.add('Personal');
        refreshCategoryUI(); renderNotesList(); loadNoteToEditor(welcome);
        await updateStorageUsage();
      }
    }

    quill.on('text-change', () => { updateEditorMeta(); autoSave(); });
    noteTitleInput.addEventListener('input', autoSave);
    categoryInput.addEventListener('input', () => { categoriesSet.add(categoryInput.value.trim()); autoSave(); });
    searchInput.addEventListener('input', renderNotesList);
    categoryFilter.addEventListener('change', renderNotesList);
    
    newBtn.addEventListener('click', () => { clearEditor(); noteTitleInput.focus(); if(window.innerWidth<=800) closeSidebar(); });
    deleteBtn.addEventListener('click', deleteCurrentNote);
    duplicateBtn.addEventListener('click', duplicateCurrentNote);

    darkToggle.addEventListener('click', () => {
      document.body.classList.toggle('dark');
      const icon = darkToggle.querySelector('i');
      icon.classList.toggle('fa-moon');
      icon.classList.toggle('fa-sun');
    });

    exportBtn.addEventListener('click', async () => {
      const all = await localforage.getItem('notes') || [];
      const blob = new Blob([JSON.stringify(all, null, 2)], {type: 'application/json'});
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `memora_backup_${new Date().toISOString().slice(0,10)}.json`;
      a.click();
    });
    
    importBtn.addEventListener('click', () => importFileInput.click());
    importFileInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async (ev) => {
        try {
          const imported = JSON.parse(ev.target.result);
          if (Array.isArray(imported) && confirm('Replace current notes?')) {
            await localforage.setItem('notes', imported);
            notes = imported; categoriesSet.clear();
            imported.forEach(n => { if(n.category) categoriesSet.add(n.category); });
            refreshCategoryUI(); renderNotesList(); await updateStorageUsage();
            if(notes.length) loadNoteToEditor(notes[0]); else clearEditor();
          }
        } catch(err) { alert('Invalid file'); }
        importFileInput.value = '';
      };
      reader.readAsText(file);
    });
    
    clearAllBtn.addEventListener('click', async () => {
      if (confirm('Delete ALL notes permanently?')) {
        await localforage.setItem('notes', []);
        notes = []; categoriesSet.clear();
        refreshCategoryUI(); renderNotesList(); await updateStorageUsage();
        clearEditor();
      }
    });

    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false; recognition.interimResults = false; recognition.lang = 'en-US';
      voiceBtn.addEventListener('click', () => {
        recognition.start();
        voiceBtn.innerHTML = '<i class="fas fa-microphone-alt fa-beat"></i> Listening...';
      });
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        const range = quill.getSelection(true);
        quill.insertText(range.index, transcript);
        voiceBtn.innerHTML = '<i class="fas fa-microphone"></i> Dictate';
      };
      recognition.onerror = recognition.onend = () => { voiceBtn.innerHTML = '<i class="fas fa-microphone"></i> Dictate'; };
    } else {
      voiceBtn.style.display = 'none';
    }

    menuToggle.addEventListener('click', () => {
      sidebar.classList.toggle('open');
      overlay.classList.toggle('show');
    });
    overlay.addEventListener('click', closeSidebar);

    window.addEventListener('beforeunload', () => { if (debounceTimer) saveCurrentNote(); });
    initialize();
  })();