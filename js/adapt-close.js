define([
  'coreJS/adapt',
  './close-component-view',
], function(Adapt, CloseComponentView) {

	var CloseView = Backbone.View.extend({

		initialize: function() {
			this.listenTo(Adapt, {
				"navigation:closeButton": this.onCloseButton,
				"close:confirm": this.onCloseConfirm
			}).render();
		},

		render: function() {
			var data = this.model.toJSON();
			var template = Handlebars.templates.close;

			data._globals = Adapt.course.get("_globals");
			this.setElement(template(data)).$el.prependTo($(".navigation-inner"));
		},

		onCloseButton: function() {
			var prompt = !Adapt.course.get("_isComplete") ?
				this.model.get("_notifyPromptIfIncomplete") :
				this.model.get("_notifyPromptIfComplete");

			if (!prompt || !prompt._isEnabled) return Adapt.trigger("close:confirm");

			Adapt.trigger("notify:prompt", {
				title: prompt.title,
				body: prompt.body,
				_prompts: [
					{
						promptText: prompt.confirm,
						_callbackEvent: "close:confirm"
					},
					{
						promptText: prompt.cancel
					}
				]
			});
		},

		onCloseConfirm: function() {
			//ensure that the browser prompt doesn't get triggered as well
			var config = Adapt.course.get("_close");
			config.browserPromptIfIncomplete = config.browserPromptIfComplete = false;

			top.window.close();
		}

	});

	function onBeforeUnload(config) {
		return !Adapt.course.get("_isComplete") ?
			config.browserPromptIfIncomplete || undefined :
			config.browserPromptIfComplete || undefined;
	}

	Adapt.once("adapt:initialize", function() {
		var config = Adapt.course.get("_close");

		if (!config) return;

		var button = config._button;

		if (button && button._isEnabled && config._isEnabled) {
			new CloseView({ model: new Backbone.Model(button) });
		}

		if (config.browserPromptIfIncomplete || config.browserPromptIfComplete) {
			$(window).on("beforeunload", _.partial(onBeforeUnload, config));
		}
	});

  Adapt.on('componentView:postRender', function(view) {
      if (Adapt.course.get("_close") && Adapt.course.get("_close")._isEnabled && view.model.get("_close") && view.model.get("_close")._isEnabled) {
        // Check criteria first
        if (!checkTrackingCriteriaMet(view)) return;
        // Only render view if it DOESN'T already exist - Work around for assessmentResults component
        if (!$('.' + view.model.get('_id')).find('.close-component').length) {
          new CloseComponentView({model:view.model});
        }
      }
  });

  function checkTrackingCriteriaMet(view) {
    // Set to true for backwards compatability for nothing set in the data
    var criteriaMet = true;
    if (view.model.get('_close')._tracking._requireCourseCompleted && view.model.get('_close')._tracking._requireAssessmentPassed) { // user must complete the content AND pass the assessment
      criteriaMet = (Adapt.course.get('_isComplete') && Adapt.course.get('_isAssessmentPassed'));
    } else if (view.model.get('_close')._tracking._requireCourseCompleted) { //user only needs to complete the content
      criteriaMet = Adapt.course.get('_isComplete');
    } else if (view.model.get('_close')._tracking._requireAssessmentPassed) { // user only needs to pass the assessment
      criteriaMet = Adapt.course.get('_isAssessmentPassed');
    }
    return criteriaMet;
  }

});
