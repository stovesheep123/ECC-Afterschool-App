window.displayNotifications = async function () {

  const currentUser = JSON.parse(
    localStorage.getItem("currentUser")
  );

  const container =
    document.getElementById("notificationList");

  if (!container || !currentUser) return;

  const { data, error } =
    await supabase
      .from("notifications")
      .select("*")
      .eq("username", currentUser.username)
      .order("created_at", {
        ascending: false
      });

  if (error) {
    console.log(error);
    container.innerHTML = "通知読み込み失敗";
    return;
  }

  if (!data || data.length === 0) {
    container.innerHTML =
      "<p>No Notifications</p>";
    return;
  }

  container.innerHTML = "";

  data.forEach(note => {

    const div =
      document.createElement("div");

    div.className = "notification-card";

    div.innerHTML = `
      <p>${note.message}</p>
      <small>
        ${new Date(
      note.created_at
    ).toLocaleString()}
      </small>
    `;

    container.appendChild(div);
  });
};

setInterval(displayNotifications, 5000);

supabase
  .channel("notifications-channel")
  .on(
    "postgres_changes",
    {
      event: "INSERT",
      schema: "public",
      table: "notifications"
    },
    payload => {
      displayNotifications();
      alert(payload.new.message);
    }
  )
  .subscribe();