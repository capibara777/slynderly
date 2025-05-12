async function register() {
  const username = document.getElementById("regUsername").value;
  const email = document.getElementById("regEmail").value;
  const password = document.getElementById("regPassword").value;

  const res = await fetch("/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, email, password })
  });

  const text = await res.text();
  const response = document.getElementById("registerResponse");
  response.textContent = text;
  response.className = text.includes("éxito") ? "success" : "error";
}

async function login() {
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;

  const res = await fetch("/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });

  const data = await res.json();
  const response = document.getElementById("loginResponse");

  if (data.success) {
    localStorage.setItem("userId", data.user._id);
    localStorage.setItem("userEmail", data.user.email);
    localStorage.setItem("username", data.user.username); // o user.username
    window.location.href = "index.html";
  } else {
    response.textContent = data.message;
    response.className = "error";
  }
}

window.onload = () => {
  const userId = localStorage.getItem("userId");
  if (userId) window.location.href = "index.html";
};