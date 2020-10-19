import { Primitive } from 'd3-array';
import { BaseType, Selection } from 'd3-selection';
import { Transition } from 'd3-transition';

export function nullFunction() {}

// Code inspired by https://stackoverflow.com/a/22909984
export function getComputedStyleWithoutDefaults(
  element: SVGElement,
  properties: string[]
): PrimitiveObject {
  // creating an empty dummy object to compare with
  var dummy = document.createElementNS(
    'http://www.w3.org/2000/svg',
    'element-' + new Date().getTime()
  );
  element.parentNode!.appendChild(dummy);

  // getting computed styles for both elements
  var defaultStyles = getComputedStyle(dummy);
  var elementStyles = getComputedStyle(element);

  // calculating the difference
  var diffObj = {};
  for (var i = 0; i < properties.length; ++i) {
    if (defaultStyles[properties[i]] !== elementStyles[properties[i]]) {
      diffObj[properties[i]] = elementStyles[properties[i]];
    }
  }

  // clear dom
  dummy.remove();

  return diffObj;
}

export type Attributes = {
  [name: string]: string | number | boolean | Attributes | null;
};

export function applyAttributes(
  selection:
    | Selection<BaseType, unknown, BaseType, unknown>
    | Transition<BaseType, unknown, BaseType, unknown>,
  attributes: Attributes
) {
  for (const name in attributes) {
    const value = attributes[name];
    if (value === null) selection.attr(name, null);
    else if (typeof value === 'object') {
      // → name = child selector, value = child attributes
      selection.selectAll<BaseType, unknown>(name).call(applyAttributes, value);
      continue;
    } else selection.attr(name, value);
  }
}

export function deepExtend(target: any, ...args: any[]) {
  target = target || {};
  for (let i = 0; i < args.length; i++) {
    const obj = args[i];
    if (!obj) continue;
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        if (!obj[key]) {
          delete target[key];
        } else if (typeof obj[key] === 'object') {
          if (obj[key] instanceof Array == true) {
            target[key] = obj[key].slice(0);
          } else {
            target[key] = deepExtend(target[key], obj[key]);
          }
        } else {
          target[key] = obj[key];
        }
      }
    }
  }
  return target;
}

export interface IDictionary<TValue> {
  [id: string]: TValue;
}

export type PrimitiveObject = { [key: string]: Primitive };

export interface ISize {
  width: number;
  height: number;
}

export interface IStringable {
  toString(): string;
}
