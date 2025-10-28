function accountRoute() {
  const currentUser = sessionStorage.getItem('currentUser');
  if (currentUser) {
    window.location.href = './account.html';
    return;
  }

  window.location.href = './login.html';
}

function getUsers() {
  try {
    const users = localStorage.getItem('users');
    return users ? JSON.parse(users) : [];
  } catch (e) {
    console.log('Error parsing users from localStorage:', e);
    return [];
  }
}

const PASSWORD_KEY = 12;
function simpleEncrypt(str, key = PASSWORD_KEY) {
  try {
    let out = '';
    for (let i = 0; i < str.length; i++) {
      out += String.fromCharCode(str.charCodeAt(i) ^ key);
    }
    return btoa(out);
  } catch (e) {
    console.error('Encryption error', e);
    return str;
  }
}

function simpleDecrypt(enc, key = PASSWORD_KEY) {
  try {
    const decoded = atob(enc);
    let out = '';
    for (let i = 0; i < decoded.length; i++) {
      out += String.fromCharCode(decoded.charCodeAt(i) ^ key);
    }
    return out;
  } catch (e) {
    console.log('Decryption error', e);
    return enc;
  }
}

function verifyPassword(stored, plain) {
  if (!stored) return false;
  try {
    const dec = simpleDecrypt(stored);
    if (dec === plain) return true;
  } catch (e) {}
  return stored === plain;
}

function saveUsers(users) {
  try {
    localStorage.setItem('users', JSON.stringify(users));
  } catch (e) {
    console.log('Error saving users to localStorage:', e);
  }
}

function findUserByEmail(email) {
  if (!email) {
    return null;
  }

  const users = getUsers();
  return users.find(u => String(u.email).toLowerCase() === String(email).toLowerCase()) || null;
}

function addUser(user) {
  if (!user || !user.email) {
    return null;
  }

  const users = getUsers();
  user.email = String(user.email).toLowerCase();

  if (user.password && typeof user.password === 'string') {
    try {
      user.password = simpleEncrypt(user.password);
    } catch (e) {
      console.error('Failed to encrypt password for new user', e);
    }
  }
  users.push(user);

  saveUsers(users);
  
  return user;
}

if (!localStorage.getItem('users')) {
  saveUsers([]);
}

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
    const existingUser = findUserByEmail(email);
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

    addUser(newUser);
    
    alert('Account created successfully! Please log in.');

    window.location.href = './login.html';
  } catch (error) {
    console.error('Signup error:', error);
    alert('An error occurred during registration. Please try again.');
  }
}