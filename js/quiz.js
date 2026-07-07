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

    currentSubject = subject;

    const currentUser =
        JSON.parse(localStorage.getItem("currentUser"));

    const container =
        document.getElementById("subjectTests");

    container.innerHTML = "<h2>Loading...</h2>";

    const { data, error } =
        await window.supabase
            .from("quizzes")
            .select("*")
            .eq("subject", subject);

    if (error) {

        console.log(error);

        return;

    }

    const quizzes =
        data.filter(q =>

            q.students.includes(currentUser.username)

        );

    let html = `<h2>${subject}</h2>`;

    if (quizzes.length === 0) {

        html += "<p>No Tests</p>";

    }

    quizzes.forEach(q => {

        html += `

        <div class="quiz-card">

            <h3>${q.title}</h3>

            <p>${q.question_count} Questions</p>

            <p>${q.minutes} Minutes</p>

            <button onclick="startQuiz('${q.id}')">

                Start

            </button>

        </div>

        `;

    });

    container.innerHTML = html;

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
function showQuestion(){

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

    q.choices.forEach((choice,index)=>{

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
window.selectAnswer = function(index){

    studentAnswers[currentQuestion] = index;

    document
        .querySelectorAll(".quiz-answer")
        .forEach((button,i)=>{

            button.classList.remove("selected");

            if(i===index){

                button.classList.add("selected");

            }

        });

}
