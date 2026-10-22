
const salesForm = document.getElementById("sales-form");
const salesList = document.getElementById("sales-list");

const totalSalesDisplay = document.getElementById("total-sales");
const totalTransactionsDisplay = document.getElementById("total-transactions");
const mpesaSalesDisplay = document.getElementById("mpesa-sales");

 const heroTotalSalesDisplay =
    document.getElementById("hero-total-sales");

const heroTransactionsDisplay =
    document.getElementById("hero-total-transactions");

const missionProgress = document.getElementById("mission-progress");
const missionProgressFill =
    document.getElementById("mission-progress-fill");

const missionProgressLabel =
    document.getElementById("mission-progress-label");

const missionMessage = document.getElementById("mission-message");

const DAILY_SALES_GOAL = 5000;


const reportDateInput = document.getElementById("report-date");
const reportSalesDisplay = document.getElementById("report-sales");
const reportCountDisplay = document.getElementById("report-count");
const reportMpesaDisplay = document.getElementById("report-mpesa");
const exportReportButton = document.getElementById("export-report");

function getTodayDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return year + "-" + month + "-" + day;
}

function formatMoney(amount) {
    return "KSh " + amount.toFixed(2);
}
  
function updateMoneyMissionDashboard() {
    // Calculate revenue from all saved sales.
    const totalRevenue = sales.reduce(function(sum, sale) {
        return sum + sale.amount;
    }, 0);

    if (heroTotalSalesDisplay) {
        heroTotalSalesDisplay.textContent =
            formatMoney(totalRevenue);
    }

    if (heroTransactionsDisplay) {
        heroTransactionsDisplay.textContent =
            String(sales.length);
    }

    // Calculate revenue earned today.
    const today = getTodayDate();

    const todayRevenue = sales
        .filter(function(sale) {
            return sale.date === today;
        })
        .reduce(function(sum, sale) {
            return sum + sale.amount;
        }, 0);

    // Calculate progress toward the KSh 5,000 goal.
    const progress = Math.min(
        (todayRevenue / DAILY_SALES_GOAL) * 100,
        100
    );

    if (missionProgressFill) {
        missionProgressFill.style.width = progress + "%";
    }

    if (missionProgress) {
        missionProgress.setAttribute(
            "aria-valuenow",
            String(Math.min(todayRevenue, DAILY_SALES_GOAL))
        );
    }

    if (missionProgressLabel) {
        missionProgressLabel.textContent =
            "KSh " +
            todayRevenue.toLocaleString("en-KE", {
                maximumFractionDigits: 2
            }) +
            " / 5,000";
    }

    if (missionMessage) {
        if (todayRevenue >= DAILY_SALES_GOAL) {
            missionMessage.textContent =
                "🏆 MISSION COMPLETE! You hit your daily sales goal!";
        } else if (todayRevenue === 0) {
            missionMessage.textContent =
                "🚀 Your next milestone starts with your first sale.";
        } else {
            const remaining = DAILY_SALES_GOAL - todayRevenue;

            missionMessage.textContent =
                "🔥 You're " +
                Math.round(progress) +
                "% there! Just KSh " +
                remaining.toLocaleString("en-KE", {
                    maximumFractionDigits: 2
                }) +
                " to hit today's goal.";
        }
    }
}

function loadSavedSales() {
    try {
        const saved = JSON.parse(
            localStorage.getItem("biztrack-sales")
        );

        if (!Array.isArray(saved)) {
            return [];
        }

        return saved.filter(function(sale) {
            return (
                sale &&
                typeof sale.service === "string" &&
                sale.service.trim() !== "" &&
                Number.isFinite(Number(sale.amount)) &&
                Number(sale.amount) > 0
            );
        }).map(function(sale) {
            return {
                service: sale.service,
                amount: Number(sale.amount),
                date: sale.date || "",
                paymentMethod: sale.paymentMethod || "Not recorded"
            };
        });
    } catch (error) {
        console.error("Could not load sales:", error);
        return [];
    }
}

let sales = loadSavedSales();

function saveSales() {
    localStorage.setItem("biztrack-sales", JSON.stringify(sales));
}

function updateBusinessSummary() {
    const total = sales.reduce(function(sum, sale) {
        return sum + sale.amount;
    }, 0);

    const mpesaTotal = sales
        .filter(function(sale) {
            return sale.paymentMethod === "M-Pesa";
        })
        .reduce(function(sum, sale) {
            return sum + sale.amount;
        }, 0);

    totalSalesDisplay.textContent = formatMoney(total);
    totalTransactionsDisplay.textContent = String(sales.length);
    mpesaSalesDisplay.textContent = formatMoney(mpesaTotal);
    updateMoneyMissionDashboard();
}
const searchSales = document.getElementById("search-sales");
let salesSearchTerm = "";

