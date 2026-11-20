
/* ==========================================
   ONFACE — LISTAS DE PRESENÇA
   Versão de demonstração com localStorage
========================================== */

(() => {
    "use strict";

    const STORAGE_KEY = "onface_demo_attendance_v1";
    const CLASS_KEY = "onface_demo_classes_v1";
    const SUBJECT_KEY = "onface_demo_subjects_v1";

    const $ = (selector, root = document) => root.querySelector(selector);

    const elements = {
        page: $("#page-presencas"),
        totalLists: $("#attendance-total-lists"),
        totalPresent: $("#attendance-total-present"),
        totalAbsent: $("#attendance-total-absent"),
        rate: $("#attendance-rate"),
        search: $("#attendance-search"),
        classFilter: $("#attendance-class-filter"),
        statusFilter: $("#attendance-status-filter"),
        dateFilter: $("#attendance-date-filter"),
        clearFilters: $("#attendance-clear-filters"),
        tableBody: $("#attendance-table-body"),
        resultsCount: $("#attendance-results-count"),
        createButton: $("#create-attendance-btn"),
        createModal: $("#attendance-create-modal"),
        detailsModal: $("#attendance-details-modal"),
        createForm: $("#attendance-create-form"),
        createClass: $("#attendance-create-class"),
        createSubject: $("#attendance-create-subject"),
        createTeacher: $("#attendance-create-teacher"),
        createDate: $("#attendance-create-date"),
        createStart: $("#attendance-create-start"),
        createEnd: $("#attendance-create-end"),
        detailsTitle: $("#attendance-details-title"),
        detailsSubtitle: $("#attendance-details-subtitle"),
        detailsSummary: $("#attendance-details-summary"),
        studentSearch: $("#attendance-student-search"),
        studentsBody: $("#attendance-students-body"),
        markAllPresent: $("#attendance-mark-all-present"),
        saveButton: $("#attendance-save-btn"),
        finishButton: $("#attendance-finish-btn"),
        exportButton: $("#attendance-export-btn")
    };

    if (!elements.page) return;

    // Dados de exemplo. Substitua pelas consultas ao banco na integração real.
    const demoClasses = [
        { id: "turma-1a", name: "1º Ano A" },
        { id: "turma-1b", name: "1º Ano B" },
        { id: "turma-2a", name: "2º Ano A" },
        { id: "turma-3a", name: "3º Ano A" }
    ];

    const demoSubjects = [
        { id: "matematica", name: "Matemática" },
        { id: "portugues", name: "Língua Portuguesa" },
        { id: "historia", name: "História" },
        { id: "geografia", name: "Geografia" },
        { id: "ciencias", name: "Ciências" },
        { id: "informatica", name: "Informática" }
    ];

    const demoStudents = {
        "turma-1a": [
            { id: "aluno-001", name: "Lucas Almeida", registration: "2026001" },
            { id: "aluno-002", name: "Mariana Souza", registration: "2026002" },
            { id: "aluno-003", name: "Pedro Oliveira", registration: "2026003" },
            { id: "aluno-004", name: "Ana Clara Santos", registration: "2026004" },
            { id: "aluno-005", name: "Gabriel Costa", registration: "2026005" }
        ],
        "turma-1b": [
            { id: "aluno-006", name: "Beatriz Lima", registration: "2026006" },
            { id: "aluno-007", name: "Rafael Martins", registration: "2026007" },
            { id: "aluno-008", name: "Julia Ferreira", registration: "2026008" },
            { id: "aluno-009", name: "Felipe Rocha", registration: "2026009" }
        ],
        "turma-2a": [
            { id: "aluno-010", name: "Isabela Mendes", registration: "2026010" },
            { id: "aluno-011", name: "Matheus Ribeiro", registration: "2026011" },
            { id: "aluno-012", name: "Sofia Carvalho", registration: "2026012" },
            { id: "aluno-013", name: "Enzo Barros", registration: "2026013" }
        ],
        "turma-3a": [
            { id: "aluno-014", name: "Camila Nunes", registration: "2026014" },
            { id: "aluno-015", name: "João Pedro Alves", registration: "2026015" },
            { id: "aluno-016", name: "Laura Gomes", registration: "2026016" },
            { id: "aluno-017", name: "Bruno Dias", registration: "2026017" }
        ]
    };

    let attendanceLists = loadLists();
    let activeListId = null;
    let draftStudents = [];

    function loadLists() {
        try {
            const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
            return Array.isArray(saved) ? saved : [];
        } catch (error) {
            console.error("Não foi possível carregar as listas:", error);
            return [];
        }
    }

    function saveLists() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(attendanceLists));
            return true;
        } catch (error) {
            console.error("Não foi possível salvar as listas:", error);
            notify("Não foi possível salvar. Verifique o armazenamento do navegador.");
            return false;
        }
    }

    function escapeHTML(value) {
        return String(value ?? "").replace(/[&<>"']/g, char => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[char]);
    }

    function todayISO() {
        const now = new Date();
        const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
        return local.toISOString().slice(0, 10);
    }

    function formatDate(value) {
        if (!value) return "—";
        const parts = value.split("-");
        return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : value;
    }

    function getClassName(id) {
        return demoClasses.find(item => item.id === id)?.name || "Turma não identificada";
    }

    function getSubjectName(id) {
        return demoSubjects.find(item => item.id === id)?.name || "Disciplina não identificada";
    }

    function getCounts(list) {
        const students = list.students || [];
        return {
            total: students.length,
            present: students.filter(student => student.status === "presente").length,
            absent: students.filter(student => student.status === "ausente").length,
            late: students.filter(student => student.status === "atrasado").length,
            pending: students.filter(student => student.status === "pendente").length
        };
    }

    function getRate(list) {
        const counts = getCounts(list);
        const counted = counts.present + counts.absent + counts.late;
        if (!counted) return null;
        return Math.round(((counts.present + counts.late) / counted) * 100);
    }

    function notify(message) {
        const toast = document.getElementById("toast");

        if (toast) {
            toast.textContent = message;
            toast.classList.add("show");
            toast.setAttribute("role", "status");

            clearTimeout(notify.timer);
            notify.timer = setTimeout(() => {
                toast.classList.remove("show");
            }, 3000);
        } else {
            // Alternativa caso o dashboard não tenha componente de toast.
            console.info("[ONFACE]", message);
        }
    }

    function openModal(modal) {
        if (!modal) return;
        modal.classList.add("is-open");
        modal.setAttribute("aria-hidden", "false");
        document.body.style.overflow = "hidden";

        const firstInput = modal.querySelector("input, select, button");
        if (firstInput) setTimeout(() => firstInput.focus(), 30);
    }

    function closeModal(modal) {
        if (!modal) return;
        modal.classList.remove("is-open");
        modal.setAttribute("aria-hidden", "true");

        if (!document.querySelector(".attendance-modal.is-open")) {
            document.body.style.overflow = "";
        }
    }

    function populateOptions(select, items, firstLabel) {
        if (!select) return;

        select.innerHTML =
            `<option value="">${escapeHTML(firstLabel)}</option>` +
            items.map(item =>
                `<option value="${escapeHTML(item.id)}">${escapeHTML(item.name)}</option>`
            ).join("");
    }

    function populateClassOptions() {
        populateOptions(elements.classFilter, demoClasses, "Todas as turmas");
        populateOptions(elements.createClass, demoClasses, "Selecione uma turma");
    }

    function populateSubjectOptions() {
        populateOptions(elements.createSubject, demoSubjects, "Selecione uma disciplina");
    }

    function getFilteredLists() {
        const search = (elements.search?.value || "").trim().toLocaleLowerCase("pt-BR");
        const classId = elements.classFilter?.value || "";
        const status = elements.statusFilter?.value || "";
        const date = elements.dateFilter?.value || "";

        return attendanceLists
            .filter(list => {
                const searchable = [
                    getClassName(list.classId),
                    getSubjectName(list.subjectId),
                    list.teacher,
                    list.date
                ].join(" ").toLocaleLowerCase("pt-BR");

                if (search && !searchable.includes(search)) return false;
                if (classId && list.classId !== classId) return false;
                if (status && list.status !== status) return false;
                if (date && list.date !== date) return false;
                return true;
            })
            .sort((a, b) =>
                `${b.date}${b.createdAt || ""}`.localeCompare(`${a.date}${a.createdAt || ""}`)
            );
    }

    function renderStats(lists) {
        const counts = lists.reduce((result, list) => {
            const current = getCounts(list);
            result.present += current.present;
            result.absent += current.absent;
            result.late += current.late;
            result.pending += current.pending;
            return result;
        }, { present: 0, absent: 0, late: 0, pending: 0 });

        if (elements.totalLists) elements.totalLists.textContent = lists.length;
        if (elements.totalPresent) elements.totalPresent.textContent = counts.present + counts.late;
        if (elements.totalAbsent) elements.totalAbsent.textContent = counts.absent;

        const counted = counts.present + counts.absent + counts.late;
        if (elements.rate) {
            elements.rate.textContent = counted
                ? `${Math.round(((counts.present + counts.late) / counted) * 100)}%`
                : "—";
        }
    }

    function renderTable() {
        const lists = getFilteredLists();
        renderStats(lists);

        if (elements.resultsCount) {
            elements.resultsCount.textContent =
                `${lists.length} ${lists.length === 1 ? "lista encontrada" : "listas encontradas"}`;
        }

        if (!elements.tableBody) return;

        if (!lists.length) {
            elements.tableBody.innerHTML = `
                <tr>
                    <td colspan="9" class="attendance-empty">
                        Nenhuma lista encontrada. Clique em “Nova lista” para criar uma chamada.
                    </td>
                </tr>`;
            return;
        }

        elements.tableBody.innerHTML = lists.map(list => {
            const counts = getCounts(list);
            const rate = getRate(list);
            const finished = list.status === "finalizada";

            return `
                <tr>
                    <td>
                        <span class="attendance-main-cell">${escapeHTML(formatDate(list.date))}</span>
                        <span class="attendance-sub-cell">
                            ${escapeHTML(list.startTime || "Horário não informado")}
                            ${list.endTime ? "– " + escapeHTML(list.endTime) : ""}
                        </span>
                    </td>
                    <td>${escapeHTML(getClassName(list.classId))}</td>
                    <td>${escapeHTML(getSubjectName(list.subjectId))}</td>
                    <td>${escapeHTML(list.teacher)}</td>
                    <td>${counts.present + counts.late}</td>
                    <td>${counts.absent}</td>
                    <td>
                        <span class="attendance-frequency ${rate !== null && rate < 75 ? "low" : ""}">
                            ${rate === null ? "—" : rate + "%"}
                        </span>
                    </td>
                    <td>
                        <span class="attendance-status-badge ${finished ? "finished" : "open"}">
                            ${finished ? "Finalizada" : "Em andamento"}
                        </span>
                    </td>
                    <td>
                        <div class="attendance-row-actions">
                            <button type="button" class="attendance-action-btn"
                                data-attendance-action="view"
                                data-id="${escapeHTML(list.id)}">
                                ${finished ? "Visualizar" : "Abrir"}
                            </button>
                            <button type="button" class="attendance-action-btn delete"
                                data-attendance-action="delete"
                                data-id="${escapeHTML(list.id)}"
                                ${finished ? "disabled title='Listas finalizadas não podem ser excluídas por esta interface'" : ""}>
                                Excluir
                            </button>
                        </div>
                    </td>
                </tr>`;
        }).join("");
    }

    function createList(event) {
        event.preventDefault();

        const classId = elements.createClass.value;
        const subjectId = elements.createSubject.value;
        const teacher = elements.createTeacher.value.trim();
        const date = elements.createDate.value;
        const startTime = elements.createStart.value;
        const endTime = elements.createEnd.value;

        if (!classId || !subjectId || !teacher || !date) {
            notify("Preencha os campos obrigatórios.");
            return;
        }

        if (startTime && endTime && endTime <= startTime) {
            notify("O horário de término deve ser posterior ao horário de início.");
            return;
        }

        const duplicate = attendanceLists.some(list =>
            list.classId === classId &&
            list.subjectId === subjectId &&
            list.date === date &&
            list.startTime === startTime
        );

        if (duplicate && !confirm("Já existe uma lista para esta turma, disciplina, data e horário. Deseja criar outra?")) {
            return;
        }

        const students = (demoStudents[classId] || []).map(student => ({
            ...student,
            status: "pendente",
            note: ""
        }));

        if (!students.length) {
            notify("Não há alunos de demonstração cadastrados para esta turma.");
            return;
        }

        const newList = {
            id: `chamada-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            classId,
            subjectId,
            teacher,
            date,
            startTime,
            endTime,
            status: "aberta",
            createdAt: new Date().toISOString(),
            students
        };

        attendanceLists.unshift(newList);

        if (!saveLists()) {
            attendanceLists = attendanceLists.filter(list => list.id !== newList.id);
            return;
        }

        elements.createForm.reset();
        elements.createDate.value = todayISO();
        closeModal(elements.createModal);
        renderTable();
        openDetails(newList.id);

        notify("Lista criada! Registre a frequência dos alunos.");
    }

    function openDetails(id) {
        const list = attendanceLists.find(item => item.id === id);
        if (!list) {
            notify("Lista não encontrada.");
            return;
        }

        activeListId = id;
        draftStudents = (list.students || []).map(student => ({ ...student }));

        if (elements.detailsTitle) {
            elements.detailsTitle.textContent = `${getClassName(list.classId)} — ${getSubjectName(list.subjectId)}`;
        }

        if (elements.detailsSubtitle) {
            elements.detailsSubtitle.textContent =
                `${formatDate(list.date)} • Professor(a): ${list.teacher}` +
                (list.startTime ? ` • ${list.startTime}` : "");
        }

        if (elements.studentSearch) elements.studentSearch.value = "";

        const finished = list.status === "finalizada";

        if (elements.markAllPresent) elements.markAllPresent.disabled = finished;
        if (elements.saveButton) elements.saveButton.disabled = finished;
        if (elements.finishButton) elements.finishButton.disabled = finished;

        if (elements.finishButton) {
            elements.finishButton.textContent = finished ? "Chamada finalizada" : "Finalizar chamada";
        }

        renderStudentSummary();
        renderStudents();
        openModal(elements.detailsModal);
    }

    function renderStudentSummary() {
        const list = attendanceLists.find(item => item.id === activeListId);
        if (!list || !elements.detailsSummary) return;

        const counts = getCounts({ students: draftStudents });
        const rate = getRate({ students: draftStudents });

        elements.detailsSummary.innerHTML = `
            <div class="attendance-summary-item">
                <span>Total de alunos</span><strong>${counts.total}</strong>
            </div>
            <div class="attendance-summary-item">
                <span>Presentes</span><strong>${counts.present + counts.late}</strong>
            </div>
            <div class="attendance-summary-item">
                <span>Ausentes</span><strong>${counts.absent}</strong>
            </div>
            <div class="attendance-summary-item">
                <span>Frequência registrada</span><strong>${rate === null ? "—" : rate + "%"}</strong>
            </div>`;
    }

    function renderStudents() {
        if (!elements.studentsBody) return;

        const list = attendanceLists.find(item => item.id === activeListId);
        const finished = list?.status === "finalizada";
        const query = (elements.studentSearch?.value || "").trim().toLocaleLowerCase("pt-BR");

        const students = draftStudents.filter(student =>
            `${student.name} ${student.registration}`.toLocaleLowerCase("pt-BR").includes(query)
        );

        if (!students.length) {
            elements.studentsBody.innerHTML = `
                <tr><td colspan="4" class="attendance-empty">Nenhum aluno encontrado.</td></tr>`;
            return;
        }

        elements.studentsBody.innerHTML = students.map(student => `
            <tr>
                <td><span class="attendance-student-name">${escapeHTML(student.name)}</span></td>
                <td>${escapeHTML(student.registration)}</td>
                <td>
                    <select class="attendance-student-status"
                        data-student-status="${escapeHTML(student.id)}"
                        aria-label="Frequência de ${escapeHTML(student.name)}"
                        ${finished ? "disabled" : ""}>
                        <option value="pendente" ${student.status === "pendente" ? "selected" : ""}>Não registrada</option>
                        <option value="presente" ${student.status === "presente" ? "selected" : ""}>Presente</option>
                        <option value="ausente" ${student.status === "ausente" ? "selected" : ""}>Ausente</option>
                        <option value="atrasado" ${student.status === "atrasado" ? "selected" : ""}>Atrasado</option>
                    </select>
                </td>
                <td>
                    <input type="text"
                        class="attendance-student-note"
                        data-student-note="${escapeHTML(student.id)}"
                        value="${escapeHTML(student.note || "")}"
                        placeholder="Ex.: justificativa de falta"
                        maxlength="250"
                        aria-label="Observação de ${escapeHTML(student.name)}"
                        ${finished ? "disabled" : ""}>
                </td>
            </tr>
        `).join("");
    }

    function updateDraftFromControls(event) {
        const statusSelect = event.target.closest("[data-student-status]");
        const noteInput = event.target.closest("[data-student-note]");

        if (statusSelect) {
            const student = draftStudents.find(item => item.id === statusSelect.dataset.studentStatus);
            if (student) student.status = statusSelect.value;
            renderStudentSummary();
        }

        if (noteInput) {
            const student = draftStudents.find(item => item.id === noteInput.dataset.studentNote);
            if (student) student.note = noteInput.value;
        }
    }

    function saveCurrentList() {
        const index = attendanceLists.findIndex(item => item.id === activeListId);
        if (index < 0) return;

        if (attendanceLists[index].status === "finalizada") {
            notify("Esta chamada já foi finalizada.");
            return;
        }

        attendanceLists[index].students = draftStudents.map(student => ({ ...student }));

        if (!saveLists()) return;

        renderTable();
        renderStudentSummary();
        notify("Frequência salva com sucesso.");
    }

    function finishCurrentList() {
        const index = attendanceLists.findIndex(item => item.id === activeListId);
        if (index < 0) return;

        const list = attendanceLists[index];
        if (list.status === "finalizada") return;

        const pending = draftStudents.filter(student => student.status === "pendente").length;

        if (pending > 0) {
            const proceed = confirm(
                `${pending} aluno(s) ainda estão sem frequência registrada. ` +
                "Eles continuarão como “Não registrada”. Deseja finalizar mesmo assim?"
            );
            if (!proceed) return;
        } else if (!confirm("Deseja finalizar esta chamada? Após a finalização, a edição ficará bloqueada nesta interface.")) {
            return;
        }

        list.students = draftStudents.map(student => ({ ...student }));
        list.status = "finalizada";
        list.finishedAt = new Date().toISOString();

        if (!saveLists()) {
            list.status = "aberta";
            delete list.finishedAt;
            return;
        }

        renderTable();
        openDetails(list.id);
        notify("Chamada finalizada.");
    }

    function deleteList(id) {
        const list = attendanceLists.find(item => item.id === id);
        if (!list || list.status === "finalizada") return;

        if (!confirm(`Excluir a lista de ${getClassName(list.classId)} do dia ${formatDate(list.date)}? Esta ação não pode ser desfeita.`)) {
            return;
        }

        const previous = attendanceLists;
        attendanceLists = attendanceLists.filter(item => item.id !== id);

        if (!saveLists()) {
            attendanceLists = previous;
            return;
        }

        renderTable();
        notify("Lista excluída.");
    }

    function exportCSV() {
        const lists = getFilteredLists();

        if (!lists.length) {
            notify("Não há listas para exportar.");
            return;
        }

        const rows = [[
            "Data", "Horário inicial", "Horário final", "Turma", "Disciplina",
            "Professor", "Aluno", "Matrícula", "Frequência", "Observação", "Situação da chamada"
        ]];

        lists.forEach(list => {
            (list.students || []).forEach(student => {
                rows.push([
                    formatDate(list.date),
                    list.startTime || "",
                    list.endTime || "",
                    getClassName(list.classId),
                    getSubjectName(list.subjectId),
                    list.teacher,
                    student.name,
                    student.registration,
                    {
                        presente: "Presente",
                        ausente: "Ausente",
                        atrasado: "Atrasado",
                        pendente: "Não registrada"
                    }[student.status] || student.status,
                    student.note || "",
                    list.status === "finalizada" ? "Finalizada" : "Em andamento"
                ]);
            });
        });

        const csv = "\uFEFF" + rows.map(row =>
            row.map(value => `"${String(value ?? "").replace(/"/g, '""')}"`).join(";")
        ).join("\r\n");

        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = url;
        link.download = `onface-listas-presenca-${todayISO()}.csv`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);

        notify("Arquivo CSV exportado.");
    }

    // Eventos da página

    elements.createButton?.addEventListener("click", () => {
        elements.createForm.reset();
        elements.createDate.value = todayISO();
        openModal(elements.createModal);
    });

    elements.createForm?.addEventListener("submit", createList);

    [elements.search, elements.classFilter, elements.statusFilter, elements.dateFilter]
        .filter(Boolean)
        .forEach(element => {
            element.addEventListener("input", renderTable);
            element.addEventListener("change", renderTable);
        });

    elements.clearFilters?.addEventListener("click", () => {
        elements.search.value = "";
        elements.classFilter.value = "";
        elements.statusFilter.value = "";
        elements.dateFilter.value = "";
        renderTable();
    });

    elements.tableBody?.addEventListener("click", event => {
        const button = event.target.closest("[data-attendance-action]");
        if (!button || button.disabled) return;

        const { attendanceAction, id } = button.dataset;

        if (attendanceAction === "view") openDetails(id);
        if (attendanceAction === "delete") deleteList(id);
    });

    elements.studentsBody?.addEventListener("change", updateDraftFromControls);
    elements.studentsBody?.addEventListener("input", updateDraftFromControls);

    elements.studentSearch?.addEventListener("input", renderStudents);

    elements.markAllPresent?.addEventListener("click", () => {
        const list = attendanceLists.find(item => item.id === activeListId);
        if (!list || list.status === "finalizada") return;

        if (!confirm("Marcar todos os alunos desta turma como presentes?")) return;

        draftStudents = draftStudents.map(student => ({
            ...student,
            status: "presente"
        }));

        renderStudents();
        renderStudentSummary();
    });

    elements.saveButton?.addEventListener("click", saveCurrentList);
    elements.finishButton?.addEventListener("click", finishCurrentList);
    elements.exportButton?.addEventListener("click", exportCSV);

    document.querySelectorAll("[data-close-attendance-modal]").forEach(button => {
        button.addEventListener("click", () => {
            closeModal(button.closest(".attendance-modal"));
        });
    });

    document.addEventListener("keydown", event => {
        if (event.key === "Escape") {
            document.querySelectorAll(".attendance-modal.is-open")
                .forEach(closeModal);
        }
    });

    // Inicialização

    populateClassOptions();
    populateSubjectOptions();

    if (elements.createDate) elements.createDate.value = todayISO();

    renderTable();

    // Disponibiliza funções para diagnóstico no console durante o desenvolvimento.
    window.ONFACEAttendanceDemo = {
        reload: () => {
            attendanceLists = loadLists();
            renderTable();
        },
        clearDemoData: () => {
            if (!confirm("Apagar todas as listas de demonstração deste navegador?")) return;
            localStorage.removeItem(STORAGE_KEY);
            attendanceLists = [];
            renderTable();
            notify("Listas de demonstração apagadas.");
        },
        getLists: () => JSON.parse(JSON.stringify(attendanceLists))
    };
})();
