const { assert } = require("chai");

var { _ } = require("./assets/js/query");

var { models } = require("./assets/data/models");
models = _.map(models, model => {
  return { attributes: model };
});

describe("Tokenize", function () {
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

    it("should return an startswith search token", function () {
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
  });
});

describe("Query", function () {
  describe("Fuzzy", function () {
    let result = _.query(models, "title:add", {
      keys: ["attributes"],
      fields: [{ key: "title", type: "text", base: "input" }],
    });

    it("should return a search object", function () {
      assert.equal(result.length, 4);
      assert.equal(result[0].attributes.title, "Add Home page");
    });
  });
});
