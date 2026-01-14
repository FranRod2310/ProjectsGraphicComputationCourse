import { vec2, vec3, vec4 } from "../../../libs/MV.js";

export class GenericFamily {
    //limits for the curve display area
    static minCurveStartValue = -5.0;
    static maxCurveStartValue = 5.0;
    //minimum value for t1 to avoid invalid intervals
    static minT1Value = 0.1;
    static valueToAdd = 0.01;
    //value to change the interval t1
    static intervalValueToAdd = 0.1;
    static numVariables = 2;
    static INCREMENT = 1;
    static DECREMENT = -1;

    constructor(startValues) {
        //set parameters to the initial values
        this.startValues = startValues;
        this.resetParameters();
        this.Xmin = GenericFamily.minCurveStartValue;
        this.Xmax = GenericFamily.maxCurveStartValue;
        this.Ymin = GenericFamily.minCurveStartValue;
        this.Ymax = GenericFamily.maxCurveStartValue;
    }
    //get the coefficients of the curve equation
    getCoefs() {
        return vec3(this.a, this.b, 0.0);
    }
    //get the number of coefficients
    getNumCoefs() {
        return GenericFamily.numVariables;
    }
    //get the interval of the curve
    getInterval() {
        return vec2(this.t0, this.t1);
    }
    //get the limits of the curve display area
    getLimits() {
        return vec4(this.Xmin, this.Xmax, this.Ymin, this.Ymax);
    }
    //set the limits of the curve display area
    setXmin(value) {
        this.Xmin = value;
    }
    setXmax(value) {
        this.Xmax = value;
    }
    setYmin(value) {
        this.Ymin = value;
    }
    setYmax(value) {
        this.Ymax = value;
    }
    //increments the current parameter
    incrementCurrentParameter() {
        this.#updateCurrentParameter(GenericFamily.INCREMENT);
    }

    //decrements the current parameter
    decrementCurrentParameter() {
        this.#updateCurrentParameter(GenericFamily.DECREMENT);
    }

    //updates the current parameter based on the sign (+/-)
    #updateCurrentParameter(sign) {
        switch (this.currentParameter) {
        case 1:
            this.a += GenericFamily.valueToAdd * sign;
            break;
        case 2:
            this.b += GenericFamily.valueToAdd * sign;
            break;
        }
    }

    //increments the interval t1
    incrementInterval() {
        this.t1 += GenericFamily.intervalValueToAdd;
    }

    //decrements the interval t1
    decrementInterval() {
        if (this.t1 > GenericFamily.minT1Value)
            this.t1 -= GenericFamily.intervalValueToAdd;
    }

    //moves to the next parameter
    nextParameter() {
        this.#changeCurrentParameter(GenericFamily.INCREMENT);
    }

    //moves to the previous parameter
    previousParameter() {
        this.#changeCurrentParameter(GenericFamily.DECREMENT);
    }
    
    //changes the current parameter based on the direction (+/-)
    #changeCurrentParameter(direction) {
        if (direction < 0) {
            this.currentParameter -= 1;
            this.currentParameter = this.currentParameter < 1 ? GenericFamily.numVariables : this.currentParameter;
        } else {
            this.currentParameter += 1;
            this.currentParameter = (this.currentParameter % (GenericFamily.numVariables + 1)) || 1;
        }
    }

    //resets parameters to their initial values
    resetParameters() {
        this.a = this.startValues.a;
        this.b = this.startValues.b;
        this.t0 = this.startValues.t0;
        this.t1 = this.startValues.t1;
        this.currentParameter = 1;
    }

    //moves the curve display area based on a delta and the width/height
    moveCurve(delta, width, height) {
        var MoveFactor = this.Xmax - this.Xmin;
        this.setXmin(this.Xmin + MoveFactor * delta[0] / width);
        this.setXmax(this.Xmax + MoveFactor * delta[0] / width);
        this.setYmin(this.Ymin - MoveFactor * delta[1] / height);
        this.setYmax(this.Ymax - MoveFactor * delta[1] / height);
    }

    //zooms in/out the curve display area based on a factor
    zoom(factor) {
        var centerX = 0.5 * (this.Xmax + this.Xmin);
        var centerY = 0.5 * (this.Ymax + this.Ymin);
        var rangeX = this.Xmax - this.Xmin;
        var rangeY = this.Ymax - this.Ymin;
        this.Xmax = centerX + 0.5 * rangeX * factor;
        this.Xmin = centerX - 0.5 * rangeX * factor;
        this.Ymax = centerY + 0.5 * rangeY * factor;
        this.Ymin = centerY - 0.5 * rangeY * factor;
    }
}
