// ===============================
// QUIZ SYSTEM STATE ENGINE
// ===============================
let currentQuiz = null;
let currentQuestion = 0;
let studentAnswers = [];
let currentSubject = "";

// ===============================
// Load Subject Function (Optimized Batch Requests)
// ===============================
window.loadSubjectTests = async function (subject) {
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    if (!currentUser) return;

    currentSubject = subject;

    // Reset layout display views cleanly
    document.getElementById("quizPlayer").style.display = "none";
    
    const subjectContainer = document.getElementById("subjectTests");
    if (!subjectContainer) return;
    
    subjectContainer.style.display = "block"; 
    subjectContainer.innerHTML = "<h2>Loading tests...</h2>";

    // Get quizzes for this subject
    const { data: quizzes, error } = await window.supabase
        .from("quizzes")
        .select("*")
        .eq("subject", subject);

    if (error) {
        console.error("Error fetching quizzes:", error);
        subjectContainer.innerHTML = "<p>Error loading tests.</p>";
        return;
    }

    // Filter down to only quizzes assigned to this specific student first
    const assignedQuizzes = quizzes.filter(quiz => 
        quiz.students && quiz.students.includes(currentUser.username)
    );

    if (assignedQuizzes.length === 0) {
        subjectContainer.innerHTML = `<h2>${subject}</h2><p>No tests available for your account in this subject.</p>`;
        return;
    }

    // Batch check submission statuses simultaneously instead of blocking inside a for-loop
    const statusPromises = assignedQuizzes.map(async (quiz) => {
        const { data: submitted } = await window.supabase
            .from("quiz_results")
            .select("id")
            .eq("quiz_id", quiz.id)
            .eq("student", currentUser.username)
            .maybeSingle();
        return { ...quiz, isSubmitted: !!submitted };
    });

    const processedQuizzes = await Promise.all(statusPromises);

    let html = `<h2>${subject}</h2>`;
    processedQuizzes.forEach(quiz => {
        html += `
            <div class="quiz-card" style="background: white; padding: 20px; border-radius: 12px; margin-bottom: 15px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                <h3>${quiz.title}</h3>
                <p>👨‍🏫 Created by: ${quiz.created_by}</p>
                <p>📝 ${quiz.question_count || quiz.questions.length} Questions</p>
                <p>⏱️ ${quiz.minutes} Minutes</p>
                ${quiz.isSubmitted
                    ? `<button disabled style="background: #ccc; color: #666; cursor: not-allowed; padding: 10px 20px; border: none; border-radius: 6px;">✅ Submitted</button>`
                    : `<button onclick="startQuiz('${quiz.id}')" style="background: #007bff; color: white; cursor: pointer; padding: 10px 20px; border: none; border-radius: 6px;">🚀 Start Test</button>`
                }
            </div>
        `;
    });

    subjectContainer.innerHTML = html;
};

// ===============================
// Start Quiz Function
// ===============================
window.startQuiz = async function (id) {
    const { data, error } = await window.supabase
        .from("quizzes")
        .select("*")
        .eq("id", id)
        .single();

    if (error || !data) {
        console.error("Error starting quiz:", error);
        alert("Failed to initialize test session.");
        return;
    }

    currentQuiz = data;
    currentQuestion = 0;
    studentAnswers = new Array(currentQuiz.questions.length).fill(null); 

    // Adjust structural visibility matrix
    document.getElementById("subjectTests").style.display = "none";
    document.getElementById("quizPlayer").style.display = "block";

    showQuestion();
};

