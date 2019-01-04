let width = 960,
  height = 325,
  viewBox = 850,
  // viewBox = 900,
  scale0 = (width - 1) / 2 / Math.PI

let svg = d3.select('#map').append('svg')
  .attr('viewBox', '-125 -125' + ' ' + viewBox + ' ' + viewBox)
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

let civilianCasualtiesColorScale = d3.scaleSequential(d3.interpolateReds).domain([0, 50]),
  presenceColorScale = [{ text: 'Active', color: '#915050' }, { text: 'Inactive', color: '#878787' }, { text: 'No Info', color: 'url(#diagonalHatch)' }]

let x = d3.scaleLinear()
  .domain([0, 6])
  .rangeRound([325, 500])

let tooltip = d3.select('body').append('div')
  .attr('id', 'tooltip')
  .style('opacity', 0)

let presenceViewBox = 125

let presenceScale = d3.select('#presence-scale').append('svg')
  .attr('width', presenceViewBox)
  .attr('height', 50)

let pattern = presenceScale.append('defs')
  .append('pattern')
  .attr('id', 'diagonalHatch')
  .attr('patternUnits', 'userSpaceOnUse')
  .attr('width', 4)
  .attr('height', 4)
  .append('path')
  .attr('d', 'M-1,1 l2,-2 M0,4 l4,-4 M3,5 l2,-2')
  .attr('stroke', '#000000')
  .attr('stroke-width', 1)

let legend = presenceScale.selectAll('.legend')
  .data(presenceColorScale)
  .enter().append('g')
  .attr('class', 'legend')
  .attr('transform', function (d, i) { return 'translate(' + (i * 40) + ',' + 10 + ')' })

legend.append('rect')
  .attr('width', 15)
  .attr('height', 15)
  .attr('x', 5)
  .style('fill', d => d.color)
  .style('stroke', 'black')
  .style('stroke-width', '0.5px')

legend.append('text')
  .attr('y', 35)
  .style('font-size', '10px')
  .attr('fill', '#fff')
  .style('opacity', 0.6)
  .text(d => d.text)

