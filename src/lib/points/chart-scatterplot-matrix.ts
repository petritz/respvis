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

function onScatterClick(row : number, column : number) {
  focusedChart.row = row;
  focusedChart.column = column;

  window.dispatchEvent(new Event('resize'));
}

const focusedChart = {
  row: 0,
  column: 0
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
      .layout('display', 'flex')
      // .layout('grid-template', '1fr 1fr / 1fr')
      .attr('overflow','visible');

      const matrixContainer = s.append('svg')
      .classed('matrix-charts', true)
      .layout('display', 'grid')
      .layout('grid-template', gridTemplate)
      .layout('width', '50%')
      .attr('overflow','visible');

      const focusContainer = s.append('svg')
      .layout('display', 'grid')
      .layout('grid-template', '1fr / 1fr')
      .layout('width', '50%')
      .classed('matrix-focus',true);
      // focus label
      const matrixFocusLabel = focusContainer.append('svg')
      .classed('matrix-focus-label', true)
      .layout('grid-template', '1fr / 1fr')
      .layout('margin','5px')
      .layout('display', 'grid');

      matrixFocusLabel.append('text')
      .attr('y','50%')
      .attr('x','50%')
      .attr('dominant-baseline','middle')
      .attr('text-anchor', 'middle')
      .text("focus area");

      // focus chart
      const matrixFocusChart = focusContainer.append('svg')
      .classed('matrix-focus-chart', true)
      .layout('grid-template', '1fr auto / auto 1fr')
      .layout('padding', '20px')
      .layout('margin','5px')
      .layout('display','none');

      const focusDrawArea = matrixFocusChart
      .append('svg')
      .layout('display', 'grid')
      .layout('grid-area', '1 / 2')
      .classed('draw-area', true)
      .attr('overflow', 'visible');

      focusDrawArea
      .append('rect')
      .attr('fill', 'white')
      .classed('background', true)
      .layout('grid-area', '1 / 1');

      focusDrawArea
      .append('g')
      .classed('matrix-focus-points', true)
      .layout('grid-area', '1/1');

      matrixFocusChart.append('g')
        .layout('grid-area', '1 / 1')
        .datum((d) => dataAxis())
        .call((s) => axisLeft(s, 'center'));

      matrixFocusChart.append('g')
        .layout('grid-area', '2 / 2')
        .datum((d) => dataAxis())
        .call((s) => axisBottom(s, 'center'));


      for (let k = 0; k < n; k++) {
        for (let j  = 0; j < n; j++) {
          const chartContainer = matrixContainer
          .append('svg')
          .classed('sub-chart', true)
          .layout('display', 'grid')
          .layout('grid-template', '1fr/1fr')
          .layout('aspect-ratio', '1')
          .layout('margin','5px');

          const chartContainerNode  = chartContainer.node()
          chartContainerNode!.addEventListener('click', () => onScatterClick(k, j));

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
            .attr('overflow', 'visible');

            drawArea
            .append('rect')
            .attr('fill', 'white')
            .classed('background', true)
            .layout('grid-area', '1 / 1');

            const pointSeries = drawArea
              .append('g')
              .layout('grid-area', '1/1')
              .datum((d) => dataSeriesPoint(dataPointChart.dataset!))
              .call((s) => seriesPoint(s));
          }
        }
      }
    })
    .on('datachange.scattermatrix', function (e, chartData) {
      debug(`data change on ${nodeToString(this)}`);
      scatterMatrixDataChange(select<SVGSVGElement, Datum>(this));
    })
    .call((s) => scatterMatrixDataChange(s));;
}

const breakPoint = 960; // 60 exm
export function scatterMatrixDataChange<Datum extends DataChartPointMatrix, PElement extends BaseType, PDatum>(
  selection: Selection<SVGSVGElement, Datum, PElement, PDatum>
): Selection<SVGSVGElement, Datum, PElement, PDatum> {
  return selection.each(function (chartData, i, g) {
    const s = select<SVGSVGElement, Datum>(g[i]);

    const containerWidth = g[i].parentElement!.clientWidth;
    if (containerWidth <= breakPoint * window.devicePixelRatio) {
      s.layout('flex-direction', 'column-reverse');
      s.select<SVGSVGElement>('.matrix-charts')
      .layout('width', '100%')
      .layout('height', '50%');
      s.select<SVGSVGElement>('.matrix-focus')
      .layout('width', '100%')
      .layout('height', '50%');
    } else {
      s.layout('flex-direction', 'row');
      s.select<SVGSVGElement>('.matrix-charts')
      .layout('width', '50%');
      s.select<SVGSVGElement>('.matrix-focus')
      .layout('width', '50%');
    }

    if (focusedChart.row === focusedChart.column) {
      s.select<SVGSVGElement>('.matrix-focus-chart')
      .layout('display', 'none');

      const labelContainer = s.select<SVGSVGElement>('.matrix-focus-label')
      .layout('display', 'grid');

      const row = focusedChart.row;
      const column = focusedChart.column;
      const dataPointChart = chartData.dataPointCharts[row][column];

      labelContainer.selectChild<SVGSVGElement>().text(dataPointChart.title);
    } else {
      s.select<SVGSVGElement>('.matrix-focus-chart')
      .layout('display', 'grid');

      s.select<SVGSVGElement>('.matrix-focus-label')
      .layout('display', 'none');


      const row = focusedChart.row;
      const column = focusedChart.column;
      const dataPointChart = chartData.dataPointCharts[row][column];
      s.select<SVGSVGElement>('.matrix-focus-points')
        .datum((d) => dataSeriesPoint(dataPointChart.dataset!))
        .call((s) => seriesPoint(s));

      const axisConfig = (selection: Selection<Element, DataAxis>, main: boolean) =>
        selection
          .datum((d) =>
            Object.assign(d, {
              scale: main ? dataPointChart.dataset!.mainScale :  dataPointChart.dataset!.crossScale,
              title: main ?  dataPointChart.dataset!.mainTitle :  dataPointChart.dataset!.crossTitle,
              configureAxis: main ?  dataPointChart.dataset!.configureMainAxis :  dataPointChart.dataset!.configureCrossAxis,
            })
          )
          .classed('axis-main', main)
          .classed('axis-cross', !main);

      s.selectAll<SVGGElement, DataAxis>('.axis-left').call((s) => axisConfig(s, false));
      s.selectAll<SVGGElement, DataAxis>('.axis-bottom').call((s) => axisConfig(s, true));
    }
  });
}
