import type { Page } from "@playwright/test";
import { ADMIN_EMAIL } from "./env";
import { deleteAllMail, extractOtp, extractUrl, type MailpitMessage, waitForMail } from "./mailpit";

export const AUTH_STATE_PATH = "e2e/.auth/admin.json";

async function clickUntilEmail(
  click: () => Promise<void>,
  predicate: (message: MailpitMessage) => boolean,
): Promise<MailpitMessage> {
  for (let attempt = 0; attempt < 5; attempt++) {
    await click();
    try {
      return await waitForMail(predicate, 10_000);
    } catch {
      // dev server may still be compiling on first request; click again
    }
  }
  throw new Error("No sign-in email received in Mailpit");
}

export async function requestOtpAndSubmit(page: Page, email = ADMIN_EMAIL): Promise<void> {
  await deleteAllMail();
  await page.fill('input[type="email"]', email);
  const message = await clickUntilEmail(
    () => page.getByRole("button", { name: "Send code" }).click(),
    (m) => /sign-in code/i.test(m.Subject ?? ""),
  );
  const otp = extractOtp(message.Subject ?? "");
  await page.fill('input[autocomplete="one-time-code"]', otp);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
}

export async function requestMagicLinkAndSubmit(page: Page, email = ADMIN_EMAIL): Promise<void> {
  await deleteAllMail();
  await page.fill('input[type="email"]', email);
  const message = await clickUntilEmail(
    () => page.getByRole("button", { name: "Send magic link" }).click(),
    (m) => /sign in/i.test(m.Subject ?? ""),
  );
  const url = extractUrl(message.Text ?? message.HTML ?? "");
  await page.goto(url);
}
