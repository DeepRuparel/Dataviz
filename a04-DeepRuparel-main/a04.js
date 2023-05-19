//
// a04.js
// CSC544 Assignment 04
// Deep Ruparel <deepruparel>@arizona.edu
//
// This file provides code for A04, providing a code for how to draw treemaps.
//

////////////////////////////////////////////////////////////////////////
// Global variables for the dataset

// HINT: Start with one of the smaller test datesets included in
// test-cases.js instead of the larger tree in flare.js
//let data = test_1;
//let data = test_2;
let data = flare

////////////////////////////////////////////////////////////////////////
// Tree related helper functions

function setTreeSize (tree) {
  if (tree.children !== undefined) {
    let size = 0
    for (let i = 0; i < tree.children.length; ++i) {
      size += setTreeSize(tree.children[i])
    }
    tree.size = size
  }
  if (tree.children === undefined) {
    // do nothing, tree.size is already defined for leaves
  }
  return tree.size
}

function setTreeCount (tree) {
  if (tree.children !== undefined) {
    let count = 0
    for (let i = 0; i < tree.children.length; ++i) {
      count += setTreeCount(tree.children[i])
    }
    tree.count = count
  }
  if (tree.children === undefined) {
    tree.count = 1
  }
  return tree.count
}

function setTreeDepth (tree, depth) {
  let maxDepth
  if (tree.children !== undefined) {
    tree.depth = depth
    maxDepth = depth

    for (let i = 0; i < tree.children.length; i++) {
      maxDepth = Math.max(maxDepth, setTreeDepth(tree.children[i], depth + 1))
    }
  }
  if (tree.children === undefined) {
    tree.depth = depth
    maxDepth = depth
  }
  return maxDepth
}

// Initialize the size, count, and depth variables within the tree
setTreeSize(data)
setTreeCount(data)
let maxDepth = setTreeDepth(data, 0)

////////////////////////////////////////////////////////////////////////
// Main Code for the Treemapping Technique

function setRectangles (rect, tree, attrFun) {
  tree.rect = rect //Set rect for current tree

  //If tree has children, set their rect variables
  if (tree.children !== undefined) {
    let cumulativeSizes = [0]
    for (let i = 0; i < tree.children.length; ++i) {
      cumulativeSizes.push(cumulativeSizes[i] + attrFun(tree.children[i]))
    }

    let rectWidth = rect.x2 - rect.x1
    let rectHeight = rect.y2 - rect.y1
    let border = 5

    // Adjust border to ensure rectangle can be seen
    // If border too thick, then rect can't be seen. Therefore, decrease border.
    if (rectWidth < 2 * border || rectHeight < 2 * border) {
      while (rectWidth < 2 * border) {
        border = border / 2
      }
      while (rectHeight < 2 * border) {
        border = border / 2
      }
    }

    //Scale for rectangles: Maps an node size to its percentage of the cumulative size
    let scale = d3
      .scaleLinear()
      .domain([0, cumulativeSizes[cumulativeSizes.length - 1]])
      .range([0, 1])

    /*
      For each child, set their rect variable. 
    */
    for (let i = 0; i < tree.children.length; ++i) {
      let newRect //rect variable for child

      // First child of the tree - use the parent's x and y coordinates
      if (i == 0) {
        if (tree.depth % 2 == 0) {
          // Splitting area vertically
          newRect = {
            x1: rect.x1 + border,
            x2:
              rect.x1 +
              border +
              scale(attrFun(tree.children[i])) * (rectWidth - 2 * border),
            y1: rect.y1 + border,
            y2: rect.y2 - border
          }
        } else {
          // Splitting area horizontally
          newRect = {
            x1: rect.x1 + border,
            x2: rect.x2 - border,
            y1: rect.y1 + border,
            y2:
              rect.y1 +
              border +
              scale(attrFun(tree.children[i])) * (rectHeight - 2 * border)
          }
        }
      }

      //Other children - use previous rect's coordinate to position new rect
      else {
        if (tree.depth % 2 == 0) {
          // Splitting area vertically
          newRect = {
            x1: tree.children[i - 1].rect.x2,
            x2:
              tree.children[i - 1].rect.x2 +
              scale(attrFun(tree.children[i])) * (rectWidth - 2 * border),
            y1: rect.y1 + border,
            y2: rect.y2 - border
          }
        } else {
          // Splitting area horizontally
          newRect = {
            x1: rect.x1 + border,
            x2: rect.x2 - border,
            y1: tree.children[i - 1].rect.y2,
            y2:
              tree.children[i - 1].rect.y2 +
              scale(attrFun(tree.children[i])) * (rectHeight - 2 * border)
          }
        }
      }
      setRectangles(newRect, tree.children[i], attrFun) // Recurse on children nodes of current node
    }
  }
}

