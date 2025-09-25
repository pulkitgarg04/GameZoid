function accountRoute() {
  const currentUser = sessionStorage.getItem('currentUser') || localStorage.getItem('currentUser');
  
  if (currentUser) {
    window.location.href = './account.html';
  } else {
    window.location.href = './login.html';
  }
}

class CartDatabase {
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
        console.log('Cart database opened successfully');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
      };
    });
  }

  async getGameById(id) {
    if (!this.db) return null;
    const transaction = this.db.transaction(['games'], 'readonly');
    const store = transaction.objectStore('games');
    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getProductById(id) {
    if (!this.db) return null;
    const transaction = this.db.transaction(['products'], 'readonly');
    const store = transaction.objectStore('products');
    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
}

let cartDB;

document.addEventListener('DOMContentLoaded', async () => {
  try {
    cartDB = new CartDatabase();
    await cartDB.init();
    await loadCart();
  } catch (error) {
    console.error('Failed to initialize cart database:', error);
    showEmptyCart();
  }
});

async function loadCart() {
  try {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    if (cart.length === 0) {
      showEmptyCart();
      return;
    }

    const cartItems = [];
    for (const cartItem of cart) {
      let item = null;
      if (cartItem.type === 'game') {
        item = await cartDB.getGameById(cartItem.id);
      } else if (cartItem.type === 'product') {
        item = await cartDB.getProductById(cartItem.id);
      }
      
      if (item) {
        cartItems.push({
          ...item,
          cartId: cartItem.id,
          type: cartItem.type,
          addedAt: cartItem.addedAt
        });
      }
    }

    displayCartItems(cartItems);
    updateCartSummary(cartItems);
  } catch (error) {
    console.error('Error loading cart:', error);
    showEmptyCart();
  }
}

function displayCartItems(items) {
  const cartItemsContainer = document.getElementById('cart-items');
  const emptyCart = document.getElementById('empty-cart');
  const cartSummary = document.getElementById('cart-summary');

  if (items.length === 0) {
    showEmptyCart();
    return;
  }

  cartItemsContainer.style.display = 'block';
  emptyCart.style.display = 'none';
  cartSummary.style.display = 'block';

  cartItemsContainer.innerHTML = items.map(item => `
    <div class="cart-item" data-cart-id="${item.cartId}" data-type="${item.type}">
      <img src="${item.image}" alt="${item.name}" class="item-image" onerror="this.src='../assets/media/favicon.png'">
      <div class="item-details">
        <h3 class="item-name">${item.name}</h3>
        <div class="item-category">${item.category}</div>
        <div class="item-price">$${item.price}</div>
      </div>
      <div class="item-controls">
        <div class="quantity-controls">
          <button class="quantity-btn" onclick="updateQuantity('${item.cartId}', '${item.type}', ${item.quantity - 1})">
            <i class="fas fa-minus"></i>
          </button>
          <input type="number" class="quantity-input" value="${item.quantity}" min="1" max="99" 
                 onchange="updateQuantity('${item.cartId}', '${item.type}', parseInt(this.value))">
          <button class="quantity-btn" onclick="updateQuantity('${item.cartId}', '${item.type}', ${item.quantity + 1})">
            <i class="fas fa-plus"></i>
          </button>
        </div>
        <button class="remove-btn" onclick="removeFromCart('${item.cartId}', '${item.type}')">
          <i class="fas fa-trash"></i> Remove
        </button>
      </div>
    </div>
  `).join('');
}

function removeFromCart(cartId, type) {
  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  const itemToRemove = cart.find(item => item.id === cartId && item.type === type);
  
  if (itemToRemove && confirm(`Remove ${itemToRemove.name || 'this item'} from cart?`)) {
    const updatedCart = cart.filter(item => !(item.id === cartId && item.type === type));
    localStorage.setItem('cart', JSON.stringify(updatedCart));
    
    showCartMessage('Item removed from cart', 'info');
    loadCart();
  }
}


function clearCart() {
  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  if (cart.length === 0) {
    showCartMessage('Cart is already empty', 'info');
    return;
  }
  
  if (confirm(`Are you sure you want to clear all ${cart.length} items from your cart?`)) {
    localStorage.removeItem('cart');
    showCartMessage('Cart cleared successfully', 'success');
    showEmptyCart();
  }
}

function showEmptyCart() {
  const cartItemsContainer = document.getElementById('cart-items');
  const emptyCart = document.getElementById('empty-cart');
  const cartSummary = document.getElementById('cart-summary');

  cartItemsContainer.style.display = 'none';
  emptyCart.style.display = 'block';
  cartSummary.style.display = 'none';
}

function updateCartSummary(items) {
  const subtotal = items.reduce((sum, item) => sum + item.price, 0);
  const total = subtotal;

  document.getElementById('subtotal').textContent = `$${subtotal.toFixed(2)}`;
  document.getElementById('total').textContent = `$${total.toFixed(2)}`;
}

function continueShopping() {
  window.location.href = './store.html';
}

function proceedToCheckout() {
  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  
  if (cart.length === 0) {
    showCartMessage('Your cart is empty', 'error');
    return;
  }

  window.location.href = './checkout.html';
}

function showCartMessage(message, type) {
  const existingMessages = document.querySelectorAll('.cart-message');
  existingMessages.forEach(msg => msg.remove());

  const messageDiv = document.createElement('div');
  messageDiv.className = `cart-message ${type}`;
  messageDiv.innerHTML = `
    <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
    ${message}
  `;

  const cartContent = document.querySelector('#cart-content');
  cartContent.insertBefore(messageDiv, cartContent.firstChild);

  setTimeout(() => {
    messageDiv.remove();
  }, 3000);
}

const cartMessageStyles = `
  .cart-message {
    position: fixed;
    top: 100px;
    right: 20px;
    background: rgba(0, 0, 0, 0.9);
    border: 1px solid var(--color);
    color: var(--color);
    padding: 15px 20px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    gap: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 1px;
    z-index: 1000;
    animation: slideInRight 0.3s ease;
  }

  .cart-message.success {
    border-color: #28a745;
    color: #28a745;
  }

  .cart-message.error {
    border-color: #dc3545;
    color: #dc3545;
  }

  .cart-message.info {
    border-color: var(--color);
    color: var(--color);
  }

  @keyframes slideInRight {
    from {
      opacity: 0;
      transform: translateX(100%);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
`;

function getCartItemCount() {
  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  return cart.length;
}

function displayCartItems(items) {
  const cartItemsContainer = document.getElementById('cart-items');
  const emptyCart = document.getElementById('empty-cart');
  const cartSummary = document.getElementById('cart-summary');

  if (items.length === 0) {
    showEmptyCart();
    return;
  }

  cartItemsContainer.style.display = 'block';
  emptyCart.style.display = 'none';
  cartSummary.style.display = 'block';

  cartItemsContainer.innerHTML = `
    <div class="cart-controls">
      <div class="cart-stats">
        <span>Total Items: ${items.length}</span>
        <span>Total Value: $${items.reduce((sum, item) => sum + item.price, 0).toFixed(2)}</span>
      </div>
    </div>
  ` + items.map(item => `
    <div class="cart-item" data-cart-id="${item.cartId}" data-type="${item.type}">
      <img src="${item.image}" alt="${item.name}" class="item-image" onerror="this.src='../assets/media/favicon.png'">
      <div class="item-details">
        <h3 class="item-name">${item.name}</h3>
        <div class="item-category">${item.category}</div>
        <div class="item-price">$${item.price}</div>
      </div>
      <div class="item-controls">
        <button class="remove-btn" onclick="removeFromCart('${item.cartId}', '${item.type}')">
          <i class="fas fa-trash"></i> Remove
        </button>
      </div>
    </div>
  `).join('');
}

const styleSheet = document.createElement('style');
styleSheet.textContent = cartMessageStyles + `
  .cart-controls {
    background: rgba(0, 0, 0, 0.8);
    border: 1px solid rgba(255, 187, 0, 0.3);
    border-radius: 12px;
    padding: 1rem;
    margin-bottom: 1rem;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-wrap: wrap;
    gap: 1rem;
  }

  .cart-stats {
    display: flex;
    gap: 1rem;
    color: var(--color);
    font-weight: 600;
  }

  @media (max-width: 768px) {
    .cart-controls {
      flex-direction: column;
      text-align: center;
    }
    
    .cart-stats {
      justify-content: center;
    }
  }
`;
document.head.appendChild(styleSheet);
