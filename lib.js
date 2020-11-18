/* FILE: lib.js
 * AUTHOR: Benjamin Anderson
 * DESCRIPTION: Helper code for the TimeSearcher application.
 */

'use strict';

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



export { makeContainer };