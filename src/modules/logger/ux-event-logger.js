(function () {
    'use strict';

    // create our own simple little addong for logging.
    SimpleLogger.logLevel = SimpleLogger.levels.DEBUG;

    angular.module('eventLogger', []).factory('eventLogger', ['$rootScope', function ($rootScope) {

        function cleanUpArgs(args) {
            args = SimpleLogger.toArray(args);
            var event = args.shift();// drop the event.
            if (event.stopPropagation) { // broadcast events do not have this.
                event.stopPropagation(); // don't let the log keep going if it is logged.
            }
            while (args[0] === event.name) { // remove duplicate events for nested events.
                args.shift();
            }
            return args;
        }

        function eventLogger(name, events, color, level) {
            var logger = {__name: name || 'logger'}; // SimpleLogger needs this property.
            if (!SimpleLogger.debuggers.hasOwnProperty(logger.__name)) {
                SimpleLogger.debuggers[logger.__name] = level;
            }
            SimpleLogger.enableLogging(logger, SimpleLogger.themes[color || 'teal']);
            $rootScope.$on(events.LOG, function () {
                logger.log.apply(logger, cleanUpArgs(arguments));
            });
            $rootScope.$on(events.INFO, function () {
                logger.info.apply(logger, cleanUpArgs(arguments));
            });
            $rootScope.$on(events.WARN, function () {
                logger.warn.apply(logger, cleanUpArgs(arguments));
            });
            $rootScope.$on(events.ERROR, function () {
                logger.error.apply(logger, cleanUpArgs(arguments));
            });
        }
        eventLogger.levels = SimpleLogger.levels;
        return eventLogger;
    }]);
}());