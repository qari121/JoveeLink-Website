/* ==========================================
   JOVÉE LINK · app-store click tracking
   Loaded on every page. On joveelink.com it:
   - remembers how the visitor arrived (utm_*, gclid, gbraid, wbraid) for this visit
   - sends a Google Ads conversion when someone taps an App Store or Google Play link
     (conversion action "Outbound click", AW-18434585912)
   - sends a GA4 event "app_store_click" with the store and which button was tapped
   - adds an install referrer to Google Play links, so installs that start on the
     website can be attributed to the ad, campaign or button they came from
   GA4 key events store_click_ios / store_click_android keep coming from the
   "click" event rules in GA4 (Admin > Events > Custom configurations), so this file
   does not send those names again.
   ========================================== */
(function () {
    'use strict';

    var ADS_CONVERSION = 'AW-18434585912/SAWlCNzKurodELjqpdZE';
    var GA4_ID = 'G-ERKQ239G6V';
    var KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'gclid', 'gbraid', 'wbraid'];
    var STORE_KEY = 'jl_attrib';
    var isLive = /(^|\.)joveelink\.com$/.test(location.hostname);

    // --- how the visitor arrived (first page of the visit wins, a new ad click replaces it)
    function readStored() {
        try { return JSON.parse(sessionStorage.getItem(STORE_KEY) || '{}') || {}; } catch (_) { return {}; }
    }
    var attrib = readStored();
    try {
        var qs = new URLSearchParams(location.search);
        var fresh = {};
        KEYS.forEach(function (k) { var v = qs.get(k); if (v) fresh[k] = v.slice(0, 150); });
        if (Object.keys(fresh).length && (fresh.gclid || fresh.gbraid || fresh.wbraid || fresh.utm_source || !Object.keys(attrib).length)) {
            attrib = fresh;
            try { sessionStorage.setItem(STORE_KEY, JSON.stringify(attrib)); } catch (_) {}
        }
    } catch (_) {}

    // --- which store a link goes to
    function storeOf(a) {
        var h = (a && a.href) || '';
        if (/^https?:\/\/(apps|itunes)\.apple\.com\//i.test(h)) return 'ios';
        if (/^https?:\/\/play\.google\.com\/store\/apps\//i.test(h)) return 'android';
        return null;
    }
    function placementOf(a) {
        return a.getAttribute('data-tt-track') || a.id || (location.pathname.replace(/\/$/, '') || '/home');
    }

    // --- Google Play install referrer (left alone if a link already carries one)
    function withPlayReferrer(href, placement) {
        if (/[?&]referrer=/.test(href)) return href;
        var paid = attrib.gclid || attrib.gbraid || attrib.wbraid;
        var parts = [
            'utm_source=' + encodeURIComponent(attrib.utm_source || (paid ? 'google' : 'joveelink.com')),
            'utm_medium=' + encodeURIComponent(attrib.utm_medium || (paid ? 'cpc' : 'website')),
            'utm_campaign=' + encodeURIComponent(attrib.utm_campaign || 'website'),
            'utm_content=' + encodeURIComponent(placement)
        ];
        if (attrib.utm_term) parts.push('utm_term=' + encodeURIComponent(attrib.utm_term));
        if (attrib.gclid) parts.push('gclid=' + encodeURIComponent(attrib.gclid));
        return href + (href.indexOf('?') === -1 ? '?' : '&') + 'referrer=' + encodeURIComponent(parts.join('&'));
    }

    // --- the tap
    var last = { el: null, t: 0 };
    document.addEventListener('click', function (e) {
        var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
        var store = storeOf(a);
        if (!store) return;
        var placement = placementOf(a);
        // the referrer is added at the moment of the tap, so it also covers links that
        // other scripts create or copy (the app prompt, "Get the app" in the header)
        if (store === 'android') a.href = withPlayReferrer(a.href, placement);

        var now = Date.now();
        if (last.el === a && now - last.t < 1500) return; // a double tap is one tap
        last = { el: a, t: now };

        if (!isLive || typeof window.gtag !== 'function') return;
        try {
            window.gtag('event', 'conversion', {
                send_to: ADS_CONVERSION,
                value: 1.0,
                currency: 'USD',
                transport_type: 'beacon'
            });
            window.gtag('event', 'app_store_click', {
                send_to: GA4_ID,
                store: store,
                placement: placement,
                link_url: a.href.split('?')[0],
                transport_type: 'beacon'
            });
        } catch (_) {}
    }, true);

})();
