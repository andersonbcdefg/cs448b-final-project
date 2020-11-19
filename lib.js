/* FILE: lib.js
 * AUTHOR: Benjamin Anderson
 * DESCRIPTION: Helper code for the TimeSearcher application.
 */

'use strict';

// Fetch and parse dataset with given path
const sleep = async (ms) => {
	return new Promise(resolve => setTimeout(resolve, ms));
}

const fetchData = async (path) => {
	const parseTime = d3.timeParse("%Y")
	const res = await d3.csv(path)
	const data = res.map(entry => {
		return {
			year: parseTime(entry.YEAR),
			response_var: entry[Object.keys(entry)[1]]
		}
	});
	return data;
}

// Draw outer SVG container and inner plot container
// RETURNS: D3 selections for outer & inner containers.
const makeContainer = (params) => {
	const container = d3.select("body")
		.append("svg")
		.attr("width", params.width + 2 * params.marginX)
		.attr("height", params.height + 2 * params.marginY)
		.attr("id", "container")

	let strokes = [];
	let paths = [];
	let currentPath = null;

	var lineFunction = d3.line()
		.x(function(d) { return d.x; })
		.y(function(d) { return d.y; })
		.curve(d3.curveBasis);

	container.call(d3.drag()
    	.subject((e) => { 
    		let m = d3.pointer(e);
    		return {x: m[0], y: m[1] }; 
    	})
    	.on("start", (e) => {
    		strokes.push([])
    	})
    	.on("drag", (e) => {
    		let stroke = strokes[strokes.length - 1];
    		let point = {"x": e.x, "y": e.y};
    		stroke.push(point);
    		if (currentPath) currentPath.remove();
    		currentPath = container.append("path")
    			.attr("d", lineFunction(stroke))
				.attr("stroke", "blue")
				.attr("stroke-width", 2)
				.attr("fill", "none");
    	})
    	.on("end", (e) => {
    		let stroke = strokes[strokes.length - 1];
    		paths.push(currentPath);
    		currentPath = null;
    		
    	})
    )

	return container;
}

// Make X and Y scales.
// RETURNS: X scale and Y scale.
const makeScales = (data, params, includeZero=false) => {
	const xScale = d3.scaleTime()
		.domain(d3.extent(data, d => d.year))
		.range([params.marginX, params.width + params.marginX])
	if (includeZero) {
		const yScale = d3.scaleLinear()
			.domain([0, d3.max(data, d => d.response_var)])
			.range([params.height + params.marginY, params.marginY])

		return [xScale, yScale];
	}
	const yScale = d3.scaleLinear()
		.domain(d3.extent(data, d => d.response_var))
		.range([params.height + params.marginY, params.marginY])

	return [xScale, yScale];
}

// Add X and Y axes to the plot; along with title and labels.
const addAxes = (container, xScale, yScale, yVarName, title, params) => {
	container.append("g")
		.attr("transform", `translate(${params.marginX}, 0)`)
		.call(d3.axisLeft(yScale))

	container.append("g")
		.attr("transform", `translate(0, ${params.height + params.marginY})`)
		.call(d3.axisBottom(xScale))
	
	container.append("text")
		.attr("y", params.height + 50)
		.attr("x", params.width / 2 - 40)
		.attr("font-size", "0.8em")
		.attr("font-weight", "light")
		.text("Year")

	container.append("text")
		.attr("transform", "rotate(-90, 40, 10)")
		.attr("y", -100)
		.attr("x", -params.height / 2)
		.attr("font-size", "0.8em")
		.attr("font-weight", "light")
		.text(yVarName)

	container.append("text")
		.attr("x", 200)
		.attr("y", -35)
		.attr("font-size", "1.2em")
		.attr("font-weight", "bold")
		.text(title)
}

const makeLines = async (container, xScale, yScale, data, params) => {
	const lineGenerator = d3.line()
		.x(d => xScale(d.year))
		.y(d => yScale(d.response_var))
		.curve(d3.curveBasis)

	/*
	const lines = container.append("g")
		.attr("id", "series-group")
		.selectAll(".series")
		.data(data, d => d.name)
		.enter()
		.append("g")
		.attr("class", "series")
	*/
	let zeros = Array(data.length).fill({"year": data[0].year, "response_var": data[0].response_var})
	let p = container.append("path")
		.attr("fill", "none")
        .attr("stroke", "firebrick")
        .attr("stroke-width", 1.5)
      	.attr("d", d => lineGenerator(zeros))


    for (let i = 1; i < data.length; i++) {
    	await sleep(500);
    	let dataChunk = [...zeros.slice(0, data.length - i), ...data.slice(0, i)]
    	console.log(dataChunk);
    	p.transition()
    		.attr("d", d => lineGenerator(dataChunk))
      		.duration(500);
    }

      	
    /*
    lines.append("text")
    	.attr("class", "line-label")
    	.text(d => capitalize(d.name))
    	.attr("y", d => yScale(d.values[d.values.length - 1].screen_time))
    	.attr("x", params.width + 5)
    	.attr("font-size", 12)
    	.on("mouseover", function(e) {highlightLabel(e, this, xScale, yScale, params)})
    	.on("mouseout", function(e) {unhighlightLabel(e, this, xScale, yScale, params)})*/
}



export { fetchData, makeContainer, makeScales, addAxes, makeLines };