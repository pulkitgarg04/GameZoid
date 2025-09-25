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
document.addEventListener("DOMContentLoaded", async () => {
  try {
    gameDB = new GamePageDB();
    await gameDB.init();
    await loadGame();
  } catch (e) {
    fallback("Failed to load game");
  }
});
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
    const currentUser = JSON.parse(
      localStorage.getItem("currentUser") || "null"
    );
    if (!currentUser) {
      window.location.href = "./login.html";
      return;
    }
    let cart = JSON.parse(localStorage.getItem("cart") || "[]");
    if (cart.find((i) => i.id === g.id && i.type === "game")) {
      alert("Already in cart");
      return;
    }
    cart.push({ id: g.id, type: "game", addedAt: new Date().toISOString() });
    localStorage.setItem("cart", JSON.stringify(cart));
    window.location.href = "./cart.html";
  };
  document.getElementById("buy-now").addEventListener("click", add);
  document.getElementById("sidebar-buy").addEventListener("click", add);
}
function fallback(msg) {
  document.getElementById("game-title").textContent = "Game";
  document.getElementById("game-description").textContent =
    msg || "Unable to load game";
}
