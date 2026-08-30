/**
 * GitHub Contribution Graph — SVG Line / Area Chart
 * ------------------------------------------------------------------
 * Fetches daily contribution counts from the public contributions API
 * and renders a smooth, theme-aware SVG line chart with area fill.
 *
 * Usage: add <script src="github-graph.js"></script> to the page.
 * The chart renders inside any element with class "github-graph-wrapper".
 */
(function () {
  "use strict";

  var USERNAME = "Abhinav3457";
  var API_URL = "https://github-contributions-api.jogruber.de/v4/" + USERNAME;
  var DAYS_TO_SHOW = 90; // last ~3 months

  var THEME = {
    light: {
      line: "#6366f1",
      fill: "#6366f1",
      fillOpacity: 0.18,
      dot: "#4f46e5",
      grid: "rgba(99,102,241,0.10)",
      text: "#64748b",
      labelBg: "rgba(255,255,255,0.85)",
      loading: "#94a3b8"
    },
    dark: {
      line: "#a5b4fc",
      fill: "#818cf8",
      fillOpacity: 0.22,
      dot: "#a5b4fc",
      grid: "rgba(129,140,248,0.12)",
      text: "#94a3b8",
      labelBg: "rgba(15,15,20,0.8)",
      loading: "#64748b"
    }
  };

  var isDark = false;
  var chartData = null;
  var wrapper = null;

  /* ── helpers ─────────────────────────────────────────────────── */

  function colors() {
    return isDark ? THEME.dark : THEME.light;
  }

  function formatDate(d) {
    var months = [
      "Jan","Feb","Mar","Apr","May","Jun",
      "Jul","Aug","Sep","Oct","Nov","Dec"
    ];
    return months[d.getMonth()] + " " + d.getDate();
  }

  function monthLabel(d) {
    var months = [
      "Jan","Feb","Mar","Apr","May","Jun",
      "Jul","Aug","Sep","Oct","Nov","Dec"
    ];
    return months[d.getMonth()];
  }

  /* ── SVG rendering ──────────────────────────────────────────── */

  function buildSVG(points, total) {
    var c = colors();
    var W = 900;
    var H = 280;
    var PAD = { top: 30, right: 20, bottom: 44, left: 48 };
    var CW = W - PAD.left - PAD.right;
    var CH = H - PAD.top - PAD.bottom;

    var maxVal = Math.max.apply(
      null,
      points.map(function (p) { return p.count; })
    );
    if (maxVal === 0) maxVal = 1;

    /* scale helpers */
    function sx(i) {
      return PAD.left + (i / (points.length - 1)) * CW;
    }
    function sy(v) {
      return PAD.top + CH - (v / maxVal) * CH;
    }

    /* ── grid lines & Y labels ────────────────────────────── */
    var gridSteps = 4;
    var gridLines = "";
    for (var g = 0; g <= gridSteps; g++) {
      var gv = Math.round((maxVal / gridSteps) * g);
      var gy = sy(gv);
      gridLines +=
        '<line x1="' + PAD.left + '" y1="' + gy + '" x2="' + (W - PAD.right) + '" y2="' + gy + '" stroke="' + c.grid + '" stroke-width="1" />';
      gridLines +=
        '<text x="' + (PAD.left - 8) + '" y="' + (gy + 4) + '" text-anchor="end" fill="' + c.text + '" font-size="11" font-family="Outfit,sans-serif">' + gv + "</text>";
    }

    /* ── smooth cubic-bezier path (Catmull-Rom → Cubic) ──── */
    function catmullRom(pts) {
      if (pts.length < 2) return "";
      var d = "M" + pts[0].x + "," + pts[0].y;
      for (var i = 0; i < pts.length - 1; i++) {
        var p0 = pts[Math.max(i - 1, 0)];
        var p1 = pts[i];
        var p2 = pts[i + 1];
        var p3 = pts[Math.min(i + 2, pts.length - 1)];
        var cp1x = p1.x + (p2.x - p0.x) / 6;
        var cp1y = p1.y + (p2.y - p0.y) / 6;
        var cp2x = p2.x - (p3.x - p1.x) / 6;
        var cp2y = p2.y - (p3.y - p1.y) / 6;
        d += " C" + cp1x + "," + cp1y + " " + cp2x + "," + cp2y + " " + p2.x + "," + p2.y;
      }
      return d;
    }

    var linePts = points.map(function (p, i) {
      return { x: sx(i), y: sy(p.count) };
    });

    var linePath = catmullRom(linePts);

    /* area path: line path + close to bottom */
    var areaPath =
      linePath +
      " L" + sx(points.length - 1) + "," + (PAD.top + CH) +
      " L" + sx(0) + "," + (PAD.top + CH) + " Z";

    /* ── X axis labels (monthly) ─────────────────────────── */
    var xLabels = "";
    var lastMonth = -1;
    points.forEach(function (p, i) {
      var m = p.date.getMonth();
      if (m !== lastMonth) {
        lastMonth = m;
        xLabels +=
          '<text x="' + sx(i) + '" y="' + (H - 8) + '" text-anchor="middle" fill="' + c.text + '" font-size="11" font-family="Outfit,sans-serif">' + monthLabel(p.date) + "</text>";
      }
    });

    /* ── dots for non-zero days ──────────────────────────── */
    var dots = "";
    points.forEach(function (p, i) {
      if (p.count > 0) {
        dots +=
          '<circle cx="' + sx(i) + '" cy="' + sy(p.count) + '" r="2.5" fill="' + c.dot + '" opacity="0.7" />';
      }
    });

    /* ── assemble ────────────────────────────────────────── */
    var uniqueId = "ghg-" + Math.random().toString(36).slice(2, 8);

    return (
      '<svg viewBox="0 0 ' + W + " " + H + '" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;display:block">' +
      "<defs>" +
      '<linearGradient id="' + uniqueId + '-grad" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0%" stop-color="' + c.fill + '" stop-opacity="' + c.fillOpacity + '" />' +
      '<stop offset="100%" stop-color="' + c.fill + '" stop-opacity="0" />' +
      "</linearGradient>" +
      "</defs>" +
      /* total badge */
      '<text x="' + (W - PAD.right) + '" y="' + (PAD.top - 10) + '" text-anchor="end" fill="' + c.text + '" font-size="13" font-family="Outfit,sans-serif" font-weight="500">' + total + " contributions in " + DAYS_TO_SHOW + " days</text>" +
      /* grid */
      gridLines +
      /* area fill */
      '<path d="' + areaPath + '" fill="url(#' + uniqueId + '-grad)" />' +
      /* line */
      '<path d="' + linePath + '" fill="none" stroke="' + c.line + '" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />' +
      /* dots */
      dots +
      /* x labels */
      xLabels +
      "</svg>"
    );
  }

  /* ── loading state ──────────────────────────────────────────── */

  function renderLoading() {
    if (!wrapper) return;
    var c = colors();
    wrapper.innerHTML =
      '<svg viewBox="0 0 900 280" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;display:block;opacity:0.5">' +
      '<text x="450" y="148" text-anchor="middle" fill="' + c.loading + '" font-size="15" font-family="Outfit,sans-serif">Loading contribution data…</text>' +
      "</svg>";
  }

  function renderError(msg) {
    if (!wrapper) return;
    var c = colors();
    wrapper.innerHTML =
      '<svg viewBox="0 0 900 280" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;display:block;opacity:0.5">' +
      '<text x="450" y="148" text-anchor="middle" fill="' + c.loading + '" font-size="15" font-family="Outfit,sans-serif">' + msg + "</text>" +
      "</svg>";
  }

  /* ── fetch & render ─────────────────────────────────────────── */

  function render() {
    if (!chartData) return;
    if (!wrapper) wrapper = document.querySelector(".github-graph-wrapper");
    if (!wrapper) return;

    var contribs = chartData.contributions || [];
    /* take last N days */
    var sliced = contribs.slice(-DAYS_TO_SHOW);

    var points = sliced.map(function (d) {
      return {
        date: new Date(d.date + "T00:00:00"),
        count: d.count || 0
      };
    });

    var total = points.reduce(function (sum, p) { return sum + p.count; }, 0);

    wrapper.innerHTML = buildSVG(points, total);
  }

  /* ── theme switching ────────────────────────────────────────── */

  function setTheme(dark) {
    isDark = !!dark;
    if (chartData) render();
  }

  function fetchData() {
    if (!wrapper) wrapper = document.querySelector(".github-graph-wrapper");
    if (!wrapper) return;

    renderLoading();

    fetch(API_URL)
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      })
      .then(function (data) {
        chartData = data;
        render();
      })
      .catch(function () {
        renderError("Could not load contribution data.");
      });
  }

  /* ── public API ─────────────────────────────────────────────── */

  window.GitHubGraph = {
    setTheme: setTheme,
    refresh: fetchData
  };

  /* ── init on DOM ready ──────────────────────────────────────── */

  function init() {
    isDark = document.body.classList.contains("dark-mode");
    wrapper = document.querySelector(".github-graph-wrapper");
    fetchData();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
