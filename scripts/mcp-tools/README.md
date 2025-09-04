# MCP Tools Test Scripts

This folder contains simple scripts to verify environment variables and MCP-related connectivity.

## Files

- `test-env.js` — Loads `.env` and prints whether required API keys are present.
- `test-env-debug.js` — Prints diagnostic info (presence and contents of `.env`, which env vars are set).
- `verify-env.js` — Validates required variables and prints a recommended `mcp_config.json` snippet.
- `simple-test.js` — Minimal check that `.env` loads and prints the start of `BRAVE_API_KEY`.

## Usage

Run any script from the project root:

```powershell
node scripts/mcp-tools/test-env.js
node scripts/mcp-tools/test-env-debug.js
node scripts/mcp-tools/verify-env.js
node scripts/mcp-tools/simple-test.js
```

If a script reports missing keys, update your `.env`, restart the IDE, and re-run.

## Notes

- Keep `.env` out of version control.
- For Windsurf MCP, `mcp_config.json` reads env via `${VAR_NAME}`. Ensure your IDE restarts after changing `.env`.
