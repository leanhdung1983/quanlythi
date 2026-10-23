// ================================================================
// PORTAL HUB CONTROLLER - TOÁN 9 TOÀN DIỆN (TẬP 1 & TẬP 2)
// ================================================================

const portalState = {
  sound: true,
  searchQuery: '',
  activeFilter: 'all',
  avatar: '👑',
  userName: 'Chiến Binh Logic'
};

// Web Audio API mini player
let audioCtx = null;
function playSound(type) {
  if (!portalState.sound) return;
  try {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) audioCtx = new AudioContext();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    const ctx = audioCtx;
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    if (type === 'click') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800, now);
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
    const volId = sec.getAttribute('data-volume');
    
    let matchesChapter = false;
    if (filter === 'all') {
      matchesChapter = true;
    } else if (filter === 'tap1') {
      matchesChapter = (volId === 'tap1');
    } else if (filter === 'tap2') {
      matchesChapter = (volId === 'tap2');
    } else {
      matchesChapter = (chapId === filter);
    }

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

    if (visibleCardsInChapter > 0) {
      sec.style.display = 'block';
    } else {
      sec.style.display = 'none';
    }
  });
}

function updateHUD() {
  const avEl = document.getElementById('avatarBtn');
  const userEl = document.getElementById('userNameDisplay');
  const soundBtn = document.getElementById('soundToggle');

  if (avEl) avEl.textContent = portalState.avatar;
  if (userEl) userEl.textContent = `${portalState.userName} 🌟`;
  if (soundBtn) soundBtn.textContent = portalState.sound ? '🔊 Âm thanh' : '🔇 Âm thanh';
}

document.addEventListener('DOMContentLoaded', () => {
  updateHUD();

  // Search input
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
      playSound('click');
      if (searchInput) {
        searchInput.value = '';
        portalState.searchQuery = '';
        clearBtn.style.display = 'none';
        applySearchAndFilter();
      }
    });
  }

  // Chapter filter pills
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
