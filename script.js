// ============================================================
// THE DIRECTOR'S CUT — shared behavior
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  setActiveNavLink();
  startTimecode();
  initMobileMenu();
  initDropdown();
  initCollapsible(); // before reveal, so nodes settle before they're observed
  initFilterChips();
  initBeforeAfter();
  initScrollReveal();
  initContactForm();
  initThemeToggle();
  initImageInteractions();
  initVideoAutoplay();
  initVideoModal();
  initScrollButtons();
  initGradeParallax();
  initChat();
  initWheel();
});

/* Nudge the background layers opposite the pointer so the swirls follow the
   mouse. Pointer-driven only — no autonomous extra motion on top of the CSS
   loops. */
function initGradeParallax() {
  const grade = document.querySelector('.bg-grade');
  if (!grade) return;
  if (!window.matchMedia) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  let frame = null;
  let nx = 0;
  let ny = 0;

  window.addEventListener('pointermove', (e) => {
    nx = (e.clientX / window.innerWidth - 0.5) * -2;
    ny = (e.clientY / window.innerHeight - 0.5) * -2;
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = null;
      grade.style.setProperty('--gx', (nx * 18).toFixed(1) + 'px');
      grade.style.setProperty('--gy', (ny * 14).toFixed(1) + 'px');
    });
  }, { passive: true });
}

/* Highlight the nav link matching the current page, and the parent
   dropdown trigger when we're on one of its child pages. */
function setActiveNavLink() {
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link').forEach(link => {
    const href = link.getAttribute('href');
    if (href === path || (path === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });

  // Category pages (video-editing.html, etc.) live under the "Work" menu
  const categoryPages = ['video-editing.html', 'graphics-design.html', 'brand-identity.html',
    'photography.html', 'motion-design.html', 'others.html'];
  if (categoryPages.includes(path)) {
    document.querySelectorAll('.nav-dropdown > .nav-link').forEach(trigger => {
      if (trigger.getAttribute('href') === 'work.html') trigger.classList.add('active');
    });
  }
}

/* Live-running clock in the header */
function startTimecode() {
  const el = document.getElementById('timecode');
  if (!el) return;
  const pad = (n) => String(n).padStart(2, '0');
  const tick = () => {
    const now = new Date();
    let hours = now.getHours();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    el.textContent = `${pad(hours)}:${pad(now.getMinutes())}:${pad(now.getSeconds())} ${ampm}`;
  };
  tick();
  setInterval(tick, 1000);
}

/* Mobile nav toggle — aria-expanded, Escape to close, scroll lock */
function initMobileMenu() {
  const toggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.main-nav');
  if (!toggle || !nav) return;

  const setOpen = (open) => {
    nav.classList.toggle('open', open);
    document.body.classList.toggle('nav-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    if (!open) {
      // Drop focus so :focus-within on open dropdowns releases
      if (nav.contains(document.activeElement)) document.activeElement.blur();
    }
  };

  toggle.addEventListener('click', () => setOpen(!nav.classList.contains('open')));
  nav.querySelectorAll('a').forEach(a => {
    // Dropdown triggers open a submenu instead of navigating — leave them alone
    if (a.parentElement && a.parentElement.classList.contains('nav-dropdown')) return;
    a.addEventListener('click', () => setOpen(false));
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav.classList.contains('open')) {
      setOpen(false);
      toggle.focus();
    }
  });
}

