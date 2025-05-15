document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('map')) {
    const map = L.map('map').setView([41.7151, 44.8271], 10);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
    // Пример маркера:
    L.marker([41.7151, 44.8271]).addTo(map)
      .bindPopup('Это пример локации.')
      .openPopup();
  }
});
