import React, { Component } from 'react';
import moment from 'moment';
import ReactInterval from 'react-interval';
import {withStyles} from '@material-ui/core/styles';

const styles = theme => ({
    statusWrapper: {
        paddingTop: 250,
        textAlign: 'center'
    },
    status: {
        fontSize: 40,
        fontWeight: 600,
        color: '#555555',
    },
    time: {
        fontSize: 35,
        color: '#000'
    },
    onqueue: {
        color: '#21c0f6'
    },
    available: {
        color: '#77dd22'
    },
    busy: {
        color: 'red'
    },
    meeting: {
        color: 'red'
    },
    away: {
        color: '#ffbb33'
    },
    break: {
        color: '#ffbb33'
    },
    meal: {
        color: '#ffbb33'
    },
    training: {
        color: '#ffbb33'
    },
});

class StatusTimer extends Component {
    constructor(props) {
        super(props);
        this.state = {
            formattedTime: '',
        };
    }

    updateTimer(){
        const presenceTime = this.props.presenceTime || null;
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
        const {classes,currentPresence} = this.props;

        const {
            formattedTime,
        } = this.state;

        return (
            <div className={classes.statusWrapper}>
                <ReactInterval timeout={1000} enabled={true} callback={() => this.updateTimer()} />
                <div className={classes.status}>
                    <div className={classes[currentPresence.replace(' ','').toLowerCase()]}>{currentPresence}</div>
                    <div className={classes.time}>{formattedTime}</div>
                </div>
            </div>
        );
    }
}

export default withStyles(styles)(StatusTimer);