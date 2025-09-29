/**
 * Advanced Compound Interest Calculator
 * Features: Input validation, inflation adjustment, goal planning, multiple visualizations, export capabilities
 */

class CompoundInterestCalculator {
    constructor() {
        this.chart = null;
        this.currentChartType = 'line';
        this.calculationData = null;
        this.currentCurrency = 'USD';
        this.currencyConfig = this.initializeCurrencyConfig();
        this.init();
    }

    initializeCurrencyConfig() {
        return {
            USD: { symbol: '$', code: 'USD', name: 'US Dollar', locale: 'en-US', decimals: 2 },
            EUR: { symbol: '€', code: 'EUR', name: 'Euro', locale: 'de-DE', decimals: 2 },
            GBP: { symbol: '£', code: 'GBP', name: 'British Pound', locale: 'en-GB', decimals: 2 },
            JPY: { symbol: '¥', code: 'JPY', name: 'Japanese Yen', locale: 'ja-JP', decimals: 0 },
            CAD: { symbol: 'C$', code: 'CAD', name: 'Canadian Dollar', locale: 'en-CA', decimals: 2 },
            AUD: { symbol: 'A$', code: 'AUD', name: 'Australian Dollar', locale: 'en-AU', decimals: 2 },
            CHF: { symbol: 'Fr', code: 'CHF', name: 'Swiss Franc', locale: 'de-CH', decimals: 2 },
            CNY: { symbol: '¥', code: 'CNY', name: 'Chinese Yuan', locale: 'zh-CN', decimals: 2 },
            INR: { symbol: '₹', code: 'INR', name: 'Indian Rupee', locale: 'en-IN', decimals: 2 },
            KRW: { symbol: '₩', code: 'KRW', name: 'South Korean Won', locale: 'ko-KR', decimals: 0 },
            BRL: { symbol: 'R$', code: 'BRL', name: 'Brazilian Real', locale: 'pt-BR', decimals: 2 },
            RUB: { symbol: '₽', code: 'RUB', name: 'Russian Ruble', locale: 'ru-RU', decimals: 2 },
            ZAR: { symbol: 'R', code: 'ZAR', name: 'South African Rand', locale: 'en-ZA', decimals: 2 },
            MXN: { symbol: '$', code: 'MXN', name: 'Mexican Peso', locale: 'es-MX', decimals: 2 },
            SGD: { symbol: 'S$', code: 'SGD', name: 'Singapore Dollar', locale: 'en-SG', decimals: 2 },
            HKD: { symbol: 'HK$', code: 'HKD', name: 'Hong Kong Dollar', locale: 'en-HK', decimals: 2 },
            NOK: { symbol: 'kr', code: 'NOK', name: 'Norwegian Krone', locale: 'no-NO', decimals: 2 },
            SEK: { symbol: 'kr', code: 'SEK', name: 'Swedish Krona', locale: 'sv-SE', decimals: 2 },
            DKK: { symbol: 'kr', code: 'DKK', name: 'Danish Krone', locale: 'da-DK', decimals: 2 },
            PLN: { symbol: 'zł', code: 'PLN', name: 'Polish Złoty', locale: 'pl-PL', decimals: 2 }
        };
    }

    init() {
        this.bindEvents();
        this.setupFormValidation();
        this.loadFromURL();
    }

    bindEvents() {
        // Main action buttons
        document.getElementById('calculate-button').addEventListener('click', () => this.calculate());
        document.getElementById('reset-button').addEventListener('click', () => this.reset());

        // Chart type buttons
        document.querySelectorAll('.chart-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchChart(e.target.dataset.chart));
        });

        // Export buttons
        document.getElementById('export-pdf').addEventListener('click', () => this.exportPDF());
        document.getElementById('export-csv').addEventListener('click', () => this.exportCSV());
        document.getElementById('share-link').addEventListener('click', () => this.shareLink());

        // Currency change handler
        document.getElementById('currency').addEventListener('change', (e) => this.changeCurrency(e.target.value));

