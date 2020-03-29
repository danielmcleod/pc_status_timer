import React, { PureComponent } from 'react';
import CircularProgress from '@material-ui/core/CircularProgress';
import {withStyles} from '@material-ui/core/styles';
import {blue} from "@material-ui/core/colors";

const styles = theme => ({
    loading: {
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        height: '100%',
        width: '100%',
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 999999999,
    },
    loadingCircle: {
        margin: 'auto',
        height: 125,
        width: 125,
        backgroundColor: 'rgba(255, 255, 255, 0.75)',
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        borderRadius: '50%',
        boxShadow: '0px 3px 5px -1px rgba(0,0,0,0.2), 0px 6px 10px 0px rgba(0,0,0,0.14), 0px 1px 18px 0px rgba(0,0,0,0.12)'
    },
    loader: {
        color: blue[500],
        position: 'absolute',
        top: 0,
        bottom: 0,
        margin: 'auto',
        left: 0,
        right: 0,
        zIndex: 1,
    },
});

class Loading extends PureComponent {
    render() {
        const {classes} = this.props;
        return (
            <div className={classes.loading}>
                <div className={classes.loadingCircle}>
                    <CircularProgress size={80} className={classes.loader}/>
                </div>
            </div>
        );
    }
}

export default withStyles(styles)(Loading);