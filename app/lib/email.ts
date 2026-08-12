import nodemailer from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";
import { renderMagicLink, renderOtp } from "@/lib/emails";

// Google's current token endpoint. Nodemailer still defaults `accessUrl` to the
// legacy https://accounts.google.com/o/oauth2/token (lib/xoauth2/index.js), so this
// is set explicitly rather than inherited.
const GMAIL_TOKEN_URL = "https://oauth2.googleapis.com/token";
const DEFAULT_FROM = "CV Admin <admin@localhost>";

export type MailTransportKind = "smtp" | "gmail-oauth" | "mailgun";

/** The only environment this module reads. Snapshotted so it can be faked in tests. */
export type MailEnv = {
  MAIL_TRANSPORT?: string;
  SMTP_HOST?: string;
  SMTP_PORT?: string;
  SMTP_USER?: string;
  SMTP_PASS?: string;
  SMTP_FROM?: string;
  GMAIL_USER?: string;
  GMAIL_CLIENT_ID?: string;
  GMAIL_CLIENT_SECRET?: string;
  GMAIL_REFRESH_TOKEN?: string;
  MAILGUN_API_KEY?: string;
  MAILGUN_DOMAIN?: string;
  MAILGUN_FROM?: string;
  MAILGUN_REGION?: string;
};

export function readMailEnv(source: NodeJS.ProcessEnv = process.env): MailEnv {
  return {
    MAIL_TRANSPORT: source.MAIL_TRANSPORT,
    SMTP_HOST: source.SMTP_HOST,
    SMTP_PORT: source.SMTP_PORT,
    SMTP_USER: source.SMTP_USER,
    SMTP_PASS: source.SMTP_PASS,
    SMTP_FROM: source.SMTP_FROM,
    GMAIL_USER: source.GMAIL_USER,
    GMAIL_CLIENT_ID: source.GMAIL_CLIENT_ID,
    GMAIL_CLIENT_SECRET: source.GMAIL_CLIENT_SECRET,
    GMAIL_REFRESH_TOKEN: source.GMAIL_REFRESH_TOKEN,
    MAILGUN_API_KEY: source.MAILGUN_API_KEY,
    MAILGUN_DOMAIN: source.MAILGUN_DOMAIN,
    MAILGUN_FROM: source.MAILGUN_FROM,
    MAILGUN_REGION: source.MAILGUN_REGION,
  };
}

export function resolveMailTransportKind(env: MailEnv): MailTransportKind {
  const raw = (env.MAIL_TRANSPORT ?? "").trim().toLowerCase();
  if (raw === "" || raw === "smtp") return "smtp";
  if (raw === "gmail-oauth") return "gmail-oauth";
  if (raw === "mailgun") return "mailgun";
  throw new Error(
    `Invalid MAIL_TRANSPORT ${JSON.stringify(env.MAIL_TRANSPORT)} — expected "smtp", "gmail-oauth", or "mailgun".`,
  );
}

const GMAIL_REQUIRED = [
  "GMAIL_USER",
  "GMAIL_CLIENT_ID",
  "GMAIL_CLIENT_SECRET",
  "GMAIL_REFRESH_TOKEN",
] as const satisfies readonly (keyof MailEnv)[];

/**
 * Pure: environment in, nodemailer transport options out. Throws — never silently
 * degrades to SMTP — when MAIL_TRANSPORT=gmail-oauth is incompletely configured.
 * Only covers the two nodemailer-backed kinds; mailgun is a separate HTTP API path
 * with no SMTPTransport.Options shape, see buildMailgunConfig().
 */
export function buildTransportOptions(env: MailEnv): SMTPTransport.Options {
  const kind = resolveMailTransportKind(env);
  if (kind === "mailgun") {
    throw new Error("buildTransportOptions() does not support mailgun — use buildMailgunConfig().");
  }
  if (kind === "gmail-oauth") return gmailTransportOptions(env);
  return {
    host: env.SMTP_HOST ?? "127.0.0.1",
    port: Number(env.SMTP_PORT ?? 1025),
    auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
  };
}

