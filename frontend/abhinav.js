document.addEventListener("DOMContentLoaded", () => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    initThemeToggle();
    initMobileNav();
    initTypingEffect(reducedMotion);
    initSectionTransitions(reducedMotion);
    initRevealAnimations(reducedMotion);
    initContactForm();

    initLeetCodeStats();
});

const CONTACT_API_URL = window.location.origin + "/api/feedback";

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

function initRevealAnimations(reducedMotion) {
    const revealItems = document.querySelectorAll(".reveal");

    if (reducedMotion) {
        revealItems.forEach((item) => item.classList.add("active"));
        return;
    }

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
            threshold: 0.16,
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


function initLeetCodeStats() {
    const lcSection = document.querySelector('.leetcode-stats');
    if (!lcSection) return;

    fetch(window.location.origin + '/api/leetcode')
        .then(res => res.ok ? res.json() : null)
        .then(stats => {
            if (!stats || !stats.total) return;

            const total = lcSection.querySelector('.lc-total-number');
            if (total) total.textContent = stats.total;

            const easyCount = lcSection.querySelector('.lc-easy-fill');
            const mediumCount = lcSection.querySelector('.lc-medium-fill');
            const hardCount = lcSection.querySelector('.lc-hard-fill');

            const easyLabel = lcSection.querySelector('.lc-easy-fill')?.closest('.lc-bar-row')?.querySelector('.lc-count');
            const mediumLabel = lcSection.querySelector('.lc-medium-fill')?.closest('.lc-bar-row')?.querySelector('.lc-count');
            const hardLabel = lcSection.querySelector('.lc-hard-fill')?.closest('.lc-bar-row')?.querySelector('.lc-count');

            if (easyCount) easyCount.style.width = ((stats.easy / stats.total) * 100).toFixed(0) + '%';
            if (mediumCount) mediumCount.style.width = ((stats.medium / stats.total) * 100).toFixed(0) + '%';
            if (hardCount) hardCount.style.width = ((stats.hard / stats.total) * 100).toFixed(0) + '%';

            if (easyLabel) easyLabel.textContent = stats.easy;
            if (mediumLabel) mediumLabel.textContent = stats.medium;
            if (hardLabel) hardLabel.textContent = stats.hard;
        })
        .catch(() => {});
}

function initContactForm() {
    const form = document.getElementById("contact-form");
    const alertSlot = document.getElementById("form-alert-slot");
    if (!form) {
        return;
    }

    const showFormAlert = (variant, title, message) => {
        if (!alertSlot) {
            return;
        }

        alertSlot.innerHTML = `
            <div class="alert alert-${variant} alert-dismissible fade show" role="alert">
                <div class="alert-heading">${title}</div>
                <p class="alert-body">${message}</p>
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        `;

        const alertElement = alertSlot.querySelector(".alert");
        if (!alertElement) {
            return;
        }

        if (window.bootstrap?.Alert) {
            try {
                const alertInstance = new window.bootstrap.Alert(alertElement);
                window.setTimeout(() => {
                    if (alertElement && alertElement.isConnected) {
                        alertInstance.close();
                    }
                }, 5000);
            } catch (_) {
                window.setTimeout(() => {
                    if (alertElement && alertElement.isConnected) {
                        alertElement.remove();
                    }
                }, 5000);
            }
        } else {
            window.setTimeout(() => {
                if (alertElement && alertElement.isConnected) {
                    alertElement.remove();
                }
            }, 5000);
        }
    };

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const nameInput = document.getElementById("name");
        const emailInput = document.getElementById("email");
        const messageInput = document.getElementById("message");
        const submitButton = form.querySelector('button[type="submit"]');

        const payload = {
            name: nameInput?.value.trim() || "",
            email: emailInput?.value.trim() || "",
            message: messageInput?.value.trim() || ""
        };

        if (!payload.name || !payload.email || !payload.message) {
            showFormAlert("danger", "Missing details", "Please fill in your name, email, and message.");
            return;
        }

        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = "Sending...";
        }

        try {
            const response = await fetch(CONTACT_API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });

            const responseType = response.headers.get("content-type") || "";
            const result = responseType.includes("application/json")
                ? await response.json()
                : {};

            if (!response.ok || !result.saved) {
                throw new Error(result.message || "Something went wrong.");
            }

            showFormAlert(
                "success",
                "Message sent",
                result.message || `Thank you, ${payload.name}! Your message has been received.`
            );
            form.reset();
        } catch (error) {
            showFormAlert("danger", "Unable to send", error.message || "Unable to send feedback right now.");
        } finally {
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = "Send Message";
            }
        }
    });
}
