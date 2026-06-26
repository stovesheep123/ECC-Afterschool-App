window.loadQuizResults =
    async function () {

        const user =
            JSON.parse(
                localStorage.getItem(
                    "currentUser"
                ));

        const box =
            document.getElementById(
                "quizResultList"
            );

        if (
            user.role !== "headmaster"
        ) {

            box.innerHTML =
                `
<h2>

権限ありません

</h2>
`;

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

                .select("*");


        box.innerHTML = "";


        if (
            !data?.length
        ) {

            box.innerHTML =
                `
No Tests
`;

            return;

        }


        data.forEach(
            q => {

                box.innerHTML += `

<button

class=
"quiz-card"

onclick=
"

openQuizResults(

'${q.id}',

'${q.title}'

)

"

>

📝

${q.title}

</button>

`;

            }

        );

    };




window.openQuizResults =
    async function (
        quizId,
        title
    ) {

        const {

            data

        }

            =

            await window.supabase

                .from(
                    "quiz_results"
                )

                .select("*")

                .eq(
                    "quiz_id",
                    quizId
                )

                .order(
                    "score",
                    {
                        ascending: false
                    }
                );


        const box =

            document
                .getElementById(
                    "rankingTable"
                );

        box.innerHTML = `

<h2>

${title}

</h2>

`;


        if (
            !data.length
        ) {

            box.innerHTML += `

<p>

No submissions

</p>

`;

            return;

        }


        if (!data) {

            resultBox.innerHTML =

                `
<h2>

No Results Yet

</h2>
`;

            return;

        }

        data.forEach((r, i) => {

            box.innerHTML += `

<div
class=
"rank-card">

<div>

${i === 0
                    ?

                    "🥇"

                    :

                    i === 1

                        ?

                        "🥈"

                        :

                        i === 2

                            ?

                            "🥉"

                            :

                            `#${i + 1}`

                }

</div>


<div>

${r.student}

</div>


<div>

${r.score}

/

${r.total}

</div>

</div>

`;

        }

        );


        document
            .getElementById(
                "quizRanking"
            )
            .style.display =
            "block";

    };
