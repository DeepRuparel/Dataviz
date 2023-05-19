//
// a06.js
// CSC544 Assignment 06
// Author : Deep Ruparel(deepruparel@arizona.edu)
//
// This implements vector field visualization techniques and relies on
// flowvis.js to perform the data loading of vector fields in VTK's .vti
// format.
//
//
//

////////////////////////////////////////////////////////////////////////
// Global variables and helper functions

//this variable will hold the vector field upon loading
let vf = null

//variables for the svg canvas
let svg = null
let width = 500
let height = 500
// Global variable for dt and number of steps
let dt = 1
let steps = 100
// the purpose of this flag is to generate a random positions for streamlines, once they have been set it is turned to false
// This allows to generte constant random positions for the streamlines so when you change the dt or number of steps the positions of streamlines don't change.
let flag = true
let dtvalue
////////////////////////////////////////////////////////////////////////
// Visual Encoding portion that handles the d3 aspects

// Function to create the d3 objects
function initializeSVG () {
  //Since we will call this function multiple times, we'll clear out the
  //svg if it exists
  if (svg != null) {
    svg.remove()
  }

  //vf.bounds will report the units of the vector field
  //use aspect ratio to update width/height
  //Initialize the SVG canvas
  let aspectRatio =
    (vf.bounds[3] - vf.bounds[2]) / (vf.bounds[1] - vf.bounds[0])
  // chnanging the width to reflect the aspect ratio
  width = height / aspectRatio
  // add padding to the left of the s
  svg = d3
    .select('#vfplot')
    .append('svg')
    .attr('width', width)
    .attr('height', height + 15)

  // scales for the x and y axis and magnitude
  // color scale

  xScale = d3
    .scaleLinear()
    .domain([vf.bounds[0], vf.bounds[1]])
    .range([25, width - 10])

  yScale = d3
    .scaleLinear()
    .domain([vf.bounds[3], vf.bounds[2]])
    .range([20, height - 20])

  colorScale = d3
    .scaleLinear()
    .domain([vf.range[0], vf.range[1]])
    .range(['blue', 'red'])

  magScale = d3
    .scaleLinear()
    .domain([vf.range[0], vf.range[1]])
    .range([5, 30])

  // appending the x and y axis
  let xAxis = d3.axisBottom(xScale)
  let yAxis = d3.axisLeft(yScale)

  svg
    .append('g')
    .attr('transform', 'translate(0,' + (height - 15) + ')')
    .call(xAxis)

  svg
    .append('g')
    .attr('transform', 'translate(25, 5)')
    .call(yAxis)
}

// Function to draw glyphs

////////////////////////////////////////////////////////////////////////
// Function to read data
let file
// Function to process the upload
function upload () {
  if (input.files.length > 0) {
    file = input.files[0]
    console.log('You chose', file.name)

    let fReader = new FileReader()
    fReader.readAsArrayBuffer(file)

    fReader.onload = function (e) {
      let fileData = fReader.result

      //load the .vti data and initialize volren
      vf = parseVTKFile(fileData)

      initializeSVG()

      //check if the user has selected glyphs or streamlines
      // similarly lso check for unifrom and random sampling
      let selection = d3.select('#sampling').property('value')
      let streamlines = d3.select('#flow').property('value')
      if (selection == 'uniform' && streamlines == 'glyph') {
        uniformGlyphs()
      } else if (selection == 'random' && streamlines == 'glyph') {
        randomGlyphs()
      } else if (selection == 'uniform' && streamlines == 'streamline') {
        renderpicker()
        uniformStreams()
      } else if (selection == 'random' && streamlines == 'streamline') {
        // seting the flag as true because it has been set false once the user generated the random positions
        // since a new file has been selected we need to set the flag to true
        flag = true
        generaterandompositions()
        renderpicker()
        randomStreams()
      }
    }
  }
}

// Attach upload process to the loadData button
var input = document.getElementById('loadData')
input.addEventListener('change', upload)

////////////////////////////////////////////////////////////////////////
// Functions to respond to selections

