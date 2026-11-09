// Kevin H — Portfolio Interactive Scripts

// ── Interactive Dot Background ──────────────────────────────────────
(function initDotBackground() {
  const canvas = document.getElementById('dot-bg');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  function isMobile() {
    return window.innerWidth <= 820 || (window.matchMedia && window.matchMedia('(hover: none) and (pointer: coarse)').matches);
  }

  let animId = null;
  let isRunning = false;

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

  // Dynamic wandering repeller points moving slowly around the canvas
  const NUM_WANDERERS = 120;
  let wanderers = [];

  // Spatial binning grid for 60fps performance with 100+ wandering points
  const BIN_SIZE = 180;
  let binCols = 0;
  let binRows = 0;
  let bins = [];

  function initWanderers(w, h) {
    wanderers = [];
    for (let i = 0; i < NUM_WANDERERS; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.3 + Math.random() * 0.55; // Smooth slow organic drift
      wanderers.push({
        x: Math.random() * (w - 80) + 40,
        y: Math.random() * (h - 80) + 40,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 90 + Math.random() * 60,    // 90 - 150px repel radius
        strength: 22 + Math.random() * 16,   // 22 - 38px repel strength
        noiseOff: Math.random() * 1000
      });
    }
  }

  let cachedDocHeight = 0;

  function getDocHeight() {
    return Math.max(
      document.body.scrollHeight,
      document.body.offsetHeight,
      document.documentElement.scrollHeight,
      document.documentElement.offsetHeight
    );
  }

  function resize() {
    if (isMobile()) {
      if (animId) {
        cancelAnimationFrame(animId);
        animId = null;
      }
      isRunning = false;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    const dpr = window.devicePixelRatio || 1;
    const w = window.innerWidth;
    cachedDocHeight = getDocHeight();
    const h = cachedDocHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    buildGrid(w, h);
    if (wanderers.length === 0) {
      initWanderers(w, h);
    }
    if (!isRunning) {
      isRunning = true;
      animId = requestAnimationFrame(animate);
    }
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

    // Prepare spatial bins for wanderers
    binCols = Math.ceil(w / BIN_SIZE) + 1;
    binRows = Math.ceil(h / BIN_SIZE) + 1;
    bins = new Array(binCols * binRows);
    for (let k = 0; k < bins.length; k++) {
      bins[k] = [];
    }
  }

  function animate() {
    if (isMobile()) {
      isRunning = false;
      animId = null;
      return;
    }

    const w = window.innerWidth;
    const h = cachedDocHeight || window.innerHeight;
    const scrollY = window.scrollY;
    const viewTop = scrollY - 120;
    const viewBottom = scrollY + window.innerHeight + 120;

    ctx.clearRect(0, 0, w, h);

    // Clear and re-populate spatial bins for wanderers
    for (let k = 0; k < bins.length; k++) {
      bins[k].length = 0;
    }

    // Update wandering points with smooth drifting and boundary bounce
    const time = performance.now() * 0.001;
    for (let j = 0; j < wanderers.length; j++) {
      const wander = wanderers[j];
      // Gentle sine-wave heading variation for natural fluid drift
      wander.x += wander.vx + Math.sin(time * 0.8 + wander.noiseOff) * 0.35;
      wander.y += wander.vy + Math.cos(time * 0.7 + wander.noiseOff) * 0.35;

      // Soft bounce on page edges
      const pad = 40;
      if (wander.x < pad) { wander.x = pad; wander.vx = Math.abs(wander.vx); }
      if (wander.x > w - pad) { wander.x = w - pad; wander.vx = -Math.abs(wander.vx); }
      if (wander.y < pad) { wander.y = pad; wander.vy = Math.abs(wander.vy); }
      if (wander.y > h - pad) { wander.y = h - pad; wander.vy = -Math.abs(wander.vy); }

      // Assign wanderer into spatial bins it can reach
      const minBx = Math.max(0, Math.floor((wander.x - wander.radius) / BIN_SIZE));
      const maxBx = Math.min(binCols - 1, Math.floor((wander.x + wander.radius) / BIN_SIZE));
      const minBy = Math.max(0, Math.floor((wander.y - wander.radius) / BIN_SIZE));
      const maxBy = Math.min(binRows - 1, Math.floor((wander.y + wander.radius) / BIN_SIZE));

      for (let by = minBy; by <= maxBy; by++) {
        for (let bx = minBx; bx <= maxBx; bx++) {
          bins[by * binCols + bx].push(wander);
        }
      }
    }

    // Convert mouse position from viewport to page coordinates
    const mx = mouseX;
    const my = mouseY + scrollY;
    const mouseActive = mx > -1000 && my > -1000;

    // Batched rendering: set styles once and build a single path
    ctx.fillStyle = DOT_COLOR;
    ctx.globalAlpha = DOT_ALPHA;
    ctx.beginPath();

    for (let i = 0, len = dots.length; i < len; i++) {
      const d = dots[i];

      // Viewport culling: only process and draw visible dots!
      if (d.homeY < viewTop || d.homeY > viewBottom) {
        continue;
      }

      let totalPushX = 0;
      let totalPushY = 0;
      let isRepelled = false;

      // 1. Mouse repulsion
      if (mouseActive) {
        const dx = d.homeX - mx;
        const dy = d.homeY - my;
        const distSq = dx * dx + dy * dy;
        const mouseRepelSq = REPEL_RADIUS * REPEL_RADIUS;

        if (distSq < mouseRepelSq && distSq > 0) {
          const dist = Math.sqrt(distSq);
          const force = (1 - dist / REPEL_RADIUS) * REPEL_STRENGTH;
          totalPushX += (dx / dist) * force;
          totalPushY += (dy / dist) * force;
          isRepelled = true;
        }
      }

      // 2. Wandering points repulsion: look up ONLY wanderers in this dot's bin
      const bx = Math.floor(d.homeX / BIN_SIZE);
      const by = Math.floor(d.homeY / BIN_SIZE);
      if (bx >= 0 && bx < binCols && by >= 0 && by < binRows) {
        const localWanderers = bins[by * binCols + bx];
        const numLocal = localWanderers.length;
        for (let j = 0; j < numLocal; j++) {
          const wander = localWanderers[j];
          const wdx = d.homeX - wander.x;
          const wdy = d.homeY - wander.y;
          const r = wander.radius;

          if (wdx > r || wdx < -r || wdy > r || wdy < -r) continue;

          const wdistSq = wdx * wdx + wdy * wdy;
          const wRepelSq = r * r;

          if (wdistSq < wRepelSq && wdistSq > 0) {
            const wdist = Math.sqrt(wdistSq);
            const wforce = (1 - wdist / r) * wander.strength;
            totalPushX += (wdx / wdist) * wforce;
            totalPushY += (wdy / wdist) * wforce;
            isRepelled = true;
          }
        }
      }

      if (isRepelled) {
        d.x += (d.homeX + totalPushX - d.x) * 0.22;
        d.y += (d.homeY + totalPushY - d.y) * 0.22;
      } else {
        // Elastic return to base grid position
        d.x += (d.homeX - d.x) * RETURN_SPEED;
        d.y += (d.homeY - d.y) * RETURN_SPEED;
      }

      ctx.moveTo(d.x + DOT_RADIUS, d.y);
      ctx.arc(d.x, d.y, DOT_RADIUS, 0, Math.PI * 2);
    }

    ctx.fill();
    ctx.globalAlpha = 1;
    animId = requestAnimationFrame(animate);
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
  });
  // Also run on DOMContentLoaded for faster first paint
  if (document.readyState === 'complete') {
    resize();
  }
})();

