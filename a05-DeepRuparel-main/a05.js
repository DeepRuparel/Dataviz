//
// a05.js
// CSC544 Assignment 05
// Deep Ruparel <deepruparel>@arizona.edu
//
// This file provides code for A05, providing a code for how to render tranfer functions.
//

//////////////////////////////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////
// Global variables and helper functions
// Extra credits: 1. Added a density graph to the transfer function
let should_plot_density_graph = true
let grayArray = [...Array(80).keys()]
// colorTF and opacityTF store a list of transfer function control
// points.  Each element should be [k, val] where k is a the scalar
// position and val is either a d3.rgb or opacity in [0,1]
let colorTF = []
let opacityTF = []

// D3 layout variables
let size = 500
let svg = null

// Variables for the scales
let xScale = null
let yScale = null
let colorScale = null

let shift = 50
let padding = 10
let xAxis //x-axis
let yAxis //y-axis
let line //line
////////////////////////////////////////////////////////////////////////
// Visual Encoding portion that handles the d3 aspects

// Function to create the d3 objects
function initializeTFunc () {
  svg = d3
    .select('#tfunc')
    .append('svg')
    .attr('width', size)
    .attr('height', size)
  // plots the density graph
  if (should_plot_density_graph) {
    svg
      .append('g')
      .attr('transform', 'scale(1,-1)')
      .attr('id', 'density_bar')
      .selectAll('rect')
      .data(grayArray)
      .enter()
      .append('rect')
      .attr('x', d => d * 5 + shift)
      .attr('y', -450)
      .attr('width', 5)
      .attr('height', 0)
      .attr('opacity', 0.5)
      .attr('fill', 'lightgray')
  }

  //xScale
  xScale = d3
    .scaleLinear()
    .domain([dataRange[0], dataRange[1]])
    .range([shift, size - padding])

  xAxis = svg
    .append('g')
    .attr('id', 'x-axis')
    .attr('transform', 'translate(0, ' + (size - shift) + ')')
    .call(d3.axisBottom(xScale))
  // yScale
  yScale = d3
    .scaleLinear()
    .domain([0, 1])
    .range([size - shift, padding])

  yAxis = svg
    .append('g')
    .attr('id', 'y-axis')
    .attr('transform', 'translate(' + shift + ',0)')
    .call(d3.axisLeft(yScale))

  line = svg.append('path').attr('id', 'line')

  let drag = d3
    .drag()
    .on('start', dragstarted)
    .on('drag', dragged)
    .on('end', dragended)

  svg
    .append('g')
    .attr('class', 'points')
    .selectAll('circle')
    .data(opacityTF)
    .enter()
    .append('circle')
    .attr('index', (d, i) => i)
    .style('cursor', 'pointer')
    .call(drag)

  // the bottom colorscale
  let width = (size - padding - shift) / colorTF.length
  svg
    .append('g')
    .attr('id', 'color_bar')
    .selectAll('rect')
    .data(colorTF)
    .enter()
    .append('rect')
    .attr('transform', 'translate(50, 470)')
    .attr('x', (d, i) => i * width)
    .attr('width', width)
    .attr('height', 25)
    .attr('fill', d => d3.rgb(d[1]))

  updateTFunc()
}

// Call this function whenever a new dataset is loaded or whenever
// colorTF and opacityTF change

function updateTFunc () {
  //Update xScale
  xScale = d3
    .scaleLinear()
    .domain([dataRange[0], dataRange[1]])
    .range([shift, size - 40])

  //Update x-axis
  xAxis = svg
    .select('#x-axis')
    .attr('transform', function () {
      return 'translate(0, ' + (size - 50) + ')'
    })
    .call(d3.axisBottom(xScale))

  d3.select('.points')
    .selectAll('circle')
    .data(opacityTF)
    .attr('cx', d => xScale(d[0]))
    .attr('cy', d => yScale(d[1]))
    .attr('r', 5)
    .attr('stroke', 'black')
    .attr('fill', (d, i) => {
      return colorScale(opacityTF[i][0])
    })

  //Update line
  path = d3
    .line()
    .x(d => xScale(d[0]))
    .y(d => yScale(d[1]))

  //Update opacity
  line = d3
    .select('#line')
    .datum(opacityTF)
    .attr('fill', 'none')
    .attr('stroke', 'black')
    .attr('d', path)

  let width = (size - padding - shift) / colorTF.length
  // removing and creating the color bar
  svg
    .select('#color_bar')
    .selectAll('rect')
    .remove()
  svg
    .select('#color_bar')
    .selectAll('rect')
    .data(colorTF)
    .enter()
    .append('rect')
    .attr('transform', 'translate(50, 470)')
    .attr('x', (d, i) => i * width)
    .attr('width', width)
    .attr('height', 25)
    .attr('fill', d => d3.rgb(d[1]))
}

// To start, let's reset the TFs and then initialize the d3 SVG canvas
// to draw the default transfer function

resetTFs()
initializeTFunc()

////////////////////////////////////////////////////////////////////////
// Interaction callbacks

let selected = null

