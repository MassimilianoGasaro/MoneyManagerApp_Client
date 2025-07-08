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
        // simulazione di controllo auth
        return false;
        //return localStorage.getItem('auth') === 'true';
      }

      const login = document.getElementById("login");
      if (login) {
          if (isAuth()) {
              login.textContent = "Logout";
              login.href = "#"; 
          } else {
              login.textContent = "Accedi";
              login.href = "login.html"; 
          }
      }
      
    })
    .catch(error => console.error("Errore durante il fetch:", error));
}