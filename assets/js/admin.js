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
    category: document.getElementById('gameCategory').value,
    price: parseFloat(document.getElementById('gamePrice').value),
    image: document.getElementById('gameImage').value,
    description: document.getElementById('gameDescription').value
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
      document.getElementById('editPrice').value = game.price;
      document.getElementById('editImage').value = game.image;
      document.getElementById('editDescription').value = game.description || '';
      
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
    description: document.getElementById('editDescription').value
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
            category: 'Battle Royale',
            price: 72.00,
            image: '../assets/community/apex-legends.jpg',
            description: 'A free-to-play battle royale game where legends battle for glory, fame, and fortune.'
          },
          {
            name: 'Grand Theft Auto V',
            category: 'Open World',
            price: 95.00,
            image: '../assets/community/gta-v.jpg',
            description: 'An action-adventure game set in the fictional state of San Andreas.'
          },
          {
            name: 'PUBG (BGMI) - India',
            category: 'Battle Royale',
            price: 15.00,
            image: '../assets/community/pubg.jpg',
            description: 'PlayerUnknown\'s Battlegrounds - Battle royale game for mobile devices.'
          },
          {
            name: 'Valorant',
            category: 'Tactical Shooter',
            price: 26.00,
            image: '../assets/community/valorant.webp',
            description: 'A free-to-play first-person tactical hero shooter developed by Riot Games.'
          },
          {
            name: 'Call Of Duty',
            category: 'Action',
            price: 45.00,
            image: '../assets/community/call-of-duty.webp',
            description: 'A first-person shooter video game franchise published by Activision.'
          },
          {
            name: 'Clash Of Clans',
            category: 'Base-Building',
            price: 30.00,
            image: '../assets/community/clash-of-clans.webp',
            description: 'A freemium mobile strategy video game developed and published by Supercell.'
          },
          {
            name: 'Devil May Cry',
            category: 'Hack and Slash',
            price: 55.00,
            image: '../assets/community/devil-may-cry.jpg',
            description: 'A series of action-adventure games created by Hideki Kamiya.'
          },
          {
            name: 'Prince Of Persia',
            category: 'Platformer',
            price: 74.00,
            image: '../assets/community/price-of-persia.jpg',
            description: 'A video game franchise created by Jordan Mechner, originally developed by Broderbund.'
          },
          {
            name: 'Fortnite',
            category: 'Battle Royale',
            price: 0.00,
            image: '../assets/community/fortnite.jpg',
            description: 'A free-to-play battle royale game developed and published by Epic Games.'
          },
          {
            name: 'League of Legends',
            category: 'Strategy',
            price: 0.00,
            image: '../assets/community/league-of-legends.jpg',
            description: 'A multiplayer online battle arena video game developed and published by Riot Games.'
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
