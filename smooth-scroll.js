function initSmoothScroll(options = {}) {
    const SmoothConfig = {
        DEBUG: false,
        MOBILE_BREAKPOINT: 768,
        ease: 0.2,
        scrollMult: 1,
        stopThreshold: 0.1,
        minPageHeightRatio: 1.05,
        ...options
    };

    let smoothEnabled = false;
    let current = window.scrollY;
    let target = window.scrollY;
    let rafId = null;
    let maxScroll = 0;

    const clamp = (v, min, max) => Math.max(min, Math.min(v, max));
    const log = (...args) => { if (SmoothConfig.DEBUG) console.log('[smooth]', ...args); };

    // Pré-calculer le scrollHeight
    const updateMaxScroll = () => {
        maxScroll = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight) - window.innerHeight;
    };

    const updateScrollBehavior = () => {
        const behavior = window.innerWidth < SmoothConfig.MOBILE_BREAKPOINT ? "" : "auto";
        document.documentElement.style.scrollBehavior = behavior;
        document.body.style.scrollBehavior = behavior;
    };

    const enableSmooth = () => {
        if (smoothEnabled) return;
        smoothEnabled = true;
        current = target = window.scrollY;
        updateMaxScroll();
        window.addEventListener('wheel', onWheel, { passive: false });
        window.addEventListener('scroll', onNativeScroll, { passive: true });
        log('Smooth enabled');
    };

    const disableSmooth = () => {
        if (!smoothEnabled) return;
        smoothEnabled = false;
        window.removeEventListener('wheel', onWheel);
        window.removeEventListener('scroll', onNativeScroll);
        if (rafId) cancelAnimationFrame(rafId);
        rafId = null;
        log('Smooth disabled');
    };

    const onWheel = e => {
        if (e.ctrlKey) return;
        e.preventDefault();
        target = clamp(target + e.deltaY * SmoothConfig.scrollMult, 0, maxScroll);
        if (!rafId) render();
    };

    const onNativeScroll = () => {
        if (!rafId) target = current = window.scrollY;
    };

    const render = () => {
        if (!smoothEnabled) return;
        const diff = target - current;
        if (Math.abs(diff) < SmoothConfig.stopThreshold) {
            current = target;
            rafId = null;
            return;
        }
        current += diff * SmoothConfig.ease;
        window.scrollTo(0, Math.round(current));
        rafId = requestAnimationFrame(render);
    };

    const checkDevice = () => {
        const pageHeight = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
        if (pageHeight <= window.innerHeight * SmoothConfig.minPageHeightRatio || window.innerWidth < SmoothConfig.MOBILE_BREAKPOINT) {
            disableSmooth();
            return false;
        }
        enableSmooth();
        return true;
    };

    updateScrollBehavior();
    checkDevice();

    window.addEventListener("resize", () => {
        clearTimeout(window.__smooth_resize_timer);
        window.__smooth_resize_timer = setTimeout(() => {
            updateScrollBehavior();
            updateMaxScroll();
            checkDevice();
        }, 120);
    });

    // Smooth scroll pour les ancres internes
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const targetEl = document.querySelector(this.getAttribute('href'));
            if (!targetEl || window.innerWidth < SmoothConfig.MOBILE_BREAKPOINT) return;

            e.preventDefault();
            if (rafId) cancelAnimationFrame(rafId);
            current = target = window.scrollY;
            target = targetEl.getBoundingClientRect().top + window.scrollY;
            if (!rafId) render();
        });
    });
}

initSmoothScroll({
    DEBUG: false,
    ease: 0.06,
    scrollMult: 1.5
});
