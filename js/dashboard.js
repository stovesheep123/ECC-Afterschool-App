
/* =====================================================
   ECC Best-One
   dashboard.js
   ===================================================== */

"use strict";

// ==========================================
// QUIZ GLOBAL VARIABLES
// ==========================================
let currentQuiz = null;
let currentQuestion = 0;
let studentAnswers = [];

// ==========================================
// USER HELPERS
// ==========================================
function getCurrentUser() {
    try {
        return JSON.parse(localStorage.getItem("currentUser") || "null");
    } catch (error) {
        console.error("ユーザー情報の読み込みに失敗しました:", error);
        return null;
    }
}

function normalizeRole(role) {
    return String(role || "")
        .trim()
        .toLowerCase()
        .replace(/[\s_-]/g, "");
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

function getSupabaseClient() {
    if (!window.supabase) {
        console.error("window.supabase が見つかりません。");
        return null;
    }

    return window.supabase;
}

// ==========================================
// SECTION NAVIGATION
// ==========================================
window.showSection = function (sectionId, element = null) {
    document.querySelectorAll(".section").forEach(section => {
        section.style.display = "none";
    });

    const selected = document.getElementById(sectionId);

    if (!selected) {
        console.warn("Section not found:", sectionId);
        return;
    }

    selected.style.display = "block";

    document.querySelectorAll(".nav-item").forEach(item => {
        item.classList.remove("active");
    });

    if (element) {
        element.classList.add("active");
    } else {
        const navItem = document.querySelector(
            `.nav-item[onclick*="${sectionId}"]`
        );

        if (navItem) {
            navItem.classList.add("active");
        }
    }

    // 各画面を開いたときに必要なデータを読み込む
    const loaders = {
        notifications: "loadNotifications",
        notice: "loadNotices",
        studentReports: "loadStudentReports",
        savedReports: "loadSavedReports",
        groupReport: "loadGroupReports",
        chat: "loadChatUsers",
        takeQuiz: "loadQuizList",
        studentResults: "loadStudentResults",
        quizResultsSection: "loadQuizResults"
    };

    const loaderName = loaders[sectionId];

    if (loaderName && typeof window[loaderName] === "function") {
        window[loaderName]();
    }

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
};

// ==========================================
// ROLE PERMISSIONS
// ==========================================
function setupRolePermissions() {
    const user = getCurrentUser();

    if (!user) {
        console.warn("ログインユーザーが見つかりません。");
        return;
    }

    const role = normalizeRole(user.role);

    // いったんすべてのナビゲーションを隠す
    document.querySelectorAll(".nav-item").forEach(item => {
        item.style.display = "none";
    });

    // 指定された onclick を持つメニューを表示する
    function showActions(actions) {
        actions.forEach(action => {
            const item = document.querySelector(
                `.nav-item[onclick*="${action}"]`
            );

            if (item) {
                item.style.display = "";
            }
        });
    }

    // 全ロール共通
    showActions([
        "home",
        "notifications",
        "chat",
        "logout"
    ]);

    // HeadMaster
    if (role === "headmaster") {
        showActions([
            "notice",
            "report",
            "groupReport",
            "savedReports",
            "createQuiz",
            "quizResultsSection"
        ]);
    }

    // Teacher
    if (role === "teacher") {
        showActions([
            "report",
            "savedReports"
        ]);
    }

    // Student
    if (role === "student") {
        showActions([
            "studentReports",
            "takeQuiz",
            "studentResults"
        ]);
    }

    // Parent
    if (role === "parent") {
        showActions([
            "studentReports"
        ]);
    }

    // ログイン中のユーザー名を表示
    const userLabel = document.getElementById("currentUserLabel");

    if (userLabel) {
        userLabel.textContent =
            user.username || user.name || "ログイン中";
    }

    // 挨拶を表示
    const greeting = document.getElementById("dashboardGreeting");

    if (greeting) {
        const name = user.name || user.username || "";
        greeting.textContent = name
            ? `${name} さん、今日も学習を進めましょう。`
            : "今日も学習を進めましょう。";
    }

    // 今日の日付を表示
    const todayLabel = document.getElementById("todayLabel");

    if (todayLabel) {
        todayLabel.textContent = new Intl.DateTimeFormat("ja-JP", {
            year: "numeric",
            month: "long",
            day: "numeric"
        }).format(new Date());
    }
}

// ==========================================
// LOGOUT
// ==========================================
window.logout = async function () {
    const client = getSupabaseClient();

    try {
        if (client && client.auth &&
            typeof client.auth.signOut === "function") {
            await client.auth.signOut();
        }
    } catch (error) {
        console.error("ログアウトエラー:", error);
    }

    localStorage.removeItem("currentUser");
    sessionStorage.removeItem("currentUser");

    // ログインページのファイル名に合わせて変更してください
    window.location.href = "index.html";
};

// ==========================================
// LOAD ALL QUIZZES
// ==========================================
window.loadQuizList = async function () {
    const box = document.getElementById("quizList");

    if (!box) return;

    const client = getSupabaseClient();

    if (!client) {
        box.textContent = "データベースに接続できません。";
        return;
    }

    box.textContent = "テストを読み込んでいます...";

    const { data, error } = await client
        .from("quizzes")
        .select("*")
        .order("title", { ascending: true });

    if (error) {
        console.error("テスト一覧の読み込みに失敗しました:", error);
        box.textContent = "テストの読み込みに失敗しました。";
        return;
    }

    box.innerHTML = "";

    if (!data || data.length === 0) {
        box.textContent = "現在、テストはありません。";
        return;
    }

    data.forEach(quiz => {
        const button = document.createElement("button");

        button.type = "button";
        button.style.cssText =
            "margin:5px;padding:10px;cursor:pointer;";
        button.textContent = `📝 ${quiz.title || "無題のテスト"}`;

        button.addEventListener("click", () => {
            window.startQuiz(quiz.id);
        });

        box.appendChild(button);
    });
};

// ==========================================
// LOAD SUBJECT-SPECIFIC QUIZZES
// ==========================================
window.loadSubjectTests = async function (subject) {
    const user = getCurrentUser();
    const container = document.getElementById("subjectTests");
    const client = getSupabaseClient();

    if (!container) return;

    if (!user) {
        container.textContent = "ログイン情報が見つかりません。";
        return;
    }

    if (!client) {
        container.textContent = "データベースに接続できません。";
        return;
    }

    container.textContent = "テストを読み込んでいます...";

    const { data, error } = await client
        .from("quizzes")
        .select("*")
        .eq("subject", subject);

    if (error) {
        console.error("科目別テストの読み込みに失敗しました:", error);
        container.textContent = "テストの読み込みに失敗しました。";
        return;
    }

    const quizzes = (data || []).filter(quiz =>
        Array.isArray(quiz.students) &&
        quiz.students.includes(user.username)
    );

    let html = `<h2>${escapeHTML(subject)}</h2>`;

    if (quizzes.length === 0) {
        html += "<p>あなたに割り当てられたテストはありません。</p>";
    }

    quizzes.forEach(quiz => {
        const count = quiz.question_count ||
            (Array.isArray(quiz.questions)
                ? quiz.questions.length
                : 0);

        html += `
            <div class="quiz-card"
                 style="background:white;padding:15px;border-radius:8px;
                 margin-bottom:10px;border:1px solid #ddd;">
                <h3>${escapeHTML(quiz.title || "無題のテスト")}</h3>
                <p>担当講師：${escapeHTML(quiz.created_by || "未設定")}</p>
                <p>${count} 問</p>
                <p>${Number(quiz.minutes) || 10} 分</p>
                <button type="button"
                    onclick="startQuiz('${escapeHTML(String(quiz.id))}')">
                    テスト開始
                </button>
            </div>
        `;
    });

    container.innerHTML = html;
};

// ==========================================
// START QUIZ
// ==========================================
window.startQuiz = async function (id) {
    const client = getSupabaseClient();

    if (!client) {
        alert("データベースに接続できません。");
        return;
    }

    const { data, error } = await client
        .from("quizzes")
        .select("*")
        .eq("id", id)
        .single();

    if (error || !data) {
        console.error("テストの読み込みに失敗しました:", error);
        alert("テストを開始できませんでした。");
        return;
    }

    if (!Array.isArray(data.questions) || data.questions.length === 0) {
        alert("このテストには問題が登録されていません。");
        return;
    }

    currentQuiz = data;
    currentQuestion = 0;
    studentAnswers = new Array(data.questions.length).fill(null);

    const nextBtn = document.getElementById("nextQuestionBtn");

    if (nextBtn) {
        nextBtn.style.display = "block";
        nextBtn.textContent = "次の問題";
        nextBtn.onclick = window.nextQuestion;
    }

    window.showSection("quizPlayer");
    showQuestion();
};

// ==========================================
// DISPLAY CURRENT QUESTION
// ==========================================
function showQuestion() {
    if (!currentQuiz) return;

    const question = currentQuiz.questions[currentQuestion];

    if (!question) return;

    const questionEl = document.getElementById("quizQuestion");
    const progressEl = document.getElementById("quizProgress");
    const barFill = document.getElementById("quizBarFill");
    const choicesContainer = document.getElementById("quizChoices");

    if (!questionEl || !choicesContainer) {
        console.error("テスト画面のHTML要素が見つかりません。");
        return;
    }

    questionEl.textContent = question.question || "";

    if (progressEl) {
        progressEl.textContent =
            `問題 ${currentQuestion + 1} / ${currentQuiz.questions.length}`;
    }

    if (barFill) {
        barFill.style.width =
            `${((currentQuestion + 1) / currentQuiz.questions.length) * 100}%`;
    }

    choicesContainer.innerHTML = "";

    // 記述問題
    if (
        question.answer === "text" ||
        question.choices?.[0] === "Short Text Field Container"
    ) {
        const input = document.createElement("input");

        input.type = "text";
        input.id = "shortAnswerInput";
        input.placeholder = "回答を入力してください";
        input.style.cssText =
            "width:100%;padding:10px;box-sizing:border-box;";

        if (typeof studentAnswers[currentQuestion] === "string") {
            input.value = studentAnswers[currentQuestion];
        }

        input.addEventListener("input", () => {
            studentAnswers[currentQuestion] = input.value;
        });

        choicesContainer.appendChild(input);
        return;
    }

    // 選択問題・正誤問題
    (question.choices || []).forEach((choice, index) => {
        if (!choice || !String(choice).trim()) return;

        const button = document.createElement("button");

        button.type = "button";
        button.className = "quiz-choice";
        button.textContent = choice;
        button.style.cssText =
            "display:block;width:100%;margin-bottom:8px;" +
            "text-align:left;padding:10px;";

        if (studentAnswers[currentQuestion] === index) {
            button.classList.add("selected");
        }

        button.addEventListener("click", () => {
            window.selectAnswer(index);
        });

        choicesContainer.appendChild(button);
    });
}

// ==========================================
// SELECT ANSWER
// ==========================================
window.selectAnswer = function (index) {
    studentAnswers[currentQuestion] = index;

    document.querySelectorAll(".quiz-choice").forEach((button, i) => {
        button.classList.toggle("selected", i === index);
    });
};

// ==========================================
// SKIP QUESTION
// ==========================================
window.skipQuestion = function () {
    studentAnswers[currentQuestion] = -1;
    window.nextQuestion();
};

// ==========================================
// NEXT QUESTION
// ==========================================
window.nextQuestion = function () {
    if (!currentQuiz) return;

    const question = currentQuiz.questions[currentQuestion];

    const isShortAnswer =
        question.answer === "text" ||
        question.choices?.[0] === "Short Text Field Container";

    if (isShortAnswer) {
        const input = document.getElementById("shortAnswerInput");
        const answer = input ? input.value.trim() : "";

        studentAnswers[currentQuestion] = answer;

        if (!answer) {
            alert("回答を入力してください。スキップする場合はスキップボタンを押してください。");
            return;
        }
    } else if (studentAnswers[currentQuestion] === null) {
        alert("回答を選択してください。スキップする場合はスキップボタンを押してください。");
        return;
    }

    currentQuestion++;

    if (currentQuestion >= currentQuiz.questions.length) {
        window.finishQuiz();
        return;
    }

    showQuestion();
};

// ==========================================
// FINISH QUIZ AND SAVE RESULT
// ==========================================
window.finishQuiz = async function () {
    if (!currentQuiz) return;

    const user = getCurrentUser();
    const client = getSupabaseClient();

    if (!user || !user.username) {
        alert("ログイン情報が見つかりません。");
        return;
    }

    if (!client) {
        alert("データベースに接続できません。");
        return;
    }

    let score = 0;

    currentQuiz.questions.forEach((question, index) => {
        const answer = studentAnswers[index];

        // 記述問題はこのコードでは自動採点しない
        if (
            answer !== null &&
            answer !== -1 &&
            question.answer !== "text" &&
            Number(answer) === Number(question.answer)
        ) {
            score++;
        }
    });

    const { error } = await client
        .from("quiz_results")
        .insert([{
            quiz_id: currentQuiz.id,
            student: user.username,
            score: score,
            total: currentQuiz.questions.length,
            answers: studentAnswers
        }]);

    if (error) {
        console.error("結果の保存に失敗しました:", error);
        alert("結果を保存できませんでした: " + error.message);
        return;
    }

    showResult(score);
};

// ==========================================
// SHOW QUIZ RESULT
// ==========================================
function showResult(score) {
    const choices = document.getElementById("quizChoices");
    const question = document.getElementById("quizQuestion");
    const progress = document.getElementById("quizProgress");
    const barFill = document.getElementById("quizBarFill");
    const nextBtn = document.getElementById("nextQuestionBtn");

    if (choices) choices.innerHTML = "";
    if (progress) progress.textContent = "テスト完了";
    if (barFill) barFill.style.width = "100%";

    if (question) {
        question.innerHTML = `
            <div style="text-align:center;padding:20px;">
                <h2>🎉 テスト終了！</h2>
                <p style="font-size:24px;font-weight:bold;margin:15px 0;">
                    ${score} / ${currentQuiz.questions.length} 点
                </p>
            </div>
        `;
    }

    if (nextBtn) {
        nextBtn.style.display = "none";
    }
}

// ==========================================
// LOAD STUDENTS FOR QUIZ CREATION
// ==========================================
window.loadQuizStudents = async function () {
    const gradeEl = document.getElementById("quizGrade");
    const box = document.getElementById("quizStudentList");
    const client = getSupabaseClient();

    if (!gradeEl || !box) return;

    if (!client) {
        box.textContent = "データベースに接続できません。";
        return;
    }

    box.textContent = "生徒を読み込んでいます...";

    const { data, error } = await client
        .from("users")
        .select("*")
        .eq("grade", gradeEl.value)
        .eq("role", "student");

    if (error) {
        console.error("生徒の読み込みに失敗しました:", error);
        box.textContent = "生徒の読み込みに失敗しました。";
        return;
    }

    box.innerHTML = "";

    if (!data || data.length === 0) {
        box.textContent = "この学年の生徒が見つかりません。";
        return;
    }

    data.forEach(student => {
        const label = document.createElement("label");
        label.className = "student-check";
        label.style.cssText = "display:block;margin-bottom:5px;";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.value = student.username || "";
        checkbox.className = "student-box";

        label.appendChild(checkbox);
        label.appendChild(
            document.createTextNode(
                ` ${student.name || student.username || "名前未設定"}`
            )
        );

        box.appendChild(label);
    });
};

// ==========================================
// GENERATE QUESTION CARDS
// ==========================================
window.generateQuestions = function () {
    const container = document.getElementById("questionContainer");
    const countEl = document.getElementById("quizQuestionCount");

    if (!container || !countEl) return;

    container.innerHTML = "";

    const count = Math.max(0, parseInt(countEl.value, 10) || 0);

    for (let i = 0; i < count; i++) {
        addQuestionCard();
    }
};

// ==========================================
// QUESTION CARD EVENTS
// ==========================================
function bindCardEvents(card) {
    const deleteButton = card.querySelector(".deleteQuestion");

    if (deleteButton) {
        deleteButton.addEventListener("click", () => {
            card.remove();
            renumberQuestions();
        });
    }

    const typeSelect = card.querySelector(".questionType");

    if (typeSelect) {
        typeSelect.addEventListener("change", () => {
            updateQuestionType(card);
        });
    }

    const imageInput = card.querySelector(".questionImage");

    if (imageInput) {
        imageInput.addEventListener("change", event => {
            const file = event.target.files?.[0];

            if (!file) return;

            const reader = new FileReader();

            reader.onload = () => {
                const preview = card.querySelector(".imagePreview");
                if (!preview) return;

                const img = document.createElement("img");
                img.src = reader.result;
                img.alt = "問題画像プレビュー";
                img.style.cssText =
                    "max-width:100%;margin-top:10px;border-radius:6px;";

                preview.replaceChildren(img);
            };

            reader.readAsDataURL(file);
        });
    }

    const duplicateButton = card.querySelector(".duplicateQuestion");

    if (duplicateButton) {
        duplicateButton.addEventListener("click", () => {
            const container = document.getElementById("questionContainer");
            if (!container) return;

            const copy = card.cloneNode(true);

            const copiedImage = copy.querySelector(".questionImage");

            if (copiedImage) {
                copiedImage.value = "";
            }

            bindCardEvents(copy);
            container.appendChild(copy);
            renumberQuestions();
        });
    }
}

// ==========================================
// ADD QUESTION CARD
// ==========================================
function addQuestionCard() {
    const container = document.getElementById("questionContainer");

    if (!container) return;

    const number = container.querySelectorAll(".question-card").length + 1;
    const card = document.createElement("div");

    card.className = "question-card";
    card.style.cssText =
        "border:1px solid #ccc;padding:15px;margin-bottom:15px;" +
        "border-radius:8px;background:#f9f9f9;";

    card.innerHTML = `
        <div style="display:flex;justify-content:space-between;
                    align-items:center;gap:10px;flex-wrap:wrap;">
            <h3 class="question-title" style="margin:0;">
                📝 問題 ${number}
            </h3>
            <div class="question-toolbar">
                <button class="duplicateQuestion" type="button">📋 複製</button>
                <button class="deleteQuestion" type="button"
                    style="background:crimson;color:white;border:none;
                    padding:3px 8px;border-radius:4px;cursor:pointer;">
                    🗑 削除
                </button>
            </div>
        </div>

        <label style="display:block;margin-top:10px;">問題タイプ</label>
        <select class="questionType"
                style="width:100%;padding:6px;margin-bottom:10px;">
            <option value="multiple">選択問題</option>
            <option value="truefalse">正誤問題</option>
            <option value="short">記述問題</option>
        </select>

        <label style="display:block;">問題文</label>
        <input class="question" placeholder="問題を入力してください"
            style="width:100%;padding:6px;margin-bottom:10px;
            box-sizing:border-box;">

        <label style="display:block;">📷 問題画像</label>
        <input type="file" class="questionImage" accept="image/*"
            style="margin-bottom:10px;">
        <div class="imagePreview"></div>

        <div class="choices-area">
            <label class="lbl-c1">選択肢 A</label>
            <input class="choice1" placeholder="選択肢 A"
                style="width:100%;padding:6px;margin-bottom:5px;
                box-sizing:border-box;">

            <label class="lbl-c2">選択肢 B</label>
            <input class="choice2" placeholder="選択肢 B"
                style="width:100%;padding:6px;margin-bottom:5px;
                box-sizing:border-box;">

            <label class="lbl-c3">選択肢 C</label>
            <input class="choice3" placeholder="選択肢 C"
                style="width:100%;padding:6px;margin-bottom:5px;
                box-sizing:border-box;">

            <label class="lbl-c4">選択肢 D</label>
            <input class="choice4" placeholder="選択肢 D"
                style="width:100%;padding:6px;margin-bottom:10px;
                box-sizing:border-box;">
        </div>

        <label style="display:block;">正解</label>
        <select class="correctAnswer"
                style="width:100%;padding:6px;box-sizing:border-box;">
            <option value="0">選択肢 A</option>
            <option value="1">選択肢 B</option>
            <option value="2">選択肢 C</option>
            <option value="3">選択肢 D</option>
        </select>
    `;

    container.appendChild(card);
    bindCardEvents(card);
}

// ==========================================
// RENUMBER QUESTION CARDS
// ==========================================
function renumberQuestions() {
    document.querySelectorAll(".question-card").forEach((card, index) => {
        const title = card.querySelector(".question-title");

        if (title) {
            title.textContent = `📝 問題 ${index + 1}`;
        }
    });
}

// ==========================================
// UPDATE QUESTION TYPE
// ==========================================
function updateQuestionType(card) {
    const type = card.querySelector(".questionType")?.value;

    const choices = [
        card.querySelector(".choice1"),
        card.querySelector(".choice2"),
        card.querySelector(".choice3"),
        card.querySelector(".choice4")
    ];

    const labels = [
        card.querySelector(".lbl-c1"),
        card.querySelector(".lbl-c2"),
        card.querySelector(".lbl-c3"),
        card.querySelector(".lbl-c4")
    ];

    const correct = card.querySelector(".correctAnswer");

    if (!correct) return;

    if (type === "multiple") {
        [...choices, ...labels].forEach(element => {
            if (element) element.style.display = "";
        });

        correct.innerHTML = `
            <option value="0">選択肢 A</option>
            <option value="1">選択肢 B</option>
            <option value="2">選択肢 C</option>
            <option value="3">選択肢 D</option>
        `;
    } else if (type === "truefalse") {
        if (choices[0]) choices[0].value = "True";
        if (choices[1]) choices[1].value = "False";

        [choices[0], choices[1], labels[0], labels[1]].forEach(element => {
            if (element) element.style.display = "";
        });

        [choices[2], choices[3], labels[2], labels[3]].forEach(element => {
            if (element) element.style.display = "none";
        });

        correct.innerHTML = `
            <option value="0">True</option>
            <option value="1">False</option>
        `;
    } else if (type === "short") {
        [...choices, ...labels].forEach(element => {
            if (element) element.style.display = "none";
        });

        correct.innerHTML =
            '<option value="text">記述式（自動採点なし）</option>';
    }
}

// ==========================================
// SAVE QUIZ
// ==========================================
window.saveQuiz = async function () {
    const user = getCurrentUser();
    const client = getSupabaseClient();

    if (!user || normalizeRole(user.role) !== "headmaster") {
        alert("テストを作成する権限がありません。");
        return;
    }

    if (!client) {
        alert("データベースに接続できません。");
        return;
    }

    const title = document.getElementById("quizTitle")?.value.trim() || "";
    const subject = document.getElementById("quizSubject")?.value || "";
    const grade = document.getElementById("quizGrade")?.value || "";
    const minutes =
        parseInt(document.getElementById("quizMinutes")?.value, 10) || 10;

    if (!title) {
        alert("テストのタイトルを入力してください。");
        return;
    }

    const students = [
        ...document.querySelectorAll(".student-box:checked")
    ].map(input => input.value);

    const cards = [...document.querySelectorAll(".question-card")];

    if (cards.length === 0) {
        alert("最低1つの問題を追加してください。");
        return;
    }

    const questions = cards.map(card => {
        const type =
            card.querySelector(".questionType")?.value || "multiple";

        const questionText =
            card.querySelector(".question")?.value.trim() || "";

        let choices = [];
        let answer =
            card.querySelector(".correctAnswer")?.value ?? "0";

        if (type === "multiple") {
            choices = [
                card.querySelector(".choice1")?.value || "",
                card.querySelector(".choice2")?.value || "",
                card.querySelector(".choice3")?.value || "",
                card.querySelector(".choice4")?.value || ""
            ];
        } else if (type === "truefalse") {
            choices = ["True", "False"];
        } else {
            choices = ["Short Text Field Container"];
            answer = "text";
        }

        return {
            question: questionText,
            type,
            choices,
            answer
        };
    });

    if (questions.some(question => !question.question)) {
        alert("問題文が空欄の問題があります。");
        return;
    }

    const { error } = await client
        .from("quizzes")
        .insert([{
            title,
            subject,
            grade,
            minutes,
            question_count: questions.length,
            students,
            questions,
            created_by: user.username
        }]);

    if (error) {
        console.error("テストの保存に失敗しました:", error);
        alert("保存に失敗しました: " + error.message);
        return;
    }

    alert("テストを保存しました。");

    if (typeof window.loadQuizList === "function") {
        window.loadQuizList();
    }
};

// ==========================================
// INITIALIZATION
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    setupRolePermissions();

    if (typeof window.loadQuizList === "function") {
        window.loadQuizList();
    }

    if (document.getElementById("home")) {
        window.showSection("home");
    }
});
