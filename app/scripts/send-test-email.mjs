// Sends one real email through whatever transport MAIL_TRANSPORT selects, using the
// app's own lib/email.ts code path rather than a parallel implementation.
//
//   bun scripts/send-test-email.mjs [recipient@example.com]
//
// Recipient defaults to ADMIN_EMAIL. Loads app/.env; anything already in the real
// environment wins (dotenv does not override by default).

import { randomInt } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadEnv } from "dotenv";

const here = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: join(here, "..", ".env"), quiet: true });

// Dynamic, and relative rather than "@/lib/email.ts": the import has to happen after
// the .env load above, and a relative specifier keeps this script independent of how
// Bun applies tsconfig paths to .mjs files. (lib/email.ts's own "@/lib/emails" import
// resolves normally — that one is .ts-to-.ts inside app/.)
const {
  buildTransportOptions,
  readMailEnv,
  resolveFromAddress,
  resolveMailTransportKind,
  sendAuthEmail,
  verifyMailTransport,
} = await import("../lib/email.ts");

const env = readMailEnv();

let kind;
let options;
try {
  kind = resolveMailTransportKind(env);
  options = buildTransportOptions(env);
} catch (error) {
  console.error(`config    : FAILED\n${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}

const { from, warning } = resolveFromAddress(env);
const to = (process.argv[2] ?? process.env.ADMIN_EMAIL ?? "").trim();
if (to === "") {
  console.error("No recipient — pass one as an argument or set ADMIN_EMAIL.");
  process.exit(1);
}

console.log(`transport : ${kind}`);
console.log(
  `server    : ${options.host}:${options.port}${options.secure === true ? " (TLS)" : ""}`,
);
console.log(`from      : ${from}`);
console.log(`to        : ${to}`);
if (warning !== undefined) console.warn(`warning   : ${warning}`);

try {
  await verifyMailTransport();
  console.log("connect   : ok");
} catch (error) {
  console.error("connect   : FAILED");
  console.error(error);
  process.exit(1);
}

const otp = String(randomInt(100_000, 1_000_000));
try {
  await sendAuthEmail({ kind: "otp", to, otp });
  console.log(`sent      : ok — OTP-shaped test message, code ${otp}`);
} catch (error) {
  console.error("sent      : FAILED");
  console.error(error);
  process.exit(1);
}

// Explicit: a non-pooled nodemailer transport can leave a socket briefly open and
// the process would otherwise linger for a few seconds after a successful send.
process.exit(0);
