// Prerender every route to dist/<route>/index.html so crawlers get full HTML without JS.
import { build } from "vite";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { HOSTS, LISTINGS } from "../src/mocks/data";

const STATIC = [
  "/", "/about", "/search", "/favorites", "/compare", "/dashboard", "/dashboard/bookings", "/dashboard/reviews",
  "/inbox", "/host", "/host/listings", "/host/listings/new", "/host/calendar", "/host/requests",
  "/host/earnings", "/host/insights", "/account", "/help", "/terms", "/privacy", "/policies/cancellation",
];
// ponytail: checkout/confirmation/inbox threads/edit are per-session, not worth prerendering
const routes = [...STATIC, ...LISTINGS.map((l) => `/space/${l.id}`), ...HOSTS.map((h) => `/profile/${h.id}`)];

await build({ build: { ssr: "src/entry-server.tsx", outDir: "dist/server" }, logLevel: "warn" });
const { render } = await import("../dist/server/entry-server.js");
const template = readFileSync("dist/index.html", "utf8");

for (const route of routes) {
  const html = template.replace(/<div id="root">[\s\S]*?<\/div>\s*<\/body>/, `<div id="root">${render(route)}</div>\n  </body>`);
  const dir = join("dist", route);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "index.html"), html);
}
rmSync("dist/server", { recursive: true });
console.log(`prerendered ${routes.length} routes`);
