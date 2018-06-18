const w = 800;
const h = 800;
var dataset = [];
var dataset_der ={};
var dict ={} ;
var dataGrp = {};
var transitionDuration = 1000;
var year = 1900;
var sex =3;
var fileNational = "data/nat2016m.txt";
var min_padding = 0;
var max_padding = 50;

var packed_circles =[]

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
    r: (parseFloat(d.nombre)),
    sexe : +d.sexe
  };
}

var x = d3.scaleLinear()
    .domain([min_padding, max_padding])
    .range([0, w/2])
    .clamp(true);

  var slider_control = d3.select("body").select("#year_range")
  .on('change', (arguments) => {
    var slider = document.getElementById("year_range");
    year = slider.value
    document.getElementById("div_year").innerHTML = year
    drawBubble(year, sex)
  })
  .on('input', (arguments) => {
    var slider = document.getElementById("year_range");
    year = slider.value
    document.getElementById("div_year").innerHTML = year

  })

//var slider = svgContainer.append("g")
//    .attr("class", "slider")
//    .attr("transform", "translate(" + margin.left + "," + height / 2 + ")");


// import data and calculate appropriate circle scale
d3.tsv(fileNational, rowNatConverter, function(error, data) {
  if (error) {
    console.log("error:",error);
  } else {
    console.log("data:",data);
  }

  dataset = data;

  for (i = 0; i < dataset.length; i++) {
    //console.log("coucou")

    //dataset_der.push(obj)
    if (! (dataset[i].preusuel in dict)){
      dict[dataset[i].preusuel] ={}
      //console.log("coucou")
    }

    ////dic[dataset[i].preusuel] = [dataset[i].annais]

    if( ! (dataset[i].annais in dict[dataset[i].preusuel])) {
      dict[dataset[i].preusuel][dataset[i].annais] = {}

    }
    //console.log(dict[dataset[i].preusuel])
    //console.log(dict[dataset[i].preusuel][dataset[i].annais])
    dict[dataset[i].preusuel][dataset[i].annais][dataset[i].sexe]  =  dataset[i].nombre

    //try {
      //dict[dataset[i].preusuel][dataset[i].annais][dataset[i].sexe]  =  dataset[i].nombre
    //}
    //catch (TypeError){
     // console.log([dataset[i].annais])
    //}



    //// [dataset[i].sex]
  }

  for(var name in dict) {
    if (!(name in dataset_der)){
        dataset_der[name]={}
      }
    for (y = 1901; y < 2016; y++) {
      if (!(y in dataset_der)){
        dataset_der[name][y]={}
      }
      for (s in dict[name][y]){

        try {
          dataset_der[name][y][s] = (dict[name][y][s] - dict[name][y-1][s])/(dict[name][y-1][s])

        }
        catch (TypeError){

        }


      }


    }

  }
  dict = null;
  //dict["MARIE"]
  //dataset_der["MARIE"]
  //dict["ZULME"]["1900"]["2"]




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
      // dirty: space loss: tuned at 0.8
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
  // initialize rendering
  drawBubble(1900,sex);
});

var color = d3.scaleLinear()
  .domain([-2,-1.5, -1, -0.5, 0, 0.5,2])
  .range([  "#14BEDF","#72CBDD","#B6D7DE","#B6D7DE","#E3C5D8","#D371AE ","#92035C"])
  .interpolate(d3.interpolateHcl);



var inputElems = svgContainer.selectAll("input");
//inputElems.on("change", function(d, i) {   // ** Highlight Change **
     // do something here
     //print("coucou")
//});




//function tick(e) {
//  force.alpha(0.1)

//  circle
//    .each(gravity(e.alpha))
//    .each(collide(.5))
//    .attr("cx", function(d) {
//      return d.x;
//    })
//    .attr("cy", function(d) {
//      return d.y;
//    });
//}

