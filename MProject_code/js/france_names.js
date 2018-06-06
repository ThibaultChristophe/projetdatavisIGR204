const w = 1600;
const h = 800;
var dataset = [];
var dataSum = {}
size = Math.max(w, h);

var svgContainer = d3.select("body")
  .append("svg")
  .attr("width", w)
  .attr("height", h)
//  .attr("class", "bubble");

// convert data
var rowNatConverter = function(d) {
  return {
    sexe: parseFloat(d.sexe),
    preusuel: d.preusuel,
    // annais: new Date(+d.annais, 0, 1),
    annais: +d.annais,
    nombre: parseFloat(d.nombre),
    r: (parseFloat(d.nombre))
  };
}

// import data
d3.tsv("data/nat2016.txt", rowNatConverter, function(error, data) {
  if (error) {
    console.log(error);
  } else {
    console.log(data);
  }

  dataset = data;

  //get population per year
  var datagrp = d3.nest()
  .key(function(d) { return d.annais;})
  .rollup(function(d) {
   return d3.sum(d, function(g) {return g.r; });
  }).entries(data);

  //dictionary
  for (var i = 0; i < datagrp.length; i++)
  {
    dataSum[datagrp[i].key] = datagrp[i].value;
  }

  //rescale radius within each year (sum = 1 / year)
  for (var i = 0; i < data.length; i++)
  {
    data[i].r = (data[i].r * 10 * h) / dataSum[data[i].annais];
  }


  var color = d3.scaleLinear()
    .domain([15, 35, 132])
    .range(["#d7191c", "#ffffbf", "#2c7bb6"])
    .interpolate(d3.interpolateHcl);


  var circles = d3.packSiblings(dataset.filter(
    function(d) {
      return d.annais == 1990;
    }));


  //.filter(function(d) {
  //  return -500 < d.x && d.x < 500 && -500 < d.y && d.y < 500;
  //})
  //var scaleRadius = d3.scaleSqrt()
  //  .domain([0, max_population])
  //  .range([0.1, radius]);

  var groupBubbles = svgContainer.append("g")
    .selectAll("circle")
    .data(circles)
    .enter()
    .append("g")
    .attr("transform", "translate(800,400)")

  var bubbles = groupBubbles.append("circle")
    .style("fill", function(d) {
      return color(d.angle = Math.atan2(d.y, d.x));
    })
    .attr("cx", function(d) {
      return Math.cos(d.angle) * (w / Math.SQRT2 + 30);
    })
    .attr("cy", function(d) {
      return Math.sin(d.angle) * (h / Math.SQRT2 + 30);
    })
    //.attr("r", function(d) {
    //  return d.r - 0.25;
    .attr("r", function(d) {
      return d.r - 0.25
    })
  //.attr("fill", "blue")


  //title
  groupBubbles.append("title")
    //  .attr("text-anchor", "middle")
    .text(function(d) {
      return d.preusuel;
    })

  groupBubbles.append("text")
        .attr("dy", ".3em")
        .style("text-anchor", "middle")
    .text(function(d) {
      return d.preusuel;
    });

  bubbles.transition()
    .ease(d3.easeCubicOut)
    .delay(function(d) {
      return Math.sqrt(d.x * d.x + d.y * d.y) * 10;
    })
    .duration(1000)
    .attr("cx", function(d) {
      return d.x;
    })
    .attr("cy", function(d) {
      return d.y;
    });
});



//  var bubbles = svgContainer.append("g")
//    .attr("transform", "translate(0,0)")
//    .selectAll(".bubble")
//    .data(dataset.filter(function(d) {
//      return d.annais.getFullYear() == 1979;
//    }))
//    .enter();

//create the bubbles
//  bubbles.append("circle")
//    .attr("r", function(d) {
//      return d.nombre;
//    })
//    .attr("cx", function(d) {
//      return d.x;
//    })
//    .attr("cy", function(d) {
//      return d.y;
//    })
//    .style("fill", function(d) {
//      return color(d.value);
//    });

//format the text for each bubble
//  bubbles.append("text")
//    .attr("x", function(d) {
//      return d.x;
//    })
//    .attr("y", function(d) {
//      return d.y + 5;
//    })
//    .attr("text-anchor", "middle")
//    .text(function(d) {
//      return d["Fruit"];
//    })
//    .style({
//      "fill": "white",
//      "font-family": "Helvetica Neue, Helvetica, Arial, san-serif",
//      "font-size": "12px"
//    });

//})
