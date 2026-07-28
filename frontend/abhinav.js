document.addEventListener("DOMContentLoaded", () => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    initThemeToggle();
    initMobileNav();
    initTypingEffect(reducedMotion);
    initSectionTransitions(reducedMotion);
    initRevealAnimations(reducedMotion);

    initProfileTilt(reducedMotion);
    initButtonSparkles(reducedMotion);
    initTimelineAnimations(reducedMotion);
    initHeroStats(reducedMotion);
    initCursorGlow(reducedMotion);
    initMagneticHover(reducedMotion);
    initSmoothScroll();
    initSystemHealth();
    initScoreAnimations(reducedMotion);
});

function initThemeToggle() {
    const toggle = document.getElementById("theme-toggle");
    if (!toggle) {
        return;
    }

    const savedTheme = window.localStorage.getItem("portfolio-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const shouldUseDark = savedTheme ? savedTheme === "dark" : prefersDark;

    applyTheme(shouldUseDark);
    toggle.checked = shouldUseDark;

    toggle.addEventListener("change", () => {
        applyTheme(toggle.checked);
    });
}

function applyTheme(useDarkMode) {
    const toggle = document.getElementById("theme-toggle");

    document.body.classList.toggle("dark-mode", useDarkMode);
    window.localStorage.setItem("portfolio-theme", useDarkMode ? "dark" : "light");

    /* Update LeetCode card theme to match portfolio */
    const lcImg = document.querySelector(".lc-chart-img");
    if (lcImg) {
        const newTheme = useDarkMode ? "dark" : "light";
        lcImg.src = lcImg.src.replace(/theme=[^&]+/, `theme=${newTheme}`);
    }

    /* Update particle system colors to match theme */
    if (window.ParticleSystem) {
        window.ParticleSystem.setTheme(useDarkMode);
    }

    if (!toggle) {
        return;
    }

    toggle.setAttribute("aria-label", useDarkMode ? "Switch to light mode" : "Switch to dark mode");
    toggle.checked = useDarkMode;
}

function initMobileNav() {
    const header = document.querySelector(".site-header");
    const toggle = document.querySelector(".nav-toggle");
    const nav = document.getElementById("site-nav");

    if (!header || !toggle || !nav) {
        return;
    }

    const closeNav = () => {
        header.classList.remove("nav-open");
        toggle.setAttribute("aria-expanded", "false");
    };

    toggle.addEventListener("click", () => {
        const isOpen = header.classList.toggle("nav-open");
        toggle.setAttribute("aria-expanded", String(isOpen));
    });

    nav.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", closeNav);
    });

    window.addEventListener("resize", () => {
        if (window.innerWidth > 720) {
            closeNav();
        }
    });
}

function initTypingEffect(reducedMotion) {
    const target = document.querySelector(".typing-target");
    if (!target) {
        return;
    }

    const fullText = target.textContent.trim();

    if (reducedMotion) {
        target.textContent = fullText;
        target.classList.add("is-complete");
        return;
    }

    target.textContent = "";

    let index = 0;
    const tick = () => {
        if (index < fullText.length) {
            target.textContent += fullText.charAt(index);
            index += 1;
            window.setTimeout(tick, 28);
            return;
        }

        target.classList.add("is-complete");
    };

    window.setTimeout(tick, 800);
}