/* Desktop hover dropdowns + mobile tap dropdowns */
function initDropdown() {
  const dropdowns = document.querySelectorAll('.nav-dropdown');
  if (!dropdowns.length) return;

  dropdowns.forEach(dropdown => {
    const trigger = dropdown.querySelector('.nav-link');
    if (!trigger) return;
    trigger.setAttribute('aria-haspopup', 'true');
    trigger.setAttribute('aria-expanded', 'false');

    const setOpen = (open) => {
      dropdown.classList.toggle('open', open);
      trigger.setAttribute('aria-expanded', String(open));
      if (!open) trigger.blur(); // release :focus-within so it can actually close
    };

    trigger.addEventListener('click', function (e) {
      if (window.innerWidth <= 860) {
        e.preventDefault();
        dropdowns.forEach(d => {
          if (d !== dropdown) {
            d.classList.remove('open');
            const t = d.querySelector('.nav-link');
            if (t) t.setAttribute('aria-expanded', 'false');
          }
        });
        setOpen(!dropdown.classList.contains('open'));
      }
    });

    dropdown.querySelectorAll('.dropdown-item').forEach(item => {
      item.addEventListener('click', () => setOpen(false));
    });

    dropdown.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        setOpen(false);
        trigger.focus();
      }
    });
  });
}

/* Category filter chips on the Work index — only real filters have data-filter.
   (Otherwise the toolkit tags on the About page behave like filters.) */
function initFilterChips() {
  const chips = document.querySelectorAll('.filter-chip[data-filter]');
  if (!chips.length) return;
  const cards = document.querySelectorAll('[data-category]');
  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      chips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      const filter = chip.dataset.filter;
      cards.forEach(card => {
        const show = filter === 'all' || card.dataset.category === filter;
        card.style.display = show ? '' : 'none';
      });
    });
  });
}

/* Before / after drag slider on case study pages */
function initBeforeAfter() {
  document.querySelectorAll('.ba-slider').forEach(slider => {
    const before = slider.querySelector('.ba-before');
    const handle = slider.querySelector('.ba-handle');
    const range = slider.querySelector('.ba-range');
    if (!before || !handle || !range) return;
    const update = (val) => {
      before.style.width = val + '%';
      handle.style.left = val + '%';
    };
    range.addEventListener('input', (e) => update(e.target.value));
    update(range.value || 50);
  });
}

/* Fade/slide reveal for cards and sections as they enter the viewport */
function initScrollReveal() {
  const items = document.querySelectorAll('.reveal');
  if (!items.length) return;
  if (!('IntersectionObserver' in window)) {
    items.forEach(i => i.classList.add('in-view'));
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.01 });
  items.forEach(i => observer.observe(i));
}

/* ============================================================
   EmailJS Contact Form Handler
   ============================================================ */
function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    const btn = form.querySelector('button[type="submit"]');
    const status = form.querySelector('.form-status');
    const originalText = btn.textContent;

    // Honeypot: bots fill the hidden field, humans never see it
    const honeypot = form.querySelector('[name="website"]');
    if (honeypot && honeypot.value) {
      status.style.color = '#4ade80';
      status.textContent = '✓ Message received — I\'ll be in touch shortly.';
      form.reset();
      return;
    }

    if (typeof emailjs === 'undefined') {
      status.style.color = '#f87171';
      status.textContent = '✗ Something went wrong. Please try again or email me directly.';
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Sending…';
    status.textContent = '';
    status.style.color = '';

    const SERVICE_ID = 'service_48hq188';
    const TEMPLATE_ID = 'template_8c6dzcq';

    emailjs.sendForm(SERVICE_ID, TEMPLATE_ID, this)
      .then(function () {
        status.style.color = '#4ade80';
        status.textContent = '✓ Message received — I\'ll be in touch shortly.';
        form.reset();
        btn.disabled = false;
        btn.textContent = originalText;
      })
      .catch(function (error) {
        status.style.color = '#f87171';
        status.textContent = '✗ Something went wrong. Please try again or email me directly.';
        console.error('EmailJS Error:', error);
        btn.disabled = false;
        btn.textContent = originalText;
      });
  });
}

/* Collapsible category sections.
   Restructures the header into the standard accordion pattern —
   <h2><button aria-expanded>…</button></h2> — so the section keeps its
   place in the heading outline while staying keyboard operable. */
