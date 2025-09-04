## Project goal

Build an AI assisted platform that imports Azure DevOps test cases and generates Playwright tests for Canvas Apps, Model Driven Apps, and Power Pages. Execute tests, collect results, and track OpenAI token usage and cost.

## Architecture guardrails

* Monorepo with `frontend`, `backend`, `e2e`, `docs`, `infra`, `.github`.
* Frontend uses React 18, TypeScript, Fluent UI 9.
* Backend uses Node.js, Express, TypeScript, SQLite with better sqlite3.
* Only these external APIs: Azure DevOps REST and OpenAI. No MCP. No GitHub Copilot API.
* Tests use Playwright for end to end, Jest and React Testing Library for unit and component.
* Code coverage target is 80 percent per package. The CI job blocks merges when a package drops below target.

## Repository layout

```
/frontend
/backend
/e2e                 # Playwright specs, fixtures, and page objects
/docs
/infra               # migrations, seed scripts, small CLI helpers
/.github/workflows   # CI pipelines
/.github/copilot     # this file and prompt templates
/database.db         # local dev only
```

## Hard rules for Copilot

* Do not invent APIs, fields, or configuration. When unsure, use a TODO with a link to a tracking issue.
* Prefer minimal diffs. Edit existing files when possible.
* Always include target file paths in responses.
* Generate tests with new logic. A component or service must ship with its test file.
* Fix all TypeScript errors. Avoid `any`. If you must use it for a single line, add a TODO with an issue id.
* No hardcoded credentials. Use environment variables that are validated at startup.
* Fluent UI 9 only.

## Non goals

* No desktop automation or RPA.
* No flows outside Canvas, Model Driven Apps, or Power Pages.
* No MCP. No Copilot API.

## Environment and configuration

Required variables. Validate them on startup and fail fast.

```
ADO_ORG_URL
ADO_PROJECT
ADO_PAT
OPENAI_API_KEY
OPENAI_MODEL
PP_TENANT_ID
PP_ENV_URL
AUTH_MODE            # "service" or "interactive"
COST_CEILING_RUN_USD
```

* Provide a `config/schema.ts` that validates types and ranges and throws on invalid values.
* Never log secrets. Redact values that look like tokens or keys.

## Database schema

SQLite DDL. Use these names and types.

```
CREATE TABLE IF NOT EXISTS test_cases (
  id TEXT PRIMARY KEY,                -- Azure DevOps test case id
  title TEXT NOT NULL,
  area TEXT,
  priority INTEGER,
  last_synced_at TEXT NOT NULL,       -- ISO string
  source_rev TEXT                     -- ETag or revision from ADO
);

CREATE TABLE IF NOT EXISTS test_steps (
  id TEXT PRIMARY KEY,
  case_id TEXT NOT NULL REFERENCES test_cases(id) ON DELETE CASCADE,
  step_index INTEGER NOT NULL,
  action TEXT NOT NULL,
  expected TEXT
);

CREATE TABLE IF NOT EXISTS test_artifacts (
  id TEXT PRIMARY KEY,
  case_id TEXT NOT NULL REFERENCES test_cases(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,                 -- "playwright", "prompt", "analysis"
  path TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS test_runs (
  id TEXT PRIMARY KEY,
  case_id TEXT NOT NULL REFERENCES test_cases(id),
  started_at TEXT NOT NULL,
  finished_at TEXT,
  status TEXT NOT NULL,               -- "passed", "failed", "skipped", "error", "running"
  browser TEXT NOT NULL,              -- "chromium", "firefox", "webkit"
  env TEXT NOT NULL                   -- "dev", "test", "prod like"
);

CREATE TABLE IF NOT EXISTS token_usage (
  id TEXT PRIMARY KEY,
  run_id TEXT REFERENCES test_runs(id),
  model TEXT NOT NULL,
  prompt_tokens INTEGER NOT NULL,
  completion_tokens INTEGER NOT NULL,
  cost_usd REAL NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_token_usage_run ON token_usage(run_id);
```

## API surface and endpoints

