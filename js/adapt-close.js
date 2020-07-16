define([
  'core/js/adapt',
  'core/js/enums/completionStateEnum',
  './close-navigation-view',
  './close-component-view',
], function(Adapt, COMPLETION_STATE, CloseNavigationView, CloseComponentView) {

	var Close = _.extend({

		initialize: function() {
			this.listenToOnce(Adapt, "app:dataReady", this.onDataReady);
		},

    onDataReady: function() {
      this.listenTo(Adapt.config, 'change:_activeLanguage', this.onLangChange);

      if (Adapt.course.get("_close") && Adapt.course.get("_close")._isEnabled) {
        this.setupClose();
        this.setupListeners();
      }
    },

    setupListeners: function() {
      this.listenTo(Adapt, {
        "close:checkCompletion": this.checkCompletion,
        "navigationView:postRender": this.loadNavigationView,
        "componentView:postRender": this.onComponentReady
      });

      if (this.closeConfig.browserPromptIfIncomplete || this.closeConfig.browserPromptIfComplete) {
  			$(window).on("beforeunload", _.partial(onBeforeUnload, this.closeConfig));
  		}
    },

    removeListeners: function() {
      this.stopListening(Adapt, {
        "close:checkCompletion": this.checkCompletion,
        "navigationView:postRender": this.loadNavigationView,
        "componentView:postRender": this.onComponentReady
      });

      this.stopListening(Adapt.config, 'change:_activeLanguage', this.onLangChange);
    },

    setupClose: function() {
      this.closeConfig = Adapt.course.get('_close');
    },

    loadNavigationView: function(navigationView) {
      if (!this.closeConfig._button._isEnabled) return;

      var navigationModel = new Backbone.Model(this.closeConfig._button);
      new CloseNavigationView({
        model: navigationModel
      });
    },

    onBeforeUnload: function(config) {
  		return !Adapt.course.get("_isComplete") ?
  			config.browserPromptIfIncomplete || undefined :
  			config.browserPromptIfComplete || undefined;
  	},

    onComponentReady: function(view) {
      if (Adapt.course.get("_close") && Adapt.course.get("_close")._isEnabled && view.model.get("_close") && view.model.get("_close")._isEnabled) {
        // Only render view if it DOESN'T already exist - Work around for assessmentResults component
        if (!$('.' + view.model.get('_id')).find('.close-component').length) {
          new CloseComponentView({model:view.model});
        }
      }
    },

    checkCompletion: function() {
      var completionData = this.getCompletionData();

      if (completionData.status === COMPLETION_STATE.INCOMPLETE) {
        return;
      }

      Adapt.trigger('tracking:complete', completionData);
      Adapt.log.debug('tracking:complete', completionData);
    },

    // Taken from core/js tracking.js
    getCompletionData: function() {
      this._config = Adapt.config.get('_completionCriteria');

      if (this._config._requireAssessmentCompleted) {
        this._assessmentState = Adapt.assessment.getState();
      }

      var completionData = {
        status: COMPLETION_STATE.INCOMPLETE,
        assessment: null
      };

      // Course complete is required.
      if (this._config._requireContentCompleted && !Adapt.course.get('_isComplete')) {
        // INCOMPLETE: course not complete.
        return completionData;
      }

      // Assessment completed required.
      if (this._config._requireAssessmentCompleted) {
        if (!this._assessmentState || !this._assessmentState.isComplete) {
          // INCOMPLETE: assessment is not complete.
          return completionData;
        }

        // PASSED/FAILED: assessment completed.
        completionData.status = this._assessmentState.isPass ? COMPLETION_STATE.PASSED : COMPLETION_STATE.FAILED;
        completionData.assessment = this._assessmentState;

        return completionData;
      }

      // COMPLETED: criteria met, no assessment requirements.
      completionData.status = COMPLETION_STATE.COMPLETED;

      return completionData;
    },

    onLangChange: function() {
      this.removeListeners();
      this.listenToOnce(Adapt, "app:dataReady", this.onDataReady);
    }

  }, Backbone.Events);

  Close.initialize();

  return Close;

});