function initCollapsible() {
  let sectionIndex = 0;

  document.querySelectorAll('.category-section').forEach(section => {
    const head = section.querySelector('.category-section-head');
    if (!head) return;

    let heading = head.querySelector('h2');
    if (!heading) {
      heading = document.createElement('h2');
      head.appendChild(heading);
    }

    let trigger = heading.querySelector(':scope > .section-toggle');
    if (!trigger) {
      trigger = document.createElement('button');
      trigger.type = 'button';
      trigger.className = 'section-toggle';

      // Fold every sibling of the heading into the button, in document order
      Array.from(head.childNodes).forEach(node => {
        if (node === heading) {
          while (heading.firstChild) trigger.appendChild(heading.firstChild);
        } else {
          trigger.appendChild(node);
        }
      });

      const arrow = document.createElement('span');
      arrow.className = 'toggle-icon';
      arrow.setAttribute('aria-hidden', 'true');
      arrow.textContent = '▼';
      trigger.appendChild(arrow);

      heading.appendChild(trigger);
    }

    // Wrap everything after the heading so the CSS grid collapse has a target
    let wrapper = section.querySelector('.collapsible-wrapper');
    if (!wrapper) {
      wrapper = document.createElement('div');
      wrapper.className = 'collapsible-wrapper';
      const inner = document.createElement('div');
      inner.className = 'collapsible-inner';
      wrapper.appendChild(inner);
      while (head.nextSibling) inner.appendChild(head.nextSibling);
      section.appendChild(wrapper);
    }

    if (!wrapper.id) {
      sectionIndex += 1;
      wrapper.id = 'section-panel-' + sectionIndex;
    }
    trigger.setAttribute('aria-controls', wrapper.id);
    trigger.setAttribute('aria-expanded', String(!section.classList.contains('collapsed')));

    const toggle = () => {
      const collapsed = section.classList.toggle('collapsed');
      trigger.setAttribute('aria-expanded', String(!collapsed));
    };

    trigger.addEventListener('click', toggle);
    // Clicking anywhere else on the header row collapses too (pointer only —
    // the button already owns keyboard activation)
    head.addEventListener('click', (e) => {
      if (!e.target.closest('.section-toggle')) toggle();
    });
  });
}

/* Helpers for 1-second Hover Pop-out & Dim Background */
function triggerCardPopout(card) {
  card.classList.add('pop-out');
  document.body.classList.add('has-popout');
  let parent = card.parentElement;
  while (parent && parent !== document.body) {
    parent.classList.add('has-popout-parent');
    parent = parent.parentElement;
  }
}

function removeCardPopout(card) {
  card.classList.remove('pop-out');
  if (!document.querySelector('.frame-card.pop-out, .video-card.pop-out')) {
    document.body.classList.remove('has-popout');
    document.querySelectorAll('.has-popout-parent').forEach(el => el.classList.remove('has-popout-parent'));
  }
}

