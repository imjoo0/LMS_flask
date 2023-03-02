var _chart = document.querySelector(".chart");
var _chartBar = document.querySelectorAll(".chart-bar");
var color = ["#B9CDE5", "#D99694", "#2B2B2B"]; //색상
var newDeg = []; //차트 deg
function insertAfter(newNode, referenceNode) {
  referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
}

function chartLabel() {
  temp_html = `
    <span class="chart-total-text1">퇴소 학생 수</span>
    <span class="chart-total-text2">이반 학생 수</span>
    <span class="chart-total-text3">관리중인 학생 수</span>`;
  $('.chart-total').append(temp_html);
}

function chartDraw() {
  for (var i = 0; i < _chartBar.length; i++) {
    var _num = _chartBar[i].dataset.deg;
    newDeg.push(_num);
  }

  var num = newDeg.length - newDeg.length;
  _chart.style.background =
    "conic-gradient(#B9CDE5 " +
    newDeg[num] +
    "deg, #D99694 " +
    newDeg[num] +
    "deg " +
    newDeg[num + 1] +
    "deg, #2B2B2B " +
    newDeg[1] +
    "deg " +
    newDeg[2] +
    "deg, #2B2B2B " +
    newDeg[2] +
    "deg )";

  chartLabel();
}

chartDraw();