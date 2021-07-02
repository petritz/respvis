import { BaseType, select, Selection } from 'd3-selection';
import { axisBottom, axisLeft, ConfigureAxisFn, DataAxis, dataAxis } from '../axis';
import { scaleLinear } from 'd3-scale';
import {
  chart,
  COLORS_CATEGORICAL,
  textHorizontalAttrs,
  textTitleAttrs,
  textVerticalAttrs,
  ScaleAny,
} from '../core';
import {
  dataChartPoint,
  DataChartPoint
} from './chart-point';
import { DataLegend, dataLegendSquares, legend } from '../legend';
import {
  dataChartLine,
  DataChartLine
} from './chart-line';

import {
  dataPointsCreation,
  DataPointsCreation,
  dataSeriesPoint,
  seriesPoint,
  seriesPointLine,
  PathType
} from './series-point';

export interface DataChartMultiLine {
  mainTitle: string;
  crossTitle: string;
  innerValues: string[];
  mainScale: ScaleAny<any, number, number>;
  crossScale: ScaleAny<any, number, number>;
  configureMainAxis: ConfigureAxisFn;
  legendColors: string[];
  configureCrossAxis: ConfigureAxisFn;
  datasets: DataChartLine[];
}

export function dataChartMultiLine(data?: Partial<DataChartMultiLine>): DataChartMultiLine {
  const datasets = data?.datasets || [];

  let mainScale = data?.mainScale;
  if (mainScale === undefined) {
    const valuesFlat: any[] = [];
    for (let i = 0; i < datasets.length; i++) {
      const dataset = datasets[i];
      valuesFlat.push(...datasets[i].mainValues)
    }
    mainScale = scaleLinear().domain([Math.min(...valuesFlat), Math.max(...valuesFlat)]);
  }

  let crossScale = data?.crossScale;
  if (crossScale === undefined) {
    const valuesFlat: any[] = [];
    for (let i = 0; i < datasets.length; i++) {
      const dataset = datasets[i];
      valuesFlat.push(...datasets[i].crossValues)
    }
    crossScale = scaleLinear().domain([Math.min(...valuesFlat), Math.max(...valuesFlat)]);
  }

  const mainTitle = data?.mainTitle || '';
  const crossTitle = data?.crossTitle || '';
  const legendColors: string[] = [];

  const dataChartLines: DataChartLine[] = [];
  for (let i = 0; i < datasets.length; i++) {
    const dataset = datasets[i];
    const colorIndex = i % (COLORS_CATEGORICAL.length - 1);
    dataChartLines.push(dataChartLine({
      mainValues: dataset.mainValues,
      crossValues: dataset.crossValues,
      mainScale: mainScale,
      crossScale: crossScale,
      drawPoints: true,
      lineColor: COLORS_CATEGORICAL[colorIndex]
    }));
    legendColors.push(COLORS_CATEGORICAL[colorIndex]);
  }

  return {
    mainTitle,
    crossTitle,
    configureMainAxis: data?.configureMainAxis || (() => {}),
    configureCrossAxis: data?.configureCrossAxis || (() => {}),
    datasets: dataChartLines,
    innerValues: data?.innerValues || [],
    mainScale,
    legendColors: legendColors,
    crossScale
  };
}

export function chartMultiLine<Datum extends DataChartMultiLine, PElement extends BaseType, PDatum>(
  selection: Selection<SVGSVGElement, Datum, PElement, PDatum>
): Selection<SVGSVGElement, Datum, PElement, PDatum> {
  return chart(selection)
    .classed('chart-line', true)
    .each((d, i, g) => {
      const s = select<SVGSVGElement, Datum>(g[i])
        .layout('display','grid')
        // .layout('grid-template', '1fr auto / 1fr auto')
        // .layout('grid-template', '1fr auto / 1fr ')
        .layout('grid-template', '')
        .layout('padding', '20px');

        const chartContainer = s
        .append('svg')
        .classed('chart-container', true)
        .layout('display','grid')
        .layout('grid-template', '1fr auto / auto 1fr')
        .layout('padding', '20px');

        s
        .append('g')
        .classed('legend', true)
        .datum(
          dataLegendSquares({
            labels: d.innerValues,
            colors: d.legendColors,
          })
        )
        .call((s) => legend(s))
        // .layout('grid-template', '1 / 2')
        // .layout('grid-template', 'auto / auto ')
        .layout('grid-template', '')
        .layout('margin', '0.5rem')
        .layout('justify-content', 'flex-end')
        .layout('flex-direction', 'column');

      const drawArea = chartContainer
        .append('svg')
        .classed('draw-area', true)
        .layout('grid-area', '1 / 2')
        .layout('display', 'grid')
        .style('overflow', 'visible');

      drawArea
        .append('rect')
        .classed('background', true)
        .layout('grid-area', '1 / 1')
        .attr('opacity', 0);

      // Supply comparator for line drawing, just order by x
      const orderByX = (p1, p2) => {
        return p1.x > p2.x ? -1 : 1
      }
      for (const dataset of d.datasets) {
        const dataPoints = dataSeriesPoint(dataset);

        const pointSeriesLine = drawArea
          .append('g')
          .datum(dataPoints)
          .call((s) => seriesPointLine(s, dataset.lineThickness, dataset.lineColor, dataset.lineType, orderByX))
          .layout('grid-area', '1 / 1');

        if (dataset.drawPoints) {
          drawArea
            .append('g')
            .datum(dataPoints)
            .call((s) => seriesPoint(s, dataset.lineColor))
            .layout('grid-area', '1 / 1');
        }

      }
      chartContainer.append('g')
        .layout('grid-area', '1 / 1')
        .datum((d) => dataAxis())
        .call((s) => axisLeft(s, 'center'));

        chartContainer.append('g')
        .layout('grid-area', '2 / 2')
        .datum((d) => dataAxis())
        .call((s) => axisBottom(s, 'center'));
    })
    .on('datachange.chartmultiline', function (e, chartData) {
      chartMultiLineDataChange(select<SVGSVGElement, Datum>(this));
    })
    .call((s) => chartMultiLineDataChange(s));
}

export function chartMultiLineDataChange<Datum extends DataChartMultiLine, PElement extends BaseType, PDatum>(
  selection: Selection<SVGSVGElement, Datum, PElement, PDatum>
): Selection<SVGSVGElement, Datum, PElement, PDatum> {
  return selection.each(function (chartData, i, g) {
    const s = select<SVGSVGElement, Datum>(g[i]);

    const axisConfig = (selection: Selection<Element, DataAxis>, main: boolean) =>
      selection
        .datum((d) =>
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
