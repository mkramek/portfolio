import { MAILPIT_URL } from "./env";

export type MailpitMessage = {
  ID: string;
  Subject?: string;
  To?: unknown;
  Text?: string;
  HTML?: string;
};

export async function deleteAllMail(): Promise<void> {
  await fetch(`${MAILPIT_URL}/api/v1/messages`, { method: "DELETE" });
}

async function latestMessage(): Promise<MailpitMessage | null> {
  const list = await fetch(`${MAILPIT_URL}/api/v1/messages`);
  if (!list.ok) return null;
  const data = (await list.json()) as { messages: Array<{ ID: string }> };
  const first = data.messages[0];
  if (!first) return null;
  const detail = await fetch(`${MAILPIT_URL}/api/v1/message/${first.ID}`);
  if (!detail.ok) return null;
  return (await detail.json()) as MailpitMessage;
}

export async function waitForMail(
  predicate: (message: MailpitMessage) => boolean,
  timeout = 20_000,
): Promise<MailpitMessage> {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    const message = await latestMessage();
    if (message && predicate(message)) return message;
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  throw new Error("Timed out waiting for email in Mailpit");
}

export function extractOtp(subject: string): string {
  const match = /\b(\d{6})\b/.exec(subject);
  if (!match) throw new Error(`No 6-digit OTP found in subject: ${subject}`);
  return match[1];
}

export function extractUrl(text: string): string {
  const match = /(https?:\/\/[^\s"'<>]+)/.exec(text);
  if (!match) throw new Error(`No URL found in email text: ${text}`);
  return match[1];
}
