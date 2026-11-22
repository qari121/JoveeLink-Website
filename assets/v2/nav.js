/* ==========================================
   JOVÉE LINK · header on phones
   - at the top of the page the bar is part of the page and scrolls away
     with it; scroll back up and it returns as a floating bar
   - a jump to a section (a menu link, an in-page link, the Salons index)
     keeps the bar out of the way, so the section starts at the top
   - the menu drops from the bar
   - "Get the app" opens the right store on an iPhone or an Android phone
   Loaded on every page with a header. Above 640px it does nothing.
   ========================================== */
(function () {
    'use strict';
    var nav = document.querySelector('.nav');
    if (!nav) return;
    var root = document.documentElement;
    var burger = document.getElementById('hamburger');
    var menu = document.getElementById('mobileMenu');
    var phone = window.matchMedia ? window.matchMedia('(max-width: 640px)') : { matches: false };

    // "Get the app": straight to the store this phone uses
    var ua = navigator.userAgent || '';
    var isIOS = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    var isAndroid = /Android/i.test(ua);
    if (isIOS || isAndroid) {
        var storeLink = document.querySelector(isIOS ? 'a.btn-store[href*="apps.apple.com"]' : 'a.btn-store[href*="play.google.com"]');
        if (storeLink) {
            [].forEach.call(document.querySelectorAll('a[data-store-link]'), function (a) {
                a.href = storeLink.href;
                a.target = '_blank';
                a.rel = 'noopener noreferrer';
            });
        }
    }

    // Header on phones.
    //   ''      at the top it is part of the page and scrolls away with it
    //   'float' scroll back up and it returns as a floating bar, stuck to the top of the screen
    //   'hide'  scroll down again and the bar slides away
    var state = null, lastY = Math.max(0, window.pageYOffset), run = 0, ticking = false, menuOpen = false;
    var quiet = false, quietTimer = null;
    function setState(s) {
        if (s === state) return;
        state = s;
        nav.classList.toggle('is-stuck', s !== '');
        if (s === 'float') nav.classList.add('is-float');
        else if (s === '') nav.classList.remove('is-float');
        nav.classList.toggle('is-hide', s === 'hide');
    }
    // A jump to a section moves the page a long way in one go. While it runs the bar stays out of
    // the way, and it stays quiet until the page has been still for a moment.
    function endQuiet() { quiet = false; run = 0; }
    function goQuiet() {
        if (!phone.matches) return;
        quiet = true;
        run = 0;
        if (state === 'float') setState('hide');
        clearTimeout(quietTimer);
        quietTimer = setTimeout(endQuiet, 400);
    }
    function update() {
        ticking = false;
        // the rubber-band bounce past either end of the page is not a scroll
        var max = Math.max(0, root.scrollHeight - window.innerHeight);
        var y = Math.min(max, Math.max(0, window.pageYOffset)), d = y - lastY;
        lastY = y;
        if (!phone.matches) { run = 0; setState(''); return; }
        if (y <= 1) { run = 0; setState(''); return; }
        if (quiet) {
            clearTimeout(quietTimer);
            quietTimer = setTimeout(endQuiet, 200);
            return;
        }
        if (menuOpen) { setState('float'); return; }
        // a page that opens part way down (a link to a section) shows the bar
        if (state === null) { run = 0; setState(y > 60 ? 'float' : ''); return; }
        if (d === 0) return;
        if ((d > 0) !== (run > 0)) run = 0;
        run += d;
        if (state === '') {
            // it has scrolled off with the page: bring it back only for a real scroll up
            if (y > 110 && run < -40) setState('float');
            return;
        }
        if (run > 24) setState('hide');
        else if (run < -40) setState('float');
    }
    function onScroll() {
        if (ticking) return;
        ticking = true;
        (window.requestAnimationFrame || setTimeout)(update);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    update();
    // in-page links (this runs before the link is followed) and the Salons section index
    document.addEventListener('click', function (e) {
        var a = e.target.closest && e.target.closest('a[href*="#"]');
        if (!a || a.target === '_blank') return;
        var href = a.getAttribute('href'), at = href.indexOf('#'), id = href.slice(at + 1);
        var here = at === 0 || (href.slice(0, at) === '/' && (location.pathname === '/' || location.pathname === '/index.html'));
        if (here && id && document.getElementById(id)) goQuiet();
    }, true);
    document.addEventListener('jl:jump', goQuiet);

    // Menu
    var scrim = null;
    function setMenu(open) {
        if (!menu || !burger || open === menuOpen) return;
        menuOpen = open;
        if (open) { quiet = false; clearTimeout(quietTimer); }
        if (open && !scrim) {
            scrim = document.createElement('div');
            scrim.className = 'nav-scrim';
            scrim.addEventListener('click', function () { setMenu(false); });
            scrim.addEventListener('touchmove', function (e) { e.preventDefault(); }, { passive: false });
            document.body.appendChild(scrim);
            void scrim.offsetWidth; // so the fade runs the first time too
        }
        menu.classList.toggle('open', open);
        nav.classList.toggle('is-menu', open);
        if (scrim) scrim.classList.toggle('show', open);
        burger.setAttribute('aria-expanded', open ? 'true' : 'false');
        burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
        document.body.style.overflow = open ? 'hidden' : '';
        // opened while the bar is part way off the top: bring the whole bar into view
        if (open && state === '' && window.pageYOffset > 1) setState('float');
    }
    if (burger && menu) {
        burger.addEventListener('click', function () { setMenu(!menuOpen); });
        menu.addEventListener('click', function (e) {
            if (e.target.closest && e.target.closest('a')) setMenu(false);
        });
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && menuOpen) { setMenu(false); burger.focus(); }
        });
    }
    nav.addEventListener('focusin', function () { if (state === 'hide') setState('float'); });
    function onBreakpoint() { if (!phone.matches) setMenu(false); update(); }
    if (phone.addEventListener) phone.addEventListener('change', onBreakpoint);
    else if (phone.addListener) phone.addListener(onBreakpoint);
})();
