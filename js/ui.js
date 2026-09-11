/* ============================================================================
   ui.js — minimal terminal UI: writes lines into the code box
   ES5-compatible (the PS4 browser has a Safari-era engine).
   ============================================================================ */

var UI = (function () {

  var box = null;
  var statusEl = null;
  var MAX_LOG_LINES = 200;
  var lineCount = 0;

  function $(id) { return document.getElementById(id); }

  function getBox() {
    if (!box) box = $("codeBox");
    return box;
  }
  function getStatus() {
    if (!statusEl) statusEl = $("statusLine");
    return statusEl;
  }

  /* Append a log line to the code box. */
  function log(msg, cls) {
    var b = getBox();
    if (!b) return;
    var div = document.createElement("div");
    div.className = "log-line " + (cls || "");
    div.textContent = msg;
    b.appendChild(div);
    lineCount++;
    while (lineCount > MAX_LOG_LINES && b.firstChild) {
      b.removeChild(b.firstChild);
      lineCount--;
    }
    b.scrollTop = b.scrollHeight;
  }

  /* Set the single status line (stays pinned at the top of the box). */
  function status(text, cls) {
    var el = getStatus();
    if (!el) return;
    el.className = "log-line status " + (cls || "");
    el.textContent = "> " + text;
  }

  function clearLog() {
    var b = getBox();
    if (!b) return;
    b.innerHTML = "";
    lineCount = 0;
    var s = document.createElement("div");
    s.className = "log-line status";
    s.id = "statusLine";
    b.appendChild(s);
    statusEl = s;
  }

  function escapeHtml(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  /* Kept for API compatibility with exploit.js (no-op in minimal UI). */
  function showBanner() {}
  function hideBanner() {}

  return {
    log: log,
    status: status,
    clearLog: clearLog,
    escapeHtml: escapeHtml,
    showBanner: showBanner,
    hideBanner: hideBanner
  };
})();