/* 1-Second Hover Pop-out and Lightbox for All Frame Cards */
function initImageInteractions() {
  if (!document.querySelector('.lightbox')) {
    const lb = document.createElement('div');
    lb.className = 'lightbox';
    lb.innerHTML = '<button class="lightbox-close" aria-label="Close">×</button><img class="lightbox-img" src="" alt="">';
    document.body.appendChild(lb);

    const img = lb.querySelector('.lightbox-img');
    const closeBtn = lb.querySelector('.lightbox-close');
    let opener = null;

    const closeLightbox = () => {
      lb.classList.remove('active');
      setTimeout(() => img.classList.remove('zoomed'), 300);
      if (opener && document.contains(opener)) opener.focus();
      opener = null;
    };

    closeBtn.addEventListener('click', closeLightbox);
    lb.addEventListener('click', (e) => {
      if (e.target === lb) closeLightbox();
    });
    img.addEventListener('click', () => img.classList.toggle('zoomed'));

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && lb.classList.contains('active')) closeLightbox();
    });

    lb._setOpener = (el) => { opener = el; };
  }

  const lightbox = document.querySelector('.lightbox');
  const lightboxImg = document.querySelector('.lightbox-img');

  document.querySelectorAll('.frame-card').forEach(card => {
    let hoverTimer;

    card.addEventListener('mouseenter', () => {
      if (document.querySelector('.lightbox.active')) return;
      hoverTimer = setTimeout(() => triggerCardPopout(card), 1000);
    });

    card.addEventListener('mouseleave', () => {
      clearTimeout(hoverTimer);
      removeCardPopout(card);
    });

    card.addEventListener('click', (e) => {
      const href = card.getAttribute('href');
      // Cards that navigate normally keep their default behaviour
      if (card.tagName === 'A' && href && !href.startsWith('#') && !href.startsWith('assets')) {
        return;
      }

      const img = card.querySelector('img');
      if (!img) return;

      e.preventDefault();
      clearTimeout(hoverTimer);
      removeCardPopout(card);
      lightboxImg.src = img.src;
      lightboxImg.alt = img.alt || '';
      lightbox.classList.add('active');
      if (lightbox._setOpener) lightbox._setOpener(card);
      const close = lightbox.querySelector('.lightbox-close');
      if (close) close.focus();
    });
  });
}

/* Showreel / project film modal.
   Add data-video-src="https://www.youtube.com/embed/VIDEO_ID" to a .reel-frame
   to make its play button work. Frames without one lose the dead button. */
function initVideoModal() {
  const frames = document.querySelectorAll('.reel-frame');
  if (!frames.length) return;

  const modal = document.createElement('div');
  modal.className = 'video-modal';
  modal.innerHTML = '<button class="video-modal-close" aria-label="Close video">×</button>' +
    '<div class="video-modal-frame"></div>';
  document.body.appendChild(modal);

  const frameBox = modal.querySelector('.video-modal-frame');
  const closeBtn = modal.querySelector('.video-modal-close');
  let opener = null;

  const closeModal = () => {
    modal.classList.remove('active');
    frameBox.innerHTML = ''; // stop playback
    if (opener && document.contains(opener)) opener.focus();
    opener = null;
  };

  closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) closeModal();
  });

  frames.forEach(frame => {
    const src = frame.getAttribute('data-video-src');
    const btn = frame.querySelector('.play-btn');

    if (!src) {
      // No video wired up — don't advertise a control that does nothing
      if (btn) btn.remove();
      return;
    }

    const open = () => {
      frameBox.innerHTML = '<iframe src="' + src + '" title="Video player" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>';
      modal.classList.add('active');
      opener = btn || frame;
      closeBtn.focus();
    };

    frame.addEventListener('click', open);
    frame.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
    });
    if (btn) {
      btn.setAttribute('aria-haspopup', 'dialog');
      // Enter/Space on the button bubbles to the frame handler, but make
      // the frame itself focusable only when it is actionable
      frame.setAttribute('tabindex', '0');
      frame.setAttribute('role', 'button');
      frame.setAttribute('aria-label', 'Play video');
    }
  });
}

