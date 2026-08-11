// PupDex Application Controller
class PupDexApp {
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
      try {
        await navigator.serviceWorker.register('./sw.js');
        console.log('PupDex ServiceWorker registered');
      } catch (err) {
        console.warn('ServiceWorker registration failed:', err);
      }
    }

    // Load Profile & Initialize Storage
    await window.PupDexStorage.init();
    this.profile = window.PupDexStorage.getProfile();

    // Initialize Modules
    if (window.PupDexOnboarding) window.PupDexOnboarding.init();
    if (window.PupDexFirebase) window.PupDexFirebase.init();
    if (window.PupDexDogDetector) window.PupDexDogDetector.loadModel();

    // Check if initial sample data is needed for empty album
    const existingDogs = await window.PupDexStorage.getAllDogs();
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
      switchCamBtn.addEventListener('click', () => window.PupDexCamera.switchCamera());
    }

    // Sound Toggle Button
    const soundToggleBtn = document.getElementById('soundToggleBtn');
    if (soundToggleBtn) {
      soundToggleBtn.addEventListener('click', () => {
        const isEnabled = window.PupDexAudio.toggleSound();
        soundToggleBtn.textContent = isEnabled ? '🔊' : '🔇';
        this.showToast(isEnabled ? 'Sound On 🔊' : 'Sound Off 🔇');
      });
    }

    // AI Guard Toggle Button
    const aiGuardToggleBtn = document.getElementById('aiGuardToggleBtn');
    if (aiGuardToggleBtn) {
      aiGuardToggleBtn.addEventListener('click', () => {
        if (window.PupDexDogDetector) {
          window.PupDexDogDetector.strictMode = !window.PupDexDogDetector.strictMode;
          const isOn = window.PupDexDogDetector.strictMode;
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
          window.PupDexCamera.stopCamera();
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
      exportBtn.addEventListener('click', () => window.PupDexStorage.exportDataJSON());
    }

    const importInput = document.getElementById('importDataInput');
    if (importInput) {
      importInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (file) {
          const text = await file.text();
          const success = await window.PupDexStorage.importDataJSON(text);
          if (success) {
            this.showToast('PupDex imported successfully! 🎉');
            this.profile = window.PupDexStorage.getProfile();
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

    window.PupDexAudio.playCardClick();
    this.renderCurrentView();
  }

  renderHeader() {
    const levelTitleEl = document.getElementById('trainerLevelTitle');
    const levelNumEl = document.getElementById('trainerLevelNum');
    const xpTextEl = document.getElementById('trainerXpText');
    const progressFillEl = document.getElementById('xpProgressFill');
    const streakNumEl = document.getElementById('streakNum');

    const nextXP = window.PupDexGamification.getXPForLevel(this.profile.level);
    const title = window.PupDexGamification.getTrainerTitle(this.profile.level);

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
      window.PupDexMap.init();
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

    const dogs = await window.PupDexStorage.getAllDogs();

    if (dogs.length === 0) {
      grid.style.display = 'none';
      if (emptyState) emptyState.style.display = 'block';
      return;
    }

    grid.style.display = 'grid';
    if (emptyState) emptyState.style.display = 'none';

    grid.innerHTML = dogs.map(dog => {
      const rarityObj = window.PupDexGamification.rarities[dog.rarity] || window.PupDexGamification.rarities.common;
      const sizeObj = window.PupDexGamification.sizes[dog.size] || window.PupDexGamification.sizes.medium;
      const vibeObj = window.PupDexGamification.vibes[dog.vibe] || window.PupDexGamification.vibes.normal;
      const dateStr = new Date(dog.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

      return `
        <div class="dog-card" onclick="window.PupDexApp.openDogDetail('${dog.id}')">
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

    const combos = window.PupDexGamification.getMatrixCombos();
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

    const allDogs = await window.PupDexStorage.getAllDogs();
    const { newlyUnlocked } = window.PupDexGamification.checkAchievements(this.profile, allDogs);
    window.PupDexStorage.saveProfile(this.profile);

    const unlocked = this.profile.badgesUnlocked || [];

    grid.innerHTML = window.PupDexGamification.achievementsList.map(ach => {
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

    const dogs = await window.PupDexStorage.getAllDogs();
    const rareCount = dogs.filter(d => d.rarity === 'rare' || d.rarity === 'epic' || d.rarity === 'legendary').length;

    if (totalDogsEl) totalDogsEl.textContent = dogs.length;
    if (totalRaresEl) totalRaresEl.textContent = rareCount;
    if (rankTitleEl) rankTitleEl.textContent = window.PupDexGamification.getTrainerTitle(this.profile.level);
  }

  // Camera & Capture Flow
  async openCameraModal() {
    const modal = document.getElementById('cameraModal');
    const video = document.getElementById('viewfinderVideo');
    const canvas = document.getElementById('viewfinderCanvas');

    if (modal && video && canvas) {
      modal.classList.add('active');
      const started = await window.PupDexCamera.startCamera(video, canvas);
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

    window.PupDexAudio.playShutter();

    // Capture snapshot frame
    let imgData = window.PupDexCamera.captureSnapshot();
    if (!imgData) {
      imgData = window.PupDexCamera.generatePlaceholderDogImage('medium', 'friendly');
    }
    this.capturedImageData = imgData;

    // Check frame using Dog Detector
    let detection = { isDog: true, confidence: 1.0, label: 'Good Boi' };
    if (window.PupDexDogDetector && window.PupDexDogDetector.strictMode) {
      this.showToast('AI Scanning for Good Boi... 🔍');
      const tempImg = await this.createImgFromData(imgData);
      detection = await window.PupDexDogDetector.detectDog(tempImg);
      console.log('AI Detector Result:', detection);
    }

    if (shutterBtn) {
      shutterBtn.style.pointerEvents = 'auto';
      shutterBtn.style.opacity = '1';
    }

    // If NOT a dog and user hasn't tried twice (fail-safe override)
    if (!detection.isDog && this.failedAttempts < 1) {
      this.failedAttempts += 1;
      window.PupDexAudio.playError();
      
      const detectedName = detection.label || 'Object';
      this.showToast(`No dog detected! 🐶 (Found: ${detectedName}). Tap again to force capture!`);
      
      if (shutterBtn) {
        shutterBtn.style.transform = 'scale(0.85)';
        setTimeout(() => shutterBtn.style.transform = '', 300);
      }
      return; // Keep camera open for retry
    }

    // Success or Force Capture! Reset failed attempts
    this.failedAttempts = 0;
    window.PupDexCamera.stopCamera();

    // Check Sparkle Lure
    let streakBonus = this.profile.streak;
    if (window.PupDexTreats && window.PupDexTreats.activeLure) {
      streakBonus += 5; // Extra legendary luck
      window.PupDexTreats.activeLure = false;
    }

    // Roll Gacha Rarity
    this.pendingRarity = window.PupDexGamification.rollRarity(streakBonus);
    window.PupDexAudio.playGachaReveal(this.pendingRarity);

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
    const rarityObj = window.PupDexGamification.rarities[this.pendingRarity];

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
      sizeContainer.innerHTML = Object.keys(window.PupDexGamification.sizes).map(key => {
        const s = window.PupDexGamification.sizes[key];
        const isSelected = this.selectedSize === key;
        return `
          <div class="option-card ${isSelected ? 'selected' : ''}" onclick="window.PupDexApp.selectSize('${key}')">
            <div class="option-icon">${s.emoji}</div>
            <div class="option-name">${s.name}</div>
            <div class="option-sub">${s.desc}</div>
          </div>
        `;
      }).join('');
    }

    if (vibeContainer) {
      vibeContainer.innerHTML = Object.keys(window.PupDexGamification.vibes).map(key => {
        const v = window.PupDexGamification.vibes[key];
        const isSelected = this.selectedVibe === key;
        return `
          <div class="option-card ${isSelected ? 'selected' : ''}" onclick="window.PupDexApp.selectVibe('${key}')">
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
    window.PupDexAudio.playCardClick();
    this.renderOptionPickers();
  }

  selectVibe(vibeKey) {
    this.selectedVibe = vibeKey;
    window.PupDexAudio.playCardClick();
    this.renderOptionPickers();
  }

  async saveCapturedDog() {
    if (!this.selectedSize || !this.selectedVibe || !this.capturedImageData) return;

    const location = await window.PupDexCamera.getGeolocation();
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

    await window.PupDexStorage.saveDog(dogRecord);
    if (window.PupDexFirebase) {
      window.PupDexFirebase.postToSocialFeed(dogRecord);
    }

    // Calculate XP & Level Up
    const earnedXP = window.PupDexGamification.calculateXP(this.pendingRarity, isNewCombo);
    this.profile.xp += earnedXP;
    this.profile = window.PupDexGamification.updateStreak(this.profile);
    window.PupDexTreats.addBones(5); // +5 Bones per catch

    const nextXP = window.PupDexGamification.getXPForLevel(this.profile.level);
    if (this.profile.xp >= nextXP) {
      this.profile.level += 1;
      window.PupDexAudio.playLevelUp();
      this.showToast(`LEVEL UP! You are now Lvl ${this.profile.level}! 🎉`);
    } else {
      this.showToast(`+${earnedXP} XP & +5 Bones 🦴! Logged to PupDex 🐾`);
    }

    // Check Badges
    const allDogs = await window.PupDexStorage.getAllDogs();
    const { newlyUnlocked } = window.PupDexGamification.checkAchievements(this.profile, allDogs);
    window.PupDexStorage.saveProfile(this.profile);

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
    const dogs = await window.PupDexStorage.getAllDogs();
    const dog = dogs.find(d => d.id === id);
    if (!dog) return;

    this.currentDetailDog = dog;
    const modal = document.getElementById('dogDetailModal');
    const imgEl = document.getElementById('detailDogImg');
    const infoEl = document.getElementById('detailDogInfo');
    const deleteBtn = document.getElementById('deleteDogBtn');

    const rarityObj = window.PupDexGamification.rarities[dog.rarity];
    const sizeObj = window.PupDexGamification.sizes[dog.size];
    const vibeObj = window.PupDexGamification.vibes[dog.vibe];

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
        if (confirm('Release this Good Boi from your PupDex?')) {
          await window.PupDexStorage.deleteDog(id);
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
        photo: window.PupDexCamera.generatePlaceholderDogImage('potato', 'friendly'),
        rarity: 'rare',
        size: 'potato',
        vibe: 'friendly',
        comboKey: 'potato-friendly',
        locationText: 'Central Park Walk'
      },
      {
        id: 'sample_2',
        timestamp: Date.now() - 3600000 * 24,
        photo: window.PupDexCamera.generatePlaceholderDogImage('chonker', 'normal'),
        rarity: 'epic',
        size: 'chonker',
        vibe: 'normal',
        comboKey: 'chonker-normal',
        locationText: 'Bakery Alley'
      }
    ];

    for (const d of sampleDogs) {
      await window.PupDexStorage.saveDog(d);
    }
    this.profile.xp = 125;
    this.profile.level = 2;
    this.profile.matrixUnlocked = ['potato-friendly', 'chonker-normal'];
    window.PupDexStorage.saveProfile(this.profile);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.PupDexApp = new PupDexApp();
  window.PupDexApp.init();
});
