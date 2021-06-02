import { BaseType, select, Selection } from 'd3-selection';
import { axisBottom, axisLeft, ConfigureAxisFn, DataAxis, dataAxis } from '../axis';
import { chart, textHorizontalAttrs, textTitleAttrs, textVerticalAttrs } from '../core';
import {
  DataChartPoint
} from './chart-point';
import {
  dataPointsCreation,
  DataPointsCreation,
  dataSeriesPoint,
  seriesPoint,
  seriesPointLine,
  seriesPointLabels
} from './series-point';


export function chartPointConnected<Datum extends DataChartPoint, PElement extends BaseType, PDatum>(
  selection: Selection<SVGSVGElement, Datum, PElement, PDatum>
): Selection<SVGSVGElement, Datum, PElement, PDatum> {
  return chart(selection)
    .classed('chart-point-connected', true)
    .on('render.chartpointconnected', function (e, chartData) {
      renderChartPointConnected(select<SVGSVGElement, Datum>(this));
    })
    .each((d, i, g) => {
      const s = select<SVGSVGElement, Datum>(g[i]);

      const root = s
        .select('.root')
        .attr('grid-template', '1fr auto / auto 1fr')
        .attr('margin', 20);

      const drawArea = root
        .append('svg')
        .classed('draw-area', true)
        .attr('grid-area', '1 / 2 / 2 / 3')
        .attr('grid-template', '1fr / 1fr');

      drawArea
        .append('rect')
        .classed('background', true)
        .attr('grid-area', '1 / 1 / 2 / 2')
        .attr('width', '100%')
        .attr('height', '100%')
        .attr('opacity', 0);

      const dataPoints = dataSeriesPoint(d)
      const pointSeries = drawArea
        .append('g')
        .datum(dataPoints)
        .call((s) => seriesPoint(s))
        .attr('grid-area', '1 / 1 / 2 / 2');

      const pointSeriesLine = drawArea
        .append('g')
        .datum(dataPoints)
        .call((s) => seriesPointLine(s))
        .attr('grid-area', '1 / 1 / 2 / 2');

      const pointSeriesLabels = drawArea
      .append('g')
      .datum(dataPoints)
      .call((s) => seriesPointLabels(s))
      .attr('grid-area', '1 / 1 / 2 / 2');

      const leftAxis = root
        .append('g')
        .datum((d) => dataAxis())
        .call((s) => axisLeft(s))
        .attr('grid-area', '1 / 1 / 2 / 2')
        .attr('grid-template', '1fr / 1fr')
        .attr('grid-width', 70);

      leftAxis
        .append('text')
        .call((s) => textVerticalAttrs(s))
        .call((s) => textTitleAttrs(s))
        .attr('grid-area', '1 / 1 / 2 / 2')
        .attr('place-self', 'start start');

      const bottomAxis = root
        .append('g')
        .datum((d) => dataAxis())
        .call((s) => axisBottom(s))
        .attr('grid-area', '2 / 2 / 3 / 3')
        .attr('grid-template', '1fr / 1fr')
        .attr('grid-height', 50);

      bottomAxis
        .append('text')
        .call((s) => textHorizontalAttrs(s))
        .call((s) => textTitleAttrs(s))
        .attr('grid-area', '1 / 1 / 2 / 2')
        .attr('place-self', 'end end');
    });
}

export function renderChartPointConnected<Datum extends DataChartPoint, PElement extends BaseType, PDatum>(
  selection: Selection<SVGSVGElement, Datum, PElement, PDatum>
): Selection<SVGSVGElement, Datum, PElement, PDatum> {
  return selection.each(function (chartData, i, g) {
    const s = select<SVGSVGElement, Datum>(g[i]);
    const axisConfig = (selection: Selection<Element, DataAxis>, main: boolean) =>
      selection
        .datum((d) =>
          Object.assign(d, {
            scale: main ? chartData.mainScale : chartData.crossScale,
            configureAxis: main ? chartData.configureMainAxis : chartData.configureCrossAxis,
          })
        )
        .classed('axis-main', main)
        .classed('axis-cross', !main)
        .selectAll('.title')
        .text(main ? chartData.mainTitle : chartData.crossTitle);

    s.selectAll<SVGGElement, DataAxis>('.axis-left').call((s) => axisConfig(s, false));
    s.selectAll<SVGGElement, DataAxis>('.axis-bottom').call((s) => axisConfig(s, true));
  });
}