import { type ImmutableObject } from 'seamless-immutable'

export interface Config {
  title: string,
  layers:any[];
}

export type IMConfig = ImmutableObject<Config>
