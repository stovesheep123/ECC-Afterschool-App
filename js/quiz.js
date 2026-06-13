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