let currentQuiz = null;

let questionIndex = 0;

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



window.startQuiz =
    async function (id) {

        const {
            data
        }
            =
            await window.supabase
                .from("quizzes")
                .select("*")
                .eq("id", id)
                .single();

        currentQuiz = data;

        questionIndex = 0;

        showQuestion();

    };



function showQuestion() {

    const q =
        currentQuiz.questions[
        questionIndex
        ];

    document.getElementById(
        "quizQuestionNumber"
    )
        .innerText =
        questionIndex + 1;

    document.getElementById(
        "quizWord"
    )
        .innerText =
        q.word;

    document.getElementById(
        "quizHint"
    )
        .innerText =
        q.hint || "";

    document.getElementById(
        "quizBarFill"
    )
        .style.width =
        (
            (questionIndex + 1)
            /
            currentQuiz.questions.length
            *
            100
        )
        + "%";

    const answers =
        document.getElementById(
            "quizChoices"
        );

    answers.innerHTML = "";

    q.options.forEach(a => {

        answers.innerHTML += `

<button
class=
"quiz-answer"

onclick=
"
answerQuiz(
'${a}',
'${q.answer}'
)
">

${a}

</button>

`;

    });

}



window.answerQuiz =
    function (choice, correct) {

        if (
            choice ===
            correct
        ) {

            alert(
                "⭕ Correct"
            );

        } else {

            alert(
                "❌ Wrong"
            );

        }

        nextQuestion();

    };



window.skipQuestion =
    function () {

        nextQuestion();

    };



function nextQuestion() {

    questionIndex++;

    if (
        questionIndex >=
        currentQuiz.questions.length
    ) {

        alert(
            "Finished!"
        );

        loadQuizList();

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
