const students = [
  { name: "A", score: 80 },
  { name: "B", score: 95 },
  { name: "C", score: 90 }
];
let topStudent = students[0];
for (let i = 1; i < students.length; i++) {
  if (students[i].score > topStudent.score) topStudent = students[i];
}
console.log(topStudent.name);
// 測試結果："B"
