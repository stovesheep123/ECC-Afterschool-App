window.questionCount = 0;

window.addQuestion = function () {

    questionCount++;

    document
        .getElementById(
            "questionContainer"
        )

        .innerHTML += `

<div class="question-card">

<input
class="question"
placeholder="Question">

<input
class="c1"
placeholder="Choice 1">

<input
class="c2"
placeholder="Choice 2">

<input
class="c3"
placeholder="Choice 3">

<input
class="c4"
placeholder="Choice 4">

<select class="correct">

<option value="1">
1
</option>

<option value="2">
2
</option>

<option value="3">
3
</option>

<option value="4">
4
</option>

</select>

</div>

`;

};
window.saveQuiz = async function () {

    const currentUser =
        JSON.parse(
            localStorage.getItem(
                "currentUser"
            ));

    if (
        currentUser.role !== "teacher"
        &&
        currentUser.role !== "headmaster"
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

    if (!title) {
        alert("タイトル入力");
        return;
    }


    // CREATE QUIZ
    const {
        data: quiz,
        error
    }
        =
        await window.supabase
            .from("quizzes")
            .insert([{

                title,
                subject,
                grade,

                created_by:
                    currentUser.username

            }])
            .select()
            .single();


    if (error) {

        console.log(error);

        alert(
            "作成失敗"
        );

        return;

    }


    // QUESTIONS
    const cards =
        document.querySelectorAll(
            ".question-card"
        );

    const questions = [];

    cards.forEach(card => {

        questions.push({

            quiz_id:
                quiz.id,

            question:
                card.querySelector(
                    ".question"
                ).value,

            choice1:
                card.querySelector(
                    ".c1"
                ).value,

            choice2:
                card.querySelector(
                    ".c2"
                ).value,

            choice3:
                card.querySelector(
                    ".c3"
                ).value,

            choice4:
                card.querySelector(
                    ".c4"
                ).value,

            correct_answer:
                parseInt(
                    card.querySelector(
                        ".correct"
                    ).value
                )

        });

    });


    const {
        error: qError
    }
        =
        await window.supabase
            .from(
                "quiz_questions"
            )
            .insert(
                questions
            );


    if (qError) {

        console.log(
            qError
        );

        alert(
            "問題保存失敗"
        );

        return;

    }


    alert(
        "テスト配信成功 🎉"
    );


    document
        .getElementById(
            "questionContainer"
        )
        .innerHTML =
        "";

};
window.loadTests =
    async function () {

        const currentUser =
            JSON.parse(
                localStorage
                    .getItem(
                        "currentUser"
                    )
            );

        const container =
            document
                .getElementById(
                    "availableTests"
                );

        container.innerHTML =
            "Loading...";

        const {
            data
        }
            =
            await window
                .supabase
                .from(
                    "quizzes"
                )
                .select("*")
                .eq(
                    "grade",
                    currentUser.grade
                );

        if (
            !data.length
        ) {

            container.innerHTML =
                "No tests";

            return;

        }

        container.innerHTML =
            "";

        data.forEach(
            quiz => {

                container.innerHTML
                    +=
                    `
<div
class="
saved-report-card
">

<h3>
${quiz.title}
</h3>

<p>
${quiz.subject}
</p>

<button

onclick=
"
startQuiz(
'${quiz.id}'
)
"

>

Start

</button>

</div>
`;

            });

    };

window.startQuiz =
    async function (
        quizId
    ) {

        const {
            data
        }
            =
            await window
                .supabase
                .from(
                    "quiz_questions"
                )
                .select("*")
                .eq(
                    "quiz_id",
                    quizId);

        const area =
            document
                .getElementById(
                    "quizArea"
                );

        area.innerHTML =
            "";

        data.forEach(
            (
                q,
                i
            ) => {

                area.innerHTML
                    +=
                    `

<div
class="
saved-report-card
">

<h3>

Q${i + 1}

</h3>

<p>

${q.question}

</p>

<label>

<input
type=
radio

name=
q${i}

value=
1>

${q.choice1}

</label>

<br>

<label>

<input
type=
radio

name=
q${i}

value=
2>

${q.choice2}

</label>

<br>

<label>

<input
type=
radio

name=
q${i}

value=
3>

${q.choice3}

</label>

<br>

<label>

<input
type=
radio

name=
q${i}

value=
4>

${q.choice4}

</label>

</div>

`;

            });

        area.innerHTML +=
            `

<button

onclick=

"

submitQuiz(

'${quizId}'

)

"

>

Submit

</button>

`;

        window.currentQuiz =
            data;

    };
