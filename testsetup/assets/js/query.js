_.mixin({
  tokenize: string => {
    return _.reduce(
      string.match(/(?:[^\s"]+|"[^"]*")+/g),

      (searches, search) => {
        var temp =
          search.length > 3
            ? search.match(
                /(?<invert>-)?(?<key>[^\s:<>=~]+)(?<action>[:<>=~]?)(?<search>[^\s"]+|"[^"]*")+/
              )
            : { groups: false };

        let token =
          !!temp.groups && temp.groups.action
            ? temp.groups
            : {
                key: "search",
                search: search,
                invert: false,
                action: ":",
              };
        // constdefaultAction = token.action;
        token.search = _.map(token.search.split(","), s => {
          let raw = _.trim(s, " ");

          let quoted = /"+?([^"]+)"+/.test(raw);

          raw = _.trim(s, '"');
          let looseEnd = /\*$/.test(raw);
          let looseStart = /^\*/.test(raw);
          let action = "~"; //fuzzy
          switch (token.action) {
            case "~":
              break;
            case ":":
            default:
              //contains
              if (quoted && looseEnd && looseStart) action = "*";
              //startsWith
              if (quoted && looseEnd && !looseStart) action = "^";
              //endsWith
              if (quoted && !looseEnd && looseStart) action = "$";
              //exactly
              if (quoted && !looseEnd && !looseStart) action = "=";
              break;
          }

          raw = _.trim(raw, "*");

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
  },
  createFilters: (parameters, config = {}) => {
    let {
      bools = [],
      keys = [],
      fields = [],
      modelFilter = {},
      ...options
    } = config;

    const { sort, search = "", ...searchFields } = _.groupBy(parameters, "key");

    _.each(options.bools, key => {
      if (searchFields[key]) {
        modelFilter[key] = !(
          searchFields[key][0].invert ==
          (searchFields[key][0].search[0].string == "true")
        );
      }
      delete searchFields[key];
    });

    let sortarray = _.reduce(
      sort,
      (result, { invert, search }) => {
        _.each(search, ({ raw }) => {
          result.push({ invert, sort: raw });
        });

        return result;
      },
      []
    );

    let filters = _.compact(
      _.map(_.flatMap(searchFields), filter => {
        let { key, search } = filter;
        if (!fields.length) {
          filter.logic = "&&";
          // filter.exact = false;
        } else {
          let field = _.find(fields, { key: key });
          if (!field) return false;
          filter.logic = "&&";
          filter.action =
            field.base != "input"
              ? "="
              : filter.action !== ":"
              ? filter.action
              : "~";
        }
        if (filter.action == "~") {
        }

        debugger;
        filter.search = _.map(filter.search, search => ({
          ...search,
          action:
            filter.action == "~" && ["~", "="].indexOf(search.action) >= 0
              ? "~"
              : filter.action == "=" && ["~", "="].indexOf(search.action) >= 0
              ? "="
              : search.action,
        }));

        return filter;
      })
    );

    if (search.length) {
      var searches = [].concat.apply([], _.map(search, "search"));

      debugger;
      _.reduce(
        fields || [],
        (filters, field) => {
          let filter = {
            invert: false,
            // exact: false,
            action: "~",
            key: field.search || field.key,
            logic: "||",
            search: searches,
          };
          filter.search = _.map(filter.search, search => {
            search.action =
              field.base != "input"
                ? "="
                : filter.action !== ":"
                ? search.action
                : "~";
            return search;
          });
          filter.search = _.map(filter.search, search => ({
            ...search,
            action:
              filter.action == "~" && ["~", "="].indexOf(search.action) >= 0
                ? "~"
                : search.action,
          }));
          filters.push(filter);
          return filters;
        },
        filters
      );
    }
    return {
      modelFilter,
      sort: sortarray,
      filters,
    };
  },
  applyFilter: function (model, options, filter) {
    let { keys } = options;
    let atts = _.reduce(
      keys,
      (atts, key) => {
        let att = model[key][filter.key];

        att = typeof att == "object" ? _.map(att, a => a + "") : [att + ""];
        return atts.concat(att);
      },
      []
    );

    if (filter.action == "=") {
      let strArray = _.map(filter.search, "string");

      return !_.intersection(strArray, atts).length != !filter.invert;
    } else {
      //not exact

      let mapfunc;
      let finding = model.attributes[filter.key].replace(/\s+/g, " ");
      //.toLowerCase();

      if (filter.action == "~") {
        mapfunc = search => _.score(finding, search) > 0.4;
      } else {
        mapfunc = search => {
          let index = finding.indexOf(search.string);

          switch (search.action) {
            case "~": //fuzzy
              return _.score(finding.toLowerCase(), search.lower) > 0.4;
            case "*": //contains
              return index >= 0;
            case "^": //startsWith
              return index == 0;
            case "$": //endsWith
              return index == finding.length - search.string.length;
            case "=": //exactly
              return finding == search.string;
            default:
              return finding.indexOf(search.string) >= 0;
          }
        };
      }

      return !_.some(filter.search, mapfunc) != !filter.invert;
    }
  },
  query: (models, parameters, config = {}) => {
    debugger;
    let { path = "", bools = [], fields = [], sort, ...options } = config;
    if (typeof parameters == "string") {
      parameters = _.tokenize(parameters);
    }
    if (typeof parameters !== "object" && fields.length) {
      return [];
    }
    const filters = _.createFilters(parameters, {
      fields,
      sort,
      bools,
      modelFilter: options.modelFilter,
    });

    filters.sort = filters.sort.length
      ? filters.sort
      : [
          sort || {
            invert: false,
            search: (fields.length ? fields : [{ key: "id" }])[0].key,
          },
        ];
    let ordered = _.orderBy(
      _.filter(models, filters.modelFilter),
      _.map(filters.sort, ({ sort }) => {
        return path.split(".").concat([sort]).join(".");
      }),
      _.map(filters.sort, ({ invert }) => (!!invert ? "asc" : "desc"))
    );

    let orCollection = _.filter(filters.filters, { logic: "||" });
    let andCollection = _.filter(filters.filters, { logic: "&&" });
    return _.filter(ordered, model => {
      let modelFilter = _.partial(_.applyFilter, model, options);

      return (
        (andCollection.length ? _.every(andCollection, modelFilter) : true) &&
        (orCollection.length ? _.some(orCollection, modelFilter) : true)
      );
    });
  },

  score: function (base, abbr, offset) {
    offset = offset || 0; // TODO: I think this is unused... remove

    if (abbr.length === 0) return 0.9;
    if (abbr.length > base.length) return 0.0;

    for (var i = abbr.length; i > 0; i--) {
      var sub_abbr = abbr.substring(0, i);
      var index = base.indexOf(sub_abbr);

      if (index < 0) continue;
      if (index + abbr.length > base.length + offset) continue;

      var next_string = base.substring(index + sub_abbr.length);
      var next_abbr = null;

      if (i >= abbr.length) {
        next_abbr = "";
      } else {
        next_abbr = abbr.substring(i);
      }
      // Changed to fit new (jQuery) format (JSK)
      var remaining_score = _.score(next_string, next_abbr, offset + index);

      if (remaining_score > 0) {
        var score = base.length - next_string.length;

        if (index !== 0) {
          var c = base.charCodeAt(index - 1);
          if (c == 32 || c == 9) {
            for (var j = index - 2; j >= 0; j--) {
              c = base.charCodeAt(j);
              score -= c == 32 || c == 9 ? 1 : 0.15;
            }
          } else {
            score -= index;
          }
        }

        score += remaining_score * next_string.length;
        score /= base.length;
        return score;
      }
    }
    // return(0.0);
    return false;
  },

  // csvToArray: function(csvString) {
  //   var trimQuotes = function (stringArray) {
  //     if(stringArray !== null && typeof stringArray !== "undefined")
  //     for (var i = 0; i < stringArray.length; i++) {
  //         // stringArray[i] = _.trim(stringArray[i], '"');
  //         if(stringArray[i][0] == '"' && stringArray[i][stringArray[i].length-1] == '"'){
  //           stringArray[i] = stringArray[i].substr(1,stringArray[i].length-2)
  //         }
  //         stringArray[i] = stringArray[i].split('""').join('"')
  //     }
  //     return stringArray;
  //   }
  //   var csvRowArray    = csvString.split(/\r?\n/);
  //   var headerCellArray = trimQuotes(csvRowArray.shift().match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g));
  //   var objectArray     = [];
  //   while (csvRowArray.length) {

  //       var rowCellArray = trimQuotes(csvRowArray.shift().match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g));
  //       if(rowCellArray !== null){
  //           var rowObject    = _.zipObject(headerCellArray, rowCellArray);
  //           objectArray.push(rowObject);
  //       }
  //   }
  //   return(objectArray);
  // },

  //https://stackoverflow.com/questions/8493195/how-can-i-parse-a-csv-string-with-javascript-which-contains-comma-in-data
  processCsvLine: function (text) {
    var re_valid =
      /^\s*(?:'[^'\\]*(?:\\[\S\s][^'\\]*)*'|"[^"\\]*(?:\\[\S\s][^"\\]*)*"|[^,'"\s\\]*(?:\s+[^,'"\s\\]+)*)\s*(?:,\s*(?:'[^'\\]*(?:\\[\S\s][^'\\]*)*'|"[^"\\]*(?:\\[\S\s][^"\\]*)*"|[^,'"\s\\]*(?:\s+[^,'"\s\\]+)*)\s*)*$/;
    var re_value =
      /(?!\s*$)\s*(?:'([^'\\]*(?:\\[\S\s][^'\\]*)*)'|"([^"\\]*(?:\\[\S\s][^"\\]*)*)"|([^,'"\s\\]*(?:\s+[^,'"\s\\]+)*))\s*(?:,|$)/g;
    // Return NULL if input string is not well formed CSV string.
    if (!re_valid.test(text)) return null;
    var a = []; // Initialize array to receive values.
    text.replace(
      re_value, // "Walk" the string using replace with callback.
      function (m0, m1, m2, m3) {
        // Remove backslash from \' in single quoted values.
        if (m1 !== undefined) a.push(m1.replace(/\\'/g, "'"));
        // Remove backslash from \" in double quoted values.
        else if (m2 !== undefined) a.push(m2.replace(/\\"/g, '"'));
        else if (m3 !== undefined) a.push(m3);
        return ""; // Return empty string.
      }
    );
    // Handle special case of empty last value.
    if (/,\s*$/.test(text)) a.push("");
    return a;
  },
  csvToArray: function (csvString, options) {
    options = options || { skip: 0 };
    var csvRowArray = csvString.split(/\n/).slice(options.skip);
    var headerCellArray = _.processCsvLine(csvRowArray.shift()); //trimQuotes(csvRowArray.shift().match(/(".*?"|[^",]*)(?=\s*,|\s*$)/g));

    return _.map(csvRowArray, function (row) {
      return _.zipObject(headerCellArray, _.processCsvLine(row));
    });
  },
  csvify: function (data, columns, title) {
    var csv = '"' + _.map(columns, "label").join('","') + '"\n';
    labels = _.map(columns, "name");
    var empty = _.zipObject(
      labels,
      _.map(labels, function () {
        return "";
      })
    );
    csv += _.map(
      data,
      function (d) {
        return JSON.stringify(
          _.map(_.values(_.extend(empty, _.pick(d, labels))), function (item) {
            if (typeof item == "string") {
              return item.split('"').join('""');
            } else {
              return _.isArray(item) ? item.join() : item;
            }
          })
        );
        //return JSON.stringify(_.values(_.extend(empty,_.pick(d,labels))))
      },
      this
    )
      .join("\n")
      .replace(/(^\[)|(\]$)/gm, "");
    // .split('\"').join("")

    var link = document.createElement("a");
    link.setAttribute(
      "href",
      "data:text/csv;charset=utf-8," + encodeURIComponent(csv)
    );
    link.setAttribute("download", (title || "GrapheneDataGrid") + ".csv");
    document.body.appendChild(link); // Required for FF
    link.click();
    document.body.removeChild(link);
    return true;
  },
});
