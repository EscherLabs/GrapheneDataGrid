"use strict";
const { assert } = require("chai");

var { _ } = require("../assets/js/query");

var { models } = require("../assets/data/models");
var options = require("../assets/data/fields");

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

  describe("Fuzzy", function () {
    it('should match for key:"created stuff"', function () {
      let result = _.applyFilter(
        { key: "created stuff" },
        options,
        _.createFilters(_.tokenize('key:"created stuff"'), options).filters[0]
      );

      assert.equal(result, true);
    });

    it('should NOT match for key:"created stuffing"', function () {
      let result = _.applyFilter(
        { key: "created stuff" },
        options,
        _.createFilters(_.tokenize('key:"created stuffing"'), options)
          .filters[0]
      );

      assert.equal(result, false);
    });

    it("should match for key:created", function () {
      let result = _.applyFilter(
        { key: "created stuff" },
        options,
        _.createFilters(_.tokenize("key:created"), options).filters[0]
      );

      assert.equal(result, true);
    });

    it("should NOT match for key:thing", function () {
      let result = _.applyFilter(
        { key: "created stuff" },
        options,
        _.createFilters(_.tokenize("key:thing"), options).filters[0]
      );

      assert.equal(result, false);
    });

    it('should match for key~"created stuff"', function () {
      let result = _.applyFilter(
        { key: "created stuff" },
        options,
        _.createFilters(_.tokenize('key~"created stuff"'), options).filters[0]
      );

      assert.equal(result, true);
    });

    it('should NOT match for key~"created stuffing"', function () {
      let result = _.applyFilter(
        { key: "created stuff" },
        options,
        _.createFilters(_.tokenize('key~"created stuffing"'), options)
          .filters[0]
      );

      assert.equal(result, false);
    });

    it("should match for key~created", function () {
      let result = _.applyFilter(
        { key: "created stuff" },
        options,
        _.createFilters(_.tokenize("key~created"), options).filters[0]
      );

      assert.equal(result, true);
    });

    it("should match for key~crated", function () {
      let result = _.applyFilter(
        { key: "created stuff" },
        options,
        _.createFilters(_.tokenize("key~crated"), options).filters[0]
      );

      assert.equal(result, true);
    });

    it("should NOT match for key~thing", function () {
      let result = _.applyFilter(
        { key: "created stuff" },
        options,
        _.createFilters(_.tokenize("key~thing"), options).filters[0]
      );

      assert.equal(result, false);
    });

    it("should match for created", function () {
      let result = _.applyFilter(
        { key: "created stuff" },
        options,
        _.createFilters(_.tokenize("created"), options).filters[0]
      );

      assert.equal(result, true);
    });

    it("should match for crated", function () {
      let result = _.applyFilter(
        { key: "created stuff" },
        options,
        _.createFilters(_.tokenize("crated"), options).filters[0]
      );

      assert.equal(result, true);
    });

    it("should NOT match for thing", function () {
      let result = _.applyFilter(
        { key: "created stuff" },
        options,
        _.createFilters(_.tokenize("thing"), options).filters[0]
      );

      assert.equal(result, false);
    });

    it('should match for "Text like this"', function () {
      let result = _.applyFilter(
        { key: "Text like this" },
        options,
        _.createFilters(_.tokenize('"Text like this"'), options).filters[0]
      );

      assert.equal(result, true);
    });

    it('should match for "Tet like th"', function () {
      let result = _.applyFilter(
        { key: "Text like this" },
        options,
        _.createFilters(_.tokenize('"Tet like th"'), options).filters[0]
      );

      assert.equal(result, true);
    });

    it('should NOT match for "Text like never before"', function () {
      let result = _.applyFilter(
        { key: "Text like this" },
        options,
        _.createFilters(_.tokenize('"Text like never before"'), options)
          .filters[0]
      );

      assert.equal(result, false);
    });
  });

  //  contains
  //  key:"*created stuff*"
  //  key:"*created*"
  //  "*created*"
  //  "*created stuff*"

  describe("Contains", function () {
    it('should match for key:"*created stuff*" when string is', function () {
      let result = _.applyFilter(
        {
          key: "created stuff",
        },
        options,
        _.createFilters(_.tokenize('key:"*created stuff*"'), options).filters[0]
      );

      assert.equal(result, true);
    });

    it('should match for key:"*created stuff*" when string ends', function () {
      let result = _.applyFilter(
        {
          key: "my string ends with created stuff",
        },
        options,
        _.createFilters(_.tokenize('key:"*created stuff*"'), options).filters[0]
      );

      assert.equal(result, true);
    });

    it('should match for key:"*created stuff*" whne string starts', function () {
      let result = _.applyFilter(
        {
          key: "created stuff is how this one starts",
        },
        options,
        _.createFilters(_.tokenize('key:"*created stuff*"'), options).filters[0]
      );

      assert.equal(result, true);
    });

    it('should match for key:"*created stuff*" when string contains', function () {
      let result = _.applyFilter(
        {
          key: "my string should contain created stuff but not start or end with it",
        },
        options,
        _.createFilters(_.tokenize('key:"*created stuff*"'), options).filters[0]
      );

      assert.equal(result, true);
    });

    it('should match for key:"*created*" when string is', function () {
      let result = _.applyFilter(
        {
          key: "created",
        },
        options,
        _.createFilters(_.tokenize('key:"*created*"'), options).filters[0]
      );

      assert.equal(result, true);
    });

    it('should match for key:"*created*" when string ends', function () {
      let result = _.applyFilter(
        {
          key: "my string ends with created",
        },
        options,
        _.createFilters(_.tokenize('key:"*created*"'), options).filters[0]
      );

      assert.equal(result, true);
    });

    it('should match for key:"*created*" when string starts', function () {
      let result = _.applyFilter(
        {
          key: "created is how this one starts",
        },
        options,
        _.createFilters(_.tokenize('key:"*created*"'), options).filters[0]
      );

      assert.equal(result, true);
    });

    it('should match for key:"*created*" when string is contained', function () {
      let result = _.applyFilter(
        {
          key: "my string should contain created but not start or end with it",
        },
        options,
        _.createFilters(_.tokenize('key:"*created*"'), options).filters[0]
      );

      assert.equal(result, true);
    });

    it('should match for "*created*" when string is', function () {
      let result = _.applyFilter(
        {
          key: "created",
        },
        options,
        _.createFilters(_.tokenize('"*created*"'), options).filters[0]
      );

      assert.equal(result, true);
    });

    it('should match for "*created*" when string ends', function () {
      let result = _.applyFilter(
        {
          key: "my string ends with created",
        },
        options,
        _.createFilters(_.tokenize('"*created*"'), options).filters[0]
      );

      assert.equal(result, true);
    });

    it('should match for "*created*" when string starts', function () {
      let result = _.applyFilter(
        {
          key: "created is how this one starts",
        },
        options,
        _.createFilters(_.tokenize('"*created*"'), options).filters[0]
      );

      assert.equal(result, true);
    });

    it('should match for "*created*" when string is contained', function () {
      let result = _.applyFilter(
        {
          key: "my string should contain created but not start or end with it",
        },
        options,
        _.createFilters(_.tokenize('"*created*"'), options).filters[0]
      );

      assert.equal(result, true);
    });

    it('should match for "*created stuff*" when string is', function () {
      let result = _.applyFilter(
        {
          key: "created stuff",
        },
        options,
        _.createFilters(_.tokenize('"*created stuff*"'), options).filters[0]
      );

      assert.equal(result, true);
    });

    it('should match for "*created stuff*" when string ends', function () {
      let result = _.applyFilter(
        {
          key: "my string ends with created stuff",
        },
        options,
        _.createFilters(_.tokenize('"*created stuff*"'), options).filters[0]
      );

      assert.equal(result, true);
    });

    it('should match for "*created stuff*" whne string starts', function () {
      let result = _.applyFilter(
        {
          key: "created stuff is how this one starts",
        },
        options,
        _.createFilters(_.tokenize('"*created stuff*"'), options).filters[0]
      );

      assert.equal(result, true);
    });

    it('should match for "*created stuff*" when string contains', function () {
      let result = _.applyFilter(
        {
          key: "my string should contain created stuff but not start or end with it",
        },
        options,
        _.createFilters(_.tokenize('"*created stuff*"'), options).filters[0]
      );

      assert.equal(result, true);
    });
  });

  // starts_with
  // key:"created stuff*"
  // key:created*
  // created*
  // "Text like this*"
  describe("Starts With", function () {
    it('should match for key:"created stuff*" when string is', function () {
      let result = _.applyFilter(
        {
          key: "created stuff",
        },
        options,
        _.createFilters(_.tokenize('key:"created stuff*"'), options).filters[0]
      );

      assert.equal(result, true);
    });

    it('should NOT match for key:"created stuff*" when string ends', function () {
      let result = _.applyFilter(
        {
          key: "my string ends with created stuff",
        },
        options,
        _.createFilters(_.tokenize('key:"created stuff*"'), options).filters[0]
      );

      assert.equal(result, false);
    });

    it('should match for key:"created stuff*" whne string starts', function () {
      let result = _.applyFilter(
        {
          key: "created stuff is how this one starts",
        },
        options,
        _.createFilters(_.tokenize('key:"created stuff*"'), options).filters[0]
      );

      assert.equal(result, true);
    });

    it('should NOT match for key:"created stuff*" when string contains', function () {
      let result = _.applyFilter(
        {
          key: "my string should contain created stuff but not start or end with it",
        },
        options,
        _.createFilters(_.tokenize('key:"created stuff*"'), options).filters[0]
      );

      assert.equal(result, false);
    });

    it('should match for key:"created*" when string is', function () {
      let result = _.applyFilter(
        {
          key: "created",
        },
        options,
        _.createFilters(_.tokenize('key:"created*"'), options).filters[0]
      );

      assert.equal(result, true);
    });

    it('should NOT match for key:"created*" when string ends', function () {
      let result = _.applyFilter(
        {
          key: "my string ends with created",
        },
        options,
        _.createFilters(_.tokenize('key:"created*"'), options).filters[0]
      );

      assert.equal(result, false);
    });

    it('should match for key:"created*" when string starts', function () {
      let result = _.applyFilter(
        {
          key: "created is how this one starts",
        },
        options,
        _.createFilters(_.tokenize('key:"created*"'), options).filters[0]
      );

      assert.equal(result, true);
    });

    it('should NOT match for key:"created*" when string is contained', function () {
      let result = _.applyFilter(
        {
          key: "my string should contain created but not start or end with it",
        },
        options,
        _.createFilters(_.tokenize('key:"created*"'), options).filters[0]
      );

      assert.equal(result, false);
    });

    it('should match for "created*" when string is', function () {
      let result = _.applyFilter(
        {
          key: "created",
        },
        options,
        _.createFilters(_.tokenize('"created*"'), options).filters[0]
      );

      assert.equal(result, true);
    });

    it('should NOT match for "created*" when string ends', function () {
      let result = _.applyFilter(
        {
          key: "my string ends with created",
        },
        options,
        _.createFilters(_.tokenize('"created*"'), options).filters[0]
      );

      assert.equal(result, false);
    });

    it('should match for "created*" when string starts', function () {
      let result = _.applyFilter(
        {
          key: "created is how this one starts",
        },
        options,
        _.createFilters(_.tokenize('"created*"'), options).filters[0]
      );

      assert.equal(result, true);
    });

    it('should NOT match for "created*" when string is contained', function () {
      let result = _.applyFilter(
        {
          key: "my string should contain created but not start or end with it",
        },
        options,
        _.createFilters(_.tokenize('"created*"'), options).filters[0]
      );

      assert.equal(result, false);
    });

    it('should match for "created stuff*" when string is', function () {
      let result = _.applyFilter(
        {
          key: "created stuff",
        },
        options,
        _.createFilters(_.tokenize('"created stuff*"'), options).filters[0]
      );

      assert.equal(result, true);
    });

    it('should NOT match for "created stuff*" when string ends', function () {
      let result = _.applyFilter(
        {
          key: "my string ends with created stuff",
        },
        options,
        _.createFilters(_.tokenize('"created stuff*"'), options).filters[0]
      );

      assert.equal(result, false);
    });

    it('should match for "created stuff*" whne string starts', function () {
      let result = _.applyFilter(
        {
          key: "created stuff is how this one starts",
        },
        options,
        _.createFilters(_.tokenize('"created stuff*"'), options).filters[0]
      );

      assert.equal(result, true);
    });

    it('should NOT match for "created stuff*" when string contains', function () {
      let result = _.applyFilter(
        {
          key: "my string should contain created stuff but not start or end with it",
        },
        options,
        _.createFilters(_.tokenize('"created stuff*"'), options).filters[0]
      );

      assert.equal(result, false);
    });
  });

  //  ends_with
  //  key:"*created stuff"
  //  key:*created
  //  *created
  //  "*Text like this"
  describe("Ends With", function () {
    it('should match for key:"*created stuff" when string is', function () {
      let result = _.applyFilter(
        {
          key: "created stuff",
        },
        options,
        _.createFilters(_.tokenize('key:"*created stuff"'), options).filters[0]
      );

      assert.equal(result, true);
    });

    it('should match for key:"*created stuff" when string ends', function () {
      let result = _.applyFilter(
        {
          key: "my string ends with created stuff",
        },
        options,
        _.createFilters(_.tokenize('key:"*created stuff"'), options).filters[0]
      );

      assert.equal(result, true);
    });

    it('should NOT match for key:"*created stuff" whne string starts', function () {
      let result = _.applyFilter(
        {
          key: "created stuff is how this one starts",
        },
        options,
        _.createFilters(_.tokenize('key:"*created stuff"'), options).filters[0]
      );

      assert.equal(result, false);
    });

    it('should NOT match for key:"*created stuff" when string contains', function () {
      let result = _.applyFilter(
        {
          key: "my string should contain created stuff but not start or end with it",
        },
        options,
        _.createFilters(_.tokenize('key:"*created stuff"'), options).filters[0]
      );

      assert.equal(result, false);
    });

    it('should match for key:"*created" when string is', function () {
      let result = _.applyFilter(
        {
          key: "created",
        },
        options,
        _.createFilters(_.tokenize('key:"*created"'), options).filters[0]
      );

      assert.equal(result, true);
    });

    it('should match for key:"*created" when string ends', function () {
      let result = _.applyFilter(
        {
          key: "my string ends with created",
        },
        options,
        _.createFilters(_.tokenize('key:"*created"'), options).filters[0]
      );

      assert.equal(result, true);
    });

    it('should NOT match for key:"*created" when string starts', function () {
      let result = _.applyFilter(
        {
          key: "created is how this one starts",
        },
        options,
        _.createFilters(_.tokenize('key:"*created"'), options).filters[0]
      );

      assert.equal(result, false);
    });

    it('should NOT match for key:"*created" when string is contained', function () {
      let result = _.applyFilter(
        {
          key: "my string should contain created but not start or end with it",
        },
        options,
        _.createFilters(_.tokenize('key:"*created"'), options).filters[0]
      );

      assert.equal(result, false);
    });

    it('should match for "*created" when string is', function () {
      let result = _.applyFilter(
        {
          key: "created",
        },
        options,
        _.createFilters(_.tokenize('"*created"'), options).filters[0]
      );

      assert.equal(result, true);
    });

    it('should match for "*created" when string ends', function () {
      let result = _.applyFilter(
        {
          key: "my string ends with created",
        },
        options,
        _.createFilters(_.tokenize('"*created"'), options).filters[0]
      );

      assert.equal(result, true);
    });

    it('should NOT match for "*created" when string starts', function () {
      let result = _.applyFilter(
        {
          key: "created is how this one starts",
        },
        options,
        _.createFilters(_.tokenize('"*created"'), options).filters[0]
      );

      assert.equal(result, false);
    });

    it('should NOT match for "*created" when string is contained', function () {
      let result = _.applyFilter(
        {
          key: "my string should contain created but not start or end with it",
        },
        options,
        _.createFilters(_.tokenize('"*created"'), options).filters[0]
      );

      assert.equal(result, false);
    });

    it('should match for "*created stuff" when string is', function () {
      let result = _.applyFilter(
        {
          key: "created stuff",
        },
        options,
        _.createFilters(_.tokenize('"*created stuff"'), options).filters[0]
      );

      assert.equal(result, true);
    });

    it('should match for "*created stuff" when string ends', function () {
      let result = _.applyFilter(
        {
          key: "my string ends with created stuff",
        },
        options,
        _.createFilters(_.tokenize('"*created stuff"'), options).filters[0]
      );

      assert.equal(result, true);
    });

    it('should NOT match for "*created stuff" whne string starts', function () {
      let result = _.applyFilter(
        {
          key: "created stuff is how this one starts",
        },
        options,
        _.createFilters(_.tokenize('"*created stuff"'), options).filters[0]
      );

      assert.equal(result, false);
    });

    it('should NOT match for "*created stuff" when string contains', function () {
      let result = _.applyFilter(
        {
          key: "my string should contain created stuff but not start or end with it",
        },
        options,
        _.createFilters(_.tokenize('"*created stuff"'), options).filters[0]
      );

      assert.equal(result, false);
    });
  });

  // exactly
  // key="created stuff"
  // key=created
  describe("Matches exactly", function () {
    it('should match for key="created stuff"', function () {
      let result = _.applyFilter(
        {
          key: "created stuff",
        },
        options,
        _.createFilters(_.tokenize('key="created stuff"'), options).filters[0]
      );

      assert.equal(result, true);
    });

    it('should NOT match for key="created stuf" for a value of "created stuff"', function () {
      let result = _.applyFilter(
        {
          key: "created stuff",
        },
        options,
        _.createFilters(_.tokenize('key="created stuf"'), options).filters[0]
      );

      assert.equal(result, false);
    });

    it("should match for key=created for a value of 'created'", function () {
      let result = _.applyFilter(
        {
          key: "created",
        },
        options,
        _.createFilters(_.tokenize("key=created"), options).filters[0]
      );

      assert.equal(result, true);
    });

    it('should NOT match for key=create for a value of "created stuff"', function () {
      let result = _.applyFilter(
        {
          key: "created stuff",
        },
        options,
        _.createFilters(_.tokenize("key=create"), options).filters[0]
      );

      assert.equal(result, false);
    });
  });
};
