document.addEventListener('DOMContentLoaded', () => {
  // 1) Parallax
  if (typeof Rellax !== 'undefined') {
    new Rellax('.hero-section');
  }

  // 2) AOS-анимации
  if (typeof AOS !== 'undefined') {
    AOS.init({ once: true, duration: 600 });
  }

  // 3) Слайдер отзывов
  if (typeof Siema !== 'undefined') {
    const slider = new Siema({
      selector: '.testimonials',
      duration: 500,
      loop: true
    });
    document.querySelector('.prev').addEventListener('click', () => slider.prev());
    document.querySelector('.next').addEventListener('click', () => slider.next());
  }

  // Инициализация карты (если используется)
  if (document.getElementById('map')) {
    const map = L.map('map').setView([41.7151, 44.8271], 10);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
  }
});
