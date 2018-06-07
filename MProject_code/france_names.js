const w = 800;
const h = 800;
var dataset = [];
var dataGrp = {}

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

  var tmpDataGrp = d3.nest()
    .key(function(d) {
      return d.annais;
    })
    .rollup(function(d) {
      // sum up population for each year
      var sumPop = d3.sum(d, function(g) {
        return g.r;
      });
      // sum of the circles use the same area as a square
      // space loss: tuned at 0.8
      return 0.8 * Math.sqrt((w * h) / (Math.PI * sumPop));

    }).entries(data);

  //dictionary
  for (var i = 0; i < tmpDataGrp.length; i++) {
    dataGrp[tmpDataGrp[i].key] = tmpDataGrp[i].value;
  }

  //rescale radius
  for (var i = 0; i < data.length; i++) {
    data[i].r = dataGrp[data[i].annais] * Math.sqrt(data[i].r);
  }


  var color = d3.scaleLinear()
    .domain([15, 35, 132])
    .range(["#d7191c", "#ffffbf", "#2c7bb6"])
    .interpolate(d3.interpolateHcl);

  year = 1900;
  drawBubble(year);


  d3.select("body").append("button")
    .text(year)
    .on("click", function() {
      //select new data
      year += 1;
      drawBubble(year);
    });

  function drawBubble(year) {
    var circles = d3.packSiblings(dataset.filter(
      function(d) {
        return d.annais == year;
      }));


    //.filter(function(d) {
    //  return -500 < d.x && d.x < 500 && -500 < d.y && d.y < 500;
    //})
    //var scaleRadius = d3.scaleSqrt()
    //  .domain([0, max_population])
    //  .range([0.1, radius]);

    var node = svgContainer
      .selectAll("g")
      .data(circles, function(d) {
        return d.preusuel;
      });

    var groupBubbles = node.exit()
    .remove()
    .transition().duration(1000)
    .attr("r", 0);
    
    var groupBubbles = node
      .enter()
      .append("g")
      .attr("transform", "translate(" + w / 2 + "," + h / 2 + ")")

    //var groupBubbles = node
    //  .update()
    //  .append("g")
    //  .attr("transform", "translate(" + w / 2 + "," + h / 2 + ")")

    // only for new circles
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
        return d.r //- 0.25
      })
      .transition()
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


    //title
    groupBubbles.append("title")
      //  .attr("text-anchor", "middle")
      .text(function(d) {
        return d.preusuel + " : " + d.nombre;
      })

    groupBubbles.append("text")
      //.attr("font", "40px sans-serif")
      //.attr("font-weight", "bold")
      .attr("x", function(d) {
        return d.x;
      })
      .attr("y", function(d) {
        return d.y;
      })
      //.attr("textlength", function(d) {
      //  // quick and dirty : to refactor
      //  return Math.round(d.r) + 'px';
      //})
      //.attr("lengthAdjust", "spacingAndGlyphs")
      .style("text-anchor", "middle")

      .style("font-size", function(d) {
        // quick and dirty : to refactor
        return Math.round(d.r / 3) + 'px';
      })
      .text(function(d) {
        return d.preusuel;
      });


    node.select("circle")
      .transition().duration(1000)
      .attr("r", function(d) {
        return d.r;
      })
      .attr("cx", function(d) {
        return d.x;
      })
      .attr("cy", function(d) {
        return d.y;
      });

    node.select("text")
      .transition().duration(1000)
      .attr("x", function(d) {
        return d.x;
      })
      .attr("y", function(d) {
        return d.y;
      })
      .style("font-size", function(d) {
        // quick and dirty : to refactor
        return Math.round(d.r / 3) + 'px';
      });
  }
});
