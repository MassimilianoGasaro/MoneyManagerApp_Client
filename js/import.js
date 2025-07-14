import authManager from './auth.js';
// per caricare header e footer in modo dinamico
export function getHeaderAndFooter() {
Promise.all([
    fetch("../header.html").then(res => res.text()),
    fetch("../footer.html").then(res => res.text())
  ])
    .then(([headerData, footerData]) => {
      document.getElementById("header").innerHTML = headerData;
      document.getElementById("footer").innerHTML = footerData;

      const login = document.getElementById("login");
      const dashboard = document.getElementById("dashboard");
      const reports = document.getElementById("reports");

      if (login) {
          if (authManager.isAuthenticated()) {
              login.textContent = "Logout";
              login.href = "#";
              login.addEventListener("click", () => {
                  localStorage.removeItem('authToken');
                  localStorage.removeItem('user_id');
                  window.location.href = "index.html"; 
              }); 

              dashboard.style.display = "inline-block";
              reports.style.display = "inline-block";
          } else {
              login.textContent = "Accedi";
              login.href = "login.html";
              
              dashboard.style.display = "none";
              reports.style.display = "none";
          }
      }
      
    })
    .catch(error => console.error("Errore durante il fetch:", error));
}