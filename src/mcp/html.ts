// Strautomator MCP HTML pages (consent / errors)

import {escapeHtml, getMcpConfig} from "./utils"

const layout = (title: string, body: string): string => {
    const config = getMcpConfig()
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)} - Strautomator</title>
    <style>
        body { margin: 0; font-family: "Roboto", "Helvetica Neue", Arial, sans-serif; background: #121212; color: #eee; }
        .stripe { height: 6px; background: #ff8f00; }
        .wrap { max-width: 560px; margin: 48px auto; padding: 0 20px; }
        h1 { font-weight: 300; font-size: 1.6rem; margin: 0 0 8px; }
        h2 { font-weight: 700; font-size: 1.9rem; margin: 0 0 24px; color: #ffb74d; }
        p { line-height: 1.5; color: #ccc; }
        .card { background: #1e1e1e; border: 1px solid #333; border-radius: 12px; padding: 24px; }
        .row { margin: 16px 0; }
        .actions { display: flex; gap: 12px; justify-content: flex-end; margin-top: 24px; }
        button, .btn { appearance: none; border: 0; border-radius: 24px; padding: 10px 20px; font-size: 14px; cursor: pointer; text-decoration: none; display: inline-block; }
        .primary { background: #ff8f00; color: #111; font-weight: 600; }
        .ghost { background: transparent; color: #bbb; border: 1px solid #555; }
        .muted { color: #999; font-size: 13px; }
        a { color: #ffb74d; }
    </style>
</head>
<body>
    <div class="stripe"></div>
    <div class="wrap">
        <h1>Strautomator</h1>
        ${body}
        <p class="muted">MCP endpoint: ${escapeHtml(config.resource)}</p>
    </div>
</body>
</html>`
}

export const consentPage = (options: {clientName: string; userName: string; requestId: string; consentToken: string}): string => {
    const clientName = escapeHtml(options.clientName || "An MCP client")
    const userName = escapeHtml(options.userName || "your account")

    return layout(
        "Authorize MCP access",
        `<h2>Authorize access</h2>
        <div class="card">
            <p><strong>${clientName}</strong> wants to access Strautomator as <strong>${userName}</strong>.</p>
            <p>This lets the client read your activities, automations and GearWear, and make changes that you already can make in the Strautomator app. Access is limited to PRO members.</p>
            <form method="post" action="/mcp/oauth/authorize">
                <input type="hidden" name="request_id" value="${escapeHtml(options.requestId)}" />
                <input type="hidden" name="consent_token" value="${escapeHtml(options.consentToken)}" />
                <div class="actions">
                    <button class="ghost" type="submit" name="decision" value="deny">Deny</button>
                    <button class="primary" type="submit" name="decision" value="approve">Authorize</button>
                </div>
            </form>
        </div>`
    )
}

export const errorPage = (title: string, message: string, href?: string, hrefLabel?: string): string => {
    const link = href ? `<p><a class="btn primary" href="${escapeHtml(href)}">${escapeHtml(hrefLabel || "Continue")}</a></p>` : ""
    return layout(title, `<h2>${escapeHtml(title)}</h2><div class="card"><p>${escapeHtml(message)}</p>${link}</div>`)
}

export const proRequiredPage = (): string => {
    return errorPage("PRO required", "The Strautomator MCP server is available to PRO members only. Upgrade your account, then try connecting again.", "/billing", "Go to billing")
}

