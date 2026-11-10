// node_modules/effect/dist/Pipeable.js
var pipeArguments = (self, args2) => {
  switch (args2.length) {
    case 0:
      return self;
    case 1:
      return args2[0](self);
    case 2:
      return args2[1](args2[0](self));
    case 3:
      return args2[2](args2[1](args2[0](self)));
    case 4:
      return args2[3](args2[2](args2[1](args2[0](self))));
    case 5:
      return args2[4](args2[3](args2[2](args2[1](args2[0](self)))));
    case 6:
      return args2[5](args2[4](args2[3](args2[2](args2[1](args2[0](self))))));
    case 7:
      return args2[6](args2[5](args2[4](args2[3](args2[2](args2[1](args2[0](self)))))));
    case 8:
      return args2[7](args2[6](args2[5](args2[4](args2[3](args2[2](args2[1](args2[0](self))))))));
    case 9:
      return args2[8](args2[7](args2[6](args2[5](args2[4](args2[3](args2[2](args2[1](args2[0](self)))))))));
    default: {
      let ret = self;
      for (let i = 0, len = args2.length; i < len; i++) {
        ret = args2[i](ret);
      }
      return ret;
    }
  }
};

// node_modules/effect/dist/Function.js
var dual = function(arity, body) {
  if (typeof arity === "function") {
    return function() {
      return arity(arguments) ? body.apply(this, arguments) : (self) => body(self, ...arguments);
    };
  }
  switch (arity) {
    case 0:
    case 1:
      throw new RangeError(`Invalid arity ${arity}`);
    case 2:
      return function(a, b) {
        if (arguments.length >= 2) {
          return body(a, b);
        }
        return function(self) {
          return body(self, a);
        };
      };
    case 3:
      return function(a, b, c) {
        if (arguments.length >= 3) {
          return body(a, b, c);
        }
        return function(self) {
          return body(self, a, b);
        };
      };
    default:
      return function() {
        if (arguments.length >= arity) {
          return body.apply(this, arguments);
        }
        const args2 = arguments;
        return function(self) {
          return body(self, ...args2);
        };
      };
  }
};
var identity = (a) => a;
var constant = (value) => () => value;
var constTrue = /* @__PURE__ */ constant(true);
var constUndefined = /* @__PURE__ */ constant(void 0);
var constVoid = constUndefined;

// node_modules/effect/dist/internal/equal.js
var getAllObjectKeys = (obj) => {
  const keys = new Set(Reflect.ownKeys(obj));
  if (obj.constructor === Object) return keys;
  if (obj instanceof Error) {
    keys.delete("stack");
  }
  const proto = Object.getPrototypeOf(obj);
  let current = proto;
  while (current !== null && current !== Object.prototype) {
    const ownKeys = Reflect.ownKeys(current);
    for (let i = 0; i < ownKeys.length; i++) {
      keys.add(ownKeys[i]);
    }
    current = Object.getPrototypeOf(current);
  }
  if (keys.has("constructor") && typeof obj.constructor === "function" && proto === obj.constructor.prototype) {
    keys.delete("constructor");
  }
  return keys;
};
var byReferenceInstances = /* @__PURE__ */ new WeakSet();
var viewBytes = (view) => new Uint8Array(view.buffer, view.byteOffset, view.byteLength);
var isArrayBufferLike = (u) => u instanceof ArrayBuffer || typeof SharedArrayBuffer !== "undefined" && u instanceof SharedArrayBuffer;
var bufferBytes = (buffer) => {
  try {
    return new Uint8Array(buffer);
  } catch {
    return void 0;
  }
};

// node_modules/effect/dist/internal/hash.js
var backEdges = 0;
var addBackEdge = () => {
  backEdges++;
};

// node_modules/effect/dist/Predicate.js
function isFunction(input) {
  return typeof input === "function";
}
function isObjectKeyword(input) {
  return typeof input === "object" && input !== null || isFunction(input);
}
var hasProperty = /* @__PURE__ */ dual(2, (self, property) => isObjectKeyword(self) && property in self);

// node_modules/effect/dist/Hash.js
var symbol = "~effect/Hash";
var hash = (self) => {
  switch (typeof self) {
    case "number":
      return number(self);
    case "bigint":
      return string(self.toString(10));
    case "string":
      return string(self);
    case "function":
    case "object": {
      if (self === null) {
        break;
      } else if (self instanceof Date) {
        if (Number.isNaN(self.getTime())) {
          return string("Invalid Date");
        }
        return string(self.toISOString());
      } else if (self instanceof RegExp) {
        return string(self.toString());
      } else {
        if (byReferenceInstances.has(self)) {
          return random(self);
        }
        const cached2 = hashCache.get(self);
        if (cached2 !== void 0) {
          return cached2;
        }
        if (visitedObjects.has(self)) {
          addBackEdge();
          return string("[Circular]");
        }
        visitedObjects.add(self);
        const seen = backEdges;
        let h;
        try {
          if (isHash(self)) {
            h = self[symbol]();
          } else if (typeof self === "function") {
            h = random(self);
          } else if (isArrayBufferLike(self)) {
            const bytes = bufferBytes(self);
            h = bytes === void 0 ? random(self) : array(bytes);
          } else if (self instanceof DataView) {
            h = array(viewBytes(self));
          } else if (Array.isArray(self) || ArrayBuffer.isView(self)) {
            h = array(self);
          } else if (self instanceof Map) {
            h = hashMap(self);
          } else if (self instanceof Set) {
            h = hashSet(self);
          } else {
            h = structure(self);
          }
        } finally {
          visitedObjects.delete(self);
        }
        if (seen === backEdges) {
          hashCache.set(self, h);
        }
        return h;
      }
    }
  }
  return optimize(mix(string(String(self))));
};
var random = (self) => {
  if (!randomHashCache.has(self)) {
    randomHashCache.set(self, optimize(Math.random() * 4294967296 | 0));
  }
  return randomHashCache.get(self);
};
var mix = (h) => {
  h ^= h >>> 16;
  h = Math.imul(h, 2246822507);
  h ^= h >>> 13;
  h = Math.imul(h, 3266489909);
  return h ^ h >>> 16;
};
var combine = /* @__PURE__ */ dual(2, (self, b) => mix(Math.imul(self, 2654435761) + Math.imul(b, 2246822507)));
var optimize = (n) => n & 3221225471 | n >>> 1 & 1073741824;
var isHash = (u) => hasProperty(u, symbol) && typeof u[symbol] === "function";
var float64 = /* @__PURE__ */ new DataView(/* @__PURE__ */ new ArrayBuffer(8));
var number = (n) => {
  const h = n | 0;
  if (h === n) {
    return optimize(h);
  }
  float64.setFloat64(0, n !== n ? NaN : n);
  return optimize(combine(float64.getInt32(0), float64.getInt32(4)));
};
var string = (str) => {
  let h = 5381, i = str.length;
  while (i) {
    h = h * 33 ^ str.charCodeAt(--i);
  }
  return optimize(h);
};
var structureKeys = (o, keys) => {
  let h = 12289;
  for (const key of keys) {
    h ^= combine(hash(key), hash(o[key]));
  }
  return optimize(h);
};
var structure = (o) => structureKeys(o, getAllObjectKeys(o));
var unordered = (seed, f) => (iter) => {
  let h = seed;
  for (const element of iter) {
    h ^= f(element);
  }
  return optimize(h);
};
var array = (arr) => {
  let h = 6151;
  for (const element of arr) {
    h = combine(h, hash(element));
  }
  return optimize(h);
};
var hashMap = /* @__PURE__ */ unordered(/* @__PURE__ */ string("Map"), ([k, v]) => combine(hash(k), hash(v)));
var setSeed = /* @__PURE__ */ string("Set");
var hashSet = /* @__PURE__ */ unordered(setSeed, (element) => combine(setSeed, hash(element)));
var randomHashCache = /* @__PURE__ */ new WeakMap();
var hashCache = /* @__PURE__ */ new WeakMap();
var visitedObjects = /* @__PURE__ */ new WeakSet();