// initialize the tree map
let winWidth = window.innerWidth
let winHeight = window.innerHeight

// compute the rectangles for each tree node
setRectangles({ x1: 0, y1: 0, x2: winWidth, y2: winHeight }, data, function (
  t
) {
  return t.size
})
setRectangleBestDirection(
  { x1: 0, y1: 0, x2: winWidth, y2: winHeight },
  data,
  function (t) {
    return t.size
  }
)

function setRectangleBestDirection (rect, tree, attrFun) {
  tree.rect = rect //Set rect for current tree

  //If tree has children, set their rect variables
  if (tree.children !== undefined) {
    let cumulativeSizes = [0]
    for (let i = 0; i < tree.children.length; ++i) {
      cumulativeSizes.push(cumulativeSizes[i] + attrFun(tree.children[i]))
    }

    let rectWidth = rect.x2 - rect.x1
    let rectHeight = rect.y2 - rect.y1
    let border = 5

    // Adjust border to ensure rectangle can be seen
    // If border too thick, then rect can't be seen. Therefore, decrease border.
    if (rectWidth < 2 * border || rectHeight < 2 * border) {
      while (rectWidth < 2 * border) {
        border = border / 2
      }
      while (rectHeight < 2 * border) {
        border = border / 2
      }
    }

    //Scale for rectangles: Maps an node size to its percentage of the cumulative size
    let scale = d3
      .scaleLinear()
      .domain([0, cumulativeSizes[cumulativeSizes.length - 1]])
      .range([0, 1])

    /*
      For each child, set their rect variable.
    */
    for (let i = 0; i < tree.children.length; ++i) {
      let newRect //rect variable for child

      // First child of the tree - use the parent's x and y coordinates
      if (i == 0) {
        if (rect.x2 - rect.x1 > rect.y2 - rect.y1) {
          // Splitting area vertically
          newRect = {
            x1: rect.x1 + border,
            x2:
              rect.x1 +
              border +
              scale(attrFun(tree.children[i])) * (rectWidth - 2 * border),
            y1: rect.y1 + border,
            y2: rect.y2 - border
          }
        } else {
          // Splitting area horizontally
          newRect = {
            x1: rect.x1 + border,
            x2: rect.x2 - border,
            y1: rect.y1 + border,
            y2:
              rect.y1 +
              border +
              scale(attrFun(tree.children[i])) * (rectHeight - 2 * border)
          }
        }
      }

      //Other children - use previous rect's coordinate to position new rect
      else {
        if (rect.x2 - rect.x1 > rect.y2 - rect.y1) {
          // Splitting area vertically
          newRect = {
            x1: tree.children[i - 1].rect.x2,
            x2:
              tree.children[i - 1].rect.x2 +
              scale(attrFun(tree.children[i])) * (rectWidth - 2 * border),
            y1: rect.y1 + border,
            y2: rect.y2 - border
          }
        } else {
          // Splitting area horizontally
          newRect = {
            x1: rect.x1 + border,
            x2: rect.x2 - border,
            y1: tree.children[i - 1].rect.y2,
            y2:
              tree.children[i - 1].rect.y2 +
              scale(attrFun(tree.children[i])) * (rectHeight - 2 * border)
          }
        }
      }
      setRectangleBestDirection(newRect, tree.children[i], attrFun) // Recurse on children nodes of current node
    }
  }
}

// make a list of all tree nodes;
function makeTreeNodeList (tree, lst) {
  lst.push(tree)
  if (tree.children !== undefined) {
    for (let i = 0; i < tree.children.length; ++i) {
      makeTreeNodeList(tree.children[i], lst)
    }
  }
}

let treeNodeList = []
makeTreeNodeList(data, treeNodeList)

function layoutrow (sizes, x, y, dx, dy) {
  // generate rects for each size in sizes
  // dx >= dy
  // they will fill up height dy, and width will be determined by their area
  let covered_area = sizes.reduce((a, b) => a + b, 0)
  let width = covered_area / dy
  let rects = []
  for (let i = 0; i < sizes.length; i++) {
    rects.push({ x: x, y: y, dx: width, dy: sizes[i] / width })
    y += sizes[i] / width
  }
  return rects
}

function layoutCol (sizes, x, y, dx, dy) {
  // generate rects for each size in sizes
  // dx < dy
  // they will fill up width dx, and height will be determined by their area
  let coveredArea = sizes.reduce((acc, val) => acc + val, 0)
  let height = coveredArea / dx
  let rects = []
  for (let size of sizes) {
    rects.push({ x: x, y: y, dx: size / height, dy: height })
    x += size / height
  }
  return rects
}

