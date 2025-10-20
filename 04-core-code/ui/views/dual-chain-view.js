// File: 04-core-code/ui/views/dual-chain-view.js

import { EVENTS } from '../../config/constants.js';
import * as uiActions from '../../actions/ui-actions.js';
import * as quoteActions from '../../actions/quote-actions.js';

/**
 * @fileoverview A dedicated sub-view for handling all logic related to the Dual/Chain tab.
 */
export class DualChainView {
    constructor({ stateService, calculationService, eventAggregator }) {
        this.stateService = stateService;
        this.calculationService = calculationService;
        this.eventAggregator = eventAggregator;

        // Cache DOM elements
        this.dualButton = document.getElementById('btn-k4-dual');
        this.chainButton = document.getElementById('btn-k4-chain');
        this.dualPriceDisplay = document.getElementById('k4-dual-price-display')?.querySelector('.price-value');
        this.chainInput = document.getElementById('k4-input-display');

        this.summaryWinderPriceDisplay = document.getElementById('k5-display-winder-summary');
        this.summaryMotorPriceDisplay = document.getElementById('k5-display-motor-summary');
        this.summaryRemotePriceDisplay = document.getElementById('k5-display-remote-summary');
        this.summaryChargerPriceDisplay = document.getElementById('k5-display-charger-summary');
        this.summaryCordPriceDisplay = document.getElementById('k5-display-cord-summary');
        this.summaryAccessoriesTotalDisplay = document.getElementById('k5-display-accessories-total');

        console.log("DualChainView Initialized.");
    }

    /**
     * [NEW] Renders the UI elements specific to the K5 view.
     * @param {object} state The full application state.
     */
    render(state) {
        const { dualChainMode, dualPrice, dualChainInputValue, summaryWinderPrice, summaryMotorPrice, summaryRemotePrice, summaryChargerPrice, summaryCordPrice, summaryAccessoriesTotal } = state.ui;

        // Update mode button active states
        if (this.dualButton) this.dualButton.classList.toggle('active', dualChainMode === 'dual');
        if (this.chainButton) this.chainButton.classList.toggle('active', dualChainMode === 'chain');

        // Update display boxes
        const formatPrice = (price) => price ? `$${price.toFixed(2)}` : '';
        if (this.dualPriceDisplay) this.dualPriceDisplay.textContent = formatPrice(dualPrice);

        // Update chain input
        if (this.chainInput) {
            this.chainInput.disabled = dualChainMode !== 'chain';
            this.chainInput.classList.toggle('active', dualChainMode === 'chain');
            if (document.activeElement !== this.chainInput) {
                this.chainInput.value = dualChainInputValue || '';
            }
        }

        // Update summary display boxes
        if (this.summaryWinderPriceDisplay) this.summaryWinderPriceDisplay.value = formatPrice(summaryWinderPrice);
        if (this.summaryMotorPriceDisplay) this.summaryMotorPriceDisplay.value = formatPrice(summaryMotorPrice);
        if (this.summaryRemotePriceDisplay) this.summaryRemotePriceDisplay.value = formatPrice(summaryRemotePrice);
        if (this.summaryChargerPriceDisplay) this.summaryChargerPriceDisplay.value = formatPrice(summaryChargerPrice);
        if (this.summaryCordPriceDisplay) this.summaryCordPriceDisplay.value = formatPrice(summaryCordPrice);
        if (this.summaryAccessoriesTotalDisplay) this.summaryAccessoriesTotalDisplay.value = formatPrice(summaryAccessoriesTotal);
    }

    _getState() {
        return this.stateService.getState();
    }

    _getItems() {
        const { quoteData } = this._getState();
        return quoteData.products[quoteData.currentProduct].items;
    }

    _getCurrentProductType() {
        const { quoteData } = this._getState();
        return quoteData.currentProduct;
    }

    /**
     * Handles the toggling of modes (dual, chain).
     * Validation now ONLY runs when EXITING dual mode.
     */
    handleModeChange({ mode }) {
        const { ui } = this._getState();
        const currentMode = ui.dualChainMode;
        const newMode = currentMode === mode ? null : mode;

        if (currentMode === 'dual') {
            const isValid = this._validateDualSelection();
            if (!isValid) {
                return;
            }
        }

        this.stateService.dispatch(uiActions.setDualChainMode(newMode));

        if (newMode === 'dual') {
            this._calculateAndStoreDualPrice();
        }

        if (!newMode) {
            this.stateService.dispatch(uiActions.setTargetCell(null));
            this.stateService.dispatch(uiActions.clearDualChainInputValue());
        }
    }

