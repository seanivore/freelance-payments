/**
 * shadcn/ui-inspired Input Component
 * Usage: <input class="input" type="text" />
 */

export function createInput(type = 'text', placeholder = '', value = '') {
  const input = document.createElement('input');
  input.type = type;
  input.className = 'input';
  input.placeholder = placeholder;
  input.value = value;
  return input;
}

export function createLabel(text, forId = '') {
  const label = document.createElement('label');
  label.className = 'label';
  label.textContent = text;
  if (forId) {
    label.setAttribute('for', forId);
  }
  return label;
}
