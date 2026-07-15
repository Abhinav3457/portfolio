/**
 * Theme-Aware Sparkle Stars (Enhanced)
 * Twinkling stars that adapt to light/dark mode with full-page coverage.
 * Light mode: indigo-tinted stars visible on light bg
 * Dark mode: white/bright stars visible on dark bg
 * Enhanced for better visibility across all sections.
 */
(function () {
  "use strict";

  var CONFIG = {
    starCount: 250, // Increased from 120 for better coverage
    mouseRadius: 200, // Increased from 160
    mouseForce: 0.05, // Increased for faster mouse response
    twinkleSpeed: 0.009, // Faster twinkle for dynamic feel
    minAlpha: 0.6 // Minimum base alpha for better visibility
  };

  var COLORS = {
    light: [
      "99, 102, 241",   // indigo-500 (accent)
      "79, 70, 229",    // indigo-600
      "129, 140, 248",  // indigo-400
      "139, 92, 246",   // purple-500
      "168, 85, 247",   // purple-500
      "116, 139, 255"   // bright indigo
    ],
    dark: [
      "255, 255, 255",  // white
      "200, 215, 255",  // blue-white
      "255, 245, 220",  // warm white
      "230, 210, 255",  // lavender
      "255, 220, 230",  // pale pink
      "180, 200, 255"   // ice blue
    ]
  };

  var canvas, ctx;
  var stars = [];
  var mouse = { x: -9999, y: -9999 };
  var animFrameId = null;
  var isRunning = false;
  var activeColors = COLORS.light;
  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var time = 0;

  function Star(w, h) {
    this.x = Math.random() * w;
    this.y = Math.random() * h;
    this.radius = 0.6 + Math.random() * 2.2; // Slightly larger range
    this.vx = (Math.random() - 0.5) * 0.04;
    this.vy = (Math.random() - 0.5) * 0.04;
    this.colorIndex = Math.floor(Math.random() * COLORS.light.length);
    this.baseAlpha = CONFIG.minAlpha + Math.random() * 0.4; // Higher minimum alpha
    this.twinkleOff = Math.random() * Math.PI * 2;
    this.twinkleSpd = CONFIG.twinkleSpeed * (0.4 + Math.random()); // More variation
    this.pulsePhase = Math.random() * Math.PI * 2;
  }

  Star.prototype.getColor = function () {
    return activeColors[this.colorIndex];
  };

  Star.prototype.update = function (w, h, t) {
    // Mouse interaction - gentle repulsion
    var dx = this.x - mouse.x;
    var dy = this.y - mouse.y;
    var dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < CONFIG.mouseRadius && dist > 0) {
      var force = (CONFIG.mouseRadius - dist) / CONFIG.mouseRadius;
      this.vx += (dx / dist) * force * CONFIG.mouseForce;
      this.vy += (dy / dist) * force * CONFIG.mouseForce;
    }

    // Random drift
    this.vx += (Math.random() - 0.5) * 0.01;
    this.vy += (Math.random() - 0.5) * 0.01;
    
    // Apply friction
    this.vx *= 0.982;
    this.vy *= 0.982;

    // Limit speed
    var maxSpd = 0.15;
    var spd = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    if (spd > maxSpd) {
      this.vx = (this.vx / spd) * maxSpd;
      this.vy = (this.vy / spd) * maxSpd;
    }

    // Update position
    this.x += this.vx;
    this.y += this.vy;

    // Wrap around edges with padding
    var pad = 30;
    if (this.x < -pad) this.x = w + pad;
    if (this.x > w + pad) this.x = -pad;
    if (this.y < -pad) this.y = h + pad;
    if (this.y > h + pad) this.y = -pad;

    // Calculate twinkle with extra pulse
    this.twinkle = 0.5 + 0.5 * Math.sin(t * this.twinkleSpd + this.twinkleOff);
    this.pulse = 0.8 + 0.2 * Math.sin(t * 0.005 + this.pulsePhase); // Faster pulse
  };

  Star.prototype.draw = function (ctx) {
    var colorStr = this.getColor();
    var alpha = this.baseAlpha * this.twinkle * this.pulse;
    var r = this.radius * (0.7 + 0.3 * this.twinkle);

    // Outer glow (larger, more diffuse)
    ctx.beginPath();
    ctx.arc(this.x, this.y, r * 4, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(" + colorStr + ", " + (alpha * 0.08) + ")";
    ctx.fill();

    // Middle glow
    ctx.beginPath();
    ctx.arc(this.x, this.y, r * 2.5, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(" + colorStr + ", " + (alpha * 0.15) + ")";
    ctx.fill();

    // Inner glow
    ctx.beginPath();
    ctx.arc(this.x, this.y, r * 1.5, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(" + colorStr + ", " + (alpha * 0.25) + ")";
    ctx.fill();

    // Core
    ctx.beginPath();
    ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(" + colorStr + ", " + alpha + ")";
    ctx.fill();
  };

  function initCanvas() {
    canvas = document.getElementById("particle-canvas");
    if (!canvas) return false;
    ctx = canvas.getContext("2d");

    function resize() {
      var dpr = window.devicePixelRatio || 1;
      var w = window.innerWidth;
      var h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.scale(dpr, dpr);
      return { w: w, h: h };
    }

    var dims = resize();
    var w = dims.w;
    var h = dims.h;

    var count = CONFIG.starCount;
    // Adjust count based on screen size
    if (w < 720) count = Math.floor(count * 0.6);
    if (w < 480) count = Math.floor(count * 0.4);
    if (count < 25) count = 25; // Minimum stars for visibility

    stars = [];
    for (var i = 0; i < count; i++) stars.push(new Star(w, h));

    window.addEventListener("resize", function () {
      var dims = resize();
      var nw = dims.w, nh = dims.h;
      for (var i = 0; i < stars.length; i++) {
        var s = stars[i];
        if (s.x > nw) s.x = Math.random() * nw;
        if (s.y > nh) s.y = Math.random() * nh;
      }
    });

    return true;
  }

  function drawLoop() {
    if (!ctx || !canvas) return;
    var w = window.innerWidth;
    var h = window.innerHeight;
    time++;

    ctx.clearRect(0, 0, w, h);

    for (var i = 0; i < stars.length; i++) {
      stars[i].update(w, h, time);
      stars[i].draw(ctx);
    }

    animFrameId = requestAnimationFrame(drawLoop);
  }

  window.ParticleSystem = {
    start: function () {
      if (isRunning) return;
      if (!initCanvas()) return;
      isRunning = true;
      drawLoop();
    },
    stop: function () {
      if (animFrameId) {
        cancelAnimationFrame(animFrameId);
        animFrameId = null;
      }
      if (ctx && canvas) ctx.clearRect(0, 0, canvas.width, canvas.height);
      isRunning = false;
    },
    setTheme: function (dark) {
      activeColors = dark ? COLORS.dark : COLORS.light;
    },
    // Method to get current star count for debugging
    getStarCount: function () {
      return stars.length;
    }
  };

  if (reducedMotion) return;

  if (document.readyState === "complete") {
    window.ParticleSystem.start();
  } else {
    document.addEventListener("DOMContentLoaded", function () {
      // Sync theme from body class (set by abhinav.js)
      if (document.body.classList.contains("dark-mode")) {
        window.ParticleSystem.setTheme(true);
      }
      window.ParticleSystem.start();
    });
  }

  document.addEventListener("mousemove", function (e) {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });
  document.addEventListener("mouseleave", function () {
    mouse.x = -9999;
    mouse.y = -9999;
  });
  document.addEventListener("touchmove", function (e) {
    var t = e.touches[0];
    if (t) {
      mouse.x = t.clientX;
      mouse.y = t.clientY;
    }
  });
  document.addEventListener("touchend", function () {
    mouse.x = -9999;
    mouse.y = -9999;
  });
})();
