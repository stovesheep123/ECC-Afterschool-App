// ===============================
// TOGGLE REPORT FORM
// ===============================
async function toggleReportForm() {
    const form = document.getElementById("reportForm");
    await loadUsers();

    if (!form) return;

    if (form.style.display === "none" || form.style.display === "") {
        form.style.display = "block";
        window.editingReportId = null; // Clear out old edit tracking IDs on fresh opens

        // Reset the form values
        document.getElementById("student_name").value = "";
        document.getElementById("content").value = "";
        document.getElementById("homework").value = "";
        document.getElementById("reportImage").value = "";
        
        const currentUser = JSON.parse(localStorage.getItem("currentUser"));
        if (currentUser && document.getElementById("teacher_name")) {
            document.getElementById("teacher_name").value = currentUser.username;
        }
    } else {
        form.style.display = "none";
    }
}

// ===============================
// SAVE / UPDATE REPORT
// ===============================
window.saveReport = async function () {
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));

    if (!currentUser || (currentUser.role !== "teacher" && currentUser.role !== "headmaster")) {
        alert("権限がありません");
        return;
    }

    // Grab form metrics
    const teacher = document.getElementById("teacher_name").value;
    const student = document.getElementById("student_name").value.trim();
    const date = document.getElementById("date").value;
    const subject = document.getElementById("subject").value;
    const content = document.getElementById("content").value;
    const homework = document.getElementById("homework").value;
    const homeworkStatus = document.getElementById("homeworkStatus").value;
    const understanding = document.getElementById("understanding").value;

    if (!student || !date || !content) {
        alert("必須項目を入力してください（生徒、日付、授業内容）");
        return;
    }

    let imageUrl = "";

    // If editing, pull up current payload data first to retain the existing image if unchanged
    if (window.editingReportId) {
        const { data: currentReport } = await window.supabase
            .from("reports")
            .select("image_url")
            .eq("id", window.editingReportId)
            .single();
        if (currentReport) {
            imageUrl = currentReport.image_url;
        }
    }

    // Handle File Storage Processing
    const imageFile = document.getElementById("reportImage").files[0];
    if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;

        const { error: uploadError } = await window.supabase.storage
            .from("report-images")
            .upload(fileName, imageFile);

        if (uploadError) {
            console.error("UPLOAD ERROR:", uploadError);
            alert("画像アップロード失敗: " + uploadError.message);
            return;
        }

        const { data } = window.supabase.storage
            .from("report-images")
            .getPublicUrl(fileName);

        imageUrl = data.publicUrl;
    }

    // Database payload execution matrix
    const payload = {
        teacher_name: teacher,
        student_name: student,
        date,
        subject,
        content,
        homework,
        homework_status: homeworkStatus,
        understanding: parseInt(understanding, 10),
        image_url: imageUrl
    };

    if (window.editingReportId) {
        // UPDATE MODE
        const { error } = await window.supabase
            .from("reports")
            .update(payload)
            .eq("id", window.editingReportId);

        if (error) {
            alert("更新に失敗しました: " + error.message);
            return;
        }
    } else {
        // INSERT MODE
        payload.status = "pending"; // Default setting
        const { error } = await window.supabase
            .from("reports")
            .insert([payload]);

        if (error) {
            alert("保存に失敗しました: " + error.message);
            return;
        }
    }

    alert("保存しました");
    
    // Clear out form views cleanly
    window.editingReportId = null;
    document.getElementById("reportForm").style.display = "none";
    document.getElementById("reportImage").value = "";
    
    loadSavedReports();
};

// ===============================
// LOAD SAVED REPORTS (MANAGEMENT VIEW)
// ===============================