/* 1-Second Hover Pop-out and Video Autoplay for Video Cards */
function initVideoAutoplay() {
  const videoCards = document.querySelectorAll('.video-card');
  if (videoCards.length === 0) return;

  videoCards.forEach(card => {
    let hoverTimer;
    card.addEventListener('mouseenter', () => {
      if (document.querySelector('.lightbox.active')) return;
      hoverTimer = setTimeout(() => triggerCardPopout(card), 1000);
    });
    card.addEventListener('mouseleave', () => {
      clearTimeout(hoverTimer);
      removeCardPopout(card);
    });
  });

  if (!window.YT) {
    const tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
  }

  const prevOnReady = window.onYouTubeIframeAPIReady;
  window.onYouTubeIframeAPIReady = function () {
    if (typeof prevOnReady === 'function') prevOnReady();

    videoCards.forEach((card, index) => {
      const iframe = card.querySelector('iframe');
      if (!iframe) return;

      iframe.id = 'yt-player-' + index;
      card.style.position = 'relative';

      let overlay = card.querySelector('.video-hover-overlay');
      if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'video-hover-overlay';
        overlay.style.position = 'absolute';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = 'calc(100% - 60px)';
        overlay.style.zIndex = '10';
        card.appendChild(overlay);
      }

      new YT.Player(iframe.id, {
        events: {
          'onReady': function (event) {
            let playTimer;

            overlay.addEventListener('mouseenter', () => {
              playTimer = setTimeout(() => {
                triggerCardPopout(card);
                try {
                  event.target.mute();
                  event.target.playVideo();
                } catch (err) {}
                overlay.style.pointerEvents = 'none';
              }, 1000);
            });

            overlay.addEventListener('mouseleave', () => clearTimeout(playTimer));

            card.addEventListener('mouseleave', () => {
              clearTimeout(playTimer);
              removeCardPopout(card);
              try {
                const state = event.target.getPlayerState();
                if (state === YT.PlayerState.PLAYING || state === YT.PlayerState.BUFFERING) {
                  event.target.pauseVideo();
                }
              } catch (err) {}
              overlay.style.pointerEvents = 'auto';
            });
          }
        }
      });
    });
  };
}

