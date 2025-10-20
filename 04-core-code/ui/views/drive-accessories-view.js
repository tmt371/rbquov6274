// File: 04-core-code/ui/views/drive-accessories-view.js

import { EVENTS, DOM_IDS } from '../../config/constants.js';
import * as uiActions from '../../actions/ui-actions.js';
import * as quoteActions from '../../actions/quote-actions.js';

/**
 * @fileoverview A dedicated sub-view for handling all logic related to the Drive/Accessories tab.
 */
export class DriveAccessoriesView {
    constructor({ stateService, calculationService, eventAggregator }) {
        this.stateService = stateService;
        this.calculationService = calculationService;
        this.eventAggregator = eventAggregator;

        // Cache DOM elements
        this.winderDisplay = document.getElementById('k5-display-winder');
        this.motorDisplay = document.getElementById('k5-display-motor');
        this.remoteDisplay = document.getElementById('k5-display-remote');
        this.chargerDisplay = document.getElementById('k5-display-charger');
        this.cordDisplay = document.getElementById('k5-display-cord');
        this.totalDisplay = document.getElementById('k5-display-total');
        this.remoteCountDisplay = document.getElementById('k5-display-remote-count');
        this.chargerCountDisplay = document.getElementById('k5-display-charger-count');
        this.cordCountDisplay = document.getElementById('k5-display-cord-count');
        this.remoteAddBtn = document.getElementById('btn-k5-remote-add');
        this.remoteSubtractBtn = document.getElementById('btn-k5-remote-subtract');
        this.chargerAddBtn = document.getElementById('btn-k5-charger-add');
        this.chargerSubtractBtn = document.getElementById('btn-k5-charger-subtract');
        this.cordAddBtn = document.getElementById('btn-k5-cord-add');
        this.cordSubtractBtn = document.getElementById('btn-k5-cord-subtract');

        console.log("DriveAccessoriesView Initialized.");
    }

