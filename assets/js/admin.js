function getStore(name) {
  try {
    const item = localStorage.getItem(name);
    return item ? JSON.parse(item) : [];
  } catch (e) {
    console.log(`Error reading ${name} from localStorage`, e);
    return [];
  }
}

function saveStore(name, arr) {
  try {
    localStorage.setItem(name, JSON.stringify(arr || []));
  } catch (e) {
    console.log(`Error saving ${name} to localStorage`, e);
  }
}

function generateId() {
  return Date.now() + Math.floor(Math.random() * 1000);
}

function showMessage(message, type = "info") {
  const existing = document.querySelectorAll(".message");
  existing.forEach((e) => e.remove());
  
  const d = document.createElement("div");
  d.className = "message " + type + " fade-in";
  d.innerHTML = `<i class="fas fa-${
    type === "success"
      ? "check-circle"
      : type === "error"
      ? "exclamation-circle"
      : "info-circle"
  }"></i> ${message}`;

  const container = document.querySelector(".admin-container") || document.body;
  container.insertBefore(d, container.firstChild);
  
  setTimeout(() => d.remove(), 4500);
}

function openModal(id) {
  const element = document.getElementById(id);
 
  if (element) {
    element.style.display = "block";
  }
}

function closeModal(id) {
  const element = document.getElementById(id);
 
  if (element) {
    element.style.display = "none";
  }
}

function checkScrollIndicator(element) {
  if (!element) {
    return;
  }

  const hasScroll = element.scrollHeight > element.clientHeight;
  element.classList.toggle("has-scroll", hasScroll);
  element.addEventListener("scroll", () => {
    const scrollTop = element.scrollTop;
    const max = element.scrollHeight - element.clientHeight;
    element.classList.toggle("has-scroll", scrollTop < max - 10);
  });
}

