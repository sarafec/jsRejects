let chartData;

//load data
let getData = function(){
	var request = new XMLHttpRequest();
	request.open('GET', 'data.json', true);
	request.onload = function() {
	  if (request.status >= 200 && request.status < 400) {
	    var data = JSON.parse(request.responseText);
	    chartData = data;
	    return createChartEntryList(data);
	  } else {
	    // We reached our target server, but it returned an error
	    console.log("error!");

	  }
	};
	request.onerror = function() {
	  // There was a connection error of some sort
	  console.log("connection error!");
	};

	request.send();
}

//create chart list on landing
function createChartEntryList(data){
	let chartLibraryContainer = document.querySelector(".chart-list");

	for(let i = 0; i < data.length; i++){
		let tempDiv = document.createElement("li");
		tempDiv.classList.add("chart-entry");
		tempDiv.textContent = data[i].title;
		tempDiv.setAttribute("data-identifier", data[i].id);
		tempDiv.setAttribute("tabindex", 0);

		let sourceDiv = document.createElement("div");
		sourceDiv.classList.add("chart-entry-source");
		sourceDiv.textContent = "Source: " + data[i].source;

		chartLibraryContainer.appendChild(tempDiv);
		chartLibraryContainer.appendChild(sourceDiv);

	}

	//kick off initial chart
	currentChart = chartData[0].id;
	routeToChartType(chartData[0], chartData[0].type);

	chartLibraryContainer.addEventListener("click", assessChartType);
	chartLibraryContainer.addEventListener("keydown", function(evt){
		if(evt.which == 13){
			assessChartType(evt);
		}
	});

};


//kick off chart creation
function assessChartType(evt){
	//filter data to click data
	let targetData = chartData.filter(function(entry){
		return evt.target.attributes[1].nodeValue === entry.id;
	})

	//don't reload previous chart
	if(currentChart === targetData[0].id){
		console.log("hey this is the same chart");
	//reload new chart
	} else {
		currentChart = evt.target.attributes[1].nodeValue;
		let chartType = targetData[0].type;
		removeOldData();
		return routeToChartType(targetData[0], chartType);
	}
}

function removeOldData(){
	let prevChart = document.querySelector("svg");

	if(prevChart.children.length > 0){
		while(prevChart.firstChild){
			prevChart.removeChild(prevChart.firstChild);
		}
	}
}

//route to chart type
function routeToChartType(targetData, chartType){
	let metaData = targetData;
	let data = targetData.data;
	let svg = d3.select(".chart"),
		margin = {top: 10, right: 30, bottom: 20, left: 80},
		width = 600 - margin.left - margin.right,
		height = 300 - margin.top - margin.bottom,
		g = svg.append("g").attr("transform", "translate(" + margin.left + "," +margin.top + ")");

	if(chartType === "phone-line"){
		createPhoneSubChart(metaData, data, svg, margin, width, height, g);
	} else if(chartType === "birth-line"){
		createBirthCountChart(metaData, data, svg, margin, width, height, g);
	} else if(chartType === "education-bar"){
		createEdExpenditureChart(metaData, data, svg, margin, width, height, g);
	} else if(chartType === "health-bar"){
		createHealthExpenditureChart(metaData, data, svg, margin, width, height, g);		
	} else if(chartType === "refugee-bar"){
		createRefugeeStackedChart(metaData, data, svg, margin, width, height, g);
	}
};

function createPhoneSubChart(metaData, data, svg, margin, width, height, g) {
	let chartSpecificData = data;

	let max = d3.max(d3.entries(chartSpecificData), function(d) {
		return d3.max(d3.entries(d.value), function(e, i) {
			if(i === 1){
      			return d3.max(e.value, function(f) { return +f.value; });
      		}
  		});
	});

	let x = d3.scaleTime().range([0, width]),
		y = d3.scaleLinear().range([height, 0]);
		let parseYear = d3.timeParse("%Y");

	x.domain(d3.extent(chartSpecificData[0].values, function(d) { return parseYear(d.year)}))
	y.domain([0, max]);

	let line = d3.line()
		.curve(d3.curveBasis)
		.x(function(d) { return x(parseYear(d.year)); })
		.y(function(d) { return y(d.value); });


	g.append("g")
		.attr("class", "axis axis-x")
		.attr("transform", "translate(0," + height + ")")
		.style("stroke-width", ".1")
		.call(d3.axisBottom(x));

	g.append("g")
		.attr("class", "axis axis-y")
		.style("stroke-width", ".1")
		.call(d3.axisLeft(y))

	let lines = g.selectAll(".paths")
		.data(chartSpecificData)
		.enter()
		.append("g")
		.attr("class", "paths");

	lines.append("path")
		.attr("class", "line")
      	.attr("d", function(d) { return line(d.values); })
		.style("stroke", metaData.colors[0])
		.style("stroke-width", "2px")
		.style("fill", "none");

	lines.append("text")
		.datum(function(d, i) { return {id: d.country, value: d.values[d.values.length - 1]}; })
		.attr("transform", function(d, i) { return "translate(" + x(parseYear(d.value.year)) + "," + ( y(d.value.value) * 1.15) + ")"; })
		.attr("x", -42)
		.attr("y", -10)
		.attr("dy", "0.35em")
		.style("font", "11px sans-serif")
		.text(function(d) { return d.id; });
}

