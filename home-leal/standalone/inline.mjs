// Junta o JS e o CSS do build num único ficheiro HTML (conteúdo do <body> + <title>/<style>).
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const dist = new URL("./dist/", import.meta.url).pathname;
const assets = join(dist, "assets");
const files = readdirSync(assets);
const css = files.filter((f) => f.endsWith(".css")).map((f) => readFileSync(join(assets, f), "utf8")).join("\n");
const js = files.filter((f) => f.endsWith(".js")).map((f) => readFileSync(join(assets, f), "utf8")).join("\n");

const fonts =
  '<link rel="preconnect" href="https://fonts.googleapis.com">' +
  '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>' +
  '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Manrope:wght@400;500;600;700&display=swap">';
const vars =
  ':root{--font-heading:"Fraunces",Georgia,serif;--font-body:"Manrope",system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}';

const html = `<title>Home Leal</title>
${fonts}
<style>${vars}
${css.replace(/<\/style/gi, "<\\/style")}</style>
<div id="root"></div>
<script type="module">${js.replace(/<\/script/gi, "<\\/script")}</script>
`;
writeFileSync(join(dist, "home-leal.html"), html);
console.log(`standalone/dist/home-leal.html (${(html.length / 1024).toFixed(0)} KB)`);
