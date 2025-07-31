import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './Landing.scss';

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger);

function Landing() {
  const navRef = useRef(null);
  const heroRef = useRef(null);
  const heroContentRef = useRef(null);
  const sportsGridRef = useRef(null);
  const featuresRef = useRef(null);
  const sportsGalleryRef = useRef(null);
  const aboutRef = useRef(null);
  const ctaRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Initial page load animations
      const tl = gsap.timeline();

      // Animate navigation bar
      tl.from(navRef.current, {
        y: -100,
        opacity: 0,
        duration: 1,
        ease: "power3.out"
      })
      
      // Animate hero content
      .from(heroContentRef.current.children, {
        y: 50,
        opacity: 0,
        duration: 0.8,
        stagger: 0.2,
        ease: "power3.out"
      }, "-=0.5")
      
      // Animate sports grid cards
      .from(sportsGridRef.current.children, {
        scale: 0,
        opacity: 0,
        duration: 0.6,
        stagger: 0.1,
        ease: "back.out(1.7)"
      }, "-=0.3");

      // Scroll-triggered animations
      ScrollTrigger.batch(".feature-card", {
        onEnter: (elements) => {
          gsap.from(elements, {
            y: 100,
            opacity: 0,
            duration: 0.8,
            stagger: 0.15,
            ease: "power3.out"
          });
        },
        start: "top 85%"
      });

      ScrollTrigger.batch(".sport-item", {
        onEnter: (elements) => {
          gsap.from(elements, {
            scale: 0,
            opacity: 0,
            duration: 0.6,
            stagger: 0.1,
            ease: "back.out(1.7)"
          });
        },
        start: "top 85%"
      });

      ScrollTrigger.batch(".stat-item", {
        onEnter: (elements) => {
          gsap.from(elements, {
            y: 50,
            opacity: 0,
            duration: 0.8,
            stagger: 0.1,
            ease: "power3.out"
          });
        },
        start: "top 85%"
      });

      ScrollTrigger.batch(".mission-card", {
        onEnter: (elements) => {
          gsap.from(elements, {
            x: 100,
            opacity: 0,
            duration: 0.8,
            stagger: 0.2,
            ease: "power3.out"
          });
        },
        start: "top 85%"
      });

      // Section title animations
      ScrollTrigger.batch(".section-title", {
        onEnter: (elements) => {
          gsap.from(elements, {
            y: 30,
            opacity: 0,
            duration: 0.8,
            ease: "power3.out"
          });
        },
        start: "top 90%"
      });

      // CTA section animation
      ScrollTrigger.create({
        trigger: ctaRef.current,
        start: "top 80%",
        onEnter: () => {
          gsap.from(ctaRef.current.children, {
            y: 50,
            opacity: 0,
            duration: 0.8,
            stagger: 0.2,
            ease: "power3.out"
          });
        }
      });

      // Hover animations for interactive elements
      const sportCards = document.querySelectorAll('.sport-card, .sport-item');
      sportCards.forEach(card => {
        card.addEventListener('mouseenter', () => {
          gsap.to(card, {
            scale: 1.05,
            duration: 0.3,
            ease: "power2.out"
          });
        });
        
        card.addEventListener('mouseleave', () => {
          gsap.to(card, {
            scale: 1,
            duration: 0.3,
            ease: "power2.out"
          });
        });
      });

      const featureCards = document.querySelectorAll('.feature-card');
      featureCards.forEach(card => {
        card.addEventListener('mouseenter', () => {
          gsap.to(card, {
            y: -10,
            duration: 0.3,
            ease: "power2.out"
          });
        });
        
        card.addEventListener('mouseleave', () => {
          gsap.to(card, {
            y: 0,
            duration: 0.3,
            ease: "power2.out"
          });
        });
      });

      // Button hover animations
      const buttons = document.querySelectorAll('.btn');
      buttons.forEach(btn => {
        btn.addEventListener('mouseenter', () => {
          gsap.to(btn, {
            scale: 1.05,
            duration: 0.3,
            ease: "power2.out"
          });
        });
        
        btn.addEventListener('mouseleave', () => {
          gsap.to(btn, {
            scale: 1,
            duration: 0.3,
            ease: "power2.out"
          });
        });
      });

      // Parallax effect for hero section
      ScrollTrigger.create({
        trigger: heroRef.current,
        start: "top top",
        end: "bottom top",
        scrub: 1,
        onUpdate: (self) => {
          gsap.to(heroContentRef.current, {
            y: self.progress * 50,
            duration: 0.3
          });
          gsap.to(sportsGridRef.current, {
            y: self.progress * -30,
            duration: 0.3
          });
        }
      });

    });

    return () => ctx.revert(); // Cleanup
  }, []);

  return (
    <div className="landing-page">
      {/* Top Navigation Bar */}
      <nav className="landing-nav" ref={navRef}>
        <div className="nav-container">
          <div className="nav-logo">
            <img src="/logo.png" alt="Sports Social" className="logo-img" />
            <span className="logo-text">Sports Social</span>
          </div>
          
          <div className="nav-links">
            <Link to="/events" className="nav-link">Events</Link>
            <Link to="/register" className="nav-link">Get Started</Link>
            <a href="#" className="nav-link">Download App</a>
            <Link to="/login" className="nav-link sign-in-btn">Sign In</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section" ref={heroRef}>
        <div className="hero-container">
          <div className="hero-content" ref={heroContentRef}>
            <h1 className="hero-title">
              Connect with <span className="highlight">Sports Enthusiasts</span> Worldwide
            </h1>
            <p className="hero-description">
              Join the ultimate sports social platform. Share your passion, connect with athletes, 
              discover events, and build your sports community.
            </p>
            <div className="hero-buttons">
              <Link to="/register" className="btn btn-primary">Get Started</Link>
              <Link to="/events" className="btn btn-secondary">Browse Events</Link>
            </div>
          </div>
          <div className="hero-image">
            <div className="sports-showcase">
              <h3 className="showcase-title">Popular Sports & Games</h3>
              <div className="sports-grid" ref={sportsGridRef}>
                <div className="sport-card">
                  <img src="/src/assets/icons/valorant.png" alt="Valorant" className="sport-icon" />
                  <span className="sport-name">Valorant</span>
                </div>
                <div className="sport-card">
                  <img src="/src/assets/icons/NBA2K.png" alt="NBA 2K" className="sport-icon" />
                  <span className="sport-name">NBA 2K</span>
                </div>
                <div className="sport-card">
                  <img src="/src/assets/icons/EAFC.png" alt="EA FC" className="sport-icon" />
                  <span className="sport-name">EA FC</span>
                </div>
                <div className="sport-card">
                  <img src="/src/assets/icons/rocketleague.png" alt="Rocket League" className="sport-icon" />
                  <span className="sport-name">Rocket League</span>
                </div>
                <div className="sport-card">
                  <img src="/src/assets/icons/CallOfDuty.png" alt="Call of Duty" className="sport-icon" />
                  <span className="sport-name">Call of Duty</span>
                </div>
                <div className="sport-card">
                  <img src="/src/assets/icons/leagueoflegends.png" alt="League of Legends" className="sport-icon" />
                  <span className="sport-name">League of Legends</span>
                </div>
                <div className="sport-card">
                  <img src="/src/assets/icons/apexlegends.png" alt="Apex Legends" className="sport-icon" />
                  <span className="sport-name">Apex Legends</span>
                </div>
                <div className="sport-card">
                  <img src="/src/assets/icons/minecraft.png" alt="Minecraft" className="sport-icon" />
                  <span className="sport-name">Minecraft</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section" ref={featuresRef}>
        <div className="features-container">
          <h2 className="section-title">Why Choose Sports Social?</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🏆</div>
              <h3>Join Events</h3>
              <p>Discover and participate in sports events happening around you.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">👥</div>
              <h3>Connect</h3>
              <p>Build connections with fellow sports enthusiasts and athletes.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📱</div>
              <h3>Share</h3>
              <p>Share your sports moments, achievements, and experiences.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">⭐</div>
              <h3>Reviews</h3>
              <p>Rate and review sports events, venues, and equipment.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Sports Gallery Section */}
      <section className="sports-gallery-section" ref={sportsGalleryRef}>
        <div className="sports-gallery-container">
          <h2 className="section-title">Join Communities Across All Sports</h2>
          <p className="section-subtitle">From esports to traditional sports, find your tribe and compete at every level</p>
          
          <div className="sports-categories">
            <div className="category-group">
              <h3 className="category-title">🎮 Esports & Gaming</h3>
              <div className="sports-row">
                <div className="sport-item">
                  <img src="/src/assets/icons/valorant.png" alt="Valorant" />
                  <span>Valorant</span>
                </div>
                <div className="sport-item">
                  <img src="/src/assets/icons/leagueoflegends.png" alt="League of Legends" />
                  <span>League of Legends</span>
                </div>
                <div className="sport-item">
                  <img src="/src/assets/icons/CallOfDuty.png" alt="Call of Duty" />
                  <span>Call of Duty</span>
                </div>
                <div className="sport-item">
                  <img src="/src/assets/icons/apexlegends.png" alt="Apex Legends" />
                  <span>Apex Legends</span>
                </div>
              </div>
            </div>
            
            <div className="category-group">
              <h3 className="category-title">⚽ Sports Simulation</h3>
              <div className="sports-row">
                <div className="sport-item">
                  <img src="/src/assets/icons/EAFC.png" alt="EA FC" />
                  <span>EA FC</span>
                </div>
                <div className="sport-item">
                  <img src="/src/assets/icons/NBA2K.png" alt="NBA 2K" />
                  <span>NBA 2K</span>
                </div>
                <div className="sport-item">
                  <img src="/src/assets/icons/rocketleague.png" alt="Rocket League" />
                  <span>Rocket League</span>
                </div>
                <div className="sport-item">
                  <img src="/src/assets/icons/minecraft.png" alt="Minecraft" />
                  <span>Minecraft</span>
                </div>
              </div>
            </div>
            
            <div className="category-group">
              <h3 className="category-title">📱 Mobile Gaming</h3>
              <div className="sports-row">
                <div className="sport-item">
                  <img src="/src/assets/icons/bgmi.png" alt="BGMI" />
                  <span>BGMI</span>
                </div>
                <div className="sport-item placeholder">
                  <div className="placeholder-icon">🏀</div>
                  <span>Basketball</span>
                </div>
                <div className="sport-item placeholder">
                  <div className="placeholder-icon">⚽</div>
                  <span>Football</span>
                </div>
                <div className="sport-item placeholder">
                  <div className="placeholder-icon">🏈</div>
                  <span>American Football</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="sports-cta">
            <p>Don't see your sport? Join us and help build new communities!</p>
            <Link to="/register" className="btn btn-secondary">Explore All Sports</Link>
          </div>
        </div>
      </section>

      {/* About Us Section */}
      <section className="about-section" ref={aboutRef}>
        <div className="about-container">
          <div className="about-content">
            <div className="about-text">
              <h2 className="section-title">About Sports Social</h2>
              <p className="about-description">
                Sports Social is more than just a platform – it's a thriving community where sports 
                enthusiasts, athletes, and fans come together to share their passion. Founded with 
                the vision of connecting people through sports, we believe that every game, every 
                achievement, and every moment matters.
              </p>
              <div className="about-stats">
                <div className="stat-item">
                  <h3>10K+</h3>
                  <p>Active Users</p>
                </div>
                <div className="stat-item">
                  <h3>500+</h3>
                  <p>Events Hosted</p>
                </div>
                <div className="stat-item">
                  <h3>50+</h3>
                  <p>Sports Categories</p>
                </div>
                <div className="stat-item">
                  <h3>24/7</h3>
                  <p>Community Support</p>
                </div>
              </div>
            </div>
            <div className="about-mission">
              <div className="mission-card">
                <h3>Our Mission</h3>
                <p>
                  To create the world's largest and most inclusive sports community where 
                  everyone can discover, participate, and excel in their favorite sports.
                </p>
              </div>
              <div className="mission-card">
                <h3>Our Vision</h3>
                <p>
                  A world where geographical boundaries don't limit sports connections, 
                  and every athlete finds their perfect team and community.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-container" ref={ctaRef}>
          <h2>Ready to Join the Community?</h2>
          <p>Start your sports social journey today</p>
          <Link to="/register" className="btn btn-primary btn-large">Sign Up Now</Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-container">
          <div className="footer-links">
            <Link to="/about">About</Link>
            <Link to="/privacy">Privacy</Link>
            <Link to="/terms">Terms</Link>
          </div>
          <p>&copy; 2025 Sports Social. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default Landing;
