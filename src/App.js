/*global platformClient*/

import React, { Component } from 'react';
import Loading from "./Loading";
import _ from 'lodash';
import moment from 'moment';
import StatusTimer from "./StatusTimer";
import Fab from "@material-ui/core/Fab";
import RefreshIcon from "@material-ui/icons/Refresh";
import CircularProgress from '@material-ui/core/CircularProgress';
import {withStyles} from '@material-ui/core/styles';
import { blue} from '@material-ui/core/colors';
import ReactInterval from "react-interval";

const styles = theme => ({
    root: {
        padding: theme.spacing(2),
    },
    refresh: {
        position: 'fixed',
        top: theme.spacing(2),
        right: theme.spacing(2)
    },
    fabProgressWrapper: {
        margin: theme.spacing(1),
        position: 'relative',
    },
    fabProgress: {
        color: blue[500],
        position: 'absolute',
        top: -6,
        left: -6,
        zIndex: 1,
    },
});

const clientId = process.env.REACT_APP_PURECLOUD_CLIENT_ID;
let client,notificationsApi,presenceApi,usersApi,webSocket,notificationChannel;

class App extends Component {
    constructor(props) {
        super(props);
        this.state = {
            isLoading: true,
            presences: [],
            userPresenceTopic: '',
            presenceTime: null,
            currentPresence: null,
            expires: null,
            lastHeartbeat: moment()
        };
    }

    componentDidMount() {
        this.load();
    }

    load() {
        const redirectUri = window.location.href;

        client = platformClient.ApiClient.instance;
        notificationsApi = new platformClient.NotificationsApi();
        presenceApi = new platformClient.PresenceApi();
        usersApi = new platformClient.UsersApi();

        // Set PureCloud settings
        client.setEnvironment('mypurecloud.com');
        client.setPersistSettings(true, 'pc_status_timer');

        // Local vars
        let presences = {};
        let currentPresence = '';
        let userPresenceTopic = '';
        let me, presenceTime;

        client.loginImplicitGrant(clientId, redirectUri)
        .then(() => {
            console.log('Logged in');

            // Get presences
            return presenceApi.getPresencedefinitions({ pageSize: 100 });
        })
        .then((presenceListing) => {
            console.log(`Found ${presenceListing.entities.length} presences`);
            presences = presenceListing.entities;

            // Get authenticated user's data, including current presence
            return usersApi.getUsersMe({ expand: ['presence'] });
        })
        .then((userMe) => {
            me = userMe;
            currentPresence = this.getPresenceById(presences,me.presence.presenceDefinition.id);
            presenceTime = me.presence.modifiedDate;
            userPresenceTopic = `v2.users.${me.id}.presence`;
            this.setState({userPresenceTopic,currentPresence,presences,presenceTime}, () => this.subscribeToNotifications(userPresenceTopic))
        })
        .catch((err) => console.error(err));
    }

    subscribeToNotifications(topic) {
        let expires;
        notificationsApi.postNotificationsChannels()
        .then((channel) => {
            console.log('channel: ', channel);
            notificationChannel = channel;
            expires = channel.expires;
            // Set up web socket
            webSocket = new WebSocket(notificationChannel.connectUri);
            webSocket.onmessage = (m) => this.handleNotification(m);
            // webSocket.onopen = () => {
            //     webSocket.send("{\"message\":\"ping\"}");
            // };

            // Subscribe to authenticated user's presence
            const body = [ { id: topic } ];
            return notificationsApi.putNotificationsChannelSubscriptions(notificationChannel.id, body);
        })
        .then((channel) => {
            console.log('Channel subscriptions set successfully');
            this.setState({isLoading: false, expires})
        })
            .catch((err) => console.error(err));
    }

    getPresenceById(presences,id){
        const presence = _.find(presences, { 'id': id });
        if((presence||null) !== null){
            return presence.languageLabels.en_US;
        }

        return '';
    }

    handleNotification(message) {
        // Parse notification string to a JSON object
        const notification = JSON.parse(message.data);
        const userPresenceTopic = this.state.userPresenceTopic || '';
        const presences = this.state.presences;

        // Discard unwanted notifications
        if (notification.topicName.toLowerCase() === 'channel.metadata') {
            // Heartbeat
            console.info('Heartbeat metadata or pong: ', notification);
            this.setState({lastHeartbeat: moment()})
        } else if (notification.topicName.toLowerCase() === userPresenceTopic.toLowerCase()) {
            // Set current presence text in UI
            console.debug('Presence notification: ', notification);
            const currentPresence = this.getPresenceById(presences, notification.eventBody.presenceDefinition.id);
            this.setState({currentPresence, presenceTime: notification.eventBody.modifiedDate})
        } else {
            // Unexpected topic
            console.warn('Unknown notification: ', notification);
        }
    }

    ping(){
        console.log('sending ping...');
        webSocket.send("{\"message\":\"ping\"}");
    }

    reload() {
        const userPresenceTopic = this.state.userPresenceTopic || null;

        if((notificationChannel||null) !== null && userPresenceTopic !== null){
            this.setState({isLoading: true}, () => {
                notificationsApi.deleteNotificationsChannelSubscriptions(notificationChannel.id)
                    .then(() => {
                        console.log('deleteNotificationsChannelSubscriptions returned successfully.');
                        this.setState({isLoading: false},() => this.subscribeToNotifications(userPresenceTopic));
                    })
                    .catch((err) => {
                        console.log('There was a failure calling deleteNotificationsChannelSubscriptions');
                        console.error(err);
                        this.setState({isLoading: false});
                    });
            })
        }
    }

    healthCheck() {
        const {expires,lastHeartbeat} = this.state;
        const now = moment();
        const exp = moment(expires);
        const minutes  = exp.diff(now, 'minutes');
        if(minutes < 5){
            this.reload();
        } else {
            const seconds = now.diff(lastHeartbeat, 'seconds');
            if(seconds > 30){
                this.ping();
            }
        }
    }

    render() {
        const {classes} = this.props;

        const {
            isLoading,
            presenceTime,
            currentPresence
        } = this.state;

        return (
            <div className={classes.root}>
                {isLoading ? (
                    <Loading/>
                ) : (
                    <StatusTimer presenceTime={presenceTime} currentPresence={currentPresence}/>
                )}
                <div className={classes.refresh}>
                    <div className={classes.fabProgressWrapper}>
                        <Fab
                            aria-label="reload"
                            onClick={() => this.reload()}
                            disabled={isLoading}
                        >
                            <RefreshIcon/>
                        </Fab>
                        {isLoading && <CircularProgress size={68} className={classes.fabProgress} />}
                    </div>
                    <ReactInterval timeout={60000} enabled={true} callback={() => this.healthCheck()} />
                </div>
            </div>
        );
    }
}

export default withStyles(styles)(App);