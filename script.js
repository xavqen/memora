(function () {
    "use strict";

    // ---------- CONFIG & STORAGE ----------
    localforage.config({ name: 'MemoraNotebook', storeName: 'notes_store' });
    const MAX_STORAGE_BYTES = 5 * 1024 * 1024 * 1024; // 5 GB

    // Quill instance
    const quill = new Quill('#quillEditor', {
        theme: 'snow',
        placeholder: 'Write your thoughts, ideas, or powerful notes...',
        modules: {
            toolbar: [
                [{ header: [1, 2, 3, false] }],
                ['bold', 'italic', 'underline', 'strike'],
                [{ list: 'ordered' }, { list: 'bullet' }],
                ['blockquote', 'code-block'],
                ['link', 'image'],
                [{ color: [] }, { background: [] }],
                ['clean']
            ]
        }
    });

    // State
    let notes = [];                // array of note objects
    let currentNoteId = null;
    let isSaving = false;
    let unsavedChanges = false;
    let debounceTimer = null;
    const categoriesSet = new Set();

    // DOM elements
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

    // ---------- UTILS ----------
    function generateId() { return Date.now() + '-' + Math.random().toString(36).substr(2, 8); }

    function formatBytes(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
        return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
    }

    // Update storage display
    async function updateStorageUsage() {
        const allNotes = await localforage.getItem('notes') || [];
        let totalSize = 0;
        for (let n of allNotes) {
            totalSize += new Blob([JSON.stringify(n)]).size;
        }
        const usedMB = totalSize / (1024 * 1024);
        const percent = (totalSize / MAX_STORAGE_BYTES) * 100;
        storageText.innerText = `${formatBytes(totalSize)} / 5 GB`;
        storageBar.style.width = Math.min(percent, 100) + '%';
        return totalSize;
    }

    // Refresh categories datalist & filter dropdown
    function refreshCategoryUI() {
        const cats = Array.from(categoriesSet).sort();
        categoryDatalist.innerHTML = cats.map(c => `<option value="${c}">`).join('');
        const currentFilter = categoryFilter.value;
        categoryFilter.innerHTML = '<option value="ALL">All categories</option>';
        cats.forEach(c => { categoryFilter.innerHTML += `<option value="${c}">${c}</option>`; });
        if (cats.includes(currentFilter)) categoryFilter.value = currentFilter;
        else categoryFilter.value = 'ALL';
    }

    // Update word count & last modified
    function updateEditorMeta() {
        const text = quill.getText();
        const words = text.trim().split(/\s+/).filter(w => w.length).length;
        const chars = text.replace(/\s/g, '').length;
        wordCountDisplay.innerText = `${words} words · ${chars} chars`;
    }

    // Load note into editor
    function loadNoteToEditor(note) {
        if (!note) return;
        currentNoteId = note.id;
        noteTitleInput.value = note.title || 'Untitled';
        categoryInput.value = note.category || '';

        try {
            if (note.contentDelta) quill.setContents(JSON.parse(note.contentDelta));
            else quill.setText('');
        } catch (e) { quill.setText(''); }

        if (note.updatedAt) {
            lastModifiedSpan.innerText = new Date(note.updatedAt).toLocaleString();
        } else lastModifiedSpan.innerText = '—';
        updateEditorMeta();
        saveStatusEl.innerHTML = '<i class="fas fa-check-circle"></i> Saved';
        highlightActiveNote(note.id);
    }

    // Clear editor for new note
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
            el.classList.remove('active');
            if (el.dataset.id === id) el.classList.add('active');
        });
    }

    // Save current editor content to DB
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
            if (existing) {
                note = { ...existing, title, category, contentDelta, plainText, updatedAt: Date.now() };
            } else {
                note = { id: generateId(), title, category, contentDelta, plainText, createdAt: Date.now(), updatedAt: Date.now() };
            }
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
        } catch (e) {
            saveStatusEl.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Error';
            console.warn(e);
        } finally {
            isSaving = false;
        }
    }

    // Debounced auto-save
    function autoSave() {
        if (debounceTimer) clearTimeout(debounceTimer);
        saveStatusEl.innerHTML = '<i class="fas fa-edit"></i> Unsaved';
        debounceTimer = setTimeout(() => { saveCurrentNote(); }, 700);
    }

    // Render notes list with filter/search
    function renderNotesList() {
        const searchTerm = searchInput.value.toLowerCase();
        const catFilter = categoryFilter.value;

        const filtered = notes.filter(n => {
            const matchSearch = n.title.toLowerCase().includes(searchTerm) || (n.plainText || '').toLowerCase().includes(searchTerm);
            const matchCat = (catFilter === 'ALL' || n.category === catFilter);
            return matchSearch && matchCat;
        }).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));

        notesContainer.innerHTML = filtered.map(n => `
        <div class="note-item" data-id="${n.id}">
          <div class="note-title">${n.title || 'Untitled'}</div>
          <div class="note-meta">
            <span>${n.plainText ? n.plainText.substring(0, 35) + '…' : 'Empty note'}</span>
            <span class="category-badge">${n.category || 'General'}</span>
          </div>
        </div>
      `).join('');

        document.querySelectorAll('.note-item').forEach(el => {
            el.addEventListener('click', () => {
                const id = el.dataset.id;
                const note = notes.find(n => n.id === id);
                if (note) loadNoteToEditor(note);
            });
        });
        if (currentNoteId) highlightActiveNote(currentNoteId);
    }

    // Delete note
    async function deleteCurrentNote() {
        if (!currentNoteId) return;
        if (!confirm('Delete this note?')) return;
        let allNotes = await localforage.getItem('notes') || [];
        allNotes = allNotes.filter(n => n.id !== currentNoteId);
        await localforage.setItem('notes', allNotes);
        notes = allNotes;
        clearEditor();
        await updateStorageUsage();
        refreshCategoryUI();
        renderNotesList();
    }

    // Duplicate note
    async function duplicateCurrentNote() {
        if (!currentNoteId) return;
        const original = notes.find(n => n.id === currentNoteId);
        if (!original) return;
        const newNote = {
            ...original,
            id: generateId(),
            title: (original.title || '') + ' (copy)',
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
        let allNotes = await localforage.getItem('notes') || [];
        allNotes.push(newNote);
        await localforage.setItem('notes', allNotes);
        notes = allNotes;
        await updateStorageUsage();
        refreshCategoryUI();
        renderNotesList();
        loadNoteToEditor(newNote);
    }

    // ---------- INITIAL LOAD ----------
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
            // create welcome note
            const welcome = {
                id: generateId(),
                title: '✨ Welcome to Memora',
                category: 'Personal',
                contentDelta: JSON.stringify({ ops: [{ insert: 'Your powerful notebook is ready. Start writing, dictate, and enjoy 5GB storage.\n' }] }),
                plainText: 'Your powerful notebook is ready.',
                createdAt: Date.now(),
                updatedAt: Date.now()
            };
            await localforage.setItem('notes', [welcome]);
            notes = [welcome];
            categoriesSet.add('Personal');
            refreshCategoryUI();
            renderNotesList();
            loadNoteToEditor(welcome);
            await updateStorageUsage();
        }
    }

    // ---------- EVENT LISTENERS ----------
    quill.on('text-change', () => {
        updateEditorMeta();
        autoSave();
    });
    noteTitleInput.addEventListener('input', autoSave);
    categoryInput.addEventListener('input', () => { categoriesSet.add(categoryInput.value.trim()); autoSave(); });

    searchInput.addEventListener('input', renderNotesList);
    categoryFilter.addEventListener('change', renderNotesList);

    newBtn.addEventListener('click', () => {
        if (currentNoteId) autoSave.flush && saveCurrentNote();
        clearEditor();
        noteTitleInput.focus();
    });

    deleteBtn.addEventListener('click', deleteCurrentNote);
    duplicateBtn.addEventListener('click', duplicateCurrentNote);

    // Dark mode
    darkToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark');
        const icon = darkToggle.querySelector('i');
        if (document.body.classList.contains('dark')) {
            icon.classList.remove('fa-moon'); icon.classList.add('fa-sun');
        } else {
            icon.classList.remove('fa-sun'); icon.classList.add('fa-moon');
        }
    });

    // Export / Import
    exportBtn.addEventListener('click', async () => {
        const all = await localforage.getItem('notes') || [];
        const blob = new Blob([JSON.stringify(all, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `memora_backup_${new Date().toISOString().slice(0, 10)}.json`;
        a.click(); URL.revokeObjectURL(url);
    });

    importBtn.addEventListener('click', () => importFileInput.click());
    importFileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (ev) => {
            try {
                const imported = JSON.parse(ev.target.result);
                if (Array.isArray(imported)) {
                    if (confirm('Import will replace current notes. Continue?')) {
                        await localforage.setItem('notes', imported);
                        notes = imported;
                        categoriesSet.clear(); imported.forEach(n => { if (n.category) categoriesSet.add(n.category); });
                        refreshCategoryUI(); renderNotesList(); await updateStorageUsage();
                        if (notes.length) loadNoteToEditor(notes[0]); else clearEditor();
                    }
                }
            } catch (err) { alert('Invalid backup file'); }
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

    // Voice dictation
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
        recognition.onerror = () => { voiceBtn.innerHTML = '<i class="fas fa-microphone"></i> Dictate'; };
        recognition.onend = () => { voiceBtn.innerHTML = '<i class="fas fa-microphone"></i> Dictate'; };
    } else {
        voiceBtn.style.display = 'none';
    }

    // Additional auto-save on category change, and update categories
    window.addEventListener('beforeunload', () => { if (debounceTimer) saveCurrentNote(); });

    initialize();
})();