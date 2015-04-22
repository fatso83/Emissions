const React = require('react');
const OxygenStore = require('../stores/oxygen-store');
const { parseNumber } = require('../utils');
const { randomInt } = require('../utils');

// lazy load due to avoid circular dependencies
function lazyRequire(path) {
    let tmp = null;
    return ()=> {
        if (!tmp) tmp = require(path);
        return tmp;
    }
}
const getMissionAC = lazyRequire('../actions/MissionActionCreators');
// for browserify to work it needs to find these magic strings
require('../actions/MissionActionCreators');

var lowThreshold = 30, mediumThreshold = 70;

var satellites = [
    {name: 'Satelitt 1', freq: {min: 2.8, max: 3.4}, reception: 90, color: 'green'},
    {name: 'Satelitt 2', freq: {min: 2.1, max: 2.5}, reception: 30, color: 'red'},
    {name: 'Satelitt 3', freq: {min: 3.6, max: 4.0}, reception: 60, color: 'orange'}
];

function color(reception) {
    if (reception > mediumThreshold) {
        return 'green';
    }
    if (reception > lowThreshold) {
        return 'orange';
    }
    return 'red';
}

var i=0;
function newValues(){
    satellites[(i+0)%3].reception = randomInt(25,65);
    satellites[(i+1)%3].reception = randomInt(45,85);
    satellites[(i+2)%3].reception = randomInt(25,65);
    i++;

    chart.validateData();
}

setInterval(newValues, 1000*60*4);

var chart;
function initGraph(domElement) {
    chart = new AmCharts.AmSerialChart();

    chart.dataProvider = satellites;
    chart.categoryField = "name";

    //X axis
    var categoryAxis = chart.categoryAxis;
    categoryAxis.gridPosition = "start";

    //Y axis
    var valueAxis = new AmCharts.ValueAxis();
    valueAxis.axisAlpha = 0;
    valueAxis.minimum = 0;
    valueAxis.maximum = 100;
    valueAxis.title = "Mottak";
    valueAxis.position = "left";
    chart.addValueAxis(valueAxis);

    //Line
    var graph = new AmCharts.AmGraph();
    graph.valueField = "reception";
    graph.colorField = "color";
    graph.lineAlpha = 0.2;
    graph.fillAlphas = 0.8;
    graph.type = "column";
    graph.showBalloon = false;
    chart.addGraph(graph);

    chart.write(domElement);

    return chart;
}

const SatelliteReceptionChart = React.createClass({

    propTypes: {},

    componentDidMount(){
        var el = React.findDOMNode(this);
        initGraph(el);
    },

    render(){
        return <div className={this.props.className} style={this.props.style}/>
    }

});

const SatelliteTable = React.createClass({

    propTypes: {
        satellites: React.PropTypes.array.isRequired
    },


    render(){

        return (
            <div {...this.props} >

                <table className={"table table-bordered table-striped "}>
                    <thead>
                    <tr>
                        <th>Satelitt</th>
                        <th>Frekvensområde</th>
                    </tr>
                    </thead>

                    <tbody>
                    {
                        this.props.satellites.map((sat, i) =>
                            <tr key={i}>
                                <td>{sat.name}</td>
                                <td>{sat.freq.min} - {sat.freq.max}</td>
                            </tr>)
                    }
                    </tbody>
                </table>
            </div>
        );

    }

});

module.exports = React.createClass({

    statics: {},

    propTypes: {},

    mixins: [],

    getInitialState() {
        return {
            chosenSatellite: satellites[0]
        };
    },
    componentWillMount() {
    },

    componentWillUnmount() {
    },

    _getState(){
        return {};
    },

    render() {

        return (
            <div>

                <div className='row'>
                    <SatelliteTable satellites={satellites} className='col-sm-6'/>

                    <SatelliteReceptionChart style={{ height : '250px'}} className='col-sm-6'/>
                </div>

                <div className="row">
                    <h3>Velg satelitt og tilhørende frekvensområde</h3>
                    <select>
                        { satellites.map((sat) =>  <option key={sat.name} value={sat.name}>{sat.name}</option>) }
                    </select>

                    <h4>Velg frekvens:</h4>
                    <input type='number' />
                </div>

            </div> );

    }

});

