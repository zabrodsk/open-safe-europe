// Original general drafting template. MIT licensed. Not adapted to national law.
export const TEMPLATE_VERSION = "general-safe-0.1.0";
export const COUNTRIES = [
  "Albania",
  "Andorra",
  "Armenia",
  "Austria",
  "Azerbaijan",
  "Belarus",
  "Belgium",
  "Bosnia and Herzegovina",
  "Bulgaria",
  "Croatia",
  "Cyprus",
  "Czechia",
  "Denmark",
  "Estonia",
  "Finland",
  "France",
  "Georgia",
  "Germany",
  "Greece",
  "Hungary",
  "Iceland",
  "Ireland",
  "Italy",
  "Kosovo",
  "Latvia",
  "Liechtenstein",
  "Lithuania",
  "Luxembourg",
  "Malta",
  "Moldova",
  "Monaco",
  "Montenegro",
  "Netherlands",
  "North Macedonia",
  "Norway",
  "Poland",
  "Portugal",
  "Romania",
  "Russia",
  "San Marino",
  "Serbia",
  "Slovakia",
  "Slovenia",
  "Spain",
  "Sweden",
  "Switzerland",
  "Türkiye",
  "Ukraine",
  "United Kingdom",
  "Vatican City",
  "Other",
];
export const defaults = () => ({
  country: "Czechia",
  company: "",
  entity: "",
  registration: "",
  address: "",
  companySigner: "",
  companyTitle: "Director",
  investor: "",
  investorAddress: "",
  investorSigner: "",
  investment: 250000,
  cap: 5000000,
  currency: "EUR",
  date: new Date().toLocaleDateString("en-CA"),
  paymentDays: 10,
  discount: 0,
  governingLaw: "",
  court: "",
  companyEmail: "",
  investorEmail: "",
  incorporated: "yes",
});
export function money(n, currency) {
  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(Number(n));
}
export function indicativeOwnership(amount, cap) {
  return amount > 0 &&
    cap > amount &&
    Number.isFinite(amount) &&
    Number.isFinite(cap)
    ? (amount / cap) * 100
    : null;
}
export function validate(d) {
  const errors = {};
  for (const k of [
    "company",
    "entity",
    "registration",
    "address",
    "companySigner",
    "investor",
    "investorAddress",
    "investorSigner",
    "governingLaw",
    "court",
  ])
    if (!String(d[k] || "").trim()) errors[k] = "Complete this field.";
  if (!COUNTRIES.includes(d.country)) errors.country = "Choose a jurisdiction.";
  if (d.incorporated !== "yes")
    errors.incorporated =
      "You can prepare a draft now. Incorporation details are needed before a company can enter this agreement.";
  if (!Number.isFinite(Number(d.investment)) || Number(d.investment) <= 0)
    errors.investment = "Enter a positive investment.";
  if (!Number.isFinite(Number(d.cap)) || Number(d.cap) <= Number(d.investment))
    errors.cap = "The cap must exceed this investment.";
  if (!Number.isFinite(Number(d.discount)) || d.discount < 0 || d.discount > 50)
    errors.discount = "Use a discount between 0% and 50%.";
  if (
    !Number.isInteger(Number(d.paymentDays)) ||
    d.paymentDays < 1 ||
    d.paymentDays > 90
  )
    errors.paymentDays = "Choose 1 to 90 days.";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d.date) || Number.isNaN(Date.parse(d.date)))
    errors.date = "Choose a valid date.";
  for (const k of ["companyEmail", "investorEmail"])
    if (d[k] && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d[k]))
      errors[k] = "Enter a valid email or leave blank.";
  return errors;
}
const t = (d, k, label) => String(d[k] || "").trim() || `[${label}]`;
export function generateAgreement(d) {
  const company = t(d, "company", "COMPANY NAME"),
    investor = t(d, "investor", "INVESTOR NAME");
  const amount = money(d.investment || 0, d.currency),
    cap = money(d.cap || 0, d.currency);
  const discount = Number(d.discount) || 0;
  return `SIMPLE AGREEMENT FOR FUTURE EQUITY

Draft date: ${d.date}
Company: ${company}
Investor: ${investor}
Purchase amount: ${amount}
Post-money valuation cap: ${cap}
Discount: ${discount ? discount + "%" : "None"}

DRAFTING STATUS
Original Open SAFE Europe general template, version ${TEMPLATE_VERSION}. Not adapted to the law of ${d.country}. No legal or tax review is claimed. This is an investment agreement draft, not evidence of an executed investment. The parties must resolve all bracketed fields, confirm corporate formalities and review the final text before signing.

PARTIES
${company}, a ${t(d, "entity", "LEGAL ENTITY TYPE")} incorporated in ${d.country}, registration number ${t(d, "registration", "REGISTRATION NUMBER")}, with registered office at ${t(d, "address", "COMPANY ADDRESS")} (the Company); and ${investor}, of ${t(d, "investorAddress", "INVESTOR ADDRESS")} (the Investor).

The parties agree as follows.

1. INVESTMENT
The Investor agrees to pay ${amount} (the Purchase Amount) to the Company within ${d.paymentDays} calendar days after both parties sign this agreement, using payment details separately verified with the Company. The Company grants the Investor the contractual rights set out below in exchange for the Purchase Amount. No current shares or shareholder voting rights are issued by this agreement. Conversion and distribution entitlements arise only after the Company receives the Purchase Amount in full. If it is not received by that deadline, the Company may terminate this agreement by written notice before receiving payment.

2. NATURE OF THE AGREEMENT
This agreement is intended as an investment for future equity and not a loan. No interest accrues and there is no fixed repayment or maturity date. The Purchase Amount is at risk. The parties do not promise any particular legal, tax or accounting classification, which depends on applicable law. The Investor may lose the entire investment.

3. EQUITY FINANCING
An Equity Financing means a bona fide transaction or related series of transactions in which the Company issues shares for new cash at an agreed price per share, excluding the conversion of existing instruments and grants to employees or service providers. At the first Equity Financing after receipt of the Purchase Amount, the parties shall take the steps required by applicable law to apply the Purchase Amount as consideration for Conversion Shares. The number of Conversion Shares equals the Purchase Amount divided by the Conversion Price. No additional cash subscription is due from the Investor for those shares.

The Conversion Price is the lower of (a) the Cap Price and (b) ${discount ? 100 - discount + "% of" : ""} the lowest price per share paid by new cash investors for the principal financing share class in that Equity Financing. The Cap Price equals the Post-money Valuation Cap of ${cap} divided by the Company Capitalization defined in clause 4. Calculations shall use full precision. Any fractional share shall be settled in cash at the Conversion Price unless applicable law requires another method agreed by the parties.

Conversion Shares shall have the same rights as the principal financing share class, except that any per-share liquidation preference, conversion price and dividend amounts derived from the issue price shall be based on the Conversion Price paid under this agreement. If a separate class or further corporate action is required to give effect to those rights, the Company shall seek the necessary approvals. Conversion shall be completed through the approvals, subscriptions, registrations and other formalities required by applicable law; this agreement does not itself bypass them.

The Investor shall sign financing documents on materially the same terms as other investors in that share class, except that its warranties shall be limited to its authority, title and investment capacity and its liability shall be several, not joint, and capped at the Purchase Amount, except for fraud. The Company shall give the Investor the financing documents and calculation supporting conversion before completion.

4. COMPANY CAPITALIZATION
Company Capitalization means the total number of shares immediately before the Equity Financing, calculated on an as-converted, fully diluted basis. It includes issued shares; shares subject to outstanding options, warrants and binding promises to grant equity; the unallocated option pool existing before the financing; and shares issuable on conversion of this agreement and all other converting instruments. It excludes shares issued for new cash in that financing and any increase in the unallocated option pool made in connection with that financing. No share shall be counted twice.

Where the inclusion of converting instruments makes the calculation circular, all conversion prices and share numbers shall be solved simultaneously using the applicable terms of each instrument. The Company shall supply the resulting capitalization schedule. If the terms do not admit a positive, consistent solution, the parties shall agree a written amendment before completing the financing. The simplified ownership calculator provided with this template is not that capitalization schedule.

5. SALE OR OTHER LIQUIDITY EVENT
A Liquidity Event means a sale of more than half of the Company's voting power, a merger after which existing shareholders retain less than half of the voting power, or a sale of substantially all the Company's assets, excluding an internal reorganisation that does not materially change beneficial ownership. Before a Liquidity Event completes, the Investor may elect either (a) a distribution equal to the Purchase Amount or (b) the proceeds it would receive if the Purchase Amount converted into ordinary shares immediately before that event using the Cap Price calculated on the Company Capitalization basis in clause 4, applied to that event. No financing discount applies to that calculation. The Company shall provide the event terms and calculations at least ten calendar days before completion; if the Investor makes no election before completion, option (a) applies. Each option remains subject to clause 6 and applicable law.

6. DISSOLUTION AND PAYMENT PRIORITY
On liquidation, winding up or dissolution before conversion or settlement under clause 5, the Investor is entitled to a distribution of up to the Purchase Amount from assets legally available for that purpose. Any cash entitlement under clause 5(a) or this clause ranks after creditors and statutory claims, equally with other contractual future-equity cash entitlements of equal rank, and before distributions to ordinary shareholders, to the extent permitted by applicable law and existing rights. If available proceeds are insufficient for equal-ranking entitlements, they shall be shared proportionally. Proceeds under clause 5(b) rank with ordinary shares on an as-converted basis, after claims having priority. This agreement cannot alter the rights of third parties or mandatory insolvency priorities.

7. COMPANY UNDERTAKINGS AND STATEMENTS
The Company states that it is duly incorporated, that the person signing is authorised to enter this agreement, and that it has disclosed any existing constitutional or contractual restrictions it knows would prevent performance. It shall maintain accurate capitalization records, use the Purchase Amount for its business, notify the Investor of an anticipated conversion, Liquidity Event or dissolution, and seek all consents and formalities needed to perform this agreement. It does not promise that any future financing or exit will occur. No tax relief is guaranteed.

8. INVESTOR STATEMENTS
The Investor states that it has authority to enter this agreement, understands the possibility of a complete loss and an indefinite holding period, has had the opportunity to obtain independent advice, and is investing for its own account or on behalf of a disclosed principal with authority to do so. The Investor shall provide information reasonably needed to establish its identity and satisfy applicable investment and financial-crime rules. This agreement is a private bilateral investment arrangement and does not authorise a public offering or remove applicable securities restrictions.

9. RIGHTS BEFORE CONVERSION
Before conversion, the Investor has only the contractual rights in this agreement. No board seat, voting right, pro rata participation right, most-favoured-nation right or security interest is granted unless the parties expressly add one in a signed amendment or side letter.

10. TRANSFER AND AMENDMENT
Neither party may transfer this agreement without the other's prior written consent, except that the Company may transfer it as part of an internal reorganisation if the successor assumes all obligations and the Investor's rights are not materially reduced. Changes or waivers require a written agreement signed by both parties. A delay in exercising a right does not waive it.

11. NOTICES AND CONFIDENTIALITY
Notices must be in writing and delivered to the postal addresses above or to these email addresses if provided: Company, ${d.companyEmail || "use the Company postal address above"}; Investor, ${d.investorEmail || "use the Investor postal address above"}. Email notices take effect when acknowledged by the recipient, and postal notices when delivery is recorded. A party may update its notice details by notice. Each party shall keep non-public information received in connection with this agreement confidential, except disclosures required by law or made to professional advisers or prospective financing parties under confidentiality obligations.

12. GOVERNING LAW AND DISPUTES
This agreement is governed by the laws of ${t(d, "governingLaw", "GOVERNING LAW")}. Subject to mandatory jurisdiction rules, the courts of ${t(d, "court", "COURT LOCATION")} shall have exclusive jurisdiction over disputes arising from it. Choosing a governing law does not remove mandatory rules applying to the Company, Investor or transaction.

13. GENERAL
This agreement contains the entire agreement between the parties on its subject, together with any expressly incorporated signed side letters. If a term is unenforceable, the remainder continues to the extent permitted by law and the parties shall seek a lawful replacement with a similar commercial effect. Each party bears its own costs. Counterparts and electronic signatures may be used only to the extent permitted for this transaction under applicable law. This agreement terminates once all conversion shares or distributions due under it have been delivered, without affecting accrued claims or obligations intended to survive.

SIGNATURES

For the Company: ${company}
Name: ${t(d, "companySigner", "AUTHORISED SIGNATORY")}
Title: ${t(d, "companyTitle", "SIGNATORY TITLE")}
Signature: ______________________________
Date: ______________________________

For the Investor: ${investor}
Name: ${t(d, "investorSigner", "INVESTOR SIGNATORY")}
Signature: ______________________________
Date: ______________________________
`;
}
export function fillCustomTemplate(text, d) {
  return text.replace(/\{\{\s*(\w+)\s*\}\}/g, (full, key) =>
    Object.hasOwn(d, key) ? String(d[key]) : full,
  );
}
export function exportText(text, source) {
  return `OPEN SAFE EUROPE | DRAFT\nTemplate source: ${source}\nNot legally reviewed by Open SAFE Europe. Confirm local applicability before signing.\n\n${text}`;
}
