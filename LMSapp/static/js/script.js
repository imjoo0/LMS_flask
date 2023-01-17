// 업무 체크리스트 today section
const all_nav = document.getElementById("all_nav");
// const counselling_nav = document.getElementById('counselling_nav');
// const day_nav = document.getElementById('day_nav');
const complete_nav = document.getElementById("complete_nav");

const all_body = document.getElementById("all_body");
// const counselling_body = document.getElementById('counselling_body');
// const day_body = document.getElementById('day_body');
const complete_body = document.getElementById("complete_body");

function all_nav_click() {
  // counselling_nav.classList.remove('active');
  // day_nav.classList.remove('active');
  complete_nav.classList.remove("active");

  // counselling_body.classList.add('d-none');
  // day_body.classList.add('d-none');
  complete_body.classList.add("d-none");

  all_nav.classList.add("active");
  all_body.classList.remove("d-none");
}

// function counselling_nav_click() {
//     all_nav.classList.remove('active');
//     day_nav.classList.remove('active');
//     complete_nav.classList.remove('active');

//     all_body.classList.add('d-none');
//     day_body.classList.add('d-none');
//     complete_body.classList.add('d-none');

//     counselling_nav.classList.add('active');
//     counselling_body.classList.remove('d-none');
// }

// function day_nav_click() {
//     all_nav.classList.remove('active');
//     counselling_nav.classList.remove('active');
//     complete_nav.classList.remove('active');

//     all_body.classList.add('d-none');
//     counselling_body.classList.add('d-none');
//     complete_body.classList.add('d-none');

//     day_nav.classList.add('active');
//     day_body.classList.remove('d-none');
// }

function complete_nav_click() {
  all_nav.classList.remove("active");
  // counselling_nav.classList.remove('active');
  // day_nav.classList.remove('active');

  all_body.classList.add("d-none");
  // counselling_body.classList.add('d-none');
  // day_body.classList.add('d-none');

  complete_nav.classList.add("active");
  complete_body.classList.remove("d-none");
}

// pagination
function pagint(totalData, currentPage) {
  const dataPerPage = 10; // 한 페이지에 출력되는 데이터
  const pageCount = 5; // 한 번에 출력되는 최대 페이지 수
  const totalPage = Math.ceil(totalData / dataPerPage); // 총 페이지 수
  const pageGroup = Math.ceil(currentPage / pageCount); // 페이지 그룹

  let last = pageGroup * pageCount;
} 

// tooltip
let tooltipTriggerList = [].slice.call(
  document.querySelectorAll('[data-bs-toggle="tooltip"]')
);
let tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
  return new bootstrap.Tooltip(tooltipTriggerEl);
});

// ApexCharts
function options_data(){
  $.ajax({
    type: "GET",
    url: "/perform/charts",
    data: {},
    success: function (response) {
      console.log(response)
    }
  })
}
// 만약 동적 데이터를 받는다면 아래처럼 표현 가능.
// data: data?.map(price => price.close) as number[]
var options = {
  chart: {
    type: "bar",
    height: 300,
  },
  plotOptions: {
    bar: {
      horizontal: true,
    },
  },
  series: [
    {
      data: [
        {
          x: "상담 필요 인원",
          y: 8,
          fillColor: "#1b1b1b",
        },
        {
          x: "2주 미접속 인원",
          y: 5,
          fillColor: "#1b1b1b",
          goals: [
            {
              name: "guideline",
              value: 6,
              strokeColor: "#b02b74",
            },
          ],
        },
        {
          x: "4주 미접속 인원",
          y: 1,
          fillColor: "#1b1b1b",
          goals: [
            {
              name: "guideline",
              value: 3,
              strokeColor: "#b02b74",
            },
          ],
        },
        {
          x: "금주 학습 미진행 인원",
          y: 5,
          fillColor: "#1b1b1b",
          goals: [
            {
              name: "guideline",
              value: 5,
              strokeColor: "#b02b74",
            },
          ],
        },
        {
          x: "테스트 미진행 인원",
          y: 3,
          fillColor: "#1b1b1b",
          goals: [
            {
              name: "guideline",
              value: 5,
              strokeColor: "#b02b74",
            },
          ],
        },
      ],
    },
  ],
  title: {
    text: "DARTMOUTH1401",
  },
  xaxis: {
    axisBorder: { show: false },
    axisTicks: { show: false },
    labels: { show: false },
  },
  stroke: {
    width: 1,
    colors: ["#fff"],
  },
};

var chart = new ApexCharts(document.querySelector("#chart"), options);
chart.render();