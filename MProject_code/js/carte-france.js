

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
