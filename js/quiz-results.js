// ===============================
// LOAD QUIZ LIST (HEADMASTER VIEW)
// ===============================
window.loadQuizResults = async function () {
    const user = JSON.parse(localStorage.getItem("currentUser"));
    const box = document.getElementById("quizResultList");

    if (!box) return;

    if (!user || user.role !== "headmaster") {
        box.innerHTML = `<h2>権限がありません</h2>`;
        return;
    }

    const { data, error } = await window.supabase
        .from("quizzes")
        .select("*");

    if (error) {
        console.error("Error fetching quizzes:", error);
        box.innerHTML = `<p>データの読み込みに失敗しました</p>`;
        return;
    }

    box.innerHTML = "";

    if (!data?.length) {
        box.innerHTML = `<p class="no-data">No Tests</p>`;
        return;
    }

    data.forEach(q => {
        // Escaping titles to prevent raw single-quote injection bugs in the inline JS string
        const escapedTitle = q.title.replace(/'/g, "\\'");
        
        box.innerHTML += `
            <button class="quiz-card" onclick="openQuizResults('${q.id}', '${escapedTitle}')">
                📝 ${q.title}
            </button>
        `;
    });
};

// ===============================
// OPEN QUIZ RESULTS RANKING TABLE
// ===============================
window.openQuizResults = async function (quizId, title) {
    const box = document.getElementById("rankingTable");
    if (!box) return;

    box.innerHTML = `<h2>${title}</h2>`;

    const { data, error } = await window.supabase
        .from("quiz_results")
        .select("*")
        .eq("quiz_id", quizId)
        .order("score", { ascending: false });

    if (error) {
        console.error("Error fetching quiz results:", error);
        box.innerHTML += `<p>データの読み込みに失敗しました</p>`;
        return;
    }

    // Consolidated safety check: guards cleanly against null, undefined, or empty arrays
    if (!data?.length) {
        box.innerHTML += `<p class="no-data">No submissions</p>`;
        return;
    }

    data.forEach((r, i) => {
        let rankEmoji = `#${i + 1}`;
        if (i === 0) rankEmoji = "🥇";
        if (i === 1) rankEmoji = "🥈";
        if (i === 2) rankEmoji = "🥉";

        box.innerHTML += `
            <div class="rank-card" style="display: flex; gap: 15px; margin-bottom: 8px; align-items: center;">
                <div class="rank-badge">${rankEmoji}</div>
                <div class="student-name" style="flex: 1;">${r.student || 'Unknown Student'}</div>
                <div class="student-score"><strong>${r.score}</strong> / ${r.total}</div>
            </div>
        `;
    });

    const rankingContainer = document.getElementById("quizRanking");
    if (rankingContainer) {
        rankingContainer.style.display = "block";
        rankingContainer.scrollIntoView({ behavior: "smooth" });
    }
};
