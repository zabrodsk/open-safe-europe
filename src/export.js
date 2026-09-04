export async function wordBlob(text) {
  const {
    Document,
    Packer,
    Paragraph,
    TextRun,
    HeadingLevel,
    Footer,
    AlignmentType,
    PageNumber,
  } = await import("docx");
  const paras = text.split("\n").map(
    (line) =>
      new Paragraph({
        heading: /^(\d+\. |PARTIES$|SIGNATURES$|DRAFTING STATUS$)/.test(line)
          ? HeadingLevel.HEADING_2
          : undefined,
        spacing: { after: 100 },
        children: [new TextRun({ text: line, font: "Arial", size: 21 })],
      }),
  );
  return Packer.toBlob(
    new Document({
      creator: "Open SAFE Europe",
      title: "SAFE agreement draft",
      sections: [
        {
          properties: {},
          children: paras,
          footers: {
            default: new Footer({
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({
                      text: "Open SAFE Europe · Draft · ",
                      size: 16,
                    }),
                    new TextRun({ children: [PageNumber.CURRENT], size: 16 }),
                  ],
                }),
              ],
            }),
          },
        },
      ],
    }),
  );
}
let font;
async function loadFont() {
  if (!font) {
    const r = await fetch(
      new URL("../public/fonts/NotoSans-Regular.ttf", import.meta.url),
    );
    if (!r.ok) throw new Error("Could not load the PDF font. Try again.");
    const bytes = new Uint8Array(await r.arrayBuffer());
    let binary = "";
    for (let i = 0; i < bytes.length; i += 8192)
      binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
    font = btoa(binary);
  }
  return font;
}
export async function pdfBlob(text, fontBase64) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  doc.addFileToVFS("NotoSans.ttf", fontBase64 || (await loadFont()));
  doc.addFont("NotoSans.ttf", "NotoSans", "normal");
  doc.setFont("NotoSans");
  doc.setFontSize(10);
  let y = 23;
  for (const paragraph of text.split("\n")) {
    for (const line of doc.splitTextToSize(paragraph || " ", 166)) {
      if (y > 272) {
        doc.addPage();
        y = 23;
      }
      doc.text(line, 22, y);
      y += 5.2;
    }
    y += 1.2;
  }
  const count = doc.getNumberOfPages();
  for (let i = 1; i <= count; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(105);
    doc.text(`Open SAFE Europe | Draft | ${i} / ${count}`, 22, 287);
  }
  return doc.output("blob");
}
export function download(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
