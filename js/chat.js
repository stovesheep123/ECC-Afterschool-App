console.log("CHAT JS LOADED");
// ===============================
// LOAD USERS
// ===============================

window.loadUsers = async function () {

    console.log("loadUsers started");

    const currentUser =
        JSON.parse(localStorage.getItem("currentUser"));

    console.log("Current User:", currentUser);

    const reportSearch =
        document.getElementById("reportSearch");

    const studentSelect =
        document.getElementById("student_name");

    const { data, error } = await supabase
        .from("users")
        .select("*");

    console.log("USERS:", data);
    console.log("ERROR:", error);

    if (error) return;

    if (userSelect) {
        userSelect.innerHTML = "";
    }

    if (studentSelect) {
        studentSelect.innerHTML =
            '<option value="">選択してください</option>';
    }

    data.forEach(user => {

        console.log("Checking user:", user);

        // CHAT
        if (userSelect) {

            if (currentUser.role === "headmaster") {

                if (user.username !== currentUser.username) {
                    userSelect.innerHTML +=
                        `<option value="${user.username}">
                            ${user.username}
                        </option>`;
                }

            } else {

                if (user.role === "headmaster") {
                    userSelect.innerHTML +=
                        `<option value="${user.username}">
                            ${user.username}
                        </option>`;
                }
            }
        }

        // REPORT STUDENTS
        if (studentSelect && user.role === "student") {
            studentSelect.innerHTML +=
                `<option value="${user.username}">
                    ${user.username}
                </option>`;
        }
        if (reportSearch && user.role === "student") {
            reportSearch.innerHTML +=
                `<option value="${user.username}">
            ${user.username}
        </option>`;
        }
    });

    console.log("DONE");
};


// ===============================
// SEND MESSAGE
// ===============================

window.sendMessage = async function () {

    const currentUser =
        JSON.parse(localStorage.getItem("currentUser"));

    const toUser =
        document.getElementById("userSelect").value;

    const message =
        document.getElementById("messageInput").value;

    if (!toUser || !message) {
        alert("入力してください");
        return;
    }

    const { error } = await supabase
        .from("messages")
        .insert([{
            sender: currentUser.username,
            to_user: toUser,
            message: message
        }]);

    if (error) {
        console.log(error);
        alert("送信失敗");
        return;
    }

    alert("送信しました");

    document.getElementById("messageInput").value = "";
};