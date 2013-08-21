describe("localStorage Store", function () {

    var injector = angular.injector(['app']),
        store = injector.get('localStorage');
    beforeEach(function () {
        store.prefix('unittest');
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

    it("hasKey should return false if the key does not exist", function() {

    });

    it("hasKey should return true if the key exists", function() {

    });

    it("should be able to put a value to the store", function () {

    });
});