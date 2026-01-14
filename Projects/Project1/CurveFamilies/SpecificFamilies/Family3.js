import { GenericFamily } from "../GenericFamily.js";
export class Family3 extends GenericFamily {
  static startValues = { a: 1.0, b: 8.6, t0: 0.0, t1: Math.PI * 10.0 };
  constructor() {
    //call the parent class constructor and set initial values
    super(Family3.startValues);
  }
}