function gmailTransportOptions(env: MailEnv): SMTPTransport.Options {
  const missing = GMAIL_REQUIRED.filter((key) => (env[key] ?? "").trim() === "");
  if (missing.length > 0) {
    throw new Error(
      `MAIL_TRANSPORT=gmail-oauth requires ${missing.join(", ")}. ` +
        `Run \`bun scripts/gmail-oauth.mjs\` to mint a refresh token, or set MAIL_TRANSPORT=smtp.`,
    );
  }
  return {
    // 465 + implicit TLS, matching nodemailer's own "Gmail" well-known preset
    // (lib/well-known/services.json). If a network blocks 465, the working
    // alternative is { port: 587, secure: false, requireTLS: true }.
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      type: "OAuth2",
      user: env.GMAIL_USER,
      clientId: env.GMAIL_CLIENT_ID,
      clientSecret: env.GMAIL_CLIENT_SECRET,
      refreshToken: env.GMAIL_REFRESH_TOKEN,
      accessUrl: GMAIL_TOKEN_URL,
    },
  };
}

export type MailgunRegion = "us" | "eu";

export type MailgunConfig = {
  apiKey: string;
  domain: string;
  from: string;
  region: MailgunRegion;
};

const MAILGUN_REQUIRED = [
  "MAILGUN_API_KEY",
  "MAILGUN_DOMAIN",
  "MAILGUN_FROM",
] as const satisfies readonly (keyof MailEnv)[];

/**
 * Pure: environment in, Mailgun HTTP API config out. Throws — never silently
 * degrades to SMTP — when MAIL_TRANSPORT=mailgun is incompletely configured.
 * MAILGUN_FROM is required rather than defaulted: unlike GMAIL_USER, Mailgun has no
 * single authenticated mailbox identity to fall back to — the API key authorizes a
 * whole domain, and any address on it (or none) can be the sender.
 */
export function buildMailgunConfig(env: MailEnv): MailgunConfig {
  if (resolveMailTransportKind(env) !== "mailgun") {
    throw new Error("buildMailgunConfig() only applies when MAIL_TRANSPORT=mailgun.");
  }
  const missing = MAILGUN_REQUIRED.filter((key) => (env[key] ?? "").trim() === "");
  if (missing.length > 0) {
    throw new Error(
      `MAIL_TRANSPORT=mailgun requires ${missing.join(", ")}. ` +
        `See docs/impl/09-deployment.md § Mailgun HTTP API, or set MAIL_TRANSPORT=smtp.`,
    );
  }
  return {
    apiKey: (env.MAILGUN_API_KEY ?? "").trim(),
    domain: (env.MAILGUN_DOMAIN ?? "").trim(),
    from: (env.MAILGUN_FROM ?? "").trim(),
    region: resolveMailgunRegion(env.MAILGUN_REGION),
  };
}

function resolveMailgunRegion(raw: string | undefined): MailgunRegion {
  const value = (raw ?? "").trim().toLowerCase();
  if (value === "" || value === "us") return "us";
  if (value === "eu") return "eu";
  throw new Error(`Invalid MAILGUN_REGION ${JSON.stringify(raw)} — expected "us" or "eu".`);
}

function mailgunBaseUrl(region: MailgunRegion): string {
  // Mailgun's US and EU regions are fully separate services with separate
  // credentials/domains — a domain created in one is invisible to the other's API.
  return region === "eu" ? "https://api.eu.mailgun.net" : "https://api.mailgun.net";
}

/**
 * Gmail refuses to send as an address the authenticated account doesn't own — in
 * practice it silently rewrites the From header to the authenticated mailbox.
 * Rather than let that happen invisibly, resolve it here: keep SMTP_FROM's display
 * name, force its address to GMAIL_USER, and hand back a warning to log once.
 * Mailgun has no equivalent single identity to reconcile against — MAILGUN_FROM is
 * used verbatim (and required, see buildMailgunConfig()).
 */
export function resolveFromAddress(env: MailEnv): { from: string; warning?: string } {
  const kind = resolveMailTransportKind(env);
  if (kind === "mailgun") return { from: (env.MAILGUN_FROM ?? "").trim() };

  const configured = (env.SMTP_FROM ?? "").trim();
  if (kind === "smtp") {
    return { from: configured === "" ? DEFAULT_FROM : configured };
  }

  const gmailUser = (env.GMAIL_USER ?? "").trim();
  if (configured === "") return { from: gmailUser };

  const { displayName, address } = parseAddress(configured);
  if (address.toLowerCase() === gmailUser.toLowerCase()) return { from: configured };

  const from = displayName === "" ? gmailUser : `${displayName} <${gmailUser}>`;
  return {
    from,
    warning:
      `SMTP_FROM address "${address}" is not GMAIL_USER "${gmailUser}" — Gmail would rewrite ` +
      `it anyway. Sending as "${from}". Set SMTP_FROM to use ${gmailUser} to silence this.`,
  };
}

