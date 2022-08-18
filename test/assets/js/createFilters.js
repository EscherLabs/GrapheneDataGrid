const options = {};
options.filterFields = [{ type: "text", search: "title" }];
createFilters = parameters => {
  const {
    checked,
    deleted,
    sort,
    search = "",
    ...searchFields
  } = _.groupBy(parameters, "key");
  let modelFilter = { deleted: false };

  if (deleted) {
    modelFilter.deleted = !(
      deleted[0].invert ==
      (deleted[0].search[0].string == "true")
    );
  }
  if (checked) {
    modelFilter.checked = !(
      checked[0].invert ==
      (checked[0].search[0].string == "true")
    );
  }

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
      let field = _.find(options.filterFields, { search: key });
      if (!field) return false;
      filter.logic = "&&";
      filter.exact =
        gform.types[_.find(options.filterFields, { search: key }).type].base !==
        "input";
      return filter;
    })
  );

  if (search.length) {
    var searches = [].concat.apply([], _.map(search, "search"));
    _.reduce(
      options.filterFields,
      (filters, field) => {
        let filter = {
          exact: false,
          key: field.search,
          logic: "||",
          search: searches,
        };
        filters.push(filter);
        return filters;
      },
      filters
    );
  }

  return {
    model: modelFilter,
    sort: sortarray,
    or: _.filter(filters, { logic: "||" }),
    and: _.filter(filters, { logic: "&&" }),
  };
};

// export { createFilters };
exports.createFilters = createFilters;