    /**
     * [NEW] Renders the UI elements specific to the K4 view.
     * @param {object} state The full application state.
     */
    render(state) {
        const { driveAccessoryMode, driveWinderTotalPrice, driveMotorTotalPrice, driveRemoteTotalPrice, driveChargerTotalPrice, driveCordTotalPrice, driveGrandTotal, driveRemoteCount, driveChargerCount, driveCordCount } = state.ui;

        // Update mode button active states
        document.getElementById('btn-k5-winder')?.classList.toggle('active', driveAccessoryMode === 'winder');
        document.getElementById('btn-k5-motor')?.classList.toggle('active', driveAccessoryMode === 'motor');
        document.getElementById('btn-k5-remote')?.classList.toggle('active', driveAccessoryMode === 'remote');
        document.getElementById('btn-k5-charger')?.classList.toggle('active', driveAccessoryMode === 'charger');
        document.getElementById('btn-k5-3m-cord')?.classList.toggle('active', driveAccessoryMode === 'cord');

        // Update display boxes
        const formatPrice = (price) => price ? `$${price.toFixed(2)}` : '';
        if (this.winderDisplay) this.winderDisplay.value = formatPrice(driveWinderTotalPrice);
        if (this.motorDisplay) this.motorDisplay.value = formatPrice(driveMotorTotalPrice);
        if (this.remoteDisplay) this.remoteDisplay.value = formatPrice(driveRemoteTotalPrice);
        if (this.chargerDisplay) this.chargerDisplay.value = formatPrice(driveChargerTotalPrice);
        if (this.cordDisplay) this.cordDisplay.value = formatPrice(driveCordTotalPrice);
        if (this.totalDisplay) this.totalDisplay.value = formatPrice(driveGrandTotal);

        // Update counters
        if (this.remoteCountDisplay) this.remoteCountDisplay.value = driveRemoteCount || 0;
        if (this.chargerCountDisplay) this.chargerCountDisplay.value = driveChargerCount || 0;
        if (this.cordCountDisplay) this.cordCountDisplay.value = driveCordCount || 0;

        // Update counter button disabled states
        const isRemoteMode = driveAccessoryMode === 'remote';
        const isChargerMode = driveAccessoryMode === 'charger';
        const isCordMode = driveAccessoryMode === 'cord';

        if (this.remoteAddBtn) this.remoteAddBtn.disabled = !isRemoteMode;
        if (this.remoteSubtractBtn) this.remoteSubtractBtn.disabled = !isRemoteMode;
        if (this.chargerAddBtn) this.chargerAddBtn.disabled = !isChargerMode;
        if (this.chargerSubtractBtn) this.chargerSubtractBtn.disabled = !isChargerMode;
        if (this.cordAddBtn) this.cordAddBtn.disabled = !isCordMode;
        if (this.cordSubtractBtn) this.cordSubtractBtn.disabled = !isCordMode;
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

    activate() {
        this.stateService.dispatch(uiActions.setVisibleColumns(['sequence', 'fabricTypeDisplay', 'location', 'winder', 'motor']));
    }

    handleModeChange({ mode }) {
        const { ui } = this._getState();
        const currentMode = ui.driveAccessoryMode;
        const newMode = currentMode === mode ? null : mode;

        if (currentMode) {
            this.recalculateAllDriveAccessoryPrices();
        }

        this.stateService.dispatch(uiActions.setDriveAccessoryMode(newMode));

        if (newMode) {
            if (newMode === 'remote' || newMode === 'charger') {
                const items = this._getItems();
                const hasMotor = items.some(item => !!item.motor);
                const currentCount = newMode === 'remote' ? ui.driveRemoteCount : ui.driveChargerCount;

                if (hasMotor && (currentCount === 0 || currentCount === null)) {
                    this.stateService.dispatch(uiActions.setDriveAccessoryCount(newMode, 1));
                }
            }

            const message = this._getHintMessage(newMode);
            this.eventAggregator.publish(EVENTS.SHOW_NOTIFICATION, { message });
        }
    }

    handleTableCellClick({ rowIndex, column }) {
        const { ui } = this._getState();
        const { driveAccessoryMode } = ui;
        if (!driveAccessoryMode || (column !== 'winder' && column !== 'motor')) return;

        const item = this._getItems()[rowIndex];
        if (!item) return;

        const isActivatingWinder = driveAccessoryMode === 'winder' && column === 'winder';
        const isActivatingMotor = driveAccessoryMode === 'motor' && column === 'motor';

        if (isActivatingWinder) {
            if (item.motor) {
                this.eventAggregator.publish(EVENTS.SHOW_CONFIRMATION_DIALOG, {
                    message: 'This blind is set to Motor. Are you sure you want to change it to HD Winder?',
                    layout: [
                        [
                            { type: 'button', text: 'Confirm', callback: () => this._toggleWinder(rowIndex, true) },
                            { type: 'button', text: 'Cancel', className: 'secondary', callback: () => { } }
                        ]
                    ]
                });
            } else {
                this._toggleWinder(rowIndex, false);
            }
        } else if (isActivatingMotor) {
            if (item.winder) {
                this.eventAggregator.publish(EVENTS.SHOW_CONFIRMATION_DIALOG, {
                    message: 'This blind is set to HD Winder. Are you sure you want to change it to Motor?',
                    layout: [
                        [
                            { type: 'button', text: 'Confirm', callback: () => this._toggleMotor(rowIndex, true) },
                            { type: 'button', text: 'Cancel', className: 'secondary', callback: () => { } }
                        ]
                    ]
                });
            } else {
                this._toggleMotor(rowIndex, false);
            }
        }
    }

    handleCounterChange({ accessory, direction }) {
        const { ui } = this._getState();
        const counts = {
            remote: ui.driveRemoteCount,
            charger: ui.driveChargerCount,
            cord: ui.driveCordCount
        };
        let currentCount = counts[accessory];
        const newCount = direction === 'add' ? currentCount + 1 : Math.max(0, currentCount - 1);

        if (newCount === 0) {
            const items = this._getItems();
            const hasMotor = items.some(item => !!item.motor);
            if (hasMotor && (accessory === 'remote' || accessory === 'charger')) {
                const accessoryName = accessory === 'remote' ? 'Remote' : 'Charger';
                this.eventAggregator.publish(EVENTS.SHOW_CONFIRMATION_DIALOG, {
                    message: `Motors are present in the quote. Are you sure you want to set the ${accessoryName} quantity to 0?`,
                    layout: [
                        [
                            {
                                type: 'button', text: 'Confirm', callback: () => {
                                    this.stateService.dispatch(uiActions.setDriveAccessoryCount(accessory, 0));
                                }
                            },
                            { type: 'button', text: 'Cancel', className: 'secondary', callback: () => { } }
                        ]
                    ]
                });
                return;
            }
        }

        this.stateService.dispatch(uiActions.setDriveAccessoryCount(accessory, newCount));
    }

    _toggleWinder(rowIndex) {
        const item = this._getItems()[rowIndex];
        const newValue = item.winder ? '' : 'HD';
        this.stateService.dispatch(quoteActions.updateWinderMotorProperty(rowIndex, 'winder', newValue));
    }

    _toggleMotor(rowIndex) {
        const item = this._getItems()[rowIndex];
        const newValue = item.motor ? '' : 'Motor';
        this.stateService.dispatch(quoteActions.updateWinderMotorProperty(rowIndex, 'motor', newValue));
    }

    recalculateAllDriveAccessoryPrices() {
        const items = this._getItems();
        const state = this._getState().ui;
        const productType = this._getCurrentProductType();
        const summaryData = {};
        let grandTotal = 0;

        const winderCount = items.filter(item => item.winder === 'HD').length;
        const winderPrice = this.calculationService.calculateAccessorySalePrice(productType, 'winder', { count: winderCount });
        this.stateService.dispatch(uiActions.setDriveAccessoryTotalPrice('winder', winderPrice));
        summaryData.winder = { count: winderCount, price: winderPrice };
        grandTotal += winderPrice;

        const motorCount = items.filter(item => !!item.motor).length;
        const motorPrice = this.calculationService.calculateAccessorySalePrice(productType, 'motor', { count: motorCount });
        this.stateService.dispatch(uiActions.setDriveAccessoryTotalPrice('motor', motorPrice));
        summaryData.motor = { count: motorCount, price: motorPrice };
        grandTotal += motorPrice;

        const remoteCount = state.driveRemoteCount;
        const remotePrice = this.calculationService.calculateAccessorySalePrice(productType, 'remote', {
            count: remoteCount
        });
        this.stateService.dispatch(uiActions.setDriveAccessoryTotalPrice('remote', remotePrice));
        summaryData.remote = { type: 'standard', count: remoteCount, price: remotePrice };
        grandTotal += remotePrice;

        const chargerCount = state.driveChargerCount;
        const chargerPrice = this.calculationService.calculateAccessorySalePrice(productType, 'charger', { count: chargerCount });
        this.stateService.dispatch(uiActions.setDriveAccessoryTotalPrice('charger', chargerPrice));
        summaryData.charger = { count: chargerCount, price: chargerPrice };
        grandTotal += chargerPrice;

        const cordCount = state.driveCordCount;
        const cordPrice = this.calculationService.calculateAccessorySalePrice(productType, 'cord', { count: cordCount });
        this.stateService.dispatch(uiActions.setDriveAccessoryTotalPrice('cord', cordPrice));
        summaryData.cord3m = { count: cordCount, price: cordPrice };
        grandTotal += cordPrice;

        this.stateService.dispatch(uiActions.setDriveGrandTotal(grandTotal));
        this.stateService.dispatch(quoteActions.updateAccessorySummary({
            winderCostSum: winderPrice,
            motorCostSum: motorPrice,
            remoteCostSum: remotePrice,
            chargerCostSum: chargerPrice,
            cordCostSum: cordPrice
        }));
    }

    _getHintMessage(mode) {
        const hints = {
            winder: 'Click a cell under the Winder column to set HD.',
            motor: 'Click a cell under the Motor column to set Motor.',
            remote: 'Click + or - to increase or decrease the quantity of remotes.',
            charger: 'Click + or - to increase or decrease the quantity of chargers.',
            cord: 'Click + or - to increase or decrease the quantity of extension cords.'
        };
        return hints[mode] || 'Please make your selection.';
    }
}