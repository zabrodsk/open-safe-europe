import { test, expect } from "@playwright/test";
import fs from "node:fs/promises";
test("landing calculator and handoff preserve terms", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#ownership")).toHaveText("5.00%");
  await page.locator("#investment").fill("500000");
  await expect(page.locator("#ownership")).toHaveText("10.00%");
  await page.locator("#useTerms").click();
  await expect(page).toHaveURL(/app.html$/);
  await page.locator('[data-step="1"]').click();
  await expect(page.locator("#investment")).toHaveValue("500000");
});
test("draft survives reload and edited text is not silently replaced", async ({
  page,
}) => {
  await page.goto("/app.html");
  await page.locator("#company").fill("Žlutý Projekt s.r.o.");
  await page.locator('[data-step="2"]').click();
  await expect(page.locator("#editor")).toHaveValue(/Žlutý Projekt/);
  await page.locator("#editor").fill("My edited agreement");
  await page.locator('[data-step="1"]').click();
  await page.locator("#cap").fill("6000000");
  await page.locator('[data-step="2"]').click();
  await expect(page.locator("#staleNotice")).toBeVisible();
  await expect(page.locator("#editor")).toHaveValue("My edited agreement");
  await page.reload();
  await expect(page.locator("#editor")).toHaveValue("My edited agreement");
});
test("Word and PDF exports contain real file formats", async ({ page }) => {
  await page.goto("/app.html");
  await page.locator("#company").fill("Žlutý Projekt s.r.o.");
  await page.locator('[data-step="2"]').click();
  for (const [id, name, signature] of [
    ["downloadWord", "open-safe-europe-agreement.docx", "PK"],
    ["downloadPdf", "open-safe-europe-agreement.pdf", "%PDF"],
  ]) {
    const wait = page.waitForEvent("download");
    await page.locator("#" + id).click();
    const dl = await wait;
    expect(dl.suggestedFilename()).toBe(name);
    const data = await fs.readFile(await dl.path());
    expect(data.subarray(0, signature.length).toString()).toBe(signature);
    expect(data.length).toBeGreaterThan(1000);
  }
});
test("invalid financial terms block export with explanation", async ({
  page,
}) => {
  await page.goto("/app.html");
  await page.locator('[data-step="1"]').click();
  await page.locator("#investment").fill("-1");
  await page.locator('[data-step="2"]').click();
  await page.locator("#downloadWord").click();
  await expect(page.locator("#exportStatus")).toContainText(
    "positive investment",
  );
});
test("custom template upload fills only supported placeholders and renders text safely", async ({
  page,
}) => {
  await page.goto("/app.html");
  await page.locator("#company").fill("<img src=x onerror=alert(1)>");
  await page.locator('[data-step="2"]').click();
  page.on("dialog", (d) => d.accept());
  await page.locator("#templateFile").setInputFiles({
    name: "my-template.txt",
    mimeType: "text/plain",
    buffer: Buffer.from(
      "AGREEMENT\nCompany {{company}}\nAmount {{investment}}\n{{unknown}}",
    ),
  });
  await expect(page.locator("#editor")).toHaveValue(
    /<img src=x onerror=alert\(1\)>/,
  );
  await expect(page.locator("#editor")).toHaveValue(/\{\{unknown\}\}/);
  await expect(page.locator("#sourceTitle")).toContainText("my-template.txt");
  await expect(page.locator("img:not(.brand-symbol)")).toHaveCount(0);
  await expect(page.locator(".brand-symbol")).toHaveAttribute(
    "src",
    "./logo.svg",
  );
});
test("AI sends only explicitly selected text; key is not saved or backed up", async ({
  page,
}) => {
  await page.goto("/app.html");
  await page.locator("#company").fill("PRIVATE COMPANY NAME");
  await page.locator('[data-step="2"]').click();
  await page.getByText("Ask AI about a clause", { exact: false }).click();
  await page.locator("#apiKey").fill("test-key-not-real");
  await page.locator("#aiClause").fill("The investor pays later.");
  await page.locator("#aiInstruction").fill("Explain this");
  let body;
  await page.route("https://api.openai.com/v1/responses", async (route) => {
    body = route.request().postDataJSON();
    await route.fulfill({
      json: {
        output: [
          {
            content: [
              { type: "output_text", text: "This sets the payment timing." },
            ],
          },
        ],
      },
    });
  });
  await page.locator("#askAi").click();
  await expect(page.locator("#aiAnswer")).toHaveValue(
    "This sets the payment timing.",
  );
  expect(JSON.stringify(body)).not.toContain("PRIVATE COMPANY");
  expect(body.store).toBe(false);
  const storage = await page.evaluate(() => JSON.stringify(localStorage));
  expect(storage).not.toContain("test-key-not-real");
  const wait = page.waitForEvent("download");
  await page.locator("#backup").click();
  const data = await fs.readFile(await (await wait).path(), "utf8");
  expect(data).not.toContain("test-key-not-real");
  await page.reload();
  await expect(page.locator("#apiKey")).toHaveValue("");
});
test("deleting draft removes persisted company and does not instantly resave", async ({
  page,
}) => {
  await page.goto("/app.html");
  await page.locator("#company").fill("Delete Me");
  page.on("dialog", (d) => d.accept());
  await page.locator("#deleteDraft").click();
  expect(
    await page.evaluate(() =>
      localStorage.getItem("open-safe-europe.draft.v1"),
    ),
  ).toBeNull();
  await expect(page.locator("#company")).toHaveValue("");
});
test("mobile pages have no horizontal overflow or missing fonts", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const failures = [];
  page.on("response", (r) => {
    if (r.status() >= 400) failures.push(r.url());
  });
  for (const path of ["/", "/app.html"]) {
    await page.goto(path);
    await page.evaluate(() => document.fonts.ready);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  expect(failures).toEqual([]);
});
test("backup restore returns edited text and strips unrecognized fields", async ({
  page,
}) => {
  await page.goto("/app.html");
  await page.locator("#company").fill("Restorable company");
  await page.locator('[data-step="2"]').click();
  await page.locator("#editor").fill("Restorable edited agreement");
  const wait = page.waitForEvent("download");
  await page.locator("#backup").click();
  const saved = JSON.parse(
    await fs.readFile(await (await wait).path(), "utf8"),
  );
  saved.apiKey = "not-a-real-secret";
  page.on("dialog", (d) => d.accept());
  await page.locator("#newDraft").click();
  await page.locator("#restore").setInputFiles({
    name: "backup.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(saved)),
  });
  await expect(page.locator("#editor")).toHaveValue(
    "Restorable edited agreement",
  );
  expect(await page.evaluate(() => JSON.stringify(localStorage))).not.toContain(
    "not-a-real-secret",
  );
});

test("agent connection copies the skill link and offers a fallback", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(() =>
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async (text) => {
          window.copiedSkill = text;
        },
      },
    }),
  );
  await expect(
    page.getByRole("button", { name: "Copy skill link" }),
  ).toBeVisible();
  await page.locator(".agent-connect-row").hover();
  await expect(page.locator(".agent-link-preview")).toBeVisible();
  await page.getByRole("button", { name: "Copy skill link" }).click();
  await expect(page.locator("#copyStatus")).toHaveText("Skill link copied");
  expect(await page.evaluate(() => window.copiedSkill)).toBe(
    "https://skills.sh/zabrodsk/open-safe-europe/open-safe-europe",
  );
  await page.evaluate(() =>
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async () => {
          throw new Error("Permission denied");
        },
      },
    }),
  );
  await page.getByRole("button", { name: "Copy skill link" }).click();
  await expect(page.locator("#skillLink")).toBeVisible();
  await expect(page.locator("#skillLink")).toBeFocused();
  await expect(page.locator(".github-link")).toHaveAttribute(
    "href",
    "https://github.com/zabrodsk/open-safe-europe",
  );
});
