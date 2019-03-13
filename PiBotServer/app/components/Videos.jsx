import React from 'react';
import {connect} from 'react-redux';

class Videos extends React.Component {
  constructor(props) {
    super(props);
  }
  render() {
    const {videos} = this.props;
    const renderVideos = () => {
      if (videos.length > 0) {
        return videos.map((video) => {
          const url = 'videos/' + video;
          const name = video.split('.')[0];
          return (
            <div className="video__div" key={name}>
              <div>{name}</div>
              <video width="90%" height="90%" controls>
                <source src={url} type="video/mp4" />
              </video>
              <hr />
            </div>
          );
        });
      } else {
        return <div>No video available</div>;
      }
    };
    return <div>{renderVideos()}</div>;
  }
}

export default connect(
    (state) => {
      return state;
    })(Videos);
