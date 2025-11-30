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
    let current = window.scrollY;
    let target = window.scrollY;
    let rafId = null;
    let draggingScrollbar = false;

    const clamp = (v, min, max) => Math.max(min, Math.min(v, max));
    const log = (...args) => { if (SmoothConfig.DEBUG) console.log('[smooth]', ...args); };

    // -----------------------
    // Core functions
    // -----------------------
    function updateScrollBehavior() {
        const behavior = window.innerWidth < SmoothConfig.MOBILE_BREAKPOINT ? "" : "auto";
        document.documentElement.style.scrollBehavior = behavior;
        document.body.style.scrollBehavior = behavior;
    }

    function enableSmooth() {
        if (smoothEnabled) return;
        smoothEnabled = true;
        current = target = window.scrollY;

        window.addEventListener('wheel', onWheel, { passive: false });
        window.addEventListener('scroll', onNativeScroll, { passive: true });

        log('Smooth enabled');
    }

    function disableSmooth() {
        if (!smoothEnabled) return;
        smoothEnabled = false;

        window.removeEventListener('wheel', onWheel);
        window.removeEventListener('scroll', onNativeScroll);

        if (rafId) {
            cancelAnimationFrame(rafId);
            rafId = null;
        }

        log('Smooth disabled');
    }

    // -----------------------
    // Event handlers
    // -----------------------
    const onWheel = e => {
        if (!smoothEnabled || draggingScrollbar || e.ctrlKey) return;

        e.preventDefault();

        const maxScroll = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight) - window.innerHeight;
        target = clamp(target + e.deltaY * SmoothConfig.scrollMult, 0, maxScroll);

        if (!rafId) render();
    };

    const onNativeScroll = () => {
        if (!rafId || draggingScrollbar) {
            current = target = window.scrollY;
        }
    };

    const onResize = () => {
        clearTimeout(window.__smooth_resize_timer);
        window.__smooth_resize_timer = setTimeout(() => {
            updateScrollBehavior();
            checkDevice();
        }, 120);
    };

    const onKeyDown = e => {
        const keys = ["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", "Space"];
        if (!keys.includes(e.code)) return;

        if (rafId) cancelAnimationFrame(rafId);
        rafId = null;

        current = target = window.scrollY;
    };

    // -----------------------
    // Render loop
    // -----------------------
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

    // -----------------------
    // Check if smooth should be enabled
    // -----------------------
    function checkDevice() {
        const pageHeight = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);

        if (pageHeight <= window.innerHeight * SmoothConfig.minPageHeightRatio || window.innerWidth < SmoothConfig.MOBILE_BREAKPOINT) {
            disableSmooth();
            return false;
        }

        enableSmooth();
        return true;
    }

    // -----------------------
    // Scroll links
    // -----------------------
    function handleInternalLinks() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                const targetId = this.getAttribute('href');
                const targetEl = document.querySelector(targetId);
                if (!targetEl) return;
                if (window.innerWidth < SmoothConfig.MOBILE_BREAKPOINT) return;

                e.preventDefault();

                if (rafId) cancelAnimationFrame(rafId);
                rafId = null;

                current = target = window.scrollY;
                target = targetEl.getBoundingClientRect().top + window.scrollY;

                render();
            });
        });
    }

    // -----------------------
    // Scrollbar dragging detection
    // -----------------------
    document.addEventListener("mousedown", () => {
        draggingScrollbar = true;
        if (rafId) cancelAnimationFrame(rafId);
        rafId = null;
    });

    document.addEventListener("mouseup", () => {
        draggingScrollbar = false;
        current = target = window.scrollY;
    });

    // -----------------------
    // Initialization
    // -----------------------
    updateScrollBehavior();
    checkDevice();
    handleInternalLinks();

    window.addEventListener("resize", onResize);
    window.addEventListener("keydown", onKeyDown);
}
