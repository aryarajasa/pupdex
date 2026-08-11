// Interactive Onboarding Controller for PupDex
class PupdexOnboarding {
  constructor() {
    this.currentSlide = 0;
    this.slides = [
      {
        title: "Welcome to PupDex! 🐾",
        desc: "Spot a wild dog in the street, snap a photo, and collect them in your neighborhood PupDex album!",
        img: "assets/images/ob_1.jpg"
      },
      {
        title: "Rock-Paper-Scissors Battles! 🥊",
        desc: "Compete in friendly 3-round Bark-Offs! Potato pups beat Chonkers in Zoomies, and Friendly dogs beat Barkers in Charm!",
        img: "assets/images/ob_2.jpg"
      },
      {
        title: "Map & Friends Social Feed! 📍",
        desc: "Share your catches with friends, plot dogs on the interactive map, and give 'Boop 🐾' likes on friends' posts!",
        img: "assets/images/ob_3.jpg"
      }
    ];
  }

  init() {
    const hasSeen = localStorage.getItem('pupdex_seen_onboarding');
    if (!hasSeen) {
      this.openModal();
    }
  }

  openModal() {
    const modal = document.getElementById('onboardingModal');
    if (!modal) return;
    this.currentSlide = 0;
    this.renderSlide();
    modal.classList.add('active');
  }

  closeModal() {
    localStorage.setItem('pupdex_seen_onboarding', 'true');
    const modal = document.getElementById('onboardingModal');
    if (modal) modal.classList.remove('active');
  }

  nextSlide() {
    if (this.currentSlide < this.slides.length - 1) {
      this.currentSlide++;
      this.renderSlide();
    } else {
      this.closeModal();
    }
  }

  prevSlide() {
    if (this.currentSlide > 0) {
      this.currentSlide--;
      this.renderSlide();
    }
  }

  renderSlide() {
    const slide = this.slides[this.currentSlide];
    const imgEl = document.getElementById('obSlideImg');
    const titleEl = document.getElementById('obSlideTitle');
    const descEl = document.getElementById('obSlideDesc');
    const dotsEl = document.getElementById('obSlideDots');
    const nextBtn = document.getElementById('obNextBtn');

    if (imgEl) imgEl.src = slide.img;
    if (titleEl) titleEl.textContent = slide.title;
    if (descEl) descEl.textContent = slide.desc;

    if (dotsEl) {
      dotsEl.innerHTML = this.slides.map((_, i) => `
        <span class="ob-dot ${i === this.currentSlide ? 'active' : ''}"></span>
      `).join('');
    }

    if (nextBtn) {
      nextBtn.textContent = this.currentSlide === this.slides.length - 1 ? "Get Started 🚀" : "Next →";
    }
  }
}

window.pupdexOnboarding = new PupdexOnboarding();
