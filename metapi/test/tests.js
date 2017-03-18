/* globals describe, before, it */

var assert = require('assert');
var jsdom = require('jsdom');
var mp = require('../metapi.js').metapi;
var obj = require('./object-equality.js');

var metapi;

describe("metapi", () => {
  before(done => {
    jsdom.env({
      url: 'http://chat.stackexchange.com/rooms/11540/charcoal-hq',
      scripts: ['https://ajax.googleapis.com/ajax/libs/jquery/1.12.4/jquery.min.js'],
      done: function (err, window) {
        if (err) {
          console.error(err);
          done(err);
          return;
        }
        metapi = mp(window.$);
        done();
      }
    });
  });

  describe("Cache", () => {
    var cache;
    before(() => {
      cache = new metapi.Cache();
    });

    describe("constructor", () => {
      it("should return a valid Cache object", () => {
        assert(cache.hasOwnProperty("add"));
        assert(cache.hasOwnProperty("get"));
        assert(cache.hasOwnProperty("delete"));
      });
    });

    describe("add", () => {
      it("should add a nonexistent value to the cache", () => {
        cache.add("test_key", {this: 'is', a: 'test'});
      });

      it("should refuse to overwrite without overwrite specified", () => {
        assert.throws(() => {
          cache.add("test_key", {this: 'should', throw: 'an error'});
        }, ReferenceError);
      });

      it("should overwrite when told to", () => {
        cache.add("test_key", {this: 'should', overwrite: 'previous data'}, {overwrite: true});
      });
    });

    describe("get", () => {
      it("should retrieve the most recent value", () => {
        assert(obj.equal({this: 'should', overwrite: 'previous data'}, cache.get("test_key")));
      });

      it("should return null for nonexistent values", () => {
        assert.equal(null, cache.get("foo"));
      });

      it("should throw errors when told to", () => {
        assert.throws(() => {
          cache.get("foo", {throwOnFail: true});
        }, ReferenceError);
      });
    });
  });
});
