import test from "node:test";
import assert from "node:assert/strict";
import {
  defaults,
  generateAgreement,
  validate,
  indicativeOwnership,
  fillCustomTemplate,
  exportText,
  COUNTRIES,
} from "../src/agreement.js";
test("ownership boundaries are explicit", () => {
  assert.equal(indicativeOwnership(250000, 5000000), 5);
  for (const [a, c] of [
    [0, 1],
    [-1, 100],
    [100, 100],
    [101, 100],
    [Infinity, Infinity],
  ])
    assert.equal(indicativeOwnership(a, c), null);
});
test("agreement contains operative terms and clear general source", () => {
  const d = {
    ...defaults(),
    company: "Žlutý Projekt s.r.o.",
    country: "Czechia",
    discount: 20,
    governingLaw: "Czech Republic",
    court: "Prague",
  };
  const text = generateAgreement(d);
  for (const phrase of [
    "Žlutý Projekt s.r.o.",
    "80% of",
    "Company Capitalization",
    "SIGNATURES",
    "Not adapted to the law of Czechia",
    "No interest accrues",
    "courts of Prague",
  ])
    assert.ok(text.includes(phrase), phrase);
  assert.ok(!text.includes("undefined"));
});
test("incomplete party data remains visible and no fake company is inserted", () => {
  const text = generateAgreement(defaults());
  assert.ok(text.includes("[COMPANY NAME]"));
  assert.ok(text.includes("[REGISTRATION NUMBER]"));
  assert.ok(Object.keys(validate(defaults())).length > 0);
});
test("invalid terms cannot be treated as valid", () => {
  for (const investment of [0, -100, NaN, Infinity])
    assert.ok(validate({ ...defaults(), investment }).investment);
  assert.ok(validate({ ...defaults(), discount: 51 }).discount);
  assert.ok(validate({ ...defaults(), paymentDays: 1.5 }).paymentDays);
  assert.ok(validate({ ...defaults(), cap: 100 }).cap);
});
test("uploaded substitution preserves unknown placeholders and literal user text", () => {
  assert.equal(
    fillCustomTemplate("{{company}} - {{unknown}}", {
      company: "<script>x</script>",
    }),
    "<script>x</script> - {{unknown}}",
  );
});
test("Europe-wide country list has no duplicates and includes non-EU countries", () => {
  assert.equal(new Set(COUNTRIES).size, COUNTRIES.length);
  for (const c of [
    "Czechia",
    "United Kingdom",
    "Switzerland",
    "Ukraine",
    "Norway",
  ])
    assert.ok(COUNTRIES.includes(c));
});
test("export wrapper retains provenance even for fully edited text", () => {
  const text = exportText("My text", "Uploaded form.txt");
  assert.ok(text.includes("Uploaded form.txt"));
  assert.ok(text.includes("Not legally reviewed"));
  assert.ok(text.endsWith("My text"));
});
