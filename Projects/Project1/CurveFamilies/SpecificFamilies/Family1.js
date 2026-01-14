import { vec3 } from "../../../../libs/MV.js";
import { GenericFamily } from "../GenericFamily.js";

export class Family1 extends GenericFamily {
  static NUM_VARIABLES = 3;
  static startValues = { a: 1.0, b: 1.0, c: 0.0, t0: 0.0, t1: Math.PI * 2.0 };

  constructor() {
    //call the parent class constructor and set initial values
    super(Family1.startValues);
    this.c = Family1.startValues.c;
  }

  //get the coefficients of the curve equation
  getCoefs() {
    return vec3(this.a, this.b, this.c);
  }

  //get the number of coefficients
  getNumCoefs() {
      return Family1.NUM_VARIABLES;
  }

  //increments the current parameter
  incrementCurrentParameter() {
    this.#updateCurrentParameter(Family1.INCREMENT);
  }
  
  //decrements the current parameter
  decrementCurrentParameter() {
    this.#updateCurrentParameter(Family1.DECREMENT);
  }

  //updates the current parameter based on the sign (+/-)
  #updateCurrentParameter(sign) {
    switch (this.currentParameter) {
      case 1:
        this.a += Family1.valueToAdd * sign;
        break;
      case 2:
        this.b += Family1.valueToAdd * sign;
        break;
      case 3:
        this.c += Family1.valueToAdd * sign;
        break;
    }
  }

  //moves to the next parameter
  nextParameter() {
    this.#changeCurrentParameter(Family1.INCREMENT);
  }
  
  //moves to the previous parameter
  previousParameter() {
    this.#changeCurrentParameter(Family1.DECREMENT);
  }

  //changes the current parameter based on the direction (+/-)
  #changeCurrentParameter(direction) {
    if (direction < 0) {
      this.currentParameter -= 1;
      this.currentParameter = this.currentParameter < 1 ? Family1.NUM_VARIABLES : this.currentParameter;
    } else {
      this.currentParameter += 1;
      this.currentParameter = (this.currentParameter % (Family1.NUM_VARIABLES + 1)) || 1;
    }
  }

  //resets parameters to their initial values
  resetParameters() {
    super.resetParameters();
    this.c = Family1.startValues.c;
  }
}
