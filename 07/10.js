// 10. 錯誤優先回呼模式 (Error-First Callback Pattern)
function checkAdmin(role, callback) {
  if (role !== "admin") {
    callback("Access Denied");
    return;
  }
  callback(null, "Welcome");
}

checkAdmin("guest", (err, message) => {
  if (err) {
    console.error("guest =>", err);
  } else {
    console.log(message);
  }
});

checkAdmin("admin", (err, message) => {
  if (err) {
    console.error("admin =>", err);
  } else {
    console.log("admin =>", message);
  }
});
