import { COUNTRIES, indicativeOwnership, money } from "./agreement.js";
const $ = (id) => document.getElementById(id);
$("country").replaceChildren(...COUNTRIES.map((c) => new Option(c, c)));
$("country").value = "Czechia";
function countryUpdate() {
  $("countryTag").textContent = "General template · Not locally adapted";
  $("countryTitle").textContent =
    `Draft for a company in ${$("country").value}`;
  $("countryDescription").textContent =
    "Use the original general SAFE, or bring your own template. Country selection changes company details; it does not certify the agreement under local law.";
  $("countryLink").textContent = "Start your agreement ↗";
  $("countryLink").href =
    "./app.html?country=" + encodeURIComponent($("country").value);
  $("countryLink").removeAttribute("target");
}
function calculate() {
  const a = Number($("investment").value),
    c = Number($("cap").value),
    pct = indicativeOwnership(a, c);
  $("useTerms").disabled = pct === null;
  $("calcError").textContent =
    pct === null
      ? "Enter a positive investment and a cap greater than the investment."
      : "";
  $("ownership").textContent = pct === null ? "—" : pct.toFixed(2) + "%";
  $("resultAmount").textContent =
    pct === null
      ? "Check the amounts to see an estimate"
      : `${money(a, $("currency").value)} at a ${money(c, $("currency").value)} cap`;
  $("ownershipBar").style.width = (pct || 0) + "%";
  $("investorLegend").textContent =
    "SAFE investor" + (pct === null ? "" : ` · ${pct.toFixed(2)}%`);
  $("existingLegend").textContent =
    "Existing holders" + (pct === null ? "" : ` · ${(100 - pct).toFixed(2)}%`);
}
function start(useTerms = false) {
  const q = new URLSearchParams({ country: $("country").value });
  if (useTerms) {
    q.set("investment", $("investment").value);
    q.set("cap", $("cap").value);
    q.set("currency", $("currency").value);
  }
  location.href = "./app.html?" + q;
}
document
  .querySelectorAll("[data-open]")
  .forEach((b) => b.addEventListener("click", () => start()));
$("useTerms").addEventListener("click", () => start(true));
$("country").addEventListener("change", countryUpdate);
["investment", "cap", "currency"].forEach((id) =>
  $(id).addEventListener("input", calculate),
);
countryUpdate();
calculate();
