const statusEl = document.querySelector('[data-status]');
const versionEl = document.querySelector('[data-version]');
const navItems = document.querySelectorAll('.nav-item');

navItems.forEach((item) => {
  item.addEventListener('click', () => {
    navItems.forEach((button) => {
      button.classList.remove('active');
    });
    item.classList.add('active');
  });
});

const updateStatus = () => {
  if (window.__TAURI__?.core) {
    statusEl.textContent = 'Connected to desktop core';
    return;
  }

  statusEl.textContent = 'Running in static preview mode';
  versionEl.textContent = 'v4.0.0';
};

updateStatus();
