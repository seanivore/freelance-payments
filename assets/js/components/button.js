/**
 * shadcn/ui-inspired Button Component
 * Usage: <button class="btn btn-primary">Click me</button>
 */

// Button styles are handled via Tailwind classes
// See: assets/css/styles.css for button component styles

export function createButton(text, variant = 'default', onClick = null) {
  const button = document.createElement('button');
  button.className = `btn btn-${variant}`;
  button.textContent = text;
  if (onClick) {
    button.addEventListener('click', onClick);
  }
  return button;
}
