// Enhanced In-Browser AI Dog Detector using COCO-SSD & MobileNet
class BarkdexDogDetector {
  constructor() {
    this.cocoModel = null;
    this.mobileModel = null;
    this.isLoading = false;
    
    // Comprehensive ImageNet dog breeds and keywords
    this.dogKeywords = [
      'dog', 'puppy', 'pup', 'retriever', 'terrier', 'spaniel', 'hound', 
      'spitz', 'bulldog', 'poodle', 'corgi', 'husky', 'malamute', 'chihuahua', 
      'dalmatian', 'beagle', 'boxer', 'pug', 'rottweiler', 'doberman', 
      'schipperke', 'papillon', 'whippet', 'greyhound', 'weimaraner', 
      'pinscher', 'collie', 'dachs', 'shihtzu', 'pomeranian', 'samoyed', 
      'chow', 'basenji', 'pekinese', 'borzoi', 'ridgeback', 'komondor', 
      'great dane', 'saint bernard', 'mastiff', 'newfoundland', 'afghan',
      'dingo', 'shepherd', 'dhole', 'hyena', 'groenendael', 'briard',
      'kelpie', 'appenzeller', 'entlebucher', 'kuvasz', 'leonberg', 'pyrenees'
    ];
  }

  async loadModel() {
    if (this.isLoading) return;
    this.isLoading = true;

    try {
      // 1. Try loading COCO-SSD (Best for detecting 'dog' anywhere in frame)
      if (window.cocoSsd && !this.cocoModel) {
        this.cocoModel = await window.cocoSsd.load({ base: 'lite_mobilenet_v2' });
        console.log('BarkDex COCO-SSD Dog Detector ready!');
      }
    } catch (e) {
      console.warn('COCO-SSD load failed, falling back to MobileNet:', e);
    }

    try {
      // 2. Fallback to MobileNet if COCO-SSD fails
      if (window.mobilenet && !this.mobileModel && !this.cocoModel) {
        this.mobileModel = await window.mobilenet.load({ version: 2, alpha: 0.5 });
        console.log('BarkDex MobileNet Classifier ready!');
      }
    } catch (e) {
      console.warn('MobileNet load failed:', e);
    } finally {
      this.isLoading = false;
    }
  }

  async detectDog(element) {
    if (!this.cocoModel && !this.mobileModel) {
      await this.loadModel();
    }

    // Fallback: If AI scripts fail or network is offline, allow capture gracefully
    if (!this.cocoModel && !this.mobileModel) {
      console.log('AI models unavailable, allowing capture by default');
      return { isDog: true, confidence: 1.0, label: 'Good Boi' };
    }

    try {
      // Primary Detector: COCO-SSD
      if (this.cocoModel) {
        const predictions = await this.cocoModel.detect(element);
        console.log('COCO-SSD Detections:', predictions);

        const dogMatch = predictions.find(p => p.class === 'dog' && p.score >= 0.20);
        if (dogMatch) {
          return { isDog: true, confidence: dogMatch.score, label: 'Good Boi (Dog)' };
        }

        if (predictions.length > 0) {
          const topLabel = predictions[0].class;
          return { isDog: false, confidence: predictions[0].score, label: topLabel };
        }
      }

      // Secondary Detector: MobileNet
      if (this.mobileModel) {
        const predictions = await this.mobileModel.classify(element, 5);
        console.log('MobileNet Classifications:', predictions);

        for (const pred of predictions) {
          const className = pred.className.toLowerCase();
          const matchesDog = this.dogKeywords.some(keyword => className.includes(keyword));

          if (matchesDog && pred.probability >= 0.05) {
            return { isDog: true, confidence: pred.probability, label: pred.className.split(',')[0] };
          }
        }

        const topLabel = predictions[0] ? predictions[0].className.split(',')[0] : 'Object';
        return { isDog: false, confidence: predictions[0]?.probability || 0, label: topLabel };
      }

      return { isDog: true, confidence: 1.0, label: 'Good Boi' };
    } catch (err) {
      console.error('Detection execution error:', err);
      // Soft fallback so camera isn't locked up if canvas format is odd
      return { isDog: true, confidence: 1.0, label: 'Good Boi' };
    }
  }
}

window.barkdexDogDetector = new BarkdexDogDetector();
