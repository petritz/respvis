import {
  applyBandScaleConfig,
  applyScaleConfig,
  bandScale,
  IBandScaleConfig,
  IScaleConfig,
  linearScale,
  IRect,
  utils,
} from '../core';

export enum BarOrientation {
  Vertical,
  Horizontal,
}

export interface IBars {
  bars(): IRect<number>[];
}

export interface IBarPositionerConfig {
  categories: any[];
  categoryScale: IBandScaleConfig;
  values: number[];
  valueScale: IScaleConfig<number, number, number>;
  orientation: BarOrientation;
}

export interface IBarPositioner extends IBars {
  config(config: IBarPositionerConfig): this;
  config(): IBarPositionerConfig;
  fitInSize(size: utils.ISize): this;
}

export const DEFAULT_BAR_POSITIONER_CONFIG: IBarPositionerConfig = {
  categories: [],
  categoryScale: { scale: bandScale(), domain: [], padding: 0.1, nice: true },
  values: [],
  valueScale: { scale: linearScale<number>(), domain: [], nice: true },
  orientation: BarOrientation.Vertical,
};

export class BarPositioner implements IBarPositioner {
  private _config: IBarPositionerConfig;
  private _bars: IRect<number>[] = [];

  constructor() {
    this._config = DEFAULT_BAR_POSITIONER_CONFIG;
  }

  config(config: IBarPositionerConfig): this;
  config(): IBarPositionerConfig;
  config(config?: IBarPositionerConfig): any {
    if (config === undefined) return this._config;
    utils.deepExtend(this._config, config);
    this._config.categoryScale.domain = this._config.categories;
    applyBandScaleConfig(this._config.categoryScale);
    applyScaleConfig(this._config.valueScale);
    return this;
  }

  fitInSize(size: utils.ISize): this {
    const categoryScale = this._config.categoryScale.scale,
      valueScale = this._config.valueScale.scale;

    if (this._config.orientation === BarOrientation.Vertical) {
      categoryScale.range([0, size.width]);
      valueScale.range([size.height, 0]);
    } else if (this._config.orientation === BarOrientation.Horizontal) {
      categoryScale.range([0, size.height]);
      valueScale.range([0, size.width]);
    }

    this._bars = [];

    for (let i = 0; i < this._config.values.length; ++i) {
      const c = this._config.categories[i];
      const v = this._config.values[i];

      if (this._config.orientation === BarOrientation.Vertical) {
        this._bars.push({
          x: categoryScale(c)!,
          y: Math.min(valueScale(0)!, valueScale(v)!),
          width: categoryScale.bandwidth(),
          height: Math.abs(valueScale(0)! - valueScale(v)!),
        });
      } else if (this._config.orientation === BarOrientation.Horizontal) {
        this._bars.push({
          x: Math.min(valueScale(0)!, valueScale(v)!),
          y: categoryScale(c)!,
          width: Math.abs(valueScale(0)! - valueScale(v)!),
          height: categoryScale.bandwidth(),
        });
      }
    }

    return this;
  }

  bars(): IRect<number>[] {
    return this._bars;
  }
}

export function barPositioner(): BarPositioner {
  return new BarPositioner();
}
