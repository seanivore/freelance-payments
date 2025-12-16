/**
 * shadcn/ui-inspired Card Component
 * Usage: <div class="card">...</div>
 */

export function createCard(content = '') {
  const card = document.createElement('div');
  card.className = 'card';
  if (typeof content === 'string') {
    card.innerHTML = content;
  } else {
    card.appendChild(content);
  }
  return card;
}

export function createCardHeader(content = '') {
  const header = document.createElement('div');
  header.className = 'card-header';
  if (typeof content === 'string') {
    header.innerHTML = content;
  } else {
    header.appendChild(content);
  }
  return header;
}

export function createCardTitle(text) {
  const title = document.createElement('h3');
  title.className = 'card-title';
  title.textContent = text;
  return title;
}

export function createCardContent(content = '') {
  const contentDiv = document.createElement('div');
  contentDiv.className = 'card-content';
  if (typeof content === 'string') {
    contentDiv.innerHTML = content;
  } else {
    contentDiv.appendChild(content);
  }
  return contentDiv;
}
