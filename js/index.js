(function() {

    const width = 960;
    const height = 500;
    let statesLivedData = [];
    let citiesLivedData = [];
    let statesGeoJSONData = [];
    window.onload = function() {
        // load states lived data
        d3.csv("data/wblData.csv")
            .then((data) => {
                statesLivedData = data;
                //loadCitiesData()
                loadStatesGeoJSONData()
            });
    }



    // load GeoJSON states data
    function loadStatesGeoJSONData() {
        d3.json("data/countries.geojson").then((data) => {
            statesGeoJSONData = data
            
            makeMapPlot(); // all data should be loaded
        });
    }

    function makeMapPlot() {
        let projection = d3.geoNaturalEarth1()
            .translate([width/2, height/2]) // translate to center of svg
        
        // path generator
        let path = d3.geoPath() // converts geoJSON to SVG paths
            // each state is represented by a path element
            .projection(projection); // use AlbersUSA projection

        let color = d3.scaleLinear()
            .range(["#BF0700", "#854644", "#5F7172", "#00DCE5"]);

            
        let legendText = ["Above WBL INDEX 80", "Above WBL INDEX 60", "Above WBL INDEX 40", "Below 40"];
        
        let svg = d3.select("body").append("svg")
            .attr("width", width)
            .attr("height", height);

        // append a div to the body for the tooltip
        let tooltip = d3.select("body")
            .append("div")
            .attr("class", "tooltip")
            .style("opacity", 0);
        
        color.domain([0,1,2,3]);
        
        // Loop through each state data value in the .csv file

        for (let i = 0; i < statesLivedData.length; i++) {
            let dataIndex = statesLivedData[i]['WBL INDEX']
            //console.log(dataIndex)
            let dataState = statesLivedData[i].wbcodev2;
            //console.log(dataState)

            // Find the corresponding state inside the GeoJSON
            for (let j = 0; j < statesGeoJSONData.features.length; j++)  {
                let jsonState = statesGeoJSONData.features[j].properties.ISO_A3;
                if (dataState == jsonState) {

                // Copy the data value into the JSON
                statesGeoJSONData.features[j].properties.index = dataIndex; 

                // Stop looking through the JSON
                break;
                }
            }
        }
        // Bind the data to the SVG and create one path per GeoJSON feature
        svg.selectAll("path")
            .data(statesGeoJSONData.features)
            .enter()
            .append("path")
            .attr("d", path)
            .style("stroke", "#fff")
            .style("stroke-width", "1")
            .style("fill", function(d) {

            // Get data value
            var value = d.properties.index;

            if (value > 80) {
                //If value exists…
                return '#00DCE5';
            } else if(value > 60){
                return '#5F7172'
            } else if(value > 40){
                return '#854644'
            } else if(value < 40){
                return '#BF0700'
            }
            else {
                //If value is undefined…
                return "rgb(213,222,217)";
            }
        });

        var legend = d3.select("body").append("svg")
        .attr("class", "legend")
        .attr("width", 140)
        .attr("height", 200)
        .selectAll("g")
        .data(color.domain().slice().reverse())
        .enter()
        .append("g")
        .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });

        legend.append("rect")
        .attr("width", 18)
        .attr("height", 18)
        .style("fill", color);

        legend.append("text")
        .data(legendText)
        .attr("x", 24)
        .attr("y", 10)
        .attr("dy", ".35em")
        .text(function(d) { return d; });

        
    }
})();