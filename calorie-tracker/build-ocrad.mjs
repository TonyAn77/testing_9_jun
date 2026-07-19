// Injects the OCRAD.js OCR engine (npm: ocrad.js, GPL) into index.html between
// the __OCRAD_START__ / __OCRAD_END__ markers, then regenerates artifact.html.
// Usage: node build-ocrad.mjs <path-to-ocrad.js>
import fs from "node:fs";
const src = fs.readFileSync(process.argv[2], "utf8");
if (src.includes("</script")) { console.error("ocrad.js contains </script — refusing"); process.exit(1); }
let html = fs.readFileSync("index.html", "utf8");
const S = "/*__OCRAD_START__*/", E = "/*__OCRAD_END__*/";
const a = html.indexOf(S), b = html.indexOf(E);
if (a < 0 || b < 0) { console.error("ocrad markers not found"); process.exit(1); }
html = html.slice(0, a + S.length) + "\n" + src + "\n" + html.slice(b);
fs.writeFileSync("index.html", html);
fs.writeFileSync("artifact.html",
  html.slice(html.indexOf("<style>"), html.lastIndexOf("</script>") + 9) + "\n");
console.log("index.html:", (fs.statSync("index.html").size/1048576).toFixed(2) + " MB",
  "| artifact.html:", (fs.statSync("artifact.html").size/1048576).toFixed(2) + " MB");
