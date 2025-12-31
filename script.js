// EXPENSE TRACKER APPLICATION
// Application State
const AppState = {
    transactions: JSON.parse(localStorage.getItem('expenseTrackerTransactions')) || [],
    categories: {
        income: ['salary', 'freelance', 'investment', 'other-income'],
        expense: ['food', 'transport', 'shopping', 'entertainment', 'bills', 'health', 'education', 'other']
    },
    currentFilters: {
        category: 'all',
        type: 'all',
        dateRange: 'all',
        startDate: null,
        endDate: null
    },
    pagination: {
        currentPage: 1,
        itemsPerPage: 10,
        totalPages: 1
    },
    charts: {
        expenseChart: null,
        monthlyChart: null
    },
    pendingAction: null
};

// DOM Elements
const DOM = {
    // Form Elements
    transactionForm: document.getElementById('transaction-form'),
    typeInput: document.getElementById('type'),
    amountInput: document.getElementById('amount'),
    descriptionInput: document.getElementById('description'),
    dateInput: document.getElementById('date'),
    categoryInput: document.getElementById('category'),
    
    // Summary Elements
    totalIncome: document.getElementById('total-income'),
    totalExpenses: document.getElementById('total-expenses'),
    netBalance: document.getElementById('net-balance'),
    totalTransactions: document.getElementById('total-transactions'),
    
    // Filter Elements
    filterCategory: document.getElementById('filter-category'),
    filterType: document.getElementById('filter-type'),
    filterDate: document.getElementById('filter-date'),
    // startDate: document.getElementById('start-date'),
    // endDate: document.getElementById('end-date'),
    clearFiltersBtn: document.getElementById('clear-filters'),
    
    // Transaction List Elements
    transactionsList: document.getElementById('transactions-list'),
    transactionsCount: document.getElementById('transactions-count'),
    transactionsTotal: document.getElementById('transactions-total'),
    
    // Pagination Elements
    prevBtn: document.getElementById('prev-btn'),
    nextBtn: document.getElementById('next-btn'),
    currentPage: document.getElementById('current-page'),
    totalPages: document.getElementById('total-pages'),
    
    // Action Buttons
    exportBtn: document.getElementById('export-btn'),
    deleteAllBtn: document.getElementById('delete-all-btn'),
    
    // Modal Elements
    editModal: document.getElementById('edit-modal'),
    confirmModal: document.getElementById('confirm-modal'),
    // importModal: document.getElementById('import-modal'),
    
    // Chart Elements
    expenseChart: document.getElementById('expense-chart'),
    monthlyChart: document.getElementById('monthly-chart'),
    
    // Footer Elements
    footerTransactions: document.getElementById('footer-total-transactions'),
    footerDaysTracked: document.getElementById('footer-days-tracked'),
    
    // Today's Date
    todayDate: document.getElementById('today-date')
};

// INITIALIZATION
function init() {
    // Set today's date
    const today = new Date();
    DOM.todayDate.textContent = today.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    
    // Set default date to today
    DOM.dateInput.valueAsDate = today;
    // DOM.startDate.valueAsDate = new Date(today.getFullYear(), today.getMonth(), 1);
    // DOM.endDate.valueAsDate = today;
    
    // Initialize event listeners
    setupEventListeners();
    
    // Initialize categories in filter
    populateCategoryFilter();
    
    // Load and display data
    loadData();
    // Initialize charts
    initCharts();
    updateUI();
    

    
    console.log('Expense Tracker initialized successfully!');
}

