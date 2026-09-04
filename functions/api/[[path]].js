import {
  defaults,
  COUNTRIES,
  TEMPLATE_VERSION,
  validate,
  generateAgreement,
  fillCustomTemplate,
  exportText,
  indicativeOwnership,
} from "../../src/agreement.js";
import { wordBlob, pdfBlob } from "../../src/export.js";
const status =
  "General form. Not adapted to national law. No legal review or insurance assurance claimed.";
const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
};
const json = (body, code = 200) =>
  new Response(JSON.stringify(body), {
    status: code,
    headers: { ...headers, "Content-Type": "application/json" },
  });
export async function onRequest({ request, env }) {
  const path = new URL(request.url).pathname.replace(/\/$/, "");
  if (request.method === "OPTIONS")
    return new Response(null, { status: 204, headers });
  if (request.method === "GET" && ["/api", "/api/schema"].includes(path))
    return json({
      version: 1,
      template: TEMPLATE_VERSION,
      status,
      fields: Object.fromEntries(
        Object.entries(defaults()).map(([key, value]) => [
          key,
          { type: typeof value },
        ]),
      ),
      countries: COUNTRIES,
      requiredTerms: [
        "country",
        "investment",
        "cap",
        "currency",
        "discount",
        "paymentDays",
        "date",
        "incorporated",
      ],
      endpoints: ["/api/draft", "/api/validate", "/api/export"],
      formats: ["txt", "docx", "pdf"],
      privacy:
        "Stateless application. Requests are processed by Cloudflare. No application database or request-body logging.",
    });
  if (!["/api/draft", "/api/validate", "/api/export"].includes(path))
    return json({ error: "Endpoint not found." }, 404);
  if (request.method !== "POST") return json({ error: "Use POST." }, 405);
  try {
    if (!request.headers.get("content-type")?.includes("application/json"))
      return json({ error: "Use application/json." }, 415);
    const reader = request.body?.getReader();
    if (!reader) return json({ error: "JSON body required." }, 400);
    let length = 0;
    const chunks = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.length;
      if (length > 262144) {
        await reader.cancel();
        return json({ error: "Body exceeds 256 KiB." }, 413);
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(length);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.length;
    }
    let body;
    try {
      body = JSON.parse(new TextDecoder().decode(bytes));
    } catch {
      return json({ error: "Invalid JSON." }, 400);
    }
    if (
      !body ||
      !body.data ||
      typeof body.data !== "object" ||
      Array.isArray(body.data)
    )
      return json({ error: "Provide a data object." }, 400);
    const data = defaults();
    for (const key of Object.keys(data)) {
      if (Object.hasOwn(body.data, key)) {
        const value = body.data[key];
        if (
          typeof value !== typeof data[key] ||
          (typeof value === "string" && value.length > 4000)
        )
          return json({ error: `Invalid field: ${key}` }, 400);
        data[key] = value;
      } else if (typeof data[key] === "string") data[key] = "";
    }
    const missing = [
      "country",
      "investment",
      "cap",
      "currency",
      "discount",
      "paymentDays",
      "date",
      "incorporated",
    ].filter((key) => !Object.hasOwn(body.data, key));
    if (missing.length)
      return json(
        {
          error: "Explicit terms required. No commercial terms are assumed.",
          fields: missing,
        },
        422,
      );
    if (!/^[A-Z]{3}$/.test(data.currency))
      return json({ error: "Use a three-letter currency code." }, 422);
    const warnings = validate(data);
    if (path === "/api/validate")
      return json({
        valid: Object.keys(warnings).length === 0,
        warnings,
        status,
      });
    const blocking = [
      "investment",
      "cap",
      "discount",
      "paymentDays",
      "country",
      "date",
    ].filter((key) => warnings[key]);
    if (blocking.length)
      return json({ error: "Correct invalid terms.", warnings }, 422);
    if (
      body.template !== undefined &&
      (typeof body.template !== "string" || body.template.length > 60000)
    )
      return json(
        { error: "Template must be text up to 60000 characters." },
        400,
      );
    const source = body.template
      ? "User-supplied template. Review status unverified."
      : TEMPLATE_VERSION;
    const text = body.template
      ? fillCustomTemplate(body.template, data)
      : generateAgreement(data);
    if (path === "/api/draft")
      return json({
        text,
        warnings,
        source,
        status,
        indicativeOwnership: indicativeOwnership(data.investment, data.cap),
      });
    if (!["txt", "docx", "pdf"].includes(body.format))
      return json({ error: "Choose txt, docx or pdf." }, 400);
    if (
      body.text !== undefined &&
      (typeof body.text !== "string" ||
        !body.text.trim() ||
        body.text.length > 60000)
    )
      return json(
        { error: "Edited text must contain 1 to 60000 characters." },
        400,
      );
    const output = exportText(
      body.text ?? text,
      body.text ? "User-edited draft. Review status unverified." : source,
    );
    let blob;
    if (body.format === "txt")
      blob = new Blob([output], { type: "text/plain;charset=utf-8" });
    if (body.format === "docx") blob = await wordBlob(output);
    if (body.format === "pdf") {
      const fontResponse = await env.ASSETS.fetch(
        new URL("/fonts/NotoSans-Regular.ttf", request.url),
      );
      if (!fontResponse.ok) throw new Error("Font unavailable");
      const fontBytes = new Uint8Array(await fontResponse.arrayBuffer());
      let binary = "";
      for (let i = 0; i < fontBytes.length; i += 8192)
        binary += String.fromCharCode(...fontBytes.subarray(i, i + 8192));
      blob = await pdfBlob(output, btoa(binary));
    }
    return new Response(blob, {
      headers: {
        ...headers,
        "Content-Type": blob.type,
        "Content-Disposition": `attachment; filename="open-safe-europe-draft.${body.format}"`,
      },
    });
  } catch {
    return json(
      { error: "Draft processing failed. Check the request or retry." },
      500,
    );
  }
}
