"use strict";
const { assert } = require("chai");

var { _ } = require("./assets/js/query");

const { tokenize } = require("./tests/tokenize");
const { create } = require("./tests/create");
const { apply } = require("./tests/apply");
const { query } = require("./tests/query");

describe("Filtering", function () {
  describe("Tokenize", tokenize.bind(this));
  describe("Create", create.bind(this));
  // describe("Apply", apply.bind(this));
  // describe("Query", query.bind(this));
});
