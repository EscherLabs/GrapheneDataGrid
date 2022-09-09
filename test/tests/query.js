"use strict";
const { assert } = require("chai");

var { _ } = require("../assets/js/query");

var { models } = require("../assets/data/models");
var { fields } = require("../assets/data/fields");

var options = {
  keys: ["attributes"],
  path: "attributes",
  fields: [{ key: "title", type: "text", base: "input" }],
};
models = _.map(models, model => {
  return { attributes: model };
});

exports.query = function suite() {
  describe("Fuzzy search", function () {
    it("should return a select 4 items", function () {
      let result = _.query(models, "title:add", options);

      assert.equal(result.length, 4);
      assert.equal(result[0].attributes.title, "Add Home page");
    });

    it("should return a select 6 items that do not fuzzy match 'add'", function () {
      let result = _.query(models, "-title:add", options);

      assert.equal(result.length, 6);
      assert.equal(
        result[0].attributes.title,
        "Cache bookmarked apps in localstorage"
      );
    });

    it("should return a select 1 item", function () {
      let result = _.query(models, 'title="add*"', options);

      assert.equal(result.length, 1);
      assert.equal(result[0].attributes.title, "add password reset");
    });

    it("should return a select 3 item", function () {
      let result = _.query(models, 'title="*Add*"', options);

      assert.equal(result.length, 3);
      assert.equal(result[0].attributes.title, "Add Home page");
    });
  });
};
