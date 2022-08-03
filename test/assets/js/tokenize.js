tokenize = string => {
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

export default tokenize;