// Function to draw uniform glyphs
function uniformGlyphs () {
  console.log('Drawing glyphs')

  // create a list of positions where you want to draw the glyphs
  // try to do something with the dimensions of the vector field to increase i and j

  let positions = []
  for (let i = 0; i < vf.dims[0]; i = i + 8) {
    for (let j = 0; j < vf.dims[1]; j = j + 8) {
      let x = vf.bounds[0] + (i * (vf.bounds[1] - vf.bounds[0])) / vf.dims[0]
      let y = vf.bounds[2] + (j * (vf.bounds[3] - vf.bounds[2])) / vf.dims[1]
      // if x and y are out of bounds don't add them to the list
      if (
        x < vf.bounds[0] ||
        x > vf.bounds[1] ||
        y < vf.bounds[2] ||
        y > vf.bounds[3]
      ) {
        continue
      } else {
        positions.push([x, y])
      }
    }
  }
  let glyphs = svg
    .selectAll('path')
    .data(positions)
    .enter()
    .append('path')
    .attr('transform', function (d) {
      let v = vf.interpolate(d[0], d[1])
      let angle = Math.atan2(-v[1], v[0])
      return (
        'translate(' +
        xScale(d[0]) +
        ',' +
        yScale(d[1]) +
        ') rotate(' +
        (angle * 180) / Math.PI +
        ')'
      )
    })
    .attr('d', function (d) {
      let v = vf.interpolate(d[0], d[1])
      let mag = Math.sqrt(v[0] * v[0] + v[1] * v[1])
      return 'M  0, 2, 0, -2,' + magScale(mag) + ' ,' + '0' + 'Z'
    })
    .attr('fill', function (d) {
      let v = vf.interpolate(d[0], d[1])
      let mag = Math.sqrt(v[0] * v[0] + v[1] * v[1])
      return colorScale(mag)
    })
    .attr('opacity', 0.5)
}

// function to calculate rk4
function rk4Integration (start) {
  let v = vf.interpolate(start[0], start[1])
  k1x = dt * v[0]
  k1y = dt * v[1]

  v = vf.interpolate(start[0] + k1x / 2, start[1] + k1y / 2)

  let k2x = dt * v[0]
  let k2y = dt * v[1]
  v = vf.interpolate(start[0] + k2x / 2, start[1] + k2y / 2)

  let k3x = dt * v[0]
  let k3y = dt * v[1]
  v = vf.interpolate(start[0] + k3x, start[1] + k3y)

  let k4x = dt * v[0]
  let k4y = dt * v[1]
  // x position calculation
  let x = start[0] + (k1x + 2 * k2x + 2 * k3x + k4x) / 6

  // y position calculation
  let y = start[1] + (k1y + 2 * k2y + 2 * k3y + k4y) / 6

  return [x, y]
}

// Function to draw  uniform streamlines
function uniformStreams () {
  // create a list of positions where you want to draw the  streamlines
  let positions = []
  for (let i = 0; i < vf.dims[0]; i = i + 14) {
    for (let j = 0; j < vf.dims[1]; j = j + 14) {
      let x = vf.bounds[0] + (i * (vf.bounds[1] - vf.bounds[0])) / vf.dims[0]
      let y = vf.bounds[2] + (j * (vf.bounds[3] - vf.bounds[2])) / vf.dims[1]
      // if x and y are out of bounds don't add them to the list
      if (
        x < vf.bounds[0] ||
        x > vf.bounds[1] ||
        y < vf.bounds[2] ||
        y > vf.bounds[3]
      ) {
        continue
      } else {
        positions.push([x, y])
      }
    }
  }
  let output = []
  for (let i = 0; i < positions.length; i++) {
    let paths = []
    paths[0] = positions[i]
    for (let j = 1; j <= steps; j++) {
      paths[j] = rk4Integration(paths[j - 1])
    }
    //console.log(paths)
    let streamline = svg
      .append('path')
      .datum(paths)
      .attr(
        'd',
        d3
          .line()
          .x(function (d) {
            //console.log(d)
            return xScale(d[0])
          })
          .y(function (d) {
            return yScale(d[1])
          })
      )

      .attr('stroke-width', 1)
      .attr('fill', 'none')
      // .attr("stroke", "black");
      .attr('stroke', function (d) {
        let v = vf.interpolate(d[0][0], d[0][1])
        let mag = Math.sqrt(v[0] * v[0] + v[1] * v[1])
        return colorScale(mag)
      })
    let startcircle = svg
      .append('circle')
      .data(paths)
      .attr('cx', xScale(paths[0][0]))
      .attr('cy', yScale(paths[0][1]))
      .attr('r', 1)
      .attr('fill', 'black')
  }
}


