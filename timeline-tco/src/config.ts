import { type dateUtils, type ImmutableArray, type ImmutableObject, type UseDataSource, type AllDataSourceTypes } from 'jimu-core'
import { type DateTimeUnits, type DateUnitInputValue } from 'jimu-ui/advanced/style-setting-components'

// export type TimeStyle = 'Classic' | 'Modern'

export enum TimeStyle {
  Classic = 'CLASSIC',
  Modern = 'MODERN'
}

export enum TimeSpeed {
  Slowest = 'SLOWEST',
  Slow = 'SLOW',
  Medium = 'MEDIUM',
  Fast = 'FAST',
  Fastest = 'FASTEST'
}

export enum TimeDisplayStrategy {
  current = 'CURRENT',
  cumulatively = 'CUMULATIVE'
}

export interface timeSpanValue {
  value: number | dateUtils.VirtualDateType
  offset?: DateUnitInputValue
}
export interface timeSettings {
  layerList: ImmutableArray<UseDataSource>
  startTime?: timeSpanValue
  endTime?: timeSpanValue
  accuracy?: DateTimeUnits
  timeDisplayStrategy?: TimeDisplayStrategy
  stepLength?: DateUnitInputValue
  dividedCount?: number
  speed?: TimeSpeed
}

// eslint-disable-next-line  @typescript-eslint/naming-convention
export interface config {
  dataSourceType?: AllDataSourceTypes
  honorTimeSettings?: boolean
  timeStyle?: TimeStyle
  // Appearance
  foregroundColor?: any
  backgroundColor?: any
  sliderColor?: any
  // Display options
  enablePlayControl?: boolean
  autoPlay?: boolean
  timeSettings?: timeSettings
}

export type IMConfig = ImmutableObject<config>
