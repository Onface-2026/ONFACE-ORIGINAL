document.addEventListener("DOMContentLoaded", () => {
    const $ = (selector) => document.querySelector(selector);

    /* =========================================
       NAVEGAÇÃO DO DASHBOARD
    ========================================= */

    const sidebar = $("#sidebar");
    const overlay = $("#sidebar-overlay");
    const menuToggle = $("#menu-toggle");
    const sidebarClose = $("#sidebar-close");

    function closeSidebar() {
        sidebar?.classList.remove("open");
        overlay?.classList.remove("visible");
    }

    menuToggle?.addEventListener("click", () => {
        sidebar?.classList.toggle("open");
        overlay?.classList.toggle("visible");
    });

    sidebarClose?.addEventListener("click", closeSidebar);
    overlay?.addEventListener("click", closeSidebar);

    const pageTitles = {
        inicio: "Visão geral",
        alunos: "Alunos",
        professores: "Professores",
        turmas: "Turmas e disciplinas",
        presencas: "Listas de presença",
        relatorios: "Relatórios",
        usuarios: "Usuários e acessos",
        configuracoes: "Configurações"
    };

    function showPage(pageName) {
        const targetPage = document.getElementById(`page-${pageName}`);

        if (!targetPage) return;

        document.querySelectorAll(".dashboard-page").forEach((page) => {
            page.hidden = true;
            page.classList.remove("active");
        });

        targetPage.hidden = false;
        targetPage.classList.add("active");

        document.querySelectorAll(".nav-item[data-page]").forEach((item) => {
            item.classList.toggle("active", item.dataset.page === pageName);
        });

        const title = pageTitles[pageName] || "Painel administrativo";

        const pageTitle = $("#page-title");
        if (pageTitle) pageTitle.textContent = title;

        const breadcrumb = $(".breadcrumb");
        if (breadcrumb) breadcrumb.textContent = title;

        closeSidebar();

        if (pageName === "alunos") {
            renderStudents();
        }

        if (location.hash !== `#${pageName}`) {
            history.replaceState(null, "", `#${pageName}`);
        }
    }

    document.querySelectorAll(".nav-item[data-page]").forEach((item) => {
        item.addEventListener("click", (event) => {
            event.preventDefault();
            showPage(item.dataset.page);
        });
    });

    document.querySelectorAll('a[href^="#"]').forEach((link) => {
        if (link.classList.contains("nav-item")) return;

        link.addEventListener("click", (event) => {
            const pageName = link.getAttribute("href").slice(1);

            if (document.getElementById(`page-${pageName}`)) {
                event.preventDefault();
                showPage(pageName);
            }
        });
    });

    const initialPage = location.hash.replace("#", "");
    if (initialPage && document.getElementById(`page-${initialPage}`)) {
        showPage(initialPage);
    }

    /* =========================================
       DATA E NOTIFICAÇÕES
    ========================================= */

    const dateElement = $("#current-date");

    if (dateElement) {
        dateElement.textContent = new Intl.DateTimeFormat("pt-BR", {
            weekday: "long",
            day: "2-digit",
            month: "long",
            year: "numeric"
        }).format(new Date());
    }

    function showToast(message) {
        const toast = $("#toast");

        if (!toast) {
            alert(message);
            return;
        }

        toast.textContent = message;
        toast.classList.add("show");

        clearTimeout(showToast.timeout);

        showToast.timeout = setTimeout(() => {
            toast.classList.remove("show");
        }, 3000);
    }

    $("#notification-button")?.addEventListener("click", () => {
        showToast("Você está visualizando as notificações demonstrativas.");
    });

    $("#logout-button")?.addEventListener("click", () => {
        const confirmed = confirm("Deseja sair do painel administrativo?");

        if (confirmed) {
            window.location.href = "../login.html";
        }
    });

    /* =========================================
       GRÁFICOS DEMONSTRATIVOS
    ========================================= */

    if (typeof Chart !== "undefined") {
        const attendanceCanvas = $("#attendance-chart");

        if (attendanceCanvas) {
            new Chart(attendanceCanvas, {
                type: "bar",
                data: {
                    labels: ["Seg", "Ter", "Qua", "Qui", "Sex"],
                    datasets: [{
                        label: "Presenças",
                        data: [92, 96, 89, 98, 94],
                        backgroundColor: "#017697",
                        borderRadius: 6,
                        maxBarThickness: 35
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 100,
                            ticks: {
                                callback: (value) => `${value}%`
                            },
                            grid: { color: "#edf1f2" }
                        },
                        x: {
                            grid: { display: false }
                        }
                    }
                }
            });
        }

        const distributionCanvas = $("#distribution-chart");

        if (distributionCanvas) {
            new Chart(distributionCanvas, {
                type: "doughnut",
                data: {
                    labels: ["Ensino Fundamental", "Ensino Médio", "Educação Infantil"],
                    datasets: [{
                        data: [55, 30, 15],
                        backgroundColor: ["#017697", "#55b7c9", "#c8e8ed"],
                        borderWidth: 0,
                        hoverOffset: 5
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: "68%",
                    plugins: {
                        legend: {
                            position: "bottom",
                            labels: {
                                usePointStyle: true,
                                padding: 16
                            }
                        }
                    }
                }
            });
        }
    }

    /* =========================================
       GERENCIAMENTO DE ALUNOS
       Dados fictícios, armazenados no navegador.
    ========================================= */

    const STORAGE_KEY = "onface_demo_students_v1";

    const defaultStudents = [
        {
            id: "aluno-001",
            name: "Lucas Almeida",
            registration: "ONF2026001",
            className: "3ª Série EM A",
            status: "Ativo",
            notes: ""
        },
        {
            id: "aluno-002",
            name: "Mariana Costa",
            registration: "ONF2026002",
            className: "3ª Série EM A",
            status: "Ativo",
            notes: ""
        },
        {
            id: "aluno-003",
            name: "Gabriel Santos",
            registration: "ONF2026003",
            className: "9º Ano A",
            status: "Ativo",
            notes: ""
        },
        {
            id: "aluno-004",
            name: "Ana Beatriz Oliveira",
            registration: "ONF2026004",
            className: "6º Ano A",
            status: "Inativo",
            notes: "Cadastro demonstrativo."
        },
        {
            id: "aluno-005",
            name: "Pedro Henrique Souza",
            registration: "ONF2026005",
            className: "1ª Série EM A",
            status: "Ativo",
            notes: ""
        },
        {
            id: "aluno-006",
            name: "Isabela Martins",
            registration: "ONF2026006",
            className: "2º Ano A",
            status: "Ativo",
            notes: ""
        }
    ];

    function loadStudents() {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);

            if (stored === null) {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultStudents));
                return [...defaultStudents];
            }

            const parsed = JSON.parse(stored);

            return Array.isArray(parsed) ? parsed : [...defaultStudents];
        } catch (error) {
            console.warn("Não foi possível carregar os dados demonstrativos.", error);
            return [...defaultStudents];
        }
    }

    let students = loadStudents();
    let selectedStudentId = null;

    function saveStudents() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
        } catch (error) {
            console.error("Não foi possível salvar os dados no navegador.", error);
            showToast("Não foi possível salvar os dados demonstrativos.");
        }
    }

    const tableBody = $("#students-table-body");
    const searchInput = $("#student-search");
    const classFilter = $("#student-class-filter");
    const statusFilter = $("#student-status-filter");
    const emptyState = $("#students-empty-state");

    function escapeHTML(value) {
        return String(value ?? "").replace(/[&<>"']/g, (character) => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[character]);
    }

    function getInitials(name) {
        return String(name)
            .trim()
            .split(/\s+/)
            .slice(0, 2)
            .map((part) => part.charAt(0))
            .join("")
            .toUpperCase();
    }

    function populateClassFilter() {
        if (!classFilter) return;

        const selectedValue = classFilter.value;

        const classes = [...new Set(
            students.map((student) => student.className).filter(Boolean)
        )].sort((a, b) => a.localeCompare(b, "pt-BR"));

        classFilter.replaceChildren(new Option("Todas as turmas", ""));

        classes.forEach((className) => {
            classFilter.add(new Option(className, className));
        });

        if (classes.includes(selectedValue)) {
            classFilter.value = selectedValue;
        }
    }

    function renderStudentStats() {
        const total = students.length;
        const active = students.filter((student) => student.status === "Ativo").length;
        const classes = new Set(
            students.map((student) => student.className).filter(Boolean)
        );

        if ($("#total-students")) $("#total-students").textContent = total;
        if ($("#active-students")) $("#active-students").textContent = active;
        if ($("#total-classes")) $("#total-classes").textContent = classes.size;
    }

    function getFilteredStudents() {
        const query = (searchInput?.value || "").trim().toLocaleLowerCase("pt-BR");
        const selectedClass = classFilter?.value || "";
        const selectedStatus = statusFilter?.value || "";

        return students.filter((student) => {
            const matchesQuery =
                student.name.toLocaleLowerCase("pt-BR").includes(query) ||
                student.registration.toLocaleLowerCase("pt-BR").includes(query);

            const matchesClass =
                !selectedClass || student.className === selectedClass;

            const matchesStatus =
                !selectedStatus || student.status === selectedStatus;

            return matchesQuery && matchesClass && matchesStatus;
        }).sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
    }

    function renderStudents() {
        if (!tableBody) return;

        populateClassFilter();
        renderStudentStats();

        const filteredStudents = getFilteredStudents();

        tableBody.innerHTML = filteredStudents.map((student) => {
            const statusClass = student.status === "Ativo"
                ? "status-active"
                : "status-inactive";

            return `
                <tr>
                    <td>
                        <div class="student-identity">
                            <div class="student-avatar">
                                ${escapeHTML(getInitials(student.name))}
                            </div>
                            <div>
                                <div class="student-name">
                                    ${escapeHTML(student.name)}
                                </div>
                                <div class="student-subtitle">
                                    Cadastro escolar
                                </div>
                            </div>
                        </div>
                    </td>
                    <td>
                        <span class="student-registration">
                            ${escapeHTML(student.registration)}
                        </span>
                    </td>
                    <td>
                        <span class="student-class-tag">
                            ${escapeHTML(student.className)}
                        </span>
                    </td>
                    <td>
                        <span class="student-status-badge ${statusClass}">
                            ${escapeHTML(student.status)}
                        </span>
                    </td>
                    <td>
                        <div class="student-actions">
                            <button
                                type="button"
                                class="student-action-button"
                                data-action="view"
                                data-id="${escapeHTML(student.id)}"
                                aria-label="Visualizar ${escapeHTML(student.name)}"
                                title="Visualizar"
                            >◉</button>

                            <button
                                type="button"
                                class="student-action-button"
                                data-action="edit"
                                data-id="${escapeHTML(student.id)}"
                                aria-label="Editar ${escapeHTML(student.name)}"
                                title="Editar"
                            >✎</button>

                            <button
                                type="button"
                                class="student-action-button delete-action"
                                data-action="delete"
                                data-id="${escapeHTML(student.id)}"
                                aria-label="Excluir ${escapeHTML(student.name)}"
                                title="Excluir"
                            >⌫</button>
                        </div>
                    </td>
                </tr>
            `;
        }).join("");

        if (emptyState) {
            emptyState.hidden = filteredStudents.length > 0;
        }

        const count = filteredStudents.length;

        if ($("#student-results-count")) {
            $("#student-results-count").textContent =
                `${count} ${count === 1 ? "registro" : "registros"}`;
        }

        if ($("#student-table-summary")) {
            $("#student-table-summary").textContent =
                `Exibindo ${count} de ${students.length} alunos`;
        }
    }

    /* Formulário */

    const studentModal = $("#student-modal");
    const studentForm = $("#student-form");

    function openStudentModal(student = null) {
        if (!studentForm || !studentModal) return;

        studentForm.reset();

        $("#student-edit-id").value = student?.id || "";
        $("#student-modal-title").textContent = student
            ? "Editar aluno"
            : "Cadastrar aluno";

        $("#student-name").value = student?.name || "";
        $("#student-registration").value = student?.registration || "";
        $("#student-status").value = student?.status || "Ativo";
        $("#student-notes").value = student?.notes || "";

        populateClassFilter();

        const classSelect = $("#student-class");
        const className = student?.className || "";

        if (className && ![...classSelect.options].some((option) => option.value === className)) {
            classSelect.add(new Option(className, className));
        }

        classSelect.value = className;

        studentModal.hidden = false;
        document.body.style.overflow = "hidden";
        $("#student-name").focus();
    }

    function closeStudentModal() {
        if (studentModal) studentModal.hidden = true;

        if ($("#student-details-modal")?.hidden !== false) {
            document.body.style.overflow = "";
        }
    }

    $("#open-student-modal")?.addEventListener("click", () => {
        openStudentModal();
    });

    $("#close-student-modal")?.addEventListener("click", closeStudentModal);
    $("#cancel-student-form")?.addEventListener("click", closeStudentModal);

    studentModal?.addEventListener("click", (event) => {
        if (event.target === studentModal) closeStudentModal();
    });

    studentForm?.addEventListener("submit", (event) => {
        event.preventDefault();

        const id = $("#student-edit-id").value;
        const name = $("#student-name").value.trim();
        const registration = $("#student-registration").value.trim();
        const className = $("#student-class").value;
        const status = $("#student-status").value;
        const notes = $("#student-notes").value.trim();

        if (!name || !registration || !className) {
            showToast("Preencha todos os campos obrigatórios.");
            return;
        }

        const duplicate = students.some((student) =>
            student.registration.toLocaleLowerCase("pt-BR") ===
                registration.toLocaleLowerCase("pt-BR") &&
            student.id !== id
        );

        if (duplicate) {
            showToast("Já existe um aluno com essa matrícula.");
            $("#student-registration").focus();
            return;
        }

        if (id) {
            students = students.map((student) =>
                student.id === id
                    ? { ...student, name, registration, className, status, notes }
                    : student
            );

            showToast("Cadastro demonstrativo atualizado!");
        } else {
            students.push({
                id: `aluno-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                name,
                registration,
                className,
                status,
                notes
            });

            showToast("Aluno adicionado à demonstração!");
        }

        saveStudents();
        closeStudentModal();
        renderStudents();
    });

    /* Visualizar, editar e excluir */

    const detailsModal = $("#student-details-modal");

    function closeDetailsModal() {
        if (detailsModal) detailsModal.hidden = true;

        if (studentModal?.hidden !== false) {
            document.body.style.overflow = "";
        }
    }

    function showStudentDetails(student) {
        selectedStudentId = student.id;

        const detailsContent = $("#student-details-content");

        detailsContent.innerHTML = `
            <div class="detail-item">
                <span>Nome completo</span>
                <strong>${escapeHTML(student.name)}</strong>
            </div>
            <div class="detail-item">
                <span>Matrícula</span>
                <strong>${escapeHTML(student.registration)}</strong>
            </div>
            <div class="detail-item">
                <span>Turma</span>
                <strong>${escapeHTML(student.className)}</strong>
            </div>
            <div class="detail-item">
                <span>Situação</span>
                <strong>${escapeHTML(student.status)}</strong>
            </div>
            <div class="detail-item full-detail">
                <span>Observações</span>
                <strong>${escapeHTML(student.notes || "Nenhuma observação registrada.")}</strong>
            </div>
        `;

        detailsModal.hidden = false;
        document.body.style.overflow = "hidden";
    }

    $("#close-student-details")?.addEventListener("click", closeDetailsModal);
    $("#close-details-button")?.addEventListener("click", closeDetailsModal);

    detailsModal?.addEventListener("click", (event) => {
        if (event.target === detailsModal) closeDetailsModal();
    });

    $("#edit-details-button")?.addEventListener("click", () => {
        const student = students.find((item) => item.id === selectedStudentId);

        closeDetailsModal();

        if (student) openStudentModal(student);
    });

    tableBody?.addEventListener("click", (event) => {
        const button = event.target.closest("button[data-action]");

        if (!button) return;

        const student = students.find((item) => item.id === button.dataset.id);

        if (!student) return;

        if (button.dataset.action === "view") {
            showStudentDetails(student);
        }

        if (button.dataset.action === "edit") {
            openStudentModal(student);
        }

        if (button.dataset.action === "delete") {
            const confirmed = confirm(
                `Deseja excluir o cadastro demonstrativo de ${student.name}?`
            );

            if (!confirmed) return;

            students = students.filter((item) => item.id !== student.id);

            saveStudents();
            renderStudents();
            showToast("Cadastro demonstrativo excluído.");
        }
    });

    /* Pesquisa e filtros */

    searchInput?.addEventListener("input", renderStudents);
    classFilter?.addEventListener("change", renderStudents);
    statusFilter?.addEventListener("change", renderStudents);

    $("#clear-student-filters")?.addEventListener("click", () => {
        if (searchInput) searchInput.value = "";
        if (classFilter) classFilter.value = "";
        if (statusFilter) statusFilter.value = "";

        renderStudents();
    });

    /* Fechar modal com Escape */

    document.addEventListener("keydown", (event) => {
        if (event.key !== "Escape") return;

        if (detailsModal && !detailsModal.hidden) {
            closeDetailsModal();
        } else if (studentModal && !studentModal.hidden) {
            closeStudentModal();
        }
    });

    /* Primeira renderização */

    renderStudents();
});