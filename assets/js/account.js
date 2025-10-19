function accountRoute() {
  const currentUser = sessionStorage.getItem('currentUser') || localStorage.getItem('currentUser');
  
  if (currentUser) {
    window.location.href = './account.html';
  } else {
    window.location.href = './login.html';
  }
}

let userDB;
let currentUser = null;

async function initializeDatabase() {
  try {
    if (window.storageAPI && typeof window.storageAPI.init === 'function') {
      await window.storageAPI.init();
    }
    
    userDB = window.storageAPI;
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
