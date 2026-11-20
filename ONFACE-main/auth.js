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
    // LOGIN — SOMENTE DEMONSTRATIVO
    // =====================================

    const loginForm = document.getElementById("login-form");

    if (loginForm) {

        loginForm.addEventListener("submit", function (evento) {

            evento.preventDefault();

            mostrarMensagem(
                "login-message",
                "Interface demonstrativa: a autenticação será implementada posteriormente."
            );

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