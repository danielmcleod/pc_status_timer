import React, { Component } from 'react';
import './App.css';
import Loading from "./Loading";
import _ from 'lodash';
import moment from 'moment';
import ReactInterval from 'react-interval';

const platformClient = window.platformClient;

class App extends Component {
    constructor(props) {
        super(props);
        this.state = {
            isLoading: true,
            presences: [],
            userPresenceTopic: '',
            presenceTime: null,
            currentPresence: null,
            formattedTime: ''
        };
    }

    componentDidMount() {
        this.load();
    }

    load() {
        const clientId = process.env.PURECLOUD_APP_CLIENT_ID;
        const redirectUri = window.location.href;

        // const platformClient = require('platformClient');

        const client = platformClient.ApiClient.instance;
        const notificationsApi = new platformClient.NotificationsApi();
        const presenceApi = new platformClient.PresenceApi();
        const usersApi = new platformClient.UsersApi();

        // Set PureCloud settings
        client.setEnvironment('mypurecloud.com');
        client.setPersistSettings(true, 'pc_status');

        // Local vars
        let presences = {};
        let currentPresence = '';
        let userPresenceTopic = '';
        let me, notificationChannel, presenceTime;
        let webSocket = null;

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

            // Create notification channel
            return notificationsApi.postNotificationsChannels();
        })
        .then((channel) => {
            console.log('channel: ', channel);
            notificationChannel = channel;

            // Set up web socket
            webSocket = new WebSocket(notificationChannel.connectUri);
            webSocket.onmessage = (m) => this.handleNotification(m);

            // Subscribe to authenticated user's presence
            userPresenceTopic = `v2.users.${me.id}.presence`;
            const body = [ { id: userPresenceTopic } ];
            return notificationsApi.putNotificationsChannelSubscriptions(notificationChannel.id, body);
        })
        .then((channel) => {
            console.log('Channel subscriptions set successfully');
            this.setState({userPresenceTopic,currentPresence,presences,presenceTime,isLoading: false})
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

    // setPresence(presenceId) {
    //     console.log(`Setting presence to ${this.getPresenceById(presenceId)} (${presenceId})`);
    //
    //     // Set presence
    //     presenceApi.patchUserPresence(me.id, 'PURECLOUD', { presenceDefinition:{ id: presenceId } })
    //         .then(() => {
    //             console.log('Presence set successfully');
    //         })
    //         .catch((err) => console.error(err));
    // }

    // Handle incoming PureCloud notification from WebSocket
    handleNotification(message) {
        // Parse notification string to a JSON object
        const notification = JSON.parse(message.data);
        const userPresenceTopic = this.state.userPresenceTopic || '';
        const presences = this.state.presences;

        // Discard unwanted notifications
        if (notification.topicName.toLowerCase() === 'channel.metadata') {
            // Heartbeat
            console.info('Ignoring metadata: ', notification);
            return;
        } else if (notification.topicName.toLowerCase() !== userPresenceTopic.toLowerCase()) {
            // Unexpected topic
            console.warn('Unknown notification: ', notification);
            return;
        } else {
            console.debug('Presence notification: ', notification);
        }

        // Set current presence text in UI
        const currentPresence = this.getPresenceById(presences, notification.eventBody.presenceDefinition.id);

        this.setState({currentPresence, presenceTime: notification.eventBody.modifiedDate})
    }

    updateTimer(){
        const presenceTime = this.state.presenceTime || null;
        if(presenceTime !== null){
            const a = moment();
            const b = moment(presenceTime);
            const seconds  = a.diff(b, 'seconds');
            let d = ('0' + Math.floor(seconds / (3600*24))).slice(-2);
            let h = ('0' + Math.floor(seconds % (3600*24) / 3600)).slice(-2);
            let m = ('0' + Math.floor(seconds % 3600 / 60)).slice(-2);
            let s = ('0' + Math.floor(seconds % 60)).slice(-2);

            const formattedTime = `${d}:${h}:${m}:${s}`;
            this.setState({formattedTime});
        }
    }

    render() {
        const {
            isLoading,
            formattedTime,
            currentPresence
        } = this.state;

        return (
            <div>
                {isLoading ? (
                    <Loading/>
                ) : (
                    <div className="status-wrapper">
                        <ReactInterval timeout={1000} enabled={true} callback={() => this.updateTimer()} />
                        <div className="status">
                            <div className={currentPresence.replace(' ','').toLowerCase()}>{currentPresence}</div>
                            <div className="time">{formattedTime}</div>
                        </div>
                    </div>
                )}
            </div>
        );
    }
}

export default App;
