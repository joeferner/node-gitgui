'use strict';

module.exports = function (diff) {
  var results = [];
  var current = null;
  var fromLineNumber = 1;
  var toLineNumber = 1;
  diff.split('\n').forEach(function (line) {
    if (line.indexOf('diff ') === 0 || line.indexOf('index ') === 0) {
      return;
    }

    if (line.indexOf('--- ') === 0) {
      if (current) {
        results.push(current);
      }
      current = {
        from: line.substr('--- '.length),
        lines: []
      };
      return;
    }

    if (!current) {
      return;
    }

    if (line.indexOf('+++ ') === 0) {
      current.to = line.substr('+++ '.length);
      return;
    }

    if (line.indexOf('@@ ') === 0) {
      // todo: ignore for now since we only handle full context diffs.
      return;
    }

    var lineData = {
      action: line[0],
      line: line.substr(1)
    };
    if (line[0] === '-') {
      lineData.fromLineNumber = fromLineNumber;
      fromLineNumber++;
    } else if (line[0] === '+') {
      lineData.toLineNumber = toLineNumber;
      toLineNumber++;
    } else {
      lineData.fromLineNumber = fromLineNumber;
      lineData.toLineNumber = toLineNumber;
      fromLineNumber++;
      toLineNumber++;
    }

    current.lines.push(lineData);
  });
  if (current) {
    results.push(current);
  }
  return results;
};
