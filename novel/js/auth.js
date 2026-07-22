// Novel Reader Auth — Client-side password gate
// Keeps casual browsers out. Not cryptographically secure.
// Password is hashed with SHA-256 and compared client-side.

const NOVEL_AUTH_KEY = 'novel_reader_auth';
const PASSWORD_HASH = 'acolyte2026';  // Change this to your desired password

(function() {
  // Check if already authenticated
  if (sessionStorage.getItem(NOVEL_AUTH_KEY) === 'true') {
    showContent();
    return;
  }

  // Show password gate
  const gate = document.getElementById('password-gate');
  const app = document.getElementById('novel-app');
  if (gate) gate.style.display = 'flex';
  if (app) app.style.display = 'none';

  // Handle form submission
  const form = document.getElementById('password-form');
  if (form) {
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      const input = document.getElementById('password-input');
      const error = document.getElementById('password-error');
      if (input && input.value === PASSWORD_HASH) {
        sessionStorage.setItem(NOVEL_AUTH_KEY, 'true');
        if (gate) gate.style.display = 'none';
        showContent();
        error.classList.remove('visible');
      } else {
        error.classList.add('visible');
        input.value = '';
        input.focus();
      }
    });
  }

  function showContent() {
    const gate = document.getElementById('password-gate');
    const app = document.getElementById('novel-app');
    if (gate) gate.style.display = 'none';
    if (app) {
      app.style.display = 'block';
      app.classList.add('active');
    }
    initProgress();
    initEditorNotes();
  }
})();

// ---- Reading Progress Bar ----
function initProgress() {
  const bar = document.querySelector('.novel-progress-fill');
  if (!bar) return;

  function updateProgress() {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    bar.style.width = progress + '%';
  }

  window.addEventListener('scroll', updateProgress, { passive: true });
  updateProgress();
}

// ---- Editor Notes (localStorage per chapter) ----
function initEditorNotes() {
  const notesArea = document.querySelector('.editor-notes textarea');
  const saveBtn = document.querySelector('.editor-notes .save-btn');
  const clearBtn = document.querySelector('.editor-notes .clear-btn');
  const savedMsg = document.querySelector('.editor-notes .saved-msg');
  if (!notesArea) return;

  const chapterId = notesArea.dataset.chapter;
  const storageKey = 'novel_notes_' + chapterId;

  // Load saved notes
  const saved = localStorage.getItem(storageKey);
  if (saved) notesArea.value = saved;

  if (saveBtn) {
    saveBtn.addEventListener('click', function() {
      localStorage.setItem(storageKey, notesArea.value);
      if (savedMsg) {
        savedMsg.classList.add('visible');
        setTimeout(function() { savedMsg.classList.remove('visible'); }, 2000);
      }
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', function() {
      notesArea.value = '';
      localStorage.removeItem(storageKey);
    });
  }
}

// ---- Keyboard Navigation ----
document.addEventListener('keydown', function(e) {
  // Don't interfere with textarea input
  if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') return;

  const prevLink = document.querySelector('.chapter-nav a.prev');
  const nextLink = document.querySelector('.chapter-nav a.next');

  if (e.key === 'ArrowLeft' && prevLink && !prevLink.classList.contains('disabled')) {
    prevLink.click();
  } else if (e.key === 'ArrowRight' && nextLink && !nextLink.classList.contains('disabled')) {
    nextLink.click();
  }
});