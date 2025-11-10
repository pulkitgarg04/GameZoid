function accountRoute() {
  const currentUser = sessionStorage.getItem('currentUser');
  
  if (currentUser) {
    window.location.href = './pages/account.html';
  } else {
    window.location.href = './pages/login.html';
  }
}

function getStore(name) {
  try {
    const item = localStorage.getItem(name);
    return item ? JSON.parse(item) : [];
  } catch (e) {
    console.error(`Error parsing ${name} from localStorage`, e);
    return [];
  }
}

document.addEventListener('DOMContentLoaded', () => {
  try {
    loadHomeData();
  } catch (e) {
    showEmptyStates();
  }
});

function showEmptyStates() {
  const sections = Array.from(document.querySelectorAll('section.new-section'));
  const gamesSection = sections.find(sec => sec.querySelector('h2')?.textContent?.toLowerCase().includes('new games'));
  const productsSection = sections.find(sec => sec.querySelector('h2')?.textContent?.toLowerCase().includes('gaming product'));

  if (gamesSection) {
    const container = gamesSection.querySelector('.product-container');
    if (container) {
      container.innerHTML = `<div class="product-empty">No games available - Visit the admin panel to add games</div>`;
    }
  }

  if (productsSection) {
    const container = productsSection.querySelector('.product-container');
    if (container) {
      container.innerHTML = `<div class="product-empty">No products available - Visit the admin panel to add products</div>`;
    }
  }
}

function loadHomeData() {
  const games = getStore('games');
  const products = getStore('products');

  const sections = Array.from(document.querySelectorAll('section.new-section'));
  const gamesSection = sections.find(sec => sec.querySelector('h2')?.textContent?.toLowerCase().includes('new games'));
  const productsSection = sections.find(sec => sec.querySelector('h2')?.textContent?.toLowerCase().includes('gaming product'));

  if ((!Array.isArray(games) || games.length === 0) && (!Array.isArray(products) || products.length === 0)) {
    return showEmptyStates();
  }

  if (gamesSection) renderGamesToSection(gamesSection, games || []);
  if (productsSection) renderProductsToSection(productsSection, products || []);
}

function renderGamesToSection(section, games) {
  const container = section.querySelector('.product-container');
  if (!container) return;
  
  if (!Array.isArray(games) || games.length === 0) {
    container.innerHTML = `<div class="product-empty">No games available - Visit the admin panel to add games</div>`;
    return;
  }

  container.innerHTML = games.slice(0, 8).map(game => `
    <div class="product" onclick="window.location.href='./pages/game.html?id=${game.id}'">
      <img src="${game.image}" onerror="this.src='./assets/media/favicon.png'">
      <div class="product-description">
        <div class="product-category">
          <h6>${game.category || ''}</h6>
        </div>
        <h5>${(game.name || '').toString()}</h5>
        <h4>$${Number(game.price || 0).toFixed(2)}</h4>
      </div>
      <a href="javascript:void(0)" onclick="event.stopPropagation(); homeAddToCart(${game.id}, 'game')">
        <i class="fas fa-shopping-cart cart"></i>
      </a>
    </div>
  `).join('');
}

function renderProductsToSection(section, products) {
  const container = section.querySelector('.product-container');
  if (!container) return;
  
  if (!Array.isArray(products) || products.length === 0) {
    container.innerHTML = `<div class="product-empty">No products available - Visit the admin panel to add products</div>`;
    return;
  }
  
  container.innerHTML = products.slice(0, 8).map(p => `
    <div class="product" onclick="window.location.href='./pages/product.html?id=${p.id}'">
      <img src="${p.image}" onerror="this.src='./assets/media/favicon.png'">
      <div class="product-description">
        <div class="product-category">
          <h6>${p.category || ''}</h6>
        </div>
        <h5>${(p.name || '').toString()}</h5>
        <h4>$${Number(p.price || 0).toFixed(2)}</h4>
      </div>
      <a href="javascript:void(0)" onclick="event.stopPropagation(); homeAddToCart(${p.id}, 'product')">
        <i class="fas fa-shopping-cart cart"></i>
      </a>
    </div>
  `).join('');
}

function homeAddToCart(id, type) {
  const currentUserStr = sessionStorage.getItem('currentUser');
  const currentUser = JSON.parse(currentUserStr || 'null');
  
  if (!currentUser) {
    alert('Please log in to add items to cart');
    window.location.href = './pages/login.html';
    return;
  }
  
  let cart = JSON.parse(localStorage.getItem('cart') || '[]');
  
  if (cart.find(i => String(i.id) === String(id) && i.type === type)) {
    alert('This item is already in your cart!');
    return;
  }
  
  cart.push({ 
    id, 
    type, 
    addedAt: new Date().toISOString(),
    addedBy: currentUser.email
  });
  
  localStorage.setItem('cart', JSON.stringify(cart));
  alert('Item added to cart!');
}