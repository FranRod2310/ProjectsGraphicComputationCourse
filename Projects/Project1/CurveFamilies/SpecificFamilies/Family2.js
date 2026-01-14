import { GenericFamily } from "../GenericFamily.js";
export class Family2 extends GenericFamily {
  static startValues = { a: 1.0, b: 17.0, t0: 0.0, t1: Math.PI * 2.0 };
  constructor() {
    //call the parent class constructor and set initial values
    super(Family2.startValues);
  }
}
