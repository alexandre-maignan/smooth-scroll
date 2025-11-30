function initSmoothScroll(options = {}) {
    const SmoothConfig = {
        DEBUG: false,
        MOBILE_BREAKPOINT: 768,
        ease: 0.03,
        scrollMult: 1,
        stopThreshold: 0.1,
        minPageHeightRatio: 1.05,
        ...options
    };

    let smoothEnabled = false;
    let current = 0;
    let target = 0;
    let rafId = null;
    let draggingScrollbar = false;

    const clamp = (v, min, max) => Math.max(min, Math.min(v, max));
    const log = (...args) => { if (SmoothConfig.DEBUG) console.log('[smooth]', ...args); };

    function updateScrollBehavior() {
        if (window.innerWidth < SmoothConfig.MOBILE_BREAKPOINT) {
            document.documentElement.style.scrollBehavior = "";
            document.body.style.scrollBehavior = "";
        } else {
            document.documentElement.style.scrollBehavior = "auto";
            document.body.style.scrollBehavior = "auto";
        }
    }

    function enableSmooth() {
        if (smoothEnabled) return;
        smoothEnabled = true;
        current = window.scrollY;
        target = window.scrollY;
        window.addEventListener('wheel', onWheel, { passive: false });
        window.addEventListener('scroll', onNativeScroll, { passive: true });
        log('Smooth enabled');
    }

    function disableSmooth() {
        if (!smoothEnabled) return;
        smoothEnabled = false;
        window.removeEventListener('wheel', onWheel);
        window.removeEventListener('scroll', onNativeScroll);
        if (rafId) cancelAnimationFrame(rafId);
        rafId = null;
        log('Smooth disabled');
    }

    // --- Stop animation when dragging scrollbar ---
    document.addEventListener("mousedown", () => {
        draggingScrollbar = true;
        if (rafId) cancelAnimationFrame(rafId);
        rafId = null;
    });

    document.addEventListener("mouseup", () => {
        draggingScrollbar = false;
        current = target = window.scrollY;
    });

    function onWheel(e) {
        if (!smoothEnabled || draggingScrollbar) return;
        if (e.ctrlKey) return;
        e.preventDefault();

        const maxScroll = Math.max(
            document.body.scrollHeight,
            document.documentElement.scrollHeight
        ) - window.innerHeight;

        target = clamp(target + e.deltaY * SmoothConfig.scrollMult, 0, maxScroll);

        if (!rafId) render();
    }

    function onNativeScroll() {
        if (!rafId || draggingScrollbar) {
            target = current = window.scrollY;
        }
    }

    // --- NEW: STOP SMOOTH SCROLL WHEN USING KEYBOARD (arrows, pgup, pgdn, etc) ---
    window.addEventListener("keydown", (e) => {
        const keys = [
            "ArrowUp",
            "ArrowDown",
            "PageUp",
            "PageDown",
            "Home",
            "End",
            "Space"
        ];

        if (!keys.includes(e.code)) return;

        // Stop the animation instantly
        if (rafId) cancelAnimationFrame(rafId);
        rafId = null;

        // Sync to native scroll position
        current = target = window.scrollY;
    });

    function render() {
        if (!smoothEnabled || draggingScrollbar) return;

        const diff = target - current;

        if (Math.abs(diff) < SmoothConfig.stopThreshold) {
            current = target;
            rafId = null;
            return;
        }

        current += diff * SmoothConfig.ease;
        window.scrollTo({ top: Math.round(current), behavior: "auto" });

        rafId = requestAnimationFrame(render);
    }

    function checkDevice() {
        const pageHeight = Math.max(
            document.body.scrollHeight,
            document.documentElement.scrollHeight
        );

        if (pageHeight <= window.innerHeight * SmoothConfig.minPageHeightRatio) {
            disableSmooth();
            return false;
        }
        if (window.innerWidth < SmoothConfig.MOBILE_BREAKPOINT) {
            disableSmooth();
            return false;
        }
        enableSmooth();
        return true;
    }

    updateScrollBehavior();
    checkDevice();

    window.addEventListener("resize", () => {
        clearTimeout(window.__smooth_resize_timer);
        window.__smooth_resize_timer = setTimeout(() => {
            updateScrollBehavior();
            checkDevice();
        }, 120);
    });

    // Internal links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            const targetEl = document.querySelector(targetId);
            if (!targetEl) return;

            if (window.innerWidth < SmoothConfig.MOBILE_BREAKPOINT) {
                return;
            }

            e.preventDefault();

            if (rafId) cancelAnimationFrame(rafId);
            rafId = null;

            current = target = window.scrollY;
            target = targetEl.getBoundingClientRect().top + window.scrollY;

            if (!rafId) render();
        });
    });
}

initSmoothScroll({
    DEBUG: false,
    ease: 0.06,
    scrollMult: 1.2
});
