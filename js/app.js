// BarkDex Application Controller
class BarkdexApp {
  constructor() {
    this.currentView = 'dex';
    this.selectedSize = null;
    this.selectedVibe = null;
    this.pendingRarity = 'common';
    this.capturedImageData = null;
    this.failedAttempts = 0;

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
      try {
        await navigator.serviceWorker.register('./sw.js');
        console.log('BarkDex ServiceWorker registered');
      } catch (err) {
        console.warn('ServiceWorker registration failed:', err);
      }
    }

    // Load Profile & Initialize Storage
    await window.barkdexStorage.init();
    this.profile = window.barkdexStorage.getProfile();

    // Pre-load AI Dog Detector Model in background
    if (window.barkdexDogDetector) {
      window.barkdexDogDetector.loadModel();
    }

    // Check if initial sample data is needed for empty album
    const existingDogs = await window.barkdexStorage.getAllDogs();
    if (existingDogs.length === 0) {
      await this.loadSampleData();
    }

    this.bindEvents();
    this.renderHeader();
    this.renderCurrentView();
  }

  bindEvents() {
    // Tab Navigation Buttons
    document.querySelectorAll('.nav-item[data-tab]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tab = btn.dataset.tab;
        this.switchTab(tab);
      });
    });

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
      switchCamBtn.addEventListener('click', () => window.barkdexCamera.switchCamera());
    }

    // Sound Toggle Button
    const soundToggleBtn = document.getElementById('soundToggleBtn');
    if (soundToggleBtn) {
      soundToggleBtn.addEventListener('click', () => {
        const isEnabled = window.barkdexAudio.toggleSound();
        soundToggleBtn.textContent = isEnabled ? '🔊' : '🔇';
        this.showToast(isEnabled ? 'Sound On 🔊' : 'Sound Off 🔇');
      });
    }

    // Close Modals
    document.querySelectorAll('.close-modal-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const modal = btn.closest('.modal-overlay');
        if (modal) {
          modal.classList.remove('active');
          window.barkdexCamera.stopCamera();
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
      exportBtn.addEventListener('click', () => window.barkdexStorage.exportDataJSON());
    }

    const importInput = document.getElementById('importDataInput');
    if (importInput) {
      importInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (file) {
          const text = await file.text();
          const success = await window.barkdexStorage.importDataJSON(text);
          if (success) {
            this.showToast('BarkDex imported successfully! 🎉');
            this.profile = window.barkdexStorage.getProfile();
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

    window.barkdexAudio.playCardClick();
    this.renderCurrentView();
  }

  renderHeader() {
    const levelTitleEl = document.getElementById('trainerLevelTitle');
    const levelNumEl = document.getElementById('trainerLevelNum');
    const xpTextEl = document.getElementById('trainerXpText');
    const progressFillEl = document.getElementById('xpProgressFill');
    const streakNumEl = document.getElementById('streakNum');

    const nextXP = window.barkdexGamification.getXPForLevel(this.profile.level);
    const title = window.barkdexGamification.getTrainerTitle(this.profile.level);

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

    const dogs = await window.barkdexStorage.getAllDogs();

    if (dogs.length === 0) {
      grid.style.display = 'none';
      if (emptyState) emptyState.style.display = 'block';
      return;
    }

    grid.style.display = 'grid';
    if (emptyState) emptyState.style.display = 'none';

    grid.innerHTML = dogs.map(dog => {
      const rarityObj = window.barkdexGamification.rarities[dog.rarity] || window.barkdexGamification.rarities.common;
      const sizeObj = window.barkdexGamification.sizes[dog.size] || window.barkdexGamification.sizes.medium;
      const vibeObj = window.barkdexGamification.vibes[dog.vibe] || window.barkdexGamification.vibes.normal;
      const dateStr = new Date(dog.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

      return `
        <div class="dog-card" onclick="window.barkdexApp.openDogDetail('${dog.id}')">
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

    const combos = window.barkdexGamification.getMatrixCombos();
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

    const allDogs = await window.barkdexStorage.getAllDogs();
    const { newlyUnlocked } = window.barkdexGamification.checkAchievements(this.profile, allDogs);
    window.barkdexStorage.saveProfile(this.profile);

    const unlocked = this.profile.badgesUnlocked || [];

    grid.innerHTML = window.barkdexGamification.achievementsList.map(ach => {
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

    const dogs = await window.barkdexStorage.getAllDogs();
    const rareCount = dogs.filter(d => d.rarity === 'rare' || d.rarity === 'epic' || d.rarity === 'legendary').length;

    if (totalDogsEl) totalDogsEl.textContent = dogs.length;
    if (totalRaresEl) totalRaresEl.textContent = rareCount;
    if (rankTitleEl) rankTitleEl.textContent = window.barkdexGamification.getTrainerTitle(this.profile.level);
  }

  // Camera & Capture Flow
  async openCameraModal() {
    const modal = document.getElementById('cameraModal');
    const video = document.getElementById('viewfinderVideo');
    const canvas = document.getElementById('viewfinderCanvas');

    if (modal && video && canvas) {
      modal.classList.add('active');
      const started = await window.barkdexCamera.startCamera(video, canvas);
      if (!started) {
        this.showToast('Camera access unavailable. Using snapshot mode! 📸');
      }
    }
  }

  async handleCapture() {
    window.barkdexAudio.playShutter();

    let imgData = window.barkdexCamera.captureSnapshot();
    if (!imgData) {
      imgData = window.barkdexCamera.generatePlaceholderDogImage('medium', 'friendly');
    }
    this.capturedImageData = imgData;

    // Run AI Dog Detector
    this.showToast('AI Scanning for Good Boi... 🔍');

    // Create an image element to pass to MobileNet
    const tempImg = new Image();
    tempImg.src = imgData;
    await tempImg.decode();

    const detection = await window.barkdexDogDetector.detectDog(tempImg);
    console.log('Dog Detection Result:', detection);

    // If NOT a dog (and user hasn't tried multiple times as override)
    if (!detection.isDog && this.failedAttempts < 2) {
      this.failedAttempts += 1;
      window.barkdexAudio.playError();
      
      const detectedName = detection.label || 'Object';
      this.showToast(`No dog detected! 🐶 (Found: ${detectedName}). Point camera at a dog!`);
      
      // Shake shutter button
      const shutterBtn = document.getElementById('shutterBtn');
      if (shutterBtn) {
        shutterBtn.style.animation = 'shake 0.4s ease';
        setTimeout(() => shutterBtn.style.animation = '', 400);
      }
      return; // Stop capture flow, keep camera open!
    }

    // Success! Reset failed attempts
    this.failedAttempts = 0;
    window.barkdexCamera.stopCamera();

    // Roll Gacha Rarity
    this.pendingRarity = window.barkdexGamification.rollRarity(this.profile.streak);
    window.barkdexAudio.playGachaReveal(this.pendingRarity);

    // Hide Camera Modal & Open Options Selection Modal
    document.getElementById('cameraModal')?.classList.remove('active');
    this.openOptionsModal();
  }

  openOptionsModal() {
    const modal = document.getElementById('optionsModal');
    const previewImg = document.getElementById('optionsPreviewImg');
    const rarityBanner = document.getElementById('gachaRarityBanner');
    const rarityObj = window.barkdexGamification.rarities[this.pendingRarity];

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

    if (sizeContainer) {
      sizeContainer.innerHTML = Object.keys(window.barkdexGamification.sizes).map(key => {
        const s = window.barkdexGamification.sizes[key];
        const isSelected = this.selectedSize === key;
        return `
          <div class="option-card ${isSelected ? 'selected' : ''}" onclick="window.barkdexApp.selectSize('${key}')">
            <div class="option-icon">${s.emoji}</div>
            <div class="option-name">${s.name}</div>
            <div class="option-sub">${s.desc}</div>
          </div>
        `;
      }).join('');
    }

    if (vibeContainer) {
      vibeContainer.innerHTML = Object.keys(window.barkdexGamification.vibes).map(key => {
        const v = window.barkdexGamification.vibes[key];
        const isSelected = this.selectedVibe === key;
        return `
          <div class="option-card ${isSelected ? 'selected' : ''}" onclick="window.barkdexApp.selectVibe('${key}')">
            <div class="option-icon">${v.emoji}</div>
            <div class="option-name">${v.name}</div>
            <div class="option-sub">${v.desc}</div>
          </div>
        `;
      }).join('');
    }

    // Enable/Disable Save button based on selections
    const saveBtn = document.getElementById('saveEncounterBtn');
    if (saveBtn) {
      saveBtn.disabled = !(this.selectedSize && this.selectedVibe);
      saveBtn.style.opacity = (this.selectedSize && this.selectedVibe) ? '1' : '0.5';
    }
  }

  selectSize(sizeKey) {
    this.selectedSize = sizeKey;
    window.barkdexAudio.playCardClick();
    this.renderOptionPickers();
  }

  selectVibe(vibeKey) {
    this.selectedVibe = vibeKey;
    window.barkdexAudio.playCardClick();
    this.renderOptionPickers();
  }

  async saveCapturedDog() {
    if (!this.selectedSize || !this.selectedVibe || !this.capturedImageData) return;

    const location = await window.barkdexCamera.getGeolocation();
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

    await window.barkdexStorage.saveDog(dogRecord);

    // Calculate XP & Level Up
    const earnedXP = window.barkdexGamification.calculateXP(this.pendingRarity, isNewCombo);
    this.profile.xp += earnedXP;
    this.profile = window.barkdexGamification.updateStreak(this.profile);

    const nextXP = window.barkdexGamification.getXPForLevel(this.profile.level);
    if (this.profile.xp >= nextXP) {
      this.profile.level += 1;
      window.barkdexAudio.playLevelUp();
      this.showToast(`LEVEL UP! You are now Lvl ${this.profile.level}! 🎉`);
    } else {
      this.showToast(`+${earnedXP} XP! Logged to BarkDex 🐾`);
    }

    // Check Badges
    const allDogs = await window.barkdexStorage.getAllDogs();
    const { newlyUnlocked } = window.barkdexGamification.checkAchievements(this.profile, allDogs);
    window.barkdexStorage.saveProfile(this.profile);

    if (newlyUnlocked.length > 0) {
      newlyUnlocked.forEach(ach => {
        this.showToast(`Badge Unlocked: ${ach.emoji} ${ach.name}! 🏆`);
      });
    }

    // Close Options Modal & Refresh Views
    document.getElementById('optionsModal')?.classList.remove('active');
    this.renderHeader();
    this.switchTab('dex');
  }

  async openDogDetail(id) {
    const dogs = await window.barkdexStorage.getAllDogs();
    const dog = dogs.find(d => d.id === id);
    if (!dog) return;

    const modal = document.getElementById('dogDetailModal');
    const imgEl = document.getElementById('detailDogImg');
    const infoEl = document.getElementById('detailDogInfo');
    const deleteBtn = document.getElementById('deleteDogBtn');

    const rarityObj = window.barkdexGamification.rarities[dog.rarity];
    const sizeObj = window.barkdexGamification.sizes[dog.size];
    const vibeObj = window.barkdexGamification.vibes[dog.vibe];

    if (imgEl) imgEl.src = dog.photo;
    if (infoEl) {
      infoEl.innerHTML = `
        <div class="gacha-rarity-title rarity-${dog.rarity}">${rarityObj.emoji} ${rarityObj.name}</div>
        <p style="margin: 8px 0; color: var(--text-muted);">Found at 📍 ${dog.locationText || 'Neighborhood'} on ${new Date(dog.timestamp).toLocaleString()}</p>
        <div class="dog-tags" style="justify-content: center; margin-top: 12px;">
          <span class="badge-pill" style="font-size: 13px; padding: 6px 14px;">${sizeObj.emoji} Size: ${sizeObj.name} (${sizeObj.desc})</span>
          <span class="badge-pill" style="font-size: 13px; padding: 6px 14px;">${vibeObj.emoji} Vibe: ${vibeObj.name} (${vibeObj.desc})</span>
        </div>
      `;
    }

    if (deleteBtn) {
      deleteBtn.onclick = async () => {
        if (confirm('Release this Good Boi from your BarkDex?')) {
          await window.barkdexStorage.deleteDog(id);
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

  // Pre-populate cute initial dogs on first run so the app looks vibrant immediately
  async loadSampleData() {
    const sampleDogs = [
      {
        id: 'sample_1',
        timestamp: Date.now() - 3600000 * 4,
        photo: window.barkdexCamera.generatePlaceholderDogImage('potato', 'friendly'),
        rarity: 'rare',
        size: 'potato',
        vibe: 'friendly',
        comboKey: 'potato-friendly',
        locationText: 'Central Park Walk'
      },
      {
        id: 'sample_2',
        timestamp: Date.now() - 3600000 * 24,
        photo: window.barkdexCamera.generatePlaceholderDogImage('chonker', 'normal'),
        rarity: 'epic',
        size: 'chonker',
        vibe: 'normal',
        comboKey: 'chonker-normal',
        locationText: 'Bakery Alley'
      }
    ];

    for (const d of sampleDogs) {
      await window.barkdexStorage.saveDog(d);
    }
    this.profile.xp = 125;
    this.profile.level = 2;
    this.profile.matrixUnlocked = ['potato-friendly', 'chonker-normal'];
    window.barkdexStorage.saveProfile(this.profile);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.barkdexApp = new BarkdexApp();
  window.barkdexApp.init();
});
