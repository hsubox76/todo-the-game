import React from 'react';
import Main from './Main';
import Admin from './admin/Admin';
import Background from './Background';

class App extends React.Component {
	constructor() {
		super();
		this.state = {
			palette: 1
		};
	}
	setPalette = (num) => {
		this.setState({ palette: num });
	}
	render() {
		const props = this.props;
		if (props.admin) {
			return <Admin {...props} />;
		}
		return (
			<div className="app-container">
				<Background palette={this.state.palette} />
				<Main {...props} setPalette={this.setPalette} palette={this.state.palette} />
			</div>
		);
	}
}

export default App;