/**
 * FLOW MANAGER
 * The Central Brain for FluxGate v2
 * 
 * Responsibility:
 * 1. Reads current Job Data.
 * 2. Determines the single valid step based on timestamps.
 * 3. Enforces that step by showing only the relevant section.
 * 4. Initializes the specific controller for that section.
 * 
 * Logic:
 * - Contract Signed? No -> SHOW CONTRACT
 * - Invoice Viewed? No -> SHOW INVOICE (Payment 1 Context)
 * - Payment 1 Pending? Yes -> SHOW PAYMENT 1 CHECKOUT
 * - Balance Viewed? No (and total > 1) -> SHOW INVOICE (Payment 2 Context)
 * - Payment 2 Pending? Yes (and total > 1) -> SHOW PAYMENT 2 CHECKOUT
 * - Else -> SHOW COMPLETION
 */

(function () {
    'use strict';

    const SECTIONS = {
        CONTRACT: 'contract',
        INVOICE: 'invoice',
        PAYMENT_1: 'payment-1',
        PAYMENT_2: 'payment-2',
        COMPLETION: 'completion'
    };

    /**
     * Get Job Data from Session
     */
    function getJobData() {
        const str = sessionStorage.getItem('jobData');
        return str ? JSON.parse(str) : null;
    }

    /**
     * Determine Current Step
     */
    function determineStep(jobData) {
        if (!jobData) return SECTIONS.CONTRACT; // Default fail-safe

        const state = jobData.state || {};
        const clientStatus = state.client_status || {};
        const product = jobData.product || {};
        
        // Check timestamps (existence = done)
        const hasSigned = !!clientStatus.contract_signed;
        // const hasInvoiceViewed = !!clientStatus.invoice; // v4.4: Use 'invoice' for Pay1 view
        // const hasPay1 = !!clientStatus.payment_1;
        // const hasBalanceViewed = !!clientStatus.balance; // v4.4: Use 'balance' for Pay2 view
        // const hasPay2 = !!clientStatus.payment_2;

        // Note: We trust the timestamp. If it's there, that step is done.
        
        // 1. Contract
        if (!hasSigned) return SECTIONS.CONTRACT;

        // 2. Invoice View (Pre-Payment 1)
        // Check if invoice viewed. 
        // Logic: active invoice view is needed if we haven't paid #1 yet AND haven't viewed it yet.
        // Actually, logic is: If not paid #1, we are in "Payment 1 Phase".
        // Inside Pay 1 Phase: Have we acknowledged the invoice?
        if (!clientStatus.payment_1) {
            if (!clientStatus.invoice) return SECTIONS.INVOICE; // Show Invoice View
            return SECTIONS.PAYMENT_1; // Show Checkout
        }

        // 3. Payment 2 Phase (if applicable)
        const totalPayments = product.total_payments || 1;
        // If price2 exists and has ID, treat as 2 payments
        const hasPrice2 = !!(jobData.price2 && jobData.price2.id);
        const isMultiPayment = totalPayments > 1 || hasPrice2;

        if (isMultiPayment && !clientStatus.payment_2) {
             if (!clientStatus.balance) return SECTIONS.INVOICE; // Show Balance View (reusing invoice section)
             return SECTIONS.PAYMENT_2; // Show Checkout
        }

        // 4. Completion
        return SECTIONS.COMPLETION;
    }

    /**
     * Render the State
     */
    function render(forceStep = null) {
        const jobData = getJobData();
        if (!jobData) return;

        const currentStep = forceStep || determineStep(jobData);
        console.log('FlowManager: Active Step', currentStep);

        // 1. Hide All Sections
        document.querySelectorAll('.job-section').forEach(el => el.classList.add('hidden'));

        // 2. Show Active Section
        // Note: Invoice section is shared for both Invoice and Balance view
        let sectionId = currentStep;
        if (currentStep === SECTIONS.INVOICE) {
            // It uses the same #invoice ID in DOM
            sectionId = 'invoice';
        }
        
        const activeEl = document.getElementById(sectionId);
        if (activeEl) {
            activeEl.classList.remove('hidden');
            window.scrollTo(0, 0);
        }

        // 3. Initialize Controller for this step
        // We pass specific flags to controllers so they know what context they are in
        switch (currentStep) {
            case SECTIONS.CONTRACT:
                if (window.ContractController) window.ContractController.init();
                break;
            case SECTIONS.INVOICE:
                // Determine if this is Initial Invoice (1) or Balance (2)
                // If payment_1 is done, it's Balance.
                const isBalance = !!(jobData.state?.client_status?.payment_1);
                const paymentNum = isBalance ? 2 : 1;
                if (window.InvoiceController) window.InvoiceController.init(paymentNum);
                break;
            case SECTIONS.PAYMENT_1:
                if (window.CheckoutController) window.CheckoutController.init(1);
                break;
            case SECTIONS.PAYMENT_2:
                if (window.CheckoutController) window.CheckoutController.init(2);
                break;
            case SECTIONS.COMPLETION:
                if (window.CompletionController) window.CompletionController.init();
                break;
        }
    }

    /**
     * Update State & Refresh
     * Call this from controllers when an action completes (e.g. Signed, Proceed Clicked)
     */
    function updateState(key, value = new Date().toISOString()) {
        const jobData = getJobData();
        if (!jobData) return;
        
        if (!jobData.state) jobData.state = {};
        if (!jobData.state.client_status) jobData.state.client_status = {};

        jobData.state.client_status[key] = value;
        
        sessionStorage.setItem('jobData', JSON.stringify(jobData));
        render(); // Re-evaluate and render next step
    }

    // Export
    window.FlowManager = {
        init: () => render(),
        refresh: () => render(),
        updateState,
        getJobData
    };

    // Auto-init on load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => render());
    } else {
        render();
    }

})();