// node_modules/effect/dist/Equal.js
var symbol2 = "~effect/Equal";
function equals() {
  if (arguments.length === 1) {
    return (self) => compareBoth(self, arguments[0]);
  }
  return compareBoth(arguments[0], arguments[1]);
}
function compareBoth(self, that) {
  if (self === that) return true;
  if (self == null || that == null) return false;
  const selfType = typeof self;
  if (selfType !== typeof that) {
    return false;
  }
  if (selfType === "number" && self !== self && that !== that) {
    return true;
  }
  if (selfType !== "object" && selfType !== "function") {
    return false;
  }
  if (byReferenceInstances.has(self) || byReferenceInstances.has(that)) {
    return false;
  }
  return compareObjects(self, that);
}
function compareObjects(self, that) {
  const depth = pathLeft.length;
  for (let i = depth; i-- > 0; ) {
    if (pathLeft[i] === self && pathRight[i] === that) return true;
  }
  if (depth) return compareOnPath(self, that);
  let known = results.get(self);
  if (!known) results.set(self, known = /* @__PURE__ */ new WeakMap());
  let result2 = known.get(that);
  if (result2 === void 0) known.set(that, result2 = compareOnPath(self, that));
  return result2;
}
function compareOnPath(self, that) {
  pathLeft.push(self);
  pathRight.push(that);
  try {
    return compareStructure(self, that);
  } finally {
    pathLeft.pop();
    pathRight.pop();
  }
}
var pathLeft = [];
var pathRight = [];
var results = /* @__PURE__ */ new WeakMap();
function compareStructure(self, that) {
  if (hash(self) !== hash(that)) {
    return false;
  } else if (self instanceof Date) {
    if (!(that instanceof Date)) return false;
    const selfTime = self.getTime();
    const thatTime = that.getTime();
    return selfTime === thatTime || Number.isNaN(selfTime) && Number.isNaN(thatTime);
  } else if (self instanceof RegExp) {
    return that instanceof RegExp && self.toString() === that.toString();
  }
  const bothEquals = isEqual(self);
  if (bothEquals !== isEqual(that) || typeof self === "function" && !bothEquals) {
    return false;
  } else if (bothEquals) {
    return self[symbol2](that);
  } else if (Array.isArray(self)) {
    if (!Array.isArray(that) || self.length !== that.length) {
      return false;
    }
    return compareArrays(self, that);
  } else if (isArrayBufferLike(self)) {
    if (!isArrayBufferLike(that) || self instanceof ArrayBuffer !== that instanceof ArrayBuffer) {
      return false;
    }
    const selfBytes = bufferBytes(self);
    const thatBytes = bufferBytes(that);
    return selfBytes !== void 0 && thatBytes !== void 0 && compareTypedArrays(selfBytes, thatBytes);
  } else if (ArrayBuffer.isView(self)) {
    const selfIsDataView = self instanceof DataView;
    if (!ArrayBuffer.isView(that) || self.byteLength !== that.byteLength || selfIsDataView !== that instanceof DataView) {
      return false;
    }
    if (selfIsDataView) {
      return compareTypedArrays(viewBytes(self), viewBytes(that));
    }
    return compareTypedArrays(self, that);
  } else if (self instanceof Map) {
    if (!(that instanceof Map) || self.size !== that.size) {
      return false;
    }
    return compareHashed(self, that, entryHash, equalEntries);
  } else if (self instanceof Set) {
    if (!(that instanceof Set) || self.size !== that.size) {
      return false;
    }
    return compareHashed(self, that, hash, compareBoth);
  }
  return compareRecords(self, that);
}
function compareArrays(self, that) {
  for (let i = 0; i < self.length; i++) {
    if (!compareBoth(self[i], that[i])) {
      return false;
    }
  }
  return true;
}
function compareTypedArrays(self, that) {
  if (self.length !== that.length) {
    return false;
  }
  for (let i = 0; i < self.length; i++) {
    if (self[i] !== that[i]) {
      return false;
    }
  }
  return true;
}
function compareRecords(self, that) {
  const selfKeys = getAllObjectKeys(self);
  const thatKeys = getAllObjectKeys(that);
  if (selfKeys.size !== thatKeys.size) {
    return false;
  }
  for (const key of selfKeys) {
    if (!thatKeys.has(key) || !compareBoth(self[key], that[key])) {
      return false;
    }
  }
  return true;
}
function compareHashed(self, that, hashOf, equivalent) {
  const groups = /* @__PURE__ */ new Map();
  let remaining = 0;
  for (const item of that) {
    const h = hashOf(item);
    const group = groups.get(h);
    if (group) group.push(item);
    else groups.set(h, [item]);
    remaining++;
  }
  outer: for (const item of self) {
    const group = groups.get(hashOf(item));
    if (group) {
      for (let i = 0; i < group.length; i++) {
        if (equivalent(item, group[i])) {
          group[i] = group[group.length - 1];
          group.pop();
          remaining--;
          continue outer;
        }
      }
    }
    return false;
  }
  return remaining === 0;
}
var entryHash = (entry) => hash(entry[0]);
var equalEntries = (self, that) => compareBoth(self[0], that[0]) && compareBoth(self[1], that[1]);
var isEqual = (u) => hasProperty(u, symbol2) && typeof u[symbol2] === "function";

// node_modules/effect/dist/Redactable.js
var symbolRedactable = /* @__PURE__ */ Symbol.for("~effect/Redactable");
var isRedactable = (u) => hasProperty(u, symbolRedactable);
function redact(u) {
  if (isRedactable(u)) return getRedacted(u);
  return u;
}
function getRedacted(redactable) {
  return redactable[symbolRedactable](globalThis[currentFiberTypeId]?.context ?? emptyContext);
}
var currentFiberTypeId = "~effect/Fiber/currentFiber";
var emptyMap = /* @__PURE__ */ new Map();
var emptyContext = {
  "~effect/Context": {},
  base: emptyMap,
  depth: 0,
  mapUnsafe: emptyMap,
  pipe() {
    return pipeArguments(this, arguments);
  }
};

// node_modules/effect/dist/Formatter.js
function format(input, options) {
  const space = options?.space ?? 0;
  const ancestors = /* @__PURE__ */ new WeakSet();
  const gap = !space ? "" : typeof space === "number" ? " ".repeat(space) : space;
  const ind = (d) => gap.repeat(d);
  const wrap = (v, body) => {
    const ctor = v?.constructor;
    return ctor && ctor !== Object.prototype.constructor && ctor.name ? `${ctor.name}(${body})` : body;
  };
  const ownKeys = (o) => {
    try {
      return Reflect.ownKeys(o);
    } catch {
      return ["[ownKeys threw]"];
    }
  };
  function recur(v, d = 0) {
    try {
      return recurUnsafe(v, d);
    } catch {
      if (typeof v === "object" && v !== null || typeof v === "function") ancestors.delete(v);
      return "[inspection threw]";
    }
  }
  function recurUnsafe(v, d = 0) {
    if (typeof v === "string") return JSON.stringify(v);
    if (typeof v === "number" || v == null || typeof v === "boolean" || typeof v === "symbol") return String(v);
    if (typeof v === "bigint") return String(v) + "n";
    if (typeof v === "object" || typeof v === "function") {
      if (ancestors.has(v)) return CIRCULAR;
      ancestors.add(v);
      let output;
      if (symbolRedactable in v) {
        output = recur(getRedacted(v), d);
      } else if (Array.isArray(v)) {
        output = !gap || v.length <= 1 ? `[${v.map((x) => recur(x, d)).join(",")}]` : `[
${ind(d + 1)}${v.map((x) => recur(x, d + 1)).join(",\n" + ind(d + 1))}
${ind(d)}]`;
      } else if (v instanceof Date) {
        output = formatDate(v);
      } else if (!options?.ignoreToString && hasProperty(v, "toString") && typeof v["toString"] === "function" && v["toString"] !== Object.prototype.toString && v["toString"] !== Array.prototype.toString) {
        const s = safeToString(v);
        output = v instanceof Error && v.cause !== void 0 ? `${s} (cause: ${recur(v.cause, d)})` : s;
      } else if (Symbol.iterator in v) {
        output = `${v.constructor.name}(${recur(Array.from(v), d)})`;
      } else {
        const keys = ownKeys(v);
        if (!gap || keys.length <= 1) {
          const body = `{${keys.map((k) => `${formatPropertyKey(k)}:${recur(safeGet(v, k), d)}`).join(",")}}`;
          output = wrap(v, body);
        } else {
          const body = `{
${keys.map((k) => `${ind(d + 1)}${formatPropertyKey(k)}: ${recur(safeGet(v, k), d + 1)}`).join(",\n")}
${ind(d)}}`;
          output = wrap(v, body);
        }
      }
      ancestors.delete(v);
      return output;
    }
    return String(v);
  }
  return recur(input, 0);
}
var CIRCULAR = "[Circular]";
function formatPropertyKey(name) {
  return typeof name === "string" ? JSON.stringify(name) : String(name);
}
function formatDate(date) {
  try {
    return date.toISOString();
  } catch {
    return "Invalid Date";
  }
}
function safeToString(input) {
  try {
    const s = input.toString();
    return typeof s === "string" ? s : String(s);
  } catch {
    return "[toString threw]";
  }
}
function safeGet(input, key) {
  try {
    return input[key];
  } catch {
    return "[property access threw]";
  }
}

// node_modules/effect/dist/Inspectable.js
var NodeInspectSymbol = /* @__PURE__ */ Symbol.for("nodejs.util.inspect.custom");
var toJson = (input) => {
  try {
    input = redact(input);
    if (hasProperty(input, "toJSON") && isFunction(input["toJSON"]) && input["toJSON"].length === 0) {
      return input.toJSON();
    } else if (Array.isArray(input)) {
      return input.map(toJson);
    }
    return input;
  } catch {
    return "[toJSON threw]";
  }
};
var BaseProto = {
  toJSON() {
    return toJson(this);
  },
  [NodeInspectSymbol]() {
    return this.toJSON();
  },
  toString() {
    return format(this.toJSON());
  }
};
var Class = class {
  /**
   * Node.js custom inspection method.
   *
   * **When to use**
   *
   * Use to expose the class JSON representation to Node.js inspection.
   *
   * @since 2.0.0
   */
  [NodeInspectSymbol]() {
    return this.toJSON();
  }
  /**
   * Returns a formatted string representation of this object.
   *
   * **When to use**
   *
   * Use to format the class JSON representation as a string.
   *
   * @since 2.0.0
   */
  toString() {
    return format(this.toJSON());
  }
};

// node_modules/effect/dist/internal/stackTraceLimit.js
var isStackTraceLimitWritable = () => {
  const desc = Object.getOwnPropertyDescriptor(Error, "stackTraceLimit");
  if (desc === void 0) {
    return Object.isExtensible(Error);
  }
  return Object.hasOwn(desc, "writable") ? desc.writable === true : desc.set !== void 0;
};
var canWriteStackTraceLimit = /* @__PURE__ */ isStackTraceLimitWritable();
var getStackTraceLimit = () => Error.stackTraceLimit;
var setStackTraceLimit = (value) => {
  if (canWriteStackTraceLimit) {
    ;
    Error.stackTraceLimit = value;
  }
};

// node_modules/effect/dist/Utils.js
var SingleShotGen = class {
  constructor(self) {
    this.value = self;
    this.done = false;
  }
  /**
   * Yields the stored value once, then completes with the value sent back in.
   *
   * **When to use**
   *
   * Use to advance a `SingleShotGen` through its single yield and completion
   * step.
   *
   * @since 2.0.0
   */
  next(a) {
    if (this.done) {
      this.value = a;
      return this;
    }
    this.done = true;
    return {
      value: this.value,
      done: false
    };
  }
};
var pickInternalCall = () => {
  const InternalTypeId = "~effect/Utils/internal";
  const standard = {
    [InternalTypeId]: (body) => {
      return body();
    }
  };
  const forced = {
    [InternalTypeId]: (body) => {
      try {
        return body();
      } finally {
      }
    }
  };
  const limit = getStackTraceLimit();
  if (limit === 0) return forced[InternalTypeId];
  setStackTraceLimit(2);
  const error = standard[InternalTypeId](() => new Error());
  setStackTraceLimit(limit);
  return error.stack?.includes(InternalTypeId) === true ? standard[InternalTypeId] : forced[InternalTypeId];
};
var internalCall = /* @__PURE__ */ pickInternalCall();

