console.log("CHAT JS LOADED");

// ===============================
// LOAD USERS
// ===============================
window.loadUsers = async function () {
    console.log("loadUsers started");

    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    console.log("Current User:", currentUser);

    // Grab DOM elements
    const userSelect = document.getElementById("userSelect"); // Fixed: Was missing declaration!
    const reportSearch = document.getElementById("reportSearch");
    const studentSelect = document.getElementById("student_name");

    // Fetch users from Supabase
    const { data, error } = await supabase
        .from("users")
        .select("*");

    console.log("USERS:", data);
    if (error) {
        console.error("ERROR FETCHING USERS:", error);
        return;
    }

    // Reset Dropdowns properly before filling them
    if (userSelect) {
        userSelect.innerHTML = '<option value="">宛先を選択してください</option>';
    }
    if (studentSelect) {
        studentSelect.innerHTML = '<option value="">選択してください</option>';
    }
    if (reportSearch) {
        // Fixed: Clear previous options so names don't duplicate on reload
        reportSearch.innerHTML = '<option value="">生徒で絞り込む</option>'; 
    }

    // Populate drop-downs based on roles
    data.forEach(user => {
        console.log("Checking user:", user);

        // --- CHAT SELECTION INTERFACE ---
        if (userSelect && currentUser) {
            // Headmasters can chat with everyone except themselves
            if (currentUser.role === "headmaster") {
                if (user.username !== currentUser.username) {
                    userSelect.innerHTML += `<option value="${user.username}">${user.username}</option>`;
                }
            } else {
                // Regular users (students/teachers) can only chat with the headmaster
                if (user.role === "headmaster") {
                    userSelect.innerHTML += `<option value="${user.username}">${user.username}</option>`;
                }
            }
        }

        // --- STUDENT REPORT FILTERS ---
        if (user.role === "student") {
            if (studentSelect) {
                studentSelect.innerHTML += `<option value="${user.username}">${user.username}</option>`;
            }
            if (reportSearch) {
                reportSearch.innerHTML += `<option value="${user.username}">${user.username}</option>`;
            }
        }
    });

    console.log("DONE LOADING USERS");
};


// ===============================
// SEND MESSAGE
// ===============================
window.sendMessage = async function () {
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    const toUserField = document.getElementById("userSelect");
    const messageField = document.getElementById("messageInput");

    if (!toUserField || !messageField) {
        console.error("Chat elements missing from the DOM.");
        return;
    }

    const toUser = toUserField.value;
    const message = messageField.value.trim(); // Trim trailing/leading whitespace spaces

    if (!toUser || !message) {
        alert("宛先とメッセージを入力してください");
        return;
    }

    if (!currentUser || !currentUser.username) {
        alert("ログインセッションが切れています。再ログインしてください。");
        return;
    }

    // Insert payload into Supabase messages table
    const { error } = await supabase
        .from("messages")
        .insert([{
            sender: currentUser.username,
            to_user: toUser,
            message: message
        }]);

    if (error) {
        console.error("Supabase error sending message:", error);
        alert("送信失敗しました");
        return;
    }

    alert("送信しました");
    messageField.value = ""; // Clear out input bar upon successful transmission
};
