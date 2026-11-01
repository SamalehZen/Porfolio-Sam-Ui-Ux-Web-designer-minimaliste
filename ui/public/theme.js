try {
  if (localStorage.getItem('mikescv-cabin-dark') === '1') {
    document.documentElement.dataset.theme = 'dark'
  }
} catch (e) {}
