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

    for (let i = 1; i <= count; i++) {

        container.innerHTML += `

<div class="question-card">

<h3>問題 ${i}</h3>

<input
class="question"
placeholder="Question">

<input
class="choice1"
placeholder="Choice 1">

<input
class="choice2"
placeholder="Choice 2">

<input
class="choice3"
placeholder="Choice 3">

<input
class="choice4"
placeholder="Choice 4">

<label>Correct Answer</label>

<select class="correctAnswer">

<option value="0">Choice 1</option>

<option value="1">Choice 2</option>

<option value="2">Choice 3</option>

<option value="3">Choice 4</option>

</select>

</div>

`;

    }

};

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
            ...
            document.querySelectorAll(
                ".question-card"
            )
        ].map(card => ({

            question:
                card.querySelector(
                    ".question"
                ).value,

            answer:
                card.querySelector(
                    ".answer"
                ).value,

            choices: [

                card.querySelector(
                    ".choice1"
                ).value,

                card.querySelector(
                    ".choice2"
                ).value,

                card.querySelector(
                    ".choice3"
                ).value,

                card.querySelector(
                    ".choice4"
                ).value

            ]

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
