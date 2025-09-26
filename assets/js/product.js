function accountRoute() {
  const currentUser = sessionStorage.getItem('currentUser') || localStorage.getItem('currentUser');
  
  if (currentUser) {
    window.location.href = './account.html';
  } else {
    window.location.href = './login.html';
  }
}

class ProductPageDB {
  constructor() {
    this.dbName = "GameZoidDB";
    this.dbVersion = 1;
    this.db = null;
    this.init();
  }
  async init() {
    return new Promise((resolve, reject) => {
      const r = indexedDB.open(this.dbName, this.dbVersion);
      r.onerror = () => {
        reject(r.error);
      };
      r.onsuccess = () => {
        this.db = r.result;
        resolve();
      };
      r.onupgradeneeded = (e) => {};
    });
  }
  async getProductById(id) {
    if (!this.db) return null;
    const t = this.db.transaction(["products"], "readonly");
    const s = t.objectStore("products");
    return new Promise((resolve, reject) => {
      const req = s.get(Number(id));
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
}

let productDB;
let currentUser = null;
let userDB = null;

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
          wishlistStore.createIndex('productId', 'productId', { unique: false });
        }
      };
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

  async checkWishlistItem(userEmail, productId) {
    const transaction = this.db.transaction(['wishlist'], 'readonly');
    const store = transaction.objectStore('wishlist');
    const index = store.index('userEmail');
    return new Promise((resolve, reject) => {
      const request = index.getAll(userEmail);
      request.onsuccess = () => {
        const items = request.result.filter(item => item.productId === productId);
        resolve(items.length > 0);
      };
      request.onerror = () => reject(request.error);
    });
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  try {
    currentUser = getCurrentUser();
    updateUserInterface();
  } catch (e) {
    console.error("Error loading user:", e);
  }

  try {
    productDB = new ProductPageDB();
    await productDB.init();
    
    userDB = new UserDatabase();
    await userDB.init();
    await loadProduct();
  } catch (e) {
    console.error("Failed to initialize databases or load product:", e);
    fallback("Failed to load product - Database connection issue");
  }
});

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

function updateUserInterface() {
  if (currentUser) {
    const buyButton = document.getElementById("buy-now");
    if (buyButton) {
      buyButton.innerHTML = `<i class="fas fa-shopping-cart"></i> Add to Cart`;
    }
  } else {
    const buyButton = document.getElementById("buy-now");
    if (buyButton) {
      buyButton.innerHTML = `<i class="fas fa-shopping-cart"></i> Login to Purchase`;
    }
  }
}

function getParam(name) {
  const u = new URL(window.location.href);
  return u.searchParams.get(name);
}

async function loadProduct() {
  const id = getParam("id");
  if (!id) {
    fallback("No product specified");
    return;
  }
  let data = null;
  try {
    data = await productDB.getProductById(id);
  } catch (e) {}
  if (!data) {
    const cache = JSON.parse(
      sessionStorage.getItem("checkoutItemsDetails") || "[]"
    );
    const guess = cache.find((x) => String(x.id) === String(id));
    if (guess) {
      data = guess;
    }
  }
  if (!data) {
    fallback("Product not found");
    return;
  }
  renderProduct(data);
}

function renderProduct(p) {
  document.getElementById("product-title").textContent = p.name || "Unknown";
  document.getElementById("product-tagline").textContent = p.tagline || p.description?.substring(0, 100) + "..." || "";
  document.getElementById("product-cover").src = p.image || "";
  document.getElementById("product-description").textContent =
    p.description || "No description available";
  
  setText("brand", p.brand || p.manufacturer || "Unknown");
  setText("model", p.model || p.name || "Unknown");
  setText("releaseDate", p.releaseDate || "-");
  setText("category", p.category || "-");
  setText("warranty", p.warranty || "1 Year Limited" || "-");
  setText("rating", p.rating ? `${p.rating}/5` : "-");
  
  document.getElementById("price").textContent = `$${Number(
    p.price || 0
  ).toFixed(2)}`;
  
  const feats = Array.isArray(p.features) ? p.features : 
    p.keyFeatures ? p.keyFeatures : 
    p.specifications ? Object.keys(p.specifications).slice(0, 5) : [];
  document.getElementById("product-features").innerHTML = feats
    .map((i) => `<li><i class="fas fa-check"></i><span>${i}</span></li>`)
    .join("");
  
  const specs = p.specifications || {};
  const specKeys = Object.keys(specs);
  const halfPoint = Math.ceil(specKeys.length / 2);
  
  document.getElementById("product-specs").innerHTML = specKeys
    .slice(0, halfPoint)
    .map((k) => `<li><strong>${k}:</strong> ${specs[k]}</li>`)
    .join("");
    
  document.getElementById("product-compatibility").innerHTML = specKeys
    .slice(halfPoint)
    .map((k) => `<li><strong>${k}:</strong> ${specs[k]}</li>`)
    .join("");
  
  bindActions(p);
}

function setText(id, txt) {
  const el = document.getElementById(id);
  if (el) el.textContent = txt;
}

function bindActions(p) {
  const add = () => {
    if (!currentUser) {
      alert(`Please log in to add ${p.name} to your cart`);
      window.location.href = "./login.html";
      return;
    }
    
    let cart = JSON.parse(localStorage.getItem("cart") || "[]");
    if (cart.find((i) => i.id === p.id && i.type === "product")) {
      alert(`${p.name} is already in your cart!`);
      return;
    }
    
    const cartItem = { 
      id: p.id, 
      type: "product", 
      addedAt: new Date().toISOString(),
      addedBy: currentUser.email,
      productName: p.name,
      productPrice: p.price
    };
    
    cart.push(cartItem);
    localStorage.setItem("cart", JSON.stringify(cart));
    
    alert(`${p.name} has been added to your cart!`);
    
    window.location.href = "./cart.html";
  };
  
  document.getElementById("buy-now").addEventListener("click", add);
  
  const wishlistBtn = document.getElementById("wishlist");
  if (wishlistBtn) {
    wishlistBtn.addEventListener("click", async () => {
      if (!currentUser) {
        alert("Please log in to add items to your wishlist");
        window.location.href = "./login.html";
        return;
      }
      
      if (!userDB) {
        alert("Database not initialized. Please refresh the page.");
        return;
      }
      
      try {
        const alreadyInWishlist = await userDB.checkWishlistItem(currentUser.email, p.id);
        if (alreadyInWishlist) {
          alert(`${p.name} is already in your wishlist!`);
          return;
        }
        
        const wishlistItem = {
          userEmail: currentUser.email,
          productId: p.id,
          productName: p.name,
          productPrice: p.price,
          addedAt: new Date().toISOString()
        };
        
        await userDB.addToWishlist(wishlistItem);
        alert(`${p.name} has been added to your wishlist!`);
        
      } catch (error) {
        console.error('Error adding to wishlist:', error);
        alert('Error adding to wishlist. Please try again.');
      }
    });
  }
}

function fallback(msg) {
  document.getElementById("product-title").textContent = "Product";
  document.getElementById("product-description").textContent =
    msg || "Unable to load product";
}