<div align="center">

# 🐾 PupDex (Pawkédex PWA)

**The ultimate mobile Progressive Web App for encountering, logging, and collecting wild dogs in your neighborhood!**

[![PWA Ready](https://img.shields.io/badge/PWA-iOS%20%26%20Android-ff6b81?style=for-the-badge&logo=pwa)](https://aryarajasa.github.io/pupdex/)
[![License: MIT](https://img.shields.io/badge/License-MIT-3b82f6?style=for-the-badge)](LICENSE)
[![GitHub Pages](https://img.shields.io/badge/Hosted%20on-GitHub%20Pages-22c55e?style=for-the-badge&logo=github)](https://aryarajasa.github.io/pupdex/)

[**Live Demo App 🚀**](https://aryarajasa.github.io/pupdex/) • [**Features**](#-features) • [**iOS Setup**](#-how-to-install-on-iphone) • [**Tech Stack**](#%EF%B8%8F-tech-stack)

<br />

<img src="assets/images/banner.jpg" alt="PupDex Hero Banner" width="600" style="border-radius: 20px;" />

</div>

---

## ✨ Features

### 📷 Live Camera & AI Dog Guard
* **Camera Viewfinder**: Scan your surroundings with a Poké-style HUD target reticle and camera switcher (`🔄`).
* **In-Browser AI Detector**: Powered by **TensorFlow.js** & **COCO-SSD**, the app verifies whether a real dog is in the camera frame before allowing capture!

### ✨ Gacha Rarity & Holographic Foil Cards
* Snapping a photo rolls a randomized **Rarity Tier**:
  * ⚪ **Common** (60%)
  * 🔵 **Rare** (25%)
  * 🟣 **Epic** (10%)
  * ✨ **Legendary / Shiny** (5% - Rainbow animated holographic foil border!)

### 🥔 Cute Size & Vibe Pickers
* **Size**: 🥔 **Potato** (Smol) • 🐕 **Medium** (Standard Good Boi) • 🦛 **Chonker** (Absolute Unit)
* **Vibe**: 💚 **Friendly** (Tail Wagger) • 💛 **Normal** (Cool & Chill) • 📢 **Barker** (Loud Guard)

### 🥊 Strategic Rock-Paper-Scissors Bark-Off Battles
* **Type Advantage Matchups**:
  * 🥔 **Potato** (+35 Speed) beats **Chonker** in *Zoomies Sprint ⚡*
  * 🦛 **Chonker** (+35 Weight) beats **Medium** in *Chonk Off 🪨*
  * 💚 **Friendly** (+35 Charm) beats **Barker** in *Charm Contest 💖*
  * 📢 **Barker** (+35 Intimidation) beats **Normal** in *Bark Symphony 🔊*
* Compete in 3-round animated matches with 8-bit sound effects to earn **XP** and **Bones 🦴**!

### 🗺️ Interactive Neighborhood Map
* Powered by **Leaflet.js**, plot all your caught dogs on an interactive street map with custom paw pin markers (`📍`).

### 🎨 Poké-Sticker Card Decorator & Trading Card Export
* Decorate any dog photo with virtual stickers (Sunglasses 🕶️, Party Hat 🥳, Bow 🎀, Bone 🦴, Crown 👑, Speech Bubbles 💬).
* Export high-resolution PNG trading cards ready to post on Instagram Stories or send via iMessage!

### 🦴 Treat Shop & Bone Inventory
* Earn **Bones 🦴** from catches, daily streaks, and battle victories.
* Spend 20 Bones in the **Treat Shop** to buy a **Sparkle Lure 🥩** (+30% Legendary Gacha chance!).

---

## 📲 How to Install on iPhone

1. Open **[https://aryarajasa.github.io/pupdex/](https://aryarajasa.github.io/pupdex/)** in **Safari** on your iPhone.
2. Tap the **Share button** (the square box with an upward arrow at the bottom of Safari).
3. Scroll down and select **"Add to Home Screen"**.
4. Name it **PupDex** and tap **Add**.

Now you have a full-screen, native-feeling app on your iPhone home screen that works offline! 🐾

---

## 🛠️ Tech Stack

* **Frontend**: HTML5, Vanilla CSS3 (Custom warm pastel design system, iOS safe areas), JavaScript ES6+
* **AI Machine Learning**: TensorFlow.js (`@tensorflow/tfjs`) & COCO-SSD (`@tensorflow-models/coco-ssd`)
* **Maps**: Leaflet.js & OpenStreetMap
* **Audio**: Web Audio API (Synthesized 8-bit sound effects)
* **Storage**: IndexedDB (`BarkDexDB`), LocalStorage, and Service Worker (`sw.js`)
* **Social & Auth**: Firebase Auth & Firestore SDK v10

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for details.

<div align="center">
Made with ❤️ for dog lovers everywhere 🐶
</div>
