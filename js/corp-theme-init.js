// Anti-flash theme init for corp pages.
// Loaded as the FIRST child of <body> on every corp-*.html so the class is
// applied before any content paints. Post-load toggle persistence lives in
// corp-topbar.js; this file exists purely to prevent a light-flash when the
// saved preference is 'light' and the page's default is dark.
(function () {
    try {
        if (localStorage.getItem('corpThemePref') === 'light') {
            document.body.classList.add('light-mode');
        }
    } catch (e) { /* private mode — default dark */ }
})();