/* ── Scroll-to-Top / Scroll-to-Bottom Buttons ── */
function initScrollButtons() {
  const topBtn = document.getElementById('scrollToTop');
  const bottomBtn = document.getElementById('scrollToBottom');
  if (!topBtn || !bottomBtn) return;

  function updateVisibility() {
    const scrollY = window.scrollY || window.pageYOffset;
    const docHeight = document.documentElement.scrollHeight;
    const winHeight = window.innerHeight;
    const nearBottom = scrollY + winHeight >= docHeight - 100;

    topBtn.classList.toggle('visible', scrollY > 300);
    bottomBtn.classList.toggle('visible', !nearBottom && docHeight > winHeight + 300);
  }

  window.addEventListener('scroll', updateVisibility, { passive: true });
  updateVisibility();

  topBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  bottomBtn.addEventListener('click', () =>
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' }));
}

/* ---------- Dark / Light theme toggle ---------- */
function initThemeToggle() {
  const toggle = document.getElementById('themeToggle');
  if (!toggle) return;

  const saved = localStorage.getItem('theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);

  toggle.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    toggle.setAttribute('aria-label', next === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
  });
}

/* ============================================================
   CHAT ASSISTANT
   Built in JS so every page picks it up without duplicating markup.
   This is a rule-based site guide, not a language model: it matches what
   you type against a knowledge map of this site and answers with the
   matching page. Swap answerFor() for a real API call if you ever want
   genuinely open-ended answers.
   ============================================================ */
function initChat() {
  if (document.querySelector('.chat-fab')) return;

  const ICON_CHAT = '<svg class="chat-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 2H4a2 2 0 0 0-2 2v18l4-4h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2zM7 9h10v2H7V9zm6 5H7v-2h6v2zm4-6H7V6h10v2z"/></svg>' +
    '<svg class="chat-close-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M18.3 5.7a1 1 0 0 0-1.4 0L12 10.6 7.1 5.7a1 1 0 1 0-1.4 1.4L10.6 12l-4.9 4.9a1 1 0 1 0 1.4 1.4L12 13.4l4.9 4.9a1 1 0 0 0 1.4-1.4L13.4 12l4.9-4.9a1 1 0 0 0 0-1.4z"/></svg>';

  const KB = [
    { keys: ['graphics', 'graphic', 'flyer', 'flyers', 'poster', 'print', 'summit'],
      say: 'Graphics design is the biggest archive: event flyers, summits, church and business collateral, plus a dedicated car dealership section.',
      go: [['Graphics design', 'graphics-design.html'], ['Car dealership', 'graphics-design.html#car-designs']] },
    { keys: ['car', 'cars', 'dealership', 'auto', 'autos', 'vehicle', 'automotive'],
      say: 'The car dealership designs live with the graphics work — ad creative and vehicle campaign layouts for P. E. Alabi Autos.',
      go: [['Car dealership designs', 'graphics-design.html#car-designs']] },
    { keys: ['video', 'editing', 'edit', 'reel', 'short', 'shorts', 'youtube video'],
      say: 'Video editing covers car dealership ads, short-form edits and documentary cuts.',
      go: [['Video editing', 'video-editing.html'], ['YouTube channel', 'https://www.youtube.com/@FesTech.d.creator']] },
    { keys: ['brand identity', 'branding', 'logo', 'logos', 'identity', 'brand system'],
      say: 'Brand identity work is shown as full brand books you can read right in the browser — Quevora, PE Alabi Autos, Darah House and more.',
      go: [['Brand identity', 'brand-identity.html']] },
    { keys: ['photo', 'photography', 'shoot', 'retouch', 'still'],
      say: 'The photography section holds the editorial and on-set stills gallery.',
      go: [['Photography', 'photography.html']] },
    { keys: ['motion', 'animation', 'animated', 'sting', 'lower third'],
      say: 'Motion design is still being uploaded — it is marked coming soon for now.',
      go: [['Motion design', 'motion-design.html']] },
    { keys: ['service', 'services', 'offer', 'pricing', 'price', 'cost', 'charge', 'rate', 'package', 'process', 'how do you work', 'deliver'],
      say: 'Services cover brand identity, creative direction, graphics, video editing, colour grading, photography and post consulting — each with the process I follow.',
      go: [['Services', 'services.html'], ['Get a quote', 'contact.html']] },
    { keys: ['contact', 'email', 'phone', 'call', 'hire', 'reach', 'talk', 'enquir', 'brief'],
      say: 'Fastest route is email — I reply within 24 hours. The contact form routes straight to my inbox too.',
      go: [['Contact', 'contact.html'], ['Email me', 'mailto:festusiyenahie@gmail.com']] },
    { keys: ['cv', 'resume', 'résumé', 'curriculum'],
      say: 'My CV is on the site as a readable, downloadable PDF.',
      go: [['View CV', 'cv.html']] },
    { keys: ['about', 'who', 'yourself', 'bio', 'background', 'experience', 'career', 'timeline', 'years', 'chief creative', 'cco', 'director'],
      say: 'I am Chief Creative Officer at Quevora, with 11 years in design and 6 in video editing. The About page has the full career reel.',
      go: [['About', 'about.html']] },
    { keys: ['tool', 'tools', 'software', 'app', 'figma', 'premiere', 'photoshop', 'canva', 'gear'],
      say: 'Day-to-day tools: Figma, Framer, Photoshop, Illustrator, InDesign, CorelDRAW, Canva, CapCut, Premiere Pro, Microsoft Office and Google Docs.',
      go: [['Toolkit', 'about.html#tools']] },
    { keys: ['work', 'portfolio', 'project', 'projects', 'show me', 'see your', 'selected'],
      say: 'Everything is filed by discipline on the Work page — start there to browse it all.',
      go: [['All work', 'work.html']] },
    { keys: ['instagram', 'insta', 'social'],
      say: 'Instagram is where the day-to-day work gets posted.',
      go: [['Instagram', 'https://www.instagram.com/festech.d.creator/']] },
    { keys: ['linkedin', 'link'],
      say: 'LinkedIn has the full professional history.',
      go: [['LinkedIn', 'https://www.linkedin.com/in/festech/']] },
    { keys: ['whatsapp', 'quick', 'soon', 'fast', 'turnaround', 'how long', 'when can', '24'],
      say: 'I aim to get back to every enquiry within 24 hours.',
      go: [['Start a project', 'contact.html']] },
    { keys: ['award', 'recognition', 'jci', 'simply worship', 'honour', 'honor'],
      say: 'Recognition is listed on the About page — including work for JCI, Simply Worship and several tech events and expos.',
      go: [['Recognition', 'about.html']] },
    { keys: ['team', 'lead', 'lead designer', 'agency'],
      say: 'I have led design teams of five and currently direct creative across Quevora, Visco Group and the Edo State Tourism Agency.',
      go: [['About', 'about.html']] }
  ];

  const CHIPS = ['Show me the work', 'Brand identity', 'Video editing', 'Hire me', 'About Festus', 'View CV'];

  const panel = document.createElement('div');
  panel.className = 'chat-panel';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', 'Portfolio assistant');
  panel.innerHTML =
    '<div class="chat-head">' +
      '<div class="chat-avatar" aria-hidden="true">F</div>' +
      '<div class="chat-head-text"><strong>FesTech Assistant</strong>' +
      '<span><i class="chat-status-dot"></i>Ask about the portfolio</span></div>' +
    '</div>' +
    '<div class="chat-log" role="log" aria-live="polite"></div>' +
    '<div class="chat-chips"></div>' +
    '<form class="chat-form"><input type="text" aria-label="Ask a question" ' +
      'placeholder="Ask about the work, services, CV…" autocomplete="off">' +
      '<button type="submit" aria-label="Send"><svg viewBox="0 0 24 24" aria-hidden="true">' +
      '<path d="M2.01 21 23 12 2.01 3 2 10l15 2-15 2z"/></svg></button></form>';

  const fab = document.createElement('button');
  fab.className = 'chat-fab';
  fab.type = 'button';
  fab.setAttribute('aria-label', 'Open portfolio assistant');
  fab.setAttribute('aria-expanded', 'false');
  fab.innerHTML = ICON_CHAT;

  document.body.appendChild(panel);
  document.body.appendChild(fab);

  const log = panel.querySelector('.chat-log');
  const form = panel.querySelector('.chat-form');
  const input = form.querySelector('input');
  const chips = panel.querySelector('.chat-chips');

  const add = (who, html) => {
    const m = document.createElement('div');
    m.className = 'chat-msg chat-msg--' + who;
    m.innerHTML = html;
    log.appendChild(m);
    log.scrollTop = log.scrollHeight;
    return m;
  };

  const open = (state) => {
    panel.classList.toggle('is-open', state);
    fab.classList.toggle('is-open', state);
    fab.setAttribute('aria-expanded', String(state));
    fab.setAttribute('aria-label', state ? 'Close portfolio assistant' : 'Open portfolio assistant');
    if (state) { input.focus(); }
  };

  fab.addEventListener('click', () => {
    const next = !panel.classList.contains('is-open');
    open(next);
    if (next && !log.children.length) greet();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && panel.classList.contains('is-open')) { open(false); fab.focus(); }
  });

  const linkRow = (links) => {
    if (!links || !links.length) return '';
    return '<div class="chat-links">' +
      links.map(([label, href]) => '<a href="' + href + '">' + label + '</a>').join('') +
      '</div>';
  };

  const greet = () => {
    add('bot', 'Hi — I can point you to anything on this portfolio: the work, services, my CV, or how to get in touch.' +
      linkRow([['Contact', 'contact.html'], ['All work', 'work.html']]));
    CHIPS.forEach(c => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'chat-chip';
      b.textContent = c;
      b.addEventListener('click', () => { ask(c); });
      chips.appendChild(b);
    });
  };

  const answerFor = (text) => {
    const q = ' ' + text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ') + ' ';
    let best = null;
    let bestScore = 0;
    KB.forEach(entry => {
      let score = 0;
      entry.keys.forEach(k => { if (q.includes(k)) score += k.length; });
      if (score > bestScore) { bestScore = score; best = entry; }
    });
    if (best) return best;
    return {
      say: 'I did not catch that one. I am a site guide rather than a general chatbot, so I am best at questions about the work, services, CV and contact details. Email ' +
        '<a href="mailto:festusiyenahie@gmail.com">festusiyenahie@gmail.com</a> and it goes straight to me.',
      go: [['Contact', 'contact.html'], ['View CV', 'cv.html']]
    };
  };

  const ask = (text) => {
    const clean = String(text || '').trim();
    if (!clean) return;
    add('user', clean.replace(/</g, '&lt;'));
    input.value = '';
    const ans = answerFor(clean);
    add('bot', ans.say + linkRow(ans.go));
  };

  form.addEventListener('submit', (e) => { e.preventDefault(); ask(input.value); });
}

