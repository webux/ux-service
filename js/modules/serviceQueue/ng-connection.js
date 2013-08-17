(function () {
    'use strict';

    var states = {
            ONLINE: 'online',
            OFFLINE: 'offline',
            CONNECTING: 'connecting'
        },
        events = {
            LOG: 'connection:log',
            INFO: 'connection:info',
            WARN: 'connection:warn',
            ERROR: 'connection:error'
        };

    function connection(dispatcher, logDispatcher) {
        var api = {},
            _state = null,
            waitingOnService = false,
            waitAfterError = 0,
            timer = null,
            remainder = 0,
            _config = {
                url: 'heartbeat.json', // url to hit to make sure the server is alive.
                timeout: 2, // how long a request can take to complete
                waitAfterError: 5, // how long to start waiting at for each connection call.
                waitAfterErrorInc: 0, // how much to increment the wait by for each failed offline check
                waitAfterErrorMax: 30, // max wait time for when it is offline.
                waitAfterSuccess: 30, // how long to wait after a successful heartbeat before checking again
                validationWait: 1, // how long to wait between connectSuccessRequirement checks.
                validCount: 5, // how many times to make sure the heartbeat completes before setting online status
                validCounter: 5 // how many successes in a row we currently have. Start out full.
            };

        function config(value) {
            if (value !== undefined) {
                angular.extend(_config, value);
                api.log("\tconfig update %s", _config);
                if (!state()) {
                    connect();
                    timer = setInterval(exec, 1000);
                }
            }
            return _config;
        }

        function state(value) {
            if (value !== undefined && _state !== value) {
                api.info("change state from %s -to- %s", _state, value);
                _state = value;
            }
            return _state;
        }

        function getState() {
            return _state;
        }

        function connect() {
            api.info("\tconnect");
            state(states.CONNECTING);
            waitAfterError = _config.waitAfterError;
            heartBeat(_config.waitAfterSuccess);
        }

        function heartBeat(waitTime) {
            if (waitingOnService) {
                api.log("\twaiting for service to complete");
                return;
            }
            remainder = waitTime;
            api.log("\twait: %s", waitTime);
        }

        function exec() {
            if (remainder > 0) {
                remainder -= 1;
                api.log("\t\tnext call in %s", remainder);
            } else if (!waitingOnService) {
                api.log("\t\tcall to %s", _config.url);
                waitingOnService = true;
                fetch(_config.url);
            } else {
                api.log("\twaiting for service to complete");
            }
        }

        function fetch(url) {
            var request = new ajaxRequest();
            request.timeout = _config.timeout * 1000;
            request.ontimeout = onTimeout;
            request.onreadystatechange = function () {
                var status;
                if (request.readyState == 4) {
                    status = api.fakeErrorCode || request.status;
                    if (status == 200 || window.location.href.indexOf("http") === -1) {
                        onHeartbeatSuccess(status);
                    } else {
                        onError(status);
                    }
                }
            };
            request.open("GET", url, true);
            try {
                request.send(null);
            } catch(e) {
                // error if not on accessing a server.
                onAjaxPrevented();
            }
        }

        function ajaxRequest() {
            var activexmodes = ["Msxml2.XMLHTTP", "Microsoft.XMLHTTP"]; //activeX versions to check for in IE
            if (window.ActiveXObject) { //Test for support for ActiveXObject in IE first (as XMLHttpRequest in IE7 is broken)
                for (var i = 0; i < activexmodes.length; i++) {
                    try {
                        return new ActiveXObject(activexmodes[i])
                    } catch (e) {
                        //suppress error
                    }
                }
            } else if (window.XMLHttpRequest) { // if Mozilla, Safari etc
                return new XMLHttpRequest();
            }
            return false
        }

        function onHeartbeatSuccess(status) {
            api.log("\tonHeartbeatSuccess");
            waitingOnService = false;
            if (_config.validCounter < _config.validCount) {
                _config.validCounter += 1;
                heartBeat(_config.validationWait);
            } else {
                state(states.ONLINE);
                heartBeat(_config.waitAfterSuccess);
            }
        }

        function onTimeout() {
            api.warn("\theartbeat TIMEOUT");
            onError(0);
        }

        function onAjaxPrevented() {
            api.error("\tajax prevented by browser. make sure you are accessing files through a server.");
            onError(0);
        }

        function onError(status) {
            api.warn("\tonError %s", status);
            waitingOnService = false;
            state(states.OFFLINE);
            _config.validCounter = 0;
            heartBeat(waitAfterError);
            waitAfterError += _config.waitAfterErrorInc;
            waitAfterError = waitAfterError > _config.waitAfterErrorMax ? _config.waitAfterErrorMax : waitAfterError;
        }

        api.events = events;
        api.state = getState;
        api.connect = connect;
        api.config = config;
        api.fakeErrorCode = 0;

        dispatcher(api);
        logDispatcher(api);

        return api;
    }

    angular.module('ngService').
        service('connection', ['dispatcher', 'logDispatcher',
            function (dispatcher, logDispatcher) {
                return connection(dispatcher, logDispatcher);
            }]);
}());