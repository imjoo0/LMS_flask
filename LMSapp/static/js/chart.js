var _chart = document.querySelector(".chart");
var _chartBar = document.querySelectorAll(".chart-bar");
var color = ["#2B2B2B", "#D99694", "#B9CDE5"]; //색상
var newDeg = []; //차트 deg
function insertAfter(newNode, referenceNode) {
  referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
}

function chartDraw() {
  for (var i = 0; i < _chartBar.length; i++) {
    var _num = _chartBar[i].dataset.deg;
    newDeg.push(_num);
  }

  var num = newDeg.length - newDeg.length;
  _chart.style.background =
    "conic-gradient(#2B2B2B " +
    newDeg[num] +
    "deg, #D99694 " +
    newDeg[num] +
    "deg " +
    newDeg[num + 1] +
    "deg, #B9CDE5 " +
    newDeg[1] +
    "deg " +
    newDeg[2] +
    "deg, #B9CDE5 " +
    newDeg[2] +
    "deg )";
}
