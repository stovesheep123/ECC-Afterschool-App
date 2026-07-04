let currentQuiz = null;

let questionIndex = 0;

let studentAnswers = [];

window.loadQuizList =
    async function () {

        const box =
            document.getElementById(
                "quizList"
            );

        const {
            data
        }
            =
            await window.supabase
                .from("quizzes")
                .select("*");

        box.innerHTML = "";

        data.forEach(q => {

            box.innerHTML += `

<button
onclick=
"startQuiz('${q.id}')">

📝
${q.title}

</button>

`;

        });

    };



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

    questionIndex = 0;

    studentAnswers = [];

    // Show the Next button every new quiz
    document.getElementById("nextQuestionBtn").style.display = "block";

    showSection("quizPlayer");

    showQuestion();

};

window.loadSubjectTests = async function (subject) {

    const currentUser =
        JSON.parse(localStorage.getItem("currentUser"));

    document.getElementById("subjectTests").innerHTML =
        "<h2>Loading...</h2>";

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

    let html =
        `<h2>${subject}</h2>`;

    if (quizzes.length === 0) {

        html +=
            "<p>No tests.</p>";

    }

    quizzes.forEach(q => {

        html += `

        <div class="quiz-card">

            <h3>${q.title}</h3>

            <p>Teacher : ${q.created_by}</p>

            <p>${q.question_count} Questions</p>

            <p>${q.minutes} Minutes</p>

            <button onclick="startQuiz('${q.id}')">

                Start

            </button>

        </div>

        `;

    });

    document.getElementById("subjectTests").innerHTML =
        html;

}

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

    showSection("quizPlayer");

    showQuestion();

}

