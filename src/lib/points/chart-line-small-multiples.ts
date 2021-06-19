import { ScaleBand, scaleBand, ScaleContinuousNumeric, scaleLinear  } from 'd3-scale';
import { BaseType, select, Selection } from 'd3-selection';
import { axisBottom, axisLeft, ConfigureAxisFn, DataAxis, dataAxis } from '../axis';
import {chart, COLORS_CATEGORICAL, textHorizontalAttrs, textTitleAttrs, textVerticalAttrs} from '../core';
import {
  dataChartPoint,
  DataChartPoint,
} from './chart-point';
import {
  dataPointsCreation,
  DataPointsCreation,
  dataSeriesPoint,
  seriesPoint,
  seriesPointLine,
} from './series-point';

export interface DataChartPointSmallMultiples {
  configureMainAxis: ConfigureAxisFn;
  mainTitle: string;
  configureCrossAxis: ConfigureAxisFn;
  crossTitle: string;
  gridValues: any[];
  dataChartPoint: DataChartPoint[],
  mainValues: any[];
  crossValues: number[][];
  mainScale: ScaleBand<any>;
  crossScale: ScaleContinuousNumeric<number, number>;
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

export function dataChartPointSmallMultiples(data?: Partial<DataChartPointSmallMultiples>): DataChartPointSmallMultiples {
  const mainValues = data?.mainValues || [];
  const mainScale = scaleBand().domain(mainValues).padding(0.1);
  const crossValues = data?.crossValues || [];
  const crossValuesFlat = crossValues.reduce((acc, val) => acc.concat(val), []) || [];
  const crossScale = scaleLinear()
    .domain([0, Math.max(...crossValuesFlat)])
    .nice();
  const mainTitle = data?.mainTitle || "";
  const crossTitle = data?.crossTitle || "";

  const dataChartPoints: DataChartPoint[] = [];
  const gridValues = data?.gridValues || [];
  for(let i=0; i<gridValues.length; i++){
    dataChartPoints.push(dataChartPoint({
      mainValues: mainValues,
      crossValues: crossValues[i] || [],
      mainScale: mainScale,
      crossScale: crossScale,
      mainTitle,
      crossTitle
    }));
  }

  return {
    configureMainAxis: data?.configureMainAxis || (() => {}),
    mainTitle: mainTitle,
    configureCrossAxis: data?.configureCrossAxis || (() => {}),
    crossTitle: crossTitle,
    gridValues: gridValues,
    dataChartPoint: dataChartPoints,
    mainValues: mainValues,
    mainScale: mainScale,
    crossValues: crossValues,
    crossScale: crossScale,
    // radiuses: 5,
  };
}

export function chartLineSmallMultiples<Datum extends DataChartPointSmallMultiples, PElement extends BaseType, PDatum>(
  selection: Selection<SVGSVGElement, Datum, PElement, PDatum>
): Selection<SVGSVGElement, Datum, PElement, PDatum> {
  return chart(selection)
    .classed('chart-line-small-multiples', true)
    .each((d, i, g) => {

      const n = d.gridValues.length;
      const gridTemplate = computeGridTemplate(g[i], n);
      const s = select<SVGSVGElement, Datum>(g[i])
        .layout('display','grid')
        .layout('grid-template', gridTemplate.template)
        .attr('overflow','visible');

      for(let i=0; i<n; i++){
        const container = s
          .append('svg')
          .classed('sub-chart', true)
          .layout('display', 'grid')
          .layout('grid-template', 'auto 1fr auto / auto 1fr')
          .layout('padding','20px');

        const drawArea = container
          .append('svg')
          .classed('draw-area', true)
          .attr('overflow', 'visible')
          .layout('grid-area','2 / 2 / 3 / 3')
          .layout('display','grid');

        const header = container
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
          .datum((d) => dataSeriesPoint(d.dataChartPoint[i]))
          .call((s) => seriesPointLine(s));

        container
          .append('g')
          .datum((d) => dataAxis())
          .call((s) => axisLeft(s))
          .layout('grid-area', '2 / 1 / 3 / 2');

        container
          .append('g')
          .datum((d) => dataAxis())
          .call((s) => axisBottom(s))
          .layout('grid-area', '3 / 2 / 4 / 3');
      }
    })
    .on('datachange.chartline', function (e, chartData) {
      chartLineSmallMultiplesDataChange(select<SVGSVGElement, Datum>(this));
    })
    .call((s) => chartLineSmallMultiplesDataChange(s));
}

export function chartLineSmallMultiplesDataChange<Datum extends DataChartPointSmallMultiples, PElement extends BaseType, PDatum>(
  selection: Selection<SVGSVGElement, Datum, PElement, PDatum>
): Selection<SVGSVGElement, Datum, PElement, PDatum> {
  return selection.each(function (chartData, i, g) {
    const s = select<SVGSVGElement, Datum>(g[i]);
    const n = chartData.gridValues.length
    const gridTemplate = computeGridTemplate(g[i], n);
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
  });
}
