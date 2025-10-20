document.getElementById("current-year").textContent = new Date().getFullYear();

function accountRoute() {
  const currentUser = sessionStorage.getItem("currentUser");
  if (currentUser) {
    window.location.href = "./account.html";
  } else {
    window.location.href = "./login.html";
  }
}
