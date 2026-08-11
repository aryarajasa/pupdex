// Lazy-Loaded In-Browser AI Dog Detector for PupDex
class PupdexDogDetector {
  constructor() {
    this.model = null;
    this.isLoading = false;
    this.isReady = false;
    this.strictMode = true; // Default AI Guard enabled
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

  async loadModel() {
    if (this.isReady || this.isLoading) return;
    this.isLoading = true;

    try {
      // Dynamically load TensorFlow and COCO-SSD in background without blocking main thread
      if (!window.tf) {
        await this.injectScript('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.17.0/dist/tf.min.js');
      }
      if (!window.cocoSsd) {
        await this.injectScript('https://cdn.jsdelivr.net/npm/@tensorflow-models/coco-ssd@2.2.3/dist/coco-ssd.min.js');
      }

      if (window.tf) {
        try { await window.tf.ready(); } catch (e) {}
      }

      if (window.cocoSsd) {
        console.log('Loading lightweight COCO-SSD model...');
        this.model = await window.cocoSsd.load({ base: 'lite_mobilenet_v2' });
        this.isReady = true;
        console.log('PupDex AI Detector ready!');
      }
    } catch (err) {
      console.warn('AI Model lazy-load error:', err);
    } finally {
      this.isLoading = false;
    }
  }

  async detectDog(canvasOrImgElement) {
    if (!this.strictMode) {
      return { isDog: true, confidence: 1.0, label: 'Bypassed' };
    }

    if (!this.isReady && !this.isLoading) {
      await this.loadModel();
    }

    if (!this.model) {
      return { isDog: true, confidence: 1.0, label: 'Offline Fallback' };
    }

    // 2-second timeout protection so shutter NEVER hangs!
    return new Promise((resolve) => {
      const timeoutId = setTimeout(() => {
        resolve({ isDog: true, confidence: 1.0, label: 'Timeout Fallback' });
      }, 2000);

      this.runDetection(canvasOrImgElement)
        .then(result => {
          clearTimeout(timeoutId);
          resolve(result);
        })
        .catch(err => {
          clearTimeout(timeoutId);
          resolve({ isDog: true, confidence: 1.0, label: 'Error Fallback' });
        });
    });
  }

  async runDetection(element) {
    if (!element || element.width === 0 || element.height === 0) {
      return { isDog: true, confidence: 1.0, label: 'Valid Frame' };
    }

    if (this.model && typeof this.model.detect === 'function') {
      const predictions = await this.model.detect(element);
      const dogMatch = predictions.find(p => p.class === 'dog' && p.score >= 0.18);
      if (dogMatch) {
        return { isDog: true, confidence: dogMatch.score, label: 'Dog' };
      }
      if (predictions.length > 0) {
        return { isDog: false, confidence: predictions[0].score, label: predictions[0].class };
      }
    }

    return { isDog: true, confidence: 1.0, label: 'Good Boi' };
  }
}

window.pupdexDogDetector = new PupdexDogDetector();
