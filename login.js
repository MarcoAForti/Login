document.getElementById("loginForm").addEventListener("submit", function(e) {
    e.preventDefault();

    let usuario = document.getElementById("usuario").value;
    let senha = document.getElementById("senha").value;
    let erro = document.getElementById("erro");

    // Usuário e senha fixos para exemplo
    if(usuario === "admin" && senha === "1234") {
        window.location.href = "bemvindo.html";
    } else {
        erro.textContent = "Usuário ou senha incorretos!";
    }
});
