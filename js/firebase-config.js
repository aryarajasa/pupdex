// Firebase & Social Engine for BarkDex
class BarkdexFirebase {
  constructor() {
    this.user = null;
    this.db = null;
    this.auth = null;
  }

  init() {
    // Check if Firebase SDK is loaded from CDN
    if (window.firebase) {
      try {
        const firebaseConfig = {
          apiKey: "AIzaSyBarkDexPublicDemoKey12345",
          authDomain: "barkdex-app.firebaseapp.com",
          projectId: "barkdex-app",
          storageBucket: "barkdex-app.appspot.com",
          messagingSenderId: "123456789",
          appId: "1:123456789:web:abcdef123456"
        };

        if (!firebase.apps.length) {
          firebase.initializeApp(firebaseConfig);
        }
        this.auth = firebase.auth();
        this.db = firebase.firestore();

        this.auth.onAuthStateChanged((user) => {
          if (user) {
            this.user = user;
            console.log('Firebase User logged in:', user.displayName);
            this.updateUserUI(user);
          } else {
            console.log('User signed out / Guest Mode');
          }
        });
      } catch (e) {
        console.warn('Firebase init warning:', e);
      }
    }
  }

  async signInWithGoogle() {
    if (!this.auth) {
      window.barkdexApp.showToast('Google Sign-In ready in Guest Mode! 🧢');
      return;
    }
    try {
      const provider = new firebase.auth.GoogleAuthProvider();
      const result = await this.auth.signInWithPopup(provider);
      this.user = result.user;
      window.barkdexApp.showToast(`Welcome, ${this.user.displayName}! 🐶`);
      this.updateUserUI(this.user);
    } catch (err) {
      console.warn('Google Sign-in failed or closed:', err);
      window.barkdexApp.showToast('Signed in as Guest Scout 🧢');
    }
  }

  updateUserUI(user) {
    const avatarEl = document.querySelector('.brand-avatar');
    const titleEl = document.getElementById('profileRankTitle');
    if (avatarEl && user.photoURL) {
      avatarEl.innerHTML = `<img src="${user.photoURL}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;" />`;
    }
    if (titleEl && user.displayName) {
      titleEl.textContent = user.displayName;
    }
  }

  async postToSocialFeed(dogRecord) {
    if (!this.db || !this.user) {
      console.log('Saved to local feed');
      return;
    }
    try {
      await this.db.collection('posts').add({
        ...dogRecord,
        userId: this.user.uid,
        userName: this.user.displayName || 'Good Boi Scout',
        userPhoto: this.user.photoURL || '',
        boopsCount: 0,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    } catch (e) {
      console.warn('Firestore post failed:', e);
    }
  }
}

window.barkdexFirebase = new BarkdexFirebase();
