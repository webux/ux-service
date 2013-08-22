(function () {
    'use strict';

    var events = {
            ERROR: 'cookieStore:error'
        },
        NOT_SUPPORTED = 'Cookies are Not Supported';

    function CookieStore($rootScope, $cookieStore, $cookies) {

        function isSupported() {
            var cookieEnabled = !!(navigator.cookieEnabled);

            if (typeof navigator.cookieEnabled == "undefined" && !cookieEnabled)
            {
                document.cookie="testcookie";
                cookieEnabled = (document.cookie.indexOf("testcookie") != -1) ? true : false;
            }
            return (cookieEnabled);
        }

        function hasKey(key) {
            return $cookies.hasOwnProperty(key);
        }

        function getAll() {
            return $cookies;
        }

        function removeAll() {
            var i;
            for (i in $cookies) {
                if ($cookies.hasOwnProperty(i)) {
                    $cookieStore.remove(i);
                }
            }
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
        this.put = $cookieStore.put;
        this.get = $cookieStore.get;
        this.getAll = getAll;
        this.remove = $cookieStore.remove;
        this.removeAll = removeAll;
    }

    angular.module('ngCookieStore', ['ngCookies']).
        service('cookieStore', ['$rootScope', '$cookieStore', '$cookies', function ($rootScope, $cookieStore, $cookies) {
            return new CookieStore($rootScope, $cookieStore, $cookies);
        }]);
}());