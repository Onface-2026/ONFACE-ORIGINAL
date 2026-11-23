/* ==========================================
   ONFACE — PORTAL DO RESPONSÁVEL E DO ALUNO
   Interface de demonstração
========================================== */

(async () => {
    "use strict";

    const role = document.body.dataset.portalRole;

    if (!["responsavel", "aluno"].includes(role)) return;

    // Verifica se existe uma sessão autenticada no Flask.
    let usuarioLogado;

    try {
        const resposta = await fetch("http://127.0.0.1:5000/api/me", {
            method: "GET",
            credentials: "include"
        });

        if (!resposta.ok) {
            window.location.replace("../login.html");
            return;
        }

        const dados = await resposta.json();

        if (!dados.autenticado || !dados.usuario) {
            window.location.replace("../login.html");
            return;
        }

        // Confere se o perfil corresponde ao dashboard acessado.
        const perfisPermitidos = {
            aluno: "ALUNO",
            responsavel: "RESPONSAVEL"
        };

        if (dados.usuario.perfil !== perfisPermitidos[role]) {
            window.location.replace("../login.html");
            return;
        }

        usuarioLogado = dados.usuario;

    } catch (erro) {
        console.error("Erro ao verificar autenticação:", erro);
        window.location.replace("../login.html");
        return;
    }

    const prefix = role === "responsavel" ? "guardian" : "student";
    const ATTENDANCE_KEY = "onface_demo_attendance_v1";
    const NOTIFICATION_KEY = `onface_demo_notifications_${role}_v1`;
    let frequenciaResponsavel = null;
    let alunosResponsavel = [];

    const $ = (selector, root = document) => root.querySelector(selector);
    const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

    const sections = {
        inicio: "Visão geral",
        frequencia: role === "aluno" ? "Minha frequência" : "Frequência",
        aulas: role === "aluno" ? "Minhas disciplinas" : "Aulas e disciplinas",
        notificacoes: "Notificações",
        perfil: role === "aluno" ? "Meu perfil" : "Meu perfil"
    };

    const subjects = [
        { name: "Matemática", teacher: "Professor demonstrativo", icon: "∑" },
        { name: "Língua Portuguesa", teacher: "Professora demonstrativa", icon: "Aa" },
        { name: "História", teacher: "Professor demonstrativo", icon: "◷" },
        { name: "Geografia", teacher: "Professora demonstrativa", icon: "◎" },
        { name: "Ciências", teacher: "Professor demonstrativo", icon: "⚛" },
        { name: "Informática", teacher: "Professor demonstrativo", icon: "⌘" }
    ];

    /*
      Dados fictícios usados somente se não houver chamadas reais
      do aluno no localStorage do navegador.
    */
    const demoAttendance = [
        { date: "2026-10-26", subject: "Matemática", teacher: "Professor demonstrativo", time: "07:00", status: "presente", note: "" },
        { date: "2026-10-27", subject: "Língua Portuguesa", teacher: "Professora demonstrativa", time: "08:00", status: "presente", note: "" },
        { date: "2026-10-28", subject: "História", teacher: "Professor demonstrativo", time: "09:00", status: "ausente", note: "Registro ilustrativo." },
        { date: "2026-10-29", subject: "Geografia", teacher: "Professora demonstrativa", time: "10:00", status: "presente", note: "" },
        { date: "2026-10-30", subject: "Ciências", teacher: "Professor demonstrativo", time: "07:00", status: "atrasado", note: "Registro ilustrativo." },
        { date: "2026-11-02", subject: "Informática", teacher: "Professor demonstrativo", time: "08:00", status: "presente", note: "" }
    ];

    const demoNotifications = role === "responsavel"
        ? [
            {
                id: "resp-notice-1",
                title: "Acompanhamento de frequência",
                message: "Consulte periodicamente o histórico de frequência do aluno vinculado.",
                date: "2026-11-02",
                read: false,
                icon: "✓"
            },
            {
                id: "resp-notice-2",
                title: "Bem-vindo à ONFACE",
                message: "Este é um ambiente demonstrativo de acompanhamento escolar.",
                date: "2026-11-01",
                read: false,
                icon: "i"
            }
        ]
        : [
            {
                id: "aluno-notice-1",
                title: "Confira sua frequência",
                message: "Consulte os registros de presença e ausência no seu painel.",
                date: "2026-11-02",
                read: false,
                icon: "✓"
            },
            {
                id: "aluno-notice-2",
                title: "Bem-vindo à ONFACE",
                message: "Este é um ambiente demonstrativo para acompanhar sua rotina escolar.",
                date: "2026-11-01",
                read: true,
                icon: "i"
            }
        ];

    let notifications = loadNotifications();

    function escapeHTML(value) {
        return String(value ?? "").replace(/[&<>"']/g, char => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[char]);
    }

  async function carregarAlunosResponsavel() {
    if (role !== "responsavel") return;

    const container = $("#guardian-children-list");
    if (!container) return;

    try {
        const resposta = await fetch(
            "http://127.0.0.1:5000/api/responsavel/alunos",
            {
                method: "GET",
                credentials: "include"
            }
        );

        const dados = await resposta.json();
        alunosResponsavel = Array.isArray(dados.alunos)
    ? dados.alunos
    : [];

        if (!resposta.ok || !dados.sucesso) {
            throw new Error(
                dados.mensagem || "Não foi possível carregar os alunos."
            );
        }

        if (!dados.alunos.length) {
            container.innerHTML =
                '<p class="portal-empty">Nenhum aluno vinculado a esta conta.</p>';
            return;
        }

        container.innerHTML = dados.alunos.map(aluno => {
            const iniciais = aluno.nome
                .trim()
                .split(/\s+/)
                .slice(0, 2)
                .map(parte => parte.charAt(0))
                .join("")
                .toUpperCase();

            return `
                <div class="portal-child-card">
                    <div class="portal-child-avatar">
                        ${escapeHTML(iniciais)}
                    </div>

                    <div class="portal-child-info">
                        <span>ALUNO VINCULADO</span>
                        <h2>${escapeHTML(aluno.nome)}</h2>
                        <p>Matrícula: ${escapeHTML(
                            aluno.matricula || "Não informada"
                        )}</p>
                    </div>

                    <span class="portal-status-badge">
                        ${escapeHTML(aluno.status || "—")}
                    </span>
                </div>
            `;
        }).join("");

    } catch (erro) {
        console.error("Erro ao carregar alunos vinculados:", erro);

        container.innerHTML =
            '<p class="portal-empty">Não foi possível carregar os alunos. Atualize a página e tente novamente.</p>';
    }
}
function preencherSeletorAlunosResponsavel() {
    const seletor = $("#guardian-student-filter");

    if (!seletor) return;

    const alunoSelecionado = seletor.value;

    seletor.innerHTML = `
        <option value="">Todos os alunos</option>
    `;

    alunosResponsavel.forEach(aluno => {
        const opcao = document.createElement("option");

        opcao.value = aluno.id_aluno;
        opcao.textContent = aluno.nome;

        seletor.appendChild(opcao);
    });

    // Mantém a seleção anterior, caso ainda exista.
    if (
        alunoSelecionado &&
        alunosResponsavel.some(
            aluno => String(aluno.id_aluno) === alunoSelecionado
        )
    ) {
        seletor.value = alunoSelecionado;
    }
}

    function readArray(key) {
        try {
            const value = JSON.parse(localStorage.getItem(key) || "[]");
            return Array.isArray(value) ? value : [];
        } catch {
            return [];
        }
    }

    function localDateISO() {
        const now = new Date();
        return new Date(now.getTime() - now.getTimezoneOffset() * 60000)
            .toISOString().slice(0, 10);
    }

    function formatDate(date) {
        if (!date) return "—";
        const parts = date.split("-");
        return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : date;
    }

    function notify(message) {
        const toast = $("#portal-toast");
        if (!toast) return;

        toast.textContent = message;
        toast.classList.add("is-visible");

        clearTimeout(notify.timer);
        notify.timer = setTimeout(() => {
            toast.classList.remove("is-visible");
        }, 2800);
    }

    function loadNotifications() {
        try {
            const stored = JSON.parse(localStorage.getItem(NOTIFICATION_KEY) || "null");
            return Array.isArray(stored) ? stored : structuredClone(demoNotifications);
        } catch {
            return demoNotifications.map(item => ({ ...item }));
        }
    }

    function saveNotifications() {
        try {
            localStorage.setItem(NOTIFICATION_KEY, JSON.stringify(notifications));
        } catch {
            notify("Não foi possível salvar as notificações no navegador.");
        }
    }

    /* ======================================
       NAVEGAÇÃO
    ====================================== */

    function openView(name) {
        if (!sections[name]) return;

        $$(".portal-view").forEach(section => {
            section.classList.toggle("is-active", section.dataset.section === name);
        });

        $$(".portal-nav-link").forEach(button => {
            button.classList.toggle("is-active", button.dataset.view === name);
        });

        const title = $("#portal-current-section");
        if (title) title.textContent = sections[name];

        document.body.classList.remove("portal-menu-open");
        $("#portal-menu-toggle")?.setAttribute("aria-expanded", "false");

        if (name === "notificacoes") renderNotifications();
        if (name === "frequencia") renderHistory();
    }

    $$(".portal-nav-link").forEach(button => {
        button.addEventListener("click", () => openView(button.dataset.view));
    });

    $$("[data-open-view]").forEach(button => {
        button.addEventListener("click", () => openView(button.dataset.openView));
    });

    $("#portal-menu-toggle")?.addEventListener("click", () => {
        const opened = document.body.classList.toggle("portal-menu-open");
        $("#portal-menu-toggle").setAttribute("aria-expanded", String(opened));
    });

    /* ======================================
   ENCERRAR SESSÃO
====================================== */

$$("[data-logout]").forEach(button => {
    button.addEventListener("click", async () => {

        button.disabled = true;

        try {
            const resposta = await fetch("http://127.0.0.1:5000/api/logout", {
                method: "POST",
                credentials: "include"
            });

            const dados = await resposta.json();

            if (!resposta.ok || !dados.sucesso) {
                throw new Error(dados.mensagem || "Não foi possível encerrar a sessão.");
            }

            // Limpa os dados temporários do navegador.
            sessionStorage.removeItem("onface_usuario");

            // Retorna à página de login.
            window.location.replace("../login.html");

        } catch (erro) {
            console.error("Erro ao encerrar sessão:", erro);
            notify("Não foi possível sair. Tente novamente.");
            button.disabled = false;
        }
    });
});

    $("#portal-mobile-overlay")?.addEventListener("click", () => {
        document.body.classList.remove("portal-menu-open");
        $("#portal-menu-toggle")?.setAttribute("aria-expanded", "false");
    });

    /* ======================================
       DATA E NOME
    ====================================== */

    const today = new Date();
    const dateElement = $("#portal-current-date");

    if (dateElement) {
        dateElement.textContent = today.toLocaleDateString("pt-BR", {
            weekday: "short",
            day: "2-digit",
            month: "short",
            year: "numeric"
        });
    }

    const greetingName = usuarioLogado.nome;

const greeting = $(`#${prefix}-greeting`);
if (greeting) greeting.textContent = greetingName;

// Atualiza o nome exibido na identificação lateral.
const sidebarName = $(".portal-user-mini strong");

if (sidebarName) {
    sidebarName.textContent = usuarioLogado.nome;
}

    /* ======================================
       CONVERTER LISTAS DE PRESENÇA
    ====================================== */

    function statusFromAdmin(value) {
        if (value === "presente" || value === "ausente" || value === "atrasado") {
            return value;
        }
        return "pendente";
    }

    function formatTime(value) {
        if (!value) return "—";
        return String(value);
    }

    function convertAttendanceLists() {
        const lists = readArray(ATTENDANCE_KEY);
        const rows = [];

        lists.forEach(list => {
            const students = Array.isArray(list.students) ? list.students : [];

            students.forEach(student => {
                /*
                  Demonstração: só exibe o aluno fictício configurado.
                  Na versão real, essa identificação deve vir do servidor
                  e da sessão autenticada, nunca de um filtro controlado
                  pelo próprio usuário.
                */
                if (!student.name || student.name.toLocaleLowerCase("pt-BR") !== "lucas almeida") {
                    return;
                }

                rows.push({
                    date: list.date || "",
                    subject: subjectFromList(list),
                    teacher: list.teacher || "—",
                    time: formatTime(list.time || list.startTime),
                    status: statusFromAdmin(student.status),
                    note: student.note || "",
                    source: "sistema"
                });
            });
        });

        return rows;
    }

    function subjectFromList(list) {
        if (list.subjectName) return list.subjectName;

        const map = {
            matematica: "Matemática",
            portugues: "Língua Portuguesa",
            historia: "História",
            geografia: "Geografia",
            ciencias: "Ciências",
            informatica: "Informática"
        };

        return map[list.subjectId] || "Disciplina";
    }

    function getAttendanceRows() {
    // No painel do responsável, utiliza somente os dados recebidos do Flask.
    if (role === "responsavel") {
    const registros = Array.isArray(frequenciaResponsavel)
        ? frequenciaResponsavel
        : [];

    const seletor = $("#guardian-student-filter");
    const alunoSelecionado = seletor ? seletor.value : "";

    if (!alunoSelecionado) {
        return registros;
    }

    return registros.filter(registro =>
        String(registro.studentId) === alunoSelecionado
    );
}

    // No painel do aluno, mantém o comportamento atual.
    const stored = convertAttendanceLists();

    return stored.length
        ? stored.sort((a, b) => b.date.localeCompare(a.date))
        : demoAttendance.map(row => ({ ...row, source: "exemplo" }));
}

async function carregarFrequenciaResponsavel() {
    if (role !== "responsavel") return;

    try {
        const resposta = await fetch(
            "http://127.0.0.1:5000/api/responsavel/frequencia",
            {
                method: "GET",
                credentials: "include"
            }
        );

        const dados = await resposta.json();

        if (!resposta.ok || !dados.sucesso) {
            throw new Error(
                dados.mensagem || "Não foi possível carregar a frequência."
            );
        }

        frequenciaResponsavel = dados.registros.map(registro => ({
            studentId: registro.id_aluno,
            date: registro.data_aula,
            subject: registro.disciplina,
            teacher: "—",
            time: registro.horario_inicio
                ? registro.horario_inicio.slice(0, 5)
                : "—",
            status: registro.situacao.toLowerCase(),
            note: registro.justificativa || "",
            student: registro.aluno,
            className: registro.turma,
            source: "banco"
        }));

        renderMetrics();
        renderRecent();
        renderHistory();

    } catch (erro) {
        console.error("Erro ao carregar frequência:", erro);
        notify("Não foi possível carregar a frequência do banco de dados.");
    }
}

    function getFilteredRows() {
        const rows = getAttendanceRows();
        const start = $(`#${prefix}-date-start`)?.value || "";
        const end = $(`#${prefix}-date-end`)?.value || "";
        const status = $(`#${prefix}-status-filter`)?.value || "";

        return rows.filter(row => {
            if (start && row.date < start) return false;
            if (end && row.date > end) return false;
            if (status && row.status !== status) return false;
            return true;
        });
    }

    function getCounts(rows) {
        const recorded = rows.filter(row =>
            ["presente", "ausente", "atrasado"].includes(row.status)
        );

        const present = recorded.filter(row => row.status === "presente").length;
        const absent = recorded.filter(row => row.status === "ausente").length;
        const late = recorded.filter(row => row.status === "atrasado").length;
        const total = recorded.length;
        const rate = total ? Math.round(((present + late) / total) * 100) : null;

        return { present, absent, late, total, rate };
    }

    function statusLabel(status) {
        return ({
            presente: "Presente",
            ausente: "Ausente",
            atrasado: "Atrasado",
            pendente: "Não registrada"
        })[status] || "Não registrada";
    }

    function statusPill(status) {
        return `<span class="portal-pill ${escapeHTML(status)}">${escapeHTML(statusLabel(status))}</span>`;
    }

    function renderMetrics() {
        const rows = getAttendanceRows();
        const counts = getCounts(rows);

        $(`#${prefix}-present`)?.replaceChildren(document.createTextNode(String(counts.present + counts.late)));
        $(`#${prefix}-absent`)?.replaceChildren(document.createTextNode(String(counts.absent)));
        $(`#${prefix}-rate`)?.replaceChildren(document.createTextNode(
            counts.rate === null ? "—" : `${counts.rate}%`
        ));
        $(`#${prefix}-total`)?.replaceChildren(document.createTextNode(String(counts.total)));
    }

    function renderRecent() {
        const rows = getAttendanceRows().slice(0, 5);
        const table = $(`#${prefix}-recent-table`);
        if (!table) return;

        table.innerHTML = rows.length ? rows.map(row => `
            <tr>
                <td>${escapeHTML(formatDate(row.date))}</td>
                <td>${escapeHTML(row.subject)}</td>
                <td>${statusPill(row.status)}</td>
            </tr>
        `).join("") : `
            <tr><td colspan="3" class="portal-empty">Nenhum registro encontrado.</td></tr>
        `;
    }

    function renderHistory() {
        const rows = getFilteredRows();
        const table = $(`#${prefix}-history-table`);
        if (!table) return;

        table.innerHTML = rows.length ? rows.map(row => `
            <tr>
                <td>${escapeHTML(formatDate(row.date))}</td>
                <td>${escapeHTML(row.subject)}</td>
                <td>${escapeHTML(row.teacher || "—")}</td>
                <td>${escapeHTML(row.time || "—")}</td>
                <td>${statusPill(row.status)}</td>
                <td>${escapeHTML(row.note || "—")}</td>
            </tr>
        `).join("") : `
            <tr><td colspan="6" class="portal-empty">Nenhum registro corresponde aos filtros selecionados.</td></tr>
        `;
    }

    $(`#${prefix}-filter-apply`)?.addEventListener("click", renderHistory);

    $(`#${prefix}-filter-reset`)?.addEventListener("click", () => {
        $(`#${prefix}-date-start`).value = "";
        $(`#${prefix}-date-end`).value = "";
        $(`#${prefix}-status-filter`).value = "";
        renderHistory();
    });

    /* ======================================
       DISCIPLINAS
    ====================================== */

    function renderSubjects() {
        const container = $(`#${prefix}-subjects`);
        if (!container) return;

        container.innerHTML = subjects.map(subject => `
            <article class="portal-subject-card">
                <div class="portal-subject-icon">${escapeHTML(subject.icon)}</div>
                <h3>${escapeHTML(subject.name)}</h3>
                <p>${escapeHTML(subject.teacher)}</p>
            </article>
        `).join("");
    }

    /* ======================================
       NOTIFICAÇÕES
    ====================================== */

    function renderNotificationCount() {
        const count = notifications.filter(item => !item.read).length;
        const element = $(`#${prefix}-notification-count`);

        if (element) {
            element.textContent = String(count);
            element.hidden = count === 0;
        }
    }

    function renderNotificationMarkup(items) {
        if (!items.length) {
            return '<div class="portal-notice"><div class="portal-notice-content"><strong>Tudo em dia!</strong><p>Você não tem notificações.</p></div></div>';
        }

        return items.map(item => `
            <article class="portal-notice ${item.read ? "" : "is-unread"}">
                <div class="portal-notice-icon">${escapeHTML(item.icon || "i")}</div>
                <div class="portal-notice-content">
                    <strong>${escapeHTML(item.title)}</strong>
                    <p>${escapeHTML(item.message)}</p>
                    <small>${escapeHTML(formatDate(item.date))}${item.read ? " · Lida" : " · Não lida"}</small>
                </div>
            </article>
        `).join("");
    }

    function renderNotifications() {
        const list = $(`#${prefix}-notification-list`);
        if (list) list.innerHTML = renderNotificationMarkup(notifications);

        const home = $(`#${prefix}-home-notifications`);
        if (home) home.innerHTML = renderNotificationMarkup(notifications.slice(0, 2));

        renderNotificationCount();
    }

    $(`#${prefix}-read-all`)?.addEventListener("click", () => {
        notifications = notifications.map(item => ({ ...item, read: true }));
        saveNotifications();
        renderNotifications();
        notify("Notificações marcadas como lidas.");
    });

    /* ======================================
       INICIALIZAÇÃO
    ====================================== */

    function refreshPortal() {
        renderMetrics();
        renderRecent();
        renderHistory();
        renderSubjects();
        renderNotifications();

       if (role === "responsavel") {
    carregarAlunosResponsavel().then(() => {
        preencherSeletorAlunosResponsavel();
        carregarFrequenciaResponsavel();
    });
}
    }

const seletorAluno = $("#guardian-student-filter");

if (seletorAluno) {
    seletorAluno.addEventListener("change", () => {
        renderMetrics();
        renderRecent();
        renderHistory();
    });
}

    refreshPortal();

    // Atualiza a interface se outra página do mesmo sistema alterar as listas.
    window.addEventListener("storage", event => {
        if (event.key === ATTENDANCE_KEY) {
            renderMetrics();
            renderRecent();
            renderHistory();
        }

        if (event.key === NOTIFICATION_KEY) {
            notifications = loadNotifications();
            renderNotifications();
        }
    });

    window.ONFACEPortalDemo = {
        refresh: refreshPortal,
        getRole: () => role,
        getAttendance: getAttendanceRows
    };
})();