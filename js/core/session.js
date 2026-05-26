export function getCurrentUser() {

    return JSON.parse(
        localStorage.getItem("currentUser")
    );
}

export function logout() {

    localStorage.removeItem("currentUser");

    window.location.href = "index.html";
}