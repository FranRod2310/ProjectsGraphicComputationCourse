import { vec2, vec3 } from "../../../libs/MV.js";
export class Circle {
  static radius = 0.15;
  //min and max values for the center coordinates to ensure the circle is always fully visible
  static minCenter = -1.0 + Circle.radius;
  static maxCenter = 1.0 - Circle.radius;

  constructor() {
    //random center coordinates within the allowed range, with random movement vector
    this.centerX = (Circle.minCenter + Math.random() * (Circle.maxCenter - Circle.minCenter));
    this.centerY = (Circle.minCenter + Math.random() * (Circle.maxCenter - Circle.minCenter));
    this.moveCor = vec2(Math.random()/100, Math.random()/100);
  }

  //returns a vec3 with the circle center coordinates and radius
  getCircle() {
    return vec3(this.centerX, this.centerY, Circle.radius);
  }

  //updates the center of the circle by adding its movement vector to its current center
  updateCenter() {
    this.centerX += this.moveCor[0];
    this.centerY += this.moveCor[1];
  }

  //returns the radius of the circle
  getRadius() {
    return Circle.radius;
  }

  //returns the movement vector of the circle
  getMoveCor() {
    return this.moveCor;
  }

  //sets the movement vector of the circle
  setMoveCor(x,y) {
    this.moveCor = vec2(x,y);
  }

  //sets the center of the circle
  setCircleCenter(x,y) {
    this.centerX = x;
    this.centerY = y;
  }
}
