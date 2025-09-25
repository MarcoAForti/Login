document.getElementById("loginForm").addEventListener("submit", function(e) {
    e.preventDefault();

    const usuario = document.getElementById("usuario").value.trim();
    const senha = document.getElementById("senha").value;
    const erro = document.getElementById("erro");

    // Busca o arquivo users.json (coloque users.json no mesmo diretório)
    fetch('users.json')
        .then(response => {
            if (!response.ok) throw new Error('Não foi possível carregar users.json');
            return response.json();
        })
        .then(users => {
            const user = users.find(u => u.username === usuario);
            if (!user) {
                erro.textContent = "Usuário ou senha incorretos!";
                return;
            }

            // Para demo: compara senha em texto puro
            if (user.password === senha) {
                // Você pode passar info via query string ou usar sessionStorage/localStorage
                // Exemplo: guardar o displayName no sessionStorage
                sessionStorage.setItem('displayName', user.displayName);
                sessionStorage.setItem('username', user.username);
                sessionStorage.setItem('role', user.role);
                window.location.href = "bemvindo.html";
            } else {
                erro.textContent = "Usuário ou senha incorretos!";
            }
        })
        .catch(err => {
            console.error(err);
            erro.textContent = "Erro ao carregar dados de usuários.";
        });
});
