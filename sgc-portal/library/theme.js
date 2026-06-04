// Shared theme toggle for SGC portal pages.
// Same localStorage key (sgc-theme) as start-here.html so preference
// carries across the portal automatically.
(function() {
  const KEY = 'sgc-theme';
  function apply(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const g = document.getElementById('themeGlyph');
    const l = document.getElementById('themeLabel');
    if (g) g.textContent = theme === 'light' ? '☀' : '☾';
    if (l) l.textContent = theme === 'light' ? 'Light' : 'Dark';
  }
  function toggle() {
    const cur = document.documentElement.getAttribute('data-theme') || 'dark';
    const next = cur === 'light' ? 'dark' : 'light';
    try { localStorage.setItem(KEY, next); } catch {}
    apply(next);
  }
  // Wire on DOM ready
  function init() {
    const btn = document.getElementById('themeToggle');
    if (btn) btn.addEventListener('click', toggle);
    try {
      const saved = localStorage.getItem(KEY);
      if (saved === 'light' || saved === 'dark') apply(saved);
      else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) apply('light');
      else apply('dark');
    } catch { apply('dark'); }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
