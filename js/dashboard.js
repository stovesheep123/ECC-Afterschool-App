// ===============================
// CURRENT USER
// ===============================

const currentUser =
  JSON.parse(
    localStorage.getItem(
      "currentUser"
    )
  );

// login protection
if (!currentUser) {

  window.location.href =
    "index.html";
}


// ===============================
// RANDOM VIDEO BACKGROUND
// ===============================

const videos = [

  "./assets/Videos/video1.mp4",

  "./assets/Videos/video2.mp4",

  "./assets/Videos/video3.mp4",

  "./assets/Videos/video4.mp4",

  "./assets/Videos/video5.mp4",

  "./assets/Videos/video6.mp4",

  "./assets/Videos/video7.mp4"
];

function setRandomVideo() {

  const video =
    document.getElementById(
      "bgVideo"
    );

  const source =
    document.getElementById(
      "videoSource"
    );

  if (!video || !source) return;

  // RANDOM VIDEO
  const randomIndex =
    Math.floor(
      Math.random() *
      videos.length
    );

  // SET VIDEO
  source.src =
    videos[randomIndex];

  // LOAD VIDEO
  video.load();

  // PLAY VIDEO
  video.play();
}

// RUN
setRandomVideo();

// ===============================
// DOM LOADED
// ===============================
document.addEventListener(
  "DOMContentLoaded",
  () => {

    setupDashboard();
    loadGreeting();
    setupRoleUI();
    loadDashboardStats();
    loadNotificationCount();
    loadMessageCount();
    loadWeather();

    if (typeof loadUsers === "function") {
      loadUsers();
    }

    // ANDROID DROPDOWN FIX
    document.querySelectorAll("select").forEach(select => {
      select.addEventListener("touchstart", function () {
        this.focus();
      });
    });

  }
);

// ===============================
// SETUP DASHBOARD
// ===============================

function setupDashboard() {

  // welcome text
  const welcome =
    document.getElementById("welcome");

  if (welcome) {

    welcome.innerText =
      `👋 ${currentUser.username}
            (${currentUser.role})`;
  }

  // role ui
  setupRoleUI();

  // show home first
  if (sectionId === "home") {
    loadDashboardStats();
  }
}

// ===============================
// ROLE UI
// ===============================

function setupRoleUI() {

  const role =
    currentUser.role;

  // HEADMASTER
  if (role === "headmaster") {

    return;
  }

  // TEACHER
  if (role === "teacher") {


    return;
  }

  // STUDENT
  if (role === "student") {


    return;
  }

  // PARENT
  if (role === "parent") {


    return;

  }
}

// ===============================
// SHOW SECTION
// ===============================

window.showSection = function (sectionId, clickedElement) {

  const currentUser =
    JSON.parse(localStorage.getItem("currentUser"));

  if (
    sectionId === "savedReports" &&
    (
      currentUser.role === "student" ||
      currentUser.role === "parent"
    )
  ) {
    alert("権限ありません");
    return;
  }


  document.querySelectorAll(".section")
    .forEach(section => {
      section.style.display = "none";
    });

  const activeSection =
    document.getElementById(sectionId);

  if (activeSection) {
    activeSection.style.display = "block";
  }

  if (sectionId === "savedReports") {
    loadSavedReports();
  }

  if (sectionId === "studentReports") {
    loadStudentReports();
  }
  if (
    sectionId
    ===
    "takeTest"
  ) {

    loadTests();

  }

  document.querySelectorAll(".nav-item")
    .forEach(item => {
      item.classList.remove("active");
    });

  if (clickedElement) {
    clickedElement.classList.add("active");
  }
};
// ===============================
// TOGGLE SIDEBAR
// ===============================

window.toggleMenu = function () {

  document.querySelector(".sidebar")
    .classList.toggle("active");
}

// ===============================
// LOGOUT
// ===============================

window.logout = function () {

  localStorage.clear();

  window.location.href =
    "index.html";
}

// ===============================
// HELPER
// ===============================

function hideElement(id) {

  const element =
    document.getElementById(id);

  if (element) {

    element.style.display =
      "none";
  }
}
////////////
//greeting//
////////////
function loadGreeting() {

  const hour =
    new Date().getHours();

  let greeting =
    "Hello";

  if (hour < 12) {
    greeting = "Good Morning";
  }
  else if (hour < 18) {
    greeting = "Good Afternoon";
  }
  else {
    greeting = "Good Evening";
  }

  document.getElementById(
    "dashboardGreeting"
  ).innerHTML =
    `${greeting}, ${currentUser.username} 👋`;
}
///////////////////////
//load main dashboard//
///////////////////////
window.loadDashboardStats = async function () {

  const currentUser =
    JSON.parse(localStorage.getItem("currentUser"));

  // greeting
  const hour = new Date().getHours();

  let greeting = "Hello";

  if (hour < 12) {
    greeting = "Good Morning";
  }
  else if (hour < 18) {
    greeting = "Good Afternoon";
  }
  else {
    greeting = "Good Evening";
  }

  document.getElementById("greetingText").innerHTML =
    `${greeting}, ${currentUser.username} 👋`;

  // reports count
  const { data: reports } =
    await window.supabase
      .from("reports")
      .select("*");

  document.getElementById("reportsToday").innerText =
    reports?.length || 0;

  // pending approvals
  const pending =
    reports?.filter(
      r => r.status === "pending"
    ).length || 0;

  document.getElementById("quickSummary").innerText =
    `${pending} reports pending approval`;

};
////////////////
//nofification//
////////////////
async function loadNotificationCount() {

  const currentUser =
    JSON.parse(localStorage.getItem("currentUser"));

  const { data, error } =
    await window.supabase
      .from("notifications")
      .select("*");

  if (error) {
    console.log(error);
    return;
  }

  document.getElementById(
    "notificationCount"
  ).innerText = data.length;
}
///////////////
//loadmessage//
///////////////
async function loadMessageCount() {

  const currentUser =
    JSON.parse(localStorage.getItem("currentUser"));

  const { data, error } =
    await window.supabase
      .from("messages")
      .select("*");

  if (error) {
    console.log(error);
    return;
  }

  document.getElementById(
    "messageCount"
  ).innerText = data.length;
}
///////////////
//loadweather//
///////////////
async function loadWeather() {

  try {

    const response =
      await fetch(
        "https://wttr.in/Osaka?format=3"
      );

    const text =
      await response.text();

    document.getElementById(
      "weatherText"
    ).innerText = text;

  } catch {

    document.getElementById(
      "weatherText"
    ).innerText =
      "Unavailable";
  }
}
window.loadUsers = async function () {

  const studentSelect =
    document.getElementById("student_name");

  const reportSearch =
    document.getElementById("reportSearch");

  if (!studentSelect) return;

  const { data, error } =
    await window.supabase
      .from("users")
      .select("*")
      .eq("role", "student")
      .order("username");

  if (error) {
    console.log(error);
    return;
  }

  studentSelect.innerHTML =
    `<option value="">選択してください</option>`;

  if (reportSearch) {
    reportSearch.innerHTML =
      `<option value="">すべての生徒</option>`;
  }

  data.forEach(user => {

    studentSelect.innerHTML += `
      <option value="${user.username}">
        ${user.username}
      </option>
    `;

    if (reportSearch) {

      reportSearch.innerHTML += `
        <option value="${user.username}">
          ${user.username}
        </option>
      `;
    }
  });
};
