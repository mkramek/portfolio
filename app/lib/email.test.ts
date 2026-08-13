import { describe, expect, test } from "bun:test";
import {
  buildMailgunConfig,
  buildTransportOptions,
  describeMailTransport,
  type MailEnv,
  readMailEnv,
  resolveFromAddress,
  resolveMailTransportKind,
} from "./email";

describe("resolveMailTransportKind", () => {
  test("defaults to smtp when unset", () => {
    expect(resolveMailTransportKind({})).toBe("smtp");
  });

  test("defaults to smtp when empty", () => {
    expect(resolveMailTransportKind({ MAIL_TRANSPORT: "" })).toBe("smtp");
  });

  test("accepts gmail-oauth, trimmed and case-insensitive", () => {
    expect(resolveMailTransportKind({ MAIL_TRANSPORT: "  GMAIL-OAUTH " })).toBe("gmail-oauth");
  });

  test("accepts mailgun, trimmed and case-insensitive", () => {
    expect(resolveMailTransportKind({ MAIL_TRANSPORT: " Mailgun " })).toBe("mailgun");
  });

  test("rejects an unknown value, naming it and all valid options", () => {
    expect(() => resolveMailTransportKind({ MAIL_TRANSPORT: "sendgrid" })).toThrow(
      /sendgrid.*smtp.*gmail-oauth.*mailgun/,
    );
  });
});

describe("buildTransportOptions — smtp", () => {
  test("defaults to 127.0.0.1:1025 with no auth", () => {
    expect(buildTransportOptions({})).toEqual({
      host: "127.0.0.1",
      port: 1025,
      auth: undefined,
    });
  });

  test("honours host/port/user/pass", () => {
    const options = buildTransportOptions({
      SMTP_HOST: "mail.example.com",
      SMTP_PORT: "587",
      SMTP_USER: "u",
      SMTP_PASS: "p",
    });
    expect(options).toEqual({
      host: "mail.example.com",
      port: 587,
      auth: { user: "u", pass: "p" },
    });
  });

  test("empty SMTP_USER means no auth", () => {
    const options = buildTransportOptions({ SMTP_USER: "" });
    expect(options.auth).toBeUndefined();
  });

  test("explicit MAIL_TRANSPORT=smtp matches the unset default", () => {
    expect(buildTransportOptions({ MAIL_TRANSPORT: "smtp" })).toEqual(buildTransportOptions({}));
  });
});

const GMAIL_ENV: MailEnv = {
  MAIL_TRANSPORT: "gmail-oauth",
  GMAIL_USER: "me@gmail.com",
  GMAIL_CLIENT_ID: "client-id",
  GMAIL_CLIENT_SECRET: "client-secret",
  GMAIL_REFRESH_TOKEN: "refresh-token",
};

describe("buildTransportOptions — gmail-oauth", () => {
  test("builds a full XOAUTH2 config", () => {
    const options = buildTransportOptions(GMAIL_ENV);
    expect(options).toEqual({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        type: "OAuth2",
        user: "me@gmail.com",
        clientId: "client-id",
        clientSecret: "client-secret",
        refreshToken: "refresh-token",
        accessUrl: "https://oauth2.googleapis.com/token",
      },
    });
  });

  test("throws naming a single missing var", () => {
    const env = { ...GMAIL_ENV, GMAIL_REFRESH_TOKEN: undefined };
    expect(() => buildTransportOptions(env)).toThrow(/GMAIL_REFRESH_TOKEN/);
    expect(() => buildTransportOptions(env)).not.toThrow(/GMAIL_USER/);
  });

  test("throws naming all missing vars", () => {
    const env = { ...GMAIL_ENV, GMAIL_CLIENT_ID: undefined, GMAIL_REFRESH_TOKEN: undefined };
    expect(() => buildTransportOptions(env)).toThrow(/GMAIL_CLIENT_ID.*GMAIL_REFRESH_TOKEN/);
  });

  test("whitespace-only value counts as missing", () => {
    const env = { ...GMAIL_ENV, GMAIL_CLIENT_SECRET: "   " };
    expect(() => buildTransportOptions(env)).toThrow(/GMAIL_CLIENT_SECRET/);
  });

  test("does not silently fall back to a Mailpit-shaped config", () => {
    const env: MailEnv = {
      MAIL_TRANSPORT: "gmail-oauth",
      SMTP_HOST: "127.0.0.1",
      SMTP_PORT: "1025",
    };
    expect(() => buildTransportOptions(env)).toThrow();
  });

  test("refuses to build SMTP options for mailgun", () => {
    expect(() => buildTransportOptions({ MAIL_TRANSPORT: "mailgun" })).toThrow(
      /buildMailgunConfig/,
    );
  });
});

