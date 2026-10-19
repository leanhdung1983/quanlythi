// ========================================================
// PORTAL HOMEPAGE JS: TOÁN 10 KẾT NỐI TRI THỨC VỚI CUỘC SỐNG
// Real-time search, chapter filter, Web Audio API sound synthesis, avatar sync
// ========================================================

const portalState = {
  sound: true,
  avatar: localStorage.getItem('toan10_avatar') || '👑',
  userName: localStorage.getItem('toan10_username') || 'Chiến Binh Logic',
  userTitle: 'Thủ Khoa Toàn Khóa Toán 10 KNTT',
  activeFilter: 'all',
  searchQuery: ''
};

// --- WEB AUDIO API ---
let audioCtx = null;
function getAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) audioCtx = new AudioContextClass();
  }
  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

function playSound(type) {
  if (!portalState.sound) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    if (type === 'click') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.05);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.05);
    }
  } catch (e) {
    console.warn("Audio error:", e);
  }
}

// --- SEARCH & FILTER LOGIC ---
function applySearchAndFilter() {
  const query = portalState.searchQuery.toLowerCase().trim();
  const filter = portalState.activeFilter;
  const sections = document.querySelectorAll('.chapter-section');

  sections.forEach(sec => {
    const chapId = sec.getAttribute('data-chapter');
    const matchesChapter = (filter === 'all' || filter === chapId);

    const cards = sec.querySelectorAll('.lesson-card');
    let visibleCardsInChapter = 0;

    cards.forEach(card => {
      const title = card.getAttribute('data-title') || '';
      const tag = card.getAttribute('data-tag') || '';
      const desc = card.getAttribute('data-desc') || '';
      const cardText = (title + ' ' + tag + ' ' + desc).toLowerCase();

      const matchesSearch = !query || cardText.includes(query);

      if (matchesChapter && matchesSearch) {
        card.style.display = 'flex';
        visibleCardsInChapter++;
      } else {
        card.style.display = 'none';
      }
    });

    if (matchesChapter && (visibleCardsInChapter > 0 || !query)) {
      sec.style.display = 'block';
    } else {
      sec.style.display = 'none';
    }
  });
}

function updateHUD() {
  const avBtn = document.getElementById('avatarBtn');
  const nameEl = document.getElementById('userNameDisplay');
  if (avBtn) avBtn.textContent = portalState.avatar;
  if (nameEl) nameEl.textContent = `${portalState.userName} 🌟`;
}

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
  updateHUD();

  // Sound Toggle
  const soundBtn = document.getElementById('soundToggle');
  if (soundBtn) {
    soundBtn.addEventListener('click', () => {
      portalState.sound = !portalState.sound;
      soundBtn.textContent = portalState.sound ? '🔊 Âm thanh: BẬT' : '🔇 Âm thanh: TẮT';
      playSound('click');
    });
  }

  // Avatar Modal
  const avBtn = document.getElementById('avatarBtn');
  const avModal = document.getElementById('avatarModal');
  const closeAvModal = document.getElementById('btnCloseModal');

  if (avBtn && avModal) {
    avBtn.addEventListener('click', () => {
      avModal.style.display = 'flex';
      avModal.classList.add('active');
      playSound('click');
    });
  }

  if (closeAvModal && avModal) {
    closeAvModal.addEventListener('click', () => {
      avModal.style.display = 'none';
      avModal.classList.remove('active');
      playSound('click');
    });
  }

  document.querySelectorAll('.av-opt').forEach(opt => {
    opt.addEventListener('click', () => {
      portalState.avatar = opt.getAttribute('data-av');
      portalState.userName = opt.getAttribute('data-name');
      localStorage.setItem('toan10_avatar', portalState.avatar);
      localStorage.setItem('toan10_username', portalState.userName);
      updateHUD();
      if (avModal) {
        avModal.style.display = 'none';
        avModal.classList.remove('active');
      }
      playSound('click');
    });
  });

  // Filter Pills
  const pills = document.querySelectorAll('.filter-pill');
  pills.forEach(pill => {
    pill.addEventListener('click', () => {
      pills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      portalState.activeFilter = pill.getAttribute('data-filter');
      playSound('click');
      applySearchAndFilter();
    });
  });

  // Search Input
  const searchInput = document.getElementById('searchInput');
  const clearBtn = document.getElementById('clearSearch');

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      portalState.searchQuery = e.target.value;
      if (clearBtn) {
        clearBtn.style.display = portalState.searchQuery ? 'block' : 'none';
      }
      applySearchAndFilter();
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      portalState.searchQuery = '';
      if (searchInput) searchInput.value = '';
      clearBtn.style.display = 'none';
      playSound('click');
      applySearchAndFilter();
    });
  }

  // Interactive Hover Sounds on Buttons
  document.querySelectorAll('.btn-enter-lesson, .btn-hero').forEach(btn => {
    btn.addEventListener('mouseenter', () => {
      playSound('click');
    });
  });

  // Render Math formulas if KaTeX is present
  if (typeof renderMathInElement === 'function') {
    try {
      renderMathInElement(document.body, {
        delimiters: [
          { left: "$$", right: "$$", display: true },
          { left: "$", right: "$", display: false }
        ],
        throwOnError: false,
        strict: false
      });
    } catch (e) {
      console.warn("KaTeX render on portal:", e);
    }
  }
});
