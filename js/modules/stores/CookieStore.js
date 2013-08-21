(function () {
    'use strict';

    var events = {
            ERROR: 'cookieStore:error'
        },
        NOT_SUPPORTED = 'Cookies are Not Supported';

    function CookieStore($rootScope) {

        function isSupported() {
        }

        function hasKey() {
        }

        function put() {
        }

        function get() {
        }

        function getAll() {
        }

        function remove() {
        }

        function removeAll() {
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

        this.isSupported = isSupported;
        this.hasKey = hasKey;
        this.put = put;
        this.get = get;
        this.getAll = getAll;
        this.remove = remove;
        this.removeAll = removeAll;
    }

    angular.module('ngCookieStore', []).
        service('cookieStore', ['$rootScope', function ($rootScope) {
            return new CookieStore($rootScope);
        }]);
}());