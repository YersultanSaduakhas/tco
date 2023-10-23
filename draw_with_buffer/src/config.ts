import { type ImmutableObject } from "seamless-immutable";

export interface Config {
  exampleConfigProperty: string;
}

export type IMConfig = ImmutableObject<Config>;

export enum UnitType {
  Miles = "Miles",
  Kilometers = "Kilometers",
  Feet = "Feet",
  Meters = "Meters",
  NauticalMiles = "NauticalMiles",
}
