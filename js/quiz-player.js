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


        data.forEach(q => {

            box.innerHTML += `

<button
class="quiz-card"

onclick=
"startQuiz('${q.id}')">

📝

${q.title}

<br>

${q.subject}

</button>

`;

        });

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

        currentQuestion =
            0;

        score =
            0;


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

window.answerQuiz =
    function (choice) {

        const q =
            currentQuiz.questions[
            currentQuestion
            ];


        if (
            choice ===
            q.answer
        ) {

            score++;

        }


        nextQuestion();

    };



window.skipQuestion =
    function () {

        nextQuestion();

    };



function nextQuestion() {

    currentQuestion++;


    if (

        currentQuestion

        >=

        currentQuiz.questions.length

    ) {

        submitQuiz();

        return;

    }


    showQuestion();

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

                submitQuiz();

            }

        }, 1000);

}



/*=================
SUBMIT
=================*/

async function submitQuiz() {

    clearInterval(
        timer
    );

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

        .innerHTML =

        `

<div class="quiz-finished">

🎉

<h2>

Good Job

</h2>

<p>

Submitted

</p>

</div>

`;


    loadQuizList();

}