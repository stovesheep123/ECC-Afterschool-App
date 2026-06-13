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

if(
currentUser.role !== "teacher"
&&
currentUser.role !== "headmaster"
){
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

if(!title){
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


if(error){

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

cards.forEach(card=>{

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
error:qError
}
=
await window.supabase
.from(
"quiz_questions"
)
.insert(
questions
);


if(qError){

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
