

var root_bubble_div = d3.select("#bubble")

const w = 500;
const h = 500;
Stot = w * h

b = 0.8
seuil = 0.1

var transitionDuration = 1000;

var min_padding = 0;
var max_padding = 50;

color = d3.scaleLinear()
  .domain([-2,-1.5, -1, -0.5, 0, 0.5,2])
  .range([  "#14BEDF","#72CBDD","#B6D7DE","#B6D7DE","#E3C5D8","#D371AE ","#92035C"])
  .interpolate(d3.interpolateHcl);

addListener()

var svgbubble = root_bubble_div
  .append("svg")
  .attr("width", w)
  .attr("height", h)
  .append("g")
    .attr("transform", "translate(" + w / 2 + "," + h / 2 + ")")


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

  grp_by_year = d3.nest()
  .key(function(d){return d.year}).sortKeys(d3.ascending)
  .rollup(function (d){
    return d3.sum(d, function (d){return d.n;});
  }).entries(data);

  pop_by_year = {}
  grp_by_year.forEach(function (d){
    pop_by_year[d.key] = d.value;
  });

  grp_by_year_sex_name = d3.nest()
  .key(function(d){return d.year}).sortKeys(d3.ascending)
  .key(function(d){return d.sex}).sortKeys(d3.ascending)
  .key(function(d){return d.name}).sortKeys(d3.ascending)
  .rollup(function (d){
    return d3.sum(d, function (d){return d.n;});
  }).entries(data);

  grp_by_year_name = d3.nest()
  .key(function(d){return d.year}).sortKeys(d3.ascending)
  .key(function(d){return d.name}).sortKeys(d3.ascending)
  .rollup(function (d){
    return d3.sum(d, function (d){return d.n;});
  }).entries(data);

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
      d2.r = b * Math.sqrt(d2.value / pop_by_year[d.key] * Stot / Math.PI);
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
        d2.r = b * Math.sqrt(d2.value / pop_by_year[d_by_y.key] * Stot / Math.PI);
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
  draw(year, m);
}

function addListener(){
    var slider_control = root_bubble_div.select("#year_range")
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
    console.log("error getTilte:", d.key, "year: ", pyear, "sexe:", psex);
    return d.key + " : " + d.value  ;
  }
}

function draw(year, sex){
  year_idx = year - 1900;
  if( sex == 2){
    data_by_year = grp_by_year_name[year_idx].values;
  } else{
    data_by_year = grp_by_year_sex_name[year_idx].values[sex].values;
  }

  d3.packSiblings(data_by_year);

  bubbleG = svgbubble.selectAll("g").data(data_by_year, function (d){ return d.key; })
  bubbleG_new = bubbleG.enter().append("g")

  bubbleG_new.append("circle")
    .transition()
    .ease(d3.easeCubicOut)
    .delay(function(d) { return Math.sqrt(d.x * d.x + d.y * d.y) * 10; })
    .attr("r", d => d.r)
    .attr("cx", d => d.x)
    .attr("cy", d => d.y)
    .style("fill", (d, i) => getColor(d, i, sex));

  bubbleG.select("circle")
    .transition()
    .ease(d3.easeCubicOut)
    .delay(function(d) { return Math.sqrt(d.x * d.x + d.y * d.y) * 10; })
    .attr("r", d => d.r)
    .attr("cx", d => d.x)
    .attr("cy", d => d.y)
    .style("fill", (d, i) => getColor(d, i, sex));


  bubbleG_new.append("text")
    .transition()
    .ease(d3.easeCubicOut)
    .delay(function(d) {
      return Math.sqrt(d.x * d.x + d.y * d.y) * 10;
    })
    .attr("x", d=>d.x).attr("y", d=>d.y)
    .text(d=>d.key)
    .style("text-anchor", "middle")
    .style("font-size", function(d) {
      return Math.round(d.r / 3) + 'px';
    });

    bubbleG.select("text")
      .transition()
      .ease(d3.easeCubicOut)
      .delay(function(d) {
        return Math.sqrt(d.x * d.x + d.y * d.y) * 10;
      })
      .attr("x", d=>d.x).attr("y", d=>d.y)
      .text(d=>d.key)
      .style("text-anchor", "middle")
      .style("font-size", function(d) {
        return Math.round(d.r / 3) + 'px';
      });
    bubbleG.exit().selectAll("circle")
      .transition().ease(d3.easeCubicOut)
      .duration(function(d) {
        return 1/Math.sqrt(d.x * d.x + d.y * d.y) * 10;
      })
      .attr("r", "0")
      .remove()
    bubbleG.exit().selectAll("text").remove()
    bubbleG.exit().selectAll("title").remove()
    bubbleG.exit().remove()

    bubbleG_new.append("title").text(d=> getTitle(d, year, sex));
    bubbleG.select("title").text(d=> getTitle(d, year, sex));

}
