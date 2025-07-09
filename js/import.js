function isEmptyOrNull(input) {
  return input === null || input === undefined || input.trim() === '';
}
// per caricare header e footer in modo dinamico
export function getHeaderAndFooter() {
Promise.all([
    fetch("../header.html").then(res => res.text()),
    fetch("../footer.html").then(res => res.text())
  ])
    .then(([headerData, footerData]) => {
      document.getElementById("header").innerHTML = headerData;
      document.getElementById("footer").innerHTML = footerData;

      // Header
      function isAuth() {
        return !isEmptyOrNull(localStorage.getItem('authToken'));
      }

      const login = document.getElementById("login");
      if (login) {
          if (isAuth()) {
              login.textContent = "Logout";
              login.href = "#";
              login.addEventListener("click", () => {
                  localStorage.removeItem('authToken');
                  window.location.href = "index.html"; 
              }); 
          } else {
              login.textContent = "Accedi";
              login.href = "login.html"; 
          }
      }
      
    })
    .catch(error => console.error("Errore durante il fetch:", error));
}