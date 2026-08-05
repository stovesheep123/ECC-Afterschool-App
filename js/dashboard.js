

// ==========================================
// SECTION MANAGER
// ==========================================
window.showSection = function (sectionId, element = null) {
    // Hide all sections
    document.querySelectorAll(".section").forEach(section => {
        section.style.display = "none";
    });

    // Show selected section
    const selected = document.getElementById(sectionId);
    if (selected) {
        selected.style.display = "block";
    }

    // Highlight active menu item
    document.querySelectorAll(".nav-item").forEach(item => {
        item.classList.remove("active");
    });

    if (element) {
        element.classList.add("active");
    }
};

// ==========================================
// ROLE PERMISSIONS
// ==========================================
function setupRolePermissions() {
    const user = JSON.parse(localStorage.getItem("currentUser"));
    if (!user) return;

    // Hide everything first
    document.querySelectorAll(".nav-item").forEach(item => {
        item.style.display = "none";
    });

    // Elements visible to everyone (with safety guards)
    const commonSelectors = ['home', 'notifications', 'chat', 'logout'];
    commonSelectors.forEach(action => {
        const el = document.querySelector(`[onclick*="${action}"]`);
        if (el) el.style.display = "";
    });

    // Headmaster Permissions
    if (user.role === "headmaster") {
        const hmSelectors = ['notice', 'report', 'groupReport', 'savedReports', 'createQuiz', 'quizResultsSection'];
        hmSelectors.forEach(act => {
            const el = document.querySelector(`[onclick*="${act}"]`);
            if (el) el.style.display = "";
        });
    }

    // Teacher Permissions
    if (user.role === "teacher") {
        const tSelectors = ['report', 'savedReports'];
        tSelectors.forEach(act => {
            const el = document.querySelector(`[onclick*="${act}"]`);
            if (el) el.style.display = "";
        });
    }

    // Student Permissions
    if (user.role === "student") {
        const sSelectors = ['studentReports', 'takeQuiz'];
        sSelectors.forEach(act => {
            const el = document.querySelector(`[onclick*="${act}"]`);
            if (el) el.style.display = "";
        });
    }

    // Parent Permissions
    if (user.role === "parent") {
        const pEl = document.querySelector('[onclick*="studentReports"]');
        if (pEl) pEl.style.display = "";
    }
}

// ==========================================
// LOAD ALL TESTS (GENERAL LIST)
// ==========================================
window.loadQuizList = async function () {
    const box = document.getElementById("quizList");
    if (!box) return;

    const { data, error } = await window.supabase
        .from("quizzes")
        .select("*");

    if (error) {
        console.error("Error loading quiz list:", error);
        return;
    }

    box.innerHTML = "";
    data.forEach(q => {
        box.innerHTML += `
            <button onclick="startQuiz('${q.id}')" style="margin: 5px; padding: 10px; cursor: pointer;">
                📝 ${q.title}
            </button>
        `;
    });
};

// ==========================================
// LOAD SUBJECT SPECIFIC TESTS
// ==========================================
window.loadSubjectTests = async function (subject) {
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    const container = document.getElementById("subjectTests");

    if (container) {
        container.innerHTML = "<h2>Loading tests...</h2>";
    }

    const { data, error } = await window.supabase
        .from("quizzes")
        .select("*")
        .eq("subject", subject);

    if (error) {
        console.error("Error loading subject tests:", error);
        return;
    }

    const quizzes = data.filter(q => q.students && q.students.includes(currentUser.username));
    let html = `<h2>${subject}</h2>`;

    if (quizzes.length === 0) {
        html += "<p>No tests available for your account.</p>";
    }

    quizzes.forEach(q => {
        html += `
            <div class="quiz-card" style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 10px; border: 1px solid #ddd;">
                <h3>${q.title}</h3>
                <p>Teacher : ${q.created_by}</p>
                <p>${q.question_count || q.questions.length} Questions</p>
                <p>${q.minutes} Minutes</p>
                <button onclick="startQuiz('${q.id}')" style="padding: 6px 12px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">Start</button>
            </div>
        `;
    });

    if (container) {
        container.innerHTML = html;
    }
};

