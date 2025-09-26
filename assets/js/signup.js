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
}

let userDB;

document.addEventListener('DOMContentLoaded', async () => {
  try {
    userDB = new UserDatabase();
    await userDB.init();
  } catch (error) {
    console.error('Failed to initialize user database:', error);
  }
});

document.querySelectorAll('.password-toggle-icon').forEach(icon => {
  icon.addEventListener('click', function () {
    const passwordInput = this.previousElementSibling;
    if (passwordInput.type === 'password') {
      passwordInput.type = 'text';
      this.innerHTML = '<i class="fas fa-eye-slash"></i>';
    } else {
      passwordInput.type = 'password';
      this.innerHTML = '<i class="fas fa-eye"></i>';
    }
  });
});

async function signupUser(event) {
  event.preventDefault();
  
  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim().toLowerCase();
  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirm-password').value;
  
  if (!name || !email || !password || !confirmPassword) {
    alert('Please fill in all fields');
    return;
  }
  
  if (password !== confirmPassword) {
    alert('Passwords do not match');
    return;
  }
  
  if (password.length < 6) {
    alert('Password must be at least 6 characters long');
    return;
  }
  
  try {
    const existingUser = await userDB.getUserByEmail(email);
    
    if (existingUser) {
      alert('Email already registered. Please use a different email or try logging in.');
      return;
    }
    
    const newUser = { 
      name, 
      email, 
      password, 
      isAdmin: false,
      createdAt: new Date().toISOString()
    };
    
    await userDB.addUser(newUser);
    alert('Account created successfully! Please log in.');
    window.location.href = './login.html';
    
  } catch (error) {
    console.error('Signup error:', error);
    if (error.name === 'ConstraintError') {
      alert('Email already registered. Please use a different email.');
    } else {
      alert('An error occurred during registration. Please try again.');
    }
  }
}