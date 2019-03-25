function GrapheneDataGrid(options) {
	this.version = '0.0.1';
	options = $.extend(true, {filter: true, sort: true, search: true, download: true, upload: true, columns: true, id:gform.getUID()}, options);
	if(typeof options.events == 'object' && options.events.length){
		options.events = _.map(options.events,function(event){
			return $.extend(true, {global:false},event)
		})
	}else{
		options.events = false;
	}

	var loaded = false;
	if (window.localStorage && options.name) {
		try{
		loaded = JSON.parse(localStorage.getItem('bt_'+options.name));
		}catch(e){};
	}
	if(options.item_template ){options.item_template= Hogan.compile(options.item_template)}else{
		if(window.outerWidth > 767 || window.outerWidth == 0){
			options.item_template = templates['table_row'];
		}else{
			options.item_template = templates['mobile_row'];
		}
	}

	this.filterValues = {};
	this.draw = function() {
		_.each(this.summary.items, function(item){
			this.$el.find('.filter #'+item.id+',[data-sort='+item.id+']').toggle(item.isEnabled);
		}.bind(this))
		// if(this.$el.find('.filter').length){
			options.search = this.filterValues;
			_.each(options.search, function(item, index) {
				if(!item && (item !== 0)) {
					delete options.search[index];
				}
			});
		var pagebuffer = options.pagebuffer || 2;

		if(this.$el.find('[name="search"]').length && this.$el.find('[name="search"]').val().length){
			this.searchAll(this.$el.find('[name="search"]').val());
		}else{
			this.search(options);
		}

		var renderObj = {};
		options.pagecount = Math.ceil(this.lastGrabbed / options.count);
		renderObj.pages = [];

		if(options.page > options.pagecount){
				options.page = options.pagecount || 1;
		}
		var showing = (this.lastGrabbed>(options.count * options.page))? (options.count * options.page) : this.lastGrabbed;

		var newContainer = $('<tbody class="list-group">');
		var view = Hogan.compile(options.item_template.render(summary, templates));

		_.each(this.grab(options), function(model) {
			new viewitem({ 'model': model, container: newContainer, view: view});
		});
		var container = this.$el.find('.list-group').empty().replaceWith(newContainer);
		var startpage = options.page - pagebuffer;
		if(startpage < 1){startpage = 1;}
		var endpage = options.page + pagebuffer;
		if(endpage >options.pagecount){endpage = options.pagecount}

		for(var i = startpage; i <= endpage; i++){
			var page = {name: i};
			if(options.page == i){
				page.active = 'active';
			}
			renderObj.pages.push(page);
		}
		renderObj.size = this.lastGrabbed;
		renderObj.last = showing;
		renderObj.first = ( (options.count * (options.page-1) ) + 1);

		renderObj.multiPage = (endpage > startpage);
		renderObj.isFirst = (options.page == 1);
		renderObj.isLast = (options.page == options.pagecount);
		renderObj.showLast = (options.pagecount == endpage);
		renderObj.showFirst = (startpage == 1);
		renderObj.checked_count = _.filter(this.models, {checked: true}).length;

		renderObj.entries = _.map(options.entries,function(item){
			return {value:item, selected: (item==options.count)}
		},options)

		this.renderObj = renderObj;
		this.$el.find('.paginate-footer').html(templates['table_footer'].render(this.renderObj, templates));
		this.summary.checked_count = _.filter(this.models, {checked: true}).length;
		this.summary.multi_checked = (this.summary.checked_count>1);
		this.$el.find('[name="events"]').html(templates['events'].render(this.summary, templates));
		this.fixStyle();
		if (window.localStorage && options.name) {
			localStorage.setItem('bt_'+options.name, JSON.stringify(this.state.get())) ;
		}
	}

	this.drawHead = function(){

	}

	var changePage = function(e) {
		e.stopPropagation();
		e.preventDefault();
		if($(e.currentTarget).data('page') == 'inc') {
			options.page++;
			if(options.page > options.pagecount){options.page = options.pagecount}

		}else if($(e.currentTarget).data('page') == 'dec') {
			options.page--;
			if(options.page < 1){options.page = 1}
		}else{
			options.page = $(e.currentTarget).data('page') || options.pagecount;
		}
		this.draw();
	}

	var processSort = function(sortField, reverse) {
		if(sortField == true){
			this.$el.find('.reverse, [data-sort]').removeClass('text-primary').find('i').attr('class', 'fa fa-sort text-muted')
			this.$el.find('.sortBy').val('true');
			options.reverse = false;
		}else{
			if(typeof reverse == 'undefined') {
				if(options.sort == sortField) {
						options.reverse = !options.reverse;
				}else{
					options.reverse = false;
				}
			}else{
				options.reverse = reverse;
			}
			var current = this.$el.find('.reverse, [data-sort=' + _.find(this.options.filterFields,{search:sortField}).id + ']')
			if(typeof current !== 'undefined'){
				if(options.reverse) {
					current.find('i').attr('class', 'fa fa-sort-asc');
				}else{
					current.find('i').attr('class', 'fa fa-sort-desc');
				}
				current.siblings('[data-sort]').removeClass('text-primary');
				current.siblings('[data-sort]').find('i').attr('class', 'fa fa-sort text-muted');
				current.addClass('text-primary');
			}
		}
		options.sort = sortField;

	}

	var options = $.extend({count: options.count || 25, page: 1, sort: 'createdAt', reverse: false}, options);
	self = this;
	// options.schema = 
	// 	_.map(options.schema, function(item){
	// 	return gform.processOpts(item,{update:function(options){
	// 		this.item.choices = options.choices; 
	// 		this.item.options = options.choices; 
	// 		var schema = this.self.options.schema;
	// 		_.each(this.self.models,function(model){
	// 			model.schema = schema;
	// 			model.pat();
	// 		})
	// 		this.self.draw();

	// 	}.bind({item:item,self:self}) });
	// } )
	


	if(typeof options.filters !== 'undefined'){
		options.filters = _.map(options.filters, function(fieldIn){
			var parent = parent || null;
			fieldIn.type = fieldIn.type || 'text';
			//work gform.default in here
			var field = _.assignIn({
					name: (gform.renderString(fieldIn.label)||'').toLowerCase().split(' ').join('_'), 
					id: gform.getUID(), 
					// type: 'text', 
					label: fieldIn.legend || fieldIn.name,
					validate: [],
					valid: true,
					parsable:true,
					visible:true,
					enabled:true,
					array:false,
					offset: 0,
			}, this.opts, gform.default,(gform.types[fieldIn.type]||gform.types['text']).defaults, fieldIn)
			if(field.name == ''){field.name = field.id;}
			field.item = fieldIn;
			return field;
	})
	}
	options.filterFields = _.map($.extend(true, {}, options.filters || options.schema), function(val){
		val = gform.normalizeField.call({options:{default:{type:'text'}}},val);
		name = val.name;
		val.value = '';
		switch(val.type){
			case 'checkbox':
				val.options = [{label: 'False', value: 'false'}, {label: val.options[0] || 'True', value: val.options[1] || 'true'}];
				// if(typeof val.falsestate !== 'undefined'){
				// 	val.options[0].label = val.falsestate;
				// 	val.options[0].value = val.falsestate;
				// }
			case 'radio':
				val.type = 'select';
			case 'select':
				// var temp = val.options;
				val.options = [{label:'No Filter',value:null},{type:'optgroup',options:val.options}]
				// val.placeholder = false;
				// val.options = val.options||{}
				// val.placeholder = {}
				// newOptions[0][] = 'No Filter';
				// val.placeholder[val.value_key || 'value'] = '';

				// if(val.value_key == 'index'){
				// 	delete val.value_key;
				// }
				break;
		case 'hidden':
				break;
			default:
				val.type = 'text';
		}

		if(val.options && typeof val.options == 'object'){// && !_.isArray(val.options)){
			val.options = _.map(val.options, function(item){
				if(typeof item == 'object'){
					return _.omit(item, 'selected');
				}else{return item;}
			})
		}else{
		}
		val.id = val.id || gform.getUID();
		val.search = val.name;
		val.name = val.id;
		val.show = {};
		// val.isEnabled = true;
		val.enabled = true;
		val.help = '';
		return val;
	});
	if(typeof options.columns == 'object'){
			options.filterFields = _.filter(options.filterFields, function(item){
					return (_.includes(options.columns, item.name) || _.includes(options.columns,item.id))
			})
	}

	var summary = {'start':'{{', 'end':'}}',checked_count:0,multi_checked:false,multiEdit:!!options.multiEdit ,'items': _.map(options.filterFields, function(val){
		var name = (val.search|| val.label.split(' ').join('_').toLowerCase());

		if(val.template){
			name = val.template.replace(/{{value}}/gi, '{{attributes.'+ name + '}}');

		}else{
			switch(val.type){
				case 'date':
					name = '<span data-moment="{{attributes.'+name+'}}" data-format="L"></span>'
					break;
				case 'select':
						if(options.inlineEdit){
							name = '<span data-popins="'+name+'"></span>';
						}else{
							name = '{{display.'+ name + '}}'
						}
					break;
				case 'color':
					name = '<div class="btn btn-default" style="background-color:{{attributes.'+name+'}}">{{attributes.'+name+'}}</div> {{attributes.'+name+'}}'
					break;
				default:
					// name = '{{attributes.'+ name + '}}'
					if(options.inlineEdit){
						name = '<span data-popins="'+name+'"></span>';
					}else{
						name = '{{attributes.'+ name + '}}'
					}
			}
		}
		return {'isEnabled': (typeof val.showColumn =='undefined' || val.showColumn), 'label': val.label, 'name': name, 'cname': (val.name|| val.label.split(' ').join('_').toLowerCase()), 'id': val.id, 'visible':!(val.type == 'hidden')} 
	})};
	options.hasActions = !!(options.edit || options.delete || options.events);
	if(typeof options.hasEdit == 'undefined'){
		options.hasEdit = !!(options.edit);			
	}
	if(typeof options.hasDelete == 'undefined'){
		options.hasDelete = !!(options.delete);
	}
	options.entries = options.entries || [25, 50 ,100];
	summary.options = options;
	summary.showAdd = !!(options.add) || options.showAdd;

	this.defaults = {};
	_.map(options.filterFields, function(val){
		switch(val.type){
			case 'text':
				val.value = '';
				break;
			case 'checkbox':
				val.value = 'false';
			case 'radio':
				val.value = '';
			case 'select':
				val.value = '';
				break;
			default:
		}
		this.defaults[val.name] = val.value;
	}.bind(this));
	this.summary = summary;
	var template;
	if(options.template ){
		template= Hogan.compile(Hogan.compile(options.template).render(summary, templates));  
	}else{
		if(window.outerWidth > 767 || window.outerWidth == 0){
			template = Hogan.compile(templates['table'].render(summary, templates));
		}else{
			template = Hogan.compile(templates['mobile_table'].render(summary, templates));
		}
	}

	function render(){
		return template.render();
	}
	// var silentPopulate = function(attributes,fields) {this.each(function(attributes) {if(!this.isContainer) {this.setValue(gform.search(attributes, this.getPath()));}}, [attributes], this.fields);}

	function handleFiles(table, e) {
		var files = this.files
    // Check for the various File API support.
    if (window.FileReader) {
        // FileReader are supported.
      (function (fileToRead) {
	      var reader = new FileReader();
	      // Read file into memory as UTF-8      
	      reader.readAsText(fileToRead);
	      reader.onload = function (event) {
		      var csv = event.target.result;
		      var temp = CSVToArray(csv);
		      var valid = true;

					$('#myModal').remove();
					var ref = $(templates['modal'].render({title: "Importing CSV ",footer:'<div class="btn btn-danger" data-dismiss="modal">Cancel</div>', body:'<div class="progress"><div class="progress-bar progress-bar-striped active" role="progressbar" aria-valuenow="50" aria-valuemin="0" aria-valuemax="100" style="width: 0%"><span class="sr-only">50% Complete</span></div></div><div class="status">Validating Items...</div>'}));
					ref.modal();
					ref.on('hidden.bs.modal', function () {
		      	this.importing = false;
					}.bind(this));

					var itemCount = temp.length-1;
					var totalProgress = itemCount*2;
					var items = [];
					this.importing = true;
					temp[0] = _.map(temp[0], function(item){
						var search = _.find(options.schema, {label:item});
						if(search == null){
							search = item;
						}else{
							search = search.name;
						}
						return search;
					})
		      for(var i = 1; i<temp.length; i++){
		      	if(!this.importing) return false;
		      	if(temp[0].length == temp[i].length){
				      var newtemp = {}
				      for(var j in temp[0]){
				      	newtemp[temp[0][j]] = temp[i][j]
				      }
				      valid = table.validate(newtemp);
				      if(!valid){
								 break;
								}
				      items.push(valid);
			    	}else{
			    		itemCount--;
			    	}
						ref.find('.progress-bar').width((i/totalProgress)*100 +'%')
			    }

			    if(valid){
			    	ref.find('.status').html('Adding Items...');
			      for(var i = 0; i<items.length; i++){
			      	if(!this.importing) return false;
				      table.add(items[i]);
							ref.find('.progress-bar').width(((i+itemCount)/totalProgress)*100 +'%')
				    }
			    }else{
			    	ref.find('.btn').html('Done');
			    	ref.find('.status').html('<div class="alert alert-danger">Error(s) in row '+i+ ', failed to validate!<ul><li>'+_.filter(table.errors,function(item){return item.length;}).join('</li><li>')+'</li></div>')
			    	return;
			    }
		    	ref.find('.status').html('<div class="alert alert-success">Successfully processed file, '+itemCount+ ' rows were added!</div>')
		    	ref.find('.btn').toggleClass('btn-danger btn-success').html('Done');
		    	ref.find('.progress').hide();
					if(typeof table.options.defaultSort !== 'undefined'){
						table.models = _.sortBy(table.models, function(obj) { return obj.attributes[this.options.defaultSort]; }.bind(table)).reverse();
					}

		    	if(typeof table.options.onBulkLoad == 'function'){
						table.options.onBulkLoad();
					}		    	

		    }
	      reader.onerror = function (evt) {
		      if(evt.target.error.name == "NotReadableError") {
		          alert("Canno't read file !");
		      }
		    }
	    })(files[0]);
	    e.currentTarget.value = '';

    } else {
        alert('FileReader is not supported in this browser.');
    }
  }

	function onload($el){
		this.$el = $el;

		if(this.options.columns){
			this.$el.on('click', '.columnEnables label', function(e){
				e.stopPropagation();
				_.find(this.summary.items, {id:e.currentTarget.dataset.field}).isEnabled = e.currentTarget.childNodes[0].checked;
				this.draw();
			}.bind(this));
		}

		this.$el.on('change', '.csvFileInput', _.partial(handleFiles, this));
		this.$el.on('change', '.sortBy', function(e) {
			if($(e.currentTarget).val() !== ''){
				processSort.call(this,(_.find(this.options.filterFields, {id:$(e.currentTarget).val()}) || {search:true}).search)
				this.draw();
			}
		}.bind(this));		

		this.$el.on('click', '.reverse', function(e) {
				processSort.call(this, this.options.sort)
				this.draw();
		}.bind(this));

		this.$el.on('click', '.filterForm', function(e) {
				this.$el.find('[name="search"]').val('');

				 new gform({legend:"Filter By" ,name:'modal_filter'+this.options.id,attributes:this.filterValues, disableMath: true, suppress: true, fields: options.filterFields }).on('save', function(){
					this.filterValues = gform.instances['modal_filter'+this.options.id].toJSON();
					this.draw();					
					gform.instances['modal_filter'+this.options.id].trigger('close');

				}.bind(this)).modal();
		}.bind(this));		

		this.$el.on('click','[name="bt-upload"]', function(){
			this.$el.find('.csvFileInput').click();
		}.bind(this));

		this.$el.on('click', '[data-event="delete"]', function(e){
				$(e.target).closest('.dropdown-menu').toggle()
				var model = _.find(this.models, {id:e.currentTarget.dataset.id});
				if(confirm("Are you sure you want to delete? \nThis operation can not be undone.\n\n"+ _.values(model.attributes).join('\n') )){
		
					if(typeof this.options.delete == 'function'){
						this.options.delete(model);
					}
					model.delete();
					this.draw();
					this.updateCount(_.filter(this.models, {checked: true}).length)
				}
		}.bind(this));

		this.$el.on('click', '[data-event="delete_all"]', function(e){
			  var checked_models = _.filter(this.models, {checked: true})
				if (checked_models.length) {
					if(confirm("Are you sure you want to delete "+checked_models.length+" records? \nThis operation can not be undone.\n\n" )){
						_.each(checked_models, function(item){
							if(typeof this.options.delete == 'function'){
								this.options.delete(item);
							}
								item.delete();
						}.bind(this))
						this.draw();
						this.updateCount(_.filter(this.models, {checked: true}).length)
					}	
				}

		}.bind(this));

		this.$el.on('click','[data-event].custom-event-all', function(e){
			e.stopPropagation();
			var event = _.find(this.options.events, {name:e.target.dataset.event})

			if(typeof event !== 'undefined' && typeof event.callback == 'function'){
				if(event.multiEdit	&& _.filter(this.models, {checked: true}).length >1) {
					_.each(_.filter(this.models, {checked: true}), function(model){
						event.callback(model);
					})
				}else{
					event.callback(_.filter(this.models, {checked: true})[0]);
				}
				if(typeof event.complete == 'function'){
					event.complete(_.filter(this.models, {checked: true}),this);
				}

			}

		}.bind(this));
		this.$el.on('click','[data-event].custom-event-collection', function(e){
			e.stopPropagation();
			var event = _.find(this.options.events, {name:e.target.dataset.event})

			if(typeof event !== 'undefined' && typeof event.callback == 'function'){
					event.callback.call(this,this.models);
			}

		}.bind(this));
		this.$el.on('click','[data-event="edit_all"]', function(e){
			e.stopPropagation();
			if(	typeof this.options.multiEdit !== 'undefined' && 
				this.options.multiEdit.length !== 0 &&
				_.filter(this.models, {checked: true}).length >1) {
				this.editCommon();
			}else{
				// debugger;
				// this.options.fields = this.options.schema;
				new gform($.extend(true,{},{name:'modal',actions:[{type:'cancel'},{type:'save'}], legend: '<i class="fa fa-pencil-square-o"></i> Edit', data: _.filter(this.models, {checked: true})[0].attributes,fields:_.filter(this.models, {checked: true})[0].schema}, this.options.gform || {} ) ).on('save', function(e) {
					_.filter(this.models, {checked: true})[0].set(e.form.toJSON());
					if(typeof this.options.edit == 'function'){
						this.options.edit(_.filter(this.models, {checked: true})[0]);
					}
					if(typeof this.options.editComplete === 'function'){
						this.options.editComplete(_.filter(this.models, {checked: true}), this);
					}
					this.draw();
					e.form.pub('close')

				}.bind(this)).on('cancel',function(e){e.form.pub('close')}).modal()
			}
		}.bind(this));

		this.$el.on('change', '[name="count"]', function(e) {
			options.count = parseInt($(e.currentTarget).val(),10);
			this.draw();
		}.bind(this))

		this.$el.on('input', '[name="search"]', _.debounce(function(e) {
			this.draw();
		}.bind(this), 300));


		if($el.find('.filter').length) {
			this.filter = new gform({name:'filter'+this.options.id,clear:false, fields: options.filterFields,default:{hideLabel:true,type:'text',format:{label: '{{label}}', value: '{{value}}'}} },'.filter').on('change', function(){
				this.$el.find('[name="search"]').val('');
				this.filterValues = this.filter.toJSON();
				this.draw();
			}.bind(this));

			this.filter.set()
			// silentPopulate.call(this.filter, this.defaults);

			//attributes: this.defaults
		}

		this.updateCount =function(count) {
			this.summary.checked_count = count;
			this.summary.multi_checked = (count>1);

			var checkbox = this.$el.find('[data-event="select_all"].fa');

			if(count>0 && count == this.models.length){
				checkbox.attr('class', 'fa fa-2x fa-check-square-o');
			}else if(count == 0){
				checkbox.attr('class', 'fa fa-2x fa-square-o');
			}else{
				checkbox.attr('class', 'fa fa-2x fa-minus-square-o');
			}

		}

		this.$el.on('click', '[data-event="select_all"]', function(e){
			  var checked_models = _.filter(this.models, {checked: true});

				if (checked_models.length || this.models.length == 0) {						
					_.each(checked_models, function(item){item.toggle(false)})			
				} else {
					_.each(this.filtered, function(item){item.toggle(true)})			
				}		
			  checked_models = _.filter(this.models, {checked: true})
				this.updateCount(checked_models.length);

		}.bind(this));


		if(options.data) {
			for(var i in options.data) {
				this.models.push(new tableModel(this, options.data[i]).on('check', function(e){
						e.form.owner.updateCount(_.filter(e.form.owner.models, {checked: true}).length);
						e.form.owner.$el.find('[name="events"]').html(templates['events'].render(e.form.owner.summary, templates));
					})
				);
			}
		}
		if(typeof this.options.defaultSort !== 'undefined'){
			this.models = _.sortBy(this.models, function(obj) { return obj.attributes[this.options.defaultSort]; }.bind(this)).reverse();
		}


		this.$el.on('click','[data-page]', changePage.bind(this));
		if(options.sort){
			this.$el.on('click','[data-sort]', function(e) {
				e.stopPropagation();
				e.preventDefault();
				var sortField = _.find(this.options.filterFields, {name: $(e.currentTarget).data('sort')}).search;
				if(this.options.reverse && this.options.sort == sortField){
					processSort.call(this, true);
				}else{
					processSort.call(this, sortField);
				}
				//this.drawHead();
				this.draw();
			}.bind(this))
		}
		this.$el.on('click','[name="reset-search"]', function(){
			this.$el.find('[name="search"]').val('');
			// options.sort = null;
			processSort.call(this, true);

			if(this.filter) {
				this.filter.set()
				// silentPopulate.call(this.filter, this.defaults)
			}
			this.filterValues = {};
			this.draw();
		}.bind(this));
		this.$el.on('click','[name="bt-download"]', function(){
			this.getCSV();
		}.bind(this));
		this.$el.find('[data-event="add"]').on('click', function(){
			var event = _.find(this.options.events, {name:'add'});

			if(typeof event !== 'undefined' && typeof event.callback == 'function'){
				event.callback.call(this);
			}else{
				new gform($.extend(true,{},{name:'modal', actions:[{type:'cancel'},{type:'save'}], legend: '<i class="fa fa-pencil-square-o"></i> Create New', fields: options.schema}, options.gform || {} )).on('save', function(e) {
					if(e.form.validate()){
						var newModel = new tableModel(this, e.form.get()).on('check', function() {
							this.updateCount(_.filter(this.models, {checked: true}).length);
							this.$el.find('[name="events"]').html(templates['events'].render(this.summary, templates));
						}.bind(this));
						this.models.push(newModel);
						if(typeof this.options.defaultSort !== 'undefined'){
							this.models = _.sortBy(this.models, function(obj) { return obj.attributes[this.options.defaultSort]; }.bind(this)).reverse();
						}

						this.draw();
						this.updateCount(this.summary.checked_count);
						
						if(typeof this.options.add == 'function') {
							this.options.add(newModel);
						}
						// if(typeof e.form !== 'undefined'){
							e.form.pub('close');
						// }
					}
				}.bind(this)).on('cancel',function(e){e.form.pub('close')}).modal()
			}
		}.bind(this));


		this.draw();
	}
	this.validate = function(item){
		var status = false;
		var tempForm = new gform({fields: options.schema,attributes:item});
		if(tempForm.validate()){
			status = tempForm.toJSON();
		}else{
			this.errors = tempForm.errors;
			console.log('Model not valid');
		}
		tempForm.destroy();
		return status
	}


	this.add = function(item){
		var newModel = new tableModel(this, item).on('check', function(){
			this.owner.updateCount(_.filter(this.owner.models, {checked: true}).length);
			this.owner.$el.find('[name="events"]').html(templates['events'].render(this.owner.summary, templates));
		});
		var tempForm = new gform({fields: options.schema,model:newModel});
		if(tempForm.validate()) {
			this.models.push(newModel);
			this.draw();
			this.updateCount(this.summary.checked_count);

			if(typeof this.options.add == 'function'){
				this.options.add(newModel);
			}
		}else{
			console.log('Model not valid');
		}
		tempForm.destroy();
		return newModel;
	}
	this.search = function(options) {
		var ordered = _.sortBy(this.models, function(obj) { return obj.attributes[options.sort]; });
		if(!options.reverse){
			ordered = ordered.reverse();
		}
		filterMap = this.filterMap;
		ordered = _.filter(ordered, function(anyModel) {

			var keep = $.isEmptyObject(options.search);
			for(var filter in options.search) {
					var temp;
					if(_.filter(options.filterFields, {id:filter})[0] && typeof _.filter(options.filterFields, {id:filter})[0].options == 'undefined') {
						temp = ($.score((anyModel.display[this.filterMap[filter]]+'').replace(/\s+/g, " ").toLowerCase(), (options.search[filter]+'').toLowerCase() ) > 0.40);
					}else{
						temp = (anyModel.display[this.filterMap[filter]]+'' == options.search[filter]+'') || (anyModel.attributes[this.filterMap[filter]]+'' == options.search[filter]+'')
					}
					keep = temp;
					if(!keep){break;}
			}
			
			return keep;
		})
		this.lastGrabbed = ordered.length;
		this.filtered = ordered;
	}

	this.find = function(search) {
		var keys = _.keys(search)
		return _.filter(this.models, function(anyModel) {
			return _.isEqual(search, _.pick(anyModel.attributes, keys));
		})
	}

	this.searchAll = function(search) {
		//reset sorts and filters
		options.sort = null;
		this.$el.find('[data-sort]').removeClass('text-primary');
		this.$el.find('[data-sort]').find('i').attr('class', 'fa fa-sort text-muted');
		if(this.filter){

			this.filter.set()
			// silentPopulate.call(this.filter, this.defaults)
		}

		search = search.toLowerCase()
		//score each model searching each field and finding a total 
		_.map(this.models, function(model){
			model.score = 0;
			for(var filter in options.filterFields) {
				model.score += $.score((model.display[options.filterFields[filter].search]+'').replace(/\s+/g, " ").toLowerCase(), search);
			}
		})

		//sort by score (highet first) and remove models with no score
		this.filtered = _.filter(_.sortBy(this.models, 'score'), function(model) {
				return (model.score > 0);
		}).reverse();

		this.lastGrabbed = this.filtered.length;
	}

	// this.fixStyle = function(){
	// 	if(this.options.autoSize){
	// 		try{
	// 			var container = this.$el.find('.table-container > div');
	// 			var headers = this.$el.find('.table-container > table tr th:visible');
	// 			container.css('width', 'auto') 
	// 			container.css('minWidth', 'auto') 
	// 			headers.css('width','auto')
	// 			headers.css('minWidth','85px')
	// 			this.$el.find('.list-group tr:first td').css('width','auto')
	// 			this.$el.find('.list-group tr:first td').css('minWidth','auto')
	// 			container.css('height', $(window).height() - container.offset().top - (88+ this.options.autoSize) +'px');
	// 			_.each(	this.$el.find('.list-group tr:first td'), function(item, index){
	// 				if(headers[index].offsetWidth > item.offsetWidth){
	// 					item.width = headers[index].offsetWidth+'px';
	// 					item.minWidth = headers[index].offsetWidth+'px';
	// 				}
	// 				headers[index].style.width = item.offsetWidth+'px';
	// 				headers[index].style.minWidth = item.offsetWidth+'px';
	// 			}.bind(this))

	// 			var target = this.$el.find('.table-container > div table')[0].offsetWidth;
	// 			if(this.$el.find('.table-container > table')[0].offsetWidth > target){target = this.$el.find('.table-container > table')[0].offsetWidth;}

	// 			container.css('width', target + 'px') 
	// 			container.css('minWidth', target + 'px') 

	// 		}catch(e){}
	// 	}
	// }


	this.fixStyle = function(){
		// debugger;
		if(this.options.autoSize){
			try{
				var container = this.$el.find('.table-container > div');
				var headers = this.$el.find('.table-container > table tr th:visible');
				var columns = this.$el.find('.list-group-row th');
				this.$el.find('.table-container table').removeClass('table-fixed')
				
				container.css('width', 'auto') 
				container.css('minWidth', 'auto') 
				headers.css('width','auto')
				headers.css('minWidth','85px')
				this.$el.find('.table-container > table tr th.select-column').css('minWidth','60px')
				this.$el.find('.table-container > table tr th.select-column').css('width','60px')
				columns.css('width','auto')
				columns.css('minWidth','auto')
				// this.$el.find('.list-group tr:first td').css('width','auto')
				// this.$el.find('.list-group tr:first td').css('minWidth','auto')
				// $('table td').css({wordWrap:"break-word"});
				container.css('height', $(window).height() - container.offset().top - (88+ this.options.autoSize) +'px');
				_.each(	columns, function(column, index){
					// debugger;
					if(typeof headers[index] !== 'undefined'){

						// $(column).css('width', 'auto') 
						// $(column).css('minWidth', 'auto') 
						column.style.display = 'table-cell';
						if(headers[index].offsetWidth > column.offsetWidth){
							$(column).css('width',headers[index].offsetWidth+'px');
							$(column).css('minWidth',headers[index].offsetWidth+'px');
							$(headers[index]).css('width',headers[index].offsetWidth+'px')
							$(headers[index]).css('minWidth',headers[index].offsetWidth+'px')
						}else{
							$(headers[index]).css('width',headers[index].offsetWidth+'px')
							$(headers[index]).css('minWidth',headers[index].offsetWidth+'px')

							$(column).css('width',headers[index].offsetWidth+'px');
							$(column).css('minWidth',headers[index].offsetWidth+'px');
							
						}
					}else{
// debugger;
						// $(column).css('width', 'auto') 
						// $(column).css('minWidth', 'auto') 
						column.style.display = 'none';
					}
				}.bind(this))

				this.$el.find('.table-container table').addClass('table-fixed')
				
				var target = this.$el.find('.table-container > div table')[0].offsetWidth;
				if(this.$el.find('.table-container > table')[0].offsetWidth > target){target = this.$el.find('.table-container > table')[0].offsetWidth;}

				container.css('width', target + 'px') 
				container.css('minWidth', target + 'px') 
				if(target > this.$el.find('.table-container')[0].offsetWidth){
					this.$el.find('.table-container').css('overflow','auto');
				}else{
					this.$el.find('.table-container').css('overflow','hidden');					
				}

			}catch(e){}
		}
	}


	this.grab = function(options) {
		return this.filtered.slice((options.count * (options.page-1) ), (options.count * (options.page-1) ) + options.count)
	};

	this.editCommon = function (){
		if(typeof this.options.multiEdit == 'undefined' || this.options.multiEdit.length == 0){return;}
		var selectedModels = _.filter(this.models, {checked: true});
		if(selectedModels.length == 0){ return; }
		//get the attributes from each model
		var temp = _.map(selectedModels,function(item){return item.attributes;})//_.pick(item.attributes;})
		//get the fields that are common between them
		var common_fields = _.filter(this.options.multiEdit, function(item){return _.uniq(_.map(temp, item)).length == 1});
		//get the schema fields matching from above
		if(common_fields.length == 0) {
					$(templates['modal'].render({title: "Common Field Editor ",footer:'<div class="btn btn-danger" data-dismiss="modal">Done</div>', body:'<div class="alert alert-warning">No eligible fields have been found for editing.</div>'})).modal();
		} else {
			var newSchema = _.filter(this.options.schema, function(item){return common_fields.indexOf(item.name) >= 0})
			new gform({legend:'('+selectedModels.length+') Common Field Editor',actions:[{type:'cancel'},{type:'save'}], fields:newSchema, data: $.extend(true,{},_.pick(selectedModels[0].attributes, common_fields))}).on('save', function(e){
debugger;
				var newValues = e.form.get();
				_.map(selectedModels,function(model){
					model.set($.extend(true,{}, model.attributes, newValues));
				})

				e.form.pub('close');
			}).on('close', function(){
				this.draw();
				if(typeof this.options.editComplete === 'function'){
					this.options.editComplete(_.filter(this.models, {checked: true}), this);
				}
			}.bind(this)).on('cancel',function(e){e.form.pub('close')}).modal()
		}
	}
	this.destroy = function(){
		this.$el.find('.list-group').empty();
		this.$el.off();
		this.$el.empty();
	}

		this.state = {
		get:function(){
			var temp = {count:this.options.count,page:this.options.page};
			if(this.$el.find('[name="search"]').length && this.$el.find('[name="search"]').val().length){
				temp.search = this.$el.find('[name="search"]').val();
			}else{
				temp.sort = options.sort;
				temp.reverse = options.reverse;
				if(typeof this.filter !== 'undefined'){
					temp.filters = {};
					_.each(this.options.filterFields, function(item){
						temp.filters[item.search] = this[item.id]
					}.bind(this.filter.toJSON()))
				}
			}
			temp.columns = _.map(_.map(_.filter(this.summary.items, function(item){return item.isEnabled}),'id'),function(id){
				return _.find(this.options.filterFields, {id:id}).search;
			}.bind(this))
			return temp;
		}.bind(this),
		set: function(settings) {

			if(typeof settings.columns !== 'undefined' && settings.columns.length) {
				this.summary.items = _.map(this.summary.items, function(item) {
					item.isEnabled = _.includes(settings.columns, this.filterMap[item.cname])
					return item;
				})
				this.$el.find('.columnEnables [type="checkbox"]').each(function(e) {
					this.checked = false
				})
				if(options.columns) {
					_.each(settings.columns, function(item){
						var temp = this.$el.find('.columnEnables [data-field="'+_.find(this.options.filterFields, {search: item}).id+'"] [type="checkbox"]');
						if(temp.length)temp[0].checked = true;
					}.bind(this))
				}
			}
			if(typeof settings.filters !== 'undefined') {
				this.filterValues = {};
				_.each(settings.filters, function(item, index) {
//					this.filterValues[_.find(this.options.filterFields, {search: index}).id] = item
				}.bind(this))
			}

			if(typeof settings.sort !== 'undefined') {
					processSort.call(this,settings.sort || options.sort, settings.reverse);
			}
			
			if(typeof this.filter !== 'undefined') {
				// this.filter.populate(this.filterValues);
				// silentPopulate.call(this.filter, this.filterValues)

				this.filter.set(this.filterValues)
			}
			if(typeof settings.search !== 'undefined' && settings.search !== '') {
				this.$el.find('[name="search"]').val(settings.search)
			}

			this.options.page = settings.page || this.options.page;
			this.options.count = settings.count || this.options.count;
			this.draw();
		}.bind(this)
	}
	this.models = [];
	this.options = options;
	this.filterMap = {}
	_.map(options.filterFields, function(item){
			this.filterMap[item.id] = item.search ;
	}.bind(this));
	
	var fields = {
		Title: {},
		Feed: {type: 'select', label_key: 'title', value_key: '_id', required: true, default: {title: 'Current Collection', _id: 'collection'}},
	}
	$(options.container).html(render.call(this));
	onload.call(this, $(options.container));
	this.getCSV = function(title){
		var lookup = this.filterMap
		csvify(
			_.map(this.filtered, function(item){return item.attributes}),
			_.map(_.filter(this.summary.items, function(item){return item.isEnabled}) ,function(item){
				return {label:item.label,name:lookup[item.cname]} 
			}),
			title || this.options.title 
		)
	}

	this.$el.find('[name="search"]').focus();

	this.$el.find('.table-container > div').css('overflow', 'auto');
	$(window).on('resize orientationChange', this.fixStyle.bind(this));
	if(loaded){
		this.state.set(loaded);
	}
}