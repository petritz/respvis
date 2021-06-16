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

export interface DataChartPointMatrix {
  dataPointCharts: DataChartPoint[],
}

export interface MatrixDataset {
  title: string;
  values: number[];
}

export interface DataChartPointMatrixInput {
  datasets: MatrixDataset[];
}

export function dataChartPointMatrix(data?: Partial<DataChartPointMatrixInput>): DataChartPointMatrix {
  const radius = 5;

  const dataPointCharts: DataChartPoint[] = [];
  const datasets = data?.datasets || [];
  for (let i = 0; i < datasets.length; i++) {
    const mainValues = datasets[i].values;
    const mainScale = scaleLinear().domain([Math.min(...mainValues), Math.max(...mainValues)]).nice();
    for (let j=0; j < datasets.length; j++) {
      const crossValues = datasets[j].values;
      const crossScale = scaleLinear().domain([Math.min(...crossValues), Math.max(...crossValues)]).nice();
      dataPointCharts.push(dataChartPoint({
        mainValues: datasets[i].values,
        mainScale: mainScale,
        crossValues: datasets[j].values,
        crossScale: crossScale,
        radiuses: radius,
        mainTitle: datasets[i].title,
        crossTitle: datasets[j].title
      }));

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

      const N = d.dataPointCharts.length;
      const n = Math.sqrt(N);
      const gridColumns : string[] = [];
      const gridRows : string[] = [];
      for (let i = 0; i < n; i++) {
        gridColumns.push('1fr');
      }
      for (let i = 0; i < n; i++) {
        gridRows.push('1fr');
      }
      const gridTemplate = gridRows.join(' ') + ' / ' + gridColumns.join(' ');
      const s = select<SVGSVGElement, Datum>(g[i])
      .layout('display', 'grid')
      .layout('grid-template', gridTemplate)
      .attr('overflow','visible');

      for (let i = 0; i < N; i++) {
        const chartContainer = s
        .append('svg')
        .classed('sub-chart', true)
        .layout('display', 'grid')
        .layout('grid-template', '1fr/1fr')
        .layout('margin','20px');

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
          .datum((d) => dataSeriesPoint(d.dataPointCharts[i]))
          .call((s) => seriesPoint(s));

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
