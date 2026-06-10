// ===============================
// TOGGLE REPORT FORM
// ===============================

async function toggleReportForm() {

  const form =
    document.getElementById("reportForm");

  await loadUsers();

  if (!form) return;

  if (
    form.style.display === "none" ||
    form.style.display === ""
  ) {

    form.style.display = "block";

    const currentUser =
      JSON.parse(
        localStorage.getItem("currentUser")
      );

    document.getElementById(
      "teacher_name"
    ).value =
      currentUser.username;

  } else {

    form.style.display = "none";
  }
}


// ===============================
// SAVE REPORT
// ===============================

window.saveReport = async function () {

  const currentUser =
    JSON.parse(localStorage.getItem("currentUser"));

  if (
    currentUser.role !== "teacher" &&
    currentUser.role !== "headmaster"
  ) {
    alert("権限ありません");
    return;
  }

  // FORM VALUES
  const teacher =
    document.getElementById("teacher_name").value;

  const student =
    document.getElementById("student_name").value.trim();

  const date =
    document.getElementById("date").value;

  const subject =
    document.getElementById("subject").value;

  const content =
    document.getElementById("content").value;

  const homework =
    document.getElementById("homework").value;

  const homeworkStatus =
    document.getElementById("homeworkStatus").value;

  const understanding =
    document.getElementById("understanding").value;

  if (!student || !date || !content) {
    alert("入力してください");
    return;
  }

  // ============================
  // IMAGE UPLOAD ← ADD IT HERE
  // ============================

  let imageUrl = "";

  const imageFile =
    document.getElementById("reportImage").files[0];

  if (imageFile) {

    const fileExt =
      imageFile.name.split('.').pop();

    const fileName =
      `${Date.now()}.${fileExt}`;

    const { error: uploadError } =
      await window.supabase.storage
        .from("report-images")
        .upload(fileName, imageFile);

    if (uploadError) {
      console.log("UPLOAD ERROR:", uploadError);
      alert("画像アップロード失敗: " + uploadError.message);
      return;
    }

    const { data } =
      window.supabase.storage
        .from("report-images")
        .getPublicUrl(fileName);

    imageUrl = data.publicUrl;
  }

  // ============================
  // SAVE TO DATABASE
  // ============================

  if (window.editingReportId) {

    await window.supabase
      .from("reports")
      .update({
        teacher_name: teacher,
        student_name: student,
        date,
        subject,
        content,
        homework,
        homework_status: homeworkStatus,
        understanding,
        image_url: imageUrl
      })
      .eq("id", window.editingReportId);

  } else {

    await window.supabase
      .from("reports")
      .insert([{
        teacher_name: teacher,
        student_name: student,
        date,
        subject,
        content,
        homework,
        homework_status: homeworkStatus,
        understanding,
        image_url: imageUrl,
        status: "pending"
      }]);
  }

  alert("保存しました");
  loadSavedReports();
};
// ===============================
// LOAD SAVED REPORTS
// ===============================
window.loadSavedReports = async function () {

  const currentUser =
    JSON.parse(localStorage.getItem("currentUser"));

  const container =
    document.getElementById("savedReportList");

  const search =
    document.getElementById("reportSearch")?.value || "";

  const pendingOnly =
    document.getElementById("pendingOnly")?.checked;

  const approvedOnly =
    document.getElementById("approvedOnly")?.checked;

  if (!container) return;

  container.innerHTML = "読み込み中...";

  let query =
    window.supabase
      .from("reports")
      .select("*")
      .order("created_at", {
        ascending: false
      });

  // Student / Parent only see their own
  if (
    currentUser.role === "student" ||
    currentUser.role === "parent"
  ) {
    query =
      query.eq(
        "student_name",
        currentUser.username
      );
  }

  const { data, error } =
    await query;

  if (error) {
    console.log(error);
    container.innerHTML = "読み込み失敗";
    return;
  }

  let reports = data;


  // pending only filter
  if (pendingOnly && !approvedOnly) {
    reports = reports.filter(
      report => report.status === "pending"
    );
  }

  if (approvedOnly && !pendingOnly) {
    reports = reports.filter(
      report => report.status === "approved"
    )
  }

  if (search) {
    reports = reports.filter(
      report => report.student_name === search
    );
  }


  if (!reports.length) {
    container.innerHTML = "レポートなし";
    return;
  }

  container.innerHTML = "";

  reports.forEach(report => {

    container.innerHTML += `
            <div class="saved-report-card"
                style="position:relative;">
                <div class="report-header">
                    <h3>${report.student_name}</h3>
                    <span>${report.subject}</span>
                </div>

                <p><strong>教師:</strong> ${report.teacher_name}</p>
                <p><strong>日付:</strong> ${report.date}</p>
                <p><strong>授業:</strong> ${report.content}</p>
                <p><strong>宿題:</strong> ${report.homework}</p>
                <p><strong>宿題状況:</strong> ${report.homework_status}</p>
                <p><strong>理解度:</strong> ${report.understanding}/10</p>
                <p><strong>状況:</strong>
${report.status === "approved"
    ? `<img src="assets/images/approved.png"
            class="approved-stamp">`
    : "Pending"}
</p>

                <div class="report-actions">

  ${currentUser.role === "headmaster" && report.status !== "approved"
        ? `<button onclick="approveReport('${report.id}')">
         ✅ Approve
       </button>`
        : ""}

  <button onclick="editReport('${report.id}')">
      ✏️ Edit
  </button>

  <button onclick="deleteReport('${report.id}')">
      🗑 Delete
  </button>

</div>
            </div>
        `;
  });
};
window.deleteReport = async function (id) {

  const currentUser =
    JSON.parse(localStorage.getItem("currentUser"));

  if (
    currentUser.role === "student" ||
    currentUser.role === "parent"
  ) {
    alert("権限ありません");
    return;
  }

  if (!confirm("削除しますか？")) return;

  const { error } =
    await window.supabase
      .from("reports")
      .delete()
      .eq("id", id);

  if (error) {
    alert("削除失敗");
    return;
  }

  loadSavedReports();
};
window.editReport = async function (id) {

  const currentUser =
    JSON.parse(localStorage.getItem("currentUser"));

  // Block students + parents
  if (
    currentUser.role === "student" ||
    currentUser.role === "parent"
  ) {
    alert("権限ありません");
    return;
  }

  const { data, error } =
    await window.supabase
      .from("reports")
      .select("*")
      .eq("id", id)
      .single();

  if (error) {
    alert("読み込み失敗");
    return;
  }

  // Open report section
  showSection("report");

  // Open form
  document.getElementById("reportForm")
    .style.display = "block";

  // Fill values
  document.getElementById("teacher_name").value =
    data.teacher_name;

  await loadUsers();

  document.getElementById("student_name").value =
    data.student_name.trim();
  document.getElementById("date").value =
    data.date;

  document.getElementById("subject").value =
    data.subject;

  document.getElementById("content").value =
    data.content;

  document.getElementById("homework").value =
    data.homework;

  document.getElementById("homeworkStatus").value =
    data.homework_status;

  document.getElementById("understanding").value =
    data.understanding;

  // Save edit mode
  window.editingReportId = id;
};
window.loadStudentReports = async function () {

  const currentUser =
    JSON.parse(localStorage.getItem("currentUser"));

  const container =
    document.getElementById("studentReportList");

  if (!container) return;

  container.innerHTML = "読み込み中...";

  const cleanUsername =
    currentUser.username.trim();

  const { data, error } =
    await window.supabase
      .from("reports")
      .select("*")
      .eq("status", "approved")
      .order("created_at", {
        ascending: false
      });
  if (error) {
    console.log(error);
    container.innerHTML = "読み込み失敗";
    return;
  }

  const myReports =
    data.filter(report =>
      report.student_name?.trim() === cleanUsername
    );

  if (!myReports.length) {
    container.innerHTML = "レポートなし";
    return;
  }

  container.innerHTML = "";

  myReports.forEach(report => {
    container.innerHTML += `
    <div class="saved-report-card">
      <h3>${report.subject}</h3>

      <p><strong>教師:</strong> ${report.teacher_name}</p>
      <p><strong>日付:</strong> ${report.date}</p>
      <p><strong>授業:</strong> ${report.content}</p>
      <p><strong>宿題:</strong> ${report.homework}</p>
      <p><strong>理解度:</strong> ${report.understanding}/10</p>
      <p><strong>Status:</strong> ${report.status}</p>

      ${report.image_url ? `
        <img src="${report.image_url}"
             style="width:100%; border-radius:12px; margin-top:10px;">
      ` : ""}
    </div>
  `;
  });
};
window.approveReport = async function (id) {

  const currentUser =
    JSON.parse(localStorage.getItem("currentUser"));

  if (currentUser.role !== "headmaster") {
    alert("権限ありません");
    return;
  }

  const { error } =
    await window.supabase
      .from("reports")
      .update({
        status: "approved",
        approved_by: currentUser.username,
        approved_at: new Date()
      })
      .eq("id", id);

  if (error) {
    console.log(error);
    alert("承認失敗");
    return;
  }

  document
    .getElementById("approveModal")
    .style.display = "flex";

  loadSavedReports();
};
