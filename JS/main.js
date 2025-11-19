
document.addEventListener('DOMContentLoaded', () => {
  const wrapper = document.querySelector('.catalog-wrapper');
  const toggleBtn = document.getElementById('catalog-toggle');
  const dropdown = document.getElementById('catalog-dropdown');
  if (!wrapper || !toggleBtn || !dropdown) return;
  toggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    wrapper.classList.toggle('open');
  });
  document.addEventListener('click', (e) => {
    if (!wrapper.contains(e.target)) wrapper.classList.remove('open');
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') wrapper.classList.remove('open');
  });
});
