// Solution 2 Rock-Paper-Scissors Bark-Off Battle Engine with Animated Clash & Stat Bars
class PupdexBattleEngine {
  constructor() {
    this.currentDog = null;
    this.opponentDog = null;
    this.userScore = 0;
    this.oppScore = 0;
    this.currentRound = 0;
    this.isAnimating = false;

    this.roundConfig = [
      { name: 'Round 1: Zoomies Sprint ⚡', key: 'zoomies', desc: 'Potato pups gain +35 Speed!' },
      { name: 'Round 2: The Chonk Off 🦛', key: 'chonk', desc: 'Chonker dogs gain +35 Weight!' },
      { name: 'Round 3: Charm Contest 💖', key: 'charm', desc: 'Friendly dogs gain +35 Charm!' },
      { name: 'Round 4: Bark Symphony 📢', key: 'bark', desc: 'Barker dogs gain +35 Intimidation!' }
    ];
  }

  startBattle(myDog) {
    if (!myDog) return;
    this.currentDog = myDog;
    this.opponentDog = this.generateWildChallenger();
    this.userScore = 0;
    this.oppScore = 0;
    this.currentRound = 0;
    this.isAnimating = false;

    document.getElementById('dogDetailModal')?.classList.remove('active');

    const modal = document.getElementById('battleModal');
    if (!modal) return;

    this.renderBattleArena();
    modal.classList.add('active');
  }

  generateWildChallenger() {
    const names = ['Sir Fluffington', 'Speedy Pup', 'Buster the Barker', 'Chonkzilla', 'Princess Waffles', 'Barnaby'];
    const sizes = ['potato', 'medium', 'chonker'];
    const vibes = ['friendly', 'normal', 'barker'];
    const rarities = ['common', 'rare', 'epic', 'legendary'];

    const size = sizes[Math.floor(Math.random() * sizes.length)];
    const vibe = vibes[Math.floor(Math.random() * vibes.length)];
    const rarity = rarities[Math.floor(Math.random() * rarities.length)];

    return {
      id: 'wild_' + Date.now(),
      name: names[Math.floor(Math.random() * names.length)],
      size,
      vibe,
      rarity,
      photo: window.barkdexCamera.generatePlaceholderDogImage(size, vibe)
    };
  }

  calculateRoundResult(roundKey) {
    const p1 = this.currentDog;
    const p2 = this.opponentDog;

    let p1Pts = 40;
    let p2Pts = 40;

    if (roundKey === 'zoomies') {
      p1Pts += (p1.size === 'potato' ? 35 : p1.size === 'medium' ? 15 : 0);
      p2Pts += (p2.size === 'potato' ? 35 : p2.size === 'medium' ? 15 : 0);
    } else if (roundKey === 'chonk') {
      p1Pts += (p1.size === 'chonker' ? 35 : p1.size === 'medium' ? 15 : 0);
      p2Pts += (p2.size === 'chonker' ? 35 : p2.size === 'medium' ? 15 : 0);
    } else if (roundKey === 'charm') {
      p1Pts += (p1.vibe === 'friendly' ? 35 : p1.vibe === 'normal' ? 15 : 0);
      p2Pts += (p2.vibe === 'friendly' ? 35 : p2.vibe === 'normal' ? 15 : 0);
    } else if (roundKey === 'bark') {
      p1Pts += (p1.vibe === 'barker' ? 35 : p1.vibe === 'normal' ? 15 : 0);
      p2Pts += (p2.vibe === 'barker' ? 35 : p2.vibe === 'normal' ? 15 : 0);
    }

    p1Pts += Math.floor(Math.random() * 15);
    p2Pts += Math.floor(Math.random() * 15);

    return { p1Pts, p2Pts, p1Wins: p1Pts >= p2Pts };
  }

  async playNextRound() {
    if (this.isAnimating) return;
    if (this.currentRound >= 3) {
      document.getElementById('battleModal')?.classList.remove('active');
      return;
    }

    this.isAnimating = true;
    const currentConfig = this.roundConfig[this.currentRound];
    const res = this.calculateRoundResult(currentConfig.key);

    const p1Card = document.getElementById('battleCardUser');
    const p2Card = document.getElementById('battleCardOpp');
    const p1Bar = document.getElementById('battleBarUser');
    const p2Bar = document.getElementById('battleBarOpp');
    const statusText = document.getElementById('battleStatusText');
    const actionBtn = document.getElementById('battleActionBtn');

    if (actionBtn) {
      actionBtn.disabled = true;
      actionBtn.style.opacity = '0.5';
    }

    if (statusText) {
      statusText.innerHTML = `🥊 ${currentConfig.name}... FIGHT!`;
    }

    // Step 1: Card Clash Animation
    if (p1Card && p2Card) {
      p1Card.style.transform = 'translateX(25px) rotate(6deg)';
      p2Card.style.transform = 'translateX(-25px) rotate(-6deg)';
      window.pupdexAudio.playShutter();
      await this.sleep(400);

      p1Card.style.transform = 'translateX(0) rotate(0deg)';
      p2Card.style.transform = 'translateX(0) rotate(0deg)';
    }

    // Step 2: Animated Health / Power Fill Bars
    if (p1Bar && p2Bar) {
      p1Bar.style.width = `${Math.min(100, res.p1Pts)}%`;
      p2Bar.style.width = `${Math.min(100, res.p2Pts)}%`;
      await this.sleep(600);
    }

    // Step 3: Round Winner Announcement & Sound
    if (res.p1Wins) {
      this.userScore++;
      window.pupdexAudio.playCardClick();
      if (p1Card) p1Card.style.animation = 'pulse-glow 0.6s ease';
      if (statusText) statusText.innerHTML = `✨ You won ${currentConfig.name}! (+${res.p1Pts} pts)`;
    } else {
      this.oppScore++;
      window.pupdexAudio.playError();
      if (p2Card) p2Card.style.animation = 'pulse-glow 0.6s ease';
      if (statusText) statusText.innerHTML = `💥 ${this.opponentDog.name} won round! (+${res.p2Pts} pts)`;
    }

    this.currentRound++;
    await this.sleep(600);

    // Update Score Badge
    const scoreText = document.getElementById('battleScoreText');
    if (scoreText) {
      scoreText.textContent = `${this.userScore} - ${this.oppScore}`;
    }

    if (this.currentRound >= 3) {
      this.finishBattle();
    } else {
      if (actionBtn) {
        actionBtn.disabled = false;
        actionBtn.style.opacity = '1';
        actionBtn.textContent = `Fight Round ${this.currentRound + 1} 🥊`;
      }
    }
    this.isAnimating = false;
  }

