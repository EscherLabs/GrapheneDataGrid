function viewitem(options){
	this.update = function() {
		if(typeof this.gform !== 'undefined'){this.gform.destroy();}

		this.$el.find('[data-event]').off();
		this.$el.off();
		if(typeof this.model.owner.options.preDraw !== 'undefined'){
			this.model.owner.options.preDraw(this.model);
		}
		this.$el.replaceWith(this.setElement(options.view.render(this.model , templates)).$el);

		if(this.$el.find('[data-popins]').length > 0){
			this.gform = this.$el.gform({ popins: {container: '#first', viewport:{ selector: 'body', padding: 20 }}, renderer: 'popins', model: this.model});
		}

		if(typeof this.model.owner.options.click == 'function'){
			this.$el.on('click',function(e){
				if(typeof e.target.dataset.event ==  'undefined'){
					this.model.owner.options.click(this.model, this);
				}
			}.bind(this))
		}

		this.$el.find('[data-event].custom-event').on('click', $.proxy(function(e){
			e.stopPropagation();
			$(e.target).closest('.dropdown-menu').toggle()
			var event = _.find(this.model.owner.options.events, {name:e.target.dataset.event})
			if(typeof event !== 'undefined' && typeof event.callback == 'function'){
				event.callback(this.model);
			}
		},this));


		this.$el.find(".btn-group > .dropdown-toggle").on('click',function(e) {
		    e.stopPropagation();
		    $(this).next('.dropdown-menu').toggle();
		})

		this.$el.find('[data-event="edit"]').on('click', $.proxy(function(e){
			e.stopPropagation();
			$(e.target).closest('.dropdown-menu').toggle()
			this.edit();
		},this));

		this.edit = function(){
			$().gform($.extend(true,{},{name:'modal', legend: '<i class="fa fa-pencil-square-o"></i> Edit', model: this.model}, this.model.owner.options.gform || {} ) ).on('saved', function() {
				if(typeof this.model.owner.options.edit == 'function') {
					this.model.owner.options.edit(this.model);
				}
				this.update();
			}, this)
		}

		this.$el.find('[data-event="mark"]').on('click', $.proxy(function(e){
			e.stopPropagation();
			this.model.toggle(e.currentTarget.checked);
		},this));

		this.$el.find("[data-moment]").each(function(item){
			$(this).html(moment.utc($(this).data('moment')).format($(this).data('format')) );
		});
		this.$el.find(".sparkline").each(function(){
			$(this).peity($(this).data('type'), {radius: $(this).data('radius')});
		});
	}

	this.setElement = function(html){
		this.$el = $(html);
		return this;
	}

	this.model = options.model;
	this.model.on('check', this.update.bind(this))

	this.$el  = $('<tr>');
	if(options.container){
		options.container.append(this.$el);
	}
	this.model.on('change', this.update, this);
	this.model.on('destroy', $.proxy(function(){
		this.$el.fadeOut('fast', $.proxy(function() {
			this.remove();
		}, this));
	}, this) );
	this.update();
}

