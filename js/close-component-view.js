define(function(require) {

    var Adapt = require('coreJS/adapt');
    var Backbone = require('backbone');

    var CloseComponentView = Backbone.View.extend({

        className: "close-component",

        initialize: function () {
            this.render();
            this.listenTo(Adapt, "close:closeWindow", this.onCloseConfirm);
        },

        events: {
          "click .close-button":"closeModule"
        },

        render: function () {
            var data = this.model.toJSON();
            var template = Handlebars.templates["closeComponent"];
            // Check if 'extensions' div is already in the DOM
            if (!$('.' + this.model.get('_id')).find('.extensions').length) {
              // Create containing div if not already there
              var newDiv = document.createElement("div");
              newDiv.setAttribute('class', 'extensions');
              $(newDiv).appendTo('.' + this.model.get('_id') + " > .component-inner");
            }

            // Add data
            $(this.el).html(template(data)).appendTo('.' + this.model.get('_id') + " > .component-inner" + " > .extensions");

            _.defer(_.bind(function() {
                this.postRender();
            }, this));

        },

        postRender: function() {},

        closeModule: function(event) {
            if (event) event.preventDefault();
            // Check for prompt enabled
            if(this.model.get('_close')._notifyPrompt._isEnabled) {
              this.showPrompt();
            } else {
              this.onCloseConfirm();
            }
        },

        showPrompt: function() {
    			var prompt = this.model.get('_close')._notifyPrompt;

    			Adapt.trigger("notify:prompt", {
    				title: prompt.title,
    				body: prompt.body,
    				_prompts: [
    					{
    						promptText: prompt.confirm,
    						_callbackEvent: "close:closeWindow"
    					},
    					{
    						promptText: prompt.cancel
    					}
    				]
    			});
    		},

        onCloseConfirm: function() {
    			top.window.close();
    		}

    });

    return CloseComponentView;

});
