import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './Download.scss';

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger);

function Download() {
  const heroRef = useRef(null);
  const featuresRef = useRef(null);
  const screenshotsRef = useRef(null);
  const downloadLinksRef = useRef(null);
  const faqRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Hero section animation
      gsap.fromTo(heroRef.current.children, 
        {
          y: 50,
          opacity: 0
        },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.2,
          ease: "power3.out"
        }
      );

      // Features animation
      ScrollTrigger.batch(".app-feature", {
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
              stagger: 0.15,
              ease: "power3.out"
            }
          );
        },
        start: "top 85%"
      });

      // Screenshots animation
      ScrollTrigger.batch(".screenshot-card", {
        onEnter: (elements) => {
          gsap.fromTo(elements,
            {
              scale: 0.8,
              opacity: 0,
              rotationY: 15
            },
            {
              scale: 1,
              opacity: 1,
              rotationY: 0,
              duration: 0.8,
              stagger: 0.1,
              ease: "back.out(1.2)"
            }
          );
        },
        start: "top 85%"
      });

      // Download buttons animation
      ScrollTrigger.batch(".download-btn", {
        onEnter: (elements) => {
          gsap.fromTo(elements,
            {
              y: 30,
              opacity: 0,
              scale: 0.9
            },
            {
              y: 0,
              opacity: 1,
              scale: 1,
              duration: 0.6,
              stagger: 0.1,
              ease: "back.out(1.5)"
            }
          );
        },
        start: "top 85%"
      });

      // FAQ items animation
      ScrollTrigger.batch(".faq-item", {
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
              stagger: 0.1,
              ease: "power2.out"
            }
          );
        },
        start: "top 85%"
      });

      // Section titles animation
      ScrollTrigger.batch(".section-title", {
        onEnter: (elements) => {
          gsap.fromTo(elements,
            {
              y: 30,
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
        start: "top 90%"
      });

      // Hover animations for download buttons
      const downloadBtns = document.querySelectorAll('.download-btn');
      downloadBtns.forEach(btn => {
        btn.addEventListener('mouseenter', () => {
          gsap.to(btn, {
            scale: 1.05,
            y: -5,
            duration: 0.3,
            ease: "power2.out"
          });
        });
        
        btn.addEventListener('mouseleave', () => {
          gsap.to(btn, {
            scale: 1,
            y: 0,
            duration: 0.3,
            ease: "power2.out"
          });
        });
      });

      // Screenshot hover effects
      const screenshots = document.querySelectorAll('.screenshot-card');
      screenshots.forEach(card => {
        card.addEventListener('mouseenter', () => {
          gsap.to(card, {
            scale: 1.05,
            rotationY: -5,
            duration: 0.3,
            ease: "power2.out"
          });
        });
        
        card.addEventListener('mouseleave', () => {
          gsap.to(card, {
            scale: 1,
            rotationY: 0,
            duration: 0.3,
            ease: "power2.out"
          });
        });
      });

    });

    return () => ctx.revert();
  }, []);

  const handleComingSoon = (platform) => {
    alert(`${platform} version coming soon! Stay tuned for updates.`);
  };

  return (
    <div className="download-page">
      {/* Navigation */}
      <nav className="download-nav">
        <div className="nav-container">
          <Link to="/" className="nav-logo">
            <img src="/logo.png" alt="Sports Social" className="logo-img" />
            <span className="logo-text">Sports Social</span>
          </Link>
          
          <div className="nav-links">
            <Link to="/" className="nav-link">Home</Link>
            <Link to="/events" className="nav-link">Events</Link>
            <Link to="/register" className="nav-link">Get Started</Link>
            <Link to="/login" className="nav-link sign-in-btn">Sign In</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="download-hero" ref={heroRef}>
        <div className="hero-container">
          <h1 className="hero-title">Download Sports Social</h1>
          <p className="hero-subtitle">
            Take your sports community with you wherever you go. Connect, compete, 
            and celebrate with fellow athletes on mobile.
          </p>
          <div className="hero-badges">
            <span className="badge">🚀 Fast & Reliable</span>
            <span className="badge">📱 Mobile Optimized</span>
            <span className="badge">🔥 Real-time Updates</span>
          </div>
        </div>
      </section>

      {/* App Features Section */}
      <section className="app-features-section" ref={featuresRef}>
        <div className="features-container">
          <h2 className="section-title">Why Download Our Mobile App?</h2>
          <div className="features-grid">
            <div className="app-feature">
              <div className="feature-icon">🔔</div>
              <h3>Push Notifications</h3>
              <p>Never miss important updates, event reminders, or messages from your sports community.</p>
            </div>
            <div className="app-feature">
              <div className="feature-icon">📍</div>
              <h3>Location Services</h3>
              <p>Find nearby sports events, venues, and fellow athletes in your area with GPS integration.</p>
            </div>
            <div className="app-feature">
              <div className="feature-icon">📸</div>
              <h3>Quick Photo Sharing</h3>
              <p>Instantly capture and share your sports moments with integrated camera functionality.</p>
            </div>
            <div className="app-feature">
              <div className="feature-icon">⚡</div>
              <h3>Offline Mode</h3>
              <p>Access your messages, event details, and community posts even without internet connection.</p>
            </div>
            <div className="app-feature">
              <div className="feature-icon">💬</div>
              <h3>Real-time Messaging</h3>
              <p>Chat with teammates and opponents with lightning-fast messaging and group chats.</p>
            </div>
            <div className="app-feature">
              <div className="feature-icon">🏆</div>
              <h3>Achievement Tracking</h3>
              <p>Track your sports achievements, event participation, and community contributions.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Screenshots Section */}
      <section className="screenshots-section" ref={screenshotsRef}>
        <div className="screenshots-container">
          <h2 className="section-title">See It In Action</h2>
          <p className="section-subtitle">Get a preview of the Sports Social mobile experience</p>
          
          <div className="screenshots-grid">
            <div className="screenshot-card">
              <div className="phone-frame">
                <div className="screenshot-placeholder">
                  <div className="mock-interface">
                    <div className="mock-header">
                      <div className="mock-title">Sports Feed</div>
                      <div className="mock-notification">🔔</div>
                    </div>
                    <div className="mock-content">
                      <div className="mock-post">
                        <div className="mock-avatar"></div>
                        <div className="mock-text-lines">
                          <div className="mock-line"></div>
                          <div className="mock-line short"></div>
                        </div>
                      </div>
                      <div className="mock-post">
                        <div className="mock-avatar"></div>
                        <div className="mock-text-lines">
                          <div className="mock-line"></div>
                          <div className="mock-line short"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <h3>Home Feed</h3>
              <p>Stay updated with your sports community</p>
            </div>

            <div className="screenshot-card">
              <div className="phone-frame">
                <div className="screenshot-placeholder">
                  <div className="mock-interface">
                    <div className="mock-header">
                      <div className="mock-title">Messages</div>
                      <div className="mock-search">🔍</div>
                    </div>
                    <div className="mock-content">
                      <div className="mock-chat">
                        <div className="mock-avatar"></div>
                        <div className="mock-chat-info">
                          <div className="mock-line"></div>
                          <div className="mock-line short"></div>
                        </div>
                      </div>
                      <div className="mock-chat">
                        <div className="mock-avatar"></div>
                        <div className="mock-chat-info">
                          <div className="mock-line"></div>
                          <div className="mock-line short"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <h3>Messaging</h3>
              <p>Connect with teammates instantly</p>
            </div>

            <div className="screenshot-card">
              <div className="phone-frame">
                <div className="screenshot-placeholder">
                  <div className="mock-interface">
                    <div className="mock-header">
                      <div className="mock-title">Events</div>
                      <div className="mock-filter">⚙️</div>
                    </div>
                    <div className="mock-content">
                      <div className="mock-event">
                        <div className="mock-event-image"></div>
                        <div className="mock-event-info">
                          <div className="mock-line"></div>
                          <div className="mock-line short"></div>
                        </div>
                      </div>
                      <div className="mock-event">
                        <div className="mock-event-image"></div>
                        <div className="mock-event-info">
                          <div className="mock-line"></div>
                          <div className="mock-line short"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <h3>Events</h3>
              <p>Discover and join sports events</p>
            </div>
          </div>
        </div>
      </section>

      {/* Download Links Section */}
      <section className="download-links-section" ref={downloadLinksRef}>
        <div className="download-container">
          <h2 className="section-title">Get Started Today</h2>
          <p className="section-subtitle">Choose your platform and start connecting with sports enthusiasts worldwide</p>
          
          <div className="download-options">
            <button 
              className="download-btn ios-btn"
              onClick={() => handleComingSoon('iOS')}
            >
              <div className="btn-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
              </div>
              <div className="btn-content">
                <span className="btn-subtitle">Download on the</span>
                <span className="btn-title">App Store</span>
              </div>
            </button>

            <button 
              className="download-btn android-btn"
              onClick={() => handleComingSoon('Android')}
            >
              <div className="btn-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
                </svg>
              </div>
              <div className="btn-content">
                <span className="btn-subtitle">Get it on</span>
                <span className="btn-title">Google Play</span>
              </div>
            </button>

            <button 
              className="download-btn web-btn"
              onClick={() => window.open('/', '_blank')}
            >
              <div className="btn-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16.36,14C16.44,13.34 16.5,12.68 16.5,12C16.5,11.32 16.44,10.66 16.36,10H19.74C19.9,10.64 20,11.31 20,12C20,12.69 19.9,13.36 19.74,14M14.59,19.56C15.19,18.45 15.65,17.25 15.97,16H18.92C17.96,17.65 16.43,18.93 14.59,19.56M14.34,14H9.66C9.56,13.34 9.5,12.68 9.5,12C9.5,11.32 9.56,10.65 9.66,10H14.34C14.43,10.65 14.5,11.32 14.5,12C14.5,12.68 14.43,13.34 14.34,14M12,19.96C11.17,18.76 10.5,17.43 10.09,16H13.91C13.5,17.43 12.83,18.76 12,19.96M8,8H5.08C6.03,6.34 7.57,5.06 9.4,4.44C8.8,5.55 8.35,6.75 8,8M5.08,16H8C8.35,17.25 8.8,18.45 9.4,19.56C7.57,18.93 6.03,17.65 5.08,16M4.26,14C4.1,13.36 4,12.69 4,12C4,11.31 4.1,10.64 4.26,10H7.64C7.56,10.66 7.5,11.32 7.5,12C7.5,12.68 7.56,13.34 7.64,14M12,4.03C12.83,5.23 13.5,6.57 13.91,8H10.09C10.5,6.57 11.17,5.23 12,4.03M18.92,8H15.97C15.65,6.75 15.19,5.55 14.59,4.44C16.43,5.07 17.96,6.34 18.92,8M12,2C6.47,2 2,6.5 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z"/>
                </svg>
              </div>
              <div className="btn-content">
                <span className="btn-subtitle">Use in</span>
                <span className="btn-title">Web Browser</span>
              </div>
            </button>
          </div>

          <div className="download-info">
            <p>
              <strong>Coming Soon:</strong> Our mobile apps are currently in development. 
              In the meantime, enjoy the full Sports Social experience in your web browser!
            </p>
            <div className="info-badges">
              <span className="info-badge">📱 Responsive Design</span>
              <span className="info-badge">🔄 Progressive Web App</span>
              <span className="info-badge">⚡ Fast Loading</span>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="faq-section" ref={faqRef}>
        <div className="faq-container">
          <h2 className="section-title">Frequently Asked Questions</h2>
          
          <div className="faq-grid">
            <div className="faq-item">
              <h3>When will the mobile apps be available?</h3>
              <p>We're working hard to bring you native iOS and Android apps. Expected release is Q2 2025. Follow us for updates!</p>
            </div>
            
            <div className="faq-item">
              <h3>Is the web version fully functional?</h3>
              <p>Absolutely! Our web platform offers all features including messaging, event creation, profile management, and community interaction.</p>
            </div>
            
            <div className="faq-item">
              <h3>Will my data sync between devices?</h3>
              <p>Yes! Your account, messages, events, and all data will seamlessly sync across all devices and platforms.</p>
            </div>
            
            <div className="faq-item">
              <h3>Can I use Sports Social offline?</h3>
              <p>The mobile apps will support offline mode for basic features. The web version requires an internet connection.</p>
            </div>
            
            <div className="faq-item">
              <h3>Is Sports Social free to use?</h3>
              <p>Yes! Sports Social is completely free with all core features available. Premium features may be introduced in the future.</p>
            </div>
            
            <div className="faq-item">
              <h3>How do I get notified about app releases?</h3>
              <p>Sign up for an account and enable notifications in your settings. We'll notify you as soon as the apps are available!</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="download-cta-section">
        <div className="cta-container">
          <h2>Ready to Get Started?</h2>
          <p>Join thousands of sports enthusiasts already using Sports Social</p>
          <div className="cta-buttons">
            <Link to="/register" className="btn btn-primary">Create Account</Link>
            <Link to="/events" className="btn btn-secondary">Browse Events</Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="download-footer">
        <div className="footer-container">
          <div className="footer-links">
            <Link to="/about">About</Link>
            <Link to="/privacy">Privacy</Link>
            <Link to="/terms">Terms</Link>
            <Link to="/">Back to Home</Link>
          </div>
          <p>&copy; 2025 Sports Social. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default Download;