const MAILGUN_ENV: MailEnv = {
  MAIL_TRANSPORT: "mailgun",
  MAILGUN_API_KEY: "key-abc",
  MAILGUN_DOMAIN: "mg.example.com",
  MAILGUN_FROM: "CV Admin <admin@mg.example.com>",
};

describe("buildMailgunConfig", () => {
  test("builds a full config, defaulting region to us", () => {
    expect(buildMailgunConfig(MAILGUN_ENV)).toEqual({
      apiKey: "key-abc",
      domain: "mg.example.com",
      from: "CV Admin <admin@mg.example.com>",
      region: "us",
    });
  });

  test("honours an explicit eu region, trimmed and case-insensitive", () => {
    const env = { ...MAILGUN_ENV, MAILGUN_REGION: " EU " };
    expect(buildMailgunConfig(env).region).toBe("eu");
  });

  test("rejects an invalid region", () => {
    const env = { ...MAILGUN_ENV, MAILGUN_REGION: "asia" };
    expect(() => buildMailgunConfig(env)).toThrow(/asia.*us.*eu/);
  });

  test("throws naming a single missing var", () => {
    const env = { ...MAILGUN_ENV, MAILGUN_FROM: undefined };
    expect(() => buildMailgunConfig(env)).toThrow(/MAILGUN_FROM/);
    expect(() => buildMailgunConfig(env)).not.toThrow(/MAILGUN_DOMAIN/);
  });

  test("throws naming all missing vars", () => {
    const env = { ...MAILGUN_ENV, MAILGUN_API_KEY: undefined, MAILGUN_FROM: undefined };
    expect(() => buildMailgunConfig(env)).toThrow(/MAILGUN_API_KEY.*MAILGUN_FROM/);
  });

  test("whitespace-only value counts as missing", () => {
    const env = { ...MAILGUN_ENV, MAILGUN_DOMAIN: "   " };
    expect(() => buildMailgunConfig(env)).toThrow(/MAILGUN_DOMAIN/);
  });

  test("does not silently fall back to a Mailpit-shaped config", () => {
    const env: MailEnv = {
      MAIL_TRANSPORT: "mailgun",
      SMTP_HOST: "127.0.0.1",
      SMTP_PORT: "1025",
    };
    expect(() => buildMailgunConfig(env)).toThrow();
  });

  test("refuses to build when the transport kind is not mailgun", () => {
    expect(() => buildMailgunConfig({})).toThrow(/MAIL_TRANSPORT=mailgun/);
  });
});

