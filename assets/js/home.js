function accountRoute() {
  const currentUser = sessionStorage.getItem('currentUser') || localStorage.getItem('currentUser');
  
  if (currentUser) {
    window.location.href = './pages/account.html';
  } else {
    window.location.href = './pages/login.html';
  }
}

class HomeDatabase {
  constructor() {
    this.dbName = 'GameZoidDB';
    this.dbVersion = 1;
    this.db = null;
    this.init();
  }
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => { this.db = request.result; resolve(); };
      request.onupgradeneeded = (event) => { };
    });
  }
  async getAllGames() {
    if (!this.db) return [];
    const tx = this.db.transaction(['games'], 'readonly');
    const store = tx.objectStore('games');
    return new Promise((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }
  async getAllProducts() {
    if (!this.db) return [];
    const tx = this.db.transaction(['products'], 'readonly');
    const store = tx.objectStore('products');
    return new Promise((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }
}

let homeDB;
document.addEventListener('DOMContentLoaded', async () => {
  try {
    homeDB = new HomeDatabase();
    await homeDB.init();
    await loadHomeData();
  } catch (e) {
  }
});

async function loadHomeData() {
  try {
    const [games, products] = await Promise.all([
      homeDB.getAllGames(),
      homeDB.getAllProducts()
    ]);

    const sections = Array.from(document.querySelectorAll('section.new-section'));
    const gamesSection = sections.find(sec => sec.querySelector('h2')?.textContent?.toLowerCase().includes('new games'));
    const productsSection = sections.find(sec => sec.querySelector('h2')?.textContent?.toLowerCase().includes('gaming product'));

    if (gamesSection) renderGamesToSection(gamesSection, games);
    if (productsSection) renderProductsToSection(productsSection, products);
  } catch (e) {
  }
}

function renderGamesToSection(section, games) {
  const container = section.querySelector('.product-container');
  if (!container) return;
  if (!Array.isArray(games) || games.length === 0) {
    container.innerHTML = `<div class="product-empty" style="color: var(--color); font-weight:600;">No games available</div>`;
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
    container.innerHTML = `<div class="product-empty" style="color: var(--color); font-weight:600;">No products available</div>`;
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
  const currentUserStr = sessionStorage.getItem('currentUser') || localStorage.getItem('currentUser');
  const currentUser = JSON.parse(currentUserStr || 'null');
  
  if (!currentUser) {
    alert('Please log in to add items to cart');
    window.location.href = './pages/login.html';
    return;
  }
  
  let cart = JSON.parse(localStorage.getItem('cart') || '[]');
  
  if (cart.find(i => i.id === id && i.type === type)) {
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