// ===============================
// Show Quiz Function (Handles Submit Button Transformation)
// ===============================
function showQuestion() {
    if (!currentQuiz || !currentQuiz.questions[currentQuestion]) return;

    const q = currentQuiz.questions[currentQuestion];

    // Update progress numbers & counters
    document.getElementById("quizProgress").innerText = 
        `Question ${currentQuestion + 1} / ${currentQuiz.questions.length}`;
    
    document.getElementById("quizQuestion").innerText = q.question;

    const choicesContainer = document.getElementById("quizChoices");
    choicesContainer.innerHTML = "";

    // Generate answer node blocks safely
    q.choices.forEach((choice, index) => {
        const isSelected = studentAnswers[currentQuestion] === index;
        const selectedStyle = isSelected 
            ? "background: #007bff; color: white; border-color: #007bff;" 
            : "background: #f8f9fa; color: #333; border: 1px solid #ddd;";

        // Using explicit styling directly to guarantee the selection visual states trigger immediately
        choicesContainer.innerHTML += `
            <button class="quiz-choice" style="display: block; width: 100%; text-align: left; margin-bottom: 10px; padding: 12px; border-radius: 8px; cursor: pointer; font-size: 16px; transition: all 0.2s; ${selectedStyle}" onclick="selectAnswer(${index})">
                ${choice}
            </button>
        `;
    });

    // Transform the control button text dynamically if the student hits the final question
    const nextBtn = document.getElementById("nextQuestionBtn");
    if (nextBtn) {
        if (currentQuestion === currentQuiz.questions.length - 1) {
            nextBtn.innerText = "🏁 Finish & Submit";
            nextBtn.style.background = "#28a745";
        } else {
            nextBtn.innerText = "Next Question ➡️";
            nextBtn.style.background = "#007bff";
        }
    }
}

// ===============================
// Select Answer Function
// ===============================
window.selectAnswer = function (index) {
    studentAnswers[currentQuestion] = index;
    showQuestion(); // Re-render instantly to lock in visual selected styles cleanly
};

// ===============================
// Next Question Function
// ===============================
window.nextQuestion = function () {
    if (studentAnswers[currentQuestion] === null) {
        alert("Please select an answer before continuing.");
        return;
    }

    // If it's the last question, routing triggers final calculations instead of incrementing out of index bounds
    if (currentQuestion === currentQuiz.questions.length - 1) {
        finishQuiz();
        return;
    }

    currentQuestion++;
    showQuestion();
};

// ===============================
// Finish Quiz Function
// ===============================
window.finishQuiz = async function () {
    let score = 0;

    currentQuiz.questions.forEach((q, i) => {
        if (parseInt(studentAnswers[i], 10) === parseInt(q.answer, 10)) {
            score++;
        }
    });

    const currentUser = JSON.parse(localStorage.getItem("currentUser"));

    const { error } = await window.supabase
        .from("quiz_results")
        .insert([{
            quiz_id: currentQuiz.id,
            student: currentUser.username,
            score: score,
            total: currentQuiz.questions.length,
            answers: studentAnswers
        }]);

    if (error) {
        console.error("Error submitting evaluation score details:", error);
        alert("Submission failed: " + error.message);
        return;
    }

    alert(`🎉 Quiz Finished! Score: ${score}/${currentQuiz.questions.length}`);

    // Hide UI runtime views back to safety profile grid
    document.getElementById("quizPlayer").style.display = "none";
    
    // Refresh parent state arrays cleanly
    loadSubjectTests(currentQuiz.subject);
};

// ===============================
// Load Student Results History
// ===============================
window.loadStudentResults = async function () {
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    const box = document.getElementById("studentResultList");
    if (!box) return;

    box.innerHTML = "Loading your performance results...";

    const { data, error } = await window.supabase
        .from("quiz_results")
        .select(`
            id,
            score,
            total,
            submitted_at,
            quizzes (
                title,
                subject
            )
        `)
        .eq("student", currentUser.username)
        .order("submitted_at", { ascending: false });

    if (error) {
        console.error("Error loading performance charts:", error);
        box.innerHTML = "<p>Could not retrieve grading data.</p>";
        return;
    }

    if (!data || data.length === 0) {
        box.innerHTML = "<h2>No test results found yet.</h2>";
        return;
    }

    let html = "";
    data.forEach(result => {
        const percent = Math.round((result.score / result.total) * 100);
        const testTitle = result.quizzes ? result.quizzes.title : "Unknown Quiz Module";
        const testSubject = result.quizzes ? result.quizzes.subject : "General Evaluation";

        html += `
            <div class="result-card" style="background: white; padding: 20px; border-radius: 12px; margin-bottom: 15px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                <h3>${testTitle} (${testSubject})</h3>
                <h2>${result.score} / ${result.total}</h2>
                <p class="percentage" style="font-weight: bold; color: #28a745; font-size: 18px;">${percent}%</p>
                <p class="timestamp" style="color: gray; font-size: 12px;">📅 ${new Date(result.submitted_at).toLocaleString()}</p>
            </div>
        `;
    });

    box.innerHTML = html;
};
