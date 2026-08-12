// One-off helper: walks Google's OAuth consent flow and prints a Gmail refresh token.
//
//   bun scripts/gmail-oauth.mjs
//
// Prerequisite: a Google Cloud project with the Gmail API enabled, the
// https://mail.google.com/ scope on the consent screen, the app PUBLISHED (an
// External app left in "Testing" hands out refresh tokens that die after 7 days),
// and a "Desktop app" OAuth client whose ID/secret are in app/.env as
// GMAIL_CLIENT_ID / GMAIL_CLIENT_SECRET. Full walkthrough:
// docs/impl/09-deployment.md § Gmail XOAUTH2.
//
// Writes nothing to disk — it prints the .env lines for you to paste.

import { createHash, randomBytes } from "node:crypto";
import { createServer } from "node:http";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadEnv } from "dotenv";

const here = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: join(here, "..", ".env"), quiet: true });

const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
// The only scope smtp.gmail.com accepts over XOAUTH2. gmail.send is Gmail-API-only
// and produces a 535 "Invalid credentials" at the SMTP AUTH step.
const SCOPE = "https://mail.google.com/";
const CONSENT_TIMEOUT_MS = 5 * 60_000;

const clientId = (process.env.GMAIL_CLIENT_ID ?? "").trim();
const clientSecret = (process.env.GMAIL_CLIENT_SECRET ?? "").trim();
if (clientId === "" || clientSecret === "") {
  console.error("Set GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET in app/.env (or the environment).");
  process.exit(1);
}

const state = randomBytes(16).toString("hex");
const codeVerifier = randomBytes(32).toString("base64url");
const codeChallenge = createHash("sha256").update(codeVerifier).digest("base64url");

const server = createServer();
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const { port } = server.address();
// Desktop-app clients accept any loopback port without pre-registration, which is
// why the port can be ephemeral. A "Web application" client could not do this.
const redirectUri = `http://127.0.0.1:${port}/callback`;

const consentUrl = `${AUTH_URL}?${new URLSearchParams({
  client_id: clientId,
  redirect_uri: redirectUri,
  response_type: "code",
  scope: SCOPE,
  // access_type=offline is what makes Google issue a refresh_token at all;
  // prompt=consent forces a fresh one even if this account already granted the app
  // (Google returns no refresh_token on a repeat grant otherwise).
  access_type: "offline",
  prompt: "consent",
  state,
  code_challenge: codeChallenge,
  code_challenge_method: "S256",
})}`;

console.log("\nOpen this URL in a browser signed in as the sending Gmail account:\n");
console.log(consentUrl);
console.log(
  `\nAn unverified app shows a warning screen — click Advanced, then "Go to … (unsafe)".`,
);
console.log(`Waiting up to 5 minutes for the redirect to ${redirectUri} …\n`);

let code;
try {
  code = await waitForCode();
} finally {
  server.close();
}

const tokens = await exchangeCode(code);
if (typeof tokens.refresh_token !== "string" || tokens.refresh_token === "") {
  console.error(
    "Google returned no refresh_token. Revoke this app at " +
      "https://myaccount.google.com/permissions and run again.",
  );
  process.exit(1);
}

console.log("\nSuccess. Add these to app/.env:\n");
console.log("MAIL_TRANSPORT=gmail-oauth");
console.log("GMAIL_USER=<the Gmail address you just authorized>");
console.log(`GMAIL_REFRESH_TOKEN=${tokens.refresh_token}`);
console.log("\nThen verify with: bun scripts/send-test-email.mjs\n");

function waitForCode() {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error("Timed out waiting for consent.")),
      CONSENT_TIMEOUT_MS,
    );
    server.on("request", (request, response) => {
      const url = new URL(request.url ?? "/", redirectUri);
      if (url.pathname !== "/callback") {
        response.writeHead(404).end();
        return;
      }
      const error = url.searchParams.get("error");
      const received = url.searchParams.get("code");
      const returnedState = url.searchParams.get("state");
      const failure =
        error ??
        (returnedState !== state ? "state mismatch — possible CSRF, aborting" : null) ??
        (received === null ? "no authorization code in the callback" : null);

      response.writeHead(failure === null ? 200 : 400, {
        "content-type": "text/html; charset=utf-8",
      });
      response.end(
        `<!doctype html><meta charset="utf-8"><body style="font:16px system-ui;padding:2rem">${
          failure === null
            ? "Authorized. Close this tab and return to the terminal."
            : "Authorization failed — see the terminal."
        }</body>`,
      );

      clearTimeout(timer);
      if (failure === null) resolve(received);
      else reject(new Error(failure));
    });
  });
}

async function exchangeCode(authorizationCode) {
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code: authorizationCode,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
      code_verifier: codeVerifier,
    }),
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(`Token exchange failed (${response.status}): ${JSON.stringify(payload)}`);
  }
  return payload;
}
