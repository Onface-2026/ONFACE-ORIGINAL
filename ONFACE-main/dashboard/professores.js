document.addEventListener("DOMContentLoaded", () => {
    const $ = (selector) => document.querySelector(selector);

    const TEACHER_KEY = "onface_demo_teachers_v1";
    const SUBJECT_KEY = "onface_demo_subjects_v1";

    const defaultTeachers = [
        {
            id: "prof-001",
            name: "Ana Oliveira",
            registration: "PROF001",
            email: "ana.oliveira@example.com",
            phone: "(21) 90000-0001",
            education: "Licenciatura em Matemática",
            status: "Ativo",
            subjectIds: ["disc-001"],
            notes: ""
        },
        {
            id: "prof-002",
            name: "Carlos Santos",
            registration: "PROF002",
            email: "carlos.santos@example.com",
            phone: "(21) 90000-0002",
            education: "Licenciatura em Letras",
            status: "Ativo",
            subjectIds: ["disc-002"],
            notes: ""
        },
        {
            id: "prof-003",
            name: "Mariana Costa",
            registration: "PROF003",
            email: "mariana.costa@example.com",
            phone: "(21) 90000-0003",
            education: "Licenciatura em Ciências",
            status: "Inativo",
            subjectIds: ["disc-003"],
            notes: ""
        },
        {
            id: "prof-004",
            name: "Pedro Almeida",
            registration: "PROF004",
            email: "pedro.almeida@example.com",
            phone: "(21) 90000-0004",
            education: "Licenciatura em História",
            status: "Ativo",
            subjectIds: ["disc-004", "disc-005"],
            notes: ""
        }
    ];

    function escapeHTML(value) {
        return String(value ?? "").replace(/[&<>"']/g, (character) => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[character]);
    }

    function loadArray(key, fallback) {
        try {
            const stored = localStorage.getItem(key);

            if (stored === null) {
                localStorage.setItem(key, JSON.stringify(fallback));
                return fallback.map((item) => ({ ...item }));
            }

            const parsed = JSON.parse(stored);

            return Array.isArray(parsed) ? parsed : fallback.map((item) => ({ ...item }));
        } catch (error) {
            console.warn(`Não foi possível carregar ${key}:`, error);
            return fallback.map((item) => ({ ...item }));
        }
    }

    let teachers = loadArray(TEACHER_KEY, defaultTeachers);
    let subjects = loadArray(SUBJECT_KEY, []);
    let selectedTeacherId = null;

    function saveTeachers() {
        localStorage.setItem(TEACHER_KEY, JSON.stringify(teachers));
    }

    function saveSubjects() {
        localStorage.setItem(SUBJECT_KEY, JSON.stringify(subjects));
    }

    function notify(message) {
        const toast = $("#toast");

        if (!toast) {
            alert(message);
            return;
        }

        toast.textContent = message;
        toast.classList.add("show");

        clearTimeout(notify.timeout);

        notify.timeout = setTimeout(() => {
            toast.classList.remove("show");
        }, 3000);
    }

    function makeId() {
        return `prof-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    }

    function initials(name) {
        return String(name || "")
            .trim()
            .split(/\s+/)
            .slice(0, 2)
            .map((part) => part.charAt(0))
            .join("")
            .toUpperCase();
    }

    function getTeacherSubjects(teacher) {
        return (teacher.subjectIds || [])
            .map((id) => subjects.find((subject) => subject.id === id))
            .filter(Boolean);
    }

    function openModal(id) {
        const modal = document.getElementById(id);
        if (!modal) return;

        modal.hidden = false;
        document.body.style.overflow = "hidden";
    }

    function closeModal(id) {
        const modal = document.getElementById(id);
        if (!modal) return;

        modal.hidden = true;

        const anyOpen =
            document.querySelector(".teacher-modal-overlay:not([hidden])") ||
            document.querySelector(".academic-modal-overlay:not([hidden])");

        if (!anyOpen) {
            document.body.style.overflow = "";
        }
    }

    document.querySelectorAll("[data-close-teacher-modal]").forEach((button) => {
        button.addEventListener("click", () => {
            document.querySelectorAll(".teacher-modal-overlay:not([hidden])")
                .forEach((modal) => closeModal(modal.id));
        });
    });

    document.querySelectorAll(".teacher-modal-overlay").forEach((modal) => {
        modal.addEventListener("click", (event) => {
            if (event.target === modal) closeModal(modal.id);
        });
    });

    document.addEventListener("keydown", (event) => {
        if (event.key !== "Escape") return;

        document.querySelectorAll(".teacher-modal-overlay:not([hidden])")
            .forEach((modal) => closeModal(modal.id));
    });

    /* =========================================
       INDICADORES
    ========================================= */

    function renderStats() {
        $("#teacher-total").textContent = teachers.length;

        $("#teacher-active-total").textContent = teachers.filter(
            (teacher) => teacher.status === "Ativo"
        ).length;

        const assignedSubjects = new Set();

        teachers
            .filter((teacher) => teacher.status === "Ativo")
            .forEach((teacher) => {
                (teacher.subjectIds || []).forEach((id) => {
                    if (subjects.some((subject) => subject.id === id)) {
                        assignedSubjects.add(id);
                    }
                });
            });

        $("#teacher-assigned-total").textContent = assignedSubjects.size;
    }

    /* =========================================
       FILTRO DE DISCIPLINAS
    ========================================= */

    function populateSubjectFilter() {
        const select = $("#teacher-subject-filter");
        if (!select) return;

        const previousValue = select.value;

        select.replaceChildren(new Option("Todas as disciplinas", ""));

        subjects
            .slice()
            .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))
            .forEach((subject) => {
                select.add(new Option(subject.name, subject.id));
            });

        if ([...select.options].some((option) => option.value === previousValue)) {
            select.value = previousValue;
        }
    }

    /* =========================================
       LISTAGEM DE PROFESSORES
    ========================================= */

    function renderTeachers() {
        const body = $("#teacher-table-body");
        if (!body) return;

        populateSubjectFilter();

        const query = ($("#teacher-search").value || "")
            .trim()
            .toLocaleLowerCase("pt-BR");

        const status = $("#teacher-status-filter").value;
        const subjectId = $("#teacher-subject-filter").value;

        const filtered = teachers
            .filter((teacher) => {
                const searchable = [
                    teacher.name,
                    teacher.registration,
                    teacher.email
                ].join(" ").toLocaleLowerCase("pt-BR");

                const matchesQuery = searchable.includes(query);
                const matchesStatus = !status || teacher.status === status;
                const matchesSubject = !subjectId ||
                    (teacher.subjectIds || []).includes(subjectId);

                return matchesQuery && matchesStatus && matchesSubject;
            })
            .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

        body.innerHTML = filtered.map((teacher) => {
            const teacherSubjects = getTeacherSubjects(teacher);

            const subjectsHTML = teacherSubjects.length
                ? teacherSubjects.map((subject) =>
                    `<span class="teacher-subject-tag">${escapeHTML(subject.name)}</span>`
                ).join("")
                : '<span class="teacher-registration-tag">Não atribuída</span>';

            const statusClass = teacher.status === "Ativo" ? "active" : "inactive";

            return `
                <tr>
                    <td>
                        <div class="teacher-person-cell">
                            <div class="teacher-avatar">${escapeHTML(initials(teacher.name))}</div>
                            <div>
                                <div class="teacher-person-name">${escapeHTML(teacher.name)}</div>
                                <div class="teacher-person-email">${escapeHTML(teacher.email)}</div>
                            </div>
                        </div>
                    </td>

                    <td>
                        <span class="teacher-registration-tag">
                            ${escapeHTML(teacher.registration)}
                        </span>
                    </td>

                    <td>${escapeHTML(teacher.phone || "Não informado")}</td>

                    <td>
                        <div class="teacher-subject-list">${subjectsHTML}</div>
                    </td>

                    <td>
                        <span class="teacher-status ${statusClass}">
                            ${escapeHTML(teacher.status)}
                        </span>
                    </td>

                    <td>
                        <div class="teacher-actions">
                            <button
                                type="button"
                                data-action="view"
                                data-id="${escapeHTML(teacher.id)}"
                                title="Visualizar"
                                aria-label="Visualizar ${escapeHTML(teacher.name)}"
                            >◉</button>

                            <button
                                type="button"
                                data-action="edit"
                                data-id="${escapeHTML(teacher.id)}"
                                title="Editar"
                                aria-label="Editar ${escapeHTML(teacher.name)}"
                            >✎</button>

                            <button
                                type="button"
                                data-action="delete"
                                data-id="${escapeHTML(teacher.id)}"
                                title="Excluir"
                                aria-label="Excluir ${escapeHTML(teacher.name)}"
                            >⌫</button>
                        </div>
                    </td>
                </tr>
            `;
        }).join("");

        $("#teacher-empty-state").hidden = filtered.length > 0;

        $("#teacher-table-summary").textContent =
            `Exibindo ${filtered.length} de ${teachers.length} professor(es)`;

        renderStats();
    }

    $("#teacher-search")?.addEventListener("input", renderTeachers);
    $("#teacher-status-filter")?.addEventListener("change", renderTeachers);
    $("#teacher-subject-filter")?.addEventListener("change", renderTeachers);

    $("#teacher-clear-filters")?.addEventListener("click", () => {
        $("#teacher-search").value = "";
        $("#teacher-status-filter").value = "";
        $("#teacher-subject-filter").value = "";
        renderTeachers();
    });

    /* =========================================
       OPÇÕES DE DISCIPLINAS NO FORMULÁRIO
    ========================================= */

    function renderSubjectOptions(selectedIds = []) {
        const container = $("#teacher-subject-options");
        if (!container) return;

        if (!subjects.length) {
            container.innerHTML = `
                <p>Nenhuma disciplina encontrada. Cadastre disciplinas na área Turmas e disciplinas.</p>
            `;
            return;
        }

        container.innerHTML = subjects
            .slice()
            .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))
            .map((subject) => `
                <label class="teacher-checkbox-option">
                    <input
                        type="checkbox"
                        name="teacher-subjects"
                        value="${escapeHTML(subject.id)}"
                        ${selectedIds.includes(subject.id) ? "checked" : ""}
                    >
                    <span>${escapeHTML(subject.name)}</span>
                </label>
            `)
            .join("");
    }

    /* =========================================
       CADASTRO E EDIÇÃO
    ========================================= */

    function openTeacherForm(teacher = null) {
        $("#teacher-form").reset();

        $("#teacher-id").value = teacher?.id || "";
        $("#teacher-modal-title").textContent = teacher
            ? "Editar professor"
            : "Cadastrar professor";

        $("#teacher-name").value = teacher?.name || "";
        $("#teacher-registration").value = teacher?.registration || "";
        $("#teacher-email").value = teacher?.email || "";
        $("#teacher-phone").value = teacher?.phone || "";
        $("#teacher-education").value = teacher?.education || "";
        $("#teacher-status").value = teacher?.status || "Ativo";
        $("#teacher-notes").value = teacher?.notes || "";

        renderSubjectOptions(teacher?.subjectIds || []);

        openModal("teacher-modal");
    }

    $("#open-teacher-modal")?.addEventListener("click", () => {
        openTeacherForm();
    });

    $("#teacher-form")?.addEventListener("submit", (event) => {
        event.preventDefault();

        const id = $("#teacher-id").value;
        const name = $("#teacher-name").value.trim();
        const registration = $("#teacher-registration").value.trim();
        const email = $("#teacher-email").value.trim();
        const phone = $("#teacher-phone").value.trim();
        const education = $("#teacher-education").value.trim();
        const status = $("#teacher-status").value;
        const notes = $("#teacher-notes").value.trim();

        const subjectIds = [
            ...document.querySelectorAll('input[name="teacher-subjects"]:checked')
        ].map((input) => input.value);

        if (!name || !registration || !email) {
            notify("Preencha os campos obrigatórios.");
            return;
        }

        const duplicateRegistration = teachers.some((teacher) =>
            teacher.registration.toLocaleLowerCase("pt-BR") ===
                registration.toLocaleLowerCase("pt-BR") &&
            teacher.id !== id
        );

        if (duplicateRegistration) {
            notify("Já existe um professor com essa matrícula.");
            return;
        }

        const duplicateEmail = teachers.some((teacher) =>
            teacher.email.toLocaleLowerCase("pt-BR") ===
                email.toLocaleLowerCase("pt-BR") &&
            teacher.id !== id
        );

        if (duplicateEmail) {
            notify("Esse e-mail já está associado a outro professor.");
            return;
        }

        const updatedTeacher = {
            id: id || makeId(),
            name,
            registration,
            email,
            phone,
            education,
            status,
            subjectIds,
            notes
        };

        if (id) {
            teachers = teachers.map((teacher) =>
                teacher.id === id ? updatedTeacher : teacher
            );
        } else {
            teachers.push(updatedTeacher);
        }

        /*
         * Atualiza o campo informativo "teacher" nas disciplinas.
         * Esta versão não substitui um vínculo de professor no banco de dados.
         */
        const previousTeacher = teachers.find((teacher) => teacher.id === id);

        subjects = subjects.map((subject) => {
            const isAssigned = subjectIds.includes(subject.id);

            if (isAssigned) {
                return { ...subject, teacher: name };
            }

            /*
             * Só limpa o nome antigo quando ele corresponde ao professor editado.
             * A relação continua sendo apenas demonstrativa.
             */
            if (id && previousTeacher && subject.teacher === previousTeacher.name) {
                return { ...subject, teacher: "" };
            }

            return subject;
        });

        saveTeachers();
        saveSubjects();

        closeModal("teacher-modal");
        renderTeachers();

        notify(id ? "Cadastro do professor atualizado!" : "Professor cadastrado!");
    });

    /* =========================================
       VISUALIZAR DETALHES
    ========================================= */

    function showTeacherDetails(teacher) {
        selectedTeacherId = teacher.id;

        $("#teacher-details-title").textContent = teacher.name;

        const teacherSubjects = getTeacherSubjects(teacher)
            .map((subject) => subject.name)
            .join(", ") || "Nenhuma disciplina atribuída";

        const details = [
            ["Nome completo", teacher.name],
            ["Matrícula", teacher.registration],
            ["E-mail institucional", teacher.email],
            ["Telefone", teacher.phone || "Não informado"],
            ["Formação acadêmica", teacher.education || "Não informada"],
            ["Situação", teacher.status],
            ["Disciplinas", teacherSubjects],
            ["Observações", teacher.notes || "Nenhuma observação."]
        ];

        $("#teacher-details-content").innerHTML = details.map(([label, value]) => `
            <div class="teacher-detail-item ${label === "Disciplinas" || label === "Observações" ? "teacher-detail-full" : ""}">
                <span>${escapeHTML(label)}</span>
                <strong>${escapeHTML(value)}</strong>
            </div>
        `).join("");

        openModal("teacher-details-modal");
    }

    $("#teacher-edit-details")?.addEventListener("click", () => {
        const teacher = teachers.find((item) => item.id === selectedTeacherId);

        closeModal("teacher-details-modal");

        if (teacher) openTeacherForm(teacher);
    });

    /* =========================================
       EXCLUSÃO
    ========================================= */

    function deleteTeacher(id) {
        const teacher = teachers.find((item) => item.id === id);
        if (!teacher) return;

        const confirmed = confirm(
            `Deseja excluir o cadastro de ${teacher.name}?\n\nEssa ação remove o professor da lista demonstrativa.`
        );

        if (!confirmed) return;

        /*
         * As disciplinas permanecem cadastradas.
         * O nome do professor é removido apenas quando corresponde
         * ao professor que está sendo excluído.
         */
        subjects = subjects.map((subject) => ({
            ...subject,
            teacher: subject.teacher === teacher.name ? "" : subject.teacher
        }));

        teachers = teachers.filter((item) => item.id !== id);

        saveTeachers();
        saveSubjects();
        renderTeachers();

        notify("Professor excluído da demonstração.");
    }

    $("#teacher-table-body")?.addEventListener("click", (event) => {
        const button = event.target.closest("button[data-action]");
        if (!button) return;

        const teacher = teachers.find((item) => item.id === button.dataset.id);
        if (!teacher) return;

        switch (button.dataset.action) {
            case "view":
                showTeacherDetails(teacher);
                break;

            case "edit":
                openTeacherForm(teacher);
                break;

            case "delete":
                deleteTeacher(teacher.id);
                break;
        }
    });

    /* =========================================
       INICIALIZAÇÃO
    ========================================= */

    renderStats();
    renderTeachers();
});