function createBirthCountChart(metaData, data, svg, margin, width, height, g) {
	let chartSpecificData = [];

	//normalize data
	for(let i = 0; i < data.length; i++){
		let tempEntry = {};
		tempEntry.state = data[i].state;
		tempEntry.region = data[i].region;
		tempEntry.population = data[i].population;
		tempEntry.values = [];

		let normalizedVal = data[i].population/100000;
		data[i].values.map(function(obj){
			let tempObj = {};
			tempObj["year"] = obj.year;
			tempObj["value"] = Math.floor(obj.value/normalizedVal);
			return tempEntry.values.push(tempObj);
		})
		chartSpecificData.push(tempEntry);
	}

	let max = d3.max(d3.entries(chartSpecificData), function(d) {
		return d3.max(d3.entries(d.value), function(e, i) {
			if(i === 3){
      			return d3.max(e.value, function(f) { return +f.value; });
      		}
  		});
	});

	let x = d3.scaleTime().range([0, width]),
		y = d3.scaleLinear().range([height, 0]);
		let parseYear = d3.timeParse("%Y");

	x.domain(d3.extent(chartSpecificData[0].values, function(d) { return parseYear(d.year)}))
	y.domain([0, max]);

	let line = d3.line()
		.curve(d3.curveLinear)
		.x(function(d) { return x(parseYear(d.year)); })
		.y(function(d) { return y(d.value); });


	g.append("g")
		.attr("class", "axis axis-x")
		.attr("transform", "translate(0," + height + ")")
		.style("stroke-width", ".1")
		.call(d3.axisBottom(x));

	g.append("g")
		.attr("class", "axis axis-y")
		.style("stroke-width", ".1")
		.call(d3.axisLeft(y))

	let lines = g.selectAll(".paths")
		.data(chartSpecificData)
		.enter()
		.append("g")
		.attr("class", "paths");

	lines.append("path")
		.attr("class", "line")
      	.attr("d", function(d) { return line(d.values); })
		.style("stroke", metaData.colors[0])
		.style("stroke-width", "2px")
		.style("fill", "none");
}

function createEdExpenditureChart(metaData, data, svg, margin, width, height, g){
	//define scales
	let	x = d3.scaleLinear().rangeRound([0, width]),
		y = d3.scaleBand().rangeRound([height, 0]).padding(0.2);

	//sort data
	data.sort(function(a,b) { return a.value - b.value; });

	//define domains based on data
	x.domain([0, d3.max(data, function(d) { return +d.value; })]);
	y.domain(data.map(function(d) { return d.country; }));

	//append x axis to svg
	g.append("g")
		.attr("class", "x-axis")
		.style("stroke-width", ".1")
		.attr("transform", "translate(0," + height + ")")
		.call(d3.axisBottom(x))
		.append("text")
		.attr("y", 0)
		.attr("x", 450)
		.attr("dy", "0.5em")
		.style("fill", "black")
		.text("% of GDP");

	//append y axis to svg
	g.append("g")
		.attr("class", "y-axis")
		.style("stroke-width", ".1")
		.call(d3.axisLeft(y));

	//append rects to svg based on data
	g.selectAll(".bar")
		.data(data)
		.enter()
		.append("rect")
		.attr("class", "bar")
		.attr("x", 0)
		.attr("y", function(d) { return y(d.country); })
		.attr("height", y.bandwidth())
		.attr("width", function(d) { return x(d.value); })
		.style("fill", metaData.colors[0]);
}

