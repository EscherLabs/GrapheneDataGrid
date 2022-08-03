// var assert = require("assert");
const { assert } = require("chai");
var _ = require("./assets/js/lodash.min");
var tokenize = string => {
  return _.reduce(
    string.match(/(?:[^\s"]+|"[^"]*")+/g),

    (searches, search) => {
      var temp = search.match(
        /(?<invert>-)?(?<key>[^\s:<>=~]??)(?<action>[:<>=~]?)(?<search>[^\s"]+|"[^"]*")+/
      );

      let token = !!temp.groups.action
        ? temp.groups
        : {
            key: "search",
            search: search,
            invert: false,
            action: "~",
          };

      token.search = _.map(token.search.split(","), s => {
        let raw = _.trim(s, " ");

        let quoted = /"+?([^"]+)"+/.test(raw);

        raw = _.trim(s, '"');
        let looseEnd = /\*$/.test(raw);
        let looseStart = /^\*/.test(raw);

        let action = "~"; //fuzzy
        if (quoted && looseEnd && looseStart) action = "*"; //contains
        if (quoted && looseEnd && !looseStart) action = "^"; //startsWith
        if (quoted && !looseEnd && looseStart) action = "$"; //endsWith
        if (quoted && !looseEnd && !looseStart) action = "="; //endsWith

        return {
          action,
          string: raw + "",
          lower: (raw + "").toLowerCase(),
          raw,
        };
      });
      token.invert = !!token.invert;
      searches.push(token);
      return searches;
    },
    []
  );
};

describe("Tokenize", function () {
  describe("Sort", function () {
    it("should return a search object", function () {
      assert.equal(tokenize("sort title").length, 2);
      assert.equal(tokenize('"sort title"').length, 1);
      assert.equal(tokenize('"sort title"')[0].search[0].raw, "sort title");
    });
    it("should return a sort object", function () {
      assert.equal(tokenize("sort:title")[0].key, "sort");

      token_2 = tokenize("sort:title -sort:size");
      assert.equal(token_2.length, 2);
      assert.deepInclude(token_2, {
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
      assert.deepInclude(token_2, {
        invert: true,
        key: "sort",
        action: ":",
        search: [
          {
            action: "~",
            lower: "size",
            raw: "size",
            string: "size",
          },
        ],
      });
    });

    it("should return a column search  with exact matching", function () {
      assert.equal(tokenize('title:"hello"').length, 1);
    });
  });
});