// ==========================================
// QUIZ PLAYER ENGINE
// ==========================================
window.startQuiz = async function (id) {
    const { data, error } = await window.supabase
        .from("quizzes")
        .select("*")
        .eq("id", id)
        .single();

    if (error || !data) {
        console.error("Error retrieving quiz data:", error);
        alert("Failed to start the quiz initialization routine.");
        return;
    }

    currentQuiz = data;
    currentQuestion = 0; 
    studentAnswers = new Array(currentQuiz.questions.length).fill(null);

    const nextBtn = document.getElementById("nextQuestionBtn");
    if (nextBtn) nextBtn.style.display = "block";
    
    showSection("quizPlayer");
    showQuestion();
};

function showQuestion() {
    if (!currentQuiz || !currentQuiz.questions[currentQuestion]) return;

    const q = currentQuiz.questions[currentQuestion];

    document.getElementById("quizQuestion").innerText = q.question;
    document.getElementById("quizProgress").innerText = `Question ${currentQuestion + 1} / ${currentQuiz.questions.length}`;
    document.getElementById("quizBarFill").style.width = ((currentQuestion + 1) / currentQuiz.questions.length * 100) + "%";

    const choicesContainer = document.getElementById("quizChoices");
    choicesContainer.innerHTML = "";

    q.choices.forEach((choice, index) => {
        if (choice && choice.trim() !== "") { 
            const isSelected = studentAnswers[currentQuestion] === index;
            const selectedClass = isSelected ? "quiz-choice selected" : "quiz-choice";
            
            choicesContainer.innerHTML += `
                <button class="${selectedClass}" onclick="selectAnswer(${index})" style="display: block; width: 100%; margin-bottom: 8px; text-align: left; padding: 10px;">
                    ${choice}
                </button>
            `;
        }
    });
}

window.selectAnswer = function (index) {
    studentAnswers[currentQuestion] = index;
    document.querySelectorAll(".quiz-choice").forEach((button, i) => {
        button.classList.remove("selected");
        if (i === index) {
            button.classList.add("selected");
        }
    });
};

window.skipQuestion = function () {
    studentAnswers[currentQuestion] = -1; // -1 represents a explicitly skipped question state tracking token
    window.nextQuestion();
};

window.nextQuestion = function () {
    if (studentAnswers[currentQuestion] === null) {
        alert("Please choose an answer before proceeding.");
        return;
    }

    currentQuestion++;

    if (currentQuestion >= currentQuiz.questions.length) {
        window.finishQuiz();
        return;
    }
    showQuestion();
};

window.finishQuiz = async function () {
    let score = 0;
    currentQuiz.questions.forEach((q, index) => {
        if (studentAnswers[index] !== null && parseInt(studentAnswers[index], 10) === parseInt(q.answer, 10)) {
            score++;
        }
    });

    const currentUser = JSON.parse(localStorage.getItem("currentUser"));

    const { error } = await window.supabase
        .from("quiz_results")
        .insert([{
            quiz_id: currentQuiz.id,
            student: currentUser.username,
            score: score,
            total: currentQuiz.questions.length,
            answers: studentAnswers
        }]);

    if (error) {
        console.error("Error syncing score parameters:", error);
        alert("Could not save result.");
        return;
    }

    showResult(score);
};

function showResult(score) {
    document.getElementById("quizChoices").innerHTML = "";
    document.getElementById("quizQuestion").innerHTML = `
        <div style="text-align: center; padding: 20px;">
            <h2>🎉 Test Finished!</h2>
            <p style="font-size: 24px; font-weight: bold; margin: 15px 0;">Score: ${score} / ${currentQuiz.questions.length}</p>
        </div>
    `;
    const nextBtn = document.getElementById("nextQuestionBtn");
    if (nextBtn) nextBtn.style.display = "none";
}

// ==========================================
// QUIZ CREATOR MANAGEMENT
// ==========================================
window.loadQuizStudents = async function () {
    const gradeEl = document.getElementById("quizGrade");
    const box = document.getElementById("quizStudentList");
    if (!gradeEl || !box) return;

    box.innerHTML = "Loading students...";

    const { data, error } = await window.supabase
        .from("users")
        .select("*")
        .eq("grade", gradeEl.value)
        .eq("role", "student");

    if (error) {
        console.error("Error fetching class profiles:", error);
        box.innerHTML = "Error loading students.";
        return;
    }

    box.innerHTML = "";
    if (data.length === 0) {
        box.innerHTML = "<em style='color: gray;'>No students found in this grade tier.</em>";
        return;
    }

    data.forEach(student => {
        box.innerHTML += `
            <label class="student-check" style="display: block; margin-bottom: 5px;">
                <input type="checkbox" value="${student.username}" class="student-box">
                ${student.name || student.username}
            </label>
        `;
    });
};

