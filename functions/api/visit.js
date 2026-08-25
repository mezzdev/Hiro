export async function onRequestPost(context) {
    const corsHeaders = {
        'Content-Type': 'application/json; charset=UTF-8',
        'Cache-Control': 'no-store'
    };

    try {
        const data = await context.request.json();
        const webhook = context.env.DISCORD_WEBHOOK;

        if (!webhook) {
            return new Response(JSON.stringify({ error: 'Tracker non configure' }), {
                status: 503,
                headers: corsHeaders
            });
        }

        const safe = (value, fallback = 'Inconnu', max = 500) => {
            const text = typeof value === 'string' ? value.trim() : fallback;
            return text.slice(0, max) || fallback;
        };

        const visitor = {
            page: safe(data.page, '/'),
            browser: safe(data.browser),
            os: safe(data.os),
            resolution: safe(data.resolution),
            language: safe(data.language),
            referrer: safe(data.referrer, 'Direct'),
            date: safe(data.date, new Date().toISOString(), 80)
        };

        const discordResponse = await fetch(webhook, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: 'Hiro Tracker',
                embeds: [{
                    title: 'Nouveau visiteur',
                    color: 0x1677ff,
                    fields: [
                        { name: 'Page', value: visitor.page, inline: false },
                        { name: 'Navigateur', value: visitor.browser, inline: true },
                        { name: 'OS', value: visitor.os, inline: true },
                        { name: 'Résolution', value: visitor.resolution, inline: true },
                        { name: 'Langue', value: visitor.language, inline: true },
                        { name: 'Provenance', value: visitor.referrer, inline: false },
                        { name: 'Date', value: visitor.date, inline: false }
                    ]
                }]
            })
        });

        if (!discordResponse.ok) {
            return new Response(JSON.stringify({ error: 'Discord webhook indisponible' }), {
                status: 502,
                headers: corsHeaders
            });
        }

        return new Response(JSON.stringify({ ok: true }), {
            status: 200,
            headers: corsHeaders
        });
    } catch {
        return new Response(JSON.stringify({ error: 'Requête invalide' }), {
            status: 400,
            headers: corsHeaders
        });
    }
}
