// File: 04-core-code/ui/left-panel-component.js

import { LeftPanelInputHandler } from './left-panel-input-handler.js';
import { DOM_IDS, EVENTS } from '../config/constants.js';

/**
 * @fileoverview Manages the left-side panel, including its visibility
 * and the interactions within its various tabs (K1, K2, etc.).
 */
export class LeftPanelComponent {
    constructor({ panelElement, eventAggregator, detailConfigView }) {
        this.panelElement = panelElement;
        if (!this.panelElement) {
            throw new Error("LeftPanelComponent could not find its container element ('#left-panel') in the DOM.");
        }

        this.eventAggregator = eventAggregator;
        this.detailConfigView = detailConfigView;

        // --- DOM Element Caching ---
        this.toggleButton = document.getElementById(DOM_IDS.LEFT_PANEL_TOGGLE);
        this.content = this.panelElement.querySelector('.panel-content');
        this.tabs = this.panelElement.querySelectorAll('.tab-button');
        this.tabContents = this.panelElement.querySelectorAll('.tab-content');
        this.backButton = this.panelElement.querySelector('#back-to-grid-view');

        this._initializeEventListeners();
        console.log("LeftPanelComponent Initialized.");
    }

    _initializeEventListeners() {
        // [FIX] Add back the event listener for the back button.
        // This is crucial for returning to the main view.
        if (this.backButton) {
            this.backButton.addEventListener('click', () => {
                this.eventAggregator.publish(EVENTS.USER_NAVIGATED_TO_QUICK_QUOTE_VIEW);
                // The hide() call is handled by the render method upon state change.
            });
        }
    }

    toggle() {
        // This method is kept for direct manipulation if ever needed,
        // but is no longer the primary way to open the panel.
        this.panelElement.classList.toggle('is-open');
    }

    show() {
        this.panelElement.classList.add('is-open');
    }

    hide() {
        this.panelElement.classList.remove('is-open');
    }

    render(state) {
        const { currentView, activeTabId } = state.ui;

        // [MODIFIED] Logic is now driven by the application's central state.
        if (currentView === 'DETAIL_CONFIG') {
            this.show();
        } else {
            this.hide();
        }

        this.tabs.forEach(tab => {
            tab.classList.toggle('active', tab.id === activeTabId);
        });

        if (this.detailConfigView && typeof this.detailConfigView.render === 'function') {
            this.detailConfigView.render(state);
        }
    }
}