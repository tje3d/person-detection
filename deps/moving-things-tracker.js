(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.tracker = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
var uuidv4 = require('uuid/v4');
var computeBearingIn360 = require('./utils').computeBearingIn360
var computeVelocityVector = require('./utils').computeVelocityVector

// Properties example
// {
//   "x": 1021,
//   "y": 65,
//   "w": 34,
//   "h": 27,
//   "confidence": 26,
//   "name": "car"
// }

// Use a simple incremental unique id for the display
var idDisplay = 0;

exports.ItemTracked = function(properties, frameNb, unMatchedFramesTolerance, fastDelete){
  var DEFAULT_UNMATCHEDFRAMES_TOLERANCE = unMatchedFramesTolerance;
  var itemTracked = {};
  // ==== Private =====
  // Am I available to be matched?
  itemTracked.available = true;
  // Should I be deleted?
  itemTracked.delete = false;
  itemTracked.fastDelete = fastDelete;
  // How many unmatched frame should I survive?
  itemTracked.frameUnmatchedLeftBeforeDying = unMatchedFramesTolerance;
  itemTracked.isZombie = false;
  itemTracked.appearFrame = frameNb;
  itemTracked.disappearFrame = null;
  itemTracked.disappearArea = {};
  // Keep track of the most counted class
  itemTracked.nameCount = {};
  itemTracked.nameCount[properties.name] = 1;
  // ==== Public =====
  itemTracked.x = properties.x;
  itemTracked.y = properties.y;
  itemTracked.w = properties.w;
  itemTracked.h = properties.h;
  itemTracked.name = properties.name;
  itemTracked.confidence = properties.confidence;
  itemTracked.itemHistory = [];
  itemTracked.itemHistory.push({
    x: properties.x,
    y: properties.y,
    w: properties.w,
    h: properties.h,
    confidence: properties.confidence
  });
  itemTracked.velocity = {
    dx: 0,
    dy: 0
  };
  itemTracked.nbTimeMatched = 1;
  // Assign an unique id to each Item tracked
  itemTracked.id = uuidv4();
  // Use an simple id for the display and debugging
  itemTracked.idDisplay = idDisplay;
  idDisplay++
  // Give me a new location / size
  itemTracked.update = function(properties, frameNb){
    // if it was zombie and disappear frame was set, reset it to null
    if(this.disappearFrame) {
      this.disappearFrame = null;
      this.disappearArea = {}
    }
    this.isZombie = false;
    this.nbTimeMatched += 1;
    this.x = properties.x;
    this.y = properties.y;
    this.w = properties.w;
    this.h = properties.h;
    this.confidence = properties.confidence;
    this.itemHistory.push({
      x: this.x,
      y: this.y,
      w: this.w,
      h: this.h,
      confidence: this.confidence
    });
    this.name = properties.name;
    if(this.nameCount[properties.name]) {
      this.nameCount[properties.name]++;
    } else {
      this.nameCount[properties.name] = 1;
    }
    // Reset dying counter
    this.frameUnmatchedLeftBeforeDying = DEFAULT_UNMATCHEDFRAMES_TOLERANCE
    // Compute new velocityVector based on last positions history
    this.velocity = this.updateVelocityVector();
  }
  itemTracked.makeAvailable = function() {
    this.available = true;
    return this;
  }
  itemTracked.makeUnavailable = function() {
    this.available = false;
    return this;
  }
  itemTracked.countDown = function(frameNb) {
    // Set frame disappear number
    if(this.disappearFrame === null) {
      this.disappearFrame = frameNb;
      this.disappearArea = {
        x: this.x,
        y: this.y,
        w: this.w,
        h: this.h
      }
    }
    this.frameUnmatchedLeftBeforeDying--;
    this.isZombie = true;
    // If it was matched less than 1 time, it should die quick
    if(this.fastDelete && this.nbTimeMatched <= 1) {
      this.frameUnmatchedLeftBeforeDying = -1;
    }
  }
  itemTracked.updateTheoricalPositionAndSize = function() {
    this.itemHistory.push({
      x: this.x,
      y: this.y,
      w: this.w,
      h: this.h,
      confidence: this.confidence
    });
    this.x = this.x + this.velocity.dx
    this.y = this.y + this.velocity.dy
  }

  itemTracked.predictNextPosition = function() {
    return {
      x : this.x + this.velocity.dx,
      y : this.y + this.velocity.dy,
      w: this.w,
      h: this.h
    };
  }

  itemTracked.isDead = function() {
    return this.frameUnmatchedLeftBeforeDying < 0;
  }
  // Velocity vector based on the last 15 frames
  itemTracked.updateVelocityVector = function() {
    var AVERAGE_NBFRAME = 15;
    if(this.itemHistory.length <= AVERAGE_NBFRAME) {
      return computeVelocityVector(this.itemHistory[0], this.itemHistory[this.itemHistory.length - 1], this.itemHistory.length);
    } else {
      return computeVelocityVector(this.itemHistory[this.itemHistory.length - AVERAGE_NBFRAME], this.itemHistory[this.itemHistory.length - 1], AVERAGE_NBFRAME);
    }
  }

  itemTracked.getMostlyMatchedName = function() {
    var nameMostlyMatchedOccurences = 0;
    var nameMostlyMatched = '';
    Object.keys(this.nameCount).map((name) => {
      if(this.nameCount[name] > nameMostlyMatchedOccurences) {
        nameMostlyMatched = name;
        nameMostlyMatchedOccurences = this.nameCount[name]
      }
    })
    return nameMostlyMatched;
  }

  itemTracked.toJSONDebug = function(roundInt = true) {
    return {
      id: this.id,
      idDisplay: this.idDisplay,
      x: (roundInt ? parseInt(this.x, 10) : this.x),
      y: (roundInt ? parseInt(this.y, 10) : this.y),
      w: (roundInt ? parseInt(this.w, 10) : this.w),
      h: (roundInt ? parseInt(this.h, 10) : this.h),
      confidence: Math.round(this.confidence * 100) / 100,
      // Here we negate dy to be in "normal" carthesian coordinates
      bearing: parseInt(computeBearingIn360(this.velocity.dx, - this.velocity.dy)),
      name: this.getMostlyMatchedName(),
      isZombie: this.isZombie,
      appearFrame: this.appearFrame,
      disappearFrame: this.disappearFrame
    }
  }

  itemTracked.toJSON = function(roundInt = true) {
    return {
      id: this.idDisplay,
      x: (roundInt ? parseInt(this.x, 10) : this.x),
      y: (roundInt ? parseInt(this.y, 10) : this.y),
      w: (roundInt ? parseInt(this.w, 10) : this.w),
      h: (roundInt ? parseInt(this.h, 10) : this.h),
      confidence: Math.round(this.confidence * 100) / 100,
      // Here we negate dy to be in "normal" carthesian coordinates
      bearing: parseInt(computeBearingIn360(this.velocity.dx, - this.velocity.dy), 10),
      name: this.getMostlyMatchedName(),
      isZombie: this.isZombie
    }
  }

  itemTracked.toMOT = function(frameIndex) {
    return `${frameIndex},${this.idDisplay},${this.x - this.w / 2},${this.y - this.h / 2},${this.w},${this.h},${this.confidence / 100},-1,-1,-1`;
  }

  itemTracked.toJSONGenericInfo = function() {
    return {
      id: this.id,
      idDisplay: this.idDisplay,
      appearFrame: this.appearFrame,
      disappearFrame: this.disappearFrame,
      disappearArea: this.disappearArea,
      nbActiveFrame: this.disappearFrame - this.appearFrame,
      name: this.getMostlyMatchedName()
    }
  }
  return itemTracked;
};

exports.reset = function() {
  idDisplay = 0;
}

},{"./utils":12,"uuid/v4":10}],2:[function(require,module,exports){
/**
 * k-d Tree JavaScript - V 1.01
 *
 * https://github.com/ubilabs/kd-tree-javascript
 *
 * @author Mircea Pricop <pricop@ubilabs.net>, 2012
 * @author Martin Kleppe <kleppe@ubilabs.net>, 2012
 * @author Ubilabs http://ubilabs.net, 2012
 * @license MIT License <http://www.opensource.org/licenses/mit-license.php>
 */(function(e,t){if(typeof define==="function"&&define.amd){define(["exports"],t)}else if(typeof exports==="object"){t(exports)}else{t(e.commonJsStrict={})}})(this,function(e){function t(e,t,n){this.obj=e;this.left=null;this.right=null;this.parent=n;this.dimension=t}function n(e,n,i){function o(e,n,r){var s=n%i.length,u,a;if(e.length===0){return null}if(e.length===1){return new t(e[0],s,r)}e.sort(function(e,t){return e[i[s]]-t[i[s]]});u=Math.floor(e.length/2);a=new t(e[u],s,r);a.left=o(e.slice(0,u),n+1,a);a.right=o(e.slice(u+1),n+1,a);return a}function u(e){function t(e){if(e.left){e.left.parent=e;t(e.left)}if(e.right){e.right.parent=e;t(e.right)}}s.root=e;t(s.root)}var s=this;if(!Array.isArray(e))u(e,n,i);else this.root=o(e,0,null);this.toJSON=function(e){if(!e)e=this.root;var n=new t(e.obj,e.dimension,null);if(e.left)n.left=s.toJSON(e.left);if(e.right)n.right=s.toJSON(e.right);return n};this.insert=function(e){function n(t,r){if(t===null){return r}var s=i[t.dimension];if(e[s]<t.obj[s]){return n(t.left,t)}else{return n(t.right,t)}}var r=n(this.root,null),s,o;if(r===null){this.root=new t(e,0,null);return}s=new t(e,(r.dimension+1)%i.length,r);o=i[r.dimension];if(e[o]<r.obj[o]){r.left=s}else{r.right=s}};this.remove=function(e){function n(t){if(t===null){return null}if(t.obj===e){return t}var r=i[t.dimension];if(e[r]<t.obj[r]){return n(t.left,t)}else{return n(t.right,t)}}function r(e){function u(e,t){var n,r,s,o,a;if(e===null){return null}n=i[t];if(e.dimension===t){if(e.right!==null){return u(e.right,t)}return e}r=e.obj[n];s=u(e.left,t);o=u(e.right,t);a=e;if(s!==null&&s.obj[n]>r){a=s}if(o!==null&&o.obj[n]>a.obj[n]){a=o}return a}function a(e,t){var n,r,s,o,u;if(e===null){return null}n=i[t];if(e.dimension===t){if(e.left!==null){return a(e.left,t)}return e}r=e.obj[n];s=a(e.left,t);o=a(e.right,t);u=e;if(s!==null&&s.obj[n]<r){u=s}if(o!==null&&o.obj[n]<u.obj[n]){u=o}return u}var t,n,o;if(e.left===null&&e.right===null){if(e.parent===null){s.root=null;return}o=i[e.parent.dimension];if(e.obj[o]<e.parent.obj[o]){e.parent.left=null}else{e.parent.right=null}return}if(e.left!==null){t=u(e.left,e.dimension)}else{t=a(e.right,e.dimension)}n=t.obj;r(t);e.obj=n}var t;t=n(s.root);if(t===null){return}r(t)};this.nearest=function(e,t,o){function l(r){function d(e,n){f.push([e,n]);if(f.size()>t){f.pop()}}var s,o=i[r.dimension],u=n(e,r.obj),a={},c,h,p;for(p=0;p<i.length;p+=1){if(p===r.dimension){a[i[p]]=e[i[p]]}else{a[i[p]]=r.obj[i[p]]}}c=n(a,r.obj);if(r.right===null&&r.left===null){if(f.size()<t||u<f.peek()[1]){d(r,u)}return}if(r.right===null){s=r.left}else if(r.left===null){s=r.right}else{if(e[o]<r.obj[o]){s=r.left}else{s=r.right}}l(s);if(f.size()<t||u<f.peek()[1]){d(r,u)}if(f.size()<t||Math.abs(c)<f.peek()[1]){if(s===r.left){h=r.right}else{h=r.left}if(h!==null){l(h)}}}var u,a,f;f=new r(function(e){return-e[1]});if(o){for(u=0;u<t;u+=1){f.push([null,o])}}l(s.root);a=[];for(u=0;u<t;u+=1){if(f.content[u][0]){a.push([f.content[u][0].obj,f.content[u][1]])}}return a};this.balanceFactor=function(){function e(t){if(t===null){return 0}return Math.max(e(t.left),e(t.right))+1}function t(e){if(e===null){return 0}return t(e.left)+t(e.right)+1}return e(s.root)/(Math.log(t(s.root))/Math.log(2))}}function r(e){this.content=[];this.scoreFunction=e}r.prototype={push:function(e){this.content.push(e);this.bubbleUp(this.content.length-1)},pop:function(){var e=this.content[0];var t=this.content.pop();if(this.content.length>0){this.content[0]=t;this.sinkDown(0)}return e},peek:function(){return this.content[0]},remove:function(e){var t=this.content.length;for(var n=0;n<t;n++){if(this.content[n]==e){var r=this.content.pop();if(n!=t-1){this.content[n]=r;if(this.scoreFunction(r)<this.scoreFunction(e))this.bubbleUp(n);else this.sinkDown(n)}return}}throw new Error("Node not found.")},size:function(){return this.content.length},bubbleUp:function(e){var t=this.content[e];while(e>0){var n=Math.floor((e+1)/2)-1,r=this.content[n];if(this.scoreFunction(t)<this.scoreFunction(r)){this.content[n]=t;this.content[e]=r;e=n}else{break}}},sinkDown:function(e){var t=this.content.length,n=this.content[e],r=this.scoreFunction(n);while(true){var i=(e+1)*2,s=i-1;var o=null;if(s<t){var u=this.content[s],a=this.scoreFunction(u);if(a<r)o=s}if(i<t){var f=this.content[i],l=this.scoreFunction(f);if(l<(o==null?r:a)){o=i}}if(o!=null){this.content[e]=this.content[o];this.content[o]=n;e=o}else{break}}}};this.kdTree=n;e.kdTree=n;e.BinaryHeap=r})
},{}],3:[function(require,module,exports){
(function (process){(function (){

var fs = require("fs");
var Tracker = require('./tracker');
var parseArgs = require('minimist')
// Utilities for cleaning up detections input
var isInsideSomeAreas = require('./utils').isInsideSomeAreas;
var ignoreObjectsNotToDetect = require('./utils').ignoreObjectsNotToDetect;
var isDetectionTooLarge = require('./utils').isDetectionTooLarge;

/*
    NOTE: this file is a big mess with piled up code from different use cases
    Should be reworked to be much simpler
    If you are looking for the tracker, look tracker.js file
    this main.js is just giving different way to operate tracker.js
*/

// Export Tracker API to use as a node module
exports.Tracker = Tracker

var debugOutput = false;

// Parse CLI args
var args = parseArgs(process.argv.slice(2));
// Path to raw detections input
var pathRawDetectionsInput = args.input;

if (args.debug) {
  console.log('debug mode');
  // Running in debug mode output full json
  debugOutput = true;
}

// If input path not specified abort
if (!pathRawDetectionsInput) {
  //console.error('Please specify the path to the raw detections file');
  return;
}

// Compute the output file path
// In the same folder with the name tracker.json
var arrayTemp = pathRawDetectionsInput.split('/')
arrayTemp.pop()
var pathToTrackerOutput = arrayTemp.length > 0 ? `${arrayTemp.join('/')}/tracker.json` : `tracker.json`;
var pathToMOTOutput = `${arrayTemp.join('/')}/outputTrackerMOT.txt`

// AlexeyAB darknet mode
var MODE_DARKNET = args.mode === "opendatacam-darknet";

// MOT Challenge mode
var MODE_MOTChallenge = args.mode === "motchallenge";

if (!MODE_MOTChallenge) {
  console.log(`Tracker data will be written here: ${pathToTrackerOutput}`);
} else {
  console.log(`Tracker data will be written here: ${pathToMOTOutput}`);
}

// Specific mode for beat the traffic game
var MODE_BEATTHETRAFFIC = args.mode === "beatthetraffic";
var BUS_AS_TRUCKS = args.busastruck;
var PERSON_AS_MOTORBIKE = args.personasmotorbike;

var LARGEST_DETECTION_ALLOWED = 1920 * 25 / 100;
var DETECT_LIST = ["bicycle", "car", "motorbike", "bus", "truck", "person"];
var TRACKED_LIST = ["car", "motorbike", "truck"]
var IGNORED_AREAS = []; // example: [{"x":634,"y":1022,"w":192,"h":60},{"x":1240,"y":355,"w":68,"h":68}




// Store detections input
var detections = {}

// Store tracker output
var tracker = {}

// Store MOT output
var MOToutput = []

// If MODE is BEATTHETRAFFIC keep all tracker history in memory
if (MODE_BEATTHETRAFFIC) {
  Tracker.enableKeepInMemory();
}

// Parse detections input
fs.readFile(`${pathRawDetectionsInput}`, function (err, f) {

  var lines = [];

  if (MODE_DARKNET) {
    // Parse all 
    try {
      var detectionsFromDarknet = JSON.parse(f);
      // Convert into a format the tracker can handle
      detectionsFromDarknet.map((detectionFromDarknet) => {
        detections[detectionFromDarknet.frame_id] = detectionFromDarknet.objects.map((objectFromDarknet) => {
          return {
            x: objectFromDarknet.relative_coordinates.center_x,
            y: objectFromDarknet.relative_coordinates.center_y,
            w: objectFromDarknet.relative_coordinates.width,
            h: objectFromDarknet.relative_coordinates.height,
            confidence: parseFloat(objectFromDarknet.confidence) * 100,
            name: objectFromDarknet.name
          }
        })
      })
    } catch (e) {
      console.log('Error while parsing JSON input file, make sure it is valid json')
      return;
    }
  }
  else {
    lines = f.toString().split('\n');
    if (!MODE_MOTChallenge) {

      lines.forEach(function (l) {
        try {
          var detection = JSON.parse(l);
          detections[detection.frame] = detection.detections;
        } catch (e) {
          console.log('Error parsing line');
          console.log(l);
        }
      });
    } else {
      // For MOT Challenge detections input
      // format:
      // <frame>, <id>, <bb_left>, <bb_top>, <bb_width>, <bb_height>, <conf>, <x>, <y>, <z>
      // example:
      // 1, -1, 794.27, 247.59, 71.245, 174.88, 0.99999964, -1, -1, -1
      // 1, -1, 1648.1, 119.61, 66.504, 163.24, 0.99999964, -1, -1, -1
      // 2, -1, 1648.1, 119.61, 66.504, 163.24, 0.99999964, -1, -1, -1
      // 2, -1, 1648.1, 119.61, 66.504, 163.24, 0.99999964, -1, -1, -1
      lines.forEach((line) => {
        var detectionOfThisFrameArray = line.split(",");
        var detectionFrameIndex = parseInt(detectionOfThisFrameArray[0], 10);
        if (!Number.isNaN(detectionFrameIndex)) {
          var w = parseFloat(detectionOfThisFrameArray[4]);
          var h = parseFloat(detectionOfThisFrameArray[5]);

          var detection = {
            x: parseFloat(detectionOfThisFrameArray[2]) + w / 2,
            y: parseFloat(detectionOfThisFrameArray[3]) + h / 2,
            w,
            h,
            confidence: parseFloat(detectionOfThisFrameArray[6]) * 100,
            name: ""
          }
          // If it's the first object for this frame, init empty array
          if (!detections[detectionFrameIndex]) {
            detections[detectionFrameIndex] = []
          }
          detections[detectionFrameIndex].push(detection);
        }
      });
    }


    //console.log(JSON.stringify(detections));

  }

  Object.keys(detections).forEach(function (frameNb) {

    let detectionsForThisFrame = detections[frameNb]

    if (MODE_BEATTHETRAFFIC) {
      // Remove unwanted areas
      detectionsForThisFrame = detectionsForThisFrame.filter((detection) => !isInsideSomeAreas(IGNORED_AREAS, detection));
      // Remove unwanted items
      detectionsForThisFrame = ignoreObjectsNotToDetect(detectionsForThisFrame, DETECT_LIST);
      // Remove objects too big
      detectionsForThisFrame = detectionsForThisFrame.filter((detection) => !isDetectionTooLarge(detection, LARGEST_DETECTION_ALLOWED));
    }

    Tracker.updateTrackedItemsWithNewFrame(detectionsForThisFrame, parseInt(frameNb, 10))

    if (!MODE_MOTChallenge) {
      if(MODE_DARKNET) {
        // Do not round coordinates of bbox
        tracker[frameNb] = Tracker.getJSONOfTrackedItems(false);
      } else {
        tracker[frameNb] = Tracker.getJSONOfTrackedItems();
      }
    } else {
      MOToutput = MOToutput.concat(Tracker.getTrackedItemsInMOTFormat(frameNb));
    }

  });

  var allTrackedItems = Tracker.getAllTrackedItems();

  if (MODE_BEATTHETRAFFIC) {

    // Overwrite name for each id with mostly matched name to avoid having
    // tracked item that change types
    // For each frame
    Object.keys(tracker).map((frameNb) => {
      tracker[frameNb] = tracker[frameNb].map((trackedItem) => {
        // Find 
        var item = allTrackedItems.get(trackedItem.id)
        var mostlyMatchedName = trackedItem.name;
        if (item) {
          mostlyMatchedName = item.getMostlyMatchedName()
        }

        if (BUS_AS_TRUCKS) {
          if (mostlyMatchedName === "bus") {
            // console.log('Change bus to truck');
            mostlyMatchedName = "truck"
          }
        }

        if (PERSON_AS_MOTORBIKE) {
          if (mostlyMatchedName === "person") {
            // console.log('Change person to motorbike');
            mostlyMatchedName = "motorbike"
          }
        }

        if (debugOutput) {
          // console.log(trackedItem);
          return {
            ...trackedItem,
            name: mostlyMatchedName
          }
        } else {
          // If not debug, excude some fields  
          // Ugly, would need an getJSON() as a utility function to avoid quote duplication      
          return {
            id: trackedItem.idDisplay,
            x: trackedItem.x,
            y: trackedItem.y,
            w: trackedItem.w,
            h: trackedItem.h,
            name: mostlyMatchedName,
            bearing: trackedItem.bearing
          }
        }
      })
    })

    // Remove the tracked item with the name that we won't render as clickable
    Object.keys(tracker).map((frameNb) => {
      tracker[frameNb] = tracker[frameNb].filter((trackedItem) => {
        if (TRACKED_LIST.indexOf(trackedItem.name) > -1) {
          return true
        } else {
          return false
        }
      });
    });
  }

  if (!MODE_MOTChallenge) {
    fs.writeFile(`${pathToTrackerOutput}`, JSON.stringify(tracker), function () {
      console.log('Output tracker data wrote');
    });
  } else {
    fs.writeFile(`${pathToMOTOutput}`, MOToutput.join("\n"), function () {
      console.log('Output MOT data wrote');
    });
  }
});






}).call(this)}).call(this,require('_process'))
},{"./tracker":11,"./utils":12,"_process":7,"fs":4,"minimist":6}],4:[function(require,module,exports){

},{}],5:[function(require,module,exports){
(function (global){(function (){
/**
 * Lodash (Custom Build) <https://lodash.com/>
 * Build: `lodash modularize exports="npm" -o ./`
 * Copyright JS Foundation and other contributors <https://js.foundation/>
 * Released under MIT license <https://lodash.com/license>
 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
 * Copyright Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 */

/** Used as the size to enable large array optimizations. */
var LARGE_ARRAY_SIZE = 200;

/** Used to stand-in for `undefined` hash values. */
var HASH_UNDEFINED = '__lodash_hash_undefined__';

/** Used to compose bitmasks for value comparisons. */
var COMPARE_PARTIAL_FLAG = 1,
    COMPARE_UNORDERED_FLAG = 2;

/** Used as references for various `Number` constants. */
var MAX_SAFE_INTEGER = 9007199254740991;

/** `Object#toString` result references. */
var argsTag = '[object Arguments]',
    arrayTag = '[object Array]',
    asyncTag = '[object AsyncFunction]',
    boolTag = '[object Boolean]',
    dateTag = '[object Date]',
    errorTag = '[object Error]',
    funcTag = '[object Function]',
    genTag = '[object GeneratorFunction]',
    mapTag = '[object Map]',
    numberTag = '[object Number]',
    nullTag = '[object Null]',
    objectTag = '[object Object]',
    promiseTag = '[object Promise]',
    proxyTag = '[object Proxy]',
    regexpTag = '[object RegExp]',
    setTag = '[object Set]',
    stringTag = '[object String]',
    symbolTag = '[object Symbol]',
    undefinedTag = '[object Undefined]',
    weakMapTag = '[object WeakMap]';

var arrayBufferTag = '[object ArrayBuffer]',
    dataViewTag = '[object DataView]',
    float32Tag = '[object Float32Array]',
    float64Tag = '[object Float64Array]',
    int8Tag = '[object Int8Array]',
    int16Tag = '[object Int16Array]',
    int32Tag = '[object Int32Array]',
    uint8Tag = '[object Uint8Array]',
    uint8ClampedTag = '[object Uint8ClampedArray]',
    uint16Tag = '[object Uint16Array]',
    uint32Tag = '[object Uint32Array]';

/**
 * Used to match `RegExp`
 * [syntax characters](http://ecma-international.org/ecma-262/7.0/#sec-patterns).
 */
var reRegExpChar = /[\\^$.*+?()[\]{}|]/g;

/** Used to detect host constructors (Safari). */
var reIsHostCtor = /^\[object .+?Constructor\]$/;

/** Used to detect unsigned integer values. */
var reIsUint = /^(?:0|[1-9]\d*)$/;

/** Used to identify `toStringTag` values of typed arrays. */
var typedArrayTags = {};
typedArrayTags[float32Tag] = typedArrayTags[float64Tag] =
typedArrayTags[int8Tag] = typedArrayTags[int16Tag] =
typedArrayTags[int32Tag] = typedArrayTags[uint8Tag] =
typedArrayTags[uint8ClampedTag] = typedArrayTags[uint16Tag] =
typedArrayTags[uint32Tag] = true;
typedArrayTags[argsTag] = typedArrayTags[arrayTag] =
typedArrayTags[arrayBufferTag] = typedArrayTags[boolTag] =
typedArrayTags[dataViewTag] = typedArrayTags[dateTag] =
typedArrayTags[errorTag] = typedArrayTags[funcTag] =
typedArrayTags[mapTag] = typedArrayTags[numberTag] =
typedArrayTags[objectTag] = typedArrayTags[regexpTag] =
typedArrayTags[setTag] = typedArrayTags[stringTag] =
typedArrayTags[weakMapTag] = false;

/** Detect free variable `global` from Node.js. */
var freeGlobal = typeof global == 'object' && global && global.Object === Object && global;

/** Detect free variable `self`. */
var freeSelf = typeof self == 'object' && self && self.Object === Object && self;

/** Used as a reference to the global object. */
var root = freeGlobal || freeSelf || Function('return this')();

/** Detect free variable `exports`. */
var freeExports = typeof exports == 'object' && exports && !exports.nodeType && exports;

/** Detect free variable `module`. */
var freeModule = freeExports && typeof module == 'object' && module && !module.nodeType && module;

/** Detect the popular CommonJS extension `module.exports`. */
var moduleExports = freeModule && freeModule.exports === freeExports;

/** Detect free variable `process` from Node.js. */
var freeProcess = moduleExports && freeGlobal.process;

/** Used to access faster Node.js helpers. */
var nodeUtil = (function() {
  try {
    return freeProcess && freeProcess.binding && freeProcess.binding('util');
  } catch (e) {}
}());

/* Node.js helper references. */
var nodeIsTypedArray = nodeUtil && nodeUtil.isTypedArray;

/**
 * A specialized version of `_.filter` for arrays without support for
 * iteratee shorthands.
 *
 * @private
 * @param {Array} [array] The array to iterate over.
 * @param {Function} predicate The function invoked per iteration.
 * @returns {Array} Returns the new filtered array.
 */
function arrayFilter(array, predicate) {
  var index = -1,
      length = array == null ? 0 : array.length,
      resIndex = 0,
      result = [];

  while (++index < length) {
    var value = array[index];
    if (predicate(value, index, array)) {
      result[resIndex++] = value;
    }
  }
  return result;
}

/**
 * Appends the elements of `values` to `array`.
 *
 * @private
 * @param {Array} array The array to modify.
 * @param {Array} values The values to append.
 * @returns {Array} Returns `array`.
 */
function arrayPush(array, values) {
  var index = -1,
      length = values.length,
      offset = array.length;

  while (++index < length) {
    array[offset + index] = values[index];
  }
  return array;
}

/**
 * A specialized version of `_.some` for arrays without support for iteratee
 * shorthands.
 *
 * @private
 * @param {Array} [array] The array to iterate over.
 * @param {Function} predicate The function invoked per iteration.
 * @returns {boolean} Returns `true` if any element passes the predicate check,
 *  else `false`.
 */
function arraySome(array, predicate) {
  var index = -1,
      length = array == null ? 0 : array.length;

  while (++index < length) {
    if (predicate(array[index], index, array)) {
      return true;
    }
  }
  return false;
}

/**
 * The base implementation of `_.times` without support for iteratee shorthands
 * or max array length checks.
 *
 * @private
 * @param {number} n The number of times to invoke `iteratee`.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Array} Returns the array of results.
 */
function baseTimes(n, iteratee) {
  var index = -1,
      result = Array(n);

  while (++index < n) {
    result[index] = iteratee(index);
  }
  return result;
}

/**
 * The base implementation of `_.unary` without support for storing metadata.
 *
 * @private
 * @param {Function} func The function to cap arguments for.
 * @returns {Function} Returns the new capped function.
 */
function baseUnary(func) {
  return function(value) {
    return func(value);
  };
}

/**
 * Checks if a `cache` value for `key` exists.
 *
 * @private
 * @param {Object} cache The cache to query.
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function cacheHas(cache, key) {
  return cache.has(key);
}

/**
 * Gets the value at `key` of `object`.
 *
 * @private
 * @param {Object} [object] The object to query.
 * @param {string} key The key of the property to get.
 * @returns {*} Returns the property value.
 */
function getValue(object, key) {
  return object == null ? undefined : object[key];
}

/**
 * Converts `map` to its key-value pairs.
 *
 * @private
 * @param {Object} map The map to convert.
 * @returns {Array} Returns the key-value pairs.
 */
function mapToArray(map) {
  var index = -1,
      result = Array(map.size);

  map.forEach(function(value, key) {
    result[++index] = [key, value];
  });
  return result;
}

/**
 * Creates a unary function that invokes `func` with its argument transformed.
 *
 * @private
 * @param {Function} func The function to wrap.
 * @param {Function} transform The argument transform.
 * @returns {Function} Returns the new function.
 */
function overArg(func, transform) {
  return function(arg) {
    return func(transform(arg));
  };
}

/**
 * Converts `set` to an array of its values.
 *
 * @private
 * @param {Object} set The set to convert.
 * @returns {Array} Returns the values.
 */
function setToArray(set) {
  var index = -1,
      result = Array(set.size);

  set.forEach(function(value) {
    result[++index] = value;
  });
  return result;
}

/** Used for built-in method references. */
var arrayProto = Array.prototype,
    funcProto = Function.prototype,
    objectProto = Object.prototype;

/** Used to detect overreaching core-js shims. */
var coreJsData = root['__core-js_shared__'];

/** Used to resolve the decompiled source of functions. */
var funcToString = funcProto.toString;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/** Used to detect methods masquerading as native. */
var maskSrcKey = (function() {
  var uid = /[^.]+$/.exec(coreJsData && coreJsData.keys && coreJsData.keys.IE_PROTO || '');
  return uid ? ('Symbol(src)_1.' + uid) : '';
}());

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
 * of values.
 */
var nativeObjectToString = objectProto.toString;

/** Used to detect if a method is native. */
var reIsNative = RegExp('^' +
  funcToString.call(hasOwnProperty).replace(reRegExpChar, '\\$&')
  .replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, '$1.*?') + '$'
);

/** Built-in value references. */
var Buffer = moduleExports ? root.Buffer : undefined,
    Symbol = root.Symbol,
    Uint8Array = root.Uint8Array,
    propertyIsEnumerable = objectProto.propertyIsEnumerable,
    splice = arrayProto.splice,
    symToStringTag = Symbol ? Symbol.toStringTag : undefined;

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeGetSymbols = Object.getOwnPropertySymbols,
    nativeIsBuffer = Buffer ? Buffer.isBuffer : undefined,
    nativeKeys = overArg(Object.keys, Object);

/* Built-in method references that are verified to be native. */
var DataView = getNative(root, 'DataView'),
    Map = getNative(root, 'Map'),
    Promise = getNative(root, 'Promise'),
    Set = getNative(root, 'Set'),
    WeakMap = getNative(root, 'WeakMap'),
    nativeCreate = getNative(Object, 'create');

/** Used to detect maps, sets, and weakmaps. */
var dataViewCtorString = toSource(DataView),
    mapCtorString = toSource(Map),
    promiseCtorString = toSource(Promise),
    setCtorString = toSource(Set),
    weakMapCtorString = toSource(WeakMap);

/** Used to convert symbols to primitives and strings. */
var symbolProto = Symbol ? Symbol.prototype : undefined,
    symbolValueOf = symbolProto ? symbolProto.valueOf : undefined;

/**
 * Creates a hash object.
 *
 * @private
 * @constructor
 * @param {Array} [entries] The key-value pairs to cache.
 */
function Hash(entries) {
  var index = -1,
      length = entries == null ? 0 : entries.length;

  this.clear();
  while (++index < length) {
    var entry = entries[index];
    this.set(entry[0], entry[1]);
  }
}

/**
 * Removes all key-value entries from the hash.
 *
 * @private
 * @name clear
 * @memberOf Hash
 */
function hashClear() {
  this.__data__ = nativeCreate ? nativeCreate(null) : {};
  this.size = 0;
}

/**
 * Removes `key` and its value from the hash.
 *
 * @private
 * @name delete
 * @memberOf Hash
 * @param {Object} hash The hash to modify.
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */
function hashDelete(key) {
  var result = this.has(key) && delete this.__data__[key];
  this.size -= result ? 1 : 0;
  return result;
}

/**
 * Gets the hash value for `key`.
 *
 * @private
 * @name get
 * @memberOf Hash
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */
function hashGet(key) {
  var data = this.__data__;
  if (nativeCreate) {
    var result = data[key];
    return result === HASH_UNDEFINED ? undefined : result;
  }
  return hasOwnProperty.call(data, key) ? data[key] : undefined;
}

/**
 * Checks if a hash value for `key` exists.
 *
 * @private
 * @name has
 * @memberOf Hash
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function hashHas(key) {
  var data = this.__data__;
  return nativeCreate ? (data[key] !== undefined) : hasOwnProperty.call(data, key);
}

/**
 * Sets the hash `key` to `value`.
 *
 * @private
 * @name set
 * @memberOf Hash
 * @param {string} key The key of the value to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns the hash instance.
 */
function hashSet(key, value) {
  var data = this.__data__;
  this.size += this.has(key) ? 0 : 1;
  data[key] = (nativeCreate && value === undefined) ? HASH_UNDEFINED : value;
  return this;
}

// Add methods to `Hash`.
Hash.prototype.clear = hashClear;
Hash.prototype['delete'] = hashDelete;
Hash.prototype.get = hashGet;
Hash.prototype.has = hashHas;
Hash.prototype.set = hashSet;

/**
 * Creates an list cache object.
 *
 * @private
 * @constructor
 * @param {Array} [entries] The key-value pairs to cache.
 */
function ListCache(entries) {
  var index = -1,
      length = entries == null ? 0 : entries.length;

  this.clear();
  while (++index < length) {
    var entry = entries[index];
    this.set(entry[0], entry[1]);
  }
}

/**
 * Removes all key-value entries from the list cache.
 *
 * @private
 * @name clear
 * @memberOf ListCache
 */
function listCacheClear() {
  this.__data__ = [];
  this.size = 0;
}

/**
 * Removes `key` and its value from the list cache.
 *
 * @private
 * @name delete
 * @memberOf ListCache
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */
function listCacheDelete(key) {
  var data = this.__data__,
      index = assocIndexOf(data, key);

  if (index < 0) {
    return false;
  }
  var lastIndex = data.length - 1;
  if (index == lastIndex) {
    data.pop();
  } else {
    splice.call(data, index, 1);
  }
  --this.size;
  return true;
}

/**
 * Gets the list cache value for `key`.
 *
 * @private
 * @name get
 * @memberOf ListCache
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */
function listCacheGet(key) {
  var data = this.__data__,
      index = assocIndexOf(data, key);

  return index < 0 ? undefined : data[index][1];
}

/**
 * Checks if a list cache value for `key` exists.
 *
 * @private
 * @name has
 * @memberOf ListCache
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function listCacheHas(key) {
  return assocIndexOf(this.__data__, key) > -1;
}

/**
 * Sets the list cache `key` to `value`.
 *
 * @private
 * @name set
 * @memberOf ListCache
 * @param {string} key The key of the value to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns the list cache instance.
 */
function listCacheSet(key, value) {
  var data = this.__data__,
      index = assocIndexOf(data, key);

  if (index < 0) {
    ++this.size;
    data.push([key, value]);
  } else {
    data[index][1] = value;
  }
  return this;
}

// Add methods to `ListCache`.
ListCache.prototype.clear = listCacheClear;
ListCache.prototype['delete'] = listCacheDelete;
ListCache.prototype.get = listCacheGet;
ListCache.prototype.has = listCacheHas;
ListCache.prototype.set = listCacheSet;

/**
 * Creates a map cache object to store key-value pairs.
 *
 * @private
 * @constructor
 * @param {Array} [entries] The key-value pairs to cache.
 */
function MapCache(entries) {
  var index = -1,
      length = entries == null ? 0 : entries.length;

  this.clear();
  while (++index < length) {
    var entry = entries[index];
    this.set(entry[0], entry[1]);
  }
}

/**
 * Removes all key-value entries from the map.
 *
 * @private
 * @name clear
 * @memberOf MapCache
 */
function mapCacheClear() {
  this.size = 0;
  this.__data__ = {
    'hash': new Hash,
    'map': new (Map || ListCache),
    'string': new Hash
  };
}

/**
 * Removes `key` and its value from the map.
 *
 * @private
 * @name delete
 * @memberOf MapCache
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */
function mapCacheDelete(key) {
  var result = getMapData(this, key)['delete'](key);
  this.size -= result ? 1 : 0;
  return result;
}

/**
 * Gets the map value for `key`.
 *
 * @private
 * @name get
 * @memberOf MapCache
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */
function mapCacheGet(key) {
  return getMapData(this, key).get(key);
}

/**
 * Checks if a map value for `key` exists.
 *
 * @private
 * @name has
 * @memberOf MapCache
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function mapCacheHas(key) {
  return getMapData(this, key).has(key);
}

/**
 * Sets the map `key` to `value`.
 *
 * @private
 * @name set
 * @memberOf MapCache
 * @param {string} key The key of the value to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns the map cache instance.
 */
function mapCacheSet(key, value) {
  var data = getMapData(this, key),
      size = data.size;

  data.set(key, value);
  this.size += data.size == size ? 0 : 1;
  return this;
}

// Add methods to `MapCache`.
MapCache.prototype.clear = mapCacheClear;
MapCache.prototype['delete'] = mapCacheDelete;
MapCache.prototype.get = mapCacheGet;
MapCache.prototype.has = mapCacheHas;
MapCache.prototype.set = mapCacheSet;

/**
 *
 * Creates an array cache object to store unique values.
 *
 * @private
 * @constructor
 * @param {Array} [values] The values to cache.
 */
function SetCache(values) {
  var index = -1,
      length = values == null ? 0 : values.length;

  this.__data__ = new MapCache;
  while (++index < length) {
    this.add(values[index]);
  }
}

/**
 * Adds `value` to the array cache.
 *
 * @private
 * @name add
 * @memberOf SetCache
 * @alias push
 * @param {*} value The value to cache.
 * @returns {Object} Returns the cache instance.
 */
function setCacheAdd(value) {
  this.__data__.set(value, HASH_UNDEFINED);
  return this;
}

/**
 * Checks if `value` is in the array cache.
 *
 * @private
 * @name has
 * @memberOf SetCache
 * @param {*} value The value to search for.
 * @returns {number} Returns `true` if `value` is found, else `false`.
 */
function setCacheHas(value) {
  return this.__data__.has(value);
}

// Add methods to `SetCache`.
SetCache.prototype.add = SetCache.prototype.push = setCacheAdd;
SetCache.prototype.has = setCacheHas;

/**
 * Creates a stack cache object to store key-value pairs.
 *
 * @private
 * @constructor
 * @param {Array} [entries] The key-value pairs to cache.
 */
function Stack(entries) {
  var data = this.__data__ = new ListCache(entries);
  this.size = data.size;
}

/**
 * Removes all key-value entries from the stack.
 *
 * @private
 * @name clear
 * @memberOf Stack
 */
function stackClear() {
  this.__data__ = new ListCache;
  this.size = 0;
}

/**
 * Removes `key` and its value from the stack.
 *
 * @private
 * @name delete
 * @memberOf Stack
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */
function stackDelete(key) {
  var data = this.__data__,
      result = data['delete'](key);

  this.size = data.size;
  return result;
}

/**
 * Gets the stack value for `key`.
 *
 * @private
 * @name get
 * @memberOf Stack
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */
function stackGet(key) {
  return this.__data__.get(key);
}

/**
 * Checks if a stack value for `key` exists.
 *
 * @private
 * @name has
 * @memberOf Stack
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function stackHas(key) {
  return this.__data__.has(key);
}

/**
 * Sets the stack `key` to `value`.
 *
 * @private
 * @name set
 * @memberOf Stack
 * @param {string} key The key of the value to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns the stack cache instance.
 */
function stackSet(key, value) {
  var data = this.__data__;
  if (data instanceof ListCache) {
    var pairs = data.__data__;
    if (!Map || (pairs.length < LARGE_ARRAY_SIZE - 1)) {
      pairs.push([key, value]);
      this.size = ++data.size;
      return this;
    }
    data = this.__data__ = new MapCache(pairs);
  }
  data.set(key, value);
  this.size = data.size;
  return this;
}

// Add methods to `Stack`.
Stack.prototype.clear = stackClear;
Stack.prototype['delete'] = stackDelete;
Stack.prototype.get = stackGet;
Stack.prototype.has = stackHas;
Stack.prototype.set = stackSet;

/**
 * Creates an array of the enumerable property names of the array-like `value`.
 *
 * @private
 * @param {*} value The value to query.
 * @param {boolean} inherited Specify returning inherited property names.
 * @returns {Array} Returns the array of property names.
 */
function arrayLikeKeys(value, inherited) {
  var isArr = isArray(value),
      isArg = !isArr && isArguments(value),
      isBuff = !isArr && !isArg && isBuffer(value),
      isType = !isArr && !isArg && !isBuff && isTypedArray(value),
      skipIndexes = isArr || isArg || isBuff || isType,
      result = skipIndexes ? baseTimes(value.length, String) : [],
      length = result.length;

  for (var key in value) {
    if ((inherited || hasOwnProperty.call(value, key)) &&
        !(skipIndexes && (
           // Safari 9 has enumerable `arguments.length` in strict mode.
           key == 'length' ||
           // Node.js 0.10 has enumerable non-index properties on buffers.
           (isBuff && (key == 'offset' || key == 'parent')) ||
           // PhantomJS 2 has enumerable non-index properties on typed arrays.
           (isType && (key == 'buffer' || key == 'byteLength' || key == 'byteOffset')) ||
           // Skip index properties.
           isIndex(key, length)
        ))) {
      result.push(key);
    }
  }
  return result;
}

/**
 * Gets the index at which the `key` is found in `array` of key-value pairs.
 *
 * @private
 * @param {Array} array The array to inspect.
 * @param {*} key The key to search for.
 * @returns {number} Returns the index of the matched value, else `-1`.
 */
function assocIndexOf(array, key) {
  var length = array.length;
  while (length--) {
    if (eq(array[length][0], key)) {
      return length;
    }
  }
  return -1;
}

/**
 * The base implementation of `getAllKeys` and `getAllKeysIn` which uses
 * `keysFunc` and `symbolsFunc` to get the enumerable property names and
 * symbols of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @param {Function} keysFunc The function to get the keys of `object`.
 * @param {Function} symbolsFunc The function to get the symbols of `object`.
 * @returns {Array} Returns the array of property names and symbols.
 */
function baseGetAllKeys(object, keysFunc, symbolsFunc) {
  var result = keysFunc(object);
  return isArray(object) ? result : arrayPush(result, symbolsFunc(object));
}

/**
 * The base implementation of `getTag` without fallbacks for buggy environments.
 *
 * @private
 * @param {*} value The value to query.
 * @returns {string} Returns the `toStringTag`.
 */
function baseGetTag(value) {
  if (value == null) {
    return value === undefined ? undefinedTag : nullTag;
  }
  return (symToStringTag && symToStringTag in Object(value))
    ? getRawTag(value)
    : objectToString(value);
}

/**
 * The base implementation of `_.isArguments`.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an `arguments` object,
 */
function baseIsArguments(value) {
  return isObjectLike(value) && baseGetTag(value) == argsTag;
}

/**
 * The base implementation of `_.isEqual` which supports partial comparisons
 * and tracks traversed objects.
 *
 * @private
 * @param {*} value The value to compare.
 * @param {*} other The other value to compare.
 * @param {boolean} bitmask The bitmask flags.
 *  1 - Unordered comparison
 *  2 - Partial comparison
 * @param {Function} [customizer] The function to customize comparisons.
 * @param {Object} [stack] Tracks traversed `value` and `other` objects.
 * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
 */
function baseIsEqual(value, other, bitmask, customizer, stack) {
  if (value === other) {
    return true;
  }
  if (value == null || other == null || (!isObjectLike(value) && !isObjectLike(other))) {
    return value !== value && other !== other;
  }
  return baseIsEqualDeep(value, other, bitmask, customizer, baseIsEqual, stack);
}

/**
 * A specialized version of `baseIsEqual` for arrays and objects which performs
 * deep comparisons and tracks traversed objects enabling objects with circular
 * references to be compared.
 *
 * @private
 * @param {Object} object The object to compare.
 * @param {Object} other The other object to compare.
 * @param {number} bitmask The bitmask flags. See `baseIsEqual` for more details.
 * @param {Function} customizer The function to customize comparisons.
 * @param {Function} equalFunc The function to determine equivalents of values.
 * @param {Object} [stack] Tracks traversed `object` and `other` objects.
 * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
 */
function baseIsEqualDeep(object, other, bitmask, customizer, equalFunc, stack) {
  var objIsArr = isArray(object),
      othIsArr = isArray(other),
      objTag = objIsArr ? arrayTag : getTag(object),
      othTag = othIsArr ? arrayTag : getTag(other);

  objTag = objTag == argsTag ? objectTag : objTag;
  othTag = othTag == argsTag ? objectTag : othTag;

  var objIsObj = objTag == objectTag,
      othIsObj = othTag == objectTag,
      isSameTag = objTag == othTag;

  if (isSameTag && isBuffer(object)) {
    if (!isBuffer(other)) {
      return false;
    }
    objIsArr = true;
    objIsObj = false;
  }
  if (isSameTag && !objIsObj) {
    stack || (stack = new Stack);
    return (objIsArr || isTypedArray(object))
      ? equalArrays(object, other, bitmask, customizer, equalFunc, stack)
      : equalByTag(object, other, objTag, bitmask, customizer, equalFunc, stack);
  }
  if (!(bitmask & COMPARE_PARTIAL_FLAG)) {
    var objIsWrapped = objIsObj && hasOwnProperty.call(object, '__wrapped__'),
        othIsWrapped = othIsObj && hasOwnProperty.call(other, '__wrapped__');

    if (objIsWrapped || othIsWrapped) {
      var objUnwrapped = objIsWrapped ? object.value() : object,
          othUnwrapped = othIsWrapped ? other.value() : other;

      stack || (stack = new Stack);
      return equalFunc(objUnwrapped, othUnwrapped, bitmask, customizer, stack);
    }
  }
  if (!isSameTag) {
    return false;
  }
  stack || (stack = new Stack);
  return equalObjects(object, other, bitmask, customizer, equalFunc, stack);
}

/**
 * The base implementation of `_.isNative` without bad shim checks.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a native function,
 *  else `false`.
 */
function baseIsNative(value) {
  if (!isObject(value) || isMasked(value)) {
    return false;
  }
  var pattern = isFunction(value) ? reIsNative : reIsHostCtor;
  return pattern.test(toSource(value));
}

/**
 * The base implementation of `_.isTypedArray` without Node.js optimizations.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a typed array, else `false`.
 */
function baseIsTypedArray(value) {
  return isObjectLike(value) &&
    isLength(value.length) && !!typedArrayTags[baseGetTag(value)];
}

/**
 * The base implementation of `_.keys` which doesn't treat sparse arrays as dense.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 */
function baseKeys(object) {
  if (!isPrototype(object)) {
    return nativeKeys(object);
  }
  var result = [];
  for (var key in Object(object)) {
    if (hasOwnProperty.call(object, key) && key != 'constructor') {
      result.push(key);
    }
  }
  return result;
}

/**
 * A specialized version of `baseIsEqualDeep` for arrays with support for
 * partial deep comparisons.
 *
 * @private
 * @param {Array} array The array to compare.
 * @param {Array} other The other array to compare.
 * @param {number} bitmask The bitmask flags. See `baseIsEqual` for more details.
 * @param {Function} customizer The function to customize comparisons.
 * @param {Function} equalFunc The function to determine equivalents of values.
 * @param {Object} stack Tracks traversed `array` and `other` objects.
 * @returns {boolean} Returns `true` if the arrays are equivalent, else `false`.
 */
function equalArrays(array, other, bitmask, customizer, equalFunc, stack) {
  var isPartial = bitmask & COMPARE_PARTIAL_FLAG,
      arrLength = array.length,
      othLength = other.length;

  if (arrLength != othLength && !(isPartial && othLength > arrLength)) {
    return false;
  }
  // Assume cyclic values are equal.
  var stacked = stack.get(array);
  if (stacked && stack.get(other)) {
    return stacked == other;
  }
  var index = -1,
      result = true,
      seen = (bitmask & COMPARE_UNORDERED_FLAG) ? new SetCache : undefined;

  stack.set(array, other);
  stack.set(other, array);

  // Ignore non-index properties.
  while (++index < arrLength) {
    var arrValue = array[index],
        othValue = other[index];

    if (customizer) {
      var compared = isPartial
        ? customizer(othValue, arrValue, index, other, array, stack)
        : customizer(arrValue, othValue, index, array, other, stack);
    }
    if (compared !== undefined) {
      if (compared) {
        continue;
      }
      result = false;
      break;
    }
    // Recursively compare arrays (susceptible to call stack limits).
    if (seen) {
      if (!arraySome(other, function(othValue, othIndex) {
            if (!cacheHas(seen, othIndex) &&
                (arrValue === othValue || equalFunc(arrValue, othValue, bitmask, customizer, stack))) {
              return seen.push(othIndex);
            }
          })) {
        result = false;
        break;
      }
    } else if (!(
          arrValue === othValue ||
            equalFunc(arrValue, othValue, bitmask, customizer, stack)
        )) {
      result = false;
      break;
    }
  }
  stack['delete'](array);
  stack['delete'](other);
  return result;
}

/**
 * A specialized version of `baseIsEqualDeep` for comparing objects of
 * the same `toStringTag`.
 *
 * **Note:** This function only supports comparing values with tags of
 * `Boolean`, `Date`, `Error`, `Number`, `RegExp`, or `String`.
 *
 * @private
 * @param {Object} object The object to compare.
 * @param {Object} other The other object to compare.
 * @param {string} tag The `toStringTag` of the objects to compare.
 * @param {number} bitmask The bitmask flags. See `baseIsEqual` for more details.
 * @param {Function} customizer The function to customize comparisons.
 * @param {Function} equalFunc The function to determine equivalents of values.
 * @param {Object} stack Tracks traversed `object` and `other` objects.
 * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
 */
function equalByTag(object, other, tag, bitmask, customizer, equalFunc, stack) {
  switch (tag) {
    case dataViewTag:
      if ((object.byteLength != other.byteLength) ||
          (object.byteOffset != other.byteOffset)) {
        return false;
      }
      object = object.buffer;
      other = other.buffer;

    case arrayBufferTag:
      if ((object.byteLength != other.byteLength) ||
          !equalFunc(new Uint8Array(object), new Uint8Array(other))) {
        return false;
      }
      return true;

    case boolTag:
    case dateTag:
    case numberTag:
      // Coerce booleans to `1` or `0` and dates to milliseconds.
      // Invalid dates are coerced to `NaN`.
      return eq(+object, +other);

    case errorTag:
      return object.name == other.name && object.message == other.message;

    case regexpTag:
    case stringTag:
      // Coerce regexes to strings and treat strings, primitives and objects,
      // as equal. See http://www.ecma-international.org/ecma-262/7.0/#sec-regexp.prototype.tostring
      // for more details.
      return object == (other + '');

    case mapTag:
      var convert = mapToArray;

    case setTag:
      var isPartial = bitmask & COMPARE_PARTIAL_FLAG;
      convert || (convert = setToArray);

      if (object.size != other.size && !isPartial) {
        return false;
      }
      // Assume cyclic values are equal.
      var stacked = stack.get(object);
      if (stacked) {
        return stacked == other;
      }
      bitmask |= COMPARE_UNORDERED_FLAG;

      // Recursively compare objects (susceptible to call stack limits).
      stack.set(object, other);
      var result = equalArrays(convert(object), convert(other), bitmask, customizer, equalFunc, stack);
      stack['delete'](object);
      return result;

    case symbolTag:
      if (symbolValueOf) {
        return symbolValueOf.call(object) == symbolValueOf.call(other);
      }
  }
  return false;
}

/**
 * A specialized version of `baseIsEqualDeep` for objects with support for
 * partial deep comparisons.
 *
 * @private
 * @param {Object} object The object to compare.
 * @param {Object} other The other object to compare.
 * @param {number} bitmask The bitmask flags. See `baseIsEqual` for more details.
 * @param {Function} customizer The function to customize comparisons.
 * @param {Function} equalFunc The function to determine equivalents of values.
 * @param {Object} stack Tracks traversed `object` and `other` objects.
 * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
 */
function equalObjects(object, other, bitmask, customizer, equalFunc, stack) {
  var isPartial = bitmask & COMPARE_PARTIAL_FLAG,
      objProps = getAllKeys(object),
      objLength = objProps.length,
      othProps = getAllKeys(other),
      othLength = othProps.length;

  if (objLength != othLength && !isPartial) {
    return false;
  }
  var index = objLength;
  while (index--) {
    var key = objProps[index];
    if (!(isPartial ? key in other : hasOwnProperty.call(other, key))) {
      return false;
    }
  }
  // Assume cyclic values are equal.
  var stacked = stack.get(object);
  if (stacked && stack.get(other)) {
    return stacked == other;
  }
  var result = true;
  stack.set(object, other);
  stack.set(other, object);

  var skipCtor = isPartial;
  while (++index < objLength) {
    key = objProps[index];
    var objValue = object[key],
        othValue = other[key];

    if (customizer) {
      var compared = isPartial
        ? customizer(othValue, objValue, key, other, object, stack)
        : customizer(objValue, othValue, key, object, other, stack);
    }
    // Recursively compare objects (susceptible to call stack limits).
    if (!(compared === undefined
          ? (objValue === othValue || equalFunc(objValue, othValue, bitmask, customizer, stack))
          : compared
        )) {
      result = false;
      break;
    }
    skipCtor || (skipCtor = key == 'constructor');
  }
  if (result && !skipCtor) {
    var objCtor = object.constructor,
        othCtor = other.constructor;

    // Non `Object` object instances with different constructors are not equal.
    if (objCtor != othCtor &&
        ('constructor' in object && 'constructor' in other) &&
        !(typeof objCtor == 'function' && objCtor instanceof objCtor &&
          typeof othCtor == 'function' && othCtor instanceof othCtor)) {
      result = false;
    }
  }
  stack['delete'](object);
  stack['delete'](other);
  return result;
}

/**
 * Creates an array of own enumerable property names and symbols of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names and symbols.
 */
function getAllKeys(object) {
  return baseGetAllKeys(object, keys, getSymbols);
}

/**
 * Gets the data for `map`.
 *
 * @private
 * @param {Object} map The map to query.
 * @param {string} key The reference key.
 * @returns {*} Returns the map data.
 */
function getMapData(map, key) {
  var data = map.__data__;
  return isKeyable(key)
    ? data[typeof key == 'string' ? 'string' : 'hash']
    : data.map;
}

/**
 * Gets the native function at `key` of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @param {string} key The key of the method to get.
 * @returns {*} Returns the function if it's native, else `undefined`.
 */
function getNative(object, key) {
  var value = getValue(object, key);
  return baseIsNative(value) ? value : undefined;
}

/**
 * A specialized version of `baseGetTag` which ignores `Symbol.toStringTag` values.
 *
 * @private
 * @param {*} value The value to query.
 * @returns {string} Returns the raw `toStringTag`.
 */
function getRawTag(value) {
  var isOwn = hasOwnProperty.call(value, symToStringTag),
      tag = value[symToStringTag];

  try {
    value[symToStringTag] = undefined;
    var unmasked = true;
  } catch (e) {}

  var result = nativeObjectToString.call(value);
  if (unmasked) {
    if (isOwn) {
      value[symToStringTag] = tag;
    } else {
      delete value[symToStringTag];
    }
  }
  return result;
}

/**
 * Creates an array of the own enumerable symbols of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of symbols.
 */
var getSymbols = !nativeGetSymbols ? stubArray : function(object) {
  if (object == null) {
    return [];
  }
  object = Object(object);
  return arrayFilter(nativeGetSymbols(object), function(symbol) {
    return propertyIsEnumerable.call(object, symbol);
  });
};

/**
 * Gets the `toStringTag` of `value`.
 *
 * @private
 * @param {*} value The value to query.
 * @returns {string} Returns the `toStringTag`.
 */
var getTag = baseGetTag;

// Fallback for data views, maps, sets, and weak maps in IE 11 and promises in Node.js < 6.
if ((DataView && getTag(new DataView(new ArrayBuffer(1))) != dataViewTag) ||
    (Map && getTag(new Map) != mapTag) ||
    (Promise && getTag(Promise.resolve()) != promiseTag) ||
    (Set && getTag(new Set) != setTag) ||
    (WeakMap && getTag(new WeakMap) != weakMapTag)) {
  getTag = function(value) {
    var result = baseGetTag(value),
        Ctor = result == objectTag ? value.constructor : undefined,
        ctorString = Ctor ? toSource(Ctor) : '';

    if (ctorString) {
      switch (ctorString) {
        case dataViewCtorString: return dataViewTag;
        case mapCtorString: return mapTag;
        case promiseCtorString: return promiseTag;
        case setCtorString: return setTag;
        case weakMapCtorString: return weakMapTag;
      }
    }
    return result;
  };
}

/**
 * Checks if `value` is a valid array-like index.
 *
 * @private
 * @param {*} value The value to check.
 * @param {number} [length=MAX_SAFE_INTEGER] The upper bounds of a valid index.
 * @returns {boolean} Returns `true` if `value` is a valid index, else `false`.
 */
function isIndex(value, length) {
  length = length == null ? MAX_SAFE_INTEGER : length;
  return !!length &&
    (typeof value == 'number' || reIsUint.test(value)) &&
    (value > -1 && value % 1 == 0 && value < length);
}

/**
 * Checks if `value` is suitable for use as unique object key.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is suitable, else `false`.
 */
function isKeyable(value) {
  var type = typeof value;
  return (type == 'string' || type == 'number' || type == 'symbol' || type == 'boolean')
    ? (value !== '__proto__')
    : (value === null);
}

/**
 * Checks if `func` has its source masked.
 *
 * @private
 * @param {Function} func The function to check.
 * @returns {boolean} Returns `true` if `func` is masked, else `false`.
 */
function isMasked(func) {
  return !!maskSrcKey && (maskSrcKey in func);
}

/**
 * Checks if `value` is likely a prototype object.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a prototype, else `false`.
 */
function isPrototype(value) {
  var Ctor = value && value.constructor,
      proto = (typeof Ctor == 'function' && Ctor.prototype) || objectProto;

  return value === proto;
}

/**
 * Converts `value` to a string using `Object.prototype.toString`.
 *
 * @private
 * @param {*} value The value to convert.
 * @returns {string} Returns the converted string.
 */
function objectToString(value) {
  return nativeObjectToString.call(value);
}

/**
 * Converts `func` to its source code.
 *
 * @private
 * @param {Function} func The function to convert.
 * @returns {string} Returns the source code.
 */
function toSource(func) {
  if (func != null) {
    try {
      return funcToString.call(func);
    } catch (e) {}
    try {
      return (func + '');
    } catch (e) {}
  }
  return '';
}

/**
 * Performs a
 * [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
 * comparison between two values to determine if they are equivalent.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to compare.
 * @param {*} other The other value to compare.
 * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
 * @example
 *
 * var object = { 'a': 1 };
 * var other = { 'a': 1 };
 *
 * _.eq(object, object);
 * // => true
 *
 * _.eq(object, other);
 * // => false
 *
 * _.eq('a', 'a');
 * // => true
 *
 * _.eq('a', Object('a'));
 * // => false
 *
 * _.eq(NaN, NaN);
 * // => true
 */
function eq(value, other) {
  return value === other || (value !== value && other !== other);
}

/**
 * Checks if `value` is likely an `arguments` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an `arguments` object,
 *  else `false`.
 * @example
 *
 * _.isArguments(function() { return arguments; }());
 * // => true
 *
 * _.isArguments([1, 2, 3]);
 * // => false
 */
var isArguments = baseIsArguments(function() { return arguments; }()) ? baseIsArguments : function(value) {
  return isObjectLike(value) && hasOwnProperty.call(value, 'callee') &&
    !propertyIsEnumerable.call(value, 'callee');
};

/**
 * Checks if `value` is classified as an `Array` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an array, else `false`.
 * @example
 *
 * _.isArray([1, 2, 3]);
 * // => true
 *
 * _.isArray(document.body.children);
 * // => false
 *
 * _.isArray('abc');
 * // => false
 *
 * _.isArray(_.noop);
 * // => false
 */
var isArray = Array.isArray;

/**
 * Checks if `value` is array-like. A value is considered array-like if it's
 * not a function and has a `value.length` that's an integer greater than or
 * equal to `0` and less than or equal to `Number.MAX_SAFE_INTEGER`.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is array-like, else `false`.
 * @example
 *
 * _.isArrayLike([1, 2, 3]);
 * // => true
 *
 * _.isArrayLike(document.body.children);
 * // => true
 *
 * _.isArrayLike('abc');
 * // => true
 *
 * _.isArrayLike(_.noop);
 * // => false
 */
function isArrayLike(value) {
  return value != null && isLength(value.length) && !isFunction(value);
}

/**
 * Checks if `value` is a buffer.
 *
 * @static
 * @memberOf _
 * @since 4.3.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a buffer, else `false`.
 * @example
 *
 * _.isBuffer(new Buffer(2));
 * // => true
 *
 * _.isBuffer(new Uint8Array(2));
 * // => false
 */
var isBuffer = nativeIsBuffer || stubFalse;

/**
 * Performs a deep comparison between two values to determine if they are
 * equivalent.
 *
 * **Note:** This method supports comparing arrays, array buffers, booleans,
 * date objects, error objects, maps, numbers, `Object` objects, regexes,
 * sets, strings, symbols, and typed arrays. `Object` objects are compared
 * by their own, not inherited, enumerable properties. Functions and DOM
 * nodes are compared by strict equality, i.e. `===`.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to compare.
 * @param {*} other The other value to compare.
 * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
 * @example
 *
 * var object = { 'a': 1 };
 * var other = { 'a': 1 };
 *
 * _.isEqual(object, other);
 * // => true
 *
 * object === other;
 * // => false
 */
function isEqual(value, other) {
  return baseIsEqual(value, other);
}

/**
 * Checks if `value` is classified as a `Function` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a function, else `false`.
 * @example
 *
 * _.isFunction(_);
 * // => true
 *
 * _.isFunction(/abc/);
 * // => false
 */
function isFunction(value) {
  if (!isObject(value)) {
    return false;
  }
  // The use of `Object#toString` avoids issues with the `typeof` operator
  // in Safari 9 which returns 'object' for typed arrays and other constructors.
  var tag = baseGetTag(value);
  return tag == funcTag || tag == genTag || tag == asyncTag || tag == proxyTag;
}

/**
 * Checks if `value` is a valid array-like length.
 *
 * **Note:** This method is loosely based on
 * [`ToLength`](http://ecma-international.org/ecma-262/7.0/#sec-tolength).
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a valid length, else `false`.
 * @example
 *
 * _.isLength(3);
 * // => true
 *
 * _.isLength(Number.MIN_VALUE);
 * // => false
 *
 * _.isLength(Infinity);
 * // => false
 *
 * _.isLength('3');
 * // => false
 */
function isLength(value) {
  return typeof value == 'number' &&
    value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
}

/**
 * Checks if `value` is the
 * [language type](http://www.ecma-international.org/ecma-262/7.0/#sec-ecmascript-language-types)
 * of `Object`. (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an object, else `false`.
 * @example
 *
 * _.isObject({});
 * // => true
 *
 * _.isObject([1, 2, 3]);
 * // => true
 *
 * _.isObject(_.noop);
 * // => true
 *
 * _.isObject(null);
 * // => false
 */
function isObject(value) {
  var type = typeof value;
  return value != null && (type == 'object' || type == 'function');
}

/**
 * Checks if `value` is object-like. A value is object-like if it's not `null`
 * and has a `typeof` result of "object".
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
 * @example
 *
 * _.isObjectLike({});
 * // => true
 *
 * _.isObjectLike([1, 2, 3]);
 * // => true
 *
 * _.isObjectLike(_.noop);
 * // => false
 *
 * _.isObjectLike(null);
 * // => false
 */
function isObjectLike(value) {
  return value != null && typeof value == 'object';
}

/**
 * Checks if `value` is classified as a typed array.
 *
 * @static
 * @memberOf _
 * @since 3.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a typed array, else `false`.
 * @example
 *
 * _.isTypedArray(new Uint8Array);
 * // => true
 *
 * _.isTypedArray([]);
 * // => false
 */
var isTypedArray = nodeIsTypedArray ? baseUnary(nodeIsTypedArray) : baseIsTypedArray;

/**
 * Creates an array of the own enumerable property names of `object`.
 *
 * **Note:** Non-object values are coerced to objects. See the
 * [ES spec](http://ecma-international.org/ecma-262/7.0/#sec-object.keys)
 * for more details.
 *
 * @static
 * @since 0.1.0
 * @memberOf _
 * @category Object
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 * @example
 *
 * function Foo() {
 *   this.a = 1;
 *   this.b = 2;
 * }
 *
 * Foo.prototype.c = 3;
 *
 * _.keys(new Foo);
 * // => ['a', 'b'] (iteration order is not guaranteed)
 *
 * _.keys('hi');
 * // => ['0', '1']
 */
function keys(object) {
  return isArrayLike(object) ? arrayLikeKeys(object) : baseKeys(object);
}

/**
 * This method returns a new empty array.
 *
 * @static
 * @memberOf _
 * @since 4.13.0
 * @category Util
 * @returns {Array} Returns the new empty array.
 * @example
 *
 * var arrays = _.times(2, _.stubArray);
 *
 * console.log(arrays);
 * // => [[], []]
 *
 * console.log(arrays[0] === arrays[1]);
 * // => false
 */
function stubArray() {
  return [];
}

/**
 * This method returns `false`.
 *
 * @static
 * @memberOf _
 * @since 4.13.0
 * @category Util
 * @returns {boolean} Returns `false`.
 * @example
 *
 * _.times(2, _.stubFalse);
 * // => [false, false]
 */
function stubFalse() {
  return false;
}

module.exports = isEqual;

}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],6:[function(require,module,exports){
module.exports = function (args, opts) {
    if (!opts) opts = {};
    
    var flags = { bools : {}, strings : {}, unknownFn: null };

    if (typeof opts['unknown'] === 'function') {
        flags.unknownFn = opts['unknown'];
    }

    if (typeof opts['boolean'] === 'boolean' && opts['boolean']) {
      flags.allBools = true;
    } else {
      [].concat(opts['boolean']).filter(Boolean).forEach(function (key) {
          flags.bools[key] = true;
      });
    }
    
    var aliases = {};
    Object.keys(opts.alias || {}).forEach(function (key) {
        aliases[key] = [].concat(opts.alias[key]);
        aliases[key].forEach(function (x) {
            aliases[x] = [key].concat(aliases[key].filter(function (y) {
                return x !== y;
            }));
        });
    });

    [].concat(opts.string).filter(Boolean).forEach(function (key) {
        flags.strings[key] = true;
        if (aliases[key]) {
            flags.strings[aliases[key]] = true;
        }
     });

    var defaults = opts['default'] || {};
    
    var argv = { _ : [] };
    Object.keys(flags.bools).forEach(function (key) {
        setArg(key, defaults[key] === undefined ? false : defaults[key]);
    });
    
    var notFlags = [];

    if (args.indexOf('--') !== -1) {
        notFlags = args.slice(args.indexOf('--')+1);
        args = args.slice(0, args.indexOf('--'));
    }

    function argDefined(key, arg) {
        return (flags.allBools && /^--[^=]+$/.test(arg)) ||
            flags.strings[key] || flags.bools[key] || aliases[key];
    }

    function setArg (key, val, arg) {
        if (arg && flags.unknownFn && !argDefined(key, arg)) {
            if (flags.unknownFn(arg) === false) return;
        }

        var value = !flags.strings[key] && isNumber(val)
            ? Number(val) : val
        ;
        setKey(argv, key.split('.'), value);
        
        (aliases[key] || []).forEach(function (x) {
            setKey(argv, x.split('.'), value);
        });
    }

    function setKey (obj, keys, value) {
        var o = obj;
        for (var i = 0; i < keys.length-1; i++) {
            var key = keys[i];
            if (key === '__proto__') return;
            if (o[key] === undefined) o[key] = {};
            if (o[key] === Object.prototype || o[key] === Number.prototype
                || o[key] === String.prototype) o[key] = {};
            if (o[key] === Array.prototype) o[key] = [];
            o = o[key];
        }

        var key = keys[keys.length - 1];
        if (key === '__proto__') return;
        if (o === Object.prototype || o === Number.prototype
            || o === String.prototype) o = {};
        if (o === Array.prototype) o = [];
        if (o[key] === undefined || flags.bools[key] || typeof o[key] === 'boolean') {
            o[key] = value;
        }
        else if (Array.isArray(o[key])) {
            o[key].push(value);
        }
        else {
            o[key] = [ o[key], value ];
        }
    }
    
    function aliasIsBoolean(key) {
      return aliases[key].some(function (x) {
          return flags.bools[x];
      });
    }

    for (var i = 0; i < args.length; i++) {
        var arg = args[i];
        
        if (/^--.+=/.test(arg)) {
            // Using [\s\S] instead of . because js doesn't support the
            // 'dotall' regex modifier. See:
            // http://stackoverflow.com/a/1068308/13216
            var m = arg.match(/^--([^=]+)=([\s\S]*)$/);
            var key = m[1];
            var value = m[2];
            if (flags.bools[key]) {
                value = value !== 'false';
            }
            setArg(key, value, arg);
        }
        else if (/^--no-.+/.test(arg)) {
            var key = arg.match(/^--no-(.+)/)[1];
            setArg(key, false, arg);
        }
        else if (/^--.+/.test(arg)) {
            var key = arg.match(/^--(.+)/)[1];
            var next = args[i + 1];
            if (next !== undefined && !/^-/.test(next)
            && !flags.bools[key]
            && !flags.allBools
            && (aliases[key] ? !aliasIsBoolean(key) : true)) {
                setArg(key, next, arg);
                i++;
            }
            else if (/^(true|false)$/.test(next)) {
                setArg(key, next === 'true', arg);
                i++;
            }
            else {
                setArg(key, flags.strings[key] ? '' : true, arg);
            }
        }
        else if (/^-[^-]+/.test(arg)) {
            var letters = arg.slice(1,-1).split('');
            
            var broken = false;
            for (var j = 0; j < letters.length; j++) {
                var next = arg.slice(j+2);
                
                if (next === '-') {
                    setArg(letters[j], next, arg)
                    continue;
                }
                
                if (/[A-Za-z]/.test(letters[j]) && /=/.test(next)) {
                    setArg(letters[j], next.split('=')[1], arg);
                    broken = true;
                    break;
                }
                
                if (/[A-Za-z]/.test(letters[j])
                && /-?\d+(\.\d*)?(e-?\d+)?$/.test(next)) {
                    setArg(letters[j], next, arg);
                    broken = true;
                    break;
                }
                
                if (letters[j+1] && letters[j+1].match(/\W/)) {
                    setArg(letters[j], arg.slice(j+2), arg);
                    broken = true;
                    break;
                }
                else {
                    setArg(letters[j], flags.strings[letters[j]] ? '' : true, arg);
                }
            }
            
            var key = arg.slice(-1)[0];
            if (!broken && key !== '-') {
                if (args[i+1] && !/^(-|--)[^-]/.test(args[i+1])
                && !flags.bools[key]
                && (aliases[key] ? !aliasIsBoolean(key) : true)) {
                    setArg(key, args[i+1], arg);
                    i++;
                }
                else if (args[i+1] && /^(true|false)$/.test(args[i+1])) {
                    setArg(key, args[i+1] === 'true', arg);
                    i++;
                }
                else {
                    setArg(key, flags.strings[key] ? '' : true, arg);
                }
            }
        }
        else {
            if (!flags.unknownFn || flags.unknownFn(arg) !== false) {
                argv._.push(
                    flags.strings['_'] || !isNumber(arg) ? arg : Number(arg)
                );
            }
            if (opts.stopEarly) {
                argv._.push.apply(argv._, args.slice(i + 1));
                break;
            }
        }
    }
    
    Object.keys(defaults).forEach(function (key) {
        if (!hasKey(argv, key.split('.'))) {
            setKey(argv, key.split('.'), defaults[key]);
            
            (aliases[key] || []).forEach(function (x) {
                setKey(argv, x.split('.'), defaults[key]);
            });
        }
    });
    
    if (opts['--']) {
        argv['--'] = new Array();
        notFlags.forEach(function(key) {
            argv['--'].push(key);
        });
    }
    else {
        notFlags.forEach(function(key) {
            argv._.push(key);
        });
    }

    return argv;
};

function hasKey (obj, keys) {
    var o = obj;
    keys.slice(0,-1).forEach(function (key) {
        o = (o[key] || {});
    });

    var key = keys[keys.length - 1];
    return key in o;
}

function isNumber (x) {
    if (typeof x === 'number') return true;
    if (/^0x[0-9a-f]+$/i.test(x)) return true;
    return /^[-+]?(?:\d+(?:\.\d*)?|\.\d+)(e[-+]?\d+)?$/.test(x);
}


},{}],7:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],8:[function(require,module,exports){
/**
 * Convert array of 16 byte values to UUID string format of the form:
 * XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
 */
var byteToHex = [];
for (var i = 0; i < 256; ++i) {
  byteToHex[i] = (i + 0x100).toString(16).substr(1);
}

function bytesToUuid(buf, offset) {
  var i = offset || 0;
  var bth = byteToHex;
  // join used to fix memory issue caused by concatenation: https://bugs.chromium.org/p/v8/issues/detail?id=3175#c4
  return ([
    bth[buf[i++]], bth[buf[i++]],
    bth[buf[i++]], bth[buf[i++]], '-',
    bth[buf[i++]], bth[buf[i++]], '-',
    bth[buf[i++]], bth[buf[i++]], '-',
    bth[buf[i++]], bth[buf[i++]], '-',
    bth[buf[i++]], bth[buf[i++]],
    bth[buf[i++]], bth[buf[i++]],
    bth[buf[i++]], bth[buf[i++]]
  ]).join('');
}

module.exports = bytesToUuid;

},{}],9:[function(require,module,exports){
// Unique ID creation requires a high quality random # generator.  In the
// browser this is a little complicated due to unknown quality of Math.random()
// and inconsistent support for the `crypto` API.  We do the best we can via
// feature-detection

// getRandomValues needs to be invoked in a context where "this" is a Crypto
// implementation. Also, find the complete implementation of crypto on IE11.
var getRandomValues = (typeof(crypto) != 'undefined' && crypto.getRandomValues && crypto.getRandomValues.bind(crypto)) ||
                      (typeof(msCrypto) != 'undefined' && typeof window.msCrypto.getRandomValues == 'function' && msCrypto.getRandomValues.bind(msCrypto));

if (getRandomValues) {
  // WHATWG crypto RNG - http://wiki.whatwg.org/wiki/Crypto
  var rnds8 = new Uint8Array(16); // eslint-disable-line no-undef

  module.exports = function whatwgRNG() {
    getRandomValues(rnds8);
    return rnds8;
  };
} else {
  // Math.random()-based (RNG)
  //
  // If all else fails, use Math.random().  It's fast, but is of unspecified
  // quality.
  var rnds = new Array(16);

  module.exports = function mathRNG() {
    for (var i = 0, r; i < 16; i++) {
      if ((i & 0x03) === 0) r = Math.random() * 0x100000000;
      rnds[i] = r >>> ((i & 0x03) << 3) & 0xff;
    }

    return rnds;
  };
}

},{}],10:[function(require,module,exports){
var rng = require('./lib/rng');
var bytesToUuid = require('./lib/bytesToUuid');

function v4(options, buf, offset) {
  var i = buf && offset || 0;

  if (typeof(options) == 'string') {
    buf = options === 'binary' ? new Array(16) : null;
    options = null;
  }
  options = options || {};

  var rnds = options.random || (options.rng || rng)();

  // Per 4.4, set bits for version and `clock_seq_hi_and_reserved`
  rnds[6] = (rnds[6] & 0x0f) | 0x40;
  rnds[8] = (rnds[8] & 0x3f) | 0x80;

  // Copy bytes to buffer, if provided
  if (buf) {
    for (var ii = 0; ii < 16; ++ii) {
      buf[i + ii] = rnds[ii];
    }
  }

  return buf || bytesToUuid(rnds);
}

module.exports = v4;

},{"./lib/bytesToUuid":8,"./lib/rng":9}],11:[function(require,module,exports){
const itemTrackedModule = require('./ItemTracked');
var ItemTracked = itemTrackedModule.ItemTracked;
var kdTree = require('./lib/kdTree-min.js').kdTree;
var isEqual = require('lodash.isequal')
var iouAreas = require('./utils').iouAreas

var DEBUG_MODE = false;

// Distance function
const iouDistance = function(item1, item2) {
  // IOU distance, between 0 and 1
  // The smaller the less overlap
  var iou = iouAreas(item1, item2);

  // Invert this as the KDTREESEARCH is looking for the smaller value
  var distance = 1 - iou;

  // If the overlap is iou < 0.95, exclude value
  if(distance > (1 - params.iouLimit)) {
    distance = params.distanceLimit + 1;
  }

  return distance;
}

const params = {
  // DEFAULT_UNMATCHEDFRAMES_TOLERANCE
  // This the number of frame we wait when an object isn't matched before considering it gone
  unMatchedFramesTolerance: 5,
  // DEFAULT_IOU_LIMIT, exclude things from beeing matched if their IOU is lower than this
  // 1 means total overlap whereas 0 means no overlap
  iouLimit: 0.05,
  // Remove new objects fast if they could not be matched in the next frames.
  // Setting this to false ensures the object will stick around at least
  // unMatchedFramesTolerance frames, even if they could neven be matched in
  // subsequent frames.
  fastDelete: true,
  // The function to use to determine the distance between to detected objects
  distanceFunc: iouDistance,
  // The distance limit for matching. If values need to be excluded from
  // matching set their distance to something greater than the distance limit
  distanceLimit: 10000
}

// A dictionary of itemTracked currently tracked
// key: uuid
// value: ItemTracked object
var mapOfItemsTracked = new Map();

// A dictionnary keeping memory of all tracked object (even after they disappear)
// Useful to ouput the file of all items tracked
var mapOfAllItemsTracked = new Map();

// By default, we do not keep all the history in memory
var keepAllHistoryInMemory = false;


exports.computeDistance = iouDistance;

exports.updateTrackedItemsWithNewFrame = function(detectionsOfThisFrame, frameNb) {

  // A kd-tree containing all the itemtracked
  // Need to rebuild on each frame, because itemTracked positions have changed
  var treeItemsTracked = new kdTree(Array.from(mapOfItemsTracked.values()), params.distanceFunc, ["x", "y", "w", "h"]);

  // Contruct a kd tree for the detections of this frame
  var treeDetectionsOfThisFrame = new kdTree(detectionsOfThisFrame, params.distanceFunc, ["x", "y", "w", "h"]);

  // SCENARIO 1: itemsTracked map is empty
  if(mapOfItemsTracked.size === 0) {
    // Just add every detected item as item Tracked
    detectionsOfThisFrame.forEach(function(itemDetected) {
      var newItemTracked = new ItemTracked(itemDetected, frameNb, params.unMatchedFramesTolerance, params.fastDelete)
      // Add it to the map
      mapOfItemsTracked.set(newItemTracked.id, newItemTracked)
      // Add it to the kd tree
      treeItemsTracked.insert(newItemTracked);
    });
  }
  // SCENARIO 2: We already have itemsTracked in the map
  else {
    var matchedList = new Array(detectionsOfThisFrame.length);
    matchedList.fill(false);
    // Match existing Tracked items with the items detected in the new frame
    // For each look in the new detection to find the closest match
    if(detectionsOfThisFrame.length > 0) {
      mapOfItemsTracked.forEach(function(itemTracked) {

        // First predict the new position of the itemTracked
        var predictedPosition = itemTracked.predictNextPosition()

        // Make available for matching
        itemTracked.makeAvailable();

        // Search for a detection that matches
        var treeSearchResult = treeDetectionsOfThisFrame.nearest(predictedPosition, 1, params.distanceLimit)[0];

        // Only for debug assessments of predictions
        var treeSearchResultWithoutPrediction = treeDetectionsOfThisFrame.nearest(itemTracked, 1, params.distanceLimit)[0];
        // Only if we enable the extra refinement
        var treeSearchMultipleResults = treeDetectionsOfThisFrame.nearest(predictedPosition, 2, params.distanceLimit);

        // If we have found something
        if(treeSearchResult) {

          // This is an extra refinement that happens in 0.001% of tracked items matching
          // If IOU overlap is super similar for two potential match, add an extra check
          // if(treeSearchMultipleResults.length === 2) {

          //   var indexFirstChoice = 0;
          //   if(treeSearchMultipleResults[0][1] > treeSearchMultipleResults[1][1]) {
          //     indexFirstChoice = 1;
          //   }

          //   var detectionFirstChoice = {
          //     bbox: treeSearchMultipleResults[indexFirstChoice][0],
          //     distance: treeSearchMultipleResults[indexFirstChoice][1]
          //   }

          //   var detectionSecondChoice = {
          //     bbox: treeSearchMultipleResults[1 - indexFirstChoice][0],
          //     distance: treeSearchMultipleResults[1 - indexFirstChoice][1]
          //   }

          //   const deltaDistance = Math.abs(detectionFirstChoice.distance - detectionSecondChoice.distance);

          //   if(deltaDistance < 0.05) {

          //     detectionFirstChoice.area = detectionFirstChoice.bbox.w * detectionFirstChoice.bbox.h;
          //     detectionSecondChoice.area = detectionSecondChoice.bbox.w * detectionSecondChoice.bbox.h;
          //     var itemTrackedArea = itemTracked.w * itemTracked.h;

          //     var deltaAreaFirstChoice = Math.abs(detectionFirstChoice.area - itemTrackedArea) / (detectionFirstChoice.area + itemTrackedArea);
          //     var deltaAreaSecondChoice = Math.abs(detectionSecondChoice.area - itemTrackedArea) / (detectionSecondChoice.area + itemTrackedArea);

          //     // Compare the area of each, priorize the detections that as a overal similar area
          //     // even if it overlaps less
          //     if(deltaAreaFirstChoice > deltaAreaSecondChoice) {
          //       if(Math.abs(deltaAreaFirstChoice - deltaAreaSecondChoice) > 0.5) {
          //         if(DEBUG_MODE) {
          //           console.log('Switch choice ! wise it seems different for frame: ' + frameNb + ' itemTracked ' + itemTracked.idDisplay)
          //           console.log(Math.abs(deltaAreaFirstChoice - deltaAreaSecondChoice));
          //         }
          //         // Change tree search result:
          //         treeSearchResult = treeSearchMultipleResults[1 - indexFirstChoice]
          //       }
          //     }
          //   }
          // }

          if(DEBUG_MODE) {
           // Assess different results between predition or not
            if(!isEqual(treeSearchResult[0], treeSearchResultWithoutPrediction && treeSearchResultWithoutPrediction[0])) {
              console.log('Making the pre-prediction led to a difference result:');
              console.log('For frame ' + frameNb + ' itemNb ' + itemTracked.idDisplay)
            }
          }

          var indexClosestNewDetectedItem = detectionsOfThisFrame.indexOf(treeSearchResult[0]);
          // If this detections was not already matched to a tracked item
          // (otherwise it would be matched to two tracked items...)
          if(!matchedList[indexClosestNewDetectedItem]) {
            matchedList[indexClosestNewDetectedItem] = {
              idDisplay: itemTracked.idDisplay
            }
            // Update properties of tracked object
            var updatedTrackedItemProperties = detectionsOfThisFrame[indexClosestNewDetectedItem]
            mapOfItemsTracked.get(itemTracked.id)
                            .makeUnavailable()
                            .update(updatedTrackedItemProperties, frameNb)
          } else {
            // Means two already tracked item are concurrent to get assigned a new detections
            // Rule is to priorize the oldest one to avoid id-reassignment
          }
        }
      });
    } else {
      if(DEBUG_MODE) {
        console.log('[Tracker] Nothing detected for frame nº' + frameNb)
      }
      // Make existing tracked item available for deletion (to avoid ghost)
      mapOfItemsTracked.forEach(function(itemTracked) {
        itemTracked.makeAvailable();
      });
    }

    // Add any unmatched items as new trackedItem only if those new items are not too similar
    // to existing trackedItems this avoids adding some double match of YOLO and bring down drasticly reassignments
    if(mapOfItemsTracked.size > 0) { // Safety check to see if we still have object tracked (could have been deleted previously)
      // Rebuild tracked item tree to take in account the new positions
      treeItemsTracked = new kdTree(Array.from(mapOfItemsTracked.values()), params.distanceFunc, ["x", "y", "w", "h"]);
      // console.log(`Nb new items Unmatched : ${matchedList.filter((isMatched) => isMatched === false).length}`)
      matchedList.forEach(function(matched, index) {
        // Iterate through unmatched new detections
        if(!matched) {
          // Do not add as new tracked item if it is to similar to an existing one
          var treeSearchResult = treeItemsTracked.nearest(detectionsOfThisFrame[index], 1, params.distanceLimit)[0];

          if(!treeSearchResult) {
            var newItemTracked = ItemTracked(detectionsOfThisFrame[index], frameNb, params.unMatchedFramesTolerance, params.fastDelete)
            // Add it to the map
            mapOfItemsTracked.set(newItemTracked.id, newItemTracked)
            // Add it to the kd tree
            treeItemsTracked.insert(newItemTracked);
            // Make unvailable
            newItemTracked.makeUnavailable();
          } else {
            // console.log('Do not add, its overlapping an existing object')
          }
        }
      });
     }

    // Start killing the itemTracked (and predicting next position)
    // that are tracked but haven't been matched this frame
    mapOfItemsTracked.forEach(function(itemTracked) {
      if(itemTracked.available) {
        itemTracked.countDown(frameNb);
        itemTracked.updateTheoricalPositionAndSize();
        if(itemTracked.isDead()) {
          mapOfItemsTracked.delete(itemTracked.id);
          treeItemsTracked.remove(itemTracked);
          if(keepAllHistoryInMemory) {
            mapOfAllItemsTracked.set(itemTracked.id, itemTracked);
          }
        }
      }
    });

  }
}

exports.reset = function() {
  mapOfItemsTracked = new Map();
  mapOfAllItemsTracked = new Map();
  itemTrackedModule.reset();
}

exports.setParams = function(newParams) {
  Object.keys(newParams).forEach((key) => {
    params[key] = newParams[key];
  });
}

exports.enableKeepInMemory = function() {
  keepAllHistoryInMemory = true;
}

exports.disableKeepInMemory = function() {
  keepAllHistoryInMemory = false;
}

exports.getJSONOfTrackedItems = function(roundInt = true) {
  return Array.from(mapOfItemsTracked.values()).map(function(itemTracked) {
    return itemTracked.toJSON(roundInt);
  });
};

exports.getJSONDebugOfTrackedItems = function(roundInt = true) {
  return Array.from(mapOfItemsTracked.values()).map(function(itemTracked) {
    return itemTracked.toJSONDebug(roundInt);
  });
};

exports.getTrackedItemsInMOTFormat = function(frameNb) {
  return Array.from(mapOfItemsTracked.values()).map(function(itemTracked) {
    return itemTracked.toMOT(frameNb);
  });
};

// Work only if keepInMemory is enabled
exports.getAllTrackedItems = function() {
  return mapOfAllItemsTracked;
};

// Work only if keepInMemory is enabled
exports.getJSONOfAllTrackedItems = function() {
  return Array.from(mapOfAllItemsTracked.values()).map(function(itemTracked) {
    return itemTracked.toJSONGenericInfo();
  });
};

},{"./ItemTracked":1,"./lib/kdTree-min.js":2,"./utils":12,"lodash.isequal":5}],12:[function(require,module,exports){
exports.isDetectionTooLarge = (detections, largestAllowed) => {
  if(detections.w >= largestAllowed) {
    return true;
  } else {
    return false;
  }
}

const isInsideArea = (area, point) => {
  const xMin = area.x - area.w / 2;
  const xMax = area.x + area.w / 2;
  const yMin = area.y - area.h / 2;
  const yMax = area.y + area.h / 2;

  if(point.x >= xMin &&
     point.x <= xMax &&
     point.y >= yMin &&
     point.y <= yMax) {
    return true;
  } else {
    return false;
  }
}

exports.isInsideArea = isInsideArea;

exports.isInsideSomeAreas = (areas, point) => {
  const isInside = areas.some((area) => isInsideArea(area, point));
  return isInside;
}

exports.ignoreObjectsNotToDetect = (detections, objectsToDetect) => {
  return detections.filter((detection) => objectsToDetect.indexOf(detection.name) > -1)
}

const getRectangleEdges = (item) => {
  return {
    x0: item.x - item.w / 2,
    y0: item.y - item.h / 2,
    x1: item.x + item.w / 2,
    y1: item.y + item.h / 2,
  }
}

exports.getRectangleEdges = getRectangleEdges;

exports.iouAreas = (item1, item2) => {

  var rect1 = getRectangleEdges(item1);
  var rect2 = getRectangleEdges(item2);
  
  // Get overlap rectangle
  var overlap_x0 = Math.max(rect1.x0, rect2.x0)
  var overlap_y0 = Math.max(rect1.y0, rect2.y0)
  var overlap_x1 = Math.min(rect1.x1, rect2.x1)
  var overlap_y1 = Math.min(rect1.y1, rect2.y1)

  // if there an overlap
  if((overlap_x1 - overlap_x0) <= 0 || (overlap_y1 - overlap_y0) <= 0) {
    // no overlap
    return 0
  } else {
    area_rect1 = item1.w * item1.h
    area_rect2 = item2.w * item2.h
    area_intersection = (overlap_x1 - overlap_x0) * (overlap_y1 - overlap_y0)
    area_union = area_rect1 + area_rect2 - area_intersection
    return area_intersection / area_union
  }
}


exports.computeVelocityVector = (item1, item2, nbFrame) => {
  return {
    dx: (item2.x - item1.x) / nbFrame,
    dy: (item2.y - item1.y) / nbFrame,
  }
}

/*

  computeBearingIn360

                       dY

                       ^               XX
                       |             XXX
                       |            XX
                       |           XX
                       |         XX
                       |       XXX
                       |      XX
                       |     XX
                       |    XX    bearing = this angle in degree
                       |  XX
                       |XX
+----------------------XX----------------------->  dX
                       |
                       |
                       |
                       |
                       |
                       |
                       |
                       |
                       |
                       |
                       |
                       +

*/

exports.computeBearingIn360 = function(dx,dy) {
  var angle = Math.atan(dx/dy)/(Math.PI/180)
  if ( angle > 0 ) {
    if (dy > 0)
      return angle;
    else
      return 180 + angle;
  } else {
    if (dx > 0)
      return 180 + angle;
    else
      return 360 + angle;
  }
}

},{}]},{},[3])(3)
});
