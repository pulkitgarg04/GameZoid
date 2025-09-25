class StoreDatabase {
  constructor() {
    this.dbName = 'GameZoidDB';
    this.dbVersion = 1;
    this.db = null;
    this.init();
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        console.error('Database failed to open');
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('Store database opened successfully');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
      };
    });
  }

  async getAllGames() {
    if (!this.db) return [];
    const transaction = this.db.transaction(['games'], 'readonly');
    const store = transaction.objectStore('games');
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllProducts() {
    if (!this.db) return [];
    const transaction = this.db.transaction(['products'], 'readonly');
    const store = transaction.objectStore('products');
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
}

let storeDB;

document.addEventListener('DOMContentLoaded', async () => {
  try {
    storeDB = new StoreDatabase();
    await storeDB.init();
    await loadStoreData();
  } catch (error) {
    console.error('Failed to initialize store database:', error);
    showFallbackContent();
  }
});

async function loadStoreData() {
  try {
    const games = await storeDB.getAllGames();
    const products = await storeDB.getAllProducts();
    
    displayGames(games);
    
    if (products.length > 0) {
      displayProducts(products);
    }
  } catch (error) {
    console.error('Error loading store data:', error);
    showFallbackContent();
  }
}

function displayGames(games) {
  const gamesContainer = document.querySelector('#latest-games .main');
  
  if (games.length === 0) {
    gamesContainer.innerHTML = `
      <div class="no-games">
        <i class="fas fa-gamepad"></i>
        <h3>No Games Available</h3>
        <p>Check back later for new releases!</p>
      </div>
    `;
    return;
  }

  gamesContainer.innerHTML = games.map(game => `
    <div class="cards" data-game-id="${game.id}">
      <div class="image">
        <img src="${game.image}" alt="${game.name}" onerror="this.src='../assets/media/favicon.png'">
      </div>
      <div class="title">
        <h3>${game.name.toUpperCase()}</h3>
        <div class="category">${game.category}</div>
      </div>
      <div class="des">
        <p class="price">$${game.price}</p>
        ${game.description ? `<p class="description">${game.description}</p>` : ''}
        <button class="buy-btn" onclick="addToCart(${game.id}, 'game')">
          <i class="fas fa-shopping-cart"></i>
          Add to Cart
        </button>
      </div>
    </div>
  `).join('');
}

function displayProducts(products) {
  let productsSection = document.querySelector('#gaming-products');
  if (!productsSection) {
    const latestGamesSection = document.querySelector('#latest-games');
    productsSection = document.createElement('section');
    productsSection.id = 'gaming-products';
    productsSection.className = 'section-p1';
    productsSection.innerHTML = `
      <h1>GAMING PRODUCTS</h1>
      <div class="main products-container"></div>
    `;
    latestGamesSection.insertAdjacentElement('afterend', productsSection);
  }

  const productsContainer = productsSection.querySelector('.main');
  productsContainer.innerHTML = products.map(product => `
    <div class="cards" data-product-id="${product.id}">
      <div class="image">
        <img src="${product.image}" alt="${product.name}" onerror="this.src='../assets/media/favicon.png'">
      </div>
      <div class="title">
        <h3>${product.name.toUpperCase()}</h3>
        <div class="category">${product.category}</div>
      </div>
      <div class="des">
        <p class="price">$${product.price}</p>
        ${product.description ? `<p class="description">${product.description}</p>` : ''}
        <button class="buy-btn" onclick="addToCart(${product.id}, 'product')">
          <i class="fas fa-shopping-cart"></i>
          Add to Cart
        </button>
      </div>
    </div>
  `).join('');
}

function addToCart(itemId, type) {
  let cart = JSON.parse(localStorage.getItem('cart')) || [];
  
  const existingItem = cart.find(item => item.id === itemId && item.type === type);
  
  if (existingItem) {
    showCartMessage('This item is already in your cart!', 'error');
    return;
  }
  
  cart.push({
    id: itemId,
    type: type,
    addedAt: new Date().toISOString()
  });
  
  localStorage.setItem('cart', JSON.stringify(cart));
  
  showCartMessage('Item added to cart!', 'success');
  
  updateCartCount();
}

function showCartMessage(message, type) {
  const existingMessages = document.querySelectorAll('.cart-message');
  existingMessages.forEach(msg => msg.remove());

  const messageDiv = document.createElement('div');
  messageDiv.className = `cart-message ${type}`;
  messageDiv.innerHTML = `
    <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
    ${message}
  `;

  const storeHero = document.querySelector('#store-hero');
  storeHero.insertAdjacentElement('afterend', messageDiv);

  setTimeout(() => {
    messageDiv.remove();
  }, 3000);
}

function updateCartCount() {
  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  const totalItems = cart.length;
  

  const cartIcon = document.querySelector('.fa-bag-shopping');
  if (cartIcon) {

    const existingCount = cartIcon.parentElement.querySelector('.cart-count');
    if (existingCount) {
      existingCount.remove();
    }
    

    if (totalItems > 0) {
      const countSpan = document.createElement('span');
      countSpan.className = 'cart-count';
      countSpan.textContent = totalItems;
      countSpan.style.cssText = `
        position: absolute;
        top: -8px;
        right: -8px;
        background: var(--color);
        color: #000;
        border-radius: 50%;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        font-weight: bold;
      `;
      cartIcon.parentElement.style.position = 'relative';
      cartIcon.parentElement.appendChild(countSpan);
    }
  }
}


function showFallbackContent() {
  const gamesContainer = document.querySelector('#latest-games .main');
  gamesContainer.innerHTML = `
    <div class="no-games">
      <i class="fas fa-exclamation-triangle"></i>
      <h3>Store Temporarily Unavailable</h3>
      <p>Please try again later or contact support.</p>
    </div>
  `;
}


function searchStore() {
  const searchTerm = document.getElementById('storeSearch')?.value.toLowerCase();
  if (!searchTerm) return;

  const cards = document.querySelectorAll('.cards');
  cards.forEach(card => {
    const name = card.querySelector('h3').textContent.toLowerCase();
    const category = card.querySelector('.category').textContent.toLowerCase();
    
    if (name.includes(searchTerm) || category.includes(searchTerm)) {
      card.style.display = 'block';
    } else {
      card.style.display = 'none';
    }
  });
}


function filterByCategory(category) {

  const filterButtons = document.querySelectorAll('.filter-btn');
  filterButtons.forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');
  
  const cards = document.querySelectorAll('.cards');
  cards.forEach(card => {
    const cardCategory = card.querySelector('.category').textContent.toLowerCase();
    
    if (category === 'all' || cardCategory.includes(category.toLowerCase())) {
      card.style.display = 'block';
    } else {
      card.style.display = 'none';
    }
  });
}


document.addEventListener('DOMContentLoaded', () => {
  updateCartCount();
});
