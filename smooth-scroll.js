(function (global) {
    function initSmoothScroll(options = {}) {
        const SmoothConfig = {
            DEBUG: false,
            MOBILE_BREAKPOINT: 768,
            ease: 0.06,           
            stopThreshold: 0.05,  
            scrollMult: 1.5,          // intensité du scroll
            minPageHeightRatio: 1.05,
            offset: 0,
            ...options,               // options personnalisées (peut surcharger scrollMult)
        };

        let enabled = false;
        let current = 0;
        let target = 0;
        let rafId = null;

        const clamp = (v, min, max) => Math.max(min, Math.min(v, max));
        const round = v => Math.round(v * 100) / 100;

        function updateScrollBehavior() {
            const behavior = window.innerWidth < SmoothConfig.MOBILE_BREAKPOINT ? "" : "auto";
            document.documentElement.style.scrollBehavior = behavior;
            document.body.style.scrollBehavior = behavior;
        }

        function enable() {
            if (enabled) return;
            enabled = true;

            current = target = window.scrollY;

            window.addEventListener("wheel", onWheel, { passive: false });
            window.addEventListener("scroll", syncScroll, { passive: true });
        }

        function disable() {
            if (!enabled) return;
            enabled = false;

            window.removeEventListener("wheel", onWheel);
            window.removeEventListener("scroll", syncScroll);

            if (rafId) cancelAnimationFrame(rafId);
            rafId = null;
        }

        function onWheel(e) {
            if (e.ctrlKey) return;

            e.preventDefault();

            const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
            // utilisation de scrollMult pour ajuster l'intensité du scroll
            target = clamp(target + e.deltaY * SmoothConfig.scrollMult, 0, maxScroll);

            if (!rafId) render();
        }

        function syncScroll() {
            if (!rafId) current = target = window.scrollY;
        }

        function render() {
            if (!enabled) return;

            const diff = target - current;

            if (Math.abs(diff) < SmoothConfig.stopThreshold) {
                current = target;
                window.scrollTo(0, current);
                rafId = null;
                return;
            }

            current += diff * SmoothConfig.ease;
            window.scrollTo(0, round(current));

            rafId = requestAnimationFrame(render);
        }

        function checkState() {
            const isMobile = window.innerWidth < SmoothConfig.MOBILE_BREAKPOINT;
            const pageTooShort =
                document.documentElement.scrollHeight <=
                window.innerHeight * SmoothConfig.minPageHeightRatio;

            if (isMobile || pageTooShort) {
                disable();
                return;
            }

            enable();
        }

        function setupAnchors() {
            document.querySelectorAll('a[href^="#"]').forEach(a => {
                a.addEventListener("click", e => {
                    const el = document.querySelector(a.getAttribute("href"));
                    if (!el) return;

                    if (window.innerWidth < SmoothConfig.MOBILE_BREAKPOINT) return;

                    e.preventDefault();
                    if (rafId) cancelAnimationFrame(rafId);

                    current = target = window.scrollY;
                    target = el.getBoundingClientRect().top + window.scrollY + SmoothConfig.offset;

                    render();
                });
            });
        }

        updateScrollBehavior();
        checkState();
        setupAnchors();

        window.addEventListener("resize", () => {
            clearTimeout(window.__smoothResizeTimer);
            window.__smoothResizeTimer = setTimeout(() => {
                updateScrollBehavior();
                checkState();
            }, 120);
        });
    }

    global.initSmoothScroll = initSmoothScroll;

})(window);

// Exemple : augmentation de l'intensité du scroll
window.addEventListener('load', () => {
    initSmoothScroll({ scrollMult: 1 }); // Valeur plus élevée = scroll plus rapide
});
