"use strict";
const { assert } = require("chai");

var { _ } = require("../assets/js/query");

var { models } = require("../assets/data/models");
models = _.map(models, model => {
  return { attributes: model };
});
var options = require("../assets/data/fields");

exports.create = function suite() {
  // key:"created stuff"
  // key:created
  // key~"created stuff"
  // key~created
  // created
  // "Text like this"
  describe("Fuzzy", function () {
    it("should return a search object", function () {
      let result = _.createFilters(_.tokenize('key:"created stuff"'), options);

      assert.equal(result.filters.length, 1);
      assert.equal(result.filters[0].search.length, 1);
      assert.deepInclude(result.filters, {
        invert: false,
        logic: "&&",
        key: "key",
        action: "~",
        search: [
          {
            action: "~",
            lower: "created stuff",
            raw: "created stuff",
            string: "created stuff",
          },
        ],
      });
    });

    it('should return a fuzzy filter on "key" for "created" object', function () {
      let result = _.createFilters(_.tokenize("key:created"));
      assert.equal(result.filters.length, 1);
      assert.equal(result.filters[0].search.length, 1);
      assert.deepInclude(result.filters, {
        invert: false,
        logic: "&&",
        key: "key",
        action: ":",
        search: [
          {
            action: "~",
            lower: "created",
            raw: "created",
            string: "created",
          },
        ],
      });
    });

    it('should return a fuzzy filter on "key" for "created stuff" object', function () {
      let result = _.createFilters(_.tokenize('key~"created stuff"'));
      assert.equal(result.filters.length, 1);
      assert.equal(result.filters[0].search.length, 1);
      assert.deepInclude(result.filters, {
        invert: false,
        logic: "&&",
        key: "key",
        action: "~",
        search: [
          {
            action: "~",
            lower: "created stuff",
            raw: "created stuff",
            string: "created stuff",
          },
        ],
      });
    });

    it('should return a fuzzy filter on "key" for "created" object', function () {
      let result = _.createFilters(_.tokenize("key~created"));
      assert.equal(result.filters.length, 1);
      assert.equal(result.filters[0].search.length, 1);
      assert.deepInclude(result.filters, {
        invert: false,
        logic: "&&",
        key: "key",
        action: "~",
        search: [
          {
            action: "~",
            lower: "created",
            raw: "created",
            string: "created",
          },
        ],
      });
    });

    it('should return a fuzzy search filter "created" object', function () {
      let result = _.createFilters(_.tokenize("created"), options);
      assert.equal(result.filters.length, 1);
      assert.equal(result.filters[0].search.length, 1);
      assert.deepInclude(result.filters, {
        invert: false,
        logic: "||",
        key: "key",
        action: "~",
        search: [
          {
            action: "~",
            lower: "created",
            raw: "created",
            string: "created",
          },
        ],
      });
    });
    it('should return a fuzzy search filter "Text like this" object', function () {
      // let result = _.createFilters(_.tokenize('"Text like this"'));
      let result = _.createFilters(_.tokenize('"Text like this"'), options);

      assert.equal(result.filters.length, 1);
      assert.equal(result.filters[0].search.length, 1);
      assert.deepInclude(result.filters, {
        invert: false,
        logic: "||",
        key: "key",
        action: "~",
        search: [
          {
            action: "~",
            lower: "text like this",
            raw: "Text like this",
            string: "Text like this",
          },
        ],
      });
    });

    //
  });

  //  contains
  //  key:"*created stuff*"
  //  key:"*created*"
  //  "*created*"
  //  "*Text like this*"

  describe("Contains", function () {
    it('should return a search of key containing "created stuff" object', function () {
      let result = _.createFilters(
        _.tokenize('key:"*created stuff*"'),
        options
      );

      assert.equal(result.filters.length, 1);
      assert.equal(result.filters[0].search.length, 1);
      assert.deepInclude(result.filters, {
        invert: false,
        logic: "&&",
        key: "key",
        action: "~",
        search: [
          {
            action: "*",
            lower: "created stuff",
            raw: "created stuff",
            string: "created stuff",
          },
        ],
      });
    });

    it('should return a search of key containing "created" object', function () {
      let result = _.createFilters(_.tokenize('key:"*created*"'), options);

      assert.equal(result.filters.length, 1);
      assert.equal(result.filters[0].search.length, 1);
      assert.deepInclude(result.filters, {
        invert: false,
        logic: "&&",
        key: "key",
        action: "~",
        search: [
          {
            action: "*",
            lower: "created",
            raw: "created",
            string: "created",
          },
        ],
      });
    });

    it('should return a search of key containing "created" object', function () {
      let result = _.createFilters(_.tokenize('"*created*"'), options);
      assert.equal(result.filters.length, 1);
      assert.equal(result.filters[0].search.length, 1);
      assert.deepInclude(result.filters, {
        invert: false,
        logic: "||",
        key: "key",
        action: "~",
        search: [
          {
            action: "*",
            lower: "created",
            raw: "created",
            string: "created",
          },
        ],
      });
    });

    it('should return a search of key containing "created" object', function () {
      let result = _.createFilters(_.tokenize('"*Text like this*"'), options);
      assert.equal(result.filters.length, 1);
      assert.equal(result.filters[0].search.length, 1);
      assert.deepInclude(result.filters, {
        invert: false,
        logic: "||",
        key: "key",
        action: "~",
        search: [
          {
            action: "*",
            lower: "text like this",
            raw: "Text like this",
            string: "Text like this",
          },
        ],
      });
    });
  });

  // starts_with
  // key:"created stuff*"
  // key:"created*""
  // "created*"
  // "Text like this*"

  describe("Starts With", function () {
    it('should return a search of key containing "created stuff" object', function () {
      let result = _.createFilters(_.tokenize('key:"created stuff*"'), options);

      assert.equal(result.filters.length, 1);
      assert.equal(result.filters[0].search.length, 1);
      assert.deepInclude(result.filters, {
        invert: false,
        logic: "&&",
        key: "key",
        action: "~",
        search: [
          {
            action: "^",
            lower: "created stuff",
            raw: "created stuff",
            string: "created stuff",
          },
        ],
      });
    });

    it('should return a search of key containing "created" object', function () {
      let result = _.createFilters(_.tokenize('key:"created*"'), options);

      assert.equal(result.filters.length, 1);
      assert.equal(result.filters[0].search.length, 1);
      assert.deepInclude(result.filters, {
        invert: false,
        logic: "&&",
        key: "key",
        action: "~",
        search: [
          {
            action: "^",
            lower: "created",
            raw: "created",
            string: "created",
          },
        ],
      });
    });

    it('should return a search of key containing "created" object', function () {
      let result = _.createFilters(_.tokenize('"created*"'), options);
      assert.equal(result.filters.length, 1);
      assert.equal(result.filters[0].search.length, 1);
      assert.deepInclude(result.filters, {
        invert: false,
        logic: "||",
        key: "key",
        action: "~",
        search: [
          {
            action: "^",
            lower: "created",
            raw: "created",
            string: "created",
          },
        ],
      });
    });

    it('should return a search of key containing "created" object', function () {
      let result = _.createFilters(_.tokenize('"Text like this*"'), options);
      assert.equal(result.filters.length, 1);
      assert.equal(result.filters[0].search.length, 1);
      assert.deepInclude(result.filters, {
        invert: false,
        logic: "||",
        key: "key",
        action: "~",
        search: [
          {
            action: "^",
            lower: "text like this",
            raw: "Text like this",
            string: "Text like this",
          },
        ],
      });
    });
  });

  // ends_with
  // key:"*created stuff"
  // key:"*created"
  // "*created"
  // "*Text like this"

  describe("Ends With", function () {
    it('should return a search of key containing "created stuff" object', function () {
      let result = _.createFilters(_.tokenize('key:"*created stuff"'), options);

      assert.equal(result.filters.length, 1);
      assert.equal(result.filters[0].search.length, 1);
      assert.deepInclude(result.filters, {
        invert: false,
        logic: "&&",
        key: "key",
        action: "~",
        search: [
          {
            action: "$",
            lower: "created stuff",
            raw: "created stuff",
            string: "created stuff",
          },
        ],
      });
    });

    it('should return a search of key containing "created" object', function () {
      let result = _.createFilters(_.tokenize('key:"*created"'), options);

      assert.equal(result.filters.length, 1);
      assert.equal(result.filters[0].search.length, 1);
      assert.deepInclude(result.filters, {
        invert: false,
        logic: "&&",
        key: "key",
        action: "~",
        search: [
          {
            action: "$",
            lower: "created",
            raw: "created",
            string: "created",
          },
        ],
      });
    });

    it('should return a search of key containing "created" object', function () {
      let result = _.createFilters(_.tokenize('"*created"'), options);
      assert.equal(result.filters.length, 1);
      assert.equal(result.filters[0].search.length, 1);
      assert.deepInclude(result.filters, {
        invert: false,
        logic: "||",
        key: "key",
        action: "~",
        search: [
          {
            action: "$",
            lower: "created",
            raw: "created",
            string: "created",
          },
        ],
      });
    });

    it('should return a search of key containing "created" object', function () {
      let result = _.createFilters(_.tokenize('"*Text like this"'), options);
      assert.equal(result.filters.length, 1);
      assert.equal(result.filters[0].search.length, 1);
      assert.deepInclude(result.filters, {
        invert: false,
        logic: "||",
        key: "key",
        action: "~",
        search: [
          {
            action: "$",
            lower: "text like this",
            raw: "Text like this",
            string: "Text like this",
          },
        ],
      });
    });
  });

  // exactly
  // key="created stuff"
  // key=created
  // key=created,closed

  describe("Exactly", function () {
    it('should return a search of key containing "created stuff" object', function () {
      let result = _.createFilters(_.tokenize('key="created stuff"'), options);

      assert.equal(result.filters.length, 1);
      assert.equal(result.filters[0].search.length, 1);
      assert.deepInclude(result.filters, {
        invert: false,
        logic: "&&",
        key: "key",
        action: "=",
        search: [
          {
            action: "=",
            lower: "created stuff",
            raw: "created stuff",
            string: "created stuff",
          },
        ],
      });
    });

    it('should return a search of key containing "created" object', function () {
      let result = _.createFilters(_.tokenize("key=created"), options);
      assert.equal(result.filters.length, 1);
      assert.equal(result.filters[0].search.length, 1);
      assert.deepInclude(result.filters, {
        invert: false,
        logic: "&&",
        key: "key",
        action: "=",
        search: [
          {
            action: "=",
            lower: "created",
            raw: "created",
            string: "created",
          },
        ],
      });
    });

    it('should return a search of key containing "created" object', function () {
      let result = _.createFilters(_.tokenize("key=created,closed"), options);
      assert.equal(result.filters.length, 1);
      assert.equal(result.filters[0].search.length, 2);
      assert.deepInclude(result.filters, {
        invert: false,
        logic: "&&",
        key: "key",
        action: "=",
        search: [
          {
            action: "=",
            lower: "created",
            raw: "created",
            string: "created",
          },
          {
            action: "=",
            lower: "closed",
            raw: "closed",
            string: "closed",
          },
        ],
      });
    });
  });
};
