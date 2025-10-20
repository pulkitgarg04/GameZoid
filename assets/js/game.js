function accountRoute() {
  const currentUser = sessionStorage.getItem("currentUser");

  if (currentUser) {
    window.location.href = "./account.html";
  } else {
    window.location.href = "./login.html";
  }
}

let currentUser = null;

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
  try {
    currentUser = getCurrentUser();
    updateUserInterface();
  } catch (e) {
    console.log('Error loading user:', e);
  }

  loadGame();
});

function getCurrentUser() {
  let user = sessionStorage.getItem("currentUser");
  if (user) {
    try {
      return JSON.parse(user);
    } catch (e) {
      console.log("Error parsing current user from sessionStorage:", e);
      sessionStorage.removeItem("currentUser");
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

function checkLogin(message) {
  if (currentUser) {
    return true;
  }

  if (message) alert(message);
  window.location.href = './login.html';

  return false;
}

function getParam(name) {
  const u = new URL(window.location.href);
  return u.searchParams.get(name);
}

function loadGame() {
  const id = getParam("id");
  if (!id) {
    fallback("No game specified");
    return;
  }

  let data = null;
  try {
    const games = getStore('games');
    data = games.find((g) => String(g.id) === String(id));
  } catch (e) {
    console.log("Error fetching game from localStorage:", e);
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
  document.getElementById("game-description").textContent = g.description || "No description available";
  document.getElementById("developer").textContent = g.developer || "Unknown";
  document.getElementById("publisher").textContent = g.publisher || "Unknown";
  document.getElementById("releaseDate").textContent = g.releaseDate || "-";
  document.getElementById("genre").textContent = g.category || g.genre || "-";
  document.getElementById("platforms").textContent = Array.isArray(g.platforms) ? g.platforms.join(", ") : g.platforms || "-";
  document.getElementById("rating").textContent = g.rating ? `${g.rating}/10` : "-";
  document.getElementById("price").textContent = `$${Number(g.price || 0).toFixed(2)}`;

  const features = Array.isArray(g.features) ? g.features : [];

  document.getElementById("game-features").innerHTML = features
    .map((i) => `<li><i class=\"fas fa-check\"></i><span>${i}</span></li>`)
    .join("");

  const minimumRequirements = g.requirements?.minimum || {};
  const recommendedRequirements = g.requirements?.recommended || {};

  document.getElementById("req-min").innerHTML = Object.keys(minimumRequirements)
    .map((k) => `<li><strong>${k}:</strong> ${minimumRequirements[k]}</li>`)
    .join("");

  document.getElementById("req-rec").innerHTML = Object.keys(recommendedRequirements)
    .map((k) => `<li><strong>${k}:</strong> ${recommendedRequirements[k]}</li>`)
    .join("");

  const add = () => {
    if (!checkLogin(`Please log in to add ${g.name} to your cart`)) {
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
      gamePrice: g.price,
    };

    cart.push(cartItem);
    localStorage.setItem("cart", JSON.stringify(cart));

    alert(`${g.name} has been added to your cart!`);

    window.location.href = "./cart.html";
  };

  document.getElementById("buy-now").addEventListener("click", add);

  const wishlistBtn = document.getElementById('wishlist');
  if (wishlistBtn) {
    wishlistBtn.addEventListener('click', () => {
      if (!checkLogin('Please log in to add items to your wishlist')) {
        return;
      }

      try {
        const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
        const exists = wishlist.find(w => w.userEmail === currentUser.email && String(w.gameId || w.productId || w.gameId) === String(g.id));
        if (exists) {
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

        wishlist.push(wishlistItem);
        localStorage.setItem('wishlist', JSON.stringify(wishlist));

        alert(`${g.name} has been added to your wishlist!`);
      } catch (error) {
        console.log('Error adding to wishlist:', error);
        alert('Error adding to wishlist. Please try again.');
      }
    });
  }
}

function fallback(msg) {
  document.getElementById("game-title").textContent = "Game";
  document.getElementById("game-description").textContent = msg || "Unable to load game";
}