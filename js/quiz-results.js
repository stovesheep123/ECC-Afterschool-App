window.loadQuizResults =
    async function () {

        const user =
            JSON.parse(
                localStorage.getItem(
                    "currentUser"
                ));

        if (
            user.role !== "headmaster"
        ) return;


        const {
            data
        }
            =
            await window.supabase

                .from(
                    "quiz_results"
                )

                .select("*")

                .order(
                    "score",
                    {
                        ascending: false
                    }
                );


        const resultBox =
            document.getElementById(
                "quizResultList"
            );

        const rankBox =
            document.getElementById(
                "quizRanking"
            );


        resultBox.innerHTML = "";

        rankBox.innerHTML = "";


        data.forEach((r, i) => {

            const percent =

                Math.round(
                    (
                        r.score
                        /
                        r.total
                    )
                    *
                    100
                );


            resultBox.innerHTML += `

<div class="result-card">

<h3>

👤
${r.student}

</h3>

<p>

${r.score}

/

${r.total}

</p>

</div>

`;


            rankBox.innerHTML += `

<div class="rank-card">

${i + 1}

位

🏆

${r.student}

—

${percent}%

</div>

`;

        });

    };



document.addEventListener(

    "DOMContentLoaded",

    () => {

        setTimeout(

            loadQuizResults,

            1000

        );

    }

);
