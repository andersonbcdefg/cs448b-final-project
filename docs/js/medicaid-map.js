import { sleep } from "./lib.js";

// basic chloropleth from https://bl.ocks.org/wboykinm/dbbe50d1023f90d4e241712395c27fb3
const getStatesData = async (data_path, json_path) => {
    const data_raw = await d3.csv(data_path);
    let data = {}
    for (let idx in data_raw) {
        if (idx == "columns") continue;
        let series = data_raw[idx]
        let state = series.State;
        let status = series["Expansion Status"]
        data[state] = status
    }
    console.log(data)

    const states_json = await d3.json(json_path)
    // Loop through each state in the JSON
    for (let i = 0; i < states_json.features.length; i++) {
        let state = states_json.features[i].properties.name;
        if (state in data) states_json.features[i].properties[status] = data[state];
    }
    return states_json
}

const mapSetup = (params) => {
    let container = d3.select(params.selector)
        .append("svg")
        .attr("id", "container")
        .attr("width", params.width)
        .attr("height", params.height);

    var projection = d3.geoAlbersUsa()
        .translate([params.width / 2 + 100, params.height / 2]) // translate to center of screen
        .scale([params.scale]);

    var pathGenerator = d3.geoPath() // path generator that will convert GeoJSON to SVG paths
        .projection(projection);

    return [container, pathGenerator];
}

// https://d3-legend.susielu.com/#color-examples
// https://d3-legend.susielu.com/#color-threshold
const addLegend = (container, colorScale) => {
    let colorLegend = d3.legendColor()
        .labelFormat(d3.format(".0f"))
        .labels(({ i, genLength, generatedLabels }) => generatedLabels[i].replace(" but", ",").replace(" and", ","))
        .scale(colorScale)
        .shapeHeight(15)
        .classPrefix("legend")
        .cells(3);

    container.append("g").call(colorLegend)
        .attr("transform", "translate(50,20)");

    return colorLegend;
}

const drawMap = (container, states_json, pathGenerator, params) => {
    const map = container.selectAll("path")
        .data(states_json.features)
        .join("path")
        .attr("d", pathGenerator)
        .attr("class", "state")
        .style("stroke-width", "1")
        .style("stroke", "WhiteSmoke")
        .style("fill", (d) => colorScale(d.properties[status]))
        .on("mouseover", function (e, d) {
            // Highlight state on hover
            d3.select(this).transition().duration(100).style("opacity", "0.7")
            
            // Add tooltip in bottom right
            let g = d3.select("#container").append("g").attr("id", "tooltip")
                .attr("transform", `translate(${25}, ${params.height - 75})`)
            g.append("rect").attr("width", 200).attr("height", 50)
                .attr("fill", "WhiteSmoke").attr("stroke", "black").attr("stroke-width", 2)
            g.append("text")
                .attr("class", "tooltip-text")
                .style("font-weight", "bold")
                .text(d.properties.name)
                .attr("x", 10).attr("y", 20)
            g.append("text")
                .attr("class", "tooltip-text")
                .text(d.properties[status]).attr("x", 10)
                .attr("y", 40)
        }).on("mouseout", function (e) {
            d3.select(this).transition().duration(100).style("opacity", "1")
            d3.select("#tooltip").remove()
        })
}
    

const main = async (params) => {
    const states_json = await getStatesData("/data/medicaid-expansion.csv", "/data/us-states.json")
    window.colorScale = d3.scaleOrdinal(d3.schemeCategory10)
        .domain(["Not Adopted", "Adopted but Not Implemented", "Adopted and Implemented"]);
    const [container, pathGenerator] = mapSetup(params);
    const legend = addLegend(container, colorScale);
    drawMap(container, states_json, pathGenerator, params);
}

export { main };