function showQuestion() {

    const q =
        currentQuiz.questions[currentQuestion];

    document.getElementById("quizQuestion").innerText =
        q.question;

    document.getElementById("quizProgress").innerText =
        `Question ${currentQuestion + 1} / ${currentQuiz.questions.length}`;

    document.getElementById("quizBarFill").style.width =
        ((currentQuestion + 1) /
            currentQuiz.questions.length * 100) + "%";

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

function answerQuiz(selectedIndex) {

    const correct =
        currentQuiz.questions[questionIndex].answer;

    if (selectedIndex == correct) {
        score++;
    }

    questionIndex++;

    if (questionIndex >= currentQuiz.questions.length) {

        finishQuiz();

    } else {

        showQuestion();

    }

}

function finishQuiz() {

    document.getElementById("quizQuestion").innerHTML =
        "🎉 Finished!";

    document.getElementById("quizChoices").innerHTML =
        `<h2>Your score: ${score} / ${currentQuiz.questions.length}</h2>`;

}



window.skipQuestion =
    function () {

        nextQuestion();

    };



window.nextQuestion = function () {

    if (studentAnswers[currentQuestion] == null) {

        alert("Please choose an answer.");

        return;

    }

    currentQuestion++;

    if (currentQuestion >= currentQuiz.questions.length) {

        finishQuiz();

        return;

    }

    showQuestion();

}



document.addEventListener(
    "DOMContentLoaded",
    loadQuizList
);

window.loadQuizStudents =
    async function () {

        const grade =
            document
                .getElementById(
                    "quizGrade"
                )
                .value;

        const box =
            document
                .getElementById(
                    "quizStudentList"
                );

        box.innerHTML =
            "Loading...";


        const {
            data
        }
            =
            await window.supabase

                .from(
                    "users"
                )

                .select("*")

                .eq(
                    "grade",
                    grade
                )

                .eq(
                    "role",
                    "student");


        box.innerHTML =
            "";


        data.forEach(
            student => {

                box.innerHTML += `

<label
class="student-check">

<input
type="checkbox"

value="${student.username}"

class="student-box">

${student.username}

</label>

`;

            });

    };



window.generateQuestions = function () {

    const container =
        document.getElementById("questionContainer");

    container.innerHTML = "";

    const count =
        parseInt(
            document.getElementById("quizQuestionCount").value
        );

    for (let i = 0; i < count; i++) {

        addQuestionCard();

    }

};
function addQuestionCard() {

    const container =
        document.getElementById("questionContainer");

    const number =
        container.children.length + 1;

    const card =
        document.createElement("div");

    card.className = "question-card";

    card.innerHTML = `

<h3 class="question-title">
📝 Question ${number}
</h3>

<div class="question-toolbar">

<button class="duplicateQuestion">
📋 Duplicate
</button>

<button class="deleteQuestion">
🗑 Delete
</button>

</div>

<label>Question Type</label>

<select class="questionType">

<option value="multiple">
Multiple Choice
</option>

<option value="truefalse">
True / False
</option>

<option value="short">
Short Answer
</option>

</select>

<label>Question</label>

<input
class="question"
placeholder="Enter your question">

<label>
📷 Question Image
</label>

<input
type="file"
class="questionImage"
accept="image/*">

<div class="imagePreview"></div>

<label>Choice A</label>

<input
class="choice1"
placeholder="Choice A">

<label>Choice B</label>

<input
class="choice2"
placeholder="Choice B">

<label>Choice C</label>

<input
class="choice3"
placeholder="Choice C">

<label>Choice D</label>

<input
class="choice4"
placeholder="Choice D">

<label>Correct Answer</label>

<select class="correctAnswer">

<option value="0">Choice A</option>

<option value="1">Choice B</option>

<option value="2">Choice C</option>

<option value="3">Choice D</option>

</select>

`;

    container.appendChild(card);

    card.querySelector(".deleteQuestion")
        .addEventListener("click", () => {

            card.remove();

            renumberQuestions();

        });
    card.querySelector(".questionType")
        .addEventListener("change", function () {

            updateQuestionType(card);

        });

    card.querySelector(".questionImage")
        .addEventListener("change", function (e) {

            const file = e.target.files[0];

            if (!file) return;

            const reader = new FileReader();

            reader.onload = function () {

                card.querySelector(".imagePreview").innerHTML =

                    `<img src="${reader.result}">`;

            };

            reader.readAsDataURL(file);

        });

    card.querySelector(".duplicateQuestion")
        .addEventListener("click", () => {

            const copy = card.cloneNode(true);

            container.appendChild(copy);

            renumberQuestions();

        });

}
function renumberQuestions() {

    document
        .querySelectorAll(".question-card")
        .forEach((card, index) => {

            card.querySelector("h3").innerText =
                `Question ${index + 1}`;

        });

}
function updateQuestionType(card) {

    const type =
        card.querySelector(".questionType").value;

    const choice1 = card.querySelector(".choice1");
    const choice2 = card.querySelector(".choice2");
    const choice3 = card.querySelector(".choice3");
    const choice4 = card.querySelector(".choice4");

    const correct =
        card.querySelector(".correctAnswer");

    if (type === "multiple") {

        choice1.style.display = "";
        choice2.style.display = "";
        choice3.style.display = "";
        choice4.style.display = "";

        correct.innerHTML = `

<option value="0">Choice A</option>
<option value="1">Choice B</option>
<option value="2">Choice C</option>
<option value="3">Choice D</option>

`;

    }

    if (type === "truefalse") {

        choice1.value = "True";
        choice2.value = "False";

        choice1.style.display = "";
        choice2.style.display = "";

        choice3.style.display = "none";
        choice4.style.display = "none";

        correct.innerHTML = `

<option value="0">True</option>
<option value="1">False</option>

`;

    }

    if (type === "short") {

        choice1.style.display = "none";
        choice2.style.display = "none";
        choice3.style.display = "none";
        choice4.style.display = "none";

        correct.innerHTML = `
<option value="text">
Student Text Answer
</option>
`;

    }

}
window.saveQuiz = async function () {

    const currentUser =
        JSON.parse(
            localStorage.getItem(
                "currentUser"
            ));

    if (
        currentUser.role
        !== "headmaster"
    ) {
        alert("権限ありません");
        return;
    }

    const title =
        document.getElementById(
            "quizTitle"
        ).value;

    const subject =
        document.getElementById(
            "quizSubject"
        ).value;

    const grade =
        document.getElementById(
            "quizGrade"
        ).value;

    const minutes =
        parseInt(
            document.getElementById(
                "quizMinutes"
            ).value
        );

    const count =
        parseInt(
            document.getElementById(
                "quizQuestionCount"
            ).value
        );


    // selected students

    const students =
        [
            ...document
                .querySelectorAll(
                    ".student-box:checked"
                )
        ]
            .map(
                x => x.value
            );


    // questions

    const questions =
        [
            ...document.querySelectorAll(".question-card")
        ].map(card => ({

            question:
                card.querySelector(".question").value,

            choices: [

                card.querySelector(".choice1").value,

                card.querySelector(".choice2").value,

                card.querySelector(".choice3").value,

                card.querySelector(".choice4").value

            ],

            answer:
                parseInt(
                    card.querySelector(".correctAnswer").value
                )

        }));


    const {
        error
    }
        =
        await
            window.supabase

                .from(
                    "quizzes"
                )

                .insert([{

                    title,

                    subject,

                    grade,

                    minutes,

                    question_count:
                        count,

                    students,

                    questions,

                    created_by:
                        currentUser.username

                }]);


    if (error) {

        console.log(error);

        alert(
            "保存失敗"
        );

        return;

    }

    alert(
        "🚀 Test deployed!"
    );

};

window.finishQuiz = async function () {

    let score = 0;

    currentQuiz.questions.forEach((q, index) => {

        if (studentAnswers[index] == q.correct) {

            score++;

        }

    });

    const currentUser =
        JSON.parse(localStorage.getItem("currentUser"));

    const { error } =
        await window.supabase
            .from("quiz_results")
            .insert({

                quiz_id: currentQuiz.id,

                student: currentUser.username,

                score: score,

                total: currentQuiz.questions.length,

                answers: studentAnswers

            });

    if (error) {

        console.log(error);

        alert("Could not save result.");

        return;

    }

    showResult(score);

}

function showResult(score) {

    document.getElementById("quizChoices").innerHTML = "";

    document.getElementById("quizQuestion").innerHTML = `

🎉 Test Finished!

<br><br>

Score

<br>

${score} / ${currentQuiz.questions.length}

`;

    document.getElementById("nextQuestionBtn").style.display = "none";

}
