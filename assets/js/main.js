document.addEventListener('DOMContentLoaded', function () {
  // Copy BibTeX to clipboard
  var copyBtn = document.querySelector('.copy-btn');
  if (copyBtn) {
    copyBtn.addEventListener('click', function () {
      var text = document.querySelector('.bibtex-wrap pre').innerText;
      navigator.clipboard.writeText(text).then(function () {
        var original = copyBtn.textContent;
        copyBtn.textContent = 'Copied!';
        setTimeout(function () { copyBtn.textContent = original; }, 1800);
      });
    });
  }

  // Back-to-top button
  var toTop = document.querySelector('.to-top');
  if (toTop) {
    window.addEventListener('scroll', function () {
      if (window.scrollY > 800) {
        toTop.classList.add('visible');
      } else {
        toTop.classList.remove('visible');
      }
    });
    toTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // Hero teaser video: pause/play toggle
  var heroVideo = document.querySelector('.hero-visual video');
  var videoToggle = document.querySelector('.video-toggle');
  if (heroVideo && videoToggle) {
    function syncVideoToggle() {
      var paused = heroVideo.paused;
      videoToggle.classList.toggle('is-paused', paused);
      videoToggle.setAttribute('aria-label', (paused ? 'Play' : 'Pause') + ' teaser video');
    }

    videoToggle.addEventListener('click', function () {
      if (heroVideo.paused) {
        heroVideo.play();
      } else {
        heroVideo.pause();
      }
    });
    heroVideo.addEventListener('play', syncVideoToggle);
    heroVideo.addEventListener('pause', syncVideoToggle);

    // Respect reduced-motion preferences: start paused on a fully visible slide
    // (the video opens on a blank frame that fades in).
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      heroVideo.removeAttribute('autoplay');
      heroVideo.pause();
      heroVideo.currentTime = 3;
    }
    syncVideoToggle();
  }

  // Gallery carousels (one per .gallery-panel)
  document.querySelectorAll('.gallery-panel').forEach(function (panel) {
    var track = panel.querySelector('.gallery-track');
    var slides = Array.prototype.slice.call(panel.querySelectorAll('.gallery-slide'));
    var dotsWrap = panel.querySelector('.gallery-dots');
    var prevBtn = panel.querySelector('.gallery-arrow.prev');
    var nextBtn = panel.querySelector('.gallery-arrow.next');
    var counter = panel.querySelector('.gallery-counter');
    var index = 0;

    slides.forEach(function (_, i) {
      var dot = document.createElement('button');
      dot.className = 'gallery-dot';
      dot.setAttribute('aria-label', 'Go to slide ' + (i + 1));
      dot.addEventListener('click', function () { goTo(i); });
      dotsWrap.appendChild(dot);
    });
    var dots = Array.prototype.slice.call(dotsWrap.querySelectorAll('.gallery-dot'));

    function render() {
      track.style.transform = 'translateX(-' + (index * 100) + '%)';
      dots.forEach(function (d, i) { d.classList.toggle('active', i === index); });
      if (counter) counter.textContent = (index + 1) + ' / ' + slides.length;
    }

    function goTo(i) {
      index = (i + slides.length) % slides.length;
      render();
    }

    if (prevBtn) prevBtn.addEventListener('click', function () { goTo(index - 1); });
    if (nextBtn) nextBtn.addEventListener('click', function () { goTo(index + 1); });

    render();
  });

  // Qualitative results: click (or tap) an image to view it full size
  var galleryImgs = document.querySelectorAll('#results .gallery-slide img');
  if (galleryImgs.length) {
    var lightbox = document.createElement('div');
    lightbox.className = 'lightbox';
    lightbox.setAttribute('role', 'dialog');
    lightbox.setAttribute('aria-modal', 'true');
    lightbox.setAttribute('aria-label', 'Enlarged image');
    lightbox.hidden = true;
    lightbox.innerHTML = '<button class="lightbox-close" aria-label="Close enlarged image">&times;</button><img alt="">';
    document.body.appendChild(lightbox);

    var lightboxImg = lightbox.querySelector('img');
    var closeBtn = lightbox.querySelector('.lightbox-close');
    var opener = null;

    function openLightbox(img) {
      opener = img;
      lightboxImg.src = img.currentSrc || img.src;
      lightboxImg.alt = img.alt;
      lightbox.hidden = false;
      lightbox.scrollLeft = 0;
      document.body.classList.add('lightbox-open');
      requestAnimationFrame(function () { lightbox.classList.add('open'); });
      closeBtn.focus();
    }

    function closeLightbox() {
      if (lightbox.hidden) return;
      lightbox.classList.remove('open');
      lightbox.hidden = true;
      document.body.classList.remove('lightbox-open');
      if (opener) opener.focus();
    }

    galleryImgs.forEach(function (img) {
      img.classList.add('zoomable');
      img.setAttribute('tabindex', '0');
      img.setAttribute('role', 'button');
      img.setAttribute('aria-label', 'View full size: ' + img.alt);
      img.addEventListener('click', function () { openLightbox(img); });
      img.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openLightbox(img);
        }
      });
    });

    // Any click inside the overlay (image, backdrop or the close button) closes it;
    // dragging to pan on small screens does not fire a click.
    lightbox.addEventListener('click', closeLightbox);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeLightbox();
    });
  }

  // Segmentation gallery: hover over a colored part to see its name. Each
  // row image is unlabeled (just color-coded masks over the photo); we read
  // the pixel color under the cursor off an offscreen canvas and match it
  // against that row's category palette (assets/js/part-legend.js) to find
  // the closest part. Mask colors are alpha-blended (~0.8) over the photo in
  // the source images, so this matches by NEAREST color, not an exact hit,
  // and rejects anything too far off (plain photo background) via MAX_DIST.
  var segImgs = document.querySelectorAll('#results [data-panel="seg"] .gallery-slide img[data-category]');
  if (segImgs.length && window.PART_LEGEND) {
    var MAX_DIST = 60; // sum of |dr|+|dg|+|db|
    var srcToCategory = {};
    var canvasCache = {}; // image src -> ready-to-read canvas at natural resolution

    function getCanvasFor(img) {
      var src = img.currentSrc || img.src;
      if (canvasCache[src]) return canvasCache[src];
      var canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      canvas.getContext('2d').drawImage(img, 0, 0);
      canvasCache[src] = canvas;
      return canvas;
    }

    function nearestPart(category, r, g, b) {
      var palette = window.PART_LEGEND[category];
      if (!palette) return null;
      var best = null, bestDist = Infinity;
      for (var i = 0; i < palette.length; i++) {
        var p = palette[i];
        var d = Math.abs(p[0] - r) + Math.abs(p[1] - g) + Math.abs(p[2] - b);
        if (d < bestDist) { bestDist = d; best = p[3]; }
      }
      return bestDist <= MAX_DIST ? best : null;
    }

    var tip = document.createElement('div');
    tip.className = 'part-tip';
    tip.style.display = 'none';
    document.body.appendChild(tip);

    function handleMove(img, category, clientX, clientY) {
      var rect = img.getBoundingClientRect();
      var x = clientX - rect.left, y = clientY - rect.top;
      if (x < 0 || y < 0 || x >= rect.width || y >= rect.height) { tip.style.display = 'none'; return; }
      var canvas;
      try {
        canvas = getCanvasFor(img);
      } catch (e) { return; }
      var px = Math.min(canvas.width - 1, Math.floor(x / rect.width * canvas.width));
      var py = Math.min(canvas.height - 1, Math.floor(y / rect.height * canvas.height));
      var data;
      try {
        data = canvas.getContext('2d').getImageData(px, py, 1, 1).data;
      } catch (e) { return; } // canvas tainted (e.g. some local file:// setups) — fail silently
      var name = nearestPart(category, data[0], data[1], data[2]);
      if (!name) { tip.style.display = 'none'; return; }
      tip.textContent = name;
      tip.style.left = (clientX + 14) + 'px';
      tip.style.top = (clientY + 14) + 'px';
      tip.style.display = 'block';
    }

    segImgs.forEach(function (img) {
      var category = img.dataset.category;
      srcToCategory[img.src] = category; // .src (not getAttribute) so this matches the
                                          // absolute URL the lightbox sets later
      function bind() {
        img.addEventListener('mousemove', function (e) { handleMove(img, category, e.clientX, e.clientY); });
        img.addEventListener('mouseleave', function () { tip.style.display = 'none'; });
      }
      if (img.complete) bind(); else img.addEventListener('load', bind, { once: true });
    });

    // Also works on the enlarged (lightbox) copy. The lightbox reuses one
    // <img> for every slide, so we match its current src back to a category
    // and rebuild the canvas whenever that src changes (on 'load').
    var lightboxImg = document.querySelector('.lightbox img');
    if (lightboxImg) {
      lightboxImg.addEventListener('load', function () {
        try { getCanvasFor(lightboxImg); } catch (e) {}
      });
      lightboxImg.addEventListener('mousemove', function (e) {
        var category = srcToCategory[lightboxImg.src];
        if (!category) return;
        handleMove(lightboxImg, category, e.clientX, e.clientY);
      });
      lightboxImg.addEventListener('mouseleave', function () { tip.style.display = 'none'; });
    }
  }

  // Gallery category tabs
  document.querySelectorAll('.gallery').forEach(function (gallery) {
    var tabs = Array.prototype.slice.call(gallery.querySelectorAll('.gallery-tab'));
    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        tabs.forEach(function (t) { t.classList.remove('active'); });
        tab.classList.add('active');
        gallery.querySelectorAll('.gallery-panel').forEach(function (panel) {
          panel.classList.toggle('active', panel.getAttribute('data-panel') === tab.getAttribute('data-target'));
        });
      });
    });
  });

  // Section 3.2 figure: hovering, clicking or focusing a step highlights its
  // region of the diagram. A click "pins" the step; hover previews another and
  // leaving the list returns to the pinned one.
  document.querySelectorAll('[data-method-steps]').forEach(function (block) {
    var steps = Array.prototype.slice.call(block.querySelectorAll('.method-step'));
    var holes = Array.prototype.slice.call(block.querySelectorAll('.steps-hole'));
    var list = block.querySelector('.method-steps-list');
    if (!steps.length) return;
    var pinned = steps[0].getAttribute('data-step');

    function show(stepNum) {
      steps.forEach(function (s) {
        var on = s.getAttribute('data-step') === stepNum;
        s.classList.toggle('active', on);
        s.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      holes.forEach(function (h) {
        h.setAttribute('fill-opacity', h.getAttribute('data-hole-step') === stepNum ? '1' : '0');
      });
    }

    function pin(step) {
      pinned = step.getAttribute('data-step');
      show(pinned);
    }

    steps.forEach(function (step) {
      step.addEventListener('mouseenter', function () { show(step.getAttribute('data-step')); });
      step.addEventListener('click', function () { pin(step); });
      step.addEventListener('focus', function () { pin(step); });
      step.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          pin(step);
        }
      });
    });
    list.addEventListener('mouseleave', function () { show(pinned); });

    show(pinned);
  });
});
