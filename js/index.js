let width = 960,
    height = 325

let svg = d3.select("#map").append("svg")
    // preserveAspectRatio
    // defaults to meet (aspect ratio is preserved, entire viewBox is visible)
    .attr("preserveAspectRatio", "xMinYMin meet")
    // y-axis is the same scale
    .attr("viewBox", "0 20 800 600")
    .classed("svg-content", true);

// Make a threshold scale
let color = d3.scaleThreshold()
    .domain([1.0, 2.0, 3.0, 4.0, 5.0])
    .range(["#FFFFFF","#ECC5C5", "#D98888", "#C34444", "#AD0000", "#710000"]);

let x = d3.scaleLinear()
    .domain([0, 6])
    .rangeRound([325, 500]); // divide by number of values in domain
                             // how big the scale is
let g = svg.append("g")
    .attr("class", "key")
    .attr("transform", "translate(265,50)")

g.selectAll("rect")
  .data(color.range().map(function(d) {
      d = color.invertExtent(d);
      if (d[0] == null) d[0] = x.domain()[0]; // this takes the edge values and sets them to actual values
      if (d[1] == null) d[1] = x.domain()[1];
      return d;
    }))
  .enter().append("rect")
    .attr("height", 8)
    .attr("x", function(d) { return x(d[0]) })
    .attr("width", function(d) { return x(d[1]) - x(d[0]) })
    .attr("fill", function(d) { return color(d[0]) });

g.append("text")
    .attr("class", "caption")
    .attr("x", x.range()[0])
    .attr("y", -6)
    .attr("fill", "#000")
    .attr("text-anchor", "start")
    .attr("font-weight", "bold")
    .text("DF score")

g.call(d3.axisBottom(x)
    .tickSize(13)
    .tickFormat(function(x, i) { return x })
    .tickValues(color.domain()))
  .select(".domain")
    .remove();

d3.json("data/world_2000.json").then(function(data) {
  boundaries = data

  // topojson - feature collection
  let subunits = topojson.feature(boundaries, boundaries.objects.subunits)

  // store geomercator projection
  let projection = d3.geoMercator()
      .translate([width / 2 - 182, height / 2 + 130]) // translate some pixels
      .scale(95)

  // convert projection to a path
  let path = d3.geoPath()
      .projection(projection)

  // append the path to the svg for the country outlines
  // This part attaches an entire map that groups together the country subunits as one large chunk
  // Take out to access individual countries?
  // svg.append("path")
  //     .datum(subunits) // bind multiple features
  //     .attr("d", path) // d is the attribute for SVG paths

  // fetch the DFscores
  console.log("blah")
  let DFscores
  d3.csv("data/DFscores.csv").then(function(data) {
    DFscores = data
    let rateByDF = {};
    DFscores.forEach(function(d) {
      rateByDF[d.ISO] = +d.Modified_DFSCORE
    })
    svg.selectAll(".subunit")
        .data(topojson.feature(boundaries, boundaries.objects.subunits).features)
      .enter().append("path")
        .attr("class", function(d) {
          return "subunit " + d.id // yields class = "subunit AFG"
        })
        .attr("d", path)
        .style("fill", function(d) { return color(rateByDF[d.id]); });
  })
    .catch(function(error) {
      console.log("Error: " + error)
    })
    .then(() => {
      console.log("blah")
      // fetch a CSV file and store the objects into an array
     d3.csv("data/description_statistics.csv").then(function(data) {
       // create mouse over and mouse out functionality
       svg.selectAll(".subunit")
           .on("mouseover", function() {
             d3.select(this) // Change the color of the country
               .style('opacity', '0.75')

             d3.select('#country-text')
               .remove()
             d3.select('#description-text') // Remove the previous text
               .remove()
             d3.select('#statistics-text')
               .remove()

             let countryClass = d3.select(this).attr("class").split(' ')[1] // Grab the class
             let countryText
             let descriptionText
             let statisticsText
             // Set the corresponding text
             for (i=0;i<data.length;i++) {
               if (data[i].CODE === countryClass) {
                 descriptionText = data[i].DESCRIPTION
                 statisticsText = data[i].STATISTICS
                 countryText = data[i].NAME
               }
             }

             // Append country name with the corresponding text
             d3.select("#country")
               .append('p')
               .attr('id', 'country-text')
               .text(countryText)
               .style("opacity", "0")
               .transition()
               .style("opacity", "1")
             // Append description text with the corresponding text
             d3.select("#description")
               .append('p')
               .attr('id','description-text')
               .text(descriptionText)
               .style("opacity", "0")
               .transition()
               .style("opacity", "1")
             // Append statistics text with the corresponding text
             d3.select("#statistics")
               .append('p')
               .attr('id', 'statistics-text')
               .text(statisticsText)
               .style("opacity", "0")
               .transition()
               .style("opacity", "1")
           })
           .on("mouseout", function() {
             d3.select(this).style('opacity', function (d) {
           })
         })
       })
       .catch(function(error) {
         console.log("Error: " + error)
       })
    })
  })
    .catch(function(error) {
      console.log("Error: " + error)
    })
