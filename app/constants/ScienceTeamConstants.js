module.exports = Object.freeze({
    // ids
    SCIENCE_TIMER_1: 'SCIENCE_TIMER_1',

    SCIENCE_CLEAR_RADIATION_SAMPLES:'SCIENCE_CLEAR_RADIATION_SAMPLES',

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
