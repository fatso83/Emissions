(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"./app/main.js":[function(require,module,exports){
(function (global){
'use strict';

var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null);
var document = require('global/document');
var window = require('global/window');
var serverCommunication = require('./client-api');

// the actual rigging of the application is done in the router!
var router = require('./router-container');

var AppDispatcher = require('./appdispatcher');
var constants = require('./constants/RouterConstants');

serverCommunication.setup();

// the mission timer gets out sync if losing focus, so resync with server every time the window regains focus
window.onfocus = serverCommunication.askForMissionTime;

// run startup actions - usually only relevant when developing
require('./client-bootstrap').run();

router.run(function (Handler, state) {
    // pass the state down into the RouteHandlers, as that will make
    // the router related properties available on each RH. Taken from Upgrade tips for React Router
    React.render(React.createElement(Handler, state), document.body);
});

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./appdispatcher":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/appdispatcher.js","./client-api":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/client-api.js","./client-bootstrap":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/client-bootstrap.js","./constants/RouterConstants":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/constants/RouterConstants.js","./router-container":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/router-container.js","global/document":"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/global/document.js","global/window":"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/global/window.js"}],"/Users/carl-erik.kopseng/dev_priv/Emissions/app/actions/AstroTeamActionCreators.js":[function(require,module,exports){
'use strict';

var Dispatcher = require('../appdispatcher');
var MConstants = require('../constants/MissionConstants');
var AstConstants = require('../constants/AstroTeamConstants');
var MessageActionCreators = require('./MessageActionCreators');
var utils = require('../utils');

// lazy load due to avoid circular dependencies
function lazyRequire(path) {
    var tmp = null;
    return function () {
        if (!tmp) tmp = require(path);
        return tmp;
    };
}
var getServerAPI = lazyRequire('../client-api');
var getMissionAC = lazyRequire('./MissionActionCreators');
// for browserify to work it needs to find these magic strings
if (false) {
    require('./MissionActionCreators');
    require('../client-api');
}
var TimerActionCreators = require('./TimerActionCreators');

window.__astActions = module.exports = {

    /* in units per minute */
    setOxygenConsumption: function setOxygenConsumption(units) {
        getServerAPI().setOxygenConsumption(units);
    },

    heartRateRead: function heartRateRead(rate) {
        var text, level;
        if (rate < 90) {
            level = 'info';
            text = 'Fine verdier';
        } else if (rate > 120) {
            text = 'Veldig høye verdier!';
            level = 'danger';
        } else {
            text = 'Ganske høy hjerterytme. Grunn til bekymring?';
            level = 'warning';
        }

        MessageActionCreators.addMessage({ text: text, level: level, duration: 20 });
    },

    startMonitorTask: function startMonitorTask() {

        TimerActionCreators.resetTimer(AstConstants.HEART_RATE_TIMER);
        TimerActionCreators.resetTimer(AstConstants.RESPIRATION_TIMER);
        getMissionAC().startTask('astronaut', 'breathing_timer');
    }

};

},{"../appdispatcher":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/appdispatcher.js","../client-api":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/client-api.js","../constants/AstroTeamConstants":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/constants/AstroTeamConstants.js","../constants/MissionConstants":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/constants/MissionConstants.js","../utils":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/utils.js","./MessageActionCreators":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/actions/MessageActionCreators.js","./MissionActionCreators":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/actions/MissionActionCreators.js","./TimerActionCreators":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/actions/TimerActionCreators.js"}],"/Users/carl-erik.kopseng/dev_priv/Emissions/app/actions/MessageActionCreators.js":[function(require,module,exports){
'use strict';

var _Object$assign = require('babel-runtime/core-js/object/assign')['default'];

var _Object$freeze = require('babel-runtime/core-js/object/freeze')['default'];

var AppDispatcher = require('../appdispatcher'),
    uuid = require('./../utils').uuid,
    constants = require('../constants/MessageConstants');

var actions = {

    /**
     * @param msg.text the message
     * @param [msg.id] the message id. if not given, one will be created
     * @param [msg.level] same as bootstrap's alert classes: [success, info, warning, danger]
     * @param [msg.duration] {Number} optional duration for transient messages
     *
     * @returns {string} the message id
     */
    addMessage: function addMessage(msg) {
        var id = msg.id;

        if (!id) {
            id = uuid();
            msg.id = id;
        }

        if (!msg.level) {
            msg.level = 'success';
        }

        AppDispatcher.dispatch({
            action: constants.MESSAGE_ADDED,
            data: msg
        });

        if (msg.duration) {
            setTimeout(function () {
                return actions.removeMessage(msg.id);
            }, msg.duration * 1000);
        }

        return id;
    },

    /**
     * msg with default duration of 5 seconds
     * @param msg
     * @param [duration] default of 5 seconds
     *
     * @see #addMessage() for more params
     * @returns {string} the message id
     */
    addTransientMessage: function addTransientMessage(msg) {
        var duration = arguments[1] === undefined ? 5 : arguments[1];

        return actions.addMessage(_Object$assign({ duration: duration }, msg));
    },

    removeMessage: function removeMessage(id) {
        AppDispatcher.dispatch({
            action: constants.REMOVE_MESSAGE,
            data: id
        });
    }

};

// prevent new properties from being added or removed
_Object$freeze(actions);
window.__MessageActions = actions;
module.exports = actions;

},{"../appdispatcher":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/appdispatcher.js","../constants/MessageConstants":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/constants/MessageConstants.js","./../utils":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/utils.js","babel-runtime/core-js/object/assign":"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/babel-runtime/core-js/object/assign.js","babel-runtime/core-js/object/freeze":"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/babel-runtime/core-js/object/freeze.js"}],"/Users/carl-erik.kopseng/dev_priv/Emissions/app/actions/MissionActionCreators.js":[function(require,module,exports){
'use strict';

var _Object$assign = require('babel-runtime/core-js/object/assign')['default'];

var AppDispatcher = require('../appdispatcher'),
    MissionConstants = require('../constants/MissionConstants'),
    router = require('./../router-container');

// lazy load due to circular dependencies
var serverAPI = (function () {
    var api;

    return function () {
        if (!api) {
            api = require('../client-api');
        }
        return api;
    };
})();

var tmp = {

    startMission: function startMission() {
        serverAPI().startMission();
    },

    stopMission: function stopMission() {
        serverAPI().stopMission();
    },

    resetMission: function resetMission() {
        serverAPI().resetMission();
    },

    missionStarted: function missionStarted() {
        AppDispatcher.dispatch({ action: MissionConstants.MISSION_STARTED_EVENT });
    },

    missionStopped: function missionStopped() {
        AppDispatcher.dispatch({ action: MissionConstants.MISSION_STOPPED_EVENT });
    },

    missionWasReset: function missionWasReset() {
        AppDispatcher.dispatch({ action: MissionConstants.MISSION_WAS_RESET });
        serverAPI().askForAppState();
    },

    missionCompleted: function missionCompleted() {
        //AppDispatcher.dispatch({action: MissionConstants.MISSION_COMPLETED_EVENT});
        router.transitionTo('/completed');
    },

    completeMission: function completeMission() {
        serverAPI().completeMission();
    },

    receivedEvents: function receivedEvents(eventsCollection) {
        AppDispatcher.dispatch(_Object$assign({}, eventsCollection, { action: MissionConstants.RECEIVED_EVENTS }));
    },

    askForEvents: function askForEvents() {
        serverAPI().askForEvents();
    },

    introWasRead: function introWasRead(teamId) {
        AppDispatcher.dispatch({ action: MissionConstants.INTRODUCTION_READ, teamName: teamId });
        serverAPI().sendTeamStateChange();
    },

    startTask: function startTask(teamId, taskId) {
        AppDispatcher.dispatch({ action: MissionConstants.START_TASK, teamId: teamId, taskId: taskId });
        serverAPI().sendTeamStateChange();
    },

    taskCompleted: function taskCompleted(teamId, taskId) {
        AppDispatcher.dispatch({ action: MissionConstants.COMPLETED_TASK, taskId: taskId, teamId: teamId });
        serverAPI().sendTeamStateChange();

        // also publish this to server as separate event? - maybe to trigger something at certain point?
    },

    askToStartNextChapter: function askToStartNextChapter() {
        serverAPI().askToStartNextChapter();
    },

    askToTriggerEvent: function askToTriggerEvent(uuid) {
        serverAPI().triggerEvent(uuid);
    },

    setMissionTime: function setMissionTime(elapsedSeconds) {
        AppDispatcher.dispatch({
            action: MissionConstants.MISSION_TIME_SYNC,
            data: { elapsedMissionTime: elapsedSeconds }
        });
    }

};

window.__MissionAC = tmp;
module.exports = tmp;

},{"../appdispatcher":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/appdispatcher.js","../client-api":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/client-api.js","../constants/MissionConstants":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/constants/MissionConstants.js","./../router-container":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/router-container.js","babel-runtime/core-js/object/assign":"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/babel-runtime/core-js/object/assign.js"}],"/Users/carl-erik.kopseng/dev_priv/Emissions/app/actions/ScienceActionCreators.js":[function(require,module,exports){
'use strict';

var AppDispatcher = require('../appdispatcher');
var RadiationStore = require('./../stores/radiation-store');
var ScienceTeamConstants = require('../constants/ScienceTeamConstants');
var MissionConstants = require('../constants/MissionConstants');
var MessageActionsCreators = require('./MessageActionCreators');
var TimerActionCreators = require('../actions/TimerActionCreators');
var api = require('../client-api');

var missionActionCreators = (function () {
    var tmp;

    return function () {
        if (!tmp) tmp = require('../actions/MissionActionCreators');
        return tmp;
    };
})();

var actions = {

    startSampleTask: function startSampleTask() {
        AppDispatcher.dispatch({ action: ScienceTeamConstants.SCIENCE_CLEAR_RADIATION_SAMPLES });
        missionActionCreators().startTask('science', 'sample');
        this.resetSamplingTimer();
    },

    completeTask: function completeTask(taskId) {
        missionActionCreators().taskCompleted('science', taskId);
    },

    resetSamplingTimer: function resetSamplingTimer() {
        TimerActionCreators.resetTimer(ScienceTeamConstants.SCIENCE_TIMER_1);
    },

    takeRadiationSample: function takeRadiationSample() {
        AppDispatcher.dispatch({
            action: ScienceTeamConstants.SCIENCE_TAKE_RADIATION_SAMPLE
        });
    },

    averageRadiationCalculated: function averageRadiationCalculated(average) {
        var samples = RadiationStore.getSamples();

        if (samples.length) {
            var sum = samples.reduce(function (prev, current) {
                return prev + current;
            }, 0),
                trueCalculatedAverage = sum / samples.length,
                diffInPercent = 100 * Math.abs((trueCalculatedAverage - average) / trueCalculatedAverage);

            if (diffInPercent > 15) {
                MessageActionsCreators.addTransientMessage({ text: 'Mulig det gjennomsnittet ble litt feil.' });
            }
        }

        AppDispatcher.dispatch({
            action: ScienceTeamConstants.SCIENCE_AVG_RADIATION_CALCULATED,
            data: { average: average }
        });

        if (average > ScienceTeamConstants.SCIENCE_AVG_RAD_RED_THRESHOLD) {
            MessageActionsCreators.addTransientMessage({
                text: 'Veldig høyt radioaktivt nivå detektert. Varsle sikkerhetsteamet umiddelbart!',
                level: 'danger',
                id: ScienceTeamConstants.SCIENCE_RADIATION_WARNING_MSG
            }, 30);
        } else if (average > ScienceTeamConstants.SCIENCE_AVG_RAD_ORANGE_THRESHOLD) {
            MessageActionsCreators.addTransientMessage({
                text: 'Høye verdier av radioaktivitet. Følg med på om det går nedover igjen',
                level: 'warning',
                id: ScienceTeamConstants.SCIENCE_RADIATION_WARNING_MSG
            }, 10);
        }

        this.completeTask('average');
    },

    /**
     * Set the radiation level that will be reported to the view layer
     * The reported radiation will generated values in the range given by the parameters
     *
     * We are not actually receiving a stream of values from the server, as that could
     * be very resource heavy. Instead we generate random values between the given values,
     * which to the user will look the same.
     * @param min
     * @param max
     */
    setRadiationLevel: function setRadiationLevel(min, max) {
        AppDispatcher.dispatch({
            action: ScienceTeamConstants.SCIENCE_RADIATION_LEVEL_CHANGED,
            data: { min: min, max: max }
        });
    },

    addToTotalRadiationLevel: function addToTotalRadiationLevel(amount) {

        var total = amount + RadiationStore.getTotalLevel();

        if (total > ScienceTeamConstants.SCIENCE_TOTAL_RADIATION_VERY_SERIOUS_THRESHOLD) {
            MessageActionsCreators.addTransientMessage({
                id: 'science_high_radiation_level',
                text: 'Faretruende høyt strålingsnivå!',
                level: 'danger'
            }, 30);
        } else if (total > ScienceTeamConstants.SCIENCE_TOTAL_RADIATION_SERIOUS_THRESHOLD) {
            MessageActionsCreators.addTransientMessage({
                id: 'science_high_radiation_level',
                text: 'Høyt strålingsnivå!',
                level: 'warning'
            }, 30);
        }

        AppDispatcher.dispatch({
            action: ScienceTeamConstants.SCIENCE_TOTAL_RADIATION_LEVEL_CHANGED,
            data: { total: total, added: amount }
        });

        this.completeTask('addtotal');
    }

};

window.__ScienceActions = actions;
module.exports = actions;

},{"../actions/MissionActionCreators":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/actions/MissionActionCreators.js","../actions/TimerActionCreators":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/actions/TimerActionCreators.js","../appdispatcher":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/appdispatcher.js","../client-api":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/client-api.js","../constants/MissionConstants":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/constants/MissionConstants.js","../constants/ScienceTeamConstants":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/constants/ScienceTeamConstants.js","./../stores/radiation-store":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/stores/radiation-store.js","./MessageActionCreators":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/actions/MessageActionCreators.js"}],"/Users/carl-erik.kopseng/dev_priv/Emissions/app/actions/SecurityTeamAcrtionCreators.js":[function(require,module,exports){
// lazy load due to avoid circular dependencies
'use strict';

function lazyRequire(path) {
    var tmp = null;
    return function () {
        if (!tmp) tmp = require(path);
        return tmp;
    };
}
var getMissionAC = lazyRequire('./MissionActionCreators');
var getServerAPI = lazyRequire('../client-api');
// for browserify to work it needs to find these magic strings
require('./MissionActionCreators');
require('../client-api');

var actions = module.exports = {
    startDataTransferCheck: function startDataTransferCheck() {
        getMissionAC().startTask('security', 'tyr_v_check');
    }
};

},{"../client-api":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/client-api.js","./MissionActionCreators":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/actions/MissionActionCreators.js"}],"/Users/carl-erik.kopseng/dev_priv/Emissions/app/actions/TimerActionCreators.js":[function(require,module,exports){
'use strict';

var AppDispatcher = require('../appdispatcher');
var constants = require('../constants/TimerConstants');

var actions = {

    startTimer: function startTimer(id) {
        AppDispatcher.dispatch({ action: constants.START_TIMER, data: { timerId: id } });
    },

    resetTimer: function resetTimer(id) {
        AppDispatcher.dispatch({ action: constants.RESET_TIMER, data: { timerId: id } });
    },

    stopTimer: function stopTimer(id) {
        AppDispatcher.dispatch({ action: constants.STOP_TIMER, data: { timerId: id } });
    },

    setTimer: function setTimer(timerId, time) {
        AppDispatcher.dispatch({
            action: constants.SET_TIMER,
            data: {
                remainingTime: time,
                timerId: timerId
            }
        });
    }

};

module.exports = actions;

},{"../appdispatcher":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/appdispatcher.js","../constants/TimerConstants":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/constants/TimerConstants.js"}],"/Users/carl-erik.kopseng/dev_priv/Emissions/app/appdispatcher.js":[function(require,module,exports){
/*
 * Dispatcher - a singleton
 *
 * This is essentially the main driver in the Flux architecture
 * @see http://facebook.github.io/flux/docs/overview.html
*/

'use strict';

var _Object$assign = require('babel-runtime/core-js/object/assign')['default'];

var _require = require('flux');

var Dispatcher = _require.Dispatcher;

var AppDispatcher = _Object$assign(new Dispatcher(), {});

window.__AppDispatcher = AppDispatcher;
module.exports = AppDispatcher;

// optional methods

},{"babel-runtime/core-js/object/assign":"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/babel-runtime/core-js/object/assign.js","flux":"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/flux/index.js"}],"/Users/carl-erik.kopseng/dev_priv/Emissions/app/client-api.js":[function(require,module,exports){
(function (global){
'use strict';

var AppDispatcher = require('./appdispatcher');
var io = (typeof window !== "undefined" ? window.io : typeof global !== "undefined" ? global.io : null);
var socket = io();
var MissionConstants = require('./constants/MissionConstants');
var MissionActionCreators = require('./actions/MissionActionCreators');
var MessageActionCreators = require('./actions/MessageActionCreators');
var ScienceTeamActionCreators = require('./actions/ScienceActionCreators');
var AstroTeamTeamActionCreators = require('./actions/AstroTeamActionCreators');
var RadiationStore = require('./stores/radiation-store');
var TimerStore = require('./stores/timer-store');
var TaskStore = require('./stores/task-store');
var IntroductionStore = require('./stores/introduction-store');
var Router = require('./router-container');
var EventConstants = require('../server/EventConstants');

var api = {

    setup: function setup() {
        var _this = this;

        socket.on('connect', function () {
            console.log('Connected to server WebSocket');
            console.log('Asking server for app state');
            api.askForAppState();
            MessageActionCreators.removeMessage('disconnect message');
        });

        socket.on('disconnect', function () {
            MessageActionCreators.addMessage({
                id: 'disconnect message',
                text: 'Mistet kontakt med serveren. Last siden på nytt',
                level: 'danger'
            });
        });

        socket.on(EventConstants.MISSION_STARTED, function (appState) {
            MissionActionCreators.missionStarted();
            _this._appStateReceived(appState);
        });
        socket.on(EventConstants.MISSION_STOPPED, function () {
            return MissionActionCreators.missionStopped();
        });
        socket.on(EventConstants.MISSION_COMPLETED, function () {
            return MissionActionCreators.missionCompleted();
        });
        socket.on(EventConstants.MISSION_RESET, function () {
            return MissionActionCreators.missionWasReset();
        });

        socket.on(EventConstants.SET_EVENTS, MissionActionCreators.receivedEvents);
        socket.on(EventConstants.ADD_MESSAGE, function (serverMsg) {
            if (serverMsg.audience && serverMsg.audience !== Router.getTeamId()) return;

            MessageActionCreators.addMessage(serverMsg);
        });

        socket.on('mission time', MissionActionCreators.setMissionTime);

        socket.on(EventConstants.APP_STATE, function (state) {
            _this._appStateReceived(state);
        });

        // if the client misses the message/event it is lost ... and the current_event will be unchanged :-(
        // TODO: store it server_side in the teamState before sending
        socket.on(EventConstants.AST_CHECK_VITALS, function () {
            AstroTeamTeamActionCreators.startMonitorTask();
        });

        socket.on(EventConstants.SCIENCE_CHECK_RADIATION, function () {
            ScienceTeamActionCreators.startSampleTask();
        });

        socket.on(EventConstants.SECURITY_CHECK_DATA_TRANSFER, function () {
            require('./actions/SecurityTeamAcrtionCreators').startDataTransferCheck();
        });
    },

    startMission: function startMission() {
        socket.emit('start mission');
    },

    stopMission: function stopMission() {
        socket.emit('stop mission');
    },

    resetMission: function resetMission() {
        socket.emit('reset mission');
    },

    askToStartNextChapter: function askToStartNextChapter() {
        socket.emit(EventConstants.ADVANCE_CHAPTER);
    },

    triggerEvent: function triggerEvent(uuid) {
        socket.emit(EventConstants.TRIGGER_EVENT, uuid);
    },

    /*
     * Send the client held state (for the current team) to server on change
     * The most important bits are held on server, and is not transferred back,
     * such as if the mission is running, the current chapter, etc.
     *
     * This is important to store on the server in case we drop the connection and reconnect in other session
     */
    sendTeamStateChange: function sendTeamStateChange() {
        var teamId = arguments[0] === undefined ? Router.getTeamId() : arguments[0];

        var state = {};

        state.team = teamId;
        state.introduction_read = IntroductionStore.isIntroductionRead(teamId);
        state.current_task = TaskStore.getCurrentTaskId(teamId);

        if (teamId === 'science') {
            state.radiation = RadiationStore.getState();
        } else if (teamId === 'astronaut') {}

        socket.emit('set team state', state);
    },

    completeMission: function completeMission() {
        socket.emit(EventConstants.COMPLETE_MISSION);
    },

    /*
     * This is only stubbed out until server communication is up and running
     */
    askForAppState: function askForAppState() {
        socket.emit('get app state');
    },

    askForMissionTime: function askForMissionTime() {
        socket.emit('get mission time');
    },

    _appStateReceived: function _appStateReceived(appState) {
        AppDispatcher.dispatch({ action: MissionConstants.RECEIVED_APP_STATE, appState: appState });
    },

    askForEvents: function askForEvents() {
        socket.emit(EventConstants.GET_EVENTS);
    },

    setOxygenConsumption: function setOxygenConsumption(units) {
        socket.emit('set oxygen consumption', units);
    },

    // meant for testing - not actual client use
    setOxygenLevel: function setOxygenLevel(units) {
        socket.emit('set oxygen remaining', units);
    }

};

window.__api = api;
module.exports = api;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../server/EventConstants":"/Users/carl-erik.kopseng/dev_priv/Emissions/server/EventConstants.js","./actions/AstroTeamActionCreators":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/actions/AstroTeamActionCreators.js","./actions/MessageActionCreators":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/actions/MessageActionCreators.js","./actions/MissionActionCreators":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/actions/MissionActionCreators.js","./actions/ScienceActionCreators":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/actions/ScienceActionCreators.js","./actions/SecurityTeamAcrtionCreators":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/actions/SecurityTeamAcrtionCreators.js","./appdispatcher":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/appdispatcher.js","./constants/MissionConstants":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/constants/MissionConstants.js","./router-container":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/router-container.js","./stores/introduction-store":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/stores/introduction-store.js","./stores/radiation-store":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/stores/radiation-store.js","./stores/task-store":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/stores/task-store.js","./stores/timer-store":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/stores/timer-store.js"}],"/Users/carl-erik.kopseng/dev_priv/Emissions/app/client-bootstrap.js":[function(require,module,exports){
/* Script to bootstrap the application */

'use strict';

var MissionActionCreators = require('./actions/MissionActionCreators'),
    MessageActionCreators = require('./actions/MessageActionCreators'),
    ScienceActionCreators = require('./actions/ScienceActionCreators'),
    ScienceConstants = require('./constants/ScienceTeamConstants'),
    TimerActionCreators = require('./actions/TimerActionCreators'),
    AppDispatcher = require('./appdispatcher');

AppDispatcher.register(function (payload) {
    console.log('DEBUG AppDispatcher.dispatch', payload);
});

function run() {

    // SETTINGS
    MissionActionCreators.startMission();
}

module.exports = { run: run };

},{"./actions/MessageActionCreators":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/actions/MessageActionCreators.js","./actions/MissionActionCreators":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/actions/MissionActionCreators.js","./actions/ScienceActionCreators":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/actions/ScienceActionCreators.js","./actions/TimerActionCreators":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/actions/TimerActionCreators.js","./appdispatcher":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/appdispatcher.js","./constants/ScienceTeamConstants":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/constants/ScienceTeamConstants.js"}],"/Users/carl-erik.kopseng/dev_priv/Emissions/app/components/app.react.js":[function(require,module,exports){
(function (global){
'use strict';

var _extends = require('babel-runtime/helpers/extends')['default'];

var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null);
var Router = (typeof window !== "undefined" ? window.ReactRouter : typeof global !== "undefined" ? global.ReactRouter : null);

var RouteHandler = Router.RouteHandler;

var Header = require('./header.react');

var MessageList = require('./message-list.react');
var MissionStateStore = require('../stores/mission-state-store');

var App = React.createClass({
    displayName: 'App',

    mixins: [],

    getInitialState: function getInitialState() {
        return { isMissionRunning: MissionStateStore.isMissionRunning() };
    },

    componentWillMount: function componentWillMount() {
        MissionStateStore.addChangeListener(this._handleMissionStateChange);
    },

    componentDidMount: function componentDidMount() {
        console.log('App.componentDidMount');
    },

    componentWillUnmount: function componentWillUnmount() {
        MissionStateStore.removeChangeListener(this._handleMissionStateChange);
    },

    _handleMissionStateChange: function _handleMissionStateChange() {
        this.setState({ isMissionRunning: MissionStateStore.isMissionRunning() });
    },

    render: function render() {

        return React.createElement(
            'div',
            { className: 'container' },
            React.createElement(Header, null),
            React.createElement(RouteHandler, _extends({}, this.props, this.state)),
            React.createElement(
                'div',
                { className: 'row' },
                React.createElement('footer', { id: 'main-footer' })
            )
        );
    }
});

module.exports = App;
/* this is the important part */

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../stores/mission-state-store":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/stores/mission-state-store.js","./header.react":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/components/header.react.js","./message-list.react":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/components/message-list.react.js","babel-runtime/helpers/extends":"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/babel-runtime/helpers/extends.js"}],"/Users/carl-erik.kopseng/dev_priv/Emissions/app/components/astronaut-task.react.js":[function(require,module,exports){
(function (global){
'use strict';

var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null);
var HeartRateChart = require('./heart-rate-chart.react');
var BreathRateChart = require('./breath-rate-chart.react');
var TimerPanel = require('./timer-panel.react');
var TimerActionCreators = require('../actions/TimerActionCreators');
var OxygenStore = require('../stores/oxygen-store');
var AstronautConstants = require('../constants/AstroTeamConstants');
var AstronautActionCreators = require('../actions/AstroTeamActionCreators');

var _require = require('../utils');

var parseNumber = _require.parseNumber;

TimerActionCreators.setTimer(AstronautConstants.RESPIRATION_TIMER, 15);
TimerActionCreators.setTimer(AstronautConstants.HEART_RATE_TIMER, 10);

// lazy load due to avoid circular dependencies
function lazyRequire(path) {
    var tmp = null;
    return function () {
        if (!tmp) tmp = require(path);
        return tmp;
    };
}
var getMissionAC = lazyRequire('../actions/MissionActionCreators');
// for browserify to work it needs to find these magic strings
require('../actions/MissionActionCreators');

module.exports = React.createClass({
    displayName: 'exports',

    statics: {},

    propTypes: {},

    mixins: [],

    getInitialState: function getInitialState() {
        return this._getState();
    },
    componentWillMount: function componentWillMount() {
        var _this = this;

        OxygenStore.addChangeListener(function () {
            return _this._updateState();
        });
    },

    _indicatorColor: function _indicatorColor() {
        return this.state.oxygenStore.colorIndicator;
    },

    _updateState: function _updateState() {
        this.setState(this._getState());
    },

    _getState: function _getState() {
        return {
            oxygenStore: OxygenStore.getState()
        };
    },

    _handleBreathRate: function _handleBreathRate(e) {
        e.preventDefault();
        var el = React.findDOMNode(this.refs['breath-rate']);
        AstronautActionCreators.setOxygenConsumption(parseNumber(el.value));
        getMissionAC().taskCompleted('astronaut', 'breathing_calculate');
    },

    _handleHeartRate: function _handleHeartRate(e) {
        e.preventDefault();
        var el = React.findDOMNode(this.refs['heart-rate-input']);
        AstronautActionCreators.heartRateRead(parseNumber(el.value));
        getMissionAC().taskCompleted('astronaut', 'heartrate_calculate');
    },

    render: function render() {

        return React.createElement(
            'div',
            null,
            React.createElement(
                'div',
                { className: 'row' },
                React.createElement(
                    'ul',
                    null,
                    React.createElement(
                        'li',
                        null,
                        'Luftstatus:',
                        React.createElement('div', {
                            className: 'circle ',
                            style: { display: 'inline-block', backgroundColor: this._indicatorColor() }
                        })
                    ),
                    React.createElement(
                        'li',
                        null,
                        'Forbruk : ',
                        this.state.oxygenStore.consumptionPerMinute
                    ),
                    React.createElement(
                        'li',
                        null,
                        'Gjenstående oksygen: ',
                        this.state.oxygenStore.remaining,
                        ' enheter'
                    )
                )
            ),
            React.createElement(
                'div',
                { className: 'row' },
                React.createElement(
                    'div',
                    { className: 'col-md-6' },
                    React.createElement(
                        'h2',
                        null,
                        'Pust'
                    ),
                    React.createElement(BreathRateChart, { height: 240 })
                ),
                React.createElement(
                    'div',
                    { className: 'col-md-6' },
                    React.createElement(
                        'h2',
                        null,
                        'Hjerteslag'
                    ),
                    React.createElement(HeartRateChart, { height: 240 })
                ),
                React.createElement(TimerPanel, { timerId: AstronautConstants.RESPIRATION_TIMER, className: 'col-md-6' }),
                React.createElement(TimerPanel, { timerId: AstronautConstants.HEART_RATE_TIMER, className: 'col-md-6' })
            ),
            React.createElement(
                'div',
                { className: 'row' },
                React.createElement(
                    'div',
                    { className: 'col-xs-6' },
                    React.createElement(
                        'fieldset',
                        { disabled: false },
                        React.createElement(
                            'h3',
                            null,
                            'Beregnet luftforbruk'
                        ),
                        React.createElement(
                            'form',
                            { onSubmit: this._handleBreathRate },
                            React.createElement(
                                'select',
                                { ref: 'breath-rate' },
                                React.createElement(
                                    'option',
                                    { value: 1 },
                                    '1 enhet per minutt'
                                ),
                                React.createElement(
                                    'option',
                                    { value: 2 },
                                    '2 enheter per minutt'
                                )
                            ),
                            React.createElement(
                                'button',
                                { className: 'btn btn-primary' },
                                'Evaluer'
                            )
                        )
                    )
                ),
                React.createElement(
                    'div',
                    { className: 'col-xs-6' },
                    React.createElement(
                        'fieldset',
                        { disabled: false },
                        React.createElement(
                            'h3',
                            null,
                            'Beregnet hjerterytme'
                        ),
                        React.createElement(
                            'form',
                            { onSubmit: this._handleHeartRate },
                            React.createElement('input', { ref: 'heart-rate-input', type: 'number', min: '50', max: '200' }),
                            React.createElement(
                                'button',
                                { className: 'btn btn-primary' },
                                'Evaluer'
                            )
                        )
                    )
                )
            )
        );
    }

});

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../actions/AstroTeamActionCreators":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/actions/AstroTeamActionCreators.js","../actions/MissionActionCreators":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/actions/MissionActionCreators.js","../actions/TimerActionCreators":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/actions/TimerActionCreators.js","../constants/AstroTeamConstants":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/constants/AstroTeamConstants.js","../stores/oxygen-store":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/stores/oxygen-store.js","../utils":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/utils.js","./breath-rate-chart.react":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/components/breath-rate-chart.react.js","./heart-rate-chart.react":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/components/heart-rate-chart.react.js","./timer-panel.react":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/components/timer-panel.react.js"}],"/Users/carl-erik.kopseng/dev_priv/Emissions/app/components/breath-rate-chart.react.js":[function(require,module,exports){
(function (global){
/**
 * THIS DESIGN ONLY SUPPORTS ONE CHART AS THEY *SHARE* STATE
 * For a non-stupid design, do something like the
 * implementation in the article by Nicolas Hery:
 * http://nicolashery.com/integrating-d3js-visualizations-in-a-react-app
 *
 * Chart code more or less copied from the prototype by Leo Martin Westby
 */
'use strict';

var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null);
var AmCharts = (typeof window !== "undefined" ? window.AmCharts : typeof global !== "undefined" ? global.AmCharts : null);
var BreathRateStore = require('../stores/breath-rate-store');

var _require = require('../utils');

var randomInt = _require.randomInt;

//Lung volume in ml before and after inhalation
var lowVolume = 2000;
var highVolume = 3000;

//Millivolts displayed on the Y axis of the ECG graph
var highMV = 1;
var lowMV = 0;

var breathRateSamples = [];
var chart;

//Configure the charts
function initChart(domElement) {
    chart = new AmCharts.AmSerialChart();

    chart.marginTop = 20;
    chart.marginRight = 10;
    chart.autoMarginOffset = 5;
    chart.dataProvider = breathRateSamples;
    chart.categoryField = 'timestamp';

    //X Axis
    var categoryAxis = chart.categoryAxis;
    categoryAxis.dashLength = 1;
    categoryAxis.gridAlpha = 0.1;
    categoryAxis.axisColor = '#DADADA';
    categoryAxis.autoGridCount = false;
    categoryAxis.gridCount = 15;
    categoryAxis.forceShowField = 'forceShow';
    //categoryAxis.title = "Seconds";

    //Hide every label that is not explicitly shown
    categoryAxis.labelFunction = function (valueText, object) {
        if (object.forceShow) {
            return valueText;
        }
    };

    //Y Axis
    var valueAxis = new AmCharts.ValueAxis();
    valueAxis.axisAlpha = 0.2;
    valueAxis.dashLength = 1;
    valueAxis.minimum = lowVolume;
    valueAxis.maximum = highVolume * 1.1;
    valueAxis.title = 'Lungevolum (ml)';
    chart.addValueAxis(valueAxis);

    //Line
    var graph = new AmCharts.AmGraph();
    graph.type = 'smoothedLine';
    graph.valueField = 'volume';
    graph.lineThickness = 1.5;
    graph.lineColor = '#b5030d';
    chart.addGraph(graph);

    chart.write(domElement);
}

var breathRateBuffer;
var breathRateBufferIndex;
var msUntilNextBreathRateBufferFrame;

//Fills the breath rate buffer with samples from the specified range
//The breath rate buffer contains twice as many samples as the breath rate chart and is used to animate the chart
function createBreathRateSamples(min, max) {
    breathRateBuffer = [];
    breathRateBufferIndex = 0;
    msUntilNextBreathRateBufferFrame = 0;

    var breathsPerMinute = randomInt(min, max);
    var msBetweenBreaths = 60 * 1000 / breathsPerMinute;
    var msUntilNextBreath = msBetweenBreaths;

    for (var i = 0; i <= 120; i++) {
        var lungVolume;

        if (msUntilNextBreath <= 0) {
            lungVolume = highVolume;
            msUntilNextBreath = msBetweenBreaths;
        } else {
            lungVolume = lowVolume * 1.05;
        }

        //The resolution of the chart is two samples per second
        breathRateBuffer.push({ timestamp: i / 2, volume: lungVolume });
        msUntilNextBreath -= 500;
    }
}

var chartUpdater;

//Animates the breath rate and heart rate charts
function startEventLoop() {
    var startTime = Date.now();
    var msSinceLastUpdate = 0;
    var msSinceStart = 0;
    var updateFrequency = 400;
    stopEventLoop();

    chartUpdater = setInterval(function () {
        msSinceLastUpdate = Date.now() - startTime - msSinceStart;
        msUntilNextBreathRateBufferFrame -= msSinceLastUpdate;
        msSinceStart = Date.now() - startTime;

        if (msUntilNextBreathRateBufferFrame <= 0) {
            var framesMissed = Math.floor(msUntilNextBreathRateBufferFrame * -1 / 500 + 1);

            for (var i = 0; i < framesMissed; i++) {
                breathRateBufferIndex++;

                if (breathRateBufferIndex >= breathRateBuffer.length) {
                    breathRateBufferIndex = 0;
                }

                breathRateSamples.push(breathRateBuffer[breathRateBufferIndex]);

                //When the chart grows to 30 seconds, start cutting off the oldest sample to give the chart a sliding effect
                if (breathRateSamples.length > 60) {
                    breathRateSamples.shift();
                }
            }

            msUntilNextBreathRateBufferFrame = 250;
        }

        //Always show from 0 to 30 seconds on the X axis
        if (breathRateSamples.length >= 60) {
            for (var i = 0; i < breathRateSamples.length; i++) {
                breathRateSamples[i].timestamp = Math.floor(i / (breathRateSamples.length - 1) * 30);
            }
        }

        //Only show every 5th timestamp
        for (var i = 0; i < breathRateSamples.length; i++) {
            breathRateSamples[i].forceShow = breathRateSamples[i].timestamp % 5 == 0 && (i == 0 || breathRateSamples[i - 1].timestamp % 5 != 0);
        }

        chart.validateData();
    }, updateFrequency);
}

function stopEventLoop() {
    clearInterval(chartUpdater);
    breathRateSamples.length = 0;
    chart.validateData();
}

module.exports = React.createClass({
    displayName: 'exports',

    statics: {},

    propTypes: {
        height: React.PropTypes.number.isRequired,
        width: React.PropTypes.number
    },

    mixins: [],

    getInitialState: function getInitialState() {
        return this._getChartState();
    },

    componentWillMount: function componentWillMount() {
        var _this = this;

        this._updateChart();
        BreathRateStore.addChangeListener(function () {
            return _this._updateChart();
        });
    },

    componentDidMount: function componentDidMount() {
        var el = React.findDOMNode(this);
        initChart(el);
        startEventLoop();
    },

    componentWillUnmount: function componentWillUnmount() {
        chart && chart.clear();
        stopEventLoop();
    },

    componentDidUnmount: function componentDidUnmount() {
        chart = null;
    },

    componentDidUpdate: function componentDidUpdate() {},

    // this chart is responsible for drawing itself
    shouldComponentUpdate: function shouldComponentUpdate() {
        return false;
    },

    // Private methods
    _updateChart: function _updateChart() {
        this.setState(this._getChartState());
        createBreathRateSamples(this.state.min, this.state.max);
    },

    _getChartState: function _getChartState() {
        return BreathRateStore.getState();
    },

    _onChange: function _onChange() {},

    render: function render() {

        // if you don't specify width it will max out to 100% (which is ok)
        return React.createElement('div', {
            style: { width: this.props.width + 'px', height: this.props.height + 'px' },
            className: this.props.className
        });
    }

});

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../stores/breath-rate-store":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/stores/breath-rate-store.js","../utils":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/utils.js"}],"/Users/carl-erik.kopseng/dev_priv/Emissions/app/components/communication-task.react.js":[function(require,module,exports){
(function (global){
'use strict';

var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null);
var OxygenStore = require('../stores/oxygen-store');

var _require = require('../utils');

var parseNumber = _require.parseNumber;

// lazy load due to avoid circular dependencies
function lazyRequire(path) {
    var tmp = null;
    return function () {
        if (!tmp) tmp = require(path);
        return tmp;
    };
}
var getMissionAC = lazyRequire('../actions/MissionActionCreators');
// for browserify to work it needs to find these magic strings
require('../actions/MissionActionCreators');

var satellites = [{ name: 'Satelitt 1', freq: { min: 2.8, max: 3.4 }, reception: 90, color: 'green' }, { name: 'Satelitt 2', freq: { min: 2.1, max: 2.5 }, reception: 30, color: 'red' }, { name: 'Satelitt 3', freq: { min: 3.6, max: 4 }, reception: 60, color: 'orange' }];

var chart;
function initGraph(domElement) {
    chart = new AmCharts.AmSerialChart();

    chart.dataProvider = satellites;
    chart.categoryField = 'name';

    //X axis
    var categoryAxis = chart.categoryAxis;
    categoryAxis.gridPosition = 'start';

    //Y axis
    var valueAxis = new AmCharts.ValueAxis();
    valueAxis.axisAlpha = 0;
    valueAxis.minimum = 0;
    valueAxis.maximum = 100;
    valueAxis.title = 'Mottak';
    valueAxis.position = 'left';
    chart.addValueAxis(valueAxis);

    //Line
    var graph = new AmCharts.AmGraph();
    graph.valueField = 'reception';
    graph.colorField = 'color';
    graph.lineAlpha = 0.2;
    graph.fillAlphas = 0.8;
    graph.type = 'column';
    graph.showBalloon = false;
    chart.addGraph(graph);

    chart.write(domElement);

    return chart;
}

var SatelliteReceptionChart = React.createClass({
    displayName: 'SatelliteReceptionChart',

    propTypes: {},

    componentDidMount: function componentDidMount() {
        var el = React.findDOMNode(this);
        initGraph(el);
    },

    render: function render() {
        return React.createElement('div', { className: this.props.className, style: this.props.style });
    }

});

var SatelliteTable = React.createClass({
    displayName: 'SatelliteTable',

    propTypes: {
        satellites: React.PropTypes.array.isRequired
    },

    render: function render() {

        return React.createElement(
            'table',
            { className: 'table table-bordered table-striped' + this.props.className },
            React.createElement(
                'thead',
                null,
                React.createElement(
                    'tr',
                    null,
                    React.createElement(
                        'th',
                        null,
                        'Satelitt'
                    ),
                    React.createElement(
                        'th',
                        null,
                        'Frekvensområde'
                    )
                )
            ),
            React.createElement(
                'tbody',
                null,
                this.props.satellites.map(function (sat, i) {
                    return React.createElement(
                        'tr',
                        { key: i },
                        React.createElement(
                            'td',
                            null,
                            sat.name
                        ),
                        React.createElement(
                            'td',
                            null,
                            sat.freq.min,
                            ' - ',
                            sat.freq.max
                        )
                    );
                })
            )
        );
    }

});

module.exports = React.createClass({
    displayName: 'exports',

    statics: {},

    propTypes: {},

    mixins: [],

    getInitialState: function getInitialState() {
        return this._getState();
    },
    componentWillMount: function componentWillMount() {},

    componentWillUnmount: function componentWillUnmount() {},

    _getState: function _getState() {
        return {};
    },

    render: function render() {

        return React.createElement(
            'div',
            { className: 'row' },
            React.createElement(SatelliteTable, { satellites: satellites, className: 'col-sm-6' }),
            React.createElement(SatelliteReceptionChart, { className: 'col-sm-6' })
        );
    }

});

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../actions/MissionActionCreators":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/actions/MissionActionCreators.js","../stores/oxygen-store":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/stores/oxygen-store.js","../utils":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/utils.js"}],"/Users/carl-erik.kopseng/dev_priv/Emissions/app/components/dialogs.react.js":[function(require,module,exports){
(function (global){
// needed to avoid compilation error
'use strict';

var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null);

module.exports = {
    science_intro: React.createElement(
        'div',
        null,
        React.createElement(
            'p',
            null,
            'Dere skal overvåke strålingsnivået astronatuen utsettes for. Dere må da passe på at astronauten ikke blir utsatt for strålingsnivåer som er skadelig.'
        ),
        React.createElement(
            'p',
            null,
            'Ved hjelp av instrumentene som er tilgjengelig må dere jevnlig ta prøver og regne ut verdiene for gjennomsnittlig og totalt strålingsnivå. Finner dere ut at nivåene er blitt farlig høye ',
            React.createElement(
                'em',
                null,
                'må'
            ),
            ' dere si fra til oppdragslederen så vi kan få ut astronauten!'
        ),
        React.createElement(
            'p',
            null,
            'Er oppdraget forstått?'
        )
    ),

    astronaut_intro: React.createElement(
        'div',
        null,
        React.createElement(
            'p',
            null,
            'Deres jobb er å sikre at det er nok oksygen for å gjennomføre oppdraget. Her er det viktig å jevnlig sjekke hvor fort astronaut Steigen puster og hvor fort hjertet hennes slår.'
        ),
        React.createElement(
            'p',
            null,
            'Finner dere ut at astronaut Steigen ikke vil ha nok luft til å gjennomføre oppdraget ',
            React.createElement(
                'em',
                null,
                'må'
            ),
            ' dere si fra til oppdragslederen så vi kan avbryte i tide.'
        )
    ),

    communication_intro: React.createElement(
        'div',
        null,
        React.createElement(
            'p',
            null,
            'Deres mål er å holde kommunikasjonen oppe, og kommunisere med oppdragskoordinator og astronauten. Om nødvendig må dere kanskje bytte til en annen kommunikasjonssatelitt.'
        ),
        React.createElement(
            'p',
            null,
            'Dere skal også informere astronauten om eventuelle beskjeder fra Andaøya Space Center (ASC), og likeledes informere ASC om hendelser eller beskjeder fra astronauten.'
        )
    ),

    security_intro: React.createElement(
        'div',
        null,
        React.createElement(
            'p',
            null,
            'Deres hovedoppgave er å innhente informasjon fra de forskjellige gruppene og bestemme dere for hva som skal gjøres. Her må dere samarbeide godt med oppdragskoordinatoren (',
            React.createElement(
                'em',
                null,
                'mission commander'
            ),
            ')!'
        ),
        React.createElement(
            'p',
            null,
            'Dere må også holde et øye på indikatoren som sier om det er nok luft til å gjennomføre oppdraget, samt sjekke om karbondioksidskrubberen må skiftes slik at astronauten ikke kveles.'
        ),
        React.createElement(
            'p',
            null,
            'Deres må også sjekke at kommunikasjonsstatusen og datakvaliteten er god når reparasjonen er utført.'
        )
    )

};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],"/Users/carl-erik.kopseng/dev_priv/Emissions/app/components/dummy-render.mixin.js":[function(require,module,exports){
'use strict';

module.exports = {
    render: function render() {
        throw new Error('DUMMY_RENDER. This react component is not for presentational purposes');
    }
};

},{}],"/Users/carl-erik.kopseng/dev_priv/Emissions/app/components/full-screen-video.js":[function(require,module,exports){
(function (global){
'use strict';

var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null);

var player;
function onYouTubeIframeAPIReady() {
    console.log('onYouTubeIframeAPIReady');
    player = new YT.Player('player', {
        events: {
            onReady: onPlayerReady
        }
    });
}

function playVideo() {
    player.seekTo(96);
    player.playVideo();

    // stop video after ten seconds
    setTimeout(function () {
        player.stopVideo(player);
        playVideo();
    }, 10000);
}

function onPlayerReady(event) {
    //event.target.mute();
    player.mute();
    playVideo();
}

window.onYouTubeIframeAPIReady = onYouTubeIframeAPIReady;

module.exports = React.createClass({
    displayName: 'exports',

    /* https://developers.google.com/youtube/iframe_api_reference#Getting_Started */
    componentDidMount: function componentDidMount() {
        console.log('componentDidMount');
        var tag = document.createElement('script');

        tag.src = 'https://www.youtube.com/iframe_api';
        document.head.appendChild(tag);
    },

    render: function render() {
        var rickRolled = 'http://www.youtube.com/embed/oHg5SJYRHA0?autoplay=1';
        var origin = location.protocol + '//' + location.host;
        var solarStorm = 'http://www.youtube.com/embed/DU4hpsistDk?&start=96&enablejsapi=1&origin=' + origin;
        var video = solarStorm;

        //return <div />
        return React.createElement('iframe', { id: 'player',
            style: { position: 'absolute', top: 0, right: 0, width: '100%', height: '100%' },
            src: video,
            frameBorder: '0', allowFullScreen: true });
    }

});

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],"/Users/carl-erik.kopseng/dev_priv/Emissions/app/components/header.react.js":[function(require,module,exports){
(function (global){
'use strict';

var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null);
var Router = (typeof window !== "undefined" ? window.ReactRouter : typeof global !== "undefined" ? global.ReactRouter : null);
var Link = Router.Link;

var Header = React.createClass({
    displayName: 'Header',

    render: function render() {
        return React.createElement(
            'div',
            null,
            React.createElement(
                'div',
                { className: 'row' },
                React.createElement(
                    'header',
                    { id: 'narom-header' },
                    React.createElement(
                        'div',
                        null,
                        React.createElement('img', { className: 'narom-logo-img', src: '/images/logo.png' }),
                        'NAROM e-Mission prototype'
                    )
                )
            ),
            React.createElement(
                'div',
                { id: 'main-header', className: 'row' },
                React.createElement(
                    Link,
                    { to: '/' },
                    React.createElement(
                        'header',
                        null,
                        React.createElement(
                            'h1',
                            { className: '' },
                            'Under en solstorm'
                        )
                    )
                )
            )
        );
    }
});

module.exports = Header;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],"/Users/carl-erik.kopseng/dev_priv/Emissions/app/components/heart-rate-chart.react.js":[function(require,module,exports){
(function (global){
/**
 * THIS DESIGN ONLY SUPPORTS ONE CHART AS THEY *SHARE* STATE
 * For a non-stupid design, do something like the
 * implementation in the article by Nicolas Hery:
 * http://nicolashery.com/integrating-d3js-visualizations-in-a-react-app
 *
 * Chart code more or less copied from the prototype by Leo Martin Westby
 */
'use strict';

var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null);
var AmCharts = (typeof window !== "undefined" ? window.AmCharts : typeof global !== "undefined" ? global.AmCharts : null);

var _require = require('../utils');

var randomInt = _require.randomInt;

var HeartStore = require('../stores/heart-rate-store');

var chart;
var heartRateSamples = [];

var heartRateBuffer;
var heartRateBufferIndex;
var msUntilNextHeartRateBufferFrame;

//Millivolts displayed on the Y axis of the ECG graph
var highMV = 1;
var lowMV = 0;

var chartUpdater;

function initChart(domElement) {

    chart = new AmCharts.AmSerialChart();

    chart.marginTop = 20;
    chart.marginRight = 10;
    chart.autoMarginOffset = 5;
    chart.dataProvider = heartRateSamples;
    chart.categoryField = 'timestamp';

    //X Axis
    var categoryAxis = chart.categoryAxis;
    categoryAxis.dashLength = 1;
    categoryAxis.gridAlpha = 0.1;
    categoryAxis.axisColor = '#DADADA';
    categoryAxis.forceShowField = 'forceShow';
    //categoryAxis.title = "Seconds";

    //Hide every label that is not explicitly shown
    categoryAxis.labelFunction = function (valueText, object) {
        if (object.forceShow) {
            return valueText;
        }
    };

    //Y Axis
    var valueAxis = new AmCharts.ValueAxis();
    valueAxis.axisAlpha = 0.2;
    valueAxis.dashLength = 1;
    valueAxis.minimum = lowMV;
    valueAxis.maximum = highMV * 1.1;
    valueAxis.title = 'mV';
    chart.addValueAxis(valueAxis);

    //Line
    var graph = new AmCharts.AmGraph();

    graph.valueField = 'mV';
    graph.type = 'smoothedLine';
    graph.lineThickness = 1;
    graph.lineColor = '#b5030d';
    chart.addGraph(graph);

    chart.write(domElement);
}

//Fills the heart rate buffer with samples from the specified range
//The heart rate buffer contains twice as many samples as the heart rate chart and is used to animate the chart
function createHeartRateSamples(min, max) {
    heartRateBuffer = [];
    heartRateBufferIndex = 0;
    msUntilNextHeartRateBufferFrame = 0;

    var beatsPerMinute = randomInt(min, max);
    var msBetweenBeats = 60 * 1000 / beatsPerMinute;
    var msUntilNextBeat = msBetweenBeats;

    for (var i = 0; i <= 200; i++) {
        var mV;

        if (msUntilNextBeat <= 0) {
            mV = highMV;
            msUntilNextBeat = msBetweenBeats;
        } else {
            mV = Math.random() * 0.2;
        }

        //The resolution of the chart is ten samples per second
        heartRateBuffer.push({ timestamp: i / 10, mV: mV });
        msUntilNextBeat -= 50;
    }
}

//Animates the  heart rate charts
function startEventLoop() {
    var startTime = Date.now();
    var msSinceLastUpdate = 0;
    var msSinceStart = 0;
    var updateFrequency = 400;
    stopEventLoop();

    chartUpdater = setInterval(function () {
        msSinceLastUpdate = Date.now() - startTime - msSinceStart;
        msUntilNextHeartRateBufferFrame -= msSinceLastUpdate;
        msSinceStart = Date.now() - startTime;

        if (msUntilNextHeartRateBufferFrame <= 0) {
            var framesMissed = Math.floor(msUntilNextHeartRateBufferFrame * -1 / 100 + 1);

            for (var i = 0; i < framesMissed; i++) {
                heartRateBufferIndex++;

                if (heartRateBufferIndex >= heartRateBuffer.length) {
                    heartRateBufferIndex = 0;
                }

                heartRateSamples.push(heartRateBuffer[heartRateBufferIndex]);

                //When the chart grows to 10 seconds, start cutting off the oldest sample to give the chart a sliding effect
                if (heartRateSamples.length > 100) {
                    heartRateSamples.shift();
                }
            }

            msUntilNextHeartRateBufferFrame = 100;
        }

        //Always show from 0 to 10 seconds on the X axis
        if (heartRateSamples.length >= 100) {
            for (var i = 0; i < heartRateSamples.length; i++) {
                heartRateSamples[i].timestamp = Math.floor(i / (heartRateSamples.length - 1) * 10);
            }
        }

        //Only show every 5th timestamp
        for (var i = 0; i < heartRateSamples.length; i++) {
            heartRateSamples[i].forceShow = heartRateSamples[i].timestamp % 5 == 0 && (i == 0 || heartRateSamples[i - 1].timestamp % 5 != 0);
        }

        chart.validateData();
    }, updateFrequency);
}

function stopEventLoop() {
    clearInterval(chartUpdater);
    heartRateSamples.length = 0;
    chart.validateData();
}

var HeartRateChart = React.createClass({
    displayName: 'HeartRateChart',

    statics: {},

    propTypes: {
        height: React.PropTypes.number.isRequired,
        width: React.PropTypes.number
    },

    mixins: [],

    getInitialState: function getInitialState() {
        return this._getChartState();
    },

    componentWillMount: function componentWillMount() {
        var _this = this;

        this._updateChart();
        HeartStore.addChangeListener(function () {
            return _this._updateChart();
        });
    },

    componentDidMount: function componentDidMount() {
        var el = React.findDOMNode(this);
        initChart(el);
        startEventLoop();
    },

    componentWillReceiveProps: function componentWillReceiveProps() {},

    componentWillUnmount: function componentWillUnmount() {
        chart && chart.clear();
        stopEventLoop();
    },

    componentDidUnmount: function componentDidUnmount() {
        chart = null;
    },

    componentDidUpdate: function componentDidUpdate() {},

    // this chart is responsible for drawing itself
    shouldComponentUpdate: function shouldComponentUpdate() {
        return false;
    },

    // Private methods
    _updateChart: function _updateChart() {
        this.setState(this._getChartState());
        createHeartRateSamples(this.state.min, this.state.max);
    },

    _getChartState: function _getChartState() {
        return HeartStore.getState();
    },

    _onChange: function _onChange() {},

    render: function render() {

        // if you don't specify width it will max out to 100% (which is ok)
        return React.createElement('div', {
            style: { width: this.props.width + 'px', height: this.props.height + 'px' },
            className: this.props.className
        });
    }

});

module.exports = HeartRateChart;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../stores/heart-rate-store":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/stores/heart-rate-store.js","../utils":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/utils.js"}],"/Users/carl-erik.kopseng/dev_priv/Emissions/app/components/index-app.react.js":[function(require,module,exports){
(function (global){
'use strict';

var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null);
var Router = (typeof window !== "undefined" ? window.ReactRouter : typeof global !== "undefined" ? global.ReactRouter : null);
var Link = Router.Link;

module.exports = React.createClass({
    displayName: 'exports',

    render: function render() {
        return React.createElement(
            'div',
            null,
            React.createElement(
                'h3',
                null,
                'Velg lag'
            ),
            React.createElement(
                'ul',
                null,
                React.createElement(
                    'li',
                    null,
                    React.createElement(
                        Link,
                        { to: 'team-root', params: { teamId: 'science' } },
                        'Forskningsgruppa'
                    )
                ),
                React.createElement(
                    'li',
                    null,
                    React.createElement(
                        Link,
                        { to: 'team-root', params: { teamId: 'astronaut' } },
                        'Astronautgruppa'
                    )
                ),
                React.createElement(
                    'li',
                    null,
                    React.createElement(
                        Link,
                        { to: 'team-root', params: { teamId: 'security' } },
                        'Sikkerhetsgruppa'
                    )
                ),
                React.createElement(
                    'li',
                    null,
                    React.createElement(
                        Link,
                        { to: 'team-root', params: { teamId: 'communication' } },
                        'Kommunikasjonsgruppa'
                    )
                )
            )
        );
    }
});

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],"/Users/carl-erik.kopseng/dev_priv/Emissions/app/components/introduction-screen.react.js":[function(require,module,exports){
(function (global){
'use strict';

var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null);
var dialogs = require('./dialogs.react');

var _require = require('../utils');

var cleanRootPath = _require.cleanRootPath;

var RouteStore = require('../stores/route-store');
var IntroStore = require('../stores/introduction-store');

var IntroductionScreen = React.createClass({
    displayName: 'IntroductionScreen',

    mixins: [],

    contextTypes: {
        router: React.PropTypes.func
    },

    statics: {
        willTransitionTo: function willTransitionTo(transition) {
            var teamId = cleanRootPath(transition.path);

            if (IntroStore.isIntroductionRead(teamId)) {
                console.log('Introduction read earlier');
                transition.redirect('team-task', { taskId: 'sample', teamId: teamId });
            }
        }
    },

    _handleClick: function _handleClick() {
        var MissionActionCreators = require('../actions/MissionActionCreators');

        var teamId = RouteStore.getTeamId();
        MissionActionCreators.introWasRead(teamId);
        this.context.router.transitionTo('team-task', { taskId: 'sample', teamId: teamId });
    },

    render: function render() {
        var teamId = RouteStore.getTeamId();
        var introText = dialogs[teamId + '_intro'] || React.createElement(
            'p',
            null,
            'Mangler oppdrag'
        );

        return React.createElement(
            'div',
            { className: 'row jumbotron introscreen' },
            React.createElement(
                'h2',
                null,
                'Mål for oppdraget'
            ),
            introText,
            React.createElement(
                'button',
                {
                    className: 'btn btn-primary btn-lg',
                    onClick: this._handleClick
                },
                'Jeg forstår'
            )
        );
    }
});

module.exports = IntroductionScreen;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../actions/MissionActionCreators":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/actions/MissionActionCreators.js","../stores/introduction-store":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/stores/introduction-store.js","../stores/route-store":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/stores/route-store.js","../utils":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/utils.js","./dialogs.react":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/components/dialogs.react.js"}],"/Users/carl-erik.kopseng/dev_priv/Emissions/app/components/message-list.react.js":[function(require,module,exports){
(function (global){
'use strict';

var _extends = require('babel-runtime/helpers/extends')['default'];

var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null);
var actions = require('../actions/MessageActionCreators');

var ListMessageWrapper = React.createClass({
    displayName: 'ListMessageWrapper',

    propTypes: {
        level: React.PropTypes.string.isRequired,
        text: React.PropTypes.string.isRequired,
        id: React.PropTypes.string.isRequired
    },

    render: function render() {
        var _this = this;

        var button = undefined;

        if (this.props.dismissable) {
            button = React.createElement(
                'button',
                {
                    type: 'button',
                    className: 'close',
                    onClick: function () {
                        return actions.removeMessage(_this.props.id);
                    }
                },
                React.createElement(
                    'span',
                    null,
                    '×'
                )
            );
        }

        return React.createElement(
            'li',
            { className: 'alert alert-dismissible alert-' + this.props.level },
            button,
            this.props.text
        );
    }
});

var MessageList = React.createClass({
    displayName: 'MessageList',

    render: function render() {
        var hidden = this.props.messages.length === 0 ? 'hide' : '';
        var classes = (this.props.className || '') + ' messagebox ' + hidden;

        return React.createElement(
            'ul',
            { className: classes },
            this.props.messages.map(function (msg) {
                return React.createElement(ListMessageWrapper, _extends({ key: msg.id }, msg));
            })
        );
    }

});

module.exports = MessageList;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../actions/MessageActionCreators":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/actions/MessageActionCreators.js","babel-runtime/helpers/extends":"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/babel-runtime/helpers/extends.js"}],"/Users/carl-erik.kopseng/dev_priv/Emissions/app/components/mission-commander.react.js":[function(require,module,exports){
(function (global){
'use strict';

var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null);
var Link = (typeof window !== "undefined" ? window.ReactRouter : typeof global !== "undefined" ? global.ReactRouter : null).Link;
var MissionStore = require('../stores/mission-state-store');
var MissionTimer = require('./mission-timer.react');
var EventStore = require('../stores/event-store');
var utils = require('../utils');
var getMissionAC = (function () {
    var tmp = null;
    return function () {
        if (!tmp) tmp = require('../actions/MissionActionCreators');
        return tmp;
    };
})();

var EventTable = React.createClass({
    displayName: 'EventTable',

    propTypes: {
        events: React.PropTypes.array.isRequired,
        triggerDisabled: React.PropTypes.bool
    },

    render: function render() {
        var _this = this;

        return React.createElement(
            'table',
            { className: 'table' },
            React.createElement(
                'thead',
                null,
                React.createElement(
                    'tr',
                    null,
                    React.createElement(
                        'th',
                        null,
                        'Time'
                    ),
                    React.createElement(
                        'th',
                        null,
                        'Description'
                    ),
                    React.createElement(
                        'th',
                        null,
                        'Value'
                    ),
                    React.createElement(
                        'th',
                        null,
                        'Trigger'
                    )
                )
            ),
            React.createElement(
                'tbody',
                null,
                this.props.events.map(function (ev) {
                    return React.createElement(
                        'tr',
                        { key: ev.id },
                        React.createElement(
                            'td',
                            null,
                            ev.triggerTime
                        ),
                        React.createElement(
                            'td',
                            null,
                            ev.short_description
                        ),
                        React.createElement(
                            'td',
                            null,
                            JSON.stringify(ev.value || '')
                        ),
                        React.createElement(
                            'td',
                            null,
                            React.createElement(
                                'button',
                                { className: 'btn btn-primary ' + (_this.props.triggerDisabled && 'disabled'),
                                    onClick: function () {
                                        return getMissionAC().askToTriggerEvent(ev.id);
                                    }
                                },
                                'Trigger'
                            )
                        )
                    );
                })
            )
        );
    }
});

var App = React.createClass({
    displayName: 'App',

    componentWillMount: function componentWillMount() {
        var ac = getMissionAC();
        ac.askForEvents();

        EventStore.addChangeListener(this._onChange);
        MissionStore.addChangeListener(this._onChange);
    },

    componentDidMount: function componentDidMount() {
        var _this2 = this;

        this._interval = setInterval(function () {
            _this2.setState({ chapterTime: _this2.state.chapterTime + 1 });
        }, 1000);
    },

    componentWillUnmount: function componentWillUnmount() {
        clearInterval(this._interval);
        EventStore.removeChangeListener(this._onChange);
        MissionStore.removeChangeListener(this._onChange);
    },

    getInitialState: function getInitialState() {
        return {
            completedEvents: [],
            overdueEvents: [],
            remainingEvents: [],
            running: MissionStore.isMissionRunning(),
            chapter: MissionStore.currentChapter(),
            chapterTime: MissionStore.chapterTime()
        };
    },

    _onChange: function _onChange() {
        this.setState({
            completedEvents: EventStore.completed(),
            overdueEvents: EventStore.overdue(),
            remainingEvents: EventStore.remaining(),
            running: MissionStore.isMissionRunning(),
            chapter: MissionStore.currentChapter(),
            chapterTime: MissionStore.chapterTime()
        });
    },

    render: function render() {

        var status;

        if (!this.state.running) {
            status = React.createElement(
                'p',
                { id: 'missionTime' },
                'Oppdraget har ikke startet'
            );
        }

        return React.createElement(
            'div',
            null,
            React.createElement(
                'div',
                null,
                React.createElement(
                    'h3',
                    null,
                    'Status'
                ),
                status,
                React.createElement(
                    'dl',
                    null,
                    React.createElement(
                        'dt',
                        null,
                        'Nåværende kapittel:'
                    ),
                    React.createElement(
                        'dd',
                        null,
                        this.state.chapter
                    ),
                    React.createElement(
                        'dt',
                        null,
                        'Tid brukt i kapittel'
                    ),
                    React.createElement(
                        'dd',
                        null,
                        this.state.chapterTime
                    ),
                    React.createElement(
                        'dt',
                        null,
                        'Total tid'
                    ),
                    React.createElement(
                        'dd',
                        null,
                        React.createElement(MissionTimer, null)
                    )
                )
            ),
            React.createElement(
                'div',
                null,
                React.createElement(
                    'button',
                    { className: 'btn btn-primary', onClick: getMissionAC().startMission },
                    'Start oppdrag'
                ),
                React.createElement(
                    'button',
                    { className: 'btn btn-primary', onClick: getMissionAC().stopMission },
                    'Stop'
                ),
                React.createElement(
                    'button',
                    { className: 'btn btn-primary', onClick: getMissionAC().askToStartNextChapter },
                    'Neste kapittel'
                ),
                React.createElement(
                    'button',
                    { className: 'btn btn-primary', onClick: getMissionAC().resetMission },
                    'Begynn på nytt'
                )
            ),
            React.createElement(
                'button',
                { className: 'btn btn-primary', onClick: getMissionAC().completeMission },
                'Oppdrag utført'
            ),
            React.createElement(
                'h2',
                null,
                'Chapter events'
            ),
            React.createElement(
                'h3',
                null,
                'remaining'
            ),
            React.createElement(EventTable, { key: 'foo', events: this.state.remainingEvents }),
            React.createElement(
                'h3',
                null,
                'overdue'
            ),
            React.createElement(EventTable, { events: this.state.overdueEvents }),
            React.createElement(
                'h3',
                null,
                'completed'
            ),
            React.createElement(EventTable, { triggerDisabled: true, events: this.state.completedEvents })
        );
    }

});

module.exports = App;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../actions/MissionActionCreators":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/actions/MissionActionCreators.js","../stores/event-store":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/stores/event-store.js","../stores/mission-state-store":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/stores/mission-state-store.js","../utils":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/utils.js","./mission-timer.react":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/components/mission-timer.react.js"}],"/Users/carl-erik.kopseng/dev_priv/Emissions/app/components/mission-timer.react.js":[function(require,module,exports){
(function (global){
'use strict';

var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null),
    TimerStore = require('../stores/timer-store'),
    Timer = require('./timer.react');

var MissionTimer = React.createClass({
    displayName: 'MissionTimer',

    getInitialState: function getInitialState() {
        return { elapsed: TimerStore.getElapsedMissionTime() };
    },

    componentDidMount: function componentDidMount() {
        TimerStore.addChangeListener(this._handleTimeChange);
    },

    componentWillUnmount: function componentWillUnmount() {
        TimerStore.removeChangeListener(this._handleTimeChange);
    },

    _handleTimeChange: function _handleTimeChange() {
        this.setState({
            elapsed: TimerStore.getElapsedMissionTime()
        });
    },

    render: function render() {
        return React.createElement(Timer, { className: this.props.className, timeInSeconds: this.state.elapsed });
    }
});

module.exports = MissionTimer;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../stores/timer-store":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/stores/timer-store.js","./timer.react":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/components/timer.react.js"}],"/Users/carl-erik.kopseng/dev_priv/Emissions/app/components/not-found.react.js":[function(require,module,exports){
(function (global){
'use strict';

var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null);

var NotFound = React.createClass({
    displayName: 'NotFound',

    render: function render() {
        return React.createElement(
            'div',
            { className: 'container' },
            React.createElement(
                'div',
                { className: 'row jumbotron' },
                React.createElement(
                    'div',
                    null,
                    'Ojsann. Tror du har gått deg vill, jeg'
                )
            )
        );
    }
});

module.exports = NotFound;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],"/Users/carl-erik.kopseng/dev_priv/Emissions/app/components/overlay.react.js":[function(require,module,exports){
(function (global){
/*
 * Simple component that overlays a section, signalling a disabled state
 *
 * Dependant on working CSS, of course: the parent must be positioned (relative, absolute, ...)
 * Loosely based http://stackoverflow.com/questions/3627283/how-to-dim-other-div-on-clicking-input-box-using-jquery
 */
"use strict";

var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null);

module.exports = React.createClass({
    displayName: "exports",

    propTypes: {
        active: React.PropTypes.bool.isRequired
    },

    render: function render() {
        return this.props.active ? React.createElement("div", { className: "overlay" }) : null;
    }

});

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],"/Users/carl-erik.kopseng/dev_priv/Emissions/app/components/radiation-chart.react.js":[function(require,module,exports){
(function (global){
/**
 * THIS DESIGN ONLY SUPPORTS ONE CHART AS THEY *SHARE* STATE
 * For a non-stupid design, do something like the
 * implementation in the article by Nicolas Hery:
 * http://nicolashery.com/integrating-d3js-visualizations-in-a-react-app
 *
 * Chart code more or less copied from the prototype by Leo Martin Westby
 */
'use strict';

var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null);
var AmCharts = (typeof window !== "undefined" ? window.AmCharts : typeof global !== "undefined" ? global.AmCharts : null);
var constants = require('../constants/ScienceTeamConstants');

var chart, chartUpdater, getNewValue, updateFrequency, maxSeconds;
var radiationSamples = [];

var _require = require('../utils');

var randomInt = _require.randomInt;

function initChart(domElement) {

    chart = new AmCharts.AmSerialChart();

    chart.marginTop = 20;
    chart.marginRight = 0;
    chart.marginLeft = 0;
    chart.autoMarginOffset = 0;
    chart.dataProvider = radiationSamples;
    chart.categoryField = 'timestamp';

    //X axis
    var categoryAxis = chart.categoryAxis;
    categoryAxis.dashLength = 1;
    categoryAxis.gridAlpha = 0.15;
    categoryAxis.axisColor = '#DADADA';
    categoryAxis.title = 'Seconds';

    //Y axis
    var valueAxis = new AmCharts.ValueAxis();
    valueAxis.axisAlpha = 0.2;
    valueAxis.dashLength = 1;
    valueAxis.title = 'μSv/h';
    valueAxis.minimum = constants.SCIENCE_RADIATION_MIN;
    valueAxis.maximum = constants.SCIENCE_RADIATION_MAX;
    chart.addValueAxis(valueAxis);

    //Line
    var graph = new AmCharts.AmGraph();
    graph.valueField = 'radiation';
    graph.bullet = 'round';
    graph.bulletBorderColor = '#FFFFFF';
    graph.bulletBorderThickness = 2;
    graph.lineThickness = 2;
    graph.lineColor = '#b5030d';
    graph.negativeLineColor = '#228B22';
    graph.negativeBase = 60;
    graph.hideBulletsCount = 50;
    chart.addGraph(graph);

    //Mouseover
    var chartCursor = new AmCharts.ChartCursor();
    chartCursor.cursorPosition = 'mouse';
    chart.addChartCursor(chartCursor);
    chart.write(domElement);
}

//Adds a new radiation sample to the chart every few seconds
function startEventLoop() {
    var startTime = Date.now();
    stopEventLoop();

    chartUpdater = setInterval(function () {
        var secondsPassed = (Date.now() - startTime) / 1000;

        radiationSamples.push({
            timestamp: Math.floor(secondsPassed + 0.5),
            radiation: getNewValue()
        });

        //When the chart grows, start cutting off the oldest sample to give the chart a sliding effect
        if (radiationSamples.length > maxSeconds / updateFrequency) {
            radiationSamples.shift();
        }

        chart.validateData();
    }, updateFrequency * 1000);
}

function stopEventLoop() {
    clearInterval(chartUpdater);
}

var RadiationChart = React.createClass({
    displayName: 'RadiationChart',

    statics: {},

    propTypes: {
        updateFrequencySeconds: React.PropTypes.number.isRequired,
        maxSecondsShown: React.PropTypes.number.isRequired,
        getNewValue: React.PropTypes.func.isRequired,
        height: React.PropTypes.number.isRequired,
        width: React.PropTypes.number
    },

    mixins: [],

    componentWillMount: function componentWillMount() {
        updateFrequency = this.props.updateFrequencySeconds;
        maxSeconds = this.props.maxSecondsShown;
        getNewValue = this.props.getNewValue;
    },

    componentDidMount: function componentDidMount() {
        var el = React.findDOMNode(this);
        initChart(el);
        startEventLoop();
    },

    componentWillReceiveProps: function componentWillReceiveProps() {},

    componentWillUnmount: function componentWillUnmount() {
        chart && chart.clear();
        stopEventLoop();
    },

    componentDidUnmount: function componentDidUnmount() {
        chart = null;
        //radiationSamples.length = 0;
    },

    componentDidUpdate: function componentDidUpdate() {},

    // this chart is responsible for drawing itself
    shouldComponentUpdate: function shouldComponentUpdate() {
        return false;
    },

    // Private methods

    render: function render() {

        // if you don't specify width it will max out to 100% (which is ok)
        return React.createElement('div', {
            style: { width: this.props.width + 'px', height: this.props.height + 'px' },
            className: this.props.className
        });
    }

});

module.exports = RadiationChart;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../constants/ScienceTeamConstants":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/constants/ScienceTeamConstants.js","../utils":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/utils.js"}],"/Users/carl-erik.kopseng/dev_priv/Emissions/app/components/radiation-sampler.react.js":[function(require,module,exports){
(function (global){
'use strict';

var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null),
    TimerStore = require('../stores/timer-store'),
    MissionActionCreators = require('../actions/MissionActionCreators'),
    TimerActionCreators = require('../actions/TimerActionCreators'),
    ScienceActionCreators = require('../actions/ScienceActionCreators'),
    constants = require('../constants/ScienceTeamConstants');

var RadiationSampler = React.createClass({
    displayName: 'RadiationSampler',

    propTypes: {
        requiredSamples: React.PropTypes.number.isRequired,
        radiationStoreState: React.PropTypes.object.isRequired
    },

    componentWillMount: function componentWillMount() {
        TimerStore.addChangeListener(this._handleTimerChange);
    },

    componentDidUpdate: function componentDidUpdate() {
        if (this.state.timerActive) {
            var el = React.findDOMNode(this.refs['sample-button']);
            el.focus();
        }
    },

    componentWillUnmount: function componentWillUnmount() {
        TimerStore.removeChangeListener(this._handleTimerChange);
    },

    getInitialState: function getInitialState() {
        return { timerActive: false };
    },

    _isDisabled: function _isDisabled() {
        return !this.state.timerActive;
    },

    _handleTimerChange: function _handleTimerChange() {
        var audio = React.findDOMNode(this.refs.geigerSound);
        var timerActive = TimerStore.isRunning(constants.SCIENCE_TIMER_1);

        this.setState({ timerActive: timerActive });

        if (timerActive && audio.paused) {
            audio.play();
        } else if (!timerActive && !audio.paused) {
            audio.pause();
        }
    },

    _handleClick: function _handleClick() {
        ScienceActionCreators.takeRadiationSample();

        if (this.props.radiationStoreState.samples.length + 1 >= this.props.requiredSamples) {
            TimerActionCreators.stopTimer(constants.SCIENCE_TIMER_1);
            ScienceActionCreators.completeTask('sample');
        }
    },

    render: function render() {
        var disabled, classes;

        classes = 'btn btn-primary';

        if (this._isDisabled()) {
            classes += ' disabled';
        }

        return React.createElement(
            'section',
            { className: 'radiation-sampler ' + this.props.className },
            React.createElement('div', { className: 'radiation-sampler__padder clearfix visible-xs-block' }),
            React.createElement(
                'audio',
                { ref: 'geigerSound', loop: true },
                React.createElement('source', { src: '/sounds/AOS04595_Electric_Geiger_Counter_Fast.wav', type: 'audio/wav' })
            ),
            React.createElement(
                'div',
                null,
                React.createElement(
                    'button',
                    {
                        ref: 'sample-button',
                        className: classes,
                        onClick: this._handleClick
                    },
                    'Ta strålingsprøve'
                )
            )
        );
    }

});

module.exports = RadiationSampler;
/* Avoid floating into previous block */

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../actions/MissionActionCreators":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/actions/MissionActionCreators.js","../actions/ScienceActionCreators":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/actions/ScienceActionCreators.js","../actions/TimerActionCreators":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/actions/TimerActionCreators.js","../constants/ScienceTeamConstants":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/constants/ScienceTeamConstants.js","../stores/timer-store":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/stores/timer-store.js"}],"/Users/carl-erik.kopseng/dev_priv/Emissions/app/components/radiation-table.react.js":[function(require,module,exports){
(function (global){
"use strict";

var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null);

module.exports = React.createClass({
    displayName: "exports",

    statics: {},
    propTypes: {
        samples: React.PropTypes.array.isRequired,
        minimalRowsToShow: React.PropTypes.number
    },

    // Private methods

    getDefaultProps: function getDefaultProps() {
        return { minimalRowsToShow: 0 };
    },

    render: function render() {
        var sampleRows = this.props.samples.map(function (val, i) {
            return React.createElement(
                "tr",
                { key: i },
                React.createElement(
                    "th",
                    { scope: "row" },
                    i + 1
                ),
                React.createElement(
                    "td",
                    null,
                    val
                )
            );
        }),
            missingRows = this.props.minimalRowsToShow - sampleRows.length,
            fillRows = undefined;

        if (missingRows > 0) {
            fillRows = [];

            while (missingRows--) {
                fillRows.push(React.createElement(
                    "tr",
                    { key: fillRows.length },
                    React.createElement("th", { scope: "row" }),
                    React.createElement(
                        "td",
                        null,
                        " "
                    )
                ));
            }
        }

        return React.createElement(
            "div",
            { className: this.props.className },
            React.createElement(
                "h3",
                null,
                "Prøveresultater"
            ),
            React.createElement(
                "table",
                { className: " table table-bordered" },
                React.createElement(
                    "caption",
                    null,
                    "Strålingspartikler per sekund (p/s)"
                ),
                React.createElement(
                    "thead",
                    null,
                    React.createElement(
                        "tr",
                        null,
                        React.createElement(
                            "th",
                            { scope: "col" },
                            "Prøvenummer"
                        ),
                        React.createElement(
                            "th",
                            { scope: "col" },
                            "p/s"
                        )
                    )
                ),
                React.createElement(
                    "tbody",
                    null,
                    sampleRows,
                    fillRows
                )
            )
        );
    }

});
/* Needs filler to not collapse cell */

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],"/Users/carl-erik.kopseng/dev_priv/Emissions/app/components/science-task.react.js":[function(require,module,exports){
(function (global){
'use strict';

var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null);
var TimerPanel = require('./timer-panel.react');
var RadiationChart = require('./radiation-chart.react.js');
var RadiationSampleButton = require('./radiation-sampler.react');
var Overlay = require('./overlay.react');
var RadiationTable = require('./radiation-table.react');
var RadiationStore = require('../stores/radiation-store');
var actions = require('../actions/ScienceActionCreators');
var utils = require('../utils');
var ScienceTeamConstants = require('../constants/ScienceTeamConstants');
var TimerActionCreators = require('../actions/TimerActionCreators');

// SETTINGS
TimerActionCreators.setTimer(ScienceTeamConstants.SCIENCE_TIMER_1, 30);

module.exports = React.createClass({
    displayName: 'exports',

    statics: {},
    propTypes: {
        appstate: React.PropTypes.object.isRequired
    },
    mixins: [],

    // life cycle methods
    getInitialState: function getInitialState() {
        return {
            radiation: RadiationStore.getState()
        };
    },

    getDefaultProps: function getDefaultProps() {
        return {};
    },

    componentWillMount: function componentWillMount() {
        RadiationStore.addChangeListener(this._handleRadiationChange);
    },

    componentWillReceiveProps: function componentWillReceiveProps() {},

    componentWillUnmount: function componentWillUnmount() {
        RadiationStore.removeChangeListener(this._handleRadiationChange);
    },

    // Private methods

    _handleRadiationChange: function _handleRadiationChange() {
        this.setState({
            radiation: RadiationStore.getState()
        });
    },

    _handleAverageRadiationSubmit: function _handleAverageRadiationSubmit(e) {
        var el = React.findDOMNode(this.refs['average-input']),
            val = el.value.trim();

        e.preventDefault();

        if (!val.length) {
            return;
        }var average = utils.parseNumber(val);
        el.value = '';

        if (average) {
            actions.averageRadiationCalculated(average);
        }
    },

    _handleAddToTotalSubmit: function _handleAddToTotalSubmit(e) {
        e.preventDefault();

        var el = React.findDOMNode(this.refs['add-to-total']);
        var val = el.value.trim();
        if (!val.length) {
            return;
        }var number = utils.parseNumber(val);

        if (!isNaN(number)) {
            actions.addToTotalRadiationLevel(number);
        }
    },

    /*
     * Helper
     * @param {string} taskName name
     * @returns {boolean} true if the current task id equals the name passed in
     */
    _isCurrentTask: function _isCurrentTask(taskName) {
        return this.props.appstate.taskStore.currentTaskId === taskName;
    },

    _radiationStatus: function _radiationStatus() {
        var num = this.state.radiation.lastCalculatedAverage,
            color;

        if (num === null) {
            return 'Ikke beregnet';
        }

        if (num > ScienceTeamConstants.SCIENCE_AVG_RAD_RED_THRESHOLD) {
            color = 'red';
        } else if (num > ScienceTeamConstants.SCIENCE_AVG_RAD_ORANGE_THRESHOLD) {
            color = 'orange';
        } else {
            color = 'green';
        }

        return React.createElement(
            'div',
            {
                className: 'radiation-indicator circle col-xs-2',
                style: { backgroundColor: color }
            },
            num
        );
    },

    render: function render() {
        var showSampleInput = this._isCurrentTask('sample'),
            showAverageInput = this._isCurrentTask('average'),
            showAddToTotalInput = this._isCurrentTask('addtotal');

        return React.createElement(
            'div',
            null,
            React.createElement(
                'div',
                { className: 'row' },
                React.createElement(
                    'dl',
                    { className: 'radiation-values col-xs-6 ' },
                    React.createElement(
                        'dt',
                        null,
                        'Totalt strålingsnivå'
                    ),
                    React.createElement(
                        'dd',
                        null,
                        this.state.radiation.total
                    ),
                    React.createElement(
                        'dt',
                        null,
                        'Sist innlest strålingsnivå'
                    ),
                    React.createElement(
                        'dd',
                        null,
                        this._radiationStatus(),
                        ' '
                    )
                ),
                React.createElement(RadiationTable, {
                    minimalRowsToShow: 4,
                    samples: this.state.radiation.samples,
                    className: 'col-xs-6 ' })
            ),
            React.createElement('hr', null),
            React.createElement(
                'div',
                { className: 'instruments' },
                React.createElement(
                    'fieldset',
                    { disabled: !showSampleInput, className: 'instruments__section row overlayable' },
                    React.createElement(Overlay, { active: !showSampleInput }),
                    React.createElement(
                        'h3',
                        { className: 'col-xs-12' },
                        'Ta prøver'
                    ),
                    React.createElement(TimerPanel, { className: 'col-xs-12 col-sm-8', timerId: ScienceTeamConstants.SCIENCE_TIMER_1 }),
                    React.createElement(RadiationSampleButton, {
                        className: 'col-xs-5 col-sm-4',
                        radiationStoreState: this.state.radiation,
                        requiredSamples: 4
                    })
                ),
                React.createElement('hr', null),
                React.createElement(
                    'div',
                    { className: 'row overlayable' },
                    React.createElement(Overlay, { active: !showAverageInput }),
                    React.createElement(
                        'section',
                        { className: 'radiation-input instruments__section col-xs-12 col-sm-6' },
                        React.createElement(
                            'div',
                            { className: 'row' },
                            React.createElement(
                                'h3',
                                { className: 'col-xs-12' },
                                'Gjennomsnittlig stråling'
                            ),
                            React.createElement(
                                'fieldset',
                                { className: 'col-xs-8', disabled: !showAverageInput },
                                React.createElement(
                                    'form',
                                    { onSubmit: this._handleAverageRadiationSubmit },
                                    React.createElement('input', { ref: 'average-input',
                                        type: 'number',
                                        step: '0.1',
                                        min: '1',
                                        max: '100',
                                        className: 'radiation-input__input'
                                    }),
                                    React.createElement(
                                        'button',
                                        { className: 'btn btn-primary' },
                                        'Evaluer'
                                    )
                                )
                            )
                        )
                    )
                ),
                React.createElement('hr', null),
                React.createElement(
                    'div',
                    { className: 'row overlayable' },
                    React.createElement(Overlay, { active: !showAddToTotalInput }),
                    React.createElement(
                        'fieldset',
                        { className: 'radiation-input col-xs-8', disabled: !showAddToTotalInput },
                        React.createElement(
                            'h3',
                            null,
                            'Legg verdi til total'
                        ),
                        React.createElement(
                            'form',
                            { onSubmit: this._handleAddToTotalSubmit },
                            React.createElement(
                                'select',
                                { ref: 'add-to-total', className: 'radiation-input__input' },
                                React.createElement(
                                    'option',
                                    { value: '0' },
                                    '0'
                                ),
                                React.createElement(
                                    'option',
                                    { value: '15' },
                                    '15'
                                ),
                                React.createElement(
                                    'option',
                                    { value: '50' },
                                    '50'
                                )
                            ),
                            React.createElement(
                                'button',
                                { className: 'btn btn-primary' },
                                'Evaluer'
                            )
                        )
                    )
                )
            )
        );
    }

});

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../actions/ScienceActionCreators":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/actions/ScienceActionCreators.js","../actions/TimerActionCreators":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/actions/TimerActionCreators.js","../constants/ScienceTeamConstants":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/constants/ScienceTeamConstants.js","../stores/radiation-store":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/stores/radiation-store.js","../utils":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/utils.js","./overlay.react":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/components/overlay.react.js","./radiation-chart.react.js":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/components/radiation-chart.react.js","./radiation-sampler.react":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/components/radiation-sampler.react.js","./radiation-table.react":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/components/radiation-table.react.js","./timer-panel.react":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/components/timer-panel.react.js"}],"/Users/carl-erik.kopseng/dev_priv/Emissions/app/components/security-task.react.js":[function(require,module,exports){
(function (global){
'use strict';

var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null);
var CO2Store = require('../stores/carbon-dioxide-store');
var OxygenStore = require('../stores/oxygen-store');
var CommunicationQualityStore = require('../stores/communication-quality-store');
var MessageActionCreators = require('../actions/MessageActionCreators');

var chart = null;
var chartData = [{ title: 'Luft', value: 100 }];

function init(domElem) {
    chart = new AmCharts.AmPieChart();
    chart.valueField = 'value';
    chart.titleField = 'title';
    chart.dataProvider = chartData;
    chart.write(domElem);
}

var PieChart = React.createClass({
    displayName: 'PieChart',

    propTypes: {
        height: React.PropTypes.string.isRequired,
        width: React.PropTypes.string
    },

    componentWillMount: function componentWillMount() {
        var _this = this;

        CO2Store.addChangeListener(function () {
            return _this._updateData();
        });
    },

    componentDidMount: function componentDidMount() {
        var el = React.findDOMNode(this);
        init(el);
    },

    shouldComponentUpdate: function shouldComponentUpdate() {
        return false;
    },

    _updateData: function _updateData() {
        var co2 = CO2Store.co2Level();
        chartData.length = 0;
        chartData.push({ title: 'Annen luft', value: 100 - co2 });
        chartData.push({ title: 'CO₂', value: co2 });

        chart.validateData();
    },

    render: function render() {
        return React.createElement('div', { style: { height: this.props.height, width: this.props.width } });
    }
});

var ProgressBar = React.createClass({
    displayName: 'ProgressBar',

    propTypes: {
        progress: React.PropTypes.number.isRequired,
        max: React.PropTypes.number.isRequired,
        active: React.PropTypes.bool.isRequired,
        className: React.PropTypes.string
    },

    render: function render() {
        var val = this.props.progress,
            max = this.props.max;
        return React.createElement(
            'div',
            { className: 'progress' },
            React.createElement(
                'div',
                {
                    className: 'progress-bar progress-bar-striped ' + this.props.className + (this.props.active ? ' active' : ''),
                    style: { width: val * max + '%' },
                    role: 'progressbar' },
                Math.min(Math.round(val * max), max),
                '%'
            )
        );
    }
});

module.exports = React.createClass({
    displayName: 'exports',

    statics: {},

    propTypes: {},

    mixins: [],

    getInitialState: function getInitialState() {
        var state = this._getState();
        state.commProgress = 0;
        state.qualityProgress = 0;
        state.dataQualityFailing = true;
        return state;
    },

    componentWillMount: function componentWillMount() {
        var _this2 = this;

        OxygenStore.addChangeListener(function () {
            return _this2._updateState();
        });
    },

    componentWillUnmount: function componentWillUnmount() {},

    _startQualityProgressBar: function _startQualityProgressBar() {
        var _this3 = this;

        var ms = 300,
            totalDuration = 5 * 1000;
        this.setState({ qualityProgress: 0 });

        var tmp = setInterval(function () {
            var number = _this3.state.qualityProgress;
            number += ms / totalDuration;

            if (number > 0.99) {
                clearInterval(tmp);
                if (_this3.state.dataQualityFailing) {
                    MessageActionCreators.addMessage({
                        text: 'Kvaliteten på kommunikasjonssignalet er for dårlig. Er reparasjonen fullført?',
                        level: 'warning',
                        duration: 10
                    });
                }
            }
            _this3.setState({ qualityProgress: number });
        }, ms);
    },

    _startCommProgressBar: function _startCommProgressBar() {
        var _this4 = this;

        var ms = 300,
            totalDuration = 5 * 1000;
        this.setState({ commProgress: 0 });

        var tmp = setInterval(function () {
            var number = _this4.state.commProgress;
            number += ms / totalDuration;

            if (number > 0.99) {
                clearInterval(tmp);
                if (_this4.state.dataTransferFailing) {
                    MessageActionCreators.addMessage({
                        text: 'Overføringen av data var for ustabil. Testen feilet.',
                        level: 'warning',
                        duration: 10
                    });
                }
            }
            _this4.setState({ commProgress: number });
        }, ms);
    },

    _qualityActive: function _qualityActive() {
        return this.state.qualityProgress < 1;
    },

    _commActive: function _commActive() {
        return this.state.commProgress < 1;
    },

    _updateState: function _updateState() {
        this.setState(this._getState());
    },

    _indicatorColor: function _indicatorColor() {
        return this.state.oxygenStore.colorIndicator;
    },

    _getState: function _getState() {
        return {
            oxygenStore: OxygenStore.getState(),
            dataQualityFailing: CommunicationQualityStore.qualityTestShouldFail(),
            dataTransferFailing: CommunicationQualityStore.transferTestShould()
        };
    },

    render: function render() {

        var indicator = React.createElement('div', {
            className: 'circle ',
            style: { display: 'inline-block', backgroundColor: this._indicatorColor() }
        });

        return React.createElement(
            'div',
            null,
            React.createElement(
                'div',
                { className: 'row' },
                React.createElement(
                    'ul',
                    { className: 'col-sm-6' },
                    React.createElement(
                        'li',
                        null,
                        'Scrubfilter byttet: ',
                        CO2Store.filterChanged() ? 'ja' : 'nei'
                    ),
                    React.createElement(
                        'li',
                        null,
                        'Oksygenindikator: ',
                        indicator,
                        ' '
                    )
                ),
                React.createElement(
                    'div',
                    { className: 'col-xs-12 col-sm-6' },
                    React.createElement(
                        'h3',
                        null,
                        'Innhold karbondioksid i drakten av total luftmengde'
                    ),
                    React.createElement(PieChart, { height: '200px' })
                )
            ),
            React.createElement(
                'div',
                { className: 'row' },
                React.createElement(
                    'div',
                    { className: '' },
                    React.createElement(
                        'p',
                        { className: '' },
                        'Kommunikasjon og data'
                    ),
                    React.createElement(
                        'p',
                        null,
                        'Kommunikasjonsstatus '
                    ),
                    React.createElement(ProgressBar, {
                        max: 100,
                        active: this._commActive(),
                        className: this.state.dataTransferFailing && (!this._commActive() ? 'progress-bar-danger' : ''),
                        progress: this.state.commProgress }),
                    React.createElement(
                        'button',
                        { onClick: this._startCommProgressBar,
                            className: 'btn btn-primary' },
                        'Test'
                    ),
                    React.createElement(
                        'p',
                        null,
                        'Datakvalitet'
                    ),
                    React.createElement(ProgressBar, {
                        max: 100,
                        active: this._qualityActive(),
                        className: this.state.dataQualityFailing && (!this._qualityActive() ? 'progress-bar-danger' : ''),
                        progress: this.state.qualityProgress }),
                    React.createElement(
                        'button',
                        { className: 'btn btn-primary',
                            onClick: this._startQualityProgressBar
                        },
                        'Test'
                    )
                )
            )
        );
    }

});

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../actions/MessageActionCreators":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/actions/MessageActionCreators.js","../stores/carbon-dioxide-store":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/stores/carbon-dioxide-store.js","../stores/communication-quality-store":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/stores/communication-quality-store.js","../stores/oxygen-store":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/stores/oxygen-store.js"}],"/Users/carl-erik.kopseng/dev_priv/Emissions/app/components/task.react.js":[function(require,module,exports){
(function (global){
'use strict';

var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null);
var Router = (typeof window !== "undefined" ? window.ReactRouter : typeof global !== "undefined" ? global.ReactRouter : null);
var MessageStore = require('../stores/message-store');
var TaskStore = require('../stores/task-store');
var RouteStore = require('../stores/route-store');
var MessageList = require('./message-list.react');
var IntroductionScreen = require('./introduction-screen.react.js');
var TeamDisplayer = require('./team-displayer.react');
var MissionTimer = require('./mission-timer.react.js');
var ScienceTask = require('./science-task.react');
var AstronautTask = require('./astronaut-task.react');
var CommunicationTask = require('./communication-task.react.js');
var SecurityTask = require('./security-task.react.js');
var _require = require('util');

var format = _require.format;

// lazyrequire
function lazyRequire(path) {
    var tmp = null;
    return function () {
        if (!tmp) tmp = require(path);
        return tmp;
    };
}
if (false) {
    require('../actions/MissionActionCreators');
}
var getMissionAC = lazyRequire('../actions/MissionActionCreators');

function urlOfTask(taskId) {
    return format('/%s/task/%s', RouteStore.getTeamId(), taskId);
}

function transitionToCurrentTask(transitionFunction) {
    var currentTaskId = TaskStore.getCurrentTaskId();

    // this logic is fragile - if you should suddenly decide to visit another team
    // _after_ you have started a task, the team+task combo is invalid -> 404
    if (currentTaskId !== RouteStore.getTaskId()) {
        var to = urlOfTask(currentTaskId);
        transitionFunction(to);
    }
}

var Task = React.createClass({
    displayName: 'Task',

    contextTypes: {
        router: React.PropTypes.func
    },

    mixins: [],

    statics: {
        willTransitionTo: function willTransitionTo(transition) {
            transitionToCurrentTask(transition.redirect.bind(transition));
        }
    },

    componentDidMount: function componentDidMount() {},

    componentWillMount: function componentWillMount() {
        MessageStore.addChangeListener(this._onChange);
        TaskStore.addChangeListener(this._onChange);
        //console.log('componentWillMount');
    },

    componentWillUnmount: function componentWillUnmount() {
        //console.log('componentWillUnmount');
        MessageStore.removeChangeListener(this._onChange);
        TaskStore.removeChangeListener(this._onChange);

        clearTimeout(this._stateTimeout);
    },

    componentDidUnmount: function componentDidUnmount() {},

    componentDidUpdate: function componentDidUpdate() {},

    getInitialState: function getInitialState() {
        var _this = this;

        setTimeout(function () {
            return _this.setState({ taskIsNew: false });
        }, 2000);

        return {
            messages: MessageStore.getMessages(),
            taskStore: TaskStore.getState(),
            taskIsNew: true
        };
    },

    _onChange: function _onChange() {
        var _this2 = this;

        this.setState({
            messages: MessageStore.getMessages(),
            taskStore: TaskStore.getState(),
            taskIsNew: true
        });

        var router = this.context.router;
        transitionToCurrentTask(router.transitionTo.bind(router));

        // a bit rudimentary - triggers on all changes, not just Task changes ...
        this._stateTimeout = setTimeout(function () {
            return _this2.setState({ taskIsNew: false });
        }, 2000);
    },

    _createSubTaskUI: function _createSubTaskUI() {
        switch (RouteStore.getTeamId()) {
            case 'science':
                return React.createElement(ScienceTask, { appstate: this.state });
            case 'astronaut':
                return React.createElement(AstronautTask, { appstate: this.state });
            case 'communication':
                return React.createElement(CommunicationTask, { appstate: this.state });
            case 'security':
                return React.createElement(SecurityTask, { appstate: this.state });
        }
    },

    _handleTaskOKClick: function _handleTaskOKClick() {
        getMissionAC().taskCompleted(RouteStore.getTeamId(), this.state.taskStore.currentTaskId);
    },

    render: function render() {
        var content = this._createSubTaskUI(),
            blink = this.state.taskIsNew ? 'blink' : '',
            teamNames = undefined,
            missionTimer = undefined;

        teamNames = React.createElement(
            'div',
            { id: 'team-name', className: '' },
            React.createElement(
                'header',
                { className: '' },
                React.createElement(TeamDisplayer, { className: '' })
            )
        );

        missionTimer = React.createElement(
            'section',
            { id: 'mission-timer', className: '' },
            React.createElement(MissionTimer, null)
        );

        if (!this.props.isMissionRunning) {
            var message = {
                id: 'not_used',
                text: 'Ikke klar. Venter på at oppdraget skal starte.',
                level: 'info'
            };

            return React.createElement(
                'div',
                null,
                teamNames,
                React.createElement(
                    'div',
                    { className: 'row' },
                    React.createElement(MessageList, { className: 'col-xs-12',
                        messages: [message] })
                )
            );
        }

        return React.createElement(
            'div',
            { className: '' },
            teamNames,
            missionTimer,
            React.createElement(
                'div',
                { className: 'row' },
                React.createElement(MessageList, { className: 'col-xs-12', messages: this.state.messages })
            ),
            React.createElement(
                'div',
                { className: 'row' },
                React.createElement(
                    'div',
                    { className: 'col-xs-12' },
                    React.createElement(
                        'div',
                        { className: 'jumbotron taskbox' },
                        React.createElement(
                            'h2',
                            { className: 'taskbox__header' },
                            'Oppgave'
                        ),
                        React.createElement(
                            'span',
                            { className: 'taskbox__text ' + blink },
                            ' ',
                            this.state.taskStore.currentTask,
                            ' '
                        ),
                        this.state.taskStore.plainInfo && React.createElement(
                            'button',
                            { className: 'btn-primary btn',
                                onClick: this._handleTaskOKClick
                            },
                            'OK'
                        )
                    )
                )
            ),
            content
        );
    }

});

module.exports = Task;

//console.log('componentDidUnmount');

//console.log('.componentDidUpdate');
/* if you want this to be sticky: http://codepen.io/senff/pen/ayGvD */

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../actions/MissionActionCreators":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/actions/MissionActionCreators.js","../stores/message-store":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/stores/message-store.js","../stores/route-store":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/stores/route-store.js","../stores/task-store":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/stores/task-store.js","./astronaut-task.react":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/components/astronaut-task.react.js","./communication-task.react.js":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/components/communication-task.react.js","./introduction-screen.react.js":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/components/introduction-screen.react.js","./message-list.react":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/components/message-list.react.js","./mission-timer.react.js":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/components/mission-timer.react.js","./science-task.react":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/components/science-task.react.js","./security-task.react.js":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/components/security-task.react.js","./team-displayer.react":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/components/team-displayer.react.js","util":"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/browserify/node_modules/util/util.js"}],"/Users/carl-erik.kopseng/dev_priv/Emissions/app/components/team-displayer.react.js":[function(require,module,exports){
(function (global){
'use strict';

var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null);
var RouteStore = require('../stores/route-store');
var teamNames = require('../team-name-map');

var TeamWidget = React.createClass({
    displayName: 'TeamWidget',

    contextTypes: {
        router: React.PropTypes.func
    },

    mixins: [],

    _onChange: function _onChange() {
        this.forceUpdate();
    },

    componentDidMount: function componentDidMount() {},

    componentWillUnmount: function componentWillUnmount() {},

    teamName: function teamName() {
        return teamNames.nameMap[RouteStore.getTeamId()];
    },

    otherTeamNames: function otherTeamNames() {
        return teamNames.otherTeamNames(RouteStore.getTeamId());
    },

    render: function render() {

        return React.createElement(
            'div',
            { className: this.props.className + ' teamwidget' },
            React.createElement(
                'span',
                { className: 'active' },
                this.teamName()
            ),
            React.createElement(
                'span',
                { className: '' },
                ', ',
                this.otherTeamNames(),
                ' '
            )
        );
    }
});

module.exports = TeamWidget;

//RouteStore.addChangeListener(this._onChange);

//RouteStore.removeChangeListener(this._onChange);

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../stores/route-store":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/stores/route-store.js","../team-name-map":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/team-name-map.js"}],"/Users/carl-erik.kopseng/dev_priv/Emissions/app/components/timer-panel.react.js":[function(require,module,exports){
(function (global){
'use strict';

var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null),
    actions = require('../actions/TimerActionCreators'),
    Timer = require('./timer.react.js'),
    TimerStore = require('../stores/timer-store');

module.exports = React.createClass({
    displayName: 'exports',

    propTypes: {
        timerId: React.PropTypes.string.isRequired
    },

    getInitialState: function getInitialState() {
        return this._getTimerState();
    },

    componentDidMount: function componentDidMount() {
        TimerStore.addChangeListener(this._handleTimeStoreChange);
    },

    componentWillUnmount: function componentWillUnmount() {
        TimerStore.removeChangeListener(this._handleTimeStoreChange);
    },

    shouldComponentUpdate: function shouldComponentUpdate(nextProps, nextState) {
        return nextState.timeInSeconds !== this.state.timeInSeconds;
    },

    componentDidUpdate: function componentDidUpdate() {},

    _handleTimeStoreChange: function _handleTimeStoreChange() {
        this.setState(this._getTimerState());
    },

    _handleClick: function _handleClick() {
        actions.startTimer(this.props.timerId);
    },

    _getTimerState: function _getTimerState() {
        return {
            ready: TimerStore.isReadyToStart(this.props.timerId),
            timeInSeconds: TimerStore.getRemainingTime(this.props.timerId)
        };
    },

    render: function render() {
        return React.createElement(
            'section',
            { className: 'timer ' + this.props.className },
            React.createElement(
                'div',
                { className: 'row' },
                React.createElement(
                    'div',
                    { className: 'timer--button col-xs-5 ' },
                    React.createElement(
                        'button',
                        {
                            className: 'btn btn-primary ' + (this.state.ready ? '' : 'disabled'),
                            onClick: this._handleClick },
                        'Start klokka'
                    )
                ),
                React.createElement(
                    'div',
                    { className: 'timer--value col-xs-6 padding-xs-1' },
                    React.createElement(Timer, { timeInSeconds: this.state.timeInSeconds })
                )
            )
        );
    }
});

//console.log('TimerPanel.componentDidUpdate');

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../actions/TimerActionCreators":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/actions/TimerActionCreators.js","../stores/timer-store":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/stores/timer-store.js","./timer.react.js":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/components/timer.react.js"}],"/Users/carl-erik.kopseng/dev_priv/Emissions/app/components/timer.react.js":[function(require,module,exports){
(function (global){
// This example can be modified to act as a countdown timer

'use strict';

var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null),
    printf = require('printf');

function pad(num) {
    return printf('%02d', num);
}

var Timer = React.createClass({
    displayName: 'Timer',

    propTypes: {
        timeInSeconds: React.PropTypes.number.isRequired
    },

    componentDidUpdate: function componentDidUpdate() {},

    shouldComponentUpdate: function shouldComponentUpdate(nextProps, nextState) {
        return nextProps.timeInSeconds !== this.props.timeInSeconds;
    },

    _minutes: function _minutes() {
        return pad(Math.max(0, this.props.timeInSeconds) / 60 >> 0);
    },

    _seconds: function _seconds() {
        return pad(Math.max(0, this.props.timeInSeconds) % 60);
    },

    _timeValue: function _timeValue() {
        return this._minutes() + ':' + this._seconds();
    },

    render: function render() {
        return React.createElement(
            'div',
            { className: 'timer-value' },
            ' ',
            this._timeValue()
        );
    }
});

module.exports = Timer;

//console.log('Timer.componentDidUpdate');

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"printf":"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/printf/lib/printf.js"}],"/Users/carl-erik.kopseng/dev_priv/Emissions/app/constants/AstroTeamConstants.js":[function(require,module,exports){
'use strict';

window.__astConst = module.exports = {
    GOOD_OXYGEN: 'GOOD_OXYGEN',
    WARN_OXYGEN: 'WARN_OXYGEN',
    CRITICAL_OXYGEN: 'CRITICAL_OXYGEN',
    LOW_RESP_RATE: 'LOW_RESP_RATE',
    HIGH_RESP_RATE: 'HIGH_RESP_RATE',

    /* remove? don't think they are used */
    SET_HEART_RATE: 'SET_HEART_RATE',
    SET_OXYGEN_LEVEL: 'SET_OXYGEN_LEVEL',
    SET_OXYGEN_CONSUMPTION: 'SET_OXYGEN_CONSUMPTION',

    HEART_RATE_TIMER: 'HEART_RATE_TIMER',
    RESPIRATION_TIMER: 'RESPIRATION_TIMER'
};

},{}],"/Users/carl-erik.kopseng/dev_priv/Emissions/app/constants/MessageConstants.js":[function(require,module,exports){
'use strict';

var _Object$freeze = require('babel-runtime/core-js/object/freeze')['default'];

module.exports = _Object$freeze({
    // events
    MESSAGE_ADDED: 'MESSAGE_ADDED',
    REMOVE_MESSAGE: 'REMOVE_MESSAGE'
});

},{"babel-runtime/core-js/object/freeze":"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/babel-runtime/core-js/object/freeze.js"}],"/Users/carl-erik.kopseng/dev_priv/Emissions/app/constants/MissionConstants.js":[function(require,module,exports){
'use strict';

module.exports = require('react/lib/keyMirror')({
    MISSION_TIME_SYNC: 'MISSION_TIME_SYNC',
    MISSION_STARTED_EVENT: 'MISSION_STARTED_EVENT',
    MISSION_STOPPED_EVENT: 'MISSION_STOPPED_EVENT',
    MISSION_COMPLETED_EVENT: 'MISSION_COMPLETED_EVENT',
    MISSION_WAS_RESET: 'MISSION_WAS_RESET',
    RECEIVED_EVENTS: null,
    INTRODUCTION_READ: 'INTRODUCTION_READ',
    START_TASK: 'START_TASK',
    COMPLETED_TASK: 'COMPLETED_TASK',
    ASK_FOR_APP_STATE: 'ASK_FOR_APP_STATE',
    RECEIVED_APP_STATE: 'RECEIVED_APP_STATE',
    SENDING_TEAM_STATE: 'SENDING_TEAM_STATE'
});

},{"react/lib/keyMirror":"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/react/lib/keyMirror.js"}],"/Users/carl-erik.kopseng/dev_priv/Emissions/app/constants/RouterConstants.js":[function(require,module,exports){
'use strict';

var _Object$freeze = require('babel-runtime/core-js/object/freeze')['default'];

module.exports = _Object$freeze({
    // events
    ROUTE_CHANGED_EVENT: 'ROUTE_CHANGED_EVENT',
    ROUTER_AVAILABLE: 'ROUTER_AVAILABLE' });

},{"babel-runtime/core-js/object/freeze":"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/babel-runtime/core-js/object/freeze.js"}],"/Users/carl-erik.kopseng/dev_priv/Emissions/app/constants/ScienceTeamConstants.js":[function(require,module,exports){
'use strict';

var _Object$freeze = require('babel-runtime/core-js/object/freeze')['default'];

module.exports = _Object$freeze({
    // ids
    SCIENCE_TIMER_1: 'SCIENCE_TIMER_1',
    SCIENCE_RADIATION_WARNING_MSG: 'SCIENCE_RADIATION_WARNING_MSG',

    SCIENCE_CLEAR_RADIATION_SAMPLES: 'SCIENCE_CLEAR_RADIATION_SAMPLES',

    // events
    SCIENCE_COUNTDOWN_TIMER_CHANGED: 'SCIENCE_COUNTDOWN_TIMER_CHANGED',
    SCIENCE_TAKE_RADIATION_SAMPLE: 'SCIENCE_TAKE_RADIATION_SAMPLE',
    SCIENCE_RADIATION_LEVEL_CHANGED: 'SCIENCE_RADIATION_LEVEL_CHANGED',
    SCIENCE_TOTAL_RADIATION_LEVEL_CHANGED: 'SCIENCE_TOTAL_RADIATION_LEVEL_CHANGED',
    SCIENCE_AVG_RADIATION_CALCULATED: 'SCIENCE_AVG_RADIATION_CALCULATED',

    // values
    SCIENCE_RADIATION_MIN: 0,
    SCIENCE_RADIATION_MAX: 100,
    SCIENCE_AVG_RAD_GREEN_VALUE: 0,
    SCIENCE_AVG_RAD_ORANGE_VALUE: 15,
    SCIENCE_AVG_RAD_RED_VALUE: 50,
    SCIENCE_AVG_RAD_ORANGE_THRESHOLD: 40,
    SCIENCE_AVG_RAD_RED_THRESHOLD: 75,
    SCIENCE_TOTAL_RADIATION_SERIOUS_THRESHOLD: 50,
    SCIENCE_TOTAL_RADIATION_VERY_SERIOUS_THRESHOLD: 75
});

},{"babel-runtime/core-js/object/freeze":"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/babel-runtime/core-js/object/freeze.js"}],"/Users/carl-erik.kopseng/dev_priv/Emissions/app/constants/TimerConstants.js":[function(require,module,exports){
'use strict';

module.exports = {
    SET_TIMER: 'SET_TIMER',
    START_TIMER: 'START_TIMER',
    STOP_TIMER: 'STOP_TIMER',
    RESET_TIMER: 'RESET_TIMER'
};

},{}],"/Users/carl-erik.kopseng/dev_priv/Emissions/app/router-container.js":[function(require,module,exports){
(function (global){
// proxy access to the router as first step in bringing it into the flux flow
// @see https://github.com/rackt/react-router/blob/master/docs/guides/flux.md

'use strict';

var router = null;

window.__router = module.exports = {
    transitionTo: function transitionTo(to, params, query) {
        return router.transitionTo(to, params, query);
    },

    getCurrentPathname: function getCurrentPathname() {
        return window.location.pathname;
    },

    getTeamId: function getTeamId() {
        return this.getCurrentPathname().split('/')[1];
    },

    getTaskId: function getTaskId() {
        return this.getCurrentPathname().split('/')[3];
    },

    run: function run() {
        for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
        }

        return router.run.apply(router, args);
    }
};

var Router = (typeof window !== "undefined" ? window.ReactRouter : typeof global !== "undefined" ? global.ReactRouter : null);
var routes = require('./routes.react');

// By the time route config is require()-d,
// require('./router') already returns a valid object

router = Router.create({
    routes: routes,

    // Use the HTML5 History API for clean URLs
    location: Router.HistoryLocation
});

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./routes.react":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/routes.react.js"}],"/Users/carl-erik.kopseng/dev_priv/Emissions/app/routes.react.js":[function(require,module,exports){
(function (global){
'use strict';

var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null);
var Router = (typeof window !== "undefined" ? window.ReactRouter : typeof global !== "undefined" ? global.ReactRouter : null);
var Route = Router.Route;
var NotFoundRoute = Router.NotFoundRoute;
var DefaultRoute = Router.DefaultRoute;

var App = require('./components/app.react');
var MissionCommanderApp = require('./components/mission-commander.react.js');
var IndexApp = require('./components/index-app.react');
var NotFound = require('./components/not-found.react');
var IntroScreen = require('./components/introduction-screen.react');
var SolarStorm = require('./components/full-screen-video.js');
var Task = require('./components/task.react');
var DummyRenderMixin = require('./components/dummy-render.mixin');

var _require = require('./utils');

var cleanRootPath = _require.cleanRootPath;

var teamNameMap = require('./team-name-map');

var RedirectToIntro = React.createClass({
    displayName: 'RedirectToIntro',

    statics: {
        willTransitionTo: function willTransitionTo(transition) {
            var teamId = cleanRootPath(transition.path);

            if (teamId in teamNameMap.nameMap) {
                transition.redirect(transition.path + '/intro');
            }
        }
    },

    //mixins : [DummyRenderMixin]
    render: function render() {
        return React.createElement(NotFound, null);
    }
});

var routes = React.createElement(
    Route,
    { name: 'app', path: '/', handler: App },
    React.createElement(Route, { name: 'job-completed', path: '/completed', handler: SolarStorm }),
    React.createElement(Route, { name: 'commander', handler: MissionCommanderApp }),
    React.createElement(Route, { name: 'team-root', path: '/:teamId', handler: RedirectToIntro }),
    React.createElement(Route, { name: 'team-intro', path: '/:teamId/intro', handler: IntroScreen }),
    React.createElement(Route, { name: 'team-task', path: '/:teamId/task/:taskId', handler: Task }),
    React.createElement(NotFoundRoute, { handler: NotFound }),
    React.createElement(DefaultRoute, { handler: IndexApp })
);

module.exports = routes;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./components/app.react":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/components/app.react.js","./components/dummy-render.mixin":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/components/dummy-render.mixin.js","./components/full-screen-video.js":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/components/full-screen-video.js","./components/index-app.react":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/components/index-app.react.js","./components/introduction-screen.react":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/components/introduction-screen.react.js","./components/mission-commander.react.js":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/components/mission-commander.react.js","./components/not-found.react":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/components/not-found.react.js","./components/task.react":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/components/task.react.js","./team-name-map":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/team-name-map.js","./utils":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/utils.js"}],"/Users/carl-erik.kopseng/dev_priv/Emissions/app/stores/base-store.js":[function(require,module,exports){
'use strict';

var _inherits = require('babel-runtime/helpers/inherits')['default'];

var _createClass = require('babel-runtime/helpers/create-class')['default'];

var _classCallCheck = require('babel-runtime/helpers/class-call-check')['default'];

var EventEmitter = require('events');
var CHANGE_EVENT = 'CHANGE_EVENT';

var path = null;

var BaseStore = (function (_EventEmitter) {
    function BaseStore() {
        _classCallCheck(this, BaseStore);

        if (_EventEmitter != null) {
            _EventEmitter.apply(this, arguments);
        }
    }

    _inherits(BaseStore, _EventEmitter);

    _createClass(BaseStore, [{
        key: 'emitChange',
        value: function emitChange() {
            this.emit(CHANGE_EVENT);
        }
    }, {
        key: 'addChangeListener',

        /**
         * @param {function} callback
         * @returns emitter, so calls can be chained.
         */
        value: function addChangeListener(callback) {
            return this.on(CHANGE_EVENT, callback);
        }
    }, {
        key: 'removeChangeListener',

        /**
         * @param {function} callback
         * @returns emitter, so calls can be chained.
         */
        value: function removeChangeListener(callback) {
            return this.removeListener(CHANGE_EVENT, callback);
        }
    }, {
        key: 'dispatcherIndex',
        value: undefined,
        enumerable: true
    }]);

    return BaseStore;
})(EventEmitter);

module.exports = BaseStore;

},{"babel-runtime/helpers/class-call-check":"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/babel-runtime/helpers/class-call-check.js","babel-runtime/helpers/create-class":"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/babel-runtime/helpers/create-class.js","babel-runtime/helpers/inherits":"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/babel-runtime/helpers/inherits.js","events":"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/browserify/node_modules/events/events.js"}],"/Users/carl-erik.kopseng/dev_priv/Emissions/app/stores/breath-rate-store.js":[function(require,module,exports){
'use strict';

var _Object$assign = require('babel-runtime/core-js/object/assign')['default'];

var Dispatcher = require('../appdispatcher');
var MConstants = require('../constants/MissionConstants');
var AstConstants = require('../constants/AstroTeamConstants');
var BaseStore = require('./base-store');

var current = AstConstants.LOW_RESP_RATE;

var BreathRateStore = module.exports = _Object$assign(new BaseStore(), {

    getState: function getState() {
        if (current == AstConstants.LOW_RESP_RATE) {
            return { rate: current, min: 23, max: 28 };
        } else {
            return { rate: current, min: 45, max: 55 };
        }
    },

    dispatcherIndex: Dispatcher.register(function (payload) {

        switch (payload.action) {
            case AstConstants.SET_BREATH_RATE:
                current = payload.rate;
                BreathRateStore.emitChange();
                break;
        }

        return true;
    })
});

},{"../appdispatcher":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/appdispatcher.js","../constants/AstroTeamConstants":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/constants/AstroTeamConstants.js","../constants/MissionConstants":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/constants/MissionConstants.js","./base-store":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/stores/base-store.js","babel-runtime/core-js/object/assign":"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/babel-runtime/core-js/object/assign.js"}],"/Users/carl-erik.kopseng/dev_priv/Emissions/app/stores/carbon-dioxide-store.js":[function(require,module,exports){
'use strict';

var _Object$assign = require('babel-runtime/core-js/object/assign')['default'];

var Dispatcher = require('../appdispatcher');
var MissionConstants = require('../constants/MissionConstants');
var BaseStore = require('./base-store');

var level = 0;
var filterChanged = false;

var CO2Store = module.exports = _Object$assign(new BaseStore(), {

    co2Level: function co2Level() {
        return level;
    },

    filterChanged: (function (_filterChanged) {
        function filterChanged() {
            return _filterChanged.apply(this, arguments);
        }

        filterChanged.toString = function () {
            return _filterChanged.toString();
        };

        return filterChanged;
    })(function () {
        return filterChanged;
    }),

    dispatcherIndex: Dispatcher.register(function (payload) {

        switch (payload.action) {
            case MissionConstants.RECEIVED_APP_STATE:
                var appState = payload.appState;

                level = appState.carbon_dioxide;
                filterChanged = appState.scrub_filter_changed;
                CO2Store.emitChange();
                break;
        }

        return true;
    })
});

},{"../appdispatcher":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/appdispatcher.js","../constants/MissionConstants":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/constants/MissionConstants.js","./base-store":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/stores/base-store.js","babel-runtime/core-js/object/assign":"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/babel-runtime/core-js/object/assign.js"}],"/Users/carl-erik.kopseng/dev_priv/Emissions/app/stores/communication-quality-store.js":[function(require,module,exports){
'use strict';

var AppDispatcher = require('../appdispatcher');
var MissionConstants = require('../constants/MissionConstants');
var qualityShouldFail = true;
var transferShouldFail = true;

module.exports = {

    qualityTestShouldFail: function qualityTestShouldFail() {
        return qualityShouldFail;
    },

    transferTestShould: function transferTestShould() {
        return transferShouldFail;
    },

    dispatcherIndex: AppDispatcher.register(function (payload) {

        if (payload.action === MissionConstants.RECEIVED_APP_STATE) {
            shouldFail = payload.appState.quality_test_should_fail;
        }
    })
};

},{"../appdispatcher":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/appdispatcher.js","../constants/MissionConstants":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/constants/MissionConstants.js"}],"/Users/carl-erik.kopseng/dev_priv/Emissions/app/stores/event-store.js":[function(require,module,exports){
'use strict';

var _Object$assign = require('babel-runtime/core-js/object/assign')['default'];

var Dispatcher = require('../appdispatcher');
var MConstants = require('../constants/MissionConstants');
var BaseStore = require('./base-store');

var eventsCollection = {
    remaining: [],
    completed: [],
    overdue: []
};

var EventStore = module.exports = window.__eventStore = _Object$assign(new BaseStore(), {

    remaining: function remaining() {
        return eventsCollection.remaining;
    },

    completed: function completed() {
        return eventsCollection.completed;
    },

    overdue: function overdue() {
        return eventsCollection.overdue;
    },

    dispatcherIndex: Dispatcher.register(function (payload) {

        switch (payload.action) {

            case MConstants.RECEIVED_EVENTS:
                eventsCollection.remaining = payload.remaining;
                eventsCollection.overdue = payload.overdue;
                eventsCollection.completed = payload.completed;
                EventStore.emitChange();

                break;
        }

        return true;
    })
});

//window.__eventStore = module.exports;

},{"../appdispatcher":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/appdispatcher.js","../constants/MissionConstants":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/constants/MissionConstants.js","./base-store":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/stores/base-store.js","babel-runtime/core-js/object/assign":"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/babel-runtime/core-js/object/assign.js"}],"/Users/carl-erik.kopseng/dev_priv/Emissions/app/stores/heart-rate-store.js":[function(require,module,exports){
'use strict';

var _Object$assign = require('babel-runtime/core-js/object/assign')['default'];

var Dispatcher = require('../appdispatcher');
var MConstants = require('../constants/MissionConstants');
var AstConstants = require('../constants/AstroTeamConstants');
var BaseStore = require('./base-store');

var current = { min: 60, max: 70 };

var HeartRateStore = module.exports = _Object$assign(new BaseStore(), {

    // om vi vil backe opp verdier på server må vi bruke denne storen
    getState: function getState() {
        return current;
    },

    dispatcherIndex: Dispatcher.register(function (payload) {

        switch (payload.action) {
            case MConstants.RECEIVED_APP_STATE:
                var rate = payload.appState.heart_rate;
                if (rate && rate.min && rate.max) {
                    current = rate;
                    HeartRateStore.emitChange();
                }
                break;
        }

        return true;
    })
});

},{"../appdispatcher":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/appdispatcher.js","../constants/AstroTeamConstants":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/constants/AstroTeamConstants.js","../constants/MissionConstants":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/constants/MissionConstants.js","./base-store":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/stores/base-store.js","babel-runtime/core-js/object/assign":"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/babel-runtime/core-js/object/assign.js"}],"/Users/carl-erik.kopseng/dev_priv/Emissions/app/stores/introduction-store.js":[function(require,module,exports){
/* Holds the state of whether introductions have been read */

'use strict';

var _Object$assign = require('babel-runtime/core-js/object/assign')['default'];

var AppDispatcher = require('../appdispatcher');
var BaseStore = require('./base-store');
var MissionConstants = require('../constants/MissionConstants');
var RouteStore = require('./route-store');

var introRead = {};

var IntroductionStore = _Object$assign(new BaseStore(), {

    setIntroductionRead: function setIntroductionRead(team) {
        introRead['intro_' + team] = true;
        this.emitChange();
    },

    isIntroductionRead: function isIntroductionRead(team) {
        if (!team) {
            throw new Error('Missing argument "team"');
        }

        return introRead['intro_' + team];
    },

    dispatcherIndex: AppDispatcher.register(function (payload) {
        var action = payload.action;

        switch (action) {
            case MissionConstants.INTRODUCTION_READ:
                IntroductionStore.setIntroductionRead(payload.teamName);
                break;

            case MissionConstants.RECEIVED_APP_STATE:
                var teamId = RouteStore.getTeamId();

                var teamState = payload.appState[teamId];

                if (teamState && teamState.introduction_read) {
                    IntroductionStore.setIntroductionRead(teamState.team);
                }
        }

        return true; // No errors. Needed by promise in Dispatcher.
    })

});

window.__IntroductionStore = IntroductionStore;
module.exports = IntroductionStore;

},{"../appdispatcher":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/appdispatcher.js","../constants/MissionConstants":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/constants/MissionConstants.js","./base-store":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/stores/base-store.js","./route-store":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/stores/route-store.js","babel-runtime/core-js/object/assign":"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/babel-runtime/core-js/object/assign.js"}],"/Users/carl-erik.kopseng/dev_priv/Emissions/app/stores/message-store.js":[function(require,module,exports){
/* A store that can be queried for the current path */

'use strict';

var _Object$assign = require('babel-runtime/core-js/object/assign')['default'];

var _Object$keys = require('babel-runtime/core-js/object/keys')['default'];

var _require = require('events');

var Emitter = _require.Emitter;

var AppDispatcher = require('../appdispatcher');
var BaseStore = require('./base-store');

var _require2 = require('../constants/MessageConstants');

var REMOVE_MESSAGE = _require2.REMOVE_MESSAGE;
var MESSAGE_ADDED = _require2.MESSAGE_ADDED;

var messages = {};

var MessageStore = _Object$assign(new BaseStore(), {

    reset: function reset() {
        messages = {};
        this.emitChange();
    },

    handleAddedMessage: function handleAddedMessage(data) {
        data.dismissable = data.dismissable === undefined ? true : data.dismissable;
        messages[data.id] = data;
        this.emitChange();
    },

    handleRemoveMessage: function handleRemoveMessage(id) {
        delete messages[id];
        this.emitChange();
    },

    /**
     * A list of all messages matching filter
     * @param [filter]
     * @returns []Message a Message = { text, id, level }
     */
    getMessages: function getMessages(filter) {
        if (!filter) {
            return _Object$keys(messages).map(function (msgKey) {
                return messages[msgKey];
            });
        } else throw new Error('UNIMPLEMENTED "filter" feature');
    },

    dispatcherIndex: AppDispatcher.register(function (payload) {
        var action = payload.action;
        var data = payload.data;

        switch (action) {
            case MESSAGE_ADDED:
                MessageStore.handleAddedMessage(data);
                break;
            case REMOVE_MESSAGE:
                MessageStore.handleRemoveMessage(data);
        }

        return true; // No errors. Needed by promise in Dispatcher.
    })

});

window.__MessageStore = MessageStore;
module.exports = MessageStore;

},{"../appdispatcher":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/appdispatcher.js","../constants/MessageConstants":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/constants/MessageConstants.js","./base-store":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/stores/base-store.js","babel-runtime/core-js/object/assign":"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/babel-runtime/core-js/object/assign.js","babel-runtime/core-js/object/keys":"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/babel-runtime/core-js/object/keys.js","events":"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/browserify/node_modules/events/events.js"}],"/Users/carl-erik.kopseng/dev_priv/Emissions/app/stores/mission-state-store.js":[function(require,module,exports){
/* A store that can be queried for the current path */

'use strict';

var _Object$assign = require('babel-runtime/core-js/object/assign')['default'];

var _require = require('events');

var Emitter = _require.Emitter;

var AppDispatcher = require('../appdispatcher');
var BaseStore = require('./base-store');

var _require2 = require('../constants/MissionConstants');

var MISSION_STARTED_EVENT = _require2.MISSION_STARTED_EVENT;
var MISSION_STOPPED_EVENT = _require2.MISSION_STOPPED_EVENT;
var RECEIVED_APP_STATE = _require2.RECEIVED_APP_STATE;

var missionRunning = false,
    missionHasBeenStopped = false;
var currentChapter = null;
var chapterTime = 0;

var MissionStateStore = _Object$assign(new BaseStore(), {

    handleMissionStarted: function handleMissionStarted() {
        missionRunning = true;
        this.emitChange();
    },

    handleMissionStopped: function handleMissionStopped() {
        missionRunning = false;
        this.emitChange();
    },

    isMissionRunning: function isMissionRunning() {
        return missionRunning;
    },

    isMissionStopped: function isMissionStopped() {
        return missionHasBeenStopped;
    },

    currentChapter: (function (_currentChapter) {
        function currentChapter() {
            return _currentChapter.apply(this, arguments);
        }

        currentChapter.toString = function () {
            return _currentChapter.toString();
        };

        return currentChapter;
    })(function () {
        return currentChapter;
    }),

    chapterTime: (function (_chapterTime) {
        function chapterTime() {
            return _chapterTime.apply(this, arguments);
        }

        chapterTime.toString = function () {
            return _chapterTime.toString();
        };

        return chapterTime;
    })(function () {
        return chapterTime;
    }),

    dispatcherIndex: AppDispatcher.register(function (payload) {
        var action = payload.action;

        switch (action) {
            case MISSION_STARTED_EVENT:
                return MissionStateStore.handleMissionStarted();

            case MISSION_STOPPED_EVENT:
                return MissionStateStore.handleMissionStopped();

            case RECEIVED_APP_STATE:
                var appState = payload.appState;
                missionRunning = appState.mission_running;
                currentChapter = appState.current_chapter;
                chapterTime = appState.elapsed_chapter_time;
                return MissionStateStore.emitChange();
        }

        return true; // No errors. Needed by promise in Dispatcher.
    })

});

window.__MissionStateStore = MissionStateStore;
module.exports = MissionStateStore;

},{"../appdispatcher":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/appdispatcher.js","../constants/MissionConstants":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/constants/MissionConstants.js","./base-store":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/stores/base-store.js","babel-runtime/core-js/object/assign":"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/babel-runtime/core-js/object/assign.js","events":"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/browserify/node_modules/events/events.js"}],"/Users/carl-erik.kopseng/dev_priv/Emissions/app/stores/oxygen-store.js":[function(require,module,exports){
'use strict';

var _Object$assign = require('babel-runtime/core-js/object/assign')['default'];

var Dispatcher = require('../appdispatcher');
var MissionConstants = require('../constants/MissionConstants');
var AstConstants = require('../constants/AstroTeamConstants');
var BaseStore = require('./base-store');

var _status = AstConstants.GOOD_OXYGEN;
var consumptionPerMinute = null;
var remaining = 100;

var OxygenStore = module.exports = _Object$assign(new BaseStore(), {

    status: function status() {
        return _status;
    },

    statusAsColor: function statusAsColor() {
        switch (_status) {
            case AstConstants.CRITICAL_OXYGEN:
                return 'red';
            case AstConstants.WARN_OXYGEN:
                return 'orange';
            case AstConstants.GOOD_OXYGEN:
                return 'green';
        }
    },

    getState: function getState() {
        return {
            colorIndicator: this.statusAsColor(),
            consumptionPerMinute: consumptionPerMinute,
            remaining: remaining
        };
    },

    dispatcherIndex: Dispatcher.register(function (payload) {

        switch (payload.action) {
            case MissionConstants.RECEIVED_APP_STATE:
                var appState = payload.appState;

                if (appState.oxygen_consumption) {
                    consumptionPerMinute = appState.oxygen_consumption;

                    if (consumptionPerMinute > 1 && _status !== AstConstants.CRITICAL_OXYGEN) {
                        _status = AstConstants.WARN_OXYGEN;
                    } else if (consumptionPerMinute < 2) {
                        _status = AstConstants.GOOD_OXYGEN;
                    }

                    OxygenStore.emitChange();
                }

                if (appState.oxygen) {
                    remaining = appState.oxygen;
                    OxygenStore.emitChange();
                }
                break;
        }

        return true;
    })
});

},{"../appdispatcher":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/appdispatcher.js","../constants/AstroTeamConstants":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/constants/AstroTeamConstants.js","../constants/MissionConstants":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/constants/MissionConstants.js","./base-store":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/stores/base-store.js","babel-runtime/core-js/object/assign":"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/babel-runtime/core-js/object/assign.js"}],"/Users/carl-erik.kopseng/dev_priv/Emissions/app/stores/radiation-store.js":[function(require,module,exports){
/* A singleton store that can be queried for remaining time */

'use strict';

var _Object$assign = require('babel-runtime/core-js/object/assign')['default'];

var AppDispatcher = require('../appdispatcher');
var BaseStore = require('./base-store');
var ScienceTeamConstants = require('../constants/ScienceTeamConstants');
var MissionConstants = require('../constants/MissionConstants');
var randomInt = require('../utils').randomInt;
var radiationRange = {
    min: 5,
    max: 20
};
var samples = [];
var totalRadiation = 0;
var lastCalculatedAverage = null;

var RadiationStore = _Object$assign(new BaseStore(), {

    _setRadiationLevel: function _setRadiationLevel(min, max) {
        radiationRange.min = min;
        radiationRange.max = max;
        this.emitChange();
    },

    _clearSamples: function _clearSamples() {
        samples = [];
        this.emitChange();
    },

    _takeSample: function _takeSample() {
        samples.push(this.getLevel());
        this.emitChange();
    },

    getLevel: function getLevel() {
        return randomInt(radiationRange.min, radiationRange.max);
    },

    getTotalLevel: function getTotalLevel() {
        return totalRadiation;
    },

    getSamples: function getSamples() {
        return samples.slice();
    },

    getState: function getState() {
        return {
            samples: samples.slice(0),
            total: totalRadiation,
            currentLevel: this.getLevel(),
            lastCalculatedAverage: lastCalculatedAverage
        };
    },

    dispatcherIndex: AppDispatcher.register(function (payload) {
        var action = payload.action;
        var data = payload.data;

        switch (action) {
            case ScienceTeamConstants.SCIENCE_RADIATION_LEVEL_CHANGED:
                RadiationStore._setRadiationLevel(data.min, data.max);
                break;
            case ScienceTeamConstants.SCIENCE_TOTAL_RADIATION_LEVEL_CHANGED:
                totalRadiation = data.total;
                RadiationStore.emitChange();
                break;

            case ScienceTeamConstants.SCIENCE_TAKE_RADIATION_SAMPLE:
                RadiationStore._takeSample();
                break;
            case ScienceTeamConstants.SCIENCE_AVG_RADIATION_CALCULATED:
                lastCalculatedAverage = data.average;
                RadiationStore.emitChange();
                break;
            case ScienceTeamConstants.SCIENCE_CLEAR_RADIATION_SAMPLES:
                samples = [];
                RadiationStore.emitChange();
                break;
            case MissionConstants.RECEIVED_APP_STATE:
                var appState = payload.appState;

                if (appState.science && appState.science.radiation) {
                    var radiation = appState.science.radiation;
                    samples = radiation.samples;
                    lastCalculatedAverage = radiation.lastCalculatedAverage;
                    totalRadiation = radiation.total;
                }

                RadiationStore.emitChange();
                break;
            case MissionConstants.MISSION_WAS_RESET:
                samples = [];
                lastCalculatedAverage = null;
                totalRadiation = 0;
                break;
        }

        return true; // No errors. Needed by promise in Dispatcher.
    })

});

window.__RadiationStore = RadiationStore;
module.exports = RadiationStore;

},{"../appdispatcher":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/appdispatcher.js","../constants/MissionConstants":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/constants/MissionConstants.js","../constants/ScienceTeamConstants":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/constants/ScienceTeamConstants.js","../utils":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/utils.js","./base-store":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/stores/base-store.js","babel-runtime/core-js/object/assign":"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/babel-runtime/core-js/object/assign.js"}],"/Users/carl-erik.kopseng/dev_priv/Emissions/app/stores/route-store.js":[function(require,module,exports){
/* A store that can be queried for the current path */

'use strict';

var _Object$assign = require('babel-runtime/core-js/object/assign')['default'];

var AppDispatcher = require('../appdispatcher');
var BaseStore = require('./base-store');

var _require = require('../constants/RouterConstants');

var ROUTE_CHANGED_EVENT = _require.ROUTE_CHANGED_EVENT;

var _require2 = require('../utils');

var cleanRootPath = _require2.cleanRootPath;

var router = require('../router-container');

var RouteStore = _Object$assign(new BaseStore(), {

    handleRouteChanged: function handleRouteChanged(state) {
        this.emitChange();
    },

    getTeamId: function getTeamId() {
        return router.getTeamId();
    },

    getTaskId: function getTaskId() {
        return router.getTaskId();
    },

    dispatcherIndex: AppDispatcher.register(function (payload) {
        var action = payload.action;

        switch (action) {
            case ROUTE_CHANGED_EVENT:
                RouteStore.handleRouteChanged(payload.state);
                break;
        }

        return true; // No errors. Needed by promise in Dispatcher.
    })

});

window.__RouteStore = RouteStore;
module.exports = RouteStore;

},{"../appdispatcher":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/appdispatcher.js","../constants/RouterConstants":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/constants/RouterConstants.js","../router-container":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/router-container.js","../utils":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/utils.js","./base-store":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/stores/base-store.js","babel-runtime/core-js/object/assign":"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/babel-runtime/core-js/object/assign.js"}],"/Users/carl-erik.kopseng/dev_priv/Emissions/app/stores/task-store.js":[function(require,module,exports){
/* A store that can be queried for the current path */

'use strict';

var _Object$assign = require('babel-runtime/core-js/object/assign')['default'];

var AppDispatcher = require('../appdispatcher');
var BaseStore = require('./base-store');
var RouteStore = require('./route-store');
var MissionConstants = require('../constants/MissionConstants');

var awaitingNewInstructions = {
    text: 'Venter på nye instruksjoner ...'
};

var assignments = {
    science: {
        current: null,
        sample: {
            text: 'Start klokka og ta fire målinger jevnt fordelt utover de 30 sekundene',
            next: 'average'
        },
        average: {
            text: 'Regn ut gjennomsnittsverdien av strålingsverdiene dere fant. Skriv den inn i tekstfeltet.',
            next: 'addtotal'
        },
        addtotal: {
            text: 'Basert på fargen som ble indikert ved evaluering av gjennomsnittsverdien ' + 'skal vi nå legge til et tall til totalt funnet strålingsmengde.' + ' For grønn status man legge til 0, ' + ' for oransj status man legge til 15, ' + ' for rød status man legge til 50.' + ' Den totale strålingsverdien i kroppen skal helst ikke gå over 50, og aldri over 75!',
            next: 'awaiting'
        },
        awaiting: awaitingNewInstructions
    },

    astronaut: {
        current: null,
        awaiting: awaitingNewInstructions,
        breathing_timer: {
            text: 'Start klokka, og tell antall innpust (topper) på pustegrafen.',
            next: 'breathing_calculate',
            plain_info: true
        },
        breathing_calculate: {
            text: 'Hvor mange innpust blir det på ett minutt? Bruk tallet du finner til å regne ut oksygenforbruket pr minutt. Gjennomsnittlig oksygenforbruk med 25 innpust i minuttet er 1 oksygenenhet.',
            next: 'heartrate_timer'
        },
        heartrate_timer: {
            text: 'Start klokka og tell antall hjerteslag på ti sekunder',
            next: 'heartrate_calculate',
            plain_info: true
        },
        heartrate_calculate: {
            text: 'Finn nå ut hvor mange slag det blir i minuttet. Evaluer resultatet ved å skrive det inn i tekstfeltet.',
            next: 'awaiting'
        }
    },

    security: {
        current: null,
        awaiting: awaitingNewInstructions,

        scrubber: {
            text: 'NOT SURE ABOUT THIS ONE. I THINK IT WILL BE TRIGGERED WITHOUT ANY NEED FOR INSTRUCTIONS',
            next: 'awaiting'
        },

        tyr_v_check: {
            text: 'NOT SURE ABOUT THIS ONE. I THINK IT WILL BE TRIGGERED WITHOUT ANY NEED FOR INSTRUCTIONS',
            next: 'awaiting'
        }
    },

    communication: {
        current: null,
        awaiting: awaitingNewInstructions,

        comm_check: {
            text: 'Sjekk status på kommunikasjonslinken. Om signalet er svakt bør en annen satelitt velges. ' + 'Om dere velger en annen satelitt må dere også velge en frekvens fra frekvensbåndet. ' + 'Det beste valget av frekvens er vanligvis midt i frekvensbåndet. '
        }

    }
};

var TaskStore = _Object$assign(new BaseStore(), {

    getCurrentTask: function getCurrentTask() {
        var teamId = RouteStore.getTeamId();
        var assignmentsForTeam = assignments[teamId];
        return assignmentsForTeam && assignmentsForTeam[this.getCurrentTaskId(teamId)] || 'Ingen oppgave funnet';
    },

    getCurrentTaskId: function getCurrentTaskId() {
        var teamId = arguments[0] === undefined ? RouteStore.getTeamId() : arguments[0];

        if (!teamId.length) {
            return null;
        }return assignments[teamId].current || 'awaiting';
    },

    getState: function getState() {
        return {
            currentTaskId: this.getCurrentTaskId(),
            currentTask: this.getCurrentTask().text,
            nextTaskId: this.getCurrentTask().next,
            plainInfo: this.getCurrentTask().plain_info
        };
    },

    dispatcherIndex: AppDispatcher.register(function (payload) {
        var taskId;
        var teamId;
        var currentTask;
        var teamTasks;

        switch (payload.action) {

            case MissionConstants.START_TASK:
                teamId = payload.teamId;
                taskId = payload.taskId;

                teamTasks = assignments[teamId];
                teamTasks.current = taskId;
                TaskStore.emitChange();
                break;

            case MissionConstants.COMPLETED_TASK:
                teamId = payload.teamId;
                taskId = payload.taskId;

                teamTasks = assignments[teamId];
                currentTask = teamTasks[taskId];
                teamTasks.current = currentTask.next;
                TaskStore.emitChange();
                break;

            case MissionConstants.RECEIVED_APP_STATE:
                teamId = RouteStore.getTeamId();

                var teamState = payload.appState[teamId];

                if (teamState && teamState.current_task) {
                    currentTask = teamState.current_task;
                    teamTasks = assignments[teamId];
                    teamTasks.current = currentTask;
                    TaskStore.emitChange();
                }

        }

        return true; // No errors. Needed by promise in Dispatcher.
    })

});

window.__TaskStore = TaskStore;
module.exports = TaskStore;

},{"../appdispatcher":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/appdispatcher.js","../constants/MissionConstants":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/constants/MissionConstants.js","./base-store":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/stores/base-store.js","./route-store":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/stores/route-store.js","babel-runtime/core-js/object/assign":"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/babel-runtime/core-js/object/assign.js"}],"/Users/carl-erik.kopseng/dev_priv/Emissions/app/stores/timer-store.js":[function(require,module,exports){
/* A singleton store that can be queried for remaining time */

'use strict';

var _Object$assign = require('babel-runtime/core-js/object/assign')['default'];

var check = require('check-types');
var AppDispatcher = require('../appdispatcher');
var BaseStore = require('./base-store');
var TimerConstants = require('../constants/TimerConstants');
var MissionConstants = require('../constants/MissionConstants');

// keeping state hidden in the module
var remainingTime = {},
    initialTime = {},
    intervalId = {},
    elapsedMissionTime = 0,
    missionTimer = null;

function reset(timerId) {
    stop(timerId);
    remainingTime[timerId] = initialTime[timerId];
}

function start(timerId) {
    assertExists(timerId);

    intervalId[timerId] = setInterval(function fn() {
        if (remainingTime[timerId] > 0) {
            remainingTime[timerId]--;
            TimerStore.emitChange();
        } else {
            stop(timerId);
        }
    }, 1000);
}

function stop(timerId) {
    assertExists(timerId);

    clearInterval(intervalId[timerId]);
    delete intervalId[timerId];
    TimerStore.emitChange();
}

function startMissionTimer() {
    stopMissionTimer();
    missionTimer = setInterval(function () {
        elapsedMissionTime++;
        TimerStore.emitChange();
    }, 1000);
}

function stopMissionTimer() {
    clearInterval(missionTimer);
}

/**
 * @param data.remainingTime {Number}
 * @param data.timerId {string}
 */
function handleRemainingTimeChanged(data) {
    var remaining = data.remainingTime;
    if (remaining <= 0) throw new TypeError('Got invalid remaining time :' + remaining);

    remainingTime[data.timerId] = remaining;
    initialTime[data.timerId] = remaining;
    TimerStore.emitChange();
}

function assertExists(timerId) {
    check.assert(timerId in remainingTime, 'No time set for timer with id ' + timerId);
}

var TimerStore = _Object$assign(new BaseStore(), {

    getRemainingTime: function getRemainingTime(timerId) {
        check.number(timerId);
        return remainingTime[timerId];
    },

    isRunning: function isRunning(timerId) {
        check.number(timerId);
        return !!intervalId[timerId];
    },

    /**
     * The timer is set (or has been reset), but not started
     * @param timerId
     * @returns true if ready, false if running or timed out
     */
    isReadyToStart: function isReadyToStart(timerId) {
        check.number(timerId);

        if (this.isRunning(timerId)) {
            return false;
        }return this.getRemainingTime(timerId) > 0;
    },

    getElapsedMissionTime: function getElapsedMissionTime() {
        return elapsedMissionTime;
    },

    dispatcherIndex: AppDispatcher.register(function (payload) {
        var action = payload.action;
        var data = payload.data;

        switch (action) {

            case TimerConstants.SET_TIMER:
                handleRemainingTimeChanged(data);
                break;

            case TimerConstants.START_TIMER:
                assertExists(data.timerId);

                // avoid setting up more than one timer
                if (!TimerStore.isRunning(data.timerId)) {
                    start(data.timerId);
                }
                break;

            case TimerConstants.STOP_TIMER:
                stop(data.timerId);
                break;

            case TimerConstants.RESET_TIMER:
                reset(data.timerId);
                break;

            case MissionConstants.MISSION_STARTED_EVENT:
                startMissionTimer();
                break;

            case MissionConstants.MISSION_STOPPED_EVENT:
                stopMissionTimer();
                break;

            case MissionConstants.RECEIVED_APP_STATE:
                var appState = payload.appState;

                elapsedMissionTime = appState.elapsed_mission_time;

                if (appState.mission_running) {
                    startMissionTimer();
                } else {
                    stopMissionTimer();
                }

                TimerStore.emitChange();
                break;

            case MissionConstants.MISSION_TIME_SYNC:
                elapsedMissionTime = data.elapsedMissionTime;
                TimerStore.emitChange();
                break;
        }

        return true; // No errors. Needed by promise in Dispatcher.
    })

});

window.__TimeStore = TimerStore;
module.exports = TimerStore;

},{"../appdispatcher":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/appdispatcher.js","../constants/MissionConstants":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/constants/MissionConstants.js","../constants/TimerConstants":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/constants/TimerConstants.js","./base-store":"/Users/carl-erik.kopseng/dev_priv/Emissions/app/stores/base-store.js","babel-runtime/core-js/object/assign":"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/babel-runtime/core-js/object/assign.js","check-types":"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/check-types/src/check-types.js"}],"/Users/carl-erik.kopseng/dev_priv/Emissions/app/team-name-map.js":[function(require,module,exports){
'use strict';

var _Object$freeze = require('babel-runtime/core-js/object/freeze')['default'];

var _Object$keys = require('babel-runtime/core-js/object/keys')['default'];

var teamMap = _Object$freeze({
    science: 'forskningsteam',
    communication: 'kommunikasjonsteam',
    security: 'sikkerhetsteam',
    astronaut: 'astronautteam'
});

function otherTeamNames(currentTeamId) {
    return _Object$keys(teamMap).filter(function (n) {
        return n !== currentTeamId && n !== 'leader';
    }).map(function (n) {
        return teamMap[n];
    }).join(', ');
}

module.exports = {
    nameMap: teamMap,
    otherTeamNames: otherTeamNames
};

},{"babel-runtime/core-js/object/freeze":"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/babel-runtime/core-js/object/freeze.js","babel-runtime/core-js/object/keys":"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/babel-runtime/core-js/object/keys.js"}],"/Users/carl-erik.kopseng/dev_priv/Emissions/app/utils.js":[function(require,module,exports){
'use strict';

function cleanRootPath(path) {
    // convert '/science/step1' => 'science'
    return path.replace(/\/?(\w+).*/, '$1');
}

function randomInt(min, max) {
    return Math.floor(Math.random() * (max + 1 - min)) + min;
}

/**
 * Standardize number parsing.
 * @param {string} str is a non-empty string
 * @returns {Number} - possibly NaN
 *
 * The standardization step of converting '1,23' -> '1.23' is strictly not needed when handling inputs from
 * input fields that have type='number', where this happens automatically.
 * The rest of the error handling is useful, none the less.
 */
function parseNumber(str) {
    if (! typeof str === 'string') {
        throw TypeError('This function expects strings. Got something else: ' + str);
    }

    // standardize the number format - removing Norwegian currency format
    var cleanedString = str.trim().replace(',', '.');

    if (!cleanedString.length) {
        throw TypeError('Got a blank string');
    }

    if (cleanedString.indexOf('.') !== -1) {
        return parseFloat(cleanedString, 10);
    } else {
        return parseInt(cleanedString, 10);
    }
}

// generates a UUID
// worlds smallest uuid lib. crazy shit :)
// @see https://gist.github.com/jed/982883
function b(a) {
    return a ? (a ^ Math.random() * 16 >> a / 4).toString(16) : ([10000000] + -1000 + -4000 + -8000 + -100000000000).replace(/[018]/g, b);
}

module.exports = {
    cleanRootPath: cleanRootPath, randomInt: randomInt, parseNumber: parseNumber, uuid: b
};

},{}],"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/babel-runtime/core-js/object/assign.js":[function(require,module,exports){
module.exports = { "default": require("core-js/library/fn/object/assign"), __esModule: true };
},{"core-js/library/fn/object/assign":"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/babel-runtime/node_modules/core-js/library/fn/object/assign.js"}],"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/babel-runtime/core-js/object/freeze.js":[function(require,module,exports){
module.exports = { "default": require("core-js/library/fn/object/freeze"), __esModule: true };
},{"core-js/library/fn/object/freeze":"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/babel-runtime/node_modules/core-js/library/fn/object/freeze.js"}],"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/babel-runtime/core-js/object/keys.js":[function(require,module,exports){
module.exports = { "default": require("core-js/library/fn/object/keys"), __esModule: true };
},{"core-js/library/fn/object/keys":"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/babel-runtime/node_modules/core-js/library/fn/object/keys.js"}],"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/babel-runtime/helpers/class-call-check.js":[function(require,module,exports){
"use strict";

exports["default"] = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};

exports.__esModule = true;
},{}],"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/babel-runtime/helpers/create-class.js":[function(require,module,exports){
"use strict";

exports["default"] = (function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
})();

exports.__esModule = true;
},{}],"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/babel-runtime/helpers/extends.js":[function(require,module,exports){
"use strict";

var _Object$assign = require("babel-runtime/core-js/object/assign")["default"];

exports["default"] = _Object$assign || function (target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i];

    for (var key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        target[key] = source[key];
      }
    }
  }

  return target;
};

exports.__esModule = true;
},{"babel-runtime/core-js/object/assign":"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/babel-runtime/core-js/object/assign.js"}],"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/babel-runtime/helpers/inherits.js":[function(require,module,exports){
"use strict";

exports["default"] = function (subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
  }

  subClass.prototype = Object.create(superClass && superClass.prototype, {
    constructor: {
      value: subClass,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });
  if (superClass) subClass.__proto__ = superClass;
};

exports.__esModule = true;
},{}],"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/babel-runtime/node_modules/core-js/library/fn/object/assign.js":[function(require,module,exports){
require('../../modules/es6.object.assign');
module.exports = require('../../modules/$').core.Object.assign;
},{"../../modules/$":"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/babel-runtime/node_modules/core-js/library/modules/$.js","../../modules/es6.object.assign":"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/babel-runtime/node_modules/core-js/library/modules/es6.object.assign.js"}],"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/babel-runtime/node_modules/core-js/library/fn/object/freeze.js":[function(require,module,exports){
require('../../modules/es6.object.statics-accept-primitives');
module.exports = require('../../modules/$').core.Object.freeze;
},{"../../modules/$":"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/babel-runtime/node_modules/core-js/library/modules/$.js","../../modules/es6.object.statics-accept-primitives":"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/babel-runtime/node_modules/core-js/library/modules/es6.object.statics-accept-primitives.js"}],"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/babel-runtime/node_modules/core-js/library/fn/object/keys.js":[function(require,module,exports){
require('../../modules/es6.object.statics-accept-primitives');
module.exports = require('../../modules/$').core.Object.keys;
},{"../../modules/$":"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/babel-runtime/node_modules/core-js/library/modules/$.js","../../modules/es6.object.statics-accept-primitives":"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/babel-runtime/node_modules/core-js/library/modules/es6.object.statics-accept-primitives.js"}],"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/babel-runtime/node_modules/core-js/library/modules/$.assign.js":[function(require,module,exports){
var $ = require('./$');
// 19.1.2.1 Object.assign(target, source, ...)
/*eslint-disable no-unused-vars */
module.exports = Object.assign || function assign(target, source){
/*eslint-enable no-unused-vars */
  var T = Object($.assertDefined(target))
    , l = arguments.length
    , i = 1;
  while(l > i){
    var S      = $.ES5Object(arguments[i++])
      , keys   = $.getKeys(S)
      , length = keys.length
      , j      = 0
      , key;
    while(length > j)T[key = keys[j++]] = S[key];
  }
  return T;
};
},{"./$":"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/babel-runtime/node_modules/core-js/library/modules/$.js"}],"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/babel-runtime/node_modules/core-js/library/modules/$.def.js":[function(require,module,exports){
var $          = require('./$')
  , global     = $.g
  , core       = $.core
  , isFunction = $.isFunction;
function ctx(fn, that){
  return function(){
    return fn.apply(that, arguments);
  };
}
// type bitmap
$def.F = 1;  // forced
$def.G = 2;  // global
$def.S = 4;  // static
$def.P = 8;  // proto
$def.B = 16; // bind
$def.W = 32; // wrap
function $def(type, name, source){
  var key, own, out, exp
    , isGlobal = type & $def.G
    , target   = isGlobal ? global : type & $def.S
        ? global[name] : (global[name] || {}).prototype
    , exports  = isGlobal ? core : core[name] || (core[name] = {});
  if(isGlobal)source = name;
  for(key in source){
    // contains in native
    own = !(type & $def.F) && target && key in target;
    if(own && key in exports)continue;
    // export native or passed
    out = own ? target[key] : source[key];
    // prevent global pollution for namespaces
    if(isGlobal && !isFunction(target[key]))exp = source[key];
    // bind timers to global for call from export context
    else if(type & $def.B && own)exp = ctx(out, global);
    // wrap global constructors for prevent change them in library
    else if(type & $def.W && target[key] == out)!function(C){
      exp = function(param){
        return this instanceof C ? new C(param) : C(param);
      };
      exp.prototype = C.prototype;
    }(out);
    else exp = type & $def.P && isFunction(out) ? ctx(Function.call, out) : out;
    // export
    $.hide(exports, key, exp);
  }
}
module.exports = $def;
},{"./$":"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/babel-runtime/node_modules/core-js/library/modules/$.js"}],"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/babel-runtime/node_modules/core-js/library/modules/$.fw.js":[function(require,module,exports){
module.exports = function($){
  $.FW   = false;
  $.path = $.core;
  return $;
};
},{}],"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/babel-runtime/node_modules/core-js/library/modules/$.js":[function(require,module,exports){
'use strict';
var global = typeof self != 'undefined' ? self : Function('return this')()
  , core   = {}
  , defineProperty = Object.defineProperty
  , hasOwnProperty = {}.hasOwnProperty
  , ceil  = Math.ceil
  , floor = Math.floor
  , max   = Math.max
  , min   = Math.min;
// The engine works fine with descriptors? Thank's IE8 for his funny defineProperty.
var DESC = !!function(){
  try {
    return defineProperty({}, 'a', {get: function(){ return 2; }}).a == 2;
  } catch(e){ /* empty */ }
}();
var hide = createDefiner(1);
// 7.1.4 ToInteger
function toInteger(it){
  return isNaN(it = +it) ? 0 : (it > 0 ? floor : ceil)(it);
}
function desc(bitmap, value){
  return {
    enumerable  : !(bitmap & 1),
    configurable: !(bitmap & 2),
    writable    : !(bitmap & 4),
    value       : value
  };
}
function simpleSet(object, key, value){
  object[key] = value;
  return object;
}
function createDefiner(bitmap){
  return DESC ? function(object, key, value){
    return $.setDesc(object, key, desc(bitmap, value)); // eslint-disable-line no-use-before-define
  } : simpleSet;
}

function isObject(it){
  return it !== null && (typeof it == 'object' || typeof it == 'function');
}
function isFunction(it){
  return typeof it == 'function';
}
function assertDefined(it){
  if(it == undefined)throw TypeError("Can't call method on  " + it);
  return it;
}

var $ = module.exports = require('./$.fw')({
  g: global,
  core: core,
  html: global.document && document.documentElement,
  // http://jsperf.com/core-js-isobject
  isObject:   isObject,
  isFunction: isFunction,
  it: function(it){
    return it;
  },
  that: function(){
    return this;
  },
  // 7.1.4 ToInteger
  toInteger: toInteger,
  // 7.1.15 ToLength
  toLength: function(it){
    return it > 0 ? min(toInteger(it), 0x1fffffffffffff) : 0; // pow(2, 53) - 1 == 9007199254740991
  },
  toIndex: function(index, length){
    index = toInteger(index);
    return index < 0 ? max(index + length, 0) : min(index, length);
  },
  has: function(it, key){
    return hasOwnProperty.call(it, key);
  },
  create:     Object.create,
  getProto:   Object.getPrototypeOf,
  DESC:       DESC,
  desc:       desc,
  getDesc:    Object.getOwnPropertyDescriptor,
  setDesc:    defineProperty,
  getKeys:    Object.keys,
  getNames:   Object.getOwnPropertyNames,
  getSymbols: Object.getOwnPropertySymbols,
  // Dummy, fix for not array-like ES3 string in es5 module
  assertDefined: assertDefined,
  ES5Object: Object,
  toObject: function(it){
    return $.ES5Object(assertDefined(it));
  },
  hide: hide,
  def: createDefiner(0),
  set: global.Symbol ? simpleSet : hide,
  mix: function(target, src){
    for(var key in src)hide(target, key, src[key]);
    return target;
  },
  each: [].forEach
});
if(typeof __e != 'undefined')__e = core;
if(typeof __g != 'undefined')__g = global;
},{"./$.fw":"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/babel-runtime/node_modules/core-js/library/modules/$.fw.js"}],"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/babel-runtime/node_modules/core-js/library/modules/es6.object.assign.js":[function(require,module,exports){
// 19.1.3.1 Object.assign(target, source)
var $def = require('./$.def');
$def($def.S, 'Object', {assign: require('./$.assign')});
},{"./$.assign":"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/babel-runtime/node_modules/core-js/library/modules/$.assign.js","./$.def":"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/babel-runtime/node_modules/core-js/library/modules/$.def.js"}],"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/babel-runtime/node_modules/core-js/library/modules/es6.object.statics-accept-primitives.js":[function(require,module,exports){
var $        = require('./$')
  , $def     = require('./$.def')
  , isObject = $.isObject
  , toObject = $.toObject;
function wrapObjectMethod(METHOD, MODE){
  var fn  = ($.core.Object || {})[METHOD] || Object[METHOD]
    , f   = 0
    , o   = {};
  o[METHOD] = MODE == 1 ? function(it){
    return isObject(it) ? fn(it) : it;
  } : MODE == 2 ? function(it){
    return isObject(it) ? fn(it) : true;
  } : MODE == 3 ? function(it){
    return isObject(it) ? fn(it) : false;
  } : MODE == 4 ? function getOwnPropertyDescriptor(it, key){
    return fn(toObject(it), key);
  } : MODE == 5 ? function getPrototypeOf(it){
    return fn(Object($.assertDefined(it)));
  } : function(it){
    return fn(toObject(it));
  };
  try {
    fn('z');
  } catch(e){
    f = 1;
  }
  $def($def.S + $def.F * f, 'Object', o);
}
wrapObjectMethod('freeze', 1);
wrapObjectMethod('seal', 1);
wrapObjectMethod('preventExtensions', 1);
wrapObjectMethod('isFrozen', 2);
wrapObjectMethod('isSealed', 2);
wrapObjectMethod('isExtensible', 3);
wrapObjectMethod('getOwnPropertyDescriptor', 4);
wrapObjectMethod('getPrototypeOf', 5);
wrapObjectMethod('keys');
wrapObjectMethod('getOwnPropertyNames');
},{"./$":"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/babel-runtime/node_modules/core-js/library/modules/$.js","./$.def":"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/babel-runtime/node_modules/core-js/library/modules/$.def.js"}],"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/browserify/node_modules/browser-resolve/empty.js":[function(require,module,exports){

},{}],"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/browserify/node_modules/buffer/index.js":[function(require,module,exports){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
 * @license  MIT
 */

var base64 = require('base64-js')
var ieee754 = require('ieee754')
var isArray = require('is-array')

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50
Buffer.poolSize = 8192 // not used by this implementation

var kMaxLength = 0x3fffffff
var rootParent = {}

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Use Object implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * Note:
 *
 * - Implementation must support adding new properties to `Uint8Array` instances.
 *   Firefox 4-29 lacked support, fixed in Firefox 30+.
 *   See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438.
 *
 *  - Chrome 9-10 is missing the `TypedArray.prototype.subarray` function.
 *
 *  - IE10 has a broken `TypedArray.prototype.subarray` function which returns arrays of
 *    incorrect length in some situations.
 *
 * We detect these buggy browsers and set `Buffer.TYPED_ARRAY_SUPPORT` to `false` so they will
 * get the Object implementation, which is slower but will work correctly.
 */
Buffer.TYPED_ARRAY_SUPPORT = (function () {
  try {
    var buf = new ArrayBuffer(0)
    var arr = new Uint8Array(buf)
    arr.foo = function () { return 42 }
    return arr.foo() === 42 && // typed array instances can be augmented
        typeof arr.subarray === 'function' && // chrome 9-10 lack `subarray`
        new Uint8Array(1).subarray(1, 1).byteLength === 0 // ie10 has broken `subarray`
  } catch (e) {
    return false
  }
})()

/**
 * Class: Buffer
 * =============
 *
 * The Buffer constructor returns instances of `Uint8Array` that are augmented
 * with function properties for all the node `Buffer` API functions. We use
 * `Uint8Array` so that square bracket notation works as expected -- it returns
 * a single octet.
 *
 * By augmenting the instances, we can avoid modifying the `Uint8Array`
 * prototype.
 */
function Buffer (subject, encoding) {
  var self = this
  if (!(self instanceof Buffer)) return new Buffer(subject, encoding)

  var type = typeof subject
  var length

  if (type === 'number') {
    length = +subject
  } else if (type === 'string') {
    length = Buffer.byteLength(subject, encoding)
  } else if (type === 'object' && subject !== null) {
    // assume object is array-like
    if (subject.type === 'Buffer' && isArray(subject.data)) subject = subject.data
    length = +subject.length
  } else {
    throw new TypeError('must start with number, buffer, array or string')
  }

  if (length > kMaxLength) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum size: 0x' +
      kMaxLength.toString(16) + ' bytes')
  }

  if (length < 0) length = 0
  else length >>>= 0 // coerce to uint32

  if (Buffer.TYPED_ARRAY_SUPPORT) {
    // Preferred: Return an augmented `Uint8Array` instance for best performance
    self = Buffer._augment(new Uint8Array(length)) // eslint-disable-line consistent-this
  } else {
    // Fallback: Return THIS instance of Buffer (created by `new`)
    self.length = length
    self._isBuffer = true
  }

  var i
  if (Buffer.TYPED_ARRAY_SUPPORT && typeof subject.byteLength === 'number') {
    // Speed optimization -- use set if we're copying from a typed array
    self._set(subject)
  } else if (isArrayish(subject)) {
    // Treat array-ish objects as a byte array
    if (Buffer.isBuffer(subject)) {
      for (i = 0; i < length; i++) {
        self[i] = subject.readUInt8(i)
      }
    } else {
      for (i = 0; i < length; i++) {
        self[i] = ((subject[i] % 256) + 256) % 256
      }
    }
  } else if (type === 'string') {
    self.write(subject, 0, encoding)
  } else if (type === 'number' && !Buffer.TYPED_ARRAY_SUPPORT) {
    for (i = 0; i < length; i++) {
      self[i] = 0
    }
  }

  if (length > 0 && length <= Buffer.poolSize) self.parent = rootParent

  return self
}

function SlowBuffer (subject, encoding) {
  if (!(this instanceof SlowBuffer)) return new SlowBuffer(subject, encoding)

  var buf = new Buffer(subject, encoding)
  delete buf.parent
  return buf
}

Buffer.isBuffer = function isBuffer (b) {
  return !!(b != null && b._isBuffer)
}

Buffer.compare = function compare (a, b) {
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError('Arguments must be Buffers')
  }

  if (a === b) return 0

  var x = a.length
  var y = b.length
  for (var i = 0, len = Math.min(x, y); i < len && a[i] === b[i]; i++) {}
  if (i !== len) {
    x = a[i]
    y = b[i]
  }
  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'binary':
    case 'base64':
    case 'raw':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function concat (list, totalLength) {
  if (!isArray(list)) throw new TypeError('list argument must be an Array of Buffers.')

  if (list.length === 0) {
    return new Buffer(0)
  } else if (list.length === 1) {
    return list[0]
  }

  var i
  if (totalLength === undefined) {
    totalLength = 0
    for (i = 0; i < list.length; i++) {
      totalLength += list[i].length
    }
  }

  var buf = new Buffer(totalLength)
  var pos = 0
  for (i = 0; i < list.length; i++) {
    var item = list[i]
    item.copy(buf, pos)
    pos += item.length
  }
  return buf
}

Buffer.byteLength = function byteLength (str, encoding) {
  var ret
  str = str + ''
  switch (encoding || 'utf8') {
    case 'ascii':
    case 'binary':
    case 'raw':
      ret = str.length
      break
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      ret = str.length * 2
      break
    case 'hex':
      ret = str.length >>> 1
      break
    case 'utf8':
    case 'utf-8':
      ret = utf8ToBytes(str).length
      break
    case 'base64':
      ret = base64ToBytes(str).length
      break
    default:
      ret = str.length
  }
  return ret
}

// pre-set for values that may exist in the future
Buffer.prototype.length = undefined
Buffer.prototype.parent = undefined

// toString(encoding, start=0, end=buffer.length)
Buffer.prototype.toString = function toString (encoding, start, end) {
  var loweredCase = false

  start = start >>> 0
  end = end === undefined || end === Infinity ? this.length : end >>> 0

  if (!encoding) encoding = 'utf8'
  if (start < 0) start = 0
  if (end > this.length) end = this.length
  if (end <= start) return ''

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'binary':
        return binarySlice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  if (this.length > 0) {
    str = this.toString('hex', 0, max).match(/.{2}/g).join(' ')
    if (this.length > max) str += ' ... '
  }
  return '<Buffer ' + str + '>'
}

Buffer.prototype.compare = function compare (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return 0
  return Buffer.compare(this, b)
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset) {
  if (byteOffset > 0x7fffffff) byteOffset = 0x7fffffff
  else if (byteOffset < -0x80000000) byteOffset = -0x80000000
  byteOffset >>= 0

  if (this.length === 0) return -1
  if (byteOffset >= this.length) return -1

  // Negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = Math.max(this.length + byteOffset, 0)

  if (typeof val === 'string') {
    if (val.length === 0) return -1 // special case: looking for empty string always fails
    return String.prototype.indexOf.call(this, val, byteOffset)
  }
  if (Buffer.isBuffer(val)) {
    return arrayIndexOf(this, val, byteOffset)
  }
  if (typeof val === 'number') {
    if (Buffer.TYPED_ARRAY_SUPPORT && Uint8Array.prototype.indexOf === 'function') {
      return Uint8Array.prototype.indexOf.call(this, val, byteOffset)
    }
    return arrayIndexOf(this, [ val ], byteOffset)
  }

  function arrayIndexOf (arr, val, byteOffset) {
    var foundIndex = -1
    for (var i = 0; byteOffset + i < arr.length; i++) {
      if (arr[byteOffset + i] === val[foundIndex === -1 ? 0 : i - foundIndex]) {
        if (foundIndex === -1) foundIndex = i
        if (i - foundIndex + 1 === val.length) return byteOffset + foundIndex
      } else {
        foundIndex = -1
      }
    }
    return -1
  }

  throw new TypeError('val must be string, number or Buffer')
}

// `get` will be removed in Node 0.13+
Buffer.prototype.get = function get (offset) {
  console.log('.get() is deprecated. Access using array indexes instead.')
  return this.readUInt8(offset)
}

// `set` will be removed in Node 0.13+
Buffer.prototype.set = function set (v, offset) {
  console.log('.set() is deprecated. Access using array indexes instead.')
  return this.writeUInt8(v, offset)
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  // must be an even number of digits
  var strLen = string.length
  if (strLen % 2 !== 0) throw new Error('Invalid hex string')

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; i++) {
    var parsed = parseInt(string.substr(i * 2, 2), 16)
    if (isNaN(parsed)) throw new Error('Invalid hex string')
    buf[offset + i] = parsed
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  var charsWritten = blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
  return charsWritten
}

function asciiWrite (buf, string, offset, length) {
  var charsWritten = blitBuffer(asciiToBytes(string), buf, offset, length)
  return charsWritten
}

function binaryWrite (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  var charsWritten = blitBuffer(base64ToBytes(string), buf, offset, length)
  return charsWritten
}

function utf16leWrite (buf, string, offset, length) {
  var charsWritten = blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
  return charsWritten
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Support both (string, offset, length, encoding)
  // and the legacy (string, encoding, offset, length)
  if (isFinite(offset)) {
    if (!isFinite(length)) {
      encoding = length
      length = undefined
    }
  } else {  // legacy
    var swap = encoding
    encoding = offset
    offset = length
    length = swap
  }

  offset = Number(offset) || 0

  if (length < 0 || offset < 0 || offset > this.length) {
    throw new RangeError('attempt to write outside buffer bounds')
  }

  var remaining = this.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }
  encoding = String(encoding || 'utf8').toLowerCase()

  var ret
  switch (encoding) {
    case 'hex':
      ret = hexWrite(this, string, offset, length)
      break
    case 'utf8':
    case 'utf-8':
      ret = utf8Write(this, string, offset, length)
      break
    case 'ascii':
      ret = asciiWrite(this, string, offset, length)
      break
    case 'binary':
      ret = binaryWrite(this, string, offset, length)
      break
    case 'base64':
      ret = base64Write(this, string, offset, length)
      break
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      ret = utf16leWrite(this, string, offset, length)
      break
    default:
      throw new TypeError('Unknown encoding: ' + encoding)
  }
  return ret
}

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  var res = ''
  var tmp = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; i++) {
    if (buf[i] <= 0x7F) {
      res += decodeUtf8Char(tmp) + String.fromCharCode(buf[i])
      tmp = ''
    } else {
      tmp += '%' + buf[i].toString(16)
    }
  }

  return res + decodeUtf8Char(tmp)
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; i++) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function binarySlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; i++) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; i++) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256)
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0) start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0) end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start) end = start

  var newBuf
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    newBuf = Buffer._augment(this.subarray(start, end))
  } else {
    var sliceLen = end - start
    newBuf = new Buffer(sliceLen, undefined)
    for (var i = 0; i < sliceLen; i++) {
      newBuf[i] = this[i + start]
    }
  }

  if (newBuf.length) newBuf.parent = this.parent || this

  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }

  return val
}

Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length)
  }

  var val = this[offset + --byteLength]
  var mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul
  }

  return val
}

Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var i = byteLength
  var mul = 1
  var val = this[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('buffer must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('value is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('index out of range')
}

Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkInt(this, value, offset, byteLength, Math.pow(2, 8 * byteLength), 0)

  var mul = 1
  var i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) >>> 0 & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkInt(this, value, offset, byteLength, Math.pow(2, 8 * byteLength), 0)

  var i = byteLength - 1
  var mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) >>> 0 & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
  this[offset] = value
  return offset + 1
}

function objectWriteUInt16 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffff + value + 1
  for (var i = 0, j = Math.min(buf.length - offset, 2); i < j; i++) {
    buf[offset + i] = (value & (0xff << (8 * (littleEndian ? i : 1 - i)))) >>>
      (littleEndian ? i : 1 - i) * 8
  }
}

Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = value
    this[offset + 1] = (value >>> 8)
  } else {
    objectWriteUInt16(this, value, offset, true)
  }
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8)
    this[offset + 1] = value
  } else {
    objectWriteUInt16(this, value, offset, false)
  }
  return offset + 2
}

function objectWriteUInt32 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffffffff + value + 1
  for (var i = 0, j = Math.min(buf.length - offset, 4); i < j; i++) {
    buf[offset + i] = (value >>> (littleEndian ? i : 3 - i) * 8) & 0xff
  }
}

Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset + 3] = (value >>> 24)
    this[offset + 2] = (value >>> 16)
    this[offset + 1] = (value >>> 8)
    this[offset] = value
  } else {
    objectWriteUInt32(this, value, offset, true)
  }
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24)
    this[offset + 1] = (value >>> 16)
    this[offset + 2] = (value >>> 8)
    this[offset + 3] = value
  } else {
    objectWriteUInt32(this, value, offset, false)
  }
  return offset + 4
}

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkInt(
      this, value, offset, byteLength,
      Math.pow(2, 8 * byteLength - 1) - 1,
      -Math.pow(2, 8 * byteLength - 1)
    )
  }

  var i = 0
  var mul = 1
  var sub = value < 0 ? 1 : 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkInt(
      this, value, offset, byteLength,
      Math.pow(2, 8 * byteLength - 1) - 1,
      -Math.pow(2, 8 * byteLength - 1)
    )
  }

  var i = byteLength - 1
  var mul = 1
  var sub = value < 0 ? 1 : 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
  if (value < 0) value = 0xff + value + 1
  this[offset] = value
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = value
    this[offset + 1] = (value >>> 8)
  } else {
    objectWriteUInt16(this, value, offset, true)
  }
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8)
    this[offset + 1] = value
  } else {
    objectWriteUInt16(this, value, offset, false)
  }
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = value
    this[offset + 1] = (value >>> 8)
    this[offset + 2] = (value >>> 16)
    this[offset + 3] = (value >>> 24)
  } else {
    objectWriteUInt32(this, value, offset, true)
  }
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24)
    this[offset + 1] = (value >>> 16)
    this[offset + 2] = (value >>> 8)
    this[offset + 3] = value
  } else {
    objectWriteUInt32(this, value, offset, false)
  }
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (value > max || value < min) throw new RangeError('value is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('index out of range')
  if (offset < 0) throw new RangeError('index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, target_start, start, end) {
  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (target_start >= target.length) target_start = target.length
  if (!target_start) target_start = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (target_start < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('sourceStart out of bounds')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length
  if (target.length - target_start < end - start) {
    end = target.length - target_start + start
  }

  var len = end - start

  if (len < 1000 || !Buffer.TYPED_ARRAY_SUPPORT) {
    for (var i = 0; i < len; i++) {
      target[i + target_start] = this[i + start]
    }
  } else {
    target._set(this.subarray(start, start + len), target_start)
  }

  return len
}

// fill(value, start=0, end=buffer.length)
Buffer.prototype.fill = function fill (value, start, end) {
  if (!value) value = 0
  if (!start) start = 0
  if (!end) end = this.length

  if (end < start) throw new RangeError('end < start')

  // Fill 0 bytes; we're done
  if (end === start) return
  if (this.length === 0) return

  if (start < 0 || start >= this.length) throw new RangeError('start out of bounds')
  if (end < 0 || end > this.length) throw new RangeError('end out of bounds')

  var i
  if (typeof value === 'number') {
    for (i = start; i < end; i++) {
      this[i] = value
    }
  } else {
    var bytes = utf8ToBytes(value.toString())
    var len = bytes.length
    for (i = start; i < end; i++) {
      this[i] = bytes[i % len]
    }
  }

  return this
}

/**
 * Creates a new `ArrayBuffer` with the *copied* memory of the buffer instance.
 * Added in Node 0.12. Only available in browsers that support ArrayBuffer.
 */
Buffer.prototype.toArrayBuffer = function toArrayBuffer () {
  if (typeof Uint8Array !== 'undefined') {
    if (Buffer.TYPED_ARRAY_SUPPORT) {
      return (new Buffer(this)).buffer
    } else {
      var buf = new Uint8Array(this.length)
      for (var i = 0, len = buf.length; i < len; i += 1) {
        buf[i] = this[i]
      }
      return buf.buffer
    }
  } else {
    throw new TypeError('Buffer.toArrayBuffer not supported in this browser')
  }
}

// HELPER FUNCTIONS
// ================

var BP = Buffer.prototype

/**
 * Augment a Uint8Array *instance* (not the Uint8Array class!) with Buffer methods
 */
Buffer._augment = function _augment (arr) {
  arr.constructor = Buffer
  arr._isBuffer = true

  // save reference to original Uint8Array set method before overwriting
  arr._set = arr.set

  // deprecated, will be removed in node 0.13+
  arr.get = BP.get
  arr.set = BP.set

  arr.write = BP.write
  arr.toString = BP.toString
  arr.toLocaleString = BP.toString
  arr.toJSON = BP.toJSON
  arr.equals = BP.equals
  arr.compare = BP.compare
  arr.indexOf = BP.indexOf
  arr.copy = BP.copy
  arr.slice = BP.slice
  arr.readUIntLE = BP.readUIntLE
  arr.readUIntBE = BP.readUIntBE
  arr.readUInt8 = BP.readUInt8
  arr.readUInt16LE = BP.readUInt16LE
  arr.readUInt16BE = BP.readUInt16BE
  arr.readUInt32LE = BP.readUInt32LE
  arr.readUInt32BE = BP.readUInt32BE
  arr.readIntLE = BP.readIntLE
  arr.readIntBE = BP.readIntBE
  arr.readInt8 = BP.readInt8
  arr.readInt16LE = BP.readInt16LE
  arr.readInt16BE = BP.readInt16BE
  arr.readInt32LE = BP.readInt32LE
  arr.readInt32BE = BP.readInt32BE
  arr.readFloatLE = BP.readFloatLE
  arr.readFloatBE = BP.readFloatBE
  arr.readDoubleLE = BP.readDoubleLE
  arr.readDoubleBE = BP.readDoubleBE
  arr.writeUInt8 = BP.writeUInt8
  arr.writeUIntLE = BP.writeUIntLE
  arr.writeUIntBE = BP.writeUIntBE
  arr.writeUInt16LE = BP.writeUInt16LE
  arr.writeUInt16BE = BP.writeUInt16BE
  arr.writeUInt32LE = BP.writeUInt32LE
  arr.writeUInt32BE = BP.writeUInt32BE
  arr.writeIntLE = BP.writeIntLE
  arr.writeIntBE = BP.writeIntBE
  arr.writeInt8 = BP.writeInt8
  arr.writeInt16LE = BP.writeInt16LE
  arr.writeInt16BE = BP.writeInt16BE
  arr.writeInt32LE = BP.writeInt32LE
  arr.writeInt32BE = BP.writeInt32BE
  arr.writeFloatLE = BP.writeFloatLE
  arr.writeFloatBE = BP.writeFloatBE
  arr.writeDoubleLE = BP.writeDoubleLE
  arr.writeDoubleBE = BP.writeDoubleBE
  arr.fill = BP.fill
  arr.inspect = BP.inspect
  arr.toArrayBuffer = BP.toArrayBuffer

  return arr
}

var INVALID_BASE64_RE = /[^+\/0-9A-z\-]/g

function base64clean (str) {
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = stringtrim(str).replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function stringtrim (str) {
  if (str.trim) return str.trim()
  return str.replace(/^\s+|\s+$/g, '')
}

function isArrayish (subject) {
  return isArray(subject) || Buffer.isBuffer(subject) ||
      subject && typeof subject === 'object' &&
      typeof subject.length === 'number'
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (string, units) {
  units = units || Infinity
  var codePoint
  var length = string.length
  var leadSurrogate = null
  var bytes = []
  var i = 0

  for (; i < length; i++) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (leadSurrogate) {
        // 2 leads in a row
        if (codePoint < 0xDC00) {
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          leadSurrogate = codePoint
          continue
        } else {
          // valid surrogate pair
          codePoint = leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00 | 0x10000
          leadSurrogate = null
        }
      } else {
        // no lead yet

        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else {
          // valid lead
          leadSurrogate = codePoint
          continue
        }
      }
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
      leadSurrogate = null
    }

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x200000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; i++) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; i++) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; i++) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

function decodeUtf8Char (str) {
  try {
    return decodeURIComponent(str)
  } catch (err) {
    return String.fromCharCode(0xFFFD) // UTF 8 invalid char
  }
}

},{"base64-js":"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/browserify/node_modules/buffer/node_modules/base64-js/lib/b64.js","ieee754":"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/browserify/node_modules/buffer/node_modules/ieee754/index.js","is-array":"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/browserify/node_modules/buffer/node_modules/is-array/index.js"}],"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/browserify/node_modules/buffer/node_modules/base64-js/lib/b64.js":[function(require,module,exports){
var lookup = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

;(function (exports) {
	'use strict';

  var Arr = (typeof Uint8Array !== 'undefined')
    ? Uint8Array
    : Array

	var PLUS   = '+'.charCodeAt(0)
	var SLASH  = '/'.charCodeAt(0)
	var NUMBER = '0'.charCodeAt(0)
	var LOWER  = 'a'.charCodeAt(0)
	var UPPER  = 'A'.charCodeAt(0)
	var PLUS_URL_SAFE = '-'.charCodeAt(0)
	var SLASH_URL_SAFE = '_'.charCodeAt(0)

	function decode (elt) {
		var code = elt.charCodeAt(0)
		if (code === PLUS ||
		    code === PLUS_URL_SAFE)
			return 62 // '+'
		if (code === SLASH ||
		    code === SLASH_URL_SAFE)
			return 63 // '/'
		if (code < NUMBER)
			return -1 //no match
		if (code < NUMBER + 10)
			return code - NUMBER + 26 + 26
		if (code < UPPER + 26)
			return code - UPPER
		if (code < LOWER + 26)
			return code - LOWER + 26
	}

	function b64ToByteArray (b64) {
		var i, j, l, tmp, placeHolders, arr

		if (b64.length % 4 > 0) {
			throw new Error('Invalid string. Length must be a multiple of 4')
		}

		// the number of equal signs (place holders)
		// if there are two placeholders, than the two characters before it
		// represent one byte
		// if there is only one, then the three characters before it represent 2 bytes
		// this is just a cheap hack to not do indexOf twice
		var len = b64.length
		placeHolders = '=' === b64.charAt(len - 2) ? 2 : '=' === b64.charAt(len - 1) ? 1 : 0

		// base64 is 4/3 + up to two characters of the original data
		arr = new Arr(b64.length * 3 / 4 - placeHolders)

		// if there are placeholders, only get up to the last complete 4 chars
		l = placeHolders > 0 ? b64.length - 4 : b64.length

		var L = 0

		function push (v) {
			arr[L++] = v
		}

		for (i = 0, j = 0; i < l; i += 4, j += 3) {
			tmp = (decode(b64.charAt(i)) << 18) | (decode(b64.charAt(i + 1)) << 12) | (decode(b64.charAt(i + 2)) << 6) | decode(b64.charAt(i + 3))
			push((tmp & 0xFF0000) >> 16)
			push((tmp & 0xFF00) >> 8)
			push(tmp & 0xFF)
		}

		if (placeHolders === 2) {
			tmp = (decode(b64.charAt(i)) << 2) | (decode(b64.charAt(i + 1)) >> 4)
			push(tmp & 0xFF)
		} else if (placeHolders === 1) {
			tmp = (decode(b64.charAt(i)) << 10) | (decode(b64.charAt(i + 1)) << 4) | (decode(b64.charAt(i + 2)) >> 2)
			push((tmp >> 8) & 0xFF)
			push(tmp & 0xFF)
		}

		return arr
	}

	function uint8ToBase64 (uint8) {
		var i,
			extraBytes = uint8.length % 3, // if we have 1 byte left, pad 2 bytes
			output = "",
			temp, length

		function encode (num) {
			return lookup.charAt(num)
		}

		function tripletToBase64 (num) {
			return encode(num >> 18 & 0x3F) + encode(num >> 12 & 0x3F) + encode(num >> 6 & 0x3F) + encode(num & 0x3F)
		}

		// go through the array every three bytes, we'll deal with trailing stuff later
		for (i = 0, length = uint8.length - extraBytes; i < length; i += 3) {
			temp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2])
			output += tripletToBase64(temp)
		}

		// pad the end with zeros, but make sure to not forget the extra bytes
		switch (extraBytes) {
			case 1:
				temp = uint8[uint8.length - 1]
				output += encode(temp >> 2)
				output += encode((temp << 4) & 0x3F)
				output += '=='
				break
			case 2:
				temp = (uint8[uint8.length - 2] << 8) + (uint8[uint8.length - 1])
				output += encode(temp >> 10)
				output += encode((temp >> 4) & 0x3F)
				output += encode((temp << 2) & 0x3F)
				output += '='
				break
		}

		return output
	}

	exports.toByteArray = b64ToByteArray
	exports.fromByteArray = uint8ToBase64
}(typeof exports === 'undefined' ? (this.base64js = {}) : exports))

},{}],"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/browserify/node_modules/buffer/node_modules/ieee754/index.js":[function(require,module,exports){
exports.read = function(buffer, offset, isLE, mLen, nBytes) {
  var e, m,
      eLen = nBytes * 8 - mLen - 1,
      eMax = (1 << eLen) - 1,
      eBias = eMax >> 1,
      nBits = -7,
      i = isLE ? (nBytes - 1) : 0,
      d = isLE ? -1 : 1,
      s = buffer[offset + i];

  i += d;

  e = s & ((1 << (-nBits)) - 1);
  s >>= (-nBits);
  nBits += eLen;
  for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8);

  m = e & ((1 << (-nBits)) - 1);
  e >>= (-nBits);
  nBits += mLen;
  for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8);

  if (e === 0) {
    e = 1 - eBias;
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity);
  } else {
    m = m + Math.pow(2, mLen);
    e = e - eBias;
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen);
};

exports.write = function(buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c,
      eLen = nBytes * 8 - mLen - 1,
      eMax = (1 << eLen) - 1,
      eBias = eMax >> 1,
      rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0),
      i = isLE ? 0 : (nBytes - 1),
      d = isLE ? 1 : -1,
      s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0;

  value = Math.abs(value);

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0;
    e = eMax;
  } else {
    e = Math.floor(Math.log(value) / Math.LN2);
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--;
      c *= 2;
    }
    if (e + eBias >= 1) {
      value += rt / c;
    } else {
      value += rt * Math.pow(2, 1 - eBias);
    }
    if (value * c >= 2) {
      e++;
      c /= 2;
    }

    if (e + eBias >= eMax) {
      m = 0;
      e = eMax;
    } else if (e + eBias >= 1) {
      m = (value * c - 1) * Math.pow(2, mLen);
      e = e + eBias;
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen);
      e = 0;
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8);

  e = (e << mLen) | m;
  eLen += mLen;
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8);

  buffer[offset + i - d] |= s * 128;
};

},{}],"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/browserify/node_modules/buffer/node_modules/is-array/index.js":[function(require,module,exports){

/**
 * isArray
 */

var isArray = Array.isArray;

/**
 * toString
 */

var str = Object.prototype.toString;

/**
 * Whether or not the given `val`
 * is an array.
 *
 * example:
 *
 *        isArray([]);
 *        // > true
 *        isArray(arguments);
 *        // > false
 *        isArray('');
 *        // > false
 *
 * @param {mixed} val
 * @return {bool}
 */

module.exports = isArray || function (val) {
  return !! val && '[object Array]' == str.call(val);
};

},{}],"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/browserify/node_modules/events/events.js":[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      }
      throw TypeError('Uncaught, unspecified "error" event.');
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        len = arguments.length;
        args = new Array(len - 1);
        for (i = 1; i < len; i++)
          args[i - 1] = arguments[i];
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    len = arguments.length;
    args = new Array(len - 1);
    for (i = 1; i < len; i++)
      args[i - 1] = arguments[i];

    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    var m;
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.listenerCount = function(emitter, type) {
  var ret;
  if (!emitter._events || !emitter._events[type])
    ret = 0;
  else if (isFunction(emitter._events[type]))
    ret = 1;
  else
    ret = emitter._events[type].length;
  return ret;
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}],"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/browserify/node_modules/inherits/inherits_browser.js":[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/browserify/node_modules/isarray/index.js":[function(require,module,exports){
module.exports = Array.isArray || function (arr) {
  return Object.prototype.toString.call(arr) == '[object Array]';
};

},{}],"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/browserify/node_modules/process/browser.js":[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};
var queue = [];
var draining = false;

function drainQueue() {
    if (draining) {
        return;
    }
    draining = true;
    var currentQueue;
    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        var i = -1;
        while (++i < len) {
            currentQueue[i]();
        }
        len = queue.length;
    }
    draining = false;
}
process.nextTick = function (fun) {
    queue.push(fun);
    if (!draining) {
        setTimeout(drainQueue, 0);
    }
};

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/browserify/node_modules/readable-stream/duplex.js":[function(require,module,exports){
module.exports = require("./lib/_stream_duplex.js")

},{"./lib/_stream_duplex.js":"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/browserify/node_modules/readable-stream/lib/_stream_duplex.js"}],"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/browserify/node_modules/readable-stream/lib/_stream_duplex.js":[function(require,module,exports){
(function (process){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// a duplex stream is just a stream that is both readable and writable.
// Since JS doesn't have multiple prototypal inheritance, this class
// prototypally inherits from Readable, and then parasitically from
// Writable.

module.exports = Duplex;

/*<replacement>*/
var objectKeys = Object.keys || function (obj) {
  var keys = [];
  for (var key in obj) keys.push(key);
  return keys;
}
/*</replacement>*/


/*<replacement>*/
var util = require('core-util-is');
util.inherits = require('inherits');
/*</replacement>*/

var Readable = require('./_stream_readable');
var Writable = require('./_stream_writable');

util.inherits(Duplex, Readable);

forEach(objectKeys(Writable.prototype), function(method) {
  if (!Duplex.prototype[method])
    Duplex.prototype[method] = Writable.prototype[method];
});

function Duplex(options) {
  if (!(this instanceof Duplex))
    return new Duplex(options);

  Readable.call(this, options);
  Writable.call(this, options);

  if (options && options.readable === false)
    this.readable = false;

  if (options && options.writable === false)
    this.writable = false;

  this.allowHalfOpen = true;
  if (options && options.allowHalfOpen === false)
    this.allowHalfOpen = false;

  this.once('end', onend);
}

// the no-half-open enforcer
function onend() {
  // if we allow half-open state, or if the writable side ended,
  // then we're ok.
  if (this.allowHalfOpen || this._writableState.ended)
    return;

  // no more data can be written.
  // But allow more writes to happen in this tick.
  process.nextTick(this.end.bind(this));
}

function forEach (xs, f) {
  for (var i = 0, l = xs.length; i < l; i++) {
    f(xs[i], i);
  }
}

}).call(this,require('_process'))

},{"./_stream_readable":"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/browserify/node_modules/readable-stream/lib/_stream_readable.js","./_stream_writable":"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/browserify/node_modules/readable-stream/lib/_stream_writable.js","_process":"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/browserify/node_modules/process/browser.js","core-util-is":"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/browserify/node_modules/readable-stream/node_modules/core-util-is/lib/util.js","inherits":"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/browserify/node_modules/inherits/inherits_browser.js"}],"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/browserify/node_modules/readable-stream/lib/_stream_passthrough.js":[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// a passthrough stream.
// basically just the most minimal sort of Transform stream.
// Every written chunk gets output as-is.

module.exports = PassThrough;

var Transform = require('./_stream_transform');

/*<replacement>*/
var util = require('core-util-is');
util.inherits = require('inherits');
/*</replacement>*/

util.inherits(PassThrough, Transform);

function PassThrough(options) {
  if (!(this instanceof PassThrough))
    return new PassThrough(options);

  Transform.call(this, options);
}

PassThrough.prototype._transform = function(chunk, encoding, cb) {
  cb(null, chunk);
};

},{"./_stream_transform":"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/browserify/node_modules/readable-stream/lib/_stream_transform.js","core-util-is":"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/browserify/node_modules/readable-stream/node_modules/core-util-is/lib/util.js","inherits":"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/browserify/node_modules/inherits/inherits_browser.js"}],"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/browserify/node_modules/readable-stream/lib/_stream_readable.js":[function(require,module,exports){
(function (process){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

module.exports = Readable;

/*<replacement>*/
var isArray = require('isarray');
/*</replacement>*/


/*<replacement>*/
var Buffer = require('buffer').Buffer;
/*</replacement>*/

Readable.ReadableState = ReadableState;

var EE = require('events').EventEmitter;

/*<replacement>*/
if (!EE.listenerCount) EE.listenerCount = function(emitter, type) {
  return emitter.listeners(type).length;
};
/*</replacement>*/

var Stream = require('stream');

/*<replacement>*/
var util = require('core-util-is');
util.inherits = require('inherits');
/*</replacement>*/

var StringDecoder;


/*<replacement>*/
var debug = require('util');
if (debug && debug.debuglog) {
  debug = debug.debuglog('stream');
} else {
  debug = function () {};
}
/*</replacement>*/


util.inherits(Readable, Stream);

function ReadableState(options, stream) {
  var Duplex = require('./_stream_duplex');

  options = options || {};

  // the point at which it stops calling _read() to fill the buffer
  // Note: 0 is a valid value, means "don't call _read preemptively ever"
  var hwm = options.highWaterMark;
  var defaultHwm = options.objectMode ? 16 : 16 * 1024;
  this.highWaterMark = (hwm || hwm === 0) ? hwm : defaultHwm;

  // cast to ints.
  this.highWaterMark = ~~this.highWaterMark;

  this.buffer = [];
  this.length = 0;
  this.pipes = null;
  this.pipesCount = 0;
  this.flowing = null;
  this.ended = false;
  this.endEmitted = false;
  this.reading = false;

  // a flag to be able to tell if the onwrite cb is called immediately,
  // or on a later tick.  We set this to true at first, because any
  // actions that shouldn't happen until "later" should generally also
  // not happen before the first write call.
  this.sync = true;

  // whenever we return null, then we set a flag to say
  // that we're awaiting a 'readable' event emission.
  this.needReadable = false;
  this.emittedReadable = false;
  this.readableListening = false;


  // object stream flag. Used to make read(n) ignore n and to
  // make all the buffer merging and length checks go away
  this.objectMode = !!options.objectMode;

  if (stream instanceof Duplex)
    this.objectMode = this.objectMode || !!options.readableObjectMode;

  // Crypto is kind of old and crusty.  Historically, its default string
  // encoding is 'binary' so we have to make this configurable.
  // Everything else in the universe uses 'utf8', though.
  this.defaultEncoding = options.defaultEncoding || 'utf8';

  // when piping, we only care about 'readable' events that happen
  // after read()ing all the bytes and not getting any pushback.
  this.ranOut = false;

  // the number of writers that are awaiting a drain event in .pipe()s
  this.awaitDrain = 0;

  // if true, a maybeReadMore has been scheduled
  this.readingMore = false;

  this.decoder = null;
  this.encoding = null;
  if (options.encoding) {
    if (!StringDecoder)
      StringDecoder = require('string_decoder/').StringDecoder;
    this.decoder = new StringDecoder(options.encoding);
    this.encoding = options.encoding;
  }
}

function Readable(options) {
  var Duplex = require('./_stream_duplex');

  if (!(this instanceof Readable))
    return new Readable(options);

  this._readableState = new ReadableState(options, this);

  // legacy
  this.readable = true;

  Stream.call(this);
}

// Manually shove something into the read() buffer.
// This returns true if the highWaterMark has not been hit yet,
// similar to how Writable.write() returns true if you should
// write() some more.
Readable.prototype.push = function(chunk, encoding) {
  var state = this._readableState;

  if (util.isString(chunk) && !state.objectMode) {
    encoding = encoding || state.defaultEncoding;
    if (encoding !== state.encoding) {
      chunk = new Buffer(chunk, encoding);
      encoding = '';
    }
  }

  return readableAddChunk(this, state, chunk, encoding, false);
};

// Unshift should *always* be something directly out of read()
Readable.prototype.unshift = function(chunk) {
  var state = this._readableState;
  return readableAddChunk(this, state, chunk, '', true);
};

function readableAddChunk(stream, state, chunk, encoding, addToFront) {
  var er = chunkInvalid(state, chunk);
  if (er) {
    stream.emit('error', er);
  } else if (util.isNullOrUndefined(chunk)) {
    state.reading = false;
    if (!state.ended)
      onEofChunk(stream, state);
  } else if (state.objectMode || chunk && chunk.length > 0) {
    if (state.ended && !addToFront) {
      var e = new Error('stream.push() after EOF');
      stream.emit('error', e);
    } else if (state.endEmitted && addToFront) {
      var e = new Error('stream.unshift() after end event');
      stream.emit('error', e);
    } else {
      if (state.decoder && !addToFront && !encoding)
        chunk = state.decoder.write(chunk);

      if (!addToFront)
        state.reading = false;

      // if we want the data now, just emit it.
      if (state.flowing && state.length === 0 && !state.sync) {
        stream.emit('data', chunk);
        stream.read(0);
      } else {
        // update the buffer info.
        state.length += state.objectMode ? 1 : chunk.length;
        if (addToFront)
          state.buffer.unshift(chunk);
        else
          state.buffer.push(chunk);

        if (state.needReadable)
          emitReadable(stream);
      }

      maybeReadMore(stream, state);
    }
  } else if (!addToFront) {
    state.reading = false;
  }

  return needMoreData(state);
}



// if it's past the high water mark, we can push in some more.
// Also, if we have no data yet, we can stand some
// more bytes.  This is to work around cases where hwm=0,
// such as the repl.  Also, if the push() triggered a
// readable event, and the user called read(largeNumber) such that
// needReadable was set, then we ought to push more, so that another
// 'readable' event will be triggered.
function needMoreData(state) {
  return !state.ended &&
         (state.needReadable ||
          state.length < state.highWaterMark ||
          state.length === 0);
}

// backwards compatibility.
Readable.prototype.setEncoding = function(enc) {
  if (!StringDecoder)
    StringDecoder = require('string_decoder/').StringDecoder;
  this._readableState.decoder = new StringDecoder(enc);
  this._readableState.encoding = enc;
  return this;
};

// Don't raise the hwm > 128MB
var MAX_HWM = 0x800000;
function roundUpToNextPowerOf2(n) {
  if (n >= MAX_HWM) {
    n = MAX_HWM;
  } else {
    // Get the next highest power of 2
    n--;
    for (var p = 1; p < 32; p <<= 1) n |= n >> p;
    n++;
  }
  return n;
}

function howMuchToRead(n, state) {
  if (state.length === 0 && state.ended)
    return 0;

  if (state.objectMode)
    return n === 0 ? 0 : 1;

  if (isNaN(n) || util.isNull(n)) {
    // only flow one buffer at a time
    if (state.flowing && state.buffer.length)
      return state.buffer[0].length;
    else
      return state.length;
  }

  if (n <= 0)
    return 0;

  // If we're asking for more than the target buffer level,
  // then raise the water mark.  Bump up to the next highest
  // power of 2, to prevent increasing it excessively in tiny
  // amounts.
  if (n > state.highWaterMark)
    state.highWaterMark = roundUpToNextPowerOf2(n);

  // don't have that much.  return null, unless we've ended.
  if (n > state.length) {
    if (!state.ended) {
      state.needReadable = true;
      return 0;
    } else
      return state.length;
  }

  return n;
}

// you can override either this method, or the async _read(n) below.
Readable.prototype.read = function(n) {
  debug('read', n);
  var state = this._readableState;
  var nOrig = n;

  if (!util.isNumber(n) || n > 0)
    state.emittedReadable = false;

  // if we're doing read(0) to trigger a readable event, but we
  // already have a bunch of data in the buffer, then just trigger
  // the 'readable' event and move on.
  if (n === 0 &&
      state.needReadable &&
      (state.length >= state.highWaterMark || state.ended)) {
    debug('read: emitReadable', state.length, state.ended);
    if (state.length === 0 && state.ended)
      endReadable(this);
    else
      emitReadable(this);
    return null;
  }

  n = howMuchToRead(n, state);

  // if we've ended, and we're now clear, then finish it up.
  if (n === 0 && state.ended) {
    if (state.length === 0)
      endReadable(this);
    return null;
  }

  // All the actual chunk generation logic needs to be
  // *below* the call to _read.  The reason is that in certain
  // synthetic stream cases, such as passthrough streams, _read
  // may be a completely synchronous operation which may change
  // the state of the read buffer, providing enough data when
  // before there was *not* enough.
  //
  // So, the steps are:
  // 1. Figure out what the state of things will be after we do
  // a read from the buffer.
  //
  // 2. If that resulting state will trigger a _read, then call _read.
  // Note that this may be asynchronous, or synchronous.  Yes, it is
  // deeply ugly to write APIs this way, but that still doesn't mean
  // that the Readable class should behave improperly, as streams are
  // designed to be sync/async agnostic.
  // Take note if the _read call is sync or async (ie, if the read call
  // has returned yet), so that we know whether or not it's safe to emit
  // 'readable' etc.
  //
  // 3. Actually pull the requested chunks out of the buffer and return.

  // if we need a readable event, then we need to do some reading.
  var doRead = state.needReadable;
  debug('need readable', doRead);

  // if we currently have less than the highWaterMark, then also read some
  if (state.length === 0 || state.length - n < state.highWaterMark) {
    doRead = true;
    debug('length less than watermark', doRead);
  }

  // however, if we've ended, then there's no point, and if we're already
  // reading, then it's unnecessary.
  if (state.ended || state.reading) {
    doRead = false;
    debug('reading or ended', doRead);
  }

  if (doRead) {
    debug('do read');
    state.reading = true;
    state.sync = true;
    // if the length is currently zero, then we *need* a readable event.
    if (state.length === 0)
      state.needReadable = true;
    // call internal read method
    this._read(state.highWaterMark);
    state.sync = false;
  }

  // If _read pushed data synchronously, then `reading` will be false,
  // and we need to re-evaluate how much data we can return to the user.
  if (doRead && !state.reading)
    n = howMuchToRead(nOrig, state);

  var ret;
  if (n > 0)
    ret = fromList(n, state);
  else
    ret = null;

  if (util.isNull(ret)) {
    state.needReadable = true;
    n = 0;
  }

  state.length -= n;

  // If we have nothing in the buffer, then we want to know
  // as soon as we *do* get something into the buffer.
  if (state.length === 0 && !state.ended)
    state.needReadable = true;

  // If we tried to read() past the EOF, then emit end on the next tick.
  if (nOrig !== n && state.ended && state.length === 0)
    endReadable(this);

  if (!util.isNull(ret))
    this.emit('data', ret);

  return ret;
};

function chunkInvalid(state, chunk) {
  var er = null;
  if (!util.isBuffer(chunk) &&
      !util.isString(chunk) &&
      !util.isNullOrUndefined(chunk) &&
      !state.objectMode) {
    er = new TypeError('Invalid non-string/buffer chunk');
  }
  return er;
}


function onEofChunk(stream, state) {
  if (state.decoder && !state.ended) {
    var chunk = state.decoder.end();
    if (chunk && chunk.length) {
      state.buffer.push(chunk);
      state.length += state.objectMode ? 1 : chunk.length;
    }
  }
  state.ended = true;

  // emit 'readable' now to make sure it gets picked up.
  emitReadable(stream);
}

// Don't emit readable right away in sync mode, because this can trigger
// another read() call => stack overflow.  This way, it might trigger
// a nextTick recursion warning, but that's not so bad.
function emitReadable(stream) {
  var state = stream._readableState;
  state.needReadable = false;
  if (!state.emittedReadable) {
    debug('emitReadable', state.flowing);
    state.emittedReadable = true;
    if (state.sync)
      process.nextTick(function() {
        emitReadable_(stream);
      });
    else
      emitReadable_(stream);
  }
}

function emitReadable_(stream) {
  debug('emit readable');
  stream.emit('readable');
  flow(stream);
}


// at this point, the user has presumably seen the 'readable' event,
// and called read() to consume some data.  that may have triggered
// in turn another _read(n) call, in which case reading = true if
// it's in progress.
// However, if we're not ended, or reading, and the length < hwm,
// then go ahead and try to read some more preemptively.
function maybeReadMore(stream, state) {
  if (!state.readingMore) {
    state.readingMore = true;
    process.nextTick(function() {
      maybeReadMore_(stream, state);
    });
  }
}

function maybeReadMore_(stream, state) {
  var len = state.length;
  while (!state.reading && !state.flowing && !state.ended &&
         state.length < state.highWaterMark) {
    debug('maybeReadMore read 0');
    stream.read(0);
    if (len === state.length)
      // didn't get any data, stop spinning.
      break;
    else
      len = state.length;
  }
  state.readingMore = false;
}

// abstract method.  to be overridden in specific implementation classes.
// call cb(er, data) where data is <= n in length.
// for virtual (non-string, non-buffer) streams, "length" is somewhat
// arbitrary, and perhaps not very meaningful.
Readable.prototype._read = function(n) {
  this.emit('error', new Error('not implemented'));
};

Readable.prototype.pipe = function(dest, pipeOpts) {
  var src = this;
  var state = this._readableState;

  switch (state.pipesCount) {
    case 0:
      state.pipes = dest;
      break;
    case 1:
      state.pipes = [state.pipes, dest];
      break;
    default:
      state.pipes.push(dest);
      break;
  }
  state.pipesCount += 1;
  debug('pipe count=%d opts=%j', state.pipesCount, pipeOpts);

  var doEnd = (!pipeOpts || pipeOpts.end !== false) &&
              dest !== process.stdout &&
              dest !== process.stderr;

  var endFn = doEnd ? onend : cleanup;
  if (state.endEmitted)
    process.nextTick(endFn);
  else
    src.once('end', endFn);

  dest.on('unpipe', onunpipe);
  function onunpipe(readable) {
    debug('onunpipe');
    if (readable === src) {
      cleanup();
    }
  }

  function onend() {
    debug('onend');
    dest.end();
  }

  // when the dest drains, it reduces the awaitDrain counter
  // on the source.  This would be more elegant with a .once()
  // handler in flow(), but adding and removing repeatedly is
  // too slow.
  var ondrain = pipeOnDrain(src);
  dest.on('drain', ondrain);

  function cleanup() {
    debug('cleanup');
    // cleanup event handlers once the pipe is broken
    dest.removeListener('close', onclose);
    dest.removeListener('finish', onfinish);
    dest.removeListener('drain', ondrain);
    dest.removeListener('error', onerror);
    dest.removeListener('unpipe', onunpipe);
    src.removeListener('end', onend);
    src.removeListener('end', cleanup);
    src.removeListener('data', ondata);

    // if the reader is waiting for a drain event from this
    // specific writer, then it would cause it to never start
    // flowing again.
    // So, if this is awaiting a drain, then we just call it now.
    // If we don't know, then assume that we are waiting for one.
    if (state.awaitDrain &&
        (!dest._writableState || dest._writableState.needDrain))
      ondrain();
  }

  src.on('data', ondata);
  function ondata(chunk) {
    debug('ondata');
    var ret = dest.write(chunk);
    if (false === ret) {
      debug('false write response, pause',
            src._readableState.awaitDrain);
      src._readableState.awaitDrain++;
      src.pause();
    }
  }

  // if the dest has an error, then stop piping into it.
  // however, don't suppress the throwing behavior for this.
  function onerror(er) {
    debug('onerror', er);
    unpipe();
    dest.removeListener('error', onerror);
    if (EE.listenerCount(dest, 'error') === 0)
      dest.emit('error', er);
  }
  // This is a brutally ugly hack to make sure that our error handler
  // is attached before any userland ones.  NEVER DO THIS.
  if (!dest._events || !dest._events.error)
    dest.on('error', onerror);
  else if (isArray(dest._events.error))
    dest._events.error.unshift(onerror);
  else
    dest._events.error = [onerror, dest._events.error];



  // Both close and finish should trigger unpipe, but only once.
  function onclose() {
    dest.removeListener('finish', onfinish);
    unpipe();
  }
  dest.once('close', onclose);
  function onfinish() {
    debug('onfinish');
    dest.removeListener('close', onclose);
    unpipe();
  }
  dest.once('finish', onfinish);

  function unpipe() {
    debug('unpipe');
    src.unpipe(dest);
  }

  // tell the dest that it's being piped to
  dest.emit('pipe', src);

  // start the flow if it hasn't been started already.
  if (!state.flowing) {
    debug('pipe resume');
    src.resume();
  }

  return dest;
};

function pipeOnDrain(src) {
  return function() {
    var state = src._readableState;
    debug('pipeOnDrain', state.awaitDrain);
    if (state.awaitDrain)
      state.awaitDrain--;
    if (state.awaitDrain === 0 && EE.listenerCount(src, 'data')) {
      state.flowing = true;
      flow(src);
    }
  };
}


Readable.prototype.unpipe = function(dest) {
  var state = this._readableState;

  // if we're not piping anywhere, then do nothing.
  if (state.pipesCount === 0)
    return this;

  // just one destination.  most common case.
  if (state.pipesCount === 1) {
    // passed in one, but it's not the right one.
    if (dest && dest !== state.pipes)
      return this;

    if (!dest)
      dest = state.pipes;

    // got a match.
    state.pipes = null;
    state.pipesCount = 0;
    state.flowing = false;
    if (dest)
      dest.emit('unpipe', this);
    return this;
  }

  // slow case. multiple pipe destinations.

  if (!dest) {
    // remove all.
    var dests = state.pipes;
    var len = state.pipesCount;
    state.pipes = null;
    state.pipesCount = 0;
    state.flowing = false;

    for (var i = 0; i < len; i++)
      dests[i].emit('unpipe', this);
    return this;
  }

  // try to find the right one.
  var i = indexOf(state.pipes, dest);
  if (i === -1)
    return this;

  state.pipes.splice(i, 1);
  state.pipesCount -= 1;
  if (state.pipesCount === 1)
    state.pipes = state.pipes[0];

  dest.emit('unpipe', this);

  return this;
};

// set up data events if they are asked for
// Ensure readable listeners eventually get something
Readable.prototype.on = function(ev, fn) {
  var res = Stream.prototype.on.call(this, ev, fn);

  // If listening to data, and it has not explicitly been paused,
  // then call resume to start the flow of data on the next tick.
  if (ev === 'data' && false !== this._readableState.flowing) {
    this.resume();
  }

  if (ev === 'readable' && this.readable) {
    var state = this._readableState;
    if (!state.readableListening) {
      state.readableListening = true;
      state.emittedReadable = false;
      state.needReadable = true;
      if (!state.reading) {
        var self = this;
        process.nextTick(function() {
          debug('readable nexttick read 0');
          self.read(0);
        });
      } else if (state.length) {
        emitReadable(this, state);
      }
    }
  }

  return res;
};
Readable.prototype.addListener = Readable.prototype.on;

// pause() and resume() are remnants of the legacy readable stream API
// If the user uses them, then switch into old mode.
Readable.prototype.resume = function() {
  var state = this._readableState;
  if (!state.flowing) {
    debug('resume');
    state.flowing = true;
    if (!state.reading) {
      debug('resume read 0');
      this.read(0);
    }
    resume(this, state);
  }
  return this;
};

function resume(stream, state) {
  if (!state.resumeScheduled) {
    state.resumeScheduled = true;
    process.nextTick(function() {
      resume_(stream, state);
    });
  }
}

function resume_(stream, state) {
  state.resumeScheduled = false;
  stream.emit('resume');
  flow(stream);
  if (state.flowing && !state.reading)
    stream.read(0);
}

Readable.prototype.pause = function() {
  debug('call pause flowing=%j', this._readableState.flowing);
  if (false !== this._readableState.flowing) {
    debug('pause');
    this._readableState.flowing = false;
    this.emit('pause');
  }
  return this;
};

function flow(stream) {
  var state = stream._readableState;
  debug('flow', state.flowing);
  if (state.flowing) {
    do {
      var chunk = stream.read();
    } while (null !== chunk && state.flowing);
  }
}

// wrap an old-style stream as the async data source.
// This is *not* part of the readable stream interface.
// It is an ugly unfortunate mess of history.
Readable.prototype.wrap = function(stream) {
  var state = this._readableState;
  var paused = false;

  var self = this;
  stream.on('end', function() {
    debug('wrapped end');
    if (state.decoder && !state.ended) {
      var chunk = state.decoder.end();
      if (chunk && chunk.length)
        self.push(chunk);
    }

    self.push(null);
  });

  stream.on('data', function(chunk) {
    debug('wrapped data');
    if (state.decoder)
      chunk = state.decoder.write(chunk);
    if (!chunk || !state.objectMode && !chunk.length)
      return;

    var ret = self.push(chunk);
    if (!ret) {
      paused = true;
      stream.pause();
    }
  });

  // proxy all the other methods.
  // important when wrapping filters and duplexes.
  for (var i in stream) {
    if (util.isFunction(stream[i]) && util.isUndefined(this[i])) {
      this[i] = function(method) { return function() {
        return stream[method].apply(stream, arguments);
      }}(i);
    }
  }

  // proxy certain important events.
  var events = ['error', 'close', 'destroy', 'pause', 'resume'];
  forEach(events, function(ev) {
    stream.on(ev, self.emit.bind(self, ev));
  });

  // when we try to consume some more bytes, simply unpause the
  // underlying stream.
  self._read = function(n) {
    debug('wrapped _read', n);
    if (paused) {
      paused = false;
      stream.resume();
    }
  };

  return self;
};



// exposed for testing purposes only.
Readable._fromList = fromList;

// Pluck off n bytes from an array of buffers.
// Length is the combined lengths of all the buffers in the list.
function fromList(n, state) {
  var list = state.buffer;
  var length = state.length;
  var stringMode = !!state.decoder;
  var objectMode = !!state.objectMode;
  var ret;

  // nothing in the list, definitely empty.
  if (list.length === 0)
    return null;

  if (length === 0)
    ret = null;
  else if (objectMode)
    ret = list.shift();
  else if (!n || n >= length) {
    // read it all, truncate the array.
    if (stringMode)
      ret = list.join('');
    else
      ret = Buffer.concat(list, length);
    list.length = 0;
  } else {
    // read just some of it.
    if (n < list[0].length) {
      // just take a part of the first list item.
      // slice is the same for buffers and strings.
      var buf = list[0];
      ret = buf.slice(0, n);
      list[0] = buf.slice(n);
    } else if (n === list[0].length) {
      // first list is a perfect match
      ret = list.shift();
    } else {
      // complex case.
      // we have enough to cover it, but it spans past the first buffer.
      if (stringMode)
        ret = '';
      else
        ret = new Buffer(n);

      var c = 0;
      for (var i = 0, l = list.length; i < l && c < n; i++) {
        var buf = list[0];
        var cpy = Math.min(n - c, buf.length);

        if (stringMode)
          ret += buf.slice(0, cpy);
        else
          buf.copy(ret, c, 0, cpy);

        if (cpy < buf.length)
          list[0] = buf.slice(cpy);
        else
          list.shift();

        c += cpy;
      }
    }
  }

  return ret;
}

function endReadable(stream) {
  var state = stream._readableState;

  // If we get here before consuming all the bytes, then that is a
  // bug in node.  Should never happen.
  if (state.length > 0)
    throw new Error('endReadable called on non-empty stream');

  if (!state.endEmitted) {
    state.ended = true;
    process.nextTick(function() {
      // Check that we didn't get one last unshift.
      if (!state.endEmitted && state.length === 0) {
        state.endEmitted = true;
        stream.readable = false;
        stream.emit('end');
      }
    });
  }
}

function forEach (xs, f) {
  for (var i = 0, l = xs.length; i < l; i++) {
    f(xs[i], i);
  }
}

function indexOf (xs, x) {
  for (var i = 0, l = xs.length; i < l; i++) {
    if (xs[i] === x) return i;
  }
  return -1;
}

}).call(this,require('_process'))

},{"./_stream_duplex":"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/browserify/node_modules/readable-stream/lib/_stream_duplex.js","_process":"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/browserify/node_modules/process/browser.js","buffer":"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/browserify/node_modules/buffer/index.js","core-util-is":"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/browserify/node_modules/readable-stream/node_modules/core-util-is/lib/util.js","events":"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/browserify/node_modules/events/events.js","inherits":"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/browserify/node_modules/inherits/inherits_browser.js","isarray":"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/browserify/node_modules/isarray/index.js","stream":"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/browserify/node_modules/stream-browserify/index.js","string_decoder/":"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/browserify/node_modules/string_decoder/index.js","util":"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/browserify/node_modules/browser-resolve/empty.js"}],"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/browserify/node_modules/readable-stream/lib/_stream_transform.js":[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.


// a transform stream is a readable/writable stream where you do
// something with the data.  Sometimes it's called a "filter",
// but that's not a great name for it, since that implies a thing where
// some bits pass through, and others are simply ignored.  (That would
// be a valid example of a transform, of course.)
//
// While the output is causally related to the input, it's not a
// necessarily symmetric or synchronous transformation.  For example,
// a zlib stream might take multiple plain-text writes(), and then
// emit a single compressed chunk some time in the future.
//
// Here's how this works:
//
// The Transform stream has all the aspects of the readable and writable
// stream classes.  When you write(chunk), that calls _write(chunk,cb)
// internally, and returns false if there's a lot of pending writes
// buffered up.  When you call read(), that calls _read(n) until
// there's enough pending readable data buffered up.
//
// In a transform stream, the written data is placed in a buffer.  When
// _read(n) is called, it transforms the queued up data, calling the
// buffered _write cb's as it consumes chunks.  If consuming a single
// written chunk would result in multiple output chunks, then the first
// outputted bit calls the readcb, and subsequent chunks just go into
// the read buffer, and will cause it to emit 'readable' if necessary.
//
// This way, back-pressure is actually determined by the reading side,
// since _read has to be called to start processing a new chunk.  However,
// a pathological inflate type of transform can cause excessive buffering
// here.  For example, imagine a stream where every byte of input is
// interpreted as an integer from 0-255, and then results in that many
// bytes of output.  Writing the 4 bytes {ff,ff,ff,ff} would result in
// 1kb of data being output.  In this case, you could write a very small
// amount of input, and end up with a very large amount of output.  In
// such a pathological inflating mechanism, there'd be no way to tell
// the system to stop doing the transform.  A single 4MB write could
// cause the system to run out of memory.
//
// However, even in such a pathological case, only a single written chunk
// would be consumed, and then the rest would wait (un-transformed) until
// the results of the previous transformed chunk were consumed.

module.exports = Transform;

var Duplex = require('./_stream_duplex');

/*<replacement>*/
var util = require('core-util-is');
util.inherits = require('inherits');
/*</replacement>*/

util.inherits(Transform, Duplex);


function TransformState(options, stream) {
  this.afterTransform = function(er, data) {
    return afterTransform(stream, er, data);
  };

  this.needTransform = false;
  this.transforming = false;
  this.writecb = null;
  this.writechunk = null;
}

function afterTransform(stream, er, data) {
  var ts = stream._transformState;
  ts.transforming = false;

  var cb = ts.writecb;

  if (!cb)
    return stream.emit('error', new Error('no writecb in Transform class'));

  ts.writechunk = null;
  ts.writecb = null;

  if (!util.isNullOrUndefined(data))
    stream.push(data);

  if (cb)
    cb(er);

  var rs = stream._readableState;
  rs.reading = false;
  if (rs.needReadable || rs.length < rs.highWaterMark) {
    stream._read(rs.highWaterMark);
  }
}


function Transform(options) {
  if (!(this instanceof Transform))
    return new Transform(options);

  Duplex.call(this, options);

  this._transformState = new TransformState(options, this);

  // when the writable side finishes, then flush out anything remaining.
  var stream = this;

  // start out asking for a readable event once data is transformed.
  this._readableState.needReadable = true;

  // we have implemented the _read method, and done the other things
  // that Readable wants before the first _read call, so unset the
  // sync guard flag.
  this._readableState.sync = false;

  this.once('prefinish', function() {
    if (util.isFunction(this._flush))
      this._flush(function(er) {
        done(stream, er);
      });
    else
      done(stream);
  });
}

Transform.prototype.push = function(chunk, encoding) {
  this._transformState.needTransform = false;
  return Duplex.prototype.push.call(this, chunk, encoding);
};

// This is the part where you do stuff!
// override this function in implementation classes.
// 'chunk' is an input chunk.
//
// Call `push(newChunk)` to pass along transformed output
// to the readable side.  You may call 'push' zero or more times.
//
// Call `cb(err)` when you are done with this chunk.  If you pass
// an error, then that'll put the hurt on the whole operation.  If you
// never call cb(), then you'll never get another chunk.
Transform.prototype._transform = function(chunk, encoding, cb) {
  throw new Error('not implemented');
};

Transform.prototype._write = function(chunk, encoding, cb) {
  var ts = this._transformState;
  ts.writecb = cb;
  ts.writechunk = chunk;
  ts.writeencoding = encoding;
  if (!ts.transforming) {
    var rs = this._readableState;
    if (ts.needTransform ||
        rs.needReadable ||
        rs.length < rs.highWaterMark)
      this._read(rs.highWaterMark);
  }
};

// Doesn't matter what the args are here.
// _transform does all the work.
// That we got here means that the readable side wants more data.
Transform.prototype._read = function(n) {
  var ts = this._transformState;

  if (!util.isNull(ts.writechunk) && ts.writecb && !ts.transforming) {
    ts.transforming = true;
    this._transform(ts.writechunk, ts.writeencoding, ts.afterTransform);
  } else {
    // mark that we need a transform, so that any data that comes in
    // will get processed, now that we've asked for it.
    ts.needTransform = true;
  }
};


function done(stream, er) {
  if (er)
    return stream.emit('error', er);

  // if there's nothing in the write buffer, then that means
  // that nothing more will ever be provided
  var ws = stream._writableState;
  var ts = stream._transformState;

  if (ws.length)
    throw new Error('calling transform done when ws.length != 0');

  if (ts.transforming)
    throw new Error('calling transform done when still transforming');

  return stream.push(null);
}

},{"./_stream_duplex":"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/browserify/node_modules/readable-stream/lib/_stream_duplex.js","core-util-is":"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/browserify/node_modules/readable-stream/node_modules/core-util-is/lib/util.js","inherits":"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/browserify/node_modules/inherits/inherits_browser.js"}],"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/browserify/node_modules/readable-stream/lib/_stream_writable.js":[function(require,module,exports){
(function (process){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// A bit simpler than readable streams.
// Implement an async ._write(chunk, cb), and it'll handle all
// the drain event emission and buffering.

module.exports = Writable;

/*<replacement>*/
var Buffer = require('buffer').Buffer;
/*</replacement>*/

Writable.WritableState = WritableState;


/*<replacement>*/
var util = require('core-util-is');
util.inherits = require('inherits');
/*</replacement>*/

var Stream = require('stream');

util.inherits(Writable, Stream);

function WriteReq(chunk, encoding, cb) {
  this.chunk = chunk;
  this.encoding = encoding;
  this.callback = cb;
}

function WritableState(options, stream) {
  var Duplex = require('./_stream_duplex');

  options = options || {};

  // the point at which write() starts returning false
  // Note: 0 is a valid value, means that we always return false if
  // the entire buffer is not flushed immediately on write()
  var hwm = options.highWaterMark;
  var defaultHwm = options.objectMode ? 16 : 16 * 1024;
  this.highWaterMark = (hwm || hwm === 0) ? hwm : defaultHwm;

  // object stream flag to indicate whether or not this stream
  // contains buffers or objects.
  this.objectMode = !!options.objectMode;

  if (stream instanceof Duplex)
    this.objectMode = this.objectMode || !!options.writableObjectMode;

  // cast to ints.
  this.highWaterMark = ~~this.highWaterMark;

  this.needDrain = false;
  // at the start of calling end()
  this.ending = false;
  // when end() has been called, and returned
  this.ended = false;
  // when 'finish' is emitted
  this.finished = false;

  // should we decode strings into buffers before passing to _write?
  // this is here so that some node-core streams can optimize string
  // handling at a lower level.
  var noDecode = options.decodeStrings === false;
  this.decodeStrings = !noDecode;

  // Crypto is kind of old and crusty.  Historically, its default string
  // encoding is 'binary' so we have to make this configurable.
  // Everything else in the universe uses 'utf8', though.
  this.defaultEncoding = options.defaultEncoding || 'utf8';

  // not an actual buffer we keep track of, but a measurement
  // of how much we're waiting to get pushed to some underlying
  // socket or file.
  this.length = 0;

  // a flag to see when we're in the middle of a write.
  this.writing = false;

  // when true all writes will be buffered until .uncork() call
  this.corked = 0;

  // a flag to be able to tell if the onwrite cb is called immediately,
  // or on a later tick.  We set this to true at first, because any
  // actions that shouldn't happen until "later" should generally also
  // not happen before the first write call.
  this.sync = true;

  // a flag to know if we're processing previously buffered items, which
  // may call the _write() callback in the same tick, so that we don't
  // end up in an overlapped onwrite situation.
  this.bufferProcessing = false;

  // the callback that's passed to _write(chunk,cb)
  this.onwrite = function(er) {
    onwrite(stream, er);
  };

  // the callback that the user supplies to write(chunk,encoding,cb)
  this.writecb = null;

  // the amount that is being written when _write is called.
  this.writelen = 0;

  this.buffer = [];

  // number of pending user-supplied write callbacks
  // this must be 0 before 'finish' can be emitted
  this.pendingcb = 0;

  // emit prefinish if the only thing we're waiting for is _write cbs
  // This is relevant for synchronous Transform streams
  this.prefinished = false;

  // True if the error was already emitted and should not be thrown again
  this.errorEmitted = false;
}

function Writable(options) {
  var Duplex = require('./_stream_duplex');

  // Writable ctor is applied to Duplexes, though they're not
  // instanceof Writable, they're instanceof Readable.
  if (!(this instanceof Writable) && !(this instanceof Duplex))
    return new Writable(options);

  this._writableState = new WritableState(options, this);

  // legacy.
  this.writable = true;

  Stream.call(this);
}

// Otherwise people can pipe Writable streams, which is just wrong.
Writable.prototype.pipe = function() {
  this.emit('error', new Error('Cannot pipe. Not readable.'));
};


function writeAfterEnd(stream, state, cb) {
  var er = new Error('write after end');
  // TODO: defer error events consistently everywhere, not just the cb
  stream.emit('error', er);
  process.nextTick(function() {
    cb(er);
  });
}

// If we get something that is not a buffer, string, null, or undefined,
// and we're not in objectMode, then that's an error.
// Otherwise stream chunks are all considered to be of length=1, and the
// watermarks determine how many objects to keep in the buffer, rather than
// how many bytes or characters.
function validChunk(stream, state, chunk, cb) {
  var valid = true;
  if (!util.isBuffer(chunk) &&
      !util.isString(chunk) &&
      !util.isNullOrUndefined(chunk) &&
      !state.objectMode) {
    var er = new TypeError('Invalid non-string/buffer chunk');
    stream.emit('error', er);
    process.nextTick(function() {
      cb(er);
    });
    valid = false;
  }
  return valid;
}

Writable.prototype.write = function(chunk, encoding, cb) {
  var state = this._writableState;
  var ret = false;

  if (util.isFunction(encoding)) {
    cb = encoding;
    encoding = null;
  }

  if (util.isBuffer(chunk))
    encoding = 'buffer';
  else if (!encoding)
    encoding = state.defaultEncoding;

  if (!util.isFunction(cb))
    cb = function() {};

  if (state.ended)
    writeAfterEnd(this, state, cb);
  else if (validChunk(this, state, chunk, cb)) {
    state.pendingcb++;
    ret = writeOrBuffer(this, state, chunk, encoding, cb);
  }

  return ret;
};

Writable.prototype.cork = function() {
  var state = this._writableState;

  state.corked++;
};

Writable.prototype.uncork = function() {
  var state = this._writableState;

  if (state.corked) {
    state.corked--;

    if (!state.writing &&
        !state.corked &&
        !state.finished &&
        !state.bufferProcessing &&
        state.buffer.length)
      clearBuffer(this, state);
  }
};

function decodeChunk(state, chunk, encoding) {
  if (!state.objectMode &&
      state.decodeStrings !== false &&
      util.isString(chunk)) {
    chunk = new Buffer(chunk, encoding);
  }
  return chunk;
}

// if we're already writing something, then just put this
// in the queue, and wait our turn.  Otherwise, call _write
// If we return false, then we need a drain event, so set that flag.
function writeOrBuffer(stream, state, chunk, encoding, cb) {
  chunk = decodeChunk(state, chunk, encoding);
  if (util.isBuffer(chunk))
    encoding = 'buffer';
  var len = state.objectMode ? 1 : chunk.length;

  state.length += len;

  var ret = state.length < state.highWaterMark;
  // we must ensure that previous needDrain will not be reset to false.
  if (!ret)
    state.needDrain = true;

  if (state.writing || state.corked)
    state.buffer.push(new WriteReq(chunk, encoding, cb));
  else
    doWrite(stream, state, false, len, chunk, encoding, cb);

  return ret;
}

function doWrite(stream, state, writev, len, chunk, encoding, cb) {
  state.writelen = len;
  state.writecb = cb;
  state.writing = true;
  state.sync = true;
  if (writev)
    stream._writev(chunk, state.onwrite);
  else
    stream._write(chunk, encoding, state.onwrite);
  state.sync = false;
}

function onwriteError(stream, state, sync, er, cb) {
  if (sync)
    process.nextTick(function() {
      state.pendingcb--;
      cb(er);
    });
  else {
    state.pendingcb--;
    cb(er);
  }

  stream._writableState.errorEmitted = true;
  stream.emit('error', er);
}

function onwriteStateUpdate(state) {
  state.writing = false;
  state.writecb = null;
  state.length -= state.writelen;
  state.writelen = 0;
}

function onwrite(stream, er) {
  var state = stream._writableState;
  var sync = state.sync;
  var cb = state.writecb;

  onwriteStateUpdate(state);

  if (er)
    onwriteError(stream, state, sync, er, cb);
  else {
    // Check if we're actually ready to finish, but don't emit yet
    var finished = needFinish(stream, state);

    if (!finished &&
        !state.corked &&
        !state.bufferProcessing &&
        state.buffer.length) {
      clearBuffer(stream, state);
    }

    if (sync) {
      process.nextTick(function() {
        afterWrite(stream, state, finished, cb);
      });
    } else {
      afterWrite(stream, state, finished, cb);
    }
  }
}

function afterWrite(stream, state, finished, cb) {
  if (!finished)
    onwriteDrain(stream, state);
  state.pendingcb--;
  cb();
  finishMaybe(stream, state);
}

// Must force callback to be called on nextTick, so that we don't
// emit 'drain' before the write() consumer gets the 'false' return
// value, and has a chance to attach a 'drain' listener.
function onwriteDrain(stream, state) {
  if (state.length === 0 && state.needDrain) {
    state.needDrain = false;
    stream.emit('drain');
  }
}


// if there's something in the buffer waiting, then process it
function clearBuffer(stream, state) {
  state.bufferProcessing = true;

  if (stream._writev && state.buffer.length > 1) {
    // Fast case, write everything using _writev()
    var cbs = [];
    for (var c = 0; c < state.buffer.length; c++)
      cbs.push(state.buffer[c].callback);

    // count the one we are adding, as well.
    // TODO(isaacs) clean this up
    state.pendingcb++;
    doWrite(stream, state, true, state.length, state.buffer, '', function(err) {
      for (var i = 0; i < cbs.length; i++) {
        state.pendingcb--;
        cbs[i](err);
      }
    });

    // Clear buffer
    state.buffer = [];
  } else {
    // Slow case, write chunks one-by-one
    for (var c = 0; c < state.buffer.length; c++) {
      var entry = state.buffer[c];
      var chunk = entry.chunk;
      var encoding = entry.encoding;
      var cb = entry.callback;
      var len = state.objectMode ? 1 : chunk.length;

      doWrite(stream, state, false, len, chunk, encoding, cb);

      // if we didn't call the onwrite immediately, then
      // it means that we need to wait until it does.
      // also, that means that the chunk and cb are currently
      // being processed, so move the buffer counter past them.
      if (state.writing) {
        c++;
        break;
      }
    }

    if (c < state.buffer.length)
      state.buffer = state.buffer.slice(c);
    else
      state.buffer.length = 0;
  }

  state.bufferProcessing = false;
}

Writable.prototype._write = function(chunk, encoding, cb) {
  cb(new Error('not implemented'));

};

Writable.prototype._writev = null;

Writable.prototype.end = function(chunk, encoding, cb) {
  var state = this._writableState;

  if (util.isFunction(chunk)) {
    cb = chunk;
    chunk = null;
    encoding = null;
  } else if (util.isFunction(encoding)) {
    cb = encoding;
    encoding = null;
  }

  if (!util.isNullOrUndefined(chunk))
    this.write(chunk, encoding);

  // .end() fully uncorks
  if (state.corked) {
    state.corked = 1;
    this.uncork();
  }

  // ignore unnecessary end() calls.
  if (!state.ending && !state.finished)
    endWritable(this, state, cb);
};


function needFinish(stream, state) {
  return (state.ending &&
          state.length === 0 &&
          !state.finished &&
          !state.writing);
}

function prefinish(stream, state) {
  if (!state.prefinished) {
    state.prefinished = true;
    stream.emit('prefinish');
  }
}

function finishMaybe(stream, state) {
  var need = needFinish(stream, state);
  if (need) {
    if (state.pendingcb === 0) {
      prefinish(stream, state);
      state.finished = true;
      stream.emit('finish');
    } else
      prefinish(stream, state);
  }
  return need;
}

function endWritable(stream, state, cb) {
  state.ending = true;
  finishMaybe(stream, state);
  if (cb) {
    if (state.finished)
      process.nextTick(cb);
    else
      stream.once('finish', cb);
  }
  state.ended = true;
}

}).call(this,require('_process'))

},{"./_stream_duplex":"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/browserify/node_modules/readable-stream/lib/_stream_duplex.js","_process":"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/browserify/node_modules/process/browser.js","buffer":"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/browserify/node_modules/buffer/index.js","core-util-is":"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/browserify/node_modules/readable-stream/node_modules/core-util-is/lib/util.js","inherits":"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/browserify/node_modules/inherits/inherits_browser.js","stream":"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/browserify/node_modules/stream-browserify/index.js"}],"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/browserify/node_modules/readable-stream/node_modules/core-util-is/lib/util.js":[function(require,module,exports){
(function (Buffer){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

function isBuffer(arg) {
  return Buffer.isBuffer(arg);
}
exports.isBuffer = isBuffer;

function objectToString(o) {
  return Object.prototype.toString.call(o);
}
}).call(this,require("buffer").Buffer)

},{"buffer":"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/browserify/node_modules/buffer/index.js"}],"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/browserify/node_modules/readable-stream/passthrough.js":[function(require,module,exports){
module.exports = require("./lib/_stream_passthrough.js")

},{"./lib/_stream_passthrough.js":"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/browserify/node_modules/readable-stream/lib/_stream_passthrough.js"}],"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/browserify/node_modules/readable-stream/readable.js":[function(require,module,exports){
exports = module.exports = require('./lib/_stream_readable.js');
exports.Stream = require('stream');
exports.Readable = exports;
exports.Writable = require('./lib/_stream_writable.js');
exports.Duplex = require('./lib/_stream_duplex.js');
exports.Transform = require('./lib/_stream_transform.js');
exports.PassThrough = require('./lib/_stream_passthrough.js');

},{"./lib/_stream_duplex.js":"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/browserify/node_modules/readable-stream/lib/_stream_duplex.js","./lib/_stream_passthrough.js":"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/browserify/node_modules/readable-stream/lib/_stream_passthrough.js","./lib/_stream_readable.js":"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/browserify/node_modules/readable-stream/lib/_stream_readable.js","./lib/_stream_transform.js":"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/browserify/node_modules/readable-stream/lib/_stream_transform.js","./lib/_stream_writable.js":"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/browserify/node_modules/readable-stream/lib/_stream_writable.js","stream":"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/browserify/node_modules/stream-browserify/index.js"}],"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/browserify/node_modules/readable-stream/transform.js":[function(require,module,exports){
module.exports = require("./lib/_stream_transform.js")

},{"./lib/_stream_transform.js":"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/browserify/node_modules/readable-stream/lib/_stream_transform.js"}],"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/browserify/node_modules/readable-stream/writable.js":[function(require,module,exports){
module.exports = require("./lib/_stream_writable.js")

},{"./lib/_stream_writable.js":"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/browserify/node_modules/readable-stream/lib/_stream_writable.js"}],"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/browserify/node_modules/stream-browserify/index.js":[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

module.exports = Stream;

var EE = require('events').EventEmitter;
var inherits = require('inherits');

inherits(Stream, EE);
Stream.Readable = require('readable-stream/readable.js');
Stream.Writable = require('readable-stream/writable.js');
Stream.Duplex = require('readable-stream/duplex.js');
Stream.Transform = require('readable-stream/transform.js');
Stream.PassThrough = require('readable-stream/passthrough.js');

// Backwards-compat with node 0.4.x
Stream.Stream = Stream;



// old-style streams.  Note that the pipe method (the only relevant
// part of this class) is overridden in the Readable class.

function Stream() {
  EE.call(this);
}

Stream.prototype.pipe = function(dest, options) {
  var source = this;

  function ondata(chunk) {
    if (dest.writable) {
      if (false === dest.write(chunk) && source.pause) {
        source.pause();
      }
    }
  }

  source.on('data', ondata);

  function ondrain() {
    if (source.readable && source.resume) {
      source.resume();
    }
  }

  dest.on('drain', ondrain);

  // If the 'end' option is not supplied, dest.end() will be called when
  // source gets the 'end' or 'close' events.  Only dest.end() once.
  if (!dest._isStdio && (!options || options.end !== false)) {
    source.on('end', onend);
    source.on('close', onclose);
  }

  var didOnEnd = false;
  function onend() {
    if (didOnEnd) return;
    didOnEnd = true;

    dest.end();
  }


  function onclose() {
    if (didOnEnd) return;
    didOnEnd = true;

    if (typeof dest.destroy === 'function') dest.destroy();
  }

  // don't leave dangling pipes when there are errors.
  function onerror(er) {
    cleanup();
    if (EE.listenerCount(this, 'error') === 0) {
      throw er; // Unhandled stream error in pipe.
    }
  }

  source.on('error', onerror);
  dest.on('error', onerror);

  // remove all the event listeners that were added.
  function cleanup() {
    source.removeListener('data', ondata);
    dest.removeListener('drain', ondrain);

    source.removeListener('end', onend);
    source.removeListener('close', onclose);

    source.removeListener('error', onerror);
    dest.removeListener('error', onerror);

    source.removeListener('end', cleanup);
    source.removeListener('close', cleanup);

    dest.removeListener('close', cleanup);
  }

  source.on('end', cleanup);
  source.on('close', cleanup);

  dest.on('close', cleanup);

  dest.emit('pipe', source);

  // Allow for unix-like usage: A.pipe(B).pipe(C)
  return dest;
};

},{"events":"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/browserify/node_modules/events/events.js","inherits":"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/browserify/node_modules/inherits/inherits_browser.js","readable-stream/duplex.js":"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/browserify/node_modules/readable-stream/duplex.js","readable-stream/passthrough.js":"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/browserify/node_modules/readable-stream/passthrough.js","readable-stream/readable.js":"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/browserify/node_modules/readable-stream/readable.js","readable-stream/transform.js":"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/browserify/node_modules/readable-stream/transform.js","readable-stream/writable.js":"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/browserify/node_modules/readable-stream/writable.js"}],"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/browserify/node_modules/string_decoder/index.js":[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var Buffer = require('buffer').Buffer;

var isBufferEncoding = Buffer.isEncoding
  || function(encoding) {
       switch (encoding && encoding.toLowerCase()) {
         case 'hex': case 'utf8': case 'utf-8': case 'ascii': case 'binary': case 'base64': case 'ucs2': case 'ucs-2': case 'utf16le': case 'utf-16le': case 'raw': return true;
         default: return false;
       }
     }


function assertEncoding(encoding) {
  if (encoding && !isBufferEncoding(encoding)) {
    throw new Error('Unknown encoding: ' + encoding);
  }
}

// StringDecoder provides an interface for efficiently splitting a series of
// buffers into a series of JS strings without breaking apart multi-byte
// characters. CESU-8 is handled as part of the UTF-8 encoding.
//
// @TODO Handling all encodings inside a single object makes it very difficult
// to reason about this code, so it should be split up in the future.
// @TODO There should be a utf8-strict encoding that rejects invalid UTF-8 code
// points as used by CESU-8.
var StringDecoder = exports.StringDecoder = function(encoding) {
  this.encoding = (encoding || 'utf8').toLowerCase().replace(/[-_]/, '');
  assertEncoding(encoding);
  switch (this.encoding) {
    case 'utf8':
      // CESU-8 represents each of Surrogate Pair by 3-bytes
      this.surrogateSize = 3;
      break;
    case 'ucs2':
    case 'utf16le':
      // UTF-16 represents each of Surrogate Pair by 2-bytes
      this.surrogateSize = 2;
      this.detectIncompleteChar = utf16DetectIncompleteChar;
      break;
    case 'base64':
      // Base-64 stores 3 bytes in 4 chars, and pads the remainder.
      this.surrogateSize = 3;
      this.detectIncompleteChar = base64DetectIncompleteChar;
      break;
    default:
      this.write = passThroughWrite;
      return;
  }

  // Enough space to store all bytes of a single character. UTF-8 needs 4
  // bytes, but CESU-8 may require up to 6 (3 bytes per surrogate).
  this.charBuffer = new Buffer(6);
  // Number of bytes received for the current incomplete multi-byte character.
  this.charReceived = 0;
  // Number of bytes expected for the current incomplete multi-byte character.
  this.charLength = 0;
};


// write decodes the given buffer and returns it as JS string that is
// guaranteed to not contain any partial multi-byte characters. Any partial
// character found at the end of the buffer is buffered up, and will be
// returned when calling write again with the remaining bytes.
//
// Note: Converting a Buffer containing an orphan surrogate to a String
// currently works, but converting a String to a Buffer (via `new Buffer`, or
// Buffer#write) will replace incomplete surrogates with the unicode
// replacement character. See https://codereview.chromium.org/121173009/ .
StringDecoder.prototype.write = function(buffer) {
  var charStr = '';
  // if our last write ended with an incomplete multibyte character
  while (this.charLength) {
    // determine how many remaining bytes this buffer has to offer for this char
    var available = (buffer.length >= this.charLength - this.charReceived) ?
        this.charLength - this.charReceived :
        buffer.length;

    // add the new bytes to the char buffer
    buffer.copy(this.charBuffer, this.charReceived, 0, available);
    this.charReceived += available;

    if (this.charReceived < this.charLength) {
      // still not enough chars in this buffer? wait for more ...
      return '';
    }

    // remove bytes belonging to the current character from the buffer
    buffer = buffer.slice(available, buffer.length);

    // get the character that was split
    charStr = this.charBuffer.slice(0, this.charLength).toString(this.encoding);

    // CESU-8: lead surrogate (D800-DBFF) is also the incomplete character
    var charCode = charStr.charCodeAt(charStr.length - 1);
    if (charCode >= 0xD800 && charCode <= 0xDBFF) {
      this.charLength += this.surrogateSize;
      charStr = '';
      continue;
    }
    this.charReceived = this.charLength = 0;

    // if there are no more bytes in this buffer, just emit our char
    if (buffer.length === 0) {
      return charStr;
    }
    break;
  }

  // determine and set charLength / charReceived
  this.detectIncompleteChar(buffer);

  var end = buffer.length;
  if (this.charLength) {
    // buffer the incomplete character bytes we got
    buffer.copy(this.charBuffer, 0, buffer.length - this.charReceived, end);
    end -= this.charReceived;
  }

  charStr += buffer.toString(this.encoding, 0, end);

  var end = charStr.length - 1;
  var charCode = charStr.charCodeAt(end);
  // CESU-8: lead surrogate (D800-DBFF) is also the incomplete character
  if (charCode >= 0xD800 && charCode <= 0xDBFF) {
    var size = this.surrogateSize;
    this.charLength += size;
    this.charReceived += size;
    this.charBuffer.copy(this.charBuffer, size, 0, size);
    buffer.copy(this.charBuffer, 0, 0, size);
    return charStr.substring(0, end);
  }

  // or just emit the charStr
  return charStr;
};

// detectIncompleteChar determines if there is an incomplete UTF-8 character at
// the end of the given buffer. If so, it sets this.charLength to the byte
// length that character, and sets this.charReceived to the number of bytes
// that are available for this character.
StringDecoder.prototype.detectIncompleteChar = function(buffer) {
  // determine how many bytes we have to check at the end of this buffer
  var i = (buffer.length >= 3) ? 3 : buffer.length;

  // Figure out if one of the last i bytes of our buffer announces an
  // incomplete char.
  for (; i > 0; i--) {
    var c = buffer[buffer.length - i];

    // See http://en.wikipedia.org/wiki/UTF-8#Description

    // 110XXXXX
    if (i == 1 && c >> 5 == 0x06) {
      this.charLength = 2;
      break;
    }

    // 1110XXXX
    if (i <= 2 && c >> 4 == 0x0E) {
      this.charLength = 3;
      break;
    }

    // 11110XXX
    if (i <= 3 && c >> 3 == 0x1E) {
      this.charLength = 4;
      break;
    }
  }
  this.charReceived = i;
};

StringDecoder.prototype.end = function(buffer) {
  var res = '';
  if (buffer && buffer.length)
    res = this.write(buffer);

  if (this.charReceived) {
    var cr = this.charReceived;
    var buf = this.charBuffer;
    var enc = this.encoding;
    res += buf.slice(0, cr).toString(enc);
  }

  return res;
};

function passThroughWrite(buffer) {
  return buffer.toString(this.encoding);
}

function utf16DetectIncompleteChar(buffer) {
  this.charReceived = buffer.length % 2;
  this.charLength = this.charReceived ? 2 : 0;
}

function base64DetectIncompleteChar(buffer) {
  this.charReceived = buffer.length % 3;
  this.charLength = this.charReceived ? 3 : 0;
}

},{"buffer":"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/browserify/node_modules/buffer/index.js"}],"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/browserify/node_modules/util/support/isBufferBrowser.js":[function(require,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/browserify/node_modules/util/util.js":[function(require,module,exports){
(function (process,global){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function(fn, msg) {
  // Allow for deprecating things in the process of starting up.
  if (isUndefined(global.process)) {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  if (process.noDeprecation === true) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};


var debugs = {};
var debugEnviron;
exports.debuglog = function(set) {
  if (isUndefined(debugEnviron))
    debugEnviron = process.env.NODE_DEBUG || '';
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = require('./support/isBuffer');

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = require('inherits');

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./support/isBuffer":"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/browserify/node_modules/util/support/isBufferBrowser.js","_process":"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/browserify/node_modules/process/browser.js","inherits":"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/browserify/node_modules/inherits/inherits_browser.js"}],"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/check-types/src/check-types.js":[function(require,module,exports){
/**
 * This module exports functions for checking types
 * and throwing exceptions.
 */

/*globals define, module */

(function (globals) {
    'use strict';

    var messages, predicates, functions, assert, not, maybe, either;

    messages = {
        like: 'Invalid type',
        instance: 'Invalid type',
        emptyObject: 'Invalid object',
        object: 'Invalid object',
        assigned: 'Invalid value',
        undefined: 'Invalid value',
        null: 'Invalid value',
        hasLength: 'Invalid length',
        emptyArray: 'Invalid array',
        array: 'Invalid array',
        date: 'Invalid date',
        error: 'Invalid error',
        fn: 'Invalid function',
        match: 'Invalid string',
        contains: 'Invalid string',
        unemptyString: 'Invalid string',
        string: 'Invalid string',
        odd: 'Invalid number',
        even: 'Invalid number',
        between: 'Invalid number',
        greater: 'Invalid number',
        less: 'Invalid number',
        positive: 'Invalid number',
        negative: 'Invalid number',
        integer: 'Invalid number',
        zero: 'Invalid number',
        number: 'Invalid number',
        boolean: 'Invalid boolean'
    };

    predicates = {
        like: like,
        instance: instance,
        emptyObject: emptyObject,
        object: object,
        assigned: assigned,
        undefined: isUndefined,
        null: isNull,
        hasLength: hasLength,
        emptyArray: emptyArray,
        array: array,
        date: date,
        error: error,
        function: isFunction,
        match: match,
        contains: contains,
        unemptyString: unemptyString,
        string: string,
        odd: odd,
        even: even,
        between: between,
        greater: greater,
        less: less,
        positive: positive,
        negative: negative,
        integer : integer,
        zero: zero,
        number: number,
        boolean: boolean
    };

    functions = {
        apply: apply,
        map: map,
        all: all,
        any: any
    };

    functions = mixin(functions, predicates);
    assert = createModifiedPredicates(assertModifier, assertImpl);
    not = createModifiedPredicates(notModifier, notImpl);
    maybe = createModifiedPredicates(maybeModifier, maybeImpl);
    either = createModifiedPredicates(eitherModifier);
    assert.not = createModifiedFunctions(assertModifier, not);
    assert.maybe = createModifiedFunctions(assertModifier, maybe);
    assert.either = createModifiedFunctions(assertEitherModifier, predicates);

    exportFunctions(mixin(functions, {
        assert: assert,
        not: not,
        maybe: maybe,
        either: either
    }));

    /**
     * Public function `like`.
     *
     * Tests whether an object 'quacks like a duck'.
     * Returns `true` if the first argument has all of
     * the properties of the second, archetypal argument
     * (the 'duck'). Returns `false` otherwise.
     *
     */
    function like (data, duck) {
        var name;

        for (name in duck) {
            if (duck.hasOwnProperty(name)) {
                if (data.hasOwnProperty(name) === false || typeof data[name] !== typeof duck[name]) {
                    return false;
                }

                if (object(data[name]) && like(data[name], duck[name]) === false) {
                    return false;
                }
            }
        }

        return true;
    }

    /**
     * Public function `instance`.
     *
     * Returns `true` if an object is an instance of a prototype,
     * `false` otherwise.
     *
     */
    function instance (data, prototype) {
        if (data && isFunction(prototype) && data instanceof prototype) {
            return true;
        }

        return false;
    }

    /**
     * Public function `emptyObject`.
     *
     * Returns `true` if something is an empty object,
     * `false` otherwise.
     *
     */
    function emptyObject (data) {
        return object(data) && Object.keys(data).length === 0;
    }

    /**
     * Public function `object`.
     *
     * Returns `true` if something is a plain-old JS object,
     * `false` otherwise.
     *
     */
    function object (data) {
        return Object.prototype.toString.call(data) === '[object Object]';
    }

    /**
     * Public function `assigned`.
     *
     * Returns `true` if something is not null or undefined,
     * `false` otherwise.
     *
     */
    function assigned (data) {
        return !isUndefined(data) && !isNull(data);
    }

    /**
     * Public function `undefined`.
     *
     * Returns `true` if something is undefined,
     * `false` otherwise.
     *
     */
    function isUndefined (data) {
        return data === undefined;
    }

    /**
     * Public function `null`.
     *
     * Returns `true` if something is null,
     * `false` otherwise.
     *
     */
    function isNull (data) {
        return data === null;
    }

    /**
     * Public function `hasLength`.
     *
     * Returns `true` if something is has a length property
     * that equals `value`, `false` otherwise.
     *
     */
    function hasLength (data, value) {
        return assigned(data) && data.length === value;
    }

    /**
     * Public function `emptyArray`.
     *
     * Returns `true` if something is an empty array,
     * `false` otherwise.
     *
     */
    function emptyArray (data) {
        return array(data) && data.length === 0;
    }

    /**
     * Public function `array`.
     *
     * Returns `true` something is an array,
     * `false` otherwise.
     *
     */
    function array (data) {
        return Array.isArray(data);
    }

    /**
     * Public function `date`.
     *
     * Returns `true` something is a valid date,
     * `false` otherwise.
     *
     */
    function date (data) {
        return Object.prototype.toString.call(data) === '[object Date]' &&
            !isNaN(data.getTime());
    }

    /**
     * Public function `error`.
     *
     * Returns `true` if something is a plain-old JS object,
     * `false` otherwise.
     *
     */
    function error (data) {
        return Object.prototype.toString.call(data) === '[object Error]';
    }

    /**
     * Public function `function`.
     *
     * Returns `true` if something is function,
     * `false` otherwise.
     *
     */
    function isFunction (data) {
        return typeof data === 'function';
    }

    /**
     * Public function `match`.
     *
     * Returns `true` if something is a string
     * that matches `regex`, `false` otherwise.
     *
     */
    function match (data, regex) {
        return string(data) && !!data.match(regex);
    }

    /**
     * Public function `contains`.
     *
     * Returns `true` if something is a string
     * that contains `substring`, `false` otherwise.
     *
     */
    function contains (data, substring) {
        return string(data) && data.indexOf(substring) !== -1;
    }

    /**
     * Public function `unemptyString`.
     *
     * Returns `true` if something is a non-empty string,
     * `false` otherwise.
     *
     */
    function unemptyString (data) {
        return string(data) && data !== '';
    }

    /**
     * Public function `string`.
     *
     * Returns `true` if something is a string, `false` otherwise.
     *
     */
    function string (data) {
        return typeof data === 'string';
    }

    /**
     * Public function `odd`.
     *
     * Returns `true` if something is an odd number,
     * `false` otherwise.
     *
     */
    function odd (data) {
        return integer(data) && !even(data);
    }

    /**
     * Public function `even`.
     *
     * Returns `true` if something is an even number,
     * `false` otherwise.
     *
     */
    function even (data) {
        return number(data) && data % 2 === 0;
    }

    /**
     * Public function `integer`.
     *
     * Returns `true` if something is an integer,
     * `false` otherwise.
     *
     */
    function integer (data) {
        return number(data) && data % 1 === 0;
    }

    /**
     * Public function `between`.
     *
     * Returns `true` if something is a number
     * between `a` and `b`, `false` otherwise.
     *
     */
    function between (data, a, b) {
        if (a < b) {
            return greater(data, a) && less(data, b);
        }

        return less(data, a) && greater(data, b);
    }

    /**
     * Public function `greater`.
     *
     * Returns `true` if something is a number
     * greater than `value`, `false` otherwise.
     *
     */
    function greater (data, value) {
        return number(data) && data > value;
    }

    /**
     * Public function `less`.
     *
     * Returns `true` if something is a number
     * less than `value`, `false` otherwise.
     *
     */
    function less (data, value) {
        return number(data) && data < value;
    }

    /**
     * Public function `positive`.
     *
     * Returns `true` if something is a positive number,
     * `false` otherwise.
     *
     */
    function positive (data) {
        return greater(data, 0);
    }

    /**
     * Public function `negative`.
     *
     * Returns `true` if something is a negative number,
     * `false` otherwise.
     *
     * @param data          The thing to test.
     */
    function negative (data) {
        return less(data, 0);
    }

    /**
     * Public function `number`.
     *
     * Returns `true` if data is a number,
     * `false` otherwise.
     *
     */
    function number (data) {
        return typeof data === 'number' && isNaN(data) === false &&
               data !== Number.POSITIVE_INFINITY &&
               data !== Number.NEGATIVE_INFINITY;
    }

    /**
     * Public function `zero`.
     *
     * Returns `true` if something is zero,
     * `false` otherwise.
     *
     * @param data          The thing to test.
     */
    function zero (data) {
        return data === 0;
    }

    /**
     * Public function `boolean`.
     *
     * Returns `true` if data is a boolean value,
     * `false` otherwise.
     *
     */
    function boolean (data) {
        return data === false || data === true;
    }

    /**
     * Public function `apply`.
     *
     * Maps each value from the data to the corresponding predicate and returns
     * the result array. If the same function is to be applied across all of the
     * data, a single predicate function may be passed in.
     *
     */
    function apply (data, predicates) {
        assert.array(data);

        if (isFunction(predicates)) {
            return data.map(function (value) {
                return predicates(value);
            });
        }

        assert.array(predicates);
        assert.hasLength(data, predicates.length);

        return data.map(function (value, index) {
            return predicates[index](value);
        });
    }

    /**
     * Public function `map`.
     *
     * Maps each value from the data to the corresponding predicate and returns
     * the result object. Supports nested objects. If the data is not nested and
     * the same function is to be applied across all of it, a single predicate
     * function may be passed in.
     *
     */
    function map (data, predicates) {
        assert.object(data);

        if (isFunction(predicates)) {
            return mapSimple(data, predicates);
        }

        assert.object(predicates);

        return mapComplex(data, predicates);
    }

    function mapSimple (data, predicate) {
        var result = {};

        Object.keys(data).forEach(function (key) {
            result[key] = predicate(data[key]);
        });

        return result;
    }

    function mapComplex (data, predicates) {
        var result = {};

        Object.keys(predicates).forEach(function (key) {
            var predicate = predicates[key];

            if (isFunction(predicate)) {
                result[key] = predicate(data[key]);
            } else if (object(predicate)) {
                result[key] = mapComplex(data[key], predicate);
            }
        });

        return result;
    }

    /**
     * Public function `all`
     *
     * Check that all boolean values are true
     * in an array (returned from `apply`)
     * or object (returned from `map`).
     *
     */
    function all (data) {
        if (array(data)) {
            return testArray(data, false);
        }

        assert.object(data);

        return testObject(data, false);
    }

    function testArray (data, result) {
        var i;

        for (i = 0; i < data.length; i += 1) {
            if (data[i] === result) {
                return result;
            }
        }

        return !result;
    }

    function testObject (data, result) {
        var key, value;

        for (key in data) {
            if (data.hasOwnProperty(key)) {
                value = data[key];

                if (object(value) && testObject(value, result) === result) {
                    return result;
                }

                if (value === result) {
                    return result;
                }
            }
        }

        return !result;
    }

    /**
     * Public function `any`
     *
     * Check that at least one boolean value is true
     * in an array (returned from `apply`)
     * or object (returned from `map`).
     *
     */
    function any (data) {
        if (array(data)) {
            return testArray(data, true);
        }

        assert.object(data);

        return testObject(data, true);
    }

    function mixin (target, source) {
        Object.keys(source).forEach(function (key) {
            target[key] = source[key];
        });

        return target;
    }

    /**
     * Public modifier `assert`.
     *
     * Throws if `predicate` returns `false`.
     */
    function assertModifier (predicate, defaultMessage) {
        return function () {
            assertPredicate(predicate, arguments, defaultMessage);
        };
    }

    function assertPredicate (predicate, args, defaultMessage) {
        var message = args[args.length - 1];
        assertImpl(predicate.apply(null, args), unemptyString(message) ? message : defaultMessage);
    }

    function assertImpl (value, message) {
        if (value === false) {
            throw new Error(message || 'Assertion failed');
        }
    }

    function assertEitherModifier (predicate, defaultMessage) {
        return function () {
            var error;

            try {
                assertPredicate(predicate, arguments, defaultMessage);
            } catch (e) {
                error = e;
            }

            return {
                or: Object.keys(predicates).reduce(delayedAssert, {})
            };

            function delayedAssert (result, key) {
                result[key] = function () {
                    if (error && !predicates[key].apply(null, arguments)) {
                        throw error;
                    }
                };

                return result;
            }
        };
    }

    /**
     * Public modifier `not`.
     *
     * Negates `predicate`.
     */
    function notModifier (predicate) {
        return function () {
            return notImpl(predicate.apply(null, arguments));
        };
    }

    function notImpl (value) {
        return !value;
    }

    /**
     * Public modifier `maybe`.
     *
     * Returns `true` if predicate argument is  `null` or `undefined`,
     * otherwise propagates the return value from `predicate`.
     */
    function maybeModifier (predicate) {
        return function () {
            if (!assigned(arguments[0])) {
                return true;
            }

            return predicate.apply(null, arguments);
        };
    }

    function maybeImpl (value) {
        if (assigned(value) === false) {
            return true;
        }

        return value;
    }

    /**
     * Public modifier `either`.
     *
     * Returns `true` if either predicate is true.
     */
    function eitherModifier (predicate) {
        return function () {
            var shortcut = predicate.apply(null, arguments);

            return {
                or: Object.keys(predicates).reduce(nopOrPredicate, {})
            };

            function nopOrPredicate (result, key) {
                result[key] = shortcut ? nop : predicates[key];
                return result;
            }
        };

        function nop () {
            return true;
        }
    }

    function createModifiedPredicates (modifier, object) {
        return createModifiedFunctions(modifier, predicates, object);
    }

    function createModifiedFunctions (modifier, functions, object) {
        var result = object || {};

        Object.keys(functions).forEach(function (key) {
            Object.defineProperty(result, key, {
                configurable: false,
                enumerable: true,
                writable: false,
                value: modifier(functions[key], messages[key])
            });
        });

        return result;
    }

    function exportFunctions (functions) {
        if (typeof define === 'function' && define.amd) {
            define(function () {
                return functions;
            });
        } else if (typeof module !== 'undefined' && module !== null && module.exports) {
            module.exports = functions;
        } else {
            globals.check = functions;
        }
    }
}(this));

},{}],"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/flux/index.js":[function(require,module,exports){
/**
 * Copyright (c) 2014, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

module.exports.Dispatcher = require('./lib/Dispatcher')

},{"./lib/Dispatcher":"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/flux/lib/Dispatcher.js"}],"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/flux/lib/Dispatcher.js":[function(require,module,exports){
/*
 * Copyright (c) 2014, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule Dispatcher
 * @typechecks
 */

"use strict";

var invariant = require('./invariant');

var _lastID = 1;
var _prefix = 'ID_';

/**
 * Dispatcher is used to broadcast payloads to registered callbacks. This is
 * different from generic pub-sub systems in two ways:
 *
 *   1) Callbacks are not subscribed to particular events. Every payload is
 *      dispatched to every registered callback.
 *   2) Callbacks can be deferred in whole or part until other callbacks have
 *      been executed.
 *
 * For example, consider this hypothetical flight destination form, which
 * selects a default city when a country is selected:
 *
 *   var flightDispatcher = new Dispatcher();
 *
 *   // Keeps track of which country is selected
 *   var CountryStore = {country: null};
 *
 *   // Keeps track of which city is selected
 *   var CityStore = {city: null};
 *
 *   // Keeps track of the base flight price of the selected city
 *   var FlightPriceStore = {price: null}
 *
 * When a user changes the selected city, we dispatch the payload:
 *
 *   flightDispatcher.dispatch({
 *     actionType: 'city-update',
 *     selectedCity: 'paris'
 *   });
 *
 * This payload is digested by `CityStore`:
 *
 *   flightDispatcher.register(function(payload) {
 *     if (payload.actionType === 'city-update') {
 *       CityStore.city = payload.selectedCity;
 *     }
 *   });
 *
 * When the user selects a country, we dispatch the payload:
 *
 *   flightDispatcher.dispatch({
 *     actionType: 'country-update',
 *     selectedCountry: 'australia'
 *   });
 *
 * This payload is digested by both stores:
 *
 *    CountryStore.dispatchToken = flightDispatcher.register(function(payload) {
 *     if (payload.actionType === 'country-update') {
 *       CountryStore.country = payload.selectedCountry;
 *     }
 *   });
 *
 * When the callback to update `CountryStore` is registered, we save a reference
 * to the returned token. Using this token with `waitFor()`, we can guarantee
 * that `CountryStore` is updated before the callback that updates `CityStore`
 * needs to query its data.
 *
 *   CityStore.dispatchToken = flightDispatcher.register(function(payload) {
 *     if (payload.actionType === 'country-update') {
 *       // `CountryStore.country` may not be updated.
 *       flightDispatcher.waitFor([CountryStore.dispatchToken]);
 *       // `CountryStore.country` is now guaranteed to be updated.
 *
 *       // Select the default city for the new country
 *       CityStore.city = getDefaultCityForCountry(CountryStore.country);
 *     }
 *   });
 *
 * The usage of `waitFor()` can be chained, for example:
 *
 *   FlightPriceStore.dispatchToken =
 *     flightDispatcher.register(function(payload) {
 *       switch (payload.actionType) {
 *         case 'country-update':
 *           flightDispatcher.waitFor([CityStore.dispatchToken]);
 *           FlightPriceStore.price =
 *             getFlightPriceStore(CountryStore.country, CityStore.city);
 *           break;
 *
 *         case 'city-update':
 *           FlightPriceStore.price =
 *             FlightPriceStore(CountryStore.country, CityStore.city);
 *           break;
 *     }
 *   });
 *
 * The `country-update` payload will be guaranteed to invoke the stores'
 * registered callbacks in order: `CountryStore`, `CityStore`, then
 * `FlightPriceStore`.
 */

  function Dispatcher() {
    this.$Dispatcher_callbacks = {};
    this.$Dispatcher_isPending = {};
    this.$Dispatcher_isHandled = {};
    this.$Dispatcher_isDispatching = false;
    this.$Dispatcher_pendingPayload = null;
  }

  /**
   * Registers a callback to be invoked with every dispatched payload. Returns
   * a token that can be used with `waitFor()`.
   *
   * @param {function} callback
   * @return {string}
   */
  Dispatcher.prototype.register=function(callback) {
    var id = _prefix + _lastID++;
    this.$Dispatcher_callbacks[id] = callback;
    return id;
  };

  /**
   * Removes a callback based on its token.
   *
   * @param {string} id
   */
  Dispatcher.prototype.unregister=function(id) {
    invariant(
      this.$Dispatcher_callbacks[id],
      'Dispatcher.unregister(...): `%s` does not map to a registered callback.',
      id
    );
    delete this.$Dispatcher_callbacks[id];
  };

  /**
   * Waits for the callbacks specified to be invoked before continuing execution
   * of the current callback. This method should only be used by a callback in
   * response to a dispatched payload.
   *
   * @param {array<string>} ids
   */
  Dispatcher.prototype.waitFor=function(ids) {
    invariant(
      this.$Dispatcher_isDispatching,
      'Dispatcher.waitFor(...): Must be invoked while dispatching.'
    );
    for (var ii = 0; ii < ids.length; ii++) {
      var id = ids[ii];
      if (this.$Dispatcher_isPending[id]) {
        invariant(
          this.$Dispatcher_isHandled[id],
          'Dispatcher.waitFor(...): Circular dependency detected while ' +
          'waiting for `%s`.',
          id
        );
        continue;
      }
      invariant(
        this.$Dispatcher_callbacks[id],
        'Dispatcher.waitFor(...): `%s` does not map to a registered callback.',
        id
      );
      this.$Dispatcher_invokeCallback(id);
    }
  };

  /**
   * Dispatches a payload to all registered callbacks.
   *
   * @param {object} payload
   */
  Dispatcher.prototype.dispatch=function(payload) {
    invariant(
      !this.$Dispatcher_isDispatching,
      'Dispatch.dispatch(...): Cannot dispatch in the middle of a dispatch.'
    );
    this.$Dispatcher_startDispatching(payload);
    try {
      for (var id in this.$Dispatcher_callbacks) {
        if (this.$Dispatcher_isPending[id]) {
          continue;
        }
        this.$Dispatcher_invokeCallback(id);
      }
    } finally {
      this.$Dispatcher_stopDispatching();
    }
  };

  /**
   * Is this Dispatcher currently dispatching.
   *
   * @return {boolean}
   */
  Dispatcher.prototype.isDispatching=function() {
    return this.$Dispatcher_isDispatching;
  };

  /**
   * Call the callback stored with the given id. Also do some internal
   * bookkeeping.
   *
   * @param {string} id
   * @internal
   */
  Dispatcher.prototype.$Dispatcher_invokeCallback=function(id) {
    this.$Dispatcher_isPending[id] = true;
    this.$Dispatcher_callbacks[id](this.$Dispatcher_pendingPayload);
    this.$Dispatcher_isHandled[id] = true;
  };

  /**
   * Set up bookkeeping needed when dispatching.
   *
   * @param {object} payload
   * @internal
   */
  Dispatcher.prototype.$Dispatcher_startDispatching=function(payload) {
    for (var id in this.$Dispatcher_callbacks) {
      this.$Dispatcher_isPending[id] = false;
      this.$Dispatcher_isHandled[id] = false;
    }
    this.$Dispatcher_pendingPayload = payload;
    this.$Dispatcher_isDispatching = true;
  };

  /**
   * Clear bookkeeping used for dispatching.
   *
   * @internal
   */
  Dispatcher.prototype.$Dispatcher_stopDispatching=function() {
    this.$Dispatcher_pendingPayload = null;
    this.$Dispatcher_isDispatching = false;
  };


module.exports = Dispatcher;

},{"./invariant":"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/flux/lib/invariant.js"}],"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/flux/lib/invariant.js":[function(require,module,exports){
/**
 * Copyright (c) 2014, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule invariant
 */

"use strict";

/**
 * Use invariant() to assert state which your program assumes to be true.
 *
 * Provide sprintf-style format (only %s is supported) and arguments
 * to provide information about what broke and what you were
 * expecting.
 *
 * The invariant message will be stripped in production, but the invariant
 * will remain to ensure logic does not differ in production.
 */

var invariant = function(condition, format, a, b, c, d, e, f) {
  if (false) {
    if (format === undefined) {
      throw new Error('invariant requires an error message argument');
    }
  }

  if (!condition) {
    var error;
    if (format === undefined) {
      error = new Error(
        'Minified exception occurred; use the non-minified dev environment ' +
        'for the full error message and additional helpful warnings.'
      );
    } else {
      var args = [a, b, c, d, e, f];
      var argIndex = 0;
      error = new Error(
        'Invariant Violation: ' +
        format.replace(/%s/g, function() { return args[argIndex++]; })
      );
    }

    error.framesToPop = 1; // we don't care about invariant's own frame
    throw error;
  }
};

module.exports = invariant;

},{}],"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/global/document.js":[function(require,module,exports){
(function (global){
var topLevel = typeof global !== 'undefined' ? global :
    typeof window !== 'undefined' ? window : {}
var minDoc = require('min-document');

if (typeof document !== 'undefined') {
    module.exports = document;
} else {
    var doccy = topLevel['__GLOBAL_DOCUMENT_CACHE@4'];

    if (!doccy) {
        doccy = topLevel['__GLOBAL_DOCUMENT_CACHE@4'] = minDoc;
    }

    module.exports = doccy;
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"min-document":"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/browserify/node_modules/browser-resolve/empty.js"}],"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/global/window.js":[function(require,module,exports){
(function (global){
if (typeof window !== "undefined") {
    module.exports = window;
} else if (typeof global !== "undefined") {
    module.exports = global;
} else if (typeof self !== "undefined"){
    module.exports = self;
} else {
    module.exports = {};
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/printf/lib/printf.js":[function(require,module,exports){

var util = require('util');

var tokenize = function(/*String*/ str, /*RegExp*/ re, /*Function?*/ parseDelim, /*Object?*/ instance){
  // summary:
  //    Split a string by a regular expression with the ability to capture the delimeters
  // parseDelim:
  //    Each group (excluding the 0 group) is passed as a parameter. If the function returns
  //    a value, it's added to the list of tokens.
  // instance:
  //    Used as the "this' instance when calling parseDelim
  var tokens = [];
  var match, content, lastIndex = 0;
  while(match = re.exec(str)){
    content = str.slice(lastIndex, re.lastIndex - match[0].length);
    if(content.length){
      tokens.push(content);
    }
    if(parseDelim){
      var parsed = parseDelim.apply(instance, match.slice(1).concat(tokens.length));
      if(typeof parsed != 'undefined'){
        if(parsed.specifier === '%'){
          tokens.push('%');
        }else{
          tokens.push(parsed);
        }
      }
    }
    lastIndex = re.lastIndex;
  }
  content = str.slice(lastIndex);
  if(content.length){
    tokens.push(content);
  }
  return tokens;
}

var Formatter = function(/*String*/ format){
  var tokens = [];
  this._mapped = false;
  this._format = format;
  this._tokens = tokenize(format, this._re, this._parseDelim, this);
}

Formatter.prototype._re = /\%(?:\(([\w_]+)\)|([1-9]\d*)\$)?([0 +\-\#]*)(\*|\d+)?(\.)?(\*|\d+)?[hlL]?([\%bscdeEfFgGioOuxX])/g;
Formatter.prototype._parseDelim = function(mapping, intmapping, flags, minWidth, period, precision, specifier){
  if(mapping){
    this._mapped = true;
  }
  return {
    mapping: mapping,
    intmapping: intmapping,
    flags: flags,
    _minWidth: minWidth, // May be dependent on parameters
    period: period,
    _precision: precision, // May be dependent on parameters
    specifier: specifier
  };
};
Formatter.prototype._specifiers = {
  b: {
    base: 2,
    isInt: true
  },
  o: {
    base: 8,
    isInt: true
  },
  x: {
    base: 16,
    isInt: true
  },
  X: {
    extend: ['x'],
    toUpper: true
  },
  d: {
    base: 10,
    isInt: true
  },
  i: {
    extend: ['d']
  },
  u: {
    extend: ['d'],
    isUnsigned: true
  },
  c: {
    setArg: function(token){
      if(!isNaN(token.arg)){
        var num = parseInt(token.arg);
        if(num < 0 || num > 127){
          throw new Error('invalid character code passed to %c in printf');
        }
        token.arg = isNaN(num) ? '' + num : String.fromCharCode(num);
      }
    }
  },
  s: {
    setMaxWidth: function(token){
      token.maxWidth = (token.period == '.') ? token.precision : -1;
    }
  },
  e: {
    isDouble: true,
    doubleNotation: 'e'
  },
  E: {
    extend: ['e'],
    toUpper: true
  },
  f: {
    isDouble: true,
    doubleNotation: 'f'
  },
  F: {
    extend: ['f']
  },
  g: {
    isDouble: true,
    doubleNotation: 'g'
  },
  G: {
    extend: ['g'],
    toUpper: true
  },
  O: {
    isObject: true
  },
};
Formatter.prototype.format = function(/*mixed...*/ filler){
  if(this._mapped && typeof filler != 'object'){
    throw new Error('format requires a mapping');
  }

  var str = '';
  var position = 0;
  for(var i = 0, token; i < this._tokens.length; i++){
    token = this._tokens[i];
    
    if(typeof token == 'string'){
      str += token;
    }else{
      if(this._mapped){
        if(typeof filler[token.mapping] == 'undefined'){
          throw new Error('missing key ' + token.mapping);
        }
        token.arg = filler[token.mapping];
      }else{
        if(token.intmapping){
          position = parseInt(token.intmapping) - 1;
        }
        if(position >= arguments.length){
          throw new Error('got ' + arguments.length + ' printf arguments, insufficient for \'' + this._format + '\'');
        }
        token.arg = arguments[position++];
      }

      if(!token.compiled){
        token.compiled = true;
        token.sign = '';
        token.zeroPad = false;
        token.rightJustify = false;
        token.alternative = false;

        var flags = {};
        for(var fi = token.flags.length; fi--;){
          var flag = token.flags.charAt(fi);
          flags[flag] = true;
          switch(flag){
            case ' ':
              token.sign = ' ';
              break;
            case '+':
              token.sign = '+';
              break;
            case '0':
              token.zeroPad = (flags['-']) ? false : true;
              break;
            case '-':
              token.rightJustify = true;
              token.zeroPad = false;
              break;
            case '#':
              token.alternative = true;
              break;
            default:
              throw Error('bad formatting flag \'' + token.flags.charAt(fi) + '\'');
          }
        }

        token.minWidth = (token._minWidth) ? parseInt(token._minWidth) : 0;
        token.maxWidth = -1;
        token.toUpper = false;
        token.isUnsigned = false;
        token.isInt = false;
        token.isDouble = false;
        token.isObject = false;
        token.precision = 1;
        if(token.period == '.'){
          if(token._precision){
            token.precision = parseInt(token._precision);
          }else{
            token.precision = 0;
          }
        }

        var mixins = this._specifiers[token.specifier];
        if(typeof mixins == 'undefined'){
          throw new Error('unexpected specifier \'' + token.specifier + '\'');
        }
        if(mixins.extend){
          var s = this._specifiers[mixins.extend];
          for(var k in s){
            mixins[k] = s[k]
          }
          delete mixins.extend;
        }
        for(var l in mixins){
          token[l] = mixins[l];
        }
      }

      if(typeof token.setArg == 'function'){
        token.setArg(token);
      }

      if(typeof token.setMaxWidth == 'function'){
        token.setMaxWidth(token);
      }

      if(token._minWidth == '*'){
        if(this._mapped){
          throw new Error('* width not supported in mapped formats');
        }
        token.minWidth = parseInt(arguments[position++]);
        if(isNaN(token.minWidth)){
          throw new Error('the argument for * width at position ' + position + ' is not a number in ' + this._format);
        }
        // negative width means rightJustify
        if (token.minWidth < 0) {
          token.rightJustify = true;
          token.minWidth = -token.minWidth;
        }
      }

      if(token._precision == '*' && token.period == '.'){
        if(this._mapped){
          throw new Error('* precision not supported in mapped formats');
        }
        token.precision = parseInt(arguments[position++]);
        if(isNaN(token.precision)){
          throw Error('the argument for * precision at position ' + position + ' is not a number in ' + this._format);
        }
        // negative precision means unspecified
        if (token.precision < 0) {
          token.precision = 1;
          token.period = '';
        }
      }
      if(token.isInt){
        // a specified precision means no zero padding
        if(token.period == '.'){
          token.zeroPad = false;
        }
        this.formatInt(token);
      }else if(token.isDouble){
        if(token.period != '.'){
          token.precision = 6;
        }
        this.formatDouble(token); 
      }else if(token.isObject){
        this.formatObject(token);
      }
      this.fitField(token);

      str += '' + token.arg;
    }
  }

  return str;
};
Formatter.prototype._zeros10 = '0000000000';
Formatter.prototype._spaces10 = '          ';
Formatter.prototype.formatInt = function(token) {
  var i = parseInt(token.arg);
  if(!isFinite(i)){ // isNaN(f) || f == Number.POSITIVE_INFINITY || f == Number.NEGATIVE_INFINITY)
    // allow this only if arg is number
    if(typeof token.arg != 'number'){
      throw new Error('format argument \'' + token.arg + '\' not an integer; parseInt returned ' + i);
    }
    //return '' + i;
    i = 0;
  }

  // if not base 10, make negatives be positive
  // otherwise, (-10).toString(16) is '-a' instead of 'fffffff6'
  if(i < 0 && (token.isUnsigned || token.base != 10)){
    i = 0xffffffff + i + 1;
  } 

  if(i < 0){
    token.arg = (- i).toString(token.base);
    this.zeroPad(token);
    token.arg = '-' + token.arg;
  }else{
    token.arg = i.toString(token.base);
    // need to make sure that argument 0 with precision==0 is formatted as ''
    if(!i && !token.precision){
      token.arg = '';
    }else{
      this.zeroPad(token);
    }
    if(token.sign){
      token.arg = token.sign + token.arg;
    }
  }
  if(token.base == 16){
    if(token.alternative){
      token.arg = '0x' + token.arg;
    }
    token.arg = token.toUpper ? token.arg.toUpperCase() : token.arg.toLowerCase();
  }
  if(token.base == 8){
    if(token.alternative && token.arg.charAt(0) != '0'){
      token.arg = '0' + token.arg;
    }
  }
};
Formatter.prototype.formatDouble = function(token) {
  var f = parseFloat(token.arg);
  if(!isFinite(f)){ // isNaN(f) || f == Number.POSITIVE_INFINITY || f == Number.NEGATIVE_INFINITY)
    // allow this only if arg is number
    if(typeof token.arg != 'number'){
      throw new Error('format argument \'' + token.arg + '\' not a float; parseFloat returned ' + f);
    }
    // C99 says that for 'f':
    //   infinity -> '[-]inf' or '[-]infinity' ('[-]INF' or '[-]INFINITY' for 'F')
    //   NaN -> a string  starting with 'nan' ('NAN' for 'F')
    // this is not commonly implemented though.
    //return '' + f;
    f = 0;
  }

  switch(token.doubleNotation) {
    case 'e': {
      token.arg = f.toExponential(token.precision); 
      break;
    }
    case 'f': {
      token.arg = f.toFixed(token.precision); 
      break;
    }
    case 'g': {
      // C says use 'e' notation if exponent is < -4 or is >= prec
      // ECMAScript for toPrecision says use exponential notation if exponent is >= prec,
      // though step 17 of toPrecision indicates a test for < -6 to force exponential.
      if(Math.abs(f) < 0.0001){
        //print('forcing exponential notation for f=' + f);
        token.arg = f.toExponential(token.precision > 0 ? token.precision - 1 : token.precision);
      }else{
        token.arg = f.toPrecision(token.precision); 
      }

      // In C, unlike 'f', 'gG' removes trailing 0s from fractional part, unless alternative format flag ('#').
      // But ECMAScript formats toPrecision as 0.00100000. So remove trailing 0s.
      if(!token.alternative){ 
        //print('replacing trailing 0 in \'' + s + '\'');
        token.arg = token.arg.replace(/(\..*[^0])0*e/, '$1e');
        // if fractional part is entirely 0, remove it and decimal point
        token.arg = token.arg.replace(/\.0*e/, 'e').replace(/\.0$/,'');
      }
      break;
    }
    default: throw new Error('unexpected double notation \'' + token.doubleNotation + '\'');
  }

  // C says that exponent must have at least two digits.
  // But ECMAScript does not; toExponential results in things like '1.000000e-8' and '1.000000e+8'.
  // Note that s.replace(/e([\+\-])(\d)/, 'e$10$2') won't work because of the '$10' instead of '$1'.
  // And replace(re, func) isn't supported on IE50 or Safari1.
  token.arg = token.arg.replace(/e\+(\d)$/, 'e+0$1').replace(/e\-(\d)$/, 'e-0$1');

  // if alt, ensure a decimal point
  if(token.alternative){
    token.arg = token.arg.replace(/^(\d+)$/,'$1.');
    token.arg = token.arg.replace(/^(\d+)e/,'$1.e');
  }

  if(f >= 0 && token.sign){
    token.arg = token.sign + token.arg;
  }

  token.arg = token.toUpper ? token.arg.toUpperCase() : token.arg.toLowerCase();
};
Formatter.prototype.formatObject = function(token) {
  // If no precision is specified, then reset it to null (infinite depth).
  var precision = (token.period === '.') ? token.precision : null;
  token.arg = util.inspect(token.arg, !token.alternative, precision);
};
Formatter.prototype.zeroPad = function(token, /*Int*/ length) {
  length = (arguments.length == 2) ? length : token.precision;
  var negative = false;
  if(typeof token.arg != "string"){
    token.arg = "" + token.arg;
  }
  if (token.arg.substr(0,1) === '-') {
    negative = true;
    token.arg = token.arg.substr(1);
  }

  var tenless = length - 10;
  while(token.arg.length < tenless){
    token.arg = (token.rightJustify) ? token.arg + this._zeros10 : this._zeros10 + token.arg;
  }
  var pad = length - token.arg.length;
  token.arg = (token.rightJustify) ? token.arg + this._zeros10.substring(0, pad) : this._zeros10.substring(0, pad) + token.arg;
  if (negative) token.arg = '-' + token.arg;
};
Formatter.prototype.fitField = function(token) {
  if(token.maxWidth >= 0 && token.arg.length > token.maxWidth){
    return token.arg.substring(0, token.maxWidth);
  }
  if(token.zeroPad){
    this.zeroPad(token, token.minWidth);
    return;
  }
  this.spacePad(token);
};
Formatter.prototype.spacePad = function(token, /*Int*/ length) {
  length = (arguments.length == 2) ? length : token.minWidth;
  if(typeof token.arg != 'string'){
    token.arg = '' + token.arg;
  }
  var tenless = length - 10;
  while(token.arg.length < tenless){
    token.arg = (token.rightJustify) ? token.arg + this._spaces10 : this._spaces10 + token.arg;
  }
  var pad = length - token.arg.length;
  token.arg = (token.rightJustify) ? token.arg + this._spaces10.substring(0, pad) : this._spaces10.substring(0, pad) + token.arg;
};


module.exports = function(){
  var args = Array.prototype.slice.call(arguments),
    stream, format;
  if(args[0] instanceof require('stream').Stream){
    stream = args.shift();
  }
  format = args.shift();
  var formatter = new Formatter(format);
  var string = formatter.format.apply(formatter, args);
  if(stream){
    stream.write(string);
  }else{
    return string;
  }
};

module.exports.Formatter = Formatter;


},{"stream":"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/browserify/node_modules/stream-browserify/index.js","util":"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/browserify/node_modules/util/util.js"}],"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/react/lib/invariant.js":[function(require,module,exports){
(function (process){
/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule invariant
 */

"use strict";

/**
 * Use invariant() to assert state which your program assumes to be true.
 *
 * Provide sprintf-style format (only %s is supported) and arguments
 * to provide information about what broke and what you were
 * expecting.
 *
 * The invariant message will be stripped in production, but the invariant
 * will remain to ensure logic does not differ in production.
 */

var invariant = function(condition, format, a, b, c, d, e, f) {
  if ("production" !== process.env.NODE_ENV) {
    if (format === undefined) {
      throw new Error('invariant requires an error message argument');
    }
  }

  if (!condition) {
    var error;
    if (format === undefined) {
      error = new Error(
        'Minified exception occurred; use the non-minified dev environment ' +
        'for the full error message and additional helpful warnings.'
      );
    } else {
      var args = [a, b, c, d, e, f];
      var argIndex = 0;
      error = new Error(
        'Invariant Violation: ' +
        format.replace(/%s/g, function() { return args[argIndex++]; })
      );
    }

    error.framesToPop = 1; // we don't care about invariant's own frame
    throw error;
  }
};

module.exports = invariant;

}).call(this,require('_process'))

},{"_process":"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/browserify/node_modules/process/browser.js"}],"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/react/lib/keyMirror.js":[function(require,module,exports){
(function (process){
/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule keyMirror
 * @typechecks static-only
 */

'use strict';

var invariant = require("./invariant");

/**
 * Constructs an enumeration with keys equal to their value.
 *
 * For example:
 *
 *   var COLORS = keyMirror({blue: null, red: null});
 *   var myColor = COLORS.blue;
 *   var isColorValid = !!COLORS[myColor];
 *
 * The last line could not be performed if the values of the generated enum were
 * not equal to their keys.
 *
 *   Input:  {key1: val1, key2: val2}
 *   Output: {key1: key1, key2: key2}
 *
 * @param {object} obj
 * @return {object}
 */
var keyMirror = function(obj) {
  var ret = {};
  var key;
  ("production" !== process.env.NODE_ENV ? invariant(
    obj instanceof Object && !Array.isArray(obj),
    'keyMirror(...): Argument must be an object.'
  ) : invariant(obj instanceof Object && !Array.isArray(obj)));
  for (key in obj) {
    if (!obj.hasOwnProperty(key)) {
      continue;
    }
    ret[key] = key;
  }
  return ret;
};

module.exports = keyMirror;

}).call(this,require('_process'))

},{"./invariant":"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/react/lib/invariant.js","_process":"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/browserify/node_modules/process/browser.js"}],"/Users/carl-erik.kopseng/dev_priv/Emissions/server/EventConstants.js":[function(require,module,exports){
'use strict';

var keyMirror = require('react/lib/keyMirror');

module.exports = keyMirror({
    MISSION_STARTED: null,
    MISSION_STOPPED: null,
    MISSION_RESET: null,
    MISSION_COMPLETED: null,
    APP_STATE: null,

    ADD_MESSAGE: null,

    //ACTIONS
    GET_EVENTS: null,
    SET_EVENTS: null,
    TRIGGER_EVENT: null,
    ADVANCE_CHAPTER: null,
    COMPLETE_MISSION: null,

    // SCIENCE TEAM EVENTS
    SCIENCE_CHECK_RADIATION: null,

    // ASTRONAUT TEAM EVENTS
    AST_CHECK_VITALS: null,

    // COMMUNICATION TEAM EVENTS
    COMM_INFORM_ASTRONAUT: null,
    COMM_CHECK_SAT_LINK: null,

    // SECURITY TEAM EVENTS
    SET_HIGH_C02: null,
    SECURITY_CHECK_DATA_TRANSFER: null
});

},{"react/lib/keyMirror":"/Users/carl-erik.kopseng/dev_priv/Emissions/node_modules/react/lib/keyMirror.js"}]},{},["./app/main.js"])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvY2FybC1lcmlrLmtvcHNlbmcvZGV2X3ByaXYvRW1pc3Npb25zL2FwcC9tYWluLmpzIiwiL1VzZXJzL2NhcmwtZXJpay5rb3BzZW5nL2Rldl9wcml2L0VtaXNzaW9ucy9hcHAvYWN0aW9ucy9Bc3Ryb1RlYW1BY3Rpb25DcmVhdG9ycy5qcyIsIi9Vc2Vycy9jYXJsLWVyaWsua29wc2VuZy9kZXZfcHJpdi9FbWlzc2lvbnMvYXBwL2FjdGlvbnMvTWVzc2FnZUFjdGlvbkNyZWF0b3JzLmpzIiwiL1VzZXJzL2NhcmwtZXJpay5rb3BzZW5nL2Rldl9wcml2L0VtaXNzaW9ucy9hcHAvYWN0aW9ucy9NaXNzaW9uQWN0aW9uQ3JlYXRvcnMuanMiLCIvVXNlcnMvY2FybC1lcmlrLmtvcHNlbmcvZGV2X3ByaXYvRW1pc3Npb25zL2FwcC9hY3Rpb25zL1NjaWVuY2VBY3Rpb25DcmVhdG9ycy5qcyIsIi9Vc2Vycy9jYXJsLWVyaWsua29wc2VuZy9kZXZfcHJpdi9FbWlzc2lvbnMvYXBwL2FjdGlvbnMvU2VjdXJpdHlUZWFtQWNydGlvbkNyZWF0b3JzLmpzIiwiL1VzZXJzL2NhcmwtZXJpay5rb3BzZW5nL2Rldl9wcml2L0VtaXNzaW9ucy9hcHAvYWN0aW9ucy9UaW1lckFjdGlvbkNyZWF0b3JzLmpzIiwiL1VzZXJzL2NhcmwtZXJpay5rb3BzZW5nL2Rldl9wcml2L0VtaXNzaW9ucy9hcHAvYXBwZGlzcGF0Y2hlci5qcyIsIi9Vc2Vycy9jYXJsLWVyaWsua29wc2VuZy9kZXZfcHJpdi9FbWlzc2lvbnMvYXBwL2NsaWVudC1hcGkuanMiLCIvVXNlcnMvY2FybC1lcmlrLmtvcHNlbmcvZGV2X3ByaXYvRW1pc3Npb25zL2FwcC9jbGllbnQtYm9vdHN0cmFwLmpzIiwiL1VzZXJzL2NhcmwtZXJpay5rb3BzZW5nL2Rldl9wcml2L0VtaXNzaW9ucy9hcHAvY29tcG9uZW50cy9hcHAucmVhY3QuanMiLCIvVXNlcnMvY2FybC1lcmlrLmtvcHNlbmcvZGV2X3ByaXYvRW1pc3Npb25zL2FwcC9jb21wb25lbnRzL2FzdHJvbmF1dC10YXNrLnJlYWN0LmpzIiwiL1VzZXJzL2NhcmwtZXJpay5rb3BzZW5nL2Rldl9wcml2L0VtaXNzaW9ucy9hcHAvY29tcG9uZW50cy9icmVhdGgtcmF0ZS1jaGFydC5yZWFjdC5qcyIsIi9Vc2Vycy9jYXJsLWVyaWsua29wc2VuZy9kZXZfcHJpdi9FbWlzc2lvbnMvYXBwL2NvbXBvbmVudHMvY29tbXVuaWNhdGlvbi10YXNrLnJlYWN0LmpzIiwiL1VzZXJzL2NhcmwtZXJpay5rb3BzZW5nL2Rldl9wcml2L0VtaXNzaW9ucy9hcHAvY29tcG9uZW50cy9kaWFsb2dzLnJlYWN0LmpzIiwiL1VzZXJzL2NhcmwtZXJpay5rb3BzZW5nL2Rldl9wcml2L0VtaXNzaW9ucy9hcHAvY29tcG9uZW50cy9kdW1teS1yZW5kZXIubWl4aW4uanMiLCIvVXNlcnMvY2FybC1lcmlrLmtvcHNlbmcvZGV2X3ByaXYvRW1pc3Npb25zL2FwcC9jb21wb25lbnRzL2Z1bGwtc2NyZWVuLXZpZGVvLmpzIiwiL1VzZXJzL2NhcmwtZXJpay5rb3BzZW5nL2Rldl9wcml2L0VtaXNzaW9ucy9hcHAvY29tcG9uZW50cy9oZWFkZXIucmVhY3QuanMiLCIvVXNlcnMvY2FybC1lcmlrLmtvcHNlbmcvZGV2X3ByaXYvRW1pc3Npb25zL2FwcC9jb21wb25lbnRzL2hlYXJ0LXJhdGUtY2hhcnQucmVhY3QuanMiLCIvVXNlcnMvY2FybC1lcmlrLmtvcHNlbmcvZGV2X3ByaXYvRW1pc3Npb25zL2FwcC9jb21wb25lbnRzL2luZGV4LWFwcC5yZWFjdC5qcyIsIi9Vc2Vycy9jYXJsLWVyaWsua29wc2VuZy9kZXZfcHJpdi9FbWlzc2lvbnMvYXBwL2NvbXBvbmVudHMvaW50cm9kdWN0aW9uLXNjcmVlbi5yZWFjdC5qcyIsIi9Vc2Vycy9jYXJsLWVyaWsua29wc2VuZy9kZXZfcHJpdi9FbWlzc2lvbnMvYXBwL2NvbXBvbmVudHMvbWVzc2FnZS1saXN0LnJlYWN0LmpzIiwiL1VzZXJzL2NhcmwtZXJpay5rb3BzZW5nL2Rldl9wcml2L0VtaXNzaW9ucy9hcHAvY29tcG9uZW50cy9taXNzaW9uLWNvbW1hbmRlci5yZWFjdC5qcyIsIi9Vc2Vycy9jYXJsLWVyaWsua29wc2VuZy9kZXZfcHJpdi9FbWlzc2lvbnMvYXBwL2NvbXBvbmVudHMvbWlzc2lvbi10aW1lci5yZWFjdC5qcyIsIi9Vc2Vycy9jYXJsLWVyaWsua29wc2VuZy9kZXZfcHJpdi9FbWlzc2lvbnMvYXBwL2NvbXBvbmVudHMvbm90LWZvdW5kLnJlYWN0LmpzIiwiL1VzZXJzL2NhcmwtZXJpay5rb3BzZW5nL2Rldl9wcml2L0VtaXNzaW9ucy9hcHAvY29tcG9uZW50cy9vdmVybGF5LnJlYWN0LmpzIiwiL1VzZXJzL2NhcmwtZXJpay5rb3BzZW5nL2Rldl9wcml2L0VtaXNzaW9ucy9hcHAvY29tcG9uZW50cy9yYWRpYXRpb24tY2hhcnQucmVhY3QuanMiLCIvVXNlcnMvY2FybC1lcmlrLmtvcHNlbmcvZGV2X3ByaXYvRW1pc3Npb25zL2FwcC9jb21wb25lbnRzL3JhZGlhdGlvbi1zYW1wbGVyLnJlYWN0LmpzIiwiL1VzZXJzL2NhcmwtZXJpay5rb3BzZW5nL2Rldl9wcml2L0VtaXNzaW9ucy9hcHAvY29tcG9uZW50cy9yYWRpYXRpb24tdGFibGUucmVhY3QuanMiLCIvVXNlcnMvY2FybC1lcmlrLmtvcHNlbmcvZGV2X3ByaXYvRW1pc3Npb25zL2FwcC9jb21wb25lbnRzL3NjaWVuY2UtdGFzay5yZWFjdC5qcyIsIi9Vc2Vycy9jYXJsLWVyaWsua29wc2VuZy9kZXZfcHJpdi9FbWlzc2lvbnMvYXBwL2NvbXBvbmVudHMvc2VjdXJpdHktdGFzay5yZWFjdC5qcyIsIi9Vc2Vycy9jYXJsLWVyaWsua29wc2VuZy9kZXZfcHJpdi9FbWlzc2lvbnMvYXBwL2NvbXBvbmVudHMvdGFzay5yZWFjdC5qcyIsIi9Vc2Vycy9jYXJsLWVyaWsua29wc2VuZy9kZXZfcHJpdi9FbWlzc2lvbnMvYXBwL2NvbXBvbmVudHMvdGVhbS1kaXNwbGF5ZXIucmVhY3QuanMiLCIvVXNlcnMvY2FybC1lcmlrLmtvcHNlbmcvZGV2X3ByaXYvRW1pc3Npb25zL2FwcC9jb21wb25lbnRzL3RpbWVyLXBhbmVsLnJlYWN0LmpzIiwiL1VzZXJzL2NhcmwtZXJpay5rb3BzZW5nL2Rldl9wcml2L0VtaXNzaW9ucy9hcHAvY29tcG9uZW50cy90aW1lci5yZWFjdC5qcyIsIi9Vc2Vycy9jYXJsLWVyaWsua29wc2VuZy9kZXZfcHJpdi9FbWlzc2lvbnMvYXBwL2NvbnN0YW50cy9Bc3Ryb1RlYW1Db25zdGFudHMuanMiLCIvVXNlcnMvY2FybC1lcmlrLmtvcHNlbmcvZGV2X3ByaXYvRW1pc3Npb25zL2FwcC9jb25zdGFudHMvTWVzc2FnZUNvbnN0YW50cy5qcyIsIi9Vc2Vycy9jYXJsLWVyaWsua29wc2VuZy9kZXZfcHJpdi9FbWlzc2lvbnMvYXBwL2NvbnN0YW50cy9NaXNzaW9uQ29uc3RhbnRzLmpzIiwiL1VzZXJzL2NhcmwtZXJpay5rb3BzZW5nL2Rldl9wcml2L0VtaXNzaW9ucy9hcHAvY29uc3RhbnRzL1JvdXRlckNvbnN0YW50cy5qcyIsIi9Vc2Vycy9jYXJsLWVyaWsua29wc2VuZy9kZXZfcHJpdi9FbWlzc2lvbnMvYXBwL2NvbnN0YW50cy9TY2llbmNlVGVhbUNvbnN0YW50cy5qcyIsIi9Vc2Vycy9jYXJsLWVyaWsua29wc2VuZy9kZXZfcHJpdi9FbWlzc2lvbnMvYXBwL2NvbnN0YW50cy9UaW1lckNvbnN0YW50cy5qcyIsIi9Vc2Vycy9jYXJsLWVyaWsua29wc2VuZy9kZXZfcHJpdi9FbWlzc2lvbnMvYXBwL3JvdXRlci1jb250YWluZXIuanMiLCIvVXNlcnMvY2FybC1lcmlrLmtvcHNlbmcvZGV2X3ByaXYvRW1pc3Npb25zL2FwcC9yb3V0ZXMucmVhY3QuanMiLCIvVXNlcnMvY2FybC1lcmlrLmtvcHNlbmcvZGV2X3ByaXYvRW1pc3Npb25zL2FwcC9zdG9yZXMvYmFzZS1zdG9yZS5qcyIsIi9Vc2Vycy9jYXJsLWVyaWsua29wc2VuZy9kZXZfcHJpdi9FbWlzc2lvbnMvYXBwL3N0b3Jlcy9icmVhdGgtcmF0ZS1zdG9yZS5qcyIsIi9Vc2Vycy9jYXJsLWVyaWsua29wc2VuZy9kZXZfcHJpdi9FbWlzc2lvbnMvYXBwL3N0b3Jlcy9jYXJib24tZGlveGlkZS1zdG9yZS5qcyIsIi9Vc2Vycy9jYXJsLWVyaWsua29wc2VuZy9kZXZfcHJpdi9FbWlzc2lvbnMvYXBwL3N0b3Jlcy9jb21tdW5pY2F0aW9uLXF1YWxpdHktc3RvcmUuanMiLCIvVXNlcnMvY2FybC1lcmlrLmtvcHNlbmcvZGV2X3ByaXYvRW1pc3Npb25zL2FwcC9zdG9yZXMvZXZlbnQtc3RvcmUuanMiLCIvVXNlcnMvY2FybC1lcmlrLmtvcHNlbmcvZGV2X3ByaXYvRW1pc3Npb25zL2FwcC9zdG9yZXMvaGVhcnQtcmF0ZS1zdG9yZS5qcyIsIi9Vc2Vycy9jYXJsLWVyaWsua29wc2VuZy9kZXZfcHJpdi9FbWlzc2lvbnMvYXBwL3N0b3Jlcy9pbnRyb2R1Y3Rpb24tc3RvcmUuanMiLCIvVXNlcnMvY2FybC1lcmlrLmtvcHNlbmcvZGV2X3ByaXYvRW1pc3Npb25zL2FwcC9zdG9yZXMvbWVzc2FnZS1zdG9yZS5qcyIsIi9Vc2Vycy9jYXJsLWVyaWsua29wc2VuZy9kZXZfcHJpdi9FbWlzc2lvbnMvYXBwL3N0b3Jlcy9taXNzaW9uLXN0YXRlLXN0b3JlLmpzIiwiL1VzZXJzL2NhcmwtZXJpay5rb3BzZW5nL2Rldl9wcml2L0VtaXNzaW9ucy9hcHAvc3RvcmVzL294eWdlbi1zdG9yZS5qcyIsIi9Vc2Vycy9jYXJsLWVyaWsua29wc2VuZy9kZXZfcHJpdi9FbWlzc2lvbnMvYXBwL3N0b3Jlcy9yYWRpYXRpb24tc3RvcmUuanMiLCIvVXNlcnMvY2FybC1lcmlrLmtvcHNlbmcvZGV2X3ByaXYvRW1pc3Npb25zL2FwcC9zdG9yZXMvcm91dGUtc3RvcmUuanMiLCIvVXNlcnMvY2FybC1lcmlrLmtvcHNlbmcvZGV2X3ByaXYvRW1pc3Npb25zL2FwcC9zdG9yZXMvdGFzay1zdG9yZS5qcyIsIi9Vc2Vycy9jYXJsLWVyaWsua29wc2VuZy9kZXZfcHJpdi9FbWlzc2lvbnMvYXBwL3N0b3Jlcy90aW1lci1zdG9yZS5qcyIsIi9Vc2Vycy9jYXJsLWVyaWsua29wc2VuZy9kZXZfcHJpdi9FbWlzc2lvbnMvYXBwL3RlYW0tbmFtZS1tYXAuanMiLCIvVXNlcnMvY2FybC1lcmlrLmtvcHNlbmcvZGV2X3ByaXYvRW1pc3Npb25zL2FwcC91dGlscy5qcyIsIm5vZGVfbW9kdWxlcy9iYWJlbC1ydW50aW1lL2NvcmUtanMvb2JqZWN0L2Fzc2lnbi5qcyIsIm5vZGVfbW9kdWxlcy9iYWJlbC1ydW50aW1lL2NvcmUtanMvb2JqZWN0L2ZyZWV6ZS5qcyIsIm5vZGVfbW9kdWxlcy9iYWJlbC1ydW50aW1lL2NvcmUtanMvb2JqZWN0L2tleXMuanMiLCJub2RlX21vZHVsZXMvYmFiZWwtcnVudGltZS9oZWxwZXJzL2NsYXNzLWNhbGwtY2hlY2suanMiLCJub2RlX21vZHVsZXMvYmFiZWwtcnVudGltZS9oZWxwZXJzL2NyZWF0ZS1jbGFzcy5qcyIsIm5vZGVfbW9kdWxlcy9iYWJlbC1ydW50aW1lL2hlbHBlcnMvZXh0ZW5kcy5qcyIsIm5vZGVfbW9kdWxlcy9iYWJlbC1ydW50aW1lL2hlbHBlcnMvaW5oZXJpdHMuanMiLCJub2RlX21vZHVsZXMvYmFiZWwtcnVudGltZS9ub2RlX21vZHVsZXMvY29yZS1qcy9saWJyYXJ5L2ZuL29iamVjdC9hc3NpZ24uanMiLCJub2RlX21vZHVsZXMvYmFiZWwtcnVudGltZS9ub2RlX21vZHVsZXMvY29yZS1qcy9saWJyYXJ5L2ZuL29iamVjdC9mcmVlemUuanMiLCJub2RlX21vZHVsZXMvYmFiZWwtcnVudGltZS9ub2RlX21vZHVsZXMvY29yZS1qcy9saWJyYXJ5L2ZuL29iamVjdC9rZXlzLmpzIiwibm9kZV9tb2R1bGVzL2JhYmVsLXJ1bnRpbWUvbm9kZV9tb2R1bGVzL2NvcmUtanMvbGlicmFyeS9tb2R1bGVzLyQuYXNzaWduLmpzIiwibm9kZV9tb2R1bGVzL2JhYmVsLXJ1bnRpbWUvbm9kZV9tb2R1bGVzL2NvcmUtanMvbGlicmFyeS9tb2R1bGVzLyQuZGVmLmpzIiwibm9kZV9tb2R1bGVzL2JhYmVsLXJ1bnRpbWUvbm9kZV9tb2R1bGVzL2NvcmUtanMvbGlicmFyeS9tb2R1bGVzLyQuZncuanMiLCJub2RlX21vZHVsZXMvYmFiZWwtcnVudGltZS9ub2RlX21vZHVsZXMvY29yZS1qcy9saWJyYXJ5L21vZHVsZXMvJC5qcyIsIm5vZGVfbW9kdWxlcy9iYWJlbC1ydW50aW1lL25vZGVfbW9kdWxlcy9jb3JlLWpzL2xpYnJhcnkvbW9kdWxlcy9lczYub2JqZWN0LmFzc2lnbi5qcyIsIm5vZGVfbW9kdWxlcy9iYWJlbC1ydW50aW1lL25vZGVfbW9kdWxlcy9jb3JlLWpzL2xpYnJhcnkvbW9kdWxlcy9lczYub2JqZWN0LnN0YXRpY3MtYWNjZXB0LXByaW1pdGl2ZXMuanMiLCJub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1yZXNvbHZlL2VtcHR5LmpzIiwibm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2J1ZmZlci9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9idWZmZXIvbm9kZV9tb2R1bGVzL2Jhc2U2NC1qcy9saWIvYjY0LmpzIiwibm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2J1ZmZlci9ub2RlX21vZHVsZXMvaWVlZTc1NC9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9idWZmZXIvbm9kZV9tb2R1bGVzL2lzLWFycmF5L2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2V2ZW50cy9ldmVudHMuanMiLCJub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvaW5oZXJpdHMvaW5oZXJpdHNfYnJvd3Nlci5qcyIsIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9pc2FycmF5L2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL3Byb2Nlc3MvYnJvd3Nlci5qcyIsIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9yZWFkYWJsZS1zdHJlYW0vZHVwbGV4LmpzIiwibm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL3JlYWRhYmxlLXN0cmVhbS9saWIvX3N0cmVhbV9kdXBsZXguanMiLCJub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvcmVhZGFibGUtc3RyZWFtL2xpYi9fc3RyZWFtX3Bhc3N0aHJvdWdoLmpzIiwibm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL3JlYWRhYmxlLXN0cmVhbS9saWIvX3N0cmVhbV9yZWFkYWJsZS5qcyIsIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9yZWFkYWJsZS1zdHJlYW0vbGliL19zdHJlYW1fdHJhbnNmb3JtLmpzIiwibm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL3JlYWRhYmxlLXN0cmVhbS9saWIvX3N0cmVhbV93cml0YWJsZS5qcyIsIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9yZWFkYWJsZS1zdHJlYW0vbm9kZV9tb2R1bGVzL2NvcmUtdXRpbC1pcy9saWIvdXRpbC5qcyIsIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9yZWFkYWJsZS1zdHJlYW0vcGFzc3Rocm91Z2guanMiLCJub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvcmVhZGFibGUtc3RyZWFtL3JlYWRhYmxlLmpzIiwibm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL3JlYWRhYmxlLXN0cmVhbS90cmFuc2Zvcm0uanMiLCJub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvcmVhZGFibGUtc3RyZWFtL3dyaXRhYmxlLmpzIiwibm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL3N0cmVhbS1icm93c2VyaWZ5L2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL3N0cmluZ19kZWNvZGVyL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL3V0aWwvc3VwcG9ydC9pc0J1ZmZlckJyb3dzZXIuanMiLCJub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvdXRpbC91dGlsLmpzIiwibm9kZV9tb2R1bGVzL2NoZWNrLXR5cGVzL3NyYy9jaGVjay10eXBlcy5qcyIsIm5vZGVfbW9kdWxlcy9mbHV4L2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2ZsdXgvbGliL0Rpc3BhdGNoZXIuanMiLCJub2RlX21vZHVsZXMvZmx1eC9saWIvaW52YXJpYW50LmpzIiwibm9kZV9tb2R1bGVzL2dsb2JhbC9kb2N1bWVudC5qcyIsIm5vZGVfbW9kdWxlcy9nbG9iYWwvd2luZG93LmpzIiwibm9kZV9tb2R1bGVzL3ByaW50Zi9saWIvcHJpbnRmLmpzIiwibm9kZV9tb2R1bGVzL3JlYWN0L2xpYi9pbnZhcmlhbnQuanMiLCJub2RlX21vZHVsZXMvcmVhY3QvbGliL2tleU1pcnJvci5qcyIsIi9Vc2Vycy9jYXJsLWVyaWsua29wc2VuZy9kZXZfcHJpdi9FbWlzc2lvbnMvc2VydmVyL0V2ZW50Q29uc3RhbnRzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7O0FDQUEsSUFBTSxLQUFLLEdBQUcsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0FBQy9CLElBQU0sUUFBUSxHQUFHLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO0FBQzVDLElBQU0sTUFBTSxHQUFHLE9BQU8sQ0FBQyxlQUFlLENBQUMsQ0FBQztBQUN4QyxJQUFNLG1CQUFtQixHQUFHLE9BQU8sQ0FBQyxjQUFjLENB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QTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsQkE7QUFDQTs7QUNEQTtBQUNBOztBQ0RBO0FBQ0E7O0FDREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BHQTtBQUNBO0FBQ0E7O0FDRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyQ0E7O0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ256Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdTQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBOztBQ0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMURBO0FBQ0E7OztBQ0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ3pGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUM5Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUN2N0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDak5BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7OztBQzdkQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDMUdBO0FBQ0E7O0FDREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNQQTtBQUNBOztBQ0RBO0FBQ0E7O0FDREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUMxa0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ250QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ3JEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7QUNmQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ1RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDN2NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7QUNyREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7OztBQ25EQSxJQUFNLFNBQVMsR0FBRyxPQUFPLENBQUMscUJBQXFCLENBQUMsQ0FBQzs7QUFFakQsTUFBTSxDQUFDLE9BQU8sR0FBRyxTQUFTLENBQUM7QUFDdkIsbUJBQWUsRUFBRyxJQUFJO0FBQ3RCLG1CQUFlLEVBQUcsSUFBSTtBQUN0QixpQkFBYSxFQUFHLElBQUk7QUFDcEIscUJBQWlCLEVBQUcsSUFBSTtBQUN4QixhQUFTLEVBQUcsSUFBSTs7QUFFaEIsZUFBVyxFQUFHLElBQUk7OztBQUdsQixjQUFVLEVBQUcsSUFBSTtBQUNqQixjQUFVLEVBQUcsSUFBSTtBQUNqQixpQkFBYSxFQUFHLElBQUk7QUFDcEIsbUJBQWUsRUFBRyxJQUFJO0FBQ3RCLG9CQUFnQixFQUFHLElBQUk7OztBQUd2QiwyQkFBdUIsRUFBRyxJQUFJOzs7QUFHOUIsb0JBQWdCLEVBQUcsSUFBSTs7O0FBR3ZCLHlCQUFxQixFQUFHLElBQUk7QUFDNUIsdUJBQW1CLEVBQUUsSUFBSTs7O0FBSXpCLGdCQUFZLEVBQUcsSUFBSTtBQUNuQixnQ0FBNEIsRUFBRyxJQUFJO0NBQ3RDLENBQUMsQ0FBQyIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJjb25zdCBSZWFjdCA9IHJlcXVpcmUoJ3JlYWN0Jyk7XG5jb25zdCBkb2N1bWVudCA9IHJlcXVpcmUoJ2dsb2JhbC9kb2N1bWVudCcpO1xuY29uc3Qgd2luZG93ID0gcmVxdWlyZSgnZ2xvYmFsL3dpbmRvdycpO1xuY29uc3Qgc2VydmVyQ29tbXVuaWNhdGlvbiA9IHJlcXVpcmUoJy4vY2xpZW50LWFwaScpO1xuXG4vLyB0aGUgYWN0dWFsIHJpZ2dpbmcgb2YgdGhlIGFwcGxpY2F0aW9uIGlzIGRvbmUgaW4gdGhlIHJvdXRlciFcbmNvbnN0IHJvdXRlciA9IHJlcXVpcmUoJy4vcm91dGVyLWNvbnRhaW5lcicpO1xuXG5jb25zdCBBcHBEaXNwYXRjaGVyID0gcmVxdWlyZSgnLi9hcHBkaXNwYXRjaGVyJyk7XG5jb25zdCBjb25zdGFudHMgPSByZXF1aXJlKCcuL2NvbnN0YW50cy9Sb3V0ZXJDb25zdGFudHMnKTtcblxuc2VydmVyQ29tbXVuaWNhdGlvbi5zZXR1cCgpO1xuXG4vLyB0aGUgbWlzc2lvbiB0aW1lciBnZXRzIG91dCBzeW5jIGlmIGxvc2luZyBmb2N1cywgc28gcmVzeW5jIHdpdGggc2VydmVyIGV2ZXJ5IHRpbWUgdGhlIHdpbmRvdyByZWdhaW5zIGZvY3VzXG53aW5kb3cub25mb2N1cz1zZXJ2ZXJDb21tdW5pY2F0aW9uLmFza0Zvck1pc3Npb25UaW1lO1xuXG4vLyBydW4gc3RhcnR1cCBhY3Rpb25zIC0gdXN1YWxseSBvbmx5IHJlbGV2YW50IHdoZW4gZGV2ZWxvcGluZ1xucmVxdWlyZSgnLi9jbGllbnQtYm9vdHN0cmFwJykucnVuKCk7XG5cbnJvdXRlci5ydW4oKEhhbmRsZXIsIHN0YXRlKSA9PiB7XG4gICAgLy8gcGFzcyB0aGUgc3RhdGUgZG93biBpbnRvIHRoZSBSb3V0ZUhhbmRsZXJzLCBhcyB0aGF0IHdpbGwgbWFrZVxuICAgIC8vIHRoZSByb3V0ZXIgcmVsYXRlZCBwcm9wZXJ0aWVzIGF2YWlsYWJsZSBvbiBlYWNoIFJILiBUYWtlbiBmcm9tIFVwZ3JhZGUgdGlwcyBmb3IgUmVhY3QgUm91dGVyXG4gICAgUmVhY3QucmVuZGVyKDxIYW5kbGVyIHsuLi5zdGF0ZX0vPiwgZG9jdW1lbnQuYm9keSk7XG59KTtcblxuIiwiY29uc3QgRGlzcGF0Y2hlciA9IHJlcXVpcmUoJy4uL2FwcGRpc3BhdGNoZXInKTtcbmNvbnN0IE1Db25zdGFudHMgPSByZXF1aXJlKCcuLi9jb25zdGFudHMvTWlzc2lvbkNvbnN0YW50cycpO1xuY29uc3QgQXN0Q29uc3RhbnRzID0gcmVxdWlyZSgnLi4vY29uc3RhbnRzL0FzdHJvVGVhbUNvbnN0YW50cycpO1xuY29uc3QgTWVzc2FnZUFjdGlvbkNyZWF0b3JzID0gcmVxdWlyZSgnLi9NZXNzYWdlQWN0aW9uQ3JlYXRvcnMnKTtcbmNvbnN0IHV0aWxzID0gcmVxdWlyZSgnLi4vdXRpbHMnKTtcblxuLy8gbGF6eSBsb2FkIGR1ZSB0byBhdm9pZCBjaXJjdWxhciBkZXBlbmRlbmNpZXNcbmZ1bmN0aW9uIGxhenlSZXF1aXJlKHBhdGgpIHtcbiAgICBsZXQgdG1wID0gbnVsbDtcbiAgICByZXR1cm4gKCk9PiB7XG4gICAgICAgIGlmICghdG1wKSB0bXAgPSByZXF1aXJlKHBhdGgpO1xuICAgICAgICByZXR1cm4gdG1wO1xuICAgIH1cbn1cbmNvbnN0IGdldFNlcnZlckFQSSA9IGxhenlSZXF1aXJlKCcuLi9jbGllbnQtYXBpJyk7XG5jb25zdCBnZXRNaXNzaW9uQUMgPSBsYXp5UmVxdWlyZSgnLi9NaXNzaW9uQWN0aW9uQ3JlYXRvcnMnKTtcbi8vIGZvciBicm93c2VyaWZ5IHRvIHdvcmsgaXQgbmVlZHMgdG8gZmluZCB0aGVzZSBtYWdpYyBzdHJpbmdzXG5pZihmYWxzZSl7XG4gICAgcmVxdWlyZSgnLi9NaXNzaW9uQWN0aW9uQ3JlYXRvcnMnKTtcbiAgICByZXF1aXJlKCcuLi9jbGllbnQtYXBpJyk7XG59XG5jb25zdCBUaW1lckFjdGlvbkNyZWF0b3JzID0gcmVxdWlyZSgnLi9UaW1lckFjdGlvbkNyZWF0b3JzJyk7XG5cbndpbmRvdy5fX2FzdEFjdGlvbnMgPSBtb2R1bGUuZXhwb3J0cyA9IHtcblxuICAgIC8qIGluIHVuaXRzIHBlciBtaW51dGUgKi9cbiAgICBzZXRPeHlnZW5Db25zdW1wdGlvbih1bml0cykge1xuICAgICAgICBnZXRTZXJ2ZXJBUEkoKS5zZXRPeHlnZW5Db25zdW1wdGlvbih1bml0cyk7XG4gICAgfSxcblxuICAgIGhlYXJ0UmF0ZVJlYWQocmF0ZSl7XG4gICAgICAgIHZhciB0ZXh0LCBsZXZlbFxuICAgICAgICBpZiAocmF0ZSA8IDkwKSB7XG4gICAgICAgICAgICBsZXZlbCA9ICdpbmZvJztcbiAgICAgICAgICAgIHRleHQgPSAnRmluZSB2ZXJkaWVyJztcbiAgICAgICAgfSBlbHNlIGlmIChyYXRlID4gMTIwKSB7XG4gICAgICAgICAgICB0ZXh0ID0gJ1ZlbGRpZyBow7h5ZSB2ZXJkaWVyISc7XG4gICAgICAgICAgICBsZXZlbCA9ICdkYW5nZXInO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGV4dCA9ICdHYW5za2UgaMO4eSBoamVydGVyeXRtZS4gR3J1bm4gdGlsIGJla3ltcmluZz8nO1xuICAgICAgICAgICAgbGV2ZWwgPSAnd2FybmluZyc7XG4gICAgICAgIH1cblxuICAgICAgICBNZXNzYWdlQWN0aW9uQ3JlYXRvcnMuYWRkTWVzc2FnZSh7dGV4dCwgbGV2ZWwsIGR1cmF0aW9uOiAyMH0pO1xuICAgIH0sXG5cbiAgICBzdGFydE1vbml0b3JUYXNrKCl7XG5cbiAgICAgICAgVGltZXJBY3Rpb25DcmVhdG9ycy5yZXNldFRpbWVyKEFzdENvbnN0YW50cy5IRUFSVF9SQVRFX1RJTUVSKTtcbiAgICAgICAgVGltZXJBY3Rpb25DcmVhdG9ycy5yZXNldFRpbWVyKEFzdENvbnN0YW50cy5SRVNQSVJBVElPTl9USU1FUik7XG4gICAgICAgIGdldE1pc3Npb25BQygpLnN0YXJ0VGFzaygnYXN0cm9uYXV0JywgJ2JyZWF0aGluZ190aW1lcicpXG4gICAgfVxuXG59O1xuIiwiY29uc3QgQXBwRGlzcGF0Y2hlciA9IHJlcXVpcmUoJy4uL2FwcGRpc3BhdGNoZXInKSxcbiAgICB1dWlkID0gcmVxdWlyZSgnLi8uLi91dGlscycpLnV1aWQsXG4gICAgY29uc3RhbnRzID0gcmVxdWlyZSgnLi4vY29uc3RhbnRzL01lc3NhZ2VDb25zdGFudHMnKTtcblxuY29uc3QgYWN0aW9ucyA9IHtcblxuXG4gICAgLyoqXG4gICAgICogQHBhcmFtIG1zZy50ZXh0IHRoZSBtZXNzYWdlXG4gICAgICogQHBhcmFtIFttc2cuaWRdIHRoZSBtZXNzYWdlIGlkLiBpZiBub3QgZ2l2ZW4sIG9uZSB3aWxsIGJlIGNyZWF0ZWRcbiAgICAgKiBAcGFyYW0gW21zZy5sZXZlbF0gc2FtZSBhcyBib290c3RyYXAncyBhbGVydCBjbGFzc2VzOiBbc3VjY2VzcywgaW5mbywgd2FybmluZywgZGFuZ2VyXVxuICAgICAqIEBwYXJhbSBbbXNnLmR1cmF0aW9uXSB7TnVtYmVyfSBvcHRpb25hbCBkdXJhdGlvbiBmb3IgdHJhbnNpZW50IG1lc3NhZ2VzXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyB7c3RyaW5nfSB0aGUgbWVzc2FnZSBpZFxuICAgICAqL1xuICAgIGFkZE1lc3NhZ2UobXNnKSB7XG4gICAgICAgIHZhciBpZCA9IG1zZy5pZDtcblxuICAgICAgICBpZiAoIWlkKSB7XG4gICAgICAgICAgICBpZCA9IHV1aWQoKTtcbiAgICAgICAgICAgIG1zZy5pZCA9IGlkO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFtc2cubGV2ZWwpIHtcbiAgICAgICAgICAgIG1zZy5sZXZlbCA9ICdzdWNjZXNzJztcbiAgICAgICAgfVxuXG4gICAgICAgIEFwcERpc3BhdGNoZXIuZGlzcGF0Y2goe1xuICAgICAgICAgICAgICAgIGFjdGlvbjogY29uc3RhbnRzLk1FU1NBR0VfQURERUQsXG4gICAgICAgICAgICAgICAgZGF0YTogbXNnXG4gICAgICAgICAgICB9XG4gICAgICAgICk7XG5cbiAgICAgICAgaWYgKG1zZy5kdXJhdGlvbikge1xuICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiBhY3Rpb25zLnJlbW92ZU1lc3NhZ2UobXNnLmlkKSwgbXNnLmR1cmF0aW9uICogMTAwMClcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBpZDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogbXNnIHdpdGggZGVmYXVsdCBkdXJhdGlvbiBvZiA1IHNlY29uZHNcbiAgICAgKiBAcGFyYW0gbXNnXG4gICAgICogQHBhcmFtIFtkdXJhdGlvbl0gZGVmYXVsdCBvZiA1IHNlY29uZHNcbiAgICAgKlxuICAgICAqIEBzZWUgI2FkZE1lc3NhZ2UoKSBmb3IgbW9yZSBwYXJhbXNcbiAgICAgKiBAcmV0dXJucyB7c3RyaW5nfSB0aGUgbWVzc2FnZSBpZFxuICAgICAqL1xuICAgIGFkZFRyYW5zaWVudE1lc3NhZ2UobXNnLCBkdXJhdGlvbiA9IDUpIHtcbiAgICAgICAgcmV0dXJuIGFjdGlvbnMuYWRkTWVzc2FnZShPYmplY3QuYXNzaWduKHtkdXJhdGlvbn0sIG1zZykpXG4gICAgfSxcblxuICAgIHJlbW92ZU1lc3NhZ2UoaWQpIHtcbiAgICAgICAgQXBwRGlzcGF0Y2hlci5kaXNwYXRjaCh7XG4gICAgICAgICAgICAgICAgYWN0aW9uOiBjb25zdGFudHMuUkVNT1ZFX01FU1NBR0UsXG4gICAgICAgICAgICAgICAgZGF0YTogaWRcbiAgICAgICAgICAgIH1cbiAgICAgICAgKTtcbiAgICB9XG5cbn07XG5cbi8vIHByZXZlbnQgbmV3IHByb3BlcnRpZXMgZnJvbSBiZWluZyBhZGRlZCBvciByZW1vdmVkXG5PYmplY3QuZnJlZXplKGFjdGlvbnMpO1xud2luZG93Ll9fTWVzc2FnZUFjdGlvbnMgPSBhY3Rpb25zO1xubW9kdWxlLmV4cG9ydHMgPSBhY3Rpb25zOyIsImNvbnN0IEFwcERpc3BhdGNoZXIgPSByZXF1aXJlKCcuLi9hcHBkaXNwYXRjaGVyJyksXG4gICAgTWlzc2lvbkNvbnN0YW50cyA9IHJlcXVpcmUoJy4uL2NvbnN0YW50cy9NaXNzaW9uQ29uc3RhbnRzJyksXG4gICAgcm91dGVyID0gcmVxdWlyZSgnLi8uLi9yb3V0ZXItY29udGFpbmVyJyk7XG5cbi8vIGxhenkgbG9hZCBkdWUgdG8gY2lyY3VsYXIgZGVwZW5kZW5jaWVzXG5jb25zdCBzZXJ2ZXJBUEkgPSAoZnVuY3Rpb24gKCkge1xuICAgIHZhciBhcGk7XG5cbiAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAoIWFwaSkge1xuICAgICAgICAgICAgYXBpID0gcmVxdWlyZSgnLi4vY2xpZW50LWFwaScpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBhcGk7XG4gICAgfVxufSkoKTtcblxudmFyIHRtcCA9IHtcblxuICAgIHN0YXJ0TWlzc2lvbigpe1xuICAgICAgICBzZXJ2ZXJBUEkoKS5zdGFydE1pc3Npb24oKTtcbiAgICB9LFxuXG4gICAgc3RvcE1pc3Npb24oKXtcbiAgICAgICAgc2VydmVyQVBJKCkuc3RvcE1pc3Npb24oKTtcbiAgICB9LFxuXG4gICAgcmVzZXRNaXNzaW9uKCl7XG4gICAgICAgIHNlcnZlckFQSSgpLnJlc2V0TWlzc2lvbigpO1xuICAgIH0sXG5cbiAgICBtaXNzaW9uU3RhcnRlZCgpIHtcbiAgICAgICAgQXBwRGlzcGF0Y2hlci5kaXNwYXRjaCh7YWN0aW9uOiBNaXNzaW9uQ29uc3RhbnRzLk1JU1NJT05fU1RBUlRFRF9FVkVOVH0pO1xuICAgIH0sXG5cbiAgICBtaXNzaW9uU3RvcHBlZCgpIHtcbiAgICAgICAgQXBwRGlzcGF0Y2hlci5kaXNwYXRjaCh7YWN0aW9uOiBNaXNzaW9uQ29uc3RhbnRzLk1JU1NJT05fU1RPUFBFRF9FVkVOVH0pO1xuICAgIH0sXG5cbiAgICBtaXNzaW9uV2FzUmVzZXQoKXtcbiAgICAgICAgQXBwRGlzcGF0Y2hlci5kaXNwYXRjaCh7YWN0aW9uOiBNaXNzaW9uQ29uc3RhbnRzLk1JU1NJT05fV0FTX1JFU0VUfSk7XG4gICAgICAgIHNlcnZlckFQSSgpLmFza0ZvckFwcFN0YXRlKCk7XG4gICAgfSxcblxuICAgIG1pc3Npb25Db21wbGV0ZWQoKSB7XG4gICAgICAgIC8vQXBwRGlzcGF0Y2hlci5kaXNwYXRjaCh7YWN0aW9uOiBNaXNzaW9uQ29uc3RhbnRzLk1JU1NJT05fQ09NUExFVEVEX0VWRU5UfSk7XG4gICAgICAgIHJvdXRlci50cmFuc2l0aW9uVG8oJy9jb21wbGV0ZWQnKTtcbiAgICB9LFxuXG4gICAgY29tcGxldGVNaXNzaW9uKCl7XG4gICAgICAgIHNlcnZlckFQSSgpLmNvbXBsZXRlTWlzc2lvbigpO1xuICAgIH0sXG5cbiAgICByZWNlaXZlZEV2ZW50cyhldmVudHNDb2xsZWN0aW9uKXtcbiAgICAgICAgQXBwRGlzcGF0Y2hlci5kaXNwYXRjaChPYmplY3QuYXNzaWduKHt9LCBldmVudHNDb2xsZWN0aW9uLCB7YWN0aW9uOiBNaXNzaW9uQ29uc3RhbnRzLlJFQ0VJVkVEX0VWRU5UU30pKTtcbiAgICB9LFxuXG4gICAgYXNrRm9yRXZlbnRzKCl7XG4gICAgICAgIHNlcnZlckFQSSgpLmFza0ZvckV2ZW50cygpO1xuICAgIH0sXG5cbiAgICBpbnRyb1dhc1JlYWQodGVhbUlkKSB7XG4gICAgICAgIEFwcERpc3BhdGNoZXIuZGlzcGF0Y2goe2FjdGlvbjogTWlzc2lvbkNvbnN0YW50cy5JTlRST0RVQ1RJT05fUkVBRCwgdGVhbU5hbWU6IHRlYW1JZH0pO1xuICAgICAgICBzZXJ2ZXJBUEkoKS5zZW5kVGVhbVN0YXRlQ2hhbmdlKCk7XG4gICAgfSxcblxuICAgIHN0YXJ0VGFzayh0ZWFtSWQsIHRhc2tJZCl7XG4gICAgICAgIEFwcERpc3BhdGNoZXIuZGlzcGF0Y2goe2FjdGlvbjogTWlzc2lvbkNvbnN0YW50cy5TVEFSVF9UQVNLLCB0ZWFtSWQsIHRhc2tJZH0pO1xuICAgICAgICBzZXJ2ZXJBUEkoKS5zZW5kVGVhbVN0YXRlQ2hhbmdlKCk7XG4gICAgfSxcblxuICAgIHRhc2tDb21wbGV0ZWQodGVhbUlkLCB0YXNrSWQpICAge1xuICAgICAgICBBcHBEaXNwYXRjaGVyLmRpc3BhdGNoKHthY3Rpb246IE1pc3Npb25Db25zdGFudHMuQ09NUExFVEVEX1RBU0ssIHRhc2tJZCwgdGVhbUlkfSk7XG4gICAgICAgIHNlcnZlckFQSSgpLnNlbmRUZWFtU3RhdGVDaGFuZ2UoKTtcblxuICAgICAgICAvLyBhbHNvIHB1Ymxpc2ggdGhpcyB0byBzZXJ2ZXIgYXMgc2VwYXJhdGUgZXZlbnQ/IC0gbWF5YmUgdG8gdHJpZ2dlciBzb21ldGhpbmcgYXQgY2VydGFpbiBwb2ludD9cbiAgICB9LFxuXG4gICAgYXNrVG9TdGFydE5leHRDaGFwdGVyKCl7XG4gICAgICAgIHNlcnZlckFQSSgpLmFza1RvU3RhcnROZXh0Q2hhcHRlcigpO1xuICAgIH0sXG5cbiAgICBhc2tUb1RyaWdnZXJFdmVudCh1dWlkKXtcbiAgICAgICAgc2VydmVyQVBJKCkudHJpZ2dlckV2ZW50KHV1aWQpO1xuICAgIH0sXG5cbiAgICBzZXRNaXNzaW9uVGltZShlbGFwc2VkU2Vjb25kcyl7XG4gICAgICAgIEFwcERpc3BhdGNoZXIuZGlzcGF0Y2goe1xuICAgICAgICAgICAgYWN0aW9uOiBNaXNzaW9uQ29uc3RhbnRzLk1JU1NJT05fVElNRV9TWU5DLFxuICAgICAgICAgICAgZGF0YToge2VsYXBzZWRNaXNzaW9uVGltZTogZWxhcHNlZFNlY29uZHN9XG4gICAgICAgIH0pO1xuXG4gICAgfVxuXG59O1xuXG53aW5kb3cuX19NaXNzaW9uQUMgPSB0bXA7XG5tb2R1bGUuZXhwb3J0cyA9IHRtcDtcbiIsImNvbnN0IEFwcERpc3BhdGNoZXIgPSByZXF1aXJlKCcuLi9hcHBkaXNwYXRjaGVyJyk7XG5jb25zdCBSYWRpYXRpb25TdG9yZSA9IHJlcXVpcmUoJy4vLi4vc3RvcmVzL3JhZGlhdGlvbi1zdG9yZScpO1xuY29uc3QgU2NpZW5jZVRlYW1Db25zdGFudHMgPSByZXF1aXJlKCcuLi9jb25zdGFudHMvU2NpZW5jZVRlYW1Db25zdGFudHMnKTtcbmNvbnN0IE1pc3Npb25Db25zdGFudHMgPSByZXF1aXJlKCcuLi9jb25zdGFudHMvTWlzc2lvbkNvbnN0YW50cycpO1xuY29uc3QgTWVzc2FnZUFjdGlvbnNDcmVhdG9ycyA9IHJlcXVpcmUoJy4vTWVzc2FnZUFjdGlvbkNyZWF0b3JzJyk7XG5jb25zdCBUaW1lckFjdGlvbkNyZWF0b3JzID0gcmVxdWlyZSgnLi4vYWN0aW9ucy9UaW1lckFjdGlvbkNyZWF0b3JzJyk7XG5jb25zdCBhcGkgPSByZXF1aXJlKCcuLi9jbGllbnQtYXBpJyk7XG5cbnZhciBtaXNzaW9uQWN0aW9uQ3JlYXRvcnMgPSAoZnVuY3Rpb24oKSB7XG4gICAgdmFyIHRtcDtcblxuICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICghdG1wKSB0bXAgPSByZXF1aXJlKCcuLi9hY3Rpb25zL01pc3Npb25BY3Rpb25DcmVhdG9ycycpO1xuICAgICAgICByZXR1cm4gdG1wO1xuICAgIH1cbn0pKCk7XG5cblxuY29uc3QgYWN0aW9ucyA9IHtcblxuICAgIHN0YXJ0U2FtcGxlVGFzaygpe1xuICAgICAgICBBcHBEaXNwYXRjaGVyLmRpc3BhdGNoKHthY3Rpb246IFNjaWVuY2VUZWFtQ29uc3RhbnRzLlNDSUVOQ0VfQ0xFQVJfUkFESUFUSU9OX1NBTVBMRVN9KTtcbiAgICAgICAgbWlzc2lvbkFjdGlvbkNyZWF0b3JzKCkuc3RhcnRUYXNrKCdzY2llbmNlJywgJ3NhbXBsZScpO1xuICAgICAgICB0aGlzLnJlc2V0U2FtcGxpbmdUaW1lcigpO1xuICAgIH0sXG5cbiAgICBjb21wbGV0ZVRhc2sodGFza0lkKXtcbiAgICAgICAgbWlzc2lvbkFjdGlvbkNyZWF0b3JzKCkudGFza0NvbXBsZXRlZCgnc2NpZW5jZScsIHRhc2tJZCk7XG4gICAgfSxcblxuICAgIHJlc2V0U2FtcGxpbmdUaW1lcigpIHtcbiAgICAgICAgVGltZXJBY3Rpb25DcmVhdG9ycy5yZXNldFRpbWVyKFNjaWVuY2VUZWFtQ29uc3RhbnRzLlNDSUVOQ0VfVElNRVJfMSk7XG4gICAgfSxcblxuICAgIHRha2VSYWRpYXRpb25TYW1wbGUoKSB7XG4gICAgICAgIEFwcERpc3BhdGNoZXIuZGlzcGF0Y2goe1xuICAgICAgICAgICAgYWN0aW9uOiBTY2llbmNlVGVhbUNvbnN0YW50cy5TQ0lFTkNFX1RBS0VfUkFESUFUSU9OX1NBTVBMRVxuICAgICAgICB9KVxuICAgIH0sXG5cbiAgICBhdmVyYWdlUmFkaWF0aW9uQ2FsY3VsYXRlZChhdmVyYWdlKXtcbiAgICAgICAgbGV0IHNhbXBsZXMgPSBSYWRpYXRpb25TdG9yZS5nZXRTYW1wbGVzKCk7XG5cbiAgICAgICAgaWYgKHNhbXBsZXMubGVuZ3RoKSB7XG4gICAgICAgICAgICBsZXQgc3VtID0gc2FtcGxlcy5yZWR1Y2UoKHByZXYsIGN1cnJlbnQpID0+IHByZXYgKyBjdXJyZW50LCAwKSxcbiAgICAgICAgICAgICAgICB0cnVlQ2FsY3VsYXRlZEF2ZXJhZ2UgPSBzdW0gLyBzYW1wbGVzLmxlbmd0aCxcbiAgICAgICAgICAgICAgICBkaWZmSW5QZXJjZW50ID0gMTAwICogTWF0aC5hYnMoKHRydWVDYWxjdWxhdGVkQXZlcmFnZSAtIGF2ZXJhZ2UpIC8gdHJ1ZUNhbGN1bGF0ZWRBdmVyYWdlKTtcblxuICAgICAgICAgICAgaWYgKGRpZmZJblBlcmNlbnQgPiAxNSkge1xuICAgICAgICAgICAgICAgIE1lc3NhZ2VBY3Rpb25zQ3JlYXRvcnMuYWRkVHJhbnNpZW50TWVzc2FnZSh7dGV4dDogJ011bGlnIGRldCBnamVubm9tc25pdHRldCBibGUgbGl0dCBmZWlsLid9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG5cbiAgICAgICAgQXBwRGlzcGF0Y2hlci5kaXNwYXRjaCh7XG4gICAgICAgICAgICBhY3Rpb246IFNjaWVuY2VUZWFtQ29uc3RhbnRzLlNDSUVOQ0VfQVZHX1JBRElBVElPTl9DQUxDVUxBVEVELFxuICAgICAgICAgICAgZGF0YToge2F2ZXJhZ2V9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGlmIChhdmVyYWdlID4gU2NpZW5jZVRlYW1Db25zdGFudHMuU0NJRU5DRV9BVkdfUkFEX1JFRF9USFJFU0hPTEQpIHtcbiAgICAgICAgICAgIE1lc3NhZ2VBY3Rpb25zQ3JlYXRvcnMuYWRkVHJhbnNpZW50TWVzc2FnZSh7XG4gICAgICAgICAgICAgICAgdGV4dDogJ1ZlbGRpZyBow7h5dCByYWRpb2FrdGl2dCBuaXbDpSBkZXRla3RlcnQuIFZhcnNsZSBzaWtrZXJoZXRzdGVhbWV0IHVtaWRkZWxiYXJ0IScsXG4gICAgICAgICAgICAgICAgbGV2ZWw6ICdkYW5nZXInLFxuICAgICAgICAgICAgICAgIGlkOiBTY2llbmNlVGVhbUNvbnN0YW50cy5TQ0lFTkNFX1JBRElBVElPTl9XQVJOSU5HX01TR1xuICAgICAgICAgICAgfSwgMzApO1xuICAgICAgICB9IGVsc2UgaWYgKGF2ZXJhZ2UgPiBTY2llbmNlVGVhbUNvbnN0YW50cy5TQ0lFTkNFX0FWR19SQURfT1JBTkdFX1RIUkVTSE9MRCkge1xuICAgICAgICAgICAgTWVzc2FnZUFjdGlvbnNDcmVhdG9ycy5hZGRUcmFuc2llbnRNZXNzYWdlKHtcbiAgICAgICAgICAgICAgICB0ZXh0OiAnSMO4eWUgdmVyZGllciBhdiByYWRpb2FrdGl2aXRldC4gRsO4bGcgbWVkIHDDpSBvbSBkZXQgZ8OlciBuZWRvdmVyIGlnamVuJyxcbiAgICAgICAgICAgICAgICBsZXZlbDogJ3dhcm5pbmcnLFxuICAgICAgICAgICAgICAgIGlkOiBTY2llbmNlVGVhbUNvbnN0YW50cy5TQ0lFTkNFX1JBRElBVElPTl9XQVJOSU5HX01TR1xuICAgICAgICAgICAgfSwgMTApO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5jb21wbGV0ZVRhc2soJ2F2ZXJhZ2UnKTtcbiAgICB9LFxuXG5cbiAgICAvKipcbiAgICAgKiBTZXQgdGhlIHJhZGlhdGlvbiBsZXZlbCB0aGF0IHdpbGwgYmUgcmVwb3J0ZWQgdG8gdGhlIHZpZXcgbGF5ZXJcbiAgICAgKiBUaGUgcmVwb3J0ZWQgcmFkaWF0aW9uIHdpbGwgZ2VuZXJhdGVkIHZhbHVlcyBpbiB0aGUgcmFuZ2UgZ2l2ZW4gYnkgdGhlIHBhcmFtZXRlcnNcbiAgICAgKlxuICAgICAqIFdlIGFyZSBub3QgYWN0dWFsbHkgcmVjZWl2aW5nIGEgc3RyZWFtIG9mIHZhbHVlcyBmcm9tIHRoZSBzZXJ2ZXIsIGFzIHRoYXQgY291bGRcbiAgICAgKiBiZSB2ZXJ5IHJlc291cmNlIGhlYXZ5LiBJbnN0ZWFkIHdlIGdlbmVyYXRlIHJhbmRvbSB2YWx1ZXMgYmV0d2VlbiB0aGUgZ2l2ZW4gdmFsdWVzLFxuICAgICAqIHdoaWNoIHRvIHRoZSB1c2VyIHdpbGwgbG9vayB0aGUgc2FtZS5cbiAgICAgKiBAcGFyYW0gbWluXG4gICAgICogQHBhcmFtIG1heFxuICAgICAqL1xuICAgICAgICBzZXRSYWRpYXRpb25MZXZlbChtaW4sIG1heCkge1xuICAgICAgICBBcHBEaXNwYXRjaGVyLmRpc3BhdGNoKHtcbiAgICAgICAgICAgIGFjdGlvbjogU2NpZW5jZVRlYW1Db25zdGFudHMuU0NJRU5DRV9SQURJQVRJT05fTEVWRUxfQ0hBTkdFRCxcbiAgICAgICAgICAgIGRhdGE6IHttaW4sIG1heH1cbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIGFkZFRvVG90YWxSYWRpYXRpb25MZXZlbChhbW91bnQpe1xuXG4gICAgICAgIHZhciB0b3RhbCA9IGFtb3VudCArIFJhZGlhdGlvblN0b3JlLmdldFRvdGFsTGV2ZWwoKTtcblxuICAgICAgICBpZiAodG90YWwgPiBTY2llbmNlVGVhbUNvbnN0YW50cy5TQ0lFTkNFX1RPVEFMX1JBRElBVElPTl9WRVJZX1NFUklPVVNfVEhSRVNIT0xEKSB7XG4gICAgICAgICAgICBNZXNzYWdlQWN0aW9uc0NyZWF0b3JzLmFkZFRyYW5zaWVudE1lc3NhZ2Uoe1xuICAgICAgICAgICAgICAgIGlkOiAnc2NpZW5jZV9oaWdoX3JhZGlhdGlvbl9sZXZlbCcsXG4gICAgICAgICAgICAgICAgdGV4dDogJ0ZhcmV0cnVlbmRlIGjDuHl0IHN0csOlbGluZ3NuaXbDpSEnLFxuICAgICAgICAgICAgICAgIGxldmVsOiAnZGFuZ2VyJ1xuICAgICAgICAgICAgfSwgMzApO1xuICAgICAgICB9IGVsc2UgaWYgKHRvdGFsID4gU2NpZW5jZVRlYW1Db25zdGFudHMuU0NJRU5DRV9UT1RBTF9SQURJQVRJT05fU0VSSU9VU19USFJFU0hPTEQpIHtcbiAgICAgICAgICAgIE1lc3NhZ2VBY3Rpb25zQ3JlYXRvcnMuYWRkVHJhbnNpZW50TWVzc2FnZSh7XG4gICAgICAgICAgICAgICAgaWQ6ICdzY2llbmNlX2hpZ2hfcmFkaWF0aW9uX2xldmVsJyxcbiAgICAgICAgICAgICAgICB0ZXh0OiAnSMO4eXQgc3Ryw6VsaW5nc25pdsOlIScsXG4gICAgICAgICAgICAgICAgbGV2ZWw6ICd3YXJuaW5nJ1xuICAgICAgICAgICAgfSwgMzApO1xuICAgICAgICB9XG5cbiAgICAgICAgQXBwRGlzcGF0Y2hlci5kaXNwYXRjaCh7XG4gICAgICAgICAgICBhY3Rpb246IFNjaWVuY2VUZWFtQ29uc3RhbnRzLlNDSUVOQ0VfVE9UQUxfUkFESUFUSU9OX0xFVkVMX0NIQU5HRUQsXG4gICAgICAgICAgICBkYXRhOiB7dG90YWwsIGFkZGVkOiBhbW91bnR9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRoaXMuY29tcGxldGVUYXNrKCdhZGR0b3RhbCcpO1xuICAgIH1cblxufTtcblxud2luZG93Ll9fU2NpZW5jZUFjdGlvbnMgPSBhY3Rpb25zO1xubW9kdWxlLmV4cG9ydHMgPSBhY3Rpb25zOyIsIi8vIGxhenkgbG9hZCBkdWUgdG8gYXZvaWQgY2lyY3VsYXIgZGVwZW5kZW5jaWVzXG5mdW5jdGlvbiBsYXp5UmVxdWlyZShwYXRoKSB7XG4gICAgbGV0IHRtcCA9IG51bGw7XG4gICAgcmV0dXJuICgpPT4ge1xuICAgICAgICBpZiAoIXRtcCkgdG1wID0gcmVxdWlyZShwYXRoKTtcbiAgICAgICAgcmV0dXJuIHRtcDtcbiAgICB9XG59XG5jb25zdCBnZXRNaXNzaW9uQUMgPSBsYXp5UmVxdWlyZSgnLi9NaXNzaW9uQWN0aW9uQ3JlYXRvcnMnKTtcbmNvbnN0IGdldFNlcnZlckFQSSA9IGxhenlSZXF1aXJlKCcuLi9jbGllbnQtYXBpJyk7XG4vLyBmb3IgYnJvd3NlcmlmeSB0byB3b3JrIGl0IG5lZWRzIHRvIGZpbmQgdGhlc2UgbWFnaWMgc3RyaW5nc1xucmVxdWlyZSgnLi9NaXNzaW9uQWN0aW9uQ3JlYXRvcnMnKTtcbnJlcXVpcmUoJy4uL2NsaWVudC1hcGknKTtcblxudmFyIGFjdGlvbnMgPSBtb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBzdGFydERhdGFUcmFuc2ZlckNoZWNrKCl7XG4gICAgICAgIGdldE1pc3Npb25BQygpLnN0YXJ0VGFzaygnc2VjdXJpdHknLCAndHlyX3ZfY2hlY2snKVxuICAgIH1cbn07IiwiY29uc3QgQXBwRGlzcGF0Y2hlciA9IHJlcXVpcmUoJy4uL2FwcGRpc3BhdGNoZXInKTtcbmNvbnN0IGNvbnN0YW50cyA9IHJlcXVpcmUoJy4uL2NvbnN0YW50cy9UaW1lckNvbnN0YW50cycpO1xuXG5jb25zdCBhY3Rpb25zID0ge1xuXG4gICAgc3RhcnRUaW1lcihpZCkge1xuICAgICAgICBBcHBEaXNwYXRjaGVyLmRpc3BhdGNoKHthY3Rpb246IGNvbnN0YW50cy5TVEFSVF9USU1FUiwgZGF0YToge3RpbWVySWQ6IGlkfX0pO1xuICAgIH0sXG5cbiAgICByZXNldFRpbWVyKGlkKSB7XG4gICAgICAgIEFwcERpc3BhdGNoZXIuZGlzcGF0Y2goe2FjdGlvbjogY29uc3RhbnRzLlJFU0VUX1RJTUVSLCBkYXRhOiB7dGltZXJJZDogaWR9fSk7XG4gICAgfSxcblxuICAgIHN0b3BUaW1lcihpZCkge1xuICAgICAgICBBcHBEaXNwYXRjaGVyLmRpc3BhdGNoKHthY3Rpb246IGNvbnN0YW50cy5TVE9QX1RJTUVSLCBkYXRhOiB7dGltZXJJZDogaWR9fSk7XG4gICAgfSxcblxuICAgIHNldFRpbWVyKHRpbWVySWQsIHRpbWUpIHtcbiAgICAgICAgQXBwRGlzcGF0Y2hlci5kaXNwYXRjaCh7XG4gICAgICAgICAgICBhY3Rpb246IGNvbnN0YW50cy5TRVRfVElNRVIsXG4gICAgICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICAgICAgcmVtYWluaW5nVGltZTogdGltZSxcbiAgICAgICAgICAgICAgICB0aW1lcklkXG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBhY3Rpb25zOyIsIi8qXG4gKiBEaXNwYXRjaGVyIC0gYSBzaW5nbGV0b25cbiAqXG4gKiBUaGlzIGlzIGVzc2VudGlhbGx5IHRoZSBtYWluIGRyaXZlciBpbiB0aGUgRmx1eCBhcmNoaXRlY3R1cmVcbiAqIEBzZWUgaHR0cDovL2ZhY2Vib29rLmdpdGh1Yi5pby9mbHV4L2RvY3Mvb3ZlcnZpZXcuaHRtbFxuKi9cblxuY29uc3QgeyBEaXNwYXRjaGVyIH0gPSByZXF1aXJlKCdmbHV4Jyk7XG5cbmNvbnN0IEFwcERpc3BhdGNoZXIgPSBPYmplY3QuYXNzaWduKG5ldyBEaXNwYXRjaGVyKCksIHtcblxuICAgIC8vIG9wdGlvbmFsIG1ldGhvZHNcblxufSk7XG5cbndpbmRvdy5fX0FwcERpc3BhdGNoZXI9IEFwcERpc3BhdGNoZXI7XG5tb2R1bGUuZXhwb3J0cyA9IEFwcERpc3BhdGNoZXI7IiwiY29uc3QgQXBwRGlzcGF0Y2hlciA9IHJlcXVpcmUoJy4vYXBwZGlzcGF0Y2hlcicpO1xuY29uc3QgaW8gPSByZXF1aXJlKCdzb2NrZXQuaW8nKTtcbmNvbnN0IHNvY2tldCA9IGlvKCk7XG5jb25zdCBNaXNzaW9uQ29uc3RhbnRzID0gcmVxdWlyZSgnLi9jb25zdGFudHMvTWlzc2lvbkNvbnN0YW50cycpO1xuY29uc3QgTWlzc2lvbkFjdGlvbkNyZWF0b3JzID0gcmVxdWlyZSgnLi9hY3Rpb25zL01pc3Npb25BY3Rpb25DcmVhdG9ycycpO1xuY29uc3QgTWVzc2FnZUFjdGlvbkNyZWF0b3JzID0gcmVxdWlyZSgnLi9hY3Rpb25zL01lc3NhZ2VBY3Rpb25DcmVhdG9ycycpO1xuY29uc3QgU2NpZW5jZVRlYW1BY3Rpb25DcmVhdG9ycyA9IHJlcXVpcmUoJy4vYWN0aW9ucy9TY2llbmNlQWN0aW9uQ3JlYXRvcnMnKTtcbmNvbnN0IEFzdHJvVGVhbVRlYW1BY3Rpb25DcmVhdG9ycyA9IHJlcXVpcmUoJy4vYWN0aW9ucy9Bc3Ryb1RlYW1BY3Rpb25DcmVhdG9ycycpO1xuY29uc3QgUmFkaWF0aW9uU3RvcmUgPSByZXF1aXJlKCcuL3N0b3Jlcy9yYWRpYXRpb24tc3RvcmUnKTtcbmNvbnN0IFRpbWVyU3RvcmUgPSByZXF1aXJlKCcuL3N0b3Jlcy90aW1lci1zdG9yZScpO1xuY29uc3QgVGFza1N0b3JlID0gcmVxdWlyZSgnLi9zdG9yZXMvdGFzay1zdG9yZScpO1xuY29uc3QgSW50cm9kdWN0aW9uU3RvcmUgPSByZXF1aXJlKCcuL3N0b3Jlcy9pbnRyb2R1Y3Rpb24tc3RvcmUnKTtcbmNvbnN0IFJvdXRlciA9IHJlcXVpcmUoJy4vcm91dGVyLWNvbnRhaW5lcicpO1xuY29uc3QgRXZlbnRDb25zdGFudHMgPSByZXF1aXJlKCcuLi9zZXJ2ZXIvRXZlbnRDb25zdGFudHMnKTtcblxudmFyIGFwaSA9IHtcblxuICAgIHNldHVwKCkge1xuXG4gICAgICAgIHNvY2tldC5vbignY29ubmVjdCcsICgpID0+IHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiQ29ubmVjdGVkIHRvIHNlcnZlciBXZWJTb2NrZXRcIik7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIkFza2luZyBzZXJ2ZXIgZm9yIGFwcCBzdGF0ZVwiKTtcbiAgICAgICAgICAgIGFwaS5hc2tGb3JBcHBTdGF0ZSgpO1xuICAgICAgICAgICAgTWVzc2FnZUFjdGlvbkNyZWF0b3JzLnJlbW92ZU1lc3NhZ2UoJ2Rpc2Nvbm5lY3QgbWVzc2FnZScpO1xuICAgICAgICB9KTtcblxuICAgICAgICBzb2NrZXQub24oJ2Rpc2Nvbm5lY3QnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBNZXNzYWdlQWN0aW9uQ3JlYXRvcnMuYWRkTWVzc2FnZSh7XG4gICAgICAgICAgICAgICAgaWQ6ICdkaXNjb25uZWN0IG1lc3NhZ2UnLFxuICAgICAgICAgICAgICAgIHRleHQ6ICdNaXN0ZXQga29udGFrdCBtZWQgc2VydmVyZW4uIExhc3Qgc2lkZW4gcMOlIG55dHQnLFxuICAgICAgICAgICAgICAgIGxldmVsOiAnZGFuZ2VyJ1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHNvY2tldC5vbihFdmVudENvbnN0YW50cy5NSVNTSU9OX1NUQVJURUQsIChhcHBTdGF0ZSkgPT4ge1xuICAgICAgICAgICAgTWlzc2lvbkFjdGlvbkNyZWF0b3JzLm1pc3Npb25TdGFydGVkKCk7XG4gICAgICAgICAgICB0aGlzLl9hcHBTdGF0ZVJlY2VpdmVkKGFwcFN0YXRlKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHNvY2tldC5vbihFdmVudENvbnN0YW50cy5NSVNTSU9OX1NUT1BQRUQsICgpID0+IE1pc3Npb25BY3Rpb25DcmVhdG9ycy5taXNzaW9uU3RvcHBlZCgpKTtcbiAgICAgICAgc29ja2V0Lm9uKEV2ZW50Q29uc3RhbnRzLk1JU1NJT05fQ09NUExFVEVELCAoKT0+IE1pc3Npb25BY3Rpb25DcmVhdG9ycy5taXNzaW9uQ29tcGxldGVkKCkpO1xuICAgICAgICBzb2NrZXQub24oRXZlbnRDb25zdGFudHMuTUlTU0lPTl9SRVNFVCwgKCk9PiBNaXNzaW9uQWN0aW9uQ3JlYXRvcnMubWlzc2lvbldhc1Jlc2V0KCkpO1xuXG4gICAgICAgIHNvY2tldC5vbihFdmVudENvbnN0YW50cy5TRVRfRVZFTlRTLCBNaXNzaW9uQWN0aW9uQ3JlYXRvcnMucmVjZWl2ZWRFdmVudHMpO1xuICAgICAgICBzb2NrZXQub24oRXZlbnRDb25zdGFudHMuQUREX01FU1NBR0UsIChzZXJ2ZXJNc2cpID0+IHtcbiAgICAgICAgICAgIGlmIChzZXJ2ZXJNc2cuYXVkaWVuY2UgJiYgc2VydmVyTXNnLmF1ZGllbmNlICE9PSBSb3V0ZXIuZ2V0VGVhbUlkKCkpIHJldHVybjtcblxuICAgICAgICAgICAgTWVzc2FnZUFjdGlvbkNyZWF0b3JzLmFkZE1lc3NhZ2Uoc2VydmVyTXNnKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgc29ja2V0Lm9uKCdtaXNzaW9uIHRpbWUnLCBNaXNzaW9uQWN0aW9uQ3JlYXRvcnMuc2V0TWlzc2lvblRpbWUpO1xuXG4gICAgICAgIHNvY2tldC5vbihFdmVudENvbnN0YW50cy5BUFBfU1RBVEUsIChzdGF0ZSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5fYXBwU3RhdGVSZWNlaXZlZChzdGF0ZSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIGlmIHRoZSBjbGllbnQgbWlzc2VzIHRoZSBtZXNzYWdlL2V2ZW50IGl0IGlzIGxvc3QgLi4uIGFuZCB0aGUgY3VycmVudF9ldmVudCB3aWxsIGJlIHVuY2hhbmdlZCA6LShcbiAgICAgICAgLy8gVE9ETzogc3RvcmUgaXQgc2VydmVyX3NpZGUgaW4gdGhlIHRlYW1TdGF0ZSBiZWZvcmUgc2VuZGluZ1xuICAgICAgICBzb2NrZXQub24oRXZlbnRDb25zdGFudHMuQVNUX0NIRUNLX1ZJVEFMUywgKCk9PiB7XG4gICAgICAgICAgICBBc3Ryb1RlYW1UZWFtQWN0aW9uQ3JlYXRvcnMuc3RhcnRNb25pdG9yVGFzaygpO1xuICAgICAgICB9KTtcblxuICAgICAgICBzb2NrZXQub24oRXZlbnRDb25zdGFudHMuU0NJRU5DRV9DSEVDS19SQURJQVRJT04sICgpPT4ge1xuICAgICAgICAgICAgU2NpZW5jZVRlYW1BY3Rpb25DcmVhdG9ycy5zdGFydFNhbXBsZVRhc2soKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgc29ja2V0Lm9uKEV2ZW50Q29uc3RhbnRzLlNFQ1VSSVRZX0NIRUNLX0RBVEFfVFJBTlNGRVIsICgpPT4ge1xuICAgICAgICAgICAgcmVxdWlyZSgnLi9hY3Rpb25zL1NlY3VyaXR5VGVhbUFjcnRpb25DcmVhdG9ycycpLnN0YXJ0RGF0YVRyYW5zZmVyQ2hlY2soKTtcbiAgICAgICAgfSk7XG5cblxuICAgIH0sXG5cbiAgICBzdGFydE1pc3Npb24oKXtcbiAgICAgICAgc29ja2V0LmVtaXQoJ3N0YXJ0IG1pc3Npb24nKTtcbiAgICB9LFxuXG4gICAgc3RvcE1pc3Npb24oKXtcbiAgICAgICAgc29ja2V0LmVtaXQoJ3N0b3AgbWlzc2lvbicpO1xuICAgIH0sXG5cbiAgICByZXNldE1pc3Npb24oKXtcbiAgICAgICAgc29ja2V0LmVtaXQoJ3Jlc2V0IG1pc3Npb24nKTtcbiAgICB9LFxuXG4gICAgYXNrVG9TdGFydE5leHRDaGFwdGVyKCl7XG4gICAgICAgIHNvY2tldC5lbWl0KEV2ZW50Q29uc3RhbnRzLkFEVkFOQ0VfQ0hBUFRFUik7XG4gICAgfSxcblxuICAgIHRyaWdnZXJFdmVudCh1dWlkKXtcbiAgICAgICAgc29ja2V0LmVtaXQoRXZlbnRDb25zdGFudHMuVFJJR0dFUl9FVkVOVCwgdXVpZCk7XG4gICAgfSxcblxuICAgIC8qXG4gICAgICogU2VuZCB0aGUgY2xpZW50IGhlbGQgc3RhdGUgKGZvciB0aGUgY3VycmVudCB0ZWFtKSB0byBzZXJ2ZXIgb24gY2hhbmdlXG4gICAgICogVGhlIG1vc3QgaW1wb3J0YW50IGJpdHMgYXJlIGhlbGQgb24gc2VydmVyLCBhbmQgaXMgbm90IHRyYW5zZmVycmVkIGJhY2ssXG4gICAgICogc3VjaCBhcyBpZiB0aGUgbWlzc2lvbiBpcyBydW5uaW5nLCB0aGUgY3VycmVudCBjaGFwdGVyLCBldGMuXG4gICAgICpcbiAgICAgKiBUaGlzIGlzIGltcG9ydGFudCB0byBzdG9yZSBvbiB0aGUgc2VydmVyIGluIGNhc2Ugd2UgZHJvcCB0aGUgY29ubmVjdGlvbiBhbmQgcmVjb25uZWN0IGluIG90aGVyIHNlc3Npb25cbiAgICAgKi9cbiAgICBzZW5kVGVhbVN0YXRlQ2hhbmdlKHRlYW1JZCA9IFJvdXRlci5nZXRUZWFtSWQoKSkge1xuICAgICAgICBsZXQgc3RhdGUgPSB7fTtcblxuICAgICAgICBzdGF0ZS50ZWFtID0gdGVhbUlkO1xuICAgICAgICBzdGF0ZS5pbnRyb2R1Y3Rpb25fcmVhZCA9IEludHJvZHVjdGlvblN0b3JlLmlzSW50cm9kdWN0aW9uUmVhZCh0ZWFtSWQpO1xuICAgICAgICBzdGF0ZS5jdXJyZW50X3Rhc2sgPSBUYXNrU3RvcmUuZ2V0Q3VycmVudFRhc2tJZCh0ZWFtSWQpO1xuXG4gICAgICAgIGlmICh0ZWFtSWQgPT09ICdzY2llbmNlJykge1xuICAgICAgICAgICAgc3RhdGUucmFkaWF0aW9uID0gUmFkaWF0aW9uU3RvcmUuZ2V0U3RhdGUoKTtcbiAgICAgICAgfSBlbHNlIGlmKHRlYW1JZCA9PT0gJ2FzdHJvbmF1dCcpIHtcbiAgICAgICAgfVxuXG4gICAgICAgIHNvY2tldC5lbWl0KCdzZXQgdGVhbSBzdGF0ZScsIHN0YXRlKTtcbiAgICB9LFxuXG4gICAgY29tcGxldGVNaXNzaW9uKCl7XG4gICAgICAgIHNvY2tldC5lbWl0KEV2ZW50Q29uc3RhbnRzLkNPTVBMRVRFX01JU1NJT04pO1xuICAgIH0sXG5cbiAgICAvKlxuICAgICAqIFRoaXMgaXMgb25seSBzdHViYmVkIG91dCB1bnRpbCBzZXJ2ZXIgY29tbXVuaWNhdGlvbiBpcyB1cCBhbmQgcnVubmluZ1xuICAgICAqL1xuICAgIGFza0ZvckFwcFN0YXRlKCkge1xuICAgICAgICBzb2NrZXQuZW1pdCgnZ2V0IGFwcCBzdGF0ZScpO1xuICAgIH0sXG5cbiAgICBhc2tGb3JNaXNzaW9uVGltZSgpe1xuICAgICAgICBzb2NrZXQuZW1pdCgnZ2V0IG1pc3Npb24gdGltZScpO1xuICAgIH0sXG5cbiAgICBfYXBwU3RhdGVSZWNlaXZlZChhcHBTdGF0ZSkge1xuICAgICAgICBBcHBEaXNwYXRjaGVyLmRpc3BhdGNoKHthY3Rpb246IE1pc3Npb25Db25zdGFudHMuUkVDRUlWRURfQVBQX1NUQVRFLCBhcHBTdGF0ZX0pO1xuICAgIH0sXG5cbiAgICBhc2tGb3JFdmVudHMoKXtcbiAgICAgICAgc29ja2V0LmVtaXQoRXZlbnRDb25zdGFudHMuR0VUX0VWRU5UUyk7XG4gICAgfSxcblxuICAgIHNldE94eWdlbkNvbnN1bXB0aW9uKHVuaXRzKSB7XG4gICAgICAgIHNvY2tldC5lbWl0KCdzZXQgb3h5Z2VuIGNvbnN1bXB0aW9uJywgdW5pdHMpO1xuICAgIH0sXG5cbiAgICAvLyBtZWFudCBmb3IgdGVzdGluZyAtIG5vdCBhY3R1YWwgY2xpZW50IHVzZVxuICAgIHNldE94eWdlbkxldmVsKHVuaXRzKSB7XG4gICAgICAgIHNvY2tldC5lbWl0KCdzZXQgb3h5Z2VuIHJlbWFpbmluZycsIHVuaXRzKTtcbiAgICB9XG5cbn07XG5cbndpbmRvdy5fX2FwaSA9IGFwaTtcbm1vZHVsZS5leHBvcnRzID0gYXBpO1xuIiwiLyogU2NyaXB0IHRvIGJvb3RzdHJhcCB0aGUgYXBwbGljYXRpb24gKi9cblxudmFyIE1pc3Npb25BY3Rpb25DcmVhdG9ycyA9IHJlcXVpcmUoJy4vYWN0aW9ucy9NaXNzaW9uQWN0aW9uQ3JlYXRvcnMnKSxcbiAgICBNZXNzYWdlQWN0aW9uQ3JlYXRvcnMgPSByZXF1aXJlKCcuL2FjdGlvbnMvTWVzc2FnZUFjdGlvbkNyZWF0b3JzJyksXG4gICAgU2NpZW5jZUFjdGlvbkNyZWF0b3JzID0gcmVxdWlyZSgnLi9hY3Rpb25zL1NjaWVuY2VBY3Rpb25DcmVhdG9ycycpLFxuICAgIFNjaWVuY2VDb25zdGFudHMgPSByZXF1aXJlKCcuL2NvbnN0YW50cy9TY2llbmNlVGVhbUNvbnN0YW50cycpLFxuICAgIFRpbWVyQWN0aW9uQ3JlYXRvcnMgPSByZXF1aXJlKCcuL2FjdGlvbnMvVGltZXJBY3Rpb25DcmVhdG9ycycpLFxuICAgIEFwcERpc3BhdGNoZXIgPSByZXF1aXJlKCcuL2FwcGRpc3BhdGNoZXInKTtcblxuQXBwRGlzcGF0Y2hlci5yZWdpc3RlcigocGF5bG9hZCk9PiB7XG4gICAgY29uc29sZS5sb2coJ0RFQlVHIEFwcERpc3BhdGNoZXIuZGlzcGF0Y2gnLCBwYXlsb2FkKTtcbn0pO1xuXG5mdW5jdGlvbiBydW4oKSB7XG5cbiAgICAvLyBTRVRUSU5HU1xuICAgIE1pc3Npb25BY3Rpb25DcmVhdG9ycy5zdGFydE1pc3Npb24oKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7cnVufTsiLCJjb25zdCBSZWFjdCA9IHJlcXVpcmUoJ3JlYWN0Jyk7XG5jb25zdCBSb3V0ZXIgPSByZXF1aXJlKCdyZWFjdC1yb3V0ZXInKTtcblxuY29uc3QgUm91dGVIYW5kbGVyID0gUm91dGVyLlJvdXRlSGFuZGxlcjtcblxuY29uc3QgSGVhZGVyID0gcmVxdWlyZSgnLi9oZWFkZXIucmVhY3QnKTtcblxuY29uc3QgTWVzc2FnZUxpc3QgPSByZXF1aXJlKCcuL21lc3NhZ2UtbGlzdC5yZWFjdCcpO1xuY29uc3QgTWlzc2lvblN0YXRlU3RvcmUgPSByZXF1aXJlKCcuLi9zdG9yZXMvbWlzc2lvbi1zdGF0ZS1zdG9yZScpO1xuXG5jb25zdCBBcHAgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cbiAgICBtaXhpbnM6IFtdLFxuXG4gICAgZ2V0SW5pdGlhbFN0YXRlKCkge1xuICAgICAgICByZXR1cm4ge2lzTWlzc2lvblJ1bm5pbmc6IE1pc3Npb25TdGF0ZVN0b3JlLmlzTWlzc2lvblJ1bm5pbmcoKX07XG4gICAgfSxcblxuICAgIGNvbXBvbmVudFdpbGxNb3VudCgpIHtcbiAgICAgICAgTWlzc2lvblN0YXRlU3RvcmUuYWRkQ2hhbmdlTGlzdGVuZXIodGhpcy5faGFuZGxlTWlzc2lvblN0YXRlQ2hhbmdlKTtcbiAgICB9LFxuXG4gICAgY29tcG9uZW50RGlkTW91bnQoKXtcbiAgICAgICAgY29uc29sZS5sb2coJ0FwcC5jb21wb25lbnREaWRNb3VudCcpO1xuICAgIH0sXG5cbiAgICBjb21wb25lbnRXaWxsVW5tb3VudCgpIHtcbiAgICAgICAgTWlzc2lvblN0YXRlU3RvcmUucmVtb3ZlQ2hhbmdlTGlzdGVuZXIodGhpcy5faGFuZGxlTWlzc2lvblN0YXRlQ2hhbmdlKTtcbiAgICB9LFxuXG4gICAgX2hhbmRsZU1pc3Npb25TdGF0ZUNoYW5nZSgpIHtcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7aXNNaXNzaW9uUnVubmluZzogTWlzc2lvblN0YXRlU3RvcmUuaXNNaXNzaW9uUnVubmluZygpfSk7XG4gICAgfSxcblxuICAgIHJlbmRlcjogZnVuY3Rpb24gKCkge1xuXG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nY29udGFpbmVyJz5cblxuICAgICAgICAgICAgICAgIDxIZWFkZXIvPlxuXG4gICAgICAgICAgICAgICAgey8qIHRoaXMgaXMgdGhlIGltcG9ydGFudCBwYXJ0ICovfVxuICAgICAgICAgICAgICAgIDxSb3V0ZUhhbmRsZXIgey4uLnRoaXMucHJvcHN9IHsuLi50aGlzLnN0YXRlfSAvPlxuXG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJyb3dcIj5cbiAgICAgICAgICAgICAgICAgICAgPGZvb3RlciBpZD0nbWFpbi1mb290ZXInPjwvZm9vdGVyPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICk7XG4gICAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gQXBwOyIsImNvbnN0IFJlYWN0ID0gcmVxdWlyZSgncmVhY3QnKTtcbmNvbnN0IEhlYXJ0UmF0ZUNoYXJ0ID0gcmVxdWlyZSgnLi9oZWFydC1yYXRlLWNoYXJ0LnJlYWN0Jyk7XG5jb25zdCBCcmVhdGhSYXRlQ2hhcnQgPSByZXF1aXJlKCcuL2JyZWF0aC1yYXRlLWNoYXJ0LnJlYWN0Jyk7XG5jb25zdCBUaW1lclBhbmVsID0gcmVxdWlyZSgnLi90aW1lci1wYW5lbC5yZWFjdCcpO1xuY29uc3QgVGltZXJBY3Rpb25DcmVhdG9ycyA9IHJlcXVpcmUoJy4uL2FjdGlvbnMvVGltZXJBY3Rpb25DcmVhdG9ycycpO1xuY29uc3QgT3h5Z2VuU3RvcmUgPSByZXF1aXJlKCcuLi9zdG9yZXMvb3h5Z2VuLXN0b3JlJyk7XG5jb25zdCBBc3Ryb25hdXRDb25zdGFudHMgPSByZXF1aXJlKCcuLi9jb25zdGFudHMvQXN0cm9UZWFtQ29uc3RhbnRzJyk7XG5jb25zdCBBc3Ryb25hdXRBY3Rpb25DcmVhdG9ycyA9IHJlcXVpcmUoJy4uL2FjdGlvbnMvQXN0cm9UZWFtQWN0aW9uQ3JlYXRvcnMnKTtcbmNvbnN0IHsgcGFyc2VOdW1iZXIgfSA9IHJlcXVpcmUoJy4uL3V0aWxzJyk7XG5cblRpbWVyQWN0aW9uQ3JlYXRvcnMuc2V0VGltZXIoQXN0cm9uYXV0Q29uc3RhbnRzLlJFU1BJUkFUSU9OX1RJTUVSLCAxNSk7XG5UaW1lckFjdGlvbkNyZWF0b3JzLnNldFRpbWVyKEFzdHJvbmF1dENvbnN0YW50cy5IRUFSVF9SQVRFX1RJTUVSLCAxMCk7XG5cbi8vIGxhenkgbG9hZCBkdWUgdG8gYXZvaWQgY2lyY3VsYXIgZGVwZW5kZW5jaWVzXG5mdW5jdGlvbiBsYXp5UmVxdWlyZShwYXRoKSB7XG4gICAgbGV0IHRtcCA9IG51bGw7XG4gICAgcmV0dXJuICgpPT4ge1xuICAgICAgICBpZiAoIXRtcCkgdG1wID0gcmVxdWlyZShwYXRoKTtcbiAgICAgICAgcmV0dXJuIHRtcDtcbiAgICB9XG59XG5jb25zdCBnZXRNaXNzaW9uQUMgPSBsYXp5UmVxdWlyZSgnLi4vYWN0aW9ucy9NaXNzaW9uQWN0aW9uQ3JlYXRvcnMnKTtcbi8vIGZvciBicm93c2VyaWZ5IHRvIHdvcmsgaXQgbmVlZHMgdG8gZmluZCB0aGVzZSBtYWdpYyBzdHJpbmdzXG5yZXF1aXJlKCcuLi9hY3Rpb25zL01pc3Npb25BY3Rpb25DcmVhdG9ycycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblxuICAgIHN0YXRpY3M6IHt9LFxuXG4gICAgcHJvcFR5cGVzOiB7fSxcblxuICAgIG1peGluczogW10sXG5cbiAgICBnZXRJbml0aWFsU3RhdGUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9nZXRTdGF0ZSgpO1xuICAgIH0sXG4gICAgY29tcG9uZW50V2lsbE1vdW50KCkge1xuICAgICAgICBPeHlnZW5TdG9yZS5hZGRDaGFuZ2VMaXN0ZW5lcigoKSA9PiB0aGlzLl91cGRhdGVTdGF0ZSgpKTtcbiAgICB9LFxuXG4gICAgX2luZGljYXRvckNvbG9yKCl7XG4gICAgICAgIHJldHVybiB0aGlzLnN0YXRlLm94eWdlblN0b3JlLmNvbG9ySW5kaWNhdG9yO1xuICAgIH0sXG5cbiAgICBfdXBkYXRlU3RhdGUoKSB7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUodGhpcy5fZ2V0U3RhdGUoKSlcbiAgICB9LFxuXG4gICAgX2dldFN0YXRlKCl7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBveHlnZW5TdG9yZTogT3h5Z2VuU3RvcmUuZ2V0U3RhdGUoKVxuICAgICAgICB9O1xuICAgIH0sXG5cbiAgICBfaGFuZGxlQnJlYXRoUmF0ZShlKXtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICB2YXIgZWwgPSBSZWFjdC5maW5kRE9NTm9kZSh0aGlzLnJlZnNbJ2JyZWF0aC1yYXRlJ10pO1xuICAgICAgICBBc3Ryb25hdXRBY3Rpb25DcmVhdG9ycy5zZXRPeHlnZW5Db25zdW1wdGlvbihwYXJzZU51bWJlcihlbC52YWx1ZSkpXG4gICAgICAgIGdldE1pc3Npb25BQygpLnRhc2tDb21wbGV0ZWQoJ2FzdHJvbmF1dCcsICdicmVhdGhpbmdfY2FsY3VsYXRlJylcbiAgICB9LFxuXG4gICAgX2hhbmRsZUhlYXJ0UmF0ZShlKXtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICB2YXIgZWwgPSBSZWFjdC5maW5kRE9NTm9kZSh0aGlzLnJlZnNbJ2hlYXJ0LXJhdGUtaW5wdXQnXSk7XG4gICAgICAgIEFzdHJvbmF1dEFjdGlvbkNyZWF0b3JzLmhlYXJ0UmF0ZVJlYWQocGFyc2VOdW1iZXIoZWwudmFsdWUpKTtcbiAgICAgICAgZ2V0TWlzc2lvbkFDKCkudGFza0NvbXBsZXRlZCgnYXN0cm9uYXV0JywgJ2hlYXJ0cmF0ZV9jYWxjdWxhdGUnKVxuICAgIH0sXG5cbiAgICByZW5kZXIoKSB7XG5cbiAgICAgICAgcmV0dXJuICggPGRpdiA+XG5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicm93XCI+XG5cbiAgICAgICAgICAgICAgICA8dWw+XG4gICAgICAgICAgICAgICAgICAgIDxsaT5cbiAgICAgICAgICAgICAgICAgICAgICAgIEx1ZnRzdGF0dXM6XG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiY2lyY2xlIFwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3R5bGU9eyB7IGRpc3BsYXk6ICdpbmxpbmUtYmxvY2snLCBiYWNrZ3JvdW5kQ29sb3IgOiB0aGlzLl9pbmRpY2F0b3JDb2xvcigpIH0gfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICA8L2xpPlxuICAgICAgICAgICAgICAgICAgICA8bGk+Rm9yYnJ1ayA6IHsgdGhpcy5zdGF0ZS5veHlnZW5TdG9yZS5jb25zdW1wdGlvblBlck1pbnV0ZSB9PC9saT5cbiAgICAgICAgICAgICAgICAgICAgPGxpPkdqZW5zdMOlZW5kZSBva3N5Z2VuOiB7IHRoaXMuc3RhdGUub3h5Z2VuU3RvcmUucmVtYWluaW5nfSBlbmhldGVyPC9saT5cbiAgICAgICAgICAgICAgICA8L3VsPlxuXG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicm93XCI+XG5cblxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPSdjb2wtbWQtNic+XG4gICAgICAgICAgICAgICAgICAgIDxoMj5QdXN0PC9oMj5cbiAgICAgICAgICAgICAgICAgICAgPEJyZWF0aFJhdGVDaGFydCBoZWlnaHQ9ezI0MH0vPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9J2NvbC1tZC02Jz5cbiAgICAgICAgICAgICAgICAgICAgPGgyPkhqZXJ0ZXNsYWc8L2gyPlxuICAgICAgICAgICAgICAgICAgICA8SGVhcnRSYXRlQ2hhcnQgaGVpZ2h0PXsyNDB9Lz5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgICAgIDxUaW1lclBhbmVsIHRpbWVySWQ9e0FzdHJvbmF1dENvbnN0YW50cy5SRVNQSVJBVElPTl9USU1FUn0gY2xhc3NOYW1lPSdjb2wtbWQtNicvPlxuICAgICAgICAgICAgICAgIDxUaW1lclBhbmVsIHRpbWVySWQ9e0FzdHJvbmF1dENvbnN0YW50cy5IRUFSVF9SQVRFX1RJTUVSfSBjbGFzc05hbWU9J2NvbC1tZC02Jy8+XG5cbiAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInJvd1wiPlxuXG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJjb2wteHMtNlwiPlxuICAgICAgICAgICAgICAgICAgICA8ZmllbGRzZXQgZGlzYWJsZWQ9eyBmYWxzZSB9PlxuICAgICAgICAgICAgICAgICAgICAgICAgPGgzPkJlcmVnbmV0IGx1ZnRmb3JicnVrPC9oMz5cblxuICAgICAgICAgICAgICAgICAgICAgICAgPGZvcm0gb25TdWJtaXQ9e3RoaXMuX2hhbmRsZUJyZWF0aFJhdGV9PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzZWxlY3QgcmVmPSdicmVhdGgtcmF0ZSc+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9ezF9PjEgZW5oZXQgcGVyIG1pbnV0dDwvb3B0aW9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPXsyfT4yIGVuaGV0ZXIgcGVyIG1pbnV0dDwvb3B0aW9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvc2VsZWN0PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b24gY2xhc3NOYW1lPSdidG4gYnRuLXByaW1hcnknPkV2YWx1ZXI8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvZm9ybT5cbiAgICAgICAgICAgICAgICAgICAgPC9maWVsZHNldD5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiY29sLXhzLTZcIj5cbiAgICAgICAgICAgICAgICAgICAgPGZpZWxkc2V0IGRpc2FibGVkPXsgZmFsc2UgfT5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxoMz5CZXJlZ25ldCBoamVydGVyeXRtZTwvaDM+XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxmb3JtIG9uU3VibWl0PXt0aGlzLl9oYW5kbGVIZWFydFJhdGV9PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxpbnB1dCByZWY9J2hlYXJ0LXJhdGUtaW5wdXQnIHR5cGU9XCJudW1iZXJcIiBtaW49XCI1MFwiIG1heD1cIjIwMFwiLz5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uIGNsYXNzTmFtZT0nYnRuIGJ0bi1wcmltYXJ5Jz5FdmFsdWVyPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2Zvcm0+XG4gICAgICAgICAgICAgICAgICAgIDwvZmllbGRzZXQ+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgIDwvZGl2PiApO1xuICAgIH1cblxufSk7XG5cbiIsIi8qKlxuICogVEhJUyBERVNJR04gT05MWSBTVVBQT1JUUyBPTkUgQ0hBUlQgQVMgVEhFWSAqU0hBUkUqIFNUQVRFXG4gKiBGb3IgYSBub24tc3R1cGlkIGRlc2lnbiwgZG8gc29tZXRoaW5nIGxpa2UgdGhlXG4gKiBpbXBsZW1lbnRhdGlvbiBpbiB0aGUgYXJ0aWNsZSBieSBOaWNvbGFzIEhlcnk6XG4gKiBodHRwOi8vbmljb2xhc2hlcnkuY29tL2ludGVncmF0aW5nLWQzanMtdmlzdWFsaXphdGlvbnMtaW4tYS1yZWFjdC1hcHBcbiAqXG4gKiBDaGFydCBjb2RlIG1vcmUgb3IgbGVzcyBjb3BpZWQgZnJvbSB0aGUgcHJvdG90eXBlIGJ5IExlbyBNYXJ0aW4gV2VzdGJ5XG4gKi9cbmNvbnN0IFJlYWN0ID0gcmVxdWlyZSgncmVhY3QnKTtcbmNvbnN0IEFtQ2hhcnRzID0gcmVxdWlyZSgnYW1jaGFydHMnKTtcbnZhciBCcmVhdGhSYXRlU3RvcmUgPSByZXF1aXJlKCcuLi9zdG9yZXMvYnJlYXRoLXJhdGUtc3RvcmUnKTtcbmNvbnN0IHsgcmFuZG9tSW50IH0gPSByZXF1aXJlKCcuLi91dGlscycpO1xuXG4vL0x1bmcgdm9sdW1lIGluIG1sIGJlZm9yZSBhbmQgYWZ0ZXIgaW5oYWxhdGlvblxudmFyIGxvd1ZvbHVtZSA9IDIwMDA7XG52YXIgaGlnaFZvbHVtZSA9IDMwMDA7XG5cbi8vTWlsbGl2b2x0cyBkaXNwbGF5ZWQgb24gdGhlIFkgYXhpcyBvZiB0aGUgRUNHIGdyYXBoXG52YXIgaGlnaE1WID0gMTtcbnZhciBsb3dNViA9IDA7XG5cbnZhciBicmVhdGhSYXRlU2FtcGxlcyA9IFtdO1xudmFyIGNoYXJ0O1xuXG4vL0NvbmZpZ3VyZSB0aGUgY2hhcnRzXG5mdW5jdGlvbiBpbml0Q2hhcnQoZG9tRWxlbWVudCkge1xuICAgIGNoYXJ0ID0gbmV3IEFtQ2hhcnRzLkFtU2VyaWFsQ2hhcnQoKTtcblxuICAgIGNoYXJ0Lm1hcmdpblRvcCA9IDIwO1xuICAgIGNoYXJ0Lm1hcmdpblJpZ2h0ID0gMTA7XG4gICAgY2hhcnQuYXV0b01hcmdpbk9mZnNldCA9IDU7XG4gICAgY2hhcnQuZGF0YVByb3ZpZGVyID0gYnJlYXRoUmF0ZVNhbXBsZXM7XG4gICAgY2hhcnQuY2F0ZWdvcnlGaWVsZCA9IFwidGltZXN0YW1wXCI7XG5cbiAgICAvL1ggQXhpc1xuICAgIHZhciBjYXRlZ29yeUF4aXMgPSBjaGFydC5jYXRlZ29yeUF4aXM7XG4gICAgY2F0ZWdvcnlBeGlzLmRhc2hMZW5ndGggPSAxO1xuICAgIGNhdGVnb3J5QXhpcy5ncmlkQWxwaGEgPSAwLjEwXG4gICAgY2F0ZWdvcnlBeGlzLmF4aXNDb2xvciA9IFwiI0RBREFEQVwiO1xuICAgIGNhdGVnb3J5QXhpcy5hdXRvR3JpZENvdW50ID0gZmFsc2U7XG4gICAgY2F0ZWdvcnlBeGlzLmdyaWRDb3VudCA9IDE1O1xuICAgIGNhdGVnb3J5QXhpcy5mb3JjZVNob3dGaWVsZCA9IFwiZm9yY2VTaG93XCI7XG4gICAgLy9jYXRlZ29yeUF4aXMudGl0bGUgPSBcIlNlY29uZHNcIjtcblxuICAgIC8vSGlkZSBldmVyeSBsYWJlbCB0aGF0IGlzIG5vdCBleHBsaWNpdGx5IHNob3duXG4gICAgY2F0ZWdvcnlBeGlzLmxhYmVsRnVuY3Rpb24gPSBmdW5jdGlvbih2YWx1ZVRleHQsIG9iamVjdCkge1xuICAgICAgICBpZiAob2JqZWN0LmZvcmNlU2hvdykge1xuICAgICAgICAgICAgcmV0dXJuIHZhbHVlVGV4dDtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICAvL1kgQXhpc1xuICAgIHZhciB2YWx1ZUF4aXMgPSBuZXcgQW1DaGFydHMuVmFsdWVBeGlzKCk7XG4gICAgdmFsdWVBeGlzLmF4aXNBbHBoYSA9IDAuMjtcbiAgICB2YWx1ZUF4aXMuZGFzaExlbmd0aCA9IDE7XG4gICAgdmFsdWVBeGlzLm1pbmltdW0gPSBsb3dWb2x1bWU7XG4gICAgdmFsdWVBeGlzLm1heGltdW0gPSBoaWdoVm9sdW1lICogMS4xO1xuICAgIHZhbHVlQXhpcy50aXRsZSA9IFwiTHVuZ2V2b2x1bSAobWwpXCI7XG4gICAgY2hhcnQuYWRkVmFsdWVBeGlzKHZhbHVlQXhpcyk7XG5cbiAgICAvL0xpbmVcbiAgICB2YXIgZ3JhcGggPSBuZXcgQW1DaGFydHMuQW1HcmFwaCgpO1xuICAgIGdyYXBoLnR5cGUgPSBcInNtb290aGVkTGluZVwiO1xuICAgIGdyYXBoLnZhbHVlRmllbGQgPSBcInZvbHVtZVwiO1xuICAgIGdyYXBoLmxpbmVUaGlja25lc3MgPSAxLjU7XG4gICAgZ3JhcGgubGluZUNvbG9yID0gXCIjYjUwMzBkXCI7XG4gICAgY2hhcnQuYWRkR3JhcGgoZ3JhcGgpO1xuXG4gICAgY2hhcnQud3JpdGUoZG9tRWxlbWVudCk7XG59XG5cbnZhciBicmVhdGhSYXRlQnVmZmVyO1xudmFyIGJyZWF0aFJhdGVCdWZmZXJJbmRleDtcbnZhciBtc1VudGlsTmV4dEJyZWF0aFJhdGVCdWZmZXJGcmFtZTtcblxuLy9GaWxscyB0aGUgYnJlYXRoIHJhdGUgYnVmZmVyIHdpdGggc2FtcGxlcyBmcm9tIHRoZSBzcGVjaWZpZWQgcmFuZ2Vcbi8vVGhlIGJyZWF0aCByYXRlIGJ1ZmZlciBjb250YWlucyB0d2ljZSBhcyBtYW55IHNhbXBsZXMgYXMgdGhlIGJyZWF0aCByYXRlIGNoYXJ0IGFuZCBpcyB1c2VkIHRvIGFuaW1hdGUgdGhlIGNoYXJ0XG5mdW5jdGlvbiBjcmVhdGVCcmVhdGhSYXRlU2FtcGxlcyhtaW4sIG1heCkge1xuICAgIGJyZWF0aFJhdGVCdWZmZXIgPSBbXTtcbiAgICBicmVhdGhSYXRlQnVmZmVySW5kZXggPSAwO1xuICAgIG1zVW50aWxOZXh0QnJlYXRoUmF0ZUJ1ZmZlckZyYW1lID0gMDtcblxuICAgIHZhciBicmVhdGhzUGVyTWludXRlID0gcmFuZG9tSW50KG1pbiwgbWF4KTtcbiAgICB2YXIgbXNCZXR3ZWVuQnJlYXRocyA9IDYwICogMTAwMCAvIGJyZWF0aHNQZXJNaW51dGU7XG4gICAgdmFyIG1zVW50aWxOZXh0QnJlYXRoID0gbXNCZXR3ZWVuQnJlYXRocztcblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDw9IDEyMDsgaSsrKSB7XG4gICAgICAgIHZhciBsdW5nVm9sdW1lO1xuXG4gICAgICAgIGlmIChtc1VudGlsTmV4dEJyZWF0aCA8PSAwKSB7XG4gICAgICAgICAgICBsdW5nVm9sdW1lID0gaGlnaFZvbHVtZTtcbiAgICAgICAgICAgIG1zVW50aWxOZXh0QnJlYXRoID0gbXNCZXR3ZWVuQnJlYXRocztcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGx1bmdWb2x1bWUgPSBsb3dWb2x1bWUgKiAxLjA1O1xuICAgICAgICB9XG5cbiAgICAgICAgLy9UaGUgcmVzb2x1dGlvbiBvZiB0aGUgY2hhcnQgaXMgdHdvIHNhbXBsZXMgcGVyIHNlY29uZFxuICAgICAgICBicmVhdGhSYXRlQnVmZmVyLnB1c2goe3RpbWVzdGFtcDogaSAvIDIsIHZvbHVtZTogbHVuZ1ZvbHVtZX0pO1xuICAgICAgICBtc1VudGlsTmV4dEJyZWF0aCAtPSA1MDA7XG4gICAgfVxufVxuXG52YXIgY2hhcnRVcGRhdGVyO1xuXG4vL0FuaW1hdGVzIHRoZSBicmVhdGggcmF0ZSBhbmQgaGVhcnQgcmF0ZSBjaGFydHNcbmZ1bmN0aW9uIHN0YXJ0RXZlbnRMb29wKCkge1xuICAgIHZhciBzdGFydFRpbWUgPSBEYXRlLm5vdygpO1xuICAgIHZhciBtc1NpbmNlTGFzdFVwZGF0ZSA9IDA7XG4gICAgdmFyIG1zU2luY2VTdGFydCA9IDA7XG4gICAgdmFyIHVwZGF0ZUZyZXF1ZW5jeSA9IDQwMDtcbiAgICBzdG9wRXZlbnRMb29wKCk7XG5cbiAgICBjaGFydFVwZGF0ZXIgPSBzZXRJbnRlcnZhbChmdW5jdGlvbigpIHtcbiAgICAgICAgbXNTaW5jZUxhc3RVcGRhdGUgPSBEYXRlLm5vdygpIC0gc3RhcnRUaW1lIC0gbXNTaW5jZVN0YXJ0O1xuICAgICAgICBtc1VudGlsTmV4dEJyZWF0aFJhdGVCdWZmZXJGcmFtZSAtPSBtc1NpbmNlTGFzdFVwZGF0ZTtcbiAgICAgICAgbXNTaW5jZVN0YXJ0ID0gRGF0ZS5ub3coKSAtIHN0YXJ0VGltZTtcblxuICAgICAgICBpZiAobXNVbnRpbE5leHRCcmVhdGhSYXRlQnVmZmVyRnJhbWUgPD0gMCkge1xuICAgICAgICAgICAgdmFyIGZyYW1lc01pc3NlZCA9IE1hdGguZmxvb3IoKG1zVW50aWxOZXh0QnJlYXRoUmF0ZUJ1ZmZlckZyYW1lICogLTEpIC8gNTAwICsgMSk7XG5cbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZnJhbWVzTWlzc2VkOyBpKyspIHtcbiAgICAgICAgICAgICAgICBicmVhdGhSYXRlQnVmZmVySW5kZXgrKztcblxuICAgICAgICAgICAgICAgIGlmIChicmVhdGhSYXRlQnVmZmVySW5kZXggPj0gYnJlYXRoUmF0ZUJ1ZmZlci5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgYnJlYXRoUmF0ZUJ1ZmZlckluZGV4ID0gMDtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBicmVhdGhSYXRlU2FtcGxlcy5wdXNoKGJyZWF0aFJhdGVCdWZmZXJbYnJlYXRoUmF0ZUJ1ZmZlckluZGV4XSk7XG5cbiAgICAgICAgICAgICAgICAvL1doZW4gdGhlIGNoYXJ0IGdyb3dzIHRvIDMwIHNlY29uZHMsIHN0YXJ0IGN1dHRpbmcgb2ZmIHRoZSBvbGRlc3Qgc2FtcGxlIHRvIGdpdmUgdGhlIGNoYXJ0IGEgc2xpZGluZyBlZmZlY3RcbiAgICAgICAgICAgICAgICBpZiAoYnJlYXRoUmF0ZVNhbXBsZXMubGVuZ3RoID4gNjApIHtcbiAgICAgICAgICAgICAgICAgICAgYnJlYXRoUmF0ZVNhbXBsZXMuc2hpZnQoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIG1zVW50aWxOZXh0QnJlYXRoUmF0ZUJ1ZmZlckZyYW1lID0gMjUwO1xuICAgICAgICB9XG5cbiAgICAgICAgLy9BbHdheXMgc2hvdyBmcm9tIDAgdG8gMzAgc2Vjb25kcyBvbiB0aGUgWCBheGlzXG4gICAgICAgIGlmIChicmVhdGhSYXRlU2FtcGxlcy5sZW5ndGggPj0gNjApIHtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYnJlYXRoUmF0ZVNhbXBsZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBicmVhdGhSYXRlU2FtcGxlc1tpXS50aW1lc3RhbXAgPSBNYXRoLmZsb29yKGkgLyAoYnJlYXRoUmF0ZVNhbXBsZXMubGVuZ3RoIC0gMSkgKiAzMCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvL09ubHkgc2hvdyBldmVyeSA1dGggdGltZXN0YW1wXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYnJlYXRoUmF0ZVNhbXBsZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGJyZWF0aFJhdGVTYW1wbGVzW2ldLmZvcmNlU2hvdyA9IGJyZWF0aFJhdGVTYW1wbGVzW2ldLnRpbWVzdGFtcCAlIDUgPT0gMCAmJiAoaSA9PSAwIHx8IGJyZWF0aFJhdGVTYW1wbGVzW2kgLSAxXS50aW1lc3RhbXAgJSA1ICE9IDApO1xuICAgICAgICB9XG5cbiAgICAgICAgY2hhcnQudmFsaWRhdGVEYXRhKCk7XG4gICAgfSwgdXBkYXRlRnJlcXVlbmN5KTtcbn1cblxuZnVuY3Rpb24gc3RvcEV2ZW50TG9vcCgpIHtcbiAgICBjbGVhckludGVydmFsKGNoYXJ0VXBkYXRlcik7XG4gICAgYnJlYXRoUmF0ZVNhbXBsZXMubGVuZ3RoID0gMDtcbiAgICBjaGFydC52YWxpZGF0ZURhdGEoKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cbiAgICBzdGF0aWNzOiB7fSxcblxuICAgIHByb3BUeXBlczoge1xuICAgICAgICBoZWlnaHQ6IFJlYWN0LlByb3BUeXBlcy5udW1iZXIuaXNSZXF1aXJlZCxcbiAgICAgICAgd2lkdGg6IFJlYWN0LlByb3BUeXBlcy5udW1iZXJcbiAgICB9LFxuXG4gICAgbWl4aW5zOiBbXSxcblxuICAgIGdldEluaXRpYWxTdGF0ZSgpe1xuICAgICAgICByZXR1cm4gdGhpcy5fZ2V0Q2hhcnRTdGF0ZSgpO1xuICAgIH0sXG5cbiAgICBjb21wb25lbnRXaWxsTW91bnQoKSB7XG4gICAgICAgIHRoaXMuX3VwZGF0ZUNoYXJ0KCk7XG4gICAgICAgIEJyZWF0aFJhdGVTdG9yZS5hZGRDaGFuZ2VMaXN0ZW5lcigoKSA9PiB0aGlzLl91cGRhdGVDaGFydCgpKTtcbiAgICB9LFxuXG4gICAgY29tcG9uZW50RGlkTW91bnQoKSB7XG4gICAgICAgIHZhciBlbCA9IFJlYWN0LmZpbmRET01Ob2RlKHRoaXMpO1xuICAgICAgICBpbml0Q2hhcnQoZWwpO1xuICAgICAgICBzdGFydEV2ZW50TG9vcCgpO1xuICAgIH0sXG5cbiAgICBjb21wb25lbnRXaWxsVW5tb3VudCgpIHtcbiAgICAgICAgY2hhcnQgJiYgY2hhcnQuY2xlYXIoKTtcbiAgICAgICAgc3RvcEV2ZW50TG9vcCgpO1xuICAgIH0sXG5cbiAgICBjb21wb25lbnREaWRVbm1vdW50KCkge1xuICAgICAgICBjaGFydCA9IG51bGw7XG4gICAgfSxcblxuICAgIGNvbXBvbmVudERpZFVwZGF0ZSgpIHtcbiAgICB9LFxuXG4gICAgLy8gdGhpcyBjaGFydCBpcyByZXNwb25zaWJsZSBmb3IgZHJhd2luZyBpdHNlbGZcbiAgICBzaG91bGRDb21wb25lbnRVcGRhdGUoKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9LFxuXG4gICAgLy8gUHJpdmF0ZSBtZXRob2RzXG4gICAgX3VwZGF0ZUNoYXJ0KCl7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUodGhpcy5fZ2V0Q2hhcnRTdGF0ZSgpKTtcbiAgICAgICAgY3JlYXRlQnJlYXRoUmF0ZVNhbXBsZXModGhpcy5zdGF0ZS5taW4sIHRoaXMuc3RhdGUubWF4KTtcbiAgICB9LFxuXG4gICAgX2dldENoYXJ0U3RhdGUoKXtcbiAgICAgICAgcmV0dXJuIEJyZWF0aFJhdGVTdG9yZS5nZXRTdGF0ZSgpO1xuICAgIH0sXG5cbiAgICBfb25DaGFuZ2UoKXtcblxuICAgIH0sXG5cbiAgICByZW5kZXIoKSB7XG5cbiAgICAgICAgLy8gaWYgeW91IGRvbid0IHNwZWNpZnkgd2lkdGggaXQgd2lsbCBtYXggb3V0IHRvIDEwMCUgKHdoaWNoIGlzIG9rKVxuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgPGRpdlxuICAgICAgICAgICAgICAgIHN0eWxlPXt7d2lkdGg6IHRoaXMucHJvcHMud2lkdGggKyAncHgnLCBoZWlnaHQgOiB0aGlzLnByb3BzLmhlaWdodCsgJ3B4J319XG4gICAgICAgICAgICAgICAgY2xhc3NOYW1lPXt0aGlzLnByb3BzLmNsYXNzTmFtZX1cbiAgICAgICAgICAgICAgICAvPlxuICAgICAgICApO1xuICAgIH1cblxufSk7XG4iLCJjb25zdCBSZWFjdCA9IHJlcXVpcmUoJ3JlYWN0Jyk7XG5jb25zdCBPeHlnZW5TdG9yZSA9IHJlcXVpcmUoJy4uL3N0b3Jlcy9veHlnZW4tc3RvcmUnKTtcbmNvbnN0IHsgcGFyc2VOdW1iZXIgfSA9IHJlcXVpcmUoJy4uL3V0aWxzJyk7XG5cbi8vIGxhenkgbG9hZCBkdWUgdG8gYXZvaWQgY2lyY3VsYXIgZGVwZW5kZW5jaWVzXG5mdW5jdGlvbiBsYXp5UmVxdWlyZShwYXRoKSB7XG4gICAgbGV0IHRtcCA9IG51bGw7XG4gICAgcmV0dXJuICgpPT4ge1xuICAgICAgICBpZiAoIXRtcCkgdG1wID0gcmVxdWlyZShwYXRoKTtcbiAgICAgICAgcmV0dXJuIHRtcDtcbiAgICB9XG59XG5jb25zdCBnZXRNaXNzaW9uQUMgPSBsYXp5UmVxdWlyZSgnLi4vYWN0aW9ucy9NaXNzaW9uQWN0aW9uQ3JlYXRvcnMnKTtcbi8vIGZvciBicm93c2VyaWZ5IHRvIHdvcmsgaXQgbmVlZHMgdG8gZmluZCB0aGVzZSBtYWdpYyBzdHJpbmdzXG5yZXF1aXJlKCcuLi9hY3Rpb25zL01pc3Npb25BY3Rpb25DcmVhdG9ycycpO1xuXG5cbnZhciBzYXRlbGxpdGVzID0gW1xuICAgIHtuYW1lOiAnU2F0ZWxpdHQgMScsIGZyZXE6IHttaW46IDIuOCwgbWF4OiAzLjR9LCByZWNlcHRpb246IDkwLCBjb2xvcjogJ2dyZWVuJ30sXG4gICAge25hbWU6ICdTYXRlbGl0dCAyJywgZnJlcToge21pbjogMi4xLCBtYXg6IDIuNX0sIHJlY2VwdGlvbjogMzAsIGNvbG9yOiAncmVkJ30sXG4gICAge25hbWU6ICdTYXRlbGl0dCAzJywgZnJlcToge21pbjogMy42LCBtYXg6IDQuMH0sIHJlY2VwdGlvbjogNjAsIGNvbG9yOiAnb3JhbmdlJ31cbl07XG5cblxudmFyIGNoYXJ0O1xuZnVuY3Rpb24gaW5pdEdyYXBoKGRvbUVsZW1lbnQpIHtcbiAgICBjaGFydCA9IG5ldyBBbUNoYXJ0cy5BbVNlcmlhbENoYXJ0KCk7XG5cbiAgICBjaGFydC5kYXRhUHJvdmlkZXIgPSBzYXRlbGxpdGVzO1xuICAgIGNoYXJ0LmNhdGVnb3J5RmllbGQgPSBcIm5hbWVcIjtcblxuICAgIC8vWCBheGlzXG4gICAgdmFyIGNhdGVnb3J5QXhpcyA9IGNoYXJ0LmNhdGVnb3J5QXhpcztcbiAgICBjYXRlZ29yeUF4aXMuZ3JpZFBvc2l0aW9uID0gXCJzdGFydFwiO1xuXG4gICAgLy9ZIGF4aXNcbiAgICB2YXIgdmFsdWVBeGlzID0gbmV3IEFtQ2hhcnRzLlZhbHVlQXhpcygpO1xuICAgIHZhbHVlQXhpcy5heGlzQWxwaGEgPSAwO1xuICAgIHZhbHVlQXhpcy5taW5pbXVtID0gMDtcbiAgICB2YWx1ZUF4aXMubWF4aW11bSA9IDEwMDtcbiAgICB2YWx1ZUF4aXMudGl0bGUgPSBcIk1vdHRha1wiO1xuICAgIHZhbHVlQXhpcy5wb3NpdGlvbiA9IFwibGVmdFwiO1xuICAgIGNoYXJ0LmFkZFZhbHVlQXhpcyh2YWx1ZUF4aXMpO1xuXG4gICAgLy9MaW5lXG4gICAgdmFyIGdyYXBoID0gbmV3IEFtQ2hhcnRzLkFtR3JhcGgoKTtcbiAgICBncmFwaC52YWx1ZUZpZWxkID0gXCJyZWNlcHRpb25cIjtcbiAgICBncmFwaC5jb2xvckZpZWxkID0gXCJjb2xvclwiO1xuICAgIGdyYXBoLmxpbmVBbHBoYSA9IDAuMjtcbiAgICBncmFwaC5maWxsQWxwaGFzID0gMC44O1xuICAgIGdyYXBoLnR5cGUgPSBcImNvbHVtblwiO1xuICAgIGdyYXBoLnNob3dCYWxsb29uID0gZmFsc2U7XG4gICAgY2hhcnQuYWRkR3JhcGgoZ3JhcGgpO1xuXG4gICAgY2hhcnQud3JpdGUoZG9tRWxlbWVudCk7XG5cbiAgICByZXR1cm4gY2hhcnQ7XG59XG5cbmNvbnN0IFNhdGVsbGl0ZVJlY2VwdGlvbkNoYXJ0ID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXG4gICAgcHJvcFR5cGVzOiB7fSxcblxuICAgIGNvbXBvbmVudERpZE1vdW50KCl7XG4gICAgICAgIHZhciBlbCA9IFJlYWN0LmZpbmRET01Ob2RlKHRoaXMpO1xuICAgICAgICBpbml0R3JhcGgoZWwpO1xuICAgIH0sXG5cbiAgICByZW5kZXIoKXtcbiAgICAgICAgcmV0dXJuIDxkaXYgY2xhc3NOYW1lPXt0aGlzLnByb3BzLmNsYXNzTmFtZX0gc3R5bGU9e3RoaXMucHJvcHMuc3R5bGV9Lz5cbiAgICB9XG5cbn0pO1xuXG5jb25zdCBTYXRlbGxpdGVUYWJsZSA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblxuICAgIHByb3BUeXBlczoge1xuICAgICAgICBzYXRlbGxpdGVzOiBSZWFjdC5Qcm9wVHlwZXMuYXJyYXkuaXNSZXF1aXJlZFxuICAgIH0sXG5cblxuICAgIHJlbmRlcigpe1xuXG4gICAgICAgIHJldHVybiAoPHRhYmxlIGNsYXNzTmFtZT17XCJ0YWJsZSB0YWJsZS1ib3JkZXJlZCB0YWJsZS1zdHJpcGVkXCIgKyB0aGlzLnByb3BzLmNsYXNzTmFtZSB9PlxuICAgICAgICAgICAgPHRoZWFkPlxuICAgICAgICAgICAgPHRyPlxuICAgICAgICAgICAgICAgIDx0aD5TYXRlbGl0dDwvdGg+XG4gICAgICAgICAgICAgICAgPHRoPkZyZWt2ZW5zb21yw6VkZTwvdGg+XG4gICAgICAgICAgICA8L3RyPlxuICAgICAgICAgICAgPC90aGVhZD5cblxuICAgICAgICAgICAgPHRib2R5PlxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHRoaXMucHJvcHMuc2F0ZWxsaXRlcy5tYXAoKHNhdCwgaSkgPT5cbiAgICAgICAgICAgICAgICAgICAgPHRyIGtleT17aX0+XG4gICAgICAgICAgICAgICAgICAgICAgICA8dGQ+e3NhdC5uYW1lfTwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICA8dGQ+e3NhdC5mcmVxLm1pbn0gLSB7c2F0LmZyZXEubWF4fTwvdGQ+XG4gICAgICAgICAgICAgICAgICAgIDwvdHI+KVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgPC90Ym9keT5cbiAgICAgICAgPC90YWJsZT4pO1xuXG4gICAgfVxuXG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cbiAgICBzdGF0aWNzOiB7fSxcblxuICAgIHByb3BUeXBlczoge30sXG5cbiAgICBtaXhpbnM6IFtdLFxuXG4gICAgZ2V0SW5pdGlhbFN0YXRlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fZ2V0U3RhdGUoKTtcbiAgICB9LFxuICAgIGNvbXBvbmVudFdpbGxNb3VudCgpIHtcbiAgICB9LFxuXG4gICAgY29tcG9uZW50V2lsbFVubW91bnQoKSB7XG4gICAgfSxcblxuICAgIF9nZXRTdGF0ZSgpe1xuICAgICAgICByZXR1cm4ge307XG4gICAgfSxcblxuICAgIHJlbmRlcigpIHtcblxuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9J3Jvdyc+XG5cbiAgICAgICAgICAgICAgICA8U2F0ZWxsaXRlVGFibGUgc2F0ZWxsaXRlcz17c2F0ZWxsaXRlc30gY2xhc3NOYW1lPSdjb2wtc20tNicvPlxuXG4gICAgICAgICAgICAgICAgPFNhdGVsbGl0ZVJlY2VwdGlvbkNoYXJ0IGNsYXNzTmFtZT0nY29sLXNtLTYnLz5cbiAgICAgICAgICAgIDwvZGl2PiApO1xuICAgIH1cblxufSk7XG5cbiIsIi8vIG5lZWRlZCB0byBhdm9pZCBjb21waWxhdGlvbiBlcnJvclxuY29uc3QgUmVhY3QgPSByZXF1aXJlKCdyZWFjdCcpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBzY2llbmNlX2ludHJvOiA8ZGl2PlxuICAgICAgICA8cD5cbiAgICAgICAgICAgIERlcmUgc2thbCBvdmVydsOla2Ugc3Ryw6VsaW5nc25pdsOlZXQgYXN0cm9uYXR1ZW4gdXRzZXR0ZXMgZm9yLlxuICAgICAgICAgICAgRGVyZSBtw6UgZGEgcGFzc2UgcMOlIGF0IGFzdHJvbmF1dGVuIGlra2UgYmxpciB1dHNhdHRcbiAgICAgICAgICAgIGZvciBzdHLDpWxpbmdzbml2w6VlciBzb20gZXIgc2thZGVsaWcuXG4gICAgICAgIDwvcD5cblxuICAgICAgICA8cD5WZWQgaGplbHAgYXYgaW5zdHJ1bWVudGVuZSBzb20gZXIgdGlsZ2plbmdlbGlnIG3DpSBkZXJlIGpldm5saWdcbiAgICAgICAgICAgIHRhIHByw7h2ZXIgb2cgcmVnbmUgdXQgdmVyZGllbmUgZm9yIGdqZW5ub21zbml0dGxpZyBvZyB0b3RhbHRcbiAgICAgICAgICAgIHN0csOlbGluZ3NuaXbDpS4gRmlubmVyIGRlcmUgdXQgYXQgbml2w6VlbmUgZXIgYmxpdHQgZmFybGlnXG4gICAgICAgICAgICBow7h5ZSA8ZW0+bcOlPC9lbT4gZGVyZSBzaSBmcmEgdGlsIG9wcGRyYWdzbGVkZXJlbiBzw6Ugdmkga2FuXG4gICAgICAgICAgICBmw6UgdXQgYXN0cm9uYXV0ZW4hXG4gICAgICAgIDwvcD5cblxuXG4gICAgICAgIDxwPlxuICAgICAgICAgICAgRXIgb3BwZHJhZ2V0IGZvcnN0w6V0dD9cbiAgICAgICAgPC9wPlxuICAgIDwvZGl2PixcblxuICAgIGFzdHJvbmF1dF9pbnRybzogPGRpdj5cbiAgICAgICAgPHA+XG4gICAgICAgICAgICBEZXJlcyBqb2JiIGVyIMOlIHNpa3JlIGF0IGRldCBlciBub2sgb2tzeWdlbiBmb3Igw6UgZ2plbm5vbWbDuHJlIG9wcGRyYWdldC4gSGVyIGVyIGRldCB2aWt0aWcgw6UgamV2bmxpZ1xuICAgICAgICAgICAgc2pla2tlIGh2b3IgZm9ydCBhc3Ryb25hdXQgU3RlaWdlbiBwdXN0ZXIgb2cgaHZvciBmb3J0IGhqZXJ0ZXQgaGVubmVzIHNsw6VyLlxuICAgICAgICA8L3A+XG5cbiAgICAgICAgPHA+RmlubmVyIGRlcmUgdXQgYXQgYXN0cm9uYXV0IFN0ZWlnZW4gaWtrZSB2aWwgaGEgbm9rIGx1ZnQgdGlsXG4gICAgICAgICAgICDDpSBnamVubm9tZsO4cmUgb3BwZHJhZ2V0IDxlbT5tw6U8L2VtPiBkZXJlIHNpIGZyYSB0aWxcbiAgICAgICAgICAgIG9wcGRyYWdzbGVkZXJlbiBzw6Ugdmkga2FuIGF2YnJ5dGUgaSB0aWRlLlxuICAgICAgICA8L3A+XG4gICAgPC9kaXY+LFxuXG4gICAgY29tbXVuaWNhdGlvbl9pbnRybzogPGRpdj5cbiAgICAgICAgPHA+RGVyZXMgbcOlbCBlciDDpSBob2xkZSBrb21tdW5pa2Fzam9uZW4gb3BwZSwgb2cga29tbXVuaXNlcmUgbWVkIG9wcGRyYWdza29vcmRpbmF0b3Igb2cgYXN0cm9uYXV0ZW4uIE9tXG4gICAgICAgICAgICBuw7hkdmVuZGlnIG3DpSBkZXJlIGthbnNramUgYnl0dGUgdGlsIGVuIGFubmVuIGtvbW11bmlrYXNqb25zc2F0ZWxpdHQuXG4gICAgICAgIDwvcD5cblxuICAgICAgICA8cD5EZXJlIHNrYWwgb2dzw6UgaW5mb3JtZXJlIGFzdHJvbmF1dGVuIG9tIGV2ZW50dWVsbGUgYmVza2plZGVyIGZyYSBBbmRhw7h5YSBTcGFjZSBDZW50ZXIgKEFTQyksIG9nXG4gICAgICAgICAgICBsaWtlbGVkZXMgaW5mb3JtZXJlIEFTQyBvbSBoZW5kZWxzZXIgZWxsZXIgYmVza2plZGVyIGZyYSBhc3Ryb25hdXRlbi48L3A+XG5cbiAgICA8L2Rpdj4sXG5cbiAgICBzZWN1cml0eV9pbnRybzogPGRpdj5cbiAgICAgICAgPHA+XG4gICAgICAgICAgICBEZXJlcyBob3ZlZG9wcGdhdmUgZXIgw6UgaW5uaGVudGUgaW5mb3JtYXNqb24gZnJhIGRlIGZvcnNramVsbGlnZSBncnVwcGVuZSBvZyBiZXN0ZW1tZSBkZXJlIGZvciBodmFcbiAgICAgICAgICAgIHNvbSBza2FsIGdqw7hyZXMuIEhlciBtw6UgZGVyZSBzYW1hcmJlaWRlIGdvZHQgbWVkIG9wcGRyYWdza29vcmRpbmF0b3JlbiAoPGVtPm1pc3Npb24gY29tbWFuZGVyPC9lbT4pIVxuICAgICAgICA8L3A+XG5cbiAgICAgICAgPHA+XG4gICAgICAgICAgICBEZXJlIG3DpSBvZ3PDpSBob2xkZSBldCDDuHllIHDDpSBpbmRpa2F0b3JlbiBzb20gc2llciBvbSBkZXQgZXIgbm9rIGx1ZnQgdGlsIMOlIGdqZW5ub21mw7hyZSBvcHBkcmFnZXQsIHNhbXRcbiAgICAgICAgICAgIHNqZWtrZSBvbSBrYXJib25kaW9rc2lkc2tydWJiZXJlbiBtw6Ugc2tpZnRlcyBzbGlrIGF0IGFzdHJvbmF1dGVuIGlra2Uga3ZlbGVzLlxuICAgICAgICA8L3A+XG5cbiAgICAgICAgPHA+XG4gICAgICAgICAgICBEZXJlcyBtw6Ugb2dzw6Ugc2pla2tlIGF0IGtvbW11bmlrYXNqb25zc3RhdHVzZW4gb2cgZGF0YWt2YWxpdGV0ZW4gZXIgZ29kIG7DpXIgcmVwYXJhc2pvbmVuIGVyIHV0ZsO4cnQuXG4gICAgICAgIDwvcD5cbiAgICA8L2Rpdj5cblxuXG59OyIsIm1vZHVsZS5leHBvcnRzID0ge1xuICAgIHJlbmRlcigpe1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0RVTU1ZX1JFTkRFUi4gVGhpcyByZWFjdCBjb21wb25lbnQgaXMgbm90IGZvciBwcmVzZW50YXRpb25hbCBwdXJwb3NlcycpO1xuICAgIH1cbn07XG4iLCJjb25zdCBSZWFjdCA9IHJlcXVpcmUoJ3JlYWN0Jyk7XG5cbnZhciBwbGF5ZXI7XG5mdW5jdGlvbiBvbllvdVR1YmVJZnJhbWVBUElSZWFkeSgpIHtcbiAgICBjb25zb2xlLmxvZygnb25Zb3VUdWJlSWZyYW1lQVBJUmVhZHknKTtcbiAgICBwbGF5ZXIgPSBuZXcgWVQuUGxheWVyKCdwbGF5ZXInLCB7XG4gICAgICAgIGV2ZW50czoge1xuICAgICAgICAgICAgJ29uUmVhZHknOiBvblBsYXllclJlYWR5XG4gICAgICAgIH1cbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gcGxheVZpZGVvKCl7XG4gICAgcGxheWVyLnNlZWtUbyg5Nik7XG4gICAgcGxheWVyLnBsYXlWaWRlbygpO1xuXG4gICAgLy8gc3RvcCB2aWRlbyBhZnRlciB0ZW4gc2Vjb25kc1xuICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICBwbGF5ZXIuc3RvcFZpZGVvKHBsYXllcilcbiAgICAgICAgcGxheVZpZGVvKCk7XG4gICAgfSwxMEUzKTtcbn1cblxuZnVuY3Rpb24gb25QbGF5ZXJSZWFkeShldmVudCkge1xuICAgIC8vZXZlbnQudGFyZ2V0Lm11dGUoKTtcbiAgICBwbGF5ZXIubXV0ZSgpO1xuICAgIHBsYXlWaWRlbygpO1xufVxuXG5cbndpbmRvdy5vbllvdVR1YmVJZnJhbWVBUElSZWFkeSA9IG9uWW91VHViZUlmcmFtZUFQSVJlYWR5O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblxuICAgIC8qIGh0dHBzOi8vZGV2ZWxvcGVycy5nb29nbGUuY29tL3lvdXR1YmUvaWZyYW1lX2FwaV9yZWZlcmVuY2UjR2V0dGluZ19TdGFydGVkICovXG4gICAgY29tcG9uZW50RGlkTW91bnQoKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdjb21wb25lbnREaWRNb3VudCcpO1xuICAgICAgICB2YXIgdGFnID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc2NyaXB0Jyk7XG5cbiAgICAgICAgdGFnLnNyYyA9IFwiaHR0cHM6Ly93d3cueW91dHViZS5jb20vaWZyYW1lX2FwaVwiO1xuICAgICAgICBkb2N1bWVudC5oZWFkLmFwcGVuZENoaWxkKHRhZyk7XG4gICAgfSxcblxuICAgIHJlbmRlcigpIHtcbiAgICAgICAgdmFyIHJpY2tSb2xsZWQgPSAnaHR0cDovL3d3dy55b3V0dWJlLmNvbS9lbWJlZC9vSGc1U0pZUkhBMD9hdXRvcGxheT0xJztcbiAgICAgICAgdmFyIG9yaWdpbiA9IGxvY2F0aW9uLnByb3RvY29sICsgJy8vJyArIGxvY2F0aW9uLmhvc3RcbiAgICAgICAgdmFyIHNvbGFyU3Rvcm0gPSAnaHR0cDovL3d3dy55b3V0dWJlLmNvbS9lbWJlZC9EVTRocHNpc3REaz8mc3RhcnQ9OTYmZW5hYmxlanNhcGk9MSZvcmlnaW49JyArIG9yaWdpbjtcbiAgICAgICAgdmFyIHZpZGVvID0gc29sYXJTdG9ybTtcblxuICAgICAgICAvL3JldHVybiA8ZGl2IC8+XG4gICAgICAgIHJldHVybiAoXG4gICAgICAgIDxpZnJhbWUgaWQ9J3BsYXllcidcbiAgICAgICAgICAgICAgICAgICAgc3R5bGU9e3sgcG9zaXRpb246J2Fic29sdXRlJywgdG9wOiAwLCByaWdodDogMCwgd2lkdGg6XCIxMDAlXCIsIGhlaWdodDpcIjEwMCVcIn19XG4gICAgICAgICAgICAgICAgICAgIHNyYz17dmlkZW99XG4gICAgICAgICAgICAgICAgICAgIGZyYW1lQm9yZGVyPVwiMFwiIGFsbG93RnVsbFNjcmVlbiAvPlxuICAgICAgICApO1xuICAgIH1cblxufSk7IiwiY29uc3QgUmVhY3QgPSByZXF1aXJlKCdyZWFjdCcpO1xuY29uc3QgUm91dGVyID0gcmVxdWlyZSgncmVhY3Qtcm91dGVyJyk7XG5jb25zdCBMaW5rID0gUm91dGVyLkxpbms7XG5cbnZhciBIZWFkZXIgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cbiAgICByZW5kZXIoKSB7XG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPSdyb3cnPlxuXG4gICAgICAgICAgICAgICAgICAgIDxoZWFkZXIgaWQ9J25hcm9tLWhlYWRlcicgPlxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8aW1nIGNsYXNzTmFtZSA9ICduYXJvbS1sb2dvLWltZycgIHNyYz0nL2ltYWdlcy9sb2dvLnBuZycgLz5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBOQVJPTSBlLU1pc3Npb24gcHJvdG90eXBlXG4gICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPC9oZWFkZXI+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgICAgICA8ZGl2IGlkPSdtYWluLWhlYWRlcicgY2xhc3NOYW1lPSdyb3cnID5cbiAgICAgICAgICAgICAgICAgICAgPExpbmsgdG89Jy8nID5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxoZWFkZXIgPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxoMSBjbGFzc05hbWUgPSAnJz5VbmRlciBlbiBzb2xzdG9ybTwvaDE+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2hlYWRlcj5cbiAgICAgICAgICAgICAgICAgICAgPC9MaW5rPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKTtcbiAgICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBIZWFkZXI7IiwiLyoqXG4gKiBUSElTIERFU0lHTiBPTkxZIFNVUFBPUlRTIE9ORSBDSEFSVCBBUyBUSEVZICpTSEFSRSogU1RBVEVcbiAqIEZvciBhIG5vbi1zdHVwaWQgZGVzaWduLCBkbyBzb21ldGhpbmcgbGlrZSB0aGVcbiAqIGltcGxlbWVudGF0aW9uIGluIHRoZSBhcnRpY2xlIGJ5IE5pY29sYXMgSGVyeTpcbiAqIGh0dHA6Ly9uaWNvbGFzaGVyeS5jb20vaW50ZWdyYXRpbmctZDNqcy12aXN1YWxpemF0aW9ucy1pbi1hLXJlYWN0LWFwcFxuICpcbiAqIENoYXJ0IGNvZGUgbW9yZSBvciBsZXNzIGNvcGllZCBmcm9tIHRoZSBwcm90b3R5cGUgYnkgTGVvIE1hcnRpbiBXZXN0YnlcbiAqL1xuY29uc3QgUmVhY3QgPSByZXF1aXJlKCdyZWFjdCcpO1xuY29uc3QgQW1DaGFydHMgPSByZXF1aXJlKCdhbWNoYXJ0cycpO1xuY29uc3QgeyByYW5kb21JbnQgfSA9IHJlcXVpcmUoJy4uL3V0aWxzJyk7XG5jb25zdCBIZWFydFN0b3JlID0gcmVxdWlyZSgnLi4vc3RvcmVzL2hlYXJ0LXJhdGUtc3RvcmUnKTtcblxudmFyIGNoYXJ0O1xudmFyIGhlYXJ0UmF0ZVNhbXBsZXMgPSBbXTtcblxudmFyIGhlYXJ0UmF0ZUJ1ZmZlcjtcbnZhciBoZWFydFJhdGVCdWZmZXJJbmRleDtcbnZhciBtc1VudGlsTmV4dEhlYXJ0UmF0ZUJ1ZmZlckZyYW1lO1xuXG4vL01pbGxpdm9sdHMgZGlzcGxheWVkIG9uIHRoZSBZIGF4aXMgb2YgdGhlIEVDRyBncmFwaFxudmFyIGhpZ2hNViA9IDE7XG52YXIgbG93TVYgPSAwO1xuXG52YXIgY2hhcnRVcGRhdGVyO1xuXG5mdW5jdGlvbiBpbml0Q2hhcnQoZG9tRWxlbWVudCkge1xuXG4gICAgY2hhcnQgPSBuZXcgQW1DaGFydHMuQW1TZXJpYWxDaGFydCgpO1xuXG4gICAgY2hhcnQubWFyZ2luVG9wID0gMjA7XG4gICAgY2hhcnQubWFyZ2luUmlnaHQgPSAxMDtcbiAgICBjaGFydC5hdXRvTWFyZ2luT2Zmc2V0ID0gNTtcbiAgICBjaGFydC5kYXRhUHJvdmlkZXIgPSBoZWFydFJhdGVTYW1wbGVzO1xuICAgIGNoYXJ0LmNhdGVnb3J5RmllbGQgPSBcInRpbWVzdGFtcFwiO1xuXG4gICAgLy9YIEF4aXNcbiAgICB2YXIgY2F0ZWdvcnlBeGlzID0gY2hhcnQuY2F0ZWdvcnlBeGlzO1xuICAgIGNhdGVnb3J5QXhpcy5kYXNoTGVuZ3RoID0gMTtcbiAgICBjYXRlZ29yeUF4aXMuZ3JpZEFscGhhID0gMC4xMDtcbiAgICBjYXRlZ29yeUF4aXMuYXhpc0NvbG9yID0gXCIjREFEQURBXCI7XG4gICAgY2F0ZWdvcnlBeGlzLmZvcmNlU2hvd0ZpZWxkID0gXCJmb3JjZVNob3dcIjtcbiAgICAvL2NhdGVnb3J5QXhpcy50aXRsZSA9IFwiU2Vjb25kc1wiO1xuXG4gICAgLy9IaWRlIGV2ZXJ5IGxhYmVsIHRoYXQgaXMgbm90IGV4cGxpY2l0bHkgc2hvd25cbiAgICBjYXRlZ29yeUF4aXMubGFiZWxGdW5jdGlvbiA9IGZ1bmN0aW9uICh2YWx1ZVRleHQsIG9iamVjdCkge1xuICAgICAgICBpZiAob2JqZWN0LmZvcmNlU2hvdykge1xuICAgICAgICAgICAgcmV0dXJuIHZhbHVlVGV4dDtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICAvL1kgQXhpc1xuICAgIHZhciB2YWx1ZUF4aXMgPSBuZXcgQW1DaGFydHMuVmFsdWVBeGlzKCk7XG4gICAgdmFsdWVBeGlzLmF4aXNBbHBoYSA9IDAuMjtcbiAgICB2YWx1ZUF4aXMuZGFzaExlbmd0aCA9IDE7XG4gICAgdmFsdWVBeGlzLm1pbmltdW0gPSBsb3dNVjtcbiAgICB2YWx1ZUF4aXMubWF4aW11bSA9IGhpZ2hNViAqIDEuMTtcbiAgICB2YWx1ZUF4aXMudGl0bGUgPSBcIm1WXCI7XG4gICAgY2hhcnQuYWRkVmFsdWVBeGlzKHZhbHVlQXhpcyk7XG5cbiAgICAvL0xpbmVcbiAgICB2YXIgZ3JhcGggPSBuZXcgQW1DaGFydHMuQW1HcmFwaCgpO1xuXG4gICAgZ3JhcGgudmFsdWVGaWVsZCA9IFwibVZcIjtcbiAgICBncmFwaC50eXBlID0gXCJzbW9vdGhlZExpbmVcIjtcbiAgICBncmFwaC5saW5lVGhpY2tuZXNzID0gMTtcbiAgICBncmFwaC5saW5lQ29sb3IgPSBcIiNiNTAzMGRcIjtcbiAgICBjaGFydC5hZGRHcmFwaChncmFwaCk7XG5cbiAgICBjaGFydC53cml0ZShkb21FbGVtZW50KTtcbn1cblxuLy9GaWxscyB0aGUgaGVhcnQgcmF0ZSBidWZmZXIgd2l0aCBzYW1wbGVzIGZyb20gdGhlIHNwZWNpZmllZCByYW5nZVxuLy9UaGUgaGVhcnQgcmF0ZSBidWZmZXIgY29udGFpbnMgdHdpY2UgYXMgbWFueSBzYW1wbGVzIGFzIHRoZSBoZWFydCByYXRlIGNoYXJ0IGFuZCBpcyB1c2VkIHRvIGFuaW1hdGUgdGhlIGNoYXJ0XG5mdW5jdGlvbiBjcmVhdGVIZWFydFJhdGVTYW1wbGVzKG1pbiwgbWF4KSB7XG4gICAgaGVhcnRSYXRlQnVmZmVyID0gW107XG4gICAgaGVhcnRSYXRlQnVmZmVySW5kZXggPSAwO1xuICAgIG1zVW50aWxOZXh0SGVhcnRSYXRlQnVmZmVyRnJhbWUgPSAwO1xuXG4gICAgdmFyIGJlYXRzUGVyTWludXRlID0gcmFuZG9tSW50KG1pbiwgbWF4KTtcbiAgICB2YXIgbXNCZXR3ZWVuQmVhdHMgPSA2MCAqIDEwMDAgLyBiZWF0c1Blck1pbnV0ZTtcbiAgICB2YXIgbXNVbnRpbE5leHRCZWF0ID0gbXNCZXR3ZWVuQmVhdHM7XG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8PSAyMDA7IGkrKykge1xuICAgICAgICB2YXIgbVY7XG5cbiAgICAgICAgaWYgKG1zVW50aWxOZXh0QmVhdCA8PSAwKSB7XG4gICAgICAgICAgICBtViA9IGhpZ2hNVjtcbiAgICAgICAgICAgIG1zVW50aWxOZXh0QmVhdCA9IG1zQmV0d2VlbkJlYXRzO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgbVYgPSBNYXRoLnJhbmRvbSgpICogMC4yO1xuICAgICAgICB9XG5cbiAgICAgICAgLy9UaGUgcmVzb2x1dGlvbiBvZiB0aGUgY2hhcnQgaXMgdGVuIHNhbXBsZXMgcGVyIHNlY29uZFxuICAgICAgICBoZWFydFJhdGVCdWZmZXIucHVzaCh7dGltZXN0YW1wOiBpIC8gMTAsIG1WOiBtVn0pO1xuICAgICAgICBtc1VudGlsTmV4dEJlYXQgLT0gNTA7XG4gICAgfVxufVxuXG4vL0FuaW1hdGVzIHRoZSAgaGVhcnQgcmF0ZSBjaGFydHNcbmZ1bmN0aW9uIHN0YXJ0RXZlbnRMb29wKCkge1xuICAgIHZhciBzdGFydFRpbWUgPSBEYXRlLm5vdygpO1xuICAgIHZhciBtc1NpbmNlTGFzdFVwZGF0ZSA9IDA7XG4gICAgdmFyIG1zU2luY2VTdGFydCA9IDA7XG4gICAgdmFyIHVwZGF0ZUZyZXF1ZW5jeSA9IDQwMDtcbiAgICBzdG9wRXZlbnRMb29wKCk7XG5cbiAgICBjaGFydFVwZGF0ZXIgPSBzZXRJbnRlcnZhbChmdW5jdGlvbiAoKSB7XG4gICAgICAgIG1zU2luY2VMYXN0VXBkYXRlID0gRGF0ZS5ub3coKSAtIHN0YXJ0VGltZSAtIG1zU2luY2VTdGFydDtcbiAgICAgICAgbXNVbnRpbE5leHRIZWFydFJhdGVCdWZmZXJGcmFtZSAtPSBtc1NpbmNlTGFzdFVwZGF0ZTtcbiAgICAgICAgbXNTaW5jZVN0YXJ0ID0gRGF0ZS5ub3coKSAtIHN0YXJ0VGltZTtcblxuICAgICAgICBpZiAobXNVbnRpbE5leHRIZWFydFJhdGVCdWZmZXJGcmFtZSA8PSAwKSB7XG4gICAgICAgICAgICB2YXIgZnJhbWVzTWlzc2VkID0gTWF0aC5mbG9vcigobXNVbnRpbE5leHRIZWFydFJhdGVCdWZmZXJGcmFtZSAqIC0xKSAvIDEwMCArIDEpO1xuXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGZyYW1lc01pc3NlZDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgaGVhcnRSYXRlQnVmZmVySW5kZXgrKztcblxuICAgICAgICAgICAgICAgIGlmIChoZWFydFJhdGVCdWZmZXJJbmRleCA+PSBoZWFydFJhdGVCdWZmZXIubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgIGhlYXJ0UmF0ZUJ1ZmZlckluZGV4ID0gMDtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBoZWFydFJhdGVTYW1wbGVzLnB1c2goaGVhcnRSYXRlQnVmZmVyW2hlYXJ0UmF0ZUJ1ZmZlckluZGV4XSk7XG5cbiAgICAgICAgICAgICAgICAvL1doZW4gdGhlIGNoYXJ0IGdyb3dzIHRvIDEwIHNlY29uZHMsIHN0YXJ0IGN1dHRpbmcgb2ZmIHRoZSBvbGRlc3Qgc2FtcGxlIHRvIGdpdmUgdGhlIGNoYXJ0IGEgc2xpZGluZyBlZmZlY3RcbiAgICAgICAgICAgICAgICBpZiAoaGVhcnRSYXRlU2FtcGxlcy5sZW5ndGggPiAxMDApIHtcbiAgICAgICAgICAgICAgICAgICAgaGVhcnRSYXRlU2FtcGxlcy5zaGlmdCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgbXNVbnRpbE5leHRIZWFydFJhdGVCdWZmZXJGcmFtZSA9IDEwMDtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vQWx3YXlzIHNob3cgZnJvbSAwIHRvIDEwIHNlY29uZHMgb24gdGhlIFggYXhpc1xuICAgICAgICBpZiAoaGVhcnRSYXRlU2FtcGxlcy5sZW5ndGggPj0gMTAwKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGhlYXJ0UmF0ZVNhbXBsZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBoZWFydFJhdGVTYW1wbGVzW2ldLnRpbWVzdGFtcCA9IE1hdGguZmxvb3IoaSAvIChoZWFydFJhdGVTYW1wbGVzLmxlbmd0aCAtIDEpICogMTApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy9Pbmx5IHNob3cgZXZlcnkgNXRoIHRpbWVzdGFtcFxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGhlYXJ0UmF0ZVNhbXBsZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGhlYXJ0UmF0ZVNhbXBsZXNbaV0uZm9yY2VTaG93ID0gaGVhcnRSYXRlU2FtcGxlc1tpXS50aW1lc3RhbXAgJSA1ID09IDAgJiYgKGkgPT0gMCB8fCBoZWFydFJhdGVTYW1wbGVzW2kgLSAxXS50aW1lc3RhbXAgJSA1ICE9IDApO1xuICAgICAgICB9XG5cbiAgICAgICAgY2hhcnQudmFsaWRhdGVEYXRhKCk7XG4gICAgfSwgdXBkYXRlRnJlcXVlbmN5KTtcbn1cblxuZnVuY3Rpb24gc3RvcEV2ZW50TG9vcCgpIHtcbiAgICBjbGVhckludGVydmFsKGNoYXJ0VXBkYXRlcik7XG4gICAgaGVhcnRSYXRlU2FtcGxlcy5sZW5ndGggPSAwO1xuICAgIGNoYXJ0LnZhbGlkYXRlRGF0YSgpO1xufVxuXG5jb25zdCBIZWFydFJhdGVDaGFydCA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblxuICAgIHN0YXRpY3M6IHt9LFxuXG4gICAgcHJvcFR5cGVzOiB7XG4gICAgICAgIGhlaWdodDogUmVhY3QuUHJvcFR5cGVzLm51bWJlci5pc1JlcXVpcmVkLFxuICAgICAgICB3aWR0aDogUmVhY3QuUHJvcFR5cGVzLm51bWJlclxuICAgIH0sXG5cbiAgICBtaXhpbnM6IFtdLFxuXG4gICAgZ2V0SW5pdGlhbFN0YXRlKCl7XG4gICAgICAgIHJldHVybiB0aGlzLl9nZXRDaGFydFN0YXRlKCk7XG4gICAgfSxcblxuICAgIGNvbXBvbmVudFdpbGxNb3VudCgpIHtcbiAgICAgICAgdGhpcy5fdXBkYXRlQ2hhcnQoKTtcbiAgICAgICAgSGVhcnRTdG9yZS5hZGRDaGFuZ2VMaXN0ZW5lcigoKT0+IHRoaXMuX3VwZGF0ZUNoYXJ0KCkpO1xuICAgIH0sXG5cbiAgICBjb21wb25lbnREaWRNb3VudCgpIHtcbiAgICAgICAgdmFyIGVsID0gUmVhY3QuZmluZERPTU5vZGUodGhpcyk7XG4gICAgICAgIGluaXRDaGFydChlbCk7XG4gICAgICAgIHN0YXJ0RXZlbnRMb29wKCk7XG4gICAgfSxcblxuICAgIGNvbXBvbmVudFdpbGxSZWNlaXZlUHJvcHMoKSB7XG4gICAgfSxcblxuICAgIGNvbXBvbmVudFdpbGxVbm1vdW50KCkge1xuICAgICAgICBjaGFydCAmJiBjaGFydC5jbGVhcigpO1xuICAgICAgICBzdG9wRXZlbnRMb29wKCk7XG4gICAgfSxcblxuICAgIGNvbXBvbmVudERpZFVubW91bnQoKSB7XG4gICAgICAgIGNoYXJ0ID0gbnVsbDtcbiAgICB9LFxuXG4gICAgY29tcG9uZW50RGlkVXBkYXRlKCkge1xuICAgIH0sXG5cbiAgICAvLyB0aGlzIGNoYXJ0IGlzIHJlc3BvbnNpYmxlIGZvciBkcmF3aW5nIGl0c2VsZlxuICAgIHNob3VsZENvbXBvbmVudFVwZGF0ZSgpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH0sXG5cbiAgICAvLyBQcml2YXRlIG1ldGhvZHNcbiAgICBfdXBkYXRlQ2hhcnQoKXtcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh0aGlzLl9nZXRDaGFydFN0YXRlKCkpO1xuICAgICAgICBjcmVhdGVIZWFydFJhdGVTYW1wbGVzKHRoaXMuc3RhdGUubWluLCB0aGlzLnN0YXRlLm1heCk7XG4gICAgfSxcblxuICAgIF9nZXRDaGFydFN0YXRlKCl7XG4gICAgICAgIHJldHVybiBIZWFydFN0b3JlLmdldFN0YXRlKCk7XG4gICAgfSxcblxuICAgIF9vbkNoYW5nZSgpe1xuXG4gICAgfSxcblxuICAgIHJlbmRlcigpIHtcblxuICAgICAgICAvLyBpZiB5b3UgZG9uJ3Qgc3BlY2lmeSB3aWR0aCBpdCB3aWxsIG1heCBvdXQgdG8gMTAwJSAod2hpY2ggaXMgb2spXG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICA8ZGl2XG4gICAgICAgICAgICAgICAgc3R5bGU9e3t3aWR0aDogdGhpcy5wcm9wcy53aWR0aCArICdweCcsIGhlaWdodCA6IHRoaXMucHJvcHMuaGVpZ2h0KyAncHgnfX1cbiAgICAgICAgICAgICAgICBjbGFzc05hbWU9e3RoaXMucHJvcHMuY2xhc3NOYW1lfVxuICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICk7XG4gICAgfVxuXG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBIZWFydFJhdGVDaGFydDtcbiIsImNvbnN0IFJlYWN0ID0gcmVxdWlyZSgncmVhY3QnKTtcbmNvbnN0IFJvdXRlciA9IHJlcXVpcmUoJ3JlYWN0LXJvdXRlcicpO1xuY29uc3QgTGluayA9IFJvdXRlci5MaW5rO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcbiAgICByZW5kZXIgKCkge1xuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgICA8aDM+VmVsZyBsYWc8L2gzPlxuICAgICAgICAgICAgICAgIDx1bD5cbiAgICAgICAgICAgICAgICAgICAgPGxpPjxMaW5rIHRvPVwidGVhbS1yb290XCIgcGFyYW1zPXt7IHRlYW1JZCA6ICdzY2llbmNlJ319PkZvcnNrbmluZ3NncnVwcGE8L0xpbms+PC9saT5cbiAgICAgICAgICAgICAgICAgICAgPGxpPjxMaW5rIHRvPVwidGVhbS1yb290XCIgcGFyYW1zPXt7IHRlYW1JZCA6ICdhc3Ryb25hdXQnfX0+QXN0cm9uYXV0Z3J1cHBhPC9MaW5rPjwvbGk+XG4gICAgICAgICAgICAgICAgICAgIDxsaT48TGluayB0bz1cInRlYW0tcm9vdFwiIHBhcmFtcz17eyB0ZWFtSWQgOiAnc2VjdXJpdHknfX0+U2lra2VyaGV0c2dydXBwYTwvTGluaz48L2xpPlxuICAgICAgICAgICAgICAgICAgICA8bGk+PExpbmsgdG89XCJ0ZWFtLXJvb3RcIiBwYXJhbXM9e3sgdGVhbUlkIDogJ2NvbW11bmljYXRpb24nfX0+S29tbXVuaWthc2pvbnNncnVwcGE8L0xpbms+PC9saT5cbiAgICAgICAgICAgICAgICA8L3VsPlxuXG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKTtcbiAgICB9XG59KTtcblxuXG4iLCJjb25zdCBSZWFjdCA9IHJlcXVpcmUoJ3JlYWN0Jyk7XG5jb25zdCBkaWFsb2dzID0gcmVxdWlyZSgnLi9kaWFsb2dzLnJlYWN0Jyk7XG5jb25zdCB7IGNsZWFuUm9vdFBhdGggfSA9IHJlcXVpcmUoJy4uL3V0aWxzJyk7XG5cbmNvbnN0IFJvdXRlU3RvcmUgPSByZXF1aXJlKCcuLi9zdG9yZXMvcm91dGUtc3RvcmUnKTtcbnZhciBJbnRyb1N0b3JlID0gcmVxdWlyZSgnLi4vc3RvcmVzL2ludHJvZHVjdGlvbi1zdG9yZScpO1xuXG4gY29uc3QgSW50cm9kdWN0aW9uU2NyZWVuID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXG4gICAgbWl4aW5zOiBbXSxcblxuICAgICBjb250ZXh0VHlwZXM6IHtcbiAgICAgICAgIHJvdXRlcjogUmVhY3QuUHJvcFR5cGVzLmZ1bmNcbiAgICAgfSxcblxuICAgIHN0YXRpY3M6IHtcbiAgICAgICAgd2lsbFRyYW5zaXRpb25Ubyh0cmFuc2l0aW9uKSB7XG4gICAgICAgICAgICB2YXIgdGVhbUlkID0gY2xlYW5Sb290UGF0aCh0cmFuc2l0aW9uLnBhdGgpO1xuXG4gICAgICAgICAgICBpZiAoSW50cm9TdG9yZS5pc0ludHJvZHVjdGlvblJlYWQodGVhbUlkKSkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdJbnRyb2R1Y3Rpb24gcmVhZCBlYXJsaWVyJyk7XG4gICAgICAgICAgICAgICAgdHJhbnNpdGlvbi5yZWRpcmVjdCgndGVhbS10YXNrJywge3Rhc2tJZDogJ3NhbXBsZScsIHRlYW1JZCA6IHRlYW1JZH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSxcblxuICAgIF9oYW5kbGVDbGljaygpIHtcbiAgICAgICAgY29uc3QgTWlzc2lvbkFjdGlvbkNyZWF0b3JzID0gcmVxdWlyZSgnLi4vYWN0aW9ucy9NaXNzaW9uQWN0aW9uQ3JlYXRvcnMnKTtcblxuICAgICAgICB2YXIgdGVhbUlkID0gUm91dGVTdG9yZS5nZXRUZWFtSWQoKTtcbiAgICAgICAgTWlzc2lvbkFjdGlvbkNyZWF0b3JzLmludHJvV2FzUmVhZCh0ZWFtSWQpO1xuICAgICAgICB0aGlzLmNvbnRleHQucm91dGVyLnRyYW5zaXRpb25UbygndGVhbS10YXNrJywge3Rhc2tJZCA6ICdzYW1wbGUnLCB0ZWFtSWQgOiB0ZWFtSWQgfSlcbiAgICB9LFxuXG4gICAgcmVuZGVyKCkge1xuICAgICAgICB2YXIgdGVhbUlkPSBSb3V0ZVN0b3JlLmdldFRlYW1JZCgpO1xuICAgICAgICB2YXIgaW50cm9UZXh0ID0gZGlhbG9nc1t0ZWFtSWQgKyAnX2ludHJvJ10gfHwgPHA+TWFuZ2xlciBvcHBkcmFnPC9wPjtcblxuICAgICAgICByZXR1cm4gKDxkaXYgY2xhc3NOYW1lID0gJ3JvdyBqdW1ib3Ryb24gaW50cm9zY3JlZW4nPlxuICAgICAgICAgICAgPGgyPk3DpWwgZm9yIG9wcGRyYWdldDwvaDI+XG5cbiAgICAgICAgICAgIHsgaW50cm9UZXh0IH1cblxuICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgIGNsYXNzTmFtZSA9ICdidG4gYnRuLXByaW1hcnkgYnRuLWxnJ1xuICAgICAgICAgICAgICAgIG9uQ2xpY2s9e3RoaXMuX2hhbmRsZUNsaWNrfVxuICAgICAgICAgICAgPkplZyBmb3JzdMOlcjwvYnV0dG9uPlxuICAgICAgICA8L2Rpdj4pXG5cbiAgICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBJbnRyb2R1Y3Rpb25TY3JlZW47XG4iLCJjb25zdCBSZWFjdCA9IHJlcXVpcmUoJ3JlYWN0Jyk7XG5jb25zdCBhY3Rpb25zID0gcmVxdWlyZSgnLi4vYWN0aW9ucy9NZXNzYWdlQWN0aW9uQ3JlYXRvcnMnKTtcblxudmFyIExpc3RNZXNzYWdlV3JhcHBlciA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblxuICAgIHByb3BUeXBlczoge1xuICAgICAgICBsZXZlbDogUmVhY3QuUHJvcFR5cGVzLnN0cmluZy5pc1JlcXVpcmVkLFxuICAgICAgICB0ZXh0OiBSZWFjdC5Qcm9wVHlwZXMuc3RyaW5nLmlzUmVxdWlyZWQsXG4gICAgICAgIGlkOiBSZWFjdC5Qcm9wVHlwZXMuc3RyaW5nLmlzUmVxdWlyZWRcbiAgICB9LFxuXG4gICAgcmVuZGVyKCkge1xuICAgICAgICBsZXQgYnV0dG9uO1xuXG4gICAgICAgIGlmICh0aGlzLnByb3BzLmRpc21pc3NhYmxlKSB7XG4gICAgICAgICAgICBidXR0b24gPSAoXG4gICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiY2xvc2VcIlxuICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBhY3Rpb25zLnJlbW92ZU1lc3NhZ2UodGhpcy5wcm9wcy5pZCl9XG4gICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICA8c3Bhbj7Dlzwvc3Bhbj5cbiAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgPGxpIGNsYXNzTmFtZT17ICdhbGVydCBhbGVydC1kaXNtaXNzaWJsZSBhbGVydC0nICsgdGhpcy5wcm9wcy5sZXZlbH0gPlxuICAgICAgICAgICAgeyBidXR0b24gfVxuICAgICAgICAgICAge3RoaXMucHJvcHMudGV4dH1cbiAgICAgICAgICAgIDwvbGk+XG4gICAgICAgICk7XG4gICAgfVxufSk7XG5cbnZhciBNZXNzYWdlTGlzdCA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblxuICAgIHJlbmRlcigpIHtcbiAgICAgICAgdmFyIGhpZGRlbiA9IHRoaXMucHJvcHMubWVzc2FnZXMubGVuZ3RoID09PSAwID8gJ2hpZGUnIDogJyc7XG4gICAgICAgIHZhciBjbGFzc2VzID0gKHRoaXMucHJvcHMuY2xhc3NOYW1lIHx8ICcnKSArICcgbWVzc2FnZWJveCAnICsgaGlkZGVuO1xuXG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICA8dWwgY2xhc3NOYW1lID0geyBjbGFzc2VzIH0+XG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgdGhpcy5wcm9wcy5tZXNzYWdlcy5tYXAoKG1zZykgPT4ge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gKDxMaXN0TWVzc2FnZVdyYXBwZXIga2V5PXttc2cuaWR9IHsuLi5tc2d9IC8+KTtcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgPC91bD5cbiAgICAgICAgKTtcbiAgICB9XG5cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IE1lc3NhZ2VMaXN0O1xuIiwiY29uc3QgUmVhY3QgPSByZXF1aXJlKCdyZWFjdCcpO1xuY29uc3QgTGluayA9IHJlcXVpcmUoJ3JlYWN0LXJvdXRlcicpLkxpbms7XG5jb25zdCBNaXNzaW9uU3RvcmUgPSByZXF1aXJlKCcuLi9zdG9yZXMvbWlzc2lvbi1zdGF0ZS1zdG9yZScpO1xuY29uc3QgTWlzc2lvblRpbWVyID0gcmVxdWlyZSgnLi9taXNzaW9uLXRpbWVyLnJlYWN0Jyk7XG5jb25zdCBFdmVudFN0b3JlID0gcmVxdWlyZSgnLi4vc3RvcmVzL2V2ZW50LXN0b3JlJyk7XG5jb25zdCB1dGlscyA9IHJlcXVpcmUoJy4uL3V0aWxzJyk7XG5jb25zdCBnZXRNaXNzaW9uQUMgPSAoZnVuY3Rpb24gKCkge1xuICAgIGxldCB0bXAgPSBudWxsO1xuICAgIHJldHVybiAoKT0+IHtcbiAgICAgICAgaWYgKCF0bXApIHRtcCA9IHJlcXVpcmUoJy4uL2FjdGlvbnMvTWlzc2lvbkFjdGlvbkNyZWF0b3JzJyk7XG4gICAgICAgIHJldHVybiB0bXA7XG4gICAgfVxufSkoKTtcblxuY29uc3QgRXZlbnRUYWJsZSA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblxuICAgIHByb3BUeXBlczoge1xuICAgICAgICBldmVudHM6IFJlYWN0LlByb3BUeXBlcy5hcnJheS5pc1JlcXVpcmVkLFxuICAgICAgICB0cmlnZ2VyRGlzYWJsZWQ6IFJlYWN0LlByb3BUeXBlcy5ib29sXG4gICAgfSxcblxuICAgIHJlbmRlcigpIHtcbiAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgIDx0YWJsZSBjbGFzc05hbWU9J3RhYmxlJz5cbiAgICAgICAgICAgICAgICA8dGhlYWQ+XG4gICAgICAgICAgICAgICAgPHRyPlxuICAgICAgICAgICAgICAgICAgICA8dGg+VGltZTwvdGg+XG4gICAgICAgICAgICAgICAgICAgIDx0aD5EZXNjcmlwdGlvbjwvdGg+XG4gICAgICAgICAgICAgICAgICAgIDx0aD5WYWx1ZTwvdGg+XG4gICAgICAgICAgICAgICAgICAgIDx0aD5UcmlnZ2VyPC90aD5cbiAgICAgICAgICAgICAgICA8L3RyPlxuICAgICAgICAgICAgICAgIDwvdGhlYWQ+XG5cbiAgICAgICAgICAgICAgICA8dGJvZHk+XG4gICAgICAgICAgICAgICAgeyAgdGhpcy5wcm9wcy5ldmVudHMubWFwKChldikgPT4ge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gPHRyIGtleT17ZXYuaWR9PlxuICAgICAgICAgICAgICAgICAgICAgICAgPHRkPntldi50cmlnZ2VyVGltZX08L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHRkPntldi5zaG9ydF9kZXNjcmlwdGlvbn08L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHRkPntKU09OLnN0cmluZ2lmeShldi52YWx1ZSB8fCAnJyl9PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgIDx0ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uIGNsYXNzTmFtZT17ICdidG4gYnRuLXByaW1hcnkgJyArICh0aGlzLnByb3BzLnRyaWdnZXJEaXNhYmxlZCAmJiAnZGlzYWJsZWQnKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IGdldE1pc3Npb25BQygpLmFza1RvVHJpZ2dlckV2ZW50KGV2LmlkKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPlRyaWdnZXJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvdGQ+XG4gICAgICAgICAgICAgICAgICAgIDwvdHI+XG4gICAgICAgICAgICAgICAgfSl9XG4gICAgICAgICAgICAgICAgPC90Ym9keT5cbiAgICAgICAgICAgIDwvdGFibGU+XG4gICAgICAgICk7XG4gICAgfVxufSk7XG5cbnZhciBBcHAgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cbiAgICBjb21wb25lbnRXaWxsTW91bnQoKXtcbiAgICAgICAgdmFyIGFjID0gZ2V0TWlzc2lvbkFDKCk7XG4gICAgICAgIGFjLmFza0ZvckV2ZW50cygpO1xuXG4gICAgICAgIEV2ZW50U3RvcmUuYWRkQ2hhbmdlTGlzdGVuZXIodGhpcy5fb25DaGFuZ2UpO1xuICAgICAgICBNaXNzaW9uU3RvcmUuYWRkQ2hhbmdlTGlzdGVuZXIodGhpcy5fb25DaGFuZ2UpXG5cbiAgICB9LFxuXG4gICAgY29tcG9uZW50RGlkTW91bnQoKXtcbiAgICAgICAgdGhpcy5faW50ZXJ2YWwgPSBzZXRJbnRlcnZhbCgoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnNldFN0YXRlKHtjaGFwdGVyVGltZTogdGhpcy5zdGF0ZS5jaGFwdGVyVGltZSArIDF9KVxuICAgICAgICB9LDEwMDApO1xuICAgIH0sXG5cbiAgICBjb21wb25lbnRXaWxsVW5tb3VudCgpe1xuICAgICAgICBjbGVhckludGVydmFsKHRoaXMuX2ludGVydmFsKTtcbiAgICAgICAgRXZlbnRTdG9yZS5yZW1vdmVDaGFuZ2VMaXN0ZW5lcih0aGlzLl9vbkNoYW5nZSk7XG4gICAgICAgIE1pc3Npb25TdG9yZS5yZW1vdmVDaGFuZ2VMaXN0ZW5lcih0aGlzLl9vbkNoYW5nZSlcbiAgICB9LFxuXG4gICAgZ2V0SW5pdGlhbFN0YXRlKCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgY29tcGxldGVkRXZlbnRzOiBbXSxcbiAgICAgICAgICAgIG92ZXJkdWVFdmVudHM6IFtdLFxuICAgICAgICAgICAgcmVtYWluaW5nRXZlbnRzOiBbXSxcbiAgICAgICAgICAgIHJ1bm5pbmc6IE1pc3Npb25TdG9yZS5pc01pc3Npb25SdW5uaW5nKCksXG4gICAgICAgICAgICBjaGFwdGVyOiBNaXNzaW9uU3RvcmUuY3VycmVudENoYXB0ZXIoKSxcbiAgICAgICAgICAgIGNoYXB0ZXJUaW1lOiBNaXNzaW9uU3RvcmUuY2hhcHRlclRpbWUoKVxuICAgICAgICB9XG4gICAgfSxcblxuICAgIF9vbkNoYW5nZSgpIHtcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICBjb21wbGV0ZWRFdmVudHM6IEV2ZW50U3RvcmUuY29tcGxldGVkKCksXG4gICAgICAgICAgICBvdmVyZHVlRXZlbnRzOiBFdmVudFN0b3JlLm92ZXJkdWUoKSxcbiAgICAgICAgICAgIHJlbWFpbmluZ0V2ZW50czogRXZlbnRTdG9yZS5yZW1haW5pbmcoKSxcbiAgICAgICAgICAgIHJ1bm5pbmc6IE1pc3Npb25TdG9yZS5pc01pc3Npb25SdW5uaW5nKCksXG4gICAgICAgICAgICBjaGFwdGVyOiBNaXNzaW9uU3RvcmUuY3VycmVudENoYXB0ZXIoKSxcbiAgICAgICAgICAgIGNoYXB0ZXJUaW1lOiBNaXNzaW9uU3RvcmUuY2hhcHRlclRpbWUoKVxuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgcmVuZGVyKCkge1xuXG4gICAgICAgIHZhciBzdGF0dXM7XG5cbiAgICAgICAgaWYgKCF0aGlzLnN0YXRlLnJ1bm5pbmcpIHtcbiAgICAgICAgICAgIHN0YXR1cyA9IDxwIGlkPVwibWlzc2lvblRpbWVcIj5PcHBkcmFnZXQgaGFyIGlra2Ugc3RhcnRldDwvcD47XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgPGRpdj5cblxuICAgICAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgICAgICAgIDxoMz5TdGF0dXM8L2gzPlxuICAgICAgICAgICAgICAgICAgICB7c3RhdHVzfVxuXG4gICAgICAgICAgICAgICAgICAgIDxkbD5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxkdD5Ow6V2w6ZyZW5kZSBrYXBpdHRlbDo8L2R0PlxuICAgICAgICAgICAgICAgICAgICAgICAgPGRkPnt0aGlzLnN0YXRlLmNoYXB0ZXJ9PC9kZD5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxkdD5UaWQgYnJ1a3QgaSBrYXBpdHRlbDwvZHQ+XG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGQ+e3RoaXMuc3RhdGUuY2hhcHRlclRpbWV9PC9kZD5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxkdD5Ub3RhbCB0aWQ8L2R0PlxuICAgICAgICAgICAgICAgICAgICAgICAgPGRkPjxNaXNzaW9uVGltZXIgLz48L2RkPlxuICAgICAgICAgICAgICAgICAgICA8L2RsPlxuXG4gICAgICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgICAgICAgICA8YnV0dG9uIGNsYXNzTmFtZT0nYnRuIGJ0bi1wcmltYXJ5JyBvbkNsaWNrPXtnZXRNaXNzaW9uQUMoKS5zdGFydE1pc3Npb259PlN0YXJ0IG9wcGRyYWc8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgPGJ1dHRvbiBjbGFzc05hbWU9J2J0biBidG4tcHJpbWFyeScgb25DbGljaz17Z2V0TWlzc2lvbkFDKCkuc3RvcE1pc3Npb259PlN0b3A8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgPGJ1dHRvbiBjbGFzc05hbWU9J2J0biBidG4tcHJpbWFyeScgb25DbGljaz17Z2V0TWlzc2lvbkFDKCkuYXNrVG9TdGFydE5leHRDaGFwdGVyfT5OZXN0ZSBrYXBpdHRlbFxuICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgPGJ1dHRvbiBjbGFzc05hbWU9J2J0biBidG4tcHJpbWFyeScgb25DbGljaz17Z2V0TWlzc2lvbkFDKCkucmVzZXRNaXNzaW9ufT5CZWd5bm4gcMOlIG55dHQ8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgICAgIDxidXR0b24gY2xhc3NOYW1lPSdidG4gYnRuLXByaW1hcnknIG9uQ2xpY2s9e2dldE1pc3Npb25BQygpLmNvbXBsZXRlTWlzc2lvbn0+T3BwZHJhZyB1dGbDuHJ0PC9idXR0b24+XG5cblxuICAgICAgICAgICAgICAgIDxoMj5DaGFwdGVyIGV2ZW50czwvaDI+XG5cbiAgICAgICAgICAgICAgICA8aDM+cmVtYWluaW5nPC9oMz5cbiAgICAgICAgICAgICAgICA8RXZlbnRUYWJsZSBrZXk9XCJmb29cIiBldmVudHM9e3RoaXMuc3RhdGUucmVtYWluaW5nRXZlbnRzfS8+XG5cbiAgICAgICAgICAgICAgICA8aDM+b3ZlcmR1ZTwvaDM+XG4gICAgICAgICAgICAgICAgPEV2ZW50VGFibGUgZXZlbnRzPXt0aGlzLnN0YXRlLm92ZXJkdWVFdmVudHN9Lz5cblxuICAgICAgICAgICAgICAgIDxoMz5jb21wbGV0ZWQ8L2gzPlxuICAgICAgICAgICAgICAgIDxFdmVudFRhYmxlIHRyaWdnZXJEaXNhYmxlZD17dHJ1ZX0gZXZlbnRzPXt0aGlzLnN0YXRlLmNvbXBsZXRlZEV2ZW50c30vPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICk7XG4gICAgfVxuXG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBBcHA7XG4iLCJjb25zdCBSZWFjdCA9IHJlcXVpcmUoJ3JlYWN0JyksXG4gICAgVGltZXJTdG9yZSA9IHJlcXVpcmUoJy4uL3N0b3Jlcy90aW1lci1zdG9yZScpLFxuICAgIFRpbWVyID0gcmVxdWlyZSgnLi90aW1lci5yZWFjdCcpO1xuXG5cbmNvbnN0IE1pc3Npb25UaW1lciA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblxuICAgIGdldEluaXRpYWxTdGF0ZSgpe1xuICAgICAgICByZXR1cm4geyBlbGFwc2VkIDogVGltZXJTdG9yZS5nZXRFbGFwc2VkTWlzc2lvblRpbWUoKSB9O1xuICAgIH0sXG4gICAgXG4gICAgY29tcG9uZW50RGlkTW91bnQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgVGltZXJTdG9yZS5hZGRDaGFuZ2VMaXN0ZW5lcih0aGlzLl9oYW5kbGVUaW1lQ2hhbmdlKTtcbiAgICB9LFxuXG4gICAgY29tcG9uZW50V2lsbFVubW91bnQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgVGltZXJTdG9yZS5yZW1vdmVDaGFuZ2VMaXN0ZW5lcih0aGlzLl9oYW5kbGVUaW1lQ2hhbmdlKTtcbiAgICB9LFxuXG4gICAgX2hhbmRsZVRpbWVDaGFuZ2UoKSB7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgZWxhcHNlZCA6IFRpbWVyU3RvcmUuZ2V0RWxhcHNlZE1pc3Npb25UaW1lKClcbiAgICAgICAgfSlcbiAgICB9LFxuXG4gICAgcmVuZGVyKCkge1xuICAgICAgICByZXR1cm4gIDxUaW1lciBjbGFzc05hbWU9e3RoaXMucHJvcHMuY2xhc3NOYW1lfSB0aW1lSW5TZWNvbmRzPXt0aGlzLnN0YXRlLmVsYXBzZWQgfSAvPlxuICAgIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IE1pc3Npb25UaW1lcjtcblxuIiwiY29uc3QgUmVhY3QgPSByZXF1aXJlKCdyZWFjdCcpO1xuXG5jb25zdCBOb3RGb3VuZCA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcbiAgICByZW5kZXIoKSB7XG4gICAgICAgIHJldHVybiA8ZGl2IGNsYXNzTmFtZT0nY29udGFpbmVyJz5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicm93IGp1bWJvdHJvblwiPlxuICAgICAgICAgICAgICAgIDxkaXY+T2pzYW5uLiBUcm9yIGR1IGhhciBnw6V0dCBkZWcgdmlsbCwgamVnPC9kaXY+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9kaXY+XG4gICAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gTm90Rm91bmQ7XG4iLCIvKlxuICogU2ltcGxlIGNvbXBvbmVudCB0aGF0IG92ZXJsYXlzIGEgc2VjdGlvbiwgc2lnbmFsbGluZyBhIGRpc2FibGVkIHN0YXRlXG4gKlxuICogRGVwZW5kYW50IG9uIHdvcmtpbmcgQ1NTLCBvZiBjb3Vyc2U6IHRoZSBwYXJlbnQgbXVzdCBiZSBwb3NpdGlvbmVkIChyZWxhdGl2ZSwgYWJzb2x1dGUsIC4uLilcbiAqIExvb3NlbHkgYmFzZWQgaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy8zNjI3MjgzL2hvdy10by1kaW0tb3RoZXItZGl2LW9uLWNsaWNraW5nLWlucHV0LWJveC11c2luZy1qcXVlcnlcbiAqL1xuY29uc3QgUmVhY3QgPSByZXF1aXJlKCdyZWFjdCcpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblxuICAgIHByb3BUeXBlczoge1xuICAgICAgICBhY3RpdmUgOiBSZWFjdC5Qcm9wVHlwZXMuYm9vbC5pc1JlcXVpcmVkXG4gICAgfSxcblxuICAgIHJlbmRlcigpIHtcbiAgICAgICAgcmV0dXJuICh0aGlzLnByb3BzLmFjdGl2ZT8gPGRpdiBjbGFzc05hbWU9XCJvdmVybGF5XCIvPiA6IG51bGwpO1xuICAgIH1cblxufSk7IiwiLyoqXG4gKiBUSElTIERFU0lHTiBPTkxZIFNVUFBPUlRTIE9ORSBDSEFSVCBBUyBUSEVZICpTSEFSRSogU1RBVEVcbiAqIEZvciBhIG5vbi1zdHVwaWQgZGVzaWduLCBkbyBzb21ldGhpbmcgbGlrZSB0aGVcbiAqIGltcGxlbWVudGF0aW9uIGluIHRoZSBhcnRpY2xlIGJ5IE5pY29sYXMgSGVyeTpcbiAqIGh0dHA6Ly9uaWNvbGFzaGVyeS5jb20vaW50ZWdyYXRpbmctZDNqcy12aXN1YWxpemF0aW9ucy1pbi1hLXJlYWN0LWFwcFxuICpcbiAqIENoYXJ0IGNvZGUgbW9yZSBvciBsZXNzIGNvcGllZCBmcm9tIHRoZSBwcm90b3R5cGUgYnkgTGVvIE1hcnRpbiBXZXN0YnlcbiAqL1xuY29uc3QgUmVhY3QgPSByZXF1aXJlKCdyZWFjdCcpO1xuY29uc3QgQW1DaGFydHMgPSByZXF1aXJlKCdhbWNoYXJ0cycpO1xuY29uc3QgY29uc3RhbnRzID0gcmVxdWlyZSgnLi4vY29uc3RhbnRzL1NjaWVuY2VUZWFtQ29uc3RhbnRzJyk7XG5cbnZhciBjaGFydCwgY2hhcnRVcGRhdGVyLCBnZXROZXdWYWx1ZSwgdXBkYXRlRnJlcXVlbmN5LCBtYXhTZWNvbmRzO1xudmFyIHJhZGlhdGlvblNhbXBsZXMgPSBbXTtcblxuY29uc3QgeyByYW5kb21JbnQgfSA9IHJlcXVpcmUoJy4uL3V0aWxzJyk7XG5cbmZ1bmN0aW9uIGluaXRDaGFydChkb21FbGVtZW50KSB7XG5cbiAgICBjaGFydCA9IG5ldyBBbUNoYXJ0cy5BbVNlcmlhbENoYXJ0KCk7XG5cbiAgICBjaGFydC5tYXJnaW5Ub3AgPSAyMDtcbiAgICBjaGFydC5tYXJnaW5SaWdodCA9IDA7XG4gICAgY2hhcnQubWFyZ2luTGVmdCA9IDA7XG4gICAgY2hhcnQuYXV0b01hcmdpbk9mZnNldCA9IDA7XG4gICAgY2hhcnQuZGF0YVByb3ZpZGVyID0gcmFkaWF0aW9uU2FtcGxlcztcbiAgICBjaGFydC5jYXRlZ29yeUZpZWxkID0gXCJ0aW1lc3RhbXBcIjtcblxuICAgIC8vWCBheGlzXG4gICAgdmFyIGNhdGVnb3J5QXhpcyA9IGNoYXJ0LmNhdGVnb3J5QXhpcztcbiAgICBjYXRlZ29yeUF4aXMuZGFzaExlbmd0aCA9IDE7XG4gICAgY2F0ZWdvcnlBeGlzLmdyaWRBbHBoYSA9IDAuMTU7XG4gICAgY2F0ZWdvcnlBeGlzLmF4aXNDb2xvciA9IFwiI0RBREFEQVwiO1xuICAgIGNhdGVnb3J5QXhpcy50aXRsZSA9IFwiU2Vjb25kc1wiO1xuXG4gICAgLy9ZIGF4aXNcbiAgICB2YXIgdmFsdWVBeGlzID0gbmV3IEFtQ2hhcnRzLlZhbHVlQXhpcygpO1xuICAgIHZhbHVlQXhpcy5heGlzQWxwaGEgPSAwLjI7XG4gICAgdmFsdWVBeGlzLmRhc2hMZW5ndGggPSAxO1xuICAgIHZhbHVlQXhpcy50aXRsZSA9IFwizrxTdi9oXCI7XG4gICAgdmFsdWVBeGlzLm1pbmltdW0gPSBjb25zdGFudHMuU0NJRU5DRV9SQURJQVRJT05fTUlOO1xuICAgIHZhbHVlQXhpcy5tYXhpbXVtID0gY29uc3RhbnRzLlNDSUVOQ0VfUkFESUFUSU9OX01BWDtcbiAgICBjaGFydC5hZGRWYWx1ZUF4aXModmFsdWVBeGlzKTtcblxuICAgIC8vTGluZVxuICAgIHZhciBncmFwaCA9IG5ldyBBbUNoYXJ0cy5BbUdyYXBoKCk7XG4gICAgZ3JhcGgudmFsdWVGaWVsZCA9IFwicmFkaWF0aW9uXCI7XG4gICAgZ3JhcGguYnVsbGV0ID0gXCJyb3VuZFwiO1xuICAgIGdyYXBoLmJ1bGxldEJvcmRlckNvbG9yID0gXCIjRkZGRkZGXCI7XG4gICAgZ3JhcGguYnVsbGV0Qm9yZGVyVGhpY2tuZXNzID0gMjtcbiAgICBncmFwaC5saW5lVGhpY2tuZXNzID0gMjtcbiAgICBncmFwaC5saW5lQ29sb3IgPSBcIiNiNTAzMGRcIjtcbiAgICBncmFwaC5uZWdhdGl2ZUxpbmVDb2xvciA9IFwiIzIyOEIyMlwiO1xuICAgIGdyYXBoLm5lZ2F0aXZlQmFzZSA9IDYwO1xuICAgIGdyYXBoLmhpZGVCdWxsZXRzQ291bnQgPSA1MDtcbiAgICBjaGFydC5hZGRHcmFwaChncmFwaCk7XG5cbiAgICAvL01vdXNlb3ZlclxuICAgIGNvbnN0IGNoYXJ0Q3Vyc29yID0gbmV3IEFtQ2hhcnRzLkNoYXJ0Q3Vyc29yKCk7XG4gICAgY2hhcnRDdXJzb3IuY3Vyc29yUG9zaXRpb24gPSBcIm1vdXNlXCI7XG4gICAgY2hhcnQuYWRkQ2hhcnRDdXJzb3IoY2hhcnRDdXJzb3IpO1xuICAgIGNoYXJ0LndyaXRlKGRvbUVsZW1lbnQpO1xufVxuXG4vL0FkZHMgYSBuZXcgcmFkaWF0aW9uIHNhbXBsZSB0byB0aGUgY2hhcnQgZXZlcnkgZmV3IHNlY29uZHNcbmZ1bmN0aW9uIHN0YXJ0RXZlbnRMb29wKCkge1xuICAgIHZhciBzdGFydFRpbWUgPSBEYXRlLm5vdygpO1xuICAgIHN0b3BFdmVudExvb3AoKTtcblxuICAgIGNoYXJ0VXBkYXRlciA9IHNldEludGVydmFsKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHNlY29uZHNQYXNzZWQgPSAoRGF0ZS5ub3coKSAtIHN0YXJ0VGltZSkgLyAxMDAwO1xuXG4gICAgICAgIHJhZGlhdGlvblNhbXBsZXMucHVzaCh7XG4gICAgICAgICAgICB0aW1lc3RhbXA6IE1hdGguZmxvb3Ioc2Vjb25kc1Bhc3NlZCArIDAuNSksXG4gICAgICAgICAgICByYWRpYXRpb246IGdldE5ld1ZhbHVlKClcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy9XaGVuIHRoZSBjaGFydCBncm93cywgc3RhcnQgY3V0dGluZyBvZmYgdGhlIG9sZGVzdCBzYW1wbGUgdG8gZ2l2ZSB0aGUgY2hhcnQgYSBzbGlkaW5nIGVmZmVjdFxuICAgICAgICBpZiAocmFkaWF0aW9uU2FtcGxlcy5sZW5ndGggPiAobWF4U2Vjb25kcyAvIHVwZGF0ZUZyZXF1ZW5jeSkpIHtcbiAgICAgICAgICAgIHJhZGlhdGlvblNhbXBsZXMuc2hpZnQoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNoYXJ0LnZhbGlkYXRlRGF0YSgpO1xuICAgIH0sIHVwZGF0ZUZyZXF1ZW5jeSAqIDEwMDApO1xufVxuXG5mdW5jdGlvbiBzdG9wRXZlbnRMb29wKCkge1xuICAgIGNsZWFySW50ZXJ2YWwoY2hhcnRVcGRhdGVyKTtcbn1cblxuY29uc3QgUmFkaWF0aW9uQ2hhcnQgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cbiAgICBzdGF0aWNzOiB7fSxcblxuICAgIHByb3BUeXBlczoge1xuICAgICAgICB1cGRhdGVGcmVxdWVuY3lTZWNvbmRzOiBSZWFjdC5Qcm9wVHlwZXMubnVtYmVyLmlzUmVxdWlyZWQsXG4gICAgICAgIG1heFNlY29uZHNTaG93bjogUmVhY3QuUHJvcFR5cGVzLm51bWJlci5pc1JlcXVpcmVkLFxuICAgICAgICBnZXROZXdWYWx1ZTogUmVhY3QuUHJvcFR5cGVzLmZ1bmMuaXNSZXF1aXJlZCxcbiAgICAgICAgaGVpZ2h0OiBSZWFjdC5Qcm9wVHlwZXMubnVtYmVyLmlzUmVxdWlyZWQsXG4gICAgICAgIHdpZHRoOiBSZWFjdC5Qcm9wVHlwZXMubnVtYmVyXG4gICAgfSxcblxuICAgIG1peGluczogW10sXG5cbiAgICBjb21wb25lbnRXaWxsTW91bnQoKSB7XG4gICAgICAgIHVwZGF0ZUZyZXF1ZW5jeSA9IHRoaXMucHJvcHMudXBkYXRlRnJlcXVlbmN5U2Vjb25kcztcbiAgICAgICAgbWF4U2Vjb25kcyA9IHRoaXMucHJvcHMubWF4U2Vjb25kc1Nob3duO1xuICAgICAgICBnZXROZXdWYWx1ZSA9IHRoaXMucHJvcHMuZ2V0TmV3VmFsdWU7XG4gICAgfSxcblxuICAgIGNvbXBvbmVudERpZE1vdW50KCkge1xuICAgICAgICB2YXIgZWwgPSBSZWFjdC5maW5kRE9NTm9kZSh0aGlzKTtcbiAgICAgICAgaW5pdENoYXJ0KGVsKTtcbiAgICAgICAgc3RhcnRFdmVudExvb3AoKTtcbiAgICB9LFxuXG4gICAgY29tcG9uZW50V2lsbFJlY2VpdmVQcm9wcygpIHtcbiAgICB9LFxuXG4gICAgY29tcG9uZW50V2lsbFVubW91bnQoKSB7XG4gICAgICAgIGNoYXJ0ICYmIGNoYXJ0LmNsZWFyKCk7XG4gICAgICAgIHN0b3BFdmVudExvb3AoKTtcbiAgICB9LFxuXG4gICAgY29tcG9uZW50RGlkVW5tb3VudCgpIHtcbiAgICAgICAgY2hhcnQgPSBudWxsO1xuICAgICAgICAvL3JhZGlhdGlvblNhbXBsZXMubGVuZ3RoID0gMDtcbiAgICB9LFxuXG4gICAgY29tcG9uZW50RGlkVXBkYXRlKCkge1xuICAgIH0sXG5cbiAgICAvLyB0aGlzIGNoYXJ0IGlzIHJlc3BvbnNpYmxlIGZvciBkcmF3aW5nIGl0c2VsZlxuICAgIHNob3VsZENvbXBvbmVudFVwZGF0ZSgpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH0sXG5cbiAgICAvLyBQcml2YXRlIG1ldGhvZHNcblxuICAgIHJlbmRlcigpIHtcblxuICAgICAgICAvLyBpZiB5b3UgZG9uJ3Qgc3BlY2lmeSB3aWR0aCBpdCB3aWxsIG1heCBvdXQgdG8gMTAwJSAod2hpY2ggaXMgb2spXG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICA8ZGl2XG4gICAgICAgICAgICAgICAgc3R5bGU9e3t3aWR0aDogdGhpcy5wcm9wcy53aWR0aCArICdweCcsIGhlaWdodCA6IHRoaXMucHJvcHMuaGVpZ2h0KyAncHgnfX1cbiAgICAgICAgICAgICAgICBjbGFzc05hbWU9e3RoaXMucHJvcHMuY2xhc3NOYW1lfVxuICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICk7XG4gICAgfVxuXG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBSYWRpYXRpb25DaGFydDtcbiIsImNvbnN0IFJlYWN0ID0gcmVxdWlyZSgncmVhY3QnKSxcbiAgICBUaW1lclN0b3JlID0gcmVxdWlyZSgnLi4vc3RvcmVzL3RpbWVyLXN0b3JlJyksXG4gICAgTWlzc2lvbkFjdGlvbkNyZWF0b3JzID0gcmVxdWlyZSgnLi4vYWN0aW9ucy9NaXNzaW9uQWN0aW9uQ3JlYXRvcnMnKSxcbiAgICBUaW1lckFjdGlvbkNyZWF0b3JzID0gcmVxdWlyZSgnLi4vYWN0aW9ucy9UaW1lckFjdGlvbkNyZWF0b3JzJyksXG4gICAgU2NpZW5jZUFjdGlvbkNyZWF0b3JzID0gcmVxdWlyZSgnLi4vYWN0aW9ucy9TY2llbmNlQWN0aW9uQ3JlYXRvcnMnKSxcbiAgICBjb25zdGFudHMgPSByZXF1aXJlKCcuLi9jb25zdGFudHMvU2NpZW5jZVRlYW1Db25zdGFudHMnKTtcblxudmFyIFJhZGlhdGlvblNhbXBsZXIgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cbiAgICBwcm9wVHlwZXM6IHtcbiAgICAgICAgcmVxdWlyZWRTYW1wbGVzOiBSZWFjdC5Qcm9wVHlwZXMubnVtYmVyLmlzUmVxdWlyZWQsXG4gICAgICAgIHJhZGlhdGlvblN0b3JlU3RhdGU6IFJlYWN0LlByb3BUeXBlcy5vYmplY3QuaXNSZXF1aXJlZFxuICAgIH0sXG5cbiAgICBjb21wb25lbnRXaWxsTW91bnQoKSB7XG4gICAgICAgIFRpbWVyU3RvcmUuYWRkQ2hhbmdlTGlzdGVuZXIodGhpcy5faGFuZGxlVGltZXJDaGFuZ2UpO1xuICAgIH0sXG5cbiAgICBjb21wb25lbnREaWRVcGRhdGUoKXtcbiAgICAgICAgaWYgKHRoaXMuc3RhdGUudGltZXJBY3RpdmUpIHtcbiAgICAgICAgICAgIGxldCBlbCA9IFJlYWN0LmZpbmRET01Ob2RlKHRoaXMucmVmc1snc2FtcGxlLWJ1dHRvbiddKTtcbiAgICAgICAgICAgIGVsLmZvY3VzKCk7XG4gICAgICAgIH1cbiAgICB9LFxuXG5cbiAgICBjb21wb25lbnRXaWxsVW5tb3VudCgpe1xuICAgICAgICBUaW1lclN0b3JlLnJlbW92ZUNoYW5nZUxpc3RlbmVyKHRoaXMuX2hhbmRsZVRpbWVyQ2hhbmdlKTtcbiAgICB9LFxuXG4gICAgZ2V0SW5pdGlhbFN0YXRlKCkge1xuICAgICAgICByZXR1cm4ge3RpbWVyQWN0aXZlOiBmYWxzZX1cbiAgICB9LFxuXG4gICAgX2lzRGlzYWJsZWQoKSB7XG4gICAgICAgIHJldHVybiAhdGhpcy5zdGF0ZS50aW1lckFjdGl2ZVxuICAgIH0sXG5cblxuICAgIF9oYW5kbGVUaW1lckNoYW5nZSgpIHtcbiAgICAgICAgdmFyIGF1ZGlvID0gUmVhY3QuZmluZERPTU5vZGUodGhpcy5yZWZzWydnZWlnZXJTb3VuZCddKTtcbiAgICAgICAgdmFyIHRpbWVyQWN0aXZlID0gVGltZXJTdG9yZS5pc1J1bm5pbmcoY29uc3RhbnRzLlNDSUVOQ0VfVElNRVJfMSk7XG5cbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7dGltZXJBY3RpdmU6IHRpbWVyQWN0aXZlfSk7XG5cbiAgICAgICAgaWYgKHRpbWVyQWN0aXZlICYmIGF1ZGlvLnBhdXNlZCkge1xuICAgICAgICAgICAgYXVkaW8ucGxheSgpO1xuICAgICAgICB9IGVsc2UgaWYgKCF0aW1lckFjdGl2ZSAmJiAhYXVkaW8ucGF1c2VkKSB7XG4gICAgICAgICAgICBhdWRpby5wYXVzZSgpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIF9oYW5kbGVDbGljaygpIHtcbiAgICAgICAgU2NpZW5jZUFjdGlvbkNyZWF0b3JzLnRha2VSYWRpYXRpb25TYW1wbGUoKTtcblxuICAgICAgICBpZiAodGhpcy5wcm9wcy5yYWRpYXRpb25TdG9yZVN0YXRlLnNhbXBsZXMubGVuZ3RoICsgMSA+PSB0aGlzLnByb3BzLnJlcXVpcmVkU2FtcGxlcykge1xuICAgICAgICAgICAgVGltZXJBY3Rpb25DcmVhdG9ycy5zdG9wVGltZXIoY29uc3RhbnRzLlNDSUVOQ0VfVElNRVJfMSk7XG4gICAgICAgICAgICBTY2llbmNlQWN0aW9uQ3JlYXRvcnMuY29tcGxldGVUYXNrKCdzYW1wbGUnKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICByZW5kZXIoKSB7XG4gICAgICAgIHZhciBkaXNhYmxlZCwgY2xhc3NlcztcblxuICAgICAgICBjbGFzc2VzID0gJ2J0biBidG4tcHJpbWFyeSc7XG5cbiAgICAgICAgaWYgKHRoaXMuX2lzRGlzYWJsZWQoKSkge1xuICAgICAgICAgICAgY2xhc3NlcyArPSAnIGRpc2FibGVkJztcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICA8c2VjdGlvbiBjbGFzc05hbWU9e1wicmFkaWF0aW9uLXNhbXBsZXIgXCIgKyB0aGlzLnByb3BzLmNsYXNzTmFtZX0+XG5cbiAgICAgICAgICAgICAgICB7IC8qIEF2b2lkIGZsb2F0aW5nIGludG8gcHJldmlvdXMgYmxvY2sgKi8gfVxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicmFkaWF0aW9uLXNhbXBsZXJfX3BhZGRlciBjbGVhcmZpeCB2aXNpYmxlLXhzLWJsb2NrXCIvPlxuXG4gICAgICAgICAgICAgICAgPGF1ZGlvIHJlZj1cImdlaWdlclNvdW5kXCIgbG9vcD5cbiAgICAgICAgICAgICAgICAgICAgPHNvdXJjZSBzcmM9XCIvc291bmRzL0FPUzA0NTk1X0VsZWN0cmljX0dlaWdlcl9Db3VudGVyX0Zhc3Qud2F2XCIgdHlwZT1cImF1ZGlvL3dhdlwiLz5cbiAgICAgICAgICAgICAgICA8L2F1ZGlvPlxuXG4gICAgICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgcmVmPSdzYW1wbGUtYnV0dG9uJ1xuICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPXtjbGFzc2VzfVxuICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17dGhpcy5faGFuZGxlQ2xpY2t9XG4gICAgICAgICAgICAgICAgICAgICAgICA+VGEgc3Ryw6VsaW5nc3Byw7h2ZVxuICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDwvc2VjdGlvbj5cbiAgICAgICAgKTtcbiAgICB9XG5cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFJhZGlhdGlvblNhbXBsZXI7IiwiY29uc3QgUmVhY3QgPSByZXF1aXJlKCdyZWFjdCcpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblxuICAgIHN0YXRpY3M6IHt9LFxuICAgIHByb3BUeXBlczoge1xuICAgICAgICBzYW1wbGVzOiBSZWFjdC5Qcm9wVHlwZXMuYXJyYXkuaXNSZXF1aXJlZCxcbiAgICAgICAgbWluaW1hbFJvd3NUb1Nob3c6IFJlYWN0LlByb3BUeXBlcy5udW1iZXJcbiAgICB9LFxuXG4gICAgLy8gUHJpdmF0ZSBtZXRob2RzXG5cbiAgICBnZXREZWZhdWx0UHJvcHMoKXtcbiAgICAgICAgcmV0dXJuIHttaW5pbWFsUm93c1RvU2hvdzogMH07XG4gICAgfSxcblxuICAgIHJlbmRlcigpIHtcbiAgICAgICAgbGV0IHNhbXBsZVJvd3MgPSB0aGlzLnByb3BzLnNhbXBsZXMubWFwKCh2YWwsIGkpID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gPHRyIGtleT17aX0+XG4gICAgICAgICAgICAgICAgICAgIDx0aCBzY29wZT1cInJvd1wiPntpICsgMX08L3RoPlxuICAgICAgICAgICAgICAgICAgICA8dGQ+e3ZhbH08L3RkPlxuICAgICAgICAgICAgICAgIDwvdHI+XG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICAgIG1pc3NpbmdSb3dzID0gdGhpcy5wcm9wcy5taW5pbWFsUm93c1RvU2hvdyAtIHNhbXBsZVJvd3MubGVuZ3RoLFxuICAgICAgICAgICAgZmlsbFJvd3M7XG5cbiAgICAgICAgaWYgKG1pc3NpbmdSb3dzID4gMCkge1xuICAgICAgICAgICAgZmlsbFJvd3MgPSBbXTtcblxuICAgICAgICAgICAgd2hpbGUgKG1pc3NpbmdSb3dzLS0pIHtcbiAgICAgICAgICAgICAgICBmaWxsUm93cy5wdXNoKDx0ciBrZXk9e2ZpbGxSb3dzLmxlbmd0aH0+XG4gICAgICAgICAgICAgICAgICAgICAgICA8dGggc2NvcGU9XCJyb3dcIj48L3RoPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHRkPiZuYnNwO3svKiBOZWVkcyBmaWxsZXIgdG8gbm90IGNvbGxhcHNlIGNlbGwgKi99PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgPC90cj5cbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9e3RoaXMucHJvcHMuY2xhc3NOYW1lfT5cblxuICAgICAgICAgICAgICAgIDxoMz5QcsO4dmVyZXN1bHRhdGVyPC9oMz5cbiAgICAgICAgICAgICAgICA8dGFibGUgY2xhc3NOYW1lPVwiIHRhYmxlIHRhYmxlLWJvcmRlcmVkXCI+XG4gICAgICAgICAgICAgICAgICAgIDxjYXB0aW9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgU3Ryw6VsaW5nc3BhcnRpa2xlciBwZXIgc2VrdW5kIChwL3MpXG4gICAgICAgICAgICAgICAgICAgIDwvY2FwdGlvbj5cbiAgICAgICAgICAgICAgICAgICAgPHRoZWFkPlxuICAgICAgICAgICAgICAgICAgICA8dHI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8dGggc2NvcGU9XCJjb2xcIj5QcsO4dmVudW1tZXI8L3RoPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHRoIHNjb3BlPVwiY29sXCI+cC9zPC90aD5cbiAgICAgICAgICAgICAgICAgICAgPC90cj5cbiAgICAgICAgICAgICAgICAgICAgPC90aGVhZD5cbiAgICAgICAgICAgICAgICAgICAgPHRib2R5PlxuICAgICAgICAgICAgICAgICAgICB7IHNhbXBsZVJvd3MgfVxuICAgICAgICAgICAgICAgICAgICB7IGZpbGxSb3dzIH1cbiAgICAgICAgICAgICAgICAgICAgPC90Ym9keT5cbiAgICAgICAgICAgICAgICA8L3RhYmxlPlxuXG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKTtcbiAgICB9XG5cbn0pO1xuXG4iLCJjb25zdCBSZWFjdCA9IHJlcXVpcmUoJ3JlYWN0Jyk7XG5jb25zdCBUaW1lclBhbmVsID0gcmVxdWlyZSgnLi90aW1lci1wYW5lbC5yZWFjdCcpO1xuY29uc3QgUmFkaWF0aW9uQ2hhcnQgPSByZXF1aXJlKCcuL3JhZGlhdGlvbi1jaGFydC5yZWFjdC5qcycpO1xuY29uc3QgUmFkaWF0aW9uU2FtcGxlQnV0dG9uID0gcmVxdWlyZSgnLi9yYWRpYXRpb24tc2FtcGxlci5yZWFjdCcpO1xuY29uc3QgT3ZlcmxheSA9IHJlcXVpcmUoJy4vb3ZlcmxheS5yZWFjdCcpO1xuY29uc3QgUmFkaWF0aW9uVGFibGUgPSByZXF1aXJlKCcuL3JhZGlhdGlvbi10YWJsZS5yZWFjdCcpO1xuY29uc3QgUmFkaWF0aW9uU3RvcmUgPSByZXF1aXJlKCcuLi9zdG9yZXMvcmFkaWF0aW9uLXN0b3JlJyk7XG5jb25zdCBhY3Rpb25zID0gcmVxdWlyZSgnLi4vYWN0aW9ucy9TY2llbmNlQWN0aW9uQ3JlYXRvcnMnKTtcbmNvbnN0IHV0aWxzID0gcmVxdWlyZSgnLi4vdXRpbHMnKTtcbmNvbnN0IFNjaWVuY2VUZWFtQ29uc3RhbnRzID0gcmVxdWlyZSgnLi4vY29uc3RhbnRzL1NjaWVuY2VUZWFtQ29uc3RhbnRzJyk7XG5jb25zdCBUaW1lckFjdGlvbkNyZWF0b3JzID0gcmVxdWlyZSgnLi4vYWN0aW9ucy9UaW1lckFjdGlvbkNyZWF0b3JzJyk7XG5cblxuLy8gU0VUVElOR1NcblRpbWVyQWN0aW9uQ3JlYXRvcnMuc2V0VGltZXIoU2NpZW5jZVRlYW1Db25zdGFudHMuU0NJRU5DRV9USU1FUl8xLCAzMCk7XG5cbm1vZHVsZS5leHBvcnRzID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXG4gICAgc3RhdGljczoge30sXG4gICAgcHJvcFR5cGVzOiB7XG4gICAgICAgIGFwcHN0YXRlOiBSZWFjdC5Qcm9wVHlwZXMub2JqZWN0LmlzUmVxdWlyZWRcbiAgICB9LFxuICAgIG1peGluczogW10sXG5cbiAgICAvLyBsaWZlIGN5Y2xlIG1ldGhvZHNcbiAgICBnZXRJbml0aWFsU3RhdGUoKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByYWRpYXRpb246IFJhZGlhdGlvblN0b3JlLmdldFN0YXRlKClcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBnZXREZWZhdWx0UHJvcHMoKSB7XG4gICAgICAgIHJldHVybiB7fTtcbiAgICB9LFxuXG4gICAgY29tcG9uZW50V2lsbE1vdW50KCkge1xuICAgICAgICBSYWRpYXRpb25TdG9yZS5hZGRDaGFuZ2VMaXN0ZW5lcih0aGlzLl9oYW5kbGVSYWRpYXRpb25DaGFuZ2UpO1xuICAgIH0sXG5cbiAgICBjb21wb25lbnRXaWxsUmVjZWl2ZVByb3BzKCkge1xuICAgIH0sXG5cbiAgICBjb21wb25lbnRXaWxsVW5tb3VudCgpIHtcbiAgICAgICAgUmFkaWF0aW9uU3RvcmUucmVtb3ZlQ2hhbmdlTGlzdGVuZXIodGhpcy5faGFuZGxlUmFkaWF0aW9uQ2hhbmdlKTtcbiAgICB9LFxuXG4gICAgLy8gUHJpdmF0ZSBtZXRob2RzXG5cbiAgICBfaGFuZGxlUmFkaWF0aW9uQ2hhbmdlKCkge1xuICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgIHJhZGlhdGlvbjogUmFkaWF0aW9uU3RvcmUuZ2V0U3RhdGUoKVxuICAgICAgICB9KVxuICAgIH0sXG5cbiAgICBfaGFuZGxlQXZlcmFnZVJhZGlhdGlvblN1Ym1pdChlKSB7XG4gICAgICAgIGxldCBlbCA9IFJlYWN0LmZpbmRET01Ob2RlKHRoaXMucmVmc1snYXZlcmFnZS1pbnB1dCddKSxcbiAgICAgICAgICAgIHZhbCA9IGVsLnZhbHVlLnRyaW0oKTtcblxuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgICAgaWYgKCF2YWwubGVuZ3RoKSByZXR1cm47XG5cbiAgICAgICAgbGV0IGF2ZXJhZ2UgPSB1dGlscy5wYXJzZU51bWJlcih2YWwpO1xuICAgICAgICBlbC52YWx1ZSA9ICcnO1xuXG4gICAgICAgIGlmIChhdmVyYWdlKSB7XG4gICAgICAgICAgICBhY3Rpb25zLmF2ZXJhZ2VSYWRpYXRpb25DYWxjdWxhdGVkKGF2ZXJhZ2UpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIF9oYW5kbGVBZGRUb1RvdGFsU3VibWl0KGUpe1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgICAgbGV0IGVsID0gUmVhY3QuZmluZERPTU5vZGUodGhpcy5yZWZzWydhZGQtdG8tdG90YWwnXSk7XG4gICAgICAgIGxldCB2YWwgPSBlbC52YWx1ZS50cmltKCk7XG4gICAgICAgIGlmICghdmFsLmxlbmd0aCkgcmV0dXJuO1xuXG4gICAgICAgIGxldCBudW1iZXIgPSB1dGlscy5wYXJzZU51bWJlcih2YWwpO1xuXG4gICAgICAgIGlmICghaXNOYU4obnVtYmVyKSkge1xuICAgICAgICAgICAgYWN0aW9ucy5hZGRUb1RvdGFsUmFkaWF0aW9uTGV2ZWwobnVtYmVyKTtcbiAgICAgICAgfVxuICAgIH0sXG5cblxuICAgIC8qXG4gICAgICogSGVscGVyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHRhc2tOYW1lIG5hbWVcbiAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gdHJ1ZSBpZiB0aGUgY3VycmVudCB0YXNrIGlkIGVxdWFscyB0aGUgbmFtZSBwYXNzZWQgaW5cbiAgICAgKi9cbiAgICBfaXNDdXJyZW50VGFzayh0YXNrTmFtZSl7XG4gICAgICAgIHJldHVybiB0aGlzLnByb3BzLmFwcHN0YXRlLnRhc2tTdG9yZS5jdXJyZW50VGFza0lkID09PSB0YXNrTmFtZTtcbiAgICB9LFxuXG4gICAgX3JhZGlhdGlvblN0YXR1cygpe1xuICAgICAgICB2YXIgbnVtID0gdGhpcy5zdGF0ZS5yYWRpYXRpb24ubGFzdENhbGN1bGF0ZWRBdmVyYWdlLFxuICAgICAgICAgICAgY29sb3I7XG5cbiAgICAgICAgaWYgKG51bSA9PT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuICdJa2tlIGJlcmVnbmV0JztcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChudW0gPiBTY2llbmNlVGVhbUNvbnN0YW50cy5TQ0lFTkNFX0FWR19SQURfUkVEX1RIUkVTSE9MRCkge1xuICAgICAgICAgICAgY29sb3IgPSAncmVkJztcbiAgICAgICAgfSBlbHNlIGlmIChudW0gPiBTY2llbmNlVGVhbUNvbnN0YW50cy5TQ0lFTkNFX0FWR19SQURfT1JBTkdFX1RIUkVTSE9MRCkge1xuICAgICAgICAgICAgY29sb3IgPSAnb3JhbmdlJztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbG9yID0gJ2dyZWVuJztcbiAgICAgICAgfVxuXG5cbiAgICAgICAgcmV0dXJuICg8ZGl2XG4gICAgICAgICAgICBjbGFzc05hbWU9XCJyYWRpYXRpb24taW5kaWNhdG9yIGNpcmNsZSBjb2wteHMtMlwiXG4gICAgICAgICAgICBzdHlsZT17IHsgJ2JhY2tncm91bmRDb2xvcicgOiBjb2xvciB9IH1cbiAgICAgICAgICAgID5cbiAgICAgICAgICAgIHtudW0gfVxuICAgICAgICA8L2Rpdj4pO1xuXG4gICAgfSxcblxuICAgIHJlbmRlcigpIHtcbiAgICAgICAgbGV0IHNob3dTYW1wbGVJbnB1dCA9IHRoaXMuX2lzQ3VycmVudFRhc2soJ3NhbXBsZScpLFxuICAgICAgICAgICAgc2hvd0F2ZXJhZ2VJbnB1dCA9IHRoaXMuX2lzQ3VycmVudFRhc2soJ2F2ZXJhZ2UnKSxcbiAgICAgICAgICAgIHNob3dBZGRUb1RvdGFsSW5wdXQgPSB0aGlzLl9pc0N1cnJlbnRUYXNrKCdhZGR0b3RhbCcpO1xuXG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICA8ZGl2ID5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT0ncm93Jz5cblxuICAgICAgICAgICAgICAgICAgICA8ZGwgY2xhc3NOYW1lPSdyYWRpYXRpb24tdmFsdWVzIGNvbC14cy02ICc+XG4gICAgICAgICAgICAgICAgICAgICAgICA8ZHQ+VG90YWx0IHN0csOlbGluZ3NuaXbDpTwvZHQ+XG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGQ+e3RoaXMuc3RhdGUucmFkaWF0aW9uLnRvdGFsfTwvZGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICA8ZHQ+U2lzdCBpbm5sZXN0IHN0csOlbGluZ3NuaXbDpTwvZHQ+XG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGQ+eyB0aGlzLl9yYWRpYXRpb25TdGF0dXMoKX0gPC9kZD5cbiAgICAgICAgICAgICAgICAgICAgPC9kbD5cblxuICAgICAgICAgICAgICAgICAgICA8UmFkaWF0aW9uVGFibGVcbiAgICAgICAgICAgICAgICAgICAgICAgIG1pbmltYWxSb3dzVG9TaG93PXs0fVxuICAgICAgICAgICAgICAgICAgICAgICAgc2FtcGxlcz17dGhpcy5zdGF0ZS5yYWRpYXRpb24uc2FtcGxlc31cbiAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT0nY29sLXhzLTYgJy8+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgICAgICA8aHIvPlxuXG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJpbnN0cnVtZW50c1wiPlxuXG4gICAgICAgICAgICAgICAgICAgIDxmaWVsZHNldCBkaXNhYmxlZD17IXNob3dTYW1wbGVJbnB1dH0gY2xhc3NOYW1lPSdpbnN0cnVtZW50c19fc2VjdGlvbiByb3cgb3ZlcmxheWFibGUnPlxuICAgICAgICAgICAgICAgICAgICAgICAgPE92ZXJsYXkgYWN0aXZlPXsgIXNob3dTYW1wbGVJbnB1dCB9Lz5cblxuICAgICAgICAgICAgICAgICAgICAgICAgPGgzIGNsYXNzTmFtZT0nY29sLXhzLTEyJz5UYSBwcsO4dmVyPC9oMz5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxUaW1lclBhbmVsIGNsYXNzTmFtZT0nY29sLXhzLTEyIGNvbC1zbS04JyB0aW1lcklkPXtTY2llbmNlVGVhbUNvbnN0YW50cy5TQ0lFTkNFX1RJTUVSXzF9Lz5cblxuICAgICAgICAgICAgICAgICAgICAgICAgPFJhZGlhdGlvblNhbXBsZUJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT0nY29sLXhzLTUgY29sLXNtLTQnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmFkaWF0aW9uU3RvcmVTdGF0ZT17dGhpcy5zdGF0ZS5yYWRpYXRpb259XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVxdWlyZWRTYW1wbGVzPXs0fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgICAgIDwvZmllbGRzZXQ+XG5cbiAgICAgICAgICAgICAgICAgICAgPGhyIC8+XG5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJyb3cgb3ZlcmxheWFibGVcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxPdmVybGF5IGFjdGl2ZT17ICFzaG93QXZlcmFnZUlucHV0IH0vPlxuXG4gICAgICAgICAgICAgICAgICAgICAgICA8c2VjdGlvbiBjbGFzc05hbWU9XCJyYWRpYXRpb24taW5wdXQgaW5zdHJ1bWVudHNfX3NlY3Rpb24gY29sLXhzLTEyIGNvbC1zbS02XCI+XG5cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicm93XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxoMyBjbGFzc05hbWU9J2NvbC14cy0xMic+R2plbm5vbXNuaXR0bGlnIHN0csOlbGluZzwvaDM+XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGZpZWxkc2V0IGNsYXNzTmFtZT1cImNvbC14cy04XCIgZGlzYWJsZWQ9eyAhc2hvd0F2ZXJhZ2VJbnB1dCB9PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGZvcm0gb25TdWJtaXQ9e3RoaXMuX2hhbmRsZUF2ZXJhZ2VSYWRpYXRpb25TdWJtaXR9PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxpbnB1dCByZWY9J2F2ZXJhZ2UtaW5wdXQnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJudW1iZXJcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGVwPVwiMC4xXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWluPVwiMVwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1heD1cIjEwMFwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT0ncmFkaWF0aW9uLWlucHV0X19pbnB1dCdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uIGNsYXNzTmFtZT0nYnRuIGJ0bi1wcmltYXJ5Jz5FdmFsdWVyPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Zvcm0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZmllbGRzZXQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L3NlY3Rpb24+XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICAgICAgICAgIDxoci8+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicm93IG92ZXJsYXlhYmxlXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8T3ZlcmxheSBhY3RpdmU9eyAhc2hvd0FkZFRvVG90YWxJbnB1dCB9Lz5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxmaWVsZHNldCBjbGFzc05hbWU9J3JhZGlhdGlvbi1pbnB1dCBjb2wteHMtOCcgZGlzYWJsZWQ9eyEgc2hvd0FkZFRvVG90YWxJbnB1dCB9PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxoMz5MZWdnIHZlcmRpIHRpbCB0b3RhbDwvaDM+XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8Zm9ybSBvblN1Ym1pdD17dGhpcy5faGFuZGxlQWRkVG9Ub3RhbFN1Ym1pdH0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzZWxlY3QgcmVmPSdhZGQtdG8tdG90YWwnIGNsYXNzTmFtZT0ncmFkaWF0aW9uLWlucHV0X19pbnB1dCc+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPScwJz4wPC9vcHRpb24+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPScxNSc+MTU8L29wdGlvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9JzUwJz41MDwvb3B0aW9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3NlbGVjdD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvbiBjbGFzc05hbWU9J2J0biBidG4tcHJpbWFyeSc+RXZhbHVlcjwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZm9ybT5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvZmllbGRzZXQ+XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKTtcbiAgICB9XG5cbn0pO1xuIiwiY29uc3QgUmVhY3QgPSByZXF1aXJlKCdyZWFjdCcpO1xuY29uc3QgQ08yU3RvcmUgPSByZXF1aXJlKCcuLi9zdG9yZXMvY2FyYm9uLWRpb3hpZGUtc3RvcmUnKTtcbmNvbnN0IE94eWdlblN0b3JlID0gcmVxdWlyZSgnLi4vc3RvcmVzL294eWdlbi1zdG9yZScpO1xuY29uc3QgQ29tbXVuaWNhdGlvblF1YWxpdHlTdG9yZSA9IHJlcXVpcmUoJy4uL3N0b3Jlcy9jb21tdW5pY2F0aW9uLXF1YWxpdHktc3RvcmUnKTtcbmNvbnN0IE1lc3NhZ2VBY3Rpb25DcmVhdG9ycyA9IHJlcXVpcmUoJy4uL2FjdGlvbnMvTWVzc2FnZUFjdGlvbkNyZWF0b3JzJyk7XG5cbnZhciBjaGFydCA9IG51bGw7XG52YXIgY2hhcnREYXRhID0gW3t0aXRsZTogJ0x1ZnQnLCB2YWx1ZTogMTAwfV07XG5cbmZ1bmN0aW9uIGluaXQoZG9tRWxlbSkge1xuICAgIGNoYXJ0ID0gbmV3IEFtQ2hhcnRzLkFtUGllQ2hhcnQoKTtcbiAgICBjaGFydC52YWx1ZUZpZWxkID0gXCJ2YWx1ZVwiO1xuICAgIGNoYXJ0LnRpdGxlRmllbGQgPSBcInRpdGxlXCI7XG4gICAgY2hhcnQuZGF0YVByb3ZpZGVyID0gY2hhcnREYXRhO1xuICAgIGNoYXJ0LndyaXRlKGRvbUVsZW0pO1xufVxuXG52YXIgUGllQ2hhcnQgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cbiAgICBwcm9wVHlwZXM6IHtcbiAgICAgICAgaGVpZ2h0OiBSZWFjdC5Qcm9wVHlwZXMuc3RyaW5nLmlzUmVxdWlyZWQsXG4gICAgICAgIHdpZHRoOiBSZWFjdC5Qcm9wVHlwZXMuc3RyaW5nXG4gICAgfSxcblxuICAgIGNvbXBvbmVudFdpbGxNb3VudCgpIHtcbiAgICAgICAgQ08yU3RvcmUuYWRkQ2hhbmdlTGlzdGVuZXIoKCkgPT4gdGhpcy5fdXBkYXRlRGF0YSgpKTtcbiAgICB9LFxuXG4gICAgY29tcG9uZW50RGlkTW91bnQoKXtcbiAgICAgICAgdmFyIGVsID0gUmVhY3QuZmluZERPTU5vZGUodGhpcyk7XG4gICAgICAgIGluaXQoZWwpO1xuICAgIH0sXG5cbiAgICBzaG91bGRDb21wb25lbnRVcGRhdGUoKXtcbiAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgfSxcblxuICAgIF91cGRhdGVEYXRhKCl7XG4gICAgICAgIHZhciBjbzIgPSBDTzJTdG9yZS5jbzJMZXZlbCgpO1xuICAgICAgICBjaGFydERhdGEubGVuZ3RoID0gMDtcbiAgICAgICAgY2hhcnREYXRhLnB1c2goe3RpdGxlOiAnQW5uZW4gbHVmdCcsIHZhbHVlOiAxMDAgLSBjbzJ9KTtcbiAgICAgICAgY2hhcnREYXRhLnB1c2goe3RpdGxlOiAnQ09cXHUyMDgyJywgdmFsdWU6IGNvMn0pO1xuXG4gICAgICAgIGNoYXJ0LnZhbGlkYXRlRGF0YSgpO1xuICAgIH0sXG5cbiAgICByZW5kZXIoKXtcbiAgICAgICAgcmV0dXJuIDxkaXYgc3R5bGU9e3toZWlnaHQgOiB0aGlzLnByb3BzLmhlaWdodCwgd2lkdGggOiB0aGlzLnByb3BzLndpZHRoIH19Lz47XG4gICAgfVxufSk7XG5cblxudmFyIFByb2dyZXNzQmFyID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXG4gICAgcHJvcFR5cGVzOiB7XG4gICAgICAgIHByb2dyZXNzOiBSZWFjdC5Qcm9wVHlwZXMubnVtYmVyLmlzUmVxdWlyZWQsXG4gICAgICAgIG1heDogUmVhY3QuUHJvcFR5cGVzLm51bWJlci5pc1JlcXVpcmVkLFxuICAgICAgICBhY3RpdmU6IFJlYWN0LlByb3BUeXBlcy5ib29sLmlzUmVxdWlyZWQsXG4gICAgICAgIGNsYXNzTmFtZTogUmVhY3QuUHJvcFR5cGVzLnN0cmluZ1xuICAgIH0sXG5cbiAgICByZW5kZXIoKXtcbiAgICAgICAgdmFyIHZhbCA9IHRoaXMucHJvcHMucHJvZ3Jlc3MsIG1heCA9IHRoaXMucHJvcHMubWF4O1xuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJwcm9ncmVzc1wiPlxuICAgICAgICAgICAgICAgIDxkaXZcbiAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPXsgXCJwcm9ncmVzcy1iYXIgcHJvZ3Jlc3MtYmFyLXN0cmlwZWQgXCIgKyB0aGlzLnByb3BzLmNsYXNzTmFtZSArICh0aGlzLnByb3BzLmFjdGl2ZT8gJyBhY3RpdmUnOicnKSB9XG4gICAgICAgICAgICAgICAgICAgIHN0eWxlPXt7d2lkdGggOiAgdmFsKm1heCArICclJ319XG4gICAgICAgICAgICAgICAgICAgIHJvbGU9XCJwcm9ncmVzc2JhclwiPntNYXRoLm1pbihNYXRoLnJvdW5kKHZhbCAqIG1heCksIG1heCl9JVxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+KTtcbiAgICB9XG59KTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblxuICAgIHN0YXRpY3M6IHt9LFxuXG4gICAgcHJvcFR5cGVzOiB7fSxcblxuICAgIG1peGluczogW10sXG5cbiAgICBnZXRJbml0aWFsU3RhdGUoKSB7XG4gICAgICAgIHZhciBzdGF0ZSA9IHRoaXMuX2dldFN0YXRlKCk7XG4gICAgICAgIHN0YXRlLmNvbW1Qcm9ncmVzcyA9IDA7XG4gICAgICAgIHN0YXRlLnF1YWxpdHlQcm9ncmVzcyA9IDA7XG4gICAgICAgIHN0YXRlLmRhdGFRdWFsaXR5RmFpbGluZyA9IHRydWU7XG4gICAgICAgIHJldHVybiBzdGF0ZTtcbiAgICB9LFxuXG4gICAgY29tcG9uZW50V2lsbE1vdW50KCkge1xuICAgICAgICBPeHlnZW5TdG9yZS5hZGRDaGFuZ2VMaXN0ZW5lcigoKSA9PiB0aGlzLl91cGRhdGVTdGF0ZSgpKTtcbiAgICB9LFxuXG4gICAgY29tcG9uZW50V2lsbFVubW91bnQoKSB7XG4gICAgfSxcblxuICAgIF9zdGFydFF1YWxpdHlQcm9ncmVzc0Jhcigpe1xuICAgICAgICB2YXIgbXMgPSAzMDAsIHRvdGFsRHVyYXRpb24gPSA1ICogMTAwMDtcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7cXVhbGl0eVByb2dyZXNzOiAwfSlcblxuICAgICAgICB2YXIgdG1wID0gc2V0SW50ZXJ2YWwoKCk9PiB7XG4gICAgICAgICAgICB2YXIgbnVtYmVyID0gdGhpcy5zdGF0ZS5xdWFsaXR5UHJvZ3Jlc3M7XG4gICAgICAgICAgICBudW1iZXIgKz0gbXMgLyB0b3RhbER1cmF0aW9uO1xuXG4gICAgICAgICAgICBpZiAobnVtYmVyID4gLjk5KSB7XG4gICAgICAgICAgICAgICAgY2xlYXJJbnRlcnZhbCh0bXApO1xuICAgICAgICAgICAgICAgIGlmKHRoaXMuc3RhdGUuZGF0YVF1YWxpdHlGYWlsaW5nKSB7XG4gICAgICAgICAgICAgICAgICAgIE1lc3NhZ2VBY3Rpb25DcmVhdG9ycy5hZGRNZXNzYWdlKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRleHQgOiAnS3ZhbGl0ZXRlbiBww6Uga29tbXVuaWthc2pvbnNzaWduYWxldCBlciBmb3IgZMOlcmxpZy4gRXIgcmVwYXJhc2pvbmVuIGZ1bGxmw7hydD8nLFxuICAgICAgICAgICAgICAgICAgICAgICAgbGV2ZWwgOiAnd2FybmluZycsXG4gICAgICAgICAgICAgICAgICAgICAgICBkdXJhdGlvbiA6IDEwXG4gICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZSh7cXVhbGl0eVByb2dyZXNzOiBudW1iZXJ9KVxuICAgICAgICB9LCBtcylcbiAgICB9LFxuXG5cbiAgICBfc3RhcnRDb21tUHJvZ3Jlc3NCYXIoKXtcbiAgICAgICAgdmFyIG1zID0gMzAwLCB0b3RhbER1cmF0aW9uID0gNSAqIDEwMDA7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe2NvbW1Qcm9ncmVzczogMH0pO1xuXG4gICAgICAgIHZhciB0bXAgPSBzZXRJbnRlcnZhbCgoKT0+IHtcbiAgICAgICAgICAgIHZhciBudW1iZXIgPSB0aGlzLnN0YXRlLmNvbW1Qcm9ncmVzcztcbiAgICAgICAgICAgIG51bWJlciArPSBtcyAvIHRvdGFsRHVyYXRpb247XG5cbiAgICAgICAgICAgIGlmIChudW1iZXIgPiAuOTkpIHtcbiAgICAgICAgICAgICAgICBjbGVhckludGVydmFsKHRtcCk7XG4gICAgICAgICAgICAgICAgaWYodGhpcy5zdGF0ZS5kYXRhVHJhbnNmZXJGYWlsaW5nKSB7XG4gICAgICAgICAgICAgICAgICAgIE1lc3NhZ2VBY3Rpb25DcmVhdG9ycy5hZGRNZXNzYWdlKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRleHQgOiAnT3ZlcmbDuHJpbmdlbiBhdiBkYXRhIHZhciBmb3IgdXN0YWJpbC4gVGVzdGVuIGZlaWxldC4nLFxuICAgICAgICAgICAgICAgICAgICAgICAgbGV2ZWwgOiAnd2FybmluZycsXG4gICAgICAgICAgICAgICAgICAgICAgICBkdXJhdGlvbiA6IDEwXG4gICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZSh7Y29tbVByb2dyZXNzOiBudW1iZXJ9KVxuICAgICAgICB9LCBtcylcbiAgICB9LFxuXG4gICAgX3F1YWxpdHlBY3RpdmUoKXtcbiAgICAgICAgcmV0dXJuICh0aGlzLnN0YXRlLnF1YWxpdHlQcm9ncmVzcyA8IDEpO1xuICAgIH0sXG5cbiAgICBfY29tbUFjdGl2ZSgpe1xuICAgICAgICByZXR1cm4gdGhpcy5zdGF0ZS5jb21tUHJvZ3Jlc3MgPCAxO1xuICAgIH0sXG5cbiAgICBfdXBkYXRlU3RhdGUoKXtcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh0aGlzLl9nZXRTdGF0ZSgpKTtcbiAgICB9LFxuXG4gICAgX2luZGljYXRvckNvbG9yKCl7XG4gICAgICAgIHJldHVybiB0aGlzLnN0YXRlLm94eWdlblN0b3JlLmNvbG9ySW5kaWNhdG9yO1xuICAgIH0sXG5cbiAgICBfZ2V0U3RhdGUoKXtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIG94eWdlblN0b3JlOiBPeHlnZW5TdG9yZS5nZXRTdGF0ZSgpLFxuICAgICAgICAgICAgZGF0YVF1YWxpdHlGYWlsaW5nOiBDb21tdW5pY2F0aW9uUXVhbGl0eVN0b3JlLnF1YWxpdHlUZXN0U2hvdWxkRmFpbCgpLFxuICAgICAgICAgICAgZGF0YVRyYW5zZmVyRmFpbGluZzogQ29tbXVuaWNhdGlvblF1YWxpdHlTdG9yZS50cmFuc2ZlclRlc3RTaG91bGQoKVxuICAgICAgICB9O1xuICAgIH0sXG5cbiAgICByZW5kZXIoKSB7XG5cbiAgICAgICAgdmFyIGluZGljYXRvciA9IDxkaXZcbiAgICAgICAgICAgIGNsYXNzTmFtZT1cImNpcmNsZSBcIlxuICAgICAgICAgICAgc3R5bGU9eyB7IGRpc3BsYXk6ICdpbmxpbmUtYmxvY2snLCBiYWNrZ3JvdW5kQ29sb3IgOiB0aGlzLl9pbmRpY2F0b3JDb2xvcigpIH0gfVxuICAgICAgICAgICAgLz47XG5cblxuICAgICAgICByZXR1cm4gKCA8ZGl2ID5cblxuXG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInJvd1wiPlxuXG4gICAgICAgICAgICAgICAgPHVsIGNsYXNzTmFtZT0nY29sLXNtLTYnPlxuICAgICAgICAgICAgICAgICAgICA8bGk+U2NydWJmaWx0ZXIgYnl0dGV0OiB7Q08yU3RvcmUuZmlsdGVyQ2hhbmdlZCgpID8gJ2phJyA6ICduZWknfTwvbGk+XG4gICAgICAgICAgICAgICAgICAgIDxsaT5Pa3N5Z2VuaW5kaWthdG9yOiB7aW5kaWNhdG9yfSA8L2xpPlxuICAgICAgICAgICAgICAgIDwvdWw+XG5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nY29sLXhzLTEyIGNvbC1zbS02Jz5cbiAgICAgICAgICAgICAgICAgICAgPGgzPklubmhvbGQga2FyYm9uZGlva3NpZCBpIGRyYWt0ZW4gYXYgdG90YWwgbHVmdG1lbmdkZTwvaDM+XG4gICAgICAgICAgICAgICAgICAgIDxQaWVDaGFydCBoZWlnaHQ9XCIyMDBweFwiLz5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJyb3dcIj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIlwiPlxuICAgICAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJcIj5Lb21tdW5pa2Fzam9uIG9nIGRhdGE8L3A+XG5cbiAgICAgICAgICAgICAgICAgICAgPHAgPktvbW11bmlrYXNqb25zc3RhdHVzIDwvcD5cbiAgICAgICAgICAgICAgICAgICAgPFByb2dyZXNzQmFyXG4gICAgICAgICAgICAgICAgICAgICAgICBtYXg9ezEwMH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGFjdGl2ZT17dGhpcy5fY29tbUFjdGl2ZSgpfVxuICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPXt0aGlzLnN0YXRlLmRhdGFUcmFuc2ZlckZhaWxpbmcgJiYgKCF0aGlzLl9jb21tQWN0aXZlKCk/ICdwcm9ncmVzcy1iYXItZGFuZ2VyJyA6ICcnKX1cbiAgICAgICAgICAgICAgICAgICAgICAgIHByb2dyZXNzPXt0aGlzLnN0YXRlLmNvbW1Qcm9ncmVzc30vPlxuXG4gICAgICAgICAgICAgICAgICAgIDxidXR0b24gb25DbGljaz17dGhpcy5fc3RhcnRDb21tUHJvZ3Jlc3NCYXJ9XG4gICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJidG4gYnRuLXByaW1hcnlcIj5UZXN0PC9idXR0b24+XG5cbiAgICAgICAgICAgICAgICAgICAgPHAgPkRhdGFrdmFsaXRldDwvcD5cblxuICAgICAgICAgICAgICAgICAgICA8UHJvZ3Jlc3NCYXJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1heD17MTAwfVxuICAgICAgICAgICAgICAgICAgICAgICAgYWN0aXZlPXt0aGlzLl9xdWFsaXR5QWN0aXZlKCl9XG4gICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9e3RoaXMuc3RhdGUuZGF0YVF1YWxpdHlGYWlsaW5nICYmICghdGhpcy5fcXVhbGl0eUFjdGl2ZSgpPyAncHJvZ3Jlc3MtYmFyLWRhbmdlcicgOiAnJyl9XG4gICAgICAgICAgICAgICAgICAgICAgICBwcm9ncmVzcz17dGhpcy5zdGF0ZS5xdWFsaXR5UHJvZ3Jlc3N9Lz5cbiAgICAgICAgICAgICAgICAgICAgPGJ1dHRvbiBjbGFzc05hbWU9XCJidG4gYnRuLXByaW1hcnlcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9e3RoaXMuX3N0YXJ0UXVhbGl0eVByb2dyZXNzQmFyfVxuICAgICAgICAgICAgICAgICAgICAgICAgPlRlc3RcbiAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgIDwvZGl2PiApO1xuICAgIH1cblxufSk7XG5cbiIsImNvbnN0IFJlYWN0ID0gcmVxdWlyZSgncmVhY3QnKSxcbiAgICBSb3V0ZXIgPSByZXF1aXJlKCdyZWFjdC1yb3V0ZXInKSxcbiAgICBNZXNzYWdlU3RvcmUgPSByZXF1aXJlKCcuLi9zdG9yZXMvbWVzc2FnZS1zdG9yZScpLFxuICAgIFRhc2tTdG9yZSA9IHJlcXVpcmUoJy4uL3N0b3Jlcy90YXNrLXN0b3JlJyksXG4gICAgUm91dGVTdG9yZSA9IHJlcXVpcmUoJy4uL3N0b3Jlcy9yb3V0ZS1zdG9yZScpLFxuICAgIE1lc3NhZ2VMaXN0ID0gcmVxdWlyZSgnLi9tZXNzYWdlLWxpc3QucmVhY3QnKSxcbiAgICBJbnRyb2R1Y3Rpb25TY3JlZW4gPSByZXF1aXJlKCcuL2ludHJvZHVjdGlvbi1zY3JlZW4ucmVhY3QuanMnKSxcbiAgICBUZWFtRGlzcGxheWVyID0gcmVxdWlyZSgnLi90ZWFtLWRpc3BsYXllci5yZWFjdCcpLFxuICAgIE1pc3Npb25UaW1lciA9IHJlcXVpcmUoJy4vbWlzc2lvbi10aW1lci5yZWFjdC5qcycpLFxuICAgIFNjaWVuY2VUYXNrID0gcmVxdWlyZSgnLi9zY2llbmNlLXRhc2sucmVhY3QnKSxcbiAgICBBc3Ryb25hdXRUYXNrID0gcmVxdWlyZSgnLi9hc3Ryb25hdXQtdGFzay5yZWFjdCcpLFxuICAgIENvbW11bmljYXRpb25UYXNrID0gcmVxdWlyZSgnLi9jb21tdW5pY2F0aW9uLXRhc2sucmVhY3QuanMnKSxcbiAgICBTZWN1cml0eVRhc2sgPSByZXF1aXJlKCcuL3NlY3VyaXR5LXRhc2sucmVhY3QuanMnKSxcbiAgICB7IGZvcm1hdCB9ID0gcmVxdWlyZSgndXRpbCcpO1xuXG4vLyBsYXp5cmVxdWlyZVxuZnVuY3Rpb24gbGF6eVJlcXVpcmUocGF0aCkge1xuICAgIGxldCB0bXAgPSBudWxsO1xuICAgIHJldHVybiAoKT0+IHtcbiAgICAgICAgaWYgKCF0bXApIHRtcCA9IHJlcXVpcmUocGF0aCk7XG4gICAgICAgIHJldHVybiB0bXA7XG4gICAgfVxufVxuaWYgKGZhbHNlKSB7XG4gICAgcmVxdWlyZSgnLi4vYWN0aW9ucy9NaXNzaW9uQWN0aW9uQ3JlYXRvcnMnKTtcbn1cbmNvbnN0IGdldE1pc3Npb25BQyA9IGxhenlSZXF1aXJlKCcuLi9hY3Rpb25zL01pc3Npb25BY3Rpb25DcmVhdG9ycycpO1xuXG5mdW5jdGlvbiB1cmxPZlRhc2sodGFza0lkKSB7XG4gICAgcmV0dXJuIGZvcm1hdCgnLyVzL3Rhc2svJXMnLCBSb3V0ZVN0b3JlLmdldFRlYW1JZCgpLCB0YXNrSWQpO1xufVxuXG5mdW5jdGlvbiB0cmFuc2l0aW9uVG9DdXJyZW50VGFzayh0cmFuc2l0aW9uRnVuY3Rpb24pIHtcbiAgICB2YXIgY3VycmVudFRhc2tJZCA9IFRhc2tTdG9yZS5nZXRDdXJyZW50VGFza0lkKCk7XG5cbiAgICAvLyB0aGlzIGxvZ2ljIGlzIGZyYWdpbGUgLSBpZiB5b3Ugc2hvdWxkIHN1ZGRlbmx5IGRlY2lkZSB0byB2aXNpdCBhbm90aGVyIHRlYW1cbiAgICAvLyBfYWZ0ZXJfIHlvdSBoYXZlIHN0YXJ0ZWQgYSB0YXNrLCB0aGUgdGVhbSt0YXNrIGNvbWJvIGlzIGludmFsaWQgLT4gNDA0XG4gICAgaWYgKGN1cnJlbnRUYXNrSWQgIT09IFJvdXRlU3RvcmUuZ2V0VGFza0lkKCkpIHtcbiAgICAgICAgdmFyIHRvID0gdXJsT2ZUYXNrKGN1cnJlbnRUYXNrSWQpO1xuICAgICAgICB0cmFuc2l0aW9uRnVuY3Rpb24odG8pO1xuICAgIH1cblxufVxuXG5jb25zdCBUYXNrID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXG4gICAgY29udGV4dFR5cGVzOiB7XG4gICAgICAgIHJvdXRlcjogUmVhY3QuUHJvcFR5cGVzLmZ1bmNcbiAgICB9LFxuXG4gICAgbWl4aW5zOiBbXSxcblxuICAgIHN0YXRpY3M6IHtcbiAgICAgICAgd2lsbFRyYW5zaXRpb25Ubyh0cmFuc2l0aW9uKSB7XG4gICAgICAgICAgICB0cmFuc2l0aW9uVG9DdXJyZW50VGFzayh0cmFuc2l0aW9uLnJlZGlyZWN0LmJpbmQodHJhbnNpdGlvbikpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbiAoKSB7XG4gICAgfSxcblxuICAgIGNvbXBvbmVudFdpbGxNb3VudDogZnVuY3Rpb24gKCkge1xuICAgICAgICBNZXNzYWdlU3RvcmUuYWRkQ2hhbmdlTGlzdGVuZXIodGhpcy5fb25DaGFuZ2UpO1xuICAgICAgICBUYXNrU3RvcmUuYWRkQ2hhbmdlTGlzdGVuZXIodGhpcy5fb25DaGFuZ2UpO1xuICAgICAgICAvL2NvbnNvbGUubG9nKCdjb21wb25lbnRXaWxsTW91bnQnKTtcbiAgICB9LFxuXG4gICAgY29tcG9uZW50V2lsbFVubW91bnQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgLy9jb25zb2xlLmxvZygnY29tcG9uZW50V2lsbFVubW91bnQnKTtcbiAgICAgICAgTWVzc2FnZVN0b3JlLnJlbW92ZUNoYW5nZUxpc3RlbmVyKHRoaXMuX29uQ2hhbmdlKTtcbiAgICAgICAgVGFza1N0b3JlLnJlbW92ZUNoYW5nZUxpc3RlbmVyKHRoaXMuX29uQ2hhbmdlKTtcblxuICAgICAgICBjbGVhclRpbWVvdXQodGhpcy5fc3RhdGVUaW1lb3V0KTtcbiAgICB9LFxuXG4gICAgY29tcG9uZW50RGlkVW5tb3VudDogZnVuY3Rpb24gKCkge1xuICAgICAgICAvL2NvbnNvbGUubG9nKCdjb21wb25lbnREaWRVbm1vdW50Jyk7XG4gICAgfSxcblxuICAgIGNvbXBvbmVudERpZFVwZGF0ZSgpIHtcbiAgICAgICAgLy9jb25zb2xlLmxvZygnLmNvbXBvbmVudERpZFVwZGF0ZScpO1xuICAgIH0sXG5cbiAgICBnZXRJbml0aWFsU3RhdGUoKSB7XG5cbiAgICAgICAgc2V0VGltZW91dCgoKT0+IHRoaXMuc2V0U3RhdGUoe3Rhc2tJc05ldzogZmFsc2V9KSwgMjAwMCk7XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIG1lc3NhZ2VzOiBNZXNzYWdlU3RvcmUuZ2V0TWVzc2FnZXMoKSxcbiAgICAgICAgICAgIHRhc2tTdG9yZTogVGFza1N0b3JlLmdldFN0YXRlKCksXG4gICAgICAgICAgICB0YXNrSXNOZXc6IHRydWVcbiAgICAgICAgfTtcbiAgICB9LFxuXG4gICAgX29uQ2hhbmdlKCkge1xuICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgIG1lc3NhZ2VzOiBNZXNzYWdlU3RvcmUuZ2V0TWVzc2FnZXMoKSxcbiAgICAgICAgICAgIHRhc2tTdG9yZTogVGFza1N0b3JlLmdldFN0YXRlKCksXG4gICAgICAgICAgICB0YXNrSXNOZXc6IHRydWVcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdmFyIHJvdXRlciA9IHRoaXMuY29udGV4dC5yb3V0ZXI7XG4gICAgICAgIHRyYW5zaXRpb25Ub0N1cnJlbnRUYXNrKHJvdXRlci50cmFuc2l0aW9uVG8uYmluZChyb3V0ZXIpKTtcblxuICAgICAgICAvLyBhIGJpdCBydWRpbWVudGFyeSAtIHRyaWdnZXJzIG9uIGFsbCBjaGFuZ2VzLCBub3QganVzdCBUYXNrIGNoYW5nZXMgLi4uXG4gICAgICAgIHRoaXMuX3N0YXRlVGltZW91dCA9IHNldFRpbWVvdXQoKCk9PiB0aGlzLnNldFN0YXRlKHt0YXNrSXNOZXc6IGZhbHNlfSksIDIwMDApO1xuICAgIH0sXG5cbiAgICBfY3JlYXRlU3ViVGFza1VJKCkge1xuICAgICAgICBzd2l0Y2ggKFJvdXRlU3RvcmUuZ2V0VGVhbUlkKCkpIHtcbiAgICAgICAgICAgIGNhc2UgJ3NjaWVuY2UnOlxuICAgICAgICAgICAgICAgIHJldHVybiA8U2NpZW5jZVRhc2sgYXBwc3RhdGU9e3RoaXMuc3RhdGV9Lz47XG4gICAgICAgICAgICBjYXNlICdhc3Ryb25hdXQnOlxuICAgICAgICAgICAgICAgIHJldHVybiA8QXN0cm9uYXV0VGFzayBhcHBzdGF0ZT17dGhpcy5zdGF0ZX0vPjtcbiAgICAgICAgICAgIGNhc2UgJ2NvbW11bmljYXRpb24nOlxuICAgICAgICAgICAgICAgIHJldHVybiA8Q29tbXVuaWNhdGlvblRhc2sgYXBwc3RhdGU9e3RoaXMuc3RhdGV9Lz47XG4gICAgICAgICAgICBjYXNlICdzZWN1cml0eSc6XG4gICAgICAgICAgICAgICAgcmV0dXJuIDxTZWN1cml0eVRhc2sgYXBwc3RhdGU9e3RoaXMuc3RhdGV9Lz47XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgX2hhbmRsZVRhc2tPS0NsaWNrKCl7XG4gICAgICAgICBnZXRNaXNzaW9uQUMoKS50YXNrQ29tcGxldGVkKCBSb3V0ZVN0b3JlLmdldFRlYW1JZCgpLCAgdGhpcy5zdGF0ZS50YXNrU3RvcmUuY3VycmVudFRhc2tJZCk7XG4gICAgfSxcblxuICAgIHJlbmRlcigpIHtcbiAgICAgICAgbGV0IGNvbnRlbnQgPSB0aGlzLl9jcmVhdGVTdWJUYXNrVUkoKSxcbiAgICAgICAgICAgIGJsaW5rID0gdGhpcy5zdGF0ZS50YXNrSXNOZXcgPyAnYmxpbmsnIDogJycsXG4gICAgICAgICAgICB0ZWFtTmFtZXMsIG1pc3Npb25UaW1lcjtcblxuXG4gICAgICAgIHRlYW1OYW1lcyA9IChcbiAgICAgICAgICAgIDxkaXYgaWQ9J3RlYW0tbmFtZScgY2xhc3NOYW1lPScnPlxuICAgICAgICAgICAgICAgIDxoZWFkZXIgY2xhc3NOYW1lPScnPlxuICAgICAgICAgICAgICAgICAgICA8VGVhbURpc3BsYXllciBjbGFzc05hbWU9JycvPlxuICAgICAgICAgICAgICAgIDwvaGVhZGVyPlxuICAgICAgICAgICAgPC9kaXY+KTtcblxuICAgICAgICBtaXNzaW9uVGltZXIgPSAoXG4gICAgICAgICAgICA8c2VjdGlvbiBpZD0nbWlzc2lvbi10aW1lcicgY2xhc3NOYW1lPScnPlxuICAgICAgICAgICAgICAgIDxNaXNzaW9uVGltZXIgLz5cbiAgICAgICAgICAgIDwvc2VjdGlvbj4gKTtcblxuICAgICAgICBpZiAoIXRoaXMucHJvcHMuaXNNaXNzaW9uUnVubmluZykge1xuICAgICAgICAgICAgbGV0IG1lc3NhZ2UgPSB7XG4gICAgICAgICAgICAgICAgaWQ6ICdub3RfdXNlZCcsXG4gICAgICAgICAgICAgICAgdGV4dDogJ0lra2Uga2xhci4gVmVudGVyIHDDpSBhdCBvcHBkcmFnZXQgc2thbCBzdGFydGUuJyxcbiAgICAgICAgICAgICAgICBsZXZlbDogJ2luZm8nXG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgICAgICAgIHsgdGVhbU5hbWVzIH1cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJyb3dcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxNZXNzYWdlTGlzdCBjbGFzc05hbWU9J2NvbC14cy0xMidcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlcz17W21lc3NhZ2VdfS8+XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIDwvZGl2Pik7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9Jyc+XG4gICAgICAgICAgICAgICAge3RlYW1OYW1lc31cbiAgICAgICAgICAgICAgICB7bWlzc2lvblRpbWVyfVxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicm93XCI+XG4gICAgICAgICAgICAgICAgICAgIDxNZXNzYWdlTGlzdCBjbGFzc05hbWU9J2NvbC14cy0xMicgbWVzc2FnZXM9e3RoaXMuc3RhdGUubWVzc2FnZXN9Lz5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgICAgIHsgLyogaWYgeW91IHdhbnQgdGhpcyB0byBiZSBzdGlja3k6IGh0dHA6Ly9jb2RlcGVuLmlvL3NlbmZmL3Blbi9heUd2RCAqLyB9XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJyb3dcIj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJjb2wteHMtMTJcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPSdqdW1ib3Ryb24gdGFza2JveCc+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGgyIGNsYXNzTmFtZT0ndGFza2JveF9faGVhZGVyJz5PcHBnYXZlPC9oMj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9eyd0YXNrYm94X190ZXh0ICcgKyBibGlua30+IHt0aGlzLnN0YXRlLnRhc2tTdG9yZS5jdXJyZW50VGFza30gPC9zcGFuPlxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgeyB0aGlzLnN0YXRlLnRhc2tTdG9yZS5wbGFpbkluZm9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAmJiA8YnV0dG9uIGNsYXNzTmFtZT1cImJ0bi1wcmltYXJ5IGJ0blwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsgdGhpcy5faGFuZGxlVGFza09LQ2xpY2sgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA+T0s8L2J1dHRvbj4gfVxuICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICAgICAge2NvbnRlbnR9XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKTtcbiAgICB9XG5cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFRhc2s7XG4iLCJjb25zdCBSZWFjdCA9IHJlcXVpcmUoJ3JlYWN0Jyk7XG5jb25zdCBSb3V0ZVN0b3JlID0gcmVxdWlyZSgnLi4vc3RvcmVzL3JvdXRlLXN0b3JlJyk7XG5jb25zdCB0ZWFtTmFtZXMgPSByZXF1aXJlKCcuLi90ZWFtLW5hbWUtbWFwJyk7XG5cbmNvbnN0IFRlYW1XaWRnZXQgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cbiAgICBjb250ZXh0VHlwZXM6IHtcbiAgICAgICAgcm91dGVyOiBSZWFjdC5Qcm9wVHlwZXMuZnVuY1xuICAgIH0sXG5cbiAgICBtaXhpbnM6IFtdLFxuXG4gICAgX29uQ2hhbmdlKCkge1xuICAgICAgICB0aGlzLmZvcmNlVXBkYXRlKCk7XG4gICAgfSxcblxuICAgIGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIC8vUm91dGVTdG9yZS5hZGRDaGFuZ2VMaXN0ZW5lcih0aGlzLl9vbkNoYW5nZSk7XG4gICAgfSxcblxuICAgIGNvbXBvbmVudFdpbGxVbm1vdW50OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIC8vUm91dGVTdG9yZS5yZW1vdmVDaGFuZ2VMaXN0ZW5lcih0aGlzLl9vbkNoYW5nZSk7XG5cbiAgICB9LFxuXG4gICAgdGVhbU5hbWUoKSB7XG4gICAgICAgIHJldHVybiB0ZWFtTmFtZXMubmFtZU1hcFsoUm91dGVTdG9yZS5nZXRUZWFtSWQoKSldO1xuICAgIH0sXG5cbiAgICBvdGhlclRlYW1OYW1lcygpIHtcbiAgICAgICAgcmV0dXJuIHRlYW1OYW1lcy5vdGhlclRlYW1OYW1lcyhSb3V0ZVN0b3JlLmdldFRlYW1JZCgpKTtcbiAgICB9LFxuXG4gICAgcmVuZGVyKCkge1xuXG4gICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lID0geyB0aGlzLnByb3BzLmNsYXNzTmFtZSArICcgdGVhbXdpZGdldCd9ID5cbiAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lID0gJ2FjdGl2ZScgPnsgdGhpcy50ZWFtTmFtZSgpICB9PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWUgPSAnJz4sIHsgdGhpcy5vdGhlclRlYW1OYW1lcygpIH0gPC9zcGFuPlxuICAgICAgICAgICAgICAgIDwvZGl2PiApO1xuICAgIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFRlYW1XaWRnZXQ7XG4iLCJ2YXIgUmVhY3QgPSByZXF1aXJlKCdyZWFjdCcpLFxuICAgIGFjdGlvbnMgPSByZXF1aXJlKCcuLi9hY3Rpb25zL1RpbWVyQWN0aW9uQ3JlYXRvcnMnKSxcbiAgICBUaW1lciA9IHJlcXVpcmUoJy4vdGltZXIucmVhY3QuanMnKSxcbiAgICBUaW1lclN0b3JlID0gcmVxdWlyZSgnLi4vc3RvcmVzL3RpbWVyLXN0b3JlJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXG4gICAgcHJvcFR5cGVzOiB7XG4gICAgICAgIHRpbWVySWQ6IFJlYWN0LlByb3BUeXBlcy5zdHJpbmcuaXNSZXF1aXJlZFxuICAgIH0sXG5cbiAgICBnZXRJbml0aWFsU3RhdGUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9nZXRUaW1lclN0YXRlKCk7XG4gICAgfSxcblxuICAgIGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIFRpbWVyU3RvcmUuYWRkQ2hhbmdlTGlzdGVuZXIodGhpcy5faGFuZGxlVGltZVN0b3JlQ2hhbmdlKTtcbiAgICB9LFxuXG4gICAgY29tcG9uZW50V2lsbFVubW91bnQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgVGltZXJTdG9yZS5yZW1vdmVDaGFuZ2VMaXN0ZW5lcih0aGlzLl9oYW5kbGVUaW1lU3RvcmVDaGFuZ2UpO1xuICAgIH0sXG5cbiAgICBzaG91bGRDb21wb25lbnRVcGRhdGUobmV4dFByb3BzLCBuZXh0U3RhdGUpIHtcbiAgICAgICAgcmV0dXJuIG5leHRTdGF0ZS50aW1lSW5TZWNvbmRzICE9PSB0aGlzLnN0YXRlLnRpbWVJblNlY29uZHM7XG4gICAgfSxcblxuICAgIGNvbXBvbmVudERpZFVwZGF0ZSgpIHtcbiAgICAgICAgLy9jb25zb2xlLmxvZygnVGltZXJQYW5lbC5jb21wb25lbnREaWRVcGRhdGUnKTtcbiAgICB9LFxuXG4gICAgX2hhbmRsZVRpbWVTdG9yZUNoYW5nZSgpIHtcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh0aGlzLl9nZXRUaW1lclN0YXRlKCkpO1xuICAgIH0sXG5cbiAgICBfaGFuZGxlQ2xpY2soKSB7XG4gICAgICAgIGFjdGlvbnMuc3RhcnRUaW1lcih0aGlzLnByb3BzLnRpbWVySWQpO1xuICAgIH0sXG5cbiAgICBfZ2V0VGltZXJTdGF0ZSgpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJlYWR5OiBUaW1lclN0b3JlLmlzUmVhZHlUb1N0YXJ0KHRoaXMucHJvcHMudGltZXJJZCksXG4gICAgICAgICAgICB0aW1lSW5TZWNvbmRzOiBUaW1lclN0b3JlLmdldFJlbWFpbmluZ1RpbWUodGhpcy5wcm9wcy50aW1lcklkKVxuICAgICAgICB9O1xuICAgIH0sXG5cbiAgICByZW5kZXIoKSB7XG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICA8c2VjdGlvbiBjbGFzc05hbWU9e1widGltZXIgXCIgKyB0aGlzLnByb3BzLmNsYXNzTmFtZSB9PlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicm93XCI+XG5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9J3RpbWVyLS1idXR0b24gY29sLXhzLTUgJz5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9eyAnYnRuIGJ0bi1wcmltYXJ5ICcgKyAodGhpcy5zdGF0ZS5yZWFkeSA/ICcnIDogJ2Rpc2FibGVkJyApIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXt0aGlzLl9oYW5kbGVDbGlja30+U3RhcnQga2xva2thXG4gICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPSd0aW1lci0tdmFsdWUgY29sLXhzLTYgcGFkZGluZy14cy0xJz5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxUaW1lciB0aW1lSW5TZWNvbmRzPXt0aGlzLnN0YXRlLnRpbWVJblNlY29uZHN9Lz5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8L3NlY3Rpb24+XG4gICAgICAgICk7XG4gICAgfVxufSkiLCIvLyBUaGlzIGV4YW1wbGUgY2FuIGJlIG1vZGlmaWVkIHRvIGFjdCBhcyBhIGNvdW50ZG93biB0aW1lclxuXG5cbmNvbnN0IFJlYWN0ID0gcmVxdWlyZSgncmVhY3QnKSxcbiAgICBwcmludGYgPSByZXF1aXJlKCdwcmludGYnKTtcblxuZnVuY3Rpb24gcGFkKG51bSkge1xuICAgIHJldHVybiBwcmludGYoJyUwMmQnLCBudW0pO1xufVxuXG5cbmNvbnN0IFRpbWVyID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXG4gICAgcHJvcFR5cGVzOiB7XG4gICAgICAgIHRpbWVJblNlY29uZHM6IFJlYWN0LlByb3BUeXBlcy5udW1iZXIuaXNSZXF1aXJlZFxuICAgIH0sXG5cbiAgICBjb21wb25lbnREaWRVcGRhdGUoKSB7XG4gICAgICAgIC8vY29uc29sZS5sb2coJ1RpbWVyLmNvbXBvbmVudERpZFVwZGF0ZScpO1xuICAgIH0sXG5cbiAgICBzaG91bGRDb21wb25lbnRVcGRhdGUobmV4dFByb3BzLCBuZXh0U3RhdGUpIHtcbiAgICAgICAgcmV0dXJuIG5leHRQcm9wcy50aW1lSW5TZWNvbmRzICE9PSB0aGlzLnByb3BzLnRpbWVJblNlY29uZHM7XG4gICAgfSxcblxuICAgIF9taW51dGVzKCkge1xuICAgICAgICByZXR1cm4gcGFkKE1hdGgubWF4KDAsIHRoaXMucHJvcHMudGltZUluU2Vjb25kcykgLyA2MCA+PiAwKTtcbiAgICB9LFxuXG4gICAgX3NlY29uZHMoKSB7XG4gICAgICAgIHJldHVybiBwYWQoTWF0aC5tYXgoMCwgdGhpcy5wcm9wcy50aW1lSW5TZWNvbmRzKSAlIDYwKTtcbiAgICB9LFxuXG4gICAgX3RpbWVWYWx1ZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX21pbnV0ZXMoKSArICc6JyArIHRoaXMuX3NlY29uZHMoKTtcbiAgICB9LFxuXG4gICAgcmVuZGVyKCkge1xuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9J3RpbWVyLXZhbHVlJz4ge3RoaXMuX3RpbWVWYWx1ZSgpfTwvZGl2PlxuICAgICAgICApO1xuICAgIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFRpbWVyO1xuXG4iLCJ3aW5kb3cuX19hc3RDb25zdCA9IG1vZHVsZS5leHBvcnRzID0ge1xuICAgICdHT09EX09YWUdFTic6ICdHT09EX09YWUdFTicsXG4gICAgJ1dBUk5fT1hZR0VOJzogJ1dBUk5fT1hZR0VOJyxcbiAgICAnQ1JJVElDQUxfT1hZR0VOJzogJ0NSSVRJQ0FMX09YWUdFTicsXG4gICAgXCJMT1dfUkVTUF9SQVRFXCI6ICdMT1dfUkVTUF9SQVRFJyxcbiAgICAnSElHSF9SRVNQX1JBVEUnOiAnSElHSF9SRVNQX1JBVEUnLFxuXG4gICAgLyogcmVtb3ZlPyBkb24ndCB0aGluayB0aGV5IGFyZSB1c2VkICovXG4gICAgU0VUX0hFQVJUX1JBVEU6ICdTRVRfSEVBUlRfUkFURScsXG4gICAgU0VUX09YWUdFTl9MRVZFTCA6ICdTRVRfT1hZR0VOX0xFVkVMJyxcbiAgICBTRVRfT1hZR0VOX0NPTlNVTVBUSU9OIDogJ1NFVF9PWFlHRU5fQ09OU1VNUFRJT04nLFxuXG4gICAgSEVBUlRfUkFURV9USU1FUiA6ICdIRUFSVF9SQVRFX1RJTUVSJyxcbiAgICBSRVNQSVJBVElPTl9USU1FUiA6ICdSRVNQSVJBVElPTl9USU1FUidcbn07IiwibW9kdWxlLmV4cG9ydHMgPSBPYmplY3QuZnJlZXplKHtcbiAgICAvLyBldmVudHNcbiAgICBNRVNTQUdFX0FEREVEOiAnTUVTU0FHRV9BRERFRCcsXG4gICAgUkVNT1ZFX01FU1NBR0U6ICdSRU1PVkVfTUVTU0FHRSdcbn0pO1xuIiwibW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKCdyZWFjdC9saWIva2V5TWlycm9yJykoe1xuICAgIE1JU1NJT05fVElNRV9TWU5DOiAnTUlTU0lPTl9USU1FX1NZTkMnLFxuICAgIE1JU1NJT05fU1RBUlRFRF9FVkVOVDogJ01JU1NJT05fU1RBUlRFRF9FVkVOVCcsXG4gICAgTUlTU0lPTl9TVE9QUEVEX0VWRU5UOiAnTUlTU0lPTl9TVE9QUEVEX0VWRU5UJyxcbiAgICBNSVNTSU9OX0NPTVBMRVRFRF9FVkVOVDogJ01JU1NJT05fQ09NUExFVEVEX0VWRU5UJyxcbiAgICBNSVNTSU9OX1dBU19SRVNFVDogJ01JU1NJT05fV0FTX1JFU0VUJyxcbiAgICBSRUNFSVZFRF9FVkVOVFM6IG51bGwsXG4gICAgSU5UUk9EVUNUSU9OX1JFQUQ6ICdJTlRST0RVQ1RJT05fUkVBRCcsXG4gICAgU1RBUlRfVEFTSzogJ1NUQVJUX1RBU0snLFxuICAgIENPTVBMRVRFRF9UQVNLIDogJ0NPTVBMRVRFRF9UQVNLJyxcbiAgICBBU0tfRk9SX0FQUF9TVEFURTogJ0FTS19GT1JfQVBQX1NUQVRFJyxcbiAgICBSRUNFSVZFRF9BUFBfU1RBVEU6ICdSRUNFSVZFRF9BUFBfU1RBVEUnLFxuICAgIFNFTkRJTkdfVEVBTV9TVEFURTogJ1NFTkRJTkdfVEVBTV9TVEFURSdcbn0pO1xuIiwibW9kdWxlLmV4cG9ydHMgPSBPYmplY3QuZnJlZXplKHtcbiAgICAvLyBldmVudHNcbiAgICBST1VURV9DSEFOR0VEX0VWRU5UOiAnUk9VVEVfQ0hBTkdFRF9FVkVOVCcsXG4gICAgUk9VVEVSX0FWQUlMQUJMRTogJ1JPVVRFUl9BVkFJTEFCTEUnLFxufSk7XG4iLCJtb2R1bGUuZXhwb3J0cyA9IE9iamVjdC5mcmVlemUoe1xuICAgIC8vIGlkc1xuICAgIFNDSUVOQ0VfVElNRVJfMTogJ1NDSUVOQ0VfVElNRVJfMScsXG4gICAgU0NJRU5DRV9SQURJQVRJT05fV0FSTklOR19NU0cgOiAnU0NJRU5DRV9SQURJQVRJT05fV0FSTklOR19NU0cnLFxuXG4gICAgU0NJRU5DRV9DTEVBUl9SQURJQVRJT05fU0FNUExFUzonU0NJRU5DRV9DTEVBUl9SQURJQVRJT05fU0FNUExFUycsXG5cbiAgICAvLyBldmVudHNcbiAgICBTQ0lFTkNFX0NPVU5URE9XTl9USU1FUl9DSEFOR0VEOiAnU0NJRU5DRV9DT1VOVERPV05fVElNRVJfQ0hBTkdFRCcsXG4gICAgU0NJRU5DRV9UQUtFX1JBRElBVElPTl9TQU1QTEU6ICdTQ0lFTkNFX1RBS0VfUkFESUFUSU9OX1NBTVBMRScsXG4gICAgU0NJRU5DRV9SQURJQVRJT05fTEVWRUxfQ0hBTkdFRDogJ1NDSUVOQ0VfUkFESUFUSU9OX0xFVkVMX0NIQU5HRUQnLFxuICAgIFNDSUVOQ0VfVE9UQUxfUkFESUFUSU9OX0xFVkVMX0NIQU5HRUQ6ICdTQ0lFTkNFX1RPVEFMX1JBRElBVElPTl9MRVZFTF9DSEFOR0VEJyxcbiAgICBTQ0lFTkNFX0FWR19SQURJQVRJT05fQ0FMQ1VMQVRFRDogJ1NDSUVOQ0VfQVZHX1JBRElBVElPTl9DQUxDVUxBVEVEJyxcblxuICAgIC8vIHZhbHVlc1xuICAgIFNDSUVOQ0VfUkFESUFUSU9OX01JTjogMCxcbiAgICBTQ0lFTkNFX1JBRElBVElPTl9NQVg6IDEwMCxcbiAgICBTQ0lFTkNFX0FWR19SQURfR1JFRU5fVkFMVUU6IDAsXG4gICAgU0NJRU5DRV9BVkdfUkFEX09SQU5HRV9WQUxVRTogMTUsXG4gICAgU0NJRU5DRV9BVkdfUkFEX1JFRF9WQUxVRTogNTAsXG4gICAgU0NJRU5DRV9BVkdfUkFEX09SQU5HRV9USFJFU0hPTEQ6IDQwLFxuICAgIFNDSUVOQ0VfQVZHX1JBRF9SRURfVEhSRVNIT0xEOiA3NSxcbiAgICBTQ0lFTkNFX1RPVEFMX1JBRElBVElPTl9TRVJJT1VTX1RIUkVTSE9MRDogNTAsXG4gICAgU0NJRU5DRV9UT1RBTF9SQURJQVRJT05fVkVSWV9TRVJJT1VTX1RIUkVTSE9MRDogNzVcbn0pO1xuIiwibW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgU0VUX1RJTUVSOiAnU0VUX1RJTUVSJyxcbiAgICBTVEFSVF9USU1FUjogJ1NUQVJUX1RJTUVSJyxcbiAgICBTVE9QX1RJTUVSOiAnU1RPUF9USU1FUicsXG4gICAgUkVTRVRfVElNRVI6ICdSRVNFVF9USU1FUidcbn07XG5cbiIsIi8vIHByb3h5IGFjY2VzcyB0byB0aGUgcm91dGVyIGFzIGZpcnN0IHN0ZXAgaW4gYnJpbmdpbmcgaXQgaW50byB0aGUgZmx1eCBmbG93XG4vLyBAc2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9yYWNrdC9yZWFjdC1yb3V0ZXIvYmxvYi9tYXN0ZXIvZG9jcy9ndWlkZXMvZmx1eC5tZFxuXG52YXIgcm91dGVyID0gbnVsbDtcblxud2luZG93Ll9fcm91dGVyID0gbW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgdHJhbnNpdGlvblRvKHRvLHBhcmFtcyxxdWVyeSkge1xuICAgICAgICByZXR1cm4gcm91dGVyLnRyYW5zaXRpb25Ubyh0byxwYXJhbXMscXVlcnkpXG4gICAgfSxcblxuICAgIGdldEN1cnJlbnRQYXRobmFtZSgpIHtcbiAgICAgICAgcmV0dXJuIHdpbmRvdy5sb2NhdGlvbi5wYXRobmFtZTtcbiAgICB9LFxuXG4gICAgZ2V0VGVhbUlkKCl7XG4gICAgICByZXR1cm4gdGhpcy5nZXRDdXJyZW50UGF0aG5hbWUoKS5zcGxpdCgnLycpWzFdO1xuICAgIH0sXG5cbiAgICBnZXRUYXNrSWQoKXtcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0Q3VycmVudFBhdGhuYW1lKCkuc3BsaXQoJy8nKVszXTtcbiAgICB9LFxuXG4gICAgcnVuKC4uLmFyZ3MpIHtcbiAgICAgICAgcmV0dXJuIHJvdXRlci5ydW4oLi4uYXJncylcbiAgICB9XG59O1xuXG5jb25zdCBSb3V0ZXIgPSByZXF1aXJlKCdyZWFjdC1yb3V0ZXInKTtcbmNvbnN0IHJvdXRlcyA9IHJlcXVpcmUoJy4vcm91dGVzLnJlYWN0Jyk7XG5cbi8vIEJ5IHRoZSB0aW1lIHJvdXRlIGNvbmZpZyBpcyByZXF1aXJlKCktZCxcbi8vIHJlcXVpcmUoJy4vcm91dGVyJykgYWxyZWFkeSByZXR1cm5zIGEgdmFsaWQgb2JqZWN0XG5cbnJvdXRlciA9IFJvdXRlci5jcmVhdGUoe1xuICAgIHJvdXRlczogcm91dGVzLFxuXG4gICAgLy8gVXNlIHRoZSBIVE1MNSBIaXN0b3J5IEFQSSBmb3IgY2xlYW4gVVJMc1xuICAgIGxvY2F0aW9uOiBSb3V0ZXIuSGlzdG9yeUxvY2F0aW9uXG59KTtcbiIsImNvbnN0IFJlYWN0ID0gcmVxdWlyZSgncmVhY3QnKTtcbmNvbnN0IFJvdXRlciA9IHJlcXVpcmUoJ3JlYWN0LXJvdXRlcicpO1xuY29uc3QgUm91dGUgPSBSb3V0ZXIuUm91dGU7XG5jb25zdCBOb3RGb3VuZFJvdXRlID0gUm91dGVyLk5vdEZvdW5kUm91dGU7XG5jb25zdCBEZWZhdWx0Um91dGUgPSBSb3V0ZXIuRGVmYXVsdFJvdXRlO1xuXG5jb25zdCBBcHAgPSByZXF1aXJlKCcuL2NvbXBvbmVudHMvYXBwLnJlYWN0Jyk7XG5jb25zdCBNaXNzaW9uQ29tbWFuZGVyQXBwID0gcmVxdWlyZSgnLi9jb21wb25lbnRzL21pc3Npb24tY29tbWFuZGVyLnJlYWN0LmpzJyk7XG5jb25zdCBJbmRleEFwcCA9IHJlcXVpcmUoJy4vY29tcG9uZW50cy9pbmRleC1hcHAucmVhY3QnKTtcbmNvbnN0IE5vdEZvdW5kID0gcmVxdWlyZSgnLi9jb21wb25lbnRzL25vdC1mb3VuZC5yZWFjdCcpO1xuY29uc3QgSW50cm9TY3JlZW4gPSByZXF1aXJlKCcuL2NvbXBvbmVudHMvaW50cm9kdWN0aW9uLXNjcmVlbi5yZWFjdCcpO1xuY29uc3QgU29sYXJTdG9ybSA9IHJlcXVpcmUoJy4vY29tcG9uZW50cy9mdWxsLXNjcmVlbi12aWRlby5qcycpO1xuY29uc3QgVGFzayA9IHJlcXVpcmUoJy4vY29tcG9uZW50cy90YXNrLnJlYWN0Jyk7XG5jb25zdCBEdW1teVJlbmRlck1peGluID0gcmVxdWlyZSgnLi9jb21wb25lbnRzL2R1bW15LXJlbmRlci5taXhpbicpO1xuY29uc3QgeyBjbGVhblJvb3RQYXRoIH0gPSByZXF1aXJlKCcuL3V0aWxzJyk7XG5jb25zdCB0ZWFtTmFtZU1hcCA9IHJlcXVpcmUoJy4vdGVhbS1uYW1lLW1hcCcpO1xuXG5jb25zdCBSZWRpcmVjdFRvSW50cm8gPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cbiAgICBzdGF0aWNzOiB7XG4gICAgICAgIHdpbGxUcmFuc2l0aW9uVG8odHJhbnNpdGlvbikge1xuICAgICAgICAgICAgdmFyIHRlYW1JZCA9IGNsZWFuUm9vdFBhdGgodHJhbnNpdGlvbi5wYXRoKTtcblxuICAgICAgICAgICAgaWYodGVhbUlkIGluIHRlYW1OYW1lTWFwLm5hbWVNYXApIHtcbiAgICAgICAgICAgICAgICB0cmFuc2l0aW9uLnJlZGlyZWN0KHRyYW5zaXRpb24ucGF0aCArICcvaW50cm8nKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvL21peGlucyA6IFtEdW1teVJlbmRlck1peGluXVxuICAgIHJlbmRlcigpe1xuICAgICAgICByZXR1cm4gPE5vdEZvdW5kIC8+O1xuICAgIH1cbn0pO1xuXG5jb25zdCByb3V0ZXMgPSAoXG4gICAgPFJvdXRlIG5hbWU9XCJhcHBcIiBwYXRoPVwiL1wiIGhhbmRsZXI9e0FwcH0+XG5cbiAgICAgICAgPFJvdXRlIG5hbWU9XCJqb2ItY29tcGxldGVkXCIgcGF0aD0nL2NvbXBsZXRlZCcgaGFuZGxlcj17U29sYXJTdG9ybX0gLz5cblxuICAgICAgICA8Um91dGUgbmFtZT1cImNvbW1hbmRlclwiIGhhbmRsZXI9e01pc3Npb25Db21tYW5kZXJBcHB9Lz5cbiAgICAgICAgPFJvdXRlIG5hbWU9XCJ0ZWFtLXJvb3RcIiBwYXRoPScvOnRlYW1JZCcgaGFuZGxlcj17UmVkaXJlY3RUb0ludHJvfSAvPlxuICAgICAgICA8Um91dGUgbmFtZT1cInRlYW0taW50cm9cIiBwYXRoPScvOnRlYW1JZC9pbnRybycgaGFuZGxlcj17SW50cm9TY3JlZW59IC8+XG4gICAgICAgIDxSb3V0ZSBuYW1lPVwidGVhbS10YXNrXCIgcGF0aD0nLzp0ZWFtSWQvdGFzay86dGFza0lkJyBoYW5kbGVyPXtUYXNrfSAvPlxuXG4gICAgICAgIDxOb3RGb3VuZFJvdXRlIGhhbmRsZXI9e05vdEZvdW5kfS8+XG4gICAgICAgIDxEZWZhdWx0Um91dGUgaGFuZGxlcj17SW5kZXhBcHB9Lz5cbiAgICA8L1JvdXRlPlxuKTtcblxubW9kdWxlLmV4cG9ydHMgPSByb3V0ZXM7XG4iLCJjb25zdCBFdmVudEVtaXR0ZXIgPSByZXF1aXJlKCdldmVudHMnKTtcbmNvbnN0ICBDSEFOR0VfRVZFTlQ9ICdDSEFOR0VfRVZFTlQnO1xuXG52YXIgcGF0aCA9IG51bGw7XG5cbmNsYXNzIEJhc2VTdG9yZSBleHRlbmRzIEV2ZW50RW1pdHRlciB7XG5cbiAgICBlbWl0Q2hhbmdlKCkge1xuICAgICAgICB0aGlzLmVtaXQoQ0hBTkdFX0VWRU5UKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBjYWxsYmFja1xuICAgICAqIEByZXR1cm5zIGVtaXR0ZXIsIHNvIGNhbGxzIGNhbiBiZSBjaGFpbmVkLlxuICAgICAqL1xuICAgIGFkZENoYW5nZUxpc3RlbmVyKGNhbGxiYWNrKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm9uKENIQU5HRV9FVkVOVCwgY2FsbGJhY2spO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEBwYXJhbSB7ZnVuY3Rpb259IGNhbGxiYWNrXG4gICAgICogQHJldHVybnMgZW1pdHRlciwgc28gY2FsbHMgY2FuIGJlIGNoYWluZWQuXG4gICAgICovXG4gICAgcmVtb3ZlQ2hhbmdlTGlzdGVuZXIoY2FsbGJhY2spIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmVtb3ZlTGlzdGVuZXIoQ0hBTkdFX0VWRU5ULCBjYWxsYmFjayk7XG4gICAgfVxuXG4gICAgZGlzcGF0Y2hlckluZGV4Ok51bWJlcjtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBCYXNlU3RvcmU7XG4iLCJjb25zdCBEaXNwYXRjaGVyID0gcmVxdWlyZSgnLi4vYXBwZGlzcGF0Y2hlcicpO1xuY29uc3QgTUNvbnN0YW50cyA9IHJlcXVpcmUoJy4uL2NvbnN0YW50cy9NaXNzaW9uQ29uc3RhbnRzJyk7XG5jb25zdCBBc3RDb25zdGFudHMgPSByZXF1aXJlKCcuLi9jb25zdGFudHMvQXN0cm9UZWFtQ29uc3RhbnRzJyk7XG5jb25zdCBCYXNlU3RvcmUgPSByZXF1aXJlKCcuL2Jhc2Utc3RvcmUnKTtcblxudmFyIGN1cnJlbnQgPSBBc3RDb25zdGFudHMuTE9XX1JFU1BfUkFURTtcblxuY29uc3QgQnJlYXRoUmF0ZVN0b3JlID0gbW9kdWxlLmV4cG9ydHMgPSBPYmplY3QuYXNzaWduKG5ldyBCYXNlU3RvcmUsIHtcblxuICAgIGdldFN0YXRlKCl7XG4gICAgICAgIGlmIChjdXJyZW50ID09IEFzdENvbnN0YW50cy5MT1dfUkVTUF9SQVRFKSB7XG4gICAgICAgICAgICByZXR1cm4ge3JhdGU6IGN1cnJlbnQsIG1pbjogMjMsIG1heDogMjh9O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIHtyYXRlOiBjdXJyZW50LCBtaW46IDQ1LCBtYXg6IDU1fVxuICAgICAgICB9XG4gICAgfSxcblxuICAgIGRpc3BhdGNoZXJJbmRleDogRGlzcGF0Y2hlci5yZWdpc3RlcigocGF5bG9hZCkgPT4ge1xuXG4gICAgICAgIHN3aXRjaCAocGF5bG9hZC5hY3Rpb24pIHtcbiAgICAgICAgICAgIGNhc2UgQXN0Q29uc3RhbnRzLlNFVF9CUkVBVEhfUkFURTpcbiAgICAgICAgICAgICAgICBjdXJyZW50ID0gcGF5bG9hZC5yYXRlO1xuICAgICAgICAgICAgICAgIEJyZWF0aFJhdGVTdG9yZS5lbWl0Q2hhbmdlKCk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9KVxufSk7XG4iLCJjb25zdCBEaXNwYXRjaGVyID0gcmVxdWlyZSgnLi4vYXBwZGlzcGF0Y2hlcicpO1xuY29uc3QgTWlzc2lvbkNvbnN0YW50cyA9IHJlcXVpcmUoJy4uL2NvbnN0YW50cy9NaXNzaW9uQ29uc3RhbnRzJyk7XG5jb25zdCBCYXNlU3RvcmUgPSByZXF1aXJlKCcuL2Jhc2Utc3RvcmUnKTtcblxudmFyIGxldmVsID0gMDtcbnZhciBmaWx0ZXJDaGFuZ2VkID0gZmFsc2U7XG5cbmNvbnN0IENPMlN0b3JlID0gbW9kdWxlLmV4cG9ydHMgPSBPYmplY3QuYXNzaWduKG5ldyBCYXNlU3RvcmUsIHtcblxuICAgIGNvMkxldmVsKCl7XG4gICAgICAgIHJldHVybiBsZXZlbDtcbiAgICB9LFxuXG4gICAgZmlsdGVyQ2hhbmdlZCgpe1xuICAgICAgICByZXR1cm4gZmlsdGVyQ2hhbmdlZDtcbiAgICB9LFxuXG4gICAgZGlzcGF0Y2hlckluZGV4OiBEaXNwYXRjaGVyLnJlZ2lzdGVyKChwYXlsb2FkKSA9PiB7XG5cbiAgICAgICAgc3dpdGNoIChwYXlsb2FkLmFjdGlvbikge1xuICAgICAgICAgICAgY2FzZSBNaXNzaW9uQ29uc3RhbnRzLlJFQ0VJVkVEX0FQUF9TVEFURTpcbiAgICAgICAgICAgICAgICB2YXIgYXBwU3RhdGUgPSBwYXlsb2FkLmFwcFN0YXRlO1xuXG4gICAgICAgICAgICAgICAgbGV2ZWwgPSBhcHBTdGF0ZS5jYXJib25fZGlveGlkZTtcbiAgICAgICAgICAgICAgICBmaWx0ZXJDaGFuZ2VkID0gYXBwU3RhdGUuc2NydWJfZmlsdGVyX2NoYW5nZWQ7XG4gICAgICAgICAgICAgICAgQ08yU3RvcmUuZW1pdENoYW5nZSgpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSlcbn0pO1xuIiwiY29uc3QgQXBwRGlzcGF0Y2hlciA9IHJlcXVpcmUoJy4uL2FwcGRpc3BhdGNoZXInKTtcbmNvbnN0IE1pc3Npb25Db25zdGFudHMgPSByZXF1aXJlKCcuLi9jb25zdGFudHMvTWlzc2lvbkNvbnN0YW50cycpO1xudmFyIHF1YWxpdHlTaG91bGRGYWlsID0gdHJ1ZTtcbnZhciB0cmFuc2ZlclNob3VsZEZhaWwgPSB0cnVlO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcblxuICAgIHF1YWxpdHlUZXN0U2hvdWxkRmFpbCgpIHtcbiAgICAgICAgcmV0dXJuIHF1YWxpdHlTaG91bGRGYWlsO1xuICAgIH0sXG5cbiAgICB0cmFuc2ZlclRlc3RTaG91bGQoKXtcbiAgICAgICAgcmV0dXJuIHRyYW5zZmVyU2hvdWxkRmFpbDtcbiAgICB9LFxuXG4gICAgZGlzcGF0Y2hlckluZGV4OiBBcHBEaXNwYXRjaGVyLnJlZ2lzdGVyKChwYXlsb2FkKT0+IHtcblxuICAgICAgICBpZiAocGF5bG9hZC5hY3Rpb24gPT09IE1pc3Npb25Db25zdGFudHMuUkVDRUlWRURfQVBQX1NUQVRFKSB7XG4gICAgICAgICAgICBzaG91bGRGYWlsID0gcGF5bG9hZC5hcHBTdGF0ZS5xdWFsaXR5X3Rlc3Rfc2hvdWxkX2ZhaWw7XG4gICAgICAgIH1cbiAgICB9KVxufTsiLCJjb25zdCBEaXNwYXRjaGVyID0gcmVxdWlyZSgnLi4vYXBwZGlzcGF0Y2hlcicpO1xuY29uc3QgTUNvbnN0YW50cyA9IHJlcXVpcmUoJy4uL2NvbnN0YW50cy9NaXNzaW9uQ29uc3RhbnRzJyk7XG5jb25zdCBCYXNlU3RvcmUgPSByZXF1aXJlKCcuL2Jhc2Utc3RvcmUnKTtcblxudmFyIGV2ZW50c0NvbGxlY3Rpb24gPSB7XG4gICAgcmVtYWluaW5nOiBbXSxcbiAgICBjb21wbGV0ZWQ6IFtdLFxuICAgIG92ZXJkdWU6IFtdXG59O1xuXG5jb25zdCBFdmVudFN0b3JlID0gbW9kdWxlLmV4cG9ydHMgPSB3aW5kb3cuX19ldmVudFN0b3JlID0gT2JqZWN0LmFzc2lnbihuZXcgQmFzZVN0b3JlLCB7XG5cbiAgICByZW1haW5pbmcoKSB7IHJldHVybiBldmVudHNDb2xsZWN0aW9uLnJlbWFpbmluZzsgfSxcblxuICAgIGNvbXBsZXRlZCgpIHsgcmV0dXJuIGV2ZW50c0NvbGxlY3Rpb24uY29tcGxldGVkOyB9LFxuXG4gICAgb3ZlcmR1ZSgpIHsgcmV0dXJuIGV2ZW50c0NvbGxlY3Rpb24ub3ZlcmR1ZTsgfSxcblxuICAgIGRpc3BhdGNoZXJJbmRleDogRGlzcGF0Y2hlci5yZWdpc3RlcigocGF5bG9hZCkgPT4ge1xuXG4gICAgICAgIHN3aXRjaChwYXlsb2FkLmFjdGlvbil7XG5cbiAgICAgICAgICAgIGNhc2UgTUNvbnN0YW50cy5SRUNFSVZFRF9FVkVOVFM6XG4gICAgICAgICAgICAgICAgZXZlbnRzQ29sbGVjdGlvbi5yZW1haW5pbmcgPSBwYXlsb2FkLnJlbWFpbmluZztcbiAgICAgICAgICAgICAgICBldmVudHNDb2xsZWN0aW9uLm92ZXJkdWUgPSBwYXlsb2FkLm92ZXJkdWU7XG4gICAgICAgICAgICAgICAgZXZlbnRzQ29sbGVjdGlvbi5jb21wbGV0ZWQgPSBwYXlsb2FkLmNvbXBsZXRlZDtcbiAgICAgICAgICAgICAgICBFdmVudFN0b3JlLmVtaXRDaGFuZ2UoKTtcblxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSlcbn0pO1xuXG5cbi8vd2luZG93Ll9fZXZlbnRTdG9yZSA9IG1vZHVsZS5leHBvcnRzO1xuIiwiY29uc3QgRGlzcGF0Y2hlciA9IHJlcXVpcmUoJy4uL2FwcGRpc3BhdGNoZXInKTtcbmNvbnN0IE1Db25zdGFudHMgPSByZXF1aXJlKCcuLi9jb25zdGFudHMvTWlzc2lvbkNvbnN0YW50cycpO1xuY29uc3QgQXN0Q29uc3RhbnRzID0gcmVxdWlyZSgnLi4vY29uc3RhbnRzL0FzdHJvVGVhbUNvbnN0YW50cycpO1xuY29uc3QgQmFzZVN0b3JlID0gcmVxdWlyZSgnLi9iYXNlLXN0b3JlJyk7XG5cbnZhciBjdXJyZW50ID0ge21pbjogNjAsIG1heDogNzB9O1xuXG5jb25zdCBIZWFydFJhdGVTdG9yZSA9IG1vZHVsZS5leHBvcnRzID0gT2JqZWN0LmFzc2lnbihuZXcgQmFzZVN0b3JlLCB7XG5cbiAgICAvLyBvbSB2aSB2aWwgYmFja2Ugb3BwIHZlcmRpZXIgcMOlIHNlcnZlciBtw6UgdmkgYnJ1a2UgZGVubmUgc3RvcmVuXG4gICAgZ2V0U3RhdGUoKXtcbiAgICAgICAgcmV0dXJuIGN1cnJlbnQ7XG4gICAgfSxcblxuICAgIGRpc3BhdGNoZXJJbmRleDogRGlzcGF0Y2hlci5yZWdpc3RlcigocGF5bG9hZCkgPT4ge1xuXG4gICAgICAgIHN3aXRjaCAocGF5bG9hZC5hY3Rpb24pIHtcbiAgICAgICAgICAgIGNhc2UgTUNvbnN0YW50cy5SRUNFSVZFRF9BUFBfU1RBVEU6XG4gICAgICAgICAgICAgICAgdmFyIHJhdGUgPSBwYXlsb2FkLmFwcFN0YXRlLmhlYXJ0X3JhdGU7XG4gICAgICAgICAgICAgICAgaWYgKHJhdGUgJiYgcmF0ZS5taW4gJiYgcmF0ZS5tYXgpIHtcbiAgICAgICAgICAgICAgICAgICAgY3VycmVudCA9IHJhdGU7XG4gICAgICAgICAgICAgICAgICAgIEhlYXJ0UmF0ZVN0b3JlLmVtaXRDaGFuZ2UoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9KVxufSk7XG4iLCIvKiBIb2xkcyB0aGUgc3RhdGUgb2Ygd2hldGhlciBpbnRyb2R1Y3Rpb25zIGhhdmUgYmVlbiByZWFkICovXG5cbmNvbnN0IEFwcERpc3BhdGNoZXIgPSByZXF1aXJlKCcuLi9hcHBkaXNwYXRjaGVyJyk7XG5jb25zdCBCYXNlU3RvcmUgPSByZXF1aXJlKCcuL2Jhc2Utc3RvcmUnKTtcbmNvbnN0IE1pc3Npb25Db25zdGFudHM9IHJlcXVpcmUoJy4uL2NvbnN0YW50cy9NaXNzaW9uQ29uc3RhbnRzJyk7XG5jb25zdCBSb3V0ZVN0b3JlID0gcmVxdWlyZSgnLi9yb3V0ZS1zdG9yZScpO1xuXG52YXIgaW50cm9SZWFkID0ge307XG5cbmNvbnN0IEludHJvZHVjdGlvblN0b3JlID0gT2JqZWN0LmFzc2lnbihuZXcgQmFzZVN0b3JlKCksIHtcblxuICAgIHNldEludHJvZHVjdGlvblJlYWQodGVhbSkge1xuICAgICAgICBpbnRyb1JlYWRbJ2ludHJvXycrdGVhbV0gPSB0cnVlO1xuICAgICAgICB0aGlzLmVtaXRDaGFuZ2UoKTtcbiAgICB9LFxuXG4gICAgaXNJbnRyb2R1Y3Rpb25SZWFkKHRlYW0pIHtcbiAgICAgICAgaWYoIXRlYW0pIHsgdGhyb3cgbmV3IEVycm9yKCdNaXNzaW5nIGFyZ3VtZW50IFwidGVhbVwiJyk7IH1cblxuICAgICAgICByZXR1cm4gaW50cm9SZWFkWydpbnRyb18nK3RlYW1dO1xuICAgIH0sXG5cblxuICAgIGRpc3BhdGNoZXJJbmRleDogQXBwRGlzcGF0Y2hlci5yZWdpc3RlcihmdW5jdGlvbiAocGF5bG9hZCkge1xuICAgICAgICB2YXIgYWN0aW9uID0gcGF5bG9hZC5hY3Rpb247XG5cbiAgICAgICAgc3dpdGNoIChhY3Rpb24pIHtcbiAgICAgICAgICAgIGNhc2UgTWlzc2lvbkNvbnN0YW50cy5JTlRST0RVQ1RJT05fUkVBRDpcbiAgICAgICAgICAgICAgICBJbnRyb2R1Y3Rpb25TdG9yZS5zZXRJbnRyb2R1Y3Rpb25SZWFkKHBheWxvYWQudGVhbU5hbWUpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICBjYXNlIE1pc3Npb25Db25zdGFudHMuUkVDRUlWRURfQVBQX1NUQVRFOlxuICAgICAgICAgICAgICAgIHZhciB0ZWFtSWQgPSBSb3V0ZVN0b3JlLmdldFRlYW1JZCgpO1xuXG4gICAgICAgICAgICAgICAgdmFyIHRlYW1TdGF0ZSA9IHBheWxvYWQuYXBwU3RhdGVbdGVhbUlkXTtcblxuICAgICAgICAgICAgICAgIGlmICh0ZWFtU3RhdGUgJiYgdGVhbVN0YXRlLmludHJvZHVjdGlvbl9yZWFkICkge1xuICAgICAgICAgICAgICAgICAgICBJbnRyb2R1Y3Rpb25TdG9yZS5zZXRJbnRyb2R1Y3Rpb25SZWFkKHRlYW1TdGF0ZS50ZWFtKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdHJ1ZTsgLy8gTm8gZXJyb3JzLiBOZWVkZWQgYnkgcHJvbWlzZSBpbiBEaXNwYXRjaGVyLlxuICAgIH0pXG5cbn0pO1xuXG53aW5kb3cuX19JbnRyb2R1Y3Rpb25TdG9yZT0gSW50cm9kdWN0aW9uU3RvcmU7XG5tb2R1bGUuZXhwb3J0cyA9IEludHJvZHVjdGlvblN0b3JlO1xuIiwiLyogQSBzdG9yZSB0aGF0IGNhbiBiZSBxdWVyaWVkIGZvciB0aGUgY3VycmVudCBwYXRoICovXG5cbmNvbnN0IHsgRW1pdHRlciB9ID0gcmVxdWlyZSgnZXZlbnRzJyk7XG5jb25zdCBBcHBEaXNwYXRjaGVyID0gcmVxdWlyZSgnLi4vYXBwZGlzcGF0Y2hlcicpO1xuY29uc3QgQmFzZVN0b3JlID0gcmVxdWlyZSgnLi9iYXNlLXN0b3JlJyk7XG5jb25zdCB7IFJFTU9WRV9NRVNTQUdFLCBNRVNTQUdFX0FEREVEIH0gPSByZXF1aXJlKCcuLi9jb25zdGFudHMvTWVzc2FnZUNvbnN0YW50cycpO1xudmFyIG1lc3NhZ2VzID0ge307XG5cblxudmFyIE1lc3NhZ2VTdG9yZSA9IE9iamVjdC5hc3NpZ24obmV3IEJhc2VTdG9yZSgpLCB7XG5cbiAgICByZXNldCgpIHtcbiAgICAgICAgbWVzc2FnZXMgPSB7fTtcbiAgICAgICAgdGhpcy5lbWl0Q2hhbmdlKCk7XG4gICAgfSxcblxuICAgIGhhbmRsZUFkZGVkTWVzc2FnZShkYXRhKSB7XG4gICAgICAgIGRhdGEuZGlzbWlzc2FibGUgPSBkYXRhLmRpc21pc3NhYmxlID09PSB1bmRlZmluZWQgPyB0cnVlIDogZGF0YS5kaXNtaXNzYWJsZTtcbiAgICAgICAgbWVzc2FnZXNbZGF0YS5pZF0gPSBkYXRhO1xuICAgICAgICB0aGlzLmVtaXRDaGFuZ2UoKTtcbiAgICB9LFxuXG4gICAgaGFuZGxlUmVtb3ZlTWVzc2FnZShpZCkge1xuICAgICAgICBkZWxldGUgbWVzc2FnZXNbaWRdO1xuICAgICAgICB0aGlzLmVtaXRDaGFuZ2UoKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQSBsaXN0IG9mIGFsbCBtZXNzYWdlcyBtYXRjaGluZyBmaWx0ZXJcbiAgICAgKiBAcGFyYW0gW2ZpbHRlcl1cbiAgICAgKiBAcmV0dXJucyBbXU1lc3NhZ2UgYSBNZXNzYWdlID0geyB0ZXh0LCBpZCwgbGV2ZWwgfVxuICAgICAqL1xuICAgIGdldE1lc3NhZ2VzKGZpbHRlcikge1xuICAgICAgICBpZiAoIWZpbHRlcikge1xuICAgICAgICAgICAgcmV0dXJuIE9iamVjdC5rZXlzKG1lc3NhZ2VzKS5tYXAoKG1zZ0tleSk9PiAgbWVzc2FnZXNbbXNnS2V5XSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB0aHJvdyBuZXcgRXJyb3IoJ1VOSU1QTEVNRU5URUQgXCJmaWx0ZXJcIiBmZWF0dXJlJyk7XG4gICAgfSxcblxuICAgIGRpc3BhdGNoZXJJbmRleDogQXBwRGlzcGF0Y2hlci5yZWdpc3RlcihmdW5jdGlvbiAocGF5bG9hZCkge1xuICAgICAgICB2YXIgeyBhY3Rpb24sIGRhdGEgfSA9IHBheWxvYWQ7XG5cbiAgICAgICAgc3dpdGNoIChhY3Rpb24pIHtcbiAgICAgICAgICAgIGNhc2UgTUVTU0FHRV9BRERFRDpcbiAgICAgICAgICAgICAgICBNZXNzYWdlU3RvcmUuaGFuZGxlQWRkZWRNZXNzYWdlKGRhdGEpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBSRU1PVkVfTUVTU0FHRTpcbiAgICAgICAgICAgICAgICBNZXNzYWdlU3RvcmUuaGFuZGxlUmVtb3ZlTWVzc2FnZShkYXRhKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0cnVlOyAvLyBObyBlcnJvcnMuIE5lZWRlZCBieSBwcm9taXNlIGluIERpc3BhdGNoZXIuXG4gICAgfSlcblxufSk7XG5cbndpbmRvdy5fX01lc3NhZ2VTdG9yZSA9IE1lc3NhZ2VTdG9yZTtcbm1vZHVsZS5leHBvcnRzID0gTWVzc2FnZVN0b3JlO1xuIiwiLyogQSBzdG9yZSB0aGF0IGNhbiBiZSBxdWVyaWVkIGZvciB0aGUgY3VycmVudCBwYXRoICovXG5cbmNvbnN0IHsgRW1pdHRlciB9ID0gcmVxdWlyZSgnZXZlbnRzJyk7XG5jb25zdCBBcHBEaXNwYXRjaGVyID0gcmVxdWlyZSgnLi4vYXBwZGlzcGF0Y2hlcicpO1xuY29uc3QgQmFzZVN0b3JlID0gcmVxdWlyZSgnLi9iYXNlLXN0b3JlJyk7XG5jb25zdCB7IE1JU1NJT05fU1RBUlRFRF9FVkVOVCxNSVNTSU9OX1NUT1BQRURfRVZFTlQsIFJFQ0VJVkVEX0FQUF9TVEFURSB9ID0gIHJlcXVpcmUoJy4uL2NvbnN0YW50cy9NaXNzaW9uQ29uc3RhbnRzJyk7XG5cbnZhciBtaXNzaW9uUnVubmluZyA9IGZhbHNlLCBtaXNzaW9uSGFzQmVlblN0b3BwZWQgPSBmYWxzZTtcbnZhciBjdXJyZW50Q2hhcHRlciA9IG51bGw7XG52YXIgY2hhcHRlclRpbWUgPSAwO1xuXG52YXIgTWlzc2lvblN0YXRlU3RvcmUgPSBPYmplY3QuYXNzaWduKG5ldyBCYXNlU3RvcmUoKSwge1xuXG4gICAgaGFuZGxlTWlzc2lvblN0YXJ0ZWQoKSB7XG4gICAgICAgIG1pc3Npb25SdW5uaW5nID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5lbWl0Q2hhbmdlKCk7XG4gICAgfSxcblxuICAgIGhhbmRsZU1pc3Npb25TdG9wcGVkKCkge1xuICAgICAgICBtaXNzaW9uUnVubmluZyA9IGZhbHNlO1xuICAgICAgICB0aGlzLmVtaXRDaGFuZ2UoKTtcbiAgICB9LFxuXG4gICAgaXNNaXNzaW9uUnVubmluZygpIHtcbiAgICAgICAgcmV0dXJuIG1pc3Npb25SdW5uaW5nO1xuICAgIH0sXG5cbiAgICBpc01pc3Npb25TdG9wcGVkKCkge1xuICAgICAgICByZXR1cm4gbWlzc2lvbkhhc0JlZW5TdG9wcGVkO1xuICAgIH0sXG5cbiAgICBjdXJyZW50Q2hhcHRlcigpe1xuICAgICAgICByZXR1cm4gY3VycmVudENoYXB0ZXI7XG4gICAgfSxcblxuICAgIGNoYXB0ZXJUaW1lKCl7XG4gICAgICAgIHJldHVybiBjaGFwdGVyVGltZTtcbiAgICB9LFxuXG4gICAgZGlzcGF0Y2hlckluZGV4OiBBcHBEaXNwYXRjaGVyLnJlZ2lzdGVyKGZ1bmN0aW9uIChwYXlsb2FkKSB7XG4gICAgICAgIHZhciB7IGFjdGlvbn0gPSBwYXlsb2FkO1xuXG4gICAgICAgIHN3aXRjaCAoYWN0aW9uKSB7XG4gICAgICAgICAgICBjYXNlIE1JU1NJT05fU1RBUlRFRF9FVkVOVDpcbiAgICAgICAgICAgICAgICByZXR1cm4gTWlzc2lvblN0YXRlU3RvcmUuaGFuZGxlTWlzc2lvblN0YXJ0ZWQoKTtcblxuICAgICAgICAgICAgY2FzZSBNSVNTSU9OX1NUT1BQRURfRVZFTlQ6XG4gICAgICAgICAgICAgICAgcmV0dXJuIE1pc3Npb25TdGF0ZVN0b3JlLmhhbmRsZU1pc3Npb25TdG9wcGVkKCk7XG5cbiAgICAgICAgICAgIGNhc2UgUkVDRUlWRURfQVBQX1NUQVRFOlxuICAgICAgICAgICAgICAgIGxldCBhcHBTdGF0ZSA9IHBheWxvYWQuYXBwU3RhdGU7XG4gICAgICAgICAgICAgICAgbWlzc2lvblJ1bm5pbmcgPSBhcHBTdGF0ZS5taXNzaW9uX3J1bm5pbmc7XG4gICAgICAgICAgICAgICAgY3VycmVudENoYXB0ZXIgPSBhcHBTdGF0ZS5jdXJyZW50X2NoYXB0ZXI7XG4gICAgICAgICAgICAgICAgY2hhcHRlclRpbWUgPSBhcHBTdGF0ZS5lbGFwc2VkX2NoYXB0ZXJfdGltZTtcbiAgICAgICAgICAgICAgICByZXR1cm4gTWlzc2lvblN0YXRlU3RvcmUuZW1pdENoYW5nZSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRydWU7IC8vIE5vIGVycm9ycy4gTmVlZGVkIGJ5IHByb21pc2UgaW4gRGlzcGF0Y2hlci5cbiAgICB9KVxuXG59KTtcblxud2luZG93Ll9fTWlzc2lvblN0YXRlU3RvcmUgPSBNaXNzaW9uU3RhdGVTdG9yZTtcbm1vZHVsZS5leHBvcnRzID0gTWlzc2lvblN0YXRlU3RvcmU7XG4iLCJjb25zdCBEaXNwYXRjaGVyID0gcmVxdWlyZSgnLi4vYXBwZGlzcGF0Y2hlcicpO1xuY29uc3QgTWlzc2lvbkNvbnN0YW50cyA9IHJlcXVpcmUoJy4uL2NvbnN0YW50cy9NaXNzaW9uQ29uc3RhbnRzJyk7XG5jb25zdCBBc3RDb25zdGFudHMgPSByZXF1aXJlKCcuLi9jb25zdGFudHMvQXN0cm9UZWFtQ29uc3RhbnRzJyk7XG5jb25zdCBCYXNlU3RvcmUgPSByZXF1aXJlKCcuL2Jhc2Utc3RvcmUnKTtcblxudmFyIF9zdGF0dXMgPSBBc3RDb25zdGFudHMuR09PRF9PWFlHRU47XG52YXIgY29uc3VtcHRpb25QZXJNaW51dGUgPSBudWxsO1xudmFyIHJlbWFpbmluZyA9IDEwMDtcblxuY29uc3QgT3h5Z2VuU3RvcmUgPSBtb2R1bGUuZXhwb3J0cyA9IE9iamVjdC5hc3NpZ24obmV3IEJhc2VTdG9yZSwge1xuXG4gICAgc3RhdHVzKCl7XG4gICAgICAgIHJldHVybiBfc3RhdHVzO1xuICAgIH0sXG5cbiAgICBzdGF0dXNBc0NvbG9yKCl7XG4gICAgICAgIHN3aXRjaCAoX3N0YXR1cykge1xuICAgICAgICAgICAgY2FzZSBBc3RDb25zdGFudHMuQ1JJVElDQUxfT1hZR0VOOlxuICAgICAgICAgICAgICAgIHJldHVybiAncmVkJztcbiAgICAgICAgICAgIGNhc2UgQXN0Q29uc3RhbnRzLldBUk5fT1hZR0VOOlxuICAgICAgICAgICAgICAgIHJldHVybiAnb3JhbmdlJztcbiAgICAgICAgICAgIGNhc2UgQXN0Q29uc3RhbnRzLkdPT0RfT1hZR0VOOlxuICAgICAgICAgICAgICAgIHJldHVybiAnZ3JlZW4nXG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgZ2V0U3RhdGUoKXtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGNvbG9ySW5kaWNhdG9yOiB0aGlzLnN0YXR1c0FzQ29sb3IoKSxcbiAgICAgICAgICAgIGNvbnN1bXB0aW9uUGVyTWludXRlOiBjb25zdW1wdGlvblBlck1pbnV0ZSxcbiAgICAgICAgICAgIHJlbWFpbmluZzogcmVtYWluaW5nXG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgZGlzcGF0Y2hlckluZGV4OiBEaXNwYXRjaGVyLnJlZ2lzdGVyKChwYXlsb2FkKSA9PiB7XG5cbiAgICAgICAgc3dpdGNoIChwYXlsb2FkLmFjdGlvbikge1xuICAgICAgICAgICAgY2FzZSBNaXNzaW9uQ29uc3RhbnRzLlJFQ0VJVkVEX0FQUF9TVEFURTpcbiAgICAgICAgICAgICAgICB2YXIgYXBwU3RhdGUgPSBwYXlsb2FkLmFwcFN0YXRlO1xuXG4gICAgICAgICAgICAgICAgaWYgKGFwcFN0YXRlLm94eWdlbl9jb25zdW1wdGlvbikge1xuICAgICAgICAgICAgICAgICAgICBjb25zdW1wdGlvblBlck1pbnV0ZSA9IGFwcFN0YXRlLm94eWdlbl9jb25zdW1wdGlvbjtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoY29uc3VtcHRpb25QZXJNaW51dGUgPiAxXG4gICAgICAgICAgICAgICAgICAgICAgICAmJiBfc3RhdHVzICE9PSBBc3RDb25zdGFudHMuQ1JJVElDQUxfT1hZR0VOKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBfc3RhdHVzID0gQXN0Q29uc3RhbnRzLldBUk5fT1hZR0VOXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoY29uc3VtcHRpb25QZXJNaW51dGUgPCAyKXtcbiAgICAgICAgICAgICAgICAgICAgICAgIF9zdGF0dXMgPSBBc3RDb25zdGFudHMuR09PRF9PWFlHRU47XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBPeHlnZW5TdG9yZS5lbWl0Q2hhbmdlKCk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKGFwcFN0YXRlLm94eWdlbikge1xuICAgICAgICAgICAgICAgICAgICByZW1haW5pbmcgPSBhcHBTdGF0ZS5veHlnZW47XG4gICAgICAgICAgICAgICAgICAgIE94eWdlblN0b3JlLmVtaXRDaGFuZ2UoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9KVxufSk7XG4iLCIvKiBBIHNpbmdsZXRvbiBzdG9yZSB0aGF0IGNhbiBiZSBxdWVyaWVkIGZvciByZW1haW5pbmcgdGltZSAqL1xuXG5jb25zdCBBcHBEaXNwYXRjaGVyID0gcmVxdWlyZSgnLi4vYXBwZGlzcGF0Y2hlcicpO1xuY29uc3QgQmFzZVN0b3JlID0gcmVxdWlyZSgnLi9iYXNlLXN0b3JlJyk7XG5jb25zdCBTY2llbmNlVGVhbUNvbnN0YW50cyA9IHJlcXVpcmUoJy4uL2NvbnN0YW50cy9TY2llbmNlVGVhbUNvbnN0YW50cycpO1xuY29uc3QgTWlzc2lvbkNvbnN0YW50cyA9IHJlcXVpcmUoJy4uL2NvbnN0YW50cy9NaXNzaW9uQ29uc3RhbnRzJyk7XG5jb25zdCByYW5kb21JbnQgPSByZXF1aXJlKCcuLi91dGlscycpLnJhbmRvbUludDtcbmNvbnN0IHJhZGlhdGlvblJhbmdlID0ge1xuICAgIG1pbjogNSxcbiAgICBtYXg6IDIwXG59O1xudmFyIHNhbXBsZXMgPSBbXTtcbnZhciB0b3RhbFJhZGlhdGlvbiA9IDA7XG52YXIgbGFzdENhbGN1bGF0ZWRBdmVyYWdlID0gbnVsbDtcblxuY29uc3QgUmFkaWF0aW9uU3RvcmUgPSBPYmplY3QuYXNzaWduKG5ldyBCYXNlU3RvcmUoKSwge1xuXG4gICAgX3NldFJhZGlhdGlvbkxldmVsKG1pbiwgbWF4KSB7XG4gICAgICAgIHJhZGlhdGlvblJhbmdlLm1pbiA9IG1pbjtcbiAgICAgICAgcmFkaWF0aW9uUmFuZ2UubWF4ID0gbWF4O1xuICAgICAgICB0aGlzLmVtaXRDaGFuZ2UoKTtcbiAgICB9LFxuXG4gICAgX2NsZWFyU2FtcGxlcygpIHtcbiAgICAgICAgc2FtcGxlcyA9IFtdO1xuICAgICAgICB0aGlzLmVtaXRDaGFuZ2UoKTtcbiAgICB9LFxuXG4gICAgX3Rha2VTYW1wbGUoKSB7XG4gICAgICAgIHNhbXBsZXMucHVzaCh0aGlzLmdldExldmVsKCkpO1xuICAgICAgICB0aGlzLmVtaXRDaGFuZ2UoKTtcbiAgICB9LFxuXG4gICAgZ2V0TGV2ZWwoKSB7XG4gICAgICAgIHJldHVybiByYW5kb21JbnQocmFkaWF0aW9uUmFuZ2UubWluLCByYWRpYXRpb25SYW5nZS5tYXgpO1xuICAgIH0sXG5cbiAgICBnZXRUb3RhbExldmVsKCkge1xuICAgICAgICByZXR1cm4gdG90YWxSYWRpYXRpb247XG4gICAgfSxcblxuICAgIGdldFNhbXBsZXMoKSB7XG4gICAgICAgIHJldHVybiBzYW1wbGVzLnNsaWNlKCk7XG4gICAgfSxcblxuICAgIGdldFN0YXRlKCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgc2FtcGxlczogc2FtcGxlcy5zbGljZSgwKSxcbiAgICAgICAgICAgIHRvdGFsOiB0b3RhbFJhZGlhdGlvbixcbiAgICAgICAgICAgIGN1cnJlbnRMZXZlbDogdGhpcy5nZXRMZXZlbCgpLFxuICAgICAgICAgICAgbGFzdENhbGN1bGF0ZWRBdmVyYWdlOiBsYXN0Q2FsY3VsYXRlZEF2ZXJhZ2VcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBkaXNwYXRjaGVySW5kZXg6IEFwcERpc3BhdGNoZXIucmVnaXN0ZXIoZnVuY3Rpb24gKHBheWxvYWQpIHtcbiAgICAgICAgdmFyIHsgYWN0aW9uLCBkYXRhfSA9IHBheWxvYWQ7XG5cbiAgICAgICAgc3dpdGNoIChhY3Rpb24pIHtcbiAgICAgICAgICAgIGNhc2UgU2NpZW5jZVRlYW1Db25zdGFudHMuU0NJRU5DRV9SQURJQVRJT05fTEVWRUxfQ0hBTkdFRDpcbiAgICAgICAgICAgICAgICBSYWRpYXRpb25TdG9yZS5fc2V0UmFkaWF0aW9uTGV2ZWwoZGF0YS5taW4sIGRhdGEubWF4KTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgU2NpZW5jZVRlYW1Db25zdGFudHMuU0NJRU5DRV9UT1RBTF9SQURJQVRJT05fTEVWRUxfQ0hBTkdFRDpcbiAgICAgICAgICAgICAgICB0b3RhbFJhZGlhdGlvbiA9IGRhdGEudG90YWw7XG4gICAgICAgICAgICAgICAgUmFkaWF0aW9uU3RvcmUuZW1pdENoYW5nZSgpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICBjYXNlIFNjaWVuY2VUZWFtQ29uc3RhbnRzLlNDSUVOQ0VfVEFLRV9SQURJQVRJT05fU0FNUExFOlxuICAgICAgICAgICAgICAgIFJhZGlhdGlvblN0b3JlLl90YWtlU2FtcGxlKCk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFNjaWVuY2VUZWFtQ29uc3RhbnRzLlNDSUVOQ0VfQVZHX1JBRElBVElPTl9DQUxDVUxBVEVEOlxuICAgICAgICAgICAgICAgIGxhc3RDYWxjdWxhdGVkQXZlcmFnZSA9IGRhdGEuYXZlcmFnZTtcbiAgICAgICAgICAgICAgICBSYWRpYXRpb25TdG9yZS5lbWl0Q2hhbmdlKCk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFNjaWVuY2VUZWFtQ29uc3RhbnRzLlNDSUVOQ0VfQ0xFQVJfUkFESUFUSU9OX1NBTVBMRVM6XG4gICAgICAgICAgICAgICAgc2FtcGxlcyA9IFtdO1xuICAgICAgICAgICAgICAgIFJhZGlhdGlvblN0b3JlLmVtaXRDaGFuZ2UoKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgTWlzc2lvbkNvbnN0YW50cy5SRUNFSVZFRF9BUFBfU1RBVEU6XG4gICAgICAgICAgICAgICAgbGV0IGFwcFN0YXRlID0gcGF5bG9hZC5hcHBTdGF0ZTtcblxuICAgICAgICAgICAgICAgIGlmKGFwcFN0YXRlLnNjaWVuY2UgJiYgYXBwU3RhdGUuc2NpZW5jZS5yYWRpYXRpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgbGV0IHJhZGlhdGlvbiA9IGFwcFN0YXRlLnNjaWVuY2UucmFkaWF0aW9uO1xuICAgICAgICAgICAgICAgICAgICBzYW1wbGVzID0gcmFkaWF0aW9uLnNhbXBsZXM7XG4gICAgICAgICAgICAgICAgICAgIGxhc3RDYWxjdWxhdGVkQXZlcmFnZSA9IHJhZGlhdGlvbi5sYXN0Q2FsY3VsYXRlZEF2ZXJhZ2U7XG4gICAgICAgICAgICAgICAgICAgIHRvdGFsUmFkaWF0aW9uID0gcmFkaWF0aW9uLnRvdGFsO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIFJhZGlhdGlvblN0b3JlLmVtaXRDaGFuZ2UoKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgTWlzc2lvbkNvbnN0YW50cy5NSVNTSU9OX1dBU19SRVNFVDpcbiAgICAgICAgICAgICAgICBzYW1wbGVzID0gW107XG4gICAgICAgICAgICAgICAgbGFzdENhbGN1bGF0ZWRBdmVyYWdlID0gbnVsbDtcbiAgICAgICAgICAgICAgICB0b3RhbFJhZGlhdGlvbiA9IDA7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdHJ1ZTsgLy8gTm8gZXJyb3JzLiBOZWVkZWQgYnkgcHJvbWlzZSBpbiBEaXNwYXRjaGVyLlxuICAgIH0pXG5cbn0pO1xuXG53aW5kb3cuX19SYWRpYXRpb25TdG9yZSA9IFJhZGlhdGlvblN0b3JlO1xubW9kdWxlLmV4cG9ydHMgPSBSYWRpYXRpb25TdG9yZTtcbiIsIi8qIEEgc3RvcmUgdGhhdCBjYW4gYmUgcXVlcmllZCBmb3IgdGhlIGN1cnJlbnQgcGF0aCAqL1xuXG5jb25zdCBBcHBEaXNwYXRjaGVyID0gcmVxdWlyZSgnLi4vYXBwZGlzcGF0Y2hlcicpO1xuY29uc3QgQmFzZVN0b3JlID0gcmVxdWlyZSgnLi9iYXNlLXN0b3JlJyk7XG5jb25zdCB7IFJPVVRFX0NIQU5HRURfRVZFTlQgfSA9IHJlcXVpcmUoJy4uL2NvbnN0YW50cy9Sb3V0ZXJDb25zdGFudHMnKTtcbmNvbnN0IHsgY2xlYW5Sb290UGF0aCB9PSByZXF1aXJlKCcuLi91dGlscycpO1xuXG52YXIgcm91dGVyID0gcmVxdWlyZSgnLi4vcm91dGVyLWNvbnRhaW5lcicpXG5cbnZhciBSb3V0ZVN0b3JlID0gT2JqZWN0LmFzc2lnbihuZXcgQmFzZVN0b3JlKCksIHtcblxuICAgIGhhbmRsZVJvdXRlQ2hhbmdlZChzdGF0ZSkge1xuICAgICAgICB0aGlzLmVtaXRDaGFuZ2UoKTtcbiAgICB9LFxuXG4gICAgZ2V0VGVhbUlkKCkge1xuICAgICAgICByZXR1cm4gcm91dGVyLmdldFRlYW1JZCgpO1xuICAgIH0sXG5cbiAgICBnZXRUYXNrSWQoKSB7XG4gICAgICAgIHJldHVybiByb3V0ZXIuZ2V0VGFza0lkKCk7XG4gICAgfSxcblxuICAgIGRpc3BhdGNoZXJJbmRleDogQXBwRGlzcGF0Y2hlci5yZWdpc3RlcihmdW5jdGlvbiAocGF5bG9hZCkge1xuICAgICAgICB2YXIgYWN0aW9uID0gcGF5bG9hZC5hY3Rpb247XG5cbiAgICAgICAgc3dpdGNoIChhY3Rpb24pIHtcbiAgICAgICAgICAgIGNhc2UgUk9VVEVfQ0hBTkdFRF9FVkVOVDpcbiAgICAgICAgICAgICAgICBSb3V0ZVN0b3JlLmhhbmRsZVJvdXRlQ2hhbmdlZChwYXlsb2FkLnN0YXRlKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0cnVlOyAvLyBObyBlcnJvcnMuIE5lZWRlZCBieSBwcm9taXNlIGluIERpc3BhdGNoZXIuXG4gICAgfSlcblxufSk7XG5cbndpbmRvdy5fX1JvdXRlU3RvcmUgPSBSb3V0ZVN0b3JlO1xubW9kdWxlLmV4cG9ydHMgPSBSb3V0ZVN0b3JlO1xuIiwiLyogQSBzdG9yZSB0aGF0IGNhbiBiZSBxdWVyaWVkIGZvciB0aGUgY3VycmVudCBwYXRoICovXG5cbmNvbnN0IEFwcERpc3BhdGNoZXIgPSByZXF1aXJlKCcuLi9hcHBkaXNwYXRjaGVyJyk7XG5jb25zdCBCYXNlU3RvcmUgPSByZXF1aXJlKCcuL2Jhc2Utc3RvcmUnKTtcbmNvbnN0IFJvdXRlU3RvcmUgPSByZXF1aXJlKCcuL3JvdXRlLXN0b3JlJyk7XG5jb25zdCBNaXNzaW9uQ29uc3RhbnRzID0gcmVxdWlyZSgnLi4vY29uc3RhbnRzL01pc3Npb25Db25zdGFudHMnKTtcblxudmFyIGF3YWl0aW5nTmV3SW5zdHJ1Y3Rpb25zID0ge1xuICAgICd0ZXh0JzogJ1ZlbnRlciBww6UgbnllIGluc3RydWtzam9uZXIgLi4uJ1xufTtcblxudmFyIGFzc2lnbm1lbnRzID0ge1xuICAgIHNjaWVuY2U6IHtcbiAgICAgICAgY3VycmVudDogbnVsbCxcbiAgICAgICAgc2FtcGxlOiB7XG4gICAgICAgICAgICB0ZXh0OiAnU3RhcnQga2xva2thIG9nIHRhIGZpcmUgbcOlbGluZ2VyIGpldm50IGZvcmRlbHQgdXRvdmVyIGRlIDMwIHNla3VuZGVuZScsXG4gICAgICAgICAgICBuZXh0OiAnYXZlcmFnZSdcbiAgICAgICAgfSxcbiAgICAgICAgYXZlcmFnZToge1xuICAgICAgICAgICAgdGV4dDogJ1JlZ24gdXQgZ2plbm5vbXNuaXR0c3ZlcmRpZW4gYXYgc3Ryw6VsaW5nc3ZlcmRpZW5lIGRlcmUgZmFudC4gU2tyaXYgZGVuIGlubiBpIHRla3N0ZmVsdGV0LicsXG4gICAgICAgICAgICBuZXh0OiAnYWRkdG90YWwnXG4gICAgICAgIH0sXG4gICAgICAgIGFkZHRvdGFsOiB7XG4gICAgICAgICAgICB0ZXh0OiAnQmFzZXJ0IHDDpSBmYXJnZW4gc29tIGJsZSBpbmRpa2VydCB2ZWQgZXZhbHVlcmluZyBhdiBnamVubm9tc25pdHRzdmVyZGllbiAnXG4gICAgICAgICAgICArICdza2FsIHZpIG7DpSBsZWdnZSB0aWwgZXQgdGFsbCB0aWwgdG90YWx0IGZ1bm5ldCBzdHLDpWxpbmdzbWVuZ2RlLidcbiAgICAgICAgICAgICsgJyBGb3IgZ3LDuG5uIHN0YXR1cyBtYW4gbGVnZ2UgdGlsIDAsICdcbiAgICAgICAgICAgICsgJyBmb3Igb3JhbnNqIHN0YXR1cyBtYW4gbGVnZ2UgdGlsIDE1LCAnXG4gICAgICAgICAgICArICcgZm9yIHLDuGQgc3RhdHVzIG1hbiBsZWdnZSB0aWwgNTAuJ1xuICAgICAgICAgICAgKyAnIERlbiB0b3RhbGUgc3Ryw6VsaW5nc3ZlcmRpZW4gaSBrcm9wcGVuIHNrYWwgaGVsc3QgaWtrZSBnw6Ugb3ZlciA1MCwgb2cgYWxkcmkgb3ZlciA3NSEnLFxuICAgICAgICAgICAgbmV4dDogJ2F3YWl0aW5nJ1xuICAgICAgICB9LFxuICAgICAgICBhd2FpdGluZzogYXdhaXRpbmdOZXdJbnN0cnVjdGlvbnNcbiAgICB9LFxuXG4gICAgYXN0cm9uYXV0OiB7XG4gICAgICAgIGN1cnJlbnQ6IG51bGwsXG4gICAgICAgIGF3YWl0aW5nOiBhd2FpdGluZ05ld0luc3RydWN0aW9ucyxcbiAgICAgICAgYnJlYXRoaW5nX3RpbWVyOiB7XG4gICAgICAgICAgICB0ZXh0OiAnU3RhcnQga2xva2thLCBvZyB0ZWxsIGFudGFsbCBpbm5wdXN0ICh0b3BwZXIpIHDDpSBwdXN0ZWdyYWZlbi4nLFxuICAgICAgICAgICAgbmV4dDogJ2JyZWF0aGluZ19jYWxjdWxhdGUnLFxuICAgICAgICAgICAgcGxhaW5faW5mbzogdHJ1ZVxuICAgICAgICB9LFxuICAgICAgICBicmVhdGhpbmdfY2FsY3VsYXRlOiB7XG4gICAgICAgICAgICB0ZXh0OiAnSHZvciBtYW5nZSBpbm5wdXN0IGJsaXIgZGV0IHDDpSBldHQgbWludXR0PyBCcnVrIHRhbGxldCBkdSBmaW5uZXIgdGlsIMOlIHJlZ25lIHV0IG9rc3lnZW5mb3JicnVrZXQgcHIgbWludXR0LiBHamVubm9tc25pdHRsaWcgb2tzeWdlbmZvcmJydWsgbWVkIDI1IGlubnB1c3QgaSBtaW51dHRldCBlciAxIG9rc3lnZW5lbmhldC4nLFxuICAgICAgICAgICAgbmV4dDogJ2hlYXJ0cmF0ZV90aW1lcidcbiAgICAgICAgfSxcbiAgICAgICAgaGVhcnRyYXRlX3RpbWVyOiB7XG4gICAgICAgICAgICB0ZXh0OiAnU3RhcnQga2xva2thIG9nIHRlbGwgYW50YWxsIGhqZXJ0ZXNsYWcgcMOlIHRpIHNla3VuZGVyJyxcbiAgICAgICAgICAgIG5leHQ6ICdoZWFydHJhdGVfY2FsY3VsYXRlJyxcbiAgICAgICAgICAgIHBsYWluX2luZm86IHRydWVcbiAgICAgICAgfSxcbiAgICAgICAgaGVhcnRyYXRlX2NhbGN1bGF0ZToge1xuICAgICAgICAgICAgdGV4dDogJ0Zpbm4gbsOlIHV0IGh2b3IgbWFuZ2Ugc2xhZyBkZXQgYmxpciBpIG1pbnV0dGV0LiBFdmFsdWVyIHJlc3VsdGF0ZXQgdmVkIMOlIHNrcml2ZSBkZXQgaW5uIGkgdGVrc3RmZWx0ZXQuJyxcbiAgICAgICAgICAgIG5leHQ6ICdhd2FpdGluZydcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBzZWN1cml0eToge1xuICAgICAgICBjdXJyZW50IDogbnVsbCxcbiAgICAgICAgYXdhaXRpbmcgOiBhd2FpdGluZ05ld0luc3RydWN0aW9ucyxcblxuICAgICAgICBzY3J1YmJlciA6e1xuICAgICAgICAgICAgdGV4dCA6ICdOT1QgU1VSRSBBQk9VVCBUSElTIE9ORS4gSSBUSElOSyBJVCBXSUxMIEJFIFRSSUdHRVJFRCBXSVRIT1VUIEFOWSBORUVEIEZPUiBJTlNUUlVDVElPTlMnLFxuICAgICAgICAgICAgbmV4dCA6ICdhd2FpdGluZydcbiAgICAgICAgfSxcblxuICAgICAgICB0eXJfdl9jaGVjayA6IHtcbiAgICAgICAgICAgIHRleHQgOiAnTk9UIFNVUkUgQUJPVVQgVEhJUyBPTkUuIEkgVEhJTksgSVQgV0lMTCBCRSBUUklHR0VSRUQgV0lUSE9VVCBBTlkgTkVFRCBGT1IgSU5TVFJVQ1RJT05TJyxcbiAgICAgICAgICAgIG5leHQgOiAnYXdhaXRpbmcnXG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgY29tbXVuaWNhdGlvbiA6IHtcbiAgICAgICAgY3VycmVudCA6IG51bGwsXG4gICAgICAgIGF3YWl0aW5nIDogYXdhaXRpbmdOZXdJbnN0cnVjdGlvbnMsXG5cbiAgICAgICAgY29tbV9jaGVjayA6IHtcbiAgICAgICAgICAgIHRleHQgOiAnU2pla2sgc3RhdHVzIHDDpSBrb21tdW5pa2Fzam9uc2xpbmtlbi4gT20gc2lnbmFsZXQgZXIgc3Zha3QgYsO4ciBlbiBhbm5lbiBzYXRlbGl0dCB2ZWxnZXMuICdcbiAgICAgICAgICAgICsnT20gZGVyZSB2ZWxnZXIgZW4gYW5uZW4gc2F0ZWxpdHQgbcOlIGRlcmUgb2dzw6UgdmVsZ2UgZW4gZnJla3ZlbnMgZnJhIGZyZWt2ZW5zYsOlbmRldC4gJ1xuICAgICAgICAgICAgKyAnRGV0IGJlc3RlIHZhbGdldCBhdiBmcmVrdmVucyBlciB2YW5saWd2aXMgbWlkdCBpIGZyZWt2ZW5zYsOlbmRldC4gJ1xuICAgICAgICB9XG5cbiAgICB9XG59O1xuXG52YXIgVGFza1N0b3JlID0gT2JqZWN0LmFzc2lnbihuZXcgQmFzZVN0b3JlKCksIHtcblxuICAgIGdldEN1cnJlbnRUYXNrKCkge1xuICAgICAgICB2YXIgdGVhbUlkID0gUm91dGVTdG9yZS5nZXRUZWFtSWQoKTtcbiAgICAgICAgdmFyIGFzc2lnbm1lbnRzRm9yVGVhbSA9IGFzc2lnbm1lbnRzW3RlYW1JZF07XG4gICAgICAgIHJldHVybiAoYXNzaWdubWVudHNGb3JUZWFtICYmIGFzc2lnbm1lbnRzRm9yVGVhbVt0aGlzLmdldEN1cnJlbnRUYXNrSWQodGVhbUlkKV0pXG4gICAgICAgICAgICB8fCAnSW5nZW4gb3BwZ2F2ZSBmdW5uZXQnO1xuICAgIH0sXG5cbiAgICBnZXRDdXJyZW50VGFza0lkKHRlYW1JZCA9IFJvdXRlU3RvcmUuZ2V0VGVhbUlkKCkpIHtcbiAgICAgICAgaWYgKCF0ZWFtSWQubGVuZ3RoKSByZXR1cm4gbnVsbDtcblxuICAgICAgICByZXR1cm4gYXNzaWdubWVudHNbdGVhbUlkXS5jdXJyZW50IHx8ICdhd2FpdGluZyc7XG4gICAgfSxcblxuICAgIGdldFN0YXRlKCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgY3VycmVudFRhc2tJZDogdGhpcy5nZXRDdXJyZW50VGFza0lkKCksXG4gICAgICAgICAgICBjdXJyZW50VGFzazogdGhpcy5nZXRDdXJyZW50VGFzaygpLnRleHQsXG4gICAgICAgICAgICBuZXh0VGFza0lkOiB0aGlzLmdldEN1cnJlbnRUYXNrKCkubmV4dCxcbiAgICAgICAgICAgIHBsYWluSW5mbzogdGhpcy5nZXRDdXJyZW50VGFzaygpLnBsYWluX2luZm9cbiAgICAgICAgfTtcbiAgICB9LFxuXG5cbiAgICBkaXNwYXRjaGVySW5kZXg6IEFwcERpc3BhdGNoZXIucmVnaXN0ZXIoZnVuY3Rpb24gKHBheWxvYWQpIHtcbiAgICAgICAgdmFyIHRhc2tJZDtcbiAgICAgICAgdmFyIHRlYW1JZDtcbiAgICAgICAgdmFyIGN1cnJlbnRUYXNrO1xuICAgICAgICB2YXIgdGVhbVRhc2tzO1xuXG4gICAgICAgIHN3aXRjaCAocGF5bG9hZC5hY3Rpb24pIHtcblxuICAgICAgICAgICAgY2FzZSBNaXNzaW9uQ29uc3RhbnRzLlNUQVJUX1RBU0s6XG4gICAgICAgICAgICAgICAgdGVhbUlkID0gcGF5bG9hZC50ZWFtSWQ7XG4gICAgICAgICAgICAgICAgdGFza0lkID0gcGF5bG9hZC50YXNrSWQ7XG5cbiAgICAgICAgICAgICAgICB0ZWFtVGFza3MgPSBhc3NpZ25tZW50c1t0ZWFtSWRdO1xuICAgICAgICAgICAgICAgIHRlYW1UYXNrcy5jdXJyZW50ID0gdGFza0lkO1xuICAgICAgICAgICAgICAgIFRhc2tTdG9yZS5lbWl0Q2hhbmdlKCk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgIGNhc2UgTWlzc2lvbkNvbnN0YW50cy5DT01QTEVURURfVEFTSzpcbiAgICAgICAgICAgICAgICB0ZWFtSWQgPSBwYXlsb2FkLnRlYW1JZDtcbiAgICAgICAgICAgICAgICB0YXNrSWQgPSBwYXlsb2FkLnRhc2tJZDtcblxuICAgICAgICAgICAgICAgIHRlYW1UYXNrcyA9IGFzc2lnbm1lbnRzW3RlYW1JZF07XG4gICAgICAgICAgICAgICAgY3VycmVudFRhc2sgPSB0ZWFtVGFza3NbdGFza0lkXTtcbiAgICAgICAgICAgICAgICB0ZWFtVGFza3MuY3VycmVudCA9IGN1cnJlbnRUYXNrLm5leHQ7XG4gICAgICAgICAgICAgICAgVGFza1N0b3JlLmVtaXRDaGFuZ2UoKTtcbiAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgY2FzZSBNaXNzaW9uQ29uc3RhbnRzLlJFQ0VJVkVEX0FQUF9TVEFURTpcbiAgICAgICAgICAgICAgICB0ZWFtSWQgPSBSb3V0ZVN0b3JlLmdldFRlYW1JZCgpO1xuXG4gICAgICAgICAgICAgICAgdmFyIHRlYW1TdGF0ZSA9IHBheWxvYWQuYXBwU3RhdGVbdGVhbUlkXTtcblxuICAgICAgICAgICAgICAgIGlmICh0ZWFtU3RhdGUgJiYgdGVhbVN0YXRlLmN1cnJlbnRfdGFzaykge1xuICAgICAgICAgICAgICAgICAgICBjdXJyZW50VGFzayA9IHRlYW1TdGF0ZS5jdXJyZW50X3Rhc2s7XG4gICAgICAgICAgICAgICAgICAgIHRlYW1UYXNrcyA9IGFzc2lnbm1lbnRzW3RlYW1JZF07XG4gICAgICAgICAgICAgICAgICAgIHRlYW1UYXNrcy5jdXJyZW50ID0gY3VycmVudFRhc2s7XG4gICAgICAgICAgICAgICAgICAgIFRhc2tTdG9yZS5lbWl0Q2hhbmdlKCk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdHJ1ZTsgLy8gTm8gZXJyb3JzLiBOZWVkZWQgYnkgcHJvbWlzZSBpbiBEaXNwYXRjaGVyLlxuICAgIH0pXG5cbn0pO1xuXG53aW5kb3cuX19UYXNrU3RvcmUgPSBUYXNrU3RvcmU7XG5tb2R1bGUuZXhwb3J0cyA9IFRhc2tTdG9yZTtcbiIsIi8qIEEgc2luZ2xldG9uIHN0b3JlIHRoYXQgY2FuIGJlIHF1ZXJpZWQgZm9yIHJlbWFpbmluZyB0aW1lICovXG5cbmNvbnN0IGNoZWNrID0gcmVxdWlyZSgnY2hlY2stdHlwZXMnKTtcbmNvbnN0IEFwcERpc3BhdGNoZXIgPSByZXF1aXJlKCcuLi9hcHBkaXNwYXRjaGVyJyk7XG5jb25zdCBCYXNlU3RvcmUgPSByZXF1aXJlKCcuL2Jhc2Utc3RvcmUnKTtcbmNvbnN0IFRpbWVyQ29uc3RhbnRzID0gcmVxdWlyZSgnLi4vY29uc3RhbnRzL1RpbWVyQ29uc3RhbnRzJyk7XG5jb25zdCBNaXNzaW9uQ29uc3RhbnRzID0gcmVxdWlyZSgnLi4vY29uc3RhbnRzL01pc3Npb25Db25zdGFudHMnKTtcblxuXG4vLyBrZWVwaW5nIHN0YXRlIGhpZGRlbiBpbiB0aGUgbW9kdWxlXG52YXIgcmVtYWluaW5nVGltZSA9IHt9LFxuICAgIGluaXRpYWxUaW1lID0ge30sXG4gICAgaW50ZXJ2YWxJZCA9IHt9LFxuICAgIGVsYXBzZWRNaXNzaW9uVGltZSA9IDAsXG4gICAgbWlzc2lvblRpbWVyID0gbnVsbDtcblxuXG5mdW5jdGlvbiByZXNldCh0aW1lcklkKSB7XG4gICAgc3RvcCh0aW1lcklkKTtcbiAgICByZW1haW5pbmdUaW1lW3RpbWVySWRdID0gaW5pdGlhbFRpbWVbdGltZXJJZF07XG59XG5cbmZ1bmN0aW9uIHN0YXJ0KHRpbWVySWQpIHtcbiAgICBhc3NlcnRFeGlzdHModGltZXJJZCk7XG5cbiAgICBpbnRlcnZhbElkW3RpbWVySWRdID0gc2V0SW50ZXJ2YWwoZnVuY3Rpb24gZm4oKSB7XG4gICAgICAgIGlmIChyZW1haW5pbmdUaW1lW3RpbWVySWRdID4gMCkge1xuICAgICAgICAgICAgcmVtYWluaW5nVGltZVt0aW1lcklkXS0tO1xuICAgICAgICAgICAgVGltZXJTdG9yZS5lbWl0Q2hhbmdlKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzdG9wKHRpbWVySWQpO1xuICAgICAgICB9XG4gICAgfSwgMTAwMCk7XG59XG5cbmZ1bmN0aW9uIHN0b3AodGltZXJJZCkge1xuICAgIGFzc2VydEV4aXN0cyh0aW1lcklkKTtcblxuICAgIGNsZWFySW50ZXJ2YWwoaW50ZXJ2YWxJZFt0aW1lcklkXSk7XG4gICAgZGVsZXRlIGludGVydmFsSWRbdGltZXJJZF07XG4gICAgVGltZXJTdG9yZS5lbWl0Q2hhbmdlKCk7XG59XG5cbmZ1bmN0aW9uIHN0YXJ0TWlzc2lvblRpbWVyKCl7XG4gICAgc3RvcE1pc3Npb25UaW1lcigpO1xuICAgIG1pc3Npb25UaW1lciA9IHNldEludGVydmFsKCgpPT57XG4gICAgICAgIGVsYXBzZWRNaXNzaW9uVGltZSsrO1xuICAgICAgICBUaW1lclN0b3JlLmVtaXRDaGFuZ2UoKTtcbiAgICB9LDEwMDApO1xufVxuXG5mdW5jdGlvbiBzdG9wTWlzc2lvblRpbWVyKCl7XG4gICAgY2xlYXJJbnRlcnZhbChtaXNzaW9uVGltZXIpO1xufVxuXG5cbi8qKlxuICogQHBhcmFtIGRhdGEucmVtYWluaW5nVGltZSB7TnVtYmVyfVxuICogQHBhcmFtIGRhdGEudGltZXJJZCB7c3RyaW5nfVxuICovXG5mdW5jdGlvbiBoYW5kbGVSZW1haW5pbmdUaW1lQ2hhbmdlZChkYXRhKSB7XG4gICAgdmFyIHJlbWFpbmluZyA9IGRhdGEucmVtYWluaW5nVGltZTtcbiAgICBpZiAocmVtYWluaW5nIDw9IDApIHRocm93IG5ldyBUeXBlRXJyb3IoJ0dvdCBpbnZhbGlkIHJlbWFpbmluZyB0aW1lIDonICsgcmVtYWluaW5nKTtcblxuICAgIHJlbWFpbmluZ1RpbWVbZGF0YS50aW1lcklkXSA9IHJlbWFpbmluZztcbiAgICBpbml0aWFsVGltZVtkYXRhLnRpbWVySWRdID0gcmVtYWluaW5nO1xuICAgIFRpbWVyU3RvcmUuZW1pdENoYW5nZSgpO1xufVxuXG5mdW5jdGlvbiBhc3NlcnRFeGlzdHModGltZXJJZCkge1xuICAgIGNoZWNrLmFzc2VydCh0aW1lcklkIGluIHJlbWFpbmluZ1RpbWUsICdObyB0aW1lIHNldCBmb3IgdGltZXIgd2l0aCBpZCAnICsgdGltZXJJZCk7XG59XG5cbmNvbnN0IFRpbWVyU3RvcmUgPSBPYmplY3QuYXNzaWduKG5ldyBCYXNlU3RvcmUoKSwge1xuICAgIFxuICAgIGdldFJlbWFpbmluZ1RpbWUodGltZXJJZCkge1xuICAgICAgICBjaGVjay5udW1iZXIodGltZXJJZCk7XG4gICAgICAgIHJldHVybiByZW1haW5pbmdUaW1lW3RpbWVySWRdO1xuICAgIH0sXG5cbiAgICBpc1J1bm5pbmcodGltZXJJZCkge1xuICAgICAgICBjaGVjay5udW1iZXIodGltZXJJZCk7XG4gICAgICAgIHJldHVybiAhIWludGVydmFsSWRbdGltZXJJZF07XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFRoZSB0aW1lciBpcyBzZXQgKG9yIGhhcyBiZWVuIHJlc2V0KSwgYnV0IG5vdCBzdGFydGVkXG4gICAgICogQHBhcmFtIHRpbWVySWRcbiAgICAgKiBAcmV0dXJucyB0cnVlIGlmIHJlYWR5LCBmYWxzZSBpZiBydW5uaW5nIG9yIHRpbWVkIG91dFxuICAgICAqL1xuICAgIGlzUmVhZHlUb1N0YXJ0KHRpbWVySWQpIHtcbiAgICAgICAgY2hlY2subnVtYmVyKHRpbWVySWQpO1xuICAgICAgICBcbiAgICAgICAgaWYodGhpcy5pc1J1bm5pbmcodGltZXJJZCkpIHJldHVybiBmYWxzZTtcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0UmVtYWluaW5nVGltZSh0aW1lcklkKSA+IDA7XG4gICAgfSxcblxuICAgIGdldEVsYXBzZWRNaXNzaW9uVGltZSgpIHtcbiAgICAgICAgcmV0dXJuIGVsYXBzZWRNaXNzaW9uVGltZTtcbiAgICB9LFxuXG4gICAgZGlzcGF0Y2hlckluZGV4OiBBcHBEaXNwYXRjaGVyLnJlZ2lzdGVyKGZ1bmN0aW9uIChwYXlsb2FkKSB7XG4gICAgICAgIHZhciB7IGFjdGlvbiwgZGF0YX0gPSBwYXlsb2FkO1xuXG4gICAgICAgIHN3aXRjaCAoYWN0aW9uKSB7XG5cbiAgICAgICAgICAgIGNhc2UgVGltZXJDb25zdGFudHMuU0VUX1RJTUVSOlxuICAgICAgICAgICAgICAgIGhhbmRsZVJlbWFpbmluZ1RpbWVDaGFuZ2VkKGRhdGEpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICBjYXNlIFRpbWVyQ29uc3RhbnRzLlNUQVJUX1RJTUVSOlxuICAgICAgICAgICAgICAgIGFzc2VydEV4aXN0cyhkYXRhLnRpbWVySWQpO1xuXG4gICAgICAgICAgICAgICAgLy8gYXZvaWQgc2V0dGluZyB1cCBtb3JlIHRoYW4gb25lIHRpbWVyXG4gICAgICAgICAgICAgICAgaWYoIVRpbWVyU3RvcmUuaXNSdW5uaW5nKGRhdGEudGltZXJJZCkpe1xuICAgICAgICAgICAgICAgICAgICBzdGFydChkYXRhLnRpbWVySWQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgY2FzZSBUaW1lckNvbnN0YW50cy5TVE9QX1RJTUVSOlxuICAgICAgICAgICAgICAgIHN0b3AoZGF0YS50aW1lcklkKTtcbiAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgY2FzZSBUaW1lckNvbnN0YW50cy5SRVNFVF9USU1FUjpcbiAgICAgICAgICAgICAgICByZXNldChkYXRhLnRpbWVySWQpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICBjYXNlIE1pc3Npb25Db25zdGFudHMuTUlTU0lPTl9TVEFSVEVEX0VWRU5UOlxuICAgICAgICAgICAgICAgIHN0YXJ0TWlzc2lvblRpbWVyKCk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgIGNhc2UgTWlzc2lvbkNvbnN0YW50cy5NSVNTSU9OX1NUT1BQRURfRVZFTlQ6XG4gICAgICAgICAgICAgICAgc3RvcE1pc3Npb25UaW1lcigpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICBjYXNlIE1pc3Npb25Db25zdGFudHMuUkVDRUlWRURfQVBQX1NUQVRFOlxuICAgICAgICAgICAgICAgIHZhciBhcHBTdGF0ZSA9IHBheWxvYWQuYXBwU3RhdGU7XG5cbiAgICAgICAgICAgICAgICBlbGFwc2VkTWlzc2lvblRpbWUgPSBhcHBTdGF0ZS5lbGFwc2VkX21pc3Npb25fdGltZTtcblxuICAgICAgICAgICAgICAgIGlmKGFwcFN0YXRlLm1pc3Npb25fcnVubmluZykge1xuICAgICAgICAgICAgICAgICAgICBzdGFydE1pc3Npb25UaW1lcigpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHN0b3BNaXNzaW9uVGltZXIoKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBUaW1lclN0b3JlLmVtaXRDaGFuZ2UoKTtcbiAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgY2FzZSBNaXNzaW9uQ29uc3RhbnRzLk1JU1NJT05fVElNRV9TWU5DOlxuICAgICAgICAgICAgICAgIGVsYXBzZWRNaXNzaW9uVGltZSAgPSBkYXRhLmVsYXBzZWRNaXNzaW9uVGltZTtcbiAgICAgICAgICAgICAgICBUaW1lclN0b3JlLmVtaXRDaGFuZ2UoKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0cnVlOyAvLyBObyBlcnJvcnMuIE5lZWRlZCBieSBwcm9taXNlIGluIERpc3BhdGNoZXIuXG4gICAgfSlcblxufSk7XG5cbndpbmRvdy5fX1RpbWVTdG9yZSA9IFRpbWVyU3RvcmU7XG5tb2R1bGUuZXhwb3J0cyA9IFRpbWVyU3RvcmU7XG4iLCJjb25zdCB0ZWFtTWFwID0gT2JqZWN0LmZyZWV6ZSh7XG4gICAgJ3NjaWVuY2UnOiAnZm9yc2tuaW5nc3RlYW0nLFxuICAgICdjb21tdW5pY2F0aW9uJzogJ2tvbW11bmlrYXNqb25zdGVhbScsXG4gICAgJ3NlY3VyaXR5JzogJ3Npa2tlcmhldHN0ZWFtJyxcbiAgICAnYXN0cm9uYXV0JzogJ2FzdHJvbmF1dHRlYW0nXG59KTtcblxuZnVuY3Rpb24gb3RoZXJUZWFtTmFtZXMoY3VycmVudFRlYW1JZCkge1xuICAgIHJldHVybiBPYmplY3Qua2V5cyh0ZWFtTWFwKVxuICAgICAgICAuZmlsdGVyKChuKSA9PiBuICE9PSBjdXJyZW50VGVhbUlkICYmIG4gIT09ICdsZWFkZXInKVxuICAgICAgICAubWFwKChuKSA9PiB0ZWFtTWFwW25dKVxuICAgICAgICAuam9pbignLCAnKVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBuYW1lTWFwOiB0ZWFtTWFwLFxuICAgIG90aGVyVGVhbU5hbWVzXG59O1xuIiwiZnVuY3Rpb24gY2xlYW5Sb290UGF0aChwYXRoKSB7XG4gICAgLy8gY29udmVydCAnL3NjaWVuY2Uvc3RlcDEnID0+ICdzY2llbmNlJ1xuICAgIHJldHVybiBwYXRoLnJlcGxhY2UoL1xcLz8oXFx3KykuKi8sIFwiJDFcIik7XG59XG5cbmZ1bmN0aW9uIHJhbmRvbUludChtaW4sIG1heCkge1xuICAgIHJldHVybiBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAobWF4ICsgMSAtIG1pbikpICsgbWluO1xufVxuXG4vKipcbiAqIFN0YW5kYXJkaXplIG51bWJlciBwYXJzaW5nLlxuICogQHBhcmFtIHtzdHJpbmd9IHN0ciBpcyBhIG5vbi1lbXB0eSBzdHJpbmdcbiAqIEByZXR1cm5zIHtOdW1iZXJ9IC0gcG9zc2libHkgTmFOXG4gKlxuICogVGhlIHN0YW5kYXJkaXphdGlvbiBzdGVwIG9mIGNvbnZlcnRpbmcgJzEsMjMnIC0+ICcxLjIzJyBpcyBzdHJpY3RseSBub3QgbmVlZGVkIHdoZW4gaGFuZGxpbmcgaW5wdXRzIGZyb21cbiAqIGlucHV0IGZpZWxkcyB0aGF0IGhhdmUgdHlwZT0nbnVtYmVyJywgd2hlcmUgdGhpcyBoYXBwZW5zIGF1dG9tYXRpY2FsbHkuXG4gKiBUaGUgcmVzdCBvZiB0aGUgZXJyb3IgaGFuZGxpbmcgaXMgdXNlZnVsLCBub25lIHRoZSBsZXNzLlxuICovXG5mdW5jdGlvbiBwYXJzZU51bWJlcihzdHIpIHtcbiAgICBpZiAoIXR5cGVvZiBzdHIgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIHRocm93IFR5cGVFcnJvcignVGhpcyBmdW5jdGlvbiBleHBlY3RzIHN0cmluZ3MuIEdvdCBzb21ldGhpbmcgZWxzZTogJyArIHN0cik7XG4gICAgfVxuXG4gICAgLy8gc3RhbmRhcmRpemUgdGhlIG51bWJlciBmb3JtYXQgLSByZW1vdmluZyBOb3J3ZWdpYW4gY3VycmVuY3kgZm9ybWF0XG4gICAgbGV0IGNsZWFuZWRTdHJpbmcgPSBzdHIudHJpbSgpLnJlcGxhY2UoJywnLCAnLicpO1xuXG4gICAgaWYgKCFjbGVhbmVkU3RyaW5nLmxlbmd0aCkge1xuICAgICAgICB0aHJvdyBUeXBlRXJyb3IoJ0dvdCBhIGJsYW5rIHN0cmluZycpO1xuICAgIH1cblxuICAgIGlmIChjbGVhbmVkU3RyaW5nLmluZGV4T2YoJy4nKSAhPT0gLTEpIHtcbiAgICAgICAgcmV0dXJuIHBhcnNlRmxvYXQoY2xlYW5lZFN0cmluZywgMTApO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBwYXJzZUludChjbGVhbmVkU3RyaW5nLCAxMCk7XG4gICAgfVxufVxuXG4vLyBnZW5lcmF0ZXMgYSBVVUlEXG4vLyB3b3JsZHMgc21hbGxlc3QgdXVpZCBsaWIuIGNyYXp5IHNoaXQgOilcbi8vIEBzZWUgaHR0cHM6Ly9naXN0LmdpdGh1Yi5jb20vamVkLzk4Mjg4M1xuZnVuY3Rpb24gYihhKSB7XG4gICAgcmV0dXJuIGEgPyAoYSBeIE1hdGgucmFuZG9tKCkgKiAxNiA+PiBhIC8gNCkudG9TdHJpbmcoMTYpIDogKFsxZTddICsgLTFlMyArIC00ZTMgKyAtOGUzICsgLTFlMTEpLnJlcGxhY2UoL1swMThdL2csIGIpXG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGNsZWFuUm9vdFBhdGgsIHJhbmRvbUludCwgcGFyc2VOdW1iZXIsIHV1aWQ6IGJcbn07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHsgXCJkZWZhdWx0XCI6IHJlcXVpcmUoXCJjb3JlLWpzL2xpYnJhcnkvZm4vb2JqZWN0L2Fzc2lnblwiKSwgX19lc01vZHVsZTogdHJ1ZSB9OyIsIm1vZHVsZS5leHBvcnRzID0geyBcImRlZmF1bHRcIjogcmVxdWlyZShcImNvcmUtanMvbGlicmFyeS9mbi9vYmplY3QvZnJlZXplXCIpLCBfX2VzTW9kdWxlOiB0cnVlIH07IiwibW9kdWxlLmV4cG9ydHMgPSB7IFwiZGVmYXVsdFwiOiByZXF1aXJlKFwiY29yZS1qcy9saWJyYXJ5L2ZuL29iamVjdC9rZXlzXCIpLCBfX2VzTW9kdWxlOiB0cnVlIH07IiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbmV4cG9ydHNbXCJkZWZhdWx0XCJdID0gZnVuY3Rpb24gKGluc3RhbmNlLCBDb25zdHJ1Y3Rvcikge1xuICBpZiAoIShpbnN0YW5jZSBpbnN0YW5jZW9mIENvbnN0cnVjdG9yKSkge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJDYW5ub3QgY2FsbCBhIGNsYXNzIGFzIGEgZnVuY3Rpb25cIik7XG4gIH1cbn07XG5cbmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7IiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbmV4cG9ydHNbXCJkZWZhdWx0XCJdID0gKGZ1bmN0aW9uICgpIHtcbiAgZnVuY3Rpb24gZGVmaW5lUHJvcGVydGllcyh0YXJnZXQsIHByb3BzKSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwcm9wcy5sZW5ndGg7IGkrKykge1xuICAgICAgdmFyIGRlc2NyaXB0b3IgPSBwcm9wc1tpXTtcbiAgICAgIGRlc2NyaXB0b3IuZW51bWVyYWJsZSA9IGRlc2NyaXB0b3IuZW51bWVyYWJsZSB8fCBmYWxzZTtcbiAgICAgIGRlc2NyaXB0b3IuY29uZmlndXJhYmxlID0gdHJ1ZTtcbiAgICAgIGlmIChcInZhbHVlXCIgaW4gZGVzY3JpcHRvcikgZGVzY3JpcHRvci53cml0YWJsZSA9IHRydWU7XG4gICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBkZXNjcmlwdG9yLmtleSwgZGVzY3JpcHRvcik7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGZ1bmN0aW9uIChDb25zdHJ1Y3RvciwgcHJvdG9Qcm9wcywgc3RhdGljUHJvcHMpIHtcbiAgICBpZiAocHJvdG9Qcm9wcykgZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvci5wcm90b3R5cGUsIHByb3RvUHJvcHMpO1xuICAgIGlmIChzdGF0aWNQcm9wcykgZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvciwgc3RhdGljUHJvcHMpO1xuICAgIHJldHVybiBDb25zdHJ1Y3RvcjtcbiAgfTtcbn0pKCk7XG5cbmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7IiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbnZhciBfT2JqZWN0JGFzc2lnbiA9IHJlcXVpcmUoXCJiYWJlbC1ydW50aW1lL2NvcmUtanMvb2JqZWN0L2Fzc2lnblwiKVtcImRlZmF1bHRcIl07XG5cbmV4cG9ydHNbXCJkZWZhdWx0XCJdID0gX09iamVjdCRhc3NpZ24gfHwgZnVuY3Rpb24gKHRhcmdldCkge1xuICBmb3IgKHZhciBpID0gMTsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgIHZhciBzb3VyY2UgPSBhcmd1bWVudHNbaV07XG5cbiAgICBmb3IgKHZhciBrZXkgaW4gc291cmNlKSB7XG4gICAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHNvdXJjZSwga2V5KSkge1xuICAgICAgICB0YXJnZXRba2V5XSA9IHNvdXJjZVtrZXldO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiB0YXJnZXQ7XG59O1xuXG5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlOyIsIlwidXNlIHN0cmljdFwiO1xuXG5leHBvcnRzW1wiZGVmYXVsdFwiXSA9IGZ1bmN0aW9uIChzdWJDbGFzcywgc3VwZXJDbGFzcykge1xuICBpZiAodHlwZW9mIHN1cGVyQ2xhc3MgIT09IFwiZnVuY3Rpb25cIiAmJiBzdXBlckNsYXNzICE9PSBudWxsKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIlN1cGVyIGV4cHJlc3Npb24gbXVzdCBlaXRoZXIgYmUgbnVsbCBvciBhIGZ1bmN0aW9uLCBub3QgXCIgKyB0eXBlb2Ygc3VwZXJDbGFzcyk7XG4gIH1cblxuICBzdWJDbGFzcy5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKHN1cGVyQ2xhc3MgJiYgc3VwZXJDbGFzcy5wcm90b3R5cGUsIHtcbiAgICBjb25zdHJ1Y3Rvcjoge1xuICAgICAgdmFsdWU6IHN1YkNsYXNzLFxuICAgICAgZW51bWVyYWJsZTogZmFsc2UsXG4gICAgICB3cml0YWJsZTogdHJ1ZSxcbiAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH1cbiAgfSk7XG4gIGlmIChzdXBlckNsYXNzKSBzdWJDbGFzcy5fX3Byb3RvX18gPSBzdXBlckNsYXNzO1xufTtcblxuZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTsiLCJyZXF1aXJlKCcuLi8uLi9tb2R1bGVzL2VzNi5vYmplY3QuYXNzaWduJyk7XHJcbm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnLi4vLi4vbW9kdWxlcy8kJykuY29yZS5PYmplY3QuYXNzaWduOyIsInJlcXVpcmUoJy4uLy4uL21vZHVsZXMvZXM2Lm9iamVjdC5zdGF0aWNzLWFjY2VwdC1wcmltaXRpdmVzJyk7XHJcbm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnLi4vLi4vbW9kdWxlcy8kJykuY29yZS5PYmplY3QuZnJlZXplOyIsInJlcXVpcmUoJy4uLy4uL21vZHVsZXMvZXM2Lm9iamVjdC5zdGF0aWNzLWFjY2VwdC1wcmltaXRpdmVzJyk7XHJcbm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnLi4vLi4vbW9kdWxlcy8kJykuY29yZS5PYmplY3Qua2V5czsiLCJ2YXIgJCA9IHJlcXVpcmUoJy4vJCcpO1xyXG4vLyAxOS4xLjIuMSBPYmplY3QuYXNzaWduKHRhcmdldCwgc291cmNlLCAuLi4pXHJcbi8qZXNsaW50LWRpc2FibGUgbm8tdW51c2VkLXZhcnMgKi9cclxubW9kdWxlLmV4cG9ydHMgPSBPYmplY3QuYXNzaWduIHx8IGZ1bmN0aW9uIGFzc2lnbih0YXJnZXQsIHNvdXJjZSl7XHJcbi8qZXNsaW50LWVuYWJsZSBuby11bnVzZWQtdmFycyAqL1xyXG4gIHZhciBUID0gT2JqZWN0KCQuYXNzZXJ0RGVmaW5lZCh0YXJnZXQpKVxyXG4gICAgLCBsID0gYXJndW1lbnRzLmxlbmd0aFxyXG4gICAgLCBpID0gMTtcclxuICB3aGlsZShsID4gaSl7XHJcbiAgICB2YXIgUyAgICAgID0gJC5FUzVPYmplY3QoYXJndW1lbnRzW2krK10pXHJcbiAgICAgICwga2V5cyAgID0gJC5nZXRLZXlzKFMpXHJcbiAgICAgICwgbGVuZ3RoID0ga2V5cy5sZW5ndGhcclxuICAgICAgLCBqICAgICAgPSAwXHJcbiAgICAgICwga2V5O1xyXG4gICAgd2hpbGUobGVuZ3RoID4gailUW2tleSA9IGtleXNbaisrXV0gPSBTW2tleV07XHJcbiAgfVxyXG4gIHJldHVybiBUO1xyXG59OyIsInZhciAkICAgICAgICAgID0gcmVxdWlyZSgnLi8kJylcclxuICAsIGdsb2JhbCAgICAgPSAkLmdcclxuICAsIGNvcmUgICAgICAgPSAkLmNvcmVcclxuICAsIGlzRnVuY3Rpb24gPSAkLmlzRnVuY3Rpb247XHJcbmZ1bmN0aW9uIGN0eChmbiwgdGhhdCl7XHJcbiAgcmV0dXJuIGZ1bmN0aW9uKCl7XHJcbiAgICByZXR1cm4gZm4uYXBwbHkodGhhdCwgYXJndW1lbnRzKTtcclxuICB9O1xyXG59XHJcbi8vIHR5cGUgYml0bWFwXHJcbiRkZWYuRiA9IDE7ICAvLyBmb3JjZWRcclxuJGRlZi5HID0gMjsgIC8vIGdsb2JhbFxyXG4kZGVmLlMgPSA0OyAgLy8gc3RhdGljXHJcbiRkZWYuUCA9IDg7ICAvLyBwcm90b1xyXG4kZGVmLkIgPSAxNjsgLy8gYmluZFxyXG4kZGVmLlcgPSAzMjsgLy8gd3JhcFxyXG5mdW5jdGlvbiAkZGVmKHR5cGUsIG5hbWUsIHNvdXJjZSl7XHJcbiAgdmFyIGtleSwgb3duLCBvdXQsIGV4cFxyXG4gICAgLCBpc0dsb2JhbCA9IHR5cGUgJiAkZGVmLkdcclxuICAgICwgdGFyZ2V0ICAgPSBpc0dsb2JhbCA/IGdsb2JhbCA6IHR5cGUgJiAkZGVmLlNcclxuICAgICAgICA/IGdsb2JhbFtuYW1lXSA6IChnbG9iYWxbbmFtZV0gfHwge30pLnByb3RvdHlwZVxyXG4gICAgLCBleHBvcnRzICA9IGlzR2xvYmFsID8gY29yZSA6IGNvcmVbbmFtZV0gfHwgKGNvcmVbbmFtZV0gPSB7fSk7XHJcbiAgaWYoaXNHbG9iYWwpc291cmNlID0gbmFtZTtcclxuICBmb3Ioa2V5IGluIHNvdXJjZSl7XHJcbiAgICAvLyBjb250YWlucyBpbiBuYXRpdmVcclxuICAgIG93biA9ICEodHlwZSAmICRkZWYuRikgJiYgdGFyZ2V0ICYmIGtleSBpbiB0YXJnZXQ7XHJcbiAgICBpZihvd24gJiYga2V5IGluIGV4cG9ydHMpY29udGludWU7XHJcbiAgICAvLyBleHBvcnQgbmF0aXZlIG9yIHBhc3NlZFxyXG4gICAgb3V0ID0gb3duID8gdGFyZ2V0W2tleV0gOiBzb3VyY2Vba2V5XTtcclxuICAgIC8vIHByZXZlbnQgZ2xvYmFsIHBvbGx1dGlvbiBmb3IgbmFtZXNwYWNlc1xyXG4gICAgaWYoaXNHbG9iYWwgJiYgIWlzRnVuY3Rpb24odGFyZ2V0W2tleV0pKWV4cCA9IHNvdXJjZVtrZXldO1xyXG4gICAgLy8gYmluZCB0aW1lcnMgdG8gZ2xvYmFsIGZvciBjYWxsIGZyb20gZXhwb3J0IGNvbnRleHRcclxuICAgIGVsc2UgaWYodHlwZSAmICRkZWYuQiAmJiBvd24pZXhwID0gY3R4KG91dCwgZ2xvYmFsKTtcclxuICAgIC8vIHdyYXAgZ2xvYmFsIGNvbnN0cnVjdG9ycyBmb3IgcHJldmVudCBjaGFuZ2UgdGhlbSBpbiBsaWJyYXJ5XHJcbiAgICBlbHNlIGlmKHR5cGUgJiAkZGVmLlcgJiYgdGFyZ2V0W2tleV0gPT0gb3V0KSFmdW5jdGlvbihDKXtcclxuICAgICAgZXhwID0gZnVuY3Rpb24ocGFyYW0pe1xyXG4gICAgICAgIHJldHVybiB0aGlzIGluc3RhbmNlb2YgQyA/IG5ldyBDKHBhcmFtKSA6IEMocGFyYW0pO1xyXG4gICAgICB9O1xyXG4gICAgICBleHAucHJvdG90eXBlID0gQy5wcm90b3R5cGU7XHJcbiAgICB9KG91dCk7XHJcbiAgICBlbHNlIGV4cCA9IHR5cGUgJiAkZGVmLlAgJiYgaXNGdW5jdGlvbihvdXQpID8gY3R4KEZ1bmN0aW9uLmNhbGwsIG91dCkgOiBvdXQ7XHJcbiAgICAvLyBleHBvcnRcclxuICAgICQuaGlkZShleHBvcnRzLCBrZXksIGV4cCk7XHJcbiAgfVxyXG59XHJcbm1vZHVsZS5leHBvcnRzID0gJGRlZjsiLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCQpe1xyXG4gICQuRlcgICA9IGZhbHNlO1xyXG4gICQucGF0aCA9ICQuY29yZTtcclxuICByZXR1cm4gJDtcclxufTsiLCIndXNlIHN0cmljdCc7XHJcbnZhciBnbG9iYWwgPSB0eXBlb2Ygc2VsZiAhPSAndW5kZWZpbmVkJyA/IHNlbGYgOiBGdW5jdGlvbigncmV0dXJuIHRoaXMnKSgpXHJcbiAgLCBjb3JlICAgPSB7fVxyXG4gICwgZGVmaW5lUHJvcGVydHkgPSBPYmplY3QuZGVmaW5lUHJvcGVydHlcclxuICAsIGhhc093blByb3BlcnR5ID0ge30uaGFzT3duUHJvcGVydHlcclxuICAsIGNlaWwgID0gTWF0aC5jZWlsXHJcbiAgLCBmbG9vciA9IE1hdGguZmxvb3JcclxuICAsIG1heCAgID0gTWF0aC5tYXhcclxuICAsIG1pbiAgID0gTWF0aC5taW47XHJcbi8vIFRoZSBlbmdpbmUgd29ya3MgZmluZSB3aXRoIGRlc2NyaXB0b3JzPyBUaGFuaydzIElFOCBmb3IgaGlzIGZ1bm55IGRlZmluZVByb3BlcnR5LlxyXG52YXIgREVTQyA9ICEhZnVuY3Rpb24oKXtcclxuICB0cnkge1xyXG4gICAgcmV0dXJuIGRlZmluZVByb3BlcnR5KHt9LCAnYScsIHtnZXQ6IGZ1bmN0aW9uKCl7IHJldHVybiAyOyB9fSkuYSA9PSAyO1xyXG4gIH0gY2F0Y2goZSl7IC8qIGVtcHR5ICovIH1cclxufSgpO1xyXG52YXIgaGlkZSA9IGNyZWF0ZURlZmluZXIoMSk7XHJcbi8vIDcuMS40IFRvSW50ZWdlclxyXG5mdW5jdGlvbiB0b0ludGVnZXIoaXQpe1xyXG4gIHJldHVybiBpc05hTihpdCA9ICtpdCkgPyAwIDogKGl0ID4gMCA/IGZsb29yIDogY2VpbCkoaXQpO1xyXG59XHJcbmZ1bmN0aW9uIGRlc2MoYml0bWFwLCB2YWx1ZSl7XHJcbiAgcmV0dXJuIHtcclxuICAgIGVudW1lcmFibGUgIDogIShiaXRtYXAgJiAxKSxcclxuICAgIGNvbmZpZ3VyYWJsZTogIShiaXRtYXAgJiAyKSxcclxuICAgIHdyaXRhYmxlICAgIDogIShiaXRtYXAgJiA0KSxcclxuICAgIHZhbHVlICAgICAgIDogdmFsdWVcclxuICB9O1xyXG59XHJcbmZ1bmN0aW9uIHNpbXBsZVNldChvYmplY3QsIGtleSwgdmFsdWUpe1xyXG4gIG9iamVjdFtrZXldID0gdmFsdWU7XHJcbiAgcmV0dXJuIG9iamVjdDtcclxufVxyXG5mdW5jdGlvbiBjcmVhdGVEZWZpbmVyKGJpdG1hcCl7XHJcbiAgcmV0dXJuIERFU0MgPyBmdW5jdGlvbihvYmplY3QsIGtleSwgdmFsdWUpe1xyXG4gICAgcmV0dXJuICQuc2V0RGVzYyhvYmplY3QsIGtleSwgZGVzYyhiaXRtYXAsIHZhbHVlKSk7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tdXNlLWJlZm9yZS1kZWZpbmVcclxuICB9IDogc2ltcGxlU2V0O1xyXG59XHJcblxyXG5mdW5jdGlvbiBpc09iamVjdChpdCl7XHJcbiAgcmV0dXJuIGl0ICE9PSBudWxsICYmICh0eXBlb2YgaXQgPT0gJ29iamVjdCcgfHwgdHlwZW9mIGl0ID09ICdmdW5jdGlvbicpO1xyXG59XHJcbmZ1bmN0aW9uIGlzRnVuY3Rpb24oaXQpe1xyXG4gIHJldHVybiB0eXBlb2YgaXQgPT0gJ2Z1bmN0aW9uJztcclxufVxyXG5mdW5jdGlvbiBhc3NlcnREZWZpbmVkKGl0KXtcclxuICBpZihpdCA9PSB1bmRlZmluZWQpdGhyb3cgVHlwZUVycm9yKFwiQ2FuJ3QgY2FsbCBtZXRob2Qgb24gIFwiICsgaXQpO1xyXG4gIHJldHVybiBpdDtcclxufVxyXG5cclxudmFyICQgPSBtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4vJC5mdycpKHtcclxuICBnOiBnbG9iYWwsXHJcbiAgY29yZTogY29yZSxcclxuICBodG1sOiBnbG9iYWwuZG9jdW1lbnQgJiYgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LFxyXG4gIC8vIGh0dHA6Ly9qc3BlcmYuY29tL2NvcmUtanMtaXNvYmplY3RcclxuICBpc09iamVjdDogICBpc09iamVjdCxcclxuICBpc0Z1bmN0aW9uOiBpc0Z1bmN0aW9uLFxyXG4gIGl0OiBmdW5jdGlvbihpdCl7XHJcbiAgICByZXR1cm4gaXQ7XHJcbiAgfSxcclxuICB0aGF0OiBmdW5jdGlvbigpe1xyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfSxcclxuICAvLyA3LjEuNCBUb0ludGVnZXJcclxuICB0b0ludGVnZXI6IHRvSW50ZWdlcixcclxuICAvLyA3LjEuMTUgVG9MZW5ndGhcclxuICB0b0xlbmd0aDogZnVuY3Rpb24oaXQpe1xyXG4gICAgcmV0dXJuIGl0ID4gMCA/IG1pbih0b0ludGVnZXIoaXQpLCAweDFmZmZmZmZmZmZmZmZmKSA6IDA7IC8vIHBvdygyLCA1MykgLSAxID09IDkwMDcxOTkyNTQ3NDA5OTFcclxuICB9LFxyXG4gIHRvSW5kZXg6IGZ1bmN0aW9uKGluZGV4LCBsZW5ndGgpe1xyXG4gICAgaW5kZXggPSB0b0ludGVnZXIoaW5kZXgpO1xyXG4gICAgcmV0dXJuIGluZGV4IDwgMCA/IG1heChpbmRleCArIGxlbmd0aCwgMCkgOiBtaW4oaW5kZXgsIGxlbmd0aCk7XHJcbiAgfSxcclxuICBoYXM6IGZ1bmN0aW9uKGl0LCBrZXkpe1xyXG4gICAgcmV0dXJuIGhhc093blByb3BlcnR5LmNhbGwoaXQsIGtleSk7XHJcbiAgfSxcclxuICBjcmVhdGU6ICAgICBPYmplY3QuY3JlYXRlLFxyXG4gIGdldFByb3RvOiAgIE9iamVjdC5nZXRQcm90b3R5cGVPZixcclxuICBERVNDOiAgICAgICBERVNDLFxyXG4gIGRlc2M6ICAgICAgIGRlc2MsXHJcbiAgZ2V0RGVzYzogICAgT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcixcclxuICBzZXREZXNjOiAgICBkZWZpbmVQcm9wZXJ0eSxcclxuICBnZXRLZXlzOiAgICBPYmplY3Qua2V5cyxcclxuICBnZXROYW1lczogICBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyxcclxuICBnZXRTeW1ib2xzOiBPYmplY3QuZ2V0T3duUHJvcGVydHlTeW1ib2xzLFxyXG4gIC8vIER1bW15LCBmaXggZm9yIG5vdCBhcnJheS1saWtlIEVTMyBzdHJpbmcgaW4gZXM1IG1vZHVsZVxyXG4gIGFzc2VydERlZmluZWQ6IGFzc2VydERlZmluZWQsXHJcbiAgRVM1T2JqZWN0OiBPYmplY3QsXHJcbiAgdG9PYmplY3Q6IGZ1bmN0aW9uKGl0KXtcclxuICAgIHJldHVybiAkLkVTNU9iamVjdChhc3NlcnREZWZpbmVkKGl0KSk7XHJcbiAgfSxcclxuICBoaWRlOiBoaWRlLFxyXG4gIGRlZjogY3JlYXRlRGVmaW5lcigwKSxcclxuICBzZXQ6IGdsb2JhbC5TeW1ib2wgPyBzaW1wbGVTZXQgOiBoaWRlLFxyXG4gIG1peDogZnVuY3Rpb24odGFyZ2V0LCBzcmMpe1xyXG4gICAgZm9yKHZhciBrZXkgaW4gc3JjKWhpZGUodGFyZ2V0LCBrZXksIHNyY1trZXldKTtcclxuICAgIHJldHVybiB0YXJnZXQ7XHJcbiAgfSxcclxuICBlYWNoOiBbXS5mb3JFYWNoXHJcbn0pO1xyXG5pZih0eXBlb2YgX19lICE9ICd1bmRlZmluZWQnKV9fZSA9IGNvcmU7XHJcbmlmKHR5cGVvZiBfX2cgIT0gJ3VuZGVmaW5lZCcpX19nID0gZ2xvYmFsOyIsIi8vIDE5LjEuMy4xIE9iamVjdC5hc3NpZ24odGFyZ2V0LCBzb3VyY2UpXHJcbnZhciAkZGVmID0gcmVxdWlyZSgnLi8kLmRlZicpO1xyXG4kZGVmKCRkZWYuUywgJ09iamVjdCcsIHthc3NpZ246IHJlcXVpcmUoJy4vJC5hc3NpZ24nKX0pOyIsInZhciAkICAgICAgICA9IHJlcXVpcmUoJy4vJCcpXHJcbiAgLCAkZGVmICAgICA9IHJlcXVpcmUoJy4vJC5kZWYnKVxyXG4gICwgaXNPYmplY3QgPSAkLmlzT2JqZWN0XHJcbiAgLCB0b09iamVjdCA9ICQudG9PYmplY3Q7XHJcbmZ1bmN0aW9uIHdyYXBPYmplY3RNZXRob2QoTUVUSE9ELCBNT0RFKXtcclxuICB2YXIgZm4gID0gKCQuY29yZS5PYmplY3QgfHwge30pW01FVEhPRF0gfHwgT2JqZWN0W01FVEhPRF1cclxuICAgICwgZiAgID0gMFxyXG4gICAgLCBvICAgPSB7fTtcclxuICBvW01FVEhPRF0gPSBNT0RFID09IDEgPyBmdW5jdGlvbihpdCl7XHJcbiAgICByZXR1cm4gaXNPYmplY3QoaXQpID8gZm4oaXQpIDogaXQ7XHJcbiAgfSA6IE1PREUgPT0gMiA/IGZ1bmN0aW9uKGl0KXtcclxuICAgIHJldHVybiBpc09iamVjdChpdCkgPyBmbihpdCkgOiB0cnVlO1xyXG4gIH0gOiBNT0RFID09IDMgPyBmdW5jdGlvbihpdCl7XHJcbiAgICByZXR1cm4gaXNPYmplY3QoaXQpID8gZm4oaXQpIDogZmFsc2U7XHJcbiAgfSA6IE1PREUgPT0gNCA/IGZ1bmN0aW9uIGdldE93blByb3BlcnR5RGVzY3JpcHRvcihpdCwga2V5KXtcclxuICAgIHJldHVybiBmbih0b09iamVjdChpdCksIGtleSk7XHJcbiAgfSA6IE1PREUgPT0gNSA/IGZ1bmN0aW9uIGdldFByb3RvdHlwZU9mKGl0KXtcclxuICAgIHJldHVybiBmbihPYmplY3QoJC5hc3NlcnREZWZpbmVkKGl0KSkpO1xyXG4gIH0gOiBmdW5jdGlvbihpdCl7XHJcbiAgICByZXR1cm4gZm4odG9PYmplY3QoaXQpKTtcclxuICB9O1xyXG4gIHRyeSB7XHJcbiAgICBmbigneicpO1xyXG4gIH0gY2F0Y2goZSl7XHJcbiAgICBmID0gMTtcclxuICB9XHJcbiAgJGRlZigkZGVmLlMgKyAkZGVmLkYgKiBmLCAnT2JqZWN0Jywgbyk7XHJcbn1cclxud3JhcE9iamVjdE1ldGhvZCgnZnJlZXplJywgMSk7XHJcbndyYXBPYmplY3RNZXRob2QoJ3NlYWwnLCAxKTtcclxud3JhcE9iamVjdE1ldGhvZCgncHJldmVudEV4dGVuc2lvbnMnLCAxKTtcclxud3JhcE9iamVjdE1ldGhvZCgnaXNGcm96ZW4nLCAyKTtcclxud3JhcE9iamVjdE1ldGhvZCgnaXNTZWFsZWQnLCAyKTtcclxud3JhcE9iamVjdE1ldGhvZCgnaXNFeHRlbnNpYmxlJywgMyk7XHJcbndyYXBPYmplY3RNZXRob2QoJ2dldE93blByb3BlcnR5RGVzY3JpcHRvcicsIDQpO1xyXG53cmFwT2JqZWN0TWV0aG9kKCdnZXRQcm90b3R5cGVPZicsIDUpO1xyXG53cmFwT2JqZWN0TWV0aG9kKCdrZXlzJyk7XHJcbndyYXBPYmplY3RNZXRob2QoJ2dldE93blByb3BlcnR5TmFtZXMnKTsiLG51bGwsIi8qIVxuICogVGhlIGJ1ZmZlciBtb2R1bGUgZnJvbSBub2RlLmpzLCBmb3IgdGhlIGJyb3dzZXIuXG4gKlxuICogQGF1dGhvciAgIEZlcm9zcyBBYm91a2hhZGlqZWggPGZlcm9zc0BmZXJvc3Mub3JnPiA8aHR0cDovL2Zlcm9zcy5vcmc+XG4gKiBAbGljZW5zZSAgTUlUXG4gKi9cblxudmFyIGJhc2U2NCA9IHJlcXVpcmUoJ2Jhc2U2NC1qcycpXG52YXIgaWVlZTc1NCA9IHJlcXVpcmUoJ2llZWU3NTQnKVxudmFyIGlzQXJyYXkgPSByZXF1aXJlKCdpcy1hcnJheScpXG5cbmV4cG9ydHMuQnVmZmVyID0gQnVmZmVyXG5leHBvcnRzLlNsb3dCdWZmZXIgPSBTbG93QnVmZmVyXG5leHBvcnRzLklOU1BFQ1RfTUFYX0JZVEVTID0gNTBcbkJ1ZmZlci5wb29sU2l6ZSA9IDgxOTIgLy8gbm90IHVzZWQgYnkgdGhpcyBpbXBsZW1lbnRhdGlvblxuXG52YXIga01heExlbmd0aCA9IDB4M2ZmZmZmZmZcbnZhciByb290UGFyZW50ID0ge31cblxuLyoqXG4gKiBJZiBgQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlRgOlxuICogICA9PT0gdHJ1ZSAgICBVc2UgVWludDhBcnJheSBpbXBsZW1lbnRhdGlvbiAoZmFzdGVzdClcbiAqICAgPT09IGZhbHNlICAgVXNlIE9iamVjdCBpbXBsZW1lbnRhdGlvbiAobW9zdCBjb21wYXRpYmxlLCBldmVuIElFNilcbiAqXG4gKiBCcm93c2VycyB0aGF0IHN1cHBvcnQgdHlwZWQgYXJyYXlzIGFyZSBJRSAxMCssIEZpcmVmb3ggNCssIENocm9tZSA3KywgU2FmYXJpIDUuMSssXG4gKiBPcGVyYSAxMS42KywgaU9TIDQuMisuXG4gKlxuICogTm90ZTpcbiAqXG4gKiAtIEltcGxlbWVudGF0aW9uIG11c3Qgc3VwcG9ydCBhZGRpbmcgbmV3IHByb3BlcnRpZXMgdG8gYFVpbnQ4QXJyYXlgIGluc3RhbmNlcy5cbiAqICAgRmlyZWZveCA0LTI5IGxhY2tlZCBzdXBwb3J0LCBmaXhlZCBpbiBGaXJlZm94IDMwKy5cbiAqICAgU2VlOiBodHRwczovL2J1Z3ppbGxhLm1vemlsbGEub3JnL3Nob3dfYnVnLmNnaT9pZD02OTU0MzguXG4gKlxuICogIC0gQ2hyb21lIDktMTAgaXMgbWlzc2luZyB0aGUgYFR5cGVkQXJyYXkucHJvdG90eXBlLnN1YmFycmF5YCBmdW5jdGlvbi5cbiAqXG4gKiAgLSBJRTEwIGhhcyBhIGJyb2tlbiBgVHlwZWRBcnJheS5wcm90b3R5cGUuc3ViYXJyYXlgIGZ1bmN0aW9uIHdoaWNoIHJldHVybnMgYXJyYXlzIG9mXG4gKiAgICBpbmNvcnJlY3QgbGVuZ3RoIGluIHNvbWUgc2l0dWF0aW9ucy5cbiAqXG4gKiBXZSBkZXRlY3QgdGhlc2UgYnVnZ3kgYnJvd3NlcnMgYW5kIHNldCBgQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlRgIHRvIGBmYWxzZWAgc28gdGhleSB3aWxsXG4gKiBnZXQgdGhlIE9iamVjdCBpbXBsZW1lbnRhdGlvbiwgd2hpY2ggaXMgc2xvd2VyIGJ1dCB3aWxsIHdvcmsgY29ycmVjdGx5LlxuICovXG5CdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCA9IChmdW5jdGlvbiAoKSB7XG4gIHRyeSB7XG4gICAgdmFyIGJ1ZiA9IG5ldyBBcnJheUJ1ZmZlcigwKVxuICAgIHZhciBhcnIgPSBuZXcgVWludDhBcnJheShidWYpXG4gICAgYXJyLmZvbyA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIDQyIH1cbiAgICByZXR1cm4gYXJyLmZvbygpID09PSA0MiAmJiAvLyB0eXBlZCBhcnJheSBpbnN0YW5jZXMgY2FuIGJlIGF1Z21lbnRlZFxuICAgICAgICB0eXBlb2YgYXJyLnN1YmFycmF5ID09PSAnZnVuY3Rpb24nICYmIC8vIGNocm9tZSA5LTEwIGxhY2sgYHN1YmFycmF5YFxuICAgICAgICBuZXcgVWludDhBcnJheSgxKS5zdWJhcnJheSgxLCAxKS5ieXRlTGVuZ3RoID09PSAwIC8vIGllMTAgaGFzIGJyb2tlbiBgc3ViYXJyYXlgXG4gIH0gY2F0Y2ggKGUpIHtcbiAgICByZXR1cm4gZmFsc2VcbiAgfVxufSkoKVxuXG4vKipcbiAqIENsYXNzOiBCdWZmZXJcbiAqID09PT09PT09PT09PT1cbiAqXG4gKiBUaGUgQnVmZmVyIGNvbnN0cnVjdG9yIHJldHVybnMgaW5zdGFuY2VzIG9mIGBVaW50OEFycmF5YCB0aGF0IGFyZSBhdWdtZW50ZWRcbiAqIHdpdGggZnVuY3Rpb24gcHJvcGVydGllcyBmb3IgYWxsIHRoZSBub2RlIGBCdWZmZXJgIEFQSSBmdW5jdGlvbnMuIFdlIHVzZVxuICogYFVpbnQ4QXJyYXlgIHNvIHRoYXQgc3F1YXJlIGJyYWNrZXQgbm90YXRpb24gd29ya3MgYXMgZXhwZWN0ZWQgLS0gaXQgcmV0dXJuc1xuICogYSBzaW5nbGUgb2N0ZXQuXG4gKlxuICogQnkgYXVnbWVudGluZyB0aGUgaW5zdGFuY2VzLCB3ZSBjYW4gYXZvaWQgbW9kaWZ5aW5nIHRoZSBgVWludDhBcnJheWBcbiAqIHByb3RvdHlwZS5cbiAqL1xuZnVuY3Rpb24gQnVmZmVyIChzdWJqZWN0LCBlbmNvZGluZykge1xuICB2YXIgc2VsZiA9IHRoaXNcbiAgaWYgKCEoc2VsZiBpbnN0YW5jZW9mIEJ1ZmZlcikpIHJldHVybiBuZXcgQnVmZmVyKHN1YmplY3QsIGVuY29kaW5nKVxuXG4gIHZhciB0eXBlID0gdHlwZW9mIHN1YmplY3RcbiAgdmFyIGxlbmd0aFxuXG4gIGlmICh0eXBlID09PSAnbnVtYmVyJykge1xuICAgIGxlbmd0aCA9ICtzdWJqZWN0XG4gIH0gZWxzZSBpZiAodHlwZSA9PT0gJ3N0cmluZycpIHtcbiAgICBsZW5ndGggPSBCdWZmZXIuYnl0ZUxlbmd0aChzdWJqZWN0LCBlbmNvZGluZylcbiAgfSBlbHNlIGlmICh0eXBlID09PSAnb2JqZWN0JyAmJiBzdWJqZWN0ICE9PSBudWxsKSB7XG4gICAgLy8gYXNzdW1lIG9iamVjdCBpcyBhcnJheS1saWtlXG4gICAgaWYgKHN1YmplY3QudHlwZSA9PT0gJ0J1ZmZlcicgJiYgaXNBcnJheShzdWJqZWN0LmRhdGEpKSBzdWJqZWN0ID0gc3ViamVjdC5kYXRhXG4gICAgbGVuZ3RoID0gK3N1YmplY3QubGVuZ3RoXG4gIH0gZWxzZSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignbXVzdCBzdGFydCB3aXRoIG51bWJlciwgYnVmZmVyLCBhcnJheSBvciBzdHJpbmcnKVxuICB9XG5cbiAgaWYgKGxlbmd0aCA+IGtNYXhMZW5ndGgpIHtcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcignQXR0ZW1wdCB0byBhbGxvY2F0ZSBCdWZmZXIgbGFyZ2VyIHRoYW4gbWF4aW11bSBzaXplOiAweCcgK1xuICAgICAga01heExlbmd0aC50b1N0cmluZygxNikgKyAnIGJ5dGVzJylcbiAgfVxuXG4gIGlmIChsZW5ndGggPCAwKSBsZW5ndGggPSAwXG4gIGVsc2UgbGVuZ3RoID4+Pj0gMCAvLyBjb2VyY2UgdG8gdWludDMyXG5cbiAgaWYgKEJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUKSB7XG4gICAgLy8gUHJlZmVycmVkOiBSZXR1cm4gYW4gYXVnbWVudGVkIGBVaW50OEFycmF5YCBpbnN0YW5jZSBmb3IgYmVzdCBwZXJmb3JtYW5jZVxuICAgIHNlbGYgPSBCdWZmZXIuX2F1Z21lbnQobmV3IFVpbnQ4QXJyYXkobGVuZ3RoKSkgLy8gZXNsaW50LWRpc2FibGUtbGluZSBjb25zaXN0ZW50LXRoaXNcbiAgfSBlbHNlIHtcbiAgICAvLyBGYWxsYmFjazogUmV0dXJuIFRISVMgaW5zdGFuY2Ugb2YgQnVmZmVyIChjcmVhdGVkIGJ5IGBuZXdgKVxuICAgIHNlbGYubGVuZ3RoID0gbGVuZ3RoXG4gICAgc2VsZi5faXNCdWZmZXIgPSB0cnVlXG4gIH1cblxuICB2YXIgaVxuICBpZiAoQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQgJiYgdHlwZW9mIHN1YmplY3QuYnl0ZUxlbmd0aCA9PT0gJ251bWJlcicpIHtcbiAgICAvLyBTcGVlZCBvcHRpbWl6YXRpb24gLS0gdXNlIHNldCBpZiB3ZSdyZSBjb3B5aW5nIGZyb20gYSB0eXBlZCBhcnJheVxuICAgIHNlbGYuX3NldChzdWJqZWN0KVxuICB9IGVsc2UgaWYgKGlzQXJyYXlpc2goc3ViamVjdCkpIHtcbiAgICAvLyBUcmVhdCBhcnJheS1pc2ggb2JqZWN0cyBhcyBhIGJ5dGUgYXJyYXlcbiAgICBpZiAoQnVmZmVyLmlzQnVmZmVyKHN1YmplY3QpKSB7XG4gICAgICBmb3IgKGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgICAgc2VsZltpXSA9IHN1YmplY3QucmVhZFVJbnQ4KGkpXG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGZvciAoaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgICBzZWxmW2ldID0gKChzdWJqZWN0W2ldICUgMjU2KSArIDI1NikgJSAyNTZcbiAgICAgIH1cbiAgICB9XG4gIH0gZWxzZSBpZiAodHlwZSA9PT0gJ3N0cmluZycpIHtcbiAgICBzZWxmLndyaXRlKHN1YmplY3QsIDAsIGVuY29kaW5nKVxuICB9IGVsc2UgaWYgKHR5cGUgPT09ICdudW1iZXInICYmICFCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCkge1xuICAgIGZvciAoaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgc2VsZltpXSA9IDBcbiAgICB9XG4gIH1cblxuICBpZiAobGVuZ3RoID4gMCAmJiBsZW5ndGggPD0gQnVmZmVyLnBvb2xTaXplKSBzZWxmLnBhcmVudCA9IHJvb3RQYXJlbnRcblxuICByZXR1cm4gc2VsZlxufVxuXG5mdW5jdGlvbiBTbG93QnVmZmVyIChzdWJqZWN0LCBlbmNvZGluZykge1xuICBpZiAoISh0aGlzIGluc3RhbmNlb2YgU2xvd0J1ZmZlcikpIHJldHVybiBuZXcgU2xvd0J1ZmZlcihzdWJqZWN0LCBlbmNvZGluZylcblxuICB2YXIgYnVmID0gbmV3IEJ1ZmZlcihzdWJqZWN0LCBlbmNvZGluZylcbiAgZGVsZXRlIGJ1Zi5wYXJlbnRcbiAgcmV0dXJuIGJ1ZlxufVxuXG5CdWZmZXIuaXNCdWZmZXIgPSBmdW5jdGlvbiBpc0J1ZmZlciAoYikge1xuICByZXR1cm4gISEoYiAhPSBudWxsICYmIGIuX2lzQnVmZmVyKVxufVxuXG5CdWZmZXIuY29tcGFyZSA9IGZ1bmN0aW9uIGNvbXBhcmUgKGEsIGIpIHtcbiAgaWYgKCFCdWZmZXIuaXNCdWZmZXIoYSkgfHwgIUJ1ZmZlci5pc0J1ZmZlcihiKSkge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0FyZ3VtZW50cyBtdXN0IGJlIEJ1ZmZlcnMnKVxuICB9XG5cbiAgaWYgKGEgPT09IGIpIHJldHVybiAwXG5cbiAgdmFyIHggPSBhLmxlbmd0aFxuICB2YXIgeSA9IGIubGVuZ3RoXG4gIGZvciAodmFyIGkgPSAwLCBsZW4gPSBNYXRoLm1pbih4LCB5KTsgaSA8IGxlbiAmJiBhW2ldID09PSBiW2ldOyBpKyspIHt9XG4gIGlmIChpICE9PSBsZW4pIHtcbiAgICB4ID0gYVtpXVxuICAgIHkgPSBiW2ldXG4gIH1cbiAgaWYgKHggPCB5KSByZXR1cm4gLTFcbiAgaWYgKHkgPCB4KSByZXR1cm4gMVxuICByZXR1cm4gMFxufVxuXG5CdWZmZXIuaXNFbmNvZGluZyA9IGZ1bmN0aW9uIGlzRW5jb2RpbmcgKGVuY29kaW5nKSB7XG4gIHN3aXRjaCAoU3RyaW5nKGVuY29kaW5nKS50b0xvd2VyQ2FzZSgpKSB7XG4gICAgY2FzZSAnaGV4JzpcbiAgICBjYXNlICd1dGY4JzpcbiAgICBjYXNlICd1dGYtOCc6XG4gICAgY2FzZSAnYXNjaWknOlxuICAgIGNhc2UgJ2JpbmFyeSc6XG4gICAgY2FzZSAnYmFzZTY0JzpcbiAgICBjYXNlICdyYXcnOlxuICAgIGNhc2UgJ3VjczInOlxuICAgIGNhc2UgJ3Vjcy0yJzpcbiAgICBjYXNlICd1dGYxNmxlJzpcbiAgICBjYXNlICd1dGYtMTZsZSc6XG4gICAgICByZXR1cm4gdHJ1ZVxuICAgIGRlZmF1bHQ6XG4gICAgICByZXR1cm4gZmFsc2VcbiAgfVxufVxuXG5CdWZmZXIuY29uY2F0ID0gZnVuY3Rpb24gY29uY2F0IChsaXN0LCB0b3RhbExlbmd0aCkge1xuICBpZiAoIWlzQXJyYXkobGlzdCkpIHRocm93IG5ldyBUeXBlRXJyb3IoJ2xpc3QgYXJndW1lbnQgbXVzdCBiZSBhbiBBcnJheSBvZiBCdWZmZXJzLicpXG5cbiAgaWYgKGxpc3QubGVuZ3RoID09PSAwKSB7XG4gICAgcmV0dXJuIG5ldyBCdWZmZXIoMClcbiAgfSBlbHNlIGlmIChsaXN0Lmxlbmd0aCA9PT0gMSkge1xuICAgIHJldHVybiBsaXN0WzBdXG4gIH1cblxuICB2YXIgaVxuICBpZiAodG90YWxMZW5ndGggPT09IHVuZGVmaW5lZCkge1xuICAgIHRvdGFsTGVuZ3RoID0gMFxuICAgIGZvciAoaSA9IDA7IGkgPCBsaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgICB0b3RhbExlbmd0aCArPSBsaXN0W2ldLmxlbmd0aFxuICAgIH1cbiAgfVxuXG4gIHZhciBidWYgPSBuZXcgQnVmZmVyKHRvdGFsTGVuZ3RoKVxuICB2YXIgcG9zID0gMFxuICBmb3IgKGkgPSAwOyBpIDwgbGlzdC5sZW5ndGg7IGkrKykge1xuICAgIHZhciBpdGVtID0gbGlzdFtpXVxuICAgIGl0ZW0uY29weShidWYsIHBvcylcbiAgICBwb3MgKz0gaXRlbS5sZW5ndGhcbiAgfVxuICByZXR1cm4gYnVmXG59XG5cbkJ1ZmZlci5ieXRlTGVuZ3RoID0gZnVuY3Rpb24gYnl0ZUxlbmd0aCAoc3RyLCBlbmNvZGluZykge1xuICB2YXIgcmV0XG4gIHN0ciA9IHN0ciArICcnXG4gIHN3aXRjaCAoZW5jb2RpbmcgfHwgJ3V0ZjgnKSB7XG4gICAgY2FzZSAnYXNjaWknOlxuICAgIGNhc2UgJ2JpbmFyeSc6XG4gICAgY2FzZSAncmF3JzpcbiAgICAgIHJldCA9IHN0ci5sZW5ndGhcbiAgICAgIGJyZWFrXG4gICAgY2FzZSAndWNzMic6XG4gICAgY2FzZSAndWNzLTInOlxuICAgIGNhc2UgJ3V0ZjE2bGUnOlxuICAgIGNhc2UgJ3V0Zi0xNmxlJzpcbiAgICAgIHJldCA9IHN0ci5sZW5ndGggKiAyXG4gICAgICBicmVha1xuICAgIGNhc2UgJ2hleCc6XG4gICAgICByZXQgPSBzdHIubGVuZ3RoID4+PiAxXG4gICAgICBicmVha1xuICAgIGNhc2UgJ3V0ZjgnOlxuICAgIGNhc2UgJ3V0Zi04JzpcbiAgICAgIHJldCA9IHV0ZjhUb0J5dGVzKHN0cikubGVuZ3RoXG4gICAgICBicmVha1xuICAgIGNhc2UgJ2Jhc2U2NCc6XG4gICAgICByZXQgPSBiYXNlNjRUb0J5dGVzKHN0cikubGVuZ3RoXG4gICAgICBicmVha1xuICAgIGRlZmF1bHQ6XG4gICAgICByZXQgPSBzdHIubGVuZ3RoXG4gIH1cbiAgcmV0dXJuIHJldFxufVxuXG4vLyBwcmUtc2V0IGZvciB2YWx1ZXMgdGhhdCBtYXkgZXhpc3QgaW4gdGhlIGZ1dHVyZVxuQnVmZmVyLnByb3RvdHlwZS5sZW5ndGggPSB1bmRlZmluZWRcbkJ1ZmZlci5wcm90b3R5cGUucGFyZW50ID0gdW5kZWZpbmVkXG5cbi8vIHRvU3RyaW5nKGVuY29kaW5nLCBzdGFydD0wLCBlbmQ9YnVmZmVyLmxlbmd0aClcbkJ1ZmZlci5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbiB0b1N0cmluZyAoZW5jb2RpbmcsIHN0YXJ0LCBlbmQpIHtcbiAgdmFyIGxvd2VyZWRDYXNlID0gZmFsc2VcblxuICBzdGFydCA9IHN0YXJ0ID4+PiAwXG4gIGVuZCA9IGVuZCA9PT0gdW5kZWZpbmVkIHx8IGVuZCA9PT0gSW5maW5pdHkgPyB0aGlzLmxlbmd0aCA6IGVuZCA+Pj4gMFxuXG4gIGlmICghZW5jb2RpbmcpIGVuY29kaW5nID0gJ3V0ZjgnXG4gIGlmIChzdGFydCA8IDApIHN0YXJ0ID0gMFxuICBpZiAoZW5kID4gdGhpcy5sZW5ndGgpIGVuZCA9IHRoaXMubGVuZ3RoXG4gIGlmIChlbmQgPD0gc3RhcnQpIHJldHVybiAnJ1xuXG4gIHdoaWxlICh0cnVlKSB7XG4gICAgc3dpdGNoIChlbmNvZGluZykge1xuICAgICAgY2FzZSAnaGV4JzpcbiAgICAgICAgcmV0dXJuIGhleFNsaWNlKHRoaXMsIHN0YXJ0LCBlbmQpXG5cbiAgICAgIGNhc2UgJ3V0ZjgnOlxuICAgICAgY2FzZSAndXRmLTgnOlxuICAgICAgICByZXR1cm4gdXRmOFNsaWNlKHRoaXMsIHN0YXJ0LCBlbmQpXG5cbiAgICAgIGNhc2UgJ2FzY2lpJzpcbiAgICAgICAgcmV0dXJuIGFzY2lpU2xpY2UodGhpcywgc3RhcnQsIGVuZClcblxuICAgICAgY2FzZSAnYmluYXJ5JzpcbiAgICAgICAgcmV0dXJuIGJpbmFyeVNsaWNlKHRoaXMsIHN0YXJ0LCBlbmQpXG5cbiAgICAgIGNhc2UgJ2Jhc2U2NCc6XG4gICAgICAgIHJldHVybiBiYXNlNjRTbGljZSh0aGlzLCBzdGFydCwgZW5kKVxuXG4gICAgICBjYXNlICd1Y3MyJzpcbiAgICAgIGNhc2UgJ3Vjcy0yJzpcbiAgICAgIGNhc2UgJ3V0ZjE2bGUnOlxuICAgICAgY2FzZSAndXRmLTE2bGUnOlxuICAgICAgICByZXR1cm4gdXRmMTZsZVNsaWNlKHRoaXMsIHN0YXJ0LCBlbmQpXG5cbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIGlmIChsb3dlcmVkQ2FzZSkgdGhyb3cgbmV3IFR5cGVFcnJvcignVW5rbm93biBlbmNvZGluZzogJyArIGVuY29kaW5nKVxuICAgICAgICBlbmNvZGluZyA9IChlbmNvZGluZyArICcnKS50b0xvd2VyQ2FzZSgpXG4gICAgICAgIGxvd2VyZWRDYXNlID0gdHJ1ZVxuICAgIH1cbiAgfVxufVxuXG5CdWZmZXIucHJvdG90eXBlLmVxdWFscyA9IGZ1bmN0aW9uIGVxdWFscyAoYikge1xuICBpZiAoIUJ1ZmZlci5pc0J1ZmZlcihiKSkgdGhyb3cgbmV3IFR5cGVFcnJvcignQXJndW1lbnQgbXVzdCBiZSBhIEJ1ZmZlcicpXG4gIGlmICh0aGlzID09PSBiKSByZXR1cm4gdHJ1ZVxuICByZXR1cm4gQnVmZmVyLmNvbXBhcmUodGhpcywgYikgPT09IDBcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5pbnNwZWN0ID0gZnVuY3Rpb24gaW5zcGVjdCAoKSB7XG4gIHZhciBzdHIgPSAnJ1xuICB2YXIgbWF4ID0gZXhwb3J0cy5JTlNQRUNUX01BWF9CWVRFU1xuICBpZiAodGhpcy5sZW5ndGggPiAwKSB7XG4gICAgc3RyID0gdGhpcy50b1N0cmluZygnaGV4JywgMCwgbWF4KS5tYXRjaCgvLnsyfS9nKS5qb2luKCcgJylcbiAgICBpZiAodGhpcy5sZW5ndGggPiBtYXgpIHN0ciArPSAnIC4uLiAnXG4gIH1cbiAgcmV0dXJuICc8QnVmZmVyICcgKyBzdHIgKyAnPidcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5jb21wYXJlID0gZnVuY3Rpb24gY29tcGFyZSAoYikge1xuICBpZiAoIUJ1ZmZlci5pc0J1ZmZlcihiKSkgdGhyb3cgbmV3IFR5cGVFcnJvcignQXJndW1lbnQgbXVzdCBiZSBhIEJ1ZmZlcicpXG4gIGlmICh0aGlzID09PSBiKSByZXR1cm4gMFxuICByZXR1cm4gQnVmZmVyLmNvbXBhcmUodGhpcywgYilcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5pbmRleE9mID0gZnVuY3Rpb24gaW5kZXhPZiAodmFsLCBieXRlT2Zmc2V0KSB7XG4gIGlmIChieXRlT2Zmc2V0ID4gMHg3ZmZmZmZmZikgYnl0ZU9mZnNldCA9IDB4N2ZmZmZmZmZcbiAgZWxzZSBpZiAoYnl0ZU9mZnNldCA8IC0weDgwMDAwMDAwKSBieXRlT2Zmc2V0ID0gLTB4ODAwMDAwMDBcbiAgYnl0ZU9mZnNldCA+Pj0gMFxuXG4gIGlmICh0aGlzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIC0xXG4gIGlmIChieXRlT2Zmc2V0ID49IHRoaXMubGVuZ3RoKSByZXR1cm4gLTFcblxuICAvLyBOZWdhdGl2ZSBvZmZzZXRzIHN0YXJ0IGZyb20gdGhlIGVuZCBvZiB0aGUgYnVmZmVyXG4gIGlmIChieXRlT2Zmc2V0IDwgMCkgYnl0ZU9mZnNldCA9IE1hdGgubWF4KHRoaXMubGVuZ3RoICsgYnl0ZU9mZnNldCwgMClcblxuICBpZiAodHlwZW9mIHZhbCA9PT0gJ3N0cmluZycpIHtcbiAgICBpZiAodmFsLmxlbmd0aCA9PT0gMCkgcmV0dXJuIC0xIC8vIHNwZWNpYWwgY2FzZTogbG9va2luZyBmb3IgZW1wdHkgc3RyaW5nIGFsd2F5cyBmYWlsc1xuICAgIHJldHVybiBTdHJpbmcucHJvdG90eXBlLmluZGV4T2YuY2FsbCh0aGlzLCB2YWwsIGJ5dGVPZmZzZXQpXG4gIH1cbiAgaWYgKEJ1ZmZlci5pc0J1ZmZlcih2YWwpKSB7XG4gICAgcmV0dXJuIGFycmF5SW5kZXhPZih0aGlzLCB2YWwsIGJ5dGVPZmZzZXQpXG4gIH1cbiAgaWYgKHR5cGVvZiB2YWwgPT09ICdudW1iZXInKSB7XG4gICAgaWYgKEJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUICYmIFVpbnQ4QXJyYXkucHJvdG90eXBlLmluZGV4T2YgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHJldHVybiBVaW50OEFycmF5LnByb3RvdHlwZS5pbmRleE9mLmNhbGwodGhpcywgdmFsLCBieXRlT2Zmc2V0KVxuICAgIH1cbiAgICByZXR1cm4gYXJyYXlJbmRleE9mKHRoaXMsIFsgdmFsIF0sIGJ5dGVPZmZzZXQpXG4gIH1cblxuICBmdW5jdGlvbiBhcnJheUluZGV4T2YgKGFyciwgdmFsLCBieXRlT2Zmc2V0KSB7XG4gICAgdmFyIGZvdW5kSW5kZXggPSAtMVxuICAgIGZvciAodmFyIGkgPSAwOyBieXRlT2Zmc2V0ICsgaSA8IGFyci5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKGFycltieXRlT2Zmc2V0ICsgaV0gPT09IHZhbFtmb3VuZEluZGV4ID09PSAtMSA/IDAgOiBpIC0gZm91bmRJbmRleF0pIHtcbiAgICAgICAgaWYgKGZvdW5kSW5kZXggPT09IC0xKSBmb3VuZEluZGV4ID0gaVxuICAgICAgICBpZiAoaSAtIGZvdW5kSW5kZXggKyAxID09PSB2YWwubGVuZ3RoKSByZXR1cm4gYnl0ZU9mZnNldCArIGZvdW5kSW5kZXhcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGZvdW5kSW5kZXggPSAtMVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gLTFcbiAgfVxuXG4gIHRocm93IG5ldyBUeXBlRXJyb3IoJ3ZhbCBtdXN0IGJlIHN0cmluZywgbnVtYmVyIG9yIEJ1ZmZlcicpXG59XG5cbi8vIGBnZXRgIHdpbGwgYmUgcmVtb3ZlZCBpbiBOb2RlIDAuMTMrXG5CdWZmZXIucHJvdG90eXBlLmdldCA9IGZ1bmN0aW9uIGdldCAob2Zmc2V0KSB7XG4gIGNvbnNvbGUubG9nKCcuZ2V0KCkgaXMgZGVwcmVjYXRlZC4gQWNjZXNzIHVzaW5nIGFycmF5IGluZGV4ZXMgaW5zdGVhZC4nKVxuICByZXR1cm4gdGhpcy5yZWFkVUludDgob2Zmc2V0KVxufVxuXG4vLyBgc2V0YCB3aWxsIGJlIHJlbW92ZWQgaW4gTm9kZSAwLjEzK1xuQnVmZmVyLnByb3RvdHlwZS5zZXQgPSBmdW5jdGlvbiBzZXQgKHYsIG9mZnNldCkge1xuICBjb25zb2xlLmxvZygnLnNldCgpIGlzIGRlcHJlY2F0ZWQuIEFjY2VzcyB1c2luZyBhcnJheSBpbmRleGVzIGluc3RlYWQuJylcbiAgcmV0dXJuIHRoaXMud3JpdGVVSW50OCh2LCBvZmZzZXQpXG59XG5cbmZ1bmN0aW9uIGhleFdyaXRlIChidWYsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpIHtcbiAgb2Zmc2V0ID0gTnVtYmVyKG9mZnNldCkgfHwgMFxuICB2YXIgcmVtYWluaW5nID0gYnVmLmxlbmd0aCAtIG9mZnNldFxuICBpZiAoIWxlbmd0aCkge1xuICAgIGxlbmd0aCA9IHJlbWFpbmluZ1xuICB9IGVsc2Uge1xuICAgIGxlbmd0aCA9IE51bWJlcihsZW5ndGgpXG4gICAgaWYgKGxlbmd0aCA+IHJlbWFpbmluZykge1xuICAgICAgbGVuZ3RoID0gcmVtYWluaW5nXG4gICAgfVxuICB9XG5cbiAgLy8gbXVzdCBiZSBhbiBldmVuIG51bWJlciBvZiBkaWdpdHNcbiAgdmFyIHN0ckxlbiA9IHN0cmluZy5sZW5ndGhcbiAgaWYgKHN0ckxlbiAlIDIgIT09IDApIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBoZXggc3RyaW5nJylcblxuICBpZiAobGVuZ3RoID4gc3RyTGVuIC8gMikge1xuICAgIGxlbmd0aCA9IHN0ckxlbiAvIDJcbiAgfVxuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIHBhcnNlZCA9IHBhcnNlSW50KHN0cmluZy5zdWJzdHIoaSAqIDIsIDIpLCAxNilcbiAgICBpZiAoaXNOYU4ocGFyc2VkKSkgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIGhleCBzdHJpbmcnKVxuICAgIGJ1ZltvZmZzZXQgKyBpXSA9IHBhcnNlZFxuICB9XG4gIHJldHVybiBpXG59XG5cbmZ1bmN0aW9uIHV0ZjhXcml0ZSAoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIHZhciBjaGFyc1dyaXR0ZW4gPSBibGl0QnVmZmVyKHV0ZjhUb0J5dGVzKHN0cmluZywgYnVmLmxlbmd0aCAtIG9mZnNldCksIGJ1Ziwgb2Zmc2V0LCBsZW5ndGgpXG4gIHJldHVybiBjaGFyc1dyaXR0ZW5cbn1cblxuZnVuY3Rpb24gYXNjaWlXcml0ZSAoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIHZhciBjaGFyc1dyaXR0ZW4gPSBibGl0QnVmZmVyKGFzY2lpVG9CeXRlcyhzdHJpbmcpLCBidWYsIG9mZnNldCwgbGVuZ3RoKVxuICByZXR1cm4gY2hhcnNXcml0dGVuXG59XG5cbmZ1bmN0aW9uIGJpbmFyeVdyaXRlIChidWYsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpIHtcbiAgcmV0dXJuIGFzY2lpV3JpdGUoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxufVxuXG5mdW5jdGlvbiBiYXNlNjRXcml0ZSAoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIHZhciBjaGFyc1dyaXR0ZW4gPSBibGl0QnVmZmVyKGJhc2U2NFRvQnl0ZXMoc3RyaW5nKSwgYnVmLCBvZmZzZXQsIGxlbmd0aClcbiAgcmV0dXJuIGNoYXJzV3JpdHRlblxufVxuXG5mdW5jdGlvbiB1dGYxNmxlV3JpdGUgKGJ1Ziwgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCkge1xuICB2YXIgY2hhcnNXcml0dGVuID0gYmxpdEJ1ZmZlcih1dGYxNmxlVG9CeXRlcyhzdHJpbmcsIGJ1Zi5sZW5ndGggLSBvZmZzZXQpLCBidWYsIG9mZnNldCwgbGVuZ3RoKVxuICByZXR1cm4gY2hhcnNXcml0dGVuXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGUgPSBmdW5jdGlvbiB3cml0ZSAoc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCwgZW5jb2RpbmcpIHtcbiAgLy8gU3VwcG9ydCBib3RoIChzdHJpbmcsIG9mZnNldCwgbGVuZ3RoLCBlbmNvZGluZylcbiAgLy8gYW5kIHRoZSBsZWdhY3kgKHN0cmluZywgZW5jb2RpbmcsIG9mZnNldCwgbGVuZ3RoKVxuICBpZiAoaXNGaW5pdGUob2Zmc2V0KSkge1xuICAgIGlmICghaXNGaW5pdGUobGVuZ3RoKSkge1xuICAgICAgZW5jb2RpbmcgPSBsZW5ndGhcbiAgICAgIGxlbmd0aCA9IHVuZGVmaW5lZFxuICAgIH1cbiAgfSBlbHNlIHsgIC8vIGxlZ2FjeVxuICAgIHZhciBzd2FwID0gZW5jb2RpbmdcbiAgICBlbmNvZGluZyA9IG9mZnNldFxuICAgIG9mZnNldCA9IGxlbmd0aFxuICAgIGxlbmd0aCA9IHN3YXBcbiAgfVxuXG4gIG9mZnNldCA9IE51bWJlcihvZmZzZXQpIHx8IDBcblxuICBpZiAobGVuZ3RoIDwgMCB8fCBvZmZzZXQgPCAwIHx8IG9mZnNldCA+IHRoaXMubGVuZ3RoKSB7XG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ2F0dGVtcHQgdG8gd3JpdGUgb3V0c2lkZSBidWZmZXIgYm91bmRzJylcbiAgfVxuXG4gIHZhciByZW1haW5pbmcgPSB0aGlzLmxlbmd0aCAtIG9mZnNldFxuICBpZiAoIWxlbmd0aCkge1xuICAgIGxlbmd0aCA9IHJlbWFpbmluZ1xuICB9IGVsc2Uge1xuICAgIGxlbmd0aCA9IE51bWJlcihsZW5ndGgpXG4gICAgaWYgKGxlbmd0aCA+IHJlbWFpbmluZykge1xuICAgICAgbGVuZ3RoID0gcmVtYWluaW5nXG4gICAgfVxuICB9XG4gIGVuY29kaW5nID0gU3RyaW5nKGVuY29kaW5nIHx8ICd1dGY4JykudG9Mb3dlckNhc2UoKVxuXG4gIHZhciByZXRcbiAgc3dpdGNoIChlbmNvZGluZykge1xuICAgIGNhc2UgJ2hleCc6XG4gICAgICByZXQgPSBoZXhXcml0ZSh0aGlzLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxuICAgICAgYnJlYWtcbiAgICBjYXNlICd1dGY4JzpcbiAgICBjYXNlICd1dGYtOCc6XG4gICAgICByZXQgPSB1dGY4V3JpdGUodGhpcywgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aClcbiAgICAgIGJyZWFrXG4gICAgY2FzZSAnYXNjaWknOlxuICAgICAgcmV0ID0gYXNjaWlXcml0ZSh0aGlzLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxuICAgICAgYnJlYWtcbiAgICBjYXNlICdiaW5hcnknOlxuICAgICAgcmV0ID0gYmluYXJ5V3JpdGUodGhpcywgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aClcbiAgICAgIGJyZWFrXG4gICAgY2FzZSAnYmFzZTY0JzpcbiAgICAgIHJldCA9IGJhc2U2NFdyaXRlKHRoaXMsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpXG4gICAgICBicmVha1xuICAgIGNhc2UgJ3VjczInOlxuICAgIGNhc2UgJ3Vjcy0yJzpcbiAgICBjYXNlICd1dGYxNmxlJzpcbiAgICBjYXNlICd1dGYtMTZsZSc6XG4gICAgICByZXQgPSB1dGYxNmxlV3JpdGUodGhpcywgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aClcbiAgICAgIGJyZWFrXG4gICAgZGVmYXVsdDpcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1Vua25vd24gZW5jb2Rpbmc6ICcgKyBlbmNvZGluZylcbiAgfVxuICByZXR1cm4gcmV0XG59XG5cbkJ1ZmZlci5wcm90b3R5cGUudG9KU09OID0gZnVuY3Rpb24gdG9KU09OICgpIHtcbiAgcmV0dXJuIHtcbiAgICB0eXBlOiAnQnVmZmVyJyxcbiAgICBkYXRhOiBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbCh0aGlzLl9hcnIgfHwgdGhpcywgMClcbiAgfVxufVxuXG5mdW5jdGlvbiBiYXNlNjRTbGljZSAoYnVmLCBzdGFydCwgZW5kKSB7XG4gIGlmIChzdGFydCA9PT0gMCAmJiBlbmQgPT09IGJ1Zi5sZW5ndGgpIHtcbiAgICByZXR1cm4gYmFzZTY0LmZyb21CeXRlQXJyYXkoYnVmKVxuICB9IGVsc2Uge1xuICAgIHJldHVybiBiYXNlNjQuZnJvbUJ5dGVBcnJheShidWYuc2xpY2Uoc3RhcnQsIGVuZCkpXG4gIH1cbn1cblxuZnVuY3Rpb24gdXRmOFNsaWNlIChidWYsIHN0YXJ0LCBlbmQpIHtcbiAgdmFyIHJlcyA9ICcnXG4gIHZhciB0bXAgPSAnJ1xuICBlbmQgPSBNYXRoLm1pbihidWYubGVuZ3RoLCBlbmQpXG5cbiAgZm9yICh2YXIgaSA9IHN0YXJ0OyBpIDwgZW5kOyBpKyspIHtcbiAgICBpZiAoYnVmW2ldIDw9IDB4N0YpIHtcbiAgICAgIHJlcyArPSBkZWNvZGVVdGY4Q2hhcih0bXApICsgU3RyaW5nLmZyb21DaGFyQ29kZShidWZbaV0pXG4gICAgICB0bXAgPSAnJ1xuICAgIH0gZWxzZSB7XG4gICAgICB0bXAgKz0gJyUnICsgYnVmW2ldLnRvU3RyaW5nKDE2KVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiByZXMgKyBkZWNvZGVVdGY4Q2hhcih0bXApXG59XG5cbmZ1bmN0aW9uIGFzY2lpU2xpY2UgKGJ1Ziwgc3RhcnQsIGVuZCkge1xuICB2YXIgcmV0ID0gJydcbiAgZW5kID0gTWF0aC5taW4oYnVmLmxlbmd0aCwgZW5kKVxuXG4gIGZvciAodmFyIGkgPSBzdGFydDsgaSA8IGVuZDsgaSsrKSB7XG4gICAgcmV0ICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoYnVmW2ldICYgMHg3RilcbiAgfVxuICByZXR1cm4gcmV0XG59XG5cbmZ1bmN0aW9uIGJpbmFyeVNsaWNlIChidWYsIHN0YXJ0LCBlbmQpIHtcbiAgdmFyIHJldCA9ICcnXG4gIGVuZCA9IE1hdGgubWluKGJ1Zi5sZW5ndGgsIGVuZClcblxuICBmb3IgKHZhciBpID0gc3RhcnQ7IGkgPCBlbmQ7IGkrKykge1xuICAgIHJldCArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGJ1ZltpXSlcbiAgfVxuICByZXR1cm4gcmV0XG59XG5cbmZ1bmN0aW9uIGhleFNsaWNlIChidWYsIHN0YXJ0LCBlbmQpIHtcbiAgdmFyIGxlbiA9IGJ1Zi5sZW5ndGhcblxuICBpZiAoIXN0YXJ0IHx8IHN0YXJ0IDwgMCkgc3RhcnQgPSAwXG4gIGlmICghZW5kIHx8IGVuZCA8IDAgfHwgZW5kID4gbGVuKSBlbmQgPSBsZW5cblxuICB2YXIgb3V0ID0gJydcbiAgZm9yICh2YXIgaSA9IHN0YXJ0OyBpIDwgZW5kOyBpKyspIHtcbiAgICBvdXQgKz0gdG9IZXgoYnVmW2ldKVxuICB9XG4gIHJldHVybiBvdXRcbn1cblxuZnVuY3Rpb24gdXRmMTZsZVNsaWNlIChidWYsIHN0YXJ0LCBlbmQpIHtcbiAgdmFyIGJ5dGVzID0gYnVmLnNsaWNlKHN0YXJ0LCBlbmQpXG4gIHZhciByZXMgPSAnJ1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGJ5dGVzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgcmVzICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoYnl0ZXNbaV0gKyBieXRlc1tpICsgMV0gKiAyNTYpXG4gIH1cbiAgcmV0dXJuIHJlc1xufVxuXG5CdWZmZXIucHJvdG90eXBlLnNsaWNlID0gZnVuY3Rpb24gc2xpY2UgKHN0YXJ0LCBlbmQpIHtcbiAgdmFyIGxlbiA9IHRoaXMubGVuZ3RoXG4gIHN0YXJ0ID0gfn5zdGFydFxuICBlbmQgPSBlbmQgPT09IHVuZGVmaW5lZCA/IGxlbiA6IH5+ZW5kXG5cbiAgaWYgKHN0YXJ0IDwgMCkge1xuICAgIHN0YXJ0ICs9IGxlblxuICAgIGlmIChzdGFydCA8IDApIHN0YXJ0ID0gMFxuICB9IGVsc2UgaWYgKHN0YXJ0ID4gbGVuKSB7XG4gICAgc3RhcnQgPSBsZW5cbiAgfVxuXG4gIGlmIChlbmQgPCAwKSB7XG4gICAgZW5kICs9IGxlblxuICAgIGlmIChlbmQgPCAwKSBlbmQgPSAwXG4gIH0gZWxzZSBpZiAoZW5kID4gbGVuKSB7XG4gICAgZW5kID0gbGVuXG4gIH1cblxuICBpZiAoZW5kIDwgc3RhcnQpIGVuZCA9IHN0YXJ0XG5cbiAgdmFyIG5ld0J1ZlxuICBpZiAoQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQpIHtcbiAgICBuZXdCdWYgPSBCdWZmZXIuX2F1Z21lbnQodGhpcy5zdWJhcnJheShzdGFydCwgZW5kKSlcbiAgfSBlbHNlIHtcbiAgICB2YXIgc2xpY2VMZW4gPSBlbmQgLSBzdGFydFxuICAgIG5ld0J1ZiA9IG5ldyBCdWZmZXIoc2xpY2VMZW4sIHVuZGVmaW5lZClcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHNsaWNlTGVuOyBpKyspIHtcbiAgICAgIG5ld0J1ZltpXSA9IHRoaXNbaSArIHN0YXJ0XVxuICAgIH1cbiAgfVxuXG4gIGlmIChuZXdCdWYubGVuZ3RoKSBuZXdCdWYucGFyZW50ID0gdGhpcy5wYXJlbnQgfHwgdGhpc1xuXG4gIHJldHVybiBuZXdCdWZcbn1cblxuLypcbiAqIE5lZWQgdG8gbWFrZSBzdXJlIHRoYXQgYnVmZmVyIGlzbid0IHRyeWluZyB0byB3cml0ZSBvdXQgb2YgYm91bmRzLlxuICovXG5mdW5jdGlvbiBjaGVja09mZnNldCAob2Zmc2V0LCBleHQsIGxlbmd0aCkge1xuICBpZiAoKG9mZnNldCAlIDEpICE9PSAwIHx8IG9mZnNldCA8IDApIHRocm93IG5ldyBSYW5nZUVycm9yKCdvZmZzZXQgaXMgbm90IHVpbnQnKVxuICBpZiAob2Zmc2V0ICsgZXh0ID4gbGVuZ3RoKSB0aHJvdyBuZXcgUmFuZ2VFcnJvcignVHJ5aW5nIHRvIGFjY2VzcyBiZXlvbmQgYnVmZmVyIGxlbmd0aCcpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZFVJbnRMRSA9IGZ1bmN0aW9uIHJlYWRVSW50TEUgKG9mZnNldCwgYnl0ZUxlbmd0aCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGJ5dGVMZW5ndGggPSBieXRlTGVuZ3RoID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgYnl0ZUxlbmd0aCwgdGhpcy5sZW5ndGgpXG5cbiAgdmFyIHZhbCA9IHRoaXNbb2Zmc2V0XVxuICB2YXIgbXVsID0gMVxuICB2YXIgaSA9IDBcbiAgd2hpbGUgKCsraSA8IGJ5dGVMZW5ndGggJiYgKG11bCAqPSAweDEwMCkpIHtcbiAgICB2YWwgKz0gdGhpc1tvZmZzZXQgKyBpXSAqIG11bFxuICB9XG5cbiAgcmV0dXJuIHZhbFxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRVSW50QkUgPSBmdW5jdGlvbiByZWFkVUludEJFIChvZmZzZXQsIGJ5dGVMZW5ndGgsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBieXRlTGVuZ3RoID0gYnl0ZUxlbmd0aCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgY2hlY2tPZmZzZXQob2Zmc2V0LCBieXRlTGVuZ3RoLCB0aGlzLmxlbmd0aClcbiAgfVxuXG4gIHZhciB2YWwgPSB0aGlzW29mZnNldCArIC0tYnl0ZUxlbmd0aF1cbiAgdmFyIG11bCA9IDFcbiAgd2hpbGUgKGJ5dGVMZW5ndGggPiAwICYmIChtdWwgKj0gMHgxMDApKSB7XG4gICAgdmFsICs9IHRoaXNbb2Zmc2V0ICsgLS1ieXRlTGVuZ3RoXSAqIG11bFxuICB9XG5cbiAgcmV0dXJuIHZhbFxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRVSW50OCA9IGZ1bmN0aW9uIHJlYWRVSW50OCAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDEsIHRoaXMubGVuZ3RoKVxuICByZXR1cm4gdGhpc1tvZmZzZXRdXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZFVJbnQxNkxFID0gZnVuY3Rpb24gcmVhZFVJbnQxNkxFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgMiwgdGhpcy5sZW5ndGgpXG4gIHJldHVybiB0aGlzW29mZnNldF0gfCAodGhpc1tvZmZzZXQgKyAxXSA8PCA4KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRVSW50MTZCRSA9IGZ1bmN0aW9uIHJlYWRVSW50MTZCRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDIsIHRoaXMubGVuZ3RoKVxuICByZXR1cm4gKHRoaXNbb2Zmc2V0XSA8PCA4KSB8IHRoaXNbb2Zmc2V0ICsgMV1cbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkVUludDMyTEUgPSBmdW5jdGlvbiByZWFkVUludDMyTEUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCA0LCB0aGlzLmxlbmd0aClcblxuICByZXR1cm4gKCh0aGlzW29mZnNldF0pIHxcbiAgICAgICh0aGlzW29mZnNldCArIDFdIDw8IDgpIHxcbiAgICAgICh0aGlzW29mZnNldCArIDJdIDw8IDE2KSkgK1xuICAgICAgKHRoaXNbb2Zmc2V0ICsgM10gKiAweDEwMDAwMDApXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZFVJbnQzMkJFID0gZnVuY3Rpb24gcmVhZFVJbnQzMkJFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgNCwgdGhpcy5sZW5ndGgpXG5cbiAgcmV0dXJuICh0aGlzW29mZnNldF0gKiAweDEwMDAwMDApICtcbiAgICAoKHRoaXNbb2Zmc2V0ICsgMV0gPDwgMTYpIHxcbiAgICAodGhpc1tvZmZzZXQgKyAyXSA8PCA4KSB8XG4gICAgdGhpc1tvZmZzZXQgKyAzXSlcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkSW50TEUgPSBmdW5jdGlvbiByZWFkSW50TEUgKG9mZnNldCwgYnl0ZUxlbmd0aCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGJ5dGVMZW5ndGggPSBieXRlTGVuZ3RoID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgYnl0ZUxlbmd0aCwgdGhpcy5sZW5ndGgpXG5cbiAgdmFyIHZhbCA9IHRoaXNbb2Zmc2V0XVxuICB2YXIgbXVsID0gMVxuICB2YXIgaSA9IDBcbiAgd2hpbGUgKCsraSA8IGJ5dGVMZW5ndGggJiYgKG11bCAqPSAweDEwMCkpIHtcbiAgICB2YWwgKz0gdGhpc1tvZmZzZXQgKyBpXSAqIG11bFxuICB9XG4gIG11bCAqPSAweDgwXG5cbiAgaWYgKHZhbCA+PSBtdWwpIHZhbCAtPSBNYXRoLnBvdygyLCA4ICogYnl0ZUxlbmd0aClcblxuICByZXR1cm4gdmFsXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEludEJFID0gZnVuY3Rpb24gcmVhZEludEJFIChvZmZzZXQsIGJ5dGVMZW5ndGgsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBieXRlTGVuZ3RoID0gYnl0ZUxlbmd0aCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIGJ5dGVMZW5ndGgsIHRoaXMubGVuZ3RoKVxuXG4gIHZhciBpID0gYnl0ZUxlbmd0aFxuICB2YXIgbXVsID0gMVxuICB2YXIgdmFsID0gdGhpc1tvZmZzZXQgKyAtLWldXG4gIHdoaWxlIChpID4gMCAmJiAobXVsICo9IDB4MTAwKSkge1xuICAgIHZhbCArPSB0aGlzW29mZnNldCArIC0taV0gKiBtdWxcbiAgfVxuICBtdWwgKj0gMHg4MFxuXG4gIGlmICh2YWwgPj0gbXVsKSB2YWwgLT0gTWF0aC5wb3coMiwgOCAqIGJ5dGVMZW5ndGgpXG5cbiAgcmV0dXJuIHZhbFxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRJbnQ4ID0gZnVuY3Rpb24gcmVhZEludDggKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCAxLCB0aGlzLmxlbmd0aClcbiAgaWYgKCEodGhpc1tvZmZzZXRdICYgMHg4MCkpIHJldHVybiAodGhpc1tvZmZzZXRdKVxuICByZXR1cm4gKCgweGZmIC0gdGhpc1tvZmZzZXRdICsgMSkgKiAtMSlcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkSW50MTZMRSA9IGZ1bmN0aW9uIHJlYWRJbnQxNkxFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgMiwgdGhpcy5sZW5ndGgpXG4gIHZhciB2YWwgPSB0aGlzW29mZnNldF0gfCAodGhpc1tvZmZzZXQgKyAxXSA8PCA4KVxuICByZXR1cm4gKHZhbCAmIDB4ODAwMCkgPyB2YWwgfCAweEZGRkYwMDAwIDogdmFsXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEludDE2QkUgPSBmdW5jdGlvbiByZWFkSW50MTZCRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDIsIHRoaXMubGVuZ3RoKVxuICB2YXIgdmFsID0gdGhpc1tvZmZzZXQgKyAxXSB8ICh0aGlzW29mZnNldF0gPDwgOClcbiAgcmV0dXJuICh2YWwgJiAweDgwMDApID8gdmFsIHwgMHhGRkZGMDAwMCA6IHZhbFxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRJbnQzMkxFID0gZnVuY3Rpb24gcmVhZEludDMyTEUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCA0LCB0aGlzLmxlbmd0aClcblxuICByZXR1cm4gKHRoaXNbb2Zmc2V0XSkgfFxuICAgICh0aGlzW29mZnNldCArIDFdIDw8IDgpIHxcbiAgICAodGhpc1tvZmZzZXQgKyAyXSA8PCAxNikgfFxuICAgICh0aGlzW29mZnNldCArIDNdIDw8IDI0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRJbnQzMkJFID0gZnVuY3Rpb24gcmVhZEludDMyQkUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCA0LCB0aGlzLmxlbmd0aClcblxuICByZXR1cm4gKHRoaXNbb2Zmc2V0XSA8PCAyNCkgfFxuICAgICh0aGlzW29mZnNldCArIDFdIDw8IDE2KSB8XG4gICAgKHRoaXNbb2Zmc2V0ICsgMl0gPDwgOCkgfFxuICAgICh0aGlzW29mZnNldCArIDNdKVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRGbG9hdExFID0gZnVuY3Rpb24gcmVhZEZsb2F0TEUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCA0LCB0aGlzLmxlbmd0aClcbiAgcmV0dXJuIGllZWU3NTQucmVhZCh0aGlzLCBvZmZzZXQsIHRydWUsIDIzLCA0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRGbG9hdEJFID0gZnVuY3Rpb24gcmVhZEZsb2F0QkUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCA0LCB0aGlzLmxlbmd0aClcbiAgcmV0dXJuIGllZWU3NTQucmVhZCh0aGlzLCBvZmZzZXQsIGZhbHNlLCAyMywgNClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkRG91YmxlTEUgPSBmdW5jdGlvbiByZWFkRG91YmxlTEUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCA4LCB0aGlzLmxlbmd0aClcbiAgcmV0dXJuIGllZWU3NTQucmVhZCh0aGlzLCBvZmZzZXQsIHRydWUsIDUyLCA4KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWREb3VibGVCRSA9IGZ1bmN0aW9uIHJlYWREb3VibGVCRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDgsIHRoaXMubGVuZ3RoKVxuICByZXR1cm4gaWVlZTc1NC5yZWFkKHRoaXMsIG9mZnNldCwgZmFsc2UsIDUyLCA4KVxufVxuXG5mdW5jdGlvbiBjaGVja0ludCAoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBleHQsIG1heCwgbWluKSB7XG4gIGlmICghQnVmZmVyLmlzQnVmZmVyKGJ1ZikpIHRocm93IG5ldyBUeXBlRXJyb3IoJ2J1ZmZlciBtdXN0IGJlIGEgQnVmZmVyIGluc3RhbmNlJylcbiAgaWYgKHZhbHVlID4gbWF4IHx8IHZhbHVlIDwgbWluKSB0aHJvdyBuZXcgUmFuZ2VFcnJvcigndmFsdWUgaXMgb3V0IG9mIGJvdW5kcycpXG4gIGlmIChvZmZzZXQgKyBleHQgPiBidWYubGVuZ3RoKSB0aHJvdyBuZXcgUmFuZ2VFcnJvcignaW5kZXggb3V0IG9mIHJhbmdlJylcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZVVJbnRMRSA9IGZ1bmN0aW9uIHdyaXRlVUludExFICh2YWx1ZSwgb2Zmc2V0LCBieXRlTGVuZ3RoLCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgYnl0ZUxlbmd0aCA9IGJ5dGVMZW5ndGggPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgYnl0ZUxlbmd0aCwgTWF0aC5wb3coMiwgOCAqIGJ5dGVMZW5ndGgpLCAwKVxuXG4gIHZhciBtdWwgPSAxXG4gIHZhciBpID0gMFxuICB0aGlzW29mZnNldF0gPSB2YWx1ZSAmIDB4RkZcbiAgd2hpbGUgKCsraSA8IGJ5dGVMZW5ndGggJiYgKG11bCAqPSAweDEwMCkpIHtcbiAgICB0aGlzW29mZnNldCArIGldID0gKHZhbHVlIC8gbXVsKSA+Pj4gMCAmIDB4RkZcbiAgfVxuXG4gIHJldHVybiBvZmZzZXQgKyBieXRlTGVuZ3RoXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVVSW50QkUgPSBmdW5jdGlvbiB3cml0ZVVJbnRCRSAodmFsdWUsIG9mZnNldCwgYnl0ZUxlbmd0aCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGJ5dGVMZW5ndGggPSBieXRlTGVuZ3RoID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIGJ5dGVMZW5ndGgsIE1hdGgucG93KDIsIDggKiBieXRlTGVuZ3RoKSwgMClcblxuICB2YXIgaSA9IGJ5dGVMZW5ndGggLSAxXG4gIHZhciBtdWwgPSAxXG4gIHRoaXNbb2Zmc2V0ICsgaV0gPSB2YWx1ZSAmIDB4RkZcbiAgd2hpbGUgKC0taSA+PSAwICYmIChtdWwgKj0gMHgxMDApKSB7XG4gICAgdGhpc1tvZmZzZXQgKyBpXSA9ICh2YWx1ZSAvIG11bCkgPj4+IDAgJiAweEZGXG4gIH1cblxuICByZXR1cm4gb2Zmc2V0ICsgYnl0ZUxlbmd0aFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlVUludDggPSBmdW5jdGlvbiB3cml0ZVVJbnQ4ICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgMSwgMHhmZiwgMClcbiAgaWYgKCFCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCkgdmFsdWUgPSBNYXRoLmZsb29yKHZhbHVlKVxuICB0aGlzW29mZnNldF0gPSB2YWx1ZVxuICByZXR1cm4gb2Zmc2V0ICsgMVxufVxuXG5mdW5jdGlvbiBvYmplY3RXcml0ZVVJbnQxNiAoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4pIHtcbiAgaWYgKHZhbHVlIDwgMCkgdmFsdWUgPSAweGZmZmYgKyB2YWx1ZSArIDFcbiAgZm9yICh2YXIgaSA9IDAsIGogPSBNYXRoLm1pbihidWYubGVuZ3RoIC0gb2Zmc2V0LCAyKTsgaSA8IGo7IGkrKykge1xuICAgIGJ1ZltvZmZzZXQgKyBpXSA9ICh2YWx1ZSAmICgweGZmIDw8ICg4ICogKGxpdHRsZUVuZGlhbiA/IGkgOiAxIC0gaSkpKSkgPj4+XG4gICAgICAobGl0dGxlRW5kaWFuID8gaSA6IDEgLSBpKSAqIDhcbiAgfVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlVUludDE2TEUgPSBmdW5jdGlvbiB3cml0ZVVJbnQxNkxFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgMiwgMHhmZmZmLCAwKVxuICBpZiAoQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQpIHtcbiAgICB0aGlzW29mZnNldF0gPSB2YWx1ZVxuICAgIHRoaXNbb2Zmc2V0ICsgMV0gPSAodmFsdWUgPj4+IDgpXG4gIH0gZWxzZSB7XG4gICAgb2JqZWN0V3JpdGVVSW50MTYodGhpcywgdmFsdWUsIG9mZnNldCwgdHJ1ZSlcbiAgfVxuICByZXR1cm4gb2Zmc2V0ICsgMlxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlVUludDE2QkUgPSBmdW5jdGlvbiB3cml0ZVVJbnQxNkJFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgMiwgMHhmZmZmLCAwKVxuICBpZiAoQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQpIHtcbiAgICB0aGlzW29mZnNldF0gPSAodmFsdWUgPj4+IDgpXG4gICAgdGhpc1tvZmZzZXQgKyAxXSA9IHZhbHVlXG4gIH0gZWxzZSB7XG4gICAgb2JqZWN0V3JpdGVVSW50MTYodGhpcywgdmFsdWUsIG9mZnNldCwgZmFsc2UpXG4gIH1cbiAgcmV0dXJuIG9mZnNldCArIDJcbn1cblxuZnVuY3Rpb24gb2JqZWN0V3JpdGVVSW50MzIgKGJ1ZiwgdmFsdWUsIG9mZnNldCwgbGl0dGxlRW5kaWFuKSB7XG4gIGlmICh2YWx1ZSA8IDApIHZhbHVlID0gMHhmZmZmZmZmZiArIHZhbHVlICsgMVxuICBmb3IgKHZhciBpID0gMCwgaiA9IE1hdGgubWluKGJ1Zi5sZW5ndGggLSBvZmZzZXQsIDQpOyBpIDwgajsgaSsrKSB7XG4gICAgYnVmW29mZnNldCArIGldID0gKHZhbHVlID4+PiAobGl0dGxlRW5kaWFuID8gaSA6IDMgLSBpKSAqIDgpICYgMHhmZlxuICB9XG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVVSW50MzJMRSA9IGZ1bmN0aW9uIHdyaXRlVUludDMyTEUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCA0LCAweGZmZmZmZmZmLCAwKVxuICBpZiAoQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQpIHtcbiAgICB0aGlzW29mZnNldCArIDNdID0gKHZhbHVlID4+PiAyNClcbiAgICB0aGlzW29mZnNldCArIDJdID0gKHZhbHVlID4+PiAxNilcbiAgICB0aGlzW29mZnNldCArIDFdID0gKHZhbHVlID4+PiA4KVxuICAgIHRoaXNbb2Zmc2V0XSA9IHZhbHVlXG4gIH0gZWxzZSB7XG4gICAgb2JqZWN0V3JpdGVVSW50MzIodGhpcywgdmFsdWUsIG9mZnNldCwgdHJ1ZSlcbiAgfVxuICByZXR1cm4gb2Zmc2V0ICsgNFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlVUludDMyQkUgPSBmdW5jdGlvbiB3cml0ZVVJbnQzMkJFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgNCwgMHhmZmZmZmZmZiwgMClcbiAgaWYgKEJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUKSB7XG4gICAgdGhpc1tvZmZzZXRdID0gKHZhbHVlID4+PiAyNClcbiAgICB0aGlzW29mZnNldCArIDFdID0gKHZhbHVlID4+PiAxNilcbiAgICB0aGlzW29mZnNldCArIDJdID0gKHZhbHVlID4+PiA4KVxuICAgIHRoaXNbb2Zmc2V0ICsgM10gPSB2YWx1ZVxuICB9IGVsc2Uge1xuICAgIG9iamVjdFdyaXRlVUludDMyKHRoaXMsIHZhbHVlLCBvZmZzZXQsIGZhbHNlKVxuICB9XG4gIHJldHVybiBvZmZzZXQgKyA0XG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVJbnRMRSA9IGZ1bmN0aW9uIHdyaXRlSW50TEUgKHZhbHVlLCBvZmZzZXQsIGJ5dGVMZW5ndGgsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgY2hlY2tJbnQoXG4gICAgICB0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBieXRlTGVuZ3RoLFxuICAgICAgTWF0aC5wb3coMiwgOCAqIGJ5dGVMZW5ndGggLSAxKSAtIDEsXG4gICAgICAtTWF0aC5wb3coMiwgOCAqIGJ5dGVMZW5ndGggLSAxKVxuICAgIClcbiAgfVxuXG4gIHZhciBpID0gMFxuICB2YXIgbXVsID0gMVxuICB2YXIgc3ViID0gdmFsdWUgPCAwID8gMSA6IDBcbiAgdGhpc1tvZmZzZXRdID0gdmFsdWUgJiAweEZGXG4gIHdoaWxlICgrK2kgPCBieXRlTGVuZ3RoICYmIChtdWwgKj0gMHgxMDApKSB7XG4gICAgdGhpc1tvZmZzZXQgKyBpXSA9ICgodmFsdWUgLyBtdWwpID4+IDApIC0gc3ViICYgMHhGRlxuICB9XG5cbiAgcmV0dXJuIG9mZnNldCArIGJ5dGVMZW5ndGhcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUludEJFID0gZnVuY3Rpb24gd3JpdGVJbnRCRSAodmFsdWUsIG9mZnNldCwgYnl0ZUxlbmd0aCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICBjaGVja0ludChcbiAgICAgIHRoaXMsIHZhbHVlLCBvZmZzZXQsIGJ5dGVMZW5ndGgsXG4gICAgICBNYXRoLnBvdygyLCA4ICogYnl0ZUxlbmd0aCAtIDEpIC0gMSxcbiAgICAgIC1NYXRoLnBvdygyLCA4ICogYnl0ZUxlbmd0aCAtIDEpXG4gICAgKVxuICB9XG5cbiAgdmFyIGkgPSBieXRlTGVuZ3RoIC0gMVxuICB2YXIgbXVsID0gMVxuICB2YXIgc3ViID0gdmFsdWUgPCAwID8gMSA6IDBcbiAgdGhpc1tvZmZzZXQgKyBpXSA9IHZhbHVlICYgMHhGRlxuICB3aGlsZSAoLS1pID49IDAgJiYgKG11bCAqPSAweDEwMCkpIHtcbiAgICB0aGlzW29mZnNldCArIGldID0gKCh2YWx1ZSAvIG11bCkgPj4gMCkgLSBzdWIgJiAweEZGXG4gIH1cblxuICByZXR1cm4gb2Zmc2V0ICsgYnl0ZUxlbmd0aFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlSW50OCA9IGZ1bmN0aW9uIHdyaXRlSW50OCAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDEsIDB4N2YsIC0weDgwKVxuICBpZiAoIUJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUKSB2YWx1ZSA9IE1hdGguZmxvb3IodmFsdWUpXG4gIGlmICh2YWx1ZSA8IDApIHZhbHVlID0gMHhmZiArIHZhbHVlICsgMVxuICB0aGlzW29mZnNldF0gPSB2YWx1ZVxuICByZXR1cm4gb2Zmc2V0ICsgMVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlSW50MTZMRSA9IGZ1bmN0aW9uIHdyaXRlSW50MTZMRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDIsIDB4N2ZmZiwgLTB4ODAwMClcbiAgaWYgKEJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUKSB7XG4gICAgdGhpc1tvZmZzZXRdID0gdmFsdWVcbiAgICB0aGlzW29mZnNldCArIDFdID0gKHZhbHVlID4+PiA4KVxuICB9IGVsc2Uge1xuICAgIG9iamVjdFdyaXRlVUludDE2KHRoaXMsIHZhbHVlLCBvZmZzZXQsIHRydWUpXG4gIH1cbiAgcmV0dXJuIG9mZnNldCArIDJcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUludDE2QkUgPSBmdW5jdGlvbiB3cml0ZUludDE2QkUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCAyLCAweDdmZmYsIC0weDgwMDApXG4gIGlmIChCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCkge1xuICAgIHRoaXNbb2Zmc2V0XSA9ICh2YWx1ZSA+Pj4gOClcbiAgICB0aGlzW29mZnNldCArIDFdID0gdmFsdWVcbiAgfSBlbHNlIHtcbiAgICBvYmplY3RXcml0ZVVJbnQxNih0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBmYWxzZSlcbiAgfVxuICByZXR1cm4gb2Zmc2V0ICsgMlxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlSW50MzJMRSA9IGZ1bmN0aW9uIHdyaXRlSW50MzJMRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDQsIDB4N2ZmZmZmZmYsIC0weDgwMDAwMDAwKVxuICBpZiAoQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQpIHtcbiAgICB0aGlzW29mZnNldF0gPSB2YWx1ZVxuICAgIHRoaXNbb2Zmc2V0ICsgMV0gPSAodmFsdWUgPj4+IDgpXG4gICAgdGhpc1tvZmZzZXQgKyAyXSA9ICh2YWx1ZSA+Pj4gMTYpXG4gICAgdGhpc1tvZmZzZXQgKyAzXSA9ICh2YWx1ZSA+Pj4gMjQpXG4gIH0gZWxzZSB7XG4gICAgb2JqZWN0V3JpdGVVSW50MzIodGhpcywgdmFsdWUsIG9mZnNldCwgdHJ1ZSlcbiAgfVxuICByZXR1cm4gb2Zmc2V0ICsgNFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlSW50MzJCRSA9IGZ1bmN0aW9uIHdyaXRlSW50MzJCRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDQsIDB4N2ZmZmZmZmYsIC0weDgwMDAwMDAwKVxuICBpZiAodmFsdWUgPCAwKSB2YWx1ZSA9IDB4ZmZmZmZmZmYgKyB2YWx1ZSArIDFcbiAgaWYgKEJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUKSB7XG4gICAgdGhpc1tvZmZzZXRdID0gKHZhbHVlID4+PiAyNClcbiAgICB0aGlzW29mZnNldCArIDFdID0gKHZhbHVlID4+PiAxNilcbiAgICB0aGlzW29mZnNldCArIDJdID0gKHZhbHVlID4+PiA4KVxuICAgIHRoaXNbb2Zmc2V0ICsgM10gPSB2YWx1ZVxuICB9IGVsc2Uge1xuICAgIG9iamVjdFdyaXRlVUludDMyKHRoaXMsIHZhbHVlLCBvZmZzZXQsIGZhbHNlKVxuICB9XG4gIHJldHVybiBvZmZzZXQgKyA0XG59XG5cbmZ1bmN0aW9uIGNoZWNrSUVFRTc1NCAoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBleHQsIG1heCwgbWluKSB7XG4gIGlmICh2YWx1ZSA+IG1heCB8fCB2YWx1ZSA8IG1pbikgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ3ZhbHVlIGlzIG91dCBvZiBib3VuZHMnKVxuICBpZiAob2Zmc2V0ICsgZXh0ID4gYnVmLmxlbmd0aCkgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ2luZGV4IG91dCBvZiByYW5nZScpXG4gIGlmIChvZmZzZXQgPCAwKSB0aHJvdyBuZXcgUmFuZ2VFcnJvcignaW5kZXggb3V0IG9mIHJhbmdlJylcbn1cblxuZnVuY3Rpb24gd3JpdGVGbG9hdCAoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICBjaGVja0lFRUU3NTQoYnVmLCB2YWx1ZSwgb2Zmc2V0LCA0LCAzLjQwMjgyMzQ2NjM4NTI4ODZlKzM4LCAtMy40MDI4MjM0NjYzODUyODg2ZSszOClcbiAgfVxuICBpZWVlNzU0LndyaXRlKGJ1ZiwgdmFsdWUsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCAyMywgNClcbiAgcmV0dXJuIG9mZnNldCArIDRcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUZsb2F0TEUgPSBmdW5jdGlvbiB3cml0ZUZsb2F0TEUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHJldHVybiB3cml0ZUZsb2F0KHRoaXMsIHZhbHVlLCBvZmZzZXQsIHRydWUsIG5vQXNzZXJ0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlRmxvYXRCRSA9IGZ1bmN0aW9uIHdyaXRlRmxvYXRCRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgcmV0dXJuIHdyaXRlRmxvYXQodGhpcywgdmFsdWUsIG9mZnNldCwgZmFsc2UsIG5vQXNzZXJ0KVxufVxuXG5mdW5jdGlvbiB3cml0ZURvdWJsZSAoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICBjaGVja0lFRUU3NTQoYnVmLCB2YWx1ZSwgb2Zmc2V0LCA4LCAxLjc5NzY5MzEzNDg2MjMxNTdFKzMwOCwgLTEuNzk3NjkzMTM0ODYyMzE1N0UrMzA4KVxuICB9XG4gIGllZWU3NTQud3JpdGUoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIDUyLCA4KVxuICByZXR1cm4gb2Zmc2V0ICsgOFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlRG91YmxlTEUgPSBmdW5jdGlvbiB3cml0ZURvdWJsZUxFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICByZXR1cm4gd3JpdGVEb3VibGUodGhpcywgdmFsdWUsIG9mZnNldCwgdHJ1ZSwgbm9Bc3NlcnQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVEb3VibGVCRSA9IGZ1bmN0aW9uIHdyaXRlRG91YmxlQkUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHJldHVybiB3cml0ZURvdWJsZSh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBmYWxzZSwgbm9Bc3NlcnQpXG59XG5cbi8vIGNvcHkodGFyZ2V0QnVmZmVyLCB0YXJnZXRTdGFydD0wLCBzb3VyY2VTdGFydD0wLCBzb3VyY2VFbmQ9YnVmZmVyLmxlbmd0aClcbkJ1ZmZlci5wcm90b3R5cGUuY29weSA9IGZ1bmN0aW9uIGNvcHkgKHRhcmdldCwgdGFyZ2V0X3N0YXJ0LCBzdGFydCwgZW5kKSB7XG4gIGlmICghc3RhcnQpIHN0YXJ0ID0gMFxuICBpZiAoIWVuZCAmJiBlbmQgIT09IDApIGVuZCA9IHRoaXMubGVuZ3RoXG4gIGlmICh0YXJnZXRfc3RhcnQgPj0gdGFyZ2V0Lmxlbmd0aCkgdGFyZ2V0X3N0YXJ0ID0gdGFyZ2V0Lmxlbmd0aFxuICBpZiAoIXRhcmdldF9zdGFydCkgdGFyZ2V0X3N0YXJ0ID0gMFxuICBpZiAoZW5kID4gMCAmJiBlbmQgPCBzdGFydCkgZW5kID0gc3RhcnRcblxuICAvLyBDb3B5IDAgYnl0ZXM7IHdlJ3JlIGRvbmVcbiAgaWYgKGVuZCA9PT0gc3RhcnQpIHJldHVybiAwXG4gIGlmICh0YXJnZXQubGVuZ3RoID09PSAwIHx8IHRoaXMubGVuZ3RoID09PSAwKSByZXR1cm4gMFxuXG4gIC8vIEZhdGFsIGVycm9yIGNvbmRpdGlvbnNcbiAgaWYgKHRhcmdldF9zdGFydCA8IDApIHtcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcigndGFyZ2V0U3RhcnQgb3V0IG9mIGJvdW5kcycpXG4gIH1cbiAgaWYgKHN0YXJ0IDwgMCB8fCBzdGFydCA+PSB0aGlzLmxlbmd0aCkgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ3NvdXJjZVN0YXJ0IG91dCBvZiBib3VuZHMnKVxuICBpZiAoZW5kIDwgMCkgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ3NvdXJjZUVuZCBvdXQgb2YgYm91bmRzJylcblxuICAvLyBBcmUgd2Ugb29iP1xuICBpZiAoZW5kID4gdGhpcy5sZW5ndGgpIGVuZCA9IHRoaXMubGVuZ3RoXG4gIGlmICh0YXJnZXQubGVuZ3RoIC0gdGFyZ2V0X3N0YXJ0IDwgZW5kIC0gc3RhcnQpIHtcbiAgICBlbmQgPSB0YXJnZXQubGVuZ3RoIC0gdGFyZ2V0X3N0YXJ0ICsgc3RhcnRcbiAgfVxuXG4gIHZhciBsZW4gPSBlbmQgLSBzdGFydFxuXG4gIGlmIChsZW4gPCAxMDAwIHx8ICFCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCkge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgIHRhcmdldFtpICsgdGFyZ2V0X3N0YXJ0XSA9IHRoaXNbaSArIHN0YXJ0XVxuICAgIH1cbiAgfSBlbHNlIHtcbiAgICB0YXJnZXQuX3NldCh0aGlzLnN1YmFycmF5KHN0YXJ0LCBzdGFydCArIGxlbiksIHRhcmdldF9zdGFydClcbiAgfVxuXG4gIHJldHVybiBsZW5cbn1cblxuLy8gZmlsbCh2YWx1ZSwgc3RhcnQ9MCwgZW5kPWJ1ZmZlci5sZW5ndGgpXG5CdWZmZXIucHJvdG90eXBlLmZpbGwgPSBmdW5jdGlvbiBmaWxsICh2YWx1ZSwgc3RhcnQsIGVuZCkge1xuICBpZiAoIXZhbHVlKSB2YWx1ZSA9IDBcbiAgaWYgKCFzdGFydCkgc3RhcnQgPSAwXG4gIGlmICghZW5kKSBlbmQgPSB0aGlzLmxlbmd0aFxuXG4gIGlmIChlbmQgPCBzdGFydCkgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ2VuZCA8IHN0YXJ0JylcblxuICAvLyBGaWxsIDAgYnl0ZXM7IHdlJ3JlIGRvbmVcbiAgaWYgKGVuZCA9PT0gc3RhcnQpIHJldHVyblxuICBpZiAodGhpcy5sZW5ndGggPT09IDApIHJldHVyblxuXG4gIGlmIChzdGFydCA8IDAgfHwgc3RhcnQgPj0gdGhpcy5sZW5ndGgpIHRocm93IG5ldyBSYW5nZUVycm9yKCdzdGFydCBvdXQgb2YgYm91bmRzJylcbiAgaWYgKGVuZCA8IDAgfHwgZW5kID4gdGhpcy5sZW5ndGgpIHRocm93IG5ldyBSYW5nZUVycm9yKCdlbmQgb3V0IG9mIGJvdW5kcycpXG5cbiAgdmFyIGlcbiAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ251bWJlcicpIHtcbiAgICBmb3IgKGkgPSBzdGFydDsgaSA8IGVuZDsgaSsrKSB7XG4gICAgICB0aGlzW2ldID0gdmFsdWVcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgdmFyIGJ5dGVzID0gdXRmOFRvQnl0ZXModmFsdWUudG9TdHJpbmcoKSlcbiAgICB2YXIgbGVuID0gYnl0ZXMubGVuZ3RoXG4gICAgZm9yIChpID0gc3RhcnQ7IGkgPCBlbmQ7IGkrKykge1xuICAgICAgdGhpc1tpXSA9IGJ5dGVzW2kgJSBsZW5dXG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHRoaXNcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGEgbmV3IGBBcnJheUJ1ZmZlcmAgd2l0aCB0aGUgKmNvcGllZCogbWVtb3J5IG9mIHRoZSBidWZmZXIgaW5zdGFuY2UuXG4gKiBBZGRlZCBpbiBOb2RlIDAuMTIuIE9ubHkgYXZhaWxhYmxlIGluIGJyb3dzZXJzIHRoYXQgc3VwcG9ydCBBcnJheUJ1ZmZlci5cbiAqL1xuQnVmZmVyLnByb3RvdHlwZS50b0FycmF5QnVmZmVyID0gZnVuY3Rpb24gdG9BcnJheUJ1ZmZlciAoKSB7XG4gIGlmICh0eXBlb2YgVWludDhBcnJheSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICBpZiAoQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQpIHtcbiAgICAgIHJldHVybiAobmV3IEJ1ZmZlcih0aGlzKSkuYnVmZmVyXG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciBidWYgPSBuZXcgVWludDhBcnJheSh0aGlzLmxlbmd0aClcbiAgICAgIGZvciAodmFyIGkgPSAwLCBsZW4gPSBidWYubGVuZ3RoOyBpIDwgbGVuOyBpICs9IDEpIHtcbiAgICAgICAgYnVmW2ldID0gdGhpc1tpXVxuICAgICAgfVxuICAgICAgcmV0dXJuIGJ1Zi5idWZmZXJcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignQnVmZmVyLnRvQXJyYXlCdWZmZXIgbm90IHN1cHBvcnRlZCBpbiB0aGlzIGJyb3dzZXInKVxuICB9XG59XG5cbi8vIEhFTFBFUiBGVU5DVElPTlNcbi8vID09PT09PT09PT09PT09PT1cblxudmFyIEJQID0gQnVmZmVyLnByb3RvdHlwZVxuXG4vKipcbiAqIEF1Z21lbnQgYSBVaW50OEFycmF5ICppbnN0YW5jZSogKG5vdCB0aGUgVWludDhBcnJheSBjbGFzcyEpIHdpdGggQnVmZmVyIG1ldGhvZHNcbiAqL1xuQnVmZmVyLl9hdWdtZW50ID0gZnVuY3Rpb24gX2F1Z21lbnQgKGFycikge1xuICBhcnIuY29uc3RydWN0b3IgPSBCdWZmZXJcbiAgYXJyLl9pc0J1ZmZlciA9IHRydWVcblxuICAvLyBzYXZlIHJlZmVyZW5jZSB0byBvcmlnaW5hbCBVaW50OEFycmF5IHNldCBtZXRob2QgYmVmb3JlIG92ZXJ3cml0aW5nXG4gIGFyci5fc2V0ID0gYXJyLnNldFxuXG4gIC8vIGRlcHJlY2F0ZWQsIHdpbGwgYmUgcmVtb3ZlZCBpbiBub2RlIDAuMTMrXG4gIGFyci5nZXQgPSBCUC5nZXRcbiAgYXJyLnNldCA9IEJQLnNldFxuXG4gIGFyci53cml0ZSA9IEJQLndyaXRlXG4gIGFyci50b1N0cmluZyA9IEJQLnRvU3RyaW5nXG4gIGFyci50b0xvY2FsZVN0cmluZyA9IEJQLnRvU3RyaW5nXG4gIGFyci50b0pTT04gPSBCUC50b0pTT05cbiAgYXJyLmVxdWFscyA9IEJQLmVxdWFsc1xuICBhcnIuY29tcGFyZSA9IEJQLmNvbXBhcmVcbiAgYXJyLmluZGV4T2YgPSBCUC5pbmRleE9mXG4gIGFyci5jb3B5ID0gQlAuY29weVxuICBhcnIuc2xpY2UgPSBCUC5zbGljZVxuICBhcnIucmVhZFVJbnRMRSA9IEJQLnJlYWRVSW50TEVcbiAgYXJyLnJlYWRVSW50QkUgPSBCUC5yZWFkVUludEJFXG4gIGFyci5yZWFkVUludDggPSBCUC5yZWFkVUludDhcbiAgYXJyLnJlYWRVSW50MTZMRSA9IEJQLnJlYWRVSW50MTZMRVxuICBhcnIucmVhZFVJbnQxNkJFID0gQlAucmVhZFVJbnQxNkJFXG4gIGFyci5yZWFkVUludDMyTEUgPSBCUC5yZWFkVUludDMyTEVcbiAgYXJyLnJlYWRVSW50MzJCRSA9IEJQLnJlYWRVSW50MzJCRVxuICBhcnIucmVhZEludExFID0gQlAucmVhZEludExFXG4gIGFyci5yZWFkSW50QkUgPSBCUC5yZWFkSW50QkVcbiAgYXJyLnJlYWRJbnQ4ID0gQlAucmVhZEludDhcbiAgYXJyLnJlYWRJbnQxNkxFID0gQlAucmVhZEludDE2TEVcbiAgYXJyLnJlYWRJbnQxNkJFID0gQlAucmVhZEludDE2QkVcbiAgYXJyLnJlYWRJbnQzMkxFID0gQlAucmVhZEludDMyTEVcbiAgYXJyLnJlYWRJbnQzMkJFID0gQlAucmVhZEludDMyQkVcbiAgYXJyLnJlYWRGbG9hdExFID0gQlAucmVhZEZsb2F0TEVcbiAgYXJyLnJlYWRGbG9hdEJFID0gQlAucmVhZEZsb2F0QkVcbiAgYXJyLnJlYWREb3VibGVMRSA9IEJQLnJlYWREb3VibGVMRVxuICBhcnIucmVhZERvdWJsZUJFID0gQlAucmVhZERvdWJsZUJFXG4gIGFyci53cml0ZVVJbnQ4ID0gQlAud3JpdGVVSW50OFxuICBhcnIud3JpdGVVSW50TEUgPSBCUC53cml0ZVVJbnRMRVxuICBhcnIud3JpdGVVSW50QkUgPSBCUC53cml0ZVVJbnRCRVxuICBhcnIud3JpdGVVSW50MTZMRSA9IEJQLndyaXRlVUludDE2TEVcbiAgYXJyLndyaXRlVUludDE2QkUgPSBCUC53cml0ZVVJbnQxNkJFXG4gIGFyci53cml0ZVVJbnQzMkxFID0gQlAud3JpdGVVSW50MzJMRVxuICBhcnIud3JpdGVVSW50MzJCRSA9IEJQLndyaXRlVUludDMyQkVcbiAgYXJyLndyaXRlSW50TEUgPSBCUC53cml0ZUludExFXG4gIGFyci53cml0ZUludEJFID0gQlAud3JpdGVJbnRCRVxuICBhcnIud3JpdGVJbnQ4ID0gQlAud3JpdGVJbnQ4XG4gIGFyci53cml0ZUludDE2TEUgPSBCUC53cml0ZUludDE2TEVcbiAgYXJyLndyaXRlSW50MTZCRSA9IEJQLndyaXRlSW50MTZCRVxuICBhcnIud3JpdGVJbnQzMkxFID0gQlAud3JpdGVJbnQzMkxFXG4gIGFyci53cml0ZUludDMyQkUgPSBCUC53cml0ZUludDMyQkVcbiAgYXJyLndyaXRlRmxvYXRMRSA9IEJQLndyaXRlRmxvYXRMRVxuICBhcnIud3JpdGVGbG9hdEJFID0gQlAud3JpdGVGbG9hdEJFXG4gIGFyci53cml0ZURvdWJsZUxFID0gQlAud3JpdGVEb3VibGVMRVxuICBhcnIud3JpdGVEb3VibGVCRSA9IEJQLndyaXRlRG91YmxlQkVcbiAgYXJyLmZpbGwgPSBCUC5maWxsXG4gIGFyci5pbnNwZWN0ID0gQlAuaW5zcGVjdFxuICBhcnIudG9BcnJheUJ1ZmZlciA9IEJQLnRvQXJyYXlCdWZmZXJcblxuICByZXR1cm4gYXJyXG59XG5cbnZhciBJTlZBTElEX0JBU0U2NF9SRSA9IC9bXitcXC8wLTlBLXpcXC1dL2dcblxuZnVuY3Rpb24gYmFzZTY0Y2xlYW4gKHN0cikge1xuICAvLyBOb2RlIHN0cmlwcyBvdXQgaW52YWxpZCBjaGFyYWN0ZXJzIGxpa2UgXFxuIGFuZCBcXHQgZnJvbSB0aGUgc3RyaW5nLCBiYXNlNjQtanMgZG9lcyBub3RcbiAgc3RyID0gc3RyaW5ndHJpbShzdHIpLnJlcGxhY2UoSU5WQUxJRF9CQVNFNjRfUkUsICcnKVxuICAvLyBOb2RlIGNvbnZlcnRzIHN0cmluZ3Mgd2l0aCBsZW5ndGggPCAyIHRvICcnXG4gIGlmIChzdHIubGVuZ3RoIDwgMikgcmV0dXJuICcnXG4gIC8vIE5vZGUgYWxsb3dzIGZvciBub24tcGFkZGVkIGJhc2U2NCBzdHJpbmdzIChtaXNzaW5nIHRyYWlsaW5nID09PSksIGJhc2U2NC1qcyBkb2VzIG5vdFxuICB3aGlsZSAoc3RyLmxlbmd0aCAlIDQgIT09IDApIHtcbiAgICBzdHIgPSBzdHIgKyAnPSdcbiAgfVxuICByZXR1cm4gc3RyXG59XG5cbmZ1bmN0aW9uIHN0cmluZ3RyaW0gKHN0cikge1xuICBpZiAoc3RyLnRyaW0pIHJldHVybiBzdHIudHJpbSgpXG4gIHJldHVybiBzdHIucmVwbGFjZSgvXlxccyt8XFxzKyQvZywgJycpXG59XG5cbmZ1bmN0aW9uIGlzQXJyYXlpc2ggKHN1YmplY3QpIHtcbiAgcmV0dXJuIGlzQXJyYXkoc3ViamVjdCkgfHwgQnVmZmVyLmlzQnVmZmVyKHN1YmplY3QpIHx8XG4gICAgICBzdWJqZWN0ICYmIHR5cGVvZiBzdWJqZWN0ID09PSAnb2JqZWN0JyAmJlxuICAgICAgdHlwZW9mIHN1YmplY3QubGVuZ3RoID09PSAnbnVtYmVyJ1xufVxuXG5mdW5jdGlvbiB0b0hleCAobikge1xuICBpZiAobiA8IDE2KSByZXR1cm4gJzAnICsgbi50b1N0cmluZygxNilcbiAgcmV0dXJuIG4udG9TdHJpbmcoMTYpXG59XG5cbmZ1bmN0aW9uIHV0ZjhUb0J5dGVzIChzdHJpbmcsIHVuaXRzKSB7XG4gIHVuaXRzID0gdW5pdHMgfHwgSW5maW5pdHlcbiAgdmFyIGNvZGVQb2ludFxuICB2YXIgbGVuZ3RoID0gc3RyaW5nLmxlbmd0aFxuICB2YXIgbGVhZFN1cnJvZ2F0ZSA9IG51bGxcbiAgdmFyIGJ5dGVzID0gW11cbiAgdmFyIGkgPSAwXG5cbiAgZm9yICg7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgIGNvZGVQb2ludCA9IHN0cmluZy5jaGFyQ29kZUF0KGkpXG5cbiAgICAvLyBpcyBzdXJyb2dhdGUgY29tcG9uZW50XG4gICAgaWYgKGNvZGVQb2ludCA+IDB4RDdGRiAmJiBjb2RlUG9pbnQgPCAweEUwMDApIHtcbiAgICAgIC8vIGxhc3QgY2hhciB3YXMgYSBsZWFkXG4gICAgICBpZiAobGVhZFN1cnJvZ2F0ZSkge1xuICAgICAgICAvLyAyIGxlYWRzIGluIGEgcm93XG4gICAgICAgIGlmIChjb2RlUG9pbnQgPCAweERDMDApIHtcbiAgICAgICAgICBpZiAoKHVuaXRzIC09IDMpID4gLTEpIGJ5dGVzLnB1c2goMHhFRiwgMHhCRiwgMHhCRClcbiAgICAgICAgICBsZWFkU3Vycm9nYXRlID0gY29kZVBvaW50XG4gICAgICAgICAgY29udGludWVcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyB2YWxpZCBzdXJyb2dhdGUgcGFpclxuICAgICAgICAgIGNvZGVQb2ludCA9IGxlYWRTdXJyb2dhdGUgLSAweEQ4MDAgPDwgMTAgfCBjb2RlUG9pbnQgLSAweERDMDAgfCAweDEwMDAwXG4gICAgICAgICAgbGVhZFN1cnJvZ2F0ZSA9IG51bGxcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gbm8gbGVhZCB5ZXRcblxuICAgICAgICBpZiAoY29kZVBvaW50ID4gMHhEQkZGKSB7XG4gICAgICAgICAgLy8gdW5leHBlY3RlZCB0cmFpbFxuICAgICAgICAgIGlmICgodW5pdHMgLT0gMykgPiAtMSkgYnl0ZXMucHVzaCgweEVGLCAweEJGLCAweEJEKVxuICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgIH0gZWxzZSBpZiAoaSArIDEgPT09IGxlbmd0aCkge1xuICAgICAgICAgIC8vIHVucGFpcmVkIGxlYWRcbiAgICAgICAgICBpZiAoKHVuaXRzIC09IDMpID4gLTEpIGJ5dGVzLnB1c2goMHhFRiwgMHhCRiwgMHhCRClcbiAgICAgICAgICBjb250aW51ZVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIHZhbGlkIGxlYWRcbiAgICAgICAgICBsZWFkU3Vycm9nYXRlID0gY29kZVBvaW50XG4gICAgICAgICAgY29udGludWVcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSBpZiAobGVhZFN1cnJvZ2F0ZSkge1xuICAgICAgLy8gdmFsaWQgYm1wIGNoYXIsIGJ1dCBsYXN0IGNoYXIgd2FzIGEgbGVhZFxuICAgICAgaWYgKCh1bml0cyAtPSAzKSA+IC0xKSBieXRlcy5wdXNoKDB4RUYsIDB4QkYsIDB4QkQpXG4gICAgICBsZWFkU3Vycm9nYXRlID0gbnVsbFxuICAgIH1cblxuICAgIC8vIGVuY29kZSB1dGY4XG4gICAgaWYgKGNvZGVQb2ludCA8IDB4ODApIHtcbiAgICAgIGlmICgodW5pdHMgLT0gMSkgPCAwKSBicmVha1xuICAgICAgYnl0ZXMucHVzaChjb2RlUG9pbnQpXG4gICAgfSBlbHNlIGlmIChjb2RlUG9pbnQgPCAweDgwMCkge1xuICAgICAgaWYgKCh1bml0cyAtPSAyKSA8IDApIGJyZWFrXG4gICAgICBieXRlcy5wdXNoKFxuICAgICAgICBjb2RlUG9pbnQgPj4gMHg2IHwgMHhDMCxcbiAgICAgICAgY29kZVBvaW50ICYgMHgzRiB8IDB4ODBcbiAgICAgIClcbiAgICB9IGVsc2UgaWYgKGNvZGVQb2ludCA8IDB4MTAwMDApIHtcbiAgICAgIGlmICgodW5pdHMgLT0gMykgPCAwKSBicmVha1xuICAgICAgYnl0ZXMucHVzaChcbiAgICAgICAgY29kZVBvaW50ID4+IDB4QyB8IDB4RTAsXG4gICAgICAgIGNvZGVQb2ludCA+PiAweDYgJiAweDNGIHwgMHg4MCxcbiAgICAgICAgY29kZVBvaW50ICYgMHgzRiB8IDB4ODBcbiAgICAgIClcbiAgICB9IGVsc2UgaWYgKGNvZGVQb2ludCA8IDB4MjAwMDAwKSB7XG4gICAgICBpZiAoKHVuaXRzIC09IDQpIDwgMCkgYnJlYWtcbiAgICAgIGJ5dGVzLnB1c2goXG4gICAgICAgIGNvZGVQb2ludCA+PiAweDEyIHwgMHhGMCxcbiAgICAgICAgY29kZVBvaW50ID4+IDB4QyAmIDB4M0YgfCAweDgwLFxuICAgICAgICBjb2RlUG9pbnQgPj4gMHg2ICYgMHgzRiB8IDB4ODAsXG4gICAgICAgIGNvZGVQb2ludCAmIDB4M0YgfCAweDgwXG4gICAgICApXG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBjb2RlIHBvaW50JylcbiAgICB9XG4gIH1cblxuICByZXR1cm4gYnl0ZXNcbn1cblxuZnVuY3Rpb24gYXNjaWlUb0J5dGVzIChzdHIpIHtcbiAgdmFyIGJ5dGVBcnJheSA9IFtdXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgc3RyLmxlbmd0aDsgaSsrKSB7XG4gICAgLy8gTm9kZSdzIGNvZGUgc2VlbXMgdG8gYmUgZG9pbmcgdGhpcyBhbmQgbm90ICYgMHg3Ri4uXG4gICAgYnl0ZUFycmF5LnB1c2goc3RyLmNoYXJDb2RlQXQoaSkgJiAweEZGKVxuICB9XG4gIHJldHVybiBieXRlQXJyYXlcbn1cblxuZnVuY3Rpb24gdXRmMTZsZVRvQnl0ZXMgKHN0ciwgdW5pdHMpIHtcbiAgdmFyIGMsIGhpLCBsb1xuICB2YXIgYnl0ZUFycmF5ID0gW11cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdHIubGVuZ3RoOyBpKyspIHtcbiAgICBpZiAoKHVuaXRzIC09IDIpIDwgMCkgYnJlYWtcblxuICAgIGMgPSBzdHIuY2hhckNvZGVBdChpKVxuICAgIGhpID0gYyA+PiA4XG4gICAgbG8gPSBjICUgMjU2XG4gICAgYnl0ZUFycmF5LnB1c2gobG8pXG4gICAgYnl0ZUFycmF5LnB1c2goaGkpXG4gIH1cblxuICByZXR1cm4gYnl0ZUFycmF5XG59XG5cbmZ1bmN0aW9uIGJhc2U2NFRvQnl0ZXMgKHN0cikge1xuICByZXR1cm4gYmFzZTY0LnRvQnl0ZUFycmF5KGJhc2U2NGNsZWFuKHN0cikpXG59XG5cbmZ1bmN0aW9uIGJsaXRCdWZmZXIgKHNyYywgZHN0LCBvZmZzZXQsIGxlbmd0aCkge1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKChpICsgb2Zmc2V0ID49IGRzdC5sZW5ndGgpIHx8IChpID49IHNyYy5sZW5ndGgpKSBicmVha1xuICAgIGRzdFtpICsgb2Zmc2V0XSA9IHNyY1tpXVxuICB9XG4gIHJldHVybiBpXG59XG5cbmZ1bmN0aW9uIGRlY29kZVV0ZjhDaGFyIChzdHIpIHtcbiAgdHJ5IHtcbiAgICByZXR1cm4gZGVjb2RlVVJJQ29tcG9uZW50KHN0cilcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgcmV0dXJuIFN0cmluZy5mcm9tQ2hhckNvZGUoMHhGRkZEKSAvLyBVVEYgOCBpbnZhbGlkIGNoYXJcbiAgfVxufVxuIiwidmFyIGxvb2t1cCA9ICdBQkNERUZHSElKS0xNTk9QUVJTVFVWV1hZWmFiY2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6MDEyMzQ1Njc4OSsvJztcblxuOyhmdW5jdGlvbiAoZXhwb3J0cykge1xuXHQndXNlIHN0cmljdCc7XG5cbiAgdmFyIEFyciA9ICh0eXBlb2YgVWludDhBcnJheSAhPT0gJ3VuZGVmaW5lZCcpXG4gICAgPyBVaW50OEFycmF5XG4gICAgOiBBcnJheVxuXG5cdHZhciBQTFVTICAgPSAnKycuY2hhckNvZGVBdCgwKVxuXHR2YXIgU0xBU0ggID0gJy8nLmNoYXJDb2RlQXQoMClcblx0dmFyIE5VTUJFUiA9ICcwJy5jaGFyQ29kZUF0KDApXG5cdHZhciBMT1dFUiAgPSAnYScuY2hhckNvZGVBdCgwKVxuXHR2YXIgVVBQRVIgID0gJ0EnLmNoYXJDb2RlQXQoMClcblx0dmFyIFBMVVNfVVJMX1NBRkUgPSAnLScuY2hhckNvZGVBdCgwKVxuXHR2YXIgU0xBU0hfVVJMX1NBRkUgPSAnXycuY2hhckNvZGVBdCgwKVxuXG5cdGZ1bmN0aW9uIGRlY29kZSAoZWx0KSB7XG5cdFx0dmFyIGNvZGUgPSBlbHQuY2hhckNvZGVBdCgwKVxuXHRcdGlmIChjb2RlID09PSBQTFVTIHx8XG5cdFx0ICAgIGNvZGUgPT09IFBMVVNfVVJMX1NBRkUpXG5cdFx0XHRyZXR1cm4gNjIgLy8gJysnXG5cdFx0aWYgKGNvZGUgPT09IFNMQVNIIHx8XG5cdFx0ICAgIGNvZGUgPT09IFNMQVNIX1VSTF9TQUZFKVxuXHRcdFx0cmV0dXJuIDYzIC8vICcvJ1xuXHRcdGlmIChjb2RlIDwgTlVNQkVSKVxuXHRcdFx0cmV0dXJuIC0xIC8vbm8gbWF0Y2hcblx0XHRpZiAoY29kZSA8IE5VTUJFUiArIDEwKVxuXHRcdFx0cmV0dXJuIGNvZGUgLSBOVU1CRVIgKyAyNiArIDI2XG5cdFx0aWYgKGNvZGUgPCBVUFBFUiArIDI2KVxuXHRcdFx0cmV0dXJuIGNvZGUgLSBVUFBFUlxuXHRcdGlmIChjb2RlIDwgTE9XRVIgKyAyNilcblx0XHRcdHJldHVybiBjb2RlIC0gTE9XRVIgKyAyNlxuXHR9XG5cblx0ZnVuY3Rpb24gYjY0VG9CeXRlQXJyYXkgKGI2NCkge1xuXHRcdHZhciBpLCBqLCBsLCB0bXAsIHBsYWNlSG9sZGVycywgYXJyXG5cblx0XHRpZiAoYjY0Lmxlbmd0aCAlIDQgPiAwKSB7XG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgc3RyaW5nLiBMZW5ndGggbXVzdCBiZSBhIG11bHRpcGxlIG9mIDQnKVxuXHRcdH1cblxuXHRcdC8vIHRoZSBudW1iZXIgb2YgZXF1YWwgc2lnbnMgKHBsYWNlIGhvbGRlcnMpXG5cdFx0Ly8gaWYgdGhlcmUgYXJlIHR3byBwbGFjZWhvbGRlcnMsIHRoYW4gdGhlIHR3byBjaGFyYWN0ZXJzIGJlZm9yZSBpdFxuXHRcdC8vIHJlcHJlc2VudCBvbmUgYnl0ZVxuXHRcdC8vIGlmIHRoZXJlIGlzIG9ubHkgb25lLCB0aGVuIHRoZSB0aHJlZSBjaGFyYWN0ZXJzIGJlZm9yZSBpdCByZXByZXNlbnQgMiBieXRlc1xuXHRcdC8vIHRoaXMgaXMganVzdCBhIGNoZWFwIGhhY2sgdG8gbm90IGRvIGluZGV4T2YgdHdpY2Vcblx0XHR2YXIgbGVuID0gYjY0Lmxlbmd0aFxuXHRcdHBsYWNlSG9sZGVycyA9ICc9JyA9PT0gYjY0LmNoYXJBdChsZW4gLSAyKSA/IDIgOiAnPScgPT09IGI2NC5jaGFyQXQobGVuIC0gMSkgPyAxIDogMFxuXG5cdFx0Ly8gYmFzZTY0IGlzIDQvMyArIHVwIHRvIHR3byBjaGFyYWN0ZXJzIG9mIHRoZSBvcmlnaW5hbCBkYXRhXG5cdFx0YXJyID0gbmV3IEFycihiNjQubGVuZ3RoICogMyAvIDQgLSBwbGFjZUhvbGRlcnMpXG5cblx0XHQvLyBpZiB0aGVyZSBhcmUgcGxhY2Vob2xkZXJzLCBvbmx5IGdldCB1cCB0byB0aGUgbGFzdCBjb21wbGV0ZSA0IGNoYXJzXG5cdFx0bCA9IHBsYWNlSG9sZGVycyA+IDAgPyBiNjQubGVuZ3RoIC0gNCA6IGI2NC5sZW5ndGhcblxuXHRcdHZhciBMID0gMFxuXG5cdFx0ZnVuY3Rpb24gcHVzaCAodikge1xuXHRcdFx0YXJyW0wrK10gPSB2XG5cdFx0fVxuXG5cdFx0Zm9yIChpID0gMCwgaiA9IDA7IGkgPCBsOyBpICs9IDQsIGogKz0gMykge1xuXHRcdFx0dG1wID0gKGRlY29kZShiNjQuY2hhckF0KGkpKSA8PCAxOCkgfCAoZGVjb2RlKGI2NC5jaGFyQXQoaSArIDEpKSA8PCAxMikgfCAoZGVjb2RlKGI2NC5jaGFyQXQoaSArIDIpKSA8PCA2KSB8IGRlY29kZShiNjQuY2hhckF0KGkgKyAzKSlcblx0XHRcdHB1c2goKHRtcCAmIDB4RkYwMDAwKSA+PiAxNilcblx0XHRcdHB1c2goKHRtcCAmIDB4RkYwMCkgPj4gOClcblx0XHRcdHB1c2godG1wICYgMHhGRilcblx0XHR9XG5cblx0XHRpZiAocGxhY2VIb2xkZXJzID09PSAyKSB7XG5cdFx0XHR0bXAgPSAoZGVjb2RlKGI2NC5jaGFyQXQoaSkpIDw8IDIpIHwgKGRlY29kZShiNjQuY2hhckF0KGkgKyAxKSkgPj4gNClcblx0XHRcdHB1c2godG1wICYgMHhGRilcblx0XHR9IGVsc2UgaWYgKHBsYWNlSG9sZGVycyA9PT0gMSkge1xuXHRcdFx0dG1wID0gKGRlY29kZShiNjQuY2hhckF0KGkpKSA8PCAxMCkgfCAoZGVjb2RlKGI2NC5jaGFyQXQoaSArIDEpKSA8PCA0KSB8IChkZWNvZGUoYjY0LmNoYXJBdChpICsgMikpID4+IDIpXG5cdFx0XHRwdXNoKCh0bXAgPj4gOCkgJiAweEZGKVxuXHRcdFx0cHVzaCh0bXAgJiAweEZGKVxuXHRcdH1cblxuXHRcdHJldHVybiBhcnJcblx0fVxuXG5cdGZ1bmN0aW9uIHVpbnQ4VG9CYXNlNjQgKHVpbnQ4KSB7XG5cdFx0dmFyIGksXG5cdFx0XHRleHRyYUJ5dGVzID0gdWludDgubGVuZ3RoICUgMywgLy8gaWYgd2UgaGF2ZSAxIGJ5dGUgbGVmdCwgcGFkIDIgYnl0ZXNcblx0XHRcdG91dHB1dCA9IFwiXCIsXG5cdFx0XHR0ZW1wLCBsZW5ndGhcblxuXHRcdGZ1bmN0aW9uIGVuY29kZSAobnVtKSB7XG5cdFx0XHRyZXR1cm4gbG9va3VwLmNoYXJBdChudW0pXG5cdFx0fVxuXG5cdFx0ZnVuY3Rpb24gdHJpcGxldFRvQmFzZTY0IChudW0pIHtcblx0XHRcdHJldHVybiBlbmNvZGUobnVtID4+IDE4ICYgMHgzRikgKyBlbmNvZGUobnVtID4+IDEyICYgMHgzRikgKyBlbmNvZGUobnVtID4+IDYgJiAweDNGKSArIGVuY29kZShudW0gJiAweDNGKVxuXHRcdH1cblxuXHRcdC8vIGdvIHRocm91Z2ggdGhlIGFycmF5IGV2ZXJ5IHRocmVlIGJ5dGVzLCB3ZSdsbCBkZWFsIHdpdGggdHJhaWxpbmcgc3R1ZmYgbGF0ZXJcblx0XHRmb3IgKGkgPSAwLCBsZW5ndGggPSB1aW50OC5sZW5ndGggLSBleHRyYUJ5dGVzOyBpIDwgbGVuZ3RoOyBpICs9IDMpIHtcblx0XHRcdHRlbXAgPSAodWludDhbaV0gPDwgMTYpICsgKHVpbnQ4W2kgKyAxXSA8PCA4KSArICh1aW50OFtpICsgMl0pXG5cdFx0XHRvdXRwdXQgKz0gdHJpcGxldFRvQmFzZTY0KHRlbXApXG5cdFx0fVxuXG5cdFx0Ly8gcGFkIHRoZSBlbmQgd2l0aCB6ZXJvcywgYnV0IG1ha2Ugc3VyZSB0byBub3QgZm9yZ2V0IHRoZSBleHRyYSBieXRlc1xuXHRcdHN3aXRjaCAoZXh0cmFCeXRlcykge1xuXHRcdFx0Y2FzZSAxOlxuXHRcdFx0XHR0ZW1wID0gdWludDhbdWludDgubGVuZ3RoIC0gMV1cblx0XHRcdFx0b3V0cHV0ICs9IGVuY29kZSh0ZW1wID4+IDIpXG5cdFx0XHRcdG91dHB1dCArPSBlbmNvZGUoKHRlbXAgPDwgNCkgJiAweDNGKVxuXHRcdFx0XHRvdXRwdXQgKz0gJz09J1xuXHRcdFx0XHRicmVha1xuXHRcdFx0Y2FzZSAyOlxuXHRcdFx0XHR0ZW1wID0gKHVpbnQ4W3VpbnQ4Lmxlbmd0aCAtIDJdIDw8IDgpICsgKHVpbnQ4W3VpbnQ4Lmxlbmd0aCAtIDFdKVxuXHRcdFx0XHRvdXRwdXQgKz0gZW5jb2RlKHRlbXAgPj4gMTApXG5cdFx0XHRcdG91dHB1dCArPSBlbmNvZGUoKHRlbXAgPj4gNCkgJiAweDNGKVxuXHRcdFx0XHRvdXRwdXQgKz0gZW5jb2RlKCh0ZW1wIDw8IDIpICYgMHgzRilcblx0XHRcdFx0b3V0cHV0ICs9ICc9J1xuXHRcdFx0XHRicmVha1xuXHRcdH1cblxuXHRcdHJldHVybiBvdXRwdXRcblx0fVxuXG5cdGV4cG9ydHMudG9CeXRlQXJyYXkgPSBiNjRUb0J5dGVBcnJheVxuXHRleHBvcnRzLmZyb21CeXRlQXJyYXkgPSB1aW50OFRvQmFzZTY0XG59KHR5cGVvZiBleHBvcnRzID09PSAndW5kZWZpbmVkJyA/ICh0aGlzLmJhc2U2NGpzID0ge30pIDogZXhwb3J0cykpXG4iLCJleHBvcnRzLnJlYWQgPSBmdW5jdGlvbihidWZmZXIsIG9mZnNldCwgaXNMRSwgbUxlbiwgbkJ5dGVzKSB7XG4gIHZhciBlLCBtLFxuICAgICAgZUxlbiA9IG5CeXRlcyAqIDggLSBtTGVuIC0gMSxcbiAgICAgIGVNYXggPSAoMSA8PCBlTGVuKSAtIDEsXG4gICAgICBlQmlhcyA9IGVNYXggPj4gMSxcbiAgICAgIG5CaXRzID0gLTcsXG4gICAgICBpID0gaXNMRSA/IChuQnl0ZXMgLSAxKSA6IDAsXG4gICAgICBkID0gaXNMRSA/IC0xIDogMSxcbiAgICAgIHMgPSBidWZmZXJbb2Zmc2V0ICsgaV07XG5cbiAgaSArPSBkO1xuXG4gIGUgPSBzICYgKCgxIDw8ICgtbkJpdHMpKSAtIDEpO1xuICBzID4+PSAoLW5CaXRzKTtcbiAgbkJpdHMgKz0gZUxlbjtcbiAgZm9yICg7IG5CaXRzID4gMDsgZSA9IGUgKiAyNTYgKyBidWZmZXJbb2Zmc2V0ICsgaV0sIGkgKz0gZCwgbkJpdHMgLT0gOCk7XG5cbiAgbSA9IGUgJiAoKDEgPDwgKC1uQml0cykpIC0gMSk7XG4gIGUgPj49ICgtbkJpdHMpO1xuICBuQml0cyArPSBtTGVuO1xuICBmb3IgKDsgbkJpdHMgPiAwOyBtID0gbSAqIDI1NiArIGJ1ZmZlcltvZmZzZXQgKyBpXSwgaSArPSBkLCBuQml0cyAtPSA4KTtcblxuICBpZiAoZSA9PT0gMCkge1xuICAgIGUgPSAxIC0gZUJpYXM7XG4gIH0gZWxzZSBpZiAoZSA9PT0gZU1heCkge1xuICAgIHJldHVybiBtID8gTmFOIDogKChzID8gLTEgOiAxKSAqIEluZmluaXR5KTtcbiAgfSBlbHNlIHtcbiAgICBtID0gbSArIE1hdGgucG93KDIsIG1MZW4pO1xuICAgIGUgPSBlIC0gZUJpYXM7XG4gIH1cbiAgcmV0dXJuIChzID8gLTEgOiAxKSAqIG0gKiBNYXRoLnBvdygyLCBlIC0gbUxlbik7XG59O1xuXG5leHBvcnRzLndyaXRlID0gZnVuY3Rpb24oYnVmZmVyLCB2YWx1ZSwgb2Zmc2V0LCBpc0xFLCBtTGVuLCBuQnl0ZXMpIHtcbiAgdmFyIGUsIG0sIGMsXG4gICAgICBlTGVuID0gbkJ5dGVzICogOCAtIG1MZW4gLSAxLFxuICAgICAgZU1heCA9ICgxIDw8IGVMZW4pIC0gMSxcbiAgICAgIGVCaWFzID0gZU1heCA+PiAxLFxuICAgICAgcnQgPSAobUxlbiA9PT0gMjMgPyBNYXRoLnBvdygyLCAtMjQpIC0gTWF0aC5wb3coMiwgLTc3KSA6IDApLFxuICAgICAgaSA9IGlzTEUgPyAwIDogKG5CeXRlcyAtIDEpLFxuICAgICAgZCA9IGlzTEUgPyAxIDogLTEsXG4gICAgICBzID0gdmFsdWUgPCAwIHx8ICh2YWx1ZSA9PT0gMCAmJiAxIC8gdmFsdWUgPCAwKSA/IDEgOiAwO1xuXG4gIHZhbHVlID0gTWF0aC5hYnModmFsdWUpO1xuXG4gIGlmIChpc05hTih2YWx1ZSkgfHwgdmFsdWUgPT09IEluZmluaXR5KSB7XG4gICAgbSA9IGlzTmFOKHZhbHVlKSA/IDEgOiAwO1xuICAgIGUgPSBlTWF4O1xuICB9IGVsc2Uge1xuICAgIGUgPSBNYXRoLmZsb29yKE1hdGgubG9nKHZhbHVlKSAvIE1hdGguTE4yKTtcbiAgICBpZiAodmFsdWUgKiAoYyA9IE1hdGgucG93KDIsIC1lKSkgPCAxKSB7XG4gICAgICBlLS07XG4gICAgICBjICo9IDI7XG4gICAgfVxuICAgIGlmIChlICsgZUJpYXMgPj0gMSkge1xuICAgICAgdmFsdWUgKz0gcnQgLyBjO1xuICAgIH0gZWxzZSB7XG4gICAgICB2YWx1ZSArPSBydCAqIE1hdGgucG93KDIsIDEgLSBlQmlhcyk7XG4gICAgfVxuICAgIGlmICh2YWx1ZSAqIGMgPj0gMikge1xuICAgICAgZSsrO1xuICAgICAgYyAvPSAyO1xuICAgIH1cblxuICAgIGlmIChlICsgZUJpYXMgPj0gZU1heCkge1xuICAgICAgbSA9IDA7XG4gICAgICBlID0gZU1heDtcbiAgICB9IGVsc2UgaWYgKGUgKyBlQmlhcyA+PSAxKSB7XG4gICAgICBtID0gKHZhbHVlICogYyAtIDEpICogTWF0aC5wb3coMiwgbUxlbik7XG4gICAgICBlID0gZSArIGVCaWFzO1xuICAgIH0gZWxzZSB7XG4gICAgICBtID0gdmFsdWUgKiBNYXRoLnBvdygyLCBlQmlhcyAtIDEpICogTWF0aC5wb3coMiwgbUxlbik7XG4gICAgICBlID0gMDtcbiAgICB9XG4gIH1cblxuICBmb3IgKDsgbUxlbiA+PSA4OyBidWZmZXJbb2Zmc2V0ICsgaV0gPSBtICYgMHhmZiwgaSArPSBkLCBtIC89IDI1NiwgbUxlbiAtPSA4KTtcblxuICBlID0gKGUgPDwgbUxlbikgfCBtO1xuICBlTGVuICs9IG1MZW47XG4gIGZvciAoOyBlTGVuID4gMDsgYnVmZmVyW29mZnNldCArIGldID0gZSAmIDB4ZmYsIGkgKz0gZCwgZSAvPSAyNTYsIGVMZW4gLT0gOCk7XG5cbiAgYnVmZmVyW29mZnNldCArIGkgLSBkXSB8PSBzICogMTI4O1xufTtcbiIsIlxuLyoqXG4gKiBpc0FycmF5XG4gKi9cblxudmFyIGlzQXJyYXkgPSBBcnJheS5pc0FycmF5O1xuXG4vKipcbiAqIHRvU3RyaW5nXG4gKi9cblxudmFyIHN0ciA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmc7XG5cbi8qKlxuICogV2hldGhlciBvciBub3QgdGhlIGdpdmVuIGB2YWxgXG4gKiBpcyBhbiBhcnJheS5cbiAqXG4gKiBleGFtcGxlOlxuICpcbiAqICAgICAgICBpc0FycmF5KFtdKTtcbiAqICAgICAgICAvLyA+IHRydWVcbiAqICAgICAgICBpc0FycmF5KGFyZ3VtZW50cyk7XG4gKiAgICAgICAgLy8gPiBmYWxzZVxuICogICAgICAgIGlzQXJyYXkoJycpO1xuICogICAgICAgIC8vID4gZmFsc2VcbiAqXG4gKiBAcGFyYW0ge21peGVkfSB2YWxcbiAqIEByZXR1cm4ge2Jvb2x9XG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSBpc0FycmF5IHx8IGZ1bmN0aW9uICh2YWwpIHtcbiAgcmV0dXJuICEhIHZhbCAmJiAnW29iamVjdCBBcnJheV0nID09IHN0ci5jYWxsKHZhbCk7XG59O1xuIiwiLy8gQ29weXJpZ2h0IEpveWVudCwgSW5jLiBhbmQgb3RoZXIgTm9kZSBjb250cmlidXRvcnMuXG4vL1xuLy8gUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGFcbi8vIGNvcHkgb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGVcbi8vIFwiU29mdHdhcmVcIiksIHRvIGRlYWwgaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZ1xuLy8gd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHMgdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLFxuLy8gZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGwgY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdFxuLy8gcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpcyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlXG4vLyBmb2xsb3dpbmcgY29uZGl0aW9uczpcbi8vXG4vLyBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZFxuLy8gaW4gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4vL1xuLy8gVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTU1xuLy8gT1IgSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRlxuLy8gTUVSQ0hBTlRBQklMSVRZLCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTlxuLy8gTk8gRVZFTlQgU0hBTEwgVEhFIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sXG4vLyBEQU1BR0VTIE9SIE9USEVSIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1Jcbi8vIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLCBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEVcbi8vIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEUgU09GVFdBUkUuXG5cbmZ1bmN0aW9uIEV2ZW50RW1pdHRlcigpIHtcbiAgdGhpcy5fZXZlbnRzID0gdGhpcy5fZXZlbnRzIHx8IHt9O1xuICB0aGlzLl9tYXhMaXN0ZW5lcnMgPSB0aGlzLl9tYXhMaXN0ZW5lcnMgfHwgdW5kZWZpbmVkO1xufVxubW9kdWxlLmV4cG9ydHMgPSBFdmVudEVtaXR0ZXI7XG5cbi8vIEJhY2t3YXJkcy1jb21wYXQgd2l0aCBub2RlIDAuMTAueFxuRXZlbnRFbWl0dGVyLkV2ZW50RW1pdHRlciA9IEV2ZW50RW1pdHRlcjtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5fZXZlbnRzID0gdW5kZWZpbmVkO1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5fbWF4TGlzdGVuZXJzID0gdW5kZWZpbmVkO1xuXG4vLyBCeSBkZWZhdWx0IEV2ZW50RW1pdHRlcnMgd2lsbCBwcmludCBhIHdhcm5pbmcgaWYgbW9yZSB0aGFuIDEwIGxpc3RlbmVycyBhcmVcbi8vIGFkZGVkIHRvIGl0LiBUaGlzIGlzIGEgdXNlZnVsIGRlZmF1bHQgd2hpY2ggaGVscHMgZmluZGluZyBtZW1vcnkgbGVha3MuXG5FdmVudEVtaXR0ZXIuZGVmYXVsdE1heExpc3RlbmVycyA9IDEwO1xuXG4vLyBPYnZpb3VzbHkgbm90IGFsbCBFbWl0dGVycyBzaG91bGQgYmUgbGltaXRlZCB0byAxMC4gVGhpcyBmdW5jdGlvbiBhbGxvd3Ncbi8vIHRoYXQgdG8gYmUgaW5jcmVhc2VkLiBTZXQgdG8gemVybyBmb3IgdW5saW1pdGVkLlxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5zZXRNYXhMaXN0ZW5lcnMgPSBmdW5jdGlvbihuKSB7XG4gIGlmICghaXNOdW1iZXIobikgfHwgbiA8IDAgfHwgaXNOYU4obikpXG4gICAgdGhyb3cgVHlwZUVycm9yKCduIG11c3QgYmUgYSBwb3NpdGl2ZSBudW1iZXInKTtcbiAgdGhpcy5fbWF4TGlzdGVuZXJzID0gbjtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmVtaXQgPSBmdW5jdGlvbih0eXBlKSB7XG4gIHZhciBlciwgaGFuZGxlciwgbGVuLCBhcmdzLCBpLCBsaXN0ZW5lcnM7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMpXG4gICAgdGhpcy5fZXZlbnRzID0ge307XG5cbiAgLy8gSWYgdGhlcmUgaXMgbm8gJ2Vycm9yJyBldmVudCBsaXN0ZW5lciB0aGVuIHRocm93LlxuICBpZiAodHlwZSA9PT0gJ2Vycm9yJykge1xuICAgIGlmICghdGhpcy5fZXZlbnRzLmVycm9yIHx8XG4gICAgICAgIChpc09iamVjdCh0aGlzLl9ldmVudHMuZXJyb3IpICYmICF0aGlzLl9ldmVudHMuZXJyb3IubGVuZ3RoKSkge1xuICAgICAgZXIgPSBhcmd1bWVudHNbMV07XG4gICAgICBpZiAoZXIgaW5zdGFuY2VvZiBFcnJvcikge1xuICAgICAgICB0aHJvdyBlcjsgLy8gVW5oYW5kbGVkICdlcnJvcicgZXZlbnRcbiAgICAgIH1cbiAgICAgIHRocm93IFR5cGVFcnJvcignVW5jYXVnaHQsIHVuc3BlY2lmaWVkIFwiZXJyb3JcIiBldmVudC4nKTtcbiAgICB9XG4gIH1cblxuICBoYW5kbGVyID0gdGhpcy5fZXZlbnRzW3R5cGVdO1xuXG4gIGlmIChpc1VuZGVmaW5lZChoYW5kbGVyKSlcbiAgICByZXR1cm4gZmFsc2U7XG5cbiAgaWYgKGlzRnVuY3Rpb24oaGFuZGxlcikpIHtcbiAgICBzd2l0Y2ggKGFyZ3VtZW50cy5sZW5ndGgpIHtcbiAgICAgIC8vIGZhc3QgY2FzZXNcbiAgICAgIGNhc2UgMTpcbiAgICAgICAgaGFuZGxlci5jYWxsKHRoaXMpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgMjpcbiAgICAgICAgaGFuZGxlci5jYWxsKHRoaXMsIGFyZ3VtZW50c1sxXSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAzOlxuICAgICAgICBoYW5kbGVyLmNhbGwodGhpcywgYXJndW1lbnRzWzFdLCBhcmd1bWVudHNbMl0pO1xuICAgICAgICBicmVhaztcbiAgICAgIC8vIHNsb3dlclxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgbGVuID0gYXJndW1lbnRzLmxlbmd0aDtcbiAgICAgICAgYXJncyA9IG5ldyBBcnJheShsZW4gLSAxKTtcbiAgICAgICAgZm9yIChpID0gMTsgaSA8IGxlbjsgaSsrKVxuICAgICAgICAgIGFyZ3NbaSAtIDFdID0gYXJndW1lbnRzW2ldO1xuICAgICAgICBoYW5kbGVyLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgIH1cbiAgfSBlbHNlIGlmIChpc09iamVjdChoYW5kbGVyKSkge1xuICAgIGxlbiA9IGFyZ3VtZW50cy5sZW5ndGg7XG4gICAgYXJncyA9IG5ldyBBcnJheShsZW4gLSAxKTtcbiAgICBmb3IgKGkgPSAxOyBpIDwgbGVuOyBpKyspXG4gICAgICBhcmdzW2kgLSAxXSA9IGFyZ3VtZW50c1tpXTtcblxuICAgIGxpc3RlbmVycyA9IGhhbmRsZXIuc2xpY2UoKTtcbiAgICBsZW4gPSBsaXN0ZW5lcnMubGVuZ3RoO1xuICAgIGZvciAoaSA9IDA7IGkgPCBsZW47IGkrKylcbiAgICAgIGxpc3RlbmVyc1tpXS5hcHBseSh0aGlzLCBhcmdzKTtcbiAgfVxuXG4gIHJldHVybiB0cnVlO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5hZGRMaXN0ZW5lciA9IGZ1bmN0aW9uKHR5cGUsIGxpc3RlbmVyKSB7XG4gIHZhciBtO1xuXG4gIGlmICghaXNGdW5jdGlvbihsaXN0ZW5lcikpXG4gICAgdGhyb3cgVHlwZUVycm9yKCdsaXN0ZW5lciBtdXN0IGJlIGEgZnVuY3Rpb24nKTtcblxuICBpZiAoIXRoaXMuX2V2ZW50cylcbiAgICB0aGlzLl9ldmVudHMgPSB7fTtcblxuICAvLyBUbyBhdm9pZCByZWN1cnNpb24gaW4gdGhlIGNhc2UgdGhhdCB0eXBlID09PSBcIm5ld0xpc3RlbmVyXCIhIEJlZm9yZVxuICAvLyBhZGRpbmcgaXQgdG8gdGhlIGxpc3RlbmVycywgZmlyc3QgZW1pdCBcIm5ld0xpc3RlbmVyXCIuXG4gIGlmICh0aGlzLl9ldmVudHMubmV3TGlzdGVuZXIpXG4gICAgdGhpcy5lbWl0KCduZXdMaXN0ZW5lcicsIHR5cGUsXG4gICAgICAgICAgICAgIGlzRnVuY3Rpb24obGlzdGVuZXIubGlzdGVuZXIpID9cbiAgICAgICAgICAgICAgbGlzdGVuZXIubGlzdGVuZXIgOiBsaXN0ZW5lcik7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHNbdHlwZV0pXG4gICAgLy8gT3B0aW1pemUgdGhlIGNhc2Ugb2Ygb25lIGxpc3RlbmVyLiBEb24ndCBuZWVkIHRoZSBleHRyYSBhcnJheSBvYmplY3QuXG4gICAgdGhpcy5fZXZlbnRzW3R5cGVdID0gbGlzdGVuZXI7XG4gIGVsc2UgaWYgKGlzT2JqZWN0KHRoaXMuX2V2ZW50c1t0eXBlXSkpXG4gICAgLy8gSWYgd2UndmUgYWxyZWFkeSBnb3QgYW4gYXJyYXksIGp1c3QgYXBwZW5kLlxuICAgIHRoaXMuX2V2ZW50c1t0eXBlXS5wdXNoKGxpc3RlbmVyKTtcbiAgZWxzZVxuICAgIC8vIEFkZGluZyB0aGUgc2Vjb25kIGVsZW1lbnQsIG5lZWQgdG8gY2hhbmdlIHRvIGFycmF5LlxuICAgIHRoaXMuX2V2ZW50c1t0eXBlXSA9IFt0aGlzLl9ldmVudHNbdHlwZV0sIGxpc3RlbmVyXTtcblxuICAvLyBDaGVjayBmb3IgbGlzdGVuZXIgbGVha1xuICBpZiAoaXNPYmplY3QodGhpcy5fZXZlbnRzW3R5cGVdKSAmJiAhdGhpcy5fZXZlbnRzW3R5cGVdLndhcm5lZCkge1xuICAgIHZhciBtO1xuICAgIGlmICghaXNVbmRlZmluZWQodGhpcy5fbWF4TGlzdGVuZXJzKSkge1xuICAgICAgbSA9IHRoaXMuX21heExpc3RlbmVycztcbiAgICB9IGVsc2Uge1xuICAgICAgbSA9IEV2ZW50RW1pdHRlci5kZWZhdWx0TWF4TGlzdGVuZXJzO1xuICAgIH1cblxuICAgIGlmIChtICYmIG0gPiAwICYmIHRoaXMuX2V2ZW50c1t0eXBlXS5sZW5ndGggPiBtKSB7XG4gICAgICB0aGlzLl9ldmVudHNbdHlwZV0ud2FybmVkID0gdHJ1ZTtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJyhub2RlKSB3YXJuaW5nOiBwb3NzaWJsZSBFdmVudEVtaXR0ZXIgbWVtb3J5ICcgK1xuICAgICAgICAgICAgICAgICAgICAnbGVhayBkZXRlY3RlZC4gJWQgbGlzdGVuZXJzIGFkZGVkLiAnICtcbiAgICAgICAgICAgICAgICAgICAgJ1VzZSBlbWl0dGVyLnNldE1heExpc3RlbmVycygpIHRvIGluY3JlYXNlIGxpbWl0LicsXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2V2ZW50c1t0eXBlXS5sZW5ndGgpO1xuICAgICAgaWYgKHR5cGVvZiBjb25zb2xlLnRyYWNlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIC8vIG5vdCBzdXBwb3J0ZWQgaW4gSUUgMTBcbiAgICAgICAgY29uc29sZS50cmFjZSgpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiB0aGlzO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vbiA9IEV2ZW50RW1pdHRlci5wcm90b3R5cGUuYWRkTGlzdGVuZXI7XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUub25jZSA9IGZ1bmN0aW9uKHR5cGUsIGxpc3RlbmVyKSB7XG4gIGlmICghaXNGdW5jdGlvbihsaXN0ZW5lcikpXG4gICAgdGhyb3cgVHlwZUVycm9yKCdsaXN0ZW5lciBtdXN0IGJlIGEgZnVuY3Rpb24nKTtcblxuICB2YXIgZmlyZWQgPSBmYWxzZTtcblxuICBmdW5jdGlvbiBnKCkge1xuICAgIHRoaXMucmVtb3ZlTGlzdGVuZXIodHlwZSwgZyk7XG5cbiAgICBpZiAoIWZpcmVkKSB7XG4gICAgICBmaXJlZCA9IHRydWU7XG4gICAgICBsaXN0ZW5lci5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH1cbiAgfVxuXG4gIGcubGlzdGVuZXIgPSBsaXN0ZW5lcjtcbiAgdGhpcy5vbih0eXBlLCBnKTtcblxuICByZXR1cm4gdGhpcztcbn07XG5cbi8vIGVtaXRzIGEgJ3JlbW92ZUxpc3RlbmVyJyBldmVudCBpZmYgdGhlIGxpc3RlbmVyIHdhcyByZW1vdmVkXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUxpc3RlbmVyID0gZnVuY3Rpb24odHlwZSwgbGlzdGVuZXIpIHtcbiAgdmFyIGxpc3QsIHBvc2l0aW9uLCBsZW5ndGgsIGk7XG5cbiAgaWYgKCFpc0Z1bmN0aW9uKGxpc3RlbmVyKSlcbiAgICB0aHJvdyBUeXBlRXJyb3IoJ2xpc3RlbmVyIG11c3QgYmUgYSBmdW5jdGlvbicpO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzIHx8ICF0aGlzLl9ldmVudHNbdHlwZV0pXG4gICAgcmV0dXJuIHRoaXM7XG5cbiAgbGlzdCA9IHRoaXMuX2V2ZW50c1t0eXBlXTtcbiAgbGVuZ3RoID0gbGlzdC5sZW5ndGg7XG4gIHBvc2l0aW9uID0gLTE7XG5cbiAgaWYgKGxpc3QgPT09IGxpc3RlbmVyIHx8XG4gICAgICAoaXNGdW5jdGlvbihsaXN0Lmxpc3RlbmVyKSAmJiBsaXN0Lmxpc3RlbmVyID09PSBsaXN0ZW5lcikpIHtcbiAgICBkZWxldGUgdGhpcy5fZXZlbnRzW3R5cGVdO1xuICAgIGlmICh0aGlzLl9ldmVudHMucmVtb3ZlTGlzdGVuZXIpXG4gICAgICB0aGlzLmVtaXQoJ3JlbW92ZUxpc3RlbmVyJywgdHlwZSwgbGlzdGVuZXIpO1xuXG4gIH0gZWxzZSBpZiAoaXNPYmplY3QobGlzdCkpIHtcbiAgICBmb3IgKGkgPSBsZW5ndGg7IGktLSA+IDA7KSB7XG4gICAgICBpZiAobGlzdFtpXSA9PT0gbGlzdGVuZXIgfHxcbiAgICAgICAgICAobGlzdFtpXS5saXN0ZW5lciAmJiBsaXN0W2ldLmxpc3RlbmVyID09PSBsaXN0ZW5lcikpIHtcbiAgICAgICAgcG9zaXRpb24gPSBpO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAocG9zaXRpb24gPCAwKVxuICAgICAgcmV0dXJuIHRoaXM7XG5cbiAgICBpZiAobGlzdC5sZW5ndGggPT09IDEpIHtcbiAgICAgIGxpc3QubGVuZ3RoID0gMDtcbiAgICAgIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XG4gICAgfSBlbHNlIHtcbiAgICAgIGxpc3Quc3BsaWNlKHBvc2l0aW9uLCAxKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5fZXZlbnRzLnJlbW92ZUxpc3RlbmVyKVxuICAgICAgdGhpcy5lbWl0KCdyZW1vdmVMaXN0ZW5lcicsIHR5cGUsIGxpc3RlbmVyKTtcbiAgfVxuXG4gIHJldHVybiB0aGlzO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVBbGxMaXN0ZW5lcnMgPSBmdW5jdGlvbih0eXBlKSB7XG4gIHZhciBrZXksIGxpc3RlbmVycztcblxuICBpZiAoIXRoaXMuX2V2ZW50cylcbiAgICByZXR1cm4gdGhpcztcblxuICAvLyBub3QgbGlzdGVuaW5nIGZvciByZW1vdmVMaXN0ZW5lciwgbm8gbmVlZCB0byBlbWl0XG4gIGlmICghdGhpcy5fZXZlbnRzLnJlbW92ZUxpc3RlbmVyKSB7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApXG4gICAgICB0aGlzLl9ldmVudHMgPSB7fTtcbiAgICBlbHNlIGlmICh0aGlzLl9ldmVudHNbdHlwZV0pXG4gICAgICBkZWxldGUgdGhpcy5fZXZlbnRzW3R5cGVdO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLy8gZW1pdCByZW1vdmVMaXN0ZW5lciBmb3IgYWxsIGxpc3RlbmVycyBvbiBhbGwgZXZlbnRzXG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XG4gICAgZm9yIChrZXkgaW4gdGhpcy5fZXZlbnRzKSB7XG4gICAgICBpZiAoa2V5ID09PSAncmVtb3ZlTGlzdGVuZXInKSBjb250aW51ZTtcbiAgICAgIHRoaXMucmVtb3ZlQWxsTGlzdGVuZXJzKGtleSk7XG4gICAgfVxuICAgIHRoaXMucmVtb3ZlQWxsTGlzdGVuZXJzKCdyZW1vdmVMaXN0ZW5lcicpO1xuICAgIHRoaXMuX2V2ZW50cyA9IHt9O1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgbGlzdGVuZXJzID0gdGhpcy5fZXZlbnRzW3R5cGVdO1xuXG4gIGlmIChpc0Z1bmN0aW9uKGxpc3RlbmVycykpIHtcbiAgICB0aGlzLnJlbW92ZUxpc3RlbmVyKHR5cGUsIGxpc3RlbmVycyk7XG4gIH0gZWxzZSB7XG4gICAgLy8gTElGTyBvcmRlclxuICAgIHdoaWxlIChsaXN0ZW5lcnMubGVuZ3RoKVxuICAgICAgdGhpcy5yZW1vdmVMaXN0ZW5lcih0eXBlLCBsaXN0ZW5lcnNbbGlzdGVuZXJzLmxlbmd0aCAtIDFdKTtcbiAgfVxuICBkZWxldGUgdGhpcy5fZXZlbnRzW3R5cGVdO1xuXG4gIHJldHVybiB0aGlzO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5saXN0ZW5lcnMgPSBmdW5jdGlvbih0eXBlKSB7XG4gIHZhciByZXQ7XG4gIGlmICghdGhpcy5fZXZlbnRzIHx8ICF0aGlzLl9ldmVudHNbdHlwZV0pXG4gICAgcmV0ID0gW107XG4gIGVsc2UgaWYgKGlzRnVuY3Rpb24odGhpcy5fZXZlbnRzW3R5cGVdKSlcbiAgICByZXQgPSBbdGhpcy5fZXZlbnRzW3R5cGVdXTtcbiAgZWxzZVxuICAgIHJldCA9IHRoaXMuX2V2ZW50c1t0eXBlXS5zbGljZSgpO1xuICByZXR1cm4gcmV0O1xufTtcblxuRXZlbnRFbWl0dGVyLmxpc3RlbmVyQ291bnQgPSBmdW5jdGlvbihlbWl0dGVyLCB0eXBlKSB7XG4gIHZhciByZXQ7XG4gIGlmICghZW1pdHRlci5fZXZlbnRzIHx8ICFlbWl0dGVyLl9ldmVudHNbdHlwZV0pXG4gICAgcmV0ID0gMDtcbiAgZWxzZSBpZiAoaXNGdW5jdGlvbihlbWl0dGVyLl9ldmVudHNbdHlwZV0pKVxuICAgIHJldCA9IDE7XG4gIGVsc2VcbiAgICByZXQgPSBlbWl0dGVyLl9ldmVudHNbdHlwZV0ubGVuZ3RoO1xuICByZXR1cm4gcmV0O1xufTtcblxuZnVuY3Rpb24gaXNGdW5jdGlvbihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdmdW5jdGlvbic7XG59XG5cbmZ1bmN0aW9uIGlzTnVtYmVyKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ251bWJlcic7XG59XG5cbmZ1bmN0aW9uIGlzT2JqZWN0KGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ29iamVjdCcgJiYgYXJnICE9PSBudWxsO1xufVxuXG5mdW5jdGlvbiBpc1VuZGVmaW5lZChhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PT0gdm9pZCAwO1xufVxuIiwiaWYgKHR5cGVvZiBPYmplY3QuY3JlYXRlID09PSAnZnVuY3Rpb24nKSB7XG4gIC8vIGltcGxlbWVudGF0aW9uIGZyb20gc3RhbmRhcmQgbm9kZS5qcyAndXRpbCcgbW9kdWxlXG4gIG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaW5oZXJpdHMoY3Rvciwgc3VwZXJDdG9yKSB7XG4gICAgY3Rvci5zdXBlcl8gPSBzdXBlckN0b3JcbiAgICBjdG9yLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoc3VwZXJDdG9yLnByb3RvdHlwZSwge1xuICAgICAgY29uc3RydWN0b3I6IHtcbiAgICAgICAgdmFsdWU6IGN0b3IsXG4gICAgICAgIGVudW1lcmFibGU6IGZhbHNlLFxuICAgICAgICB3cml0YWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgICB9XG4gICAgfSk7XG4gIH07XG59IGVsc2Uge1xuICAvLyBvbGQgc2Nob29sIHNoaW0gZm9yIG9sZCBicm93c2Vyc1xuICBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGluaGVyaXRzKGN0b3IsIHN1cGVyQ3Rvcikge1xuICAgIGN0b3Iuc3VwZXJfID0gc3VwZXJDdG9yXG4gICAgdmFyIFRlbXBDdG9yID0gZnVuY3Rpb24gKCkge31cbiAgICBUZW1wQ3Rvci5wcm90b3R5cGUgPSBzdXBlckN0b3IucHJvdG90eXBlXG4gICAgY3Rvci5wcm90b3R5cGUgPSBuZXcgVGVtcEN0b3IoKVxuICAgIGN0b3IucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gY3RvclxuICB9XG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IEFycmF5LmlzQXJyYXkgfHwgZnVuY3Rpb24gKGFycikge1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKGFycikgPT0gJ1tvYmplY3QgQXJyYXldJztcbn07XG4iLCIvLyBzaGltIGZvciB1c2luZyBwcm9jZXNzIGluIGJyb3dzZXJcblxudmFyIHByb2Nlc3MgPSBtb2R1bGUuZXhwb3J0cyA9IHt9O1xudmFyIHF1ZXVlID0gW107XG52YXIgZHJhaW5pbmcgPSBmYWxzZTtcblxuZnVuY3Rpb24gZHJhaW5RdWV1ZSgpIHtcbiAgICBpZiAoZHJhaW5pbmcpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBkcmFpbmluZyA9IHRydWU7XG4gICAgdmFyIGN1cnJlbnRRdWV1ZTtcbiAgICB2YXIgbGVuID0gcXVldWUubGVuZ3RoO1xuICAgIHdoaWxlKGxlbikge1xuICAgICAgICBjdXJyZW50UXVldWUgPSBxdWV1ZTtcbiAgICAgICAgcXVldWUgPSBbXTtcbiAgICAgICAgdmFyIGkgPSAtMTtcbiAgICAgICAgd2hpbGUgKCsraSA8IGxlbikge1xuICAgICAgICAgICAgY3VycmVudFF1ZXVlW2ldKCk7XG4gICAgICAgIH1cbiAgICAgICAgbGVuID0gcXVldWUubGVuZ3RoO1xuICAgIH1cbiAgICBkcmFpbmluZyA9IGZhbHNlO1xufVxucHJvY2Vzcy5uZXh0VGljayA9IGZ1bmN0aW9uIChmdW4pIHtcbiAgICBxdWV1ZS5wdXNoKGZ1bik7XG4gICAgaWYgKCFkcmFpbmluZykge1xuICAgICAgICBzZXRUaW1lb3V0KGRyYWluUXVldWUsIDApO1xuICAgIH1cbn07XG5cbnByb2Nlc3MudGl0bGUgPSAnYnJvd3Nlcic7XG5wcm9jZXNzLmJyb3dzZXIgPSB0cnVlO1xucHJvY2Vzcy5lbnYgPSB7fTtcbnByb2Nlc3MuYXJndiA9IFtdO1xucHJvY2Vzcy52ZXJzaW9uID0gJyc7IC8vIGVtcHR5IHN0cmluZyB0byBhdm9pZCByZWdleHAgaXNzdWVzXG5wcm9jZXNzLnZlcnNpb25zID0ge307XG5cbmZ1bmN0aW9uIG5vb3AoKSB7fVxuXG5wcm9jZXNzLm9uID0gbm9vcDtcbnByb2Nlc3MuYWRkTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5vbmNlID0gbm9vcDtcbnByb2Nlc3Mub2ZmID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVBbGxMaXN0ZW5lcnMgPSBub29wO1xucHJvY2Vzcy5lbWl0ID0gbm9vcDtcblxucHJvY2Vzcy5iaW5kaW5nID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuYmluZGluZyBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xuXG4vLyBUT0RPKHNodHlsbWFuKVxucHJvY2Vzcy5jd2QgPSBmdW5jdGlvbiAoKSB7IHJldHVybiAnLycgfTtcbnByb2Nlc3MuY2hkaXIgPSBmdW5jdGlvbiAoZGlyKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmNoZGlyIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG5wcm9jZXNzLnVtYXNrID0gZnVuY3Rpb24oKSB7IHJldHVybiAwOyB9O1xuIiwibW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKFwiLi9saWIvX3N0cmVhbV9kdXBsZXguanNcIilcbiIsIi8vIENvcHlyaWdodCBKb3llbnQsIEluYy4gYW5kIG90aGVyIE5vZGUgY29udHJpYnV0b3JzLlxuLy9cbi8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhXG4vLyBjb3B5IG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlXG4vLyBcIlNvZnR3YXJlXCIpLCB0byBkZWFsIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmdcbi8vIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCxcbi8vIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXRcbi8vIHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXMgZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZVxuLy8gZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4vL1xuLy8gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWRcbi8vIGluIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuLy9cbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1Ncbi8vIE9SIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0Zcbi8vIE1FUkNIQU5UQUJJTElUWSwgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU5cbi8vIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLFxuLy8gREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SXG4vLyBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSwgT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFXG4vLyBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFIFNPRlRXQVJFLlxuXG4vLyBhIGR1cGxleCBzdHJlYW0gaXMganVzdCBhIHN0cmVhbSB0aGF0IGlzIGJvdGggcmVhZGFibGUgYW5kIHdyaXRhYmxlLlxuLy8gU2luY2UgSlMgZG9lc24ndCBoYXZlIG11bHRpcGxlIHByb3RvdHlwYWwgaW5oZXJpdGFuY2UsIHRoaXMgY2xhc3Ncbi8vIHByb3RvdHlwYWxseSBpbmhlcml0cyBmcm9tIFJlYWRhYmxlLCBhbmQgdGhlbiBwYXJhc2l0aWNhbGx5IGZyb21cbi8vIFdyaXRhYmxlLlxuXG5tb2R1bGUuZXhwb3J0cyA9IER1cGxleDtcblxuLyo8cmVwbGFjZW1lbnQ+Ki9cbnZhciBvYmplY3RLZXlzID0gT2JqZWN0LmtleXMgfHwgZnVuY3Rpb24gKG9iaikge1xuICB2YXIga2V5cyA9IFtdO1xuICBmb3IgKHZhciBrZXkgaW4gb2JqKSBrZXlzLnB1c2goa2V5KTtcbiAgcmV0dXJuIGtleXM7XG59XG4vKjwvcmVwbGFjZW1lbnQ+Ki9cblxuXG4vKjxyZXBsYWNlbWVudD4qL1xudmFyIHV0aWwgPSByZXF1aXJlKCdjb3JlLXV0aWwtaXMnKTtcbnV0aWwuaW5oZXJpdHMgPSByZXF1aXJlKCdpbmhlcml0cycpO1xuLyo8L3JlcGxhY2VtZW50PiovXG5cbnZhciBSZWFkYWJsZSA9IHJlcXVpcmUoJy4vX3N0cmVhbV9yZWFkYWJsZScpO1xudmFyIFdyaXRhYmxlID0gcmVxdWlyZSgnLi9fc3RyZWFtX3dyaXRhYmxlJyk7XG5cbnV0aWwuaW5oZXJpdHMoRHVwbGV4LCBSZWFkYWJsZSk7XG5cbmZvckVhY2gob2JqZWN0S2V5cyhXcml0YWJsZS5wcm90b3R5cGUpLCBmdW5jdGlvbihtZXRob2QpIHtcbiAgaWYgKCFEdXBsZXgucHJvdG90eXBlW21ldGhvZF0pXG4gICAgRHVwbGV4LnByb3RvdHlwZVttZXRob2RdID0gV3JpdGFibGUucHJvdG90eXBlW21ldGhvZF07XG59KTtcblxuZnVuY3Rpb24gRHVwbGV4KG9wdGlvbnMpIHtcbiAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIER1cGxleCkpXG4gICAgcmV0dXJuIG5ldyBEdXBsZXgob3B0aW9ucyk7XG5cbiAgUmVhZGFibGUuY2FsbCh0aGlzLCBvcHRpb25zKTtcbiAgV3JpdGFibGUuY2FsbCh0aGlzLCBvcHRpb25zKTtcblxuICBpZiAob3B0aW9ucyAmJiBvcHRpb25zLnJlYWRhYmxlID09PSBmYWxzZSlcbiAgICB0aGlzLnJlYWRhYmxlID0gZmFsc2U7XG5cbiAgaWYgKG9wdGlvbnMgJiYgb3B0aW9ucy53cml0YWJsZSA9PT0gZmFsc2UpXG4gICAgdGhpcy53cml0YWJsZSA9IGZhbHNlO1xuXG4gIHRoaXMuYWxsb3dIYWxmT3BlbiA9IHRydWU7XG4gIGlmIChvcHRpb25zICYmIG9wdGlvbnMuYWxsb3dIYWxmT3BlbiA9PT0gZmFsc2UpXG4gICAgdGhpcy5hbGxvd0hhbGZPcGVuID0gZmFsc2U7XG5cbiAgdGhpcy5vbmNlKCdlbmQnLCBvbmVuZCk7XG59XG5cbi8vIHRoZSBuby1oYWxmLW9wZW4gZW5mb3JjZXJcbmZ1bmN0aW9uIG9uZW5kKCkge1xuICAvLyBpZiB3ZSBhbGxvdyBoYWxmLW9wZW4gc3RhdGUsIG9yIGlmIHRoZSB3cml0YWJsZSBzaWRlIGVuZGVkLFxuICAvLyB0aGVuIHdlJ3JlIG9rLlxuICBpZiAodGhpcy5hbGxvd0hhbGZPcGVuIHx8IHRoaXMuX3dyaXRhYmxlU3RhdGUuZW5kZWQpXG4gICAgcmV0dXJuO1xuXG4gIC8vIG5vIG1vcmUgZGF0YSBjYW4gYmUgd3JpdHRlbi5cbiAgLy8gQnV0IGFsbG93IG1vcmUgd3JpdGVzIHRvIGhhcHBlbiBpbiB0aGlzIHRpY2suXG4gIHByb2Nlc3MubmV4dFRpY2sodGhpcy5lbmQuYmluZCh0aGlzKSk7XG59XG5cbmZ1bmN0aW9uIGZvckVhY2ggKHhzLCBmKSB7XG4gIGZvciAodmFyIGkgPSAwLCBsID0geHMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgZih4c1tpXSwgaSk7XG4gIH1cbn1cbiIsIi8vIENvcHlyaWdodCBKb3llbnQsIEluYy4gYW5kIG90aGVyIE5vZGUgY29udHJpYnV0b3JzLlxuLy9cbi8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhXG4vLyBjb3B5IG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlXG4vLyBcIlNvZnR3YXJlXCIpLCB0byBkZWFsIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmdcbi8vIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCxcbi8vIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXRcbi8vIHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXMgZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZVxuLy8gZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4vL1xuLy8gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWRcbi8vIGluIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuLy9cbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1Ncbi8vIE9SIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0Zcbi8vIE1FUkNIQU5UQUJJTElUWSwgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU5cbi8vIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLFxuLy8gREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SXG4vLyBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSwgT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFXG4vLyBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFIFNPRlRXQVJFLlxuXG4vLyBhIHBhc3N0aHJvdWdoIHN0cmVhbS5cbi8vIGJhc2ljYWxseSBqdXN0IHRoZSBtb3N0IG1pbmltYWwgc29ydCBvZiBUcmFuc2Zvcm0gc3RyZWFtLlxuLy8gRXZlcnkgd3JpdHRlbiBjaHVuayBnZXRzIG91dHB1dCBhcy1pcy5cblxubW9kdWxlLmV4cG9ydHMgPSBQYXNzVGhyb3VnaDtcblxudmFyIFRyYW5zZm9ybSA9IHJlcXVpcmUoJy4vX3N0cmVhbV90cmFuc2Zvcm0nKTtcblxuLyo8cmVwbGFjZW1lbnQ+Ki9cbnZhciB1dGlsID0gcmVxdWlyZSgnY29yZS11dGlsLWlzJyk7XG51dGlsLmluaGVyaXRzID0gcmVxdWlyZSgnaW5oZXJpdHMnKTtcbi8qPC9yZXBsYWNlbWVudD4qL1xuXG51dGlsLmluaGVyaXRzKFBhc3NUaHJvdWdoLCBUcmFuc2Zvcm0pO1xuXG5mdW5jdGlvbiBQYXNzVGhyb3VnaChvcHRpb25zKSB7XG4gIGlmICghKHRoaXMgaW5zdGFuY2VvZiBQYXNzVGhyb3VnaCkpXG4gICAgcmV0dXJuIG5ldyBQYXNzVGhyb3VnaChvcHRpb25zKTtcblxuICBUcmFuc2Zvcm0uY2FsbCh0aGlzLCBvcHRpb25zKTtcbn1cblxuUGFzc1Rocm91Z2gucHJvdG90eXBlLl90cmFuc2Zvcm0gPSBmdW5jdGlvbihjaHVuaywgZW5jb2RpbmcsIGNiKSB7XG4gIGNiKG51bGwsIGNodW5rKTtcbn07XG4iLCIvLyBDb3B5cmlnaHQgSm95ZW50LCBJbmMuIGFuZCBvdGhlciBOb2RlIGNvbnRyaWJ1dG9ycy5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYVxuLy8gY29weSBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZVxuLy8gXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nXG4vLyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsXG4vLyBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0XG4vLyBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGVcbi8vIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkXG4vLyBpbiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTXG4vLyBPUiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GXG4vLyBNRVJDSEFOVEFCSUxJVFksIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOXG4vLyBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSxcbi8vIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUlxuLy8gT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRVxuLy8gVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cblxubW9kdWxlLmV4cG9ydHMgPSBSZWFkYWJsZTtcblxuLyo8cmVwbGFjZW1lbnQ+Ki9cbnZhciBpc0FycmF5ID0gcmVxdWlyZSgnaXNhcnJheScpO1xuLyo8L3JlcGxhY2VtZW50PiovXG5cblxuLyo8cmVwbGFjZW1lbnQ+Ki9cbnZhciBCdWZmZXIgPSByZXF1aXJlKCdidWZmZXInKS5CdWZmZXI7XG4vKjwvcmVwbGFjZW1lbnQ+Ki9cblxuUmVhZGFibGUuUmVhZGFibGVTdGF0ZSA9IFJlYWRhYmxlU3RhdGU7XG5cbnZhciBFRSA9IHJlcXVpcmUoJ2V2ZW50cycpLkV2ZW50RW1pdHRlcjtcblxuLyo8cmVwbGFjZW1lbnQ+Ki9cbmlmICghRUUubGlzdGVuZXJDb3VudCkgRUUubGlzdGVuZXJDb3VudCA9IGZ1bmN0aW9uKGVtaXR0ZXIsIHR5cGUpIHtcbiAgcmV0dXJuIGVtaXR0ZXIubGlzdGVuZXJzKHR5cGUpLmxlbmd0aDtcbn07XG4vKjwvcmVwbGFjZW1lbnQ+Ki9cblxudmFyIFN0cmVhbSA9IHJlcXVpcmUoJ3N0cmVhbScpO1xuXG4vKjxyZXBsYWNlbWVudD4qL1xudmFyIHV0aWwgPSByZXF1aXJlKCdjb3JlLXV0aWwtaXMnKTtcbnV0aWwuaW5oZXJpdHMgPSByZXF1aXJlKCdpbmhlcml0cycpO1xuLyo8L3JlcGxhY2VtZW50PiovXG5cbnZhciBTdHJpbmdEZWNvZGVyO1xuXG5cbi8qPHJlcGxhY2VtZW50PiovXG52YXIgZGVidWcgPSByZXF1aXJlKCd1dGlsJyk7XG5pZiAoZGVidWcgJiYgZGVidWcuZGVidWdsb2cpIHtcbiAgZGVidWcgPSBkZWJ1Zy5kZWJ1Z2xvZygnc3RyZWFtJyk7XG59IGVsc2Uge1xuICBkZWJ1ZyA9IGZ1bmN0aW9uICgpIHt9O1xufVxuLyo8L3JlcGxhY2VtZW50PiovXG5cblxudXRpbC5pbmhlcml0cyhSZWFkYWJsZSwgU3RyZWFtKTtcblxuZnVuY3Rpb24gUmVhZGFibGVTdGF0ZShvcHRpb25zLCBzdHJlYW0pIHtcbiAgdmFyIER1cGxleCA9IHJlcXVpcmUoJy4vX3N0cmVhbV9kdXBsZXgnKTtcblxuICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblxuICAvLyB0aGUgcG9pbnQgYXQgd2hpY2ggaXQgc3RvcHMgY2FsbGluZyBfcmVhZCgpIHRvIGZpbGwgdGhlIGJ1ZmZlclxuICAvLyBOb3RlOiAwIGlzIGEgdmFsaWQgdmFsdWUsIG1lYW5zIFwiZG9uJ3QgY2FsbCBfcmVhZCBwcmVlbXB0aXZlbHkgZXZlclwiXG4gIHZhciBod20gPSBvcHRpb25zLmhpZ2hXYXRlck1hcms7XG4gIHZhciBkZWZhdWx0SHdtID0gb3B0aW9ucy5vYmplY3RNb2RlID8gMTYgOiAxNiAqIDEwMjQ7XG4gIHRoaXMuaGlnaFdhdGVyTWFyayA9IChod20gfHwgaHdtID09PSAwKSA/IGh3bSA6IGRlZmF1bHRId207XG5cbiAgLy8gY2FzdCB0byBpbnRzLlxuICB0aGlzLmhpZ2hXYXRlck1hcmsgPSB+fnRoaXMuaGlnaFdhdGVyTWFyaztcblxuICB0aGlzLmJ1ZmZlciA9IFtdO1xuICB0aGlzLmxlbmd0aCA9IDA7XG4gIHRoaXMucGlwZXMgPSBudWxsO1xuICB0aGlzLnBpcGVzQ291bnQgPSAwO1xuICB0aGlzLmZsb3dpbmcgPSBudWxsO1xuICB0aGlzLmVuZGVkID0gZmFsc2U7XG4gIHRoaXMuZW5kRW1pdHRlZCA9IGZhbHNlO1xuICB0aGlzLnJlYWRpbmcgPSBmYWxzZTtcblxuICAvLyBhIGZsYWcgdG8gYmUgYWJsZSB0byB0ZWxsIGlmIHRoZSBvbndyaXRlIGNiIGlzIGNhbGxlZCBpbW1lZGlhdGVseSxcbiAgLy8gb3Igb24gYSBsYXRlciB0aWNrLiAgV2Ugc2V0IHRoaXMgdG8gdHJ1ZSBhdCBmaXJzdCwgYmVjYXVzZSBhbnlcbiAgLy8gYWN0aW9ucyB0aGF0IHNob3VsZG4ndCBoYXBwZW4gdW50aWwgXCJsYXRlclwiIHNob3VsZCBnZW5lcmFsbHkgYWxzb1xuICAvLyBub3QgaGFwcGVuIGJlZm9yZSB0aGUgZmlyc3Qgd3JpdGUgY2FsbC5cbiAgdGhpcy5zeW5jID0gdHJ1ZTtcblxuICAvLyB3aGVuZXZlciB3ZSByZXR1cm4gbnVsbCwgdGhlbiB3ZSBzZXQgYSBmbGFnIHRvIHNheVxuICAvLyB0aGF0IHdlJ3JlIGF3YWl0aW5nIGEgJ3JlYWRhYmxlJyBldmVudCBlbWlzc2lvbi5cbiAgdGhpcy5uZWVkUmVhZGFibGUgPSBmYWxzZTtcbiAgdGhpcy5lbWl0dGVkUmVhZGFibGUgPSBmYWxzZTtcbiAgdGhpcy5yZWFkYWJsZUxpc3RlbmluZyA9IGZhbHNlO1xuXG5cbiAgLy8gb2JqZWN0IHN0cmVhbSBmbGFnLiBVc2VkIHRvIG1ha2UgcmVhZChuKSBpZ25vcmUgbiBhbmQgdG9cbiAgLy8gbWFrZSBhbGwgdGhlIGJ1ZmZlciBtZXJnaW5nIGFuZCBsZW5ndGggY2hlY2tzIGdvIGF3YXlcbiAgdGhpcy5vYmplY3RNb2RlID0gISFvcHRpb25zLm9iamVjdE1vZGU7XG5cbiAgaWYgKHN0cmVhbSBpbnN0YW5jZW9mIER1cGxleClcbiAgICB0aGlzLm9iamVjdE1vZGUgPSB0aGlzLm9iamVjdE1vZGUgfHwgISFvcHRpb25zLnJlYWRhYmxlT2JqZWN0TW9kZTtcblxuICAvLyBDcnlwdG8gaXMga2luZCBvZiBvbGQgYW5kIGNydXN0eS4gIEhpc3RvcmljYWxseSwgaXRzIGRlZmF1bHQgc3RyaW5nXG4gIC8vIGVuY29kaW5nIGlzICdiaW5hcnknIHNvIHdlIGhhdmUgdG8gbWFrZSB0aGlzIGNvbmZpZ3VyYWJsZS5cbiAgLy8gRXZlcnl0aGluZyBlbHNlIGluIHRoZSB1bml2ZXJzZSB1c2VzICd1dGY4JywgdGhvdWdoLlxuICB0aGlzLmRlZmF1bHRFbmNvZGluZyA9IG9wdGlvbnMuZGVmYXVsdEVuY29kaW5nIHx8ICd1dGY4JztcblxuICAvLyB3aGVuIHBpcGluZywgd2Ugb25seSBjYXJlIGFib3V0ICdyZWFkYWJsZScgZXZlbnRzIHRoYXQgaGFwcGVuXG4gIC8vIGFmdGVyIHJlYWQoKWluZyBhbGwgdGhlIGJ5dGVzIGFuZCBub3QgZ2V0dGluZyBhbnkgcHVzaGJhY2suXG4gIHRoaXMucmFuT3V0ID0gZmFsc2U7XG5cbiAgLy8gdGhlIG51bWJlciBvZiB3cml0ZXJzIHRoYXQgYXJlIGF3YWl0aW5nIGEgZHJhaW4gZXZlbnQgaW4gLnBpcGUoKXNcbiAgdGhpcy5hd2FpdERyYWluID0gMDtcblxuICAvLyBpZiB0cnVlLCBhIG1heWJlUmVhZE1vcmUgaGFzIGJlZW4gc2NoZWR1bGVkXG4gIHRoaXMucmVhZGluZ01vcmUgPSBmYWxzZTtcblxuICB0aGlzLmRlY29kZXIgPSBudWxsO1xuICB0aGlzLmVuY29kaW5nID0gbnVsbDtcbiAgaWYgKG9wdGlvbnMuZW5jb2RpbmcpIHtcbiAgICBpZiAoIVN0cmluZ0RlY29kZXIpXG4gICAgICBTdHJpbmdEZWNvZGVyID0gcmVxdWlyZSgnc3RyaW5nX2RlY29kZXIvJykuU3RyaW5nRGVjb2RlcjtcbiAgICB0aGlzLmRlY29kZXIgPSBuZXcgU3RyaW5nRGVjb2RlcihvcHRpb25zLmVuY29kaW5nKTtcbiAgICB0aGlzLmVuY29kaW5nID0gb3B0aW9ucy5lbmNvZGluZztcbiAgfVxufVxuXG5mdW5jdGlvbiBSZWFkYWJsZShvcHRpb25zKSB7XG4gIHZhciBEdXBsZXggPSByZXF1aXJlKCcuL19zdHJlYW1fZHVwbGV4Jyk7XG5cbiAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIFJlYWRhYmxlKSlcbiAgICByZXR1cm4gbmV3IFJlYWRhYmxlKG9wdGlvbnMpO1xuXG4gIHRoaXMuX3JlYWRhYmxlU3RhdGUgPSBuZXcgUmVhZGFibGVTdGF0ZShvcHRpb25zLCB0aGlzKTtcblxuICAvLyBsZWdhY3lcbiAgdGhpcy5yZWFkYWJsZSA9IHRydWU7XG5cbiAgU3RyZWFtLmNhbGwodGhpcyk7XG59XG5cbi8vIE1hbnVhbGx5IHNob3ZlIHNvbWV0aGluZyBpbnRvIHRoZSByZWFkKCkgYnVmZmVyLlxuLy8gVGhpcyByZXR1cm5zIHRydWUgaWYgdGhlIGhpZ2hXYXRlck1hcmsgaGFzIG5vdCBiZWVuIGhpdCB5ZXQsXG4vLyBzaW1pbGFyIHRvIGhvdyBXcml0YWJsZS53cml0ZSgpIHJldHVybnMgdHJ1ZSBpZiB5b3Ugc2hvdWxkXG4vLyB3cml0ZSgpIHNvbWUgbW9yZS5cblJlYWRhYmxlLnByb3RvdHlwZS5wdXNoID0gZnVuY3Rpb24oY2h1bmssIGVuY29kaW5nKSB7XG4gIHZhciBzdGF0ZSA9IHRoaXMuX3JlYWRhYmxlU3RhdGU7XG5cbiAgaWYgKHV0aWwuaXNTdHJpbmcoY2h1bmspICYmICFzdGF0ZS5vYmplY3RNb2RlKSB7XG4gICAgZW5jb2RpbmcgPSBlbmNvZGluZyB8fCBzdGF0ZS5kZWZhdWx0RW5jb2Rpbmc7XG4gICAgaWYgKGVuY29kaW5nICE9PSBzdGF0ZS5lbmNvZGluZykge1xuICAgICAgY2h1bmsgPSBuZXcgQnVmZmVyKGNodW5rLCBlbmNvZGluZyk7XG4gICAgICBlbmNvZGluZyA9ICcnO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiByZWFkYWJsZUFkZENodW5rKHRoaXMsIHN0YXRlLCBjaHVuaywgZW5jb2RpbmcsIGZhbHNlKTtcbn07XG5cbi8vIFVuc2hpZnQgc2hvdWxkICphbHdheXMqIGJlIHNvbWV0aGluZyBkaXJlY3RseSBvdXQgb2YgcmVhZCgpXG5SZWFkYWJsZS5wcm90b3R5cGUudW5zaGlmdCA9IGZ1bmN0aW9uKGNodW5rKSB7XG4gIHZhciBzdGF0ZSA9IHRoaXMuX3JlYWRhYmxlU3RhdGU7XG4gIHJldHVybiByZWFkYWJsZUFkZENodW5rKHRoaXMsIHN0YXRlLCBjaHVuaywgJycsIHRydWUpO1xufTtcblxuZnVuY3Rpb24gcmVhZGFibGVBZGRDaHVuayhzdHJlYW0sIHN0YXRlLCBjaHVuaywgZW5jb2RpbmcsIGFkZFRvRnJvbnQpIHtcbiAgdmFyIGVyID0gY2h1bmtJbnZhbGlkKHN0YXRlLCBjaHVuayk7XG4gIGlmIChlcikge1xuICAgIHN0cmVhbS5lbWl0KCdlcnJvcicsIGVyKTtcbiAgfSBlbHNlIGlmICh1dGlsLmlzTnVsbE9yVW5kZWZpbmVkKGNodW5rKSkge1xuICAgIHN0YXRlLnJlYWRpbmcgPSBmYWxzZTtcbiAgICBpZiAoIXN0YXRlLmVuZGVkKVxuICAgICAgb25Fb2ZDaHVuayhzdHJlYW0sIHN0YXRlKTtcbiAgfSBlbHNlIGlmIChzdGF0ZS5vYmplY3RNb2RlIHx8IGNodW5rICYmIGNodW5rLmxlbmd0aCA+IDApIHtcbiAgICBpZiAoc3RhdGUuZW5kZWQgJiYgIWFkZFRvRnJvbnQpIHtcbiAgICAgIHZhciBlID0gbmV3IEVycm9yKCdzdHJlYW0ucHVzaCgpIGFmdGVyIEVPRicpO1xuICAgICAgc3RyZWFtLmVtaXQoJ2Vycm9yJywgZSk7XG4gICAgfSBlbHNlIGlmIChzdGF0ZS5lbmRFbWl0dGVkICYmIGFkZFRvRnJvbnQpIHtcbiAgICAgIHZhciBlID0gbmV3IEVycm9yKCdzdHJlYW0udW5zaGlmdCgpIGFmdGVyIGVuZCBldmVudCcpO1xuICAgICAgc3RyZWFtLmVtaXQoJ2Vycm9yJywgZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChzdGF0ZS5kZWNvZGVyICYmICFhZGRUb0Zyb250ICYmICFlbmNvZGluZylcbiAgICAgICAgY2h1bmsgPSBzdGF0ZS5kZWNvZGVyLndyaXRlKGNodW5rKTtcblxuICAgICAgaWYgKCFhZGRUb0Zyb250KVxuICAgICAgICBzdGF0ZS5yZWFkaW5nID0gZmFsc2U7XG5cbiAgICAgIC8vIGlmIHdlIHdhbnQgdGhlIGRhdGEgbm93LCBqdXN0IGVtaXQgaXQuXG4gICAgICBpZiAoc3RhdGUuZmxvd2luZyAmJiBzdGF0ZS5sZW5ndGggPT09IDAgJiYgIXN0YXRlLnN5bmMpIHtcbiAgICAgICAgc3RyZWFtLmVtaXQoJ2RhdGEnLCBjaHVuayk7XG4gICAgICAgIHN0cmVhbS5yZWFkKDApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gdXBkYXRlIHRoZSBidWZmZXIgaW5mby5cbiAgICAgICAgc3RhdGUubGVuZ3RoICs9IHN0YXRlLm9iamVjdE1vZGUgPyAxIDogY2h1bmsubGVuZ3RoO1xuICAgICAgICBpZiAoYWRkVG9Gcm9udClcbiAgICAgICAgICBzdGF0ZS5idWZmZXIudW5zaGlmdChjaHVuayk7XG4gICAgICAgIGVsc2VcbiAgICAgICAgICBzdGF0ZS5idWZmZXIucHVzaChjaHVuayk7XG5cbiAgICAgICAgaWYgKHN0YXRlLm5lZWRSZWFkYWJsZSlcbiAgICAgICAgICBlbWl0UmVhZGFibGUoc3RyZWFtKTtcbiAgICAgIH1cblxuICAgICAgbWF5YmVSZWFkTW9yZShzdHJlYW0sIHN0YXRlKTtcbiAgICB9XG4gIH0gZWxzZSBpZiAoIWFkZFRvRnJvbnQpIHtcbiAgICBzdGF0ZS5yZWFkaW5nID0gZmFsc2U7XG4gIH1cblxuICByZXR1cm4gbmVlZE1vcmVEYXRhKHN0YXRlKTtcbn1cblxuXG5cbi8vIGlmIGl0J3MgcGFzdCB0aGUgaGlnaCB3YXRlciBtYXJrLCB3ZSBjYW4gcHVzaCBpbiBzb21lIG1vcmUuXG4vLyBBbHNvLCBpZiB3ZSBoYXZlIG5vIGRhdGEgeWV0LCB3ZSBjYW4gc3RhbmQgc29tZVxuLy8gbW9yZSBieXRlcy4gIFRoaXMgaXMgdG8gd29yayBhcm91bmQgY2FzZXMgd2hlcmUgaHdtPTAsXG4vLyBzdWNoIGFzIHRoZSByZXBsLiAgQWxzbywgaWYgdGhlIHB1c2goKSB0cmlnZ2VyZWQgYVxuLy8gcmVhZGFibGUgZXZlbnQsIGFuZCB0aGUgdXNlciBjYWxsZWQgcmVhZChsYXJnZU51bWJlcikgc3VjaCB0aGF0XG4vLyBuZWVkUmVhZGFibGUgd2FzIHNldCwgdGhlbiB3ZSBvdWdodCB0byBwdXNoIG1vcmUsIHNvIHRoYXQgYW5vdGhlclxuLy8gJ3JlYWRhYmxlJyBldmVudCB3aWxsIGJlIHRyaWdnZXJlZC5cbmZ1bmN0aW9uIG5lZWRNb3JlRGF0YShzdGF0ZSkge1xuICByZXR1cm4gIXN0YXRlLmVuZGVkICYmXG4gICAgICAgICAoc3RhdGUubmVlZFJlYWRhYmxlIHx8XG4gICAgICAgICAgc3RhdGUubGVuZ3RoIDwgc3RhdGUuaGlnaFdhdGVyTWFyayB8fFxuICAgICAgICAgIHN0YXRlLmxlbmd0aCA9PT0gMCk7XG59XG5cbi8vIGJhY2t3YXJkcyBjb21wYXRpYmlsaXR5LlxuUmVhZGFibGUucHJvdG90eXBlLnNldEVuY29kaW5nID0gZnVuY3Rpb24oZW5jKSB7XG4gIGlmICghU3RyaW5nRGVjb2RlcilcbiAgICBTdHJpbmdEZWNvZGVyID0gcmVxdWlyZSgnc3RyaW5nX2RlY29kZXIvJykuU3RyaW5nRGVjb2RlcjtcbiAgdGhpcy5fcmVhZGFibGVTdGF0ZS5kZWNvZGVyID0gbmV3IFN0cmluZ0RlY29kZXIoZW5jKTtcbiAgdGhpcy5fcmVhZGFibGVTdGF0ZS5lbmNvZGluZyA9IGVuYztcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vLyBEb24ndCByYWlzZSB0aGUgaHdtID4gMTI4TUJcbnZhciBNQVhfSFdNID0gMHg4MDAwMDA7XG5mdW5jdGlvbiByb3VuZFVwVG9OZXh0UG93ZXJPZjIobikge1xuICBpZiAobiA+PSBNQVhfSFdNKSB7XG4gICAgbiA9IE1BWF9IV007XG4gIH0gZWxzZSB7XG4gICAgLy8gR2V0IHRoZSBuZXh0IGhpZ2hlc3QgcG93ZXIgb2YgMlxuICAgIG4tLTtcbiAgICBmb3IgKHZhciBwID0gMTsgcCA8IDMyOyBwIDw8PSAxKSBuIHw9IG4gPj4gcDtcbiAgICBuKys7XG4gIH1cbiAgcmV0dXJuIG47XG59XG5cbmZ1bmN0aW9uIGhvd011Y2hUb1JlYWQobiwgc3RhdGUpIHtcbiAgaWYgKHN0YXRlLmxlbmd0aCA9PT0gMCAmJiBzdGF0ZS5lbmRlZClcbiAgICByZXR1cm4gMDtcblxuICBpZiAoc3RhdGUub2JqZWN0TW9kZSlcbiAgICByZXR1cm4gbiA9PT0gMCA/IDAgOiAxO1xuXG4gIGlmIChpc05hTihuKSB8fCB1dGlsLmlzTnVsbChuKSkge1xuICAgIC8vIG9ubHkgZmxvdyBvbmUgYnVmZmVyIGF0IGEgdGltZVxuICAgIGlmIChzdGF0ZS5mbG93aW5nICYmIHN0YXRlLmJ1ZmZlci5sZW5ndGgpXG4gICAgICByZXR1cm4gc3RhdGUuYnVmZmVyWzBdLmxlbmd0aDtcbiAgICBlbHNlXG4gICAgICByZXR1cm4gc3RhdGUubGVuZ3RoO1xuICB9XG5cbiAgaWYgKG4gPD0gMClcbiAgICByZXR1cm4gMDtcblxuICAvLyBJZiB3ZSdyZSBhc2tpbmcgZm9yIG1vcmUgdGhhbiB0aGUgdGFyZ2V0IGJ1ZmZlciBsZXZlbCxcbiAgLy8gdGhlbiByYWlzZSB0aGUgd2F0ZXIgbWFyay4gIEJ1bXAgdXAgdG8gdGhlIG5leHQgaGlnaGVzdFxuICAvLyBwb3dlciBvZiAyLCB0byBwcmV2ZW50IGluY3JlYXNpbmcgaXQgZXhjZXNzaXZlbHkgaW4gdGlueVxuICAvLyBhbW91bnRzLlxuICBpZiAobiA+IHN0YXRlLmhpZ2hXYXRlck1hcmspXG4gICAgc3RhdGUuaGlnaFdhdGVyTWFyayA9IHJvdW5kVXBUb05leHRQb3dlck9mMihuKTtcblxuICAvLyBkb24ndCBoYXZlIHRoYXQgbXVjaC4gIHJldHVybiBudWxsLCB1bmxlc3Mgd2UndmUgZW5kZWQuXG4gIGlmIChuID4gc3RhdGUubGVuZ3RoKSB7XG4gICAgaWYgKCFzdGF0ZS5lbmRlZCkge1xuICAgICAgc3RhdGUubmVlZFJlYWRhYmxlID0gdHJ1ZTtcbiAgICAgIHJldHVybiAwO1xuICAgIH0gZWxzZVxuICAgICAgcmV0dXJuIHN0YXRlLmxlbmd0aDtcbiAgfVxuXG4gIHJldHVybiBuO1xufVxuXG4vLyB5b3UgY2FuIG92ZXJyaWRlIGVpdGhlciB0aGlzIG1ldGhvZCwgb3IgdGhlIGFzeW5jIF9yZWFkKG4pIGJlbG93LlxuUmVhZGFibGUucHJvdG90eXBlLnJlYWQgPSBmdW5jdGlvbihuKSB7XG4gIGRlYnVnKCdyZWFkJywgbik7XG4gIHZhciBzdGF0ZSA9IHRoaXMuX3JlYWRhYmxlU3RhdGU7XG4gIHZhciBuT3JpZyA9IG47XG5cbiAgaWYgKCF1dGlsLmlzTnVtYmVyKG4pIHx8IG4gPiAwKVxuICAgIHN0YXRlLmVtaXR0ZWRSZWFkYWJsZSA9IGZhbHNlO1xuXG4gIC8vIGlmIHdlJ3JlIGRvaW5nIHJlYWQoMCkgdG8gdHJpZ2dlciBhIHJlYWRhYmxlIGV2ZW50LCBidXQgd2VcbiAgLy8gYWxyZWFkeSBoYXZlIGEgYnVuY2ggb2YgZGF0YSBpbiB0aGUgYnVmZmVyLCB0aGVuIGp1c3QgdHJpZ2dlclxuICAvLyB0aGUgJ3JlYWRhYmxlJyBldmVudCBhbmQgbW92ZSBvbi5cbiAgaWYgKG4gPT09IDAgJiZcbiAgICAgIHN0YXRlLm5lZWRSZWFkYWJsZSAmJlxuICAgICAgKHN0YXRlLmxlbmd0aCA+PSBzdGF0ZS5oaWdoV2F0ZXJNYXJrIHx8IHN0YXRlLmVuZGVkKSkge1xuICAgIGRlYnVnKCdyZWFkOiBlbWl0UmVhZGFibGUnLCBzdGF0ZS5sZW5ndGgsIHN0YXRlLmVuZGVkKTtcbiAgICBpZiAoc3RhdGUubGVuZ3RoID09PSAwICYmIHN0YXRlLmVuZGVkKVxuICAgICAgZW5kUmVhZGFibGUodGhpcyk7XG4gICAgZWxzZVxuICAgICAgZW1pdFJlYWRhYmxlKHRoaXMpO1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgbiA9IGhvd011Y2hUb1JlYWQobiwgc3RhdGUpO1xuXG4gIC8vIGlmIHdlJ3ZlIGVuZGVkLCBhbmQgd2UncmUgbm93IGNsZWFyLCB0aGVuIGZpbmlzaCBpdCB1cC5cbiAgaWYgKG4gPT09IDAgJiYgc3RhdGUuZW5kZWQpIHtcbiAgICBpZiAoc3RhdGUubGVuZ3RoID09PSAwKVxuICAgICAgZW5kUmVhZGFibGUodGhpcyk7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICAvLyBBbGwgdGhlIGFjdHVhbCBjaHVuayBnZW5lcmF0aW9uIGxvZ2ljIG5lZWRzIHRvIGJlXG4gIC8vICpiZWxvdyogdGhlIGNhbGwgdG8gX3JlYWQuICBUaGUgcmVhc29uIGlzIHRoYXQgaW4gY2VydGFpblxuICAvLyBzeW50aGV0aWMgc3RyZWFtIGNhc2VzLCBzdWNoIGFzIHBhc3N0aHJvdWdoIHN0cmVhbXMsIF9yZWFkXG4gIC8vIG1heSBiZSBhIGNvbXBsZXRlbHkgc3luY2hyb25vdXMgb3BlcmF0aW9uIHdoaWNoIG1heSBjaGFuZ2VcbiAgLy8gdGhlIHN0YXRlIG9mIHRoZSByZWFkIGJ1ZmZlciwgcHJvdmlkaW5nIGVub3VnaCBkYXRhIHdoZW5cbiAgLy8gYmVmb3JlIHRoZXJlIHdhcyAqbm90KiBlbm91Z2guXG4gIC8vXG4gIC8vIFNvLCB0aGUgc3RlcHMgYXJlOlxuICAvLyAxLiBGaWd1cmUgb3V0IHdoYXQgdGhlIHN0YXRlIG9mIHRoaW5ncyB3aWxsIGJlIGFmdGVyIHdlIGRvXG4gIC8vIGEgcmVhZCBmcm9tIHRoZSBidWZmZXIuXG4gIC8vXG4gIC8vIDIuIElmIHRoYXQgcmVzdWx0aW5nIHN0YXRlIHdpbGwgdHJpZ2dlciBhIF9yZWFkLCB0aGVuIGNhbGwgX3JlYWQuXG4gIC8vIE5vdGUgdGhhdCB0aGlzIG1heSBiZSBhc3luY2hyb25vdXMsIG9yIHN5bmNocm9ub3VzLiAgWWVzLCBpdCBpc1xuICAvLyBkZWVwbHkgdWdseSB0byB3cml0ZSBBUElzIHRoaXMgd2F5LCBidXQgdGhhdCBzdGlsbCBkb2Vzbid0IG1lYW5cbiAgLy8gdGhhdCB0aGUgUmVhZGFibGUgY2xhc3Mgc2hvdWxkIGJlaGF2ZSBpbXByb3Blcmx5LCBhcyBzdHJlYW1zIGFyZVxuICAvLyBkZXNpZ25lZCB0byBiZSBzeW5jL2FzeW5jIGFnbm9zdGljLlxuICAvLyBUYWtlIG5vdGUgaWYgdGhlIF9yZWFkIGNhbGwgaXMgc3luYyBvciBhc3luYyAoaWUsIGlmIHRoZSByZWFkIGNhbGxcbiAgLy8gaGFzIHJldHVybmVkIHlldCksIHNvIHRoYXQgd2Uga25vdyB3aGV0aGVyIG9yIG5vdCBpdCdzIHNhZmUgdG8gZW1pdFxuICAvLyAncmVhZGFibGUnIGV0Yy5cbiAgLy9cbiAgLy8gMy4gQWN0dWFsbHkgcHVsbCB0aGUgcmVxdWVzdGVkIGNodW5rcyBvdXQgb2YgdGhlIGJ1ZmZlciBhbmQgcmV0dXJuLlxuXG4gIC8vIGlmIHdlIG5lZWQgYSByZWFkYWJsZSBldmVudCwgdGhlbiB3ZSBuZWVkIHRvIGRvIHNvbWUgcmVhZGluZy5cbiAgdmFyIGRvUmVhZCA9IHN0YXRlLm5lZWRSZWFkYWJsZTtcbiAgZGVidWcoJ25lZWQgcmVhZGFibGUnLCBkb1JlYWQpO1xuXG4gIC8vIGlmIHdlIGN1cnJlbnRseSBoYXZlIGxlc3MgdGhhbiB0aGUgaGlnaFdhdGVyTWFyaywgdGhlbiBhbHNvIHJlYWQgc29tZVxuICBpZiAoc3RhdGUubGVuZ3RoID09PSAwIHx8IHN0YXRlLmxlbmd0aCAtIG4gPCBzdGF0ZS5oaWdoV2F0ZXJNYXJrKSB7XG4gICAgZG9SZWFkID0gdHJ1ZTtcbiAgICBkZWJ1ZygnbGVuZ3RoIGxlc3MgdGhhbiB3YXRlcm1hcmsnLCBkb1JlYWQpO1xuICB9XG5cbiAgLy8gaG93ZXZlciwgaWYgd2UndmUgZW5kZWQsIHRoZW4gdGhlcmUncyBubyBwb2ludCwgYW5kIGlmIHdlJ3JlIGFscmVhZHlcbiAgLy8gcmVhZGluZywgdGhlbiBpdCdzIHVubmVjZXNzYXJ5LlxuICBpZiAoc3RhdGUuZW5kZWQgfHwgc3RhdGUucmVhZGluZykge1xuICAgIGRvUmVhZCA9IGZhbHNlO1xuICAgIGRlYnVnKCdyZWFkaW5nIG9yIGVuZGVkJywgZG9SZWFkKTtcbiAgfVxuXG4gIGlmIChkb1JlYWQpIHtcbiAgICBkZWJ1ZygnZG8gcmVhZCcpO1xuICAgIHN0YXRlLnJlYWRpbmcgPSB0cnVlO1xuICAgIHN0YXRlLnN5bmMgPSB0cnVlO1xuICAgIC8vIGlmIHRoZSBsZW5ndGggaXMgY3VycmVudGx5IHplcm8sIHRoZW4gd2UgKm5lZWQqIGEgcmVhZGFibGUgZXZlbnQuXG4gICAgaWYgKHN0YXRlLmxlbmd0aCA9PT0gMClcbiAgICAgIHN0YXRlLm5lZWRSZWFkYWJsZSA9IHRydWU7XG4gICAgLy8gY2FsbCBpbnRlcm5hbCByZWFkIG1ldGhvZFxuICAgIHRoaXMuX3JlYWQoc3RhdGUuaGlnaFdhdGVyTWFyayk7XG4gICAgc3RhdGUuc3luYyA9IGZhbHNlO1xuICB9XG5cbiAgLy8gSWYgX3JlYWQgcHVzaGVkIGRhdGEgc3luY2hyb25vdXNseSwgdGhlbiBgcmVhZGluZ2Agd2lsbCBiZSBmYWxzZSxcbiAgLy8gYW5kIHdlIG5lZWQgdG8gcmUtZXZhbHVhdGUgaG93IG11Y2ggZGF0YSB3ZSBjYW4gcmV0dXJuIHRvIHRoZSB1c2VyLlxuICBpZiAoZG9SZWFkICYmICFzdGF0ZS5yZWFkaW5nKVxuICAgIG4gPSBob3dNdWNoVG9SZWFkKG5PcmlnLCBzdGF0ZSk7XG5cbiAgdmFyIHJldDtcbiAgaWYgKG4gPiAwKVxuICAgIHJldCA9IGZyb21MaXN0KG4sIHN0YXRlKTtcbiAgZWxzZVxuICAgIHJldCA9IG51bGw7XG5cbiAgaWYgKHV0aWwuaXNOdWxsKHJldCkpIHtcbiAgICBzdGF0ZS5uZWVkUmVhZGFibGUgPSB0cnVlO1xuICAgIG4gPSAwO1xuICB9XG5cbiAgc3RhdGUubGVuZ3RoIC09IG47XG5cbiAgLy8gSWYgd2UgaGF2ZSBub3RoaW5nIGluIHRoZSBidWZmZXIsIHRoZW4gd2Ugd2FudCB0byBrbm93XG4gIC8vIGFzIHNvb24gYXMgd2UgKmRvKiBnZXQgc29tZXRoaW5nIGludG8gdGhlIGJ1ZmZlci5cbiAgaWYgKHN0YXRlLmxlbmd0aCA9PT0gMCAmJiAhc3RhdGUuZW5kZWQpXG4gICAgc3RhdGUubmVlZFJlYWRhYmxlID0gdHJ1ZTtcblxuICAvLyBJZiB3ZSB0cmllZCB0byByZWFkKCkgcGFzdCB0aGUgRU9GLCB0aGVuIGVtaXQgZW5kIG9uIHRoZSBuZXh0IHRpY2suXG4gIGlmIChuT3JpZyAhPT0gbiAmJiBzdGF0ZS5lbmRlZCAmJiBzdGF0ZS5sZW5ndGggPT09IDApXG4gICAgZW5kUmVhZGFibGUodGhpcyk7XG5cbiAgaWYgKCF1dGlsLmlzTnVsbChyZXQpKVxuICAgIHRoaXMuZW1pdCgnZGF0YScsIHJldCk7XG5cbiAgcmV0dXJuIHJldDtcbn07XG5cbmZ1bmN0aW9uIGNodW5rSW52YWxpZChzdGF0ZSwgY2h1bmspIHtcbiAgdmFyIGVyID0gbnVsbDtcbiAgaWYgKCF1dGlsLmlzQnVmZmVyKGNodW5rKSAmJlxuICAgICAgIXV0aWwuaXNTdHJpbmcoY2h1bmspICYmXG4gICAgICAhdXRpbC5pc051bGxPclVuZGVmaW5lZChjaHVuaykgJiZcbiAgICAgICFzdGF0ZS5vYmplY3RNb2RlKSB7XG4gICAgZXIgPSBuZXcgVHlwZUVycm9yKCdJbnZhbGlkIG5vbi1zdHJpbmcvYnVmZmVyIGNodW5rJyk7XG4gIH1cbiAgcmV0dXJuIGVyO1xufVxuXG5cbmZ1bmN0aW9uIG9uRW9mQ2h1bmsoc3RyZWFtLCBzdGF0ZSkge1xuICBpZiAoc3RhdGUuZGVjb2RlciAmJiAhc3RhdGUuZW5kZWQpIHtcbiAgICB2YXIgY2h1bmsgPSBzdGF0ZS5kZWNvZGVyLmVuZCgpO1xuICAgIGlmIChjaHVuayAmJiBjaHVuay5sZW5ndGgpIHtcbiAgICAgIHN0YXRlLmJ1ZmZlci5wdXNoKGNodW5rKTtcbiAgICAgIHN0YXRlLmxlbmd0aCArPSBzdGF0ZS5vYmplY3RNb2RlID8gMSA6IGNodW5rLmxlbmd0aDtcbiAgICB9XG4gIH1cbiAgc3RhdGUuZW5kZWQgPSB0cnVlO1xuXG4gIC8vIGVtaXQgJ3JlYWRhYmxlJyBub3cgdG8gbWFrZSBzdXJlIGl0IGdldHMgcGlja2VkIHVwLlxuICBlbWl0UmVhZGFibGUoc3RyZWFtKTtcbn1cblxuLy8gRG9uJ3QgZW1pdCByZWFkYWJsZSByaWdodCBhd2F5IGluIHN5bmMgbW9kZSwgYmVjYXVzZSB0aGlzIGNhbiB0cmlnZ2VyXG4vLyBhbm90aGVyIHJlYWQoKSBjYWxsID0+IHN0YWNrIG92ZXJmbG93LiAgVGhpcyB3YXksIGl0IG1pZ2h0IHRyaWdnZXJcbi8vIGEgbmV4dFRpY2sgcmVjdXJzaW9uIHdhcm5pbmcsIGJ1dCB0aGF0J3Mgbm90IHNvIGJhZC5cbmZ1bmN0aW9uIGVtaXRSZWFkYWJsZShzdHJlYW0pIHtcbiAgdmFyIHN0YXRlID0gc3RyZWFtLl9yZWFkYWJsZVN0YXRlO1xuICBzdGF0ZS5uZWVkUmVhZGFibGUgPSBmYWxzZTtcbiAgaWYgKCFzdGF0ZS5lbWl0dGVkUmVhZGFibGUpIHtcbiAgICBkZWJ1ZygnZW1pdFJlYWRhYmxlJywgc3RhdGUuZmxvd2luZyk7XG4gICAgc3RhdGUuZW1pdHRlZFJlYWRhYmxlID0gdHJ1ZTtcbiAgICBpZiAoc3RhdGUuc3luYylcbiAgICAgIHByb2Nlc3MubmV4dFRpY2soZnVuY3Rpb24oKSB7XG4gICAgICAgIGVtaXRSZWFkYWJsZV8oc3RyZWFtKTtcbiAgICAgIH0pO1xuICAgIGVsc2VcbiAgICAgIGVtaXRSZWFkYWJsZV8oc3RyZWFtKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBlbWl0UmVhZGFibGVfKHN0cmVhbSkge1xuICBkZWJ1ZygnZW1pdCByZWFkYWJsZScpO1xuICBzdHJlYW0uZW1pdCgncmVhZGFibGUnKTtcbiAgZmxvdyhzdHJlYW0pO1xufVxuXG5cbi8vIGF0IHRoaXMgcG9pbnQsIHRoZSB1c2VyIGhhcyBwcmVzdW1hYmx5IHNlZW4gdGhlICdyZWFkYWJsZScgZXZlbnQsXG4vLyBhbmQgY2FsbGVkIHJlYWQoKSB0byBjb25zdW1lIHNvbWUgZGF0YS4gIHRoYXQgbWF5IGhhdmUgdHJpZ2dlcmVkXG4vLyBpbiB0dXJuIGFub3RoZXIgX3JlYWQobikgY2FsbCwgaW4gd2hpY2ggY2FzZSByZWFkaW5nID0gdHJ1ZSBpZlxuLy8gaXQncyBpbiBwcm9ncmVzcy5cbi8vIEhvd2V2ZXIsIGlmIHdlJ3JlIG5vdCBlbmRlZCwgb3IgcmVhZGluZywgYW5kIHRoZSBsZW5ndGggPCBod20sXG4vLyB0aGVuIGdvIGFoZWFkIGFuZCB0cnkgdG8gcmVhZCBzb21lIG1vcmUgcHJlZW1wdGl2ZWx5LlxuZnVuY3Rpb24gbWF5YmVSZWFkTW9yZShzdHJlYW0sIHN0YXRlKSB7XG4gIGlmICghc3RhdGUucmVhZGluZ01vcmUpIHtcbiAgICBzdGF0ZS5yZWFkaW5nTW9yZSA9IHRydWU7XG4gICAgcHJvY2Vzcy5uZXh0VGljayhmdW5jdGlvbigpIHtcbiAgICAgIG1heWJlUmVhZE1vcmVfKHN0cmVhbSwgc3RhdGUpO1xuICAgIH0pO1xuICB9XG59XG5cbmZ1bmN0aW9uIG1heWJlUmVhZE1vcmVfKHN0cmVhbSwgc3RhdGUpIHtcbiAgdmFyIGxlbiA9IHN0YXRlLmxlbmd0aDtcbiAgd2hpbGUgKCFzdGF0ZS5yZWFkaW5nICYmICFzdGF0ZS5mbG93aW5nICYmICFzdGF0ZS5lbmRlZCAmJlxuICAgICAgICAgc3RhdGUubGVuZ3RoIDwgc3RhdGUuaGlnaFdhdGVyTWFyaykge1xuICAgIGRlYnVnKCdtYXliZVJlYWRNb3JlIHJlYWQgMCcpO1xuICAgIHN0cmVhbS5yZWFkKDApO1xuICAgIGlmIChsZW4gPT09IHN0YXRlLmxlbmd0aClcbiAgICAgIC8vIGRpZG4ndCBnZXQgYW55IGRhdGEsIHN0b3Agc3Bpbm5pbmcuXG4gICAgICBicmVhaztcbiAgICBlbHNlXG4gICAgICBsZW4gPSBzdGF0ZS5sZW5ndGg7XG4gIH1cbiAgc3RhdGUucmVhZGluZ01vcmUgPSBmYWxzZTtcbn1cblxuLy8gYWJzdHJhY3QgbWV0aG9kLiAgdG8gYmUgb3ZlcnJpZGRlbiBpbiBzcGVjaWZpYyBpbXBsZW1lbnRhdGlvbiBjbGFzc2VzLlxuLy8gY2FsbCBjYihlciwgZGF0YSkgd2hlcmUgZGF0YSBpcyA8PSBuIGluIGxlbmd0aC5cbi8vIGZvciB2aXJ0dWFsIChub24tc3RyaW5nLCBub24tYnVmZmVyKSBzdHJlYW1zLCBcImxlbmd0aFwiIGlzIHNvbWV3aGF0XG4vLyBhcmJpdHJhcnksIGFuZCBwZXJoYXBzIG5vdCB2ZXJ5IG1lYW5pbmdmdWwuXG5SZWFkYWJsZS5wcm90b3R5cGUuX3JlYWQgPSBmdW5jdGlvbihuKSB7XG4gIHRoaXMuZW1pdCgnZXJyb3InLCBuZXcgRXJyb3IoJ25vdCBpbXBsZW1lbnRlZCcpKTtcbn07XG5cblJlYWRhYmxlLnByb3RvdHlwZS5waXBlID0gZnVuY3Rpb24oZGVzdCwgcGlwZU9wdHMpIHtcbiAgdmFyIHNyYyA9IHRoaXM7XG4gIHZhciBzdGF0ZSA9IHRoaXMuX3JlYWRhYmxlU3RhdGU7XG5cbiAgc3dpdGNoIChzdGF0ZS5waXBlc0NvdW50KSB7XG4gICAgY2FzZSAwOlxuICAgICAgc3RhdGUucGlwZXMgPSBkZXN0O1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSAxOlxuICAgICAgc3RhdGUucGlwZXMgPSBbc3RhdGUucGlwZXMsIGRlc3RdO1xuICAgICAgYnJlYWs7XG4gICAgZGVmYXVsdDpcbiAgICAgIHN0YXRlLnBpcGVzLnB1c2goZGVzdCk7XG4gICAgICBicmVhaztcbiAgfVxuICBzdGF0ZS5waXBlc0NvdW50ICs9IDE7XG4gIGRlYnVnKCdwaXBlIGNvdW50PSVkIG9wdHM9JWonLCBzdGF0ZS5waXBlc0NvdW50LCBwaXBlT3B0cyk7XG5cbiAgdmFyIGRvRW5kID0gKCFwaXBlT3B0cyB8fCBwaXBlT3B0cy5lbmQgIT09IGZhbHNlKSAmJlxuICAgICAgICAgICAgICBkZXN0ICE9PSBwcm9jZXNzLnN0ZG91dCAmJlxuICAgICAgICAgICAgICBkZXN0ICE9PSBwcm9jZXNzLnN0ZGVycjtcblxuICB2YXIgZW5kRm4gPSBkb0VuZCA/IG9uZW5kIDogY2xlYW51cDtcbiAgaWYgKHN0YXRlLmVuZEVtaXR0ZWQpXG4gICAgcHJvY2Vzcy5uZXh0VGljayhlbmRGbik7XG4gIGVsc2VcbiAgICBzcmMub25jZSgnZW5kJywgZW5kRm4pO1xuXG4gIGRlc3Qub24oJ3VucGlwZScsIG9udW5waXBlKTtcbiAgZnVuY3Rpb24gb251bnBpcGUocmVhZGFibGUpIHtcbiAgICBkZWJ1Zygnb251bnBpcGUnKTtcbiAgICBpZiAocmVhZGFibGUgPT09IHNyYykge1xuICAgICAgY2xlYW51cCgpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIG9uZW5kKCkge1xuICAgIGRlYnVnKCdvbmVuZCcpO1xuICAgIGRlc3QuZW5kKCk7XG4gIH1cblxuICAvLyB3aGVuIHRoZSBkZXN0IGRyYWlucywgaXQgcmVkdWNlcyB0aGUgYXdhaXREcmFpbiBjb3VudGVyXG4gIC8vIG9uIHRoZSBzb3VyY2UuICBUaGlzIHdvdWxkIGJlIG1vcmUgZWxlZ2FudCB3aXRoIGEgLm9uY2UoKVxuICAvLyBoYW5kbGVyIGluIGZsb3coKSwgYnV0IGFkZGluZyBhbmQgcmVtb3ZpbmcgcmVwZWF0ZWRseSBpc1xuICAvLyB0b28gc2xvdy5cbiAgdmFyIG9uZHJhaW4gPSBwaXBlT25EcmFpbihzcmMpO1xuICBkZXN0Lm9uKCdkcmFpbicsIG9uZHJhaW4pO1xuXG4gIGZ1bmN0aW9uIGNsZWFudXAoKSB7XG4gICAgZGVidWcoJ2NsZWFudXAnKTtcbiAgICAvLyBjbGVhbnVwIGV2ZW50IGhhbmRsZXJzIG9uY2UgdGhlIHBpcGUgaXMgYnJva2VuXG4gICAgZGVzdC5yZW1vdmVMaXN0ZW5lcignY2xvc2UnLCBvbmNsb3NlKTtcbiAgICBkZXN0LnJlbW92ZUxpc3RlbmVyKCdmaW5pc2gnLCBvbmZpbmlzaCk7XG4gICAgZGVzdC5yZW1vdmVMaXN0ZW5lcignZHJhaW4nLCBvbmRyYWluKTtcbiAgICBkZXN0LnJlbW92ZUxpc3RlbmVyKCdlcnJvcicsIG9uZXJyb3IpO1xuICAgIGRlc3QucmVtb3ZlTGlzdGVuZXIoJ3VucGlwZScsIG9udW5waXBlKTtcbiAgICBzcmMucmVtb3ZlTGlzdGVuZXIoJ2VuZCcsIG9uZW5kKTtcbiAgICBzcmMucmVtb3ZlTGlzdGVuZXIoJ2VuZCcsIGNsZWFudXApO1xuICAgIHNyYy5yZW1vdmVMaXN0ZW5lcignZGF0YScsIG9uZGF0YSk7XG5cbiAgICAvLyBpZiB0aGUgcmVhZGVyIGlzIHdhaXRpbmcgZm9yIGEgZHJhaW4gZXZlbnQgZnJvbSB0aGlzXG4gICAgLy8gc3BlY2lmaWMgd3JpdGVyLCB0aGVuIGl0IHdvdWxkIGNhdXNlIGl0IHRvIG5ldmVyIHN0YXJ0XG4gICAgLy8gZmxvd2luZyBhZ2Fpbi5cbiAgICAvLyBTbywgaWYgdGhpcyBpcyBhd2FpdGluZyBhIGRyYWluLCB0aGVuIHdlIGp1c3QgY2FsbCBpdCBub3cuXG4gICAgLy8gSWYgd2UgZG9uJ3Qga25vdywgdGhlbiBhc3N1bWUgdGhhdCB3ZSBhcmUgd2FpdGluZyBmb3Igb25lLlxuICAgIGlmIChzdGF0ZS5hd2FpdERyYWluICYmXG4gICAgICAgICghZGVzdC5fd3JpdGFibGVTdGF0ZSB8fCBkZXN0Ll93cml0YWJsZVN0YXRlLm5lZWREcmFpbikpXG4gICAgICBvbmRyYWluKCk7XG4gIH1cblxuICBzcmMub24oJ2RhdGEnLCBvbmRhdGEpO1xuICBmdW5jdGlvbiBvbmRhdGEoY2h1bmspIHtcbiAgICBkZWJ1Zygnb25kYXRhJyk7XG4gICAgdmFyIHJldCA9IGRlc3Qud3JpdGUoY2h1bmspO1xuICAgIGlmIChmYWxzZSA9PT0gcmV0KSB7XG4gICAgICBkZWJ1ZygnZmFsc2Ugd3JpdGUgcmVzcG9uc2UsIHBhdXNlJyxcbiAgICAgICAgICAgIHNyYy5fcmVhZGFibGVTdGF0ZS5hd2FpdERyYWluKTtcbiAgICAgIHNyYy5fcmVhZGFibGVTdGF0ZS5hd2FpdERyYWluKys7XG4gICAgICBzcmMucGF1c2UoKTtcbiAgICB9XG4gIH1cblxuICAvLyBpZiB0aGUgZGVzdCBoYXMgYW4gZXJyb3IsIHRoZW4gc3RvcCBwaXBpbmcgaW50byBpdC5cbiAgLy8gaG93ZXZlciwgZG9uJ3Qgc3VwcHJlc3MgdGhlIHRocm93aW5nIGJlaGF2aW9yIGZvciB0aGlzLlxuICBmdW5jdGlvbiBvbmVycm9yKGVyKSB7XG4gICAgZGVidWcoJ29uZXJyb3InLCBlcik7XG4gICAgdW5waXBlKCk7XG4gICAgZGVzdC5yZW1vdmVMaXN0ZW5lcignZXJyb3InLCBvbmVycm9yKTtcbiAgICBpZiAoRUUubGlzdGVuZXJDb3VudChkZXN0LCAnZXJyb3InKSA9PT0gMClcbiAgICAgIGRlc3QuZW1pdCgnZXJyb3InLCBlcik7XG4gIH1cbiAgLy8gVGhpcyBpcyBhIGJydXRhbGx5IHVnbHkgaGFjayB0byBtYWtlIHN1cmUgdGhhdCBvdXIgZXJyb3IgaGFuZGxlclxuICAvLyBpcyBhdHRhY2hlZCBiZWZvcmUgYW55IHVzZXJsYW5kIG9uZXMuICBORVZFUiBETyBUSElTLlxuICBpZiAoIWRlc3QuX2V2ZW50cyB8fCAhZGVzdC5fZXZlbnRzLmVycm9yKVxuICAgIGRlc3Qub24oJ2Vycm9yJywgb25lcnJvcik7XG4gIGVsc2UgaWYgKGlzQXJyYXkoZGVzdC5fZXZlbnRzLmVycm9yKSlcbiAgICBkZXN0Ll9ldmVudHMuZXJyb3IudW5zaGlmdChvbmVycm9yKTtcbiAgZWxzZVxuICAgIGRlc3QuX2V2ZW50cy5lcnJvciA9IFtvbmVycm9yLCBkZXN0Ll9ldmVudHMuZXJyb3JdO1xuXG5cblxuICAvLyBCb3RoIGNsb3NlIGFuZCBmaW5pc2ggc2hvdWxkIHRyaWdnZXIgdW5waXBlLCBidXQgb25seSBvbmNlLlxuICBmdW5jdGlvbiBvbmNsb3NlKCkge1xuICAgIGRlc3QucmVtb3ZlTGlzdGVuZXIoJ2ZpbmlzaCcsIG9uZmluaXNoKTtcbiAgICB1bnBpcGUoKTtcbiAgfVxuICBkZXN0Lm9uY2UoJ2Nsb3NlJywgb25jbG9zZSk7XG4gIGZ1bmN0aW9uIG9uZmluaXNoKCkge1xuICAgIGRlYnVnKCdvbmZpbmlzaCcpO1xuICAgIGRlc3QucmVtb3ZlTGlzdGVuZXIoJ2Nsb3NlJywgb25jbG9zZSk7XG4gICAgdW5waXBlKCk7XG4gIH1cbiAgZGVzdC5vbmNlKCdmaW5pc2gnLCBvbmZpbmlzaCk7XG5cbiAgZnVuY3Rpb24gdW5waXBlKCkge1xuICAgIGRlYnVnKCd1bnBpcGUnKTtcbiAgICBzcmMudW5waXBlKGRlc3QpO1xuICB9XG5cbiAgLy8gdGVsbCB0aGUgZGVzdCB0aGF0IGl0J3MgYmVpbmcgcGlwZWQgdG9cbiAgZGVzdC5lbWl0KCdwaXBlJywgc3JjKTtcblxuICAvLyBzdGFydCB0aGUgZmxvdyBpZiBpdCBoYXNuJ3QgYmVlbiBzdGFydGVkIGFscmVhZHkuXG4gIGlmICghc3RhdGUuZmxvd2luZykge1xuICAgIGRlYnVnKCdwaXBlIHJlc3VtZScpO1xuICAgIHNyYy5yZXN1bWUoKTtcbiAgfVxuXG4gIHJldHVybiBkZXN0O1xufTtcblxuZnVuY3Rpb24gcGlwZU9uRHJhaW4oc3JjKSB7XG4gIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICB2YXIgc3RhdGUgPSBzcmMuX3JlYWRhYmxlU3RhdGU7XG4gICAgZGVidWcoJ3BpcGVPbkRyYWluJywgc3RhdGUuYXdhaXREcmFpbik7XG4gICAgaWYgKHN0YXRlLmF3YWl0RHJhaW4pXG4gICAgICBzdGF0ZS5hd2FpdERyYWluLS07XG4gICAgaWYgKHN0YXRlLmF3YWl0RHJhaW4gPT09IDAgJiYgRUUubGlzdGVuZXJDb3VudChzcmMsICdkYXRhJykpIHtcbiAgICAgIHN0YXRlLmZsb3dpbmcgPSB0cnVlO1xuICAgICAgZmxvdyhzcmMpO1xuICAgIH1cbiAgfTtcbn1cblxuXG5SZWFkYWJsZS5wcm90b3R5cGUudW5waXBlID0gZnVuY3Rpb24oZGVzdCkge1xuICB2YXIgc3RhdGUgPSB0aGlzLl9yZWFkYWJsZVN0YXRlO1xuXG4gIC8vIGlmIHdlJ3JlIG5vdCBwaXBpbmcgYW55d2hlcmUsIHRoZW4gZG8gbm90aGluZy5cbiAgaWYgKHN0YXRlLnBpcGVzQ291bnQgPT09IDApXG4gICAgcmV0dXJuIHRoaXM7XG5cbiAgLy8ganVzdCBvbmUgZGVzdGluYXRpb24uICBtb3N0IGNvbW1vbiBjYXNlLlxuICBpZiAoc3RhdGUucGlwZXNDb3VudCA9PT0gMSkge1xuICAgIC8vIHBhc3NlZCBpbiBvbmUsIGJ1dCBpdCdzIG5vdCB0aGUgcmlnaHQgb25lLlxuICAgIGlmIChkZXN0ICYmIGRlc3QgIT09IHN0YXRlLnBpcGVzKVxuICAgICAgcmV0dXJuIHRoaXM7XG5cbiAgICBpZiAoIWRlc3QpXG4gICAgICBkZXN0ID0gc3RhdGUucGlwZXM7XG5cbiAgICAvLyBnb3QgYSBtYXRjaC5cbiAgICBzdGF0ZS5waXBlcyA9IG51bGw7XG4gICAgc3RhdGUucGlwZXNDb3VudCA9IDA7XG4gICAgc3RhdGUuZmxvd2luZyA9IGZhbHNlO1xuICAgIGlmIChkZXN0KVxuICAgICAgZGVzdC5lbWl0KCd1bnBpcGUnLCB0aGlzKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8vIHNsb3cgY2FzZS4gbXVsdGlwbGUgcGlwZSBkZXN0aW5hdGlvbnMuXG5cbiAgaWYgKCFkZXN0KSB7XG4gICAgLy8gcmVtb3ZlIGFsbC5cbiAgICB2YXIgZGVzdHMgPSBzdGF0ZS5waXBlcztcbiAgICB2YXIgbGVuID0gc3RhdGUucGlwZXNDb3VudDtcbiAgICBzdGF0ZS5waXBlcyA9IG51bGw7XG4gICAgc3RhdGUucGlwZXNDb3VudCA9IDA7XG4gICAgc3RhdGUuZmxvd2luZyA9IGZhbHNlO1xuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47IGkrKylcbiAgICAgIGRlc3RzW2ldLmVtaXQoJ3VucGlwZScsIHRoaXMpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLy8gdHJ5IHRvIGZpbmQgdGhlIHJpZ2h0IG9uZS5cbiAgdmFyIGkgPSBpbmRleE9mKHN0YXRlLnBpcGVzLCBkZXN0KTtcbiAgaWYgKGkgPT09IC0xKVxuICAgIHJldHVybiB0aGlzO1xuXG4gIHN0YXRlLnBpcGVzLnNwbGljZShpLCAxKTtcbiAgc3RhdGUucGlwZXNDb3VudCAtPSAxO1xuICBpZiAoc3RhdGUucGlwZXNDb3VudCA9PT0gMSlcbiAgICBzdGF0ZS5waXBlcyA9IHN0YXRlLnBpcGVzWzBdO1xuXG4gIGRlc3QuZW1pdCgndW5waXBlJywgdGhpcyk7XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vLyBzZXQgdXAgZGF0YSBldmVudHMgaWYgdGhleSBhcmUgYXNrZWQgZm9yXG4vLyBFbnN1cmUgcmVhZGFibGUgbGlzdGVuZXJzIGV2ZW50dWFsbHkgZ2V0IHNvbWV0aGluZ1xuUmVhZGFibGUucHJvdG90eXBlLm9uID0gZnVuY3Rpb24oZXYsIGZuKSB7XG4gIHZhciByZXMgPSBTdHJlYW0ucHJvdG90eXBlLm9uLmNhbGwodGhpcywgZXYsIGZuKTtcblxuICAvLyBJZiBsaXN0ZW5pbmcgdG8gZGF0YSwgYW5kIGl0IGhhcyBub3QgZXhwbGljaXRseSBiZWVuIHBhdXNlZCxcbiAgLy8gdGhlbiBjYWxsIHJlc3VtZSB0byBzdGFydCB0aGUgZmxvdyBvZiBkYXRhIG9uIHRoZSBuZXh0IHRpY2suXG4gIGlmIChldiA9PT0gJ2RhdGEnICYmIGZhbHNlICE9PSB0aGlzLl9yZWFkYWJsZVN0YXRlLmZsb3dpbmcpIHtcbiAgICB0aGlzLnJlc3VtZSgpO1xuICB9XG5cbiAgaWYgKGV2ID09PSAncmVhZGFibGUnICYmIHRoaXMucmVhZGFibGUpIHtcbiAgICB2YXIgc3RhdGUgPSB0aGlzLl9yZWFkYWJsZVN0YXRlO1xuICAgIGlmICghc3RhdGUucmVhZGFibGVMaXN0ZW5pbmcpIHtcbiAgICAgIHN0YXRlLnJlYWRhYmxlTGlzdGVuaW5nID0gdHJ1ZTtcbiAgICAgIHN0YXRlLmVtaXR0ZWRSZWFkYWJsZSA9IGZhbHNlO1xuICAgICAgc3RhdGUubmVlZFJlYWRhYmxlID0gdHJ1ZTtcbiAgICAgIGlmICghc3RhdGUucmVhZGluZykge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIHByb2Nlc3MubmV4dFRpY2soZnVuY3Rpb24oKSB7XG4gICAgICAgICAgZGVidWcoJ3JlYWRhYmxlIG5leHR0aWNrIHJlYWQgMCcpO1xuICAgICAgICAgIHNlbGYucmVhZCgwKTtcbiAgICAgICAgfSk7XG4gICAgICB9IGVsc2UgaWYgKHN0YXRlLmxlbmd0aCkge1xuICAgICAgICBlbWl0UmVhZGFibGUodGhpcywgc3RhdGUpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiByZXM7XG59O1xuUmVhZGFibGUucHJvdG90eXBlLmFkZExpc3RlbmVyID0gUmVhZGFibGUucHJvdG90eXBlLm9uO1xuXG4vLyBwYXVzZSgpIGFuZCByZXN1bWUoKSBhcmUgcmVtbmFudHMgb2YgdGhlIGxlZ2FjeSByZWFkYWJsZSBzdHJlYW0gQVBJXG4vLyBJZiB0aGUgdXNlciB1c2VzIHRoZW0sIHRoZW4gc3dpdGNoIGludG8gb2xkIG1vZGUuXG5SZWFkYWJsZS5wcm90b3R5cGUucmVzdW1lID0gZnVuY3Rpb24oKSB7XG4gIHZhciBzdGF0ZSA9IHRoaXMuX3JlYWRhYmxlU3RhdGU7XG4gIGlmICghc3RhdGUuZmxvd2luZykge1xuICAgIGRlYnVnKCdyZXN1bWUnKTtcbiAgICBzdGF0ZS5mbG93aW5nID0gdHJ1ZTtcbiAgICBpZiAoIXN0YXRlLnJlYWRpbmcpIHtcbiAgICAgIGRlYnVnKCdyZXN1bWUgcmVhZCAwJyk7XG4gICAgICB0aGlzLnJlYWQoMCk7XG4gICAgfVxuICAgIHJlc3VtZSh0aGlzLCBzdGF0ZSk7XG4gIH1cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5mdW5jdGlvbiByZXN1bWUoc3RyZWFtLCBzdGF0ZSkge1xuICBpZiAoIXN0YXRlLnJlc3VtZVNjaGVkdWxlZCkge1xuICAgIHN0YXRlLnJlc3VtZVNjaGVkdWxlZCA9IHRydWU7XG4gICAgcHJvY2Vzcy5uZXh0VGljayhmdW5jdGlvbigpIHtcbiAgICAgIHJlc3VtZV8oc3RyZWFtLCBzdGF0ZSk7XG4gICAgfSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gcmVzdW1lXyhzdHJlYW0sIHN0YXRlKSB7XG4gIHN0YXRlLnJlc3VtZVNjaGVkdWxlZCA9IGZhbHNlO1xuICBzdHJlYW0uZW1pdCgncmVzdW1lJyk7XG4gIGZsb3coc3RyZWFtKTtcbiAgaWYgKHN0YXRlLmZsb3dpbmcgJiYgIXN0YXRlLnJlYWRpbmcpXG4gICAgc3RyZWFtLnJlYWQoMCk7XG59XG5cblJlYWRhYmxlLnByb3RvdHlwZS5wYXVzZSA9IGZ1bmN0aW9uKCkge1xuICBkZWJ1ZygnY2FsbCBwYXVzZSBmbG93aW5nPSVqJywgdGhpcy5fcmVhZGFibGVTdGF0ZS5mbG93aW5nKTtcbiAgaWYgKGZhbHNlICE9PSB0aGlzLl9yZWFkYWJsZVN0YXRlLmZsb3dpbmcpIHtcbiAgICBkZWJ1ZygncGF1c2UnKTtcbiAgICB0aGlzLl9yZWFkYWJsZVN0YXRlLmZsb3dpbmcgPSBmYWxzZTtcbiAgICB0aGlzLmVtaXQoJ3BhdXNlJyk7XG4gIH1cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5mdW5jdGlvbiBmbG93KHN0cmVhbSkge1xuICB2YXIgc3RhdGUgPSBzdHJlYW0uX3JlYWRhYmxlU3RhdGU7XG4gIGRlYnVnKCdmbG93Jywgc3RhdGUuZmxvd2luZyk7XG4gIGlmIChzdGF0ZS5mbG93aW5nKSB7XG4gICAgZG8ge1xuICAgICAgdmFyIGNodW5rID0gc3RyZWFtLnJlYWQoKTtcbiAgICB9IHdoaWxlIChudWxsICE9PSBjaHVuayAmJiBzdGF0ZS5mbG93aW5nKTtcbiAgfVxufVxuXG4vLyB3cmFwIGFuIG9sZC1zdHlsZSBzdHJlYW0gYXMgdGhlIGFzeW5jIGRhdGEgc291cmNlLlxuLy8gVGhpcyBpcyAqbm90KiBwYXJ0IG9mIHRoZSByZWFkYWJsZSBzdHJlYW0gaW50ZXJmYWNlLlxuLy8gSXQgaXMgYW4gdWdseSB1bmZvcnR1bmF0ZSBtZXNzIG9mIGhpc3RvcnkuXG5SZWFkYWJsZS5wcm90b3R5cGUud3JhcCA9IGZ1bmN0aW9uKHN0cmVhbSkge1xuICB2YXIgc3RhdGUgPSB0aGlzLl9yZWFkYWJsZVN0YXRlO1xuICB2YXIgcGF1c2VkID0gZmFsc2U7XG5cbiAgdmFyIHNlbGYgPSB0aGlzO1xuICBzdHJlYW0ub24oJ2VuZCcsIGZ1bmN0aW9uKCkge1xuICAgIGRlYnVnKCd3cmFwcGVkIGVuZCcpO1xuICAgIGlmIChzdGF0ZS5kZWNvZGVyICYmICFzdGF0ZS5lbmRlZCkge1xuICAgICAgdmFyIGNodW5rID0gc3RhdGUuZGVjb2Rlci5lbmQoKTtcbiAgICAgIGlmIChjaHVuayAmJiBjaHVuay5sZW5ndGgpXG4gICAgICAgIHNlbGYucHVzaChjaHVuayk7XG4gICAgfVxuXG4gICAgc2VsZi5wdXNoKG51bGwpO1xuICB9KTtcblxuICBzdHJlYW0ub24oJ2RhdGEnLCBmdW5jdGlvbihjaHVuaykge1xuICAgIGRlYnVnKCd3cmFwcGVkIGRhdGEnKTtcbiAgICBpZiAoc3RhdGUuZGVjb2RlcilcbiAgICAgIGNodW5rID0gc3RhdGUuZGVjb2Rlci53cml0ZShjaHVuayk7XG4gICAgaWYgKCFjaHVuayB8fCAhc3RhdGUub2JqZWN0TW9kZSAmJiAhY2h1bmsubGVuZ3RoKVxuICAgICAgcmV0dXJuO1xuXG4gICAgdmFyIHJldCA9IHNlbGYucHVzaChjaHVuayk7XG4gICAgaWYgKCFyZXQpIHtcbiAgICAgIHBhdXNlZCA9IHRydWU7XG4gICAgICBzdHJlYW0ucGF1c2UoKTtcbiAgICB9XG4gIH0pO1xuXG4gIC8vIHByb3h5IGFsbCB0aGUgb3RoZXIgbWV0aG9kcy5cbiAgLy8gaW1wb3J0YW50IHdoZW4gd3JhcHBpbmcgZmlsdGVycyBhbmQgZHVwbGV4ZXMuXG4gIGZvciAodmFyIGkgaW4gc3RyZWFtKSB7XG4gICAgaWYgKHV0aWwuaXNGdW5jdGlvbihzdHJlYW1baV0pICYmIHV0aWwuaXNVbmRlZmluZWQodGhpc1tpXSkpIHtcbiAgICAgIHRoaXNbaV0gPSBmdW5jdGlvbihtZXRob2QpIHsgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gc3RyZWFtW21ldGhvZF0uYXBwbHkoc3RyZWFtLCBhcmd1bWVudHMpO1xuICAgICAgfX0oaSk7XG4gICAgfVxuICB9XG5cbiAgLy8gcHJveHkgY2VydGFpbiBpbXBvcnRhbnQgZXZlbnRzLlxuICB2YXIgZXZlbnRzID0gWydlcnJvcicsICdjbG9zZScsICdkZXN0cm95JywgJ3BhdXNlJywgJ3Jlc3VtZSddO1xuICBmb3JFYWNoKGV2ZW50cywgZnVuY3Rpb24oZXYpIHtcbiAgICBzdHJlYW0ub24oZXYsIHNlbGYuZW1pdC5iaW5kKHNlbGYsIGV2KSk7XG4gIH0pO1xuXG4gIC8vIHdoZW4gd2UgdHJ5IHRvIGNvbnN1bWUgc29tZSBtb3JlIGJ5dGVzLCBzaW1wbHkgdW5wYXVzZSB0aGVcbiAgLy8gdW5kZXJseWluZyBzdHJlYW0uXG4gIHNlbGYuX3JlYWQgPSBmdW5jdGlvbihuKSB7XG4gICAgZGVidWcoJ3dyYXBwZWQgX3JlYWQnLCBuKTtcbiAgICBpZiAocGF1c2VkKSB7XG4gICAgICBwYXVzZWQgPSBmYWxzZTtcbiAgICAgIHN0cmVhbS5yZXN1bWUoKTtcbiAgICB9XG4gIH07XG5cbiAgcmV0dXJuIHNlbGY7XG59O1xuXG5cblxuLy8gZXhwb3NlZCBmb3IgdGVzdGluZyBwdXJwb3NlcyBvbmx5LlxuUmVhZGFibGUuX2Zyb21MaXN0ID0gZnJvbUxpc3Q7XG5cbi8vIFBsdWNrIG9mZiBuIGJ5dGVzIGZyb20gYW4gYXJyYXkgb2YgYnVmZmVycy5cbi8vIExlbmd0aCBpcyB0aGUgY29tYmluZWQgbGVuZ3RocyBvZiBhbGwgdGhlIGJ1ZmZlcnMgaW4gdGhlIGxpc3QuXG5mdW5jdGlvbiBmcm9tTGlzdChuLCBzdGF0ZSkge1xuICB2YXIgbGlzdCA9IHN0YXRlLmJ1ZmZlcjtcbiAgdmFyIGxlbmd0aCA9IHN0YXRlLmxlbmd0aDtcbiAgdmFyIHN0cmluZ01vZGUgPSAhIXN0YXRlLmRlY29kZXI7XG4gIHZhciBvYmplY3RNb2RlID0gISFzdGF0ZS5vYmplY3RNb2RlO1xuICB2YXIgcmV0O1xuXG4gIC8vIG5vdGhpbmcgaW4gdGhlIGxpc3QsIGRlZmluaXRlbHkgZW1wdHkuXG4gIGlmIChsaXN0Lmxlbmd0aCA9PT0gMClcbiAgICByZXR1cm4gbnVsbDtcblxuICBpZiAobGVuZ3RoID09PSAwKVxuICAgIHJldCA9IG51bGw7XG4gIGVsc2UgaWYgKG9iamVjdE1vZGUpXG4gICAgcmV0ID0gbGlzdC5zaGlmdCgpO1xuICBlbHNlIGlmICghbiB8fCBuID49IGxlbmd0aCkge1xuICAgIC8vIHJlYWQgaXQgYWxsLCB0cnVuY2F0ZSB0aGUgYXJyYXkuXG4gICAgaWYgKHN0cmluZ01vZGUpXG4gICAgICByZXQgPSBsaXN0LmpvaW4oJycpO1xuICAgIGVsc2VcbiAgICAgIHJldCA9IEJ1ZmZlci5jb25jYXQobGlzdCwgbGVuZ3RoKTtcbiAgICBsaXN0Lmxlbmd0aCA9IDA7XG4gIH0gZWxzZSB7XG4gICAgLy8gcmVhZCBqdXN0IHNvbWUgb2YgaXQuXG4gICAgaWYgKG4gPCBsaXN0WzBdLmxlbmd0aCkge1xuICAgICAgLy8ganVzdCB0YWtlIGEgcGFydCBvZiB0aGUgZmlyc3QgbGlzdCBpdGVtLlxuICAgICAgLy8gc2xpY2UgaXMgdGhlIHNhbWUgZm9yIGJ1ZmZlcnMgYW5kIHN0cmluZ3MuXG4gICAgICB2YXIgYnVmID0gbGlzdFswXTtcbiAgICAgIHJldCA9IGJ1Zi5zbGljZSgwLCBuKTtcbiAgICAgIGxpc3RbMF0gPSBidWYuc2xpY2Uobik7XG4gICAgfSBlbHNlIGlmIChuID09PSBsaXN0WzBdLmxlbmd0aCkge1xuICAgICAgLy8gZmlyc3QgbGlzdCBpcyBhIHBlcmZlY3QgbWF0Y2hcbiAgICAgIHJldCA9IGxpc3Quc2hpZnQoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gY29tcGxleCBjYXNlLlxuICAgICAgLy8gd2UgaGF2ZSBlbm91Z2ggdG8gY292ZXIgaXQsIGJ1dCBpdCBzcGFucyBwYXN0IHRoZSBmaXJzdCBidWZmZXIuXG4gICAgICBpZiAoc3RyaW5nTW9kZSlcbiAgICAgICAgcmV0ID0gJyc7XG4gICAgICBlbHNlXG4gICAgICAgIHJldCA9IG5ldyBCdWZmZXIobik7XG5cbiAgICAgIHZhciBjID0gMDtcbiAgICAgIGZvciAodmFyIGkgPSAwLCBsID0gbGlzdC5sZW5ndGg7IGkgPCBsICYmIGMgPCBuOyBpKyspIHtcbiAgICAgICAgdmFyIGJ1ZiA9IGxpc3RbMF07XG4gICAgICAgIHZhciBjcHkgPSBNYXRoLm1pbihuIC0gYywgYnVmLmxlbmd0aCk7XG5cbiAgICAgICAgaWYgKHN0cmluZ01vZGUpXG4gICAgICAgICAgcmV0ICs9IGJ1Zi5zbGljZSgwLCBjcHkpO1xuICAgICAgICBlbHNlXG4gICAgICAgICAgYnVmLmNvcHkocmV0LCBjLCAwLCBjcHkpO1xuXG4gICAgICAgIGlmIChjcHkgPCBidWYubGVuZ3RoKVxuICAgICAgICAgIGxpc3RbMF0gPSBidWYuc2xpY2UoY3B5KTtcbiAgICAgICAgZWxzZVxuICAgICAgICAgIGxpc3Quc2hpZnQoKTtcblxuICAgICAgICBjICs9IGNweTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gcmV0O1xufVxuXG5mdW5jdGlvbiBlbmRSZWFkYWJsZShzdHJlYW0pIHtcbiAgdmFyIHN0YXRlID0gc3RyZWFtLl9yZWFkYWJsZVN0YXRlO1xuXG4gIC8vIElmIHdlIGdldCBoZXJlIGJlZm9yZSBjb25zdW1pbmcgYWxsIHRoZSBieXRlcywgdGhlbiB0aGF0IGlzIGFcbiAgLy8gYnVnIGluIG5vZGUuICBTaG91bGQgbmV2ZXIgaGFwcGVuLlxuICBpZiAoc3RhdGUubGVuZ3RoID4gMClcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ2VuZFJlYWRhYmxlIGNhbGxlZCBvbiBub24tZW1wdHkgc3RyZWFtJyk7XG5cbiAgaWYgKCFzdGF0ZS5lbmRFbWl0dGVkKSB7XG4gICAgc3RhdGUuZW5kZWQgPSB0cnVlO1xuICAgIHByb2Nlc3MubmV4dFRpY2soZnVuY3Rpb24oKSB7XG4gICAgICAvLyBDaGVjayB0aGF0IHdlIGRpZG4ndCBnZXQgb25lIGxhc3QgdW5zaGlmdC5cbiAgICAgIGlmICghc3RhdGUuZW5kRW1pdHRlZCAmJiBzdGF0ZS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgc3RhdGUuZW5kRW1pdHRlZCA9IHRydWU7XG4gICAgICAgIHN0cmVhbS5yZWFkYWJsZSA9IGZhbHNlO1xuICAgICAgICBzdHJlYW0uZW1pdCgnZW5kJyk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gZm9yRWFjaCAoeHMsIGYpIHtcbiAgZm9yICh2YXIgaSA9IDAsIGwgPSB4cy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICBmKHhzW2ldLCBpKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBpbmRleE9mICh4cywgeCkge1xuICBmb3IgKHZhciBpID0gMCwgbCA9IHhzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgIGlmICh4c1tpXSA9PT0geCkgcmV0dXJuIGk7XG4gIH1cbiAgcmV0dXJuIC0xO1xufVxuIiwiLy8gQ29weXJpZ2h0IEpveWVudCwgSW5jLiBhbmQgb3RoZXIgTm9kZSBjb250cmlidXRvcnMuXG4vL1xuLy8gUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGFcbi8vIGNvcHkgb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGVcbi8vIFwiU29mdHdhcmVcIiksIHRvIGRlYWwgaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZ1xuLy8gd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHMgdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLFxuLy8gZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGwgY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdFxuLy8gcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpcyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlXG4vLyBmb2xsb3dpbmcgY29uZGl0aW9uczpcbi8vXG4vLyBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZFxuLy8gaW4gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4vL1xuLy8gVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTU1xuLy8gT1IgSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRlxuLy8gTUVSQ0hBTlRBQklMSVRZLCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTlxuLy8gTk8gRVZFTlQgU0hBTEwgVEhFIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sXG4vLyBEQU1BR0VTIE9SIE9USEVSIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1Jcbi8vIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLCBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEVcbi8vIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEUgU09GVFdBUkUuXG5cblxuLy8gYSB0cmFuc2Zvcm0gc3RyZWFtIGlzIGEgcmVhZGFibGUvd3JpdGFibGUgc3RyZWFtIHdoZXJlIHlvdSBkb1xuLy8gc29tZXRoaW5nIHdpdGggdGhlIGRhdGEuICBTb21ldGltZXMgaXQncyBjYWxsZWQgYSBcImZpbHRlclwiLFxuLy8gYnV0IHRoYXQncyBub3QgYSBncmVhdCBuYW1lIGZvciBpdCwgc2luY2UgdGhhdCBpbXBsaWVzIGEgdGhpbmcgd2hlcmVcbi8vIHNvbWUgYml0cyBwYXNzIHRocm91Z2gsIGFuZCBvdGhlcnMgYXJlIHNpbXBseSBpZ25vcmVkLiAgKFRoYXQgd291bGRcbi8vIGJlIGEgdmFsaWQgZXhhbXBsZSBvZiBhIHRyYW5zZm9ybSwgb2YgY291cnNlLilcbi8vXG4vLyBXaGlsZSB0aGUgb3V0cHV0IGlzIGNhdXNhbGx5IHJlbGF0ZWQgdG8gdGhlIGlucHV0LCBpdCdzIG5vdCBhXG4vLyBuZWNlc3NhcmlseSBzeW1tZXRyaWMgb3Igc3luY2hyb25vdXMgdHJhbnNmb3JtYXRpb24uICBGb3IgZXhhbXBsZSxcbi8vIGEgemxpYiBzdHJlYW0gbWlnaHQgdGFrZSBtdWx0aXBsZSBwbGFpbi10ZXh0IHdyaXRlcygpLCBhbmQgdGhlblxuLy8gZW1pdCBhIHNpbmdsZSBjb21wcmVzc2VkIGNodW5rIHNvbWUgdGltZSBpbiB0aGUgZnV0dXJlLlxuLy9cbi8vIEhlcmUncyBob3cgdGhpcyB3b3Jrczpcbi8vXG4vLyBUaGUgVHJhbnNmb3JtIHN0cmVhbSBoYXMgYWxsIHRoZSBhc3BlY3RzIG9mIHRoZSByZWFkYWJsZSBhbmQgd3JpdGFibGVcbi8vIHN0cmVhbSBjbGFzc2VzLiAgV2hlbiB5b3Ugd3JpdGUoY2h1bmspLCB0aGF0IGNhbGxzIF93cml0ZShjaHVuayxjYilcbi8vIGludGVybmFsbHksIGFuZCByZXR1cm5zIGZhbHNlIGlmIHRoZXJlJ3MgYSBsb3Qgb2YgcGVuZGluZyB3cml0ZXNcbi8vIGJ1ZmZlcmVkIHVwLiAgV2hlbiB5b3UgY2FsbCByZWFkKCksIHRoYXQgY2FsbHMgX3JlYWQobikgdW50aWxcbi8vIHRoZXJlJ3MgZW5vdWdoIHBlbmRpbmcgcmVhZGFibGUgZGF0YSBidWZmZXJlZCB1cC5cbi8vXG4vLyBJbiBhIHRyYW5zZm9ybSBzdHJlYW0sIHRoZSB3cml0dGVuIGRhdGEgaXMgcGxhY2VkIGluIGEgYnVmZmVyLiAgV2hlblxuLy8gX3JlYWQobikgaXMgY2FsbGVkLCBpdCB0cmFuc2Zvcm1zIHRoZSBxdWV1ZWQgdXAgZGF0YSwgY2FsbGluZyB0aGVcbi8vIGJ1ZmZlcmVkIF93cml0ZSBjYidzIGFzIGl0IGNvbnN1bWVzIGNodW5rcy4gIElmIGNvbnN1bWluZyBhIHNpbmdsZVxuLy8gd3JpdHRlbiBjaHVuayB3b3VsZCByZXN1bHQgaW4gbXVsdGlwbGUgb3V0cHV0IGNodW5rcywgdGhlbiB0aGUgZmlyc3Rcbi8vIG91dHB1dHRlZCBiaXQgY2FsbHMgdGhlIHJlYWRjYiwgYW5kIHN1YnNlcXVlbnQgY2h1bmtzIGp1c3QgZ28gaW50b1xuLy8gdGhlIHJlYWQgYnVmZmVyLCBhbmQgd2lsbCBjYXVzZSBpdCB0byBlbWl0ICdyZWFkYWJsZScgaWYgbmVjZXNzYXJ5LlxuLy9cbi8vIFRoaXMgd2F5LCBiYWNrLXByZXNzdXJlIGlzIGFjdHVhbGx5IGRldGVybWluZWQgYnkgdGhlIHJlYWRpbmcgc2lkZSxcbi8vIHNpbmNlIF9yZWFkIGhhcyB0byBiZSBjYWxsZWQgdG8gc3RhcnQgcHJvY2Vzc2luZyBhIG5ldyBjaHVuay4gIEhvd2V2ZXIsXG4vLyBhIHBhdGhvbG9naWNhbCBpbmZsYXRlIHR5cGUgb2YgdHJhbnNmb3JtIGNhbiBjYXVzZSBleGNlc3NpdmUgYnVmZmVyaW5nXG4vLyBoZXJlLiAgRm9yIGV4YW1wbGUsIGltYWdpbmUgYSBzdHJlYW0gd2hlcmUgZXZlcnkgYnl0ZSBvZiBpbnB1dCBpc1xuLy8gaW50ZXJwcmV0ZWQgYXMgYW4gaW50ZWdlciBmcm9tIDAtMjU1LCBhbmQgdGhlbiByZXN1bHRzIGluIHRoYXQgbWFueVxuLy8gYnl0ZXMgb2Ygb3V0cHV0LiAgV3JpdGluZyB0aGUgNCBieXRlcyB7ZmYsZmYsZmYsZmZ9IHdvdWxkIHJlc3VsdCBpblxuLy8gMWtiIG9mIGRhdGEgYmVpbmcgb3V0cHV0LiAgSW4gdGhpcyBjYXNlLCB5b3UgY291bGQgd3JpdGUgYSB2ZXJ5IHNtYWxsXG4vLyBhbW91bnQgb2YgaW5wdXQsIGFuZCBlbmQgdXAgd2l0aCBhIHZlcnkgbGFyZ2UgYW1vdW50IG9mIG91dHB1dC4gIEluXG4vLyBzdWNoIGEgcGF0aG9sb2dpY2FsIGluZmxhdGluZyBtZWNoYW5pc20sIHRoZXJlJ2QgYmUgbm8gd2F5IHRvIHRlbGxcbi8vIHRoZSBzeXN0ZW0gdG8gc3RvcCBkb2luZyB0aGUgdHJhbnNmb3JtLiAgQSBzaW5nbGUgNE1CIHdyaXRlIGNvdWxkXG4vLyBjYXVzZSB0aGUgc3lzdGVtIHRvIHJ1biBvdXQgb2YgbWVtb3J5LlxuLy9cbi8vIEhvd2V2ZXIsIGV2ZW4gaW4gc3VjaCBhIHBhdGhvbG9naWNhbCBjYXNlLCBvbmx5IGEgc2luZ2xlIHdyaXR0ZW4gY2h1bmtcbi8vIHdvdWxkIGJlIGNvbnN1bWVkLCBhbmQgdGhlbiB0aGUgcmVzdCB3b3VsZCB3YWl0ICh1bi10cmFuc2Zvcm1lZCkgdW50aWxcbi8vIHRoZSByZXN1bHRzIG9mIHRoZSBwcmV2aW91cyB0cmFuc2Zvcm1lZCBjaHVuayB3ZXJlIGNvbnN1bWVkLlxuXG5tb2R1bGUuZXhwb3J0cyA9IFRyYW5zZm9ybTtcblxudmFyIER1cGxleCA9IHJlcXVpcmUoJy4vX3N0cmVhbV9kdXBsZXgnKTtcblxuLyo8cmVwbGFjZW1lbnQ+Ki9cbnZhciB1dGlsID0gcmVxdWlyZSgnY29yZS11dGlsLWlzJyk7XG51dGlsLmluaGVyaXRzID0gcmVxdWlyZSgnaW5oZXJpdHMnKTtcbi8qPC9yZXBsYWNlbWVudD4qL1xuXG51dGlsLmluaGVyaXRzKFRyYW5zZm9ybSwgRHVwbGV4KTtcblxuXG5mdW5jdGlvbiBUcmFuc2Zvcm1TdGF0ZShvcHRpb25zLCBzdHJlYW0pIHtcbiAgdGhpcy5hZnRlclRyYW5zZm9ybSA9IGZ1bmN0aW9uKGVyLCBkYXRhKSB7XG4gICAgcmV0dXJuIGFmdGVyVHJhbnNmb3JtKHN0cmVhbSwgZXIsIGRhdGEpO1xuICB9O1xuXG4gIHRoaXMubmVlZFRyYW5zZm9ybSA9IGZhbHNlO1xuICB0aGlzLnRyYW5zZm9ybWluZyA9IGZhbHNlO1xuICB0aGlzLndyaXRlY2IgPSBudWxsO1xuICB0aGlzLndyaXRlY2h1bmsgPSBudWxsO1xufVxuXG5mdW5jdGlvbiBhZnRlclRyYW5zZm9ybShzdHJlYW0sIGVyLCBkYXRhKSB7XG4gIHZhciB0cyA9IHN0cmVhbS5fdHJhbnNmb3JtU3RhdGU7XG4gIHRzLnRyYW5zZm9ybWluZyA9IGZhbHNlO1xuXG4gIHZhciBjYiA9IHRzLndyaXRlY2I7XG5cbiAgaWYgKCFjYilcbiAgICByZXR1cm4gc3RyZWFtLmVtaXQoJ2Vycm9yJywgbmV3IEVycm9yKCdubyB3cml0ZWNiIGluIFRyYW5zZm9ybSBjbGFzcycpKTtcblxuICB0cy53cml0ZWNodW5rID0gbnVsbDtcbiAgdHMud3JpdGVjYiA9IG51bGw7XG5cbiAgaWYgKCF1dGlsLmlzTnVsbE9yVW5kZWZpbmVkKGRhdGEpKVxuICAgIHN0cmVhbS5wdXNoKGRhdGEpO1xuXG4gIGlmIChjYilcbiAgICBjYihlcik7XG5cbiAgdmFyIHJzID0gc3RyZWFtLl9yZWFkYWJsZVN0YXRlO1xuICBycy5yZWFkaW5nID0gZmFsc2U7XG4gIGlmIChycy5uZWVkUmVhZGFibGUgfHwgcnMubGVuZ3RoIDwgcnMuaGlnaFdhdGVyTWFyaykge1xuICAgIHN0cmVhbS5fcmVhZChycy5oaWdoV2F0ZXJNYXJrKTtcbiAgfVxufVxuXG5cbmZ1bmN0aW9uIFRyYW5zZm9ybShvcHRpb25zKSB7XG4gIGlmICghKHRoaXMgaW5zdGFuY2VvZiBUcmFuc2Zvcm0pKVxuICAgIHJldHVybiBuZXcgVHJhbnNmb3JtKG9wdGlvbnMpO1xuXG4gIER1cGxleC5jYWxsKHRoaXMsIG9wdGlvbnMpO1xuXG4gIHRoaXMuX3RyYW5zZm9ybVN0YXRlID0gbmV3IFRyYW5zZm9ybVN0YXRlKG9wdGlvbnMsIHRoaXMpO1xuXG4gIC8vIHdoZW4gdGhlIHdyaXRhYmxlIHNpZGUgZmluaXNoZXMsIHRoZW4gZmx1c2ggb3V0IGFueXRoaW5nIHJlbWFpbmluZy5cbiAgdmFyIHN0cmVhbSA9IHRoaXM7XG5cbiAgLy8gc3RhcnQgb3V0IGFza2luZyBmb3IgYSByZWFkYWJsZSBldmVudCBvbmNlIGRhdGEgaXMgdHJhbnNmb3JtZWQuXG4gIHRoaXMuX3JlYWRhYmxlU3RhdGUubmVlZFJlYWRhYmxlID0gdHJ1ZTtcblxuICAvLyB3ZSBoYXZlIGltcGxlbWVudGVkIHRoZSBfcmVhZCBtZXRob2QsIGFuZCBkb25lIHRoZSBvdGhlciB0aGluZ3NcbiAgLy8gdGhhdCBSZWFkYWJsZSB3YW50cyBiZWZvcmUgdGhlIGZpcnN0IF9yZWFkIGNhbGwsIHNvIHVuc2V0IHRoZVxuICAvLyBzeW5jIGd1YXJkIGZsYWcuXG4gIHRoaXMuX3JlYWRhYmxlU3RhdGUuc3luYyA9IGZhbHNlO1xuXG4gIHRoaXMub25jZSgncHJlZmluaXNoJywgZnVuY3Rpb24oKSB7XG4gICAgaWYgKHV0aWwuaXNGdW5jdGlvbih0aGlzLl9mbHVzaCkpXG4gICAgICB0aGlzLl9mbHVzaChmdW5jdGlvbihlcikge1xuICAgICAgICBkb25lKHN0cmVhbSwgZXIpO1xuICAgICAgfSk7XG4gICAgZWxzZVxuICAgICAgZG9uZShzdHJlYW0pO1xuICB9KTtcbn1cblxuVHJhbnNmb3JtLnByb3RvdHlwZS5wdXNoID0gZnVuY3Rpb24oY2h1bmssIGVuY29kaW5nKSB7XG4gIHRoaXMuX3RyYW5zZm9ybVN0YXRlLm5lZWRUcmFuc2Zvcm0gPSBmYWxzZTtcbiAgcmV0dXJuIER1cGxleC5wcm90b3R5cGUucHVzaC5jYWxsKHRoaXMsIGNodW5rLCBlbmNvZGluZyk7XG59O1xuXG4vLyBUaGlzIGlzIHRoZSBwYXJ0IHdoZXJlIHlvdSBkbyBzdHVmZiFcbi8vIG92ZXJyaWRlIHRoaXMgZnVuY3Rpb24gaW4gaW1wbGVtZW50YXRpb24gY2xhc3Nlcy5cbi8vICdjaHVuaycgaXMgYW4gaW5wdXQgY2h1bmsuXG4vL1xuLy8gQ2FsbCBgcHVzaChuZXdDaHVuaylgIHRvIHBhc3MgYWxvbmcgdHJhbnNmb3JtZWQgb3V0cHV0XG4vLyB0byB0aGUgcmVhZGFibGUgc2lkZS4gIFlvdSBtYXkgY2FsbCAncHVzaCcgemVybyBvciBtb3JlIHRpbWVzLlxuLy9cbi8vIENhbGwgYGNiKGVycilgIHdoZW4geW91IGFyZSBkb25lIHdpdGggdGhpcyBjaHVuay4gIElmIHlvdSBwYXNzXG4vLyBhbiBlcnJvciwgdGhlbiB0aGF0J2xsIHB1dCB0aGUgaHVydCBvbiB0aGUgd2hvbGUgb3BlcmF0aW9uLiAgSWYgeW91XG4vLyBuZXZlciBjYWxsIGNiKCksIHRoZW4geW91J2xsIG5ldmVyIGdldCBhbm90aGVyIGNodW5rLlxuVHJhbnNmb3JtLnByb3RvdHlwZS5fdHJhbnNmb3JtID0gZnVuY3Rpb24oY2h1bmssIGVuY29kaW5nLCBjYikge1xuICB0aHJvdyBuZXcgRXJyb3IoJ25vdCBpbXBsZW1lbnRlZCcpO1xufTtcblxuVHJhbnNmb3JtLnByb3RvdHlwZS5fd3JpdGUgPSBmdW5jdGlvbihjaHVuaywgZW5jb2RpbmcsIGNiKSB7XG4gIHZhciB0cyA9IHRoaXMuX3RyYW5zZm9ybVN0YXRlO1xuICB0cy53cml0ZWNiID0gY2I7XG4gIHRzLndyaXRlY2h1bmsgPSBjaHVuaztcbiAgdHMud3JpdGVlbmNvZGluZyA9IGVuY29kaW5nO1xuICBpZiAoIXRzLnRyYW5zZm9ybWluZykge1xuICAgIHZhciBycyA9IHRoaXMuX3JlYWRhYmxlU3RhdGU7XG4gICAgaWYgKHRzLm5lZWRUcmFuc2Zvcm0gfHxcbiAgICAgICAgcnMubmVlZFJlYWRhYmxlIHx8XG4gICAgICAgIHJzLmxlbmd0aCA8IHJzLmhpZ2hXYXRlck1hcmspXG4gICAgICB0aGlzLl9yZWFkKHJzLmhpZ2hXYXRlck1hcmspO1xuICB9XG59O1xuXG4vLyBEb2Vzbid0IG1hdHRlciB3aGF0IHRoZSBhcmdzIGFyZSBoZXJlLlxuLy8gX3RyYW5zZm9ybSBkb2VzIGFsbCB0aGUgd29yay5cbi8vIFRoYXQgd2UgZ290IGhlcmUgbWVhbnMgdGhhdCB0aGUgcmVhZGFibGUgc2lkZSB3YW50cyBtb3JlIGRhdGEuXG5UcmFuc2Zvcm0ucHJvdG90eXBlLl9yZWFkID0gZnVuY3Rpb24obikge1xuICB2YXIgdHMgPSB0aGlzLl90cmFuc2Zvcm1TdGF0ZTtcblxuICBpZiAoIXV0aWwuaXNOdWxsKHRzLndyaXRlY2h1bmspICYmIHRzLndyaXRlY2IgJiYgIXRzLnRyYW5zZm9ybWluZykge1xuICAgIHRzLnRyYW5zZm9ybWluZyA9IHRydWU7XG4gICAgdGhpcy5fdHJhbnNmb3JtKHRzLndyaXRlY2h1bmssIHRzLndyaXRlZW5jb2RpbmcsIHRzLmFmdGVyVHJhbnNmb3JtKTtcbiAgfSBlbHNlIHtcbiAgICAvLyBtYXJrIHRoYXQgd2UgbmVlZCBhIHRyYW5zZm9ybSwgc28gdGhhdCBhbnkgZGF0YSB0aGF0IGNvbWVzIGluXG4gICAgLy8gd2lsbCBnZXQgcHJvY2Vzc2VkLCBub3cgdGhhdCB3ZSd2ZSBhc2tlZCBmb3IgaXQuXG4gICAgdHMubmVlZFRyYW5zZm9ybSA9IHRydWU7XG4gIH1cbn07XG5cblxuZnVuY3Rpb24gZG9uZShzdHJlYW0sIGVyKSB7XG4gIGlmIChlcilcbiAgICByZXR1cm4gc3RyZWFtLmVtaXQoJ2Vycm9yJywgZXIpO1xuXG4gIC8vIGlmIHRoZXJlJ3Mgbm90aGluZyBpbiB0aGUgd3JpdGUgYnVmZmVyLCB0aGVuIHRoYXQgbWVhbnNcbiAgLy8gdGhhdCBub3RoaW5nIG1vcmUgd2lsbCBldmVyIGJlIHByb3ZpZGVkXG4gIHZhciB3cyA9IHN0cmVhbS5fd3JpdGFibGVTdGF0ZTtcbiAgdmFyIHRzID0gc3RyZWFtLl90cmFuc2Zvcm1TdGF0ZTtcblxuICBpZiAod3MubGVuZ3RoKVxuICAgIHRocm93IG5ldyBFcnJvcignY2FsbGluZyB0cmFuc2Zvcm0gZG9uZSB3aGVuIHdzLmxlbmd0aCAhPSAwJyk7XG5cbiAgaWYgKHRzLnRyYW5zZm9ybWluZylcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ2NhbGxpbmcgdHJhbnNmb3JtIGRvbmUgd2hlbiBzdGlsbCB0cmFuc2Zvcm1pbmcnKTtcblxuICByZXR1cm4gc3RyZWFtLnB1c2gobnVsbCk7XG59XG4iLCIvLyBDb3B5cmlnaHQgSm95ZW50LCBJbmMuIGFuZCBvdGhlciBOb2RlIGNvbnRyaWJ1dG9ycy5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYVxuLy8gY29weSBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZVxuLy8gXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nXG4vLyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsXG4vLyBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0XG4vLyBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGVcbi8vIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkXG4vLyBpbiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTXG4vLyBPUiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GXG4vLyBNRVJDSEFOVEFCSUxJVFksIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOXG4vLyBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSxcbi8vIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUlxuLy8gT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRVxuLy8gVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cblxuLy8gQSBiaXQgc2ltcGxlciB0aGFuIHJlYWRhYmxlIHN0cmVhbXMuXG4vLyBJbXBsZW1lbnQgYW4gYXN5bmMgLl93cml0ZShjaHVuaywgY2IpLCBhbmQgaXQnbGwgaGFuZGxlIGFsbFxuLy8gdGhlIGRyYWluIGV2ZW50IGVtaXNzaW9uIGFuZCBidWZmZXJpbmcuXG5cbm1vZHVsZS5leHBvcnRzID0gV3JpdGFibGU7XG5cbi8qPHJlcGxhY2VtZW50PiovXG52YXIgQnVmZmVyID0gcmVxdWlyZSgnYnVmZmVyJykuQnVmZmVyO1xuLyo8L3JlcGxhY2VtZW50PiovXG5cbldyaXRhYmxlLldyaXRhYmxlU3RhdGUgPSBXcml0YWJsZVN0YXRlO1xuXG5cbi8qPHJlcGxhY2VtZW50PiovXG52YXIgdXRpbCA9IHJlcXVpcmUoJ2NvcmUtdXRpbC1pcycpO1xudXRpbC5pbmhlcml0cyA9IHJlcXVpcmUoJ2luaGVyaXRzJyk7XG4vKjwvcmVwbGFjZW1lbnQ+Ki9cblxudmFyIFN0cmVhbSA9IHJlcXVpcmUoJ3N0cmVhbScpO1xuXG51dGlsLmluaGVyaXRzKFdyaXRhYmxlLCBTdHJlYW0pO1xuXG5mdW5jdGlvbiBXcml0ZVJlcShjaHVuaywgZW5jb2RpbmcsIGNiKSB7XG4gIHRoaXMuY2h1bmsgPSBjaHVuaztcbiAgdGhpcy5lbmNvZGluZyA9IGVuY29kaW5nO1xuICB0aGlzLmNhbGxiYWNrID0gY2I7XG59XG5cbmZ1bmN0aW9uIFdyaXRhYmxlU3RhdGUob3B0aW9ucywgc3RyZWFtKSB7XG4gIHZhciBEdXBsZXggPSByZXF1aXJlKCcuL19zdHJlYW1fZHVwbGV4Jyk7XG5cbiAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG5cbiAgLy8gdGhlIHBvaW50IGF0IHdoaWNoIHdyaXRlKCkgc3RhcnRzIHJldHVybmluZyBmYWxzZVxuICAvLyBOb3RlOiAwIGlzIGEgdmFsaWQgdmFsdWUsIG1lYW5zIHRoYXQgd2UgYWx3YXlzIHJldHVybiBmYWxzZSBpZlxuICAvLyB0aGUgZW50aXJlIGJ1ZmZlciBpcyBub3QgZmx1c2hlZCBpbW1lZGlhdGVseSBvbiB3cml0ZSgpXG4gIHZhciBod20gPSBvcHRpb25zLmhpZ2hXYXRlck1hcms7XG4gIHZhciBkZWZhdWx0SHdtID0gb3B0aW9ucy5vYmplY3RNb2RlID8gMTYgOiAxNiAqIDEwMjQ7XG4gIHRoaXMuaGlnaFdhdGVyTWFyayA9IChod20gfHwgaHdtID09PSAwKSA/IGh3bSA6IGRlZmF1bHRId207XG5cbiAgLy8gb2JqZWN0IHN0cmVhbSBmbGFnIHRvIGluZGljYXRlIHdoZXRoZXIgb3Igbm90IHRoaXMgc3RyZWFtXG4gIC8vIGNvbnRhaW5zIGJ1ZmZlcnMgb3Igb2JqZWN0cy5cbiAgdGhpcy5vYmplY3RNb2RlID0gISFvcHRpb25zLm9iamVjdE1vZGU7XG5cbiAgaWYgKHN0cmVhbSBpbnN0YW5jZW9mIER1cGxleClcbiAgICB0aGlzLm9iamVjdE1vZGUgPSB0aGlzLm9iamVjdE1vZGUgfHwgISFvcHRpb25zLndyaXRhYmxlT2JqZWN0TW9kZTtcblxuICAvLyBjYXN0IHRvIGludHMuXG4gIHRoaXMuaGlnaFdhdGVyTWFyayA9IH5+dGhpcy5oaWdoV2F0ZXJNYXJrO1xuXG4gIHRoaXMubmVlZERyYWluID0gZmFsc2U7XG4gIC8vIGF0IHRoZSBzdGFydCBvZiBjYWxsaW5nIGVuZCgpXG4gIHRoaXMuZW5kaW5nID0gZmFsc2U7XG4gIC8vIHdoZW4gZW5kKCkgaGFzIGJlZW4gY2FsbGVkLCBhbmQgcmV0dXJuZWRcbiAgdGhpcy5lbmRlZCA9IGZhbHNlO1xuICAvLyB3aGVuICdmaW5pc2gnIGlzIGVtaXR0ZWRcbiAgdGhpcy5maW5pc2hlZCA9IGZhbHNlO1xuXG4gIC8vIHNob3VsZCB3ZSBkZWNvZGUgc3RyaW5ncyBpbnRvIGJ1ZmZlcnMgYmVmb3JlIHBhc3NpbmcgdG8gX3dyaXRlP1xuICAvLyB0aGlzIGlzIGhlcmUgc28gdGhhdCBzb21lIG5vZGUtY29yZSBzdHJlYW1zIGNhbiBvcHRpbWl6ZSBzdHJpbmdcbiAgLy8gaGFuZGxpbmcgYXQgYSBsb3dlciBsZXZlbC5cbiAgdmFyIG5vRGVjb2RlID0gb3B0aW9ucy5kZWNvZGVTdHJpbmdzID09PSBmYWxzZTtcbiAgdGhpcy5kZWNvZGVTdHJpbmdzID0gIW5vRGVjb2RlO1xuXG4gIC8vIENyeXB0byBpcyBraW5kIG9mIG9sZCBhbmQgY3J1c3R5LiAgSGlzdG9yaWNhbGx5LCBpdHMgZGVmYXVsdCBzdHJpbmdcbiAgLy8gZW5jb2RpbmcgaXMgJ2JpbmFyeScgc28gd2UgaGF2ZSB0byBtYWtlIHRoaXMgY29uZmlndXJhYmxlLlxuICAvLyBFdmVyeXRoaW5nIGVsc2UgaW4gdGhlIHVuaXZlcnNlIHVzZXMgJ3V0ZjgnLCB0aG91Z2guXG4gIHRoaXMuZGVmYXVsdEVuY29kaW5nID0gb3B0aW9ucy5kZWZhdWx0RW5jb2RpbmcgfHwgJ3V0ZjgnO1xuXG4gIC8vIG5vdCBhbiBhY3R1YWwgYnVmZmVyIHdlIGtlZXAgdHJhY2sgb2YsIGJ1dCBhIG1lYXN1cmVtZW50XG4gIC8vIG9mIGhvdyBtdWNoIHdlJ3JlIHdhaXRpbmcgdG8gZ2V0IHB1c2hlZCB0byBzb21lIHVuZGVybHlpbmdcbiAgLy8gc29ja2V0IG9yIGZpbGUuXG4gIHRoaXMubGVuZ3RoID0gMDtcblxuICAvLyBhIGZsYWcgdG8gc2VlIHdoZW4gd2UncmUgaW4gdGhlIG1pZGRsZSBvZiBhIHdyaXRlLlxuICB0aGlzLndyaXRpbmcgPSBmYWxzZTtcblxuICAvLyB3aGVuIHRydWUgYWxsIHdyaXRlcyB3aWxsIGJlIGJ1ZmZlcmVkIHVudGlsIC51bmNvcmsoKSBjYWxsXG4gIHRoaXMuY29ya2VkID0gMDtcblxuICAvLyBhIGZsYWcgdG8gYmUgYWJsZSB0byB0ZWxsIGlmIHRoZSBvbndyaXRlIGNiIGlzIGNhbGxlZCBpbW1lZGlhdGVseSxcbiAgLy8gb3Igb24gYSBsYXRlciB0aWNrLiAgV2Ugc2V0IHRoaXMgdG8gdHJ1ZSBhdCBmaXJzdCwgYmVjYXVzZSBhbnlcbiAgLy8gYWN0aW9ucyB0aGF0IHNob3VsZG4ndCBoYXBwZW4gdW50aWwgXCJsYXRlclwiIHNob3VsZCBnZW5lcmFsbHkgYWxzb1xuICAvLyBub3QgaGFwcGVuIGJlZm9yZSB0aGUgZmlyc3Qgd3JpdGUgY2FsbC5cbiAgdGhpcy5zeW5jID0gdHJ1ZTtcblxuICAvLyBhIGZsYWcgdG8ga25vdyBpZiB3ZSdyZSBwcm9jZXNzaW5nIHByZXZpb3VzbHkgYnVmZmVyZWQgaXRlbXMsIHdoaWNoXG4gIC8vIG1heSBjYWxsIHRoZSBfd3JpdGUoKSBjYWxsYmFjayBpbiB0aGUgc2FtZSB0aWNrLCBzbyB0aGF0IHdlIGRvbid0XG4gIC8vIGVuZCB1cCBpbiBhbiBvdmVybGFwcGVkIG9ud3JpdGUgc2l0dWF0aW9uLlxuICB0aGlzLmJ1ZmZlclByb2Nlc3NpbmcgPSBmYWxzZTtcblxuICAvLyB0aGUgY2FsbGJhY2sgdGhhdCdzIHBhc3NlZCB0byBfd3JpdGUoY2h1bmssY2IpXG4gIHRoaXMub253cml0ZSA9IGZ1bmN0aW9uKGVyKSB7XG4gICAgb253cml0ZShzdHJlYW0sIGVyKTtcbiAgfTtcblxuICAvLyB0aGUgY2FsbGJhY2sgdGhhdCB0aGUgdXNlciBzdXBwbGllcyB0byB3cml0ZShjaHVuayxlbmNvZGluZyxjYilcbiAgdGhpcy53cml0ZWNiID0gbnVsbDtcblxuICAvLyB0aGUgYW1vdW50IHRoYXQgaXMgYmVpbmcgd3JpdHRlbiB3aGVuIF93cml0ZSBpcyBjYWxsZWQuXG4gIHRoaXMud3JpdGVsZW4gPSAwO1xuXG4gIHRoaXMuYnVmZmVyID0gW107XG5cbiAgLy8gbnVtYmVyIG9mIHBlbmRpbmcgdXNlci1zdXBwbGllZCB3cml0ZSBjYWxsYmFja3NcbiAgLy8gdGhpcyBtdXN0IGJlIDAgYmVmb3JlICdmaW5pc2gnIGNhbiBiZSBlbWl0dGVkXG4gIHRoaXMucGVuZGluZ2NiID0gMDtcblxuICAvLyBlbWl0IHByZWZpbmlzaCBpZiB0aGUgb25seSB0aGluZyB3ZSdyZSB3YWl0aW5nIGZvciBpcyBfd3JpdGUgY2JzXG4gIC8vIFRoaXMgaXMgcmVsZXZhbnQgZm9yIHN5bmNocm9ub3VzIFRyYW5zZm9ybSBzdHJlYW1zXG4gIHRoaXMucHJlZmluaXNoZWQgPSBmYWxzZTtcblxuICAvLyBUcnVlIGlmIHRoZSBlcnJvciB3YXMgYWxyZWFkeSBlbWl0dGVkIGFuZCBzaG91bGQgbm90IGJlIHRocm93biBhZ2FpblxuICB0aGlzLmVycm9yRW1pdHRlZCA9IGZhbHNlO1xufVxuXG5mdW5jdGlvbiBXcml0YWJsZShvcHRpb25zKSB7XG4gIHZhciBEdXBsZXggPSByZXF1aXJlKCcuL19zdHJlYW1fZHVwbGV4Jyk7XG5cbiAgLy8gV3JpdGFibGUgY3RvciBpcyBhcHBsaWVkIHRvIER1cGxleGVzLCB0aG91Z2ggdGhleSdyZSBub3RcbiAgLy8gaW5zdGFuY2VvZiBXcml0YWJsZSwgdGhleSdyZSBpbnN0YW5jZW9mIFJlYWRhYmxlLlxuICBpZiAoISh0aGlzIGluc3RhbmNlb2YgV3JpdGFibGUpICYmICEodGhpcyBpbnN0YW5jZW9mIER1cGxleCkpXG4gICAgcmV0dXJuIG5ldyBXcml0YWJsZShvcHRpb25zKTtcblxuICB0aGlzLl93cml0YWJsZVN0YXRlID0gbmV3IFdyaXRhYmxlU3RhdGUob3B0aW9ucywgdGhpcyk7XG5cbiAgLy8gbGVnYWN5LlxuICB0aGlzLndyaXRhYmxlID0gdHJ1ZTtcblxuICBTdHJlYW0uY2FsbCh0aGlzKTtcbn1cblxuLy8gT3RoZXJ3aXNlIHBlb3BsZSBjYW4gcGlwZSBXcml0YWJsZSBzdHJlYW1zLCB3aGljaCBpcyBqdXN0IHdyb25nLlxuV3JpdGFibGUucHJvdG90eXBlLnBpcGUgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5lbWl0KCdlcnJvcicsIG5ldyBFcnJvcignQ2Fubm90IHBpcGUuIE5vdCByZWFkYWJsZS4nKSk7XG59O1xuXG5cbmZ1bmN0aW9uIHdyaXRlQWZ0ZXJFbmQoc3RyZWFtLCBzdGF0ZSwgY2IpIHtcbiAgdmFyIGVyID0gbmV3IEVycm9yKCd3cml0ZSBhZnRlciBlbmQnKTtcbiAgLy8gVE9ETzogZGVmZXIgZXJyb3IgZXZlbnRzIGNvbnNpc3RlbnRseSBldmVyeXdoZXJlLCBub3QganVzdCB0aGUgY2JcbiAgc3RyZWFtLmVtaXQoJ2Vycm9yJywgZXIpO1xuICBwcm9jZXNzLm5leHRUaWNrKGZ1bmN0aW9uKCkge1xuICAgIGNiKGVyKTtcbiAgfSk7XG59XG5cbi8vIElmIHdlIGdldCBzb21ldGhpbmcgdGhhdCBpcyBub3QgYSBidWZmZXIsIHN0cmluZywgbnVsbCwgb3IgdW5kZWZpbmVkLFxuLy8gYW5kIHdlJ3JlIG5vdCBpbiBvYmplY3RNb2RlLCB0aGVuIHRoYXQncyBhbiBlcnJvci5cbi8vIE90aGVyd2lzZSBzdHJlYW0gY2h1bmtzIGFyZSBhbGwgY29uc2lkZXJlZCB0byBiZSBvZiBsZW5ndGg9MSwgYW5kIHRoZVxuLy8gd2F0ZXJtYXJrcyBkZXRlcm1pbmUgaG93IG1hbnkgb2JqZWN0cyB0byBrZWVwIGluIHRoZSBidWZmZXIsIHJhdGhlciB0aGFuXG4vLyBob3cgbWFueSBieXRlcyBvciBjaGFyYWN0ZXJzLlxuZnVuY3Rpb24gdmFsaWRDaHVuayhzdHJlYW0sIHN0YXRlLCBjaHVuaywgY2IpIHtcbiAgdmFyIHZhbGlkID0gdHJ1ZTtcbiAgaWYgKCF1dGlsLmlzQnVmZmVyKGNodW5rKSAmJlxuICAgICAgIXV0aWwuaXNTdHJpbmcoY2h1bmspICYmXG4gICAgICAhdXRpbC5pc051bGxPclVuZGVmaW5lZChjaHVuaykgJiZcbiAgICAgICFzdGF0ZS5vYmplY3RNb2RlKSB7XG4gICAgdmFyIGVyID0gbmV3IFR5cGVFcnJvcignSW52YWxpZCBub24tc3RyaW5nL2J1ZmZlciBjaHVuaycpO1xuICAgIHN0cmVhbS5lbWl0KCdlcnJvcicsIGVyKTtcbiAgICBwcm9jZXNzLm5leHRUaWNrKGZ1bmN0aW9uKCkge1xuICAgICAgY2IoZXIpO1xuICAgIH0pO1xuICAgIHZhbGlkID0gZmFsc2U7XG4gIH1cbiAgcmV0dXJuIHZhbGlkO1xufVxuXG5Xcml0YWJsZS5wcm90b3R5cGUud3JpdGUgPSBmdW5jdGlvbihjaHVuaywgZW5jb2RpbmcsIGNiKSB7XG4gIHZhciBzdGF0ZSA9IHRoaXMuX3dyaXRhYmxlU3RhdGU7XG4gIHZhciByZXQgPSBmYWxzZTtcblxuICBpZiAodXRpbC5pc0Z1bmN0aW9uKGVuY29kaW5nKSkge1xuICAgIGNiID0gZW5jb2Rpbmc7XG4gICAgZW5jb2RpbmcgPSBudWxsO1xuICB9XG5cbiAgaWYgKHV0aWwuaXNCdWZmZXIoY2h1bmspKVxuICAgIGVuY29kaW5nID0gJ2J1ZmZlcic7XG4gIGVsc2UgaWYgKCFlbmNvZGluZylcbiAgICBlbmNvZGluZyA9IHN0YXRlLmRlZmF1bHRFbmNvZGluZztcblxuICBpZiAoIXV0aWwuaXNGdW5jdGlvbihjYikpXG4gICAgY2IgPSBmdW5jdGlvbigpIHt9O1xuXG4gIGlmIChzdGF0ZS5lbmRlZClcbiAgICB3cml0ZUFmdGVyRW5kKHRoaXMsIHN0YXRlLCBjYik7XG4gIGVsc2UgaWYgKHZhbGlkQ2h1bmsodGhpcywgc3RhdGUsIGNodW5rLCBjYikpIHtcbiAgICBzdGF0ZS5wZW5kaW5nY2IrKztcbiAgICByZXQgPSB3cml0ZU9yQnVmZmVyKHRoaXMsIHN0YXRlLCBjaHVuaywgZW5jb2RpbmcsIGNiKTtcbiAgfVxuXG4gIHJldHVybiByZXQ7XG59O1xuXG5Xcml0YWJsZS5wcm90b3R5cGUuY29yayA9IGZ1bmN0aW9uKCkge1xuICB2YXIgc3RhdGUgPSB0aGlzLl93cml0YWJsZVN0YXRlO1xuXG4gIHN0YXRlLmNvcmtlZCsrO1xufTtcblxuV3JpdGFibGUucHJvdG90eXBlLnVuY29yayA9IGZ1bmN0aW9uKCkge1xuICB2YXIgc3RhdGUgPSB0aGlzLl93cml0YWJsZVN0YXRlO1xuXG4gIGlmIChzdGF0ZS5jb3JrZWQpIHtcbiAgICBzdGF0ZS5jb3JrZWQtLTtcblxuICAgIGlmICghc3RhdGUud3JpdGluZyAmJlxuICAgICAgICAhc3RhdGUuY29ya2VkICYmXG4gICAgICAgICFzdGF0ZS5maW5pc2hlZCAmJlxuICAgICAgICAhc3RhdGUuYnVmZmVyUHJvY2Vzc2luZyAmJlxuICAgICAgICBzdGF0ZS5idWZmZXIubGVuZ3RoKVxuICAgICAgY2xlYXJCdWZmZXIodGhpcywgc3RhdGUpO1xuICB9XG59O1xuXG5mdW5jdGlvbiBkZWNvZGVDaHVuayhzdGF0ZSwgY2h1bmssIGVuY29kaW5nKSB7XG4gIGlmICghc3RhdGUub2JqZWN0TW9kZSAmJlxuICAgICAgc3RhdGUuZGVjb2RlU3RyaW5ncyAhPT0gZmFsc2UgJiZcbiAgICAgIHV0aWwuaXNTdHJpbmcoY2h1bmspKSB7XG4gICAgY2h1bmsgPSBuZXcgQnVmZmVyKGNodW5rLCBlbmNvZGluZyk7XG4gIH1cbiAgcmV0dXJuIGNodW5rO1xufVxuXG4vLyBpZiB3ZSdyZSBhbHJlYWR5IHdyaXRpbmcgc29tZXRoaW5nLCB0aGVuIGp1c3QgcHV0IHRoaXNcbi8vIGluIHRoZSBxdWV1ZSwgYW5kIHdhaXQgb3VyIHR1cm4uICBPdGhlcndpc2UsIGNhbGwgX3dyaXRlXG4vLyBJZiB3ZSByZXR1cm4gZmFsc2UsIHRoZW4gd2UgbmVlZCBhIGRyYWluIGV2ZW50LCBzbyBzZXQgdGhhdCBmbGFnLlxuZnVuY3Rpb24gd3JpdGVPckJ1ZmZlcihzdHJlYW0sIHN0YXRlLCBjaHVuaywgZW5jb2RpbmcsIGNiKSB7XG4gIGNodW5rID0gZGVjb2RlQ2h1bmsoc3RhdGUsIGNodW5rLCBlbmNvZGluZyk7XG4gIGlmICh1dGlsLmlzQnVmZmVyKGNodW5rKSlcbiAgICBlbmNvZGluZyA9ICdidWZmZXInO1xuICB2YXIgbGVuID0gc3RhdGUub2JqZWN0TW9kZSA/IDEgOiBjaHVuay5sZW5ndGg7XG5cbiAgc3RhdGUubGVuZ3RoICs9IGxlbjtcblxuICB2YXIgcmV0ID0gc3RhdGUubGVuZ3RoIDwgc3RhdGUuaGlnaFdhdGVyTWFyaztcbiAgLy8gd2UgbXVzdCBlbnN1cmUgdGhhdCBwcmV2aW91cyBuZWVkRHJhaW4gd2lsbCBub3QgYmUgcmVzZXQgdG8gZmFsc2UuXG4gIGlmICghcmV0KVxuICAgIHN0YXRlLm5lZWREcmFpbiA9IHRydWU7XG5cbiAgaWYgKHN0YXRlLndyaXRpbmcgfHwgc3RhdGUuY29ya2VkKVxuICAgIHN0YXRlLmJ1ZmZlci5wdXNoKG5ldyBXcml0ZVJlcShjaHVuaywgZW5jb2RpbmcsIGNiKSk7XG4gIGVsc2VcbiAgICBkb1dyaXRlKHN0cmVhbSwgc3RhdGUsIGZhbHNlLCBsZW4sIGNodW5rLCBlbmNvZGluZywgY2IpO1xuXG4gIHJldHVybiByZXQ7XG59XG5cbmZ1bmN0aW9uIGRvV3JpdGUoc3RyZWFtLCBzdGF0ZSwgd3JpdGV2LCBsZW4sIGNodW5rLCBlbmNvZGluZywgY2IpIHtcbiAgc3RhdGUud3JpdGVsZW4gPSBsZW47XG4gIHN0YXRlLndyaXRlY2IgPSBjYjtcbiAgc3RhdGUud3JpdGluZyA9IHRydWU7XG4gIHN0YXRlLnN5bmMgPSB0cnVlO1xuICBpZiAod3JpdGV2KVxuICAgIHN0cmVhbS5fd3JpdGV2KGNodW5rLCBzdGF0ZS5vbndyaXRlKTtcbiAgZWxzZVxuICAgIHN0cmVhbS5fd3JpdGUoY2h1bmssIGVuY29kaW5nLCBzdGF0ZS5vbndyaXRlKTtcbiAgc3RhdGUuc3luYyA9IGZhbHNlO1xufVxuXG5mdW5jdGlvbiBvbndyaXRlRXJyb3Ioc3RyZWFtLCBzdGF0ZSwgc3luYywgZXIsIGNiKSB7XG4gIGlmIChzeW5jKVxuICAgIHByb2Nlc3MubmV4dFRpY2soZnVuY3Rpb24oKSB7XG4gICAgICBzdGF0ZS5wZW5kaW5nY2ItLTtcbiAgICAgIGNiKGVyKTtcbiAgICB9KTtcbiAgZWxzZSB7XG4gICAgc3RhdGUucGVuZGluZ2NiLS07XG4gICAgY2IoZXIpO1xuICB9XG5cbiAgc3RyZWFtLl93cml0YWJsZVN0YXRlLmVycm9yRW1pdHRlZCA9IHRydWU7XG4gIHN0cmVhbS5lbWl0KCdlcnJvcicsIGVyKTtcbn1cblxuZnVuY3Rpb24gb253cml0ZVN0YXRlVXBkYXRlKHN0YXRlKSB7XG4gIHN0YXRlLndyaXRpbmcgPSBmYWxzZTtcbiAgc3RhdGUud3JpdGVjYiA9IG51bGw7XG4gIHN0YXRlLmxlbmd0aCAtPSBzdGF0ZS53cml0ZWxlbjtcbiAgc3RhdGUud3JpdGVsZW4gPSAwO1xufVxuXG5mdW5jdGlvbiBvbndyaXRlKHN0cmVhbSwgZXIpIHtcbiAgdmFyIHN0YXRlID0gc3RyZWFtLl93cml0YWJsZVN0YXRlO1xuICB2YXIgc3luYyA9IHN0YXRlLnN5bmM7XG4gIHZhciBjYiA9IHN0YXRlLndyaXRlY2I7XG5cbiAgb253cml0ZVN0YXRlVXBkYXRlKHN0YXRlKTtcblxuICBpZiAoZXIpXG4gICAgb253cml0ZUVycm9yKHN0cmVhbSwgc3RhdGUsIHN5bmMsIGVyLCBjYik7XG4gIGVsc2Uge1xuICAgIC8vIENoZWNrIGlmIHdlJ3JlIGFjdHVhbGx5IHJlYWR5IHRvIGZpbmlzaCwgYnV0IGRvbid0IGVtaXQgeWV0XG4gICAgdmFyIGZpbmlzaGVkID0gbmVlZEZpbmlzaChzdHJlYW0sIHN0YXRlKTtcblxuICAgIGlmICghZmluaXNoZWQgJiZcbiAgICAgICAgIXN0YXRlLmNvcmtlZCAmJlxuICAgICAgICAhc3RhdGUuYnVmZmVyUHJvY2Vzc2luZyAmJlxuICAgICAgICBzdGF0ZS5idWZmZXIubGVuZ3RoKSB7XG4gICAgICBjbGVhckJ1ZmZlcihzdHJlYW0sIHN0YXRlKTtcbiAgICB9XG5cbiAgICBpZiAoc3luYykge1xuICAgICAgcHJvY2Vzcy5uZXh0VGljayhmdW5jdGlvbigpIHtcbiAgICAgICAgYWZ0ZXJXcml0ZShzdHJlYW0sIHN0YXRlLCBmaW5pc2hlZCwgY2IpO1xuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGFmdGVyV3JpdGUoc3RyZWFtLCBzdGF0ZSwgZmluaXNoZWQsIGNiKTtcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gYWZ0ZXJXcml0ZShzdHJlYW0sIHN0YXRlLCBmaW5pc2hlZCwgY2IpIHtcbiAgaWYgKCFmaW5pc2hlZClcbiAgICBvbndyaXRlRHJhaW4oc3RyZWFtLCBzdGF0ZSk7XG4gIHN0YXRlLnBlbmRpbmdjYi0tO1xuICBjYigpO1xuICBmaW5pc2hNYXliZShzdHJlYW0sIHN0YXRlKTtcbn1cblxuLy8gTXVzdCBmb3JjZSBjYWxsYmFjayB0byBiZSBjYWxsZWQgb24gbmV4dFRpY2ssIHNvIHRoYXQgd2UgZG9uJ3Rcbi8vIGVtaXQgJ2RyYWluJyBiZWZvcmUgdGhlIHdyaXRlKCkgY29uc3VtZXIgZ2V0cyB0aGUgJ2ZhbHNlJyByZXR1cm5cbi8vIHZhbHVlLCBhbmQgaGFzIGEgY2hhbmNlIHRvIGF0dGFjaCBhICdkcmFpbicgbGlzdGVuZXIuXG5mdW5jdGlvbiBvbndyaXRlRHJhaW4oc3RyZWFtLCBzdGF0ZSkge1xuICBpZiAoc3RhdGUubGVuZ3RoID09PSAwICYmIHN0YXRlLm5lZWREcmFpbikge1xuICAgIHN0YXRlLm5lZWREcmFpbiA9IGZhbHNlO1xuICAgIHN0cmVhbS5lbWl0KCdkcmFpbicpO1xuICB9XG59XG5cblxuLy8gaWYgdGhlcmUncyBzb21ldGhpbmcgaW4gdGhlIGJ1ZmZlciB3YWl0aW5nLCB0aGVuIHByb2Nlc3MgaXRcbmZ1bmN0aW9uIGNsZWFyQnVmZmVyKHN0cmVhbSwgc3RhdGUpIHtcbiAgc3RhdGUuYnVmZmVyUHJvY2Vzc2luZyA9IHRydWU7XG5cbiAgaWYgKHN0cmVhbS5fd3JpdGV2ICYmIHN0YXRlLmJ1ZmZlci5sZW5ndGggPiAxKSB7XG4gICAgLy8gRmFzdCBjYXNlLCB3cml0ZSBldmVyeXRoaW5nIHVzaW5nIF93cml0ZXYoKVxuICAgIHZhciBjYnMgPSBbXTtcbiAgICBmb3IgKHZhciBjID0gMDsgYyA8IHN0YXRlLmJ1ZmZlci5sZW5ndGg7IGMrKylcbiAgICAgIGNicy5wdXNoKHN0YXRlLmJ1ZmZlcltjXS5jYWxsYmFjayk7XG5cbiAgICAvLyBjb3VudCB0aGUgb25lIHdlIGFyZSBhZGRpbmcsIGFzIHdlbGwuXG4gICAgLy8gVE9ETyhpc2FhY3MpIGNsZWFuIHRoaXMgdXBcbiAgICBzdGF0ZS5wZW5kaW5nY2IrKztcbiAgICBkb1dyaXRlKHN0cmVhbSwgc3RhdGUsIHRydWUsIHN0YXRlLmxlbmd0aCwgc3RhdGUuYnVmZmVyLCAnJywgZnVuY3Rpb24oZXJyKSB7XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNicy5sZW5ndGg7IGkrKykge1xuICAgICAgICBzdGF0ZS5wZW5kaW5nY2ItLTtcbiAgICAgICAgY2JzW2ldKGVycik7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICAvLyBDbGVhciBidWZmZXJcbiAgICBzdGF0ZS5idWZmZXIgPSBbXTtcbiAgfSBlbHNlIHtcbiAgICAvLyBTbG93IGNhc2UsIHdyaXRlIGNodW5rcyBvbmUtYnktb25lXG4gICAgZm9yICh2YXIgYyA9IDA7IGMgPCBzdGF0ZS5idWZmZXIubGVuZ3RoOyBjKyspIHtcbiAgICAgIHZhciBlbnRyeSA9IHN0YXRlLmJ1ZmZlcltjXTtcbiAgICAgIHZhciBjaHVuayA9IGVudHJ5LmNodW5rO1xuICAgICAgdmFyIGVuY29kaW5nID0gZW50cnkuZW5jb2Rpbmc7XG4gICAgICB2YXIgY2IgPSBlbnRyeS5jYWxsYmFjaztcbiAgICAgIHZhciBsZW4gPSBzdGF0ZS5vYmplY3RNb2RlID8gMSA6IGNodW5rLmxlbmd0aDtcblxuICAgICAgZG9Xcml0ZShzdHJlYW0sIHN0YXRlLCBmYWxzZSwgbGVuLCBjaHVuaywgZW5jb2RpbmcsIGNiKTtcblxuICAgICAgLy8gaWYgd2UgZGlkbid0IGNhbGwgdGhlIG9ud3JpdGUgaW1tZWRpYXRlbHksIHRoZW5cbiAgICAgIC8vIGl0IG1lYW5zIHRoYXQgd2UgbmVlZCB0byB3YWl0IHVudGlsIGl0IGRvZXMuXG4gICAgICAvLyBhbHNvLCB0aGF0IG1lYW5zIHRoYXQgdGhlIGNodW5rIGFuZCBjYiBhcmUgY3VycmVudGx5XG4gICAgICAvLyBiZWluZyBwcm9jZXNzZWQsIHNvIG1vdmUgdGhlIGJ1ZmZlciBjb3VudGVyIHBhc3QgdGhlbS5cbiAgICAgIGlmIChzdGF0ZS53cml0aW5nKSB7XG4gICAgICAgIGMrKztcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGMgPCBzdGF0ZS5idWZmZXIubGVuZ3RoKVxuICAgICAgc3RhdGUuYnVmZmVyID0gc3RhdGUuYnVmZmVyLnNsaWNlKGMpO1xuICAgIGVsc2VcbiAgICAgIHN0YXRlLmJ1ZmZlci5sZW5ndGggPSAwO1xuICB9XG5cbiAgc3RhdGUuYnVmZmVyUHJvY2Vzc2luZyA9IGZhbHNlO1xufVxuXG5Xcml0YWJsZS5wcm90b3R5cGUuX3dyaXRlID0gZnVuY3Rpb24oY2h1bmssIGVuY29kaW5nLCBjYikge1xuICBjYihuZXcgRXJyb3IoJ25vdCBpbXBsZW1lbnRlZCcpKTtcblxufTtcblxuV3JpdGFibGUucHJvdG90eXBlLl93cml0ZXYgPSBudWxsO1xuXG5Xcml0YWJsZS5wcm90b3R5cGUuZW5kID0gZnVuY3Rpb24oY2h1bmssIGVuY29kaW5nLCBjYikge1xuICB2YXIgc3RhdGUgPSB0aGlzLl93cml0YWJsZVN0YXRlO1xuXG4gIGlmICh1dGlsLmlzRnVuY3Rpb24oY2h1bmspKSB7XG4gICAgY2IgPSBjaHVuaztcbiAgICBjaHVuayA9IG51bGw7XG4gICAgZW5jb2RpbmcgPSBudWxsO1xuICB9IGVsc2UgaWYgKHV0aWwuaXNGdW5jdGlvbihlbmNvZGluZykpIHtcbiAgICBjYiA9IGVuY29kaW5nO1xuICAgIGVuY29kaW5nID0gbnVsbDtcbiAgfVxuXG4gIGlmICghdXRpbC5pc051bGxPclVuZGVmaW5lZChjaHVuaykpXG4gICAgdGhpcy53cml0ZShjaHVuaywgZW5jb2RpbmcpO1xuXG4gIC8vIC5lbmQoKSBmdWxseSB1bmNvcmtzXG4gIGlmIChzdGF0ZS5jb3JrZWQpIHtcbiAgICBzdGF0ZS5jb3JrZWQgPSAxO1xuICAgIHRoaXMudW5jb3JrKCk7XG4gIH1cblxuICAvLyBpZ25vcmUgdW5uZWNlc3NhcnkgZW5kKCkgY2FsbHMuXG4gIGlmICghc3RhdGUuZW5kaW5nICYmICFzdGF0ZS5maW5pc2hlZClcbiAgICBlbmRXcml0YWJsZSh0aGlzLCBzdGF0ZSwgY2IpO1xufTtcblxuXG5mdW5jdGlvbiBuZWVkRmluaXNoKHN0cmVhbSwgc3RhdGUpIHtcbiAgcmV0dXJuIChzdGF0ZS5lbmRpbmcgJiZcbiAgICAgICAgICBzdGF0ZS5sZW5ndGggPT09IDAgJiZcbiAgICAgICAgICAhc3RhdGUuZmluaXNoZWQgJiZcbiAgICAgICAgICAhc3RhdGUud3JpdGluZyk7XG59XG5cbmZ1bmN0aW9uIHByZWZpbmlzaChzdHJlYW0sIHN0YXRlKSB7XG4gIGlmICghc3RhdGUucHJlZmluaXNoZWQpIHtcbiAgICBzdGF0ZS5wcmVmaW5pc2hlZCA9IHRydWU7XG4gICAgc3RyZWFtLmVtaXQoJ3ByZWZpbmlzaCcpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGZpbmlzaE1heWJlKHN0cmVhbSwgc3RhdGUpIHtcbiAgdmFyIG5lZWQgPSBuZWVkRmluaXNoKHN0cmVhbSwgc3RhdGUpO1xuICBpZiAobmVlZCkge1xuICAgIGlmIChzdGF0ZS5wZW5kaW5nY2IgPT09IDApIHtcbiAgICAgIHByZWZpbmlzaChzdHJlYW0sIHN0YXRlKTtcbiAgICAgIHN0YXRlLmZpbmlzaGVkID0gdHJ1ZTtcbiAgICAgIHN0cmVhbS5lbWl0KCdmaW5pc2gnKTtcbiAgICB9IGVsc2VcbiAgICAgIHByZWZpbmlzaChzdHJlYW0sIHN0YXRlKTtcbiAgfVxuICByZXR1cm4gbmVlZDtcbn1cblxuZnVuY3Rpb24gZW5kV3JpdGFibGUoc3RyZWFtLCBzdGF0ZSwgY2IpIHtcbiAgc3RhdGUuZW5kaW5nID0gdHJ1ZTtcbiAgZmluaXNoTWF5YmUoc3RyZWFtLCBzdGF0ZSk7XG4gIGlmIChjYikge1xuICAgIGlmIChzdGF0ZS5maW5pc2hlZClcbiAgICAgIHByb2Nlc3MubmV4dFRpY2soY2IpO1xuICAgIGVsc2VcbiAgICAgIHN0cmVhbS5vbmNlKCdmaW5pc2gnLCBjYik7XG4gIH1cbiAgc3RhdGUuZW5kZWQgPSB0cnVlO1xufVxuIiwiLy8gQ29weXJpZ2h0IEpveWVudCwgSW5jLiBhbmQgb3RoZXIgTm9kZSBjb250cmlidXRvcnMuXG4vL1xuLy8gUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGFcbi8vIGNvcHkgb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGVcbi8vIFwiU29mdHdhcmVcIiksIHRvIGRlYWwgaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZ1xuLy8gd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHMgdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLFxuLy8gZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGwgY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdFxuLy8gcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpcyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlXG4vLyBmb2xsb3dpbmcgY29uZGl0aW9uczpcbi8vXG4vLyBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZFxuLy8gaW4gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4vL1xuLy8gVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTU1xuLy8gT1IgSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRlxuLy8gTUVSQ0hBTlRBQklMSVRZLCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTlxuLy8gTk8gRVZFTlQgU0hBTEwgVEhFIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sXG4vLyBEQU1BR0VTIE9SIE9USEVSIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1Jcbi8vIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLCBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEVcbi8vIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEUgU09GVFdBUkUuXG5cbi8vIE5PVEU6IFRoZXNlIHR5cGUgY2hlY2tpbmcgZnVuY3Rpb25zIGludGVudGlvbmFsbHkgZG9uJ3QgdXNlIGBpbnN0YW5jZW9mYFxuLy8gYmVjYXVzZSBpdCBpcyBmcmFnaWxlIGFuZCBjYW4gYmUgZWFzaWx5IGZha2VkIHdpdGggYE9iamVjdC5jcmVhdGUoKWAuXG5mdW5jdGlvbiBpc0FycmF5KGFyKSB7XG4gIHJldHVybiBBcnJheS5pc0FycmF5KGFyKTtcbn1cbmV4cG9ydHMuaXNBcnJheSA9IGlzQXJyYXk7XG5cbmZ1bmN0aW9uIGlzQm9vbGVhbihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdib29sZWFuJztcbn1cbmV4cG9ydHMuaXNCb29sZWFuID0gaXNCb29sZWFuO1xuXG5mdW5jdGlvbiBpc051bGwoYXJnKSB7XG4gIHJldHVybiBhcmcgPT09IG51bGw7XG59XG5leHBvcnRzLmlzTnVsbCA9IGlzTnVsbDtcblxuZnVuY3Rpb24gaXNOdWxsT3JVbmRlZmluZWQoYXJnKSB7XG4gIHJldHVybiBhcmcgPT0gbnVsbDtcbn1cbmV4cG9ydHMuaXNOdWxsT3JVbmRlZmluZWQgPSBpc051bGxPclVuZGVmaW5lZDtcblxuZnVuY3Rpb24gaXNOdW1iZXIoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnbnVtYmVyJztcbn1cbmV4cG9ydHMuaXNOdW1iZXIgPSBpc051bWJlcjtcblxuZnVuY3Rpb24gaXNTdHJpbmcoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnc3RyaW5nJztcbn1cbmV4cG9ydHMuaXNTdHJpbmcgPSBpc1N0cmluZztcblxuZnVuY3Rpb24gaXNTeW1ib2woYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnc3ltYm9sJztcbn1cbmV4cG9ydHMuaXNTeW1ib2wgPSBpc1N5bWJvbDtcblxuZnVuY3Rpb24gaXNVbmRlZmluZWQoYXJnKSB7XG4gIHJldHVybiBhcmcgPT09IHZvaWQgMDtcbn1cbmV4cG9ydHMuaXNVbmRlZmluZWQgPSBpc1VuZGVmaW5lZDtcblxuZnVuY3Rpb24gaXNSZWdFeHAocmUpIHtcbiAgcmV0dXJuIGlzT2JqZWN0KHJlKSAmJiBvYmplY3RUb1N0cmluZyhyZSkgPT09ICdbb2JqZWN0IFJlZ0V4cF0nO1xufVxuZXhwb3J0cy5pc1JlZ0V4cCA9IGlzUmVnRXhwO1xuXG5mdW5jdGlvbiBpc09iamVjdChhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdvYmplY3QnICYmIGFyZyAhPT0gbnVsbDtcbn1cbmV4cG9ydHMuaXNPYmplY3QgPSBpc09iamVjdDtcblxuZnVuY3Rpb24gaXNEYXRlKGQpIHtcbiAgcmV0dXJuIGlzT2JqZWN0KGQpICYmIG9iamVjdFRvU3RyaW5nKGQpID09PSAnW29iamVjdCBEYXRlXSc7XG59XG5leHBvcnRzLmlzRGF0ZSA9IGlzRGF0ZTtcblxuZnVuY3Rpb24gaXNFcnJvcihlKSB7XG4gIHJldHVybiBpc09iamVjdChlKSAmJlxuICAgICAgKG9iamVjdFRvU3RyaW5nKGUpID09PSAnW29iamVjdCBFcnJvcl0nIHx8IGUgaW5zdGFuY2VvZiBFcnJvcik7XG59XG5leHBvcnRzLmlzRXJyb3IgPSBpc0Vycm9yO1xuXG5mdW5jdGlvbiBpc0Z1bmN0aW9uKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ2Z1bmN0aW9uJztcbn1cbmV4cG9ydHMuaXNGdW5jdGlvbiA9IGlzRnVuY3Rpb247XG5cbmZ1bmN0aW9uIGlzUHJpbWl0aXZlKGFyZykge1xuICByZXR1cm4gYXJnID09PSBudWxsIHx8XG4gICAgICAgICB0eXBlb2YgYXJnID09PSAnYm9vbGVhbicgfHxcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICdudW1iZXInIHx8XG4gICAgICAgICB0eXBlb2YgYXJnID09PSAnc3RyaW5nJyB8fFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ3N5bWJvbCcgfHwgIC8vIEVTNiBzeW1ib2xcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICd1bmRlZmluZWQnO1xufVxuZXhwb3J0cy5pc1ByaW1pdGl2ZSA9IGlzUHJpbWl0aXZlO1xuXG5mdW5jdGlvbiBpc0J1ZmZlcihhcmcpIHtcbiAgcmV0dXJuIEJ1ZmZlci5pc0J1ZmZlcihhcmcpO1xufVxuZXhwb3J0cy5pc0J1ZmZlciA9IGlzQnVmZmVyO1xuXG5mdW5jdGlvbiBvYmplY3RUb1N0cmluZyhvKSB7XG4gIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwobyk7XG59IiwibW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKFwiLi9saWIvX3N0cmVhbV9wYXNzdGhyb3VnaC5qc1wiKVxuIiwiZXhwb3J0cyA9IG1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnLi9saWIvX3N0cmVhbV9yZWFkYWJsZS5qcycpO1xuZXhwb3J0cy5TdHJlYW0gPSByZXF1aXJlKCdzdHJlYW0nKTtcbmV4cG9ydHMuUmVhZGFibGUgPSBleHBvcnRzO1xuZXhwb3J0cy5Xcml0YWJsZSA9IHJlcXVpcmUoJy4vbGliL19zdHJlYW1fd3JpdGFibGUuanMnKTtcbmV4cG9ydHMuRHVwbGV4ID0gcmVxdWlyZSgnLi9saWIvX3N0cmVhbV9kdXBsZXguanMnKTtcbmV4cG9ydHMuVHJhbnNmb3JtID0gcmVxdWlyZSgnLi9saWIvX3N0cmVhbV90cmFuc2Zvcm0uanMnKTtcbmV4cG9ydHMuUGFzc1Rocm91Z2ggPSByZXF1aXJlKCcuL2xpYi9fc3RyZWFtX3Bhc3N0aHJvdWdoLmpzJyk7XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoXCIuL2xpYi9fc3RyZWFtX3RyYW5zZm9ybS5qc1wiKVxuIiwibW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKFwiLi9saWIvX3N0cmVhbV93cml0YWJsZS5qc1wiKVxuIiwiLy8gQ29weXJpZ2h0IEpveWVudCwgSW5jLiBhbmQgb3RoZXIgTm9kZSBjb250cmlidXRvcnMuXG4vL1xuLy8gUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGFcbi8vIGNvcHkgb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGVcbi8vIFwiU29mdHdhcmVcIiksIHRvIGRlYWwgaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZ1xuLy8gd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHMgdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLFxuLy8gZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGwgY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdFxuLy8gcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpcyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlXG4vLyBmb2xsb3dpbmcgY29uZGl0aW9uczpcbi8vXG4vLyBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZFxuLy8gaW4gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4vL1xuLy8gVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTU1xuLy8gT1IgSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRlxuLy8gTUVSQ0hBTlRBQklMSVRZLCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTlxuLy8gTk8gRVZFTlQgU0hBTEwgVEhFIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sXG4vLyBEQU1BR0VTIE9SIE9USEVSIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1Jcbi8vIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLCBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEVcbi8vIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEUgU09GVFdBUkUuXG5cbm1vZHVsZS5leHBvcnRzID0gU3RyZWFtO1xuXG52YXIgRUUgPSByZXF1aXJlKCdldmVudHMnKS5FdmVudEVtaXR0ZXI7XG52YXIgaW5oZXJpdHMgPSByZXF1aXJlKCdpbmhlcml0cycpO1xuXG5pbmhlcml0cyhTdHJlYW0sIEVFKTtcblN0cmVhbS5SZWFkYWJsZSA9IHJlcXVpcmUoJ3JlYWRhYmxlLXN0cmVhbS9yZWFkYWJsZS5qcycpO1xuU3RyZWFtLldyaXRhYmxlID0gcmVxdWlyZSgncmVhZGFibGUtc3RyZWFtL3dyaXRhYmxlLmpzJyk7XG5TdHJlYW0uRHVwbGV4ID0gcmVxdWlyZSgncmVhZGFibGUtc3RyZWFtL2R1cGxleC5qcycpO1xuU3RyZWFtLlRyYW5zZm9ybSA9IHJlcXVpcmUoJ3JlYWRhYmxlLXN0cmVhbS90cmFuc2Zvcm0uanMnKTtcblN0cmVhbS5QYXNzVGhyb3VnaCA9IHJlcXVpcmUoJ3JlYWRhYmxlLXN0cmVhbS9wYXNzdGhyb3VnaC5qcycpO1xuXG4vLyBCYWNrd2FyZHMtY29tcGF0IHdpdGggbm9kZSAwLjQueFxuU3RyZWFtLlN0cmVhbSA9IFN0cmVhbTtcblxuXG5cbi8vIG9sZC1zdHlsZSBzdHJlYW1zLiAgTm90ZSB0aGF0IHRoZSBwaXBlIG1ldGhvZCAodGhlIG9ubHkgcmVsZXZhbnRcbi8vIHBhcnQgb2YgdGhpcyBjbGFzcykgaXMgb3ZlcnJpZGRlbiBpbiB0aGUgUmVhZGFibGUgY2xhc3MuXG5cbmZ1bmN0aW9uIFN0cmVhbSgpIHtcbiAgRUUuY2FsbCh0aGlzKTtcbn1cblxuU3RyZWFtLnByb3RvdHlwZS5waXBlID0gZnVuY3Rpb24oZGVzdCwgb3B0aW9ucykge1xuICB2YXIgc291cmNlID0gdGhpcztcblxuICBmdW5jdGlvbiBvbmRhdGEoY2h1bmspIHtcbiAgICBpZiAoZGVzdC53cml0YWJsZSkge1xuICAgICAgaWYgKGZhbHNlID09PSBkZXN0LndyaXRlKGNodW5rKSAmJiBzb3VyY2UucGF1c2UpIHtcbiAgICAgICAgc291cmNlLnBhdXNlKCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgc291cmNlLm9uKCdkYXRhJywgb25kYXRhKTtcblxuICBmdW5jdGlvbiBvbmRyYWluKCkge1xuICAgIGlmIChzb3VyY2UucmVhZGFibGUgJiYgc291cmNlLnJlc3VtZSkge1xuICAgICAgc291cmNlLnJlc3VtZSgpO1xuICAgIH1cbiAgfVxuXG4gIGRlc3Qub24oJ2RyYWluJywgb25kcmFpbik7XG5cbiAgLy8gSWYgdGhlICdlbmQnIG9wdGlvbiBpcyBub3Qgc3VwcGxpZWQsIGRlc3QuZW5kKCkgd2lsbCBiZSBjYWxsZWQgd2hlblxuICAvLyBzb3VyY2UgZ2V0cyB0aGUgJ2VuZCcgb3IgJ2Nsb3NlJyBldmVudHMuICBPbmx5IGRlc3QuZW5kKCkgb25jZS5cbiAgaWYgKCFkZXN0Ll9pc1N0ZGlvICYmICghb3B0aW9ucyB8fCBvcHRpb25zLmVuZCAhPT0gZmFsc2UpKSB7XG4gICAgc291cmNlLm9uKCdlbmQnLCBvbmVuZCk7XG4gICAgc291cmNlLm9uKCdjbG9zZScsIG9uY2xvc2UpO1xuICB9XG5cbiAgdmFyIGRpZE9uRW5kID0gZmFsc2U7XG4gIGZ1bmN0aW9uIG9uZW5kKCkge1xuICAgIGlmIChkaWRPbkVuZCkgcmV0dXJuO1xuICAgIGRpZE9uRW5kID0gdHJ1ZTtcblxuICAgIGRlc3QuZW5kKCk7XG4gIH1cblxuXG4gIGZ1bmN0aW9uIG9uY2xvc2UoKSB7XG4gICAgaWYgKGRpZE9uRW5kKSByZXR1cm47XG4gICAgZGlkT25FbmQgPSB0cnVlO1xuXG4gICAgaWYgKHR5cGVvZiBkZXN0LmRlc3Ryb3kgPT09ICdmdW5jdGlvbicpIGRlc3QuZGVzdHJveSgpO1xuICB9XG5cbiAgLy8gZG9uJ3QgbGVhdmUgZGFuZ2xpbmcgcGlwZXMgd2hlbiB0aGVyZSBhcmUgZXJyb3JzLlxuICBmdW5jdGlvbiBvbmVycm9yKGVyKSB7XG4gICAgY2xlYW51cCgpO1xuICAgIGlmIChFRS5saXN0ZW5lckNvdW50KHRoaXMsICdlcnJvcicpID09PSAwKSB7XG4gICAgICB0aHJvdyBlcjsgLy8gVW5oYW5kbGVkIHN0cmVhbSBlcnJvciBpbiBwaXBlLlxuICAgIH1cbiAgfVxuXG4gIHNvdXJjZS5vbignZXJyb3InLCBvbmVycm9yKTtcbiAgZGVzdC5vbignZXJyb3InLCBvbmVycm9yKTtcblxuICAvLyByZW1vdmUgYWxsIHRoZSBldmVudCBsaXN0ZW5lcnMgdGhhdCB3ZXJlIGFkZGVkLlxuICBmdW5jdGlvbiBjbGVhbnVwKCkge1xuICAgIHNvdXJjZS5yZW1vdmVMaXN0ZW5lcignZGF0YScsIG9uZGF0YSk7XG4gICAgZGVzdC5yZW1vdmVMaXN0ZW5lcignZHJhaW4nLCBvbmRyYWluKTtcblxuICAgIHNvdXJjZS5yZW1vdmVMaXN0ZW5lcignZW5kJywgb25lbmQpO1xuICAgIHNvdXJjZS5yZW1vdmVMaXN0ZW5lcignY2xvc2UnLCBvbmNsb3NlKTtcblxuICAgIHNvdXJjZS5yZW1vdmVMaXN0ZW5lcignZXJyb3InLCBvbmVycm9yKTtcbiAgICBkZXN0LnJlbW92ZUxpc3RlbmVyKCdlcnJvcicsIG9uZXJyb3IpO1xuXG4gICAgc291cmNlLnJlbW92ZUxpc3RlbmVyKCdlbmQnLCBjbGVhbnVwKTtcbiAgICBzb3VyY2UucmVtb3ZlTGlzdGVuZXIoJ2Nsb3NlJywgY2xlYW51cCk7XG5cbiAgICBkZXN0LnJlbW92ZUxpc3RlbmVyKCdjbG9zZScsIGNsZWFudXApO1xuICB9XG5cbiAgc291cmNlLm9uKCdlbmQnLCBjbGVhbnVwKTtcbiAgc291cmNlLm9uKCdjbG9zZScsIGNsZWFudXApO1xuXG4gIGRlc3Qub24oJ2Nsb3NlJywgY2xlYW51cCk7XG5cbiAgZGVzdC5lbWl0KCdwaXBlJywgc291cmNlKTtcblxuICAvLyBBbGxvdyBmb3IgdW5peC1saWtlIHVzYWdlOiBBLnBpcGUoQikucGlwZShDKVxuICByZXR1cm4gZGVzdDtcbn07XG4iLCIvLyBDb3B5cmlnaHQgSm95ZW50LCBJbmMuIGFuZCBvdGhlciBOb2RlIGNvbnRyaWJ1dG9ycy5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYVxuLy8gY29weSBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZVxuLy8gXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nXG4vLyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsXG4vLyBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0XG4vLyBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGVcbi8vIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkXG4vLyBpbiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTXG4vLyBPUiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GXG4vLyBNRVJDSEFOVEFCSUxJVFksIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOXG4vLyBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSxcbi8vIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUlxuLy8gT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRVxuLy8gVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cblxudmFyIEJ1ZmZlciA9IHJlcXVpcmUoJ2J1ZmZlcicpLkJ1ZmZlcjtcblxudmFyIGlzQnVmZmVyRW5jb2RpbmcgPSBCdWZmZXIuaXNFbmNvZGluZ1xuICB8fCBmdW5jdGlvbihlbmNvZGluZykge1xuICAgICAgIHN3aXRjaCAoZW5jb2RpbmcgJiYgZW5jb2RpbmcudG9Mb3dlckNhc2UoKSkge1xuICAgICAgICAgY2FzZSAnaGV4JzogY2FzZSAndXRmOCc6IGNhc2UgJ3V0Zi04JzogY2FzZSAnYXNjaWknOiBjYXNlICdiaW5hcnknOiBjYXNlICdiYXNlNjQnOiBjYXNlICd1Y3MyJzogY2FzZSAndWNzLTInOiBjYXNlICd1dGYxNmxlJzogY2FzZSAndXRmLTE2bGUnOiBjYXNlICdyYXcnOiByZXR1cm4gdHJ1ZTtcbiAgICAgICAgIGRlZmF1bHQ6IHJldHVybiBmYWxzZTtcbiAgICAgICB9XG4gICAgIH1cblxuXG5mdW5jdGlvbiBhc3NlcnRFbmNvZGluZyhlbmNvZGluZykge1xuICBpZiAoZW5jb2RpbmcgJiYgIWlzQnVmZmVyRW5jb2RpbmcoZW5jb2RpbmcpKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdVbmtub3duIGVuY29kaW5nOiAnICsgZW5jb2RpbmcpO1xuICB9XG59XG5cbi8vIFN0cmluZ0RlY29kZXIgcHJvdmlkZXMgYW4gaW50ZXJmYWNlIGZvciBlZmZpY2llbnRseSBzcGxpdHRpbmcgYSBzZXJpZXMgb2Zcbi8vIGJ1ZmZlcnMgaW50byBhIHNlcmllcyBvZiBKUyBzdHJpbmdzIHdpdGhvdXQgYnJlYWtpbmcgYXBhcnQgbXVsdGktYnl0ZVxuLy8gY2hhcmFjdGVycy4gQ0VTVS04IGlzIGhhbmRsZWQgYXMgcGFydCBvZiB0aGUgVVRGLTggZW5jb2RpbmcuXG4vL1xuLy8gQFRPRE8gSGFuZGxpbmcgYWxsIGVuY29kaW5ncyBpbnNpZGUgYSBzaW5nbGUgb2JqZWN0IG1ha2VzIGl0IHZlcnkgZGlmZmljdWx0XG4vLyB0byByZWFzb24gYWJvdXQgdGhpcyBjb2RlLCBzbyBpdCBzaG91bGQgYmUgc3BsaXQgdXAgaW4gdGhlIGZ1dHVyZS5cbi8vIEBUT0RPIFRoZXJlIHNob3VsZCBiZSBhIHV0Zjgtc3RyaWN0IGVuY29kaW5nIHRoYXQgcmVqZWN0cyBpbnZhbGlkIFVURi04IGNvZGVcbi8vIHBvaW50cyBhcyB1c2VkIGJ5IENFU1UtOC5cbnZhciBTdHJpbmdEZWNvZGVyID0gZXhwb3J0cy5TdHJpbmdEZWNvZGVyID0gZnVuY3Rpb24oZW5jb2RpbmcpIHtcbiAgdGhpcy5lbmNvZGluZyA9IChlbmNvZGluZyB8fCAndXRmOCcpLnRvTG93ZXJDYXNlKCkucmVwbGFjZSgvWy1fXS8sICcnKTtcbiAgYXNzZXJ0RW5jb2RpbmcoZW5jb2RpbmcpO1xuICBzd2l0Y2ggKHRoaXMuZW5jb2RpbmcpIHtcbiAgICBjYXNlICd1dGY4JzpcbiAgICAgIC8vIENFU1UtOCByZXByZXNlbnRzIGVhY2ggb2YgU3Vycm9nYXRlIFBhaXIgYnkgMy1ieXRlc1xuICAgICAgdGhpcy5zdXJyb2dhdGVTaXplID0gMztcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgJ3VjczInOlxuICAgIGNhc2UgJ3V0ZjE2bGUnOlxuICAgICAgLy8gVVRGLTE2IHJlcHJlc2VudHMgZWFjaCBvZiBTdXJyb2dhdGUgUGFpciBieSAyLWJ5dGVzXG4gICAgICB0aGlzLnN1cnJvZ2F0ZVNpemUgPSAyO1xuICAgICAgdGhpcy5kZXRlY3RJbmNvbXBsZXRlQ2hhciA9IHV0ZjE2RGV0ZWN0SW5jb21wbGV0ZUNoYXI7XG4gICAgICBicmVhaztcbiAgICBjYXNlICdiYXNlNjQnOlxuICAgICAgLy8gQmFzZS02NCBzdG9yZXMgMyBieXRlcyBpbiA0IGNoYXJzLCBhbmQgcGFkcyB0aGUgcmVtYWluZGVyLlxuICAgICAgdGhpcy5zdXJyb2dhdGVTaXplID0gMztcbiAgICAgIHRoaXMuZGV0ZWN0SW5jb21wbGV0ZUNoYXIgPSBiYXNlNjREZXRlY3RJbmNvbXBsZXRlQ2hhcjtcbiAgICAgIGJyZWFrO1xuICAgIGRlZmF1bHQ6XG4gICAgICB0aGlzLndyaXRlID0gcGFzc1Rocm91Z2hXcml0ZTtcbiAgICAgIHJldHVybjtcbiAgfVxuXG4gIC8vIEVub3VnaCBzcGFjZSB0byBzdG9yZSBhbGwgYnl0ZXMgb2YgYSBzaW5nbGUgY2hhcmFjdGVyLiBVVEYtOCBuZWVkcyA0XG4gIC8vIGJ5dGVzLCBidXQgQ0VTVS04IG1heSByZXF1aXJlIHVwIHRvIDYgKDMgYnl0ZXMgcGVyIHN1cnJvZ2F0ZSkuXG4gIHRoaXMuY2hhckJ1ZmZlciA9IG5ldyBCdWZmZXIoNik7XG4gIC8vIE51bWJlciBvZiBieXRlcyByZWNlaXZlZCBmb3IgdGhlIGN1cnJlbnQgaW5jb21wbGV0ZSBtdWx0aS1ieXRlIGNoYXJhY3Rlci5cbiAgdGhpcy5jaGFyUmVjZWl2ZWQgPSAwO1xuICAvLyBOdW1iZXIgb2YgYnl0ZXMgZXhwZWN0ZWQgZm9yIHRoZSBjdXJyZW50IGluY29tcGxldGUgbXVsdGktYnl0ZSBjaGFyYWN0ZXIuXG4gIHRoaXMuY2hhckxlbmd0aCA9IDA7XG59O1xuXG5cbi8vIHdyaXRlIGRlY29kZXMgdGhlIGdpdmVuIGJ1ZmZlciBhbmQgcmV0dXJucyBpdCBhcyBKUyBzdHJpbmcgdGhhdCBpc1xuLy8gZ3VhcmFudGVlZCB0byBub3QgY29udGFpbiBhbnkgcGFydGlhbCBtdWx0aS1ieXRlIGNoYXJhY3RlcnMuIEFueSBwYXJ0aWFsXG4vLyBjaGFyYWN0ZXIgZm91bmQgYXQgdGhlIGVuZCBvZiB0aGUgYnVmZmVyIGlzIGJ1ZmZlcmVkIHVwLCBhbmQgd2lsbCBiZVxuLy8gcmV0dXJuZWQgd2hlbiBjYWxsaW5nIHdyaXRlIGFnYWluIHdpdGggdGhlIHJlbWFpbmluZyBieXRlcy5cbi8vXG4vLyBOb3RlOiBDb252ZXJ0aW5nIGEgQnVmZmVyIGNvbnRhaW5pbmcgYW4gb3JwaGFuIHN1cnJvZ2F0ZSB0byBhIFN0cmluZ1xuLy8gY3VycmVudGx5IHdvcmtzLCBidXQgY29udmVydGluZyBhIFN0cmluZyB0byBhIEJ1ZmZlciAodmlhIGBuZXcgQnVmZmVyYCwgb3Jcbi8vIEJ1ZmZlciN3cml0ZSkgd2lsbCByZXBsYWNlIGluY29tcGxldGUgc3Vycm9nYXRlcyB3aXRoIHRoZSB1bmljb2RlXG4vLyByZXBsYWNlbWVudCBjaGFyYWN0ZXIuIFNlZSBodHRwczovL2NvZGVyZXZpZXcuY2hyb21pdW0ub3JnLzEyMTE3MzAwOS8gLlxuU3RyaW5nRGVjb2Rlci5wcm90b3R5cGUud3JpdGUgPSBmdW5jdGlvbihidWZmZXIpIHtcbiAgdmFyIGNoYXJTdHIgPSAnJztcbiAgLy8gaWYgb3VyIGxhc3Qgd3JpdGUgZW5kZWQgd2l0aCBhbiBpbmNvbXBsZXRlIG11bHRpYnl0ZSBjaGFyYWN0ZXJcbiAgd2hpbGUgKHRoaXMuY2hhckxlbmd0aCkge1xuICAgIC8vIGRldGVybWluZSBob3cgbWFueSByZW1haW5pbmcgYnl0ZXMgdGhpcyBidWZmZXIgaGFzIHRvIG9mZmVyIGZvciB0aGlzIGNoYXJcbiAgICB2YXIgYXZhaWxhYmxlID0gKGJ1ZmZlci5sZW5ndGggPj0gdGhpcy5jaGFyTGVuZ3RoIC0gdGhpcy5jaGFyUmVjZWl2ZWQpID9cbiAgICAgICAgdGhpcy5jaGFyTGVuZ3RoIC0gdGhpcy5jaGFyUmVjZWl2ZWQgOlxuICAgICAgICBidWZmZXIubGVuZ3RoO1xuXG4gICAgLy8gYWRkIHRoZSBuZXcgYnl0ZXMgdG8gdGhlIGNoYXIgYnVmZmVyXG4gICAgYnVmZmVyLmNvcHkodGhpcy5jaGFyQnVmZmVyLCB0aGlzLmNoYXJSZWNlaXZlZCwgMCwgYXZhaWxhYmxlKTtcbiAgICB0aGlzLmNoYXJSZWNlaXZlZCArPSBhdmFpbGFibGU7XG5cbiAgICBpZiAodGhpcy5jaGFyUmVjZWl2ZWQgPCB0aGlzLmNoYXJMZW5ndGgpIHtcbiAgICAgIC8vIHN0aWxsIG5vdCBlbm91Z2ggY2hhcnMgaW4gdGhpcyBidWZmZXI/IHdhaXQgZm9yIG1vcmUgLi4uXG4gICAgICByZXR1cm4gJyc7XG4gICAgfVxuXG4gICAgLy8gcmVtb3ZlIGJ5dGVzIGJlbG9uZ2luZyB0byB0aGUgY3VycmVudCBjaGFyYWN0ZXIgZnJvbSB0aGUgYnVmZmVyXG4gICAgYnVmZmVyID0gYnVmZmVyLnNsaWNlKGF2YWlsYWJsZSwgYnVmZmVyLmxlbmd0aCk7XG5cbiAgICAvLyBnZXQgdGhlIGNoYXJhY3RlciB0aGF0IHdhcyBzcGxpdFxuICAgIGNoYXJTdHIgPSB0aGlzLmNoYXJCdWZmZXIuc2xpY2UoMCwgdGhpcy5jaGFyTGVuZ3RoKS50b1N0cmluZyh0aGlzLmVuY29kaW5nKTtcblxuICAgIC8vIENFU1UtODogbGVhZCBzdXJyb2dhdGUgKEQ4MDAtREJGRikgaXMgYWxzbyB0aGUgaW5jb21wbGV0ZSBjaGFyYWN0ZXJcbiAgICB2YXIgY2hhckNvZGUgPSBjaGFyU3RyLmNoYXJDb2RlQXQoY2hhclN0ci5sZW5ndGggLSAxKTtcbiAgICBpZiAoY2hhckNvZGUgPj0gMHhEODAwICYmIGNoYXJDb2RlIDw9IDB4REJGRikge1xuICAgICAgdGhpcy5jaGFyTGVuZ3RoICs9IHRoaXMuc3Vycm9nYXRlU2l6ZTtcbiAgICAgIGNoYXJTdHIgPSAnJztcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgICB0aGlzLmNoYXJSZWNlaXZlZCA9IHRoaXMuY2hhckxlbmd0aCA9IDA7XG5cbiAgICAvLyBpZiB0aGVyZSBhcmUgbm8gbW9yZSBieXRlcyBpbiB0aGlzIGJ1ZmZlciwganVzdCBlbWl0IG91ciBjaGFyXG4gICAgaWYgKGJ1ZmZlci5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiBjaGFyU3RyO1xuICAgIH1cbiAgICBicmVhaztcbiAgfVxuXG4gIC8vIGRldGVybWluZSBhbmQgc2V0IGNoYXJMZW5ndGggLyBjaGFyUmVjZWl2ZWRcbiAgdGhpcy5kZXRlY3RJbmNvbXBsZXRlQ2hhcihidWZmZXIpO1xuXG4gIHZhciBlbmQgPSBidWZmZXIubGVuZ3RoO1xuICBpZiAodGhpcy5jaGFyTGVuZ3RoKSB7XG4gICAgLy8gYnVmZmVyIHRoZSBpbmNvbXBsZXRlIGNoYXJhY3RlciBieXRlcyB3ZSBnb3RcbiAgICBidWZmZXIuY29weSh0aGlzLmNoYXJCdWZmZXIsIDAsIGJ1ZmZlci5sZW5ndGggLSB0aGlzLmNoYXJSZWNlaXZlZCwgZW5kKTtcbiAgICBlbmQgLT0gdGhpcy5jaGFyUmVjZWl2ZWQ7XG4gIH1cblxuICBjaGFyU3RyICs9IGJ1ZmZlci50b1N0cmluZyh0aGlzLmVuY29kaW5nLCAwLCBlbmQpO1xuXG4gIHZhciBlbmQgPSBjaGFyU3RyLmxlbmd0aCAtIDE7XG4gIHZhciBjaGFyQ29kZSA9IGNoYXJTdHIuY2hhckNvZGVBdChlbmQpO1xuICAvLyBDRVNVLTg6IGxlYWQgc3Vycm9nYXRlIChEODAwLURCRkYpIGlzIGFsc28gdGhlIGluY29tcGxldGUgY2hhcmFjdGVyXG4gIGlmIChjaGFyQ29kZSA+PSAweEQ4MDAgJiYgY2hhckNvZGUgPD0gMHhEQkZGKSB7XG4gICAgdmFyIHNpemUgPSB0aGlzLnN1cnJvZ2F0ZVNpemU7XG4gICAgdGhpcy5jaGFyTGVuZ3RoICs9IHNpemU7XG4gICAgdGhpcy5jaGFyUmVjZWl2ZWQgKz0gc2l6ZTtcbiAgICB0aGlzLmNoYXJCdWZmZXIuY29weSh0aGlzLmNoYXJCdWZmZXIsIHNpemUsIDAsIHNpemUpO1xuICAgIGJ1ZmZlci5jb3B5KHRoaXMuY2hhckJ1ZmZlciwgMCwgMCwgc2l6ZSk7XG4gICAgcmV0dXJuIGNoYXJTdHIuc3Vic3RyaW5nKDAsIGVuZCk7XG4gIH1cblxuICAvLyBvciBqdXN0IGVtaXQgdGhlIGNoYXJTdHJcbiAgcmV0dXJuIGNoYXJTdHI7XG59O1xuXG4vLyBkZXRlY3RJbmNvbXBsZXRlQ2hhciBkZXRlcm1pbmVzIGlmIHRoZXJlIGlzIGFuIGluY29tcGxldGUgVVRGLTggY2hhcmFjdGVyIGF0XG4vLyB0aGUgZW5kIG9mIHRoZSBnaXZlbiBidWZmZXIuIElmIHNvLCBpdCBzZXRzIHRoaXMuY2hhckxlbmd0aCB0byB0aGUgYnl0ZVxuLy8gbGVuZ3RoIHRoYXQgY2hhcmFjdGVyLCBhbmQgc2V0cyB0aGlzLmNoYXJSZWNlaXZlZCB0byB0aGUgbnVtYmVyIG9mIGJ5dGVzXG4vLyB0aGF0IGFyZSBhdmFpbGFibGUgZm9yIHRoaXMgY2hhcmFjdGVyLlxuU3RyaW5nRGVjb2Rlci5wcm90b3R5cGUuZGV0ZWN0SW5jb21wbGV0ZUNoYXIgPSBmdW5jdGlvbihidWZmZXIpIHtcbiAgLy8gZGV0ZXJtaW5lIGhvdyBtYW55IGJ5dGVzIHdlIGhhdmUgdG8gY2hlY2sgYXQgdGhlIGVuZCBvZiB0aGlzIGJ1ZmZlclxuICB2YXIgaSA9IChidWZmZXIubGVuZ3RoID49IDMpID8gMyA6IGJ1ZmZlci5sZW5ndGg7XG5cbiAgLy8gRmlndXJlIG91dCBpZiBvbmUgb2YgdGhlIGxhc3QgaSBieXRlcyBvZiBvdXIgYnVmZmVyIGFubm91bmNlcyBhblxuICAvLyBpbmNvbXBsZXRlIGNoYXIuXG4gIGZvciAoOyBpID4gMDsgaS0tKSB7XG4gICAgdmFyIGMgPSBidWZmZXJbYnVmZmVyLmxlbmd0aCAtIGldO1xuXG4gICAgLy8gU2VlIGh0dHA6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvVVRGLTgjRGVzY3JpcHRpb25cblxuICAgIC8vIDExMFhYWFhYXG4gICAgaWYgKGkgPT0gMSAmJiBjID4+IDUgPT0gMHgwNikge1xuICAgICAgdGhpcy5jaGFyTGVuZ3RoID0gMjtcbiAgICAgIGJyZWFrO1xuICAgIH1cblxuICAgIC8vIDExMTBYWFhYXG4gICAgaWYgKGkgPD0gMiAmJiBjID4+IDQgPT0gMHgwRSkge1xuICAgICAgdGhpcy5jaGFyTGVuZ3RoID0gMztcbiAgICAgIGJyZWFrO1xuICAgIH1cblxuICAgIC8vIDExMTEwWFhYXG4gICAgaWYgKGkgPD0gMyAmJiBjID4+IDMgPT0gMHgxRSkge1xuICAgICAgdGhpcy5jaGFyTGVuZ3RoID0gNDtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuICB0aGlzLmNoYXJSZWNlaXZlZCA9IGk7XG59O1xuXG5TdHJpbmdEZWNvZGVyLnByb3RvdHlwZS5lbmQgPSBmdW5jdGlvbihidWZmZXIpIHtcbiAgdmFyIHJlcyA9ICcnO1xuICBpZiAoYnVmZmVyICYmIGJ1ZmZlci5sZW5ndGgpXG4gICAgcmVzID0gdGhpcy53cml0ZShidWZmZXIpO1xuXG4gIGlmICh0aGlzLmNoYXJSZWNlaXZlZCkge1xuICAgIHZhciBjciA9IHRoaXMuY2hhclJlY2VpdmVkO1xuICAgIHZhciBidWYgPSB0aGlzLmNoYXJCdWZmZXI7XG4gICAgdmFyIGVuYyA9IHRoaXMuZW5jb2Rpbmc7XG4gICAgcmVzICs9IGJ1Zi5zbGljZSgwLCBjcikudG9TdHJpbmcoZW5jKTtcbiAgfVxuXG4gIHJldHVybiByZXM7XG59O1xuXG5mdW5jdGlvbiBwYXNzVGhyb3VnaFdyaXRlKGJ1ZmZlcikge1xuICByZXR1cm4gYnVmZmVyLnRvU3RyaW5nKHRoaXMuZW5jb2RpbmcpO1xufVxuXG5mdW5jdGlvbiB1dGYxNkRldGVjdEluY29tcGxldGVDaGFyKGJ1ZmZlcikge1xuICB0aGlzLmNoYXJSZWNlaXZlZCA9IGJ1ZmZlci5sZW5ndGggJSAyO1xuICB0aGlzLmNoYXJMZW5ndGggPSB0aGlzLmNoYXJSZWNlaXZlZCA/IDIgOiAwO1xufVxuXG5mdW5jdGlvbiBiYXNlNjREZXRlY3RJbmNvbXBsZXRlQ2hhcihidWZmZXIpIHtcbiAgdGhpcy5jaGFyUmVjZWl2ZWQgPSBidWZmZXIubGVuZ3RoICUgMztcbiAgdGhpcy5jaGFyTGVuZ3RoID0gdGhpcy5jaGFyUmVjZWl2ZWQgPyAzIDogMDtcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaXNCdWZmZXIoYXJnKSB7XG4gIHJldHVybiBhcmcgJiYgdHlwZW9mIGFyZyA9PT0gJ29iamVjdCdcbiAgICAmJiB0eXBlb2YgYXJnLmNvcHkgPT09ICdmdW5jdGlvbidcbiAgICAmJiB0eXBlb2YgYXJnLmZpbGwgPT09ICdmdW5jdGlvbidcbiAgICAmJiB0eXBlb2YgYXJnLnJlYWRVSW50OCA9PT0gJ2Z1bmN0aW9uJztcbn0iLCIvLyBDb3B5cmlnaHQgSm95ZW50LCBJbmMuIGFuZCBvdGhlciBOb2RlIGNvbnRyaWJ1dG9ycy5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYVxuLy8gY29weSBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZVxuLy8gXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nXG4vLyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsXG4vLyBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0XG4vLyBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGVcbi8vIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkXG4vLyBpbiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTXG4vLyBPUiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GXG4vLyBNRVJDSEFOVEFCSUxJVFksIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOXG4vLyBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSxcbi8vIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUlxuLy8gT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRVxuLy8gVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cblxudmFyIGZvcm1hdFJlZ0V4cCA9IC8lW3NkaiVdL2c7XG5leHBvcnRzLmZvcm1hdCA9IGZ1bmN0aW9uKGYpIHtcbiAgaWYgKCFpc1N0cmluZyhmKSkge1xuICAgIHZhciBvYmplY3RzID0gW107XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIG9iamVjdHMucHVzaChpbnNwZWN0KGFyZ3VtZW50c1tpXSkpO1xuICAgIH1cbiAgICByZXR1cm4gb2JqZWN0cy5qb2luKCcgJyk7XG4gIH1cblxuICB2YXIgaSA9IDE7XG4gIHZhciBhcmdzID0gYXJndW1lbnRzO1xuICB2YXIgbGVuID0gYXJncy5sZW5ndGg7XG4gIHZhciBzdHIgPSBTdHJpbmcoZikucmVwbGFjZShmb3JtYXRSZWdFeHAsIGZ1bmN0aW9uKHgpIHtcbiAgICBpZiAoeCA9PT0gJyUlJykgcmV0dXJuICclJztcbiAgICBpZiAoaSA+PSBsZW4pIHJldHVybiB4O1xuICAgIHN3aXRjaCAoeCkge1xuICAgICAgY2FzZSAnJXMnOiByZXR1cm4gU3RyaW5nKGFyZ3NbaSsrXSk7XG4gICAgICBjYXNlICclZCc6IHJldHVybiBOdW1iZXIoYXJnc1tpKytdKTtcbiAgICAgIGNhc2UgJyVqJzpcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkoYXJnc1tpKytdKTtcbiAgICAgICAgfSBjYXRjaCAoXykge1xuICAgICAgICAgIHJldHVybiAnW0NpcmN1bGFyXSc7XG4gICAgICAgIH1cbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHJldHVybiB4O1xuICAgIH1cbiAgfSk7XG4gIGZvciAodmFyIHggPSBhcmdzW2ldOyBpIDwgbGVuOyB4ID0gYXJnc1srK2ldKSB7XG4gICAgaWYgKGlzTnVsbCh4KSB8fCAhaXNPYmplY3QoeCkpIHtcbiAgICAgIHN0ciArPSAnICcgKyB4O1xuICAgIH0gZWxzZSB7XG4gICAgICBzdHIgKz0gJyAnICsgaW5zcGVjdCh4KTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHN0cjtcbn07XG5cblxuLy8gTWFyayB0aGF0IGEgbWV0aG9kIHNob3VsZCBub3QgYmUgdXNlZC5cbi8vIFJldHVybnMgYSBtb2RpZmllZCBmdW5jdGlvbiB3aGljaCB3YXJucyBvbmNlIGJ5IGRlZmF1bHQuXG4vLyBJZiAtLW5vLWRlcHJlY2F0aW9uIGlzIHNldCwgdGhlbiBpdCBpcyBhIG5vLW9wLlxuZXhwb3J0cy5kZXByZWNhdGUgPSBmdW5jdGlvbihmbiwgbXNnKSB7XG4gIC8vIEFsbG93IGZvciBkZXByZWNhdGluZyB0aGluZ3MgaW4gdGhlIHByb2Nlc3Mgb2Ygc3RhcnRpbmcgdXAuXG4gIGlmIChpc1VuZGVmaW5lZChnbG9iYWwucHJvY2VzcykpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gZXhwb3J0cy5kZXByZWNhdGUoZm4sIG1zZykuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9O1xuICB9XG5cbiAgaWYgKHByb2Nlc3Mubm9EZXByZWNhdGlvbiA9PT0gdHJ1ZSkge1xuICAgIHJldHVybiBmbjtcbiAgfVxuXG4gIHZhciB3YXJuZWQgPSBmYWxzZTtcbiAgZnVuY3Rpb24gZGVwcmVjYXRlZCgpIHtcbiAgICBpZiAoIXdhcm5lZCkge1xuICAgICAgaWYgKHByb2Nlc3MudGhyb3dEZXByZWNhdGlvbikge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IobXNnKTtcbiAgICAgIH0gZWxzZSBpZiAocHJvY2Vzcy50cmFjZURlcHJlY2F0aW9uKSB7XG4gICAgICAgIGNvbnNvbGUudHJhY2UobXNnKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IobXNnKTtcbiAgICAgIH1cbiAgICAgIHdhcm5lZCA9IHRydWU7XG4gICAgfVxuICAgIHJldHVybiBmbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICB9XG5cbiAgcmV0dXJuIGRlcHJlY2F0ZWQ7XG59O1xuXG5cbnZhciBkZWJ1Z3MgPSB7fTtcbnZhciBkZWJ1Z0Vudmlyb247XG5leHBvcnRzLmRlYnVnbG9nID0gZnVuY3Rpb24oc2V0KSB7XG4gIGlmIChpc1VuZGVmaW5lZChkZWJ1Z0Vudmlyb24pKVxuICAgIGRlYnVnRW52aXJvbiA9IHByb2Nlc3MuZW52Lk5PREVfREVCVUcgfHwgJyc7XG4gIHNldCA9IHNldC50b1VwcGVyQ2FzZSgpO1xuICBpZiAoIWRlYnVnc1tzZXRdKSB7XG4gICAgaWYgKG5ldyBSZWdFeHAoJ1xcXFxiJyArIHNldCArICdcXFxcYicsICdpJykudGVzdChkZWJ1Z0Vudmlyb24pKSB7XG4gICAgICB2YXIgcGlkID0gcHJvY2Vzcy5waWQ7XG4gICAgICBkZWJ1Z3Nbc2V0XSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgbXNnID0gZXhwb3J0cy5mb3JtYXQuYXBwbHkoZXhwb3J0cywgYXJndW1lbnRzKTtcbiAgICAgICAgY29uc29sZS5lcnJvcignJXMgJWQ6ICVzJywgc2V0LCBwaWQsIG1zZyk7XG4gICAgICB9O1xuICAgIH0gZWxzZSB7XG4gICAgICBkZWJ1Z3Nbc2V0XSA9IGZ1bmN0aW9uKCkge307XG4gICAgfVxuICB9XG4gIHJldHVybiBkZWJ1Z3Nbc2V0XTtcbn07XG5cblxuLyoqXG4gKiBFY2hvcyB0aGUgdmFsdWUgb2YgYSB2YWx1ZS4gVHJ5cyB0byBwcmludCB0aGUgdmFsdWUgb3V0XG4gKiBpbiB0aGUgYmVzdCB3YXkgcG9zc2libGUgZ2l2ZW4gdGhlIGRpZmZlcmVudCB0eXBlcy5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqIFRoZSBvYmplY3QgdG8gcHJpbnQgb3V0LlxuICogQHBhcmFtIHtPYmplY3R9IG9wdHMgT3B0aW9uYWwgb3B0aW9ucyBvYmplY3QgdGhhdCBhbHRlcnMgdGhlIG91dHB1dC5cbiAqL1xuLyogbGVnYWN5OiBvYmosIHNob3dIaWRkZW4sIGRlcHRoLCBjb2xvcnMqL1xuZnVuY3Rpb24gaW5zcGVjdChvYmosIG9wdHMpIHtcbiAgLy8gZGVmYXVsdCBvcHRpb25zXG4gIHZhciBjdHggPSB7XG4gICAgc2VlbjogW10sXG4gICAgc3R5bGl6ZTogc3R5bGl6ZU5vQ29sb3JcbiAgfTtcbiAgLy8gbGVnYWN5Li4uXG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID49IDMpIGN0eC5kZXB0aCA9IGFyZ3VtZW50c1syXTtcbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPj0gNCkgY3R4LmNvbG9ycyA9IGFyZ3VtZW50c1szXTtcbiAgaWYgKGlzQm9vbGVhbihvcHRzKSkge1xuICAgIC8vIGxlZ2FjeS4uLlxuICAgIGN0eC5zaG93SGlkZGVuID0gb3B0cztcbiAgfSBlbHNlIGlmIChvcHRzKSB7XG4gICAgLy8gZ290IGFuIFwib3B0aW9uc1wiIG9iamVjdFxuICAgIGV4cG9ydHMuX2V4dGVuZChjdHgsIG9wdHMpO1xuICB9XG4gIC8vIHNldCBkZWZhdWx0IG9wdGlvbnNcbiAgaWYgKGlzVW5kZWZpbmVkKGN0eC5zaG93SGlkZGVuKSkgY3R4LnNob3dIaWRkZW4gPSBmYWxzZTtcbiAgaWYgKGlzVW5kZWZpbmVkKGN0eC5kZXB0aCkpIGN0eC5kZXB0aCA9IDI7XG4gIGlmIChpc1VuZGVmaW5lZChjdHguY29sb3JzKSkgY3R4LmNvbG9ycyA9IGZhbHNlO1xuICBpZiAoaXNVbmRlZmluZWQoY3R4LmN1c3RvbUluc3BlY3QpKSBjdHguY3VzdG9tSW5zcGVjdCA9IHRydWU7XG4gIGlmIChjdHguY29sb3JzKSBjdHguc3R5bGl6ZSA9IHN0eWxpemVXaXRoQ29sb3I7XG4gIHJldHVybiBmb3JtYXRWYWx1ZShjdHgsIG9iaiwgY3R4LmRlcHRoKTtcbn1cbmV4cG9ydHMuaW5zcGVjdCA9IGluc3BlY3Q7XG5cblxuLy8gaHR0cDovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9BTlNJX2VzY2FwZV9jb2RlI2dyYXBoaWNzXG5pbnNwZWN0LmNvbG9ycyA9IHtcbiAgJ2JvbGQnIDogWzEsIDIyXSxcbiAgJ2l0YWxpYycgOiBbMywgMjNdLFxuICAndW5kZXJsaW5lJyA6IFs0LCAyNF0sXG4gICdpbnZlcnNlJyA6IFs3LCAyN10sXG4gICd3aGl0ZScgOiBbMzcsIDM5XSxcbiAgJ2dyZXknIDogWzkwLCAzOV0sXG4gICdibGFjaycgOiBbMzAsIDM5XSxcbiAgJ2JsdWUnIDogWzM0LCAzOV0sXG4gICdjeWFuJyA6IFszNiwgMzldLFxuICAnZ3JlZW4nIDogWzMyLCAzOV0sXG4gICdtYWdlbnRhJyA6IFszNSwgMzldLFxuICAncmVkJyA6IFszMSwgMzldLFxuICAneWVsbG93JyA6IFszMywgMzldXG59O1xuXG4vLyBEb24ndCB1c2UgJ2JsdWUnIG5vdCB2aXNpYmxlIG9uIGNtZC5leGVcbmluc3BlY3Quc3R5bGVzID0ge1xuICAnc3BlY2lhbCc6ICdjeWFuJyxcbiAgJ251bWJlcic6ICd5ZWxsb3cnLFxuICAnYm9vbGVhbic6ICd5ZWxsb3cnLFxuICAndW5kZWZpbmVkJzogJ2dyZXknLFxuICAnbnVsbCc6ICdib2xkJyxcbiAgJ3N0cmluZyc6ICdncmVlbicsXG4gICdkYXRlJzogJ21hZ2VudGEnLFxuICAvLyBcIm5hbWVcIjogaW50ZW50aW9uYWxseSBub3Qgc3R5bGluZ1xuICAncmVnZXhwJzogJ3JlZCdcbn07XG5cblxuZnVuY3Rpb24gc3R5bGl6ZVdpdGhDb2xvcihzdHIsIHN0eWxlVHlwZSkge1xuICB2YXIgc3R5bGUgPSBpbnNwZWN0LnN0eWxlc1tzdHlsZVR5cGVdO1xuXG4gIGlmIChzdHlsZSkge1xuICAgIHJldHVybiAnXFx1MDAxYlsnICsgaW5zcGVjdC5jb2xvcnNbc3R5bGVdWzBdICsgJ20nICsgc3RyICtcbiAgICAgICAgICAgJ1xcdTAwMWJbJyArIGluc3BlY3QuY29sb3JzW3N0eWxlXVsxXSArICdtJztcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gc3RyO1xuICB9XG59XG5cblxuZnVuY3Rpb24gc3R5bGl6ZU5vQ29sb3Ioc3RyLCBzdHlsZVR5cGUpIHtcbiAgcmV0dXJuIHN0cjtcbn1cblxuXG5mdW5jdGlvbiBhcnJheVRvSGFzaChhcnJheSkge1xuICB2YXIgaGFzaCA9IHt9O1xuXG4gIGFycmF5LmZvckVhY2goZnVuY3Rpb24odmFsLCBpZHgpIHtcbiAgICBoYXNoW3ZhbF0gPSB0cnVlO1xuICB9KTtcblxuICByZXR1cm4gaGFzaDtcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRWYWx1ZShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMpIHtcbiAgLy8gUHJvdmlkZSBhIGhvb2sgZm9yIHVzZXItc3BlY2lmaWVkIGluc3BlY3QgZnVuY3Rpb25zLlxuICAvLyBDaGVjayB0aGF0IHZhbHVlIGlzIGFuIG9iamVjdCB3aXRoIGFuIGluc3BlY3QgZnVuY3Rpb24gb24gaXRcbiAgaWYgKGN0eC5jdXN0b21JbnNwZWN0ICYmXG4gICAgICB2YWx1ZSAmJlxuICAgICAgaXNGdW5jdGlvbih2YWx1ZS5pbnNwZWN0KSAmJlxuICAgICAgLy8gRmlsdGVyIG91dCB0aGUgdXRpbCBtb2R1bGUsIGl0J3MgaW5zcGVjdCBmdW5jdGlvbiBpcyBzcGVjaWFsXG4gICAgICB2YWx1ZS5pbnNwZWN0ICE9PSBleHBvcnRzLmluc3BlY3QgJiZcbiAgICAgIC8vIEFsc28gZmlsdGVyIG91dCBhbnkgcHJvdG90eXBlIG9iamVjdHMgdXNpbmcgdGhlIGNpcmN1bGFyIGNoZWNrLlxuICAgICAgISh2YWx1ZS5jb25zdHJ1Y3RvciAmJiB2YWx1ZS5jb25zdHJ1Y3Rvci5wcm90b3R5cGUgPT09IHZhbHVlKSkge1xuICAgIHZhciByZXQgPSB2YWx1ZS5pbnNwZWN0KHJlY3Vyc2VUaW1lcywgY3R4KTtcbiAgICBpZiAoIWlzU3RyaW5nKHJldCkpIHtcbiAgICAgIHJldCA9IGZvcm1hdFZhbHVlKGN0eCwgcmV0LCByZWN1cnNlVGltZXMpO1xuICAgIH1cbiAgICByZXR1cm4gcmV0O1xuICB9XG5cbiAgLy8gUHJpbWl0aXZlIHR5cGVzIGNhbm5vdCBoYXZlIHByb3BlcnRpZXNcbiAgdmFyIHByaW1pdGl2ZSA9IGZvcm1hdFByaW1pdGl2ZShjdHgsIHZhbHVlKTtcbiAgaWYgKHByaW1pdGl2ZSkge1xuICAgIHJldHVybiBwcmltaXRpdmU7XG4gIH1cblxuICAvLyBMb29rIHVwIHRoZSBrZXlzIG9mIHRoZSBvYmplY3QuXG4gIHZhciBrZXlzID0gT2JqZWN0LmtleXModmFsdWUpO1xuICB2YXIgdmlzaWJsZUtleXMgPSBhcnJheVRvSGFzaChrZXlzKTtcblxuICBpZiAoY3R4LnNob3dIaWRkZW4pIHtcbiAgICBrZXlzID0gT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXModmFsdWUpO1xuICB9XG5cbiAgLy8gSUUgZG9lc24ndCBtYWtlIGVycm9yIGZpZWxkcyBub24tZW51bWVyYWJsZVxuICAvLyBodHRwOi8vbXNkbi5taWNyb3NvZnQuY29tL2VuLXVzL2xpYnJhcnkvaWUvZHd3NTJzYnQodj12cy45NCkuYXNweFxuICBpZiAoaXNFcnJvcih2YWx1ZSlcbiAgICAgICYmIChrZXlzLmluZGV4T2YoJ21lc3NhZ2UnKSA+PSAwIHx8IGtleXMuaW5kZXhPZignZGVzY3JpcHRpb24nKSA+PSAwKSkge1xuICAgIHJldHVybiBmb3JtYXRFcnJvcih2YWx1ZSk7XG4gIH1cblxuICAvLyBTb21lIHR5cGUgb2Ygb2JqZWN0IHdpdGhvdXQgcHJvcGVydGllcyBjYW4gYmUgc2hvcnRjdXR0ZWQuXG4gIGlmIChrZXlzLmxlbmd0aCA9PT0gMCkge1xuICAgIGlmIChpc0Z1bmN0aW9uKHZhbHVlKSkge1xuICAgICAgdmFyIG5hbWUgPSB2YWx1ZS5uYW1lID8gJzogJyArIHZhbHVlLm5hbWUgOiAnJztcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZSgnW0Z1bmN0aW9uJyArIG5hbWUgKyAnXScsICdzcGVjaWFsJyk7XG4gICAgfVxuICAgIGlmIChpc1JlZ0V4cCh2YWx1ZSkpIHtcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZShSZWdFeHAucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpLCAncmVnZXhwJyk7XG4gICAgfVxuICAgIGlmIChpc0RhdGUodmFsdWUpKSB7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoRGF0ZS5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSksICdkYXRlJyk7XG4gICAgfVxuICAgIGlmIChpc0Vycm9yKHZhbHVlKSkge1xuICAgICAgcmV0dXJuIGZvcm1hdEVycm9yKHZhbHVlKTtcbiAgICB9XG4gIH1cblxuICB2YXIgYmFzZSA9ICcnLCBhcnJheSA9IGZhbHNlLCBicmFjZXMgPSBbJ3snLCAnfSddO1xuXG4gIC8vIE1ha2UgQXJyYXkgc2F5IHRoYXQgdGhleSBhcmUgQXJyYXlcbiAgaWYgKGlzQXJyYXkodmFsdWUpKSB7XG4gICAgYXJyYXkgPSB0cnVlO1xuICAgIGJyYWNlcyA9IFsnWycsICddJ107XG4gIH1cblxuICAvLyBNYWtlIGZ1bmN0aW9ucyBzYXkgdGhhdCB0aGV5IGFyZSBmdW5jdGlvbnNcbiAgaWYgKGlzRnVuY3Rpb24odmFsdWUpKSB7XG4gICAgdmFyIG4gPSB2YWx1ZS5uYW1lID8gJzogJyArIHZhbHVlLm5hbWUgOiAnJztcbiAgICBiYXNlID0gJyBbRnVuY3Rpb24nICsgbiArICddJztcbiAgfVxuXG4gIC8vIE1ha2UgUmVnRXhwcyBzYXkgdGhhdCB0aGV5IGFyZSBSZWdFeHBzXG4gIGlmIChpc1JlZ0V4cCh2YWx1ZSkpIHtcbiAgICBiYXNlID0gJyAnICsgUmVnRXhwLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKTtcbiAgfVxuXG4gIC8vIE1ha2UgZGF0ZXMgd2l0aCBwcm9wZXJ0aWVzIGZpcnN0IHNheSB0aGUgZGF0ZVxuICBpZiAoaXNEYXRlKHZhbHVlKSkge1xuICAgIGJhc2UgPSAnICcgKyBEYXRlLnByb3RvdHlwZS50b1VUQ1N0cmluZy5jYWxsKHZhbHVlKTtcbiAgfVxuXG4gIC8vIE1ha2UgZXJyb3Igd2l0aCBtZXNzYWdlIGZpcnN0IHNheSB0aGUgZXJyb3JcbiAgaWYgKGlzRXJyb3IodmFsdWUpKSB7XG4gICAgYmFzZSA9ICcgJyArIGZvcm1hdEVycm9yKHZhbHVlKTtcbiAgfVxuXG4gIGlmIChrZXlzLmxlbmd0aCA9PT0gMCAmJiAoIWFycmF5IHx8IHZhbHVlLmxlbmd0aCA9PSAwKSkge1xuICAgIHJldHVybiBicmFjZXNbMF0gKyBiYXNlICsgYnJhY2VzWzFdO1xuICB9XG5cbiAgaWYgKHJlY3Vyc2VUaW1lcyA8IDApIHtcbiAgICBpZiAoaXNSZWdFeHAodmFsdWUpKSB7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoUmVnRXhwLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKSwgJ3JlZ2V4cCcpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoJ1tPYmplY3RdJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gIH1cblxuICBjdHguc2Vlbi5wdXNoKHZhbHVlKTtcblxuICB2YXIgb3V0cHV0O1xuICBpZiAoYXJyYXkpIHtcbiAgICBvdXRwdXQgPSBmb3JtYXRBcnJheShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLCBrZXlzKTtcbiAgfSBlbHNlIHtcbiAgICBvdXRwdXQgPSBrZXlzLm1hcChmdW5jdGlvbihrZXkpIHtcbiAgICAgIHJldHVybiBmb3JtYXRQcm9wZXJ0eShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLCBrZXksIGFycmF5KTtcbiAgICB9KTtcbiAgfVxuXG4gIGN0eC5zZWVuLnBvcCgpO1xuXG4gIHJldHVybiByZWR1Y2VUb1NpbmdsZVN0cmluZyhvdXRwdXQsIGJhc2UsIGJyYWNlcyk7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0UHJpbWl0aXZlKGN0eCwgdmFsdWUpIHtcbiAgaWYgKGlzVW5kZWZpbmVkKHZhbHVlKSlcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoJ3VuZGVmaW5lZCcsICd1bmRlZmluZWQnKTtcbiAgaWYgKGlzU3RyaW5nKHZhbHVlKSkge1xuICAgIHZhciBzaW1wbGUgPSAnXFwnJyArIEpTT04uc3RyaW5naWZ5KHZhbHVlKS5yZXBsYWNlKC9eXCJ8XCIkL2csICcnKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoLycvZywgXCJcXFxcJ1wiKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoL1xcXFxcIi9nLCAnXCInKSArICdcXCcnO1xuICAgIHJldHVybiBjdHguc3R5bGl6ZShzaW1wbGUsICdzdHJpbmcnKTtcbiAgfVxuICBpZiAoaXNOdW1iZXIodmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgnJyArIHZhbHVlLCAnbnVtYmVyJyk7XG4gIGlmIChpc0Jvb2xlYW4odmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgnJyArIHZhbHVlLCAnYm9vbGVhbicpO1xuICAvLyBGb3Igc29tZSByZWFzb24gdHlwZW9mIG51bGwgaXMgXCJvYmplY3RcIiwgc28gc3BlY2lhbCBjYXNlIGhlcmUuXG4gIGlmIChpc051bGwodmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgnbnVsbCcsICdudWxsJyk7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0RXJyb3IodmFsdWUpIHtcbiAgcmV0dXJuICdbJyArIEVycm9yLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKSArICddJztcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRBcnJheShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLCBrZXlzKSB7XG4gIHZhciBvdXRwdXQgPSBbXTtcbiAgZm9yICh2YXIgaSA9IDAsIGwgPSB2YWx1ZS5sZW5ndGg7IGkgPCBsOyArK2kpIHtcbiAgICBpZiAoaGFzT3duUHJvcGVydHkodmFsdWUsIFN0cmluZyhpKSkpIHtcbiAgICAgIG91dHB1dC5wdXNoKGZvcm1hdFByb3BlcnR5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsXG4gICAgICAgICAgU3RyaW5nKGkpLCB0cnVlKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG91dHB1dC5wdXNoKCcnKTtcbiAgICB9XG4gIH1cbiAga2V5cy5mb3JFYWNoKGZ1bmN0aW9uKGtleSkge1xuICAgIGlmICgha2V5Lm1hdGNoKC9eXFxkKyQvKSkge1xuICAgICAgb3V0cHV0LnB1c2goZm9ybWF0UHJvcGVydHkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cyxcbiAgICAgICAgICBrZXksIHRydWUpKTtcbiAgICB9XG4gIH0pO1xuICByZXR1cm4gb3V0cHV0O1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdFByb3BlcnR5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsIGtleSwgYXJyYXkpIHtcbiAgdmFyIG5hbWUsIHN0ciwgZGVzYztcbiAgZGVzYyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IodmFsdWUsIGtleSkgfHwgeyB2YWx1ZTogdmFsdWVba2V5XSB9O1xuICBpZiAoZGVzYy5nZXQpIHtcbiAgICBpZiAoZGVzYy5zZXQpIHtcbiAgICAgIHN0ciA9IGN0eC5zdHlsaXplKCdbR2V0dGVyL1NldHRlcl0nLCAnc3BlY2lhbCcpO1xuICAgIH0gZWxzZSB7XG4gICAgICBzdHIgPSBjdHguc3R5bGl6ZSgnW0dldHRlcl0nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBpZiAoZGVzYy5zZXQpIHtcbiAgICAgIHN0ciA9IGN0eC5zdHlsaXplKCdbU2V0dGVyXScsICdzcGVjaWFsJyk7XG4gICAgfVxuICB9XG4gIGlmICghaGFzT3duUHJvcGVydHkodmlzaWJsZUtleXMsIGtleSkpIHtcbiAgICBuYW1lID0gJ1snICsga2V5ICsgJ10nO1xuICB9XG4gIGlmICghc3RyKSB7XG4gICAgaWYgKGN0eC5zZWVuLmluZGV4T2YoZGVzYy52YWx1ZSkgPCAwKSB7XG4gICAgICBpZiAoaXNOdWxsKHJlY3Vyc2VUaW1lcykpIHtcbiAgICAgICAgc3RyID0gZm9ybWF0VmFsdWUoY3R4LCBkZXNjLnZhbHVlLCBudWxsKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHN0ciA9IGZvcm1hdFZhbHVlKGN0eCwgZGVzYy52YWx1ZSwgcmVjdXJzZVRpbWVzIC0gMSk7XG4gICAgICB9XG4gICAgICBpZiAoc3RyLmluZGV4T2YoJ1xcbicpID4gLTEpIHtcbiAgICAgICAgaWYgKGFycmF5KSB7XG4gICAgICAgICAgc3RyID0gc3RyLnNwbGl0KCdcXG4nKS5tYXAoZnVuY3Rpb24obGluZSkge1xuICAgICAgICAgICAgcmV0dXJuICcgICcgKyBsaW5lO1xuICAgICAgICAgIH0pLmpvaW4oJ1xcbicpLnN1YnN0cigyKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzdHIgPSAnXFxuJyArIHN0ci5zcGxpdCgnXFxuJykubWFwKGZ1bmN0aW9uKGxpbmUpIHtcbiAgICAgICAgICAgIHJldHVybiAnICAgJyArIGxpbmU7XG4gICAgICAgICAgfSkuam9pbignXFxuJyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgc3RyID0gY3R4LnN0eWxpemUoJ1tDaXJjdWxhcl0nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgfVxuICBpZiAoaXNVbmRlZmluZWQobmFtZSkpIHtcbiAgICBpZiAoYXJyYXkgJiYga2V5Lm1hdGNoKC9eXFxkKyQvKSkge1xuICAgICAgcmV0dXJuIHN0cjtcbiAgICB9XG4gICAgbmFtZSA9IEpTT04uc3RyaW5naWZ5KCcnICsga2V5KTtcbiAgICBpZiAobmFtZS5tYXRjaCgvXlwiKFthLXpBLVpfXVthLXpBLVpfMC05XSopXCIkLykpIHtcbiAgICAgIG5hbWUgPSBuYW1lLnN1YnN0cigxLCBuYW1lLmxlbmd0aCAtIDIpO1xuICAgICAgbmFtZSA9IGN0eC5zdHlsaXplKG5hbWUsICduYW1lJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG5hbWUgPSBuYW1lLnJlcGxhY2UoLycvZywgXCJcXFxcJ1wiKVxuICAgICAgICAgICAgICAgICAucmVwbGFjZSgvXFxcXFwiL2csICdcIicpXG4gICAgICAgICAgICAgICAgIC5yZXBsYWNlKC8oXlwifFwiJCkvZywgXCInXCIpO1xuICAgICAgbmFtZSA9IGN0eC5zdHlsaXplKG5hbWUsICdzdHJpbmcnKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gbmFtZSArICc6ICcgKyBzdHI7XG59XG5cblxuZnVuY3Rpb24gcmVkdWNlVG9TaW5nbGVTdHJpbmcob3V0cHV0LCBiYXNlLCBicmFjZXMpIHtcbiAgdmFyIG51bUxpbmVzRXN0ID0gMDtcbiAgdmFyIGxlbmd0aCA9IG91dHB1dC5yZWR1Y2UoZnVuY3Rpb24ocHJldiwgY3VyKSB7XG4gICAgbnVtTGluZXNFc3QrKztcbiAgICBpZiAoY3VyLmluZGV4T2YoJ1xcbicpID49IDApIG51bUxpbmVzRXN0Kys7XG4gICAgcmV0dXJuIHByZXYgKyBjdXIucmVwbGFjZSgvXFx1MDAxYlxcW1xcZFxcZD9tL2csICcnKS5sZW5ndGggKyAxO1xuICB9LCAwKTtcblxuICBpZiAobGVuZ3RoID4gNjApIHtcbiAgICByZXR1cm4gYnJhY2VzWzBdICtcbiAgICAgICAgICAgKGJhc2UgPT09ICcnID8gJycgOiBiYXNlICsgJ1xcbiAnKSArXG4gICAgICAgICAgICcgJyArXG4gICAgICAgICAgIG91dHB1dC5qb2luKCcsXFxuICAnKSArXG4gICAgICAgICAgICcgJyArXG4gICAgICAgICAgIGJyYWNlc1sxXTtcbiAgfVxuXG4gIHJldHVybiBicmFjZXNbMF0gKyBiYXNlICsgJyAnICsgb3V0cHV0LmpvaW4oJywgJykgKyAnICcgKyBicmFjZXNbMV07XG59XG5cblxuLy8gTk9URTogVGhlc2UgdHlwZSBjaGVja2luZyBmdW5jdGlvbnMgaW50ZW50aW9uYWxseSBkb24ndCB1c2UgYGluc3RhbmNlb2ZgXG4vLyBiZWNhdXNlIGl0IGlzIGZyYWdpbGUgYW5kIGNhbiBiZSBlYXNpbHkgZmFrZWQgd2l0aCBgT2JqZWN0LmNyZWF0ZSgpYC5cbmZ1bmN0aW9uIGlzQXJyYXkoYXIpIHtcbiAgcmV0dXJuIEFycmF5LmlzQXJyYXkoYXIpO1xufVxuZXhwb3J0cy5pc0FycmF5ID0gaXNBcnJheTtcblxuZnVuY3Rpb24gaXNCb29sZWFuKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ2Jvb2xlYW4nO1xufVxuZXhwb3J0cy5pc0Jvb2xlYW4gPSBpc0Jvb2xlYW47XG5cbmZ1bmN0aW9uIGlzTnVsbChhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PT0gbnVsbDtcbn1cbmV4cG9ydHMuaXNOdWxsID0gaXNOdWxsO1xuXG5mdW5jdGlvbiBpc051bGxPclVuZGVmaW5lZChhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PSBudWxsO1xufVxuZXhwb3J0cy5pc051bGxPclVuZGVmaW5lZCA9IGlzTnVsbE9yVW5kZWZpbmVkO1xuXG5mdW5jdGlvbiBpc051bWJlcihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdudW1iZXInO1xufVxuZXhwb3J0cy5pc051bWJlciA9IGlzTnVtYmVyO1xuXG5mdW5jdGlvbiBpc1N0cmluZyhhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdzdHJpbmcnO1xufVxuZXhwb3J0cy5pc1N0cmluZyA9IGlzU3RyaW5nO1xuXG5mdW5jdGlvbiBpc1N5bWJvbChhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdzeW1ib2wnO1xufVxuZXhwb3J0cy5pc1N5bWJvbCA9IGlzU3ltYm9sO1xuXG5mdW5jdGlvbiBpc1VuZGVmaW5lZChhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PT0gdm9pZCAwO1xufVxuZXhwb3J0cy5pc1VuZGVmaW5lZCA9IGlzVW5kZWZpbmVkO1xuXG5mdW5jdGlvbiBpc1JlZ0V4cChyZSkge1xuICByZXR1cm4gaXNPYmplY3QocmUpICYmIG9iamVjdFRvU3RyaW5nKHJlKSA9PT0gJ1tvYmplY3QgUmVnRXhwXSc7XG59XG5leHBvcnRzLmlzUmVnRXhwID0gaXNSZWdFeHA7XG5cbmZ1bmN0aW9uIGlzT2JqZWN0KGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ29iamVjdCcgJiYgYXJnICE9PSBudWxsO1xufVxuZXhwb3J0cy5pc09iamVjdCA9IGlzT2JqZWN0O1xuXG5mdW5jdGlvbiBpc0RhdGUoZCkge1xuICByZXR1cm4gaXNPYmplY3QoZCkgJiYgb2JqZWN0VG9TdHJpbmcoZCkgPT09ICdbb2JqZWN0IERhdGVdJztcbn1cbmV4cG9ydHMuaXNEYXRlID0gaXNEYXRlO1xuXG5mdW5jdGlvbiBpc0Vycm9yKGUpIHtcbiAgcmV0dXJuIGlzT2JqZWN0KGUpICYmXG4gICAgICAob2JqZWN0VG9TdHJpbmcoZSkgPT09ICdbb2JqZWN0IEVycm9yXScgfHwgZSBpbnN0YW5jZW9mIEVycm9yKTtcbn1cbmV4cG9ydHMuaXNFcnJvciA9IGlzRXJyb3I7XG5cbmZ1bmN0aW9uIGlzRnVuY3Rpb24oYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnZnVuY3Rpb24nO1xufVxuZXhwb3J0cy5pc0Z1bmN0aW9uID0gaXNGdW5jdGlvbjtcblxuZnVuY3Rpb24gaXNQcmltaXRpdmUoYXJnKSB7XG4gIHJldHVybiBhcmcgPT09IG51bGwgfHxcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICdib29sZWFuJyB8fFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ251bWJlcicgfHxcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICdzdHJpbmcnIHx8XG4gICAgICAgICB0eXBlb2YgYXJnID09PSAnc3ltYm9sJyB8fCAgLy8gRVM2IHN5bWJvbFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ3VuZGVmaW5lZCc7XG59XG5leHBvcnRzLmlzUHJpbWl0aXZlID0gaXNQcmltaXRpdmU7XG5cbmV4cG9ydHMuaXNCdWZmZXIgPSByZXF1aXJlKCcuL3N1cHBvcnQvaXNCdWZmZXInKTtcblxuZnVuY3Rpb24gb2JqZWN0VG9TdHJpbmcobykge1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG8pO1xufVxuXG5cbmZ1bmN0aW9uIHBhZChuKSB7XG4gIHJldHVybiBuIDwgMTAgPyAnMCcgKyBuLnRvU3RyaW5nKDEwKSA6IG4udG9TdHJpbmcoMTApO1xufVxuXG5cbnZhciBtb250aHMgPSBbJ0phbicsICdGZWInLCAnTWFyJywgJ0FwcicsICdNYXknLCAnSnVuJywgJ0p1bCcsICdBdWcnLCAnU2VwJyxcbiAgICAgICAgICAgICAgJ09jdCcsICdOb3YnLCAnRGVjJ107XG5cbi8vIDI2IEZlYiAxNjoxOTozNFxuZnVuY3Rpb24gdGltZXN0YW1wKCkge1xuICB2YXIgZCA9IG5ldyBEYXRlKCk7XG4gIHZhciB0aW1lID0gW3BhZChkLmdldEhvdXJzKCkpLFxuICAgICAgICAgICAgICBwYWQoZC5nZXRNaW51dGVzKCkpLFxuICAgICAgICAgICAgICBwYWQoZC5nZXRTZWNvbmRzKCkpXS5qb2luKCc6Jyk7XG4gIHJldHVybiBbZC5nZXREYXRlKCksIG1vbnRoc1tkLmdldE1vbnRoKCldLCB0aW1lXS5qb2luKCcgJyk7XG59XG5cblxuLy8gbG9nIGlzIGp1c3QgYSB0aGluIHdyYXBwZXIgdG8gY29uc29sZS5sb2cgdGhhdCBwcmVwZW5kcyBhIHRpbWVzdGFtcFxuZXhwb3J0cy5sb2cgPSBmdW5jdGlvbigpIHtcbiAgY29uc29sZS5sb2coJyVzIC0gJXMnLCB0aW1lc3RhbXAoKSwgZXhwb3J0cy5mb3JtYXQuYXBwbHkoZXhwb3J0cywgYXJndW1lbnRzKSk7XG59O1xuXG5cbi8qKlxuICogSW5oZXJpdCB0aGUgcHJvdG90eXBlIG1ldGhvZHMgZnJvbSBvbmUgY29uc3RydWN0b3IgaW50byBhbm90aGVyLlxuICpcbiAqIFRoZSBGdW5jdGlvbi5wcm90b3R5cGUuaW5oZXJpdHMgZnJvbSBsYW5nLmpzIHJld3JpdHRlbiBhcyBhIHN0YW5kYWxvbmVcbiAqIGZ1bmN0aW9uIChub3Qgb24gRnVuY3Rpb24ucHJvdG90eXBlKS4gTk9URTogSWYgdGhpcyBmaWxlIGlzIHRvIGJlIGxvYWRlZFxuICogZHVyaW5nIGJvb3RzdHJhcHBpbmcgdGhpcyBmdW5jdGlvbiBuZWVkcyB0byBiZSByZXdyaXR0ZW4gdXNpbmcgc29tZSBuYXRpdmVcbiAqIGZ1bmN0aW9ucyBhcyBwcm90b3R5cGUgc2V0dXAgdXNpbmcgbm9ybWFsIEphdmFTY3JpcHQgZG9lcyBub3Qgd29yayBhc1xuICogZXhwZWN0ZWQgZHVyaW5nIGJvb3RzdHJhcHBpbmcgKHNlZSBtaXJyb3IuanMgaW4gcjExNDkwMykuXG4gKlxuICogQHBhcmFtIHtmdW5jdGlvbn0gY3RvciBDb25zdHJ1Y3RvciBmdW5jdGlvbiB3aGljaCBuZWVkcyB0byBpbmhlcml0IHRoZVxuICogICAgIHByb3RvdHlwZS5cbiAqIEBwYXJhbSB7ZnVuY3Rpb259IHN1cGVyQ3RvciBDb25zdHJ1Y3RvciBmdW5jdGlvbiB0byBpbmhlcml0IHByb3RvdHlwZSBmcm9tLlxuICovXG5leHBvcnRzLmluaGVyaXRzID0gcmVxdWlyZSgnaW5oZXJpdHMnKTtcblxuZXhwb3J0cy5fZXh0ZW5kID0gZnVuY3Rpb24ob3JpZ2luLCBhZGQpIHtcbiAgLy8gRG9uJ3QgZG8gYW55dGhpbmcgaWYgYWRkIGlzbid0IGFuIG9iamVjdFxuICBpZiAoIWFkZCB8fCAhaXNPYmplY3QoYWRkKSkgcmV0dXJuIG9yaWdpbjtcblxuICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKGFkZCk7XG4gIHZhciBpID0ga2V5cy5sZW5ndGg7XG4gIHdoaWxlIChpLS0pIHtcbiAgICBvcmlnaW5ba2V5c1tpXV0gPSBhZGRba2V5c1tpXV07XG4gIH1cbiAgcmV0dXJuIG9yaWdpbjtcbn07XG5cbmZ1bmN0aW9uIGhhc093blByb3BlcnR5KG9iaiwgcHJvcCkge1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwgcHJvcCk7XG59XG4iLCIvKipcbiAqIFRoaXMgbW9kdWxlIGV4cG9ydHMgZnVuY3Rpb25zIGZvciBjaGVja2luZyB0eXBlc1xuICogYW5kIHRocm93aW5nIGV4Y2VwdGlvbnMuXG4gKi9cblxuLypnbG9iYWxzIGRlZmluZSwgbW9kdWxlICovXG5cbihmdW5jdGlvbiAoZ2xvYmFscykge1xuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIHZhciBtZXNzYWdlcywgcHJlZGljYXRlcywgZnVuY3Rpb25zLCBhc3NlcnQsIG5vdCwgbWF5YmUsIGVpdGhlcjtcblxuICAgIG1lc3NhZ2VzID0ge1xuICAgICAgICBsaWtlOiAnSW52YWxpZCB0eXBlJyxcbiAgICAgICAgaW5zdGFuY2U6ICdJbnZhbGlkIHR5cGUnLFxuICAgICAgICBlbXB0eU9iamVjdDogJ0ludmFsaWQgb2JqZWN0JyxcbiAgICAgICAgb2JqZWN0OiAnSW52YWxpZCBvYmplY3QnLFxuICAgICAgICBhc3NpZ25lZDogJ0ludmFsaWQgdmFsdWUnLFxuICAgICAgICB1bmRlZmluZWQ6ICdJbnZhbGlkIHZhbHVlJyxcbiAgICAgICAgbnVsbDogJ0ludmFsaWQgdmFsdWUnLFxuICAgICAgICBoYXNMZW5ndGg6ICdJbnZhbGlkIGxlbmd0aCcsXG4gICAgICAgIGVtcHR5QXJyYXk6ICdJbnZhbGlkIGFycmF5JyxcbiAgICAgICAgYXJyYXk6ICdJbnZhbGlkIGFycmF5JyxcbiAgICAgICAgZGF0ZTogJ0ludmFsaWQgZGF0ZScsXG4gICAgICAgIGVycm9yOiAnSW52YWxpZCBlcnJvcicsXG4gICAgICAgIGZuOiAnSW52YWxpZCBmdW5jdGlvbicsXG4gICAgICAgIG1hdGNoOiAnSW52YWxpZCBzdHJpbmcnLFxuICAgICAgICBjb250YWluczogJ0ludmFsaWQgc3RyaW5nJyxcbiAgICAgICAgdW5lbXB0eVN0cmluZzogJ0ludmFsaWQgc3RyaW5nJyxcbiAgICAgICAgc3RyaW5nOiAnSW52YWxpZCBzdHJpbmcnLFxuICAgICAgICBvZGQ6ICdJbnZhbGlkIG51bWJlcicsXG4gICAgICAgIGV2ZW46ICdJbnZhbGlkIG51bWJlcicsXG4gICAgICAgIGJldHdlZW46ICdJbnZhbGlkIG51bWJlcicsXG4gICAgICAgIGdyZWF0ZXI6ICdJbnZhbGlkIG51bWJlcicsXG4gICAgICAgIGxlc3M6ICdJbnZhbGlkIG51bWJlcicsXG4gICAgICAgIHBvc2l0aXZlOiAnSW52YWxpZCBudW1iZXInLFxuICAgICAgICBuZWdhdGl2ZTogJ0ludmFsaWQgbnVtYmVyJyxcbiAgICAgICAgaW50ZWdlcjogJ0ludmFsaWQgbnVtYmVyJyxcbiAgICAgICAgemVybzogJ0ludmFsaWQgbnVtYmVyJyxcbiAgICAgICAgbnVtYmVyOiAnSW52YWxpZCBudW1iZXInLFxuICAgICAgICBib29sZWFuOiAnSW52YWxpZCBib29sZWFuJ1xuICAgIH07XG5cbiAgICBwcmVkaWNhdGVzID0ge1xuICAgICAgICBsaWtlOiBsaWtlLFxuICAgICAgICBpbnN0YW5jZTogaW5zdGFuY2UsXG4gICAgICAgIGVtcHR5T2JqZWN0OiBlbXB0eU9iamVjdCxcbiAgICAgICAgb2JqZWN0OiBvYmplY3QsXG4gICAgICAgIGFzc2lnbmVkOiBhc3NpZ25lZCxcbiAgICAgICAgdW5kZWZpbmVkOiBpc1VuZGVmaW5lZCxcbiAgICAgICAgbnVsbDogaXNOdWxsLFxuICAgICAgICBoYXNMZW5ndGg6IGhhc0xlbmd0aCxcbiAgICAgICAgZW1wdHlBcnJheTogZW1wdHlBcnJheSxcbiAgICAgICAgYXJyYXk6IGFycmF5LFxuICAgICAgICBkYXRlOiBkYXRlLFxuICAgICAgICBlcnJvcjogZXJyb3IsXG4gICAgICAgIGZ1bmN0aW9uOiBpc0Z1bmN0aW9uLFxuICAgICAgICBtYXRjaDogbWF0Y2gsXG4gICAgICAgIGNvbnRhaW5zOiBjb250YWlucyxcbiAgICAgICAgdW5lbXB0eVN0cmluZzogdW5lbXB0eVN0cmluZyxcbiAgICAgICAgc3RyaW5nOiBzdHJpbmcsXG4gICAgICAgIG9kZDogb2RkLFxuICAgICAgICBldmVuOiBldmVuLFxuICAgICAgICBiZXR3ZWVuOiBiZXR3ZWVuLFxuICAgICAgICBncmVhdGVyOiBncmVhdGVyLFxuICAgICAgICBsZXNzOiBsZXNzLFxuICAgICAgICBwb3NpdGl2ZTogcG9zaXRpdmUsXG4gICAgICAgIG5lZ2F0aXZlOiBuZWdhdGl2ZSxcbiAgICAgICAgaW50ZWdlciA6IGludGVnZXIsXG4gICAgICAgIHplcm86IHplcm8sXG4gICAgICAgIG51bWJlcjogbnVtYmVyLFxuICAgICAgICBib29sZWFuOiBib29sZWFuXG4gICAgfTtcblxuICAgIGZ1bmN0aW9ucyA9IHtcbiAgICAgICAgYXBwbHk6IGFwcGx5LFxuICAgICAgICBtYXA6IG1hcCxcbiAgICAgICAgYWxsOiBhbGwsXG4gICAgICAgIGFueTogYW55XG4gICAgfTtcblxuICAgIGZ1bmN0aW9ucyA9IG1peGluKGZ1bmN0aW9ucywgcHJlZGljYXRlcyk7XG4gICAgYXNzZXJ0ID0gY3JlYXRlTW9kaWZpZWRQcmVkaWNhdGVzKGFzc2VydE1vZGlmaWVyLCBhc3NlcnRJbXBsKTtcbiAgICBub3QgPSBjcmVhdGVNb2RpZmllZFByZWRpY2F0ZXMobm90TW9kaWZpZXIsIG5vdEltcGwpO1xuICAgIG1heWJlID0gY3JlYXRlTW9kaWZpZWRQcmVkaWNhdGVzKG1heWJlTW9kaWZpZXIsIG1heWJlSW1wbCk7XG4gICAgZWl0aGVyID0gY3JlYXRlTW9kaWZpZWRQcmVkaWNhdGVzKGVpdGhlck1vZGlmaWVyKTtcbiAgICBhc3NlcnQubm90ID0gY3JlYXRlTW9kaWZpZWRGdW5jdGlvbnMoYXNzZXJ0TW9kaWZpZXIsIG5vdCk7XG4gICAgYXNzZXJ0Lm1heWJlID0gY3JlYXRlTW9kaWZpZWRGdW5jdGlvbnMoYXNzZXJ0TW9kaWZpZXIsIG1heWJlKTtcbiAgICBhc3NlcnQuZWl0aGVyID0gY3JlYXRlTW9kaWZpZWRGdW5jdGlvbnMoYXNzZXJ0RWl0aGVyTW9kaWZpZXIsIHByZWRpY2F0ZXMpO1xuXG4gICAgZXhwb3J0RnVuY3Rpb25zKG1peGluKGZ1bmN0aW9ucywge1xuICAgICAgICBhc3NlcnQ6IGFzc2VydCxcbiAgICAgICAgbm90OiBub3QsXG4gICAgICAgIG1heWJlOiBtYXliZSxcbiAgICAgICAgZWl0aGVyOiBlaXRoZXJcbiAgICB9KSk7XG5cbiAgICAvKipcbiAgICAgKiBQdWJsaWMgZnVuY3Rpb24gYGxpa2VgLlxuICAgICAqXG4gICAgICogVGVzdHMgd2hldGhlciBhbiBvYmplY3QgJ3F1YWNrcyBsaWtlIGEgZHVjaycuXG4gICAgICogUmV0dXJucyBgdHJ1ZWAgaWYgdGhlIGZpcnN0IGFyZ3VtZW50IGhhcyBhbGwgb2ZcbiAgICAgKiB0aGUgcHJvcGVydGllcyBvZiB0aGUgc2Vjb25kLCBhcmNoZXR5cGFsIGFyZ3VtZW50XG4gICAgICogKHRoZSAnZHVjaycpLiBSZXR1cm5zIGBmYWxzZWAgb3RoZXJ3aXNlLlxuICAgICAqXG4gICAgICovXG4gICAgZnVuY3Rpb24gbGlrZSAoZGF0YSwgZHVjaykge1xuICAgICAgICB2YXIgbmFtZTtcblxuICAgICAgICBmb3IgKG5hbWUgaW4gZHVjaykge1xuICAgICAgICAgICAgaWYgKGR1Y2suaGFzT3duUHJvcGVydHkobmFtZSkpIHtcbiAgICAgICAgICAgICAgICBpZiAoZGF0YS5oYXNPd25Qcm9wZXJ0eShuYW1lKSA9PT0gZmFsc2UgfHwgdHlwZW9mIGRhdGFbbmFtZV0gIT09IHR5cGVvZiBkdWNrW25hbWVdKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAob2JqZWN0KGRhdGFbbmFtZV0pICYmIGxpa2UoZGF0YVtuYW1lXSwgZHVja1tuYW1lXSkgPT09IGZhbHNlKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBQdWJsaWMgZnVuY3Rpb24gYGluc3RhbmNlYC5cbiAgICAgKlxuICAgICAqIFJldHVybnMgYHRydWVgIGlmIGFuIG9iamVjdCBpcyBhbiBpbnN0YW5jZSBvZiBhIHByb3RvdHlwZSxcbiAgICAgKiBgZmFsc2VgIG90aGVyd2lzZS5cbiAgICAgKlxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGluc3RhbmNlIChkYXRhLCBwcm90b3R5cGUpIHtcbiAgICAgICAgaWYgKGRhdGEgJiYgaXNGdW5jdGlvbihwcm90b3R5cGUpICYmIGRhdGEgaW5zdGFuY2VvZiBwcm90b3R5cGUpIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFB1YmxpYyBmdW5jdGlvbiBgZW1wdHlPYmplY3RgLlxuICAgICAqXG4gICAgICogUmV0dXJucyBgdHJ1ZWAgaWYgc29tZXRoaW5nIGlzIGFuIGVtcHR5IG9iamVjdCxcbiAgICAgKiBgZmFsc2VgIG90aGVyd2lzZS5cbiAgICAgKlxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGVtcHR5T2JqZWN0IChkYXRhKSB7XG4gICAgICAgIHJldHVybiBvYmplY3QoZGF0YSkgJiYgT2JqZWN0LmtleXMoZGF0YSkubGVuZ3RoID09PSAwO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFB1YmxpYyBmdW5jdGlvbiBgb2JqZWN0YC5cbiAgICAgKlxuICAgICAqIFJldHVybnMgYHRydWVgIGlmIHNvbWV0aGluZyBpcyBhIHBsYWluLW9sZCBKUyBvYmplY3QsXG4gICAgICogYGZhbHNlYCBvdGhlcndpc2UuXG4gICAgICpcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBvYmplY3QgKGRhdGEpIHtcbiAgICAgICAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChkYXRhKSA9PT0gJ1tvYmplY3QgT2JqZWN0XSc7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUHVibGljIGZ1bmN0aW9uIGBhc3NpZ25lZGAuXG4gICAgICpcbiAgICAgKiBSZXR1cm5zIGB0cnVlYCBpZiBzb21ldGhpbmcgaXMgbm90IG51bGwgb3IgdW5kZWZpbmVkLFxuICAgICAqIGBmYWxzZWAgb3RoZXJ3aXNlLlxuICAgICAqXG4gICAgICovXG4gICAgZnVuY3Rpb24gYXNzaWduZWQgKGRhdGEpIHtcbiAgICAgICAgcmV0dXJuICFpc1VuZGVmaW5lZChkYXRhKSAmJiAhaXNOdWxsKGRhdGEpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFB1YmxpYyBmdW5jdGlvbiBgdW5kZWZpbmVkYC5cbiAgICAgKlxuICAgICAqIFJldHVybnMgYHRydWVgIGlmIHNvbWV0aGluZyBpcyB1bmRlZmluZWQsXG4gICAgICogYGZhbHNlYCBvdGhlcndpc2UuXG4gICAgICpcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBpc1VuZGVmaW5lZCAoZGF0YSkge1xuICAgICAgICByZXR1cm4gZGF0YSA9PT0gdW5kZWZpbmVkO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFB1YmxpYyBmdW5jdGlvbiBgbnVsbGAuXG4gICAgICpcbiAgICAgKiBSZXR1cm5zIGB0cnVlYCBpZiBzb21ldGhpbmcgaXMgbnVsbCxcbiAgICAgKiBgZmFsc2VgIG90aGVyd2lzZS5cbiAgICAgKlxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGlzTnVsbCAoZGF0YSkge1xuICAgICAgICByZXR1cm4gZGF0YSA9PT0gbnVsbDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBQdWJsaWMgZnVuY3Rpb24gYGhhc0xlbmd0aGAuXG4gICAgICpcbiAgICAgKiBSZXR1cm5zIGB0cnVlYCBpZiBzb21ldGhpbmcgaXMgaGFzIGEgbGVuZ3RoIHByb3BlcnR5XG4gICAgICogdGhhdCBlcXVhbHMgYHZhbHVlYCwgYGZhbHNlYCBvdGhlcndpc2UuXG4gICAgICpcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBoYXNMZW5ndGggKGRhdGEsIHZhbHVlKSB7XG4gICAgICAgIHJldHVybiBhc3NpZ25lZChkYXRhKSAmJiBkYXRhLmxlbmd0aCA9PT0gdmFsdWU7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUHVibGljIGZ1bmN0aW9uIGBlbXB0eUFycmF5YC5cbiAgICAgKlxuICAgICAqIFJldHVybnMgYHRydWVgIGlmIHNvbWV0aGluZyBpcyBhbiBlbXB0eSBhcnJheSxcbiAgICAgKiBgZmFsc2VgIG90aGVyd2lzZS5cbiAgICAgKlxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGVtcHR5QXJyYXkgKGRhdGEpIHtcbiAgICAgICAgcmV0dXJuIGFycmF5KGRhdGEpICYmIGRhdGEubGVuZ3RoID09PSAwO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFB1YmxpYyBmdW5jdGlvbiBgYXJyYXlgLlxuICAgICAqXG4gICAgICogUmV0dXJucyBgdHJ1ZWAgc29tZXRoaW5nIGlzIGFuIGFycmF5LFxuICAgICAqIGBmYWxzZWAgb3RoZXJ3aXNlLlxuICAgICAqXG4gICAgICovXG4gICAgZnVuY3Rpb24gYXJyYXkgKGRhdGEpIHtcbiAgICAgICAgcmV0dXJuIEFycmF5LmlzQXJyYXkoZGF0YSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUHVibGljIGZ1bmN0aW9uIGBkYXRlYC5cbiAgICAgKlxuICAgICAqIFJldHVybnMgYHRydWVgIHNvbWV0aGluZyBpcyBhIHZhbGlkIGRhdGUsXG4gICAgICogYGZhbHNlYCBvdGhlcndpc2UuXG4gICAgICpcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBkYXRlIChkYXRhKSB7XG4gICAgICAgIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoZGF0YSkgPT09ICdbb2JqZWN0IERhdGVdJyAmJlxuICAgICAgICAgICAgIWlzTmFOKGRhdGEuZ2V0VGltZSgpKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBQdWJsaWMgZnVuY3Rpb24gYGVycm9yYC5cbiAgICAgKlxuICAgICAqIFJldHVybnMgYHRydWVgIGlmIHNvbWV0aGluZyBpcyBhIHBsYWluLW9sZCBKUyBvYmplY3QsXG4gICAgICogYGZhbHNlYCBvdGhlcndpc2UuXG4gICAgICpcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBlcnJvciAoZGF0YSkge1xuICAgICAgICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKGRhdGEpID09PSAnW29iamVjdCBFcnJvcl0nO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFB1YmxpYyBmdW5jdGlvbiBgZnVuY3Rpb25gLlxuICAgICAqXG4gICAgICogUmV0dXJucyBgdHJ1ZWAgaWYgc29tZXRoaW5nIGlzIGZ1bmN0aW9uLFxuICAgICAqIGBmYWxzZWAgb3RoZXJ3aXNlLlxuICAgICAqXG4gICAgICovXG4gICAgZnVuY3Rpb24gaXNGdW5jdGlvbiAoZGF0YSkge1xuICAgICAgICByZXR1cm4gdHlwZW9mIGRhdGEgPT09ICdmdW5jdGlvbic7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUHVibGljIGZ1bmN0aW9uIGBtYXRjaGAuXG4gICAgICpcbiAgICAgKiBSZXR1cm5zIGB0cnVlYCBpZiBzb21ldGhpbmcgaXMgYSBzdHJpbmdcbiAgICAgKiB0aGF0IG1hdGNoZXMgYHJlZ2V4YCwgYGZhbHNlYCBvdGhlcndpc2UuXG4gICAgICpcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBtYXRjaCAoZGF0YSwgcmVnZXgpIHtcbiAgICAgICAgcmV0dXJuIHN0cmluZyhkYXRhKSAmJiAhIWRhdGEubWF0Y2gocmVnZXgpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFB1YmxpYyBmdW5jdGlvbiBgY29udGFpbnNgLlxuICAgICAqXG4gICAgICogUmV0dXJucyBgdHJ1ZWAgaWYgc29tZXRoaW5nIGlzIGEgc3RyaW5nXG4gICAgICogdGhhdCBjb250YWlucyBgc3Vic3RyaW5nYCwgYGZhbHNlYCBvdGhlcndpc2UuXG4gICAgICpcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBjb250YWlucyAoZGF0YSwgc3Vic3RyaW5nKSB7XG4gICAgICAgIHJldHVybiBzdHJpbmcoZGF0YSkgJiYgZGF0YS5pbmRleE9mKHN1YnN0cmluZykgIT09IC0xO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFB1YmxpYyBmdW5jdGlvbiBgdW5lbXB0eVN0cmluZ2AuXG4gICAgICpcbiAgICAgKiBSZXR1cm5zIGB0cnVlYCBpZiBzb21ldGhpbmcgaXMgYSBub24tZW1wdHkgc3RyaW5nLFxuICAgICAqIGBmYWxzZWAgb3RoZXJ3aXNlLlxuICAgICAqXG4gICAgICovXG4gICAgZnVuY3Rpb24gdW5lbXB0eVN0cmluZyAoZGF0YSkge1xuICAgICAgICByZXR1cm4gc3RyaW5nKGRhdGEpICYmIGRhdGEgIT09ICcnO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFB1YmxpYyBmdW5jdGlvbiBgc3RyaW5nYC5cbiAgICAgKlxuICAgICAqIFJldHVybnMgYHRydWVgIGlmIHNvbWV0aGluZyBpcyBhIHN0cmluZywgYGZhbHNlYCBvdGhlcndpc2UuXG4gICAgICpcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBzdHJpbmcgKGRhdGEpIHtcbiAgICAgICAgcmV0dXJuIHR5cGVvZiBkYXRhID09PSAnc3RyaW5nJztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBQdWJsaWMgZnVuY3Rpb24gYG9kZGAuXG4gICAgICpcbiAgICAgKiBSZXR1cm5zIGB0cnVlYCBpZiBzb21ldGhpbmcgaXMgYW4gb2RkIG51bWJlcixcbiAgICAgKiBgZmFsc2VgIG90aGVyd2lzZS5cbiAgICAgKlxuICAgICAqL1xuICAgIGZ1bmN0aW9uIG9kZCAoZGF0YSkge1xuICAgICAgICByZXR1cm4gaW50ZWdlcihkYXRhKSAmJiAhZXZlbihkYXRhKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBQdWJsaWMgZnVuY3Rpb24gYGV2ZW5gLlxuICAgICAqXG4gICAgICogUmV0dXJucyBgdHJ1ZWAgaWYgc29tZXRoaW5nIGlzIGFuIGV2ZW4gbnVtYmVyLFxuICAgICAqIGBmYWxzZWAgb3RoZXJ3aXNlLlxuICAgICAqXG4gICAgICovXG4gICAgZnVuY3Rpb24gZXZlbiAoZGF0YSkge1xuICAgICAgICByZXR1cm4gbnVtYmVyKGRhdGEpICYmIGRhdGEgJSAyID09PSAwO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFB1YmxpYyBmdW5jdGlvbiBgaW50ZWdlcmAuXG4gICAgICpcbiAgICAgKiBSZXR1cm5zIGB0cnVlYCBpZiBzb21ldGhpbmcgaXMgYW4gaW50ZWdlcixcbiAgICAgKiBgZmFsc2VgIG90aGVyd2lzZS5cbiAgICAgKlxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGludGVnZXIgKGRhdGEpIHtcbiAgICAgICAgcmV0dXJuIG51bWJlcihkYXRhKSAmJiBkYXRhICUgMSA9PT0gMDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBQdWJsaWMgZnVuY3Rpb24gYGJldHdlZW5gLlxuICAgICAqXG4gICAgICogUmV0dXJucyBgdHJ1ZWAgaWYgc29tZXRoaW5nIGlzIGEgbnVtYmVyXG4gICAgICogYmV0d2VlbiBgYWAgYW5kIGBiYCwgYGZhbHNlYCBvdGhlcndpc2UuXG4gICAgICpcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBiZXR3ZWVuIChkYXRhLCBhLCBiKSB7XG4gICAgICAgIGlmIChhIDwgYikge1xuICAgICAgICAgICAgcmV0dXJuIGdyZWF0ZXIoZGF0YSwgYSkgJiYgbGVzcyhkYXRhLCBiKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBsZXNzKGRhdGEsIGEpICYmIGdyZWF0ZXIoZGF0YSwgYik7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUHVibGljIGZ1bmN0aW9uIGBncmVhdGVyYC5cbiAgICAgKlxuICAgICAqIFJldHVybnMgYHRydWVgIGlmIHNvbWV0aGluZyBpcyBhIG51bWJlclxuICAgICAqIGdyZWF0ZXIgdGhhbiBgdmFsdWVgLCBgZmFsc2VgIG90aGVyd2lzZS5cbiAgICAgKlxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGdyZWF0ZXIgKGRhdGEsIHZhbHVlKSB7XG4gICAgICAgIHJldHVybiBudW1iZXIoZGF0YSkgJiYgZGF0YSA+IHZhbHVlO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFB1YmxpYyBmdW5jdGlvbiBgbGVzc2AuXG4gICAgICpcbiAgICAgKiBSZXR1cm5zIGB0cnVlYCBpZiBzb21ldGhpbmcgaXMgYSBudW1iZXJcbiAgICAgKiBsZXNzIHRoYW4gYHZhbHVlYCwgYGZhbHNlYCBvdGhlcndpc2UuXG4gICAgICpcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBsZXNzIChkYXRhLCB2YWx1ZSkge1xuICAgICAgICByZXR1cm4gbnVtYmVyKGRhdGEpICYmIGRhdGEgPCB2YWx1ZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBQdWJsaWMgZnVuY3Rpb24gYHBvc2l0aXZlYC5cbiAgICAgKlxuICAgICAqIFJldHVybnMgYHRydWVgIGlmIHNvbWV0aGluZyBpcyBhIHBvc2l0aXZlIG51bWJlcixcbiAgICAgKiBgZmFsc2VgIG90aGVyd2lzZS5cbiAgICAgKlxuICAgICAqL1xuICAgIGZ1bmN0aW9uIHBvc2l0aXZlIChkYXRhKSB7XG4gICAgICAgIHJldHVybiBncmVhdGVyKGRhdGEsIDApO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFB1YmxpYyBmdW5jdGlvbiBgbmVnYXRpdmVgLlxuICAgICAqXG4gICAgICogUmV0dXJucyBgdHJ1ZWAgaWYgc29tZXRoaW5nIGlzIGEgbmVnYXRpdmUgbnVtYmVyLFxuICAgICAqIGBmYWxzZWAgb3RoZXJ3aXNlLlxuICAgICAqXG4gICAgICogQHBhcmFtIGRhdGEgICAgICAgICAgVGhlIHRoaW5nIHRvIHRlc3QuXG4gICAgICovXG4gICAgZnVuY3Rpb24gbmVnYXRpdmUgKGRhdGEpIHtcbiAgICAgICAgcmV0dXJuIGxlc3MoZGF0YSwgMCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUHVibGljIGZ1bmN0aW9uIGBudW1iZXJgLlxuICAgICAqXG4gICAgICogUmV0dXJucyBgdHJ1ZWAgaWYgZGF0YSBpcyBhIG51bWJlcixcbiAgICAgKiBgZmFsc2VgIG90aGVyd2lzZS5cbiAgICAgKlxuICAgICAqL1xuICAgIGZ1bmN0aW9uIG51bWJlciAoZGF0YSkge1xuICAgICAgICByZXR1cm4gdHlwZW9mIGRhdGEgPT09ICdudW1iZXInICYmIGlzTmFOKGRhdGEpID09PSBmYWxzZSAmJlxuICAgICAgICAgICAgICAgZGF0YSAhPT0gTnVtYmVyLlBPU0lUSVZFX0lORklOSVRZICYmXG4gICAgICAgICAgICAgICBkYXRhICE9PSBOdW1iZXIuTkVHQVRJVkVfSU5GSU5JVFk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUHVibGljIGZ1bmN0aW9uIGB6ZXJvYC5cbiAgICAgKlxuICAgICAqIFJldHVybnMgYHRydWVgIGlmIHNvbWV0aGluZyBpcyB6ZXJvLFxuICAgICAqIGBmYWxzZWAgb3RoZXJ3aXNlLlxuICAgICAqXG4gICAgICogQHBhcmFtIGRhdGEgICAgICAgICAgVGhlIHRoaW5nIHRvIHRlc3QuXG4gICAgICovXG4gICAgZnVuY3Rpb24gemVybyAoZGF0YSkge1xuICAgICAgICByZXR1cm4gZGF0YSA9PT0gMDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBQdWJsaWMgZnVuY3Rpb24gYGJvb2xlYW5gLlxuICAgICAqXG4gICAgICogUmV0dXJucyBgdHJ1ZWAgaWYgZGF0YSBpcyBhIGJvb2xlYW4gdmFsdWUsXG4gICAgICogYGZhbHNlYCBvdGhlcndpc2UuXG4gICAgICpcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBib29sZWFuIChkYXRhKSB7XG4gICAgICAgIHJldHVybiBkYXRhID09PSBmYWxzZSB8fCBkYXRhID09PSB0cnVlO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFB1YmxpYyBmdW5jdGlvbiBgYXBwbHlgLlxuICAgICAqXG4gICAgICogTWFwcyBlYWNoIHZhbHVlIGZyb20gdGhlIGRhdGEgdG8gdGhlIGNvcnJlc3BvbmRpbmcgcHJlZGljYXRlIGFuZCByZXR1cm5zXG4gICAgICogdGhlIHJlc3VsdCBhcnJheS4gSWYgdGhlIHNhbWUgZnVuY3Rpb24gaXMgdG8gYmUgYXBwbGllZCBhY3Jvc3MgYWxsIG9mIHRoZVxuICAgICAqIGRhdGEsIGEgc2luZ2xlIHByZWRpY2F0ZSBmdW5jdGlvbiBtYXkgYmUgcGFzc2VkIGluLlxuICAgICAqXG4gICAgICovXG4gICAgZnVuY3Rpb24gYXBwbHkgKGRhdGEsIHByZWRpY2F0ZXMpIHtcbiAgICAgICAgYXNzZXJ0LmFycmF5KGRhdGEpO1xuXG4gICAgICAgIGlmIChpc0Z1bmN0aW9uKHByZWRpY2F0ZXMpKSB7XG4gICAgICAgICAgICByZXR1cm4gZGF0YS5tYXAoZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHByZWRpY2F0ZXModmFsdWUpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICBhc3NlcnQuYXJyYXkocHJlZGljYXRlcyk7XG4gICAgICAgIGFzc2VydC5oYXNMZW5ndGgoZGF0YSwgcHJlZGljYXRlcy5sZW5ndGgpO1xuXG4gICAgICAgIHJldHVybiBkYXRhLm1hcChmdW5jdGlvbiAodmFsdWUsIGluZGV4KSB7XG4gICAgICAgICAgICByZXR1cm4gcHJlZGljYXRlc1tpbmRleF0odmFsdWUpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBQdWJsaWMgZnVuY3Rpb24gYG1hcGAuXG4gICAgICpcbiAgICAgKiBNYXBzIGVhY2ggdmFsdWUgZnJvbSB0aGUgZGF0YSB0byB0aGUgY29ycmVzcG9uZGluZyBwcmVkaWNhdGUgYW5kIHJldHVybnNcbiAgICAgKiB0aGUgcmVzdWx0IG9iamVjdC4gU3VwcG9ydHMgbmVzdGVkIG9iamVjdHMuIElmIHRoZSBkYXRhIGlzIG5vdCBuZXN0ZWQgYW5kXG4gICAgICogdGhlIHNhbWUgZnVuY3Rpb24gaXMgdG8gYmUgYXBwbGllZCBhY3Jvc3MgYWxsIG9mIGl0LCBhIHNpbmdsZSBwcmVkaWNhdGVcbiAgICAgKiBmdW5jdGlvbiBtYXkgYmUgcGFzc2VkIGluLlxuICAgICAqXG4gICAgICovXG4gICAgZnVuY3Rpb24gbWFwIChkYXRhLCBwcmVkaWNhdGVzKSB7XG4gICAgICAgIGFzc2VydC5vYmplY3QoZGF0YSk7XG5cbiAgICAgICAgaWYgKGlzRnVuY3Rpb24ocHJlZGljYXRlcykpIHtcbiAgICAgICAgICAgIHJldHVybiBtYXBTaW1wbGUoZGF0YSwgcHJlZGljYXRlcyk7XG4gICAgICAgIH1cblxuICAgICAgICBhc3NlcnQub2JqZWN0KHByZWRpY2F0ZXMpO1xuXG4gICAgICAgIHJldHVybiBtYXBDb21wbGV4KGRhdGEsIHByZWRpY2F0ZXMpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIG1hcFNpbXBsZSAoZGF0YSwgcHJlZGljYXRlKSB7XG4gICAgICAgIHZhciByZXN1bHQgPSB7fTtcblxuICAgICAgICBPYmplY3Qua2V5cyhkYXRhKS5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgICAgIHJlc3VsdFtrZXldID0gcHJlZGljYXRlKGRhdGFba2V5XSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbWFwQ29tcGxleCAoZGF0YSwgcHJlZGljYXRlcykge1xuICAgICAgICB2YXIgcmVzdWx0ID0ge307XG5cbiAgICAgICAgT2JqZWN0LmtleXMocHJlZGljYXRlcykuZm9yRWFjaChmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgICAgICB2YXIgcHJlZGljYXRlID0gcHJlZGljYXRlc1trZXldO1xuXG4gICAgICAgICAgICBpZiAoaXNGdW5jdGlvbihwcmVkaWNhdGUpKSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0W2tleV0gPSBwcmVkaWNhdGUoZGF0YVtrZXldKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAob2JqZWN0KHByZWRpY2F0ZSkpIHtcbiAgICAgICAgICAgICAgICByZXN1bHRba2V5XSA9IG1hcENvbXBsZXgoZGF0YVtrZXldLCBwcmVkaWNhdGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFB1YmxpYyBmdW5jdGlvbiBgYWxsYFxuICAgICAqXG4gICAgICogQ2hlY2sgdGhhdCBhbGwgYm9vbGVhbiB2YWx1ZXMgYXJlIHRydWVcbiAgICAgKiBpbiBhbiBhcnJheSAocmV0dXJuZWQgZnJvbSBgYXBwbHlgKVxuICAgICAqIG9yIG9iamVjdCAocmV0dXJuZWQgZnJvbSBgbWFwYCkuXG4gICAgICpcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBhbGwgKGRhdGEpIHtcbiAgICAgICAgaWYgKGFycmF5KGRhdGEpKSB7XG4gICAgICAgICAgICByZXR1cm4gdGVzdEFycmF5KGRhdGEsIGZhbHNlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGFzc2VydC5vYmplY3QoZGF0YSk7XG5cbiAgICAgICAgcmV0dXJuIHRlc3RPYmplY3QoZGF0YSwgZmFsc2UpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHRlc3RBcnJheSAoZGF0YSwgcmVzdWx0KSB7XG4gICAgICAgIHZhciBpO1xuXG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBkYXRhLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgICAgICBpZiAoZGF0YVtpXSA9PT0gcmVzdWx0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiAhcmVzdWx0O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHRlc3RPYmplY3QgKGRhdGEsIHJlc3VsdCkge1xuICAgICAgICB2YXIga2V5LCB2YWx1ZTtcblxuICAgICAgICBmb3IgKGtleSBpbiBkYXRhKSB7XG4gICAgICAgICAgICBpZiAoZGF0YS5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgICAgICAgICAgdmFsdWUgPSBkYXRhW2tleV07XG5cbiAgICAgICAgICAgICAgICBpZiAob2JqZWN0KHZhbHVlKSAmJiB0ZXN0T2JqZWN0KHZhbHVlLCByZXN1bHQpID09PSByZXN1bHQpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAodmFsdWUgPT09IHJlc3VsdCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiAhcmVzdWx0O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFB1YmxpYyBmdW5jdGlvbiBgYW55YFxuICAgICAqXG4gICAgICogQ2hlY2sgdGhhdCBhdCBsZWFzdCBvbmUgYm9vbGVhbiB2YWx1ZSBpcyB0cnVlXG4gICAgICogaW4gYW4gYXJyYXkgKHJldHVybmVkIGZyb20gYGFwcGx5YClcbiAgICAgKiBvciBvYmplY3QgKHJldHVybmVkIGZyb20gYG1hcGApLlxuICAgICAqXG4gICAgICovXG4gICAgZnVuY3Rpb24gYW55IChkYXRhKSB7XG4gICAgICAgIGlmIChhcnJheShkYXRhKSkge1xuICAgICAgICAgICAgcmV0dXJuIHRlc3RBcnJheShkYXRhLCB0cnVlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGFzc2VydC5vYmplY3QoZGF0YSk7XG5cbiAgICAgICAgcmV0dXJuIHRlc3RPYmplY3QoZGF0YSwgdHJ1ZSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbWl4aW4gKHRhcmdldCwgc291cmNlKSB7XG4gICAgICAgIE9iamVjdC5rZXlzKHNvdXJjZSkuZm9yRWFjaChmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgICAgICB0YXJnZXRba2V5XSA9IHNvdXJjZVtrZXldO1xuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gdGFyZ2V0O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFB1YmxpYyBtb2RpZmllciBgYXNzZXJ0YC5cbiAgICAgKlxuICAgICAqIFRocm93cyBpZiBgcHJlZGljYXRlYCByZXR1cm5zIGBmYWxzZWAuXG4gICAgICovXG4gICAgZnVuY3Rpb24gYXNzZXJ0TW9kaWZpZXIgKHByZWRpY2F0ZSwgZGVmYXVsdE1lc3NhZ2UpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGFzc2VydFByZWRpY2F0ZShwcmVkaWNhdGUsIGFyZ3VtZW50cywgZGVmYXVsdE1lc3NhZ2UpO1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGFzc2VydFByZWRpY2F0ZSAocHJlZGljYXRlLCBhcmdzLCBkZWZhdWx0TWVzc2FnZSkge1xuICAgICAgICB2YXIgbWVzc2FnZSA9IGFyZ3NbYXJncy5sZW5ndGggLSAxXTtcbiAgICAgICAgYXNzZXJ0SW1wbChwcmVkaWNhdGUuYXBwbHkobnVsbCwgYXJncyksIHVuZW1wdHlTdHJpbmcobWVzc2FnZSkgPyBtZXNzYWdlIDogZGVmYXVsdE1lc3NhZ2UpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGFzc2VydEltcGwgKHZhbHVlLCBtZXNzYWdlKSB7XG4gICAgICAgIGlmICh2YWx1ZSA9PT0gZmFsc2UpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihtZXNzYWdlIHx8ICdBc3NlcnRpb24gZmFpbGVkJyk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBhc3NlcnRFaXRoZXJNb2RpZmllciAocHJlZGljYXRlLCBkZWZhdWx0TWVzc2FnZSkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIGVycm9yO1xuXG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGFzc2VydFByZWRpY2F0ZShwcmVkaWNhdGUsIGFyZ3VtZW50cywgZGVmYXVsdE1lc3NhZ2UpO1xuICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgIGVycm9yID0gZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBvcjogT2JqZWN0LmtleXMocHJlZGljYXRlcykucmVkdWNlKGRlbGF5ZWRBc3NlcnQsIHt9KVxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgZnVuY3Rpb24gZGVsYXllZEFzc2VydCAocmVzdWx0LCBrZXkpIHtcbiAgICAgICAgICAgICAgICByZXN1bHRba2V5XSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGVycm9yICYmICFwcmVkaWNhdGVzW2tleV0uYXBwbHkobnVsbCwgYXJndW1lbnRzKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgZXJyb3I7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBQdWJsaWMgbW9kaWZpZXIgYG5vdGAuXG4gICAgICpcbiAgICAgKiBOZWdhdGVzIGBwcmVkaWNhdGVgLlxuICAgICAqL1xuICAgIGZ1bmN0aW9uIG5vdE1vZGlmaWVyIChwcmVkaWNhdGUpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBub3RJbXBsKHByZWRpY2F0ZS5hcHBseShudWxsLCBhcmd1bWVudHMpKTtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBub3RJbXBsICh2YWx1ZSkge1xuICAgICAgICByZXR1cm4gIXZhbHVlO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFB1YmxpYyBtb2RpZmllciBgbWF5YmVgLlxuICAgICAqXG4gICAgICogUmV0dXJucyBgdHJ1ZWAgaWYgcHJlZGljYXRlIGFyZ3VtZW50IGlzICBgbnVsbGAgb3IgYHVuZGVmaW5lZGAsXG4gICAgICogb3RoZXJ3aXNlIHByb3BhZ2F0ZXMgdGhlIHJldHVybiB2YWx1ZSBmcm9tIGBwcmVkaWNhdGVgLlxuICAgICAqL1xuICAgIGZ1bmN0aW9uIG1heWJlTW9kaWZpZXIgKHByZWRpY2F0ZSkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgaWYgKCFhc3NpZ25lZChhcmd1bWVudHNbMF0pKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBwcmVkaWNhdGUuYXBwbHkobnVsbCwgYXJndW1lbnRzKTtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBtYXliZUltcGwgKHZhbHVlKSB7XG4gICAgICAgIGlmIChhc3NpZ25lZCh2YWx1ZSkgPT09IGZhbHNlKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBQdWJsaWMgbW9kaWZpZXIgYGVpdGhlcmAuXG4gICAgICpcbiAgICAgKiBSZXR1cm5zIGB0cnVlYCBpZiBlaXRoZXIgcHJlZGljYXRlIGlzIHRydWUuXG4gICAgICovXG4gICAgZnVuY3Rpb24gZWl0aGVyTW9kaWZpZXIgKHByZWRpY2F0ZSkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIHNob3J0Y3V0ID0gcHJlZGljYXRlLmFwcGx5KG51bGwsIGFyZ3VtZW50cyk7XG5cbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgb3I6IE9iamVjdC5rZXlzKHByZWRpY2F0ZXMpLnJlZHVjZShub3BPclByZWRpY2F0ZSwge30pXG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBmdW5jdGlvbiBub3BPclByZWRpY2F0ZSAocmVzdWx0LCBrZXkpIHtcbiAgICAgICAgICAgICAgICByZXN1bHRba2V5XSA9IHNob3J0Y3V0ID8gbm9wIDogcHJlZGljYXRlc1trZXldO1xuICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgZnVuY3Rpb24gbm9wICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY3JlYXRlTW9kaWZpZWRQcmVkaWNhdGVzIChtb2RpZmllciwgb2JqZWN0KSB7XG4gICAgICAgIHJldHVybiBjcmVhdGVNb2RpZmllZEZ1bmN0aW9ucyhtb2RpZmllciwgcHJlZGljYXRlcywgb2JqZWN0KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjcmVhdGVNb2RpZmllZEZ1bmN0aW9ucyAobW9kaWZpZXIsIGZ1bmN0aW9ucywgb2JqZWN0KSB7XG4gICAgICAgIHZhciByZXN1bHQgPSBvYmplY3QgfHwge307XG5cbiAgICAgICAgT2JqZWN0LmtleXMoZnVuY3Rpb25zKS5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShyZXN1bHQsIGtleSwge1xuICAgICAgICAgICAgICAgIGNvbmZpZ3VyYWJsZTogZmFsc2UsXG4gICAgICAgICAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICB3cml0YWJsZTogZmFsc2UsXG4gICAgICAgICAgICAgICAgdmFsdWU6IG1vZGlmaWVyKGZ1bmN0aW9uc1trZXldLCBtZXNzYWdlc1trZXldKVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZXhwb3J0RnVuY3Rpb25zIChmdW5jdGlvbnMpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCkge1xuICAgICAgICAgICAgZGVmaW5lKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZnVuY3Rpb25zO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlICE9PSBudWxsICYmIG1vZHVsZS5leHBvcnRzKSB7XG4gICAgICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9ucztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGdsb2JhbHMuY2hlY2sgPSBmdW5jdGlvbnM7XG4gICAgICAgIH1cbiAgICB9XG59KHRoaXMpKTtcbiIsIi8qKlxuICogQ29weXJpZ2h0IChjKSAyMDE0LCBGYWNlYm9vaywgSW5jLlxuICogQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqXG4gKiBUaGlzIHNvdXJjZSBjb2RlIGlzIGxpY2Vuc2VkIHVuZGVyIHRoZSBCU0Qtc3R5bGUgbGljZW5zZSBmb3VuZCBpbiB0aGVcbiAqIExJQ0VOU0UgZmlsZSBpbiB0aGUgcm9vdCBkaXJlY3Rvcnkgb2YgdGhpcyBzb3VyY2UgdHJlZS4gQW4gYWRkaXRpb25hbCBncmFudFxuICogb2YgcGF0ZW50IHJpZ2h0cyBjYW4gYmUgZm91bmQgaW4gdGhlIFBBVEVOVFMgZmlsZSBpbiB0aGUgc2FtZSBkaXJlY3RvcnkuXG4gKi9cblxubW9kdWxlLmV4cG9ydHMuRGlzcGF0Y2hlciA9IHJlcXVpcmUoJy4vbGliL0Rpc3BhdGNoZXInKVxuIiwiLypcbiAqIENvcHlyaWdodCAoYykgMjAxNCwgRmFjZWJvb2ssIEluYy5cbiAqIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKlxuICogVGhpcyBzb3VyY2UgY29kZSBpcyBsaWNlbnNlZCB1bmRlciB0aGUgQlNELXN0eWxlIGxpY2Vuc2UgZm91bmQgaW4gdGhlXG4gKiBMSUNFTlNFIGZpbGUgaW4gdGhlIHJvb3QgZGlyZWN0b3J5IG9mIHRoaXMgc291cmNlIHRyZWUuIEFuIGFkZGl0aW9uYWwgZ3JhbnRcbiAqIG9mIHBhdGVudCByaWdodHMgY2FuIGJlIGZvdW5kIGluIHRoZSBQQVRFTlRTIGZpbGUgaW4gdGhlIHNhbWUgZGlyZWN0b3J5LlxuICpcbiAqIEBwcm92aWRlc01vZHVsZSBEaXNwYXRjaGVyXG4gKiBAdHlwZWNoZWNrc1xuICovXG5cblwidXNlIHN0cmljdFwiO1xuXG52YXIgaW52YXJpYW50ID0gcmVxdWlyZSgnLi9pbnZhcmlhbnQnKTtcblxudmFyIF9sYXN0SUQgPSAxO1xudmFyIF9wcmVmaXggPSAnSURfJztcblxuLyoqXG4gKiBEaXNwYXRjaGVyIGlzIHVzZWQgdG8gYnJvYWRjYXN0IHBheWxvYWRzIHRvIHJlZ2lzdGVyZWQgY2FsbGJhY2tzLiBUaGlzIGlzXG4gKiBkaWZmZXJlbnQgZnJvbSBnZW5lcmljIHB1Yi1zdWIgc3lzdGVtcyBpbiB0d28gd2F5czpcbiAqXG4gKiAgIDEpIENhbGxiYWNrcyBhcmUgbm90IHN1YnNjcmliZWQgdG8gcGFydGljdWxhciBldmVudHMuIEV2ZXJ5IHBheWxvYWQgaXNcbiAqICAgICAgZGlzcGF0Y2hlZCB0byBldmVyeSByZWdpc3RlcmVkIGNhbGxiYWNrLlxuICogICAyKSBDYWxsYmFja3MgY2FuIGJlIGRlZmVycmVkIGluIHdob2xlIG9yIHBhcnQgdW50aWwgb3RoZXIgY2FsbGJhY2tzIGhhdmVcbiAqICAgICAgYmVlbiBleGVjdXRlZC5cbiAqXG4gKiBGb3IgZXhhbXBsZSwgY29uc2lkZXIgdGhpcyBoeXBvdGhldGljYWwgZmxpZ2h0IGRlc3RpbmF0aW9uIGZvcm0sIHdoaWNoXG4gKiBzZWxlY3RzIGEgZGVmYXVsdCBjaXR5IHdoZW4gYSBjb3VudHJ5IGlzIHNlbGVjdGVkOlxuICpcbiAqICAgdmFyIGZsaWdodERpc3BhdGNoZXIgPSBuZXcgRGlzcGF0Y2hlcigpO1xuICpcbiAqICAgLy8gS2VlcHMgdHJhY2sgb2Ygd2hpY2ggY291bnRyeSBpcyBzZWxlY3RlZFxuICogICB2YXIgQ291bnRyeVN0b3JlID0ge2NvdW50cnk6IG51bGx9O1xuICpcbiAqICAgLy8gS2VlcHMgdHJhY2sgb2Ygd2hpY2ggY2l0eSBpcyBzZWxlY3RlZFxuICogICB2YXIgQ2l0eVN0b3JlID0ge2NpdHk6IG51bGx9O1xuICpcbiAqICAgLy8gS2VlcHMgdHJhY2sgb2YgdGhlIGJhc2UgZmxpZ2h0IHByaWNlIG9mIHRoZSBzZWxlY3RlZCBjaXR5XG4gKiAgIHZhciBGbGlnaHRQcmljZVN0b3JlID0ge3ByaWNlOiBudWxsfVxuICpcbiAqIFdoZW4gYSB1c2VyIGNoYW5nZXMgdGhlIHNlbGVjdGVkIGNpdHksIHdlIGRpc3BhdGNoIHRoZSBwYXlsb2FkOlxuICpcbiAqICAgZmxpZ2h0RGlzcGF0Y2hlci5kaXNwYXRjaCh7XG4gKiAgICAgYWN0aW9uVHlwZTogJ2NpdHktdXBkYXRlJyxcbiAqICAgICBzZWxlY3RlZENpdHk6ICdwYXJpcydcbiAqICAgfSk7XG4gKlxuICogVGhpcyBwYXlsb2FkIGlzIGRpZ2VzdGVkIGJ5IGBDaXR5U3RvcmVgOlxuICpcbiAqICAgZmxpZ2h0RGlzcGF0Y2hlci5yZWdpc3RlcihmdW5jdGlvbihwYXlsb2FkKSB7XG4gKiAgICAgaWYgKHBheWxvYWQuYWN0aW9uVHlwZSA9PT0gJ2NpdHktdXBkYXRlJykge1xuICogICAgICAgQ2l0eVN0b3JlLmNpdHkgPSBwYXlsb2FkLnNlbGVjdGVkQ2l0eTtcbiAqICAgICB9XG4gKiAgIH0pO1xuICpcbiAqIFdoZW4gdGhlIHVzZXIgc2VsZWN0cyBhIGNvdW50cnksIHdlIGRpc3BhdGNoIHRoZSBwYXlsb2FkOlxuICpcbiAqICAgZmxpZ2h0RGlzcGF0Y2hlci5kaXNwYXRjaCh7XG4gKiAgICAgYWN0aW9uVHlwZTogJ2NvdW50cnktdXBkYXRlJyxcbiAqICAgICBzZWxlY3RlZENvdW50cnk6ICdhdXN0cmFsaWEnXG4gKiAgIH0pO1xuICpcbiAqIFRoaXMgcGF5bG9hZCBpcyBkaWdlc3RlZCBieSBib3RoIHN0b3JlczpcbiAqXG4gKiAgICBDb3VudHJ5U3RvcmUuZGlzcGF0Y2hUb2tlbiA9IGZsaWdodERpc3BhdGNoZXIucmVnaXN0ZXIoZnVuY3Rpb24ocGF5bG9hZCkge1xuICogICAgIGlmIChwYXlsb2FkLmFjdGlvblR5cGUgPT09ICdjb3VudHJ5LXVwZGF0ZScpIHtcbiAqICAgICAgIENvdW50cnlTdG9yZS5jb3VudHJ5ID0gcGF5bG9hZC5zZWxlY3RlZENvdW50cnk7XG4gKiAgICAgfVxuICogICB9KTtcbiAqXG4gKiBXaGVuIHRoZSBjYWxsYmFjayB0byB1cGRhdGUgYENvdW50cnlTdG9yZWAgaXMgcmVnaXN0ZXJlZCwgd2Ugc2F2ZSBhIHJlZmVyZW5jZVxuICogdG8gdGhlIHJldHVybmVkIHRva2VuLiBVc2luZyB0aGlzIHRva2VuIHdpdGggYHdhaXRGb3IoKWAsIHdlIGNhbiBndWFyYW50ZWVcbiAqIHRoYXQgYENvdW50cnlTdG9yZWAgaXMgdXBkYXRlZCBiZWZvcmUgdGhlIGNhbGxiYWNrIHRoYXQgdXBkYXRlcyBgQ2l0eVN0b3JlYFxuICogbmVlZHMgdG8gcXVlcnkgaXRzIGRhdGEuXG4gKlxuICogICBDaXR5U3RvcmUuZGlzcGF0Y2hUb2tlbiA9IGZsaWdodERpc3BhdGNoZXIucmVnaXN0ZXIoZnVuY3Rpb24ocGF5bG9hZCkge1xuICogICAgIGlmIChwYXlsb2FkLmFjdGlvblR5cGUgPT09ICdjb3VudHJ5LXVwZGF0ZScpIHtcbiAqICAgICAgIC8vIGBDb3VudHJ5U3RvcmUuY291bnRyeWAgbWF5IG5vdCBiZSB1cGRhdGVkLlxuICogICAgICAgZmxpZ2h0RGlzcGF0Y2hlci53YWl0Rm9yKFtDb3VudHJ5U3RvcmUuZGlzcGF0Y2hUb2tlbl0pO1xuICogICAgICAgLy8gYENvdW50cnlTdG9yZS5jb3VudHJ5YCBpcyBub3cgZ3VhcmFudGVlZCB0byBiZSB1cGRhdGVkLlxuICpcbiAqICAgICAgIC8vIFNlbGVjdCB0aGUgZGVmYXVsdCBjaXR5IGZvciB0aGUgbmV3IGNvdW50cnlcbiAqICAgICAgIENpdHlTdG9yZS5jaXR5ID0gZ2V0RGVmYXVsdENpdHlGb3JDb3VudHJ5KENvdW50cnlTdG9yZS5jb3VudHJ5KTtcbiAqICAgICB9XG4gKiAgIH0pO1xuICpcbiAqIFRoZSB1c2FnZSBvZiBgd2FpdEZvcigpYCBjYW4gYmUgY2hhaW5lZCwgZm9yIGV4YW1wbGU6XG4gKlxuICogICBGbGlnaHRQcmljZVN0b3JlLmRpc3BhdGNoVG9rZW4gPVxuICogICAgIGZsaWdodERpc3BhdGNoZXIucmVnaXN0ZXIoZnVuY3Rpb24ocGF5bG9hZCkge1xuICogICAgICAgc3dpdGNoIChwYXlsb2FkLmFjdGlvblR5cGUpIHtcbiAqICAgICAgICAgY2FzZSAnY291bnRyeS11cGRhdGUnOlxuICogICAgICAgICAgIGZsaWdodERpc3BhdGNoZXIud2FpdEZvcihbQ2l0eVN0b3JlLmRpc3BhdGNoVG9rZW5dKTtcbiAqICAgICAgICAgICBGbGlnaHRQcmljZVN0b3JlLnByaWNlID1cbiAqICAgICAgICAgICAgIGdldEZsaWdodFByaWNlU3RvcmUoQ291bnRyeVN0b3JlLmNvdW50cnksIENpdHlTdG9yZS5jaXR5KTtcbiAqICAgICAgICAgICBicmVhaztcbiAqXG4gKiAgICAgICAgIGNhc2UgJ2NpdHktdXBkYXRlJzpcbiAqICAgICAgICAgICBGbGlnaHRQcmljZVN0b3JlLnByaWNlID1cbiAqICAgICAgICAgICAgIEZsaWdodFByaWNlU3RvcmUoQ291bnRyeVN0b3JlLmNvdW50cnksIENpdHlTdG9yZS5jaXR5KTtcbiAqICAgICAgICAgICBicmVhaztcbiAqICAgICB9XG4gKiAgIH0pO1xuICpcbiAqIFRoZSBgY291bnRyeS11cGRhdGVgIHBheWxvYWQgd2lsbCBiZSBndWFyYW50ZWVkIHRvIGludm9rZSB0aGUgc3RvcmVzJ1xuICogcmVnaXN0ZXJlZCBjYWxsYmFja3MgaW4gb3JkZXI6IGBDb3VudHJ5U3RvcmVgLCBgQ2l0eVN0b3JlYCwgdGhlblxuICogYEZsaWdodFByaWNlU3RvcmVgLlxuICovXG5cbiAgZnVuY3Rpb24gRGlzcGF0Y2hlcigpIHtcbiAgICB0aGlzLiREaXNwYXRjaGVyX2NhbGxiYWNrcyA9IHt9O1xuICAgIHRoaXMuJERpc3BhdGNoZXJfaXNQZW5kaW5nID0ge307XG4gICAgdGhpcy4kRGlzcGF0Y2hlcl9pc0hhbmRsZWQgPSB7fTtcbiAgICB0aGlzLiREaXNwYXRjaGVyX2lzRGlzcGF0Y2hpbmcgPSBmYWxzZTtcbiAgICB0aGlzLiREaXNwYXRjaGVyX3BlbmRpbmdQYXlsb2FkID0gbnVsbDtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZWdpc3RlcnMgYSBjYWxsYmFjayB0byBiZSBpbnZva2VkIHdpdGggZXZlcnkgZGlzcGF0Y2hlZCBwYXlsb2FkLiBSZXR1cm5zXG4gICAqIGEgdG9rZW4gdGhhdCBjYW4gYmUgdXNlZCB3aXRoIGB3YWl0Rm9yKClgLlxuICAgKlxuICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBjYWxsYmFja1xuICAgKiBAcmV0dXJuIHtzdHJpbmd9XG4gICAqL1xuICBEaXNwYXRjaGVyLnByb3RvdHlwZS5yZWdpc3Rlcj1mdW5jdGlvbihjYWxsYmFjaykge1xuICAgIHZhciBpZCA9IF9wcmVmaXggKyBfbGFzdElEKys7XG4gICAgdGhpcy4kRGlzcGF0Y2hlcl9jYWxsYmFja3NbaWRdID0gY2FsbGJhY2s7XG4gICAgcmV0dXJuIGlkO1xuICB9O1xuXG4gIC8qKlxuICAgKiBSZW1vdmVzIGEgY2FsbGJhY2sgYmFzZWQgb24gaXRzIHRva2VuLlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gaWRcbiAgICovXG4gIERpc3BhdGNoZXIucHJvdG90eXBlLnVucmVnaXN0ZXI9ZnVuY3Rpb24oaWQpIHtcbiAgICBpbnZhcmlhbnQoXG4gICAgICB0aGlzLiREaXNwYXRjaGVyX2NhbGxiYWNrc1tpZF0sXG4gICAgICAnRGlzcGF0Y2hlci51bnJlZ2lzdGVyKC4uLik6IGAlc2AgZG9lcyBub3QgbWFwIHRvIGEgcmVnaXN0ZXJlZCBjYWxsYmFjay4nLFxuICAgICAgaWRcbiAgICApO1xuICAgIGRlbGV0ZSB0aGlzLiREaXNwYXRjaGVyX2NhbGxiYWNrc1tpZF07XG4gIH07XG5cbiAgLyoqXG4gICAqIFdhaXRzIGZvciB0aGUgY2FsbGJhY2tzIHNwZWNpZmllZCB0byBiZSBpbnZva2VkIGJlZm9yZSBjb250aW51aW5nIGV4ZWN1dGlvblxuICAgKiBvZiB0aGUgY3VycmVudCBjYWxsYmFjay4gVGhpcyBtZXRob2Qgc2hvdWxkIG9ubHkgYmUgdXNlZCBieSBhIGNhbGxiYWNrIGluXG4gICAqIHJlc3BvbnNlIHRvIGEgZGlzcGF0Y2hlZCBwYXlsb2FkLlxuICAgKlxuICAgKiBAcGFyYW0ge2FycmF5PHN0cmluZz59IGlkc1xuICAgKi9cbiAgRGlzcGF0Y2hlci5wcm90b3R5cGUud2FpdEZvcj1mdW5jdGlvbihpZHMpIHtcbiAgICBpbnZhcmlhbnQoXG4gICAgICB0aGlzLiREaXNwYXRjaGVyX2lzRGlzcGF0Y2hpbmcsXG4gICAgICAnRGlzcGF0Y2hlci53YWl0Rm9yKC4uLik6IE11c3QgYmUgaW52b2tlZCB3aGlsZSBkaXNwYXRjaGluZy4nXG4gICAgKTtcbiAgICBmb3IgKHZhciBpaSA9IDA7IGlpIDwgaWRzLmxlbmd0aDsgaWkrKykge1xuICAgICAgdmFyIGlkID0gaWRzW2lpXTtcbiAgICAgIGlmICh0aGlzLiREaXNwYXRjaGVyX2lzUGVuZGluZ1tpZF0pIHtcbiAgICAgICAgaW52YXJpYW50KFxuICAgICAgICAgIHRoaXMuJERpc3BhdGNoZXJfaXNIYW5kbGVkW2lkXSxcbiAgICAgICAgICAnRGlzcGF0Y2hlci53YWl0Rm9yKC4uLik6IENpcmN1bGFyIGRlcGVuZGVuY3kgZGV0ZWN0ZWQgd2hpbGUgJyArXG4gICAgICAgICAgJ3dhaXRpbmcgZm9yIGAlc2AuJyxcbiAgICAgICAgICBpZFxuICAgICAgICApO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIGludmFyaWFudChcbiAgICAgICAgdGhpcy4kRGlzcGF0Y2hlcl9jYWxsYmFja3NbaWRdLFxuICAgICAgICAnRGlzcGF0Y2hlci53YWl0Rm9yKC4uLik6IGAlc2AgZG9lcyBub3QgbWFwIHRvIGEgcmVnaXN0ZXJlZCBjYWxsYmFjay4nLFxuICAgICAgICBpZFxuICAgICAgKTtcbiAgICAgIHRoaXMuJERpc3BhdGNoZXJfaW52b2tlQ2FsbGJhY2soaWQpO1xuICAgIH1cbiAgfTtcblxuICAvKipcbiAgICogRGlzcGF0Y2hlcyBhIHBheWxvYWQgdG8gYWxsIHJlZ2lzdGVyZWQgY2FsbGJhY2tzLlxuICAgKlxuICAgKiBAcGFyYW0ge29iamVjdH0gcGF5bG9hZFxuICAgKi9cbiAgRGlzcGF0Y2hlci5wcm90b3R5cGUuZGlzcGF0Y2g9ZnVuY3Rpb24ocGF5bG9hZCkge1xuICAgIGludmFyaWFudChcbiAgICAgICF0aGlzLiREaXNwYXRjaGVyX2lzRGlzcGF0Y2hpbmcsXG4gICAgICAnRGlzcGF0Y2guZGlzcGF0Y2goLi4uKTogQ2Fubm90IGRpc3BhdGNoIGluIHRoZSBtaWRkbGUgb2YgYSBkaXNwYXRjaC4nXG4gICAgKTtcbiAgICB0aGlzLiREaXNwYXRjaGVyX3N0YXJ0RGlzcGF0Y2hpbmcocGF5bG9hZCk7XG4gICAgdHJ5IHtcbiAgICAgIGZvciAodmFyIGlkIGluIHRoaXMuJERpc3BhdGNoZXJfY2FsbGJhY2tzKSB7XG4gICAgICAgIGlmICh0aGlzLiREaXNwYXRjaGVyX2lzUGVuZGluZ1tpZF0pIHtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLiREaXNwYXRjaGVyX2ludm9rZUNhbGxiYWNrKGlkKTtcbiAgICAgIH1cbiAgICB9IGZpbmFsbHkge1xuICAgICAgdGhpcy4kRGlzcGF0Y2hlcl9zdG9wRGlzcGF0Y2hpbmcoKTtcbiAgICB9XG4gIH07XG5cbiAgLyoqXG4gICAqIElzIHRoaXMgRGlzcGF0Y2hlciBjdXJyZW50bHkgZGlzcGF0Y2hpbmcuXG4gICAqXG4gICAqIEByZXR1cm4ge2Jvb2xlYW59XG4gICAqL1xuICBEaXNwYXRjaGVyLnByb3RvdHlwZS5pc0Rpc3BhdGNoaW5nPWZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLiREaXNwYXRjaGVyX2lzRGlzcGF0Y2hpbmc7XG4gIH07XG5cbiAgLyoqXG4gICAqIENhbGwgdGhlIGNhbGxiYWNrIHN0b3JlZCB3aXRoIHRoZSBnaXZlbiBpZC4gQWxzbyBkbyBzb21lIGludGVybmFsXG4gICAqIGJvb2trZWVwaW5nLlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gaWRcbiAgICogQGludGVybmFsXG4gICAqL1xuICBEaXNwYXRjaGVyLnByb3RvdHlwZS4kRGlzcGF0Y2hlcl9pbnZva2VDYWxsYmFjaz1mdW5jdGlvbihpZCkge1xuICAgIHRoaXMuJERpc3BhdGNoZXJfaXNQZW5kaW5nW2lkXSA9IHRydWU7XG4gICAgdGhpcy4kRGlzcGF0Y2hlcl9jYWxsYmFja3NbaWRdKHRoaXMuJERpc3BhdGNoZXJfcGVuZGluZ1BheWxvYWQpO1xuICAgIHRoaXMuJERpc3BhdGNoZXJfaXNIYW5kbGVkW2lkXSA9IHRydWU7XG4gIH07XG5cbiAgLyoqXG4gICAqIFNldCB1cCBib29ra2VlcGluZyBuZWVkZWQgd2hlbiBkaXNwYXRjaGluZy5cbiAgICpcbiAgICogQHBhcmFtIHtvYmplY3R9IHBheWxvYWRcbiAgICogQGludGVybmFsXG4gICAqL1xuICBEaXNwYXRjaGVyLnByb3RvdHlwZS4kRGlzcGF0Y2hlcl9zdGFydERpc3BhdGNoaW5nPWZ1bmN0aW9uKHBheWxvYWQpIHtcbiAgICBmb3IgKHZhciBpZCBpbiB0aGlzLiREaXNwYXRjaGVyX2NhbGxiYWNrcykge1xuICAgICAgdGhpcy4kRGlzcGF0Y2hlcl9pc1BlbmRpbmdbaWRdID0gZmFsc2U7XG4gICAgICB0aGlzLiREaXNwYXRjaGVyX2lzSGFuZGxlZFtpZF0gPSBmYWxzZTtcbiAgICB9XG4gICAgdGhpcy4kRGlzcGF0Y2hlcl9wZW5kaW5nUGF5bG9hZCA9IHBheWxvYWQ7XG4gICAgdGhpcy4kRGlzcGF0Y2hlcl9pc0Rpc3BhdGNoaW5nID0gdHJ1ZTtcbiAgfTtcblxuICAvKipcbiAgICogQ2xlYXIgYm9va2tlZXBpbmcgdXNlZCBmb3IgZGlzcGF0Y2hpbmcuXG4gICAqXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgRGlzcGF0Y2hlci5wcm90b3R5cGUuJERpc3BhdGNoZXJfc3RvcERpc3BhdGNoaW5nPWZ1bmN0aW9uKCkge1xuICAgIHRoaXMuJERpc3BhdGNoZXJfcGVuZGluZ1BheWxvYWQgPSBudWxsO1xuICAgIHRoaXMuJERpc3BhdGNoZXJfaXNEaXNwYXRjaGluZyA9IGZhbHNlO1xuICB9O1xuXG5cbm1vZHVsZS5leHBvcnRzID0gRGlzcGF0Y2hlcjtcbiIsIi8qKlxuICogQ29weXJpZ2h0IChjKSAyMDE0LCBGYWNlYm9vaywgSW5jLlxuICogQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqXG4gKiBUaGlzIHNvdXJjZSBjb2RlIGlzIGxpY2Vuc2VkIHVuZGVyIHRoZSBCU0Qtc3R5bGUgbGljZW5zZSBmb3VuZCBpbiB0aGVcbiAqIExJQ0VOU0UgZmlsZSBpbiB0aGUgcm9vdCBkaXJlY3Rvcnkgb2YgdGhpcyBzb3VyY2UgdHJlZS4gQW4gYWRkaXRpb25hbCBncmFudFxuICogb2YgcGF0ZW50IHJpZ2h0cyBjYW4gYmUgZm91bmQgaW4gdGhlIFBBVEVOVFMgZmlsZSBpbiB0aGUgc2FtZSBkaXJlY3RvcnkuXG4gKlxuICogQHByb3ZpZGVzTW9kdWxlIGludmFyaWFudFxuICovXG5cblwidXNlIHN0cmljdFwiO1xuXG4vKipcbiAqIFVzZSBpbnZhcmlhbnQoKSB0byBhc3NlcnQgc3RhdGUgd2hpY2ggeW91ciBwcm9ncmFtIGFzc3VtZXMgdG8gYmUgdHJ1ZS5cbiAqXG4gKiBQcm92aWRlIHNwcmludGYtc3R5bGUgZm9ybWF0IChvbmx5ICVzIGlzIHN1cHBvcnRlZCkgYW5kIGFyZ3VtZW50c1xuICogdG8gcHJvdmlkZSBpbmZvcm1hdGlvbiBhYm91dCB3aGF0IGJyb2tlIGFuZCB3aGF0IHlvdSB3ZXJlXG4gKiBleHBlY3RpbmcuXG4gKlxuICogVGhlIGludmFyaWFudCBtZXNzYWdlIHdpbGwgYmUgc3RyaXBwZWQgaW4gcHJvZHVjdGlvbiwgYnV0IHRoZSBpbnZhcmlhbnRcbiAqIHdpbGwgcmVtYWluIHRvIGVuc3VyZSBsb2dpYyBkb2VzIG5vdCBkaWZmZXIgaW4gcHJvZHVjdGlvbi5cbiAqL1xuXG52YXIgaW52YXJpYW50ID0gZnVuY3Rpb24oY29uZGl0aW9uLCBmb3JtYXQsIGEsIGIsIGMsIGQsIGUsIGYpIHtcbiAgaWYgKGZhbHNlKSB7XG4gICAgaWYgKGZvcm1hdCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ2ludmFyaWFudCByZXF1aXJlcyBhbiBlcnJvciBtZXNzYWdlIGFyZ3VtZW50Jyk7XG4gICAgfVxuICB9XG5cbiAgaWYgKCFjb25kaXRpb24pIHtcbiAgICB2YXIgZXJyb3I7XG4gICAgaWYgKGZvcm1hdCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBlcnJvciA9IG5ldyBFcnJvcihcbiAgICAgICAgJ01pbmlmaWVkIGV4Y2VwdGlvbiBvY2N1cnJlZDsgdXNlIHRoZSBub24tbWluaWZpZWQgZGV2IGVudmlyb25tZW50ICcgK1xuICAgICAgICAnZm9yIHRoZSBmdWxsIGVycm9yIG1lc3NhZ2UgYW5kIGFkZGl0aW9uYWwgaGVscGZ1bCB3YXJuaW5ncy4nXG4gICAgICApO1xuICAgIH0gZWxzZSB7XG4gICAgICB2YXIgYXJncyA9IFthLCBiLCBjLCBkLCBlLCBmXTtcbiAgICAgIHZhciBhcmdJbmRleCA9IDA7XG4gICAgICBlcnJvciA9IG5ldyBFcnJvcihcbiAgICAgICAgJ0ludmFyaWFudCBWaW9sYXRpb246ICcgK1xuICAgICAgICBmb3JtYXQucmVwbGFjZSgvJXMvZywgZnVuY3Rpb24oKSB7IHJldHVybiBhcmdzW2FyZ0luZGV4KytdOyB9KVxuICAgICAgKTtcbiAgICB9XG5cbiAgICBlcnJvci5mcmFtZXNUb1BvcCA9IDE7IC8vIHdlIGRvbid0IGNhcmUgYWJvdXQgaW52YXJpYW50J3Mgb3duIGZyYW1lXG4gICAgdGhyb3cgZXJyb3I7XG4gIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gaW52YXJpYW50O1xuIiwidmFyIHRvcExldmVsID0gdHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcgPyBnbG9iYWwgOlxuICAgIHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnID8gd2luZG93IDoge31cbnZhciBtaW5Eb2MgPSByZXF1aXJlKCdtaW4tZG9jdW1lbnQnKTtcblxuaWYgKHR5cGVvZiBkb2N1bWVudCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICBtb2R1bGUuZXhwb3J0cyA9IGRvY3VtZW50O1xufSBlbHNlIHtcbiAgICB2YXIgZG9jY3kgPSB0b3BMZXZlbFsnX19HTE9CQUxfRE9DVU1FTlRfQ0FDSEVANCddO1xuXG4gICAgaWYgKCFkb2NjeSkge1xuICAgICAgICBkb2NjeSA9IHRvcExldmVsWydfX0dMT0JBTF9ET0NVTUVOVF9DQUNIRUA0J10gPSBtaW5Eb2M7XG4gICAgfVxuXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBkb2NjeTtcbn1cbiIsImlmICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgbW9kdWxlLmV4cG9ydHMgPSB3aW5kb3c7XG59IGVsc2UgaWYgKHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICBtb2R1bGUuZXhwb3J0cyA9IGdsb2JhbDtcbn0gZWxzZSBpZiAodHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIpe1xuICAgIG1vZHVsZS5leHBvcnRzID0gc2VsZjtcbn0gZWxzZSB7XG4gICAgbW9kdWxlLmV4cG9ydHMgPSB7fTtcbn1cbiIsIlxudmFyIHV0aWwgPSByZXF1aXJlKCd1dGlsJyk7XG5cbnZhciB0b2tlbml6ZSA9IGZ1bmN0aW9uKC8qU3RyaW5nKi8gc3RyLCAvKlJlZ0V4cCovIHJlLCAvKkZ1bmN0aW9uPyovIHBhcnNlRGVsaW0sIC8qT2JqZWN0PyovIGluc3RhbmNlKXtcbiAgLy8gc3VtbWFyeTpcbiAgLy8gICAgU3BsaXQgYSBzdHJpbmcgYnkgYSByZWd1bGFyIGV4cHJlc3Npb24gd2l0aCB0aGUgYWJpbGl0eSB0byBjYXB0dXJlIHRoZSBkZWxpbWV0ZXJzXG4gIC8vIHBhcnNlRGVsaW06XG4gIC8vICAgIEVhY2ggZ3JvdXAgKGV4Y2x1ZGluZyB0aGUgMCBncm91cCkgaXMgcGFzc2VkIGFzIGEgcGFyYW1ldGVyLiBJZiB0aGUgZnVuY3Rpb24gcmV0dXJuc1xuICAvLyAgICBhIHZhbHVlLCBpdCdzIGFkZGVkIHRvIHRoZSBsaXN0IG9mIHRva2Vucy5cbiAgLy8gaW5zdGFuY2U6XG4gIC8vICAgIFVzZWQgYXMgdGhlIFwidGhpcycgaW5zdGFuY2Ugd2hlbiBjYWxsaW5nIHBhcnNlRGVsaW1cbiAgdmFyIHRva2VucyA9IFtdO1xuICB2YXIgbWF0Y2gsIGNvbnRlbnQsIGxhc3RJbmRleCA9IDA7XG4gIHdoaWxlKG1hdGNoID0gcmUuZXhlYyhzdHIpKXtcbiAgICBjb250ZW50ID0gc3RyLnNsaWNlKGxhc3RJbmRleCwgcmUubGFzdEluZGV4IC0gbWF0Y2hbMF0ubGVuZ3RoKTtcbiAgICBpZihjb250ZW50Lmxlbmd0aCl7XG4gICAgICB0b2tlbnMucHVzaChjb250ZW50KTtcbiAgICB9XG4gICAgaWYocGFyc2VEZWxpbSl7XG4gICAgICB2YXIgcGFyc2VkID0gcGFyc2VEZWxpbS5hcHBseShpbnN0YW5jZSwgbWF0Y2guc2xpY2UoMSkuY29uY2F0KHRva2Vucy5sZW5ndGgpKTtcbiAgICAgIGlmKHR5cGVvZiBwYXJzZWQgIT0gJ3VuZGVmaW5lZCcpe1xuICAgICAgICBpZihwYXJzZWQuc3BlY2lmaWVyID09PSAnJScpe1xuICAgICAgICAgIHRva2Vucy5wdXNoKCclJyk7XG4gICAgICAgIH1lbHNle1xuICAgICAgICAgIHRva2Vucy5wdXNoKHBhcnNlZCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgbGFzdEluZGV4ID0gcmUubGFzdEluZGV4O1xuICB9XG4gIGNvbnRlbnQgPSBzdHIuc2xpY2UobGFzdEluZGV4KTtcbiAgaWYoY29udGVudC5sZW5ndGgpe1xuICAgIHRva2Vucy5wdXNoKGNvbnRlbnQpO1xuICB9XG4gIHJldHVybiB0b2tlbnM7XG59XG5cbnZhciBGb3JtYXR0ZXIgPSBmdW5jdGlvbigvKlN0cmluZyovIGZvcm1hdCl7XG4gIHZhciB0b2tlbnMgPSBbXTtcbiAgdGhpcy5fbWFwcGVkID0gZmFsc2U7XG4gIHRoaXMuX2Zvcm1hdCA9IGZvcm1hdDtcbiAgdGhpcy5fdG9rZW5zID0gdG9rZW5pemUoZm9ybWF0LCB0aGlzLl9yZSwgdGhpcy5fcGFyc2VEZWxpbSwgdGhpcyk7XG59XG5cbkZvcm1hdHRlci5wcm90b3R5cGUuX3JlID0gL1xcJSg/OlxcKChbXFx3X10rKVxcKXwoWzEtOV1cXGQqKVxcJCk/KFswICtcXC1cXCNdKikoXFwqfFxcZCspPyhcXC4pPyhcXCp8XFxkKyk/W2hsTF0/KFtcXCVic2NkZUVmRmdHaW9PdXhYXSkvZztcbkZvcm1hdHRlci5wcm90b3R5cGUuX3BhcnNlRGVsaW0gPSBmdW5jdGlvbihtYXBwaW5nLCBpbnRtYXBwaW5nLCBmbGFncywgbWluV2lkdGgsIHBlcmlvZCwgcHJlY2lzaW9uLCBzcGVjaWZpZXIpe1xuICBpZihtYXBwaW5nKXtcbiAgICB0aGlzLl9tYXBwZWQgPSB0cnVlO1xuICB9XG4gIHJldHVybiB7XG4gICAgbWFwcGluZzogbWFwcGluZyxcbiAgICBpbnRtYXBwaW5nOiBpbnRtYXBwaW5nLFxuICAgIGZsYWdzOiBmbGFncyxcbiAgICBfbWluV2lkdGg6IG1pbldpZHRoLCAvLyBNYXkgYmUgZGVwZW5kZW50IG9uIHBhcmFtZXRlcnNcbiAgICBwZXJpb2Q6IHBlcmlvZCxcbiAgICBfcHJlY2lzaW9uOiBwcmVjaXNpb24sIC8vIE1heSBiZSBkZXBlbmRlbnQgb24gcGFyYW1ldGVyc1xuICAgIHNwZWNpZmllcjogc3BlY2lmaWVyXG4gIH07XG59O1xuRm9ybWF0dGVyLnByb3RvdHlwZS5fc3BlY2lmaWVycyA9IHtcbiAgYjoge1xuICAgIGJhc2U6IDIsXG4gICAgaXNJbnQ6IHRydWVcbiAgfSxcbiAgbzoge1xuICAgIGJhc2U6IDgsXG4gICAgaXNJbnQ6IHRydWVcbiAgfSxcbiAgeDoge1xuICAgIGJhc2U6IDE2LFxuICAgIGlzSW50OiB0cnVlXG4gIH0sXG4gIFg6IHtcbiAgICBleHRlbmQ6IFsneCddLFxuICAgIHRvVXBwZXI6IHRydWVcbiAgfSxcbiAgZDoge1xuICAgIGJhc2U6IDEwLFxuICAgIGlzSW50OiB0cnVlXG4gIH0sXG4gIGk6IHtcbiAgICBleHRlbmQ6IFsnZCddXG4gIH0sXG4gIHU6IHtcbiAgICBleHRlbmQ6IFsnZCddLFxuICAgIGlzVW5zaWduZWQ6IHRydWVcbiAgfSxcbiAgYzoge1xuICAgIHNldEFyZzogZnVuY3Rpb24odG9rZW4pe1xuICAgICAgaWYoIWlzTmFOKHRva2VuLmFyZykpe1xuICAgICAgICB2YXIgbnVtID0gcGFyc2VJbnQodG9rZW4uYXJnKTtcbiAgICAgICAgaWYobnVtIDwgMCB8fCBudW0gPiAxMjcpe1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcignaW52YWxpZCBjaGFyYWN0ZXIgY29kZSBwYXNzZWQgdG8gJWMgaW4gcHJpbnRmJyk7XG4gICAgICAgIH1cbiAgICAgICAgdG9rZW4uYXJnID0gaXNOYU4obnVtKSA/ICcnICsgbnVtIDogU3RyaW5nLmZyb21DaGFyQ29kZShudW0pO1xuICAgICAgfVxuICAgIH1cbiAgfSxcbiAgczoge1xuICAgIHNldE1heFdpZHRoOiBmdW5jdGlvbih0b2tlbil7XG4gICAgICB0b2tlbi5tYXhXaWR0aCA9ICh0b2tlbi5wZXJpb2QgPT0gJy4nKSA/IHRva2VuLnByZWNpc2lvbiA6IC0xO1xuICAgIH1cbiAgfSxcbiAgZToge1xuICAgIGlzRG91YmxlOiB0cnVlLFxuICAgIGRvdWJsZU5vdGF0aW9uOiAnZSdcbiAgfSxcbiAgRToge1xuICAgIGV4dGVuZDogWydlJ10sXG4gICAgdG9VcHBlcjogdHJ1ZVxuICB9LFxuICBmOiB7XG4gICAgaXNEb3VibGU6IHRydWUsXG4gICAgZG91YmxlTm90YXRpb246ICdmJ1xuICB9LFxuICBGOiB7XG4gICAgZXh0ZW5kOiBbJ2YnXVxuICB9LFxuICBnOiB7XG4gICAgaXNEb3VibGU6IHRydWUsXG4gICAgZG91YmxlTm90YXRpb246ICdnJ1xuICB9LFxuICBHOiB7XG4gICAgZXh0ZW5kOiBbJ2cnXSxcbiAgICB0b1VwcGVyOiB0cnVlXG4gIH0sXG4gIE86IHtcbiAgICBpc09iamVjdDogdHJ1ZVxuICB9LFxufTtcbkZvcm1hdHRlci5wcm90b3R5cGUuZm9ybWF0ID0gZnVuY3Rpb24oLyptaXhlZC4uLiovIGZpbGxlcil7XG4gIGlmKHRoaXMuX21hcHBlZCAmJiB0eXBlb2YgZmlsbGVyICE9ICdvYmplY3QnKXtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ2Zvcm1hdCByZXF1aXJlcyBhIG1hcHBpbmcnKTtcbiAgfVxuXG4gIHZhciBzdHIgPSAnJztcbiAgdmFyIHBvc2l0aW9uID0gMDtcbiAgZm9yKHZhciBpID0gMCwgdG9rZW47IGkgPCB0aGlzLl90b2tlbnMubGVuZ3RoOyBpKyspe1xuICAgIHRva2VuID0gdGhpcy5fdG9rZW5zW2ldO1xuICAgIFxuICAgIGlmKHR5cGVvZiB0b2tlbiA9PSAnc3RyaW5nJyl7XG4gICAgICBzdHIgKz0gdG9rZW47XG4gICAgfWVsc2V7XG4gICAgICBpZih0aGlzLl9tYXBwZWQpe1xuICAgICAgICBpZih0eXBlb2YgZmlsbGVyW3Rva2VuLm1hcHBpbmddID09ICd1bmRlZmluZWQnKXtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ21pc3Npbmcga2V5ICcgKyB0b2tlbi5tYXBwaW5nKTtcbiAgICAgICAgfVxuICAgICAgICB0b2tlbi5hcmcgPSBmaWxsZXJbdG9rZW4ubWFwcGluZ107XG4gICAgICB9ZWxzZXtcbiAgICAgICAgaWYodG9rZW4uaW50bWFwcGluZyl7XG4gICAgICAgICAgcG9zaXRpb24gPSBwYXJzZUludCh0b2tlbi5pbnRtYXBwaW5nKSAtIDE7XG4gICAgICAgIH1cbiAgICAgICAgaWYocG9zaXRpb24gPj0gYXJndW1lbnRzLmxlbmd0aCl7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdnb3QgJyArIGFyZ3VtZW50cy5sZW5ndGggKyAnIHByaW50ZiBhcmd1bWVudHMsIGluc3VmZmljaWVudCBmb3IgXFwnJyArIHRoaXMuX2Zvcm1hdCArICdcXCcnKTtcbiAgICAgICAgfVxuICAgICAgICB0b2tlbi5hcmcgPSBhcmd1bWVudHNbcG9zaXRpb24rK107XG4gICAgICB9XG5cbiAgICAgIGlmKCF0b2tlbi5jb21waWxlZCl7XG4gICAgICAgIHRva2VuLmNvbXBpbGVkID0gdHJ1ZTtcbiAgICAgICAgdG9rZW4uc2lnbiA9ICcnO1xuICAgICAgICB0b2tlbi56ZXJvUGFkID0gZmFsc2U7XG4gICAgICAgIHRva2VuLnJpZ2h0SnVzdGlmeSA9IGZhbHNlO1xuICAgICAgICB0b2tlbi5hbHRlcm5hdGl2ZSA9IGZhbHNlO1xuXG4gICAgICAgIHZhciBmbGFncyA9IHt9O1xuICAgICAgICBmb3IodmFyIGZpID0gdG9rZW4uZmxhZ3MubGVuZ3RoOyBmaS0tOyl7XG4gICAgICAgICAgdmFyIGZsYWcgPSB0b2tlbi5mbGFncy5jaGFyQXQoZmkpO1xuICAgICAgICAgIGZsYWdzW2ZsYWddID0gdHJ1ZTtcbiAgICAgICAgICBzd2l0Y2goZmxhZyl7XG4gICAgICAgICAgICBjYXNlICcgJzpcbiAgICAgICAgICAgICAgdG9rZW4uc2lnbiA9ICcgJztcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICcrJzpcbiAgICAgICAgICAgICAgdG9rZW4uc2lnbiA9ICcrJztcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICcwJzpcbiAgICAgICAgICAgICAgdG9rZW4uemVyb1BhZCA9IChmbGFnc1snLSddKSA/IGZhbHNlIDogdHJ1ZTtcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICctJzpcbiAgICAgICAgICAgICAgdG9rZW4ucmlnaHRKdXN0aWZ5ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgdG9rZW4uemVyb1BhZCA9IGZhbHNlO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJyMnOlxuICAgICAgICAgICAgICB0b2tlbi5hbHRlcm5hdGl2ZSA9IHRydWU7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgdGhyb3cgRXJyb3IoJ2JhZCBmb3JtYXR0aW5nIGZsYWcgXFwnJyArIHRva2VuLmZsYWdzLmNoYXJBdChmaSkgKyAnXFwnJyk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdG9rZW4ubWluV2lkdGggPSAodG9rZW4uX21pbldpZHRoKSA/IHBhcnNlSW50KHRva2VuLl9taW5XaWR0aCkgOiAwO1xuICAgICAgICB0b2tlbi5tYXhXaWR0aCA9IC0xO1xuICAgICAgICB0b2tlbi50b1VwcGVyID0gZmFsc2U7XG4gICAgICAgIHRva2VuLmlzVW5zaWduZWQgPSBmYWxzZTtcbiAgICAgICAgdG9rZW4uaXNJbnQgPSBmYWxzZTtcbiAgICAgICAgdG9rZW4uaXNEb3VibGUgPSBmYWxzZTtcbiAgICAgICAgdG9rZW4uaXNPYmplY3QgPSBmYWxzZTtcbiAgICAgICAgdG9rZW4ucHJlY2lzaW9uID0gMTtcbiAgICAgICAgaWYodG9rZW4ucGVyaW9kID09ICcuJyl7XG4gICAgICAgICAgaWYodG9rZW4uX3ByZWNpc2lvbil7XG4gICAgICAgICAgICB0b2tlbi5wcmVjaXNpb24gPSBwYXJzZUludCh0b2tlbi5fcHJlY2lzaW9uKTtcbiAgICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgIHRva2VuLnByZWNpc2lvbiA9IDA7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdmFyIG1peGlucyA9IHRoaXMuX3NwZWNpZmllcnNbdG9rZW4uc3BlY2lmaWVyXTtcbiAgICAgICAgaWYodHlwZW9mIG1peGlucyA9PSAndW5kZWZpbmVkJyl7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCd1bmV4cGVjdGVkIHNwZWNpZmllciBcXCcnICsgdG9rZW4uc3BlY2lmaWVyICsgJ1xcJycpO1xuICAgICAgICB9XG4gICAgICAgIGlmKG1peGlucy5leHRlbmQpe1xuICAgICAgICAgIHZhciBzID0gdGhpcy5fc3BlY2lmaWVyc1ttaXhpbnMuZXh0ZW5kXTtcbiAgICAgICAgICBmb3IodmFyIGsgaW4gcyl7XG4gICAgICAgICAgICBtaXhpbnNba10gPSBzW2tdXG4gICAgICAgICAgfVxuICAgICAgICAgIGRlbGV0ZSBtaXhpbnMuZXh0ZW5kO1xuICAgICAgICB9XG4gICAgICAgIGZvcih2YXIgbCBpbiBtaXhpbnMpe1xuICAgICAgICAgIHRva2VuW2xdID0gbWl4aW5zW2xdO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmKHR5cGVvZiB0b2tlbi5zZXRBcmcgPT0gJ2Z1bmN0aW9uJyl7XG4gICAgICAgIHRva2VuLnNldEFyZyh0b2tlbik7XG4gICAgICB9XG5cbiAgICAgIGlmKHR5cGVvZiB0b2tlbi5zZXRNYXhXaWR0aCA9PSAnZnVuY3Rpb24nKXtcbiAgICAgICAgdG9rZW4uc2V0TWF4V2lkdGgodG9rZW4pO1xuICAgICAgfVxuXG4gICAgICBpZih0b2tlbi5fbWluV2lkdGggPT0gJyonKXtcbiAgICAgICAgaWYodGhpcy5fbWFwcGVkKXtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJyogd2lkdGggbm90IHN1cHBvcnRlZCBpbiBtYXBwZWQgZm9ybWF0cycpO1xuICAgICAgICB9XG4gICAgICAgIHRva2VuLm1pbldpZHRoID0gcGFyc2VJbnQoYXJndW1lbnRzW3Bvc2l0aW9uKytdKTtcbiAgICAgICAgaWYoaXNOYU4odG9rZW4ubWluV2lkdGgpKXtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ3RoZSBhcmd1bWVudCBmb3IgKiB3aWR0aCBhdCBwb3NpdGlvbiAnICsgcG9zaXRpb24gKyAnIGlzIG5vdCBhIG51bWJlciBpbiAnICsgdGhpcy5fZm9ybWF0KTtcbiAgICAgICAgfVxuICAgICAgICAvLyBuZWdhdGl2ZSB3aWR0aCBtZWFucyByaWdodEp1c3RpZnlcbiAgICAgICAgaWYgKHRva2VuLm1pbldpZHRoIDwgMCkge1xuICAgICAgICAgIHRva2VuLnJpZ2h0SnVzdGlmeSA9IHRydWU7XG4gICAgICAgICAgdG9rZW4ubWluV2lkdGggPSAtdG9rZW4ubWluV2lkdGg7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYodG9rZW4uX3ByZWNpc2lvbiA9PSAnKicgJiYgdG9rZW4ucGVyaW9kID09ICcuJyl7XG4gICAgICAgIGlmKHRoaXMuX21hcHBlZCl7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCcqIHByZWNpc2lvbiBub3Qgc3VwcG9ydGVkIGluIG1hcHBlZCBmb3JtYXRzJyk7XG4gICAgICAgIH1cbiAgICAgICAgdG9rZW4ucHJlY2lzaW9uID0gcGFyc2VJbnQoYXJndW1lbnRzW3Bvc2l0aW9uKytdKTtcbiAgICAgICAgaWYoaXNOYU4odG9rZW4ucHJlY2lzaW9uKSl7XG4gICAgICAgICAgdGhyb3cgRXJyb3IoJ3RoZSBhcmd1bWVudCBmb3IgKiBwcmVjaXNpb24gYXQgcG9zaXRpb24gJyArIHBvc2l0aW9uICsgJyBpcyBub3QgYSBudW1iZXIgaW4gJyArIHRoaXMuX2Zvcm1hdCk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gbmVnYXRpdmUgcHJlY2lzaW9uIG1lYW5zIHVuc3BlY2lmaWVkXG4gICAgICAgIGlmICh0b2tlbi5wcmVjaXNpb24gPCAwKSB7XG4gICAgICAgICAgdG9rZW4ucHJlY2lzaW9uID0gMTtcbiAgICAgICAgICB0b2tlbi5wZXJpb2QgPSAnJztcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYodG9rZW4uaXNJbnQpe1xuICAgICAgICAvLyBhIHNwZWNpZmllZCBwcmVjaXNpb24gbWVhbnMgbm8gemVybyBwYWRkaW5nXG4gICAgICAgIGlmKHRva2VuLnBlcmlvZCA9PSAnLicpe1xuICAgICAgICAgIHRva2VuLnplcm9QYWQgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmZvcm1hdEludCh0b2tlbik7XG4gICAgICB9ZWxzZSBpZih0b2tlbi5pc0RvdWJsZSl7XG4gICAgICAgIGlmKHRva2VuLnBlcmlvZCAhPSAnLicpe1xuICAgICAgICAgIHRva2VuLnByZWNpc2lvbiA9IDY7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5mb3JtYXREb3VibGUodG9rZW4pOyBcbiAgICAgIH1lbHNlIGlmKHRva2VuLmlzT2JqZWN0KXtcbiAgICAgICAgdGhpcy5mb3JtYXRPYmplY3QodG9rZW4pO1xuICAgICAgfVxuICAgICAgdGhpcy5maXRGaWVsZCh0b2tlbik7XG5cbiAgICAgIHN0ciArPSAnJyArIHRva2VuLmFyZztcbiAgICB9XG4gIH1cblxuICByZXR1cm4gc3RyO1xufTtcbkZvcm1hdHRlci5wcm90b3R5cGUuX3plcm9zMTAgPSAnMDAwMDAwMDAwMCc7XG5Gb3JtYXR0ZXIucHJvdG90eXBlLl9zcGFjZXMxMCA9ICcgICAgICAgICAgJztcbkZvcm1hdHRlci5wcm90b3R5cGUuZm9ybWF0SW50ID0gZnVuY3Rpb24odG9rZW4pIHtcbiAgdmFyIGkgPSBwYXJzZUludCh0b2tlbi5hcmcpO1xuICBpZighaXNGaW5pdGUoaSkpeyAvLyBpc05hTihmKSB8fCBmID09IE51bWJlci5QT1NJVElWRV9JTkZJTklUWSB8fCBmID09IE51bWJlci5ORUdBVElWRV9JTkZJTklUWSlcbiAgICAvLyBhbGxvdyB0aGlzIG9ubHkgaWYgYXJnIGlzIG51bWJlclxuICAgIGlmKHR5cGVvZiB0b2tlbi5hcmcgIT0gJ251bWJlcicpe1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdmb3JtYXQgYXJndW1lbnQgXFwnJyArIHRva2VuLmFyZyArICdcXCcgbm90IGFuIGludGVnZXI7IHBhcnNlSW50IHJldHVybmVkICcgKyBpKTtcbiAgICB9XG4gICAgLy9yZXR1cm4gJycgKyBpO1xuICAgIGkgPSAwO1xuICB9XG5cbiAgLy8gaWYgbm90IGJhc2UgMTAsIG1ha2UgbmVnYXRpdmVzIGJlIHBvc2l0aXZlXG4gIC8vIG90aGVyd2lzZSwgKC0xMCkudG9TdHJpbmcoMTYpIGlzICctYScgaW5zdGVhZCBvZiAnZmZmZmZmZjYnXG4gIGlmKGkgPCAwICYmICh0b2tlbi5pc1Vuc2lnbmVkIHx8IHRva2VuLmJhc2UgIT0gMTApKXtcbiAgICBpID0gMHhmZmZmZmZmZiArIGkgKyAxO1xuICB9IFxuXG4gIGlmKGkgPCAwKXtcbiAgICB0b2tlbi5hcmcgPSAoLSBpKS50b1N0cmluZyh0b2tlbi5iYXNlKTtcbiAgICB0aGlzLnplcm9QYWQodG9rZW4pO1xuICAgIHRva2VuLmFyZyA9ICctJyArIHRva2VuLmFyZztcbiAgfWVsc2V7XG4gICAgdG9rZW4uYXJnID0gaS50b1N0cmluZyh0b2tlbi5iYXNlKTtcbiAgICAvLyBuZWVkIHRvIG1ha2Ugc3VyZSB0aGF0IGFyZ3VtZW50IDAgd2l0aCBwcmVjaXNpb249PTAgaXMgZm9ybWF0dGVkIGFzICcnXG4gICAgaWYoIWkgJiYgIXRva2VuLnByZWNpc2lvbil7XG4gICAgICB0b2tlbi5hcmcgPSAnJztcbiAgICB9ZWxzZXtcbiAgICAgIHRoaXMuemVyb1BhZCh0b2tlbik7XG4gICAgfVxuICAgIGlmKHRva2VuLnNpZ24pe1xuICAgICAgdG9rZW4uYXJnID0gdG9rZW4uc2lnbiArIHRva2VuLmFyZztcbiAgICB9XG4gIH1cbiAgaWYodG9rZW4uYmFzZSA9PSAxNil7XG4gICAgaWYodG9rZW4uYWx0ZXJuYXRpdmUpe1xuICAgICAgdG9rZW4uYXJnID0gJzB4JyArIHRva2VuLmFyZztcbiAgICB9XG4gICAgdG9rZW4uYXJnID0gdG9rZW4udG9VcHBlciA/IHRva2VuLmFyZy50b1VwcGVyQ2FzZSgpIDogdG9rZW4uYXJnLnRvTG93ZXJDYXNlKCk7XG4gIH1cbiAgaWYodG9rZW4uYmFzZSA9PSA4KXtcbiAgICBpZih0b2tlbi5hbHRlcm5hdGl2ZSAmJiB0b2tlbi5hcmcuY2hhckF0KDApICE9ICcwJyl7XG4gICAgICB0b2tlbi5hcmcgPSAnMCcgKyB0b2tlbi5hcmc7XG4gICAgfVxuICB9XG59O1xuRm9ybWF0dGVyLnByb3RvdHlwZS5mb3JtYXREb3VibGUgPSBmdW5jdGlvbih0b2tlbikge1xuICB2YXIgZiA9IHBhcnNlRmxvYXQodG9rZW4uYXJnKTtcbiAgaWYoIWlzRmluaXRlKGYpKXsgLy8gaXNOYU4oZikgfHwgZiA9PSBOdW1iZXIuUE9TSVRJVkVfSU5GSU5JVFkgfHwgZiA9PSBOdW1iZXIuTkVHQVRJVkVfSU5GSU5JVFkpXG4gICAgLy8gYWxsb3cgdGhpcyBvbmx5IGlmIGFyZyBpcyBudW1iZXJcbiAgICBpZih0eXBlb2YgdG9rZW4uYXJnICE9ICdudW1iZXInKXtcbiAgICAgIHRocm93IG5ldyBFcnJvcignZm9ybWF0IGFyZ3VtZW50IFxcJycgKyB0b2tlbi5hcmcgKyAnXFwnIG5vdCBhIGZsb2F0OyBwYXJzZUZsb2F0IHJldHVybmVkICcgKyBmKTtcbiAgICB9XG4gICAgLy8gQzk5IHNheXMgdGhhdCBmb3IgJ2YnOlxuICAgIC8vICAgaW5maW5pdHkgLT4gJ1stXWluZicgb3IgJ1stXWluZmluaXR5JyAoJ1stXUlORicgb3IgJ1stXUlORklOSVRZJyBmb3IgJ0YnKVxuICAgIC8vICAgTmFOIC0+IGEgc3RyaW5nICBzdGFydGluZyB3aXRoICduYW4nICgnTkFOJyBmb3IgJ0YnKVxuICAgIC8vIHRoaXMgaXMgbm90IGNvbW1vbmx5IGltcGxlbWVudGVkIHRob3VnaC5cbiAgICAvL3JldHVybiAnJyArIGY7XG4gICAgZiA9IDA7XG4gIH1cblxuICBzd2l0Y2godG9rZW4uZG91YmxlTm90YXRpb24pIHtcbiAgICBjYXNlICdlJzoge1xuICAgICAgdG9rZW4uYXJnID0gZi50b0V4cG9uZW50aWFsKHRva2VuLnByZWNpc2lvbik7IFxuICAgICAgYnJlYWs7XG4gICAgfVxuICAgIGNhc2UgJ2YnOiB7XG4gICAgICB0b2tlbi5hcmcgPSBmLnRvRml4ZWQodG9rZW4ucHJlY2lzaW9uKTsgXG4gICAgICBicmVhaztcbiAgICB9XG4gICAgY2FzZSAnZyc6IHtcbiAgICAgIC8vIEMgc2F5cyB1c2UgJ2UnIG5vdGF0aW9uIGlmIGV4cG9uZW50IGlzIDwgLTQgb3IgaXMgPj0gcHJlY1xuICAgICAgLy8gRUNNQVNjcmlwdCBmb3IgdG9QcmVjaXNpb24gc2F5cyB1c2UgZXhwb25lbnRpYWwgbm90YXRpb24gaWYgZXhwb25lbnQgaXMgPj0gcHJlYyxcbiAgICAgIC8vIHRob3VnaCBzdGVwIDE3IG9mIHRvUHJlY2lzaW9uIGluZGljYXRlcyBhIHRlc3QgZm9yIDwgLTYgdG8gZm9yY2UgZXhwb25lbnRpYWwuXG4gICAgICBpZihNYXRoLmFicyhmKSA8IDAuMDAwMSl7XG4gICAgICAgIC8vcHJpbnQoJ2ZvcmNpbmcgZXhwb25lbnRpYWwgbm90YXRpb24gZm9yIGY9JyArIGYpO1xuICAgICAgICB0b2tlbi5hcmcgPSBmLnRvRXhwb25lbnRpYWwodG9rZW4ucHJlY2lzaW9uID4gMCA/IHRva2VuLnByZWNpc2lvbiAtIDEgOiB0b2tlbi5wcmVjaXNpb24pO1xuICAgICAgfWVsc2V7XG4gICAgICAgIHRva2VuLmFyZyA9IGYudG9QcmVjaXNpb24odG9rZW4ucHJlY2lzaW9uKTsgXG4gICAgICB9XG5cbiAgICAgIC8vIEluIEMsIHVubGlrZSAnZicsICdnRycgcmVtb3ZlcyB0cmFpbGluZyAwcyBmcm9tIGZyYWN0aW9uYWwgcGFydCwgdW5sZXNzIGFsdGVybmF0aXZlIGZvcm1hdCBmbGFnICgnIycpLlxuICAgICAgLy8gQnV0IEVDTUFTY3JpcHQgZm9ybWF0cyB0b1ByZWNpc2lvbiBhcyAwLjAwMTAwMDAwLiBTbyByZW1vdmUgdHJhaWxpbmcgMHMuXG4gICAgICBpZighdG9rZW4uYWx0ZXJuYXRpdmUpeyBcbiAgICAgICAgLy9wcmludCgncmVwbGFjaW5nIHRyYWlsaW5nIDAgaW4gXFwnJyArIHMgKyAnXFwnJyk7XG4gICAgICAgIHRva2VuLmFyZyA9IHRva2VuLmFyZy5yZXBsYWNlKC8oXFwuLipbXjBdKTAqZS8sICckMWUnKTtcbiAgICAgICAgLy8gaWYgZnJhY3Rpb25hbCBwYXJ0IGlzIGVudGlyZWx5IDAsIHJlbW92ZSBpdCBhbmQgZGVjaW1hbCBwb2ludFxuICAgICAgICB0b2tlbi5hcmcgPSB0b2tlbi5hcmcucmVwbGFjZSgvXFwuMCplLywgJ2UnKS5yZXBsYWNlKC9cXC4wJC8sJycpO1xuICAgICAgfVxuICAgICAgYnJlYWs7XG4gICAgfVxuICAgIGRlZmF1bHQ6IHRocm93IG5ldyBFcnJvcigndW5leHBlY3RlZCBkb3VibGUgbm90YXRpb24gXFwnJyArIHRva2VuLmRvdWJsZU5vdGF0aW9uICsgJ1xcJycpO1xuICB9XG5cbiAgLy8gQyBzYXlzIHRoYXQgZXhwb25lbnQgbXVzdCBoYXZlIGF0IGxlYXN0IHR3byBkaWdpdHMuXG4gIC8vIEJ1dCBFQ01BU2NyaXB0IGRvZXMgbm90OyB0b0V4cG9uZW50aWFsIHJlc3VsdHMgaW4gdGhpbmdzIGxpa2UgJzEuMDAwMDAwZS04JyBhbmQgJzEuMDAwMDAwZSs4Jy5cbiAgLy8gTm90ZSB0aGF0IHMucmVwbGFjZSgvZShbXFwrXFwtXSkoXFxkKS8sICdlJDEwJDInKSB3b24ndCB3b3JrIGJlY2F1c2Ugb2YgdGhlICckMTAnIGluc3RlYWQgb2YgJyQxJy5cbiAgLy8gQW5kIHJlcGxhY2UocmUsIGZ1bmMpIGlzbid0IHN1cHBvcnRlZCBvbiBJRTUwIG9yIFNhZmFyaTEuXG4gIHRva2VuLmFyZyA9IHRva2VuLmFyZy5yZXBsYWNlKC9lXFwrKFxcZCkkLywgJ2UrMCQxJykucmVwbGFjZSgvZVxcLShcXGQpJC8sICdlLTAkMScpO1xuXG4gIC8vIGlmIGFsdCwgZW5zdXJlIGEgZGVjaW1hbCBwb2ludFxuICBpZih0b2tlbi5hbHRlcm5hdGl2ZSl7XG4gICAgdG9rZW4uYXJnID0gdG9rZW4uYXJnLnJlcGxhY2UoL14oXFxkKykkLywnJDEuJyk7XG4gICAgdG9rZW4uYXJnID0gdG9rZW4uYXJnLnJlcGxhY2UoL14oXFxkKyllLywnJDEuZScpO1xuICB9XG5cbiAgaWYoZiA+PSAwICYmIHRva2VuLnNpZ24pe1xuICAgIHRva2VuLmFyZyA9IHRva2VuLnNpZ24gKyB0b2tlbi5hcmc7XG4gIH1cblxuICB0b2tlbi5hcmcgPSB0b2tlbi50b1VwcGVyID8gdG9rZW4uYXJnLnRvVXBwZXJDYXNlKCkgOiB0b2tlbi5hcmcudG9Mb3dlckNhc2UoKTtcbn07XG5Gb3JtYXR0ZXIucHJvdG90eXBlLmZvcm1hdE9iamVjdCA9IGZ1bmN0aW9uKHRva2VuKSB7XG4gIC8vIElmIG5vIHByZWNpc2lvbiBpcyBzcGVjaWZpZWQsIHRoZW4gcmVzZXQgaXQgdG8gbnVsbCAoaW5maW5pdGUgZGVwdGgpLlxuICB2YXIgcHJlY2lzaW9uID0gKHRva2VuLnBlcmlvZCA9PT0gJy4nKSA/IHRva2VuLnByZWNpc2lvbiA6IG51bGw7XG4gIHRva2VuLmFyZyA9IHV0aWwuaW5zcGVjdCh0b2tlbi5hcmcsICF0b2tlbi5hbHRlcm5hdGl2ZSwgcHJlY2lzaW9uKTtcbn07XG5Gb3JtYXR0ZXIucHJvdG90eXBlLnplcm9QYWQgPSBmdW5jdGlvbih0b2tlbiwgLypJbnQqLyBsZW5ndGgpIHtcbiAgbGVuZ3RoID0gKGFyZ3VtZW50cy5sZW5ndGggPT0gMikgPyBsZW5ndGggOiB0b2tlbi5wcmVjaXNpb247XG4gIHZhciBuZWdhdGl2ZSA9IGZhbHNlO1xuICBpZih0eXBlb2YgdG9rZW4uYXJnICE9IFwic3RyaW5nXCIpe1xuICAgIHRva2VuLmFyZyA9IFwiXCIgKyB0b2tlbi5hcmc7XG4gIH1cbiAgaWYgKHRva2VuLmFyZy5zdWJzdHIoMCwxKSA9PT0gJy0nKSB7XG4gICAgbmVnYXRpdmUgPSB0cnVlO1xuICAgIHRva2VuLmFyZyA9IHRva2VuLmFyZy5zdWJzdHIoMSk7XG4gIH1cblxuICB2YXIgdGVubGVzcyA9IGxlbmd0aCAtIDEwO1xuICB3aGlsZSh0b2tlbi5hcmcubGVuZ3RoIDwgdGVubGVzcyl7XG4gICAgdG9rZW4uYXJnID0gKHRva2VuLnJpZ2h0SnVzdGlmeSkgPyB0b2tlbi5hcmcgKyB0aGlzLl96ZXJvczEwIDogdGhpcy5femVyb3MxMCArIHRva2VuLmFyZztcbiAgfVxuICB2YXIgcGFkID0gbGVuZ3RoIC0gdG9rZW4uYXJnLmxlbmd0aDtcbiAgdG9rZW4uYXJnID0gKHRva2VuLnJpZ2h0SnVzdGlmeSkgPyB0b2tlbi5hcmcgKyB0aGlzLl96ZXJvczEwLnN1YnN0cmluZygwLCBwYWQpIDogdGhpcy5femVyb3MxMC5zdWJzdHJpbmcoMCwgcGFkKSArIHRva2VuLmFyZztcbiAgaWYgKG5lZ2F0aXZlKSB0b2tlbi5hcmcgPSAnLScgKyB0b2tlbi5hcmc7XG59O1xuRm9ybWF0dGVyLnByb3RvdHlwZS5maXRGaWVsZCA9IGZ1bmN0aW9uKHRva2VuKSB7XG4gIGlmKHRva2VuLm1heFdpZHRoID49IDAgJiYgdG9rZW4uYXJnLmxlbmd0aCA+IHRva2VuLm1heFdpZHRoKXtcbiAgICByZXR1cm4gdG9rZW4uYXJnLnN1YnN0cmluZygwLCB0b2tlbi5tYXhXaWR0aCk7XG4gIH1cbiAgaWYodG9rZW4uemVyb1BhZCl7XG4gICAgdGhpcy56ZXJvUGFkKHRva2VuLCB0b2tlbi5taW5XaWR0aCk7XG4gICAgcmV0dXJuO1xuICB9XG4gIHRoaXMuc3BhY2VQYWQodG9rZW4pO1xufTtcbkZvcm1hdHRlci5wcm90b3R5cGUuc3BhY2VQYWQgPSBmdW5jdGlvbih0b2tlbiwgLypJbnQqLyBsZW5ndGgpIHtcbiAgbGVuZ3RoID0gKGFyZ3VtZW50cy5sZW5ndGggPT0gMikgPyBsZW5ndGggOiB0b2tlbi5taW5XaWR0aDtcbiAgaWYodHlwZW9mIHRva2VuLmFyZyAhPSAnc3RyaW5nJyl7XG4gICAgdG9rZW4uYXJnID0gJycgKyB0b2tlbi5hcmc7XG4gIH1cbiAgdmFyIHRlbmxlc3MgPSBsZW5ndGggLSAxMDtcbiAgd2hpbGUodG9rZW4uYXJnLmxlbmd0aCA8IHRlbmxlc3Mpe1xuICAgIHRva2VuLmFyZyA9ICh0b2tlbi5yaWdodEp1c3RpZnkpID8gdG9rZW4uYXJnICsgdGhpcy5fc3BhY2VzMTAgOiB0aGlzLl9zcGFjZXMxMCArIHRva2VuLmFyZztcbiAgfVxuICB2YXIgcGFkID0gbGVuZ3RoIC0gdG9rZW4uYXJnLmxlbmd0aDtcbiAgdG9rZW4uYXJnID0gKHRva2VuLnJpZ2h0SnVzdGlmeSkgPyB0b2tlbi5hcmcgKyB0aGlzLl9zcGFjZXMxMC5zdWJzdHJpbmcoMCwgcGFkKSA6IHRoaXMuX3NwYWNlczEwLnN1YnN0cmluZygwLCBwYWQpICsgdG9rZW4uYXJnO1xufTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCl7XG4gIHZhciBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzKSxcbiAgICBzdHJlYW0sIGZvcm1hdDtcbiAgaWYoYXJnc1swXSBpbnN0YW5jZW9mIHJlcXVpcmUoJ3N0cmVhbScpLlN0cmVhbSl7XG4gICAgc3RyZWFtID0gYXJncy5zaGlmdCgpO1xuICB9XG4gIGZvcm1hdCA9IGFyZ3Muc2hpZnQoKTtcbiAgdmFyIGZvcm1hdHRlciA9IG5ldyBGb3JtYXR0ZXIoZm9ybWF0KTtcbiAgdmFyIHN0cmluZyA9IGZvcm1hdHRlci5mb3JtYXQuYXBwbHkoZm9ybWF0dGVyLCBhcmdzKTtcbiAgaWYoc3RyZWFtKXtcbiAgICBzdHJlYW0ud3JpdGUoc3RyaW5nKTtcbiAgfWVsc2V7XG4gICAgcmV0dXJuIHN0cmluZztcbiAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMuRm9ybWF0dGVyID0gRm9ybWF0dGVyO1xuXG4iLCIvKipcbiAqIENvcHlyaWdodCAyMDEzLTIwMTUsIEZhY2Vib29rLCBJbmMuXG4gKiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICpcbiAqIFRoaXMgc291cmNlIGNvZGUgaXMgbGljZW5zZWQgdW5kZXIgdGhlIEJTRC1zdHlsZSBsaWNlbnNlIGZvdW5kIGluIHRoZVxuICogTElDRU5TRSBmaWxlIGluIHRoZSByb290IGRpcmVjdG9yeSBvZiB0aGlzIHNvdXJjZSB0cmVlLiBBbiBhZGRpdGlvbmFsIGdyYW50XG4gKiBvZiBwYXRlbnQgcmlnaHRzIGNhbiBiZSBmb3VuZCBpbiB0aGUgUEFURU5UUyBmaWxlIGluIHRoZSBzYW1lIGRpcmVjdG9yeS5cbiAqXG4gKiBAcHJvdmlkZXNNb2R1bGUgaW52YXJpYW50XG4gKi9cblxuXCJ1c2Ugc3RyaWN0XCI7XG5cbi8qKlxuICogVXNlIGludmFyaWFudCgpIHRvIGFzc2VydCBzdGF0ZSB3aGljaCB5b3VyIHByb2dyYW0gYXNzdW1lcyB0byBiZSB0cnVlLlxuICpcbiAqIFByb3ZpZGUgc3ByaW50Zi1zdHlsZSBmb3JtYXQgKG9ubHkgJXMgaXMgc3VwcG9ydGVkKSBhbmQgYXJndW1lbnRzXG4gKiB0byBwcm92aWRlIGluZm9ybWF0aW9uIGFib3V0IHdoYXQgYnJva2UgYW5kIHdoYXQgeW91IHdlcmVcbiAqIGV4cGVjdGluZy5cbiAqXG4gKiBUaGUgaW52YXJpYW50IG1lc3NhZ2Ugd2lsbCBiZSBzdHJpcHBlZCBpbiBwcm9kdWN0aW9uLCBidXQgdGhlIGludmFyaWFudFxuICogd2lsbCByZW1haW4gdG8gZW5zdXJlIGxvZ2ljIGRvZXMgbm90IGRpZmZlciBpbiBwcm9kdWN0aW9uLlxuICovXG5cbnZhciBpbnZhcmlhbnQgPSBmdW5jdGlvbihjb25kaXRpb24sIGZvcm1hdCwgYSwgYiwgYywgZCwgZSwgZikge1xuICBpZiAoXCJwcm9kdWN0aW9uXCIgIT09IHByb2Nlc3MuZW52Lk5PREVfRU5WKSB7XG4gICAgaWYgKGZvcm1hdCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ2ludmFyaWFudCByZXF1aXJlcyBhbiBlcnJvciBtZXNzYWdlIGFyZ3VtZW50Jyk7XG4gICAgfVxuICB9XG5cbiAgaWYgKCFjb25kaXRpb24pIHtcbiAgICB2YXIgZXJyb3I7XG4gICAgaWYgKGZvcm1hdCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBlcnJvciA9IG5ldyBFcnJvcihcbiAgICAgICAgJ01pbmlmaWVkIGV4Y2VwdGlvbiBvY2N1cnJlZDsgdXNlIHRoZSBub24tbWluaWZpZWQgZGV2IGVudmlyb25tZW50ICcgK1xuICAgICAgICAnZm9yIHRoZSBmdWxsIGVycm9yIG1lc3NhZ2UgYW5kIGFkZGl0aW9uYWwgaGVscGZ1bCB3YXJuaW5ncy4nXG4gICAgICApO1xuICAgIH0gZWxzZSB7XG4gICAgICB2YXIgYXJncyA9IFthLCBiLCBjLCBkLCBlLCBmXTtcbiAgICAgIHZhciBhcmdJbmRleCA9IDA7XG4gICAgICBlcnJvciA9IG5ldyBFcnJvcihcbiAgICAgICAgJ0ludmFyaWFudCBWaW9sYXRpb246ICcgK1xuICAgICAgICBmb3JtYXQucmVwbGFjZSgvJXMvZywgZnVuY3Rpb24oKSB7IHJldHVybiBhcmdzW2FyZ0luZGV4KytdOyB9KVxuICAgICAgKTtcbiAgICB9XG5cbiAgICBlcnJvci5mcmFtZXNUb1BvcCA9IDE7IC8vIHdlIGRvbid0IGNhcmUgYWJvdXQgaW52YXJpYW50J3Mgb3duIGZyYW1lXG4gICAgdGhyb3cgZXJyb3I7XG4gIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gaW52YXJpYW50O1xuIiwiLyoqXG4gKiBDb3B5cmlnaHQgMjAxMy0yMDE1LCBGYWNlYm9vaywgSW5jLlxuICogQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqXG4gKiBUaGlzIHNvdXJjZSBjb2RlIGlzIGxpY2Vuc2VkIHVuZGVyIHRoZSBCU0Qtc3R5bGUgbGljZW5zZSBmb3VuZCBpbiB0aGVcbiAqIExJQ0VOU0UgZmlsZSBpbiB0aGUgcm9vdCBkaXJlY3Rvcnkgb2YgdGhpcyBzb3VyY2UgdHJlZS4gQW4gYWRkaXRpb25hbCBncmFudFxuICogb2YgcGF0ZW50IHJpZ2h0cyBjYW4gYmUgZm91bmQgaW4gdGhlIFBBVEVOVFMgZmlsZSBpbiB0aGUgc2FtZSBkaXJlY3RvcnkuXG4gKlxuICogQHByb3ZpZGVzTW9kdWxlIGtleU1pcnJvclxuICogQHR5cGVjaGVja3Mgc3RhdGljLW9ubHlcbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBpbnZhcmlhbnQgPSByZXF1aXJlKFwiLi9pbnZhcmlhbnRcIik7XG5cbi8qKlxuICogQ29uc3RydWN0cyBhbiBlbnVtZXJhdGlvbiB3aXRoIGtleXMgZXF1YWwgdG8gdGhlaXIgdmFsdWUuXG4gKlxuICogRm9yIGV4YW1wbGU6XG4gKlxuICogICB2YXIgQ09MT1JTID0ga2V5TWlycm9yKHtibHVlOiBudWxsLCByZWQ6IG51bGx9KTtcbiAqICAgdmFyIG15Q29sb3IgPSBDT0xPUlMuYmx1ZTtcbiAqICAgdmFyIGlzQ29sb3JWYWxpZCA9ICEhQ09MT1JTW215Q29sb3JdO1xuICpcbiAqIFRoZSBsYXN0IGxpbmUgY291bGQgbm90IGJlIHBlcmZvcm1lZCBpZiB0aGUgdmFsdWVzIG9mIHRoZSBnZW5lcmF0ZWQgZW51bSB3ZXJlXG4gKiBub3QgZXF1YWwgdG8gdGhlaXIga2V5cy5cbiAqXG4gKiAgIElucHV0OiAge2tleTE6IHZhbDEsIGtleTI6IHZhbDJ9XG4gKiAgIE91dHB1dDoge2tleTE6IGtleTEsIGtleTI6IGtleTJ9XG4gKlxuICogQHBhcmFtIHtvYmplY3R9IG9ialxuICogQHJldHVybiB7b2JqZWN0fVxuICovXG52YXIga2V5TWlycm9yID0gZnVuY3Rpb24ob2JqKSB7XG4gIHZhciByZXQgPSB7fTtcbiAgdmFyIGtleTtcbiAgKFwicHJvZHVjdGlvblwiICE9PSBwcm9jZXNzLmVudi5OT0RFX0VOViA/IGludmFyaWFudChcbiAgICBvYmogaW5zdGFuY2VvZiBPYmplY3QgJiYgIUFycmF5LmlzQXJyYXkob2JqKSxcbiAgICAna2V5TWlycm9yKC4uLik6IEFyZ3VtZW50IG11c3QgYmUgYW4gb2JqZWN0LidcbiAgKSA6IGludmFyaWFudChvYmogaW5zdGFuY2VvZiBPYmplY3QgJiYgIUFycmF5LmlzQXJyYXkob2JqKSkpO1xuICBmb3IgKGtleSBpbiBvYmopIHtcbiAgICBpZiAoIW9iai5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG4gICAgcmV0W2tleV0gPSBrZXk7XG4gIH1cbiAgcmV0dXJuIHJldDtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0ga2V5TWlycm9yO1xuIiwiY29uc3Qga2V5TWlycm9yID0gcmVxdWlyZSgncmVhY3QvbGliL2tleU1pcnJvcicpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGtleU1pcnJvcih7XG4gICAgTUlTU0lPTl9TVEFSVEVEIDogbnVsbCxcbiAgICBNSVNTSU9OX1NUT1BQRUQgOiBudWxsLFxuICAgIE1JU1NJT05fUkVTRVQgOiBudWxsLFxuICAgIE1JU1NJT05fQ09NUExFVEVEIDogbnVsbCxcbiAgICBBUFBfU1RBVEUgOiBudWxsLFxuXG4gICAgQUREX01FU1NBR0UgOiBudWxsLFxuXG4gICAgLy9BQ1RJT05TXG4gICAgR0VUX0VWRU5UUyA6IG51bGwsXG4gICAgU0VUX0VWRU5UUyA6IG51bGwsXG4gICAgVFJJR0dFUl9FVkVOVCA6IG51bGwsXG4gICAgQURWQU5DRV9DSEFQVEVSIDogbnVsbCxcbiAgICBDT01QTEVURV9NSVNTSU9OIDogbnVsbCxcblxuICAgIC8vIFNDSUVOQ0UgVEVBTSBFVkVOVFNcbiAgICBTQ0lFTkNFX0NIRUNLX1JBRElBVElPTiA6IG51bGwsXG5cbiAgICAvLyBBU1RST05BVVQgVEVBTSBFVkVOVFNcbiAgICBBU1RfQ0hFQ0tfVklUQUxTIDogbnVsbCxcblxuICAgIC8vIENPTU1VTklDQVRJT04gVEVBTSBFVkVOVFNcbiAgICBDT01NX0lORk9STV9BU1RST05BVVQgOiBudWxsLFxuICAgIENPTU1fQ0hFQ0tfU0FUX0xJTks6IG51bGwsXG5cblxuICAgIC8vIFNFQ1VSSVRZIFRFQU0gRVZFTlRTXG4gICAgU0VUX0hJR0hfQzAyIDogbnVsbCxcbiAgICBTRUNVUklUWV9DSEVDS19EQVRBX1RSQU5TRkVSIDogbnVsbFxufSk7XG4iXX0=
