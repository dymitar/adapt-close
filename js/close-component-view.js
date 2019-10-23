define([
  'core/js/adapt'
], function(Adapt) {

    var CloseComponentView = Backbone.View.extend({

        className: "close-component",

        initialize: function () {
            this.listenTo(Adapt, "close:closeWindow", this.onCloseConfirm);
            // Listen for course completion
            this.listenTo(Adapt.course, 'change:_isComplete', this.checkCompletion);
            this.listenTo(Adapt, 'assessment:complete', this.onAssessmentComplete);

            this.render();
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

            this.$('.close-inner').hide();

            this.completionCriteriaMet = false;
            this.assessmentCriteriaMet = false;

            _.defer(_.bind(function() {
                this.postRender();
            }, this));
        },

        postRender: function() {
            this.checkCompletion();

            if (!Adapt.assessment) return;
            this.onAssessmentComplete(Adapt.assessment.getState());
        },

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
    		},

        onAssessmentComplete: function(state) {
            if (state.isPass) {
                this.assessmentCriteriaMet = true;
            }

            this.checkTrackingCriteriaMet();
        },

        checkCompletion: function() {
            this.completionCriteriaMet = Adapt.course.get('_isComplete');

            this.checkTrackingCriteriaMet();
        },

        checkTrackingCriteriaMet: function() {
            // Set to true for backwards compatability for nothing set in the data
            var criteriaMet = true;

            if (this.model.get('_close')._tracking && this.model.get('_close')._tracking._requireCourseCompleted && this.model.get('_close')._tracking._requireAssessmentPassed) { // user must complete the content AND pass the assessment
                criteriaMet = (this.completionCriteriaMet && this.assessmentCriteriaMet);
            } else if (this.model.get('_close')._tracking && this.model.get('_close')._tracking._requireCourseCompleted) { //user only needs to complete the content
                criteriaMet = this.completionCriteriaMet;
            } else if (this.model.get('_close')._tracking && this.model.get('_close')._tracking._requireAssessmentPassed) { // user only needs to pass the assessment
                criteriaMet = this.assessmentCriteriaMet;
            }

            if (!criteriaMet) return;

            this.$('.close-inner').show();
        }

    });

    return CloseComponentView;

});