// node_modules/effect/dist/internal/record.js
function assignProperty(self, key, value) {
  if (key === "__proto__") {
    Object.defineProperty(self, key, {
      value,
      writable: true,
      enumerable: true,
      configurable: true
    });
  } else {
    ;
    self[key] = value;
  }
}
function assignProperties(self, source) {
  if (!Object.hasOwn(source, "__proto__")) {
    Object.assign(self, source);
    return;
  }
  for (const key of Reflect.ownKeys(source)) {
    if (Object.prototype.propertyIsEnumerable.call(source, key)) {
      assignProperty(self, key, source[key]);
    }
  }
}

// node_modules/effect/dist/internal/core.js
var EffectTypeId = `~effect/Effect`;
var ExitTypeId = `~effect/Exit`;
var effectVariance = {
  _A: identity,
  _E: identity,
  _R: identity
};
var identifier = `${EffectTypeId}/identifier`;
var args = `${EffectTypeId}/args`;
var evaluate = `${EffectTypeId}/evaluate`;
var contA = `${EffectTypeId}/successCont`;
var contE = `${EffectTypeId}/failureCont`;
var contAll = `${EffectTypeId}/ensureCont`;
var Yield = /* @__PURE__ */ Symbol.for("effect/Effect/Yield");
var PipeInspectableProto = {
  pipe() {
    return pipeArguments(this, arguments);
  },
  toJSON() {
    return {
      ...this
    };
  },
  toString() {
    return format(this.toJSON(), {
      ignoreToString: true,
      space: 2
    });
  },
  [NodeInspectSymbol]() {
    return this.toJSON();
  }
};
var StructuralProto = {
  [symbol]() {
    return structureKeys(this, Object.keys(this));
  },
  [symbol2](that) {
    const selfKeys = Object.keys(this);
    const thatKeys = Object.keys(that);
    if (selfKeys.length !== thatKeys.length) return false;
    for (let i = 0; i < selfKeys.length; i++) {
      if (selfKeys[i] !== thatKeys[i] || !equals(this[selfKeys[i]], that[selfKeys[i]])) {
        return false;
      }
    }
    return true;
  }
};
var EffectProto = {
  [EffectTypeId]: effectVariance,
  ...PipeInspectableProto,
  [Symbol.iterator]() {
    return new SingleShotGen(this);
  },
  toJSON() {
    return {
      _id: "Effect",
      op: this[identifier],
      ...args in this ? {
        args: this[args]
      } : void 0
    };
  }
};
var isExit = (u) => hasProperty(u, ExitTypeId);
var CauseTypeId = "~effect/Cause";
var CauseReasonTypeId = "~effect/Cause/Reason";
var isCause = (self) => hasProperty(self, CauseTypeId);
var CauseImpl = class {
  constructor(failures) {
    this[CauseTypeId] = CauseTypeId;
    this.reasons = failures;
  }
  pipe() {
    return pipeArguments(this, arguments);
  }
  toJSON() {
    return {
      _id: "Cause",
      reasons: this.reasons.map((f) => f.toJSON())
    };
  }
  toString() {
    return `Cause(${format(this.reasons)})`;
  }
  [NodeInspectSymbol]() {
    return this.toJSON();
  }
  [symbol2](that) {
    return isCause(that) && this.reasons.length === that.reasons.length && this.reasons.every((e, i) => equals(e, that.reasons[i]));
  }
  [symbol]() {
    return array(this.reasons);
  }
};
var annotationsMap = /* @__PURE__ */ new WeakMap();
var ReasonBase = class {
  [CauseReasonTypeId];
  annotations;
  _tag;
  constructor(_tag, annotations, originalError) {
    this[CauseReasonTypeId] = CauseReasonTypeId;
    this._tag = _tag;
    if (annotations !== constEmptyAnnotations && typeof originalError === "object" && originalError !== null && annotations.size > 0) {
      const prevAnnotations = annotationsMap.get(originalError);
      if (prevAnnotations) {
        annotations = new Map([...prevAnnotations, ...annotations]);
      }
      annotationsMap.set(originalError, annotations);
    }
    this.annotations = annotations;
  }
  annotate(annotations, options) {
    if (annotations.mapUnsafe.size === 0) return this;
    const newAnnotations = new Map(this.annotations);
    annotations.mapUnsafe.forEach((value, key) => {
      if (options?.overwrite !== true && newAnnotations.has(key)) return;
      newAnnotations.set(key, value);
    });
    if (options?.overwrite !== true && newAnnotations.size === this.annotations.size) return this;
    const self = Object.assign(Object.create(Object.getPrototypeOf(this)), this);
    self.annotations = newAnnotations;
    return self;
  }
  pipe() {
    return pipeArguments(this, arguments);
  }
  toString() {
    return format(this);
  }
  [NodeInspectSymbol]() {
    return this.toString();
  }
};
var constEmptyAnnotations = /* @__PURE__ */ new Map();
var Fail = class extends ReasonBase {
  constructor(error, annotations = constEmptyAnnotations) {
    super("Fail", annotations, error);
    this.error = error;
  }
  toString() {
    return `Fail(${format(this.error)})`;
  }
  toJSON() {
    return {
      _tag: "Fail",
      error: this.error
    };
  }
  [symbol2](that) {
    return isFailReason(that) && equals(this.error, that.error) && equals(this.annotations, that.annotations);
  }
  [symbol]() {
    return combine(string(this._tag))(combine(hash(this.error))(hash(this.annotations)));
  }
};
var causeFromReasons = (reasons) => new CauseImpl(reasons);
var dedupeReasons = (self, that) => {
  const buckets = /* @__PURE__ */ new Map();
  const out = [];
  for (const reason of self.concat(that)) {
    const hash3 = hash(reason);
    const bucket = buckets.get(hash3);
    if (bucket === void 0) {
      buckets.set(hash3, [reason]);
    } else if (bucket.some((previous) => equals(previous, reason))) {
      continue;
    } else {
      bucket.push(reason);
    }
    out.push(reason);
  }
  return out;
};
var causeCombine = /* @__PURE__ */ dual(2, (self, that) => {
  if (self.reasons.length === 0) {
    return that;
  } else if (that.reasons.length === 0) {
    return self;
  }
  const newCause = new CauseImpl(dedupeReasons(self.reasons, that.reasons));
  return equals(self, newCause) ? self : newCause;
});
var causeAddInterrupts = (self, interrupts) => {
  const reasons = self.reasons.slice();
  for (const reason of interrupts.reasons) {
    if (isInterruptReason(reason) && !reasons.some((r) => isInterruptReason(r) && r.fiberId === reason.fiberId && r.annotations === reason.annotations)) {
      reasons.push(reason);
    }
  }
  return reasons.length === self.reasons.length ? self : new CauseImpl(reasons);
};
var causeFail = (error) => new CauseImpl([new Fail(error)]);
var Die = class extends ReasonBase {
  constructor(defect, annotations = constEmptyAnnotations) {
    super("Die", annotations, defect);
    this.defect = defect;
  }
  toString() {
    return `Die(${format(this.defect)})`;
  }
  toJSON() {
    return {
      _tag: "Die",
      defect: this.defect
    };
  }
  [symbol2](that) {
    return isDieReason(that) && equals(this.defect, that.defect) && equals(this.annotations, that.annotations);
  }
  [symbol]() {
    return combine(string(this._tag))(combine(hash(this.defect))(hash(this.annotations)));
  }
};
var causeDie = (defect) => new CauseImpl([new Die(defect)]);
var causeAnnotate = /* @__PURE__ */ dual((args2) => isCause(args2[0]), (self, annotations, options) => {
  if (annotations.mapUnsafe.size === 0) return self;
  return new CauseImpl(self.reasons.map((f) => f.annotate(annotations, options)));
});
var isFailReason = (self) => self._tag === "Fail";
var isDieReason = (self) => self._tag === "Die";
var isInterruptReason = (self) => self._tag === "Interrupt";
function defaultEvaluate(_fiber) {
  return exitDie(`Effect.evaluate: Not implemented`);
}
var makePrimitiveProto = (options) => ({
  ...EffectProto,
  [identifier]: options.op,
  [evaluate]: options[evaluate] ?? defaultEvaluate,
  [contA]: options[contA],
  [contE]: options[contE],
  [contAll]: options[contAll]
});
var makePrimitive = (options) => {
  const Proto2 = makePrimitiveProto(options);
  const PrimitiveImpl = function(value) {
    this[args] = value;
  };
  PrimitiveImpl.prototype = Proto2;
  return function(value) {
    return new PrimitiveImpl(value);
  };
};
var makeExit = (options) => {
  const Proto2 = {
    [ExitTypeId]: ExitTypeId,
    _tag: options.op,
    get [options.prop]() {
      return this[args];
    },
    ...makePrimitiveProto(options),
    toString() {
      return `${options.op}(${format(this[args])})`;
    },
    toJSON() {
      return {
        _id: "Exit",
        _tag: options.op,
        [options.prop]: this[args]
      };
    },
    [symbol2](that) {
      return isExit(that) && that._tag === this._tag && equals(this[args], that[args]);
    },
    [symbol]() {
      return combine(string(options.op), hash(this[args]));
    }
  };
  const ExitPrimitive = function(value) {
    this[args] = value;
  };
  ExitPrimitive.prototype = Proto2;
  return function(value) {
    return new ExitPrimitive(value);
  };
};
var exitSucceed = /* @__PURE__ */ makeExit({
  op: "Success",
  prop: "value",
  [evaluate](fiber2) {
    const cont = fiber2.getCont(contA);
    return cont ? cont[contA](this[args], fiber2, this) : fiber2.yieldWith(this);
  }
});
var StackTraceKey = {
  key: "effect/Cause/StackTrace"
};
var exitFailCause = /* @__PURE__ */ makeExit({
  op: "Failure",
  prop: "cause",
  [evaluate](fiber2) {
    let cause = this[args];
    let annotated = false;
    if (fiber2.cache.stackFrame) {
      cause = causeAnnotate(cause, {
        mapUnsafe: /* @__PURE__ */ new Map([[StackTraceKey.key, fiber2.cache.stackFrame]])
      });
      annotated = true;
    }
    let cont = fiber2.getCont(contE);
    const interruptedCause = fiber2._interruptedCause;
    if (interruptedCause && fiber2.interruptible) {
      let skippedHandler = false;
      while (cont && fiber2.interruptible) {
        skippedHandler ||= identifier in cont;
        cont = fiber2.getCont(contE);
      }
      if (skippedHandler) {
        cause = causeFromReasons(cause.reasons.filter((reason) => reason._tag !== "Fail"));
      }
      cause = causeAddInterrupts(cause, interruptedCause);
      annotated = true;
    }
    return cont ? cont[contE](cause, fiber2, annotated ? void 0 : this) : fiber2.yieldWith(annotated ? exitFailCause(cause) : this);
  }
});
var exitFail = (e) => exitFailCause(causeFail(e));
var exitDie = (defect) => exitFailCause(causeDie(defect));
var withFiber = /* @__PURE__ */ makePrimitive({
  op: "WithFiber",
  [evaluate](fiber2) {
    return this[args](fiber2);
  }
});
var withFiberSucceed = /* @__PURE__ */ makePrimitive({
  op: "WithFiberSucceed",
  [evaluate](fiber2) {
    const value = this[args](fiber2);
    const cont = fiber2.getCont(contA);
    return cont ? cont[contA](value, fiber2) : fiber2.yieldWith(exitSucceed(value));
  }
});
var YieldableError = /* @__PURE__ */ (function() {
  class YieldableError2 extends globalThis.Error {
  }
  const proto = /* @__PURE__ */ makePrimitiveProto({
    op: "YieldableError",
    [evaluate]() {
      return exitFail(this);
    }
  });
  delete proto.toString;
  Object.assign(YieldableError2.prototype, proto);
  return YieldableError2;
})();
var Error2 = /* @__PURE__ */ (function() {
  const plainArgsSymbol = /* @__PURE__ */ Symbol.for("effect/Data/Error/plainArgs");
  return class Base extends YieldableError {
    constructor(args2) {
      super(args2?.message, args2?.cause ? {
        cause: args2.cause
      } : void 0);
      if (args2) {
        assignProperties(this, args2);
        Object.defineProperty(this, plainArgsSymbol, {
          value: args2,
          enumerable: false
        });
      }
    }
    toJSON() {
      return {
        ...this[plainArgsSymbol],
        ...this
      };
    }
  };
})();
var TaggedError = (tag) => {
  class Base extends Error2 {
    _tag = tag;
  }
  ;
  Base.prototype.name = tag;
  return Base;
};
var NoSuchElementErrorTypeId = "~effect/Cause/NoSuchElementError";
var NoSuchElementError = class extends (/* @__PURE__ */ TaggedError("NoSuchElementError")) {
  [NoSuchElementErrorTypeId] = NoSuchElementErrorTypeId;
  constructor(message) {
    super({
      message
    });
  }
};
var DoneTypeId = "~effect/Cause/Done";
var isDone = (u) => hasProperty(u, DoneTypeId);
var DoneVoid = {
  [DoneTypeId]: DoneTypeId,
  _tag: "Done",
  value: void 0
};

