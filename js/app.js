
App = Ember.Application.create({
        // Basic logging, e.g. "Transitioned into 'post'"
        //LOG_TRANSITIONS: true,

        // Extremely detailed logging, highlighting every internal
        // step made while transitioning into a route, including
        // `beforeModel`, `model`, and `afterModel` hooks, and
        // information about redirects and aborted transitions
        //LOG_TRANSITIONS_INTERNAL: true,

        //LOG_VIEW_LOOKUPS: true,

        //LOG_ACTIVE_GENERATION: true
    });

App.Router.map(function() {
    this.route('questions', { path: "/survey" });
});

App.IndexController = Ember.ObjectController.extend({
    actions: {
        startSurvey: function(enid) {
            this.transitionToRoute('questions');
        }
    }
});

App.QuestionsRoute = Ember.Route.extend({
    model: function() {
        return $.getJSON( 'data/questions.json').then( function(data) {
            return data.questions.map(function(question) {
               return question;
            });
        });
    },

    setupController: function(controller, model) {
        model.forEach( function(item, index, enumerable) {
            item.idx = index;
        } );

        var randomizedQuestions = model.toArray();
        randomizedQuestions.shuffle();
        controller.set('model', randomizedQuestions);
    },

    actions: {
        openSummary: function(modalName) {
            return this.render(modalName, {
                into: 'application',
                outlet: 'modal'
            });
        },

        closeSummary: function() {
            return this.disconnectOutlet({
                outlet: 'modal',
                parentView: 'application'
            });
        }
    }

});

Array.prototype.shuffle = function() {
    // From http://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
    var currentIndex = this.length, temporaryValue, randomIndex ;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {

        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        // And swap it with the current element.
        temporaryValue = this[currentIndex];
        this[currentIndex] = this[randomIndex];
        this[randomIndex] = temporaryValue;
    }
};

App.QuestionsController = Ember.ArrayController.extend({
    itemController: 'question',

    updateOptionOrderForQuestionIdx: function(questionIdx, arrayOfElementIds) {

        var questionController = this.find( function(item, index, enumerable) {
            var model = item.get('model');
            return model.idx == questionIdx;
        } );

        questionController.updateOptionOrder(arrayOfElementIds);
    },

    scoresByCategory: function() {
        // Should this be an Ember Map?
        var scores = {
            contributor: 0,
            collaborator: 0,
            communicator: 0,
            challenger: 0
        };

        this.forEach( function(item, index, enumerable) {
            // for each question

            var options = item.get('options');

            // 0th = 4 pts, 1st = 3 pts, 2nd = 2 pts, 3rd = 1 pt
            scores[options[0].category] += 4;
            scores[options[1].category] += 3;
            scores[options[2].category] += 2;
            scores[options[3].category] += 1;
        } );

        return scores;
    }.property('@each.options')
});

App.QuestionController = Ember.ObjectController.extend({
    init: function() {
        var questionIdx = this.get('idx');
        var options = this.get('options');
        options.forEach( function(item, index, enumerable) {
            item.idx = index;
            item.elementId = questionIdx + "_" + index;
        } );

        var randomizedOptions = options.toArray();
        randomizedOptions.shuffle();
        this.set('options', randomizedOptions);
    },

    updateOptionOrder: function(arrayOfElementIds) {

        var options = this.get('options');
        var newOptions = [];

        arrayOfElementIds.forEach( function(item, index) {
            var option = options.findBy( 'elementId', item );
            newOptions.push( option );
        } );

        this.set('options', newOptions);
    }
});

App.QuestionsView = Ember.View.extend({

    didInsertElement: function() {
        var questionsController = this.get('controller');

        $('.sortable a').bind('click', false);

        this.$(".sortable").sortable({
            update: function(event, ui) {
                var arrayOfElementIds = $.map( $( ui.item ).parent().find( 'li' ), function(n, i){
                    return n.id;
                });

                var questionIdx = arrayOfElementIds[0].split('_')[0];

                questionsController.updateOptionOrderForQuestionIdx( questionIdx, arrayOfElementIds);
            }
        });
    }
});


App.SummaryController = Ember.ObjectController.extend({
    needs: "questions",
    scoresByCategory: Ember.computed.alias("controllers.questions.scoresByCategory"),

    summary: function() {
        var scoresByCategory = this.get('scoresByCategory');
        var summary = App.Summary.create( { scores: scoresByCategory } );
        return summary;
    }.property('scoresByCategory'),

    actions: {
        close: function() {
            return this.send('closeSummary');
        }
    }
});

App.SummaryView = Ember.View.extend({
    summary: Ember.computed.alias("controller.summary"),

    title: function() {
        var summary = this.get('summary');
        var singlePrimary = summary.get('primaries').length == 1;

        if ( singlePrimary ) {
            return "My primary team-player style";
        } else {
            return "My primary team-player styles";
        }
    }.property('summary')
});


App.Summary = Ember.Object.extend({
    scores: null,

    init: function() {
    },

    // all the values returned below are ( category, score ) tuples

    ordered: function() {
        function sortDictionaryByValue(obj) {
            var tuples = [];

            for (var key in obj) tuples.push([key, obj[key]]);

            tuples.sort(function(a, b) { return a[1] < b[1] ? 1 : a[1] > b[1] ? -1 : 0 });

            return tuples;
        }

        return sortDictionaryByValue( this.get('scores') );
    }.property('scores'),

    primaries: function() {
        return this.get('ordered').filter( function(item, index, enumerable) {
            var first = enumerable[0];
            var diff = first[1] - item[1];
            return ( diff < 3 );
        });
    }.property('ordered'),

    secondaries: function() {
        return this.get('ordered').removeObjects( this.get('primaries') );
    }.property('primaries')
});

App.ModalDialogComponent = Ember.Component.extend({
    show: function() {
        this.$('.modal').modal().on('hidden.bs.modal', function() {
            this.sendAction('close');
        }.bind(this));
    }.on('didInsertElement'),
    actions: {
        ok: function() {
            this.$('.modal').modal('hide');
            this.sendAction('ok');
        }
    }
});

Ember.Handlebars.helper('debug', function(the_string){
    Ember.Logger.log(the_string);
});

