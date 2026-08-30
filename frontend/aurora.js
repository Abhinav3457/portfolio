/**
 * Aurora Flow Background (Theme-Aware)
 * ------------------------------------------------------------------
 * A slow, liquid "aurora" rendered on a full-screen canvas - the code-drawn
 * equivalent of vivetofficial.com's looping background video, tuned to the
 * portfolio's indigo / violet / cyan palette.
 *
 * - Drifts endlessly like a seamless video loop (no assets, no video files)
 * - Adapts colors to light & dark mode via window.AuroraSystem.setTheme(dark)
 * - Gentle mouse / touch parallax nudges the flow
 * - Respects prefers-reduced-motion: renders one static frame, no loop
 */
(function () {
  "use strict";

  var CONFIG = {
    layers: 4,
    speed: 0.00012,
    mouseInfluence: 0.05,
    step: 10
  };

  var COLORS = {
    light: [
      "99, 102, 241", // indigo-500
      "139, 92, 246", // violet-500
      "6, 182, 212",  // cyan-500
      "79, 70, 229"   // indigo-600
    ],
    dark: [
      "129, 140, 248", // indigo-400
      "167, 139, 250", // violet-400
      "34, 211, 238",  // cyan-400
      "99, 102, 241"   // indigo-500
    ]
  };

  var LAYER_SEEDS = [
    { amp: 0.15, freq: 1.4, speed: 1.0 },
    { amp: 0.21, freq: 0.9, speed: 0.7 },
    { amp: 0.12, freq: 1.8, speed: 1.3 },
    { amp: 0.18, freq: 1.1, speed: 0.55 }
  ];

  var canvas, ctx;
  var layers = [];
  var running = false;
  var isDark = false;
  var rafId = null;
  var time = 0;
  var W = 0;
  var H = 0;
  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var mouseTarget = { x: 0.5, y: 0.5 };
  var mouse = { x: 0.5, y: 0.5 };

  function activeColors() {
    return isDark ? COLORS.dark : COLORS.light;
  }

  function buildLayers() {
    layers = [];
    var count = CONFIG.layers;
    if (W < 720) count = 3;
    if (W < 480) count = 2;

    for (var i = 0; i < count; i++) {
      var seed = LAYER_SEEDS[i % LAYER_SEEDS.length];
      layers.push({
        amp: seed.amp,
        freq: seed.freq,
        speed: seed.speed,
        phase: Math.random() * Math.PI * 2,
        colorIndex: i % COLORS.light.length,
        alpha: isDark ? 0.5 : 0.32,
        center: 0.22 + i * 0.18
      });
    }
  }

  function waveY(layer, x, t, offsetX) {
    var u = (x - offsetX) / W;
    var p = layer.phase + t * CONFIG.speed * 60 * layer.speed;
    var s1 = Math.sin(u * layer.freq * Math.PI * 2 + p);
    var s2 = Math.sin(u * layer.freq * Math.PI * 3 + p * 1.7);
    return layer.center + layer.amp * (s1 * 0.65 + s2 * 0.35);
  }

  function drawLayer(layer, t) {
    var color = activeColors()[layer.colorIndex];
    var offsetX = (mouse.x - 0.5) * W * CONFIG.mouseInfluence * 2 * layer.speed;
    var band = H * (layer.amp * 2.6 + 0.06);

    var pts = [];
    var crestMin = Infinity;
    var x;
    for (x = -CONFIG.step * 2; x <= W + CONFIG.step * 2; x += CONFIG.step) {
      var y = waveY(layer, x, t, offsetX) * H;
      pts.push({ x: x, y: y });
      if (y < crestMin) crestMin = y;
    }

    // Ribbon body: crest line down to crest + band
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    var i;
    for (i = 1; i < pts.length - 1; i++) {
      var mx = (pts[i].x + pts[i + 1].x) / 2;
      var my = (pts[i].y + pts[i + 1].y) / 2;
      ctx.quadraticCurveTo(pts[i].x, pts[i].y, mx, my);
    }
    var last = pts[pts.length - 1];
    ctx.quadraticCurveTo(last.x, last.y, last.x + CONFIG.step * 2, last.y);
    ctx.lineTo(last.x + CONFIG.step * 2, last.y + band);
    for (var j = pts.length - 1; j >= 0; j--) {
      ctx.lineTo(pts[j].x, pts[j].y + band);
    }
    ctx.closePath();

    var grad = ctx.createLinearGradient(0, crestMin - band * 0.15, 0, crestMin + band * 1.15);
    grad.addColorStop(0, "rgba(" + color + ", " + layer.alpha + ")");
    grad.addColorStop(0.6, "rgba(" + color + ", " + (layer.alpha * 0.45).toFixed(3) + ")");
    grad.addColorStop(1, "rgba(" + color + ", 0)");
    ctx.fillStyle = grad;
    ctx.fill();

    // Bright crest core line
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (var k = 1; k < pts.length - 1; k++) {
      var kx = (pts[k].x + pts[k + 1].x) / 2;
      var ky = (pts[k].y + pts[k + 1].y) / 2;
      ctx.quadraticCurveTo(pts[k].x, pts[k].y, kx, ky);
    }
    ctx.quadraticCurveTo(last.x, last.y, last.x + CONFIG.step * 2, last.y);
    ctx.strokeStyle = "rgba(" + color + ", " + (layer.alpha * 0.75).toFixed(3) + ")";
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.stroke();
  }

  function drawFrame(t) {
    if (!ctx || W <= 0 || H <= 0) return;
    ctx.clearRect(0, 0, W, H);

    // Ease mouse toward target for smooth parallax
    mouse.x += (mouseTarget.x - mouse.x) * 0.03;
    mouse.y += (mouseTarget.y - mouse.y) * 0.03;

    // "lighter" blending makes overlapping ribbons glow on dark backgrounds
    ctx.globalCompositeOperation = isDark ? "lighter" : "source-over";
    for (var i = 0; i < layers.length; i++) {
      drawLayer(layers[i], t);
    }
    ctx.globalCompositeOperation = "source-over";
  }

  function loop() {
    time += 1;
    drawFrame(time);
    rafId = requestAnimationFrame(loop);
  }

  function resize() {
    if (!canvas || !ctx) return;
    var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    buildLayers();
    if (reducedMotion) drawFrame(0);
  }

  function init() {
    canvas = document.getElementById("aurora-canvas");
    if (!canvas) return false;
    ctx = canvas.getContext("2d");
    if (!ctx) return false;

    if (document.body.classList.contains("dark-mode")) {
      isDark = true;
    }

    resize();
    window.addEventListener("resize", resize);

    if (reducedMotion) {
      drawFrame(0);
      return true;
    }

    running = true;
    loop();
    return true;
  }

  function updatePointer(x, y) {
    mouseTarget.x = x / window.innerWidth;
    mouseTarget.y = y / window.innerHeight;
  }

  // Public API (mirrors window.ParticleSystem)
  window.AuroraSystem = {
    start: function () {
      if (running) return;
      if (!init()) return;
    },
    stop: function () {
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      running = false;
      if (ctx && canvas) ctx.clearRect(0, 0, W, H);
    },
    setTheme: function (dark) {
      isDark = !!dark;
      if (canvas && ctx) {
        buildLayers();
        if (reducedMotion) drawFrame(0);
      }
    }
  };

  document.addEventListener("mousemove", function (e) {
    updatePointer(e.clientX, e.clientY);
  });
  document.addEventListener("touchmove", function (e) {
    var t = e.touches[0];
    if (t) updatePointer(t.clientX, t.clientY);
  }, { passive: true });

  document.addEventListener("visibilitychange", function () {
    if (document.hidden) {
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    } else if (running && !rafId) {
      loop();
    }
  });

  if (document.readyState === "complete") {
    window.AuroraSystem.start();
  } else {
    document.addEventListener("DOMContentLoaded", function () {
      window.AuroraSystem.start();
    });
  }
})();
