/* déclarations bubbles */
var root_bubble_div = d3.select("#bubble")
const bubble_w = 800;
const bubble_h = 800;
Stot = bubble_w * bubble_h
b = 0.8
seuil = 0.05
var transitionDuration = 1000;

/* déclarations map */
var map_w = 300;
var map_h = 300;
var file_carte = "data/france.json"

var root_map_div = d3.select("#francemap")



/* bubble */
color = d3.scaleLinear()
  .domain([-2,-1.5, -1, -0.5, 0, 0.5,2])
  .range([  "#14BEDF","#72CBDD","#B6D7DE","#B6D7DE","#E3C5D8","#D371AE ","#92035C"])
  .interpolate(d3.interpolateHcl);

addListener()

var svgbubble = root_bubble_div
  .append("svg")
  .attr("width", bubble_w)
  .attr("height", bubble_h)
  .append("g")
    .attr("transform", "translate(" + bubble_w / 2 + "," + bubble_h / 2 + ")")


var dataset = [];
var dataset_der ={};

var fileName = "data/dpt2016.txt";

var rowNatConverter = function(d) {
  return {
    name: d.preusuel,
    year: +d.annais,
    n: parseFloat(d.nombre),
    department: d.dpt,
    sex : +d.sexe - 1
  };
}

d3.tsv(fileName, rowNatConverter, function(error, data) {
  dataset = data;
  if (error) {
    console.log("error:",error);
  } else {
    console.log("data:",data);
    initDatasets(data);
    update();
  }

});

/* map */


var path = d3.geoPath();

// Define projection property
var projection = d3.geoConicConformal() // Lambert-93
  .center([2.454071, 46.279229]) // Center on France
  .scale(3000)
  .translate([map_w / 2 - 50, map_h / 2]);

path.projection(projection); // Assign projection to path object

// Create the DIV that will contain our map
var svg_map = root_map_div.append("svg")
  .attr("id", "svgmap")
  .attr("width", map_w)
  .attr("height", map_h)
  .attr("class", "YlOrRd");

// Append the group that will contain our paths
var deps = svg_map.append("g");

// Load GeoJSON data and run a function for each entry
d3.json(file_carte, function(req, fr) {
  var features = deps
    .selectAll("path")
    .data(topojson.feature(fr, fr.objects.departements).features)
    .enter()
    .append("path")
    .attr('id', function(d) {
      return "d" + d.properties.code;
    })
    .attr("d", path);

});

// Append a DIV for the tooltip
var div = root_map_div.append("div")
  .attr("class", "tooltip")
  .style("opacity", 0);


var legend = svg_map.append('g')
  .attr('transform', 'translate(525, 150)')
  .attr('id', 'legend');

legend.selectAll('.colorbar')
  .data(d3.range(9))
  .enter().append('svg:rect')
  .attr('y', function(d) {
    return d * 20 + 'px';
  })
  .attr('height', '20px')
  .attr('width', '20px')
  .attr('x', '0px')
  .attr("class", function(d) {
    return "q" + d + "-9";
  });


/* fonctions */

