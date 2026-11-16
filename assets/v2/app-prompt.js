(function () {
    'use strict';


    // ---------------------------------------------------------------
    // App prompt
    //
    // The try-on needs a camera, so a desktop visitor cannot actually use
    // the thing the site is selling. Offer the app: a QR to open it on a
    // phone, plus the store links. Shown once, then remembered — a prompt
    // that reappears on every page view is an ad, not a help.
    // ---------------------------------------------------------------
    // self-contained styles: index.html carries its own inline CSS and does
    // not load site.css, so the prompt ships its own
    var style = document.createElement('style');
    style.textContent = "/* ===================================================================\n   APP PROMPT \u2014 shown shortly after arrival, once per visitor\n   =================================================================== */\n.app-prompt-backdrop {\n    position: fixed;\n    inset: 0;\n    z-index: 200;\n    background: rgba(13, 35, 64, 0.55);\n    backdrop-filter: blur(4px);\n    -webkit-backdrop-filter: blur(4px);\n    opacity: 0;\n    pointer-events: none;\n    transition: opacity 0.35s var(--ease, cubic-bezier(.4,0,.2,1));\n}\n.app-prompt-backdrop.show { opacity: 1; pointer-events: auto; }\n\n.app-prompt {\n    position: fixed;\n    z-index: 201;\n    left: 50%;\n    top: 50%;\n    transform: translate(-50%, -46%) scale(0.98);\n    width: min(560px, calc(100vw - 32px));\n    background: var(--white, #ffffff);\n    border-radius: var(--r-lg, 20px);\n    box-shadow: 0 24px 64px rgba(13, 35, 64, 0.28);\n    padding: var(--sp-10, 40px) var(--sp-10, 40px) var(--sp-8, 32px);\n    opacity: 0;\n    pointer-events: none;\n    transition: opacity 0.35s var(--ease, cubic-bezier(.4,0,.2,1)), transform 0.35s var(--ease, cubic-bezier(.4,0,.2,1));\n}\n.app-prompt.show { opacity: 1; pointer-events: auto; transform: translate(-50%, -50%) scale(1); }\n\n.app-prompt-close {\n    position: absolute;\n    top: 14px;\n    right: 14px;\n    width: 34px;\n    height: 34px;\n    border: 0;\n    border-radius: 50%;\n    background: var(--gray-50, #f5f5f5);\n    color: var(--gray-700, #4d5157);\n    cursor: pointer;\n    display: grid;\n    place-items: center;\n    transition: background 0.2s var(--ease, cubic-bezier(.4,0,.2,1));\n}\n.app-prompt-close:hover { background: var(--gray-100, #dddedf); }\n.app-prompt-close svg { width: 16px; height: 16px; }\n\n.app-prompt .eyebrow { margin-bottom: var(--sp-3, 12px); }\n.app-prompt h2 { font-size: 28px; line-height: 1.2; margin: 0 0 var(--sp-3, 12px); color: var(--brand-navy, #0d2340); }\n.app-prompt p { color: var(--gray-700, #4d5157); margin: 0 0 var(--sp-6, 24px); font-size: 15px; }\n\n.app-prompt-body { display: flex; gap: var(--sp-8, 32px); align-items: center; }\n.app-prompt-qr {\n    flex: none;\n    width: 132px;\n    padding: 10px;\n    border: 1px solid var(--gray-100, #dddedf);\n    border-radius: var(--r-md, 12px);\n    background: var(--white, #ffffff);\n}\n.app-prompt-qr img { display: block; width: 100%; height: auto; }\n.app-prompt-qr-cap {\n    display: block;\n    margin-top: 8px;\n    font-size: 11px;\n    line-height: 1.4;\n    text-align: center;\n    color: var(--gray-500, #7a7e84);\n}\n.app-prompt-stores { display: flex; flex-direction: column; gap: var(--sp-3, 12px); flex: 1; min-width: 0; }\n.app-prompt-list { list-style: none; padding: 0; margin: 0 0 var(--sp-5, 20px); }\n.app-prompt-list li {\n    display: flex;\n    gap: 9px;\n    align-items: flex-start;\n    font-size: 14px;\n    color: var(--gray-700, #4d5157);\n    margin-bottom: 7px;\n}\n.app-prompt-list svg { flex: none; width: 15px; height: 15px; margin-top: 3px; color: var(--brand-teal, #0d7568); }\n.app-prompt-later {\n    display: block;\n    margin: var(--sp-5, 20px) auto 0;\n    background: none;\n    border: 0;\n    color: var(--gray-500, #7a7e84);\n    font-size: 13px;\n    cursor: pointer;\n    text-decoration: underline;\n    text-underline-offset: 3px;\n}\n.app-prompt-later:hover { color: var(--gray-800, #383b40); }\n\n/* The QR is only useful on a device that is not the phone you'd scan with. */\n@media (max-width: 760px) {\n    .app-prompt { padding: var(--sp-8, 32px) var(--sp-6, 24px) var(--sp-6, 24px); }\n    .app-prompt h2 { font-size: 23px; }\n    .app-prompt-body { display: block; }\n    .app-prompt-qr-wrap { display: none; }\n    .app-prompt-stores { flex-direction: column; }\n}\n@media (prefers-reduced-motion: reduce) {\n    .app-prompt, .app-prompt-backdrop { transition: none; }\n}";
    document.head.appendChild(style);

    var APP_PROMPT_KEY = 'jl_app_prompt_v1';
    var APP_STORE = 'https://apps.apple.com/us/app/jovee-link/id6755535426';
    var PLAY_STORE = 'https://play.google.com/store/apps/details?id=com.joveelink.app';

    function promptSeen() {
        try { return localStorage.getItem(APP_PROMPT_KEY) === 'dismissed'; }
        catch (e) { return false; }   // private mode: just show it
    }
    function rememberPrompt() {
        try { localStorage.setItem(APP_PROMPT_KEY, 'dismissed'); } catch (e) {}
    }

    function buildAppPrompt() {
        var backdrop = document.createElement('div');
        backdrop.className = 'app-prompt-backdrop';

        var box = document.createElement('div');
        box.className = 'app-prompt';
        box.setAttribute('role', 'dialog');
        box.setAttribute('aria-modal', 'true');
        box.setAttribute('aria-labelledby', 'appPromptTitle');
        box.innerHTML =
            '<button class="app-prompt-close" aria-label="Close">' +
              '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
            '</button>' +
            '<span class="eyebrow">Get the app</span>' +
            '<h2 id="appPromptTitle">Try it on your phone</h2>' +
            '<p>The try-on needs a camera, so it only really works on a phone. The app is where you book, too.</p>' +
            '<div class="app-prompt-body">' +
              '<div class=\"app-prompt-qr-wrap\">' +
                '<div class="app-prompt-qr"><img src="/assets/v2/qr-tryon.svg" alt="QR code linking to the Jov&eacute;e Link try-on" width="228" height="228"></div>' +
                '<span class="app-prompt-qr-cap">Scan to open it<br>on your phone</span>' +
              '</div>' +
              '<div style="flex:1;min-width:0">' +
                '<ul class="app-prompt-list">' +
                  '<li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>Try a colour on your own hands</li>' +
                  '<li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>See nail artists near you on a map</li>' +
                  '<li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>Message them, book a time, pay afterwards</li>' +
                '</ul>' +
                '<div class="app-prompt-stores">' +
                  '<a href="' + APP_STORE + '" target="_blank" rel="noopener noreferrer" class="btn-store" data-tt-track="prompt_appstore" aria-label="Download on the App Store">' +
                    '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>' +
                    '<span class="btn-store-text"><small>Download on the</small><strong>App Store</strong></span></a>' +
                  '<a href="' + PLAY_STORE + '" target="_blank" rel="noopener noreferrer" class="btn-store" data-tt-track="prompt_playstore" aria-label="Get it on Google Play">' +
                    '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3.609 1.814 13.792 12 3.61 22.186a.996.996 0 0 1-.61-.92V2.734a1 1 0 0 1 .609-.92zm10.89 10.893 2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.199 2.302 2.302a1 1 0 0 1 0 1.38l-2.302 2.302L15.395 12l2.303-2.492zM5.864 2.658l10.937 6.333-2.302 2.302L5.864 2.658z"/></svg>' +
                    '<span class="btn-store-text"><small>Get it on</small><strong>Google Play</strong></span></a>' +
                '</div>' +
              '</div>' +
            '</div>' +
            '<button class="app-prompt-later">Not now</button>';

        document.body.appendChild(backdrop);
        document.body.appendChild(box);

        var lastFocus = document.activeElement;
        function close() {
            backdrop.classList.remove('show');
            box.classList.remove('show');
            rememberPrompt();
            document.removeEventListener('keydown', onKey);
            setTimeout(function () {
                backdrop.remove();
                box.remove();
                if (lastFocus && lastFocus.focus) lastFocus.focus();
            }, 350);
        }
        function onKey(e) { if (e.key === 'Escape') close(); }

        box.querySelector('.app-prompt-close').addEventListener('click', close);
        box.querySelector('.app-prompt-later').addEventListener('click', close);
        backdrop.addEventListener('click', close);
        document.addEventListener('keydown', onKey);
        // tapping a store link is a conversion, not a dismissal — but the
        // visitor is done with the prompt either way
        box.querySelectorAll('a').forEach(function (a) {
            a.addEventListener('click', function () { rememberPrompt(); });
        });

        requestAnimationFrame(function () {
            backdrop.classList.add('show');
            box.classList.add('show');
            box.querySelector('.app-prompt-close').focus();
        });
    }

    if (!promptSeen()) {
        // a beat after arrival, so it does not fight the page painting
        setTimeout(buildAppPrompt, 1400);
    }
})();
