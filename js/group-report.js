// ======================================================
// LOAD STUDENTS BY SELECTED GRADE
// ======================================================
window.loadStudentsByGrade = async function() {
    const gradeSelector = document.getElementById("gradeFilter");
    const container = document.getElementById("studentCheckboxContainer");
    
    if (!container || !gradeSelector) return;
    
    const selectedGrade = gradeSelector.value;
    if (!selectedGrade) {
        container.innerHTML = "学年を選択してください。";
        return;
    }
    
    container.innerHTML = "生徒データを読み込み中...";
    
    // Fetch users with the student role matching the designated grade string attribute
    const { data: students, error } = await window.supabase
        .from("users")
        .select("username, name, grade") // adjust field targets ('name' vs 'username') to match your schema setup
        .eq("role", "student")
        .eq("grade", selectedGrade)
        .order("username", { ascending: true });
        
    if (error) {
        console.error("Error loading students by grade segment:", error);
        container.innerHTML = "<span style='color:red;'>生徒データの読み込みに失敗しました</span>";
        return;
    }
    
    if (!students?.length) {
        container.innerHTML = `<em style='color:gray;'>${selectedGrade} の生徒は登録されていません。</em>`;
        return;
    }
    
    // Rebuild target list container out with scannable layout checkboxes
    container.innerHTML = "";
    students.forEach(student => {
        const label = document.createElement("label");
        label.style.display = "block";
        label.style.marginBottom = "6px";
        label.style.cursor = "pointer";
        
        // Use data attributes to preserve clean system string keys safely without breaking spaces
        label.innerHTML = `
            <input type="checkbox" name="selectedGroupStudents" value="${student.username}" style="margin-right: 8px;">
            <span>${student.name || student.username}</span>
        `;
        container.appendChild(label);
    });
};

// ======================================================
// SAVE GROUP REPORT (BATCH OPERATION INTO SUPABASE)
// ======================================================
window.saveGroupReport = async function() {
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    
    if (!currentUser || (currentUser.role !== "teacher" && currentUser.role !== "headmaster")) {
        alert("権限がありません");
        return;
    }
    
    // Match checked element query sequences 
    const checkboxes = document.querySelectorAll('input[name="selectedGroupStudents"]:checked');
    if (checkboxes.length === 0) {
        alert("対象の生徒を1人以上選択してください。");
        return;
    }
    
    // Standard singular metadata properties
    const date = document.getElementById("date").value;
    const subject = document.getElementById("subject").value;
    const content = document.getElementById("content").value.trim();
    const homework = document.getElementById("homework").value.trim();
    const homeworkStatus = document.getElementById("homeworkStatus").value;
    const understanding = document.getElementById("understanding").value;

    if (!date || !content) {
        alert("必須項目を入力してください（日付、授業内容）");
        return;
    }
    
    // Map individual report structural payloads per selected student item row 
    const reportRecords = Array.from(checkboxes).map(checkbox => {
        return {
            teacher_name: currentUser.username,
            student_name: checkbox.value, // student identifier username reference token
            date,
            subject,
            content,
            homework,
            homework_status: homeworkStatus,
            understanding: parseInt(understanding, 10) || 0,
            status: "pending", // Default validation state flag tracking system
            image_url: ""      // Default empty state string parameter for baseline multi-inserts
        };
    });
    
    if (!confirm(`${reportRecords.length}名分のレポートを一括作成しますか？`)) return;
    
    // Multi-row batch array payload insert via Supabase API layout engine
    const { data, error } = await window.supabase
        .from("reports")
        .insert(reportRecords);
        
    if (error) {
        console.error("Batch insert failure sequence:", error);
        alert("一括保存に失敗しました: " + error.message);
        return;
    }
    
    alert(`${reportRecords.length}件の授業レポートを一括作成しました。`);
    
    // Clean and reset tracking control flags safely
    document.getElementById("content").value = "";
    document.getElementById("homework").value = "";
    
    checkboxes.forEach(cb => { cb.checked = false; });
    
    if (typeof loadSavedReports === "function") {
        loadSavedReports();
    }
};
