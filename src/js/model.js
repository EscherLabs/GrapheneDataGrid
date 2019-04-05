
function tableModel (owner, initial, events) {
	
	this.owner = owner;
	this.id = gform.getUID();
	this.attributes = {};
	this.display = {};
	this.attribute_history = [];
	this.schema = owner.options.schema;
	this.iswaiting;
	this.waiting = function(state){
		if(typeof state !== 'undefined'){this.iswaiting = state;this.owner.draw();}
		return this.iswaiting;
	}
	this.eventBus = new gform.eventBus({owner:'model',item:'model',handlers:events||{}}, this)
	this.on = this.eventBus.on;
	this.dispatch = this.eventBus.dispatch;
	var processAtts = function() {
		_.each(this.schema, function(item){
			if(typeof item.options !== 'undefined'){
				var option;
				if(typeof item.value_key !== 'undefined'){
					if(item.value_key == 'index'){
						option = item.options[this.attributes[item.name]]
					}else{
						var search = {};
						search[item.value_key] = this.attributes[item.name];
						option = _.find(item.options, search);
						if(_.isFinite(this.attributes[item.name])){
							search[item.value_key] = parseInt(this.attributes[item.name]);
							if(typeof option === 'undefined'){
								option = _.find(item.options, search);
							}
							if(typeof option === 'undefined'){
								option = _.find(item.options, search);
							}
						}
					}
				}else{
					option =  _.find(item.options, {value:this.attributes[item.name]});
					if(typeof option === 'undefined'){
						option = _.find(item.options, {id:this.attributes[item.name]});
					}
          if(_.isFinite(this.attributes[item.name])){
            if(typeof option === 'undefined'){
              option = _.find(item.options, {value:parseInt(this.attributes[item.name], 10)});
            }
            if(typeof option === 'undefined'){
              option = _.find(item.options, {id:parseInt(this.attributes[item.name], 10)});
            }
          }
				}
				if(typeof option === 'object') {
					this.display[item.name] = option[item.label_key] || option.label || option.name;
				}else{
					this.display[item.name] = this.attributes[item.name];
				}
			}else{
				if(item.template){
					// this.display[item.name] = Hogan.compile(item.template).render(this);	
					this.display[item.name] = gform.renderString(item.template)
					
				}else{
					this.display[item.name] = this.attributes[item.name];
				}
			}
		}.bind(this))
	}
	this.set = function(newAtts, silent){
		if(typeof newAtts !== 'undefined'){
			this.attribute_history.push(_.extend( {}, this.attributes));
			this.attributes = newAtts;
		}
		processAtts.call(this);
		if(!silent){
			// debugger;
			this.dispatch('set');
		}
	}
	this.checked = false;
	this.deleted = false;
	this.toggle = function(state, silent) {
		if(typeof state === 'bool') {
			this.checked = state;
		}else{
			this.checked = !this.checked;
		}
		if(!silent){
			this.dispatch('check');
		}
	}
	this.set(initial)
	processAtts.call(this);
	this.toJSON = function() {return this.attributes}
	this.undo = function() {
		if(this.deleted){this.deleted = false;this.owner.draw();}else{
			if(this.attribute_history.length){
				this.attributes = this.attribute_history.pop();
				processAtts.call(this);
				this.owner.draw();
			}
		}
	}
	this.delete = function(){
		this.deleted = true;
		// this.owner.models.splice(_.indexOf(_.map(this.owner.models, 'id'), this.id),1);
	}
};