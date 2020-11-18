'use strict';
import * as lib from "./lib.js"

const main = async (params) => {
	let [outerContainer, plotContainer] = lib.makeContainer(params);
	
	/* let [xScale, yScale] = lib.makeScales(raw_cable, params);
	lib.addAxes(plotContainer, xScale, yScale, params);
	lib.makeLines(plotContainer, xScale, yScale, grouped_cable, params);*/
}

const params = {
	marginX: 125,
	marginY: 75,
	width: 600,
	height: 250
};

main(params)