import React, { PureComponent } from 'react';

class Loading extends PureComponent {
    render() {
        return (
            <div className="loading">
                <div className="loading-circle">
                    <div className="loader"></div>
                </div>
            </div>
        );
    }
}

export default Loading;