function parseKeyValueText(text) {
  const lines = (text || "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const out = {};

  lines.forEach((line) => {
    const idx = line.indexOf(":");
    if (idx > -1) {
      const k = line.slice(0, idx).trim();
      const v = line.slice(idx + 1).trim();
      if (k) {
        out[k] = v;
      }
    }
  });

  return out;
}

function stringifyKeyValue(obj) {
  return Object.keys(obj || {})
    .map((k) => `${k}: ${obj[k]}`)
    .join("\n");
}

function showTab(tabName) {
  document
    .querySelectorAll(".tab-content")
    .forEach((c) => c.classList.remove("active"));
  document
    .querySelectorAll(".tab-btn")
    .forEach((b) => b.classList.remove("active"));

  const tab = document.getElementById(tabName + "-tab");
  if (tab) {
    tab.classList.add("active");
  }

  const btn = Array.from(document.querySelectorAll(".tab-btn")).find((b) =>
    b.getAttribute("onclick")?.includes(`showTab('${tabName}')`)
  );

  if (btn) {
    btn.classList.add("active");
  }
}

function showAddGameModal() {
  const form = document.getElementById("addGameForm");
  if (form) {
    form.reset();
  }

  openModal("addGameModal");
  setTimeout(
    () =>
      checkScrollIndicator(
        document.querySelector("#addGameModal .modal-form-content")
      ),
    100
  );
}

function showAddProductModal() {
  const form = document.getElementById("addProductForm");
  if (form) {
    form.reset();
  }

  openModal("addProductModal");
  setTimeout(() =>
      checkScrollIndicator(
        document.querySelector("#addProductModal .modal-form-content")
      ), 100);
}

function showGameFields(isGame) {
  const ids = [
    "editTagline",
    "editDeveloper",
    "editPublisher",
    "editReleaseDate",
    "editPlatforms",
    "editRating",
    "editFeatures",
    "editReqMin",
    "editReqRec",
    "editScreenshots",
  ];

  ids.forEach((id) => {
    const el = document.getElementById(id);
    const group = el ? el.closest(".form-group") : null;
    if (group) group.style.display = isGame ? "block" : "none";
  });
}

function displayGames(games) {
  const grid = document.getElementById("gamesGrid");
  if (!grid) return;
  if (!games || games.length === 0) {
    grid.innerHTML = `<div class="empty-state"><i class="fas fa-gamepad"></i><h3>No games found</h3><p>Add your first game to get started!</p></div>`;
    return;
  }

  grid.innerHTML = games
    .map(
      (g) => `
      <div class="item-card slide-up">
        <img src="${
          g.image || "../assets/media/favicon.png"
        }" alt="${escapeHtml(
        g.name
      )}" class="item-image" onerror="this.src='../assets/media/favicon.png'">
        <div class="item-content">
          <div class="item-category">${escapeHtml(g.category || "")}</div>
          <h3 class="item-name">${escapeHtml(g.name)}</h3>
          <div class="item-price">$${Number(g.price || 0).toFixed(2)}</div>
          ${
            g.description
              ? `<p class="item-description">${escapeHtml(g.description)}</p>`
              : ""
          }
          <div class="item-actions">
            <button class="btn-edit" onclick="editGame(${
              g.id
            })"><i class="fas fa-edit"></i> Edit</button>
            <button class="btn-delete" onclick="deleteGame(${
              g.id
            })"><i class="fas fa-trash"></i> Delete</button>
          </div>
        </div>
      </div>
    `
    )
    .join("");
}

function displayProducts(products) {
  const grid = document.getElementById("productsGrid");
  if (!grid) return;
  if (!products || products.length === 0) {
    grid.innerHTML = `<div class="empty-state"><i class="fas fa-box"></i><h3>No products found</h3><p>Add your first gaming product to get started!</p></div>`;
    return;
  }

  grid.innerHTML = products
    .map(
      (p) => `
      <div class="item-card slide-up">
        <img src="${
          p.image || "../assets/media/favicon.png"
        }" alt="${escapeHtml(
        p.name
      )}" class="item-image" onerror="this.src='../assets/media/favicon.png'">
        <div class="item-content">
          <div class="item-category">${escapeHtml(p.category || "")}</div>
          <h3 class="item-name">${escapeHtml(p.name)}</h3>
          <div class="item-price">$${Number(p.price || 0).toFixed(2)}</div>
          ${
            p.description
              ? `<p class="item-description">${escapeHtml(p.description)}</p>`
              : ""
          }
          <div class="item-actions">
            <button class="btn-edit" onclick="editProduct(${
              p.id
            })"><i class="fas fa-edit"></i> Edit</button>
            <button class="btn-delete" onclick="deleteProduct(${
              p.id
            })"><i class="fas fa-trash"></i> Delete</button>
          </div>
        </div>
      </div>
    `
    )
    .join("");
}

function escapeHtml(s) {
  return String(s || "").replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      }[c])
  );
}

function loadGames() {
  try {
    const games = getStore('games');
    displayGames(games || []);
  } catch (e) {
    console.log("loadGames error", e);
    showMessage("Error loading games", "error");
  }
}

function loadProducts() {
  try {
    const products = getStore('products');
    displayProducts(products || []);
  } catch (e) {
    console.log("loadProducts error", e);
    showMessage("Error loading products", "error");
  }
}

function onAddGame(e) {
  e.preventDefault();

  const game = {
    name: document.getElementById("gameName").value.trim(),
    tagline: document.getElementById("gameTagline").value.trim(),
    category: document.getElementById("gameCategory").value,
    developer: document.getElementById("gameDeveloper").value.trim(),
    publisher: document.getElementById("gamePublisher").value.trim(),
    releaseDate: document.getElementById("gameReleaseDate").value,
    price: parseFloat(document.getElementById("gamePrice").value) || 0,
    image: document.getElementById("gameImage").value.trim(),
    description: document.getElementById("gameDescription").value.trim(),
    platforms: (document.getElementById("gamePlatforms").value || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    rating: parseFloat(document.getElementById("gameRating").value) || 0,
    features: (document.getElementById("gameFeatures").value || "")
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean),
    requirements: {
      minimum: parseKeyValueText(
        document.getElementById("gameReqMin").value || ""
      ),
      recommended: parseKeyValueText(
        document.getElementById("gameReqRec").value || ""
      ),
    },
    screenshots: (document.getElementById("gameScreenshots").value || "")
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean),
  };

  try {
    const games = getStore('games');
    game.id = generateId();
    games.push(game);
    
    saveStore('games', games);
    showMessage('Game added', 'success');
    closeModal('addGameModal');
    loadGames();
    refreshStats();
  } catch (e) {
    console.log('add game', e);
    showMessage('Error adding game', 'error');
  }
}

