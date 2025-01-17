import { BaseType, select, Selection } from 'd3-selection';
import { Position, positionToTransformAttr } from '../core';
import { dataSeries, DataSeries } from '../core/series';

export interface DataLabel extends Position {
  text: string | number;
  // todo: add index property?
  key?: string;
}

export interface DataSeriesLabel extends DataSeries<DataLabel> {}

export function dataSeriesLabel(data?: Partial<DataSeriesLabel>): DataSeriesLabel {
  return dataSeries({
    data: data?.data,
    key: data?.key || ((d, i) => d.key || i),
  });
}

export function seriesLabel<
  GElement extends Element,
  Datum extends DataSeriesLabel,
  PElement extends BaseType,
  PDatum
>(
  selection: Selection<GElement, Datum, PElement, PDatum>
): Selection<GElement, Datum, PElement, PDatum> {
  return selection
    .classed('series-label', true)
    .attr('text-anchor', 'middle')
    .attr('dominant-baseline', 'middle')
    .attr('font-size', '0.8em')
    .on('render.serieslabel', function (e, d) {
      renderSeriesLabel(select<GElement, Datum>(this));
    });
}

export function renderSeriesLabel<
  GElement extends Element,
  Datum extends DataSeriesLabel,
  PElement extends BaseType,
  PDatum
>(
  selection: Selection<GElement, Datum, PElement, PDatum>
): Selection<GElement, Datum, PElement, PDatum> {
  return selection.each((d, i, g) => {
    const series = select(g[i]);
    series
      .selectAll<SVGTextElement, DataLabel>('text')
      .data(d.data instanceof Function ? d.data(series) : d.data, d.key)
      .join(
        (enter) =>
          enter
            .append('text')
            .classed('label', true)
            .call((s) => positionToTransformAttr(s, (d) => d))
            .attr('font-size', '0em')
            .attr('opacity', 0)
            .call((s) => selection.dispatch('labelenter', { detail: { selection: s } })),
        undefined,
        (exit) =>
          exit
            .classed('exiting', true)
            .call((s) => selection.dispatch('labelexit', { detail: { selection: s } }))
            .transition()
            .duration(250)
            .attr('font-size', '0em')
            .attr('opacity', 0)
            .remove()
            .call((t) => selection.dispatch('labelexittransition', { detail: { transition: t } }))
      )
      .call((s) => selection.dispatch('labelupdate', { detail: { selection: s } }))
      .transition()
      .duration(250)
      .call((t) => positionToTransformAttr(t, (d) => d))
      .attr('font-size', '1em')
      .attr('opacity', 1)
      .text((d) => d.text)
      .call((t) => selection.dispatch('labelupdatetransition', { detail: { transition: t } }));
  });
}