// node_modules/effect/dist/Effectable.js
var Prototype = (options) => makePrimitiveProto({
  op: options.label,
  [evaluate]: options.evaluate
});

// node_modules/effect/dist/internal/result.js
var TypeId = "~effect/Result";
var CommonProto = {
  [TypeId]: {
    /* v8 ignore next 2 */
    _A: (_) => _,
    _E: (_) => _
  },
  ...PipeInspectableProto,
  [Symbol.iterator]() {
    return new SingleShotGen(this);
  }
};
var SuccessProto = /* @__PURE__ */ Object.assign(/* @__PURE__ */ Object.create(CommonProto), {
  _tag: "Success",
  _op: "Success",
  [symbol2](that) {
    return isResult(that) && isSuccess(that) && equals(this.success, that.success);
  },
  [symbol]() {
    return combine(hash(this._tag))(hash(this.success));
  },
  toString() {
    return `success(${format(this.success)})`;
  },
  toJSON() {
    return {
      _id: "Result",
      _tag: this._tag,
      value: toJson(this.success)
    };
  }
});
var FailureProto = /* @__PURE__ */ Object.assign(/* @__PURE__ */ Object.create(CommonProto), {
  _tag: "Failure",
  _op: "Failure",
  [symbol2](that) {
    return isResult(that) && isFailure(that) && equals(this.failure, that.failure);
  },
  [symbol]() {
    return combine(hash(this._tag))(hash(this.failure));
  },
  toString() {
    return `failure(${format(this.failure)})`;
  },
  toJSON() {
    return {
      _id: "Result",
      _tag: this._tag,
      failure: toJson(this.failure)
    };
  }
});
var isResult = (input) => hasProperty(input, TypeId);
var isFailure = (result2) => result2._tag === "Failure";
var isSuccess = (result2) => result2._tag === "Success";
var FailureImpl = function(failure) {
  this.failure = failure;
};
FailureImpl.prototype = FailureProto;
var fail = (failure) => new FailureImpl(failure);
var SuccessImpl = function(success) {
  this.success = success;
};
SuccessImpl.prototype = SuccessProto;
var succeed = (success) => new SuccessImpl(success);

// node_modules/effect/dist/Context.js
var ServiceTypeId = "~effect/Context/Service";
var Service = function() {
  function KeyClass() {
  }
  const self = KeyClass;
  Object.setPrototypeOf(self, ServiceProto);
  const init = (key, options) => {
    self.key = key;
    if (options?.defaultValue) {
      self[ReferenceTypeId] = ReferenceTypeId;
      self.defaultValue = options.defaultValue;
    }
    if (options?.make) {
      ;
      self.make = options.make;
    }
    if (options?.fiberCached) {
      cacheKeys.add(key);
    }
    return self;
  };
  return arguments.length > 0 ? init(arguments[0], arguments[1]) : init;
};
var ServiceProto = {
  [ServiceTypeId]: ServiceTypeId,
  .../* @__PURE__ */ Prototype({
    label: "Service",
    evaluate(fiber2) {
      return exitSucceed(get(fiber2.context, this));
    }
  }),
  toJSON() {
    return {
      _id: "Service",
      key: this.key
    };
  },
  of(self) {
    return self;
  },
  context(self) {
    return make(this, self);
  },
  use(f) {
    return withFiber((fiber2) => f(get(fiber2.context, this)));
  },
  useSync(f) {
    return withFiber((fiber2) => exitSucceed(f(get(fiber2.context, this))));
  }
};
var cacheKeys = /* @__PURE__ */ new Set();
var ReferenceTypeId = "~effect/Context/Reference";
var TypeId2 = "~effect/Context";
var FlattenAfterBaseHits = 8;
var makeImpl = (cacheRoot, base, overlay, depth, maxDepth) => {
  const self = Object.create(Proto);
  self.cacheRoot = cacheRoot ?? self;
  self.base = base;
  self.overlay = overlay;
  self.depth = depth;
  self._flat = void 0;
  self.baseHits = 0;
  self.maxDepth = maxDepth;
  return self;
};
var applyOverlays = (map3, overlay) => {
  if (!overlay) return;
  applyOverlays(map3, overlay.parent);
  map3.set(overlay.key, overlay.value);
};
var flatten = (self) => {
  if (self._flat) return self._flat;
  if (!self.overlay) return self._flat = self.base;
  const map3 = new Map(self.base);
  applyOverlays(map3, self.overlay);
  return self._flat = map3;
};
var notFound = /* @__PURE__ */ Symbol();
var lookup = (self, key) => {
  const impl = self;
  for (let overlay = impl.overlay; overlay; overlay = overlay.parent) {
    if (overlay.key === key) return overlay.value;
  }
  const value = impl.base.get(key);
  if (value === void 0 && !impl.base.has(key)) return notFound;
  if (impl.overlay && ++impl.baseHits >= impl.base.size && impl.baseHits >= FlattenAfterBaseHits) {
    impl.base = flatten(impl);
    impl.overlay = void 0;
    impl.depth = 0;
  }
  return value;
};
var makeUnsafe = (mapUnsafe, options) => {
  const maxDepth = options?.maxDepth;
  return makeImpl(void 0, mapUnsafe, void 0, 0, Number.isInteger(maxDepth) && maxDepth >= 0 ? maxDepth : 8);
};
var Proto = {
  get mapUnsafe() {
    return flatten(this);
  },
  ...PipeInspectableProto,
  [TypeId2]: {
    _Services: (_) => _
  },
  toJSON() {
    return {
      _id: "Context",
      services: Array.from(this.mapUnsafe).map(([key, value]) => ({
        key,
        value
      }))
    };
  },
  [symbol2](that) {
    if (!isContext(that)) return false;
    const self = this.mapUnsafe;
    const other = that.mapUnsafe;
    if (self.size !== other.size) return false;
    for (const [key, value] of self) {
      if (!other.has(key) || !equals(value, other.get(key))) return false;
    }
    return true;
  },
  [symbol]() {
    return number(this.mapUnsafe.size);
  }
};
var hasSameCache = (self, that) => self.cacheRoot === that.cacheRoot;
var isContext = (u) => hasProperty(u, TypeId2);
var isReference = (u) => !!u[ReferenceTypeId];
var empty = () => emptyContext2;
var emptyContext2 = /* @__PURE__ */ makeUnsafe(/* @__PURE__ */ new Map());
var make = (key, service2) => makeUnsafe(/* @__PURE__ */ new Map([[key.key, service2]]));
var add = /* @__PURE__ */ dual(3, (self, key, service2) => addUnsafe(self, key.key, service2));
var addUnsafe = (self, key, service2) => {
  const impl = self;
  const cacheRoot = cacheKeys.has(key) ? void 0 : impl.cacheRoot;
  if (impl.depth >= impl.maxDepth) {
    const map3 = new Map(impl._flat ?? impl.base);
    if (!impl._flat) applyOverlays(map3, impl.overlay);
    map3.set(key, service2);
    return makeImpl(cacheRoot, map3, void 0, 0, impl.maxDepth);
  }
  return makeImpl(cacheRoot, impl.base, {
    key,
    value: service2,
    parent: impl.overlay
  }, impl.depth + 1, impl.maxDepth);
};
var getOrUndefinedUnsafe = (self, key) => {
  const value = lookup(self, key);
  return value === notFound ? void 0 : value;
};
var getUnsafe = /* @__PURE__ */ dual(2, (self, service2) => {
  const value = lookup(self, service2.key);
  if (value === notFound) {
    if (isReference(service2)) return getDefaultValue(service2);
    throw serviceNotFoundError(service2);
  }
  return value;
});
var get = getUnsafe;
var defaultValueCacheKey = "~effect/Context/defaultValue";
var getDefaultValue = (ref) => {
  if (defaultValueCacheKey in ref) {
    return ref[defaultValueCacheKey];
  }
  return ref[defaultValueCacheKey] = ref.defaultValue();
};
var serviceNotFoundError = (service2) => {
  const error = new Error(`Service not found${service2.key ? `: ${String(service2.key)}` : ""}`);
  if (error.stack) {
    const lines = error.stack.split("\n");
    lines.splice(1, 3);
    error.stack = lines.join("\n");
  }
  return error;
};
var Reference = Service;

