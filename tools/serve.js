/* ============================================================================
   tools/serve.js — LAN server for the HULK PSx Jailbreak Host
   ----------------------------------------------------------------------------
   Two jobs:
     1. Serve the host folder over HTTP so a PS4 (or any device on the LAN)
        can open it:  http://<PC-IP>:8090/
     2. Push payload files (goldhen.bin, p2jb.js, elfldr, ...) to the
        console's listener port (default 9021 — Y2JB / netcatGUI-style) over
        raw TCP, which the browser cannot do.

   Usage:   node tools/serve.js            (from the project root)
   Flags:   --port 8090  --push-port 9021
   ============================================================================ */

const http = require("http");
const fs = require("fs");
const path = require("path");
const net = require("net");

const ROOT = path.resolve(__dirname, "..");
const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".txt": "text/plain; charset=utf-8",
  ".bin": "application/octet-stream",
  ".elf": "application/octet-stream",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".zip": "application/zip",
  ".md": "text/markdown; charset=utf-8"
};

function args() {
  const a = process.argv.slice(2);
  const out = { port: 8090, pushPort: 9021 };
  for (let i = 0; i < a.length; i++) {
    if (a[i] === "--port" && a[i + 1]) out.port = parseInt(a[i + 1], 10);
    if (a[i] === "--push-port" && a[i + 1]) out.pushPort = parseInt(a[i + 1], 10);
  }
  return out;
}

const cfg = args();
const CONTENT_LENGTH_BYTES = 60 * 1024 * 1024; // keep payload pushes under 60MB

function safePath(p) {
  const resolved = path.resolve(ROOT, "." + decodeURIComponent(p));
  return resolved.startsWith(ROOT) ? resolved : null;
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, "http://localhost");
  const pathname = url.pathname;

  log(`[http] ${req.method} ${pathname}`);

  // CORS-free local server; allow any origin for convenience
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") { res.writeHead(204); res.end(); return; }

  if (req.method === "POST" && pathname === "/push") {
    handlePush(url, res);
    return;
  }

  if (req.method === "GET" && pathname === "/qr") {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("Open http://" + lanIp() + ":" + cfg.port + "/ on your console.");
    return;
  }

  let file = pathname === "/" ? "/index.html" : pathname;
  const full = safePath(file);
  if (!full) { res.writeHead(403, { "Content-Type": "text/plain" }); res.end("Forbidden"); return; }

  fs.stat(full, (err, st) => {
    if (err || !st.isFile()) {
      res.writeHead(404, { "Content-Type": "text/html" });
      res.end("<h1>404</h1><p>Not found on host. <a href='/'>Back</a></p>");
      return;
    }
    const ext = path.extname(full).toLowerCase();
    const now = new Date().toUTCString();
    res.writeHead(200, {
      "Content-Type": MIME[ext] || "application/octet-stream",
      "Last-Modified": st.mtime.toUTCString(),
      "Date": now,
      "Cache-Control": "no-cache"
    });
    fs.createReadStream(full).pipe(res);
  });
});

/* ---- push endpoint: reads a payload file from this host and sends its
   bytes to the console's TCP listener. Mirrors the netcatGUI workflow. ---- */
function handlePush(url, res) {
  const host = url.searchParams.get("host");
  const port = parseInt(url.searchParams.get("port") || cfg.pushPort, 10);
  const file = url.searchParams.get("file");
  if (!host || !file) {
    res.writeHead(400, { "Content-Type": "text/plain" });
    res.end("Missing host/file params. Use /push?host=IP&port=9021&file=goldhen.bin");
    return;
  }
  const full = safePath("/payloads/" + file);
  fs.stat(full, (err, st) => {
    if (err || !st.isFile()) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Payload file not found: payloads/" + file + " (run tools/update-goldhen first)");
      return;
    }
    const sock = net.connect(port, host, () => {
      log(`[push] sending payloads/${file} (${st.size} bytes) -> ${host}:${port}`);
      fs.createReadStream(full).on("data", (chunk) => sock.write(chunk));
      fs.createReadStream(full).on("end", () => sock.end());
    });
    sock.setTimeout(30000);
    sock.on("error", (e) => {
      res.writeHead(502, { "Content-Type": "text/plain" });
      res.end("Connection to console failed: " + e.message);
    });
    sock.on("close", () => {
      if (!res.headersSent) { res.writeHead(200, { "Content-Type": "text/plain" }); }
      res.end("Pushed " + file + " (" + st.size + " bytes) to " + host + ":" + port);
    });
  });
}

/* ---- local IP detection for printing the LAN URL ---- */
function lanIp() {
  const os = require("os");
  const ifs = os.networkInterfaces();
  for (const name of Object.keys(ifs)) {
    for (const iface of ifs[name] || []) {
      if (iface.family === "IPv4" && !iface.internal) return iface.address;
    }
  }
  return "127.0.0.1";
}

function log(msg) {
  console.log("[" + new Date().toISOString() + "] " + msg);
}

server.listen(cfg.port, "0.0.0.0", () => {
  console.log("");
  console.log("  ==============================================");
  console.log("   HULK PSx Jailbreak Host — LAN server");
  console.log("  ==============================================");
  console.log("   Host page : http://" + lanIp() + ":" + cfg.port + "/");
  console.log("   Push port : " + cfg.pushPort + " (Y2JB listener)");
  console.log("   Open the host page on your PS4 browser, or use the");
  console.log("   PS5 tab to push p2jb.js / elfldr to the console.");
  console.log("  ==============================================");
  console.log("");
});