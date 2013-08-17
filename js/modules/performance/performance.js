/**
 * Make compatible with browsers to support performance.
 **/
/*global performance, Date */
if (!window.performance) {
    window.performance = window.performance || {};
}
performance.now = (function () {
    return performance.now ||
        performance.mozNow ||
        performance.msNow ||
        performance.oNow ||
        performance.webkitNow ||
        function () {
            return new Date().getTime();
        };
}());