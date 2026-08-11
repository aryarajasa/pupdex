// Treat & Bone Inventory System for PupDex
class PupDexTreats {
  constructor() {
    this.bones = 15; // default starting bones
    this.activeLure = false;
  }

  init() {
    const savedBones = localStorage.getItem('PupDex_bones');
    if (savedBones !== null) {
      this.bones = parseInt(savedBones, 10);
    }
  }

  addBones(amount) {
    this.bones += amount;
    localStorage.setItem('PupDex_bones', this.bones);
    this.renderTreatUI();
  }

  buyLure() {
    if (this.bones >= 20) {
      this.bones -= 20;
      this.activeLure = true;
      localStorage.setItem('PupDex_bones', this.bones);
      if (window.pupdexAudio) window.pupdexAudio.playLevelUp();
      if (window.pupdexApp) window.pupdexApp.showToast('Sparkle Lure Activated! 🥩 (+30% Legendary Luck)');
      this.renderTreatUI();
    } else {
      if (window.pupdexApp) window.pupdexApp.showToast('Need 20 Bones 🦴 to buy Sparkle Lure!');
    }
  }

  renderTreatUI() {
    const bonesEl = document.getElementById('treatBonesBalance');
    if (bonesEl) bonesEl.textContent = `${this.bones} 🦴`;
  }
}

// Global window aliases for backwards compatibility
window.pupdexTreats = window.PupDexTreats = window.barkdexTreats = new PupDexTreats();
window.pupdexTreats.init();
