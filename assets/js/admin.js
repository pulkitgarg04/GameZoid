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
}

function showAddProductModal() {
  document.getElementById('addProductModal').style.display = 'block';
  document.getElementById('addProductForm').reset();
}

function closeModal(modalId) {
  document.getElementById(modalId).style.display = 'none';
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
            features: ['Hero shooter gameplay', 'Team-based tactics', 'Unique abilities'],
            requirements: {
              minimum: { CPU: 'Intel Core i3-6300', RAM: '6 GB', GPU: 'NVIDIA GeForce GT 640', Storage: '56 GB', OS: 'Windows 10' },
              recommended: { CPU: 'Intel i5 3570K', RAM: '8 GB', GPU: 'NVIDIA GeForce GTX 970', Storage: '56 GB', OS: 'Windows 10' }
            },
            screenshots: []
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
            features: ['Open-world exploration', 'Multiple protagonists', 'Online mode'],
            requirements: {
              minimum: { CPU: 'Intel Core 2 Quad Q6600', RAM: '4 GB', GPU: 'NVIDIA 9800 GT', Storage: '110 GB', OS: 'Windows 10' },
              recommended: { CPU: 'Intel Core i5 3470', RAM: '8 GB', GPU: 'NVIDIA GTX 660', Storage: '110 GB', OS: 'Windows 10' }
            },
            screenshots: []
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
            platforms: ['Mobile'],
            rating: 7.9,
            features: ['Realistic ballistics', 'Large maps', 'Team play'],
            requirements: { minimum: {}, recommended: {} },
            screenshots: []
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
            features: ['5v5 tactical gameplay', 'Agent abilities', 'Competitive modes'],
            requirements: {
              minimum: { CPU: 'Intel i3-370M', RAM: '4 GB', GPU: 'Intel HD 3000', Storage: '10 GB', OS: 'Windows 10' },
              recommended: { CPU: 'Intel i3-4150', RAM: '4 GB', GPU: 'NVIDIA GT 730', Storage: '10 GB', OS: 'Windows 10' }
            },
            screenshots: []
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
            platforms: ['PC', 'PS4', 'Xbox One'],
            rating: 8.1,
            features: ['Cinematic campaign', 'Multiplayer', 'Co-op'],
            requirements: { minimum: {}, recommended: {} },
            screenshots: []
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
            platforms: ['Mobile'],
            rating: 8.0,
            features: ['Clan wars', 'Base building', 'PvP'],
            requirements: { minimum: {}, recommended: {} },
            screenshots: []
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
            description: 'A series of action-adventure games created by Hideki Kamiya.',
            platforms: ['PC', 'PS4', 'Xbox One'],
            rating: 8.6,
            features: ['Combo-heavy combat', 'Multiple characters', 'High replayability'],
            requirements: { minimum: {}, recommended: {} },
            screenshots: []
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
            description: 'A video game franchise created by Jordan Mechner, originally developed by Broderbund.',
            platforms: ['PC', 'PS3', 'Xbox 360'],
            rating: 8.0,
            features: ['Acrobatic platforming', 'Time manipulation', 'Adventure'],
            requirements: { minimum: {}, recommended: {} },
            screenshots: []
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
            description: 'A free-to-play battle royale game developed and published by Epic Games.',
            platforms: ['PC', 'PS4', 'PS5', 'Xbox One', 'Xbox Series X|S', 'Switch', 'Mobile'],
            rating: 8.3,
            features: ['Building mechanics', 'Cross-platform', 'Seasonal content'],
            requirements: { minimum: {}, recommended: {} },
            screenshots: []
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
            description: 'A multiplayer online battle arena video game developed and published by Riot Games.',
            platforms: ['PC'],
            rating: 8.8,
            features: ['5v5 MOBA', 'Esports', 'Large roster'],
            requirements: { minimum: {}, recommended: {} },
            screenshots: []
          }
        ];

        const defaultProducts = [
          {
            name: 'Virtual Reality Smiled',
            category: 'VR BOX',
            price: 159.00,
            image: '../assets/gaming-products/1.jpg',
            description: 'High-quality VR headset for immersive gaming experiences.'
          },
          {
            name: 'GameZoid Gaming Headphones',
            category: 'HEADPHONES',
            price: 39.00,
            image: '../assets/gaming-products/2.png',
            description: 'Professional gaming headphones with superior sound quality.'
          },
          {
            name: 'Gears 5 Xbox Controller',
            category: 'X-BOX',
            price: 99.00,
            image: '../assets/gaming-products/3.jpg',
            description: 'Official Xbox controller with enhanced features for gaming.'
          },
          {
            name: 'GeForce RTX 2070',
            category: 'GRAPHICS',
            price: 529.00,
            image: '../assets/gaming-products/4.jpg',
            description: 'High-performance graphics card for gaming and content creation.'
          }
        ];

        // Add games
        for (const game of defaultGames) {
          await gameDB.addGame(game);
        }

        // Add products
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