document.addEventListener('DOMContentLoaded', () => {

  // ── Cinematic Opening Text Reveal Controller ─────────────────────
  (function initCinematicOpening() {
    const openingScreen = document.getElementById('opening-screen');
    if (!openingScreen) return;

    window.scrollTo(0, 0);

    const openingTitleWrap = document.getElementById('opening-title-wrap');
    let openingDismissed = false;

    function dismissOpening() {
      if (openingDismissed) return;
      openingDismissed = true;

      // Soft cinematic exit glide
      if (openingTitleWrap) {
        openingTitleWrap.classList.add('fade-out');
      }

      // Smooth backdrop dissolve
      setTimeout(() => {
        openingScreen.classList.add('is-hidden');
      }, 250);

      // Cleanup & restore full page interactivity
      setTimeout(() => {
        openingScreen.style.display = 'none';
        document.body.classList.remove('is-loading');
        window.dispatchEvent(new Event('resize'));
      }, 850);
    }

    // Auto-advance after cinematic intro hold (~1.4 seconds)
    const autoDismissTimer = setTimeout(dismissOpening, 1400);

    // Fast-skip on any user click or key press (Space / Enter / Escape)
    function handleSkip() {
      if (!openingDismissed) {
        clearTimeout(autoDismissTimer);
        dismissOpening();
      }
    }

    openingScreen.addEventListener('click', handleSkip);
    window.addEventListener('keydown', (e) => {
      if (e.key === ' ' || e.key === 'Enter' || e.key === 'Escape') {
        handleSkip();
      }
    });
  })();

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

  // Smooth scroll & close on nav link click
  sideNavLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      const targetId = link.getAttribute('href');
      if (targetId && targetId.startsWith('#')) {
        const targetEl = document.querySelector(targetId);
        if (targetEl) {
          e.preventDefault();
          e.stopPropagation();
          closeNav();
          targetEl.scrollIntoView({ behavior: 'smooth' });
          return;
        }
      }
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

  // ── Audio / Floating Media Player (Whitney Houston - Greatest Love of All) ──
  const audioEl = document.getElementById('whitney-audio');
  const mediaPlayerWidget = document.getElementById('media-player-widget');
  const btnPlayPause = document.getElementById('btn-play-pause');
  const btnRepeat = document.getElementById('btn-player-repeat');
  const btnPrev = document.getElementById('btn-player-prev');
  const btnNext = document.getElementById('btn-player-next');
  const btnShuffle = document.getElementById('btn-player-shuffle');
  const progressBar = document.getElementById('mini-progress-bar');
  const progressFill = document.getElementById('mini-progress-fill');

  function updatePlayerUI(isPlaying) {
    if (!btnPlayPause) return;
    if (isPlaying) {
      btnPlayPause.innerHTML = '<i class="bi bi-pause-fill"></i>';
      if (mediaPlayerWidget) mediaPlayerWidget.classList.add('is-playing');
    } else {
      btnPlayPause.innerHTML = '<i class="bi bi-play-fill"></i>';
      if (mediaPlayerWidget) mediaPlayerWidget.classList.remove('is-playing');
    }
  }

  function startAudioPlayback() {
    if (!audioEl) return;
    audioEl.volume = 0.3; // Comfortably turned down to 30%
    if (audioEl.paused) {
      audioEl.play().then(() => {
        updatePlayerUI(true);
      }).catch((err) => {
        console.warn('Audio playback prevented:', err);
      });
    }
  }

  // ── Notebook Paper Cover: Interactive Drag-to-Tear Down the Middle ──
  const profilePaperCover = document.getElementById('profile-paper-cover');
  const aboutSection = document.getElementById('about');
  const aboutContent = document.getElementById('about-profile-content');
  const leftHalf = profilePaperCover ? profilePaperCover.querySelector('.nb-paper-left') : null;
  const rightHalf = profilePaperCover ? profilePaperCover.querySelector('.nb-paper-right') : null;
  const tearSpine = document.getElementById('nb-tear-spine');

  if (profilePaperCover && aboutSection && aboutContent) {
    let hasTriggered = false;

    function playInwardTearAnimation() {
      if (hasTriggered || aboutSection.classList.contains('open')) return;
      hasTriggered = true;

      // Automatically play the song when the paper is torn open
      startAudioPlayback();

      // Clear any manual transforms so smooth CSS 3D transitions take full control
      if (leftHalf) {
        leftHalf.style.transform = '';
        leftHalf.style.opacity = '';
        leftHalf.style.transition = '';
      }
      if (rightHalf) {
        rightHalf.style.transform = '';
        rightHalf.style.opacity = '';
        rightHalf.style.transition = '';
      }
      if (tearSpine) {
        tearSpine.style.opacity = '0';
        tearSpine.style.transition = 'opacity 0.3s ease';
      }

      // Add 'open' class to trigger the smooth, slow inward 3D tear
      aboutSection.classList.add('open');
      profilePaperCover.setAttribute('aria-expanded', 'true');
      aboutContent.removeAttribute('aria-hidden');
      aboutContent.inert = false;
    }

    // 1. Click interaction: triggers the slow inward tearing animation
    profilePaperCover.addEventListener('click', () => {
      playInwardTearAnimation();
    });

    // 2. Drag interaction: as soon as dragged, it plays the animation
    let pointerStartX = 0;
    let pointerStartY = 0;
    let isPointerActive = false;

    profilePaperCover.addEventListener('pointerdown', (e) => {
      if (hasTriggered || aboutSection.classList.contains('open')) return;
      isPointerActive = true;
      pointerStartX = e.clientX;
      pointerStartY = e.clientY;
    });

    window.addEventListener('pointermove', (e) => {
      if (!isPointerActive || hasTriggered) return;
      const dx = e.clientX - pointerStartX;
      const dy = e.clientY - pointerStartY;
      // When dragged horizontally across the perforation or with intentional movement, play animation
      if (Math.abs(dx) > 10 || Math.hypot(dx, dy) > 14) {
        isPointerActive = false;
        playInwardTearAnimation();
      }
    });

    window.addEventListener('pointerup', () => {
      isPointerActive = false;
    });

    window.addEventListener('pointercancel', () => {
      isPointerActive = false;
    });

    // 3. Keyboard accessibility (Enter or Space)
    profilePaperCover.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        playInwardTearAnimation();
      }
    });
  }

  // ── Typewriter Effect for "Hello, Kevin Hermando Rama." (Looping) ──
  const typewriterTarget = document.getElementById('typewriter-text');
  if (typewriterTarget) {
    const fullText = "Hello, Kevin Hernando.";
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

  // 3. Audio / Floating Media Player Controls
  if (audioEl) {
    if (btnPlayPause) {
      btnPlayPause.addEventListener('click', () => {
        if (audioEl.paused) {
          startAudioPlayback();
        } else {
          audioEl.pause();
          updatePlayerUI(false);
        }
      });
    }

    audioEl.addEventListener('play', () => updatePlayerUI(true));
    audioEl.addEventListener('pause', () => updatePlayerUI(false));

    // Progress Bar Updates
    audioEl.addEventListener('timeupdate', () => {
      if (progressFill && audioEl.duration) {
        const pct = (audioEl.currentTime / audioEl.duration) * 100;
        progressFill.style.width = `${pct}%`;
      }
    });

    // Song ended
    audioEl.addEventListener('ended', () => {
      if (!audioEl.loop) {
        updatePlayerUI(false);
        if (progressFill) progressFill.style.width = '0%';
      }
    });

    // Click / Drag to seek
    if (progressBar) {
      progressBar.addEventListener('click', (e) => {
        if (!audioEl.duration) return;
        const rect = progressBar.getBoundingClientRect();
        const clickRatio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        audioEl.currentTime = clickRatio * audioEl.duration;
        if (progressFill) progressFill.style.width = `${clickRatio * 100}%`;
      });
    }

    // Repeat / Loop Toggle
    if (btnRepeat) {
      btnRepeat.addEventListener('click', () => {
        audioEl.loop = !audioEl.loop;
        btnRepeat.classList.toggle('active', audioEl.loop);
      });
    }

    // Rewind / Previous: restart or rewind 10s
    if (btnPrev) {
      btnPrev.addEventListener('click', () => {
        if (audioEl.currentTime > 3) {
          audioEl.currentTime = 0;
        } else {
          audioEl.currentTime = Math.max(0, audioEl.currentTime - 10);
        }
      });
    }

    // Forward / Next: jump forward 10s
    if (btnNext) {
      btnNext.addEventListener('click', () => {
        if (audioEl.duration) {
          audioEl.currentTime = Math.min(audioEl.duration, audioEl.currentTime + 10);
        }
      });
    }

    // Shuffle / Chorus Jump: jumps straight to the chorus (1:31 / 91s)
    if (btnShuffle) {
      btnShuffle.addEventListener('click', () => {
        if (audioEl.duration) {
          audioEl.currentTime = 91.0;
          if (audioEl.paused) {
            startAudioPlayback();
          }
          btnShuffle.classList.add('active');
          setTimeout(() => btnShuffle.classList.remove('active'), 1200);
        }
      });
    }
  }

  // ── 4. Works 3D Cylindrical Carousel ─────────────────────────────────
  const WORKS_DATA = [
    {
      id: 1,
      cat: 'feed',
      catLabel: 'Poster',
      title: 'Ramadan Poster',
      subtitle: 'Poster',
      desc: 'Poster',
       
      img: 'assets/images/works/feed-ramadan.jpg'
    },
    {
      id: 2,
      cat: 'feed',
      catLabel: 'Poster',
      title: 'Smartwatch Poster',
      subtitle: 'Poster',
      desc: 'Poster',
       
      img: 'assets/images/works/feed-smartwatch.jpg'
    },
    {
      id: 3,
      cat: 'feed',
      catLabel: 'Poster',
      title: 'EU Care ',
      subtitle: 'Poster',
      desc: 'Poster',
       
      img: 'assets/images/works/feed-history.jpg'
    },
    {
      id: 4,
      cat: 'feed',
      catLabel: 'Poster',
      title: 'Serum Bottle Poster',
      subtitle: 'Poster',
      desc: 'Poster',
       
      img: 'assets/images/works/feed-eu-glycerin.jpg'
    },
    {
      id: 5,
      cat: 'feed',
      catLabel: 'Poster',
      title: 'Hydration Wave Poster',
      subtitle: 'Poster',
      desc: 'Poster',
       
      img: 'assets/images/works/feed-eu-ripple.jpg'
    },
    {
      id: 6,
      cat: 'feed',
      catLabel: 'Poster',
      title: 'Skincare Formula Poster',
      subtitle: 'Poster',
      desc: 'Poster',
       
      img: 'assets/images/works/feed-eu-alcohol.jpg'
    },
    {
      id: 7,
      cat: 'feed',
      catLabel: 'Poster',
      title: 'Monochrome Mood Poster',
      subtitle: 'Poster',
      desc: 'Poster',
       
      img: 'assets/images/works/feed-drop.jpg'
    },
    {
      id: 8,
      cat: 'feed',
      catLabel: 'Poster',
      title: 'Teh Pucuk Beverage Poster',
      subtitle: 'Poster',
      desc: 'Poster',
       
      img: 'assets/images/works/feed-teh-pucuk.png'
    },
    {
      id: 9,
      cat: 'feed',
      catLabel: 'Poster',
      title: 'Cosmetics Campaign Poster',
      subtitle: 'Poster',
      desc: 'Poster',
       
      img: 'assets/images/works/feed-eu-hello.jpg'
    },
    {
      id: 10,
      cat: 'feed',
      catLabel: 'Poster',
      title: 'AirPods Audio Poster',
      subtitle: 'Poster',
      desc: 'Poster',
       
      img: 'assets/images/works/feed-airpods.jpg'
    },
    {
      id: 11,
      cat: 'feed',
      catLabel: 'Poster',
      title: 'Fashion Editorial Poster',
      subtitle: 'Poster',
      desc: 'Poster',
       
      img: 'assets/images/works/feed-closmain.jpg'
    },
    {
      id: 12,
      cat: 'story',
      catLabel: 'Instagram Story',
      title: 'Hand Sanitizer Story',
      subtitle: 'Instagram Story',
      desc: 'Instagram Story',
       
      img: 'assets/images/works/story-eu-bottle.jpg',
      isContain: true
    },
    {
      id: 13,
      cat: 'story',
      catLabel: 'Instagram Story',
      title: 'Sold Out Announcement Story',
      subtitle: 'Instagram Story',
      desc: 'Instagram Story',
       
      img: 'assets/images/works/story-eu-soldout.jpg',
      isContain: true
    },
    {
      id: 14,
      cat: 'idcard',
      catLabel: 'ID Card',
      title: 'ID Card Badge',
      subtitle: 'ID Card',
      desc: 'ID Card',
       
      img: 'assets/images/works/idcard-msp.jpg',
      isContain: true
    },
    {
      id: 15,
      cat: 'idcard',
      catLabel: 'Lanyard',
      title: 'Lanyard Strap',
      subtitle: 'Lanyard',
      desc: 'Lanyard',
       
      img: 'assets/images/works/lanyard-msp.png',
      isContain: false
    },
    {
      id: 16,
      cat: 'mockup',
      catLabel: 'Mockup',
      title: 'Bus Stop Advertisement Mockup',
      subtitle: 'Mockup',
      desc: 'Mockup',
       
      img: 'assets/images/works/mockup-bus-stop.jpg'
    },
    {
      id: 17,
      cat: 'brochure',
      catLabel: 'Infografis',
      title: 'Malaysia Climate Infographic',
      subtitle: 'Infografis',
      desc: 'Infografis',
       
      img: 'assets/images/works/infographic-iklim-malaysia.jpg',
      isContain: true
    },
    {
      id: 18,
      cat: 'brochure',
      catLabel: 'Infografis',
      title: 'MSP Recruitment Infographic',
      subtitle: 'Infografis',
      desc: 'Infografis',
       
      img: 'assets/images/works/infographic-msp.jpg',
      isContain: true
    },
    {
      id: 19,
      cat: 'brochure',
      catLabel: 'Brosur',
      title: 'Tri-Fold Brochure',
      subtitle: 'Brosur',
      desc: 'Brosur',
       
      img: 'assets/images/works/brochure-metschool-trifold.jpg',
      isContain: true
    }
  ];

  const carouselScene = document.getElementById('carousel-scene');
  const carouselRing = document.getElementById('carousel-ring');
  const carouselPrevBtn = document.getElementById('carousel-prev');
  const carouselNextBtn = document.getElementById('carousel-next');
  const filterBtns = document.querySelectorAll('.filter-btn');

  // Details elements
  const detailsCounter = document.getElementById('details-counter');
  const detailsCatTag = document.getElementById('details-cat-tag');
  const detailsWorkTitle = document.getElementById('details-work-title');
  const detailsWorkDesc = document.getElementById('details-work-desc');
  const detailsToolsList = document.getElementById('details-tools-list');
  const detailsZoomBtn = document.getElementById('details-zoom-btn');

  // Lightbox / Spotlight View elements
  const lightbox = document.getElementById('lightbox');
  const lbImg = document.getElementById('lb-img');
  const lbTitle = document.getElementById('lb-title');
  const lbSubtitle = document.getElementById('lb-subtitle');
  const lbDesc = document.getElementById('lb-desc');
  const lbCat = document.getElementById('lb-cat');
  const lbClose = document.getElementById('lb-close');

  let lightboxOpenedAt = 0;

  function openLightbox(item) {
    if (!lightbox || !item) return;
    lightboxOpenedAt = Date.now();

    if (lbImg) {
      lbImg.src = item.img;
      lbImg.alt = item.title;
    }
    if (lbTitle) lbTitle.textContent = item.title;
    if (lbSubtitle) lbSubtitle.textContent = item.subtitle || item.catLabel;
    if (lbDesc) {
      lbDesc.textContent = item.desc || '';
      lbDesc.style.display = item.desc ? 'block' : 'none';
    }
    if (lbCat) lbCat.textContent = item.catLabel;

    lightbox.classList.add('active');
  }

  function closeLightbox(force = false) {
    if (!lightbox) return;
    // Debounce to prevent synthetic touch / ghost click from immediately closing modal on mobile
    if (!force && Date.now() - lightboxOpenedAt < 400) return;

    lightbox.classList.remove('active');
  }

  if (lbClose) {
    lbClose.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      closeLightbox(true);
    });
  }

  const spotlightCard = document.getElementById('spotlight-card');
  if (spotlightCard) {
    spotlightCard.addEventListener('click', (e) => {
      e.stopPropagation();
    });
  }

  if (lightbox) {
    lightbox.addEventListener('click', (e) => {
      // Ignore click if it fired within 400ms of opening (synthetic touch/ghost click)
      if (Date.now() - lightboxOpenedAt < 400) return;
      if (e.target === lightbox) {
        e.preventDefault();
        closeLightbox(true);
      }
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && lightbox && lightbox.classList.contains('active')) {
      closeLightbox(true);
    }
  });

  if (detailsZoomBtn) {
    detailsZoomBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (activeCardsData && activeCardsData[currentIndex]) {
        openLightbox(activeCardsData[currentIndex]);
      }
    });
  }

  // ── Achievement Section Filter & Lightbox Inspection ─────────────
  (function initAchievementSection() {
    const filterBtns = document.querySelectorAll('.achieve-filter-btn');
    const certCards = document.querySelectorAll('.cert-card');

    if (filterBtns.length > 0 && certCards.length > 0) {
      filterBtns.forEach((btn) => {
        btn.addEventListener('click', () => {
          filterBtns.forEach((b) => b.classList.remove('active'));
          btn.classList.add('active');

          const filterVal = btn.getAttribute('data-filter');
          certCards.forEach((card) => {
            const cardYear = card.getAttribute('data-year');
            if (filterVal === 'all' || cardYear === filterVal) {
              card.classList.remove('is-hidden');
            } else {
              card.classList.add('is-hidden');
            }
          });
        });
      });
    }

    function openCertModal(card) {
      if (!card) return;
      const imgEl = card.querySelector('.cert-img');
      const title = card.getAttribute('data-title') || card.querySelector('.cert-title')?.textContent?.trim() || 'Sertifikat Penghargaan';
      const ref = card.getAttribute('data-ref') || '';
      const date = card.getAttribute('data-date') || '';
      const summaryEl = card.querySelector('.cert-summary');
      const desc = summaryEl ? summaryEl.textContent.trim() : '';

      if (imgEl && typeof openLightbox === 'function') {
        openLightbox({
          img: imgEl.getAttribute('src') || imgEl.src,
          title: title,
          subtitle: `Sertifikat Penghargaan • REF: #${ref} • ${date}`,
          desc: desc,
          catLabel: 'CERTIFICATE • MSP'
        });
      }
    }

    // Attach explicit click & touch handlers for View Full Screen and Inspect buttons
    certCards.forEach((card) => {
      // 1. Inspect button
      const actionBtn = card.querySelector('.cert-action-btn');
      if (actionBtn) {
        actionBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          openCertModal(card);
        });
      }

      // 2. View Full Screen button / pill
      const viewPill = card.querySelector('.cert-view-pill');
      if (viewPill) {
        viewPill.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          openCertModal(card);
        });
      }

      // 3. Image wrap direct tap
      const imgWrap = card.querySelector('.cert-image-wrap');
      if (imgWrap) {
        imgWrap.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          openCertModal(card);
        });
      }

      // 4. Fallback on entire card
      card.addEventListener('click', (e) => {
        if (e.target.closest('.cert-action-btn') || e.target.closest('.cert-view-pill') || e.target.closest('.cert-image-wrap')) {
          return;
        }
        openCertModal(card);
      });
    });
  })();

  // Carousel State
  let currentCategory = 'all';
  let activeCardsData = [];
  let currentIndex = 0;
  let currentAngle = 0;
  let currentRadius = 400;

  function buildActiveCards(category) {
    let filtered = category === 'all'
      ? WORKS_DATA
      : WORKS_DATA.filter((item) => item.cat === category);

    if (filtered.length === 0) filtered = WORKS_DATA;

    // Ensure a rich 3D cylindrical ring (minimum 6 cards)
    let cards = [];
    if (filtered.length === 1) {
      for (let i = 0; i < 6; i++) {
        cards.push({ ...filtered[0], virtualIdx: i, totalOriginal: 1, origIdx: 0 });
      }
    } else if (filtered.length === 2) {
      for (let cycle = 0; cycle < 3; cycle++) {
        filtered.forEach((item, idx) => {
          cards.push({ ...item, virtualIdx: cards.length, totalOriginal: 2, origIdx: idx });
        });
      }
    } else if (filtered.length === 3) {
      for (let cycle = 0; cycle < 2; cycle++) {
        filtered.forEach((item, idx) => {
          cards.push({ ...item, virtualIdx: cards.length, totalOriginal: 3, origIdx: idx });
        });
      }
    } else {
      cards = filtered.map((item, idx) => ({
        ...item,
        virtualIdx: idx,
        totalOriginal: filtered.length,
        origIdx: idx
      }));
    }

    return { cards, totalUnique: filtered.length };
  }

  function updateCarouselTransform(smooth = true) {
    if (!carouselRing) return;
    if (smooth) {
      carouselRing.style.transition = 'transform 0.65s cubic-bezier(0.2, 0.8, 0.25, 1)';
    } else {
      carouselRing.style.transition = 'none';
    }
    carouselRing.style.transform = `translateZ(-${currentRadius}px) rotateY(${currentAngle}deg)`;

    // Update active, neighbor, and distant highlights on cards for strong 3D depth
    const cardEls = carouselRing.querySelectorAll('.carousel-card');
    const count = activeCardsData.length;
    cardEls.forEach((card, idx) => {
      let dist = Math.abs(idx - currentIndex);
      dist = Math.min(dist, count - dist); // shortest distance along ring

      card.classList.remove('is-active', 'is-neighbor', 'is-distant');
      if (dist === 0) {
        card.classList.add('is-active');
      } else if (dist === 1) {
        card.classList.add('is-neighbor');
      } else {
        card.classList.add('is-distant');
      }
    });
  }

  function updateDetailsCard() {
    if (!activeCardsData || activeCardsData.length === 0) return;
    const currentItem = activeCardsData[currentIndex];
    if (!currentItem) return;

    const detailsCard = document.getElementById('carousel-details-card');

    if (detailsCounter) {
      const currentNum = (currentItem.origIdx + 1).toString().padStart(2, '0');
      const totalNum = currentItem.totalOriginal.toString().padStart(2, '0');
      detailsCounter.textContent = `${currentNum} / ${totalNum}`;
    }

    if (detailsCatTag) detailsCatTag.textContent = currentItem.catLabel;
    if (detailsWorkTitle) detailsWorkTitle.textContent = currentItem.title;
    if (detailsWorkDesc) detailsWorkDesc.textContent = currentItem.desc;

    if (detailsToolsList) {
      detailsToolsList.innerHTML = '';
      if (Array.isArray(currentItem.tools) && currentItem.tools.length > 0) {
        currentItem.tools.forEach((t, idx) => {
          const pill = document.createElement('span');
          pill.className = 'details-tool-pill';
          pill.style.animationDelay = `${0.04 + idx * 0.04}s`;
          pill.textContent = t;
          detailsToolsList.appendChild(pill);
        });
      }
    }

    if (detailsZoomBtn) {
      detailsZoomBtn.onclick = () => openLightbox(currentItem);
    }

    // Trigger smooth entrance animation on details update
    if (detailsCard) {
      detailsCard.classList.remove('is-updating');
      void detailsCard.offsetWidth; // Force CSS reflow to replay animations
      detailsCard.classList.add('is-updating');
    }
  }

  function renderCarousel(category, initialIndex = 0, isCategorySwitch = false) {
    if (!carouselRing) return;

    currentCategory = category;
    const { cards } = buildActiveCards(category);
    activeCardsData = cards;
    currentIndex = initialIndex;

    const count = cards.length;
    const stepAngle = 360 / count;

    // Calculate cylinder radius dynamically based on screen width & count
    const isMobile = window.innerWidth <= 640;
    const cardWidth = isMobile ? 250 : 310;
    currentRadius = Math.max(isMobile ? 270 : 380, Math.round((cardWidth / 2) / Math.tan(Math.PI / count)) + 25);

    carouselRing.innerHTML = '';

    cards.forEach((item, i) => {
      const cardEl = document.createElement('article');
      cardEl.className = 'carousel-card';
      if (isCategorySwitch) {
        cardEl.classList.add('is-entering-category');
      }
      if (i === currentIndex) cardEl.classList.add('is-active');

      const cardAngle = i * stepAngle;
      cardEl.style.transform = `rotateY(${cardAngle}deg) translateZ(${currentRadius}px)`;

      const delaySec = isCategorySwitch ? (Math.min(i, 8) * 0.042).toFixed(3) : 0;
      const innerDelayStyle = isCategorySwitch ? `style="animation-delay: ${delaySec}s;"` : '';

      cardEl.innerHTML = `
        <div class="carousel-card-inner" ${innerDelayStyle}>
          <div class="carousel-card-front">
            <div class="carousel-media-wrap">
              <span class="carousel-card-badge">${item.catLabel}</span>
              <div class="carousel-zoom-hint" title="Zoom In"><i class="bi bi-zoom-in"></i></div>
              <img src="${item.img}" alt="${item.title}" class="${item.isContain ? 'contain' : ''}" loading="lazy">
            </div>
            <div class="carousel-card-meta">
              <h4 class="carousel-card-title">${item.title}</h4>
              <span class="carousel-card-desc">${item.subtitle || item.catLabel}</span>
            </div>
          </div>
          <div class="carousel-card-back">
            <div class="back-stamp">
              <span class="back-logo">KEVIN. H</span>
              <span class="back-tag">STUDIO ARCHIVE • 2026</span>
              <i class="bi bi-grid-3x3 back-grid-icon"></i>
            </div>
          </div>
        </div>
      `;

      cardEl.addEventListener('click', (e) => {
        if (i === currentIndex) {
          openLightbox(item);
        } else {
          // Rotate to click target
          goToIndex(i);
        }
      });

      carouselRing.appendChild(cardEl);
    });

    currentAngle = -currentIndex * stepAngle;
    updateCarouselTransform(false);
    updateDetailsCard();

    if (isCategorySwitch) {
      setTimeout(() => {
        const enteredCards = carouselRing.querySelectorAll('.carousel-card.is-entering-category');
        enteredCards.forEach((c) => c.classList.remove('is-entering-category'));
      }, 650);
    }
  }

  function goToIndex(newIndex) {
    if (!activeCardsData || activeCardsData.length === 0) return;
    const count = activeCardsData.length;
    currentIndex = ((newIndex % count) + count) % count;
    const stepAngle = 360 / count;
    currentAngle = -currentIndex * stepAngle;
    updateCarouselTransform(true);
    updateDetailsCard();
  }

  function rotateCarousel(delta) {
    goToIndex(currentIndex + delta);
  }

  // Prev / Next Controls
  if (carouselPrevBtn) {
    carouselPrevBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      rotateCarousel(-1);
    });
  }

  if (carouselNextBtn) {
    carouselNextBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      rotateCarousel(1);
    });
  }

  // Filter Buttons with Category Switch Transition
  let categorySwitchTimeout = null;

  function switchCategory(targetCategory) {
    if (targetCategory === currentCategory && activeCardsData && activeCardsData.length > 0) return;

    filterBtns.forEach((b) => {
      if (b.dataset.filter === targetCategory) {
        b.classList.add('active');
      } else {
        b.classList.remove('active');
      }
    });

    if (categorySwitchTimeout) {
      clearTimeout(categorySwitchTimeout);
    }

    const worksContainer = document.getElementById('works-3d-container');
    if (worksContainer) {
      worksContainer.classList.add('is-switching-category');
    }

    categorySwitchTimeout = setTimeout(() => {
      categorySwitchTimeout = null;
      renderCarousel(targetCategory, 0, true);
      if (worksContainer) {
        worksContainer.classList.remove('is-switching-category');
      }
    }, 180);
  }

  filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      switchCategory(btn.dataset.filter);
    });
  });

  // Drag & Swipe Interaction
  if (carouselScene) {
    let isDragging = false;
    let dragStartX = 0;
    let dragStartAngle = 0;
    let hasDragged = false;

    carouselScene.addEventListener('pointerdown', (e) => {
      // Don't drag if clicking buttons
      if (e.target.closest('.carousel-arrow') || e.target.closest('.carousel-details-card')) return;
      isDragging = true;
      hasDragged = false;
      dragStartX = e.clientX;
      dragStartAngle = currentAngle;
      carouselScene.classList.add('is-dragging');
      carouselRing.style.transition = 'none';
    });

    window.addEventListener('pointermove', (e) => {
      if (!isDragging) return;
      const dx = e.clientX - dragStartX;
      if (Math.abs(dx) > 6) {
        hasDragged = true;
      }
      const count = activeCardsData.length;
      const isMobile = window.innerWidth <= 640;
      const cardWidth = isMobile ? 250 : 310;
      const sensitivity = 360 / (count * cardWidth);
      currentAngle = dragStartAngle + dx * sensitivity * 1.1;
      carouselRing.style.transform = `translateZ(-${currentRadius}px) rotateY(${currentAngle}deg)`;
    });

    window.addEventListener('pointerup', () => {
      if (!isDragging) return;
      isDragging = false;
      carouselScene.classList.remove('is-dragging');

      if (hasDragged) {
        const count = activeCardsData.length;
        const stepAngle = 360 / count;
        let snapIdx = Math.round(-currentAngle / stepAngle);
        goToIndex(snapIdx);
      }
    });

    window.addEventListener('pointercancel', () => {
      if (!isDragging) return;
      isDragging = false;
      carouselScene.classList.remove('is-dragging');
    });

    // Mouse wheel horizontal rotation
    let wheelTimer = null;
    carouselScene.addEventListener('wheel', (e) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY) || Math.abs(e.deltaY) > 20) {
        e.preventDefault();
        if (wheelTimer) return;
        const dir = e.deltaX !== 0 ? Math.sign(e.deltaX) : Math.sign(e.deltaY);
        rotateCarousel(dir);
        wheelTimer = setTimeout(() => { wheelTimer = null; }, 320);
      }
    }, { passive: false });
  }

  // Keyboard navigation when works section is in view
  window.addEventListener('keydown', (e) => {
    if (lightbox && lightbox.classList.contains('active')) return;
    const worksSection = document.getElementById('works');
    if (!worksSection) return;
    const rect = worksSection.getBoundingClientRect();
    const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
    if (!isVisible) return;

    if (e.key === 'ArrowLeft') {
      rotateCarousel(-1);
    } else if (e.key === 'ArrowRight') {
      rotateCarousel(1);
    }
  });

  // Initialize Works 3D Carousel on Load
  renderCarousel('all', 0);

  // Resize handler to recalculate radius smoothly
  window.addEventListener('resize', () => {
    if (activeCardsData && activeCardsData.length > 0) {
      const isMobile = window.innerWidth <= 640;
      const cardWidth = isMobile ? 250 : 310;
      const count = activeCardsData.length;
      currentRadius = Math.max(isMobile ? 270 : 380, Math.round((cardWidth / 2) / Math.tan(Math.PI / count)) + 25);
      
      const stepAngle = 360 / count;
      const cardEls = carouselRing.querySelectorAll('.carousel-card');
      cardEls.forEach((card, i) => {
        card.style.transform = `rotateY(${i * stepAngle}deg) translateZ(${currentRadius}px)`;
      });
      updateCarouselTransform(false);
    }
  });

  // Current Year
  const currentYearEl = document.getElementById("currentYear");
  if (currentYearEl) {
    currentYearEl.innerText = new Date().getFullYear();
  }

  // 6. Copy Buttons
  document.querySelectorAll('.copy-pill').forEach((pill) => {
    pill.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const text = pill.dataset.copy;
      if (text) {
        navigator.clipboard.writeText(text);
        const origHTML = pill.innerHTML;
        pill.innerHTML = '<i class="bi bi-check2"></i> Copied!';
        pill.style.background = 'var(--accent-blue-light)';
        setTimeout(() => {
          pill.innerHTML = origHTML;
          pill.style.background = '';
        }, 1800);
      }
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
      }
      updateDimensions();

      // Return to original after 3 seconds of being untouched, then resume auto-cycle
      scheduleReset();
      startAutoCycle();
    });
  }
});
