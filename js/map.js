let width = 960,
  height = 325,
  viewBox = 750,
  scale0 = (width - 1) / 2 / Math.PI

let svg = d3.select('#map').append('svg')
  .attr('viewBox', '0 -25' + ' ' + viewBox + ' ' + viewBox)
  .attr('preserveAspectRatio', 'xMinYMid slice')
  .classed('svg-content', true)

let ocean = svg.append('rect')
  .attr('x', -75)
  .attr('y', -25)
  .attr('width', 960)
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

d3.json('data/world.json')
  .then(data => {
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
  })
  .then(mapTopo => {
    d3.csv('data/DFscores.csv').then(function (data) {
      scores = data

      let DFscores = {}
      scores.forEach(function (d) {
        DFscores[d.ID] = {
          Name: d.COUNTRY,
          ISO: d.ISO,
          Score: d.Modified_DFSCORE,
          Casualties: d.CasualtiesUS,
          Troops: d.TroopNumbers
        }
      })

      let subunit = svg.selectAll('.subunit')
        .data(topojson.feature(mapTopo.boundaries, boundaries.objects.subunits).features)
        .enter().append('path')
        .attr('class', function (d) {
          if (DFscores[d.id]) {
            return 'subunit ' + DFscores[d.id].ISO + ' activeConflict'
          } else {
            return 'subunit' + ' inactiveConflict'
          }
        })
        .attr('d', mapTopo.path)
        .style('fill', function (d) {
          if (DFscores[d.id]) {
            return color(DFscores[d.id].Score)
          }
        })

      d3.select('#df-score-link')
        .attr('class', 'active')

      DFscoreActive = true

      d3.select('#df-score-link').on('click', function () {
        d3.select(this).classed('active', true)
        if (DFscoreActive === false) {
          subunit.transition()
            .style('fill', function (d) {
              if (DFscores[d.id]) {
                return color(DFscores[d.id].Score)
              }
            })
          DFscoreActive = true
        } else {
          d3.select(this).classed('active', false)
          subunit.transition()
            .style('fill', function (d) {
              if (DFscores[d.id]) {
                return
              }
            })
          DFscoreActive = false
        }
      })

      let casualtyBubbles = svg.selectAll('.casualtyBubble')
        .data(topojson.feature(mapTopo.boundaries, boundaries.objects.subunits).features)
        .enter().append('g')
        .attr('class', function (d) {
          if (DFscores[d.id]) {
            return 'casualtyBubble ' + DFscores[d.id].ISO
          } else {
            return 'casualtyBubble'
          }
        })

      casualtyBubbles.append('circle')
        .attr('transform', function (d) {
          return 'translate(' + mapTopo.path.centroid(d) + ')'
        })
        .attr('r', function (d) {
          return 0
        })
        .attr('class', function (d) {
          if (DFscores[d.id]) {
            return 'casualtyBubble ' + DFscores[d.id].ISO
          } else {
            return 'casualtyBubble'
          }
        })

      casualtyActive = false

      d3.select('#casualties-link').on('click', function () {
        d3.select(this).classed('active', true)

        if (casualtyActive === false) {
          casualtyBubbles.selectAll('circle')
            .transition()
            .attr('r', function (d) {
              if (DFscores[d.id]) {
                return Math.log(DFscores[d.id].Casualties)
              }
            })
          casualtyActive = true
        } else {
          d3.select(this).classed('active', false)
          casualtyBubbles.selectAll('circle')
            .transition()
            .attr('r', function (d) {
              return 0
            })
          casualtyActive = false
        }
      })

      let troopsBubbles = svg.selectAll('.troopsBubble')
        .data(topojson.feature(mapTopo.boundaries, boundaries.objects.subunits).features)
        .enter().append('g')
        .attr('class', function (d) {
          if (DFscores[d.id]) {
            return 'troopsBubble ' + DFscores[d.id].ISO
          } else {
            return 'troopsBubble'
          }
        })

      troopsBubbles.append('circle')
        .attr('transform', function (d) {
          return 'translate(' + mapTopo.path.centroid(d) + ')'
        })
        .attr('r', function (d) {
          return 0
        })
        .attr('class', function (d) {
          if (DFscores[d.id]) {
            return 'troopsBubble ' + DFscores[d.id].ISO
          } else {
            return 'troopsBubble'
          }
        })

      troopsActive = false

      d3.select('#us-troops-link').on('click', function () {
        d3.select(this).classed('active', true)
        if (troopsActive === false) {
          troopsBubbles.selectAll('circle')
            .transition()
            .attr('r', function (d) {
              if (DFscores[d.id]) {
                return Math.log(DFscores[d.id].Troops) // have to tweak this! it's bullshit rn!
              }
            })
          troopsActive = true
        } else {
          d3.select(this).classed('active', false)
          troopsBubbles.selectAll('circle')
            .transition()
            .attr('r', function (d) {
              return 0
            })
          troopsActive = false
        }
      })

      d3.select('.play').on('click', function () {
        d3.select(this).classed('play-active', true)
        $('#orgCarousel').carousel('cycle')
      })

      d3.select('.fa-pause').on('click', function () {
        d3.select('.play').classed('play-active', false)
        $('#orgCarousel').carousel('pause')
      })

      $('#orgCarousel').on('slid.bs.carousel', function (event) {
        if (event.relatedTarget.innerText === 'International Institute for Strategic Studies') {
          scores.forEach(function (d) {
            DFscores[d.ID] = {
              Name: d.COUNTRY,
              ISO: d.ISO,
              Score: d.Modified_DFSCORETWO,
              Casualties: d.CasualtiesUS_TWO,
              Troops: d.TroopNumbers_TWO
            }
          })
        } else if (event.relatedTarget.innerText === 'Center for Strategic and International Studies') {
          scores.forEach(function (d) {
            DFscores[d.ID] = {
              Name: d.COUNTRY,
              ISO: d.ISO,
              Score: d.Modified_DFSCORETHREE,
              Casualties: d.CasualtiesUS_THREE,
              Troops: d.TroopNumbers_THREE
            }
          })
        } else if (event.relatedTarget.innerText === 'Brown University') {
          scores.forEach(function (d) {
            DFscores[d.ID] = {
              Name: d.COUNTRY,
              ISO: d.ISO,
              Score: d.Modified_DFSCORE,
              Casualties: d.CasualtiesUS,
              Troops: d.TroopNumbers
            }
          })
        }

        if (DFscoreActive) {
          subunit.transition()
            .style('fill', function (d) {
              if (DFscores[d.id]) {
                return color(DFscores[d.id].Score)
              }
            })
        }

        if (casualtyActive) {
          casualtyBubbles.selectAll('circle')
            .transition()
            .attr('r', function (d) {
              if (DFscores[d.id]) {
                return Math.log(DFscores[d.id].Casualties) // have to tweak this! it's bullshit rn!
              }
            })
        }

        if (troopsActive) {
          troopsBubbles.selectAll('circle')
            .transition()
            .attr('r', function (d) {
              if (DFscores[d.id]) {
                return Math.log(DFscores[d.id].Troops) // have to tweak this! it's bullshit rn!
              }
            })
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
        casualtyBubbles.attr('transform', transform)
        troopsBubbles.attr('transform', transform)
      }

      d3.select('#zoom-in').on('click', function () {
        zoom.scaleBy(svg.transition().duration(500), 1.4)
      })

      d3.select('#zoom-out').on('click', function () {
        zoom.scaleBy(svg.transition().duration(500), 1 / 1.4)
      })

      // reset button
      d3.select('#reset')
        .on('click', resetted)

      function resetted () {
        svg.transition()
          .duration(750)
          .call(zoom.transform, d3.zoomIdentity)
      }

      d3.selectAll('.activeConflict')
        .on('mousemove mouseout click', function () {
          let selector = d3.select(this).attr('class').split(` `)[1]

          d3.selectAll('.activeConflict,.casualtyBubble,.troopsBubble').style('opacity', function (d) {
            if (!d3.select(this).attr('class').includes(selector)) {
              return 0.3
            }
          })

          d3.select('.conflict-name').text(DFscores[d3.select(this).data()[0].id].Name)
          d3.select('.summary-DFscore').text(DFscores[d3.select(this).data()[0].id].Score)
          d3.select('.summary-casualties').text(DFscores[d3.select(this).data()[0].id].Casualties)
          d3.select('.summary-troops').text(DFscores[d3.select(this).data()[0].id].Troops)
        })

      d3.selectAll('.inactiveConflict').on('mouseover', function () {
        d3.selectAll('.activeConflict,.casualtyBubble,.troopsBubble').style('opacity', 1)
      })

      d3.select('.ocean').on('mouseover', function () {
        d3.selectAll('.activeConflict,.casualtyBubble,.troopsBubble').style('opacity', 1)
      })
    })
      .catch(function (error) {
        console.log('Error in retrieving CSV: ' + error)
      })
  })
  .catch(function (error) {
    console.log('Error in retrieving JSON: ' + error)
  })