function layout (sizes, x, y, dx, dy) {
  return dx >= dy
    ? layoutrow(sizes, x, y, dx, dy)
    : layoutCol(sizes, x, y, dx, dy)
}
function leftoverRow (sizes, x, y, dx, dy) {
  // compute remaining area when dx >= dy
  let coveredArea = sizes.reduce((acc, val) => acc + val, 0)
  let width = coveredArea / dy
  let leftoverX = x + width
  let leftoverY = y
  let leftoverDx = dx - width
  let leftoverDy = dy
  return [leftoverX, leftoverY, leftoverDx, leftoverDy]
}

function leftoverCol (sizes, x, y, dx, dy) {
  // compute remaining area when dx < dy
  let coveredArea = sizes.reduce((acc, val) => acc + val, 0)
  let height = coveredArea / dx
  let leftoverX = x
  let leftoverY = y + height
  let leftoverDx = dx
  let leftoverDy = dy - height
  return [leftoverX, leftoverY, leftoverDx, leftoverDy]
}
function leftover (sizes, x, y, dx, dy) {
  return dx >= dy
    ? leftoverRow(sizes, x, y, dx, dy)
    : leftoverCol(sizes, x, y, dx, dy)
}

function worstRatio (sizes, x, y, dx, dy) {
  let rects = layout(sizes, x, y, dx, dy)
  let ratios = rects.map(rect => Math.max(rect.dx / rect.dy, rect.dy / rect.dx))
  return Math.max(...ratios)
}
function squarify (sizes, x, y, dx, dy) {
  sizes = sizes.map(size => parseFloat(size))

  if (sizes.length === 0) {
    return []
  }

  if (sizes.length === 1) {
    return layout(sizes, x, y, dx, dy)
  }

  let i = 1
  while (
    i < sizes.length &&
    worstRatio(sizes.slice(0, i), x, y, dx, dy) >=
      worstRatio(sizes.slice(0, i + 1), x, y, dx, dy)
  ) {
    i++
  }
  let current = sizes.slice(0, i)
  let remaining = sizes.slice(i)

  let [leftover_x, leftover_y, leftover_dx, leftover_dy] = leftover(
    current,
    x,
    y,
    dx,
    dy
  )
  return [
    ...layout(current, x, y, dx, dy),
    ...squarify(remaining, leftover_x, leftover_y, leftover_dx, leftover_dy)
  ]
}

function normalizeSizes (sizes, dx, dy) {
  // normalize sizes so that they fill up the area dx * dy
  let total_size = sizes.reduce((acc, size) => acc + size)
  let total_area = dx * dy
  sizes = sizes.map(size => parseFloat(size))
  sizes = sizes.map(size => (size * total_area) / total_size)
  return sizes
}
function retrunSize (node) {
  if (node.children == undefined) {
    return node.size
  } else {
    size = 0
    for (let i = 0; i < node.children.length; i++) {
      size += retrunSize(node.children[i])
    }
    return size
  }
}
function setRectanglesSquarified (node, x, y, dx, dy) {
  // set rectangles for the tree node
  // using squarified layout
  var Node = data.children
  var headNodeSize = []
  var headNodes = {}
  for (let i = 0; i < Node.length; i++) {
    // console.log(retrunSize(Node[i]));
    headNodeSize.push(retrunSize(Node[i]))
    headNodes[Node[i].name] = retrunSize(Node[i])
  }
  var headNodes = Object.fromEntries(
    Object.entries(headNodes).sort(([, valueA], [, valueB]) => valueB - valueA)
  )
  var data2
  data2 = headNodeSize.sort(function (a, b) {
    return b - a
  })

  var sizes = normalizeSizes(data2, winWidth, winHeight)
  var rects = squarify(sizes, 0, 0, winWidth, winHeight)

  var foo = {}
  var j = 0
  for (let key in headNodes) {
    foo[key] = rects[j]
    j++
  }
}

////////////////////////////////////////////////////////////////////////
// Visual Encoding portion

// d3 selection to draw the tree map
let gs = d3
  .select('#svg')
  .attr('width', winWidth)
  .attr('height', winHeight)
  .selectAll('g')
  .data(treeNodeList)
  .enter()
  .append('g')

// color scale for the tree map
let colorScale = d3
  .scaleLinear()
  .domain([0, maxDepth])
  .range(['green', 'blue'])
