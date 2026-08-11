// HTML5 Canvas Sticker Decorator & Card Exporter for PupDex
class PupdexDecorator {
  constructor() {
    this.currentDog = null;
    this.appliedStickers = [];
    this.stickers = [
      { id: 'sunglasses', emoji: '🕶️', name: 'Cool Glasses' },
      { id: 'partyhat', emoji: '🥳', name: 'Party Hat' },
      { id: 'bow', emoji: '🎀', name: 'Cute Bow' },
      { id: 'bone', emoji: '🦴', name: 'Dog Bone' },
      { id: 'crown', emoji: '👑', name: 'Royal Crown' },
      { id: 'woof', emoji: '💬 "WOOF!"', name: 'Woof Bubble' }
    ];
  }

  openDecoratorModal(dog) {
    if (!dog) return;
    this.currentDog = dog;
    this.appliedStickers = [];

    document.getElementById('dogDetailModal')?.classList.remove('active');

    const modal = document.getElementById('decoratorModal');
    const preview = document.getElementById('decoratorCanvasPreview');
    if (!modal || !preview) return;

    this.renderCanvas();
    this.renderStickerPicker();
    modal.classList.add('active');
  }

  addSticker(emoji) {
    this.appliedStickers.push({
      emoji,
      x: 180 + (Math.random() * 80 - 40),
      y: 220 + (Math.random() * 80 - 40),
      size: 54
    });
    window.pupdexAudio.playCardClick();
    this.renderCanvas();
  }

  renderStickerPicker() {
    const grid = document.getElementById('stickerPickerGrid');
    if (!grid) return;

    grid.innerHTML = this.stickers.map(s => `
      <button class="option-card" style="padding:10px;" onclick="window.pupdexDecorator.addSticker('${s.emoji.split(' ')[0]}')">
        <div style="font-size:28px;">${s.emoji.split(' ')[0]}</div>
        <div style="font-size:11px;font-weight:800;margin-top:2px;">${s.name}</div>
      </button>
    `).join('');
  }

  renderCanvas() {
    const canvas = document.getElementById('decoratorCanvasPreview');
    if (!canvas || !this.currentDog) return;
    const ctx = canvas.getContext('2d');

    canvas.width = 500;
    canvas.height = 650;

    // Background Card Frame
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 500, 650);

    // Header Color Block
    const grad = ctx.createLinearGradient(0, 0, 500, 120);
    grad.addColorStop(0, '#fb923c');
    grad.addColorStop(1, '#a5b4fc');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 500, 120);

    // Title Text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px -apple-system, sans-serif';
    ctx.fillText('PupDex Trading Card 🐾', 20, 50);

    // Dog Photo
    const img = new Image();
    img.src = this.currentDog.photo;
    img.onload = () => {
      ctx.drawImage(img, 30, 90, 440, 440);

      // Draw Stickers
      this.appliedStickers.forEach(st => {
        ctx.font = `${st.size}px sans-serif`;
        ctx.fillText(st.emoji, st.x, st.y);
      });

      // Footer Stats
      ctx.fillStyle = '#1e2025';
      ctx.fillRect(0, 540, 500, 110);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText(`Good Boi #${this.currentDog.id.slice(-4)}`, 30, 575);
      ctx.font = '14px sans-serif';
      ctx.fillStyle = '#9ca3af';
      ctx.fillText(`Size: ${this.currentDog.size.toUpperCase()} | Vibe: ${this.currentDog.vibe.toUpperCase()} | ${this.currentDog.rarity.toUpperCase()}`, 30, 605);
    };
  }

  downloadCardPNG() {
    const canvas = document.getElementById('decoratorCanvasPreview');
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `PupDex-Card-${Date.now()}.png`;
    a.click();
    window.pupdexApp.showToast('Trading Card downloaded! 📸');
  }
}

window.pupdexDecorator = new PupdexDecorator();
