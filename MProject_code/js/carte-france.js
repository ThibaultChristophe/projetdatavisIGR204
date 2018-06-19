var width = 700,
  height = 550;

var file_by_dept = "pretreatment/newCSV.csv"
var file_carte = "data/france.json"

var root_map_div = d3.select("#francemap")


var path = d3.geoPath();

// Define projection property
var projection = d3.geoConicConformal() // Lambert-93
  .center([2.454071, 46.279229]) // Center on France
  .scale(3000)
  .translate([width / 2 - 50, height / 2]);

path.projection(projection); // Assign projection to path object

// Create the DIV that will contain our map
var svg_map = root_map_div.append("svg")
  .attr("id", "svgmap")
  .attr("width", width)
  .attr("height", height)
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


  d3.csv(file_by_dept, function(csv) {
    csv = csv.filter(function(e) {
      return (e.annais == 1991) & (e.preusuel == 'PIERRE');
    });
    // Quantile scales map an input domain to a discrete range, 0...max(population) to 1...9
    var quantile = d3.scaleQuantile()
      .domain([0, Math.sqrt(d3.max(csv, function(e) {
        return +e.nombre;
      }))])
      .range(d3.range(9));


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

    var legendScale = d3.scaleSqrt()
      .domain([0, d3.max(csv, function(e) {
        return +e.nombre;
      })])
      .range([0, 9 * 20]);

    var legendAxis = svg_map.append("g")
      .attr('transform', 'translate(550, 150)')
      .call(d3.axisRight(legendScale).ticks(6));

    csv.forEach(function(e, i) {
      var tooltip = "<b>Département : </b>" + e.dpt + "<br>" + "<b>Naissances : </b>" + e.nombre + "<br>" +"<b>Proportion : </b>" + Number(Math.round((e.nombre*100/e.somme)+'e2')+'e-2') + "<b>%</b>" + "<br>";

      if (e.nombre > 0) {
        var tooltip = tooltip + "<b>Prénom : </b>" + e.preusuel + "<br>" + "<b>Année : </b>" + e.annais + "<br>";
      }
      d3.select("#d" + e.dpt)
        .attr("class", function(d) {
          return "department q" + quantile(Math.sqrt(+e.nombre)) + "-9";
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
  });

});

// Append a DIV for the tooltip
var div = root_map_div.append("div")
  .attr("class", "tooltip")
  .style("opacity", 0);


function displayMap(name, year, sex){
  console.log("displayMap: name:", name, "year: ", year, "sex:", sex);
}
