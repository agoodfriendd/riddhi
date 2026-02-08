// Add fade-in animation to paragraphs
document.addEventListener('DOMContentLoaded', function() {
    const paragraphs = document.querySelectorAll('.apology p');
    
    paragraphs.forEach((p, index) => {
        p.style.opacity = '0';
        p.style.transform = 'translateY(20px)';
        p.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
        
        setTimeout(() => {
            p.style.opacity = '1';
            p.style.transform = 'translateY(0)';
        }, 300 * (index + 1));
    });

    // Add subtle hover effect to emphasis box
    const emphasisBox = document.querySelector('.emphasis');
    if (emphasisBox) {
        emphasisBox.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.02)';
            this.style.transition = 'transform 0.3s ease';
        });
        
        emphasisBox.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1)';
        });
    }
});
