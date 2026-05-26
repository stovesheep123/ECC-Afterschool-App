async function login() {

  const username =
    document.getElementById(
      "username"
    ).value.trim();

  const password =
    document.getElementById(
      "password"
    ).value.trim();

  if (!username || !password) {

    alert(
      "Enter username and password"
    );

    return;
  }

  const {
    data: user,
    error
  } = await supabase
    .from("users")
    .select("*")
    .eq("username", username)
    .eq("password", password)
    .single();

  console.log(user);
  console.log(error);

  if (error || !user) {

    alert("Invalid login");

    return;
  }

  localStorage.setItem(
    "currentUser",
    JSON.stringify(user)
  );

  window.location.href =
    "dashboard.html";
}

document
  .getElementById("loginBtn")
  .addEventListener(
    "click",
    login
  );