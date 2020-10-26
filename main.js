import AreaChart from './AreaChart.js';
import StackedAreaChart from './StackedAreaChart.js'; 

d3.csv('unemployment.csv', d3.autoType).then((data) => {
  const stackChart = StackedAreaChart('.stack-container');
  stackChart.update(data);

  // Compute the total unemployment count (e.g. total 5974)
  // which will be used for the bottom area chart
  const columns = data.columns;
  for (let i = 0; i < data.length; i++) {
    let total = 0;
    for (let column of columns) {
      if (column != 'date') {
        total += data[i][column];
      }
    }
    data[i]['total'] = total;
  }

  const areaChart = AreaChart('.chart-container');
  areaChart.update(data);

  console.log('THE END');
});
