function accountRoute() {
  const currentUser = sessionStorage.getItem('currentUser') || localStorage.getItem('currentUser');
  
  if (currentUser) {
    window.location.href = './account.html';
  } else {
    window.location.href = './login.html';
  }
}

class GamePageDB {
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
  async getGameById(id) {
    if (!this.db) return null;
    const t = this.db.transaction(["games"], "readonly");
    const s = t.objectStore("games");
    return new Promise((resolve, reject) => {
      const req = s.get(Number(id));
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
}

let gameDB;
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
        console.log('User database opened successfully');
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

  async addToWishlist(wishlistItem) {
    const transaction = this.db.transaction(['wishlist'], 'readwrite');
    const store = transaction.objectStore('wishlist');
    return new Promise((resolve, reject) => {
      const request = store.add(wishlistItem);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async checkWishlistItem(userEmail, gameId) {
    const transaction = this.db.transaction(['wishlist'], 'readonly');
    const store = transaction.objectStore('wishlist');
    const index = store.index('userEmail');
    return new Promise((resolve, reject) => {
      const request = index.getAll(userEmail);
      request.onsuccess = () => {
        const items = request.result.filter(item => item.gameId === gameId);
        resolve(items.length > 0);
      };
      request.onerror = () => reject(request.error);
    });
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  try {
    currentUser = getCurrentUser();
    console.log("Current user:", currentUser);
    updateUserInterface();
  } catch (e) {
    console.error("Error loading user:", e);
  }

  try {
    gameDB = new GamePageDB();
    await gameDB.init();
    
    userDB = new UserDatabase();
    await userDB.init();
    
    console.log("Databases initialized successfully");
    await loadGame();
  } catch (e) {
    console.error("Failed to initialize databases or load game:", e);
    fallback("Failed to load game - Database connection issue");
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
    console.log(`Welcome ${currentUser.name}! User is logged in.`);
    const buyButton = document.getElementById("buy-now");
    if (buyButton) {
      buyButton.innerHTML = `<i class="fas fa-shopping-cart"></i> Add to Cart`;
    }
  } else {
    console.log("No user logged in");
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
async function loadGame() {
  const id = getParam("id");
  if (!id) {
    fallback("No game specified");
    return;
  }
  let data = null;
  try {
    data = await gameDB.getGameById(id);
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
    fallback("Game not found");
    return;
  }
  renderGame(data);
}
function renderGame(g) {
  document.getElementById("game-title").textContent = g.name || "Unknown";
  document.getElementById("game-tagline").textContent = g.tagline || "";
  document.getElementById("game-cover").src = g.image || "";
  document.getElementById("game-description").textContent =
  g.description || "No description available";
  setText("developer", g.developer || "Unknown");
  setText("publisher", g.publisher || "Unknown");
  setText("releaseDate", g.releaseDate || "-");
  setText("genre", g.category || g.genre || "-");
  setText(
    "platforms",
    Array.isArray(g.platforms) ? g.platforms.join(", ") : g.platforms || "-"
  );
  setText("rating", g.rating ? `${g.rating}/10` : "-");
  document.getElementById("price").textContent = `$${Number(
    g.price || 0
  ).toFixed(2)}`;
  const feats = Array.isArray(g.features) ? g.features : [];
  document.getElementById("game-features").innerHTML = feats
  .map((i) => `<li><i class=\"fas fa-check\"></i><span>${i}</span></li>`)
  .join("");
  const reqMin = g.requirements?.minimum || {};
  const reqRec = g.requirements?.recommended || {};
  document.getElementById("req-min").innerHTML = Object.keys(reqMin)
  .map((k) => `<li><strong>${k}:</strong> ${reqMin[k]}</li>`)
  .join("");
  document.getElementById("req-rec").innerHTML = Object.keys(reqRec)
  .map((k) => `<li><strong>${k}:</strong> ${reqRec[k]}</li>`)
  .join("");
  
  bindActions(g);
}
function setText(id, txt) {
  const el = document.getElementById(id);
  if (el) el.textContent = txt;
}
function bindActions(g) {
  const add = () => {
    if (!currentUser) {
      alert(`Please log in to add ${g.name} to your cart`);
      window.location.href = "./login.html";
      return;
    }
    
    let cart = JSON.parse(localStorage.getItem("cart") || "[]");
    if (cart.find((i) => i.id === g.id && i.type === "game")) {
      alert(`${g.name} is already in your cart!`);
      return;
    }
    
    const cartItem = { 
      id: g.id, 
      type: "game", 
      addedAt: new Date().toISOString(),
      addedBy: currentUser.email,
      gameName: g.name,
      gamePrice: g.price
    };
    
    cart.push(cartItem);
    localStorage.setItem("cart", JSON.stringify(cart));
    
    console.log(`${g.name} added to cart for user: ${currentUser.name}`);
    alert(`${g.name} has been added to your cart!`);
    
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
        const alreadyInWishlist = await userDB.checkWishlistItem(currentUser.email, g.id);
        if (alreadyInWishlist) {
          alert(`${g.name} is already in your wishlist!`);
          return;
        }
        
        const wishlistItem = {
          userEmail: currentUser.email,
          gameId: g.id,
          gameName: g.name,
          gamePrice: g.price,
          addedAt: new Date().toISOString()
        };
        
        await userDB.addToWishlist(wishlistItem);
        alert(`${g.name} has been added to your wishlist!`);
        
      } catch (error) {
        console.error('Error adding to wishlist:', error);
        alert('Error adding to wishlist. Please try again.');
      }
    });
  }
  
  console.log("Game actions bound for:", g.name);
}
function fallback(msg) {
  document.getElementById("game-title").textContent = "Game";
  document.getElementById("game-description").textContent =
    msg || "Unable to load game";
}
