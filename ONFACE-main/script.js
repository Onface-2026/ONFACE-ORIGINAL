document.addEventListener("DOMContentLoaded", function () {

    // MENU PARA CELULARES

    const menuToggle = document.getElementById("menu-toggle");
    const navLinks = document.getElementById("nav-links");

    if (menuToggle && navLinks) {

        menuToggle.addEventListener("click", function () {

            navLinks.classList.toggle("open");

            const menuAberto = navLinks.classList.contains("open");

            menuToggle.textContent = menuAberto ? "×" : "☰";

            menuToggle.setAttribute(
                "aria-expanded",
                String(menuAberto)
            );

        });

        // Fecha o menu depois que uma guia é selecionada.

        navLinks.querySelectorAll("a").forEach(function (link) {

            link.addEventListener("click", function () {

                navLinks.classList.remove("open");

                menuToggle.textContent = "☰";

                menuToggle.setAttribute("aria-expanded", "false");

            });

        });

    }


    // IDENTIFICA A PÁGINA ATUAL NO MENU

    let paginaAtual = window.location.pathname.split("/").pop();

    if (paginaAtual === "") {
        paginaAtual = "index.html";
    }

    document.querySelectorAll(".nav-links a").forEach(function (link) {

        const destino = link.getAttribute("href");

        if (destino === paginaAtual) {
            link.classList.add("active");
        }

    });


    // ANIMAÇÕES AO ROLAR A PÁGINA

    const elementos = document.querySelectorAll(".reveal");

    if ("IntersectionObserver" in window) {

        const observador = new IntersectionObserver(
            function (entradas) {

                entradas.forEach(function (entrada) {

                    if (entrada.isIntersecting) {

                        entrada.target.classList.add("visible");

                        observador.unobserve(entrada.target);

                    }

                });

            },
            {
                threshold: 0.12
            }
        );

        elementos.forEach(function (elemento) {
            observador.observe(elemento);
        });

    } else {

        elementos.forEach(function (elemento) {
            elemento.classList.add("visible");
        });

    }

});