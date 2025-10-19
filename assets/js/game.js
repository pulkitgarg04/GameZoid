function accountRoute() {
  const currentUser = sessionStorage.getItem('currentUser') || localStorage.getItem('currentUser');
  
  if (currentUser) {
    window.location.href = './account.html';
  } else {
    window.location.href = './login.html';
  }
}

let currentUser = null;
let userDB = null;

document.addEventListener("DOMContentLoaded", async () => {
  try {
    currentUser = getCurrentUser();
    updateUserInterface();
  } catch (e) {
    console.error("Error loading user:", e);
  }

  try {
    if (window.storageAPI && typeof window.storageAPI.init === 'function') await window.storageAPI.init();
    userDB = window.storageAPI;
    await loadGame();
  } catch (e) {
    console.error("Failed to initialize storage or load game:", e);
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
async function loadGame() {
  const id = getParam("id");
  if (!id) {
    fallback("No game specified");
    return;
  }
  let data = null;
  try {
    data = await window.storageAPI.getById('games', id);
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
}
function fallback(msg) {
  document.getElementById("game-title").textContent = "Game";
  document.getElementById("game-description").textContent =
    msg || "Unable to load game";
}
