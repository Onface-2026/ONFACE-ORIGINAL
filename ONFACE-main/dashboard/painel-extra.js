/* ==========================================
   ONFACE — PAINEL ADMINISTRATIVO EXTRA
   Relatórios + Usuários + Configurações
   Demonstração local com localStorage
========================================== */

(() => {
    "use strict";

    const ATTENDANCE_KEY = "onface_demo_attendance_v1";
    const USERS_KEY = "onface_demo_admin_users_v1";
    const SETTINGS_KEY = "onface_demo_settings_v1";

    const $ = (selector, root = document) => root.querySelector(selector);
    const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

    const roleNames = {
        admin: "Administrador",
        coordenador: "Coordenador",
        professor: "Professor",
        secretaria: "Secretaria / TI",
        responsavel: "Responsável"
    };

    const demoClasses = [
        { id: "turma-1a", name: "1º Ano A" },
        { id: "turma-1b", name: "1º Ano B" },
        { id: "turma-2a", name: "2º Ano A" },
        { id: "turma-3a", name: "3º Ano A" }
    ];

    const demoSubjects = {
        matematica: "Matemática",
        portugues: "Língua Portuguesa",
        historia: "História",
        geografia: "Geografia",
        ciencias: "Ciências",
        informatica: "Informática"
    };

    const defaultSettings = {
        schoolName: "",
        schoolCode: "",
        schoolEmail: "",
        schoolPhone: "",
        minAttendance: 75,
        lateTolerance: 10,
        requireJustification: true,
        editFinished: false,
        notifyAbsence: true,
        weeklySummary: false,
        adminAlerts: true,
        sessionTimeout: "30",
        primaryColor: "#017697"
    };

    let users = loadUsers();
    let settings = loadSettings();
    let editingUserId = null;

    /* --------------------------------------
       UTILITÁRIOS
    -------------------------------------- */

    function escapeHTML(value) {
        return String(value ?? "").replace(/[&<>"']/g, char => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[char]);
    }

    function localDateISO() {
        const date = new Date();
        return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
            .toISOString().slice(0, 10);
    }

    function formatDate(value) {
        if (!value) return "—";
        const parts = value.split("-");
        return parts.length === 3
            ? `${parts[2]}/${parts[1]}/${parts[0]}`
            : value;
    }

    function readArray(key) {
        try {
            const data = JSON.parse(localStorage.getItem(key) || "[]");
            return Array.isArray(data) ? data : [];
        } catch (error) {
            console.error(`Erro ao ler ${key}:`, error);
            return [];
        }
    }

    function notify(message) {
        const toast = $("#toast");

        if (toast) {
            toast.textContent = message;
            toast.classList.add("show");
            toast.setAttribute("role", "status");

            clearTimeout(notify.timer);
            notify.timer = setTimeout(() => toast.classList.remove("show"), 3000);
        } else {
            alert(message);
        }
    }

    function saveJSON(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error(`Erro ao salvar ${key}:`, error);
            notify("Não foi possível salvar os dados no navegador.");
            return false;
        }
    }

    function className(id) {
        return demoClasses.find(item => item.id === id)?.name || "Turma não identificada";
    }

    function subjectName(id) {
        return demoSubjects[id] || "Disciplina não identificada";
    }

    function attendanceCounts(list) {
        const students = Array.isArray(list.students) ? list.students : [];
        return {
            total: students.length,
            present: students.filter(s => s.status === "presente").length,
            absent: students.filter(s => s.status === "ausente").length,
            late: students.filter(s => s.status === "atrasado").length,
            pending: students.filter(s => s.status === "pendente").length
        };
    }

    function attendanceRate(list) {
        const c = attendanceCounts(list);
        const totalRecorded = c.present + c.absent + c.late;
        return totalRecorded
            ? Math.round(((c.present + c.late) / totalRecorded) * 100)
            : null;
    }

    function loadUsers() {
        const stored = readArray(USERS_KEY);
        if (stored.length) return stored;

        // Contas inteiramente fictícias para demonstrar a interface.
        const initial = [
            {
                id: "demo-user-1",
                name: "Administrador ONFACE",
                email: "admin.demo@example.com",
                role: "admin",
                status: "ativo",
                createdAt: "2026-10-01"
            },
            {
                id: "demo-user-2",
                name: "Carolina Mendes",
                email: "carolina.demo@example.com",
                role: "coordenador",
                status: "ativo",
                createdAt: "2026-10-03"
            },
            {
                id: "demo-user-3",
                name: "Roberto Lima",
                email: "roberto.demo@example.com",
                role: "professor",
                status: "ativo",
                createdAt: "2026-10-05"
            },
            {
                id: "demo-user-4",
                name: "Patrícia Alves",
                email: "patricia.demo@example.com",
                role: "secretaria",
                status: "inativo",
                createdAt: "2026-10-10"
            },
            {
                id: "demo-user-5",
                name: "Marcos Souza",
                email: "marcos.demo@example.com",
                role: "responsavel",
                status: "ativo",
                createdAt: "2026-10-15"
            }
        ];

        saveJSON(USERS_KEY, initial);
        return initial;
    }

    function loadSettings() {
        try {
            const stored = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}");
            return { ...defaultSettings, ...stored };
        } catch (error) {
            return { ...defaultSettings };
        }
    }

    /* ======================================
       RELATÓRIOS
    ====================================== */

    const report = {
        start: $("#report-start-date"),
        end: $("#report-end-date"),
        classFilter: $("#report-class-filter"),
        status: $("#report-status-filter"),
        table: $("#report-table-body"),
        summary: $("#report-class-summary")
    };

    function populateReportClasses() {
        if (!report.classFilter) return;

        report.classFilter.innerHTML =
            '<option value="">Todas as turmas</option>' +
            demoClasses.map(item =>
                `<option value="${escapeHTML(item.id)}">${escapeHTML(item.name)}</option>`
            ).join("");
    }

    function getReportLists() {
        const lists = readArray(ATTENDANCE_KEY);
        const start = report.start?.value || "";
        const end = report.end?.value || "";
        const classId = report.classFilter?.value || "";
        const status = report.status?.value || "";

        return lists.filter(list => {
            if (start && list.date < start) return false;
            if (end && list.date > end) return false;
            if (classId && list.classId !== classId) return false;
            if (status && list.status !== status) return false;
            return true;
        }).sort((a, b) => (b.date || "").localeCompare(a.date || ""));
    }

    function renderReports() {
        const lists = getReportLists();

        let totalPresent = 0;
        let totalAbsent = 0;
        let totalLate = 0;

        lists.forEach(list => {
            const c = attendanceCounts(list);
            totalPresent += c.present;
            totalAbsent += c.absent;
            totalLate += c.late;
        });

        const recorded = totalPresent + totalAbsent + totalLate;
        const rate = recorded
            ? Math.round(((totalPresent + totalLate) / recorded) * 100)
            : null;

        $("#report-lists-count")?.replaceChildren(document.createTextNode(String(lists.length)));
        $("#report-present-count")?.replaceChildren(document.createTextNode(String(totalPresent + totalLate)));
        $("#report-absent-count")?.replaceChildren(document.createTextNode(String(totalAbsent)));
        $("#report-attendance-rate")?.replaceChildren(document.createTextNode(rate === null ? "—" : `${rate}%`));

        const label = $("#report-results-label");
        if (label) label.textContent = `Registros encontrados: ${lists.length}`;

        if (report.table) {
            report.table.innerHTML = lists.length ? lists.map(list => {
                const c = attendanceCounts(list);
                const percentage = attendanceRate(list);
                const finished = list.status === "finalizada";

                return `
                    <tr>
                        <td>${escapeHTML(formatDate(list.date))}</td>
                        <td>${escapeHTML(className(list.classId))}</td>
                        <td>${escapeHTML(subjectName(list.subjectId))}</td>
                        <td>${escapeHTML(list.teacher || "—")}</td>
                        <td>${c.present + c.late}</td>
                        <td>${c.absent}</td>
                        <td>
                            <span class="extra-pill ${percentage !== null && percentage < 75 ? "extra-pill-danger" : "extra-pill-success"}">
                                ${percentage === null ? "—" : `${percentage}%`}
                            </span>
                        </td>
                        <td>
                            <span class="extra-pill ${finished ? "extra-pill-success" : "extra-pill-warning"}">
                                ${finished ? "Finalizada" : "Em andamento"}
                            </span>
                        </td>
                    </tr>`;
            }).join("") : `
                <tr><td colspan="8" class="extra-empty">
                    Nenhum registro encontrado para os filtros selecionados.
                </td></tr>`;
        }

        renderClassSummary(lists);
    }

    function renderClassSummary(lists) {
        if (!report.summary) return;

        const grouped = {};

        lists.forEach(list => {
            if (!grouped[list.classId]) {
                grouped[list.classId] = {
                    count: 0,
                    present: 0,
                    absent: 0,
                    late: 0
                };
            }

            const c = attendanceCounts(list);
            grouped[list.classId].count++;
            grouped[list.classId].present += c.present;
            grouped[list.classId].absent += c.absent;
            grouped[list.classId].late += c.late;
        });

        const entries = Object.entries(grouped);

        if (!entries.length) {
            report.summary.innerHTML =
                '<p class="extra-empty">Não há dados para montar o resumo por turma.</p>';
            return;
        }

        report.summary.innerHTML = entries.map(([id, data]) => {
            const total = data.present + data.absent + data.late;
            const rate = total
                ? Math.round(((data.present + data.late) / total) * 100)
                : null;

            return `
                <article class="report-class-card">
                    <div class="report-class-card-top">
                        <div>
                            <strong>${escapeHTML(className(id))}</strong><br>
                            <small>${data.count} lista(s)</small>
                        </div>
                        <strong>${rate === null ? "—" : `${rate}%`}</strong>
                    </div>
                    <div class="report-progress" aria-label="Taxa de frequência">
                        <span style="width:${rate === null ? 0 : rate}%"></span>
                    </div>
                </article>`;
        }).join("");
    }

    function exportReports() {
        const lists = getReportLists();

        if (!lists.length) {
            notify("Não há dados para exportar.");
            return;
        }

        const rows = [[
            "Data", "Turma", "Disciplina", "Professor", "Aluno",
            "Matrícula", "Frequência", "Observação", "Situação da chamada"
        ]];

        lists.forEach(list => {
            (list.students || []).forEach(student => {
                rows.push([
                    formatDate(list.date),
                    className(list.classId),
                    subjectName(list.subjectId),
                    list.teacher || "",
                    student.name || "",
                    student.registration || "",
                    ({
                        presente: "Presente",
                        ausente: "Ausente",
                        atrasado: "Atrasado",
                        pendente: "Não registrada"
                    })[student.status] || student.status || "",
                    student.note || "",
                    list.status === "finalizada" ? "Finalizada" : "Em andamento"
                ]);
            });
        });

        downloadCSV(rows, `onface-relatorio-${localDateISO()}.csv`);
        notify("Relatório exportado.");
    }

    function downloadCSV(rows, filename) {
        const content = "\uFEFF" + rows.map(row =>
            row.map(value => `"${String(value ?? "").replace(/"/g, '""')}"`).join(";")
        ).join("\r\n");

        const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
    }

    $("#report-apply")?.addEventListener("click", renderReports);

    $("#report-reset")?.addEventListener("click", () => {
        if (report.start) report.start.value = "";
        if (report.end) report.end.value = "";
        if (report.classFilter) report.classFilter.value = "";
        if (report.status) report.status.value = "";
        renderReports();
    });

    $("#report-export")?.addEventListener("click", exportReports);

    /* ======================================
       USUÁRIOS E ACESSOS
    ====================================== */

    function getFilteredUsers() {
        const search = ($("#users-search")?.value || "").trim().toLocaleLowerCase("pt-BR");
        const role = $("#users-role-filter")?.value || "";
        const status = $("#users-status-filter")?.value || "";

        return users.filter(user => {
            const text = `${user.name} ${user.email}`.toLocaleLowerCase("pt-BR");

            if (search && !text.includes(search)) return false;
            if (role && user.role !== role) return false;
            if (status && user.status !== status) return false;
            return true;
        }).sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
    }

    function renderUsers() {
        const filtered = getFilteredUsers();

        $("#users-total")?.replaceChildren(document.createTextNode(String(users.length)));
        $("#users-active")?.replaceChildren(document.createTextNode(String(users.filter(u => u.status === "ativo").length)));
        $("#users-inactive")?.replaceChildren(document.createTextNode(String(users.filter(u => u.status === "inativo").length)));
        $("#users-profiles")?.replaceChildren(document.createTextNode(String(new Set(users.map(u => u.role)).size)));

        const body = $("#users-table-body");
        if (!body) return;

        if (!filtered.length) {
            body.innerHTML = '<tr><td colspan="6" class="extra-empty">Nenhum usuário encontrado.</td></tr>';
            return;
        }

        body.innerHTML = filtered.map(user => `
            <tr>
                <td><strong>${escapeHTML(user.name)}</strong></td>
                <td>${escapeHTML(user.email)}</td>
                <td>${escapeHTML(roleNames[user.role] || user.role)}</td>
                <td>
                    <span class="extra-pill ${user.status === "ativo" ? "extra-pill-success" : "extra-pill-danger"}">
                        ${user.status === "ativo" ? "Ativo" : "Inativo"}
                    </span>
                </td>
                <td>${escapeHTML(formatDate(user.createdAt))}</td>
                <td>
                    <div class="extra-row-actions">
                        <button type="button" class="extra-action-btn"
                            data-user-action="edit" data-id="${escapeHTML(user.id)}">
                            Editar
                        </button>
                        <button type="button" class="extra-action-btn ${user.status === "ativo" ? "danger" : ""}"
                            data-user-action="toggle" data-id="${escapeHTML(user.id)}">
                            ${user.status === "ativo" ? "Desativar" : "Ativar"}
                        </button>
                    </div>
                </td>
            </tr>`).join("");
    }

    function openUserModal(user = null) {
        editingUserId = user?.id || null;

        $("#user-modal-title").textContent = user ? "Editar usuário" : "Cadastrar usuário";
        $("#user-id").value = user?.id || "";
        $("#user-name").value = user?.name || "";
        $("#user-email").value = user?.email || "";
        $("#user-role").value = user?.role || "";
        $("#user-status").value = user?.status || "ativo";

        const modal = $("#user-modal");
        modal?.classList.add("is-open");
        modal?.setAttribute("aria-hidden", "false");
        document.body.style.overflow = "hidden";
        $("#user-name")?.focus();
    }

    function closeUserModal() {
        const modal = $("#user-modal");
        modal?.classList.remove("is-open");
        modal?.setAttribute("aria-hidden", "true");

        if (!document.querySelector(".extra-modal.is-open, .attendance-modal.is-open")) {
            document.body.style.overflow = "";
        }
    }

    $("#user-create-open")?.addEventListener("click", () => openUserModal());

    $("#user-form")?.addEventListener("submit", event => {
        event.preventDefault();

        const name = $("#user-name").value.trim();
        const email = $("#user-email").value.trim().toLowerCase();
        const role = $("#user-role").value;
        const status = $("#user-status").value;

        if (!name || !email || !role) {
            notify("Preencha os campos obrigatórios.");
            return;
        }

        const duplicate = users.some(user =>
            user.email.toLowerCase() === email && user.id !== editingUserId
        );

        if (duplicate) {
            notify("Já existe um usuário com esse e-mail.");
            return;
        }

        const previous = users;
        const existing = users.find(user => user.id === editingUserId);

        if (existing) {
            users = users.map(user => user.id === editingUserId
                ? { ...user, name, email, role, status }
                : user
            );
        } else {
            users.push({
                id: `demo-user-${Date.now()}`,
                name,
                email,
                role,
                status,
                createdAt: localDateISO()
            });
        }

        if (!saveJSON(USERS_KEY, users)) {
            users = previous;
            return;
        }

        closeUserModal();
        renderUsers();
        notify(existing ? "Usuário atualizado." : "Usuário cadastrado.");
    });

    $("#users-table-body")?.addEventListener("click", event => {
        const button = event.target.closest("[data-user-action]");
        if (!button) return;

        const user = users.find(item => item.id === button.dataset.id);
        if (!user) return;

        if (button.dataset.userAction === "edit") {
            openUserModal(user);
            return;
        }

        if (button.dataset.userAction === "toggle") {
            const nextStatus = user.status === "ativo" ? "inativo" : "ativo";

            if (!confirm(`${nextStatus === "inativo" ? "Desativar" : "Ativar"} a conta de ${user.name}?`)) {
                return;
            }

            const previous = users;
            users = users.map(item => item.id === user.id
                ? { ...item, status: nextStatus }
                : item
            );

            if (!saveJSON(USERS_KEY, users)) {
                users = previous;
                return;
            }

            renderUsers();
            notify(`Conta ${nextStatus === "ativo" ? "ativada" : "desativada"} na demonstração.`);
        }
    });

    $$("#user-modal [data-user-modal-close]").forEach(button => {
        button.addEventListener("click", closeUserModal);
    });

    $("#users-search")?.addEventListener("input", renderUsers);
    $("#users-role-filter")?.addEventListener("change", renderUsers);
    $("#users-status-filter")?.addEventListener("change", renderUsers);

    $("#users-reset")?.addEventListener("click", () => {
        $("#users-search").value = "";
        $("#users-role-filter").value = "";
        $("#users-status-filter").value = "";
        renderUsers();
    });

    /* ======================================
       CONFIGURAÇÕES
    ====================================== */

    function applyPrimaryColor(color) {
        if (!/^#[0-9a-fA-F]{6}$/.test(color)) return;

        document.documentElement.style.setProperty("--onface-primary", color);

        const picker = $("#setting-primary-color");
        const hex = $("#setting-primary-hex");
        const preview = $("#settings-preview-mark");

        if (picker && picker.value.toLowerCase() !== color.toLowerCase()) {
            picker.value = color;
        }

        if (hex && hex.value.toLowerCase() !== color.toLowerCase()) {
            hex.value = color;
        }

        if (preview) preview.style.backgroundColor = color;
    }

    function fillSettingsForm() {
        $("#setting-school-name").value = settings.schoolName;
        $("#setting-school-code").value = settings.schoolCode;
        $("#setting-school-email").value = settings.schoolEmail;
        $("#setting-school-phone").value = settings.schoolPhone;

        $("#setting-min-attendance").value = settings.minAttendance;
        $("#setting-late-tolerance").value = settings.lateTolerance;
        $("#setting-require-justification").checked = Boolean(settings.requireJustification);
        $("#setting-edit-finished").checked = Boolean(settings.editFinished);

        $("#setting-notify-absence").checked = Boolean(settings.notifyAbsence);
        $("#setting-weekly-summary").checked = Boolean(settings.weeklySummary);
        $("#setting-admin-alerts").checked = Boolean(settings.adminAlerts);

        $("#setting-session-timeout").value = String(settings.sessionTimeout);
        $("#setting-primary-color").value = settings.primaryColor;
        $("#setting-primary-hex").value = settings.primaryColor;

        applyPrimaryColor(settings.primaryColor);
    }

    function collectSettings() {
        const schoolName = $("#setting-school-name").value.trim();
        const schoolEmail = $("#setting-school-email").value.trim();
        const minAttendance = Number($("#setting-min-attendance").value);
        const lateTolerance = Number($("#setting-late-tolerance").value);
        const primaryColor = $("#setting-primary-hex").value.trim();

        if (!schoolName) {
            notify("Informe o nome da escola.");
            return null;
        }

        if (schoolEmail && !$("#setting-school-email").checkValidity()) {
            notify("Informe um e-mail institucional válido.");
            return null;
        }

        if (!Number.isFinite(minAttendance) || minAttendance < 0 || minAttendance > 100) {
            notify("O percentual mínimo deve estar entre 0 e 100.");
            return null;
        }

        if (!Number.isFinite(lateTolerance) || lateTolerance < 0 || lateTolerance > 180) {
            notify("A tolerância de atraso deve estar entre 0 e 180 minutos.");
            return null;
        }

        if (!/^#[0-9a-fA-F]{6}$/.test(primaryColor)) {
            notify("Informe uma cor hexadecimal válida, como #017697.");
            return null;
        }

        return {
            schoolName,
            schoolCode: $("#setting-school-code").value.trim(),
            schoolEmail,
            schoolPhone: $("#setting-school-phone").value.trim(),
            minAttendance,
            lateTolerance,
            requireJustification: $("#setting-require-justification").checked,
            editFinished: $("#setting-edit-finished").checked,
            notifyAbsence: $("#setting-notify-absence").checked,
            weeklySummary: $("#setting-weekly-summary").checked,
            adminAlerts: $("#setting-admin-alerts").checked,
            sessionTimeout: $("#setting-session-timeout").value,
            primaryColor
        };
    }

    function saveSettings(event) {
        event?.preventDefault();

        const next = collectSettings();
        if (!next) return;

        if (!saveJSON(SETTINGS_KEY, next)) return;

        settings = next;
        applyPrimaryColor(settings.primaryColor);
        notify("Configurações salvas neste navegador.");
    }

    $$("#page-configuracoes [data-settings-tab]").forEach(button => {
        button.addEventListener("click", () => {
            const target = button.dataset.settingsTab;

            $$("#page-configuracoes [data-settings-tab]").forEach(item => {
                item.classList.toggle("is-active", item === button);
            });

            $$("#page-configuracoes [data-settings-section]").forEach(section => {
                section.classList.toggle(
                    "is-active",
                    section.dataset.settingsSection === target
                );
            });
        });
    });

    $("#settings-form")?.addEventListener("submit", saveSettings);
    $("#settings-save-top")?.addEventListener("click", saveSettings);

    $("#setting-primary-color")?.addEventListener("input", event => {
        const color = event.target.value;
        $("#setting-primary-hex").value = color;
        applyPrimaryColor(color);
    });

    $("#setting-primary-hex")?.addEventListener("input", event => {
        const color = event.target.value.trim();
        if (/^#[0-9a-fA-F]{6}$/.test(color)) {
            applyPrimaryColor(color);
        }
    });

    $("#settings-reset")?.addEventListener("click", () => {
        if (!confirm("Restaurar as configurações padrão?")) return;

        settings = { ...defaultSettings };

        if (!saveJSON(SETTINGS_KEY, settings)) return;

        fillSettingsForm();
        notify("Preferências padrão restauradas.");
    });

    /* ======================================
       ATUALIZAÇÃO AO NAVEGAR
    ====================================== */

    function refreshExtraPages() {
        renderReports();
        renderUsers();
        fillSettingsForm();
    }

    // O dashboard existente usa links data-page.
    // Ao abrir uma das três abas, atualizamos seus dados.
    document.addEventListener("click", event => {
        const link = event.target.closest("[data-page]");
        if (!link) return;

        const page = link.dataset.page;

        if (page === "relatorios") renderReports();
        if (page === "usuarios") renderUsers();
        if (page === "configuracoes") fillSettingsForm();
    });

    // Permite consultar os dados da demonstração durante o desenvolvimento.
    window.ONFACEAdminDemo = {
        refresh: refreshExtraPages,
        getUsers: () => JSON.parse(JSON.stringify(users)),
        getSettings: () => JSON.parse(JSON.stringify(settings)),
        getReports: getReportLists
    };

    populateReportClasses();
    fillSettingsForm();
    renderReports();
    renderUsers();
})();