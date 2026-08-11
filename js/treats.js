// Treat & Bone Inventory System for BarkDex
class BarkdexTreats {
  constructor() {
    this.bones = 15; // default starting bones
    this.activeLure = false;
  }

  init() {
    const savedBones = localStorage.getItem('barkdex_bones');
    if (savedBones !== null) {
      this.bones = parseInt(savedBones, 10);
    }
  }

  addBones(amount) {
    this.bones += amount;
    localStorage.setItem('barkdex_bones', this.bones);
    this.renderTreatUI();
  }

  buyLure() {
    if (this.bones >= 20) {
      this.bones -= 20;
      this.activeLure = true;
      localStorage.setItem('barkdex_bones', this.bones);
      window.barkdexAudio.playLevelUp();
      window.barkdexApp.showToast('Sparkle Lure Activated! 🥩 (+30% Legendary Luck)');
      this.renderTreatUI();
    } else {
      window.barkdexApp.showToast('Need 20 Bones 🦴 to buy Sparkle Lure!');
    }
  }

  renderTreatUI() {
    const bonesEl = document.getElementById('treatBonesBalance');
    if (bonesEl) bonesEl.textContent = `${this.bones} 🦴`;
  }
}

window.barkdexTreats = new BarkdexTreats();
window.barkdexTreats.init();
