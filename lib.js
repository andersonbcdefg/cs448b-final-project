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
			response_var: Number(entry[Object.keys(entry)[1]])
		}
	});
	console.log(data);
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

	const button = d3.select("body")
		.append("button")
		.style("visibility", "hidden")
		.text("Next")
	
	return [container, button];
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
	
	let xLabel = container.append("text")
		.attr("font-size", "0.8em")
		.attr("font-weight", "light")
		.text("Year")

	let xLabLen = xLabel.node().getComputedTextLength()

	xLabel.attr("x", params.marginX + params.width / 2 - xLabLen / 2)
		.attr("y", params.marginY + params.height + params.marginY / 1.5)

	let yLabel = container.append("text")
		.attr("font-size", "0.8em")
		.attr("font-weight", "light")
		.text(yVarName)

	let yLabLen = yLabel.node().getComputedTextLength()

	yLabel.attr("transform", `rotate(-90, 0, 0)`)
		.attr("x", - params.marginY - params.height / 2 - yLabLen / 2)
		.attr("y", params.marginX / 2)
		
	let titleText = container.append("text")
		.attr("font-size", "1.2em")
		.attr("font-weight", "bold")
		.text(title)

	let titleLen = titleText.node().getComputedTextLength();

	titleText.attr("x", params.marginX + params.width / 2 - titleLen / 2)
		.attr("y", params.marginY/2)
}

const makeLine = async (container, xScale, yScale, data, params) => {
	const lineGenerator = d3.line()
		.x(d => xScale(d.year))
		.y(d => yScale(d.response_var))
		.curve(d3.curveBasis)

	let zeros = Array(data.length).fill({"year": data[0].year, "response_var": data[0].response_var})
	let p = container.append("path")
		.attr("fill", "none")
        .attr("stroke", "firebrick")
        .attr("stroke-width", 1.5)
      	.attr("d", d => lineGenerator(zeros))

    let i;
    for (i = 1; data[i].year.getFullYear() <= 2010; i++) {
    	await sleep(35);
    	let dataChunk = [...zeros.slice(0, data.length - i - 1), ...data.slice(0, i + 1)]
    	p.attr("d", d => lineGenerator(dataChunk))
    }

    let {year, response_var} = data.filter(x => x.year.getFullYear() == 2010)[0]
    let circ = container.append("circle")
    	.attr("cx", d => xScale(year))
    	.attr("cy", d => yScale(response_var))
    	.attr("stroke", "black")
    	.attr("fill", "white")
    	.attr("r", 5)

    let stroke = [];
	let path = container.append("path")
		.attr("stroke", "blue")
		.attr("stroke-width", 2)
		.style("stroke-dasharray", ("4, 2"))
		.attr("fill", "none");

	var lineFunction = d3.line()
		.x(function(d) { return d.x; })
		.y(function(d) { return d.y; })
		.curve(d3.curveBasis);
    
    circ.call(d3.drag()
    	.subject((e) => { 
    		let m = d3.pointer(e);
    		return {x: m[0], y: m[1] }; 
    	})
    	.on("drag", (e) => {
    		let point = {"x": e.x, "y": e.y};
    		stroke.push(point);
    		path.attr("d", lineFunction(stroke))
    		circ.raise()		
    	})
    	.on("end", async (e) => {
    		circ.call(d3.drag().on("drag", null).on("end", null));
    		await sleep(500);
    		for (let j = i; j < data.length; j++) {
		    	await sleep(35);
		    	let dataChunk = [...zeros.slice(0, data.length - j - 1), ...data.slice(0, j + 1)]
		    	p.attr("d", d => lineGenerator(dataChunk))
		    	d3.select("button").style("visibility", null)
		    }
    	})
    )
}



export { fetchData, makeContainer, makeScales, addAxes, makeLine };