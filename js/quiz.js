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
                    "student"
                );


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

class="quizStudent">

${student.username}

</label>

`;

            });

    };



window.generateQuestions =
    function () {

        const n =
            Number(
                document
                    .getElementById(
                        "quizQuestionCount"
                    )
                    .value
            );

        const container =
            document
                .getElementById(
                    "questionContainer"
                );

        container.innerHTML =
            "";


        for (
            let i = 1;
            i <= n;
            i++
        ) {

            container.innerHTML += `

<div
class="question-block">

<h3>

Question ${i}

</h3>

<input
placeholder="問題">

<input
placeholder="正解">

</div>

`;

        }

    };
