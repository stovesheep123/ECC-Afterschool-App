window.loadQuizResults =
    async function () {

        const user =
            JSON.parse(
                localStorage.getItem(
                    "currentUser"
                ));

        if (
            user.role !== "headmaster"
        ) {

            return;

        }

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
                    "submitted_at",
                    {
                        ascending: false
                    }

                );


        const box =
            document.getElementById(
                "quizResultList"
            );

        if (!box) return;


        box.innerHTML = "";


        if (!data.length) {

            box.innerHTML =
                "まだ提出なし";

            return;

        }


        data.forEach(r => {

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


            box.innerHTML += `

<div class="result-card">

<h3>

👤

${r.student}

</h3>

<p>

${r.score}

/

${r.total}

(${percent}%)

</p>

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