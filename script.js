// Kevin H — Portfolio Interactive Scripts

// ── Interactive Dot Background ──────────────────────────────────────
(function initDotBackground() {
  const canvas = document.getElementById('dot-bg');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  // Config
  const DOT_SPACING = 24;
  const DOT_RADIUS = 2.8;
  const DOT_COLOR = getComputedStyle(document.documentElement).getPropertyValue('--dot-color').trim() || '#242424';
  const DOT_ALPHA = 0.22;
  const REPEL_RADIUS = 160;
  const REPEL_STRENGTH = 40;
  const RETURN_SPEED = 0.045; // elastic return factor per frame

  let cols, rows, dots;
  let mouseX = -9999, mouseY = -9999;

  function getDocHeight() {
    return Math.max(
      document.body.scrollHeight,
      document.body.offsetHeight,
      document.documentElement.scrollHeight,
      document.documentElement.offsetHeight
    );
  }

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    const w = window.innerWidth;
    const h = getDocHeight();
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    buildGrid(w, h);
  }

  function buildGrid(w, h) {
    cols = Math.ceil(w / DOT_SPACING) + 2;
    rows = Math.ceil(h / DOT_SPACING) + 2;
    const offsetX = (w - (cols - 1) * DOT_SPACING) / 2;
    const offsetY = (h - (rows - 1) * DOT_SPACING) / 2;
    dots = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const homeX = offsetX + c * DOT_SPACING;
        const homeY = offsetY + r * DOT_SPACING;
        dots.push({ homeX, homeY, x: homeX, y: homeY });
      }
    }
  }

  function animate() {
    const w = window.innerWidth;
    const h = getDocHeight();
    ctx.clearRect(0, 0, w, h);
    const repelSq = REPEL_RADIUS * REPEL_RADIUS;
    // Convert mouse position from viewport to page coordinates
    const mx = mouseX;
    const my = mouseY + window.scrollY;

    for (let i = 0, len = dots.length; i < len; i++) {
      const d = dots[i];
      // Compute displacement from mouse
      const dx = d.homeX - mx;
      const dy = d.homeY - my;
      const distSq = dx * dx + dy * dy;

      if (distSq < repelSq && distSq > 0) {
        const dist = Math.sqrt(distSq);
        const force = (1 - dist / REPEL_RADIUS) * REPEL_STRENGTH;
        const pushX = (dx / dist) * force;
        const pushY = (dy / dist) * force;
        d.x += (d.homeX + pushX - d.x) * 0.22;
        d.y += (d.homeY + pushY - d.y) * 0.22;
      } else {
        // Elastic return
        d.x += (d.homeX - d.x) * RETURN_SPEED;
        d.y += (d.homeY - d.y) * RETURN_SPEED;
      }

      ctx.beginPath();
      ctx.arc(d.x, d.y, DOT_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = DOT_COLOR;
      ctx.globalAlpha = DOT_ALPHA;
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    requestAnimationFrame(animate);
  }

  // Track mouse (use document so it works even though canvas has pointer-events:none)
  document.addEventListener('mousemove', function (e) {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });
  document.addEventListener('mouseleave', function () {
    mouseX = -9999;
    mouseY = -9999;
  });

  window.addEventListener('resize', resize);
  // Wait for DOM + images to settle so document height is accurate
  window.addEventListener('load', function () {
    resize();
    animate();
  });
  // Also run on DOMContentLoaded for faster first paint
  if (document.readyState === 'complete') {
    resize();
    animate();
  }
})();

