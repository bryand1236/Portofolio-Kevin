// Kevin H — Portfolio Interactive Scripts
document.addEventListener('DOMContentLoaded', () => {
  // 1. Interactive TO-DO List
  const todoList = document.getElementById('todo-list');
  const todoCounter = document.getElementById('todo-counter');

  function updateTodoCount() {
    const total = todoList.querySelectorAll('li').length;
    const completed = todoList.querySelectorAll('li.completed').length;
    todoCounter.textContent = `${completed}/${total}`;
  }

  todoList.addEventListener('click', (e) => {
    const li = e.target.closest('li');
    if (!li) return;
    li.classList.toggle('completed');
    const checkbox = li.querySelector('.todo-checkbox');
    if (li.classList.contains('completed')) {
      checkbox.textContent = '✓';
      showToast('Task finished! 🚀');
    } else {
      checkbox.textContent = '';
    }
    updateTodoCount();
  });

  // 2. Toolbar Tools Switcher & Cursors
  const dockButtons = document.querySelectorAll('.dock-btn');
  dockButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      dockButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const tool = btn.dataset.tool;

      // Update cursor and show toast
      document.body.className = `tool-${tool}`;
      if (tool === 'grid') {
        document.body.classList.toggle('dense-grid');
        showToast('Grid overlay adjusted!');
      } else if (tool === 'spin') {
        const box = document.getElementById('portfolio-box');
        box.style.transition = 'transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)';
        box.style.transform = 'rotate(-5deg) scale(1.08)';
        setTimeout(() => {
          box.style.transform = 'none';
        }, 600);
        showToast('Wiggle animation triggered!');
      } else if (tool === 'code') {
        showToast('Clean semantic HTML5 & Vanilla CSS!');
      } else {
        showToast(`Active tool: ${tool.toUpperCase()} mode`);
      }
    });
  });

  // Copy Link Toolbar Action
  const btnCopyLink = document.getElementById('btn-copy-link');
  if (btnCopyLink) {
    btnCopyLink.addEventListener('click', () => {
      navigator.clipboard.writeText(window.location.href);
      showToast('Portfolio link copied to clipboard!');
    });
  }

  // Find Action
  const btnFind = document.getElementById('btn-find');
  if (btnFind) {
    btnFind.addEventListener('click', () => {
      const worksSection = document.getElementById('works');
      worksSection.scrollIntoView({ behavior: 'smooth' });
      showToast('Navigating to creative works gallery...');
    });
  }

  // 3. Audio / Equalizer Simulation Toggle
  const btnPlayPause = document.getElementById('btn-play-pause');
  const equalizer = document.getElementById('equalizer');
  let isPlaying = true;

  btnPlayPause.addEventListener('click', () => {
    isPlaying = !isPlaying;
    if (isPlaying) {
      btnPlayPause.textContent = '⏸';
      equalizer.classList.add('playing');
      showToast('Track playing: greatest love for all 🎵');
    } else {
      btnPlayPause.textContent = '▶';
      equalizer.classList.remove('playing');
      showToast('Track paused');
    }
  });

  // 4. Portfolio Filter Tabs
  const filterBtns = document.querySelectorAll('.filter-btn');
  const cards = document.querySelectorAll('.artwork-card');

  filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      filterBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.dataset.filter;

      cards.forEach((card) => {
        if (filter === 'all' || card.dataset.cat === filter) {
          card.style.display = 'flex';
          card.style.animation = 'fadeIn 0.3s ease forwards';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });

  // 5. Lightbox Modal
  const lightbox = document.getElementById('lightbox');
  const lbImg = document.getElementById('lb-img');
  const lbTitle = document.getElementById('lb-title');
  const lbDesc = document.getElementById('lb-desc');
  const lbCat = document.getElementById('lb-cat');
  const lbTools = document.getElementById('lb-tools');
  const lbClose = document.getElementById('lb-close');
  const lbHeaderTitle = document.getElementById('lb-header-title');

  cards.forEach((card) => {
    card.addEventListener('click', () => {
      const img = card.dataset.img;
      const title = card.dataset.title;
      const desc = card.dataset.desc;
      const cat = card.querySelector('.art-badge-cat')?.textContent || 'Creative Work';
      const tools = (card.dataset.tools || '').split(',').map((t) => t.trim());

      lbImg.src = img;
      lbImg.alt = title;
      lbTitle.textContent = title;
      lbDesc.textContent = desc;
      lbCat.textContent = cat;
      lbHeaderTitle.textContent = `${title} — Canva Archive`;

      lbTools.innerHTML = '';
      tools.forEach((tool) => {
        if (tool) {
          const chip = document.createElement('span');
          chip.className = 'lightbox-tool-chip';
          chip.textContent = tool;
          lbTools.appendChild(chip);
        }
      });

      lightbox.classList.add('active');
      document.body.style.overflow = 'hidden';
    });
  });

  function closeLightbox() {
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
  }

  lbClose.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && lightbox.classList.contains('active')) {
      closeLightbox();
    }
  });

  // 6. Copy Buttons
  document.querySelectorAll('.copy-pill').forEach((pill) => {
    pill.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const text = pill.dataset.copy;
      navigator.clipboard.writeText(text);
      showToast(`Copied ${text} to clipboard!`);
    });
  });

  // 7. Back to Top Button
  const backToTop = document.getElementById('back-to-top');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 400) {
      backToTop.classList.add('visible');
    } else {
      backToTop.classList.remove('visible');
    }
  });

  backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // 8. Toast Helper
  let toastTimer = null;
  function showToast(message) {
    const toast = document.getElementById('toast');
    const msgEl = document.getElementById('toast-msg');
    msgEl.textContent = message;
    toast.classList.add('show');

    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, 2800);
  }
});

