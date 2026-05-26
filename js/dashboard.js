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

  "./assets/videos/video1.mp4",

  "./assets/videos/video2.mp4",

  "./assets/videos/video3.mp4",

  "./assets/videos/video4.mp4",

  "./assets/videos/video5.mp4",

  "./assets/videos/video6.mp4",

  "./assets/videos/video7.mp4"
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
    setupRoleUI();
    if (typeof loadUsers === "function") {
      loadUsers();
    }

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
  showSection("home");
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

