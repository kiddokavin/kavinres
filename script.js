/* ==========================================================================
   Kavin L - Portfolio JavaScript Functionality
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Lucide Icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    // 2. Dynamic Style Injection for Stars & Animations
    const style = document.createElement('style');
    style.textContent = `
        .star {
            position: absolute;
            background: #ffffff;
            border-radius: 50%;
            pointer-events: none;
        }
        @keyframes twinkle {
            0% { opacity: 0.15; transform: scale(0.8); }
            100% { opacity: 0.85; transform: scale(1.2); }
        }
        
        /* Fade animation for certifications */
        .cert-card.fade-out {
            opacity: 0;
            transform: scale(0.9);
            transition: opacity 0.25s ease, transform 0.25s ease;
        }
        .cert-card.fade-in {
            opacity: 1;
            transform: scale(1);
            transition: opacity 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275), transform 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
    `;
    document.head.appendChild(style);

    // 3. Generate Starry Constellation Background (Canvas)
    const canvas = document.getElementById('stars-canvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        
        let width = canvas.width = window.innerWidth;
        let height = canvas.height = window.innerHeight;
        
        window.addEventListener('resize', () => {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        });
        
        const particles = [];
        // Calculate particle count based on screen area to prevent performance lag
        const particleCount = Math.min(80, Math.floor((width * height) / 18000));
        
        const mouse = { x: null, y: null, radius: 150 };
        
        window.addEventListener('mousemove', (e) => {
            mouse.x = e.clientX;
            mouse.y = e.clientY;
        });
        
        window.addEventListener('mouseleave', () => {
            mouse.x = null;
            mouse.y = null;
        });
        
        class Particle {
            constructor() {
                this.x = Math.random() * width;
                this.y = Math.random() * height;
                this.size = Math.random() * 2 + 0.5; // 0.5px to 2.5px
                this.speedX = Math.random() * 0.3 - 0.15; // slow moving
                this.speedY = Math.random() * 0.3 - 0.15;
                this.alpha = Math.random() * 0.6 + 0.2;
                this.alphaSpeed = Math.random() * 0.008 + 0.002;
            }
            
            update() {
                this.x += this.speedX;
                this.y += this.speedY;
                
                // Wrap boundaries
                if (this.x < 0) this.x = width;
                if (this.x > width) this.x = 0;
                if (this.y < 0) this.y = height;
                if (this.y > height) this.y = 0;
                
                // Twinkle / pulse opacity
                this.alpha += this.alphaSpeed;
                if (this.alpha > 0.8 || this.alpha < 0.2) {
                    this.alphaSpeed = -this.alphaSpeed;
                }
            }
            
            draw() {
                ctx.fillStyle = `rgba(255, 255, 255, ${this.alpha})`;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        // Generate particles
        for (let i = 0; i < particleCount; i++) {
            particles.push(new Particle());
        }
        
        function animate() {
            ctx.clearRect(0, 0, width, height);
            
            particles.forEach(p => {
                p.update();
                p.draw();
            });
            
            // Draw links between nearby particles
            for (let a = 0; a < particles.length; a++) {
                for (let b = a + 1; b < particles.length; b++) {
                    const dx = particles[a].x - particles[b].x;
                    const dy = particles[a].y - particles[b].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    
                    if (dist < 110) {
                        const alpha = (1 - dist / 110) * 0.12;
                        ctx.strokeStyle = `rgba(0, 242, 254, ${alpha})`; // Electric Cyan
                        ctx.lineWidth = 0.5;
                        ctx.beginPath();
                        ctx.moveTo(particles[a].x, particles[a].y);
                        ctx.lineTo(particles[b].x, particles[b].y);
                        ctx.stroke();
                    }
                }
                
                // Connect particles to mouse cursor when close
                if (mouse.x !== null && mouse.y !== null) {
                    const dx = particles[a].x - mouse.x;
                    const dy = particles[a].y - mouse.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    
                    if (dist < mouse.radius) {
                        const alpha = (1 - dist / mouse.radius) * 0.22;
                        ctx.strokeStyle = `rgba(157, 78, 221, ${alpha})`; // Purple connection
                        ctx.lineWidth = 0.6;
                        ctx.beginPath();
                        ctx.moveTo(particles[a].x, particles[a].y);
                        ctx.lineTo(mouse.x, mouse.y);
                        ctx.stroke();
                    }
                }
            }
            
            requestAnimationFrame(animate);
        }
        
        animate();
    }

    // 4. Cursor Follow Glow Effect
    const glow = document.getElementById('ambient-glow');
    if (glow) {
        document.addEventListener('mousemove', (e) => {
            const x = (e.clientX / window.innerWidth) * 100;
            const y = (e.clientY / window.innerHeight) * 100;
            
            // Update primary cursor radial gradient coordinate
            glow.style.background = `
                radial-gradient(circle at ${x}% ${y}%, rgba(0, 242, 254, 0.08) 0%, transparent 40%),
                radial-gradient(circle at 80% 70%, rgba(157, 78, 221, 0.05) 0%, transparent 45%)
            `;
        });
    }

    // 5. Navbar Sticky state and active section highlight
    const navbar = document.querySelector('.navbar');
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('.nav-link');

    window.addEventListener('scroll', () => {
        // Sticky Header Toggle
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }

        // Active Section Underline Highlight
        let currentSectionId = '';
        sections.forEach(sec => {
            const secTop = sec.offsetTop - 120; // offset for sticky nav
            const secHeight = sec.clientHeight;
            if (window.scrollY >= secTop && window.scrollY < secTop + secHeight) {
                currentSectionId = sec.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${currentSectionId}`) {
                link.classList.add('active');
            }
        });
    });

    // 6. Mobile Side Drawer Navigation
    const mobileToggle = document.getElementById('mobile-toggle');
    const mobileClose = document.getElementById('mobile-close');
    const mobileNav = document.getElementById('mobile-nav');
    const mobileLinks = document.querySelectorAll('.mobile-link');

    const toggleDrawer = (isOpen) => {
        if (isOpen) {
            mobileNav.classList.add('open');
            document.body.style.overflow = 'hidden'; // Lock background scrolling
        } else {
            mobileNav.classList.remove('open');
            document.body.style.overflow = 'auto'; // Unlock background scrolling
        }
    };

    if (mobileToggle) {
        mobileToggle.addEventListener('click', () => toggleDrawer(true));
    }
    if (mobileClose) {
        mobileClose.addEventListener('click', () => toggleDrawer(false));
    }

    // Close mobile menu when clicking a link
    mobileLinks.forEach(link => {
        link.addEventListener('click', () => toggleDrawer(false));
    });

    // Close when clicking outside of drawer content
    document.addEventListener('click', (e) => {
        if (mobileNav && mobileNav.classList.contains('open') && 
            !mobileNav.contains(e.target) && 
            mobileToggle && !mobileToggle.contains(e.target)) {
            toggleDrawer(false);
        }
    });

    // 7. Certifications Rendering, Filter and Search Mechanism
    const certifications = [
        { name: "AWS S3 Basics", issuer: "AWS", category: "cloud-data", badgeClass: "cloud", link: "https://drive.google.com/drive/folders/151ilxSL3HM4lJu6plGbL0K412ALYO4lf" },
        { name: "Introduction to NoSQL Databases", issuer: "Infosys Springboard", category: "cloud-data", badgeClass: "cloud", link: "https://drive.google.com/drive/folders/151ilxSL3HM4lJu6plGbL0K412ALYO4lf" },
        { name: "Database Management System - Part 1", issuer: "NPTEL", category: "cloud-data", badgeClass: "cloud", link: "https://drive.google.com/drive/folders/151ilxSL3HM4lJu6plGbL0K412ALYO4lf" },
        { name: "Database Management System - Part 2", issuer: "Infosys Springboard", category: "cloud-data", badgeClass: "cloud", link: "https://drive.google.com/drive/folders/151ilxSL3HM4lJu6plGbL0K412ALYO4lf" },
        { name: "AWS CloudFront: Serve Content from Multiple S3 Buckets", issuer: "AWS", category: "cloud-data", badgeClass: "cloud", link: "https://drive.google.com/drive/folders/151ilxSL3HM4lJu6plGbL0K412ALYO4lf" },
        { name: "Microsoft Azure", issuer: "Microsoft", category: "cloud-data", badgeClass: "cloud", link: "https://drive.google.com/drive/folders/151ilxSL3HM4lJu6plGbL0K412ALYO4lf" },
        { name: "Build a Computer Vision App with Azure Cognitive Services", issuer: "Microsoft Azure", category: "cloud-data", badgeClass: "cloud", link: "https://drive.google.com/drive/folders/151ilxSL3HM4lJu6plGbL0K412ALYO4lf" },
        { name: "Java Tools", issuer: "Infosys Springboard", category: "coding", badgeClass: "coding", link: "https://drive.google.com/drive/folders/151ilxSL3HM4lJu6plGbL0K412ALYO4lf" },
        { name: "Data Structures and Algorithms using Java", issuer: "Infosys Springboard", category: "coding", badgeClass: "coding", link: "https://drive.google.com/drive/folders/151ilxSL3HM4lJu6plGbL0K412ALYO4lf" },
        { name: "Java Programming Fundamentals", issuer: "Oracle", category: "coding", badgeClass: "coding", link: "https://drive.google.com/drive/folders/151ilxSL3HM4lJu6plGbL0K412ALYO4lf" },
        { name: "Java Foundation Certification", issuer: "Oracle", category: "coding", badgeClass: "coding", link: "https://drive.google.com/drive/folders/151ilxSL3HM4lJu6plGbL0K412ALYO4lf" },
        { name: "Programming using Java", issuer: "Coursera", category: "coding", badgeClass: "coding", link: "https://drive.google.com/drive/folders/151ilxSL3HM4lJu6plGbL0K412ALYO4lf" },
        { name: "Building Smart Business Assistants with IBM Watson", issuer: "IBM", category: "coding", badgeClass: "coding", link: "https://drive.google.com/drive/folders/151ilxSL3HM4lJu6plGbL0K412ALYO4lf" },
        { name: "Getting Started with Azure IoT Hub", issuer: "Microsoft Azure", category: "iot-hw", badgeClass: "hardware", link: "https://drive.google.com/drive/folders/151ilxSL3HM4lJu6plGbL0K412ALYO4lf" },
        { name: "Introduction of IoT in NPTEL", issuer: "NPTEL (Elite 63%)", category: "iot-hw", badgeClass: "hardware", link: "https://drive.google.com/drive/folders/151ilxSL3HM4lJu6plGbL0K412ALYO4lf" },
        { name: "Build a Free Website with WordPress", issuer: "WordPress Academy", category: "professional", badgeClass: "professional", link: "https://drive.google.com/drive/folders/151ilxSL3HM4lJu6plGbL0K412ALYO4lf" },
        { name: "Use Canva to Design Digital Course Collateral", issuer: "Canva", category: "professional", badgeClass: "professional", link: "https://drive.google.com/drive/folders/151ilxSL3HM4lJu6plGbL0K412ALYO4lf" },
        { name: "Develop a Company Website with Wix", issuer: "Wix Learning Center", category: "professional", badgeClass: "professional", link: "https://drive.google.com/drive/folders/151ilxSL3HM4lJu6plGbL0K412ALYO4lf" },
        { name: "Convert Word to PDF with SharePoint & Power Automate", issuer: "Microsoft", category: "professional", badgeClass: "professional", link: "https://drive.google.com/drive/folders/151ilxSL3HM4lJu6plGbL0K412ALYO4lf" },
        { name: "Cyber Job Simulation in Deloitte", issuer: "Deloitte (Forage)", category: "professional", badgeClass: "professional", link: "https://drive.google.com/drive/folders/151ilxSL3HM4lJu6plGbL0K412ALYO4lf" },
        { name: "Cybersecurity Analyst Job Simulation in TATA", issuer: "TATA (Forage)", category: "professional", badgeClass: "professional", link: "https://drive.google.com/drive/folders/151ilxSL3HM4lJu6plGbL0K412ALYO4lf" },
        { name: "Finding, Sorting, & Filtering Data in Microsoft Excel", issuer: "Coursera", category: "professional", badgeClass: "professional", link: "https://coursera.org/verify/9Z4OU54091XY" },
        { name: "Employability Skills by TN Govt", issuer: "Tamil Nadu Government", category: "professional", badgeClass: "professional", link: "https://drive.google.com/drive/folders/151ilxSL3HM4lJu6plGbL0K412ALYO4lf" }
    ];

    const certsGrid = document.getElementById('certifications-grid');
    const searchInput = document.getElementById('cert-search');
    const filterTabs = document.querySelectorAll('.filter-tab');

    let currentFilter = 'all';
    let currentSearch = '';

    // Function to render filtered certifications
    const renderCertifications = () => {
        if (!certsGrid) return;
        
        // Filter the array
        const filtered = certifications.filter(cert => {
            const matchesCategory = currentFilter === 'all' || cert.category === currentFilter;
            const matchesSearch = cert.name.toLowerCase().includes(currentSearch) || 
                                  cert.issuer.toLowerCase().includes(currentSearch);
            return matchesCategory && matchesSearch;
        });

        // Clear grid
        certsGrid.innerHTML = '';

        if (filtered.length === 0) {
            certsGrid.innerHTML = `
                <div class="no-results">
                    <i data-lucide="shield-alert"></i>
                    <p>No certifications match your current search criteria.</p>
                </div>
            `;
            if (typeof lucide !== 'undefined') lucide.createIcons();
            return;
        }

        // Generate elements
        filtered.forEach(cert => {
            const card = document.createElement('div');
            card.className = 'cert-card glass-card fade-out';
            
            // Format labels for badge display
            let categoryLabel = '';
            switch (cert.category) {
                case 'cloud-data': categoryLabel = 'Cloud / Data'; break;
                case 'coding': categoryLabel = 'Coding & CS'; break;
                case 'iot-hw': categoryLabel = 'IoT & HW'; break;
                case 'professional': categoryLabel = 'Professional'; break;
            }

            card.innerHTML = `
                <div class="cert-card-header">
                    <h4>${cert.name}</h4>
                </div>
                <div class="cert-card-footer" style="display: flex; justify-content: space-between; align-items: center; width: 100%; margin-top: 1rem;">
                    <span class="cert-issuer-badge ${cert.badgeClass}">
                        <i data-lucide="award" class="icon-xs"></i>
                        <span>${cert.issuer}</span>
                    </span>
                </div>
            `;

            certsGrid.appendChild(card);
            
            // Trigger animation on layout insertion
            setTimeout(() => {
                card.classList.remove('fade-out');
                card.classList.add('fade-in');
            }, 20);
        });

        // Bind icons for new elements
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    };

    // Initialize rendering
    renderCertifications();

    // Event Bindings for search bar
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            currentSearch = e.target.value.toLowerCase().trim();
            renderCertifications();
        });
    }

    // Event Bindings for filter tabs
    filterTabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            filterTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            currentFilter = tab.getAttribute('data-filter');
            renderCertifications();
        });
    });

    // TO LINK WITH EXCEL/GOOGLE SHEETS: 
    // Paste your deployed Google Apps Script Web App URL below.
    // If left empty, the form will fall back to FormSubmit.co (email-only).
    const GOOGLE_SHEET_WEBAPP_URL = "https://script.google.com/macros/s/AKfycbzkZ5IBtXhkPub7iuBamfy3UPyl-5B9oOtJByDJKoiIKkR9jhyMWCmCJdWwpVImSUQA/exec"; 

    const contactForm = document.getElementById('contact-form');
    const formSubmitBtn = document.getElementById('form-submit');
    const formStatusMsg = document.getElementById('form-status-msg');

    if (contactForm && formSubmitBtn && formStatusMsg) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Check form values
            const name = document.getElementById('form-name').value.trim();
            const email = document.getElementById('form-email').value.trim();
            const subject = document.getElementById('form-subject').value.trim();
            const message = document.getElementById('form-message').value.trim();

            if (!name || !email || !subject || !message) {
                formStatusMsg.className = 'form-status error';
                formStatusMsg.textContent = 'Please fill out all fields.';
                return;
            }

            // Show sending state
            formSubmitBtn.disabled = true;
            const originalBtnHtml = formSubmitBtn.innerHTML;
            formSubmitBtn.innerHTML = `
                <span>Sending Message...</span>
                <div class="msg typing" style="display:inline-flex; padding:0; background:transparent;"><span style="background:var(--bg-base)"></span><span style="background:var(--bg-base)"></span><span style="background:var(--bg-base)"></span></div>
            `;
            formStatusMsg.textContent = '';

            // Determine submission endpoint
            const useGoogleSheets = GOOGLE_SHEET_WEBAPP_URL.trim() !== "";
            const endpoint = useGoogleSheets ? GOOGLE_SHEET_WEBAPP_URL : "https://formsubmit.co/ajax/2007kavinl@gmail.com";
            
            const payload = useGoogleSheets ? {
                name: name,
                email: email,
                subject: subject,
                message: message
            } : {
                name: name,
                email: email,
                _subject: `Portfolio Contact: ${subject}`,
                message: message
            };

            // Build Fetch Options
            const fetchOptions = {
                method: "POST",
                body: JSON.stringify(payload)
            };

            if (useGoogleSheets) {
                fetchOptions.mode = "no-cors";
                fetchOptions.headers = {
                    'Content-Type': 'text/plain;charset=utf-8' // standard non-preflight content type
                };
            } else {
                fetchOptions.headers = {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                };
            }

            // Post form data
            fetch(endpoint, fetchOptions)
            .then(response => {
                // In no-cors mode, the response is opaque (status 0). 
                // We treat a successful network connection as success.
                if (useGoogleSheets) {
                    return { success: true };
                }
                if (response.ok) {
                    return response.json();
                }
                throw new Error('Network response was not ok.');
            })
            .then(data => {
                // Show success
                formStatusMsg.className = 'form-status success';
                formStatusMsg.textContent = useGoogleSheets 
                    ? `Thanks, ${name}! Your message has been saved to Excel & sent to my email.`
                    : `Thanks, ${name}! Your message has been sent to my email.`;
                
                // Clear input values
                contactForm.reset();
            })
            .catch(error => {
                // Show error fallback
                formStatusMsg.className = 'form-status error';
                formStatusMsg.textContent = 'Oops! Something went wrong while sending the message. Please try again.';
                console.error('Submission Error:', error);
            })
            .finally(() => {
                // Restore button state
                formSubmitBtn.disabled = false;
                formSubmitBtn.innerHTML = originalBtnHtml;

                // Clear status message after 7 seconds
                setTimeout(() => {
                    formStatusMsg.textContent = '';
                }, 7000);
            });
        });
    }
});
