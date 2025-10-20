// File: 04-core-code/ui/views/k1-location-view.js
import * as uiActions from '../../actions/ui-actions.js';
import * as quoteActions from '../../actions/quote-actions.js';
import { DOM_IDS } from '../../config/constants.js';

/**
 * @fileoverview A dedicated sub-view for handling all logic related to the K1 (Location) tab.
 */
export class K1LocationView {
    constructor({ stateService }) {
        this.stateService = stateService;
        this.locationInput = document.getElementById(DOM_IDS.LOCATION_INPUT_BOX);
        console.log("K1LocationView Initialized.");
    }

    _getItems() {
        const { quoteData } = this.stateService.getState();
        return quoteData.products[quoteData.currentProduct].items;
    }

    /**
     * [NEW] Renders the UI elements specific to the K1 view.
     * @param {object} state The full application state.
     */
    render(state) {
        if (!this.locationInput) return;

        const { activeEditMode, targetCell, locationInputValue } = state.ui;

        const isK1EditMode = activeEditMode === 'K1';
        this.locationInput.disabled = !isK1EditMode;

        if (isK1EditMode && document.activeElement !== this.locationInput) {
            this.locationInput.value = locationInputValue || '';
        }

        this.locationInput.classList.toggle('active', isK1EditMode);

        // This function doesn't need to return anything. It modifies the DOM directly.
    }


    /**
     * Handles the request to enter or exit the location editing mode.
     * This is typically triggered by the '#Location' button.
     */
    handleFocusModeRequest() {
        const { ui } = this.stateService.getState();
        const currentMode = ui.activeEditMode;
        const newMode = currentMode === 'K1' ? null : 'K1';
        this._toggleLocationEditMode(newMode);
    }

    /**
     * Toggles the UI state for K1's location editing mode.
     * @param {string|null} newMode - The new mode ('K1' or null).
     * @private
     */
    _toggleLocationEditMode(newMode) {
        this.stateService.dispatch(uiActions.setActiveEditMode(newMode));

        if (newMode) {
            const targetRow = 0;
            this.stateService.dispatch(uiActions.setTargetCell({ rowIndex: targetRow, column: 'location' }));

            const currentItem = this._getItems()[targetRow];
            this.stateService.dispatch(uiActions.setLocationInputValue(currentItem.location || ''));

            setTimeout(() => {
                this.locationInput?.focus();
                this.locationInput?.select();
            }, 50);
        } else {
            this.stateService.dispatch(uiActions.setTargetCell(null));
            this.stateService.dispatch(uiActions.setLocationInputValue(''));
        }
    }

    /**
     * Handles the Enter key press in the location input box.
     * @param {object} data - The event data containing the value.
     */
    handleLocationInputEnter({ value }) {
        const { ui } = this.stateService.getState();
        const { targetCell } = ui;
        if (!targetCell) return;

        this.stateService.dispatch(quoteActions.updateItemProperty(targetCell.rowIndex, targetCell.column, value));

        const nextRowIndex = targetCell.rowIndex + 1;
        const totalRows = this._getItems().length;

        // Move to the next row if it's not the last empty row
        if (nextRowIndex < totalRows - 1) {
            this.stateService.dispatch(uiActions.setTargetCell({ rowIndex: nextRowIndex, column: 'location' }));
            const nextItem = this._getItems()[nextRowIndex];
            this.stateService.dispatch(uiActions.setLocationInputValue(nextItem.location || ''));

            // Refocus and select the input for continuous entry
            setTimeout(() => this.locationInput?.select(), 0);
        } else {
            // If it's the last row, exit the editing mode
            this._toggleLocationEditMode(null);
        }
    }

    /**
     * Handles clicks on table cells when K1 mode is active.
     * @param {object} data - The event data { rowIndex }.
     */
    handleTableCellClick({ rowIndex }) {
        // Update the target cell to the clicked row
        this.stateService.dispatch(uiActions.setTargetCell({ rowIndex, column: 'location' }));
        const item = this._getItems()[rowIndex];
        this.stateService.dispatch(uiActions.setLocationInputValue(item.location || ''));

        setTimeout(() => {
            this.locationInput?.focus();
            this.locationInput?.select();
        }, 50);
    }

    /**
     * This method is called by the main DetailConfigView when the K1 tab becomes active.
     */
    activate() {
        this.stateService.dispatch(uiActions.setVisibleColumns(['sequence', 'fabricTypeDisplay', 'location']));
    }
}