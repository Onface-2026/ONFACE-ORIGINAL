document.addEventListener("DOMContentLoaded", () => {
    const $ = (selector) => document.querySelector(selector);

    const CLASS_KEY = "onface_demo_classes_v1";
    const SUBJECT_KEY = "onface_demo_subjects_v1";
    const STUDENT_KEY = "onface_demo_students_v1";

    const currentYear = new Date().getFullYear();

    const defaultClasses = [
        {
            id: "turma-001",
            name: "1º Ano A",
            level: "1º Ano do Fundamental",
            shift: "Manhã",
            year: currentYear,
            description: "Turma demonstrativa do Ensino Fundamental."
        },
        {
            id: "turma-002",
            name: "1º Ano B",
            level: "1º Ano do Fundamental",
            shift: "Tarde",
            year: currentYear,
            description: ""
        },
        {
            id: "turma-003",
            name: "6º Ano A",
            level: "6º Ano do Fundamental",
            shift: "Manhã",
            year: currentYear,
            description: ""
        },
        {
            id: "turma-004",
            name: "9º Ano A",
            level: "9º Ano do Fundamental",
            shift: "Tarde",
            year: currentYear,
            description: ""
        },
        {
            id: "turma-005",
            name: "1ª Série EM A",
            level: "1ª Série do Ensino Médio",
            shift: "Manhã",
            year: currentYear,
            description: ""
        },
        {
            id: "turma-006",
            name: "3ª Série EM A",
            level: "3ª Série do Ensino Médio",
            shift: "Manhã",
            year: currentYear,
            description: ""
        }
    ];

    const defaultSubjects = [
        {
            id: "disc-001",
            name: "Matemática",
            code: "MAT101",
            hours: 4,
            teacher: "Professor demonstrativo",
            classIds: ["turma-001", "turma-003", "turma-005"],
            description: ""
        },
        {
            id: "disc-002",
            name: "Língua Portuguesa",
            code: "POR101",
            hours: 5,
            teacher: "Professora demonstrativa",
            classIds: ["turma-001", "turma-002", "turma-004"],
            description: ""
        },
        {
            id: "disc-003",
            name: "Ciências",
            code: "CIE101",
            hours: 3,
            teacher: "",
            classIds: ["turma-003", "turma-004"],
            description: ""
        },
        {
            id: "disc-004",
            name: "História",
            code: "HIS101",
            hours: 2,
            teacher: "",
            classIds: ["turma-005", "turma-006"],
            description: ""
        },
        {
            id: "disc-005",
            name: "Geografia",
            code: "GEO101",
            hours: 2,
            teacher: "",
            classIds: ["turma-005", "turma-006"],
            description: ""
        }
    ];

    function readStorage(key, defaults) {
        try {
            const stored = localStorage.getItem(key);

            if (stored === null) {
                localStorage.setItem(key, JSON.stringify(defaults));
                return defaults.map((item) => ({ ...item }));
            }

            const data = JSON.parse(stored);

            return Array.isArray(data) ? data : defaults.map((item) => ({ ...item }));
        } catch (error) {
            console.warn(`Erro ao carregar ${key}`, error);
            return defaults.map((item) => ({ ...item }));
        }
    }

    let classes = readStorage(CLASS_KEY, defaultClasses);
    let subjects = readStorage(SUBJECT_KEY, defaultSubjects);
    let students = readStorage(STUDENT_KEY, []);

    let selectedType = null;
    let selectedId = null;

    function saveClasses() {
        localStorage.setItem(CLASS_KEY, JSON.stringify(classes));
    }

    function saveSubjects() {
        localStorage.setItem(SUBJECT_KEY, JSON.stringify(subjects));
    }

    function showMessage(message) {
        const toast = $("#toast");

        if (!toast) {
            alert(message);
            return;
        }

        toast.textContent = message;
        toast.classList.add("show");

        clearTimeout(showMessage.timeout);

        showMessage.timeout = setTimeout(() => {
            toast.classList.remove("show");
        }, 3000);
    }

    function escapeHTML(value) {
        return String(value ?? "").replace(/[&<>"']/g, (character) => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[character]);
    }

    function makeId(prefix) {
        return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    }

    function classById(id) {
        return classes.find((item) => item.id === id);
    }

    function classNames(ids) {
        return (ids || [])
            .map((id) => classById(id)?.name)
            .filter(Boolean);
    }

    function studentCount(className) {
        return students.filter((student) =>
            student.className === className ||
            student.turma === className
        ).length;
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

        if (!document.querySelector(".academic-modal-overlay:not([hidden])") &&
            !document.querySelector(".student-modal-overlay:not([hidden])")) {
            document.body.style.overflow = "";
        }
    }

    document.querySelectorAll("[data-close-modal]").forEach((button) => {
        button.addEventListener("click", () => {
            closeModal(button.dataset.closeModal);
        });
    });

    document.querySelectorAll(".academic-modal-overlay").forEach((modal) => {
        modal.addEventListener("click", (event) => {
            if (event.target === modal) closeModal(modal.id);
        });
    });

    document.addEventListener("keydown", (event) => {
        if (event.key !== "Escape") return;

        document.querySelectorAll(".academic-modal-overlay:not([hidden])")
            .forEach((modal) => closeModal(modal.id));
    });

    /* =========================================
       ABAS
    ========================================= */

    const tabClasses = $("#tab-classes");
    const tabSubjects = $("#tab-subjects");
    const classesPanel = $("#academic-classes-panel");
    const subjectsPanel = $("#academic-subjects-panel");

    function switchTab(tab) {
        const showingClasses = tab === "classes";

        tabClasses?.classList.toggle("active", showingClasses);
        tabSubjects?.classList.toggle("active", !showingClasses);

        tabClasses?.setAttribute("aria-selected", String(showingClasses));
        tabSubjects?.setAttribute("aria-selected", String(!showingClasses));

        if (classesPanel) classesPanel.hidden = !showingClasses;
        if (subjectsPanel) subjectsPanel.hidden = showingClasses;

        if (showingClasses) {
            renderClasses();
        } else {
            renderSubjects();
        }
    }

    tabClasses?.addEventListener("click", () => switchTab("classes"));
    tabSubjects?.addEventListener("click", () => switchTab("subjects"));

    /* =========================================
       INDICADORES
    ========================================= */

    function renderStats() {
        $("#academic-total-classes").textContent = classes.length;

        const linkedStudentIds = new Set();

        classes.forEach((schoolClass) => {
            students.forEach((student) => {
                if (
                    student.className === schoolClass.name ||
                    student.turma === schoolClass.name
                ) {
                    linkedStudentIds.add(student.id || student.registration || student.nome);
                }
            });
        });

        $("#academic-total-students").textContent = linkedStudentIds.size;
        $("#academic-total-subjects").textContent = subjects.length;
    }

    /* =========================================
       FILTROS E LISTA DE TURMAS
    ========================================= */

    function populateClassYearFilter() {
        const select = $("#academic-year-filter");
        if (!select) return;

        const previousValue = select.value;

        select.replaceChildren(new Option("Todos os anos", ""));

        [...new Set(classes.map((item) => String(item.year)))]
            .sort((a, b) => Number(b) - Number(a))
            .forEach((year) => select.add(new Option(year, year)));

        if ([...select.options].some((option) => option.value === previousValue)) {
            select.value = previousValue;
        }
    }

    function renderClasses() {
        const body = $("#academic-classes-body");
        if (!body) return;

        populateClassYearFilter();

        const query = ($("#academic-class-search")?.value || "")
            .trim().toLocaleLowerCase("pt-BR");

        const shift = $("#academic-shift-filter")?.value || "";
        const year = $("#academic-year-filter")?.value || "";

        const filtered = classes
            .filter((item) => {
                const searchable = `${item.name} ${item.level}`.toLocaleLowerCase("pt-BR");

                return searchable.includes(query) &&
                    (!shift || item.shift === shift) &&
                    (!year || String(item.year) === year);
            })
            .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

        body.innerHTML = filtered.map((item) => {
            const count = studentCount(item.name);

            return `
                <tr>
                    <td>
                        <div class="academic-main-cell">
                            <div class="academic-cell-icon">▦</div>
                            <div>
                                <div class="academic-cell-title">${escapeHTML(item.name)}</div>
                                <div class="academic-cell-subtitle">Turma escolar</div>
                            </div>
                        </div>
                    </td>
                    <td>${escapeHTML(item.level)}</td>
                    <td><span class="academic-tag">${escapeHTML(item.shift)}</span></td>
                    <td>${escapeHTML(item.year)}</td>
                    <td><span class="academic-tag">${count} aluno(s)</span></td>
                    <td>
                        <div class="academic-actions">
                            <button type="button" data-action="view-class" data-id="${escapeHTML(item.id)}" title="Visualizar" aria-label="Visualizar turma ${escapeHTML(item.name)}">◉</button>
                            <button type="button" data-action="edit-class" data-id="${escapeHTML(item.id)}" title="Editar" aria-label="Editar turma ${escapeHTML(item.name)}">✎</button>
                            <button type="button" data-action="delete-class" data-id="${escapeHTML(item.id)}" title="Excluir" aria-label="Excluir turma ${escapeHTML(item.name)}">⌫</button>
                        </div>
                    </td>
                </tr>
            `;
        }).join("");

        $("#academic-classes-empty").hidden = filtered.length > 0;
        $("#academic-classes-summary").textContent =
            `Exibindo ${filtered.length} de ${classes.length} turma(s)`;

        renderStats();
        populateSubjectClassFilter();
    }

    ["academic-class-search", "academic-shift-filter", "academic-year-filter"]
        .forEach((id) => {
            document.getElementById(id)?.addEventListener("input", renderClasses);
            document.getElementById(id)?.addEventListener("change", renderClasses);
        });

    $("#clear-academic-class-filters")?.addEventListener("click", () => {
        $("#academic-class-search").value = "";
        $("#academic-shift-filter").value = "";
        $("#academic-year-filter").value = "";
        renderClasses();
    });

    /* =========================================
       CADASTRO DE TURMAS
    ========================================= */

    function openClassForm(item = null) {
        $("#academic-class-form").reset();

        $("#academic-class-id").value = item?.id || "";
        $("#academic-class-modal-title").textContent = item
            ? "Editar turma"
            : "Cadastrar turma";

        $("#academic-class-name").value = item?.name || "";
        $("#academic-class-level").value = item?.level || "";
        $("#academic-class-shift").value = item?.shift || "";
        $("#academic-class-year").value = item?.year || currentYear;
        $("#academic-class-description").value = item?.description || "";

        openModal("academic-class-modal");
    }

    $("#open-class-modal")?.addEventListener("click", () => openClassForm());

    $("#academic-class-form")?.addEventListener("submit", (event) => {
        event.preventDefault();

        const id = $("#academic-class-id").value;
        const name = $("#academic-class-name").value.trim();
        const level = $("#academic-class-level").value;
        const shift = $("#academic-class-shift").value;
        const year = Number($("#academic-class-year").value);
        const description = $("#academic-class-description").value.trim();

        if (!name || !level || !shift || !year) {
            showMessage("Preencha os campos obrigatórios.");
            return;
        }

        const duplicate = classes.some((item) =>
            item.name.toLocaleLowerCase("pt-BR") === name.toLocaleLowerCase("pt-BR") &&
            Number(item.year) === year &&
            item.id !== id
        );

        if (duplicate) {
            showMessage("Já existe uma turma com esse nome nesse ano letivo.");
            return;
        }

        if (id) {
            classes = classes.map((item) =>
                item.id === id
                    ? { ...item, name, level, shift, year, description }
                    : item
            );
        } else {
            classes.push({
                id: makeId("turma"),
                name,
                level,
                shift,
                year,
                description
            });
        }

        saveClasses();
        closeModal("academic-class-modal");
        renderClasses();
        renderSubjects();

        showMessage(id ? "Turma atualizada!" : "Turma cadastrada!");
    });

    /* =========================================
       DISCIPLINAS: FILTROS E LISTA
    ========================================= */

    function populateSubjectClassFilter() {
        const select = $("#academic-subject-class-filter");
        if (!select) return;

        const previousValue = select.value;

        select.replaceChildren(new Option("Todas as turmas", ""));

        classes
            .slice()
            .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))
            .forEach((item) => select.add(new Option(item.name, item.id)));

        if ([...select.options].some((option) => option.value === previousValue)) {
            select.value = previousValue;
        }
    }

    function renderSubjects() {
        const body = $("#academic-subjects-body");
        if (!body) return;

        populateSubjectClassFilter();

        const query = ($("#academic-subject-search")?.value || "")
            .trim().toLocaleLowerCase("pt-BR");

        const classId = $("#academic-subject-class-filter")?.value || "";

        const filtered = subjects
            .filter((item) => {
                const searchable = `${item.name} ${item.code}`.toLocaleLowerCase("pt-BR");

                return searchable.includes(query) &&
                    (!classId || (item.classIds || []).includes(classId));
            })
            .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

        body.innerHTML = filtered.map((item) => {
            const linkedClasses = classNames(item.classIds);

            return `
                <tr>
                    <td>
                        <div class="academic-main-cell">
                            <div class="academic-cell-icon">▤</div>
                            <div>
                                <div class="academic-cell-title">${escapeHTML(item.name)}</div>
                                <div class="academic-cell-subtitle">Disciplina escolar</div>
                            </div>
                        </div>
                    </td>
                    <td><span class="academic-code">${escapeHTML(item.code)}</span></td>
                    <td>${escapeHTML(item.hours)} h/semana</td>
                    <td>${escapeHTML(item.teacher || "Não informado")}</td>
                    <td>
                        <span class="academic-tag">${linkedClasses.length} turma(s)</span>
                    </td>
                    <td>
                        <div class="academic-actions">
                            <button type="button" data-action="view-subject" data-id="${escapeHTML(item.id)}" title="Visualizar" aria-label="Visualizar ${escapeHTML(item.name)}">◉</button>
                            <button type="button" data-action="edit-subject" data-id="${escapeHTML(item.id)}" title="Editar" aria-label="Editar ${escapeHTML(item.name)}">✎</button>
                            <button type="button" data-action="delete-subject" data-id="${escapeHTML(item.id)}" title="Excluir" aria-label="Excluir ${escapeHTML(item.name)}">⌫</button>
                        </div>
                    </td>
                </tr>
            `;
        }).join("");

        $("#academic-subjects-empty").hidden = filtered.length > 0;
        $("#academic-subjects-summary").textContent =
            `Exibindo ${filtered.length} de ${subjects.length} disciplina(s)`;

        renderStats();
    }

    $("#academic-subject-search")?.addEventListener("input", renderSubjects);
    $("#academic-subject-class-filter")?.addEventListener("change", renderSubjects);

    $("#clear-academic-subject-filters")?.addEventListener("click", () => {
        $("#academic-subject-search").value = "";
        $("#academic-subject-class-filter").value = "";
        renderSubjects();
    });

    /* =========================================
       CADASTRO DE DISCIPLINAS
    ========================================= */

    function renderClassCheckboxes(selectedIds = []) {
        const container = $("#academic-subject-class-options");

        if (!container) return;

        if (!classes.length) {
            container.innerHTML = "<p>Cadastre uma turma antes de vincular disciplinas.</p>";
            return;
        }

        container.innerHTML = classes
            .slice()
            .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))
            .map((item) => `
                <label class="academic-checkbox-option">
                    <input
                        type="checkbox"
                        name="academic-subject-classes"
                        value="${escapeHTML(item.id)}"
                        ${selectedIds.includes(item.id) ? "checked" : ""}
                    >
                    <span>${escapeHTML(item.name)}</span>
                </label>
            `)
            .join("");
    }

    function openSubjectForm(item = null) {
        $("#academic-subject-form").reset();

        $("#academic-subject-id").value = item?.id || "";
        $("#academic-subject-modal-title").textContent = item
            ? "Editar disciplina"
            : "Cadastrar disciplina";

        $("#academic-subject-name").value = item?.name || "";
        $("#academic-subject-code").value = item?.code || "";
        $("#academic-subject-hours").value = item?.hours || "";
        $("#academic-subject-teacher").value = item?.teacher || "";
        $("#academic-subject-description").value = item?.description || "";

        renderClassCheckboxes(item?.classIds || []);

        openModal("academic-subject-modal");
    }

    $("#open-subject-modal")?.addEventListener("click", () => openSubjectForm());

    $("#academic-subject-form")?.addEventListener("submit", (event) => {
        event.preventDefault();

        const id = $("#academic-subject-id").value;
        const name = $("#academic-subject-name").value.trim();
        const code = $("#academic-subject-code").value.trim();
        const hours = Number($("#academic-subject-hours").value);
        const teacher = $("#academic-subject-teacher").value.trim();
        const description = $("#academic-subject-description").value.trim();

        const classIds = [
            ...document.querySelectorAll('input[name="academic-subject-classes"]:checked')
        ].map((input) => input.value);

        if (!name || !code || !hours || classIds.length === 0) {
            showMessage("Preencha os campos obrigatórios e selecione ao menos uma turma.");
            return;
        }

        const duplicate = subjects.some((item) =>
            item.code.toLocaleLowerCase("pt-BR") === code.toLocaleLowerCase("pt-BR") &&
            item.id !== id
        );

        if (duplicate) {
            showMessage("Já existe uma disciplina com esse código.");
            return;
        }

        if (id) {
            subjects = subjects.map((item) =>
                item.id === id
                    ? { ...item, name, code, hours, teacher, classIds, description }
                    : item
            );
        } else {
            subjects.push({
                id: makeId("disc"),
                name,
                code,
                hours,
                teacher,
                classIds,
                description
            });
        }

        saveSubjects();
        closeModal("academic-subject-modal");
        renderSubjects();

        showMessage(id ? "Disciplina atualizada!" : "Disciplina cadastrada!");
    });

    /* =========================================
       VISUALIZAR / EDITAR / EXCLUIR
    ========================================= */

    function showDetails(type, item) {
        selectedType = type;
        selectedId = item.id;

        const isClass = type === "class";

        $("#academic-details-title").textContent = isClass
            ? item.name
            : item.name;

        let details;

        if (isClass) {
            details = [
                ["Nome da turma", item.name],
                ["Série / etapa", item.level],
                ["Turno", item.shift],
                ["Ano letivo", item.year],
                ["Quantidade de alunos", studentCount(item.name)],
                ["Disciplinas vinculadas", subjects.filter((subject) =>
                    (subject.classIds || []).includes(item.id)
                ).map((subject) => subject.name).join(", ") || "Nenhuma disciplina vinculada"],
                ["Descrição", item.description || "Nenhuma descrição informada."]
            ];
        } else {
            details = [
                ["Disciplina", item.name],
                ["Código", item.code],
                ["Carga horária semanal", `${item.hours} hora(s)`],
                ["Professor responsável", item.teacher || "Não informado"],
                ["Turmas vinculadas", classNames(item.classIds).join(", ") || "Nenhuma turma"],
                ["Descrição", item.description || "Nenhuma descrição informada."]
            ];
        }

        $("#academic-details-content").innerHTML = details.map(([label, value]) => `
            <div class="academic-detail-item ${label === "Descrição" || label === "Disciplinas vinculadas" || label === "Turmas vinculadas" ? "academic-full-detail" : ""}">
                <span>${escapeHTML(label)}</span>
                <strong>${escapeHTML(value)}</strong>
            </div>
        `).join("");

        openModal("academic-details-modal");
    }

    $("#academic-edit-details")?.addEventListener("click", () => {
        const item = selectedType === "class"
            ? classes.find((entry) => entry.id === selectedId)
            : subjects.find((entry) => entry.id === selectedId);

        closeModal("academic-details-modal");

        if (!item) return;

        if (selectedType === "class") {
            openClassForm(item);
        } else {
            openSubjectForm(item);
        }
    });

    function deleteClass(id) {
        const item = classById(id);
        if (!item) return;

        const linkedSubjects = subjects.filter((subject) =>
            (subject.classIds || []).includes(id)
        );

        const linkedStudents = studentCount(item.name);

        if (linkedSubjects.length || linkedStudents) {
            const confirmed = confirm(
                `A turma "${item.name}" possui ${linkedStudents} aluno(s) associado(s) e ${linkedSubjects.length} disciplina(s) vinculada(s).\n\nDeseja excluir a turma? Os vínculos com disciplinas serão removidos. Os cadastros de alunos não serão excluídos.`
            );

            if (!confirmed) return;
        } else if (!confirm(`Deseja excluir a turma "${item.name}"?`)) {
            return;
        }

        classes = classes.filter((entry) => entry.id !== id);

        subjects = subjects.map((subject) => ({
            ...subject,
            classIds: (subject.classIds || []).filter((classId) => classId !== id)
        }));

        saveClasses();
        saveSubjects();

        renderClasses();
        renderSubjects();

        showMessage("Turma excluída. Os cadastros dos alunos foram preservados.");
    }

    function deleteSubject(id) {
        const item = subjects.find((entry) => entry.id === id);
        if (!item) return;

        if (!confirm(`Deseja excluir a disciplina "${item.name}"?`)) return;

        subjects = subjects.filter((entry) => entry.id !== id);

        saveSubjects();
        renderSubjects();

        showMessage("Disciplina excluída.");
    }

    $("#academic-classes-body")?.addEventListener("click", (event) => {
        const button = event.target.closest("button[data-action]");
        if (!button) return;

        const item = classById(button.dataset.id);
        if (!item) return;

        switch (button.dataset.action) {
            case "view-class":
                showDetails("class", item);
                break;
            case "edit-class":
                openClassForm(item);
                break;
            case "delete-class":
                deleteClass(item.id);
                break;
        }
    });

    $("#academic-subjects-body")?.addEventListener("click", (event) => {
        const button = event.target.closest("button[data-action]");
        if (!button) return;

        const item = subjects.find((entry) => entry.id === button.dataset.id);
        if (!item) return;

        switch (button.dataset.action) {
            case "view-subject":
                showDetails("subject", item);
                break;
            case "edit-subject":
                openSubjectForm(item);
                break;
            case "delete-subject":
                deleteSubject(item.id);
                break;
        }
    });

    /* =========================================
       INICIALIZAÇÃO
    ========================================= */

    const yearInput = $("#academic-class-year");
    if (yearInput && !yearInput.value) yearInput.value = currentYear;

    renderStats();
    renderClasses();
    renderSubjects();
});