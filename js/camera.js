// Camera Manager for PupDex Viewfinder
class PupDexCamera {
  constructor() {
    this.stream = null;
    this.videoElement = null;
    this.canvasElement = null;
    this.facingMode = 'environment'; // default to rear camera on mobile
  }

  async startCamera(videoEl, canvasEl) {
    this.videoElement = videoEl;
    this.canvasElement = canvasEl;

    if (this.stream) {
      this.stopCamera();
    }

    try {
      const constraints = {
        video: {
          facingMode: { ideal: this.facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      };

      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.videoElement.srcObject = this.stream;
      await this.videoElement.play();
      return true;
    } catch (err) {
      console.warn('Camera stream failed or denied:', err);
      return false;
    }
  }

  switchCamera() {
    this.facingMode = this.facingMode === 'environment' ? 'user' : 'environment';
    if (this.videoElement && this.canvasElement) {
      return this.startCamera(this.videoElement, this.canvasElement);
    }
  }

  stopCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    if (this.videoElement) {
      this.videoElement.srcObject = null;
    }
  }

  captureSnapshot() {
    if (!this.videoElement || !this.canvasElement) return null;

    const video = this.videoElement;
    const canvas = this.canvasElement;
    const ctx = canvas.getContext('2d');

    // Square crop snapshot for cute cards
    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;
    const size = Math.min(width, height);
    const startX = (width - size) / 2;
    const startY = (height - size) / 2;

    canvas.width = 400;
    canvas.height = 400;

    // Draw square cropped video frame onto canvas
    ctx.drawImage(video, startX, startY, size, size, 0, 0, 400, 400);

    // Return compressed JPEG data URL for lightweight storage
    return canvas.toDataURL('image/jpeg', 0.82);
  }

  // Create a cute cartoon fallback image matching the warm pastel palette
  generatePlaceholderDogImage(sizeKey, vibeKey) {
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');

    // Warm Peach & Lavender Gradient Background
    const grad = ctx.createLinearGradient(0, 0, 400, 400);
    grad.addColorStop(0, '#fde68a');
    grad.addColorStop(0.5, '#fb923c');
    grad.addColorStop(1, '#a5b4fc');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 400, 400);

    // Cute Dog Face Silhouette
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(200, 210, 110, 0, Math.PI * 2);
    ctx.fill();

    // Ears
    ctx.beginPath();
    ctx.ellipse(110, 140, 35, 70, -0.3, 0, Math.PI * 2);
    ctx.ellipse(290, 140, 35, 70, 0.3, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    ctx.fillStyle = '#1e2025';
    ctx.beginPath();
    ctx.arc(160, 190, 14, 0, Math.PI * 2);
    ctx.arc(240, 190, 14, 0, Math.PI * 2);
    ctx.fill();

    // Eye Sparkles
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(155, 185, 4, 0, Math.PI * 2);
    ctx.arc(235, 185, 4, 0, Math.PI * 2);
    ctx.fill();

    // Nose
    ctx.fillStyle = '#1e2025';
    ctx.beginPath();
    ctx.ellipse(200, 225, 18, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    // Cute Smile / Tongue
    ctx.strokeStyle = '#1e2025';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(185, 240, 12, 0, Math.PI);
    ctx.arc(215, 240, 12, 0, Math.PI);
    ctx.stroke();

    // Tongue
    ctx.fillStyle = '#fb7185';
    ctx.beginPath();
    ctx.arc(200, 252, 10, 0, Math.PI);
    ctx.fill();

    // Text Label
    ctx.fillStyle = '#1e2025';
    ctx.font = 'bold 20px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`Wild Good Boi 🐾`, 200, 345);

    return canvas.toDataURL('image/jpeg', 0.85);
  }

  async getGeolocation() {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve({ lat: null, lng: null, text: 'Neighborhood Walk' });
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude.toFixed(4);
          const lng = pos.coords.longitude.toFixed(4);
          resolve({ lat, lng, text: `${lat}°, ${lng}°` });
        },
        () => {
          resolve({ lat: null, lng: null, text: 'Neighborhood Walk' });
        },
        { timeout: 5000 }
      );
    });
  }
}

// Global window aliases for backwards compatibility
window.pupdexCamera = window.PupDexCamera = window.barkdexCamera = new PupDexCamera();
