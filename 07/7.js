// 7. 模擬資料庫查詢 (Simulating DB Queries)
function fakeGet(sql, params, callback) {
  callback(null, { title: "Fake Title" });
}

fakeGet("SELECT * FROM posts", [1], (err, row) => {
  if (err) {
    console.error(err);
    return;
  }
  console.log(row.title);
});
