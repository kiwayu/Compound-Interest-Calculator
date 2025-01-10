
const button = document.getElementById("calculate-button")
button.addEventListener("click", calculate);
const ctx = document.getElementById('myChart');
let currentChart;

function calculate() {
    // Formula: A= P(1 + r/n)^nt + PMT((1 + r/n)^nt - 1)/(r/n)
    let P = Number(document.getElementById("starting-balance").value);
    let r = Number(document.getElementById("interest-rate").value) / 100;
    let n = Number(document.getElementById("compound").value);
    let t = Number(document.getElementById("years").value);
    let PMT = Number(document.getElementById("contribution").value);

    let temp = Math.pow((1 + r / n), n * t);
    let result1 = P * temp;
    let result2 = PMT * (temp - 1) / (r / n)
    let result = (result1 + result2).toFixed(2);
    document.getElementById("result").innerText = result;


    if (currentChart != null){
        currentChart.destroy();
    }

    currentChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ["Without Interest", "Interest"],
            datasets: [{
                label: 'Savings',
                data: [P + PMT * n * t, result],
                borderWidth: 1
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