gs.append('rect').call(setAttrs)
// Extra credit :
let toolTip = d3.select('#tool-tip')

function setAttrs (sel) {
  sel
    .attr('width', function (treeNode) {
      return treeNode.rect.x2 - treeNode.rect.x1
    })
    .attr('height', function (treeNode) {
      return treeNode.rect.y2 - treeNode.rect.y1
    })
    .attr('x', function (treeNode) {
      return treeNode.rect.x1
    })
    .attr('y', function (treeNode) {
      return treeNode.rect.y1
    })
    .attr('fill', function (treeNode) {
      return colorScale(treeNode.depth)
    })
    .attr('stroke', function (treeNode) {
      return 'white'
    })
    .attr('title', function (treeNode) {
      return treeNode.name
    })
    // extra credit
    .on('mouseover', function (event, d) {
      d3.select('#tip-title').text(d.name)
      d3.select('#tip-depth').text(d.depth)
      d3.select('#tip-size').text(d.size)
      d3.select('#tip-count').text(d.count)

      // Determine if rectangle has children to display the count data
      if (d.name[0] === d.name[0].toLowerCase()) {
        d3.selectAll('.tip-optional').style('display', 'table-row')
      } else {
        d3.selectAll('.tip-optional').style('display', 'none')
      }
      toolTip.style('opacity', 0.9)
      toolTip
        .style('left', event.clientX + 'px')
        .style('top', event.clientY + 'px')
    })
}
// extra credit
let height = 0
if (maxDepth * 90 > 150) {
  height = 150
} else {
  height = maxDepth * 90
}
let legend = d3
  .select('#legend')
  .attr('width', winWidth)
  .attr('height', height)
  .append('g')
  .attr('transform', 'translate(0, 0)')
for (let i = 0; i <= maxDepth; i++) {
  legend
    .append('circle')
    .attr('cx', 40)
    .attr('cy', 40 + i * 30)
    .attr('r', 5)
    .attr('fill', colorScale(i))
  legend
    .append('text')
    .attr('x', 60)
    .attr('y', 45 + i * 30)
    .text('Depth : ' + i)
}

legend
  .append('text')
  .attr('x', 40)
  .attr('y', 20)
  .attr('font-size', 20)
  .text('Tree depth and the corresponding color')

////////////////////////////////////////////////////////////////////////
// Callbacks for buttons

d3.select('#size').on('click', function () {
  toolTip.style('opacity', 0)
  setRectangles({ x1: 0, x2: winWidth, y1: 0, y2: winHeight }, data, function (
    t
  ) {
    return t.size
  })
  d3.selectAll('rect')
    .transition()
    .duration(1000)
    .call(setAttrs)
})

d3.select('#count').on('click', function () {
  toolTip.style('opacity', 0)
  setRectangles({ x1: 0, x2: winWidth, y1: 0, y2: winHeight }, data, function (
    t
  ) {
    return t.count
  })
  d3.selectAll('rect')
    .transition()
    .duration(1000)
    .call(setAttrs)
})
d3.select('#best-count').on('click', function () {
  toolTip.style('opacity', 0)
  setRectangleBestDirection(
    { x1: 0, x2: winWidth, y1: 0, y2: winHeight },
    data,
    function (t) {
      return t.count
    }
  )
  d3.selectAll('rect')
    .transition()
    .duration(1000)
    .call(setAttrs)
})
d3.select('#best-size').on('click', function () {
  toolTip.style('opacity', 0)
  setRectangleBestDirection(
    { x1: 0, x2: winWidth, y1: 0, y2: winHeight },
    data,
    function (t) {
      return t.size
    }
  )
  d3.selectAll('rect')
    .transition()
    .duration(1000)
    .call(setAttrs)
})
////////////////////////////////////////////////////////////////////////

// Wasn't able to get the squarified layout to work
// I belive I am almost there but I am lacking something in the implementation
// I hope I can get some partial credit for this
d3.select('#squarified-size').on('click', function () {
  toolTip.style('opacity', 0)
  setRectanglesSquarified(
    { x1: 0, x2: winWidth, y1: 0, y2: winHeight },
    data,
    function (t) {
      return t.size
    }
  )
  d3.selectAll('rect')
    .transition()
    .duration(1000)
    .call(setAttrs)
})
d3.select('#squarified-count').on('click', function () {
  toolTip.style('opacity', 0)
  setRectanglesSquarified(
    { x1: 0, x2: winWidth, y1: 0, y2: winHeight },
    data,
    function (t) {
      return t.count
    }
  )
  d3.selectAll('rect')
    .transition()
    .duration(1000)
    .call(setAttrs)
})
