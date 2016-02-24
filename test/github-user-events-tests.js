/* global describe, before, beforeEach, afterEach, flush, it, fixture, assert, sinon */
describe('github-user-events', function () {
    var element, server,
        username = 'dpobel';

    function configureServerResponse(server, code, response) {
        server.respondWith(
            'GET',
            `https://api.github.com/users/${username}/events`,
            [code, {"Content-Type": "application/json"}, JSON.stringify(response)]
        );
    }

    beforeEach(function (done) {
        server = sinon.fakeServer.create();

        element = fixture('github-user-events-fixture');
        flush(done);
    });

    afterEach(function () {
        server.restore();
    });

    describe('properties', function () {
        describe('loading', function () {
            it('should be true while loading', function () {
                assert.isTrue(element.loading);
            });

            it('should be false when getting a successful response', function (done) {
                configureServerResponse(server, 200, []);
                server.respond();
                flush(function () {
                    assert.isFalse(element.loading);
                    done();
                });
            });

            it('should be false when getting an error response', function (done) {
                configureServerResponse(server, 404, []);
                server.respond();
                flush(function () {
                    assert.isFalse(element.loading);
                    done();
                });
            });
        });

        describe('error', function () {
            it('should be false by default', function () {
                assert.isFalse(element.error);
            });

            it('should be falsy with a successful response', function (done) {
                configureServerResponse(server, 200, []);
                server.respond();

                flush(function () {
                    assert.notOk(element.error);
                    done();
                });
            });

            it('should be truthy with an error response', function (done) {
                configureServerResponse(server, 404, []);
                server.respond();

                flush(function () {
                    assert.ok(element.error);
                    done();
                });
            });
        });

        describe('events', function () {
            it('should be an empty array by default', function () {
                assert.isArray(element.events);
                assert.equal(element.events.length, 0);
            });

            describe('parsers', function () {
                var rawEvent = {
                        type: 'RunningUnitTestEvent',
                        created_at: "2016-02-24T10:44:27Z",
                        repo: {},
                    };

                it('should unify events', function (done) {
                    var event;

                    configureServerResponse(server, 200, [rawEvent]);
                    server.respond();

                    flush(function () {
                        assert.isArray(element.events);
                        assert.equal(element.events.length, 1);
                        event = element.events[0];

                        assert.equal(event.type, "Running Unit Test");
                        assert.equal(event.created, "Wed, 24 Feb 2016 10:44:27 GMT");
                        assert.deepEqual(event.repository, rawEvent.repo);
                        done();
                    });
                });
            });
        });
    });
});
