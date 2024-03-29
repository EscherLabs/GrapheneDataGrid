var gform = function (data, el) {
  "use strict";
  //event management
  // this.handlers = data.events||{};
  this.eventBus = new gform.eventBus(
    { owner: "form", item: "field", handlers: data.events || {} },
    this
  );
  this.on = this.eventBus.on;
  // this.sub = this.on;
  this.trigger = this.eventBus.dispatch;
  this.dispatch = this.trigger;
  // debugger;
  // _.map(data.events,function(event,index){
  //     if(!_.isArray(event)){
  //         this.eventBus.handlers[index]=[event];
  //     }
  // }.bind(this))
  this.on("reset", function (e) {
    e.form.set(e.form.options.data);
  });
  this.on("clear", function (e) {
    e.form.set();
  });
  if (typeof data.collections == "object") {
    this.collections = data.collections;
  } else {
    this.collections = gform.collections;
  }
  // this.sub = function (event, handler, delay) {
  //     delay = delay || 0;
  //     this.on(event, _.debounce(handler, delay));
  //     return this;
  // }.bind(this);

  //initalize form
  this.options = _.assignIn(
    {
      legend: "",
      default: gform.default,
      data: "search",
      columns: gform.columns,
      name: gform.getUID(),
    },
    this.opts,
    data
  );
  this.options.fields = this.options.fields.concat(
    this.options.actions || [{ type: "cancel" }, { type: "save" }]
  );
  if (typeof this.options.data == "string") {
    this.options.data = window.location[this.options.data]
      .substr(1)
      .split("&")
      .map(function (val) {
        return val.split("=");
      })
      .reduce(function (total, current) {
        total[current[0]] = decodeURIComponent(current[1]);
        return total;
      }, {});
  }

  //set flag on all root fieldsets as a section
  if (this.options.sections) {
    _.each(
      _.filter(this.options.fields, { type: "fieldset" }),
      function (item, i) {
        item.index = i;
        item.section = true;
        item.id = gform.getUID();
        return item;
      }
    );
  }

  this.el = el || data.el;
  if (typeof this.el == "string") {
    this.selector = this.el + "";
    this.el = document.querySelector(this.el);
  } else if (typeof this.el == "object") {
    this.el;
  } else {
    el = "";
  }

  this.trigger("initialize");

  var create = function () {
    if (typeof this.el == "undefined") {
      this.options.renderer = "modal";
      this.el = gform.create(
        gform.render(this.options.template || "modal_container", this.options)
      );
      // document.querySelector('body').appendChild(this.el)
      gform.addClass(this.el, "active");

      this.on("close", function (e) {
        e.form.modal("hide");
      });
      // this.sub('cancel', function(e){
      //     gform.removeClass(e.form.el, 'active')
      //     // e.form.destroy();
      //     // document.body.removeChild(e.form.el);
      //     // delete this.el;
      // });
      this.on("save", function (e) {
        // console.log(e.form.toJSON())
        gform.removeClass(e.form.el, "active");
      });
      this.el.querySelector(".close").addEventListener(
        "click",
        function (e) {
          this.trigger("cancel", this);
        }.bind(this)
      );
      document.addEventListener(
        "keyup",
        function (e) {
          if (e.key === "Escape") {
            // escape key maps to keycode `27`
            this.trigger("cancel", this);
          }
        }.bind(this)
      );
    }
    if (this.options.clear && !(this.options.renderer == "modal")) {
      this.el.innerHTML = gform.render(
        this.options.sections + "_container",
        this.options
      );
    }
    this.container = this.el.querySelector("form") || this.el;

    this.rows = {};
    this.fields = _.map(
      this.options.fields,
      gform.createField.bind(this, this, this.options.data || {}, null, null)
    );

    _.each(this.fields, gform.inflate.bind(this, this.options.data || {}));
    // _.each(this.fields, function(field) {
    //     field.owner.trigger('change:' + field.name,field.owner, field);
    // })
    gform.each.call(this, function (field) {
      field.owner.trigger("change:" + field.name, field);
    });
    if (!this.options.private) {
      gform.instances[this.options.name] = this;
    }
  };

  this.restore = create.bind(this);
  this.get = this.toJSON = gform.toJSON.bind(this);

  this.reflow = gform.reflow.bind(this);
  this.find = gform.find.bind(this);

  (this.set = function (name, value) {
    if (typeof name == "string") {
      this.find(name).set(value);
    }
    if (typeof name == "object") {
      _.each(
        name,
        function (item, index) {
          var temp = this.find(index);
          if (typeof temp !== "undefined") {
            temp.set(item);
          }
        }.bind(this)
      );
    }
    // if(typeof name == 'undefined'){
    if (name == null) {
      gform.each.call(this, function (field) {
        field.set("");
      });
    }
    // _.find(this.fields, {name: name}).set(value);
  }.bind(this)),
    (this.isActive = true);

  this.destroy = function () {
    this.trigger(["close", "destroy"]);

    //pub the destroy methods for each field
    // _.each(function() {if(typeof this.destroy === 'function') {this.destroy();}});
    //Clean up affected containers
    this.el.innerHTML = "";
    // for(var i = this.fieldsets.length-1;i >=0; i--) { $(this.fieldsets[i]).empty(); }

    //Dispatch the destroy method of the renderer we used
    // if(typeof this.renderer.destroy === 'function') { this.renderer.destroy(); }

    //Remove the global reference to our form
    delete gform.instances[this.options.name];

    this.trigger("destroyed");
  };
  create.call(this);

  var tabs = this.el.querySelector("ul.tabs");
  if (tabs !== null) {
    tabs.addEventListener(
      "click",
      function (e) {
        if (e.target.nodeName == "LI") {
          e.preventDefault();
          gform.removeClass(this.el.querySelector("ul.tabs .active"), "active");
          gform.removeClass(
            this.el.querySelector(".tab-pane.active"),
            "active"
          );
          gform.addClass(e.target, "active");
          gform.addClass(
            this.el.querySelector(e.target.parentElement.attributes.href.value),
            "active"
          );
        }
      }.bind(this)
    );
  }
  if (this.options.autoFocus || gform.options.autoFocus) {
    gform.types[this.fields[0].type].focus.call(this.fields[0]);
  }

  this.el.addEventListener(
    "click",
    function (e) {
      var field;
      if (e.target.dataset.id) {
        field = gform.findByID.call(this, e.target.dataset.id);
      }
      if (e.target.classList.contains("gform-add")) {
        e.stopPropagation();
        var fieldCount = _.countBy(field.parent.fields, {
          name: field.name,
        }).true;

        if (fieldCount < (field.array.max || 5)) {
          var index = _.findIndex(field.parent.fields, { id: field.id });
          var atts = {};

          var newField = gform.createField.call(
            this,
            field.parent,
            atts,
            field.el,
            null,
            field.item,
            null,
            null,
            fieldCount
          );
          field.parent.fields.splice(index + 1, 0, newField);
          field.parent.reflow();
          _.each(
            _.filter(field.parent.fields, { name: field.name }),
            function (item, index) {
              // item.update({index:index})
              item.index = index;
              // item.label = gform.renderString(item.item.label, item);
              // item.el.querySelector('label').innerHTML = item.label
              gform.types[item.type].setLabel.call(item);
            }
          );

          gform.each.call(field.owner, function (field) {
            field.owner.trigger("change:" + field.name, field);
          });

          gform.types[newField.type].focus.call(newField);
          field.owner.trigger(
            [
              "change",
              "change:" + field.name,
              "create",
              "create:" + field.name,
              "inserted",
              "inserted:" + field.name,
            ],
            field
          );
          fieldCount++;
        }

        var testFunc = function (status, button) {
          gform.toggleClass(button, "hidden", status);
        };
        _.each(
          document.body.querySelectorAll(
            '[data-name="' + field.name + '"] .gform-add'
          ),
          testFunc.bind(null, fieldCount >= (field.array.max || 5))
        );

        _.each(
          document.body.querySelectorAll(
            '[data-name="' + field.name + '"] .gform-minus'
          ),
          testFunc.bind(null, !(fieldCount > (field.array.min || 1)))
        );
      }
      if (e.target.classList.contains("gform-minus")) {
        e.stopPropagation();
        var fieldCount = _.countBy(field.parent.fields, {
          name: field.name,
        }).true;
        if (fieldCount > (field.array.min || 1)) {
          var index = _.findIndex(field.parent.fields, { id: field.id });
          field.parent.fields.splice(index, 1);
          field.parent.reflow();
          if (!field.target) {
            _.each(
              _.filter(field.parent.fields, { name: field.name }),
              function (item, index) {
                // item.update({index:index})
                item.index = index;

                // item.label = gform.renderString(item.item.label, item);
                // item.el.querySelector('label').innerHTML = item.label
                gform.types[item.type].setLabel.call(item);
              }
            );
          } else {
            this.container.querySelector(field.target).removeChild(field.el);
          }
          field.owner.trigger(
            [
              "change",
              "change:" + field.name,
              "removed",
              "removed:" + field.name,
            ],
            field
          );
          fieldCount--;
        } else {
          field.set(null);
        }

        var testFunc = function (status, button) {
          gform.toggleClass(button, "hidden", status);
        };
        _.each(
          document.body.querySelectorAll(
            '[data-name="' + field.name + '"] .gform-add'
          ),
          testFunc.bind(null, fieldCount >= (field.array.max || 5))
        );

        _.each(
          document.body.querySelectorAll(
            '[data-name="' + field.name + '"] .gform-minus'
          ),
          testFunc.bind(null, !(fieldCount > (field.array.min || 1)))
        );
      }
    }.bind(this)
  );
  return this;
};
gform.each = function (func) {
  _.each(this.fields, function (field) {
    func(field);
    if (typeof field.fields !== "undefined") {
      gform.each.call(field, func);
    }
  });
};