window.loadSavedReports = async function () {
    const currentUser = JSON.parse(
        localStorage.getItem("currentUser") || "null"
    );

    const container = document.getElementById("savedReportList");

    if (!container) {
        console.error("Missing #savedReportList in HTML");
        return;
    }

    if (!currentUser) {
        container.textContent = "ログイン情報がありません。再ログインしてください。";
        return;
    }

    if (!window.supabase) {
        container.textContent = "Supabase is not initialized.";
        return;
    }

    container.textContent = "レポートを読み込み中...";

    try {
        const { data: reports, error } = await window.supabase
            .from("reports")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) throw error;

        const role = (currentUser.role || "").toLowerCase();
        const username = (currentUser.username || "").trim();

        let filteredReports = reports || [];

        // Students and parents see reports addressed to them.
        if (role === "student" || role === "parent") {
            filteredReports = filteredReports.filter(report =>
                (report.student_name || "").trim() === username
            );
        }

        // Teachers see reports they wrote.
        if (role === "teacher") {
            filteredReports = filteredReports.filter(report =>
                (report.teacher_name || "").trim() === username
            );
        }

        // HeadMaster can see all reports.
        const pendingOnly = document.getElementById("pendingOnly")?.checked;
        const approvedOnly = document.getElementById("approvedOnly")?.checked;
        const search = document.getElementById("reportSearch")?.value || "";

        if (pendingOnly && !approvedOnly) {
            filteredReports = filteredReports.filter(
                report => report.status === "pending"
            );
        } else if (approvedOnly && !pendingOnly) {
            filteredReports = filteredReports.filter(
                report => report.status === "approved"
            );
        }

        if (search) {
            filteredReports = filteredReports.filter(
                report => report.student_name === search
            );
        }

        if (!filteredReports.length) {
            container.textContent = "該当するレポートはありません。";
            return;
        }

        container.innerHTML = "";

        filteredReports.forEach(report => {
            const card = document.createElement("article");
            card.className = "saved-report-card";

            const heading = document.createElement("h3");
            heading.textContent =
                `${report.student_name || "生徒"} — ${report.subject || ""}`;

            const details = document.createElement("div");
            details.className = "report-details";

            const fields = [
                ["教師", report.teacher_name],
                ["日付", report.date],
                ["授業内容", report.content],
                ["宿題", report.homework],
                ["宿題状況", report.homework_status],
                ["理解度", `${report.understanding ?? 0}/10`],
                ["状況", report.status || "未設定"]
            ];

            fields.forEach(([label, value]) => {
                const p = document.createElement("p");
                const strong = document.createElement("strong");
                strong.textContent = `${label}: `;
                p.append(strong, document.createTextNode(value ?? ""));
                details.appendChild(p);
            });

            card.append(heading, details);

            if (report.image_url) {
                const img = document.createElement("img");
                img.src = report.image_url;
                img.alt = "レポート画像";
                img.style.maxWidth = "300px";
                img.style.width = "100%";
                img.style.borderRadius = "12px";
                card.appendChild(img);
            }

            // Editing and deleting are only for teachers and HeadMaster.
            if (role === "teacher" || role === "headmaster") {
                const actions = document.createElement("div");
                actions.className = "report-actions";

                if (role === "headmaster" && report.status !== "approved") {
                    const approve = document.createElement("button");
                    approve.textContent = "✅ Approve";
                    approve.onclick = () => window.approveReport(report.id);
                    actions.appendChild(approve);
                }

                const edit = document.createElement("button");
                edit.textContent = "✏️ Edit";
                edit.onclick = () => window.editReport(report.id);

                const remove = document.createElement("button");
                remove.textContent = "🗑 Delete";
                remove.onclick = () => window.deleteReport(report.id);

                actions.append(edit, remove);
                card.appendChild(actions);
            }

            container.appendChild(card);
        });
    } catch (error) {
        console.error("Load saved reports failed:", error);
        container.textContent = "レポートの読み込みに失敗しました: " + error.message;
    }
};


// ===============================
// DELETE REPORT
// ===============================
window.deleteReport = async function (id) {
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));

    if (!currentUser || (currentUser.role !== "teacher" && currentUser.role !== "headmaster")) {
        alert("権限がありません");
        return;
    }

    if (!confirm("本当にこのレポートを削除しますか？")) return;

    const { error } = await window.supabase
        .from("reports")
        .delete()
        .eq("id", id);

    if (error) {
        alert("削除に失敗しました");
        return;
    }

    loadSavedReports();
};

// ===============================
// EDIT REPORT ENTRY LOAD
// ===============================
window.editReport = async function (id) {
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));

    if (!currentUser || (currentUser.role !== "teacher" && currentUser.role !== "headmaster")) {
        alert("権限がありません");
        return;
    }

    const { data, error } = await window.supabase
        .from("reports")
        .select("*")
        .eq("id", id)
        .single();

    if (error || !data) {
        alert("レポートデータの読み込みに失敗しました");
        return;
    }

    if (typeof showSection === "function") {
        showSection("report");
    }

    // Reveal Form Container Block
    document.getElementById("reportForm").style.display = "block";

    // Rehydrate input targets
    document.getElementById("teacher_name").value = data.teacher_name;
    await loadUsers(); // Sync dynamic list drop selections up properly

    document.getElementById("student_name").value = data.student_name;
    document.getElementById("date").value = data.date;
    document.getElementById("subject").value = data.subject;
    document.getElementById("content").value = data.content;
    document.getElementById("homework").value = data.homework;
    document.getElementById("homeworkStatus").value = data.homework_status;
    document.getElementById("understanding").value = data.understanding;

    // Save transaction state profile references globally
    window.editingReportId = id;
    
    // Smooth scroll layout up back into view
    document.getElementById("reportForm").scrollIntoView({ behavior: 'smooth' });
};

