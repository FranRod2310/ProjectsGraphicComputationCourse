import { GenericFamily } from "../GenericFamily.js";
export class Family5 extends GenericFamily {
  static startValues = { a: 1.0, b: 4.0, t0: 0.0, t1: 10.0 };
  constructor() {
    //call the parent class constructor and set initial values
    super(Family5.startValues);
  }

}
