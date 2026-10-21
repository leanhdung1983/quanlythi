// ================================================================
// CỔNG HỌC LIỆU SỐ TOÁN 11 - CHƯƠNG I (KNTT)
// Portal Logic: Search, Filter, Gamification & Sound Manager
// ================================================================

class SoundManager {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playClick() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, this.ctx.currentTime);
    gain.gain.setValueAtTime(0.06, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.05);
  }
}

const sound = new SoundManager();

const STORAGE_KEY = 'toan11_portal_user';
let currentUser = {
  avatar: '👑',
  name: 'Chiến Binh Logic',
  title: 'Thủ Khoa Lượng Giác Toán 11'
};

function loadUserData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      currentUser = { ...currentUser, ...JSON.parse(raw) };
    }
  } catch (e) {
    console.warn('Cannot load portal user:', e);
  }
  updateHUD();
}

function saveUserData() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(currentUser));
  } catch (e) {
    console.warn('Cannot save portal user:', e);
  }
}

function updateHUD() {
  const avatarBtn = document.getElementById('avatarBtn');
  const nameDisp = document.getElementById('userNameDisplay');
  const titleDisp = document.getElementById('userTitle');

  if (avatarBtn) avatarBtn.textContent = currentUser.avatar;
  if (nameDisp) nameDisp.textContent = `${currentUser.name} 🌟`;
  if (titleDisp) titleDisp.textContent = currentUser.title;
}

document.addEventListener('DOMContentLoaded', () => {
  loadUserData();

  // KaTeX render
  if (typeof renderMathInElement === 'function') {
    renderMathInElement(document.body, {
      delimiters: [
        { left: '$$', right: '$$', display: true },
        { left: '$', right: '$', display: false }
      ],
      throwOnError: false,
      strict: false
    });
  }

  // Search filter
  const searchInput = document.getElementById('searchInput');
  const clearSearch = document.getElementById('clearSearch');
  const lessonCards = document.querySelectorAll('.lesson-card');
  const filterPills = document.querySelectorAll('.filter-pill');
  let currentFilter = 'all';

  function applyFilters() {
    const query = searchInput ? searchInput.value.trim().toLowerCase() : '';

    lessonCards.forEach(card => {
      const title = (card.getAttribute('data-title') || '').toLowerCase();
      const category = card.getAttribute('data-category') || '';
      const text = card.textContent.toLowerCase();

      const matchCategory = currentFilter === 'all' || category.split(' ').includes(currentFilter);
      const matchQuery = !query || title.includes(query) || text.includes(query);

      if (matchCategory && matchQuery) {
        card.style.display = 'flex';
      } else {
        card.style.display = 'none';
      }
    });

    if (clearSearch) {
      clearSearch.style.display = query.length > 0 ? 'inline-block' : 'none';
    }
  }

  if (searchInput) {
    searchInput.addEventListener('input', applyFilters);
  }

  if (clearSearch) {
    clearSearch.addEventListener('click', () => {
      searchInput.value = '';
      applyFilters();
      searchInput.focus();
      sound.playClick();
    });
  }

  filterPills.forEach(pill => {
    pill.addEventListener('click', function() {
      filterPills.forEach(p => p.classList.remove('active'));
      this.classList.add('active');
      currentFilter = this.getAttribute('data-filter') || 'all';
      applyFilters();
      sound.playClick();
    });
  });

  // Sound Toggle
  const soundBtn = document.getElementById('soundToggle');
  if (soundBtn) {
    soundBtn.addEventListener('click', function() {
      sound.enabled = !sound.enabled;
      this.textContent = sound.enabled ? '🔊 Âm thanh: BẬT' : '🔇 Âm thanh: TẮT';
      sound.playClick();
    });
  }

  // Avatar Modal
  const avatarBtn = document.getElementById('avatarBtn');
  const avatarModal = document.getElementById('avatarModal');
  const closeModalBtn = document.getElementById('btnCloseModal');
  const avOptions = document.querySelectorAll('.av-opt');

  if (avatarBtn && avatarModal) {
    avatarBtn.addEventListener('click', () => {
      avatarModal.style.display = 'flex';
      sound.playClick();
    });
  }

  if (closeModalBtn && avatarModal) {
    closeModalBtn.addEventListener('click', () => {
      avatarModal.style.display = 'none';
      sound.playClick();
    });
  }

  avOptions.forEach(opt => {
    opt.addEventListener('click', function() {
      currentUser.avatar = this.getAttribute('data-avatar');
      currentUser.name = this.getAttribute('data-name');
      saveUserData();
      updateHUD();
      sound.playClick();
      if (avatarModal) avatarModal.style.display = 'none';
    });
  });
});
