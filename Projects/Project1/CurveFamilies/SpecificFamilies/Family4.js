import { GenericFamily } from "../GenericFamily.js";
export class Family4 extends GenericFamily {
  static startValues = { a: 7.6, b: 5.1, t0: 0.0, t1: 10.0 };
  constructor() {
    //call the parent class constructor and set initial values
    super(Family4.startValues);
  }
}