function onAddProduct(e) {
  e.preventDefault();
  
  const p = {
    name: document.getElementById("productName").value.trim(),
    category: document.getElementById("productCategory").value,
    price: parseFloat(document.getElementById("productPrice").value) || 0,
    image: document.getElementById("productImage").value.trim(),
    description: document.getElementById("productDescription").value.trim(),
    tagline: document.getElementById("productTagline")
      ? document.getElementById("productTagline").value.trim()
      : "",
  };

  try {
    const products = getStore('products');
    p.id = generateId();
    products.push(p);
    saveStore('products', products);
    showMessage('Product added', 'success');
    closeModal('addProductModal');
    loadProducts();
    refreshStats();
  } catch (e) {
    console.log('add product', e);
    showMessage('Error adding product', 'error');
  }
}

function editGame(id) {
  try {
    const games = getStore('games');
    const game = games.find((x) => x.id === id);
    if (!game) {
      return showMessage("Game not found", "error");
    }

    document.getElementById("editModalTitle").textContent = "Edit Game";
    document.getElementById("editId").value = id;
    document.getElementById("editType").value = "game";
    document.getElementById("editName").value = game.name || "";
    document.getElementById("editTagline").value = game.tagline || "";
    document.getElementById("editCategory").value = game.category || "";
    document.getElementById("editPrice").value = game.price || 0;
    document.getElementById("editImage").value = game.image || "";
    document.getElementById("editDescription").value = game.description || "";
    document.getElementById("editDeveloper").value = game.developer || "";
    document.getElementById("editPublisher").value = game.publisher || "";
    document.getElementById("editReleaseDate").value = game.releaseDate || "";
    document.getElementById("editPlatforms").value = Array.isArray(game.platforms) ? game.platforms.join(", ") : game.platforms || "";
    document.getElementById("editRating").value = game.rating || "";
    document.getElementById("editFeatures").value = Array.isArray(game.features) ? game.features.join("\n") : "";
    document.getElementById("editReqMin").value = stringifyKeyValue(game.requirements?.minimum || {});
    document.getElementById("editReqRec").value = stringifyKeyValue(game.requirements?.recommended || {});
    document.getElementById("editScreenshots").value = Array.isArray(game.screenshots) ? game.screenshots.join("\n"): "";
    
    showGameFields(true);
    openModal("editModal");
    setTimeout(() => checkScrollIndicator(
          document.querySelector("#editModal .modal-form-content")
        ), 100);
  } catch (e) {
    console.log("editGame", e);
    showMessage("Error loading game for edit", "error");
  }
}

function editProduct(id) {
  try {
    const products = getStore('products');
    const product = products.find((x) => x.id === id);

    if (!product) {
      return showMessage("Product not found", "error");
    }

    document.getElementById("editModalTitle").textContent = "Edit Product";
    document.getElementById("editId").value = id;
    document.getElementById("editType").value = "product";
    document.getElementById("editName").value = p.name || "";
    document.getElementById("editCategory").value = p.category || "";
    document.getElementById("editPrice").value = p.price || 0;
    document.getElementById("editImage").value = p.image || "";
    document.getElementById("editDescription").value = p.description || "";
    
    showGameFields(false);
    openModal("editModal");
    setTimeout(() => checkScrollIndicator(document.querySelector("#editModal .modal-form-content")), 100);
  } catch (e) {
    console.log("editProduct", e);
    showMessage("Error loading product for edit", "error");
  }
}

