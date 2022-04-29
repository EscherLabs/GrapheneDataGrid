
function gridModel(owner, initial, events) {
	this.visible = false;
	this.owner = owner;
	this.id = gform.getUID();
	this.attributes = {};
	this.display = {};
	this.attribute_history = [];
	this.schema = owner.options.schema;
	this.iswaiting;

	this.row = document.createElement('tr');
	this.row.setAttribute('data-id', this.id);
	this.row.setAttribute("class", 'filterable grid-row' + (this.iswaiting ? " warning" : ""));

	this.waiting = function (state) {

		if (typeof state !== 'undefined') {
			this.iswaiting = state;
			this.row.setAttribute("class", 'filterable grid-row' + (this.iswaiting ? " warning" : ""));
			this.draw();
		}
		return this.iswaiting;
	}

	this.draw = function () {
		if (this.visible) {
			this.dispatch('draw')
			var temp = gform.renderString(this.owner.view, this);
			if (this.row.innerHTML != temp) {
				this.row.innerHTML = temp;
			}
			this.dispatch('drawn')

		}
		return this.row;
	}
	this.eventBus = new gform.eventBus({ owner: 'model', item: 'model', handlers: events || {} }, this)
	this.on = this.eventBus.on;
	this.dispatch = this.eventBus.dispatch;
	var processAtts = function () {
		_.each(this.schema, function (item) {

			var options;
			var temp = _.find(this.owner.checkForm.fields, { name: item.name })

			searchables = this.attributes[item.name];

			if (typeof this.attributes[item.name] !== "object") searchables = [searchables]
			this.display[item.name] = _.reduce(searchables, function (display, search) {
				if (display.length) display += "\r\n"
				if (typeof item.options !== 'undefined') {

					//look for matching string value
					options = _.find(temp.mapOptions.getoptions(), { value: search + "" });

					if (typeof options == 'undefined' && _.isFinite(search)) {
						options = _.find(temp.mapOptions.getoptions(), { value: parseInt(search) });
					}
					if (typeof options == 'undefined') {
						options = _.find(temp.mapOptions.getoptions(), { value: search });
					}
				}

				if (typeof options !== 'undefined') {
					display += options.label;
				}

				if (item.template) {
					display += gform.renderString(item.template, this)

				} else {
					if (typeof display == 'undefined' || display == "") display += (typeof search !== 'undefined') ? search : '';
				}
				return display;
			}, "")

		}.bind(this))
	}
	this.set = function (newAtts, silent) {
		if (typeof newAtts !== 'undefined' && newAtts !== null) {

			this.attribute_history.push(_.extend({}, this.attributes));
			this.attributes = newAtts;
		}
		processAtts.call(this);
		this.draw();

		if (!silent) {
			this.dispatch('set');
		}
	}
	this.update = function (newAtts, silent) {
		this.set(_.assign(this.attributes, newAtts), silent)
	}
	this.checked = false;
	this.deleted = false;
	this.toggle = function (state, silent) {
		if (typeof state === 'boolean') {
			this.checked = state;
		} else {
			this.checked = !this.checked;
		}
		this.draw();
		if (!silent) {
			this.dispatch('check');
		}
	}
	this.set(initial)
	processAtts.call(this);
	this.toJSON = function () {
		return this.attributes
	}
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
	}
	this.delete = function () {
		this.deleted = true;
		// this.owner.models.splice(_.indexOf(_.map(this.owner.models, 'id'), this.id),1);
	}
};