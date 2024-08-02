import fs from "fs/promises";
import path from "path";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const glob = require("glob");

// domain name
const baseUrl = "https://foo.bar";
// base pages directory
const pagesDir = path.resolve("src/pages");
// get routes
const pages = glob.sync(`${pagesDir}/**/*.tsx`, {
  // ignore all files started with `_`
  ignore: `${pagesDir}/**/_*.tsx`
});
// output directory
const outDir = path.resolve("dist");

// function
async function generateSitemap() {
  try {
    const urls = await Promise.all(
      pages.map(async page => {
        const relativePath = path.relative(pagesDir, page);
        let urlPath = relativePath
          .replace(/\\/g, "/")
          .replace(/\.tsx$/, "")
          .replace(/\/index$/, "");

        // for root index, eg. `src/pages/index.tsx`
        if (urlPath === "index") {
          urlPath = "";
        }

        const stats = await fs.stat(page);
        const lastMod = stats.mtime.toISOString();
        const priority = urlPath === "" ? "1.0" : "0.8"; // create homepage priority, 1.0 for root, 0.8 for others
        const changefreq = "weekly";

        return {
          url: `${baseUrl}${urlPath ? `/${urlPath}` : ""}`,
          lastMod,
          priority,
          changefreq
        };
      })
    );

    const sitemap = `
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls
      .map(
        ({ url, lastMod, priority, changefreq }) => `
  <url>
    <loc>${url}</loc>
    <lastmod>${lastMod}</lastmod>
    <priority>${priority}</priority>
    <changefreq>${changefreq}</changefreq>
  </url>`
      )
      .join("")}
</urlset>`;

    await fs.writeFile(`${outDir}/sitemap.xml`, sitemap.trim());
    console.log("Sitemap generated successfully :)");
  } catch (error) {
    console.error("Error generating sitemap:", error);
  }
}

generateSitemap();