document.addEventListener('DOMContentLoaded', () => {

  // ── Side Drawer Navbar ─────────────────────────────────────────
  const sideNavbar = document.getElementById('side-navbar');
  const sideNavToggleTab = document.getElementById('side-nav-toggle-tab');
  const sideNavClose = document.getElementById('side-nav-close');
  const sideNavOverlay = document.getElementById('side-nav-overlay');
  const sideNavLinks = document.querySelectorAll('.side-nav-link[data-section]');

  function openNav() {
    sideNavbar.classList.add('open');
    sideNavOverlay.classList.add('open');
  }

  function closeNav() {
    sideNavbar.classList.remove('open');
    sideNavOverlay.classList.remove('open');
  }

  function toggleNav() {
    if (sideNavbar.classList.contains('open')) {
      closeNav();
    } else {
      openNav();
    }
  }

  // Toggle button on the protruding tab
  if (sideNavToggleTab) {
    sideNavToggleTab.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleNav();
    });
  }

  // Close button inside header
  if (sideNavClose) {
    sideNavClose.addEventListener('click', (e) => {
      e.stopPropagation();
      closeNav();
    });
  }

  // Click on background overlay closes
  if (sideNavOverlay) {
    sideNavOverlay.addEventListener('click', closeNav);
  }

  // Click the visible edge of the closed navbar to open
  sideNavbar.addEventListener('click', (e) => {
    if (!sideNavbar.classList.contains('open')) {
      openNav();
    }
  });

  // Close on nav link click
  sideNavLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.stopPropagation();
      closeNav();
    });
  });

  // Auto-close after initial delay
  setTimeout(() => closeNav(), 2500);

  // Scroll Spy
  const navSections = Array.from(sideNavLinks).map(link => ({
    link,
    target: document.getElementById(link.dataset.section)
  })).filter(s => s.target);

  function updateActiveNav() {
    const scrollY = window.scrollY + window.innerHeight / 3;
    let current = navSections[0];
    for (const s of navSections) {
      if (s.target.offsetTop <= scrollY) current = s;
    }
    sideNavLinks.forEach(l => l.classList.remove('active'));
    if (current) current.link.classList.add('active');
  }

  window.addEventListener('scroll', updateActiveNav, { passive: true });
  updateActiveNav();

  // ── Combined Profile & Academic Section Collapse ────────────────
  const combinedProfileCard = document.getElementById('combined-profile-card');
  const profileCardToggle = document.getElementById('profile-card-toggle');
  const aboutSection = document.getElementById('about');

  // Lock the height of the section so the following gallery section stays in place when collapsed
  function lockAboutHeight() {
    if (aboutSection && combinedProfileCard && combinedProfileCard.classList.contains('open')) {
      aboutSection.style.minHeight = '';
      const naturalHeight = aboutSection.offsetHeight;
      if (naturalHeight > 400) {
        aboutSection.style.minHeight = `${naturalHeight}px`;
      }
    }
  }

  // Calculate after fonts & layout settle
  window.addEventListener('load', lockAboutHeight);
  setTimeout(lockAboutHeight, 500);
  window.addEventListener('resize', lockAboutHeight);

  if (combinedProfileCard && profileCardToggle) {
    profileCardToggle.addEventListener('click', () => {
      combinedProfileCard.classList.toggle('open');
      const isExpanded = combinedProfileCard.classList.contains('open');
      profileCardToggle.setAttribute('aria-expanded', isExpanded);
    });

    profileCardToggle.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        profileCardToggle.click();
      }
    });
  }

  // ── Typewriter Effect for "Hello, Kevin Hermando Rama." (Looping) ──
  const typewriterTarget = document.getElementById('typewriter-text');
  if (typewriterTarget) {
    const fullText = "Hello, Kevin Hermando Rama.";
    let charIndex = 0;
    let isDeleting = false;
    const typeSpeed = 80;
    const deleteSpeed = 45;
    const pauseAtEnd = 2200; // Pause when fully typed
    const pauseAtStart = 500;  // Pause when empty before retyping

    function typeWriterLoop() {
      if (!isDeleting) {
        // Typing forward
        typewriterTarget.textContent = fullText.substring(0, charIndex + 1);
        charIndex++;

        if (charIndex === fullText.length) {
          isDeleting = true;
          setTimeout(typeWriterLoop, pauseAtEnd);
          return;
        }
        setTimeout(typeWriterLoop, typeSpeed);
      } else {
        // Deleting backward
        typewriterTarget.textContent = fullText.substring(0, charIndex - 1);
        charIndex--;

        if (charIndex === 0) {
          isDeleting = false;
          setTimeout(typeWriterLoop, pauseAtStart);
          return;
        }
        setTimeout(typeWriterLoop, deleteSpeed);
      }
    }

    setTimeout(typeWriterLoop, 400);
  }

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
      checkbox.innerHTML = '<i class="bi bi-check-lg"></i>';
    } else {
      checkbox.innerHTML = '';
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

      // Update cursor
      document.body.className = `tool-${tool}`;
      if (tool === 'grid') {
        document.body.classList.toggle('dense-grid');
      } else if (tool === 'spin') {
        const box = document.getElementById('portfolio-box');
        box.style.transition = 'transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)';
        box.style.transform = 'rotate(-5deg) scale(1.08)';
        setTimeout(() => {
          box.style.transform = 'none';
        }, 600);
      }
    });
  });

  // Copy Link Toolbar Action
  const btnCopyLink = document.getElementById('btn-copy-link');
  if (btnCopyLink) {
    btnCopyLink.addEventListener('click', () => {
      navigator.clipboard.writeText(window.location.href);
    });
  }

  // Find Action
  const btnFind = document.getElementById('btn-find');
  if (btnFind) {
    btnFind.addEventListener('click', () => {
      const worksSection = document.getElementById('works');
      worksSection.scrollIntoView({ behavior: 'smooth' });
    });
  }

  // 3. Audio / Play Pause Simulation Toggle
  const btnPlayPause = document.getElementById('btn-play-pause');
  let isPlaying = false;

  if (btnPlayPause) {
    btnPlayPause.addEventListener('click', () => {
      isPlaying = !isPlaying;
      if (isPlaying) {
        btnPlayPause.innerHTML = '<i class="bi bi-pause-fill"></i>';
      } else {
        btnPlayPause.innerHTML = '<i class="bi bi-play-fill"></i>';
      }
    });
  }

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

// Get the 4-digit current year and insert it into the HTML
document.getElementById("currentYear").innerText = new Date().getFullYear();

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
    const IDLE_RESET_MS = 1000; // Return to original after 3 seconds of not being touched
    const AUTO_CYCLE_MS = 4000; // Makes itself larger every so often (~7.5s)
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
    function makeLarger(targetPadX = 100, targetPadY = 48) {
      if (isResizing) return;
      resizeBox.classList.add('show-dims');
      resizeBox.classList.add('is-expanded');
      resizeBox.style.transition = 'top 0.9s cubic-bezier(0.34, 1.56, 0.64, 1), bottom 0.9s cubic-bezier(0.34, 1.56, 0.64, 1), left 0.9s cubic-bezier(0.34, 1.56, 0.64, 1), right 0.9s cubic-bezier(0.34, 1.56, 0.64, 1)';
      resizeBox.style.setProperty('--box-top', `${targetPadY}px`);
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
      }
      updateDimensions();

      // Return to original after 3 seconds of being untouched, then resume auto-cycle
      scheduleReset();
      startAutoCycle();
    });
  }
});

