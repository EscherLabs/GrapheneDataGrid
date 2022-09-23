GrapheneDataGrid = function (options) {
  if (typeof options.collections == "object") {
    this.collections = options.collections;
  } else {
    this.collections = gform.collections;
  }
  this.methods = options.methods || {};

  var actions = [
    {
      type: "danger",
      name: "delete",
      min: 1,
      label: '<i class="fa fa-times"></i> Delete',
    },
    "|",
    {
      type: "primary",
      name: "edit",
      min: 1,
      label: '<i class="fa fa-pencil"></i> Edit',
    },
    "|",
    {
      type: "success",
      name: "create",
      min: 0,
      label: '<i class="fa fa-pencil-square-o"></i> New',
    },
  ];
  this.resource = options.resource;
  this.eventBus = new gform.eventBus(
    { owner: "grid", item: "model", handlers: options.events || {} },
    this
  );
  this.on = this.eventBus.on;
  this.trigger = this.eventBus.dispatch;
  this.multiSort = () => {
    let sorters = _.filter(this._query.tokens, { key: "sort" });
    // this.applyQuery(this.models, this._query.tokens);

    // this.filter.trigger(["change","input"]);;

    this.$el
      .find(".reverse, [data-sort]")
      .removeClass("text-primary")
      .find("i")
      .attr("class", "fa fa-sort text-muted");
    let sortSection = this.$el.find(".table-sort")[0];

    _.each(sorters, ({ key, invert, search }) => {
      _.each(search, ({ raw }) => {
        let localsearch = _.reduce(
          this.filterMap,
          (result, value, key) => {
            result[value] = key;
            return result;
          },
          {}
        )[raw];
        let targetEl = sortSection.querySelector(
          `[data-sort=${localsearch}] i`
        );
        gform.addClass(targetEl, invert ? "fa-sort-desc" : "fa-sort-asc");
        gform.addClass(targetEl, "text-primary");
      });
    });
  };
  this._query = {
    _obj: [],
    _string: "",
    load: value => {
      this._query.data = this._query.string = value;
    },
    tags: tokens =>
      _.reduce(
        tokens || this._query.tokens,
        (result, search) => {
          let strings = _.map(search.search, ({ string }) => string).join(", ");
          if (strings.length) {
            result += _.trim(
              gform.renderString(
                '<span data-key="{{key}}" {{#invert}}data-invert=true{{/invert}} class="query-tag query-tag-{{#invert}}invert{{/invert}}{{^invert}}key{{/invert}}"><span>{{key}} {{action}} {{strings}} </span><svg class="_remove" style=";" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></span>',
                {
                  ...search,
                  strings,
                }
              ),
              ","
            );
          }
          return result;
        },
        ""
      ),
  };

  Object.defineProperty(this._query, "data", {
    get: () => this.filter.toJSON(),
    set: tokens => {
      debugger;
      let filterData = _.reduce(
        typeof tokens == "string" ? _.tokenize(tokens) : tokens,
        (r, item) => {
          r[item.key] = r[item.key] || [];
          r[item.key].push(item);
          return r;
        },
        {}
      );
      this.filterValues = {};
      _.each(
        filterData,
        function (item, index) {
          let field = _.find(this.options.filterFields, { search: index });
          if (typeof field !== "undefined") {
            if (typeof item !== "string") {
              // this.filterValues[_field.id] = JSON.stringify(item);

              this.filterValues[field.id] =
                field.type == "text"
                  ? _.join(
                      _.map(item[0].search, ({ raw }) => raw),
                      " "
                    )
                  : JSON.stringify(item);
            } else {
              this.filterValues[field.id] = item;
            }
          }
        }.bind(this)
      );
      debugger;
      this.filter.set();
      this.filter.set(this.filterValues);
      this.filter.trigger(["change"]);
      // this.filterValues = this.filter.toJSON();
    },
  });

  Object.defineProperty(this._query, "tokens", {
    get: () => [...this._query._obj],
    set: value => {
      if (!_.isEqual(value, this._query._obj)) {
        this._query._obj = value;
      }
      this._query._string = _.queryString(value);
      this.multiSort();

      let qEL = this.$el.find('[name="query"]');
      if (qEL[0] !== document.activeElement) {
        qEL.val(_.trimStart(this._query._string));
      } else {
        this._query.data = this._query.tokens;
      }

      this.draw();
    },
  });
  Object.defineProperty(this._query, "string", {
    get: () => this._query._string || "",
    set: value => {
      if (_.trim(value) == _.trim(this._query._string)) return;
      this._query.tokens = _.tokenize(value);

      // this.multiSort();
      // let qEL = this.$el.find('[name="query"]');
      // if (qEL[0] !== document.activeElement) qEL.val(_.trimStart(value));
    },
  });

  options = _.extend(
    {
      filter: true,
      actions: [
        { name: "create" },
        "|",
        { name: "edit" },
        "|",
        { name: "delete" },
      ],
      sort: true,
      search: true,
      download: true,
      upload: true,
      columns: true,
      id: gform.getUID(),
    },
    options
  );
  if (typeof options.actions == "object" && options.actions.length) {
    options.actions = _.map(options.actions, function (event) {
      // return _.extend({global:false},event)
      var temp = _.find(actions, { name: event.name });
      if (typeof temp !== "undefined") {
        event = _.defaultsDeep(event, temp);
      }
      return event;
    });
  } else {
    options.actions = false;
  }

  var loaded = false;
  if (window.localStorage && options.name) {
    try {
      loaded = JSON.parse(localStorage.getItem("dg_" + options.name));
    } catch (e) {}
  }
  if (typeof options.item_template !== "string") {
    if (window.outerWidth > 767 || window.outerWidth == 0) {
      options.item_template = gform.stencils["data_grid_row"];
    } else {
      this.mobile = true;
      options.item_template = gform.stencils["mobile_row"];
    }
  }
  this.toJSON = function () {
    return _.map(this.getModels(), "attributes");
  };
  this.filterValues = {};
  this.draw = function (models) {
    _.each(
      this.summary.items,
      function (item) {
        this.$el
          .find(".filter #" + item.id + ",[data-sort=" + item.id + "]")
          .toggle(item.isEnabled);
      }.bind(this)
    );

    options.search = _.compact(this.filterValues);
    _.each(options.search, function (item, index) {
      if (!item && item !== 0) {
        delete options.search[index];
      }
    });
    var pagebuffer = options.pagebuffer || 2;
    if (!models && this._query.string == "") {
      if (
        this.$el.find('[name="search"]').length &&
        this.$el.find('[name="search"]').val().length
      ) {
        this.searchAll(this.$el.find('[name="search"]').val());
      } else {
        this.search(options);
      }
    } else {
      this._query.string =
        typeof models == "string" ? models : this._query.string || "";
      models = this._query.string
        ? this.applyQuery(this.models, this._query.string)
        : models;
      this.lastGrabbed = models.length;
      this.filtered = models;
    }

    var renderObj = {};
    options.pagecount = Math.ceil(this.lastGrabbed / options.count);
    renderObj.pages = [];

    if (options.page > options.pagecount) {
      options.page = options.pagecount || 1;
    }
    var showing =
      this.lastGrabbed > options.count * options.page
        ? options.count * options.page
        : this.lastGrabbed;

    var fragment = document.createDocumentFragment();
    _.each(this.grab(options), function (model) {
      // var row = document.createElement('tr');
      // row.innerHTML =gform.renderString(view,model)
      // row.setAttribute("class", 'filterable grid-row'+(model.waiting() ? " warning" : ""));
      // row.setAttribute('data-id', model.id);
      fragment.appendChild(model.draw());
    });
    var target = this.$el[0].querySelector(".list-group");
    if (target !== null) {
      target.innerHTML = "";
      target.appendChild(fragment);
    }

    var startpage = options.page - pagebuffer;
    if (startpage < 1) {
      startpage = 1;
    }
    var endpage = options.page + pagebuffer;
    if (endpage > options.pagecount) {
      endpage = options.pagecount;
    }

    for (var i = startpage; i <= endpage; i++) {
      var page = { name: i };
      if (options.page == i) {
        page.active = "active";
      }
      renderObj.pages.push(page);
    }
    renderObj.size = this.lastGrabbed;
    renderObj.last = showing;
    renderObj.first = options.count * (options.page - 1) + 1;

    renderObj.multiPage = endpage > startpage;
    renderObj.isFirst = options.page == 1;
    renderObj.isLast = options.page == options.pagecount;
    renderObj.showLast = options.pagecount == endpage;
    renderObj.showFirst = startpage == 1;
    renderObj.checked_count = this.getSelected().length;

    renderObj.entries = _.map(
      options.entries,
      function (item) {
        return { value: item, selected: item == options.count };
      },
      options
    );

    this.renderObj = renderObj;
    // this.$el.find('.paginate-footer').html(templates['data_grid_footer'].render(this.renderObj, templates));
    this.updateCount();
    this.$el.find("#tags").html(this._query.tags());

    this.$el
      .find(".paginate-footer")
      .html(gform.render("data_grid_footer", this.renderObj));

    this.fixStyle();
    if (window.localStorage && options.name) {
      localStorage.setItem(
        "dg_" + options.name,
        JSON.stringify(this.state.get())
      );
    }
  };

  var changePage = function (e) {
    e.stopPropagation();
    switch (e.currentTarget.dataset.page) {
      case "inc":
        options.page++;
        if (options.page > options.pagecount) {
          options.page = options.pagecount;
        }
        break;
      case "dec":
        options.page--;
        if (options.page < 1) {
          options.page = 1;
        }
        break;
      default:
        options.page =
          parseInt(e.currentTarget.dataset.page) || options.pagecount;
    }
    this.draw();
  };

  var processSort = function (sortField, reverse) {
    if (typeof sortField == "undefined" || sortField == true) {
      this.$el
        .find(".reverse, [data-sort]")
        .removeClass("text-primary")
        .find("i")
        .attr("class", "fa fa-sort text-muted");
      this.$el.find(".sortBy").val("true");
      options.reverse = false;
    } else {
      if (typeof reverse == "undefined") {
        if (options.sort == sortField) {
          options.reverse = !options.reverse;
        } else {
          options.reverse = false;
        }
      } else {
        options.reverse = reverse;
      }
      var current = sortField
        ? this.$el.find(
            ".reverse, [data-sort=" +
              _.find(this.options.filterFields, { search: sortField }).id +
              "]"
          )
        : undefined;
      if (typeof current !== "undefined") {
        if (options.reverse) {
          current.find("i").attr("class", "fa fa-sort-asc");
        } else {
          current.find("i").attr("class", "fa fa-sort-desc");
        }
        current.siblings("[data-sort]").removeClass("text-primary");
        current
          .siblings("[data-sort]")
          .find("i")
          .attr("class", "fa fa-sort text-muted");
        current.addClass("text-primary");
      }
    }
    options.sort = sortField;
    this.draw();
  }.bind(this);

  var options = _.extend(
    { count: options.count || 25, page: 1, sort: "createdAt", reverse: false },
    options
  );

  // if(typeof options.filters !== 'undefined'){
  // 	options.filters = _.map(options.filters, function(fieldIn){
  // 		var parent = parent || null;
  // 		fieldIn.type = fieldIn.type || 'text';
  // 		//work gform.default in here
  // 		var field = _.assignIn({
  // 				name: (gform.renderString(fieldIn.label)||'').toLowerCase().split(' ').join('_'),
  // 				id: gform.getUID(),
  // 				// type: 'text',
  // 				label: fieldIn.legend || fieldIn.name,
  // 				validate: [],
  // 				valid: true,
  // 				parsable:true,
  // 				visible:true,
  // 				editable:true,
  // 				array:false,
  // 				offset: 0,
  // 		}, this.opts, gform.default,(gform.types[fieldIn.type]||gform.types['text']).defaults, fieldIn)
  // 		if(field.name == ''){field.name = field.id;}
  // 		field.item = fieldIn;
  // 		return field;
  // 	})
  // }
  options.schema = options.schema || options.form.fields;
  options.schema = _.map(options.schema, item => {
    return "defaults" in gform.types[item.type || "text"]
      ? { ...gform.types[item.type || "text"].defaults, ...item }
      : item;

    // options.schema = _.map(options.schema || options.form.fields, field => {
    //   field.name =
    //     (field.name ||
    //       (
    //         gform.renderString(
    //           field.legend || field.label || field.title,
    //           field
    //         ) || ""
    //       )
    //         .toLowerCase()
    //         .split(" ")
    //         .join("_") ||
    //       field.id) + "";
    //   return field;
  });
  options.filterFields = _.map(_.extend({}, options.schema), function (val) {
    // val = _.omit(gform.normalizeField.call(new gform({options:{default:{type:'text'}}}) ,val),'parent','columns');
    val = _.omit(
      gform.field
        .normalize(new gform({ options: { default: { type: "text" } } }))
        .call(null, {}, val),
      "parent",
      "columns"
    );
    // name = val.name;
    val.value = "";
    switch (val.type) {
      case "checkbox":
        val.format = { label: "{{label}}" };

        var temp = new gform.mapOptions(val);
        val.options = temp.getoptions();
        val.options = _.defaults(val.options, [
          { label: "False", value: "false" },
          { label: "True", value: "true" },
        ]);
      case "radio":
      case "smallcombo":
      case "combobox":
        val.type = "select";
      case "select":
        val.placeholder = false;
        val.multiple = false;
        var temp = _.pick(val, ["options", "max", "min", "path", "format"]);
        val = _.omit(val, ["options", "max", "min", "path", "format"]);
        temp.type = "optgroup";
        if (options.query) {
          val.options = [temp];
          val.type = "filter";
        } else {
          val.options = [
            {
              type: "optgroup",
              options: [{ label: "No Filter", value: "" }],
              format: { label: "{{label}}" },
            },
            temp,
          ];
        }

        break;

      case "fieldset":
        val.type = "text";

        if (!val.template) {
          val.template = _.map(val.fields, function (field) {
            return "{{attributes." + val.name + "." + field.name + "}}";
          });
          val.template = val.template.join("<br>");
        }
        val = _.omit(val, ["fields"]);
        break;

      case "hidden":
        break;
      default:
        val.type = "text";
    }

    if (val.options && typeof val.options == "object") {
      // && !_.isArray(val.options)){
      val.options = _.map(val.options, function (item) {
        if (typeof item == "object") {
          return _.omit(item, "selected");
        } else {
          return item;
        }
      });
    } else {
    }
    val.id = val.id || gform.getUID();
    val.search = val.name;
    val.name = val.id;
    val.show = [];
    val.edit = [];
    val.show = [];
    delete val.delete;
    delete val.limit;
    delete val.size;
    delete val.pre;
    delete val.opst;
    // val.isEnabled = true;
    val.edit = true;
    val.help = "";
    val.array = false;
    return val;
  });
  if (typeof options.columns == "object") {
    options.filterFields = _.filter(options.filterFields, function (item) {
      return (
        _.includes(options.columns, item.name) ||
        _.includes(options.columns, item.id)
      );
    });
  }

  var summary = {
    "[[": "{{",
    "]]": "}}",
    checked_count: 0,
    items: _.map(options.filterFields, function (val) {
      var name = val.search || val.label.split(" ").join("_").toLowerCase();

      if (val.template) {
        name = val.template; //.replace(/{{value}}/gi, '{{attributes.'+ name + '}}');
      } else {
        // name = '{{attributes.'+ name + '}}'
        name = "{{display." + name + "}}";
      }
      // else{
      // 	switch(val.type){
      // 		case 'date':
      // 			name = '<span data-moment="{{attributes.'+name+'}}" data-format="L"></span>'
      // 			break;
      // 		case 'select':
      // 				if(options.inlineEdit){
      // 					name = '<span data-popins="'+name+'"></span>';
      // 				}else{
      // 					name = '{{display.'+ name + '}}'
      // 				}
      // 			break;
      // 		case 'color':
      // 			name = '<div class="btn btn-default" style="background-color:{{attributes.'+name+'}}">{{attributes.'+name+'}}</div> {{attributes.'+name+'}}'
      // 			break;
      // 		default:
      // 			// name = '{{attributes.'+ name + '}}'
      // 			if(options.inlineEdit){
      // 				name = '<span data-popins="'+name+'"></span>';
      // 			}else{
      // 				name = '{{attributes.'+ name + '}}'
      // 			}
      // 	}
      // }
      return {
        isEnabled: typeof val.showColumn == "undefined" || val.showColumn,
        label: val.label,
        name: name,
        cname: val.name || val.label.split(" ").join("_").toLowerCase(),
        id: val.id,
        visible: !(val.type == "hidden"),
      };
    }),
  };

  options.entries = options.entries || [25, 50, 100];
  summary.options = options;

  this.summary = summary;
  var template;
  if (options.template) {
    // template= Hogan.compile(Hogan.compile(options.template).render(summary, templates));
    template = template = gform.renderString(options.template, summary);
  } else {
    if (!this.mobile) {
      // template = Hogan.compile(templates['table'].render(summary, templates));
      template = gform.render("data_grid", summary);
    } else {
      // template = Hogan.compile(templates['mobile_data_grid'].render(summary, templates));
      template = gform.render("mobile_data_grid", summary);
    }
  }
  var actions = {
    create: function (event) {
      var fields = options.schema;
      if (typeof options.create == "object") {
        fields = options.create.fields;
      }
      new gform({
        name: "modal",
        data: options.defaultData || {},
        table: this,
        collections: this.collections,
        methods: this.methods,
        events: (options.create || options.form || {}).events,
        actions: [
          { type: "cancel", modifiers: "btn btn-danger pull-left" },
          { type: "save" },
          {
            type: "hidden",
            name: "_method",
            value: "create",
            parse: function () {
              return false;
            },
          },
        ],
        legend: '<i class="fa fa-pencil-square-o"></i> Create New',
        fields: fields,
      })
        .on(
          "save",
          function (e) {
            if (e.form.validate(true)) {
              this.add(e.form.get(), { validate: false });
              e.form.trigger("close");
            }
          }.bind(this)
        )
        .on("cancel", function (e) {
          e.form.trigger("close");
        })
        .modal();
      if (event.data) {
        gform.instances.modal.set(event.data);
      }
    },
    edit: function (event) {
      if (this.getSelected().length > 1) {
        if (
          typeof this.options.multiEdit == "undefined" ||
          this.options.multiEdit.length == 0
        ) {
          return;
        }
        var selectedModels = this.getSelected();
        if (selectedModels.length == 0) {
          return;
        }
        //get the attributes from each model
        var temp = _.map(selectedModels, function (item) {
          return item.attributes;
        }); //_.pick(item.attributes;})
        //get the fields that are common between them
        var common_fields = _.filter(this.options.multiEdit, function (item) {
          return _.uniq(_.map(temp, item)).length == 1;
        });
        //get the schema fields matching from above
        // if(common_fields.length == 0) {
        // 	$(gform.render('modal_container',{title: "Common Field Editor ",footer:'<div class="btn btn-danger" style="margin-right:20px" data-dismiss="modal">Done</div>', body:'<div class="alert alert-warning">No eligible fields have been found for editing.</div>'})).modal();
        // } else {
        var newSchema = _.filter(this.options.schema, function (item) {
          return common_fields.indexOf(item.name) >= 0;
        });
        if (newSchema.length > 0) {
          new gform({
            collections: this.collections,
            methods: this.methods,
            events: (options.edit || options.form || {}).events,
            legend: "(" + selectedModels.length + ") Common Field Editor",
            actions: [
              { type: "cancel", modifiers: "btn btn-danger pull-left" },
              { type: "save" },
              {
                type: "hidden",
                name: "_method",
                value: "edit",
                parse: function () {
                  return false;
                },
              },
            ],
            fields: newSchema,
            data: _.extend(
              {},
              _.pick(selectedModels[0].attributes, common_fields)
            ),
          })
            .on(
              "save",
              function (selectedModels, e) {
                if (e.form.validate(true)) {
                  var newValues = e.form.get();
                  _.map(
                    selectedModels,
                    function (model) {
                      model.update(newValues);
                      this.eventBus.dispatch("model:edited", model);
                    }.bind(this)
                  );

                  e.form.trigger("close");
                }
              }.bind(this, selectedModels)
            )
            .on(
              "close",
              function () {
                this.draw();
                this.eventBus.dispatch("edited");
              }.bind(this)
            )
            .on("cancel", function (e) {
              e.form.trigger("close");
            })
            .modal();
        } else {
          $(
            gform.render("modal_container", {
              title: "Common Field Editor ",
              footer:
                '<div class="btn btn-danger" style="margin-right:20px" data-dismiss="modal">Done</div>',
              body: '<div class="alert alert-warning">No eligible fields have been found for editing.</div>',
            })
          ).modal();
        }
        // }
      } else {
        var fields = options.schema;
        if (typeof options.edit == "object") {
          fields = options.edit.fields;
        }
        let model = event.model || this.getSelected()[0];
        if (typeof model == "undefined") return;
        new gform({
          collections: this.collections,
          methods: this.methods,
          events: (options.edit || options.form || {}).events,
          name: "modal",
          actions: [
            { type: "cancel", modifiers: "btn btn-danger pull-left" },
            { type: "save" },
            {
              type: "hidden",
              name: "_method",
              value: "edit",
              parse: function () {
                return false;
              },
            },
          ],
          legend: '<i class="fa fa-pencil-square-o"></i> Edit',
          data: model.attributes,
          fields: fields,
          model: model,
        })
          .on(
            "save",
            function (e) {
              if (e.form.validate(true)) {
                // this.getSelected()[0].set(_.extend({}, this.getSelected()[0].attributes, e.form.toJSON()));
                e.form.options.model.set(e.form.toJSON());
                this.eventBus.dispatch("edited");
                this.eventBus.dispatch("model:edited", e.form.options.model);
                this.draw();
                e.form.trigger("close");
              }
            }.bind(this)
          )
          .on("cancel", function (e) {
            e.form.trigger("close");
          })
          .modal();
      }
    },
    delete: function (event) {
      var checked_models = this.getSelected();
      if (checked_models.length) {
        if (
          confirm(
            "Are you sure you want to delete " +
              checked_models.length +
              " records? \nThis operation can not be undone.\n\n"
          )
        ) {
          _.each(
            checked_models,
            function (item) {
              item.delete();
              this.eventBus.dispatch("model:deleted", item);
            }.bind(this)
          );
          this.eventBus.dispatch("deleted");
          this.draw();
        }
      }
    },
    mark: function (e) {
      e.model.toggle();
    },
  };
  function handleFiles(table, e) {
    var files = this.files;
    // Check for the various File API support.
    if (window.FileReader) {
      // FileReader are supported.
      (function (fileToRead) {
        var reader = new FileReader();
        // Read file into memory as UTF-8
        reader.readAsText(fileToRead);
        reader.onload = function (event) {
          var csv = event.target.result;
          var temp = _.csvToArray(csv);
          //   CSVParser
          var valid = true;

          $("#myModal").remove();
          var tempForm = gform.create(
            gform.render("modal_container", {
              title: "Importing CSV ",
              footer:
                '<div class="btn btn-danger" data-dismiss="modal">Cancel</div>',
              body: '<div class="progress"><div class="progress-bar progress-bar-striped active" role="progressbar" aria-valuenow="50" aria-valuemin="0" aria-valuemax="100" style="width: 0%"><span class="sr-only">50% Complete</span></div></div><div class="status">Validating Items...</div>',
            })
          );
          var ref = $(tempForm.querySelector("#myModal"));
          document.body.appendChild(ref[0]);
          ref.modal();
          ref.on(
            "hidden.bs.modal",
            function () {
              this.importing = false;
            }.bind(this)
          );

          var itemCount = temp.length;
          var totalProgress = itemCount * 2;
          var items = [];
          this.importing = true;

          var keys = _.map(temp[0], function (item, key) {
            var search = _.find(options.schema, { label: key });
            return search == null ? { name: key, label: key } : search;
          });
          for (var i = 0; i < temp.length; i++) {
            if (!this.importing) return false;
            if (keys.length == _.values(temp[i]).length) {
              var newtemp = {};
              _.each(keys, function (key) {
                newtemp[key.name] = temp[i][key.label] || "";
              });
              valid = table.validate(newtemp);
              if (!valid) {
                break;
              }
              items.push(valid);
            } else {
              itemCount--;
            }
            ref.find(".progress-bar").width((i / totalProgress) * 100 + "%");
          }

          if (valid) {
            ref.find(".status").html("Adding Items...");
            for (var i = 0; i < items.length; i++) {
              if (!this.importing) return false;
              table.add(items[i], { draw: false });
              ref
                .find(".progress-bar")
                .width(((i + itemCount) / totalProgress) * 100 + "%");
            }
          } else {
            ref.find(".btn").html("Done");
            ref.find(".status").html(
              '<div class="alert alert-danger">Error(s) in row ' +
                i +
                ", failed to validate!<ul><li>" +
                _.filter(table.errors, function (item) {
                  return item;
                }).join("</li><li>") +
                "</li></div>"
            );
            return;
          }
          ref
            .find(".status")
            .html(
              '<div class="alert alert-success">Successfully processed file, ' +
                itemCount +
                " rows were added!</div>"
            );
          ref.find(".btn").toggleClass("btn-danger btn-success").html("Done");
          ref.find(".progress").hide();

          if (typeof table.options.sortBy !== "undefined") {
            table.models = _.sortBy(
              table.models,
              function (obj) {
                return obj.attributes[this.options.sortBy];
              }.bind(table)
            ).reverse();
          }

          if (typeof table.options.onBulkLoad == "function") {
            table.options.onBulkLoad();
          }
          table.draw();
        };
        reader.onerror = function (evt) {
          if (evt.target.error.name == "NotReadableError") {
            alert("Can not read file !");
          }
        };
      })(files[0]);
      e.currentTarget.value = "";
    } else {
      alert("FileReader is not supported in this browser.");
    }
  }

  function onload($el) {
    this.$el = $el;
    if ($el.find(".filter").length) {
      this.filter = new gform(
        {
          actions: [],
          collections: this.collections,
          name: "filter" + this.options.id,
          clear: false,
          fields: options.filterFields,
          default: {
            target: function () {
              return (
                '[name="' + this.name + '"],[data-inline="' + this.name + '"]'
              );
            },
            hideLabel: true,
            type: "text",
            format: { label: "{{label}}", value: "{{value}}" },
          },
        },
        $el.find(".filter")[0]
      ).on(
        "input",
        function () {
          this.$el.find('[name="search"]').val("");
          this.filterValues = this.filter.toJSON();
          // if (options.query) {
          let filterString = _.reduce(
            this._query.data,
            (result, item, key) => {
              if (typeof item !== "object") {
                let quotes = item.indexOf(" ") >= 0;
                result += (item + "").length
                  ? " " +
                    this.filterMap[key] +
                    ":" +
                    (quotes ? '"' : "") +
                    item +
                    (quotes ? '"' : "")
                  : "";
              } else {
                _.each(item, search => {
                  result += gform.renderString(
                    " {{#invert}}-{{/invert}}{{key}}{{action}}{{strings}}",
                    {
                      ...search,
                      strings: _.map(
                        search.search,
                        ({ string }) => string
                      ).join(","),
                    }
                  );
                });
              }
              // console.log(result);
              return result;
            },
            ""
          );
          this._query.string =
            filterString +
            " " +
            _.queryString(
              _.filter(
                this._query.tokens,
                ({ key }) => ["sort", "search"].indexOf(key) > -1
              )
            );

          // this.$el.find("#tags").html(this.tags);
          // this.$el.find("#tags").html(this._query.tags());
          // this.$el.find('[name="query"]').val(_.trim(this._query.string), " ");
          this.draw();
        }.bind(this)
      );

      this.filter.set();
    }
    this.checkForm = new gform(
      _.assign(
        {},
        {
          collections: this.collections,
          name: "internal" + this.options.id,
          fields: options.schema,
        },
        options.form || {}
      )
    ).on(
      "change",
      function () {
        _.each(this.models, function (model) {
          model.update(null, true);
        });
      }.bind(this)
    );
    this.updateCount = function (count) {
      var count = count || this.getSelected().length;
      this.summary.checked_count = count;
      if (!this.mobile) {
        this.$el
          .find('[name="actions"]')
          .html(gform.render("actions", this.summary));
      }
      _.each(
        this.$el.find(".grid-action"),
        function (i) {
          var event = _.assign(
            { max: 10000, min: 0 },
            _.find(this.options.actions, { name: i.dataset.event })
          );
          if (
            this.summary.checked_count >= event.min &&
            this.summary.checked_count <= event.max
          ) {
            gform.removeClass(i, "disabled");
          } else {
            gform.addClass(i, "disabled");
          }
        }.bind(this)
      );

      this.$el.find('[name="count"]').html(gform.render("count", this.summary));

      var checkbox = this.$el.find('[name="select_all"].fa');

      if (count > 0 && count == this.getModels().length) {
        checkbox.attr("class", "fa fa-2x fa-check-square-o");
      } else if (count == 0) {
        checkbox.attr("class", "fa fa-2x fa-square-o");
      } else {
        checkbox.attr("class", "fa fa-2x fa-minus-square-o");
      }
    };
    this.load = function (data) {
      _.each(this.models, function (model) {
        model.delete();
      });
      this.models = [];
      if (data) {
        for (var i in data) {
          this.models.push(
            new gridModel(this, data[i], {
              "*": [
                function (e) {
                  e.model.owner.eventBus.dispatch("model:" + e.event, e.model);
                },
              ],
              check: [
                function (e) {
                  e.model.owner.draw();
                },
              ],
            })
          );
        }
      }
      if (typeof this.options.sortBy !== "undefined") {
        this.models = _.sortBy(
          this.models,
          function (obj) {
            return obj.attributes[this.options.sortBy];
          }.bind(this)
        ).reverse();
      }

      if (loaded) {
        this.state.set(loaded);
        loaded = false;
      }
      this.draw();
    };

    this.view = gform.renderString(options.item_template, summary);

    // if(options.data) {
    // 	for(var i in options.data) {
    // 		this.models.push(new gridModel(this, options.data[i],{
    // 		'*':[function(e){
    // 		e.model.owner.eventBus.dispatch('model:'+e.event,e.model)
    // 		}],
    // 		'check': [function(e){
    // 			e.model.owner.draw();
    // 		}]
    // 		})
    // 		);

    // 	}
    // }
    // if(typeof this.options.sortBy !== 'undefined'){
    // 	this.models = _.sortBy(this.models, function(obj) { return obj.attributes[this.options.sortBy]; }.bind(this)).reverse();
    // }

    this.$el.on("change", ".csvFileInput", _.partial(handleFiles, this));
    this.$el.on(
      "click",
      '[name="bt-upload"]',
      function () {
        this.$el.find(".csvFileInput").click();
      }.bind(this)
    );
    this.$el.on("click", '[name="bt-download"]', this.getCSV.bind(this));
    this.$el.on("click", "[data-page]", changePage.bind(this));
    this.$el.on("click", "#tags", e => {
      if (e.target instanceof SVGElement) {
        switch (e.target.parentElement.dataset.key) {
          case "sort":
            let index = _.findIndex(this._query.tokens, {
              invert: !!e.target.parentElement.dataset.invert,
              key: e.target.parentElement.dataset.key,
            });
            if (e.target.classList.contains("_remove")) {
              e.currentTarget.removeChild(e.target.parentElement);
              let tokens = this._query.tokens;
              tokens.splice(index, 1);
              this._query.tokens = tokens;
            } else {
            }

            break;

          case "search":
            let temp = this._query.string
              .split(
                _.trim(e.target.parentElement.textContent.split("search :")[1])
              )
              .join("");
            this._query.string = temp;
            break;
          default:
            let item = _.reduce(
              this.filterMap,
              (result, value, key) => {
                result[value] = key;
                return result;
              },
              {}
            )[e.target.parentElement.dataset.key];
            if (this.filter.find(item).type == "filter") {
              console.log(
                typeof e.target.parentElement.dataset.invert == "undefined"
              );
              _.each(
                _.filter(this.filter.find(item)._items, {
                  value:
                    (typeof e.target.parentElement.dataset.invert ==
                      "undefined") +
                    "",
                }),
                field => {
                  field.set("");
                }
              );
            } else {
              this.filter.find(item).set(null);
            }

            this.filter.trigger(["change", "input"]);
        }
        // if (e.target.parentElement.dataset.key == "sort") {
        //   e.currentTarget.removeChild(e.target.parentElement);
        //   let index = _.findIndex(this._query.tokens, {
        //     invert:
        //       e.target.parentElement.classList.contains("query-tag-invert"),
        //     key: e.target.parentElement.dataset.key,
        //   });
        //   let tokens = this._query.tokens;
        //   tokens.splice(index, 1);
        //   this._query.tokens = tokens;
        //   // this.filter.trigger(["change","input"]);;

        //   // multiSort();
        // } else {
        //   let item = _.reduce(
        //     this.filterMap,
        //     (result, value, key) => {
        //       result[value] = key;
        //       return result;
        //     },
        //     {}
        //   )[e.target.parentElement.dataset.key];

        //   this.filter
        //     .find(item)
        //     .set(this.filter.find(item).type == "filter" ? null : "");
        //   this.filter.trigger(["change","input"]);;
        // }
      } else {
        if (
          e.target.parentElement.classList.contains("query-tag") &&
          e.target instanceof HTMLSpanElement
        ) {
          // let el = document.createElement("input");
          // el.value = e.target.innerText;
          // e.target.parentElement.insertBefore(
          //   el,
          //   e.target.parentElement.lastChild
          // );
          // el.focus();
          // e.target.parentElement.removeChild(e.target);
        }
      }
    });

    this.$el.on(
      "click",
      ".columnEnables label",
      function (e) {
        e.stopPropagation();
        _.find(this.summary.items, {
          id: e.currentTarget.dataset.field,
        }).isEnabled = e.currentTarget.childNodes[0].checked;
        this.view = gform.renderString(options.item_template, summary);

        this.draw();
      }.bind(this)
    );

    this.$el.on(
      "click",
      ".grid-row",
      function (e) {
        this.eventBus.dispatch(
          "click",
          _.find(this.models, { id: e.currentTarget.dataset.id })
        );
      }.bind(this)
    );

    this.$el.on(
      "change",
      '[name="count"]',
      function (e) {
        options.count = parseInt(e.currentTarget.value, 10);
        this.draw();
      }.bind(this)
    );
    this.$el.on(
      "input",
      '[name="search"]',
      _.debounce(
        function (e) {
          this.draw();
        }.bind(this),
        300
      )
    );

    this.$el.on(
      "input",
      '[name="query"]',
      _.debounce(
        function (e) {
          this._query.string = e.currentTarget.value;
          // this.filter.trigger(["change","input"]);;

          this.draw();
        }.bind(this),
        300
      )
    );
    this.$el.on(
      "click",
      '[name="select_all"]',
      function (e) {
        var checked_models = this.getSelected();

        if (checked_models.length || this.getModels().length == 0) {
          _.each(checked_models, function (item) {
            item.toggle(false, true);
          });
        } else {
          _.each(this.filtered, function (item) {
            item.toggle(true, true);
          });
        }
        this.draw();
      }.bind(this)
    );

    this.resetSearch = function () {
      this.$el.find('[name="search"]').val("");

      // reset filter form if it exists
      // if (!options.query) {
      if (this.filter) {
        this.filter.set();
      }
      // }

      this.filter.trigger(["change", "input"]);
      this.filterValues = {};
    };
    this.$el.on("click", '[name="reset-search"]', () => {
      this.resetSearch();

      this._query.string = "";
      // processSort();
      this.draw();
    });

    // this.$el.on('click', '[data-event="mark"]', function(e) {
    // 	e.stopPropagation();
    // }.bind(this));

    this.dispatch = function (event, atts) {
      if (typeof atts == "undefined") {
        atts = { event: event };
      }
      // _.each(
      //   this.getSelected(),
      //   function (model) {
      //     this.eventBus.dispatch("model:" + atts.event, model);
      //   }.bind(this)
      // );

      var model;
      if (typeof atts.id !== "undefined" || typeof atts.model !== undefined) {
        model = atts.model || _.find(this.models, { id: atts.id });
      } else {
        _.each(
          this.getSelected(),
          function (model) {
            this.eventBus.dispatch("model:" + atts.event, model);
          }.bind(this)
        );
      }
      var result = this.eventBus.dispatch(event, model, atts);
      if (result.default && typeof actions[event] !== "undefined") {
        actions[event].call(this, result);
      }
    };
    this.$el.on(
      "click",
      "[data-event]",
      function (e) {
        e.stopPropagation();
        e.preventDefault();
        var atts = _.assign({}, e.currentTarget.dataset);
        this.dispatch(atts.event, atts);
      }.bind(this)
    );

    // this.$el.on(
    //   "click",
    //   "[data-sort]",
    //   function (e) {
    //     e.stopPropagation();
    //     e.preventDefault();
    //     var sortField = _.find(this.options.filterFields, {
    //       name: e.currentTarget.dataset.sort,
    //     }).search;
    //     if (this.options.reverse && this.options.sort == sortField) {
    //       processSort();
    //     } else {
    //       processSort(sortField);
    //     }
    //   }.bind(this)
    // );

    this.$el.on("click", "[data-sort]", e => {
      e.stopPropagation();
      e.preventDefault();
      let sort = this.filterMap[e.currentTarget.dataset.sort];
      let tokenIndex = null;
      let searchIndex = null;
      let sortTokenIndexes = [];
      let invert = _.reduce(
        this._query.tokens,
        (result, token, token_key) => {
          if (token.key !== "sort") return result;
          sortTokenIndexes.push({ invert: token.invert, index: token_key });

          _.each(token.search, ({ raw }, index) => {
            if (raw == sort) {
              tokenIndex = token_key;
              searchIndex = index;
              result = token.invert;
            }
          });

          return result;
        },
        null
      );
      let targetSort = "";

      let tokens = this._query.tokens;

      if (tokenIndex !== null && searchIndex !== null) {
        tokens[tokenIndex].search.splice(searchIndex, 1);
      }

      if (!invert) {
        let shouldInvert = invert == false;
        targetSort = (shouldInvert ? "-" : "") + "sort:" + sort;
        let target = _.find(sortTokenIndexes, { invert: shouldInvert });
        let token = _.tokenize(targetSort)[0];

        if (target) {
          tokens[target.index].search.push(token.search[0]);
        } else {
          tokens.push(token);
        }
      }

      this._query.tokens = tokens;
      // multiSort();
    });

    //Mobile
    this.$el.on(
      "change",
      ".sortBy",
      function (e) {
        if (e.currentTarget.value !== "") {
          processSort(
            (
              _.find(this.options.filterFields, {
                id: e.currentTarget.value,
              }) || { search: true }
            ).search
          );
        }
      }.bind(this)
    );
    this.$el.on(
      "click",
      ".filterForm",
      function (e) {
        this.$el.find('[name="search"]').val("");
        new gform({
          collections: this.collections,
          legend: "Filter By",
          name: "modal_filter" + this.options.id,
          data: this.filterValues,
          fields: options.filterFields,
        })
          .on(
            "save",
            function () {
              this.filterValues =
                gform.instances["modal_filter" + this.options.id].toJSON();
              this.draw();
              gform.instances["modal_filter" + this.options.id].trigger(
                "close"
              );
            }.bind(this)
          )
          .modal();

        // this.filter = new gform({collections:this.collections,name:'filter'+this.options.id,clear:false, fields: this.options.filterFields,default:{hideLabel:true,type:'text',format:{label: '{{label}}', value: '{{value}}'}} },$el.find('.filter')[0]).on('input', function(){
        // 	this.$el.find('[name="search"]').val('');
        // 	this.filterValues = this.filter.toJSON();
        // 	this.draw();
        // }.bind(this)).modal();

        // this.filter.set()
      }.bind(this)
    );
    this.$el.on(
      "click",
      ".reverse",
      function (e) {
        processSort(this.options.sort);
      }.bind(this)
    );

    this.load(options.data);
  }

  this.validate = function (item) {
    var status = false;
    var tempForm = new gform({
      collections: this.collections,
      fields: options.schema,
      methods: this.methods,
    });
    tempForm.set(item);
    if (tempForm.validate()) {
      status = tempForm.toJSON();
    } else {
      this.errors = tempForm.errors;
      console.log("Model not valid");
    }
    tempForm.destroy();
    return status;
  };

  this.add = function (item, config) {
    config = config || { validate: false, silent: false };
    var newModel = new gridModel(this, item, {
      "*": [
        function (e) {
          e.model.owner.eventBus.dispatch("model:" + e.event, e.model);
        },
      ],
      check: [
        function (e) {
          e.model.owner.draw();
        },
      ],
    });
    if (config.validate == false || this.validate(item)) {
      this.models.push(newModel);
      if (typeof this.options.sortBy !== "undefined") {
        this.models = _.sortBy(
          this.models,
          function (obj) {
            return obj.attributes[this.options.sortBy];
          }.bind(this)
        ).reverse();
      }
      if (config.draw !== false) {
        this.draw();
      }
      // this.updateCount(this.summary.checked_count);
      if (config.silent !== true) {
        this.eventBus.dispatch("created", newModel);
        this.eventBus.dispatch("model:created", newModel);
      }
      // if(typeof this.options.add == 'function'){
      // 	this.options.add(newModel);
      // }
    } else {
      return false;
    }
    return newModel;
  };

  this.applyQuery = _.partialRight(_.query, {
    path: "attributes",
    bools: ["checked", "deleted"],
    modelFilter: { deleted: false },
    keys: ["attributes", "display"],
    sort: {
      invert: options.reverse,
      search: [options.sort || this.options.sortBy],
    },
    fields: _.map(options.filterFields, field => {
      return {
        key: field.search,
        type: field.type,
        base: gform.types[field.type].base,
      };
    }),
  });

  this.search = function (options) {
    var ordered = _.sortBy(this.getModels(), function (obj) {
      return obj.attributes[options.sort];
    });
    if (!options.reverse) {
      ordered = ordered.reverse();
    }
    // filterMap = this.filterMap;
    ordered = _.filter(ordered, anyModel => {
      var keep = _.isEmpty(options.search);
      for (var filter in options.search) {
        var temp;
        if (
          _.filter(options.filterFields, { id: filter })[0] &&
          typeof _.filter(options.filterFields, { id: filter })[0].options ==
            "undefined"
        ) {
          temp =
            _.score(
              (anyModel.display[this.filterMap[filter]] + "")
                .replace(/\s+/g, " ")
                .toLowerCase(),
              (options.search[filter] + "").toLowerCase()
            ) > 0.4;
        } else {
          temp =
            anyModel.display[this.filterMap[filter]] + "" ==
              options.search[filter] + "" ||
            anyModel.attributes[this.filterMap[filter]] + "" ==
              options.search[filter] + "" ||
            (typeof anyModel.attributes[this.filterMap[filter]] == "object" &&
              anyModel.attributes[this.filterMap[filter]] !== null &&
              (anyModel.attributes[this.filterMap[filter]].indexOf(
                options.search[filter]
              ) != -1 ||
                anyModel.attributes[this.filterMap[filter]].indexOf(
                  options.search[filter] + ""
                ) != -1));
        }
        keep = temp;
        if (!keep) {
          break;
        }
      }

      return keep;
    });
    this.lastGrabbed = ordered.length;
    this.filtered = ordered;
  };

  this.find = function (search) {
    var keys = _.keys(search);
    return _.filter(this.getModels(), function (anyModel) {
      return _.isEqual(search, _.pick(anyModel.attributes, keys));
    });
  };

  this.searchAll = function (search) {
    //reset sorts and filters
    options.sort = null;
    this.$el.find("[data-sort]").removeClass("text-primary");
    this.$el
      .find("[data-sort]")
      .find("i")
      .attr("class", "fa fa-sort text-muted");
    if (this.filter) {
      this.filter.set();
      // silentPopulate.call(this.filter, this.defaults)
    }

    search = search.toLowerCase();
    //score each model searching each field and finding a total
    _.map(this.getModels(), function (model) {
      model.score = 0;
      for (var filter in options.filterFields) {
        model.score += _.score(
          (model.display[options.filterFields[filter].search] + "")
            .replace(/\s+/g, " ")
            .toLowerCase(),
          search
        );
      }
    });

    //sort by score (highet first) and remove models with no score
    this.filtered = _.filter(
      _.sortBy(this.getModels(), "score"),
      function (model) {
        return model.score > 0;
      }
    ).reverse();

    this.lastGrabbed = this.filtered.length;
  };

  this.fixStyle = function () {
    if (this.options.autoSize) {
      try {
        var container = this.$el.find(".table-container > div");
        var headers = this.$el.find(".table-container > table tr th:visible");
        var columns = this.$el.find(".list-group-row th");
        this.$el.find(".table-container table").removeClass("table-fixed");

        container.css("width", "auto");
        container.css("minWidth", "auto");
        headers.css("width", "auto");
        headers.css("minWidth", "85px");
        this.$el
          .find(".table-container > table tr th.select-column")
          .css("minWidth", "60px");
        this.$el
          .find(".table-container > table tr th.select-column")
          .css("width", "60px");
        columns.css("width", "auto");
        columns.css("minWidth", "auto");

        container.css(
          "height",
          $(window).height() -
            container.offset().top -
            (88 + this.options.autoSize) +
            "px"
        );
        _.each(
          columns,
          function (column, index) {
            if (typeof headers[index] !== "undefined") {
              column.style.display = "table-cell";
              if (headers[index].offsetWidth > column.offsetWidth) {
                $(column).css("width", headers[index].offsetWidth + "px");
                $(column).css("minWidth", headers[index].offsetWidth + "px");
                $(headers[index]).css(
                  "width",
                  headers[index].offsetWidth + "px"
                );
                $(headers[index]).css(
                  "minWidth",
                  headers[index].offsetWidth + "px"
                );
              } else {
                $(headers[index]).css(
                  "width",
                  headers[index].offsetWidth + "px"
                );
                $(headers[index]).css(
                  "minWidth",
                  headers[index].offsetWidth + "px"
                );

                $(column).css("width", headers[index].offsetWidth + "px");
                $(column).css("minWidth", headers[index].offsetWidth + "px");
              }
            } else {
              column.style.display = "none";
            }
          }.bind(this)
        );

        this.$el.find(".table-container table").addClass("table-fixed");

        var target = this.$el.find(".table-container > div table")[0]
          .offsetWidth;
        if (this.$el.find(".table-container > table")[0].offsetWidth > target) {
          target = this.$el.find(".table-container > table")[0].offsetWidth;
        }

        container.css("width", target + "px");
        container.css("minWidth", target + "px");
        if (target > this.$el.find(".table-container")[0].offsetWidth) {
          this.$el.find(".table-container").css("overflow", "auto");
        } else {
          this.$el.find(".table-container").css("overflow", "hidden");
        }
      } catch (e) {}
    }
  };
  this.visible = [];

  this.grab = function (options) {
    _.each(this.visible, function (item) {
      item.visible = false;
    });
    var temp = this.filtered.slice(
      options.count * (options.page - 1),
      options.count * (options.page - 1) + options.count
    );
    this.visible = temp;
    _.each(this.visible, function (item) {
      item.visible = true;
    });
    return temp;
  };
  this.getModels = function (search) {
    var search = search || { deleted: false };
    return _.filter(this.models, search);
  };
  this.getSelected = function () {
    return this.getModels({ checked: true, deleted: false });
  }; //_.filter(this.models, {checked: true, deleted: false})}

  this.destroy = function () {
    this.$el.find(".list-group").empty();
    this.$el.off();
    this.$el.empty();
  };

  this.state = {
    get: function () {
      var temp = { count: this.options.count, page: this.options.page };
      if (
        this.$el.find('[name="search"]').length &&
        this.$el.find('[name="search"]').val().length
      ) {
        temp.search = this.$el.find('[name="search"]').val();
      } else {
        temp.sort = options.sort;
        temp.reverse = options.reverse;
        if (typeof this.filter !== "undefined") {
          temp.filters = {};
          _.each(
            this.options.filterFields,
            function (item) {
              temp.filters[item.search] = this[item.id];
            }.bind(this.filter.toJSON())
          );
        }
      }
      temp.columns = _.map(
        _.map(
          _.filter(this.summary.items, function (item) {
            return item.isEnabled;
          }),
          "id"
        ),
        function (id) {
          return _.find(this.options.filterFields, { id: id }).search;
        }.bind(this)
      );
      temp.query = this._query.string;
      return temp;
    }.bind(this),
    set: function (settings) {
      if (typeof settings.columns !== "undefined" && settings.columns.length) {
        this.summary.items = _.map(this.summary.items, item => {
          item.isEnabled = _.includes(
            settings.columns,
            this.filterMap[item.cname]
          );
          return item;
        });
        this.view = gform.renderString(options.item_template, summary);

        this.$el.find('.columnEnables [type="checkbox"]').each(function (e) {
          this.checked = false;
        });
        if (options.columns) {
          _.each(
            settings.columns,
            function (item) {
              var temp = this.$el.find(
                '.columnEnables [data-field="' +
                  _.find(this.options.filterFields, { search: item }).id +
                  '"] [type="checkbox"]'
              );
              if (temp.length) temp[0].checked = true;
            }.bind(this)
          );
        }
      }
      if (this.options.query && typeof settings.query == "string") {
        if (typeof settings.filters !== "undefined") {
          this.filterValues = {};
          _.each(
            settings.filters,
            function (item, index) {
              if (typeof item !== "string") {
                this.filterValues[
                  _.find(this.options.filterFields, { search: index }).id
                ] = JSON.stringify(item);
              } else {
                this.filterValues[
                  _.find(this.options.filterFields, { search: index }).id
                ] = item;
              }
            }.bind(this)
          );
        }

        this._query.string = settings.query;
        // debugger;
        this._query.data = settings.query;
      } else {
        if (typeof settings.filters !== "undefined") {
          this.filterValues = {};
          _.each(
            settings.filters,
            function (item, index) {
              this.filterValues[
                _.find(this.options.filterFields, { search: index }).id
              ] = item;
            }.bind(this)
          );
        }
        if (typeof settings.sort !== "undefined") {
          processSort(settings.sort || options.sort, settings.reverse);
        }

        if (typeof settings.search !== "undefined" && settings.search !== "") {
          this.$el.find('[name="search"]').val(settings.search);
        }

        if (typeof this.filter !== "undefined") {
          this.filter.set(this.filterValues);
          // this.filter.trigger(["change","input"]);;
          this.filterValues = this.filter.toJSON();
        }
      }

      this.options.page = settings.page || this.options.page;
      this.options.count = settings.count || this.options.count;
      this.draw();
    }.bind(this),
  };
  this.models = [];
  this.options = options;

  this.filterMap = {};
  _.map(
    options.filterFields,
    function (item) {
      this.filterMap[item.id] = item.search;
    }.bind(this)
  );

  // var fields = {
  // 	Title: {},
  // 	Feed: {type: 'select', label_key: 'title', value_key: '_id', required: true, default: {title: 'Current Collection', _id: 'collection'}},
  // }

  this.getCSV = function (title) {
    if (typeof title !== "string") {
      title = this.options.title;
    }
    _.csvify(
      _.map(this.filtered, function (item) {
        return item.attributes;
      }),
      _.map(
        _.filter(this.summary.items, function (item) {
          return item.isEnabled;
        }),
        function (filterMap, item) {
          return { label: item.label, name: filterMap[item.cname] };
        }.bind(null, this.filterMap)
      ),
      title
    );
  };

  var container = options.el;
  if (typeof options.el == "string") {
    container = document.querySelector(container);
  }
  if (container !== null) {
    container.innerHTML = gform.renderString(template, summary);

    onload.call(this, $(container));
  }
  if (loaded) {
    this.state.set(loaded);
    loaded = false;
  }
  this.$el.find('[name="search"]').focus();

  this.$el.find(".table-container > div").css("overflow", "auto");
  $(window).on("resize orientationChange", this.fixStyle.bind(this));

  Object.defineProperty(this, "isDirty", {
    get: () => !_.isEqual(this.options.data, this.toJSON()),
    set: status => {
      if (!status && status !== this.isDirty) {
        this.options.data = this.toJSON();
      }
    },
  });
};

