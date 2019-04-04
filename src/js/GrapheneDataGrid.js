function GrapheneDataGrid(options) {
	this.version = '0.0.2';
	this.eventBus = new gform.eventBus({owner:'table',item:'model'}, this)
	this.on = this.eventBus.on;
	this.dispatch = this.eventBus.dispatch;

	options = _.extend({filter: true, sort: true, search: true, download: true, upload: true, columns: true, id:gform.getUID()}, options);
	if(typeof options.events == 'object' && options.events.length){
		options.events = _.map(options.events,function(event){
			return _.extend({global:false},event)
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
	if(typeof options.item_template !== 'string' ){
		// options.item_template= Hogan.compile(options.item_template)
		// options.item_template = options.item_template;//gform.renderString(options.item_template)

	// }else{
		if(window.outerWidth > 767 || window.outerWidth == 0){
			options.item_template = gform.stencils['table_row'];
		}else{
			options.item_template = gform.stencils['mobile_row'];
		}
	}

	this.filterValues = {};
	this.draw = function() {
		_.each(this.summary.items, function(item){
			this.containerEl.find('.filter #'+item.id+',[data-sort='+item.id+']').toggle(item.isEnabled);
		}.bind(this))
		// if(this.containerEl.find('.filter').length){
			options.search = this.filterValues;
			_.each(options.search, function(item, index) {
				if(!item && (item !== 0)) {
					delete options.search[index];
				}
			});
		var pagebuffer = options.pagebuffer || 2;

		if(this.containerEl.find('[name="search"]').length && this.containerEl.find('[name="search"]').val().length){
			this.searchAll(this.containerEl.find('[name="search"]').val());
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

		var fragment = document.createDocumentFragment();
		var view = gform.renderString(options.item_template,summary)
		_.each(this.grab(options), function(model) {
			var row = document.createElement('tr');
			row.innerHTML =gform.renderString(view,model)
			row.setAttribute("class", 'filterable grid-row');
			row.setAttribute('data-id', model.id);
			fragment.appendChild(row);
		});
		
		this.containerEl[0].querySelector('.list-group').innerHTML = '';
		this.containerEl[0].querySelector('.list-group').appendChild(fragment)

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
		renderObj.checked_count = this.getSelected().length;

		renderObj.entries = _.map(options.entries,function(item){
			return {value:item, selected: (item==options.count)}
		},options)

		this.renderObj = renderObj;
		// this.containerEl.find('.paginate-footer').html(templates['table_footer'].render(this.renderObj, templates));
		this.updateCount();

		this.containerEl.find('.paginate-footer').html(gform.render('table_footer',this.renderObj));

		this.fixStyle();
		if (window.localStorage && options.name) {
			localStorage.setItem('bt_'+options.name, JSON.stringify(this.state.get())) ;
		}
	}


	var changePage = function(e) {
		e.stopPropagation();
		switch(e.currentTarget.dataset.page){
			case 'inc':
				options.page++;
				if(options.page > options.pagecount){options.page = options.pagecount}
				break;
			case 'dec':
				options.page--;
				if(options.page < 1){options.page = 1}
				break;
			default:
			options.page = e.currentTarget.dataset.page || options.pagecount;

		}
		this.draw();
	}

	var processSort = function(sortField, reverse) {
		if(typeof sortField == 'undefined' || sortField == true){
			this.containerEl.find('.reverse, [data-sort]').removeClass('text-primary').find('i').attr('class', 'fa fa-sort text-muted')
			this.containerEl.find('.sortBy').val('true');
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
			var current = this.containerEl.find('.reverse, [data-sort=' + _.find(this.options.filterFields,{search:sortField}).id + ']')
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
		this.draw();
	}.bind(this)

	var options = _.extend({count: options.count || 25, page: 1, sort: 'createdAt', reverse: false}, options);
	// self = this;
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
	options.filterFields = _.map(_.extend({}, options.filters || options.schema), function(val){
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
				val.placeholder = false;
				val.options = [{type:'optgroup',options:[{label:'No Filter',value:null}],format:{label:"{{label}}"}},{type:'optgroup',options:val.options}]
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

	var summary = {'[[':'{{', ']]':'}}',checked_count:0,multi_checked:false,multiEdit:!!options.multiEdit ,'items': _.map(options.filterFields, function(val){
		var name = (val.search|| val.label.split(' ').join('_').toLowerCase());

		if(val.template){
			name = val.template.replace(/{{value}}/gi, '{{attributes.'+ name + '}}');

		}else{
			name = '{{attributes.'+ name + '}}'
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

	this.summary = summary;
	var template;
	if(options.template ){
		// template= Hogan.compile(Hogan.compile(options.template).render(summary, templates));  
		template= template = gform.renderString(options.template,summary)

	}else{
		if(window.outerWidth > 767 || window.outerWidth == 0){
			// template = Hogan.compile(templates['table'].render(summary, templates));
			template = gform.render('table',summary)
		}else{
			// template = Hogan.compile(templates['mobile_table'].render(summary, templates));
			template = gform.render('mobile_table',summary)

		}
	}

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
					var ref = $(gform.stencils['modal'].render({title: "Importing CSV ",footer:'<div class="btn btn-danger" data-dismiss="modal">Cancel</div>', body:'<div class="progress"><div class="progress-bar progress-bar-striped active" role="progressbar" aria-valuenow="50" aria-valuemin="0" aria-valuemax="100" style="width: 0%"><span class="sr-only">50% Complete</span></div></div><div class="status">Validating Items...</div>'}));
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
				      table.add(items[i],{draw:false});
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
		table.draw();
  }

	function onload(containerEl){
		this.containerEl = containerEl;

		if(containerEl.find('.filter').length) {
			this.filter = new gform({name:'filter'+this.options.id,clear:false, fields: options.filterFields,default:{hideLabel:true,type:'text',format:{label: '{{label}}', value: '{{value}}'}} },'.filter').on('change', function(){
				this.containerEl.find('[name="search"]').val('');
				this.filterValues = this.filter.toJSON();
				this.draw();
			}.bind(this));

			this.filter.set()
		}

		this.updateCount =function(count) {
			var count = count || this.getSelected().length;
			this.summary.checked_count = count;
			this.summary.multi_checked = count>1;

			this.containerEl.find('[name="events"]').html(gform.render('events',this.summary));
			this.containerEl.find('[name="count"]').html(gform.render('count',this.summary));

			var checkbox = this.containerEl.find('[data-event="select_all"].fa');

			if(count>0 && count == this.getModels().length){
				checkbox.attr('class', 'fa fa-2x fa-check-square-o');
			}else if(count == 0){
				checkbox.attr('class', 'fa fa-2x fa-square-o');
			}else{
				checkbox.attr('class', 'fa fa-2x fa-minus-square-o');
			}
		}

		if(options.data) {
			for(var i in options.data) {
				this.models.push(new tableModel(this, options.data[i]).on('check', function(e){
						e.model.owner.updateCount();
					})
				);
			}
		}
		if(typeof this.options.defaultSort !== 'undefined'){
			this.models = _.sortBy(this.models, function(obj) { return obj.attributes[this.options.defaultSort]; }.bind(this)).reverse();
		}

		this.containerEl.on('change', '.csvFileInput', _.partial(handleFiles, this));
		this.containerEl.on('click','[name="bt-upload"]', function(){
			this.containerEl.find('.csvFileInput').click();
		}.bind(this));
		this.containerEl.on('click','[name="bt-download"]', this.getCSV.bind(this));
		this.containerEl.on('click', '.grid-row', function(e) {
			this.dispatch('click',_.find(this.models,{id:e.currentTarget.dataset.id}))
		}.bind(this));
		this.containerEl.on('click','[data-page]', changePage.bind(this));



		this.containerEl.on('click', '.columnEnables label', function(e){
			e.stopPropagation();
			_.find(this.summary.items, {id:e.currentTarget.dataset.field}).isEnabled = e.currentTarget.childNodes[0].checked;
			this.draw();
		}.bind(this));
		this.containerEl.on('click', '[data-event="mark"]', function(e) {
			e.stopPropagation();
			_.find(this.models,{id:e.currentTarget.dataset.id}).toggle(e.currentTarget.checked);
		}.bind(this));
	



		this.containerEl.on('click','[data-event].custom-event', function(e){
			e.stopPropagation();
			var selectedModels = this.getSelected();
			if(selectedModels.length){
				_.each(selectedModels,function(event,model){
					this.dispatch(event,model)
				}.bind(this,e.target.dataset.event))
			}else{
				this.dispatch(e.target.dataset.event)
			}
		}.bind(this));
		this.containerEl.on('change', '[name="count"]', function(e) {
			options.count = parseInt(e.currentTarget.value,10);
			this.draw();
		}.bind(this))
		this.containerEl.on('input', '[name="search"]', _.debounce(function(e) {
			this.draw();
		}.bind(this), 300));
		
		this.containerEl.on('click', '[data-event="select_all"]', function(e){
			var checked_models = this.getSelected();

			if (checked_models.length || this.getModels().length == 0) {						
				_.each(checked_models, function(item){item.toggle(false,true)})			
			} else {
				_.each(this.filtered, function(item){item.toggle(true,true)})			
			}		
			this.draw();
		}.bind(this));
		this.containerEl.on('click','[name="reset-search"]', function(){
			this.containerEl.find('[name="search"]').val('');

			if(this.filter) {
				this.filter.set()
			}
			this.filterValues = {};

			processSort();
		}.bind(this));
		

		this.containerEl.on('click','[data-event="add"]', function(){
			var event = _.find(this.options.events, {name:'add'});

			if(typeof event !== 'undefined' && typeof event.callback == 'function'){
				event.callback.call(this);
			}else{
				new gform(_.extend({},{name:'modal',table:this, actions:[{type:'cancel'},{type:'save'}], legend: '<i class="fa fa-pencil-square-o"></i> Create New', fields: options.schema}, options.gform || {} )).on('save', function(e) {
					if(e.form.validate()){
						this.add(e.form.get(),{validate:false})
						e.form.pub('close');
					}
				}.bind(this)).on('cancel',function(e){e.form.pub('close')}).modal()
			}
		}.bind(this));
		this.containerEl.on('click', '[data-event="delete"]', function(e){
			var checked_models = this.getSelected()
			if (checked_models.length) {
				if(confirm("Are you sure you want to delete "+checked_models.length+" records? \nThis operation can not be undone.\n\n" )){
					_.each(checked_models, function(item){
						if(typeof this.options.delete == 'function'){
							this.options.delete(item);
						}
							item.delete();
					}.bind(this))
					this.draw();
				}
			}
		}.bind(this));
		this.containerEl.on('click','[data-event="edit"]', function(e){
			e.stopPropagation();
			if(	typeof this.options.multiEdit !== 'undefined' && 
				this.options.multiEdit.length !== 0 &&
				this.getSelected().length >1) {
				this.editCommon();
			}else{
				new gform(_.extend({},{name:'modal',actions:[{type:'cancel'},{type:'save'}], legend: '<i class="fa fa-pencil-square-o"></i> Edit', data: this.getSelected()[0].attributes,fields:this.getSelected()[0].schema}, this.options.gform || {} ) ).on('save', function(e) {
					this.getSelected()[0].set(e.form.toJSON());
					if(typeof this.options.edit == 'function'){
						this.options.edit(this.getSelected()[0]);
					}
					if(typeof this.options.editComplete === 'function'){
						this.options.editComplete(this.getSelected(), this);
					}
					this.draw();
					e.form.pub('close')

				}.bind(this)).on('cancel',function(e){e.form.pub('close')}).modal()
			}
		}.bind(this));

		
		this.containerEl.on('click', '.reverse', function(e) {
				processSort(this.options.sort)
		}.bind(this));
		this.containerEl.on('click','[data-sort]', function(e) {
			e.stopPropagation();
			e.preventDefault();
			var sortField = _.find(this.options.filterFields, {name: e.currentTarget.dataset.sort}).search;
			if(this.options.reverse && this.options.sort == sortField){
				processSort();
			}else{
				processSort( sortField);
			}
		}.bind(this))


		//Mobile
		// this.containerEl.on('change', '.sortBy', function(e) {
		// 	if($(e.currentTarget).val() !== ''){
		// 		processSort((_.find(this.options.filterFields, {id:$(e.currentTarget).val()}) || {search:true}).search)
		// 	}
		// }.bind(this));
		// this.containerEl.on('click', '.filterForm', function(e) {
		// 	this.containerEl.find('[name="search"]').val('');

		// 	new gform({legend:"Filter By" ,name:'modal_filter'+this.options.id,attributes:this.filterValues, disableMath: true, suppress: true, fields: options.filterFields }).on('save', function(){
		// 		this.filterValues = gform.instances['modal_filter'+this.options.id].toJSON();
		// 		this.draw();					
		// 		gform.instances['modal_filter'+this.options.id].trigger('close');

		// 	}.bind(this)).modal();
		// }.bind(this));	

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


	this.add = function(item,config){
		var newModel = new tableModel(this, item)

		if(config.validate == false || 	this.validate(item)) {
			this.models.push(newModel);
			if(typeof this.options.defaultSort !== 'undefined'){
				this.models = _.sortBy(this.models, function(obj) { return obj.attributes[this.options.defaultSort]; }.bind(this)).reverse();
			}
			if(config.draw !== false){
				this.draw();
			}
			// this.updateCount(this.summary.checked_count);
			if(config.silent !== true){
				this.dispatch('added',newModel)
			}
			// if(typeof this.options.add == 'function'){
			// 	this.options.add(newModel);
			// }
		}else{
			return false
		}
		return newModel.on('check', function(){
			this.owner.updateCount();
		});
		
	}
	this.search = function(options) {
		var ordered = _.sortBy(this.getModels(), function(obj) { return obj.attributes[options.sort]; });
		if(!options.reverse){
			ordered = ordered.reverse();
		}
		filterMap = this.filterMap;
		ordered = _.filter(ordered, function(anyModel) {

			var keep = _.isEmpty(options.search);
			for(var filter in options.search) {
					var temp;
					if(_.filter(options.filterFields, {id:filter})[0] && typeof _.filter(options.filterFields, {id:filter})[0].options == 'undefined') {
						temp = (_.score((anyModel.display[this.filterMap[filter]]+'').replace(/\s+/g, " ").toLowerCase(), (options.search[filter]+'').toLowerCase() ) > 0.40);
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
		return _.filter(this.getModels(), function(anyModel) {
			return _.isEqual(search, _.pick(anyModel.attributes, keys));
		})
	}

	this.searchAll = function(search) {
		//reset sorts and filters
		options.sort = null;
		this.containerEl.find('[data-sort]').removeClass('text-primary');
		this.containerEl.find('[data-sort]').find('i').attr('class', 'fa fa-sort text-muted');
		if(this.filter){

			this.filter.set()
			// silentPopulate.call(this.filter, this.defaults)
		}

		search = search.toLowerCase()
		//score each model searching each field and finding a total 
		_.map(this.getModels(), function(model){
			model.score = 0;
			for(var filter in options.filterFields) {
				model.score += _.score((model.display[options.filterFields[filter].search]+'').replace(/\s+/g, " ").toLowerCase(), search);
			}
			
		})

		//sort by score (highet first) and remove models with no score
		this.filtered = _.filter(_.sortBy(this.getModels(), 'score'), function(model) {
				return (model.score > 0);
		}).reverse();

		this.lastGrabbed = this.filtered.length;
	}



	this.fixStyle = function(){
		if(this.options.autoSize){
			try{
				var container = this.containerEl.find('.table-container > div');
				var headers = this.containerEl.find('.table-container > table tr th:visible');
				var columns = this.containerEl.find('.list-group-row th');
				this.containerEl.find('.table-container table').removeClass('table-fixed')
				
				container.css('width', 'auto') 
				container.css('minWidth', 'auto') 
				headers.css('width', 'auto')
				headers.css('minWidth', '85px')
				this.containerEl.find('.table-container > table tr th.select-column').css('minWidth', '60px')
				this.containerEl.find('.table-container > table tr th.select-column').css('width', '60px')
				columns.css('width', 'auto')
				columns.css('minWidth', 'auto')

				container.css('height', $(window).height() - container.offset().top - (88+ this.options.autoSize) +'px');
				_.each(	columns, function(column, index){
					if(typeof headers[index] !== 'undefined'){

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
						column.style.display = 'none';
					}
				}.bind(this))

				this.containerEl.find('.table-container table').addClass('table-fixed')
				
				var target = this.containerEl.find('.table-container > div table')[0].offsetWidth;
				if(this.containerEl.find('.table-container > table')[0].offsetWidth > target){target = this.containerEl.find('.table-container > table')[0].offsetWidth;}

				container.css('width', target + 'px') 
				container.css('minWidth', target + 'px') 
				if(target > this.containerEl.find('.table-container')[0].offsetWidth){
					this.containerEl.find('.table-container').css('overflow','auto');
				}else{
					this.containerEl.find('.table-container').css('overflow','hidden');					
				}

			}catch(e){}
		}
	}


	this.grab = function(options) {
		return this.filtered.slice((options.count * (options.page-1) ), (options.count * (options.page-1) ) + options.count)
	};
	this.getModels = function(search){
		var search = search || {deleted: false};
		return _.filter(this.models, search)
	}
	this.getSelected = function(){return this.getModels({checked: true, deleted: false})}//_.filter(this.models, {checked: true, deleted: false})}


	this.editCommon = function (){
		if(typeof this.options.multiEdit == 'undefined' || this.options.multiEdit.length == 0){return;}
		var selectedModels = this.getSelected();
		if(selectedModels.length == 0){ return; }
		//get the attributes from each model
		var temp = _.map(selectedModels,function(item){return item.attributes;})//_.pick(item.attributes;})
		//get the fields that are common between them
		var common_fields = _.filter(this.options.multiEdit, function(item){return _.uniq(_.map(temp, item)).length == 1});
		//get the schema fields matching from above
		if(common_fields.length == 0) {
					$(gform.stencils['modal'].render({title: "Common Field Editor ",footer:'<div class="btn btn-danger" data-dismiss="modal">Done</div>', body:'<div class="alert alert-warning">No eligible fields have been found for editing.</div>'})).modal();
		} else {
			var newSchema = _.filter(this.options.schema, function(item){return common_fields.indexOf(item.name) >= 0})
			new gform({legend:'('+selectedModels.length+') Common Field Editor',actions:[{type:'cancel'},{type:'save'}], fields:newSchema, data: _.extend({},_.pick(selectedModels[0].attributes, common_fields))}).on('save', function(e){
				var newValues = e.form.get();
				_.map(selectedModels,function(model){
					model.set(_.extend({}, model.attributes, newValues));
				})

				e.form.pub('close');
			}).on('close', function(){
				this.draw();
				if(typeof this.options.editComplete === 'function'){
					this.options.editComplete(this.getSelected(), this);
				}
				this.dispatch('')
			}.bind(this)).on('cancel',function(e){e.form.pub('close')}).modal()
		}
	}
	this.destroy = function(){
		this.containerEl.find('.list-group').empty();
		this.containerEl.off();
		this.containerEl.empty();
	}

	this.state = {
		get:function(){
			var temp = {count:this.options.count,page:this.options.page};
			if(this.containerEl.find('[name="search"]').length && this.containerEl.find('[name="search"]').val().length){
				temp.search = this.containerEl.find('[name="search"]').val();
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
				this.containerEl.find('.columnEnables [type="checkbox"]').each(function(e) {
					this.checked = false
				})
				if(options.columns) {
					_.each(settings.columns, function(item){
						var temp = this.containerEl.find('.columnEnables [data-field="'+_.find(this.options.filterFields, {search: item}).id+'"] [type="checkbox"]');
						if(temp.length)temp[0].checked = true;
					}.bind(this))
				}
			}
			if(typeof settings.filters !== 'undefined') {
				this.filterValues = {};
				_.each(settings.filters, function(item, index) {
					this.filterValues[_.find(this.options.filterFields, {search: index}).id] = item
				}.bind(this))
			}

			if(typeof settings.sort !== 'undefined') {
					processSort(settings.sort || options.sort, settings.reverse);
			}
			
			if(typeof this.filter !== 'undefined') {
				this.filter.set(this.filterValues)
			}
			if(typeof settings.search !== 'undefined' && settings.search !== '') {
				this.containerEl.find('[name="search"]').val(settings.search)
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
	
	// var fields = {
	// 	Title: {},
	// 	Feed: {type: 'select', label_key: 'title', value_key: '_id', required: true, default: {title: 'Current Collection', _id: 'collection'}},
	// }
	
	this.getCSV = function(title){
		if(typeof title !== "string") {
			title =this.options.title
		}
		_.csvify(
			_.map(this.filtered, function(item){return item.attributes}),
			_.map(_.filter(this.summary.items, function(item){return item.isEnabled}) ,function(item){
				return {label:item.label,name:this.filterMap[item.cname]} 
			}),
			title 
		)
	}
	var container = document.querySelector(options.container);
	
	if(container !== null) {
		container.innerHTML = gform.renderString(template, summary);
	
		onload.call(this, $(container));
	}

	this.containerEl.find('[name="search"]').focus();

	this.containerEl.find('.table-container > div').css('overflow', 'auto');
	$(window).on('resize orientationChange', this.fixStyle.bind(this));
	if(loaded){
		this.state.set(loaded);
	}
}