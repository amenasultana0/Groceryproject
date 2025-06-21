document.addEventListener('DOMContentLoaded', () => {
    // --- Image Preloader & Background Slideshow ---
    const backgroundImages = [
        'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=2070&auto=format&fit=crop', // Fruits
        'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=2070&auto=format&fit=crop', // Healthy Salad
        'https://images.unsplash.com/photo-1498837167922-ddd27525d352?q=80&w=2072&auto=format&fit=crop', // Kitchen Counter
        'https://images.unsplash.com/photo-1534723452862-4c874018d66d?q=80&w=2070&auto=format&fit=crop', // Market Stall
        'https://images.unsplash.com/photo-1606913635741-99e7c3b9b4a4?q=80&w=2070&auto=format&fit=crop'  // Fresh Bread
    ];

    const slideshowContainer = document.getElementById('bg-slideshow');
    const loaderOverlay = document.getElementById('loader-overlay');
    let currentImageIndex = 0;
    let imagesLoaded = 0;

    function onImageLoad() {
        imagesLoaded++;
        if (imagesLoaded === backgroundImages.length) {
            initSlideshow();
        }
    }

    // Create slide elements and preload images
    backgroundImages.forEach((src, index) => {
        // Preload image
        const img = new Image();
        img.onload = onImageLoad;
        img.onerror = onImageLoad; // Count failed loads too so it doesn't hang
        img.src = src;

        // Create slide
        const slide = document.createElement('div');
        slide.classList.add('slide');
        slide.style.backgroundImage = `url('${src}')`;
        if (index === 0) {
            slide.classList.add('active');
        }
        slideshowContainer.appendChild(slide);
    });

    function initSlideshow() {
        // Hide loader
        loaderOverlay.classList.add('hidden');

        const slides = slideshowContainer.querySelectorAll('.slide');

        function changeBackgroundImage() {
            // Determine the next slide's index
            const nextIndex = (currentImageIndex + 1) % slides.length;
            const currentSlide = slides[currentImageIndex];
            const nextSlide = slides[nextIndex];

            // 1. Place the next slide on top of the current one, but keep it invisible.
            nextSlide.classList.add('top');

            // 2. Animate the current slide to fade out.
            currentSlide.classList.remove('active');

            // 3. Simultaneously, make the next slide the new active (fading it in).
            nextSlide.classList.add('active');

            // 4. After the transition, reset the z-index of the old slide.
            setTimeout(() => {
                currentSlide.classList.remove('top');
            }, 1000); // Must match CSS transition time

            // Update the current index
            currentImageIndex = nextIndex;
        }

        // Start slideshow
        setInterval(changeBackgroundImage, 7000);
    }

    const form = document.getElementById('personalization-form');
    const container = document.querySelector('.personalization-container');
    const steps = Array.from(form.querySelectorAll('.step'));
    const nextButtons = form.querySelectorAll('.next-btn');
    const prevButtons = form.querySelectorAll('.prev-btn');
    const options = form.querySelectorAll('.option');
    const progressBar = document.getElementById('progress-bar');
    const budgetSlider = document.getElementById('grocery-budget');
    const budgetValueDisplay = document.getElementById('budget-value');
    const termsAgree = document.getElementById('terms-agree');
    const privacyAgree = document.getElementById('privacy-agree');
    const submitBtn = form.querySelector('.submit-btn');
    
    let currentStep = 0;
    const totalSteps = steps.length;

    const updateView = (isNext = true) => {
        steps.forEach((step, index) => {
            if (index === currentStep) {
                step.classList.add('active');
                step.classList.remove('inactive-prev');
            } else {
                step.classList.remove('active');
                if (index < currentStep) {
                    step.classList.add('inactive-prev');
                } else {
                    step.classList.remove('inactive-prev');
                }
            }
        });
        const progress = (currentStep / (totalSteps - 1)) * 100;
        progressBar.style.width = `${progress}%`;

        // Add/remove class for final step styling
        if (currentStep === totalSteps - 1) {
            container.classList.add('terms-active');
        } else {
            container.classList.remove('terms-active');
        }
    };

    nextButtons.forEach(button => {
        button.addEventListener('click', () => {
            if (currentStep < totalSteps - 1) {
                currentStep++;
                updateView(true);
            }
        });
    });

    prevButtons.forEach(button => {
        button.addEventListener('click', () => {
            if (currentStep > 0) {
                currentStep--;
                updateView(false);
            }
        });
    });
    
    if (budgetSlider) {
        budgetSlider.addEventListener('input', () => {
            if (budgetValueDisplay) {
                budgetValueDisplay.textContent = budgetSlider.value;
            }
        });
    }

    options.forEach(option => {
        option.addEventListener('click', (e) => {
            // Ripple effect
            const ripple = document.createElement('span');
            const rect = option.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            ripple.style.width = ripple.style.height = `${size}px`;
            ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
            ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
            ripple.classList.add('ripple');
            option.appendChild(ripple);
            ripple.addEventListener('animationend', () => ripple.remove());

            const parentGrid = e.target.closest('.options-grid');
            
            if (parentGrid.classList.contains('single-select')) {
                parentGrid.querySelectorAll('.option').forEach(opt => {
                    if (opt !== e.target) opt.classList.remove('selected');
                });
            }
            
            e.target.classList.toggle('selected');

            if (parentGrid.classList.contains('single-select') && e.target.classList.contains('selected')) {
                setTimeout(() => {
                    if (currentStep < totalSteps - 1) {
                        currentStep++;
                        updateView(true);
                    }
                }, 350);
            }
        });
    });

    function checkAgreements() {
        if (termsAgree && privacyAgree) {
            if (termsAgree.checked && privacyAgree.checked) {
                submitBtn.disabled = false;
            } else {
                submitBtn.disabled = true;
            }
        }
    }

    if (termsAgree) termsAgree.addEventListener('change', checkAgreements);
    if (privacyAgree) privacyAgree.addEventListener('change', checkAgreements);

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const personalizationData = {};
        
        steps.forEach((step) => {
            const selectedOptions = step.querySelectorAll('.option.selected');
            if (selectedOptions.length > 0) {
                const question = step.querySelector('h2').innerText;
                const answers = Array.from(selectedOptions).map(opt => opt.dataset.value);
                personalizationData[question] = answers;
            }
        });
        
        if (budgetSlider) personalizationData['Weekly Budget'] = budgetSlider.value;

        console.log("Personalization Data:", personalizationData);
        
        submitBtn.innerText = 'Saving...';
        
        setTimeout(() => {
            alert("Thanks! Your preferences have been saved.");
            window.location.href = 'dashboard.html'; // Redirect after saving
        }, 500);
    });

    updateView(true);
}); 