// PupDex Application Controller
class PupdexApp {
  constructor() {
    this.currentView = 'dex';
    this.selectedSize = null;
    this.selectedVibe = null;
    this.pendingRarity = 'common';
    this.capturedImageData = null;
    this.failedAttempts = 0;
    this.currentDetailDog = null;

    this.profile = {
      username: 'Good Boi Scout',
      xp: 0,
      level: 1,
      streak: 1,
      lastCatchDate: null,
      badgesUnlocked: [],
      matrixUnlocked: []
    };
  }

  async init() {
    // Register Service Worker for PWA
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js').catch(err => console.warn('SW reg warning:', err));
    }

    try {
      if (window.pupdexStorage) {
        await window.pupdexStorage.init();
        this.profile = window.pupdexStorage.getProfile();
      }

      if (window.pupdexOnboarding) window.pupdexOnboarding.init();
      if (window.pupdexFirebase) window.pupdexFirebase.lazyLoadFirebase();
      if (window.pupdexDogDetector) window.pupdexDogDetector.loadModel();

      if (window.pupdexStorage) {
        const existingDogs = await window.pupdexStorage.getAllDogs();
        if (existingDogs.length === 0) {
          await this.loadSampleData();
        }
      }
    } catch (err) {
      console.warn('Non-fatal app init warning:', err);
    } finally {
      // Guaranteed execution of event bindings and view rendering
      this.bindEvents();
      this.renderHeader();
      this.renderCurrentView();
    }
  }

  bindEvents() {
    // Tab Navigation Buttons
    document.querySelectorAll('.nav-item[data-tab]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tab = btn.dataset.tab;
        this.switchTab(tab);
      });
    });

    // Dog Grid Event Delegation for Instant Taps on Mobile
    const grid = document.getElementById('dogCollectionGrid');
    if (grid) {
      grid.addEventListener('click', (e) => {
        const card = e.target.closest('.dog-card');
        if (card && card.dataset.id) {
          this.openDogDetail(card.dataset.id);
        }
      });
    }

    // Encounter FAB Button
    const encounterFab = document.getElementById('encounterFab');
    if (encounterFab) {
      encounterFab.addEventListener('click', () => this.openCameraModal());
    }

    // Camera Shutter Button
    const shutterBtn = document.getElementById('shutterBtn');
    if (shutterBtn) {
      shutterBtn.addEventListener('click', () => this.handleCapture());
    }

    // Switch Camera Button
    const switchCamBtn = document.getElementById('switchCamBtn');
    if (switchCamBtn) {
      switchCamBtn.addEventListener('click', () => {
        if (window.pupdexCamera) window.pupdexCamera.switchCamera();
      });
    }

    // Sound Toggle Button
    const soundToggleBtn = document.getElementById('soundToggleBtn');
    if (soundToggleBtn) {
      soundToggleBtn.addEventListener('click', () => {
        const isEnabled = window.pupdexAudio ? window.pupdexAudio.toggleSound() : true;
        soundToggleBtn.textContent = isEnabled ? '🔊' : '🔇';
        this.showToast(isEnabled ? 'Sound On 🔊' : 'Sound Off 🔇');
      });
    }

    // AI Guard Toggle Button
    const aiGuardToggleBtn = document.getElementById('aiGuardToggleBtn');
    if (aiGuardToggleBtn) {
      aiGuardToggleBtn.addEventListener('click', () => {
        if (window.pupdexDogDetector) {
          window.pupdexDogDetector.strictMode = !window.pupdexDogDetector.strictMode;
          const isOn = window.pupdexDogDetector.strictMode;
          aiGuardToggleBtn.textContent = isOn ? '🛡️ AI Guard: ON' : '🔓 AI Guard: OFF';
          this.showToast(isOn ? 'AI Dog Guard Enabled 🛡️' : 'AI Dog Guard Disabled 🔓');
        }
      });
    }

    // Close Modals
    document.querySelectorAll('.close-modal-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const modal = btn.closest('.modal-overlay');
        if (modal) {
          modal.classList.remove('active');
          if (window.pupdexCamera) window.pupdexCamera.stopCamera();
        }
      });
    });

    // Save Encounter Button
    const saveEncounterBtn = document.getElementById('saveEncounterBtn');
    if (saveEncounterBtn) {
      saveEncounterBtn.addEventListener('click', () => this.saveCapturedDog());
    }

    // Export & Import Data Buttons
    const exportBtn = document.getElementById('exportDataBtn');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        if (window.pupdexStorage) window.pupdexStorage.exportDataJSON();
      });
    }

    const importInput = document.getElementById('importDataInput');
    if (importInput) {
      importInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (file && window.pupdexStorage) {
          const text = await file.text();
          const success = await window.pupdexStorage.importDataJSON(text);
          if (success) {
            this.showToast('PupDex imported successfully! 🎉');
            this.profile = window.pupdexStorage.getProfile();
            this.renderHeader();
            this.renderCurrentView();
          } else {
            this.showToast('Failed to import file ❌');
          }
        }
      });
    }
  }

  switchTab(tabName) {
    this.currentView = tabName;
    document.querySelectorAll('.nav-item').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabName);
    });

    document.querySelectorAll('.tab-view').forEach(view => {
      view.classList.toggle('active', view.id === `${tabName}View`);
    });

    if (window.pupdexAudio) window.pupdexAudio.playCardClick();
    this.renderCurrentView();
  }

  renderHeader() {
    const levelTitleEl = document.getElementById('trainerLevelTitle');
    const levelNumEl = document.getElementById('trainerLevelNum');
    const xpTextEl = document.getElementById('trainerXpText');
    const progressFillEl = document.getElementById('xpProgressFill');
    const streakNumEl = document.getElementById('streakNum');

    const nextXP = window.pupdexGamification ? window.pupdexGamification.getXPForLevel(this.profile.level) : 100;
    const title = window.pupdexGamification ? window.pupdexGamification.getTrainerTitle(this.profile.level) : 'Puppy Observer 🐣';

    if (levelTitleEl) levelTitleEl.textContent = title;
    if (levelNumEl) levelNumEl.textContent = `Lvl ${this.profile.level}`;
    if (xpTextEl) xpTextEl.textContent = `${this.profile.xp} / ${nextXP} XP`;
    if (streakNumEl) streakNumEl.textContent = `${this.profile.streak}d`;

    if (progressFillEl) {
      const pct = Math.min(100, Math.round((this.profile.xp / nextXP) * 100));
      progressFillEl.style.width = `${pct}%`;
    }
  }

  async renderCurrentView() {
    if (this.currentView === 'dex') {
      await this.renderDexView();
    } else if (this.currentView === 'map') {
      if (window.pupdexMap) window.pupdexMap.init();
    } else if (this.currentView === 'matrix') {
      await this.renderMatrixView();
    } else if (this.currentView === 'badges') {
      await this.renderBadgesView();
    } else if (this.currentView === 'profile') {
      await this.renderProfileView();
    }
  }

  async renderDexView() {
    const grid = document.getElementById('dogCollectionGrid');
    const emptyState = document.getElementById('dexEmptyState');
    if (!grid) return;

    const dogs = window.pupdexStorage ? await window.pupdexStorage.getAllDogs() : [];

    if (dogs.length === 0) {
      grid.style.display = 'none';
      if (emptyState) emptyState.style.display = 'block';
      return;
    }

    grid.style.display = 'grid';
    if (emptyState) emptyState.style.display = 'none';

    grid.innerHTML = dogs.map(dog => {
      const rarityObj = (window.pupdexGamification && window.pupdexGamification.rarities[dog.rarity]) || { emoji: '⚪', name: 'Common' };
      const sizeObj = (window.pupdexGamification && window.pupdexGamification.sizes[dog.size]) || { emoji: '🐕', name: 'Medium' };
      const vibeObj = (window.pupdexGamification && window.pupdexGamification.vibes[dog.vibe]) || { emoji: '💛', name: 'Normal' };
      const dateStr = new Date(dog.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

      return `
        <div class="dog-card" data-id="${dog.id}">
          <div class="dog-card-img-wrapper">
            <img src="${dog.photo}" class="dog-card-img" alt="Dog Photo" loading="lazy" />
            <div class="rarity-ribbon rarity-${dog.rarity}">${rarityObj.emoji} ${rarityObj.name}</div>
          </div>
          <div class="dog-card-body">
            <div class="dog-card-title">
              <span>Good Boi #${dog.id.slice(-4)}</span>
            </div>
            <div class="dog-tags">
              <span class="badge-pill">${sizeObj.emoji} ${sizeObj.name}</span>
              <span class="badge-pill">${vibeObj.emoji} ${vibeObj.name}</span>
            </div>
            <div class="dog-card-date">📍 ${dog.locationText || 'Wild Spot'} • ${dateStr}</div>
          </div>
        </div>
      `;
    }).join('');
  }

  async renderMatrixView() {
    const grid = document.getElementById('matrixGridContainer');
    const countEl = document.getElementById('matrixUnlockedCount');
    if (!grid) return;

    const combos = window.pupdexGamification ? window.pupdexGamification.getMatrixCombos() : [];
    const unlocked = this.profile.matrixUnlocked || [];

    if (countEl) countEl.textContent = `${unlocked.length} / 9`;

    grid.innerHTML = combos.map(c => {
      const isUnlocked = unlocked.includes(c.id);
      return `
        <div class="matrix-item ${isUnlocked ? 'unlocked' : 'locked'}">
          <div class="matrix-emoji">${c.sizeObj.emoji}${c.vibeObj.emoji}</div>
          <div class="matrix-label">${c.name}</div>
        </div>
      `;
    }).join('');
  }

  async renderBadgesView() {
    const grid = document.getElementById('badgesGridContainer');
    if (!grid) return;

    const allDogs = window.pupdexStorage ? await window.pupdexStorage.getAllDogs() : [];
    if (window.pupdexGamification) {
      const { newlyUnlocked } = window.pupdexGamification.checkAchievements(this.profile, allDogs);
      if (window.pupdexStorage) window.pupdexStorage.saveProfile(this.profile);
    }

    const unlocked = this.profile.badgesUnlocked || [];
    const list = window.pupdexGamification ? window.pupdexGamification.achievementsList : [];

    grid.innerHTML = list.map(ach => {
      const isUnlocked = unlocked.includes(ach.id);
      return `
        <div class="badge-card ${isUnlocked ? 'unlocked' : ''}">
          <div class="badge-icon">${ach.emoji}</div>
          <div>
            <div class="badge-info-title">${ach.name}</div>
            <div class="badge-info-desc">${ach.desc}</div>
          </div>
        </div>
      `;
    }).join('');
  }

  async renderProfileView() {
    const totalDogsEl = document.getElementById('profileTotalDogs');
    const totalRaresEl = document.getElementById('profileTotalRares');
    const rankTitleEl = document.getElementById('profileRankTitle');

    const dogs = window.pupdexStorage ? await window.pupdexStorage.getAllDogs() : [];
    const rareCount = dogs.filter(d => d.rarity === 'rare' || d.rarity === 'epic' || d.rarity === 'legendary').length;

    if (totalDogsEl) totalDogsEl.textContent = dogs.length;
    if (totalRaresEl) totalRaresEl.textContent = rareCount;
    if (rankTitleEl && window.pupdexGamification) rankTitleEl.textContent = window.pupdexGamification.getTrainerTitle(this.profile.level);
  }

  // Camera & Capture Flow
  async openCameraModal() {
    const modal = document.getElementById('cameraModal');
    const video = document.getElementById('viewfinderVideo');
    const canvas = document.getElementById('viewfinderCanvas');

    if (modal && video && canvas) {
      modal.classList.add('active');
      const started = window.pupdexCamera ? await window.pupdexCamera.startCamera(video, canvas) : false;
      if (!started) {
        this.showToast('Camera access unavailable. Using snapshot mode! 📸');
      }
    }
  }

  async handleCapture() {
    const shutterBtn = document.getElementById('shutterBtn');
    if (shutterBtn) {
      shutterBtn.style.pointerEvents = 'none';
      shutterBtn.style.opacity = '0.5';
    }

    if (window.pupdexAudio) window.pupdexAudio.playShutter();

    // Capture snapshot frame
    let imgData = window.pupdexCamera ? window.pupdexCamera.captureSnapshot() : null;
    if (!imgData && window.pupdexCamera) {
      imgData = window.pupdexCamera.generatePlaceholderDogImage('medium', 'friendly');
    }
    this.capturedImageData = imgData;

    // Check frame using Dog Detector
    let detection = { isDog: true, confidence: 1.0, label: 'Good Boi' };
    if (window.pupdexDogDetector && window.pupdexDogDetector.strictMode) {
      this.showToast('AI Scanning for Good Boi... 🔍');
      const tempImg = await this.createImgFromData(imgData);
      detection = await window.pupdexDogDetector.detectDog(tempImg);
    }

    if (shutterBtn) {
      shutterBtn.style.pointerEvents = 'auto';
      shutterBtn.style.opacity = '1';
    }

    // If NOT a dog and user hasn't tried twice (fail-safe override)
    if (!detection.isDog && this.failedAttempts < 1) {
      this.failedAttempts += 1;
      if (window.pupdexAudio) window.pupdexAudio.playError();
      
      const detectedName = detection.label || 'Object';
      this.showToast(`No dog detected! 🐶 (Found: ${detectedName}). Tap again to force capture!`);
      
      if (shutterBtn) {
        shutterBtn.style.transform = 'scale(0.85)';
        setTimeout(() => shutterBtn.style.transform = '', 300);
      }
      return;
    }

    // Success or Force Capture! Reset failed attempts
    this.failedAttempts = 0;
    if (window.pupdexCamera) window.pupdexCamera.stopCamera();

    // Check Sparkle Lure
    let streakBonus = this.profile.streak;
    if (window.pupdexTreats && window.pupdexTreats.activeLure) {
      streakBonus += 5;
      window.pupdexTreats.activeLure = false;
    }

    // Roll Gacha Rarity
    this.pendingRarity = window.pupdexGamification ? window.pupdexGamification.rollRarity(streakBonus) : 'common';
    if (window.pupdexAudio) window.pupdexAudio.playGachaReveal(this.pendingRarity);

    // Hide Camera Modal & Open Options Selection Modal
    document.getElementById('cameraModal')?.classList.remove('active');
    this.openOptionsModal();
  }

  createImgFromData(dataUrl) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => resolve(img);
      img.src = dataUrl;
    });
  }

  openOptionsModal() {
    const modal = document.getElementById('optionsModal');
    const previewImg = document.getElementById('optionsPreviewImg');
    const rarityBanner = document.getElementById('gachaRarityBanner');
    const rarityObj = window.pupdexGamification ? window.pupdexGamification.rarities[this.pendingRarity] : { emoji: '⚪', name: 'Common' };

    if (previewImg) previewImg.src = this.capturedImageData;
    if (rarityBanner) {
      rarityBanner.className = `gacha-rarity-title rarity-${this.pendingRarity}`;
      rarityBanner.innerHTML = `${rarityObj.emoji} ${rarityObj.name} GOOD BOI! ✨`;
    }

    this.selectedSize = null;
    this.selectedVibe = null;
    this.renderOptionPickers();

    if (modal) modal.classList.add('active');
  }

  renderOptionPickers() {
    const sizeContainer = document.getElementById('sizeOptionsGrid');
    const vibeContainer = document.getElementById('vibeOptionsGrid');

    if (sizeContainer && window.pupdexGamification) {
      sizeContainer.innerHTML = Object.keys(window.pupdexGamification.sizes).map(key => {
        const s = window.pupdexGamification.sizes[key];
        const isSelected = this.selectedSize === key;
        return `
          <div class="option-card ${isSelected ? 'selected' : ''}" onclick="window.pupdexApp.selectSize('${key}')">
            <div class="option-icon">${s.emoji}</div>
            <div class="option-name">${s.name}</div>
            <div class="option-sub">${s.desc}</div>
          </div>
        `;
      }).join('');
    }

    if (vibeContainer && window.pupdexGamification) {
      vibeContainer.innerHTML = Object.keys(window.pupdexGamification.vibes).map(key => {
        const v = window.pupdexGamification.vibes[key];
        const isSelected = this.selectedVibe === key;
        return `
          <div class="option-card ${isSelected ? 'selected' : ''}" onclick="window.pupdexApp.selectVibe('${key}')">
            <div class="option-icon">${v.emoji}</div>
            <div class="option-name">${v.name}</div>
            <div class="option-sub">${v.desc}</div>
          </div>
        `;
      }).join('');
    }

    const saveBtn = document.getElementById('saveEncounterBtn');
    if (saveBtn) {
      saveBtn.disabled = !(this.selectedSize && this.selectedVibe);
      saveBtn.style.opacity = (this.selectedSize && this.selectedVibe) ? '1' : '0.5';
    }
  }

  selectSize(sizeKey) {
    this.selectedSize = sizeKey;
    if (window.pupdexAudio) window.pupdexAudio.playCardClick();
    this.renderOptionPickers();
  }

  selectVibe(vibeKey) {
    this.selectedVibe = vibeKey;
    if (window.pupdexAudio) window.pupdexAudio.playCardClick();
    this.renderOptionPickers();
  }

  async saveCapturedDog() {
    if (!this.selectedSize || !this.selectedVibe || !this.capturedImageData) return;

    const location = window.pupdexCamera ? await window.pupdexCamera.getGeolocation() : { text: 'Neighborhood Walk' };
    const comboKey = `${this.selectedSize}-${this.selectedVibe}`;

    if (!this.profile.matrixUnlocked) this.profile.matrixUnlocked = [];
    const isNewCombo = !this.profile.matrixUnlocked.includes(comboKey);

    if (isNewCombo) {
      this.profile.matrixUnlocked.push(comboKey);
    }

    const dogRecord = {
      id: 'dog_' + Date.now(),
      timestamp: Date.now(),
      photo: this.capturedImageData,
      rarity: this.pendingRarity,
      size: this.selectedSize,
      vibe: this.selectedVibe,
      comboKey,
      locationText: location.text
    };

    if (window.pupdexStorage) await window.pupdexStorage.saveDog(dogRecord);
    if (window.pupdexFirebase) window.pupdexFirebase.postToSocialFeed(dogRecord);

    const earnedXP = window.pupdexGamification ? window.pupdexGamification.calculateXP(this.pendingRarity, isNewCombo) : 50;
    this.profile.xp += earnedXP;
    if (window.pupdexGamification) this.profile = window.pupdexGamification.updateStreak(this.profile);
    if (window.pupdexTreats) window.pupdexTreats.addBones(5);

    const nextXP = window.pupdexGamification ? window.pupdexGamification.getXPForLevel(this.profile.level) : 100;
    if (this.profile.xp >= nextXP) {
      this.profile.level += 1;
      if (window.pupdexAudio) window.pupdexAudio.playLevelUp();
      this.showToast(`LEVEL UP! You are now Lvl ${this.profile.level}! 🎉`);
    } else {
      this.showToast(`+${earnedXP} XP & +5 Bones 🦴! Logged to PupDex 🐾`);
    }

    if (window.pupdexStorage && window.pupdexGamification) {
      const allDogs = await window.pupdexStorage.getAllDogs();
      const { newlyUnlocked } = window.pupdexGamification.checkAchievements(this.profile, allDogs);
      window.pupdexStorage.saveProfile(this.profile);

      if (newlyUnlocked.length > 0) {
        newlyUnlocked.forEach(ach => {
          this.showToast(`Badge Unlocked: ${ach.emoji} ${ach.name}! 🏆`);
        });
      }
    }

    document.getElementById('optionsModal')?.classList.remove('active');
    this.renderHeader();
    this.switchTab('dex');
  }

  async openDogDetail(id) {
    if (!window.pupdexStorage) return;
    const dogs = await window.pupdexStorage.getAllDogs();
    const dog = dogs.find(d => d.id === id);
    if (!dog) return;

    this.currentDetailDog = dog;
    const modal = document.getElementById('dogDetailModal');
    const imgEl = document.getElementById('detailDogImg');
    const infoEl = document.getElementById('detailDogInfo');
    const deleteBtn = document.getElementById('deleteDogBtn');

    const rarityObj = (window.pupdexGamification && window.pupdexGamification.rarities[dog.rarity]) || { emoji: '⚪', name: 'Common' };
    const sizeObj = (window.pupdexGamification && window.pupdexGamification.sizes[dog.size]) || { emoji: '🐕', name: 'Medium' };
    const vibeObj = (window.pupdexGamification && window.pupdexGamification.vibes[dog.vibe]) || { emoji: '💛', name: 'Normal' };

    if (imgEl) imgEl.src = dog.photo;
    if (infoEl) {
      infoEl.innerHTML = `
        <div class="gacha-rarity-title rarity-${dog.rarity}">${rarityObj.emoji} ${rarityObj.name}</div>
        <p style="margin: 8px 0; color: var(--text-muted);">Found at 📍 ${dog.locationText || 'Neighborhood'} on ${new Date(dog.timestamp).toLocaleString()}</p>
        <div class="dog-tags" style="justify-content: center; margin-top: 12px;">
          <span class="badge-pill" style="font-size: 13px; padding: 6px 14px;">${sizeObj.emoji} Size: ${sizeObj.name} (${sizeObj.desc || ''})</span>
          <span class="badge-pill" style="font-size: 13px; padding: 6px 14px;">${vibeObj.emoji} Vibe: ${vibeObj.name} (${vibeObj.desc || ''})</span>
        </div>
      `;
    }

    if (deleteBtn) {
      deleteBtn.onclick = async () => {
        if (confirm('Release this Good Boi from your PupDex?')) {
          if (window.pupdexStorage) await window.pupdexStorage.deleteDog(id);
          modal.classList.remove('active');
          this.showToast('Dog released 🐾');
          this.renderCurrentView();
        }
      };
    }

    if (modal) modal.classList.add('active');
  }

  showToast(message) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span>🐾</span> ${message}`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-20px)';
      setTimeout(() => toast.remove(), 300);
    }, 2800);
  }

  async loadSampleData() {
    if (!window.pupdexCamera || !window.pupdexStorage) return;
    const sampleDogs = [
      {
        id: 'sample_1',
        timestamp: Date.now() - 3600000 * 4,
        photo: window.pupdexCamera.generatePlaceholderDogImage('potato', 'friendly'),
        rarity: 'rare',
        size: 'potato',
        vibe: 'friendly',
        comboKey: 'potato-friendly',
        locationText: 'Central Park Walk'
      },
      {
        id: 'sample_2',
        timestamp: Date.now() - 3600000 * 24,
        photo: window.pupdexCamera.generatePlaceholderDogImage('chonker', 'normal'),
        rarity: 'epic',
        size: 'chonker',
        vibe: 'normal',
        comboKey: 'chonker-normal',
        locationText: 'Bakery Alley'
      }
    ];

    for (const d of sampleDogs) {
      await window.pupdexStorage.saveDog(d);
    }
    this.profile.xp = 125;
    this.profile.level = 2;
    this.profile.matrixUnlocked = ['potato-friendly', 'chonker-normal'];
    window.pupdexStorage.saveProfile(this.profile);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.pupdexApp = new PupdexApp();
  window.pupdexApp.init();
});
