angular.module('app', ['eventLogger', 'ngService', 'ngCache', 'ngLocalStorage', 'ngCookieStore']).
    run(['$injector', 'eventLogger', '$serviceQueue', 'connection', 'queue', 'logDispatcher', function ($injector, eventLogger, $serviceQueue, connection, queue, logDispatcher) {
        logDispatcher.enableLogging(1);
        eventLogger('serviceQueue', $serviceQueue.events, 'green', eventLogger.levels.DEBUG);
        eventLogger('connection', connection.events, 'orange', eventLogger.levels.INFO);
        eventLogger('queue', queue.events, 'teal', eventLogger.levels.DEBUG);
        $serviceQueue.config({
            connection: {
                waitAfterSuccess: 5,
                url: 'json/heartbeat.json'
            }
        });

        // make debugging easier.
        window._i = $injector.get;
    }]);