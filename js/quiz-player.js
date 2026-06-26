let currentQuiz = null;

let currentQuestion = 0;

let score = 0;

let timer = null;

let secondsLeft = 0;


/*=================
LOAD TESTS
=================*/

window.loadQuizList =
    async function () {

        const user =
            JSON.parse(
                localStorage.getItem(
                    "currentUser"
                ));

        const box =
            document.getElementById(
                "quizList"
            );

        box.innerHTML = "";


        const {
            data
        }
            =
            await window.supabase

                .from("quizzes")

                .select("*")

                .contains(
                    "students",
                    [
                        user.username
                    ]
                );


        if (!data.length) {

            box.innerHTML =
                `
<div class="quiz-empty">

🎉 No pending tests

</div>
`;

            return;

        }

        for (
            const q
            of data
        ) {

            const check =
                await window.supabase

                    .from(
                        "quiz_results"
                    )

                    .select()

                    .eq(
                        "quiz_id",
                        q.id
                    )

                    .eq(
                        "student",
                        user.username
                    )

                    .maybeSingle();


            box.innerHTML += `

<button

class=
"quiz-card"

${check.data
                    ?
                    "disabled"
                    :
                    `onclick=
"startQuiz('${q.id}')"`
                }

>

${check.data
                    ?
                    "🔒 Submitted"
                    :
                    "📝"
                }

${q.title}

</button>

`;

        }


    };



/*=================
START TEST
=================*/

window.startQuiz =
    async function (id) {

        const user =
            JSON.parse(
                localStorage.getItem(
                    "currentUser"
                ));


        const result =
            await window.supabase

                .from(
                    "quiz_results"
                )

                .select("*")

                .eq(
                    "quiz_id",
                    id
                )

                .eq(
                    "student",
                    user.username

                )

                .maybeSingle();


        if (result.data) {

            alert(
                "🎉 Good Job\nAlready submitted"
            );

            return;

        }


        const {
            data
        }
            =
            await window.supabase

                .from(
                    "quizzes"
                )

                .select("*")

                .eq(
                    "id",
                    id
                )

                .single();


        currentQuiz =
            data;

        const submitted =

            await window.supabase

                .from(
                    "quiz_results"
                )

                .select()

                .eq(
                    "quiz_id",
                    id
                )

                .eq(
                    "student",

                    JSON.parse(
                        localStorage.getItem(
                            "currentUser"
                        )).username

                )

                .maybeSingle();


        if (

            submitted.data

        ) {

            alert(

                "提出済みです"

            );

            return;

        }

        currentQuestion =
            0;

        score =
            0;
        document
            .getElementById(
                "quizChoices"
            )
            .style.display =
            "grid";

        document
            .getElementById(
                "quizRanking"
            )
            .style.display =
            "none";


        secondsLeft =
            data.minutes
            *
            60;


        startTimer();

        showQuestion();

    };



/*=================
SHOW QUESTION
=================*/

function showQuestion() {

    const q =
        currentQuiz.questions[
        currentQuestion
        ];


    document
        .getElementById(
            "quizWord"
        )
        .innerText =
        q.question;


    document
        .getElementById(
            "quizQuestionNumber"
        )
        .innerText =
        currentQuestion + 1;


    document
        .getElementById(
            "quizBarFill"
        )
        .style.width =

        (

            (currentQuestion + 1)

            /

            currentQuiz.questions.length

        )

        *
        100

        +

        "%";


    const box =
        document
            .getElementById(
                "quizChoices"
            );

    box.innerHTML = "";


    q.choices
        .sort(
            () => Math.random() - 0.5
        )

        .forEach(choice => {

            box.innerHTML += `

<button

class="quiz-answer"

onclick=
"

answerQuiz(

'${choice}'

)

">

${choice}

</button>

`;

        });

}



/*=================
ANSWER
=================*/

window.answerQuiz = function (choice) {

    const q =
        currentQuiz.questions[
        currentQuestion
        ];

    if (
        choice === q.answer
    ) {
        score++;
    }

    nextQuestion();

};



window.skipQuestion =
    function () {

        nextQuestion();

    };



async function nextQuestion() {

    currentQuestion++;

    if (

        currentQuestion >=
        currentQuiz.questions.length

    ) {

        await finishQuiz();

        return;

    }

    showQuestion();

}
async function finishQuiz() {

    const user =
        JSON.parse(
            localStorage.getItem(
                "currentUser"
            ));


    await window.supabase

        .from(
            "quiz_results"
        )

        .insert([{

            quiz_id:
                currentQuiz.id,

            student:
                user.username,

            score,

            total:
                currentQuiz.questions.length

        }]);


    document
        .getElementById(
            "quizChoices"
        )

        .style.display =

        "none";


    document
        .getElementById(
            "quizRanking"
        )

        .style.display =

        "block";


    document
        .getElementById(
            "quizScore"
        )

        .innerText =

        `${score}

/

${currentQuiz.questions.length}`;


    document
        .getElementById(
            "quizMessage"
        )

        .innerText =

        score

            >=

            currentQuiz.questions.length
            *
            0.8

            ?

            "🎉 Excellent!"

            :

            "👏 Good Job";


    loadQuizList();

}


/*=================
TIMER
=================*/

function startTimer() {

    clearInterval(
        timer
    );


    timer =

        setInterval(() => {

            secondsLeft--;


            const m =

                Math.floor(
                    secondsLeft / 60
                );


            const s =

                secondsLeft % 60;


            document
                .getElementById(
                    "quizTimer"
                )

                .innerText =

                `${m}:${String(s)
                    .padStart(
                        2,
                        "0"
                    )}`;


            if (

                secondsLeft <= 0

            ) {

                finishQuiz();

            }

        }, 1000);

}





