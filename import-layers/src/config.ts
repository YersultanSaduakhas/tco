import { type ImmutableObject } from 'seamless-immutable'

export interface Config {
  exampleConfigProperty: string,
  layers:any[];
}

export type IMConfig = ImmutableObject<Config>
