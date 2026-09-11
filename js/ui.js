/* ============================================================================
   ui.js — DOM rendering: firmware map, log console, tabs, status banners
   ES5-compatible (the PS4 browser has a Safari-era engine).
   ============================================================================ */

var UI = (function () {

  var logConsole = null;
  var MAX_LOG_LINES = 500;
  var lineCount = 0;

  function $(id) { return document.getElementById(id); }

  function log(msg, cls) {
    logConsole = logConsole || $("logConsole");
    if (!logConsole) return;
    var div = document.createElement("div");
    div.className = "log-line " + (cls || "");
    var now = new Date();
    var t = ("0" + now.getHours()).slice(-2) + ":" +
            ("0" + now.getMinutes()).slice(-2) + ":" +
            ("0" + now.getSeconds()).slice(-2);
    div.innerHTML = '<span class="t">[' + t + ']</span> ' + escapeHtml(msg);
    logConsole.appendChild(div);
    lineCount++;
    while (lineCount > MAX_LOG_LINES && logConsole.firstChild) {
      logConsole.removeChild(logConsole.firstChild);
      lineCount--;
    }
    logConsole.scrollTop = logConsole.scrollHeight;
  }

  function escapeHtml(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  /* ---- firmware map ---- */
  function fwVersionList(ranges) {
    var list = [];
    for (var i = 0; i < ranges.length; i++) {
      var r = ranges[i];
      list.push({ key: r.low, label: r.low, chainName: r.chainName, status: r.status, chain: r.chain });
      if (r.high !== r.low) {
        list.push({ key: r.high, label: r.high, chainName: r.chainName, status: r.status, chain: r.chain });
      }
    }
    // compact sort by numeric value
    list.sort(function (a, b) { return parseFloat(a.key) - parseFloat(b.key); });
    return list;
  }

  function statusClass(s) {
    if (s === "full") return "st-full";
    if (s === "userland") return "st-userland";
    if (s === "waiting") return "st-waiting";
    return "st-na";
  }
  function statusLabel(s) {
    if (s === "full") return "Jailbreakable";
    if (s === "userland") return "Userland only";
    if (s === "waiting") return "Waiting";
    return "N/A";
  }

  function renderFwMap() {
    var t4 = $("fwTablePs4");
    var t5 = $("fwTablePs5");
    if (!t4 || !t5) return;

    t4.innerHTML = "";
    var ps4Rows = fwVersionList(HOST.ps4.ranges);
    for (var i = 0; i < ps4Rows.length; i++) {
      var r = ps4Rows[i];
      t4.appendChild(fwRow(r));
    }

    t5.innerHTML = "";
    var ps5Rows = fwVersionList(HOST.ps5.ranges);
    for (var j = 0; j < ps5Rows.length; j++) {
      t5.appendChild(fwRow(ps5Rows[j]));
    }
  }

  function fwRow(r) {
    var row = document.createElement("div");
    row.className = "fw-row";
    var f = document.createElement("span");
    f.className = "fw-fw";
    f.textContent = r.label;
    var c = document.createElement("span");
    c.className = "fw-chain";
    c.textContent = r.chainName;
    var s = document.createElement("span");
    s.className = "fw-status " + statusClass(r.status);
    s.textContent = statusLabel(r.status);
    row.appendChild(f); row.appendChild(c); row.appendChild(s);
    return row;
  }

  /* ---- tab switching ---- */
  function bindTabs() {
    var nav = $("tabsNav");
    if (!nav) return;
    var tabs = nav.getElementsByClassName("tab");
    for (var i = 0; i < tabs.length; i++) {
      (function (tab) {
        tab.addEventListener("click", function () {
          var name = tab.getAttribute("data-tab");
          for (var j = 0; j < tabs.length; j++) tabs[j].className = "tab";
          tab.className = "tab active";
          var panels = document.getElementsByClassName("panel");
          for (var k = 0; k < panels.length; k++) {
            panels[k].className = "panel" + (panels[k].id === "panel-" + name ? " active" : "");
          }
        });
      })(tabs[i]);
    }
  }

  /* ---- status banner ---- */
  function showBanner(text) {
    var b = $("statusBanner");
    var t = $("statusBannerText");
    if (!b || !t) return;
    t.textContent = text;
    b.className = "status-banner";
  }
  function hideBanner() {
    var b = $("statusBanner");
    if (b) b.className = "status-banner hidden";
  }

  return {
    log: log,
    renderFwMap: renderFwMap,
    bindTabs: bindTabs,
    showBanner: showBanner,
    hideBanner: hideBanner,
    escapeHtml: escapeHtml,
    fwVersionList: fwVersionList,
    statusClass: statusClass,
    statusLabel: statusLabel
  };
})();