GrapheneDataGrid.version = "1.0.5";
gform.stencils["filterItem"] = `
<a id="{{id}}" href="#" class="" style="display: block;text-decoration:none ">
<div type="button" class="" name="{{name}}" style="display:flex;align-items:center;gap:.5em">
  {{#options}}
  {{#optgroup}}
    {{#options}}
    <svg style="width:1.25em;height:1.25em;" data-id="{{optgroup.id}}" name="{{id}}" data-id="{{optgroup.id}}" class="{{^selected}} {{defaultClass}}{{/selected}}{{#selected}} {{selectedClass}}{{/selected}}" value="{{i}}" data-value="{{value}}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">{{{label}}}</svg>
    {{/options}}
  {{/optgroup}}
  {{/options}}
  <span data-id="{{optgroup.id}} {{^editable}}disabled{{/editable}} {{^visible}}hidden{{/visible}}">{{label}}</span>
</div>
</a>
`;
gform.stencils[
  "filter"
] = `<div  style="margin-bottom: 15px;" name="{{name}}" id="{{id}}" data-type="{{type}}">
{{^hideLabel}}<label>{{{label}}}{{^label}}&nbsp;{{/label}}</label>{{/hideLabel}}
<span class="badge count" style="position: absolute;top: -7px;left: 7px;background:#466769"></span>
<button type="button" class="btn btn-default dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false" style="width: 100%;display: flex;justify-content: space-between;align-items: center;">
  {{{label}}}{{^label}}&nbsp;{{/label}} <span class="caret"></span>
</button>
<ul class="dropdown-menu" style="left:initial;padding: 5px 0 0;">
  <li style="position:relative"><input type="text" placeholder="Search..." style="margin:-3px 2px 2px;width:auto" class="form-control"/> <div class="gclear" >

<svg class="" style="width:1.25em;height:1.25em;cursor:pointer;transition-duration: 300ms;transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);transition-property: color;color:#333;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
<line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>
</svg>

    </div></li>
<ul style="padding-left:0"></ul>
    <li class="greset text-danger"><a href="#" style="color: inherit">Reset {{label}} Filters</a></li>
</ul></div>
</div></div>`;
gform.types["filterItem"] = _.extend(
  {},
  gform.types["input"],
  gform.types["collection"],
  {
    set: function (value) {
      let target = this.el.querySelector('[data-value="' + value + '"]');
      var elem = this.el.querySelector(
        "." + this.selectedClass.split(" ").join(".")
      );
      elem.setAttribute("class", this.defaultClass);
      target.setAttribute("class", this.selectedClass);

      this.el.dataset.value = value;
    },
    defaults: {
      selectedClass: "active",
      defaultClass: "hidden",
    },
    get: function () {
      if (!("el" in this)) {
        return this.internalValue;
      }
      // return this.el.dataset.value + "";

      if (this.value != "") debugger;
      let cv = (
        this.el.querySelector(
          "." + this.selectedClass.split(" ").join(".")
        ) || { dataset: { value: "" } }
      ).dataset.value;
      // console.log(cv);
      return cv;
    },
    next: function (e) {
      e.stopPropagation();
      e.preventDefault();
      let val = (
        _.find(this.mapOptions.getoptions(), {
          value: this.value + "",
        }) || { i: 1 }
      ).i;
      if (e.ctrlKey || e.metaKey) val = 2;
      if (e.shiftKey) val = 0;

      this.set(this.mapOptions.getoptions()[val % 3].value);

      this.owner.trigger("change", this);
      this.owner.trigger("input", this);
    },
    initialize: function () {
      this.el.addEventListener("click", gform.types[this.type].next.bind(this));
      gform.types[this.type].setLabel.call(this);
    },
    create: function () {
      var tempEl = document.createElement("li");
      tempEl.setAttribute("id", "el_" + this.id);
      gform.addClass(tempEl, "filterItem-select");
      tempEl.innerHTML = this.render();
      return tempEl;
    },
    edit: function (state) {
      this.editable = state;

      this.el.disabled = !state;
    },
  }
);
gform.types["filter"] = _.extend(
  {},
  gform.types["input"],
  gform.types["section"],
  {
    render: function () {
      if (this.section) {
        return gform.render(this.owner.options.sections + "filter", this);
      } else {
        return gform.render("filter", this);
      }
    },

    rowTemplate: '<li class="filterable"></li>',
    // rowSelector: ".list-group-item",
    rowClass: "filterItem-select",
    create: function () {
      var tempEl = gform.create(this.render());
      this.container = tempEl.querySelector("ul");

      gform.addClass(
        tempEl,
        gform.columnClasses[this.columns || gform.prototype.options.columns]
      );
      gform.addClass(
        tempEl,
        gform.offsetClasses[this.offset || gform.prototype.options.offset]
      );
      gform.toggleClass(tempEl, "gform_isArray", !!this.array);

      return tempEl;
    },
    get: function (name) {
      //this is not right ----
      if (typeof name !== "undefined") {
        return gform.toJSON.call(this, name);
      }
      let temp = _.selectPath(gform.toJSON.call(this), this.map);
      let result = _.map(temp, (item, key) =>
        item !== null && item.length ? { invert: item !== "true", key } : null
      );

      let inverted = _.map(_.filter(result, { invert: true }), "key");
      let selected = _.map(_.filter(result, { invert: false }), "key");

      let tokens = [];

      if (selected.length) {
        tokens.push({
          key: this.search,
          invert: false,
          action: ":",
          search: _.map(selected, s => ({
            action: "~",
            lower: s.toLowerCase(),
            raw: s,
            string: s + "",
          })),
        });
      }
      if (inverted.length) {
        tokens.push({
          key: this.search,
          invert: true,
          action: ":",
          search: _.map(inverted, s => ({
            action: "~",
            lower: s.toLowerCase(),
            raw: s,
            string: s + "",
          })),
        });
      }
      return tokens;
    },
    set: function (value, silent) {
      if (this.mapOptions.waiting) {
        this.waitingValue = value;
        return true;
      }
      if (typeof value == "string") {
        value = JSON.parse(value);
        if (value.length) {
          value = [].concat.apply(
            [],
            _.map(value, ({ search, invert }) =>
              _.map(search, ({ raw }) => ({ raw, invert }))
            )
          );
          value = _.transform(
            value,
            (result, item) => {
              result[item.raw] = !item.invert + "";
              return result;
            },
            {}
          );
          value = _.reduce(
            this.fields,
            (result, field) => {
              result.push(field.name in value ? value[field.name] : "");
              return result;
            },
            []
          );
        }
        // value = _.map(JSON.parse(value)[0].search, "raw");
        // value = [].concat.apply([],_.map(JSON.parse(value),({search,invert})=>_.map(search,({raw})=>({raw,invert}))))
      }

      if (_.isEmpty(value)) {
        gform.each.call(this, function (field) {
          field.set("");
        });
        this.update({}, true);
      } else {
        _.each(
          value,
          function (item, index) {
            let field = this.items[index];
            if (typeof field == "undefined" || field == null) return;
            field.set(item);
          }.bind(this)
        );
      }
      this.render();
      if (!silent) {
        this.owner.trigger(["change", "input"], this);
      }
      return true;
    },
    edit: function (state) {
      this.editable = state;

      this.el.disabled = !state;
    },
    initialize: function () {
      //handle rows

      this.rowManager = gform.rowManager(this);
      // this.initialValue = this.value
      Object.defineProperty(this, "value", {
        get: function () {
          // return true;
          return this.get();
        },
        enumerable: true,
      });
      function processFilter(searchTerm, collection) {
        _.each(collection, field => {
          if (
            _.score(
              field.el.innerText.replace(/\s+/g, " ").toLowerCase(),
              searchTerm
            ) > 0.4
          ) {
            gform.removeClass(field.el, "hidden");
          } else {
            gform.addClass(field.el, "hidden");
          }
        });
      }
      this.el.querySelector(".gclear").addEventListener("click", e => {
        e.stopPropagation();
        this.el.querySelector("input").value = "";
        _.each(this.fields, field => gform.removeClass(field.el, "hidden"));
        this.el.querySelector("input").focus();
      });
      this.el.querySelector(".greset").addEventListener("click", e => {
        e.stopPropagation();
        this.el.querySelector("input").value = "";
        _.each(this.fields, field => gform.removeClass(field.el, "hidden"));
        this.el.querySelector("input").focus();
        _.each(this.fields, field => field.set(""));

        this.owner.trigger("change", this);
        this.owner.trigger("input", this);
      });

      this.el.querySelector("input").addEventListener("input", e => {
        processFilter(event.currentTarget.value.toLowerCase(), this.fields);
      });
      $(this.el)
        .on("shown.bs.dropdown", () => {
          this.el.querySelector("input").focus();
        })
        .on("hidden.bs.dropdown", () => {
          this.el.querySelector("input").value = "";
          _.each(this.fields, field => gform.removeClass(field.el, "hidden"));
        });
      gform.types[this.type].setLabel.call(this);
      this.mapOptions = new gform.mapOptions(
        this,
        this.value,
        0,
        this.owner.collections
      );
      this.mapOptions.on(
        "collection",
        function (e) {
          let fields = _.map(
            _.map(this.mapOptions.getoptions(), ({ value, label }) => ({
              name: value + "",
              label,
              row: false,
              target: () => this.el.querySelector("ul > ul"),
            })),
            function (field) {
              return {
                options: [
                  {
                    type: "optgroup",
                    format: { label: "{{{label}}}" },
                    options: [
                      {
                        label:
                          '<circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>',
                        value: "false",
                      },
                      {
                        label: "",
                        value: "",
                      },
                      {
                        label: '<polyline points="20 6 9 17 4 12"></polyline>',
                        value: "true",
                      },
                    ],
                  },
                ],
                type: "filterItem",
                ...field,
              };
            }
          );

          this._items = _.map(
            fields,
            this.owner.fieldMethods.cultivate.bind(null, {
              data: this.owner.options.data,
              parent: this,
            })
          );
          // field._items = _.map(
          //   field.fields,
          //   form.fieldMethods.cultivate.bind(null, {
          //     data: options.data,
          //     parent: field,
          //   })
          // );
          _.each(this.items, item => {
            this.owner.call("show", item, item.visible);
            this.owner.call("edit", item, item.editable);
          });
          this.reflow();
          if (this.mapOptions.waiting) return;
          else if (typeof this.waitingValue == "string") {
            this.set(this.waitingValue);
            this.waitingValue = null;
          }
          // this.options = this.mapOptions.getoptions();
          // if (this.shown) {
          //   this.renderMenu();
          // }
          // if (typeof this.value !== "undefined") {
          //   gform.types[this.type].set.call(this, this.value);
          // }
        }.bind(this)
      );
      // _.map(this.mapOptions.getoptions(), item =>
      // _.pick(item, "label", "value")
      // )
      let self = this;
      this.owner.on("change", s => {
        if (
          "field" in s &&
          "parent" in s.field &&
          s.field.parent.id == self.id
        ) {
          if (this.el.querySelector(".count") != null) {
            var count =
              _.reduce(
                _.map(this.value, "search"),
                (r, s) => {
                  r += s.length;
                  return r;
                },
                0
              ) || "";

            this.el.querySelector(".count").innerHTML = `${count}`;
          }
        }
      });
      this.fields = _.map(
        _.map(this.mapOptions.getoptions(), ({ value, label }) => ({
          name: value + "",
          label,
          row: false,
          target: () => this.el.querySelector("ul > ul"),
        })),
        function (field) {
          return {
            options: [
              {
                type: "optgroup",
                format: { label: "{{{label}}}" },
                options: [
                  {
                    label:
                      '<circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>',
                    // value: "-{{name}}:{{field.name}}",
                    value: "false",
                  },
                  {
                    label: "",
                    value: "",
                  },
                  {
                    label: '<polyline points="20 6 9 17 4 12"></polyline>',
                    // value: "{{name}}:{{field.name}}",
                    value: "true",
                  },
                ],
              },
            ],
            type: "filterItem",
            ...field,
          };
        }
      );
    },
  }
);

