export class CirclesIterator {
  constructor(circles, size) {
    //creates an iterator for the given array of circles and size
    this.circles = circles;
    this.currentIndex = 0;
    this.size = size;
  }

  //returns true if there are more circles to iterate over
  hasNext() {
    return this.currentIndex < this.size;
  }

  //returns the next circle in the array and increments the index
  next() {
    return this.circles[this.currentIndex++];
  }
}