window.generateQuestions = function () {
    const container = document.getElementById("questionContainer");
    if (!container) return;
    container.innerHTML = "";

    const count = parseInt(document.getElementById("quizQuestionCount").value) || 0;
    for (let i = 0; i < count; i++) {
        addQuestionCard();
    }
};

// Helper function to dynamically map event hooks back to duplicated element segments safely
function bindCardEvents(card) {
    card.querySelector(".deleteQuestion").addEventListener("click", () => {
        card.remove();
        renumberQuestions();
    });

    card.querySelector(".questionType").addEventListener("change", function () {
        updateQuestionType(card);
    });

    card.querySelector(".questionImage").addEventListener("change", function (e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function () {
            card.querySelector(".imagePreview").innerHTML = `<img src="${reader.result}" style="max-width:100%; margin-top:10px; border-radius: 6px;">`;
        };
        reader.readAsDataURL(file);
    });

    card.querySelector(".duplicateQuestion").addEventListener("click", () => {
        const container = document.getElementById("questionContainer");
        const copy = card.cloneNode(true);
        
        // Re-inject pristine listener hooks onto the clone context manually
        bindCardEvents(copy);
        container.appendChild(copy);
        renumberQuestions();
    });
}

function addQuestionCard() {
    const container = document.getElementById("questionContainer");
    const number = container.querySelectorAll(".question-card").length + 1;
    const card = document.createElement("div");
    card.className = "question-card";
    card.style.border = "1px solid #ccc";
    card.style.padding = "15px";
    card.style.marginBottom = "15px";
    card.style.borderRadius = "8px";
    card.style.background = "#f9f9f9";

    card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
            <h3 class="question-title" style="margin: 0;">📝 Question ${number}</h3>
            <div class="question-toolbar">
                <button class="duplicateQuestion" type="button">📋 Duplicate</button>
                <button class="deleteQuestion" type="button" style="background: crimson; color: white; border: none; padding: 3px 8px; border-radius: 4px; cursor: pointer;">🗑 Delete</button>
            </div>
        </div>
        
        <label style="display:block; margin-top:10px;">Question Type</label>
        <select class="questionType" style="width: 100%; padding: 6px; margin-bottom: 10px;">
            <option value="multiple">Multiple Choice</option>
            <option value="truefalse">True / False</option>
            <option value="short">Short Answer</option>
        </select>

        <label style="display:block;">Question</label>
        <input class="question" placeholder="Enter your question" style="width: 100%; padding: 6px; margin-bottom: 10px; box-sizing: border-box;">

        <label style="display:block;">📷 Question Image</label>
        <input type="file" class="questionImage" accept="image/*" style="margin-bottom: 10px;">
        <div class="imagePreview"></div>

        <div class="choices-area">
            <label class="lbl-c1">Choice A</label>
            <input class="choice1" placeholder="Choice A" style="width: 100%; padding: 6px; margin-bottom: 5px; box-sizing: border-box;">
            <label class="lbl-c2">Choice B</label>
            <input class="choice2" placeholder="Choice B" style="width: 100%; padding: 6px; margin-bottom: 5px; box-sizing: border-box;">
            <label class="lbl-c3">Choice C</label>
            <input class="choice3" placeholder="Choice C" style="width: 100%; padding: 6px; margin-bottom: 5px; box-sizing: border-box;">
            <label class="lbl-c4">Choice D</label>
            <input class="choice4" placeholder="Choice D" style="width: 100%; padding: 6px; margin-bottom: 10px; box-sizing: border-box;">
        </div>

        <label style="display:block;">Correct Answer Option</label>
        <select class="correctAnswer" style="width: 100%; padding: 6px; box-sizing: border-box;">
            <option value="0">Choice A</option>
            <option value="1">Choice B</option>
            <option value="2">Choice C</option>
            <option value="3">Choice D</option>
        </select>
    `;

    container.appendChild(card);
    bindCardEvents(card);
}

function renumberQuestions() {
    document.querySelectorAll(".question-card").forEach((card, index) => {
        card.querySelector(".question-title").innerText = `📝 Question ${index + 1}`;
    });
}

function updateQuestionType(card) {
    const type = card.querySelector(".questionType").value;
    const choice1 = card.querySelector(".choice1");
    const choice2 = card.querySelector(".choice2");
    const choice3 = card.querySelector(".choice3");
    const choice4 = card.querySelector(".choice4");
    
    const lbl1 = card.querySelector(".lbl-c1");
    const lbl2 = card.querySelector(".lbl-c2");
    const lbl3 = card.querySelector(".lbl-c3");
    const lbl4 = card.querySelector(".lbl-c4");
    
    const correct = card.querySelector(".correctAnswer");

    if (type === "multiple") {
        [choice1, choice2, choice3, choice4, lbl1, lbl2, lbl3, lbl4].forEach(el => el.style.display = "");
        correct.innerHTML = `
            <option value="0">Choice A</option>
            <option value="1">Choice B</option>
            <option value="2">Choice C</option>
            <option value="3">Choice D</option>
        `;
    } else if (type === "truefalse") {
        choice1.value = "True";
        choice2.value = "False";
        [choice1, choice2, lbl1, lbl2].forEach(el => el.style.display = "");
        [choice3, choice4, lbl3, lbl4].forEach(el => el.style.display = "none");
        correct.innerHTML = `
            <option value="0">True</option>
            <option value="1">False</option>
        `;
    } else if (type === "short") {
        [choice1, choice2, choice3, choice4, lbl1, lbl2, lbl3, lbl4].forEach(el => el.style.display = "none");
        correct.innerHTML = `<option value="text">Student Text Answer</option>`;
    }
}

window.saveQuiz = async function () {
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));

    if (!currentUser || currentUser.role !== "headmaster") {
        alert("権限がありません");
        return;
    }

    const title = document.getElementById("quizTitle").value.trim();
    const subject = document.getElementById("quizSubject").value;
    const grade = document.getElementById("quizGrade").value;
    const minutes = parseInt(document.getElementById("quizMinutes").value, 10) || 10;
    
    if (!title) {
        alert("テストのタイトルを入力してください");
        return;
    }

    const students = [...document.querySelectorAll(".student-box:checked")].map(x => x.value);
    const cardElements = [...document.querySelectorAll(".question-card")];
    
    if (cardElements.length === 0) {
        alert("最低1つの質問を追加してください");
        return;
    }

    const questions = cardElements.map(card => {
        const type = card.querySelector(".questionType").value;
        let choicesArray = [];
        
        if (type === "multiple") {
            choicesArray = [
                card.querySelector(".choice1").value,
                card.querySelector(".choice2").value,
                card.querySelector(".choice3").value,
                card.querySelector(".choice4").value
            ];
        } else if (type === "truefalse") {
            choicesArray = ["True", "False"];
        } else {
            choicesArray = ["Short Text Field Container"];
        }

        return {
            question: card.querySelector(".question").value,
            choices: choicesArray,
            answer: card.querySelector(".correctAnswer").value
        };
    });

    const { error } = await window.supabase
        .from("quizzes")
        .insert([{
            title,
            subject,
            grade,
            minutes,
            question_count: questions.length,
            students,
            questions,
            created_by: currentUser.username
        }]);

    if (error) {
        console.error("Deployment failed:", error);
        alert("保存失敗: " + error.message);
        return;
    }

    alert("🚀 Test deployed successfully!");
};

// ==========================================
// INITIALIZATION
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    loadQuizList();
    setupRolePermissions();

    const videos = [
        "assets/Videos/Video1.mp4",
        "assets/Videos/Video2.mp4",
        "assets/Videos/Video3.mp4",
        "assets/Videos/Video4.mp4",
        "assets/Videos/Video5.mp4",
        "assets/Videos/Video6.mp4",
        "assets/Videos/Video7.mp4",
    ];

    const random = videos[Math.floor(Math.random() * videos.length)];
    const video = document.getElementById("bgVideo");

    // Guard statement protects the app framework lifecycle if video container is missing
    if (video) {
        video.src = random;
        video.load();
        
        // Auto-play is handled contextually by explicit element configuration values
        video.play().catch(err => {
            console.log("Autoplay blocked by standard browser container policies:", err);
        });
    }
});
