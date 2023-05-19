//
// a03.js
// Template for CSC544 Assignment 03
//  Deep Ruparel (deepruparel@arizona.edu)
// This file provides the code for drawing parallel coordinates and also implemets the extra credit for reversing the min and max values on scale.
// 
//

////////////////////////////////////////////////////////////////////////
// Global variables for the dataset

let data = cars

// dims will store the seven numeric axes in left-to-right display order

let dims = [
  'economy (mpg)',
  'cylinders',
  'displacement (cc)',
  'power (hp)',
  'weight (lb)',
  '0-60 mph (s)',
  'year'
]

////////////////////////////////////////////////////////////////////////
// Global variables for the svg

let width = dims.length * 125
let height = 500
let padding = 50

let svg = d3
  .select('#pcplot')
  .append('svg')
  .attr('width', width + padding)
  .attr('height', height)

////////////////////////////////////////////////////////////////////////
// Initialize the x and y scales, axes, and brushes.
//  - xScale stores a mapping from dimension id to x position
//  - yScales[] stores each y scale, one per dimension id
//  - axes[] stores each axis, one per id
//  - brushes[] stores each brush, one per id
//  - brushRanges[] stores each brush's event.selection, one per id

let xScale = d3
  .scalePoint()
  .domain(dims)
  .range([padding, width - padding])

let yScales = {}
let colorScales = {}
let axes = {}
let brushes = {}
let brushRanges = {}

// colordictionary for the different colors for each dimensions.
let colordict = {
  'economy (mpg)': ['#0050FF', '#FF69B4', '#FFFF00'],
  cylinders: ['#FF2400', '#00FF60', '#00CED1'],
  'displacement (cc)': ['#7800FF', '#FF9400', '#FF00FF'],
  'power (hp)': ['#FF4500', '#87CEEB', '#00FF00'],
  'weight (lb)': ['#DC143C', '#39FF14', '#FF8C00'],
  '0-60 mph (s)': ['#4B0082', '#9B870C', '#FF7F50'],
  year: ['#008080', '#FF007F', '#FFD700']
}
// extra credit
let yScalesec = {}
let axesex = {}
// For each dimension, we will initialize a yScale, axis, brush, and
// brushRange
dims.forEach(function (dim) {
  //create a scale for each dimension
  yScales[dim] = d3
    .scaleLinear()
    .domain(
      d3.extent(data, function (datum) {
        return datum[dim]
      })
    )
    .range([height - padding, padding])

  axes[dim] = d3
    .axisLeft()
    .scale(yScales[dim])
    .ticks(10)

  let [min, max] = d3.extent(data, function (datum) {
    return datum[dim]
  })

  //console.log(dim, min,max)
  colorScales[dim] = d3
    .scaleSequential()
    .domain([min, max])
    .interpolator(
      d3.interpolate(colordict[dim][0], colordict[dim][1], colordict[dim][2])
    )

  brushes[dim] = d3.brushY().extent([
    [-10, padding],
    [10, height - padding]
  ])

  //brushes will be hooked up to their respective updateBrush functions
  brushes[dim].on('brush', updateBrush(dim)).on('end', updateBrush(dim))

  //initial brush ranges to null
  brushRanges[dim] = null

  ////////////////////////////////////////////////////////////////////////
  // Extra credit :
  yScalesec[dim] = d3
    .scaleLinear()
    .domain(
      d3.extent(data, function (datum) {
        return datum[dim]
      })
    )
    .range([padding, height - padding])

  axesex[dim] = d3
    .axisBottom()
    .scale(yScalesec[dim])
    .ticks(10)
})

current = yScales
////////////////////////////////////////////////////////////////////////
// Make the parallel coordinates plots
function path (row) {
  return d3.line()(
    dims.map(function (dimName) {
      return [xScale(dimName), current[dimName](row[dimName])]
    })
  )
}