const filterPayment = document.getElementById("filter-payment");
let selectedPaymentMethod = "all";

filterPayment.addEventListener("change", function () {
    selectedPaymentMethod = filterPayment.value;
    updateSalesDisplay();
});

searchSales.addEventListener("input", function () {
    salesSearchTerm = searchSales.value.toLowerCase().trim();
    updateSalesDisplay();
});

function updateSalesDisplay() {
    salesList.innerHTML = "";

    sales
    sales
    .filter(function(sale) {
        const matchesSearch =
            sale.service.toLowerCase().includes(salesSearchTerm) ||
            sale.paymentMethod.toLowerCase().includes(salesSearchTerm);

        const matchesPayment =
            selectedPaymentMethod === "all" ||
            sale.paymentMethod === selectedPaymentMethod;

        return matchesSearch && matchesPayment;
    })
    .forEach(function(sale, index) {
        const item = document.createElement("li");
        const details = document.createElement("div");

        const service = document.createElement("strong");
        service.textContent = sale.service;

        const date = document.createElement("p");
        date.textContent = sale.date || "Date not recorded";

        const payment = document.createElement("p");
        payment.textContent = "Paid by: " + sale.paymentMethod;

        const amount = document.createElement("p");
        amount.textContent = formatMoney(sale.amount);

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.textContent = "Delete";

        details.appendChild(service);
        details.appendChild(date);
        details.appendChild(payment);
        details.appendChild(amount);

        item.appendChild(details);
        item.appendChild(deleteButton);
        salesList.appendChild(item);

        deleteButton.addEventListener("click", function() {
            const confirmed = confirm(
                "Delete this sale? This cannot be undone."
            );

            if (!confirmed) {
                return;
            }

            sales = sales.filter(function(currentSale) {
                return currentSale !== sale;
            });

            saveSales();
            updateSalesDisplay();
            updateBusinessSummary();
            updateDailyReport();
        });
    });

    updateBusinessSummary();
}

function updateDailyReport() {
    const selectedDate = reportDateInput.value;

    const dailySales = sales.filter(function(sale) {
        return sale.date === selectedDate;
    });

    const total = dailySales.reduce(function(sum, sale) {
        return sum + sale.amount;
    }, 0);

    const mpesaTotal = dailySales
        .filter(function(sale) {
            return sale.paymentMethod === "M-Pesa";
        })
        .reduce(function(sum, sale) {
            return sum + sale.amount;
        }, 0);

    reportSalesDisplay.textContent = formatMoney(total);
    reportCountDisplay.textContent = String(dailySales.length);
    reportMpesaDisplay.textContent = formatMoney(mpesaTotal);
}

salesForm.addEventListener("submit", function(event) {
    event.preventDefault();

    const service = document
        .getElementById("service-name").value.trim();

    const amount = Number(
        document.getElementById("sale-amount").value
    );

    const paymentMethod = document
        .getElementById("payment-method").value;

    if (!service || !Number.isFinite(amount) || amount <= 0) {
        alert("Enter a service and an amount greater than zero.");
        return;
    }

    if (!paymentMethod) {
        alert("Choose a payment method.");
        return;
    }

    sales.push({
        service: service,
        amount: amount,
        date: getTodayDate(),
        paymentMethod: paymentMethod
    });

    saveSales();
    updateSalesDisplay();
    updateDailyReport();
    salesForm.reset();
});

reportDateInput.value = getTodayDate();

reportDateInput.addEventListener("change", updateDailyReport);

exportReportButton.addEventListener("click", function() {
    const selectedDate = reportDateInput.value;

    if (!selectedDate) {
        alert("Choose a date first.");
        return;
    }

    const rows = [
        ["Date", "Service", "Payment Method", "Amount (KSh)"]
    ];

    sales.filter(function(sale) {
        return sale.date === selectedDate;
    }).forEach(function(sale) {
        rows.push([
            sale.date,
            sale.service,
            sale.paymentMethod,
            sale.amount.toFixed(2)
        ]);
    });

    const csv = rows.map(function(row) {
        return row.map(function(value) {
            return '"' + String(value).replace(/"/g, '""') + '"';
        }).join(",");
    }).join("\r\n");

    const blob = new Blob(["\uFEFF" + csv], {
        type: "text/csv;charset=utf-8;"
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "biztrack-sales-" + selectedDate + ".csv";

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
});

updateSalesDisplay();
updateDailyReport();
if ("serviceWorker" in navigator) {
    window.addEventListener("load", function() {
        navigator.serviceWorker.register("./service-worker.js")
            .then(function() {
                console.log("BizTrack offline support is ready.");
            })
            .catch(function(error) {
                console.error("Service worker registration failed:", error);
            });
    });
}