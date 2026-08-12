// Runs before every bun test file. DB-backed tests opt in via TEST_DATABASE_URL;
// everything else just needs a valid-looking DATABASE_URL so importing lib/db is safe.
if (process.env.TEST_DATABASE_URL) {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
} else {
  process.env.DATABASE_URL ??= "postgresql://cv:cv@localhost:5432/cv_test";
}
