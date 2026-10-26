/* ==========================================
   JOVÉE LINK · v2 shared JS
   Mobile menu, FAQ accordion, scroll reveal,
   TikTok ClickButton tracking
   ========================================== */
(function () {
    'use strict';

    // Section links (/#community, #belong, ...): land on the section when
    // arriving from a link, then clear the #hash from the address bar so a
    // refresh starts at the top of the page instead of jumping back down.
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    function clearHash() {
        if (location.hash && history.replaceState) history.replaceState(null, '', location.pathname + location.search);
    }
    function scrollToHash() {
        if (!location.hash) return;
        var t = document.getElementById(location.hash.slice(1));
        if (t) t.scrollIntoView({ behavior: 'auto', block: 'start' });
    }
    if (location.hash) {
        var landedHash = location.hash;
        var settle = function () { if (location.hash === landedHash) scrollToHash(); };
        settle();
        if (document.readyState === 'complete') {
            setTimeout(settle, 50);
        } else {
            window.addEventListener('load', function () { setTimeout(settle, 50); }, { once: true });
        }
        setTimeout(function () { settle(); clearHash(); }, 400);
    } else {
        window.scrollTo(0, 0);
    }
    // Same-page section links scroll smoothly without leaving #hash behind
    document.addEventListener('click', function (e) {
        var a = e.target.closest && e.target.closest('a[href^="#"], a[href^="/#"]');
        if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        var href = a.getAttribute('href');
        var id = href.slice(href.indexOf('#') + 1);
        if (href.charAt(0) === '/' && location.pathname !== '/' && location.pathname !== '/index.html') return;
        var t = id && document.getElementById(id);
        if (!t) return;
        e.preventDefault();
        t.scrollIntoView({ behavior: 'smooth', block: 'start' });
        clearHash();
    });

    // Mobile menu
    var hamburger = document.getElementById('hamburger');
    var mobileMenu = document.getElementById('mobileMenu');
    if (hamburger && mobileMenu) {
        hamburger.addEventListener('click', function () {
            var open = mobileMenu.classList.toggle('open');
            hamburger.setAttribute('aria-expanded', open ? 'true' : 'false');
            document.body.style.overflow = open ? 'hidden' : '';
        });
        mobileMenu.querySelectorAll('a').forEach(function (a) {
            a.addEventListener('click', function () {
                mobileMenu.classList.remove('open');
                hamburger.setAttribute('aria-expanded', 'false');
                document.body.style.overflow = '';
            });
        });
    }

    // FAQ accordion: close others when one opens
    document.querySelectorAll('.faq-item').forEach(function (item) {
        item.addEventListener('toggle', function () {
            if (item.open) {
                document.querySelectorAll('.faq-item').forEach(function (other) {
                    if (other !== item && other.open) other.open = false;
                });
            }
        });
    });

    // Reveal-on-scroll
    var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
            if (e.isIntersecting) {
                e.target.classList.add('in');
                io.unobserve(e.target);
            }
        });
    }, { rootMargin: '0px 0px -50px 0px', threshold: 0.08 });
    document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });

    // TikTok ClickButton tracking (parallels /api/tiktok-track relay)
    function ttGenId() {
        return 'evt_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 10);
    }
    function ttReadCookie(name) {
        var m = document.cookie.match(new RegExp('(?:^|;\\s*)' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '=([^;]*)'));
        return m ? decodeURIComponent(m[1]) : null;
    }
    document.addEventListener('click', function (e) {
        var el = e.target.closest('[data-tt-track]');
        if (!el) return;
        var name = el.getAttribute('data-tt-track');
        var eventId = ttGenId();
        var props = { content_name: name, content_type: 'button', url: location.href };
        if (window.ttq && typeof window.ttq.track === 'function') {
            try { window.ttq.track('ClickButton', props, { event_id: eventId }); } catch (_) {}
        }
        try {
            fetch('/api/tiktok-track', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    event: 'ClickButton',
                    event_id: eventId,
                    properties: props,
                    url: location.href,
                    referrer: document.referrer || '',
                    ttp: ttReadCookie('_ttp'),
                    ttclid: new URLSearchParams(location.search).get('ttclid') || ttReadCookie('ttclid')
                }),
                keepalive: true
            }).catch(function () {});
        } catch (_) {}
    });
})();
