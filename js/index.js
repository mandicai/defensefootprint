var width = 960,
    height = 325

var svg = d3.select("#map").append("svg")
    // preserveAspectRatio
    // defaults to meet (aspect ratio is preserved, entire viewBox is visible)
    .attr("preserveAspectRatio", "xMinYMin meet")
    // y-axis is the same scale
    .attr("viewBox", "0 20 800 600")
    .classed("svg-content", true);

let boundaries
let dataFiles = ['data/afg_irn_col_kor_jpn.json','data/testdata.csv']

dataFiles.forEach(function(url,i) {
  fetch(url)
    .then((data) => {
      console.log(data)
    })
})

fetch('data/world_2000.json')
  .then((res) => res.json()) // .json() returns a promise that resolves with the result of parsing the text as JSON
  .then((data) => { // do something with the JSON data
    boundaries = data

  // topojson - feature collection
  var subunits = topojson.feature(boundaries, boundaries.objects.subunits)

  // store geomercator projection
  var projection = d3.geoMercator()
      .translate([width / 2 - 100, height / 2 + 150]) // translate some pixels
      .scale(100)

  // convert projection to a path
  var path = d3.geoPath()
      .projection(projection)

  // append the path to the svg for the country outlines
  // This part attaches an entire map that groups together the country subunits as one large chunk
  // Take out to access individual countries?
  // svg.append("path")
  //     .datum(subunits) // bind multiple features
  //     .attr("d", path) // d is the attribute for SVG paths

  svg.selectAll(".subunit")
        .data(topojson.feature(boundaries, boundaries.objects.subunits).features)
      .enter().append("path")
        .attr("class", function(d) {
          return "subunit " + d.id // yields class = "subunit AFG"
        })
        .attr("d", path)

   // fetch a CSV file and store the objects into an array
  let descriptionsStatistics = []
  d3.csv("/data/testdata.csv", function(data) {
   descriptionsStatistics.push(data)
  });

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
        for (i=0;i<descriptionsStatistics.length;i++) {
          if (descriptionsStatistics[i].CODE === countryClass) {
            descriptionText = descriptionsStatistics[i].DESCRIPTION
            statisticsText = descriptionsStatistics[i].STATISTICS
            countryText = descriptionsStatistics[i].NAME
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
