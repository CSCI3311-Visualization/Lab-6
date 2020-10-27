export default function StackedAreaChart(container) {
  // initialization
  // 1. Create a SVG with the margin convention
  const margin = { top: 20, right: 20, bottom: 20, left: 50 };
  const width = 650 - margin.left - margin.right;
  const height = 500 - margin.top - margin.bottom;

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
  const colorScale = d3.scaleOrdinal(d3.schemeTableau10);

  // 4. Create axes containers
  const xAxis = d3.axisBottom().scale(xScale);
  let xAxisGroup = group.append('g').attr('class', 'x-axis axis');

  const yAxis = d3.axisLeft().scale(yScale);
  let yAxisGroup = group.append('g').attr('class', 'y-axis axis');

  // Create a category label (tooltip)
  const tooltip = svg
    .append('text')
    .attr('class', 'tooltip')
    .style('font-weight', 'bold')
    .attr('x', 60)
    .attr('y', 30)
    .style('text-anchor', 'start');

  let xDomain;
  let data;
  let selected = null;

  // Clip Path
  group
    .append('clipPath')
    .attr('id', 'clip')
    .append('rect')
    .attr('width', width)
    .attr('height', height);

  const listeners = { zoomed: null };

  function on(eventname, callback) {
    listeners[eventname] = callback;
  }

  // Zoom
  const zoom = d3.zoom();
  group.call(
    zoom
      .extent([
        [0, 0],
        [width, height],
      ])
      .translateExtent([
        [0, -Infinity],
        [width, Infinity],
      ]) // we don't care the y-extent
      .scaleExtent([1, 4])
      .on('zoom', zoomed)
  );

  function zoomed({ transform }) {
    const copy = xScale.copy().domain(d3.extent(data, (d) => d.date));
    const rescaled = transform.rescaleX(copy);
    xDomain = rescaled.domain();

    update(data);
    if (listeners['zoomed']) {
      listeners['zoomed'](xDomain);
    }
  }

  function update(_data) {
    // 1. Extract category names keys for stacking
    data = _data;
    const keys = selected ? [selected] : data.columns.slice(1);

    // 2. Compute a stack from the data
    let stack = d3
      .stack()
      .keys(keys)
      .order(d3.stackOrderNone)
      .offset(d3.stackOffsetNone);

    let stackedData = stack(data);

    // 3. Update the domains of the scales
    xScale.domain(xDomain ? xDomain : d3.extent(data, (d) => d.date));
    yScale.domain([0, d3.max(stackedData, (d) => d3.max(d, (a) => a[1]))]);
    colorScale.domain(keys);

    // 4. Create a area generator
    const area = d3
      .area()
      .x((d) => xScale(d.data.date))
      .y0((d) => yScale(d[0]))
      .y1((d) => yScale(d[1]));

    // 5. Create areas based on the stack
    const areas = group.selectAll('.area').data(stackedData, (d) => d.key);

    areas
      .attr('clip-path', 'url(#clip)')
      .enter()
      .append('path')
      .attr('class', 'area')
      .attr('d', area)
      .merge(areas)
      .on('mouseover', (e, d) => {
        tooltip.text(d.key);
      })
      .on('mouseout', () => {
        tooltip.text('');
      })
      .on('click', (e, d) => {
        if (selected === d.key) {
          selected = null;
        } else {
          selected = d.key;
        }
        update(data);
      })
      .attr('fill', (d) => colorScale(d.key))
      .attr('opacity', 0.7)
      .attr('d', area);

    areas.exit().remove();

    // 6. Update axes
    xAxisGroup.attr('transform', 'translate(0,' + height + ')').call(xAxis);
    yAxisGroup.call(yAxis);
  }

  function filterByDate(range) {
    xDomain = range;
    update(data);
  }

  return {
    update,
    filterByDate,
    on,
  };
}
