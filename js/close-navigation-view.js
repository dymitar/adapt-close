define([
  'core/js/adapt',
], function (Adapt) {

	var CloseNavigationView = Backbone.View.extend({

    tagName: 'button',

    className: 'btn-icon nav__btn nav__close-btn js-nav-close-btn',

    events: {
      'click': 'onCloseButton'
    },

		initialize: function () {
      this.listenTo(Adapt.config, 'change:_activeLanguage', this.remove);

			this.listenTo(Adapt, {
				'navigation:closeButton': this.onCloseButton,
				'close:confirm': this.onCloseConfirm
			}).render();
		},

		render: function () {
			var data = this.model.toJSON();
      var template = Handlebars.templates['closeNavigation'];

      this.$el.html(template(data));

			data._globals = Adapt.course.get('_globals');
		},

		onCloseButton: function () {
			var prompt = !Adapt.course.get('_isComplete') ?
				this.model.get('_notifyPromptIfIncomplete') :
				this.model.get('_notifyPromptIfComplete');

			if (!prompt || !prompt._isEnabled) return Adapt.trigger('close:confirm');

			Adapt.notify.prompt({
				title: prompt.title,
				body: prompt.body,
				_prompts: [
					{
						promptText: prompt.confirm,
						_callbackEvent: 'close:confirm'
					},
					{
						promptText: prompt.cancel
					}
				]
			});
		},

		onCloseConfirm: function () {
			//ensure that the browser prompt doesn't get triggered as well
			var config = Adapt.course.get('_close');
			config.browserPromptIfIncomplete = config.browserPromptIfComplete = false;

			top.window.close();
		}

	});

  return CloseNavigationView;

});