* Azure DevOps client must handle pagination, retries with jitter, and 429 backoff.
* Cache ETags and only re sync changed cases.
* Backend endpoints

  * `GET /cases` list synced cases with pagination
  * `POST /generate/:id` create or refresh Playwright spec and page objects for a case
  * `POST /runs/:id/execute` execute a case
  * `GET /runs/:id` fetch run status and artifacts

## OpenAI usage and cost limits

* Use `OPENAI_MODEL` for model selection.
* Enforce a per run cost ceiling with `COST_CEILING_RUN_USD`. When crossed, stop generation and return a clear error that includes model and token counts.
* Track tokens and cost in `token_usage` for each run.
* Strip HTML from ADO steps and sanitize rich text before sending to the model.
* Never send secrets or PATs to the model.

## Selector strategy for Power Platform

Use these rules in order. Add fallbacks when an attribute is missing.

**Canvas Apps**

* Prefer `[data-automation-id="..."]`.
* Fallback to `getByRole` with accessible names.

**Model Driven Apps**

* Prefer `[data-id="..."]` for controls and buttons.
* Inputs can use `input[aria-label="Column Display Name"]`.
* Ribbon buttons may expose `[title="..."]` or `[aria-label="..."]`.
* Dialogs use `role="dialog"`. Wait for the overlay to close before the next action.

**Power Pages**

* Prefer `[data-name="..."]`.
* Use `getByRole` with names for links, buttons, and headings.

**Dynamic content rules**

* Use `await expect(locator).toBeVisible()` before interaction.
* Wait for known spinners to disappear, for example `[data-id="loadingSpinner"]` or `.spinner` when present.
* Use `page.waitForResponse` on save and submit endpoints when stable.

## Authentication and fixtures

* Support two modes

  * `service` uses MSAL and token injection for Dataverse APIs where possible
  * `interactive` uses Playwright to handle the Microsoft login UI
* Store cached session state in `e2e/.auth/{env}.json`.
* Handle screens like Stay signed in and Pick an account by selecting the configured account or pressing Enter.
* Do not capture credentials in videos or traces. Mask screenshots when secrets might appear.

## Anti flakiness rules

* Do not use `waitForTimeout`.
* Use `locator.first()` only when a single match cannot be guaranteed by role and name.
* Wait on network calls that confirm save or submit operations.
* Retry known transient errors with capped backoff. Cap at three attempts.

## Test generation contract

When asked to generate a Playwright test from an Azure DevOps case, follow this contract.

**System template**

```
You generate deterministic Playwright tests for Microsoft Power Platform apps.
Rules:
- Use Page Object Model under /e2e/pageObjects.
- Use selector guidance from INSTRUCTIONS.md.
- Use fixtures from /e2e/fixtures/auth.ts for login.
- No fixed sleeps. Use expect conditions and locator waits.
- Avoid destructive actions unless required by the test case.
- Output one file per case under /e2e/tests/{area}/{caseId}.spec.ts.
- Add a short comment that maps each ADO step to code.
- Use test.step for traceability.
- Fail fast with clear messages that include control labels and data ids.
```

**User payload schema**

```
{
  "case": {
    "id": "12345",
    "title": "Create contact in Model Driven App",
    "area": "Contacts",
    "priority": 2
  },
  "steps": [
    {"index": 1, "action": "Open app", "expected": "App home visible"},
    {"index": 2, "action": "Navigate to Contacts", "expected": "Contacts grid shown"},
    {"index": 3, "action": "New contact: First Name=John, Last Name=Doe", "expected": "Record saved"}
  ],
  "appType": "modelDriven" | "canvas" | "powerPages",
  "data": { "First Name": "John", "Last Name": "Doe" }
}
```

**Expected output**

* One `.spec.ts` content as a fenced code block.
* If a needed page object is missing, include it as a second block under `/e2e/pageObjects/...`.
* Do not create more than two new files in one response. Prefer using existing page objects.

## Page Object Model pattern

* Place page objects under `/e2e/pageObjects/{area}/{name}.ts`.
* Expose semantic actions like `saveRecord`, `openNewForm`, `setField('First Name', 'John')`.
* Hide selectors inside page objects.

## Example outputs

**Playwright spec**

