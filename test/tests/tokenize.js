"use strict";
const { assert } = require("chai");

var { _ } = require("../assets/js/query");

exports.tokenize = function suite() {
  describe("sort", function () {
    it("should return a sort token", function () {
      let result = _.tokenize("sort:title");

      assert.equal(result.length, 1);
      assert.equal(result[0].key, "sort");
      assert.deepInclude(result, {
        invert: false,
        key: "sort",
        action: ":",
        search: [
          {
            action: "~",
            lower: "title",
            raw: "title",
            string: "title",
          },
        ],
      });
    });
    it("should return an inverted sort token", function () {
      let result = _.tokenize("-sort:title");
      assert.equal(result.length, 1);
      assert.equal(result[0].key, "sort");
      assert.deepInclude(result, {
        invert: true,
        key: "sort",
        action: ":",
        search: [
          {
            action: "~",
            lower: "title",
            raw: "title",
            string: "title",
          },
        ],
      });
    });
  });
  describe("Start/End/Contain tokens", function () {
    it("should return a startswith search token", function () {
      let result = _.tokenize('title:"add*"');
      assert.equal(result.length, 1);
      assert.equal(result[0].key, "title");
      assert.deepInclude(result, {
        invert: false,
        key: "title",
        action: ":",
        search: [
          {
            action: "^",
            lower: "add",
            raw: "add",
            string: "add",
          },
        ],
      });
    });
    it("should return a endswith search token", function () {
      let result = _.tokenize('title:"*add"');
      assert.equal(result.length, 1);
      assert.equal(result[0].key, "title");
      assert.deepInclude(result, {
        invert: false,
        key: "title",
        action: ":",
        search: [
          {
            action: "$",
            lower: "add",
            raw: "add",
            string: "add",
          },
        ],
      });
    });
    it("should return a contains search token", function () {
      let result = _.tokenize('title:"*add*"');
      assert.equal(result.length, 1);
      assert.equal(result[0].key, "title");
      assert.deepInclude(result, {
        invert: false,
        key: "title",
        action: ":",
        search: [
          {
            action: "*",
            lower: "add",
            raw: "add",
            string: "add",
          },
        ],
      });
    });
  });

  describe("Search tokens", function () {
    it("should return a default search token", function () {
      let result = _.tokenize("Hello");
      assert.equal(result.length, 1);
      assert.equal(result[0].key, "search");
      assert.deepInclude(result, {
        invert: false,
        key: "search",
        action: ":",
        search: [
          {
            action: "~",
            lower: "hello",
            raw: "Hello",
            string: "Hello",
          },
        ],
      });
    });
    it("should return an exact match default search token", function () {
      let result = _.tokenize('"get stuff"');
      assert.equal(result.length, 1);
      assert.equal(result[0].key, "search");
      assert.deepInclude(result, {
        invert: false,
        key: "search",
        action: ":",
        search: [
          {
            action: "=",
            lower: "get stuff",
            raw: "get stuff",
            string: "get stuff",
          },
        ],
      });
    });
    it("should return two search tokens", function () {
      let result = _.tokenize("get title:sg stuff");
      assert.equal(result[0].key, "search");
      assert.equal(result[2].key, "search");
      assert.deepInclude(result, {
        invert: false,
        key: "search",
        action: ":",
        search: [
          {
            action: "~",
            lower: "get",
            raw: "get",
            string: "get",
          },
        ],
      });
      assert.deepInclude(result, {
        invert: false,
        key: "search",
        action: ":",
        search: [
          {
            action: "~",
            lower: "stuff",
            raw: "stuff",
            string: "stuff",
          },
        ],
      });
    });
  });
};
