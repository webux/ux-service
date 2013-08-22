describe("Stores", function () {

    var injector = angular.injector(['app']),
        stores = ['localStorage', 'cookieStore'],// add each store to test here.
        i = 0, len = stores.length, store;

    while (i < len) {
        describe(stores[i] + " store", function () {
            var j = i;
            beforeEach(function () {
                store = injector.get(stores[j]);
                if (store.prefix) {
                    store.prefix('unittest');
                }
                store.removeAll();
            });

            it("should have the api of isSupported, put, get, getAll, remove, removeAll", function () {
                expect(store.isSupported).toBeDefined();
                expect(store.hasKey).toBeDefined();
                expect(store.put).toBeDefined();
                expect(store.get).toBeDefined();
                expect(store.getAll).toBeDefined();
                expect(store.remove).toBeDefined();
                expect(store.removeAll).toBeDefined();
            });

            it("hasKey should return false if the key does not exist", function () {
                expect(store.hasKey('nokey')).toBe(false);
            });

            it("hasKey should return true if the key exists", function () {
                store.put('key', 'value');
                expect(store.hasKey('key')).toBe(true);
            });

            it("should be able to put and retrieve a value to/from the store", function () {
                store.put('key', 'value');
                expect(store.get('key')).toBe('value');
            });

            it("should remove a value from the store", function () {
                store.put('key', 'value');
                store.remove('key');
                expect(store.get('key')).toBeUndefined();
            });

            it("should remove all values from the store", function () {
                store.put('key', 'value');
                store.put('key1', 'value');
                store.removeAll();
                expect(store.get('key')).toBeUndefined();
                expect(store.get('key1')).toBeUndefined();
            });
        });
        i += 1;
    }
});