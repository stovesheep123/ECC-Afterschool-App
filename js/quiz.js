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

    if (error) {

        console.log(error);

        return;

    }

    let html = `<h2>${subject}</h2>`;

    // Loop through quizzes
    for (const quiz of quizzes) {

        // Skip quizzes not assigned to this student
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

    showSection("takeQuiz");

    showQuestion();

}

// ===============================
// Show Quiz Function
// ===============================
function showQuestion() {

    const q =
        currentQuiz.questions[currentQuestion];

    document.getElementById("quizQuestion").innerText =
        q.question;

    document.getElementById("currentQ").innerText =
        currentQuestion + 1;

    document.getElementById("totalQ").innerText =
        currentQuiz.questions.length;

    document.getElementById("quizBarFill").style.width =
        ((currentQuestion + 1) /
            currentQuiz.questions.length * 100) + "%";

    const box =
        document.getElementById("quizChoices");

    box.innerHTML = "";

    q.choices.forEach((choice, index) => {

        box.innerHTML += `

<button
class="quiz-answer"
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
        .querySelectorAll(".quiz-answer")
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

    currentQuiz.questions.forEach((q, index) => {

        if (studentAnswers[index] == q.answer) {

            score++;

        }

    });

    const currentUser =
        JSON.parse(localStorage.getItem("currentUser"));

    const { data, error } =
        await window.supabase
            .from("quiz_results")
            .insert({

                quiz_id: currentQuiz.id,

                student: currentUser.username,

                score: score,

                total: currentQuiz.questions.length,

                answers: studentAnswers

            });
    console.log("DATA", data);
    console.log("ERROR", error);

    if (error) {

        console.log(error);

        alert("Could not save result.");

        return;

    }

    document.getElementById("quizQuestion").innerHTML =

        `🎉 Test Finished<br><br>
        Score: ${score} / ${currentQuiz.questions.length}`;

    document.getElementById("quizChoices").innerHTML = "";

    document.getElementById("nextQuestionBtn").style.display = "none";

}