// function to draw random glyphs.
function randomGlyphs () {
  // create a list of positions where you want to draw the   glyps they should be random
  let positions = []
  for (let i = 0; i < vf.dims[0]; i = i + 8) {
    for (let j = 0; j < vf.dims[1]; j = j + 8) {
      // generate random x and y positions
      let x =
        vf.bounds[0] + Math.random() * (vf.bounds[1] - vf.bounds[0])
      let y =
        vf.bounds[2] + Math.random() * (vf.bounds[3] - vf.bounds[2])
      // if x and y are out of bounds don't add them to the list
      if (
        x < vf.bounds[0] ||
        x > vf.bounds[1] ||
        y < vf.bounds[2] ||
        y > vf.bounds[3]
      ) {
        continue
      }
      // check if positions near to x and y are already in the list
      // if yes don't add them to the list
      else {
        positions.push([x, y])
      }
    }
  }
  let glyphs = svg
    .selectAll('path')
    .data(positions)
    .enter()
    .append('path')
    .attr('transform', function (d) {
      let v = vf.interpolate(d[0], d[1])
      let angle = Math.atan2(-v[1], v[0])
      return (
        'translate(' +
        xScale(d[0]) +
        ',' +
        yScale(d[1]) +
        ') rotate(' +
        (angle * 180) / Math.PI +
        ')'
      )
    })
    .attr('d', function (d) {
      let v = vf.interpolate(d[0], d[1])
      let mag = Math.sqrt(v[0] * v[0] + v[1] * v[1])
      //console.log("M 10, 10, 15, 10," + magScale(mag) +  magScale(mag) + " Z")
      return 'M  0, 2, 0, -2,' + magScale(mag) + ' ,' + '0' + 'Z'
    })
    .attr('fill', function (d) {
      let v = vf.interpolate(d[0], d[1])
      let mag = Math.sqrt(v[0] * v[0] + v[1] * v[1])
      return colorScale(mag)
    })
    .attr('opacity', 0.5)
}

/*
 This function generates random positions and stores them in the array randompositions
 I have set it such way succh that it will only intialize the array once and then it will use the same array
 The purpose behind that is if a dt and number of steps the user will be able to see the changes happening at the same positions
 */
let randompositions = []
function generaterandompositions () {
  if (flag) {
    randompositions = []
    for (let i = 0; i < vf.dims[0]; i = i + 8) {
      for (let j = 0; j < vf.dims[1]; j = j + 8) {
        // generate random x and y positions
        let x = vf.bounds[0] + Math.random() * (vf.bounds[1] - vf.bounds[0])
        let y = vf.bounds[2] + Math.random() * (vf.bounds[3] - vf.bounds[2])
        // if x and y are out of bounds don't add them to the list
        if (
          x < vf.bounds[0] ||
          x > vf.bounds[1] ||
          y < vf.bounds[2] ||
          y > vf.bounds[3]
        ) {
          continue
        } else {
          randompositions.push([x, y])
        }
      }
    }
    // because we want the random positions to be generated only once we set the flag to false
    flag = false
  }
}

function randomStreams () {
  for (let i = 0; i < randompositions.length; i++) {
    let paths = []
    paths[0] = randompositions[i]
    for (let j = 1; j < steps; j++) {
      paths[j] = rk4Integration(paths[j - 1])
    }
    //console.log(paths)
    let streamline = svg
      .append('path')
      .datum(paths)
      .attr(
        'd',
        d3
          .line()
          .x(function (d) {
            //console.log(d)
            return xScale(d[0])
          })
          .y(function (d) {
            return yScale(d[1])
          })
      )
      .attr('stroke', 'black')
      .attr('stroke-width', 0.5)
      .attr('fill', 'none')
      .attr('stroke', function (d) {
        let v = vf.interpolate(d[0][0], d[0][1])
        let mag = Math.sqrt(v[0] * v[0] + v[1] * v[1])
        return colorScale(mag)
      })
    // appnds a circle to the start of the streamline
    let startcircle = svg
      .append('circle')
      .data(paths)
      .attr('cx', xScale(paths[0][0]))
      .attr('cy', yScale(paths[0][1]))
      .attr('r', 1)
      .attr('fill', 'none')
      .attr('stroke', 'black')
  }
}

