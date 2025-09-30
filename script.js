// === Firebase Config ===
// (Substitua pelos dados do seu projeto Firebase!)
const firebaseConfig = {
  apiKey: "SUA_API_KEY",
  authDomain: "SEU_PROJECT.firebaseapp.com",
  projectId: "SEU_PROJECT_ID",
  storageBucket: "SEU_PROJECT.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// === Login simples ===
const USER = "admin";
const PASS = "1234";

function login() {
  const u = document.getElementById("user").value;
  const p = document.getElementById("pass").value;
  if (u === USER && p === PASS) {
    localStorage.setItem("loggedIn", "true");
    showApp();
    loadData();
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
}
if (localStorage.getItem("loggedIn") === "true") {
  showApp();
  loadData();
}

// === Funções do Gantt ===
function addRow(data = {}) {
  const tbody = document.getElementById("tableBody");
  const row = document.createElement("tr");
  row.innerHTML = `
    <td><input type="text" value="${data.fase || ""}" placeholder="Nome da fase"></td>
    <td><input type="date" value="${data.dataInicio || ""}" onchange="updateDates(this)"></td>
    <td><input type="number" value="${data.dias || 1}" min="1" onchange="updateDates(this)"></td>
    <td><input type="date" value="${data.dataFinal || ""}" readonly></td>
    <td><textarea>${data.obs || ""}</textarea></td>`;
  tbody.appendChild(row);
}

function updateDates(input) {
  const row = input.closest("tr");
  const startInput = row.querySelector("td:nth-child(2) input");
  const daysInput = row.querySelector("td:nth-child(3) input");
  const endInput = row.querySelector("td:nth-child(4) input");

  if (startInput.value && daysInput.value) {
    let startDate = new Date(startInput.value);
    let endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + parseInt(daysInput.value) - 1);
    endInput.value = endDate.toISOString().split("T")[0];
  }
  saveData();
  renderTimeline();
}

async function saveData() {
  const rows = document.querySelectorAll("#tableBody tr");
  let fases = [];
  rows.forEach(row => {
    fases.push({
      fase: row.querySelector("td:nth-child(1) input").value,
      dataInicio: row.querySelector("td:nth-child(2) input").value,
      dias: row.querySelector("td:nth-child(3) input").value,
      dataFinal: row.querySelector("td:nth-child(4) input").value,
      obs: row.querySelector("td:nth-child(5) textarea").value
    });
  });

  await db.collection("gantt").doc("projeto1").set({ fases });
}

async function loadData() {
  const doc = await db.collection("gantt").doc("projeto1").get();
  if (doc.exists) {
    const data = doc.data();
    document.getElementById("tableBody").innerHTML = "";
    data.fases.forEach(f => addRow(f));
    renderTimeline();
  } else {
    addRow(); // inicia com uma linha vazia
  }
}

function renderTimeline() {
  const timeline = document.getElementById("timeline");
  timeline.innerHTML = "";

  const rows = document.querySelectorAll("#tableBody tr");
  let minDate = null, maxDate = null;
  let tasks = [];

  rows.forEach((row, idx) => {
    const phase = row.querySelector("td:nth-child(1) input").value;
    const start = row.querySelector("td:nth-child(2) input").value;
    const end = row.querySelector("td:nth-child(4) input").value;
    if (phase && start && end) {
      const sDate = new Date(start);
      const eDate = new Date(end);
      tasks.push({ phase, start: sDate, end: eDate, row: idx });
      if (!minDate || sDate < minDate) minDate = sDate;
      if (!maxDate || eDate > maxDate) maxDate = eDate;
    }
  });

  if (!minDate || !maxDate) return;

  let totalDays = Math.ceil((maxDate - minDate) / (1000*60*60*24)) + 1;

  // Barra de meses
  const monthBar = document.createElement("div");
  monthBar.className = "month-bar";
  let current = new Date(minDate);
  current.setDate(1);
  while (current <= maxDate) {
    let nextMonth = new Date(current);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    let monthDays = Math.ceil((Math.min(nextMonth, maxDate) - current) / (1000*60*60*24));
    const monthDiv = document.createElement("div");
    monthDiv.className = "month";
    monthDiv.style.width = (monthDays*30) + "px";
    monthDiv.innerText = current.toLocaleString("default",{month:"short",year:"numeric"});
    monthBar.appendChild(monthDiv);
    current = nextMonth;
  }
  timeline.appendChild(monthBar);

  // Dias
  const daysDiv = document.createElement("div");
  daysDiv.className = "days";
  for (let i=0; i<totalDays; i++) {
    const dayDiv = document.createElement("div");
    dayDiv.className = "day";
    const d = new Date(minDate);
    d.setDate(d.getDate()+i);
    dayDiv.innerText = d.getDate();
    daysDiv.appendChild(dayDiv);
  }
  timeline.appendChild(daysDiv);

  // Tarefas
  tasks.forEach(t => {
    const taskDiv = document.createElement("div");
    taskDiv.className = "task";
    taskDiv.innerText = t.phase;
    let offset = Math.floor((t.start - minDate) / (1000*60*60*24));
    let length = Math.floor((t.end - t.start)/(1000*60*60*24))+1;
    taskDiv.style.left = (offset*30) + "px";
    taskDiv.style.top = (60 + t.row*35) + "px";
    taskDiv.style.width = (length*30 - 4) + "px";
    timeline.appendChild(taskDiv);
  });

  timeline.style.height = (tasks.length*35+100)+"px";
  timeline.style.position = "relative";
}

// === Temas ===
function setTheme(mode) {
  if (mode === "dark") {
    document.body.style.background = "#222";
    document.body.style.color = "white";
    document.querySelector("header").style.background = "#111";
  } else if (mode === "medium") {
    document.body.style.background = "#ccc";
    document.body.style.color = "black";
    document.querySelector("header").style.background = "#666";
  } else {
    document.body.style.background = "#fff";
    document.body.style.color = "black";
    document.querySelector("header").style.background = "#007bff";
  }
}
