/* globals describe, it */

var assert = require('assert');
var obj = require('./object-equality.js');

describe("object-equality", () => {
  describe("equal", () => {
    it("should handle simple objects with strings", () => {
      assert(obj.equal({a: 'b', c: 'd'}, {a: 'b', c: 'd'}));
    });

    it("should handle simple objects with numbers", () => {
      assert(obj.equal({a: 1, b: 2}, {a: 1, b: 2}));
    });

    it("should handle reversed keys", () => {
      assert(obj.equal({a: 1, b: 2}, {b: 2, a: 1}));
    });

    it("should handle simple objects with arrays", () => {
      assert(obj.equal({a: ['b', 'c'], d: ['e', 'f']}, {a: ['b', 'c'], d: ['e', 'f']}));
    });

    it("should handle nested objects", () => {
      assert(obj.equal({a: {b: 'c'}, d: {e: 'f'}}, {a: {b: 'c'}, d: {e: 'f'}}));
    });

    it("should declare reversed values unequal", () => {
      assert(!obj.equal({a: 1, b: 2}, {a: 2, b: 1}));
    });

    it("should handle different length objects", () => {
      assert(!obj.equal({a: 1}, {a: 1, b: 2}));
      assert(!obj.equal({a: 1, b: 2}, {a: 1}));
    });
  });

  describe("aryEqual", () => {
    it("should handle simple arrays with strings", () => {
      assert(obj.aryEqual(['a', 'b', 'c'], ['a', 'b', 'c']));
    });

    it("should handle simple arrays with numbers", () => {
      assert(obj.aryEqual([1, 2, 3], [1, 2, 3]));
    });

    it("should handle simple arrays with objects", () => {
      assert(obj.aryEqual([{a: 'b', c: 'd'}, {e: 1, f: 2}], [{a: 'b', c: 'd'}, {e: 1, f: 2}]));
    });

    it("should handle nested arrays", () => {
      assert(obj.aryEqual([[1, 2, 3], ['a', 'b', 'c']], [[1, 2, 3], ['a', 'b', 'c']]));
    });
  });
});
