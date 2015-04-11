/* A singleton store that can be queried for remaining time */

const AppDispatcher = require('../appdispatcher');
const BaseStore = require('./base-store');
const constants = require('../constants');
const randomInt = require('../utils').randomInt;
const radiationRange = {
    min: 20,
    max: 40
};
var samples = [];
var totalRadiation = 0;
var lastCalculatedAverage = null;

const RadiationStore = Object.assign(new BaseStore(), {

    _setRadiationLevel(min, max) {
        radiationRange.min = min;
        radiationRange.max = max;
        this.emitChange();
    },

    _clearSamples() {
        samples = [];
        this.emitChange();
    },

    _takeSample() {
        samples.push(this.getLevel());
        this.emitChange();
    },

    getLevel() {
        return randomInt(radiationRange.min, radiationRange.max);
    },

    getTotalLevel() {
        return totalRadiation;
    },

    getSamples() {
        return samples.slice();
    },

    getState() {
        return {
            samples: samples.slice(0),
            total: totalRadiation,
            currentLevel: this.getLevel(),
            lastCalculatedAverage: lastCalculatedAverage
        }
    },

    dispatcherIndex: AppDispatcher.register(function (payload) {
        var { action, data} = payload;

        switch (action) {
            case constants.SCIENCE_RADIATION_LEVEL_CHANGED:
                RadiationStore._setRadiationLevel(data.min, data.max);
                break;
            case constants.SCIENCE_TOTAL_RADIATION_LEVEL_CHANGED:
                totalRadiation = data.total;
                RadiationStore.emitChange();
                break;

            case constants.SCIENCE_TAKE_RADIATION_SAMPLE:
                RadiationStore._takeSample();
                break;
            case constants.SCIENCE_AVG_RADIATION_CALCULATED:
                lastCalculatedAverage = data.average;
                RadiationStore.emitChange();

        }

        return true; // No errors. Needed by promise in Dispatcher.
    })

});

window.__RadiationStore = RadiationStore;
module.exports = RadiationStore;
