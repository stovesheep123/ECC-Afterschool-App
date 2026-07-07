// ===============================
// QUIZ SYSTEM
// ===============================

let currentQuiz = null;
let currentQuestion = 0;
let studentAnswers = [];
let currentSubject = "";


// ===============================
// Load Subject Function
// ===============================
window.loadSubjectTests = async function (subject) {

    const currentUser =
        JSON.parse(localStorage.getItem("currentUser"));

    // Hide quiz player
    document.getElementById("quizPlayer").style.display = "none";

    document.getElementById("subjectTests").innerHTML =
        "<h2>Loading...</h2>";

    // Get quizzes for this subject
    const { data: quizzes, error } =
        await window.supabase
            .from("quizzes")
            .select("*")
            .eq("subject", subject);

    console.log("Logged in user:", currentUser.username);
    console.log("Selected subject:", subject);
    console.log("All quizzes:", quizzes);
    if (error) {

        console.log(error);

        return;

    }

    let html = `<h2>${subject}</h2>`;

    // Loop through quizzes
    for (const quiz of quizzes) {

        // Skip quizzes not assigned to this student
        console.log("Quiz:", quiz.title);
        console.log("Students:", quiz.students);
        console.log("Current user:", currentUser.username);
        console.log(
            "Match:",
            quiz.students.includes(currentUser.username)
        );

        if (!quiz.students.includes(currentUser.username)) {
            continue;
        }

        // Has the student already submitted?
        const { data: submitted } =
            await window.supabase
                .from("quiz_results")
                .select("id")
                .eq("quiz_id", quiz.id)
                .eq("student", currentUser.username)
                .maybeSingle();

        html += `

<div class="quiz-card">

    <h3>${quiz.title}</h3>

    <p>👨‍🏫 ${quiz.created_by}</p>

    <p>${quiz.question_count} Questions</p>

    <p>${quiz.minutes} Minutes</p>

    ${submitted
                ?
                `<button disabled>✅ Submitted</button>`
                :
                `<button onclick="startQuiz('${quiz.id}')">
            🚀 Start Test
        </button>`
            }

</div>

`;

    }

    if (html === `<h2>${subject}</h2>`) {

        html += "<p>No tests available.</p>";

    }

    document.getElementById("subjectTests").innerHTML = html;

}

// ===============================
// Start Quiz Function
// ===============================
window.startQuiz = async function (id) {

    const { data, error } =
        await window.supabase
            .from("quizzes")
            .select("*")
            .eq("id", id)
            .single();

    if (error) {

        console.log(error);

        return;

    }

    currentQuiz = data;

    currentQuestion = 0;

    studentAnswers = [];

    // Hide subject list while taking test
    document.getElementById("subjectTests").style.display = "none";

    // Show quiz player
    document.getElementById("quizPlayer").style.display = "block";

    // Show Next button
    document.getElementById("nextQuestionBtn").style.display = "block";

    showQuestion();

};

// ===============================
// Show Quiz Function
// ===============================
function showQuestion() {

    const q = currentQuiz.questions[currentQuestion];

    document.getElementById("quizProgress").innerText =

        `Question ${currentQuestion + 1} / ${currentQuiz.questions.length}`;

    document.getElementById("quizQuestion").innerText =

        q.question;

    const choices =
        document.getElementById("quizChoices");

    choices.innerHTML = "";

    q.choices.forEach((choice, index) => {

        choices.innerHTML += `

<button
class="quiz-choice"
onclick="selectAnswer(${index})">

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

    document
        .querySelectorAll(".quiz-choice")
        .forEach((button, i) => {

            button.classList.remove("selected");

            if (i === index) {

                button.classList.add("selected");

            }

        });

}

// ===============================
// Next Question Function
// ===============================
window.nextQuestion = function () {

    if (studentAnswers[currentQuestion] == null) {

        alert("Please select an answer.");

        return;

    }

    currentQuestion++;

    if (currentQuestion >= currentQuiz.questions.length) {

        finishQuiz();

        return;

    }

    showQuestion();

}
// ===============================
// Finsh Quiz Function
// ===============================
window.finishQuiz = async function () {

    let score = 0;

    currentQuiz.questions.forEach((q, i) => {

        if (studentAnswers[i] == q.answer) {

            score++;

        }

    });

    const currentUser =
        JSON.parse(localStorage.getItem("currentUser"));

    const { error } =
        await window.supabase

            .from("quiz_results")

            .insert([{

                quiz_id: currentQuiz.id,

                student: currentUser.username,

                score,

                total: currentQuiz.questions.length,

                answers: studentAnswers

            }]);

    if (error) {

        console.log(error);

        alert(error.message);

        return;

    }

    alert(`🎉 Score ${score}/${currentQuiz.questions.length}`);

    // Hide player
    document.getElementById("quizPlayer").style.display = "none";

    // Show subject list again
    document.getElementById("subjectTests").style.display = "block";

    // Reload the subject so completed quizzes become "Submitted"
    loadSubjectTests(currentQuiz.subject);

}
window.loadStudentResults = async function () {

    const currentUser =
        JSON.parse(localStorage.getItem("currentUser"));

    const box =
        document.getElementById("studentResultList");

    box.innerHTML = "Loading...";

    const { data, error } =
        await window.supabase

            .from("quiz_results")

            .select("*")

            .eq("student", currentUser.username)

            .order("submitted_at", { ascending: false });

    if (error) {

        console.log(error);

        return;

    }

    if (data.length === 0) {

        box.innerHTML = "<h2>No test results yet.</h2>";

        return;

    }

    let html = "";

    data.forEach(result => {

        const percent = Math.round(
            result.score / result.total * 100
        );

        html += `

<div class="result-card">

    <h2>${result.score} / ${result.total}</h2>

    <p>${percent}%</p>

    <p>${new Date(result.submitted_at).toLocaleString()}</p>

</div>

`;

    });

    box.innerHTML = html;

}
