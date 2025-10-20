// File: 04-core-code/ui/ui-manager.js

import { TableComponent } from './table-component.js';
import { SummaryComponent } from './summary-component.js';
import { PanelComponent } from './panel-component.js';
import { NotificationComponent } from './notification-component.js';
import { DialogComponent } from './dialog-component.js';
import { DOM_IDS, EVENTS } from '../config/constants.js';

/**
 * @fileoverview Manages all UI components and their rendering based on state changes.
 * Acts as the central hub for UI updates.
 */
export class UIManager {
    constructor({
        appElement,
        eventAggregator,
        calculationService,
        rightPanelComponent,
        quotePreviewComponent,
        leftPanelComponent, // [MODIFIED] Receive an already instantiated component
    }) {
        this.appElement = appElement;
        this.eventAggregator = eventAggregator;
        this.calculationService = calculationService;

        // --- Child Component Management ---
        this.tableComponent = new TableComponent(
            document.getElementById(DOM_IDS.RESULTS_TABLE)
        );
        this.summaryComponent = new SummaryComponent(
            document.getElementById(DOM_IDS.TOTAL_SUM_VALUE)
        );
        // [MODIFIED] Assign the received instance directly
        this.leftPanelComponent = leftPanelComponent;
        this.rightPanelComponent = rightPanelComponent;

        // [FIX] Correctly instantiate PanelComponent for the numeric keyboard
        this.numericKeyboardPanel = new PanelComponent({
            panelElement: document.getElementById(DOM_IDS.NUMERIC_KEYBOARD_PANEL),
            toggleElement: document.getElementById(DOM_IDS.PANEL_TOGGLE),
            eventAggregator: this.eventAggregator,
            expandedClass: 'is-collapsed', // This class is toggled to show/hide
        });

        this.notificationComponent = new NotificationComponent({
            containerElement: document.getElementById(DOM_IDS.TOAST_CONTAINER),
            eventAggregator,
        });
        this.dialogComponent = new DialogComponent(
            document.getElementById(DOM_IDS.CONFIRMATION_DIALOG_OVERLAY),
            eventAggregator
        );
        this.quotePreviewComponent = quotePreviewComponent;

        // [REMOVED] Subscription is no longer needed as PanelComponent handles its own toggle.
    }

    render(state) {
        // Delegate rendering to child components
        this.tableComponent.render(state);

        // [MODIFIED] Pass only the necessary state parts to child components
        const currentProductData = state.quoteData.products[state.quoteData.currentProduct];
        this.summaryComponent.render(currentProductData.summary, state.ui.isSumOutdated);

        this.leftPanelComponent.render(state);
        this.rightPanelComponent.render(state);

        // [REMOVED] PanelComponent does not have a render method. It manages its own visibility.
    }

    // [REMOVED] This method is no longer needed as PanelComponent is self-managed.
}