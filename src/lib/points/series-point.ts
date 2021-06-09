import { bezier } from 'chroma-js';
import { easeCubicOut } from 'd3-ease';
import { scaleLinear } from 'd3-scale';
import { BaseType, select, Selection } from 'd3-selection';
import {
  COLORS_CATEGORICAL,
  dataSeries,
  DataSeries,
  debug,
  nodeToString,
  Position,
  ScaleAny,
} from '../core';
import { Size } from '../core/utils';

export interface DataPoint extends Position {
  radius: number;
  index: number;
  key: string;
  label?: string;
}

export interface DataSeriesPointCustom extends DataSeries<DataPoint> {}

export function dataSeriesPointCustom(
  data?: Partial<DataSeriesPointCustom>
): DataSeriesPointCustom {
  return dataSeries({
    data: data?.data,
    key: data?.key || ((d) => d.key),
  });
}

export interface DataPointsCreation {
  mainValues: any[];
  mainScale: ScaleAny<any, number, number>;
  crossValues: any[];
  crossScale: ScaleAny<any, number, number>;
  radiuses: number[] | number;
  keys?: string[];
  labels?: string[];
}

export function dataPointsCreation(data?: Partial<DataPointsCreation>): DataPointsCreation {
  return {
    mainValues: data?.mainValues || [],
    mainScale: data?.mainScale || scaleLinear().domain([0, 1]),
    crossValues: data?.crossValues || [],
    crossScale: data?.crossScale || scaleLinear().domain([0, 1]),
    radiuses: data?.radiuses || 5,
    keys: data?.keys,
    labels: data?.labels
  };
}

export interface DataSeriesPoint extends DataSeriesPointCustom {
  creation: DataPointsCreation;
}

export function dataSeriesPoint(creationData: DataPointsCreation): DataSeriesPoint {
  const seriesData: DataSeriesPoint = {
    ...dataSeriesPointCustom({ data: (s) => dataPoints(seriesData.creation, s.bounds()!) }),
    creation: creationData,
  };
  return seriesData;
}

export function dataPoints(creationData: DataPointsCreation, bounds: Size): DataPoint[] {
  creationData.mainScale.range([0, bounds.width]);
  creationData.crossScale.range([bounds.height, 0]);

  const data: DataPoint[] = [];

  for (let i = 0; i < creationData.mainValues.length; ++i) {
    const x = creationData.mainValues[i],
      y = creationData.crossValues[i],
      r = Array.isArray(creationData.radiuses) ? creationData.radiuses[i] : creationData.radiuses;
    data.push({
      index: i,
      key: creationData.keys?.[i] || i.toString(),
      x: creationData.mainScale(x)!,
      y: creationData.crossScale(y)!,
      radius: r,
      label: creationData.labels?.[i]
    });
  }

  return data;
}

export function seriesPoint<
  GElement extends Element,
  Datum extends DataSeriesPointCustom,
  PElement extends BaseType,
  PDatum
>(
  selection: Selection<GElement, Datum, PElement, PDatum>
): Selection<GElement, Datum, PElement, PDatum> {
  return selection
    .classed('series-point', true)
    .attr('fill', COLORS_CATEGORICAL[0])
    .on(
      'render.seriespoint-initial',
      function () {
        debug(`render on data change on ${nodeToString(this)}`);
        select(this).on('datachange.seriespoint', function () {
          debug(`data change on ${nodeToString(this)}`);
          select(this).dispatch('render');
        });
      },
      { once: true }
    )
    .on('render.seriespoint', function (e, d) {
      seriesPointRender(select<GElement, DataSeriesPointCustom>(this));
    });
}

export function seriesPointRender<
  GElement extends Element,
  Datum extends DataSeriesPointCustom,
  PElement extends BaseType,
  PDatum
