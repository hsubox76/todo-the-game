const React = require('react');
const Clock = require('./Clock');
const Title = require('./Title');
const ListBox = require('./ListBox');

const initialList = [
  'abc',
  'def'
];

class Main extends React.Component {
  constructor() {
    super();
    this.state = {
      list: initialList,
      time: '12:34'
    };
  }
  
  render() {
    return (
      <div className="main-container">
          <Clock time={this.state.time} />
          <Title />
          <ListBox list={this.state.list} />
      </div>
    );
  }
}

module.exports = Main;