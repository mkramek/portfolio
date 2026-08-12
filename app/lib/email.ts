import nodemailer from "nodemailer";
import { renderMagicLink, renderOtp } from "@/lib/emails";

const transport = nodemailer.createTransport({
  host: process.env.SMTP_HOST ?? "127.0.0.1",
  port: Number(process.env.SMTP_PORT ?? 1025),
  auth: process.env.SMTP_USER
    ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    : undefined,
});

const fromAddress = process.env.SMTP_FROM ?? "CV Admin <admin@localhost>";

export type AuthEmail =
  | { kind: "magic-link"; to: string; url: string }
  | { kind: "otp"; to: string; otp: string };

export async function sendAuthEmail(email: AuthEmail): Promise<void> {
  const isMagicLink = email.kind === "magic-link";
  const html = isMagicLink ? renderMagicLink({ url: email.url }) : renderOtp({ otp: email.otp });
  await transport.sendMail({
    from: fromAddress,
    to: email.to,
    subject: isMagicLink ? "Sign in to CV admin" : `CV admin sign-in code: ${email.otp}`,
    html,
    text: isMagicLink ? `Sign in to CV admin: ${email.url}` : `CV admin sign-in code: ${email.otp}`,
  });
}
