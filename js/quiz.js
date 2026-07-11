// ===============================
// QUIZ SYSTEM STATE ENGINE
// ===============================
let currentQuiz = null;
let currentQuestion = 0;
let studentAnswers = [];
let currentSubject = "";

// ===============================
// Load Subject Function
// ===============================
window.loadSubjectTests = async function (subject) {
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    if (!currentUser) return;

    currentSubject = subject;

    // Reset layout display views cleanly
    document.getElementById("quizPlayer").style.display = "none";
    
    const subjectContainer = document.getElementById("subjectTests");
    subjectContainer.style.display = "block"; // Fixed: Ensure container is visible!
    subjectContainer.innerHTML = "<h2>Loading tests...</h2>";

    // Get quizzes for this subject
    const { data: quizzes, error } = await window.supabase
        .from("quizzes")
        .select("*")
        .eq("subject", subject);

    if (error) {
        console.error("Error fetching quizzes:", error);
        subjectContainer.innerHTML = "<p>Error loading tests.</p>";
        return;
    }

    let html = `<h2>${subject}</h2>`;
    let availableTestsCount = 0;

    // Loop through quizzes sequentially
    for (const quiz of quizzes) {
        // Skip quizzes not assigned to this student
        if (!quiz.students || !quiz.students.includes(currentUser.username)) {
            continue;
        }

        availableTestsCount++;

        // Has the student already submitted this test?
        const { data: submitted } = await window.supabase
            .from("quiz_results")
            .select("id")
            .eq("quiz_id", quiz.id)
            .eq("student", currentUser.username)
            .maybeSingle();

        html += `
            <div class="quiz-card">
                <h3>${quiz.title}</h3>
                <p>👨‍🏫 Created by: ${quiz.created_by}</p>
                <p>📝 ${quiz.question_count || quiz.questions.length} Questions</p>
                <p>⏱️ ${quiz.minutes} Minutes</p>
                ${submitted
                    ? `<button disabled style="background: #ccc; cursor: not-allowed;">✅ Submitted</button>`
                    : `<button onclick="startQuiz('${quiz.id}')">🚀 Start Test</button>`
                }
            </div>
        `;
    }

    if (availableTestsCount === 0) {
        html += "<p>No tests available for your account in this subject.</p>";
    }

    subjectContainer.innerHTML = html;
};

// ===============================
// Start Quiz Function
// ===============================
window.startQuiz = async function (id) {
    const { data, error } = await window.supabase
        .from("quizzes")
        .select("*")
        .eq("id", id)
        .single();

    if (error || !data) {
        console.error("Error starting quiz:", error);
        alert("Failed to initialize test session.");
        return;
    }

    currentQuiz = data;
    currentQuestion = 0;
    studentAnswers = new Array(currentQuiz.questions.length).fill(null); // Explicit clean array mapping

    // Adjust structural visibility matrix
    document.getElementById("subjectTests").style.display = "none";
    document.getElementById("quizPlayer").style.display = "block";
    document.getElementById("nextQuestionBtn").style.display = "block";

    showQuestion();
};

// ===============================
// Show Quiz Function
// ===============================
function showQuestion() {
    if (!currentQuiz || !currentQuiz.questions[currentQuestion]) return;

    const q = currentQuiz.questions[currentQuestion];

    // Update progress numbers & counters
    document.getElementById("quizProgress").innerText = 
        `Question ${currentQuestion + 1} / ${currentQuiz.questions.length}`;
    
    document.getElementById("quizQuestion").innerText = q.question;

    const choicesContainer = document.getElementById("quizChoices");
    choicesContainer.innerHTML = "";

    // Generate answer node blocks safely
    q.choices.forEach((choice, index) => {
        // Look ahead to see if the user has already tapped or saved an answer position
        const isSelected = studentAnswers[currentQuestion] === index;
        const selectedClass = isSelected ? "quiz-choice selected" : "quiz-choice";

        choicesContainer.innerHTML += `
            <button class="${selectedClass}" onclick="selectAnswer(${index})">
                ${choice}
            </button>
        `;
    });
}

// ===============================
// Select Answer Function
// ===============================
window.selectAnswer = function (index) {
    studentAnswers[currentQuestion] = index;

    // Fast layout node selection update loop
    document.querySelectorAll(".quiz-choice").forEach((button, i) => {
        if (i === index) {
            button.classList.add("selected");
        } else {
            button.classList.remove("selected");
        }
    });
};

// ===============================
// Next Question Function
// ===============================
window.nextQuestion = function () {
    if (studentAnswers[currentQuestion] === null) {
        alert("Please select an answer before continuing.");
        return;
    }

    currentQuestion++;

    if (currentQuestion >= currentQuiz.questions.length) {
        finishQuiz();
        return;
    }

    showQuestion();
};

// ===============================
// Finish Quiz Function
// ===============================
window.finishQuiz = async function () {
    let score = 0;

    currentQuiz.questions.forEach((q, i) => {
        if (parseInt(studentAnswers[i]) === parseInt(q.answer)) {
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
        console.error("Error submitting evaluation score details:", error);
        alert("Submission failed: " + error.message);
        return;
    }

    alert(`🎉 Quiz Finished! Score: ${score}/${currentQuiz.questions.length}`);

    // Hide UI runtime views back to safety profile grid
    document.getElementById("quizPlayer").style.display = "none";
    
    // Refresh parent state arrays cleanly
    loadSubjectTests(currentQuiz.subject);
};

// ===============================
// Load Student Results History
// ===============================
window.loadStudentResults = async function () {
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    const box = document.getElementById("studentResultList");
    if (!box) return;

    box.innerHTML = "Loading your performance results...";

    // Fixed: Inner-join select setup fetches quiz properties dynamically from referencing foreign tables!
    const { data, error } = await window.supabase
        .from("quiz_results")
        .select(`
            id,
            score,
            total,
            submitted_at,
            quizzes (
                title,
                subject
            )
        `)
        .eq("student", currentUser.username)
        .order("submitted_at", { ascending: false });

    if (error) {
        console.error("Error loading performance charts:", error);
        box.innerHTML = "<p>Could not retrieve grading data.</p>";
        return;
    }

    if (!data || data.length === 0) {
        box.innerHTML = "<h2>No test results found yet.</h2>";
        return;
    }

    let html = "";
    data.forEach(result => {
        const percent = Math.round((result.score / result.total) * 100);
        // Fallback protection string if database joins resolve asynchronously or read null fields
        const testTitle = result.quizzes ? result.quizzes.title : "Unknown Quiz Module";
        const testSubject = result.quizzes ? result.quizzes.subject : "General Evaluation";

        html += `
            <div class="result-card">
                <h3>${testTitle} (${testSubject})</h3>
                <h2>${result.score} / ${result.total}</h2>
                <p class="percentage">${percent}%</p>
                <p class="timestamp">📅 ${new Date(result.submitted_at).toLocaleString()}</p>
            </div>
        `;
    });

    box.innerHTML = html;
};