var CSVParser = (function () {
  "use strict";
  function captureFields(fields) {
    /* jshint -W040 */
    if (
      this.options.ignoreEmpty === false ||
      fields.some(function (field) {
        return field.length !== 0;
      })
    ) {
      this.rows.push(fields);
    }
    /* jshint +W040 */
  }

  function Parser(data, options) {
    var defaultOptions = {
      fieldSeparator: ",",
      strict: true,
      ignoreEmpty: true,
    };
    if (options === undefined) options = {};
    this.options = {};
    Object.keys(defaultOptions).forEach(function (key) {
      this.options[key] =
        options[key] === undefined ? defaultOptions[key] : options[key];
    }, this);
    this.rows = [];
    this.data = data;
  }
  Parser.prototype.toString = function toString() {
    return "[object CSVParser]";
  };
  Parser.prototype.numberOfRows = function numberOfRows() {
    return this.rows.length;
  };
  Parser.prototype.parse = function parse() {
    // Regular expression for parsing CSV from [Kirtan](http://stackoverflow.com/users/83664/kirtan) on Stack Overflow
    // http://stackoverflow.com/a/1293163/34386
    var regexString =
      // Delimiters.
      "(\\" +
      this.options.fieldSeparator +
      "|\\r?\\n|\\r|^)" +
      // Quoted fields.
      '(?:"([^"]*(?:""[^"]*)*)"|' +
      // Standard fields.
      '([^"\\' +
      this.options.fieldSeparator +
      "\\r\\n]*))";
    var objPattern = new RegExp(regexString, "gi");
    var doubleQuotePattern = new RegExp('""', "g");

    var fields = [];
    var arrMatches = null;
    var strMatchedDelimiter, strMatchedValue;
    /* jshint -W084 */
    while ((arrMatches = objPattern.exec(this.data))) {
      /* jshint +W084 */
      strMatchedDelimiter = arrMatches[1];
      if (
        strMatchedDelimiter.length &&
        strMatchedDelimiter != this.options.fieldSeparator
      ) {
        captureFields.apply(this, [fields]);
        fields = [];
      }

      if (arrMatches[2]) {
        strMatchedValue = arrMatches[2].replace(doubleQuotePattern, '"');
      } else {
        strMatchedValue = arrMatches[3];
      }
      fields.push(strMatchedValue);
    }
    captureFields.apply(this, [fields]);
    if (
      this.options.strict === true &&
      !this.rows.every(function (row) {
        return row.length === this.length;
      }, this.rows[0])
    ) {
      throw new Error(
        "Invalid CSV data. Strict mode requires all rows to have the same number of fields. You can override this by passing `strict: false` in the CSVParser options"
      );
    }
  };
  return Parser;
})();
function gridModel(owner, initial, events) {
  this.visible = false;
  this.owner = owner;
  this.id = gform.getUID();
  this.attributes = {};
  this.display = {};
  this.attribute_history = [];
  this.schema = owner.options.schema;
  this.iswaiting;

  this.row = document.createElement("tr");
  this.row.setAttribute("data-id", this.id);
  this.row.setAttribute(
    "class",
    "filterable grid-row" + (this.iswaiting ? " warning" : "")
  );

  this.waiting = function (state) {
    if (typeof state !== "undefined") {
      this.iswaiting = state;
      this.row.setAttribute(
        "class",
        "filterable grid-row" + (this.iswaiting ? " warning" : "")
      );
      this.draw();
    }
    return this.iswaiting;
  };

  this.draw = function () {
    if (this.visible) {
      this.dispatch("draw");
      var temp = gform.renderString(this.owner.view, this);
      if (this.row.innerHTML != temp) {
        this.row.innerHTML = temp;
      }
      this.dispatch("drawn");
    }
    return this.row;
  };
  this.eventBus = new gform.eventBus(
    { owner: "model", item: "model", handlers: events || {} },
    this
  );
  this.on = this.eventBus.on;
  this.dispatch = this.eventBus.dispatch;
  var processAtts = function () {
    _.each(
      this.schema,
      function (item) {
        var options;
        var temp = _.find(this.owner.checkForm.fields, { name: item.name });

        searchables = this.attributes[item.name];

        if (typeof this.attributes[item.name] !== "object")
          searchables = [searchables];
        this.display[item.name] = _.reduce(
          searchables,
          function (display, search) {
            if (display.length) display += "\r\n";
            if (typeof item.options !== "undefined") {
              //look for matching string value
              options = _.find(temp.mapOptions.getoptions(), {
                value: search + "",
              });

              if (typeof options == "undefined" && _.isFinite(search)) {
                options = _.find(temp.mapOptions.getoptions(), {
                  value: parseInt(search),
                });
              }
              if (typeof options == "undefined") {
                options = _.find(temp.mapOptions.getoptions(), {
                  value: search,
                });
              }
            }

            if (typeof options !== "undefined") {
              display += options.label;
            }

            if (item.template) {
              display = gform.renderString(item.template, this);
            } else {
              if (typeof display == "undefined" || display == "")
                display += typeof search !== "undefined" ? search : "";
            }
            return display;
          }.bind(this),
          ""
        );
      }.bind(this)
    );
  };
  this.set = function (newAtts, silent) {
    if (typeof newAtts !== "undefined" && newAtts !== null) {
      this.attribute_history.push(_.extend({}, this.attributes));
      this.attributes = newAtts;
    }
    processAtts.call(this);
    this.draw();

    if (!silent) {
      this.dispatch("set");
    }
  };
  this.update = function (newAtts, silent) {
    this.set(_.assign(this.attributes, newAtts), silent);
  };
  this.checked = false;
  this.deleted = false;
  this.toggle = function (state, silent) {
    if (typeof state === "boolean") {
      this.checked = state;
    } else {
      this.checked = !this.checked;
    }
    this.draw();
    if (!silent) {
      this.dispatch("check");
    }
  };
  this.set(initial);
  processAtts.call(this);
  this.toJSON = function () {
    return this.attributes;
  };
  this.undo = function () {
    if (this.deleted) {
      this.deleted = false;
    } else {
      if (this.attribute_history.length) {
        this.attributes = this.attribute_history.pop();
        processAtts.call(this);
      } else {
        this.deleted = true;
      }
    }
    this.owner.draw();
  };
  this.delete = function () {
    this.deleted = true;
    // this.owner.models.splice(_.indexOf(_.map(this.owner.models, 'id'), this.id),1);
  };
}
gform.stencils.actions = `
<table style="width:100%">
<thead>
<tr>
<th>
<div class="btn-group pull-left" style="white-space: nowrap; font-size: 0;" role="group" aria-label="...">

{{#options.actions}}
{{#name}}
<a href="javascript:void(0);" style="display: inline-block;font-size: 14px;float: none;clear: none;" data-event="{{name}}" class="grid-action disabled btn btn-{{type}}{{^type}}default{{/type}}">{{{label}}}</a>
{{/name}}

{{^name}}
</div>
</th>
<th style="width:100%">
<div class="btn-group pull-{{^align}}left{{/align}}{{align}}" style="margin-left:15px;white-space: nowrap; font-size: 0;" role="group" aria-label="...">

{{/name}}
{{/options.actions}}
</div>
</th>
</tr>
</thead>
</table>`;

