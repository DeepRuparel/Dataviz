//
// Description: This file contains the code for the scatterplot matrix and the brushing and linking functionality.
//              Extra credit: I have added a legend for the iris dataset and a linear gradient for the gpa dataset.
// AUTHOR: DEEP RUPAREL
// EMAIL: deepruparel@arizona.edu

//////////////////////////////////////////////////////////////////////////////
// Global variables, preliminaries to draw the grid
//////////////////////////////////////////////////////////////////////////////
//Comment out one of the following two lines to select a dataset
let data = scores
//let data = iris

// define a dictionary to hold the brush for the current cell column and cell row
let dict = {}
// getting the attributes of the data
let columns = Object.keys(data[0]).filter(d => typeof data[0][d] === 'number')

let width = 1000
let height = 900
let padding = 40
// code to append the size of the svg
let svg = d3
  .select('body')
  .append('svg')
  .attr('width', width)
  .attr('height', height)
// appending a new svg for the legend
let svg_legend = d3
  .select('body')
  .append('svg')
  .attr('width', width)
  .attr('height', 100)

if (data == iris) {
  // adding a legend for the iris dataset
  let color = d3
    .scaleOrdinal()
    .domain(['setosa', 'versicolor', 'virginica'])
    .range(['#86BD8B', '#B9B4D2', '#F9C082'])
  svg_legend
    .append('text')
    .attr('x', 150)
    .attr('y', 60)
    .attr('dy', '.35em')
    .style('text-anchor', 'middle')
    .text('Species Names')

  let legend = svg_legend
    .selectAll('.legend')
    .data(color.domain())
    .enter()
    .append('g')
    .attr('class', 'legend')
    .attr('transform', function (d, i) {
      return 'translate(' + i * 100 + ',0)'
    })
  legend
    .append('rect')
    .attr('x', 50 - 20)
    .attr('y', 20)
    .attr('width', 18)
    .attr('height', 18)
    .style('fill', color)
  legend
    .append('text')
    .attr('x', 50)
    .attr('y', 30)
    .attr('dy', '.35em')
    .style('text-anchor', 'start')
    .text(function (d) {
      return d
    })
} else {
  // adding a linear gradient for the gpa dataset
  let magin = 50
  let gradient = svg_legend
    .append('defs')
    .append('linearGradient')
    .attr('id', 'linear-gradient')
    .attr('x1', '0%')
    .attr('y1', '0%')
    .attr('x2', '100%')
    .attr('y2', '0%')
  gradient
    .append('stop')
    .attr('offset', '0%')
    .attr('stop-color', '#FF0000')
  gradient
    .append('stop')
    .attr('offset', '100%')
    .attr('stop-color', '#0000FF')
  svg_legend
    .append('rect')
    .attr('x', magin)
    .attr('y', 20)
    .attr('width', width / 2)
    .attr('height', 18)
    .style('fill', 'url(#linear-gradient)')
  svg_legend
    .append('text')
    .attr('x', 300)
    .attr('y', 70)
    .attr('dy', '.35em')
    .style('text-anchor', 'middle')
    .text('GPA')
  // adding  ticks and labels to the legend
  let x = d3
    .scaleLinear()
    .domain(d3.extent(data, d => d['gpa']))
    .range([magin, width / 2 + magin])
  let xAxis = d3.axisBottom(x).ticks(2)
  svg_legend
    .append('g')
    .attr('transform', `translate(0,${20 + 18})`)
    .call(xAxis)
  let dMin = d3.min(data, d => d['GPA'])
  let dMax = d3.max(data, d => d['GPA'])
  // rounding the min and max to the only one decimal place
  dMin = Math.round(dMin * 10) / 10
  dMax = Math.round(dMax * 10) / 10
  // calculating the mid point and rounding it to one decimal place
  dMid = Math.round(((dMin + dMax) / 2) * 10) / 10
  svg_legend
    .append('text')
    .attr('x', magin)
    .attr('y', 50)
    .attr('dy', '.35em')
    .style('text-anchor', 'start')
    .text(dMin)
  svg_legend
    .append('text')
    .attr('x', width / 4 + magin)
    .attr('y', 50)
    .attr('dy', '.35em')
    .style('text-anchor', 'start')
    .text(dMid)
  svg_legend
    .append('text')
    .attr('x', width / 2 + magin)
    .attr('y', 50)
    .attr('dy', '.35em')
    .style('text-anchor', 'end')
    .text(dMax)
}
//create the groups and do a data join
// define size
let size = width / columns.length - padding
let groups = svg
  .selectAll('g')
  .data(d3.cross(columns, columns))
  .join('g')
  .attr(
    'transform',
    d =>
      `translate(${columns.indexOf(d[0]) * size},${columns.indexOf(d[1]) *
        size})`
  )
let attrib_pairs = d3.cross(columns, columns)