//EVENT LISTENERS
function setupEventListeners() {
    // Form Submission
    DOM.transactionForm.addEventListener('submit', handleFormSubmit);
    
    // Type Selector Buttons
    document.querySelectorAll('.type-option').forEach(button => {
        button.addEventListener('click', handleTypeSelect);
    });
    
    // Category Selection
    document.querySelectorAll('.category-option').forEach(option => {
        option.addEventListener('click', handleCategorySelect);
    });
    
    // Filter Changes
    DOM.filterCategory.addEventListener('change', handleFilterChange);
    DOM.filterType.addEventListener('change', handleFilterChange);
    DOM.filterDate.addEventListener('change', handleDateFilterChange);
    // DOM.startDate.addEventListener('change', handleCustomDateChange);
    // DOM.endDate.addEventListener('change', handleCustomDateChange);
    
    // Clear Filters
    DOM.clearFiltersBtn.addEventListener('click', clearFilters);
    
    // Pagination
    DOM.prevBtn.addEventListener('click', goToPrevPage);
    DOM.nextBtn.addEventListener('click', goToNextPage);
    
    // Action Buttons
    DOM.exportBtn.addEventListener('click', exportData);
    DOM.deleteAllBtn.addEventListener('click', confirmDeleteAll);
    
    // Modal Events
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', closeAllModals);
    });
    
    document.getElementById('confirm-cancel').addEventListener('click', closeAllModals);
    document.getElementById('confirm-ok').addEventListener('click', handleConfirmAction);
    
    // Clear Form Button
    document.querySelector('button[type="reset"]').addEventListener('click', resetForm);
    
    // Window events
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closeAllModals();
        }
    });
}

//FORM HANDLING
function handleFormSubmit(e) {
    e.preventDefault();
    
    const transaction = {
        id: Date.now(),
        type: DOM.typeInput.value,
        amount: parseFloat(DOM.amountInput.value),
        description: DOM.descriptionInput.value.trim(),
        date: DOM.dateInput.value,
        category: DOM.categoryInput.value,
        createdAt: new Date().toISOString()
    };
    
    // Validation
    if (!validateTransaction(transaction)) {
        return;
    }
    
    // Add transaction
    AppState.transactions.unshift(transaction);
    
    // Save and update
    saveData();
    updateUI();
    
    // Show success message
    showNotification('Transaction added successfully!', 'success');
    
    // Reset form
    resetForm();
}

function validateTransaction(transaction) {
    // Check required fields
    if (!transaction.type || !transaction.amount || !transaction.description || !transaction.date || !transaction.category) {
        showNotification('Please fill in all fields', 'error');
        return false;
    }
    
    // Check amount
    if (transaction.amount <= 0 || isNaN(transaction.amount)) {
        showNotification('Amount must be greater than 0', 'error');
        return false;
    }
    
    // Check description length
    if (transaction.description.length < 3) {
        showNotification('Description must be at least 3 characters', 'error');
        return false;
    }
    
    return true;
}

function handleTypeSelect(e) {
    const selectedType = e.currentTarget.dataset.type;
    
    // Update UI
    document.querySelectorAll('.type-option').forEach(btn => {
        btn.classList.remove('active');
    });
    e.currentTarget.classList.add('active');
    
    // Update hidden input
    DOM.typeInput.value = selectedType;
    
    // Update category options visibility
    updateCategoryOptions(selectedType);
}

function handleCategorySelect(e) {
    const selectedCategory = e.currentTarget.dataset.category;
    const selectedType = e.currentTarget.dataset.type;
    
    // Update UI
    document.querySelectorAll('.category-option').forEach(option => {
        option.classList.remove('active');
    });
    e.currentTarget.classList.add('active');
    
    // Update hidden input
    DOM.categoryInput.value = selectedCategory;
}

function updateCategoryOptions(type) {
    document.querySelectorAll('.category-option').forEach(option => {
        if (option.dataset.type === type || option.dataset.type === 'both') {
            option.style.display = 'flex';
        } else {
            option.style.display = 'none';
            option.classList.remove('active');
        }
    });
    
    // Select first visible category
    const firstVisible = document.querySelector('.category-option[data-type="' + type + '"]');
    if (firstVisible) {
        firstVisible.classList.add('active');
        DOM.categoryInput.value = firstVisible.dataset.category;
    }
}

