(function () {
    'use strict';

    function dispatcher(target, scope, map) {
        var listeners = {};

        function off(event, callback) {
            var index, list;
            list = listeners[event];
            if (list) {
                if (callback) {
                    index = list.indexOf(callback);
                    if (index !== -1) {
                        list.splice(index, 1);
                    }
                } else {
                    list.length = 0;
                }
            }
        }

        function on(event, callback) {
            listeners[event] = listeners[event] || [];
            listeners[event].push(callback);
            return function() {
                off(event, callback);
            };
        }

        function fire(callback, args) {
            return callback && callback.apply(this, args);
        }

        /**
         * @param event
         */
        function dispatch(event) {
            var i = 0, len = listeners.length;
            while (i < len) {
                fire(listeners[i], arguments);
                i += 1;
            }
        }

        if (scope && map) {
            target.on = scope[map.on] && scope[map.on].bind(scope);
            target.off = scope[map.off] && scope[map.off].bind(scope);
            target.dispatch = scope[map.dispatch].bind(scope);
        } else {
            target.on = on;
            target.off = off;
            target.dispatch = dispatch;
        }
    }

    window.ux = window.ux || {};
    ux.dispatcher = dispatcher;
}());