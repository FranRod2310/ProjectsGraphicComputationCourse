import { Circle } from "./Circle.js";
import { CirclesIterator } from "./CirclesIterator.js";

export class CirclesHandler {
  static maxNumberOfCircles = 15;
  static tolerance = 0.08; //tolerance to consider two circles are intersecting
  //value to move circles apart when they are intersecting (in case they get stuck because of not detecting intersection)
  static valueToGetCirclesApart = 0.01;
  constructor() {
    this.circles = [];
  }

  //adds a circle if not exceeding max number of circles
  createCircle(ratio) {
    if (this.circles.length >= CirclesHandler.maxNumberOfCircles)
       return;
    let circle;
    let wrongCenter = true;
    //calculate a center that will not be inside another circle
    while (wrongCenter) {
      circle = new Circle();
      wrongCenter = false;
      for (let i = 0; i < this.circles.length; i++) {
        const otherCircle = this.circles[i];
        wrongCenter = this.#isInside(circle.getCircle(), otherCircle.getCircle(), ratio);
        if (wrongCenter) 
          break;
      }
    }
    this.circles.push(circle);
  }

  //removes the last circle added
  removeCircle() {
    this.circles.pop();
  }

  //makes two circles bounce off each other by exchanging their movement vectors
  #bounce(circle1, circle2) {
    const temp = circle1.getMoveCor();
    const c1 = circle1.getCircle();
    const c2 = circle2.getCircle();
    let x1ToMove, y1ToMove, x2ToMove, y2ToMove;

    x1ToMove = (Math.min(c1[0], c2[0]) == c1[0]) ? -CirclesHandler.valueToGetCirclesApart : CirclesHandler.valueToGetCirclesApart;
    x2ToMove = -x1ToMove;
    y1ToMove = (Math.min(c1[1], c2[1]) == c1[1]) ? -CirclesHandler.valueToGetCirclesApart : CirclesHandler.valueToGetCirclesApart;
    y2ToMove = -y1ToMove;
    //move circles apart until they are not intersecting anymore (in case they get stuck because of not detecting intersection)
    while (this.#isInside(circle1.getCircle(), circle2.getCircle(), 1.0)) {
      this.#updateSingleCircle(circle1, x1ToMove, y1ToMove);
      this.#updateSingleCircle(circle2, x2ToMove, y2ToMove);
    }
    //exchange movement vectors
    circle1.setMoveCor(circle2.getMoveCor()[0], circle2.getMoveCor()[1]);
    circle2.setMoveCor(temp[0], temp[1]);
  }

  //updates the center of a single circle by adding the given values to its current center
  #updateSingleCircle(circle, xValueToAdd, yValueToAdd) {
    const c = circle.getCircle();
    circle.setCircleCenter(c[0] + xValueToAdd, c[1] + yValueToAdd);
  }

  //updates all circles, checking for intersections and bouncing them off each other and the walls
  updateCircles(ratio) {
    //check for intersections between circles
    for (let i = 0; i < this.circles.length; i++) {
      const circle = this.circles[i];
      for (let j = 0; j < i; j++) {
        const otherCircle = this.circles[j];
        if (this.#areIntersecting(circle.getCircle(), otherCircle.getCircle(), ratio)) {
          this.#bounce(circle, otherCircle);
        }
      }
      const c = circle.getCircle();
      var centerX = c[0];
      var centerY = c[1];
      var radius = c[2];

      //bounce off walls
      if ((centerX + radius) / ratio > 1.0 && circle.getMoveCor()[0] > 0)
        circle.setMoveCor(-circle.getMoveCor()[0], circle.getMoveCor()[1]);
      if (centerY + radius > 1.0 && circle.getMoveCor()[1] > 0)
        circle.setMoveCor(circle.getMoveCor()[0], -circle.getMoveCor()[1]);
      if ((centerX - radius) / ratio < -1.0 && circle.getMoveCor()[0] < 0)
        circle.setMoveCor(-circle.getMoveCor()[0], circle.getMoveCor()[1]);
      if (centerY - radius < -1.0 && circle.getMoveCor()[1] < 0)
        circle.setMoveCor(circle.getMoveCor()[0], -circle.getMoveCor()[1]);
      circle.updateCenter();
    }
  }

  //checks if two circles are intersecting (with some tolerance)
  #areIntersecting(c1, c2, ratio) {
    let radius1 = c1[2];
    let radius2 = c2[2];

    const centerX1 = c1[0] / ratio;
    const centerY1 = c1[1];
    const centerX2 = c2[0] / ratio;
    const centerY2 = c2[1];
    const rx1 = radius1 / ratio;
    const ry1 = radius1;
    const rx2 = radius2 / ratio;
    const ry2 = radius2;

    // Point between the two centers
    const xToTest = (centerX1 + centerX2) / 2.0;
    const yToTest = (centerY1 + centerY2) / 2.0;

    // Ellipse equations for the two circles (stretched by the aspect ratio)
    const e1 = Math.pow(xToTest - centerX1, 2.0) / Math.pow(rx1, 2.0) + Math.pow(yToTest - centerY1, 2.0) / Math.pow(ry1, 2.0);
    const e2 = Math.pow(xToTest - centerX2, 2.0) / Math.pow(rx2, 2.0) + Math.pow(yToTest - centerY2, 2.0) / Math.pow(ry2, 2.0);

    //check if the point satisfies both ellipse equations (with some tolerance)
    return (e1 - 1.0 < CirclesHandler.tolerance && e1 - 1.0 > -CirclesHandler.tolerance && e2 - 1.0 < CirclesHandler.tolerance && e2 - 1.0 > -CirclesHandler.tolerance) ? true : false;
  }

  //checks if the center of c1 is inside c2
  #isInside(c1, c2, ratio) {
    const radius2 = c2[2];
    const rx2 = radius2 / ratio;
    const ry2 = radius2;
    const c1x = c1[0] / ratio;
    const c1y = c1[1];
    const c2x = c2[0] / ratio;
    const c2y = c2[1];

    const xToTest = (c1x + c2x) / 2.0;
    const yToTest = (c1y + c2y) / 2.0;

    // Ellipse equation for the second circle (stretched by the aspect ratio)
    const e2 = Math.pow(xToTest - c2x, 2.0) / Math.pow(rx2, 2.0) + Math.pow(yToTest - c2y, 2.0) / Math.pow(ry2, 2.0);
    //return true if the point is inside the ellipse 
    return (e2 < 1.0) ? true : false;
  }

  //returns an iterator for the circles
  getCirclesIterator() {
    return new CirclesIterator(this.circles, this.circles.length);
  }

  //returns the maximum number of circles allowed
  getMaxNumberOfCircles() {
    return CirclesHandler.maxNumberOfCircles;
  }
  
  //returns the current number of circles
  getNumberOfCircles() {
    return this.circles.length;
  }
}
