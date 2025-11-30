## Utilisation du Smooth Scroll

Pour activer le scroll fluide , il suffit de copier coller ce code à la fin du body :

```html

<script src="https://cdn.jsdelivr.net/gh/alexandre-maignan/smooth-scroll/smooth-scroll.js"></script>
<script>

initSmoothScroll({
    ease: 0.06,             // vitesse du lissage du scroll (plus haut = plus rapide)
    scrollMult: 1.5,         // intensité de la molette (1 = normal)

    MOBILE_BREAKPOINT: 768,     // désactive le script sous 768px (mobile)
    minPageHeightRatio: 1.05,   // désactive si page trop petite

    DEBUG: false,               // active les logs console si besoin
});
</script>

```
