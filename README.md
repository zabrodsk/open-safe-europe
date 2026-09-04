# Open SAFE Europe

Free, open-source SAFE agreement drafting for European startup founders.

A guided form produces a complete, editable investment agreement. Download Word, PDF or plain text. Drafts stay in your browser, with JSON backup and restore. No account or server is required for core drafting.

## What is included

- Responsive landing page and three-step drafting app.
- European jurisdiction selector, including the UK and Switzerland.
- An original general SAFE template with a post-money cap, optional discount, conversion, liquidity and dissolution provisions, and signature blocks.
- Plain-language form prompts and an indicative dilution calculator.
- Full-text editing, with a warning when edited text falls behind changed form details.
- Word and PDF exports, with embedded Noto Sans for Latin-script names and accents.
- Optional plain-text template uploads with `{{company}}`, `{{investor}}`, `{{country}}`, `{{investment}}`, `{{cap}}` and other form-key substitutions.
- Optional OpenAI clause assistance using the user's own API key. AI suggestions never modify an agreement automatically.

## Template status

**The bundled agreement is a general form, not a country-specific legal product.** Country selection fills in company details. It does not adapt the agreement to national law, certify enforceability, verify investment eligibility or guarantee tax treatment. No legal review or insurance assurance is claimed. The jurisdiction list is geographic coverage of the drafting UI, not permission to transact in any location.

This is actual agreement drafting software. Its output is a draft for the parties to review and complete. The app does not collect signatures, take payments or act as an investment intermediary. A company that has not been incorporated cannot execute an agreement in its own name. Blank details remain visibly bracketed.

The built-in template is original project content under MIT, not a reproduction of YC's SAFE or the linked European reference documents. External templates retain their publishers' rights and are not bundled. User uploads retain their own rights. See `src/agreement.js` for the exact template and version. The project is independent of Y Combinator and the resource publishers.

## Run locally

Requires Node.js 22.12+ or a current Node LTS supported by Vite.

```sh
npm ci
npm run dev
```

Open the local address printed by Vite. To build static files:

```sh
npm run build
npm run preview
```

Deploy `dist/` to Cloudflare Pages or another static host. The app uses relative asset paths. GitHub Actions runs software checks on pushes to main.

```sh
npm run build
npx wrangler pages deploy dist --project-name open-safe-europe --branch main
```

Live site: https://open-safe-europe.pages.dev

Repository: https://github.com/zabrodsk/open-safe-europe

## Privacy and optional AI

There is no analytics, account system, backend database or remote font service. Drafts use this origin's localStorage in the current browser profile. Anyone with access to that profile can read them. Export a backup before changing browser or clearing site data. Delete saved draft clears the app's record; downloaded files are separate.

AI is opt-in. Only the clause pasted into the AI panel and the requested instruction are submitted directly to `api.openai.com`, when the user presses Send. API usage is billed by the provider. The key is held in the page's memory, never included in local draft storage, backups or downloads, and clears on reload or Clear key. Run a trusted self-hosted copy if you use a key. Do not embed an operator key in a public build. Provider retention rules still apply; the request sets `store: false`, which is not a promise of zero retention.

No live AI call is required for drafting or exports. Browser/network restrictions and API model availability can affect optional AI. The model name is editable.

## Development and checks

```sh
npm test
npx playwright install chromium
npm run test:e2e
npm run build
```

Tests cover template output, numeric boundaries, draft editing and persistence, custom templates, export files, responsive layouts and mocked AI requests. Mocked AI tests do not establish live provider availability or legal correctness.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Country-specific contributions need an explicit reuse license and a precise statement of the jurisdiction, entity type, source, version and review status. Never add a legal-review badge without evidence. Do not commit real investment drafts, API keys or investor details.

## License

Code and original general agreement: [MIT](LICENSE). Bundled Noto fonts: [SIL Open Font License 1.1](public/fonts/OFL.txt). Bricolage Grotesque: [SIL Open Font License 1.1](public/fonts/Bricolage-OFL.txt). Dependencies have their own licenses.

## Agent API and skill

Install the skill in your agent project:

```sh
npx skills add zabrodsk/open-safe-europe --skill open-safe-europe
```

The skill includes a Python client. See [the skill instructions](skills/open-safe-europe/SKILL.md). No MCP server is required; agents use the HTTP API directly.

- `GET /api/schema`: field types, supported countries, explicit required terms, template status.
- `POST /api/validate`: returns `valid`, field-level `warnings`, and template status.
- `POST /api/draft`: returns `text`, `warnings`, `source`, `status`, and indicative ownership percentage.
- `POST /api/export`: returns a downloadable Word, PDF or text file.

All POST bodies contain `data`. Export also requires `format`, one of `docx`, `pdf`, `txt`. Optional `template` uses plain text and form-key placeholders. Optional export `text` preserves user edits. Dates use YYYY-MM-DD. Numeric fields must be JSON numbers. The API rejects missing commercial terms rather than adopting the browser's sample values. Missing party details remain visible placeholders and are returned as warnings. Validate and read warnings before exporting.

Example with fictional data and deliberately incomplete party details:

```json
{
  "data": {
    "country": "Czechia",
    "company": "Example company",
    "investment": 250000,
    "cap": 5000000,
    "currency": "EUR",
    "discount": 0,
    "paymentDays": 10,
    "date": "2026-09-05",
    "incorporated": "yes"
  }
}
```

```sh
curl https://open-safe-europe.pages.dev/api/draft \
  -H 'Content-Type: application/json' --data-binary @request.json
python3 skills/open-safe-europe/scripts/client.py export \
  --input request.json --format pdf --output agreement.pdf
```

The public API requires no key. It runs in Cloudflare Pages Functions without an application database or request-body logging. API requests leave the caller's device and are processed by Cloudflare. Browser drafting and downloads continue to run locally and do not call the API. Requests are limited to 256 KiB, individual fields to 4,000 characters, templates and edited text to 60,000 characters. Availability is subject to hosting limits; there is no service-level guarantee. No signatures, messages or payments are performed.

Deploy from the repository root so Wrangler includes `functions/` and its configuration. For local API testing:

```sh
npm run build
npx wrangler pages dev dist --port 8108
```
