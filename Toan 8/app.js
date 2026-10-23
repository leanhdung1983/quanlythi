// ========================================================
// PORTAL HOMEPAGE JS: TOÁN 8 KẾT NỐI TRI THỨC VỚI CUỘC SỐNG
// Real-time search, chapter filter, Web Audio API sound synthesis, avatar sync
// ========================================================

const portalState = {
  sound: true,
  avatar: localStorage.getItem('toan8_avatar') || '👑',
  userName: localStorage.getItem('toan8_username') || 'Chiến Binh Logic',
  userTitle: 'Thủ Khoa Toàn Khóa Toán 8 KNTT',
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

  const clearBtn = document.getElementById('clearSearch');
  if (clearBtn) {
    clearBtn.style.display = query ? 'block' : 'none';
  }
}

function updateHUD() {
  const avBtn = document.getElementById('avatarBtn');
  const nameEl = document.getElementById('userNameDisplay');
  const soundBtn = document.getElementById('soundToggle');

  if (avBtn) avBtn.textContent = portalState.avatar;
  if (nameEl) nameEl.textContent = `${portalState.userName} 🌟`;
  if (soundBtn) soundBtn.textContent = portalState.sound ? '🔊 Âm thanh' : '🔇 Âm thanh: TẮT';
}

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
  updateHUD();

  // Search input
  const searchInput = document.getElementById('searchInput');
  const clearBtn = document.getElementById('clearSearch');

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      portalState.searchQuery = e.target.value;
      applySearchAndFilter();
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      portalState.searchQuery = '';
      applySearchAndFilter();
    });
  }

  // Filter pills
  const filterPills = document.querySelectorAll('.filter-pill');
  filterPills.forEach(pill => {
    pill.addEventListener('click', () => {
      playSound('click');
      filterPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      portalState.activeFilter = pill.getAttribute('data-filter');
      applySearchAndFilter();
    });
  });

  // Sound Toggle
  const soundBtn = document.getElementById('soundToggle');
  if (soundBtn) {
    soundBtn.addEventListener('click', () => {
      portalState.sound = !portalState.sound;
      playSound('click');
      updateHUD();
    });
  }
});
