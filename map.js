import { sleep } from "./lib.js";

// geojson from http://bl.ocks.org/michellechandra/0b2ce4923dc9b5809922
// basic chloropleth from https://bl.ocks.org/wboykinm/dbbe50d1023f90d4e241712395c27fb3
const getStatesData = async (data_path, json_path) => {
    const data_raw = await d3.csv(data_path);
    let data = {}
    for (let idx in data_raw) {
        if (idx == "columns") continue;
        let series = data_raw[idx]
        let state = series.state;
        delete series.state
        data[state] = series
    }

    const states_json = await d3.json(json_path)
    // Loop through each state in the JSON
    for (let i = 0; i < states_json.features.length; i++) {
        let state = states_json.features[i].properties.name;
        for (let yr = 2008; yr < 2020; yr++) {
            if (state in data) states_json.features[i].properties[yr] = data[state][yr];
        }
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
        .translate([params.width / 2, params.height / 2]) // translate to center of screen
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
        .labels(({ i, genLength, generatedLabels }) => generatedLabels[i] + "%")
        .scale(colorScale)
        .cells(6);

    container.append("g").call(colorLegend)
        .attr("transform", "translate(50,10)");

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

    const yearLabel = container.append("text")
        .text("2008")
        .attr("id", "year-label")
        .attr("x", 50)
        .attr("y", params.height - 50)
        .attr("font-size", 30)
        .attr("stroke", "Silver")
}

const updateMap = (year, params) => {
    d3.selectAll(".state")
        .style("fill", (d) => colorScale(d.properties[year]))
        .on("mouseover", function (e, d) {
            // Highlight state on hover
            d3.select(this).transition().duration(100).style("opacity", "0.7")
            
            // Add tooltip in bottom right
            let g = d3.select("#container").append("g").attr("id", "tooltip")
                .attr("transform", `translate(${params.width - 175}, ${params.height - 75})`)
            g.append("rect").attr("width", 150).attr("height", 50)
                .attr("fill", "WhiteSmoke").attr("stroke", "black").attr("stroke-width", 2)
            g.append("text")
                .style("font-weight", "bold")
                .text(d.properties.name + ` (${year})`)
                .attr("x", 10).attr("y", 20)
            g.append("text").text(Math.floor(d.properties[year]) + "% Insured").attr("x", 10).attr("y", 40)
        }).on("mouseout", function (e) {
            d3.select(this).transition().duration(100).style("opacity", "1")
            d3.select("#tooltip").remove()
        })
    d3.select("#year-label").text(year);
}

const addControls = (params) => {
    const slider = d3.select(params.selector).append("input")
        .attr("type", "range")
        .attr("min", 2008)
        .attr("max", 2019)
        .attr("value", 2008)
        .attr("id", "slider")
        .on("input", e => updateMap(e.target.value, params));

    const button = d3.select(params.selector).append("button")
        .text("Replay")
        .attr("id", "replay-button")

    return [slider, button];
}

const animateSlider = async (slider, button, params) => {
    slider.attr("disabled", true)
    button.attr("disabled", true)
    while(slider.node().value > 2008) {
        slider.node().stepDown();
    }
    
    for (let year = 2008; year < 2020; year++) {
        updateMap(year, params);
        await sleep(800);
        d3.select("#slider").node().stepUp() 
    }
    slider.attr("disabled", null)
    button.attr("disabled", null)
}
    

const main = async (params) => {
    const states_json = await getStatesData("data/pct-covered-by-state.csv", "data/us-states.json")
    window.colorScale = d3.scaleSequential()
        .domain([params.maxVal, params.minVal])
        .interpolator(d3.interpolateInferno);
    const [container, pathGenerator] = mapSetup(params);
    const legend = addLegend(container, colorScale);
    drawMap(container, states_json, pathGenerator, params);
    const [slider, button] = addControls(params, container);
    button.on("click", () => animateSlider(slider, button, params))
    animateSlider(slider, button, params)
}

export { main };