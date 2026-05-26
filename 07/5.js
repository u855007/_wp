// 5. Callback 函數傳參 (Passing Data via Callbacks)
function fetchData(id, callback) {
  const data = { id: id, status: "success" };
  callback(null, data);
}

fetchData(5, (err, result) => {
  if (err) {
    console.error(err);
    return;
  }
  console.log(result);
});
