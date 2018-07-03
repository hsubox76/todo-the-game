import React from 'react';

class ListItem extends React.Component {
  handleCheckClick = () => {
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
            type="checkbox"
            className="regular-checkbox"
            checked={props.item.isDone}
            onChange={this.handleCheckClick}
          />
        </div>
        <div className="description">{props.item.description}</div>
      </div>
    );
  }
}

export default ListItem;
