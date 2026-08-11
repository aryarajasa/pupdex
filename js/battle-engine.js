// Solution 2 Rock-Paper-Scissors Bark-Off Battle Engine
class BarkdexBattleEngine {
  constructor() {
    this.currentDog = null;
    this.opponentDog = null;
    this.userScore = 0;
    this.oppScore = 0;
    this.currentRound = 0;
  }

  startBattle(myDog) {
    this.currentDog = myDog;
    this.opponentDog = this.generateWildChallenger();
    this.userScore = 0;
    this.oppScore = 0;
    this.currentRound = 0;

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

  calculateRoundResult(roundType) {
    const p1 = this.currentDog;
    const p2 = this.opponentDog;

    let p1Pts = 50;
    let p2Pts = 50;

    if (roundType === 'zoomies') {
      // Potato beats Chonker in Zoomies!
      p1Pts += (p1.size === 'potato' ? 35 : p1.size === 'medium' ? 15 : 0);
      p2Pts += (p2.size === 'potato' ? 35 : p2.size === 'medium' ? 15 : 0);
    } else if (roundType === 'chonk') {
      // Chonker beats Potato in Chonk Off!
      p1Pts += (p1.size === 'chonker' ? 35 : p1.size === 'medium' ? 15 : 0);
      p2Pts += (p2.size === 'chonker' ? 35 : p2.size === 'medium' ? 15 : 0);
    } else if (roundType === 'charm') {
      // Friendly beats Barker in Charm!
      p1Pts += (p1.vibe === 'friendly' ? 35 : p1.vibe === 'normal' ? 15 : 0);
      p2Pts += (p2.vibe === 'friendly' ? 35 : p2.vibe === 'normal' ? 15 : 0);
    } else if (roundType === 'bark') {
      // Barker beats Friendly in Bark Volume!
      p1Pts += (p1.vibe === 'barker' ? 35 : p1.vibe === 'normal' ? 15 : 0);
      p2Pts += (p2.vibe === 'barker' ? 35 : p2.vibe === 'normal' ? 15 : 0);
    }

    // Add random 1-15 energy swing
    p1Pts += Math.floor(Math.random() * 15);
    p2Pts += Math.floor(Math.random() * 15);

    return { p1Pts, p2Pts, p1Wins: p1Pts >= p2Pts };
  }

  playNextRound() {
    const rounds = ['zoomies', 'chonk', 'charm', 'bark'];
    if (this.currentRound >= 3) {
      this.finishBattle();
      return;
    }

    const roundType = rounds[this.currentRound];
    const res = this.calculateRoundResult(roundType);

    if (res.p1Wins) {
      this.userScore++;
      window.barkdexAudio.playCardClick();
    } else {
      this.oppScore++;
      window.barkdexAudio.playError();
    }

    this.currentRound++;
    this.renderBattleArena(roundType, res);
  }

  finishBattle() {
    const userWon = this.userScore >= this.oppScore;
    if (userWon) {
      window.barkdexAudio.playLevelUp();
      window.barkdexApp.profile.xp += 100;
      window.barkdexTreats.addBones(10);
      window.barkdexApp.showToast('VICTORY! +100 XP & +10 Bones 🦴!');
    } else {
      window.barkdexAudio.playError();
      window.barkdexApp.showToast('Good Match! Earned +25 XP 🐾');
    }
    window.barkdexStorage.saveProfile(window.barkdexApp.profile);
    window.barkdexApp.renderHeader();
  }

  renderBattleArena(lastRoundType = '', lastRes = null) {
    const container = document.getElementById('battleArenaContainer');
    if (!container) return;

    const roundNames = ['Round 1: Zoomies Sprint ⚡', 'Round 2: The Chonk Off 🦛', 'Round 3: Charm Contest 💖', 'Final Results 🏆'];

    container.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
        <div style="text-align:center;flex:1;">
          <img src="${this.currentDog.photo}" style="width:90px;height:90px;border-radius:18px;object-fit:cover;border:3px solid var(--accent-peach);" />
          <div style="font-weight:800;font-size:13px;margin-top:4px;">My Good Boi</div>
          <div style="font-size:18px;font-weight:900;color:var(--accent-peach);">${this.userScore} PTS</div>
        </div>

        <div style="font-size:24px;font-weight:900;color:var(--accent-lavender);">VS</div>

        <div style="text-align:center;flex:1;">
          <img src="${this.opponentDog.photo}" style="width:90px;height:90px;border-radius:18px;object-fit:cover;border:3px solid var(--accent-lavender);" />
          <div style="font-weight:800;font-size:13px;margin-top:4px;">${this.opponentDog.name}</div>
          <div style="font-size:18px;font-weight:900;color:var(--accent-lavender);">${this.oppScore} PTS</div>
        </div>
      </div>

      <div style="background:var(--bg-card-secondary);padding:14px;border-radius:16px;text-align:center;margin-bottom:18px;">
        <div style="font-size:14px;font-weight:800;color:var(--text-main);">${roundNames[this.currentRound] || 'Battle Complete!'}</div>
        ${lastRes ? `<div style="font-size:12px;color:var(--text-muted);margin-top:4px;">Round score: ${lastRes.p1Pts} vs ${lastRes.p2Pts} (${lastRes.p1Wins ? 'You won round!' : 'Opponent won round'})</div>` : ''}
      </div>

      ${this.currentRound < 3 ? `
        <button class="btn-primary" style="width:100%;padding:14px;font-size:15px;" onclick="window.barkdexBattleEngine.playNextRound()">Fight Round ${this.currentRound + 1} 🥊</button>
      ` : `
        <button class="btn-primary" style="width:100%;padding:14px;font-size:15px;" onclick="document.getElementById('battleModal').classList.remove('active')">Collect Rewards 🏆</button>
      `}
    `;
  }
}

window.barkdexBattleEngine = new BarkdexBattleEngine();
