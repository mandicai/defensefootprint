let width = 960,
  height = 325,
  viewBox = 900,
  scale0 = (width - 1) / 2 / Math.PI

let svg = d3.select('#map').append('svg')
  .attr('viewBox', '-50 -125' + ' ' + viewBox + ' ' + viewBox)
  .attr('preserveAspectRatio', 'xMinYMid slice')
  .classed('svg-content', true)

let ocean = svg.append('rect')
  .attr('x', -75)
  .attr('y', -25)
  .attr('width', width)
  .attr('height', viewBox)
  .attr('class', 'ocean')

let color = d3.scaleThreshold()
  .domain([1.0, 2.0, 3.0, 4.0, 5.0])
  .range(['#FFFFFF', '#ECC5C5', '#D98888', '#C34444', '#710000', '#4c0202'])
// let color = d3.scaleSequential(d3.interpolateYlOrBr).domain([0, 5])

let x = d3.scaleLinear()
  .domain([0, 6])
  .rangeRound([325, 500])

let g = svg.append('g')
  .attr('class', 'key')
  .attr('transform', 'translate(265,50)')

let tooltip = d3.select('body').append('div')
  .attr('id', 'tooltip')
  .style('opacity', 0)

d3.json('data/countries.json')
  .then(data => {
    return setupMapTopo(data)
  })
  .then(mapTopo => {
    d3.csv('data/Master Data Set.csv').then(function (data) {
      scores = data

      let DFscores = {}

      scores.forEach(function (d) {
        DFscores[d.ISO] = {
          Name: d.COUNTRY,
          ISO: d.ISO,
          Score: +d.USG_PRESENCE,
          CivilianCasualties: +d.USG_CIVILIAN_CASUALTIES,
          TroopCasualties: +d.USG_TROOP_CASUALTIES,
          TroopNumbers: +d.USG_TROOP_NUMBERS
        }
      })

      let subunit = svg.selectAll('.subunit')
        .data(topojson.feature(mapTopo.boundaries, boundaries.objects.subunits).features)
        .enter().append('path')
        .attr('class', function (d) {
          if (DFscores[d.id]) {
            return (DFscores[d.id].Score === 1) ? 'subunit ' + DFscores[d.id].ISO + ' activeConflict' : 'subunit' + ' inactiveConflict'
          } else {
            return 'subunit'
          }
        })
        .attr('d', mapTopo.path)

   
      let [civilianCasualtiesActive, troopCasualtiesActive, troopNumbersActive] = [false, false, true]

      let factors = ['civilianCasualties', 'troopCasualties', 'troopNumbers']

      factors.forEach((factor) => {
        svg.selectAll(`.${factor}Bubble`)
          .data(topojson.feature(mapTopo.boundaries, boundaries.objects.subunits).features)
          .enter().append('g')
          .attr('class', function (d) {
            if (DFscores[d.id]) {
              return `${factor}Bubble ` + DFscores[d.id].ISO
            } else {
              return `${factor}Bubble`
            }
          })
        
        svg.selectAll(`.${factor}Bubble`).append('circle')
          .attr('transform', function (d) {
            return 'translate(' + mapTopo.path.centroid(d) + ')'
          })
          .attr('r', function (d) {
            return 0
          })
          .attr('class', function (d) {
            if (DFscores[d.id]) {
              return `${factor}Bubble ` + DFscores[d.id].ISO
            } else {
              return `${factor}Bubble`
            }
          })
      })

      d3.select('#civilianCasualties-link').on('click', function () {
        d3.select(this).classed('active', true)

        if (civilianCasualtiesActive === false) {
          svg.selectAll('.civilianCasualtiesBubble').selectAll('circle')
            .transition()
            .attr('r', function (d) {
              if (DFscores[d.id]) {
                return (DFscores[d.id].CivilianCasualties != 0) ? Math.log(DFscores[d.id].CivilianCasualties) : 0
              }
            })
          civilianCasualtiesActive = true
        } else {
          d3.select(this).classed('active', false)
          svg.selectAll('.civilianCasualtiesBubble').selectAll('circle')
            .transition()
            .attr('r', function (d) {
              return 0
            })
          civilianCasualtiesActive = false
        }
      })

      d3.select('#troopCasualties-link').on('click', function () {
        d3.select(this).classed('active', true)
        if (troopCasualtiesActive === false) {
          svg.selectAll('.troopCasualtiesBubble').selectAll('circle')
            .transition()
            .attr('r', function (d) {
              if (DFscores[d.id]) {
                return (DFscores[d.id].TroopCasualties != 0) ? Math.log(DFscores[d.id].TroopCasualties) : 0
              }
            })
          troopCasualtiesActive = true
        } else {
          d3.select(this).classed('active', false)
          svg.selectAll('.troopCasualtiesBubble').selectAll('circle')
            .transition()
            .attr('r', function (d) {
              return 0
            })
          troopCasualtiesActive = false
        }
      })

      d3.select('#troopNumbers-link')
        .attr('class', 'active')

      svg.selectAll('.troopNumbersBubble').selectAll('circle')
        .transition()
        .attr('r', function (d) {
          if (DFscores[d.id]) {
            return (DFscores[d.id].TroopNumbers != 0 && !isNaN(DFscores[d.id].TroopNumbers)) ? Math.log(DFscores[d.id].TroopNumbers) : 0
          }
        })

      d3.select('#troopNumbers-link').on('click', function () {
        d3.select(this).classed('active', true)
        if (troopNumbersActive === false) {
          svg.selectAll('.troopNumbersBubble').selectAll('circle')
            .transition()
            .attr('r', function (d) {
              if (DFscores[d.id]) {
                return (DFscores[d.id].TroopNumbers != 0 && !isNaN(DFscores[d.id].TroopNumbers)) ? Math.log(DFscores[d.id].TroopNumbers) : 0
              }
            })
          troopNumbersActive = true
        } else {
          d3.select(this).classed('active', false)
          svg.selectAll('.troopNumbersBubble').selectAll('circle')
            .transition()
            .attr('r', function (d) {
              return 0
            })
          troopNumbersActive = false
        }
      })

      d3.select('.play').on('click', function () {
        d3.select('.pause').style('display', 'initial')
        d3.select('.play').style('display', 'none')
        $('#orgCarousel').carousel('cycle')
      })

      d3.select('.pause').on('click', function () {
        d3.select('.play').style('display', 'initial')
        d3.select('.pause').style('display', 'none')
        $('#orgCarousel').carousel('pause')
      })

      $('#orgCarousel').on('slid.bs.carousel', function (event) {

        let organizations = {
          'Department of Defense': 'USG',
          'Geneva Academy': 'GENEVA',
          'New America': 'NEW_AMERICA',
          'The Bureau of Investigative Journalism': 'BIJ'
        }

        Object.keys(organizations).forEach((key) => {
          if (event.relatedTarget.innerText === key) {
            scores.forEach(function (d) {
              DFscores[d.ISO] = {
                Name: d.COUNTRY,
                ISO: d.ISO,
                Score: +d[`${organizations[key]}_PRESENCE`],
                CivilianCasualties: +d[`${organizations[key]}_CIVILIAN_CASUALTIES`],
                TroopCasualties: +d[`${organizations[key]}_TROOP_CASUALTIES`],
                TroopNumbers: +d[`${organizations[key]}_TROOP_NUMBERS`]
              }
            })
          }
        })

        if (civilianCasualtiesActive) {
          svg.selectAll('.civilianCasualtiesBubble').selectAll('circle')
            .transition()
            .attr('r', function (d) {
              if (DFscores[d.id]) {
                return (DFscores[d.id].CivilianCasualties != 0) ? Math.log(DFscores[d.id].CivilianCasualties) : 0
              }
            })
        }

        if (troopCasualtiesActive) {
          svg.selectAll('.troopCasualtiesBubble').selectAll('circle')
            .transition()
            .attr('r', function (d) {
              if (DFscores[d.id]) {
                return (DFscores[d.id].TroopCasualties != 0) ? Math.log(DFscores[d.id].TroopCasualties) : 0
              }
            })
        }

        if (troopNumbersActive) {
          svg.selectAll('.troopNumbersBubble').selectAll('circle')
            .transition()
            .attr('r', function (d) {
              if (DFscores[d.id]) {
                return (DFscores[d.id].TroopNumbers != 0 && !isNaN(DFscores[d.id].TroopNumbers)) ? Math.log(DFscores[d.id].TroopNumbers) : 0
              }
            })
        }
  
        d3.select('.conflict-name').text(DFscores[lastSelected.data()[0].id].Name)
        d3.select('.summary-civilian-casualties').text(DFscores[lastSelected.data()[0].id].CivilianCasualties)
        d3.select('.summary-troop-casualties').text(DFscores[lastSelected.data()[0].id].TroopCasualties)
        if (!isNaN(DFscores[lastSelected.data()[0].id].TroopNumbers)) {
          d3.select('.summary-troop-numbers').text(DFscores[lastSelected.data()[0].id].TroopNumbers)
        } else {
          d3.select('.summary-troop-numbers').text('No data')
        }
      })

      let zoom = d3.zoom()
        .scaleExtent([1, 40])
        .translateExtent([
          [0, 0],
          [width / 1.5, height / 0.6]
        ])
        .extent([
          [0, 0],
          [width / 1.5, height / 0.6]
        ])
        .on('zoom', zoomed)

      svg.call(zoom)

      function zoomed () {
        let transform = d3.event.transform
        subunit.attr('transform', transform)
        subunit.style('stroke-width', 0.2 / transform.k + 'px')
        civilianCasualtiesBubbles.attr('transform', transform)
        troopCasualtiesBubbles.attr('transform', transform)
        troopNumbersBubbles.attr('transform', transform)
      }

      d3.select('#zoom-in').on('click', function () {
        zoom.scaleBy(svg.transition().duration(500), 1.4)
      })

      d3.select('#zoom-out').on('click', function () {
        zoom.scaleBy(svg.transition().duration(500), 1 / 1.4)
      })

      d3.select('#reset')
        .on('click', resetted)

      function resetted () {
        svg.transition()
          .duration(750)
          .call(zoom.transform, d3.zoomIdentity)
      }

      let lastSelected = d3.select('.AFG')

      d3.selectAll('.activeConflict')
        .on('mousemove mouseout click', function () {
          let selector = d3.select(this).attr('class').split(` `)[1]

          d3.selectAll('.activeConflict,.civilianCasualtiesBubble,.troopCasualtiesBubble,.troopNumbersBubble').style('opacity', function (d) {
            if (!d3.select(this).attr('class').includes(selector)) {
              return 0.3
            }
          })
          lastSelected = d3.select(this)
          d3.select('.conflict-name').text(DFscores[d3.select(this).data()[0].id].Name)
          d3.select('.summary-civilian-casualties').text(DFscores[d3.select(this).data()[0].id].CivilianCasualties)
          d3.select('.summary-troop-casualties').text(DFscores[d3.select(this).data()[0].id].TroopCasualties)
          if (!isNaN(DFscores[d3.select(this).data()[0].id].TroopNumbers)) {
            d3.select('.summary-troop-numbers').text(DFscores[d3.select(this).data()[0].id].TroopNumbers)
          } else {
            d3.select('.summary-troop-numbers').text('No data')
          }
        })

      d3.selectAll('.inactiveConflict').on('mouseover', function () {
        d3.selectAll('.activeConflict,.civilianCasualtiesBubble,.troopCasualtiesBubble,.troopNumbersBubble').style('opacity', 1)
      })

      d3.select('.ocean').on('mouseover', function () {
        d3.selectAll('.activeConflict,.civilianCasualtiesBubble,.troopCasualtiesBubble,.troopNumbersBubble').style('opacity', 1)
      })
    })
      .catch(function (error) {
        console.log('Error: ' + error)
      })
  })
  .catch(function (error) {
    console.log('Error: ' + error)
  })

function setupMapTopo (data) {
  boundaries = data

  let subunits = topojson.feature(boundaries, boundaries.objects.subunits)

  let projection = d3.geoMercator()
    .translate([width / 2 - 200, height / 2 + 200])
    .scale(100)

  let path = d3.geoPath()
    .projection(projection)

  let mapTopo = {
    boundaries: boundaries,
    path: path
  }
  return mapTopo
}