```ts
// File: /e2e/tests/Contacts/12345_Create_contact.spec.ts
import { test, expect } from '@playwright/test';
import { HomePage } from '../../pageObjects/common/HomePage';
import { ContactsPage } from '../../pageObjects/contacts/ContactsPage';

test.describe('Case 12345 Create contact in Model Driven App', () => {
  test('creates a contact', async ({ page }) => {
    const home = new HomePage(page);
    await home.openApp('Customer Service Hub');

    const contacts = new ContactsPage(page);
    await test.step('Open Contacts grid', async () => {
      await contacts.openGrid();
      await expect(contacts.grid).toBeVisible();
    });

    await test.step('Create new contact', async () => {
      await contacts.newContact({ 'First Name': 'John', 'Last Name': 'Doe' });
      await contacts.save();
      await contacts.expectToast('saved');
    });
  });
});
```

**Contacts page object**

```ts
// File: /e2e/pageObjects/contacts/ContactsPage.ts
import { Page, Locator, expect } from '@playwright/test';

export class ContactsPage {
  constructor(private page: Page) {}
  get grid(): Locator { return this.page.locator('[data-id="grid-container"]'); }

  async openGrid() {
    await this.page.getByRole('link', { name: 'Contacts' }).click();
    await expect(this.grid).toBeVisible();
  }

  async newContact(fields: Record<string, string>) {
    await this.page.locator('[data-id="contact|NoRelationship|Form|Mscrm.NewRecord"]').click();
    for (const [label, value] of Object.entries(fields)) {
      await this.page.locator(`input[aria-label="${label}"]`).fill(value);
    }
  }

  async save() {
    await this.page.locator('[data-id="contact|NoRelationship|Form|Mscrm.Form.Save"]').click();
    await this.page.waitForResponse(r => r.url().includes('/api/data/') && r.request().method() === 'PATCH');
  }

  async expectToast(text: string) {
    await expect(this.page.getByRole('status')).toContainText(text);
  }
}
```

## Backend coding standards

* TypeScript strict mode.
* Zod for request validation. Return 400 on invalid input.
* Central error handler that redacts secrets.
* Logger includes request id and user id when available.

## Frontend standards

* Fluent UI 9 components.
* React Query for server data. Local component state for UI only.
* Run history with filters for app type, status, browser, and area.
* Token usage charts and a small trend sparkline per case.

## Testing policy

* Unit tests for services and utilities. Component tests for frontend.
* API tests with Supertest. Mock Azure DevOps and OpenAI.
* End to end tests run in CI on Chromium. A nightly job runs all browsers.
* Coverage threshold is 80 percent per package. CI fails when below.

## CI workflow gates

* Lint, type check, unit tests, build, and e2e smoke on every pull request.
* Coverage uploaded and checked against target. Block when below 80 percent.
* Conventional commits are required. Squash merge only.

**Example GitHub Actions**

```yaml
name: ci
on:
  pull_request:
jobs:
  build-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run lint:all
      - run: npm run typecheck:all
      - run: npm run test:unit --workspaces -- --coverage
      - run: npx playwright install --with-deps
      - run: npm run test:e2e:smoke
      - run: npm run coverage:check
```

## Security requirements

Threats to handle: key leakage in logs, token reuse, prompt injection through Azure DevOps content, SSRF through crafted URLs, and over collection of PII.

Mitigations

* Scrub logs for values that match common key or token patterns and 32 or more alphanumeric characters.
* Restrict outbound HTTP in CI to allowlist for Azure DevOps and OpenAI endpoints.
* Sanitize Azure DevOps HTML in steps before prompt generation.
* Do not echo unreviewed model output that performs network or file operations.

## Docs and issue hygiene

* Keep `docs/architecture.md`, `docs/selectors.md`, `docs/auth.md`, `docs/test-generation.md` up to date.
* Issue templates for bug, feature, and test flakiness. Make fields required.
* Link all TODOs to issue ids.

## Definition of done

* Feature ships with types, tests, docs, and telemetry.
* Playwright tests pass two consecutive CI runs without flakiness.
* Token usage recorded. Cost remains under the run ceiling.
* No TypeScript errors. No skipped tests in CI.