function resetForm() {
    DOM.transactionForm.reset();
    DOM.dateInput.valueAsDate = new Date();
    
    // Reset type to income
    document.querySelectorAll('.type-option').forEach(btn => btn.classList.remove('active'));
    document.querySelector('.type-option[data-type="income"]').classList.add('active');
    DOM.typeInput.value = 'income';
    
    // Reset category to salary
    document.querySelectorAll('.category-option').forEach(opt => opt.classList.remove('active'));
    const salaryOption = document.querySelector('.category-option[data-category="salary"]');
    if (salaryOption) {
        salaryOption.classList.add('active');
        DOM.categoryInput.value = 'salary';
    }
    
    updateCategoryOptions('income');
}

//DATA MANAGEMENT
function loadData() {
    const saved = localStorage.getItem('expenseTrackerTransactions');
    if (saved) {
        AppState.transactions = JSON.parse(saved);
    }
}

function saveData() {
    localStorage.setItem('expenseTrackerTransactions', JSON.stringify(AppState.transactions));
    updateFooterStats();
}

//FILTERING
function handleFilterChange() {
    AppState.currentFilters.category = DOM.filterCategory.value;
    AppState.currentFilters.type = DOM.filterType.value;
    AppState.pagination.currentPage = 1;
    updateUI();
}

function handleDateFilterChange() {
    AppState.currentFilters.dateRange = DOM.filterDate.value;
    
    // Show/hide custom date range
    // const customDateRange = document.getElementById('custom-date-range');
    // if (DOM.filterDate.value === 'custom') {
    //     customDateRange.style.display = 'flex';
    //     AppState.currentFilters.startDate = DOM.startDate.value;
    //     AppState.currentFilters.endDate = DOM.endDate.value;
    // } else {
    //     customDateRange.style.display = 'none';
    //     AppState.currentFilters.startDate = null;
    //     AppState.currentFilters.endDate = null;
    // }
    

    AppState.pagination.currentPage = 1;
    updateUI();
}

function handleCustomDateChange() {
    AppState.currentFilters.startDate = DOM.startDate.value;
    AppState.currentFilters.endDate = DOM.endDate.value;
    AppState.pagination.currentPage = 1;
    updateUI();
}

function clearFilters() {
    DOM.filterCategory.value = 'all';
    DOM.filterType.value = 'all';
    DOM.filterDate.value = 'all';
    
    // const customDateRange = document.getElementById('custom-date-range');
    // customDateRange.style.display = 'none';
    
    AppState.currentFilters = {
        category: 'all',
        type: 'all',
        dateRange: 'all',
        startDate: null,
        endDate: null
    };
    
    AppState.pagination.currentPage = 1;
    updateUI();
    showNotification('Filters cleared', 'success');
}

function populateCategoryFilter() {
    const filter = DOM.filterCategory;
    filter.innerHTML = '<option value="all">All Categories</option>';
    
    // Add income categories
    AppState.categories.income.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = formatCategoryName(category);
        filter.appendChild(option);
    });
    
    // Add expense categories
    AppState.categories.expense.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = formatCategoryName(category);
        filter.appendChild(option);
    });
}

function formatCategoryName(category) {
    return category.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
}