function initWheel() {
  const track = document.getElementById('wheelTrack');
  if (!track) return;
  let isDown = false, startX = 0, scrollLeft = 0, moved = false;
  let autoId = null, pausedUntil = 0;
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const start = (x) => {
    isDown = true; moved = false;
    pausedUntil = Date.now() + 2800;
    startX = x - track.offsetLeft;
    scrollLeft = track.scrollLeft;
    track.classList.add('is-dragging');
  };
  const move = (x) => {
    if (!isDown) return;
    const cur = x - track.offsetLeft;
    const dist = cur - startX;
    if (Math.abs(dist) > 4) moved = true;
    track.scrollLeft = scrollLeft - dist;
  };
  const end = () => {
    isDown = false;
    track.classList.remove('is-dragging');
    pausedUntil = Date.now() + 2800;
  };

  track.addEventListener('mousedown', (e) => start(e.pageX));
  track.addEventListener('mousemove', (e) => move(e.pageX));
  track.addEventListener('mouseup', end);
  track.addEventListener('mouseleave', end);
  track.addEventListener('touchstart', (e) => start(e.touches[0].pageX), { passive: true });
  track.addEventListener('touchmove', (e) => move(e.touches[0].pageX), { passive: true });
  track.addEventListener('touchend', end);
  // Only suppress the click when we actually dragged; taps must navigate
  track.addEventListener('click', (e) => {
    if (!moved) return;
    // a real drag happened — swallow the click that the drag generated
    e.preventDefault();
    e.stopPropagation();
    moved = false;
  });

  const wrap = track.closest('.wheel-wrap');
  if (wrap) {
    const left = wrap.querySelector('.wheel-arrow--left');
    const right = wrap.querySelector('.wheel-arrow--right');
    if (left) left.addEventListener('click', () => { pausedUntil = Date.now() + 4000; track.scrollBy({ left: -260, behavior: 'smooth' }); });
    if (right) right.addEventListener('click', () => { pausedUntil = Date.now() + 4000; track.scrollBy({ left: 260, behavior: 'smooth' }); });
  }

  if (!prefersReduced) {
    const gap = 16;
    const cardStep = () => {
      const card = track.querySelector('.wheel-card');
      return card ? card.getBoundingClientRect().width + gap : 236;
    };
    const step = () => {
      if (Date.now() < pausedUntil || isDown || document.hidden) return;
      const max = track.scrollWidth - track.clientWidth;
      if (max <= 4) return;
      const s = cardStep();
      const next = track.scrollLeft + s;
      if (next >= max - 2) {
        track.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        track.scrollBy({ left: s, behavior: 'smooth' });
      }
    };
    autoId = setInterval(step, 2600);
    track.addEventListener('mouseenter', () => { pausedUntil = Date.now() + 4000; });
    track.addEventListener('focusin', () => { pausedUntil = Date.now() + 4000; });
    document.addEventListener('visibilitychange', () => { if (document.hidden) pausedUntil = Date.now() + 1200; });
    track._wheelStep = step;
    track._wheelPausedUntil = () => pausedUntil;
  }
  // expose for tests / teardown
  track._wheelAutoId = autoId;
}