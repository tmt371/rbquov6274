// /04_CoreCode/EventAggregator.js

/**
 * EventAggregator (溝通中樞/ 中央神經系統)
 * 實現了「發布/訂閱」模式，整合整個應用程式的事件與響應。 */
export class EventAggregator {
    constructor() {
        this.events = {};
    }

    /**
     * 訂閱一個事件
     * @param {string} eventName - 事件名稱
     * @param {Function} callback - 事件觸發時要執行的回調函數
     */
    subscribe(eventName, callback) {
        if (!this.events[eventName]) {
            this.events[eventName] = [];
        }
        this.events[eventName].push(callback);
    }

    /**
     * 發布一個事件
     * @param {string} eventName - 事件名稱
     * @param {*} data - 要傳遞給訂閱者的資料
     */
    publish(eventName, data) {
        // [TRACK] Check if the event is being published
        console.log(`[TRACK] EventAggregator: Publishing event '${eventName}'.`);
        if (this.events[eventName]) {
            this.events[eventName].forEach(callback => callback(data));
        }
    }
}