// ===== TRANSACTION LIST RENDERING =====
function renderTransactionList() {
    const filteredTransactions = getFilteredTransactions();
    const paginatedTransactions = getPaginatedTransactions(filteredTransactions);
    
    if (paginatedTransactions.length === 0) {
        DOM.transactionsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-receipt fa-3x"></i>
                <h3>No Transactions Found</h3>
                <p>Try changing your filters or add a new transaction</p>
            </div>
        `;
        return;
    }
    
    DOM.transactionsList.innerHTML = paginatedTransactions.map(transaction => `
        <div class="transaction-item" data-id="${transaction.id}">
            <span class="transaction-date">${formatDisplayDate(transaction.date)}</span>
            <div class="transaction-description">
                <i class="${getCategoryIcon(transaction.category)}"></i>
                <span>${transaction.description}</span>
            </div>
            <span class="transaction-category ${transaction.category}">
                ${formatCategoryName(transaction.category)}
            </span>
            <span class="transaction-amount ${transaction.type}">
                ${transaction.type === 'income' ? '+' : '-'}$${transaction.amount.toFixed(2)}
            </span>
            <div class="transaction-actions">
                <button class="action-btn edit-btn" onclick="editTransaction(${transaction.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn delete-btn" onclick="deleteTransaction(${transaction.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
    
    // Update transaction info
    DOM.transactionsCount.textContent = `${filteredTransactions.length} transactions`;
    const filteredTotal = filteredTransactions.reduce((sum, t) => {
        return t.type === 'income' ? sum + t.amount : sum - t.amount;
    }, 0);
    DOM.transactionsTotal.textContent = `Total: $${filteredTotal.toFixed(2)}`;
}

function getFilteredTransactions() {
    let filtered = AppState.transactions;
    
    // Filter by category
    if (AppState.currentFilters.category !== 'all') {
        filtered = filtered.filter(t => t.category === AppState.currentFilters.category);
    }
    
    // Filter by type
    if (AppState.currentFilters.type !== 'all') {
        filtered = filtered.filter(t => t.type === AppState.currentFilters.type);
    }
    
    // Filter by date range
    if (AppState.currentFilters.dateRange !== 'all') {
        const now = new Date();
        let startDate, endDate;
        
        switch (AppState.currentFilters.dateRange) {
            case 'today':
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
                break;
            case 'week':
                const dayOfWeek = now.getDay();
                const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
                startDate = new Date(now.getFullYear(), now.getMonth(), diff);
                endDate = new Date(now.getFullYear(), now.getMonth(), diff + 7);
                break;
            case 'month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
                break;
            case 'year':
                startDate = new Date(now.getFullYear(), 0, 1);
                endDate = new Date(now.getFullYear() + 1, 0, 1);
                break;
            // case 'custom':
            //     if (AppState.currentFilters.startDate && AppState.currentFilters.endDate) {
            //         startDate = new Date(AppState.currentFilters.startDate);
            //         endDate = new Date(AppState.currentFilters.endDate);
            //         endDate.setDate(endDate.getDate() + 1);
            //     }
            //     break;
        }
        
        if (startDate && endDate) {
            filtered = filtered.filter(t => {
                const transactionDate = new Date(t.date);
                return transactionDate >= startDate && transactionDate < endDate;
            });
        }
    }
    
    return filtered;
}

function getPaginatedTransactions(transactions) {
    const startIndex = (AppState.pagination.currentPage - 1) * AppState.pagination.itemsPerPage;
    const endIndex = startIndex + AppState.pagination.itemsPerPage;
    
    AppState.pagination.totalPages = Math.ceil(transactions.length / AppState.pagination.itemsPerPage);
    
    // Update pagination UI
    DOM.currentPage.textContent = AppState.pagination.currentPage;
    DOM.totalPages.textContent = AppState.pagination.totalPages;
    DOM.prevBtn.disabled = AppState.pagination.currentPage === 1;
    DOM.nextBtn.disabled = AppState.pagination.currentPage === AppState.pagination.totalPages;
    
    return transactions.slice(startIndex, endIndex);
}

function goToPrevPage() {
    if (AppState.pagination.currentPage > 1) {
        AppState.pagination.currentPage--;
        updateUI();
    }
}

function goToNextPage() {
    if (AppState.pagination.currentPage < AppState.pagination.totalPages) {
        AppState.pagination.currentPage++;
        updateUI();
    }
}

// ===== CRUD OPERATIONS =====
function editTransaction(id) {
    const transaction = AppState.transactions.find(t => t.id === id);
    if (!transaction) return;
    
    // Fill edit form (you can implement a proper edit modal)
    DOM.typeInput.value = transaction.type;
    DOM.amountInput.value = transaction.amount;
    DOM.descriptionInput.value = transaction.description;
    DOM.dateInput.value = transaction.date;
    DOM.categoryInput.value = transaction.category;
    
    // Update UI buttons
    document.querySelectorAll('.type-option').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.type === transaction.type);
    });
    
    document.querySelectorAll('.category-option').forEach(opt => {
        opt.classList.toggle('active', opt.dataset.category === transaction.category);
    });
    
    updateCategoryOptions(transaction.type);
    
    // Scroll to form
    document.querySelector('.input-form').scrollIntoView({ behavior: 'smooth' });
    
    showNotification('Transaction loaded for editing', 'success');
}

