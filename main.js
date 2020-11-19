'use strict';
import * as lib from "./lib.js"

const main = async (files, params) => {
	if (files.length == 0) {
		d3.select("body").append("h1").text("All done!");
		return;
	}
	let [container, button] = lib.makeContainer(params);
	let data = await lib.fetchData(`data/${files[0].path}`);
	let [xScale, yScale] = lib.makeScales(data, params);
	lib.addAxes(container, xScale, yScale, files[0].ylab, files[0].title, params)
	lib.makeLine(container, xScale, yScale, data, params)
	button.on("click", async () => {
		d3.select("button").remove()
		d3.select("svg").remove()
		main(files.slice(1), params)
	})
}

const params = {
	marginX: 125,
	marginY: 75,
	width: 600,
	height: 250
};

const files = [
	{"path":"spending-pct-gdp.csv", "title":"Healthcare Spending Over Time", "ylab":"Total Expenditures (% GDP)"},
	{"path":"family-premiums.csv", "title":"Premiums Over Time", "ylab":"Average Family Premium ($)"},
	{"path":"single-worker-contribution.csv", "title":"Worker Contributions Over Time",
			"ylab":"Average Single Worker Contribution ($)"}
] 
main(files, params)