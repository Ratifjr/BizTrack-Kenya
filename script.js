
const expenseForm = document.getElementById("expense-form");
const expenseList = document.getElementById("expense-list");
const totalAmount = document.getElementById("total-amount");

const salesForm = document.getElementById("sales-form");
const salesList = document.getElementById("sales-list");
const totalSalesDisplay = document.getElementById("total-sales");
const businessBalanceDisplay = document.getElementById("business-balance");

// Get the original sample expenses from the HTML.
function getStartingExpenses() {
    return Array.from(
        expenseList.querySelectorAll(".expense-item")
    ).map(function(item) {
        const heading = item.querySelector("h3, h4");
        const description = item.querySelector("div p");
        const amountElement = item.querySelector(".expense-amount");

        return {
            category: heading ? heading.textContent.trim() : "Other",
            name: description ? description.textContent.trim() : "Expense",
            amount: Number(
                amountElement
                    ? amountElement.textContent.replace(/[^0-9.]/g, "")
                    : 0
            ),
            date: ""
        };
    }).filter(function(expense) {
        return Number.isFinite(expense.amount) && expense.amount > 0;
    });
}

// Load previously saved expenses safely.
function loadSavedExpenses() {
    try {
        const savedData = JSON.parse(localStorage.getItem("expenses"));

        if (!Array.isArray(savedData)) {
            return [];
        }

        return savedData.filter(function(expense) {
            return (
                expense &&
                typeof expense.name === "string" &&
                Number.isFinite(Number(expense.amount)) &&
                Number(expense.amount) > 0
            );
        }).map(function(expense) {
            return {
                name: expense.name,
                amount: Number(expense.amount),
                category: expense.category || "Other",
                date: expense.date || ""
            };
        });
    } catch (error) {
        console.error("Could not load expenses:", error);
        return [];
    }
}

