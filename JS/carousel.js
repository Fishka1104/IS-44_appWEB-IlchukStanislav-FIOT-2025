const carouselContainer = document.querySelector('.carousel-container');
const slides = document.querySelectorAll('.carousel-slide');
const prevButton = document.querySelector('.prev');
const nextButton = document.querySelector('.next');
let currentSlide = 0;

function updateCarousel() {
    const slideWidth = slides[0].clientWidth;
    carouselContainer.style.transform = `translateX(-${currentSlide * slideWidth}px)`;
}

nextButton.addEventListener('click', () => {
    if (currentSlide < slides.length - 1) {
        currentSlide++;
        updateCarousel();
    }
});

prevButton.addEventListener('click', () => {
    if (currentSlide > 0) {
        currentSlide--;
        updateCarousel();
    }
});

window.addEventListener('resize', updateCarousel);

updateCarousel();





document.querySelectorAll('.product-carousel').forEach(carousel => {
        const prevBtn = carousel.nextElementSibling.querySelector('.prev-btn');
        const nextBtn = carousel.nextElementSibling.querySelector('.next-btn');
        const scrollAmount = 270;

        prevBtn.addEventListener('click', () => {
            carousel.scrollBy({
                left: -scrollAmount,
                behavior: 'smooth'
            });
        });

        nextBtn.addEventListener('click', () => {
            carousel.scrollBy({
                left: scrollAmount,
                behavior: 'smooth'
            });
        });
    });