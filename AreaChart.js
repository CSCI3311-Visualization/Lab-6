function AreaChart(container) {
  // selector for a chart container e.g., ".chart"

  // initialization
  // 1. Create a SVG with the margin convention
  const margin = { top: 20, right: 20, bottom: 20, left: 50 };
  const width = 650 - margin.left - margin.right;
  const height = 100 - margin.top - margin.bottom;

  const svg = d3
    .select(container)
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom);

  const group = svg
    .append('g')
    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

  // 2. Define scales using scaleTime() and scaleLinear()
  // Only specify ranges. Domains will be set in the 'update' function
  const xScale = d3.scaleTime().range([0, width]);
  const yScale = d3.scaleLinear().range([height, 0]);

  // 3. Create a single path for the area and
  // assign a class name so that you can select it in update
  group.append('path').attr('class', 'line');

  // 4. Create axes containers
  const xAxis = d3.axisBottom().scale(xScale);
  let xAxisGroup = group.append('g').attr('class', 'x-axis axis');

  const yAxis = d3.axisLeft().scale(yScale).ticks(4);
  let yAxisGroup = group.append('g').attr('class', 'y-axis axis');

  // BRUSH
  const brush = d3
    .brushX()
    .extent([
      [0, 0],
      [width, height],
    ])
    .on('brush', brushed)
    .on('end', brushended);

  group.append('g').attr('class', 'brush').call(brush);

  function brushed(event) {
    if (event.selection) {
      listeners['brushed'](event.selection.map(xScale.invert));
    }
  }

  function brushended(event) {
    if (!event.selection) {
      if (listeners['brushed']) {
        listeners['brushed']([xScale.invert(0), xScale.invert(width)]);
      }
    }
  }

  const listeners = { brushed: null };

  function on(eventname, callback) {
    listeners[eventname] = callback;
  }

  function setBrush(timeRange) {
    group.select('.brush').call(brush.move, timeRange.map(xScale));
  }

  function update(data) {
    // update scales, encodings, axes (use the total count)
    // 1. Update the domains of the scales using the data passed to `update`
    xScale.domain(d3.extent(data, (d) => d.date));
    yScale.domain([0, d3.max(data, (d) => d.total)]);

    // Update axes and axis title
    xAxisGroup.attr('transform', 'translate(0,' + height + ')').call(xAxis);
    yAxisGroup.call(yAxis);

    const area = d3
      .area()
      .x((d) => xScale(d.date))
      .y1((d) => yScale(d.total))
      .y0(() => yScale.range()[0]);

    d3.select('.line').datum(data).attr('d', area).attr('fill', 'steelblue');
  }

  return {
    update,
    on,
    setBrush,
  };
  // ES6 shorthand for "update": update
}

export default AreaChart;
