"use strict";
const { assert } = require("chai");

var { _ } = require("../assets/js/query");

var { models } = require("../assets/data/models");
models = _.map(models, model => {
  return { attributes: model };
});

exports.query = function suite() {
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
};
