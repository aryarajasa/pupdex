// Bulletproof AI Dog Detector for BarkDex PWA
class BarkdexDogDetector {
  constructor() {
    this.model = null;
    this.isLoading = false;
    this.isReady = false;
    this.strictMode = true; // Default AI Guard enabled
  }

  async loadModel() {
    if (this.isReady || this.isLoading) return;
    this.isLoading = true;

    try {
      // Ensure TensorFlow is initialized safely
      if (window.tf) {
        // Prefer CPU or WebGL with graceful fallback
        try {
          await window.tf.ready();
        } catch (e) {
          console.warn('TF ready warning:', e);
        }
      }

      if (window.cocoSsd) {
        console.log('Loading COCO-SSD lite model...');
        this.model = await window.cocoSsd.load({ base: 'lite_mobilenet_v2' });
        this.isReady = true;
        console.log('BarkDex AI Dog Detector is READY!');
      } else if (window.mobilenet) {
        console.log('Loading MobileNet model...');
        this.model = await window.mobilenet.load({ version: 2, alpha: 0.5 });
        this.isReady = true;
      }
    } catch (err) {
      console.warn('AI Model load error:', err);
    } finally {
      this.isLoading = false;
    }
  }

  async detectDog(canvasOrImgElement) {
    // If Strict Mode is disabled by user, skip detection instantly
    if (!this.strictMode) {
      return { isDog: true, confidence: 1.0, label: 'Bypassed' };
    }

    // Ensure model is loaded
    if (!this.isReady && !this.isLoading) {
      await this.loadModel();
    }

    // Fallback: If AI model script failed to load (offline or CDN blocked), allow photo
    if (!this.model) {
      console.warn('AI Model not available, passing check');
      return { isDog: true, confidence: 1.0, label: 'Offline Fallback' };
    }

    // Wrap detection in a 2.5 second timeout so shutter NEVER hangs!
    return new Promise((resolve) => {
      const timeoutId = setTimeout(() => {
        console.warn('AI Detection timed out after 2.5s, letting capture through');
        resolve({ isDog: true, confidence: 1.0, label: 'Timeout Fallback' });
      }, 2500);

      this.runDetection(canvasOrImgElement)
        .then(result => {
          clearTimeout(timeoutId);
          resolve(result);
        })
        .catch(err => {
          clearTimeout(timeoutId);
          console.error('Detection run error:', err);
          resolve({ isDog: true, confidence: 1.0, label: 'Error Fallback' });
        });
    });
  }

  async runDetection(element) {
    // Validate element width & height to prevent TF crashes
    if (element.width === 0 || element.height === 0) {
      return { isDog: true, confidence: 1.0, label: 'Valid Frame' };
    }

    // 1. COCO-SSD Detection
    if (this.model && typeof this.model.detect === 'function') {
      const predictions = await this.model.detect(element);
      console.log('COCO-SSD Predictions:', predictions);

      const dogMatch = predictions.find(p => p.class === 'dog' && p.score >= 0.18);
      if (dogMatch) {
        return { isDog: true, confidence: dogMatch.score, label: 'Dog' };
      }

      if (predictions.length > 0) {
        const top = predictions[0];
        return { isDog: false, confidence: top.score, label: top.class };
      }

      return { isDog: false, confidence: 0, label: 'No Animal Detected' };
    }

    // 2. MobileNet Classification
    if (this.model && typeof this.model.classify === 'function') {
      const predictions = await this.model.classify(element, 5);
      console.log('MobileNet Predictions:', predictions);

      const dogKeywords = ['dog', 'puppy', 'retriever', 'terrier', 'spaniel', 'hound', 'corgi', 'husky', 'poodle', 'bulldog', 'chihuahua', 'beagle', 'boxer', 'pug', 'shepherd', 'malamute', 'dalmatian', 'dachs', 'pinscher', 'collie', 'pomeranian', 'samoyed', 'dane', 'bernard'];

      for (const pred of predictions) {
        const name = pred.className.toLowerCase();
        if (dogKeywords.some(k => name.includes(k)) && pred.probability >= 0.05) {
          return { isDog: true, confidence: pred.probability, label: pred.className.split(',')[0] };
        }
      }

      const topLabel = predictions[0] ? predictions[0].className.split(',')[0] : 'Unknown';
      return { isDog: false, confidence: predictions[0]?.probability || 0, label: topLabel };
    }

    return { isDog: true, confidence: 1.0, label: 'Good Boi' };
  }
}

window.barkdexDogDetector = new BarkdexDogDetector();
