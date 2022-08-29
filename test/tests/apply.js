"use strict";
const { assert } = require("chai");

var { _ } = require("../assets/js/query");

var { models } = require("../assets/data/models");
models = _.map(models, model => {
  return { attributes: model };
});

exports.apply = function suite() {
  // key:"created stuff"
  // key:created
  // key~"created stuff"
  // key~created
  // created
  // "Text like this"

  it('should match for key:"created stuff"', function () {
    let result = _.applyFilter(
      { key: "created stuff" },
      {
        fields: [{ key: "key", base: "input" }],
      },
      _.createFilters(_.tokenize('key:"created stuff"'), {
        fields: [{ key: "key", base: "input" }],
      }).filters[0]
    );

    assert.equal(result, true);
  });

  it('should match for key:"created stuff"', function () {
    let result = _.applyFilter(
      { key: "created stuff" },
      {
        fields: [{ key: "key", base: "input" }],
      },
      _.createFilters(_.tokenize('key:"created stuffing"'), {
        fields: [{ key: "key", base: "input" }],
      }).filters[0]
    );

    assert.equal(result, true);
  });

  it("should match for key:created", function () {
    let result = _.applyFilter(
      { key: "created stuff" },
      {
        fields: [{ key: "key", base: "input" }],
      },
      _.createFilters(_.tokenize("key:created"), {
        fields: [{ key: "key", base: "input" }],
      }).filters[0]
    );

    assert.equal(result, true);
  });

  it("should not match for key:thing", function () {
    let result = _.applyFilter(
      { key: "created stuff" },
      {
        fields: [{ key: "key", base: "input" }],
      },
      _.createFilters(_.tokenize("key:thing"), {
        fields: [{ key: "key", base: "input" }],
      }).filters[0]
    );

    assert.equal(result, false);
  });
};
