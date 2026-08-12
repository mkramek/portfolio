import { randomUUID } from "node:crypto";
import { passkey } from "@better-auth/passkey";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { createAuthMiddleware } from "better-auth/api";
import { emailOTP, magicLink } from "better-auth/plugins";
import { prisma } from "@/lib/db";
import { sendAuthEmail } from "@/lib/email";

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
const MAGIC_LINK_PATH = "/sign-in/magic-link";
const OTP_REQUEST_PATH = "/email-otp/send-verification-otp";

function isAdminEmail(email: string): boolean {
  return ADMIN_EMAIL.length > 0 && email.trim().toLowerCase() === ADMIN_EMAIL;
}

async function ensureAdminUser(): Promise<void> {
  await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: {},
    create: {
      id: randomUUID(),
      name: "Admin",
      email: ADMIN_EMAIL,
      emailVerified: false,
    },
  });
}

export const auth = betterAuth({
  appName: "cv",
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: { enabled: false },
  plugins: [
    magicLink({
      disableSignUp: true,
      expiresIn: 600,
      sendMagicLink: async ({ email, url }) => {
        await sendAuthEmail({ kind: "magic-link", to: email, url });
      },
    }),
    emailOTP({
      disableSignUp: true,
      expiresIn: 300,
      otpLength: 6,
      sendVerificationOTP: async ({ email, otp }) => {
        await sendAuthEmail({ kind: "otp", to: email, otp });
      },
    }),
    passkey({
      rpID: process.env.AUTH_RPID ?? "localhost",
      rpName: "CV admin",
      origin: process.env.AUTH_ORIGIN ?? "http://localhost:3000",
    }),
  ],
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      const body = ctx.body as { email?: string; type?: string } | undefined;
      const email = body?.email?.trim();
      if (!email) return;

      if (ctx.path === MAGIC_LINK_PATH) {
        if (!isAdminEmail(email)) return ctx.json({ status: true });
        await ensureAdminUser();
        return;
      }

      if (ctx.path === OTP_REQUEST_PATH && body?.type === "sign-in") {
        if (!isAdminEmail(email)) return ctx.json({ success: true });
        await ensureAdminUser();
        return;
      }
    }),
  },
});
