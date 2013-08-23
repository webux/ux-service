(function () {
    'use strict';

    var toArray = ux.arrayUtil.toArray;

    function logDispatcher(dispatcher) {

        function enableLogs(value) {
            // to aid in performance we are going to replace the functions with subs if we are disabled.
            if (value) {
                dispatcher.log = value && value <= 1 ? log : nothing;
                dispatcher.info = value && value <= 2 ? info : nothing;
                dispatcher.warn = value && value <= 3 ? warn : nothing;
                dispatcher.error = value && value <= 4 ? error : nothing;
            } else {
                dispatcher.log = dispatcher.info = dispatcher.warn = dispatcher.error = nothing;
            }
        }

        function nothing() {
        }

        function log() {
            run([dispatcher.events.LOG].concat(toArray(arguments)));
        }

        function info() {
            run([dispatcher.events.INFO].concat(toArray(arguments)));
        }

        function warn() {
            run([dispatcher.events.WARN].concat(toArray(arguments)));
        }

        function error() {
            run([dispatcher.events.ERROR].concat(toArray(arguments)));
        }

        function run(args) {
            dispatcher.dispatch.apply(null, args);
        }

        enableLogs(1);
        dispatcher.enableLogs = enableLogs;
        dispatcher.on('logDispatcher::enableLogs', function (event, logLevel) {
            enableLogs(logLevel || 0);
        });
    }

    logDispatcher.events = {
        LOGGING: 'logDispatcher::enableLogs'
    };

    window.ux = window.ux || {};
    window.ux.logDispatcher = logDispatcher;
}());