function cleanData(arr) {
  arr.pop();
  arr.unshift("Start");
}

let myData = [1, 2, 3];
cleanData(myData); 