// function sets a default value for dt which is dependent on the file name and it gives the best results
function getdt () {
  if (file.name == '3cylflow.vti') {
    // defaultvalues[file.name] = 1
    dtvalue = 1
  } else if (file.name == 'bickley_jet.vti') {
    //defaultvalues[file.name] =  5;
    dtvalue = 5
  } else if (file.name == 'cosine.vti') {
    // defaultvalues[file.name] = 0.01;
    dtvalue = 0.01
  } else if (file.name == 'focus.vti') {
    // defaultvalues[file.name] = 0.01;
    dtvalue = 0.04
  } else if (file.name == 'italy.vti') {
    // defaultvalues[file.name] = 0.01;
    dtvalue = 0.01
  } else if (file.name == 'stuart_vortex.vti') {
    // defaultvalues[file.name] = 0.06;
    dtvalue = 0.01
  }
  dt = dtvalue
  return dtvalue
}
// selection 1 is whether it is uniform or random
let selection1 = 'uniform'
// selection 2 is whether it is streamlines or glyphs
let selection2 = 'glyph'
// this function fired everytime depending on the selection.
function renderthings () {
  if (selection1 === 'uniform' && selection2 === 'streamline') {
    initializeSVG()
    uniformStreams()
  } else if (selection1 === 'uniform' && selection2 === 'glyph') {
    initializeSVG()
    uniformGlyphs()
  } else if (selection1 === 'random' && selection2 === 'streamline') {
    generaterandompositions()
    initializeSVG()
    randomStreams()
  } else if (selection1 === 'random' && selection2 === 'glyph') {
    initializeSVG()
    randomGlyphs()
  }
}

// this function will render a slider for numnber of steps and dt
function renderpicker () {
  d3.select('#div2')
    .selectAll('*')
    .remove()
  let slider = d3
    .select('#div2')
    .append('text')
    .text('Control dt')
    .append('input')
    .attr('type', 'range')
    .attr('min', 0.001)
    .attr('max', 10.001)
    .attr('value', getdt())

    .attr('step', 0.001)
    .attr('id', 'slider1')
    .on('input', function () {
      // type case value to a number
      console.log(this.value)
      dt = +this.value
    })
    .on('change', function () {
      dt = +this.value
      renderthings()
    })
  // create a p tag to display the value of the slider
  let p = d3
    .select('#div2')
    .append('p')
    .attr('id', 'slider1-value')
    .style('display', 'inline')
    .style('margin-left', '10px')
    .text('Current value of dt: ' + dt + '  ')
  // update the text label
  d3.select('#slider1').on('input', function () {
    p.text('Current value of dt: ' + this.value + '  ')
  })

  let noofsteps = d3
    .select('#div2')
    .style('padding', '10px')

    .append('text')
    .text('Control no of steps')
    .append('input')
    .attr('type', 'range')
    .attr('min', 50)
    .attr('max', 200)
    .attr('value', steps)
    .attr('step', 10)
    .attr('id', 'slider2')
    .on('input', function () {
      // type case value to a number
      console.log(this.value)
      steps = +this.value
    })
    .on('change', function () {
      steps = +this.value
      renderthings()
    })

  // create a p tag to display the value of the slider
  let p2 = d3
    .select('#div2')
    .append('p')
    .attr('id', 'slider2-value')
    .style('display', 'inline')
    .style('margin-left', '10px')
    .text('Current value of steps: ' + steps + '  ')
  // update the text label
  d3.select('#slider2').on('input', function () {
    p2.text('Current value of steps: ' + this.value + '  ')
  })
}
d3.select('#sampling').on('change', function () {
  if (this.value === 'uniform') {
    selection1 = this.value
    renderthings()
  } else if (this.value === 'random') {
    selection1 = this.value
    renderthings()
  }
})

d3.select('#flow').on('change', function () {
  if (this.value === 'streamline') {
    selection2 = this.value

    renderpicker()
    renderthings()
  } else if (this.value === 'glyph') {
    d3.select('#div2')
      .selectAll('*')
      .remove()
    selection2 = this.value
    renderthings()
  }
})
