let width = 960,
    height = 325,
    scale0 = (width - 1) / 2 / Math.PI

let svg = d3.select("#map").append("svg")
  // preserveAspectRatio
  // defaults to meet (aspect ratio is preserved, entire viewBox is visible)
  .attr("viewBox", "-50 -25 525 525")
  .attr("preserveAspectRatio", "xMinYMin meet")
  // y-axis is the same scale
  .classed("svg-content", true)

// Make a threshold scale
let color = d3.scaleThreshold()
  .domain([1.0, 2.0, 3.0, 4.0, 5.0])
  .range(["#FFFFFF", "#ECC5C5", "#D98888", "#C34444", "#AD0000", "#710000"])

let x = d3.scaleLinear()
  .domain([0, 6])
  .rangeRound([325, 500]) // divide by number of values in domain
// how big the scale is
let g = svg.append("g")
  .attr("class", "key")
  .attr("transform", "translate(265,50)")

let tooltip = d3.select('body').append('div')
    .attr('id', 'tooltip')
    .style('opacity', 0)

let scores
let boundaries
let DFscores

d3.json("data/world.json")
  .then(data => {
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

    let mapTopo = { boundaries: boundaries, path: path }
    return mapTopo
})
  .then(mapTopo => {
    d3.csv("data/DFscores.csv").then(function(data) {
      scores = data

      let DFscores = {}
      scores.forEach(function(d) {
        DFscores[d.ID] = +d.Modified_DFSCORE
      })

      let subunit = svg.selectAll(".subunit")
        .data(topojson.feature(mapTopo.boundaries, boundaries.objects.subunits).features)
        .enter().append("path")
        .attr("class", function(d) {
          return "subunit " + d.id
        })
        .attr("d", mapTopo.path)
        .style("fill", function(d) {
          return color(DFscores[d.id])
        })

      // if some property is true (which gets set by the button)
      // svg.selectAll(".subunit").style("fill", function(d) {
      //   return color(DFscores[d.id])
      // })

      // define the zoom behavior
      let zoom = d3.zoom()
        .scaleExtent([1, 40]) // restricts zooming in and out
        .translateExtent([[0, 0], [width, height]]) // restricts panning, causes translation on zoom out
        .extent([[0, 0], [width, height]]) // sets the viewport
        .on("zoom", zoomed)

      // call the zoom behavior on a selected element
      svg.call(zoom)

      // applies the current zoom transform
      function zoomed() {
        let transform = d3.event.transform
        subunit.attr("transform", transform)
      }

      d3.select("#reset")
        .on("click", resetted)

      function resetted() {
        svg.transition()
          .duration(750)
          .call(zoom.transform, d3.zoomIdentity)
      }

      // create mouse over and mouse out functionality
      svg.selectAll(".subunit")
        .on("mouseover", function() {
          d3.select(this) // Change the color of the country
            .style('opacity', '0.75')

          tooltip.transition()
            .duration(200)
            .style("opacity", .9)

          tooltip.html('Conflict occurs here' + "<br/>"  + 'Stuff about troop numbers')
            .style("left", (d3.event.pageX) + "px")
            .style("top", (d3.event.pageY - 28) + "px")
        })
        .on("mouseout", function() {
          d3.select(this).style('opacity', function(d) {})
          tooltip.transition()
            .duration(500)
            .style("opacity", 0)
        })
    })
    .catch(function(error) {
      console.log("Error in retrieving CSV: " + error)
    })
  })
  .catch(function(error) {
    console.log("Error in retrieving JSON: " + error)
  })
