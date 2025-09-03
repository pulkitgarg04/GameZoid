function accountRoute() {
    const currentUser = localStorage.getItem('currentUser');
    
    if (currentUser) {
        window.location.href = './account.html';
    } else {
        window.location.href = './login.html';
    }
};