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
import { debounce } from "debounce";

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

const colWidth = 250;
function computeGridTemplate(elem: SVGSVGElement, n: number) : {
  template: string,
  cols: number,
  rows: number
} {
  const svgWidth = elem.clientWidth;
  console.log(svgWidth, elem)
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
  const result = {
    template: gridRows.join(' ') + ' / ' + gridColumns.join(' '),
    cols: cols,
    rows: rows
  }

  return result
}

function computeGridArea(row: number, col: number) {
  return `${row} / ${col} / ${row + 1} / ${col + 1}`
}

export function chartBarSmallMultiples<Datum extends DataChartBarSmallMultiples, PElement extends BaseType, PDatum>(
  selection: Selection<SVGSVGElement, Datum, PElement, PDatum>
): Selection<SVGSVGElement, Datum, PElement, PDatum> {
  const arrowLeft = <HTMLElement>document.body.querySelector(".arrow-left");
  arrowLeft.addEventListener('click', displayPreviousChart);

  const arrowRight = <HTMLElement>document.body.querySelector(".arrow-right");
  arrowRight.addEventListener('click', displayNextChart);

  return chart(selection)
    .classed('chart-bar-small-multiples', true)
    .each((d, i, g) => {

      const n = d.gridValues.length
      const gridTemplate = computeGridTemplate(g[i], n);
      const s = select<SVGSVGElement, Datum>(g[i])
      .layout('display', 'grid')
      .layout('grid-template', gridTemplate.template);

      let row = 1;
      let col = 1;
      for (let i = 0; i < n; i++) {
        const gridArea = computeGridArea(row, col);
        const chartContainer = s
        .append('svg')
        .classed('sub-chart', true)
        .layout('grid-template', '1fr / 1fr')
        .layout('grid-area', gridArea);

        const innerRoot = chartContainer
          .append('g')
          .classed('inner-root', true)
          .layout('grid-area','1 / 1 / 2 / 2')
          .layout('grid-template', 'auto 1fr auto / auto 1fr')
          .layout('padding','20px');

        const header = innerRoot
          .append('g')
          .layout('grid-area','1 / 1 / 2 / 3')
          .layout('grid-template', '1fr / 1fr');

        header
          .append('text')
          .layout('grid-area', '1 / 1 / 2 / 2')
          .layout('place-self', 'center center')
          .call((s) => textHorizontalAttrs(s))
          .call((s) => textTitleAttrs(s))
          .text(d.gridValues[i]);

        const barSeries = innerRoot
          .append('g')
          .datum((d) => dataSeriesBar(d.dataBarCharts[i]))
          .call((s) => seriesBar(s))
          .layout('grid-area', '2 / 2 / 3 / 3');

        innerRoot
          .append('g')
          .datum((d) => dataSeriesLabelBar(dataLabelsBarCreation({ barContainer: barSeries })))
          .call((s) => seriesLabel(s))
          .layout('grid-area', '2 / 2 / 3 / 3');

        const leftAxis = innerRoot
          .append('g')
          .datum((d) => dataAxis({ scale: d.dataBarCharts[i].crossScale }))
          .call((s) => axisLeft(s))
          .layout('grid-area', '2 / 1 / 3 / 2')
          .layout('grid-template', '1fr / 1fr')
          .layout('grid-width', '70px');

        leftAxis
          .append('text')
          .call((s) => textVerticalAttrs(s))
          .call((s) => textTitleAttrs(s))
          .layout('grid-area', '1 / 1 / 2 / 2')
          .layout('place-self', 'start start')
          .text(d.crossTitle);

        const bottomAxis = innerRoot
          .append('g')
          .datum((d) => dataAxis({ scale: d.dataBarCharts[i].mainScale }))
          .call((s) => axisBottom(s))
          .layout('grid-area', '3 / 2 / 4 / 3')
          .layout('grid-template', '1fr / 1fr')
          .layout('grid-height', 50);

        bottomAxis
          .append('text')
          .call((s) => textHorizontalAttrs(s))
          .call((s) => textTitleAttrs(s))
          .layout('grid-area', '1 / 1 / 2 / 2')
          .layout('place-self', 'end end')
          .text(d.mainTitle);

        col++;
        if (col > gridTemplate.cols) {
          col = 1;
          row++;
        }
      }
    })
    .on('datachange.chartbarsmallmultiples', function (e, chartData) {
      chartBarSmallMultiplesDataChange(select<SVGSVGElement, Datum>(this));
    })
    .call((s) => chartBarSmallMultiplesDataChange(s));;
}

