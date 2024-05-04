import { type ImmutableObject } from 'seamless-immutable'

export interface Config {
  exampleConfigProperty: string
  scales: any[]
}

export type IMConfig = ImmutableObject<Config>