    _calculateAndStoreDualPrice() {
        const items = this._getItems();
        const productType = this._getCurrentProductType();

        const price = this.calculationService.calculateAccessorySalePrice(productType, 'dual', { items });

        this.stateService.dispatch(quoteActions.updateAccessorySummary({ dualCostSum: price }));
        this.stateService.dispatch(uiActions.setDualPrice(price));

        this._updateSummaryAccessoriesTotal();
    }

    _validateDualSelection() {
        const items = this._getItems();
        const selectedIndexes = items.reduce((acc, item, index) => {
            if (item.dual === 'D') {
                acc.push(index);
            }
            return acc;
        }, []);

        const dualCount = selectedIndexes.length;

        if (dualCount > 0 && dualCount % 2 !== 0) {
            this.eventAggregator.publish(EVENTS.SHOW_NOTIFICATION, {
                message: 'The total count of Dual Brackets (D) must be an even number. Please correct the selection.',
                type: 'error'
            });
            return false;
        }

        for (let i = 0; i < dualCount; i += 2) {
            if (selectedIndexes[i + 1] !== selectedIndexes[i] + 1) {
                this.eventAggregator.publish(EVENTS.SHOW_NOTIFICATION, {
                    message: 'Dual Brackets (D) must be set on adjacent items. Please check your selection.',
                    type: 'error'
                });
                return false;
            }
        }

        return true;
    }

    handleChainEnterPressed({ value }) {
        const { ui } = this._getState();
        const { targetCell: currentTarget } = ui;
        if (!currentTarget) return;

        const valueAsNumber = Number(value);
        if (value !== '' && (!Number.isInteger(valueAsNumber) || valueAsNumber <= 0)) {
            this.eventAggregator.publish(EVENTS.SHOW_NOTIFICATION, {
                message: 'Only positive integers are allowed.',
                type: 'error'
            });
            return;
        }

        const valueToSave = value === '' ? null : valueAsNumber;
        this.stateService.dispatch(quoteActions.updateItemProperty(currentTarget.rowIndex, currentTarget.column, valueToSave));

        this.stateService.dispatch(uiActions.setTargetCell(null));
        this.stateService.dispatch(uiActions.clearDualChainInputValue());
    }

    handleTableCellClick({ rowIndex, column }) {
        const { ui } = this._getState();
        const { dualChainMode } = ui;
        const items = this._getItems();
        const item = items[rowIndex];
        if (!item) return;

        const isLastRow = rowIndex === items.length - 1;
        if (isLastRow) return;

        if (dualChainMode === 'dual' && column === 'dual') {
            const newValue = item.dual === 'D' ? '' : 'D';
            this.stateService.dispatch(quoteActions.updateItemProperty(rowIndex, 'dual', newValue));
            this._calculateAndStoreDualPrice();
        }

        if (dualChainMode === 'chain' && column === 'chain') {
            this.stateService.dispatch(uiActions.setTargetCell({ rowIndex, column: 'chain' }));

            setTimeout(() => {
                const inputBox = document.getElementById('k4-input-display');
                inputBox?.focus();
                inputBox?.select();
            }, 50);
        }
    }

    activate() {
        this.stateService.dispatch(uiActions.setVisibleColumns(['sequence', 'fabricTypeDisplay', 'location', 'dual', 'chain']));

        const { ui, quoteData } = this._getState();
        const currentProductData = quoteData.products[quoteData.currentProduct];

        // Ensure all summary prices are correctly dispatched to the UI state
        this.stateService.dispatch(uiActions.setSummaryWinderPrice(ui.driveWinderTotalPrice));
        this.stateService.dispatch(uiActions.setSummaryMotorPrice(ui.driveMotorTotalPrice));
        this.stateService.dispatch(uiActions.setSummaryRemotePrice(ui.driveRemoteTotalPrice));
        this.stateService.dispatch(uiActions.setSummaryChargerPrice(ui.driveChargerTotalPrice));
        this.stateService.dispatch(uiActions.setSummaryCordPrice(ui.driveCordTotalPrice));
        this.stateService.dispatch(uiActions.setDualPrice(currentProductData.summary.accessories.dualCostSum));

        this._updateSummaryAccessoriesTotal();
    }

    _updateSummaryAccessoriesTotal() {
        const { ui } = this._getState();

        const dualPrice = ui.dualPrice || 0;
        const winderPrice = ui.summaryWinderPrice || 0;
        const motorPrice = ui.summaryMotorPrice || 0;
        const remotePrice = ui.summaryRemotePrice || 0;
        const chargerPrice = ui.summaryChargerPrice || 0;
        const cordPrice = ui.summaryCordPrice || 0;

        const total = dualPrice + winderPrice + motorPrice + remotePrice + chargerPrice + cordPrice;

        this.stateService.dispatch(uiActions.setSummaryAccessoriesTotal(total));
    }
}