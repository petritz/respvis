import { BaseType, select, Selection } from 'd3-selection';
import { axisBottom, axisLeft, ConfigureAxisFn, DataAxis, dataAxis } from '../axis';
import {chart, COLORS_CATEGORICAL, textHorizontalAttrs, textTitleAttrs, textVerticalAttrs} from '../core';
import {
  dataChartPoint,
  DataChartPoint
} from './chart-point';
import {
  dataPointsCreation,
  DataPointsCreation,
  dataSeriesPoint,
  seriesPoint,
  seriesPointLine,
} from './series-point';

export interface DataChartLine extends DataChartPoint {
  drawPoints: Boolean;
}

export function dataChartLine(data?: Partial<DataChartLine>): DataChartLine {
  return {
    ...dataChartPoint(data),
    drawPoints: data?.drawPoints !== undefined ? data!.drawPoints : true
  }
}

export function chartLine<Datum extends DataChartLine, PElement extends BaseType, PDatum>(
  selection: Selection<SVGSVGElement, Datum, PElement, PDatum>
): Selection<SVGSVGElement, Datum, PElement, PDatum> {
  return chart(selection)
    .classed('chart-line', true)
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

      const dataPoints = dataSeriesPoint(d);
      // Supply comparator for line drawing, just order by x
      const orderByX = (p1, p2) => {
        return p1.x > p2.x ? -1 : 1
      }

      // TODO: Make customizable
      const lineThickness = 2
      const lineColor = COLORS_CATEGORICAL[6]

      const pointSeriesLine = drawArea
        .append('g')
        .datum(dataPoints)
        .call((s) => seriesPointLine(s, lineThickness, lineColor, orderByX))
        .layout('grid-area', '1 / 1');

      if (d.drawPoints) {
        drawArea
          .append('g')
          .datum(dataPoints)
          .call((s) => seriesPoint(s))
          .layout('grid-area', '1 / 1');
      }

      s.append('g')
        .layout('grid-area', '1 / 1')
        .datum((d) => dataAxis())
        .call((s) => axisLeft(s));

      s.append('g')
        .layout('grid-area', '2 / 2')
        .datum((d) => dataAxis())
        .call((s) => axisBottom(s));
    })
    .on('datachange.chartline', function (e, chartData) {
      chartLineDataChange(select<SVGSVGElement, Datum>(this));
    })
    .call((s) => chartLineDataChange(s));
}

export function chartLineDataChange<Datum extends DataChartLine, PElement extends BaseType, PDatum>(
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
