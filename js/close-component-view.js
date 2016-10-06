define(function(require) {

    var Adapt = require('coreJS/adapt');
    var Backbone = require('backbone');

    var CloseComponentView = Backbone.View.extend({

        className: "close-component",

        initialize: function () {
            this.render();
        },

        events: {
          "click .close-button":"closeModule"
        },

        render: function () {
            var data = this.model.toJSON();
            var template = Handlebars.templates["closeComponent"];
            $(this.el).html(template(data)).appendTo('.' + this.model.get('_id') + " > .component-inner");

            _.defer(_.bind(function() {
                this.postRender();
            }, this));
        },

        postRender: function() {},

        closeModule: function(event) {
            if (event) event.preventDefault();
            Adapt.trigger("close:confirm");
        }

    });

    return CloseComponentView;

});
