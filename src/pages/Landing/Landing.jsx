import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './Landing.scss';

// Import sport icons
import valorantIcon from '../../assets/icons/valorant.png';
import nba2kIcon from '../../assets/icons/NBA2K.png';
import eafcIcon from '../../assets/icons/EAFC.png';
import rocketLeagueIcon from '../../assets/icons/rocketleague.png';
import codIcon from '../../assets/icons/CallOfDuty.png';
import lolIcon from '../../assets/icons/leagueoflegends.png';
import apexIcon from '../../assets/icons/apexlegends.png';
import minecraftIcon from '../../assets/icons/minecraft.png';
import bgmiIcon from '../../assets/icons/bgmi.png';

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
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Ensure page is loaded before starting animations
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    
    const ctx = gsap.context(() => {
      // Set initial states only for nav and hero content, not sports grid
      gsap.set(navRef.current, { y: -100, opacity: 0 });
      gsap.set(heroContentRef.current.children, { y: 50, opacity: 0 });
      gsap.set(".showcase-title", { y: 20, opacity: 0 });
      // Don't set initial state for sports grid - let them be visible

      // Initial page load animations
      const tl = gsap.timeline({ delay: 0.1 });

      // Animate navigation bar
      tl.to(navRef.current, {
        y: 0,
        opacity: 1,
        duration: 1,
        ease: "power3.out"
      })
      
      // Animate hero content
      .to(heroContentRef.current.children, {
        y: 0,
        opacity: 1,
        duration: 0.8,
        stagger: 0.2,
        ease: "power3.out"
      }, "-=0.5")
      
      // Animate showcase title alongside hero content
      .to(".showcase-title", {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: "power2.out"
      }, "-=0.6")
      
      // Animate sports grid cards from their current state
      .from(sportsGridRef.current.children, {
        scale: 0.8,
        opacity: 0,
        duration: 0.6,
        stagger: 0.1,
        ease: "back.out(0.6)",
        onComplete: () => {
          // Ensure cards are at full opacity and normal scale after animation
          gsap.set(sportsGridRef.current.children, { 
            scale: 1, 
            opacity: 1,
            clearProps: "transform,opacity" 
          });
        }
      }, "-=1.4");

      // Scroll-triggered animations with refresh capability
      ScrollTrigger.batch(".feature-card", {
        onEnter: (elements) => {
          gsap.fromTo(elements, 
            {
              y: 100,
              opacity: 0,
              scale: 0.8
            },
            {
              y: 0,
              opacity: 1,
              scale: 1,
              duration: 0.8,
              stagger: 0.15,
              ease: "power3.out"
            }
          );
        },
        onLeave: (elements) => {
          gsap.to(elements, {
            y: -50,
            opacity: 0.3,
            duration: 0.3
          });
        },
        onEnterBack: (elements) => {
          gsap.to(elements, {
            y: 0,
            opacity: 1,
            duration: 0.5,
            stagger: 0.1
          });
        },
        start: "top 85%",
        end: "bottom 15%"
      });

      ScrollTrigger.batch(".sport-item", {
        onEnter: (elements) => {
          gsap.fromTo(elements,
            {
              scale: 0,
              opacity: 0,
              rotation: -180
            },
            {
              scale: 1,
              opacity: 1,
              rotation: 0,
              duration: 0.6,
              stagger: 0.1,
              ease: "back.out(1.7)"
            }
          );
        },
        onLeave: (elements) => {
          gsap.to(elements, {
            scale: 0.8,
            opacity: 0.5,
            duration: 0.3
          });
        },
        onEnterBack: (elements) => {
          gsap.to(elements, {
            scale: 1,
            opacity: 1,
            duration: 0.4,
            stagger: 0.05
          });
        },
        start: "top 85%",
        end: "bottom 15%"
      });

      ScrollTrigger.batch(".stat-item", {
        onEnter: (elements) => {
          gsap.fromTo(elements,
            {
              y: 50,
              opacity: 0,
              scale: 0.5
            },
            {
              y: 0,
              opacity: 1,
              scale: 1,
              duration: 0.8,
              stagger: 0.1,
              ease: "power3.out"
            }
          );
          
          // Animate the numbers counting up
          elements.forEach(element => {
            const numberElement = element.querySelector('h3');
            if (numberElement) {
              const finalText = numberElement.textContent;
              const hasPlus = finalText.includes('+');
              const hasSlash = finalText.includes('/');
              let finalNumber = parseInt(finalText.replace(/[^0-9]/g, ''));
              
              if (finalNumber) {
                gsap.fromTo(numberElement, 
                  { textContent: 0 },
                  {
                    textContent: finalNumber,
                    duration: 2,
                    ease: "power2.out",
                    snap: { textContent: 1 },
                    onUpdate: function() {
                      const current = Math.ceil(this.targets()[0].textContent);
                      if (hasPlus) {
                        numberElement.textContent = current + 'K+';
                      } else if (hasSlash) {
                        numberElement.textContent = current + '/7';
                      } else {
                        numberElement.textContent = current + '+';
                      }
                    }
                  }
                );
              }
            }
          });
        },
        onLeave: (elements) => {
          gsap.to(elements, {
            y: -30,
            opacity: 0.4,
            duration: 0.3
          });
        },
        onEnterBack: (elements) => {
          gsap.to(elements, {
            y: 0,
            opacity: 1,
            duration: 0.5,
            stagger: 0.05
          });
        },
        start: "top 85%",
        end: "bottom 15%"
      });

      ScrollTrigger.batch(".mission-card", {
        onEnter: (elements) => {
          gsap.fromTo(elements,
            {
              x: 100,
              opacity: 0,
              rotationY: 45
            },
            {
              x: 0,
              opacity: 1,
              rotationY: 0,
              duration: 0.8,
              stagger: 0.2,
              ease: "power3.out"
            }
          );
        },
        onLeave: (elements) => {
          gsap.to(elements, {
            x: 50,
            opacity: 0.3,
            duration: 0.3
          });
        },
        onEnterBack: (elements) => {
          gsap.to(elements, {
            x: 0,
            opacity: 1,
            duration: 0.5,
            stagger: 0.1
          });
        },
        start: "top 85%",
        end: "bottom 15%"
      });

      // Enhanced section title animations
      ScrollTrigger.batch(".section-title", {
        onEnter: (elements) => {
          gsap.fromTo(elements,
            {
              y: 30,
              opacity: 0,
              scale: 0.8
            },
            {
              y: 0,
              opacity: 1,
              scale: 1,
              duration: 0.8,
              ease: "power3.out"
            }
          );
        },
        onLeave: (elements) => {
          gsap.to(elements, {
            y: -20,
            opacity: 0.5,
            duration: 0.3
          });
        },
        onEnterBack: (elements) => {
          gsap.to(elements, {
            y: 0,
            opacity: 1,
            duration: 0.5
          });
        },
        start: "top 90%",
        end: "bottom 10%"
      });

      // Section subtitle animations
      ScrollTrigger.batch(".section-subtitle", {
        onEnter: (elements) => {
          gsap.fromTo(elements,
            {
              y: 20,
              opacity: 0
            },
            {
              y: 0,
              opacity: 1,
              duration: 0.6,
              delay: 0.2,
              ease: "power2.out"
            }
          );
        },
        start: "top 90%"
      });

      // Category title animations
      ScrollTrigger.batch(".category-title", {
        onEnter: (elements) => {
          gsap.fromTo(elements,
            {
              x: -50,
              opacity: 0
            },
            {
              x: 0,
              opacity: 1,
              duration: 0.6,
              ease: "power2.out"
            }
          );
        },
        start: "top 90%"
      });

      // About description animation
      ScrollTrigger.batch(".about-description", {
        onEnter: (elements) => {
          gsap.fromTo(elements,
            {
              y: 30,
              opacity: 0
            },
            {
              y: 0,
              opacity: 1,
              duration: 0.8,
              ease: "power2.out"
            }
          );
        },
        start: "top 85%"
      });

      // Enhanced CTA section animation
      ScrollTrigger.create({
        trigger: ctaRef.current,
        start: "top 80%",
        end: "bottom 20%",
        onEnter: () => {
          gsap.fromTo(ctaRef.current.children,
            {
              y: 50,
              opacity: 0,
              scale: 0.8
            },
            {
              y: 0,
              opacity: 1,
              scale: 1,
              duration: 0.8,
              stagger: 0.2,
              ease: "power3.out"
            }
          );
        },
        onLeave: () => {
          gsap.to(ctaRef.current.children, {
            y: -30,
            opacity: 0.5,
            duration: 0.3
          });
        },
        onEnterBack: () => {
          gsap.to(ctaRef.current.children, {
            y: 0,
            opacity: 1,
            duration: 0.5,
            stagger: 0.1
          });
        }
      });

      // Sports CTA animation
      ScrollTrigger.batch(".sports-cta", {
        onEnter: (elements) => {
          gsap.fromTo(elements,
            {
              y: 40,
              opacity: 0,
              scale: 0.9
            },
            {
              y: 0,
              opacity: 1,
              scale: 1,
              duration: 0.8,
              ease: "power3.out"
            }
          );
        },
        start: "top 85%"
      });

      // Sports showcase animation in hero
      ScrollTrigger.batch(".sports-showcase", {
        onEnter: (elements) => {
          gsap.fromTo(elements,
            {
              x: 100,
              opacity: 0,
              rotationY: 15
            },
            {
              x: 0,
              opacity: 1,
              rotationY: 0,
              duration: 1,
              ease: "power3.out"
            }
          );
        },
        start: "top 90%"
      });

      // Category groups staggered animation
      ScrollTrigger.batch(".category-group", {
        onEnter: (elements) => {
          gsap.fromTo(elements,
            {
              y: 80,
              opacity: 0,
              scale: 0.9
            },
            {
              y: 0,
              opacity: 1,
              scale: 1,
              duration: 0.8,
              stagger: 0.3,
              ease: "power3.out"
            }
          );
        },
        onLeave: (elements) => {
          gsap.to(elements, {
            y: -40,
            opacity: 0.4,
            duration: 0.3
          });
        },
        onEnterBack: (elements) => {
          gsap.to(elements, {
            y: 0,
            opacity: 1,
            duration: 0.6,
            stagger: 0.1
          });
        },
        start: "top 80%",
        end: "bottom 20%"
      });

      // Sports rows within categories
      ScrollTrigger.batch(".sports-row", {
        onEnter: (elements) => {
          const sportItems = elements.flatMap(row => Array.from(row.children));
          gsap.fromTo(sportItems,
            {
              scale: 0,
              opacity: 0,
              y: 30
            },
            {
              scale: 1,
              opacity: 1,
              y: 0,
              duration: 0.5,
              stagger: 0.1,
              ease: "back.out(1.2)",
              delay: 0.2
            }
          );
        },
        start: "top 85%"
      });

      // Hero buttons animation
      ScrollTrigger.batch(".hero-buttons", {
        onEnter: (elements) => {
          gsap.fromTo(elements[0].children,
            {
              y: 30,
              opacity: 0,
              scale: 0.8
            },
            {
              y: 0,
              opacity: 1,
              scale: 1,
              duration: 0.6,
              stagger: 0.1,
              ease: "back.out(1.2)",
              delay: 0.5
            }
          );
        },
        start: "top center"
      });

      // About stats animation with enhanced counter
      ScrollTrigger.batch(".about-stats", {
        onEnter: (elements) => {
          gsap.fromTo(elements,
            {
              y: 50,
              opacity: 0
            },
            {
              y: 0,
              opacity: 1,
              duration: 0.8,
              ease: "power3.out"
            }
          );
        },
        start: "top 85%"
      });

      // Footer animation
      ScrollTrigger.batch(".landing-footer", {
        onEnter: (elements) => {
          gsap.fromTo(elements,
            {
              y: 30,
              opacity: 0
            },
            {
              y: 0,
              opacity: 1,
              duration: 0.8,
              ease: "power2.out"
            }
          );
        },
        start: "top 95%"
      });

      // Navigation animation enhancement
      ScrollTrigger.create({
        trigger: "body",
        start: "top top",
        end: "bottom bottom",
        onUpdate: (self) => {
          if (self.direction === -1) {
            // Scrolling up - show nav with slide down
            gsap.to(navRef.current, {
              y: 0,
              opacity: 1,
              duration: 0.3,
              ease: "power2.out"
            });
          } else if (self.progress > 0.1) {
            // Scrolling down - slightly hide nav
            gsap.to(navRef.current, {
              y: -10,
              opacity: 0.95,
              duration: 0.3,
              ease: "power2.out"
            });
          }
        }
      });

      // Add subtle floating animation for sport icons only (not cards)
      gsap.to(".sport-icon", {
        y: "random(-3, 3)",
        duration: "random(3, 5)",
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
        stagger: {
          amount: 3,
          from: "random"
        }
      });

      // Enhanced hover animations for interactive elements
      const sportCards = document.querySelectorAll('.sport-card, .sport-item');
      sportCards.forEach(card => {
        card.addEventListener('mouseenter', () => {
          gsap.to(card, {
            scale: 1.05,
            duration: 0.3,
            ease: "power2.out",
            overwrite: true
          });
          
          // Add subtle glow effect to sport icon
          const icon = card.querySelector('.sport-icon, img');
          if (icon) {
            gsap.to(icon, {
              filter: "brightness(1.1) drop-shadow(0 0 8px rgba(255, 255, 255, 0.2))",
              duration: 0.3,
              ease: "power2.out"
            });
          }
        });
        
        card.addEventListener('mouseleave', () => {
          gsap.to(card, {
            scale: 1,
            duration: 0.3,
            ease: "power2.out",
            overwrite: true
          });
          
          const icon = card.querySelector('.sport-icon, img');
          if (icon) {
            gsap.to(icon, {
              filter: "brightness(1) drop-shadow(0 0 0px rgba(255, 255, 255, 0))",
              duration: 0.3,
              ease: "power2.out"
            });
          }
        });
      });

      const featureCards = document.querySelectorAll('.feature-card');
      featureCards.forEach(card => {
        card.addEventListener('mouseenter', () => {
          gsap.to(card, {
            y: -15,
            scale: 1.02,
            rotationX: 5,
            boxShadow: "0 20px 40px rgba(0, 0, 0, 0.15)",
            duration: 0.4,
            ease: "power2.out"
          });
          
          // Animate feature icon
          const icon = card.querySelector('.feature-icon');
          if (icon) {
            gsap.to(icon, {
              scale: 1.2,
              rotation: 10,
              duration: 0.3,
              ease: "back.out(1.5)"
            });
          }
        });
        
        card.addEventListener('mouseleave', () => {
          gsap.to(card, {
            y: 0,
            scale: 1,
            rotationX: 0,
            boxShadow: "0 5px 15px rgba(0, 0, 0, 0.08)",
            duration: 0.4,
            ease: "power2.out"
          });
          
          const icon = card.querySelector('.feature-icon');
          if (icon) {
            gsap.to(icon, {
              scale: 1,
              rotation: 0,
              duration: 0.3,
              ease: "power2.out"
            });
          }
        });
      });

      // Enhanced button hover animations
      const buttons = document.querySelectorAll('.btn');
      buttons.forEach(btn => {
        btn.addEventListener('mouseenter', () => {
          gsap.to(btn, {
            scale: 1.05,
            y: -2,
            boxShadow: "0 10px 25px rgba(0, 0, 0, 0.15)",
            duration: 0.3,
            ease: "power2.out"
          });
        });
        
        btn.addEventListener('mouseleave', () => {
          gsap.to(btn, {
            scale: 1,
            y: 0,
            boxShadow: "0 4px 15px rgba(0, 0, 0, 0.1)",
            duration: 0.3,
            ease: "power2.out"
          });
        });
      });

      // Mission cards enhanced hover
      const missionCards = document.querySelectorAll('.mission-card');
      missionCards.forEach(card => {
        card.addEventListener('mouseenter', () => {
          gsap.to(card, {
            scale: 1.03,
            rotationY: -5,
            z: 30,
            duration: 0.4,
            ease: "power2.out"
          });
        });
        
        card.addEventListener('mouseleave', () => {
          gsap.to(card, {
            scale: 1,
            rotationY: 0,
            z: 0,
            duration: 0.4,
            ease: "power2.out"
          });
        });
      });

      // Stat items hover animation
      const statItems = document.querySelectorAll('.stat-item');
      statItems.forEach(item => {
        item.addEventListener('mouseenter', () => {
          gsap.to(item, {
            scale: 1.1,
            y: -5,
            duration: 0.3,
            ease: "back.out(1.5)"
          });
          
          const number = item.querySelector('h3');
          if (number) {
            gsap.to(number, {
              scale: 1.2,
              color: "#00ff88",
              duration: 0.3,
              ease: "power2.out"
            });
          }
        });
        
        item.addEventListener('mouseleave', () => {
          gsap.to(item, {
            scale: 1,
            y: 0,
            duration: 0.3,
            ease: "power2.out"
          });
          
          const number = item.querySelector('h3');
          if (number) {
            gsap.to(number, {
              scale: 1,
              color: "",
              duration: 0.3,
              ease: "power2.out"
            });
          }
        });
      });

      // Parallax effect for hero section (simplified)
      ScrollTrigger.create({
        trigger: heroRef.current,
        start: "top top",
        end: "bottom top",
        scrub: true,
        onUpdate: (self) => {
          if (heroContentRef.current && sportsGridRef.current) {
            gsap.set(heroContentRef.current, {
              y: self.progress * 30
            });
            gsap.set(sportsGridRef.current, {
              y: self.progress * -20
            });
          }
        }
      });

    });

    return () => ctx.revert(); // Cleanup
  }, [isLoaded]);

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
      <section className="hero-section  " ref={heroRef}>
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
                  <img src={valorantIcon} alt="Valorant" className="sport-icon" />
                  <span className="sport-name">Valorant</span>
                </div>
                <div className="sport-card">
                  <img src={nba2kIcon} alt="NBA 2K" className="sport-icon" />
                  <span className="sport-name">NBA 2K</span>
                </div>
                <div className="sport-card">
                  <img src={eafcIcon} alt="EA FC" className="sport-icon" />
                  <span className="sport-name">EA FC</span>
                </div>
                <div className="sport-card">
                  <img src={rocketLeagueIcon} alt="Rocket League" className="sport-icon" />
                  <span className="sport-name">Rocket League</span>
                </div>
                <div className="sport-card">
                  <img src={codIcon} alt="Call of Duty" className="sport-icon" />
                  <span className="sport-name">Call of Duty</span>
                </div>
                <div className="sport-card">
                  <img src={lolIcon} alt="League of Legends" className="sport-icon" />
                  <span className="sport-name">League of Legends</span>
                </div>
                <div className="sport-card">
                  <img src={apexIcon} alt="Apex Legends" className="sport-icon" />
                  <span className="sport-name">Apex Legends</span>
                </div>
                <div className="sport-card">
                  <img src={minecraftIcon} alt="Minecraft" className="sport-icon" />
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
                  <img src={valorantIcon} alt="Valorant" />
                  <span>Valorant</span>
                </div>
                <div className="sport-item">
                  <img src={lolIcon} alt="League of Legends" />
                  <span>League of Legends</span>
                </div>
                <div className="sport-item">
                  <img src={codIcon} alt="Call of Duty" />
                  <span>Call of Duty</span>
                </div>
                <div className="sport-item">
                  <img src={apexIcon} alt="Apex Legends" />
                  <span>Apex Legends</span>
                </div>
              </div>
            </div>
            
            <div className="category-group">
              <h3 className="category-title">⚽ Sports Simulation</h3>
              <div className="sports-row">
                <div className="sport-item">
                  <img src={eafcIcon} alt="EA FC" />
                  <span>EA FC</span>
                </div>
                <div className="sport-item">
                  <img src={nba2kIcon} alt="NBA 2K" />
                  <span>NBA 2K</span>
                </div>
                <div className="sport-item">
                  <img src={rocketLeagueIcon} alt="Rocket League" />
                  <span>Rocket League</span>
                </div>
                <div className="sport-item">
                  <img src={minecraftIcon} alt="Minecraft" />
                  <span>Minecraft</span>
                </div>
              </div>
            </div>
            
            <div className="category-group">
              <h3 className="category-title">📱 Mobile Gaming</h3>
              <div className="sports-row">
                <div className="sport-item">
                  <img src={bgmiIcon} alt="BGMI" />
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