// ===============================
// LOAD STUDENT PERFORMANCE PORTAL (STUDENT/PARENT VIEW)
// ===============================

window.loadStudentReports = async function () {
let studentReportOffset = 0;
const STUDENT_REPORT_PAGE_SIZE = 30;

window.loadStudentReports = async function (loadMore = false) {
    const currentUser = JSON.parse(
        localStorage.getItem("currentUser")
    );
    const container = document.getElementById("studentReportList");

    if (!container) return;

    if (!currentUser || !currentUser.username) {
        container.textContent = "ログイン情報を確認してください。";
        return;
    }

    if (!loadMore) {
        studentReportOffset = 0;
        container.innerHTML = "";
        container.textContent = "レポートを読み込み中...";
    }

    const button = document.getElementById("loadMoreStudentReports");
    if (button) button.disabled = true;

    try {
        const start = studentReportOffset;
        const end = start + STUDENT_REPORT_PAGE_SIZE - 1;

        const { data, error } = await window.supabase
            .from("reports")
            .select(
                "id, teacher_name, student_name, date, subject, content, homework, understanding, image_url, status"
            )
            .eq("student_name", currentUser.username.trim())
            .eq("status", "approved")
            .order("date", { ascending: false })
            .range(start, end);

        if (error) throw error;

        if (!loadMore) container.innerHTML = "";

        if (!data || data.length === 0) {
            if (!loadMore) {
                container.textContent = "承認されたレポートはありません。";
            }
            if (button) button.remove();
            return;
        }

        // Escape report text before displaying it as HTML.
        const escapeHTML = value =>
            String(value ?? "").replace(/[&<>"']/g, char => ({
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;"
            })[char]);

        const cards = data.map(report => `
            <div class="saved-report-card">
                <h3>${escapeHTML(report.subject)}</h3>
                <div class="report-details" style="margin-top:10px;">
                    <p><strong>教師:</strong> ${escapeHTML(report.teacher_name)}</p>
                    <p><strong>日付:</strong> ${escapeHTML(report.date)}</p>
                    <p><strong>授業内容:</strong> ${escapeHTML(report.content)}</p>
                    <p><strong>宿題:</strong> ${escapeHTML(report.homework)}</p>
                    <p><strong>理解度:</strong> ${escapeHTML(report.understanding)}/10</p>
                </div>
                ${report.image_url ? `
                    <img
                        src="${escapeHTML(report.image_url)}"
                        loading="lazy"
                        alt="レポート画像"
                        style="width:100%;max-width:400px;border-radius:12px;margin-top:12px;"
                    >
                ` : ""}
            </div>
        `).join("");

        // Append this batch instead of rebuilding all previous cards.
        const oldButton = document.getElementById("loadMoreStudentReports");
        if (oldButton) oldButton.remove();

        container.insertAdjacentHTML("beforeend", cards);
        studentReportOffset += data.length;

        if (data.length === STUDENT_REPORT_PAGE_SIZE) {
            const moreButton = document.createElement("button");
            moreButton.id = "loadMoreStudentReports";
            moreButton.textContent = "もっとレポートを読み込む";
            moreButton.style.cssText =
                "margin:16px 0;padding:12px 18px;cursor:pointer;";

            moreButton.onclick = () => window.loadStudentReports(true);
            container.appendChild(moreButton);
        }

    } catch (error) {
        console.error("Student reports loading error:", error);

        const message = document.createElement("p");
        message.textContent = "読み込みに失敗しました。もう一度お試しください。";
        container.appendChild(message);

        const retryButton = document.createElement("button");
        retryButton.textContent = "再読み込み";
        retryButton.onclick = () => window.loadStudentReports(false);
        container.appendChild(retryButton);
    }
};
};


// ===============================
// APPROVE PENDING ENTRY RECORD
// ===============================
window.approveReport = async function (id) {
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));

    if (!currentUser || currentUser.role !== "headmaster") {
        alert("権限がありません");
        return;
    }

    const { error } = await window.supabase
        .from("reports")
        .update({
            status: "approved",
            approved_by: currentUser.username,
            approved_at: new Date().toISOString()
        })
        .eq("id", id);

    if (error) {
        console.error("Approval statement error context:", error);
        alert("承認処理に失敗しました");
        return;
    }

    // Defend against missing DOM element references gracefully
    const modal = document.getElementById("approveModal");
    if (modal) {
        modal.style.display = "flex";
    } else {
        alert("レポートを承認しました！");
    }

    loadSavedReports();
};