function deleteTransaction(id) {
    AppState.pendingAction = {
        type: 'delete',
        id: id,
        message: 'Are you sure you want to delete this transaction?'
    };
    showConfirmModal();
}

function confirmDeleteAll() {
    AppState.pendingAction = {
        type: 'deleteAll',
        message: 'Are you sure you want to delete ALL transactions? This cannot be undone!'
    };
    showConfirmModal();
}

function handleConfirmAction() {
    if (!AppState.pendingAction) return;
    
    switch (AppState.pendingAction.type) {
        case 'delete':
            AppState.transactions = AppState.transactions.filter(t => t.id !== AppState.pendingAction.id);
            showNotification('Transaction deleted successfully', 'success');
            break;
        case 'deleteAll':
            AppState.transactions = [];
            showNotification('All transactions deleted', 'success');
            break;
    }
    
    saveData();
    updateUI();
    closeAllModals();
    AppState.pendingAction = null;
}

// SUMMARY CALCULATIONS
function updateSummary() {
    const filtered = getFilteredTransactions();
    
    const totalIncome = filtered
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpenses = filtered
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
    
    const netBalance = totalIncome - totalExpenses;
    
    DOM.totalIncome.textContent = `$${totalIncome.toFixed(2)}`;
    DOM.totalExpenses.textContent = `$${totalExpenses.toFixed(2)}`;
    DOM.netBalance.textContent = `$${netBalance.toFixed(2)}`;
    DOM.totalTransactions.textContent = filtered.length;
    
    // Color code net balance
    if (netBalance >= 0) {
        DOM.netBalance.style.color = '#4cc9f0';
    } else {
        DOM.netBalance.style.color = '#f72585';
    }
}

function updateFooterStats() {
    DOM.footerTransactions.textContent = AppState.transactions.length;
    
    // Calculate days tracked
    if (AppState.transactions.length > 0) {
        const dates = AppState.transactions.map(t => new Date(t.date).toDateString());
        const uniqueDays = new Set(dates).size;
        DOM.footerDaysTracked.textContent = uniqueDays;
    } else {
        DOM.footerDaysTracked.textContent = '0';
    }
}

