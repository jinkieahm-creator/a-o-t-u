/* A·O·T·U F/W 2026 — main script
   1.유틸  2.PC 서브메뉴  3.모바일 슬라이드 메뉴  4.메인 슬라이더  5.탭  6.모달
   7.추가 스크립트(스크롤 이벤트·등장 애니메이션·맨 위로·FAQ·뉴스레터)  8.VIEW 클릭 효과
   9.시즌 팔레트  10.저널 더보기  11.숫자 카운트
   ※ GSAP 연동: html.gsap-on 이면 애니메이션은 main-gsap.js 가 담당(커스텀 이벤트 aotu:* 수신) */

(function () {
  'use strict';

  /* ===== 1. 유틸 ===== */
  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  var body = document.body;
  var root = document.documentElement;
  var gsapOn = function () { return root.classList.contains('gsap-on'); };
  var reduceMotion = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : false;
  // main-gsap.js 와 주고받는 이벤트 (IE 호환용 폴백 포함)
  function emit(name, detail) {
    var ev;
    if (typeof window.CustomEvent === 'function') ev = new CustomEvent(name, { detail: detail || {} });
    else { ev = document.createEvent('CustomEvent'); ev.initCustomEvent(name, false, false, detail || {}); }
    document.dispatchEvent(ev);
  }

  var FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),[tabindex]:not([tabindex="-1"])';

  // 열린 레이어(모달·드로어) 안에서 Tab 키가 밖으로 나가지 않게 가둔다
  function trapFocus(container, e) {
    if (e.key !== 'Tab') return;
    var items = $$(FOCUSABLE, container).filter(function (el) { return el.offsetParent !== null || el === document.activeElement; });
    if (!items.length) { e.preventDefault(); return; }
    var first = items[0];
    var last = items[items.length - 1];
    if (e.shiftKey && (document.activeElement === first || document.activeElement === container)) {
      e.preventDefault(); last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault(); first.focus();
    }
  }

  function updateBodyLock() {
    var drawerOpen = $('#drawer').classList.contains('open');
    var modalOpen = !$('#productModal').hidden;
    body.classList.toggle('no-scroll', drawerOpen || modalOpen);
  }

  /* ===== 2. PC 서브메뉴 (hover / 키보드 / 터치) ===== */
  var subItems = $$('.has-sub');
  var canHover = window.matchMedia ? window.matchMedia('(hover: hover)').matches : true;

  function setSub(li, open) {
    var link = $('a', li);
    li.classList.toggle('is-open', open);
    link.setAttribute('aria-expanded', String(open));
  }
  function closeAllSubs(except) {
    subItems.forEach(function (li) { if (li !== except) setSub(li, false); });
  }

  subItems.forEach(function (li) {
    var link = $('a', li);

    if (canHover) {
      li.addEventListener('mouseenter', function () { link.setAttribute('aria-expanded', 'true'); });
      li.addEventListener('mouseleave', function () { link.setAttribute('aria-expanded', 'false'); });
    }
    li.addEventListener('focusin', function () { link.setAttribute('aria-expanded', 'true'); });
    li.addEventListener('focusout', function (e) {
      if (!li.contains(e.relatedTarget)) link.setAttribute('aria-expanded', 'false');
    });

    // 터치 기기: 첫 번째 탭은 서브메뉴 열기, 두 번째 탭은 이동
    link.addEventListener('click', function (e) {
      if (!canHover && !li.classList.contains('is-open')) {
        e.preventDefault();
        closeAllSubs(li);
        setSub(li, true);
      }
    });
  });

  document.addEventListener('click', function (e) {
    if (!e.target.closest('.has-sub')) closeAllSubs();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeAllSubs();
  });

  /* ===== 3. 모바일 슬라이드 메뉴(드로어) ===== */
  var menuBtn = $('#menuBtn');
  var drawer = $('#drawer');
  var overlay = $('#drawerOverlay');
  var drawerClose = $('#drawerClose');
  var overlayTimer = null;

  function openDrawer() {
    clearTimeout(overlayTimer);
    overlay.hidden = false;
    window.requestAnimationFrame(function () { overlay.classList.add('show'); });
    drawer.classList.add('open');
    drawer.setAttribute('aria-hidden', 'false');
    menuBtn.setAttribute('aria-expanded', 'true');
    menuBtn.setAttribute('aria-label', 'Close menu');
    updateBodyLock();
    emit('aotu:drawer', { open: true });
    setTimeout(function () { drawerClose.focus(); }, 60);
  }

  function closeDrawer(returnFocus) {
    drawer.classList.remove('open');
    drawer.setAttribute('aria-hidden', 'true');
    overlay.classList.remove('show');
    overlayTimer = setTimeout(function () { overlay.hidden = true; }, 320);
    menuBtn.setAttribute('aria-expanded', 'false');
    menuBtn.setAttribute('aria-label', 'Open menu');
    updateBodyLock();
    if (returnFocus) menuBtn.focus({ preventScroll: true });
  }

  menuBtn.addEventListener('click', function () {
    if (drawer.classList.contains('open')) closeDrawer(true); else openDrawer();
  });
  drawerClose.addEventListener('click', function () { closeDrawer(true); });
  overlay.addEventListener('click', function () { closeDrawer(true); });

  // 아코디언: 하나 열면 나머지는 닫힘
  $$('.drawer-toggle').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var willOpen = btn.getAttribute('aria-expanded') !== 'true';
      $$('.drawer-toggle').forEach(function (b) { b.setAttribute('aria-expanded', 'false'); });
      btn.setAttribute('aria-expanded', String(willOpen));
    });
  });

  // 메뉴 안의 링크를 누르면 메뉴를 닫고 해당 위치로 이동
  $$('.drawer a').forEach(function (a) {
    a.addEventListener('click', function () { closeDrawer(false); });
  });

  drawer.addEventListener('keydown', function (e) { trapFocus(drawer, e); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && drawer.classList.contains('open')) closeDrawer(true);
  });
  window.addEventListener('resize', function () {
    if (window.innerWidth > 900 && drawer.classList.contains('open')) closeDrawer(false);
  });

  /* ===== 4. 메인 비주얼 슬라이더 (자동 + 수동) ===== */
  var slider = $('#hero');
  var slideWrap = $('#slides');
  var slides = $$('.slide', slideWrap);
  var dotsWrap = $('#sliderDots');
  var prevBtn = $('#prevSlide');
  var nextBtn = $('#nextSlide');
  var toggleBtn = $('#toggleSlide');

  var INTERVAL = 5000;
  var current = 0;
  var timer = null;
  var userPaused = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : false;
  var hovering = false;
  var focusing = false;

  var dots = slides.map(function (s, i) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'slider-dot';
    b.setAttribute('aria-label', 'Go to slide ' + (i + 1));
    b.addEventListener('click', function () { goTo(i); restart(); });
    dotsWrap.appendChild(b);
    return b;
  });

  function goTo(n) {
    var prev = current;
    current = (n + slides.length) % slides.length;
    slides.forEach(function (s, i) {
      var on = i === current;
      s.classList.toggle('is-active', on);
      s.setAttribute('aria-hidden', String(!on));
      $$(FOCUSABLE, s).forEach(function (el) { el.tabIndex = on ? 0 : -1; });
    });
    dots.forEach(function (d, i) {
      d.classList.toggle('is-active', i === current);
      if (i === current) d.setAttribute('aria-current', 'true'); else d.removeAttribute('aria-current');
    });
    emit('aotu:slide', { from: prev, to: current, slides: slides, dots: dots });
  }

  function shouldPlay() {
    return !userPaused && !hovering && !focusing && !document.hidden;
  }
  function stop() { clearInterval(timer); timer = null; }
  function start() {
    stop();
    if (shouldPlay()) timer = setInterval(function () { goTo(current + 1); }, INTERVAL);
    slideWrap.setAttribute('aria-live', timer ? 'off' : 'polite');
  }
  function restart() { start(); }

  function renderToggle() {
    toggleBtn.classList.toggle('is-paused', userPaused);
    toggleBtn.setAttribute('aria-label', userPaused ? 'Play slideshow' : 'Pause slideshow');
  }

  prevBtn.addEventListener('click', function () { goTo(current - 1); restart(); });
  nextBtn.addEventListener('click', function () { goTo(current + 1); restart(); });
  toggleBtn.addEventListener('click', function () { userPaused = !userPaused; renderToggle(); start(); });

  slider.addEventListener('mouseenter', function () { hovering = true; start(); });
  slider.addEventListener('mouseleave', function () { hovering = false; start(); });
  slider.addEventListener('focusin', function () { focusing = true; start(); });
  slider.addEventListener('focusout', function () { focusing = false; start(); });
  document.addEventListener('visibilitychange', start);

  // 키보드: 슬라이더 안에 포커스가 있을 때 ← →
  slider.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft') { goTo(current - 1); restart(); }
    if (e.key === 'ArrowRight') { goTo(current + 1); restart(); }
  });

  // 터치 스와이프
  var touchX = 0, touchY = 0;
  slideWrap.addEventListener('touchstart', function (e) {
    touchX = e.changedTouches[0].clientX;
    touchY = e.changedTouches[0].clientY;
  }, { passive: true });
  slideWrap.addEventListener('touchend', function (e) {
    var dx = e.changedTouches[0].clientX - touchX;
    var dy = e.changedTouches[0].clientY - touchY;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.2) {
      goTo(current + (dx < 0 ? 1 : -1));
      restart();
    }
  }, { passive: true });

  // 마우스 드래그(PC)
  var dragX = null;
  slideWrap.addEventListener('mousedown', function (e) {
    if (e.target.closest('a,button')) return;
    dragX = e.clientX;
  });
  window.addEventListener('mouseup', function (e) {
    if (dragX === null) return;
    var dx = e.clientX - dragX;
    dragX = null;
    if (Math.abs(dx) > 60) { goTo(current + (dx < 0 ? 1 : -1)); restart(); }
  });

  goTo(0);
  renderToggle();
  start();

  /* ===== 5. 탭 (클릭한 탭의 내용만 보임) ===== */
  var tabs = $$('.tabs .tab');
  var panels = $$('.tab-panel');

  function activateTab(name, moveFocus) {
    tabs.forEach(function (t) {
      var on = t.getAttribute('data-tab') === name;
      t.classList.toggle('is-active', on);
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      if (on && moveFocus) t.focus();
    });
    panels.forEach(function (p) {
      var on = p.id === 'panel-' + name;
      p.hidden = !on;
      p.classList.toggle('is-active', on);
    });
    emit('aotu:tab', { name: name });
  }

  tabs.forEach(function (tab, i) {
    tab.addEventListener('click', function () { activateTab(tab.getAttribute('data-tab')); });
    tab.addEventListener('keydown', function (e) {
      var next = null;
      if (e.key === 'ArrowRight') next = (i + 1) % tabs.length;
      if (e.key === 'ArrowLeft') next = (i - 1 + tabs.length) % tabs.length;
      if (e.key === 'Home') next = 0;
      if (e.key === 'End') next = tabs.length - 1;
      if (next !== null) {
        e.preventDefault();
        activateTab(tabs[next].getAttribute('data-tab'), true);
      }
    });
  });

  // 메뉴·슬라이더의 "Tops / Bottoms / Outerwear" 링크 → 해당 탭을 열고 SHOP으로 이동
  $$('a[data-tab]').forEach(function (a) {
    a.addEventListener('click', function () { activateTab(a.getAttribute('data-tab')); });
  });

  /* ===== 6. 상품 퀵뷰 모달 (열기 / 닫기) ===== */
  var modal = $('#productModal');
  var dialog = $('.modal-dialog', modal);
  var modalImage = $('#modalImage');
  var modalTitle = $('#modalTitle');
  var modalPrice = $('#modalPrice');
  var modalDesc = $('#modalDesc');
  var modalMsg = $('#modalMsg');
  var addBtn = $('#addToBag');
  var bagCount = $('#bagCount');
  var lastFocus = null;
  var addTimer = null;
  var currentProduct = '';

  function formatPrice(n) { return '₩' + Number(n).toLocaleString('en-US'); }

  function openModal(card) {
    lastFocus = document.activeElement;
    currentProduct = card.getAttribute('data-name');
    modalImage.src = card.getAttribute('data-image');
    modalImage.alt = currentProduct;
    modalTitle.textContent = currentProduct;
    modalPrice.textContent = formatPrice(card.getAttribute('data-price'));
    modalDesc.textContent = card.getAttribute('data-desc');
    modalMsg.textContent = '';
    addBtn.textContent = 'ADD TO BAG';
    $('input[name="size"][value="M"]', modal).checked = true;
    modal.hidden = false;
    updateBodyLock();
    dialog.focus();
    emit('aotu:modalopen', { modal: modal, dialog: dialog });
  }

  function closeModal() {
    if (modal.hidden) return;
    modal.hidden = true;
    clearTimeout(addTimer);
    updateBodyLock();
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }

  $$('.product-card').forEach(function (card) {
    $$('.product-image, .view', card).forEach(function (btn) {
      btn.addEventListener('click', function () { openModal(card); });
    });
  });

  modal.addEventListener('click', function (e) {
    if (e.target.closest('[data-close]')) closeModal();
  });
  modal.addEventListener('keydown', function (e) { trapFocus(dialog, e); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !modal.hidden) closeModal();
  });

  addBtn.addEventListener('click', function () {
    var size = $('input[name="size"]:checked', modal).value;
    bagCount.textContent = String(Number(bagCount.textContent || 0) + 1);
    modalMsg.textContent = currentProduct + ' (' + size + ') has been added to your bag.';
    addBtn.textContent = 'ADDED ✓';
    emit('aotu:bag', { count: Number(bagCount.textContent) });
    clearTimeout(addTimer);
    addTimer = setTimeout(function () { addBtn.textContent = 'ADD TO BAG'; }, 1600);
  });

  /* ===== 7. 추가 스크립트: 스크롤 이벤트 · 등장 애니메이션 ===== */
  var header = $('#siteHeader');
  var toTop = $('#toTop');
  var spyLinks = $$('.has-sub > a');
  var progress = $('#scrollProgress');
  var ticking = false;

  function onScroll() {
    var y = window.pageYOffset || document.documentElement.scrollTop;

    // 헤더 그림자
    header.classList.toggle('is-scrolled', y > 10);

    // 스크롤 진행 막대
    var max = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, y / max) : 0) + ')';

    // 맨 위로 버튼
    if (y > 700) {
      toTop.hidden = false;
      window.requestAnimationFrame(function () { toTop.classList.add('show'); });
    } else {
      toTop.classList.remove('show');
      setTimeout(function () { if (!toTop.classList.contains('show')) toTop.hidden = true; }, 300);
    }

    // 현재 보고 있는 섹션의 메뉴 표시
    var offset = header.offsetHeight + 40;
    spyLinks.forEach(function (link) {
      var target = $(link.getAttribute('href'));
      var on = false;
      if (target) {
        var r = target.getBoundingClientRect();
        on = r.top <= offset && r.bottom > offset;
      }
      link.classList.toggle('is-current', on);
    });
    ticking = false;
  }

  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; window.requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();

  toTop.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // 스크롤하면 섹션이 부드럽게 나타남
  var revealTargets = $$('.street-story, .shop-section, .statement, .collection, .new-chapter, .details-section, .palette, .archive-banner, .journal, .values, .numbers, .reviews, .gallery, .faq, .newsletter');

  if (gsapOn() || reduceMotion) {
    // GSAP 이 애니메이션을 맡거나, 모션 줄이기 설정이면 등장 효과를 쓰지 않음
  } else if ('IntersectionObserver' in window) {
    revealTargets.forEach(function (el) { el.classList.add('reveal'); });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -6% 0px' });
    revealTargets.forEach(function (el) { io.observe(el); });
  } else {
    revealTargets.forEach(function (el) { el.classList.add('reveal'); el.classList.add('in-view'); });
  }

  /* ===== 7-2. FAQ 아코디언 · 뉴스레터 폼 검사 ===== */
  var faqButtons = $$('.faq-q');
  faqButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var willOpen = btn.getAttribute('aria-expanded') !== 'true';
      faqButtons.forEach(function (b) {
        b.setAttribute('aria-expanded', 'false');
        $('#' + b.getAttribute('aria-controls')).hidden = true;
      });
      btn.setAttribute('aria-expanded', String(willOpen));
      $('#' + btn.getAttribute('aria-controls')).hidden = !willOpen;
    });
  });

  var newsForm = $('#newsletterForm');
  var newsInput = $('#newsletterEmail');
  var newsMsg = $('#newsletterMsg');
  var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  newsForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var value = newsInput.value.trim();
    if (!emailPattern.test(value)) {
      newsInput.setAttribute('aria-invalid', 'true');
      newsMsg.classList.add('is-error');
      newsMsg.textContent = 'Please enter a valid email address.';
      newsInput.focus();
      return;
    }
    newsInput.removeAttribute('aria-invalid');
    newsMsg.classList.remove('is-error');
    newsMsg.textContent = 'Thank you for joining! Use code WELCOME10 for 10% off your first order.';
    newsForm.reset();
  });
  newsInput.addEventListener('input', function () {
    if (newsInput.getAttribute('aria-invalid')) {
      newsInput.removeAttribute('aria-invalid');
      newsMsg.textContent = '';
      newsMsg.classList.remove('is-error');
    }
  });

  /* ===== 8. VIEW 링크 클릭 효과 ===== */
  document.addEventListener('click', function (e) {
    var link = e.target.closest('.text-link, .mini-link, .view, .chapter-view');
    if (!link) return;
    link.classList.remove('is-clicked');
    void link.offsetWidth; // 효과를 처음부터 다시 재생
    link.classList.add('is-clicked');
    clearTimeout(link._clickTimer);
    link._clickTimer = setTimeout(function () { link.classList.remove('is-clicked'); }, 800);
  });

  /* ===== 9. 시즌 팔레트 (색상 선택 → 미리보기·추천 탭 변경) ===== */
  var palette = $('#palette');
  if (palette) {
    var preview = $('#palettePreview');
    var pName = $('#paletteName');
    var pNote = $('#paletteNote');
    var pCount = $('#paletteCount');
    var pLink = $('#paletteLink');
    var swatches = $$('.swatch', palette);

    swatches.forEach(function (sw, i) {
      sw.addEventListener('click', function () {
        swatches.forEach(function (b) {
          var on = b === sw;
          b.classList.toggle('is-active', on);
          b.setAttribute('aria-pressed', String(on));
        });
        preview.style.setProperty('--c', sw.style.getPropertyValue('--c'));
        preview.setAttribute('data-ink', sw.getAttribute('data-ink'));
        pName.textContent = sw.getAttribute('data-name');
        pNote.textContent = sw.getAttribute('data-note');
        pCount.textContent = ('0' + (i + 1)).slice(-2) + ' / ' + ('0' + swatches.length).slice(-2);
        pLink.setAttribute('data-tab', sw.getAttribute('data-tab'));
        emit('aotu:palette', { preview: preview, name: pName, note: pNote, index: i });
      });
    });
  }

  /* ===== 10. 저널 더보기 (READ MORE ↔ READ LESS) ===== */
  $$('.journal-link').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var panel = $('#' + btn.getAttribute('aria-controls'));
      var open = btn.getAttribute('aria-expanded') !== 'true';
      btn.setAttribute('aria-expanded', String(open));
      btn.firstChild.nodeValue = open ? 'READ LESS ' : 'READ MORE ';
      panel.hidden = !open;
      if (open) emit('aotu:journal', { panel: panel });
    });
  });

  /* ===== 11. 숫자 카운트 (GSAP 이 없을 때의 기본 동작) ===== */
  var counters = $$('[data-count]');
  function countText(el, v) {
    el.textContent = (el.getAttribute('data-prefix') || '') + Math.round(v) + (el.getAttribute('data-suffix') || '');
  }
  if (!gsapOn() && !reduceMotion && 'IntersectionObserver' in window && counters.length) {
    var co = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var end = Number(el.getAttribute('data-count'));
        var t0 = null;
        (function step(t) {
          if (t0 === null) t0 = t;
          var k = Math.min(1, (t - t0) / 1200);
          countText(el, end * (1 - Math.pow(1 - k, 3)));
          if (k < 1) window.requestAnimationFrame(step);
        })(performance.now());
        co.unobserve(el);
      });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { countText(el, 0); co.observe(el); });
  }

  // 모든 준비가 끝났음을 알림 (main-gsap.js 가 첫 인트로를 시작)
  emit('aotu:ready', { slides: slides, dots: dots });
})();