        // Real-time calculation on input change
        const inputs = document.querySelectorAll('input, select');
        inputs.forEach(input => {
            input.addEventListener('input', this.debounce(() => {
                // Only auto-calculate if validation passes, but don't show validation errors during typing
                if (this.hasMinimumRequiredData() && this.validateAllInputs(false)) {
                    this.calculate();
                }
            }, 300));
        });

        // Input formatting
        this.setupInputFormatting();
    }

    setupInputFormatting() {
        // Temporarily disable automatic currency formatting to avoid conflicts
        // Currency symbols are already shown in the UI, so formatting is optional
        
        // Format percentage inputs only
        const percentageInputs = ['interest-rate', 'inflation-rate'];
        percentageInputs.forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                input.addEventListener('input', (e) => this.validatePercentage(e.target));
            }
        });
    }

    getCleanNumericValue(input) {
        // Helper method to get clean numeric value from any input
        const currency = this.currencyConfig[this.currentCurrency];
        const cleanRegex = new RegExp(`[${currency.symbol.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')},$\\s]`, 'g');
        return input.value.replace(cleanRegex, '');
    }

    setupFormValidation() {
        const inputs = document.querySelectorAll('input[type="number"]');
        inputs.forEach(input => {
            // Only validate required fields on blur
            input.addEventListener('blur', () => {
                if (['starting-balance', 'years', 'interest-rate'].includes(input.id)) {
                    this.validateInput(input);
                }
            });
            // Clear validation errors when user starts typing again
            input.addEventListener('focus', () => this.clearValidationError(input));
        });
    }

    formatCurrencyInput(input) {
        const currency = this.currencyConfig[this.currentCurrency];
        // Create a regex that matches the currency symbol and common separators
        const cleanRegex = new RegExp(`[${currency.symbol.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')},$\\s]`, 'g');
        const cleanValue = input.value.replace(cleanRegex, '');
        const value = parseFloat(cleanValue);
        
        if (!isNaN(value) && value > 0) {
            try {
                // For display, show formatted number without currency symbol since it's already in the UI
                input.value = value.toLocaleString(currency.locale, {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: currency.decimals,
                    useGrouping: true
                });
            } catch (error) {
                // Fallback to simple formatting if locale is not supported
                input.value = value.toFixed(currency.decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
            }
        } else if (cleanValue === '' || cleanValue === '0') {
            // Don't format empty or zero values, leave as is
            input.value = cleanValue;
        }
    }

    unformatCurrencyInput(input) {
        const currency = this.currencyConfig[this.currentCurrency];
        // Remove currency symbols and formatting, keep just the number
        const cleanRegex = new RegExp(`[${currency.symbol.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')},$\\s]`, 'g');
        const cleanValue = input.value.replace(cleanRegex, '');
        
        // Only update if the cleaned value is different to avoid cursor position issues
        if (cleanValue !== input.value) {
            input.value = cleanValue;
        }
    }

    validatePercentage(input) {
        const value = parseFloat(input.value);
        if (value > 100) {
            input.value = 100;
        } else if (value < 0) {
            input.value = 0;
        }
    }

    validateInput(input) {
        let rawValue = input.value;
        
        // Clean currency symbols and formatting for currency fields
        if (['starting-balance', 'contribution', 'target-amount'].includes(input.id)) {
            const currency = this.currencyConfig[this.currentCurrency];
            const cleanRegex = new RegExp(`[${currency.symbol.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')},$\\s]`, 'g');
            rawValue = rawValue.replace(cleanRegex, '');
        }
        
        const value = parseFloat(rawValue);
        const min = parseFloat(input.min);
        const max = parseFloat(input.max);

        this.clearValidationError(input);

        if (input.hasAttribute('required') && (!rawValue || isNaN(value))) {
            this.showValidationError(input, 'This field is required');
            return false;
        }

        if (!isNaN(min) && value < min) {
            this.showValidationError(input, `Value must be at least ${min}`);
            return false;
        }

        if (!isNaN(max) && value > max) {
            this.showValidationError(input, `Value must be no more than ${max}`);
            return false;
        }

        return true;
    }

    showValidationError(input, message) {
        input.style.borderColor = 'var(--error-color)';
        input.style.boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.1)';
        
        let errorElement = input.parentElement.querySelector('.error-message');
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.className = 'error-message';
            errorElement.style.color = 'var(--error-color)';
            errorElement.style.fontSize = 'var(--font-size-xs)';
            errorElement.style.marginTop = 'var(--spacing-xs)';
            input.parentElement.appendChild(errorElement);
        }
        errorElement.textContent = message;
    }

    clearValidationError(input) {
        input.style.borderColor = '';
        input.style.boxShadow = '';
        
        const errorElement = input.parentElement.querySelector('.error-message');
        if (errorElement) {
            errorElement.remove();
        }
    }

    validateAllInputs(showErrors = true) {
        const requiredInputs = ['starting-balance', 'years', 'interest-rate'];
        let isValid = true;

        requiredInputs.forEach(id => {
            const input = document.getElementById(id);
            let rawValue = input.value;
            
            // Clean currency symbols and formatting for currency fields
            if (['starting-balance', 'contribution', 'target-amount'].includes(id)) {
                const currency = this.currencyConfig[this.currentCurrency];
                const cleanRegex = new RegExp(`[${currency.symbol.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')},$\\s]`, 'g');
                rawValue = rawValue.replace(cleanRegex, '');
            }
            
            const value = parseFloat(rawValue);
            
            if (!rawValue || isNaN(value) || value <= 0) {
                if (showErrors) {
                    this.showValidationError(input, 'This field is required and must be greater than 0');
                }
                isValid = false;
            } else {
                // Clear any existing validation errors if the field is now valid
                this.clearValidationError(input);
            }
        });

        return isValid;
    }

    hasMinimumRequiredData() {
        // Check if we have the minimum data needed for calculation without showing errors
        const requiredInputs = ['starting-balance', 'years', 'interest-rate'];
        
        return requiredInputs.every(id => {
            const input = document.getElementById(id);
            let rawValue = input.value;
            
            // Clean currency symbols for currency fields
            if (['starting-balance', 'contribution', 'target-amount'].includes(id)) {
                const currency = this.currencyConfig[this.currentCurrency];
                const cleanRegex = new RegExp(`[${currency.symbol.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')},$\\s]`, 'g');
                rawValue = rawValue.replace(cleanRegex, '');
            }
            
            const value = parseFloat(rawValue);
            return rawValue && !isNaN(value) && value > 0;
        });
    }

    changeCurrency(currencyCode) {
        this.currentCurrency = currencyCode;
        const currency = this.currencyConfig[currencyCode];
        
        // Update currency symbols in the UI
        const currencySymbols = document.querySelectorAll('.currency-symbol');
        currencySymbols.forEach(symbol => {
            symbol.textContent = currency.symbol;
        });

        // Recalculate and update display if we have results
        if (this.calculationData) {
            this.displayResults(this.calculationData);
            this.updateChart();
        }

        this.showNotification(`Currency changed to ${currency.name}`, 'info');
    }

    getFormData() {
        const currency = this.currencyConfig[this.currentCurrency];
        const cleanRegex = new RegExp(`[${currency.symbol.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')},$\\s]`, 'g');
        
        return {
            principal: parseFloat(document.getElementById('starting-balance').value.replace(cleanRegex, '')) || 0,
            contribution: parseFloat(document.getElementById('contribution').value.replace(cleanRegex, '')) || 0,
            contributionFrequency: parseFloat(document.getElementById('contribution-frequency').value) || 12,
            years: parseFloat(document.getElementById('years').value) || 0,
            interestRate: parseFloat(document.getElementById('interest-rate').value) || 0,
            compoundFrequency: parseFloat(document.getElementById('compound-frequency').value) || 12,
            inflationRate: parseFloat(document.getElementById('inflation-rate').value) || 3,
            targetAmount: parseFloat(document.getElementById('target-amount').value.replace(cleanRegex, '')) || 0,
            currency: document.getElementById('currency').value || 'USD'
        };
    }

    calculate() {
        if (!this.validateAllInputs(true)) {
            this.showNotification('Please correct the errors in the form', 'error');
            return;
        }

        const data = this.getFormData();
        
        try {
            this.showLoading(true);
            
            // Calculate compound interest
            const result = this.calculateCompoundInterest(data);
            
            // Calculate inflation-adjusted value
            const realValue = this.calculateRealValue(result.finalAmount, data.inflationRate, data.years);
            
            // Calculate goal timeline if target is set
            let goalTimeline = null;
            if (data.targetAmount > 0) {
                goalTimeline = this.calculateGoalTimeline(data);
            }

            // Generate year-by-year breakdown
            const yearlyBreakdown = this.generateYearlyBreakdown(data);

            this.calculationData = {
                ...result,
                realValue,
                goalTimeline,
                yearlyBreakdown,
                inputData: data
            };

            this.displayResults(this.calculationData);
            this.updateChart();
            this.showSections();
            
            // Update URL for sharing
            this.updateURL(data);
            
            this.showNotification('Calculation completed successfully!', 'success');
            
        } catch (error) {
            console.error('Calculation error:', error);
            this.showNotification('An error occurred during calculation. Please check your inputs.', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    calculateCompoundInterest(data) {
        const { principal, contribution, contributionFrequency, years, interestRate, compoundFrequency } = data;
        
        const r = interestRate / 100;
        const n = compoundFrequency;
        const t = years;
        const pmt = contribution;
        const pmtFreq = contributionFrequency;

        // Future value of principal with compound interest: P(1 + r/n)^(nt)
        const principalFV = principal * Math.pow(1 + r / n, n * t);

        // Future value of regular contributions (annuity)
        let contributionFV = 0;
        if (pmt > 0 && r > 0) {
            const effectiveRate = r / n;
            const periods = n * t;
            const contributionPeriods = pmtFreq * t;
            const contributionPerCompoundPeriod = (pmt * pmtFreq) / n;
            
            contributionFV = contributionPerCompoundPeriod * ((Math.pow(1 + effectiveRate, periods) - 1) / effectiveRate);
        } else if (pmt > 0) {
            contributionFV = pmt * pmtFreq * t;
        }

        const finalAmount = principalFV + contributionFV;
        const totalContributions = principal + (pmt * pmtFreq * t);
        const interestEarned = finalAmount - totalContributions;

        return {
            finalAmount,
            totalContributions,
            interestEarned,
            principalGrowth: principalFV - principal,
            contributionGrowth: contributionFV - (pmt * pmtFreq * t)
        };
    }

    calculateRealValue(nominalValue, inflationRate, years) {
        const realValue = nominalValue / Math.pow(1 + inflationRate / 100, years);
        return realValue;
    }

    calculateGoalTimeline(data) {
        const { principal, contribution, contributionFrequency, targetAmount, interestRate, compoundFrequency } = data;
        
        if (targetAmount <= principal) {
            return { years: 0, message: 'Target already reached with initial investment!' };
        }

        const r = interestRate / 100;
        const n = compoundFrequency;
        const pmt = contribution * contributionFrequency / n; // PMT per compound period

        // Solve for t using numerical method (binary search)
        let low = 0;
        let high = 100;
        let tolerance = 0.01;

        for (let iterations = 0; iterations < 1000; iterations++) {
            const t = (low + high) / 2;
            const fv = principal * Math.pow(1 + r / n, n * t) + 
                      (pmt > 0 ? pmt * ((Math.pow(1 + r / n, n * t) - 1) / (r / n)) : 0);

            if (Math.abs(fv - targetAmount) < tolerance) {
                const years = Math.ceil(t);
                const message = `You'll reach your goal in approximately ${years} year${years !== 1 ? 's' : ''}`;
                return { years, message };
            }

            if (fv < targetAmount) {
                low = t;
            } else {
                high = t;
            }
        }

        return { years: -1, message: 'Goal may not be reachable with current parameters' };
    }

    generateYearlyBreakdown(data) {
        const breakdown = [];
        const { principal, contribution, contributionFrequency, years, interestRate, compoundFrequency, inflationRate } = data;
        
        let currentPrincipal = principal;
        let totalContributions = principal;
        
        for (let year = 0; year <= years; year++) {
            if (year > 0) {
                // Add contributions for the year
                const yearlyContribution = contribution * contributionFrequency;
                totalContributions += yearlyContribution;
                
                // Calculate growth
                const growthRate = interestRate / 100;
                const compoundsPerYear = compoundFrequency;
                currentPrincipal = (currentPrincipal + yearlyContribution) * Math.pow(1 + growthRate / compoundsPerYear, compoundsPerYear);
            }

            const interestEarned = currentPrincipal - totalContributions;
            const realValue = this.calculateRealValue(currentPrincipal, inflationRate, year);

            breakdown.push({
                year,
                balance: currentPrincipal,
                contributions: totalContributions,
                interest: interestEarned,
                realValue
            });
        }

        return breakdown;
    }

    displayResults(data) {
        // Update result cards
        document.getElementById('final-amount').textContent = this.formatCurrency(data.finalAmount);
        document.getElementById('total-contributions').textContent = this.formatCurrency(data.totalContributions);
        document.getElementById('interest-earned').textContent = this.formatCurrency(data.interestEarned);
        document.getElementById('real-value').textContent = this.formatCurrency(data.realValue);
        document.getElementById('investment-years').textContent = data.inputData.years;

        // Update goal timeline if applicable
        if (data.goalTimeline && data.inputData.targetAmount > 0) {
            document.getElementById('target-timeline').textContent = data.goalTimeline.message;
            document.getElementById('target-results').classList.remove('hidden');
        } else {
            document.getElementById('target-results').classList.add('hidden');
        }
    }

    updateChart() {
        if (!this.calculationData) return;

        this.destroyChart();

        const ctx = document.getElementById('investmentChart').getContext('2d');
        const data = this.calculationData.yearlyBreakdown;

        const chartConfig = this.getChartConfig(this.currentChartType, data);
        
        this.chart = new Chart(ctx, chartConfig);
    }

    getChartConfig(type, data) {
        const labels = data.map(item => `Year ${item.year}`);
        const contributions = data.map(item => item.contributions);
        const balances = data.map(item => item.balance);
        const realValues = data.map(item => item.realValue);

        const colors = {
            primary: '#3b82f6',
            secondary: '#10b981',
            accent: '#8b5cf6'
        };

        const commonOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: (context) => {
                            return `${context.dataset.label}: ${this.formatCurrency(context.raw)}`;
                        }
                    }
                }
            }
        };

        switch (type) {
            case 'line':
                return {
                    type: 'line',
                    data: {
                        labels,
                        datasets: [
                            {
                                label: 'Total Value',
                                data: balances,
                                borderColor: colors.primary,
                                backgroundColor: colors.primary + '20',
                                fill: true,
                                tension: 0.4
                            },
                            {
                                label: 'Total Contributions',
                                data: contributions,
                                borderColor: colors.secondary,
                                backgroundColor: 'transparent',
                                borderDash: [5, 5]
                            },
                            {
                                label: 'Inflation Adjusted',
                                data: realValues,
                                borderColor: colors.accent,
                                backgroundColor: 'transparent',
                                borderDash: [10, 5]
                            }
                        ]
                    },
                    options: {
                        ...commonOptions,
                        scales: {
                            y: {
                                beginAtZero: true,
                                ticks: {
                                    callback: (value) => this.formatCurrency(value, false)
                                }
                            }
                        }
                    }
                };

            case 'bar':
                const finalData = data[data.length - 1];
                return {
                    type: 'bar',
                    data: {
                        labels: ['Final Results'],
                        datasets: [
                            {
                                label: 'Total Contributions',
                                data: [finalData.contributions],
                                backgroundColor: colors.primary
                            },
                            {
                                label: 'Interest Earned',
                                data: [finalData.interest],
                                backgroundColor: colors.secondary
                            }
                        ]
                    },
                    options: {
                        ...commonOptions,
                        scales: {
                            x: { stacked: true },
                            y: {
                                stacked: true,
                                beginAtZero: true,
                                ticks: {
                                    callback: (value) => this.formatCurrency(value, false)
                                }
                            }
                        }
                    }
                };

            case 'doughnut':
                const finalResult = data[data.length - 1];
                return {
                    type: 'doughnut',
                    data: {
                        labels: ['Total Contributions', 'Interest Earned'],
                        datasets: [{
                            data: [finalResult.contributions, finalResult.interest],
                            backgroundColor: [colors.primary, colors.secondary],
                            borderWidth: 2,
                            borderColor: '#ffffff'
                        }]
                    },
                    options: {
                        ...commonOptions,
                        plugins: {
                            ...commonOptions.plugins,
                            tooltip: {
                                callbacks: {
                                    label: (context) => {
                                        const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                        const percentage = ((context.raw / total) * 100).toFixed(1);
                                        return `${context.label}: ${this.formatCurrency(context.raw)} (${percentage}%)`;
                                    }
                                }
                            }
                        }
                    }
                };

            default:
                return this.getChartConfig('line', data);
        }
    }

    switchChart(type) {
        if (type === this.currentChartType) return;

        this.currentChartType = type;
        
        // Update button states
        document.querySelectorAll('.chart-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-chart="${type}"]`).classList.add('active');

        this.updateChart();
    }

    destroyChart() {
        if (this.chart) {
            this.chart.destroy();
            this.chart = null;
        }
    }

    showSections() {
        document.getElementById('results-container').classList.remove('hidden');
        document.getElementById('chart-container').classList.remove('hidden');
        document.getElementById('export-container').classList.remove('hidden');

        // Smooth scroll to results
        document.getElementById('results-container').scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
        });
    }

    reset() {
        // Clear all inputs
        document.querySelectorAll('input').forEach(input => {
            if (input.type === 'number') {
                input.value = '';
            }
            this.clearValidationError(input);
        });

        // Reset selects to default values
        document.getElementById('contribution-frequency').value = '12';
        document.getElementById('compound-frequency').value = '12';
        document.getElementById('inflation-rate').value = '3';
        document.getElementById('currency').value = 'USD';
        this.changeCurrency('USD');

        // Hide result sections
        document.getElementById('results-container').classList.add('hidden');
        document.getElementById('chart-container').classList.add('hidden');
        document.getElementById('export-container').classList.add('hidden');

        // Destroy chart
        this.destroyChart();

        // Clear calculation data
        this.calculationData = null;

        // Clear URL
        window.history.replaceState({}, document.title, window.location.pathname);

        this.showNotification('Form reset successfully', 'info');
    }

    exportPDF() {
        if (!this.calculationData) {
            this.showNotification('No data to export. Please calculate first.', 'warning');
            return;
        }

        try {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            // Title
            doc.setFontSize(20);
            doc.text('Compound Interest Calculation Report', 20, 30);
            
            // Date
            doc.setFontSize(12);
            doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 45);
            
            // Input parameters
            doc.setFontSize(14);
            doc.text('Input Parameters:', 20, 65);
            doc.setFontSize(10);
            const params = [
                `Initial Investment: ${this.formatCurrency(this.calculationData.inputData.principal)}`,
                `Regular Contribution: ${this.formatCurrency(this.calculationData.inputData.contribution)}`,
                `Investment Period: ${this.calculationData.inputData.years} years`,
                `Annual Interest Rate: ${this.calculationData.inputData.interestRate}%`,
                `Compound Frequency: ${this.getFrequencyText(this.calculationData.inputData.compoundFrequency)}`,
                `Inflation Rate: ${this.calculationData.inputData.inflationRate}%`
            ];
            
            params.forEach((param, index) => {
                doc.text(param, 25, 75 + (index * 8));
            });
            
            // Results
            doc.setFontSize(14);
            doc.text('Results:', 20, 135);
            doc.setFontSize(10);
            const results = [
                `Final Amount: ${this.formatCurrency(this.calculationData.finalAmount)}`,
                `Total Contributions: ${this.formatCurrency(this.calculationData.totalContributions)}`,
                `Interest Earned: ${this.formatCurrency(this.calculationData.interestEarned)}`,
                `Purchasing Power (Inflation Adjusted): ${this.formatCurrency(this.calculationData.realValue)}`
            ];
            
            results.forEach((result, index) => {
                doc.text(result, 25, 145 + (index * 8));
            });

            // Goal timeline if available
            if (this.calculationData.goalTimeline && this.calculationData.inputData.targetAmount > 0) {
                doc.setFontSize(14);
                doc.text('Goal Achievement:', 20, 185);
                doc.setFontSize(10);
                doc.text(this.calculationData.goalTimeline.message, 25, 195);
            }
            
            doc.save('compound-interest-report.pdf');
            this.showNotification('PDF exported successfully!', 'success');
            
        } catch (error) {
            console.error('PDF export error:', error);
            this.showNotification('Error exporting PDF. Please try again.', 'error');
        }
    }

    exportCSV() {
        if (!this.calculationData) {
            this.showNotification('No data to export. Please calculate first.', 'warning');
            return;
        }

        try {
            const csvData = this.calculationData.yearlyBreakdown;
            const headers = ['Year', 'Balance', 'Total Contributions', 'Interest Earned', 'Real Value (Inflation Adjusted)'];
            const csvContent = [
                headers.join(','),
                ...csvData.map(row => [
                    row.year,
                    row.balance.toFixed(2),
                    row.contributions.toFixed(2),
                    row.interest.toFixed(2),
                    row.realValue.toFixed(2)
                ].join(','))
            ].join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', 'compound-interest-breakdown.csv');
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            this.showNotification('CSV exported successfully!', 'success');
            
        } catch (error) {
            console.error('CSV export error:', error);
            this.showNotification('Error exporting CSV. Please try again.', 'error');
        }
    }

    shareLink() {
        const url = window.location.href;
        
        if (navigator.share) {
            navigator.share({
                title: 'Compound Interest Calculator Results',
                url: url
            }).then(() => {
                this.showNotification('Link shared successfully!', 'success');
            }).catch(() => {
                this.copyToClipboard(url);
            });
        } else {
            this.copyToClipboard(url);
        }
    }

    copyToClipboard(text) {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text).then(() => {
                this.showNotification('Link copied to clipboard!', 'success');
            }).catch(() => {
                this.fallbackCopyToClipboard(text);
            });
        } else {
            this.fallbackCopyToClipboard(text);
        }
    }

    fallbackCopyToClipboard(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            document.execCommand('copy');
            this.showNotification('Link copied to clipboard!', 'success');
        } catch (err) {
            this.showNotification('Unable to copy link. Please copy the URL manually.', 'warning');
        }
        
        document.body.removeChild(textArea);
    }

    updateURL(data) {
        const params = new URLSearchParams();
        Object.entries(data).forEach(([key, value]) => {
            if (value) params.set(key, value);
        });
        
        const newUrl = `${window.location.pathname}?${params.toString()}`;
        window.history.pushState(data, '', newUrl);
    }

    loadFromURL() {
        const params = new URLSearchParams(window.location.search);
        
        if (params.has('principal')) {
            document.getElementById('starting-balance').value = params.get('principal');
        }
        if (params.has('contribution')) {
            document.getElementById('contribution').value = params.get('contribution');
        }
        if (params.has('contributionFrequency')) {
            document.getElementById('contribution-frequency').value = params.get('contributionFrequency');
        }
        if (params.has('years')) {
            document.getElementById('years').value = params.get('years');
        }
        if (params.has('interestRate')) {
            document.getElementById('interest-rate').value = params.get('interestRate');
        }
        if (params.has('compoundFrequency')) {
            document.getElementById('compound-frequency').value = params.get('compoundFrequency');
        }
        if (params.has('inflationRate')) {
            document.getElementById('inflation-rate').value = params.get('inflationRate');
        }
        if (params.has('targetAmount')) {
            document.getElementById('target-amount').value = params.get('targetAmount');
        }
        if (params.has('currency')) {
            const currency = params.get('currency');
            if (this.currencyConfig[currency]) {
                document.getElementById('currency').value = currency;
                this.changeCurrency(currency);
            }
        }

        // Auto-calculate if valid data is loaded
        if (params.has('principal') && params.has('years') && params.has('interestRate')) {
            setTimeout(() => this.calculate(), 100);
        }
    }

    showLoading(show) {
        const button = document.getElementById('calculate-button');
        if (show) {
            button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Calculating...';
            button.disabled = true;
            button.classList.add('loading');
        } else {
            button.innerHTML = '<i class="fas fa-calculator"></i> Calculate';
            button.disabled = false;
            button.classList.remove('loading');
        }
    }

    showNotification(message, type = 'info') {
        // Remove existing notifications
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(n => n.remove());

        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--white);
            color: var(--gray-800);
            padding: var(--spacing-md) var(--spacing-lg);
            border-radius: var(--radius-lg);
            box-shadow: var(--shadow-lg);
            border-left: 4px solid var(--${type === 'error' ? 'error' : type === 'success' ? 'success' : type === 'warning' ? 'warning' : 'info'}-color);
            z-index: var(--z-tooltip);
            max-width: 300px;
            animation: slideInRight 0.3s ease-out;
            transition: all var(--transition-normal);
        `;

        const icon = type === 'error' ? 'fa-exclamation-circle' : 
                    type === 'success' ? 'fa-check-circle' : 
                    type === 'warning' ? 'fa-exclamation-triangle' : 'fa-info-circle';

        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: var(--spacing-sm);">
                <i class="fas ${icon}"></i>
                <span>${message}</span>
            </div>
        `;

        document.body.appendChild(notification);

        // Auto-remove after 4 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            notification.style.opacity = '0';
            setTimeout(() => notification.remove(), 300);
        }, 4000);
    }

    formatCurrency(amount, showCents = true) {
        if (isNaN(amount)) {
            const currency = this.currencyConfig[this.currentCurrency];
            return `${currency.symbol}0`;
        }
        
        const currency = this.currencyConfig[this.currentCurrency];
        const decimals = showCents ? currency.decimals : 0;
        
        try {
            const formatter = new Intl.NumberFormat(currency.locale, {
                style: 'currency',
                currency: currency.code,
                minimumFractionDigits: decimals,
                maximumFractionDigits: decimals
            });
            
            return formatter.format(amount);
        } catch (error) {
            // Fallback formatting if locale is not supported
            const formattedNumber = amount.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
            return `${currency.symbol}${formattedNumber}`;
        }
    }

    getFrequencyText(frequency) {
        const frequencies = {
            1: 'Annually',
            2: 'Semi-annually',
            4: 'Quarterly',
            12: 'Monthly',
            52: 'Weekly',
            365: 'Daily'
        };
        return frequencies[frequency] || 'Custom';
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

// Add custom CSS for notifications animation
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);

// Initialize the calculator when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.calculator = new CompoundInterestCalculator();
});

// Handle page visibility change to pause/resume any animations
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        document.body.style.animationPlayState = 'paused';
    } else {
        document.body.style.animationPlayState = 'running';
    }
});

