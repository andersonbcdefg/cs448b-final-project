import { sleep } from "./lib.js";

const fetchData = async (path) => {
	const parseTime = d3.timeParse("%Y")
	const raw_data = await d3.csv(path)
	for (let key of Object.keys(raw_data)) {
		if (key == "columns") continue;
		raw_data[key]["year"] = parseTime(raw_data[key]["year"])
	}
	const data = [];
	for (let col of raw_data.columns) {
		if (col == "year") continue;
		let obj = {"group":col, "values":[]};
		for (let row of raw_data) {
			obj["values"].push({"year": row["year"], "value": row[col], "group":col})
		}
		data.push(obj);

	}
	console.log(data)
	return [raw_data, data];
}

// Draw outer SVG container and inner plot container
// RETURNS: D3 selection for container
const makeContainer = (params) => {
	const container = d3.select(params.selector)
		.append("svg")
		.attr("width", params.width + 2 * params.marginX)
		.attr("height", params.height + 2 * params.marginY)
		.attr("id", "container")
	
	return container;
}

// Make X and Y scales.
// RETURNS: X scale and Y scale.
const makeScales = (raw_data, params) => {
	const xScale = d3.scaleTime()
		.domain(d3.extent(raw_data, d => d.year))
		.range([params.marginX, params.width + params.marginX])

	const yScale = d3.scaleLinear()
		.domain([0, 35])
		.range([params.height + params.marginY, params.marginY])

	return [xScale, yScale];
}

// Add X and Y axes to the plot; along with title and labels.
const addAxes = (container, xScale, yScale, params) => {
	container.append("g")
		.attr("transform", `translate(${params.marginX}, 0)`)
		.call(d3.axisLeft(yScale))

	container.append("g")
		.attr("transform", `translate(0, ${params.height + params.marginY})`)
		.call(d3.axisBottom(xScale))

	// mike bostock
	container.append("g")
    	.attr("stroke", "grey")
    	.attr("stroke-opacity", 0.4)
    	.call(g => g.append("g")
      				.selectAll("line")
      				.data(xScale.ticks())
      				.join("line")
        			.attr("x1", d => 0.5 + xScale(d))
        			.attr("x2", d => 0.5 + xScale(d))
        			.attr("y1", params.marginY)
        			.attr("y2", params.marginY + params.height))
    	.call(g => g.append("g")
      				.selectAll("line")
      				.data(yScale.ticks())
      				.join("line")
        			.attr("y1", d => yScale(d))
        			.attr("y2", d => yScale(d))
       				.attr("x1", params.marginX)
        			.attr("x2", params.width + params.marginX));
	
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
		.text(params.ylab)

	let yLabLen = yLabel.node().getComputedTextLength()

	yLabel.attr("transform", `rotate(-90, 0, 0)`)
		.attr("x", - params.marginY - params.height / 2 - yLabLen / 2)
		.attr("y", params.marginX / 1.2)
		
	let titleText = container.append("text")
		.attr("font-size", "1.2em")
		.attr("font-weight", "bold")
		.text(params.title)

	let titleLen = titleText.node().getComputedTextLength();

	titleText.attr("x", params.marginX + params.width / 2 - titleLen / 2)
		.attr("y", params.marginY/2)
}

