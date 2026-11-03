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

  // 8. Interactive Autonomous Animated Resize Box
  const portfolioBox = document.getElementById('portfolio-box');
  const resizeBox = document.getElementById('resize-box');
  const dimTag = document.getElementById('handle-dim-tag');
  const handles = document.querySelectorAll('.handle');

  if (resizeBox && portfolioBox && handles.length > 0) {
    const IDLE_RESET_MS = 3000; // Return to original after 3 seconds of not being touched
    const AUTO_CYCLE_MS = 7500; // Makes itself larger every so often (~7.5s)
    let resetTimer = null;
    let autoCycleTimer = null;
    let isHovered = false;
    let isResizing = false;

    function updateDimensions() {
      if (dimTag) {
        const rect = resizeBox.getBoundingClientRect();
        dimTag.textContent = `${Math.round(rect.width)} × ${Math.round(rect.height)} px`;
      }
    }

    function returnToOriginal() {
      resizeBox.classList.remove('is-expanded');
      resizeBox.classList.remove('is-dragging');
      resizeBox.classList.remove('show-dims');
      // Re-enable smooth spring transition for return
      resizeBox.style.transition = 'top 0.8s cubic-bezier(0.34, 1.56, 0.64, 1), bottom 0.8s cubic-bezier(0.34, 1.56, 0.64, 1), left 0.8s cubic-bezier(0.34, 1.56, 0.64, 1), right 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)';
      resizeBox.style.setProperty('--box-top', '0px');
      resizeBox.style.setProperty('--box-bottom', '0px');
      resizeBox.style.setProperty('--box-left', '0px');
      resizeBox.style.setProperty('--box-right', '0px');

      const startTime = performance.now();
      const animDuration = 800;
      function stepAnim(time) {
        updateDimensions();
        if (time - startTime < animDuration) {
          requestAnimationFrame(stepAnim);
        } else {
          updateDimensions();
        }
      }
      requestAnimationFrame(stepAnim);
    }

    function scheduleReset() {
      clearTimeout(resetTimer);
      resetTimer = setTimeout(() => {
        returnToOriginal();
      }, IDLE_RESET_MS);
    }

    // Automatically make itself larger every so often
    function makeLarger(targetPadX = 60, targetPadY = 24) {
      if (isResizing) return;
      resizeBox.classList.add('show-dims');
      resizeBox.classList.add('is-expanded');
      resizeBox.style.transition = 'top 0.9s cubic-bezier(0.34, 1.56, 0.64, 1), bottom 0.9s cubic-bezier(0.34, 1.56, 0.64, 1), left 0.9s cubic-bezier(0.34, 1.56, 0.64, 1), right 0.9s cubic-bezier(0.34, 1.56, 0.64, 1)';
      resizeBox.style.setProperty('--box-top', `${targetPadY}px`);
      resizeBox.style.setProperty('--box-bottom', `${targetPadY}px`);
      resizeBox.style.setProperty('--box-left', `${targetPadX}px`);
      resizeBox.style.setProperty('--box-right', `${targetPadX}px`);

      const startTime = performance.now();
      const animDuration = 900;
      function stepAnim(time) {
        updateDimensions();
        if (time - startTime < animDuration) {
          requestAnimationFrame(stepAnim);
        } else {
          updateDimensions();
          setTimeout(() => {
            if (!isResizing && !isHovered) {
              resizeBox.classList.remove('show-dims');
            }
          }, 600);
          scheduleReset();
        }
      }
      requestAnimationFrame(stepAnim);
    }

    function startAutoCycle() {
      stopAutoCycle();
      autoCycleTimer = setInterval(() => {
        if (!isResizing && !isHovered) {
          makeLarger(60, 24);
        }
      }, AUTO_CYCLE_MS);
    }

    function stopAutoCycle() {
      if (autoCycleTimer) {
        clearInterval(autoCycleTimer);
        autoCycleTimer = null;
      }
    }

    // Initialize dimensions
    updateDimensions();

    // 1. Initial autonomous expand on page load, then begins recurring cycle
    setTimeout(() => {
      makeLarger(60, 24);
      startAutoCycle();
    }, 700);

    window.addEventListener('resize', updateDimensions);

    // Cancel reset and pause auto-cycle while actively hovering
    portfolioBox.addEventListener('pointerenter', () => {
      isHovered = true;
      clearTimeout(resetTimer);
    });

    portfolioBox.addEventListener('pointerleave', () => {
      isHovered = false;
      if (!isResizing) {
        scheduleReset();
      }
    });

    // 2. Interactive Single-Corner/Edge Dragging (Non-Shift: only picked corner resizes)
    let hasDragged = false;
    let startX = 0;
    let startY = 0;
    let startBox = { top: 0, bottom: 0, left: 0, right: 0 };
    let activeHandle = null;

    handles.forEach((handle) => {
      handle.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        clearTimeout(resetTimer);
        stopAutoCycle();

        isResizing = true;
        hasDragged = false;
        activeHandle = handle;
        startX = e.clientX;
        startY = e.clientY;

        // Current independent edge padding values
        const computed = getComputedStyle(resizeBox);
        startBox = {
          top: parseFloat(computed.getPropertyValue('--box-top')) || (resizeBox.classList.contains('is-expanded') ? 24 : 0),
          bottom: parseFloat(computed.getPropertyValue('--box-bottom')) || (resizeBox.classList.contains('is-expanded') ? 24 : 0),
          left: parseFloat(computed.getPropertyValue('--box-left')) || (resizeBox.classList.contains('is-expanded') ? 60 : 0),
          right: parseFloat(computed.getPropertyValue('--box-right')) || (resizeBox.classList.contains('is-expanded') ? 60 : 0)
        };

        resizeBox.classList.remove('is-expanded');
        resizeBox.classList.add('is-dragging');
        resizeBox.classList.add('show-dims');
        handle.classList.add('is-dragging');

        resizeBox.style.setProperty('--box-top', `${startBox.top}px`);
        resizeBox.style.setProperty('--box-bottom', `${startBox.bottom}px`);
        resizeBox.style.setProperty('--box-left', `${startBox.left}px`);
        resizeBox.style.setProperty('--box-right', `${startBox.right}px`);

        document.body.style.userSelect = 'none';
        updateDimensions();
      });
    });

    window.addEventListener('pointermove', (e) => {
      if (!isResizing || !activeHandle) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      if (Math.hypot(dx, dy) > 3) {
        hasDragged = true;
      }

      const h = activeHandle.dataset.handle || '';

      // Non-Shift resize: ONLY resize the specific picked corner or edge!
      // Opposite edges/corners remain completely pinned and stationary.
      if (h.includes('r')) {
        const newRight = Math.max(-10, Math.min(260, startBox.right + dx));
        resizeBox.style.setProperty('--box-right', `${newRight}px`);
      }
      if (h.includes('l')) {
        const newLeft = Math.max(-10, Math.min(260, startBox.left - dx));
        resizeBox.style.setProperty('--box-left', `${newLeft}px`);
      }
      if (h.includes('b')) {
        const newBottom = Math.max(-10, Math.min(120, startBox.bottom + dy));
        resizeBox.style.setProperty('--box-bottom', `${newBottom}px`);
      }
      if (h.includes('t')) {
        const newTop = Math.max(-10, Math.min(120, startBox.top - dy));
        resizeBox.style.setProperty('--box-top', `${newTop}px`);
      }

      updateDimensions();
    });

    window.addEventListener('pointerup', () => {
      if (!isResizing) return;
      isResizing = false;
      document.body.style.userSelect = '';
      if (activeHandle) {
        activeHandle.classList.remove('is-dragging');
        activeHandle = null;
      }
      resizeBox.classList.remove('is-dragging');
      resizeBox.classList.remove('show-dims');

      if (!hasDragged) {
        // Clicked handle -> spring bounce on the resize box ONLY
        resizeBox.classList.remove('handle-bounce');
        void resizeBox.offsetWidth; // re-flow
        resizeBox.classList.add('handle-bounce');
        showToast('Resize box popped! 📐✨');
      } else {
        showToast('Corner adjusted! 📏');
      }
      updateDimensions();

      // Return to original after 3 seconds of being untouched, then resume auto-cycle
      scheduleReset();
      startAutoCycle();
    });
  }

  // 9. Toast Helper
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

