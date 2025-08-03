# YellowLetterShop Automated Test Database Setup

This document describes how to set up and maintain an isolated test database environment for the YellowLetterShop project using Supabase, Prisma, dotenv-cli, and Vitest. This setup ensures that automated tests run against a dedicated test database, keeping your development and production data safe and tests reliable.

---

## 1. Test Database Configuration

- **Supabase:**
  - A dedicated test database (e.g., `yls_test`) is provisioned in your Supabase project.
  - The connection string is stored in `.env.test` at the project root. Example:
    ```env
    DATABASE_URL="postgresql://postgres:<password>@db.<project>.supabase.co:5432/yls_test"
    ```
  - **Important:** The password must be URL-encoded if it contains special characters.

---

## 2. Environment Files

- `.env.test` contains the test database connection string and any other environment variables needed for testing.
- **Never overwrite your `.env` file with test credentials.**

---

## 3. Package Scripts (Windows Compatible)

All relevant scripts are defined in `package.json`:

```json
"scripts": {
  "test:prepare": "dotenv -f .env.test -- pnpm prisma migrate deploy && dotenv -f .env.test -- node ./prisma/seed.js",
  "test": "dotenv -f .env.test -- pnpm vitest run",
  "test:all": "pnpm test:prepare && pnpm test"
}
```
- **test:prepare**: Applies all migrations and seeds the test database.
- **test**: Runs all tests using Vitest with the test environment.
- **test:all**: Prepares the test DB and runs the tests in sequence.

---

## 4. Seed Script

- The seed script (`prisma/seed.ts`) is written in TypeScript but compiled to JavaScript (`prisma/seed.js`) for compatibility.
- It seeds essential tables (e.g., `planTier`, `role`) using Prisma's client.
- The script includes logging for debugging and validation.

---

## 5. How to Run Tests

1. **Prepare and run all tests:**
   ```sh
   pnpm test:all
   ```
   This will:
   - Apply migrations to the test DB
   - Seed the test DB
   - Run all Vitest tests

2. **Manual seeding (if needed):**
   ```sh
   dotenv -f .env.test -- node ./prisma/seed.js
   ```

---

## 6. Troubleshooting

- Ensure `.env.test` is correct and points to your test DB.
- If you change your Prisma schema, re-run `pnpm prisma generate` and recompile the seed script if needed.
- If tests fail due to missing data, check the seed script logs for errors or DB connection issues.
- For Windows, always use the `--` syntax with `dotenv-cli` (not `run --`).

---

## 7. CI/CD Integration

- Add the above scripts to your CI pipeline to automate test DB setup and teardown.
- Always use environment-specific `.env` files in your CI configuration.

---

## 8. Security

- Never commit real credentials to source control.
- Keep `.env.test` secure and share it only with trusted team members.

---

## 9. References

- [Prisma Docs: Seeding](https://www.prisma.io/docs/guides/database/seed-database)
- [dotenv-cli GitHub](https://github.com/entropitor/dotenv-cli)
- [Vitest Docs](https://vitest.dev/)

---

This setup ensures safe, reliable, and repeatable automated testing for the YellowLetterShop project. For further questions or changes, update this document accordingly.