/* ── Staggered Reveal Animations ── */
function initRevealAnimations(reducedMotion) {
    const revealItems = document.querySelectorAll(".reveal");

    if (reducedMotion) {
        revealItems.forEach((item) => item.classList.add("active"));
        return;
    }

    /* Group reveals inside the same container for stagger */
    const groups = new Map();

    revealItems.forEach((item) => {
        const parent = item.closest('.card-grid, .highlights-grid, .timeline, .tech-logo-grid, .tech-cluster-grid, .contact-links') || item.parentElement;
        if (!groups.has(parent)) {
            groups.set(parent, []);
        }
        groups.get(parent).push(item);
    });

    /* Assign stagger delay to siblings inside grids / lists */
    groups.forEach((items) => {
        if (items.length > 1) {
            items.forEach((item, i) => {
                item.style.transitionDelay = `${i * 80}ms`;
                /* Reset delay after reveal so hover transitions aren't affected */
                item.addEventListener('transitionend', function handler(e) {
                    if (e.propertyName === 'transform') {
                        item.style.transitionDelay = '0ms';
                        item.removeEventListener('transitionend', handler);
                    }
                });
            });
        }
    });

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("active");
                    observer.unobserve(entry.target);
                }
            });
        },
        {
            threshold: 0.12,
            rootMargin: "0px 0px -40px 0px"
        }
    );

    revealItems.forEach((item) => observer.observe(item));
}

function initSectionTransitions(reducedMotion) {
    const sections = document.querySelectorAll(".hero-section, .content-section");

    if (!sections.length) {
        return;
    }

    if (reducedMotion) {
        sections.forEach((section) => section.classList.add("section-in-view"));
        return;
    }

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("section-in-view");
                    observer.unobserve(entry.target);
                }
            });
        },
        {
            threshold: 0.16,
            rootMargin: "0px 0px -12% 0px"
        }
    );

    sections.forEach((section) => observer.observe(section));
}