const makeLines = async (container, xScale, yScale, colorScale, data, params) => {
	const lineGenerator = d3.line()
		.x(d => xScale(d.year))
		.y(d => yScale(d.value))

	

	const series = container.append("g")
		.selectAll(".series")
		.data(data, d => d.group)
		.enter()
		.append("g")
		.attr("class", "series")

	series.append("path")
		.attr("class", "line")
      	.attr("d", d => lineGenerator(d.values))
      	.attr("fill", "none")
        .attr("stroke", d => colorScale(d.group))
        .attr("stroke-width", 2)

    let labels = ["All", "White", "Non-Hispanic White", "Black", 
        	"Native American", "Asian", "Pacific Islander", "Hispanic (Any Race)"]
    
    let circles = series.selectAll("circle")
    	.data(function(d) { return d.values; })
    	.enter()
    	.append("circle")
		.attr("cx", d => xScale(d.year))
		.attr("cy", d => yScale(d.value))
		.attr("r", 3)
		.attr("fill", d => colorScale(d.group))
		
	circles.on("click", function(e, d) {
			if (d3.select(this).attr("opacity") && d3.select(this).attr("opacity") < 1) return;
			d3.select("#tooltip").remove()
			let [x, y] = d3.pointer(e);
			let idx = circles.nodes().indexOf(this);
			console.log("INDEX", idx)
			let g = container.append("g")
				.attr("id", "tooltip").on("click", () => d3.select("#tooltip").remove())
				.attr("transform", `translate(${x}, ${y})`)
			g.append("rect").attr("width", 120).attr("height", 55)
                .attr("fill", "WhiteSmoke").attr("stroke", "black")
                .attr("stroke-width", 2).attr("opacity", 0.9).attr("rx", 10)
            g.append("text")
                .attr("class", "tooltip-text")
                .style("font-weight", "bold")
                .text(d.year.getFullYear())
                .attr("x", 10).attr("y", 15)
            g.append("text")
            	.attr("class", "tooltip-text")
                .text(labels[Math.floor(idx / 12)])
                .attr("x", 10).attr("y", 30)    
            g.append("text")
                .attr("class", "tooltip-text")
                .text(Math.floor(d.value) + "% Uninsured").attr("x", 10)
                .attr("y", 45)
		})
}

const addLegend = (container, colorScale) => {
    let colorLegend = d3.legendColor()
        .labels(["All", "White", "Non-Hispanic White", "Black", 
        	"Native American", "Asian", "Pacific Islander", "Hispanic (Any Race)"])
        .scale(colorScale)
        .shapeHeight(15)
        .shapePadding(2)
        .classPrefix("legend")

    container.append("g").call(colorLegend)
        .attr("transform", "translate(20,20)");

    return colorLegend;
}

const addControls = (data, colorScale, params) => {
	let spans = d3.select(params.selector)
		.append("div").attr("id", "checkbox-container")
		.selectAll("span")
		.data(data)
		.enter()
		.append("span")
		.attr("class", "checkbox-span")
	
	spans.append("input")
		.attr("type", "checkbox")
		.attr("id", d => d.group + "-checkbox")
		.attr("checked", true)
		.on("click", function (e, d) {
			let checked = d3.select(this).node().checked;
			let checked_line = d3.selectAll(".series")
				.filter(g => g.group == d.group)
			if (checked) {
				checked_line.select("path")
					.attr("stroke", g => colorScale(g.group))
					.attr("opacity", 1)
					.raise()
				checked_line.selectAll("circle")
					.attr("fill", g => colorScale(g.group))
					.attr("opacity", 1)
					.raise()
			} else {
				checked_line.select("path")
					.attr("stroke", "grey")
					.attr("opacity", 0.15)
					.lower()
				checked_line.selectAll("circle")
					.attr("fill", "grey")
					.attr("opacity", 0.15)
					.lower()
			}
		})
	
	let labels = ["All", "White", "Non-Hispanic White", "Black", 
        	"Native American", "Asian", "Pacific Islander", "Hispanic (Any Race)"]
	spans.append("label").text((d, i) => labels[i])
}

const main = async(params) => {
	let container = makeContainer(params);
	let [raw_data, data] = await fetchData(params.file_path);
	let [xScale, yScale] = makeScales(raw_data, params);
	const colorScale = d3.scaleOrdinal(d3.schemeCategory10)
        .domain(data.map(d => d.group));
	addAxes(container, xScale, yScale, params)
	makeLines(container, xScale, yScale, colorScale, data, params)
		addLegend(container, colorScale)
	addControls(data, colorScale, params);
}

export { main };