d3.json('data/countries.json')
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
    d3.csv('data/Master Data Set.csv').then(function (data) {

      let orgConflictData = {}

      data.forEach(function (d) {
        orgConflictData[d.ISO] = {
          Name: d.COUNTRY,
          ISO: d.ISO,
          Presence: +d.USG_PRESENCE,
          CivilianCasualties: +d.USG_CIVILIAN_CASUALTIES,
          TroopCasualties: +d.USG_TROOP_CASUALTIES,
          TroopNumbers: +d.USG_TROOP_NUMBERS,
          AdversaryCasualties: +d.USG_ADVERSARY_CASUALTIES
        }
      })

      let pattern = svg.append('defs')
        .append('pattern')
        .attr('id', 'diagonalHatch')
        .attr('patternUnits', 'userSpaceOnUse')
        .attr('width', 4)
        .attr('height', 4)
        .append('path')
        .attr('d', 'M-1,1 l2,-2 M0,4 l4,-4 M3,5 l2,-2')
        .attr('stroke', '#000000')
        .attr('stroke-width', 1)

      let subunit = svg.selectAll('.subunit')
        .data(topojson.feature(mapTopo.boundaries, boundaries.objects.subunits).features)
        .enter().append('path')
        .attr('class', function (d) {
          if (orgConflictData[d.id]) {
            return (orgConflictData[d.id].Presence === 1) ? 'subunit ' + orgConflictData[d.id].ISO + ' activeConflict' : 'subunit ' + orgConflictData[d.id].ISO + ' inactiveConflict'
          } else {
            return 'subunit noInfo'
          }
        })
        .attr('d', mapTopo.path)
        .style('fill', d => {
           if (orgConflictData[d.id]) {
             if (orgConflictData[d.id]['Presence'] === 1) {
               return '#915050'
             } else {
               return '#878787'
             }
           } else {
             return 'url(#diagonalHatch)'
           }
        })

      subunit.attr('opacity', 0).transition().duration(2500).attr('opacity', 1)

      let adversaryCasualtiesActive = false,
          civilianCasualtiesActive = false,
          troopNumbersActive = true,
          troopCasualtiesActive = false

      let conflictFactors = [
        {
          dataColumn: 'AdversaryCasualties',
          elementName: 'adversaryCasualties',
          factorLink: 'adversary-casualties-link' ,
          activeProperty: adversaryCasualtiesActive,
          summaryLink: 'summary-adversary-casualties'
        },
        {
          dataColumn: 'CivilianCasualties',
          elementName: 'civilianCasualties',
          factorLink: 'civilian-casualties-link',
          activeProperty: civilianCasualtiesActive,
          summaryLink: 'summary-civilian-casualties'
        },
        {
          dataColumn: 'TroopNumbers',
          elementName: 'troopNumbers',
          factorLink: 'troop-numbers-link',
          activeProperty: troopNumbersActive,
          summaryLink: 'summary-troop-numbers'
        },
        {
          dataColumn: 'TroopCasualties',
          elementName: 'troopCasualties',
          factorLink: 'troop-casualties-link',
          activeProperty: troopCasualtiesActive,
          summaryLink: 'summary-troop-casualties'
        }
      ]

      conflictFactors.forEach(factor => {
        let bubbleGroup = svg.selectAll('.' + factor.elementName + 'Bubble')
          .data(topojson.feature(mapTopo.boundaries, boundaries.objects.subunits).features)
          .enter().append('g')
          .attr('class', function (d) {
            if (orgConflictData[d.id]) {
              return factor.elementName + 'Bubble ' + orgConflictData[d.id].ISO
            } else {
              return factor.elementName + 'Bubble'
            }
          })

        bubbleGroup.append('circle')
          .attr('transform', function (d) {
            return 'translate(' + mapTopo.path.centroid(d) + ')'
          })
          .attr('r', function (d) {
            return 0
          })

        d3.select('#' + factor.factorLink).on('click', function () {
          d3.select(this).classed('active', true)

          if (factor.activeProperty === false) {
            bubbleGroup.selectAll('circle')
              .transition()
              .attr('r', function (d) {
                if (orgConflictData[d.id]) {
                  return (orgConflictData[d.id][factor.dataColumn] != 0 && orgConflictData[d.id][factor.dataColumn] != '') ? Math.log(orgConflictData[d.id][factor.dataColumn]) : 0
                }
              })

            factor.activeProperty = true
          } else {
            d3.select(this).classed('active', false)

            bubbleGroup.selectAll('circle')
              .transition()
              .attr('r', function (d) {
                return 0
              })

            factor.activeProperty = false
          }
        })
      })

      d3.selectAll('.troopNumbersBubble circle')
        .transition()
        .duration(1000)
        .attr('r', function (d) {
          if (orgConflictData[d.id]) {
            return (orgConflictData[d.id].TroopNumbers != 0 && orgConflictData[d.id].TroopNumbers != '') ? Math.log(orgConflictData[d.id].TroopNumbers) : 0
          }
        })

      d3.select('#troop-numbers-link')
        .attr('class', 'active')

      $('#org-carousel').carousel('pause') // pause on load of carousel

      d3.select('.play').on('click', function () {
        d3.select('.pause').style('display', 'initial')
        d3.select('.play').style('display', 'none')
        $('#org-carousel').carousel('cycle')
      })

      d3.select('.pause').on('click', function () {
        d3.select('.play').style('display', 'initial')
        d3.select('.pause').style('display', 'none')
        $('#org-carousel').carousel('pause')
      })

      $('#org-carousel').on('slid.bs.carousel', function (event) {
        if (event.relatedTarget.innerText === 'Department of Defense') {
          data.forEach(function (d) {
            orgConflictData[d.ISO] = {
              Name: d.COUNTRY,
              ISO: d.ISO,
              Presence: +d.USG_PRESENCE,
              CivilianCasualties: +d.USG_CIVILIAN_CASUALTIES,
              TroopCasualties: +d.USG_TROOP_CASUALTIES,
              TroopNumbers: +d.USG_TROOP_NUMBERS,
              AdversaryCasualties: +d.USG_ADVERSARY_CASUALTIES
            }
          })
        } else if (event.relatedTarget.innerText === 'Geneva Academy') {
          data.forEach(function (d) {
            orgConflictData[d.ISO] = {
              Name: d.COUNTRY,
              ISO: d.ISO,
              Presence: +d.GENEVA_PRESENCE,
              CivilianCasualties: +d.GENEVA_CIVILIAN_CASUALTIES,
              TroopCasualties: +d.GENEVA_TROOP_CASUALTIES,
              TroopNumbers: +d.GENEVA_TROOP_NUMBERS,
              AdversaryCasualties: +d.GENEVA_ADVERSARY_CASUALTIES
            }
          })
        } else if (event.relatedTarget.innerText === 'New America') {
          data.forEach(function (d) {
            orgConflictData[d.ISO] = {
              Name: d.COUNTRY,
              ISO: d.ISO,
              Presence: +d.NEW_AMERICA_PRESENCE,
              CivilianCasualties: +d.NEW_AMERICA_CIVILIAN_CASUALTIES,
              TroopCasualties: +d.NEW_AMERICA_TROOP_CASUALTIES,
              TroopNumbers: +d.NEW_AMERICA_TROOP_NUMBERS,
              AdversaryCasualties: +d.NEW_AMERICA_ADVERSARY_CASUALTIES
            }
          })
        } else if (event.relatedTarget.innerText === 'The Bureau of Investigative Journalism') {
          data.forEach(function (d) {
            orgConflictData[d.ISO] = {
              Name: d.COUNTRY,
              ISO: d.ISO,
              Presence: +d.BIJ_PRESENCE,
              CivilianCasualties: +d.BIJ_CIVILIAN_CASUALTIES,
              TroopCasualties: +d.BIJ_TROOP_CASUALTIES,
              TroopNumbers: +d.BIJ_TROOP_NUMBERS,
              AdversaryCasualties: +d.BIJ_ADVERSARY_CASUALTIES
            }
          })
        }

        conflictFactors.forEach(factor => {
          if (factor.activeProperty) {
            d3.selectAll('.' + factor.elementName + 'Bubble ' + 'circle')
              .transition()
              .attr('r', function (d) {
                if (orgConflictData[d.id]) {
                  return (orgConflictData[d.id][factor.dataColumn] != 0 && orgConflictData[d.id][factor.dataColumn] != '') ? Math.log(orgConflictData[d.id][factor.dataColumn]) : 0
                }
              })
          }

          if (orgConflictData[lastSelected.data()[0].id][factor.dataColumn] != 0 && orgConflictData[lastSelected.data()[0].id][factor.dataColumn] != '') {
            d3.select('#' + factor.summaryLink).text(orgConflictData[lastSelected.data()[0].id][factor.dataColumn])
          } else {
            d3.select('#' + factor.summaryLink).text('No data')
          }
        })

        if (orgConflictData[lastSelected.data()[0].id].Presence === 1) {
          d3.select('#summary-presence').text('Active')
        } else {
          d3.select('#summary-presence').text('Inactive')
        }

        subunit.transition().duration(750).style('fill', d => {
          if (orgConflictData[d.id]) {
            if (orgConflictData[d.id]['Presence'] === 1) {
              return '#915050'
            } else {
              return '#878787'
            }
          } else {
            return 'url(#diagonalHatch)'
          }
        })
        .attr('class', function (d) {
          if (orgConflictData[d.id]) {
            return (orgConflictData[d.id].Presence === 1) ? 'subunit ' + orgConflictData[d.id].ISO + ' activeConflict' : 'subunit ' + orgConflictData[d.id].ISO + ' inactiveConflict'
          } else {
            return 'subunit noInfo'
          }
        })
      })

      /// ZOOM
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

        d3.selectAll('.adversaryCasualtiesBubble,.civilianCasualtiesBubble,.troopCasualtiesBubble,.troopNumbersBubble').attr('transform', transform)
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
      /// END ZOOM

      /// SET DEFAULT
      let defaultCountry = 'AFG',
        lastSelected = d3.select('.' + defaultCountry)

      conflictFactors.forEach(factor => {
        d3.select('#' + factor.summaryLink).text(orgConflictData[defaultCountry][factor.dataColumn])
      })

      d3.select('#summary-presence').text(() => {
        if (orgConflictData[defaultCountry]['Presence'] === 1) {
          return 'Active'
        } else {
          return 'Inactive'
        }
      })
      /// END SET DEFAULT

      d3.selectAll('.activeConflict,.inactiveConflict')
        .on('mousemove mouseout click', function () {
          let selector = d3.select(this).attr('class').split(` `)[1]

          d3.selectAll('.activeConflict,.inactiveConflict,.adversaryCasualtiesBubble,.civilianCasualtiesBubble,.troopCasualtiesBubble,.troopNumbersBubble')
            .transition()
            .duration(100)
            .style('opacity', function (d) {
              if (!d3.select(this).attr('class').includes(selector)) {
                return 0.3
              }
            })

          lastSelected = d3.select(this)

          d3.select('.conflict-name').text(orgConflictData[d3.select(this).data()[0].id].Name)

          conflictFactors.forEach(factor => {
            if (orgConflictData[lastSelected.data()[0].id][factor.dataColumn] != 0 && orgConflictData[lastSelected.data()[0].id][factor.dataColumn] != '') {
              d3.select('#' + factor.summaryLink).text(orgConflictData[lastSelected.data()[0].id][factor.dataColumn])
            } else {
              d3.select('#' + factor.summaryLink).text('No data')
            }
          })

          if (orgConflictData[lastSelected.data()[0].id].Presence === 1) {
            d3.select('#summary-presence').text('Active')
          } else {
            d3.select('#summary-presence').text('Inactive')
          }
        })

      d3.selectAll('.noInfo')
        .on('mouseover', function () {
          d3.selectAll('.activeConflict,.inactiveConflict,.adversaryCasualtiesBubble,.civilianCasualtiesBubble,.troopCasualtiesBubble,.troopNumbersBubble')
            .transition()
            .duration(50)
            .style('opacity', 1)
        })

      d3.select('.ocean')
        .on('mouseover', function () {
          d3.selectAll('.activeConflict,.inactiveConflict,.adversaryCasualtiesBubble,.civilianCasualtiesBubble,.troopCasualtiesBubble,.troopNumbersBubble')
            .transition()
            .duration(50)
            .style('opacity', 1)
        })
    })
      .catch(function (error) {
        console.log('Error:' + error)
      })
  })
  .catch(function (error) {
    console.log('Error:' + error)
  })
