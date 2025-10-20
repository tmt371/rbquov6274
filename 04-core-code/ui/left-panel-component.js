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
        this.detailConfigView = detailConfigView; // This is the manager for K1, K2, etc.

        // --- DOM Element Caching ---
        this.toggleButton = document.getElementById(DOM_IDS.LEFT_PANEL_TOGGLE); // [MODIFIED] Look for toggle globally
        this.content = this.panelElement.querySelector('.panel-content');
        this.tabs = this.panelElement.querySelectorAll('.tab-button');
        this.tabContents = this.panelElement.querySelectorAll('.tab-content');
        this.backButton = this.panelElement.querySelector('#back-to-grid-view');

        // --- Child Component Initialization ---
        // [MODIFIED] The input handler is now initialized in main.js, this reference is no longer needed here.

        this._initializeEventListeners();
        console.log("LeftPanelComponent Initialized.");
    }

    _initializeEventListeners() {
        // [REMOVED] The toggle button is now handled by the InputHandler to centralize all user inputs.
        // The back button and tab clicks are also handled there.
        // This component is now purely for rendering and state management.
    }

    toggle() {
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

        if (currentView === 'DETAIL_CONFIG') {
            this.show();
        } else {
            this.hide();
        }

        // [FIX] Correctly update tab active states based on activeTabId from the state
        this.tabs.forEach(tab => {
            tab.classList.toggle('active', tab.id === activeTabId);
        });

        // [FIX] Check if detailConfigView and its render method exist before calling
        if (this.detailConfigView && typeof this.detailConfigView.render === 'function') {
            this.detailConfigView.render(state);
        }
    }
}