function createHealthExpenditureChart(metaData, data, svg, margin, width, height, g){

	let max = d3.max(d3.entries(data), function(d) {
		return d3.max(d3.entries(d.value), function(e, i) {
			if(i === 1){
      			return d3.max(e.value, function(f) { return +f.value; });
      		}
  		});
	});

	//define scales
	let x0 = d3.scaleBand().rangeRound([0, width]).paddingInner(0.1),
		x1 = d3.scaleBand().padding(0.05),
		y = d3.scaleLinear().rangeRound([height, 0]);

	let yearRange = data[0].values.map(function(d) { return d.year; });
	let countryRange = data.map(function(d) { return d.country; });

		x0.domain(countryRange);
		x1.domain(yearRange).rangeRound([0, x0.bandwidth()]);
		y.domain([0, max]);
	
		//append rects to svg
		g.append("g")
			.selectAll("g")
		.data(data)
			.enter()
			.append("g")
			.attr("transform", function(d) { return "translate(" + x0(d.country) + ",0)"; })
			.selectAll("rect")
		.data(function(d) { return yearRange.map(function(key, i) { return {key: key, value: d.values[i].value}; }); })
			.enter()
			.append("rect")
			.attr("class", "bars")
			.attr("x", function(d) { return x1(d.key); })
			.attr("y", function(d) { return y(d.value); })
			.attr("width", x1.bandwidth())
			.attr("height", function(d) { return height - y(d.value) ;})
			.attr("fill", metaData.colors[0])
			.style("opacity", ".8");

		//append x axis to svg 
		g.append("g")
			.attr("class", "x-axis")
			.attr("transform", "translate(0," + height + ")")
			.attr("stroke-width", .1)
			.call(d3.axisBottom(x0));

		//append y axis to svg 
		g.append("g")
			.attr("class", "y-axis")
			.style("stroke-width", .1)
		.call(d3.axisLeft(y))
			.append("text")
			.attr("x", 0)
			.attr("y", 0)
			.attr("dy", "0.32em")
			.attr("fill", "#000")
			.attr("transform", "rotate(-90)")
			.text("% of GDP");

		d3.selectAll(".tick > text")
			.style("transform", "translateY(5px) rotate(-25deg)");

}		

function createRefugeeStackedChart(metaData, data, svg, margin, width, height, g){
	let x = d3.scaleBand().rangeRound([0, width]).padding(0.5),
		y = d3.scaleLinear().rangeRound([height, 0]);

		//used to store regions
		let keys = Object.keys(data[0]).splice(1);
		let regionRange = data.map(function(d) { return d.region; });
		let dataVals = [];

		data.forEach(function(d, i){
			let y0 = d["Refugees"];
			let y1 = d["Internally Displaced Persons"];
			let y2 = d["Stateless Persons"];

			dataVals.push(y0);
			dataVals.push(y1);
			dataVals.push(y2);
		})

		//sort data
		data.sort(function(a, b) { return b.total - a.total; });

		//define domains based on data
		x.domain(regionRange);
		y.domain([0, d3.max(dataVals, function(d) { return +d; })]);

		//append data and rects to svg
		g.append("g")
			.selectAll("g")
			.data(d3.stack().keys(keys)(data))
			.enter()
			.append("g")
			.attr("fill", metaData.colors[0])
			.selectAll("rect")
			.data(function(d) { return d; })
			.enter()
			.append("rect")
			.attr("x", function(d) { return x(d.data.region); })
			.attr("y", function(d) { return y(d[1]); })
			.attr("height", function(d) { return y(d[0]) - y(d[1]); })
			.attr("width", x.bandwidth());

		//apppend x axis
		g.append("g")
			.attr("class", "x-axis")
			.style("stroke-width", ".1")
			.attr("transform", "translate(0," + height + ")")
			.call(d3.axisBottom(x));

		//append y axis
		g.append("g")
			.attr("class", "y-axis")
			.style("stroke-width", ".1")
			.call(d3.axisLeft(y))
			//append y axis label
			.append("text")
			.attr("x", 0)
			.attr("y", 10)
			.attr("transform", "rotate(-90)")
			.attr("dy", "0.32em")
			.attr("fill", "#000")
			.text("Number of Persons")

		let legend = g.append("g")
			.attr("font-family", "sans-serif")
			.attr("font-size", 10)
			.attr("text-anchor", "end")
			.selectAll("g")
			.data(keys.slice().reverse())
			.enter()
			.append("g")
			.attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });
		legend.append("rect")
			.attr("x", width - 19)
			.attr("width", 19)
			.attr("height", 19)
			.attr("fill", metaData.colors[0]);
		legend.append("text")
			.attr("x", width - 24)
			.attr("y", 9.5)
			.attr("dy", "0.32em")
			.text(function(d) { return d; });

}


getData();