// Firebase & Social Engine for PupDex
class PupdexFirebase {
  constructor() {
    this.user = null;
    this.db = null;
    this.auth = null;
    this.isLoading = false;
  }

  injectScript(src) {
    return new Promise((resolve) => {
      if (document.querySelector(`script[src="${src}"]`)) {
        resolve();
        return;
      }
      const s = document.createElement('script');
      s.src = src;
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => resolve();
      document.body.appendChild(s);
    });
  }

  async lazyLoadFirebase() {
    if (window.firebase || this.isLoading) return;
    this.isLoading = true;

    try {
      await this.injectScript('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
      await this.injectScript('https://www.gstatic.com/firebasejs/10.8.0/firebase-auth-compat.js');
      await this.injectScript('https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore-compat.js');

      if (window.firebase) {
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
            this.updateUserUI(user);
          }
        });
      }
    } catch (e) {
      console.warn('Firebase lazy-load warning:', e);
    } finally {
      this.isLoading = false;
    }
  }

  async signInWithGoogle() {
    await this.lazyLoadFirebase();
    if (!this.auth) {
      window.pupdexApp.showToast('Signed in as Guest Scout 🧢');
      return;
    }
    try {
      const provider = new firebase.auth.GoogleAuthProvider();
      const result = await this.auth.signInWithPopup(provider);
      this.user = result.user;
      window.pupdexApp.showToast(`Welcome, ${this.user.displayName}! 🐶`);
      this.updateUserUI(this.user);
    } catch (err) {
      console.warn('Google Sign-in failed or closed:', err);
      window.pupdexApp.showToast('Signed in as Guest Scout 🧢');
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
    if (!this.db || !this.user) return;
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

window.pupdexFirebase = new PupdexFirebase();
