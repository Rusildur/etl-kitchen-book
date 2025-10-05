/* Делает кликабельным заголовок в шапке (ETL Kitchen Book) */
(function () {
  // Поддержка «instant loading» в Material
  (window.document$ || { subscribe: (cb) => document.addEventListener('DOMContentLoaded', cb) })
    .subscribe(function () {
      var title = document.querySelector('.md-header__title');
      if (!title || title.dataset.clickable === 'true') return;

      // Ссылка на дом: берём ту же, что у логотипа (она всегда правильная)
      var home = document.querySelector('a.md-logo');
      var href = home ? home.getAttribute('href') : '/';

      title.style.cursor = 'pointer';
      title.dataset.clickable = 'true';
      title.addEventListener('click', function () {
        window.location.href = href;
      });
    });
})();