describe("resolveFromAddress", () => {
  test("smtp default when SMTP_FROM is unset", () => {
    expect(resolveFromAddress({})).toEqual({ from: "CV Admin <admin@localhost>" });
  });

  test("smtp passes SMTP_FROM through verbatim", () => {
    expect(resolveFromAddress({ SMTP_FROM: "CV Admin <admin@cv.dev>" })).toEqual({
      from: "CV Admin <admin@cv.dev>",
    });
  });

  test("gmail defaults from to GMAIL_USER when SMTP_FROM is unset", () => {
    expect(resolveFromAddress(GMAIL_ENV)).toEqual({ from: "me@gmail.com" });
  });

  test("gmail keeps a matching SMTP_FROM as-is, case-insensitively, no warning", () => {
    const env = { ...GMAIL_ENV, SMTP_FROM: "CV Admin <Me@Gmail.com>" };
    expect(resolveFromAddress(env)).toEqual({ from: "CV Admin <Me@Gmail.com>" });
  });

  test("gmail overrides a mismatched SMTP_FROM address, keeping the display name, with a warning", () => {
    const env = { ...GMAIL_ENV, SMTP_FROM: "CV Admin <admin@cv.dev>" };
    const result = resolveFromAddress(env);
    expect(result.from).toBe("CV Admin <me@gmail.com>");
    expect(result.warning).toMatch(/admin@cv.dev/);
    expect(result.warning).toMatch(/me@gmail.com/);
  });

  test("gmail overrides a bare mismatched SMTP_FROM without an empty display name", () => {
    const env = { ...GMAIL_ENV, SMTP_FROM: "admin@cv.dev" };
    const result = resolveFromAddress(env);
    expect(result.from).toBe("me@gmail.com");
    expect(result.warning).toBeDefined();
  });

  test("mailgun uses MAILGUN_FROM verbatim, no warning", () => {
    expect(resolveFromAddress(MAILGUN_ENV)).toEqual({
      from: "CV Admin <admin@mg.example.com>",
    });
  });
});

describe("describeMailTransport", () => {
  test("smtp", () => {
    expect(describeMailTransport({ SMTP_HOST: "mail.example.com", SMTP_PORT: "587" })).toBe(
      "mail.example.com:587",
    );
  });

  test("gmail-oauth includes TLS", () => {
    expect(describeMailTransport(GMAIL_ENV)).toBe("smtp.gmail.com:465 (TLS)");
  });

  test("mailgun describes the HTTP API endpoint, region-aware", () => {
    expect(describeMailTransport(MAILGUN_ENV)).toBe(
      "https://api.mailgun.net/v3/mg.example.com/messages",
    );
    expect(describeMailTransport({ ...MAILGUN_ENV, MAILGUN_REGION: "eu" })).toBe(
      "https://api.eu.mailgun.net/v3/mg.example.com/messages",
    );
  });
});

describe("readMailEnv", () => {
  test("copies only the known mail keys", () => {
    const source = {
      MAIL_TRANSPORT: "smtp",
      SMTP_HOST: "host",
      SMTP_PORT: "25",
      SMTP_USER: "u",
      SMTP_PASS: "p",
      SMTP_FROM: "from",
      GMAIL_USER: "gu",
      GMAIL_CLIENT_ID: "gci",
      GMAIL_CLIENT_SECRET: "gcs",
      GMAIL_REFRESH_TOKEN: "grt",
      MAILGUN_API_KEY: "mgk",
      MAILGUN_DOMAIN: "mgd",
      MAILGUN_FROM: "mgf",
      MAILGUN_REGION: "eu",
      UNRELATED_VAR: "ignore-me",
    } as unknown as NodeJS.ProcessEnv;

    expect(readMailEnv(source)).toEqual({
      MAIL_TRANSPORT: "smtp",
      SMTP_HOST: "host",
      SMTP_PORT: "25",
      SMTP_USER: "u",
      SMTP_PASS: "p",
      SMTP_FROM: "from",
      GMAIL_USER: "gu",
      GMAIL_CLIENT_ID: "gci",
      GMAIL_CLIENT_SECRET: "gcs",
      GMAIL_REFRESH_TOKEN: "grt",
      MAILGUN_API_KEY: "mgk",
      MAILGUN_DOMAIN: "mgd",
      MAILGUN_FROM: "mgf",
      MAILGUN_REGION: "eu",
    });
  });
});
