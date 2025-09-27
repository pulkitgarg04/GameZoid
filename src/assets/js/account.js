function accountRoute() {
  const currentUser = sessionStorage.getItem('currentUser') || localStorage.getItem('currentUser');
  
  if (currentUser) {
    window.location.href = './account.html';
  } else {
    window.location.href = './login.html';
  }
}

class UserDatabase {
  constructor() {
    this.dbName = 'GameZoidUserDB';
    this.dbVersion = 1;
    this.db = null;
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        console.error('User database failed to open');
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        if (!db.objectStoreNames.contains('users')) {
          const usersStore = db.createObjectStore('users', { keyPath: 'email' });
          usersStore.createIndex('name', 'name', { unique: false });
        }

        if (!db.objectStoreNames.contains('wishlist')) {
          const wishlistStore = db.createObjectStore('wishlist', { keyPath: 'id', autoIncrement: true });
          wishlistStore.createIndex('userEmail', 'userEmail', { unique: false });
          wishlistStore.createIndex('gameId', 'gameId', { unique: false });
        }
      };
    });
  }

  async getUserByEmail(email) {
    const transaction = this.db.transaction(['users'], 'readonly');
    const store = transaction.objectStore('users');
    return new Promise((resolve, reject) => {
      const request = store.get(email);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async addUser(user) {
    const transaction = this.db.transaction(['users'], 'readwrite');
    const store = transaction.objectStore('users');
    return new Promise((resolve, reject) => {
      const request = store.add(user);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getUserWishlist(userEmail) {
    const transaction = this.db.transaction(['wishlist'], 'readonly');
    const store = transaction.objectStore('wishlist');
    const index = store.index('userEmail');
    return new Promise((resolve, reject) => {
      const request = index.getAll(userEmail);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async addToWishlist(wishlistItem) {
    const transaction = this.db.transaction(['wishlist'], 'readwrite');
    const store = transaction.objectStore('wishlist');
    return new Promise((resolve, reject) => {
      const request = store.add(wishlistItem);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async removeFromWishlist(wishlistId) {
    const transaction = this.db.transaction(['wishlist'], 'readwrite');
    const store = transaction.objectStore('wishlist');
    return new Promise((resolve, reject) => {
      const request = store.delete(wishlistId);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async removeFromWishlistByGameId(userEmail, gameId) {
    const transaction = this.db.transaction(['wishlist'], 'readwrite');
    const store = transaction.objectStore('wishlist');
    const index = store.index('userEmail');
    return new Promise((resolve, reject) => {
      const request = index.getAll(userEmail);
      request.onsuccess = () => {
        const items = request.result.filter(item => item.gameId === gameId);
        if (items.length > 0) {
          const deleteTransaction = this.db.transaction(['wishlist'], 'readwrite');
          const deleteStore = deleteTransaction.objectStore('wishlist');
          const deleteRequest = deleteStore.delete(items[0].id);
          deleteRequest.onsuccess = () => resolve(true);
          deleteRequest.onerror = () => reject(deleteRequest.error);
        } else {
          resolve(false);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }
}

let userDB;
let currentUser = null;

async function initializeDatabase() {
  try {
    userDB = new UserDatabase();
    await userDB.init();
  } catch (error) {
    console.error('Failed to initialize user database:', error);
  }
}

function getCurrentUser() {

  let user = sessionStorage.getItem('currentUser');
  if (user) {
    try {
      return JSON.parse(user);
    } catch (e) {
      console.error('Error parsing current user from sessionStorage:', e);
      sessionStorage.removeItem('currentUser');
    }
  }


  user = localStorage.getItem('currentUser');
  if (user) {
    try {
      const parsedUser = JSON.parse(user);

      sessionStorage.setItem('currentUser', user);
      localStorage.removeItem('currentUser');
      return parsedUser;
    } catch (e) {
      console.error('Error parsing current user from localStorage:', e);
      localStorage.removeItem('currentUser');
    }
  }

  return null;
}

async function getUserInfo() {
  currentUser = getCurrentUser();

  if (currentUser) {
    document.getElementById('name').innerHTML = currentUser.name;
    document.getElementById('email').innerHTML = currentUser.email;
    

    await loadWishlist();
  } else {
    alert('You need to login to access this page!');
    window.location.href = './login.html';
  }
}

async function loadWishlist() {
  if (!userDB || !currentUser) return;

  try {
    const wishlist = await userDB.getUserWishlist(currentUser.email);
    
    const wishlistEmpty = document.getElementById('wishlist-empty');
    const wishlistItems = document.getElementById('wishlist-items');
    
    if (wishlist.length === 0) {
      wishlistEmpty.style.display = 'block';
      wishlistItems.innerHTML = '';
    } else {
      wishlistEmpty.style.display = 'none';
      wishlistItems.innerHTML = wishlist.map(item => `
        <div class="wishlist-item" data-id="${item.id}">
          <div class="wishlist-item-info">
            <h3>${item.gameName}</h3>
            <p class="price">$${item.gamePrice.toFixed(2)}</p>
            <p class="added-date">Added: ${new Date(item.addedAt).toLocaleDateString()}</p>
          </div>
          <div class="wishlist-item-actions">
            <button class="move-to-cart-btn" onclick="moveToCart(${item.gameId}, '${item.gameName}', ${item.gamePrice}, ${item.id})">
              <i class="fas fa-shopping-cart"></i> Move to Cart
            </button>
            <button class="remove-from-wishlist-btn" onclick="removeFromWishlist(${item.id}, '${item.gameName}')">
              <i class="fas fa-trash"></i> Remove
            </button>
          </div>
        </div>
      `).join('');
    }
  } catch (error) {
    console.error('Error loading wishlist:', error);
    document.getElementById('wishlist-empty').style.display = 'block';
    document.getElementById('wishlist-items').innerHTML = '';
  }
}

async function moveToCart(gameId, gameName, gamePrice, wishlistId) {
  if (!currentUser) return;

  let cart = JSON.parse(localStorage.getItem('cart') || '[]');
  

  if (cart.find(item => item.id === gameId && item.type === 'game')) {
    alert(`${gameName} is already in your cart!`);
    return;
  }
  

  const cartItem = {
    id: gameId,
    type: 'game',
    addedAt: new Date().toISOString(),
    addedBy: currentUser.email,
    gameName: gameName,
    gamePrice: gamePrice
  };
  
  cart.push(cartItem);
  localStorage.setItem('cart', JSON.stringify(cart));
  

  try {
    await userDB.removeFromWishlist(wishlistId);
    alert(`${gameName} has been moved to your cart!`);
    await loadWishlist(); 
  } catch (error) {
    console.error('Error removing from wishlist:', error);
    alert('Error moving item to cart. Please try again.');
  }
}

async function removeFromWishlist(wishlistId, gameName) {
  try {
    await userDB.removeFromWishlist(wishlistId);
    alert(`${gameName} has been removed from your wishlist.`);
    await loadWishlist(); 
  } catch (error) {
    console.error('Error removing from wishlist:', error);
    alert('Error removing item from wishlist. Please try again.');
  }
}

function logout() {

  sessionStorage.removeItem('currentUser');
  localStorage.removeItem('currentUser');
  localStorage.removeItem('cart'); 
  alert('You have been logged out!');
  window.location.href = './login.html';
}


document.addEventListener('DOMContentLoaded', async () => {
  await initializeDatabase();
  await getUserInfo();
});