// add the actual polylines for data elements, each with class "datapath"
svg
  .append('g')
  .selectAll('.datapath')
  .data(data)
  .enter()
  .append('path')
  .attr('class', 'datapath')
  .attr('d', path)
  .attr('fill', 'none')
  .attr('opacity', 0.75)
  .attr('stroke', d => colorScales['year'](d['year']))

// add the axis groups, each with class "axis"
svg
  .selectAll('.axis')
  .data(dims)
  .enter()
  .append('g')
  .classed('axis', true)
  .each(function (dim) {
    d3.select(this).call(d3.axisLeft().scale(yScales[dim]))
  })
  .attr('transform', function (dim) {
    return 'translate(' + xScale(dim) + ')'
  })

// add the axes labels, each with class "label"
svg
  .selectAll('.label')
  //TODO: write the rest of this, be sure to set the click function
  .data(dims)
  .enter()
  .append('text')
  .attr('class', 'label')
  .attr('x', -10)
  .attr('y', 20)
  .attr('transform', d => 'translate(' + xScale(d) + ')')
  .text(function (d) {
    return d
  })
  .on('click', onClick)
  .on('mouseover', onMouseOver)

// add the brush groups, each with class ".brush"
svg
  .selectAll('.brush')
  .data(dims)
  .enter()
  .append('g')
  .classed('brush', true)
  .each(function (dim) {
    d3.select(this).call(brushes[dim])
  })
  .attr('transform', function (dim) {
    return 'translate(' + xScale(dim) + ')'
  })
  .selectAll('rect')
  .attr('x', -10)
  .attr('width', 20)

//TODO: write the rest of this

////////////////////////////////////////////////////////////////////////
// Interaction Callbacks

// Callback for swaping axes when a text label is clicked.
function onClick (event, label) {
  // one thing we know is if the label is the end of the array,
  // we want to swap it with the second to last element
  if (label === dims[dims.length - 1]) {
    index = dims.indexOf(label)
    dims[index] = dims[index - 1]
    dims[index - 1] = label
  } else {
    index = dims.indexOf(label)
    //console.log(index)
    dims[index] = dims[index + 1]
    dims[index + 1] = label
  }
  //console.log(dims)
  // now we have the new order of dimensions in dims
  // re adjust the x - axis
  xScale = d3
    .scalePoint()
    .domain(dims)
    .range([padding, width - padding])
  // re adjust the labels
  svg
    .selectAll('.label')
    .transition()
    .duration(1000)
    .attr('transform', d => 'translate(' + xScale(d) + ')')
    .text(d => d)
  // reajust the paths
  svg
    .selectAll('.datapath')
    .data(data)
    .transition()
    .duration(1000)
    .attr('d', d => path(d))

  // readjust the axes
  svg
    .selectAll('.axis')
    .transition()
    .duration(1000)
    .each(function (dim) {
      d3.select(this).call(d3.axisLeft().scale(yScales[dim]))
    })
    .attr('transform', function (dim) {
      return 'translate(' + xScale(dim) + ')'
    })
  onBrush(current)
}

function onMouseOver (event, dim) {
  //TODO: write this
  d3.selectAll('.datapath')
    .transition()
    .duration(1000)
    .attr('stroke', d => colorScales[dim](d[dim]))
  // bold the text label of the dim that is being moused over
  d3.selectAll('.label').attr('font-weight', d => {
    if (d == dim) {
      return 'bold'
    }
  })
}

// Returns a callback function that calls onBrush() for the brush
// associated with each dimension
function updateBrush (dim) {
  return function (event) {
    brushRanges[dim] = event.selection
    onBrush(current)
  }
}