function parseAddress(value: string): { displayName: string; address: string } {
  const match = /^\s*(.*?)\s*<([^>]+)>\s*$/.exec(value);
  if (match === null) return { displayName: "", address: value.trim() };
  return { displayName: match[1] ?? "", address: (match[2] ?? "").trim() };
}

/** A human-readable description of the active transport's endpoint, for scripts/logs. */
export function describeMailTransport(env: MailEnv): string {
  const kind = resolveMailTransportKind(env);
  if (kind === "mailgun") {
    const config = buildMailgunConfig(env);
    return `${mailgunBaseUrl(config.region)}/v3/${config.domain}/messages`;
  }
  const options = buildTransportOptions(env);
  return `${options.host}:${options.port}${options.secure === true ? " (TLS)" : ""}`;
}

type MailMessage = { from: string; to: string; subject: string; html: string; text: string };

/** Common surface both backends (nodemailer SMTP/XOAUTH2, Mailgun's HTTP API) implement. */
type MailSender = {
  send(message: MailMessage): Promise<void>;
  verify(): Promise<void>;
};

function createNodemailerSender(options: SMTPTransport.Options): MailSender {
  const transporter = nodemailer.createTransport(options);
  return {
    async send(message) {
      await transporter.sendMail(message);
    },
    async verify() {
      await transporter.verify();
    },
  };
}

function createMailgunSender(config: MailgunConfig): MailSender {
  const baseUrl = mailgunBaseUrl(config.region);
  const authorization = `Basic ${Buffer.from(`api:${config.apiKey}`).toString("base64")}`;

  return {
    async send(message) {
      const form = new FormData();
      form.set("from", message.from);
      form.set("to", message.to);
      form.set("subject", message.subject);
      form.set("html", message.html);
      form.set("text", message.text);
      const response = await fetch(`${baseUrl}/v3/${config.domain}/messages`, {
        method: "POST",
        headers: { authorization },
        body: form,
      });
      if (!response.ok) {
        throw new Error(`Mailgun send failed (${response.status}): ${await response.text()}`);
      }
    },
    async verify() {
      // Mailgun has no SMTP-style handshake to probe; confirm the API key and
      // domain are valid with a lightweight authenticated read instead.
      const response = await fetch(`${baseUrl}/v3/domains/${config.domain}`, {
        headers: { authorization },
      });
      if (!response.ok) {
        throw new Error(
          `Mailgun domain check failed (${response.status}): ${await response.text()}`,
        );
      }
    },
  };
}

type Mailer = { sender: MailSender; from: string };
let mailer: Mailer | null = null;

/**
 * Lazily built, then memoized. Deliberately NOT constructed at import time:
 * lib/auth.ts imports this module, so an import-time throw on a bad mail config
 * would break the whole auth route rather than just the send.
 */
function getMailer(): Mailer {
  if (mailer !== null) return mailer;
  const env = readMailEnv();
  const kind = resolveMailTransportKind(env);
  const { from, warning } = resolveFromAddress(env);
  if (warning !== undefined) console.warn(`[email] ${warning}`);
  const sender =
    kind === "mailgun"
      ? createMailgunSender(buildMailgunConfig(env))
      : createNodemailerSender(buildTransportOptions(env));
  mailer = { sender, from };
  return mailer;
}

/** Verifies the transport is reachable and authenticated, without sending. Used by scripts/send-test-email.mjs. */
export async function verifyMailTransport(): Promise<void> {
  await getMailer().sender.verify();
}

export type AuthEmail =
  | { kind: "magic-link"; to: string; url: string }
  | { kind: "otp"; to: string; otp: string };

export async function sendAuthEmail(email: AuthEmail): Promise<void> {
  const { sender, from } = getMailer();
  const isMagicLink = email.kind === "magic-link";
  const html = isMagicLink ? renderMagicLink({ url: email.url }) : renderOtp({ otp: email.otp });
  try {
    await sender.send({
      from,
      to: email.to,
      subject: isMagicLink ? "Sign in to CV admin" : `CV admin sign-in code: ${email.otp}`,
      html,
      text: isMagicLink
        ? `Sign in to CV admin: ${email.url}`
        : `CV admin sign-in code: ${email.otp}`,
    });
  } catch (error) {
    // Rethrown unchanged so Better Auth's hook behaviour is identical to before;
    // logged because the hook swallows the message into a generic client response
    // and this is otherwise the only trace of a broken mail config. No email body,
    // no OTP, no URL in the log line.
    console.error(`[email] failed to send ${email.kind}`, error);
    throw error;
  }
}
