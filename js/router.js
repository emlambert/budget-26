const PAGES = ['overview', 'commitments', 'spending', 'allocation', 'investments', 'forecast'];

function showPage(name) {
  if (!PAGES.includes(name)) name = PAGES[0];
  PAGES.forEach(p => {
    document.getElementById(`page-${p}`).classList.toggle('active', p === name);
  });
  document.querySelectorAll('.pagenav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.page === name);
  });
  // Charts (Chart.js) sometimes render at zero width if their canvas was
  // display:none when created — nudge a resize once the page becomes visible.
  window.dispatchEvent(new Event('resize'));
  if (window.__resizeAllCharts) window.__resizeAllCharts();
}

function currentPageFromHash() {
  return (location.hash || '#overview').slice(1);
}

document.querySelectorAll('.pagenav-btn').forEach(btn => {
  btn.addEventListener('click', () => { location.hash = btn.dataset.page; });
});

window.addEventListener('hashchange', () => showPage(currentPageFromHash()));
showPage(currentPageFromHash());
