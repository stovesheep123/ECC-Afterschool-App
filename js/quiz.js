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