// Called when mouse down
function dragstarted (event, d) {
  selected = parseInt(d3.select(this).attr('index'))
}

function dragged (event, d) {
  if (selected != null) {
    let pos = []
    pos[0] = xScale.invert(event.x)
    pos[1] = yScale.invert(event.y)

    //Check for invalid y-values first
    //y-coordinate < 0
    if (pos[1] < 0) {
      pos[1] = 0
    }
    //y-coordinate > 1
    else if (pos[1] > 1) {
      pos[1] = 1
    }

    //making sure points 2,3,4,5 do ot cross points to the right and left
    if (selected != opacityTF.length - 1) {
      if (pos[0] >= opacityTF[selected + 1][0]) {
        pos[0] = opacityTF[selected + 1][0]
      }
    }

    if (selected != 0) {
      if (pos[0] <= opacityTF[selected - 1][0]) {
        pos[0] = opacityTF[selected - 1][0]
      }
    }

    // only 2,3,4,5 can be moved
    if (selected != 0 && selected != opacityTF.length - 1) {
      opacityTF[selected] = pos
    } else {
      opacityTF[selected][1] = pos[1]
    }

    //update TF window
    updateTFunc()

    //update volume renderer
    updateVR(colorTF, opacityTF)
  }
}

// Called when mouse up
function dragended () {
  selected = null
}

////////////////////////////////////////////////////////////////////////
// Function to read data

// Function to process the upload

function upload () {
  if (input.files.length > 0) {
    let file = input.files[0]
    console.log('You chose', file.name)

    let fReader = new FileReader()
    fReader.readAsArrayBuffer(file)

    fReader.onload = function (e) {
      let fileData = fReader.result

      //load the .vti data and initialize volren
      initializeVR(fileData)

      let densityScale = d3
        .scaleLinear()
        .domain(dataRange)
        .range([0, 80])

      grayArray = [...Array(80).keys()]
      scalarData.forEach(function (v) {
        if (v != 0)
          // zero values are ignored, otherwise the density graph would be one single bar
          grayArray[Math.round(densityScale(v))]++
      })
      let maxDensity = d3.max(grayArray)
      if (should_plot_density_graph) {
        //console.log("plotting density graph")
        d3.select('#density_bar')
          .selectAll('rect')
          .data(grayArray)
          .attr('height', d => (400 * d) / maxDensity)
      }

      resetTFs()

      //Update the tfunc
      updateTFunc()

      //update the TFs with the volren
      updateVR(colorTF, opacityTF, false)
    }
  }
}

// Attaching upload process to the loadData button
var input = document.getElementById('loadData')
input.addEventListener('change', upload)

////////////////////////////////////////////////////////////////////////
// Functions to respond to buttons that switch color TFs

function resetTFs () {
  makeSequential()
  makeOpacity()
}

// Make a default opacity TF
function makeOpacity () {
  opacityTF = [] //OpacityTF - list of tuples

  //Iteratively add 6 values into opacityTF
  for (i = 0; i < 6; i++) {
    let v = ((dataRange[1] - dataRange[0]) * i) / 5
    opacityTF.push([dataRange[0] + v, i / 5])
  }
}

// Make a sequential color TF
function makeSequential () {
  //Creating a sequential color scale
  colorScale = d3
    .scaleLinear()
    .domain([dataRange[0], dataRange[1]])
    .range([d3.schemeBlues[9][1], d3.schemeBlues[9][7]])

  colorTF = []
  //List of points
  for (i = 0; i < 50; i++) {
    let v = ((dataRange[1] - dataRange[0]) * i) / 50
    colorTF.push([dataRange[0] + v, d3.rgb(colorScale(dataRange[0] + v))])
  }
}

function makeDiverging () {
  //Creating a diverging color scale
  colorScale = d3
    .scaleLinear()
    .domain([dataRange[0], (dataRange[0] + dataRange[1]) / 2, dataRange[1]])
    .range(['blue', 'white', 'red'])
  

  colorTF = []
  //List of points
  for (i = 0; i < 50; i++) {
    let v = ((dataRange[1] - dataRange[0]) * i) / 50
    colorTF.push([dataRange[0] + v, d3.rgb(colorScale(dataRange[0] + v))])
  }
}

function makeCategorical () {
  //Creating a categorical color scale
  colorScale = d3
    .scaleQuantize()
    .domain([dataRange[0], dataRange[1]])
    .range(d3.schemeCategory10)

  colorTF = []
  //List of points
  for (i = 0; i < 10; i++) {
    let v = ((dataRange[1] - dataRange[0]) * i) / 9
    colorTF.push([dataRange[0] + v, d3.rgb(colorScale(dataRange[0] + v))])
  }
}

// Configure callbacks for each button
d3.select('#sequential').on('click', function () {
  makeSequential()
  updateTFunc()
  updateVR(colorTF, opacityTF, false)
})

d3.select('#diverging').on('click', function () {
  makeDiverging()
  updateTFunc()
  updateVR(colorTF, opacityTF, false)
})

d3.select('#categorical').on('click', function () {
  makeCategorical()
  updateTFunc()
  updateVR(colorTF, opacityTF, true)
})
