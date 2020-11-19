'use strict';
import * as lib from "./lib.js"

const main = async (params) => {
	let container = lib.makeContainer(params);
	let data = await lib.fetchData("data/spending-pct-gdp.csv");
	let [xScale, yScale] = lib.makeScales(data, params);
	lib.addAxes(container, xScale, yScale, "Spending", "Spending Over Time", params)
	lib.makeLine(container, xScale, yScale, data, params)
	
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