gform.stencils.count = `{{#checked_count}}<h5 class="range label label-info checked_count" style="margin:7px 0">{{checked_count}} item(s) selected</h5>{{/checked_count}}`;

gform.stencils.mobile_head = `
<div style="clear:both;">

{{#options.sort}}

<div class="row" style="margin-bottom:10px">

	<div class="col-xs-6">
	{{#options.filter}}

			<div name="reset-search" style="position:relative" class="btn btn-default" data-toggle="tooltip" data-placement="left" title="Clear Filters">
					<i class="fa fa-filter"></i>
					<i class="fa fa-times text-danger" style="position: absolute;right: 5px;"></i>
			</div>    

	<div class="btn btn-info filterForm">Filter</div>
{{/options.filter}}
	</div>
	<div class="col-xs-6">
			{{#options.search}}<input type="text" name="search" class="form-control" style="" placeholder="Search">{{/options.search}}
					</div>
	</div>
	<div class="input-group">
			<span class="" style="display: table-cell;width: 1%;white-space: nowrap;vertical-align: middle;padding-right:5px">
					<button class="btn btn-default reverse" type="button" tabindex="-1"><i class="fa fa-sort text-muted"></i></button>
			</span>
					<select class="form-control sortBy">
							<option value=true>None</option>
							{{#items}}
									{{#visible}}
											<option value="{{id}}">{{label}}</option>
									{{/visible}}
							{{/items}}
					<select>
	</div>
{{/options.sort}}

</div>
`;
gform.stencils.mobile_row = `<tr><td colspan="100%" class="filterable">		
{{^options.hideCheck}}

<div data-event="mark" data-id="{{[[}}id{{]]}}"  style="text-align:left;padding:0;-webkit-touch-callout: none;-webkit-user-select: none;-khtml-user-select: none;-moz-user-select: none;-ms-user-select: none;user-select: none;">
<span class="text-muted fa {{[[}}#iswaiting{{]]}}fa-spinner fa-spin {{[[}}/iswaiting{{]]}} {{[[}}^iswaiting{{]]}} {{[[}}#checked{{]]}}fa-check-square-o{{[[}}/checked{{]]}} {{[[}}^checked{{]]}}fa-square-o{{[[}}/checked{{]]}}{{[[}}/iswaiting{{]]}}" style="margin:6px; cursor:pointer;font-size:24px"></span>
</div>
{{/options.hideCheck}}
<div>
{{#items}}
{{#visible}}{{#isEnabled}}<div class="row" style="min-width:85px"><span class="col-sm-3"><b>{{label}}</b></span><span class="col-sm-9 col-xs-12">{{{name}}}</span></div>{{/isEnabled}}{{/visible}}
{{/items}}
</div>
</td></tr>`;
gform.stencils.mobile_data_grid = `<div class="well table-well">
<style>

.dropdown-menu>li>a.disabled{
  cursor:not-allowed;
  color:#999;
}
</style>
<div style="height:40px;">
	<div name="actions" class=" pull-left" style="margin-bottom:10px;width:62%" >
   
  <div class="btn-group columnEnables" data-toggle="tooltip" data-placement="left" title="Display Columns">
  <button class="btn btn-default dropdown-toggle" type="button" id="enables_{{options.id}}" data-toggle="dropdown" aria-haspopup="true" aria-expanded="true">
      Actions
      <span class="caret"></span>
  </button>
  <ul class="dropdown-menu pull-left" style="padding-top:10px" aria-labelledby="enables_{{options.id}}">
  
     
{{#options.actions}}

{{#name}}
<li><a href="javascript:void(0);" style="" data-event="{{name}}" class="grid-action disabled">{{{label}}}</a></li>


{{/name}}




{{/options.actions}}

</ul>
</div>

</div>

	<input type="file" class="csvFileInput" accept=".csv" style="display:none">

	<div class="hiddenForm" style="display:none"></div>
  <div class="btn-group pull-left" style="white-space: nowrap; font-size: 0;" role="group" aria-label="...">







</div>
	<div class="btn-group pull-right" style="margin-bottom:10px" role="group" aria-label="...">
      
 
			{{#options.download}}
			<div class="btn btn-default hidden-xs" name="bt-download" data-toggle="tooltip" data-placement="left" title="Download"><i class="fa fa-download"></i></div>
			{{/options.download}}
			{{#options.upload}}
			<div class="btn btn-default hidden-xs" name="bt-upload" data-toggle="tooltip" data-placement="left" title="Upload"><i class="fa fa-upload"></i></div>
			{{/options.upload}}


			{{#options.columns}}
			<div class="btn-group columnEnables" data-toggle="tooltip" data-placement="left" title="Display Columns">
					<button class="btn btn-default dropdown-toggle" type="button" id="enables_{{options.id}}" data-toggle="dropdown" aria-haspopup="true" aria-expanded="true">
							<i class="fa fa-list"></i>
							<span class="caret"></span>
					</button>
					<ul class="dropdown-menu pull-right" style="padding-top:10px" aria-labelledby="enables_{{options.id}}">
							{{#items}}
							{{#visible}}
							<li><label data-field="{{id}}" style="width:100%;font-weight:normal"><input type="checkbox" {{#isEnabled}}checked="checked"{{/isEnabled}} style="margin: 5px 0 5px 15px;"> {{label}}</label></li>
							{{/visible}}
							{{/items}}
					</ul>
			</div>
			{{/options.columns}}

	</div>


</div>	
			{{>mobile_head}}


{{^options.hideCheck}}
<div style="padding: 16px 0 0 15px;"><i name="select_all" class="fa fa-2x fa-square-o"></i></div>
{{/options.hideCheck}}

<div class="table-container" style="width:100%;overflow:auto">

<div style="min-height:100px">
	<table class="table {{^options.noborder}}table-bordered{{/options.noborder}} table-striped table-hover dataTable" style="margin-bottom:0px">
			<tbody class="list-group">
					<tr><td colspan="100">
							<div class="alert alert-info" role="alert">You have no items.</div>
					</td></tr>
			</tbody>

	</table>
</div>

</div>
<div class="paginate-footer" style="overflow:hidden;margin-top:10px"></div>
</div>`;
gform.stencils.data_grid = `<div class="well table-well"><style>  
hidden{display:none}
#tags{display: flex;
  font-weight:bold;
  gap:.75em;
  flex-wrap: wrap;
  margin-bottom:10px;
  min-height:23px
}
.query-tag {
  display: flex;
  white-space: nowrap;
  border-radius: 2em;
  background:#4488ee;
  gap:.5em;
  align-items:center;
  border:solid 1px #1155bb;
  padding-left:0.75em;

}
.query-tag-invert{
  background:#be4949;
  border-color:#832f2f;
}

.query-tag-key{
  background:#46a44d;
  border-color:#37813c;
}
.query-tag[data-key="sort"] {
  background:#fbf2e3;
  background:#fff;
  border:solid 1px darkorange;
}
.query-tag[data-key="sort"] span{
  color:darkorange
}
.query-tag[data-key="sort"]:before {
 content:url('data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" height="16" width="16"  viewBox="0 -4 24 24" fill="none" stroke="darkorange" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-chevron-up"><polyline points="18 15 12 9 6 15"></polyline>/%3E%3C/svg%3E ')
}
.query-tag-invert.query-tag[data-key="sort"]:before {
  content:url('data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 -4 24 24" fill="none" stroke="darkorange" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-chevron-down"><polyline points="6 9 12 15 18 9"></polyline>/%3E%3C/svg%3E ')
 }
.query-tag span{
  color: #fff;
  max-width: 200px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.query-tag span:hover{
  max-width: 100%;

  transition-duration: 300ms;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-property: max-width;
}
.query-tag svg{

  color: #fff;
  width:1.5em;
  height:1.5em;
  padding:.2em;
  border-radius:2em;
  cursor:pointer;
  transition-duration: 300ms;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-property: color,background;
}
.query-tag svg:hover{
background:rgba(200,200,200,.3)
}
.query-tag svg *{
  pointer-events: none;
}

.query-tag[data-key="sort"] svg{
  color:darkorange;
}

li.filterItem-select[data-value=true] > a{
color: #787;
background-color:#fafffa;
}
li.filterItem-select[data-value=false] > a{
color: #877;
background-color:#fffafa;
}
li.filterItem-select > a{
  border-bottom:solid 1px #eee;
  padding:5px 15px;
  color:#777;
}
li.filterItem-select > a:hover{
  color:#555
}


input:placeholder-shown + div.gclear {
  opacity: 0;
  pointer-events: none;
}
.gclear {
  position: absolute;
  top: 0;
  bottom: 0;
  right: 0.5em;
  display: flex;
  align-items: center;
}
.gclear svg {
  opacity: 0.4;
  cursor: pointer;
}
.gclear svg:hover {
  opacity: 0.8;
}
.greset{
}
.greset a{
  padding: 4px;
  text-align: center;
  opacity: .7;    border-radius: 0 0 5px 5px;
}
.greset a:hover{
  opacity: 1;
}
</style>
<div>
</div>
<input type="file" class="csvFileInput" accept=".csv" style="display:none">
<div class="hiddenForm" style="display:none"></div>

<div style="overflow:hidden">
<div name="actions" class=" pull-left" style="margin-bottom:10px;" ></div>
</div>	

<div style="min-height:3.25em">

<div class="btn-group pull-right" style="margin-bottom:10px;margin-left:10px" role="group" aria-label="...">

	{{#options.download}}
	<div class="btn btn-default hidden-xs" name="bt-download" data-toggle="tooltip" data-placement="left" title="Download"><i class="fa fa-download"></i></div>
	{{/options.download}}
	{{#options.upload}}
	<div class="btn btn-default hidden-xs" name="bt-upload" data-toggle="tooltip" data-placement="left" title="Upload"><i class="fa fa-upload"></i></div>
	{{/options.upload}}


	{{#options.columns}}
	<div class="btn-group columnEnables" data-toggle="tooltip" data-placement="left" title="Display Columns">
			<button class="btn btn-default dropdown-toggle" type="button" id="enables_{{options.id}}" data-toggle="dropdown" aria-haspopup="true" aria-expanded="true">
					<i class="fa fa-list"></i>
					<span class="caret"></span>
			</button>
			<ul class="dropdown-menu pull-right" style="padding-top:10px;padding-left:10px;" aria-labelledby="enables_{{options.id}}">
					{{#items}}
					{{#visible}}
					<li><label data-field="{{id}}" style="width:100%;font-weight:normal"><input type="checkbox" {{#isEnabled}}checked="checked"{{/isEnabled}}> {{label}}</label></li>
					{{/visible}}
					{{/items}}
			</ul>
	</div>
	{{/options.columns}}
</div>
{{#options.query}}<input type="text" name="query" class="form-control pull-left" style=" margin-bottom:10px;max-width:{{options.query}}%;" placeholder="deleted:false">{{/options.query}}

{{#options.search}}<input type="text" name="search" class="form-control pull-right" style="max-width:300px; margin-bottom:10px" placeholder="Search">{{/options.search}}

<span name="count"></span>
</div>

{{^options.autoSize}}
<div class="paginate-footer hidden-xs" style="overflow:hidden;margin-top:10px;clear:both"></div>
{{/options.autoSize}}

<div id="tags"></div>
<div class="table-container" style="width:100%;overflow:auto">
{{#options.autoSize}}
<table class="table {{^options.noborder}}table-bordered{{/options.noborder}}" style="margin-bottom:0px">
<thead class="head">
{{>data_grid_head}}
</thead>
</table>
{{/options.autoSize}}


<div style="min-height:100px">
<table class="table {{^options.noborder}}table-bordered{{/options.noborder}} table-striped table-hover dataTable" style="margin-bottom:0px;{{#options.autoSize}}margin-top: -19px;{{/options.autoSize}}">
	{{^options.autoSize}}
	<thead class="head">
	{{>data_grid_head}}
	</thead>
	{{/options.autoSize}}
{{#options.autoSize}}
	<thead>
							<tr  class="list-group-row">
											{{^options.hideCheck}}
<th style="width:60px" class="select-column"></th>
{{/options.hideCheck}}
					{{#items}}
{{#visible}}
<th  style="min-width:85px">
{{/visible}}
{{/items}}
</tr>
</thead>
{{/options.autoSize}}
	<tbody class="list-group">
			<tr><td colspan="100">
					<div class="alert alert-info" role="alert">You have no items.</div>
			</td></tr>
	</tbody>

</table>
</div>

</div>
<div class="paginate-footer" style="overflow:hidden;margin-top:10px"></div>
</div>`;
gform.stencils.data_grid_footer = `<div>
{{#multiPage}}
<nav class="pull-right" style="margin-left: 10px;">
{{#size}}
<ul class="pagination" style="margin:0">
	{{^isFirst}}
	{{^showFirst}}<li class="pagination-first"><a data-page="1" href="javascript:void(0);" aria-label="First"><span aria-hidden="true">&laquo;</span></a></li>{{/showFirst}}
	<li><a data-page="dec" href="javascript:void(0);" aria-label="Previous"><span aria-hidden="true">&lsaquo;</span></a></li>
	{{/isFirst}}
	{{#pages}}
			<li class="{{active}}"><a data-page="{{name}}" href="javascript:void(0);">{{name}}</a></li>
	{{/pages}}
	{{^isLast}}
	<li><a data-page="inc" href="javascript:void(0);" aria-label="Next"><span aria-hidden="true">&rsaquo;</span></a></li>
	{{^showLast}}<li class="pagination-last"><a data-page="" href="javascript:void(0);" aria-label="Last"><span aria-hidden="true">&raquo;</span></a></li>{{/showLast}}
	{{/isLast}}

</ul>
{{/size}}
</nav>

{{/multiPage}}	
<h5 class="range badge {{^size}}alert-danger{{/size}} pull-left" style="margin-right:15px;">{{#size}}Showing {{first}} to {{last}} of {{size}} results{{/size}}{{^size}}No matching results{{/size}}</h5>
{{#entries.length}}
<span class="pull-left">
	<select class="form-control" style="display:inline-block;width:auto;min-width:50px" name="count">
	<option value="10000">All</option>
	{{#entries}}
	<option value="{{value}}" {{#selected}}selected="selected"{{/selected}}>{{value}}</option>
	{{/entries}}

	</select>
	<span class="hidden-xs">results per page</span>
</span>
{{/entries.length}}
</div>`;
gform.stencils.data_grid_head = `  <tr style="cursor:pointer" class="noselect table-sort">
{{^options.hideCheck}}
<th style="width: 60px;min-width:60px;padding: 0 0 0 20px;" class="select-column"><i name="select_all" class="fa fa-2x fa-square-o"></i></th>
{{/options.hideCheck}}

{{#items}}
{{#visible}}
<th {{#options.sort}}data-sort="{{cname}}"{{/options.sort}}><h6 style="margin: 2px;font-size:13px;white-space: nowrap">{{#options.sort}}<i class="fa fa-sort text-muted"></i> {{/options.sort}}{{{label}}}</h6></th>
{{/visible}}
{{/items}}
</tr>
{{#options.filter}}
<tr class="filter">
{{^options.hideCheck}}<td>
<div name="reset-search" style="position:relative" class="btn" data-toggle="tooltip" data-placement="left" title="Clear Filters">
<i class="fa fa-filter"></i>
<i class="fa fa-times text-danger" style="position: absolute;right: 5px;"></i>
</div>
</td>{{/options.hideCheck}}

{{#items}}
{{#visible}}
<td data-inline="{{cname}}" style="min-width:85px" id="{{id}}"></td>
{{/visible}}
{{/items}}
</tr>
{{/options.filter}}`;
gform.stencils.data_grid_row = `{{^options.hideCheck}}

<td data-event="mark" data-id="{{[[}}id{{]]}}" style="width: 60px;min-width:60px;text-align:left;padding:0;-webkit-touch-callout: none;-webkit-user-select: none;-khtml-user-select: none;-moz-user-select: none;-ms-user-select: none;user-select: none;">
<span class="text-muted fa {{[[}}#iswaiting{{]]}}fa-spinner fa-spin {{[[}}/iswaiting{{]]}} {{[[}}^iswaiting{{]]}} {{[[}}#checked{{]]}}fa-check-square-o{{[[}}/checked{{]]}} {{[[}}^checked{{]]}}fa-square-o{{[[}}/checked{{]]}}{{[[}}/iswaiting{{]]}} " style="margin:6px 0 6px 20px; cursor:pointer;font-size:24px"></span>
</td>

{{/options.hideCheck}}
{{#items}}
{{#visible}}{{#isEnabled}}<td style="min-width:85px">{{{name}}}</td>{{/isEnabled}}{{/visible}}
{{/items}}`;
