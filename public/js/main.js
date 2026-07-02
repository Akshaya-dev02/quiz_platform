const socket = io();
const token = localStorage.getItem("token");

async function api(path, method="GET", body){
    const headers={"Content-Type":"application/json"};
    if(token) headers["Authorization"]="Bearer "+token;
    const res = await fetch("/api"+path,{method,headers,body:body?JSON.stringify(body):undefined});
    return res.json();
}

// ----------------- INDEX PAGE -----------------
const loginBtnIndex = document.getElementById("loginBtn");
const registerBtnIndex = document.getElementById("registerBtn");
const roleSelectIndex = document.getElementById("roleSelect");

if(loginBtnIndex && registerBtnIndex){
    loginBtnIndex.onclick = () => window.location.href=`/login.html?role=${roleSelectIndex.value}`;
    registerBtnIndex.onclick = () => window.location.href=`/register.html?role=${roleSelectIndex.value}`;
}

// -------- LOGIN PAGE FIXED --------
const API_BASE = "http://localhost:3000";

const loginBtn = document.getElementById("loginBtn");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");

if (loginBtn) {
    loginBtn.addEventListener("click", loginUser);
}

async function loginUser() {
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    if (!email || !password) {
        alert("Enter all fields");
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/api/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        let data;
        try {
            data = await response.json();
        } catch {
            alert("Server returned invalid response");
            return;
        }

        if (!response.ok) {
            alert(data.error || "Login failed");
            return;
        }

        // Save token
        localStorage.setItem("token", data.token);

        // Decode role
        const payload = JSON.parse(atob(data.token.split('.')[1]));

        if (payload.role === "admin") {
            window.location.href = "admin-dashboard.html";
        } else {
            window.location.href = "user-dashboard.html";
        }

    } catch (err) {
        console.error("LOGIN ERROR:", err);
        alert("Cannot connect to server.");
    }
}


// ---------------- CONFIG ----------------
// API_BASE is defined above

// ---------------- REGISTER ----------------
document.getElementById("registerBtn").addEventListener("click", registerUser);

async function registerUser() {
    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    const role = document.getElementById("roleSelect").value;

    if (!name || !email || !password) {
        alert("Please fill all fields");
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/api/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: name,
                email: email,
                password: password,
                role: role
            })
        });

        // Handle bad JSON safely
        let data;
        try {
            data = await response.json();
        } catch {
            alert("Server returned invalid response.");
            return;
        }

        if (!response.ok) {
            alert(data.error || "Registration failed");
            return;
        }

        // Success
        localStorage.setItem("token", data.token);
        alert("Registration Successful!");
        window.location.href = "login.html";

    } catch (error) {
        console.error("REGISTER ERROR:", error);
        alert("Could not connect to server.");
    }
}

// ----------------- LOGOUT -----------------
const logoutBtn = document.getElementById("logoutBtn");
if(logoutBtn){
    logoutBtn.onclick = ()=>{
        localStorage.removeItem("token");
        window.location.href="login.html";
    }
}

// ----------------- USER DASHBOARD -----------------
const quizzesList = document.getElementById("quizzesList");
const quizArea = document.getElementById("quizArea");
const resultsList = document.getElementById("resultsList");

let currentAttemptId = null;

if(quizzesList && quizArea){
    async function loadQuizzes(){
        const quizzes = await api("/quizzes");
        quizzesList.innerHTML="";
        quizzes.forEach(q=>{
            const div = document.createElement("div");
            div.className="quiz-item";
            div.textContent=q.title;
            div.onclick = ()=>startQuiz(q.id);
            quizzesList.appendChild(div);
        });
    }

    async function startQuiz(quizId){
        const r = await api(`/start/${quizId}`,"POST");
        currentAttemptId = r.attemptId;

        quizArea.innerHTML=`<h3>${r.quiz.title}</h3>`;
        r.quiz.questions.forEach((q,idx)=>{
            const div = document.createElement("div");
            div.className="question";
            div.innerHTML=`<p>${idx+1}. ${q.text}</p>` +
            q.options.map((opt,i)=>`<label><input type="radio" name="q_${q.id}" value="${i}" />${opt}</label>`).join("<br>");
            quizArea.appendChild(div);
        });

        const submitBtn = document.createElement("button");
        submitBtn.textContent="Submit";
        submitBtn.className="btn-primary";
        submitBtn.onclick = submitQuiz;
        quizArea.appendChild(submitBtn);

        socket.emit("join_quiz_room",{quizId,role:"user"});
    }

    async function submitQuiz(){
        const answers = {};
        document.querySelectorAll(".question").forEach(div=>{
            const radios = div.querySelectorAll("input[type=radio]");
            if(radios.length){
                const name = radios[0].name;
                const id = name.slice(2);
                radios.forEach(r=>{if(r.checked) answers[id]=parseInt(r.value);});
            }
        });
        const res = await api(`/submit/${currentAttemptId}`,"POST",{answers});
        alert(`Your score: ${res.score}%`);
    }

    loadQuizzes();
}

// ----------------- ADMIN DASHBOARD -----------------
// Get DOM elements
const adminLogoutBtn = document.getElementById('logoutBtn');
const generateQuizBtn = document.getElementById('generateQuizBtn');
const attemptsList = document.getElementById('attemptsList');

// Function to render a new attempt in the list
function addAttempt(title, topic, count) {
  const div = document.createElement('div');
  div.className = 'quiz-item';
  div.textContent = `Quiz: ${title} | Topic: ${topic} | Questions: ${count}`;
  attemptsList.appendChild(div);
}

// Generate Quiz button
generateQuizBtn.addEventListener('click', () => {
  const title = document.getElementById('quizTitle').value.trim();
  const topic = document.getElementById('quizTopic').value.trim();
  const count = document.getElementById('quizCount').value.trim();

  if (!title || !topic || !count) {
    alert('Please fill all fields!');
    return;
  }

  // Add to attempts list
  addAttempt(title, topic, count);

  // Clear input fields
  document.getElementById('quizTitle').value = '';
  document.getElementById('quizTopic').value = '';
  document.getElementById('quizCount').value = '';

  alert('Quiz generated successfully!');
});

// Logout button
adminLogoutBtn.addEventListener('click', () => {
  // Clear session data if any
  localStorage.removeItem('authToken'); 
  sessionStorage.clear();

  // Redirect to home page (update this URL to your home page)
  window.location.href = 'index.html';
});
