(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.addEventListener('DOMContentLoaded', function () {
    var header = document.getElementById('siteHeader');
    var progress = document.getElementById('progress');

    // Header border + reading progress
    function onScroll() {
      var y = window.scrollY;
      header.classList.toggle('is-scrolled', y > 8);
      var max = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.transform = 'scaleX(' + (max > 0 ? Math.min(y / max, 1) : 0) + ')';
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    // Case studies: expand / collapse
    document.querySelectorAll('.case-toggle').forEach(function (btn) {
      var panel = document.getElementById(btn.getAttribute('aria-controls'));
      var label = btn.querySelector('.label');
      btn.addEventListener('click', function () {
        var open = btn.getAttribute('aria-expanded') !== 'true';
        btn.setAttribute('aria-expanded', String(open));
        panel.classList.toggle('is-open', open);
        label.textContent = open ? 'Collapse case' : 'Read the full case';
        if (!open) {
          var article = btn.closest('.case');
          if (article.getBoundingClientRect().top < 0) article.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
        }
      });
    });

    // Experience: one role open at a time
    var roles = Array.prototype.slice.call(document.querySelectorAll('.role-item'));
    roles.forEach(function (item) {
      var btn = item.querySelector('button.role-btn');
      if (!btn) return;
      btn.addEventListener('click', function () {
        var open = !item.classList.contains('is-open');
        roles.forEach(function (other) {
          var b = other.querySelector('button.role-btn');
          other.classList.remove('is-open');
          if (b) b.setAttribute('aria-expanded', 'false');
        });
        item.classList.toggle('is-open', open);
        btn.setAttribute('aria-expanded', String(open));
      });
    });

    // Copy email
    document.querySelectorAll('[data-copy]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var text = btn.getAttribute('data-copy');
        var done = function () {
          btn.textContent = 'Copied';
          btn.classList.add('is-done');
          setTimeout(function () { btn.textContent = 'Copy'; btn.classList.remove('is-done'); }, 1800);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(done, function () {});
        }
      });
    });

    // Reveal on scroll, staggered within each group
    var reveals = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window) || reduceMotion) {
      reveals.forEach(function (el) { el.classList.add('is-in'); });
    } else {
      var groups = new Map();
      reveals.forEach(function (el) {
        var parent = el.parentElement;
        var i = groups.get(parent) || 0;
        el.style.setProperty('--d', Math.min(i * 0.08, 0.4) + 's');
        groups.set(parent, i + 1);
      });
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
      reveals.forEach(function (el) { io.observe(el); });
    }

    // Count-up for the stats band
    var counters = document.querySelectorAll('[data-count]');
    if ('IntersectionObserver' in window && !reduceMotion) {
      var cio = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          cio.unobserve(e.target);
          var el = e.target;
          var target = parseFloat(el.getAttribute('data-count'));
          var decimals = parseInt(el.getAttribute('data-decimals') || '0', 10);
          var start = performance.now();
          var dur = 1400;
          (function tick(now) {
            var t = Math.min((now - start) / dur, 1);
            var eased = 1 - Math.pow(1 - t, 4);
            el.textContent = (target * eased).toFixed(decimals);
            if (t < 1) requestAnimationFrame(tick);
          })(start);
        });
      }, { threshold: 0.5 });
      counters.forEach(function (el) { el.textContent = (0).toFixed(parseInt(el.getAttribute('data-decimals') || '0', 10)); cio.observe(el); });
    }

    // Active nav link
    var links = document.querySelectorAll('.nav a[data-nav]');
    if ('IntersectionObserver' in window) {
      var nio = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          links.forEach(function (a) { a.classList.toggle('is-active', a.getAttribute('href') === '#' + e.target.id); });
        });
      }, { rootMargin: '-45% 0px -50% 0px' });
      ['work', 'experience', 'skills', 'contact'].forEach(function (id) {
        var s = document.getElementById(id);
        if (s) nio.observe(s);
      });
    }
  });

  // Print: open every case and role so nothing is hidden on paper
  window.addEventListener('beforeprint', function () {
    document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('is-in'); });
  });
})();
