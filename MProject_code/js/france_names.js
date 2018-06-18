
/*
Partie visuelle
*/
const w = 600;
const h = 600;
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

var svg = d3.select("body")
  .append("svg")
  .attr("width", w)
  .attr("height", h)
  .append("g")
    .attr("transform", "translate(" + w / 2 + "," + h / 2 + ")")



/*
Traitements dataset
*/
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
  draw(year, m);
}

function addListener(){
  /*
  div = d3.select("body").append("div").attr("class", "layer")
  div_year = div.append("div").attr("id", "div_year")
  form = div.append("form")
  in_year = form.append("input")
    .attr("type", "text").attr("name", "year_range")
    .attr("value", "1950");

  in_year.on('change', function (){
    update()
  });
  form.append("input").attr("type", "button").attr("value", "Ok")
    .on('click', function (){
      update()
    });

  form.append("input").attr("type", "radio").attr("value", "boys").attr("name", "dmc")
    .on('click', function (){
        update()
    });
  form.append("input").attr("type", "radio").attr("value", "girls").attr("name", "dmc")
    .on('click', function (){
        update()
      });
  form.append("input").attr("type", "radio").attr("value", "mixed").attr("name", "dmc")
    .on('click', function (){
        update()
      });*/

    var slider_control = d3.select("body").select("#year_range")
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

function draw(year, sex){
  year_idx = year - 1900;
  if( sex == 2){
  console.log("draw:", "year:", year, "sex:", sex, "grp:", grp_by_year_name)
    data_by_year = grp_by_year_name[year_idx].values;
  } else{
  console.log("draw:", "year:", year, "sex:", sex, "grp:", grp_by_year_sex_name)
    data_by_year = grp_by_year_sex_name[year_idx].values[sex].values;
  }

  d3.packSiblings(data_by_year);

  circles = svg.selectAll("circle")
    .data(data_by_year, function (d){ return d.key; })
  circles.exit().remove()
  circles.enter().append("circle")
  .transition()
  .ease(d3.easeCubicOut)
  .delay(function(d) {
    return Math.sqrt(d.x * d.x + d.y * d.y) * 10;
  })
    .attr("r", d => d.r)
    .attr("cx", d => d.x)
    .attr("cy", d => d.y)
    .style("fill", function(d,i) {

      if (year ==1900) {
        return "#F2DAE9";
      }else{
        return color(dataset_der[d.key][year][sex])
      }

    })

  circles.transition()
    .ease(d3.easeCubicOut)
    .delay(function(d) {
      return Math.sqrt(d.x * d.x + d.y * d.y) * 10;
    })
      .attr("r", d => d.r)
      .attr("cx", d => d.x)
      .attr("cy", d => d.y)
      .style("fill", function(d,i) {

        if (year ==1900) {
          return "#F2DAE9";
        }else{
          scalar = dataset_der[d.key][year][sex];
          console.log("color: i:", i, "scalar:", scalar, "name:", d.key, "year:", year, "sex:", sex)
          clr = color (scalar);
          return clr
        }

      })

  texts = svg.selectAll("text").data(data_by_year, function (d){ return d.key; })
  texts.exit().remove()
  texts.enter().append("text").transition()
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
  texts.transition()
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

}
