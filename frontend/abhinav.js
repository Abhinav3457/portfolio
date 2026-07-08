document.addEventListener("DOMContentLoaded", () => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    initThemeToggle();
    initMobileNav();
    initTypingEffect(reducedMotion);
    initSectionTransitions(reducedMotion);
    initRevealAnimations(reducedMotion);

    initLeetCodeStats(reducedMotion);
    initProfileTilt(reducedMotion);
    initButtonSparkles(reducedMotion);
    initTimelineAnimations(reducedMotion);
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

/* ── Smooth Number Counter ── */
function animateNumber(el, target, duration) {
    const start = 0;
    const startTime = performance.now();

    function tick(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        /* Ease-out cubic for smooth deceleration */
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(start + (target - start) * eased);
        el.textContent = current;

        if (progress < 1) {
            requestAnimationFrame(tick);
        }
    }

    requestAnimationFrame(tick);
}

/* ── LeetCode Stats with Animated Bars ── */
function initLeetCodeStats(reducedMotion) {
    const lcSection = document.querySelector('.leetcode-stats');
    if (!lcSection) return;

    /* Animate bar fills when section scrolls into view */
    const lcObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                lcObserver.unobserve(entry.target);
                fillBars();
            }
        });
    }, { threshold: 0.3 });

    lcObserver.observe(lcSection);

    function fillBars() {
        const fills = lcSection.querySelectorAll('.lc-bar-fill');
        fills.forEach((fill, i) => {
            const targetWidth = fill.style.width || '0%';
            fill.style.width = '0%';
            setTimeout(() => {
                fill.style.width = targetWidth;
            }, 200 + i * 150);
        });
    }

    fetch(window.location.origin + '/api/leetcode')
        .then(res => res.ok ? res.json() : null)
        .then(stats => {
            if (!stats || !stats.total) return;

            const total = lcSection.querySelector('.lc-total-number');
            if (total && !reducedMotion) {
                animateNumber(total, stats.total, 1400);
            } else if (total) {
                total.textContent = stats.total;
            }

            const easyFill = lcSection.querySelector('.lc-easy-fill');
            const mediumFill = lcSection.querySelector('.lc-medium-fill');
            const hardFill = lcSection.querySelector('.lc-hard-fill');

            const easyLabel = lcSection.querySelector('.lc-easy-fill')?.closest('.lc-bar-row')?.querySelector('.lc-count');
            const mediumLabel = lcSection.querySelector('.lc-medium-fill')?.closest('.lc-bar-row')?.querySelector('.lc-count');
            const hardLabel = lcSection.querySelector('.lc-hard-fill')?.closest('.lc-bar-row')?.querySelector('.lc-count');

            if (easyFill) easyFill.style.width = ((stats.easy / stats.total) * 100).toFixed(0) + '%';
            if (mediumFill) mediumFill.style.width = ((stats.medium / stats.total) * 100).toFixed(0) + '%';
            if (hardFill) hardFill.style.width = ((stats.hard / stats.total) * 100).toFixed(0) + '%';

            if (easyLabel && !reducedMotion) animateNumber(easyLabel, stats.easy, 1200);
            else if (easyLabel) easyLabel.textContent = stats.easy;
            if (mediumLabel && !reducedMotion) animateNumber(mediumLabel, stats.medium, 1200);
            else if (mediumLabel) mediumLabel.textContent = stats.medium;
            if (hardLabel && !reducedMotion) animateNumber(hardLabel, stats.hard, 1200);
            else if (hardLabel) hardLabel.textContent = stats.hard;
        })
        .catch(() => {});
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
