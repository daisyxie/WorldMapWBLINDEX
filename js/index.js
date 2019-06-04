(function() {

    const width = 960;
    const height = 500;
    let statesLivedData = [];
    let citiesLivedData = [];
    let statesGeoJSONData = [];
    let data = [];

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
            }})
            .on("mouseover", (d) => {
                div.transition()
                  .duration(200)
                  .style("opacity", .9)
                  .style("left", (d3.event.pageX) + "px")
                  .style("top", (d3.event.pageY - 28) + "px");
                makeScatterPlot();
              })
              .on("mouseout", (d) => {
                div.transition()
                  .duration(500)
                  .style("opacity", 0);
              });
        ;

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
        .text(function(d) { return d; })
        
        // make tooltip
        let div = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

        svgScatterPlot = div.append("svg")
        .attr('width', 250)
        .attr('height', 250)
    ;
    }

    // make scatter plot
    function makeScatterPlot() {
        data = statesLivedData;
        // get data as arrays
        let wblData = data.map((row) => parseFloat(row["WBL INDEX"]));
        let jobStartData = data.map((row) => parseFloat(row["STARTING A JOB"]));

        // find limits
        let axesLimits = findMinMax(wblData, jobStartData);

        // draw axes and return scaling + mapping functions
        let mapFunctions = drawAxes(axesLimits, "WBL INDEX", "STARTING A JOB", svgScatterPlot, {min: 40, max: 230}, {min: 20, max: 210}, false);

        // plot data as points and add tooltip functionality
        plotData(mapFunctions);

        // draw title and axes labels
        makeLabels();
    }

  // plot all the data points on the SVG
  // and add tooltip functionality
  function plotData(map) {
    // mapping functions
    let xMap = map.x;
    let yMap = map.y;

    svgScatterPlot.selectAll('.dot')
    .data(data)
    .enter()
    .append('circle')
      .attr('cx', xMap)
      .attr('cy', yMap)
      .attr('r', 3)
      .attr('fill', "#4286f4")
  }

  // make title and axes labels
  function makeLabels() {
    svgScatterPlot.append('text')
      .attr('x', 20)
      .attr('y', 25)
      .style('font-size', '6pt')
      .text("Probability of Starting a Job vs WBL Index Around the World");

    svgScatterPlot.append('text')
      .attr('x', 65)
      .attr('y', 240)
      .style('font-size', '8pt')
      .text('Probability of Starting a Job');

    svgScatterPlot.append('text')
      .attr('transform', 'translate(15, 300)rotate(-90)')
      .attr('x', 150)
      .style('font-size', '8pt')
      .text('WBL Index');
  }


  // draw the axes and ticks
  function drawAxes(limits, x, y, svg, rangeX, rangeY, isYear) {
    // return x value from a row of data
    let xValue = function(d) { return +d[x]; }

    // function to scale x value
    let xScale = "";
    //use different scale if x-axis is year
    if (isYear) {
      xScale = d3.scaleTime()
      .range([rangeX.min, rangeX.max]);
    } else {
      xScale = d3.scaleLinear()
      .domain([limits.xMin, limits.xMax]) // give domain buffer room
      .range([rangeX.min, rangeX.max]);
    }

    // xMap returns a scaled x value from a row of data
    let xMap = function(d) { return xScale(xValue(d)); };

    // plot x-axis at bottom of SVG
    let xAxis = d3.axisBottom().scale(xScale);
    //parse date to make x-axis in years
    if (isYear) {
      xScale.domain(d3.extent(data, function(d) {return parseYear(d[x]);}))
    }
    svg.append("g")
      .attr('transform', 'translate(0, ' + rangeY.max + ')')
      .call(xAxis);
    //change domain to allow calculation of points (no parsing of date)
    xScale.domain(d3.extent(data, function(d) {return d[x];}))

    // return y value from a row of data
    let yValue = function(d) { return +d[y]}

    // function to scale y
    let yScale = d3.scaleLinear()
    .domain([limits.yMax, limits.yMin]) // give domain buffer
    .range([rangeY.min + 20, rangeY.max]);

    // yMap returns a scaled y value from a row of data
    let yMap = function (d) { return yScale(yValue(d)); };

    // plot y-axis at the left of SVG
    let yAxis = d3.axisLeft().scale(yScale);
    svg.append('g')
      .attr('transform', 'translate(' + rangeX.min + ', 0)')
      .call(yAxis);

    // return mapping and scaling functions
    return {
      x: xMap,
      y: yMap,
      xScale: xScale,
      yScale: yScale
    };
  }

  // find min and max for arrays of x and y
  function findMinMax(x, y) {

    // get min/max x values
    let xMin = d3.min(x);
    let xMax = d3.max(x);

    // get min/max y values
    let yMin = d3.min(y);
    let yMax = d3.max(y);

    // return formatted min/max data as an object
    return {
      xMin : xMin,
      xMax : xMax,
      yMin : yMin,
      yMax : yMax
    }
  }



})();