function loadDerDataset(){
  dict ={} ;
  for (i = 0; i < dataset.length; i++) {
    if (! (dataset[i].name in dict)){
      dict[dataset[i].name] ={}
    }
    if( ! (dataset[i].year in dict[dataset[i].name])) {
      dict[dataset[i].name][dataset[i].year] = {}
    }
    dict[dataset[i].name][dataset[i].year][dataset[i].sex]  =  dataset[i].n
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
}

function initDatasets(data){

  loadDerDataset();

  /*
   * dpts_by_year_name
   *
   */
   dpts_by_year_name = {};
   data.forEach(function (o){
     var dpts_by_name = {}
     var dpts = []
     if(o.year in dpts_by_year_name){
       dpts_by_name = dpts_by_year_name[o.year];
     } else{
       dpts_by_year_name[o.year] = dpts_by_name;
     }
     if(o.name in dpts_by_name){
       dpts = dpts_by_name[o.name];
     } else{
       dpts_by_name[o.name] = dpts;
     }
     dpts.push({'department': o.department, 'n':o.n});
   });

  /*
   * grp_by_year: total population par année
   * par exemple
   * grp_by_year[115] == {key: "2015", value: 604872}
   *
   */
  grp_by_year = d3.nest()
  .key(function(d){return d.year}).sortKeys(d3.ascending)
  .rollup(function (d){
    return d3.sum(d, function (d){return d.n;});
  }).entries(data);

  pop_by_year = {}
  grp_by_year.forEach(function (d){
    pop_by_year[d.key] = d.value;
  });

  grp_by_year_sex = d3.nest()
  .key(function(d){return d.year}).sortKeys(d3.ascending)
  .key(function(d){return d.sex}).sortKeys(d3.ascending)
  .rollup(function (d){
    return d3.sum(d, function (d){return d.n;});
  }).entries(data);


	pop_by_year_sex = {}

grp_by_year_sex.forEach(function (o){
	obj = {}
	popM = o.values[0].value
	popF = o.values[1].value
	obj[0] = popM
	obj[1] = popF
	obj[2] = popM + popF
	pop_by_year_sex[o.key]=obj
});

  /*
   * grp_by_year_sex_name: total population par année, sex, prénom
   * par exemple: 78 -> 1978, 1 -> fille
   * grp_by_year_sex_name[78].values[1].values[7].key == 'MARIE'
   * grp_by_year_sex_name[78].values[1].values[7].value == 6065
   *
   * grp_by_year_sex_name[78].values[0].values[7] == {key: "FRÉDÉRIC", value: 10374, r: 27.856428827549315}
   *
   */
  grp_by_year_sex_name = d3.nest()
  .key(function(d){return d.year}).sortKeys(d3.ascending)
  .key(function(d){return d.sex}).sortKeys(d3.ascending)
  .key(function(d){return d.name}).sortKeys(d3.ascending)
  .rollup(function (d){
    return d3.sum(d, function (d){return d.n;});
  }).entries(data);

pop_by_year_sex_name = {}

grp_by_year_sex_name.forEach(function(o){
	by_s_by_n = {}
	by_s_by_n[0] = {}
	by_s_by_n[1] = {}
	by_s_by_n[2] = {}
	o.values[0].values.forEach(function (o2){
		by_s_by_n[0][o2.key] = o2.value
		by_s_by_n[2][o2.key] = o2.value
	});
	o.values[1].values.forEach(function (o2){
		by_s_by_n[1][o2.key] = o2.value
		by_s_by_n[2][o2.key] = o2.value
	});
	pop_by_year_sex_name[o.key] = by_s_by_n
});


  /*
  * naissances en 2015: prénom, nombre
  * grp_by_year_name[115].values[5] == {key: "LOUISE", value: 4542, r: 19.555858192315345}
  * grp_by_year_name[115].values[6] == {key: "ADAM", value: 4523, r: 19.51491249687156}
  *
   */
  grp_by_year_name = d3.nest()
  .key(function(d){return d.year}).sortKeys(d3.ascending)
  .key(function(d){return d.name}).sortKeys(d3.ascending)
  .rollup(function (d){
    return d3.sum(d, function (d){return d.n;});
  }).entries(data);

  pop_by_year_name = {}
  grp_by_year_name
  /*
   * Nombre de naissances en 2015 à Paris
   * grp_by_year_dept[115].values[74] == {key: "75", value: 37217}
   *
   */
  grp_by_year_dept = d3.nest()
    .key(function(d){return d.year}).sortKeys(d3.ascending)
    .key(function(d){return d.department}).sortKeys(d3.ascending)
    .rollup(function (d){
      return d3.sum(d, function (d){return d.n;});
    }).entries(data);

  /*
   * on convertit la structre en une map:
   *  pop_by_year_dept[2015][75] == 37217
   */
  pop_by_year_dept = {};
  grp_by_year_dept.forEach(function (o){
    var pop_by_dept = {};
    o.values.forEach(function (o2){
      pop_by_dept[o2.key] = o2.value;
    });
    pop_by_year_dept[o.key] =pop_by_dept;
  });

  grp_by_year_name.forEach(function (d){
    d.values.sort(function (a, b){
      return a.value > b.value;
    });
    sum = 0
    d.values = d.values.filter(function (elem){
      sum += elem.value
      return sum > seuil * pop_by_year[d.key];
    });
    //d.values.push({ key: 'FOURRETOUT', value: sum});

    d.values.forEach(function (d2){
      //d2.r = b * Math.sqrt(d2.value / pop_by_year[d.key] * Stot / Math.PI);
      //d2.r = b * Math.sqrt(Stot * d2.value) / (Math.PI * seuil * pop_by_year[d.key])
      d2.r = b * Math.sqrt((Stot * d2.value) / (Math.PI * seuil * pop_by_year[d.key]));
    });
  });

  grp_by_year_name.forEach(function (d){
    d.values.sort(function (a, b){
      return - a.value + b.value;
    })});

  grp_by_year_sex_name.forEach(function (d_by_y){
    d_by_y.values.forEach(function (d_by_s){
      d_by_s.values.sort(function (a, b){
        return a.value - b.value > 0;
      });
      sum = 0
      d_by_s.values = d_by_s.values.filter(function (elem){
        sum += elem.value
        return sum > seuil * pop_by_year[d_by_y.key];
      });
//      d_by_s.values.push({ key: 'FOURRETOUT', value: sum});

      d_by_s.values.forEach(function (d2){
        // d2.r = b * Math.sqrt(d2.value / pop_by_year[d_by_y.key] * Stot / Math.PI);
        //d2.r = b * Math.sqrt(Stot * d2.value) / (Math.PI * seuil * pop_by_year[d_by_y.key]);
        d2.r = b * Math.sqrt((Stot * d2.value) / (Math.PI * seuil * pop_by_year[d_by_y.key]));
        // FLE for debug
        // console.log(d2.value + ", " + d2.r)

      });
      d_by_s.values.sort(function (a, b){
        return a.value - b.value < 0;
      });
    });
  });
  grp_by_year_name.forEach(function (d){
    d.values.sort(function (a, b){
      return - a.value + b.value;
    })});


}

function update(){
  year = document.forms[0]['year_range'].value;
  var m=0;
  for (i=0;i<3;i++) {
    if (document.forms[0].dmc[i].checked==true) {
      m=i;
      break;
    }
  }
  console.log("update:", "year:", year, "sex:", m);
  drawBubble(year, m);
}

function addListener(){
    // var slider_control = root_bubble_div.select("#year_range")
    var slider_control = d3.select("#right_top").select("#year_range")
    .on('change', (arguments) => {
      var slider = document.getElementById("year_range");
      year = slider.value
      document.getElementById("div_year").innerHTML = year;
      update()
    })
    .on('input', (arguments) => {
      var slider = document.getElementById("year_range");
      year = slider.value
      update()
    })
  }

function getColor(d,i, psex) {
  if (year == 1900) {
    return "#F2DAE9";
  } else {
    if(psex ==2){
      scalar = 0
      if( 0 in dataset_der[d.key][year]){
        scalar += dataset_der[d.key][year][0];
      }
      if( 1 in dataset_der[d.key][year]){
        scalar += dataset_der[d.key][year][1];
      }
    } else{
      scalar = dataset_der[d.key][year][psex];
    }
    clr = color (scalar);
    return clr
  }
}

function getTitle(d, pyear, psex){
  // console.log("getTitle: year:", pyear, "sex:", psex, "d:", d);
  try {
    return d.key + " : " + d.value + "\n evolution compared to the previous year : " + dataset_der[d.key][pyear][psex].toFixed(2) ;
  }
  catch(TypeError){
    console.log("error getTitle:", d.key, "year: ", pyear, "sexe:", psex);
    return d.key + " : " + d.value  ;
  }
}https://aws.amazon.com/fr/architecture/icons/

function drawBubble(year, sex){
  year_idx = year - 1900;
  if( sex == 2){
    data_by_year = grp_by_year_name[year_idx].values;
  } else{
    data_by_year = grp_by_year_sex_name[year_idx].values[sex].values;
  }

  d3.packSiblings(data_by_year);

  bubbleG = svgbubble.selectAll("g").data(data_by_year, function (d){ return d.key; })
  bubbleG_new = bubbleG.enter().append("g")
    .on("click", function (d){
      displayMap(d.key, year, sex);
    });

  bubbleG_new.append("circle")
    .attr("cx", function (d) {
      return (Math.cos(Math.atan2(d.y, d.x))) * bubble_w * Math.sqrt(2);
    })
    .attr("cy", function (d) {
      return (Math.sin(Math.atan2(d.y, d.x))) * bubble_h * Math.sqrt(2);
      //return d.y * 50;
    })
    .attr("r", d => d.r)
    .style("fill", (d, i) => getColor(d, i, sex))
    .transition().duration(transitionDuration)
    .ease(d3.easeCubicOut)
    .delay(function(d) { return Math.sqrt(d.x * d.x + d.y * d.y) * 10; })
    .attr("cx", d => d.x)
    .attr("cy", d => d.y)
    .attr("r", d => d.r);

  bubbleG_new.append("text")
    .attr("x", function (d) {
      return (Math.cos(Math.atan2(d.y, d.x))) * bubble_w * Math.sqrt(2);
    })
    .attr("y", function (d) {
      return (Math.sin(Math.atan2(d.y, d.x))) * bubble_h * Math.sqrt(2);
      //return d.y * 50;
    })
    .transition().duration(transitionDuration)
    .ease(d3.easeCubicOut)
    .delay(function(d) {
      return Math.sqrt(d.x * d.x + d.y * d.y) * 10;
    })
    .attr("x", d=>d.x)
    .attr("y", d=>d.y)
    .text(d=>d.key)
    .style("text-anchor", "middle")
    .style("font-size", function(d) {
      return Math.round(d.r / 3) + 'px';
    });

  bubbleG_new.append("title").text(d=> getTitle(d, year, sex));

  bubbleG.select("circle")
    .transition().duration(transitionDuration)
    .ease(d3.easeCubicOut)
    .delay(function(d) { return Math.sqrt(d.x * d.x + d.y * d.y) * 10; })
    .attr("r", d => d.r)
    .attr("cx", d => d.x)
    .attr("cy", d => d.y)
    .style("fill", (d, i) => getColor(d, i, sex));

  bubbleG.select("text")
    .transition().duration(transitionDuration)
    .ease(d3.easeCubicOut)
    .delay(function(d) { return Math.sqrt(d.x * d.x + d.y * d.y) * 10; })
    .attr("x", d=>d.x)
    .attr("y", d=>d.y)
    .text(d=>d.key)
    .style("text-anchor", "middle")
    .style("font-size", function(d) {
      return Math.round(d.r / 3) + 'px';
    });

  bubbleG.select("title").text(d=> getTitle(d, year, sex));

  bubbleG.exit().selectAll("circle")
    .transition()//.ease(d3.easeCubicOut)
    .duration(transitionDuration)
    .attr("r", "0")

  bubbleG.exit().selectAll("text").transition().delay(transitionDuration).remove()
  bubbleG.exit().selectAll("circle").transition().delay(transitionDuration).remove()
  bubbleG.exit().selectAll("title").transition().delay(transitionDuration).remove()
  bubbleG.exit().transition().delay(transitionDuration).remove()

}


function displayMap(pname, pyear, psex){
  console.log("displayMap: name:", pname, "year: ", pyear, "sex:", psex);

  maxdpt = d3.max(dpts_by_year_name[pyear][pname], d=>d.n);
  console.log("displayMap: maxdpt:", maxdpt);

    // Quantile scales map an input domain to a discrete range, 0...max(population) to 1...9
    var quantile = d3.scaleQuantile()
      // domaine: [0...maximum], maximum sur les départements
      .domain([0, Math.sqrt(maxdpt)])
      // .domain([0, Math.sqrt(d3.max(data, function(e) {
      //   return +e.nombre;
      // }))])
      .range(d3.range(9));


    var legendScale = d3.scaleSqrt()
      .domain([0, maxdpt])
      .range([0, 9 * 20]);

    var legendAxis = svg_map.append("g")
      .attr('transform', 'translate(550, 150)')
      .call(d3.axisRight(legendScale).ticks(6));

    dpts_by_year_name[pyear][pname].forEach(function(e, i) {
      var tooltip = "<b>Département : </b>" + e.department + "<br>" + "<b>Naissances : </b>" + e.n + "<br>" +"<b>Proportion : </b>" + Number(Math.round((e.n*100/pop_by_year_dept[pyear][e.department])+'e2')+'e-2') + "<b>%</b>" + "<br>";

      if (e.n > 0) {
        var tooltip = tooltip + "<b>Prénom : </b>" + pname + "<br>" + "<b>Année : </b>" + pyear + "<br>";
      }
      d3.select("#d" + e.department)
        .attr("class", function(d) {
          return "department q" + quantile(Math.sqrt(+e.n)) + "-9";
        })
        .on("mouseover", function(d) {
          div.transition()
            .duration(200)
            .style("opacity", .9);
          div.html(tooltip)
            .style("left", (d3.event.pageX + 30) + "px")
            .style("top", (d3.event.pageY - 30) + "px");
        })
        .on("mouseout", function(d) {
          div.transition()
            .duration(500)
            .style("opacity", 0);
          div.html("")
            .style("left", "0px")
            .style("top", "0px");
        });
    });

}
