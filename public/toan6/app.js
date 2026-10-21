/* ================================================================
   CỔNG HỌC LIỆU SỐ TOÁN 6 - KẾT NỐI TRI THỨC VỚI CUỘC SỐNG
   Client Application Logic: Live Search, Filter Tabs, Random Lesson,
   Sound Effects, and Progress Tracking.
   ================================================================ */

// --- 1. WEB AUDIO API SOUND CONTROLLER ---
class PortalSound {
  constructor() {
    this.ctx = null;
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

  playTone(freq = 440, type = 'sine', duration = 0.1, vol = 0.08) {
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(vol, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      console.warn('Audio error:', e);
    }
  }

  playClick() {
    this.playTone(550, 'sine', 0.06, 0.05);
  }

  playSuccess() {
    [523.25, 659.25, 783.99].forEach((freq, idx) => {
      setTimeout(() => this.playTone(freq, 'triangle', 0.12, 0.1), idx * 60);
    });
  }

  playDice() {
    [400, 480, 560, 640, 720, 880].forEach((freq, idx) => {
      setTimeout(() => this.playTone(freq, 'sine', 0.08, 0.08), idx * 45);
    });
  }
}

const audio = new PortalSound();

// --- 2. SEARCH & FILTER LOGIC ---
const VISITED_KEY = 'toan6_portal_visited_lessons';

function getVisitedLessons() {
  try {
    const data = localStorage.getItem(VISITED_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

function markLessonVisited(href) {
  try {
    const list = getVisitedLessons();
    if (!list.includes(href)) {
      list.push(href);
      localStorage.setItem(VISITED_KEY, JSON.stringify(list));
    }
  } catch (e) {
    console.warn('Storage error:', e);
  }
}

function applyVisitedBadges() {
  const visited = getVisitedLessons();
  document.querySelectorAll('.lesson-card').forEach(card => {
    const href = card.getAttribute('href');
    if (visited.includes(href)) {
      let visitedTag = card.querySelector('.visited-tag');
      if (!visitedTag) {
        visitedTag = document.createElement('span');
        visitedTag.className = 'feature-tag visited-tag';
        visitedTag.style.borderColor = 'rgba(16, 185, 129, 0.5)';
        visitedTag.style.color = '#34d399';
        visitedTag.textContent = '✅ Đã xem';
        const featBox = card.querySelector('.card-features');
        if (featBox) featBox.appendChild(visitedTag);
      }
    }
  });
}

function initSearchAndFilter() {
  const searchInput = document.getElementById('searchInput');
  const filterBtns = document.querySelectorAll('.filter-btn');
  const emptyResults = document.getElementById('emptyResults');
  const statLessons = document.getElementById('statLessons');

  let currentFilter = 'all';
  let searchQuery = '';

  function filterCards() {
    const cards = document.querySelectorAll('.lesson-card');
    let visibleCount = 0;

    cards.forEach(card => {
      const title = card.querySelector('.card-title')?.textContent.toLowerCase() || '';
      const tags = card.dataset.tags?.toLowerCase() || '';
      const badge = card.querySelector('.lesson-badge')?.textContent.toLowerCase() || '';
      const isReview = card.classList.contains('review-card');
      const isExperience = card.classList.contains('experience-card');

      const volSection = card.closest('.volume-section');
      const volume = volSection?.dataset.volume || '';

      // Check text search
      const matchesSearch = !searchQuery || 
        title.includes(searchQuery) || 
        tags.includes(searchQuery) || 
        badge.includes(searchQuery);

      // Check tab filter
      let matchesFilter = true;
      if (currentFilter === 'vol1') matchesFilter = volume === 'vol1';
      else if (currentFilter === 'vol2') matchesFilter = volume === 'vol2';
      else if (currentFilter === 'review') matchesFilter = isReview;
      else if (currentFilter === 'experience') matchesFilter = isExperience;

      if (matchesSearch && matchesFilter) {
        card.style.display = 'flex';
        visibleCount++;
      } else {
        card.style.display = 'none';
      }
    });

    // Hide empty chapter blocks and volume sections
    document.querySelectorAll('.chapter-block').forEach(ch => {
      const hasVisible = Array.from(ch.querySelectorAll('.lesson-card')).some(c => c.style.display !== 'none');
      ch.style.display = hasVisible ? 'block' : 'none';
    });

    document.querySelectorAll('.volume-section').forEach(vol => {
      const hasVisible = Array.from(vol.querySelectorAll('.lesson-card')).some(c => c.style.display !== 'none');
      vol.style.display = hasVisible ? 'block' : 'none';
    });

    // Empty state
    if (emptyResults) {
      if (visibleCount === 0) {
        emptyResults.classList.add('active');
      } else {
        emptyResults.classList.remove('active');
      }
    }

    if (statLessons) {
      statLessons.textContent = visibleCount;
    }
  }

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.trim().toLowerCase();
      filterCards();
    });
  }

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      audio.playClick();
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      filterCards();
    });
  });

  // Track click on lesson card
  document.querySelectorAll('.lesson-card').forEach(card => {
    card.addEventListener('click', () => {
      const href = card.getAttribute('href');
      if (href) markLessonVisited(href);
    });
  });
}

// --- 3. RANDOM LESSON PICKER ---
function initRandomPicker() {
  const btn = document.getElementById('btnRandomLesson');
  if (!btn) return;

  btn.addEventListener('click', () => {
    audio.playDice();
    const visibleCards = Array.from(document.querySelectorAll('.lesson-card')).filter(c => c.style.display !== 'none');
    if (visibleCards.length === 0) return;

    const randomCard = visibleCards[Math.floor(Math.random() * visibleCards.length)];

    // Scroll into view & pulse animation
    randomCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    randomCard.style.transition = 'all 0.4s ease';
    randomCard.style.boxShadow = '0 0 35px #f59e0b, 0 0 60px #ec4899';
    randomCard.style.borderColor = '#fbbf24';
    randomCard.style.transform = 'scale(1.05)';

    setTimeout(() => {
      audio.playSuccess();
      const title = randomCard.querySelector('.card-title')?.textContent || 'bài học';
      if (confirm(`🎲 Khám phá ngẫu nhiên: "${title}"?\nBấm OK để bắt đầu học ngay!`)) {
        randomCard.click();
      } else {
        randomCard.style.boxShadow = '';
        randomCard.style.borderColor = '';
        randomCard.style.transform = '';
      }
    }, 400);
  });
}

// --- 4. INITIALIZATION ---
window.addEventListener('DOMContentLoaded', () => {
  initSearchAndFilter();
  initRandomPicker();
  applyVisitedBadges();
});