// node_modules/effect/dist/Result.js
var succeed2 = succeed;
var fail2 = fail;
var isFailure2 = isFailure;

// node_modules/effect/dist/Scheduler.js
var Scheduler = /* @__PURE__ */ Reference("effect/Scheduler", {
  fiberCached: true,
  defaultValue: () => new MixedScheduler()
});
var setMicrotask = (f) => {
  let cancelled = false;
  Promise.resolve().then(() => {
    if (!cancelled) f();
  });
  return () => {
    cancelled = true;
  };
};
var setTimer = "setImmediate" in globalThis ? (f) => {
  const timer = globalThis.setImmediate(f);
  return () => globalThis.clearImmediate(timer);
} : (f) => {
  const timer = setTimeout(f, 0);
  return () => clearTimeout(timer);
};
var setImmediate = (f) => {
  try {
    return setTimer(f);
  } catch {
    return setMicrotask(f);
  }
};
var PriorityBuckets = class {
  buckets = [];
  scheduleTask(task, priority) {
    const buckets = this.buckets;
    const len = buckets.length;
    let bucket;
    let index = 0;
    for (; index < len; index++) {
      if (buckets[index][0] > priority) break;
      bucket = buckets[index];
    }
    if (bucket && bucket[0] === priority) {
      bucket[1].push(task);
    } else if (index === len) {
      buckets.push([priority, [task]]);
    } else {
      buckets.splice(index, 0, [priority, [task]]);
    }
  }
  drain() {
    const buckets = this.buckets;
    this.buckets = [];
    return buckets;
  }
};
var MixedScheduler = class {
  executionMode;
  setImmediate;
  constructor(executionMode = "async", setImmediateFn) {
    this.executionMode = executionMode;
    this.setImmediate = setImmediateFn ?? (executionMode === "sync" ? setMicrotask : setImmediate);
  }
  /**
   * Returns whether the fiber has reached its operation budget and should yield.
   *
   * **When to use**
   *
   * Use to decide whether a fiber should yield after consuming its current
   * operation budget.
   *
   * @since 2.0.0
   */
  shouldYield(fiber2) {
    return fiber2.currentOpCount >= fiber2.cache.maxOpsBeforeYield;
  }
  /**
   * Creates a dispatcher that schedules work through this scheduler.
   *
   * **When to use**
   *
   * Use when you need a standalone dispatcher from a scheduler instance, for
   * example in tests that enqueue tasks and then flush them deterministically.
   *
   * @since 4.0.0
   */
  makeDispatcher() {
    return new MixedSchedulerDispatcher(this.setImmediate);
  }
};
var MixedSchedulerDispatcher = class {
  tasks = /* @__PURE__ */ new PriorityBuckets();
  running = void 0;
  setImmediate;
  constructor(setImmediateFn = setImmediate) {
    this.setImmediate = setImmediateFn;
  }
  /**
   * @since 2.0.0
   */
  scheduleTask(task, priority) {
    this.tasks.scheduleTask(task, priority);
    if (this.running === void 0) {
      this.running = this.setImmediate(this.afterScheduled);
    }
  }
  /**
   * @since 2.0.0
   */
  afterScheduled = () => {
    this.running = void 0;
    this.runTasks();
  };
  /**
   * @since 2.0.0
   */
  runTasks() {
    const buckets = this.tasks.drain();
    for (let i = 0; i < buckets.length; i++) {
      const toRun = buckets[i][1];
      for (let j = 0; j < toRun.length; j++) {
        toRun[j]();
      }
    }
  }
  /**
   * @since 2.0.0
   */
  flush() {
    while (this.tasks.buckets.length > 0) {
      if (this.running !== void 0) {
        this.running();
        this.running = void 0;
      }
      this.runTasks();
    }
  }
};
var MaxOpsBeforeYield = /* @__PURE__ */ Reference("effect/Scheduler/MaxOpsBeforeYield", {
  fiberCached: true,
  defaultValue: () => 2048
});
var PreventSchedulerYield = /* @__PURE__ */ Reference("effect/Scheduler/PreventSchedulerYield", {
  fiberCached: true,
  defaultValue: () => false
});

// node_modules/effect/dist/Tracer.js
var ParentSpanKey = "effect/Tracer/ParentSpan";
var TracerKey = "effect/Tracer";

// node_modules/effect/dist/internal/metric.js
var FiberRuntimeMetricsKey = "effect/Metric/FiberRuntimeMetrics";

// node_modules/effect/dist/internal/references.js
var CurrentStackFrame = /* @__PURE__ */ Reference("effect/References/CurrentStackFrame", {
  fiberCached: true,
  defaultValue: constUndefined
});
var TracerEnabled = /* @__PURE__ */ Reference("effect/References/TracerEnabled", {
  fiberCached: true,
  defaultValue: constTrue
});
var CurrentLogLevel = /* @__PURE__ */ Reference("effect/References/CurrentLogLevel", {
  fiberCached: true,
  defaultValue: () => "Info"
});
var MinimumLogLevel = /* @__PURE__ */ Reference("effect/References/MinimumLogLevel", {
  fiberCached: true,
  defaultValue: () => "Info"
});

