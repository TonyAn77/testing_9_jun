// Builds the USDA SR28 catalog and injects it into index.html between the
// __CATALOG_START__ / __CATALOG_END__ markers. Data source: fda-nutrient-database
// (npm, MIT) which repackages USDA SR28 — public domain.
// Usage: node build-catalog.mjs <path-to-node_modules-with-fda-nutrient-database>
import fs from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(process.argv[2] + "/");
const db = require("fda-nutrient-database");

const abbrev = await new Promise(res => db.abbreviated(res));
const desc = await new Promise(res => db.foodDescription(res));
const longByNo = new Map(desc.map(d => [d.ndbNo, d.longDescription]));

const n1 = v => Math.round((+v || 0) * 10) / 10;
// SR28 text files are Latin-1; the package reads them as UTF-8, so the few
// accented characters decode to U+FFFD. Restore the known case, drop any rest.
const fixEnc = s => s.replace(/Entr�e/g, "Entrée").replace(/�/g, "");
const rows = [];
for (const r of abbrev) {
  const name = fixEnc((longByNo.get(r.ndbNo) || r.shortDescription || "").trim());
  if (!name) continue;
  const kcal = Math.round(+r.calories || 0);
  const w1 = n1(r.weight1);
  let w1d = fixEnc((r.weight1Description || "").trim());
  // strip parenthetical notes to keep units short: "1 cup (8 fl oz)" -> "1 cup"
  w1d = w1d.replace(/\s*\(.*?\)\s*/g, " ").replace(/\s+/g, " ").trim();
  rows.push([name, kcal, n1(r.protein), n1(r.carbohydrate), n1(r.fat), w1, w1d]);
}
const payload = rows.map(r => JSON.stringify(r)).join(",\n");
const html = fs.readFileSync("index.html", "utf8");
const START = "/*__CATALOG_START__*/", END = "/*__CATALOG_END__*/";
const a = html.indexOf(START), b = html.indexOf(END);
if (a < 0 || b < 0) { console.error("catalog markers not found"); process.exit(1); }
const out = html.slice(0, a + START.length) + "\n" + payload + "\n" + html.slice(b);
fs.writeFileSync("index.html", out);
// artifact body: strip doc wrapper (slice from <style> to LAST </script>)
fs.writeFileSync("artifact.html",
  out.slice(out.indexOf("<style>"), out.lastIndexOf("</script>") + 9) + "\n");
console.log("catalog rows:", rows.length,
  "| index.html:", (fs.statSync("index.html").size/1048576).toFixed(2) + " MB",
  "| artifact.html:", (fs.statSync("artifact.html").size/1048576).toFixed(2) + " MB");
