// Lightweight In-Browser Dog Detector using TensorFlow.js & MobileNet
class BarkdexDogDetector {
  constructor() {
    this.model = null;
    this.isLoading = false;
    this.dogKeywords = [
      'dog', 'puppy', 'pup', 'retriever', 'terrier', 'spaniel', 'hound', 
      'spitz', 'bulldog', 'poodle', 'corgi', 'husky', 'malamute', 'chihuahua', 
      'dalmatian', 'beagle', 'boxer', 'pug', 'rottweiler', 'doberman', 
      'schipperke', 'papillon', 'whippet', 'greyhound', 'weimaraner', 
      'pinscher', 'collie', 'dachs', 'shihtzu', 'pomeranian', 'samoyed', 
      'chow', 'basenji', 'pekinese', 'borzoi', 'ridgeback', 'komondor', 
      'great dane', 'saint bernard', 'mastiff', 'newfoundland', 'afghan'
    ];
  }

  async loadModel() {
    if (this.model || this.isLoading) return;
    this.isLoading = true;
    try {
      if (window.mobilenet) {
        this.model = await window.mobilenet.load({ version: 2, alpha: 1.0 });
        console.log('BarkDex AI Dog Detector loaded!');
      }
    } catch (err) {
      console.warn('Failed to load MobileNet model:', err);
    } finally {
      this.isLoading = false;
    }
  }

  async detectDog(imageOrCanvas) {
    // If model hasn't loaded or TF.js isn't available, allow as fallback
    if (!this.model) {
      await this.loadModel();
    }

    if (!this.model) {
      // Fallback: If AI fails to load offline, default to allowing capture
      return { isDog: true, confidence: 1.0, label: 'Good Boi' };
    }

    try {
      const predictions = await this.model.classify(imageOrCanvas, 5);
      console.log('AI Image Predictions:', predictions);

      let maxDogProb = 0;
      let detectedLabel = '';

      for (const pred of predictions) {
        const className = pred.className.toLowerCase();
        const matchesDog = this.dogKeywords.some(keyword => className.includes(keyword));

        if (matchesDog && pred.probability > maxDogProb) {
          maxDogProb = pred.probability;
          detectedLabel = pred.className.split(',')[0];
        }
      }

      // Require at least 8% probability match for dog classification
      if (maxDogProb >= 0.08) {
        return { isDog: true, confidence: maxDogProb, label: detectedLabel };
      } else {
        const topLabel = predictions[0] ? predictions[0].className.split(',')[0] : 'Object';
        return { isDog: false, confidence: predictions[0]?.probability || 0, label: topLabel };
      }
    } catch (err) {
      console.error('Detection error:', err);
      return { isDog: true, confidence: 1.0, label: 'Good Boi' };
    }
  }
}

window.barkdexDogDetector = new BarkdexDogDetector();