// node_modules/effect/dist/internal/effect.js
var Interrupt = class extends ReasonBase {
  constructor(fiberId2, annotations = constEmptyAnnotations) {
    super("Interrupt", annotations, "Interrupted");
    this.fiberId = fiberId2;
  }
  toString() {
    return `Interrupt(${this.fiberId})`;
  }
  toJSON() {
    return {
      _tag: "Interrupt",
      fiberId: this.fiberId
    };
  }
  [symbol2](that) {
    return isInterruptReason(that) && this.fiberId === that.fiberId && this.annotations === that.annotations;
  }
  [symbol]() {
    return string(`${this._tag}:${this.fiberId}`);
  }
};
var causeInterrupt = (fiberId2) => new CauseImpl([new Interrupt(fiberId2)]);
var hasFails = (self) => self.reasons.some(isFailReason);
var findError = (self) => {
  for (let i = 0; i < self.reasons.length; i++) {
    const reason = self.reasons[i];
    if (reason._tag === "Fail") {
      return succeed2(reason.error);
    }
  }
  return fail2(self);
};
var hasDies = (self) => self.reasons.some(isDieReason);
var causeElectDefects = (self) => hasDies(self) && hasFails(self) ? causeFromReasons(self.reasons.map((reason) => reason._tag === "Fail" && !isDone(reason.error) ? new Die(reason.error, reason.annotations) : reason)) : self;
var findRecoverableError = (self) => hasDies(self) ? fail2(causeElectDefects(self)) : findError(self);
var hasInterrupts = (self) => self.reasons.some(isInterruptReason);
var causeSquash = (self) => {
  let die2;
  for (const reason of self.reasons) {
    if (reason._tag === "Fail") return reason.error;
    if (reason._tag === "Die") die2 ??= reason;
  }
  if (die2 !== void 0) return die2.defect;
  if (self.reasons.length > 0) return new globalThis.Error("All fibers interrupted without error");
  return new globalThis.Error("Empty cause");
};
var FiberTypeId = "~effect/Fiber";
var fiberVariance = {
  _A: identity,
  _E: identity
};
var fiberIdStore = {
  id: 0
};
var AsyncResource = /* @__PURE__ */ (() => {
  try {
    return globalThis.process?.getBuiltinModule?.("node:async_hooks")?.AsyncResource;
  } catch {
    return void 0;
  }
})();
var captureAsyncContext = () => AsyncResource === void 0 ? void 0 : new AsyncResource("effect/Fiber");
var FiberImpl = class {
  constructor(context2, interruptible2 = true) {
    this.setContext(context2);
    this.id = ++fiberIdStore.id;
    this.currentOpCount = 0;
    this.interruptible = interruptible2;
    this._stack = [];
    this._observers = void 0;
    this._exit = void 0;
    this._children = void 0;
    this._interruptedCause = void 0;
    this._yielded = void 0;
    this._running = false;
    this._deferredInterrupt = false;
    this._parent = void 0;
    this._asyncContext = void 0;
    this.cache.runtimeMetrics?.recordFiberStart(this.context);
  }
  get [FiberTypeId]() {
    return fiberVariance;
  }
  get currentDispatcher() {
    return this._dispatcher ??= this.cache.scheduler.makeDispatcher();
  }
  getRef(ref) {
    return get(this.context, ref);
  }
  addObserver(cb) {
    if (this._exit) {
      cb(this._exit);
      return constVoid;
    }
    if (this._observers === void 0) {
      this._observers = [cb];
    } else {
      this._observers.push(cb);
    }
    return () => this.removeObserver(cb);
  }
  removeObserver(cb) {
    if (this._exit || this._observers === void 0) return;
    const index = this._observers.indexOf(cb);
    if (index >= 0) {
      this._observers.splice(index, 1);
    }
  }
  interruptUnsafe(fiberId2, annotations) {
    if (this._exit) {
      return;
    }
    let cause = causeInterrupt(fiberId2);
    if (this.cache.stackFrame) {
      cause = causeAnnotate(cause, make(StackTraceKey, this.cache.stackFrame));
    }
    if (annotations) {
      cause = causeAnnotate(cause, annotations);
    }
    this._interruptedCause = this._interruptedCause ? causeAddInterrupts(this._interruptedCause, cause) : cause;
    if (this.interruptible) {
      if (this._running) {
        this._deferredInterrupt = true;
      } else {
        this.evaluate(failCause(this._interruptedCause));
      }
    }
  }
  pollUnsafe() {
    return this._exit;
  }
  evaluate(effect) {
    if (this._exit) {
      return;
    } else if (this._asyncContext !== void 0) {
      const asyncContext = this._asyncContext;
      this._asyncContext = void 0;
      try {
        return asyncContext.runInAsyncScope(this.evaluate, this, effect);
      } finally {
        asyncContext.emitDestroy();
      }
    } else if (this._yielded !== void 0) {
      const yielded = this._yielded;
      this._yielded = void 0;
      yielded();
    }
    const exit2 = this.runLoop(effect);
    if (exit2 === Yield) {
      this._asyncContext = captureAsyncContext();
      return;
    }
    const interruptChildren = fiberMiddleware.interruptChildren && fiberMiddleware.interruptChildren(this);
    if (interruptChildren !== void 0) {
      return this.evaluate(flatMap(interruptChildren, () => exit2));
    }
    this._exit = exit2;
    this.cache.runtimeMetrics?.recordFiberEnd(this.context, this._exit);
    if (this._parent) {
      this._parent._children?.delete(this);
      this._parent = void 0;
    }
    if (this._observers !== void 0) {
      const observers = this._observers;
      this._observers = void 0;
      for (let i = 0; i < observers.length; i++) {
        observers[i](exit2);
      }
    }
    this._stack.length = 0;
    this._children = void 0;
    this.context = empty();
    const cache = this.cache;
    if (cache.span !== void 0 || cache.stackFrame !== void 0) {
      this.cache = {
        ...cache,
        span: void 0,
        stackFrame: void 0
      };
    }
  }
  runLoop(effect) {
    const prevFiber = globalThis[currentFiberTypeId];
    globalThis[currentFiberTypeId] = this;
    const prevRunning = this._running;
    this._running = true;
    let yielding = false;
    let current = effect;
    this.currentOpCount = 0;
    try {
      while (true) {
        try {
          if (this._deferredInterrupt) {
            this._deferredInterrupt = false;
            current = failCause(this._interruptedCause);
          }
          this.currentOpCount++;
          const cache = this.cache;
          if (!yielding && !cache.preventYield && cache.scheduler.shouldYield(this)) {
            yielding = true;
            const prev = current;
            current = flatMap(yieldNow, () => prev);
          }
          current = cache.tracerContext ? cache.tracerContext(current, this) : current[evaluate](this);
          if (current === Yield) {
            const yielded = this._yielded;
            if (ExitTypeId in yielded) {
              this._deferredInterrupt = false;
              this._yielded = void 0;
              return yielded;
            } else if (this._deferredInterrupt) {
              this._yielded = void 0;
              yielded();
              continue;
            }
            return Yield;
          }
        } catch (error) {
          if (!hasProperty(current, evaluate)) {
            return exitDie(`Fiber.runLoop: Not a valid effect: ${String(current)}`);
          }
          current = exitDie(error);
        }
      }
    } finally {
      this._running = prevRunning;
      globalThis[currentFiberTypeId] = prevFiber;
    }
  }
  getCont(symbol3) {
    if (this._deferredInterrupt) {
      this._deferredInterrupt = false;
      return deferredInterruptCont;
    }
    while (true) {
      const op = this._stack.pop();
      if (!op) return void 0;
      const all2 = op[contAll];
      if (all2 !== void 0) {
        const cont = all2.call(op, this);
        if (cont) {
          ;
          cont[symbol3] = cont;
          return cont;
        }
      }
      if (op[symbol3]) return op;
    }
  }
  // Passes a success value straight to the next continuation instead of
  // returning an Exit for the run loop to unwrap. Each call counts as an
  // operation, and every `maxInlineSteps`th call returns an Exit instead, so
  // continuations calling continuations never nest deeper than that.
  succeedWith(value) {
    if ((++this.currentOpCount & maxInlineSteps - 1) === 0) {
      return exitSucceed(value);
    }
    const cont = this.getCont(contA);
    return cont ? cont[contA](value, this) : this.yieldWith(exitSucceed(value));
  }
  yieldWith(value) {
    this._yielded = value;
    return Yield;
  }
  children() {
    return this._children ??= /* @__PURE__ */ new Set();
  }
  pipe() {
    return pipeArguments(this, arguments);
  }
  setContext(context2) {
    const previous = this.context;
    this.context = context2;
    if (previous !== void 0 && hasSameCache(previous, context2)) return;
    const root = context2.cacheRoot;
    const cache = root._fiberCache ??= makeFiberContextCache(context2);
    if (this.cache?.scheduler !== cache.scheduler) {
      this._dispatcher = void 0;
    }
    this.cache = cache;
  }
  get currentSpanLocal() {
    const span = this.cache.span;
    return span?._tag === "Span" ? span : void 0;
  }
};
var makeFiberContextCache = (context2) => {
  const currentTracer = getOrUndefinedUnsafe(context2, TracerKey);
  return {
    scheduler: get(context2, Scheduler),
    tracer: currentTracer,
    tracerContext: currentTracer ? currentTracer["context"] : void 0,
    tracerEnabled: get(context2, TracerEnabled),
    span: getOrUndefinedUnsafe(context2, ParentSpanKey),
    logLevel: get(context2, CurrentLogLevel),
    minimumLogLevel: get(context2, MinimumLogLevel),
    stackFrame: get(context2, CurrentStackFrame),
    runtimeMetrics: getOrUndefinedUnsafe(context2, FiberRuntimeMetricsKey),
    maxOpsBeforeYield: get(context2, MaxOpsBeforeYield),
    preventYield: get(context2, PreventSchedulerYield)
  };
};
var deferredInterruptCont = {
  [contA](_value, fiber2) {
    return failCause(fiber2._interruptedCause);
  },
  [contE](_cause, fiber2) {
    return failCause(fiber2._interruptedCause);
  }
};
var maxInlineSteps = 32;
var fiberMiddleware = {
  interruptChildren: void 0
};
var succeed3 = exitSucceed;
var failCause = exitFailCause;
var fail3 = exitFail;
var sync = /* @__PURE__ */ makePrimitive({
  op: "Sync",
  [evaluate](fiber2) {
    const thunk = this[args];
    const value = thunk();
    const cont = fiber2.getCont(contA);
    return cont ? cont[contA](value, fiber2) : fiber2.yieldWith(exitSucceed(value));
  }
});
var suspend = /* @__PURE__ */ makePrimitive({
  op: "Suspend",
  [evaluate](_fiber) {
    const thunk = this[args];
    return thunk();
  }
});
var yieldNowWith = /* @__PURE__ */ makePrimitive({
  op: "Yield",
  [evaluate](fiber2) {
    let resumed = false;
    fiber2.currentDispatcher.scheduleTask(() => {
      if (resumed) return;
      fiber2.evaluate(exitVoid);
    }, this[args] ?? 0);
    return fiber2.yieldWith(() => {
      resumed = true;
    });
  }
});
var yieldNow = /* @__PURE__ */ yieldNowWith(0);
var die = (defect) => exitDie(defect);
var tryPromise = (options) => {
  const f = typeof options === "function" ? options : options.try;
  const catcher = typeof options === "function" ? (cause) => new UnknownError(cause, "An error occurred in Effect.tryPromise") : options.catch;
  return callbackOptions(function(resume, signal) {
    const failWithCatch = (cause) => suspend(() => {
      try {
        return fail3(internalCall(() => catcher(cause)));
      } catch (err) {
        return die(err);
      }
    });
    try {
      f(signal).then((a) => resume(succeed3(a)), (e) => resume(failWithCatch(e)));
    } catch (err) {
      resume(failWithCatch(err));
    }
  }, f.length !== 0);
};
var callbackOptions = /* @__PURE__ */ (function() {
  const Proto2 = /* @__PURE__ */ makePrimitiveProto({
    op: "Async",
    [evaluate](fiber2) {
      let resumed = false;
      let yielded = false;
      const controller = this.withSignal ? new AbortController() : void 0;
      const onCancel = this.register.call(fiber2.cache.scheduler, (effect) => {
        if (resumed) return;
        resumed = true;
        if (yielded) {
          fiber2.evaluate(effect);
        } else {
          yielded = effect;
        }
      }, controller?.signal);
      if (yielded !== false) return yielded;
      yielded = true;
      fiber2.yieldWith(() => {
        resumed = true;
      });
      if (controller === void 0 && onCancel === void 0) {
        return Yield;
      }
      fiber2._stack.push(asyncFinalizer(() => {
        resumed = true;
        controller?.abort();
        return onCancel ?? exitVoid;
      }));
      return Yield;
    }
  });
  const AsyncImpl = function(register, withSignal) {
    this.register = register;
    this.withSignal = withSignal;
  };
  AsyncImpl.prototype = Proto2;
  return function(register, withSignal) {
    return new AsyncImpl(register, withSignal);
  };
})();
var asyncFinalizer = /* @__PURE__ */ makePrimitive({
  op: "AsyncFinalizer",
  [contAll](fiber2) {
    if (fiber2.interruptible) {
      fiber2.interruptible = false;
      fiber2._stack.push(setInterruptibleTrue);
    }
  },
  [contE](cause, _fiber) {
    return hasInterrupts(cause) ? flatMap(combineFinalizerCause(exitFailCause(cause), this[args]()), () => failCause(cause)) : failCause(cause);
  }
});
var evaluateCont = function(fiber2) {
  fiber2._stack.push(this);
  return this[args];
};
var OnSuccessProto = /* @__PURE__ */ makePrimitiveProto({
  op: "OnSuccess",
  [evaluate]: evaluateCont
});
var ContImpl = function(self, cont, payload) {
  this[args] = self;
  this[contA] = cont;
  this.payload = payload;
};
ContImpl.prototype = OnSuccessProto;
var continuationMarksStack = /* @__PURE__ */ (() => {
  const limit = /* @__PURE__ */ getStackTraceLimit();
  if (limit === 0) return false;
  const marker = "~effect/Effect/stackProbe";
  const probe = {
    [marker]: function stackProbe() {
      return new Error();
    }
  };
  setStackTraceLimit(1);
  const error = /* @__PURE__ */ probe[marker]();
  setStackTraceLimit(limit);
  return error.stack?.includes("[as " + marker + "]") === true;
})();
var mapCont = function(value, fiber2) {
  const f = this.payload;
  return fiber2.succeedWith(continuationMarksStack ? f(value) : internalCall(() => f(value)));
};
var andThenCont = function(value) {
  const f = this.payload;
  return f(value);
};
var flatMap = /* @__PURE__ */ dual(2, (self, f) => new ContImpl(self, andThenCont, f));
var map = /* @__PURE__ */ dual(2, (self, f) => new ContImpl(self, mapCont, f));
var exitIsSuccess = (self) => self._tag === "Success";
var exitVoid = /* @__PURE__ */ exitSucceed(void 0);
var catchCause = /* @__PURE__ */ dual(2, (self, f) => new OnFailureImpl(self, f.length !== 1 ? (cause) => f(cause) : f));
var OnFailureProto = /* @__PURE__ */ makePrimitiveProto({
  op: "OnFailure",
  [evaluate]: evaluateCont
});
var OnFailureImpl = function(self, f) {
  this[args] = self;
  this[contE] = f;
};
OnFailureImpl.prototype = OnFailureProto;
var catchCauseFilter = /* @__PURE__ */ dual(3, (self, filter2, f) => catchCause(self, (cause) => {
  const eb = filter2(cause);
  return isFailure2(eb) ? failCause(eb.failure) : f(eb.success, cause);
}));
var catch_ = /* @__PURE__ */ dual(2, (self, f) => catchCauseFilter(self, findRecoverableError, (e) => f(e)));
var OnSuccessAndFailureProto = /* @__PURE__ */ makePrimitiveProto({
  op: "OnSuccessAndFailure",
  [evaluate]: evaluateCont
});
var OnSuccessAndFailureImpl = function(self, onSuccess, onFailure) {
  this[args] = self;
  this[contA] = onSuccess;
  this[contE] = onFailure;
};
OnSuccessAndFailureImpl.prototype = OnSuccessAndFailureProto;
var exitPrimitive = /* @__PURE__ */ makePrimitive({
  op: "Exit",
  [evaluate](fiber2) {
    fiber2._stack.push(this);
    return this[args];
  },
  [contA](value, fiber2, exit2) {
    return fiber2.succeedWith(exit2 ?? exitSucceed(value));
  },
  [contE](cause, fiber2, exit2) {
    return fiber2.succeedWith(exit2 ?? exitFailCause(cause));
  }
});
var combineFinalizerCause = (exit_, finalizer) => exitIsSuccess(exit_) ? finalizer : catchCause(finalizer, (cause) => failCause(causeElectDefects(causeCombine(exit_.cause, cause))));
var setInterruptible = /* @__PURE__ */ makePrimitive({
  op: "SetInterruptible",
  [contAll](fiber2) {
    fiber2.interruptible = this[args];
    if (fiber2._interruptedCause && fiber2.interruptible) {
      return () => failCause(fiber2._interruptedCause);
    }
  }
});
var setInterruptibleTrue = /* @__PURE__ */ setInterruptible(true);
var whileLoop = /* @__PURE__ */ makePrimitive({
  op: "While",
  [contA](value, fiber2) {
    this[args].step(value);
    if (this[args].while()) {
      fiber2._stack.push(this);
      return this[args].body();
    }
    return exitVoid;
  },
  [evaluate](fiber2) {
    if (this[args].while()) {
      fiber2._stack.push(this);
      return this[args].body();
    }
    return exitVoid;
  }
});
var runForkWith = (context2) => (effect, options) => {
  const fiber2 = new FiberImpl(options?.scheduler ? add(context2, Scheduler, options.scheduler) : context2, options?.uninterruptible !== true);
  fiber2.evaluate(effect);
  if (fiber2._exit) return fiber2;
  if (options?.signal) {
    if (options.signal.aborted) {
      fiber2.interruptUnsafe();
    } else {
      const abort = () => fiber2.interruptUnsafe();
      options.signal.addEventListener("abort", abort, {
        once: true
      });
      fiber2.addObserver(() => options.signal.removeEventListener("abort", abort));
    }
  }
  if (options?.onFiberStart) {
    options.onFiberStart(fiber2);
  }
  return fiber2;
};
var runPromiseExitWith = (context2) => {
  const runFork2 = runForkWith(context2);
  return (effect, options) => {
    const fiber2 = runFork2(effect, options);
    return new Promise((resolve) => {
      fiber2.addObserver((exit2) => resolve(exit2));
    });
  };
};
var runPromiseWith = (context2) => {
  const runPromiseExit2 = runPromiseExitWith(context2);
  return (effect, options) => runPromiseExit2(effect, options).then((exit2) => {
    if (exit2._tag === "Failure") {
      throw causeSquash(exit2.cause);
    }
    return exit2.value;
  });
};
var runPromise = /* @__PURE__ */ runPromiseWith(/* @__PURE__ */ empty());
var MAX_TIMER_MILLIS = 2 ** 31 - 1;
var TimeoutErrorTypeId = "~effect/Cause/TimeoutError";
var TimeoutError = class extends (/* @__PURE__ */ TaggedError("TimeoutError")) {
  [TimeoutErrorTypeId] = TimeoutErrorTypeId;
  constructor(message) {
    super({
      message
    });
  }
};
var IllegalArgumentErrorTypeId = "~effect/Cause/IllegalArgumentError";
var IllegalArgumentError = class extends (/* @__PURE__ */ TaggedError("IllegalArgumentError")) {
  [IllegalArgumentErrorTypeId] = IllegalArgumentErrorTypeId;
  constructor(message) {
    super({
      message
    });
  }
};
var ExceededCapacityErrorTypeId = "~effect/Cause/ExceededCapacityError";
var ExceededCapacityError = class extends (/* @__PURE__ */ TaggedError("ExceededCapacityError")) {
  [ExceededCapacityErrorTypeId] = ExceededCapacityErrorTypeId;
  constructor(message) {
    super({
      message
    });
  }
};
var AsyncFiberErrorTypeId = "~effect/Cause/AsyncFiberError";
var AsyncFiberError = class extends (/* @__PURE__ */ TaggedError("AsyncFiberError")) {
  [AsyncFiberErrorTypeId] = AsyncFiberErrorTypeId;
  constructor(fiber2) {
    super({
      message: "An asynchronous Effect was executed with Effect.runSync",
      fiber: fiber2
    });
  }
};
var UnknownErrorTypeId = "~effect/Cause/UnknownError";
var UnknownError = class extends (/* @__PURE__ */ TaggedError("UnknownError")) {
  [UnknownErrorTypeId] = UnknownErrorTypeId;
  constructor(cause, message) {
    super({
      message,
      cause
    });
  }
};
var LoggerTypeId = "~effect/Logger";
var LoggerProto = {
  [LoggerTypeId]: {
    _Message: identity,
    _Output: identity
  },
  pipe() {
    return pipeArguments(this, arguments);
  }
};
var colors = {
  bold: "1",
  red: "31",
  green: "32",
  yellow: "33",
  blue: "34",
  cyan: "36",
  white: "37",
  gray: "90",
  black: "30",
  bgBrightRed: "101"
};
var logLevelColors = {
  None: [],
  All: [],
  Trace: [colors.gray],
  Debug: [colors.blue],
  Info: [colors.green],
  Warn: [colors.yellow],
  Error: [colors.red],
  Fatal: [colors.bgBrightRed, colors.black]
};

