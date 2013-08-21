(function () {
    'use strict';

    var events = {
            ERROR: 'localStorage:error'
        },
        NOT_SUPPORTED = 'Local Storage is Not Supported';

    function LocalStorage($rootScope) {
        var _prefix = '';

        /**
         * prefix is handy for keeping your app separate from storage in your other apps.
         * @param value
         * @returns {string}
         */
        function prefix(value) {
            if (value !== undefined) {
                _prefix = value && value + '.' || '';
            }
            return _prefix;
        }

        /**
         * Validate that is is supported before using.
         * @returns {*}
         */
        function isSupported() {
            try {
                return ('localStorage' in window && window['localStorage'] !== null);
            } catch (e) {
                return errorHandler(e.Description);
            }
        }

        function hasKey(key) {
            if (!isSupported()) {
                return errorHandler(NOT_SUPPORTED);
            }

            return localStorage.hasOwnProperty(_prefix + key);
        }

        /**
         * Add a value to the local storage.
         * @param key
         * @param value
         * @returns {*}
         */
        function put(key, value) {
            if (!isSupported()) {
                return errorHandler(NOT_SUPPORTED);
            }

            // limit do not allow undefined or null values.
            if (!value && (value === undefined || value === null)) {
                return false;
            }

            try {
                localStorage.setItem(_prefix + key, JSON.stringify(value));
            } catch (e) {
                return errorHandler(e.Description);
            }
        }

        /**
         * get a value from the local storage.
         * @param key
         * @returns {*}
         */
        function get(key) {
            if (!isSupported()) {
                return errorHandler(NOT_SUPPORTED);
            }

            var item = localStorage.getItem(_prefix + key);
            return item && JSON.parse(item) || null;
        }

        /**
         * get all values from local storage under this prefix.
         * @returns {*}
         */
        function getAll() {
            var key, len = _prefix.length, subKey, result = {};
            if (!isSupported()) {
                return errorHandler(NOT_SUPPORTED);
            }

            for (key in localStorage) {
                if (localStorage.hasOwnProperty(key) && key.substr(0, len) === _prefix) {
                    subKey = key.substr(len);
                    result[subKey] = get(subKey);
                }
            }

            return result;
        }

        /**
         * remove the value from the local storage
         * @param key
         * @returns {*}
         */
        function remove(key) {
            if (!isSupported()) {
                return errorHandler(NOT_SUPPORTED);
            }

            try {
                localStorage.removeItem(_prefix + key);
            } catch (e) {
                return errorHandler(e.Description);
            }
        }

        /**
         * Remove all data from the local storage under the _prefix.
         * Optionally pass a pattern to remove all that match that pattern.
         * @param {RegExp=} pattern
         * @returns {*}
         */
        function removeAll(pattern) {
            var key, len = _prefix.length;
            if (!isSupported()) {
                return errorHandler(NOT_SUPPORTED);
            }

            for (key in localStorage) { // only remove items that are under our _prefix
                if (localStorage.hasOwnProperty(key) && key.substr(0, len) === _prefix && (!pattern || key.substr(len).match(pattern))) {
                    try {
                        remove(key.substr(len));
                    } catch (e) {
                        return errorHandler(e.Description);
                    }
                }
            }
            return true;
        }

        /**
         * Handle the errors for our local storage by dispatching the error.
         * @param message
         * @returns {boolean}
         */
        function errorHandler(message) {
            $rootScope.$broadcast(events.ERROR, message);
            return false;
        }

        this.prefix = prefix;
        this.isSupported = isSupported;
        this.hasKey = hasKey;
        this.put = put;
        this.get = get;
        this.getAll = getAll;
        this.remove = remove;
        this.removeAll = removeAll;
    }

    angular.module('ngLocalStorage', []).
        service('localStorage', ['$rootScope', function ($rootScope) {
            return new LocalStorage($rootScope);
        }]);
}());