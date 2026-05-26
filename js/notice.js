// ======================================================
// LOAD NOTICES
// ======================================================

async function displayNotices() {

    const list =
        document.getElementById("noticeList");

    if (!list) return;

    list.innerHTML = "";

    const role =
        localStorage.getItem("role");

    const currentUser =
        localStorage.getItem("currentUser");

    // headmaster only create area
    const createArea =
        document.getElementById("noticeCreateArea");

    if (role !== "headmaster") {

        createArea.style.display = "none";
    }

    const { data: notices, error } =
        await supabaseClient
            .from("notices")
            .select("*")
            .order("created_at", {
                ascending: false
            });

    if (error) {
        console.log(error);
        return;
    }

    notices.forEach(notice => {

        // visibility rules
        if (
            role === "teacher" &&
            !notice.visible_to_teacher
        ) return;

        if (
            role === "student" &&
            !notice.visible_to_student
        ) return;

        if (
            role === "parent" &&
            !notice.visible_to_parent
        ) return;

        const div =
            document.createElement("div");

        div.style.background = "white";
        div.style.padding = "15px";
        div.style.borderRadius = "15px";
        div.style.marginBottom = "15px";

        div.innerHTML = `
      <h2>📌 ${notice.title}</h2>

      <p>
        ${notice.content}
      </p>

      <p style="color:gray;font-size:12px;">
        ${new Date(
            notice.created_at
        ).toLocaleString()}
      </p>
    `;

        // ==================================================
        // HEADMASTER BUTTONS
        // ==================================================

        if (role === "headmaster") {

            const buttonArea =
                document.createElement("div");

            buttonArea.style.display = "flex";
            buttonArea.style.gap = "10px";
            buttonArea.style.marginTop = "10px";

            // edit
            const editBtn =
                document.createElement("button");

            editBtn.innerText = "✏️ Edit";

            editBtn.onclick = () =>
                editNotice(notice.id);

            buttonArea.appendChild(editBtn);

            // delete
            const deleteBtn =
                document.createElement("button");

            deleteBtn.innerText = "🗑 Delete";

            deleteBtn.style.background =
                "crimson";

            deleteBtn.style.color =
                "white";

            deleteBtn.onclick = () =>
                deleteNotice(notice.id);

            buttonArea.appendChild(deleteBtn);

            div.appendChild(buttonArea);
        }

        list.appendChild(div);
    });
}

// ======================================================
// SAVE NOTICE
// ======================================================

window.saveNotice = async function () {
    const role =
        localStorage.getItem("role");

    if (role !== "headmaster") {

        alert("塾長のみ操作可能");

        return;
    }

    const title =
        document.getElementById("noticeTitle").value;

    const content =
        document.getElementById("noticeContent").value;

    const visible_to_teacher =
        document.getElementById("teacherVisible").checked;

    const visible_to_student =
        document.getElementById("studentVisible").checked;

    const visible_to_parent =
        document.getElementById("parentVisible").checked;

    const created_by =
        localStorage.getItem("currentUser");

    // edit mode
    if (window.editingNoticeId) {

        await supabaseClient
            .from("notices")
            .update({
                title,
                content,
                visible_to_teacher,
                visible_to_student,
                visible_to_parent
            })
            .eq("id", window.editingNoticeId);

        window.editingNoticeId = null;

    } else {

        await supabaseClient
            .from("notices")
            .insert([
                {
                    title,
                    content,
                    visible_to_teacher,
                    visible_to_student,
                    visible_to_parent,
                    created_by
                }
            ]);
    }

    document.getElementById("noticeTitle").value = "";
    document.getElementById("noticeContent").value = "";

    displayNotices();
}

// ======================================================
// EDIT NOTICE
// ======================================================

async function editNotice(id) {

    const { data } =
        await supabaseClient
            .from("notices")
            .select("*")
            .eq("id", id)
            .single();

    if (!data) return;

    document.getElementById("noticeTitle").value =
        data.title;

    document.getElementById("noticeContent").value =
        data.content;

    document.getElementById("teacherVisible").checked =
        data.visible_to_teacher;

    document.getElementById("studentVisible").checked =
        data.visible_to_student;

    document.getElementById("parentVisible").checked =
        data.visible_to_parent;

    window.editingNoticeId = id;
}

// ======================================================
// DELETE NOTICE
// ======================================================

async function deleteNotice(id) {

    const ok =
        confirm("Delete notice?");

    if (!ok) return;

    await supabaseClient
        .from("notices")
        .delete()
        .eq("id", id);

    displayNotices();
}
