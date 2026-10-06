// Lightweight checks for MCP helpers (run with: npx tsx server/mcp/utils.spec.ts)

import {createPkceChallenge, escapeHtml, firstString, hashToken, isValidRedirectUri, sanitizeUser, toBase64Url, verifyPkce} from "./utils"

let failed = 0

const assert = (cond: any, message: string) => {
    if (!cond) {
        failed++
        console.error(`FAIL: ${message}`)
    } else {
        console.log(`ok: ${message}`)
    }
}

const verifier = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-._~"
assert(verifier.length == 66, "PKCE verifier length")
const challenge = createPkceChallenge(verifier)
assert(verifyPkce(verifier, challenge), "PKCE S256 round-trip")
assert(!verifyPkce(verifier + "x", challenge), "PKCE rejects a modified verifier")
assert(!verifyPkce("short", challenge), "PKCE rejects a short verifier")

assert(hashToken("abc") == hashToken("abc"), "hashToken is stable")
assert(hashToken("abc") != hashToken("abd"), "hashToken changes with input")
assert(toBase64Url(Buffer.from("f")).indexOf("+") < 0, "base64url has no +")

assert(isValidRedirectUri("https://example.com/callback"), "https redirect is valid")
assert(isValidRedirectUri("http://127.0.0.1:1234/callback"), "loopback redirect is valid")
assert(isValidRedirectUri("http://localhost:3000/auth"), "localhost redirect is valid")
assert(isValidRedirectUri("cursor://anysphere.cursor-mcp/oauth/callback"), "custom scheme redirect is valid")
assert(!isValidRedirectUri("http://evil.example/callback"), "public http redirect is rejected")
assert(!isValidRedirectUri("javascript:alert(1)"), "javascript URI is rejected")
assert(!isValidRedirectUri("https://user:pass@example.com/cb"), "userinfo is rejected")
assert(!isValidRedirectUri("not a url"), "garbage URI is rejected")

assert(escapeHtml('<script>"x"</script>') == "&lt;script&gt;&quot;x&quot;&lt;/script&gt;", "HTML is escaped")
assert(firstString(["a", "b"]) == "a", "firstString unwraps arrays")
assert(firstString(undefined) == "", "firstString handles missing values")

const sanitized: any = sanitizeUser({
    id: "1",
    stravaTokens: {accessToken: "secret", refreshToken: "secret"},
    urlToken: "calendar-secret",
    confirmEmail: "abc:user@example.com",
    garmin: {id: "g1", tokens: {accessToken: "g"}},
    wahoo: {id: "w1", tokens: {accessToken: "w"}},
    spotify: {id: "s1", tokens: {accessToken: "s"}},
    paddleId: "p1",
    recipes: {recipe1: {title: "Morning ride"}},
    fitDeviceNames: {"123": "Bike computer"}
} as any)
assert(!sanitized.stravaTokens, "Strava tokens are stripped")
assert(!sanitized.urlToken, "Calendar URL token is stripped")
assert(!sanitized.garmin.tokens, "Garmin tokens are stripped")
assert(!sanitized.wahoo.tokens, "Wahoo tokens are stripped")
assert(!sanitized.spotify.tokens, "Spotify tokens are stripped")
assert(!sanitized.paddleId, "Paddle ID is stripped")
assert(!sanitized.recipes, "Automation recipes are stripped")
assert(!sanitized.fitDeviceNames, "FIT device names are stripped")
assert(sanitized.confirmEmail == "user@example.com", "Email confirmation token is stripped")
assert(sanitized.garmin.id == "g1", "Garmin profile id is kept")

import {parseActivityId} from "../utils/logic"
import {listTools} from "./tools"

assert(parseActivityId("123456789") == "123456789", "parseActivityId handles numeric string")
assert(parseActivityId(123456789) == "123456789", "parseActivityId handles number")
assert(parseActivityId("https://www.strava.com/activities/123456789") == "123456789", "parseActivityId handles Strava URL")
assert(parseActivityId("https://www.strava.com/activities/123456789/") == "123456789", "parseActivityId handles Strava URL with trailing slash")
assert(parseActivityId("https://www.strava.com/activities/123456789?param=1") == "123456789", "parseActivityId handles Strava URL with query")
assert(parseActivityId("https://www.strava.com/activities/123456789#details") == "123456789", "parseActivityId handles Strava URL with hash")
assert(parseActivityId("https://www.strava.com/activities/123456789/segments/987") == "123456789", "parseActivityId handles Strava URL with segments path")
assert(parseActivityId("strava.com/activities/123456789") == "123456789", "parseActivityId handles URL without scheme")
assert(parseActivityId("http://strava.com/activities/123456789") == "123456789", "parseActivityId handles http URL")
assert(parseActivityId("invalid") == null, "parseActivityId returns null for invalid string")
assert(parseActivityId("0") == null, "parseActivityId returns null for 0 string")
assert(parseActivityId(0) == null, "parseActivityId returns null for 0 number")
assert(parseActivityId("") == null, "parseActivityId returns null for empty string")
assert(parseActivityId(null) == null, "parseActivityId returns null for null")
assert(parseActivityId(undefined) == null, "parseActivityId returns null for undefined")

const tools = listTools()
const debugTool = tools.find((t) => t.name == "get_activity_debug")
assert(!!debugTool, "get_activity_debug tool is registered")
assert(debugTool?.inputSchema?.properties?.activityId, "get_activity_debug requires activityId property")
assert(debugTool?.inputSchema?.required?.includes("activityId"), "get_activity_debug has activityId as required")

if (failed > 0) {
    console.error(`${failed} assertion(s) failed`)
    process.exit(1)
}

console.log("All MCP helper checks passed")
