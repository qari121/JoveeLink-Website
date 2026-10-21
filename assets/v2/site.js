/* ==========================================
   JOVÉE LINK · v2 shared JS
   Mobile menu, FAQ accordion, scroll reveal,
   TikTok ClickButton tracking
   ========================================== */
(function () {
    'use strict';

    // Scroll to hash target on initial page load — some browsers skip the
    // native jump when scroll-behavior: smooth is set, or when images push
    // the target's position after first paint. Re-run on window.load and
    // after a short delay so a /#community link lands at the section.
    function scrollToHash() {
        if (!location.hash) return;
        var t = document.getElementById(location.hash.slice(1));
        if (t) t.scrollIntoView({ behavior: 'auto', block: 'start' });
    }
    if (location.hash) {
        scrollToHash();
        if (document.readyState === 'complete') {
            setTimeout(scrollToHash, 50);
        } else {
            window.addEventListener('load', function () { setTimeout(scrollToHash, 50); }, { once: true });
        }
        setTimeout(scrollToHash, 400);
    }

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