gform.find = function (oname) {
  var name = oname.split(".");
  var temp = _.find(this.fields, { name: name.shift() });
  if (typeof temp !== "undefined") {
    if (typeof temp.find !== "undefined") {
      if (temp.name == oname) {
        return temp;
      }
      return temp.find(name.join("."));
    } else {
      return temp;
    }
  } else {
    if (
      typeof this.parent !== "undefined" &&
      typeof this.parent.find == "function"
    ) {
      return this.parent.find(oname);
    }
  }
};
gform.findByID = function (id) {
  var temp = false;
  _.each(this.fields, function (field) {
    if (field.id == id) {
      temp = field;
    }
    if (!temp && typeof field.fields !== "undefined") {
      temp = gform.findByID.call(field, id);
    }
  });
  return temp;
};
//parse form values into JSON object
gform.toJSON = function (name) {
  if (typeof name == "string" && name.length > 0) {
    name = name.split(".");
    return _.find(this.fields, { name: name.shift() }).get(name.join("."));
  }
  var obj = {};
  _.each(
    this.fields,
    function (field) {
      if (field.parsable) {
        if (field.array) {
          obj[field.name] = obj[field.name] || [];
          obj[field.name].push(field.get());
        } else {
          obj[field.name] = field.get();
        }
      }
    }.bind(this)
  );
  return obj;
};
gform.m = function (l, a, m, c) {
  function h(a, b) {
    b = b.pop ? b : b.split(".");
    a = a[b.shift()] || "";
    return 0 in b ? h(a, b) : a;
  }
  var k = gform.m,
    e = "";
  a = _.isArray(a) ? a : a ? [a] : [];
  a = c ? (0 in a ? [] : [1]) : a;
  for (c = 0; c < a.length; c++) {
    var d = "",
      f = 0,
      n,
      b = "object" == typeof a[c] ? a[c] : {},
      b = _.assign({}, m, b);
    b[""] = { "": a[c] };
    l.replace(
      /([\s\S]*?)({{((\/)|(\^)|#)(.*?)}}|$)/g,
      function (a, c, l, m, p, q, g) {
        f
          ? (d += (f && !p) || 1 < f ? a : c)
          : ((e += c.replace(
              /{{{(.*?)}}}|{{(!?)(&?)(>?)(.*?)}}/g,
              function (a, c, e, f, g, d) {
                return c
                  ? h(b, c)
                  : f
                  ? h(b, d)
                  : g
                  ? k(h(b, d), b)
                  : e
                  ? ""
                  : new Option(h(b, d)).innerHTML;
              }
            )),
            (n = q));
        p
          ? --f ||
            ((g = h(b, g)),
            (e = /^f/.test(typeof g)
              ? e +
                g.call(b, d, function (a) {
                  return k(a, b);
                })
              : e + k(d, g, b, n)),
            (d = ""))
          : ++f;
      }
    );
  }
  return e;
};

gform.reflow = function () {
  _.each(
    this.rows,
    function (item, i) {
      this.container.removeChild(item.ref);
      delete this.rows[i];
    }.bind(this)
  );
  _.each(this.fields, function (field) {
    if (field.columns > 0) {
      // && field.visible){
      var cRow;
      // cRow = field.owner.rows[field.owner.rows.length-1];
      var formRows = (field.parent || field.owner).container.querySelectorAll(
        "form > ." +
          field.owner.options.rowClass +
          ",fieldset > ." +
          field.owner.options.rowClass
      );
      var temp = (formRows[formRows.length - 1] || {}).id;
      if (typeof temp !== "undefined") {
        cRow = (field.parent || field.owner).rows[temp];
      }
      if (
        typeof cRow === "undefined" ||
        cRow.used + parseInt(field.columns, 10) + parseInt(field.offset, 10) >
          field.owner.options.columns ||
        field.row == true
      ) {
        var temp = gform.getUID();
        cRow = {};
        cRow.used = 0;
        cRow.ref = document.createElement("div");
        cRow.ref.setAttribute("id", temp);
        cRow.ref.setAttribute("class", field.owner.options.rowClass);
        cRow.ref.setAttribute("style", "margin-bottom:0;");
        (field.parent || field.owner).rows[temp] = cRow;
        (field.parent || field.owner).container.appendChild(cRow.ref);
      }

      cRow.used += parseInt(field.columns, 10);
      cRow.used += parseInt(field.offset, 10);
      cRow.ref.appendChild(field.el);
      field.row = temp;
    }
  });
};
gform.instances = {};
//creates multiple instances of duplicatable fields if input attributes exist for them
gform.inflate = function (atts, fieldIn, ind, list) {
  var newList = list;
  if (fieldIn.array) {
    newList = _.uniqBy(newList, "name");
  }
  var field = _.findLast(newList, { name: newList[ind].name });

  if (!field.array && field.fields) {
    _.each(
      field.fields,
      gform.inflate.bind(
        this,
        atts[field.name] || field.owner.options.data[field.name] || {}
      )
    );
  }
  if (field.array) {
    var fieldCount = field.array.min || 0;

    if (
      typeof atts[field.name] !== "object" &&
      typeof field.owner.options.data[field.name] == "object"
    ) {
      atts = field.owner.options.data;
    }
    if (typeof atts[field.name] == "object" && atts[field.name].length > 1) {
      if (atts[field.name].length > fieldCount) {
        fieldCount = atts[field.name].length;
      }
    }
    for (var i = 1; i < fieldCount; i++) {
      var newfield = gform.createField.call(
        this,
        field.parent,
        atts,
        field.el,
        i,
        field.item,
        null,
        null,
        i
      );
      field.parent.fields.splice(
        _.findIndex(field.parent.fields, { id: field.id }) + 1,
        0,
        newfield
      );
      field = newfield;
    }
    var testFunc = function (status, button) {
      gform.toggleClass(button, "hidden", status);
    };
    _.each(
      document.body.querySelectorAll(
        '[data-name="' + field.name + '"] .gform-add'
      ),
      testFunc.bind(null, fieldCount >= (field.array.max || 5))
    );

    _.each(
      document.body.querySelectorAll(
        '[data-name="' + field.name + '"] .gform-minus'
      ),
      testFunc.bind(null, !(fieldCount > (field.array.min || 1)))
    );
  }
};
gform.normalizeField = function (fieldIn, parent) {
  var parent = parent || null;
  fieldIn.type = fieldIn.type || this.options.default.type || "text";
  //work gform.default in here
  var field = _.assignIn(
    {
      name: (gform.renderString(fieldIn.label) || "")
        .toLowerCase()
        .split(" ")
        .join("_"),
      id: gform.getUID(),
      // type: 'text',
      label: fieldIn.legend || fieldIn.name,
      validate: [],
      valid: true,
      parsable: true,
      visible: true,
      editable: true,
      parent: parent,
      array: false,
      columns: this.options.columns || gform.columns,
      offset: 0,
      ischild: !(parent instanceof gform),
    },
    this.opts,
    gform.default,
    this.options.default,
    (gform.types[fieldIn.type] || gform.types["text"]).defaults,
    fieldIn
  );
  //keep required separate
  // field.validate.required = field.validate.required|| field.required || false;

  // if(typeof field.validate.required == 'undefined'){field.validate.required = false}
  if (field.name == "") {
    field.name = field.id;
  }
  // if((typeof fieldIn.label == 'undefined' || fieldIn.label == '') && (field.label == '' || typeof field.label == 'undefined') ){fieldIn.label = field.name;}
  field.item = _.extend(fieldIn, {});
  return field;
};

gform.createField = function (
  parent,
  atts,
  el,
  index,
  fieldIn,
  i,
  j,
  instance
) {
  var field = gform.normalizeField.call(this, fieldIn, parent);
  field.owner = this;
  if (field.columns > this.options.columns) {
    field.columns = this.options.columns;
  }

  if (
    field.array &&
    typeof (atts[field.name] || field.owner.options.data[field.name]) ==
      "object"
  ) {
    field.value =
      (atts[field.name] || field.owner.options.data[field.name])[index || 0] ||
      {};
  } else {
    field.value =
      atts[field.name] || field.owner.options.data[field.name] || field.value;
  }

  if (field.item.value !== 0) {
    if (field.array && typeof atts[field.name] == "object") {
      field.value = atts[field.name][index || 0];
    } else {
      if (typeof field.item.value === "function") {
        //uncomment this when ready to test function as value for input
        field.valueFunc = field.item.value;
        field.derivedValue = function () {
          return field.valueFunc.call(field, field.owner.toJSON());
        };
        field.item.value = field.item.value = field.derivedValue();
        field.owner.on(
          "change",
          function () {
            this.set.call(this, this.derivedValue());
          }.bind(field)
        );
      } else {
        //may need to search deeper in atts?
        field.value = atts[field.name] || field.value || "";
      }
    }
  } else {
    field.value = 0;
  }
  field.index = instance || 0;
  field.label = gform.renderString(field.item.label || field.label, field);
  // field.index = ;

  field.satisfied =
    field.satisfied || gform.types[field.type].satisfied.bind(field);
  field.update = gform.types[field.type].update.bind(field);
  field.destroy = gform.types[field.type].destroy.bind(field);

  field.active = function () {
    return (
      this.parent.active() && this.editable && this.parsable && this.visible
    );
  };
  field.set = function (value, silent) {
    //not sure we should be excluding objects - test how to allow objects
    if (this.value != value || value == null) {
      // && typeof value !== 'object') {
      if (!gform.types[this.type].set.call(this, value)) {
        this.value = value;

        if (!silent) {
          this.owner.trigger(["change:" + this.name, "change"], this);
          // this.owner.trigger('change',this);this.owner.trigger('change:'+this.name,this)
        }
      }
    }
  }.bind(field);

  field.get = field.get || gform.types[field.type].get.bind(field);

  field.render = field.render || gform.types[field.type].render.bind(field);

  field.el = gform.types[field.type].create.call(field);

  field.container = field.el.querySelector("fieldset") || field.el || null;
  if (typeof gform.types[field.type].reflow !== "undefined") {
    field.reflow = gform.types[field.type].reflow.bind(field) || null;
  }
  if (typeof gform.types[field.type].find !== "undefined") {
    field.find = gform.types[field.type].find.bind(field) || null;
  }

  if (
    !field.target &&
    !field.section &&
    (this.options.clear || field.isChild)
  ) {
    if (field.columns > 0) {
      var cRow;
      var formRows = (field.parent || field.owner).container.querySelectorAll(
        "form > ." +
          field.owner.options.rowClass +
          ",fieldset > ." +
          field.owner.options.rowClass
      );
      var temp = (formRows[formRows.length - 1] || {}).id;
      if (typeof temp !== "undefined") {
        cRow = (field.parent || field.owner).rows[temp];
      }
      if (
        typeof cRow === "undefined" ||
        cRow.used + parseInt(field.columns, 10) + parseInt(field.offset, 10) >
          this.options.columns ||
        field.row == true
      ) {
        var temp = gform.getUID();
        cRow = {};
        cRow.used = 0;
        cRow.ref = document.createElement("div");
        cRow.ref.setAttribute("id", temp);
        cRow.ref.setAttribute("class", field.owner.options.rowClass);
        cRow.ref.setAttribute("style", "margin-bottom:0;");
        (field.parent || field.owner).rows[temp] = cRow;
        (field.parent || field.owner).container.appendChild(cRow.ref);
      }

      cRow.used += parseInt(field.columns, 10);
      cRow.used += parseInt(field.offset, 10);
      cRow.ref.appendChild(field.el);
      field.row = temp;
    }
  } else {
    if (!field.target) {
      field.target =
        '[name="' + field.name + '"],[data-inline="' + field.name + '"]';
    }
    var temp = this.el.querySelector(field.target);
    if (typeof temp !== "undefined" && temp !== null) {
      temp.appendChild(field.el);
    } else if (field.section) {
      field.owner.el
        .querySelector("." + field.owner.options.sections + "-content")
        .appendChild(field.el);
    }
  }

  gform.types[field.type].initialize.call(field);
  if (field.fields) {
    var newatts = {};
    if (
      field.array &&
      typeof (atts[field.name] || field.owner.options.data[field.name]) ==
        "object"
    ) {
      newatts =
        (atts[field.name] || field.owner.options.data[field.name])[
          index || 0
        ] || {};
    } else {
      newatts = atts[field.name] || field.owner.options.data[field.name] || {};
    }
    field.fields = _.map(
      field.fields,
      gform.createField.bind(this, field, newatts, null, null)
    );
    if (field.array) {
      _.each(field.fields, gform.inflate.bind(this, newatts));
    }
  }

  gform.processConditions.call(field, field.show, function (result) {
    // if(this.visible !== result){
    // this.parent.reflow();
    // }
    this.el.style.display = result ? "block" : "none";
    this.visible = result;
    // this.parent.reflow();
  });
  // gform.processConditions.call(field, field.visible, function(result){
  //     this.el.style.visibility = result ? "visible" : "hidden";
  //     this.visible = result;
  // })

  gform.processConditions.call(field, field.edit, function (result) {
    this.editable = result;
    gform.types[this.type].edit.call(this, this.editable);
  });
  gform.processConditions.call(
    field,
    field.parse || field.show,
    function (result) {
      this.parsable = result;
    }
  );
  if (field.required) {
    gform.processConditions.call(field, field.required, function (result) {
      if (this.required !== result) {
        this.update({ required: result });
      }
    });
  }

  // debugger;
  //     this.editableConditions = gform.processConditions.call(field, field.edit,
  //         function(bool, token) {
  //             debugger;
  //             if(typeof bool == 'boolean') {
  //                 this.editableConditions[token] = bool;
  //                 this.iseditable = true;
  //                 this.edit();
  //                 for(var c in this.editableConditions) {
  //                     if(!this.editableConditions[c]) {
  //                         this.iseditable = false;
  //                         this.disable();
  //                         break;
  //                     }
  //                 }
  //             }
  //         }
  //     );
  //     if(typeof this.editableConditions == 'boolean'){
  //         this.iseditable = this.editableConditions;
  //         // this.update({}, true);
  //     }

  return field;
};
gform.rows = {
  add: function (parent) {
    var temp = gform.getUID();
    cRow = {};
    cRow.used = 0;
    cRow.ref = document.createElement("div");
    cRow.ref.setAttribute("id", temp);
    cRow.ref.setAttribute("class", this.options.rowClass);
    cRow.ref.setAttribute("style", "margin-bottom:0;");
    parent.rows[temp] = cRow;
    parent.container.appendChild(cRow.ref);
    return cRow;
  },
  remove: function () {},
};
// gform.update = function(field){
//     field.el.innerHTML = gform.types[field.type].render.call(field);
//     var oldDiv = document.getElementById(field.id);
//     if(oldDiv == null){
//         // oldDiv.parentNode.appendChild(field.el, oldDiv);

//     }else{
//         oldDiv.parentNode.replaceChild(field.el, oldDiv);
//     }
// }

gform.ajax = function (options) {
  var request = new XMLHttpRequest();
  request.onreadystatechange = function () {
    if (request.readyState === 4) {
      if (request.status === 200) {
        options.success(JSON.parse(request.responseText));
      } else {
        console.log(request.responseText);
        options.error(request.responseText);
      }
    }
  };
  request.open(options.verb || "GET", options.path);
  request.send();
};

gform.default = {};
gform.options = { autoFocus: true };
gform.prototype.opts = {
  clear: true,
  sections: "",
  suffix: ":",
  rowClass: "row",
  requiredText: '<span style="color:red">*</span>',
};

gform.eventBus = function (options, owner) {
  this.options = options || { owner: "form", item: "field" };
  this.owner = owner || this;
  this.handlers = options.handlers || {};
  _.each(this.handlers, function (a, b, c) {
    if (typeof a == "function") {
      c[b] = [a];
    }
  });

  this.dispatch = function (e, f, a) {
    var a = a || {};
    a[this.options.owner] = this.owner;
    if (typeof f !== "undefined") {
      a[this.options.item] = f;
    }
    a.default = true;
    a.continue = true;
    a.preventDefault = function () {
      a.default = false;
    }.bind(this);
    a.stopPropagation = function () {
      a.continue = false;
    }.bind(this);
    var events = [];
    if (typeof e == "string") {
      events.push(e);
    } else {
      events = events.concat(e);
    }
    _.each(
      events,
      function (args, event) {
        args.event = event;
        var f = function (handler) {
          if (a.continue) {
            handler.call(null, args);
          }
        }.bind(this);
        _.each(this.handlers[event], f);
        _.each(this.handlers["*"], f);
      }.bind(this, a)
    );
    return a;
  }.bind(this);
  this.on = function (event, handler) {
    var events = event.split(" ");
    if (typeof this.handlers[event] !== "object") {
      this.handlers[event] = [];
    }
    _.each(
      events,
      function (event) {
        this.handlers[event].push(handler);
      }.bind(this)
    );
    return this.owner;
  }.bind(this);
};
// gform.prototype.sub = function (event, handler) {
//     var events = event.split(' ');
//     if (typeof this.handlers[event] !== 'object') {
//     this.handlers[event] = [];
//     }
//     _.each(events,function(event){
//         this.handlers[event].push(handler);
//     }.bind(this))
//     return this;
// };
// gform.prototype.on = gform.prototype.sub;
// gform.prototype.trigger = function (e,f,a) {
//     var a = a || {};
//     a[this.options.owner||'form'] = this;
//     if(typeof f !== 'undefined'){
//         a[this.options.item||'field'] = f;
//     }

//     var events = []
//     if(typeof e == 'string'){
//         events.push(e)
//     }else{events = events.concat(e)}
//     _.each(events, function(args,event){
//         args.event = event;
//         var f = function (handler) {
//             handler.call(null,args);
//         }.bind(this)
//         _.each(this.handlers[event], f);
//         _.each(this.handlers['*'], f);
//     }.bind(this, a))
//     return this;
// }

// gform.optionsObj = function(opts, value, count){
// 	// If max is set on the field, assume a number set is desired.
// 	// min defaults to 0 and the step defaults to 1.
// 	if(typeof opts.max !== 'undefined' && opts.max !== '') {
//         for(var i = (opts.min || 0);i<=opts.max;i=i+(opts.step || 1)){
//             opts.options.push(""+i);
//         }
//     }
//     if(typeof opts.options == 'string' || typeof opts.url == 'string') {
//         opts.path = opts.url || opts.options;
//         opts.options = {label:'-'};
//         opts.options[opts.path] = false;
//         opts.url = null;
//         gform.ajax({path: opts.path, success:function(data) {
//             this.options = data;
//             this.options = gform.mapOptions.call(this, this, this.value);
//             this.update()
//         }.bind(this)})
// 		return opts;
//     }

//     return _.map(opts.options, function(opts,item, i){
//         if(typeof item === 'object' && item.type == 'optgroup'){
//             // var optgroup = {label:item.label};
//             item.options = gform.optionsObj.call(this, _.merge({options:[]},gform.default, item),value,count);
//             item.id = gform.getUID();

//             gform.processConditions.call(this, item.edit, function(id, result){
//                 var op = this.el.querySelectorAll('[data-id="'+id+'"]');
//                 for (var i = 0; i < op.length; i++) {
//                       op[i].disabled = !result;
//                   }
//             }.bind(this,item.id))
//             gform.processConditions.call(this, item.show, function(id, result){
//                 var op = this.el.querySelectorAll('[data-id="'+id+'"]');
//                 for (var i = 0; i < op.length; i++) {
//                       op[i].hidden = !result;
//                   }
//             }.bind(this,item.id))
//             count += item.options.length;

//             return {optgroup:item};
//         }else{
//             if(typeof item === 'string' || typeof item === 'number' || typeof item == 'boolean') {
//                 item = {label: item, value:item};
//             }
//             item.index = item.index || ""+count;

//             if(typeof opts.format !== 'undefined'){

//                 if(typeof opts.format.label !== 'undefined' ){
//                     item.label = gform.renderString(opts.format.label,item);
//                 }
//                 if(typeof opts.format.value !== 'undefined' ){
//                     item.value = gform.renderString(opts.format.value,item);
//                 }
//             }
//             // _.assignIn(item,{label: gform.renderString(opts.format.label,item), value: gform.renderString(opts.format.value,item) });
//             if(item.value == value || (this.multiple && (value.indexOf(item.value)>=0) )) { item.selected = true;}

//             // if(item.value == value) { item.selected = true;}
//             count+=1;
//             item.i = count;
//             return item;
//         }

//     }.bind(this,opts))
// }

// /* Process the options of a field for normalization */
// gform.mapOptions = function(opts, value, count) {

//     count = count||0;
//     var newOpts = {options:[]};
//     if(typeof opts.options == 'object' && !_.isArray(opts.options)){
//         _.merge(newOpts.options, opts.options);
//         // newOpts.options = opts.options;
//     }

//     if(typeof opts.options == 'function') {
//         newOpts.action = opts.options;
//         opts.options = newOpts.action.call(this);
//     }

//     opts = _.merge({options:[]}, gform.default, opts);

//     newOpts.options =  gform.optionsObj.call(this,opts,value,count);
//     return newOpts.options;
// }

gform.mapOptions = function (optgroup, value, count, collections) {
  this.collections = collections;
  this.eventBus = new gform.eventBus({ owner: "field", item: "option" }, this);
  this.optgroup = _.extend({}, optgroup);
  count = count || 0;
  var format = this.optgroup.format;
  function pArray(opts) {
    return _.map(
      opts,
      function (item) {
        if (typeof item === "object" && item.type == "optgroup") {
          item.map = new gform.mapOptions(item, value, count, this.collections);
          item.map.on(
            "*",
            function (e) {
              this.eventBus.dispatch(e.event);
            }.bind(this)
          );
          item.id = gform.getUID();
          gform.processConditions.call(
            this,
            item.edit,
            function (id, result) {
              var op = this.el.querySelectorAll('[data-id="' + id + '"]');
              for (var i = 0; i < op.length; i++) {
                op[i].disabled = !result;
              }
            }.bind(this, item.id)
          );
          gform.processConditions.call(
            this,
            item.show,
            function (id, result) {
              var op = this.el.querySelectorAll('[data-id="' + id + '"]');
              for (var i = 0; i < op.length; i++) {
                op[i].hidden = !result;
              }
            }.bind(this, item.id)
          );
          // count += item.options.length;
          return item;
        } else {
          var option = _.extend({}, item);
          option.data = item;
          if (
            typeof item === "string" ||
            typeof item === "number" ||
            typeof item == "boolean"
          ) {
            option.label = option.value = item;
          }
          option.index = item.index || "" + count;
          if (typeof format !== "undefined") {
            if (typeof format.label !== "undefined") {
              option.label = gform.renderString(format.label, option);
            }
            if (typeof format.value !== "undefined") {
              option.value = gform.renderString(format.value, option);
            }
          }
          if (
            option.value == value ||
            (this.multiple && value.indexOf(option.value) >= 0)
          ) {
            option.selected = true;
          }

          count += 1;
          option.i = count;
          return option;
        }
      }.bind(this)
    );
  }

  this.optgroup.options = this.optgroup.options || [];
  // optgroup.options = optgroup.options || optgroup.path || optgroup.action;

  switch (typeof this.optgroup.options) {
    case "string":
      this.optgroup.path = this.optgroup.path || this.optgroup.options;
      this.optgroup.options = [];
      break;
    case "function":
      this.optgroup.action = this.optgroup.options;
      this.optgroup.options = [];
      break;
  }

  // If max is set on the field, assume a number set is desired.
  // min defaults to 0 and the step defaults to 1.
  if (typeof this.optgroup.max !== "undefined" && this.optgroup.max !== "") {
    for (
      var i = this.optgroup.min || 0;
      i <= this.optgroup.max;
      i = i + (this.optgroup.step || 1)
    ) {
      this.optgroup.options.push("" + i);
    }
  }

  if (typeof this.optgroup.action !== "undefined") {
    this.optgroup.options = this.optgroup.options.concat(
      pArray.call(this, this.optgroup.action.call(this))
    );
  }

  if (_.isArray(this.optgroup.options)) {
    this.optgroup.options = pArray.call(this, this.optgroup.options);
  }

  if (typeof this.optgroup.path !== "undefined") {
    this.collections.on(
      this.optgroup.path,
      function (e) {
        this.optgroup.options = pArray.call(this.optgroup.map, e.collection);
        this.eventBus.dispatch("change");
      }.bind(this)
    );

    if (typeof this.collections.get(this.optgroup.path) === "undefined") {
      this.collections.add(this.optgroup.path, []);
      gform.ajax({
        path: this.optgroup.path,
        success: function (data) {
          this.collections.update(this.optgroup.path, data);
          // this.optgroup.options = pArray.call(this.optgroup.map, data);
          // this.eventBus.dispatch('change')
        }.bind(this),
      });
    } else {
      this.optgroup.options = pArray.call(
        this.optgroup.map,
        this.collections.get(this.optgroup.path)
      );
    }
  }

  return {
    getobject: function () {
      var temp = {};
      temp = _.map(this.optgroup.options, function (item) {
        if (typeof item.map !== "undefined") {
          item.options = item.map.getoptions();
          return {
            optgroup: {
              label: item.label || "",
              options: item.map.getoptions(),
            },
          };
        } else {
          return item;
        }
      });
      return temp;
    }.bind(this),
    getoptions: function (search) {
      var temp = [];
      _.each(this.optgroup.options, function (item) {
        if (typeof item.map !== "undefined") {
          temp = temp.concat(item.map.getoptions());
        } else {
          temp.push(item);
        }
      });
      // debugger;
      if (typeof search !== "undefined") {
        return _.find(temp, search);
      }
      return temp;
    }.bind(this),
    on: this.eventBus.on,
    handlers: this.handlers,
    optgroup: this.optgroup,
  };
};
// gform.mapOptions.prototype.handlers = {initialize: []}
// gform.mapOptions.prototype.on = gform.prototype.sub;
// gform.mapOptions.prototype.trigger = gform.prototype.trigger;

gform.collectionManager = function (refObject) {
  var collections = refObject || {};
  this.eventBus = new gform.eventBus(
    { owner: "manager", item: "collection", handlers: {} },
    this
  );

  return {
    add: function (name, data) {
      collections[name] = data;
    },
    get: function (name) {
      return collections[name];
    },
    update: function (name, data) {
      if (typeof data !== "undefined") {
        collections[name] = data;
      }
      this.eventBus.dispatch(name, collections[name]);
    }.bind(this),
    on: this.eventBus.on,
  };
};

gform.collections = new gform.collectionManager();

gform.render = function (template, options) {
  return gform.m(
    gform.stencils[template || "text"] || gform.stencils["text"],
    _.extend({}, gform.stencils, options)
  );
};
gform.create = function (text) {
  return document.createRange().createContextualFragment(text)
    .firstElementChild;
};
gform.renderString = function (string, options) {
  return gform.m(string || "", options || {});
};

// add some classes. Eg. 'nav' and 'nav header'
gform.addClass = function (elem, classes) {
  elem.className = _.chain(elem.className)
    .split(/[\s]+/)
    .union(classes.split(" "))
    .join(" ")
    .value();
  // return elem;
};
gform.removeClass = function (elem, classes) {
  elem.className = _.chain(elem.className)
    .split(/[\s]+/)
    .difference(classes.split(" "))
    .join(" ")
    .value();
  // return elem
};
gform.toggleClass = function (elem, classes, status) {
  if (status) {
    gform.addClass(elem, classes);
  } else {
    gform.removeClass(elem, classes);
  }
  // return elem
};

gform.VERSION = "0.0.0.7";
gform.i = 0;
gform.getUID = function () {
  return "f" + gform.i++;
};
gform.types = {
  input: {
    defaults: {},
    setLabel: function () {
      this.label = gform.renderString(this.item.label || this.label, this);
      var labelEl = this.el.querySelector("label");
      if (labelEl !== null) {
        labelEl.innerHTML = this.label;
      }
    },
    create: function () {
      var tempEl = document.createElement("span");
      tempEl.setAttribute("id", this.id);
      if (this.owner.options.clear) {
        tempEl.setAttribute("class", "" + gform.columnClasses[this.columns]);
      }
      tempEl.innerHTML = this.render();
      return tempEl;
    },
    render: function () {
      return gform.render(this.type, this);
    },
    destroy: function () {
      this.el.removeEventListener("change", this.onchangeEvent);
      //   this.el.removeEventListener('change',this.onchange );
      this.el.removeEventListener("input", this.onchangeEvent);
    },
    initialize: function () {
      //   this.iel = this.el.querySelector('input[name="' + this.name + '"]')
      //   if(this.onchange !== undefined){ this.el.addEventListener('change', this.onchange);}
      this.onchangeEvent = function (input) {
        //   this.input = input;
        this.value = this.get();
        if (this.el.querySelector(".count") != null) {
          var text = this.value.length;
          if (this.limit) {
            text += "/" + this.limit;
          }
          this.el.querySelector(".count").innerHTML = text;
        }
        //   this.update({value:this.get()},true);
        //   gform.types[this.type].focus.call(this)
        this.owner.trigger(
          ["change:" + this.name, "change", "input:" + this.name, "input"],
          this,
          { input: this.value }
        );

        //   this.owner.trigger('change:'+this.name, this,{input:this.value});
        //   this.owner.trigger('change', this,{input:this.value});
        //   this.owner.trigger('input:'+this.name, this,{input:this.value});
        //   this.owner.trigger('input', this,{input:this.value});
      }.bind(this);
      this.input = this.input || false;
      this.el.addEventListener("input", this.onchangeEvent.bind(null, true));

      this.el.addEventListener("change", this.onchangeEvent.bind(null, false));
    },
    update: function (item, silent) {
      if (
        typeof item !== "undefined" &&
        (typeof item.options !== undefined ||
          typeof item.max !== undefined ||
          typeof item.action !== undefined) &&
        typeof this.mapOptions !== "undefined"
      ) {
        delete this.mapOptions;
        this.item = _.defaults({}, item, this.item);

        // this.item.options = _.assign([],this.item.options,item.options);
        this.options = _.extend([], this.item.options);
        this.max = this.item.max;
        this.min = this.item.min;
        this.path = this.item.path;
        this.action = this.item.action;
      }
      // else if(typeof this.mapOptions !== 'undefined'){
      //     debugger;
      // }
      if (typeof item === "object") {
        _.extend(item, this);
      }
      this.label = gform.renderString(
        (item || {}).label || this.item.label,
        this
      );

      // var oldDiv = document.getElementById(this.id);
      // debugger;
      // var oldDiv = this.owner.el.querySelector('#'+this.id);
      var oldDiv = this.el;
      this.destroy();
      this.el = gform.types[this.type].create.call(this);
      oldDiv.parentNode.replaceChild(this.el, oldDiv);
      gform.types[this.type].initialize.call(this);

      if (!silent) {
        this.owner.trigger(["change:" + this.name, "change"], this);
      }
      if (typeof gform.types[this.type].setup == "function") {
        gform.types[this.type].setup.call(this);
      }
    },
    get: function () {
      return this.el.querySelector('input[name="' + this.name + '"]').value;
    },
    set: function (value) {
      this.el.querySelector('input[name="' + this.name + '"]').value = value;
    },
    satisfied: function (value) {
      return typeof value !== "undefined" && value !== null && value !== "";
    },
    edit: function (state) {
      this.el.querySelector('[name="' + this.name + '"]').disabled = !state;
    },
    find: function () {
      return this;
    },
    focus: function () {
      //   debugger;
      this.el.querySelector('[name="' + this.name + '"]').focus();
      //   this.el.querySelector('[name="'+this.name+'"]').focus();
      var temp = this.value;
      this.set("");
      this.set(temp);
      //   this.el.querySelector('[name="'+this.name+'"]').select();
    },
    //display
  },
  //   'textarea':,
  bool: {
    defaults: { options: [false, true], format: { label: "" } },
    render: function () {
      //   this.options = gform.mapOptions.call(this,this, this.value);
      if (typeof this.mapOptions == "undefined") {
        this.mapOptions = new gform.mapOptions(
          this,
          this.value,
          0,
          this.owner.collections
        );
        this.mapOptions.on(
          "change",
          function () {
            this.options = this.mapOptions.getobject();
            this.update();
          }.bind(this)
        );
      }
      this.options = this.mapOptions.getobject();

      this.selected = this.value == this.options[1].value;
      return gform.render(this.type, this);
    },
    set: function (value) {
      this.selected = value == this.options[1].value;
      this.el.querySelector('input[name="' + this.name + '"]').checked =
        this.selected;
    },
    get: function () {
      return this.options[
        this.el.querySelector('input[name="' + this.name + '"]').checked ? 1 : 0
      ].value;
    },
  },
  collection: {
    defaults: { format: { label: "{{label}}", value: "{{value}}" } },
    render: function () {
      //   this.options = gform.mapOptions.call(this,this, this.value);
      if (typeof this.mapOptions == "undefined") {
        this.mapOptions = new gform.mapOptions(
          this,
          this.value,
          0,
          this.owner.collections
        );
        this.mapOptions.on(
          "change",
          function () {
            this.options = this.mapOptions.getobject();
            this.update();
          }.bind(this)
        );
      }
      this.options = this.mapOptions.getobject();

      return gform.render(this.type, this);
    },
    setup: function () {
      if (this.multiple && typeof this.limit !== "undefinded") {
        if (this.value.length >= this.limit) {
          this.maxSelected = true;
          _.each(this.el.querySelector("select").options, function (item) {
            item.disabled = !item.selected;
          });
        } else if (this.maxSelected) {
          this.maxSelected = false;
          _.each(this.el.querySelector("select").options, function (item) {
            item.disabled = false;
          });
        }
      }
      //   if(this.other){
      //       this.el.querySelector('input').style.display = (this.value == 'other')?"inline-block":"none";
      //   }
      gform.types[this.type].setLabel.call(this);
    },
    initialize: function () {
      //   if(this.onchange !== undefined){ this.el.addEventListener('change', this.onchange);}
      this.el.addEventListener(
        "change",
        function () {
          this.input = true;
          this.value = this.get();
          if (this.el.querySelector(".count") != null) {
            var text = this.value.length;
            if (this.limit) {
              text += "/" + this.limit;
            }
            this.el.querySelector(".count").innerHTML = text;
          }

          gform.types[this.type].setup.call(this);
          this.owner.trigger(
            ["change:" + this.name, "change", "input:" + this.name, "input"],
            this,
            { input: this.value }
          );
        }.bind(this)
      );
      this.input = this.input || false;

      gform.types[this.type].setup.call(this);
    },
    get: function () {
      var value = this.el.querySelector("select").value;
      if (this.multiple) {
        value = _.transform(
          this.el.querySelector("select").options,
          function (orig, opt) {
            if (opt.selected) {
              orig.push(opt.value);
            }
          },
          []
        );
      }
      //   this.option = _.find()
      return value;
    },
    set: function (value) {
      this.el.querySelector("select").value = value;
      //   _.each(this.options.options, function(option, index){
      //       if(option.value == value || parseInt(option.value) == parseInt(value)) this.el.querySelector('[name="' + this.name + '"]').selectedIndex = index;
      //   }.bind(this))
      if (this.multiple && _.isArray(value)) {
        if (typeof this.limit !== "undefinded" && value.length > this.limit) {
          return true;
        }
        _.each(
          this.el.querySelector("select").options,
          function (option) {
            option.selected = value.indexOf(option.value) >= 0;
          }.bind(this)
        );
      }
      if (typeof gform.types[this.type].setup == "function") {
        gform.types[this.type].setup.call(this);
      }
    },
    focus: function () {
      this.el.querySelector('[name="' + this.name + '"]').focus();
    },
  },
  section: {
    setLabel: function () {
      this.label = gform.renderString(this.item.label || this.label, this);
      var labelEl = this.el.querySelector("legend");
      if (labelEl !== null) {
        labelEl.innerHTML = this.label;
      }
    },
    create: function () {
      var tempEl = document
        .createRange()
        .createContextualFragment(this.render()).firstElementChild;
      gform.addClass(tempEl, gform.columnClasses[this.columns]);
      return tempEl;
    },
    initialize: function () {
      //handle rows
      this.rows = {};
    },
    render: function () {
      // if(this.section){
      return gform.render(this.owner.options.sections + "_fieldset", this);
      // }else{
      // return gform.render('_fieldset', this);
      // }
    },
    update: function (item, silent) {
      if (typeof item === "object") {
        _.extend(this.item, item);
      }
      this.label = gform.renderString(
        ({} || item).label || this.item.label,
        this
      );

      // var oldDiv = document.getElementById(this.id);
      // var oldDiv = this.owner.el.querySelector('#'+this.id);
      var oldDiv = this.el;

      this.destroy();
      this.el = gform.types[this.type].create.call(this);
      oldDiv.parentNode.replaceChild(this.el, oldDiv);
      gform.types[this.type].initialize.call(this);
      this.container = this.el.querySelector("fieldset") || this.el || null;
      this.reflow();
      if (!silent) {
        //   this.owner.trigger('change:'+this.name, this);
        //   this.owner.trigger('change', this);
        this.owner.trigger(["change:" + this.name, "change"], this);
      }
    },
    get: function (name) {
      return gform.toJSON.call(this, name);
    },
    set: function (value) {
      if (value == null || value == "") {
        gform.each.call(this, function (field) {
          field.set("");
        });
      } else {
        _.each(
          value,
          function (item, index) {
            var temp = this.find(index);
            if (typeof temp !== "undefined") {
              temp.set(item);
            }
          }.bind(this)
        );
      }
    },
    find: function (name) {
      return gform.find.call(this, name);
    },
    reflow: function () {
      gform.reflow.call(this);
    },
    focus: function () {
      gform.types[this.fields[0].type].focus.call(this.fields[0]);
    },
  },
  button: {
    defaults: { parsable: false, columns: 2, target: ".gform-footer" },
    create: function () {
      var tempEl = document
        .createRange()
        .createContextualFragment(this.render()).firstElementChild;
      tempEl.setAttribute("id", this.id);
      // tempEl.setAttribute("class", tempEl.className+' '+gform.columnClasses[this.columns]);
      return tempEl;
    },
    initialize: function () {
      (this.action =
        this.action || (this.label || "").toLowerCase().split(" ").join("_")),
        (this.onclickEvent = function () {
          if (this.editable) {
            this.owner.trigger(this.action, this);
          }
        }.bind(this));
      this.el.addEventListener("click", this.onclickEvent);
    },
    render: function () {
      return gform.render("button", this);
    },
    satisfied: function (value) {
      return this.editable && this.visible;
    },
    update: function (item, silent) {
      if (typeof item === "object") {
        _.extend(this, this.item, item);
      }
      this.label = gform.renderString(this.item.label, this);

      //   var oldDiv = document.getElementById(this.id);
      //   var oldDiv = this.owner.el.querySelector('#'+this.id);
      var oldDiv = this.el;

      this.destroy();
      this.el = gform.types[this.type].create.call(this);
      oldDiv.parentNode.replaceChild(this.el, oldDiv);
      gform.types[this.type].initialize.call(this);
    },
    destroy: function () {
      this.el.removeEventListener("click", this.onclickEvent);
    },
    get: function (name) {
      return null;
    },
    set: function (value) {},
    edit: function (state) {
      this.el.disabled = !state;
    },
  },
};

// remove the added classes
gform.types["text"] =
  gform.types["password"] =
  gform.types["number"] =
  gform.types["color"] =
    gform.types["input"];
gform.types["hidden"] = _.extend({}, gform.types["input"], {
  defaults: { columns: false },
});
gform.types["output"] = _.extend({}, gform.types["input"], {
  render: function () {
    this.display = gform.renderString(this.format.value || "{{{value}}}", this);

    return gform.render(this.type, this);
  },
  get: function (value) {
    return this.el.querySelector("output").innerHTML;
  },
  set: function (value) {
    this.value = value;
    this.display = gform.renderString(this.format.value || "{{{value}}}", this);
    // gform.renderString(this.template, this);
    this.el.querySelector("output").innerHTML = this.display;
  },
});

gform.types["email"] = _.extend({}, gform.types["input"], {
  defaults: { validate: [{ type: "valid_email" }] },
});

gform.types["textarea"] = _.extend({}, gform.types["input"], {
  // initialize: function(){
  //       this.onchangeEvent = function(){
  //           this.value = this.get();
  //           if(this.el.querySelector('.count') != null){
  //               var text = this.value.length;
  //               if(this.limit){text+='/'+this.limit;}
  //             this.el.querySelector('.count').innerHTML = text;
  //           }
  //           this.owner.trigger(['change:'+this.name,'change','input:'+this.name,'input'], this,{input:this.value});
  //       }.bind(this)
  //       this.el.addEventListener('input', this.onchangeEvent.bind(null,true));
  //   },
  set: function (value) {
    this.el.querySelector('textarea[name="' + this.name + '"]').innerHTML =
      value;
  },
  get: function () {
    return this.el.querySelector('textarea[name="' + this.name + '"]').value;
  },
});
gform.types["switch"] = gform.types["checkbox"] = _.extend(
  {},
  gform.types["input"],
  gform.types["bool"],
  { default: { format: { label: "" } } }
);
gform.types["fieldset"] = _.extend(
  {},
  gform.types["input"],
  gform.types["section"]
);
gform.types["select"] = _.extend(
  {},
  gform.types["input"],
  gform.types["collection"],
  {
    render: function () {
      if (typeof this.mapOptions == "undefined") {
        // debugger;
        this.mapOptions = new gform.mapOptions(
          this,
          this.value,
          0,
          this.owner.collections
        );
        this.mapOptions.on(
          "change",
          function () {
            // debugger;
            this.options = this.mapOptions.getobject();
            this.update();
          }.bind(this)
        );
      }
      this.options = this.mapOptions.getobject();

      // this.options = gform.mapOptions.call(this,this, this.value);

      if (typeof this.placeholder == "string") {
        this.options.unshift({
          label: this.placeholder,
          value: "",
          editable: false,
          visible: false,
          selected: true,
        });
      }
      return gform.render(this.type, this);
    },
  }
);
gform.types["range"] = _.extend(
  {},
  gform.types["input"],
  gform.types["collection"],
  {
    get: function () {
      return (this.el.querySelector("[type=range]") || { value: "" }).value;
    },
    set: function (value) {
      this.el.querySelector("[type=range]").value = value;
    },
  }
);

gform.types["radio"] = _.extend(
  {},
  gform.types["input"],
  gform.types["collection"],
  {
    setup: function () {
      if (this.multiple && typeof this.limit !== "undefinded") {
        if (this.value.length >= this.limit) {
          this.maxSelected = true;
          _.each(this.el.querySelectorAll("[type=checkbox]"), function (item) {
            item.disabled = !item.checked;
          });
        } else if (this.maxSelected) {
          this.maxSelected = false;
          _.each(this.el.querySelectorAll("[type=checkbox]"), function (item) {
            item.disabled = false;
          });
        }
      }
      // if(this.other){
      //     this.el.querySelector('input').style.display = (this.value == 'other')?"inline-block":"none";
      // }

      gform.types[this.type].setLabel.call(this);
    },
    get: function () {
      if (this.multiple) {
        return _.transform(
          this.el.querySelectorAll('[type="checkbox"]:checked'),
          function (value, item) {
            value.push(item.value);
          },
          []
        );
      } else {
        return (
          this.el.querySelector('[type="radio"]:checked') || { value: "" }
        ).value;
      }
    },
    set: function (value) {
      if (this.multiple && _.isArray(value)) {
        if (typeof this.limit !== "undefinded" && value.length > this.limit) {
          return true;
        }
        _.each(
          this.el.querySelectorAll("[type=checkbox]"),
          function (option) {
            option.checked = value.indexOf(option.value) >= 0;
          }.bind(this)
        );
      } else {
        var el = this.el.querySelector('[value="' + value + '"]');
        if (el !== null) {
          el.checked = "checked";
        }
      }
      if (typeof gform.types[this.type].setup == "function") {
        gform.types[this.type].setup.call(this);
      }
    },
    edit: function (state) {
      _.each(this.el.querySelectorAll("input"), function (item) {
        item.disabled = !state;
      });
    },
  }
);

gform.types["scale"] = _.extend({}, gform.types["radio"]);
gform.types["checkboxes"] = _.extend({}, gform.types["radio"], {
  multiple: true,
});
gform.types["grid"] = _.extend(
  {},
  gform.types["input"],
  gform.types["collection"],
  {
    render: function () {
      // this.options = gform.mapOptions.call(this,this, this.value);
      if (typeof this.mapOptions == "undefined") {
        this.mapOptions = new gform.mapOptions(
          this,
          this.value,
          0,
          this.owner.collections
        );
        this.mapOptions.on(
          "change",
          function () {
            this.options = this.mapOptions.getobject();
            this.update();
          }.bind(this)
        );
      }
      this.options = this.mapOptions.getobject();

      this.fields = _.map(this.fields, function (field) {
        return _.assignIn(
          {
            name: (gform.renderString(field.label) || "")
              .toLowerCase()
              .split(" ")
              .join("_"),
            id: gform.getUID(),
            label: field.name,
          },
          field
        );
      });

      return gform.render(this.type, this);
    },
    setup: function () {
      if (this.multiple && typeof this.limit !== "undefinded") {
        _.each(
          this.fields,
          function (field) {
            var value = this.value[field.name] || [];
            if (value.length >= this.limit) {
              field.maxSelected = true;
              _.each(
                this.el.querySelectorAll(
                  '[type=checkbox][name="' + field.id + '"]'
                ),
                function (item) {
                  item.disabled = !item.checked;
                }
              );
            } else if (field.maxSelected) {
              field.maxSelected = false;
              _.each(
                this.el.querySelectorAll(
                  '[type=checkbox][name="' + field.id + '"]'
                ),
                function (item) {
                  item.disabled = false;
                }
              );
            }
          }.bind(this)
        );
      }

      gform.types[this.type].setLabel.call(this);
    },
    initialize: function () {
      //   if(this.onchange !== undefined){ this.el.addEventListener('change', this.onchange);}
      this.el.addEventListener(
        "change",
        function () {
          this.value = this.get();
          gform.types[this.type].setup.call(this);
          this.owner.trigger(
            ["change:" + this.name, "change", "input:" + this.name, "input"],
            this,
            { input: this.value }
          );
        }.bind(this)
      );
      gform.types[this.type].setup.call(this);
      this.rows = {};
      this.fields = _.map(this.fields, function (item) {
        item.type = "hidden";
        return item;
      });
    },
    get: function () {
      if (this.multiple) {
        return _.transform(
          this.fields,
          function (result, field) {
            result[field.name] = _.transform(
              this.el.querySelectorAll(
                '[type="checkbox"][name="' + field.id + '"]:checked'
              ),
              function (value, item) {
                value.push(item.value);
              },
              []
            );
          }.bind(this),
          {}
        );
      } else {
        return _.transform(
          this.fields,
          function (result, field) {
            result[field.name] = (
              this.el.querySelector(
                '[type="radio"][name="' + field.id + '"]:checked'
              ) || { value: "" }
            ).value;
          }.bind(this),
          {}
        );
      }
    },
    set: function (value) {
      if (this.multiple) {
        _.each(
          this.fields,
          function (value, field) {
            if (
              typeof this.limit !== "undefinded" &&
              value != null &&
              value.length > this.limit
            ) {
              return true;
            }
            _.each(
              this.el.querySelectorAll(
                '[name="' + field.id + '"][type=checkbox]'
              ),
              function (value, option) {
                option.checked = value.indexOf(option.value) >= 0;
              }.bind(this, value[field.name])
            );
          }.bind(this, value)
        );
      } else {
        _.each(
          this.fields,
          function (field) {
            var el = this.querySelector(
              '[name="' + field.id + '"][value="' + value[field.name] + '"]'
            );
            if (el !== null) {
              el.checked = "checked";
            }
          }.bind(this)
        );
      }
      this.value = value;
      gform.types["grid"].setup.call(this);
    },
    focus: function () {
      // this.fields[0].name
      this.el.querySelector('[name="' + this.fields[0].id + '"]').focus();
    },
  }
);

//tags
//upload
//base64
gform.processConditions = function (conditions, func) {
  if (typeof conditions === "string") {
    if (
      conditions === "display" ||
      conditions === "enable" ||
      conditions === "parse"
    ) {
      conditions = this.item[conditions];
    }
  }
  if (typeof conditions === "boolean") {
    func.call(this, conditions);
  }
  if (typeof conditions === "function") {
    func.call(this, conditions.call(this));
  }
  if (typeof conditions === "object") {
    var callback = function (rules, func) {
      func.call(this, gform._rules.call(this, rules));
    }.bind(this, conditions, func);

    // for(var i in conditions) {
    // 	this.owner.sub('change:' + conditions[i].name, callback)
    // }
    gform._subscribeByName.call(this, conditions, callback);
    // debugger;
    // func.call(this, gform._rules.call(this, conditions));
  }
  return true;
};

// gform._rules = function(rules){
// return _.every(_.map(rules, function(rule, i){
// 	return _.every(_.map(rule, function(args,name,rule) {
// 		return gform.conditions[name](this.owner, this, args)
// 	}.bind(this)));
// }.bind(this)))
// }
gform._subscribeByName = function (conditions, callback) {
  for (var i in conditions) {
    if (typeof conditions[i].name !== "undefined") {
      this.owner.on("change:" + conditions[i].name, callback);
    } else if (typeof conditions[i].conditions == "object") {
      gform._subscribeByName.call(this, conditions[i].conditions, callback);
    }
  }
};

gform._rules = function (rules, op) {
  var op = op || "and";
  return _.reduce(
    rules,
    function (result, rule) {
      var s;
      if (typeof rule.conditions !== "undefined") {
        s = gform._rules.call(this, rule.conditions, rule.op);
        console.log(s);
      } else {
        s = gform.conditions[rule.type](this, rule);
      }
      if (op == "or") {
        return result || s;
      } else {
        return result && s;
      }
    }.bind(this),
    op == "and"
  );
};

gform.conditions = {
  requires: function (field, args) {
    return field.parent.find(args.name).satisfied();
  },
  // valid_previous: function(gform, args) {},
  not_matches: function (field, args) {
    var val = args.value;
    var localval = (field.parent.find(args.name) || { value: "" }).value;
    if (typeof val == "object" && localval !== null) {
      return val.indexOf(localval) == -1;
    } else {
      return val !== localval;
    }
  },
  test: function (field, args) {
    return args.test.call(this, field, args);
  },
  contains: function (field, args) {
    var val = args.value;
    var localval = (field.parent.find(args.name) || { value: "" }).value;
    if (typeof val == "object" && localval !== null) {
      return _.intersection(val, localval).length > 0;
    } else {
      return typeof localval !== "undefined" && localval.indexOf(val) !== -1;
    }
  },
  matches: function (field, args) {
    var val = args.value;
    var localval = (field.parent.find(args.name) || { value: "" }).value;
    if (typeof val == "object" && localval !== null) {
      return val.indexOf(localval) !== -1;
    } else {
      return val == localval;
    }
  },
};
gform.prototype.errors = {};
gform.prototype.validate = function (force) {
  this.valid = true;
  _.each(this.fields, gform.validateItem.bind(null, force));
  if (!this.valid) {
    this.trigger("invalid", { errors: this.errors });
  } else {
    this.trigger("valid");
  }
  this.trigger("validation");
  return this.valid;
};
gform.handleError = gform.update;

gform.validateItem = function (force, item) {
  if (force || !item.valid || item.required || item.satisfied()) {
    var value = item.get();
    item.valid = true;
    item.errors = "";
    if (item.parsable && typeof item.validate === "object") {
      var errors = gform.validation.call(item, item.validate);
      if (item.required) {
        debugger;
        var type = item.satisfied(item.get()) ? false : "{{label}} is required";
        if (type) {
          errors.push(
            gform.renderString(item.required.message || type, {
              label: item.label,
              value: value,
              args: item.required,
            })
          );
        }
      }
      errors = _.compact(errors);
      if (typeof item.display === "undefined" || item.visible) {
        item.valid = !errors.length;
        item.errors = errors.join("<br>");
        gform.handleError(item);
      }

      //validate sub fields
      if (typeof item.fields !== "undefined") {
        _.each(item.fields, gform.validateItem.bind(null, force));
      }
    }

    if (item.errors) {
      item.owner.trigger("invalid:" + item.name, { errors: item.errors });
    } else {
      item.owner.trigger("valid:" + item.name);
    }
    item.owner.errors[item.name] = item.errors;
    item.owner.valid = item.valid && item.owner.valid;
  }
};

gform.validation = function (rules, op) {
  var op = op || "and";
  var value = this.get();
  var errors = _.map(
    rules,
    function (v, it) {
      if (typeof it.type == "string") {
        if (
          typeof it.conditions == "undefined" ||
          gform._rules.call(this, it.conditions)
        ) {
          var type = v[it.type].call(this, value, it);
          if (type) {
            return gform.renderString(it.message || type, {
              label: this.label,
              value: value,
              args: it,
            });
          }
        }
      } else if (typeof it.tests !== "undefined") {
        return gform.validation.call(this, it.tests, it.op).join("<br>");
      }
    }.bind(this, gform.validations)
  );
  if (op == "and" || _.compact(errors).length == rules.length) {
    return errors;
  } else {
    return [];
  }
};

gform.regex = {
  numeric: /^[0-9]+$/,
  decimal: /^\-?[0-9]*\.?[0-9]+$/,
  url: /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/,
  date: /^(0[1-9]|1[0-2])\/(0[1-9]|1\d|2\d|3[01])\/(19|20)\d{2}$/,
  email: /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,6}$/i,
};

gform.validations = {
  required: function (value) {
    return this.satisfied(value) ? false : "{{label}} is required";
  },
  pattern: function (value, args) {
    var r = args.regex;
    if (typeof r == "string") {
      r = gform.regex[r];
    }
    return r.pattern(value) || value === "" ? false : args.message;
  },
  custom: function (value, args) {
    return args.test.call(this, value, args);
  },
  matches: function (value, args) {
    var temp = this.parent.find(args.name);
    args.label = temp.label;
    args.value = temp.get();
    if (typeof temp == "undefined") {
      return "Matching field not defined";
    }
    return value == args.value
      ? false
      : '"{{label}}" does not match the "{{args.label}}" field';
  },
  date: function (value) {
    return gform.regex.date.test(value) || value === ""
      ? false
      : "{{label}} should be in the format MM/DD/YYYY";
  },
  valid_url: function (value) {
    return gform.regex.url.test(value) || value === ""
      ? false
      : "{{label}} must contain a valid Url";
  },
  valid_email: function (value) {
    return gform.regex.email.test(value) || value === ""
      ? false
      : "{{label}} must contain a valid email address";
  },
  length: function (value, args) {
    if (
      !gform.regex.numeric.test(args.max) &&
      !gform.regex.numeric.test(args.min)
    ) {
      return "Invalid length requirement";
    }

    if (
      typeof args.max == "number" &&
      typeof args.min == "number" &&
      args.min == args.max
    ) {
      if (args.min == value.length) {
        return false;
      } else {
        return (
          "{{label}} must be exactly " + args.min + " characters in length"
        );
      }
    }
    if (typeof args.max == "number" && value.length > args.max) {
      return "{{label}} must not exceed " + args.max + " characters in length";
    }
    if (
      typeof args.min == "number" &&
      value.length > 0 &&
      value.length < args.min
    ) {
      return "{{label}} must be at least " + args.min + " characters in length";
    }
    return false;
  },
  numeric: function (value, args) {
    if (!(gform.regex.decimal.test(value) || value === "")) {
      return "{{label}} must contain only numbers";
    }
    if (
      typeof args.min == "number" &&
      parseFloat(value) < parseFloat(args.min)
    ) {
      return "{{label}} must contain a number greater than {{args.min}}";
    }
    if (
      typeof args.max == "number" &&
      parseFloat(value) > parseFloat(args.max)
    ) {
      return "{{label}} must contain a number less than {{args.max}}";
    }
  },
};
export default gform;
