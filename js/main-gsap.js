/* A·O·T·U F/W 2026 — GSAP 애니메이션 레이어
   필요: gsap.min.js + ScrollTrigger.min.js (CDN) → main-gsap.js → main.js 순서로 로드
   - GSAP 이 로드되지 않았거나 '모션 줄이기'를 켠 경우: 아무것도 하지 않음 → 기본 기능(main.js)만 동작
   - html.gsap-on 이 붙으면 CSS 전환 대신 이 파일이 애니메이션을 담당
   목차: 1.준비  2.헤더  3.메인 슬라이더  4.섹션 스크롤 연출  5.탭·모달·드로어·팔레트·저널·FAQ  6.마우스 효과 */
(function () {
  'use strict';

  var g = window.gsap;
  var reduce = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : false;
  if (!g || reduce) return;

  var ST = window.ScrollTrigger;
  if (ST) g.registerPlugin(ST);
  document.documentElement.classList.add('gsap-on');
  g.defaults({ ease: 'power3.out', duration: 0.9 });

  /* ===== 1. 준비 ===== */
  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  var CLEAR = 'opacity,transform,visibility';
  var canHover = window.matchMedia ? window.matchMedia('(hover: hover)').matches : false;

  // 글자를 단어 단위로 감싸 '마스크 위로 올라오는' 효과를 만든다 (읽기용 aria-label 유지)
  function splitWords(el) {
    if (!el) return [];
    if (!el._split) {
      el._split = true;
      var label = el.textContent.replace(/\s+/g, ' ').trim();
      (function walk(node) {
        Array.prototype.slice.call(node.childNodes).forEach(function (n) {
          if (n.nodeType === 3) {
            var frag = document.createDocumentFragment();
            n.nodeValue.split(/(\s+)/).forEach(function (t) {
              if (!t) return;
              if (/^\s+$/.test(t)) { frag.appendChild(document.createTextNode(' ')); return; }
              var w = document.createElement('span');
              var i = document.createElement('span');
              w.className = 'w'; i.className = 'wi';
              w.setAttribute('aria-hidden', 'true');
              i.textContent = t;
              w.appendChild(i);
              frag.appendChild(w);
            });
            node.replaceChild(frag, n);
          } else if (n.nodeType === 1 && n.nodeName !== 'BR') {
            walk(n);
          }
        });
      })(el);
      el.setAttribute('aria-label', label);
    }
    return $$('.wi', el);
  }

  // 스크롤 위치에 도달하면 한 번 재생
  function onView(trigger, start) {
    return ST ? { trigger: trigger, start: start || 'top 82%', once: true } : null;
  }
  function reveal(trigger, targets, vars, start) {
    var els = typeof targets === 'string' ? $$(targets, trigger) : targets;
    if (!els || !els.length) return;
    var v = { y: 36, opacity: 0, duration: 1, stagger: 0.12, clearProps: CLEAR };
    for (var k in vars) v[k] = vars[k];
    var sc = onView(trigger, start);
    if (sc) v.scrollTrigger = sc;
    g.from(els, v);
  }

  /* ===== 2. 헤더 ===== */
  var header = $('#siteHeader');
  g.from(['.nav-list > li', '.secondary-nav a', '.header-icons a'].map(function (s) { return $$(s, header); }).reduce(function (a, b) { return a.concat(b); }, []),
    { y: -16, opacity: 0, stagger: 0.05, duration: 0.8, delay: 0.1, clearProps: CLEAR });
  g.from($('.brand', header), { opacity: 0, duration: 1, delay: 0.05, clearProps: 'opacity' });

  // 아래로 스크롤하면 헤더가 숨고, 위로 올리면 다시 나타남
  if (ST) {
    var headerHidden = false;
    var setHeader = function (hide) {
      if (hide === headerHidden) return;
      headerHidden = hide;
      g.to(header, { yPercent: hide ? -110 : 0, duration: 0.45, ease: 'power2.out', overwrite: 'auto' });
    };
    ST.create({
      start: 0, end: 'max',
      onUpdate: function (self) {
        var locked = document.body.classList.contains('no-scroll');
        if (locked) return;
        setHeader(self.direction === 1 && self.scroll() > 420);
      }
    });
    header.addEventListener('focusin', function () { setHeader(false); });
  }

  /* ===== 3. 메인 슬라이더 ===== */
  var slides = $$('.slide');

  function playSlide(slide, dir) {
    var media = $$('.slide-media img', slide);
    var heading = $('h1, h2', slide);
    var words = splitWords(heading);
    var isHero = slide.classList.contains('slide--looks') === false;

    var tl = g.timeline({ defaults: { ease: 'power3.out' } });
    tl.fromTo(slide, { opacity: 0 }, { opacity: 1, duration: 0.9, ease: 'power1.inOut', clearProps: 'opacity' }, 0);
    if (isHero) {
      tl.fromTo(media, { scale: 1.14 }, { scale: 1, duration: 2.6, ease: 'power2.out', clearProps: 'transform' }, 0);
    } else {
      tl.fromTo(media, { y: 60, opacity: 0, scale: 1.04 }, { y: 0, opacity: 1, scale: 1, duration: 1.2, stagger: 0.16, clearProps: CLEAR }, 0.05);
    }
    tl.fromTo($('.eyebrow', slide), { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, clearProps: CLEAR }, 0.35)
      .fromTo(words, { yPercent: 115 }, { yPercent: 0, duration: 1, stagger: 0.07, clearProps: 'transform' }, 0.45)
      .fromTo($('.slide-description', slide), { y: 22, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, clearProps: CLEAR }, 0.85)
      .fromTo($('.text-link', slide), { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, clearProps: CLEAR }, 1.0);
    var sig = $('.hero-signature', slide);
    if (sig) tl.fromTo(sig, { opacity: 0, x: -14 }, { opacity: 1, x: 0, duration: 0.9, clearProps: CLEAR }, 1.15);
    return tl;
  }

  document.addEventListener('aotu:ready', function () {
    playSlide(slides[0], 1);
  });

  document.addEventListener('aotu:slide', function (e) {
    var d = e.detail;
    if (d.from === d.to) return;
    var prev = d.slides[d.from];
    var next = d.slides[d.to];
    var n = d.slides.length;

    // 이전·다음이 아닌 슬라이드는 정리
    d.slides.forEach(function (s) {
      if (s === prev || s === next) return;
      g.killTweensOf(s);
      s.classList.remove('is-leaving');
      g.set(s, { clearProps: 'opacity' });
    });

    // 나가는 슬라이드: 천천히 사라짐
    next.classList.remove('is-leaving');
    g.killTweensOf(next);
    g.killTweensOf(prev);
    prev.classList.add('is-leaving');
    g.fromTo(prev, { opacity: 1 }, {
      opacity: 0, duration: 0.9, ease: 'power1.inOut',
      onComplete: function () { prev.classList.remove('is-leaving'); g.set(prev, { clearProps: 'opacity' }); }
    });

    playSlide(next, ((d.to - d.from + n) % n) === 1 ? 1 : -1);

    // 활성 점: 살짝 튕김
    var dot = d.dots[d.to];
    if (dot) g.fromTo(dot, { scale: 0.6 }, { scale: 1, duration: 0.6, ease: 'back.out(3)', clearProps: 'transform' });
  });

  /* ===== 4. 섹션 스크롤 연출 ===== */
  if (ST) {
    // 4-1. 모든 화면: 글/카드 등장
    var st = $('#story');
    reveal(st, '.street-caption > *', { y: 30, stagger: 0.14 }, 'top 65%');

    var shop = $('#shop');
    reveal(shop, '.shop-head > *', { y: 24, stagger: 0.1 });
    reveal($('.product-grid', shop), '.product-card', { y: 50, stagger: 0.12 }, 'top 88%');

    var statement = $('#statement');
    reveal(statement, '.eyebrow, .lead, .text-link', { y: 24, stagger: 0.15 }, 'top 70%');
    var sWords = splitWords($('h2', statement));
    g.fromTo(sWords, { opacity: 0.12 }, {
      opacity: 1, stagger: 0.12, ease: 'none',
      scrollTrigger: { trigger: $('h2', statement), start: 'top 85%', end: 'bottom 52%', scrub: true }
    });

    var col = $('#collection');
    reveal(col, '.collection-heading > *', { y: 24, stagger: 0.1 });
    reveal(col, '.art-link', { y: 14, scale: 0.7, duration: 0.7, stagger: 0.09, ease: 'back.out(2)' }, 'top 45%');

    var chapter = $('#chapter');
    reveal(chapter, '.chapter-copy > *, .chapter-view', { x: -24, y: 0, stagger: 0.12 }, 'top 70%');

    var det = $('#details');
    var photos = $$('.detail-photo', det);
    var tilt = [-5, 4, -3, 5];
    var drift = [-46, 34, -26, 40];
    photos.forEach(function (ph, i) {
      g.from(ph, {
        opacity: 0, scale: 0.88, rotate: tilt[i % 4], duration: 1.1, delay: i * 0.1, clearProps: 'opacity,rotate',
        scrollTrigger: { trigger: det, start: 'top 72%', once: true }
      });
      g.to(ph, { y: drift[i % 4], ease: 'none', scrollTrigger: { trigger: $('.detail-collage', det), start: 'top bottom', end: 'bottom top', scrub: true } });
      if (canHover) {
        ph.addEventListener('mouseenter', function () { g.to(ph, { scale: 1.07, duration: 0.5, overwrite: 'auto' }); });
        ph.addEventListener('mouseleave', function () { g.to(ph, { scale: 1, duration: 0.6, overwrite: 'auto' }); });
      }
    });
    reveal(det, '.details-copy > *', { y: 26, stagger: 0.1 }, 'top 65%');
    reveal(det, '.details-copy li', { x: 18, y: 0, stagger: 0.1 }, 'top 45%');

    var pal = $('#palette');
    reveal(pal, '.section-head > *', { y: 24, stagger: 0.1 });
    var prevEl = $('#palettePreview');
    g.from(prevEl, { clipPath: 'inset(0 0 100% 0)', duration: 1.3, ease: 'power4.inOut', clearProps: 'clipPath',
      scrollTrigger: onView(pal, 'top 70%') });
    reveal(pal, '.swatch', { y: 30, scale: 0.9, stagger: 0.07, duration: 0.7 }, 'top 60%');

    var arch = $('#archive');
    var archImg = $('img', arch);
    g.fromTo(archImg, { yPercent: -6, scale: 1.14 }, { yPercent: 6, scale: 1.14, ease: 'none',
      scrollTrigger: { trigger: arch, start: 'top bottom', end: 'bottom top', scrub: true } });
    var archKids = $$('.archive-copy > *', arch);
    g.from(archKids, { y: 28, opacity: 0, stagger: 0.18, duration: 1.1, clearProps: CLEAR, scrollTrigger: onView(arch, 'top 60%') });
    g.from($('h2', arch), { letterSpacing: '0.32em', duration: 1.6, clearProps: 'letterSpacing', scrollTrigger: onView(arch, 'top 60%') });

    var jr = $('#journal');
    reveal(jr, '.section-head > *', { y: 24, stagger: 0.1 });
    reveal(jr, '.journal-media', { clipPath: 'inset(100% 0 0 0)', y: 0, opacity: 1, duration: 1.2, stagger: 0.15, ease: 'power4.out', clearProps: 'clipPath' }, 'top 70%');
    reveal(jr, '.journal-card > :not(.journal-media)', { y: 22, stagger: 0.04, duration: 0.8 }, 'top 62%');

    // 선이 그려지는 아이콘
    var vals = $('#values');
    reveal(vals, '.section-head > *', { y: 24, stagger: 0.1 });
    reveal(vals, '.values-grid li', { y: 34, stagger: 0.12 }, 'top 72%');
    $$('.values-grid svg', vals).forEach(function (svg, i) {
      $$('path, circle', svg).forEach(function (shape) {
        if (!shape.getTotalLength) return;
        var len = Math.ceil(shape.getTotalLength());
        g.fromTo(shape, { strokeDasharray: len, strokeDashoffset: len }, {
          strokeDashoffset: 0, duration: 1.6, delay: i * 0.12, ease: 'power2.inOut', clearProps: 'strokeDasharray,strokeDashoffset',
          scrollTrigger: onView(vals, 'top 72%')
        });
      });
    });

    // 숫자 카운트
    var nums = $('#numbers');
    reveal(nums, '.numbers-grid li', { y: 28, stagger: 0.12 }, 'top 82%');
    $$('[data-count]', nums).forEach(function (el) {
      var end = Number(el.getAttribute('data-count'));
      var pre = el.getAttribute('data-prefix') || '';
      var suf = el.getAttribute('data-suffix') || '';
      var o = { v: 0 };
      el.textContent = pre + '0' + suf;
      g.to(o, { v: end, duration: 1.8, ease: 'power2.out', snap: { v: 1 },
        onUpdate: function () { el.textContent = pre + o.v + suf; },
        scrollTrigger: onView(nums, 'top 80%') });
    });

    var rv = $('#reviews');
    reveal(rv, '.section-head > *', { y: 24, stagger: 0.1 });
    reveal(rv, '.review-card', { y: 50, rotate: 1.5, stagger: 0.15 }, 'top 72%');

    var gal = $('#gallery');
    reveal(gal, '.section-head > *', { y: 24, stagger: 0.1 });
    $$('.gallery-item', gal).forEach(function (item, i) {
      var img = $('img', item);
      g.from(item, { opacity: 0, y: 50, duration: 1, delay: (i % 5) * 0.08, clearProps: CLEAR,
        scrollTrigger: onView($('.gallery-grid', gal), 'top 88%') });
      g.from(img, { scale: 1.25, duration: 1.6, delay: (i % 5) * 0.08, clearProps: 'transform',
        scrollTrigger: onView($('.gallery-grid', gal), 'top 88%') });
    });

    var faq = $('#faq');
    reveal(faq, '.faq-intro > *', { y: 24, stagger: 0.1 }, 'top 75%');
    reveal(faq, '.faq-list li', { y: 24, stagger: 0.09 }, 'top 72%');

    var nl = $('#newsletter');
    var nWords = splitWords($('h2', nl));
    reveal(nl, '.eyebrow, .newsletter-text, .newsletter-form', { y: 20, stagger: 0.12 }, 'top 75%');
    g.from(nWords, { yPercent: 115, stagger: 0.08, duration: 1, clearProps: 'transform', scrollTrigger: onView(nl, 'top 75%') });

    reveal($('#footer'), '.footer-inner > *', { y: 30, stagger: 0.12 }, 'top 92%');

    // 4-2. 데스크톱(769px 이상)에서만: 이미지 패럴랙스 · 히어로 깊이감
    if (g.matchMedia) {
      var mm = g.matchMedia();
      mm.add('(min-width: 769px)', function () {
        [$('.street-image'), $('.collection-art > img'), $('.new-chapter > img')].forEach(function (img) {
          if (!img) return;
          g.fromTo(img, { yPercent: -5, scale: 1.12 }, { yPercent: 5, scale: 1.12, ease: 'none',
            scrollTrigger: { trigger: img.parentNode, start: 'top bottom', end: 'bottom top', scrub: true } });
        });
        g.to('#hero .slide-copy', { yPercent: -14, ease: 'none',
          scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true } });
        g.to('#hero .slide-media', { yPercent: 8, ease: 'none',
          scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true } });
      });
    }

    window.addEventListener('load', function () { ST.refresh(); });
  }

  /* ===== 5. 탭 · 모달 · 드로어 · 팔레트 · 저널 · FAQ ===== */
  document.addEventListener('aotu:tab', function (e) {
    var panel = $('#panel-' + e.detail.name);
    if (!panel) return;
    g.fromTo($$('.product-card', panel), { y: 40, opacity: 0 },
      { y: 0, opacity: 1, stagger: 0.1, duration: 0.7, clearProps: CLEAR, overwrite: 'auto' });
  });

  document.addEventListener('aotu:modalopen', function (e) {
    var modal = e.detail.modal;
    var dialog = e.detail.dialog;
    g.timeline({ defaults: { ease: 'power3.out' } })
      .fromTo($('.modal-backdrop', modal), { opacity: 0 }, { opacity: 1, duration: 0.35, clearProps: 'opacity' }, 0)
      .fromTo(dialog, { y: 44, opacity: 0, scale: 0.97 }, { y: 0, opacity: 1, scale: 1, duration: 0.6, clearProps: 'transform,opacity' }, 0)
      .from($$('.modal-image img, .modal-info > *', dialog), { y: 18, opacity: 0, stagger: 0.06, duration: 0.55, clearProps: CLEAR }, 0.18);
  });

  var bagCount = $('#bagCount');
  if (bagCount) bagCount.style.display = 'inline-block';
  document.addEventListener('aotu:bag', function () {
    g.fromTo(bagCount, { scale: 2, color: '#b3402f' }, { scale: 1, color: 'inherit', duration: 0.7, ease: 'back.out(3)', clearProps: 'transform,color' });
    g.fromTo('#addToBag', { scale: 0.97 }, { scale: 1, duration: 0.5, ease: 'back.out(4)', clearProps: 'transform' });
  });

  document.addEventListener('aotu:drawer', function (e) {
    if (!e.detail.open) return;
    g.from($$('.drawer-list > li'), { x: -26, opacity: 0, stagger: 0.06, duration: 0.55, delay: 0.15, clearProps: CLEAR });
  });

  document.addEventListener('aotu:palette', function (e) {
    var d = e.detail;
    g.fromTo([d.name, d.note], { y: 22, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.08, duration: 0.7, clearProps: CLEAR, overwrite: 'auto' });
    g.fromTo(d.preview, { scale: 0.985 }, { scale: 1, duration: 0.7, ease: 'back.out(2.2)', clearProps: 'transform', overwrite: 'auto' });
    var active = $$('.swatch')[d.index];
    if (active) g.fromTo(active, { scale: 0.92 }, { scale: 1, duration: 0.6, ease: 'back.out(3)', clearProps: 'transform' });
  });

  function openHeight(panel) {
    g.fromTo(panel, { height: 0, opacity: 0, overflow: 'hidden' },
      { height: 'auto', opacity: 1, duration: 0.55, ease: 'power2.out', clearProps: 'height,opacity,overflow', overwrite: 'auto' });
  }
  document.addEventListener('aotu:journal', function (e) { openHeight(e.detail.panel); });
  document.addEventListener('click', function (e) {
    var q = e.target.closest ? e.target.closest('.faq-q') : null;
    if (!q || q.getAttribute('aria-expanded') !== 'true') return;
    openHeight($('#' + q.getAttribute('aria-controls')));
  });

  /* ===== 6. 마우스 효과: 자석처럼 따라오는 버튼 ===== */
  if (canHover) {
    $$('.text-link, .mini-link, .slider-btn, .to-top').forEach(function (el) {
      el.addEventListener('mousemove', function (ev) {
        var r = el.getBoundingClientRect();
        var x = (ev.clientX - (r.left + r.width / 2)) * 0.25;
        var y = (ev.clientY - (r.top + r.height / 2)) * 0.35;
        g.to(el, { x: x, y: y, duration: 0.4, overwrite: 'auto' });
      });
      el.addEventListener('mouseleave', function () {
        g.to(el, { x: 0, y: 0, duration: 0.8, ease: 'elastic.out(1,0.45)', overwrite: 'auto' });
      });
    });
  }
})();