// node_modules/effect/dist/Effect.js
var tryPromise2 = tryPromise;
var succeed4 = succeed3;
var sync2 = sync;
var map2 = map;
var catch_2 = catch_;
var runPromise2 = runPromise;

// src/plugin.mjs
var hash2 = (value) => typeof value === "string" && /^(?:[0-9a-f]{40}|[0-9a-f]{64})$/.test(value);
var integer = (value, max) => Number.isSafeInteger(value ?? 0) && (value ?? 0) >= 0 && (value ?? 0) <= max;
var short = (value) => value.slice(0, 10);
var text = (id, value) => ({ id, kind: "text", text: value.slice(0, 8192) });
var action = (id, label, input) => ({ id, label, command: "browse", input });
var actions = (id, values) => ({ id, kind: "actions", actions: values });
var page = (title, blocks) => ({ $t3: "view", view: { title, blocks } });
function contributions(context2) {
  if (!context2.capabilities?.includes("portable-graphs") || !context2.runProcess)
    throw new Error("Requires a prototype host with portable-graphs and supervised-processes.");
  async function git(directory, args2, allowTruncated = false) {
    const result2 = await runPromise2(
      context2.runProcess({
        command: "git",
        args: ["--no-pager", "--literal-pathspecs", "-c", "color.ui=false", ...args2],
        cwd: directory,
        environment: { GIT_OPTIONAL_LOCKS: "0", GIT_TERMINAL_PROMPT: "0" },
        timeoutMs: 1e4
      })
    );
    if (result2.timedOut || result2.code !== 0)
      throw new Error("Git could not read this repository or object (10 second query limit).");
    if (result2.stdoutTruncated && !allowTruncated)
      throw new Error(
        "Git output exceeds the host limit. Narrow the ref or inspect a smaller commit."
      );
    return result2;
  }
  async function browse(input) {
    let directory = input.directory;
    if (input.thread) {
      if (typeof input.thread !== "string" || !context2.threads)
        throw new Error("Thread context unavailable.");
      directory = (await runPromise2(context2.threads.describe(input.thread))).directory;
    }
    if (typeof directory !== "string" || !/^(?:\/|[A-Za-z]:[\\/])/.test(directory) || directory.includes("\0") || directory.length > 4096)
      throw new Error("Enter an absolute directory on the selected environment, or its thread ID.");
    directory = (await git(directory, ["rev-parse", "--show-toplevel"])).stdout.replace(/\n$/, "");
    const common = { directory };
    const back = action("history", "Back to history", common);
    if (input.commit !== void 0) {
      if (!hash2(input.commit)) throw new Error("Invalid commit ID.");
      const commit = input.commit;
      const meta = (await git(directory, ["show", "-s", "--format=%H%x00%P%x00%an%x00%aI%x00%B", commit, "--"])).stdout.split("\0");
      const parents = meta[1].split(" ").filter(Boolean);
      const parent = input.parent ?? parents[0];
      if (parent !== void 0 && (!hash2(parent) || !parents.includes(parent)))
        throw new Error("Select a parent of this commit.");
      const base = { ...common, commit, ...parent ? { parent } : {} };
      const nav = [
        back,
        ...parents.slice(0, 8).map(
          (p, i) => action(`parent-${i}`, `Open parent ${short(p)}`, { ...common, commit: p })
        )
      ];
      const blocks = [
        actions("navigation", nav),
        text(
          "metadata",
          `${commit}
${meta[2]} \xB7 ${meta[3]}
${meta.slice(4).join("\0")}
Parents: ${parents.join(", ") || "(root commit)"}`
        )
      ];
      if (parents.length > 1)
        blocks.push(
          actions(
            "compare",
            parents.slice(0, 20).map(
              (p, i) => action(`compare-${i}`, `Compare parent ${i + 1}: ${short(p)}`, {
                ...base,
                parent: p
              })
            )
          )
        );
      if (input.path !== void 0) {
        if (typeof input.path !== "string" || input.path.includes("\0") || input.path.length > 12e3)
          throw new Error("Invalid file path.");
        const paths = [input.path];
        if (input.oldPath !== void 0) {
          if (typeof input.oldPath !== "string" || input.oldPath.includes("\0") || input.oldPath.length > 12e3)
            throw new Error("Invalid old path.");
          paths.push(input.oldPath);
        }
        const diff = await git(
          directory,
          parent ? [
            "diff",
            "--no-ext-diff",
            "--no-textconv",
            "--find-renames",
            parent,
            commit,
            "--",
            ...paths
          ] : [
            "show",
            "--format=",
            "--no-ext-diff",
            "--no-textconv",
            "--find-renames",
            commit,
            "--",
            ...paths
          ],
          true
        );
        blocks.push(
          actions("files", [action("files", "Back to changed files", base)]),
          text("file", JSON.stringify(input.path)),
          {
            id: "patch",
            kind: "code",
            text: diff.stdout.slice(0, 8e3) || "(No textual patch; the file may be binary or unchanged against this parent.)"
          }
        );
        if (diff.stdoutTruncated || diff.stdout.length > 8e3)
          blocks.push(
            text(
              "truncated",
              "Patch truncated to 8,000 characters. Use local Git for the full patch."
            )
          );
        return page(`Commit ${short(commit)} \xB7 diff`, blocks);
      }
      const raw2 = (await git(
        directory,
        parent ? ["diff", "--name-status", "-z", "--find-renames", parent, commit, "--"] : [
          "diff-tree",
          "--root",
          "--no-commit-id",
          "-r",
          "--name-status",
          "-z",
          "--find-renames",
          commit,
          "--"
        ]
      )).stdout;
      const parts = raw2.split("\0");
      const files = [];
      for (let i = 0; i < parts.length && parts[i]; ) {
        const status = parts[i++];
        const first = parts[i++];
        const renamed = /^[RC]/.test(status);
        const path = renamed ? parts[i++] : first;
        if (path === void 0) throw new Error("Incomplete changed-file output.");
        files.push({ status, path, ...renamed ? { oldPath: first } : {} });
      }
      if (!integer(input.files, 1e4)) throw new Error("Invalid file page.");
      const offset2 = input.files ?? 0;
      blocks.push(
        text(
          "comparison",
          `Compared against ${parent ?? "the empty tree (root commit)"}. ${files.length} changed files. Paths are JSON-quoted to preserve tabs and newlines.`
        ),
        {
          id: "files",
          kind: "table",
          columns: ["Status", "Path"],
          rows: files.slice(offset2, offset2 + 20).map((f, i) => ({
            id: `file-${i}`,
            cells: [
              f.status,
              f.oldPath ? `${JSON.stringify(f.oldPath)} \u2192 ${JSON.stringify(f.path)}` : JSON.stringify(f.path)
            ],
            actions: [action("diff", "Inspect diff", { ...base, ...f })]
          }))
        }
      );
      blocks.push(
        actions("file-pages", [
          ...offset2 > 0 ? [action("previous", "Previous files", { ...base, files: Math.max(0, offset2 - 20) })] : [],
          ...files.length > offset2 + 20 && offset2 < 1e4 ? [action("next", "Next files", { ...base, files: offset2 + 20 })] : []
        ])
      );
      return page(`Commit ${short(commit)}`, blocks);
    }
    if (!integer(input.offset, 1e4)) throw new Error("Invalid history page.");
    const offset = input.offset ?? 0;
    let ref = input.ref;
    if (ref !== void 0 && ref !== "" && !hash2(ref)) {
      if (typeof ref !== "string" || !/^(?:HEAD|refs\/(?:heads|tags|remotes)\/.+)$/.test(ref) || ref.includes("\0") || ref.length > 1024)
        throw new Error(
          "Use HEAD, a full refs/heads, refs/remotes, refs/tags name, or a commit ID."
        );
      ref = (await git(directory, ["rev-parse", "--verify", "--end-of-options", `${ref}^{commit}`])).stdout.trim();
      if (!hash2(ref)) throw new Error("Ref does not resolve to a commit.");
    }
    const scope2 = ref ? [ref] : ["HEAD", "--branches", "--remotes", "--tags"];
    const raw = (await git(directory, [
      "log",
      "--topo-order",
      "--max-count=16",
      `--skip=${offset}`,
      "--format=%H%x00%P%x00%an%x00%aI%x00%s%x00%D%x00",
      ...scope2,
      "--"
    ])).stdout;
    const fields = raw.split("\0");
    const commits = [];
    for (let i = 0; i + 5 < fields.length; i += 6) {
      const sha = fields[i].trim();
      if (!hash2(sha)) throw new Error("Invalid history output.");
      commits.push({
        sha,
        parents: fields[i + 1],
        author: fields[i + 2],
        date: fields[i + 3],
        subject: fields[i + 4],
        refs: fields[i + 5]
      });
    }
    const state = { ...common, ...ref ? { ref } : {} };
    return page("Git history", [
      text(
        "scope",
        `${directory}
${ref ? `Pinned history root: ${ref}` : "HEAD + local branches + remote-tracking branches + tags"}
Topological history \xB7 lines join each commit to its parents \xB7 lines at the bottom continue beyond this page. All-ref pages are live; selected refs are pinned.`
      ),
      {
        id: "filter",
        kind: "form",
        label: "Browse ref",
        command: "browse",
        input: common,
        fields: [
          {
            name: "ref",
            label: "HEAD, full ref name, or commit ID (empty = all branches/tags)",
            kind: "text",
            value: ref ?? ""
          }
        ]
      },
      {
        id: "commits",
        kind: "graph",
        label: "Repository history",
        nodes: commits.slice(0, 15).map((c) => ({
          id: c.sha,
          parents: c.parents.split(" ").filter(Boolean).slice(0, 20),
          label: c.subject.slice(0, 200),
          detail: `${c.author} \xB7 ${c.date}`.slice(0, 200),
          annotation: short(c.sha),
          badges: c.refs ? [c.refs.slice(0, 160)] : [],
          action: action("inspect", "Inspect commit", { ...common, commit: c.sha })
        }))
      },
      text(
        "count",
        `${commits.length ? offset + 1 : 0}\u2013${offset + Math.min(commits.length, 15)} \xB7 15 commits per page \xB7 first 10,015 commits accessible. Empty repositories have no HEAD; commit once to browse.`
      ),
      actions("pages", [
        action("first", "Newest", state),
        ...offset > 0 ? [action("previous", "Previous", { ...state, offset: Math.max(0, offset - 15) })] : [],
        ...commits.length > 15 && offset + 15 <= 1e4 ? [action("next", "Older", { ...state, offset: offset + 15 })] : []
      ])
    ]);
  }
  return {
    commands: [
      {
        id: "browse",
        title: "Browse repository history",
        description: "Read bounded repository history, commit parents, changed files and patches. Accepts an absolute environment directory or thread ID.",
        permission: "filesystem:read",
        agent: true,
        run: (input) => tryPromise2(() => browse(input)).pipe(
          catch_2(
            () => succeed4(
              page("Git history", [
                text(
                  "error",
                  "Unable to read history. Check the absolute environment directory/thread ID, ref and object availability. Queries have a 10 second timeout and 8 KiB output limit; narrow the ref for large commits or messages."
                ),
                actions("retry", [action("retry", "Try again", input)])
              ])
            )
          )
        )
      }
    ],
    views: [
      {
        id: "history",
        title: "History",
        location: "thread-panel",
        presentation: "dialog",
        requiresRepository: true,
        permission: "filesystem:read",
        read: (input) => tryPromise2(() => browse({ thread: input?.threadId })).pipe(
          map2((result2) => result2.view),
          catch_2(
            () => succeed4({
              title: "Git history",
              blocks: [
                text(
                  "error",
                  "History is unavailable for this thread. Its worktree must contain a Git repository with a commit."
                )
              ]
            })
          )
        )
      }
    ]
  };
}
var plugin_default = {
  apiVersion: 1,
  id: "git-history",
  name: "Git history",
  version: "0.2.0",
  description: "Read-only repository-wide history and commit relationships.",
  activate: (context2) => sync2(() => contributions(context2))
};
export {
  contributions,
  plugin_default as default
};
