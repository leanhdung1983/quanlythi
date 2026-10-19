// ========================================================
// PORTAL HOMEPAGE JS: TOÁN 12 KẾT NỐI TRI THỨC VỚI CUỘC SỐNG
// Real-time search, chapter filter, Web Audio API sound synthesis, avatar sync
// ========================================================

const portalState = {
  sound: true,
  avatar: localStorage.getItem('toan12_avatar') || '👑',
  userName: localStorage.getItem('toan12_username') || 'Chiến Binh Logic',
  userTitle: 'Thủ Khoa Toán 12 KNTT',
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
  const cards = document.querySelectorAll('.lesson-card');
  const chapter1Sec = document.getElementById('chuong1');
  const chapter2Sec = document.getElementById('chuong2');
  const chapter3Sec = document.getElementById('chuong3');
  const chapter4Sec = document.getElementById('chuong4');
  const chapter5Sec = document.getElementById('chuong5');
  const chapter6Sec = document.getElementById('chuong6');
  const chapterCuoinamSec = document.getElementById('cuoinam');

  let visibleCount = 0;
  let ch1Count = 0;
  let ch2Count = 0;
  let ch3Count = 0;
  let ch4Count = 0;
  let ch5Count = 0;
  let ch6Count = 0;
  let cuoinamCount = 0;

  cards.forEach(card => {
    const lessonKey = card.getAttribute('data-lesson') || '';
    const chapterKey = card.getAttribute('data-chapter') || '';
    const title = card.getAttribute('data-title') || '';
    const tag = card.getAttribute('data-tag') || '';
    const desc = card.getAttribute('data-desc') || '';
    const cardText = (title + ' ' + tag + ' ' + desc).toLowerCase();

    let matchesFilter = false;
    if (filter === 'all') {
      matchesFilter = true;
    } else if (filter === 'chuong1') {
      matchesFilter = (chapterKey === 'chuong1');
    } else if (filter === 'chuong2') {
      matchesFilter = (chapterKey === 'chuong2');
    } else if (filter === 'chuong3') {
      matchesFilter = (chapterKey === 'chuong3');
    } else if (filter === 'chuong4') {
      matchesFilter = (chapterKey === 'chuong4');
    } else if (filter === 'chuong5') {
      matchesFilter = (chapterKey === 'chuong5');
    } else if (filter === 'chuong6') {
      matchesFilter = (chapterKey === 'chuong6');
    } else if (filter === 'cuoinam') {
      matchesFilter = (chapterKey === 'cuoinam');
    } else {
      matchesFilter = (lessonKey === filter);
    }

    const matchesSearch = !query || cardText.includes(query);

    if (matchesFilter && matchesSearch) {
      card.style.display = 'flex';
      visibleCount++;
      if (chapterKey === 'chuong1') ch1Count++;
      if (chapterKey === 'chuong2') ch2Count++;
      if (chapterKey === 'chuong3') ch3Count++;
      if (chapterKey === 'chuong4') ch4Count++;
      if (chapterKey === 'chuong5') ch5Count++;
      if (chapterKey === 'chuong6') ch6Count++;
      if (chapterKey === 'cuoinam') cuoinamCount++;
    } else {
      card.style.display = 'none';
    }
  });

  // Toggle chapter section visibility
  if (chapter1Sec) {
    chapter1Sec.style.display = (ch1Count > 0) ? 'block' : 'none';
  }
  if (chapter2Sec) {
    chapter2Sec.style.display = (ch2Count > 0) ? 'block' : 'none';
  }
  if (chapter3Sec) {
    chapter3Sec.style.display = (ch3Count > 0) ? 'block' : 'none';
  }
  if (chapter4Sec) {
    chapter4Sec.style.display = (ch4Count > 0) ? 'block' : 'none';
  }
  if (chapter5Sec) {
    chapter5Sec.style.display = (ch5Count > 0) ? 'block' : 'none';
  }
  if (chapter6Sec) {
    chapter6Sec.style.display = (ch6Count > 0) ? 'block' : 'none';
  }
  if (chapterCuoinamSec) {
    chapterCuoinamSec.style.display = (cuoinamCount > 0) ? 'block' : 'none';
  }
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

  // KaTeX rendering
  if (typeof renderMathInElement === 'function') {
    renderMathInElement(document.body, {
      delimiters: [
        { left: "$$", right: "$$", display: true },
        { left: "$", right: "$", display: false }
      ],
      throwOnError: false,
      strict: false
    });
  }

  // Search Input Listener
  const searchInput = document.getElementById('searchInput');
  const clearSearch = document.getElementById('clearSearch');

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      portalState.searchQuery = e.target.value;
      if (clearSearch) {
        clearSearch.style.display = e.target.value ? 'block' : 'none';
      }
      applySearchAndFilter();
    });
  }

  if (clearSearch) {
    clearSearch.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      portalState.searchQuery = '';
      clearSearch.style.display = 'none';
      applySearchAndFilter();
      playSound('click');
    });
  }

  // Filter Pills Listener
  const filterPills = document.querySelectorAll('.filter-pill');
  filterPills.forEach(pill => {
    pill.addEventListener('click', () => {
      playSound('click');
      filterPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      portalState.activeFilter = pill.getAttribute('data-filter') || 'all';
      applySearchAndFilter();
    });
  });

  // Sound Toggle
  const soundToggle = document.getElementById('soundToggle');
  if (soundToggle) {
    soundToggle.addEventListener('click', () => {
      portalState.sound = !portalState.sound;
      soundToggle.textContent = portalState.sound ? '🔊 Âm thanh: BẬT' : '🔇 Âm thanh: TẮT';
      playSound('click');
    });
  }

  // Avatar Modal
  const avatarBtn = document.getElementById('avatarBtn');
  const avatarModal = document.getElementById('avatarModal');
  const btnCloseModal = document.getElementById('btnCloseModal');
  const avOpts = document.querySelectorAll('.av-opt');

  if (avatarBtn && avatarModal) {
    avatarBtn.addEventListener('click', () => {
      playSound('click');
      avatarModal.style.display = 'flex';
    });
  }

  if (btnCloseModal && avatarModal) {
    btnCloseModal.addEventListener('click', () => {
      playSound('click');
      avatarModal.style.display = 'none';
    });
  }

  avOpts.forEach(opt => {
    opt.addEventListener('click', () => {
      playSound('click');
      portalState.avatar = opt.getAttribute('data-avatar');
      portalState.userName = opt.getAttribute('data-name');
      localStorage.setItem('toan12_avatar', portalState.avatar);
      localStorage.setItem('toan12_username', portalState.userName);
      updateHUD();
      if (avatarModal) avatarModal.style.display = 'none';
    });
  });
});
