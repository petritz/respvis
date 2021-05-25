import { BaseType, select, Selection } from 'd3-selection';
import { ScaleBand, ScaleContinuousNumeric, scaleBand, scaleLinear } from 'd3-scale';
import { axisBottom, axisLeft, ConfigureAxisFn, dataAxis, DataAxis } from '../axis';
import { chart, textHorizontalAttrs, textTitleAttrs, textVerticalAttrs } from '../core';
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

export interface DataChartBarSmallMultiples{
  mainTitle: string;
  crossTitle: string;
  mainValues: any[];
  crossValues: number[][];
  // mainScale: ScaleBand<any>;
  // crossScale: ScaleContinuousNumeric<number, number>;
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
    dataBarCharts
  };
}

const colWidth = 450;
function computeGridTemplate(elem: SVGSVGElement, n: number) : {
  template: string,
  cols: number,
  rows: number
} {
  const svgWidth = elem.clientWidth;
  let cols = Math.ceil(Math.sqrt(n));
  if (cols * colWidth > svgWidth) {
    cols = Math.floor(svgWidth / colWidth);
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
  return {
    template: gridRows.join(' ') + ' / ' +gridColumns.join(' '),
    cols: cols,
    rows: rows
  }
}

function computeGridArea(row: number, col: number) {
  return `${row} / ${col} / ${row + 1} / ${col + 1}`
}

export function chartBarSmallMultiples<Datum extends DataChartBarSmallMultiples, PElement extends BaseType, PDatum>(
  selection: Selection<SVGSVGElement, Datum, PElement, PDatum>
): Selection<SVGSVGElement, Datum, PElement, PDatum> {
  return chart(selection)
    .classed('chart-bar-small-multiples', true)
    .on('render.chartbarsmallmultiples', function (e, chartData) {
      renderChartBarSmallMultiples(select<SVGSVGElement, Datum>(this));
    })
    .each((d, i, g) => {
      const s = select<SVGSVGElement, Datum>(g[i]);

      const n = d.gridValues.length
      const gridTemplate = computeGridTemplate(g[i], n);
      const root = s
        .select('.root')
        .attr('grid-template', gridTemplate.template);

      let row = 1;
      let col = 1;
      for (let i = 0; i < n; i++) {
        const gridArea = computeGridArea(row, col);
        const chartContainer = root
        .append('g')
        .classed('sub-chart', true)
        .attr('grid-template', '1fr / 1fr')
        .attr('grid-area', gridArea);

        const innerRoot = chartContainer
          .append('g')
          .classed('inner-root', true)
          .attr('grid-area','1 / 1 / 2 / 2')
          .attr('grid-template', 'auto 1fr auto / auto 1fr')
          .attr('margin',20);

        const header = innerRoot
          .append('g')
          .attr('grid-area','1 / 1 / 2 / 3')
          .attr('grid-template', '1fr / 1fr');

        header
          .append('text')
          .attr('grid-area', '1 / 1 / 2 / 2')
          .attr('place-self', 'center center')
          .call((s) => textHorizontalAttrs(s))
          .call((s) => textTitleAttrs(s))
          .text(d.gridValues[i]);

        const barSeries = innerRoot
          .append('g')
          .datum((d) => dataSeriesBar(d.dataBarCharts[i]))
          .call((s) => seriesBar(s))
          .attr('grid-area', '2 / 2 / 3 / 3');

        innerRoot
          .append('g')
          .datum((d) => dataSeriesLabelBar(dataLabelsBarCreation({ barContainer: barSeries })))
          .call((s) => seriesLabel(s))
          .attr('grid-area', '2 / 2 / 3 / 3');

        const leftAxis = innerRoot
          .append('g')
          .datum((d) => dataAxis({ scale: d.dataBarCharts[i].crossScale }))
          .call((s) => axisLeft(s))
          .attr('grid-area', '2 / 1 / 3 / 2')
          .attr('grid-template', '1fr / 1fr')
          .attr('grid-width', 70);

        leftAxis
          .append('text')
          .call((s) => textVerticalAttrs(s))
          .call((s) => textTitleAttrs(s))
          .attr('grid-area', '1 / 1 / 2 / 2')
          .attr('place-self', 'start start')
          .text(d.crossTitle);

        const bottomAxis = innerRoot
          .append('g')
          .datum((d) => dataAxis({ scale: d.dataBarCharts[i].mainScale }))
          .call((s) => axisBottom(s))
          .attr('grid-area', '3 / 2 / 4 / 3')
          .attr('grid-template', '1fr / 1fr')
          .attr('grid-height', 50);

        bottomAxis
          .append('text')
          .call((s) => textHorizontalAttrs(s))
          .call((s) => textTitleAttrs(s))
          .attr('grid-area', '1 / 1 / 2 / 2')
          .attr('place-self', 'end end')
          .text(d.mainTitle);

        col++;
        if (col > gridTemplate.cols) {
          col = 1;
          row++;
        }
      }
    });
}

export function renderChartBarSmallMultiples<Datum extends DataChartBarSmallMultiples, PElement extends BaseType, PDatum>(
  selection: Selection<SVGSVGElement, Datum, PElement, PDatum>
): Selection<SVGSVGElement, Datum, PElement, PDatum> {
  return selection.each(function (chartData, i, g) {
    const s = select<SVGSVGElement, Datum>(g[i]);
    const n = chartData.gridValues.length
    const gridTemplate = computeGridTemplate(g[i], n);
    s.selectAll('.root').attr('grid-template', gridTemplate.template);
  });
}
