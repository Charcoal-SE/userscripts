exports.equal = (a, b) => {
  var aKeys = Object.keys(a);
  var bKeys = Object.keys(b);

  if (aKeys.length === bKeys.length) {
    for (var i = 0; i < aKeys.length; i++) {
      var aKey = aKeys[i];
      var bKey = bKeys[i];

      if (!a.hasOwnProperty(bKey) || !b.hasOwnProperty(aKey)) {
        return false;
      }

      if (a[aKey] instanceof Array) {
        if (!exports.aryEqual(a[aKey], b[aKey])) {
          return false;
        }
      }
      else if (typeof a[aKey] === "object") {
        if (!exports.equal(a[aKey], b[aKey])) {
          return false;
        }
      }
      else if (a[aKey] !== b[aKey]) {
        return false;
      }
    }
    return true;
  }
  return false;
};

exports.aryEqual = (a, b) => {
  if (a.length !== b.length) {
    return false;
  }

  for (var i = 0; i < a.length; i++) {
    if (a[i] instanceof Array) {
      if (!exports.aryEqual(a[i], b[i])) {
        return false;
      }
    }
    else if (typeof a[i] === "object") {
      if (!exports.equal(a[i], b[i])) {
        return false;
      }
    }
    else if (a[i] !== b[i]) {
      return false;
    }
  }
  return true;
};
