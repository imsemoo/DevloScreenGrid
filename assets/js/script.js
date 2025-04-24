$(function () {



  

  // Auto-hide header: show on hover near bottom
  const headerEl = document.querySelector('header');
  const hoverArea = document.getElementById('hoverArea');

  hoverArea.addEventListener('mouseenter', () => {
    headerEl.classList.add('visible');
  });
  hoverArea.addEventListener('mouseleave', () => {
    headerEl.classList.remove('visible');
  });

  // Also keep it visible if you hover over the header itself
  headerEl.addEventListener('mouseenter', () => {
    headerEl.classList.add('visible');
  });
  headerEl.addEventListener('mouseleave', () => {
    // only hide if not hovering the hoverArea
    if (!hoverArea.matches(':hover')) {
      headerEl.classList.remove('visible');
    }
  });
});