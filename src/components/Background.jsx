import React from 'react';
import '../styles/background.css';

function randomBetween (min, max) {
	return min + Math.random() * (max - min);
}

const animation = ['spin', 'pulse'];

function pickAnimation() {
	return animation[Math.floor(Math.random() * 2)];
}

function pickColor() {
	return Math.ceil(Math.random() * 5);
}

const CELL_SIZE = 100;

class Background extends React.Component {
	constructor() {
		super();
		const items = [];
		const cellsPerRow = Math.ceil((window.innerWidth - 380) / CELL_SIZE);
		const rows = Math.ceil(window.innerHeight / CELL_SIZE);
		console.log(cellsPerRow, rows);
		for (let i = 0; i < cellsPerRow * rows; i++) {
			items.push({
				opacity: randomBetween(0.25, .6),
				size: randomBetween(50, 200),
				borderRadiusPct: randomBetween(25, 50),
				red: randomBetween(0, 50),
				blue: randomBetween(120, 220),
				green: randomBetween(120, 220),
				duration: randomBetween(8000, 15000),
				reverse: Math.random() > 0.5 ? true : false,
				animationName: pickAnimation(),
				color: pickColor()
			});
		}
		this.state = { items, cellsPerRow };
	}
	render() {
		const { cellsPerRow, items } = this.state;
		return (
			<div className={'background palette-' + this.props.palette}>
				{items.map((item, i) => {
					const centerX = i % cellsPerRow * CELL_SIZE + CELL_SIZE / 2;
					const centerY = Math.floor(i / cellsPerRow) * CELL_SIZE + CELL_SIZE / 2;
					console.log('row', Math.floor(i / cellsPerRow));
					const style = {
						opacity: item.opacity,
						width: item.size,
						height: item.size,
						borderRadius: item.borderRadiusPct + '%',
						position: 'absolute',
						top: (centerY - item.size / 2) + 'px',
						left: (centerX - item.size / 2) + 'px',
						animationDuration: item.duration + 'ms',
						animationDirection: item.reverse ? 'reverse' : 'normal'
					};
					// style.backgroundColor = `rgb(${item.red}, ${item.green}, ${item.blue})`;
					return (
						<div
							key={"item-" + i}
							style={style}
							className={"item " + item.animationName + " color-" + item.color}
						/>
					);
				})}
			</div>
		);
	}
}

export default Background;