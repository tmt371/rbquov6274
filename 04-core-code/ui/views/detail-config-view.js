// File: 04-core-code/ui/views/detail-config-view.js

/**
 * @fileoverview A "Manager" view that delegates logic and rendering to specific sub-views for each tab.
 */

export class DetailConfigView {
    constructor({
        stateService,
        eventAggregator,
        // Sub-views are injected here
        k1LocationView,
        k2FabricView,
        k3OptionsView,
        driveAccessoriesView,
        dualChainView
    }) {
        this.stateService = stateService;
        this.eventAggregator = eventAggregator;

        // Store instances of sub-views
        this.views = {
            'k1-tab': k1LocationView,
            'k2-tab': k2FabricView,
            'k3-tab': k3OptionsView,
            'k4-tab': driveAccessoriesView,
            'k5-tab': dualChainView,
        };

        console.log("DetailConfigView Refactored as a Manager View.");
    }

    /**
     * [NEW] Renders the content for the currently active tab by delegating to the appropriate sub-view.
     * @param {object} state The full application state.
     */
    render(state) {
        const activeTabId = state.ui.activeTabId;
        const activeView = this.views[activeTabId];

        // Also manage which tab content is visible
        const tabContents = document.querySelectorAll('#left-panel .tab-content');
        tabContents.forEach(content => {
            const contentTabId = content.id.replace('-content', '-tab');
            content.classList.toggle('active', contentTabId === activeTabId);
        });

        if (activeView && typeof activeView.render === 'function') {
            activeView.render(state);
        }
    }

    activateTab(tabId) {
        this.stateService.dispatch({ type: 'ui/setActiveTab', payload: { tabId } });

        const activeView = this.views[tabId];
        if (activeView && typeof activeView.activate === 'function') {
            activeView.activate();
        }
    }

    // --- Event Handlers that delegate to sub-views ---

    handleFocusModeRequest({ column }) {
        if (column === 'location') {
            this.views['k1-tab'].handleFocusModeRequest();
            return;
        }
        if (column === 'fabric') {
            this.views['k2-tab'].handleFocusModeRequest();
            return;
        }
    }

    handleLocationInputEnter({ value }) {
        this.views['k1-tab'].handleLocationInputEnter({ value });
    }

    handlePanelInputBlur({ type, field, value }) {
        this.views['k2-tab'].handlePanelInputBlur({ type, field, value });
    }

    handlePanelInputEnter() {
        this.views['k2-tab'].handlePanelInputEnter();
    }

    handleSequenceCellClick({ rowIndex }) {
        const { ui } = this.stateService.getState();
        const { activeEditMode } = ui;
        if (activeEditMode === 'K2_LF_SELECT' || activeEditMode === 'K2_LF_DELETE_SELECT') {
            this.views['k2-tab'].handleSequenceCellClick({ rowIndex });
        }
    }

    handleLFEditRequest() {
        this.views['k2-tab'].handleLFEditRequest();
    }

    handleLFDeleteRequest() {
        this.views['k2-tab'].handleLFDeleteRequest();
    }

    handleToggleK3EditMode() {
        this.views['k3-tab'].handleToggleK3EditMode();
    }

    handleBatchCycle({ column }) {
        this.views['k3-tab'].handleBatchCycle({ column });
    }

    handleDualChainModeChange({ mode }) {
        this.views['k5-tab'].handleModeChange({ mode });
    }

    handleChainEnterPressed({ value }) {
        this.views['k5-tab'].handleChainEnterPressed({ value });
    }

    handleDriveModeChange({ mode }) {
        this.views['k4-tab'].handleModeChange({ mode });
    }

    handleAccessoryCounterChange({ accessory, direction }) {
        this.views['k4-tab'].handleCounterChange({ accessory, direction });
    }

    handleTableCellClick({ rowIndex, column }) {
        const { ui } = this.stateService.getState();
        const { activeEditMode, dualChainMode, driveAccessoryMode } = ui;

        if (driveAccessoryMode) {
            this.views['k4-tab'].handleTableCellClick({ rowIndex, column });
            return;
        }

        if (activeEditMode === 'K1') {
            this.views['k1-tab'].handleTableCellClick({ rowIndex });
            return;
        }

        if (activeEditMode === 'K3') {
            this.views['k3-tab'].handleTableCellClick({ rowIndex, column });
            return;
        }

        if (dualChainMode) {
            this.views['k5-tab'].handleTableCellClick({ rowIndex, column });
            return;
        }
    }
}