// Load sales and support older sales without dates or payment methods.
function loadSavedSales() {
    try {
        const savedData = JSON.parse(
            localStorage.getItem("biztrack-sales")
        );

        if (!Array.isArray(savedData)) {
            return [];
        }

        return savedData.filter(function(sale) {
            return (
                sale &&
                typeof sale.service === "string" &&
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

let expenses = loadSavedExpenses();
let sales = loadSavedSales();

// Restore original sample expenses without duplicating them.
const startingExpenses = getStartingExpenses();

startingExpenses.forEach(function(sample) {
    const alreadyExists = expenses.some(function(expense) {
        return (
            expense.name === sample.name &&
            expense.category === sample.category &&
            expense.amount === sample.amount
        );
    });

    if (!alreadyExists) {
        expenses.unshift(sample);
    }
});

function saveExpenses() {
    localStorage.setItem("expenses", JSON.stringify(expenses));
}

function saveSales() {
    localStorage.setItem("biztrack-sales", JSON.stringify(sales));
}

// Return today's date in local YYYY-MM-DD format.
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

// Calculate the expense total from our expense array.
function updateTotal() {
    const totalSpent = expenses.reduce(function(total, expense) {
        return total + expense.amount;
    }, 0);

    totalAmount.textContent = formatMoney(totalSpent);
}

// Calculate sales minus recorded expenses.
// This is not necessarily net profit.
function updateBusinessBalance() {
    const totalSales = sales.reduce(function(total, sale) {
        return total + sale.amount;
    }, 0);

    const totalExpenses = expenses.reduce(function(total, expense) {
        return total + expense.amount;
    }, 0);

    totalSalesDisplay.textContent = formatMoney(totalSales);
    businessBalanceDisplay.textContent =
        formatMoney(totalSales - totalExpenses);
}

// Display expenses and allow deletion.
function displayExpenses() {
    expenseList.innerHTML = "";

    expenses.forEach(function(expense) {
        const item = document.createElement("div");
        item.className = "expense-item";

        const details = document.createElement("div");

        const heading = document.createElement("h3");
        heading.textContent = expense.category;

        const name = document.createElement("p");
        name.textContent = expense.name;

        details.appendChild(heading);
        details.appendChild(name);

        if (expense.date) {
            const date = document.createElement("p");
            date.textContent = expense.date;
            details.appendChild(date);
        }

        const amount = document.createElement("p");
        amount.className = "expense-amount";
        amount.textContent = "- " + formatMoney(expense.amount);

        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Delete";
        deleteButton.className = "delete-button";

        deleteButton.addEventListener("click", function() {
            const index = expenses.indexOf(expense);

            if (index !== -1) {
                expenses.splice(index, 1);
                saveExpenses();
                displayExpenses();
            }
        });

        item.appendChild(details);
        item.appendChild(amount);
        item.appendChild(deleteButton);
        expenseList.appendChild(item);
    });

    updateTotal();
    updateBusinessBalance();
}

// Display sales with their date and payment method.
function updateSalesDisplay() {
    salesList.innerHTML = "";

    sales.forEach(function(sale) {
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

        details.appendChild(service);
        details.appendChild(date);
        details.appendChild(payment);
        details.appendChild(amount);

        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Delete";

        deleteButton.addEventListener("click", function() {
            const index = sales.indexOf(sale);

            if (index !== -1) {
                sales.splice(index, 1);
                saveSales();
                updateSalesDisplay();
            }
        });

        item.appendChild(details);
        item.appendChild(deleteButton);
        salesList.appendChild(item);
    });

    updateBusinessBalance();
}

// Handle adding an expense.
expenseForm.addEventListener("submit", function(event) {
    event.preventDefault();

    const expenseName = document
        .getElementById("expense-name").value.trim();

    const expenseAmount = Number(
        document.getElementById("expense-amount").value
    );

    const expenseCategory = document
        .getElementById("expense-category").value;

    if (!expenseName) {
        alert("Please enter an expense name.");
        return;
    }

    if (!Number.isFinite(expenseAmount) || expenseAmount <= 0) {
        alert("Enter an expense amount greater than zero.");
        return;
    }

    if (!expenseCategory) {
        alert("Please choose an expense category.");
        return;
    }

    expenses.push({
        name: expenseName,
        amount: expenseAmount,
        category: expenseCategory,
        date: getTodayDate()
    });

    saveExpenses();
    displayExpenses();
    expenseForm.reset();
});

// Handle adding a sale.
salesForm.addEventListener("submit", function(event) {
    event.preventDefault();

    const service = document
        .getElementById("service-name").value.trim();

    const amount = Number(
        document.getElementById("sale-amount").value
    );

    const paymentMethod = document
        .getElementById("payment-method").value;

    if (!service) {
        alert("Enter the service name.");
        return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
        alert("Enter a sale amount greater than zero.");
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
    salesForm.reset();
});

// Initialize after both expense and sales data are loaded.
saveExpenses();
saveSales();
displayExpenses();
updateSalesDisplay();

const reportDateInput = document.getElementById("report-date");
const reportSalesDisplay = document.getElementById("report-sales");
const reportExpensesDisplay = document.getElementById("report-expenses");
const reportBalanceDisplay = document.getElementById("report-balance");
const exportReportButton = document.getElementById("export-report");

// Start by showing today's report.
reportDateInput.value = getTodayDate();

function updateDailyReport() {
    const selectedDate = reportDateInput.value;

    const dailySales = sales.filter(function(sale) {
        return sale.date === selectedDate;
    });

    const dailyExpenses = expenses.filter(function(expense) {
        return expense.date === selectedDate;
    });

    const salesTotal = dailySales.reduce(function(total, sale) {
        return total + sale.amount;
    }, 0);

    const expensesTotal = dailyExpenses.reduce(function(total, expense) {
        return total + expense.amount;
    }, 0);

    reportSalesDisplay.textContent = formatMoney(salesTotal);
    reportExpensesDisplay.textContent = formatMoney(expensesTotal);
    reportBalanceDisplay.textContent =
        formatMoney(salesTotal - expensesTotal);
}

reportDateInput.addEventListener("change", updateDailyReport);

// Export the selected day's sales and expenses.
exportReportButton.addEventListener("click", function() {
    const selectedDate = reportDateInput.value;

    if (!selectedDate) {
        alert("Choose a date first.");
        return;
    }

    const rows = [
        ["Type", "Date", "Description", "Category or Payment Method", "Amount (KSh)"]
    ];

    sales.filter(function(sale) {
        return sale.date === selectedDate;
    }).forEach(function(sale) {
        rows.push([
            "Sale",
            sale.date,
            sale.service,
            sale.paymentMethod,
            sale.amount.toFixed(2)
        ]);
    });

    expenses.filter(function(expense) {
        return expense.date === selectedDate;
    }).forEach(function(expense) {
        rows.push([
            "Expense",
            expense.date,
            expense.name,
            expense.category,
            expense.amount.toFixed(2)
        ]);
    });

    // Escape CSV values so commas and quotes don't break the file.
    const csv = rows.map(function(row) {
        return row.map(function(value) {
            const safeValue = String(value).replace(/"/g, '""');
            return '"' + safeValue + '"';
        }).join(",");
    }).join("\r\n");

    const blob = new Blob(["\uFEFF" + csv], {
        type: "text/csv;charset=utf-8;"
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "biztrack-report-" + selectedDate + ".csv";

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
});

// Refresh the report whenever the app starts.
updateDailyReport();