function displayPreviousChart(){
  const barChartSmallMultiples = <HTMLElement>document.body.querySelector(".root");
  const arrowContainer = <HTMLElement>document.body.querySelector(".arrow-container");
  arrowContainer.classList.add('arrow-clicked');
  let displayedChart = Number(arrowContainer.getAttribute("chart-numer"));
  const noOfCharts = barChartSmallMultiples.querySelectorAll('.sub-chart').length;
  let curChartKey = Infinity;

  if(displayedChart === 0){
    curChartKey = noOfCharts-1;
  }
  else{
    curChartKey = displayedChart-1;
  }
  arrowContainer.setAttribute('chart-numer', String(curChartKey));
  barChartSmallMultiples.querySelectorAll('.sub-chart').forEach(function(value, key){
    if(curChartKey === key){
      value.removeAttribute('style');
      value.setAttribute('grid-area','1 / 1 / 2 / 2');
    }
    else{
      value.setAttribute('style', 'display:none;visibility:hidden;');
    }
  })
}

function displayNextChart(){
  const barChartSmallMultiples = <HTMLElement>document.body.querySelector(".root");
  const arrowContainer = <HTMLElement>document.body.querySelector(".arrow-container");
  arrowContainer.classList.add('arrow-clicked');
  let displayedChart = Number(arrowContainer.getAttribute("chart-numer"));
  const noOfCharts = barChartSmallMultiples.querySelectorAll('.sub-chart').length;
  let curChartKey = Infinity;

  if(noOfCharts-1 === displayedChart){
    curChartKey = 0;
  }
  else{
    curChartKey = displayedChart+1;
  }
  arrowContainer.setAttribute('chart-numer', String(curChartKey));
  barChartSmallMultiples.querySelectorAll('.sub-chart').forEach(function(value, key){
    if(curChartKey === key){
      value.removeAttribute('style');
      value.setAttribute('grid-area','1 / 1 / 2 / 2');
    }
    else{
      value.setAttribute('style', 'display:none;visibility:hidden;');
    }
  })
}

function updateGrid<Datum extends DataChartBarSmallMultiples>(chartData: DataChartBarSmallMultiples, i: number, g: SVGSVGElement[] | ArrayLike<SVGSVGElement>) {
  const s = select<SVGSVGElement, Datum>(g[i]);
  const n = chartData.gridValues.length
  const gridTemplate = computeGridTemplate(g[i], n);
  // TODO: debounce

  // if(gridTemplate.cols === 1){
  //   s.layout('grid-template', '1fr / 1fr');
  //   const arrowContainer = <HTMLElement>document.body.querySelector(".arrow-container");
  //   arrowContainer.removeAttribute('style');
  //   if(!arrowContainer.classList.contains('arrow-clicked')){
  //     s.selectAll('.sub-chart').each(function(d, j, h){
  //       if(j != 0){
  //         select(h[j]).style('display', 'none');
  //         select(h[j]).style('visibility', 'hidden');
  //         select(h[j]).layout('grid-area','1 / 1 / 2 / 2');
  //       }
  //       else{
  //         select(h[j]).layout('grid-area','1 / 1 / 2 / 2');
  //       }
  //     })
  //   }
  // }
  // else{
    s.layout('grid-template', gridTemplate.template);
    let row = 1;
    let col = 1;
    const arrowContainer = <HTMLElement>document.body.querySelector(".arrow-container");
    arrowContainer.setAttribute('style', 'display:none;');
    arrowContainer.classList.remove('arrow-clicked');
    s.selectAll('.sub-chart').each(function(d, j, h) {
      const gridArea = computeGridArea(row, col);
      select(h[j]).layout('grid-area',gridArea);
      select(h[j]).style('display', '');
      select(h[j]).style('visibility', '');
      col++;
      if (col > gridTemplate.cols) {
        col = 1;
        row++;
      }
    })
  // }
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
