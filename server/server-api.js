const missionTime= require('./mission-time');
const chapters = require('./chapters');
const socketEvents = require('./EventConstants');

var missionStarted = false;

var teamState = {};

//var missionLength = 0;
//var originalMissionLength = 0;
//var missionTime = 0;
//var missionTimeLastUpdated = 0;
//var oxygenRemaining = 100;
//var co2Level = 0;
//var scrubFilterChanged = false;
//var ranges = {
//    respiration: [0, 0],
//    oxygenUse: [0, 0],
//    heartRate: [0, 0],
//    radiation: [0, 0],
//    satelite1: [0, 0],
//    satelite2: [0, 0],
//    satelite3: [0, 0]
//};


module.exports = function init(io) {
    io.sockets.on('connection', function (socket) {
        var socketId = socket.id;
        var clientIp = socket.request.connection.remoteAddress;

        console.log('A new client connected  on ', socketId, 'from', clientIp);

        //Initiates an RTC call with another client
        socket.on("call", function (from, to) {
            socket.broadcast.emit("call", from, to);
        });

        //Sends an RTC signal from one client to another
        socket.on("signal", function (signal, from, to) {
            socket.broadcast.emit("signal", signal, from, to);
        });

        //Instructs all clients displaying the astronaut video feed to change the video url
        socket.on("change video", function (videoUrl) {
            socket.broadcast.emit("change video", videoUrl);
        });

        socket.on("get ranges", function () {
            socket.emit("ranges", ranges);
        });

        socket.on("get levels", function () {
            socket.emit("levels", levels);
        });

        socket.on("get mission time", function () {
            socket.emit("mission time", missionTime.usedTimeInMillis() / 1000);
        });

        socket.on("get oxygen remaining", function () {
            socket.emit("oxygen remaining", oxygenRemaining);
        });

        socket.on("set oxygen remaining", function (oxygen) {
            oxygenRemaining = oxygen;
        });

        socket.on("get co2 level", function () {
            socket.emit("co2 level", co2Level);
        });

        socket.on("set co2 level", function (co2) {
            co2Level = co2;
        });

        socket.on("is scrub filter changed", function () {
            socket.emit("scrub filter changed", scrubFilterChanged);
        });

        socket.on("set scrub filter changed", function () {
            scrubFilterChanged = true;
        });

        //Event fired by the mission commander when the astronaut has finished repairing the satelite
        socket.on("job finished", function () {
            socket.broadcast.emit("job finished");
        });

        socket.on("start mission", startMission);

        socket.on("stop mission", stopMission);

        socket.on("reset mission", resetMission);

        socket.on('get app state', function () {
            socket.emit('app state', appState());
        });

        socket.on('set team state', function (state) {
            console.log('team state', state)
            teamState[state.team] = state;

            // broadcast the change to all other clients
            socket.broadcast.emit('app state', appState());
        });
    });

    function startMission() {
        //oxygenRemaining = 100;
        //co2Level = 0;
        //scrubFilterChanged = false;
        if (missionStarted) return;

        missionStarted = true;
        missionTime.start();

        io.emit(socketEvents.MISSION_STARTED);
    }

    function stopMission() {
        if (!missionStarted) return;

        missionStarted = false;
        missionTime.stop();

        io.emit(socketEvents.MISSION_STOPPED);
    }

    /**
     * Reset everything to initial values to make for a fresh start
     */
    function resetMission() {
        stopMission();

        missionTime.reset();
        chapters.reset();
        teamState = {};

        // set up all the events
        require('./mission-script').run();
        chapters.setBroadcaster((eventName, value) => io.emit(eventName, value));

        io.emit(socketEvents.MISSION_RESET);
    }

    function appState() {
        var state= {
            mission_running: missionStarted,
            elapsed_mission_time: missionTime.usedTimeInMillis() / 1000,
            science: teamState['science'],
            communication: teamState['communication'],
            security: teamState['security'],
            astronaut: teamState['astronaut'],
            mc: {}
        };

        return state;
    }

    // Clean start
    resetMission();
};


