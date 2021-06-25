import { BaseType, select, Selection } from 'd3-selection';
import { axisBottom, axisLeft, DataAxis, dataAxis } from '../axis';
import { chart } from '../core';
import {
  DataChartPoint
} from './chart-point';
import {
  DataSeriesPoint,
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
    .each((d, i, g) => {
      const s = select<SVGSVGElement, Datum>(g[i])
        .layout('display','grid')
        .layout('grid-template', '1fr auto / auto 1fr')
        .layout('padding', '20px');

      const drawArea = s
        .append('svg')
        .classed('draw-area', true)
        .layout('grid-area', '1 / 2')
        .layout('display', 'grid');

      drawArea
        .append('rect')
        .classed('background', true)
        .layout('grid-area', '1 / 1')
        .attr('opacity', 0);

      const dataPoints = dataSeriesPoint(d)
      const pointSeriesLine = drawArea
        .append('g')
        .datum(dataPoints)
        .call((s) => seriesPointLine(s, 2, 'red', 'smooth'))
        .layout('grid-area', '1 / 1');

      const pointSeries = drawArea
        .append('g')
        .datum(dataPoints)
        .call((s) => seriesPoint(s))
        .layout('grid-area', '1 / 1');

      const pointSeriesLabels = drawArea
        .append('g')
        .datum(dataPoints)
        .call((s) => seriesPointLabels(s))
        .layout('grid-area', '1 / 1');

      s.append('g')
        .layout('grid-area', '1 / 1')
        .datum((d) => dataAxis())
        .call((s) => axisLeft(s, 'center'));

      s.append('g')
        .layout('grid-area', '2 / 2')
        .datum((d) => dataAxis())
        .call((s) => axisBottom(s, 'center'));
    })
    .on('datachange.chartpointconnected', function (e, chartData) {
      chartPointConnectedDataChange(select<SVGSVGElement, Datum>(this));
    })
    .call((s) => chartPointConnectedDataChange(s));
}

export function chartPointConnectedDataChange<Datum extends DataChartPoint, PElement extends BaseType, PDatum>(
  selection: Selection<SVGSVGElement, Datum, PElement, PDatum>
): Selection<SVGSVGElement, Datum, PElement, PDatum> {
  return selection.each(function (chartData, i, g) {
    const s = select<SVGSVGElement, Datum>(g[i]);

    s.selectAll<SVGElement, DataSeriesPoint>('.series-point').datum((d) =>
      Object.assign(d, { creation: chartData })
    );

    s.selectAll<SVGElement, DataSeriesPoint>('.series-point-labels').datum((d) =>
      Object.assign(d, { creation: chartData })
    );

    s.selectAll<SVGElement, DataSeriesPoint>('.series-point-line').datum((d) =>
      Object.assign(d, { creation: chartData })
    );

    const axisConfig = (selection: Selection<Element, DataAxis>, main: boolean) =>
      selection
        .datum((d) =>
          Object.assign(d, {
            scale: main ? chartData.mainScale : chartData.crossScale,
            title: main ? chartData.mainTitle: chartData.crossTitle,
            configureAxis: main ? chartData.configureMainAxis : chartData.configureCrossAxis,
          })
        )
        .classed('axis-main', main)
        .classed('axis-cross', !main);

    s.selectAll<SVGGElement, DataAxis>('.axis-left').call((s) => axisConfig(s, false));
    s.selectAll<SVGGElement, DataAxis>('.axis-bottom').call((s) => axisConfig(s, true));
  });
}
