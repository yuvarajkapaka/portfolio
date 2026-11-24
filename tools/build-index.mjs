// Pre-renders the skills index (p.8) into index.html, so the page does not
// shift when portfolio.js runs. The list itself lives in portfolio.js.
// After editing `terms` there, run:  node tools/build-index.mjs
import { readFileSync, writeFileSync } from "node:fs";

const js = readFileSync(new URL("../portfolio.js", import.meta.url), "utf8");
const block = js.match(/const P = \{[\s\S]*?\n    \};\n/);
if (!block) throw new Error("Could not find P and terms in portfolio.js");
const { P, terms } = new Function(`${block[0]}; return { P, terms };`)();

const groups = {};
Object.keys(terms).sort((a, b) => a.localeCompare(b, "en", { sensitivity: "base" })).forEach(t => {
  const L = t[0].toUpperCase(); (groups[L] ||= []).push(t);
});
const html = Object.entries(groups).map(([L, list]) =>
  `<div class="idx-group"><p class="idx-letter" aria-hidden="true">${L}</p>` +
  list.map(t => `<p class="idx-row"><span class="term">${t}</span><span class="dots" aria-hidden="true"></span><span class="pp">${
    terms[t].length ? terms[t].map(p => `<a href="${P[p]}" aria-label="${t}, page ${p}">${p}</a>`).join(", ") : "<em>coursework</em>"
  }</span></p>`).join("") + `</div>`).join("\n        ");

const page = new URL("../index.html", import.meta.url);
const src = readFileSync(page, "utf8");
// Matches the empty container, or a previously rendered one (groups are indented
// 8 spaces; its closing tag is the first line indented 6).
const re = /<div class="idx" id="skillIndex">(?:<\/div>|[\s\S]*?\n      <\/div>)/;
if (!re.test(src)) throw new Error("Could not find #skillIndex in index.html");
const out = src.replace(re, `<div class="idx" id="skillIndex">\n        ${html}\n      </div>`);
if (!out.includes('id="colophon"') || !out.includes('id="back"')) throw new Error("Refusing to write: a section went missing");
writeFileSync(page, out);
console.log(`Index: ${Object.keys(terms).length} terms written to index.html`);
