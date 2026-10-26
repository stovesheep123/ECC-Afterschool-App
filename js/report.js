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
    console.log("1. Saved Reports started");

    const currentUser = JSON.parse(
        localStorage.getItem("currentUser")
    );

    console.log("2. Logged-in user:", currentUser);

    const container = document.getElementById("savedReportList");
    console.log("3. Report container:", container);

    if (!currentUser) {
        console.error("No logged-in user found");
        return;
    }

    if (!container) {
        console.error("savedReportList element is missing");
        return;
    }

    container.innerHTML = "読み込み中...";

    const { data: reports, error } = await window.supabase
        .from("reports")
        .select("*")
        .order("created_at", { ascending: false });

    console.log("4. Reports from Supabase:", reports);
    console.log("5. Supabase error:", error);

    if (error) {
        console.error("Report loading failed:", error);
        container.innerHTML = "読み込み失敗: " + error.message;
        return;
    }

    console.log("6. Number of reports:", reports?.length);

    // Stop here temporarily so we can inspect the query result.
    container.innerHTML = `Supabase returned ${reports.length} reports.`;
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
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    const container = document.getElementById("studentReportList");

    if (!container) return;
    container.innerHTML = "読み込み中...";

    const cleanUsername = currentUser.username.trim();

    // Pull directly matching rows cleanly
    const { data, error } = await window.supabase
        .from("reports")
        .select("*")
        .eq("status", "approved")
        .eq("student_name", cleanUsername)
        .order("date", { ascending: false });

    if (error) {
        console.error("Student portal query error:", error);
        container.innerHTML = "読み込み失敗";
        return;
    }

    if (!data || data.length === 0) {
        container.innerHTML = "<p class='no-data'>承認されたレポートはありません</p>";
        return;
    }

    container.innerHTML = "";

    data.forEach(report => {
        container.innerHTML += `
            <div class="saved-report-card">
                <h3>${report.subject}</h3>
                <div class="report-details" style="margin-top:10px;">
                    <p><strong>教師:</strong> ${report.teacher_name}</p>
                    <p><strong>日付:</strong> ${report.date}</p>
                    <p><strong>授業内容:</strong> ${report.content}</p>
                    <p><strong>宿題:</strong> ${report.homework}</p>
                    <p><strong>理解度:</strong> ${report.understanding}/10</p>
                </div>
                ${report.image_url ? `
                    <img src="${report.image_url}" style="width:100%; max-width:400px; border-radius:12px; margin-top:12px; display:block;">
                ` : ""}
            </div>
        `;
    });
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