// CHARTS
function initCharts() {
    // Expense Distribution Chart
    const expenseCtx = DOM.expenseChart.getContext('2d');
    AppState.charts.expenseChart = new Chart(expenseCtx, {
        type: 'doughnut',
        data: {
            labels: [],
            datasets: [{
                data: [],
                backgroundColor: [
                    '#f72585', '#7209b7', '#4361ee', '#4cc9f0',
                    '#ff9e00', '#06d6a0', '#118ab2', '#6c757d'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
    
    // Monthly Overview Chart
    const monthlyCtx = DOM.monthlyChart.getContext('2d');
    AppState.charts.monthlyChart = new Chart(monthlyCtx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Income',
                    data: [],
                    backgroundColor: '#4cc9f0'
                },
                {
                    label: 'Expenses',
                    data: [],
                    backgroundColor: '#f72585'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
    
    updateCharts();
}

function updateCharts() {
    // Update Expense Distribution Chart
    const expenseData = calculateExpenseByCategory();
    AppState.charts.expenseChart.data.labels = expenseData.labels;
    AppState.charts.expenseChart.data.datasets[0].data = expenseData.values;
    AppState.charts.expenseChart.update();
    
    // Update Monthly Overview Chart
    const monthlyData = calculateMonthlyData();
    AppState.charts.monthlyChart.data.labels = monthlyData.labels;
    AppState.charts.monthlyChart.data.datasets[0].data = monthlyData.income;
    AppState.charts.monthlyChart.data.datasets[1].data = monthlyData.expenses;
    AppState.charts.monthlyChart.update();
}

function calculateExpenseByCategory() {
    const expenses = AppState.transactions.filter(t => t.type === 'expense');
    const categoryTotals = {};
    
    expenses.forEach(transaction => {
        categoryTotals[transaction.category] = (categoryTotals[transaction.category] || 0) + transaction.amount;
    });
    
    return {
        labels: Object.keys(categoryTotals).map(formatCategoryName),
        values: Object.values(categoryTotals)
    };
}

function calculateMonthlyData() {
    const now = new Date();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const incomeByMonth = new Array(12).fill(0);
    const expensesByMonth = new Array(12).fill(0);
    
    AppState.transactions.forEach(transaction => {
        const date = new Date(transaction.date);
        const month = date.getMonth();
        
        if (transaction.type === 'income') {
            incomeByMonth[month] += transaction.amount;
        } else {
            expensesByMonth[month] += transaction.amount;
        }
    });
    
    return {
        labels: months,
        income: incomeByMonth,
        expenses: expensesByMonth
    };
}

// EXPORT/IMPORT
function exportData() {
    const data = {
        transactions: AppState.transactions,
        exportedAt: new Date().toISOString(),
        version: '1.0'
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expense-tracker-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showNotification('Data exported successfully', 'success');
}

// function showImportModal() {
//     DOM.importModal.classList.add('show');
// }

// MODAL FUNCTIONS
function showConfirmModal() {
    if (AppState.pendingAction) {
        document.getElementById('confirm-message').textContent = AppState.pendingAction.message;
        DOM.confirmModal.classList.add('show');
    }
}

function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.remove('show');
    });
    AppState.pendingAction = null;
}

// NOTIFICATION SYSTEM
function showNotification(message, type = 'success') {
    const toast = document.getElementById('notification');
    const toastIcon = toast.querySelector('.toast-icon');
    const toastMessage = toast.querySelector('.toast-message');
    
    // Set message and type
    toastMessage.textContent = message;
    toast.className = `toast ${type}`;
    
    // Show toast
    toast.classList.add('show');
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
    
    // Close button event
    toast.querySelector('.toast-close').onclick = () => {
        toast.classList.remove('show');
    };
}

// HELPER FUNCTIONS
function formatDisplayDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getCategoryIcon(category) {
    const icons = {
        'salary': 'fas fa-briefcase',
        'freelance': 'fas fa-laptop-code',
        'investment': 'fas fa-chart-line',
        'other-income': 'fas fa-hand-holding-usd',
        'food': 'fas fa-utensils',
        'transport': 'fas fa-car',
        'shopping': 'fas fa-shopping-bag',
        'entertainment': 'fas fa-gamepad',
        'bills': 'fas fa-file-invoice-dollar',
        'health': 'fas fa-heartbeat',
        'education': 'fas fa-graduation-cap',
        'other': 'fas fa-ellipsis-h'
    };
    
    return icons[category] || 'fas fa-question-circle';
}

// ===== MAIN UPDATE FUNCTION =====
function updateUI() {
    updateSummary();
    renderTransactionList();
    updateCharts();
    updateFooterStats();
}

// ===== INITIALIZE APP =====
// Wait for DOM to load
document.addEventListener('DOMContentLoaded', init);

// Make functions available globally for onclick attributes
window.editTransaction = editTransaction;
window.deleteTransaction = deleteTransaction;