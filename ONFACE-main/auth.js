document.addEventListener("DOMContentLoaded", function () {

    // =====================================
    // MOSTRAR E OCULTAR SENHA
    // =====================================

    const botoesSenha = document.querySelectorAll(
        "[data-toggle-password]"
    );

    botoesSenha.forEach(function (botao) {

        botao.addEventListener("click", function () {

            const idCampo = botao.dataset.togglePassword;
            const campo = document.getElementById(idCampo);

            if (!campo) {
                return;
            }

            const mostrar = campo.type === "password";

            campo.type = mostrar ? "text" : "password";

            botao.textContent = mostrar ? "Ocultar" : "Mostrar";

            botao.setAttribute(
                "aria-label",
                mostrar ? "Ocultar senha" : "Mostrar senha"
            );

        });

    });


    // =====================================
    // FUNÇÃO PARA EXIBIR MENSAGENS
    // =====================================

    function mostrarMensagem(id, texto) {

        const elemento = document.getElementById(id);

        if (!elemento) {
            return;
        }

        elemento.textContent = texto;

        elemento.classList.add("visible");

    }


    // =====================================
    // LOGIN
    // =====================================


const loginForm = document.getElementById("login-form");

if (loginForm) {
    loginForm.addEventListener("submit", async function (evento) {
        evento.preventDefault();

        const email = document.getElementById("email").value.trim();
        const senha = document.getElementById("senha").value;
        const botao = loginForm.querySelector('button[type="submit"]');

        botao.disabled = true;
        mostrarMensagem("login-message", "Verificando seus dados...");

        try {
            const resposta = await fetch("http://127.0.0.1:5000/api/login", {
    method: "POST",
    credentials: "include",
    headers: {
        "Content-Type": "application/json"
    },
    body: JSON.stringify({
        email: email,
        senha: senha
    })
});

            const dados = await resposta.json();

            if (!resposta.ok) {
                mostrarMensagem(
                    "login-message",
                    dados.mensagem || "Não foi possível realizar o login."
                );
                return;
            }

            // Guarda os dados básicos do usuário para a navegação.
            sessionStorage.setItem(
                "onface_usuario",
                JSON.stringify(dados.usuario)
            );


mostrarMensagem(
    "login-message",
    "Login realizado com sucesso! Redirecionando..."
);

const destinos = {
    ADMINISTRADOR: "dashboard/admin.html",
    RESPONSAVEL: "dashboard/responsável.html",
    ALUNO: "dashboard/aluno.html"
};

const destino = destinos[dados.usuario.perfil];

if (destino) {
    window.location.href = destino;
} else {
    mostrarMensagem(
        "login-message",
        "Seu perfil ainda não possui um dashboard disponível."
    );
}


        } catch (erro) {
            console.error("Erro no login:", erro);

            mostrarMensagem(
                "login-message",
                "Não foi possível conectar ao servidor da ONFACE."
            );

        } finally {
            botao.disabled = false;
        }
    });
}



    // =====================================
    // CADASTRO — SOMENTE DEMONSTRATIVO
    // =====================================

    const cadastroForm = document.getElementById("cadastro-form");

    if (cadastroForm) {

        cadastroForm.addEventListener("submit", function (evento) {

            evento.preventDefault();

            const senha = document.getElementById("senha");
            const confirmacao = document.getElementById("confirmar-senha");

            if (senha.value !== confirmacao.value) {

                confirmacao.setCustomValidity(
                    "As senhas não coincidem."
                );

                confirmacao.reportValidity();

                confirmacao.focus();

                return;

            }

            confirmacao.setCustomValidity("");

            mostrarMensagem(
                "cadastro-message",
                "Os campos foram preenchidos corretamente. O cadastro real ainda não está conectado ao sistema."
            );

        });

        const confirmacao = document.getElementById("confirmar-senha");

        confirmacao.addEventListener("input", function () {
            confirmacao.setCustomValidity("");
        });

    }


    // =====================================
    // RECUPERAÇÃO — SOMENTE DEMONSTRATIVA
    // =====================================

    const recuperacaoForm = document.getElementById("recuperacao-form");

    if (recuperacaoForm) {

        recuperacaoForm.addEventListener("submit", function (evento) {

            evento.preventDefault();

            mostrarMensagem(
                "recuperacao-message",
                "Solicitação demonstrativa. O envio de e-mail para recuperação será implementado posteriormente."
            );

        });

    }


    // =====================================
    // NOVA SENHA — SOMENTE DEMONSTRATIVA
    // =====================================

    const novaSenhaForm = document.getElementById("nova-senha-form");

    if (novaSenhaForm) {

        novaSenhaForm.addEventListener("submit", function (evento) {

            evento.preventDefault();

            const senha = document.getElementById("senha");
            const confirmacao = document.getElementById("confirmar-senha");

            if (senha.value !== confirmacao.value) {

                confirmacao.setCustomValidity(
                    "As senhas não coincidem."
                );

                confirmacao.reportValidity();

                confirmacao.focus();

                return;

            }

            confirmacao.setCustomValidity("");

            mostrarMensagem(
                "nova-senha-message",
                "Validação visual concluída. A senha ainda não foi alterada, pois a recuperação real depende do backend."
            );

        });

        const confirmacao = document.getElementById("confirmar-senha");

        confirmacao.addEventListener("input", function () {
            confirmacao.setCustomValidity("");
        });

    }

});