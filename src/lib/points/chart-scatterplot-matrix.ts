import { BaseType, select, Selection } from 'd3-selection';
import { ScaleBand, ScaleContinuousNumeric, scaleBand, scaleLinear } from 'd3-scale';
import { axisBottom, axisLeft, ConfigureAxisFn, dataAxis, DataAxis } from '../axis';
import {
  chart,
  debug,
  nodeToString,
  textHorizontalAttrs,
  textTitleAttrs,
  textVerticalAttrs
} from '../core';
import {
  DataChartPoint,
  dataChartPoint
} from './chart-point';
import {
  dataPointsCreation,
  DataPointsCreation,
  DataSeriesPoint,
  dataSeriesPoint,
  seriesPoint,
} from './series-point';


export interface DataChartPointMatrixEntry {
  title: string;
  dataset?: DataChartPoint;
}
export interface DataChartPointMatrix {
  dataPointCharts: DataChartPointMatrixEntry[][],
}

export interface MatrixDataset {
  title: string;
  values: number[];
}

export interface DataChartPointMatrixInput {
  datasets: MatrixDataset[];
  radius: number;
}

export function dataChartPointMatrix(data?: Partial<DataChartPointMatrixInput>): DataChartPointMatrix {
  const radius = data?.radius || 5;

  const dataPointCharts: DataChartPointMatrixEntry[][] = [];
  const datasets = data?.datasets || [];
  for (let i = 0; i < datasets.length; i++) {
    const mainValues = datasets[i].values;
    const mainMin = Math.min(...mainValues);
    const mainMax = Math.max(...mainValues);
    const mainPadding = (mainMax - mainMin) * 0.05;
    const mainScale = scaleLinear().domain([mainMin - mainPadding, mainMax + mainPadding]).nice();
    dataPointCharts.push([]);
    for (let j = 0; j < datasets.length; j++) {
      if (i === j) {
        dataPointCharts[i][j] = { title: datasets[i].title };
      } else {
        const crossValues = datasets[j].values;
        const crossMin = Math.min(...crossValues);
        const crossMax = Math.max(...crossValues);
        const crossPadding = (crossMax - crossMin) * 0.05;
        const crossScale = scaleLinear().domain([crossMin - crossPadding, crossMax + crossPadding]).nice();

        dataPointCharts[i][j] = {
          title: datasets[j].title,
          dataset: dataChartPoint({
            mainValues: datasets[i].values,
            mainScale: mainScale,
            crossValues: datasets[j].values,
            crossScale: crossScale,
            radiuses: radius,
            mainTitle: datasets[i].title,
            crossTitle: datasets[j].title
          })
        };
      }
    }
  }
  return {
    dataPointCharts,
  };
}

export function scatterMatrix<Datum extends DataChartPointMatrix, PElement extends BaseType, PDatum>(
  selection: Selection<SVGSVGElement, Datum, PElement, PDatum>
): Selection<SVGSVGElement, Datum, PElement, PDatum> {
  return chart(selection)
    .classed('chart-scatterplot-matrix', true)
    .each((d, i, g) => {

      const n = d.dataPointCharts.length;
      const gridColumns : string[] = [];
      const gridRows : string[] = [];
      for (let k = 0; k < n; k++) {
        gridColumns.push('1fr');
      }
      for (let k = 0; k < n; k++) {
        gridRows.push('1fr');
      }
      const gridTemplate = gridRows.join(' ') + ' / ' + gridColumns.join(' ');
      const s = select<SVGSVGElement, Datum>(g[i])
      .layout('display', 'grid')
      .layout('grid-template', gridTemplate)
      .attr('overflow','visible');

      for (let k = 0; k < n; k++) {
        for (let j  = 0; j < n; j++) {
          const chartContainer = s
          .append('svg')
          .classed('sub-chart', true)
          .layout('display', 'grid')
          .layout('grid-template', '1fr/1fr')
          .layout('margin','5px');

          const dataPointChart = d.dataPointCharts[k][j];
          if (dataPointChart.dataset === undefined) {
            chartContainer.append('text')
            .attr('y','50%')
            .attr('x','50%')
            .attr('dominant-baseline','middle')
            .attr('text-anchor', 'middle')
            .text(dataPointChart.title);
          } else {
            const drawArea = chartContainer
            .append('svg')
            .layout('display', 'grid')
            .layout('grid-area', '1/1')
            .classed('draw-area', true)
            .attr('overflow', 'visible')

            drawArea
            .append('rect')
            .attr('fill', 'white')
            .classed('background', true)
            .layout('grid-area', '1 / 1')

            const pointSeries = drawArea
              .append('g')
              .layout('grid-area', '1/1')
              .datum((d) => dataSeriesPoint(dataPointChart.dataset!))
              .call((s) => seriesPoint(s));
          }
        }
      }
    })
    .on('datachange.scatterMatrix', function (e, chartData) {
      debug(`data change on ${nodeToString(this)}`);
      scatterMatrixDataChange(select<SVGSVGElement, Datum>(this));
    })
    .call((s) => scatterMatrixDataChange(s));;
}

// const debouncedUpdateGrid = debounce(updateGrid, 100);

export function scatterMatrixDataChange<Datum extends DataChartPointMatrix, PElement extends BaseType, PDatum>(
  selection: Selection<SVGSVGElement, Datum, PElement, PDatum>
): Selection<SVGSVGElement, Datum, PElement, PDatum> {
  return selection.each(function (chartData, i, g) {
    // debouncedUpdateGrid(chartData, i, g);
  });
}
