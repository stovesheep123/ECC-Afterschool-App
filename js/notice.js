// ======================================================
// LOAD NOTICES
// ======================================================
async function displayNotices() {
    const list = document.getElementById("noticeList");
    if (!list) return;

    list.innerHTML = "";

    const role = localStorage.getItem("role");
    const createArea = document.getElementById("noticeCreateArea");

    // Headmaster only area toggle with defensive check
    if (createArea) {
        if (role !== "headmaster") {
            createArea.style.display = "none";
        } else {
            createArea.style.display = "block";
        }
    }

    // Fixed client variable name reference to window.supabase
    const { data: notices, error } = await window.supabase
        .from("notices")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error loading notices:", error);
        list.innerHTML = "<p>お知らせの読み込みに失敗しました。</p>";
        return;
    }

    if (!notices?.length) {
        list.innerHTML = "<p class='no-data'>現在お知らせはありません。</p>";
        return;
    }

    notices.forEach(notice => {
        // Enforce user visibility filter matrices
        if (role === "teacher" && !notice.visible_to_teacher) return;
        if (role === "student" && !notice.visible_to_student) return;
        if (role === "parent" && !notice.visible_to_parent) return;

        const div = document.createElement("div");
        div.style.background = "white";
        div.style.padding = "15px";
        div.style.borderRadius = "15px";
        div.style.marginBottom = "15px";
        div.className = "notice-card";

        div.innerHTML = `
            <h2>📌 ${notice.title}</h2>
            <p style="white-space: pre-wrap; margin: 10px 0;">${notice.content}</p>
            <p style="color:gray; font-size:12px; margin: 0;">
                ${new Date(notice.created_at).toLocaleString('ja-JP')}
            </p>
        `;

        // ==================================================
        // HEADMASTER INTERACTION CONTROLS
        // ==================================================
        if (role === "headmaster") {
            const buttonArea = document.createElement("div");
            buttonArea.style.display = "flex";
            buttonArea.style.gap = "10px";
            buttonArea.style.marginTop = "12px";

            // Edit button setup
            const editBtn = document.createElement("button");
            editBtn.innerText = "✏️ Edit";
            editBtn.style.padding = "4px 12px";
            editBtn.onclick = () => editNotice(notice.id);
            buttonArea.appendChild(editBtn);

            // Delete button setup
            const deleteBtn = document.createElement("button");
            deleteBtn.innerText = "🗑 Delete";
            deleteBtn.style.background = "crimson";
            deleteBtn.style.color = "white";
            deleteBtn.style.border = "none";
            deleteBtn.style.padding = "4px 12px";
            deleteBtn.style.borderRadius = "4px";
            deleteBtn.onclick = () => deleteNotice(notice.id);
            buttonArea.appendChild(deleteBtn);

            div.appendChild(buttonArea);
        }

        list.appendChild(div);
    });
}

// ======================================================
// SAVE / UPDATE NOTICE
// ======================================================
window.saveNotice = async function () {
    const role = localStorage.getItem("role");

    if (role !== "headmaster") {
        alert("塾長のみ操作可能");
        return;
    }

    const title = document.getElementById("noticeTitle").value.trim();
    const content = document.getElementById("noticeContent").value.trim();
    const visible_to_teacher = document.getElementById("teacherVisible").checked;
    const visible_to_student = document.getElementById("studentVisible").checked;
    const visible_to_parent = document.getElementById("parentVisible").checked;
    const created_by = localStorage.getItem("currentUser");

    // Prevent blank database records
    if (!title || !content) {
        alert("タイトルと内容を入力してください");
        return;
    }

    const payload = {
        title,
        content,
        visible_to_teacher,
        visible_to_student,
        visible_to_parent
    };

    if (window.editingNoticeId) {
        // UPDATE MODE
        const { error } = await window.supabase
            .from("notices")
            .update(payload)
            .eq("id", window.editingNoticeId);

        if (error) {
            alert("更新失敗: " + error.message);
            return;
        }
        window.editingNoticeId = null;
    } else {
        // INSERT MODE
        payload.created_by = created_by;
        const { error } = await window.supabase
            .from("notices")
            .insert([payload]);

        if (error) {
            alert("保存失敗: " + error.message);
            return;
        }
    }

    // Reset fields and visibility checkboxes smoothly
    document.getElementById("noticeTitle").value = "";
    document.getElementById("noticeContent").value = "";
    document.getElementById("teacherVisible").checked = true;
    document.getElementById("studentVisible").checked = true;
    document.getElementById("parentVisible").checked = true;

    alert("お知らせを保存しました");
    displayNotices();
};

// ======================================================
// EDIT NOTICE (LOAD INTO FIELDS)
// ======================================================
async function editNotice(id) {
    const { data, error } = await window.supabase
        .from("notices")
        .select("*")
        .eq("id", id)
        .single();

    if (error || !data) {
        alert("お知らせの読み込みに失敗しました");
        return;
    }

    document.getElementById("noticeTitle").value = data.title;
    document.getElementById("noticeContent").value = data.content;
    document.getElementById("teacherVisible").checked = data.visible_to_teacher;
    document.getElementById("studentVisible").checked = data.visible_to_student;
    document.getElementById("parentVisible").checked = data.visible_to_parent;

    window.editingNoticeId = id;

    // Scroll form into view for smaller admin tablets
    const formContainer = document.getElementById("noticeTitle");
    if (formContainer) {
        formContainer.scrollIntoView({ behavior: "smooth" });
    }
}

// ======================================================
// DELETE NOTICE
// ======================================================
async function deleteNotice(id) {
    if (!confirm("本当にこのお知らせを削除しますか？")) return;

    const { error } = await window.supabase
        .from("notices")
        .delete()
        .eq("id", id);

    if (error) {
        alert("削除に失敗しました");
        return;
    }

    displayNotices();
}
