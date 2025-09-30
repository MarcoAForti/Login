// === CONFIG FIREBASE ===
const firebaseConfig = {
 apiKey: "AIzaSyXXXXXXX",
  authDomain: "gantt-irizar.firebaseapp.com",
  projectId: "gantt-irizar",
  storageBucket: "gantt-irizar.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};
firebase.initializeApp(firebaseConfig);

const db = firebase.firestore();
const storage = firebase.storage();

// === LOGIN ===
const USER = "admin";
const PASS = "1234";

function login() {
  const u = document.getElementById("user").value;
  const p = document.getElementById("pass").value;

  if (u === USER && p === PASS) {
    localStorage.setItem("loggedIn", "true");
    showApp();
  } else {
    alert("Usuário ou senha incorretos!");
  }
}

function logout() {
  localStorage.removeItem("loggedIn");
  document.getElementById("app").style.display = "none";
  document.getElementById("login-screen").style.display = "flex";
}

function showApp() {
  document.getElementById("login-screen").style.display = "none";
  document.getElementById("app").style.display = "block";
  loadData();
  loadLogo();
}

if (localStorage.getItem("loggedIn") === "true") {
  showApp();
}

// === TEMAS ===
function setTheme(theme) {
  document.body.className = theme;
}

// === FASES DO GANTT ===
function loadData() {
  db.collection("gantt").doc("projeto1").get().then(doc => {
    if (doc.exists) {
      const data = doc.data();
      const tbody = document.getElementById("faseBody");
      tbody.innerHTML = "";
      (data.fases || []).forEach(fase => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${fase.nome}</td>
          <td>${fase.dataInicio}</td>
          <td>${fase.dias}</td>
          <td>${fase.dataFim}</td>
          <td>${fase.obs}</td>
        `;
        tbody.appendChild(tr);
      });
    }
  });
}

// === UPLOAD DE LOGO PARA STORAGE ===
function uploadLogo(event) {
  const file = event.target.files[0];
  if (!file) return;

  const storageRef = storage.ref("logos/companyLogo.png");
  storageRef.put(file).then(() => {
    alert("Logo atualizado!");
    loadLogo();
  });
}

function loadLogo() {
  const storageRef = storage.ref("logos/companyLogo.png");
  storageRef.getDownloadURL().then(url => {
    document.getElementById("companyLogo").src = url;
  }).catch(() => {
    // Se não existir logo no Storage, mantém o padrão
    document.getElementById("companyLogo").src = "Logotipo_IRIZAR.png";
  });
}
