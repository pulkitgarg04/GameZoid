document.addEventListener('DOMContentLoaded', () => {
  let currentUser = sessionStorage.getItem('currentUser');
  if (!currentUser) {
    currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
      sessionStorage.setItem('currentUser', currentUser);
      localStorage.removeItem('currentUser');
    }
  }

  const user = JSON.parse(currentUser || 'null');
  if (!user || !user.isAdmin) {
    alert('Access Denied: Admin privileges required!');
    window.location.href = './login.html';
  }
});

function accountRoute() {
  const currentUser = sessionStorage.getItem('currentUser') || localStorage.getItem('currentUser');
  
  if (currentUser) {
    window.location.href = './account.html';
  } else {
    window.location.href = './login.html';
  }
}

class GameDatabase {
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
        console.log('Database opened successfully');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        if (!db.objectStoreNames.contains('games')) {
          const gamesStore = db.createObjectStore('games', { keyPath: 'id', autoIncrement: true });
          gamesStore.createIndex('name', 'name', { unique: false });
          gamesStore.createIndex('category', 'category', { unique: false });
        }

        if (!db.objectStoreNames.contains('products')) {
          const productsStore = db.createObjectStore('products', { keyPath: 'id', autoIncrement: true });
          productsStore.createIndex('name', 'name', { unique: false });
          productsStore.createIndex('category', 'category', { unique: false });
        }
      };
    });
  }

  async addGame(game) {
    const transaction = this.db.transaction(['games'], 'readwrite');
    const store = transaction.objectStore('games');
    return new Promise((resolve, reject) => {
      const request = store.add(game);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllGames() {
    const transaction = this.db.transaction(['games'], 'readonly');
    const store = transaction.objectStore('games');
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async updateGame(id, game) {
    const transaction = this.db.transaction(['games'], 'readwrite');
    const store = transaction.objectStore('games');
    return new Promise((resolve, reject) => {
      const request = store.put({ ...game, id });
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteGame(id) {
    const transaction = this.db.transaction(['games'], 'readwrite');
    const store = transaction.objectStore('games');
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async addProduct(product) {
    const transaction = this.db.transaction(['products'], 'readwrite');
    const store = transaction.objectStore('products');
    return new Promise((resolve, reject) => {
      const request = store.add(product);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllProducts() {
    const transaction = this.db.transaction(['products'], 'readonly');
    const store = transaction.objectStore('products');
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async updateProduct(id, product) {
    const transaction = this.db.transaction(['products'], 'readwrite');
    const store = transaction.objectStore('products');
    return new Promise((resolve, reject) => {
      const request = store.put({ ...product, id });
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteProduct(id) {
    const transaction = this.db.transaction(['products'], 'readwrite');
    const store = transaction.objectStore('products');
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async clearDatabase() {
    const gamesTransaction = this.db.transaction(['games'], 'readwrite');
    const gamesStore = gamesTransaction.objectStore('games');
    gamesStore.clear();

    const productsTransaction = this.db.transaction(['products'], 'readwrite');
    const productsStore = productsTransaction.objectStore('products');
    productsStore.clear();
  }

  async getStats() {
    const games = await this.getAllGames();
    const products = await this.getAllProducts();
    
    return {
      gamesCount: games.length,
      productsCount: products.length,
      dbSize: this.estimateDbSize(games, products)
    };
  }

  estimateDbSize(games, products) {
    const allData = [...games, ...products];
    const jsonString = JSON.stringify(allData);
    const sizeInBytes = new Blob([jsonString]).size;
    return Math.round(sizeInBytes / 1024) + ' KB';
  }
}

let gameDB;

document.addEventListener('DOMContentLoaded', async () => {
  try {
    gameDB = new GameDatabase();
    await gameDB.init();
    await loadGames();
    await loadProducts();
    await refreshStats();
  } catch (error) {
    console.error('Failed to initialize database:', error);
    showMessage('Failed to initialize database. Please refresh the page.', 'error');
  }
});

function showTab(tabName) {
  const tabContents = document.querySelectorAll('.tab-content');
  tabContents.forEach(content => content.classList.remove('active'));

  const tabButtons = document.querySelectorAll('.tab-btn');
  tabButtons.forEach(button => button.classList.remove('active'));

  document.getElementById(tabName + '-tab').classList.add('active');

  event.target.classList.add('active');
}

async function loadGames() {
  try {
    const games = await gameDB.getAllGames();
    displayGames(games);
  } catch (error) {
    console.error('Error loading games:', error);
    showMessage('Error loading games', 'error');
  }
}

function displayGames(games) {
  const gamesGrid = document.getElementById('gamesGrid');
  
  if (games.length === 0) {
    gamesGrid.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-gamepad"></i>
        <h3>No games found</h3>
        <p>Add your first game to get started!</p>
      </div>
    `;
    return;
  }

  gamesGrid.innerHTML = games.map(game => `
    <div class="item-card slide-up">
      <img src="${game.image}" alt="${game.name}" class="item-image" onerror="this.src='../assets/media/favicon.png'">
      <div class="item-content">
        <div class="item-category">${game.category}</div>
        <h3 class="item-name">${game.name}</h3>
        <div class="item-price">$${game.price}</div>
        ${game.description ? `<p class="item-description">${game.description}</p>` : ''}
        <div class="item-actions">
          <button class="btn-edit" onclick="editGame(${game.id})">
            <i class="fas fa-edit"></i> Edit
          </button>
          <button class="btn-delete" onclick="deleteGame(${game.id})">
            <i class="fas fa-trash"></i> Delete
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

async function loadProducts() {
  try {
    const products = await gameDB.getAllProducts();
    displayProducts(products);
  } catch (error) {
    console.error('Error loading products:', error);
    showMessage('Error loading products', 'error');
  }
}

function displayProducts(products) {
  const productsGrid = document.getElementById('productsGrid');
  
  if (products.length === 0) {
    productsGrid.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-box"></i>
        <h3>No products found</h3>
        <p>Add your first gaming product to get started!</p>
      </div>
    `;
    return;
  }

  productsGrid.innerHTML = products.map(product => `
    <div class="item-card slide-up">
      <img src="${product.image}" alt="${product.name}" class="item-image" onerror="this.src='../assets/media/favicon.png'">
      <div class="item-content">
        <div class="item-category">${product.category}</div>
        <h3 class="item-name">${product.name}</h3>
        <div class="item-price">$${product.price}</div>
        ${product.description ? `<p class="item-description">${product.description}</p>` : ''}
        <div class="item-actions">
          <button class="btn-edit" onclick="editProduct(${product.id})">
            <i class="fas fa-edit"></i> Edit
          </button>
          <button class="btn-delete" onclick="deleteProduct(${product.id})">
            <i class="fas fa-trash"></i> Delete
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

function showAddGameModal() {
  document.getElementById('addGameModal').style.display = 'block';
  document.getElementById('addGameForm').reset();
  
  setTimeout(() => {
    checkScrollIndicator(document.querySelector('#addGameModal .modal-form-content'));
  }, 100);
}

function showAddProductModal() {
  document.getElementById('addProductModal').style.display = 'block';
  document.getElementById('addProductForm').reset();
  
  setTimeout(() => {
    checkScrollIndicator(document.querySelector('#addProductModal .modal-form-content'));
  }, 100);
}

function closeModal(modalId) {
  document.getElementById(modalId).style.display = 'none';
}

function checkScrollIndicator(element) {
  if (!element) return;
  
  const hasVerticalScrollbar = element.scrollHeight > element.clientHeight;
  
  if (hasVerticalScrollbar) {
    element.classList.add('has-scroll');
  } else {
    element.classList.remove('has-scroll');
  }
  
  element.addEventListener('scroll', () => {
    const scrollTop = element.scrollTop;
    const scrollHeight = element.scrollHeight - element.clientHeight;
    
    if (scrollTop >= scrollHeight - 10) {
      element.classList.remove('has-scroll');
    } else {
      element.classList.add('has-scroll');
    }
  });
}

function showGameFields(isGame) {
  const gameOnlyFields = [
    'editTagline', 'editDeveloper', 'editPublisher', 'editReleaseDate',
    'editPlatforms', 'editRating', 'editFeatures', 'editReqMin', 
    'editReqRec', 'editScreenshots'
  ];
  
  gameOnlyFields.forEach(fieldId => {
    const field = document.getElementById(fieldId);
    const formGroup = field ? field.closest('.form-group') : null;
    if (formGroup) {
      formGroup.style.display = isGame ? 'block' : 'none';
    }
  });
}

document.getElementById('addGameForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const game = {
    name: document.getElementById('gameName').value,
    tagline: document.getElementById('gameTagline').value,
    category: document.getElementById('gameCategory').value,
    developer: document.getElementById('gameDeveloper').value,
    publisher: document.getElementById('gamePublisher').value,
    releaseDate: document.getElementById('gameReleaseDate').value,
    price: parseFloat(document.getElementById('gamePrice').value),
    image: document.getElementById('gameImage').value,
    description: document.getElementById('gameDescription').value,
    platforms: (document.getElementById('gamePlatforms').value || '').split(',').map(s => s.trim()).filter(Boolean),
    rating: parseFloat(document.getElementById('gameRating').value || '0'),
    features: (document.getElementById('gameFeatures').value || '').split('\n').map(s => s.trim()).filter(Boolean),
    requirements: {
      minimum: parseKeyValueText(document.getElementById('gameReqMin').value || ''),
      recommended: parseKeyValueText(document.getElementById('gameReqRec').value || '')
    },
    screenshots: (document.getElementById('gameScreenshots').value || '').split('\n').map(s => s.trim()).filter(Boolean)
  };

  try {
    await gameDB.addGame(game);
    showMessage('Game added successfully!', 'success');
    closeModal('addGameModal');
    await loadGames();
    await refreshStats();
  } catch (error) {
    console.error('Error adding game:', error);
    showMessage('Error adding game', 'error');
  }
});

document.getElementById('addProductForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const product = {
    name: document.getElementById('productName').value,
    category: document.getElementById('productCategory').value,
    price: parseFloat(document.getElementById('productPrice').value),
    image: document.getElementById('productImage').value,
    description: document.getElementById('productDescription').value
  };

  try {
    await gameDB.addProduct(product);
    showMessage('Product added successfully!', 'success');
    closeModal('addProductModal');
    await loadProducts();
    await refreshStats();
  } catch (error) {
    console.error('Error adding product:', error);
    showMessage('Error adding product', 'error');
  }
});

async function editGame(id) {
  try {
    const games = await gameDB.getAllGames();
    const game = games.find(g => g.id === id);
    
    if (game) {
      document.getElementById('editModalTitle').textContent = 'Edit Game';
      document.getElementById('editId').value = id;
      document.getElementById('editType').value = 'game';
      document.getElementById('editName').value = game.name;
      document.getElementById('editTagline').value = game.tagline || '';
      document.getElementById('editPrice').value = game.price;
      document.getElementById('editImage').value = game.image;
      document.getElementById('editDescription').value = game.description || '';
      document.getElementById('editDeveloper').value = game.developer || '';
      document.getElementById('editPublisher').value = game.publisher || '';
      document.getElementById('editReleaseDate').value = game.releaseDate || '';
      document.getElementById('editPlatforms').value = Array.isArray(game.platforms) ? game.platforms.join(', ') : (game.platforms || '');
      document.getElementById('editRating').value = game.rating || '';
      document.getElementById('editFeatures').value = Array.isArray(game.features) ? game.features.join('\n') : '';
      document.getElementById('editReqMin').value = stringifyKeyValue(game.requirements?.minimum || {});
      document.getElementById('editReqRec').value = stringifyKeyValue(game.requirements?.recommended || {});
      document.getElementById('editScreenshots').value = Array.isArray(game.screenshots) ? game.screenshots.join('\n') : '';
      
      const categorySelect = document.getElementById('editCategory');
      categorySelect.innerHTML = `
        <option value="Battle Royale">Battle Royale</option>
        <option value="Action">Action</option>
        <option value="Adventure">Adventure</option>
        <option value="RPG">RPG</option>
        <option value="Strategy">Strategy</option>
        <option value="Sports">Sports</option>
        <option value="Racing">Racing</option>
        <option value="Fighting">Fighting</option>
        <option value="Puzzle">Puzzle</option>
        <option value="Simulation">Simulation</option>
        <option value="Horror">Horror</option>
        <option value="Platformer">Platformer</option>
        <option value="Tactical Shooter">Tactical Shooter</option>
        <option value="Open World">Open World</option>
        <option value="Base-Building">Base-Building</option>
        <option value="Hack and Slash">Hack and Slash</option>
      `;
      categorySelect.value = game.category;
      
      document.getElementById('editModal').style.display = 'block';
      
      showGameFields(true);
      
      setTimeout(() => {
        checkScrollIndicator(document.querySelector('#editModal .modal-form-content'));
      }, 100);
    }
  } catch (error) {
    console.error('Error loading game for edit:', error);
    showMessage('Error loading game', 'error');
  }
}

async function editProduct(id) {
  try {
    const products = await gameDB.getAllProducts();
    const product = products.find(p => p.id === id);
    
    if (product) {
      document.getElementById('editModalTitle').textContent = 'Edit Product';
      document.getElementById('editId').value = id;
      document.getElementById('editType').value = 'product';
      document.getElementById('editName').value = product.name;
      document.getElementById('editPrice').value = product.price;
      document.getElementById('editImage').value = product.image;
      document.getElementById('editDescription').value = product.description || '';
      
      const categorySelect = document.getElementById('editCategory');
      categorySelect.innerHTML = `
        <option value="VR BOX">VR BOX</option>
        <option value="HEADPHONES">HEADPHONES</option>
        <option value="X-BOX">X-BOX</option>
        <option value="GRAPHICS">GRAPHICS</option>
        <option value="KEYBOARD">KEYBOARD</option>
        <option value="MOUSE">MOUSE</option>
        <option value="MONITOR">MONITOR</option>
        <option value="CONTROLLER">CONTROLLER</option>
        <option value="ACCESSORIES">ACCESSORIES</option>
      `;
      categorySelect.value = product.category;
      
      document.getElementById('editModal').style.display = 'block';
      
      showGameFields(false);
      
      setTimeout(() => {
        checkScrollIndicator(document.querySelector('#editModal .modal-form-content'));
      }, 100);
    }
  } catch (error) {
    console.error('Error loading product for edit:', error);
    showMessage('Error loading product', 'error');
  }
}

document.getElementById('editForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const id = parseInt(document.getElementById('editId').value);
  const type = document.getElementById('editType').value;
  
  const item = {
    name: document.getElementById('editName').value,
    category: document.getElementById('editCategory').value,
    price: parseFloat(document.getElementById('editPrice').value),
    image: document.getElementById('editImage').value,
    description: document.getElementById('editDescription').value,
    tagline: document.getElementById('editTagline').value,
    developer: document.getElementById('editDeveloper').value,
    publisher: document.getElementById('editPublisher').value,
    releaseDate: document.getElementById('editReleaseDate').value,
    platforms: (document.getElementById('editPlatforms').value || '').split(',').map(s => s.trim()).filter(Boolean),
    rating: parseFloat(document.getElementById('editRating').value || '0'),
    features: (document.getElementById('editFeatures').value || '').split('\n').map(s => s.trim()).filter(Boolean),
    requirements: {
      minimum: parseKeyValueText(document.getElementById('editReqMin').value || ''),
      recommended: parseKeyValueText(document.getElementById('editReqRec').value || '')
    },
    screenshots: (document.getElementById('editScreenshots').value || '').split('\n').map(s => s.trim()).filter(Boolean)
  };

  try {
    if (type === 'game') {
      await gameDB.updateGame(id, item);
      await loadGames();
    } else {
      await gameDB.updateProduct(id, item);
      await loadProducts();
    }
    
    showMessage(`${type === 'game' ? 'Game' : 'Product'} updated successfully!`, 'success');
    closeModal('editModal');
    await refreshStats();
  } catch (error) {
    console.error(`Error updating ${type}:`, error);
    showMessage(`Error updating ${type}`, 'error');
  }
});

async function deleteGame(id) {
  showConfirmModal(
    'Delete Game',
    'Are you sure you want to delete this game? This action cannot be undone.',
    async () => {
      try {
        await gameDB.deleteGame(id);
        showMessage('Game deleted successfully!', 'success');
        await loadGames();
        await refreshStats();
      } catch (error) {
        console.error('Error deleting game:', error);
        showMessage('Error deleting game', 'error');
      }
    }
  );
}

async function deleteProduct(id) {
  showConfirmModal(
    'Delete Product',
    'Are you sure you want to delete this product? This action cannot be undone.',
    async () => {
      try {
        await gameDB.deleteProduct(id);
        showMessage('Product deleted successfully!', 'success');
        await loadProducts();
        await refreshStats();
      } catch (error) {
        console.error('Error deleting product:', error);
        showMessage('Error deleting product', 'error');
      }
    }
  );
}

function searchGames() {
  const searchTerm = document.getElementById('gameSearch').value.toLowerCase();
  const gameCards = document.querySelectorAll('#gamesGrid .item-card');
  
  gameCards.forEach(card => {
    const name = card.querySelector('.item-name').textContent.toLowerCase();
    const category = card.querySelector('.item-category').textContent.toLowerCase();
    
    if (name.includes(searchTerm) || category.includes(searchTerm)) {
      card.style.display = 'block';
    } else {
      card.style.display = 'none';
    }
  });
}

function searchProducts() {
  const searchTerm = document.getElementById('productSearch').value.toLowerCase();
  const productCards = document.querySelectorAll('#productsGrid .item-card');
  
  productCards.forEach(card => {
    const name = card.querySelector('.item-name').textContent.toLowerCase();
    const category = card.querySelector('.item-category').textContent.toLowerCase();
    
    if (name.includes(searchTerm) || category.includes(searchTerm)) {
      card.style.display = 'block';
    } else {
      card.style.display = 'none';
    }
  });
}

async function refreshStats() {
  try {
    const stats = await gameDB.getStats();
    document.getElementById('gamesCount').textContent = stats.gamesCount;
    document.getElementById('productsCount').textContent = stats.productsCount;
    document.getElementById('dbSize').textContent = stats.dbSize;
  } catch (error) {
    console.error('Error refreshing stats:', error);
  }
}

async function clearDatabase() {
  showConfirmModal(
    'Clear Database',
    'Are you sure you want to clear all data? This action cannot be undone and will delete all games and products.',
    async () => {
      try {
        await gameDB.clearDatabase();
        showMessage('Database cleared successfully!', 'success');
        await loadGames();
        await loadProducts();
        await refreshStats();
      } catch (error) {
        console.error('Error clearing database:', error);
        showMessage('Error clearing database', 'error');
      }
    }
  );
}

async function exportData() {
  try {
    const games = await gameDB.getAllGames();
    const products = await gameDB.getAllProducts();
    
    const data = {
      games,
      products,
      exportDate: new Date().toISOString(),
      version: '1.0'
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `gamezoid-data-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    showMessage('Data exported successfully!', 'success');
  } catch (error) {
    console.error('Error exporting data:', error);
    showMessage('Error exporting data', 'error');
  }
}

async function populateDefaultData() {
  showConfirmModal(
    'Populate Default Data',
    'This will add all the existing games and products from your project to the database. Continue?',
    async () => {
      try {
        const defaultGames = [
          {
            name: 'Apex Legends',
            tagline: 'Be legendary in the arena',
            category: 'Battle Royale',
            developer: 'Respawn Entertainment',
            publisher: 'Electronic Arts',
            releaseDate: '2019-02-04',
            price: 72.00,
            image: '../assets/community/apex-legends.jpg',
            description: 'A free-to-play battle royale game where legends battle for glory, fame, and fortune.',
            platforms: ['PC', 'PS4', 'PS5', 'Xbox One', 'Xbox Series X|S', 'Switch'],
            rating: 8.7,
            features: ['Hero shooter gameplay', 'Team-based tactics', 'Unique legend abilities', '60-player battle royale'],
            requirements: {
              minimum: { CPU: 'Intel Core i3-6300', RAM: '6 GB', GPU: 'NVIDIA GeForce GT 640', Storage: '56 GB', OS: 'Windows 10' },
              recommended: { CPU: 'Intel i5 3570K', RAM: '8 GB', GPU: 'NVIDIA GeForce GTX 970', Storage: '56 GB', OS: 'Windows 10' }
            },
            screenshots: ['../assets/community/apex-legends.jpg']
          },
          {
            name: 'Grand Theft Auto V',
            tagline: 'Welcome to Los Santos',
            category: 'Open World',
            developer: 'Rockstar North',
            publisher: 'Rockstar Games',
            releaseDate: '2013-09-17',
            price: 95.00,
            image: '../assets/community/gta-v.jpg',
            description: 'An action-adventure game set in the fictional state of San Andreas.',
            platforms: ['PC', 'PS4', 'PS5', 'Xbox One', 'Xbox Series X|S'],
            rating: 9.2,
            features: ['Open-world exploration', 'Multiple protagonists', 'Online mode', 'Heist missions'],
            requirements: {
              minimum: { CPU: 'Intel Core 2 Quad Q6600', RAM: '4 GB', GPU: 'NVIDIA 9800 GT', Storage: '110 GB', OS: 'Windows 10' },
              recommended: { CPU: 'Intel Core i5 3470', RAM: '8 GB', GPU: 'NVIDIA GTX 660', Storage: '110 GB', OS: 'Windows 10' }
            },
            screenshots: ['../assets/community/gta-v.jpg']
          },
          {
            name: 'PUBG (BGMI) - India',
            tagline: 'Winner winner chicken dinner',
            category: 'Battle Royale',
            developer: 'Krafton',
            publisher: 'Krafton',
            releaseDate: '2021-07-02',
            price: 15.00,
            image: '../assets/community/pubg.jpg',
            description: 'PlayerUnknown\'s Battlegrounds - Battle royale game for mobile devices.',
            platforms: ['Mobile', 'PC'],
            rating: 7.9,
            features: ['Realistic ballistics', 'Large maps', 'Team play', '100-player battle royale'],
            requirements: {
              minimum: { CPU: 'Intel Core i5-4430', RAM: '8 GB', GPU: 'NVIDIA GeForce GTX 960', Storage: '30 GB', OS: 'Windows 10' },
              recommended: { CPU: 'Intel Core i5-6600K', RAM: '16 GB', GPU: 'NVIDIA GeForce GTX 1060', Storage: '30 GB', OS: 'Windows 10' }
            },
            screenshots: ['../assets/community/pubg.jpg']
          },
          {
            name: 'Valorant',
            tagline: 'Defy the limits',
            category: 'Tactical Shooter',
            developer: 'Riot Games',
            publisher: 'Riot Games',
            releaseDate: '2020-06-02',
            price: 26.00,
            image: '../assets/community/valorant.webp',
            description: 'A free-to-play first-person tactical hero shooter developed by Riot Games.',
            platforms: ['PC'],
            rating: 8.5,
            features: ['5v5 tactical gameplay', 'Agent abilities', 'Competitive modes', 'Anti-cheat system'],
            requirements: {
              minimum: { CPU: 'Intel i3-370M', RAM: '4 GB', GPU: 'Intel HD 3000', Storage: '10 GB', OS: 'Windows 10' },
              recommended: { CPU: 'Intel i3-4150', RAM: '4 GB', GPU: 'NVIDIA GT 730', Storage: '10 GB', OS: 'Windows 10' }
            },
            screenshots: ['../assets/community/valorant.webp']
          },
          {
            name: 'Call Of Duty',
            tagline: 'There is a soldier in all of us',
            category: 'Action',
            developer: 'Infinity Ward',
            publisher: 'Activision',
            releaseDate: '2019-10-25',
            price: 45.00,
            image: '../assets/community/call-of-duty.webp',
            description: 'A first-person shooter video game franchise published by Activision.',
            platforms: ['PC', 'PS4', 'PS5', 'Xbox One', 'Xbox Series X|S'],
            rating: 8.1,
            features: ['Cinematic campaign', 'Multiplayer', 'Co-op modes', 'Battle royale'],
            requirements: {
              minimum: { CPU: 'Intel Core i3-4340', RAM: '8 GB', GPU: 'NVIDIA GeForce GTX 670', Storage: '175 GB', OS: 'Windows 10' },
              recommended: { CPU: 'Intel Core i5-2500K', RAM: '12 GB', GPU: 'NVIDIA GeForce GTX 970', Storage: '175 GB', OS: 'Windows 10' }
            },
            screenshots: ['../assets/community/call-of-duty.webp']
          },
          {
            name: 'Clash Of Clans',
            tagline: 'Lead your clan to victory',
            category: 'Base-Building',
            developer: 'Supercell',
            publisher: 'Supercell',
            releaseDate: '2012-08-02',
            price: 30.00,
            image: '../assets/community/clash-of-clans.webp',
            description: 'A freemium mobile strategy video game developed and published by Supercell.',
            platforms: ['Mobile', 'iOS', 'Android'],
            rating: 8.0,
            features: ['Clan wars', 'Base building', 'PvP battles', 'Resource management'],
            requirements: {
              minimum: { CPU: 'ARM Cortex-A9', RAM: '1 GB', GPU: 'Adreno 225', Storage: '2 GB', OS: 'iOS 9.0 / Android 4.1' },
              recommended: { CPU: 'ARM Cortex-A72', RAM: '3 GB', GPU: 'Adreno 530', Storage: '2 GB', OS: 'iOS 12.0 / Android 7.0' }
            },
            screenshots: ['../assets/community/clash-of-clans.webp']
          },
          {
            name: 'Devil May Cry',
            tagline: 'Stylish action begins',
            category: 'Hack and Slash',
            developer: 'Capcom',
            publisher: 'Capcom',
            releaseDate: '2019-03-08',
            price: 55.00,
            image: '../assets/community/devil-may-cry.jpg',
            description: 'A series of action-adventure games created by Hideki Kamiya featuring stylish combat.',
            platforms: ['PC', 'PS4', 'PS5', 'Xbox One', 'Xbox Series X|S'],
            rating: 8.6,
            features: ['Combo-heavy combat', 'Multiple characters', 'High replayability', 'Style ranking system'],
            requirements: {
              minimum: { CPU: 'Intel Core i5-4460', RAM: '8 GB', GPU: 'NVIDIA GeForce GTX 760', Storage: '35 GB', OS: 'Windows 10' },
              recommended: { CPU: 'Intel Core i7-3770', RAM: '8 GB', GPU: 'NVIDIA GeForce GTX 1060', Storage: '35 GB', OS: 'Windows 10' }
            },
            screenshots: ['../assets/community/devil-may-cry.jpg']
          },
          {
            name: 'Prince Of Persia',
            tagline: 'Rewrite your destiny',
            category: 'Platformer',
            developer: 'Ubisoft',
            publisher: 'Ubisoft',
            releaseDate: '2010-05-18',
            price: 74.00,
            image: '../assets/community/price-of-persia.jpg',
            description: 'A video game franchise created by Jordan Mechner, originally developed by Broderbund featuring parkour and time manipulation.',
            platforms: ['PC', 'PS3', 'PS4', 'Xbox 360', 'Xbox One'],
            rating: 8.0,
            features: ['Acrobatic platforming', 'Time manipulation', 'Adventure gameplay', 'Prince and Elika partnership'],
            requirements: {
              minimum: { CPU: 'Intel Core 2 Duo E4400', RAM: '2 GB', GPU: 'NVIDIA GeForce 8600 GT', Storage: '9 GB', OS: 'Windows 7' },
              recommended: { CPU: 'Intel Core 2 Quad Q6600', RAM: '3 GB', GPU: 'NVIDIA GeForce 9800 GTX', Storage: '9 GB', OS: 'Windows 10' }
            },
            screenshots: ['../assets/community/price-of-persia.jpg']
          },
          {
            name: 'Fortnite',
            tagline: 'Drop in. Squad up. Outlast all.',
            category: 'Battle Royale',
            developer: 'Epic Games',
            publisher: 'Epic Games',
            releaseDate: '2017-07-21',
            price: 0.00,
            image: '../assets/community/fortnite.jpg',
            description: 'A free-to-play battle royale game developed and published by Epic Games featuring building mechanics.',
            platforms: ['PC', 'PS4', 'PS5', 'Xbox One', 'Xbox Series X|S', 'Switch', 'Mobile'],
            rating: 8.3,
            features: ['Building mechanics', 'Cross-platform play', 'Seasonal content', '100-player battle royale'],
            requirements: {
              minimum: { CPU: 'Intel Core i3-3225', RAM: '8 GB', GPU: 'Intel HD 4000', Storage: '26 GB', OS: 'Windows 10' },
              recommended: { CPU: 'Intel Core i5-7300U', RAM: '8 GB', GPU: 'NVIDIA GTX 960', Storage: '26 GB', OS: 'Windows 10' }
            },
            screenshots: ['../assets/community/fortnite.jpg']
          },
          {
            name: 'League of Legends',
            tagline: 'Become a legend',
            category: 'Strategy',
            developer: 'Riot Games',
            publisher: 'Riot Games',
            releaseDate: '2009-10-27',
            price: 0.00,
            image: '../assets/community/league-of-legends.jpg',
            description: 'A multiplayer online battle arena video game developed and published by Riot Games featuring strategic team-based gameplay.',
            platforms: ['PC', 'Mac'],
            rating: 8.8,
            features: ['5v5 MOBA gameplay', 'Esports tournaments', 'Large champion roster', 'Ranked competitive mode'],
            requirements: {
              minimum: { CPU: '3 GHz processor', RAM: '2 GB', GPU: 'DirectX 9.0c compatible', Storage: '16 GB', OS: 'Windows 7' },
              recommended: { CPU: '3 GHz dual-core processor', RAM: '4 GB', GPU: 'NVIDIA GeForce 560', Storage: '16 GB', OS: 'Windows 10' }
            },
            screenshots: ['../assets/community/league-of-legends.jpg']
          },
          {
            name: 'Minecraft',
            tagline: 'Build. Craft. Survive.',
            category: 'Adventure',
            developer: 'Mojang Studios',
            publisher: 'Microsoft Studios',
            releaseDate: '2011-11-18',
            price: 26.95,
            image: 'https://wallpapers.com/images/featured/minecraft-s2kxfahyg30sob8q.jpg',
            description: 'A sandbox game where players can build, explore, and survive in procedurally generated worlds.',
            platforms: ['PC', 'PS4', 'PS5', 'Xbox One', 'Xbox Series X|S', 'Switch', 'Mobile'],
            rating: 9.0,
            features: ['Creative mode', 'Survival mode', 'Multiplayer', 'Mod support'],
            requirements: {
              minimum: { CPU: 'Intel Core i3-3210', RAM: '4 GB', GPU: 'Intel HD Graphics 4000', Storage: '4 GB', OS: 'Windows 10' },
              recommended: { CPU: 'Intel Core i5-4690', RAM: '8 GB', GPU: 'NVIDIA GeForce 700 Series', Storage: '4 GB', OS: 'Windows 10' }
            },
            screenshots: ['https://wallpapers.com/images/featured/minecraft-s2kxfahyg30sob8q.jpg']
          },
          {
            name: 'Counter-Strike 2',
            tagline: 'The next chapter in Counter-Strike',
            category: 'Tactical Shooter',
            developer: 'Valve Corporation',
            publisher: 'Valve Corporation',
            releaseDate: '2023-09-27',
            price: 0.00,
            image: 'https://cdn.akamai.steamstatic.com/steam/apps/730/header.jpg',
            description: 'The premier competitive FPS experience with tactical gameplay and precise shooting mechanics.',
            platforms: ['PC', 'Steam Deck'],
            rating: 8.9,
            features: ['5v5 competitive matches', 'Matchmaking', 'Workshop support', 'Anti-cheat system'],
            requirements: {
              minimum: { CPU: 'Intel Core 2 Duo E6600', RAM: '2 GB', GPU: 'DirectX 9.0c compatible', Storage: '15 GB', OS: 'Windows 10' },
              recommended: { CPU: 'Intel Core i3-4160', RAM: '4 GB', GPU: 'NVIDIA GTX 1060', Storage: '15 GB', OS: 'Windows 10' }
            },
            screenshots: ['https://cdn.akamai.steamstatic.com/steam/apps/730/header.jpg']
          },
          {
            name: 'The Witcher 3: Wild Hunt',
            tagline: 'Welcome to the world of The Witcher',
            category: 'RPG',
            developer: 'CD Projekt Red',
            publisher: 'CD Projekt',
            releaseDate: '2015-05-19',
            price: 39.99,
            image: 'https://cdn.akamai.steamstatic.com/steam/apps/292030/header.jpg',
            description: 'An open-world RPG following Geralt of Rivia in his quest to find Ciri and confront the Wild Hunt.',
            platforms: ['PC', 'PS4', 'PS5', 'Xbox One', 'Xbox Series X|S', 'Switch'],
            rating: 9.3,
            features: ['Open world exploration', 'Branching storylines', 'Character progression', 'Side quests'],
            requirements: {
              minimum: { CPU: 'Intel CPU Core i5-2500K', RAM: '6 GB', GPU: 'NVIDIA GeForce GTX 660', Storage: '50 GB', OS: 'Windows 7' },
              recommended: { CPU: 'Intel CPU Core i7-3770', RAM: '8 GB', GPU: 'NVIDIA GeForce GTX 1060', Storage: '50 GB', OS: 'Windows 10' }
            },
            screenshots: ['https://cdn.akamai.steamstatic.com/steam/apps/292030/header.jpg']
          },
          {
            name: 'Cyberpunk 2077',
            tagline: 'Welcome to the future',
            category: 'RPG',
            developer: 'CD Projekt Red',
            publisher: 'CD Projekt',
            releaseDate: '2020-12-10',
            price: 59.99,
            image: 'https://cdn.akamai.steamstatic.com/steam/apps/1091500/header.jpg',
            description: 'An open-world action-adventure story set in Night City, a megalopolis obsessed with power, glamour, and body modification.',
            platforms: ['PC', 'PS4', 'PS5', 'Xbox One', 'Xbox Series X|S', 'Stadia'],
            rating: 8.2,
            features: ['Open world', 'Character customization', 'Cybernetic enhancements', 'Multiple story paths'],
            requirements: {
              minimum: { CPU: 'Intel Core i5-3570K', RAM: '8 GB', GPU: 'NVIDIA GeForce GTX 780', Storage: '70 GB', OS: 'Windows 10' },
              recommended: { CPU: 'Intel Core i7-4790', RAM: '12 GB', GPU: 'NVIDIA GeForce GTX 1060', Storage: '70 GB', OS: 'Windows 10' }
            },
            screenshots: ['https://cdn.akamai.steamstatic.com/steam/apps/1091500/header.jpg']
          },
          {
            name: 'FIFA 24',
            tagline: 'Feel the game',
            category: 'Sports',
            developer: 'EA Sports',
            publisher: 'Electronic Arts',
            releaseDate: '2023-09-29',
            price: 69.99,
            image: 'https://i.gadgets360cdn.com/large/ea_sportf_fc_24_cover_1689079417754.jpg',
            description: 'The world\'s most popular football simulation game with realistic gameplay and updated rosters.',
            platforms: ['PC', 'PS4', 'PS5', 'Xbox One', 'Xbox Series X|S', 'Switch'],
            rating: 8.0,
            features: ['Ultimate Team', 'Career Mode', 'Volta Football', 'Online seasons'],
            requirements: {
              minimum: { CPU: 'Intel Core i5-6600K', RAM: '8 GB', GPU: 'NVIDIA GeForce GTX 1050 Ti', Storage: '100 GB', OS: 'Windows 10' },
              recommended: { CPU: 'Intel Core i7-9700K', RAM: '12 GB', GPU: 'NVIDIA GeForce GTX 1660', Storage: '100 GB', OS: 'Windows 10' }
            },
            screenshots: ['https://i.gadgets360cdn.com/large/ea_sportf_fc_24_cover_1689079417754.jpg']
          }
        ];

        const defaultProducts = [
          {
            name: 'Virtual Reality Smiled',
            category: 'VR BOX',
            price: 159.00,
            image: '../assets/gaming-products/1.jpg',
            description: 'High-quality VR headset for immersive gaming experiences with crystal clear visuals and comfortable design. Features advanced tracking technology and wide field of view for the ultimate virtual reality experience.',
            tagline: 'Step into another world',
            brand: 'GameZoid VR',
            model: 'VR-S2024',
            releaseDate: '2024-03-15',
            warranty: '2 Years Limited',
            rating: 4.5,
            features: [
              'Adjustable interpupillary distance (IPD)',
              'Anti-blue light lenses',
              'Compatible with 4.7-6.0 inch smartphones',
              'Comfortable padded headstrap',
              'Universal smartphone compatibility'
            ],
            specifications: {
              'Field of View': '110 degrees',
              'Lens Type': 'Aspheric optical lens',
              'Material': 'ABS + PC',
              'Weight': '320g',
              'Phone Compatibility': '4.7" - 6.0" smartphones',
              'Adjustable IPD': '58-70mm',
              'Focal Distance': 'Adjustable'
            }
          },
          {
            name: 'GameZoid Gaming Headphones',
            category: 'HEADPHONES',
            price: 89.99,
            image: '../assets/gaming-products/2.png',
            description: 'Professional gaming headphones engineered for competitive gaming with superior sound quality, active noise cancellation, and ultra-comfortable memory foam padding for extended gaming sessions.',
            tagline: 'Hear every detail, dominate every game',
            brand: 'GameZoid Audio',
            model: 'GZ-H7Pro',
            releaseDate: '2024-01-20',
            warranty: '3 Years Limited',
            rating: 4.7,
            features: [
              '7.1 Surround Sound',
              'Active Noise Cancellation',
              'Memory foam ear cushions',
              'Detachable microphone',
              'RGB lighting effects',
              'Multi-platform compatibility'
            ],
            specifications: {
              'Driver Size': '50mm Dynamic',
              'Frequency Response': '20Hz - 20kHz',
              'Impedance': '32Ω',
              'Sensitivity': '108dB',
              'Cable Length': '2m braided cable',
              'Microphone': 'Detachable boom mic',
              'Weight': '280g',
              'Connectivity': '3.5mm jack + USB'
            }
          },
          {
            name: 'Gears 5 Xbox Controller',
            category: 'CONTROLLER',
            price: 119.99,
            image: '../assets/gaming-products/3.jpg',
            description: 'Official Xbox Wireless Controller featuring the iconic Gears of War design with enhanced precision, customizable button mapping, and premium build quality for the ultimate gaming experience.',
            tagline: 'Gear up for victory',
            brand: 'Microsoft Xbox',
            model: 'Gears5-Limited',
            releaseDate: '2024-02-10',
            warranty: '1 Year Microsoft Limited',
            rating: 4.8,
            features: [
              'Textured grips',
              'Customizable button mapping',
              'Bluetooth wireless connectivity',
              'Share button for screenshots',
              'Hybrid D-pad',
              '40-hour battery life'
            ],
            specifications: {
              'Connectivity': 'Bluetooth 5.0 + 2.4GHz wireless',
              'Battery': 'AA batteries (40+ hours)',
              'Compatibility': 'Xbox Series X|S, Xbox One, PC, Mobile',
              'Weight': '287g',
              'Dimensions': '15.6 x 10.7 x 6.1 cm',
              'D-pad': 'Hybrid directional pad',
              'Triggers': 'Impulse triggers with haptic feedback'
            }
          },
          {
            name: 'GeForce RTX 4070 Super',
            category: 'GRAPHICS CARD',
            price: 629.99,
            image: '../assets/gaming-products/4.jpg',
            description: 'NVIDIA GeForce RTX 4070 Super graphics card delivers exceptional gaming performance with advanced ray tracing, DLSS 3, and AI-enhanced graphics for 1440p gaming and content creation.',
            tagline: 'Beyond fast. Beyond beautiful.',
            brand: 'NVIDIA GeForce',
            model: 'RTX 4070 Super',
            releaseDate: '2024-01-17',
            warranty: '3 Years NVIDIA Limited',
            rating: 4.9,
            features: [
              'Ada Lovelace Architecture',
              'Ray Tracing Cores (3rd Gen)',
              'DLSS 3 with Frame Generation',
              '12GB GDDR6X Memory',
              'AV1 Encoding',
              'NVIDIA Broadcast'
            ],
            specifications: {
              'GPU Memory': '12GB GDDR6X',
              'Memory Interface': '192-bit',
              'Base Clock': '1980 MHz',
              'Boost Clock': '2475 MHz',
              'CUDA Cores': '7168',
              'Memory Bandwidth': '504.2 GB/s',
              'Power Consumption': '220W',
              'Display Outputs': '3x DP 1.4a, 1x HDMI 2.1'
            }
          },
          {
            name: 'Mechanical Gaming Keyboard RGB',
            category: 'KEYBOARD',
            price: 129.99,
            image: '../assets/gaming-products/1.jpg',
            description: 'Premium mechanical gaming keyboard featuring Cherry MX Blue switches, per-key RGB lighting, and aircraft-grade aluminum construction. Designed for competitive gaming with anti-ghosting and programmable macros.',
            tagline: 'Type at the speed of thought',
            brand: 'GameZoid Mechanical',
            model: 'GZ-MK87Pro',
            releaseDate: '2024-04-05',
            warranty: '5 Years Mechanical Switch Warranty',
            rating: 4.6,
            features: [
              'Cherry MX Blue mechanical switches',
              'Per-key RGB backlighting',
              'Aluminum top plate',
              'Anti-ghosting (NKRO)',
              'Programmable macros',
              'Detachable USB-C cable'
            ],
            specifications: {
              'Switch Type': 'Cherry MX Blue',
              'Layout': '87-key (TKL)',
              'Actuation Force': '50g',
              'Key Travel': '4mm',
              'Polling Rate': '1000Hz',
              'Connection': 'USB-C to USB-A',
              'Dimensions': '36 x 12.7 x 3.5 cm',
              'Weight': '850g'
            }
          },
          {
            name: 'Pro Gaming Mouse 25000 DPI',
            category: 'MOUSE',
            price: 89.99,
            image: '../assets/gaming-products/2.png',
            description: 'Ultra-precision gaming mouse with flagship PixArt sensor offering 25,000 DPI, 650 IPS tracking, and customizable weight system. Perfect for competitive FPS and MOBA gaming.',
            tagline: 'Precision redefined',
            brand: 'GameZoid Precision',
            model: 'GZ-M25K',
            releaseDate: '2024-03-28',
            warranty: '2 Years Gaming Warranty',
            rating: 4.8,
            features: [
              'PixArt PAW3395 sensor',
              'Adjustable weight system',
              'Omron switches (20M clicks)',
              'RGB lighting zones',
              '8 programmable buttons',
              'Braided cable with paracord'
            ],
            specifications: {
              'Sensor': 'PixArt PAW3395',
              'DPI Range': '100-25,000 DPI',
              'Max Speed': '650 IPS',
              'Acceleration': '50G',
              'Polling Rate': '1000Hz',
              'Buttons': '8 programmable',
              'Weight': '69g (without weights)',
              'Cable': '2m paracord braided'
            }
          },
          {
            name: '27" Gaming Monitor 165Hz OLED',
            category: 'MONITOR',
            price: 699.99,
            image: '../assets/gaming-products/3.jpg',
            description: 'Premium 27-inch OLED gaming monitor with 165Hz refresh rate, 0.03ms response time, and HDR10 support. Features quantum dot technology and G-SYNC compatibility for tear-free gaming.',
            tagline: 'See the difference, feel the speed',
            brand: 'GameZoid Display',
            model: 'GZ-OLED27-165',
            releaseDate: '2024-05-12',
            warranty: '3 Years Premium Display Warranty',
            rating: 4.9,
            features: [
              'OLED Quantum Dot Display',
              'G-SYNC Compatible',
              'HDR10 & DisplayHDR 400',
              'Ultra-wide color gamut',
              'Blue light reduction',
              'Height adjustable stand'
            ],
            specifications: {
              'Panel Type': 'OLED Quantum Dot',
              'Size': '27 inches',
              'Resolution': '2560 x 1440 (QHD)',
              'Refresh Rate': '165Hz',
              'Response Time': '0.03ms GTG',
              'Color Gamut': '99% sRGB, 95% DCI-P3',
              'Brightness': '400 nits',
              'Contrast Ratio': '1,000,000:1',
              'Connectivity': '2x HDMI 2.1, 1x DP 1.4, USB-C'
            }
          },
          {
            name: 'Wireless Pro Controller Elite',
            category: 'CONTROLLER',
            price: 179.99,
            image: '../assets/gaming-products/4.jpg',
            description: 'Premium wireless pro controller with Hall Effect magnetic joysticks, back paddles, trigger stops, and 40-hour battery life. Features customizable profiles and tournament-grade build quality.',
            tagline: 'Elite performance, wireless freedom',
            brand: 'GameZoid Pro',
            model: 'GZ-Elite-Pro',
            releaseDate: '2024-06-01',
            warranty: '2 Years Pro Gaming Warranty',
            rating: 4.7,
            features: [
              'Hall Effect magnetic joysticks',
              'Hair trigger locks',
              '4 back paddles',
              'Customizable button profiles',
              'Pro-grade D-pad',
              'Wireless charging dock included'
            ],
            specifications: {
              'Connectivity': 'Bluetooth 5.2 + 2.4GHz wireless',
              'Battery Life': '40+ hours',
              'Charging': 'USB-C + Wireless dock',
              'Weight': '310g',
              'Compatibility': 'PC, PlayStation, Xbox, Switch, Mobile',
              'Latency': '<1ms (2.4GHz mode)',
              'Customization': '256 profile combinations'
            }
          }
        ];

        for (const game of defaultGames) {
          await gameDB.addGame(game);
        }

        for (const product of defaultProducts) {
          await gameDB.addProduct(product);
        }

        showMessage('Default data populated successfully!', 'success');
        await loadGames();
        await loadProducts();
        await refreshStats();
      } catch (error) {
        console.error('Error populating default data:', error);
        showMessage('Error populating default data', 'error');
      }
    }
  );
}

function showMessage(message, type = 'info') {
  const existingMessages = document.querySelectorAll('.message');
  existingMessages.forEach(msg => msg.remove());

  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${type}`;
  messageDiv.innerHTML = `
    <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
    ${message}
  `;

  const adminContainer = document.querySelector('.admin-container');
  adminContainer.insertBefore(messageDiv, adminContainer.firstChild);

  setTimeout(() => {
    messageDiv.remove();
  }, 5000);
}

function parseKeyValueText(text) {
  const lines = (text || '').split('\n').map(l => l.trim()).filter(Boolean);
  const out = {};
  lines.forEach(line => {
    const idx = line.indexOf(':');
    if (idx > -1) {
      const key = line.slice(0, idx).trim();
      const val = line.slice(idx + 1).trim();
      if (key) out[key] = val;
    }
  });
  return out;
}

function stringifyKeyValue(obj) {
  return Object.keys(obj || {}).map(k => `${k}: ${obj[k]}`).join('\n');
}

function showConfirmModal(title, message, onConfirm) {
  document.getElementById('confirmMessage').textContent = message;
  document.getElementById('confirmModal').style.display = 'block';
  
  const confirmButton = document.getElementById('confirmButton');
  const newConfirmButton = confirmButton.cloneNode(true);
  confirmButton.parentNode.replaceChild(newConfirmButton, confirmButton);
  
  newConfirmButton.addEventListener('click', () => {
    closeModal('confirmModal');
    onConfirm();
  });
}

window.addEventListener('click', (event) => {
  const modals = document.querySelectorAll('.modal');
  modals.forEach(modal => {
    if (event.target === modal) {
      modal.style.display = 'none';
    }
  });
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
      if (modal.style.display === 'block') {
        modal.style.display = 'none';
      }
    });
  }
});
