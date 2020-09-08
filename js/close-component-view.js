define([
  'core/js/adapt'
], function (Adapt) {

  var CloseComponentView = Backbone.View.extend({

    className: 'close-component',

    events: {
      'click .js-close-btn': 'closeModule'
    },

    initialize: function () {
      this.listenTo(Adapt, 'close:closeWindow', this.onCloseConfirm);
      // Listen for completions
      this.listenTo(this.model, 'change:_isComplete', this.onComponentComplete);
      this.listenTo(Adapt.course, 'change:_isComplete', this.checkCompletion);
      this.listenTo(Adapt, 'assessment:complete', this.onAssessmentComplete);

      this.render();
    },

    render: function () {
      var data = this.model.toJSON();
      var template = Handlebars.templates['closeComponent'];

      // Check if 'extensions' div is already in the DOM
      if (!$('.' + this.model.get('_id')).find('.extensions').length) {
        // Create containing div if not already there
        var newDiv = document.createElement('div');
        newDiv.setAttribute('class', 'extensions');
        $(newDiv).appendTo('.' + this.model.get('_id') + ' > .component__inner');
      }

      // Add data
      $(this.el).html(template(data)).appendTo('.' + this.model.get('_id') + ' > .component__inner' + ' > .extensions');

      this.$('.close-inner').hide();

      this.componentCompletionMet = false;
      this.completionCriteriaMet = false;
      this.assessmentCriteriaMet = false;

      _.defer(function () {
        this.postRender();
      }.bind(this));
    },

    postRender: function () {
      this.checkCompletion();

      $('.'+this.model.get('_id')).on('onscreen', this.onscreen.bind(this));

      if (!Adapt.assessment) return;
      this.onAssessmentComplete(Adapt.assessment.getState());
    },

    closeModule: function (event) {
      if (event) event.preventDefault();
      // Check for prompt enabled
      if (this.model.get('_close')._notifyPrompt._isEnabled) {
        this.showPrompt();
      } else {
        this.onCloseConfirm();
      }
    },

    showPrompt: function () {
    	var prompt = this.model.get('_close')._notifyPrompt;

    	Adapt.trigger('notify:prompt', {
    		title: prompt.title,
    		body: prompt.body,
    		_prompts: [
    			{
    				promptText: prompt.confirm,
    				_callbackEvent: 'close:closeWindow'
    			},
    			{
    				promptText: prompt.cancel
    			}
    		]
    	});
    },

    onCloseConfirm: function () {
    	top.window.close();
    },

    onComponentComplete: function () {
      if (this.model.get('_isComplete')) {
        this.componentCompletionMet = true;
      }

      this.checkTrackingCriteriaMet();
    },

    onAssessmentComplete: function (state) {
      if (state.isPass) {
        this.assessmentCriteriaMet = true;
      }

      this.checkTrackingCriteriaMet();
    },

    checkCompletion: function () {
      this.completionCriteriaMet = Adapt.course.get('_isComplete');

      this.checkTrackingCriteriaMet();
    },

    checkTrackingCriteriaMet: function () {
      // Set to true for backwards compatability for nothing set in the data
      var criteriaMet = true;

      if (this.model.get('_close')._tracking && this.model.get('_close')._tracking._requireCourseCompleted && this.model.get('_close')._tracking._requireAssessmentPassed && this.model.get('_close')._tracking._requireComponentCompleted) { // user must complete the content AND pass the assessment AND complete the component
        criteriaMet = (this.completionCriteriaMet && this.assessmentCriteriaMet && this.componentCompletionMet);
      } else if (this.model.get('_close')._tracking && this.model.get('_close')._tracking._requireCourseCompleted && this.model.get('_close')._tracking._requireAssessmentPassed) { // user must complete the content AND pass the assessment
        criteriaMet = (this.completionCriteriaMet && this.assessmentCriteriaMet);
      } else if (this.model.get('_close')._tracking && this.model.get('_close')._tracking._requireCourseCompleted && this.model.get('_close')._tracking._requireComponentCompleted) { // user must complete the content AND complete the component
        criteriaMet = (this.completionCriteriaMet && this.componentCompletionMet);
      } else if (this.model.get('_close')._tracking && this.model.get('_close')._tracking._requireAssessmentPassed && this.model.get('_close')._tracking._requireComponentCompleted) { // user must pass the assessment AND complete the component
        criteriaMet = (this.assessmentCriteriaMet && this.componentCompletionMet);
      } else if (this.model.get('_close')._tracking && this.model.get('_close')._tracking._requireCourseCompleted) { //user only needs to complete the content
        criteriaMet = this.completionCriteriaMet;
      } else if (this.model.get('_close')._tracking && this.model.get('_close')._tracking._requireAssessmentPassed) { // user only needs to pass the assessment
        criteriaMet = this.assessmentCriteriaMet;
      } else if (this.model.get('_close')._tracking && this.model.get('_close')._tracking._requireComponentCompleted) { // user only needs to complete the component
        criteriaMet = this.componentCompletionMet;
      }

      if (!criteriaMet) return;

      this.$('.close-inner').show();
    },

    onscreen: function (event, measurements) {
      var visible = this.model.get('_isVisible');
      var isOnscreenY = measurements.percentFromTop < 50 && measurements.percentFromTop > 0;
      var isOnscreenX = measurements.percentInviewHorizontal == 100;
      // Check for element coming on screen
      if (visible && isOnscreenY && isOnscreenX) {
        $('.' + this.model.get('_id')).off('onscreen');
        this.onCompletion();
      }
    },

    onCompletion: function () {
      _.delay(function () {
        Adapt.trigger('close:checkCompletion');
      }.bind(this), 500);
    }

  });

  return CloseComponentView;

});
