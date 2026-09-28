// Сервер для Railway (и любого хостинга с Node.js).
// На Netlify этот файл не используется — там работают netlify/functions.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.join(ROOT, "public");
const PORT = process.env.PORT || 3000;

const routes = {};
for (const name of ["config", "generate", "status", "health", "editor"]) {
  const mod = await import(`./netlify/functions/${name}.mjs`);
  routes[mod.config.path] = mod.default;
}

const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml", ".ico": "image/x-icon", ".webp": "image/webp" };

http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
    const handler = routes[url.pathname];
    if (handler) {
      const chunks = [];
      let size = 0;
      for await (const c of req) {
        size += c.length;
        if (size > 8_000_000) { res.writeHead(413, { "content-type": "application/json" }); res.end('{"error":"Фото слишком большие."}'); return; }
        chunks.push(c);
      }
      const request = new Request(url, {
        method: req.method,
        headers: req.headers,
        body: ["GET", "HEAD"].includes(req.method) ? undefined : Buffer.concat(chunks),
      });
      const out = await handler(request);
      res.writeHead(out.status, Object.fromEntries(out.headers));
      res.end(Buffer.from(await out.arrayBuffer()));
      return;
    }
    let file = path.normalize(path.join(PUBLIC, decodeURIComponent(url.pathname)));
    if (!file.startsWith(PUBLIC)) { res.writeHead(403); res.end(); return; }
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, "index.html");
    if (!path.extname(file) && fs.existsSync(file + ".html")) file += ".html";
    if (!fs.existsSync(file)) file = path.join(PUBLIC, "index.html");
    res.writeHead(200, { "content-type": TYPES[path.extname(file)] || "application/octet-stream" });
    fs.createReadStream(file).pipe(res);
  } catch (e) {
    console.error(e);
    res.writeHead(500, { "content-type": "application/json" });
    res.end(JSON.stringify({ error: "Внутренняя ошибка сервера." }));
  }
}).listen(PORT, () => console.log(`Студия запущена на порту ${PORT}`));
