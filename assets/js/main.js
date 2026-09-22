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

  // Scrollytelling figure (Section 3.2): sticky diagram, spotlight follows scroll
  document.querySelectorAll('[data-scrolly]').forEach(function (scrolly) {
    var steps = Array.prototype.slice.call(scrolly.querySelectorAll('.scrolly-step'));
    var holes = Array.prototype.slice.call(scrolly.querySelectorAll('.scrolly-hole'));
    var stickyCol = scrolly.querySelector('.scrolly-sticky-col');
    var stepsCol = scrolly.querySelector('.scrolly-steps');

    // .scrolly-sticky-col is a plain grid item; its height is set explicitly here
    // to match the steps column, giving the nested position:sticky element (one
    // level deeper) a definite box to stick within.
    function syncStickyHeight() {
      if (stickyCol && stepsCol) {
        stickyCol.style.height = stepsCol.offsetHeight + 'px';
      }
    }
    syncStickyHeight();
    window.addEventListener('resize', syncStickyHeight);
    window.addEventListener('load', syncStickyHeight);

    function setActive(stepNum) {
      steps.forEach(function (s) {
        s.classList.toggle('active', s.getAttribute('data-step') === stepNum);
      });
      holes.forEach(function (h) {
        h.setAttribute('fill-opacity', h.getAttribute('data-hole-step') === stepNum ? '1' : '0');
      });
    }

    if (!('IntersectionObserver' in window) || steps.length === 0) {
      if (steps[0]) setActive(steps[0].getAttribute('data-step'));
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          setActive(entry.target.getAttribute('data-step'));
        }
      });
    }, { root: null, rootMargin: '-45% 0px -45% 0px', threshold: 0 });

    steps.forEach(function (step) { observer.observe(step); });
    setActive(steps[0].getAttribute('data-step'));
  });
});