// Callback when brushing to select elements in the PC plot
function onBrush (scale) {
  //console.log("hi")

  let allLines = d3.selectAll('.datapath')
  let brushes = dims.map(d => brushRanges[d])
  // console.log(brushes)
  // taking all the brushes into variables
  brush0 = brushRanges['economy (mpg)']
  brush1 = brushRanges['cylinders']
  brush2 = brushRanges['displacement (cc)']
  brush3 = brushRanges['power (hp)']
  brush4 = brushRanges['weight (lb)']
  brush5 = brushRanges['0-60 mph (s)']
  brush6 = brushRanges['year']
  function isSelected (d) {
    x = dims[0]
    y = dims[1]
    z = dims[2]
    w = dims[3]
    t = dims[4]
    u = dims[5]
    v = dims[6]
    scale1 = scale[x](d[x])
    scale2 = scale[y](d[y])
    scale3 = scale[z](d[z])
    scale4 = scale[w](d[w])
    scale5 = scale[t](d[t])
    scale6 = scale[u](d[u])
    scale7 = scale[v](d[v])
    
    true0 = false
    true1 = false
    true2 = false
    true3 = false
    true4 = false
    true5 = false
    true6 = false
    // checking all the brushes if they are null setting true otherwise seeing if they lie inside the selected ranges.
    if (brush0 === null) {
      true0 = true
    } else {
      true0 = brush0[0] <= scale1&& scale1<= brush0[1]
    }

    if (brush1 === null) {
      true1 = true
    } else {
      true1 = brush1[0] <= scale2&& scale2<= brush1[1]
    }

    if (brush2 === null) {
      true2 = true
    } else {
      true2 = brush2[0] <= scale3&& scale3<= brush2[1]
    }

    if (brush3 === null) {
      true3 = true
    } else {
      true3 = brush3[0] <= scale4&& scale4<= brush3[1]
    }

    if (brush4 === null) {
      true4 = true
    } else {
      true4 = brush4[0] <= scale5 && scale5 <= brush4[1]
    }

    if (brush5 === null) {
      true5 = true
    } else {
      true5 = brush5[0] <= scale6 && scale6 <= brush5[1]
    }

    if (brush6 === null) {
      true6 = true
    } else {
      true6 = brush6[0] <= scale7 && scale7 <= brush6[1]
    }

    return true0 && true1 && true2 && true3 && true4 && true5 && true6
  }

  let selected = allLines.filter(isSelected).attr('opacity', 0.75)

  let notSelected = allLines
    .filter(function (d) {
      return !isSelected(d)
    })
    .attr('opacity', 0.1)
}

////////////////////////////////////////////////////////
// Extra credit :
let buttonList = [
  {
    id: 'button1',
    text: 'Invert axes',
    click: function () {
      // code to invert the axes
      current = yScalesec
      svg
        .selectAll('.axis')
        .transition()
        .duration(1000)
        .each(function (dim) {
          d3.select(this).call(d3.axisLeft().scale(yScalesec[dim]))
        })

      // reajust the paths
      svg
        .selectAll('.datapath')
        .transition()
        .duration(1000)
        .attr('d', path)

      onBrush(current)
    }
    // add some styling to the button
  },
  {
    id: 'button2',
    text: 'Reset axes',
    click: function () {
      // code to reset the axes
      current = yScales
      svg
        .selectAll('.axis')
        .transition()
        .duration(1000)
        .each(function (dim) {
          d3.select(this).call(d3.axisLeft().scale(yScales[dim]))
        })

      // reajust the paths
      svg
        .selectAll('.datapath')
        .transition()
        .duration(1000)
        .attr('d', path)

      onBrush(current)
    }
  }
]

// add button to the center of the svg

svg
  .select('#button')
  .data(buttonList)
  .enter()
  .append('button')
  .style('position', 'center')
  .attr('id', function (d) {
    return d.id
  })
  .text(function (d) {
    return d.text
  })
  .on('click', function (event, d) {
    return d.click()
  })
  .style('background-color', 'white')
  .style('border', '2px solid #4CAF50')
  .style('color', 'black')
  .style('padding', '15px 32px')
  .style('text-align', 'center')
  .style('text-decoration', 'none')
  .style('display', 'inline-block')
  .style('font-size', '16px')
  .style('margin', '4px 2px')
  .style('border-radius', '12px')
  .style('font-family', 'Arial')
