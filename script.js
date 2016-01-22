"use strict";

const createSketch = ($scope, controller, element) => {
  let mousedown = false;
  Sketch.create({
    container: element,
    autoclear: false,
    keydown(e) {
      if (this.keys.C) {
        $scope.$apply(() => {
          mousedown = false;
          controller.clear();
        });
      }
    },
    mousedown(e) {
      $scope.$apply(() => {
        mousedown = true;
        controller.push_point([e.x, e.y]);
      });
    },
    mouseup(e) {
      $scope.$apply(() => {
        mousedown = false;
        controller.end_stroke();
      });
    },
    touchmove() {
      if (mousedown && this.touches.length > 0) {
        $scope.$apply(() => {
          const touch = this.touches[0];
          controller.maybe_push_point([touch.ox, touch.oy]);
          controller.push_point([touch.x, touch.y]);
        });
      }
    }
  });
}

const MakeMeAHanziController = function($scope) {
  this.width = () => window.innerWidth;
  this.height = () => window.innerHeight;
  this.strokes = [];
  this.stroke = () => this._d(this._stroke);
  this.output = 'Loading...';

  this._stroke = [];
  this._strokes = [];
  this._matcher = null;

  getMediansPromise().then((medians) => {
    this._matcher = new Matcher(medians);
    $scope.$apply(() => {
      this.output = 'Ready!';
    });
  });

  this._d = (path) => {
    if (path.length < 2) return '';
    const result = [];
    const point = (i) => `${path[i][0]} ${path[i][1]}`;
    const midpoint = (i) => `${(path[i][0] + path[i + 1][0])/2} ` +
                            `${(path[i][1] + path[i + 1][1])/2}`;
    const push = (x) => result.push(x);
    ['M', point(0), 'L', midpoint(0)].map(push);
    for (var i = 1; i < path.length - 1; i++) {
      ['Q', point(i), midpoint(i)].map(push);
    }
    ['L', point(path.length - 1)].map(push);
    return result.join(' ');
  };

  this.clear = () => {
    this.strokes = [];
    this._stroke = [];
    this._strokes = [];
  }
  this.end_stroke = () => {
    if (this._stroke.length > 1) {
      this.strokes.push(this._d(this._stroke));
      this._strokes.push(this._stroke);
      this._stroke = [];

      if (this._matcher) {
        this.output = this._matcher.match(this._strokes);
      }
    }
  }
  this.maybe_push_point = (point) => {
    if (this._stroke.length === 0) {
      this.push_point(point);
    }
  }
  this.push_point = (point) => {
    if (point[0] != null && point[1] != null) {
      this._stroke.push(point);
    }
  }

  createSketch($scope, this, document.getElementById('input'));
}

angular.module('makemeahanzi', [])
       .controller('MakeMeAHanziController', MakeMeAHanziController);