>(
  selection: Selection<GElement, Datum, PElement, PDatum>
): Selection<GElement, Datum, PElement, PDatum> {
  return selection.each((d, i, g) => {
    debug(`render point series on ${nodeToString(g[i])}`);
    const series = select(g[i]);
    series
      .selectAll<SVGCircleElement, DataPoint>('circle')
      .data(d.data instanceof Function ? d.data(series) : d.data, d.key)
      .join(
        (enter) =>
          enter
            .append('circle')
            .classed('point', true)
            .attr('cx', (d) => d.x)
            .attr('cy', (d) => d.y)
            .attr('r', 0)
            .call((s) => selection.dispatch('pointenter', { detail: { selection: s } })),
        undefined,
        (exit) =>
          exit
            .classed('exiting', true)
            .call((s) =>
              s
                .transition('exit')
                .duration(250)
                .attr('cx', (d) => d.x)
                .attr('cy', (d) => d.y)
                .attr('r', 0)
                .remove()
            )
            .call((s) => selection.dispatch('pointexit', { detail: { selection: s } }))
      )
      .call((s) =>
        s
          .transition('update')
          .duration(250)
          .ease(easeCubicOut)
          .attr('cx', (d) => d.x)
          .attr('cy', (d) => d.y)
          .attr('r', (d) => d.radius)
      )
      .call((s) => selection.dispatch('pointupdate', { detail: { selection: s } }));
  });
}

export function seriesPointLabels<
  GElement extends Element,
  Datum extends DataSeriesPointCustom,
  PElement extends BaseType,
  PDatum
>(
  selection: Selection<GElement, Datum, PElement, PDatum>
): Selection<GElement, Datum, PElement, PDatum> {
  return selection
    .classed('series-point-labels', true)
    .on(
      'render.seriespointlabels-initial',
      function () {
        debug(`render on data change on ${nodeToString(this)}`);
        select(this).on('datachange.seriespointlabels', function () {
          debug(`data change on ${nodeToString(this)}`);
          select(this).dispatch('render');
        });
      },
      { once: true }
    )
    .on('render.seriespointlabels', function (e, d) {
      seriesPointLabelsRender(select<GElement, DataSeriesPointCustom>(this));
    });
}

export function seriesPointLabelsRender<
  GElement extends Element,
  Datum extends DataSeriesPointCustom,
  PElement extends BaseType,
  PDatum
>(
  selection: Selection<GElement, Datum, PElement, PDatum>
): Selection<GElement, Datum, PElement, PDatum> {
  return selection.each((d, i, g) => {
    const series = select(g[i]);
    series
      .selectAll<SVGTextElement, DataPoint>('text')
      .data(d.data instanceof Function ? d.data(series) : d.data, d.key)
      .join(
        (enter) =>
          enter
            .append('text')
            .classed('label', true)
            .attr('x', (d) => d.x)
            .attr('y', (d) => d.y - 15)
            .attr('dominant-baseline','middle')
            .attr('text-anchor', 'middle')
            .text((d) => d.label || '')
            .call((s) => selection.dispatch('textenter', { detail: { selection: s } })),
        undefined,
        (exit) =>
          exit
            .classed('exiting', true)
            .call(s =>
              s
                .transition('exit')
                .duration(250)
                .attr('x', (d) => d.x)
                .attr('y', (d) => d.y - 15)
                .remove()
            )
            .call((t) => selection.dispatch('textexit', { detail: { transition: t } }))
      )
      .call((s) =>
        s
          .transition('update')
          .duration(250)
          .ease(easeCubicOut)
          .attr('x', (d) => d.x)
          .attr('y', (d) => d.y - 15)
      )
      .call((s) => selection.dispatch('textupdate', { detail: { selection: s } }));
  });
}

export function seriesPointLine<
  GElement extends Element,
  Datum extends DataSeriesPointCustom,
  PElement extends BaseType,
  PDatum
