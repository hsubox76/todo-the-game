import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckSquare, faSquare } from '@fortawesome/free-solid-svg-icons';

class ListItem extends React.Component {
  handleCheckClick = (e) => {
    if (this.props.item.isDone) {
      return;
    }
    this.props.onDone(this.props.item.id);
  }
  render() {
    const props = this.props;
    const classes = ['list-item'];
    if (props.item.isDone) {
      classes.push('item-done');
    }
    if (props.item.fadeIn) {
      classes.push('fade-in');
    }
    return (
      <div className={classes.join(' ')}>
        <div className="checkbox-container">
          <input
            id={'item-' + this.props.item.id}
            type="checkbox"
            className="regular-checkbox"
            checked={props.item.isDone}
            onChange={this.handleCheckClick}
          />
          <label htmlFor={'item-' + this.props.item.id}>
            <FontAwesomeIcon icon={props.item.isDone ? faCheckSquare : faSquare} size="lg" />
          </label>
        </div>
        <div className="description">{props.item.description}</div>
      </div>
    );
  }
}

export default ListItem;