function onEditSubmit(e) {
  e.preventDefault();
  
  const id = parseInt(document.getElementById("editId").value, 10);
  const type = document.getElementById("editType").value;
  const item = {
    id,
    name: document.getElementById("editName").value.trim(),
    category: document.getElementById("editCategory").value,
    price: parseFloat(document.getElementById("editPrice").value) || 0,
    image: document.getElementById("editImage").value.trim(),
    description: document.getElementById("editDescription").value.trim(),
    tagline: document.getElementById("editTagline")
      ? document.getElementById("editTagline").value.trim()
      : "",
  };

  if (type === "game") {
    item.developer = document.getElementById("editDeveloper").value.trim();
    item.publisher = document.getElementById("editPublisher").value.trim();
    item.releaseDate = document.getElementById("editReleaseDate").value;
    item.platforms = (document.getElementById("editPlatforms").value || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    item.rating = parseFloat(document.getElementById("editRating").value) || 0;
    item.features = (document.getElementById("editFeatures").value || "")
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    
      item.requirements = {
      minimum: parseKeyValueText(
        document.getElementById("editReqMin").value || ""
      ),
      recommended: parseKeyValueText(
        document.getElementById("editReqRec").value || ""
      ),
    };

    item.screenshots = (document.getElementById("editScreenshots").value || "")
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  try {
    if (type === 'game') {
      const games = getStore('games');
      
      const idx = games.findIndex((x) => Number(x.id) === Number(id));
      if (idx === -1) {
        games.push(item);
      } else {
        games[idx] = item;
      }

      saveStore('games', games);
    } else {
      const products = getStore('products');
      const idx = products.findIndex((x) => Number(x.id) === Number(id));

      if (idx === -1) {
        products.push(item);
      } else {
        products[idx] = item;
      }

      saveStore('products', products);
    }

    showMessage('Updated successfully', 'success');
    closeModal('editModal');
    loadGames();
    loadProducts();
    refreshStats();
  } catch (e) {
    console.log("edit submit", e);
    showMessage("Error updating item", "error");
  }
}

function showConfirmModal(title, message, onConfirm) {
  const msg = document.getElementById("confirmMessage");
  if (msg) {
    msg.textContent = message;
  }
  
  openModal("confirmModal");
  
  const confirmButton = document.getElementById("confirmButton");
  const newBtn = confirmButton.cloneNode(true);
  confirmButton.parentNode.replaceChild(newBtn, confirmButton);
  newBtn.addEventListener("click", () => {
    closeModal("confirmModal");
    onConfirm();
  });
}

function deleteGame(id) {
  showConfirmModal(
    "Delete Game",
    "Are you sure you want to delete this game? This action cannot be undone.",
      () => {
      try {
        const games = getStore('games');
        const filtered = games.filter((x) => Number(x.id) !== Number(id));
        saveStore('games', filtered);
        showMessage('Game deleted', 'success');
        loadGames();
        refreshStats();
      } catch (e) {
        console.log('deleteGame', e);
        showMessage('Error deleting game', 'error');
      }
    }
  );
}

function deleteProduct(id) {
  showConfirmModal(
    "Delete Product",
    "Are you sure you want to delete this product? This action cannot be undone.",
      () => {
      try {
        const products = getStore('products');
        const filtered = products.filter((x) => Number(x.id) !== Number(id));
        saveStore('products', filtered);
        showMessage('Product deleted', 'success');
        loadProducts();
        refreshStats();
      } catch (e) {
        console.log('deleteProduct', e);
        showMessage('Error deleting product', 'error');
      }
    }
  );
}

function searchGames() {
  const term = (document.getElementById("gameSearch").value || "").toLowerCase();
  
  document.querySelectorAll("#gamesGrid .item-card").forEach((card) => {
    const name = (card.querySelector(".item-name")?.textContent || "").toLowerCase();
    const category = (card.querySelector(".item-category")?.textContent || "").toLowerCase();
    card.style.display = name.includes(term) || category.includes(term) ? "block" : "none";
  });
}

function searchProducts() {
  const term = (document.getElementById("productSearch").value || "").toLowerCase();
 
  document.querySelectorAll("#productsGrid .item-card").forEach((card) => {
    const name = (card.querySelector(".item-name")?.textContent || "").toLowerCase();
    const category = (card.querySelector(".item-category")?.textContent || "").toLowerCase();
    card.style.display = name.includes(term) || category.includes(term) ? "block" : "none";
  });
}

function refreshStats() {
  try {
    const games = getStore('games');
    const products = getStore('products');
    const gamesCount = games.length;
    const productsCount = products.length;
   
    document.getElementById("gamesCount").textContent = gamesCount;
    document.getElementById("productsCount").textContent = productsCount;
    document.getElementById("dbSize").textContent = Math.round(new Blob([JSON.stringify([...games, ...products])]).size / 1024) + " KB";
  } catch (e) {
    console.log("refreshStats", e);
  }
}

function exportData() {
  try {
    const games = getStore('games');
    const products = getStore('products');
    const data = {
      games,
      products,
      exportDate: new Date().toISOString(),
      version: "1.0",
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });

    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `gamezoid-data-${new Date().toISOString().split("T")[0]}.json`;
    a.click();

    showMessage("Data exported", "success");
  } catch (e) {
    console.log("export", e);
    showMessage("Error exporting data", "error");
  }
}

function clearDatabase() {
  showConfirmModal(
    "Clear Database",
    "Are you sure you want to clear all data? This will delete games and products.",
    () => {
      try {
        saveStore('games', []);
        saveStore('products', []);
        showMessage('Database cleared', 'success');
        
        loadGames();
        loadProducts();
        refreshStats();
      } catch (e) {
        console.log('clearDatabase', e);
        showMessage('Error clearing database', 'error');
      }
    }
  );
}

async function populateData() {
  let data = null;

  try {
    const resp = await fetch('https://gamezoid.pulkitgarg.me/assets/data/default-data.json');
    if (resp.ok) {
      const json = await resp.json();
      data = json;
    }
  } catch (err) {
    console.log('fetch default data', err);
  }

  if (!data || typeof data !== 'object') {
    throw new Error('Default data not found');
  }

  const games = Array.isArray(data.games) ? data.games : [];
  const products = Array.isArray(data.products) ? data.products : [];

  const existingGames = getStore('games');
  const existingProducts = getStore('products');

  for (const g of games) {
    existingGames.push({ ...g, id: generateId() });
  }

  for (const p of products) {
    existingProducts.push({ ...p, id: generateId() });
  }

  saveStore('games', existingGames);
  saveStore('products', existingProducts);
  showMessage('Default data populated', 'success');

  loadGames();
  loadProducts();
  refreshStats();
}


function populateDefaultData() {
  showConfirmModal(
    "Populate Default Data",
    "This will add default games and products from data/default-data.json. Continue?",
    populateData
  );
}

function accountRoute() {
  const currentUser = sessionStorage.getItem('currentUser');
  if (currentUser) window.location.href = './account.html';
  else window.location.href = './login.html';
}

document.addEventListener("DOMContentLoaded", () => {
  const addGameForm = document.getElementById("addGameForm");
  if (addGameForm) {
    addGameForm.addEventListener("submit", onAddGame);
  }

  const addProductForm = document.getElementById("addProductForm");
  if (addProductForm) {
    addProductForm.addEventListener("submit", onAddProduct);
  }

  window.addEventListener("click", (ev) => {
    document.querySelectorAll(".modal").forEach((m) => {
      if (ev.target === m) m.style.display = "none";
    });
  });

  document.addEventListener("keydown", (ev) => {
    if (ev.key === "Escape")
      document.querySelectorAll(".modal").forEach((m) => {
        if (m.style.display === "block") m.style.display = "none";
      });
  });

  try {
    loadGames();
    loadProducts();
    refreshStats();
  } catch (e) {
    console.log("Admin intialization error", e);
  }
});
