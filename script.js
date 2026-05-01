(function () {
  "use strict";

  const { jsPDF } = window.jspdf;

  // ============ LANGUAGE CONFIGURATION ============
  const LANGUAGES = [
    { code: 'en-US', name: 'English (US)', native: 'English', flag: '🇺🇸' },
    { code: 'en-GB', name: 'English (UK)', native: 'English (UK)', flag: '🇬🇧' },
    { code: 'hi-IN', name: 'Hindi', native: 'हिन्दी', flag: '🇮🇳' },
    { code: 'bn-IN', name: 'Bengali', native: 'বাংলা', flag: '🇧🇩' },
    { code: 'te-IN', name: 'Telugu', native: 'తెలుగు', flag: '🇮🇳' },
    { code: 'ta-IN', name: 'Tamil', native: 'தமிழ்', flag: '🇮🇳' },
    { code: 'mr-IN', name: 'Marathi', native: 'मराठी', flag: '🇮🇳' },
    { code: 'gu-IN', name: 'Gujarati', native: 'ગુજરાતી', flag: '🇮🇳' },
    { code: 'kn-IN', name: 'Kannada', native: 'ಕನ್ನಡ', flag: '🇮🇳' },
    { code: 'ml-IN', name: 'Malayalam', native: 'മലയാളം', flag: '🇮🇳' },
    { code: 'pa-IN', name: 'Punjabi', native: 'ਪੰਜਾਬੀ', flag: '🇮🇳' },
    { code: 'ur-PK', name: 'Urdu', native: 'اردو', flag: '🇵🇰' },
    { code: 'ar-SA', name: 'Arabic', native: 'العربية', flag: '🇸🇦' },
    { code: 'zh-CN', name: 'Chinese (Simplified)', native: '简体中文', flag: '🇨🇳' },
    { code: 'zh-TW', name: 'Chinese (Traditional)', native: '繁體中文', flag: '🇹🇼' },
    { code: 'ja-JP', name: 'Japanese', native: '日本語', flag: '🇯🇵' },
    { code: 'ko-KR', name: 'Korean', native: '한국어', flag: '🇰🇷' },
    { code: 'th-TH', name: 'Thai', native: 'ไทย', flag: '🇹🇭' },
    { code: 'vi-VN', name: 'Vietnamese', native: 'Tiếng Việt', flag: '🇻🇳' },
    { code: 'id-ID', name: 'Indonesian', native: 'Bahasa Indonesia', flag: '🇮🇩' },
    { code: 'ms-MY', name: 'Malay', native: 'Bahasa Melayu', flag: '🇲🇾' },
    { code: 'fil-PH', name: 'Filipino', native: 'Filipino', flag: '🇵🇭' },
    { code: 'es-ES', name: 'Spanish', native: 'Español', flag: '🇪🇸' },
    { code: 'es-MX', name: 'Spanish (Mexico)', native: 'Español (MX)', flag: '🇲🇽' },
    { code: 'fr-FR', name: 'French', native: 'Français', flag: '🇫🇷' },
    { code: 'de-DE', name: 'German', native: 'Deutsch', flag: '🇩🇪' },
    { code: 'pt-BR', name: 'Portuguese (Brazil)', native: 'Português', flag: '🇧🇷' },
    { code: 'pt-PT', name: 'Portuguese (Portugal)', native: 'Português (PT)', flag: '🇵🇹' },
    { code: 'it-IT', name: 'Italian', native: 'Italiano', flag: '🇮🇹' },
    { code: 'ru-RU', name: 'Russian', native: 'Русский', flag: '🇷🇺' },
    { code: 'tr-TR', name: 'Turkish', native: 'Türkçe', flag: '🇹🇷' },
    { code: 'nl-NL', name: 'Dutch', native: 'Nederlands', flag: '🇳🇱' },
    { code: 'pl-PL', name: 'Polish', native: 'Polski', flag: '🇵🇱' },
    { code: 'sv-SE', name: 'Swedish', native: 'Svenska', flag: '🇸🇪' },
    { code: 'no-NO', name: 'Norwegian', native: 'Norsk', flag: '🇳🇴' },
    { code: 'da-DK', name: 'Danish', native: 'Dansk', flag: '🇩🇰' },
    { code: 'fi-FI', name: 'Finnish', native: 'Suomi', flag: '🇫🇮' },
    { code: 'el-GR', name: 'Greek', native: 'Ελληνικά', flag: '🇬🇷' },
    { code: 'he-IL', name: 'Hebrew', native: 'עברית', flag: '🇮🇱' },
    { code: 'sw-KE', name: 'Swahili', native: 'Kiswahili', flag: '🇰🇪' },
    { code: 'af-ZA', name: 'Afrikaans', native: 'Afrikaans', flag: '🇿🇦' }
  ];

  const FONTS = [
    { name: 'Inter', family: "'Inter', sans-serif" },
    { name: 'Noto Sans', family: "'Noto Sans', sans-serif" },
    { name: 'Noto Sans Arabic', family: "'Noto Sans Arabic', sans-serif" },
    { name: 'Noto Sans SC', family: "'Noto Sans SC', sans-serif" },
    { name: 'Noto Sans JP', family: "'Noto Sans JP', sans-serif" },
    { name: 'Noto Sans KR', family: "'Noto Sans KR', sans-serif" },
    { name: 'Noto Sans Devanagari', family: "'Noto Sans Devanagari', sans-serif" },
    { name: 'Noto Sans Thai', family: "'Noto Sans Thai', sans-serif" },
    { name: 'Georgia', family: 'Georgia, serif' },
    { name: 'Courier New', family: "'Courier New', monospace" },
    { name: 'Arial', family: 'Arial, sans-serif' }
  ];

  // ============ STORAGE & STATE ============
  localforage.config({ name: 'MemoraUltimate', storeName: 'notes_store' });
  const MAX_STORAGE_BYTES = 5 * 1024 * 1024 * 1024;

  const quill = new Quill('#quillEditor', {
    theme: 'snow',
    placeholder: 'Start writing in any language...',
    modules: {
      toolbar: [
        [{ header: [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        ['blockquote', 'code-block'],
        ['link', 'image'],
        [{ color: [] }, { background: [] }],
        [{ align: [] }],
        [{ indent: '-1' }, { indent: '+1' }],
        ['clean']
      ]
    }
  });

  let notes = [];
  let currentNoteId = null;
  let isSaving = false;
  let debounceTimer = null;
  let pendingPdfExport = null;
  let selectedLanguage = localStorage.getItem('memora_language') || 'en-US';
  let selectedFont = localStorage.getItem('memora_font') || 'Inter';
  let wordGoal = parseInt(localStorage.getItem('memora_word_goal')) || 0;
  let isRecording = false;
  let recognitionInstance = null;
  const categoriesSet = new Set();
  const favoritesSet = new Set(JSON.parse(localStorage.getItem('memora_favorites') || '[]'));
  const pinnedSet = new Set(JSON.parse(localStorage.getItem('memora_pinned') || '[]'));

  // ============ DOM ELEMENTS ============
  const notesContainer = document.getElementById('notesListContainer');
  const searchInput = document.getElementById('searchInput');
  const categoryFilter = document.getElementById('categoryFilterSelect');
  const sortOrderSelect = document.getElementById('sortOrderSelect');
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
  const exportOptions = document.getElementById('exportOptions');
  const importBtn = document.getElementById('importBtn');
  const importFileInput = document.getElementById('importFileInput');
  const clearAllBtn = document.getElementById('clearAllBtn');
  const duplicateBtn = document.getElementById('duplicateNoteBtn');
  const voiceBtn = document.getElementById('voiceDictationBtn');
  const micStatusText = document.getElementById('micStatusText');
  const menuToggle = document.getElementById('menuToggle');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  const pdfModal = document.getElementById('pdfModal');
  const closePdfModal = document.getElementById('closePdfModal');
  const pdfPreviewContent = document.getElementById('pdfPreviewContent');
  const downloadPdfBtn = document.getElementById('downloadPdfBtn');
  const statsModal = document.getElementById('statsModal');
  const closeStatsModal = document.getElementById('closeStatsModal');
  const statsBtn = document.getElementById('statsBtn');
  const readingTimeDisplay = document.getElementById('readingTimeDisplay');
  const noteCreatedDisplay = document.getElementById('noteCreatedDisplay');
  const goalProgressDisplay = document.getElementById('goalProgressDisplay');
  const wordGoalInput = document.getElementById('wordGoalInput');
  const wordGoalDisplay = document.getElementById('wordGoalDisplay');
  const favoriteBtn = document.getElementById('favoriteBtn');
  const pinBtn = document.getElementById('pinBtn');
  const languagePanel = document.getElementById('languagePanel');
  const languageDropdown = document.getElementById('languageDropdown');
  const currentLanguageDisplay = document.getElementById('currentLanguageDisplay');
  const fontPanel = document.getElementById('fontPanel');
  const fontDropdown = document.getElementById('fontDropdown');
  const currentFontDisplay = document.getElementById('currentFontDisplay');

  // ============ UTILITIES ============
  function generateId() { return Date.now() + '-' + Math.random().toString(36).substr(2, 8); }

  function formatBytes(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
  }

  function showToast(msg, type = 'info') {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : 'info-circle'}"></i> ${msg}`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
  }

  // ============ LANGUAGE & FONT ============
  function buildLanguageDropdown() {
    languageDropdown.innerHTML = LANGUAGES.map(l => `
        <div class="language-option ${l.code === selectedLanguage ? 'selected' : ''}" data-code="${l.code}">
          <span>${l.flag}</span> ${l.native} <small style="opacity:0.6; margin-left:auto;">${l.name}</small>
        </div>
      `).join('');

    languageDropdown.querySelectorAll('.language-option').forEach(opt => {
      opt.addEventListener('click', (e) => {
        e.stopPropagation();
        const code = opt.dataset.code;
        selectedLanguage = code;
        localStorage.setItem('memora_language', code);
        updateLanguageDisplay();
        languageDropdown.classList.remove('show');
        setupSpeechRecognition();
        showToast(`Language set to ${LANGUAGES.find(l => l.code === code)?.native || code}`, 'success');
      });
    });
  }

  function updateLanguageDisplay() {
    const lang = LANGUAGES.find(l => l.code === selectedLanguage) || LANGUAGES[0];
    currentLanguageDisplay.textContent = `${lang.flag} ${lang.native}`;
    document.querySelectorAll('.language-option').forEach(o => o.classList.toggle('selected', o.dataset.code === selectedLanguage));
  }

  function buildFontDropdown() {
    fontDropdown.innerHTML = FONTS.map(f => `
        <div class="font-option ${f.name === selectedFont ? 'selected' : ''}" data-font="${f.name}" style="font-family:${f.family}">
          ${f.name}
        </div>
      `).join('');

    fontDropdown.querySelectorAll('.font-option').forEach(opt => {
      opt.addEventListener('click', (e) => {
        e.stopPropagation();
        const font = opt.dataset.font;
        selectedFont = font;
        localStorage.setItem('memora_font', font);
        updateFontDisplay();
        fontDropdown.classList.remove('show');
        applyFontToEditor();
        showToast(`Font set to ${font}`, 'success');
      });
    });
  }

  function updateFontDisplay() {
    currentFontDisplay.textContent = selectedFont;
    document.querySelectorAll('.font-option').forEach(o => o.classList.toggle('selected', o.dataset.font === selectedFont));
  }

  function applyFontToEditor() {
    const fontObj = FONTS.find(f => f.name === selectedFont);
    if (fontObj) {
      document.querySelector('.ql-editor').style.fontFamily = fontObj.family;
      document.querySelector('.ql-editor').style.fontSize = '1rem';
    }
  }

  // ============ SPEECH RECOGNITION ============
  function setupSpeechRecognition() {
    if (recognitionInstance) {
      try { recognitionInstance.abort(); } catch (e) { }
      recognitionInstance = null;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      voiceBtn.style.display = 'none';
      micStatusText.textContent = '';
      return;
    }

    voiceBtn.style.display = 'flex';
    recognitionInstance = new SpeechRecognition();
    recognitionInstance.continuous = true;
    recognitionInstance.interimResults = true;
    recognitionInstance.lang = selectedLanguage;
    recognitionInstance.maxAlternatives = 1;

    recognitionInstance.onstart = () => {
      isRecording = true;
      voiceBtn.classList.add('recording');
      voiceBtn.innerHTML = '<i class="fas fa-microphone-alt fa-beat"></i> Recording...';
      micStatusText.textContent = '🎙️ Listening...';
      showToast('Voice dictation active', 'info');
    };

    recognitionInstance.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      if (finalTranscript) {
        const range = quill.getSelection(true);
        quill.insertText(range.index, finalTranscript);
        quill.setSelection(range.index + finalTranscript.length);
      }
      if (interimTranscript) {
        micStatusText.textContent = `💬 ${interimTranscript.substring(0, 40)}...`;
      }
    };

    recognitionInstance.onerror = (event) => {
      console.warn('Speech error:', event.error);
      stopRecording();
      if (event.error === 'not-allowed') {
        showToast('Microphone access denied', 'error');
      } else if (event.error === 'language-not-supported') {
        showToast(`Language not supported for dictation: ${selectedLanguage}. Try another.`, 'error');
      }
    };

    recognitionInstance.onend = () => {
      if (isRecording) {
        stopRecording();
      }
    };
  }

  function startRecording() {
    if (!recognitionInstance) {
      setupSpeechRecognition();
    }
    if (recognitionInstance) {
      try {
        recognitionInstance.lang = selectedLanguage;
        recognitionInstance.start();
      } catch (e) {
        console.warn('Recognition start error:', e);
      }
    }
  }

  function stopRecording() {
    isRecording = false;
    voiceBtn.classList.remove('recording');
    voiceBtn.innerHTML = '<i class="fas fa-microphone"></i> Dictate';
    micStatusText.textContent = '';
    if (recognitionInstance) {
      try { recognitionInstance.stop(); } catch (e) { }
    }
  }

  // ============ STORAGE & NOTES ============
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
    categoryFilter.innerHTML = '<option value="ALL">📂 All Categories</option>';
    cats.forEach(c => { categoryFilter.innerHTML += `<option value="${c}">${c}</option>`; });
    categoryFilter.value = cats.includes(currentFilter) ? currentFilter : 'ALL';
  }

  function updateEditorMeta() {
    const text = quill.getText();
    const words = text.trim().split(/\s+/).filter(w => w.length).length;
    const chars = text.replace(/\s/g, '').length;
    wordCountDisplay.innerText = `${words} words · ${chars} chars`;

    // Reading time (avg 200 wpm)
    const readingTime = Math.max(1, Math.ceil(words / 200));
    readingTimeDisplay.textContent = `Read: ${readingTime} min`;

    // Word goal progress
    if (wordGoal > 0) {
      const progress = Math.min(100, Math.round((words / wordGoal) * 100));
      goalProgressDisplay.textContent = `🎯 ${progress}% of ${wordGoal} words`;
      goalProgressDisplay.style.color = progress >= 100 ? '#2fa36b' : '#e67e22';
    } else {
      goalProgressDisplay.textContent = '';
    }
    wordGoalDisplay.textContent = wordGoal > 0 ? `Goal: ${wordGoal}` : 'Goal: --';
  }

  function loadNoteToEditor(note) {
    if (!note) return;
    currentNoteId = note.id;
    noteTitleInput.value = note.title || 'Untitled';
    categoryInput.value = note.category || '';
    try {
      quill.setContents(note.contentDelta ? JSON.parse(note.contentDelta) : []);
    } catch (e) { quill.setText(''); }
    lastModifiedSpan.innerText = note.updatedAt ? new Date(note.updatedAt).toLocaleString() : '—';
    document.getElementById('createdDateSpan').textContent = note.createdAt ? new Date(note.createdAt).toLocaleString() : '—';
    noteCreatedDisplay.textContent = note.createdAt ? `Created: ${new Date(note.createdAt).toLocaleDateString()}` : 'Created: --';
    updateEditorMeta();
    saveStatusEl.innerHTML = '<i class="fas fa-check-circle"></i> Saved';
    saveStatusEl.className = 'status-saved';
    highlightActiveNote(note.id);
    updateFavoriteButton();
    updatePinButton();
    applyFontToEditor();
  }

  function clearEditor() {
    currentNoteId = null;
    noteTitleInput.value = '';
    categoryInput.value = '';
    quill.setText('');
    lastModifiedSpan.innerText = '—';
    document.getElementById('createdDateSpan').textContent = '—';
    noteCreatedDisplay.textContent = 'Created: --';
    updateEditorMeta();
    saveStatusEl.innerHTML = '<i class="fas fa-pencil"></i> New';
    saveStatusEl.className = 'status-unsaved';
    highlightActiveNote(null);
    updateFavoriteButton();
    updatePinButton();
  }

  function highlightActiveNote(id) {
    document.querySelectorAll('.note-item').forEach(el => {
      el.classList.toggle('active', el.dataset.id === id);
    });
  }

  function updateFavoriteButton() {
    const isFav = currentNoteId && favoritesSet.has(currentNoteId);
    favoriteBtn.innerHTML = isFav ? '<i class="fas fa-star" style="color:#f39c12;"></i>' : '<i class="far fa-star"></i>';
  }

  function updatePinButton() {
    const isPinned = currentNoteId && pinnedSet.has(currentNoteId);
    pinBtn.innerHTML = isPinned ? '<i class="fas fa-thumbtack" style="color:#e74c3c;"></i>' : '<i class="fas fa-thumbtack"></i>';
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
      document.getElementById('createdDateSpan').textContent = new Date(note.createdAt).toLocaleString();
      noteCreatedDisplay.textContent = `Created: ${new Date(note.createdAt).toLocaleDateString()}`;
      saveStatusEl.innerHTML = '<i class="fas fa-check-circle"></i> Saved';
      saveStatusEl.className = 'status-saved';
    } catch (e) {
      saveStatusEl.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Error';
    } finally {
      isSaving = false;
    }
  }

  function autoSave() {
    if (debounceTimer) clearTimeout(debounceTimer);
    saveStatusEl.innerHTML = '<i class="fas fa-edit"></i> Unsaved';
    saveStatusEl.className = 'status-unsaved';
    debounceTimer = setTimeout(() => saveCurrentNote(), 600);
  }

  function renderNotesList() {
    const searchTerm = searchInput.value.toLowerCase();
    const catFilter = categoryFilter.value;
    const sortOrder = sortOrderSelect.value;

    let filtered = notes.filter(n => {
      const matchSearch = (n.title || '').toLowerCase().includes(searchTerm) || (n.plainText || '').toLowerCase().includes(searchTerm);
      const matchCat = (catFilter === 'ALL' || n.category === catFilter);
      return matchSearch && matchCat;
    });

    // Sort pinned first
    filtered.sort((a, b) => {
      const aPinned = pinnedSet.has(a.id) ? 1 : 0;
      const bPinned = pinnedSet.has(b.id) ? 1 : 0;
      if (aPinned !== bPinned) return bPinned - aPinned;

      switch (sortOrder) {
        case 'oldest': return (a.updatedAt || 0) - (b.updatedAt || 0);
        case 'az': return (a.title || '').localeCompare(b.title || '');
        case 'za': return (b.title || '').localeCompare(a.title || '');
        default: return (b.updatedAt || 0) - (a.updatedAt || 0);
      }
    });

    notesContainer.innerHTML = filtered.map(n => {
      const isFav = favoritesSet.has(n.id);
      const isPinned = pinnedSet.has(n.id);
      return `
          <div class="note-item" data-id="${n.id}">
            <div class="note-title">
              ${isPinned ? '<i class="fas fa-thumbtack" style="font-size:0.7rem; color:#e74c3c;"></i> ' : ''}
              ${isFav ? '<i class="fas fa-star" style="font-size:0.7rem; color:#f39c12;"></i> ' : ''}
              ${n.title || 'Untitled'}
            </div>
            <div class="note-meta">
              <span class="note-preview">${n.plainText ? n.plainText.substring(0, 40) + '…' : 'Empty note'}</span>
              <span class="category-badge">${n.category || 'General'}</span>
              <span class="note-date">${new Date(n.updatedAt).toLocaleDateString()}</span>
            </div>
          </div>
        `;
    }).join('');

    document.querySelectorAll('.note-item').forEach(el => {
      el.addEventListener('click', () => {
        const note = notes.find(n => n.id === el.dataset.id);
        if (note) loadNoteToEditor(note);
        if (window.innerWidth <= 900) closeSidebar();
      });
    });
    if (currentNoteId) highlightActiveNote(currentNoteId);
  }

  async function deleteCurrentNote() {
    if (!currentNoteId || !confirm('Delete this note permanently?')) return;
    let allNotes = await localforage.getItem('notes') || [];
    allNotes = allNotes.filter(n => n.id !== currentNoteId);
    await localforage.setItem('notes', allNotes);
    notes = allNotes;
    favoritesSet.delete(currentNoteId);
    pinnedSet.delete(currentNoteId);
    saveFavoritesAndPins();
    clearEditor();
    await updateStorageUsage();
    refreshCategoryUI();
    renderNotesList();
    showToast('Note deleted', 'success');
  }

  async function duplicateCurrentNote() {
    if (!currentNoteId) return;
    const original = notes.find(n => n.id === currentNoteId);
    if (!original) return;
    const newNote = { ...original, id: generateId(), title: (original.title || '') + ' (copy)', createdAt: Date.now(), updatedAt: Date.now() };
    let allNotes = await localforage.getItem('notes') || [];
    allNotes.push(newNote);
    await localforage.setItem('notes', allNotes);
    notes = allNotes;
    await updateStorageUsage();
    refreshCategoryUI();
    renderNotesList();
    loadNoteToEditor(newNote);
    showToast('Note duplicated', 'success');
  }

  function saveFavoritesAndPins() {
    localStorage.setItem('memora_favorites', JSON.stringify([...favoritesSet]));
    localStorage.setItem('memora_pinned', JSON.stringify([...pinnedSet]));
  }

  function closeSidebar() {
    sidebar.classList.remove('open');
    overlay.classList.remove('show');
  }

  // ============ PDF EXPORT ============
  function getNoteHtmlContent(note) {
    const title = note.title || 'Untitled';
    const category = note.category || 'General';
    const date = note.updatedAt ? new Date(note.updatedAt).toLocaleString() : 'Unknown';
    let contentHtml = '';
    try {
      const delta = note.contentDelta ? JSON.parse(note.contentDelta) : null;
      if (delta) {
        const tempQuill = document.createElement('div');
        const tempEditor = new Quill(tempQuill);
        tempEditor.setContents(delta);
        contentHtml = tempEditor.root.innerHTML;
      }
    } catch (e) {
      contentHtml = (note.plainText || '').replace(/\n/g, '<br>');
    }
    return `
        <div style="font-family: 'Inter', sans-serif; padding: 20px; color: #1e1e2f;">
          <h1 style="color: #3a41b0; margin-bottom: 5px;">${title}</h1>
          <p style="color: #6b6f8f; margin-bottom: 15px;"><strong>Category:</strong> ${category} | <strong>Modified:</strong> ${date}</p>
          <hr style="border: 1px solid #e0e0f0; margin-bottom: 15px;">
          <div style="font-size: 1rem; line-height: 1.7;">${contentHtml}</div>
        </div>`;
  }

  async function generatePdfForNotes(notesToExport) {
    if (!notesToExport || notesToExport.length === 0) return null;
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 15;

    for (let i = 0; i < notesToExport.length; i++) {
      const note = notesToExport[i];
      const container = document.createElement('div');
      container.innerHTML = getNoteHtmlContent(note);
      container.style.width = (pageWidth - margin * 2) + 'mm';
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.backgroundColor = 'white';
      document.body.appendChild(container);
      try {
        const canvas = await html2canvas(container, { scale: 2, useCORS: true, logging: false, backgroundColor: '#ffffff' });
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = pageWidth - margin * 2;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        if (i > 0) pdf.addPage();
        let heightLeft = imgHeight;
        let position = margin;
        pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
        heightLeft -= (pageHeight - margin * 2);
        while (heightLeft > 0) {
          position = margin - (imgHeight - heightLeft);
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
          heightLeft -= (pageHeight - margin * 2);
        }
      } catch (e) {
        if (i > 0) pdf.addPage();
        pdf.setFontSize(14);
        pdf.text(note.title || 'Untitled', margin, 25);
      }
      document.body.removeChild(container);
    }
    return pdf;
  }

  function showPdfPreview(notesToPreview) {
    if (!notesToPreview || notesToPreview.length === 0) { alert('No notes to preview.'); return; }
    pdfPreviewContent.innerHTML = notesToPreview.map((n, i) => `
        <div style="margin-bottom:14px; padding-bottom:10px; border-bottom:2px dashed #e0e0f0;">
          <h4>${i + 1}. ${n.title || 'Untitled'}</h4>
          <small>${n.category || 'General'} | ${new Date(n.updatedAt).toLocaleString()}</small>
          <p>${(n.plainText || '').substring(0, 120)}...</p>
        </div>`).join('');
    pendingPdfExport = notesToPreview;
    pdfModal.classList.add('show');
  }

  // ============ STATISTICS ============
  function updateStatsModal() {
    document.getElementById('statTotalNotes').textContent = notes.length;
    const totalWords = notes.reduce((sum, n) => sum + ((n.plainText || '').trim().split(/\s+/).filter(w => w.length).length), 0);
    document.getElementById('statTotalWords').textContent = totalWords;
    document.getElementById('statCategories').textContent = categoriesSet.size;
    document.getElementById('statFavorites').textContent = favoritesSet.size;
  }

  // ============ EVENT LISTENERS ============
  quill.on('text-change', () => { updateEditorMeta(); autoSave(); });
  noteTitleInput.addEventListener('input', autoSave);
  categoryInput.addEventListener('input', () => { categoriesSet.add(categoryInput.value.trim()); autoSave(); });
  searchInput.addEventListener('input', renderNotesList);
  categoryFilter.addEventListener('change', renderNotesList);
  sortOrderSelect.addEventListener('change', renderNotesList);

  newBtn.addEventListener('click', () => { clearEditor(); noteTitleInput.focus(); if (window.innerWidth <= 900) closeSidebar(); });
  deleteBtn.addEventListener('click', deleteCurrentNote);
  duplicateBtn.addEventListener('click', duplicateCurrentNote);

  // Favorite
  favoriteBtn.addEventListener('click', () => {
    if (!currentNoteId) return;
    if (favoritesSet.has(currentNoteId)) favoritesSet.delete(currentNoteId);
    else favoritesSet.add(currentNoteId);
    saveFavoritesAndPins();
    updateFavoriteButton();
    renderNotesList();
  });

  // Pin
  pinBtn.addEventListener('click', () => {
    if (!currentNoteId) return;
    if (pinnedSet.has(currentNoteId)) pinnedSet.delete(currentNoteId);
    else pinnedSet.add(currentNoteId);
    saveFavoritesAndPins();
    updatePinButton();
    renderNotesList();
  });

  // Word goal
  wordGoalInput.addEventListener('change', () => {
    wordGoal = parseInt(wordGoalInput.value) || 0;
    localStorage.setItem('memora_word_goal', wordGoal);
    wordGoalInput.value = '';
    updateEditorMeta();
    showToast(wordGoal > 0 ? `Word goal set to ${wordGoal}` : 'Word goal cleared', 'success');
  });

  // Dark mode
  darkToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark');
    const icon = darkToggle.querySelector('i');
    icon.classList.toggle('fa-moon');
    icon.classList.toggle('fa-sun');
    localStorage.setItem('memora_dark', document.body.classList.contains('dark'));
  });

  // Export
  exportBtn.addEventListener('click', (e) => { e.stopPropagation(); exportOptions.classList.toggle('show'); });
  document.addEventListener('click', (e) => { if (!exportOptions.contains(e.target) && e.target !== exportBtn) exportOptions.classList.remove('show'); });
  exportOptions.addEventListener('click', (e) => {
    const option = e.target.closest('.export-option-btn');
    if (!option) return;
    const type = option.dataset.export;
    exportOptions.classList.remove('show');
    if (type === 'current') {
      const n = notes.find(x => x.id === currentNoteId);
      if (!n) { alert('Select a note first.'); return; }
      showPdfPreview([n]);
    } else if (type === 'all') {
      if (notes.length === 0) { alert('No notes.'); return; }
      showPdfPreview(notes);
    } else if (type === 'category') {
      const cats = Array.from(categoriesSet).sort();
      if (cats.length === 0) { alert('No categories.'); return; }
      const cat = prompt('Enter category:\n' + cats.join(', '));
      if (!cat) return;
      const filtered = notes.filter(n => n.category === cat.trim());
      if (filtered.length === 0) { alert('No notes in: ' + cat); return; }
      showPdfPreview(filtered);
    }
  });

  closePdfModal.addEventListener('click', () => { pdfModal.classList.remove('show'); pendingPdfExport = null; });
  pdfModal.addEventListener('click', (e) => { if (e.target === pdfModal) { pdfModal.classList.remove('show'); pendingPdfExport = null; } });
  downloadPdfBtn.addEventListener('click', async () => {
    if (!pendingPdfExport) return;
    downloadPdfBtn.innerHTML = '<span class="spinner"></span> Generating...';
    downloadPdfBtn.disabled = true;
    const pdf = await generatePdfForNotes(pendingPdfExport);
    if (pdf) pdf.save(`memora_${new Date().toISOString().slice(0, 10)}.pdf`);
    pdfModal.classList.remove('show');
    downloadPdfBtn.innerHTML = '<i class="fas fa-download"></i> Download PDF';
    downloadPdfBtn.disabled = false;
    showToast('PDF downloaded!', 'success');
  });

  // Stats
  statsBtn.addEventListener('click', () => { updateStatsModal(); statsModal.classList.add('show'); });
  closeStatsModal.addEventListener('click', () => statsModal.classList.remove('show'));
  statsModal.addEventListener('click', (e) => { if (e.target === statsModal) statsModal.classList.remove('show'); });

  // Import
  importBtn.addEventListener('click', () => importFileInput.click());
  importFileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const imported = JSON.parse(ev.target.result);
        if (Array.isArray(imported) && confirm('Replace all notes?')) {
          await localforage.setItem('notes', imported);
          notes = imported; categoriesSet.clear();
          imported.forEach(n => { if (n.category) categoriesSet.add(n.category); });
          refreshCategoryUI(); renderNotesList(); await updateStorageUsage();
          if (notes.length) loadNoteToEditor(notes[0]); else clearEditor();
          showToast('Notes imported!', 'success');
        }
      } catch (err) { alert('Invalid file'); }
      importFileInput.value = '';
    };
    reader.readAsText(file);
  });

  clearAllBtn.addEventListener('click', async () => {
    if (confirm('DELETE ALL NOTES?')) {
      await localforage.setItem('notes', []);
      notes = []; categoriesSet.clear(); favoritesSet.clear(); pinnedSet.clear();
      saveFavoritesAndPins();
      refreshCategoryUI(); renderNotesList(); await updateStorageUsage();
      clearEditor();
      showToast('All notes cleared', 'success');
    }
  });

  // Voice dictation
  voiceBtn.addEventListener('click', () => {
    if (isRecording) stopRecording();
    else startRecording();
  });

  // Language panel
  languagePanel.addEventListener('click', (e) => {
    e.stopPropagation();
    languageDropdown.classList.toggle('show');
    fontDropdown.classList.remove('show');
  });
  document.addEventListener('click', (e) => {
    if (!languagePanel.contains(e.target)) languageDropdown.classList.remove('show');
  });

  // Font panel
  fontPanel.addEventListener('click', (e) => {
    e.stopPropagation();
    fontDropdown.classList.toggle('show');
    languageDropdown.classList.remove('show');
  });
  document.addEventListener('click', (e) => {
    if (!fontPanel.contains(e.target)) fontDropdown.classList.remove('show');
  });

  // Mobile menu
  menuToggle.addEventListener('click', () => { sidebar.classList.toggle('open'); overlay.classList.toggle('show'); });
  overlay.addEventListener('click', closeSidebar);

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case 's': e.preventDefault(); saveCurrentNote(); break;
        case 'n': e.preventDefault(); clearEditor(); noteTitleInput.focus(); break;
        case 'f': e.preventDefault(); searchInput.focus(); break;
        case 'd': e.preventDefault(); duplicateCurrentNote(); break;
      }
    }
  });

  window.addEventListener('beforeunload', () => { if (debounceTimer) saveCurrentNote(); });

  // ============ INITIALIZATION ============
  async function initialize() {
    if (localStorage.getItem('memora_dark') === 'true') {
      document.body.classList.add('dark');
      darkToggle.querySelector('i').classList.replace('fa-moon', 'fa-sun');
    }

    wordGoalInput.value = '';
    buildLanguageDropdown();
    updateLanguageDisplay();
    buildFontDropdown();
    updateFontDisplay();
    applyFontToEditor();
    setupSpeechRecognition();

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
        contentDelta: JSON.stringify({ ops: [{ insert: 'Your multilingual smart notebook with dictation, PDF export, and more!\n' }] }),
        plainText: 'Your multilingual smart notebook ready.', createdAt: Date.now(), updatedAt: Date.now()
      };
      await localforage.setItem('notes', [welcome]);
      notes = [welcome]; categoriesSet.add('Personal');
      refreshCategoryUI(); renderNotesList(); loadNoteToEditor(welcome);
      await updateStorageUsage();
    }

    updateEditorMeta();
    showToast('Memora ready! Start writing ✨', 'info');
  }

  initialize();
})();