>(
  selection: Selection<GElement, Datum, PElement, PDatum>,
  lineThickness: number = 1,
  lineColor: string = "black",
  lineType: PathType = 'line',
  orderComparator?: (a: any, b: any) => number
): Selection<GElement, Datum, PElement, PDatum> {
  return selection
    .classed('series-point-line', true)
    .on(
      'render.seriespointline-initial',
      function () {
        debug(`render on data change on ${nodeToString(this)}`);
        select(this).on('datachange.seriespointline', function () {
          debug(`data change on ${nodeToString(this)}`);
          select(this).dispatch('render');
        });
      },
      { once: true }
    )
    .on('render.seriespointline', function (e, d) {
      seriesPointLineRender(select<GElement, DataSeriesPointCustom>(this), lineThickness, lineColor, lineType, orderComparator);
    });
}

function lineCommand (point: DataPoint) {
  return `L ${point.x},${point.y}`;
}

function bezierTangent (a: DataPoint, b: DataPoint) : { length: number, angle: number }  {
  const diffX = b.x - a.x;
  const diffY = b.y - a.y;
  return {
    length: Math.sqrt(Math.pow(diffX, 2) + Math.pow(diffY,2)),
    angle: Math.atan2(diffY, diffX)
  }
}

function bezierControlPoint (current: DataPoint, previous: DataPoint|undefined, next: DataPoint|undefined, reverse?: Boolean) : {x:number, y:number} {
  const p = previous || current;
  const n = next || current;
  const tangent =  bezierTangent(p, n);
  const smoothing = 0.15;
  const angle = tangent.angle + (reverse ? Math.PI : 0);
  const length = tangent.length * smoothing;
  const x = current.x + Math.cos(angle) * length;
  const y = current.y + Math.sin(angle) * length;
  return {x, y};
}

function bezierCommand (point: DataPoint, i: number, a: DataPoint[]): string {
  const cps = bezierControlPoint(a[i - 1], a[i - 2], point);
  const cpe = bezierControlPoint(point, a[i - 1], a[i + 1], true);
  return `C ${cps.x},${cps.y} ${cpe.x},${cpe.y} ${point.x},${point.y}`;
}

export type PathType = 'line'|'smooth';

function deduceCommand(type: PathType) {
  switch(type) {
    case 'smooth':
      return bezierCommand;
    case 'line':
    default:
      return lineCommand;
  }
}

/**
 * adepted from example at
 * https://francoisromain.medium.com/smooth-a-svg-path-with-cubic-bezier-curves-e37b49d46c74
 *
 * @param points
 */
function makePath (points : DataPoint[], type: PathType = 'line' ) : string {
  const d = points.map((point: DataPoint, i: number, a: DataPoint[] ) => {
    if (i === 0) {
      return `M ${point.x},${point.y}`;
    } else {
      return deduceCommand(type)(point, i, a);
    }
  }).join(' ');

  return d;
}

export function seriesPointLineRender<
  GElement extends Element,
  Datum extends DataSeriesPointCustom,
  PElement extends BaseType,
  PDatum
>(
  selection: Selection<GElement, Datum, PElement, PDatum>,
  lineThickness: number = 1,
  lineColor: string = "black",
  lineType: PathType = "line",
  orderComparator?: (a: any, b: any) => number
): Selection<GElement, Datum, PElement, PDatum> {
  return selection.each((d, i, g) => {
    const series = select(g[i]);
    const data = d.data instanceof Function ? d.data(series) : d.data;

    if(orderComparator != null) {
      data.sort(orderComparator)
    }

    const path = makePath(data, lineType);

    series.selectAll<SVGPolylineElement, String>('path')
    .data([path])
    .join(
      (enter) =>
       enter
        .append('path')
        .classed('line', true)
        .attr('d', (d) => d)
        .attr('stroke', lineColor)
        .attr('fill', 'none')
        .attr('stroke-width', lineThickness),
      undefined,
      (exit) =>
        exit
          .classed('exiting', true)
          .call((s) =>
            s
              .transition('exit')
              .duration(250)
              .attr('d', (d) => d)
              .remove()
          )
    )
    .call((s) =>
      s
        .transition('update')
        .duration(250)
        .ease(easeCubicOut)
        .attr('d', (d) => d)
    )
  });
}
