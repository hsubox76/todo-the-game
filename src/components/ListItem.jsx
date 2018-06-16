import React from 'react';
import { STATUS } from '../constants';

class ListItem extends React.Component {
  handleCheckClick = () => {
    if (this.props.item.status === STATUS.DONE) {
      return;
    }
    this.props.onStatusChange(this.props.item.id, STATUS.DONE);
  }
  render() {
    const props = this.props;
    const classes = ['list-item'];
    if (props.item.status === STATUS.DONE) {
      classes.push('item-done');
    }
    return (
      <div className={classes.join(' ')}>
        <div>
          <input
            type="checkbox"
            className="regular-checkbox"
            checked={props.item.status === STATUS.DONE}
            onClick={this.handleCheckClick}
          />
        </div>
        <div>{props.item.description}</div>
      </div>
    );
  }
}

export default ListItem;
