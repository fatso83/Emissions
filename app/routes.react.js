const React = require('react');
const Router = require('react-router');
const Route = Router.Route;
const NotFoundRoute = Router.NotFoundRoute;
const DefaultRoute = Router.DefaultRoute;

const App = require('./components/app.react');
const MissionCommanderApp = require('./components/mission-commander.react.js');
const IndexApp = require('./components/index-app.react');
const NotFound = require('./components/not-found.react');
const IntroScreen = require('./components/introduction-screen.react');
const SolarStorm = require('./components/full-screen-video.js');
const Task = require('./components/task.react');
const DummyRenderMixin = require('./components/dummy-render.mixin');
const { cleanRootPath } = require('./utils');
const teamNameMap = require('./team-name-map');

const RedirectToIntro = React.createClass({

    statics: {
        willTransitionTo(transition) {
            var teamId = cleanRootPath(transition.path);

            if(teamId in teamNameMap.nameMap) {
                transition.redirect(transition.path + '/intro');
            }
        }
    },

    //mixins : [DummyRenderMixin]
    render(){
        return <NotFound />;
    }
});

const routes = (
    <Route name="app" path="/" handler={App}>

        <Route name="job-completed" path='/completed' handler={SolarStorm} />

        <Route name="commander" handler={MissionCommanderApp}/>
        <Route name="team-root" path='/:teamId' handler={RedirectToIntro} />
        <Route name="team-intro" path='/:teamId/intro' handler={IntroScreen} />
        <Route name="team-task" path='/:teamId/task/:taskId' handler={Task} />

        <NotFoundRoute handler={NotFound}/>
        <DefaultRoute handler={IndexApp}/>
    </Route>
);

module.exports = routes;
