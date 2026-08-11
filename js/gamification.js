// Gamification Engine for PupDex
class PupDexGamification {
  constructor() {
    this.rarities = {
      common: { name: 'Common', emoji: '⚪', color: '#94a3b8', multiplier: 1, chance: 0.60, title: 'Standard Good Boi' },
      rare: { name: 'Rare', emoji: '🔵', color: '#3b82f6', multiplier: 1.5, chance: 0.25, title: 'Extra Special Boi' },
      epic: { name: 'Epic', emoji: '🟣', color: '#a855f7', multiplier: 2, chance: 0.10, title: 'Majestic Canine' },
      legendary: { name: 'Legendary ✨', emoji: '✨', color: '#f59e0b', multiplier: 3, chance: 0.05, title: 'Mythical Shiny Boi!' }
    };

    this.sizes = {
      potato: { name: 'Potato', emoji: '🥔', desc: 'Smol & Pocket Sized' },
      medium: { name: 'Medium', emoji: '🐕', desc: 'Classic Good Boi' },
      chonker: { name: 'Chonker', emoji: '🦛', desc: 'Absolute Unit!' }
    };

    this.vibes = {
      friendly: { name: 'Friendly', emoji: '💚', desc: 'Wagging Tail & Kisses' },
      normal: { name: 'Normal', emoji: '💛', desc: 'Cool, Chill & Unbothered' },
      barker: { name: 'Barker', emoji: '📢', desc: 'Loud & Vigilant Guard' }
    };

    this.levelTitles = [
      'Puppy Observer 🐣',
      'Snackmaster 🦴',
      'Good Boi Whisperer 🐾',
      'Park Explorer 🌳',
      'Neighborhood Scout 🔭',
      'Canine Tracker 🐕',
      'PupDex Specialist 🎖️',
      'Doggo Legend 🌟',
      'Master Trainer 👑',
      'Ultimate PupDex Champion 🏆'
    ];

    this.achievementsList = [
      { id: 'first_catch', name: 'First Encounter', emoji: '🐾', desc: 'Log your very first dog!', check: (p, d) => d.length >= 1 },
      { id: 'potato_patrol', name: 'Potato Patrol', emoji: '🥔', desc: 'Catch 3 Potato-sized pups', check: (p, d) => d.filter(x => x.size === 'potato').length >= 3 },
      { id: 'chonk_connoisseur', name: 'Chonk Connoisseur', emoji: '🦛', desc: 'Catch 3 Chonker dogs', check: (p, d) => d.filter(x => x.size === 'chonker').length >= 3 },
      { id: 'loud_proud', name: 'Loud & Proud', emoji: '📢', desc: 'Catch 3 Barker vibe dogs', check: (p, d) => d.filter(x => x.vibe === 'barker').length >= 3 },
      { id: 'peaceful_pack', name: 'Peaceful Pack', emoji: '💚', desc: 'Catch 5 Friendly dogs', check: (p, d) => d.filter(x => x.vibe === 'friendly').length >= 5 },
      { id: 'shiny_hunter', name: 'Shiny Hunter', emoji: '✨', desc: 'Catch a Legendary Shiny dog', check: (p, d) => d.some(x => x.rarity === 'legendary') },
      { id: 'matrix_master', name: 'Matrix Master', emoji: '🧩', desc: 'Unlock all 9 Good Boi Combos', check: (p) => (p.matrixUnlocked || []).length >= 9 },
      { id: 'streak_3', name: 'Dedicated Scout', emoji: '🔥', desc: 'Maintain a 3-day encounter streak', check: (p) => p.streak >= 3 }
    ];
  }

  // Weighted Random Gacha Roll
  rollRarity(streakDays = 0) {
    // Streaks slightly boost Legendary & Epic chances
    const streakBonus = Math.min(streakDays * 0.01, 0.05);
    const rand = Math.random();

    const legendaryCutoff = 0.05 + streakBonus;
    const epicCutoff = 0.15 + streakBonus;
    const rareCutoff = 0.40;

    if (rand < legendaryCutoff) return 'legendary';
    if (rand < epicCutoff) return 'epic';
    if (rand < rareCutoff) return 'rare';
    return 'common';
  }

  // Calculate XP required for next level
  getXPForLevel(level) {
    return level * 100 + (level - 1) * 50;
  }

  getTrainerTitle(level) {
    const index = Math.min(Math.max(0, level - 1), this.levelTitles.length - 1);
    return this.levelTitles[index];
  }

  calculateXP(rarityKey, isNewCombo) {
    const baseXP = 50;
    const mult = this.rarities[rarityKey]?.multiplier || 1;
    const comboBonus = isNewCombo ? 50 : 0;
    return Math.round(baseXP * mult) + comboBonus;
  }

  // Check and update Daily Streak
  updateStreak(profile) {
    const todayStr = new Date().toISOString().slice(0, 10);
    if (!profile.lastCatchDate) {
      profile.streak = 1;
      profile.lastCatchDate = todayStr;
      return profile;
    }

    const last = new Date(profile.lastCatchDate);
    const now = new Date(todayStr);
    const diffDays = Math.round((now - last) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      profile.streak += 1;
      profile.lastCatchDate = todayStr;
    } else if (diffDays > 1) {
      profile.streak = 1;
      profile.lastCatchDate = todayStr;
    }
    // If diffDays === 0, keep same streak, already logged today
    return profile;
  }

  // Evaluate new achievements unlocked
  checkAchievements(profile, allDogs) {
    const newlyUnlocked = [];
    if (!profile.badgesUnlocked) profile.badgesUnlocked = [];

    this.achievementsList.forEach(ach => {
      if (!profile.badgesUnlocked.includes(ach.id)) {
        if (ach.check(profile, allDogs)) {
          profile.badgesUnlocked.push(ach.id);
          newlyUnlocked.push(ach);
        }
      }
    });

    return { profile, newlyUnlocked };
  }

  // Get all 9 3x3 combinations
  getMatrixCombos() {
    const combos = [];
    Object.keys(this.sizes).forEach(sizeKey => {
      Object.keys(this.vibes).forEach(vibeKey => {
        combos.push({
          id: `${sizeKey}-${vibeKey}`,
          sizeKey,
          vibeKey,
          sizeObj: this.sizes[sizeKey],
          vibeObj: this.vibes[vibeKey],
          name: `${this.vibes[vibeKey].name} ${this.sizes[sizeKey].name}`
        });
      });
    });
    return combos;
  }
}

// Global window aliases for backwards compatibility
window.pupdexGamification = window.PupDexGamification = window.barkdexGamification = new PupDexGamification();
