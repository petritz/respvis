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
  chartBar,
  DataChartBar,
  dataChartBar
} from './chart-bar';
import {
  DataBarsCreation,
  dataBarsCreation,
  Orientation,
  seriesBar,
  dataSeriesBar,
} from './series-bar';
import { seriesLabel } from './series-label';
import { dataLabelsBarCreation, dataSeriesLabelBar } from './series-label-bar';
import { debounce } from "debounce";

export interface DataChartBarSmallMultiples{
  mainTitle: string;
  crossTitle: string;
  mainValues: any[];
  crossValues: number[][];
  mainScale: ScaleBand<any>;
  crossScale: ScaleContinuousNumeric<number, number>;
  configureMainAxis: ConfigureAxisFn;
  configureCrossAxis: ConfigureAxisFn;
  gridValues: any[];
  dataBarCharts: DataChartBar[],
}

export function dataChartBarSmallMultiples(data?: Partial<DataChartBarSmallMultiples>): DataChartBarSmallMultiples {
  const mainValues = data?.mainValues || [];
  const mainScale = scaleBand().domain(mainValues).padding(0.1);
  const crossValues = data?.crossValues || [];
  const crossValuesFlat = crossValues.reduce((acc, val) => acc.concat(val), []) || [];
  const crossScale = scaleLinear()
    .domain([0, Math.max(...crossValuesFlat)])
    .nice();
  const mainTitle = data?.mainTitle || '';
  const crossTitle = data?.crossTitle || '';

  const dataBarCharts: DataChartBar[] = [];
  const gridValues = data?.gridValues || [];
  for (let i = 0; i < gridValues.length; i++) {
    dataBarCharts.push(dataChartBar({
      mainValues: mainValues,
      crossValues: crossValues[i] || [],
      mainScale: mainScale,
      crossScale: crossScale,
      mainTitle,
      crossTitle
    }));
  }

  return {
    mainTitle,
    crossTitle,
    configureMainAxis: data?.configureMainAxis || (() => {}),
    configureCrossAxis: data?.configureCrossAxis || (() => {}),
    mainValues,
    crossValues,
    gridValues,
    dataBarCharts,
    mainScale,
    crossScale
  };
}

const baseColWidth = 250;
function computeGridTemplate(elem: SVGSVGElement, n: number) : {
  template: string,
  cols: number,
  rows: number
} {
  const colWidth = baseColWidth * window.devicePixelRatio;
  const containerWidth = elem.parentElement!.clientWidth;
  let cols = Math.ceil(Math.sqrt(n));
  if (cols * colWidth > containerWidth) {
    cols = Math.floor(containerWidth / colWidth);
  }

  const rows = Math.floor(n / cols);
  const gridColumns : string[] = [];
  const gridRows : string[] = [];
  for (let i = 0; i < cols; i++) {
    gridColumns.push('1fr');
  }
  for (let i = 0; i < rows; i++) {
    gridRows.push('1fr');
  }
  const result = {
    template: gridRows.join(' ') + ' / ' + gridColumns.join(' '),
    cols: cols,
    rows: rows
  }

  return result
}

export function chartBarSmallMultiples<Datum extends DataChartBarSmallMultiples, PElement extends BaseType, PDatum>(
  selection: Selection<SVGSVGElement, Datum, PElement, PDatum>
): Selection<SVGSVGElement, Datum, PElement, PDatum> {
  return chart(selection)
    .classed('chart-bar-small-multiples', true)
    .each((d, i, g) => {

      const n = d.gridValues.length
      const gridTemplate = computeGridTemplate(g[i], n);
      const s = select<SVGSVGElement, Datum>(g[i])
      .layout('display', 'grid')
      .layout('grid-template', gridTemplate.template)
      .attr('overflow','visible');

      for (let i = 0; i < n; i++) {
        const chartContainer = s
        .append('svg')
        .classed('sub-chart', true)
        .layout('display', 'grid')
        .layout('grid-template', 'auto 1fr auto / auto 1fr')
        .layout('padding','20px');

        const drawArea = chartContainer
          .append('svg')
          .classed('draw-area', true)
          .attr('overflow', 'visible')
          .layout('grid-area','2 / 2 / 3 / 3')
          .layout('display','grid');

        const header = chartContainer
          .append('g')
          .layout('grid-area','1 / 1 / 2 / 3')
          .layout('display', 'flex')
          .layout('justify-content','center');

        header
          .append('text')
          .call((s) => textHorizontalAttrs(s))
          .call((s) => textTitleAttrs(s))
          .text(d.gridValues[i]);

        const barSeries = drawArea
          .append('g')
          .layout('grid-area', '1 / 1')
          .datum((d) => dataSeriesBar(d.dataBarCharts[i]))
          .call((s) => seriesBar(s));

        drawArea
          .append('g')
          .datum((d) => dataSeriesLabelBar(dataLabelsBarCreation({ barContainer: barSeries })))
          .call((s) => seriesLabel(s))
          .layout('grid-area', '1 / 1');

        chartContainer
          .append('g')
          .datum((d) => dataAxis())
          .call((s) => axisLeft(s))
          .layout('grid-area', '2 / 1 / 3 / 2');

        chartContainer
          .append('g')
          .datum((d) => dataAxis())
          .call((s) => axisBottom(s))
          .layout('grid-area', '3 / 2 / 4 / 3');
      }
    })
    .on('datachange.chartbarsmallmultiples', function (e, chartData) {
      debug(`data change on ${nodeToString(this)}`);
      chartBarSmallMultiplesDataChange(select<SVGSVGElement, Datum>(this));
    })
    .call((s) => chartBarSmallMultiplesDataChange(s));;
}

function updateGrid<Datum extends DataChartBarSmallMultiples>(chartData: DataChartBarSmallMultiples, i: number, g: SVGSVGElement[] | ArrayLike<SVGSVGElement>) {
  const s = select<SVGSVGElement, Datum>(g[i]);
  const n = chartData.gridValues.length
  const gridTemplate = computeGridTemplate(g[i], n);
  // TODO: debounce
  s.layout('grid-template', gridTemplate.template);

  const axisConfig = (selection: Selection<Element, DataAxis>, main: boolean) =>
      selection.datum((d) =>
        Object.assign(d, {
          scale: main ? chartData.mainScale : chartData.crossScale,
          title: main ? chartData.mainTitle : chartData.crossTitle,
          configureAxis: main ? chartData.configureMainAxis : chartData.configureCrossAxis,
        })
      )
      .classed('axis-main', main)
      .classed('axis-cross', !main);


  s.selectAll<SVGGElement, DataAxis>('.axis-left').call((s) => axisConfig(s, false));
  s.selectAll<SVGGElement, DataAxis>('.axis-bottom').call((s) => axisConfig(s, true));
}

// const debouncedUpdateGrid = debounce(updateGrid, 100);

export function chartBarSmallMultiplesDataChange<Datum extends DataChartBarSmallMultiples, PElement extends BaseType, PDatum>(
  selection: Selection<SVGSVGElement, Datum, PElement, PDatum>
): Selection<SVGSVGElement, Datum, PElement, PDatum> {
  return selection.each(function (chartData, i, g) {
    // debouncedUpdateGrid(chartData, i, g);
    updateGrid(chartData, i, g);
  });
}