function drawBubble(year,sex) {
  var circles = d3.packSiblings(dataset.filter(
    function(d) {
      if (sex == 3){
        return d.annais == year
      }else{
        return d.annais == year && d.sexe == sex;
      }
    }));





  //.filter(function(d) {
  //  return -500 < d.x && d.x < 500 && -500 < d.y && d.y < 500;
  //})
  //var scaleRadius = d3.scaleSqrt()
  //  .domain([0, max_population])
  //  .range([0.1, radius]);

  var node = svgContainer
    .selectAll("g")
    .data(circles, function(d) { // ???????????????? data ?
      return d.sexe + d.preusuel;
    });

  // remove a bubble
  node.exit().selectAll("text").transition().delay(transitionDuration).remove();  // je ne comprends pas lesquelles on remove ? toutes ?
  node.exit().selectAll("circle").transition().duration(transitionDuration).attr("r", 0);
  node.exit().transition().delay(transitionDuration).remove();

  // update a bubble
  node.select("circle")
    .transition().duration(transitionDuration)
    .attr("r", function(d) {
      return d.r;
    })
    .attr("cx", function(d) {
      return d.x;  // ?????????????
    })
    .attr("cy", function(d) {
      return d.y;
    })
    .style("fill", function(d,i) {

      if (year ==1900) {
        return "#F2DAE9";
      }else{
        return color (dataset_der[d.preusuel][year][d.sexe])
      }

    })
    node.select("title").text(function(d) {
      try {
        return d.preusuel + " : " + d.nombre + "\n evolution compared to the previous year : " + dataset_der[d.preusuel][d.annais][d.sexe].toFixed(2) ;
      }
      catch(TypeError){
        console.log(d.preusuel)
        console.log(d.annais)
        console.log(d.sexe)


        return d.preusuel + " : " + d.nombre  ;
      }

    })

    //.call(force.drag);

  node.select("text")
    .transition().duration(transitionDuration)
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

  // add a new bubble (none if modified)
  var groupBubbles = node
    .enter()
    .append("g")
    .attr("transform", "translate(" + w / 2 + "," + h / 2 + ")")


  // only for new circles
  groupBubbles.append("circle")
    .style("fill", function(d,i) {
      //console.log(d.annais)
      //console.log(d.preusuel)
      //console.log(prev_year[i])  /// ça marche pas :/
      //console.log(dataset_der[d.preusuel][d.annais])
      //console.log(dataset_der["MARIE"]["1901"])

      //return color(d.angle );
      if (year ==1900) {
        return "#F2DAE9";
      }else{
        return color (dataset_der[d.preusuel][year][d.sexe])
      }

    })
    .attr("cx", function(d) {
      d.angle = Math.atan2(d.y, d.x)
      return Math.cos(d.angle) * (w / Math.SQRT2 + 30);
    })
    .attr("cy", function(d) {
      return Math.sin(d.angle) * (h / Math.SQRT2 + 30);
    })
    .attr("r", function(d) {
      return d.r //- 0.25
    })
    .transition()
    .ease(d3.easeCubicOut)
    .delay(function(d) {
      return Math.sqrt(d.x * d.x + d.y * d.y) * 10;
    })
    .duration(transitionDuration)
    .attr("cx", function(d) {
      return d.x;
    })
    .attr("cy", function(d) {
      return d.y;
    })
  //.call(force.drag)
  ;

  //title
  groupBubbles.append("title")
    .text(function(d) {
      try {
        return d.preusuel + " : " + d.nombre + "\n evolution compared to the previous year : " + dataset_der[d.preusuel][d.annais][d.sexe].toFixed(2) ;
      }
      catch(TypeError){
        console.log(d.preusuel)
        console.log(d.annais)
        console.log(d.sexe)


        return d.preusuel + " : " + d.nombre  ;
      }

    })

  groupBubbles.append("text")
    .attr("x", function(d) {
      return Math.cos(d.angle) * (w / Math.SQRT2 + 30);
    })
    .attr("y", function(d) {
      return Math.sin(d.angle) * (h / Math.SQRT2 + 30);
    })
    .style("text-anchor", "middle")
    .style("font-size", function(d) {
      // quick and dirty : to refactor
      return Math.round(d.r / 3) + 'px';
    })
    .text(function(d) {
      return d.preusuel;
    })
    .transition()
    .ease(d3.easeCubicOut)
    .delay(function(d) {
      return Math.sqrt(d.x * d.x + d.y * d.y) * 10;
    })
    .duration(transitionDuration)
    .attr("x", function(d) {
      return d.x;
    })
    .attr("y", function(d) {
      return d.y;
    });

}


function gender() {
  var m=0;
  for (i=0;i<6;i++) {
    if (document.forms.gender_form.dmc[i].checked==true) {
      m=i;
      //alert("C'est le choix "+document.forms.ee.dmc[i].value+" qui est sélectionné");
      console.log(Number(i+1))
      drawBubble(year,Number(i+1));
      break;
    }
  }
}


var prev_year = (dataset.filter(
    function(d) {
      if (sex == 3){
        return d.annais == year -1
      }else{
        return d.annais == year -1 && d.sexe == sex;
      }


}));
