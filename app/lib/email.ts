import nodemailer from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";
import { renderMagicLink, renderOtp } from "@/lib/emails";

// Google's current token endpoint. Nodemailer still defaults `accessUrl` to the
// legacy https://accounts.google.com/o/oauth2/token (lib/xoauth2/index.js), so this
// is set explicitly rather than inherited.
const GMAIL_TOKEN_URL = "https://oauth2.googleapis.com/token";
const DEFAULT_FROM = "CV Admin <admin@localhost>";

export type MailTransportKind = "smtp" | "gmail-oauth";

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
  };
}

export function resolveMailTransportKind(env: MailEnv): MailTransportKind {
  const raw = (env.MAIL_TRANSPORT ?? "").trim().toLowerCase();
  if (raw === "" || raw === "smtp") return "smtp";
  if (raw === "gmail-oauth") return "gmail-oauth";
  throw new Error(
    `Invalid MAIL_TRANSPORT ${JSON.stringify(env.MAIL_TRANSPORT)} — expected "smtp" or "gmail-oauth".`,
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
 */
export function buildTransportOptions(env: MailEnv): SMTPTransport.Options {
  if (resolveMailTransportKind(env) === "gmail-oauth") return gmailTransportOptions(env);
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

/**
 * Gmail refuses to send as an address the authenticated account doesn't own — in
 * practice it silently rewrites the From header to the authenticated mailbox.
 * Rather than let that happen invisibly, resolve it here: keep SMTP_FROM's display
 * name, force its address to GMAIL_USER, and hand back a warning to log once.
 */
export function resolveFromAddress(env: MailEnv): { from: string; warning?: string } {
  const configured = (env.SMTP_FROM ?? "").trim();
  if (resolveMailTransportKind(env) === "smtp") {
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

type Mailer = { transporter: nodemailer.Transporter; from: string };
let mailer: Mailer | null = null;

/**
 * Lazily built, then memoized. Deliberately NOT constructed at import time:
 * lib/auth.ts imports this module, so an import-time throw on a bad mail config
 * would break the whole auth route rather than just the send.
 */
function getMailer(): Mailer {
  if (mailer !== null) return mailer;
  const env = readMailEnv();
  const options = buildTransportOptions(env);
  const { from, warning } = resolveFromAddress(env);
  if (warning !== undefined) console.warn(`[email] ${warning}`);
  mailer = { transporter: nodemailer.createTransport(options), from };
  return mailer;
}

/** Opens a connection and authenticates without sending. Used by scripts/send-test-email.mjs. */
export async function verifyMailTransport(): Promise<void> {
  await getMailer().transporter.verify();
}

export type AuthEmail =
  | { kind: "magic-link"; to: string; url: string }
  | { kind: "otp"; to: string; otp: string };

export async function sendAuthEmail(email: AuthEmail): Promise<void> {
  const { transporter, from } = getMailer();
  const isMagicLink = email.kind === "magic-link";
  const html = isMagicLink ? renderMagicLink({ url: email.url }) : renderOtp({ otp: email.otp });
  try {
    await transporter.sendMail({
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
