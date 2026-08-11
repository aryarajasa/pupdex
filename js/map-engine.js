// Leaflet.js Interactive Neighborhood Map Engine for PupDex
class PupdexMap {
  constructor() {
    this.map = null;
    this.markers = [];
    this.isLoading = false;
  }

  injectScript(src) {
    return new Promise((resolve) => {
      if (document.querySelector(`script[src="${src}"]`)) {
        resolve();
        return;
      }
      const s = document.createElement('script');
      s.src = src;
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => resolve();
      document.body.appendChild(s);
    });
  }

  async init(containerId = 'barkdexMapContainer') {
    const container = document.getElementById(containerId);
    if (!container || this.map) return;

    if (!window.L && !this.isLoading) {
      this.isLoading = true;
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);

      await this.injectScript('https://unpkg.com/leaflet@1.9.4/dist/leaflet.js');
      this.isLoading = false;
    }

    const defaultLat = -6.2088;
    const defaultLng = 106.8456;

    try {
      if (window.L) {
        this.map = L.map(containerId, {
          zoomControl: false
        }).setView([defaultLat, defaultLng], 14);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '© OpenStreetMap'
        }).addTo(this.map);

        navigator.geolocation?.getCurrentPosition((pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          this.map.setView([lat, lng], 15);
        });

        this.renderDogMarkers();
      }
    } catch (err) {
      console.warn('Map initialization error:', err);
    }
  }

  async renderDogMarkers() {
    if (!this.map || !window.L) return;

    this.markers.forEach(m => this.map.removeLayer(m));
    this.markers = [];

    const dogs = await window.pupdexStorage.getAllDogs();

    dogs.forEach((dog, idx) => {
      const baseLat = -6.2088 + (Math.sin(idx * 1.5) * 0.012);
      const baseLng = 106.8456 + (Math.cos(idx * 1.5) * 0.012);

      const pawIcon = L.divIcon({
        className: 'custom-paw-marker',
        html: `<div style="background:#fb923c;color:#fff;width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:20px;border:3px solid #fff;box-shadow:0 6px 16px rgba(0,0,0,0.3);">🐾</div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 18]
      });

      const marker = L.marker([baseLat, baseLng], { icon: pawIcon }).addTo(this.map);

      marker.bindPopup(`
        <div style="text-align:center;padding:6px;width:150px;">
          <img src="${dog.photo}" style="width:100px;height:100px;object-fit:cover;border-radius:12px;margin-bottom:6px;" />
          <div style="font-weight:800;font-size:12px;">Good Boi #${dog.id.slice(-4)}</div>
          <div style="font-size:10px;color:#6b7280;">📍 ${dog.locationText || 'Wild Spot'}</div>
        </div>
      `);

      this.markers.push(marker);
    });
  }
}

window.pupdexMap = new PupdexMap();