  finishBattle() {
    const statusText = document.getElementById('battleStatusText');
    const actionBtn = document.getElementById('battleActionBtn');
    const userWon = this.userScore >= this.oppScore;

    if (userWon) {
      window.pupdexAudio.playLevelUp();
      window.pupdexApp.profile.xp += 100;
      window.pupdexTreats.addBones(10);
      window.pupdexApp.showToast('VICTORY! +100 XP & +10 Bones 🦴!');
      if (statusText) statusText.innerHTML = `🏆 BARK-OFF CHAMPION! Final Score: ${this.userScore} - ${this.oppScore}`;
    } else {
      window.pupdexAudio.playError();
      window.pupdexApp.showToast('Good Match! Earned +25 XP 🐾');
      if (statusText) statusText.innerHTML = `💔 Runner Up! Final Score: ${this.userScore} - ${this.oppScore}`;
    }

    window.pupdexStorage.saveProfile(window.pupdexApp.profile);
    window.pupdexApp.renderHeader();

    if (actionBtn) {
      actionBtn.disabled = false;
      actionBtn.style.opacity = '1';
      actionBtn.textContent = 'Collect Battle Rewards 🎁';
      actionBtn.onclick = () => {
        document.getElementById('battleModal')?.classList.remove('active');
      };
    }
  }

  renderBattleArena() {
    const container = document.getElementById('battleArenaContainer');
    if (!container) return;

    const mySize = window.pupdexGamification.sizes[this.currentDog.size];
    const myVibe = window.pupdexGamification.vibes[this.currentDog.vibe];

    const oppSize = window.pupdexGamification.sizes[this.opponentDog.size];
    const oppVibe = window.pupdexGamification.vibes[this.opponentDog.vibe];

    container.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;gap:10px;">
        <div id="battleCardUser" class="matrix-card" style="text-align:center;flex:1;padding:12px;margin:0;transition:transform 0.3s ease;">
          <img src="${this.currentDog.photo}" style="width:80px;height:80px;border-radius:18px;object-fit:cover;border:3px solid var(--accent-peach);margin-bottom:6px;" />
          <div style="font-weight:800;font-size:13px;color:var(--text-main);">My Good Boi</div>
          <div style="font-size:11px;color:var(--text-muted);">${mySize.emoji} ${mySize.name} • ${myVibe.emoji}</div>
          <div class="progress-track" style="margin-top:8px;height:8px;">
            <div id="battleBarUser" class="progress-fill" style="width:0%;background:var(--accent-peach);"></div>
          </div>
        </div>

        <div style="text-align:center;width:50px;">
          <div style="font-size:22px;font-weight:900;color:var(--accent-peach);">VS</div>
          <div id="battleScoreText" style="font-size:14px;font-weight:900;color:var(--text-main);margin-top:2px;">0 - 0</div>
        </div>

        <div id="battleCardOpp" class="matrix-card" style="text-align:center;flex:1;padding:12px;margin:0;transition:transform 0.3s ease;">
          <img src="${this.opponentDog.photo}" style="width:80px;height:80px;border-radius:18px;object-fit:cover;border:3px solid var(--accent-lavender);margin-bottom:6px;" />
          <div style="font-weight:800;font-size:13px;color:var(--text-main);">${this.opponentDog.name}</div>
          <div style="font-size:11px;color:var(--text-muted);">${oppSize.emoji} ${oppSize.name} • ${oppVibe.emoji}</div>
          <div class="progress-track" style="margin-top:8px;height:8px;">
            <div id="battleBarOpp" class="progress-fill" style="width:0%;background:var(--accent-lavender);"></div>
          </div>
        </div>
      </div>

      <div style="background:var(--bg-card-secondary);padding:14px;border-radius:18px;border:1px solid var(--border-subtle);text-align:center;margin-bottom:18px;">
        <div id="battleStatusText" style="font-size:13px;font-weight:800;color:var(--text-main);">Tap below to start Round 1! 🥊</div>
      </div>

      <button id="battleActionBtn" class="btn-primary" style="width:100%;padding:14px;font-size:15px;" onclick="window.pupdexBattleEngine.playNextRound()">Fight Round 1 🥊</button>
    `;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

window.pupdexBattleEngine = new PupdexBattleEngine();
