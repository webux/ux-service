(function () {
    'use strict';

    window.ux = window.ux || {};

    /**
     * @type {Object}
     */
    var objectKeys = ux.objectKeys,
        /**
         * @type {Object}
         */
        defaultStorage,
        /**
         * @type {Function}
         */
        each = ux.objectKeys.each,
        /**
         * @type {Object
         */
        util = ux.sizeUtil,
        /**
         * @type {Object}
         */
        cacheDefaultConfig = {
            enabled: true,
            paramsFilter: null, // can be object or function to filter params.
            pagination: null,
            //            pagination: {
            //                offset: '',
            //                list:''
            //            },
            countLimit: 0,
            expireSeconds: 0,
            memoryLimit: 0
        },
        /**
         * @type {Object}
         */
        cacheEvents = {
            LOG: 'cache::log',
            INFO: 'cache::info',
            WARN: 'cache::warn',
            ERROR: 'cache::error',
            CHANGE: 'cache::change'
        },
        storeUtil = function () {
            var api = {},
                required = ['isSupported', 'hasKey', 'put', 'get', 'getAll', 'remove', 'removeAll'];

            function isStore(store) {
                var errors = [], i = 0, len = required.length;
                while (i < len) {
                    store.hasOwnProperty(required[i]) || errors.push(required[i]);
                    i += 1;
                }
                return errors.length ? errors : true;
            }

            function areStores(stores) {
                var i = 0, len = stores.length, result = true;
                while (result && i < len) {
                    result = isStore(stores[i]);
                    i += 1;
                }
                return result;
            }

            function count(obj) {
                var c = 0, i;
                for (i in obj) {
                    if (obj.hasOwnProperty(i)) {
                        c += 1;
                    }
                }
                return c;
            }

            api.isStore = isStore;
            api.areStores = areStores;
            api.count = count;
            return api;
        }();

    function createStore() {
        var stores = [],
            storage = {};

        function addStores(storeListOrStore) {
            var isArray = storeListOrStore instanceof Array, errors;
            if (isArray && (errors = storeUtil.areStores(storeListOrStore)) === true) {
                addSupportedStores(storeListOrStore);
            } else if (!isArray && (errors = storeUtil.isStore(storeListOrStore)) === true) {
                addSupportedStores([storeListOrStore]);
            } else if (errors) {
                throw new Error("Invalid Store API. Store missing methods (" + errors.join(", ") + ").");
            }
        }

        function addSupportedStores(storesList) {
            var i = 0, len = storesList.length, store;
            while (i < len) {
                store = storesList[i];
                if (store.isSupported()) {
                    stores.push(store); // only stores supported will be added to the list.
                }
                i += 1;
            }
        }

        function getStores() {
            return stores;
        }

        function hasStores() {
            return !!(stores.length);
        }

        function put(key, value) {
            var i = 0, len = stores.length;
            while (i < len) {
                stores[i].put(key, value); // add it to every store.
                i += 1;
            }
        }

        function get(key) {
            var i = 0, len = stores.length, store;
            while (i < len) {
                store = stores[i];
                if (store.hasKey(key)) { // get the value from the first one that has it defined.
                    return store.get(key); // so it falls back in the order they are added.
                }
                i += 1;
            }
            return undefined;
        }

        function getAll() {
            var i = 0, len = stores.length, store, all;
            while (i < len) {
                store = stores[i];
                all = store.getAll();
                if (storeUtil.count(all)) {
                    return all;
                }
                i += 1;
            }
            return undefined;
        }

        function remove(key) {
            var i = 0, len = stores.length;
            while (i < len) {
                stores[i].remove(key); // add it to every store.
                i += 1;
            }
        }

        function removeAll() {
            var i = 0, len = stores.length;
            while (i < len) {
                stores[i].removeAll(); // add it to every store.
                i += 1;
            }
        }

        storage.hasStores = hasStores;
        storage.addStores = addStores;
        storage.getStores = getStores;
        storage.put = put;
        storage.get = get;
        storage.getAll = getAll;
        storage.remove = remove;
        storage.removeAll = removeAll;
        return storage;
    }

    function createCacheItem(value) {
        return {
            bytes: util.sizeOfObject(value),
            value: value,
            timestamp: Date.now()
        };
    }

    function Cache(name, onChange) {
        var api = {},
            memoryCache = {},
            config = {},
            size = {
                count: 0,
                bytes: 0
            },
            storage = createStore();
        // apply defaults.
        angular.extend(config, cacheDefaultConfig);

        function getStorage() {
            if (storage.hasStores()) {
                return storage;
            }
            return defaultStorage;
        }

        function getConfig() {
            return config;
        }

        function setConfig(cfg) {
            angular.extend(config, cfg);
            if (config.stores) {
                addStores(config.stores);
                config.stores = undefined;
            }
            memoryCache = getStorage().getAll() || {};
        }

        function get(cacheKey) {
            var result = memoryCache[cacheKey];
            if (result === undefined) {
                result = getStorage().get(cacheKey);
            }
            return result;
        }

        function set(cacheKey, value) {
            var cacheItem = createCacheItem(value);
            subtract(memoryCache[cacheKey]);
            add(cacheItem);
            memoryCache[cacheKey] = cacheItem;
            api.warn("%s Cache Size %s", name, size.bytes);
            getStorage().put(cacheKey, cacheItem.value);
            change();
        }

        function remove(cacheKey, silent) {
            var cacheItem = memoryCache[cacheKey];
            subtract(cacheItem);
            api.warn("%s Cache Size %s", name, size.bytes);
            getStorage().remove(cacheKey);
            delete memoryCache[cacheKey];
            if (!silent) {
                change();
            }
        }

        function removeAll() {
            api.info("%s CLEAR CACHE ", name);
            each(memoryCache, function (cache, key) {
                remove(key, true);// only fire one event whne we are done.
            });
            getStorage().removeAll();
            change();
        }

        function add(item) {
            size.count += 1;
            size.bytes += item.bytes;
            item.timestamp = Date.now();
        }

        function subtract(item) {
            if (item) {
                size.count -= 1;
                size.bytes -= item.bytes;
                item.timestamp = Date.now();
            }
        }

        function getByteSize() {
            return size.bytes;
        }

        function getCount() {
            return size.count;
        }

        function elapsed(key) {
            return Date.now() - get(key).timestamp;
        }

        function getTime(key) {
            return get(key).timestamp;
        }

        function change() {
            onChange(api);
            api.dispatch(cacheEvents.CHANGE, api);
        }

        function getCache(objOrStr) {
            var key = getKey(objOrStr), result;
            result = get(key);
            if (isExpired(result)) {
                this.warn("%s Cache %s is expired", name, key);
                remove(key);
                result = null;
            }
            return result && result.value || undefined;
        }

        function setCache(objOrStr, value) {
            var key = getKey(objOrStr);
            if (config.pagination) {
                value = applyPage(key, value);
            }
            set(key, angular.copy(value));
        }

        function getKey(objOrStr) {
            if (typeof objOrStr === 'string') {
                return objOrStr;
            }
            objOrStr = objectKeys.filter(objOrStr, config.paramsFilter);
            return objectKeys.objectToKey(objOrStr);
        }

        function isExpired(cacheItem) {
            if (config.expireSeconds && cacheItem) {
                var milliseconds = config.expireSeconds * 1000,
                    now = Date.now(),
                    cutoff = now - milliseconds;
                return cacheItem.timestamp < cutoff;
            }
            return false;
        }

        function applyPage(key, value) {
            var offset = getPaginationOffset(value), oldValue, oldList, newList, i, len;
            if (offset) {
                oldValue = getCache(key);
                oldList = objectKeys.walkPath(oldValue, config.pagination.list);
                if (oldList.length >= offset) {
                    i = 0;
                    newList = objectKeys.walkPath(value, config.pagination.list);
                    len = newList.length;
                    while (i < len) {
                        oldList[i + offset] = newList[i];
                        i += 1;
                    }
                    value = angular.copy(value);
                    objectKeys.setPathValue(value, config.pagination.list, oldList);
                } else {
                    throw new Error("Pagination offset start is at %s, however the list only has %s value in it.");
                }
            }
            return value;
        }

        function getPaginationOffset(data) {
            if (typeof data === "object" && config.pagination) { // always select the first page if getting a cached page response.
                return parseInt(objectKeys.walkPath(data, config.pagination.offset), 10);
            }
            return 0;
        }

        function getStores() {
            return getStorage().getStores();
        }

        function addStores(stores) {
            // after we add each store. We need to pull from them and populate our memory
            storage.addStores(stores);
            memoryCache = storage.getAll() || {};
        }

        function destroy() {
            var i;
            for (i in api) {
                if (api.hasOwnProperty(i)) {
                    api[i] = null;
                }
            }
            api = null;
            storage = null;
            memoryCache = null;
            config = null;
            size = null;
        }

        api.events = cacheEvents;
        api.getConfig = getConfig;
        api.setConfig = setConfig;
        api.get = getCache;
        api.set = setCache;
        api.remove = remove;
        api.removeAll = removeAll;
        api.getBytesSize = getByteSize;
        api.getCount = getCount;
        api.elapsed = elapsed;
        api.getTime = getTime;
        api.addStores = addStores;
        api.getStores = getStores;
        api.destroy = destroy;
        return api;
    }


    function ObjectCacheManager() {
        var cache = {};
        defaultStorage = createStore();

        function create(name, config) {
            var item = cache[name] = cache[name] || new Cache(name, onCacheChange);
            if (config) {
                item.setConfig(config);
            }
            return applyAddons(item, [ux.dispatcher, ux.logDispatcher]);
        }

        function applyAddons(item, addons) {
            var i = 0, len = addons.length;
            while (i < len) {
                addons[i](item);
                i += 1;
            }
            return item;
        }

        function destroy(name) {
            if (cache[name]) {
                cache[name].removeAll();
                delete cache[name];
            }
        }

        function get(name) {
            return cache[name];
        }

        function clear(name) {
            get(name).removeAll();
        }

        function getTotalSize() {
            var result = util.getBytesSize(getTotalSizeInBytes());
            this.info("TOTAL SERVICE CACHE SIZE %s", result);
            return result;
        }

        function getTotalSizeInBytes() {
            var total = 0;
            each(cache, function (cacheItem) {
                total += cacheItem._totalSize;
            });
            return total;
        }

        function onCacheChange(cache) {

        }

        //TODO: need to make option for a cache to not persist to a store. So do not use the defaultStorage even if it is availalble because we want a memrory only cache.

        this.create = create;
        this.destroy = destroy;
        this.clear = clear;
        this.get = get;
        this.clear = clear;
        this.getTotalSize = getTotalSize;
        this.getTotalSizeInBytes = getTotalSizeInBytes;
        this.addStores = defaultStorage.addStores;
        this.getStores = defaultStorage.getStores;
    }

    window.ux.Cache = ObjectCacheManager;
}());