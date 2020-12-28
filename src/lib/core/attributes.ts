import { BaseType, select, Selection } from 'd3-selection';
import { SelectionOrTransition, Transition } from 'd3-transition';
import { calculateSpecificity } from './utils';

export interface IAttributes {
  [name: string]: string | number | boolean | null;
}

export interface INestedAttributes {
  [name: string]: string | number | boolean | null | INestedAttributes;
}

function _setOrTransitionUniformAttributes(
  selectionOrTransition: SelectionOrTransition<BaseType, unknown, BaseType, unknown>,
  attributes: IAttributes
) {
  for (const name in attributes) {
    const value = attributes[name];
    if (value === null) selectionOrTransition.attr(name, null);
    else selectionOrTransition.attr(name, value);
  }
}

// # set attributes

export function setUniformAttributes(
  selection: Selection<BaseType, unknown, BaseType, unknown>,
  attributes: IAttributes
) {
  _setOrTransitionUniformAttributes(selection, attributes);
}

export function setBoundUniformAttributes(
  selection: Selection<BaseType, IAttributes, BaseType, unknown>
) {
  selection.call(setUniformAttributes, selection.datum());
}

export function setAttributes(
  selection: Selection<BaseType, unknown, BaseType, unknown>,
  attributes: IAttributes[]
) {
  selection.each((d, i, groups) => select(groups[i]).call(setUniformAttributes, attributes[i]));
}

export function setBoundAttributes(selection: Selection<BaseType, IAttributes, BaseType, unknown>) {
  selection.each((attributes, i, groups) =>
    select(groups[i]).call(setUniformAttributes, attributes)
  );
}

// # transition attributes

export function transitionUniformAttributes(
  transition: Transition<BaseType, unknown, BaseType, unknown>,
  attributes: IAttributes
) {
  _setOrTransitionUniformAttributes(transition, attributes);
}

export function transitionBoundUniformAttributes(
  transition: Transition<BaseType, IAttributes, BaseType, unknown>
) {
  transition.call(transitionUniformAttributes, transition.selection().datum());
}

export function transitionAttributes(
  transition: Transition<BaseType, unknown, BaseType, unknown>,
  attributes: IAttributes[]
) {
  transition.each((d, i, groups) =>
    select(groups[i]).transition(transition).call(transitionUniformAttributes, attributes[i])
  );
}

export function transitionBoundAttributes(
  transition: Transition<BaseType, IAttributes, BaseType, unknown>
) {
  transition.each((attributes, i, groups) =>
    select(groups[i]).transition(transition).call(transitionUniformAttributes, attributes)
  );
}

// # set nested attributes

function _setOrTransitionUniformNestedAttributes(
  selectionOrTransition: SelectionOrTransition<BaseType, unknown, BaseType, unknown>,
  attributes: INestedAttributes
) {
  const selectors: string[] = [];

  for (const name in attributes) {
    const value = attributes[name];
    if (value === null) selectionOrTransition.attr(name, null);
    else if (typeof value === 'object') selectors.push(name);
    else selectionOrTransition.attr(name, value);
  }

  selectors
    .sort((a, b) => calculateSpecificity(a) - calculateSpecificity(b))
    .forEach((selector) =>
      selectionOrTransition
        .selectAll(selector)
        .call(setUniformNestedAttributes, attributes[selector])
    );
}

export function setUniformNestedAttributes(
  selection: Selection<BaseType, unknown, BaseType, unknown>,
  attributes: INestedAttributes
) {
  _setOrTransitionUniformNestedAttributes(selection, attributes);
}

export function setBoundUniformNestedAttributes(
  selection: Selection<BaseType, INestedAttributes, BaseType, unknown>
) {
  selection.call(setUniformNestedAttributes, selection.datum());
}

export function setNestedAttributes(
  selection: Selection<BaseType, unknown, BaseType, unknown>,
  attributes: INestedAttributes[]
) {
  selection.each((d, i, groups) =>
    select(groups[i]).call(setUniformNestedAttributes, attributes[i])
  );
}

export function setBoundNestedAttributes(
  selection: Selection<BaseType, INestedAttributes, BaseType, unknown>
) {
  selection.each((attributes, i, groups) =>
    select(groups[i]).call(setUniformNestedAttributes, attributes)
  );
}

// # transition nested attributes

export function transitionUniformNestedAttributes(
  transition: Transition<BaseType, unknown, BaseType, unknown>,
  attributes: INestedAttributes
) {
  _setOrTransitionUniformNestedAttributes(transition, attributes);
}

export function transitionBoundUniformNestedAttributes(
  transition: Transition<BaseType, INestedAttributes, BaseType, unknown>
) {
  transition.call(transitionUniformNestedAttributes, transition.selection().datum());
}

export function transitionNestedAttributes(
  transition: Transition<BaseType, unknown, BaseType, unknown>,
  attributes: INestedAttributes[]
) {
  transition.each((d, i, groups) =>
    select(groups[i]).transition(transition).call(transitionUniformNestedAttributes, attributes[i])
  );
}

export function transitionBoundNestedAttributes(
  transition: Transition<BaseType, INestedAttributes, BaseType, unknown>
) {
  transition.each((attributes, i, groups) =>
    select(groups[i]).transition(transition).call(transitionUniformNestedAttributes, attributes)
  );
}
