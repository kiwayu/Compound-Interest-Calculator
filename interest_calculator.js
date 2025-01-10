const button = document.getElementById("calculate-button");
button.addEventListener("click", calculate);
const ctx = document.getElementById('myChart');
let currentChart;
const canvas = document.getElementById('myChart');
canvas.setAttribute('aria-label', 'Bar chart showing savings with and without interest');
canvas.innerHTML = 'Your browser does not support the HTML5 canvas element.';

function calculate() {
    let P = Number(document.getElementById("starting-balance").value);
    let r = Number(document.getElementById("interest-rate").value) / 100;
    let n = Number(document.getElementById("compound").value);
    let t = Number(document.getElementById("years").value);
    let PMT = Number(document.getElementById("contribution").value);

    let temp = Math.pow((1 + r / n), n * t);
    let result1 = P * temp;
    let result2 = PMT * (temp - 1) / (r / n);
    let result = (result1 + result2);
    document.getElementById("result").innerText = `£${Number(result.toFixed(2)).toLocaleString('en-US')}`;

    if (currentChart != null) {
        currentChart.destroy();
    }

    currentChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ["Without Interest", "Interest"],
            datasets: [{
                label: 'Savings',
                data: [P + PMT * n * t, result],
                borderWidth: 1,
                borderColor: '#113f67',
                backgroundColor: '#38598b'
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}


