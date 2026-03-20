const contacts = [
  { name: "小明", phone: "0911" },
  { name: "小華", phone: "0922" }
];
for (let i = 0; i < contacts.length; i++) {
  console.log(`姓名：${contacts[i].name}，電話：${contacts[i].phone}`);
}
// 測試結果：
// 姓名：小明，電話：0911
// 姓名：小華，電話：0922