//calling makeScatterplot() once per group
groups.each(function (attrib_pair) {
  //console.log(attrib_pair);
  makeScatterplot(d3.select(this), attrib_pair)
})
// adding x and y axes to each group
groups.each(function (attrib_pair) {
  let x = d3
    .scaleLinear()
    .domain(d3.extent(data, d => d[attrib_pair[0]]))
    .range([0 + padding, size - padding])

  let y = d3
    .scaleLinear()
    .domain(d3.extent(data, d => d[attrib_pair[1]]))
    .range([size - padding, 0 + padding])

  let xAxis = d3.axisBottom(x).ticks(5)
  let yAxis = d3.axisLeft(y).ticks(5)
  d3.select(this)
    .append('g')
    .attr('transform', `translate(0,${size - padding})`)
    .call(xAxis)
  d3.select(this)
    .append('g')
    .attr('transform', `translate(${padding},0)`)
    .call(yAxis)
  // adding axis labels below the scatterplot
  d3.select(this)
    .append('text')
    .attr('x', size / 2)
    .attr('y', size)
    .attr('text-anchor', 'middle')
    .text(attrib_pair[0])
  d3.select(this)
    .append('text')
    .attr('x', -size / 2)
    .attr('y', -padding / 2 + 33)
    .attr('text-anchor', 'middle')
    .attr('transform', 'rotate(-90)')
    .text(attrib_pair[1])
})

//////////////////////////////////////////////////////////////////////////////
// Function to make the scatteplots

function makeScatterplot (selection, attrib_pair) {
  let x = d3
    .scaleLinear()
    .domain(d3.extent(data, d => d[attrib_pair[0]]))
    .range([0 + padding, size - padding])

  let y = d3
    .scaleLinear()
    .domain(d3.extent(data, d => d[attrib_pair[1]]))
    .range([size - padding, 0 + padding])
  let color
  if (data == iris) {
    color = d3
      .scaleOrdinal()
      .domain(['setosa', 'versicolor', 'virginica'])
      .range(['#86BD8B', '#B9B4D2', '#F9C082'])
  } else {
    // color based on gpa
    let [dMin, dMax] = d3.extent(data, d => d.GPA)
    color = d3
      .scaleLinear()
      .domain([dMin, dMax])
      .range(['#FF0000', '#0000FF'])
  }

  let brush = d3
    .brush()
    .extent([
      [0, 0],
      [size, size]
    ])
    .on('start', updateBrush())
    .on('brush', updateBrush())
    // on brush "end" the colors go back to normal
    .on('end', updateBrush())

  let circles = selection
    .selectAll('circle')
    .data(data)
    .enter()
    .append('circle')
    .attr('cx', d => x(d[attrib_pair[0]]))
    .attr('cy', d => y(d[attrib_pair[1]]))
    .attr('r', 2)
    .attr('fill', d => color(d.species ? d.species : d.GPA))
    .attr('opacity', 0.5)

  selection
    .append('g')
    .attr('class', 'brush')
    .call(brush)
}

//////////////////////////////////////////////////////////////////////////////
let empty = false
// Function to for the brush interactions
function updateBrush () {
  return function (event, d) {
    if (event.selection != null) {
      // adding the brush to the dictionary
      dict[d[0] + '_' + d[1]] = event.selection
      empty = false
    } else {
      // removing the brush from the dictionary
      delete dict[d[0] + '_' + d[1]]
    }
    // check if dict is empty
    if (Object.keys(dict).length === 0) {
      empty = true
    }
    onBrush()
  }
}

function onBrush () {
  if (empty) {
    let color
    if (data == iris) {
      color = d3
        .scaleOrdinal()
        .domain(['setosa', 'versicolor', 'virginica'])
        .range(['#86BD8B', '#B9B4D2', '#F9C082'])
    } else {
      // color based on gpa
      // check the type of gpa in the data
      let [dMin, dMax] = d3.extent(data, d => d.GPA)
      //console.log(dMin, dMax)

      //console.log(dMin, dMax)
      color = d3
        .scaleLinear()
        .domain([dMin, dMax])
        .range(['#FF0000', '#0000FF'])
    }
  } else {
    function isSelected (d) {
      let selectedcircles = 0
      // for each attribute pair, check if the circle is in the selected range
      for (let key in dict) {
        let attrib_pair = key.split('_')
        let x = d3
          .scaleLinear()
          .domain(d3.extent(data, d => d[attrib_pair[0]]))
          .range([0 + padding, size - padding])
        let y = d3
          .scaleLinear()
          .domain(d3.extent(data, d => d[attrib_pair[1]]))
          .range([size - padding, 0 + padding])
        let x0 = dict[key][0][0]
        let x1 = dict[key][1][0]
        let y0 = dict[key][0][1]
        let y1 = dict[key][1][1]

        if (
          x(d[attrib_pair[0]]) >= x0 &&
          x(d[attrib_pair[0]]) <= x1 &&
          y(d[attrib_pair[1]]) >= y0 &&
          y(d[attrib_pair[1]]) <= y1
        ) {
          selectedcircles++
        }
      }
      // if the circle is in all the selected ranges, return true
      if (selectedcircles == Object.keys(dict).length) {
        return true
      }
    }

    let allCircles = d3.select('body').selectAll('circle')

    // filter to update the style for the selected circles
    let selected = allCircles
      .filter(isSelected)
      .attr('stroke', 'black')
      .attr('opacity', 1)

    // filter to update the style for the non-selected circles
    let notSelected = allCircles
      .filter(d => !isSelected(d))
      .attr('stroke', 'none')
      .attr('opacity', 0.5)
  }
}
