function accountRoute() {
  const currentUser = sessionStorage.getItem('currentUser') || localStorage.getItem('currentUser');
  
  if (currentUser) {
    window.location.href = './account.html';
  } else {
    window.location.href = './login.html';
  }
}

let userDB;

document.addEventListener('DOMContentLoaded', async () => {
  try {
    if (window.storageAPI && typeof window.storageAPI.init === 'function') {
      await window.storageAPI.init();
    }
    
    userDB = window.storageAPI;
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