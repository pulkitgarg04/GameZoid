function accountRoute() {
  const currentUser = sessionStorage.getItem('currentUser');
  
  if (currentUser) {
    window.location.href = './account.html';
  } else {
    window.location.href = './login.html';
  }
}

function getStore(name) {
  try {
    const raw = localStorage.getItem(name);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.log(`Error parsing ${name} from localStorage`, e);
    return [];
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadStoreData();
});

function loadStoreData() {
  const games = getStore('games');
  const products = getStore('products');

  if ((!games || games.length === 0) && (!products || products.length === 0)) {
    return showFallbackContent();
  }

  displayGames(games || []);
  if (products && products.length > 0) displayProducts(products);

  try {
    const categories = getUniqueCategories(games || [], products || []);
    renderCategoryFilters(categories);
  } catch (e) {
    console.log('renderCategoryFilters error', e);
  }
}

function getUniqueCategories(games, products) {
  const set = new Map();
  (games || []).forEach(g => {
    if (g && g.category) set.set(String(g.category).toLowerCase(), g.category);
  });
  (products || []).forEach(p => {
    if (p && p.category) set.set(String(p.category).toLowerCase(), p.category);
  });

  return Array.from(set.values());
}

function renderCategoryFilters(categories) {
  const container = document.querySelector('.filter-buttons');
  if (!container) return;

  container.innerHTML = '';
  const allBtn = document.createElement('button');
  allBtn.className = 'filter-btn active';
  allBtn.textContent = 'All';
  allBtn.dataset.category = 'all';
  allBtn.addEventListener('click', (e) => filterByCategory(e, 'all'));
  container.appendChild(allBtn);

  categories.forEach(cat => {
    const btn = document.createElement('button');
    btn.className = 'filter-btn';
    btn.textContent = String(cat).charAt(0).toUpperCase() + String(cat).slice(1);
    btn.dataset.category = String(cat).toLowerCase();
    btn.addEventListener('click', (e) => filterByCategory(e, String(cat)));
    container.appendChild(btn);
  });
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
        <a href="./game.html?id=${game.id}" onclick="hideGamingProductsHeading()"><img src="${game.image}" alt="${game.name}" onerror="this.src='../assets/media/favicon.png'"></a>
      </div>
      <div class="title">
        <h3><a href="./game.html?id=${game.id}" onclick="hideGamingProductsHeading()">${game.name.toUpperCase()}</a></h3>
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
    <div class="cards" data-product-id="${product.id}" onclick="window.location.href='./product.html?id=${product.id}'" style="cursor: pointer;">
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
        <button class="buy-btn" onclick="event.stopPropagation(); addToCart(${product.id}, 'product')">
          <i class="fas fa-shopping-cart"></i>
          Add to Cart
        </button>
      </div>
    </div>
  `).join('');
}

function addToCart(itemId, type) {
  const currentUserStr = sessionStorage.getItem('currentUser') || localStorage.getItem('currentUser');
  const currentUser = JSON.parse(currentUserStr || 'null');
  
  if (!currentUser) {
    alert('Please log in to add items to cart');
    window.location.href = './login.html';
    return;
  }
  
  let cart = JSON.parse(localStorage.getItem('cart')) || [];
  
  const existingItem = cart.find(item => String(item.id) === String(itemId) && item.type === type);
  
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
  const raw = document.getElementById('storeSearch')?.value || '';
  const searchTerm = raw.trim().toLowerCase();

  const cards = document.querySelectorAll('.cards');
  if (!searchTerm) {
    cards.forEach(card => card.style.display = 'block');
    return;
  }

  cards.forEach(card => {
    const nameEl = card.querySelector('h3');
    const catEl = card.querySelector('.category');
    const name = nameEl ? nameEl.textContent.toLowerCase() : '';
    const category = catEl ? catEl.textContent.toLowerCase() : '';

    if (name.includes(searchTerm) || category.includes(searchTerm)) {
      card.style.display = 'block';
    } else {
      card.style.display = 'none';
    }
  });
}


function filterByCategory(event, category) {
  if (typeof event === 'string' && category === undefined) {
    category = event;
    event = null;
  }

  const filterButtons = document.querySelectorAll('.filter-btn');
  filterButtons.forEach(btn => btn.classList.remove('active'));
  if (event && event.currentTarget) event.currentTarget.classList.add('active');

  const cards = document.querySelectorAll('.cards');
  cards.forEach(card => {
    const catEl = card.querySelector('.category');
    const cardCategory = catEl ? catEl.textContent.toLowerCase() : '';

    if (category === 'all' || cardCategory.includes(String(category).toLowerCase())) {
      card.style.display = 'block';
    } else {
      card.style.display = 'none';
    }
  });

  try {
    const productsSection = document.getElementById('gaming-products');
    if (productsSection) {
      const heading = productsSection.querySelector('h1');
      if (heading) {
        if (String(category).toLowerCase() === 'all') heading.style.display = '';
        else heading.style.display = 'none';
      }
    }
  } catch (e) {
    console.log('Error hiding gaming products heading', e);
  }
}


document.addEventListener('DOMContentLoaded', () => {
  updateCartCount();
});
