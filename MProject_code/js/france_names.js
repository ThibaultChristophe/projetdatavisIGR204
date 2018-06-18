
/*
Partie visuelle
*/
const w = 600;
const h = 600;
Stot = w * h

b = 0.8
seuil = 0.2

var transitionDuration = 1000;

var min_padding = 0;
var max_padding = 50;


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
var fileName = "data/dpt2016.txt";

var rowNatConverter = function(d) {
  return {
    name: d.preusuel,
    year: +d.annais,
    n: parseFloat(d.nombre),
    department: d.dpt,
    sex : +d.sexe
  };
}


d3.tsv(fileName, rowNatConverter, function(error, data) {
  dataset = data;
  if (error) {
    console.log("error:",error);
  } else {
    console.log("data:",data);
    initDatasets(data)
  }

});


function initDatasets(data){

  grp_by_year = d3.nest()
  .key(function(d){return d.year}).sortKeys(d3.ascending)
  .rollup(function (d){
    return d3.sum(d, function (d){return d.n;});
  }).entries(data);

  pop_by_year = {}
  grp_by_year.forEach(function (d){
    pop_by_year[d.key] = d.value;
  });

  grp_by_year_name = d3.nest()
  .key(function(d){return d.year}).sortKeys(d3.ascending)
  .key(function(d){return d.name}).sortKeys(d3.ascending)
  .rollup(function (d){
    return d3.sum(d, function (d){return d.n;});
  }).entries(data);

  // rayons_boules = grp_by_year_name.slice()
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

}

function update(){
  year = document.forms[0]['year_range'].value;
  draw(year);
}

function addListener(){
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
      });
  }

function draw(year){
  console.log("draw:", year, grp_by_year_name)
  idx = year - 1900;
  data_by_year = grp_by_year_name[idx].values

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
    .attr("class", "circle")
    .attr("r", d => d.r)
    .attr("cx", d => d.x)
    .attr("cy", d => d.y);

  circles.transition()
    .ease(d3.easeCubicOut)
    .delay(function(d) {
      return Math.sqrt(d.x * d.x + d.y * d.y) * 10;
    })
      .attr("class", "circle")
      .attr("r", d => d.r)
      .attr("cx", d => d.x)
      .attr("cy", d => d.y);

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
