// TikTok Events API relay — Vercel serverless function.
//
// The client (index.html) fires ttq.track(...) for the client-side Pixel AND
// POSTs the same event here with the same event_id. This function forwards it
// to TikTok's Events API server-side. Same event_id on both sides = TikTok
// deduplicates and counts it once. When ad blockers kill the Pixel, the
// server-side path still lands.
//
// Required env vars (Vercel → Project Settings → Environment Variables):
//   TIKTOK_ACCESS_TOKEN — required. Generate in TikTok Events Manager.
//   TIKTOK_PIXEL_ID     — optional. Falls back to the Jovee AR pixel below.

const DEFAULT_PIXEL_ID = 'DA0FUTJC77UDKVSV2FQG';
const TIKTOK_ENDPOINT = 'https://business-api.tiktok.com/open_api/v1.3/event/track/';

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ ok: false, error: 'method_not_allowed' });
    }

    const token = process.env.TIKTOK_ACCESS_TOKEN;
    const pixelId = process.env.TIKTOK_PIXEL_ID || DEFAULT_PIXEL_ID;

    // No token = silent no-op. The Pixel side still fires; nothing spams the console.
    if (!token) {
        return res.status(200).json({ ok: false, reason: 'no_token' });
    }

    let body = req.body;
    if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch (e) { body = {}; }
    }
    body = body || {};

    const eventName = body.event || 'ViewContent';
    const eventId = body.event_id || ('evt_' + Date.now().toString(36));
    const properties = body.properties || {};
    const pageUrl = body.url || properties.url || '';
    const referrer = body.referrer || '';

    const xff = req.headers['x-forwarded-for'];
    const ip = (Array.isArray(xff) ? xff[0] : (xff || '')).split(',')[0].trim()
        || (req.socket && req.socket.remoteAddress)
        || '';
    const userAgent = req.headers['user-agent'] || '';

    const user = {};
    if (body.ttclid) user.ttclid = body.ttclid;
    if (body.ttp) user.ttp = body.ttp;
    if (ip) user.ip = ip;
    if (userAgent) user.user_agent = userAgent;

    const payload = {
        event_source: 'web',
        event_source_id: pixelId,
        data: [{
            event: eventName,
            event_time: Math.floor(Date.now() / 1000),
            event_id: eventId,
            user: user,
            properties: properties,
            page: {
                url: pageUrl,
                referrer: referrer
            }
        }]
    };

    try {
        const upstream = await fetch(TIKTOK_ENDPOINT, {
            method: 'POST',
            headers: {
                'Access-Token': token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        const result = await upstream.json().catch(function () { return {}; });
        return res.status(upstream.ok ? 200 : 502).json({
            ok: upstream.ok,
            upstream_status: upstream.status,
            result: result
        });
    } catch (err) {
        return res.status(500).json({
            ok: false,
            error: String(err && err.message || err)
        });
    }
};
