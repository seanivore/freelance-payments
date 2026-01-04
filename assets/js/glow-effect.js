/**
 * Mouse-following glow effect with frosted glass
 * Creates a dynamic light source that follows the cursor
 */

(function () {
  'use strict';

  const glowElement = document.getElementById('mouse-glow');
  const cardElement = document.getElementById('frosted-card');

  if (!glowElement || !cardElement) return;

  let mouseX = 0;
  let mouseY = 0;
  let cardRect = null;

  // Update card position for relative calculations
  function updateCardRect() {
    cardRect = cardElement.getBoundingClientRect();
  }

  // Track mouse movement
  function handleMouseMove(e) {
    mouseX = e.clientX;
    mouseY = e.clientY;
    updateCardRect();
    updateGlow();
  }

  // Update glow position and intensity
  function updateGlow() {
    if (!cardRect) return;

    // Calculate relative position within card
    const relativeX = mouseX - cardRect.left;
    const relativeY = mouseY - cardRect.top;

    // Check if mouse is over the card
    const isOverCard = (
      mouseX >= cardRect.left &&
      mouseX <= cardRect.right &&
      mouseY >= cardRect.top &&
      mouseY <= cardRect.bottom
    );

    if (isOverCard) {
      // Show glow and position it at mouse location
      glowElement.style.opacity = '1';
      glowElement.style.left = mouseX + 'px';
      glowElement.style.top = mouseY + 'px';
      glowElement.style.transform = 'translate(-50%, -50%)';

      // Update CSS custom properties for edge glow intensity
      // Calculate distance from center of card
      const cardCenterX = cardRect.width / 2;
      const cardCenterY = cardRect.height / 2;
      const distanceFromCenter = Math.sqrt(
        Math.pow(relativeX - cardCenterX, 2) +
        Math.pow(relativeY - cardCenterY, 2)
      );
      const maxDistance = Math.sqrt(
        Math.pow(cardRect.width / 2, 2) +
        Math.pow(cardRect.height / 2, 2)
      );
      // Intensity increases as mouse moves away from center (brighter on edges)
      const intensity = 0.4 + (distanceFromCenter / maxDistance) * 0.6; // 0.4 to 1.0

      cardElement.style.setProperty('--glow-intensity', intensity);

      // Update the ::after pseudo-element position within the card
      const cardRelativeX = (relativeX / cardRect.width) * 100;
      const cardRelativeY = (relativeY / cardRect.height) * 100;
      cardElement.style.setProperty('--glow-x', cardRelativeX + '%');
      cardElement.style.setProperty('--glow-y', cardRelativeY + '%');
    } else {
      // Subtle persistent glow when mouse is not over card
      glowElement.style.opacity = '0.15'; // Subtle ambient glow
      cardElement.style.setProperty('--glow-intensity', '0.25'); // Base edge glow
      // Center the glow in the card for ambient effect
      cardElement.style.setProperty('--glow-x', '50%');
      cardElement.style.setProperty('--glow-y', '50%');
    }
  }

  // Initialize
  updateCardRect();
  window.addEventListener('resize', updateCardRect);
  document.addEventListener('mousemove', handleMouseMove);

  // Handle mouse leave - return to subtle ambient glow
  cardElement.addEventListener('mouseleave', () => {
    glowElement.style.opacity = '0.15'; // Subtle ambient glow
    cardElement.style.setProperty('--glow-intensity', '0.25'); // Base edge glow
    cardElement.style.setProperty('--glow-x', '50%');
    cardElement.style.setProperty('--glow-y', '50%');
  });

  // Initial fade-in
  setTimeout(() => {
    glowElement.style.transition = 'opacity 0.3s ease-out';
  }, 100);
})();
