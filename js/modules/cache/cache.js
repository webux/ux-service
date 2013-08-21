(function () {
    'use strict';

    /**
     * @type {Object}
     */
    var objKeys,
        /**
         * @type {Function}
         */
        each,
        /**
         * @type {Object
         */
        util,
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
            var api = {};

            function isStore(store) {
                return (store.isSupported && store.hasKey && store.put && store.get && store.getAll && store.remove && store.removeAll);
            }

            function areStores(stores) {
                var i = 0, len = stores.length, result = true;
                while (result && i < len) {
                    result = isStore(stores[i]);
                    i += 1;
                }
                return result;
            }

            api.isStore = isStore;
            api.areStores = areStores;
            return api;
        }();

    function createStore() {
        var stores = [],
            storage = {};

        function addStores(storeListOrStore) {
            if (storeListOrStore instanceof Array && storeUtil.areStores(storeListOrStore)) {
                stores = stores.concat(storeListOrStore);
            } else if (storeUtil.isStore(storeListOrStore)) {
                stores.push(storeListOrStore);
            } else {
                throw new Error("Invalid Store API. Store expects every store to have isSupported, hasKey, put, get, getAll, remove, and removeAll methods defined.");
            }
        }

        function getStores() {
            return storage;
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

        function getStorageKey(cacheKey) {
            return name + cacheKey;
        }

        function getConfig() {
            return config;
        }

        function setConfig(cfg) {
            angular.extend(config, cfg);
        }

        function get(cacheKey) {
            var result = memoryCache[cacheKey];
            if (result === undefined) {
                result = storage.get(cacheKey);
            }
            return result;
        }

        function set(cacheKey, value) {
            var cacheItem = createCacheItem(value);
            subtract(memoryCache[cacheKey]);
            add(cacheItem);
            memoryCache[cacheKey] = cacheItem;
            api.warn("%s Cache Size %s", name, size.bytes);
            storage.put(cacheKey, cacheItem.value);
            change();
        }

        function remove(cacheKey, silent) {
            var cacheItem = memoryCache[cacheKey],
                storageKey;
            subtract(cacheItem);
            if (storage) {
                storageKey = getStorageKey(cacheKey);
                storage.remove(storageKey);
                api.log("\tlocalStorage remove for %s", storageKey);
            }
            api.warn("%s Cache Size %s", name, size.bytes);
            storage.remove(cacheKey);
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
            storage.removeAll();
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
            objOrStr = objKeys.filter(objOrStr, config.paramsFilter);
            return objKeys.objectToKey(objOrStr);
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
                oldList = objKeys.walkPath(oldValue, config.pagination.list);
                if (oldList.length >= offset) {
                    i = 0;
                    newList = objKeys.walkPath(value, config.pagination.list);
                    len = newList.length;
                    while (i < len) {
                        oldList[i + offset] = newList[i];
                        i += 1;
                    }
                    value = angular.copy(value);
                    objKeys.setPathValue(value, config.pagination.list, oldList);
                } else {
                    throw new Error("Pagination offset start is at %s, however the list only has %s value in it.");
                }
            }
            return value;
        }

        function getPaginationOffset(data) {
            if (typeof data === "object" && config.pagination) { // always select the first page if getting a cached page response.
                return parseInt(objKeys.walkPath(data, config.pagination.offset), 10);
            }
            return 0;
        }
//TODO: need to make memoryCache pull from defaultStores ... need to figure out timing of when to pull.
        function addStores(stores) {
            // after we add each store. We need to pull from them and populate our memory
            storage.addStores(stores);
            memoryCache = storage.getAll();
        }

        function destroy() {
            //TODO: destroy cache.
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
        api.getStores = storage.getStores;
        api.destroy = destroy;
        return api;
    }


    function ObjectCacheManager($rootScope, addons) {
        var cache = {},
            defaultStorage = createStore();
        $rootScope.$on(cacheEvents.CHANGE, onCacheChange);

        function create(name, config) {
            var item = cache[name] = cache[name] || new Cache(name, onCacheChange);
            if (config) {
                item.setConfig(config);
            }
            return applyAddons(item, addons);
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

//TODO: this should be called stores.
//TODO: setup a directory with a few stores examples localStorage, redis, mongodb, phonegap
//TODO: Should this be able to add a store to a config?
//TODO: default store set on manager. So default can also be a store stack.
        //TODO: (store list/store stack) passed to a single cache will override the default and use these caches instead.

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

    angular.module('ngCache', []).service('cacheManager', ['$rootScope', 'objectKeys', 'sizeUtil', 'dispatcher', 'logDispatcher', function ($rootScope, objectKeys, sizeUtil, dispatcher, logDispatcher) {
        each = objectKeys.each;
        util = sizeUtil;
        var result = new ObjectCacheManager($rootScope, [dispatcher, logDispatcher]);
        objKeys = objectKeys;
        dispatcher(result);
        logDispatcher(result);
        return result;
    }]);

}());
