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
    return (
      <div className={classes.join(' ')}>
        <div>
          <input
            type="checkbox"
            className="regular-checkbox"
            checked={props.item.isDone}
            onClick={this.handleCheckClick}
          />
        </div>
        <div>{props.item.description}</div>
      </div>
    );
  }
}

export default ListItem;