/* ── Profile Photo Holographic Tilt ── */
function initProfileTilt(reducedMotion) {
    const wrapper = document.getElementById("hero-profile-tilt");
    if (!wrapper) return;

    const maxTilt = 20;
    const maxPop = 25;

    if (reducedMotion) {
        wrapper.addEventListener("mouseenter", () => wrapper.classList.add("tilt-active"));
        wrapper.addEventListener("mouseleave", () => {
            wrapper.classList.remove("tilt-active");
            wrapper.style.transform = "";
        });
        return;
    }

    wrapper.addEventListener("mouseenter", () => {
        wrapper.classList.add("tilt-active");
    });

    wrapper.addEventListener("mousemove", (e) => {
        const rect = wrapper.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;
        const rotateY = (x - 0.5) * maxTilt * 2;
        const rotateX = (0.5 - y) * maxTilt * 2;
        const popZ = maxPop;
        wrapper.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(${popZ}px) scale(1.08)`;
    });

    wrapper.addEventListener("mouseleave", () => {
        wrapper.classList.remove("tilt-active");
        wrapper.style.transform = "perspective(800px) rotateX(0deg) rotateY(0deg) translateZ(0px) scale(1)";
    });
}

/* ── Button Sparkle Effect ── */
function initButtonSparkles(reducedMotion) {
    const buttons = document.querySelectorAll('.primary-button, .secondary-button');
    if (!buttons.length || reducedMotion) return;

    const sparkleSymbols = ['✦', '✧', '·', '✶', '⋆'];

    buttons.forEach((btn) => {
        let rafId = null;
        let lastSpawn = 0;

        btn.addEventListener('mousemove', (e) => {
            const now = performance.now();
            if (now - lastSpawn < 60) return;
            lastSpawn = now;

            if (rafId) cancelAnimationFrame(rafId);
            rafId = requestAnimationFrame(() => {
                const rect = btn.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const count = 2 + Math.floor(Math.random() * 2);

                for (let i = 0; i < count; i++) {
                    createSparkle(btn, x, y, sparkleSymbols);
                }
            });
        });

        btn.addEventListener('mouseleave', () => {
            if (rafId) cancelAnimationFrame(rafId);
        });
    });
}

function createSparkle(container, x, y, symbols) {
    const el = document.createElement('span');
    el.classList.add('sparkle');
    el.textContent = symbols[Math.floor(Math.random() * symbols.length)];

    const dx = (Math.random() - 0.5) * 50;
    const dy = -20 - Math.random() * 40;
    const rot = (Math.random() - 0.5) * 360;

    el.style.setProperty('--sx', '0px');
    el.style.setProperty('--sy', '0px');
    el.style.setProperty('--dx', dx + 'px');
    el.style.setProperty('--dy', dy + 'px');
    el.style.setProperty('--rot', rot + 'deg');
    el.style.left = x + 'px';
    el.style.top = y + 'px';

    container.appendChild(el);
    el.addEventListener('animationend', () => el.remove());
}

/* ── Hero Stats Count-Up ── */
function initHeroStats(reducedMotion) {
    const stats = document.querySelectorAll('.hero-stat-number[data-target]');
    if (!stats.length) return;

    const duration = reducedMotion ? 0 : 1400;

    const animateStat = (el) => {
        const target = parseFloat(el.dataset.target);
        const isDecimal = el.dataset.decimal === 'true';
        const startTime = performance.now();

        if (duration === 0) {
            el.textContent = isDecimal ? target.toFixed(1) : target;
            return;
        }

        const step = (now) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            /* Ease-out cubic for a smooth deceleration */
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = eased * target;

            el.textContent = isDecimal ? current.toFixed(1) : Math.floor(current);

            if (progress < 1) {
                requestAnimationFrame(step);
            }
        };

        requestAnimationFrame(step);
    };

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    animateStat(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        },
        { threshold: 0.5 }
    );

    stats.forEach((stat) => observer.observe(stat));
}

/* ── Cursor Glow ── */
function initCursorGlow(reducedMotion) {
    const glow = document.getElementById("cursor-glow");
    const heroSection = document.querySelector(".hero-section");
    if (!glow || !heroSection || reducedMotion) return;

    let isVisible = false;
    let rafId = null;
    let targetX = 0, targetY = 0, currentX = 0, currentY = 0;

    function lerp(start, end, factor) {
        return start + (end - start) * factor;
    }

    function animate() {
        currentX = lerp(currentX, targetX, 0.08);
        currentY = lerp(currentY, targetY, 0.08);
        glow.style.left = currentX + "px";
        glow.style.top = currentY + "px";
        if (isVisible) rafId = requestAnimationFrame(animate);
    }

    document.addEventListener("mousemove", function(e) {
        const rect = heroSection.getBoundingClientRect();
        if (e.clientY < rect.bottom + 100 && e.clientY > rect.top - 100) {
            if (!isVisible) {
                isVisible = true;
                glow.classList.add("active");
                animate();
            }
            targetX = e.clientX;
            targetY = e.clientY;
        } else {
            if (isVisible) {
                isVisible = false;
                glow.classList.remove("active");
                if (rafId) cancelAnimationFrame(rafId);
            }
        }
    });

    document.addEventListener("mouseleave", function() {
        isVisible = false;
        glow.classList.remove("active");
        if (rafId) cancelAnimationFrame(rafId);
    });
}

/* ── Magnetic Hover on Glass Cards ── */
function initMagneticHover(reducedMotion) {
    if (reducedMotion) return;

    const cards = document.querySelectorAll(".glass-card");
    cards.forEach(function(card) {
        let rafId = null;

        card.addEventListener("mouseenter", function() {
            card.classList.add("magnetic-active");
        });

        card.addEventListener("mousemove", function(e) {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const moveX = ((x - centerX) / centerX) * 3;
            const moveY = ((y - centerY) / centerY) * 3;

            if (rafId) cancelAnimationFrame(rafId);
            rafId = requestAnimationFrame(function() {
                card.style.transform = "translateY(-5px) perspective(800px) rotateX(" + (-moveY) + "deg) rotateY(" + moveX + "deg) scale(1.01)";
            });
        });

        card.addEventListener("mouseleave", function() {
            if (rafId) cancelAnimationFrame(rafId);
            card.classList.remove("magnetic-active");
            card.style.transform = "translateY(0) perspective(800px) rotateX(0deg) rotateY(0deg) scale(1)";
            // Reset to default after transition completes
            function onTransitionEnd(e) {
                if (e.propertyName === 'transform' && !card.classList.contains('magnetic-active')) {
                    card.style.transform = '';
                    card.removeEventListener('transitionend', onTransitionEnd);
                }
            }
            card.addEventListener('transitionend', onTransitionEnd);
        });
    });
}

/* ── Smooth Scroll with Enabling Class ── */
function initSmoothScroll() {
    document.documentElement.classList.add("smooth-scroll");
}

/* ── System Health Bar ── */
function initSystemHealth() {
    const apiItem = document.getElementById("health-api");
    const responseItem = document.getElementById("health-response");
    const responseText = document.getElementById("health-response-text");

    if (!apiItem) return;

    checkApiHealth(apiItem, responseItem, responseText);

    // Poll every 60 seconds
    setInterval(() => {
        checkApiHealth(apiItem, responseItem, responseText);
    }, 60000);


}

function checkApiHealth(apiItem, responseItem, responseText) {
    const dot = apiItem.querySelector(".badge-dot");
    const responseDot = responseItem ? responseItem.querySelector(".badge-dot") : null;

    apiItem.className = "health-bar-item checking";
    dot.className = "badge-dot yellow";
    apiItem.innerHTML = '<span class="badge-dot yellow pulse"></span> API: Checking...';

    const startTime = performance.now();

    fetch("/api/health", { method: "GET", cache: "no-cache" })
        .then((res) => {
            return res.json().then(function(data) {
                const elapsed = Math.round(performance.now() - startTime);

                if (res.ok) {
                    apiItem.className = "health-bar-item online";
                    apiItem.innerHTML = '<span class="badge-dot green"></span> API: Online';

                    // Update response time
                    if (responseText) {
                        var colorClass = elapsed < 200 ? "green" : elapsed < 500 ? "yellow" : "red";
                        responseText.textContent = "Response: " + elapsed + "ms";
                        if (responseDot) responseDot.className = "badge-dot " + colorClass;
                    }

                    // Update real uptime from the server
                    var uptimeItem = document.getElementById("health-uptime");
                    var uptimeText = document.getElementById("health-uptime-text");
                    if (uptimeText && data.uptimeHuman) {
                        uptimeText.textContent = "Uptime: " + data.uptimeHuman;
                        if (uptimeItem) {
                            uptimeItem.className = "health-bar-item online";
                            var uptimeDot = uptimeItem.querySelector(".badge-dot");
                            if (uptimeDot) uptimeDot.className = "badge-dot green pulse";
                        }
                    }
                } else {
                    apiItem.className = "health-bar-item offline";
                    apiItem.innerHTML = '<span class="badge-dot red"></span> API: Error';
                }
            });
        })
        .catch(() => {
            apiItem.className = "health-bar-item offline";
            apiItem.innerHTML = '<span class="badge-dot red"></span> API: Offline';
        });
}

function checkExternalStatus(elementId, url) {
    const badge = document.getElementById(elementId);
    if (!badge) return;

    const dot = badge.querySelector(".badge-dot");
    const text = badge.querySelector(".badge-text");

    badge.className = "status-badge checking";
    if (dot) {
        dot.className = "badge-dot pulse";
    }
    if (text) text.textContent = "Checking...";

    // Use the backend proxy to truly check site availability
    fetch("/api/check-site?url=" + encodeURIComponent(url))
        .then(function(res) { return res.json(); })
        .then(function(data) {
            if (data.status === "online") {
                badge.className = "status-badge online";
                if (dot) dot.className = "badge-dot";
                if (text) {
                    var label = data.responseTime < 1000
                        ? "Online (" + data.responseTime + "ms)"
                        : "Online (" + (data.responseTime / 1000).toFixed(1) + "s)";
                    text.textContent = label;
                }
            } else {
                badge.className = "status-badge offline";
                if (dot) dot.className = "badge-dot";
                if (text) text.textContent = "Unreachable";
            }
        })
        .catch(function() {
            badge.className = "status-badge offline";
            if (dot) dot.className = "badge-dot";
            if (text) text.textContent = "Unknown";
        });
}

/* ── Animated Score Badges with Real Lighthouse Scores ── */
function initScoreAnimations(reducedMotion) {
    var badges = document.querySelectorAll(".score-num[data-lighthouse-url]");
    if (!badges.length) return;

    var pendingCount = badges.length;
    var animatingStarted = false;

    // Fallback scores if the Lighthouse API is unreachable
    var fallbackScores = {
        "lighthouse-score": 85,
        "https://devtool-sxvb.onrender.com/": 78,
        "https://devmind-s3v2.onrender.com/": 72,
        "https://stock-valuation-1.onrender.com/": 80
    };

    // Local function — shares closure scope with state variables above
    function tryStartAnimations() {
        if (animatingStarted) return;
        if (pendingCount > 0) return;
        animatingStarted = true;

        var observer = new IntersectionObserver(
            function(entries) {
                entries.forEach(function(entry) {
                    if (entry.isIntersecting) {
                        animateScore(entry.target, reducedMotion);
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.4 }
        );

        badges.forEach(function(el) {
            var target = parseInt(el.dataset.target, 10);
            if (isNaN(target) || target <= 0) {
                el.textContent = "?";
            } else {
                observer.observe(el);
            }
        });
    }

    badges.forEach(function(el) {
        var url = el.dataset.lighthouseUrl;
        var targetUrl = (url === "SELF") ? window.location.origin : url;

        fetch("/api/lighthouse?url=" + encodeURIComponent(targetUrl) + "&strategy=desktop")
            .then(function(res) { return res.json(); })
            .then(function(data) {
                if (data.score !== undefined) {
                    el.dataset.target = data.score;
                } else {
                    // API responded but no score — use fallback
                    el.dataset.target = fallbackScores[url] || fallbackScores[targetUrl] || 75;
                }
                pendingCount--;
                tryStartAnimations();
            })
            .catch(function() {
                // API unreachable — use fallback
                el.dataset.target = fallbackScores[url] || fallbackScores[targetUrl] || 75;
                pendingCount--;
                tryStartAnimations();
            });
    });
}

function animateScore(el, reducedMotion) {
    var target = parseInt(el.dataset.target, 10);
    if (isNaN(target) || target <= 0) {
        el.textContent = "?";
        return;
    }

    var duration = reducedMotion ? 0 : 1200;
    var startTime = performance.now();

    if (duration === 0) {
        el.textContent = target;
        return;
    }

    el.textContent = "0";

    function step(now) {
        var elapsed = now - startTime;
        var progress = Math.min(elapsed / duration, 1);
        var eased = 1 - Math.pow(1 - progress, 3);
        var current = Math.round(eased * target);

        el.textContent = current;

        if (progress < 1) {
            requestAnimationFrame(step);
        } else {
            el.textContent = target;
        }
    }

    requestAnimationFrame(step);
}

/* ── Timeline Animations ── */
function initTimelineAnimations(reducedMotion) {
    const timeline = document.querySelector('.timeline');
    if (!timeline) return;

    if (reducedMotion) {
        timeline.classList.add('visible');
        timeline.querySelectorAll('.timeline-item').forEach((item) => item.classList.add('visible'));
        return;
    }

    const timelineObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                timeline.classList.add('visible');
                timelineObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.2 });

    timelineObserver.observe(timeline);

    /* Staggered dot animation */
    const items = timeline.querySelectorAll('.timeline-item');
    const itemObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                itemObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.4, rootMargin: '0px 0px -20px 0px' });

    items.forEach((item, i) => {
        item.style.transitionDelay = `${i * 120}ms`;
        /* Apply stagger delay directly to dot for proper cascade */
        const dot = item.querySelector('.timeline-dot');
        if (dot) dot.style.transitionDelay = `${i * 120}ms`;
        itemObserver.observe(item);
    });
}
