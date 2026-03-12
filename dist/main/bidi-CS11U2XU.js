"use strict";
var __defProp = Object.defineProperty;
var __typeError = (msg) => {
  throw TypeError(msg);
};
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
var __accessCheck = (obj, member, msg) => member.has(obj) || __typeError("Cannot " + msg);
var __privateIn = (member, obj) => Object(obj) !== obj ? __typeError('Cannot use the "in" operator on this value') : member.has(obj);
var __privateGet = (obj, member, getter) => (__accessCheck(obj, member, "read from private field"), getter ? getter.call(obj) : member.get(obj));
var __privateAdd = (obj, member, value) => member.has(obj) ? __typeError("Cannot add the same private member more than once") : member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
var __privateSet = (obj, member, value, setter) => (__accessCheck(obj, member, "write to private field"), setter ? setter.call(obj, value) : member.set(obj, value), value);
var __privateMethod = (obj, member, method) => (__accessCheck(obj, member, "access private method"), method);
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const require$$2 = require("crypto");
const main = require("./main-CrQSeszq.js");
var BidiMapper = {};
var BidiServer = {};
var EventEmitter = {};
var mitt;
var hasRequiredMitt;
function requireMitt() {
  if (hasRequiredMitt) return mitt;
  hasRequiredMitt = 1;
  mitt = function(n) {
    return { all: n = n || /* @__PURE__ */ new Map(), on: function(e, t) {
      var i = n.get(e);
      i ? i.push(t) : n.set(e, [t]);
    }, off: function(e, t) {
      var i = n.get(e);
      i && (t ? i.splice(i.indexOf(t) >>> 0, 1) : n.set(e, []));
    }, emit: function(e, t) {
      var i = n.get(e);
      i && i.slice().map(function(n2) {
        n2(t);
      }), (i = n.get("*")) && i.slice().map(function(n2) {
        n2(e, t);
      });
    } };
  };
  return mitt;
}
var hasRequiredEventEmitter;
function requireEventEmitter() {
  if (hasRequiredEventEmitter) return EventEmitter;
  hasRequiredEventEmitter = 1;
  var __importDefault = EventEmitter && EventEmitter.__importDefault || function(mod) {
    return mod && mod.__esModule ? mod : { "default": mod };
  };
  Object.defineProperty(EventEmitter, "__esModule", { value: true });
  EventEmitter.EventEmitter = void 0;
  const mitt_1 = __importDefault(requireMitt());
  let EventEmitter$1 = class EventEmitter {
    #emitter = (0, mitt_1.default)();
    on(type, handler) {
      this.#emitter.on(type, handler);
      return this;
    }
    /**
     * Like `on` but the listener will only be fired once and then it will be removed.
     * @param event The event you'd like to listen to
     * @param handler The handler function to run when the event occurs
     * @return `this` to enable chaining method calls.
     */
    once(event, handler) {
      const onceHandler = (eventData) => {
        handler(eventData);
        this.off(event, onceHandler);
      };
      return this.on(event, onceHandler);
    }
    off(type, handler) {
      this.#emitter.off(type, handler);
      return this;
    }
    /**
     * Emits an event and call any associated listeners.
     *
     * @param event The event to emit.
     * @param eventData Any data to emit with the event.
     * @return `true` if there are any listeners, `false` otherwise.
     */
    emit(event, eventData) {
      this.#emitter.emit(event, eventData);
    }
    /**
     * Removes all listeners. If given an event argument, it will remove only
     * listeners for that event.
     * @param event - the event to remove listeners for.
     * @returns `this` to enable you to chain method calls.
     */
    removeAllListeners(event) {
      if (event) {
        this.#emitter.all.delete(event);
      } else {
        this.#emitter.all.clear();
      }
      return this;
    }
  };
  EventEmitter.EventEmitter = EventEmitter$1;
  return EventEmitter;
}
var log = {};
var hasRequiredLog;
function requireLog() {
  if (hasRequiredLog) return log;
  hasRequiredLog = 1;
  Object.defineProperty(log, "__esModule", { value: true });
  log.LogType = void 0;
  var LogType;
  (function(LogType2) {
    LogType2["bidi"] = "bidi";
    LogType2["cdp"] = "cdp";
    LogType2["debug"] = "debug";
    LogType2["debugError"] = "debug:error";
    LogType2["debugInfo"] = "debug:info";
    LogType2["debugWarn"] = "debug:warn";
  })(LogType || (log.LogType = LogType = {}));
  return log;
}
var ProcessingQueue = {};
var hasRequiredProcessingQueue;
function requireProcessingQueue() {
  if (hasRequiredProcessingQueue) return ProcessingQueue;
  hasRequiredProcessingQueue = 1;
  var _a2;
  Object.defineProperty(ProcessingQueue, "__esModule", { value: true });
  ProcessingQueue.ProcessingQueue = void 0;
  const log_js_1 = requireLog();
  let ProcessingQueue$1 = class ProcessingQueue {
    static LOGGER_PREFIX = `${log_js_1.LogType.debug}:queue`;
    #logger;
    #processor;
    #queue = [];
    // Flag to keep only 1 active processor.
    #isProcessing = false;
    constructor(processor, logger) {
      this.#processor = processor;
      this.#logger = logger;
    }
    add(entry, name) {
      this.#queue.push([entry, name]);
      void this.#processIfNeeded();
    }
    async #processIfNeeded() {
      if (this.#isProcessing) {
        return;
      }
      this.#isProcessing = true;
      while (this.#queue.length > 0) {
        const arrayEntry = this.#queue.shift();
        if (!arrayEntry) {
          continue;
        }
        const [entryPromise, name] = arrayEntry;
        this.#logger?.(_a2.LOGGER_PREFIX, "Processing event:", name);
        await entryPromise.then((entry) => {
          if (entry.kind === "error") {
            this.#logger?.(log_js_1.LogType.debugError, "Event threw before sending:", entry.error.message, entry.error.stack);
            return;
          }
          return this.#processor(entry.value);
        }).catch((error) => {
          this.#logger?.(log_js_1.LogType.debugError, "Event was not processed:", error?.message);
        });
      }
      this.#isProcessing = false;
    }
  };
  ProcessingQueue.ProcessingQueue = ProcessingQueue$1;
  _a2 = ProcessingQueue$1;
  return ProcessingQueue;
}
var CommandProcessor = {};
var protocol = {};
var cdp = {};
var hasRequiredCdp;
function requireCdp() {
  if (hasRequiredCdp) return cdp;
  hasRequiredCdp = 1;
  Object.defineProperty(cdp, "__esModule", { value: true });
  return cdp;
}
var chromiumBidi = {};
var hasRequiredChromiumBidi;
function requireChromiumBidi() {
  if (hasRequiredChromiumBidi) return chromiumBidi;
  hasRequiredChromiumBidi = 1;
  Object.defineProperty(chromiumBidi, "__esModule", { value: true });
  chromiumBidi.EVENT_NAMES = chromiumBidi.Bluetooth = chromiumBidi.Network = chromiumBidi.Input = chromiumBidi.BrowsingContext = chromiumBidi.Log = chromiumBidi.Script = chromiumBidi.BiDiModule = void 0;
  var BiDiModule;
  (function(BiDiModule2) {
    BiDiModule2["Bluetooth"] = "bluetooth";
    BiDiModule2["Browser"] = "browser";
    BiDiModule2["BrowsingContext"] = "browsingContext";
    BiDiModule2["Cdp"] = "goog:cdp";
    BiDiModule2["Input"] = "input";
    BiDiModule2["Log"] = "log";
    BiDiModule2["Network"] = "network";
    BiDiModule2["Script"] = "script";
    BiDiModule2["Session"] = "session";
  })(BiDiModule || (chromiumBidi.BiDiModule = BiDiModule = {}));
  var Script;
  (function(Script2) {
    (function(EventNames) {
      EventNames["Message"] = "script.message";
      EventNames["RealmCreated"] = "script.realmCreated";
      EventNames["RealmDestroyed"] = "script.realmDestroyed";
    })(Script2.EventNames || (Script2.EventNames = {}));
  })(Script || (chromiumBidi.Script = Script = {}));
  var Log;
  (function(Log2) {
    (function(EventNames) {
      EventNames["LogEntryAdded"] = "log.entryAdded";
    })(Log2.EventNames || (Log2.EventNames = {}));
  })(Log || (chromiumBidi.Log = Log = {}));
  var BrowsingContext2;
  (function(BrowsingContext3) {
    (function(EventNames) {
      EventNames["ContextCreated"] = "browsingContext.contextCreated";
      EventNames["ContextDestroyed"] = "browsingContext.contextDestroyed";
      EventNames["DomContentLoaded"] = "browsingContext.domContentLoaded";
      EventNames["DownloadEnd"] = "browsingContext.downloadEnd";
      EventNames["DownloadWillBegin"] = "browsingContext.downloadWillBegin";
      EventNames["FragmentNavigated"] = "browsingContext.fragmentNavigated";
      EventNames["HistoryUpdated"] = "browsingContext.historyUpdated";
      EventNames["Load"] = "browsingContext.load";
      EventNames["NavigationAborted"] = "browsingContext.navigationAborted";
      EventNames["NavigationCommitted"] = "browsingContext.navigationCommitted";
      EventNames["NavigationFailed"] = "browsingContext.navigationFailed";
      EventNames["NavigationStarted"] = "browsingContext.navigationStarted";
      EventNames["UserPromptClosed"] = "browsingContext.userPromptClosed";
      EventNames["UserPromptOpened"] = "browsingContext.userPromptOpened";
    })(BrowsingContext3.EventNames || (BrowsingContext3.EventNames = {}));
  })(BrowsingContext2 || (chromiumBidi.BrowsingContext = BrowsingContext2 = {}));
  var Input;
  (function(Input2) {
    (function(EventNames) {
      EventNames["FileDialogOpened"] = "input.fileDialogOpened";
    })(Input2.EventNames || (Input2.EventNames = {}));
  })(Input || (chromiumBidi.Input = Input = {}));
  var Network;
  (function(Network2) {
    (function(EventNames) {
      EventNames["AuthRequired"] = "network.authRequired";
      EventNames["BeforeRequestSent"] = "network.beforeRequestSent";
      EventNames["FetchError"] = "network.fetchError";
      EventNames["ResponseCompleted"] = "network.responseCompleted";
      EventNames["ResponseStarted"] = "network.responseStarted";
    })(Network2.EventNames || (Network2.EventNames = {}));
  })(Network || (chromiumBidi.Network = Network = {}));
  var Bluetooth;
  (function(Bluetooth2) {
    (function(EventNames) {
      EventNames["RequestDevicePromptUpdated"] = "bluetooth.requestDevicePromptUpdated";
      EventNames["GattConnectionAttempted"] = "bluetooth.gattConnectionAttempted";
      EventNames["CharacteristicEventGenerated"] = "bluetooth.characteristicEventGenerated";
      EventNames["DescriptorEventGenerated"] = "bluetooth.descriptorEventGenerated";
    })(Bluetooth2.EventNames || (Bluetooth2.EventNames = {}));
  })(Bluetooth || (chromiumBidi.Bluetooth = Bluetooth = {}));
  chromiumBidi.EVENT_NAMES = /* @__PURE__ */ new Set([
    // keep-sorted start
    ...Object.values(BiDiModule),
    ...Object.values(Bluetooth.EventNames),
    ...Object.values(BrowsingContext2.EventNames),
    ...Object.values(Input.EventNames),
    ...Object.values(Log.EventNames),
    ...Object.values(Network.EventNames),
    ...Object.values(Script.EventNames)
    // keep-sorted end
  ]);
  return chromiumBidi;
}
var webdriverBidi = {};
var hasRequiredWebdriverBidi;
function requireWebdriverBidi() {
  if (hasRequiredWebdriverBidi) return webdriverBidi;
  hasRequiredWebdriverBidi = 1;
  Object.defineProperty(webdriverBidi, "__esModule", { value: true });
  return webdriverBidi;
}
var ErrorResponse = {};
var hasRequiredErrorResponse;
function requireErrorResponse() {
  if (hasRequiredErrorResponse) return ErrorResponse;
  hasRequiredErrorResponse = 1;
  Object.defineProperty(ErrorResponse, "__esModule", { value: true });
  ErrorResponse.UnavailableNetworkDataException = ErrorResponse.NoSuchNetworkDataException = ErrorResponse.NoSuchNetworkCollectorException = ErrorResponse.NoSuchWebExtensionException = ErrorResponse.InvalidWebExtensionException = ErrorResponse.UnderspecifiedStoragePartitionException = ErrorResponse.UnableToSetFileInputException = ErrorResponse.UnableToSetCookieException = ErrorResponse.NoSuchStoragePartitionException = ErrorResponse.UnsupportedOperationException = ErrorResponse.UnableToCloseBrowserException = ErrorResponse.UnableToCaptureScreenException = ErrorResponse.UnknownErrorException = ErrorResponse.UnknownCommandException = ErrorResponse.SessionNotCreatedException = ErrorResponse.NoSuchUserContextException = ErrorResponse.NoSuchScriptException = ErrorResponse.NoSuchRequestException = ErrorResponse.NoSuchNodeException = ErrorResponse.NoSuchInterceptException = ErrorResponse.NoSuchHistoryEntryException = ErrorResponse.NoSuchHandleException = ErrorResponse.NoSuchFrameException = ErrorResponse.NoSuchElementException = ErrorResponse.NoSuchAlertException = ErrorResponse.MoveTargetOutOfBoundsException = ErrorResponse.InvalidSessionIdException = ErrorResponse.InvalidSelectorException = ErrorResponse.InvalidArgumentException = ErrorResponse.Exception = void 0;
  class Exception extends Error {
    error;
    message;
    stacktrace;
    constructor(error, message, stacktrace) {
      super();
      this.error = error;
      this.message = message;
      this.stacktrace = stacktrace;
    }
    toErrorResponse(commandId) {
      return {
        type: "error",
        id: commandId,
        error: this.error,
        message: this.message,
        stacktrace: this.stacktrace
      };
    }
  }
  ErrorResponse.Exception = Exception;
  class InvalidArgumentException extends Exception {
    constructor(message, stacktrace) {
      super("invalid argument", message, stacktrace);
    }
  }
  ErrorResponse.InvalidArgumentException = InvalidArgumentException;
  class InvalidSelectorException extends Exception {
    constructor(message, stacktrace) {
      super("invalid selector", message, stacktrace);
    }
  }
  ErrorResponse.InvalidSelectorException = InvalidSelectorException;
  class InvalidSessionIdException extends Exception {
    constructor(message, stacktrace) {
      super("invalid session id", message, stacktrace);
    }
  }
  ErrorResponse.InvalidSessionIdException = InvalidSessionIdException;
  class MoveTargetOutOfBoundsException extends Exception {
    constructor(message, stacktrace) {
      super("move target out of bounds", message, stacktrace);
    }
  }
  ErrorResponse.MoveTargetOutOfBoundsException = MoveTargetOutOfBoundsException;
  class NoSuchAlertException extends Exception {
    constructor(message, stacktrace) {
      super("no such alert", message, stacktrace);
    }
  }
  ErrorResponse.NoSuchAlertException = NoSuchAlertException;
  class NoSuchElementException extends Exception {
    constructor(message, stacktrace) {
      super("no such element", message, stacktrace);
    }
  }
  ErrorResponse.NoSuchElementException = NoSuchElementException;
  class NoSuchFrameException extends Exception {
    constructor(message, stacktrace) {
      super("no such frame", message, stacktrace);
    }
  }
  ErrorResponse.NoSuchFrameException = NoSuchFrameException;
  class NoSuchHandleException extends Exception {
    constructor(message, stacktrace) {
      super("no such handle", message, stacktrace);
    }
  }
  ErrorResponse.NoSuchHandleException = NoSuchHandleException;
  class NoSuchHistoryEntryException extends Exception {
    constructor(message, stacktrace) {
      super("no such history entry", message, stacktrace);
    }
  }
  ErrorResponse.NoSuchHistoryEntryException = NoSuchHistoryEntryException;
  class NoSuchInterceptException extends Exception {
    constructor(message, stacktrace) {
      super("no such intercept", message, stacktrace);
    }
  }
  ErrorResponse.NoSuchInterceptException = NoSuchInterceptException;
  class NoSuchNodeException extends Exception {
    constructor(message, stacktrace) {
      super("no such node", message, stacktrace);
    }
  }
  ErrorResponse.NoSuchNodeException = NoSuchNodeException;
  class NoSuchRequestException extends Exception {
    constructor(message, stacktrace) {
      super("no such request", message, stacktrace);
    }
  }
  ErrorResponse.NoSuchRequestException = NoSuchRequestException;
  class NoSuchScriptException extends Exception {
    constructor(message, stacktrace) {
      super("no such script", message, stacktrace);
    }
  }
  ErrorResponse.NoSuchScriptException = NoSuchScriptException;
  class NoSuchUserContextException extends Exception {
    constructor(message, stacktrace) {
      super("no such user context", message, stacktrace);
    }
  }
  ErrorResponse.NoSuchUserContextException = NoSuchUserContextException;
  class SessionNotCreatedException extends Exception {
    constructor(message, stacktrace) {
      super("session not created", message, stacktrace);
    }
  }
  ErrorResponse.SessionNotCreatedException = SessionNotCreatedException;
  class UnknownCommandException extends Exception {
    constructor(message, stacktrace) {
      super("unknown command", message, stacktrace);
    }
  }
  ErrorResponse.UnknownCommandException = UnknownCommandException;
  class UnknownErrorException extends Exception {
    constructor(message, stacktrace = new Error().stack) {
      super("unknown error", message, stacktrace);
    }
  }
  ErrorResponse.UnknownErrorException = UnknownErrorException;
  class UnableToCaptureScreenException extends Exception {
    constructor(message, stacktrace) {
      super("unable to capture screen", message, stacktrace);
    }
  }
  ErrorResponse.UnableToCaptureScreenException = UnableToCaptureScreenException;
  class UnableToCloseBrowserException extends Exception {
    constructor(message, stacktrace) {
      super("unable to close browser", message, stacktrace);
    }
  }
  ErrorResponse.UnableToCloseBrowserException = UnableToCloseBrowserException;
  class UnsupportedOperationException extends Exception {
    constructor(message, stacktrace) {
      super("unsupported operation", message, stacktrace);
    }
  }
  ErrorResponse.UnsupportedOperationException = UnsupportedOperationException;
  class NoSuchStoragePartitionException extends Exception {
    constructor(message, stacktrace) {
      super("no such storage partition", message, stacktrace);
    }
  }
  ErrorResponse.NoSuchStoragePartitionException = NoSuchStoragePartitionException;
  class UnableToSetCookieException extends Exception {
    constructor(message, stacktrace) {
      super("unable to set cookie", message, stacktrace);
    }
  }
  ErrorResponse.UnableToSetCookieException = UnableToSetCookieException;
  class UnableToSetFileInputException extends Exception {
    constructor(message, stacktrace) {
      super("unable to set file input", message, stacktrace);
    }
  }
  ErrorResponse.UnableToSetFileInputException = UnableToSetFileInputException;
  class UnderspecifiedStoragePartitionException extends Exception {
    constructor(message, stacktrace) {
      super("underspecified storage partition", message, stacktrace);
    }
  }
  ErrorResponse.UnderspecifiedStoragePartitionException = UnderspecifiedStoragePartitionException;
  class InvalidWebExtensionException extends Exception {
    constructor(message, stacktrace) {
      super("invalid web extension", message, stacktrace);
    }
  }
  ErrorResponse.InvalidWebExtensionException = InvalidWebExtensionException;
  class NoSuchWebExtensionException extends Exception {
    constructor(message, stacktrace) {
      super("no such web extension", message, stacktrace);
    }
  }
  ErrorResponse.NoSuchWebExtensionException = NoSuchWebExtensionException;
  class NoSuchNetworkCollectorException extends Exception {
    constructor(message, stacktrace) {
      super("no such network collector", message, stacktrace);
    }
  }
  ErrorResponse.NoSuchNetworkCollectorException = NoSuchNetworkCollectorException;
  class NoSuchNetworkDataException extends Exception {
    constructor(message, stacktrace) {
      super("no such network data", message, stacktrace);
    }
  }
  ErrorResponse.NoSuchNetworkDataException = NoSuchNetworkDataException;
  class UnavailableNetworkDataException extends Exception {
    constructor(message, stacktrace) {
      super("unavailable network data", message, stacktrace);
    }
  }
  ErrorResponse.UnavailableNetworkDataException = UnavailableNetworkDataException;
  return ErrorResponse;
}
var webdriverBidiPermissions = {};
var hasRequiredWebdriverBidiPermissions;
function requireWebdriverBidiPermissions() {
  if (hasRequiredWebdriverBidiPermissions) return webdriverBidiPermissions;
  hasRequiredWebdriverBidiPermissions = 1;
  Object.defineProperty(webdriverBidiPermissions, "__esModule", { value: true });
  return webdriverBidiPermissions;
}
var webdriverBidiBluetooth = {};
var hasRequiredWebdriverBidiBluetooth;
function requireWebdriverBidiBluetooth() {
  if (hasRequiredWebdriverBidiBluetooth) return webdriverBidiBluetooth;
  hasRequiredWebdriverBidiBluetooth = 1;
  Object.defineProperty(webdriverBidiBluetooth, "__esModule", { value: true });
  return webdriverBidiBluetooth;
}
var hasRequiredProtocol;
function requireProtocol() {
  if (hasRequiredProtocol) return protocol;
  hasRequiredProtocol = 1;
  (function(exports2) {
    var __createBinding = protocol && protocol.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    });
    var __setModuleDefault = protocol && protocol.__setModuleDefault || (Object.create ? function(o, v) {
      Object.defineProperty(o, "default", { enumerable: true, value: v });
    } : function(o, v) {
      o["default"] = v;
    });
    var __importStar = protocol && protocol.__importStar || /* @__PURE__ */ function() {
      var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function(o2) {
          var ar = [];
          for (var k in o2) if (Object.prototype.hasOwnProperty.call(o2, k)) ar[ar.length] = k;
          return ar;
        };
        return ownKeys(o);
      };
      return function(mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) {
          for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        }
        __setModuleDefault(result, mod);
        return result;
      };
    }();
    var __exportStar = protocol && protocol.__exportStar || function(m, exports3) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports3, p)) __createBinding(exports3, m, p);
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.ChromiumBidi = exports2.Cdp = void 0;
    exports2.Cdp = __importStar(requireCdp());
    exports2.ChromiumBidi = __importStar(requireChromiumBidi());
    __exportStar(requireWebdriverBidi(), exports2);
    __exportStar(requireErrorResponse(), exports2);
    __exportStar(requireWebdriverBidiPermissions(), exports2);
    __exportStar(requireWebdriverBidiBluetooth(), exports2);
  })(protocol);
  return protocol;
}
var BidiNoOpParser = {};
var hasRequiredBidiNoOpParser;
function requireBidiNoOpParser() {
  if (hasRequiredBidiNoOpParser) return BidiNoOpParser;
  hasRequiredBidiNoOpParser = 1;
  Object.defineProperty(BidiNoOpParser, "__esModule", { value: true });
  BidiNoOpParser.BidiNoOpParser = void 0;
  let BidiNoOpParser$1 = class BidiNoOpParser {
    // Bluetooth module
    // keep-sorted start block=yes
    parseDisableSimulationParameters(params) {
      return params;
    }
    parseHandleRequestDevicePromptParams(params) {
      return params;
    }
    parseSimulateAdapterParameters(params) {
      return params;
    }
    parseSimulateAdvertisementParameters(params) {
      return params;
    }
    parseSimulateCharacteristicParameters(params) {
      return params;
    }
    parseSimulateCharacteristicResponseParameters(params) {
      return params;
    }
    parseSimulateDescriptorParameters(params) {
      return params;
    }
    parseSimulateDescriptorResponseParameters(params) {
      return params;
    }
    parseSimulateGattConnectionResponseParameters(params) {
      return params;
    }
    parseSimulateGattDisconnectionParameters(params) {
      return params;
    }
    parseSimulatePreconnectedPeripheralParameters(params) {
      return params;
    }
    parseSimulateServiceParameters(params) {
      return params;
    }
    // keep-sorted end
    // Browser module
    // keep-sorted start block=yes
    parseCreateUserContextParameters(params) {
      return params;
    }
    parseRemoveUserContextParameters(params) {
      return params;
    }
    parseSetClientWindowStateParameters(params) {
      return params;
    }
    // keep-sorted end
    // Browsing Context module
    // keep-sorted start block=yes
    parseActivateParams(params) {
      return params;
    }
    parseCaptureScreenshotParams(params) {
      return params;
    }
    parseCloseParams(params) {
      return params;
    }
    parseCreateParams(params) {
      return params;
    }
    parseGetTreeParams(params) {
      return params;
    }
    parseHandleUserPromptParams(params) {
      return params;
    }
    parseLocateNodesParams(params) {
      return params;
    }
    parseNavigateParams(params) {
      return params;
    }
    parsePrintParams(params) {
      return params;
    }
    parseReloadParams(params) {
      return params;
    }
    parseSetViewportParams(params) {
      return params;
    }
    parseTraverseHistoryParams(params) {
      return params;
    }
    // keep-sorted end
    // CDP module
    // keep-sorted start block=yes
    parseGetSessionParams(params) {
      return params;
    }
    parseResolveRealmParams(params) {
      return params;
    }
    parseSendCommandParams(params) {
      return params;
    }
    // keep-sorted end
    // Emulation module
    // keep-sorted start block=yes
    parseSetGeolocationOverrideParams(params) {
      return params;
    }
    parseSetLocaleOverrideParams(params) {
      return params;
    }
    parseSetScreenOrientationOverrideParams(params) {
      return params;
    }
    parseSetTimezoneOverrideParams(params) {
      return params;
    }
    // keep-sorted end
    // Script module
    // keep-sorted start block=yes
    parseAddPreloadScriptParams(params) {
      return params;
    }
    parseCallFunctionParams(params) {
      return params;
    }
    parseDisownParams(params) {
      return params;
    }
    parseEvaluateParams(params) {
      return params;
    }
    parseGetRealmsParams(params) {
      return params;
    }
    parseRemovePreloadScriptParams(params) {
      return params;
    }
    // keep-sorted end
    // Input module
    // keep-sorted start block=yes
    parsePerformActionsParams(params) {
      return params;
    }
    parseReleaseActionsParams(params) {
      return params;
    }
    parseSetFilesParams(params) {
      return params;
    }
    // keep-sorted end
    // Network module
    // keep-sorted start block=yes
    parseAddDataCollectorParams(params) {
      return params;
    }
    parseAddInterceptParams(params) {
      return params;
    }
    parseContinueRequestParams(params) {
      return params;
    }
    parseContinueResponseParams(params) {
      return params;
    }
    parseContinueWithAuthParams(params) {
      return params;
    }
    parseDisownDataParams(params) {
      return params;
    }
    parseFailRequestParams(params) {
      return params;
    }
    parseGetDataParams(params) {
      return params;
    }
    parseProvideResponseParams(params) {
      return params;
    }
    parseRemoveDataCollectorParams(params) {
      return params;
    }
    parseRemoveInterceptParams(params) {
      return params;
    }
    parseSetCacheBehavior(params) {
      return params;
    }
    // keep-sorted end
    // Permissions module
    // keep-sorted start block=yes
    parseSetPermissionsParams(params) {
      return params;
    }
    // keep-sorted end
    // Session module
    // keep-sorted start block=yes
    parseSubscribeParams(params) {
      return params;
    }
    parseUnsubscribeParams(params) {
      return params;
    }
    // keep-sorted end
    // Storage module
    // keep-sorted start block=yes
    parseDeleteCookiesParams(params) {
      return params;
    }
    parseGetCookiesParams(params) {
      return params;
    }
    parseSetCookieParams(params) {
      return params;
    }
    // keep-sorted end
    // WebExtenstion module
    // keep-sorted start block=yes
    parseInstallParams(params) {
      return params;
    }
    parseUninstallParams(params) {
      return params;
    }
  };
  BidiNoOpParser.BidiNoOpParser = BidiNoOpParser$1;
  return BidiNoOpParser;
}
var BrowserProcessor = {};
var hasRequiredBrowserProcessor;
function requireBrowserProcessor() {
  if (hasRequiredBrowserProcessor) return BrowserProcessor;
  hasRequiredBrowserProcessor = 1;
  Object.defineProperty(BrowserProcessor, "__esModule", { value: true });
  BrowserProcessor.BrowserProcessor = void 0;
  BrowserProcessor.getProxyStr = getProxyStr;
  const protocol_js_1 = requireProtocol();
  let BrowserProcessor$1 = class BrowserProcessor {
    #browserCdpClient;
    #browsingContextStorage;
    #userContextStorage;
    #mapperOptionsStorage;
    constructor(browserCdpClient, browsingContextStorage, mapperOptionsStorage, userContextStorage) {
      this.#browserCdpClient = browserCdpClient;
      this.#browsingContextStorage = browsingContextStorage;
      this.#mapperOptionsStorage = mapperOptionsStorage;
      this.#userContextStorage = userContextStorage;
    }
    close() {
      setTimeout(() => this.#browserCdpClient.sendCommand("Browser.close"), 0);
      return {};
    }
    async createUserContext(params) {
      const w3cParams = params;
      if (w3cParams.acceptInsecureCerts !== void 0) {
        if (w3cParams.acceptInsecureCerts === false && this.#mapperOptionsStorage.mapperOptions?.acceptInsecureCerts === true)
          throw new protocol_js_1.UnknownErrorException(`Cannot set user context's "acceptInsecureCerts" to false, when a capability "acceptInsecureCerts" is set to true`);
      }
      const request = {};
      if (w3cParams.proxy) {
        const proxyStr = getProxyStr(w3cParams.proxy);
        if (proxyStr) {
          request.proxyServer = proxyStr;
        }
        if (w3cParams.proxy.noProxy) {
          request.proxyBypassList = w3cParams.proxy.noProxy.join(",");
        }
      } else {
        if (params["goog:proxyServer"] !== void 0) {
          request.proxyServer = params["goog:proxyServer"];
        }
        const proxyBypassList = params["goog:proxyBypassList"] ?? void 0;
        if (proxyBypassList) {
          request.proxyBypassList = proxyBypassList.join(",");
        }
      }
      const context = await this.#browserCdpClient.sendCommand("Target.createBrowserContext", request);
      this.#userContextStorage.getConfig(context.browserContextId).acceptInsecureCerts = params["acceptInsecureCerts"];
      this.#userContextStorage.getConfig(context.browserContextId).userPromptHandler = params["unhandledPromptBehavior"];
      return {
        userContext: context.browserContextId
      };
    }
    async removeUserContext(params) {
      const userContext = params.userContext;
      if (userContext === "default") {
        throw new protocol_js_1.InvalidArgumentException("`default` user context cannot be removed");
      }
      try {
        await this.#browserCdpClient.sendCommand("Target.disposeBrowserContext", {
          browserContextId: userContext
        });
      } catch (err) {
        if (err.message.startsWith("Failed to find context with id")) {
          throw new protocol_js_1.NoSuchUserContextException(err.message);
        }
        throw err;
      }
      return {};
    }
    async getUserContexts() {
      return {
        userContexts: await this.#userContextStorage.getUserContexts()
      };
    }
    async #getWindowInfo(targetId) {
      const windowInfo = await this.#browserCdpClient.sendCommand("Browser.getWindowForTarget", { targetId });
      return {
        // `active` is not supported in CDP yet.
        active: false,
        clientWindow: `${windowInfo.windowId}`,
        state: windowInfo.bounds.windowState ?? "normal",
        height: windowInfo.bounds.height ?? 0,
        width: windowInfo.bounds.width ?? 0,
        x: windowInfo.bounds.left ?? 0,
        y: windowInfo.bounds.top ?? 0
      };
    }
    async getClientWindows() {
      const topLevelTargetIds = this.#browsingContextStorage.getTopLevelContexts().map((b) => b.cdpTarget.id);
      const clientWindows = await Promise.all(topLevelTargetIds.map(async (targetId) => await this.#getWindowInfo(targetId)));
      const uniqueClientWindowIds = /* @__PURE__ */ new Set();
      const uniqueClientWindows = new Array();
      for (const window2 of clientWindows) {
        if (!uniqueClientWindowIds.has(window2.clientWindow)) {
          uniqueClientWindowIds.add(window2.clientWindow);
          uniqueClientWindows.push(window2);
        }
      }
      return { clientWindows: uniqueClientWindows };
    }
  };
  BrowserProcessor.BrowserProcessor = BrowserProcessor$1;
  function getProxyStr(proxyConfig) {
    if (proxyConfig.proxyType === "direct" || proxyConfig.proxyType === "system") {
      return void 0;
    }
    if (proxyConfig.proxyType === "pac") {
      throw new protocol_js_1.UnsupportedOperationException(`PAC proxy configuration is not supported per user context`);
    }
    if (proxyConfig.proxyType === "autodetect") {
      throw new protocol_js_1.UnsupportedOperationException(`Autodetect proxy is not supported per user context`);
    }
    if (proxyConfig.proxyType === "manual") {
      const servers = [];
      if (proxyConfig.httpProxy !== void 0) {
        servers.push(`http=${proxyConfig.httpProxy}`);
      }
      if (proxyConfig.sslProxy !== void 0) {
        servers.push(`https=${proxyConfig.sslProxy}`);
      }
      if (proxyConfig.socksProxy !== void 0 || proxyConfig.socksVersion !== void 0) {
        if (proxyConfig.socksProxy === void 0) {
          throw new protocol_js_1.InvalidArgumentException(`'socksVersion' cannot be set without 'socksProxy'`);
        }
        if (proxyConfig.socksVersion === void 0 || typeof proxyConfig.socksVersion !== "number" || !Number.isInteger(proxyConfig.socksVersion) || proxyConfig.socksVersion < 0 || proxyConfig.socksVersion > 255) {
          throw new protocol_js_1.InvalidArgumentException(`'socksVersion' must be between 0 and 255`);
        }
        servers.push(`socks=socks${proxyConfig.socksVersion}://${proxyConfig.socksProxy}`);
      }
      if (servers.length === 0) {
        return void 0;
      }
      return servers.join(";");
    }
    throw new protocol_js_1.UnknownErrorException(`Unknown proxy type`);
  }
  return BrowserProcessor;
}
var CdpProcessor = {};
var hasRequiredCdpProcessor;
function requireCdpProcessor() {
  if (hasRequiredCdpProcessor) return CdpProcessor;
  hasRequiredCdpProcessor = 1;
  Object.defineProperty(CdpProcessor, "__esModule", { value: true });
  CdpProcessor.CdpProcessor = void 0;
  const protocol_js_1 = requireProtocol();
  let CdpProcessor$1 = class CdpProcessor {
    #browsingContextStorage;
    #realmStorage;
    #cdpConnection;
    #browserCdpClient;
    constructor(browsingContextStorage, realmStorage, cdpConnection, browserCdpClient) {
      this.#browsingContextStorage = browsingContextStorage;
      this.#realmStorage = realmStorage;
      this.#cdpConnection = cdpConnection;
      this.#browserCdpClient = browserCdpClient;
    }
    getSession(params) {
      const context = params.context;
      const sessionId = this.#browsingContextStorage.getContext(context).cdpTarget.cdpSessionId;
      if (sessionId === void 0) {
        return {};
      }
      return { session: sessionId };
    }
    resolveRealm(params) {
      const context = params.realm;
      const realm = this.#realmStorage.getRealm({ realmId: context });
      if (realm === void 0) {
        throw new protocol_js_1.UnknownErrorException(`Could not find realm ${params.realm}`);
      }
      return { executionContextId: realm.executionContextId };
    }
    async sendCommand(params) {
      const client = params.session ? this.#cdpConnection.getCdpClient(params.session) : this.#browserCdpClient;
      const result = await client.sendCommand(params.method, params.params);
      return {
        result,
        session: params.session
      };
    }
  };
  CdpProcessor.CdpProcessor = CdpProcessor$1;
  return CdpProcessor;
}
var BrowsingContextProcessor = {};
var hasRequiredBrowsingContextProcessor;
function requireBrowsingContextProcessor() {
  if (hasRequiredBrowsingContextProcessor) return BrowsingContextProcessor;
  hasRequiredBrowsingContextProcessor = 1;
  Object.defineProperty(BrowsingContextProcessor, "__esModule", { value: true });
  BrowsingContextProcessor.BrowsingContextProcessor = void 0;
  const protocol_js_1 = requireProtocol();
  let BrowsingContextProcessor$1 = class BrowsingContextProcessor {
    #browserCdpClient;
    #browsingContextStorage;
    #eventManager;
    #userContextStorage;
    constructor(browserCdpClient, browsingContextStorage, userContextStorage, eventManager) {
      this.#userContextStorage = userContextStorage;
      this.#browserCdpClient = browserCdpClient;
      this.#browsingContextStorage = browsingContextStorage;
      this.#eventManager = eventManager;
      this.#eventManager.addSubscribeHook(protocol_js_1.ChromiumBidi.BrowsingContext.EventNames.ContextCreated, this.#onContextCreatedSubscribeHook.bind(this));
    }
    getTree(params) {
      const resultContexts = params.root === void 0 ? this.#browsingContextStorage.getTopLevelContexts() : [this.#browsingContextStorage.getContext(params.root)];
      return {
        contexts: resultContexts.map((c) => c.serializeToBidiValue(params.maxDepth ?? Number.MAX_VALUE))
      };
    }
    async create(params) {
      let referenceContext;
      let userContext = "default";
      if (params.referenceContext !== void 0) {
        referenceContext = this.#browsingContextStorage.getContext(params.referenceContext);
        if (!referenceContext.isTopLevelContext()) {
          throw new protocol_js_1.InvalidArgumentException(`referenceContext should be a top-level context`);
        }
        userContext = referenceContext.userContext;
      }
      if (params.userContext !== void 0) {
        userContext = params.userContext;
      }
      const existingContexts = this.#browsingContextStorage.getAllContexts().filter((context2) => context2.userContext === userContext);
      let newWindow = false;
      switch (params.type) {
        case "tab":
          newWindow = false;
          break;
        case "window":
          newWindow = true;
          break;
      }
      if (!existingContexts.length) {
        newWindow = true;
      }
      let result;
      try {
        result = await this.#browserCdpClient.sendCommand("Target.createTarget", {
          url: "about:blank",
          newWindow,
          browserContextId: userContext === "default" ? void 0 : userContext,
          background: params.background === true
        });
      } catch (err) {
        if (
          // See https://source.chromium.org/chromium/chromium/src/+/main:chrome/browser/devtools/protocol/target_handler.cc;l=90;drc=e80392ac11e48a691f4309964cab83a3a59e01c8
          err.message.startsWith("Failed to find browser context with id") || // See https://source.chromium.org/chromium/chromium/src/+/main:headless/lib/browser/protocol/target_handler.cc;l=49;drc=e80392ac11e48a691f4309964cab83a3a59e01c8
          err.message === "browserContextId"
        ) {
          throw new protocol_js_1.NoSuchUserContextException(`The context ${userContext} was not found`);
        }
        throw err;
      }
      const context = await this.#browsingContextStorage.waitForContext(result.targetId);
      await context.lifecycleLoaded();
      return { context: context.id };
    }
    navigate(params) {
      const context = this.#browsingContextStorage.getContext(params.context);
      return context.navigate(
        params.url,
        params.wait ?? "none"
        /* BrowsingContext.ReadinessState.None */
      );
    }
    reload(params) {
      const context = this.#browsingContextStorage.getContext(params.context);
      return context.reload(
        params.ignoreCache ?? false,
        params.wait ?? "none"
        /* BrowsingContext.ReadinessState.None */
      );
    }
    async activate(params) {
      const context = this.#browsingContextStorage.getContext(params.context);
      if (!context.isTopLevelContext()) {
        throw new protocol_js_1.InvalidArgumentException("Activation is only supported on the top-level context");
      }
      await context.activate();
      return {};
    }
    async captureScreenshot(params) {
      const context = this.#browsingContextStorage.getContext(params.context);
      return await context.captureScreenshot(params);
    }
    async print(params) {
      const context = this.#browsingContextStorage.getContext(params.context);
      return await context.print(params);
    }
    async setViewport(params) {
      const impactedTopLevelContexts = await this.#getRelatedTopLevelBrowsingContexts(params.context, params.userContexts);
      for (const userContextId of params.userContexts ?? []) {
        const userContextConfig = this.#userContextStorage.getConfig(userContextId);
        if (params.devicePixelRatio !== void 0) {
          userContextConfig.devicePixelRatio = params.devicePixelRatio;
        }
        if (params.viewport !== void 0) {
          userContextConfig.viewport = params.viewport;
        }
      }
      await Promise.all(impactedTopLevelContexts.map((context) => context.setViewport(params.viewport, params.devicePixelRatio)));
      return {};
    }
    /**
     * Returns a list of top-level browsing context ids.
     */
    async #getRelatedTopLevelBrowsingContexts(browsingContextId, userContextIds) {
      if (browsingContextId === void 0 && userContextIds === void 0) {
        throw new protocol_js_1.InvalidArgumentException("Either userContexts or context must be provided");
      }
      if (browsingContextId !== void 0 && userContextIds !== void 0) {
        throw new protocol_js_1.InvalidArgumentException("userContexts and context are mutually exclusive");
      }
      if (browsingContextId !== void 0) {
        const context = this.#browsingContextStorage.getContext(browsingContextId);
        if (!context.isTopLevelContext()) {
          throw new protocol_js_1.InvalidArgumentException("Emulating viewport is only supported on the top-level context");
        }
        return [context];
      }
      await this.#userContextStorage.verifyUserContextIdList(userContextIds);
      const result = [];
      for (const userContextId of userContextIds) {
        const topLevelBrowsingContexts = this.#browsingContextStorage.getTopLevelContexts().filter((browsingContext) => browsingContext.userContext === userContextId);
        result.push(...topLevelBrowsingContexts);
      }
      return [...new Set(result).values()];
    }
    async traverseHistory(params) {
      const context = this.#browsingContextStorage.getContext(params.context);
      if (!context) {
        throw new protocol_js_1.InvalidArgumentException(`No browsing context with id ${params.context}`);
      }
      if (!context.isTopLevelContext()) {
        throw new protocol_js_1.InvalidArgumentException("Traversing history is only supported on the top-level context");
      }
      await context.traverseHistory(params.delta);
      return {};
    }
    async handleUserPrompt(params) {
      const context = this.#browsingContextStorage.getContext(params.context);
      try {
        await context.handleUserPrompt(params.accept, params.userText);
      } catch (error) {
        if (error.message?.includes("No dialog is showing")) {
          throw new protocol_js_1.NoSuchAlertException("No dialog is showing");
        }
        throw error;
      }
      return {};
    }
    async close(params) {
      const context = this.#browsingContextStorage.getContext(params.context);
      if (!context.isTopLevelContext()) {
        throw new protocol_js_1.InvalidArgumentException(`Non top-level browsing context ${context.id} cannot be closed.`);
      }
      const parentCdpClient = context.cdpTarget.parentCdpClient;
      try {
        const detachedFromTargetPromise = new Promise((resolve) => {
          const onContextDestroyed = (event) => {
            if (event.targetId === params.context) {
              parentCdpClient.off("Target.detachedFromTarget", onContextDestroyed);
              resolve();
            }
          };
          parentCdpClient.on("Target.detachedFromTarget", onContextDestroyed);
        });
        try {
          if (params.promptUnload) {
            await context.close();
          } else {
            await parentCdpClient.sendCommand("Target.closeTarget", {
              targetId: params.context
            });
          }
        } catch (error) {
          if (!parentCdpClient.isCloseError(error)) {
            throw error;
          }
        }
        await detachedFromTargetPromise;
      } catch (error) {
        if (!(error.code === -32e3 && error.message === "Not attached to an active page")) {
          throw error;
        }
      }
      return {};
    }
    async locateNodes(params) {
      const context = this.#browsingContextStorage.getContext(params.context);
      return await context.locateNodes(params);
    }
    #onContextCreatedSubscribeHook(contextId) {
      const context = this.#browsingContextStorage.getContext(contextId);
      const contextsToReport = [
        context,
        ...this.#browsingContextStorage.getContext(contextId).allChildren
      ];
      contextsToReport.forEach((context2) => {
        this.#eventManager.registerEvent({
          type: "event",
          method: protocol_js_1.ChromiumBidi.BrowsingContext.EventNames.ContextCreated,
          params: context2.serializeToBidiValue()
        }, context2.id);
      });
      return Promise.resolve();
    }
  };
  BrowsingContextProcessor.BrowsingContextProcessor = BrowsingContextProcessor$1;
  return BrowsingContextProcessor;
}
var EmulationProcessor = {};
var hasRequiredEmulationProcessor;
function requireEmulationProcessor() {
  if (hasRequiredEmulationProcessor) return EmulationProcessor;
  hasRequiredEmulationProcessor = 1;
  Object.defineProperty(EmulationProcessor, "__esModule", { value: true });
  EmulationProcessor.EmulationProcessor = void 0;
  EmulationProcessor.isValidLocale = isValidLocale;
  EmulationProcessor.isValidTimezone = isValidTimezone;
  EmulationProcessor.isTimeZoneOffsetString = isTimeZoneOffsetString;
  const ErrorResponse_js_1 = requireErrorResponse();
  let EmulationProcessor$1 = class EmulationProcessor {
    #userContextStorage;
    #browsingContextStorage;
    constructor(browsingContextStorage, userContextStorage) {
      this.#userContextStorage = userContextStorage;
      this.#browsingContextStorage = browsingContextStorage;
    }
    async setGeolocationOverride(params) {
      if ("coordinates" in params && "error" in params) {
        throw new ErrorResponse_js_1.InvalidArgumentException("Coordinates and error cannot be set at the same time");
      }
      let geolocation = null;
      if ("coordinates" in params) {
        if ((params.coordinates?.altitude ?? null) === null && (params.coordinates?.altitudeAccuracy ?? null) !== null) {
          throw new ErrorResponse_js_1.InvalidArgumentException("Geolocation altitudeAccuracy can be set only with altitude");
        }
        geolocation = params.coordinates;
      } else if ("error" in params) {
        if (params.error.type !== "positionUnavailable") {
          throw new ErrorResponse_js_1.InvalidArgumentException(`Unknown geolocation error ${params.error.type}`);
        }
        geolocation = params.error;
      } else {
        throw new ErrorResponse_js_1.InvalidArgumentException(`Coordinates or error should be set`);
      }
      const browsingContexts = await this.#getRelatedTopLevelBrowsingContexts(params.contexts, params.userContexts);
      for (const userContextId of params.userContexts ?? []) {
        const userContextConfig = this.#userContextStorage.getConfig(userContextId);
        userContextConfig.geolocation = geolocation;
      }
      await Promise.all(browsingContexts.map(async (context) => await context.cdpTarget.setGeolocationOverride(geolocation)));
      return {};
    }
    async setLocaleOverride(params) {
      const locale = params.locale ?? null;
      if (locale !== null && !isValidLocale(locale)) {
        throw new ErrorResponse_js_1.InvalidArgumentException(`Invalid locale "${locale}"`);
      }
      const browsingContexts = await this.#getRelatedTopLevelBrowsingContexts(params.contexts, params.userContexts);
      for (const userContextId of params.userContexts ?? []) {
        const userContextConfig = this.#userContextStorage.getConfig(userContextId);
        userContextConfig.locale = locale;
      }
      await Promise.all(browsingContexts.map(async (context) => await context.cdpTarget.setLocaleOverride(locale)));
      return {};
    }
    async setScreenOrientationOverride(params) {
      const browsingContexts = await this.#getRelatedTopLevelBrowsingContexts(params.contexts, params.userContexts);
      for (const userContextId of params.userContexts ?? []) {
        const userContextConfig = this.#userContextStorage.getConfig(userContextId);
        userContextConfig.screenOrientation = params.screenOrientation;
      }
      await Promise.all(browsingContexts.map(async (context) => await context.cdpTarget.setScreenOrientationOverride(params.screenOrientation)));
      return {};
    }
    /**
     * Returns a list of top-level browsing contexts.
     */
    async #getRelatedTopLevelBrowsingContexts(browsingContextIds, userContextIds) {
      if (browsingContextIds === void 0 && userContextIds === void 0) {
        throw new ErrorResponse_js_1.InvalidArgumentException("Either user contexts or browsing contexts must be provided");
      }
      if (browsingContextIds !== void 0 && userContextIds !== void 0) {
        throw new ErrorResponse_js_1.InvalidArgumentException("User contexts and browsing contexts are mutually exclusive");
      }
      const result = [];
      if (browsingContextIds === void 0) {
        if (userContextIds.length === 0) {
          throw new ErrorResponse_js_1.InvalidArgumentException("user context should be provided");
        }
        await this.#userContextStorage.verifyUserContextIdList(userContextIds);
        for (const userContextId of userContextIds) {
          const topLevelBrowsingContexts = this.#browsingContextStorage.getTopLevelContexts().filter((browsingContext) => browsingContext.userContext === userContextId);
          result.push(...topLevelBrowsingContexts);
        }
      } else {
        if (browsingContextIds.length === 0) {
          throw new ErrorResponse_js_1.InvalidArgumentException("browsing context should be provided");
        }
        for (const browsingContextId of browsingContextIds) {
          const browsingContext = this.#browsingContextStorage.getContext(browsingContextId);
          if (!browsingContext.isTopLevelContext()) {
            throw new ErrorResponse_js_1.InvalidArgumentException("The command is only supported on the top-level context");
          }
          result.push(browsingContext);
        }
      }
      return [...new Set(result).values()];
    }
    async setTimezoneOverride(params) {
      let timezone = params.timezone ?? null;
      if (timezone !== null && !isValidTimezone(timezone)) {
        throw new ErrorResponse_js_1.InvalidArgumentException(`Invalid timezone "${timezone}"`);
      }
      if (timezone !== null && isTimeZoneOffsetString(timezone)) {
        timezone = `GMT${timezone}`;
      }
      const browsingContexts = await this.#getRelatedTopLevelBrowsingContexts(params.contexts, params.userContexts);
      for (const userContextId of params.userContexts ?? []) {
        const userContextConfig = this.#userContextStorage.getConfig(userContextId);
        userContextConfig.timezone = timezone;
      }
      await Promise.all(browsingContexts.map(async (context) => await context.cdpTarget.setTimezoneOverride(timezone)));
      return {};
    }
  };
  EmulationProcessor.EmulationProcessor = EmulationProcessor$1;
  function isValidLocale(locale) {
    try {
      new Intl.Locale(locale);
      return true;
    } catch (e) {
      if (e instanceof RangeError) {
        return false;
      }
      throw e;
    }
  }
  function isValidTimezone(timezone) {
    try {
      Intl.DateTimeFormat(void 0, { timeZone: timezone });
      return true;
    } catch (e) {
      if (e instanceof RangeError) {
        return false;
      }
      throw e;
    }
  }
  function isTimeZoneOffsetString(timezone) {
    return /^[+-](?:2[0-3]|[01]\d)(?::[0-5]\d)?$/.test(timezone);
  }
  return EmulationProcessor;
}
var InputProcessor = {};
var assert = {};
var hasRequiredAssert;
function requireAssert() {
  if (hasRequiredAssert) return assert;
  hasRequiredAssert = 1;
  Object.defineProperty(assert, "__esModule", { value: true });
  assert.assert = assert$1;
  function assert$1(predicate, message) {
    if (!predicate) {
      throw new Error(message ?? "Internal assertion failed.");
    }
  }
  return assert;
}
var ActionDispatcher = {};
var graphemeTools = {};
var hasRequiredGraphemeTools;
function requireGraphemeTools() {
  if (hasRequiredGraphemeTools) return graphemeTools;
  hasRequiredGraphemeTools = 1;
  Object.defineProperty(graphemeTools, "__esModule", { value: true });
  graphemeTools.isSingleComplexGrapheme = isSingleComplexGrapheme;
  graphemeTools.isSingleGrapheme = isSingleGrapheme;
  function isSingleComplexGrapheme(value) {
    return isSingleGrapheme(value) && value.length > 1;
  }
  function isSingleGrapheme(value) {
    const segmenter = new Intl.Segmenter("en", { granularity: "grapheme" });
    return [...segmenter.segment(value)].length === 1;
  }
  return graphemeTools;
}
var InputSource = {};
var hasRequiredInputSource;
function requireInputSource() {
  if (hasRequiredInputSource) return InputSource;
  hasRequiredInputSource = 1;
  Object.defineProperty(InputSource, "__esModule", { value: true });
  InputSource.WheelSource = InputSource.PointerSource = InputSource.KeySource = InputSource.NoneSource = void 0;
  class NoneSource {
    type = "none";
  }
  InputSource.NoneSource = NoneSource;
  class KeySource {
    type = "key";
    pressed = /* @__PURE__ */ new Set();
    // This is a bitfield that matches the modifiers parameter of
    // https://chromedevtools.github.io/devtools-protocol/tot/Input/#method-dispatchKeyEvent
    #modifiers = 0;
    get modifiers() {
      return this.#modifiers;
    }
    get alt() {
      return (this.#modifiers & 1) === 1;
    }
    set alt(value) {
      this.#setModifier(value, 1);
    }
    get ctrl() {
      return (this.#modifiers & 2) === 2;
    }
    set ctrl(value) {
      this.#setModifier(value, 2);
    }
    get meta() {
      return (this.#modifiers & 4) === 4;
    }
    set meta(value) {
      this.#setModifier(value, 4);
    }
    get shift() {
      return (this.#modifiers & 8) === 8;
    }
    set shift(value) {
      this.#setModifier(value, 8);
    }
    #setModifier(value, bit) {
      if (value) {
        this.#modifiers |= bit;
      } else {
        this.#modifiers &= ~bit;
      }
    }
  }
  InputSource.KeySource = KeySource;
  class PointerSource {
    type = "pointer";
    subtype;
    pointerId;
    pressed = /* @__PURE__ */ new Set();
    x = 0;
    y = 0;
    radiusX;
    radiusY;
    force;
    constructor(id, subtype) {
      this.pointerId = id;
      this.subtype = subtype;
    }
    // This is a bitfield that matches the buttons parameter of
    // https://chromedevtools.github.io/devtools-protocol/tot/Input/#method-dispatchMouseEvent
    get buttons() {
      let buttons = 0;
      for (const button of this.pressed) {
        switch (button) {
          case 0:
            buttons |= 1;
            break;
          case 1:
            buttons |= 4;
            break;
          case 2:
            buttons |= 2;
            break;
          case 3:
            buttons |= 8;
            break;
          case 4:
            buttons |= 16;
            break;
        }
      }
      return buttons;
    }
    // --- Platform-specific code starts here ---
    // Input.dispatchMouseEvent doesn't know the concept of double click, so we
    // need to create the logic, similar to how it's done for OSes:
    // https://source.chromium.org/chromium/chromium/src/+/refs/heads/main:ui/events/event.cc;l=479
    static ClickContext = class ClickContext {
      static #DOUBLE_CLICK_TIME_MS = 500;
      static #MAX_DOUBLE_CLICK_RADIUS = 2;
      count = 0;
      #x;
      #y;
      #time;
      constructor(x, y, time2) {
        this.#x = x;
        this.#y = y;
        this.#time = time2;
      }
      compare(context) {
        return (
          // The click needs to be within a certain amount of ms.
          context.#time - this.#time > ClickContext.#DOUBLE_CLICK_TIME_MS || // The click needs to be within a certain square radius.
          Math.abs(context.#x - this.#x) > ClickContext.#MAX_DOUBLE_CLICK_RADIUS || Math.abs(context.#y - this.#y) > ClickContext.#MAX_DOUBLE_CLICK_RADIUS
        );
      }
    };
    #clickContexts = /* @__PURE__ */ new Map();
    setClickCount(button, context) {
      let storedContext = this.#clickContexts.get(button);
      if (!storedContext || storedContext.compare(context)) {
        storedContext = context;
      }
      ++storedContext.count;
      this.#clickContexts.set(button, storedContext);
      return storedContext.count;
    }
    getClickCount(button) {
      return this.#clickContexts.get(button)?.count ?? 0;
    }
    /**
     * Resets click count. Resets consequent click counter. Prevents grouping clicks in
     * different `performActions` calls, so that they are not grouped as double, triple etc
     * clicks. Required for https://github.com/GoogleChromeLabs/chromium-bidi/issues/3043.
     */
    resetClickCount() {
      this.#clickContexts = /* @__PURE__ */ new Map();
    }
  }
  InputSource.PointerSource = PointerSource;
  class WheelSource {
    type = "wheel";
  }
  InputSource.WheelSource = WheelSource;
  return InputSource;
}
var keyUtils = {};
var hasRequiredKeyUtils;
function requireKeyUtils() {
  if (hasRequiredKeyUtils) return keyUtils;
  hasRequiredKeyUtils = 1;
  Object.defineProperty(keyUtils, "__esModule", { value: true });
  keyUtils.getNormalizedKey = getNormalizedKey;
  keyUtils.getKeyCode = getKeyCode;
  keyUtils.getKeyLocation = getKeyLocation;
  function getNormalizedKey(value) {
    switch (value) {
      case "":
        return "Unidentified";
      case "":
        return "Cancel";
      case "":
        return "Help";
      case "":
        return "Backspace";
      case "":
        return "Tab";
      case "":
        return "Clear";
      // Specification declares the '\uE006' to be `Return`, but it is not supported by
      // Chrome, so fall back to `Enter`, which aligns with WPT.
      case "":
      case "":
        return "Enter";
      case "":
        return "Shift";
      case "":
        return "Control";
      case "":
        return "Alt";
      case "":
        return "Pause";
      case "":
        return "Escape";
      case "":
        return " ";
      case "":
        return "PageUp";
      case "":
        return "PageDown";
      case "":
        return "End";
      case "":
        return "Home";
      case "":
        return "ArrowLeft";
      case "":
        return "ArrowUp";
      case "":
        return "ArrowRight";
      case "":
        return "ArrowDown";
      case "":
        return "Insert";
      case "":
        return "Delete";
      case "":
        return ";";
      case "":
        return "=";
      case "":
        return "0";
      case "":
        return "1";
      case "":
        return "2";
      case "":
        return "3";
      case "":
        return "4";
      case "":
        return "5";
      case "":
        return "6";
      case "":
        return "7";
      case "":
        return "8";
      case "":
        return "9";
      case "":
        return "*";
      case "":
        return "+";
      case "":
        return ",";
      case "":
        return "-";
      case "":
        return ".";
      case "":
        return "/";
      case "":
        return "F1";
      case "":
        return "F2";
      case "":
        return "F3";
      case "":
        return "F4";
      case "":
        return "F5";
      case "":
        return "F6";
      case "":
        return "F7";
      case "":
        return "F8";
      case "":
        return "F9";
      case "":
        return "F10";
      case "":
        return "F11";
      case "":
        return "F12";
      case "":
        return "Meta";
      case "":
        return "ZenkakuHankaku";
      case "":
        return "Shift";
      case "":
        return "Control";
      case "":
        return "Alt";
      case "":
        return "Meta";
      case "":
        return "PageUp";
      case "":
        return "PageDown";
      case "":
        return "End";
      case "":
        return "Home";
      case "":
        return "ArrowLeft";
      case "":
        return "ArrowUp";
      case "":
        return "ArrowRight";
      case "":
        return "ArrowDown";
      case "":
        return "Insert";
      case "":
        return "Delete";
      default:
        return value;
    }
  }
  function getKeyCode(key) {
    switch (key) {
      case "`":
      case "~":
        return "Backquote";
      case "\\":
      case "|":
        return "Backslash";
      case "":
        return "Backspace";
      case "[":
      case "{":
        return "BracketLeft";
      case "]":
      case "}":
        return "BracketRight";
      case ",":
      case "<":
        return "Comma";
      case "0":
      case ")":
        return "Digit0";
      case "1":
      case "!":
        return "Digit1";
      case "2":
      case "@":
        return "Digit2";
      case "3":
      case "#":
        return "Digit3";
      case "4":
      case "$":
        return "Digit4";
      case "5":
      case "%":
        return "Digit5";
      case "6":
      case "^":
        return "Digit6";
      case "7":
      case "&":
        return "Digit7";
      case "8":
      case "*":
        return "Digit8";
      case "9":
      case "(":
        return "Digit9";
      case "=":
      case "+":
        return "Equal";
      // The spec declares the '<' to be `IntlBackslash` as well, but it is already covered
      // in the `Comma` above.
      case ">":
        return "IntlBackslash";
      case "a":
      case "A":
        return "KeyA";
      case "b":
      case "B":
        return "KeyB";
      case "c":
      case "C":
        return "KeyC";
      case "d":
      case "D":
        return "KeyD";
      case "e":
      case "E":
        return "KeyE";
      case "f":
      case "F":
        return "KeyF";
      case "g":
      case "G":
        return "KeyG";
      case "h":
      case "H":
        return "KeyH";
      case "i":
      case "I":
        return "KeyI";
      case "j":
      case "J":
        return "KeyJ";
      case "k":
      case "K":
        return "KeyK";
      case "l":
      case "L":
        return "KeyL";
      case "m":
      case "M":
        return "KeyM";
      case "n":
      case "N":
        return "KeyN";
      case "o":
      case "O":
        return "KeyO";
      case "p":
      case "P":
        return "KeyP";
      case "q":
      case "Q":
        return "KeyQ";
      case "r":
      case "R":
        return "KeyR";
      case "s":
      case "S":
        return "KeyS";
      case "t":
      case "T":
        return "KeyT";
      case "u":
      case "U":
        return "KeyU";
      case "v":
      case "V":
        return "KeyV";
      case "w":
      case "W":
        return "KeyW";
      case "x":
      case "X":
        return "KeyX";
      case "y":
      case "Y":
        return "KeyY";
      case "z":
      case "Z":
        return "KeyZ";
      case "-":
      case "_":
        return "Minus";
      case ".":
        return "Period";
      case "'":
      case '"':
        return "Quote";
      case ";":
      case ":":
        return "Semicolon";
      case "/":
      case "?":
        return "Slash";
      case "":
        return "AltLeft";
      case "":
        return "AltRight";
      case "":
        return "ControlLeft";
      case "":
        return "ControlRight";
      case "":
        return "Enter";
      case "":
        return "Pause";
      case "":
        return "MetaLeft";
      case "":
        return "MetaRight";
      case "":
        return "ShiftLeft";
      case "":
        return "ShiftRight";
      case " ":
      case "":
        return "Space";
      case "":
        return "Tab";
      case "":
        return "Delete";
      case "":
        return "End";
      case "":
        return "Help";
      case "":
        return "Home";
      case "":
        return "Insert";
      case "":
        return "PageDown";
      case "":
        return "PageUp";
      case "":
        return "ArrowDown";
      case "":
        return "ArrowLeft";
      case "":
        return "ArrowRight";
      case "":
        return "ArrowUp";
      case "":
        return "Escape";
      case "":
        return "F1";
      case "":
        return "F2";
      case "":
        return "F3";
      case "":
        return "F4";
      case "":
        return "F5";
      case "":
        return "F6";
      case "":
        return "F7";
      case "":
        return "F8";
      case "":
        return "F9";
      case "":
        return "F10";
      case "":
        return "F11";
      case "":
        return "F12";
      case "":
        return "NumpadEqual";
      case "":
      case "":
        return "Numpad0";
      case "":
      case "":
        return "Numpad1";
      case "":
      case "":
        return "Numpad2";
      case "":
      case "":
        return "Numpad3";
      case "":
      case "":
        return "Numpad4";
      case "":
        return "Numpad5";
      case "":
      case "":
        return "Numpad6";
      case "":
      case "":
        return "Numpad7";
      case "":
      case "":
        return "Numpad8";
      case "":
      case "":
        return "Numpad9";
      case "":
        return "NumpadAdd";
      case "":
        return "NumpadComma";
      case "":
      case "":
        return "NumpadDecimal";
      case "":
        return "NumpadDivide";
      case "":
        return "NumpadEnter";
      case "":
        return "NumpadMultiply";
      case "":
        return "NumpadSubtract";
      default:
        return;
    }
  }
  function getKeyLocation(key) {
    switch (key) {
      case "":
      case "":
      case "":
      case "":
      case "":
        return 1;
      case "":
      case "":
      case "":
      case "":
      case "":
      case "":
      case "":
      case "":
      case "":
      case "":
      case "":
      case "":
      case "":
      case "":
      case "":
      case "":
      case "":
      case "":
      case "":
      case "":
      case "":
      case "":
      case "":
      case "":
      case "":
      case "":
      case "":
        return 3;
      case "":
      case "":
      case "":
      case "":
        return 2;
      default:
        return 0;
    }
  }
  return keyUtils;
}
var USKeyboardLayout = {};
var hasRequiredUSKeyboardLayout;
function requireUSKeyboardLayout() {
  if (hasRequiredUSKeyboardLayout) return USKeyboardLayout;
  hasRequiredUSKeyboardLayout = 1;
  Object.defineProperty(USKeyboardLayout, "__esModule", { value: true });
  USKeyboardLayout.KeyToKeyCode = void 0;
  USKeyboardLayout.KeyToKeyCode = {
    "0": 48,
    "1": 49,
    "2": 50,
    "3": 51,
    "4": 52,
    "5": 53,
    "6": 54,
    "7": 55,
    "8": 56,
    "9": 57,
    Abort: 3,
    Help: 6,
    Backspace: 8,
    Tab: 9,
    Numpad5: 12,
    NumpadEnter: 13,
    Enter: 13,
    "\\r": 13,
    "\\n": 13,
    ShiftLeft: 16,
    ShiftRight: 16,
    ControlLeft: 17,
    ControlRight: 17,
    AltLeft: 18,
    AltRight: 18,
    Pause: 19,
    CapsLock: 20,
    Escape: 27,
    Convert: 28,
    NonConvert: 29,
    Space: 32,
    Numpad9: 33,
    PageUp: 33,
    Numpad3: 34,
    PageDown: 34,
    End: 35,
    Numpad1: 35,
    Home: 36,
    Numpad7: 36,
    ArrowLeft: 37,
    Numpad4: 37,
    Numpad8: 38,
    ArrowUp: 38,
    ArrowRight: 39,
    Numpad6: 39,
    Numpad2: 40,
    ArrowDown: 40,
    Select: 41,
    Open: 43,
    PrintScreen: 44,
    Insert: 45,
    Numpad0: 45,
    Delete: 46,
    NumpadDecimal: 46,
    Digit0: 48,
    Digit1: 49,
    Digit2: 50,
    Digit3: 51,
    Digit4: 52,
    Digit5: 53,
    Digit6: 54,
    Digit7: 55,
    Digit8: 56,
    Digit9: 57,
    KeyA: 65,
    KeyB: 66,
    KeyC: 67,
    KeyD: 68,
    KeyE: 69,
    KeyF: 70,
    KeyG: 71,
    KeyH: 72,
    KeyI: 73,
    KeyJ: 74,
    KeyK: 75,
    KeyL: 76,
    KeyM: 77,
    KeyN: 78,
    KeyO: 79,
    KeyP: 80,
    KeyQ: 81,
    KeyR: 82,
    KeyS: 83,
    KeyT: 84,
    KeyU: 85,
    KeyV: 86,
    KeyW: 87,
    KeyX: 88,
    KeyY: 89,
    KeyZ: 90,
    MetaLeft: 91,
    MetaRight: 92,
    ContextMenu: 93,
    NumpadMultiply: 106,
    NumpadAdd: 107,
    NumpadSubtract: 109,
    NumpadDivide: 111,
    F1: 112,
    F2: 113,
    F3: 114,
    F4: 115,
    F5: 116,
    F6: 117,
    F7: 118,
    F8: 119,
    F9: 120,
    F10: 121,
    F11: 122,
    F12: 123,
    F13: 124,
    F14: 125,
    F15: 126,
    F16: 127,
    F17: 128,
    F18: 129,
    F19: 130,
    F20: 131,
    F21: 132,
    F22: 133,
    F23: 134,
    F24: 135,
    NumLock: 144,
    ScrollLock: 145,
    AudioVolumeMute: 173,
    AudioVolumeDown: 174,
    AudioVolumeUp: 175,
    MediaTrackNext: 176,
    MediaTrackPrevious: 177,
    MediaStop: 178,
    MediaPlayPause: 179,
    Semicolon: 186,
    Equal: 187,
    NumpadEqual: 187,
    Comma: 188,
    Minus: 189,
    Period: 190,
    Slash: 191,
    Backquote: 192,
    BracketLeft: 219,
    Backslash: 220,
    BracketRight: 221,
    Quote: 222,
    AltGraph: 225,
    Props: 247,
    Cancel: 3,
    Clear: 12,
    Shift: 16,
    Control: 17,
    Alt: 18,
    Accept: 30,
    ModeChange: 31,
    " ": 32,
    Print: 42,
    Execute: 43,
    "\\u0000": 46,
    a: 65,
    b: 66,
    c: 67,
    d: 68,
    e: 69,
    f: 70,
    g: 71,
    h: 72,
    i: 73,
    j: 74,
    k: 75,
    l: 76,
    m: 77,
    n: 78,
    o: 79,
    p: 80,
    q: 81,
    r: 82,
    s: 83,
    t: 84,
    u: 85,
    v: 86,
    w: 87,
    x: 88,
    y: 89,
    z: 90,
    Meta: 91,
    "*": 106,
    "+": 107,
    "-": 109,
    "/": 111,
    ";": 186,
    "=": 187,
    ",": 188,
    ".": 190,
    "`": 192,
    "[": 219,
    "\\\\": 220,
    "]": 221,
    "'": 222,
    Attn: 246,
    CrSel: 247,
    ExSel: 248,
    EraseEof: 249,
    Play: 250,
    ZoomOut: 251,
    ")": 48,
    "!": 49,
    "@": 50,
    "#": 51,
    $: 52,
    "%": 53,
    "^": 54,
    "&": 55,
    "(": 57,
    A: 65,
    B: 66,
    C: 67,
    D: 68,
    E: 69,
    F: 70,
    G: 71,
    H: 72,
    I: 73,
    J: 74,
    K: 75,
    L: 76,
    M: 77,
    N: 78,
    O: 79,
    P: 80,
    Q: 81,
    R: 82,
    S: 83,
    T: 84,
    U: 85,
    V: 86,
    W: 87,
    X: 88,
    Y: 89,
    Z: 90,
    ":": 186,
    "<": 188,
    _: 189,
    ">": 190,
    "?": 191,
    "~": 192,
    "{": 219,
    "|": 220,
    "}": 221,
    '"': 222,
    Camera: 44,
    EndCall: 95,
    VolumeDown: 182,
    VolumeUp: 183
  };
  return USKeyboardLayout;
}
var hasRequiredActionDispatcher;
function requireActionDispatcher() {
  if (hasRequiredActionDispatcher) return ActionDispatcher;
  hasRequiredActionDispatcher = 1;
  Object.defineProperty(ActionDispatcher, "__esModule", { value: true });
  ActionDispatcher.ActionDispatcher = void 0;
  const protocol_js_1 = requireProtocol();
  const assert_js_1 = requireAssert();
  const graphemeTools_js_1 = requireGraphemeTools();
  const InputSource_js_1 = requireInputSource();
  const keyUtils_js_1 = requireKeyUtils();
  const USKeyboardLayout_js_1 = requireUSKeyboardLayout();
  const CALCULATE_IN_VIEW_CENTER_PT_DECL = ((i) => {
    const t = i.getClientRects()[0], e = Math.max(0, Math.min(t.x, t.x + t.width)), n = Math.min(window.innerWidth, Math.max(t.x, t.x + t.width)), h = Math.max(0, Math.min(t.y, t.y + t.height)), m = Math.min(window.innerHeight, Math.max(t.y, t.y + t.height));
    return [e + (n - e >> 1), h + (m - h >> 1)];
  }).toString();
  const IS_MAC_DECL = (() => {
    return navigator.platform.toLowerCase().includes("mac");
  }).toString();
  async function getElementCenter(context, element) {
    const hiddenSandboxRealm = await context.getOrCreateHiddenSandbox();
    const result = await hiddenSandboxRealm.callFunction(CALCULATE_IN_VIEW_CENTER_PT_DECL, false, { type: "undefined" }, [element]);
    if (result.type === "exception") {
      throw new protocol_js_1.NoSuchElementException(`Origin element ${element.sharedId} was not found`);
    }
    (0, assert_js_1.assert)(result.result.type === "array");
    (0, assert_js_1.assert)(result.result.value?.[0]?.type === "number");
    (0, assert_js_1.assert)(result.result.value?.[1]?.type === "number");
    const { result: { value: [{ value: x }, { value: y }] } } = result;
    return { x, y };
  }
  let ActionDispatcher$1 = class ActionDispatcher {
    static isMacOS = async (context) => {
      const hiddenSandboxRealm = await context.getOrCreateHiddenSandbox();
      const result = await hiddenSandboxRealm.callFunction(IS_MAC_DECL, false);
      (0, assert_js_1.assert)(result.type !== "exception");
      (0, assert_js_1.assert)(result.result.type === "boolean");
      return result.result.value;
    };
    #browsingContextStorage;
    #tickStart = 0;
    #tickDuration = 0;
    #inputState;
    #contextId;
    #isMacOS;
    constructor(inputState, browsingContextStorage, contextId, isMacOS) {
      this.#browsingContextStorage = browsingContextStorage;
      this.#inputState = inputState;
      this.#contextId = contextId;
      this.#isMacOS = isMacOS;
    }
    /**
     * The context can be disposed between action ticks, so need to get it each time.
     */
    get #context() {
      return this.#browsingContextStorage.getContext(this.#contextId);
    }
    async dispatchActions(optionsByTick) {
      await this.#inputState.queue.run(async () => {
        for (const options of optionsByTick) {
          await this.dispatchTickActions(options);
        }
      });
    }
    async dispatchTickActions(options) {
      this.#tickStart = performance.now();
      this.#tickDuration = 0;
      for (const { action } of options) {
        if ("duration" in action && action.duration !== void 0) {
          this.#tickDuration = Math.max(this.#tickDuration, action.duration);
        }
      }
      const promises = [
        new Promise((resolve) => setTimeout(resolve, this.#tickDuration))
      ];
      for (const option of options) {
        promises.push(this.#dispatchAction(option));
      }
      await Promise.all(promises);
    }
    async #dispatchAction({ id, action }) {
      const source = this.#inputState.get(id);
      const keyState = this.#inputState.getGlobalKeyState();
      switch (action.type) {
        case "keyDown": {
          await this.#dispatchKeyDownAction(source, action);
          this.#inputState.cancelList.push({
            id,
            action: {
              ...action,
              type: "keyUp"
            }
          });
          break;
        }
        case "keyUp": {
          await this.#dispatchKeyUpAction(source, action);
          break;
        }
        case "pause": {
          break;
        }
        case "pointerDown": {
          await this.#dispatchPointerDownAction(source, keyState, action);
          this.#inputState.cancelList.push({
            id,
            action: {
              ...action,
              type: "pointerUp"
            }
          });
          break;
        }
        case "pointerMove": {
          await this.#dispatchPointerMoveAction(source, keyState, action);
          break;
        }
        case "pointerUp": {
          await this.#dispatchPointerUpAction(source, keyState, action);
          break;
        }
        case "scroll": {
          await this.#dispatchScrollAction(source, keyState, action);
          break;
        }
      }
    }
    async #dispatchPointerDownAction(source, keyState, action) {
      const { button } = action;
      if (source.pressed.has(button)) {
        return;
      }
      source.pressed.add(button);
      const { x, y, subtype: pointerType } = source;
      const { width, height, pressure, twist, tangentialPressure } = action;
      const { tiltX, tiltY } = getTilt(action);
      const { modifiers } = keyState;
      const { radiusX, radiusY } = getRadii(width ?? 1, height ?? 1);
      switch (pointerType) {
        case "mouse":
        case "pen":
          await this.#context.cdpTarget.cdpClient.sendCommand("Input.dispatchMouseEvent", {
            type: "mousePressed",
            x,
            y,
            modifiers,
            button: getCdpButton(button),
            buttons: source.buttons,
            clickCount: source.setClickCount(button, new InputSource_js_1.PointerSource.ClickContext(x, y, performance.now())),
            pointerType,
            tangentialPressure,
            tiltX,
            tiltY,
            twist,
            force: pressure
          });
          break;
        case "touch":
          await this.#context.cdpTarget.cdpClient.sendCommand("Input.dispatchTouchEvent", {
            type: "touchStart",
            touchPoints: [
              {
                x,
                y,
                radiusX,
                radiusY,
                tangentialPressure,
                tiltX,
                tiltY,
                twist,
                force: pressure,
                id: source.pointerId
              }
            ],
            modifiers
          });
          break;
      }
      source.radiusX = radiusX;
      source.radiusY = radiusY;
      source.force = pressure;
    }
    #dispatchPointerUpAction(source, keyState, action) {
      const { button } = action;
      if (!source.pressed.has(button)) {
        return;
      }
      source.pressed.delete(button);
      const { x, y, force, radiusX, radiusY, subtype: pointerType } = source;
      const { modifiers } = keyState;
      switch (pointerType) {
        case "mouse":
        case "pen":
          return this.#context.cdpTarget.cdpClient.sendCommand("Input.dispatchMouseEvent", {
            type: "mouseReleased",
            x,
            y,
            modifiers,
            button: getCdpButton(button),
            buttons: source.buttons,
            clickCount: source.getClickCount(button),
            pointerType
          });
        case "touch":
          return this.#context.cdpTarget.cdpClient.sendCommand("Input.dispatchTouchEvent", {
            type: "touchEnd",
            touchPoints: [
              {
                x,
                y,
                id: source.pointerId,
                force,
                radiusX,
                radiusY
              }
            ],
            modifiers
          });
      }
    }
    async #dispatchPointerMoveAction(source, keyState, action) {
      const { x: startX, y: startY, subtype: pointerType } = source;
      const { width, height, pressure, twist, tangentialPressure, x: offsetX, y: offsetY, origin = "viewport", duration = this.#tickDuration } = action;
      const { tiltX, tiltY } = getTilt(action);
      const { radiusX, radiusY } = getRadii(width ?? 1, height ?? 1);
      const { targetX, targetY } = await this.#getCoordinateFromOrigin(origin, offsetX, offsetY, startX, startY);
      if (targetX < 0 || targetY < 0) {
        throw new protocol_js_1.MoveTargetOutOfBoundsException(`Cannot move beyond viewport (x: ${targetX}, y: ${targetY})`);
      }
      let last;
      do {
        const ratio = duration > 0 ? (performance.now() - this.#tickStart) / duration : 1;
        last = ratio >= 1;
        let x;
        let y;
        if (last) {
          x = targetX;
          y = targetY;
        } else {
          x = Math.round(ratio * (targetX - startX) + startX);
          y = Math.round(ratio * (targetY - startY) + startY);
        }
        if (source.x !== x || source.y !== y) {
          const { modifiers } = keyState;
          switch (pointerType) {
            case "mouse":
              await this.#context.cdpTarget.cdpClient.sendCommand("Input.dispatchMouseEvent", {
                type: "mouseMoved",
                x,
                y,
                modifiers,
                clickCount: 0,
                button: getCdpButton(source.pressed.values().next().value ?? 5),
                buttons: source.buttons,
                pointerType,
                tangentialPressure,
                tiltX,
                tiltY,
                twist,
                force: pressure
              });
              break;
            case "pen":
              if (source.pressed.size !== 0) {
                await this.#context.cdpTarget.cdpClient.sendCommand("Input.dispatchMouseEvent", {
                  type: "mouseMoved",
                  x,
                  y,
                  modifiers,
                  clickCount: 0,
                  button: getCdpButton(source.pressed.values().next().value ?? 5),
                  buttons: source.buttons,
                  pointerType,
                  tangentialPressure,
                  tiltX,
                  tiltY,
                  twist,
                  force: pressure ?? 0.5
                });
              }
              break;
            case "touch":
              if (source.pressed.size !== 0) {
                await this.#context.cdpTarget.cdpClient.sendCommand("Input.dispatchTouchEvent", {
                  type: "touchMove",
                  touchPoints: [
                    {
                      x,
                      y,
                      radiusX,
                      radiusY,
                      tangentialPressure,
                      tiltX,
                      tiltY,
                      twist,
                      force: pressure,
                      id: source.pointerId
                    }
                  ],
                  modifiers
                });
              }
              break;
          }
          source.x = x;
          source.y = y;
          source.radiusX = radiusX;
          source.radiusY = radiusY;
          source.force = pressure;
        }
      } while (!last);
    }
    async #getFrameOffset() {
      if (this.#context.id === this.#context.cdpTarget.id) {
        return { x: 0, y: 0 };
      }
      const { backendNodeId } = await this.#context.cdpTarget.cdpClient.sendCommand("DOM.getFrameOwner", { frameId: this.#context.id });
      const { model: frameBoxModel } = await this.#context.cdpTarget.cdpClient.sendCommand("DOM.getBoxModel", {
        backendNodeId
      });
      return { x: frameBoxModel.content[0], y: frameBoxModel.content[1] };
    }
    async #getCoordinateFromOrigin(origin, offsetX, offsetY, startX, startY) {
      let targetX;
      let targetY;
      const frameOffset = await this.#getFrameOffset();
      switch (origin) {
        case "viewport":
          targetX = offsetX + frameOffset.x;
          targetY = offsetY + frameOffset.y;
          break;
        case "pointer":
          targetX = startX + offsetX + frameOffset.x;
          targetY = startY + offsetY + frameOffset.y;
          break;
        default: {
          const { x: posX, y: posY } = await getElementCenter(this.#context, origin.element);
          targetX = posX + offsetX + frameOffset.x;
          targetY = posY + offsetY + frameOffset.y;
          break;
        }
      }
      return { targetX, targetY };
    }
    async #dispatchScrollAction(_source, keyState, action) {
      const { deltaX: targetDeltaX, deltaY: targetDeltaY, x: offsetX, y: offsetY, origin = "viewport", duration = this.#tickDuration } = action;
      if (origin === "pointer") {
        throw new protocol_js_1.InvalidArgumentException('"pointer" origin is invalid for scrolling.');
      }
      const { targetX, targetY } = await this.#getCoordinateFromOrigin(origin, offsetX, offsetY, 0, 0);
      if (targetX < 0 || targetY < 0) {
        throw new protocol_js_1.MoveTargetOutOfBoundsException(`Cannot move beyond viewport (x: ${targetX}, y: ${targetY})`);
      }
      let currentDeltaX = 0;
      let currentDeltaY = 0;
      let last;
      do {
        const ratio = duration > 0 ? (performance.now() - this.#tickStart) / duration : 1;
        last = ratio >= 1;
        let deltaX;
        let deltaY;
        if (last) {
          deltaX = targetDeltaX - currentDeltaX;
          deltaY = targetDeltaY - currentDeltaY;
        } else {
          deltaX = Math.round(ratio * targetDeltaX - currentDeltaX);
          deltaY = Math.round(ratio * targetDeltaY - currentDeltaY);
        }
        if (deltaX !== 0 || deltaY !== 0) {
          const { modifiers } = keyState;
          await this.#context.cdpTarget.cdpClient.sendCommand("Input.dispatchMouseEvent", {
            type: "mouseWheel",
            deltaX,
            deltaY,
            x: targetX,
            y: targetY,
            modifiers
          });
          currentDeltaX += deltaX;
          currentDeltaY += deltaY;
        }
      } while (!last);
    }
    async #dispatchKeyDownAction(source, action) {
      const rawKey = action.value;
      if (!(0, graphemeTools_js_1.isSingleGrapheme)(rawKey)) {
        throw new protocol_js_1.InvalidArgumentException(`Invalid key value: ${rawKey}`);
      }
      const isGrapheme = (0, graphemeTools_js_1.isSingleComplexGrapheme)(rawKey);
      const key = (0, keyUtils_js_1.getNormalizedKey)(rawKey);
      const repeat = source.pressed.has(key);
      const code = (0, keyUtils_js_1.getKeyCode)(rawKey);
      const location = (0, keyUtils_js_1.getKeyLocation)(rawKey);
      switch (key) {
        case "Alt":
          source.alt = true;
          break;
        case "Shift":
          source.shift = true;
          break;
        case "Control":
          source.ctrl = true;
          break;
        case "Meta":
          source.meta = true;
          break;
      }
      source.pressed.add(key);
      const { modifiers } = source;
      const unmodifiedText = getKeyEventUnmodifiedText(key, source, isGrapheme);
      const text = getKeyEventText(code ?? "", source) ?? unmodifiedText;
      let command;
      if (this.#isMacOS && source.meta) {
        switch (code) {
          case "KeyA":
            command = "SelectAll";
            break;
          case "KeyC":
            command = "Copy";
            break;
          case "KeyV":
            command = source.shift ? "PasteAndMatchStyle" : "Paste";
            break;
          case "KeyX":
            command = "Cut";
            break;
          case "KeyZ":
            command = source.shift ? "Redo" : "Undo";
            break;
        }
      }
      const promises = [
        this.#context.cdpTarget.cdpClient.sendCommand("Input.dispatchKeyEvent", {
          type: text ? "keyDown" : "rawKeyDown",
          windowsVirtualKeyCode: USKeyboardLayout_js_1.KeyToKeyCode[key],
          key,
          code,
          text,
          unmodifiedText,
          autoRepeat: repeat,
          isSystemKey: source.alt || void 0,
          location: location < 3 ? location : void 0,
          isKeypad: location === 3,
          modifiers,
          commands: command ? [command] : void 0
        })
      ];
      if (key === "Escape") {
        if (!source.alt && (this.#isMacOS && !source.ctrl && !source.meta || !this.#isMacOS)) {
          promises.push(this.#context.cdpTarget.cdpClient.sendCommand("Input.cancelDragging"));
        }
      }
      await Promise.all(promises);
    }
    #dispatchKeyUpAction(source, action) {
      const rawKey = action.value;
      if (!(0, graphemeTools_js_1.isSingleGrapheme)(rawKey)) {
        throw new protocol_js_1.InvalidArgumentException(`Invalid key value: ${rawKey}`);
      }
      const isGrapheme = (0, graphemeTools_js_1.isSingleComplexGrapheme)(rawKey);
      const key = (0, keyUtils_js_1.getNormalizedKey)(rawKey);
      if (!source.pressed.has(key)) {
        return;
      }
      const code = (0, keyUtils_js_1.getKeyCode)(rawKey);
      const location = (0, keyUtils_js_1.getKeyLocation)(rawKey);
      switch (key) {
        case "Alt":
          source.alt = false;
          break;
        case "Shift":
          source.shift = false;
          break;
        case "Control":
          source.ctrl = false;
          break;
        case "Meta":
          source.meta = false;
          break;
      }
      source.pressed.delete(key);
      const { modifiers } = source;
      const unmodifiedText = getKeyEventUnmodifiedText(key, source, isGrapheme);
      const text = getKeyEventText(code ?? "", source) ?? unmodifiedText;
      return this.#context.cdpTarget.cdpClient.sendCommand("Input.dispatchKeyEvent", {
        type: "keyUp",
        windowsVirtualKeyCode: USKeyboardLayout_js_1.KeyToKeyCode[key],
        key,
        code,
        text,
        unmodifiedText,
        location: location < 3 ? location : void 0,
        isSystemKey: source.alt || void 0,
        isKeypad: location === 3,
        modifiers
      });
    }
  };
  ActionDispatcher.ActionDispatcher = ActionDispatcher$1;
  const getKeyEventUnmodifiedText = (key, source, isGrapheme) => {
    if (isGrapheme) {
      return key;
    }
    if (key === "Enter") {
      return "\r";
    }
    return [...key].length === 1 ? source.shift ? key.toLocaleUpperCase("en-US") : key : void 0;
  };
  const getKeyEventText = (code, source) => {
    if (source.ctrl) {
      switch (code) {
        case "Digit2":
          if (source.shift) {
            return "\0";
          }
          break;
        case "KeyA":
          return "";
        case "KeyB":
          return "";
        case "KeyC":
          return "";
        case "KeyD":
          return "";
        case "KeyE":
          return "";
        case "KeyF":
          return "";
        case "KeyG":
          return "\x07";
        case "KeyH":
          return "\b";
        case "KeyI":
          return "	";
        case "KeyJ":
          return "\n";
        case "KeyK":
          return "\v";
        case "KeyL":
          return "\f";
        case "KeyM":
          return "\r";
        case "KeyN":
          return "";
        case "KeyO":
          return "";
        case "KeyP":
          return "";
        case "KeyQ":
          return "";
        case "KeyR":
          return "";
        case "KeyS":
          return "";
        case "KeyT":
          return "";
        case "KeyU":
          return "";
        case "KeyV":
          return "";
        case "KeyW":
          return "";
        case "KeyX":
          return "";
        case "KeyY":
          return "";
        case "KeyZ":
          return "";
        case "BracketLeft":
          return "\x1B";
        case "Backslash":
          return "";
        case "BracketRight":
          return "";
        case "Digit6":
          if (source.shift) {
            return "";
          }
          break;
        case "Minus":
          return "";
      }
      return "";
    }
    if (source.alt) {
      return "";
    }
    return;
  };
  function getCdpButton(button) {
    switch (button) {
      case 0:
        return "left";
      case 1:
        return "middle";
      case 2:
        return "right";
      case 3:
        return "back";
      case 4:
        return "forward";
      default:
        return "none";
    }
  }
  function getTilt(action) {
    const altitudeAngle = action.altitudeAngle ?? Math.PI / 2;
    const azimuthAngle = action.azimuthAngle ?? 0;
    let tiltXRadians = 0;
    let tiltYRadians = 0;
    if (altitudeAngle === 0) {
      if (azimuthAngle === 0 || azimuthAngle === 2 * Math.PI) {
        tiltXRadians = Math.PI / 2;
      }
      if (azimuthAngle === Math.PI / 2) {
        tiltYRadians = Math.PI / 2;
      }
      if (azimuthAngle === Math.PI) {
        tiltXRadians = -Math.PI / 2;
      }
      if (azimuthAngle === 3 * Math.PI / 2) {
        tiltYRadians = -Math.PI / 2;
      }
      if (azimuthAngle > 0 && azimuthAngle < Math.PI / 2) {
        tiltXRadians = Math.PI / 2;
        tiltYRadians = Math.PI / 2;
      }
      if (azimuthAngle > Math.PI / 2 && azimuthAngle < Math.PI) {
        tiltXRadians = -Math.PI / 2;
        tiltYRadians = Math.PI / 2;
      }
      if (azimuthAngle > Math.PI && azimuthAngle < 3 * Math.PI / 2) {
        tiltXRadians = -Math.PI / 2;
        tiltYRadians = -Math.PI / 2;
      }
      if (azimuthAngle > 3 * Math.PI / 2 && azimuthAngle < 2 * Math.PI) {
        tiltXRadians = Math.PI / 2;
        tiltYRadians = -Math.PI / 2;
      }
    }
    if (altitudeAngle !== 0) {
      const tanAlt = Math.tan(altitudeAngle);
      tiltXRadians = Math.atan(Math.cos(azimuthAngle) / tanAlt);
      tiltYRadians = Math.atan(Math.sin(azimuthAngle) / tanAlt);
    }
    const factor = 180 / Math.PI;
    return {
      tiltX: Math.round(tiltXRadians * factor),
      tiltY: Math.round(tiltYRadians * factor)
    };
  }
  function getRadii(width, height) {
    return {
      radiusX: width ? width / 2 : 0.5,
      radiusY: height ? height / 2 : 0.5
    };
  }
  return ActionDispatcher;
}
var InputStateManager = {};
var InputState = {};
var Mutex = {};
var hasRequiredMutex;
function requireMutex() {
  if (hasRequiredMutex) return Mutex;
  hasRequiredMutex = 1;
  Object.defineProperty(Mutex, "__esModule", { value: true });
  Mutex.Mutex = void 0;
  let Mutex$1 = class Mutex {
    #locked = false;
    #acquirers = [];
    // This is FIFO.
    acquire() {
      const state = { resolved: false };
      if (this.#locked) {
        return new Promise((resolve) => {
          this.#acquirers.push(() => resolve(this.#release.bind(this, state)));
        });
      }
      this.#locked = true;
      return Promise.resolve(this.#release.bind(this, state));
    }
    #release(state) {
      if (state.resolved) {
        throw new Error("Cannot release more than once.");
      }
      state.resolved = true;
      const resolve = this.#acquirers.shift();
      if (!resolve) {
        this.#locked = false;
        return;
      }
      resolve();
    }
    async run(action) {
      const release = await this.acquire();
      try {
        const result = await action();
        return result;
      } finally {
        release();
      }
    }
  };
  Mutex.Mutex = Mutex$1;
  return Mutex;
}
var hasRequiredInputState;
function requireInputState() {
  if (hasRequiredInputState) return InputState;
  hasRequiredInputState = 1;
  Object.defineProperty(InputState, "__esModule", { value: true });
  InputState.InputState = void 0;
  const protocol_js_1 = requireProtocol();
  const Mutex_js_1 = requireMutex();
  const InputSource_js_1 = requireInputSource();
  let InputState$1 = class InputState {
    cancelList = [];
    #sources = /* @__PURE__ */ new Map();
    #mutex = new Mutex_js_1.Mutex();
    getOrCreate(id, type, subtype) {
      let source = this.#sources.get(id);
      if (!source) {
        switch (type) {
          case "none":
            source = new InputSource_js_1.NoneSource();
            break;
          case "key":
            source = new InputSource_js_1.KeySource();
            break;
          case "pointer": {
            let pointerId = subtype === "mouse" ? 0 : 2;
            const pointerIds = /* @__PURE__ */ new Set();
            for (const [, source2] of this.#sources) {
              if (source2.type === "pointer") {
                pointerIds.add(source2.pointerId);
              }
            }
            while (pointerIds.has(pointerId)) {
              ++pointerId;
            }
            source = new InputSource_js_1.PointerSource(pointerId, subtype);
            break;
          }
          case "wheel":
            source = new InputSource_js_1.WheelSource();
            break;
          default:
            throw new protocol_js_1.InvalidArgumentException(`Expected "${"none"}", "${"key"}", "${"pointer"}", or "${"wheel"}". Found unknown source type ${type}.`);
        }
        this.#sources.set(id, source);
        return source;
      }
      if (source.type !== type) {
        throw new protocol_js_1.InvalidArgumentException(`Input source type of ${id} is ${source.type}, but received ${type}.`);
      }
      return source;
    }
    get(id) {
      const source = this.#sources.get(id);
      if (!source) {
        throw new protocol_js_1.UnknownErrorException(`Internal error.`);
      }
      return source;
    }
    getGlobalKeyState() {
      const state = new InputSource_js_1.KeySource();
      for (const [, source] of this.#sources) {
        if (source.type !== "key") {
          continue;
        }
        for (const pressed of source.pressed) {
          state.pressed.add(pressed);
        }
        state.alt ||= source.alt;
        state.ctrl ||= source.ctrl;
        state.meta ||= source.meta;
        state.shift ||= source.shift;
      }
      return state;
    }
    get queue() {
      return this.#mutex;
    }
  };
  InputState.InputState = InputState$1;
  return InputState;
}
var hasRequiredInputStateManager;
function requireInputStateManager() {
  if (hasRequiredInputStateManager) return InputStateManager;
  hasRequiredInputStateManager = 1;
  Object.defineProperty(InputStateManager, "__esModule", { value: true });
  InputStateManager.InputStateManager = void 0;
  const assert_js_1 = requireAssert();
  const InputState_js_1 = requireInputState();
  let InputStateManager$1 = class InputStateManager extends WeakMap {
    get(context) {
      (0, assert_js_1.assert)(context.isTopLevelContext());
      if (!this.has(context)) {
        this.set(context, new InputState_js_1.InputState());
      }
      return super.get(context);
    }
  };
  InputStateManager.InputStateManager = InputStateManager$1;
  return InputStateManager;
}
var hasRequiredInputProcessor;
function requireInputProcessor() {
  if (hasRequiredInputProcessor) return InputProcessor;
  hasRequiredInputProcessor = 1;
  Object.defineProperty(InputProcessor, "__esModule", { value: true });
  InputProcessor.InputProcessor = void 0;
  const protocol_js_1 = requireProtocol();
  const assert_js_1 = requireAssert();
  const ActionDispatcher_js_1 = requireActionDispatcher();
  const InputStateManager_js_1 = requireInputStateManager();
  let InputProcessor$1 = class InputProcessor {
    #browsingContextStorage;
    #inputStateManager = new InputStateManager_js_1.InputStateManager();
    constructor(browsingContextStorage) {
      this.#browsingContextStorage = browsingContextStorage;
    }
    async performActions(params) {
      const context = this.#browsingContextStorage.getContext(params.context);
      const inputState = this.#inputStateManager.get(context.top);
      const actionsByTick = this.#getActionsByTick(params, inputState);
      const dispatcher = new ActionDispatcher_js_1.ActionDispatcher(inputState, this.#browsingContextStorage, params.context, await ActionDispatcher_js_1.ActionDispatcher.isMacOS(context).catch(() => false));
      await dispatcher.dispatchActions(actionsByTick);
      return {};
    }
    async releaseActions(params) {
      const context = this.#browsingContextStorage.getContext(params.context);
      const topContext = context.top;
      const inputState = this.#inputStateManager.get(topContext);
      const dispatcher = new ActionDispatcher_js_1.ActionDispatcher(inputState, this.#browsingContextStorage, params.context, await ActionDispatcher_js_1.ActionDispatcher.isMacOS(context).catch(() => false));
      await dispatcher.dispatchTickActions(inputState.cancelList.reverse());
      this.#inputStateManager.delete(topContext);
      return {};
    }
    async setFiles(params) {
      const context = this.#browsingContextStorage.getContext(params.context);
      const hiddenSandboxRealm = await context.getOrCreateHiddenSandbox();
      let result;
      try {
        result = await hiddenSandboxRealm.callFunction(String(function getFiles(fileListLength) {
          if (!(this instanceof HTMLInputElement)) {
            if (this instanceof Element) {
              return 1;
            }
            return 0;
          }
          if (this.type !== "file") {
            return 2;
          }
          if (this.disabled) {
            return 3;
          }
          if (fileListLength > 1 && !this.multiple) {
            return 4;
          }
          return;
        }), false, params.element, [{ type: "number", value: params.files.length }]);
      } catch {
        throw new protocol_js_1.NoSuchNodeException(`Could not find element ${params.element.sharedId}`);
      }
      (0, assert_js_1.assert)(result.type === "success");
      if (result.result.type === "number") {
        switch (result.result.value) {
          case 0: {
            throw new protocol_js_1.NoSuchElementException(`Could not find element ${params.element.sharedId}`);
          }
          case 1: {
            throw new protocol_js_1.UnableToSetFileInputException(`Element ${params.element.sharedId} is not a input`);
          }
          case 2: {
            throw new protocol_js_1.UnableToSetFileInputException(`Input element ${params.element.sharedId} is not a file type`);
          }
          case 3: {
            throw new protocol_js_1.UnableToSetFileInputException(`Input element ${params.element.sharedId} is disabled`);
          }
          case 4: {
            throw new protocol_js_1.UnableToSetFileInputException(`Cannot set multiple files on a non-multiple input element`);
          }
        }
      }
      if (params.files.length === 0) {
        await hiddenSandboxRealm.callFunction(String(function dispatchEvent() {
          if (this.files?.length === 0) {
            this.dispatchEvent(new Event("cancel", {
              bubbles: true
            }));
            return;
          }
          this.files = new DataTransfer().files;
          this.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
          this.dispatchEvent(new Event("change", { bubbles: true }));
        }), false, params.element);
        return {};
      }
      const paths = [];
      for (let i = 0; i < params.files.length; ++i) {
        const result2 = await hiddenSandboxRealm.callFunction(
          String(function getFiles(index) {
            return this.files?.item(index);
          }),
          false,
          params.element,
          [{ type: "number", value: 0 }],
          "root"
          /* Script.ResultOwnership.Root */
        );
        (0, assert_js_1.assert)(result2.type === "success");
        if (result2.result.type !== "object") {
          break;
        }
        const { handle } = result2.result;
        (0, assert_js_1.assert)(handle !== void 0);
        const { path } = await hiddenSandboxRealm.cdpClient.sendCommand("DOM.getFileInfo", {
          objectId: handle
        });
        paths.push(path);
        void hiddenSandboxRealm.disown(handle).catch(void 0);
      }
      paths.sort();
      const sortedFiles = [...params.files].sort();
      if (paths.length !== params.files.length || sortedFiles.some((path, index) => {
        return paths[index] !== path;
      })) {
        const { objectId } = await hiddenSandboxRealm.deserializeForCdp(params.element);
        (0, assert_js_1.assert)(objectId !== void 0);
        await hiddenSandboxRealm.cdpClient.sendCommand("DOM.setFileInputFiles", {
          files: params.files,
          objectId
        });
      } else {
        await hiddenSandboxRealm.callFunction(String(function dispatchEvent() {
          this.dispatchEvent(new Event("cancel", {
            bubbles: true
          }));
        }), false, params.element);
      }
      return {};
    }
    #getActionsByTick(params, inputState) {
      const actionsByTick = [];
      for (const action of params.actions) {
        switch (action.type) {
          case "pointer": {
            action.parameters ??= {
              pointerType: "mouse"
              /* Input.PointerType.Mouse */
            };
            action.parameters.pointerType ??= "mouse";
            const source = inputState.getOrCreate(action.id, "pointer", action.parameters.pointerType);
            if (source.subtype !== action.parameters.pointerType) {
              throw new protocol_js_1.InvalidArgumentException(`Expected input source ${action.id} to be ${source.subtype}; got ${action.parameters.pointerType}.`);
            }
            source.resetClickCount();
            break;
          }
          default:
            inputState.getOrCreate(action.id, action.type);
        }
        const actions = action.actions.map((item) => ({
          id: action.id,
          action: item
        }));
        for (let i = 0; i < actions.length; i++) {
          if (actionsByTick.length === i) {
            actionsByTick.push([]);
          }
          actionsByTick[i].push(actions[i]);
        }
      }
      return actionsByTick;
    }
  };
  InputProcessor.InputProcessor = InputProcessor$1;
  return InputProcessor;
}
var NetworkProcessor = {};
var NetworkUtils = {};
var base64 = {};
var hasRequiredBase64;
function requireBase64() {
  if (hasRequiredBase64) return base64;
  hasRequiredBase64 = 1;
  Object.defineProperty(base64, "__esModule", { value: true });
  base64.base64ToString = base64ToString;
  function base64ToString(base64Str) {
    if ("atob" in globalThis) {
      return globalThis.atob(base64Str);
    }
    return Buffer.from(base64Str, "base64").toString("ascii");
  }
  return base64;
}
var hasRequiredNetworkUtils;
function requireNetworkUtils() {
  if (hasRequiredNetworkUtils) return NetworkUtils;
  hasRequiredNetworkUtils = 1;
  Object.defineProperty(NetworkUtils, "__esModule", { value: true });
  NetworkUtils.computeHeadersSize = computeHeadersSize;
  NetworkUtils.stringToBase64 = stringToBase64;
  NetworkUtils.bidiNetworkHeadersFromCdpNetworkHeaders = bidiNetworkHeadersFromCdpNetworkHeaders;
  NetworkUtils.bidiNetworkHeadersFromCdpNetworkHeadersEntries = bidiNetworkHeadersFromCdpNetworkHeadersEntries;
  NetworkUtils.cdpNetworkHeadersFromBidiNetworkHeaders = cdpNetworkHeadersFromBidiNetworkHeaders;
  NetworkUtils.bidiNetworkHeadersFromCdpFetchHeaders = bidiNetworkHeadersFromCdpFetchHeaders;
  NetworkUtils.cdpFetchHeadersFromBidiNetworkHeaders = cdpFetchHeadersFromBidiNetworkHeaders;
  NetworkUtils.networkHeaderFromCookieHeaders = networkHeaderFromCookieHeaders;
  NetworkUtils.cdpAuthChallengeResponseFromBidiAuthContinueWithAuthAction = cdpAuthChallengeResponseFromBidiAuthContinueWithAuthAction;
  NetworkUtils.cdpToBiDiCookie = cdpToBiDiCookie;
  NetworkUtils.deserializeByteValue = deserializeByteValue;
  NetworkUtils.bidiToCdpCookie = bidiToCdpCookie;
  NetworkUtils.sameSiteBiDiToCdp = sameSiteBiDiToCdp;
  NetworkUtils.isSpecialScheme = isSpecialScheme;
  NetworkUtils.matchUrlPattern = matchUrlPattern;
  NetworkUtils.bidiBodySizeFromCdpPostDataEntries = bidiBodySizeFromCdpPostDataEntries;
  NetworkUtils.getTiming = getTiming;
  const ErrorResponse_js_1 = requireErrorResponse();
  const base64_js_1 = requireBase64();
  function computeHeadersSize(headers) {
    const requestHeaders = headers.reduce((acc, header) => {
      return `${acc}${header.name}: ${header.value.value}\r
`;
    }, "");
    return new TextEncoder().encode(requestHeaders).length;
  }
  function stringToBase64(str) {
    return typedArrayToBase64(new TextEncoder().encode(str));
  }
  function typedArrayToBase64(typedArray) {
    const chunkSize = 65534;
    const chunks = [];
    for (let i = 0; i < typedArray.length; i += chunkSize) {
      const chunk = typedArray.subarray(i, i + chunkSize);
      chunks.push(String.fromCodePoint.apply(null, chunk));
    }
    const binaryString = chunks.join("");
    return btoa(binaryString);
  }
  function bidiNetworkHeadersFromCdpNetworkHeaders(headers) {
    if (!headers) {
      return [];
    }
    return Object.entries(headers).map(([name, value]) => ({
      name,
      value: {
        type: "string",
        value
      }
    }));
  }
  function bidiNetworkHeadersFromCdpNetworkHeadersEntries(headers) {
    if (!headers) {
      return [];
    }
    return headers.map(({ name, value }) => ({
      name,
      value: {
        type: "string",
        value
      }
    }));
  }
  function cdpNetworkHeadersFromBidiNetworkHeaders(headers) {
    if (headers === void 0) {
      return void 0;
    }
    return headers.reduce((result, header) => {
      result[header.name] = header.value.value;
      return result;
    }, {});
  }
  function bidiNetworkHeadersFromCdpFetchHeaders(headers) {
    if (!headers) {
      return [];
    }
    return headers.map(({ name, value }) => ({
      name,
      value: {
        type: "string",
        value
      }
    }));
  }
  function cdpFetchHeadersFromBidiNetworkHeaders(headers) {
    if (headers === void 0) {
      return void 0;
    }
    return headers.map(({ name, value }) => ({
      name,
      value: value.value
    }));
  }
  function networkHeaderFromCookieHeaders(headers) {
    if (headers === void 0) {
      return void 0;
    }
    const value = headers.reduce((acc, value2, index) => {
      if (index > 0) {
        acc += ";";
      }
      const cookieValue = value2.value.type === "base64" ? btoa(value2.value.value) : value2.value.value;
      acc += `${value2.name}=${cookieValue}`;
      return acc;
    }, "");
    return {
      name: "Cookie",
      value: {
        type: "string",
        value
      }
    };
  }
  function cdpAuthChallengeResponseFromBidiAuthContinueWithAuthAction(action) {
    switch (action) {
      case "default":
        return "Default";
      case "cancel":
        return "CancelAuth";
      case "provideCredentials":
        return "ProvideCredentials";
    }
  }
  function cdpToBiDiCookie(cookie) {
    const result = {
      name: cookie.name,
      value: { type: "string", value: cookie.value },
      domain: cookie.domain,
      path: cookie.path,
      size: cookie.size,
      httpOnly: cookie.httpOnly,
      secure: cookie.secure,
      sameSite: cookie.sameSite === void 0 ? "none" : sameSiteCdpToBiDi(cookie.sameSite),
      ...cookie.expires >= 0 ? { expiry: cookie.expires } : void 0
    };
    result[`goog:session`] = cookie.session;
    result[`goog:priority`] = cookie.priority;
    result[`goog:sameParty`] = cookie.sameParty;
    result[`goog:sourceScheme`] = cookie.sourceScheme;
    result[`goog:sourcePort`] = cookie.sourcePort;
    if (cookie.partitionKey !== void 0) {
      result[`goog:partitionKey`] = cookie.partitionKey;
    }
    if (cookie.partitionKeyOpaque !== void 0) {
      result[`goog:partitionKeyOpaque`] = cookie.partitionKeyOpaque;
    }
    return result;
  }
  function deserializeByteValue(value) {
    if (value.type === "base64") {
      return (0, base64_js_1.base64ToString)(value.value);
    }
    return value.value;
  }
  function bidiToCdpCookie(params, partitionKey) {
    const deserializedValue = deserializeByteValue(params.cookie.value);
    const result = {
      name: params.cookie.name,
      value: deserializedValue,
      domain: params.cookie.domain,
      path: params.cookie.path ?? "/",
      secure: params.cookie.secure ?? false,
      httpOnly: params.cookie.httpOnly ?? false,
      ...partitionKey.sourceOrigin !== void 0 && {
        partitionKey: {
          hasCrossSiteAncestor: false,
          // CDP's `partitionKey.topLevelSite` is the BiDi's `partition.sourceOrigin`.
          topLevelSite: partitionKey.sourceOrigin
        }
      },
      ...params.cookie.expiry !== void 0 && {
        expires: params.cookie.expiry
      },
      ...params.cookie.sameSite !== void 0 && {
        sameSite: sameSiteBiDiToCdp(params.cookie.sameSite)
      }
    };
    if (params.cookie[`goog:url`] !== void 0) {
      result.url = params.cookie[`goog:url`];
    }
    if (params.cookie[`goog:priority`] !== void 0) {
      result.priority = params.cookie[`goog:priority`];
    }
    if (params.cookie[`goog:sameParty`] !== void 0) {
      result.sameParty = params.cookie[`goog:sameParty`];
    }
    if (params.cookie[`goog:sourceScheme`] !== void 0) {
      result.sourceScheme = params.cookie[`goog:sourceScheme`];
    }
    if (params.cookie[`goog:sourcePort`] !== void 0) {
      result.sourcePort = params.cookie[`goog:sourcePort`];
    }
    return result;
  }
  function sameSiteCdpToBiDi(sameSite) {
    switch (sameSite) {
      case "Strict":
        return "strict";
      case "None":
        return "none";
      case "Lax":
        return "lax";
      default:
        return "lax";
    }
  }
  function sameSiteBiDiToCdp(sameSite) {
    switch (sameSite) {
      case "none":
        return "None";
      case "strict":
        return "Strict";
      // Defaults to `Lax`:
      // https://web.dev/articles/samesite-cookies-explained#samesitelax_by_default
      case "default":
      case "lax":
        return "Lax";
    }
    throw new ErrorResponse_js_1.InvalidArgumentException(`Unknown 'sameSite' value ${sameSite}`);
  }
  function isSpecialScheme(protocol2) {
    return ["ftp", "file", "http", "https", "ws", "wss"].includes(protocol2.replace(/:$/, ""));
  }
  function getScheme(url) {
    return url.protocol.replace(/:$/, "");
  }
  function matchUrlPattern(pattern, url) {
    const parsedUrl = new URL(url);
    if (pattern.protocol !== void 0 && pattern.protocol !== getScheme(parsedUrl)) {
      return false;
    }
    if (pattern.hostname !== void 0 && pattern.hostname !== parsedUrl.hostname) {
      return false;
    }
    if (pattern.port !== void 0 && pattern.port !== parsedUrl.port) {
      return false;
    }
    if (pattern.pathname !== void 0 && pattern.pathname !== parsedUrl.pathname) {
      return false;
    }
    if (pattern.search !== void 0 && pattern.search !== parsedUrl.search) {
      return false;
    }
    return true;
  }
  function bidiBodySizeFromCdpPostDataEntries(entries) {
    let size = 0;
    for (const entry of entries) {
      size += atob(entry.bytes ?? "").length;
    }
    return size;
  }
  function getTiming(timing, offset = 0) {
    if (!timing) {
      return 0;
    }
    if (timing <= 0 || timing + offset <= 0) {
      return 0;
    }
    return timing + offset;
  }
  return NetworkUtils;
}
var hasRequiredNetworkProcessor;
function requireNetworkProcessor() {
  if (hasRequiredNetworkProcessor) return NetworkProcessor;
  hasRequiredNetworkProcessor = 1;
  Object.defineProperty(NetworkProcessor, "__esModule", { value: true });
  NetworkProcessor.NetworkProcessor = void 0;
  const protocol_js_1 = requireProtocol();
  const NetworkUtils_js_1 = requireNetworkUtils();
  let NetworkProcessor$1 = class NetworkProcessor2 {
    #browsingContextStorage;
    #networkStorage;
    #userContextStorage;
    constructor(browsingContextStorage, networkStorage, userContextStorage) {
      this.#userContextStorage = userContextStorage;
      this.#browsingContextStorage = browsingContextStorage;
      this.#networkStorage = networkStorage;
    }
    async addIntercept(params) {
      this.#browsingContextStorage.verifyTopLevelContextsList(params.contexts);
      const urlPatterns = params.urlPatterns ?? [];
      const parsedUrlPatterns = NetworkProcessor2.parseUrlPatterns(urlPatterns);
      const intercept = this.#networkStorage.addIntercept({
        urlPatterns: parsedUrlPatterns,
        phases: params.phases,
        contexts: params.contexts
      });
      await this.#toggleNetwork();
      return {
        intercept
      };
    }
    async continueRequest(params) {
      if (params.url !== void 0) {
        NetworkProcessor2.parseUrlString(params.url);
      }
      if (params.method !== void 0) {
        if (!NetworkProcessor2.isMethodValid(params.method)) {
          throw new protocol_js_1.InvalidArgumentException(`Method '${params.method}' is invalid.`);
        }
      }
      if (params.headers) {
        NetworkProcessor2.validateHeaders(params.headers);
      }
      const request = this.#getBlockedRequestOrFail(params.request, [
        "beforeRequestSent"
      ]);
      try {
        await request.continueRequest(params);
      } catch (error) {
        throw NetworkProcessor2.wrapInterceptionError(error);
      }
      return {};
    }
    async continueResponse(params) {
      if (params.headers) {
        NetworkProcessor2.validateHeaders(params.headers);
      }
      const request = this.#getBlockedRequestOrFail(params.request, [
        "authRequired",
        "responseStarted"
      ]);
      try {
        await request.continueResponse(params);
      } catch (error) {
        throw NetworkProcessor2.wrapInterceptionError(error);
      }
      return {};
    }
    async continueWithAuth(params) {
      const networkId = params.request;
      const request = this.#getBlockedRequestOrFail(networkId, [
        "authRequired"
      ]);
      await request.continueWithAuth(params);
      return {};
    }
    async failRequest({ request: networkId }) {
      const request = this.#getRequestOrFail(networkId);
      if (request.interceptPhase === "authRequired") {
        throw new protocol_js_1.InvalidArgumentException(`Request '${networkId}' in 'authRequired' phase cannot be failed`);
      }
      if (!request.interceptPhase) {
        throw new protocol_js_1.NoSuchRequestException(`No blocked request found for network id '${networkId}'`);
      }
      await request.failRequest("Failed");
      return {};
    }
    async provideResponse(params) {
      if (params.headers) {
        NetworkProcessor2.validateHeaders(params.headers);
      }
      const request = this.#getBlockedRequestOrFail(params.request, [
        "beforeRequestSent",
        "responseStarted",
        "authRequired"
      ]);
      try {
        await request.provideResponse(params);
      } catch (error) {
        throw NetworkProcessor2.wrapInterceptionError(error);
      }
      return {};
    }
    /**
     * In some states CDP Network and Fetch domains are not required, but in some they have
     * to be updated. Whenever potential change in these kinds of states is introduced,
     * update the states of all the CDP targets.
     */
    async #toggleNetwork() {
      await Promise.all(this.#browsingContextStorage.getAllContexts().map((context) => {
        return context.cdpTarget.toggleNetwork();
      }));
    }
    async removeIntercept(params) {
      this.#networkStorage.removeIntercept(params.intercept);
      await this.#toggleNetwork();
      return {};
    }
    async setCacheBehavior(params) {
      const contexts = this.#browsingContextStorage.verifyTopLevelContextsList(params.contexts);
      if (contexts.size === 0) {
        this.#networkStorage.defaultCacheBehavior = params.cacheBehavior;
        await Promise.all(this.#browsingContextStorage.getAllContexts().map((context) => {
          return context.cdpTarget.toggleSetCacheDisabled();
        }));
        return {};
      }
      const cacheDisabled = params.cacheBehavior === "bypass";
      await Promise.all([...contexts.values()].map((context) => {
        return context.cdpTarget.toggleSetCacheDisabled(cacheDisabled);
      }));
      return {};
    }
    #getRequestOrFail(id) {
      const request = this.#networkStorage.getRequestById(id);
      if (!request) {
        throw new protocol_js_1.NoSuchRequestException(`Network request with ID '${id}' doesn't exist`);
      }
      return request;
    }
    #getBlockedRequestOrFail(id, phases) {
      const request = this.#getRequestOrFail(id);
      if (!request.interceptPhase) {
        throw new protocol_js_1.NoSuchRequestException(`No blocked request found for network id '${id}'`);
      }
      if (request.interceptPhase && !phases.includes(request.interceptPhase)) {
        throw new protocol_js_1.InvalidArgumentException(`Blocked request for network id '${id}' is in '${request.interceptPhase}' phase`);
      }
      return request;
    }
    /**
     * Validate https://fetch.spec.whatwg.org/#header-value
     */
    static validateHeaders(headers) {
      for (const header of headers) {
        let headerValue;
        if (header.value.type === "string") {
          headerValue = header.value.value;
        } else {
          headerValue = atob(header.value.value);
        }
        if (headerValue !== headerValue.trim() || headerValue.includes("\n") || headerValue.includes("\0")) {
          throw new protocol_js_1.InvalidArgumentException(`Header value '${headerValue}' is not acceptable value`);
        }
      }
    }
    static isMethodValid(method) {
      return /^[!#$%&'*+\-.^_`|~a-zA-Z\d]+$/.test(method);
    }
    /**
     * Attempts to parse the given url.
     * Throws an InvalidArgumentException if the url is invalid.
     */
    static parseUrlString(url) {
      try {
        return new URL(url);
      } catch (error) {
        throw new protocol_js_1.InvalidArgumentException(`Invalid URL '${url}': ${error}`);
      }
    }
    static parseUrlPatterns(urlPatterns) {
      return urlPatterns.map((urlPattern) => {
        let patternUrl = "";
        let hasProtocol = true;
        let hasHostname = true;
        let hasPort = true;
        let hasPathname = true;
        let hasSearch = true;
        switch (urlPattern.type) {
          case "string": {
            patternUrl = unescapeURLPattern(urlPattern.pattern);
            break;
          }
          case "pattern": {
            if (urlPattern.protocol === void 0) {
              hasProtocol = false;
              patternUrl += "http";
            } else {
              if (urlPattern.protocol === "") {
                throw new protocol_js_1.InvalidArgumentException("URL pattern must specify a protocol");
              }
              urlPattern.protocol = unescapeURLPattern(urlPattern.protocol);
              if (!urlPattern.protocol.match(/^[a-zA-Z+-.]+$/)) {
                throw new protocol_js_1.InvalidArgumentException("Forbidden characters");
              }
              patternUrl += urlPattern.protocol;
            }
            const scheme = patternUrl.toLocaleLowerCase();
            patternUrl += ":";
            if ((0, NetworkUtils_js_1.isSpecialScheme)(scheme)) {
              patternUrl += "//";
            }
            if (urlPattern.hostname === void 0) {
              if (scheme !== "file") {
                patternUrl += "placeholder";
              }
              hasHostname = false;
            } else {
              if (urlPattern.hostname === "") {
                throw new protocol_js_1.InvalidArgumentException("URL pattern must specify a hostname");
              }
              if (urlPattern.protocol === "file") {
                throw new protocol_js_1.InvalidArgumentException(`URL pattern protocol cannot be 'file'`);
              }
              urlPattern.hostname = unescapeURLPattern(urlPattern.hostname);
              let insideBrackets = false;
              for (const c of urlPattern.hostname) {
                if (c === "/" || c === "?" || c === "#") {
                  throw new protocol_js_1.InvalidArgumentException(`'/', '?', '#' are forbidden in hostname`);
                }
                if (!insideBrackets && c === ":") {
                  throw new protocol_js_1.InvalidArgumentException(`':' is only allowed inside brackets in hostname`);
                }
                if (c === "[") {
                  insideBrackets = true;
                }
                if (c === "]") {
                  insideBrackets = false;
                }
              }
              patternUrl += urlPattern.hostname;
            }
            if (urlPattern.port === void 0) {
              hasPort = false;
            } else {
              if (urlPattern.port === "") {
                throw new protocol_js_1.InvalidArgumentException(`URL pattern must specify a port`);
              }
              urlPattern.port = unescapeURLPattern(urlPattern.port);
              patternUrl += ":";
              if (!urlPattern.port.match(/^\d+$/)) {
                throw new protocol_js_1.InvalidArgumentException("Forbidden characters");
              }
              patternUrl += urlPattern.port;
            }
            if (urlPattern.pathname === void 0) {
              hasPathname = false;
            } else {
              urlPattern.pathname = unescapeURLPattern(urlPattern.pathname);
              if (urlPattern.pathname[0] !== "/") {
                patternUrl += "/";
              }
              if (urlPattern.pathname.includes("#") || urlPattern.pathname.includes("?")) {
                throw new protocol_js_1.InvalidArgumentException("Forbidden characters");
              }
              patternUrl += urlPattern.pathname;
            }
            if (urlPattern.search === void 0) {
              hasSearch = false;
            } else {
              urlPattern.search = unescapeURLPattern(urlPattern.search);
              if (urlPattern.search[0] !== "?") {
                patternUrl += "?";
              }
              if (urlPattern.search.includes("#")) {
                throw new protocol_js_1.InvalidArgumentException("Forbidden characters");
              }
              patternUrl += urlPattern.search;
            }
            break;
          }
        }
        const serializePort = (url) => {
          const defaultPorts = {
            "ftp:": 21,
            "file:": null,
            "http:": 80,
            "https:": 443,
            "ws:": 80,
            "wss:": 443
          };
          if ((0, NetworkUtils_js_1.isSpecialScheme)(url.protocol) && defaultPorts[url.protocol] !== null && (!url.port || String(defaultPorts[url.protocol]) === url.port)) {
            return "";
          } else if (url.port) {
            return url.port;
          }
          return void 0;
        };
        try {
          const url = new URL(patternUrl);
          return {
            protocol: hasProtocol ? url.protocol.replace(/:$/, "") : void 0,
            hostname: hasHostname ? url.hostname : void 0,
            port: hasPort ? serializePort(url) : void 0,
            pathname: hasPathname && url.pathname ? url.pathname : void 0,
            search: hasSearch ? url.search : void 0
          };
        } catch (err) {
          throw new protocol_js_1.InvalidArgumentException(`${err.message} '${patternUrl}'`);
        }
      });
    }
    static wrapInterceptionError(error) {
      if (error?.message.includes("Invalid header") || error?.message.includes("Unsafe header")) {
        return new protocol_js_1.InvalidArgumentException(error.message);
      }
      return error;
    }
    async addDataCollector(params) {
      if (params.userContexts !== void 0 && params.contexts !== void 0) {
        throw new protocol_js_1.InvalidArgumentException("'contexts' and 'userContexts' are mutually exclusive");
      }
      if (params.userContexts !== void 0) {
        await this.#userContextStorage.verifyUserContextIdList(params.userContexts);
      }
      if (params.contexts !== void 0) {
        for (const browsingContextId of params.contexts) {
          const browsingContext = this.#browsingContextStorage.getContext(browsingContextId);
          if (!browsingContext.isTopLevelContext()) {
            throw new protocol_js_1.InvalidArgumentException(`Data collectors are available only on top-level browsing contexts`);
          }
        }
      }
      const collectorId = this.#networkStorage.addDataCollector(params);
      await this.#toggleNetwork();
      return { collector: collectorId };
    }
    async getData(params) {
      return await this.#networkStorage.getCollectedData(params);
    }
    async removeDataCollector(params) {
      this.#networkStorage.removeDataCollector(params);
      await this.#toggleNetwork();
      return {};
    }
    disownData(params) {
      this.#networkStorage.disownData(params);
      return {};
    }
  };
  NetworkProcessor.NetworkProcessor = NetworkProcessor$1;
  function unescapeURLPattern(pattern) {
    const forbidden = /* @__PURE__ */ new Set(["(", ")", "*", "{", "}"]);
    let result = "";
    let isEscaped = false;
    for (const c of pattern) {
      if (!isEscaped) {
        if (forbidden.has(c)) {
          throw new protocol_js_1.InvalidArgumentException("Forbidden characters");
        }
        if (c === "\\") {
          isEscaped = true;
          continue;
        }
      }
      result += c;
      isEscaped = false;
    }
    return result;
  }
  return NetworkProcessor;
}
var PermissionsProcessor = {};
var hasRequiredPermissionsProcessor;
function requirePermissionsProcessor() {
  if (hasRequiredPermissionsProcessor) return PermissionsProcessor;
  hasRequiredPermissionsProcessor = 1;
  Object.defineProperty(PermissionsProcessor, "__esModule", { value: true });
  PermissionsProcessor.PermissionsProcessor = void 0;
  const protocol_js_1 = requireProtocol();
  let PermissionsProcessor$1 = class PermissionsProcessor {
    #browserCdpClient;
    constructor(browserCdpClient) {
      this.#browserCdpClient = browserCdpClient;
    }
    async setPermissions(params) {
      try {
        const userContextId = params["goog:userContext"] || params.userContext;
        await this.#browserCdpClient.sendCommand("Browser.setPermission", {
          origin: params.origin,
          browserContextId: userContextId && userContextId !== "default" ? userContextId : void 0,
          permission: {
            name: params.descriptor.name
          },
          setting: params.state
        });
      } catch (err) {
        if (err.message === `Permission can't be granted to opaque origins.`) {
          return {};
        }
        throw new protocol_js_1.InvalidArgumentException(err.message);
      }
      return {};
    }
  };
  PermissionsProcessor.PermissionsProcessor = PermissionsProcessor$1;
  return PermissionsProcessor;
}
var ScriptProcessor = {};
var PreloadScript = {};
var uuid = {};
var hasRequiredUuid;
function requireUuid() {
  if (hasRequiredUuid) return uuid;
  hasRequiredUuid = 1;
  Object.defineProperty(uuid, "__esModule", { value: true });
  uuid.uuidv4 = uuidv4;
  function bytesToHex(bytes) {
    return bytes.reduce((str, byte) => str + byte.toString(16).padStart(2, "0"), "");
  }
  function uuidv4() {
    if ("crypto" in globalThis && "randomUUID" in globalThis.crypto) {
      return globalThis.crypto.randomUUID();
    }
    const randomValues = new Uint8Array(16);
    if ("crypto" in globalThis && "getRandomValues" in globalThis.crypto) {
      globalThis.crypto.getRandomValues(randomValues);
    } else {
      require$$2.webcrypto.getRandomValues(randomValues);
    }
    randomValues[6] = randomValues[6] & 15 | 64;
    randomValues[8] = randomValues[8] & 63 | 128;
    return [
      bytesToHex(randomValues.subarray(0, 4)),
      bytesToHex(randomValues.subarray(4, 6)),
      bytesToHex(randomValues.subarray(6, 8)),
      bytesToHex(randomValues.subarray(8, 10)),
      bytesToHex(randomValues.subarray(10, 16))
    ].join("-");
  }
  return uuid;
}
var ChannelProxy = {};
var hasRequiredChannelProxy;
function requireChannelProxy() {
  if (hasRequiredChannelProxy) return ChannelProxy;
  hasRequiredChannelProxy = 1;
  Object.defineProperty(ChannelProxy, "__esModule", { value: true });
  ChannelProxy.ChannelProxy = void 0;
  const protocol_js_1 = requireProtocol();
  const log_js_1 = requireLog();
  const uuid_js_1 = requireUuid();
  let ChannelProxy$1 = class ChannelProxy2 {
    #properties;
    #id = (0, uuid_js_1.uuidv4)();
    #logger;
    constructor(channel, logger) {
      this.#properties = channel;
      this.#logger = logger;
    }
    /**
     * Creates a channel proxy in the given realm, initialises listener and
     * returns a handle to `sendMessage` delegate.
     */
    async init(realm, eventManager) {
      const channelHandle = await ChannelProxy2.#createAndGetHandleInRealm(realm);
      const sendMessageHandle = await ChannelProxy2.#createSendMessageHandle(realm, channelHandle);
      void this.#startListener(realm, channelHandle, eventManager);
      return sendMessageHandle;
    }
    /** Gets a ChannelProxy from window and returns its handle. */
    async startListenerFromWindow(realm, eventManager) {
      try {
        const channelHandle = await this.#getHandleFromWindow(realm);
        void this.#startListener(realm, channelHandle, eventManager);
      } catch (error) {
        this.#logger?.(log_js_1.LogType.debugError, error);
      }
    }
    /**
     * Evaluation string which creates a ChannelProxy object on the client side.
     */
    static #createChannelProxyEvalStr() {
      const functionStr = String(() => {
        const queue = [];
        let queueNonEmptyResolver = null;
        return {
          /**
           * Gets a promise, which is resolved as soon as a message occurs
           * in the queue.
           */
          async getMessage() {
            const onMessage = queue.length > 0 ? Promise.resolve() : new Promise((resolve) => {
              queueNonEmptyResolver = resolve;
            });
            await onMessage;
            return queue.shift();
          },
          /**
           * Adds a message to the queue.
           * Resolves the pending promise if needed.
           */
          sendMessage(message) {
            queue.push(message);
            if (queueNonEmptyResolver !== null) {
              queueNonEmptyResolver();
              queueNonEmptyResolver = null;
            }
          }
        };
      });
      return `(${functionStr})()`;
    }
    /** Creates a ChannelProxy in the given realm. */
    static async #createAndGetHandleInRealm(realm) {
      const createChannelHandleResult = await realm.cdpClient.sendCommand("Runtime.evaluate", {
        expression: this.#createChannelProxyEvalStr(),
        contextId: realm.executionContextId,
        serializationOptions: {
          serialization: "idOnly"
        }
      });
      if (createChannelHandleResult.exceptionDetails || createChannelHandleResult.result.objectId === void 0) {
        throw new Error(`Cannot create channel`);
      }
      return createChannelHandleResult.result.objectId;
    }
    /** Gets a handle to `sendMessage` delegate from the ChannelProxy handle. */
    static async #createSendMessageHandle(realm, channelHandle) {
      const sendMessageArgResult = await realm.cdpClient.sendCommand("Runtime.callFunctionOn", {
        functionDeclaration: String((channelHandle2) => {
          return channelHandle2.sendMessage;
        }),
        arguments: [{ objectId: channelHandle }],
        executionContextId: realm.executionContextId,
        serializationOptions: {
          serialization: "idOnly"
        }
      });
      return sendMessageArgResult.result.objectId;
    }
    /** Starts listening for the channel events of the provided ChannelProxy. */
    async #startListener(realm, channelHandle, eventManager) {
      for (; ; ) {
        try {
          const message = await realm.cdpClient.sendCommand("Runtime.callFunctionOn", {
            functionDeclaration: String(async (channelHandle2) => await channelHandle2.getMessage()),
            arguments: [
              {
                objectId: channelHandle
              }
            ],
            awaitPromise: true,
            executionContextId: realm.executionContextId,
            serializationOptions: {
              serialization: "deep",
              maxDepth: this.#properties.serializationOptions?.maxObjectDepth ?? void 0
            }
          });
          if (message.exceptionDetails) {
            throw new Error("Runtime.callFunctionOn in ChannelProxy", {
              cause: message.exceptionDetails
            });
          }
          for (const browsingContext of realm.associatedBrowsingContexts) {
            eventManager.registerEvent({
              type: "event",
              method: protocol_js_1.ChromiumBidi.Script.EventNames.Message,
              params: {
                channel: this.#properties.channel,
                data: realm.cdpToBidiValue(
                  message,
                  this.#properties.ownership ?? "none"
                  /* Script.ResultOwnership.None */
                ),
                source: realm.source
              }
            }, browsingContext.id);
          }
        } catch (error) {
          this.#logger?.(log_js_1.LogType.debugError, error);
          break;
        }
      }
    }
    /**
     * Returns a handle of ChannelProxy from window's property which was set there
     * by `getEvalInWindowStr`. If window property is not set yet, sets a promise
     * resolver to the window property, so that `getEvalInWindowStr` can resolve
     * the promise later on with the channel.
     * This is needed because `getEvalInWindowStr` can be called before or
     * after this method.
     */
    async #getHandleFromWindow(realm) {
      const channelHandleResult = await realm.cdpClient.sendCommand("Runtime.callFunctionOn", {
        functionDeclaration: String((id) => {
          const w = window;
          if (w[id] === void 0) {
            return new Promise((resolve) => w[id] = resolve);
          }
          const channelProxy = w[id];
          delete w[id];
          return channelProxy;
        }),
        arguments: [{ value: this.#id }],
        executionContextId: realm.executionContextId,
        awaitPromise: true,
        serializationOptions: {
          serialization: "idOnly"
        }
      });
      if (channelHandleResult.exceptionDetails !== void 0 || channelHandleResult.result.objectId === void 0) {
        throw new Error(`ChannelHandle not found in window["${this.#id}"]`);
      }
      return channelHandleResult.result.objectId;
    }
    /**
     * String to be evaluated to create a ProxyChannel and put it to window.
     * Returns the delegate `sendMessage`. Used to provide an argument for preload
     * script. Does the following:
     * 1. Creates a ChannelProxy.
     * 2. Puts the ChannelProxy to window['${this.#id}'] or resolves the promise
     *    by calling delegate stored in window['${this.#id}'].
     *    This is needed because `#getHandleFromWindow` can be called before or
     *    after this method.
     * 3. Returns the delegate `sendMessage` of the created ChannelProxy.
     */
    getEvalInWindowStr() {
      const delegate = String((id, channelProxy) => {
        const w = window;
        if (w[id] === void 0) {
          w[id] = channelProxy;
        } else {
          w[id](channelProxy);
          delete w[id];
        }
        return channelProxy.sendMessage;
      });
      const channelProxyEval = ChannelProxy2.#createChannelProxyEvalStr();
      return `(${delegate})('${this.#id}',${channelProxyEval})`;
    }
  };
  ChannelProxy.ChannelProxy = ChannelProxy$1;
  return ChannelProxy;
}
var hasRequiredPreloadScript;
function requirePreloadScript() {
  if (hasRequiredPreloadScript) return PreloadScript;
  hasRequiredPreloadScript = 1;
  Object.defineProperty(PreloadScript, "__esModule", { value: true });
  PreloadScript.PreloadScript = void 0;
  const uuid_js_1 = requireUuid();
  const ChannelProxy_js_1 = requireChannelProxy();
  let PreloadScript$1 = class PreloadScript {
    /** BiDi ID, an automatically generated UUID. */
    #id = (0, uuid_js_1.uuidv4)();
    /** CDP preload scripts. */
    #cdpPreloadScripts = [];
    /** The script itself, in a format expected by the spec i.e. a function. */
    #functionDeclaration;
    /** Targets, in which the preload script is initialized. */
    #targetIds = /* @__PURE__ */ new Set();
    /** Channels to be added as arguments to functionDeclaration. */
    #channels;
    /** The script sandbox / world name. */
    #sandbox;
    /** The browsing contexts to execute the preload scripts in, if any. */
    #contexts;
    /** The browsing contexts to execute the preload scripts in, if any. */
    #userContexts;
    get id() {
      return this.#id;
    }
    get targetIds() {
      return this.#targetIds;
    }
    constructor(params, logger) {
      this.#channels = params.arguments?.map((a) => new ChannelProxy_js_1.ChannelProxy(a.value, logger)) ?? [];
      this.#functionDeclaration = params.functionDeclaration;
      this.#sandbox = params.sandbox;
      this.#contexts = params.contexts;
      this.#userContexts = params.userContexts;
    }
    /** Channels of the preload script. */
    get channels() {
      return this.#channels;
    }
    /** Contexts of the preload script, if any */
    get contexts() {
      return this.#contexts;
    }
    /** UserContexts of the preload script, if any */
    get userContexts() {
      return this.#userContexts;
    }
    /**
     * String to be evaluated. Wraps user-provided function so that the following
     * steps are run:
     * 1. Create channels.
     * 2. Store the created channels in window.
     * 3. Call the user-provided function with channels as arguments.
     */
    #getEvaluateString() {
      const channelsArgStr = `[${this.channels.map((c) => c.getEvalInWindowStr()).join(", ")}]`;
      return `(()=>{(${this.#functionDeclaration})(...${channelsArgStr})})()`;
    }
    /**
     * Adds the script to the given CDP targets by calling the
     * `Page.addScriptToEvaluateOnNewDocument` command.
     */
    async initInTargets(cdpTargets, runImmediately) {
      await Promise.all(Array.from(cdpTargets).map((cdpTarget) => this.initInTarget(cdpTarget, runImmediately)));
    }
    /**
     * Adds the script to the given CDP target by calling the
     * `Page.addScriptToEvaluateOnNewDocument` command.
     */
    async initInTarget(cdpTarget, runImmediately) {
      const addCdpPreloadScriptResult = await cdpTarget.cdpClient.sendCommand("Page.addScriptToEvaluateOnNewDocument", {
        source: this.#getEvaluateString(),
        worldName: this.#sandbox,
        runImmediately
      });
      this.#cdpPreloadScripts.push({
        target: cdpTarget,
        preloadScriptId: addCdpPreloadScriptResult.identifier
      });
      this.#targetIds.add(cdpTarget.id);
    }
    /**
     * Removes this script from all CDP targets.
     */
    async remove() {
      await Promise.all([
        this.#cdpPreloadScripts.map(async (cdpPreloadScript) => {
          const cdpTarget = cdpPreloadScript.target;
          const cdpPreloadScriptId = cdpPreloadScript.preloadScriptId;
          return await cdpTarget.cdpClient.sendCommand("Page.removeScriptToEvaluateOnNewDocument", {
            identifier: cdpPreloadScriptId
          });
        })
      ]);
    }
    /** Removes the provided cdp target from the list of cdp preload scripts. */
    dispose(cdpTargetId) {
      this.#cdpPreloadScripts = this.#cdpPreloadScripts.filter((cdpPreloadScript) => cdpPreloadScript.target?.id !== cdpTargetId);
      this.#targetIds.delete(cdpTargetId);
    }
  };
  PreloadScript.PreloadScript = PreloadScript$1;
  return PreloadScript;
}
var hasRequiredScriptProcessor;
function requireScriptProcessor() {
  if (hasRequiredScriptProcessor) return ScriptProcessor;
  hasRequiredScriptProcessor = 1;
  Object.defineProperty(ScriptProcessor, "__esModule", { value: true });
  ScriptProcessor.ScriptProcessor = void 0;
  const protocol_js_1 = requireProtocol();
  const PreloadScript_js_1 = requirePreloadScript();
  let ScriptProcessor$1 = class ScriptProcessor {
    #eventManager;
    #browsingContextStorage;
    #realmStorage;
    #preloadScriptStorage;
    #userContextStorage;
    #logger;
    constructor(eventManager, browsingContextStorage, realmStorage, preloadScriptStorage, userContextStorage, logger) {
      this.#browsingContextStorage = browsingContextStorage;
      this.#realmStorage = realmStorage;
      this.#preloadScriptStorage = preloadScriptStorage;
      this.#userContextStorage = userContextStorage;
      this.#logger = logger;
      this.#eventManager = eventManager;
      this.#eventManager.addSubscribeHook(protocol_js_1.ChromiumBidi.Script.EventNames.RealmCreated, this.#onRealmCreatedSubscribeHook.bind(this));
    }
    #onRealmCreatedSubscribeHook(contextId) {
      const context = this.#browsingContextStorage.getContext(contextId);
      const contextsToReport = [
        context,
        ...this.#browsingContextStorage.getContext(contextId).allChildren
      ];
      const realms = /* @__PURE__ */ new Set();
      for (const reportContext of contextsToReport) {
        const realmsForContext = this.#realmStorage.findRealms({
          browsingContextId: reportContext.id
        });
        for (const realm of realmsForContext) {
          realms.add(realm);
        }
      }
      for (const realm of realms) {
        this.#eventManager.registerEvent({
          type: "event",
          method: protocol_js_1.ChromiumBidi.Script.EventNames.RealmCreated,
          params: realm.realmInfo
        }, context.id);
      }
      return Promise.resolve();
    }
    async addPreloadScript(params) {
      if (params.userContexts?.length && params.contexts?.length) {
        throw new protocol_js_1.InvalidArgumentException("Both userContexts and contexts cannot be specified.");
      }
      const userContexts = await this.#userContextStorage.verifyUserContextIdList(params.userContexts ?? []);
      const browsingContexts = this.#browsingContextStorage.verifyTopLevelContextsList(params.contexts);
      const preloadScript = new PreloadScript_js_1.PreloadScript(params, this.#logger);
      this.#preloadScriptStorage.add(preloadScript);
      let contextsToRunIn = [];
      if (userContexts.size) {
        contextsToRunIn = this.#browsingContextStorage.getTopLevelContexts().filter((context) => {
          return userContexts.has(context.userContext);
        });
      } else if (browsingContexts.size) {
        contextsToRunIn = [...browsingContexts.values()];
      } else {
        contextsToRunIn = this.#browsingContextStorage.getTopLevelContexts();
      }
      const cdpTargets = new Set(contextsToRunIn.map((context) => context.cdpTarget));
      await preloadScript.initInTargets(cdpTargets, false);
      return {
        script: preloadScript.id
      };
    }
    async removePreloadScript(params) {
      const { script: id } = params;
      const script = this.#preloadScriptStorage.getPreloadScript(id);
      await script.remove();
      this.#preloadScriptStorage.remove(id);
      return {};
    }
    async callFunction(params) {
      const realm = await this.#getRealm(params.target);
      return await realm.callFunction(params.functionDeclaration, params.awaitPromise, params.this, params.arguments, params.resultOwnership, params.serializationOptions, params.userActivation);
    }
    async evaluate(params) {
      const realm = await this.#getRealm(params.target);
      return await realm.evaluate(params.expression, params.awaitPromise, params.resultOwnership, params.serializationOptions, params.userActivation);
    }
    async disown(params) {
      const realm = await this.#getRealm(params.target);
      await Promise.all(params.handles.map(async (handle) => await realm.disown(handle)));
      return {};
    }
    getRealms(params) {
      if (params.context !== void 0) {
        this.#browsingContextStorage.getContext(params.context);
      }
      const realms = this.#realmStorage.findRealms({
        browsingContextId: params.context,
        type: params.type,
        isHidden: false
      }).map((realm) => realm.realmInfo);
      return { realms };
    }
    async #getRealm(target) {
      if ("context" in target) {
        const context = this.#browsingContextStorage.getContext(target.context);
        return await context.getOrCreateUserSandbox(target.sandbox);
      }
      return this.#realmStorage.getRealm({
        realmId: target.realm,
        isHidden: false
      });
    }
  };
  ScriptProcessor.ScriptProcessor = ScriptProcessor$1;
  return ScriptProcessor;
}
var SessionProcessor = {};
var hasRequiredSessionProcessor;
function requireSessionProcessor() {
  if (hasRequiredSessionProcessor) return SessionProcessor;
  hasRequiredSessionProcessor = 1;
  Object.defineProperty(SessionProcessor, "__esModule", { value: true });
  SessionProcessor.SessionProcessor = void 0;
  const protocol_js_1 = requireProtocol();
  let SessionProcessor$1 = class SessionProcessor {
    #eventManager;
    #browserCdpClient;
    #initConnection;
    #created = false;
    constructor(eventManager, browserCdpClient, initConnection) {
      this.#eventManager = eventManager;
      this.#browserCdpClient = browserCdpClient;
      this.#initConnection = initConnection;
    }
    status() {
      return { ready: false, message: "already connected" };
    }
    #mergeCapabilities(capabilitiesRequest) {
      const mergedCapabilities = [];
      for (const first of capabilitiesRequest.firstMatch ?? [{}]) {
        const result = {
          ...capabilitiesRequest.alwaysMatch
        };
        for (const key of Object.keys(first)) {
          if (result[key] !== void 0) {
            throw new protocol_js_1.InvalidArgumentException(`Capability ${key} in firstMatch is already defined in alwaysMatch`);
          }
          result[key] = first[key];
        }
        mergedCapabilities.push(result);
      }
      const match = mergedCapabilities.find((c) => c.browserName === "chrome") ?? mergedCapabilities[0] ?? {};
      match.unhandledPromptBehavior = this.#getUnhandledPromptBehavior(match.unhandledPromptBehavior);
      return match;
    }
    #getUnhandledPromptBehavior(capabilityValue) {
      if (capabilityValue === void 0) {
        return void 0;
      }
      if (typeof capabilityValue === "object") {
        return capabilityValue;
      }
      if (typeof capabilityValue !== "string") {
        throw new protocol_js_1.InvalidArgumentException(`Unexpected 'unhandledPromptBehavior' type: ${typeof capabilityValue}`);
      }
      switch (capabilityValue) {
        // `beforeUnload: accept` has higher priority over string capability, as the latest
        // one is set to "fallbackDefault".
        // https://w3c.github.io/webdriver/#dfn-deserialize-as-an-unhandled-prompt-behavior
        // https://w3c.github.io/webdriver/#dfn-get-the-prompt-handler
        case "accept":
        case "accept and notify":
          return {
            default: "accept",
            beforeUnload: "accept"
          };
        case "dismiss":
        case "dismiss and notify":
          return {
            default: "dismiss",
            beforeUnload: "accept"
          };
        case "ignore":
          return {
            default: "ignore",
            beforeUnload: "accept"
          };
        default:
          throw new protocol_js_1.InvalidArgumentException(`Unexpected 'unhandledPromptBehavior' value: ${capabilityValue}`);
      }
    }
    async new(params) {
      if (this.#created) {
        throw new Error("Session has been already created.");
      }
      this.#created = true;
      const matchedCapabitlites = this.#mergeCapabilities(params.capabilities);
      await this.#initConnection(matchedCapabitlites);
      const version = await this.#browserCdpClient.sendCommand("Browser.getVersion");
      return {
        sessionId: "unknown",
        capabilities: {
          ...matchedCapabitlites,
          acceptInsecureCerts: matchedCapabitlites.acceptInsecureCerts ?? false,
          browserName: version.product,
          browserVersion: version.revision,
          platformName: "",
          setWindowRect: false,
          webSocketUrl: "",
          userAgent: version.userAgent
        }
      };
    }
    async subscribe(params, googChannel = null) {
      const subscription = await this.#eventManager.subscribe(params.events, params.contexts ?? [], params.userContexts ?? [], googChannel);
      return {
        subscription
      };
    }
    async unsubscribe(params, googChannel = null) {
      if ("subscriptions" in params) {
        await this.#eventManager.unsubscribeByIds(params.subscriptions);
        return {};
      }
      await this.#eventManager.unsubscribe(params.events, params.contexts ?? [], googChannel);
      return {};
    }
  };
  SessionProcessor.SessionProcessor = SessionProcessor$1;
  return SessionProcessor;
}
var StorageProcessor = {};
var hasRequiredStorageProcessor;
function requireStorageProcessor() {
  if (hasRequiredStorageProcessor) return StorageProcessor;
  hasRequiredStorageProcessor = 1;
  Object.defineProperty(StorageProcessor, "__esModule", { value: true });
  StorageProcessor.StorageProcessor = void 0;
  const protocol_js_1 = requireProtocol();
  const assert_js_1 = requireAssert();
  const log_js_1 = requireLog();
  const NetworkProcessor_js_1 = requireNetworkProcessor();
  const NetworkUtils_js_1 = requireNetworkUtils();
  let StorageProcessor$1 = class StorageProcessor {
    #browserCdpClient;
    #browsingContextStorage;
    #logger;
    constructor(browserCdpClient, browsingContextStorage, logger) {
      this.#browsingContextStorage = browsingContextStorage;
      this.#browserCdpClient = browserCdpClient;
      this.#logger = logger;
    }
    async deleteCookies(params) {
      const partitionKey = this.#expandStoragePartitionSpec(params.partition);
      let cdpResponse;
      try {
        cdpResponse = await this.#browserCdpClient.sendCommand("Storage.getCookies", {
          browserContextId: this.#getCdpBrowserContextId(partitionKey)
        });
      } catch (err) {
        if (this.#isNoSuchUserContextError(err)) {
          throw new protocol_js_1.NoSuchUserContextException(err.message);
        }
        throw err;
      }
      const cdpCookiesToDelete = cdpResponse.cookies.filter(
        // CDP's partition key is the source origin. If the request specifies the
        // `sourceOrigin` partition key, only cookies with the requested source origin
        // are returned.
        (c) => partitionKey.sourceOrigin === void 0 || c.partitionKey?.topLevelSite === partitionKey.sourceOrigin
      ).filter((cdpCookie) => {
        const bidiCookie = (0, NetworkUtils_js_1.cdpToBiDiCookie)(cdpCookie);
        return this.#matchCookie(bidiCookie, params.filter);
      }).map((cookie) => ({
        ...cookie,
        // Set expiry to pass date to delete the cookie.
        expires: 1
      }));
      await this.#browserCdpClient.sendCommand("Storage.setCookies", {
        cookies: cdpCookiesToDelete,
        browserContextId: this.#getCdpBrowserContextId(partitionKey)
      });
      return {
        partitionKey
      };
    }
    async getCookies(params) {
      const partitionKey = this.#expandStoragePartitionSpec(params.partition);
      let cdpResponse;
      try {
        cdpResponse = await this.#browserCdpClient.sendCommand("Storage.getCookies", {
          browserContextId: this.#getCdpBrowserContextId(partitionKey)
        });
      } catch (err) {
        if (this.#isNoSuchUserContextError(err)) {
          throw new protocol_js_1.NoSuchUserContextException(err.message);
        }
        throw err;
      }
      const filteredBiDiCookies = cdpResponse.cookies.filter(
        // CDP's partition key is the source origin. If the request specifies the
        // `sourceOrigin` partition key, only cookies with the requested source origin
        // are returned.
        (c) => partitionKey.sourceOrigin === void 0 || c.partitionKey?.topLevelSite === partitionKey.sourceOrigin
      ).map((c) => (0, NetworkUtils_js_1.cdpToBiDiCookie)(c)).filter((c) => this.#matchCookie(c, params.filter));
      return {
        cookies: filteredBiDiCookies,
        partitionKey
      };
    }
    async setCookie(params) {
      const partitionKey = this.#expandStoragePartitionSpec(params.partition);
      const cdpCookie = (0, NetworkUtils_js_1.bidiToCdpCookie)(params, partitionKey);
      try {
        await this.#browserCdpClient.sendCommand("Storage.setCookies", {
          cookies: [cdpCookie],
          browserContextId: this.#getCdpBrowserContextId(partitionKey)
        });
      } catch (err) {
        if (this.#isNoSuchUserContextError(err)) {
          throw new protocol_js_1.NoSuchUserContextException(err.message);
        }
        this.#logger?.(log_js_1.LogType.debugError, err);
        throw new protocol_js_1.UnableToSetCookieException(err.toString());
      }
      return {
        partitionKey
      };
    }
    #isNoSuchUserContextError(err) {
      return err.message?.startsWith("Failed to find browser context for id");
    }
    #getCdpBrowserContextId(partitionKey) {
      return partitionKey.userContext === "default" ? void 0 : partitionKey.userContext;
    }
    #expandStoragePartitionSpecByBrowsingContext(descriptor) {
      const browsingContextId = descriptor.context;
      const browsingContext = this.#browsingContextStorage.getContext(browsingContextId);
      return {
        userContext: browsingContext.userContext
      };
    }
    #expandStoragePartitionSpecByStorageKey(descriptor) {
      const unsupportedPartitionKeys = /* @__PURE__ */ new Map();
      let sourceOrigin = descriptor.sourceOrigin;
      if (sourceOrigin !== void 0) {
        const url = NetworkProcessor_js_1.NetworkProcessor.parseUrlString(sourceOrigin);
        if (url.origin === "null") {
          sourceOrigin = url.origin;
        } else {
          sourceOrigin = `${url.protocol}//${url.hostname}`;
        }
      }
      for (const [key, value] of Object.entries(descriptor)) {
        if (key !== void 0 && value !== void 0 && !["type", "sourceOrigin", "userContext"].includes(key)) {
          unsupportedPartitionKeys.set(key, value);
        }
      }
      if (unsupportedPartitionKeys.size > 0) {
        this.#logger?.(log_js_1.LogType.debugInfo, `Unsupported partition keys: ${JSON.stringify(Object.fromEntries(unsupportedPartitionKeys))}`);
      }
      const userContext = descriptor.userContext ?? "default";
      return {
        userContext,
        ...sourceOrigin === void 0 ? {} : { sourceOrigin }
      };
    }
    #expandStoragePartitionSpec(partitionSpec) {
      if (partitionSpec === void 0) {
        return { userContext: "default" };
      }
      if (partitionSpec.type === "context") {
        return this.#expandStoragePartitionSpecByBrowsingContext(partitionSpec);
      }
      (0, assert_js_1.assert)(partitionSpec.type === "storageKey", "Unknown partition type");
      return this.#expandStoragePartitionSpecByStorageKey(partitionSpec);
    }
    #matchCookie(cookie, filter) {
      if (filter === void 0) {
        return true;
      }
      return (filter.domain === void 0 || filter.domain === cookie.domain) && (filter.name === void 0 || filter.name === cookie.name) && // `value` contains fields `type` and `value`.
      (filter.value === void 0 || (0, NetworkUtils_js_1.deserializeByteValue)(filter.value) === (0, NetworkUtils_js_1.deserializeByteValue)(cookie.value)) && (filter.path === void 0 || filter.path === cookie.path) && (filter.size === void 0 || filter.size === cookie.size) && (filter.httpOnly === void 0 || filter.httpOnly === cookie.httpOnly) && (filter.secure === void 0 || filter.secure === cookie.secure) && (filter.sameSite === void 0 || filter.sameSite === cookie.sameSite) && (filter.expiry === void 0 || filter.expiry === cookie.expiry);
    }
  };
  StorageProcessor.StorageProcessor = StorageProcessor$1;
  return StorageProcessor;
}
var WebExtensionProcessor = {};
var hasRequiredWebExtensionProcessor;
function requireWebExtensionProcessor() {
  if (hasRequiredWebExtensionProcessor) return WebExtensionProcessor;
  hasRequiredWebExtensionProcessor = 1;
  Object.defineProperty(WebExtensionProcessor, "__esModule", { value: true });
  WebExtensionProcessor.WebExtensionProcessor = void 0;
  const protocol_js_1 = requireProtocol();
  let WebExtensionProcessor$1 = class WebExtensionProcessor {
    #browserCdpClient;
    constructor(browserCdpClient) {
      this.#browserCdpClient = browserCdpClient;
    }
    async install(params) {
      switch (params.extensionData.type) {
        case "archivePath":
        case "base64":
          throw new protocol_js_1.UnsupportedOperationException("Archived and Base64 extensions are not supported");
      }
      try {
        const response = await this.#browserCdpClient.sendCommand("Extensions.loadUnpacked", {
          path: params.extensionData.path
        });
        return {
          extension: response.id
        };
      } catch (err) {
        if (err.message.startsWith("invalid web extension")) {
          throw new protocol_js_1.InvalidWebExtensionException(err.message);
        }
        throw err;
      }
    }
    async uninstall(params) {
      try {
        await this.#browserCdpClient.sendCommand("Extensions.uninstall", {
          id: params.extension
        });
        return {};
      } catch (err) {
        if (err.message === "Uninstall failed. Reason: could not find extension.") {
          throw new protocol_js_1.NoSuchWebExtensionException("no such web extension");
        }
        throw err;
      }
    }
  };
  WebExtensionProcessor.WebExtensionProcessor = WebExtensionProcessor$1;
  return WebExtensionProcessor;
}
var OutgoingMessage = {};
var hasRequiredOutgoingMessage;
function requireOutgoingMessage() {
  if (hasRequiredOutgoingMessage) return OutgoingMessage;
  hasRequiredOutgoingMessage = 1;
  Object.defineProperty(OutgoingMessage, "__esModule", { value: true });
  OutgoingMessage.OutgoingMessage = void 0;
  let OutgoingMessage$1 = class OutgoingMessage2 {
    #message;
    #googChannel;
    constructor(message, googChannel = null) {
      this.#message = message;
      this.#googChannel = googChannel;
    }
    static createFromPromise(messagePromise, googChannel) {
      return messagePromise.then((message) => {
        if (message.kind === "success") {
          return {
            kind: "success",
            value: new OutgoingMessage2(message.value, googChannel)
          };
        }
        return message;
      });
    }
    static createResolved(message, googChannel = null) {
      return Promise.resolve({
        kind: "success",
        value: new OutgoingMessage2(message, googChannel)
      });
    }
    get message() {
      return this.#message;
    }
    get googChannel() {
      return this.#googChannel;
    }
  };
  OutgoingMessage.OutgoingMessage = OutgoingMessage$1;
  return OutgoingMessage;
}
var hasRequiredCommandProcessor;
function requireCommandProcessor() {
  if (hasRequiredCommandProcessor) return CommandProcessor;
  hasRequiredCommandProcessor = 1;
  Object.defineProperty(CommandProcessor, "__esModule", { value: true });
  CommandProcessor.CommandProcessor = void 0;
  const protocol_js_1 = requireProtocol();
  const EventEmitter_js_1 = requireEventEmitter();
  const log_js_1 = requireLog();
  const BidiNoOpParser_js_1 = requireBidiNoOpParser();
  const BrowserProcessor_js_1 = requireBrowserProcessor();
  const CdpProcessor_js_1 = requireCdpProcessor();
  const BrowsingContextProcessor_js_1 = requireBrowsingContextProcessor();
  const EmulationProcessor_js_1 = requireEmulationProcessor();
  const InputProcessor_js_1 = requireInputProcessor();
  const NetworkProcessor_js_1 = requireNetworkProcessor();
  const PermissionsProcessor_js_1 = requirePermissionsProcessor();
  const ScriptProcessor_js_1 = requireScriptProcessor();
  const SessionProcessor_js_1 = requireSessionProcessor();
  const StorageProcessor_js_1 = requireStorageProcessor();
  const WebExtensionProcessor_js_1 = requireWebExtensionProcessor();
  const OutgoingMessage_js_1 = requireOutgoingMessage();
  let CommandProcessor$1 = class CommandProcessor extends EventEmitter_js_1.EventEmitter {
    // keep-sorted start
    #bluetoothProcessor;
    #browserCdpClient;
    #browserProcessor;
    #browsingContextProcessor;
    #cdpProcessor;
    #emulationProcessor;
    #inputProcessor;
    #networkProcessor;
    #permissionsProcessor;
    #scriptProcessor;
    #sessionProcessor;
    #storageProcessor;
    #webExtensionProcessor;
    // keep-sorted end
    #parser;
    #logger;
    constructor(cdpConnection, browserCdpClient, eventManager, browsingContextStorage, realmStorage, preloadScriptStorage, networkStorage, mapperOptionsStorage, bluetoothProcessor, userContextStorage, parser = new BidiNoOpParser_js_1.BidiNoOpParser(), initConnection, logger) {
      super();
      this.#browserCdpClient = browserCdpClient;
      this.#parser = parser;
      this.#logger = logger;
      this.#bluetoothProcessor = bluetoothProcessor;
      this.#browserProcessor = new BrowserProcessor_js_1.BrowserProcessor(browserCdpClient, browsingContextStorage, mapperOptionsStorage, userContextStorage);
      this.#browsingContextProcessor = new BrowsingContextProcessor_js_1.BrowsingContextProcessor(browserCdpClient, browsingContextStorage, userContextStorage, eventManager);
      this.#cdpProcessor = new CdpProcessor_js_1.CdpProcessor(browsingContextStorage, realmStorage, cdpConnection, browserCdpClient);
      this.#emulationProcessor = new EmulationProcessor_js_1.EmulationProcessor(browsingContextStorage, userContextStorage);
      this.#inputProcessor = new InputProcessor_js_1.InputProcessor(browsingContextStorage);
      this.#networkProcessor = new NetworkProcessor_js_1.NetworkProcessor(browsingContextStorage, networkStorage, userContextStorage);
      this.#permissionsProcessor = new PermissionsProcessor_js_1.PermissionsProcessor(browserCdpClient);
      this.#scriptProcessor = new ScriptProcessor_js_1.ScriptProcessor(eventManager, browsingContextStorage, realmStorage, preloadScriptStorage, userContextStorage, logger);
      this.#sessionProcessor = new SessionProcessor_js_1.SessionProcessor(eventManager, browserCdpClient, initConnection);
      this.#storageProcessor = new StorageProcessor_js_1.StorageProcessor(browserCdpClient, browsingContextStorage, logger);
      this.#webExtensionProcessor = new WebExtensionProcessor_js_1.WebExtensionProcessor(browserCdpClient);
    }
    async #processCommand(command) {
      switch (command.method) {
        // Bluetooth module
        // keep-sorted start block=yes
        case "bluetooth.disableSimulation":
          return await this.#bluetoothProcessor.disableSimulation(this.#parser.parseDisableSimulationParameters(command.params));
        case "bluetooth.handleRequestDevicePrompt":
          return await this.#bluetoothProcessor.handleRequestDevicePrompt(this.#parser.parseHandleRequestDevicePromptParams(command.params));
        case "bluetooth.simulateAdapter":
          return await this.#bluetoothProcessor.simulateAdapter(this.#parser.parseSimulateAdapterParameters(command.params));
        case "bluetooth.simulateAdvertisement":
          return await this.#bluetoothProcessor.simulateAdvertisement(this.#parser.parseSimulateAdvertisementParameters(command.params));
        case "bluetooth.simulateCharacteristic":
          return await this.#bluetoothProcessor.simulateCharacteristic(this.#parser.parseSimulateCharacteristicParameters(command.params));
        case "bluetooth.simulateCharacteristicResponse":
          return await this.#bluetoothProcessor.simulateCharacteristicResponse(this.#parser.parseSimulateCharacteristicResponseParameters(command.params));
        case "bluetooth.simulateDescriptor":
          return await this.#bluetoothProcessor.simulateDescriptor(this.#parser.parseSimulateDescriptorParameters(command.params));
        case "bluetooth.simulateDescriptorResponse":
          return await this.#bluetoothProcessor.simulateDescriptorResponse(this.#parser.parseSimulateDescriptorResponseParameters(command.params));
        case "bluetooth.simulateGattConnectionResponse":
          return await this.#bluetoothProcessor.simulateGattConnectionResponse(this.#parser.parseSimulateGattConnectionResponseParameters(command.params));
        case "bluetooth.simulateGattDisconnection":
          return await this.#bluetoothProcessor.simulateGattDisconnection(this.#parser.parseSimulateGattDisconnectionParameters(command.params));
        case "bluetooth.simulatePreconnectedPeripheral":
          return await this.#bluetoothProcessor.simulatePreconnectedPeripheral(this.#parser.parseSimulatePreconnectedPeripheralParameters(command.params));
        case "bluetooth.simulateService":
          return await this.#bluetoothProcessor.simulateService(this.#parser.parseSimulateServiceParameters(command.params));
        // keep-sorted end
        // Browser module
        // keep-sorted start block=yes
        case "browser.close":
          return this.#browserProcessor.close();
        case "browser.createUserContext":
          return await this.#browserProcessor.createUserContext(this.#parser.parseCreateUserContextParameters(command.params));
        case "browser.getClientWindows":
          return await this.#browserProcessor.getClientWindows();
        case "browser.getUserContexts":
          return await this.#browserProcessor.getUserContexts();
        case "browser.removeUserContext":
          return await this.#browserProcessor.removeUserContext(this.#parser.parseRemoveUserContextParameters(command.params));
        case "browser.setClientWindowState":
          this.#parser.parseSetClientWindowStateParameters(command.params);
          throw new protocol_js_1.UnknownErrorException(`Method ${command.method} is not implemented.`);
        // keep-sorted end
        // Browsing Context module
        // keep-sorted start block=yes
        case "browsingContext.activate":
          return await this.#browsingContextProcessor.activate(this.#parser.parseActivateParams(command.params));
        case "browsingContext.captureScreenshot":
          return await this.#browsingContextProcessor.captureScreenshot(this.#parser.parseCaptureScreenshotParams(command.params));
        case "browsingContext.close":
          return await this.#browsingContextProcessor.close(this.#parser.parseCloseParams(command.params));
        case "browsingContext.create":
          return await this.#browsingContextProcessor.create(this.#parser.parseCreateParams(command.params));
        case "browsingContext.getTree":
          return this.#browsingContextProcessor.getTree(this.#parser.parseGetTreeParams(command.params));
        case "browsingContext.handleUserPrompt":
          return await this.#browsingContextProcessor.handleUserPrompt(this.#parser.parseHandleUserPromptParams(command.params));
        case "browsingContext.locateNodes":
          return await this.#browsingContextProcessor.locateNodes(this.#parser.parseLocateNodesParams(command.params));
        case "browsingContext.navigate":
          return await this.#browsingContextProcessor.navigate(this.#parser.parseNavigateParams(command.params));
        case "browsingContext.print":
          return await this.#browsingContextProcessor.print(this.#parser.parsePrintParams(command.params));
        case "browsingContext.reload":
          return await this.#browsingContextProcessor.reload(this.#parser.parseReloadParams(command.params));
        case "browsingContext.setViewport":
          return await this.#browsingContextProcessor.setViewport(this.#parser.parseSetViewportParams(command.params));
        case "browsingContext.traverseHistory":
          return await this.#browsingContextProcessor.traverseHistory(this.#parser.parseTraverseHistoryParams(command.params));
        // keep-sorted end
        // CDP module
        // keep-sorted start block=yes
        case "goog:cdp.getSession":
          return this.#cdpProcessor.getSession(this.#parser.parseGetSessionParams(command.params));
        case "goog:cdp.resolveRealm":
          return this.#cdpProcessor.resolveRealm(this.#parser.parseResolveRealmParams(command.params));
        case "goog:cdp.sendCommand":
          return await this.#cdpProcessor.sendCommand(this.#parser.parseSendCommandParams(command.params));
        // keep-sorted end
        // Emulation module
        // keep-sorted start block=yes
        case "emulation.setGeolocationOverride":
          return await this.#emulationProcessor.setGeolocationOverride(this.#parser.parseSetGeolocationOverrideParams(command.params));
        case "emulation.setLocaleOverride":
          return await this.#emulationProcessor.setLocaleOverride(this.#parser.parseSetLocaleOverrideParams(command.params));
        case "emulation.setScreenOrientationOverride":
          return await this.#emulationProcessor.setScreenOrientationOverride(this.#parser.parseSetScreenOrientationOverrideParams(command.params));
        case "emulation.setTimezoneOverride":
          return await this.#emulationProcessor.setTimezoneOverride(this.#parser.parseSetTimezoneOverrideParams(command.params));
        // keep-sorted end
        // Input module
        // keep-sorted start block=yes
        case "input.performActions":
          return await this.#inputProcessor.performActions(this.#parser.parsePerformActionsParams(command.params));
        case "input.releaseActions":
          return await this.#inputProcessor.releaseActions(this.#parser.parseReleaseActionsParams(command.params));
        case "input.setFiles":
          return await this.#inputProcessor.setFiles(this.#parser.parseSetFilesParams(command.params));
        // keep-sorted end
        // Network module
        // keep-sorted start block=yes
        case "network.addDataCollector":
          return await this.#networkProcessor.addDataCollector(this.#parser.parseAddDataCollectorParams(command.params));
        case "network.addIntercept":
          return await this.#networkProcessor.addIntercept(this.#parser.parseAddInterceptParams(command.params));
        case "network.continueRequest":
          return await this.#networkProcessor.continueRequest(this.#parser.parseContinueRequestParams(command.params));
        case "network.continueResponse":
          return await this.#networkProcessor.continueResponse(this.#parser.parseContinueResponseParams(command.params));
        case "network.continueWithAuth":
          return await this.#networkProcessor.continueWithAuth(this.#parser.parseContinueWithAuthParams(command.params));
        case "network.disownData":
          return this.#networkProcessor.disownData(this.#parser.parseDisownDataParams(command.params));
        case "network.failRequest":
          return await this.#networkProcessor.failRequest(this.#parser.parseFailRequestParams(command.params));
        case "network.getData":
          return await this.#networkProcessor.getData(this.#parser.parseGetDataParams(command.params));
        case "network.provideResponse":
          return await this.#networkProcessor.provideResponse(this.#parser.parseProvideResponseParams(command.params));
        case "network.removeDataCollector":
          return await this.#networkProcessor.removeDataCollector(this.#parser.parseRemoveDataCollectorParams(command.params));
        case "network.removeIntercept":
          return await this.#networkProcessor.removeIntercept(this.#parser.parseRemoveInterceptParams(command.params));
        case "network.setCacheBehavior":
          return await this.#networkProcessor.setCacheBehavior(this.#parser.parseSetCacheBehavior(command.params));
        // keep-sorted end
        // Permissions module
        // keep-sorted start block=yes
        case "permissions.setPermission":
          return await this.#permissionsProcessor.setPermissions(this.#parser.parseSetPermissionsParams(command.params));
        // keep-sorted end
        // Script module
        // keep-sorted start block=yes
        case "script.addPreloadScript":
          return await this.#scriptProcessor.addPreloadScript(this.#parser.parseAddPreloadScriptParams(command.params));
        case "script.callFunction":
          return await this.#scriptProcessor.callFunction(this.#parser.parseCallFunctionParams(this.#processTargetParams(command.params)));
        case "script.disown":
          return await this.#scriptProcessor.disown(this.#parser.parseDisownParams(this.#processTargetParams(command.params)));
        case "script.evaluate":
          return await this.#scriptProcessor.evaluate(this.#parser.parseEvaluateParams(this.#processTargetParams(command.params)));
        case "script.getRealms":
          return this.#scriptProcessor.getRealms(this.#parser.parseGetRealmsParams(command.params));
        case "script.removePreloadScript":
          return await this.#scriptProcessor.removePreloadScript(this.#parser.parseRemovePreloadScriptParams(command.params));
        // keep-sorted end
        // Session module
        // keep-sorted start block=yes
        case "session.end":
          throw new protocol_js_1.UnknownErrorException(`Method ${command.method} is not implemented.`);
        case "session.new":
          return await this.#sessionProcessor.new(command.params);
        case "session.status":
          return this.#sessionProcessor.status();
        case "session.subscribe":
          return await this.#sessionProcessor.subscribe(this.#parser.parseSubscribeParams(command.params), command["goog:channel"]);
        case "session.unsubscribe":
          return await this.#sessionProcessor.unsubscribe(this.#parser.parseUnsubscribeParams(command.params), command["goog:channel"]);
        // keep-sorted end
        // Storage module
        // keep-sorted start block=yes
        case "storage.deleteCookies":
          return await this.#storageProcessor.deleteCookies(this.#parser.parseDeleteCookiesParams(command.params));
        case "storage.getCookies":
          return await this.#storageProcessor.getCookies(this.#parser.parseGetCookiesParams(command.params));
        case "storage.setCookie":
          return await this.#storageProcessor.setCookie(this.#parser.parseSetCookieParams(command.params));
        // keep-sorted end
        // WebExtension module
        // keep-sorted start block=yes
        case "webExtension.install":
          return await this.#webExtensionProcessor.install(this.#parser.parseInstallParams(command.params));
        case "webExtension.uninstall":
          return await this.#webExtensionProcessor.uninstall(this.#parser.parseUninstallParams(command.params));
      }
      throw new protocol_js_1.UnknownCommandException(`Unknown command '${command?.method}'.`);
    }
    // Workaround for as zod.union always take the first schema
    // https://github.com/w3c/webdriver-bidi/issues/635
    #processTargetParams(params) {
      if (typeof params === "object" && params && "target" in params && typeof params.target === "object" && params.target && "context" in params.target) {
        delete params.target["realm"];
      }
      return params;
    }
    async processCommand(command) {
      try {
        const result = await this.#processCommand(command);
        const response = {
          type: "success",
          id: command.id,
          result
        };
        this.emit("response", {
          message: OutgoingMessage_js_1.OutgoingMessage.createResolved(response, command["goog:channel"]),
          event: command.method
        });
      } catch (e) {
        if (e instanceof protocol_js_1.Exception) {
          this.emit("response", {
            message: OutgoingMessage_js_1.OutgoingMessage.createResolved(e.toErrorResponse(command.id), command["goog:channel"]),
            event: command.method
          });
        } else {
          const error = e;
          this.#logger?.(log_js_1.LogType.bidi, error);
          const errorException = this.#browserCdpClient.isCloseError(e) ? new protocol_js_1.NoSuchFrameException(`Browsing context is gone`) : new protocol_js_1.UnknownErrorException(error.message, error.stack);
          this.emit("response", {
            message: OutgoingMessage_js_1.OutgoingMessage.createResolved(errorException.toErrorResponse(command.id), command["goog:channel"]),
            event: command.method
          });
        }
      }
    }
  };
  CommandProcessor.CommandProcessor = CommandProcessor$1;
  return CommandProcessor;
}
var MapperOptions = {};
var hasRequiredMapperOptions;
function requireMapperOptions() {
  if (hasRequiredMapperOptions) return MapperOptions;
  hasRequiredMapperOptions = 1;
  Object.defineProperty(MapperOptions, "__esModule", { value: true });
  MapperOptions.MapperOptionsStorage = void 0;
  class MapperOptionsStorage {
    mapperOptions;
  }
  MapperOptions.MapperOptionsStorage = MapperOptionsStorage;
  return MapperOptions;
}
var BluetoothProcessor = {};
var hasRequiredBluetoothProcessor;
function requireBluetoothProcessor() {
  if (hasRequiredBluetoothProcessor) return BluetoothProcessor;
  hasRequiredBluetoothProcessor = 1;
  Object.defineProperty(BluetoothProcessor, "__esModule", { value: true });
  BluetoothProcessor.BluetoothProcessor = void 0;
  const protocol_js_1 = requireProtocol();
  class BluetoothGattItem {
    id;
    uuid;
    constructor(id, uuid2) {
      this.id = id;
      this.uuid = uuid2;
    }
  }
  class BluetoothDescriptor extends BluetoothGattItem {
    characteristic;
    constructor(id, uuid2, characteristic) {
      super(id, uuid2);
      this.characteristic = characteristic;
    }
  }
  class BluetoothCharacteristic extends BluetoothGattItem {
    descriptors = /* @__PURE__ */ new Map();
    service;
    constructor(id, uuid2, service) {
      super(id, uuid2);
      this.service = service;
    }
  }
  class BluetoothService extends BluetoothGattItem {
    characteristics = /* @__PURE__ */ new Map();
    device;
    constructor(id, uuid2, device) {
      super(id, uuid2);
      this.device = device;
    }
  }
  class BluetoothDevice {
    address;
    services = /* @__PURE__ */ new Map();
    constructor(address) {
      this.address = address;
    }
  }
  let BluetoothProcessor$1 = class BluetoothProcessor {
    #eventManager;
    #browsingContextStorage;
    #bluetoothDevices = /* @__PURE__ */ new Map();
    // A map from a characteristic id from CDP to its BluetoothCharacteristic object.
    #bluetoothCharacteristics = /* @__PURE__ */ new Map();
    // A map from a descriptor id from CDP to its BluetoothDescriptor object.
    #bluetoothDescriptors = /* @__PURE__ */ new Map();
    constructor(eventManager, browsingContextStorage) {
      this.#eventManager = eventManager;
      this.#browsingContextStorage = browsingContextStorage;
    }
    #getDevice(address) {
      const device = this.#bluetoothDevices.get(address);
      if (!device) {
        throw new protocol_js_1.InvalidArgumentException(`Bluetooth device with address ${address} does not exist`);
      }
      return device;
    }
    #getService(device, serviceUuid) {
      const service = device.services.get(serviceUuid);
      if (!service) {
        throw new protocol_js_1.InvalidArgumentException(`Service with UUID ${serviceUuid} on device ${device.address} does not exist`);
      }
      return service;
    }
    #getCharacteristic(service, characteristicUuid) {
      const characteristic = service.characteristics.get(characteristicUuid);
      if (!characteristic) {
        throw new protocol_js_1.InvalidArgumentException(`Characteristic with UUID ${characteristicUuid} does not exist for service ${service.uuid} on device ${service.device.address}`);
      }
      return characteristic;
    }
    #getDescriptor(characteristic, descriptorUuid) {
      const descriptor = characteristic.descriptors.get(descriptorUuid);
      if (!descriptor) {
        throw new protocol_js_1.InvalidArgumentException(`Descriptor with UUID ${descriptorUuid} does not exist for characteristic ${characteristic.uuid} on service ${characteristic.service.uuid} on device ${characteristic.service.device.address}`);
      }
      return descriptor;
    }
    async simulateAdapter(params) {
      if (params.state === void 0) {
        throw new protocol_js_1.InvalidArgumentException(`Parameter "state" is required for creating a Bluetooth adapter`);
      }
      const context = this.#browsingContextStorage.getContext(params.context);
      await context.cdpTarget.browserCdpClient.sendCommand("BluetoothEmulation.disable");
      this.#bluetoothDevices.clear();
      this.#bluetoothCharacteristics.clear();
      this.#bluetoothDescriptors.clear();
      await context.cdpTarget.browserCdpClient.sendCommand("BluetoothEmulation.enable", {
        state: params.state,
        leSupported: params.leSupported ?? true
      });
      return {};
    }
    async disableSimulation(params) {
      const context = this.#browsingContextStorage.getContext(params.context);
      await context.cdpTarget.browserCdpClient.sendCommand("BluetoothEmulation.disable");
      this.#bluetoothDevices.clear();
      this.#bluetoothCharacteristics.clear();
      this.#bluetoothDescriptors.clear();
      return {};
    }
    async simulatePreconnectedPeripheral(params) {
      if (this.#bluetoothDevices.has(params.address)) {
        throw new protocol_js_1.InvalidArgumentException(`Bluetooth device with address ${params.address} already exists`);
      }
      const context = this.#browsingContextStorage.getContext(params.context);
      await context.cdpTarget.browserCdpClient.sendCommand("BluetoothEmulation.simulatePreconnectedPeripheral", {
        address: params.address,
        name: params.name,
        knownServiceUuids: params.knownServiceUuids,
        manufacturerData: params.manufacturerData
      });
      this.#bluetoothDevices.set(params.address, new BluetoothDevice(params.address));
      return {};
    }
    async simulateAdvertisement(params) {
      const context = this.#browsingContextStorage.getContext(params.context);
      await context.cdpTarget.browserCdpClient.sendCommand("BluetoothEmulation.simulateAdvertisement", {
        entry: params.scanEntry
      });
      return {};
    }
    async simulateCharacteristic(params) {
      const device = this.#getDevice(params.address);
      const service = this.#getService(device, params.serviceUuid);
      const context = this.#browsingContextStorage.getContext(params.context);
      switch (params.type) {
        case "add": {
          if (params.characteristicProperties === void 0) {
            throw new protocol_js_1.InvalidArgumentException(`Parameter "characteristicProperties" is required for adding a Bluetooth characteristic`);
          }
          if (service.characteristics.has(params.characteristicUuid)) {
            throw new protocol_js_1.InvalidArgumentException(`Characteristic with UUID ${params.characteristicUuid} already exists`);
          }
          const response = await context.cdpTarget.browserCdpClient.sendCommand("BluetoothEmulation.addCharacteristic", {
            serviceId: service.id,
            characteristicUuid: params.characteristicUuid,
            properties: params.characteristicProperties
          });
          const characteristic = new BluetoothCharacteristic(response.characteristicId, params.characteristicUuid, service);
          service.characteristics.set(params.characteristicUuid, characteristic);
          this.#bluetoothCharacteristics.set(characteristic.id, characteristic);
          return {};
        }
        case "remove": {
          if (params.characteristicProperties !== void 0) {
            throw new protocol_js_1.InvalidArgumentException(`Parameter "characteristicProperties" should not be provided for removing a Bluetooth characteristic`);
          }
          const characteristic = this.#getCharacteristic(service, params.characteristicUuid);
          await context.cdpTarget.browserCdpClient.sendCommand("BluetoothEmulation.removeCharacteristic", {
            characteristicId: characteristic.id
          });
          service.characteristics.delete(params.characteristicUuid);
          this.#bluetoothCharacteristics.delete(characteristic.id);
          return {};
        }
        default:
          throw new protocol_js_1.InvalidArgumentException(`Parameter "type" of ${params.type} is not supported`);
      }
    }
    async simulateCharacteristicResponse(params) {
      const context = this.#browsingContextStorage.getContext(params.context);
      const device = this.#getDevice(params.address);
      const service = this.#getService(device, params.serviceUuid);
      const characteristic = this.#getCharacteristic(service, params.characteristicUuid);
      await context.cdpTarget.browserCdpClient.sendCommand("BluetoothEmulation.simulateCharacteristicOperationResponse", {
        characteristicId: characteristic.id,
        type: params.type,
        code: params.code,
        ...params.data && {
          data: btoa(String.fromCharCode(...params.data))
        }
      });
      return {};
    }
    async simulateDescriptor(params) {
      const device = this.#getDevice(params.address);
      const service = this.#getService(device, params.serviceUuid);
      const characteristic = this.#getCharacteristic(service, params.characteristicUuid);
      const context = this.#browsingContextStorage.getContext(params.context);
      switch (params.type) {
        case "add": {
          if (characteristic.descriptors.has(params.descriptorUuid)) {
            throw new protocol_js_1.InvalidArgumentException(`Descriptor with UUID ${params.descriptorUuid} already exists`);
          }
          const response = await context.cdpTarget.browserCdpClient.sendCommand("BluetoothEmulation.addDescriptor", {
            characteristicId: characteristic.id,
            descriptorUuid: params.descriptorUuid
          });
          const descriptor = new BluetoothDescriptor(response.descriptorId, params.descriptorUuid, characteristic);
          characteristic.descriptors.set(params.descriptorUuid, descriptor);
          this.#bluetoothDescriptors.set(descriptor.id, descriptor);
          return {};
        }
        case "remove": {
          const descriptor = this.#getDescriptor(characteristic, params.descriptorUuid);
          await context.cdpTarget.browserCdpClient.sendCommand("BluetoothEmulation.removeDescriptor", {
            descriptorId: descriptor.id
          });
          characteristic.descriptors.delete(params.descriptorUuid);
          this.#bluetoothDescriptors.delete(descriptor.id);
          return {};
        }
        default:
          throw new protocol_js_1.InvalidArgumentException(`Parameter "type" of ${params.type} is not supported`);
      }
    }
    async simulateDescriptorResponse(params) {
      const context = this.#browsingContextStorage.getContext(params.context);
      const device = this.#getDevice(params.address);
      const service = this.#getService(device, params.serviceUuid);
      const characteristic = this.#getCharacteristic(service, params.characteristicUuid);
      const descriptor = this.#getDescriptor(characteristic, params.descriptorUuid);
      await context.cdpTarget.browserCdpClient.sendCommand("BluetoothEmulation.simulateDescriptorOperationResponse", {
        descriptorId: descriptor.id,
        type: params.type,
        code: params.code,
        ...params.data && {
          data: btoa(String.fromCharCode(...params.data))
        }
      });
      return {};
    }
    async simulateGattConnectionResponse(params) {
      const context = this.#browsingContextStorage.getContext(params.context);
      await context.cdpTarget.browserCdpClient.sendCommand("BluetoothEmulation.simulateGATTOperationResponse", {
        address: params.address,
        type: "connection",
        code: params.code
      });
      return {};
    }
    async simulateGattDisconnection(params) {
      const context = this.#browsingContextStorage.getContext(params.context);
      await context.cdpTarget.browserCdpClient.sendCommand("BluetoothEmulation.simulateGATTDisconnection", {
        address: params.address
      });
      return {};
    }
    async simulateService(params) {
      const device = this.#getDevice(params.address);
      const context = this.#browsingContextStorage.getContext(params.context);
      switch (params.type) {
        case "add": {
          if (device.services.has(params.uuid)) {
            throw new protocol_js_1.InvalidArgumentException(`Service with UUID ${params.uuid} already exists`);
          }
          const response = await context.cdpTarget.browserCdpClient.sendCommand("BluetoothEmulation.addService", {
            address: params.address,
            serviceUuid: params.uuid
          });
          device.services.set(params.uuid, new BluetoothService(response.serviceId, params.uuid, device));
          return {};
        }
        case "remove": {
          const service = this.#getService(device, params.uuid);
          await context.cdpTarget.browserCdpClient.sendCommand("BluetoothEmulation.removeService", {
            serviceId: service.id
          });
          device.services.delete(params.uuid);
          return {};
        }
        default:
          throw new protocol_js_1.InvalidArgumentException(`Parameter "type" of ${params.type} is not supported`);
      }
    }
    onCdpTargetCreated(cdpTarget) {
      cdpTarget.cdpClient.on("DeviceAccess.deviceRequestPrompted", (event) => {
        this.#eventManager.registerEvent({
          type: "event",
          method: "bluetooth.requestDevicePromptUpdated",
          params: {
            context: cdpTarget.id,
            prompt: event.id,
            devices: event.devices
          }
        }, cdpTarget.id);
      });
      cdpTarget.browserCdpClient.on("BluetoothEmulation.gattOperationReceived", async (event) => {
        switch (event.type) {
          case "connection":
            this.#eventManager.registerEvent({
              type: "event",
              method: "bluetooth.gattConnectionAttempted",
              params: {
                context: cdpTarget.id,
                address: event.address
              }
            }, cdpTarget.id);
            return;
          case "discovery":
            await cdpTarget.browserCdpClient.sendCommand("BluetoothEmulation.simulateGATTOperationResponse", {
              address: event.address,
              type: "discovery",
              code: 0
            });
        }
      });
      cdpTarget.browserCdpClient.on("BluetoothEmulation.characteristicOperationReceived", (event) => {
        if (!this.#bluetoothCharacteristics.has(event.characteristicId)) {
          return;
        }
        let type;
        if (event.type === "write") {
          if (event.writeType === "write-default-deprecated") {
            return;
          }
          type = event.writeType;
        } else {
          type = event.type;
        }
        const characteristic = this.#bluetoothCharacteristics.get(event.characteristicId);
        this.#eventManager.registerEvent({
          type: "event",
          method: "bluetooth.characteristicEventGenerated",
          params: {
            context: cdpTarget.id,
            address: characteristic.service.device.address,
            serviceUuid: characteristic.service.uuid,
            characteristicUuid: characteristic.uuid,
            type,
            ...event.data && {
              data: Array.from(atob(event.data), (c) => c.charCodeAt(0))
            }
          }
        }, cdpTarget.id);
      });
      cdpTarget.browserCdpClient.on("BluetoothEmulation.descriptorOperationReceived", (event) => {
        if (!this.#bluetoothDescriptors.has(event.descriptorId)) {
          return;
        }
        const descriptor = this.#bluetoothDescriptors.get(event.descriptorId);
        this.#eventManager.registerEvent({
          type: "event",
          method: "bluetooth.descriptorEventGenerated",
          params: {
            context: cdpTarget.id,
            address: descriptor.characteristic.service.device.address,
            serviceUuid: descriptor.characteristic.service.uuid,
            characteristicUuid: descriptor.characteristic.uuid,
            descriptorUuid: descriptor.uuid,
            type: event.type,
            ...event.data && {
              data: Array.from(atob(event.data), (c) => c.charCodeAt(0))
            }
          }
        }, cdpTarget.id);
      });
    }
    async handleRequestDevicePrompt(params) {
      const context = this.#browsingContextStorage.getContext(params.context);
      if (params.accept) {
        await context.cdpTarget.cdpClient.sendCommand("DeviceAccess.selectPrompt", {
          id: params.prompt,
          deviceId: params.device
        });
      } else {
        await context.cdpTarget.cdpClient.sendCommand("DeviceAccess.cancelPrompt", {
          id: params.prompt
        });
      }
      return {};
    }
  };
  BluetoothProcessor.BluetoothProcessor = BluetoothProcessor$1;
  return BluetoothProcessor;
}
var UserContextStorage = {};
var UserContextConfig = {};
var hasRequiredUserContextConfig;
function requireUserContextConfig() {
  if (hasRequiredUserContextConfig) return UserContextConfig;
  hasRequiredUserContextConfig = 1;
  Object.defineProperty(UserContextConfig, "__esModule", { value: true });
  UserContextConfig.UserContextConfig = void 0;
  let UserContextConfig$1 = class UserContextConfig {
    /**
     * The ID of the user context.
     */
    userContextId;
    acceptInsecureCerts;
    viewport;
    devicePixelRatio;
    geolocation;
    locale;
    screenOrientation;
    timezone;
    userPromptHandler;
    constructor(userContextId) {
      this.userContextId = userContextId;
    }
  };
  UserContextConfig.UserContextConfig = UserContextConfig$1;
  return UserContextConfig;
}
var hasRequiredUserContextStorage;
function requireUserContextStorage() {
  if (hasRequiredUserContextStorage) return UserContextStorage;
  hasRequiredUserContextStorage = 1;
  Object.defineProperty(UserContextStorage, "__esModule", { value: true });
  UserContextStorage.UserContextStorage = void 0;
  const protocol_js_1 = requireProtocol();
  const UserContextConfig_js_1 = requireUserContextConfig();
  let UserContextStorage$1 = class UserContextStorage {
    #browserClient;
    #userConfigMap = /* @__PURE__ */ new Map();
    constructor(browserClient) {
      this.#browserClient = browserClient;
    }
    async getUserContexts() {
      const result = await this.#browserClient.sendCommand("Target.getBrowserContexts");
      return [
        {
          userContext: "default"
        },
        ...result.browserContextIds.map((id) => {
          return {
            userContext: id
          };
        })
      ];
    }
    getConfig(userContextId) {
      const userContextConfig = this.#userConfigMap.get(userContextId) ?? new UserContextConfig_js_1.UserContextConfig(userContextId);
      this.#userConfigMap.set(userContextId, userContextConfig);
      return userContextConfig;
    }
    async verifyUserContextIdList(userContextIds) {
      const foundContexts = /* @__PURE__ */ new Set();
      if (!userContextIds.length) {
        return foundContexts;
      }
      const userContexts = await this.getUserContexts();
      const knownUserContextIds = new Set(userContexts.map((userContext) => userContext.userContext));
      for (const userContextId of userContextIds) {
        if (!knownUserContextIds.has(userContextId)) {
          throw new protocol_js_1.NoSuchUserContextException(`User context ${userContextId} not found`);
        }
        foundContexts.add(userContextId);
      }
      return foundContexts;
    }
  };
  UserContextStorage.UserContextStorage = UserContextStorage$1;
  return UserContextStorage;
}
var CdpTargetManager = {};
var BrowsingContextImpl = {};
var Deferred = {};
var hasRequiredDeferred;
function requireDeferred() {
  if (hasRequiredDeferred) return Deferred;
  hasRequiredDeferred = 1;
  Object.defineProperty(Deferred, "__esModule", { value: true });
  Deferred.Deferred = void 0;
  let Deferred$1 = class Deferred {
    #isFinished = false;
    #promise;
    #result;
    #resolve;
    #reject;
    get isFinished() {
      return this.#isFinished;
    }
    get result() {
      if (!this.#isFinished) {
        throw new Error("Deferred is not finished yet");
      }
      return this.#result;
    }
    constructor() {
      this.#promise = new Promise((resolve, reject) => {
        this.#resolve = resolve;
        this.#reject = reject;
      });
      this.#promise.catch((_error) => {
      });
    }
    then(onFulfilled, onRejected) {
      return this.#promise.then(onFulfilled, onRejected);
    }
    catch(onRejected) {
      return this.#promise.catch(onRejected);
    }
    resolve(value) {
      this.#result = value;
      if (!this.#isFinished) {
        this.#isFinished = true;
        this.#resolve(value);
      }
    }
    reject(reason) {
      if (!this.#isFinished) {
        this.#isFinished = true;
        this.#reject(reason);
      }
    }
    finally(onFinally) {
      return this.#promise.finally(onFinally);
    }
    [Symbol.toStringTag] = "Promise";
  };
  Deferred.Deferred = Deferred$1;
  return Deferred;
}
var time = {};
var hasRequiredTime;
function requireTime() {
  if (hasRequiredTime) return time;
  hasRequiredTime = 1;
  Object.defineProperty(time, "__esModule", { value: true });
  time.getTimestamp = getTimestamp;
  function getTimestamp() {
    return (/* @__PURE__ */ new Date()).getTime();
  }
  return time;
}
var unitConversions = {};
var hasRequiredUnitConversions;
function requireUnitConversions() {
  if (hasRequiredUnitConversions) return unitConversions;
  hasRequiredUnitConversions = 1;
  Object.defineProperty(unitConversions, "__esModule", { value: true });
  unitConversions.inchesFromCm = inchesFromCm;
  function inchesFromCm(cm) {
    return cm / 2.54;
  }
  return unitConversions;
}
var SharedId = {};
var hasRequiredSharedId;
function requireSharedId() {
  if (hasRequiredSharedId) return SharedId;
  hasRequiredSharedId = 1;
  Object.defineProperty(SharedId, "__esModule", { value: true });
  SharedId.getSharedId = getSharedId;
  SharedId.parseSharedId = parseSharedId;
  const SHARED_ID_DIVIDER = "_element_";
  function getSharedId(frameId, documentId, backendNodeId) {
    return `f.${frameId}.d.${documentId}.e.${backendNodeId}`;
  }
  function parseLegacySharedId(sharedId) {
    const match = sharedId.match(new RegExp(`(.*)${SHARED_ID_DIVIDER}(.*)`));
    if (!match) {
      return null;
    }
    const documentId = match[1];
    const elementId = match[2];
    if (documentId === void 0 || elementId === void 0) {
      return null;
    }
    const backendNodeId = parseInt(elementId ?? "");
    if (isNaN(backendNodeId)) {
      return null;
    }
    return {
      documentId,
      backendNodeId
    };
  }
  function parseSharedId(sharedId) {
    const legacyFormattedSharedId = parseLegacySharedId(sharedId);
    if (legacyFormattedSharedId !== null) {
      return { ...legacyFormattedSharedId, frameId: void 0 };
    }
    const match = sharedId.match(/f\.(.*)\.d\.(.*)\.e\.([0-9]*)/);
    if (!match) {
      return null;
    }
    const frameId = match[1];
    const documentId = match[2];
    const elementId = match[3];
    if (frameId === void 0 || documentId === void 0 || elementId === void 0) {
      return null;
    }
    const backendNodeId = parseInt(elementId ?? "");
    if (isNaN(backendNodeId)) {
      return null;
    }
    return {
      frameId,
      documentId,
      backendNodeId
    };
  }
  return SharedId;
}
var WindowRealm$1 = {};
var Realm$1 = {};
var hasRequiredRealm;
function requireRealm() {
  if (hasRequiredRealm) return Realm$1;
  hasRequiredRealm = 1;
  Object.defineProperty(Realm$1, "__esModule", { value: true });
  Realm$1.Realm = void 0;
  const protocol_js_1 = requireProtocol();
  const log_js_1 = requireLog();
  const uuid_js_1 = requireUuid();
  const ChannelProxy_js_1 = requireChannelProxy();
  class Realm2 {
    #cdpClient;
    #eventManager;
    #executionContextId;
    #logger;
    #origin;
    #realmId;
    realmStorage;
    constructor(cdpClient, eventManager, executionContextId, logger, origin, realmId, realmStorage) {
      this.#cdpClient = cdpClient;
      this.#eventManager = eventManager;
      this.#executionContextId = executionContextId;
      this.#logger = logger;
      this.#origin = origin;
      this.#realmId = realmId;
      this.realmStorage = realmStorage;
      this.realmStorage.addRealm(this);
    }
    cdpToBidiValue(cdpValue, resultOwnership) {
      const bidiValue = this.serializeForBiDi(cdpValue.result.deepSerializedValue, /* @__PURE__ */ new Map());
      if (cdpValue.result.objectId) {
        const objectId = cdpValue.result.objectId;
        if (resultOwnership === "root") {
          bidiValue.handle = objectId;
          this.realmStorage.knownHandlesToRealmMap.set(objectId, this.realmId);
        } else {
          void this.#releaseObject(objectId).catch((error) => this.#logger?.(log_js_1.LogType.debugError, error));
        }
      }
      return bidiValue;
    }
    isHidden() {
      return false;
    }
    /**
     * Relies on the CDP to implement proper BiDi serialization, except:
     * * CDP integer property `backendNodeId` is replaced with `sharedId` of
     * `{documentId}_element_{backendNodeId}`;
     * * CDP integer property `weakLocalObjectReference` is replaced with UUID `internalId`
     * using unique-per serialization `internalIdMap`.
     * * CDP type `platformobject` is replaced with `object`.
     * @param deepSerializedValue - CDP value to be converted to BiDi.
     * @param internalIdMap - Map from CDP integer `weakLocalObjectReference` to BiDi UUID
     * `internalId`.
     */
    serializeForBiDi(deepSerializedValue, internalIdMap) {
      if (Object.hasOwn(deepSerializedValue, "weakLocalObjectReference")) {
        const weakLocalObjectReference = deepSerializedValue.weakLocalObjectReference;
        if (!internalIdMap.has(weakLocalObjectReference)) {
          internalIdMap.set(weakLocalObjectReference, (0, uuid_js_1.uuidv4)());
        }
        deepSerializedValue.internalId = internalIdMap.get(weakLocalObjectReference);
        delete deepSerializedValue["weakLocalObjectReference"];
      }
      if (deepSerializedValue.type === "node" && deepSerializedValue.value && Object.hasOwn(deepSerializedValue.value, "frameId")) {
        delete deepSerializedValue.value["frameId"];
      }
      if (deepSerializedValue.type === "platformobject") {
        return { type: "object" };
      }
      const bidiValue = deepSerializedValue.value;
      if (bidiValue === void 0) {
        return deepSerializedValue;
      }
      if (["array", "set", "htmlcollection", "nodelist"].includes(deepSerializedValue.type)) {
        for (const i in bidiValue) {
          bidiValue[i] = this.serializeForBiDi(bidiValue[i], internalIdMap);
        }
      }
      if (["object", "map"].includes(deepSerializedValue.type)) {
        for (const i in bidiValue) {
          bidiValue[i] = [
            this.serializeForBiDi(bidiValue[i][0], internalIdMap),
            this.serializeForBiDi(bidiValue[i][1], internalIdMap)
          ];
        }
      }
      return deepSerializedValue;
    }
    get realmId() {
      return this.#realmId;
    }
    get executionContextId() {
      return this.#executionContextId;
    }
    get origin() {
      return this.#origin;
    }
    get source() {
      return {
        realm: this.realmId
      };
    }
    get cdpClient() {
      return this.#cdpClient;
    }
    get baseInfo() {
      return {
        realm: this.realmId,
        origin: this.origin
      };
    }
    async evaluate(expression, awaitPromise, resultOwnership = "none", serializationOptions = {}, userActivation = false, includeCommandLineApi = false) {
      const cdpEvaluateResult = await this.cdpClient.sendCommand("Runtime.evaluate", {
        contextId: this.executionContextId,
        expression,
        awaitPromise,
        serializationOptions: Realm2.#getSerializationOptions("deep", serializationOptions),
        userGesture: userActivation,
        includeCommandLineAPI: includeCommandLineApi
      });
      if (cdpEvaluateResult.exceptionDetails) {
        return await this.#getExceptionResult(cdpEvaluateResult.exceptionDetails, 0, resultOwnership);
      }
      return {
        realm: this.realmId,
        result: this.cdpToBidiValue(cdpEvaluateResult, resultOwnership),
        type: "success"
      };
    }
    #registerEvent(event) {
      if (this.associatedBrowsingContexts.length === 0) {
        this.#eventManager.registerGlobalEvent(event);
      } else {
        for (const browsingContext of this.associatedBrowsingContexts) {
          this.#eventManager.registerEvent(event, browsingContext.id);
        }
      }
    }
    initialize() {
      if (!this.isHidden()) {
        this.#registerEvent({
          type: "event",
          method: protocol_js_1.ChromiumBidi.Script.EventNames.RealmCreated,
          params: this.realmInfo
        });
      }
    }
    /**
     * Serializes a given CDP object into BiDi, keeping references in the
     * target's `globalThis`.
     */
    async serializeCdpObject(cdpRemoteObject, resultOwnership) {
      const argument = Realm2.#cdpRemoteObjectToCallArgument(cdpRemoteObject);
      const cdpValue = await this.cdpClient.sendCommand("Runtime.callFunctionOn", {
        functionDeclaration: String((remoteObject) => remoteObject),
        awaitPromise: false,
        arguments: [argument],
        serializationOptions: {
          serialization: "deep"
        },
        executionContextId: this.executionContextId
      });
      return this.cdpToBidiValue(cdpValue, resultOwnership);
    }
    static #cdpRemoteObjectToCallArgument(cdpRemoteObject) {
      if (cdpRemoteObject.objectId !== void 0) {
        return { objectId: cdpRemoteObject.objectId };
      }
      if (cdpRemoteObject.unserializableValue !== void 0) {
        return { unserializableValue: cdpRemoteObject.unserializableValue };
      }
      return { value: cdpRemoteObject.value };
    }
    /**
     * Gets the string representation of an object. This is equivalent to
     * calling `toString()` on the object value.
     */
    async stringifyObject(cdpRemoteObject) {
      const { result } = await this.cdpClient.sendCommand("Runtime.callFunctionOn", {
        functionDeclaration: String((remoteObject) => String(remoteObject)),
        awaitPromise: false,
        arguments: [cdpRemoteObject],
        returnByValue: true,
        executionContextId: this.executionContextId
      });
      return result.value;
    }
    async #flattenKeyValuePairs(mappingLocalValue) {
      const keyValueArray = await Promise.all(mappingLocalValue.map(async ([key, value]) => {
        let keyArg;
        if (typeof key === "string") {
          keyArg = { value: key };
        } else {
          keyArg = await this.deserializeForCdp(key);
        }
        const valueArg = await this.deserializeForCdp(value);
        return [keyArg, valueArg];
      }));
      return keyValueArray.flat();
    }
    async #flattenValueList(listLocalValue) {
      return await Promise.all(listLocalValue.map((localValue) => this.deserializeForCdp(localValue)));
    }
    async #serializeCdpExceptionDetails(cdpExceptionDetails, lineOffset, resultOwnership) {
      const callFrames = cdpExceptionDetails.stackTrace?.callFrames.map((frame) => ({
        url: frame.url,
        functionName: frame.functionName,
        lineNumber: frame.lineNumber - lineOffset,
        columnNumber: frame.columnNumber
      })) ?? [];
      const exception = cdpExceptionDetails.exception;
      return {
        exception: await this.serializeCdpObject(exception, resultOwnership),
        columnNumber: cdpExceptionDetails.columnNumber,
        lineNumber: cdpExceptionDetails.lineNumber - lineOffset,
        stackTrace: {
          callFrames
        },
        text: await this.stringifyObject(exception) || cdpExceptionDetails.text
      };
    }
    async callFunction(functionDeclaration, awaitPromise, thisLocalValue = {
      type: "undefined"
    }, argumentsLocalValues = [], resultOwnership = "none", serializationOptions = {}, userActivation = false) {
      const callFunctionAndSerializeScript = `(...args) => {
      function callFunction(f, args) {
        const deserializedThis = args.shift();
        const deserializedArgs = args;
        return f.apply(deserializedThis, deserializedArgs);
      }
      return callFunction((
        ${functionDeclaration}
      ), args);
    }`;
      const thisAndArgumentsList = [
        await this.deserializeForCdp(thisLocalValue),
        ...await Promise.all(argumentsLocalValues.map(async (argumentLocalValue) => await this.deserializeForCdp(argumentLocalValue)))
      ];
      let cdpCallFunctionResult;
      try {
        cdpCallFunctionResult = await this.cdpClient.sendCommand("Runtime.callFunctionOn", {
          functionDeclaration: callFunctionAndSerializeScript,
          awaitPromise,
          arguments: thisAndArgumentsList,
          serializationOptions: Realm2.#getSerializationOptions("deep", serializationOptions),
          executionContextId: this.executionContextId,
          userGesture: userActivation
        });
      } catch (error) {
        if (error.code === -32e3 && [
          "Could not find object with given id",
          "Argument should belong to the same JavaScript world as target object",
          "Invalid remote object id"
        ].includes(error.message)) {
          throw new protocol_js_1.NoSuchHandleException("Handle was not found.");
        }
        throw error;
      }
      if (cdpCallFunctionResult.exceptionDetails) {
        return await this.#getExceptionResult(cdpCallFunctionResult.exceptionDetails, 1, resultOwnership);
      }
      return {
        type: "success",
        result: this.cdpToBidiValue(cdpCallFunctionResult, resultOwnership),
        realm: this.realmId
      };
    }
    async deserializeForCdp(localValue) {
      if ("handle" in localValue && localValue.handle) {
        return { objectId: localValue.handle };
      } else if ("handle" in localValue || "sharedId" in localValue) {
        throw new protocol_js_1.NoSuchHandleException("Handle was not found.");
      }
      switch (localValue.type) {
        case "undefined":
          return { unserializableValue: "undefined" };
        case "null":
          return { unserializableValue: "null" };
        case "string":
          return { value: localValue.value };
        case "number":
          if (localValue.value === "NaN") {
            return { unserializableValue: "NaN" };
          } else if (localValue.value === "-0") {
            return { unserializableValue: "-0" };
          } else if (localValue.value === "Infinity") {
            return { unserializableValue: "Infinity" };
          } else if (localValue.value === "-Infinity") {
            return { unserializableValue: "-Infinity" };
          }
          return {
            value: localValue.value
          };
        case "boolean":
          return { value: Boolean(localValue.value) };
        case "bigint":
          return {
            unserializableValue: `BigInt(${JSON.stringify(localValue.value)})`
          };
        case "date":
          return {
            unserializableValue: `new Date(Date.parse(${JSON.stringify(localValue.value)}))`
          };
        case "regexp":
          return {
            unserializableValue: `new RegExp(${JSON.stringify(localValue.value.pattern)}, ${JSON.stringify(localValue.value.flags)})`
          };
        case "map": {
          const keyValueArray = await this.#flattenKeyValuePairs(localValue.value);
          const { result } = await this.cdpClient.sendCommand("Runtime.callFunctionOn", {
            functionDeclaration: String((...args) => {
              const result2 = /* @__PURE__ */ new Map();
              for (let i = 0; i < args.length; i += 2) {
                result2.set(args[i], args[i + 1]);
              }
              return result2;
            }),
            awaitPromise: false,
            arguments: keyValueArray,
            returnByValue: false,
            executionContextId: this.executionContextId
          });
          return { objectId: result.objectId };
        }
        case "object": {
          const keyValueArray = await this.#flattenKeyValuePairs(localValue.value);
          const { result } = await this.cdpClient.sendCommand("Runtime.callFunctionOn", {
            functionDeclaration: String((...args) => {
              const result2 = {};
              for (let i = 0; i < args.length; i += 2) {
                const key = args[i];
                result2[key] = args[i + 1];
              }
              return result2;
            }),
            awaitPromise: false,
            arguments: keyValueArray,
            returnByValue: false,
            executionContextId: this.executionContextId
          });
          return { objectId: result.objectId };
        }
        case "array": {
          const args = await this.#flattenValueList(localValue.value);
          const { result } = await this.cdpClient.sendCommand("Runtime.callFunctionOn", {
            functionDeclaration: String((...args2) => args2),
            awaitPromise: false,
            arguments: args,
            returnByValue: false,
            executionContextId: this.executionContextId
          });
          return { objectId: result.objectId };
        }
        case "set": {
          const args = await this.#flattenValueList(localValue.value);
          const { result } = await this.cdpClient.sendCommand("Runtime.callFunctionOn", {
            functionDeclaration: String((...args2) => new Set(args2)),
            awaitPromise: false,
            arguments: args,
            returnByValue: false,
            executionContextId: this.executionContextId
          });
          return { objectId: result.objectId };
        }
        case "channel": {
          const channelProxy = new ChannelProxy_js_1.ChannelProxy(localValue.value, this.#logger);
          const channelProxySendMessageHandle = await channelProxy.init(this, this.#eventManager);
          return { objectId: channelProxySendMessageHandle };
        }
      }
      throw new Error(`Value ${JSON.stringify(localValue)} is not deserializable.`);
    }
    async #getExceptionResult(exceptionDetails, lineOffset, resultOwnership) {
      return {
        exceptionDetails: await this.#serializeCdpExceptionDetails(exceptionDetails, lineOffset, resultOwnership),
        realm: this.realmId,
        type: "exception"
      };
    }
    static #getSerializationOptions(serialization, serializationOptions) {
      return {
        serialization,
        additionalParameters: Realm2.#getAdditionalSerializationParameters(serializationOptions),
        ...Realm2.#getMaxObjectDepth(serializationOptions)
      };
    }
    static #getAdditionalSerializationParameters(serializationOptions) {
      const additionalParameters = {};
      if (serializationOptions.maxDomDepth !== void 0) {
        additionalParameters["maxNodeDepth"] = serializationOptions.maxDomDepth === null ? 1e3 : serializationOptions.maxDomDepth;
      }
      if (serializationOptions.includeShadowTree !== void 0) {
        additionalParameters["includeShadowTree"] = serializationOptions.includeShadowTree;
      }
      return additionalParameters;
    }
    static #getMaxObjectDepth(serializationOptions) {
      return serializationOptions.maxObjectDepth === void 0 || serializationOptions.maxObjectDepth === null ? {} : { maxDepth: serializationOptions.maxObjectDepth };
    }
    async #releaseObject(handle) {
      try {
        await this.cdpClient.sendCommand("Runtime.releaseObject", {
          objectId: handle
        });
      } catch (error) {
        if (!(error.code === -32e3 && error.message === "Invalid remote object id")) {
          throw error;
        }
      }
    }
    async disown(handle) {
      if (this.realmStorage.knownHandlesToRealmMap.get(handle) !== this.realmId) {
        return;
      }
      await this.#releaseObject(handle);
      this.realmStorage.knownHandlesToRealmMap.delete(handle);
    }
    dispose() {
      this.#registerEvent({
        type: "event",
        method: protocol_js_1.ChromiumBidi.Script.EventNames.RealmDestroyed,
        params: {
          realm: this.realmId
        }
      });
    }
  }
  Realm$1.Realm = Realm2;
  return Realm$1;
}
var hasRequiredWindowRealm;
function requireWindowRealm() {
  if (hasRequiredWindowRealm) return WindowRealm$1;
  hasRequiredWindowRealm = 1;
  Object.defineProperty(WindowRealm$1, "__esModule", { value: true });
  WindowRealm$1.WindowRealm = void 0;
  const protocol_js_1 = requireProtocol();
  const Realm_js_1 = requireRealm();
  const SharedId_js_1 = requireSharedId();
  class WindowRealm2 extends Realm_js_1.Realm {
    #browsingContextId;
    #browsingContextStorage;
    sandbox;
    constructor(browsingContextId, browsingContextStorage, cdpClient, eventManager, executionContextId, logger, origin, realmId, realmStorage, sandbox) {
      super(cdpClient, eventManager, executionContextId, logger, origin, realmId, realmStorage);
      this.#browsingContextId = browsingContextId;
      this.#browsingContextStorage = browsingContextStorage;
      this.sandbox = sandbox;
      this.initialize();
    }
    #getBrowsingContextId(navigableId) {
      const maybeBrowsingContext = this.#browsingContextStorage.getAllContexts().find((context) => context.navigableId === navigableId);
      return maybeBrowsingContext?.id ?? "UNKNOWN";
    }
    get browsingContext() {
      return this.#browsingContextStorage.getContext(this.#browsingContextId);
    }
    /**
     * Do not expose to user hidden realms.
     */
    isHidden() {
      return this.realmStorage.hiddenSandboxes.has(this.sandbox);
    }
    get associatedBrowsingContexts() {
      return [this.browsingContext];
    }
    get realmType() {
      return "window";
    }
    get realmInfo() {
      return {
        ...this.baseInfo,
        type: this.realmType,
        context: this.#browsingContextId,
        sandbox: this.sandbox
      };
    }
    get source() {
      return {
        realm: this.realmId,
        context: this.browsingContext.id
      };
    }
    serializeForBiDi(deepSerializedValue, internalIdMap) {
      const bidiValue = deepSerializedValue.value;
      if (deepSerializedValue.type === "node" && bidiValue !== void 0) {
        if (Object.hasOwn(bidiValue, "backendNodeId")) {
          let navigableId = this.browsingContext.navigableId ?? "UNKNOWN";
          if (Object.hasOwn(bidiValue, "loaderId")) {
            navigableId = bidiValue.loaderId;
            delete bidiValue["loaderId"];
          }
          deepSerializedValue.sharedId = (0, SharedId_js_1.getSharedId)(this.#getBrowsingContextId(navigableId), navigableId, bidiValue.backendNodeId);
          delete bidiValue["backendNodeId"];
        }
        if (Object.hasOwn(bidiValue, "children")) {
          for (const i in bidiValue.children) {
            bidiValue.children[i] = this.serializeForBiDi(bidiValue.children[i], internalIdMap);
          }
        }
        if (Object.hasOwn(bidiValue, "shadowRoot") && bidiValue.shadowRoot !== null) {
          bidiValue.shadowRoot = this.serializeForBiDi(bidiValue.shadowRoot, internalIdMap);
        }
        if (bidiValue.namespaceURI === "") {
          bidiValue.namespaceURI = null;
        }
      }
      return super.serializeForBiDi(deepSerializedValue, internalIdMap);
    }
    async deserializeForCdp(localValue) {
      if ("sharedId" in localValue && localValue.sharedId) {
        const parsedSharedId = (0, SharedId_js_1.parseSharedId)(localValue.sharedId);
        if (parsedSharedId === null) {
          throw new protocol_js_1.NoSuchNodeException(`SharedId "${localValue.sharedId}" was not found.`);
        }
        const { documentId, backendNodeId } = parsedSharedId;
        if (this.browsingContext.navigableId !== documentId) {
          throw new protocol_js_1.NoSuchNodeException(`SharedId "${localValue.sharedId}" belongs to different document. Current document is ${this.browsingContext.navigableId}.`);
        }
        try {
          const { object } = await this.cdpClient.sendCommand("DOM.resolveNode", {
            backendNodeId,
            executionContextId: this.executionContextId
          });
          return { objectId: object.objectId };
        } catch (error) {
          if (error.code === -32e3 && error.message === "No node with given id found") {
            throw new protocol_js_1.NoSuchNodeException(`SharedId "${localValue.sharedId}" was not found.`);
          }
          throw new protocol_js_1.UnknownErrorException(error.message, error.stack);
        }
      }
      return await super.deserializeForCdp(localValue);
    }
    async evaluate(expression, awaitPromise, resultOwnership, serializationOptions, userActivation, includeCommandLineApi) {
      await this.#browsingContextStorage.getContext(this.#browsingContextId).targetUnblockedOrThrow();
      return await super.evaluate(expression, awaitPromise, resultOwnership, serializationOptions, userActivation, includeCommandLineApi);
    }
    async callFunction(functionDeclaration, awaitPromise, thisLocalValue, argumentsLocalValues, resultOwnership, serializationOptions, userActivation) {
      await this.#browsingContextStorage.getContext(this.#browsingContextId).targetUnblockedOrThrow();
      return await super.callFunction(functionDeclaration, awaitPromise, thisLocalValue, argumentsLocalValues, resultOwnership, serializationOptions, userActivation);
    }
  }
  WindowRealm$1.WindowRealm = WindowRealm2;
  return WindowRealm$1;
}
var NavigationTracker = {};
var urlHelpers = {};
var hasRequiredUrlHelpers;
function requireUrlHelpers() {
  if (hasRequiredUrlHelpers) return urlHelpers;
  hasRequiredUrlHelpers = 1;
  Object.defineProperty(urlHelpers, "__esModule", { value: true });
  urlHelpers.urlMatchesAboutBlank = urlMatchesAboutBlank;
  function urlMatchesAboutBlank(url) {
    if (url === "") {
      return true;
    }
    try {
      const parsedUrl = new URL(url);
      const schema = parsedUrl.protocol.replace(/:$/, "");
      return schema.toLowerCase() === "about" && parsedUrl.pathname.toLowerCase() === "blank" && parsedUrl.username === "" && parsedUrl.password === "" && parsedUrl.host === "";
    } catch (err) {
      if (err instanceof TypeError) {
        return false;
      }
      throw err;
    }
  }
  return urlHelpers;
}
var hasRequiredNavigationTracker;
function requireNavigationTracker() {
  if (hasRequiredNavigationTracker) return NavigationTracker;
  hasRequiredNavigationTracker = 1;
  Object.defineProperty(NavigationTracker, "__esModule", { value: true });
  NavigationTracker.NavigationTracker = NavigationTracker.NavigationState = NavigationTracker.NavigationResult = void 0;
  const protocol_js_1 = requireProtocol();
  const Deferred_js_1 = requireDeferred();
  const log_js_1 = requireLog();
  const time_js_1 = requireTime();
  const urlHelpers_js_1 = requireUrlHelpers();
  const uuid_js_1 = requireUuid();
  class NavigationResult {
    eventName;
    message;
    constructor(eventName, message) {
      this.eventName = eventName;
      this.message = message;
    }
  }
  NavigationTracker.NavigationResult = NavigationResult;
  class NavigationState {
    navigationId = (0, uuid_js_1.uuidv4)();
    #browsingContextId;
    #started = false;
    #finished = new Deferred_js_1.Deferred();
    url;
    loaderId;
    #isInitial;
    #eventManager;
    committed = new Deferred_js_1.Deferred();
    isFragmentNavigation;
    get finished() {
      return this.#finished;
    }
    constructor(url, browsingContextId, isInitial, eventManager) {
      this.#browsingContextId = browsingContextId;
      this.url = url;
      this.#isInitial = isInitial;
      this.#eventManager = eventManager;
    }
    navigationInfo() {
      return {
        context: this.#browsingContextId,
        navigation: this.navigationId,
        timestamp: (0, time_js_1.getTimestamp)(),
        url: this.url
      };
    }
    start() {
      if (
        // Initial navigation should not be reported.
        !this.#isInitial && // No need in reporting started navigation twice.
        !this.#started && // No need for reporting fragment navigations. Step 13 vs step 16 of the spec:
        // https://html.spec.whatwg.org/#beginning-navigation:webdriver-bidi-navigation-started
        !this.isFragmentNavigation
      ) {
        this.#eventManager.registerEvent({
          type: "event",
          method: protocol_js_1.ChromiumBidi.BrowsingContext.EventNames.NavigationStarted,
          params: this.navigationInfo()
        }, this.#browsingContextId);
      }
      this.#started = true;
    }
    #finish(navigationResult) {
      this.#started = true;
      if (!this.#isInitial && !this.#finished.isFinished && navigationResult.eventName !== "browsingContext.load") {
        this.#eventManager.registerEvent({
          type: "event",
          method: navigationResult.eventName,
          params: this.navigationInfo()
        }, this.#browsingContextId);
      }
      this.#finished.resolve(navigationResult);
    }
    frameNavigated() {
      this.committed.resolve();
      if (!this.#isInitial) {
        this.#eventManager.registerEvent({
          type: "event",
          method: protocol_js_1.ChromiumBidi.BrowsingContext.EventNames.NavigationCommitted,
          params: this.navigationInfo()
        }, this.#browsingContextId);
      }
    }
    fragmentNavigated() {
      this.committed.resolve();
      this.#finish(new NavigationResult(
        "browsingContext.fragmentNavigated"
        /* NavigationEventName.FragmentNavigated */
      ));
    }
    load() {
      this.#finish(new NavigationResult(
        "browsingContext.load"
        /* NavigationEventName.Load */
      ));
    }
    fail(message) {
      this.#finish(new NavigationResult(this.committed.isFinished ? "browsingContext.navigationAborted" : "browsingContext.navigationFailed", message));
    }
  }
  NavigationTracker.NavigationState = NavigationState;
  let NavigationTracker$1 = class NavigationTracker2 {
    #eventManager;
    #logger;
    #loaderIdToNavigationsMap = /* @__PURE__ */ new Map();
    #browsingContextId;
    /**
     * Last committed navigation is committed, but is not guaranteed to be finished, as it
     * can still wait for `load` or `DOMContentLoaded` events.
     */
    #lastCommittedNavigation;
    /**
     * Pending navigation is a navigation that is started but not yet committed.
     */
    #pendingNavigation;
    // Flags if the initial navigation to `about:blank` is in progress.
    #isInitialNavigation = true;
    constructor(url, browsingContextId, eventManager, logger) {
      this.#browsingContextId = browsingContextId;
      this.#eventManager = eventManager;
      this.#logger = logger;
      this.#isInitialNavigation = true;
      this.#lastCommittedNavigation = new NavigationState(url, browsingContextId, (0, urlHelpers_js_1.urlMatchesAboutBlank)(url), this.#eventManager);
    }
    /**
     * Returns current started ongoing navigation. It can be either a started pending
     * navigation, or one is already navigated.
     */
    get currentNavigationId() {
      if (this.#pendingNavigation?.isFragmentNavigation === false) {
        return this.#pendingNavigation.navigationId;
      }
      return this.#lastCommittedNavigation.navigationId;
    }
    /**
     * Flags if the current navigation relates to the initial to `about:blank` navigation.
     */
    get isInitialNavigation() {
      return this.#isInitialNavigation;
    }
    /**
     * Url of the last navigated navigation.
     */
    get url() {
      return this.#lastCommittedNavigation.url;
    }
    /**
     * Creates a pending navigation e.g. when navigation command is called. Required to
     * provide navigation id before the actual navigation is started. It will be used when
     * navigation started. Can be aborted, failed, fragment navigated, or became a current
     * navigation.
     */
    createPendingNavigation(url, canBeInitialNavigation = false) {
      this.#logger?.(log_js_1.LogType.debug, "createCommandNavigation");
      this.#isInitialNavigation = canBeInitialNavigation && this.#isInitialNavigation && (0, urlHelpers_js_1.urlMatchesAboutBlank)(url);
      this.#pendingNavigation?.fail("navigation canceled by concurrent navigation");
      const navigation = new NavigationState(url, this.#browsingContextId, this.#isInitialNavigation, this.#eventManager);
      this.#pendingNavigation = navigation;
      return navigation;
    }
    dispose() {
      this.#pendingNavigation?.fail("navigation canceled by context disposal");
      this.#lastCommittedNavigation.fail("navigation canceled by context disposal");
    }
    // Update the current url.
    onTargetInfoChanged(url) {
      this.#logger?.(log_js_1.LogType.debug, `onTargetInfoChanged ${url}`);
      this.#lastCommittedNavigation.url = url;
    }
    #getNavigationForFrameNavigated(url, loaderId) {
      if (this.#loaderIdToNavigationsMap.has(loaderId)) {
        return this.#loaderIdToNavigationsMap.get(loaderId);
      }
      if (this.#pendingNavigation !== void 0 && this.#pendingNavigation.loaderId === void 0) {
        return this.#pendingNavigation;
      }
      return this.createPendingNavigation(url, true);
    }
    /**
     * @param {string} unreachableUrl indicated the navigation is actually failed.
     */
    frameNavigated(url, loaderId, unreachableUrl) {
      this.#logger?.(log_js_1.LogType.debug, `frameNavigated ${url}`);
      if (unreachableUrl !== void 0) {
        const navigation2 = this.#loaderIdToNavigationsMap.get(loaderId) ?? this.#pendingNavigation ?? this.createPendingNavigation(unreachableUrl, true);
        navigation2.url = unreachableUrl;
        navigation2.start();
        navigation2.fail("the requested url is unreachable");
        return;
      }
      const navigation = this.#getNavigationForFrameNavigated(url, loaderId);
      if (navigation !== this.#lastCommittedNavigation) {
        this.#lastCommittedNavigation.fail("navigation canceled by concurrent navigation");
      }
      navigation.url = url;
      navigation.loaderId = loaderId;
      this.#loaderIdToNavigationsMap.set(loaderId, navigation);
      navigation.start();
      navigation.frameNavigated();
      this.#lastCommittedNavigation = navigation;
      if (this.#pendingNavigation === navigation) {
        this.#pendingNavigation = void 0;
      }
    }
    navigatedWithinDocument(url, navigationType) {
      this.#logger?.(log_js_1.LogType.debug, `navigatedWithinDocument ${url}, ${navigationType}`);
      this.#lastCommittedNavigation.url = url;
      if (navigationType !== "fragment") {
        return;
      }
      const fragmentNavigation = this.#pendingNavigation?.isFragmentNavigation === true ? this.#pendingNavigation : new NavigationState(url, this.#browsingContextId, false, this.#eventManager);
      fragmentNavigation.fragmentNavigated();
      if (fragmentNavigation === this.#pendingNavigation) {
        this.#pendingNavigation = void 0;
      }
    }
    /**
     * Required to mark navigation as fully complete.
     * TODO: navigation should be complete when it became the current one on
     * `Page.frameNavigated` or on navigating command finished with a new loader Id.
     */
    loadPageEvent(loaderId) {
      this.#logger?.(log_js_1.LogType.debug, "loadPageEvent");
      this.#isInitialNavigation = false;
      this.#loaderIdToNavigationsMap.get(loaderId)?.load();
    }
    /**
     * Fail navigation due to navigation command failed.
     */
    failNavigation(navigation, errorText) {
      this.#logger?.(log_js_1.LogType.debug, "failCommandNavigation");
      navigation.fail(errorText);
    }
    /**
     * Updates the navigation's `loaderId` and sets it as current one, if it is a
     * cross-document navigation.
     */
    navigationCommandFinished(navigation, loaderId) {
      this.#logger?.(log_js_1.LogType.debug, `finishCommandNavigation ${navigation.navigationId}, ${loaderId}`);
      if (loaderId !== void 0) {
        navigation.loaderId = loaderId;
        this.#loaderIdToNavigationsMap.set(loaderId, navigation);
      }
      navigation.isFragmentNavigation = loaderId === void 0;
    }
    frameStartedNavigating(url, loaderId, navigationType) {
      this.#logger?.(log_js_1.LogType.debug, `frameStartedNavigating ${url}, ${loaderId}`);
      if (this.#pendingNavigation && this.#pendingNavigation?.loaderId !== void 0 && this.#pendingNavigation?.loaderId !== loaderId) {
        this.#pendingNavigation?.fail("navigation canceled by concurrent navigation");
        this.#pendingNavigation = void 0;
      }
      if (this.#loaderIdToNavigationsMap.has(loaderId)) {
        const existingNavigation = this.#loaderIdToNavigationsMap.get(loaderId);
        existingNavigation.isFragmentNavigation = NavigationTracker2.#isFragmentNavigation(navigationType);
        this.#pendingNavigation = existingNavigation;
        return;
      }
      const pendingNavigation = this.#pendingNavigation ?? this.createPendingNavigation(url, true);
      this.#loaderIdToNavigationsMap.set(loaderId, pendingNavigation);
      pendingNavigation.isFragmentNavigation = NavigationTracker2.#isFragmentNavigation(navigationType);
      pendingNavigation.url = url;
      pendingNavigation.loaderId = loaderId;
      pendingNavigation.start();
    }
    static #isFragmentNavigation(navigationType) {
      return ["historySameDocument", "sameDocument"].includes(navigationType);
    }
    /**
     * If there is a navigation with the loaderId equals to the network request id, it means
     * that the navigation failed.
     */
    networkLoadingFailed(loaderId, errorText) {
      this.#loaderIdToNavigationsMap.get(loaderId)?.fail(errorText);
    }
  };
  NavigationTracker.NavigationTracker = NavigationTracker$1;
  return NavigationTracker;
}
var hasRequiredBrowsingContextImpl;
function requireBrowsingContextImpl() {
  if (hasRequiredBrowsingContextImpl) return BrowsingContextImpl;
  hasRequiredBrowsingContextImpl = 1;
  var _a2;
  Object.defineProperty(BrowsingContextImpl, "__esModule", { value: true });
  BrowsingContextImpl.BrowsingContextImpl = void 0;
  BrowsingContextImpl.serializeOrigin = serializeOrigin;
  const protocol_js_1 = requireProtocol();
  const assert_js_1 = requireAssert();
  const Deferred_js_1 = requireDeferred();
  const log_js_1 = requireLog();
  const time_js_1 = requireTime();
  const unitConversions_js_1 = requireUnitConversions();
  const uuid_js_1 = requireUuid();
  const SharedId_js_1 = requireSharedId();
  const WindowRealm_js_1 = requireWindowRealm();
  const NavigationTracker_js_1 = requireNavigationTracker();
  let BrowsingContextImpl$1 = class BrowsingContextImpl {
    static LOGGER_PREFIX = `${log_js_1.LogType.debug}:browsingContext`;
    /** Direct children browsing contexts. */
    #children = /* @__PURE__ */ new Set();
    /** The ID of this browsing context. */
    #id;
    userContext;
    // Used for running helper scripts.
    #hiddenSandbox = (0, uuid_js_1.uuidv4)();
    #downloadIdToUrlMap = /* @__PURE__ */ new Map();
    /**
     * The ID of the parent browsing context.
     * If null, this is a top-level context.
     */
    #loaderId;
    #parentId = null;
    #originalOpener;
    #lifecycle = {
      DOMContentLoaded: new Deferred_js_1.Deferred(),
      load: new Deferred_js_1.Deferred()
    };
    #cdpTarget;
    #defaultRealmDeferred = new Deferred_js_1.Deferred();
    #browsingContextStorage;
    #eventManager;
    #logger;
    #navigationTracker;
    #realmStorage;
    // The deferred will be resolved when the default realm is created.
    #unhandledPromptBehavior;
    #userContextConfig;
    // Set when the user prompt is opened. Required to provide the type in closing event.
    #lastUserPromptType;
    constructor(id, parentId, userContext, userContextConfig, cdpTarget, eventManager, browsingContextStorage, realmStorage, url, originalOpener, unhandledPromptBehavior, logger) {
      this.#userContextConfig = userContextConfig;
      this.#cdpTarget = cdpTarget;
      this.#id = id;
      this.#parentId = parentId;
      this.userContext = userContext;
      this.#eventManager = eventManager;
      this.#browsingContextStorage = browsingContextStorage;
      this.#realmStorage = realmStorage;
      this.#unhandledPromptBehavior = unhandledPromptBehavior;
      this.#logger = logger;
      this.#originalOpener = originalOpener;
      this.#realmStorage.hiddenSandboxes.add(this.#hiddenSandbox);
      this.#navigationTracker = new NavigationTracker_js_1.NavigationTracker(url, id, eventManager, logger);
    }
    static create(id, parentId, userContext, userContextConfig, cdpTarget, eventManager, browsingContextStorage, realmStorage, url, originalOpener, unhandledPromptBehavior, logger) {
      const context = new _a2(id, parentId, userContext, userContextConfig, cdpTarget, eventManager, browsingContextStorage, realmStorage, url, originalOpener, unhandledPromptBehavior, logger);
      context.#initListeners();
      browsingContextStorage.addContext(context);
      if (!context.isTopLevelContext()) {
        context.parent.addChild(context.id);
      }
      eventManager.registerPromiseEvent(context.targetUnblockedOrThrow().then(() => {
        return {
          kind: "success",
          value: {
            type: "event",
            method: protocol_js_1.ChromiumBidi.BrowsingContext.EventNames.ContextCreated,
            params: {
              ...context.serializeToBidiValue(),
              // Hack to provide the initial URL of the context, as it can be changed
              // between the page target is attached and unblocked, as the page is not
              // fully paused in MPArch session (https://crbug.com/372842894).
              // TODO: remove once https://crbug.com/372842894 is addressed.
              url
            }
          }
        };
      }, (error) => {
        return {
          kind: "error",
          error
        };
      }), context.id, protocol_js_1.ChromiumBidi.BrowsingContext.EventNames.ContextCreated);
      return context;
    }
    /**
     * @see https://html.spec.whatwg.org/multipage/document-sequences.html#navigable
     */
    get navigableId() {
      return this.#loaderId;
    }
    get navigationId() {
      return this.#navigationTracker.currentNavigationId;
    }
    dispose(emitContextDestroyed) {
      this.#navigationTracker.dispose();
      this.#realmStorage.deleteRealms({
        browsingContextId: this.id
      });
      if (!this.isTopLevelContext()) {
        this.parent.#children.delete(this.id);
      }
      this.#failLifecycleIfNotFinished();
      if (emitContextDestroyed) {
        this.#eventManager.registerEvent({
          type: "event",
          method: protocol_js_1.ChromiumBidi.BrowsingContext.EventNames.ContextDestroyed,
          params: this.serializeToBidiValue(null)
        }, this.id);
      }
      this.#deleteAllChildren();
      this.#eventManager.clearBufferedEvents(this.id);
      this.#browsingContextStorage.deleteContextById(this.id);
    }
    /** Returns the ID of this context. */
    get id() {
      return this.#id;
    }
    /** Returns the parent context ID. */
    get parentId() {
      return this.#parentId;
    }
    /** Sets the parent context ID and updates parent's children. */
    set parentId(parentId) {
      if (this.#parentId !== null) {
        this.#logger?.(log_js_1.LogType.debugError, "Parent context already set");
        return;
      }
      this.#parentId = parentId;
      if (!this.isTopLevelContext()) {
        this.parent.addChild(this.id);
      }
    }
    /** Returns the parent context. */
    get parent() {
      if (this.parentId === null) {
        return null;
      }
      return this.#browsingContextStorage.getContext(this.parentId);
    }
    /** Returns all direct children contexts. */
    get directChildren() {
      return [...this.#children].map((id) => this.#browsingContextStorage.getContext(id));
    }
    /** Returns all children contexts, flattened. */
    get allChildren() {
      const children = this.directChildren;
      return children.concat(...children.map((child) => child.allChildren));
    }
    /**
     * Returns true if this is a top-level context.
     * This is the case whenever the parent context ID is null.
     */
    isTopLevelContext() {
      return this.#parentId === null;
    }
    get top() {
      let topContext = this;
      let parent = topContext.parent;
      while (parent) {
        topContext = parent;
        parent = topContext.parent;
      }
      return topContext;
    }
    addChild(childId) {
      this.#children.add(childId);
    }
    #deleteAllChildren(emitContextDestroyed = false) {
      this.directChildren.map((child) => child.dispose(emitContextDestroyed));
    }
    get cdpTarget() {
      return this.#cdpTarget;
    }
    updateCdpTarget(cdpTarget) {
      this.#cdpTarget = cdpTarget;
      this.#initListeners();
    }
    get url() {
      return this.#navigationTracker.url;
    }
    async lifecycleLoaded() {
      await this.#lifecycle.load;
    }
    async targetUnblockedOrThrow() {
      const result = await this.#cdpTarget.unblocked;
      if (result.kind === "error") {
        throw result.error;
      }
    }
    /** Returns a sandbox for internal helper scripts which is not exposed to the user.*/
    async getOrCreateHiddenSandbox() {
      return await this.#getOrCreateSandboxInternal(this.#hiddenSandbox);
    }
    /** Returns a sandbox which is exposed to user. */
    async getOrCreateUserSandbox(sandbox) {
      const realm = await this.#getOrCreateSandboxInternal(sandbox);
      if (realm.isHidden()) {
        throw new protocol_js_1.NoSuchFrameException(`Realm "${sandbox}" not found`);
      }
      return realm;
    }
    async #getOrCreateSandboxInternal(sandbox) {
      if (sandbox === void 0 || sandbox === "") {
        return await this.#defaultRealmDeferred;
      }
      let maybeSandboxes = this.#realmStorage.findRealms({
        browsingContextId: this.id,
        sandbox
      });
      if (maybeSandboxes.length === 0) {
        await this.#cdpTarget.cdpClient.sendCommand("Page.createIsolatedWorld", {
          frameId: this.id,
          worldName: sandbox
        });
        maybeSandboxes = this.#realmStorage.findRealms({
          browsingContextId: this.id,
          sandbox
        });
        (0, assert_js_1.assert)(maybeSandboxes.length !== 0);
      }
      return maybeSandboxes[0];
    }
    /**
     * Implements https://w3c.github.io/webdriver-bidi/#get-the-navigable-info.
     */
    serializeToBidiValue(maxDepth = 0, addParentField = true) {
      return {
        context: this.#id,
        url: this.url,
        userContext: this.userContext,
        originalOpener: this.#originalOpener ?? null,
        clientWindow: `${this.cdpTarget.windowId}`,
        children: maxDepth === null || maxDepth > 0 ? this.directChildren.map((c) => c.serializeToBidiValue(maxDepth === null ? maxDepth : maxDepth - 1, false)) : null,
        ...addParentField ? { parent: this.#parentId } : {}
      };
    }
    onTargetInfoChanged(params) {
      this.#navigationTracker.onTargetInfoChanged(params.targetInfo.url);
    }
    #initListeners() {
      this.#cdpTarget.cdpClient.on("Network.loadingFailed", (params) => {
        this.#navigationTracker.networkLoadingFailed(params.requestId, params.errorText);
      });
      this.#cdpTarget.cdpClient.on("Page.fileChooserOpened", (params) => {
        if (this.id !== params.frameId) {
          return;
        }
        if (this.#loaderId === void 0) {
          this.#logger?.(log_js_1.LogType.debugError, "LoaderId should be defined when file upload is shown", params);
          return;
        }
        const element = params.backendNodeId === void 0 ? void 0 : {
          sharedId: (0, SharedId_js_1.getSharedId)(this.id, this.#loaderId, params.backendNodeId)
        };
        this.#eventManager.registerEvent({
          type: "event",
          method: protocol_js_1.ChromiumBidi.Input.EventNames.FileDialogOpened,
          params: {
            context: this.id,
            multiple: params.mode === "selectMultiple",
            element
          }
        }, this.id);
      });
      this.#cdpTarget.cdpClient.on("Page.frameNavigated", (params) => {
        if (this.id !== params.frame.id) {
          return;
        }
        this.#navigationTracker.frameNavigated(
          params.frame.url + (params.frame.urlFragment ?? ""),
          params.frame.loaderId,
          // `unreachableUrl` indicates if the navigation failed.
          params.frame.unreachableUrl
        );
        this.#deleteAllChildren();
        this.#documentChanged(params.frame.loaderId);
      });
      this.#cdpTarget.cdpClient.on("Page.frameStartedNavigating", (params) => {
        if (this.id !== params.frameId) {
          return;
        }
        this.#navigationTracker.frameStartedNavigating(params.url, params.loaderId, params.navigationType);
      });
      this.#cdpTarget.cdpClient.on("Page.navigatedWithinDocument", (params) => {
        if (this.id !== params.frameId) {
          return;
        }
        this.#navigationTracker.navigatedWithinDocument(params.url, params.navigationType);
        if (params.navigationType === "historyApi") {
          this.#eventManager.registerEvent({
            type: "event",
            method: "browsingContext.historyUpdated",
            params: {
              context: this.id,
              timestamp: (0, time_js_1.getTimestamp)(),
              url: this.#navigationTracker.url
            }
          }, this.id);
          return;
        }
      });
      this.#cdpTarget.cdpClient.on("Page.lifecycleEvent", (params) => {
        if (this.id !== params.frameId) {
          return;
        }
        if (params.name === "init") {
          this.#documentChanged(params.loaderId);
          return;
        }
        if (params.name === "commit") {
          this.#loaderId = params.loaderId;
          return;
        }
        if (!this.#loaderId) {
          this.#loaderId = params.loaderId;
        }
        if (params.loaderId !== this.#loaderId) {
          return;
        }
        switch (params.name) {
          case "DOMContentLoaded":
            if (!this.#navigationTracker.isInitialNavigation) {
              this.#eventManager.registerEvent({
                type: "event",
                method: protocol_js_1.ChromiumBidi.BrowsingContext.EventNames.DomContentLoaded,
                params: {
                  context: this.id,
                  navigation: this.#navigationTracker.currentNavigationId,
                  timestamp: (0, time_js_1.getTimestamp)(),
                  url: this.#navigationTracker.url
                }
              }, this.id);
            }
            this.#lifecycle.DOMContentLoaded.resolve();
            break;
          case "load":
            if (!this.#navigationTracker.isInitialNavigation) {
              this.#eventManager.registerEvent({
                type: "event",
                method: protocol_js_1.ChromiumBidi.BrowsingContext.EventNames.Load,
                params: {
                  context: this.id,
                  navigation: this.#navigationTracker.currentNavigationId,
                  timestamp: (0, time_js_1.getTimestamp)(),
                  url: this.#navigationTracker.url
                }
              }, this.id);
            }
            this.#navigationTracker.loadPageEvent(params.loaderId);
            this.#lifecycle.load.resolve();
            break;
        }
      });
      this.#cdpTarget.cdpClient.on("Runtime.executionContextCreated", (params) => {
        const { auxData, name, uniqueId, id } = params.context;
        if (!auxData || auxData.frameId !== this.id) {
          return;
        }
        let origin;
        let sandbox;
        switch (auxData.type) {
          case "isolated":
            sandbox = name;
            if (!this.#defaultRealmDeferred.isFinished) {
              this.#logger?.(log_js_1.LogType.debugError, "Unexpectedly, isolated realm created before the default one");
            }
            origin = this.#defaultRealmDeferred.isFinished ? this.#defaultRealmDeferred.result.origin : (
              // This fallback is not expected to be ever reached.
              ""
            );
            break;
          case "default":
            origin = serializeOrigin(params.context.origin);
            break;
          default:
            return;
        }
        const realm = new WindowRealm_js_1.WindowRealm(this.id, this.#browsingContextStorage, this.#cdpTarget.cdpClient, this.#eventManager, id, this.#logger, origin, uniqueId, this.#realmStorage, sandbox);
        if (auxData.isDefault) {
          this.#defaultRealmDeferred.resolve(realm);
          void Promise.all(this.#cdpTarget.getChannels().map((channel) => channel.startListenerFromWindow(realm, this.#eventManager)));
        }
      });
      this.#cdpTarget.cdpClient.on("Runtime.executionContextDestroyed", (params) => {
        if (this.#defaultRealmDeferred.isFinished && this.#defaultRealmDeferred.result.executionContextId === params.executionContextId) {
          this.#defaultRealmDeferred = new Deferred_js_1.Deferred();
        }
        this.#realmStorage.deleteRealms({
          cdpSessionId: this.#cdpTarget.cdpSessionId,
          executionContextId: params.executionContextId
        });
      });
      this.#cdpTarget.cdpClient.on("Runtime.executionContextsCleared", () => {
        if (!this.#defaultRealmDeferred.isFinished) {
          this.#defaultRealmDeferred.reject(new protocol_js_1.UnknownErrorException("execution contexts cleared"));
        }
        this.#defaultRealmDeferred = new Deferred_js_1.Deferred();
        this.#realmStorage.deleteRealms({
          cdpSessionId: this.#cdpTarget.cdpSessionId
        });
      });
      this.#cdpTarget.cdpClient.on("Page.javascriptDialogClosed", (params) => {
        if (params.frameId && this.id !== params.frameId) {
          return;
        }
        if (!params.frameId && this.#parentId && this.#cdpTarget.cdpClient !== this.#browsingContextStorage.getContext(this.#parentId)?.cdpTarget.cdpClient) {
          return;
        }
        const accepted = params.result;
        if (this.#lastUserPromptType === void 0) {
          this.#logger?.(log_js_1.LogType.debugError, "Unexpectedly no opening prompt event before closing one");
        }
        this.#eventManager.registerEvent({
          type: "event",
          method: protocol_js_1.ChromiumBidi.BrowsingContext.EventNames.UserPromptClosed,
          params: {
            context: this.id,
            accepted,
            // `lastUserPromptType` should never be undefined here, so fallback to
            // `UNKNOWN`. The fallback is required to prevent tests from hanging while
            // waiting for the closing event. The cast is required, as the `UNKNOWN` value
            // is not standard.
            type: this.#lastUserPromptType ?? "UNKNOWN",
            userText: accepted && params.userInput ? params.userInput : void 0
          }
        }, this.id);
        this.#lastUserPromptType = void 0;
      });
      this.#cdpTarget.cdpClient.on("Page.javascriptDialogOpening", (params) => {
        if (params.frameId && this.id !== params.frameId) {
          return;
        }
        if (!params.frameId && this.#parentId && this.#cdpTarget.cdpClient !== this.#browsingContextStorage.getContext(this.#parentId)?.cdpTarget.cdpClient) {
          return;
        }
        const promptType = _a2.#getPromptType(params.type);
        this.#lastUserPromptType = promptType;
        const promptHandler = this.#getPromptHandler(promptType);
        this.#eventManager.registerEvent({
          type: "event",
          method: protocol_js_1.ChromiumBidi.BrowsingContext.EventNames.UserPromptOpened,
          params: {
            context: this.id,
            handler: promptHandler,
            type: promptType,
            message: params.message,
            ...params.type === "prompt" ? { defaultValue: params.defaultPrompt } : {}
          }
        }, this.id);
        switch (promptHandler) {
          // Based on `unhandledPromptBehavior`, check if the prompt should be handled
          // automatically (`accept`, `dismiss`) or wait for the user to do it.
          case "accept":
            void this.handleUserPrompt(true);
            break;
          case "dismiss":
            void this.handleUserPrompt(false);
            break;
        }
      });
      this.#cdpTarget.browserCdpClient.on("Browser.downloadWillBegin", (params) => {
        if (this.id !== params.frameId) {
          return;
        }
        this.#downloadIdToUrlMap.set(params.guid, params.url);
        this.#eventManager.registerEvent({
          type: "event",
          method: protocol_js_1.ChromiumBidi.BrowsingContext.EventNames.DownloadWillBegin,
          params: {
            context: this.id,
            suggestedFilename: params.suggestedFilename,
            navigation: params.guid,
            timestamp: (0, time_js_1.getTimestamp)(),
            url: params.url
          }
        }, this.id);
      });
      this.#cdpTarget.browserCdpClient.on("Browser.downloadProgress", (params) => {
        if (!this.#downloadIdToUrlMap.has(params.guid)) {
          return;
        }
        if (params.state === "inProgress") {
          return;
        }
        const url = this.#downloadIdToUrlMap.get(params.guid);
        switch (params.state) {
          case "canceled":
            this.#eventManager.registerEvent({
              type: "event",
              method: protocol_js_1.ChromiumBidi.BrowsingContext.EventNames.DownloadEnd,
              params: {
                status: "canceled",
                context: this.id,
                navigation: params.guid,
                timestamp: (0, time_js_1.getTimestamp)(),
                url
              }
            }, this.id);
            break;
          case "completed":
            this.#eventManager.registerEvent({
              type: "event",
              method: protocol_js_1.ChromiumBidi.BrowsingContext.EventNames.DownloadEnd,
              params: {
                filepath: params.filePath ?? null,
                status: "complete",
                context: this.id,
                navigation: params.guid,
                timestamp: (0, time_js_1.getTimestamp)(),
                url
              }
            }, this.id);
            break;
          default:
            throw new protocol_js_1.UnknownErrorException(`Unknown download state: ${params.state}`);
        }
      });
    }
    static #getPromptType(cdpType) {
      switch (cdpType) {
        case "alert":
          return "alert";
        case "beforeunload":
          return "beforeunload";
        case "confirm":
          return "confirm";
        case "prompt":
          return "prompt";
      }
    }
    /**
     * Returns either custom UserContext's prompt handler, global or default one.
     */
    #getPromptHandler(promptType) {
      const defaultPromptHandler = "dismiss";
      switch (promptType) {
        case "alert":
          return this.#userContextConfig.userPromptHandler?.alert ?? this.#userContextConfig.userPromptHandler?.default ?? this.#unhandledPromptBehavior?.alert ?? this.#unhandledPromptBehavior?.default ?? defaultPromptHandler;
        case "beforeunload":
          return this.#userContextConfig.userPromptHandler?.beforeUnload ?? this.#userContextConfig.userPromptHandler?.default ?? this.#unhandledPromptBehavior?.beforeUnload ?? this.#unhandledPromptBehavior?.default ?? "accept";
        case "confirm":
          return this.#userContextConfig.userPromptHandler?.confirm ?? this.#userContextConfig.userPromptHandler?.default ?? this.#unhandledPromptBehavior?.confirm ?? this.#unhandledPromptBehavior?.default ?? defaultPromptHandler;
        case "prompt":
          return this.#userContextConfig.userPromptHandler?.prompt ?? this.#userContextConfig.userPromptHandler?.default ?? this.#unhandledPromptBehavior?.prompt ?? this.#unhandledPromptBehavior?.default ?? defaultPromptHandler;
      }
    }
    #documentChanged(loaderId) {
      if (loaderId === void 0 || this.#loaderId === loaderId) {
        return;
      }
      this.#resetLifecycleIfFinished();
      this.#loaderId = loaderId;
      this.#deleteAllChildren(true);
    }
    #resetLifecycleIfFinished() {
      if (this.#lifecycle.DOMContentLoaded.isFinished) {
        this.#lifecycle.DOMContentLoaded = new Deferred_js_1.Deferred();
      } else {
        this.#logger?.(_a2.LOGGER_PREFIX, "Document changed (DOMContentLoaded)");
      }
      if (this.#lifecycle.load.isFinished) {
        this.#lifecycle.load = new Deferred_js_1.Deferred();
      } else {
        this.#logger?.(_a2.LOGGER_PREFIX, "Document changed (load)");
      }
    }
    #failLifecycleIfNotFinished() {
      if (!this.#lifecycle.DOMContentLoaded.isFinished) {
        this.#lifecycle.DOMContentLoaded.reject(new protocol_js_1.UnknownErrorException("navigation canceled"));
      }
      if (!this.#lifecycle.load.isFinished) {
        this.#lifecycle.load.reject(new protocol_js_1.UnknownErrorException("navigation canceled"));
      }
    }
    async navigate(url, wait) {
      try {
        new URL(url);
      } catch {
        throw new protocol_js_1.InvalidArgumentException(`Invalid URL: ${url}`);
      }
      const navigationState = this.#navigationTracker.createPendingNavigation(url);
      const cdpNavigatePromise = (async () => {
        const cdpNavigateResult = await this.#cdpTarget.cdpClient.sendCommand("Page.navigate", {
          url,
          frameId: this.id
        });
        if (cdpNavigateResult.errorText) {
          this.#navigationTracker.failNavigation(navigationState, cdpNavigateResult.errorText);
          throw new protocol_js_1.UnknownErrorException(cdpNavigateResult.errorText);
        }
        this.#navigationTracker.navigationCommandFinished(navigationState, cdpNavigateResult.loaderId);
        this.#documentChanged(cdpNavigateResult.loaderId);
      })();
      const result = await Promise.race([
        // No `loaderId` means same-document navigation.
        this.#waitNavigation(wait, cdpNavigatePromise, navigationState),
        // Throw an error if the navigation is canceled.
        navigationState.finished
      ]);
      if (result instanceof NavigationTracker_js_1.NavigationResult) {
        if (
          // TODO: check after decision on the spec is done:
          //  https://github.com/w3c/webdriver-bidi/issues/799.
          result.eventName === "browsingContext.navigationAborted" || result.eventName === "browsingContext.navigationFailed"
        ) {
          throw new protocol_js_1.UnknownErrorException(result.message ?? "unknown exception");
        }
      }
      return {
        navigation: navigationState.navigationId,
        // Url can change due to redirects. Get the one from commandNavigation.
        url: navigationState.url
      };
    }
    async #waitNavigation(wait, cdpCommandPromise, navigationState) {
      await Promise.all([navigationState.committed, cdpCommandPromise]);
      if (wait === "none") {
        return;
      }
      if (navigationState.isFragmentNavigation === true) {
        await navigationState.finished;
        return;
      }
      if (wait === "interactive") {
        await this.#lifecycle.DOMContentLoaded;
        return;
      }
      if (wait === "complete") {
        await this.#lifecycle.load;
        return;
      }
      throw new protocol_js_1.InvalidArgumentException(`Wait condition ${wait} is not supported`);
    }
    // TODO: support concurrent navigations analogous to `navigate`.
    async reload(ignoreCache, wait) {
      await this.targetUnblockedOrThrow();
      this.#resetLifecycleIfFinished();
      const navigationState = this.#navigationTracker.createPendingNavigation(this.#navigationTracker.url);
      const cdpReloadPromise = this.#cdpTarget.cdpClient.sendCommand("Page.reload", {
        ignoreCache
      });
      const result = await Promise.race([
        // No `loaderId` means same-document navigation.
        this.#waitNavigation(wait, cdpReloadPromise, navigationState),
        // Throw an error if the navigation is canceled.
        navigationState.finished
      ]);
      if (result instanceof NavigationTracker_js_1.NavigationResult) {
        if (result.eventName === "browsingContext.navigationAborted" || result.eventName === "browsingContext.navigationFailed") {
          throw new protocol_js_1.UnknownErrorException(result.message ?? "unknown exception");
        }
      }
      return {
        navigation: navigationState.navigationId,
        // Url can change due to redirects. Get the one from commandNavigation.
        url: navigationState.url
      };
    }
    async setViewport(viewport, devicePixelRatio) {
      await this.cdpTarget.setViewport(viewport, devicePixelRatio);
    }
    async handleUserPrompt(accept, userText) {
      await this.#cdpTarget.cdpClient.sendCommand("Page.handleJavaScriptDialog", {
        accept: accept ?? true,
        promptText: userText
      });
    }
    async activate() {
      await this.#cdpTarget.cdpClient.sendCommand("Page.bringToFront");
    }
    async captureScreenshot(params) {
      if (!this.isTopLevelContext()) {
        throw new protocol_js_1.UnsupportedOperationException(`Non-top-level 'context' (${params.context}) is currently not supported`);
      }
      const formatParameters = getImageFormatParameters(params);
      let captureBeyondViewport = false;
      let script;
      params.origin ??= "viewport";
      switch (params.origin) {
        case "document": {
          script = String(() => {
            const element = document.documentElement;
            return {
              x: 0,
              y: 0,
              width: element.scrollWidth,
              height: element.scrollHeight
            };
          });
          captureBeyondViewport = true;
          break;
        }
        case "viewport": {
          script = String(() => {
            const viewport = window.visualViewport;
            return {
              x: viewport.pageLeft,
              y: viewport.pageTop,
              width: viewport.width,
              height: viewport.height
            };
          });
          break;
        }
      }
      const hiddenSandboxRealm = await this.getOrCreateHiddenSandbox();
      const originResult = await hiddenSandboxRealm.callFunction(script, false);
      (0, assert_js_1.assert)(originResult.type === "success");
      const origin = deserializeDOMRect(originResult.result);
      (0, assert_js_1.assert)(origin);
      let rect = origin;
      if (params.clip) {
        const clip = params.clip;
        if (params.origin === "viewport" && clip.type === "box") {
          clip.x += origin.x;
          clip.y += origin.y;
        }
        rect = getIntersectionRect(await this.#parseRect(clip), origin);
      }
      if (rect.width === 0 || rect.height === 0) {
        throw new protocol_js_1.UnableToCaptureScreenException(`Unable to capture screenshot with zero dimensions: width=${rect.width}, height=${rect.height}`);
      }
      return await this.#cdpTarget.cdpClient.sendCommand("Page.captureScreenshot", {
        clip: { ...rect, scale: 1 },
        ...formatParameters,
        captureBeyondViewport
      });
    }
    async print(params) {
      if (!this.isTopLevelContext()) {
        throw new protocol_js_1.UnsupportedOperationException("Printing of non-top level contexts is not supported");
      }
      const cdpParams = {};
      if (params.background !== void 0) {
        cdpParams.printBackground = params.background;
      }
      if (params.margin?.bottom !== void 0) {
        cdpParams.marginBottom = (0, unitConversions_js_1.inchesFromCm)(params.margin.bottom);
      }
      if (params.margin?.left !== void 0) {
        cdpParams.marginLeft = (0, unitConversions_js_1.inchesFromCm)(params.margin.left);
      }
      if (params.margin?.right !== void 0) {
        cdpParams.marginRight = (0, unitConversions_js_1.inchesFromCm)(params.margin.right);
      }
      if (params.margin?.top !== void 0) {
        cdpParams.marginTop = (0, unitConversions_js_1.inchesFromCm)(params.margin.top);
      }
      if (params.orientation !== void 0) {
        cdpParams.landscape = params.orientation === "landscape";
      }
      if (params.page?.height !== void 0) {
        cdpParams.paperHeight = (0, unitConversions_js_1.inchesFromCm)(params.page.height);
      }
      if (params.page?.width !== void 0) {
        cdpParams.paperWidth = (0, unitConversions_js_1.inchesFromCm)(params.page.width);
      }
      if (params.pageRanges !== void 0) {
        for (const range of params.pageRanges) {
          if (typeof range === "number") {
            continue;
          }
          const rangeParts = range.split("-");
          if (rangeParts.length < 1 || rangeParts.length > 2) {
            throw new protocol_js_1.InvalidArgumentException(`Invalid page range: ${range} is not a valid integer range.`);
          }
          if (rangeParts.length === 1) {
            void parseInteger(rangeParts[0] ?? "");
            continue;
          }
          let lowerBound;
          let upperBound;
          const [rangeLowerPart = "", rangeUpperPart = ""] = rangeParts;
          if (rangeLowerPart === "") {
            lowerBound = 1;
          } else {
            lowerBound = parseInteger(rangeLowerPart);
          }
          if (rangeUpperPart === "") {
            upperBound = Number.MAX_SAFE_INTEGER;
          } else {
            upperBound = parseInteger(rangeUpperPart);
          }
          if (lowerBound > upperBound) {
            throw new protocol_js_1.InvalidArgumentException(`Invalid page range: ${rangeLowerPart} > ${rangeUpperPart}`);
          }
        }
        cdpParams.pageRanges = params.pageRanges.join(",");
      }
      if (params.scale !== void 0) {
        cdpParams.scale = params.scale;
      }
      if (params.shrinkToFit !== void 0) {
        cdpParams.preferCSSPageSize = !params.shrinkToFit;
      }
      try {
        const result = await this.#cdpTarget.cdpClient.sendCommand("Page.printToPDF", cdpParams);
        return {
          data: result.data
        };
      } catch (error) {
        if (error.message === "invalid print parameters: content area is empty") {
          throw new protocol_js_1.UnsupportedOperationException(error.message);
        }
        throw error;
      }
    }
    /**
     * See
     * https://w3c.github.io/webdriver-bidi/#:~:text=If%20command%20parameters%20contains%20%22clip%22%3A
     */
    async #parseRect(clip) {
      switch (clip.type) {
        case "box":
          return { x: clip.x, y: clip.y, width: clip.width, height: clip.height };
        case "element": {
          const hiddenSandboxRealm = await this.getOrCreateHiddenSandbox();
          const result = await hiddenSandboxRealm.callFunction(String((element) => {
            return element instanceof Element;
          }), false, { type: "undefined" }, [clip.element]);
          if (result.type === "exception") {
            throw new protocol_js_1.NoSuchElementException(`Element '${clip.element.sharedId}' was not found`);
          }
          (0, assert_js_1.assert)(result.result.type === "boolean");
          if (!result.result.value) {
            throw new protocol_js_1.NoSuchElementException(`Node '${clip.element.sharedId}' is not an Element`);
          }
          {
            const result2 = await hiddenSandboxRealm.callFunction(String((element) => {
              const rect2 = element.getBoundingClientRect();
              return {
                x: rect2.x,
                y: rect2.y,
                height: rect2.height,
                width: rect2.width
              };
            }), false, { type: "undefined" }, [clip.element]);
            (0, assert_js_1.assert)(result2.type === "success");
            const rect = deserializeDOMRect(result2.result);
            if (!rect) {
              throw new protocol_js_1.UnableToCaptureScreenException(`Could not get bounding box for Element '${clip.element.sharedId}'`);
            }
            return rect;
          }
        }
      }
    }
    async close() {
      await this.#cdpTarget.cdpClient.sendCommand("Page.close");
    }
    async traverseHistory(delta) {
      if (delta === 0) {
        return;
      }
      const history = await this.#cdpTarget.cdpClient.sendCommand("Page.getNavigationHistory");
      const entry = history.entries[history.currentIndex + delta];
      if (!entry) {
        throw new protocol_js_1.NoSuchHistoryEntryException(`No history entry at delta ${delta}`);
      }
      await this.#cdpTarget.cdpClient.sendCommand("Page.navigateToHistoryEntry", {
        entryId: entry.id
      });
    }
    async toggleModulesIfNeeded() {
      await Promise.all([
        this.#cdpTarget.toggleNetworkIfNeeded(),
        this.#cdpTarget.toggleDeviceAccessIfNeeded()
      ]);
    }
    async locateNodes(params) {
      return await this.#locateNodesByLocator(await this.#defaultRealmDeferred, params.locator, params.startNodes ?? [], params.maxNodeCount, params.serializationOptions);
    }
    async #getLocatorDelegate(realm, locator, maxNodeCount, startNodes) {
      switch (locator.type) {
        case "context":
          throw new Error("Unreachable");
        case "css":
          return {
            functionDeclaration: String((cssSelector, maxNodeCount2, ...startNodes2) => {
              const locateNodesUsingCss = (element) => {
                if (!(element instanceof HTMLElement || element instanceof Document || element instanceof DocumentFragment)) {
                  throw new Error("startNodes in css selector should be HTMLElement, Document or DocumentFragment");
                }
                return [...element.querySelectorAll(cssSelector)];
              };
              startNodes2 = startNodes2.length > 0 ? startNodes2 : [document];
              const returnedNodes = startNodes2.map((startNode) => (
                // TODO: stop search early if `maxNodeCount` is reached.
                locateNodesUsingCss(startNode)
              )).flat(1);
              return maxNodeCount2 === 0 ? returnedNodes : returnedNodes.slice(0, maxNodeCount2);
            }),
            argumentsLocalValues: [
              // `cssSelector`
              { type: "string", value: locator.value },
              // `maxNodeCount` with `0` means no limit.
              { type: "number", value: maxNodeCount ?? 0 },
              // `startNodes`
              ...startNodes
            ]
          };
        case "xpath":
          return {
            functionDeclaration: String((xPathSelector, maxNodeCount2, ...startNodes2) => {
              const evaluator = new XPathEvaluator();
              const expression = evaluator.createExpression(xPathSelector);
              const locateNodesUsingXpath = (element) => {
                const xPathResult = expression.evaluate(element, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE);
                const returnedNodes2 = [];
                for (let i = 0; i < xPathResult.snapshotLength; i++) {
                  returnedNodes2.push(xPathResult.snapshotItem(i));
                }
                return returnedNodes2;
              };
              startNodes2 = startNodes2.length > 0 ? startNodes2 : [document];
              const returnedNodes = startNodes2.map((startNode) => (
                // TODO: stop search early if `maxNodeCount` is reached.
                locateNodesUsingXpath(startNode)
              )).flat(1);
              return maxNodeCount2 === 0 ? returnedNodes : returnedNodes.slice(0, maxNodeCount2);
            }),
            argumentsLocalValues: [
              // `xPathSelector`
              { type: "string", value: locator.value },
              // `maxNodeCount` with `0` means no limit.
              { type: "number", value: maxNodeCount ?? 0 },
              // `startNodes`
              ...startNodes
            ]
          };
        case "innerText":
          if (locator.value === "") {
            throw new protocol_js_1.InvalidSelectorException("innerText locator cannot be empty");
          }
          return {
            functionDeclaration: String((innerTextSelector, fullMatch, ignoreCase, maxNodeCount2, maxDepth, ...startNodes2) => {
              const searchText = ignoreCase ? innerTextSelector.toUpperCase() : innerTextSelector;
              const locateNodesUsingInnerText = (node, currentMaxDepth) => {
                const returnedNodes2 = [];
                if (node instanceof DocumentFragment || node instanceof Document) {
                  const children = [...node.children];
                  children.forEach((child) => (
                    // `currentMaxDepth` is not decremented intentionally according to
                    // https://github.com/w3c/webdriver-bidi/pull/713.
                    returnedNodes2.push(...locateNodesUsingInnerText(child, currentMaxDepth))
                  ));
                  return returnedNodes2;
                }
                if (!(node instanceof HTMLElement)) {
                  return [];
                }
                const element = node;
                const nodeInnerText = ignoreCase ? element.innerText?.toUpperCase() : element.innerText;
                if (!nodeInnerText.includes(searchText)) {
                  return [];
                }
                const childNodes = [];
                for (const child of element.children) {
                  if (child instanceof HTMLElement) {
                    childNodes.push(child);
                  }
                }
                if (childNodes.length === 0) {
                  if (fullMatch && nodeInnerText === searchText) {
                    returnedNodes2.push(element);
                  } else {
                    if (!fullMatch) {
                      returnedNodes2.push(element);
                    }
                  }
                } else {
                  const childNodeMatches = (
                    // Don't search deeper if `maxDepth` is reached.
                    currentMaxDepth <= 0 ? [] : childNodes.map((child) => locateNodesUsingInnerText(child, currentMaxDepth - 1)).flat(1)
                  );
                  if (childNodeMatches.length === 0) {
                    if (!fullMatch || nodeInnerText === searchText) {
                      returnedNodes2.push(element);
                    }
                  } else {
                    returnedNodes2.push(...childNodeMatches);
                  }
                }
                return returnedNodes2;
              };
              startNodes2 = startNodes2.length > 0 ? startNodes2 : [document];
              const returnedNodes = startNodes2.map((startNode) => (
                // TODO: stop search early if `maxNodeCount` is reached.
                locateNodesUsingInnerText(startNode, maxDepth)
              )).flat(1);
              return maxNodeCount2 === 0 ? returnedNodes : returnedNodes.slice(0, maxNodeCount2);
            }),
            argumentsLocalValues: [
              // `innerTextSelector`
              { type: "string", value: locator.value },
              // `fullMatch` with default `true`.
              { type: "boolean", value: locator.matchType !== "partial" },
              // `ignoreCase` with default `false`.
              { type: "boolean", value: locator.ignoreCase === true },
              // `maxNodeCount` with `0` means no limit.
              { type: "number", value: maxNodeCount ?? 0 },
              // `maxDepth` with default `1000` (same as default full serialization depth).
              { type: "number", value: locator.maxDepth ?? 1e3 },
              // `startNodes`
              ...startNodes
            ]
          };
        case "accessibility": {
          if (!locator.value.name && !locator.value.role) {
            throw new protocol_js_1.InvalidSelectorException("Either name or role has to be specified");
          }
          await Promise.all([
            this.#cdpTarget.cdpClient.sendCommand("Accessibility.enable"),
            this.#cdpTarget.cdpClient.sendCommand("Accessibility.getRootAXNode")
          ]);
          const bindings = await realm.evaluate(
            /* expression=*/
            "({getAccessibleName, getAccessibleRole})",
            /* awaitPromise=*/
            false,
            "root",
            /* serializationOptions= */
            void 0,
            /* userActivation=*/
            false,
            /* includeCommandLineApi=*/
            true
          );
          if (bindings.type !== "success") {
            throw new Error("Could not get bindings");
          }
          if (bindings.result.type !== "object") {
            throw new Error("Could not get bindings");
          }
          return {
            functionDeclaration: String((name, role, bindings2, maxNodeCount2, ...startNodes2) => {
              const returnedNodes = [];
              let aborted = false;
              function collect(contextNodes, selector) {
                if (aborted) {
                  return;
                }
                for (const contextNode of contextNodes) {
                  let match = true;
                  if (selector.role) {
                    const role2 = bindings2.getAccessibleRole(contextNode);
                    if (selector.role !== role2) {
                      match = false;
                    }
                  }
                  if (selector.name) {
                    const name2 = bindings2.getAccessibleName(contextNode);
                    if (selector.name !== name2) {
                      match = false;
                    }
                  }
                  if (match) {
                    if (maxNodeCount2 !== 0 && returnedNodes.length === maxNodeCount2) {
                      aborted = true;
                      break;
                    }
                    returnedNodes.push(contextNode);
                  }
                  const childNodes = [];
                  for (const child of contextNode.children) {
                    if (child instanceof HTMLElement) {
                      childNodes.push(child);
                    }
                  }
                  collect(childNodes, selector);
                }
              }
              startNodes2 = startNodes2.length > 0 ? startNodes2 : Array.from(document.documentElement.children).filter((c) => c instanceof HTMLElement);
              collect(startNodes2, {
                role,
                name
              });
              return returnedNodes;
            }),
            argumentsLocalValues: [
              // `name`
              { type: "string", value: locator.value.name || "" },
              // `role`
              { type: "string", value: locator.value.role || "" },
              // `bindings`.
              { handle: bindings.result.handle },
              // `maxNodeCount` with `0` means no limit.
              { type: "number", value: maxNodeCount ?? 0 },
              // `startNodes`
              ...startNodes
            ]
          };
        }
      }
    }
    async #locateNodesByLocator(realm, locator, startNodes, maxNodeCount, serializationOptions) {
      if (locator.type === "context") {
        if (startNodes.length !== 0) {
          throw new protocol_js_1.InvalidArgumentException("Start nodes are not supported");
        }
        const contextId = locator.value.context;
        if (!contextId) {
          throw new protocol_js_1.InvalidSelectorException("Invalid context");
        }
        const context = this.#browsingContextStorage.getContext(contextId);
        const parent = context.parent;
        if (!parent) {
          throw new protocol_js_1.InvalidArgumentException("This context has no container");
        }
        try {
          const { backendNodeId } = await parent.#cdpTarget.cdpClient.sendCommand("DOM.getFrameOwner", {
            frameId: contextId
          });
          const { object } = await parent.#cdpTarget.cdpClient.sendCommand("DOM.resolveNode", {
            backendNodeId
          });
          const locatorResult2 = await realm.callFunction(`function () { return this; }`, false, { handle: object.objectId }, [], "none", serializationOptions);
          if (locatorResult2.type === "exception") {
            throw new Error("Unknown exception");
          }
          return { nodes: [locatorResult2.result] };
        } catch {
          throw new protocol_js_1.InvalidArgumentException("Context does not exist");
        }
      }
      const locatorDelegate = await this.#getLocatorDelegate(realm, locator, maxNodeCount, startNodes);
      serializationOptions = {
        ...serializationOptions,
        // The returned object is an array of nodes, so no need in deeper JS serialization.
        maxObjectDepth: 1
      };
      const locatorResult = await realm.callFunction(locatorDelegate.functionDeclaration, false, { type: "undefined" }, locatorDelegate.argumentsLocalValues, "none", serializationOptions);
      if (locatorResult.type !== "success") {
        this.#logger?.(_a2.LOGGER_PREFIX, "Failed locateNodesByLocator", locatorResult);
        if (
          // CSS selector.
          locatorResult.exceptionDetails.text?.endsWith("is not a valid selector.") || // XPath selector.
          locatorResult.exceptionDetails.text?.endsWith("is not a valid XPath expression.")
        ) {
          throw new protocol_js_1.InvalidSelectorException(`Not valid selector ${typeof locator.value === "string" ? locator.value : JSON.stringify(locator.value)}`);
        }
        if (locatorResult.exceptionDetails.text === "Error: startNodes in css selector should be HTMLElement, Document or DocumentFragment") {
          throw new protocol_js_1.InvalidArgumentException("startNodes in css selector should be HTMLElement, Document or DocumentFragment");
        }
        throw new protocol_js_1.UnknownErrorException(`Unexpected error in selector script: ${locatorResult.exceptionDetails.text}`);
      }
      if (locatorResult.result.type !== "array") {
        throw new protocol_js_1.UnknownErrorException(`Unexpected selector script result type: ${locatorResult.result.type}`);
      }
      const nodes = locatorResult.result.value.map((value) => {
        if (value.type !== "node") {
          throw new protocol_js_1.UnknownErrorException(`Unexpected selector script result element: ${value.type}`);
        }
        return value;
      });
      return { nodes };
    }
  };
  BrowsingContextImpl.BrowsingContextImpl = BrowsingContextImpl$1;
  _a2 = BrowsingContextImpl$1;
  function serializeOrigin(origin) {
    if (["://", ""].includes(origin)) {
      origin = "null";
    }
    return origin;
  }
  function getImageFormatParameters(params) {
    const { quality, type } = params.format ?? {
      type: "image/png"
    };
    switch (type) {
      case "image/png": {
        return { format: "png" };
      }
      case "image/jpeg": {
        return {
          format: "jpeg",
          ...quality === void 0 ? {} : { quality: Math.round(quality * 100) }
        };
      }
      case "image/webp": {
        return {
          format: "webp",
          ...quality === void 0 ? {} : { quality: Math.round(quality * 100) }
        };
      }
    }
    throw new protocol_js_1.InvalidArgumentException(`Image format '${type}' is not a supported format`);
  }
  function deserializeDOMRect(result) {
    if (result.type !== "object" || result.value === void 0) {
      return;
    }
    const x = result.value.find(([key]) => {
      return key === "x";
    })?.[1];
    const y = result.value.find(([key]) => {
      return key === "y";
    })?.[1];
    const height = result.value.find(([key]) => {
      return key === "height";
    })?.[1];
    const width = result.value.find(([key]) => {
      return key === "width";
    })?.[1];
    if (x?.type !== "number" || y?.type !== "number" || height?.type !== "number" || width?.type !== "number") {
      return;
    }
    return {
      x: x.value,
      y: y.value,
      width: width.value,
      height: height.value
    };
  }
  function normalizeRect(box) {
    return {
      ...box.width < 0 ? {
        x: box.x + box.width,
        width: -box.width
      } : {
        x: box.x,
        width: box.width
      },
      ...box.height < 0 ? {
        y: box.y + box.height,
        height: -box.height
      } : {
        y: box.y,
        height: box.height
      }
    };
  }
  function getIntersectionRect(first, second) {
    first = normalizeRect(first);
    second = normalizeRect(second);
    const x = Math.max(first.x, second.x);
    const y = Math.max(first.y, second.y);
    return {
      x,
      y,
      width: Math.max(Math.min(first.x + first.width, second.x + second.width) - x, 0),
      height: Math.max(Math.min(first.y + first.height, second.y + second.height) - y, 0)
    };
  }
  function parseInteger(value) {
    value = value.trim();
    if (!/^[0-9]+$/.test(value)) {
      throw new protocol_js_1.InvalidArgumentException(`Invalid integer: ${value}`);
    }
    return parseInt(value);
  }
  return BrowsingContextImpl;
}
var WorkerRealm = {};
var hasRequiredWorkerRealm;
function requireWorkerRealm() {
  if (hasRequiredWorkerRealm) return WorkerRealm;
  hasRequiredWorkerRealm = 1;
  Object.defineProperty(WorkerRealm, "__esModule", { value: true });
  WorkerRealm.WorkerRealm = void 0;
  const Realm_js_1 = requireRealm();
  let WorkerRealm$1 = class WorkerRealm extends Realm_js_1.Realm {
    #realmType;
    #ownerRealms;
    constructor(cdpClient, eventManager, executionContextId, logger, origin, ownerRealms, realmId, realmStorage, realmType) {
      super(cdpClient, eventManager, executionContextId, logger, origin, realmId, realmStorage);
      this.#ownerRealms = ownerRealms;
      this.#realmType = realmType;
      this.initialize();
    }
    get associatedBrowsingContexts() {
      return this.#ownerRealms.flatMap((realm) => realm.associatedBrowsingContexts);
    }
    get realmType() {
      return this.#realmType;
    }
    get source() {
      return {
        realm: this.realmId,
        // This is a hack to make Puppeteer able to track workers.
        // TODO: remove after Puppeteer tracks workers by owners and use the base version.
        context: this.associatedBrowsingContexts[0]?.id
      };
    }
    get realmInfo() {
      const owners = this.#ownerRealms.map((realm) => realm.realmId);
      const { realmType } = this;
      switch (realmType) {
        case "dedicated-worker": {
          const owner = owners[0];
          if (owner === void 0 || owners.length !== 1) {
            throw new Error("Dedicated worker must have exactly one owner");
          }
          return {
            ...this.baseInfo,
            type: realmType,
            owners: [owner]
          };
        }
        case "service-worker":
        case "shared-worker": {
          return {
            ...this.baseInfo,
            type: realmType
          };
        }
      }
    }
  };
  WorkerRealm.WorkerRealm = WorkerRealm$1;
  return WorkerRealm;
}
var CdpTarget = {};
var LogManager = {};
var logHelper = {};
var hasRequiredLogHelper;
function requireLogHelper() {
  if (hasRequiredLogHelper) return logHelper;
  hasRequiredLogHelper = 1;
  Object.defineProperty(logHelper, "__esModule", { value: true });
  logHelper.logMessageFormatter = logMessageFormatter;
  logHelper.getRemoteValuesText = getRemoteValuesText;
  const assert_js_1 = requireAssert();
  const specifiers = ["%s", "%d", "%i", "%f", "%o", "%O", "%c"];
  function isFormatSpecifier(str) {
    return specifiers.some((spec) => str.includes(spec));
  }
  function logMessageFormatter(args) {
    let output = "";
    const argFormat = args[0].value.toString();
    const argValues = args.slice(1, void 0);
    const tokens = argFormat.split(new RegExp(specifiers.map((spec) => `(${spec})`).join("|"), "g"));
    for (const token of tokens) {
      if (token === void 0 || token === "") {
        continue;
      }
      if (isFormatSpecifier(token)) {
        const arg = argValues.shift();
        (0, assert_js_1.assert)(arg, `Less value is provided: "${getRemoteValuesText(args, false)}"`);
        if (token === "%s") {
          output += stringFromArg(arg);
        } else if (token === "%d" || token === "%i") {
          if (arg.type === "bigint" || arg.type === "number" || arg.type === "string") {
            output += parseInt(arg.value.toString(), 10);
          } else {
            output += "NaN";
          }
        } else if (token === "%f") {
          if (arg.type === "bigint" || arg.type === "number" || arg.type === "string") {
            output += parseFloat(arg.value.toString());
          } else {
            output += "NaN";
          }
        } else {
          output += toJson(arg);
        }
      } else {
        output += token;
      }
    }
    if (argValues.length > 0) {
      throw new Error(`More value is provided: "${getRemoteValuesText(args, false)}"`);
    }
    return output;
  }
  function toJson(arg) {
    if (arg.type !== "array" && arg.type !== "bigint" && arg.type !== "date" && arg.type !== "number" && arg.type !== "object" && arg.type !== "string") {
      return stringFromArg(arg);
    }
    if (arg.type === "bigint") {
      return `${arg.value.toString()}n`;
    }
    if (arg.type === "number") {
      return arg.value.toString();
    }
    if (["date", "string"].includes(arg.type)) {
      return JSON.stringify(arg.value);
    }
    if (arg.type === "object") {
      return `{${arg.value.map((pair) => {
        return `${JSON.stringify(pair[0])}:${toJson(pair[1])}`;
      }).join(",")}}`;
    }
    if (arg.type === "array") {
      return `[${arg.value?.map((val) => toJson(val)).join(",") ?? ""}]`;
    }
    throw Error(`Invalid value type: ${arg}`);
  }
  function stringFromArg(arg) {
    if (!Object.hasOwn(arg, "value")) {
      return arg.type;
    }
    switch (arg.type) {
      case "string":
      case "number":
      case "boolean":
      case "bigint":
        return String(arg.value);
      case "regexp":
        return `/${arg.value.pattern}/${arg.value.flags ?? ""}`;
      case "date":
        return new Date(arg.value).toString();
      case "object":
        return `Object(${arg.value?.length ?? ""})`;
      case "array":
        return `Array(${arg.value?.length ?? ""})`;
      case "map":
        return `Map(${arg.value?.length})`;
      case "set":
        return `Set(${arg.value?.length})`;
      default:
        return arg.type;
    }
  }
  function getRemoteValuesText(args, formatText) {
    const arg = args[0];
    if (!arg) {
      return "";
    }
    if (arg.type === "string" && isFormatSpecifier(arg.value.toString()) && formatText) {
      return logMessageFormatter(args);
    }
    return args.map((arg2) => {
      return stringFromArg(arg2);
    }).join(" ");
  }
  return logHelper;
}
var hasRequiredLogManager;
function requireLogManager() {
  if (hasRequiredLogManager) return LogManager;
  hasRequiredLogManager = 1;
  var _a2;
  Object.defineProperty(LogManager, "__esModule", { value: true });
  LogManager.LogManager = void 0;
  const protocol_js_1 = requireProtocol();
  const log_js_1 = requireLog();
  const logHelper_js_1 = requireLogHelper();
  function getBidiStackTrace(cdpStackTrace) {
    const stackFrames = cdpStackTrace?.callFrames.map((callFrame) => {
      return {
        columnNumber: callFrame.columnNumber,
        functionName: callFrame.functionName,
        lineNumber: callFrame.lineNumber,
        url: callFrame.url
      };
    });
    return stackFrames ? { callFrames: stackFrames } : void 0;
  }
  function getLogLevel(consoleApiType) {
    if (["error", "assert"].includes(consoleApiType)) {
      return "error";
    }
    if (["debug", "trace"].includes(consoleApiType)) {
      return "debug";
    }
    if (["warn", "warning"].includes(consoleApiType)) {
      return "warn";
    }
    return "info";
  }
  function getLogMethod(consoleApiType) {
    switch (consoleApiType) {
      case "warning":
        return "warn";
      case "startGroup":
        return "group";
      case "startGroupCollapsed":
        return "groupCollapsed";
      case "endGroup":
        return "groupEnd";
    }
    return consoleApiType;
  }
  let LogManager$1 = class LogManager {
    #eventManager;
    #realmStorage;
    #cdpTarget;
    #logger;
    constructor(cdpTarget, realmStorage, eventManager, logger) {
      this.#cdpTarget = cdpTarget;
      this.#realmStorage = realmStorage;
      this.#eventManager = eventManager;
      this.#logger = logger;
    }
    static create(cdpTarget, realmStorage, eventManager, logger) {
      const logManager = new _a2(cdpTarget, realmStorage, eventManager, logger);
      logManager.#initializeEntryAddedEventListener();
      return logManager;
    }
    /**
     * Heuristic serialization of CDP remote object. If possible, return the BiDi value
     * without deep serialization.
     */
    async #heuristicSerializeArg(arg, realm) {
      switch (arg.type) {
        // TODO: Implement regexp, array, object, map and set heuristics base on
        //  preview.
        case "undefined":
          return { type: "undefined" };
        case "boolean":
          return { type: "boolean", value: arg.value };
        case "string":
          return { type: "string", value: arg.value };
        case "number":
          return { type: "number", value: arg.unserializableValue ?? arg.value };
        case "bigint":
          if (arg.unserializableValue !== void 0 && arg.unserializableValue[arg.unserializableValue.length - 1] === "n") {
            return {
              type: arg.type,
              value: arg.unserializableValue.slice(0, -1)
            };
          }
          break;
        case "object":
          if (arg.subtype === "null") {
            return { type: "null" };
          }
          break;
      }
      return await realm.serializeCdpObject(
        arg,
        "none"
        /* Script.ResultOwnership.None */
      );
    }
    #initializeEntryAddedEventListener() {
      this.#cdpTarget.cdpClient.on("Runtime.consoleAPICalled", (params) => {
        const realm = this.#realmStorage.findRealm({
          cdpSessionId: this.#cdpTarget.cdpSessionId,
          executionContextId: params.executionContextId
        });
        if (realm === void 0) {
          this.#logger?.(log_js_1.LogType.cdp, params);
          return;
        }
        const argsPromise = Promise.all(params.args.map((arg) => this.#heuristicSerializeArg(arg, realm)));
        for (const browsingContext of realm.associatedBrowsingContexts) {
          this.#eventManager.registerPromiseEvent(argsPromise.then((args) => ({
            kind: "success",
            value: {
              type: "event",
              method: protocol_js_1.ChromiumBidi.Log.EventNames.LogEntryAdded,
              params: {
                level: getLogLevel(params.type),
                source: realm.source,
                text: (0, logHelper_js_1.getRemoteValuesText)(args, true),
                timestamp: Math.round(params.timestamp),
                stackTrace: getBidiStackTrace(params.stackTrace),
                type: "console",
                method: getLogMethod(params.type),
                args
              }
            }
          }), (error) => ({
            kind: "error",
            error
          })), browsingContext.id, protocol_js_1.ChromiumBidi.Log.EventNames.LogEntryAdded);
        }
      });
      this.#cdpTarget.cdpClient.on("Runtime.exceptionThrown", (params) => {
        const realm = this.#realmStorage.findRealm({
          cdpSessionId: this.#cdpTarget.cdpSessionId,
          executionContextId: params.exceptionDetails.executionContextId
        });
        if (realm === void 0) {
          this.#logger?.(log_js_1.LogType.cdp, params);
          return;
        }
        for (const browsingContext of realm.associatedBrowsingContexts) {
          this.#eventManager.registerPromiseEvent(_a2.#getExceptionText(params, realm).then((text) => ({
            kind: "success",
            value: {
              type: "event",
              method: protocol_js_1.ChromiumBidi.Log.EventNames.LogEntryAdded,
              params: {
                level: "error",
                source: realm.source,
                text,
                timestamp: Math.round(params.timestamp),
                stackTrace: getBidiStackTrace(params.exceptionDetails.stackTrace),
                type: "javascript"
              }
            }
          }), (error) => ({
            kind: "error",
            error
          })), browsingContext.id, protocol_js_1.ChromiumBidi.Log.EventNames.LogEntryAdded);
        }
      });
    }
    /**
     * Try the best to get the exception text.
     */
    static async #getExceptionText(params, realm) {
      if (!params.exceptionDetails.exception) {
        return params.exceptionDetails.text;
      }
      if (realm === void 0) {
        return JSON.stringify(params.exceptionDetails.exception);
      }
      return await realm.stringifyObject(params.exceptionDetails.exception);
    }
  };
  LogManager.LogManager = LogManager$1;
  _a2 = LogManager$1;
  return LogManager;
}
var hasRequiredCdpTarget;
function requireCdpTarget() {
  if (hasRequiredCdpTarget) return CdpTarget;
  hasRequiredCdpTarget = 1;
  Object.defineProperty(CdpTarget, "__esModule", { value: true });
  CdpTarget.CdpTarget = void 0;
  const chromium_bidi_js_1 = requireChromiumBidi();
  const protocol_js_1 = requireProtocol();
  const Deferred_js_1 = requireDeferred();
  const log_js_1 = requireLog();
  const BrowsingContextImpl_js_1 = requireBrowsingContextImpl();
  const LogManager_js_1 = requireLogManager();
  let CdpTarget$1 = class CdpTarget2 {
    #id;
    #cdpClient;
    #browserCdpClient;
    #parentCdpClient;
    #realmStorage;
    #eventManager;
    #preloadScriptStorage;
    #browsingContextStorage;
    #prerenderingDisabled;
    #networkStorage;
    #userContextConfig;
    #unblocked = new Deferred_js_1.Deferred();
    #unhandledPromptBehavior;
    #logger;
    // Keeps track of the previously set viewport.
    #previousDeviceMetricsOverride = {
      width: 0,
      height: 0,
      deviceScaleFactor: 0,
      mobile: false,
      dontSetVisibleSize: true
    };
    /**
     * Target's window id. Is filled when the CDP target is created and do not reflect
     * moving targets from one window to another. The actual values
     * will be set during `#unblock`.
     * */
    #windowId;
    #deviceAccessEnabled = false;
    #cacheDisableState = false;
    #fetchDomainStages = {
      request: false,
      response: false,
      auth: false
    };
    static create(targetId, cdpClient, browserCdpClient, parentCdpClient, realmStorage, eventManager, preloadScriptStorage, browsingContextStorage, networkStorage, prerenderingDisabled, userContextConfig, unhandledPromptBehavior, logger) {
      const cdpTarget = new CdpTarget2(targetId, cdpClient, browserCdpClient, parentCdpClient, eventManager, realmStorage, preloadScriptStorage, browsingContextStorage, networkStorage, prerenderingDisabled, userContextConfig, unhandledPromptBehavior, logger);
      LogManager_js_1.LogManager.create(cdpTarget, realmStorage, eventManager, logger);
      cdpTarget.#setEventListeners();
      void cdpTarget.#unblock();
      return cdpTarget;
    }
    constructor(targetId, cdpClient, browserCdpClient, parentCdpClient, eventManager, realmStorage, preloadScriptStorage, browsingContextStorage, networkStorage, prerenderingDisabled, userContextConfig, unhandledPromptBehavior, logger) {
      this.#userContextConfig = userContextConfig;
      this.#id = targetId;
      this.#cdpClient = cdpClient;
      this.#browserCdpClient = browserCdpClient;
      this.#parentCdpClient = parentCdpClient;
      this.#eventManager = eventManager;
      this.#realmStorage = realmStorage;
      this.#preloadScriptStorage = preloadScriptStorage;
      this.#networkStorage = networkStorage;
      this.#browsingContextStorage = browsingContextStorage;
      this.#prerenderingDisabled = prerenderingDisabled;
      this.#unhandledPromptBehavior = unhandledPromptBehavior;
      this.#logger = logger;
    }
    /** Returns a deferred that resolves when the target is unblocked. */
    get unblocked() {
      return this.#unblocked;
    }
    get id() {
      return this.#id;
    }
    get cdpClient() {
      return this.#cdpClient;
    }
    get parentCdpClient() {
      return this.#parentCdpClient;
    }
    get browserCdpClient() {
      return this.#browserCdpClient;
    }
    /** Needed for CDP escape path. */
    get cdpSessionId() {
      return this.#cdpClient.sessionId;
    }
    /**
     * Window id the target belongs to. If not known, returns 0.
     */
    get windowId() {
      if (this.#windowId === void 0) {
        this.#logger?.(log_js_1.LogType.debugError, "Getting windowId before it was set, returning 0");
      }
      return this.#windowId ?? 0;
    }
    /**
     * Enables all the required CDP domains and unblocks the target.
     */
    async #unblock() {
      try {
        await Promise.all([
          this.#cdpClient.sendCommand("Page.enable", {
            enableFileChooserOpenedEvent: true
          }),
          ...this.#ignoreFileDialog() ? [] : [
            this.#cdpClient.sendCommand("Page.setInterceptFileChooserDialog", {
              enabled: true,
              // The intercepted dialog should be canceled.
              cancel: true
            })
          ],
          // There can be some existing frames in the target, if reconnecting to an
          // existing browser instance, e.g. via Puppeteer. Need to restore the browsing
          // contexts for the frames to correctly handle further events, like
          // `Runtime.executionContextCreated`.
          // It's important to schedule this task together with enabling domains commands to
          // prepare the tree before the events (e.g. Runtime.executionContextCreated) start
          // coming.
          // https://github.com/GoogleChromeLabs/chromium-bidi/issues/2282
          this.#cdpClient.sendCommand("Page.getFrameTree").then((frameTree) => this.#restoreFrameTreeState(frameTree.frameTree)),
          this.#cdpClient.sendCommand("Runtime.enable"),
          this.#cdpClient.sendCommand("Page.setLifecycleEventsEnabled", {
            enabled: true
          }),
          this.#cdpClient.sendCommand("Page.setPrerenderingAllowed", {
            isAllowed: !this.#prerenderingDisabled
          }).catch(() => {
          }),
          // Enabling CDP Network domain is required for navigation detection:
          // https://github.com/GoogleChromeLabs/chromium-bidi/issues/2856.
          this.#cdpClient.sendCommand("Network.enable").then(() => this.toggleNetworkIfNeeded()),
          this.#cdpClient.sendCommand("Target.setAutoAttach", {
            autoAttach: true,
            waitForDebuggerOnStart: true,
            flatten: true
          }),
          this.#updateWindowId(),
          this.#setUserContextConfig(),
          this.#initAndEvaluatePreloadScripts(),
          this.#cdpClient.sendCommand("Runtime.runIfWaitingForDebugger"),
          // Resume tab execution as well if it was paused by the debugger.
          this.#parentCdpClient.sendCommand("Runtime.runIfWaitingForDebugger"),
          this.toggleDeviceAccessIfNeeded()
        ]);
      } catch (error) {
        this.#logger?.(log_js_1.LogType.debugError, "Failed to unblock target", error);
        if (!this.#cdpClient.isCloseError(error)) {
          this.#unblocked.resolve({
            kind: "error",
            error
          });
          return;
        }
      }
      this.#unblocked.resolve({
        kind: "success",
        value: void 0
      });
    }
    #restoreFrameTreeState(frameTree) {
      const frame = frameTree.frame;
      const maybeContext = this.#browsingContextStorage.findContext(frame.id);
      if (maybeContext !== void 0) {
        if (maybeContext.parentId === null && frame.parentId !== null && frame.parentId !== void 0) {
          maybeContext.parentId = frame.parentId;
        }
      }
      if (maybeContext === void 0 && frame.parentId !== void 0) {
        const parentBrowsingContext = this.#browsingContextStorage.getContext(frame.parentId);
        BrowsingContextImpl_js_1.BrowsingContextImpl.create(frame.id, frame.parentId, parentBrowsingContext.userContext, this.#userContextConfig, parentBrowsingContext.cdpTarget, this.#eventManager, this.#browsingContextStorage, this.#realmStorage, frame.url, void 0, this.#unhandledPromptBehavior, this.#logger);
      }
      frameTree.childFrames?.map((frameTree2) => this.#restoreFrameTreeState(frameTree2));
    }
    async toggleFetchIfNeeded() {
      const stages = this.#networkStorage.getInterceptionStages(this.topLevelId);
      if (this.#fetchDomainStages.request === stages.request && this.#fetchDomainStages.response === stages.response && this.#fetchDomainStages.auth === stages.auth) {
        return;
      }
      const patterns = [];
      this.#fetchDomainStages = stages;
      if (stages.request || stages.auth) {
        patterns.push({
          urlPattern: "*",
          requestStage: "Request"
        });
      }
      if (stages.response) {
        patterns.push({
          urlPattern: "*",
          requestStage: "Response"
        });
      }
      if (patterns.length) {
        await this.#cdpClient.sendCommand("Fetch.enable", {
          patterns,
          handleAuthRequests: stages.auth
        });
      } else {
        const blockedRequest = this.#networkStorage.getRequestsByTarget(this).filter((request) => request.interceptPhase);
        void Promise.allSettled(blockedRequest.map((request) => request.waitNextPhase)).then(async () => {
          const blockedRequest2 = this.#networkStorage.getRequestsByTarget(this).filter((request) => request.interceptPhase);
          if (blockedRequest2.length) {
            return await this.toggleFetchIfNeeded();
          }
          return await this.#cdpClient.sendCommand("Fetch.disable");
        }).catch((error) => {
          this.#logger?.(log_js_1.LogType.bidi, "Disable failed", error);
        });
      }
    }
    /**
     * Toggles CDP "Fetch" domain and enable/disable network cache.
     */
    async toggleNetworkIfNeeded() {
      try {
        await Promise.all([
          this.toggleSetCacheDisabled(),
          this.toggleFetchIfNeeded()
        ]);
      } catch (err) {
        this.#logger?.(log_js_1.LogType.debugError, err);
        if (!this.#isExpectedError(err)) {
          throw err;
        }
      }
    }
    async toggleSetCacheDisabled(disable) {
      const defaultCacheDisabled = this.#networkStorage.defaultCacheBehavior === "bypass";
      const cacheDisabled = disable ?? defaultCacheDisabled;
      if (this.#cacheDisableState === cacheDisabled) {
        return;
      }
      this.#cacheDisableState = cacheDisabled;
      try {
        await this.#cdpClient.sendCommand("Network.setCacheDisabled", {
          cacheDisabled
        });
      } catch (err) {
        this.#logger?.(log_js_1.LogType.debugError, err);
        this.#cacheDisableState = !cacheDisabled;
        if (!this.#isExpectedError(err)) {
          throw err;
        }
      }
    }
    async toggleDeviceAccessIfNeeded() {
      const enabled = this.isSubscribedTo(chromium_bidi_js_1.Bluetooth.EventNames.RequestDevicePromptUpdated);
      if (this.#deviceAccessEnabled === enabled) {
        return;
      }
      this.#deviceAccessEnabled = enabled;
      try {
        await this.#cdpClient.sendCommand(enabled ? "DeviceAccess.enable" : "DeviceAccess.disable");
      } catch (err) {
        this.#logger?.(log_js_1.LogType.debugError, err);
        this.#deviceAccessEnabled = !enabled;
        if (!this.#isExpectedError(err)) {
          throw err;
        }
      }
    }
    /**
     * Heuristic checking if the error is due to the session being closed. If so, ignore the
     * error.
     */
    #isExpectedError(err) {
      const error = err;
      return error.code === -32001 && error.message === "Session with given id not found." || this.#cdpClient.isCloseError(err);
    }
    #setEventListeners() {
      this.#cdpClient.on("*", (event, params) => {
        if (typeof event !== "string") {
          return;
        }
        this.#eventManager.registerEvent({
          type: "event",
          method: `goog:cdp.${event}`,
          params: {
            event,
            params,
            session: this.cdpSessionId
          }
        }, this.id);
      });
    }
    async #enableFetch(stages) {
      const patterns = [];
      if (stages.request || stages.auth) {
        patterns.push({
          urlPattern: "*",
          requestStage: "Request"
        });
      }
      if (stages.response) {
        patterns.push({
          urlPattern: "*",
          requestStage: "Response"
        });
      }
      if (patterns.length) {
        const oldStages = this.#fetchDomainStages;
        this.#fetchDomainStages = stages;
        try {
          await this.#cdpClient.sendCommand("Fetch.enable", {
            patterns,
            handleAuthRequests: stages.auth
          });
        } catch {
          this.#fetchDomainStages = oldStages;
        }
      }
    }
    async #disableFetch() {
      const blockedRequest = this.#networkStorage.getRequestsByTarget(this).filter((request) => request.interceptPhase);
      if (blockedRequest.length === 0) {
        this.#fetchDomainStages = {
          request: false,
          response: false,
          auth: false
        };
        await this.#cdpClient.sendCommand("Fetch.disable");
      }
    }
    async toggleNetwork() {
      const stages = this.#networkStorage.getInterceptionStages(this.topLevelId);
      const fetchEnable = Object.values(stages).some((value) => value);
      const fetchChanged = this.#fetchDomainStages.request !== stages.request || this.#fetchDomainStages.response !== stages.response || this.#fetchDomainStages.auth !== stages.auth;
      this.#logger?.(log_js_1.LogType.debugInfo, "Toggle Network", `Fetch (${fetchEnable}) ${fetchChanged}`);
      if (fetchEnable && fetchChanged) {
        await this.#enableFetch(stages);
      }
      if (!fetchEnable && fetchChanged) {
        await this.#disableFetch();
      }
    }
    /**
     * All the ProxyChannels from all the preload scripts of the given
     * BrowsingContext.
     */
    getChannels() {
      return this.#preloadScriptStorage.find().flatMap((script) => script.channels);
    }
    async #updateWindowId() {
      const { windowId } = await this.#browserCdpClient.sendCommand("Browser.getWindowForTarget", { targetId: this.id });
      this.#windowId = windowId;
    }
    /** Loads all top-level preload scripts. */
    async #initAndEvaluatePreloadScripts() {
      await Promise.all(this.#preloadScriptStorage.find({
        // Needed for OOPIF
        targetId: this.topLevelId
      }).map((script) => {
        return script.initInTarget(this, true);
      }));
    }
    async setViewport(viewport, devicePixelRatio) {
      if (viewport === null && devicePixelRatio === null) {
        await this.cdpClient.sendCommand("Emulation.clearDeviceMetricsOverride");
        return;
      }
      const newViewport = { ...this.#previousDeviceMetricsOverride };
      if (viewport === null) {
        newViewport.width = 0;
        newViewport.height = 0;
      } else if (viewport !== void 0) {
        newViewport.width = viewport.width;
        newViewport.height = viewport.height;
      }
      if (devicePixelRatio === null) {
        newViewport.deviceScaleFactor = 0;
      } else if (devicePixelRatio !== void 0) {
        newViewport.deviceScaleFactor = devicePixelRatio;
      }
      try {
        await this.cdpClient.sendCommand("Emulation.setDeviceMetricsOverride", newViewport);
        this.#previousDeviceMetricsOverride = newViewport;
      } catch (err) {
        if (err.message.startsWith(
          // https://crsrc.org/c/content/browser/devtools/protocol/emulation_handler.cc;l=257;drc=2f6eee84cf98d4227e7c41718dd71b82f26d90ff
          "Width and height values must be positive"
        )) {
          throw new protocol_js_1.UnsupportedOperationException("Provided viewport dimensions are not supported");
        }
        throw err;
      }
    }
    /**
     * Immediately schedules all the required commands to configure user context
     * configuration and waits for them to finish. It's important to schedule them
     * in parallel, so that they are enqueued before any page's scripts.
     */
    async #setUserContextConfig() {
      const promises = [];
      if (this.#userContextConfig.viewport !== void 0 || this.#userContextConfig.devicePixelRatio !== void 0) {
        promises.push(this.setViewport(this.#userContextConfig.viewport, this.#userContextConfig.devicePixelRatio));
      }
      if (this.#userContextConfig.geolocation !== void 0 && this.#userContextConfig.geolocation !== null) {
        promises.push(this.setGeolocationOverride(this.#userContextConfig.geolocation));
      }
      if (this.#userContextConfig.screenOrientation !== void 0 && this.#userContextConfig.screenOrientation !== null) {
        promises.push(this.setScreenOrientationOverride(this.#userContextConfig.screenOrientation));
      }
      if (this.#userContextConfig.locale !== void 0) {
        promises.push(this.setLocaleOverride(this.#userContextConfig.locale));
      }
      if (this.#userContextConfig.timezone !== void 0) {
        promises.push(this.setTimezoneOverride(this.#userContextConfig.timezone));
      }
      if (this.#userContextConfig.acceptInsecureCerts !== void 0) {
        promises.push(this.cdpClient.sendCommand("Security.setIgnoreCertificateErrors", {
          ignore: this.#userContextConfig.acceptInsecureCerts
        }));
      }
      await Promise.all(promises);
    }
    get topLevelId() {
      return this.#browsingContextStorage.findTopLevelContextId(this.id) ?? this.id;
    }
    isSubscribedTo(moduleOrEvent) {
      return this.#eventManager.subscriptionManager.isSubscribedTo(moduleOrEvent, this.topLevelId);
    }
    #ignoreFileDialog() {
      return (this.#unhandledPromptBehavior?.file ?? this.#unhandledPromptBehavior?.default ?? "ignore") === "ignore";
    }
    async setGeolocationOverride(geolocation) {
      if (geolocation === null) {
        await this.cdpClient.sendCommand("Emulation.clearGeolocationOverride");
      } else if ("type" in geolocation) {
        if (geolocation.type !== "positionUnavailable") {
          throw new protocol_js_1.UnknownErrorException(`Unknown geolocation error ${geolocation.type}`);
        }
        await this.cdpClient.sendCommand("Emulation.setGeolocationOverride", {});
      } else if ("latitude" in geolocation) {
        await this.cdpClient.sendCommand("Emulation.setGeolocationOverride", {
          latitude: geolocation.latitude,
          longitude: geolocation.longitude,
          accuracy: geolocation.accuracy ?? 1,
          // `null` value is treated as "missing".
          altitude: geolocation.altitude ?? void 0,
          altitudeAccuracy: geolocation.altitudeAccuracy ?? void 0,
          heading: geolocation.heading ?? void 0,
          speed: geolocation.speed ?? void 0
        });
      } else {
        throw new protocol_js_1.UnknownErrorException("Unexpected geolocation coordinates value");
      }
    }
    async setScreenOrientationOverride(screenOrientation) {
      const newViewport = { ...this.#previousDeviceMetricsOverride };
      if (screenOrientation === null) {
        delete newViewport.screenOrientation;
      } else {
        newViewport.screenOrientation = this.#toCdpScreenOrientationAngle(screenOrientation);
      }
      await this.cdpClient.sendCommand("Emulation.setDeviceMetricsOverride", newViewport);
      this.#previousDeviceMetricsOverride = newViewport;
    }
    #toCdpScreenOrientationAngle(orientation) {
      if (orientation.natural === "portrait") {
        switch (orientation.type) {
          case "portrait-primary":
            return {
              angle: 0,
              type: "portraitPrimary"
            };
          case "landscape-primary":
            return {
              angle: 90,
              type: "landscapePrimary"
            };
          case "portrait-secondary":
            return {
              angle: 180,
              type: "portraitSecondary"
            };
          case "landscape-secondary":
            return {
              angle: 270,
              type: "landscapeSecondary"
            };
          default:
            throw new protocol_js_1.UnknownErrorException(`Unexpected screen orientation type ${orientation.type}`);
        }
      }
      if (orientation.natural === "landscape") {
        switch (orientation.type) {
          case "landscape-primary":
            return {
              angle: 0,
              type: "landscapePrimary"
            };
          case "portrait-primary":
            return {
              angle: 90,
              type: "portraitPrimary"
            };
          case "landscape-secondary":
            return {
              angle: 180,
              type: "landscapeSecondary"
            };
          case "portrait-secondary":
            return {
              angle: 270,
              type: "portraitSecondary"
            };
          default:
            throw new protocol_js_1.UnknownErrorException(`Unexpected screen orientation type ${orientation.type}`);
        }
      }
      throw new protocol_js_1.UnknownErrorException(`Unexpected orientation natural ${orientation.natural}`);
    }
    async setLocaleOverride(locale) {
      if (locale === null) {
        await this.cdpClient.sendCommand("Emulation.setLocaleOverride", {});
      } else {
        await this.cdpClient.sendCommand("Emulation.setLocaleOverride", {
          locale
        });
      }
    }
    async setTimezoneOverride(timezone) {
      if (timezone === null) {
        await this.cdpClient.sendCommand("Emulation.setTimezoneOverride", {
          // If empty, disables the override and restores default host system timezone.
          timezoneId: ""
        });
      } else {
        await this.cdpClient.sendCommand("Emulation.setTimezoneOverride", {
          timezoneId: timezone
        });
      }
    }
  };
  CdpTarget.CdpTarget = CdpTarget$1;
  return CdpTarget;
}
var hasRequiredCdpTargetManager;
function requireCdpTargetManager() {
  if (hasRequiredCdpTargetManager) return CdpTargetManager;
  hasRequiredCdpTargetManager = 1;
  Object.defineProperty(CdpTargetManager, "__esModule", { value: true });
  CdpTargetManager.CdpTargetManager = void 0;
  const log_js_1 = requireLog();
  const BrowsingContextImpl_js_1 = requireBrowsingContextImpl();
  const WorkerRealm_js_1 = requireWorkerRealm();
  const CdpTarget_js_1 = requireCdpTarget();
  const cdpToBidiTargetTypes = {
    service_worker: "service-worker",
    shared_worker: "shared-worker",
    worker: "dedicated-worker"
  };
  let CdpTargetManager$1 = class CdpTargetManager {
    #browserCdpClient;
    #cdpConnection;
    #targetKeysToBeIgnoredByAutoAttach = /* @__PURE__ */ new Set();
    #selfTargetId;
    #eventManager;
    #browsingContextStorage;
    #networkStorage;
    #userContextStorage;
    #bluetoothProcessor;
    #preloadScriptStorage;
    #realmStorage;
    #defaultUserContextId;
    #logger;
    #unhandledPromptBehavior;
    #prerenderingDisabled;
    constructor(cdpConnection, browserCdpClient, selfTargetId, eventManager, browsingContextStorage, userContextStorage, realmStorage, networkStorage, bluetoothProcessor, preloadScriptStorage, defaultUserContextId, prerenderingDisabled, unhandledPromptBehavior, logger) {
      this.#userContextStorage = userContextStorage;
      this.#cdpConnection = cdpConnection;
      this.#browserCdpClient = browserCdpClient;
      this.#targetKeysToBeIgnoredByAutoAttach.add(selfTargetId);
      this.#selfTargetId = selfTargetId;
      this.#eventManager = eventManager;
      this.#browsingContextStorage = browsingContextStorage;
      this.#preloadScriptStorage = preloadScriptStorage;
      this.#networkStorage = networkStorage;
      this.#bluetoothProcessor = bluetoothProcessor;
      this.#realmStorage = realmStorage;
      this.#defaultUserContextId = defaultUserContextId;
      this.#prerenderingDisabled = prerenderingDisabled;
      this.#unhandledPromptBehavior = unhandledPromptBehavior;
      this.#logger = logger;
      this.#setEventListeners(browserCdpClient);
    }
    /**
     * This method is called for each CDP session, since this class is responsible
     * for creating and destroying all targets and browsing contexts.
     */
    #setEventListeners(cdpClient) {
      cdpClient.on("Target.attachedToTarget", (params) => {
        this.#handleAttachedToTargetEvent(params, cdpClient);
      });
      cdpClient.on("Target.detachedFromTarget", this.#handleDetachedFromTargetEvent.bind(this));
      cdpClient.on("Target.targetInfoChanged", this.#handleTargetInfoChangedEvent.bind(this));
      cdpClient.on("Inspector.targetCrashed", () => {
        this.#handleTargetCrashedEvent(cdpClient);
      });
      cdpClient.on("Page.frameAttached", this.#handleFrameAttachedEvent.bind(this));
      cdpClient.on("Page.frameSubtreeWillBeDetached", this.#handleFrameSubtreeWillBeDetached.bind(this));
    }
    #handleFrameAttachedEvent(params) {
      const parentBrowsingContext = this.#browsingContextStorage.findContext(params.parentFrameId);
      if (parentBrowsingContext !== void 0) {
        BrowsingContextImpl_js_1.BrowsingContextImpl.create(
          params.frameId,
          params.parentFrameId,
          parentBrowsingContext.userContext,
          this.#userContextStorage.getConfig(parentBrowsingContext.userContext),
          parentBrowsingContext.cdpTarget,
          this.#eventManager,
          this.#browsingContextStorage,
          this.#realmStorage,
          // At this point, we don't know the URL of the frame yet, so it will be updated
          // later.
          "about:blank",
          void 0,
          this.#unhandledPromptBehavior,
          this.#logger
        );
      }
    }
    #handleFrameSubtreeWillBeDetached(params) {
      this.#browsingContextStorage.findContext(params.frameId)?.dispose(true);
    }
    #handleAttachedToTargetEvent(params, parentSessionCdpClient) {
      const { sessionId, targetInfo } = params;
      const targetCdpClient = this.#cdpConnection.getCdpClient(sessionId);
      const detach = async () => {
        await targetCdpClient.sendCommand("Runtime.runIfWaitingForDebugger").then(() => parentSessionCdpClient.sendCommand("Target.detachFromTarget", params)).catch((error) => this.#logger?.(log_js_1.LogType.debugError, error));
      };
      if (this.#selfTargetId === targetInfo.targetId) {
        void detach();
        return;
      }
      const targetKey = targetInfo.type === "service_worker" ? `${parentSessionCdpClient.sessionId}_${targetInfo.targetId}` : targetInfo.targetId;
      if (this.#targetKeysToBeIgnoredByAutoAttach.has(targetKey)) {
        return;
      }
      this.#targetKeysToBeIgnoredByAutoAttach.add(targetKey);
      const userContext = targetInfo.browserContextId && targetInfo.browserContextId !== this.#defaultUserContextId ? targetInfo.browserContextId : "default";
      switch (targetInfo.type) {
        case "tab": {
          this.#setEventListeners(targetCdpClient);
          void (async () => {
            await targetCdpClient.sendCommand("Target.setAutoAttach", {
              autoAttach: true,
              waitForDebuggerOnStart: true,
              flatten: true
            });
          })();
          return;
        }
        case "page":
        case "iframe": {
          const cdpTarget = this.#createCdpTarget(targetCdpClient, parentSessionCdpClient, targetInfo, userContext);
          const maybeContext = this.#browsingContextStorage.findContext(targetInfo.targetId);
          if (maybeContext && targetInfo.type === "iframe") {
            maybeContext.updateCdpTarget(cdpTarget);
          } else {
            const parentId = this.#findFrameParentId(targetInfo, parentSessionCdpClient.sessionId);
            BrowsingContextImpl_js_1.BrowsingContextImpl.create(
              targetInfo.targetId,
              parentId,
              userContext,
              this.#userContextStorage.getConfig(userContext),
              cdpTarget,
              this.#eventManager,
              this.#browsingContextStorage,
              this.#realmStorage,
              // Hack: when a new target created, CDP emits targetInfoChanged with an empty
              // url, and navigates it to about:blank later. When the event is emitted for
              // an existing target (reconnect), the url is already known, and navigation
              // events will not be emitted anymore. Replacing empty url with `about:blank`
              // allows to handle both cases in the same way.
              // "7.3.2.1 Creating browsing contexts".
              // https://html.spec.whatwg.org/multipage/document-sequences.html#creating-browsing-contexts
              // TODO: check who to deal with non-null creator and its `creatorOrigin`.
              targetInfo.url === "" ? "about:blank" : targetInfo.url,
              targetInfo.openerFrameId ?? targetInfo.openerId,
              this.#unhandledPromptBehavior,
              this.#logger
            );
          }
          return;
        }
        case "service_worker":
        case "worker": {
          const realm = this.#realmStorage.findRealm({
            cdpSessionId: parentSessionCdpClient.sessionId
          });
          if (!realm) {
            void detach();
            return;
          }
          const cdpTarget = this.#createCdpTarget(targetCdpClient, parentSessionCdpClient, targetInfo, userContext);
          this.#handleWorkerTarget(cdpToBidiTargetTypes[targetInfo.type], cdpTarget, realm);
          return;
        }
        // In CDP, we only emit shared workers on the browser and not the set of
        // frames that use the shared worker. If we change this in the future to
        // behave like service workers (emits on both browser and frame targets),
        // we can remove this block and merge service workers with the above one.
        case "shared_worker": {
          const cdpTarget = this.#createCdpTarget(targetCdpClient, parentSessionCdpClient, targetInfo, userContext);
          this.#handleWorkerTarget(cdpToBidiTargetTypes[targetInfo.type], cdpTarget);
          return;
        }
      }
      void detach();
    }
    /** Try to find the parent browsing context ID for the given attached target. */
    #findFrameParentId(targetInfo, parentSessionId) {
      if (targetInfo.type !== "iframe") {
        return null;
      }
      const parentId = targetInfo.openerFrameId ?? targetInfo.openerId;
      if (parentId !== void 0) {
        return parentId;
      }
      if (parentSessionId !== void 0) {
        return this.#browsingContextStorage.findContextBySession(parentSessionId)?.id ?? null;
      }
      return null;
    }
    #createCdpTarget(targetCdpClient, parentCdpClient, targetInfo, userContext) {
      this.#setEventListeners(targetCdpClient);
      this.#preloadScriptStorage.onCdpTargetCreated(targetInfo.targetId, userContext);
      const target = CdpTarget_js_1.CdpTarget.create(targetInfo.targetId, targetCdpClient, this.#browserCdpClient, parentCdpClient, this.#realmStorage, this.#eventManager, this.#preloadScriptStorage, this.#browsingContextStorage, this.#networkStorage, this.#prerenderingDisabled, this.#userContextStorage.getConfig(userContext), this.#unhandledPromptBehavior, this.#logger);
      this.#networkStorage.onCdpTargetCreated(target);
      this.#bluetoothProcessor.onCdpTargetCreated(target);
      return target;
    }
    #workers = /* @__PURE__ */ new Map();
    #handleWorkerTarget(realmType, cdpTarget, ownerRealm) {
      cdpTarget.cdpClient.on("Runtime.executionContextCreated", (params) => {
        const { uniqueId, id, origin } = params.context;
        const workerRealm = new WorkerRealm_js_1.WorkerRealm(cdpTarget.cdpClient, this.#eventManager, id, this.#logger, (0, BrowsingContextImpl_js_1.serializeOrigin)(origin), ownerRealm ? [ownerRealm] : [], uniqueId, this.#realmStorage, realmType);
        this.#workers.set(cdpTarget.cdpSessionId, workerRealm);
      });
    }
    #handleDetachedFromTargetEvent({ sessionId, targetId }) {
      if (targetId) {
        this.#preloadScriptStorage.find({ targetId }).map((preloadScript) => {
          preloadScript.dispose(targetId);
        });
      }
      const context = this.#browsingContextStorage.findContextBySession(sessionId);
      if (context) {
        context.dispose(true);
        return;
      }
      const worker = this.#workers.get(sessionId);
      if (worker) {
        this.#realmStorage.deleteRealms({
          cdpSessionId: worker.cdpClient.sessionId
        });
      }
    }
    #handleTargetInfoChangedEvent(params) {
      const context = this.#browsingContextStorage.findContext(params.targetInfo.targetId);
      if (context) {
        context.onTargetInfoChanged(params);
      }
    }
    #handleTargetCrashedEvent(cdpClient) {
      const realms = this.#realmStorage.findRealms({
        cdpSessionId: cdpClient.sessionId
      });
      for (const realm of realms) {
        realm.dispose();
      }
    }
  };
  CdpTargetManager.CdpTargetManager = CdpTargetManager$1;
  return CdpTargetManager;
}
var BrowsingContextStorage = {};
var hasRequiredBrowsingContextStorage;
function requireBrowsingContextStorage() {
  if (hasRequiredBrowsingContextStorage) return BrowsingContextStorage;
  hasRequiredBrowsingContextStorage = 1;
  Object.defineProperty(BrowsingContextStorage, "__esModule", { value: true });
  BrowsingContextStorage.BrowsingContextStorage = void 0;
  const protocol_js_1 = requireProtocol();
  const EventEmitter_js_1 = requireEventEmitter();
  let BrowsingContextStorage$1 = class BrowsingContextStorage {
    /** Map from context ID to context implementation. */
    #contexts = /* @__PURE__ */ new Map();
    /** Event emitter for browsing context storage eventsis not expected to be exposed to
     * the outside world. */
    #eventEmitter = new EventEmitter_js_1.EventEmitter();
    /** Gets all top-level contexts, i.e. those with no parent. */
    getTopLevelContexts() {
      return this.getAllContexts().filter((context) => context.isTopLevelContext());
    }
    /** Gets all contexts. */
    getAllContexts() {
      return Array.from(this.#contexts.values());
    }
    /** Deletes the context with the given ID. */
    deleteContextById(id) {
      this.#contexts.delete(id);
    }
    /** Deletes the given context. */
    deleteContext(context) {
      this.#contexts.delete(context.id);
    }
    /** Tracks the given context. */
    addContext(context) {
      this.#contexts.set(context.id, context);
      this.#eventEmitter.emit("added", {
        browsingContext: context
      });
    }
    /**
     * Waits for a context with the given ID to be added and returns it.
     */
    waitForContext(browsingContextId) {
      if (this.#contexts.has(browsingContextId)) {
        return Promise.resolve(this.getContext(browsingContextId));
      }
      return new Promise((resolve) => {
        const listener = (event) => {
          if (event.browsingContext.id === browsingContextId) {
            this.#eventEmitter.off("added", listener);
            resolve(event.browsingContext);
          }
        };
        this.#eventEmitter.on("added", listener);
      });
    }
    /** Returns true whether there is an existing context with the given ID. */
    hasContext(id) {
      return this.#contexts.has(id);
    }
    /** Gets the context with the given ID, if any. */
    findContext(id) {
      return this.#contexts.get(id);
    }
    /** Returns the top-level context ID of the given context, if any. */
    findTopLevelContextId(id) {
      if (id === null) {
        return null;
      }
      const maybeContext = this.findContext(id);
      if (!maybeContext) {
        return null;
      }
      const parentId = maybeContext.parentId ?? null;
      if (parentId === null) {
        return id;
      }
      return this.findTopLevelContextId(parentId);
    }
    findContextBySession(sessionId) {
      for (const context of this.#contexts.values()) {
        if (context.cdpTarget.cdpSessionId === sessionId) {
          return context;
        }
      }
      return;
    }
    /** Gets the context with the given ID, if any, otherwise throws. */
    getContext(id) {
      const result = this.findContext(id);
      if (result === void 0) {
        throw new protocol_js_1.NoSuchFrameException(`Context ${id} not found`);
      }
      return result;
    }
    verifyTopLevelContextsList(contexts) {
      const foundContexts = /* @__PURE__ */ new Set();
      if (!contexts) {
        return foundContexts;
      }
      for (const contextId of contexts) {
        const context = this.getContext(contextId);
        if (context.isTopLevelContext()) {
          foundContexts.add(context);
        } else {
          throw new protocol_js_1.InvalidArgumentException(`Non top-level context '${contextId}' given.`);
        }
      }
      return foundContexts;
    }
    verifyContextsList(contexts) {
      if (!contexts.length) {
        return;
      }
      for (const contextId of contexts) {
        this.getContext(contextId);
      }
    }
  };
  BrowsingContextStorage.BrowsingContextStorage = BrowsingContextStorage$1;
  return BrowsingContextStorage;
}
var NetworkStorage = {};
var NetworkRequest = {};
var DefaultMap = {};
var hasRequiredDefaultMap;
function requireDefaultMap() {
  if (hasRequiredDefaultMap) return DefaultMap;
  hasRequiredDefaultMap = 1;
  Object.defineProperty(DefaultMap, "__esModule", { value: true });
  DefaultMap.DefaultMap = void 0;
  let DefaultMap$1 = class DefaultMap extends Map {
    /** The default value to return whenever a key is not present in the map. */
    #getDefaultValue;
    constructor(getDefaultValue, entries) {
      super(entries);
      this.#getDefaultValue = getDefaultValue;
    }
    get(key) {
      if (!this.has(key)) {
        this.set(key, this.#getDefaultValue(key));
      }
      return super.get(key);
    }
  };
  DefaultMap.DefaultMap = DefaultMap$1;
  return DefaultMap;
}
var hasRequiredNetworkRequest;
function requireNetworkRequest() {
  if (hasRequiredNetworkRequest) return NetworkRequest;
  hasRequiredNetworkRequest = 1;
  var _a2;
  Object.defineProperty(NetworkRequest, "__esModule", { value: true });
  NetworkRequest.NetworkRequest = void 0;
  const protocol_js_1 = requireProtocol();
  const assert_js_1 = requireAssert();
  const DefaultMap_js_1 = requireDefaultMap();
  const Deferred_js_1 = requireDeferred();
  const log_js_1 = requireLog();
  const NetworkUtils_js_1 = requireNetworkUtils();
  const REALM_REGEX = new RegExp('(?<=realm=").*(?=")');
  let NetworkRequest$1 = class NetworkRequest {
    static unknownParameter = "UNKNOWN";
    /**
     * Each network request has an associated request id, which is a string
     * uniquely identifying that request.
     *
     * The identifier for a request resulting from a redirect matches that of the
     * request that initiated it.
     */
    #id;
    #fetchId;
    /**
     * Indicates the network intercept phase, if the request is currently blocked.
     * Undefined necessarily implies that the request is not blocked.
     */
    #interceptPhase;
    #servedFromCache = false;
    #redirectCount;
    #request = {};
    #requestOverrides;
    #responseOverrides;
    #response = {};
    #eventManager;
    #networkStorage;
    #cdpTarget;
    #logger;
    #emittedEvents = {
      [protocol_js_1.ChromiumBidi.Network.EventNames.AuthRequired]: false,
      [protocol_js_1.ChromiumBidi.Network.EventNames.BeforeRequestSent]: false,
      [protocol_js_1.ChromiumBidi.Network.EventNames.FetchError]: false,
      [protocol_js_1.ChromiumBidi.Network.EventNames.ResponseCompleted]: false,
      [protocol_js_1.ChromiumBidi.Network.EventNames.ResponseStarted]: false
    };
    waitNextPhase = new Deferred_js_1.Deferred();
    constructor(id, eventManager, networkStorage, cdpTarget, redirectCount = 0, logger) {
      this.#id = id;
      this.#eventManager = eventManager;
      this.#networkStorage = networkStorage;
      this.#cdpTarget = cdpTarget;
      this.#redirectCount = redirectCount;
      this.#logger = logger;
    }
    get id() {
      return this.#id;
    }
    get fetchId() {
      return this.#fetchId;
    }
    /**
     * When blocked returns the phase for it
     */
    get interceptPhase() {
      return this.#interceptPhase;
    }
    get url() {
      const fragment = this.#request.info?.request.urlFragment ?? this.#request.paused?.request.urlFragment ?? "";
      const url = this.#response.paused?.request.url ?? this.#requestOverrides?.url ?? this.#response.info?.url ?? this.#request.auth?.request.url ?? this.#request.info?.request.url ?? this.#request.paused?.request.url ?? _a2.unknownParameter;
      return `${url}${fragment}`;
    }
    get redirectCount() {
      return this.#redirectCount;
    }
    get cdpTarget() {
      return this.#cdpTarget;
    }
    get cdpClient() {
      return this.#cdpTarget.cdpClient;
    }
    isRedirecting() {
      return Boolean(this.#request.info);
    }
    #isDataUrl() {
      return this.url.startsWith("data:");
    }
    get #method() {
      return this.#requestOverrides?.method ?? this.#request.info?.request.method ?? this.#request.paused?.request.method ?? this.#request.auth?.request.method ?? this.#response.paused?.request.method;
    }
    get #navigationId() {
      if (!this.#request.info || !this.#request.info.loaderId || // When we navigate all CDP network events have `loaderId`
      // CDP's `loaderId` and `requestId` match when
      // that request triggered the loading
      this.#request.info.loaderId !== this.#request.info.requestId) {
        return null;
      }
      return this.#networkStorage.getNavigationId(this.#context ?? void 0);
    }
    get #cookies() {
      let cookies = [];
      if (this.#request.extraInfo) {
        cookies = this.#request.extraInfo.associatedCookies.filter(({ blockedReasons }) => {
          return !Array.isArray(blockedReasons) || blockedReasons.length === 0;
        }).map(({ cookie }) => (0, NetworkUtils_js_1.cdpToBiDiCookie)(cookie));
      }
      return cookies;
    }
    get #bodySize() {
      let bodySize = 0;
      if (typeof this.#requestOverrides?.bodySize === "number") {
        bodySize = this.#requestOverrides.bodySize;
      } else {
        bodySize = (0, NetworkUtils_js_1.bidiBodySizeFromCdpPostDataEntries)(this.#request.info?.request.postDataEntries ?? []);
      }
      return bodySize;
    }
    get #context() {
      const result = this.#response.paused?.frameId ?? this.#request.info?.frameId ?? this.#request.paused?.frameId ?? this.#request.auth?.frameId;
      if (result !== void 0) {
        return result;
      }
      if (this.#request?.info?.initiator.type === "preflight" && this.#request?.info?.initiator.requestId !== void 0) {
        const maybeInitiator = this.#networkStorage.getRequestById(this.#request?.info?.initiator.requestId);
        if (maybeInitiator !== void 0) {
          return maybeInitiator.#request.info?.frameId ?? null;
        }
      }
      return null;
    }
    /** Returns the HTTP status code associated with this request if any. */
    get #statusCode() {
      return this.#responseOverrides?.statusCode ?? this.#response.paused?.responseStatusCode ?? this.#response.extraInfo?.statusCode ?? this.#response.info?.status;
    }
    get #requestHeaders() {
      let headers = [];
      if (this.#requestOverrides?.headers) {
        const headerMap = new DefaultMap_js_1.DefaultMap(() => []);
        for (const header of this.#requestOverrides.headers) {
          headerMap.get(header.name).push(header.value.value);
        }
        for (const [name, value] of headerMap.entries()) {
          headers.push({
            name,
            value: {
              type: "string",
              value: value.join("\n").trimEnd()
            }
          });
        }
      } else {
        headers = [
          ...(0, NetworkUtils_js_1.bidiNetworkHeadersFromCdpNetworkHeaders)(this.#request.info?.request.headers),
          ...(0, NetworkUtils_js_1.bidiNetworkHeadersFromCdpNetworkHeaders)(this.#request.extraInfo?.headers)
        ];
      }
      return headers;
    }
    get #authChallenges() {
      if (!this.#response.info) {
        return;
      }
      if (!(this.#statusCode === 401 || this.#statusCode === 407)) {
        return void 0;
      }
      const headerName = this.#statusCode === 401 ? "WWW-Authenticate" : "Proxy-Authenticate";
      const authChallenges = [];
      for (const [header, value] of Object.entries(this.#response.info.headers)) {
        if (header.localeCompare(headerName, void 0, { sensitivity: "base" }) === 0) {
          authChallenges.push({
            scheme: value.split(" ").at(0) ?? "",
            realm: value.match(REALM_REGEX)?.at(0) ?? ""
          });
        }
      }
      return authChallenges;
    }
    get #timings() {
      const responseTimeOffset = (0, NetworkUtils_js_1.getTiming)((0, NetworkUtils_js_1.getTiming)(this.#response.info?.timing?.requestTime) - (0, NetworkUtils_js_1.getTiming)(this.#request.info?.timestamp));
      return {
        // TODO: Verify this is correct
        timeOrigin: Math.round((0, NetworkUtils_js_1.getTiming)(this.#request.info?.wallTime) * 1e3),
        // Timing baseline.
        // TODO: Verify this is correct.
        requestTime: 0,
        // TODO: set if redirect detected.
        redirectStart: 0,
        // TODO: set if redirect detected.
        redirectEnd: 0,
        // TODO: Verify this is correct
        // https://source.chromium.org/chromium/chromium/src/+/main:net/base/load_timing_info.h;l=145
        fetchStart: (0, NetworkUtils_js_1.getTiming)(this.#response.info?.timing?.workerFetchStart, responseTimeOffset),
        // fetchStart: 0,
        dnsStart: (0, NetworkUtils_js_1.getTiming)(this.#response.info?.timing?.dnsStart, responseTimeOffset),
        dnsEnd: (0, NetworkUtils_js_1.getTiming)(this.#response.info?.timing?.dnsEnd, responseTimeOffset),
        connectStart: (0, NetworkUtils_js_1.getTiming)(this.#response.info?.timing?.connectStart, responseTimeOffset),
        connectEnd: (0, NetworkUtils_js_1.getTiming)(this.#response.info?.timing?.connectEnd, responseTimeOffset),
        tlsStart: (0, NetworkUtils_js_1.getTiming)(this.#response.info?.timing?.sslStart, responseTimeOffset),
        requestStart: (0, NetworkUtils_js_1.getTiming)(this.#response.info?.timing?.sendStart, responseTimeOffset),
        // https://source.chromium.org/chromium/chromium/src/+/main:net/base/load_timing_info.h;l=196
        responseStart: (0, NetworkUtils_js_1.getTiming)(this.#response.info?.timing?.receiveHeadersStart, responseTimeOffset),
        responseEnd: (0, NetworkUtils_js_1.getTiming)(this.#response.info?.timing?.receiveHeadersEnd, responseTimeOffset)
      };
    }
    #phaseChanged() {
      this.waitNextPhase.resolve();
      this.waitNextPhase = new Deferred_js_1.Deferred();
    }
    #interceptsInPhase(phase) {
      if (!this.#cdpTarget.isSubscribedTo(`network.${phase}`)) {
        return /* @__PURE__ */ new Set();
      }
      return this.#networkStorage.getInterceptsForPhase(this, phase);
    }
    #isBlockedInPhase(phase) {
      return this.#interceptsInPhase(phase).size > 0;
    }
    handleRedirect(event) {
      this.#response.hasExtraInfo = false;
      this.#response.info = event.redirectResponse;
      this.#emitEventsIfReady({
        wasRedirected: true
      });
    }
    #emitEventsIfReady(options = {}) {
      const requestExtraInfoCompleted = (
        // Flush redirects
        options.wasRedirected || options.hasFailed || this.#isDataUrl() || Boolean(this.#request.extraInfo) || // Requests from cache don't have extra info
        this.#servedFromCache || // Sometimes there is no extra info and the response
        // is the only place we can find out
        Boolean(this.#response.info && !this.#response.hasExtraInfo)
      );
      const noInterceptionExpected = (
        // We can't intercept data urls from CDP
        this.#isDataUrl() || // Cached requests never hit the network
        this.#servedFromCache
      );
      const requestInterceptionExpected = !noInterceptionExpected && this.#isBlockedInPhase(
        "beforeRequestSent"
        /* Network.InterceptPhase.BeforeRequestSent */
      );
      const requestInterceptionCompleted = !requestInterceptionExpected || requestInterceptionExpected && Boolean(this.#request.paused);
      if (Boolean(this.#request.info) && (requestInterceptionExpected ? requestInterceptionCompleted : requestExtraInfoCompleted)) {
        this.#emitEvent(this.#getBeforeRequestEvent.bind(this));
      }
      const responseExtraInfoCompleted = Boolean(this.#response.extraInfo) || // Response from cache don't have extra info
      this.#servedFromCache || // Don't expect extra info if the flag is false
      Boolean(this.#response.info && !this.#response.hasExtraInfo);
      const responseInterceptionExpected = !noInterceptionExpected && this.#isBlockedInPhase(
        "responseStarted"
        /* Network.InterceptPhase.ResponseStarted */
      );
      if (this.#response.info || responseInterceptionExpected && Boolean(this.#response.paused)) {
        this.#emitEvent(this.#getResponseStartedEvent.bind(this));
      }
      const responseInterceptionCompleted = !responseInterceptionExpected || responseInterceptionExpected && Boolean(this.#response.paused);
      if (Boolean(this.#response.info) && responseExtraInfoCompleted && responseInterceptionCompleted) {
        this.#emitEvent(this.#getResponseReceivedEvent.bind(this));
        this.#networkStorage.disposeRequest(this.id);
      }
    }
    onRequestWillBeSentEvent(event) {
      this.#request.info = event;
      this.#emitEventsIfReady();
    }
    onRequestWillBeSentExtraInfoEvent(event) {
      this.#request.extraInfo = event;
      this.#emitEventsIfReady();
    }
    onResponseReceivedExtraInfoEvent(event) {
      if (event.statusCode >= 300 && event.statusCode <= 399 && this.#request.info && event.headers["location"] === this.#request.info.request.url) {
        return;
      }
      this.#response.extraInfo = event;
      this.#emitEventsIfReady();
    }
    onResponseReceivedEvent(event) {
      this.#response.hasExtraInfo = event.hasExtraInfo;
      this.#response.info = event.response;
      this.#networkStorage.markRequestCollectedIfNeeded(this);
      this.#emitEventsIfReady();
    }
    onServedFromCache() {
      this.#servedFromCache = true;
      this.#emitEventsIfReady();
    }
    onLoadingFailedEvent(event) {
      this.#emitEventsIfReady({
        hasFailed: true
      });
      this.#emitEvent(() => {
        return {
          method: protocol_js_1.ChromiumBidi.Network.EventNames.FetchError,
          params: {
            ...this.#getBaseEventParams(),
            errorText: event.errorText
          }
        };
      });
    }
    /** @see https://chromedevtools.github.io/devtools-protocol/tot/Fetch/#method-failRequest */
    async failRequest(errorReason) {
      (0, assert_js_1.assert)(this.#fetchId, "Network Interception not set-up.");
      await this.cdpClient.sendCommand("Fetch.failRequest", {
        requestId: this.#fetchId,
        errorReason
      });
      this.#interceptPhase = void 0;
    }
    onRequestPaused(event) {
      this.#fetchId = event.requestId;
      if (event.responseStatusCode || event.responseErrorReason) {
        this.#response.paused = event;
        if (this.#isBlockedInPhase(
          "responseStarted"
          /* Network.InterceptPhase.ResponseStarted */
        ) && // CDP may emit multiple events for a single request
        !this.#emittedEvents[protocol_js_1.ChromiumBidi.Network.EventNames.ResponseStarted] && // Continue all response that have not enabled Network domain
        this.#fetchId !== this.id) {
          this.#interceptPhase = "responseStarted";
        } else {
          void this.#continueResponse();
        }
      } else {
        this.#request.paused = event;
        if (this.#isBlockedInPhase(
          "beforeRequestSent"
          /* Network.InterceptPhase.BeforeRequestSent */
        ) && // CDP may emit multiple events for a single request
        !this.#emittedEvents[protocol_js_1.ChromiumBidi.Network.EventNames.BeforeRequestSent] && // Continue all requests that have not enabled Network domain
        this.#fetchId !== this.id) {
          this.#interceptPhase = "beforeRequestSent";
        } else {
          void this.#continueRequest();
        }
      }
      this.#emitEventsIfReady();
    }
    onAuthRequired(event) {
      this.#fetchId = event.requestId;
      this.#request.auth = event;
      if (this.#isBlockedInPhase(
        "authRequired"
        /* Network.InterceptPhase.AuthRequired */
      ) && // Continue all auth requests that have not enabled Network domain
      this.#fetchId !== this.id) {
        this.#interceptPhase = "authRequired";
      } else {
        void this.#continueWithAuth({
          response: "Default"
        });
      }
      this.#emitEvent(() => {
        return {
          method: protocol_js_1.ChromiumBidi.Network.EventNames.AuthRequired,
          params: {
            ...this.#getBaseEventParams(
              "authRequired"
              /* Network.InterceptPhase.AuthRequired */
            ),
            response: this.#getResponseEventParams()
          }
        };
      });
    }
    /** @see https://chromedevtools.github.io/devtools-protocol/tot/Fetch/#method-continueRequest */
    async continueRequest(overrides = {}) {
      const overrideHeaders = this.#getOverrideHeader(overrides.headers, overrides.cookies);
      const headers = (0, NetworkUtils_js_1.cdpFetchHeadersFromBidiNetworkHeaders)(overrideHeaders);
      const postData = getCdpBodyFromBiDiBytesValue(overrides.body);
      await this.#continueRequest({
        url: overrides.url,
        method: overrides.method,
        headers,
        postData
      });
      this.#requestOverrides = {
        url: overrides.url,
        method: overrides.method,
        headers: overrides.headers,
        cookies: overrides.cookies,
        bodySize: getSizeFromBiDiBytesValue(overrides.body)
      };
    }
    async #continueRequest(overrides = {}) {
      (0, assert_js_1.assert)(this.#fetchId, "Network Interception not set-up.");
      await this.cdpClient.sendCommand("Fetch.continueRequest", {
        requestId: this.#fetchId,
        url: overrides.url,
        method: overrides.method,
        headers: overrides.headers,
        postData: overrides.postData
      });
      this.#interceptPhase = void 0;
    }
    /** @see https://chromedevtools.github.io/devtools-protocol/tot/Fetch/#method-continueResponse */
    async continueResponse(overrides = {}) {
      if (this.interceptPhase === "authRequired") {
        if (overrides.credentials) {
          await Promise.all([
            this.waitNextPhase,
            await this.#continueWithAuth({
              response: "ProvideCredentials",
              username: overrides.credentials.username,
              password: overrides.credentials.password
            })
          ]);
        } else {
          return await this.#continueWithAuth({
            response: "ProvideCredentials"
          });
        }
      }
      if (this.#interceptPhase === "responseStarted") {
        const overrideHeaders = this.#getOverrideHeader(overrides.headers, overrides.cookies);
        const responseHeaders = (0, NetworkUtils_js_1.cdpFetchHeadersFromBidiNetworkHeaders)(overrideHeaders);
        await this.#continueResponse({
          responseCode: overrides.statusCode ?? this.#response.paused?.responseStatusCode,
          responsePhrase: overrides.reasonPhrase ?? this.#response.paused?.responseStatusText,
          responseHeaders: responseHeaders ?? this.#response.paused?.responseHeaders
        });
        this.#responseOverrides = {
          statusCode: overrides.statusCode,
          headers: overrideHeaders
        };
      }
    }
    async #continueResponse({ responseCode, responsePhrase, responseHeaders } = {}) {
      (0, assert_js_1.assert)(this.#fetchId, "Network Interception not set-up.");
      await this.cdpClient.sendCommand("Fetch.continueResponse", {
        requestId: this.#fetchId,
        responseCode,
        responsePhrase,
        responseHeaders
      });
      this.#interceptPhase = void 0;
    }
    /** @see https://chromedevtools.github.io/devtools-protocol/tot/Fetch/#method-continueWithAuth */
    async continueWithAuth(authChallenge) {
      let username;
      let password;
      if (authChallenge.action === "provideCredentials") {
        const { credentials } = authChallenge;
        username = credentials.username;
        password = credentials.password;
      }
      const response = (0, NetworkUtils_js_1.cdpAuthChallengeResponseFromBidiAuthContinueWithAuthAction)(authChallenge.action);
      await this.#continueWithAuth({
        response,
        username,
        password
      });
    }
    /** @see https://chromedevtools.github.io/devtools-protocol/tot/Fetch/#method-provideResponse */
    async provideResponse(overrides) {
      (0, assert_js_1.assert)(this.#fetchId, "Network Interception not set-up.");
      if (this.interceptPhase === "authRequired") {
        return await this.#continueWithAuth({
          response: "ProvideCredentials"
        });
      }
      if (!overrides.body && !overrides.headers) {
        return await this.#continueRequest();
      }
      const overrideHeaders = this.#getOverrideHeader(overrides.headers, overrides.cookies);
      const responseHeaders = (0, NetworkUtils_js_1.cdpFetchHeadersFromBidiNetworkHeaders)(overrideHeaders);
      const responseCode = overrides.statusCode ?? this.#statusCode ?? 200;
      await this.cdpClient.sendCommand("Fetch.fulfillRequest", {
        requestId: this.#fetchId,
        responseCode,
        responsePhrase: overrides.reasonPhrase,
        responseHeaders,
        body: getCdpBodyFromBiDiBytesValue(overrides.body)
      });
      this.#interceptPhase = void 0;
    }
    dispose() {
      this.waitNextPhase.reject(new Error("waitNextPhase disposed"));
    }
    async #continueWithAuth(authChallengeResponse) {
      (0, assert_js_1.assert)(this.#fetchId, "Network Interception not set-up.");
      await this.cdpClient.sendCommand("Fetch.continueWithAuth", {
        requestId: this.#fetchId,
        authChallengeResponse
      });
      this.#interceptPhase = void 0;
    }
    #emitEvent(getEvent) {
      let event;
      try {
        event = getEvent();
      } catch (error) {
        this.#logger?.(log_js_1.LogType.debugError, error);
        return;
      }
      if (this.#isIgnoredEvent() || this.#emittedEvents[event.method] && // Special case this event can be emitted multiple times
      event.method !== protocol_js_1.ChromiumBidi.Network.EventNames.AuthRequired) {
        return;
      }
      this.#phaseChanged();
      this.#emittedEvents[event.method] = true;
      if (this.#context) {
        this.#eventManager.registerEvent(Object.assign(event, {
          type: "event"
        }), this.#context);
      } else {
        this.#eventManager.registerGlobalEvent(Object.assign(event, {
          type: "event"
        }));
      }
    }
    #getBaseEventParams(phase) {
      const interceptProps = {
        isBlocked: false
      };
      if (phase) {
        const blockedBy = this.#interceptsInPhase(phase);
        interceptProps.isBlocked = blockedBy.size > 0;
        if (interceptProps.isBlocked) {
          interceptProps.intercepts = [...blockedBy];
        }
      }
      return {
        context: this.#context,
        navigation: this.#navigationId,
        redirectCount: this.#redirectCount,
        request: this.#getRequestData(),
        // Timestamp should be in milliseconds, while CDP provides it in seconds.
        timestamp: Math.round((0, NetworkUtils_js_1.getTiming)(this.#request.info?.wallTime) * 1e3),
        // Contains isBlocked and intercepts
        ...interceptProps
      };
    }
    #getResponseEventParams() {
      if (this.#response.info?.fromDiskCache) {
        this.#response.extraInfo = void 0;
      }
      const headers = [
        ...(0, NetworkUtils_js_1.bidiNetworkHeadersFromCdpNetworkHeaders)(this.#response.info?.headers),
        ...(0, NetworkUtils_js_1.bidiNetworkHeadersFromCdpNetworkHeaders)(this.#response.extraInfo?.headers)
        // TODO: Verify how to dedupe these
        // ...bidiNetworkHeadersFromCdpNetworkHeadersEntries(
        //   this.#response.paused?.responseHeaders
        // ),
      ];
      const authChallenges = this.#authChallenges;
      const response = {
        url: this.url,
        protocol: this.#response.info?.protocol ?? "",
        status: this.#statusCode ?? -1,
        // TODO: Throw an exception or use some other status code?
        statusText: this.#response.info?.statusText || this.#response.paused?.responseStatusText || "",
        fromCache: this.#response.info?.fromDiskCache || this.#response.info?.fromPrefetchCache || this.#servedFromCache,
        headers: this.#responseOverrides?.headers ?? headers,
        mimeType: this.#response.info?.mimeType || "",
        bytesReceived: this.#response.info?.encodedDataLength || 0,
        headersSize: (0, NetworkUtils_js_1.computeHeadersSize)(headers),
        // TODO: consider removing from spec.
        bodySize: 0,
        content: {
          // TODO: consider removing from spec.
          size: 0
        },
        ...authChallenges ? { authChallenges } : {}
      };
      return {
        ...response,
        "goog:securityDetails": this.#response.info?.securityDetails
      };
    }
    #getRequestData() {
      const headers = this.#requestHeaders;
      const request = {
        request: this.#id,
        url: this.url,
        method: this.#method ?? _a2.unknownParameter,
        headers,
        cookies: this.#cookies,
        headersSize: (0, NetworkUtils_js_1.computeHeadersSize)(headers),
        bodySize: this.#bodySize,
        // TODO: populate
        destination: this.#getDestination(),
        // TODO: populate
        initiatorType: this.#getInitiatorType(),
        timings: this.#timings
      };
      return {
        ...request,
        "goog:postData": this.#request.info?.request?.postData,
        "goog:hasPostData": this.#request.info?.request?.hasPostData,
        "goog:resourceType": this.#request.info?.type,
        "goog:resourceInitiator": this.#request.info?.initiator
      };
    }
    /**
     * Heuristic trying to guess the destination.
     * Specification: https://fetch.spec.whatwg.org/#concept-request-destination.
     * Specified values: "audio", "audioworklet", "document", "embed", "font", "frame",
     * "iframe", "image", "json", "manifest", "object", "paintworklet", "report", "script",
     * "serviceworker", "sharedworker", "style", "track", "video", "webidentity", "worker",
     * "xslt".
     */
    #getDestination() {
      switch (this.#request.info?.type) {
        case "Script":
          return "script";
        case "Stylesheet":
          return "style";
        case "Image":
          return "image";
        case "Document":
          return this.#request.info?.initiator.type === "parser" ? "iframe" : "";
        default:
          return "";
      }
    }
    /**
     * Heuristic trying to guess the initiator type.
     * Specification: https://fetch.spec.whatwg.org/#request-initiator-type.
     * Specified values: "audio", "beacon", "body", "css", "early-hints", "embed", "fetch",
     * "font", "frame", "iframe", "image", "img", "input", "link", "object", "ping",
     * "script", "track", "video", "xmlhttprequest", "other".
     */
    #getInitiatorType() {
      if (this.#request.info?.initiator.type === "parser") {
        switch (this.#request.info?.type) {
          case "Document":
            return "iframe";
          case "Font":
            return this.#request.info?.initiator?.url === this.#request.info?.documentURL ? "font" : "css";
          case "Image":
            return this.#request.info?.initiator?.url === this.#request.info?.documentURL ? "img" : "css";
          case "Script":
            return "script";
          case "Stylesheet":
            return "link";
          default:
            return null;
        }
      }
      if (this.#request?.info?.type === "Fetch") {
        return "fetch";
      }
      return null;
    }
    #getBeforeRequestEvent() {
      (0, assert_js_1.assert)(this.#request.info, "RequestWillBeSentEvent is not set");
      return {
        method: protocol_js_1.ChromiumBidi.Network.EventNames.BeforeRequestSent,
        params: {
          ...this.#getBaseEventParams(
            "beforeRequestSent"
            /* Network.InterceptPhase.BeforeRequestSent */
          ),
          initiator: {
            type: _a2.#getInitiator(this.#request.info.initiator.type),
            columnNumber: this.#request.info.initiator.columnNumber,
            lineNumber: this.#request.info.initiator.lineNumber,
            stackTrace: this.#request.info.initiator.stack,
            request: this.#request.info.initiator.requestId
          }
        }
      };
    }
    #getResponseStartedEvent() {
      return {
        method: protocol_js_1.ChromiumBidi.Network.EventNames.ResponseStarted,
        params: {
          ...this.#getBaseEventParams(
            "responseStarted"
            /* Network.InterceptPhase.ResponseStarted */
          ),
          response: this.#getResponseEventParams()
        }
      };
    }
    #getResponseReceivedEvent() {
      return {
        method: protocol_js_1.ChromiumBidi.Network.EventNames.ResponseCompleted,
        params: {
          ...this.#getBaseEventParams(),
          response: this.#getResponseEventParams()
        }
      };
    }
    #isIgnoredEvent() {
      const faviconUrl = "/favicon.ico";
      return this.#request.paused?.request.url.endsWith(faviconUrl) ?? this.#request.info?.request.url.endsWith(faviconUrl) ?? false;
    }
    #getOverrideHeader(headers, cookies) {
      if (!headers && !cookies) {
        return void 0;
      }
      let overrideHeaders = headers;
      const cookieHeader = (0, NetworkUtils_js_1.networkHeaderFromCookieHeaders)(cookies);
      if (cookieHeader && !overrideHeaders) {
        overrideHeaders = this.#requestHeaders;
      }
      if (cookieHeader && overrideHeaders) {
        overrideHeaders.filter((header) => header.name.localeCompare("cookie", void 0, {
          sensitivity: "base"
        }) !== 0);
        overrideHeaders.push(cookieHeader);
      }
      return overrideHeaders;
    }
    static #getInitiator(initiatorType) {
      switch (initiatorType) {
        case "parser":
        case "script":
        case "preflight":
          return initiatorType;
        default:
          return "other";
      }
    }
  };
  NetworkRequest.NetworkRequest = NetworkRequest$1;
  _a2 = NetworkRequest$1;
  function getCdpBodyFromBiDiBytesValue(body) {
    let parsedBody;
    if (body?.type === "string") {
      parsedBody = (0, NetworkUtils_js_1.stringToBase64)(body.value);
    } else if (body?.type === "base64") {
      parsedBody = body.value;
    }
    return parsedBody;
  }
  function getSizeFromBiDiBytesValue(body) {
    if (body?.type === "string") {
      return body.value.length;
    } else if (body?.type === "base64") {
      return atob(body.value).length;
    }
    return 0;
  }
  return NetworkRequest;
}
var hasRequiredNetworkStorage;
function requireNetworkStorage() {
  if (hasRequiredNetworkStorage) return NetworkStorage;
  hasRequiredNetworkStorage = 1;
  Object.defineProperty(NetworkStorage, "__esModule", { value: true });
  NetworkStorage.NetworkStorage = void 0;
  const protocol_js_1 = requireProtocol();
  const log_js_1 = requireLog();
  const uuid_js_1 = requireUuid();
  const NetworkRequest_js_1 = requireNetworkRequest();
  const NetworkUtils_js_1 = requireNetworkUtils();
  let NetworkStorage$1 = class NetworkStorage {
    #browsingContextStorage;
    #eventManager;
    #logger;
    /**
     * A map from network request ID to Network Request objects.
     * Needed as long as information about requests comes from different events.
     */
    #requests = /* @__PURE__ */ new Map();
    /** A map from intercept ID to track active network intercepts. */
    #intercepts = /* @__PURE__ */ new Map();
    #collectors = /* @__PURE__ */ new Map();
    #requestCollectors = /* @__PURE__ */ new Map();
    #defaultCacheBehavior = "default";
    constructor(eventManager, browsingContextStorage, browserClient, logger) {
      this.#browsingContextStorage = browsingContextStorage;
      this.#eventManager = eventManager;
      browserClient.on("Target.detachedFromTarget", ({ sessionId }) => {
        this.disposeRequestMap(sessionId);
      });
      this.#logger = logger;
    }
    /**
     * Gets the network request with the given ID, if any.
     * Otherwise, creates a new network request with the given ID and cdp target.
     */
    #getOrCreateNetworkRequest(id, cdpTarget, redirectCount) {
      let request = this.getRequestById(id);
      if (request) {
        return request;
      }
      request = new NetworkRequest_js_1.NetworkRequest(id, this.#eventManager, this, cdpTarget, redirectCount, this.#logger);
      this.addRequest(request);
      return request;
    }
    onCdpTargetCreated(cdpTarget) {
      const cdpClient = cdpTarget.cdpClient;
      const listeners = [
        [
          "Network.requestWillBeSent",
          (params) => {
            const request = this.getRequestById(params.requestId);
            if (request && request.isRedirecting()) {
              request.handleRedirect(params);
              this.disposeRequest(params.requestId);
              this.#getOrCreateNetworkRequest(params.requestId, cdpTarget, request.redirectCount + 1).onRequestWillBeSentEvent(params);
            } else {
              this.#getOrCreateNetworkRequest(params.requestId, cdpTarget).onRequestWillBeSentEvent(params);
            }
          }
        ],
        [
          "Network.requestWillBeSentExtraInfo",
          (params) => {
            this.#getOrCreateNetworkRequest(params.requestId, cdpTarget).onRequestWillBeSentExtraInfoEvent(params);
          }
        ],
        [
          "Network.responseReceived",
          (params) => {
            this.#getOrCreateNetworkRequest(params.requestId, cdpTarget).onResponseReceivedEvent(params);
          }
        ],
        [
          "Network.responseReceivedExtraInfo",
          (params) => {
            this.#getOrCreateNetworkRequest(params.requestId, cdpTarget).onResponseReceivedExtraInfoEvent(params);
          }
        ],
        [
          "Network.requestServedFromCache",
          (params) => {
            this.#getOrCreateNetworkRequest(params.requestId, cdpTarget).onServedFromCache();
          }
        ],
        [
          "Network.loadingFailed",
          (params) => {
            this.#getOrCreateNetworkRequest(params.requestId, cdpTarget).onLoadingFailedEvent(params);
          }
        ],
        [
          "Fetch.requestPaused",
          (event) => {
            this.#getOrCreateNetworkRequest(
              // CDP quirk if the Network domain is not present this is undefined
              event.networkId ?? event.requestId,
              cdpTarget
            ).onRequestPaused(event);
          }
        ],
        [
          "Fetch.authRequired",
          (event) => {
            let request = this.getRequestByFetchId(event.requestId);
            if (!request) {
              request = this.#getOrCreateNetworkRequest(event.requestId, cdpTarget);
            }
            request.onAuthRequired(event);
          }
        ]
      ];
      for (const [event, listener] of listeners) {
        cdpClient.on(event, listener);
      }
    }
    getCollectorsForBrowsingContext(browsingContextId) {
      if (!this.#browsingContextStorage.hasContext(browsingContextId)) {
        this.#logger?.(log_js_1.LogType.debugError, "trying to get collector for unknown browsing context");
        return [];
      }
      const userContext = this.#browsingContextStorage.getContext(browsingContextId).userContext;
      const collectors = /* @__PURE__ */ new Set();
      for (const collector of this.#collectors.values()) {
        if (collector.contexts?.includes(browsingContextId)) {
          collectors.add(collector);
        }
        if (collector.userContexts?.includes(userContext)) {
          collectors.add(collector);
        }
        if (collector.userContexts === void 0 && collector.contexts === void 0) {
          collectors.add(collector);
        }
      }
      return [...collectors.values()];
    }
    async getCollectedData(params) {
      if (params.collector !== void 0 && !this.#collectors.has(params.collector)) {
        throw new protocol_js_1.NoSuchNetworkCollectorException(`Unknown collector ${params.collector}`);
      }
      const requestCollectors = this.#requestCollectors.get(params.request);
      if (requestCollectors === void 0) {
        throw new protocol_js_1.NoSuchNetworkDataException(`No collected data for request ${params.request}`);
      }
      if (params.collector !== void 0 && !requestCollectors.has(params.collector)) {
        throw new protocol_js_1.NoSuchNetworkDataException(`Collector ${params.collector} didn't collect data for request ${params.request}`);
      }
      if (params.disown && params.collector === void 0) {
        throw new protocol_js_1.InvalidArgumentException("Cannot disown collected data without collector ID");
      }
      const request = this.getRequestById(params.request);
      if (request === void 0) {
        throw new protocol_js_1.NoSuchNetworkDataException(`No collected data for request ${params.request}`);
      }
      const responseBody = await request.cdpClient.sendCommand("Network.getResponseBody", { requestId: request.id });
      if (params.disown && params.collector !== void 0) {
        this.#requestCollectors.delete(params.request);
        this.disposeRequest(request.id);
      }
      return {
        bytes: {
          type: responseBody.base64Encoded ? "base64" : "string",
          value: responseBody.body
        }
      };
    }
    #getCollectorIdsForRequest(request) {
      const collectors = /* @__PURE__ */ new Set();
      for (const collectorId of this.#collectors.keys()) {
        const collector = this.#collectors.get(collectorId);
        if (!collector.userContexts && !collector.contexts) {
          collectors.add(collectorId);
        }
        if (collector.contexts?.includes(request.cdpTarget.topLevelId)) {
          collectors.add(collectorId);
        }
        if (collector.userContexts?.includes(this.#browsingContextStorage.getContext(request.cdpTarget.topLevelId).userContext)) {
          collectors.add(collectorId);
        }
      }
      this.#logger?.(log_js_1.LogType.debug, `Request ${request.id} has ${collectors.size} collectors`);
      return [...collectors.values()];
    }
    markRequestCollectedIfNeeded(request) {
      const collectorIds = this.#getCollectorIdsForRequest(request);
      if (collectorIds.length > 0) {
        this.#requestCollectors.set(request.id, new Set(collectorIds));
      }
    }
    getInterceptionStages(browsingContextId) {
      const stages = {
        request: false,
        response: false,
        auth: false
      };
      for (const intercept of this.#intercepts.values()) {
        if (intercept.contexts && !intercept.contexts.includes(browsingContextId)) {
          continue;
        }
        stages.request ||= intercept.phases.includes(
          "beforeRequestSent"
          /* Network.InterceptPhase.BeforeRequestSent */
        );
        stages.response ||= intercept.phases.includes(
          "responseStarted"
          /* Network.InterceptPhase.ResponseStarted */
        );
        stages.auth ||= intercept.phases.includes(
          "authRequired"
          /* Network.InterceptPhase.AuthRequired */
        );
      }
      return stages;
    }
    getInterceptsForPhase(request, phase) {
      if (request.url === NetworkRequest_js_1.NetworkRequest.unknownParameter) {
        return /* @__PURE__ */ new Set();
      }
      const intercepts = /* @__PURE__ */ new Set();
      for (const [interceptId, intercept] of this.#intercepts.entries()) {
        if (!intercept.phases.includes(phase) || intercept.contexts && !intercept.contexts.includes(request.cdpTarget.topLevelId)) {
          continue;
        }
        if (intercept.urlPatterns.length === 0) {
          intercepts.add(interceptId);
          continue;
        }
        for (const pattern of intercept.urlPatterns) {
          if ((0, NetworkUtils_js_1.matchUrlPattern)(pattern, request.url)) {
            intercepts.add(interceptId);
            break;
          }
        }
      }
      return intercepts;
    }
    disposeRequestMap(sessionId) {
      for (const request of this.#requests.values()) {
        if (request.cdpClient.sessionId === sessionId) {
          this.#requests.delete(request.id);
          request.dispose();
        }
      }
    }
    /**
     * Adds the given entry to the intercept map.
     * URL patterns are assumed to be parsed.
     *
     * @return The intercept ID.
     */
    addIntercept(value) {
      const interceptId = (0, uuid_js_1.uuidv4)();
      this.#intercepts.set(interceptId, value);
      return interceptId;
    }
    /**
     * Removes the given intercept from the intercept map.
     * Throws NoSuchInterceptException if the intercept does not exist.
     */
    removeIntercept(intercept) {
      if (!this.#intercepts.has(intercept)) {
        throw new protocol_js_1.NoSuchInterceptException(`Intercept '${intercept}' does not exist.`);
      }
      this.#intercepts.delete(intercept);
    }
    getRequestsByTarget(target) {
      const requests2 = [];
      for (const request of this.#requests.values()) {
        if (request.cdpTarget === target) {
          requests2.push(request);
        }
      }
      return requests2;
    }
    getRequestById(id) {
      return this.#requests.get(id);
    }
    getRequestByFetchId(fetchId) {
      for (const request of this.#requests.values()) {
        if (request.fetchId === fetchId) {
          return request;
        }
      }
      return;
    }
    addRequest(request) {
      this.#requests.set(request.id, request);
    }
    disposeRequest(id) {
      if (this.#requestCollectors.get(id)?.size ?? 0 > 0) {
        return;
      }
      this.#requests.delete(id);
    }
    /**
     * Gets the virtual navigation ID for the given navigable ID.
     */
    getNavigationId(contextId) {
      if (contextId === void 0) {
        return null;
      }
      return this.#browsingContextStorage.findContext(contextId)?.navigationId ?? null;
    }
    set defaultCacheBehavior(behavior) {
      this.#defaultCacheBehavior = behavior;
    }
    get defaultCacheBehavior() {
      return this.#defaultCacheBehavior;
    }
    addDataCollector(params) {
      const collectorId = (0, uuid_js_1.uuidv4)();
      this.#collectors.set(collectorId, params);
      return collectorId;
    }
    removeDataCollector(params) {
      const collectorId = params.collector;
      if (!this.#collectors.has(collectorId)) {
        throw new protocol_js_1.NoSuchNetworkCollectorException(`Collector ${params.collector} does not exist`);
      }
      this.#collectors.delete(params.collector);
      for (const [requestId, collectorIds] of this.#requestCollectors) {
        if (collectorIds.has(collectorId)) {
          collectorIds.delete(collectorId);
          if (collectorIds.size === 0) {
            this.#requestCollectors.delete(requestId);
            this.disposeRequest(requestId);
          }
        }
      }
    }
    disownData(params) {
      const collectorId = params.collector;
      const requestId = params.request;
      if (!this.#collectors.has(collectorId)) {
        throw new protocol_js_1.NoSuchNetworkCollectorException(`Collector ${collectorId} does not exist`);
      }
      if (!this.#requestCollectors.has(requestId)) {
        throw new protocol_js_1.NoSuchNetworkDataException(`No collected data for request ${requestId}`);
      }
      const collectorIds = this.#requestCollectors.get(requestId);
      if (!collectorIds.has(collectorId)) {
        throw new protocol_js_1.NoSuchNetworkDataException(`No collected data for request ${requestId} and collector ${collectorId}`);
      }
      collectorIds.delete(collectorId);
      if (collectorIds.size === 0) {
        this.#requestCollectors.delete(requestId);
        this.disposeRequest(requestId);
      }
    }
  };
  NetworkStorage.NetworkStorage = NetworkStorage$1;
  return NetworkStorage;
}
var PreloadScriptStorage = {};
var hasRequiredPreloadScriptStorage;
function requirePreloadScriptStorage() {
  if (hasRequiredPreloadScriptStorage) return PreloadScriptStorage;
  hasRequiredPreloadScriptStorage = 1;
  Object.defineProperty(PreloadScriptStorage, "__esModule", { value: true });
  PreloadScriptStorage.PreloadScriptStorage = void 0;
  const ErrorResponse_js_1 = requireErrorResponse();
  let PreloadScriptStorage$1 = class PreloadScriptStorage {
    /** Tracks all BiDi preload scripts.  */
    #scripts = /* @__PURE__ */ new Set();
    /**
     * Finds all entries that match the given filter (OR logic).
     */
    find(filter) {
      if (!filter) {
        return [...this.#scripts];
      }
      return [...this.#scripts].filter((script) => {
        if (script.contexts === void 0 && script.userContexts === void 0) {
          return true;
        }
        if (filter.targetId !== void 0 && script.targetIds.has(filter.targetId)) {
          return true;
        }
        return false;
      });
    }
    add(preloadScript) {
      this.#scripts.add(preloadScript);
    }
    /** Deletes all BiDi preload script entries that match the given filter. */
    remove(id) {
      const script = [...this.#scripts].find((script2) => script2.id === id);
      if (script === void 0) {
        throw new ErrorResponse_js_1.NoSuchScriptException(`No preload script with id '${id}'`);
      }
      this.#scripts.delete(script);
    }
    /** Gets the preload script with the given ID, if any, otherwise throws. */
    getPreloadScript(id) {
      const script = [...this.#scripts].find((script2) => script2.id === id);
      if (script === void 0) {
        throw new ErrorResponse_js_1.NoSuchScriptException(`No preload script with id '${id}'`);
      }
      return script;
    }
    onCdpTargetCreated(targetId, userContext) {
      const scriptInUserContext = [...this.#scripts].filter((script) => {
        if (!script.userContexts && !script.contexts) {
          return true;
        }
        return script.userContexts?.includes(userContext);
      });
      for (const script of scriptInUserContext) {
        script.targetIds.add(targetId);
      }
    }
  };
  PreloadScriptStorage.PreloadScriptStorage = PreloadScriptStorage$1;
  return PreloadScriptStorage;
}
var RealmStorage = {};
var hasRequiredRealmStorage;
function requireRealmStorage() {
  if (hasRequiredRealmStorage) return RealmStorage;
  hasRequiredRealmStorage = 1;
  Object.defineProperty(RealmStorage, "__esModule", { value: true });
  RealmStorage.RealmStorage = void 0;
  const protocol_js_1 = requireProtocol();
  const WindowRealm_js_1 = requireWindowRealm();
  let RealmStorage$1 = class RealmStorage {
    /** Tracks handles and their realms sent to the client. */
    #knownHandlesToRealmMap = /* @__PURE__ */ new Map();
    /** Map from realm ID to Realm. */
    #realmMap = /* @__PURE__ */ new Map();
    /** List of the internal sandboxed realms which should not be reported to the user. */
    hiddenSandboxes = /* @__PURE__ */ new Set();
    get knownHandlesToRealmMap() {
      return this.#knownHandlesToRealmMap;
    }
    addRealm(realm) {
      this.#realmMap.set(realm.realmId, realm);
    }
    /** Finds all realms that match the given filter. */
    findRealms(filter) {
      return Array.from(this.#realmMap.values()).filter((realm) => {
        if (filter.realmId !== void 0 && filter.realmId !== realm.realmId) {
          return false;
        }
        if (filter.browsingContextId !== void 0 && !realm.associatedBrowsingContexts.map((browsingContext) => browsingContext.id).includes(filter.browsingContextId)) {
          return false;
        }
        if (filter.sandbox !== void 0 && (!(realm instanceof WindowRealm_js_1.WindowRealm) || filter.sandbox !== realm.sandbox)) {
          return false;
        }
        if (filter.executionContextId !== void 0 && filter.executionContextId !== realm.executionContextId) {
          return false;
        }
        if (filter.origin !== void 0 && filter.origin !== realm.origin) {
          return false;
        }
        if (filter.type !== void 0 && filter.type !== realm.realmType) {
          return false;
        }
        if (filter.cdpSessionId !== void 0 && filter.cdpSessionId !== realm.cdpClient.sessionId) {
          return false;
        }
        if (filter.isHidden !== void 0 && filter.isHidden !== realm.isHidden()) {
          return false;
        }
        return true;
      });
    }
    findRealm(filter) {
      const maybeRealms = this.findRealms(filter);
      if (maybeRealms.length !== 1) {
        return void 0;
      }
      return maybeRealms[0];
    }
    /** Gets the only realm that matches the given filter, if any, otherwise throws. */
    getRealm(filter) {
      const maybeRealm = this.findRealm(filter);
      if (maybeRealm === void 0) {
        throw new protocol_js_1.NoSuchFrameException(`Realm ${JSON.stringify(filter)} not found`);
      }
      return maybeRealm;
    }
    /** Deletes all realms that match the given filter. */
    deleteRealms(filter) {
      this.findRealms(filter).map((realm) => {
        realm.dispose();
        this.#realmMap.delete(realm.realmId);
        Array.from(this.knownHandlesToRealmMap.entries()).filter(([, r]) => r === realm.realmId).map(([handle]) => this.knownHandlesToRealmMap.delete(handle));
      });
    }
  };
  RealmStorage.RealmStorage = RealmStorage$1;
  return RealmStorage;
}
var EventManager = {};
var Buffer$1 = {};
var hasRequiredBuffer;
function requireBuffer() {
  if (hasRequiredBuffer) return Buffer$1;
  hasRequiredBuffer = 1;
  Object.defineProperty(Buffer$1, "__esModule", { value: true });
  Buffer$1.Buffer = void 0;
  class Buffer2 {
    #capacity;
    #entries = [];
    #onItemRemoved;
    /**
     * @param capacity The buffer capacity.
     * @param onItemRemoved Delegate called for each removed element.
     */
    constructor(capacity, onItemRemoved) {
      this.#capacity = capacity;
      this.#onItemRemoved = onItemRemoved;
    }
    get() {
      return this.#entries;
    }
    add(value) {
      this.#entries.push(value);
      while (this.#entries.length > this.#capacity) {
        const item = this.#entries.shift();
        if (item !== void 0) {
          this.#onItemRemoved?.(item);
        }
      }
    }
  }
  Buffer$1.Buffer = Buffer2;
  return Buffer$1;
}
var IdWrapper = {};
var hasRequiredIdWrapper;
function requireIdWrapper() {
  if (hasRequiredIdWrapper) return IdWrapper;
  hasRequiredIdWrapper = 1;
  Object.defineProperty(IdWrapper, "__esModule", { value: true });
  IdWrapper.IdWrapper = void 0;
  let IdWrapper$1 = class IdWrapper2 {
    static #counter = 0;
    #id;
    constructor() {
      this.#id = ++IdWrapper2.#counter;
    }
    get id() {
      return this.#id;
    }
  };
  IdWrapper.IdWrapper = IdWrapper$1;
  return IdWrapper;
}
var events = {};
var hasRequiredEvents;
function requireEvents() {
  if (hasRequiredEvents) return events;
  hasRequiredEvents = 1;
  Object.defineProperty(events, "__esModule", { value: true });
  events.isCdpEvent = isCdpEvent2;
  events.assertSupportedEvent = assertSupportedEvent;
  const protocol_js_1 = requireProtocol();
  function isCdpEvent2(name) {
    return name.split(".").at(0)?.startsWith(protocol_js_1.ChromiumBidi.BiDiModule.Cdp) ?? false;
  }
  function assertSupportedEvent(name) {
    if (!protocol_js_1.ChromiumBidi.EVENT_NAMES.has(name) && !isCdpEvent2(name)) {
      throw new protocol_js_1.InvalidArgumentException(`Unknown event: ${name}`);
    }
  }
  return events;
}
var SubscriptionManager = {};
var hasRequiredSubscriptionManager;
function requireSubscriptionManager() {
  if (hasRequiredSubscriptionManager) return SubscriptionManager;
  hasRequiredSubscriptionManager = 1;
  Object.defineProperty(SubscriptionManager, "__esModule", { value: true });
  SubscriptionManager.SubscriptionManager = void 0;
  SubscriptionManager.cartesianProduct = cartesianProduct;
  SubscriptionManager.unrollEvents = unrollEvents;
  SubscriptionManager.difference = difference;
  const protocol_js_1 = requireProtocol();
  const uuid_js_1 = requireUuid();
  function cartesianProduct(...a) {
    return a.reduce((a2, b) => a2.flatMap((d) => b.map((e) => [d, e].flat())));
  }
  function unrollEvents(events2) {
    const allEvents = /* @__PURE__ */ new Set();
    function addEvents(events3) {
      for (const event of events3) {
        allEvents.add(event);
      }
    }
    for (const event of events2) {
      switch (event) {
        case protocol_js_1.ChromiumBidi.BiDiModule.Bluetooth:
          addEvents(Object.values(protocol_js_1.ChromiumBidi.Bluetooth.EventNames));
          break;
        case protocol_js_1.ChromiumBidi.BiDiModule.BrowsingContext:
          addEvents(Object.values(protocol_js_1.ChromiumBidi.BrowsingContext.EventNames));
          break;
        case protocol_js_1.ChromiumBidi.BiDiModule.Input:
          addEvents(Object.values(protocol_js_1.ChromiumBidi.Input.EventNames));
          break;
        case protocol_js_1.ChromiumBidi.BiDiModule.Log:
          addEvents(Object.values(protocol_js_1.ChromiumBidi.Log.EventNames));
          break;
        case protocol_js_1.ChromiumBidi.BiDiModule.Network:
          addEvents(Object.values(protocol_js_1.ChromiumBidi.Network.EventNames));
          break;
        case protocol_js_1.ChromiumBidi.BiDiModule.Script:
          addEvents(Object.values(protocol_js_1.ChromiumBidi.Script.EventNames));
          break;
        default:
          allEvents.add(event);
      }
    }
    return allEvents.values();
  }
  let SubscriptionManager$1 = class SubscriptionManager {
    #subscriptions = [];
    #knownSubscriptionIds = /* @__PURE__ */ new Set();
    #browsingContextStorage;
    constructor(browsingContextStorage) {
      this.#browsingContextStorage = browsingContextStorage;
    }
    getGoogChannelsSubscribedToEvent(eventName, contextId) {
      const googChannels = /* @__PURE__ */ new Set();
      for (const subscription of this.#subscriptions) {
        if (this.#isSubscribedTo(subscription, eventName, contextId)) {
          googChannels.add(subscription.googChannel);
        }
      }
      return Array.from(googChannels);
    }
    getGoogChannelsSubscribedToEventGlobally(eventName) {
      const googChannels = /* @__PURE__ */ new Set();
      for (const subscription of this.#subscriptions) {
        if (this.#isSubscribedTo(subscription, eventName)) {
          googChannels.add(subscription.googChannel);
        }
      }
      return Array.from(googChannels);
    }
    #isSubscribedTo(subscription, moduleOrEvent, browsingContextId) {
      let includesEvent = false;
      for (const eventName of subscription.eventNames) {
        if (
          // Event explicitly subscribed
          eventName === moduleOrEvent || // Event subscribed via module
          eventName === moduleOrEvent.split(".").at(0) || // Event explicitly subscribed compared to module
          eventName.split(".").at(0) === moduleOrEvent
        ) {
          includesEvent = true;
          break;
        }
      }
      if (!includesEvent) {
        return false;
      }
      if (subscription.userContextIds.size !== 0) {
        if (!browsingContextId) {
          return false;
        }
        const context = this.#browsingContextStorage.findContext(browsingContextId);
        if (!context) {
          return false;
        }
        return subscription.userContextIds.has(context.userContext);
      }
      if (subscription.topLevelTraversableIds.size !== 0) {
        if (!browsingContextId) {
          return false;
        }
        const topLevelContext = this.#browsingContextStorage.findTopLevelContextId(browsingContextId);
        return topLevelContext !== null && subscription.topLevelTraversableIds.has(topLevelContext);
      }
      return true;
    }
    isSubscribedTo(moduleOrEvent, contextId) {
      for (const subscription of this.#subscriptions) {
        if (this.#isSubscribedTo(subscription, moduleOrEvent, contextId)) {
          return true;
        }
      }
      return false;
    }
    /**
     * Subscribes to event in the given context and goog:channel.
     * @return {SubscriptionItem[]} List of
     * subscriptions. If the event is a whole module, it will return all the specific
     * events. If the contextId is null, it will return all the top-level contexts which were
     * not subscribed before the command.
     */
    subscribe(eventNames, contextIds, userContextIds, googChannel) {
      const subscription = {
        id: (0, uuid_js_1.uuidv4)(),
        eventNames: new Set(unrollEvents(eventNames)),
        topLevelTraversableIds: new Set(contextIds.map((contextId) => {
          const topLevelContext = this.#browsingContextStorage.findTopLevelContextId(contextId);
          if (!topLevelContext) {
            throw new protocol_js_1.NoSuchFrameException(`Top-level navigable not found for context id ${contextId}`);
          }
          return topLevelContext;
        })),
        userContextIds: new Set(userContextIds),
        googChannel
      };
      this.#subscriptions.push(subscription);
      this.#knownSubscriptionIds.add(subscription.id);
      return subscription;
    }
    /**
     * Unsubscribes atomically from all events in the given contexts and channel.
     *
     * This is a legacy spec branch to unsubscribe by attributes.
     */
    unsubscribe(inputEventNames, inputContextIds, googChannel) {
      const eventNames = new Set(unrollEvents(inputEventNames));
      this.#browsingContextStorage.verifyContextsList(inputContextIds);
      const topLevelTraversables = new Set(inputContextIds.map((contextId) => {
        const topLevelContext = this.#browsingContextStorage.findTopLevelContextId(contextId);
        if (!topLevelContext) {
          throw new protocol_js_1.NoSuchFrameException(`Top-level navigable not found for context id ${contextId}`);
        }
        return topLevelContext;
      }));
      const isGlobalUnsubscribe = topLevelTraversables.size === 0;
      const newSubscriptions = [];
      const eventsMatched = /* @__PURE__ */ new Set();
      const contextsMatched = /* @__PURE__ */ new Set();
      for (const subscription of this.#subscriptions) {
        if (subscription.googChannel !== googChannel) {
          newSubscriptions.push(subscription);
          continue;
        }
        if (subscription.userContextIds.size !== 0) {
          newSubscriptions.push(subscription);
          continue;
        }
        if (intersection(subscription.eventNames, eventNames).size === 0) {
          newSubscriptions.push(subscription);
          continue;
        }
        if (isGlobalUnsubscribe) {
          if (subscription.topLevelTraversableIds.size !== 0) {
            newSubscriptions.push(subscription);
            continue;
          }
          const subscriptionEventNames = new Set(subscription.eventNames);
          for (const eventName of eventNames) {
            if (subscriptionEventNames.has(eventName)) {
              eventsMatched.add(eventName);
              subscriptionEventNames.delete(eventName);
            }
          }
          if (subscriptionEventNames.size !== 0) {
            newSubscriptions.push({
              ...subscription,
              eventNames: subscriptionEventNames
            });
          }
        } else {
          if (subscription.topLevelTraversableIds.size === 0) {
            newSubscriptions.push(subscription);
            continue;
          }
          const eventMap = /* @__PURE__ */ new Map();
          for (const eventName of subscription.eventNames) {
            eventMap.set(eventName, new Set(subscription.topLevelTraversableIds));
          }
          for (const eventName of eventNames) {
            const eventContextSet = eventMap.get(eventName);
            if (!eventContextSet) {
              continue;
            }
            for (const toRemoveId of topLevelTraversables) {
              if (eventContextSet.has(toRemoveId)) {
                contextsMatched.add(toRemoveId);
                eventsMatched.add(eventName);
                eventContextSet.delete(toRemoveId);
              }
            }
            if (eventContextSet.size === 0) {
              eventMap.delete(eventName);
            }
          }
          for (const [eventName, remainingContextIds] of eventMap) {
            const partialSubscription = {
              id: subscription.id,
              googChannel: subscription.googChannel,
              eventNames: /* @__PURE__ */ new Set([eventName]),
              topLevelTraversableIds: remainingContextIds,
              userContextIds: /* @__PURE__ */ new Set()
            };
            newSubscriptions.push(partialSubscription);
          }
        }
      }
      if (!equal(eventsMatched, eventNames)) {
        throw new protocol_js_1.InvalidArgumentException("No subscription found");
      }
      if (!isGlobalUnsubscribe && !equal(contextsMatched, topLevelTraversables)) {
        throw new protocol_js_1.InvalidArgumentException("No subscription found");
      }
      this.#subscriptions = newSubscriptions;
    }
    /**
     * Unsubscribes by subscriptionId.
     */
    unsubscribeById(subscriptionIds) {
      const subscriptionIdsSet = new Set(subscriptionIds);
      const unknownIds = difference(subscriptionIdsSet, this.#knownSubscriptionIds);
      if (unknownIds.size !== 0) {
        throw new protocol_js_1.InvalidArgumentException("No subscription found");
      }
      this.#subscriptions = this.#subscriptions.filter((subscription) => {
        return !subscriptionIdsSet.has(subscription.id);
      });
      this.#knownSubscriptionIds = difference(this.#knownSubscriptionIds, subscriptionIdsSet);
    }
  };
  SubscriptionManager.SubscriptionManager = SubscriptionManager$1;
  function intersection(setA, setB) {
    const result = /* @__PURE__ */ new Set();
    for (const a of setA) {
      if (setB.has(a)) {
        result.add(a);
      }
    }
    return result;
  }
  function difference(setA, setB) {
    const result = /* @__PURE__ */ new Set();
    for (const a of setA) {
      if (!setB.has(a)) {
        result.add(a);
      }
    }
    return result;
  }
  function equal(setA, setB) {
    if (setA.size !== setB.size) {
      return false;
    }
    for (const a of setA) {
      if (!setB.has(a)) {
        return false;
      }
    }
    return true;
  }
  return SubscriptionManager;
}
var hasRequiredEventManager;
function requireEventManager() {
  if (hasRequiredEventManager) return EventManager;
  hasRequiredEventManager = 1;
  var _a2;
  Object.defineProperty(EventManager, "__esModule", { value: true });
  EventManager.EventManager = void 0;
  const protocol_js_1 = requireProtocol();
  const Buffer_js_1 = requireBuffer();
  const DefaultMap_js_1 = requireDefaultMap();
  const EventEmitter_js_1 = requireEventEmitter();
  const IdWrapper_js_1 = requireIdWrapper();
  const OutgoingMessage_js_1 = requireOutgoingMessage();
  const events_js_1 = requireEvents();
  const SubscriptionManager_js_1 = requireSubscriptionManager();
  class EventWrapper {
    #idWrapper = new IdWrapper_js_1.IdWrapper();
    #contextId;
    #event;
    constructor(event, contextId) {
      this.#event = event;
      this.#contextId = contextId;
    }
    get id() {
      return this.#idWrapper.id;
    }
    get contextId() {
      return this.#contextId;
    }
    get event() {
      return this.#event;
    }
  }
  const eventBufferLength = /* @__PURE__ */ new Map([[protocol_js_1.ChromiumBidi.Log.EventNames.LogEntryAdded, 100]]);
  let EventManager$1 = class EventManager extends EventEmitter_js_1.EventEmitter {
    /**
     * Maps event name to a set of contexts where this event already happened.
     * Needed for getting buffered events from all the contexts in case of
     * subscripting to all contexts.
     */
    #eventToContextsMap = new DefaultMap_js_1.DefaultMap(() => /* @__PURE__ */ new Set());
    /**
     * Maps `eventName` + `browsingContext` to buffer. Used to get buffered events
     * during subscription. Channel-agnostic.
     */
    #eventBuffers = /* @__PURE__ */ new Map();
    /**
     * Maps `eventName` + `browsingContext` to  Map of goog:channel to last id.
     * Used to avoid sending duplicated events when user
     * subscribes -> unsubscribes -> subscribes.
     */
    #lastMessageSent = /* @__PURE__ */ new Map();
    #subscriptionManager;
    #browsingContextStorage;
    /**
     * Map of event name to hooks to be called when client is subscribed to the event.
     */
    #subscribeHooks;
    #userContextStorage;
    constructor(browsingContextStorage, userContextStorage) {
      super();
      this.#browsingContextStorage = browsingContextStorage;
      this.#userContextStorage = userContextStorage;
      this.#subscriptionManager = new SubscriptionManager_js_1.SubscriptionManager(browsingContextStorage);
      this.#subscribeHooks = new DefaultMap_js_1.DefaultMap(() => []);
    }
    get subscriptionManager() {
      return this.#subscriptionManager;
    }
    /**
     * Returns consistent key to be used to access value maps.
     */
    static #getMapKey(eventName, browsingContext) {
      return JSON.stringify({ eventName, browsingContext });
    }
    addSubscribeHook(event, hook) {
      this.#subscribeHooks.get(event).push(hook);
    }
    registerEvent(event, contextId) {
      this.registerPromiseEvent(Promise.resolve({
        kind: "success",
        value: event
      }), contextId, event.method);
    }
    registerGlobalEvent(event) {
      this.registerGlobalPromiseEvent(Promise.resolve({
        kind: "success",
        value: event
      }), event.method);
    }
    registerPromiseEvent(event, contextId, eventName) {
      const eventWrapper = new EventWrapper(event, contextId);
      const sortedGoogChannels = this.#subscriptionManager.getGoogChannelsSubscribedToEvent(eventName, contextId);
      this.#bufferEvent(eventWrapper, eventName);
      for (const googChannel of sortedGoogChannels) {
        this.emit("event", {
          message: OutgoingMessage_js_1.OutgoingMessage.createFromPromise(event, googChannel),
          event: eventName
        });
        this.#markEventSent(eventWrapper, googChannel, eventName);
      }
    }
    registerGlobalPromiseEvent(event, eventName) {
      const eventWrapper = new EventWrapper(event, null);
      const sortedGoogChannels = this.#subscriptionManager.getGoogChannelsSubscribedToEventGlobally(eventName);
      this.#bufferEvent(eventWrapper, eventName);
      for (const googChannel of sortedGoogChannels) {
        this.emit("event", {
          message: OutgoingMessage_js_1.OutgoingMessage.createFromPromise(event, googChannel),
          event: eventName
        });
        this.#markEventSent(eventWrapper, googChannel, eventName);
      }
    }
    async subscribe(eventNames, contextIds, userContextIds, googChannel) {
      for (const name of eventNames) {
        (0, events_js_1.assertSupportedEvent)(name);
      }
      if (userContextIds.length && contextIds.length) {
        throw new protocol_js_1.InvalidArgumentException("Both userContexts and contexts cannot be specified.");
      }
      this.#browsingContextStorage.verifyContextsList(contextIds);
      await this.#userContextStorage.verifyUserContextIdList(userContextIds);
      const unrolledEventNames = new Set((0, SubscriptionManager_js_1.unrollEvents)(eventNames));
      const subscribeStepEvents = /* @__PURE__ */ new Map();
      const subscriptionNavigableIds = new Set(contextIds.length ? contextIds.map((contextId) => {
        const id = this.#browsingContextStorage.findTopLevelContextId(contextId);
        if (!id) {
          throw new protocol_js_1.InvalidArgumentException("Invalid context id");
        }
        return id;
      }) : this.#browsingContextStorage.getTopLevelContexts().map((c) => c.id));
      for (const eventName of unrolledEventNames) {
        const subscribedNavigableIds = new Set(this.#browsingContextStorage.getTopLevelContexts().map((c) => c.id).filter((id) => {
          return this.#subscriptionManager.isSubscribedTo(eventName, id);
        }));
        subscribeStepEvents.set(eventName, (0, SubscriptionManager_js_1.difference)(subscriptionNavigableIds, subscribedNavigableIds));
      }
      const subscription = this.#subscriptionManager.subscribe(eventNames, contextIds, userContextIds, googChannel);
      for (const eventName of subscription.eventNames) {
        for (const contextId of subscriptionNavigableIds) {
          for (const eventWrapper of this.#getBufferedEvents(eventName, contextId, googChannel)) {
            this.emit("event", {
              message: OutgoingMessage_js_1.OutgoingMessage.createFromPromise(eventWrapper.event, googChannel),
              event: eventName
            });
            this.#markEventSent(eventWrapper, googChannel, eventName);
          }
        }
      }
      for (const [eventName, contextIds2] of subscribeStepEvents) {
        for (const contextId of contextIds2) {
          this.#subscribeHooks.get(eventName).forEach((hook) => hook(contextId));
        }
      }
      await this.toggleModulesIfNeeded();
      return subscription.id;
    }
    async unsubscribe(eventNames, contextIds, googChannel) {
      for (const name of eventNames) {
        (0, events_js_1.assertSupportedEvent)(name);
      }
      this.#subscriptionManager.unsubscribe(eventNames, contextIds, googChannel);
      await this.toggleModulesIfNeeded();
    }
    async unsubscribeByIds(subscriptionIds) {
      this.#subscriptionManager.unsubscribeById(subscriptionIds);
      await this.toggleModulesIfNeeded();
    }
    async toggleModulesIfNeeded() {
      await Promise.all(this.#browsingContextStorage.getAllContexts().map(async (context) => {
        return await context.toggleModulesIfNeeded();
      }));
    }
    clearBufferedEvents(contextId) {
      for (const eventName of eventBufferLength.keys()) {
        const bufferMapKey = _a2.#getMapKey(eventName, contextId);
        this.#eventBuffers.delete(bufferMapKey);
      }
    }
    /**
     * If the event is buffer-able, put it in the buffer.
     */
    #bufferEvent(eventWrapper, eventName) {
      if (!eventBufferLength.has(eventName)) {
        return;
      }
      const bufferMapKey = _a2.#getMapKey(eventName, eventWrapper.contextId);
      if (!this.#eventBuffers.has(bufferMapKey)) {
        this.#eventBuffers.set(bufferMapKey, new Buffer_js_1.Buffer(eventBufferLength.get(eventName)));
      }
      this.#eventBuffers.get(bufferMapKey).add(eventWrapper);
      this.#eventToContextsMap.get(eventName).add(eventWrapper.contextId);
    }
    /**
     * If the event is buffer-able, mark it as sent to the given contextId and goog:channel.
     */
    #markEventSent(eventWrapper, googChannel, eventName) {
      if (!eventBufferLength.has(eventName)) {
        return;
      }
      const lastSentMapKey = _a2.#getMapKey(eventName, eventWrapper.contextId);
      const lastId = Math.max(this.#lastMessageSent.get(lastSentMapKey)?.get(googChannel) ?? 0, eventWrapper.id);
      const googChannelMap = this.#lastMessageSent.get(lastSentMapKey);
      if (googChannelMap) {
        googChannelMap.set(googChannel, lastId);
      } else {
        this.#lastMessageSent.set(lastSentMapKey, /* @__PURE__ */ new Map([[googChannel, lastId]]));
      }
    }
    /**
     * Returns events which are buffered and not yet sent to the given goog:channel events.
     */
    #getBufferedEvents(eventName, contextId, googChannel) {
      const bufferMapKey = _a2.#getMapKey(eventName, contextId);
      const lastSentMessageId = this.#lastMessageSent.get(bufferMapKey)?.get(googChannel) ?? -Infinity;
      const result = this.#eventBuffers.get(bufferMapKey)?.get().filter((wrapper) => wrapper.id > lastSentMessageId) ?? [];
      if (contextId === null) {
        Array.from(this.#eventToContextsMap.get(eventName).keys()).filter((_contextId) => (
          // Events without context are already in the result.
          _contextId !== null && // Events from deleted contexts should not be sent.
          this.#browsingContextStorage.hasContext(_contextId)
        )).map((_contextId) => this.#getBufferedEvents(eventName, _contextId, googChannel)).forEach((events2) => result.push(...events2));
      }
      return result.sort((e1, e2) => e1.id - e2.id);
    }
  };
  EventManager.EventManager = EventManager$1;
  _a2 = EventManager$1;
  return EventManager;
}
var hasRequiredBidiServer;
function requireBidiServer() {
  if (hasRequiredBidiServer) return BidiServer;
  hasRequiredBidiServer = 1;
  Object.defineProperty(BidiServer, "__esModule", { value: true });
  BidiServer.BidiServer = void 0;
  const EventEmitter_js_1 = requireEventEmitter();
  const log_js_1 = requireLog();
  const ProcessingQueue_js_1 = requireProcessingQueue();
  const CommandProcessor_js_1 = requireCommandProcessor();
  const MapperOptions_js_1 = requireMapperOptions();
  const BluetoothProcessor_js_1 = requireBluetoothProcessor();
  const UserContextStorage_js_1 = requireUserContextStorage();
  const CdpTargetManager_js_1 = requireCdpTargetManager();
  const BrowsingContextStorage_js_1 = requireBrowsingContextStorage();
  const NetworkStorage_js_1 = requireNetworkStorage();
  const PreloadScriptStorage_js_1 = requirePreloadScriptStorage();
  const RealmStorage_js_1 = requireRealmStorage();
  const EventManager_js_1 = requireEventManager();
  let BidiServer$1 = class BidiServer2 extends EventEmitter_js_1.EventEmitter {
    #messageQueue;
    #transport;
    #commandProcessor;
    #eventManager;
    #browsingContextStorage = new BrowsingContextStorage_js_1.BrowsingContextStorage();
    #realmStorage = new RealmStorage_js_1.RealmStorage();
    #preloadScriptStorage = new PreloadScriptStorage_js_1.PreloadScriptStorage();
    #bluetoothProcessor;
    #logger;
    #handleIncomingMessage = (message) => {
      void this.#commandProcessor.processCommand(message).catch((error) => {
        this.#logger?.(log_js_1.LogType.debugError, error);
      });
    };
    #processOutgoingMessage = async (messageEntry) => {
      const message = messageEntry.message;
      if (messageEntry.googChannel !== null) {
        message["goog:channel"] = messageEntry.googChannel;
      }
      await this.#transport.sendMessage(message);
    };
    constructor(bidiTransport, cdpConnection, browserCdpClient, selfTargetId, defaultUserContextId, parser, logger) {
      super();
      this.#logger = logger;
      this.#messageQueue = new ProcessingQueue_js_1.ProcessingQueue(this.#processOutgoingMessage, this.#logger);
      this.#transport = bidiTransport;
      this.#transport.setOnMessage(this.#handleIncomingMessage);
      const userContextStorage = new UserContextStorage_js_1.UserContextStorage(browserCdpClient);
      this.#eventManager = new EventManager_js_1.EventManager(this.#browsingContextStorage, userContextStorage);
      const networkStorage = new NetworkStorage_js_1.NetworkStorage(this.#eventManager, this.#browsingContextStorage, browserCdpClient, logger);
      const mapperOptionsStorage = new MapperOptions_js_1.MapperOptionsStorage();
      this.#bluetoothProcessor = new BluetoothProcessor_js_1.BluetoothProcessor(this.#eventManager, this.#browsingContextStorage);
      this.#commandProcessor = new CommandProcessor_js_1.CommandProcessor(cdpConnection, browserCdpClient, this.#eventManager, this.#browsingContextStorage, this.#realmStorage, this.#preloadScriptStorage, networkStorage, mapperOptionsStorage, this.#bluetoothProcessor, userContextStorage, parser, async (options) => {
        mapperOptionsStorage.mapperOptions = options;
        await browserCdpClient.sendCommand("Security.setIgnoreCertificateErrors", {
          ignore: options.acceptInsecureCerts ?? false
        });
        new CdpTargetManager_js_1.CdpTargetManager(cdpConnection, browserCdpClient, selfTargetId, this.#eventManager, this.#browsingContextStorage, userContextStorage, this.#realmStorage, networkStorage, this.#bluetoothProcessor, this.#preloadScriptStorage, defaultUserContextId, options?.["goog:prerenderingDisabled"] ?? false, options?.unhandledPromptBehavior, logger);
        await browserCdpClient.sendCommand("Target.setDiscoverTargets", {
          discover: true
        });
        await browserCdpClient.sendCommand("Target.setAutoAttach", {
          autoAttach: true,
          waitForDebuggerOnStart: true,
          flatten: true,
          // Browser session should attach to tab instead of the page, so that
          // prerendering is not blocked.
          filter: [
            {
              type: "page",
              exclude: true
            },
            {}
          ]
        });
        await this.#topLevelContextsLoaded();
      }, this.#logger);
      this.#eventManager.on("event", ({ message, event }) => {
        this.emitOutgoingMessage(message, event);
      });
      this.#commandProcessor.on("response", ({ message, event }) => {
        this.emitOutgoingMessage(message, event);
      });
    }
    /**
     * Creates and starts BiDi Mapper instance.
     */
    static async createAndStart(bidiTransport, cdpConnection, browserCdpClient, selfTargetId, parser, logger) {
      const [{ browserContextIds }, { targetInfos }] = await Promise.all([
        browserCdpClient.sendCommand("Target.getBrowserContexts"),
        browserCdpClient.sendCommand("Target.getTargets"),
        // Required for `Browser.downloadWillBegin` events.
        browserCdpClient.sendCommand("Browser.setDownloadBehavior", {
          behavior: "default",
          eventsEnabled: true
        })
      ]);
      let defaultUserContextId = "default";
      for (const info of targetInfos) {
        if (info.browserContextId && !browserContextIds.includes(info.browserContextId)) {
          defaultUserContextId = info.browserContextId;
          break;
        }
      }
      const server = new BidiServer2(bidiTransport, cdpConnection, browserCdpClient, selfTargetId, defaultUserContextId, parser, logger);
      return server;
    }
    /**
     * Sends BiDi message.
     */
    emitOutgoingMessage(messageEntry, event) {
      this.#messageQueue.add(messageEntry, event);
    }
    close() {
      this.#transport.close();
    }
    async #topLevelContextsLoaded() {
      await Promise.all(this.#browsingContextStorage.getTopLevelContexts().map((c) => c.lifecycleLoaded()));
    }
  };
  BidiServer.BidiServer = BidiServer$1;
  return BidiServer;
}
var hasRequiredBidiMapper;
function requireBidiMapper() {
  if (hasRequiredBidiMapper) return BidiMapper;
  hasRequiredBidiMapper = 1;
  (function(exports2) {
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.OutgoingMessage = exports2.EventEmitter = exports2.BidiServer = void 0;
    var BidiServer_js_1 = requireBidiServer();
    Object.defineProperty(exports2, "BidiServer", { enumerable: true, get: function() {
      return BidiServer_js_1.BidiServer;
    } });
    var EventEmitter_js_1 = requireEventEmitter();
    Object.defineProperty(exports2, "EventEmitter", { enumerable: true, get: function() {
      return EventEmitter_js_1.EventEmitter;
    } });
    var OutgoingMessage_js_1 = requireOutgoingMessage();
    Object.defineProperty(exports2, "OutgoingMessage", { enumerable: true, get: function() {
      return OutgoingMessage_js_1.OutgoingMessage;
    } });
  })(BidiMapper);
  return BidiMapper;
}
var BidiMapperExports = requireBidiMapper();
class BidiCdpSession extends main.CDPSession {
  static sessions = /* @__PURE__ */ new Map();
  #detached = false;
  #connection;
  #sessionId = main.Deferred.create();
  frame;
  constructor(frame, sessionId) {
    super();
    this.frame = frame;
    if (!this.frame.page().browser().cdpSupported) {
      return;
    }
    const connection = this.frame.page().browser().connection;
    this.#connection = connection;
    if (sessionId) {
      this.#sessionId.resolve(sessionId);
      BidiCdpSession.sessions.set(sessionId, this);
    } else {
      (async () => {
        try {
          const { result } = await connection.send("goog:cdp.getSession", {
            context: frame._id
          });
          this.#sessionId.resolve(result.session);
          BidiCdpSession.sessions.set(result.session, this);
        } catch (error) {
          this.#sessionId.reject(error);
        }
      })();
    }
    BidiCdpSession.sessions.set(this.#sessionId.value(), this);
  }
  connection() {
    return void 0;
  }
  get detached() {
    return this.#detached;
  }
  async send(method, params, options) {
    if (this.#connection === void 0) {
      throw new main.UnsupportedOperation("CDP support is required for this feature. The current browser does not support CDP.");
    }
    if (this.#detached) {
      throw new main.TargetCloseError(`Protocol error (${method}): Session closed. Most likely the page has been closed.`);
    }
    const session = await this.#sessionId.valueOrThrow();
    const { result } = await this.#connection.send("goog:cdp.sendCommand", {
      method,
      params,
      session
    }, options?.timeout);
    return result.result;
  }
  async detach() {
    if (this.#connection === void 0 || this.#connection.closed || this.#detached) {
      return;
    }
    try {
      await this.frame.client.send("Target.detachFromTarget", {
        sessionId: this.id()
      });
    } finally {
      this.onClose();
    }
  }
  /**
   * @internal
   */
  onClose = () => {
    BidiCdpSession.sessions.delete(this.id());
    this.#detached = true;
  };
  id() {
    const value = this.#sessionId.value();
    return typeof value === "string" ? value : "";
  }
}
/**
 * @license
 * Copyright 2017 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
const debugProtocolSend = main.debug("puppeteer:webDriverBiDi:SEND ►");
const debugProtocolReceive = main.debug("puppeteer:webDriverBiDi:RECV ◀");
class BidiConnection extends main.EventEmitter {
  #url;
  #transport;
  #delay;
  #timeout = 0;
  #closed = false;
  #callbacks = new main.CallbackRegistry();
  #emitters = [];
  constructor(url, transport, delay = 0, timeout) {
    super();
    this.#url = url;
    this.#delay = delay;
    this.#timeout = timeout ?? 18e4;
    this.#transport = transport;
    this.#transport.onmessage = this.onMessage.bind(this);
    this.#transport.onclose = this.unbind.bind(this);
  }
  get closed() {
    return this.#closed;
  }
  get url() {
    return this.#url;
  }
  pipeTo(emitter) {
    this.#emitters.push(emitter);
  }
  emit(type, event) {
    for (const emitter of this.#emitters) {
      emitter.emit(type, event);
    }
    return super.emit(type, event);
  }
  send(method, params, timeout) {
    main.assert(!this.#closed, "Protocol error: Connection closed.");
    return this.#callbacks.create(method, timeout ?? this.#timeout, (id) => {
      const stringifiedMessage = JSON.stringify({
        id,
        method,
        params
      });
      debugProtocolSend(stringifiedMessage);
      this.#transport.send(stringifiedMessage);
    });
  }
  /**
   * @internal
   */
  async onMessage(message) {
    if (this.#delay) {
      await new Promise((f) => {
        return setTimeout(f, this.#delay);
      });
    }
    debugProtocolReceive(message);
    const object = JSON.parse(message);
    if ("type" in object) {
      switch (object.type) {
        case "success":
          this.#callbacks.resolve(object.id, object);
          return;
        case "error":
          if (object.id === null) {
            break;
          }
          this.#callbacks.reject(object.id, createProtocolError(object), `${object.error}: ${object.message}`);
          return;
        case "event":
          if (isCdpEvent(object)) {
            BidiCdpSession.sessions.get(object.params.session)?.emit(object.params.event, object.params.params);
            return;
          }
          this.emit(object.method, object.params);
          return;
      }
    }
    if ("id" in object) {
      this.#callbacks.reject(object.id, `Protocol Error. Message is not in BiDi protocol format: '${message}'`, object.message);
    }
    main.debugError(object);
  }
  /**
   * Unbinds the connection, but keeps the transport open. Useful when the transport will
   * be reused by other connection e.g. with different protocol.
   * @internal
   */
  unbind() {
    if (this.#closed) {
      return;
    }
    this.#closed = true;
    this.#transport.onmessage = () => {
    };
    this.#transport.onclose = () => {
    };
    this.#callbacks.clear();
  }
  /**
   * Unbinds the connection and closes the transport.
   */
  dispose() {
    this.unbind();
    this.#transport.close();
  }
  getPendingProtocolErrors() {
    return this.#callbacks.getPendingProtocolErrors();
  }
}
function createProtocolError(object) {
  let message = `${object.error} ${object.message}`;
  if (object.stacktrace) {
    message += ` ${object.stacktrace}`;
  }
  return message;
}
function isCdpEvent(event) {
  return event.method.startsWith("goog:cdp.");
}
/**
 * @license
 * Copyright 2023 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
const bidiServerLogger = (prefix, ...args) => {
  main.debug(`bidi:${prefix}`)(args);
};
async function connectBidiOverCdp(cdp2) {
  const transportBiDi = new NoOpTransport();
  const cdpConnectionAdapter = new CdpConnectionAdapter(cdp2);
  const pptrTransport = {
    send(message) {
      transportBiDi.emitMessage(JSON.parse(message));
    },
    close() {
      bidiServer.close();
      cdpConnectionAdapter.close();
      cdp2.dispose();
    },
    onmessage(_message) {
    }
  };
  transportBiDi.on("bidiResponse", (message) => {
    pptrTransport.onmessage(JSON.stringify(message));
  });
  const pptrBiDiConnection = new BidiConnection(cdp2.url(), pptrTransport, cdp2.delay, cdp2.timeout);
  const bidiServer = await BidiMapperExports.BidiServer.createAndStart(
    transportBiDi,
    cdpConnectionAdapter,
    cdpConnectionAdapter.browserClient(),
    /* selfTargetId= */
    "",
    void 0,
    bidiServerLogger
  );
  return pptrBiDiConnection;
}
class CdpConnectionAdapter {
  #cdp;
  #adapters = /* @__PURE__ */ new Map();
  #browserCdpConnection;
  constructor(cdp2) {
    this.#cdp = cdp2;
    this.#browserCdpConnection = new CDPClientAdapter(cdp2);
  }
  browserClient() {
    return this.#browserCdpConnection;
  }
  getCdpClient(id) {
    const session = this.#cdp.session(id);
    if (!session) {
      throw new Error(`Unknown CDP session with id ${id}`);
    }
    if (!this.#adapters.has(session)) {
      const adapter = new CDPClientAdapter(session, id, this.#browserCdpConnection);
      this.#adapters.set(session, adapter);
      return adapter;
    }
    return this.#adapters.get(session);
  }
  close() {
    this.#browserCdpConnection.close();
    for (const adapter of this.#adapters.values()) {
      adapter.close();
    }
  }
}
class CDPClientAdapter extends BidiMapperExports.EventEmitter {
  #closed = false;
  #client;
  sessionId = void 0;
  #browserClient;
  constructor(client, sessionId, browserClient) {
    super();
    this.#client = client;
    this.sessionId = sessionId;
    this.#browserClient = browserClient;
    this.#client.on("*", this.#forwardMessage);
  }
  browserClient() {
    return this.#browserClient;
  }
  #forwardMessage = (method, event) => {
    this.emit(method, event);
  };
  async sendCommand(method, ...params) {
    if (this.#closed) {
      return;
    }
    try {
      return await this.#client.send(method, ...params);
    } catch (err) {
      if (this.#closed) {
        return;
      }
      throw err;
    }
  }
  close() {
    this.#client.off("*", this.#forwardMessage);
    this.#closed = true;
  }
  isCloseError(error) {
    return error instanceof main.TargetCloseError;
  }
}
class NoOpTransport extends BidiMapperExports.EventEmitter {
  #onMessage = async (_m) => {
    return;
  };
  emitMessage(message) {
    void this.#onMessage(message);
  }
  setOnMessage(onMessage) {
    this.#onMessage = onMessage;
  }
  async sendMessage(message) {
    this.emit("bidiResponse", message);
  }
  close() {
    this.#onMessage = async (_m) => {
      return;
    };
  }
}
/**
 * @license
 * Copyright 2024 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
var __runInitializers$d = function(thisArg, initializers, value) {
  var useValue = arguments.length > 2;
  for (var i = 0; i < initializers.length; i++) {
    value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
  }
  return useValue ? value : void 0;
};
var __esDecorate$d = function(ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
  function accept(f) {
    if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected");
    return f;
  }
  var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
  var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
  var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
  var _, done = false;
  for (var i = decorators.length - 1; i >= 0; i--) {
    var context = {};
    for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
    for (var p in contextIn.access) context.access[p] = contextIn.access[p];
    context.addInitializer = function(f) {
      if (done) throw new TypeError("Cannot add initializers after decoration has completed");
      extraInitializers.push(accept(f || null));
    };
    var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
    if (kind === "accessor") {
      if (result === void 0) continue;
      if (result === null || typeof result !== "object") throw new TypeError("Object expected");
      if (_ = accept(result.get)) descriptor.get = _;
      if (_ = accept(result.set)) descriptor.set = _;
      if (_ = accept(result.init)) initializers.unshift(_);
    } else if (_ = accept(result)) {
      if (kind === "field") initializers.unshift(_);
      else descriptor[key] = _;
    }
  }
  if (target) Object.defineProperty(target, contextIn.name, descriptor);
  done = true;
};
let Navigation = (() => {
  var _request, _navigation, _browsingContext, _disposables, _id, _Navigation_instances, initialize_fn, matches_fn, session_get, _a2;
  let _classSuper = main.EventEmitter;
  let _instanceExtraInitializers = [];
  let _dispose_decorators;
  return _a2 = class extends _classSuper {
    constructor(context) {
      super();
      __privateAdd(this, _Navigation_instances);
      __privateAdd(this, _request, __runInitializers$d(this, _instanceExtraInitializers));
      __privateAdd(this, _navigation);
      __privateAdd(this, _browsingContext);
      __privateAdd(this, _disposables, new main.DisposableStack());
      __privateAdd(this, _id);
      __privateSet(this, _browsingContext, context);
    }
    static from(context) {
      var _a3;
      const navigation = new _a2(context);
      __privateMethod(_a3 = navigation, _Navigation_instances, initialize_fn).call(_a3);
      return navigation;
    }
    get disposed() {
      return __privateGet(this, _disposables).disposed;
    }
    get request() {
      return __privateGet(this, _request);
    }
    get navigation() {
      return __privateGet(this, _navigation);
    }
    dispose() {
      this[main.disposeSymbol]();
    }
    [(_dispose_decorators = [main.inertIfDisposed], main.disposeSymbol)]() {
      __privateGet(this, _disposables).dispose();
      super[main.disposeSymbol]();
    }
  }, _request = new WeakMap(), _navigation = new WeakMap(), _browsingContext = new WeakMap(), _disposables = new WeakMap(), _id = new WeakMap(), _Navigation_instances = new WeakSet(), initialize_fn = function() {
    const browsingContextEmitter = __privateGet(this, _disposables).use(new main.EventEmitter(__privateGet(this, _browsingContext)));
    browsingContextEmitter.once("closed", () => {
      this.emit("failed", {
        url: __privateGet(this, _browsingContext).url,
        timestamp: /* @__PURE__ */ new Date()
      });
      this.dispose();
    });
    browsingContextEmitter.on("request", ({ request }) => {
      if (request.navigation === void 0 || // If a request with a navigation ID comes in, then the navigation ID is
      // for this navigation.
      !__privateMethod(this, _Navigation_instances, matches_fn).call(this, request.navigation)) {
        return;
      }
      __privateSet(this, _request, request);
      this.emit("request", request);
      const requestEmitter = __privateGet(this, _disposables).use(new main.EventEmitter(__privateGet(this, _request)));
      requestEmitter.on("redirect", (request2) => {
        __privateSet(this, _request, request2);
      });
    });
    const sessionEmitter = __privateGet(this, _disposables).use(new main.EventEmitter(__privateGet(this, _Navigation_instances, session_get)));
    sessionEmitter.on("browsingContext.navigationStarted", (info) => {
      if (info.context !== __privateGet(this, _browsingContext).id || __privateGet(this, _navigation) !== void 0) {
        return;
      }
      __privateSet(this, _navigation, _a2.from(__privateGet(this, _browsingContext)));
    });
    for (const eventName of [
      "browsingContext.domContentLoaded",
      "browsingContext.load"
    ]) {
      sessionEmitter.on(eventName, (info) => {
        if (info.context !== __privateGet(this, _browsingContext).id || info.navigation === null || !__privateMethod(this, _Navigation_instances, matches_fn).call(this, info.navigation)) {
          return;
        }
        this.dispose();
      });
    }
    for (const [eventName, event] of [
      ["browsingContext.fragmentNavigated", "fragment"],
      ["browsingContext.navigationFailed", "failed"],
      ["browsingContext.navigationAborted", "aborted"]
    ]) {
      sessionEmitter.on(eventName, (info) => {
        if (info.context !== __privateGet(this, _browsingContext).id || // Note we don't check if `navigation` is null since `null` means the
        // fragment navigated.
        !__privateMethod(this, _Navigation_instances, matches_fn).call(this, info.navigation)) {
          return;
        }
        this.emit(event, {
          url: info.url,
          timestamp: new Date(info.timestamp)
        });
        this.dispose();
      });
    }
  }, matches_fn = function(navigation) {
    if (__privateGet(this, _navigation) !== void 0 && !__privateGet(this, _navigation).disposed) {
      return false;
    }
    if (__privateGet(this, _id) === void 0) {
      __privateSet(this, _id, navigation);
      return true;
    }
    return __privateGet(this, _id) === navigation;
  }, session_get = function() {
    return __privateGet(this, _browsingContext).userContext.browser.session;
  }, (() => {
    const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
    __esDecorate$d(_a2, null, _dispose_decorators, { kind: "method", name: "dispose", static: false, private: false, access: { has: (obj) => "dispose" in obj, get: (obj) => obj.dispose }, metadata: _metadata }, null, _instanceExtraInitializers);
    if (_metadata) Object.defineProperty(_a2, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
  })(), _a2;
})();
/**
 * @license
 * Copyright 2024 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
var __runInitializers$c = function(thisArg, initializers, value) {
  var useValue = arguments.length > 2;
  for (var i = 0; i < initializers.length; i++) {
    value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
  }
  return useValue ? value : void 0;
};
var __esDecorate$c = function(ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
  function accept(f) {
    if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected");
    return f;
  }
  var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
  var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
  var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
  var _, done = false;
  for (var i = decorators.length - 1; i >= 0; i--) {
    var context = {};
    for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
    for (var p in contextIn.access) context.access[p] = contextIn.access[p];
    context.addInitializer = function(f) {
      if (done) throw new TypeError("Cannot add initializers after decoration has completed");
      extraInitializers.push(accept(f || null));
    };
    var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
    if (kind === "accessor") {
      if (result === void 0) continue;
      if (result === null || typeof result !== "object") throw new TypeError("Object expected");
      if (_ = accept(result.get)) descriptor.get = _;
      if (_ = accept(result.set)) descriptor.set = _;
      if (_ = accept(result.init)) initializers.unshift(_);
    } else if (_ = accept(result)) {
      if (kind === "field") initializers.unshift(_);
      else descriptor[key] = _;
    }
  }
  if (target) Object.defineProperty(target, contextIn.name, descriptor);
  done = true;
};
var _a$1;
let Realm = (() => {
  var _reason, _a2;
  let _classSuper = main.EventEmitter;
  let _instanceExtraInitializers = [];
  let _dispose_decorators;
  let _disown_decorators;
  let _callFunction_decorators;
  let _evaluate_decorators;
  let _resolveExecutionContextId_decorators;
  return _a2 = class extends _classSuper {
    constructor(id, origin) {
      super();
      __privateAdd(this, _reason, __runInitializers$c(this, _instanceExtraInitializers));
      __publicField(this, "disposables", new main.DisposableStack());
      __publicField(this, "id");
      __publicField(this, "origin");
      __publicField(this, "executionContextId");
      this.id = id;
      this.origin = origin;
    }
    get disposed() {
      return __privateGet(this, _reason) !== void 0;
    }
    get target() {
      return { realm: this.id };
    }
    dispose(reason) {
      __privateSet(this, _reason, reason);
      this[main.disposeSymbol]();
    }
    async disown(handles) {
      await this.session.send("script.disown", {
        target: this.target,
        handles
      });
    }
    async callFunction(functionDeclaration, awaitPromise, options = {}) {
      const { result } = await this.session.send("script.callFunction", {
        functionDeclaration,
        awaitPromise,
        target: this.target,
        ...options
      });
      return result;
    }
    async evaluate(expression, awaitPromise, options = {}) {
      const { result } = await this.session.send("script.evaluate", {
        expression,
        awaitPromise,
        target: this.target,
        ...options
      });
      return result;
    }
    async resolveExecutionContextId() {
      if (!this.executionContextId) {
        const { result } = await this.session.connection.send("goog:cdp.resolveRealm", { realm: this.id });
        this.executionContextId = result.executionContextId;
      }
      return this.executionContextId;
    }
    [(_dispose_decorators = [main.inertIfDisposed], _disown_decorators = [main.throwIfDisposed((realm) => {
      return __privateGet(realm, _reason);
    })], _callFunction_decorators = [main.throwIfDisposed((realm) => {
      return __privateGet(realm, _reason);
    })], _evaluate_decorators = [main.throwIfDisposed((realm) => {
      return __privateGet(realm, _reason);
    })], _resolveExecutionContextId_decorators = [main.throwIfDisposed((realm) => {
      return __privateGet(realm, _reason);
    })], main.disposeSymbol)]() {
      __privateGet(this, _reason) ?? __privateSet(this, _reason, "Realm already destroyed, probably because all associated browsing contexts closed.");
      this.emit("destroyed", { reason: __privateGet(this, _reason) });
      this.disposables.dispose();
      super[main.disposeSymbol]();
    }
  }, _reason = new WeakMap(), (() => {
    const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
    __esDecorate$c(_a2, null, _dispose_decorators, { kind: "method", name: "dispose", static: false, private: false, access: { has: (obj) => "dispose" in obj, get: (obj) => obj.dispose }, metadata: _metadata }, null, _instanceExtraInitializers);
    __esDecorate$c(_a2, null, _disown_decorators, { kind: "method", name: "disown", static: false, private: false, access: { has: (obj) => "disown" in obj, get: (obj) => obj.disown }, metadata: _metadata }, null, _instanceExtraInitializers);
    __esDecorate$c(_a2, null, _callFunction_decorators, { kind: "method", name: "callFunction", static: false, private: false, access: { has: (obj) => "callFunction" in obj, get: (obj) => obj.callFunction }, metadata: _metadata }, null, _instanceExtraInitializers);
    __esDecorate$c(_a2, null, _evaluate_decorators, { kind: "method", name: "evaluate", static: false, private: false, access: { has: (obj) => "evaluate" in obj, get: (obj) => obj.evaluate }, metadata: _metadata }, null, _instanceExtraInitializers);
    __esDecorate$c(_a2, null, _resolveExecutionContextId_decorators, { kind: "method", name: "resolveExecutionContextId", static: false, private: false, access: { has: (obj) => "resolveExecutionContextId" in obj, get: (obj) => obj.resolveExecutionContextId }, metadata: _metadata }, null, _instanceExtraInitializers);
    if (_metadata) Object.defineProperty(_a2, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
  })(), _a2;
})();
class WindowRealm extends Realm {
  static from(context, sandbox) {
    const realm = new WindowRealm(context, sandbox);
    realm.#initialize();
    return realm;
  }
  browsingContext;
  sandbox;
  #workers = /* @__PURE__ */ new Map();
  constructor(context, sandbox) {
    super("", "");
    this.browsingContext = context;
    this.sandbox = sandbox;
  }
  #initialize() {
    const browsingContextEmitter = this.disposables.use(new main.EventEmitter(this.browsingContext));
    browsingContextEmitter.on("closed", ({ reason }) => {
      this.dispose(reason);
    });
    const sessionEmitter = this.disposables.use(new main.EventEmitter(this.session));
    sessionEmitter.on("script.realmCreated", (info) => {
      if (info.type !== "window" || info.context !== this.browsingContext.id || info.sandbox !== this.sandbox) {
        return;
      }
      this.id = info.realm;
      this.origin = info.origin;
      this.executionContextId = void 0;
      this.emit("updated", this);
    });
    sessionEmitter.on("script.realmCreated", (info) => {
      if (info.type !== "dedicated-worker") {
        return;
      }
      if (!info.owners.includes(this.id)) {
        return;
      }
      const realm = DedicatedWorkerRealm.from(this, info.realm, info.origin);
      this.#workers.set(realm.id, realm);
      const realmEmitter = this.disposables.use(new main.EventEmitter(realm));
      realmEmitter.once("destroyed", () => {
        realmEmitter.removeAllListeners();
        this.#workers.delete(realm.id);
      });
      this.emit("worker", realm);
    });
  }
  get session() {
    return this.browsingContext.userContext.browser.session;
  }
  get target() {
    return { context: this.browsingContext.id, sandbox: this.sandbox };
  }
}
class DedicatedWorkerRealm extends Realm {
  static from(owner, id, origin) {
    const realm = new _a$1(owner, id, origin);
    realm.#initialize();
    return realm;
  }
  #workers = /* @__PURE__ */ new Map();
  owners;
  constructor(owner, id, origin) {
    super(id, origin);
    this.owners = /* @__PURE__ */ new Set([owner]);
  }
  #initialize() {
    const sessionEmitter = this.disposables.use(new main.EventEmitter(this.session));
    sessionEmitter.on("script.realmDestroyed", (info) => {
      if (info.realm !== this.id) {
        return;
      }
      this.dispose("Realm already destroyed.");
    });
    sessionEmitter.on("script.realmCreated", (info) => {
      if (info.type !== "dedicated-worker") {
        return;
      }
      if (!info.owners.includes(this.id)) {
        return;
      }
      const realm = _a$1.from(this, info.realm, info.origin);
      this.#workers.set(realm.id, realm);
      const realmEmitter = this.disposables.use(new main.EventEmitter(realm));
      realmEmitter.once("destroyed", () => {
        this.#workers.delete(realm.id);
      });
      this.emit("worker", realm);
    });
  }
  get session() {
    return this.owners.values().next().value.session;
  }
}
_a$1 = DedicatedWorkerRealm;
class SharedWorkerRealm extends Realm {
  static from(browser, id, origin) {
    const realm = new SharedWorkerRealm(browser, id, origin);
    realm.#initialize();
    return realm;
  }
  #workers = /* @__PURE__ */ new Map();
  browser;
  constructor(browser, id, origin) {
    super(id, origin);
    this.browser = browser;
  }
  #initialize() {
    const sessionEmitter = this.disposables.use(new main.EventEmitter(this.session));
    sessionEmitter.on("script.realmDestroyed", (info) => {
      if (info.realm !== this.id) {
        return;
      }
      this.dispose("Realm already destroyed.");
    });
    sessionEmitter.on("script.realmCreated", (info) => {
      if (info.type !== "dedicated-worker") {
        return;
      }
      if (!info.owners.includes(this.id)) {
        return;
      }
      const realm = DedicatedWorkerRealm.from(this, info.realm, info.origin);
      this.#workers.set(realm.id, realm);
      const realmEmitter = this.disposables.use(new main.EventEmitter(realm));
      realmEmitter.once("destroyed", () => {
        this.#workers.delete(realm.id);
      });
      this.emit("worker", realm);
    });
  }
  get session() {
    return this.browser.session;
  }
}
/**
 * @license
 * Copyright 2024 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
var __runInitializers$b = function(thisArg, initializers, value) {
  var useValue = arguments.length > 2;
  for (var i = 0; i < initializers.length; i++) {
    value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
  }
  return useValue ? value : void 0;
};
var __esDecorate$b = function(ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
  function accept(f) {
    if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected");
    return f;
  }
  var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
  var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
  var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
  var _, done = false;
  for (var i = decorators.length - 1; i >= 0; i--) {
    var context = {};
    for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
    for (var p in contextIn.access) context.access[p] = contextIn.access[p];
    context.addInitializer = function(f) {
      if (done) throw new TypeError("Cannot add initializers after decoration has completed");
      extraInitializers.push(accept(f || null));
    };
    var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
    if (kind === "accessor") {
      if (result === void 0) continue;
      if (result === null || typeof result !== "object") throw new TypeError("Object expected");
      if (_ = accept(result.get)) descriptor.get = _;
      if (_ = accept(result.set)) descriptor.set = _;
      if (_ = accept(result.init)) initializers.unshift(_);
    } else if (_ = accept(result)) {
      if (kind === "field") initializers.unshift(_);
      else descriptor[key] = _;
    }
  }
  if (target) Object.defineProperty(target, contextIn.name, descriptor);
  done = true;
};
let Request = (() => {
  var _responseContentPromise, _error, _redirect, _response, _browsingContext, _disposables, _event, _Request_instances, initialize_fn, session_get, _a2;
  let _classSuper = main.EventEmitter;
  let _instanceExtraInitializers = [];
  let _dispose_decorators;
  return _a2 = class extends _classSuper {
    constructor(browsingContext, event) {
      super();
      __privateAdd(this, _Request_instances);
      __privateAdd(this, _responseContentPromise, (__runInitializers$b(this, _instanceExtraInitializers), null));
      __privateAdd(this, _error);
      __privateAdd(this, _redirect);
      __privateAdd(this, _response);
      __privateAdd(this, _browsingContext);
      __privateAdd(this, _disposables, new main.DisposableStack());
      __privateAdd(this, _event);
      __privateSet(this, _browsingContext, browsingContext);
      __privateSet(this, _event, event);
    }
    static from(browsingContext, event) {
      var _a3;
      const request = new _a2(browsingContext, event);
      __privateMethod(_a3 = request, _Request_instances, initialize_fn).call(_a3);
      return request;
    }
    get disposed() {
      return __privateGet(this, _disposables).disposed;
    }
    get error() {
      return __privateGet(this, _error);
    }
    get headers() {
      return __privateGet(this, _event).request.headers;
    }
    get id() {
      return __privateGet(this, _event).request.request;
    }
    get initiator() {
      return __privateGet(this, _event).initiator;
    }
    get method() {
      return __privateGet(this, _event).request.method;
    }
    get navigation() {
      return __privateGet(this, _event).navigation ?? void 0;
    }
    get redirect() {
      return __privateGet(this, _redirect);
    }
    get lastRedirect() {
      let redirect = __privateGet(this, _redirect);
      while (redirect) {
        if (redirect && !__privateGet(redirect, _redirect)) {
          return redirect;
        }
        redirect = __privateGet(redirect, _redirect);
      }
      return redirect;
    }
    get response() {
      return __privateGet(this, _response);
    }
    get url() {
      return __privateGet(this, _event).request.url;
    }
    get isBlocked() {
      return __privateGet(this, _event).isBlocked;
    }
    get resourceType() {
      return __privateGet(this, _event).request["goog:resourceType"] ?? void 0;
    }
    get postData() {
      return __privateGet(this, _event).request["goog:postData"] ?? void 0;
    }
    get hasPostData() {
      return __privateGet(this, _event).request["goog:hasPostData"] ?? false;
    }
    async continueRequest({ url, method, headers, cookies, body }) {
      await __privateGet(this, _Request_instances, session_get).send("network.continueRequest", {
        request: this.id,
        url,
        method,
        headers,
        body,
        cookies
      });
    }
    async failRequest() {
      await __privateGet(this, _Request_instances, session_get).send("network.failRequest", {
        request: this.id
      });
    }
    async provideResponse({ statusCode, reasonPhrase, headers, body }) {
      await __privateGet(this, _Request_instances, session_get).send("network.provideResponse", {
        request: this.id,
        statusCode,
        reasonPhrase,
        headers,
        body
      });
    }
    async getResponseContent() {
      if (!__privateGet(this, _responseContentPromise)) {
        __privateSet(this, _responseContentPromise, (async () => {
          try {
            const data = await __privateGet(this, _Request_instances, session_get).send("network.getData", {
              dataType: "response",
              request: this.id
            });
            return main.stringToTypedArray(data.result.bytes.value, data.result.bytes.type === "base64");
          } catch (error) {
            if (error instanceof main.ProtocolError && error.originalMessage.includes("No resource with given identifier found")) {
              throw new main.ProtocolError("Could not load body for this request. This might happen if the request is a preflight request.");
            }
            throw error;
          }
        })());
      }
      return await __privateGet(this, _responseContentPromise);
    }
    async continueWithAuth(parameters) {
      if (parameters.action === "provideCredentials") {
        await __privateGet(this, _Request_instances, session_get).send("network.continueWithAuth", {
          request: this.id,
          action: parameters.action,
          credentials: parameters.credentials
        });
      } else {
        await __privateGet(this, _Request_instances, session_get).send("network.continueWithAuth", {
          request: this.id,
          action: parameters.action
        });
      }
    }
    dispose() {
      this[main.disposeSymbol]();
    }
    [(_dispose_decorators = [main.inertIfDisposed], main.disposeSymbol)]() {
      __privateGet(this, _disposables).dispose();
      super[main.disposeSymbol]();
    }
    timing() {
      return __privateGet(this, _event).request.timings;
    }
  }, _responseContentPromise = new WeakMap(), _error = new WeakMap(), _redirect = new WeakMap(), _response = new WeakMap(), _browsingContext = new WeakMap(), _disposables = new WeakMap(), _event = new WeakMap(), _Request_instances = new WeakSet(), initialize_fn = function() {
    const browsingContextEmitter = __privateGet(this, _disposables).use(new main.EventEmitter(__privateGet(this, _browsingContext)));
    browsingContextEmitter.once("closed", ({ reason }) => {
      __privateSet(this, _error, reason);
      this.emit("error", __privateGet(this, _error));
      this.dispose();
    });
    const sessionEmitter = __privateGet(this, _disposables).use(new main.EventEmitter(__privateGet(this, _Request_instances, session_get)));
    sessionEmitter.on("network.beforeRequestSent", (event) => {
      if (event.context !== __privateGet(this, _browsingContext).id || event.request.request !== this.id || event.redirectCount !== __privateGet(this, _event).redirectCount + 1) {
        return;
      }
      __privateSet(this, _redirect, _a2.from(__privateGet(this, _browsingContext), event));
      this.emit("redirect", __privateGet(this, _redirect));
      this.dispose();
    });
    sessionEmitter.on("network.authRequired", (event) => {
      if (event.context !== __privateGet(this, _browsingContext).id || event.request.request !== this.id || // Don't try to authenticate for events that are not blocked
      !event.isBlocked) {
        return;
      }
      this.emit("authenticate", void 0);
    });
    sessionEmitter.on("network.fetchError", (event) => {
      if (event.context !== __privateGet(this, _browsingContext).id || event.request.request !== this.id || __privateGet(this, _event).redirectCount !== event.redirectCount) {
        return;
      }
      __privateSet(this, _error, event.errorText);
      this.emit("error", __privateGet(this, _error));
      this.dispose();
    });
    sessionEmitter.on("network.responseCompleted", (event) => {
      if (event.context !== __privateGet(this, _browsingContext).id || event.request.request !== this.id || __privateGet(this, _event).redirectCount !== event.redirectCount) {
        return;
      }
      __privateSet(this, _response, event.response);
      __privateGet(this, _event).request.timings = event.request.timings;
      this.emit("success", __privateGet(this, _response));
      if (__privateGet(this, _response).status >= 300 && __privateGet(this, _response).status < 400) {
        return;
      }
      this.dispose();
    });
  }, session_get = function() {
    return __privateGet(this, _browsingContext).userContext.browser.session;
  }, (() => {
    const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
    __esDecorate$b(_a2, null, _dispose_decorators, { kind: "method", name: "dispose", static: false, private: false, access: { has: (obj) => "dispose" in obj, get: (obj) => obj.dispose }, metadata: _metadata }, null, _instanceExtraInitializers);
    if (_metadata) Object.defineProperty(_a2, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
  })(), _a2;
})();
/**
 * @license
 * Copyright 2024 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
var __runInitializers$a = function(thisArg, initializers, value) {
  var useValue = arguments.length > 2;
  for (var i = 0; i < initializers.length; i++) {
    value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
  }
  return useValue ? value : void 0;
};
var __esDecorate$a = function(ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
  function accept(f) {
    if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected");
    return f;
  }
  var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
  var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
  var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
  var _, done = false;
  for (var i = decorators.length - 1; i >= 0; i--) {
    var context = {};
    for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
    for (var p in contextIn.access) context.access[p] = contextIn.access[p];
    context.addInitializer = function(f) {
      if (done) throw new TypeError("Cannot add initializers after decoration has completed");
      extraInitializers.push(accept(f || null));
    };
    var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
    if (kind === "accessor") {
      if (result === void 0) continue;
      if (result === null || typeof result !== "object") throw new TypeError("Object expected");
      if (_ = accept(result.get)) descriptor.get = _;
      if (_ = accept(result.set)) descriptor.set = _;
      if (_ = accept(result.init)) initializers.unshift(_);
    } else if (_ = accept(result)) {
      if (kind === "field") initializers.unshift(_);
      else descriptor[key] = _;
    }
  }
  if (target) Object.defineProperty(target, contextIn.name, descriptor);
  done = true;
};
let UserPrompt = (() => {
  var _reason, _result, _disposables, _UserPrompt_instances, initialize_fn, session_get, _a2;
  let _classSuper = main.EventEmitter;
  let _instanceExtraInitializers = [];
  let _dispose_decorators;
  let _handle_decorators;
  return _a2 = class extends _classSuper {
    constructor(context, info) {
      super();
      __privateAdd(this, _UserPrompt_instances);
      __privateAdd(this, _reason, __runInitializers$a(this, _instanceExtraInitializers));
      __privateAdd(this, _result);
      __privateAdd(this, _disposables, new main.DisposableStack());
      __publicField(this, "browsingContext");
      __publicField(this, "info");
      this.browsingContext = context;
      this.info = info;
    }
    static from(browsingContext, info) {
      var _a3;
      const userPrompt = new _a2(browsingContext, info);
      __privateMethod(_a3 = userPrompt, _UserPrompt_instances, initialize_fn).call(_a3);
      return userPrompt;
    }
    get closed() {
      return __privateGet(this, _reason) !== void 0;
    }
    get disposed() {
      return this.closed;
    }
    get handled() {
      if (this.info.handler === "accept" || this.info.handler === "dismiss") {
        return true;
      }
      return __privateGet(this, _result) !== void 0;
    }
    get result() {
      return __privateGet(this, _result);
    }
    dispose(reason) {
      __privateSet(this, _reason, reason);
      this[main.disposeSymbol]();
    }
    async handle(options = {}) {
      await __privateGet(this, _UserPrompt_instances, session_get).send("browsingContext.handleUserPrompt", {
        ...options,
        context: this.info.context
      });
      return __privateGet(this, _result);
    }
    [(_dispose_decorators = [main.inertIfDisposed], _handle_decorators = [main.throwIfDisposed((prompt) => {
      return __privateGet(prompt, _reason);
    })], main.disposeSymbol)]() {
      __privateGet(this, _reason) ?? __privateSet(this, _reason, "User prompt already closed, probably because the associated browsing context was destroyed.");
      this.emit("closed", { reason: __privateGet(this, _reason) });
      __privateGet(this, _disposables).dispose();
      super[main.disposeSymbol]();
    }
  }, _reason = new WeakMap(), _result = new WeakMap(), _disposables = new WeakMap(), _UserPrompt_instances = new WeakSet(), initialize_fn = function() {
    const browserContextEmitter = __privateGet(this, _disposables).use(new main.EventEmitter(this.browsingContext));
    browserContextEmitter.once("closed", ({ reason }) => {
      this.dispose(`User prompt already closed: ${reason}`);
    });
    const sessionEmitter = __privateGet(this, _disposables).use(new main.EventEmitter(__privateGet(this, _UserPrompt_instances, session_get)));
    sessionEmitter.on("browsingContext.userPromptClosed", (parameters) => {
      if (parameters.context !== this.browsingContext.id) {
        return;
      }
      __privateSet(this, _result, parameters);
      this.emit("handled", parameters);
      this.dispose("User prompt already handled.");
    });
  }, session_get = function() {
    return this.browsingContext.userContext.browser.session;
  }, (() => {
    const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
    __esDecorate$a(_a2, null, _dispose_decorators, { kind: "method", name: "dispose", static: false, private: false, access: { has: (obj) => "dispose" in obj, get: (obj) => obj.dispose }, metadata: _metadata }, null, _instanceExtraInitializers);
    __esDecorate$a(_a2, null, _handle_decorators, { kind: "method", name: "handle", static: false, private: false, access: { has: (obj) => "handle" in obj, get: (obj) => obj.handle }, metadata: _metadata }, null, _instanceExtraInitializers);
    if (_metadata) Object.defineProperty(_a2, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
  })(), _a2;
})();
/**
 * @license
 * Copyright 2024 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
var __runInitializers$9 = function(thisArg, initializers, value) {
  var useValue = arguments.length > 2;
  for (var i = 0; i < initializers.length; i++) {
    value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
  }
  return useValue ? value : void 0;
};
var __esDecorate$9 = function(ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
  function accept(f) {
    if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected");
    return f;
  }
  var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
  var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
  var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
  var _, done = false;
  for (var i = decorators.length - 1; i >= 0; i--) {
    var context = {};
    for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
    for (var p in contextIn.access) context.access[p] = contextIn.access[p];
    context.addInitializer = function(f) {
      if (done) throw new TypeError("Cannot add initializers after decoration has completed");
      extraInitializers.push(accept(f || null));
    };
    var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
    if (kind === "accessor") {
      if (result === void 0) continue;
      if (result === null || typeof result !== "object") throw new TypeError("Object expected");
      if (_ = accept(result.get)) descriptor.get = _;
      if (_ = accept(result.set)) descriptor.set = _;
      if (_ = accept(result.init)) initializers.unshift(_);
    } else if (_ = accept(result)) {
      if (kind === "field") initializers.unshift(_);
      else descriptor[key] = _;
    }
  }
  if (target) Object.defineProperty(target, contextIn.name, descriptor);
  done = true;
};
let BrowsingContext = (() => {
  var _navigation, _reason, _url, _children, _disposables, _realms, _requests, _BrowsingContext_instances, initialize_fn, session_get, createWindowRealm_fn, _a2;
  let _classSuper = main.EventEmitter;
  let _instanceExtraInitializers = [];
  let _dispose_decorators;
  let _activate_decorators;
  let _captureScreenshot_decorators;
  let _close_decorators;
  let _traverseHistory_decorators;
  let _navigate_decorators;
  let _reload_decorators;
  let _setCacheBehavior_decorators;
  let _print_decorators;
  let _handleUserPrompt_decorators;
  let _setViewport_decorators;
  let _performActions_decorators;
  let _releaseActions_decorators;
  let _createWindowRealm_decorators;
  let _addPreloadScript_decorators;
  let _addIntercept_decorators;
  let _removePreloadScript_decorators;
  let _setGeolocationOverride_decorators;
  let _setTimezoneOverride_decorators;
  let _getCookies_decorators;
  let _setCookie_decorators;
  let _setFiles_decorators;
  let _subscribe_decorators;
  let _addInterception_decorators;
  let _deleteCookie_decorators;
  let _locateNodes_decorators;
  return _a2 = class extends _classSuper {
    constructor(context, parent, id, url, originalOpener) {
      super();
      __privateAdd(this, _BrowsingContext_instances);
      __privateAdd(this, _navigation, __runInitializers$9(this, _instanceExtraInitializers));
      __privateAdd(this, _reason);
      __privateAdd(this, _url);
      __privateAdd(this, _children, /* @__PURE__ */ new Map());
      __privateAdd(this, _disposables, new main.DisposableStack());
      __privateAdd(this, _realms, /* @__PURE__ */ new Map());
      __privateAdd(this, _requests, /* @__PURE__ */ new Map());
      __publicField(this, "defaultRealm");
      __publicField(this, "id");
      __publicField(this, "parent");
      __publicField(this, "userContext");
      __publicField(this, "originalOpener");
      __privateSet(this, _url, url);
      this.id = id;
      this.parent = parent;
      this.userContext = context;
      this.originalOpener = originalOpener;
      this.defaultRealm = __privateMethod(this, _BrowsingContext_instances, createWindowRealm_fn).call(this);
    }
    static from(userContext, parent, id, url, originalOpener) {
      var _a3;
      const browsingContext = new _a2(userContext, parent, id, url, originalOpener);
      __privateMethod(_a3 = browsingContext, _BrowsingContext_instances, initialize_fn).call(_a3);
      return browsingContext;
    }
    get children() {
      return __privateGet(this, _children).values();
    }
    get closed() {
      return __privateGet(this, _reason) !== void 0;
    }
    get disposed() {
      return this.closed;
    }
    get realms() {
      const self = this;
      return function* () {
        yield self.defaultRealm;
        yield* __privateGet(self, _realms).values();
      }();
    }
    get top() {
      let context = this;
      for (let { parent } = context; parent; { parent } = context) {
        context = parent;
      }
      return context;
    }
    get url() {
      return __privateGet(this, _url);
    }
    dispose(reason) {
      __privateSet(this, _reason, reason);
      for (const context of __privateGet(this, _children).values()) {
        context.dispose("Parent browsing context was disposed");
      }
      this[main.disposeSymbol]();
    }
    async activate() {
      await __privateGet(this, _BrowsingContext_instances, session_get).send("browsingContext.activate", {
        context: this.id
      });
    }
    async captureScreenshot(options = {}) {
      const { result: { data } } = await __privateGet(this, _BrowsingContext_instances, session_get).send("browsingContext.captureScreenshot", {
        context: this.id,
        ...options
      });
      return data;
    }
    async close(promptUnload) {
      await Promise.all([...__privateGet(this, _children).values()].map(async (child) => {
        await child.close(promptUnload);
      }));
      await __privateGet(this, _BrowsingContext_instances, session_get).send("browsingContext.close", {
        context: this.id,
        promptUnload
      });
    }
    async traverseHistory(delta) {
      await __privateGet(this, _BrowsingContext_instances, session_get).send("browsingContext.traverseHistory", {
        context: this.id,
        delta
      });
    }
    async navigate(url, wait) {
      await __privateGet(this, _BrowsingContext_instances, session_get).send("browsingContext.navigate", {
        context: this.id,
        url,
        wait
      });
    }
    async reload(options = {}) {
      await __privateGet(this, _BrowsingContext_instances, session_get).send("browsingContext.reload", {
        context: this.id,
        ...options
      });
    }
    async setCacheBehavior(cacheBehavior) {
      await __privateGet(this, _BrowsingContext_instances, session_get).send("network.setCacheBehavior", {
        contexts: [this.id],
        cacheBehavior
      });
    }
    async print(options = {}) {
      const { result: { data } } = await __privateGet(this, _BrowsingContext_instances, session_get).send("browsingContext.print", {
        context: this.id,
        ...options
      });
      return data;
    }
    async handleUserPrompt(options = {}) {
      await __privateGet(this, _BrowsingContext_instances, session_get).send("browsingContext.handleUserPrompt", {
        context: this.id,
        ...options
      });
    }
    async setViewport(options = {}) {
      await __privateGet(this, _BrowsingContext_instances, session_get).send("browsingContext.setViewport", {
        context: this.id,
        ...options
      });
    }
    async performActions(actions) {
      await __privateGet(this, _BrowsingContext_instances, session_get).send("input.performActions", {
        context: this.id,
        actions
      });
    }
    async releaseActions() {
      await __privateGet(this, _BrowsingContext_instances, session_get).send("input.releaseActions", {
        context: this.id
      });
    }
    createWindowRealm(sandbox) {
      return __privateMethod(this, _BrowsingContext_instances, createWindowRealm_fn).call(this, sandbox);
    }
    async addPreloadScript(functionDeclaration, options = {}) {
      return await this.userContext.browser.addPreloadScript(functionDeclaration, {
        ...options,
        contexts: [this]
      });
    }
    async addIntercept(options) {
      const { result: { intercept } } = await this.userContext.browser.session.send("network.addIntercept", {
        ...options,
        contexts: [this.id]
      });
      return intercept;
    }
    async removePreloadScript(script) {
      await this.userContext.browser.removePreloadScript(script);
    }
    async setGeolocationOverride(options) {
      if (!("coordinates" in options)) {
        throw new Error("Missing coordinates");
      }
      await this.userContext.browser.session.send("emulation.setGeolocationOverride", {
        coordinates: options.coordinates,
        contexts: [this.id]
      });
    }
    async setTimezoneOverride(timezoneId) {
      if (timezoneId?.startsWith("GMT")) {
        timezoneId = timezoneId?.replace("GMT", "");
      }
      await this.userContext.browser.session.send("emulation.setTimezoneOverride", {
        timezone: timezoneId ?? null,
        contexts: [this.id]
      });
    }
    async getCookies(options = {}) {
      const { result: { cookies } } = await __privateGet(this, _BrowsingContext_instances, session_get).send("storage.getCookies", {
        ...options,
        partition: {
          type: "context",
          context: this.id
        }
      });
      return cookies;
    }
    async setCookie(cookie) {
      await __privateGet(this, _BrowsingContext_instances, session_get).send("storage.setCookie", {
        cookie,
        partition: {
          type: "context",
          context: this.id
        }
      });
    }
    async setFiles(element, files) {
      await __privateGet(this, _BrowsingContext_instances, session_get).send("input.setFiles", {
        context: this.id,
        element,
        files
      });
    }
    async subscribe(events2) {
      await __privateGet(this, _BrowsingContext_instances, session_get).subscribe(events2, [this.id]);
    }
    async addInterception(events2) {
      await __privateGet(this, _BrowsingContext_instances, session_get).subscribe(events2, [this.id]);
    }
    [(_dispose_decorators = [main.inertIfDisposed], _activate_decorators = [main.throwIfDisposed((context) => {
      return __privateGet(context, _reason);
    })], _captureScreenshot_decorators = [main.throwIfDisposed((context) => {
      return __privateGet(context, _reason);
    })], _close_decorators = [main.throwIfDisposed((context) => {
      return __privateGet(context, _reason);
    })], _traverseHistory_decorators = [main.throwIfDisposed((context) => {
      return __privateGet(context, _reason);
    })], _navigate_decorators = [main.throwIfDisposed((context) => {
      return __privateGet(context, _reason);
    })], _reload_decorators = [main.throwIfDisposed((context) => {
      return __privateGet(context, _reason);
    })], _setCacheBehavior_decorators = [main.throwIfDisposed((context) => {
      return __privateGet(context, _reason);
    })], _print_decorators = [main.throwIfDisposed((context) => {
      return __privateGet(context, _reason);
    })], _handleUserPrompt_decorators = [main.throwIfDisposed((context) => {
      return __privateGet(context, _reason);
    })], _setViewport_decorators = [main.throwIfDisposed((context) => {
      return __privateGet(context, _reason);
    })], _performActions_decorators = [main.throwIfDisposed((context) => {
      return __privateGet(context, _reason);
    })], _releaseActions_decorators = [main.throwIfDisposed((context) => {
      return __privateGet(context, _reason);
    })], _createWindowRealm_decorators = [main.throwIfDisposed((context) => {
      return __privateGet(context, _reason);
    })], _addPreloadScript_decorators = [main.throwIfDisposed((context) => {
      return __privateGet(context, _reason);
    })], _addIntercept_decorators = [main.throwIfDisposed((context) => {
      return __privateGet(context, _reason);
    })], _removePreloadScript_decorators = [main.throwIfDisposed((context) => {
      return __privateGet(context, _reason);
    })], _setGeolocationOverride_decorators = [main.throwIfDisposed((context) => {
      return __privateGet(context, _reason);
    })], _setTimezoneOverride_decorators = [main.throwIfDisposed((context) => {
      return __privateGet(context, _reason);
    })], _getCookies_decorators = [main.throwIfDisposed((context) => {
      return __privateGet(context, _reason);
    })], _setCookie_decorators = [main.throwIfDisposed((context) => {
      return __privateGet(context, _reason);
    })], _setFiles_decorators = [main.throwIfDisposed((context) => {
      return __privateGet(context, _reason);
    })], _subscribe_decorators = [main.throwIfDisposed((context) => {
      return __privateGet(context, _reason);
    })], _addInterception_decorators = [main.throwIfDisposed((context) => {
      return __privateGet(context, _reason);
    })], main.disposeSymbol)]() {
      __privateGet(this, _reason) ?? __privateSet(this, _reason, "Browsing context already closed, probably because the user context closed.");
      this.emit("closed", { reason: __privateGet(this, _reason) });
      __privateGet(this, _disposables).dispose();
      super[main.disposeSymbol]();
    }
    async deleteCookie(...cookieFilters) {
      await Promise.all(cookieFilters.map(async (filter) => {
        await __privateGet(this, _BrowsingContext_instances, session_get).send("storage.deleteCookies", {
          filter,
          partition: {
            type: "context",
            context: this.id
          }
        });
      }));
    }
    async locateNodes(locator, startNodes) {
      const result = await __privateGet(this, _BrowsingContext_instances, session_get).send("browsingContext.locateNodes", {
        context: this.id,
        locator,
        startNodes: startNodes.length ? startNodes : void 0
      });
      return result.result.nodes;
    }
  }, _navigation = new WeakMap(), _reason = new WeakMap(), _url = new WeakMap(), _children = new WeakMap(), _disposables = new WeakMap(), _realms = new WeakMap(), _requests = new WeakMap(), _BrowsingContext_instances = new WeakSet(), initialize_fn = function() {
    const userContextEmitter = __privateGet(this, _disposables).use(new main.EventEmitter(this.userContext));
    userContextEmitter.once("closed", ({ reason }) => {
      this.dispose(`Browsing context already closed: ${reason}`);
    });
    const sessionEmitter = __privateGet(this, _disposables).use(new main.EventEmitter(__privateGet(this, _BrowsingContext_instances, session_get)));
    sessionEmitter.on("input.fileDialogOpened", (info) => {
      if (this.id !== info.context) {
        return;
      }
      this.emit("filedialogopened", info);
    });
    sessionEmitter.on("browsingContext.contextCreated", (info) => {
      if (info.parent !== this.id) {
        return;
      }
      const browsingContext = _a2.from(this.userContext, this, info.context, info.url, info.originalOpener);
      __privateGet(this, _children).set(info.context, browsingContext);
      const browsingContextEmitter = __privateGet(this, _disposables).use(new main.EventEmitter(browsingContext));
      browsingContextEmitter.once("closed", () => {
        browsingContextEmitter.removeAllListeners();
        __privateGet(this, _children).delete(browsingContext.id);
      });
      this.emit("browsingcontext", { browsingContext });
    });
    sessionEmitter.on("browsingContext.contextDestroyed", (info) => {
      if (info.context !== this.id) {
        return;
      }
      this.dispose("Browsing context already closed.");
    });
    sessionEmitter.on("browsingContext.historyUpdated", (info) => {
      if (info.context !== this.id) {
        return;
      }
      __privateSet(this, _url, info.url);
      this.emit("historyUpdated", void 0);
    });
    sessionEmitter.on("browsingContext.domContentLoaded", (info) => {
      if (info.context !== this.id) {
        return;
      }
      __privateSet(this, _url, info.url);
      this.emit("DOMContentLoaded", void 0);
    });
    sessionEmitter.on("browsingContext.load", (info) => {
      if (info.context !== this.id) {
        return;
      }
      __privateSet(this, _url, info.url);
      this.emit("load", void 0);
    });
    sessionEmitter.on("browsingContext.navigationStarted", (info) => {
      if (info.context !== this.id) {
        return;
      }
      for (const [id, request] of __privateGet(this, _requests)) {
        if (request.disposed) {
          __privateGet(this, _requests).delete(id);
        }
      }
      if (__privateGet(this, _navigation) !== void 0 && !__privateGet(this, _navigation).disposed) {
        return;
      }
      __privateSet(this, _navigation, Navigation.from(this));
      const navigationEmitter = __privateGet(this, _disposables).use(new main.EventEmitter(__privateGet(this, _navigation)));
      for (const eventName of ["fragment", "failed", "aborted"]) {
        navigationEmitter.once(eventName, ({ url }) => {
          navigationEmitter[main.disposeSymbol]();
          __privateSet(this, _url, url);
        });
      }
      this.emit("navigation", { navigation: __privateGet(this, _navigation) });
    });
    sessionEmitter.on("network.beforeRequestSent", (event) => {
      if (event.context !== this.id) {
        return;
      }
      if (__privateGet(this, _requests).has(event.request.request)) {
        return;
      }
      const request = Request.from(this, event);
      __privateGet(this, _requests).set(request.id, request);
      this.emit("request", { request });
    });
    sessionEmitter.on("log.entryAdded", (entry) => {
      if (entry.source.context !== this.id) {
        return;
      }
      this.emit("log", { entry });
    });
    sessionEmitter.on("browsingContext.userPromptOpened", (info) => {
      if (info.context !== this.id) {
        return;
      }
      const userPrompt = UserPrompt.from(this, info);
      this.emit("userprompt", { userPrompt });
    });
  }, session_get = function() {
    return this.userContext.browser.session;
  }, createWindowRealm_fn = function(sandbox) {
    const realm = WindowRealm.from(this, sandbox);
    realm.on("worker", (realm2) => {
      this.emit("worker", { realm: realm2 });
    });
    return realm;
  }, (() => {
    const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
    _deleteCookie_decorators = [main.throwIfDisposed((context) => {
      return __privateGet(context, _reason);
    })];
    _locateNodes_decorators = [main.throwIfDisposed((context) => {
      return __privateGet(context, _reason);
    })];
    __esDecorate$9(_a2, null, _dispose_decorators, { kind: "method", name: "dispose", static: false, private: false, access: { has: (obj) => "dispose" in obj, get: (obj) => obj.dispose }, metadata: _metadata }, null, _instanceExtraInitializers);
    __esDecorate$9(_a2, null, _activate_decorators, { kind: "method", name: "activate", static: false, private: false, access: { has: (obj) => "activate" in obj, get: (obj) => obj.activate }, metadata: _metadata }, null, _instanceExtraInitializers);
    __esDecorate$9(_a2, null, _captureScreenshot_decorators, { kind: "method", name: "captureScreenshot", static: false, private: false, access: { has: (obj) => "captureScreenshot" in obj, get: (obj) => obj.captureScreenshot }, metadata: _metadata }, null, _instanceExtraInitializers);
    __esDecorate$9(_a2, null, _close_decorators, { kind: "method", name: "close", static: false, private: false, access: { has: (obj) => "close" in obj, get: (obj) => obj.close }, metadata: _metadata }, null, _instanceExtraInitializers);
    __esDecorate$9(_a2, null, _traverseHistory_decorators, { kind: "method", name: "traverseHistory", static: false, private: false, access: { has: (obj) => "traverseHistory" in obj, get: (obj) => obj.traverseHistory }, metadata: _metadata }, null, _instanceExtraInitializers);
    __esDecorate$9(_a2, null, _navigate_decorators, { kind: "method", name: "navigate", static: false, private: false, access: { has: (obj) => "navigate" in obj, get: (obj) => obj.navigate }, metadata: _metadata }, null, _instanceExtraInitializers);
    __esDecorate$9(_a2, null, _reload_decorators, { kind: "method", name: "reload", static: false, private: false, access: { has: (obj) => "reload" in obj, get: (obj) => obj.reload }, metadata: _metadata }, null, _instanceExtraInitializers);
    __esDecorate$9(_a2, null, _setCacheBehavior_decorators, { kind: "method", name: "setCacheBehavior", static: false, private: false, access: { has: (obj) => "setCacheBehavior" in obj, get: (obj) => obj.setCacheBehavior }, metadata: _metadata }, null, _instanceExtraInitializers);
    __esDecorate$9(_a2, null, _print_decorators, { kind: "method", name: "print", static: false, private: false, access: { has: (obj) => "print" in obj, get: (obj) => obj.print }, metadata: _metadata }, null, _instanceExtraInitializers);
    __esDecorate$9(_a2, null, _handleUserPrompt_decorators, { kind: "method", name: "handleUserPrompt", static: false, private: false, access: { has: (obj) => "handleUserPrompt" in obj, get: (obj) => obj.handleUserPrompt }, metadata: _metadata }, null, _instanceExtraInitializers);
    __esDecorate$9(_a2, null, _setViewport_decorators, { kind: "method", name: "setViewport", static: false, private: false, access: { has: (obj) => "setViewport" in obj, get: (obj) => obj.setViewport }, metadata: _metadata }, null, _instanceExtraInitializers);
    __esDecorate$9(_a2, null, _performActions_decorators, { kind: "method", name: "performActions", static: false, private: false, access: { has: (obj) => "performActions" in obj, get: (obj) => obj.performActions }, metadata: _metadata }, null, _instanceExtraInitializers);
    __esDecorate$9(_a2, null, _releaseActions_decorators, { kind: "method", name: "releaseActions", static: false, private: false, access: { has: (obj) => "releaseActions" in obj, get: (obj) => obj.releaseActions }, metadata: _metadata }, null, _instanceExtraInitializers);
    __esDecorate$9(_a2, null, _createWindowRealm_decorators, { kind: "method", name: "createWindowRealm", static: false, private: false, access: { has: (obj) => "createWindowRealm" in obj, get: (obj) => obj.createWindowRealm }, metadata: _metadata }, null, _instanceExtraInitializers);
    __esDecorate$9(_a2, null, _addPreloadScript_decorators, { kind: "method", name: "addPreloadScript", static: false, private: false, access: { has: (obj) => "addPreloadScript" in obj, get: (obj) => obj.addPreloadScript }, metadata: _metadata }, null, _instanceExtraInitializers);
    __esDecorate$9(_a2, null, _addIntercept_decorators, { kind: "method", name: "addIntercept", static: false, private: false, access: { has: (obj) => "addIntercept" in obj, get: (obj) => obj.addIntercept }, metadata: _metadata }, null, _instanceExtraInitializers);
    __esDecorate$9(_a2, null, _removePreloadScript_decorators, { kind: "method", name: "removePreloadScript", static: false, private: false, access: { has: (obj) => "removePreloadScript" in obj, get: (obj) => obj.removePreloadScript }, metadata: _metadata }, null, _instanceExtraInitializers);
    __esDecorate$9(_a2, null, _setGeolocationOverride_decorators, { kind: "method", name: "setGeolocationOverride", static: false, private: false, access: { has: (obj) => "setGeolocationOverride" in obj, get: (obj) => obj.setGeolocationOverride }, metadata: _metadata }, null, _instanceExtraInitializers);
    __esDecorate$9(_a2, null, _setTimezoneOverride_decorators, { kind: "method", name: "setTimezoneOverride", static: false, private: false, access: { has: (obj) => "setTimezoneOverride" in obj, get: (obj) => obj.setTimezoneOverride }, metadata: _metadata }, null, _instanceExtraInitializers);
    __esDecorate$9(_a2, null, _getCookies_decorators, { kind: "method", name: "getCookies", static: false, private: false, access: { has: (obj) => "getCookies" in obj, get: (obj) => obj.getCookies }, metadata: _metadata }, null, _instanceExtraInitializers);
    __esDecorate$9(_a2, null, _setCookie_decorators, { kind: "method", name: "setCookie", static: false, private: false, access: { has: (obj) => "setCookie" in obj, get: (obj) => obj.setCookie }, metadata: _metadata }, null, _instanceExtraInitializers);
    __esDecorate$9(_a2, null, _setFiles_decorators, { kind: "method", name: "setFiles", static: false, private: false, access: { has: (obj) => "setFiles" in obj, get: (obj) => obj.setFiles }, metadata: _metadata }, null, _instanceExtraInitializers);
    __esDecorate$9(_a2, null, _subscribe_decorators, { kind: "method", name: "subscribe", static: false, private: false, access: { has: (obj) => "subscribe" in obj, get: (obj) => obj.subscribe }, metadata: _metadata }, null, _instanceExtraInitializers);
    __esDecorate$9(_a2, null, _addInterception_decorators, { kind: "method", name: "addInterception", static: false, private: false, access: { has: (obj) => "addInterception" in obj, get: (obj) => obj.addInterception }, metadata: _metadata }, null, _instanceExtraInitializers);
    __esDecorate$9(_a2, null, _deleteCookie_decorators, { kind: "method", name: "deleteCookie", static: false, private: false, access: { has: (obj) => "deleteCookie" in obj, get: (obj) => obj.deleteCookie }, metadata: _metadata }, null, _instanceExtraInitializers);
    __esDecorate$9(_a2, null, _locateNodes_decorators, { kind: "method", name: "locateNodes", static: false, private: false, access: { has: (obj) => "locateNodes" in obj, get: (obj) => obj.locateNodes }, metadata: _metadata }, null, _instanceExtraInitializers);
    if (_metadata) Object.defineProperty(_a2, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
  })(), _a2;
})();
/**
 * @license
 * Copyright 2024 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
var __runInitializers$8 = function(thisArg, initializers, value) {
  var useValue = arguments.length > 2;
  for (var i = 0; i < initializers.length; i++) {
    value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
  }
  return useValue ? value : void 0;
};
var __esDecorate$8 = function(ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
  function accept(f) {
    if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected");
    return f;
  }
  var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
  var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
  var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
  var _, done = false;
  for (var i = decorators.length - 1; i >= 0; i--) {
    var context = {};
    for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
    for (var p in contextIn.access) context.access[p] = contextIn.access[p];
    context.addInitializer = function(f) {
      if (done) throw new TypeError("Cannot add initializers after decoration has completed");
      extraInitializers.push(accept(f || null));
    };
    var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
    if (kind === "accessor") {
      if (result === void 0) continue;
      if (result === null || typeof result !== "object") throw new TypeError("Object expected");
      if (_ = accept(result.get)) descriptor.get = _;
      if (_ = accept(result.set)) descriptor.set = _;
      if (_ = accept(result.init)) initializers.unshift(_);
    } else if (_ = accept(result)) {
      if (kind === "field") initializers.unshift(_);
      else descriptor[key] = _;
    }
  }
  if (target) Object.defineProperty(target, contextIn.name, descriptor);
  done = true;
};
let UserContext = (() => {
  var _a2, _reason, _browsingContexts, _disposables, _id, _UserContext_instances, initialize_fn, session_get;
  let _classSuper = main.EventEmitter;
  let _instanceExtraInitializers = [];
  let _dispose_decorators;
  let _createBrowsingContext_decorators;
  let _remove_decorators;
  let _getCookies_decorators;
  let _setCookie_decorators;
  let _setPermissions_decorators;
  return _a2 = class extends _classSuper {
    constructor(browser, id) {
      super();
      __privateAdd(this, _UserContext_instances);
      __privateAdd(this, _reason, __runInitializers$8(this, _instanceExtraInitializers));
      // Note these are only top-level contexts.
      __privateAdd(this, _browsingContexts, /* @__PURE__ */ new Map());
      __privateAdd(this, _disposables, new main.DisposableStack());
      __privateAdd(this, _id);
      __publicField(this, "browser");
      __privateSet(this, _id, id);
      this.browser = browser;
    }
    static create(browser, id) {
      var _a3;
      const context = new _a2(browser, id);
      __privateMethod(_a3 = context, _UserContext_instances, initialize_fn).call(_a3);
      return context;
    }
    get browsingContexts() {
      return __privateGet(this, _browsingContexts).values();
    }
    get closed() {
      return __privateGet(this, _reason) !== void 0;
    }
    get disposed() {
      return this.closed;
    }
    get id() {
      return __privateGet(this, _id);
    }
    dispose(reason) {
      __privateSet(this, _reason, reason);
      this[main.disposeSymbol]();
    }
    async createBrowsingContext(type, options = {}) {
      const { result: { context: contextId } } = await __privateGet(this, _UserContext_instances, session_get).send("browsingContext.create", {
        type,
        ...options,
        referenceContext: options.referenceContext?.id,
        userContext: __privateGet(this, _id)
      });
      const browsingContext = __privateGet(this, _browsingContexts).get(contextId);
      main.assert(browsingContext, "The WebDriver BiDi implementation is failing to create a browsing context correctly.");
      return browsingContext;
    }
    async remove() {
      try {
        await __privateGet(this, _UserContext_instances, session_get).send("browser.removeUserContext", {
          userContext: __privateGet(this, _id)
        });
      } finally {
        this.dispose("User context already closed.");
      }
    }
    async getCookies(options = {}, sourceOrigin = void 0) {
      const { result: { cookies } } = await __privateGet(this, _UserContext_instances, session_get).send("storage.getCookies", {
        ...options,
        partition: {
          type: "storageKey",
          userContext: __privateGet(this, _id),
          sourceOrigin
        }
      });
      return cookies;
    }
    async setCookie(cookie, sourceOrigin) {
      await __privateGet(this, _UserContext_instances, session_get).send("storage.setCookie", {
        cookie,
        partition: {
          type: "storageKey",
          sourceOrigin,
          userContext: this.id
        }
      });
    }
    async setPermissions(origin, descriptor, state) {
      await __privateGet(this, _UserContext_instances, session_get).send("permissions.setPermission", {
        origin,
        descriptor,
        state,
        userContext: __privateGet(this, _id)
      });
    }
    [(_dispose_decorators = [main.inertIfDisposed], _createBrowsingContext_decorators = [main.throwIfDisposed((context) => {
      return __privateGet(context, _reason);
    })], _remove_decorators = [main.throwIfDisposed((context) => {
      return __privateGet(context, _reason);
    })], _getCookies_decorators = [main.throwIfDisposed((context) => {
      return __privateGet(context, _reason);
    })], _setCookie_decorators = [main.throwIfDisposed((context) => {
      return __privateGet(context, _reason);
    })], _setPermissions_decorators = [main.throwIfDisposed((context) => {
      return __privateGet(context, _reason);
    })], main.disposeSymbol)]() {
      __privateGet(this, _reason) ?? __privateSet(this, _reason, "User context already closed, probably because the browser disconnected/closed.");
      this.emit("closed", { reason: __privateGet(this, _reason) });
      __privateGet(this, _disposables).dispose();
      super[main.disposeSymbol]();
    }
  }, _reason = new WeakMap(), _browsingContexts = new WeakMap(), _disposables = new WeakMap(), _id = new WeakMap(), _UserContext_instances = new WeakSet(), initialize_fn = function() {
    const browserEmitter = __privateGet(this, _disposables).use(new main.EventEmitter(this.browser));
    browserEmitter.once("closed", ({ reason }) => {
      this.dispose(`User context was closed: ${reason}`);
    });
    browserEmitter.once("disconnected", ({ reason }) => {
      this.dispose(`User context was closed: ${reason}`);
    });
    const sessionEmitter = __privateGet(this, _disposables).use(new main.EventEmitter(__privateGet(this, _UserContext_instances, session_get)));
    sessionEmitter.on("browsingContext.contextCreated", (info) => {
      if (info.parent) {
        return;
      }
      if (info.userContext !== __privateGet(this, _id)) {
        return;
      }
      const browsingContext = BrowsingContext.from(this, void 0, info.context, info.url, info.originalOpener);
      __privateGet(this, _browsingContexts).set(browsingContext.id, browsingContext);
      const browsingContextEmitter = __privateGet(this, _disposables).use(new main.EventEmitter(browsingContext));
      browsingContextEmitter.on("closed", () => {
        browsingContextEmitter.removeAllListeners();
        __privateGet(this, _browsingContexts).delete(browsingContext.id);
      });
      this.emit("browsingcontext", { browsingContext });
    });
  }, session_get = function() {
    return this.browser.session;
  }, (() => {
    const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
    __esDecorate$8(_a2, null, _dispose_decorators, { kind: "method", name: "dispose", static: false, private: false, access: { has: (obj) => "dispose" in obj, get: (obj) => obj.dispose }, metadata: _metadata }, null, _instanceExtraInitializers);
    __esDecorate$8(_a2, null, _createBrowsingContext_decorators, { kind: "method", name: "createBrowsingContext", static: false, private: false, access: { has: (obj) => "createBrowsingContext" in obj, get: (obj) => obj.createBrowsingContext }, metadata: _metadata }, null, _instanceExtraInitializers);
    __esDecorate$8(_a2, null, _remove_decorators, { kind: "method", name: "remove", static: false, private: false, access: { has: (obj) => "remove" in obj, get: (obj) => obj.remove }, metadata: _metadata }, null, _instanceExtraInitializers);
    __esDecorate$8(_a2, null, _getCookies_decorators, { kind: "method", name: "getCookies", static: false, private: false, access: { has: (obj) => "getCookies" in obj, get: (obj) => obj.getCookies }, metadata: _metadata }, null, _instanceExtraInitializers);
    __esDecorate$8(_a2, null, _setCookie_decorators, { kind: "method", name: "setCookie", static: false, private: false, access: { has: (obj) => "setCookie" in obj, get: (obj) => obj.setCookie }, metadata: _metadata }, null, _instanceExtraInitializers);
    __esDecorate$8(_a2, null, _setPermissions_decorators, { kind: "method", name: "setPermissions", static: false, private: false, access: { has: (obj) => "setPermissions" in obj, get: (obj) => obj.setPermissions }, metadata: _metadata }, null, _instanceExtraInitializers);
    if (_metadata) Object.defineProperty(_a2, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
  })(), __publicField(_a2, "DEFAULT", "default"), _a2;
})();
/**
 * @license
 * Copyright 2023 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
class BidiDeserializer {
  static deserialize(result) {
    if (!result) {
      main.debugError("Service did not produce a result.");
      return void 0;
    }
    switch (result.type) {
      case "array":
        return result.value?.map((value) => {
          return this.deserialize(value);
        });
      case "set":
        return result.value?.reduce((acc, value) => {
          return acc.add(this.deserialize(value));
        }, /* @__PURE__ */ new Set());
      case "object":
        return result.value?.reduce((acc, tuple) => {
          const { key, value } = this.#deserializeTuple(tuple);
          acc[key] = value;
          return acc;
        }, {});
      case "map":
        return result.value?.reduce((acc, tuple) => {
          const { key, value } = this.#deserializeTuple(tuple);
          return acc.set(key, value);
        }, /* @__PURE__ */ new Map());
      case "promise":
        return {};
      case "regexp":
        return new RegExp(result.value.pattern, result.value.flags);
      case "date":
        return new Date(result.value);
      case "undefined":
        return void 0;
      case "null":
        return null;
      case "number":
        return this.#deserializeNumber(result.value);
      case "bigint":
        return BigInt(result.value);
      case "boolean":
        return Boolean(result.value);
      case "string":
        return result.value;
    }
    main.debugError(`Deserialization of type ${result.type} not supported.`);
    return void 0;
  }
  static #deserializeNumber(value) {
    switch (value) {
      case "-0":
        return -0;
      case "NaN":
        return NaN;
      case "Infinity":
        return Infinity;
      case "-Infinity":
        return -Infinity;
      default:
        return value;
    }
  }
  static #deserializeTuple([serializedKey, serializedValue]) {
    const key = typeof serializedKey === "string" ? serializedKey : this.deserialize(serializedKey);
    const value = this.deserialize(serializedValue);
    return { key, value };
  }
}
/**
 * @license
 * Copyright 2023 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
class BidiJSHandle extends main.JSHandle {
  static from(value, realm) {
    return new BidiJSHandle(value, realm);
  }
  #remoteValue;
  realm;
  #disposed = false;
  constructor(value, realm) {
    super();
    this.#remoteValue = value;
    this.realm = realm;
  }
  get disposed() {
    return this.#disposed;
  }
  async jsonValue() {
    return await this.evaluate((value) => {
      return value;
    });
  }
  asElement() {
    return null;
  }
  async dispose() {
    if (this.#disposed) {
      return;
    }
    this.#disposed = true;
    await this.realm.destroyHandles([this]);
  }
  get isPrimitiveValue() {
    switch (this.#remoteValue.type) {
      case "string":
      case "number":
      case "bigint":
      case "boolean":
      case "undefined":
      case "null":
        return true;
      default:
        return false;
    }
  }
  toString() {
    if (this.isPrimitiveValue) {
      return "JSHandle:" + BidiDeserializer.deserialize(this.#remoteValue);
    }
    return "JSHandle@" + this.#remoteValue.type;
  }
  get id() {
    return "handle" in this.#remoteValue ? this.#remoteValue.handle : void 0;
  }
  remoteValue() {
    return this.#remoteValue;
  }
  remoteObject() {
    throw new main.UnsupportedOperation("Not available in WebDriver BiDi");
  }
}
/**
 * @license
 * Copyright 2023 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
var __runInitializers$7 = function(thisArg, initializers, value) {
  var useValue = arguments.length > 2;
  for (var i = 0; i < initializers.length; i++) {
    value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
  }
  return useValue ? value : void 0;
};
var __esDecorate$7 = function(ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
  function accept(f) {
    if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected");
    return f;
  }
  var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
  var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
  var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
  var _, done = false;
  for (var i = decorators.length - 1; i >= 0; i--) {
    var context = {};
    for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
    for (var p in contextIn.access) context.access[p] = contextIn.access[p];
    context.addInitializer = function(f) {
      if (done) throw new TypeError("Cannot add initializers after decoration has completed");
      extraInitializers.push(accept(f || null));
    };
    var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
    if (kind === "accessor") {
      if (result === void 0) continue;
      if (result === null || typeof result !== "object") throw new TypeError("Object expected");
      if (_ = accept(result.get)) descriptor.get = _;
      if (_ = accept(result.set)) descriptor.set = _;
      if (_ = accept(result.init)) initializers.unshift(_);
    } else if (_ = accept(result)) {
      if (kind === "field") initializers.unshift(_);
      else descriptor[key] = _;
    }
  }
  if (target) Object.defineProperty(target, contextIn.name, descriptor);
  done = true;
};
var __addDisposableResource$5 = function(env, value, async) {
  if (value !== null && value !== void 0) {
    if (typeof value !== "object" && typeof value !== "function") throw new TypeError("Object expected.");
    var dispose, inner;
    if (async) {
      if (!Symbol.asyncDispose) throw new TypeError("Symbol.asyncDispose is not defined.");
      dispose = value[Symbol.asyncDispose];
    }
    if (dispose === void 0) {
      if (!Symbol.dispose) throw new TypeError("Symbol.dispose is not defined.");
      dispose = value[Symbol.dispose];
      if (async) inner = dispose;
    }
    if (typeof dispose !== "function") throw new TypeError("Object not disposable.");
    if (inner) dispose = function() {
      try {
        inner.call(this);
      } catch (e) {
        return Promise.reject(e);
      }
    };
    env.stack.push({ value, dispose, async });
  } else if (async) {
    env.stack.push({ async: true });
  }
  return value;
};
var __disposeResources$5 = /* @__PURE__ */ function(SuppressedError2) {
  return function(env) {
    function fail(e) {
      env.error = env.hasError ? new SuppressedError2(e, env.error, "An error was suppressed during disposal.") : e;
      env.hasError = true;
    }
    var r, s = 0;
    function next() {
      while (r = env.stack.pop()) {
        try {
          if (!r.async && s === 1) return s = 0, env.stack.push(r), Promise.resolve().then(next);
          if (r.dispose) {
            var result = r.dispose.call(r.value);
            if (r.async) return s |= 2, Promise.resolve(result).then(next, function(e) {
              fail(e);
              return next();
            });
          } else s |= 1;
        } catch (e) {
          fail(e);
        }
      }
      if (s === 1) return env.hasError ? Promise.reject(env.error) : Promise.resolve();
      if (env.hasError) throw env.error;
    }
    return next();
  };
}(typeof SuppressedError === "function" ? SuppressedError : function(error, suppressed, message) {
  var e = new Error(message);
  return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
});
let BidiElementHandle = (() => {
  var _backendNodeId, _a2;
  let _classSuper = main.ElementHandle;
  let _instanceExtraInitializers = [];
  let _autofill_decorators;
  let _contentFrame_decorators;
  return _a2 = class extends _classSuper {
    constructor(value, realm) {
      super(BidiJSHandle.from(value, realm));
      __privateAdd(this, _backendNodeId, __runInitializers$7(this, _instanceExtraInitializers));
    }
    static from(value, realm) {
      return new _a2(value, realm);
    }
    get realm() {
      return this.handle.realm;
    }
    get frame() {
      return this.realm.environment;
    }
    remoteValue() {
      return this.handle.remoteValue();
    }
    async autofill(data) {
      const client = this.frame.client;
      const nodeInfo = await client.send("DOM.describeNode", {
        objectId: this.handle.id
      });
      const fieldId = nodeInfo.node.backendNodeId;
      const frameId = this.frame._id;
      await client.send("Autofill.trigger", {
        fieldId,
        frameId,
        card: data.creditCard
      });
    }
    async contentFrame() {
      const env_1 = { stack: [], error: void 0, hasError: false };
      try {
        const handle = __addDisposableResource$5(env_1, await this.evaluateHandle((element) => {
          if (element instanceof HTMLIFrameElement || element instanceof HTMLFrameElement) {
            return element.contentWindow;
          }
          return;
        }), false);
        const value = handle.remoteValue();
        if (value.type === "window") {
          return this.frame.page().frames().find((frame) => {
            return frame._id === value.value.context;
          }) ?? null;
        }
        return null;
      } catch (e_1) {
        env_1.error = e_1;
        env_1.hasError = true;
      } finally {
        __disposeResources$5(env_1);
      }
    }
    async uploadFile(...files) {
      const path = main.environment.value.path;
      if (path) {
        files = files.map((file) => {
          if (path.win32.isAbsolute(file) || path.posix.isAbsolute(file)) {
            return file;
          } else {
            return path.resolve(file);
          }
        });
      }
      await this.frame.setFiles(this, files);
    }
    async *queryAXTree(name, role) {
      const results = await this.frame.locateNodes(this, {
        type: "accessibility",
        value: {
          role,
          name
        }
      });
      return yield* main.AsyncIterableUtil.map(results, (node) => {
        return Promise.resolve(_a2.from(node, this.realm));
      });
    }
    async backendNodeId() {
      if (!this.frame.page().browser().cdpSupported) {
        throw new main.UnsupportedOperation();
      }
      if (__privateGet(this, _backendNodeId)) {
        return __privateGet(this, _backendNodeId);
      }
      const { node } = await this.frame.client.send("DOM.describeNode", {
        objectId: this.handle.id
      });
      __privateSet(this, _backendNodeId, node.backendNodeId);
      return __privateGet(this, _backendNodeId);
    }
  }, _backendNodeId = new WeakMap(), (() => {
    const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
    _autofill_decorators = [main.throwIfDisposed()];
    _contentFrame_decorators = [main.throwIfDisposed(), main.bindIsolatedHandle];
    __esDecorate$7(_a2, null, _autofill_decorators, { kind: "method", name: "autofill", static: false, private: false, access: { has: (obj) => "autofill" in obj, get: (obj) => obj.autofill }, metadata: _metadata }, null, _instanceExtraInitializers);
    __esDecorate$7(_a2, null, _contentFrame_decorators, { kind: "method", name: "contentFrame", static: false, private: false, access: { has: (obj) => "contentFrame" in obj, get: (obj) => obj.contentFrame }, metadata: _metadata }, null, _instanceExtraInitializers);
    if (_metadata) Object.defineProperty(_a2, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
  })(), _a2;
})();
/**
 * @license
 * Copyright 2017 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
class BidiDialog extends main.Dialog {
  static from(prompt) {
    return new BidiDialog(prompt);
  }
  #prompt;
  constructor(prompt) {
    super(prompt.info.type, prompt.info.message, prompt.info.defaultValue);
    this.#prompt = prompt;
    this.handled = prompt.handled;
  }
  async handle(options) {
    await this.#prompt.handle({
      accept: options.accept,
      userText: options.text
    });
  }
}
var protocolExports = requireProtocol();
/**
 * @license
 * Copyright 2023 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
var __addDisposableResource$4 = function(env, value, async) {
  if (value !== null && value !== void 0) {
    if (typeof value !== "object" && typeof value !== "function") throw new TypeError("Object expected.");
    var dispose, inner;
    if (async) {
      if (!Symbol.asyncDispose) throw new TypeError("Symbol.asyncDispose is not defined.");
      dispose = value[Symbol.asyncDispose];
    }
    if (dispose === void 0) {
      if (!Symbol.dispose) throw new TypeError("Symbol.dispose is not defined.");
      dispose = value[Symbol.dispose];
      if (async) inner = dispose;
    }
    if (typeof dispose !== "function") throw new TypeError("Object not disposable.");
    if (inner) dispose = function() {
      try {
        inner.call(this);
      } catch (e) {
        return Promise.reject(e);
      }
    };
    env.stack.push({ value, dispose, async });
  } else if (async) {
    env.stack.push({ async: true });
  }
  return value;
};
var __disposeResources$4 = /* @__PURE__ */ function(SuppressedError2) {
  return function(env) {
    function fail(e) {
      env.error = env.hasError ? new SuppressedError2(e, env.error, "An error was suppressed during disposal.") : e;
      env.hasError = true;
    }
    var r, s = 0;
    function next() {
      while (r = env.stack.pop()) {
        try {
          if (!r.async && s === 1) return s = 0, env.stack.push(r), Promise.resolve().then(next);
          if (r.dispose) {
            var result = r.dispose.call(r.value);
            if (r.async) return s |= 2, Promise.resolve(result).then(next, function(e) {
              fail(e);
              return next();
            });
          } else s |= 1;
        } catch (e) {
          fail(e);
        }
      }
      if (s === 1) return env.hasError ? Promise.reject(env.error) : Promise.resolve();
      if (env.hasError) throw env.error;
    }
    return next();
  };
}(typeof SuppressedError === "function" ? SuppressedError : function(error, suppressed, message) {
  var e = new Error(message);
  return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
});
class ExposableFunction {
  static async from(frame, name, apply, isolate = false) {
    const func = new ExposableFunction(frame, name, apply, isolate);
    await func.#initialize();
    return func;
  }
  #frame;
  name;
  #apply;
  #isolate;
  #channel;
  #scripts = [];
  #disposables = new main.DisposableStack();
  constructor(frame, name, apply, isolate = false) {
    this.#frame = frame;
    this.name = name;
    this.#apply = apply;
    this.#isolate = isolate;
    this.#channel = `__puppeteer__${this.#frame._id}_page_exposeFunction_${this.name}`;
  }
  async #initialize() {
    const connection = this.#connection;
    const channel = {
      type: "channel",
      value: {
        channel: this.#channel,
        ownership: "root"
      }
    };
    const connectionEmitter = this.#disposables.use(new main.EventEmitter(connection));
    connectionEmitter.on(protocolExports.ChromiumBidi.Script.EventNames.Message, this.#handleMessage);
    const functionDeclaration = main.stringifyFunction(main.interpolateFunction((callback) => {
      Object.assign(globalThis, {
        [PLACEHOLDER("name")]: function(...args) {
          return new Promise((resolve, reject) => {
            callback([resolve, reject, args]);
          });
        }
      });
    }, { name: JSON.stringify(this.name) }));
    const frames = [this.#frame];
    for (const frame of frames) {
      frames.push(...frame.childFrames());
    }
    await Promise.all(frames.map(async (frame) => {
      const realm = this.#isolate ? frame.isolatedRealm() : frame.mainRealm();
      try {
        const [script] = await Promise.all([
          frame.browsingContext.addPreloadScript(functionDeclaration, {
            arguments: [channel],
            sandbox: realm.sandbox
          }),
          realm.realm.callFunction(functionDeclaration, false, {
            arguments: [channel]
          })
        ]);
        this.#scripts.push([frame, script]);
      } catch (error) {
        main.debugError(error);
      }
    }));
  }
  get #connection() {
    return this.#frame.page().browser().connection;
  }
  #handleMessage = async (params) => {
    const env_1 = { stack: [], error: void 0, hasError: false };
    try {
      if (params.channel !== this.#channel) {
        return;
      }
      const realm = this.#getRealm(params.source);
      if (!realm) {
        return;
      }
      const dataHandle = __addDisposableResource$4(env_1, BidiJSHandle.from(params.data, realm), false);
      const stack = __addDisposableResource$4(env_1, new main.DisposableStack(), false);
      const args = [];
      let result;
      try {
        const env_2 = { stack: [], error: void 0, hasError: false };
        try {
          const argsHandle = __addDisposableResource$4(env_2, await dataHandle.evaluateHandle(([, , args2]) => {
            return args2;
          }), false);
          for (const [index, handle] of await argsHandle.getProperties()) {
            stack.use(handle);
            if (handle instanceof BidiElementHandle) {
              args[+index] = handle;
              stack.use(handle);
              continue;
            }
            args[+index] = handle.jsonValue();
          }
          result = await this.#apply(...await Promise.all(args));
        } catch (e_1) {
          env_2.error = e_1;
          env_2.hasError = true;
        } finally {
          __disposeResources$4(env_2);
        }
      } catch (error) {
        try {
          if (error instanceof Error) {
            await dataHandle.evaluate(([, reject], name, message, stack2) => {
              const error2 = new Error(message);
              error2.name = name;
              if (stack2) {
                error2.stack = stack2;
              }
              reject(error2);
            }, error.name, error.message, error.stack);
          } else {
            await dataHandle.evaluate(([, reject], error2) => {
              reject(error2);
            }, error);
          }
        } catch (error2) {
          main.debugError(error2);
        }
        return;
      }
      try {
        await dataHandle.evaluate(([resolve], result2) => {
          resolve(result2);
        }, result);
      } catch (error) {
        main.debugError(error);
      }
    } catch (e_2) {
      env_1.error = e_2;
      env_1.hasError = true;
    } finally {
      __disposeResources$4(env_1);
    }
  };
  #getRealm(source) {
    const frame = this.#findFrame(source.context);
    if (!frame) {
      return;
    }
    return frame.realm(source.realm);
  }
  #findFrame(id) {
    const frames = [this.#frame];
    for (const frame of frames) {
      if (frame._id === id) {
        return frame;
      }
      frames.push(...frame.childFrames());
    }
    return;
  }
  [Symbol.dispose]() {
    void this[Symbol.asyncDispose]().catch(main.debugError);
  }
  async [Symbol.asyncDispose]() {
    this.#disposables.dispose();
    await Promise.all(this.#scripts.map(async ([frame, script]) => {
      const realm = this.#isolate ? frame.isolatedRealm() : frame.mainRealm();
      try {
        await Promise.all([
          realm.evaluate((name) => {
            delete globalThis[name];
          }, this.name),
          ...frame.childFrames().map((childFrame) => {
            return childFrame.evaluate((name) => {
              delete globalThis[name];
            }, this.name);
          }),
          frame.browsingContext.removePreloadScript(script)
        ]);
      } catch (error) {
        main.debugError(error);
      }
    }));
  }
}
var __runInitializers$6 = function(thisArg, initializers, value) {
  var useValue = arguments.length > 2;
  for (var i = 0; i < initializers.length; i++) {
    value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
  }
  return useValue ? value : void 0;
};
var __esDecorate$6 = function(ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
  function accept(f) {
    if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected");
    return f;
  }
  var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
  var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
  var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
  var _, done = false;
  for (var i = decorators.length - 1; i >= 0; i--) {
    var context = {};
    for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
    for (var p in contextIn.access) context.access[p] = contextIn.access[p];
    context.addInitializer = function(f) {
      if (done) throw new TypeError("Cannot add initializers after decoration has completed");
      extraInitializers.push(accept(f || null));
    };
    var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
    if (kind === "accessor") {
      if (result === void 0) continue;
      if (result === null || typeof result !== "object") throw new TypeError("Object expected");
      if (_ = accept(result.get)) descriptor.get = _;
      if (_ = accept(result.set)) descriptor.set = _;
      if (_ = accept(result.init)) initializers.unshift(_);
    } else if (_ = accept(result)) {
      if (kind === "field") initializers.unshift(_);
      else descriptor[key] = _;
    }
  }
  if (target) Object.defineProperty(target, contextIn.name, descriptor);
  done = true;
};
let BidiHTTPResponse = (() => {
  var _data, _request, _securityDetails, _cdpSupported, _BidiHTTPResponse_instances, initialize_fn, _a2;
  let _classSuper = main.HTTPResponse;
  let _instanceExtraInitializers = [];
  let _remoteAddress_decorators;
  return _a2 = class extends _classSuper {
    constructor(data, request, cdpSupported) {
      super();
      __privateAdd(this, _BidiHTTPResponse_instances);
      __privateAdd(this, _data, __runInitializers$6(this, _instanceExtraInitializers));
      __privateAdd(this, _request);
      __privateAdd(this, _securityDetails);
      __privateAdd(this, _cdpSupported, false);
      __privateSet(this, _data, data);
      __privateSet(this, _request, request);
      __privateSet(this, _cdpSupported, cdpSupported);
      const securityDetails = data["goog:securityDetails"];
      if (cdpSupported && securityDetails) {
        __privateSet(this, _securityDetails, new main.SecurityDetails(securityDetails));
      }
    }
    static from(data, request, cdpSupported) {
      var _a3;
      const response = new _a2(data, request, cdpSupported);
      __privateMethod(_a3 = response, _BidiHTTPResponse_instances, initialize_fn).call(_a3);
      return response;
    }
    remoteAddress() {
      return {
        ip: "",
        port: -1
      };
    }
    url() {
      return __privateGet(this, _data).url;
    }
    status() {
      return __privateGet(this, _data).status;
    }
    statusText() {
      return __privateGet(this, _data).statusText;
    }
    headers() {
      const headers = {};
      for (const header of __privateGet(this, _data).headers) {
        if (header.value.type === "string") {
          headers[header.name.toLowerCase()] = header.value.value;
        }
      }
      return headers;
    }
    request() {
      return __privateGet(this, _request);
    }
    fromCache() {
      return __privateGet(this, _data).fromCache;
    }
    timing() {
      const bidiTiming = __privateGet(this, _request).timing();
      return {
        requestTime: bidiTiming.requestTime,
        proxyStart: -1,
        proxyEnd: -1,
        dnsStart: bidiTiming.dnsStart,
        dnsEnd: bidiTiming.dnsEnd,
        connectStart: bidiTiming.connectStart,
        connectEnd: bidiTiming.connectEnd,
        sslStart: bidiTiming.tlsStart,
        sslEnd: -1,
        workerStart: -1,
        workerReady: -1,
        workerFetchStart: -1,
        workerRespondWithSettled: -1,
        workerRouterEvaluationStart: -1,
        workerCacheLookupStart: -1,
        sendStart: bidiTiming.requestStart,
        sendEnd: -1,
        pushStart: -1,
        pushEnd: -1,
        receiveHeadersStart: bidiTiming.responseStart,
        receiveHeadersEnd: bidiTiming.responseEnd
      };
    }
    frame() {
      return __privateGet(this, _request).frame();
    }
    fromServiceWorker() {
      return false;
    }
    securityDetails() {
      if (!__privateGet(this, _cdpSupported)) {
        throw new main.UnsupportedOperation();
      }
      return __privateGet(this, _securityDetails) ?? null;
    }
    async content() {
      return await __privateGet(this, _request).getResponseContent();
    }
  }, _data = new WeakMap(), _request = new WeakMap(), _securityDetails = new WeakMap(), _cdpSupported = new WeakMap(), _BidiHTTPResponse_instances = new WeakSet(), initialize_fn = function() {
    if (__privateGet(this, _data).fromCache) {
      __privateGet(this, _request)._fromMemoryCache = true;
      __privateGet(this, _request).frame()?.page().trustedEmitter.emit("requestservedfromcache", __privateGet(this, _request));
    }
    __privateGet(this, _request).frame()?.page().trustedEmitter.emit("response", this);
  }, (() => {
    const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
    _remoteAddress_decorators = [main.invokeAtMostOnceForArguments];
    __esDecorate$6(_a2, null, _remoteAddress_decorators, { kind: "method", name: "remoteAddress", static: false, private: false, access: { has: (obj) => "remoteAddress" in obj, get: (obj) => obj.remoteAddress }, metadata: _metadata }, null, _instanceExtraInitializers);
    if (_metadata) Object.defineProperty(_a2, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
  })(), _a2;
})();
var _a;
const requests = /* @__PURE__ */ new WeakMap();
class BidiHTTPRequest extends main.HTTPRequest {
  static from(bidiRequest, frame, redirect) {
    const request = new _a(bidiRequest, frame, redirect);
    request.#initialize();
    return request;
  }
  #redirectChain;
  #response = null;
  id;
  #frame;
  #request;
  constructor(request, frame, redirect) {
    super();
    requests.set(request, this);
    this.interception.enabled = request.isBlocked;
    this.#request = request;
    this.#frame = frame;
    this.#redirectChain = redirect ? redirect.#redirectChain : [];
    this.id = request.id;
  }
  get client() {
    return this.#frame.client;
  }
  #initialize() {
    this.#request.on("redirect", (request) => {
      const httpRequest = _a.from(request, this.#frame, this);
      this.#redirectChain.push(this);
      request.once("success", () => {
        this.#frame.page().trustedEmitter.emit("requestfinished", httpRequest);
      });
      request.once("error", () => {
        this.#frame.page().trustedEmitter.emit("requestfailed", httpRequest);
      });
      void httpRequest.finalizeInterceptions();
    });
    this.#request.once("success", (data) => {
      this.#response = BidiHTTPResponse.from(data, this, this.#frame.page().browser().cdpSupported);
    });
    this.#request.on("authenticate", this.#handleAuthentication);
    this.#frame.page().trustedEmitter.emit("request", this);
    if (this.#hasInternalHeaderOverwrite) {
      this.interception.handlers.push(async () => {
        await this.continue({
          headers: this.headers()
        }, 0);
      });
    }
  }
  url() {
    return this.#request.url;
  }
  resourceType() {
    if (!this.#frame.page().browser().cdpSupported) {
      throw new main.UnsupportedOperation();
    }
    return (this.#request.resourceType || "other").toLowerCase();
  }
  method() {
    return this.#request.method;
  }
  postData() {
    if (!this.#frame.page().browser().cdpSupported) {
      throw new main.UnsupportedOperation();
    }
    return this.#request.postData;
  }
  hasPostData() {
    if (!this.#frame.page().browser().cdpSupported) {
      throw new main.UnsupportedOperation();
    }
    return this.#request.hasPostData;
  }
  async fetchPostData() {
    throw new main.UnsupportedOperation();
  }
  get #hasInternalHeaderOverwrite() {
    return Boolean(Object.keys(this.#extraHTTPHeaders).length || Object.keys(this.#userAgentHeaders).length);
  }
  get #extraHTTPHeaders() {
    return this.#frame?.page()._extraHTTPHeaders ?? {};
  }
  get #userAgentHeaders() {
    return this.#frame?.page()._userAgentHeaders ?? {};
  }
  headers() {
    const headers = {};
    for (const header of this.#request.headers) {
      headers[header.name.toLowerCase()] = header.value.value;
    }
    return {
      ...headers,
      ...this.#extraHTTPHeaders,
      ...this.#userAgentHeaders
    };
  }
  response() {
    return this.#response;
  }
  failure() {
    if (this.#request.error === void 0) {
      return null;
    }
    return { errorText: this.#request.error };
  }
  isNavigationRequest() {
    return this.#request.navigation !== void 0;
  }
  initiator() {
    return {
      ...this.#request.initiator,
      type: this.#request.initiator?.type ?? "other"
    };
  }
  redirectChain() {
    return this.#redirectChain.slice();
  }
  frame() {
    return this.#frame;
  }
  async continue(overrides, priority) {
    return await super.continue({
      headers: this.#hasInternalHeaderOverwrite ? this.headers() : void 0,
      ...overrides
    }, priority);
  }
  async _continue(overrides = {}) {
    const headers = getBidiHeaders(overrides.headers);
    this.interception.handled = true;
    return await this.#request.continueRequest({
      url: overrides.url,
      method: overrides.method,
      body: overrides.postData ? {
        type: "base64",
        value: main.stringToBase64(overrides.postData)
      } : void 0,
      headers: headers.length > 0 ? headers : void 0
    }).catch((error) => {
      this.interception.handled = false;
      return main.handleError(error);
    });
  }
  async _abort() {
    this.interception.handled = true;
    return await this.#request.failRequest().catch((error) => {
      this.interception.handled = false;
      throw error;
    });
  }
  async _respond(response, _priority) {
    this.interception.handled = true;
    let parsedBody;
    if (response.body) {
      parsedBody = main.HTTPRequest.getResponse(response.body);
    }
    const headers = getBidiHeaders(response.headers);
    const hasContentLength = headers.some((header) => {
      return header.name === "content-length";
    });
    if (response.contentType) {
      headers.push({
        name: "content-type",
        value: {
          type: "string",
          value: response.contentType
        }
      });
    }
    if (parsedBody?.contentLength && !hasContentLength) {
      headers.push({
        name: "content-length",
        value: {
          type: "string",
          value: String(parsedBody.contentLength)
        }
      });
    }
    const status = response.status || 200;
    return await this.#request.provideResponse({
      statusCode: status,
      headers: headers.length > 0 ? headers : void 0,
      reasonPhrase: main.STATUS_TEXTS[status],
      body: parsedBody?.base64 ? {
        type: "base64",
        value: parsedBody?.base64
      } : void 0
    }).catch((error) => {
      this.interception.handled = false;
      throw error;
    });
  }
  #authenticationHandled = false;
  #handleAuthentication = async () => {
    if (!this.#frame) {
      return;
    }
    const credentials = this.#frame.page()._credentials;
    if (credentials && !this.#authenticationHandled) {
      this.#authenticationHandled = true;
      void this.#request.continueWithAuth({
        action: "provideCredentials",
        credentials: {
          type: "password",
          username: credentials.username,
          password: credentials.password
        }
      });
    } else {
      void this.#request.continueWithAuth({
        action: "cancel"
      });
    }
  };
  timing() {
    return this.#request.timing();
  }
  getResponseContent() {
    return this.#request.getResponseContent();
  }
}
_a = BidiHTTPRequest;
function getBidiHeaders(rawHeaders) {
  const headers = [];
  for (const [name, value] of Object.entries(rawHeaders ?? [])) {
    if (!Object.is(value, void 0)) {
      const values = Array.isArray(value) ? value : [value];
      for (const value2 of values) {
        headers.push({
          name: name.toLowerCase(),
          value: {
            type: "string",
            value: String(value2)
          }
        });
      }
    }
  }
  return headers;
}
/**
 * @license
 * Copyright 2023 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
class UnserializableError extends Error {
}
class BidiSerializer {
  static serialize(arg) {
    switch (typeof arg) {
      case "symbol":
      case "function":
        throw new UnserializableError(`Unable to serializable ${typeof arg}`);
      case "object":
        return this.#serializeObject(arg);
      case "undefined":
        return {
          type: "undefined"
        };
      case "number":
        return this.#serializeNumber(arg);
      case "bigint":
        return {
          type: "bigint",
          value: arg.toString()
        };
      case "string":
        return {
          type: "string",
          value: arg
        };
      case "boolean":
        return {
          type: "boolean",
          value: arg
        };
    }
  }
  static #serializeNumber(arg) {
    let value;
    if (Object.is(arg, -0)) {
      value = "-0";
    } else if (Object.is(arg, Infinity)) {
      value = "Infinity";
    } else if (Object.is(arg, -Infinity)) {
      value = "-Infinity";
    } else if (Object.is(arg, NaN)) {
      value = "NaN";
    } else {
      value = arg;
    }
    return {
      type: "number",
      value
    };
  }
  static #serializeObject(arg) {
    if (arg === null) {
      return {
        type: "null"
      };
    } else if (Array.isArray(arg)) {
      const parsedArray = arg.map((subArg) => {
        return this.serialize(subArg);
      });
      return {
        type: "array",
        value: parsedArray
      };
    } else if (main.isPlainObject(arg)) {
      try {
        JSON.stringify(arg);
      } catch (error) {
        if (error instanceof TypeError && error.message.startsWith("Converting circular structure to JSON")) {
          error.message += " Recursive objects are not allowed.";
        }
        throw error;
      }
      const parsedObject = [];
      for (const key in arg) {
        parsedObject.push([this.serialize(key), this.serialize(arg[key])]);
      }
      return {
        type: "object",
        value: parsedObject
      };
    } else if (main.isRegExp(arg)) {
      return {
        type: "regexp",
        value: {
          pattern: arg.source,
          flags: arg.flags
        }
      };
    } else if (main.isDate(arg)) {
      return {
        type: "date",
        value: arg.toISOString()
      };
    }
    throw new UnserializableError("Custom object serialization not possible. Use plain objects instead.");
  }
}
/**
 * @license
 * Copyright 2023 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
function createEvaluationError(details) {
  if (details.exception.type !== "error") {
    return BidiDeserializer.deserialize(details.exception);
  }
  const [name = "", ...parts] = details.text.split(": ");
  const message = parts.join(": ");
  const error = new Error(message);
  error.name = name;
  const stackLines = [];
  if (details.stackTrace && stackLines.length < Error.stackTraceLimit) {
    for (const frame of details.stackTrace.callFrames.reverse()) {
      if (main.PuppeteerURL.isPuppeteerURL(frame.url) && frame.url !== main.PuppeteerURL.INTERNAL_URL) {
        const url = main.PuppeteerURL.parse(frame.url);
        stackLines.unshift(`    at ${frame.functionName || url.functionName} (${url.functionName} at ${url.siteString}, <anonymous>:${frame.lineNumber}:${frame.columnNumber})`);
      } else {
        stackLines.push(`    at ${frame.functionName || "<anonymous>"} (${frame.url}:${frame.lineNumber}:${frame.columnNumber})`);
      }
      if (stackLines.length >= Error.stackTraceLimit) {
        break;
      }
    }
  }
  error.stack = [details.text, ...stackLines].join("\n");
  return error;
}
function rewriteNavigationError(message, ms) {
  return (error) => {
    if (error instanceof main.ProtocolError) {
      error.message += ` at ${message}`;
    } else if (error instanceof main.TimeoutError) {
      error.message = `Navigation timeout of ${ms} ms exceeded`;
    }
    throw error;
  };
}
var __addDisposableResource$3 = function(env, value, async) {
  if (value !== null && value !== void 0) {
    if (typeof value !== "object" && typeof value !== "function") throw new TypeError("Object expected.");
    var dispose, inner;
    if (async) {
      if (!Symbol.asyncDispose) throw new TypeError("Symbol.asyncDispose is not defined.");
      dispose = value[Symbol.asyncDispose];
    }
    if (dispose === void 0) {
      if (!Symbol.dispose) throw new TypeError("Symbol.dispose is not defined.");
      dispose = value[Symbol.dispose];
      if (async) inner = dispose;
    }
    if (typeof dispose !== "function") throw new TypeError("Object not disposable.");
    if (inner) dispose = function() {
      try {
        inner.call(this);
      } catch (e) {
        return Promise.reject(e);
      }
    };
    env.stack.push({ value, dispose, async });
  } else if (async) {
    env.stack.push({ async: true });
  }
  return value;
};
var __disposeResources$3 = /* @__PURE__ */ function(SuppressedError2) {
  return function(env) {
    function fail(e) {
      env.error = env.hasError ? new SuppressedError2(e, env.error, "An error was suppressed during disposal.") : e;
      env.hasError = true;
    }
    var r, s = 0;
    function next() {
      while (r = env.stack.pop()) {
        try {
          if (!r.async && s === 1) return s = 0, env.stack.push(r), Promise.resolve().then(next);
          if (r.dispose) {
            var result = r.dispose.call(r.value);
            if (r.async) return s |= 2, Promise.resolve(result).then(next, function(e) {
              fail(e);
              return next();
            });
          } else s |= 1;
        } catch (e) {
          fail(e);
        }
      }
      if (s === 1) return env.hasError ? Promise.reject(env.error) : Promise.resolve();
      if (env.hasError) throw env.error;
    }
    return next();
  };
}(typeof SuppressedError === "function" ? SuppressedError : function(error, suppressed, message) {
  var e = new Error(message);
  return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
});
class BidiRealm extends main.Realm {
  realm;
  constructor(realm, timeoutSettings) {
    super(timeoutSettings);
    this.realm = realm;
  }
  initialize() {
    this.realm.on("destroyed", ({ reason }) => {
      this.taskManager.terminateAll(new Error(reason));
      this.dispose();
    });
    this.realm.on("updated", () => {
      this.internalPuppeteerUtil = void 0;
      void this.taskManager.rerunAll();
    });
  }
  internalPuppeteerUtil;
  get puppeteerUtil() {
    const promise = Promise.resolve();
    main.scriptInjector.inject((script) => {
      if (this.internalPuppeteerUtil) {
        void this.internalPuppeteerUtil.then((handle) => {
          void handle.dispose();
        });
      }
      this.internalPuppeteerUtil = promise.then(() => {
        return this.evaluateHandle(script);
      });
    }, !this.internalPuppeteerUtil);
    return this.internalPuppeteerUtil;
  }
  async evaluateHandle(pageFunction, ...args) {
    return await this.#evaluate(false, pageFunction, ...args);
  }
  async evaluate(pageFunction, ...args) {
    return await this.#evaluate(true, pageFunction, ...args);
  }
  async #evaluate(returnByValue, pageFunction, ...args) {
    const sourceUrlComment = main.getSourceUrlComment(main.getSourcePuppeteerURLIfAvailable(pageFunction)?.toString() ?? main.PuppeteerURL.INTERNAL_URL);
    let responsePromise;
    const resultOwnership = returnByValue ? "none" : "root";
    const serializationOptions = returnByValue ? {} : {
      maxObjectDepth: 0,
      maxDomDepth: 0
    };
    if (main.isString(pageFunction)) {
      const expression = main.SOURCE_URL_REGEX.test(pageFunction) ? pageFunction : `${pageFunction}
${sourceUrlComment}
`;
      responsePromise = this.realm.evaluate(expression, true, {
        resultOwnership,
        userActivation: true,
        serializationOptions
      });
    } else {
      let functionDeclaration = main.stringifyFunction(pageFunction);
      functionDeclaration = main.SOURCE_URL_REGEX.test(functionDeclaration) ? functionDeclaration : `${functionDeclaration}
${sourceUrlComment}
`;
      responsePromise = this.realm.callFunction(
        functionDeclaration,
        /* awaitPromise= */
        true,
        {
          // LazyArgs are used only internally and should not affect the order
          // evaluate calls for the public APIs.
          arguments: args.some((arg) => {
            return arg instanceof main.LazyArg;
          }) ? await Promise.all(args.map((arg) => {
            return this.serializeAsync(arg);
          })) : args.map((arg) => {
            return this.serialize(arg);
          }),
          resultOwnership,
          userActivation: true,
          serializationOptions
        }
      );
    }
    const result = await responsePromise;
    if ("type" in result && result.type === "exception") {
      throw createEvaluationError(result.exceptionDetails);
    }
    if (returnByValue) {
      return BidiDeserializer.deserialize(result.result);
    }
    return this.createHandle(result.result);
  }
  createHandle(result) {
    if ((result.type === "node" || result.type === "window") && this instanceof BidiFrameRealm) {
      return BidiElementHandle.from(result, this);
    }
    return BidiJSHandle.from(result, this);
  }
  async serializeAsync(arg) {
    if (arg instanceof main.LazyArg) {
      arg = await arg.get(this);
    }
    return this.serialize(arg);
  }
  serialize(arg) {
    if (arg instanceof BidiJSHandle || arg instanceof BidiElementHandle) {
      if (arg.realm !== this) {
        if (!(arg.realm instanceof BidiFrameRealm) || !(this instanceof BidiFrameRealm)) {
          throw new Error("Trying to evaluate JSHandle from different global types. Usually this means you're using a handle from a worker in a page or vice versa.");
        }
        if (arg.realm.environment !== this.environment) {
          throw new Error("Trying to evaluate JSHandle from different frames. Usually this means you're using a handle from a page on a different page.");
        }
      }
      if (arg.disposed) {
        throw new Error("JSHandle is disposed!");
      }
      return arg.remoteValue();
    }
    return BidiSerializer.serialize(arg);
  }
  async destroyHandles(handles) {
    if (this.disposed) {
      return;
    }
    const handleIds = handles.map(({ id }) => {
      return id;
    }).filter((id) => {
      return id !== void 0;
    });
    if (handleIds.length === 0) {
      return;
    }
    await this.realm.disown(handleIds).catch((error) => {
      main.debugError(error);
    });
  }
  async adoptHandle(handle) {
    return await this.evaluateHandle((node) => {
      return node;
    }, handle);
  }
  async transferHandle(handle) {
    if (handle.realm === this) {
      return handle;
    }
    const transferredHandle = this.adoptHandle(handle);
    await handle.dispose();
    return await transferredHandle;
  }
}
class BidiFrameRealm extends BidiRealm {
  static from(realm, frame) {
    const frameRealm = new BidiFrameRealm(realm, frame);
    frameRealm.#initialize();
    return frameRealm;
  }
  #frame;
  constructor(realm, frame) {
    super(realm, frame.timeoutSettings);
    this.#frame = frame;
  }
  #initialize() {
    super.initialize();
    this.realm.on("updated", () => {
      this.environment.clearDocumentHandle();
      this.#bindingsInstalled = false;
    });
  }
  #bindingsInstalled = false;
  get puppeteerUtil() {
    let promise = Promise.resolve();
    if (!this.#bindingsInstalled) {
      promise = Promise.all([
        ExposableFunction.from(this.environment, "__ariaQuerySelector", main.ARIAQueryHandler.queryOne, !!this.sandbox),
        ExposableFunction.from(this.environment, "__ariaQuerySelectorAll", async (element, selector) => {
          const results = main.ARIAQueryHandler.queryAll(element, selector);
          return await element.realm.evaluateHandle((...elements) => {
            return elements;
          }, ...await main.AsyncIterableUtil.collect(results));
        }, !!this.sandbox)
      ]);
      this.#bindingsInstalled = true;
    }
    return promise.then(() => {
      return super.puppeteerUtil;
    });
  }
  get sandbox() {
    return this.realm.sandbox;
  }
  get environment() {
    return this.#frame;
  }
  async adoptBackendNode(backendNodeId) {
    const env_1 = { stack: [], error: void 0, hasError: false };
    try {
      const { object } = await this.#frame.client.send("DOM.resolveNode", {
        backendNodeId,
        executionContextId: await this.realm.resolveExecutionContextId()
      });
      const handle = __addDisposableResource$3(env_1, BidiElementHandle.from({
        handle: object.objectId,
        type: "node"
      }, this), false);
      return await handle.evaluateHandle((element) => {
        return element;
      });
    } catch (e_1) {
      env_1.error = e_1;
      env_1.hasError = true;
    } finally {
      __disposeResources$3(env_1);
    }
  }
}
class BidiWorkerRealm extends BidiRealm {
  static from(realm, worker) {
    const workerRealm = new BidiWorkerRealm(realm, worker);
    workerRealm.initialize();
    return workerRealm;
  }
  #worker;
  constructor(realm, frame) {
    super(realm, frame.timeoutSettings);
    this.#worker = frame;
  }
  get environment() {
    return this.#worker;
  }
  async adoptBackendNode() {
    throw new Error("Cannot adopt DOM nodes into a worker.");
  }
}
/**
 * @license
 * Copyright 2024 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
class BidiWebWorker extends main.WebWorker {
  static from(frame, realm) {
    const worker = new BidiWebWorker(frame, realm);
    return worker;
  }
  #frame;
  #realm;
  constructor(frame, realm) {
    super(realm.origin);
    this.#frame = frame;
    this.#realm = BidiWorkerRealm.from(realm, this);
  }
  get frame() {
    return this.#frame;
  }
  mainRealm() {
    return this.#realm;
  }
  get client() {
    throw new main.UnsupportedOperation();
  }
}
/**
 * @license
 * Copyright 2023 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
var __runInitializers$5 = function(thisArg, initializers, value) {
  var useValue = arguments.length > 2;
  for (var i = 0; i < initializers.length; i++) {
    value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
  }
  return useValue ? value : void 0;
};
var __esDecorate$5 = function(ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
  function accept(f) {
    if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected");
    return f;
  }
  var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
  var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
  var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
  var _, done = false;
  for (var i = decorators.length - 1; i >= 0; i--) {
    var context = {};
    for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
    for (var p in contextIn.access) context.access[p] = contextIn.access[p];
    context.addInitializer = function(f) {
      if (done) throw new TypeError("Cannot add initializers after decoration has completed");
      extraInitializers.push(accept(f || null));
    };
    var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
    if (kind === "accessor") {
      if (result === void 0) continue;
      if (result === null || typeof result !== "object") throw new TypeError("Object expected");
      if (_ = accept(result.get)) descriptor.get = _;
      if (_ = accept(result.set)) descriptor.set = _;
      if (_ = accept(result.init)) initializers.unshift(_);
    } else if (_ = accept(result)) {
      if (kind === "field") initializers.unshift(_);
      else descriptor[key] = _;
    }
  }
  if (target) Object.defineProperty(target, contextIn.name, descriptor);
  done = true;
};
var __setFunctionName$1 = function(f, name, prefix) {
  if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
  return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
function convertConsoleMessageLevel(method) {
  switch (method) {
    case "group":
      return "startGroup";
    case "groupCollapsed":
      return "startGroupCollapsed";
    case "groupEnd":
      return "endGroup";
    default:
      return method;
  }
}
let BidiFrame = (() => {
  var _parent, _frames, _BidiFrame_instances, initialize_fn, createFrameTarget_fn, detached$_fn, _exposedFunctions, waitForLoad$_get, waitForNetworkIdle$_get, _a2;
  let _classSuper = main.Frame;
  let _instanceExtraInitializers = [];
  let _goto_decorators;
  let _setContent_decorators;
  let _waitForNavigation_decorators;
  let _private_waitForLoad$_decorators;
  let _private_waitForLoad$_descriptor;
  let _private_waitForNetworkIdle$_decorators;
  let _private_waitForNetworkIdle$_descriptor;
  let _setFiles_decorators;
  let _locateNodes_decorators;
  return _a2 = class extends _classSuper {
    constructor(parent, browsingContext) {
      super();
      __privateAdd(this, _BidiFrame_instances);
      __privateAdd(this, _parent, __runInitializers$5(this, _instanceExtraInitializers));
      __publicField(this, "browsingContext");
      __privateAdd(this, _frames, /* @__PURE__ */ new WeakMap());
      __publicField(this, "realms");
      __publicField(this, "_id");
      __publicField(this, "client");
      __publicField(this, "accessibility");
      __privateAdd(this, _exposedFunctions, /* @__PURE__ */ new Map());
      __privateSet(this, _parent, parent);
      this.browsingContext = browsingContext;
      this._id = browsingContext.id;
      this.client = new BidiCdpSession(this);
      this.realms = {
        default: BidiFrameRealm.from(this.browsingContext.defaultRealm, this),
        internal: BidiFrameRealm.from(this.browsingContext.createWindowRealm(`__puppeteer_internal_${Math.ceil(Math.random() * 1e4)}`), this)
      };
      this.accessibility = new main.Accessibility(this.realms.default, this._id);
    }
    static from(parent, browsingContext) {
      var _a3;
      const frame = new _a2(parent, browsingContext);
      __privateMethod(_a3 = frame, _BidiFrame_instances, initialize_fn).call(_a3);
      return frame;
    }
    get timeoutSettings() {
      return this.page()._timeoutSettings;
    }
    mainRealm() {
      return this.realms.default;
    }
    isolatedRealm() {
      return this.realms.internal;
    }
    realm(id) {
      for (const realm of Object.values(this.realms)) {
        if (realm.realm.id === id) {
          return realm;
        }
      }
      return;
    }
    page() {
      let parent = __privateGet(this, _parent);
      while (parent instanceof _a2) {
        parent = __privateGet(parent, _parent);
      }
      return parent;
    }
    url() {
      return this.browsingContext.url;
    }
    parentFrame() {
      if (__privateGet(this, _parent) instanceof _a2) {
        return __privateGet(this, _parent);
      }
      return null;
    }
    childFrames() {
      return [...this.browsingContext.children].map((child) => {
        return __privateGet(this, _frames).get(child);
      });
    }
    async goto(url, options = {}) {
      const [response] = await Promise.all([
        this.waitForNavigation(options),
        // Some implementations currently only report errors when the
        // readiness=interactive.
        //
        // Related: https://bugzilla.mozilla.org/show_bug.cgi?id=1846601
        this.browsingContext.navigate(
          url,
          "interactive"
          /* Bidi.BrowsingContext.ReadinessState.Interactive */
        ).catch((error) => {
          if (main.isErrorLike(error) && error.message.includes("net::ERR_HTTP_RESPONSE_CODE_FAILURE")) {
            return;
          }
          if (error.message.includes("navigation canceled")) {
            return;
          }
          if (error.message.includes("Navigation was aborted by another navigation")) {
            return;
          }
          throw error;
        })
      ]).catch(rewriteNavigationError(url, options.timeout ?? this.timeoutSettings.navigationTimeout()));
      return response;
    }
    async setContent(html, options = {}) {
      await Promise.all([
        this.setFrameContent(html),
        main.firstValueFrom(main.combineLatest([
          __privateGet(this, _BidiFrame_instances, waitForLoad$_get).call(this, options),
          __privateGet(this, _BidiFrame_instances, waitForNetworkIdle$_get).call(this, options)
        ]))
      ]);
    }
    async waitForNavigation(options = {}) {
      const { timeout: ms = this.timeoutSettings.navigationTimeout(), signal } = options;
      const frames = this.childFrames().map((frame) => {
        var _a3;
        return __privateMethod(_a3 = frame, _BidiFrame_instances, detached$_fn).call(_a3);
      });
      return await main.firstValueFrom(main.combineLatest([
        main.race(main.fromEmitterEvent(this.browsingContext, "navigation"), main.fromEmitterEvent(this.browsingContext, "historyUpdated").pipe(main.map(() => {
          return { navigation: null };
        }))).pipe(main.first()).pipe(main.switchMap(({ navigation }) => {
          if (navigation === null) {
            return main.of(null);
          }
          return __privateGet(this, _BidiFrame_instances, waitForLoad$_get).call(this, options).pipe(main.delayWhen(() => {
            if (frames.length === 0) {
              return main.of(void 0);
            }
            return main.combineLatest(frames);
          }), main.raceWith(main.fromEmitterEvent(navigation, "fragment"), main.fromEmitterEvent(navigation, "failed"), main.fromEmitterEvent(navigation, "aborted")), main.switchMap(() => {
            if (navigation.request) {
              let requestFinished$ = function(request) {
                if (navigation === null) {
                  return main.of(null);
                }
                if (request.response || request.error) {
                  return main.of(navigation);
                }
                if (request.redirect) {
                  return requestFinished$(request.redirect);
                }
                return main.fromEmitterEvent(request, "success").pipe(main.raceWith(main.fromEmitterEvent(request, "error")), main.raceWith(main.fromEmitterEvent(request, "redirect"))).pipe(main.switchMap(() => {
                  return requestFinished$(request);
                }));
              };
              return requestFinished$(navigation.request);
            }
            return main.of(navigation);
          }));
        })),
        __privateGet(this, _BidiFrame_instances, waitForNetworkIdle$_get).call(this, options)
      ]).pipe(main.map(([navigation]) => {
        if (!navigation) {
          return null;
        }
        const request = navigation.request;
        if (!request) {
          return null;
        }
        const lastRequest = request.lastRedirect ?? request;
        const httpRequest = requests.get(lastRequest);
        return httpRequest.response();
      }), main.raceWith(main.timeout(ms), main.fromAbortSignal(signal), __privateMethod(this, _BidiFrame_instances, detached$_fn).call(this).pipe(main.map(() => {
        throw new main.TargetCloseError("Frame detached.");
      })))));
    }
    waitForDevicePrompt() {
      throw new main.UnsupportedOperation();
    }
    get detached() {
      return this.browsingContext.closed;
    }
    async exposeFunction(name, apply) {
      if (__privateGet(this, _exposedFunctions).has(name)) {
        throw new Error(`Failed to add page binding with name ${name}: globalThis['${name}'] already exists!`);
      }
      const exposable = await ExposableFunction.from(this, name, apply);
      __privateGet(this, _exposedFunctions).set(name, exposable);
    }
    async removeExposedFunction(name) {
      const exposedFunction = __privateGet(this, _exposedFunctions).get(name);
      if (!exposedFunction) {
        throw new Error(`Failed to remove page binding with name ${name}: window['${name}'] does not exists!`);
      }
      __privateGet(this, _exposedFunctions).delete(name);
      await exposedFunction[Symbol.asyncDispose]();
    }
    async createCDPSession() {
      if (!this.page().browser().cdpSupported) {
        throw new main.UnsupportedOperation();
      }
      const cdpConnection = this.page().browser().cdpConnection;
      return await cdpConnection._createSession({ targetId: this._id });
    }
    async setFiles(element, files) {
      await this.browsingContext.setFiles(
        // SAFETY: ElementHandles are always remote references.
        element.remoteValue(),
        files
      );
    }
    async locateNodes(element, locator) {
      return await this.browsingContext.locateNodes(
        locator,
        // SAFETY: ElementHandles are always remote references.
        [element.remoteValue()]
      );
    }
  }, _parent = new WeakMap(), _frames = new WeakMap(), _BidiFrame_instances = new WeakSet(), initialize_fn = function() {
    for (const browsingContext of this.browsingContext.children) {
      __privateMethod(this, _BidiFrame_instances, createFrameTarget_fn).call(this, browsingContext);
    }
    this.browsingContext.on("browsingcontext", ({ browsingContext }) => {
      __privateMethod(this, _BidiFrame_instances, createFrameTarget_fn).call(this, browsingContext);
    });
    this.browsingContext.on("closed", () => {
      for (const session of BidiCdpSession.sessions.values()) {
        if (session.frame === this) {
          session.onClose();
        }
      }
      this.page().trustedEmitter.emit("framedetached", this);
    });
    this.browsingContext.on("request", ({ request }) => {
      const httpRequest = BidiHTTPRequest.from(request, this);
      request.once("success", () => {
        this.page().trustedEmitter.emit("requestfinished", httpRequest);
      });
      request.once("error", () => {
        this.page().trustedEmitter.emit("requestfailed", httpRequest);
      });
      void httpRequest.finalizeInterceptions();
    });
    this.browsingContext.on("navigation", ({ navigation }) => {
      navigation.once("fragment", () => {
        this.page().trustedEmitter.emit("framenavigated", this);
      });
    });
    this.browsingContext.on("load", () => {
      this.page().trustedEmitter.emit("load", void 0);
    });
    this.browsingContext.on("DOMContentLoaded", () => {
      this._hasStartedLoading = true;
      this.page().trustedEmitter.emit("domcontentloaded", void 0);
      this.page().trustedEmitter.emit("framenavigated", this);
    });
    this.browsingContext.on("userprompt", ({ userPrompt }) => {
      this.page().trustedEmitter.emit("dialog", BidiDialog.from(userPrompt));
    });
    this.browsingContext.on("log", ({ entry }) => {
      if (this._id !== entry.source.context) {
        return;
      }
      if (isConsoleLogEntry(entry)) {
        const args = entry.args.map((arg) => {
          return this.mainRealm().createHandle(arg);
        });
        const text = args.reduce((value, arg) => {
          const parsedValue = arg instanceof BidiJSHandle && arg.isPrimitiveValue ? BidiDeserializer.deserialize(arg.remoteValue()) : arg.toString();
          return `${value} ${parsedValue}`;
        }, "").slice(1);
        this.page().trustedEmitter.emit("console", new main.ConsoleMessage(convertConsoleMessageLevel(entry.method), text, args, getStackTraceLocations(entry.stackTrace), this));
      } else if (isJavaScriptLogEntry(entry)) {
        const error = new Error(entry.text ?? "");
        const messageHeight = error.message.split("\n").length;
        const messageLines = error.stack.split("\n").splice(0, messageHeight);
        const stackLines = [];
        if (entry.stackTrace) {
          for (const frame of entry.stackTrace.callFrames) {
            stackLines.push(`    at ${frame.functionName || "<anonymous>"} (${frame.url}:${frame.lineNumber + 1}:${frame.columnNumber + 1})`);
            if (stackLines.length >= Error.stackTraceLimit) {
              break;
            }
          }
        }
        error.stack = [...messageLines, ...stackLines].join("\n");
        this.page().trustedEmitter.emit("pageerror", error);
      } else {
        main.debugError(`Unhandled LogEntry with type "${entry.type}", text "${entry.text}" and level "${entry.level}"`);
      }
    });
    this.browsingContext.on("worker", ({ realm }) => {
      const worker = BidiWebWorker.from(this, realm);
      realm.on("destroyed", () => {
        this.page().trustedEmitter.emit("workerdestroyed", worker);
      });
      this.page().trustedEmitter.emit("workercreated", worker);
    });
  }, createFrameTarget_fn = function(browsingContext) {
    const frame = _a2.from(this, browsingContext);
    __privateGet(this, _frames).set(browsingContext, frame);
    this.page().trustedEmitter.emit("frameattached", frame);
    browsingContext.on("closed", () => {
      __privateGet(this, _frames).delete(browsingContext);
    });
    return frame;
  }, detached$_fn = function() {
    return main.defer(() => {
      if (this.detached) {
        return main.of(this);
      }
      return main.fromEmitterEvent(
        this.page().trustedEmitter,
        "framedetached"
        /* PageEvent.FrameDetached */
      ).pipe(main.filter((detachedFrame) => {
        return detachedFrame === this;
      }));
    });
  }, _exposedFunctions = new WeakMap(), waitForLoad$_get = function() {
    return _private_waitForLoad$_descriptor.value;
  }, waitForNetworkIdle$_get = function() {
    return _private_waitForNetworkIdle$_descriptor.value;
  }, (() => {
    const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
    _goto_decorators = [main.throwIfDetached];
    _setContent_decorators = [main.throwIfDetached];
    _waitForNavigation_decorators = [main.throwIfDetached];
    _private_waitForLoad$_decorators = [main.throwIfDetached];
    _private_waitForNetworkIdle$_decorators = [main.throwIfDetached];
    _setFiles_decorators = [main.throwIfDetached];
    _locateNodes_decorators = [main.throwIfDetached];
    __esDecorate$5(_a2, null, _goto_decorators, { kind: "method", name: "goto", static: false, private: false, access: { has: (obj) => "goto" in obj, get: (obj) => obj.goto }, metadata: _metadata }, null, _instanceExtraInitializers);
    __esDecorate$5(_a2, null, _setContent_decorators, { kind: "method", name: "setContent", static: false, private: false, access: { has: (obj) => "setContent" in obj, get: (obj) => obj.setContent }, metadata: _metadata }, null, _instanceExtraInitializers);
    __esDecorate$5(_a2, null, _waitForNavigation_decorators, { kind: "method", name: "waitForNavigation", static: false, private: false, access: { has: (obj) => "waitForNavigation" in obj, get: (obj) => obj.waitForNavigation }, metadata: _metadata }, null, _instanceExtraInitializers);
    __esDecorate$5(_a2, _private_waitForLoad$_descriptor = { value: __setFunctionName$1(function(options = {}) {
      let { waitUntil = "load" } = options;
      const { timeout: ms = this.timeoutSettings.navigationTimeout() } = options;
      if (!Array.isArray(waitUntil)) {
        waitUntil = [waitUntil];
      }
      const events2 = /* @__PURE__ */ new Set();
      for (const lifecycleEvent of waitUntil) {
        switch (lifecycleEvent) {
          case "load": {
            events2.add("load");
            break;
          }
          case "domcontentloaded": {
            events2.add("DOMContentLoaded");
            break;
          }
        }
      }
      if (events2.size === 0) {
        return main.of(void 0);
      }
      return main.combineLatest([...events2].map((event) => {
        return main.fromEmitterEvent(this.browsingContext, event);
      })).pipe(main.map(() => {
      }), main.first(), main.raceWith(main.timeout(ms), __privateMethod(this, _BidiFrame_instances, detached$_fn).call(this).pipe(main.map(() => {
        throw new Error("Frame detached.");
      }))));
    }, "#waitForLoad$") }, _private_waitForLoad$_decorators, { kind: "method", name: "#waitForLoad$", static: false, private: true, access: { has: (obj) => __privateIn(_BidiFrame_instances, obj), get: (obj) => __privateGet(obj, _BidiFrame_instances, waitForLoad$_get) }, metadata: _metadata }, null, _instanceExtraInitializers);
    __esDecorate$5(_a2, _private_waitForNetworkIdle$_descriptor = { value: __setFunctionName$1(function(options = {}) {
      let { waitUntil = "load" } = options;
      if (!Array.isArray(waitUntil)) {
        waitUntil = [waitUntil];
      }
      let concurrency = Infinity;
      for (const event of waitUntil) {
        switch (event) {
          case "networkidle0": {
            concurrency = Math.min(0, concurrency);
            break;
          }
          case "networkidle2": {
            concurrency = Math.min(2, concurrency);
            break;
          }
        }
      }
      if (concurrency === Infinity) {
        return main.of(void 0);
      }
      return this.page().waitForNetworkIdle$({
        idleTime: 500,
        timeout: options.timeout ?? this.timeoutSettings.timeout(),
        concurrency
      });
    }, "#waitForNetworkIdle$") }, _private_waitForNetworkIdle$_decorators, { kind: "method", name: "#waitForNetworkIdle$", static: false, private: true, access: { has: (obj) => __privateIn(_BidiFrame_instances, obj), get: (obj) => __privateGet(obj, _BidiFrame_instances, waitForNetworkIdle$_get) }, metadata: _metadata }, null, _instanceExtraInitializers);
    __esDecorate$5(_a2, null, _setFiles_decorators, { kind: "method", name: "setFiles", static: false, private: false, access: { has: (obj) => "setFiles" in obj, get: (obj) => obj.setFiles }, metadata: _metadata }, null, _instanceExtraInitializers);
    __esDecorate$5(_a2, null, _locateNodes_decorators, { kind: "method", name: "locateNodes", static: false, private: false, access: { has: (obj) => "locateNodes" in obj, get: (obj) => obj.locateNodes }, metadata: _metadata }, null, _instanceExtraInitializers);
    if (_metadata) Object.defineProperty(_a2, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
  })(), _a2;
})();
function isConsoleLogEntry(event) {
  return event.type === "console";
}
function isJavaScriptLogEntry(event) {
  return event.type === "javascript";
}
function getStackTraceLocations(stackTrace) {
  const stackTraceLocations = [];
  if (stackTrace) {
    for (const callFrame of stackTrace.callFrames) {
      stackTraceLocations.push({
        url: callFrame.url,
        lineNumber: callFrame.lineNumber,
        columnNumber: callFrame.columnNumber
      });
    }
  }
  return stackTraceLocations;
}
/**
 * @license
 * Copyright 2017 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
var SourceActionsType;
(function(SourceActionsType2) {
  SourceActionsType2["None"] = "none";
  SourceActionsType2["Key"] = "key";
  SourceActionsType2["Pointer"] = "pointer";
  SourceActionsType2["Wheel"] = "wheel";
})(SourceActionsType || (SourceActionsType = {}));
var ActionType;
(function(ActionType2) {
  ActionType2["Pause"] = "pause";
  ActionType2["KeyDown"] = "keyDown";
  ActionType2["KeyUp"] = "keyUp";
  ActionType2["PointerUp"] = "pointerUp";
  ActionType2["PointerDown"] = "pointerDown";
  ActionType2["PointerMove"] = "pointerMove";
  ActionType2["Scroll"] = "scroll";
})(ActionType || (ActionType = {}));
const getBidiKeyValue = (key) => {
  switch (key) {
    case "\r":
    case "\n":
      key = "Enter";
      break;
  }
  if ([...key].length === 1) {
    return key;
  }
  switch (key) {
    case "Cancel":
      return "";
    case "Help":
      return "";
    case "Backspace":
      return "";
    case "Tab":
      return "";
    case "Clear":
      return "";
    case "Enter":
      return "";
    case "Shift":
    case "ShiftLeft":
      return "";
    case "Control":
    case "ControlLeft":
      return "";
    case "Alt":
    case "AltLeft":
      return "";
    case "Pause":
      return "";
    case "Escape":
      return "";
    case "PageUp":
      return "";
    case "PageDown":
      return "";
    case "End":
      return "";
    case "Home":
      return "";
    case "ArrowLeft":
      return "";
    case "ArrowUp":
      return "";
    case "ArrowRight":
      return "";
    case "ArrowDown":
      return "";
    case "Insert":
      return "";
    case "Delete":
      return "";
    case "NumpadEqual":
      return "";
    case "Numpad0":
      return "";
    case "Numpad1":
      return "";
    case "Numpad2":
      return "";
    case "Numpad3":
      return "";
    case "Numpad4":
      return "";
    case "Numpad5":
      return "";
    case "Numpad6":
      return "";
    case "Numpad7":
      return "";
    case "Numpad8":
      return "";
    case "Numpad9":
      return "";
    case "NumpadMultiply":
      return "";
    case "NumpadAdd":
      return "";
    case "NumpadSubtract":
      return "";
    case "NumpadDecimal":
      return "";
    case "NumpadDivide":
      return "";
    case "F1":
      return "";
    case "F2":
      return "";
    case "F3":
      return "";
    case "F4":
      return "";
    case "F5":
      return "";
    case "F6":
      return "";
    case "F7":
      return "";
    case "F8":
      return "";
    case "F9":
      return "";
    case "F10":
      return "";
    case "F11":
      return "";
    case "F12":
      return "";
    case "Meta":
    case "MetaLeft":
      return "";
    case "ShiftRight":
      return "";
    case "ControlRight":
      return "";
    case "AltRight":
      return "";
    case "MetaRight":
      return "";
    case "Digit0":
      return "0";
    case "Digit1":
      return "1";
    case "Digit2":
      return "2";
    case "Digit3":
      return "3";
    case "Digit4":
      return "4";
    case "Digit5":
      return "5";
    case "Digit6":
      return "6";
    case "Digit7":
      return "7";
    case "Digit8":
      return "8";
    case "Digit9":
      return "9";
    case "KeyA":
      return "a";
    case "KeyB":
      return "b";
    case "KeyC":
      return "c";
    case "KeyD":
      return "d";
    case "KeyE":
      return "e";
    case "KeyF":
      return "f";
    case "KeyG":
      return "g";
    case "KeyH":
      return "h";
    case "KeyI":
      return "i";
    case "KeyJ":
      return "j";
    case "KeyK":
      return "k";
    case "KeyL":
      return "l";
    case "KeyM":
      return "m";
    case "KeyN":
      return "n";
    case "KeyO":
      return "o";
    case "KeyP":
      return "p";
    case "KeyQ":
      return "q";
    case "KeyR":
      return "r";
    case "KeyS":
      return "s";
    case "KeyT":
      return "t";
    case "KeyU":
      return "u";
    case "KeyV":
      return "v";
    case "KeyW":
      return "w";
    case "KeyX":
      return "x";
    case "KeyY":
      return "y";
    case "KeyZ":
      return "z";
    case "Semicolon":
      return ";";
    case "Equal":
      return "=";
    case "Comma":
      return ",";
    case "Minus":
      return "-";
    case "Period":
      return ".";
    case "Slash":
      return "/";
    case "Backquote":
      return "`";
    case "BracketLeft":
      return "[";
    case "Backslash":
      return "\\";
    case "BracketRight":
      return "]";
    case "Quote":
      return '"';
    default:
      throw new Error(`Unknown key: "${key}"`);
  }
};
class BidiKeyboard extends main.Keyboard {
  #page;
  constructor(page) {
    super();
    this.#page = page;
  }
  async down(key, _options) {
    await this.#page.mainFrame().browsingContext.performActions([
      {
        type: SourceActionsType.Key,
        id: "__puppeteer_keyboard",
        actions: [
          {
            type: ActionType.KeyDown,
            value: getBidiKeyValue(key)
          }
        ]
      }
    ]);
  }
  async up(key) {
    await this.#page.mainFrame().browsingContext.performActions([
      {
        type: SourceActionsType.Key,
        id: "__puppeteer_keyboard",
        actions: [
          {
            type: ActionType.KeyUp,
            value: getBidiKeyValue(key)
          }
        ]
      }
    ]);
  }
  async press(key, options = {}) {
    const { delay = 0 } = options;
    const actions = [
      {
        type: ActionType.KeyDown,
        value: getBidiKeyValue(key)
      }
    ];
    if (delay > 0) {
      actions.push({
        type: ActionType.Pause,
        duration: delay
      });
    }
    actions.push({
      type: ActionType.KeyUp,
      value: getBidiKeyValue(key)
    });
    await this.#page.mainFrame().browsingContext.performActions([
      {
        type: SourceActionsType.Key,
        id: "__puppeteer_keyboard",
        actions
      }
    ]);
  }
  async type(text, options = {}) {
    const { delay = 0 } = options;
    const values = [...text].map(getBidiKeyValue);
    const actions = [];
    if (delay <= 0) {
      for (const value of values) {
        actions.push({
          type: ActionType.KeyDown,
          value
        }, {
          type: ActionType.KeyUp,
          value
        });
      }
    } else {
      for (const value of values) {
        actions.push({
          type: ActionType.KeyDown,
          value
        }, {
          type: ActionType.Pause,
          duration: delay
        }, {
          type: ActionType.KeyUp,
          value
        });
      }
    }
    await this.#page.mainFrame().browsingContext.performActions([
      {
        type: SourceActionsType.Key,
        id: "__puppeteer_keyboard",
        actions
      }
    ]);
  }
  async sendCharacter(char) {
    if ([...char].length > 1) {
      throw new Error("Cannot send more than 1 character.");
    }
    const frame = await this.#page.focusedFrame();
    await frame.isolatedRealm().evaluate(async (char2) => {
      document.execCommand("insertText", false, char2);
    }, char);
  }
}
const getBidiButton = (button) => {
  switch (button) {
    case main.MouseButton.Left:
      return 0;
    case main.MouseButton.Middle:
      return 1;
    case main.MouseButton.Right:
      return 2;
    case main.MouseButton.Back:
      return 3;
    case main.MouseButton.Forward:
      return 4;
  }
};
class BidiMouse extends main.Mouse {
  #page;
  #lastMovePoint = { x: 0, y: 0 };
  constructor(page) {
    super();
    this.#page = page;
  }
  async reset() {
    this.#lastMovePoint = { x: 0, y: 0 };
    await this.#page.mainFrame().browsingContext.releaseActions();
  }
  async move(x, y, options = {}) {
    const from = this.#lastMovePoint;
    const to = {
      x: Math.round(x),
      y: Math.round(y)
    };
    const actions = [];
    const steps = options.steps ?? 0;
    for (let i = 0; i < steps; ++i) {
      actions.push({
        type: ActionType.PointerMove,
        x: from.x + (to.x - from.x) * (i / steps),
        y: from.y + (to.y - from.y) * (i / steps),
        origin: options.origin
      });
    }
    actions.push({
      type: ActionType.PointerMove,
      ...to,
      origin: options.origin
    });
    this.#lastMovePoint = to;
    await this.#page.mainFrame().browsingContext.performActions([
      {
        type: SourceActionsType.Pointer,
        id: "__puppeteer_mouse",
        actions
      }
    ]);
  }
  async down(options = {}) {
    await this.#page.mainFrame().browsingContext.performActions([
      {
        type: SourceActionsType.Pointer,
        id: "__puppeteer_mouse",
        actions: [
          {
            type: ActionType.PointerDown,
            button: getBidiButton(options.button ?? main.MouseButton.Left)
          }
        ]
      }
    ]);
  }
  async up(options = {}) {
    await this.#page.mainFrame().browsingContext.performActions([
      {
        type: SourceActionsType.Pointer,
        id: "__puppeteer_mouse",
        actions: [
          {
            type: ActionType.PointerUp,
            button: getBidiButton(options.button ?? main.MouseButton.Left)
          }
        ]
      }
    ]);
  }
  async click(x, y, options = {}) {
    const actions = [
      {
        type: ActionType.PointerMove,
        x: Math.round(x),
        y: Math.round(y),
        origin: options.origin
      }
    ];
    const pointerDownAction = {
      type: ActionType.PointerDown,
      button: getBidiButton(options.button ?? main.MouseButton.Left)
    };
    const pointerUpAction = {
      type: ActionType.PointerUp,
      button: pointerDownAction.button
    };
    for (let i = 1; i < (options.count ?? 1); ++i) {
      actions.push(pointerDownAction, pointerUpAction);
    }
    actions.push(pointerDownAction);
    if (options.delay) {
      actions.push({
        type: ActionType.Pause,
        duration: options.delay
      });
    }
    actions.push(pointerUpAction);
    await this.#page.mainFrame().browsingContext.performActions([
      {
        type: SourceActionsType.Pointer,
        id: "__puppeteer_mouse",
        actions
      }
    ]);
  }
  async wheel(options = {}) {
    await this.#page.mainFrame().browsingContext.performActions([
      {
        type: SourceActionsType.Wheel,
        id: "__puppeteer_wheel",
        actions: [
          {
            type: ActionType.Scroll,
            ...this.#lastMovePoint ?? {
              x: 0,
              y: 0
            },
            deltaX: options.deltaX ?? 0,
            deltaY: options.deltaY ?? 0
          }
        ]
      }
    ]);
  }
  drag() {
    throw new main.UnsupportedOperation();
  }
  dragOver() {
    throw new main.UnsupportedOperation();
  }
  dragEnter() {
    throw new main.UnsupportedOperation();
  }
  drop() {
    throw new main.UnsupportedOperation();
  }
  dragAndDrop() {
    throw new main.UnsupportedOperation();
  }
}
class BidiTouchHandle {
  #started = false;
  #x;
  #y;
  #bidiId;
  #page;
  #touchScreen;
  #properties;
  constructor(page, touchScreen, id, x, y, properties) {
    this.#page = page;
    this.#touchScreen = touchScreen;
    this.#x = Math.round(x);
    this.#y = Math.round(y);
    this.#properties = properties;
    this.#bidiId = `${"__puppeteer_finger"}_${id}`;
  }
  async start(options = {}) {
    if (this.#started) {
      throw new main.TouchError("Touch has already started");
    }
    await this.#page.mainFrame().browsingContext.performActions([
      {
        type: SourceActionsType.Pointer,
        id: this.#bidiId,
        parameters: {
          pointerType: "touch"
        },
        actions: [
          {
            type: ActionType.PointerMove,
            x: this.#x,
            y: this.#y,
            origin: options.origin
          },
          {
            ...this.#properties,
            type: ActionType.PointerDown,
            button: 0
          }
        ]
      }
    ]);
    this.#started = true;
  }
  move(x, y) {
    const newX = Math.round(x);
    const newY = Math.round(y);
    return this.#page.mainFrame().browsingContext.performActions([
      {
        type: SourceActionsType.Pointer,
        id: this.#bidiId,
        parameters: {
          pointerType: "touch"
        },
        actions: [
          {
            ...this.#properties,
            type: ActionType.PointerMove,
            x: newX,
            y: newY
          }
        ]
      }
    ]);
  }
  async end() {
    await this.#page.mainFrame().browsingContext.performActions([
      {
        type: SourceActionsType.Pointer,
        id: this.#bidiId,
        parameters: {
          pointerType: "touch"
        },
        actions: [
          {
            type: ActionType.PointerUp,
            button: 0
          }
        ]
      }
    ]);
    this.#touchScreen.removeHandle(this);
  }
}
class BidiTouchscreen extends main.Touchscreen {
  #page;
  constructor(page) {
    super();
    this.#page = page;
  }
  async touchStart(x, y, options = {}) {
    const id = this.idGenerator();
    const properties = {
      width: 0.5 * 2,
      // 2 times default touch radius.
      height: 0.5 * 2,
      // 2 times default touch radius.
      pressure: 0.5,
      altitudeAngle: Math.PI / 2
    };
    const touch = new BidiTouchHandle(this.#page, this, id, x, y, properties);
    await touch.start(options);
    this.touches.push(touch);
    return touch;
  }
}
/**
 * @license
 * Copyright 2022 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
var __esDecorate$4 = function(ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
  function accept(f) {
    if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected");
    return f;
  }
  var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
  var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
  var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
  var _, done = false;
  for (var i = decorators.length - 1; i >= 0; i--) {
    var context = {};
    for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
    for (var p in contextIn.access) context.access[p] = contextIn.access[p];
    context.addInitializer = function(f) {
      if (done) throw new TypeError("Cannot add initializers after decoration has completed");
      extraInitializers.push(accept(f || null));
    };
    var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
    if (kind === "accessor") {
      if (result === void 0) continue;
      if (result === null || typeof result !== "object") throw new TypeError("Object expected");
      if (_ = accept(result.get)) descriptor.get = _;
      if (_ = accept(result.set)) descriptor.set = _;
      if (_ = accept(result.init)) initializers.unshift(_);
    } else if (_ = accept(result)) {
      if (kind === "field") initializers.unshift(_);
      else descriptor[key] = _;
    }
  }
  if (target) Object.defineProperty(target, contextIn.name, descriptor);
  done = true;
};
var __runInitializers$4 = function(thisArg, initializers, value) {
  var useValue = arguments.length > 2;
  for (var i = 0; i < initializers.length; i++) {
    value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
  }
  return useValue ? value : void 0;
};
var __addDisposableResource$2 = function(env, value, async) {
  if (value !== null && value !== void 0) {
    if (typeof value !== "object" && typeof value !== "function") throw new TypeError("Object expected.");
    var dispose, inner;
    if (async) {
      if (!Symbol.asyncDispose) throw new TypeError("Symbol.asyncDispose is not defined.");
      dispose = value[Symbol.asyncDispose];
    }
    if (dispose === void 0) {
      if (!Symbol.dispose) throw new TypeError("Symbol.dispose is not defined.");
      dispose = value[Symbol.dispose];
      if (async) inner = dispose;
    }
    if (typeof dispose !== "function") throw new TypeError("Object not disposable.");
    if (inner) dispose = function() {
      try {
        inner.call(this);
      } catch (e) {
        return Promise.reject(e);
      }
    };
    env.stack.push({ value, dispose, async });
  } else if (async) {
    env.stack.push({ async: true });
  }
  return value;
};
var __disposeResources$2 = /* @__PURE__ */ function(SuppressedError2) {
  return function(env) {
    function fail(e) {
      env.error = env.hasError ? new SuppressedError2(e, env.error, "An error was suppressed during disposal.") : e;
      env.hasError = true;
    }
    var r, s = 0;
    function next() {
      while (r = env.stack.pop()) {
        try {
          if (!r.async && s === 1) return s = 0, env.stack.push(r), Promise.resolve().then(next);
          if (r.dispose) {
            var result = r.dispose.call(r.value);
            if (r.async) return s |= 2, Promise.resolve(result).then(next, function(e) {
              fail(e);
              return next();
            });
          } else s |= 1;
        } catch (e) {
          fail(e);
        }
      }
      if (s === 1) return env.hasError ? Promise.reject(env.error) : Promise.resolve();
      if (env.hasError) throw env.error;
    }
    return next();
  };
}(typeof SuppressedError === "function" ? SuppressedError : function(error, suppressed, message) {
  var e = new Error(message);
  return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
});
let BidiPage = (() => {
  var _trustedEmitter_accessor_storage, _browserContext, _frame, _viewport, _workers, _cdpEmulationManager, _emulatedNetworkConditions, _fileChooserDeferreds, _BidiPage_instances, initialize_fn, _userAgentInterception, _userAgentPreloadScript, _userInterception, _extraHeadersInterception, _authInterception, toggleInterception_fn, applyNetworkConditions_fn, go_fn, _a2;
  let _classSuper = main.Page;
  let _trustedEmitter_decorators;
  let _trustedEmitter_initializers = [];
  let _trustedEmitter_extraInitializers = [];
  return _a2 = class extends _classSuper {
    constructor(browserContext, browsingContext) {
      super();
      __privateAdd(this, _BidiPage_instances);
      __privateAdd(this, _trustedEmitter_accessor_storage, __runInitializers$4(this, _trustedEmitter_initializers, new main.EventEmitter()));
      __privateAdd(this, _browserContext, __runInitializers$4(this, _trustedEmitter_extraInitializers));
      __privateAdd(this, _frame);
      __privateAdd(this, _viewport, null);
      __privateAdd(this, _workers, /* @__PURE__ */ new Set());
      __publicField(this, "keyboard");
      __publicField(this, "mouse");
      __publicField(this, "touchscreen");
      __publicField(this, "tracing");
      __publicField(this, "coverage");
      __privateAdd(this, _cdpEmulationManager);
      __privateAdd(this, _emulatedNetworkConditions);
      __privateAdd(this, _fileChooserDeferreds, /* @__PURE__ */ new Set());
      /**
       * @internal
       */
      __publicField(this, "_userAgentHeaders", {});
      __privateAdd(this, _userAgentInterception);
      __privateAdd(this, _userAgentPreloadScript);
      __privateAdd(this, _userInterception);
      /**
       * @internal
       */
      __publicField(this, "_extraHTTPHeaders", {});
      __privateAdd(this, _extraHeadersInterception);
      /**
       * @internal
       */
      __publicField(this, "_credentials", null);
      __privateAdd(this, _authInterception);
      __privateSet(this, _browserContext, browserContext);
      __privateSet(this, _frame, BidiFrame.from(this, browsingContext));
      __privateSet(this, _cdpEmulationManager, new main.EmulationManager(__privateGet(this, _frame).client));
      this.tracing = new main.Tracing(__privateGet(this, _frame).client);
      this.coverage = new main.Coverage(__privateGet(this, _frame).client);
      this.keyboard = new BidiKeyboard(this);
      this.mouse = new BidiMouse(this);
      this.touchscreen = new BidiTouchscreen(this);
    }
    static from(browserContext, browsingContext) {
      var _a3;
      const page = new _a2(browserContext, browsingContext);
      __privateMethod(_a3 = page, _BidiPage_instances, initialize_fn).call(_a3);
      return page;
    }
    get trustedEmitter() {
      return __privateGet(this, _trustedEmitter_accessor_storage);
    }
    set trustedEmitter(value) {
      __privateSet(this, _trustedEmitter_accessor_storage, value);
    }
    _client() {
      return __privateGet(this, _frame).client;
    }
    async setUserAgent(userAgent, userAgentMetadata) {
      if (!__privateGet(this, _browserContext).browser().cdpSupported && userAgentMetadata) {
        throw new main.UnsupportedOperation("Current Browser does not support `userAgentMetadata`");
      } else if (__privateGet(this, _browserContext).browser().cdpSupported && userAgentMetadata) {
        return await this._client().send("Network.setUserAgentOverride", {
          userAgent,
          userAgentMetadata
        });
      }
      const enable = userAgent !== "";
      userAgent = userAgent ?? await __privateGet(this, _browserContext).browser().userAgent();
      this._userAgentHeaders = enable ? {
        "User-Agent": userAgent
      } : {};
      __privateSet(this, _userAgentInterception, await __privateMethod(this, _BidiPage_instances, toggleInterception_fn).call(this, [
        "beforeRequestSent"
        /* Bidi.Network.InterceptPhase.BeforeRequestSent */
      ], __privateGet(this, _userAgentInterception), enable));
      const changeUserAgent = (userAgent2) => {
        Object.defineProperty(navigator, "userAgent", {
          value: userAgent2,
          configurable: true
        });
      };
      const frames = [__privateGet(this, _frame)];
      for (const frame of frames) {
        frames.push(...frame.childFrames());
      }
      if (__privateGet(this, _userAgentPreloadScript)) {
        await this.removeScriptToEvaluateOnNewDocument(__privateGet(this, _userAgentPreloadScript));
      }
      const [evaluateToken] = await Promise.all([
        enable ? this.evaluateOnNewDocument(changeUserAgent, userAgent) : void 0,
        // When we disable the UserAgent we want to
        // evaluate the original value in all Browsing Contexts
        ...frames.map((frame) => {
          return frame.evaluate(changeUserAgent, userAgent);
        })
      ]);
      __privateSet(this, _userAgentPreloadScript, evaluateToken?.identifier);
    }
    async setBypassCSP(enabled) {
      await this._client().send("Page.setBypassCSP", { enabled });
    }
    async queryObjects(prototypeHandle) {
      main.assert(!prototypeHandle.disposed, "Prototype JSHandle is disposed!");
      main.assert(prototypeHandle.id, "Prototype JSHandle must not be referencing primitive value");
      const response = await __privateGet(this, _frame).client.send("Runtime.queryObjects", {
        prototypeObjectId: prototypeHandle.id
      });
      return __privateGet(this, _frame).mainRealm().createHandle({
        type: "array",
        handle: response.objects.objectId
      });
    }
    browser() {
      return this.browserContext().browser();
    }
    browserContext() {
      return __privateGet(this, _browserContext);
    }
    mainFrame() {
      return __privateGet(this, _frame);
    }
    async focusedFrame() {
      const env_1 = { stack: [], error: void 0, hasError: false };
      try {
        const handle = __addDisposableResource$2(env_1, await this.mainFrame().isolatedRealm().evaluateHandle(() => {
          let win = window;
          while (win.document.activeElement instanceof win.HTMLIFrameElement || win.document.activeElement instanceof win.HTMLFrameElement) {
            if (win.document.activeElement.contentWindow === null) {
              break;
            }
            win = win.document.activeElement.contentWindow;
          }
          return win;
        }), false);
        const value = handle.remoteValue();
        main.assert(value.type === "window");
        const frame = this.frames().find((frame2) => {
          return frame2._id === value.value.context;
        });
        main.assert(frame);
        return frame;
      } catch (e_1) {
        env_1.error = e_1;
        env_1.hasError = true;
      } finally {
        __disposeResources$2(env_1);
      }
    }
    frames() {
      const frames = [__privateGet(this, _frame)];
      for (const frame of frames) {
        frames.push(...frame.childFrames());
      }
      return frames;
    }
    isClosed() {
      return __privateGet(this, _frame).detached;
    }
    async close(options) {
      const env_2 = { stack: [], error: void 0, hasError: false };
      try {
        const _guard = __addDisposableResource$2(env_2, await __privateGet(this, _browserContext).waitForScreenshotOperations(), false);
        try {
          await __privateGet(this, _frame).browsingContext.close(options?.runBeforeUnload);
        } catch {
          return;
        }
      } catch (e_2) {
        env_2.error = e_2;
        env_2.hasError = true;
      } finally {
        __disposeResources$2(env_2);
      }
    }
    async reload(options = {}) {
      const [response] = await Promise.all([
        __privateGet(this, _frame).waitForNavigation(options),
        __privateGet(this, _frame).browsingContext.reload()
      ]).catch(rewriteNavigationError(this.url(), options.timeout ?? this._timeoutSettings.navigationTimeout()));
      return response;
    }
    setDefaultNavigationTimeout(timeout) {
      this._timeoutSettings.setDefaultNavigationTimeout(timeout);
    }
    setDefaultTimeout(timeout) {
      this._timeoutSettings.setDefaultTimeout(timeout);
    }
    getDefaultTimeout() {
      return this._timeoutSettings.timeout();
    }
    getDefaultNavigationTimeout() {
      return this._timeoutSettings.navigationTimeout();
    }
    isJavaScriptEnabled() {
      return __privateGet(this, _cdpEmulationManager).javascriptEnabled;
    }
    async setGeolocation(options) {
      const { longitude, latitude, accuracy = 0 } = options;
      if (longitude < -180 || longitude > 180) {
        throw new Error(`Invalid longitude "${longitude}": precondition -180 <= LONGITUDE <= 180 failed.`);
      }
      if (latitude < -90 || latitude > 90) {
        throw new Error(`Invalid latitude "${latitude}": precondition -90 <= LATITUDE <= 90 failed.`);
      }
      if (accuracy < 0) {
        throw new Error(`Invalid accuracy "${accuracy}": precondition 0 <= ACCURACY failed.`);
      }
      return await __privateGet(this, _frame).browsingContext.setGeolocationOverride({
        coordinates: {
          latitude: options.latitude,
          longitude: options.longitude,
          accuracy: options.accuracy
        }
      });
    }
    async setJavaScriptEnabled(enabled) {
      return await __privateGet(this, _cdpEmulationManager).setJavaScriptEnabled(enabled);
    }
    async emulateMediaType(type) {
      return await __privateGet(this, _cdpEmulationManager).emulateMediaType(type);
    }
    async emulateCPUThrottling(factor) {
      return await __privateGet(this, _cdpEmulationManager).emulateCPUThrottling(factor);
    }
    async emulateMediaFeatures(features) {
      return await __privateGet(this, _cdpEmulationManager).emulateMediaFeatures(features);
    }
    async emulateTimezone(timezoneId) {
      return await __privateGet(this, _frame).browsingContext.setTimezoneOverride(timezoneId);
    }
    async emulateIdleState(overrides) {
      return await __privateGet(this, _cdpEmulationManager).emulateIdleState(overrides);
    }
    async emulateVisionDeficiency(type) {
      return await __privateGet(this, _cdpEmulationManager).emulateVisionDeficiency(type);
    }
    async setViewport(viewport) {
      if (!this.browser().cdpSupported) {
        await __privateGet(this, _frame).browsingContext.setViewport({
          viewport: viewport?.width && viewport?.height ? {
            width: viewport.width,
            height: viewport.height
          } : null,
          devicePixelRatio: viewport?.deviceScaleFactor ? viewport.deviceScaleFactor : null
        });
        __privateSet(this, _viewport, viewport);
        return;
      }
      const needsReload = await __privateGet(this, _cdpEmulationManager).emulateViewport(viewport);
      __privateSet(this, _viewport, viewport);
      if (needsReload) {
        await this.reload();
      }
    }
    viewport() {
      return __privateGet(this, _viewport);
    }
    async pdf(options = {}) {
      const { timeout: ms = this._timeoutSettings.timeout(), path = void 0 } = options;
      const { printBackground: background, margin, landscape, width, height, pageRanges: ranges, scale, preferCSSPageSize } = main.parsePDFOptions(options, "cm");
      const pageRanges = ranges ? ranges.split(", ") : [];
      await main.firstValueFrom(main.from(this.mainFrame().isolatedRealm().evaluate(() => {
        return document.fonts.ready;
      })).pipe(main.raceWith(main.timeout(ms))));
      const data = await main.firstValueFrom(main.from(__privateGet(this, _frame).browsingContext.print({
        background,
        margin,
        orientation: landscape ? "landscape" : "portrait",
        page: {
          width,
          height
        },
        pageRanges,
        scale,
        shrinkToFit: !preferCSSPageSize
      })).pipe(main.raceWith(main.timeout(ms))));
      const typedArray = main.stringToTypedArray(data, true);
      await this._maybeWriteTypedArrayToFile(path, typedArray);
      return typedArray;
    }
    async createPDFStream(options) {
      const typedArray = await this.pdf(options);
      return new ReadableStream({
        start(controller) {
          controller.enqueue(typedArray);
          controller.close();
        }
      });
    }
    async _screenshot(options) {
      const { clip, type, captureBeyondViewport, quality } = options;
      if (options.omitBackground !== void 0 && options.omitBackground) {
        throw new main.UnsupportedOperation(`BiDi does not support 'omitBackground'.`);
      }
      if (options.optimizeForSpeed !== void 0 && options.optimizeForSpeed) {
        throw new main.UnsupportedOperation(`BiDi does not support 'optimizeForSpeed'.`);
      }
      if (options.fromSurface !== void 0 && !options.fromSurface) {
        throw new main.UnsupportedOperation(`BiDi does not support 'fromSurface'.`);
      }
      if (clip !== void 0 && clip.scale !== void 0 && clip.scale !== 1) {
        throw new main.UnsupportedOperation(`BiDi does not support 'scale' in 'clip'.`);
      }
      let box;
      if (clip) {
        if (captureBeyondViewport) {
          box = clip;
        } else {
          const [pageLeft, pageTop] = await this.evaluate(() => {
            if (!window.visualViewport) {
              throw new Error("window.visualViewport is not supported.");
            }
            return [
              window.visualViewport.pageLeft,
              window.visualViewport.pageTop
            ];
          });
          box = {
            ...clip,
            x: clip.x - pageLeft,
            y: clip.y - pageTop
          };
        }
      }
      const data = await __privateGet(this, _frame).browsingContext.captureScreenshot({
        origin: captureBeyondViewport ? "document" : "viewport",
        format: {
          type: `image/${type}`,
          ...quality !== void 0 ? { quality: quality / 100 } : {}
        },
        ...box ? { clip: { type: "box", ...box } } : {}
      });
      return data;
    }
    async createCDPSession() {
      return await __privateGet(this, _frame).createCDPSession();
    }
    async bringToFront() {
      await __privateGet(this, _frame).browsingContext.activate();
    }
    async evaluateOnNewDocument(pageFunction, ...args) {
      const expression = evaluationExpression(pageFunction, ...args);
      const script = await __privateGet(this, _frame).browsingContext.addPreloadScript(expression);
      return { identifier: script };
    }
    async removeScriptToEvaluateOnNewDocument(id) {
      await __privateGet(this, _frame).browsingContext.removePreloadScript(id);
    }
    async exposeFunction(name, pptrFunction) {
      return await this.mainFrame().exposeFunction(name, "default" in pptrFunction ? pptrFunction.default : pptrFunction);
    }
    isDragInterceptionEnabled() {
      return false;
    }
    async setCacheEnabled(enabled) {
      if (!__privateGet(this, _browserContext).browser().cdpSupported) {
        await __privateGet(this, _frame).browsingContext.setCacheBehavior(enabled ? "default" : "bypass");
        return;
      }
      await this._client().send("Network.setCacheDisabled", {
        cacheDisabled: !enabled
      });
    }
    async cookies(...urls) {
      const normalizedUrls = (urls.length ? urls : [this.url()]).map((url) => {
        return new URL(url);
      });
      const cookies = await __privateGet(this, _frame).browsingContext.getCookies();
      return cookies.map((cookie) => {
        return bidiToPuppeteerCookie(cookie);
      }).filter((cookie) => {
        return normalizedUrls.some((url) => {
          return testUrlMatchCookie(cookie, url);
        });
      });
    }
    isServiceWorkerBypassed() {
      throw new main.UnsupportedOperation();
    }
    target() {
      throw new main.UnsupportedOperation();
    }
    async waitForFileChooser(options = {}) {
      const { timeout = this._timeoutSettings.timeout() } = options;
      const deferred = main.Deferred.create({
        message: `Waiting for \`FileChooser\` failed: ${timeout}ms exceeded`,
        timeout
      });
      __privateGet(this, _fileChooserDeferreds).add(deferred);
      if (options.signal) {
        options.signal.addEventListener("abort", () => {
          deferred.reject(options.signal?.reason);
        }, { once: true });
      }
      __privateGet(this, _frame).browsingContext.once("filedialogopened", (info) => {
        if (!info.element) {
          return;
        }
        const chooser = new main.FileChooser(BidiElementHandle.from({
          sharedId: info.element.sharedId,
          handle: info.element.handle,
          type: "node"
        }, __privateGet(this, _frame).mainRealm()), info.multiple);
        for (const deferred2 of __privateGet(this, _fileChooserDeferreds)) {
          deferred2.resolve(chooser);
          __privateGet(this, _fileChooserDeferreds).delete(deferred2);
        }
      });
      try {
        return await deferred.valueOrThrow();
      } catch (error) {
        __privateGet(this, _fileChooserDeferreds).delete(deferred);
        throw error;
      }
    }
    workers() {
      return [...__privateGet(this, _workers)];
    }
    async setRequestInterception(enable) {
      __privateSet(this, _userInterception, await __privateMethod(this, _BidiPage_instances, toggleInterception_fn).call(this, [
        "beforeRequestSent"
        /* Bidi.Network.InterceptPhase.BeforeRequestSent */
      ], __privateGet(this, _userInterception), enable));
    }
    async setExtraHTTPHeaders(headers) {
      const extraHTTPHeaders = {};
      for (const [key, value] of Object.entries(headers)) {
        main.assert(main.isString(value), `Expected value of header "${key}" to be String, but "${typeof value}" is found.`);
        extraHTTPHeaders[key.toLowerCase()] = value;
      }
      this._extraHTTPHeaders = extraHTTPHeaders;
      __privateSet(this, _extraHeadersInterception, await __privateMethod(this, _BidiPage_instances, toggleInterception_fn).call(this, [
        "beforeRequestSent"
        /* Bidi.Network.InterceptPhase.BeforeRequestSent */
      ], __privateGet(this, _extraHeadersInterception), Boolean(Object.keys(this._extraHTTPHeaders).length)));
    }
    async authenticate(credentials) {
      __privateSet(this, _authInterception, await __privateMethod(this, _BidiPage_instances, toggleInterception_fn).call(this, [
        "authRequired"
        /* Bidi.Network.InterceptPhase.AuthRequired */
      ], __privateGet(this, _authInterception), Boolean(credentials)));
      this._credentials = credentials;
    }
    setDragInterception() {
      throw new main.UnsupportedOperation();
    }
    setBypassServiceWorker() {
      throw new main.UnsupportedOperation();
    }
    async setOfflineMode(enabled) {
      if (!__privateGet(this, _browserContext).browser().cdpSupported) {
        throw new main.UnsupportedOperation();
      }
      if (!__privateGet(this, _emulatedNetworkConditions)) {
        __privateSet(this, _emulatedNetworkConditions, {
          offline: false,
          upload: -1,
          download: -1,
          latency: 0
        });
      }
      __privateGet(this, _emulatedNetworkConditions).offline = enabled;
      return await __privateMethod(this, _BidiPage_instances, applyNetworkConditions_fn).call(this);
    }
    async emulateNetworkConditions(networkConditions) {
      if (!__privateGet(this, _browserContext).browser().cdpSupported) {
        throw new main.UnsupportedOperation();
      }
      if (!__privateGet(this, _emulatedNetworkConditions)) {
        __privateSet(this, _emulatedNetworkConditions, {
          offline: false,
          upload: -1,
          download: -1,
          latency: 0
        });
      }
      __privateGet(this, _emulatedNetworkConditions).upload = networkConditions ? networkConditions.upload : -1;
      __privateGet(this, _emulatedNetworkConditions).download = networkConditions ? networkConditions.download : -1;
      __privateGet(this, _emulatedNetworkConditions).latency = networkConditions ? networkConditions.latency : 0;
      return await __privateMethod(this, _BidiPage_instances, applyNetworkConditions_fn).call(this);
    }
    async setCookie(...cookies) {
      const pageURL = this.url();
      const pageUrlStartsWithHTTP = pageURL.startsWith("http");
      for (const cookie of cookies) {
        let cookieUrl = cookie.url || "";
        if (!cookieUrl && pageUrlStartsWithHTTP) {
          cookieUrl = pageURL;
        }
        main.assert(cookieUrl !== "about:blank", `Blank page can not have cookie "${cookie.name}"`);
        main.assert(!String.prototype.startsWith.call(cookieUrl || "", "data:"), `Data URL page can not have cookie "${cookie.name}"`);
        main.assert(cookie.partitionKey === void 0 || typeof cookie.partitionKey === "string", "BiDi only allows domain partition keys");
        const normalizedUrl = URL.canParse(cookieUrl) ? new URL(cookieUrl) : void 0;
        const domain = cookie.domain ?? normalizedUrl?.hostname;
        main.assert(domain !== void 0, `At least one of the url and domain needs to be specified`);
        const bidiCookie = {
          domain,
          name: cookie.name,
          value: {
            type: "string",
            value: cookie.value
          },
          ...cookie.path !== void 0 ? { path: cookie.path } : {},
          ...cookie.httpOnly !== void 0 ? { httpOnly: cookie.httpOnly } : {},
          ...cookie.secure !== void 0 ? { secure: cookie.secure } : {},
          ...cookie.sameSite !== void 0 ? { sameSite: convertCookiesSameSiteCdpToBiDi(cookie.sameSite) } : {},
          ...{ expiry: convertCookiesExpiryCdpToBiDi(cookie.expires) },
          // Chrome-specific properties.
          ...cdpSpecificCookiePropertiesFromPuppeteerToBidi(cookie, "sameParty", "sourceScheme", "priority", "url")
        };
        if (cookie.partitionKey !== void 0) {
          await this.browserContext().userContext.setCookie(bidiCookie, cookie.partitionKey);
        } else {
          await __privateGet(this, _frame).browsingContext.setCookie(bidiCookie);
        }
      }
    }
    async deleteCookie(...cookies) {
      await Promise.all(cookies.map(async (deleteCookieRequest) => {
        const cookieUrl = deleteCookieRequest.url ?? this.url();
        const normalizedUrl = URL.canParse(cookieUrl) ? new URL(cookieUrl) : void 0;
        const domain = deleteCookieRequest.domain ?? normalizedUrl?.hostname;
        main.assert(domain !== void 0, `At least one of the url and domain needs to be specified`);
        const filter = {
          domain,
          name: deleteCookieRequest.name,
          ...deleteCookieRequest.path !== void 0 ? { path: deleteCookieRequest.path } : {}
        };
        await __privateGet(this, _frame).browsingContext.deleteCookie(filter);
      }));
    }
    async removeExposedFunction(name) {
      await __privateGet(this, _frame).removeExposedFunction(name);
    }
    metrics() {
      throw new main.UnsupportedOperation();
    }
    async goBack(options = {}) {
      return await __privateMethod(this, _BidiPage_instances, go_fn).call(this, -1, options);
    }
    async goForward(options = {}) {
      return await __privateMethod(this, _BidiPage_instances, go_fn).call(this, 1, options);
    }
    waitForDevicePrompt() {
      throw new main.UnsupportedOperation();
    }
  }, _trustedEmitter_accessor_storage = new WeakMap(), _browserContext = new WeakMap(), _frame = new WeakMap(), _viewport = new WeakMap(), _workers = new WeakMap(), _cdpEmulationManager = new WeakMap(), _emulatedNetworkConditions = new WeakMap(), _fileChooserDeferreds = new WeakMap(), _BidiPage_instances = new WeakSet(), initialize_fn = function() {
    __privateGet(this, _frame).browsingContext.on("closed", () => {
      this.trustedEmitter.emit("close", void 0);
      this.trustedEmitter.removeAllListeners();
    });
    this.trustedEmitter.on("workercreated", (worker) => {
      __privateGet(this, _workers).add(worker);
    });
    this.trustedEmitter.on("workerdestroyed", (worker) => {
      __privateGet(this, _workers).delete(worker);
    });
  }, _userAgentInterception = new WeakMap(), _userAgentPreloadScript = new WeakMap(), _userInterception = new WeakMap(), _extraHeadersInterception = new WeakMap(), _authInterception = new WeakMap(), toggleInterception_fn = async function(phases, interception, expected) {
    if (expected && !interception) {
      return await __privateGet(this, _frame).browsingContext.addIntercept({
        phases
      });
    } else if (!expected && interception) {
      await __privateGet(this, _frame).browsingContext.userContext.browser.removeIntercept(interception);
      return;
    }
    return interception;
  }, applyNetworkConditions_fn = async function() {
    if (!__privateGet(this, _emulatedNetworkConditions)) {
      return;
    }
    await this._client().send("Network.emulateNetworkConditions", {
      offline: __privateGet(this, _emulatedNetworkConditions).offline,
      latency: __privateGet(this, _emulatedNetworkConditions).latency,
      uploadThroughput: __privateGet(this, _emulatedNetworkConditions).upload,
      downloadThroughput: __privateGet(this, _emulatedNetworkConditions).download
    });
  }, go_fn = async function(delta, options) {
    const controller = new AbortController();
    try {
      const [response] = await Promise.all([
        this.waitForNavigation({
          ...options,
          signal: controller.signal
        }),
        __privateGet(this, _frame).browsingContext.traverseHistory(delta)
      ]);
      return response;
    } catch (error) {
      controller.abort();
      if (main.isErrorLike(error)) {
        if (error.message.includes("no such history entry")) {
          return null;
        }
      }
      throw error;
    }
  }, (() => {
    const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
    _trustedEmitter_decorators = [main.bubble()];
    __esDecorate$4(_a2, null, _trustedEmitter_decorators, { kind: "accessor", name: "trustedEmitter", static: false, private: false, access: { has: (obj) => "trustedEmitter" in obj, get: (obj) => obj.trustedEmitter, set: (obj, value) => {
      obj.trustedEmitter = value;
    } }, metadata: _metadata }, _trustedEmitter_initializers, _trustedEmitter_extraInitializers);
    if (_metadata) Object.defineProperty(_a2, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
  })(), _a2;
})();
function evaluationExpression(fun, ...args) {
  return `() => {${main.evaluationString(fun, ...args)}}`;
}
function testUrlMatchCookieHostname(cookie, normalizedUrl) {
  const cookieDomain = cookie.domain.toLowerCase();
  const urlHostname = normalizedUrl.hostname.toLowerCase();
  if (cookieDomain === urlHostname) {
    return true;
  }
  return cookieDomain.startsWith(".") && urlHostname.endsWith(cookieDomain);
}
function testUrlMatchCookiePath(cookie, normalizedUrl) {
  const uriPath = normalizedUrl.pathname;
  const cookiePath = cookie.path;
  if (uriPath === cookiePath) {
    return true;
  }
  if (uriPath.startsWith(cookiePath)) {
    if (cookiePath.endsWith("/")) {
      return true;
    }
    if (uriPath[cookiePath.length] === "/") {
      return true;
    }
  }
  return false;
}
function testUrlMatchCookie(cookie, url) {
  const normalizedUrl = new URL(url);
  main.assert(cookie !== void 0);
  if (!testUrlMatchCookieHostname(cookie, normalizedUrl)) {
    return false;
  }
  return testUrlMatchCookiePath(cookie, normalizedUrl);
}
function bidiToPuppeteerCookie(bidiCookie, returnCompositePartitionKey = false) {
  const partitionKey = bidiCookie[CDP_SPECIFIC_PREFIX + "partitionKey"];
  function getParitionKey() {
    if (typeof partitionKey === "string") {
      return { partitionKey };
    }
    if (typeof partitionKey === "object" && partitionKey !== null) {
      if (returnCompositePartitionKey) {
        return {
          partitionKey: {
            sourceOrigin: partitionKey.topLevelSite,
            hasCrossSiteAncestor: partitionKey.hasCrossSiteAncestor ?? false
          }
        };
      }
      return {
        // TODO: a breaking change in Puppeteer is required to change
        // partitionKey type and report the composite partition key.
        partitionKey: partitionKey.topLevelSite
      };
    }
    return {};
  }
  return {
    name: bidiCookie.name,
    // Presents binary value as base64 string.
    value: bidiCookie.value.value,
    domain: bidiCookie.domain,
    path: bidiCookie.path,
    size: bidiCookie.size,
    httpOnly: bidiCookie.httpOnly,
    secure: bidiCookie.secure,
    sameSite: convertCookiesSameSiteBiDiToCdp(bidiCookie.sameSite),
    expires: bidiCookie.expiry ?? -1,
    session: bidiCookie.expiry === void 0 || bidiCookie.expiry <= 0,
    // Extending with CDP-specific properties with `goog:` prefix.
    ...cdpSpecificCookiePropertiesFromBidiToPuppeteer(bidiCookie, "sameParty", "sourceScheme", "partitionKeyOpaque", "priority"),
    ...getParitionKey()
  };
}
const CDP_SPECIFIC_PREFIX = "goog:";
function cdpSpecificCookiePropertiesFromBidiToPuppeteer(bidiCookie, ...propertyNames) {
  const result = {};
  for (const property of propertyNames) {
    if (bidiCookie[CDP_SPECIFIC_PREFIX + property] !== void 0) {
      result[property] = bidiCookie[CDP_SPECIFIC_PREFIX + property];
    }
  }
  return result;
}
function cdpSpecificCookiePropertiesFromPuppeteerToBidi(cookieParam, ...propertyNames) {
  const result = {};
  for (const property of propertyNames) {
    if (cookieParam[property] !== void 0) {
      result[CDP_SPECIFIC_PREFIX + property] = cookieParam[property];
    }
  }
  return result;
}
function convertCookiesSameSiteBiDiToCdp(sameSite) {
  return sameSite === "strict" ? "Strict" : sameSite === "lax" ? "Lax" : "None";
}
function convertCookiesSameSiteCdpToBiDi(sameSite) {
  return sameSite === "Strict" ? "strict" : sameSite === "Lax" ? "lax" : "none";
}
function convertCookiesExpiryCdpToBiDi(expiry) {
  return [void 0, -1].includes(expiry) ? void 0 : expiry;
}
function convertCookiesPartitionKeyFromPuppeteerToBiDi(partitionKey) {
  if (partitionKey === void 0 || typeof partitionKey === "string") {
    return partitionKey;
  }
  if (partitionKey.hasCrossSiteAncestor) {
    throw new main.UnsupportedOperation("WebDriver BiDi does not support `hasCrossSiteAncestor` yet.");
  }
  return partitionKey.sourceOrigin;
}
/**
 * @license
 * Copyright 2023 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
class BidiBrowserTarget extends main.Target {
  #browser;
  constructor(browser) {
    super();
    this.#browser = browser;
  }
  asPage() {
    throw new main.UnsupportedOperation();
  }
  url() {
    return "";
  }
  createCDPSession() {
    throw new main.UnsupportedOperation();
  }
  type() {
    return main.TargetType.BROWSER;
  }
  browser() {
    return this.#browser;
  }
  browserContext() {
    return this.#browser.defaultBrowserContext();
  }
  opener() {
    throw new main.UnsupportedOperation();
  }
}
class BidiPageTarget extends main.Target {
  #page;
  constructor(page) {
    super();
    this.#page = page;
  }
  async page() {
    return this.#page;
  }
  async asPage() {
    return BidiPage.from(this.browserContext(), this.#page.mainFrame().browsingContext);
  }
  url() {
    return this.#page.url();
  }
  createCDPSession() {
    return this.#page.createCDPSession();
  }
  type() {
    return main.TargetType.PAGE;
  }
  browser() {
    return this.browserContext().browser();
  }
  browserContext() {
    return this.#page.browserContext();
  }
  opener() {
    throw new main.UnsupportedOperation();
  }
}
class BidiFrameTarget extends main.Target {
  #frame;
  #page;
  constructor(frame) {
    super();
    this.#frame = frame;
  }
  async page() {
    if (this.#page === void 0) {
      this.#page = BidiPage.from(this.browserContext(), this.#frame.browsingContext);
    }
    return this.#page;
  }
  async asPage() {
    return BidiPage.from(this.browserContext(), this.#frame.browsingContext);
  }
  url() {
    return this.#frame.url();
  }
  createCDPSession() {
    return this.#frame.createCDPSession();
  }
  type() {
    return main.TargetType.PAGE;
  }
  browser() {
    return this.browserContext().browser();
  }
  browserContext() {
    return this.#frame.page().browserContext();
  }
  opener() {
    throw new main.UnsupportedOperation();
  }
}
class BidiWorkerTarget extends main.Target {
  #worker;
  constructor(worker) {
    super();
    this.#worker = worker;
  }
  async page() {
    throw new main.UnsupportedOperation();
  }
  async asPage() {
    throw new main.UnsupportedOperation();
  }
  url() {
    return this.#worker.url();
  }
  createCDPSession() {
    throw new main.UnsupportedOperation();
  }
  type() {
    return main.TargetType.OTHER;
  }
  browser() {
    return this.browserContext().browser();
  }
  browserContext() {
    return this.#worker.frame.page().browserContext();
  }
  opener() {
    throw new main.UnsupportedOperation();
  }
}
/**
 * @license
 * Copyright 2022 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
var __esDecorate$3 = function(ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
  function accept(f) {
    if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected");
    return f;
  }
  var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
  var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
  var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
  var _, done = false;
  for (var i = decorators.length - 1; i >= 0; i--) {
    var context = {};
    for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
    for (var p in contextIn.access) context.access[p] = contextIn.access[p];
    context.addInitializer = function(f) {
      if (done) throw new TypeError("Cannot add initializers after decoration has completed");
      extraInitializers.push(accept(f || null));
    };
    var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
    if (kind === "accessor") {
      if (result === void 0) continue;
      if (result === null || typeof result !== "object") throw new TypeError("Object expected");
      if (_ = accept(result.get)) descriptor.get = _;
      if (_ = accept(result.set)) descriptor.set = _;
      if (_ = accept(result.init)) initializers.unshift(_);
    } else if (_ = accept(result)) {
      if (kind === "field") initializers.unshift(_);
      else descriptor[key] = _;
    }
  }
  if (target) Object.defineProperty(target, contextIn.name, descriptor);
  done = true;
};
var __runInitializers$3 = function(thisArg, initializers, value) {
  var useValue = arguments.length > 2;
  for (var i = 0; i < initializers.length; i++) {
    value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
  }
  return useValue ? value : void 0;
};
var __addDisposableResource$1 = function(env, value, async) {
  if (value !== null && value !== void 0) {
    if (typeof value !== "object" && typeof value !== "function") throw new TypeError("Object expected.");
    var dispose, inner;
    if (async) {
      if (!Symbol.asyncDispose) throw new TypeError("Symbol.asyncDispose is not defined.");
      dispose = value[Symbol.asyncDispose];
    }
    if (dispose === void 0) {
      if (!Symbol.dispose) throw new TypeError("Symbol.dispose is not defined.");
      dispose = value[Symbol.dispose];
      if (async) inner = dispose;
    }
    if (typeof dispose !== "function") throw new TypeError("Object not disposable.");
    if (inner) dispose = function() {
      try {
        inner.call(this);
      } catch (e) {
        return Promise.reject(e);
      }
    };
    env.stack.push({ value, dispose, async });
  } else if (async) {
    env.stack.push({ async: true });
  }
  return value;
};
var __disposeResources$1 = /* @__PURE__ */ function(SuppressedError2) {
  return function(env) {
    function fail(e) {
      env.error = env.hasError ? new SuppressedError2(e, env.error, "An error was suppressed during disposal.") : e;
      env.hasError = true;
    }
    var r, s = 0;
    function next() {
      while (r = env.stack.pop()) {
        try {
          if (!r.async && s === 1) return s = 0, env.stack.push(r), Promise.resolve().then(next);
          if (r.dispose) {
            var result = r.dispose.call(r.value);
            if (r.async) return s |= 2, Promise.resolve(result).then(next, function(e) {
              fail(e);
              return next();
            });
          } else s |= 1;
        } catch (e) {
          fail(e);
        }
      }
      if (s === 1) return env.hasError ? Promise.reject(env.error) : Promise.resolve();
      if (env.hasError) throw env.error;
    }
    return next();
  };
}(typeof SuppressedError === "function" ? SuppressedError : function(error, suppressed, message) {
  var e = new Error(message);
  return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
});
let BidiBrowserContext = (() => {
  var _trustedEmitter_accessor_storage, _browser, _defaultViewport, _pages, _targets, _overrides, _BidiBrowserContext_instances, initialize_fn, createPage_fn, _a2;
  let _classSuper = main.BrowserContext;
  let _trustedEmitter_decorators;
  let _trustedEmitter_initializers = [];
  let _trustedEmitter_extraInitializers = [];
  return _a2 = class extends _classSuper {
    constructor(browser, userContext, options) {
      super();
      __privateAdd(this, _BidiBrowserContext_instances);
      __privateAdd(this, _trustedEmitter_accessor_storage, __runInitializers$3(this, _trustedEmitter_initializers, new main.EventEmitter()));
      __privateAdd(this, _browser, __runInitializers$3(this, _trustedEmitter_extraInitializers));
      __privateAdd(this, _defaultViewport);
      // This is public because of cookies.
      __publicField(this, "userContext");
      __privateAdd(this, _pages, /* @__PURE__ */ new WeakMap());
      __privateAdd(this, _targets, /* @__PURE__ */ new Map());
      __privateAdd(this, _overrides, []);
      __privateSet(this, _browser, browser);
      this.userContext = userContext;
      __privateSet(this, _defaultViewport, options.defaultViewport);
    }
    static from(browser, userContext, options) {
      var _a3;
      const context = new _a2(browser, userContext, options);
      __privateMethod(_a3 = context, _BidiBrowserContext_instances, initialize_fn).call(_a3);
      return context;
    }
    get trustedEmitter() {
      return __privateGet(this, _trustedEmitter_accessor_storage);
    }
    set trustedEmitter(value) {
      __privateSet(this, _trustedEmitter_accessor_storage, value);
    }
    targets() {
      return [...__privateGet(this, _targets).values()].flatMap(([target, frames]) => {
        return [target, ...frames.values()];
      });
    }
    async newPage() {
      const env_1 = { stack: [], error: void 0, hasError: false };
      try {
        const _guard = __addDisposableResource$1(env_1, await this.waitForScreenshotOperations(), false);
        const context = await this.userContext.createBrowsingContext(
          "tab"
          /* Bidi.BrowsingContext.CreateType.Tab */
        );
        const page = __privateGet(this, _pages).get(context);
        if (!page) {
          throw new Error("Page is not found");
        }
        if (__privateGet(this, _defaultViewport)) {
          try {
            await page.setViewport(__privateGet(this, _defaultViewport));
          } catch {
          }
        }
        return page;
      } catch (e_1) {
        env_1.error = e_1;
        env_1.hasError = true;
      } finally {
        __disposeResources$1(env_1);
      }
    }
    async close() {
      main.assert(this.userContext.id !== UserContext.DEFAULT, "Default BrowserContext cannot be closed!");
      try {
        await this.userContext.remove();
      } catch (error) {
        main.debugError(error);
      }
      __privateGet(this, _targets).clear();
    }
    browser() {
      return __privateGet(this, _browser);
    }
    async pages() {
      return [...this.userContext.browsingContexts].map((context) => {
        return __privateGet(this, _pages).get(context);
      });
    }
    async overridePermissions(origin, permissions) {
      const permissionsSet = new Set(permissions.map((permission) => {
        const protocolPermission = main.WEB_PERMISSION_TO_PROTOCOL_PERMISSION.get(permission);
        if (!protocolPermission) {
          throw new Error("Unknown permission: " + permission);
        }
        return permission;
      }));
      await Promise.all(Array.from(main.WEB_PERMISSION_TO_PROTOCOL_PERMISSION.keys()).map((permission) => {
        const result = this.userContext.setPermissions(
          origin,
          {
            name: permission
          },
          permissionsSet.has(permission) ? "granted" : "denied"
          /* Bidi.Permissions.PermissionState.Denied */
        );
        __privateGet(this, _overrides).push({ origin, permission });
        if (!permissionsSet.has(permission)) {
          return result.catch(main.debugError);
        }
        return result;
      }));
    }
    async clearPermissionOverrides() {
      const promises = __privateGet(this, _overrides).map(({ permission, origin }) => {
        return this.userContext.setPermissions(
          origin,
          {
            name: permission
          },
          "prompt"
          /* Bidi.Permissions.PermissionState.Prompt */
        ).catch(main.debugError);
      });
      __privateSet(this, _overrides, []);
      await Promise.all(promises);
    }
    get id() {
      if (this.userContext.id === UserContext.DEFAULT) {
        return void 0;
      }
      return this.userContext.id;
    }
    async cookies() {
      const cookies = await this.userContext.getCookies();
      return cookies.map((cookie) => {
        return bidiToPuppeteerCookie(cookie, true);
      });
    }
    async setCookie(...cookies) {
      await Promise.all(cookies.map(async (cookie) => {
        const bidiCookie = {
          domain: cookie.domain,
          name: cookie.name,
          value: {
            type: "string",
            value: cookie.value
          },
          ...cookie.path !== void 0 ? { path: cookie.path } : {},
          ...cookie.httpOnly !== void 0 ? { httpOnly: cookie.httpOnly } : {},
          ...cookie.secure !== void 0 ? { secure: cookie.secure } : {},
          ...cookie.sameSite !== void 0 ? { sameSite: convertCookiesSameSiteCdpToBiDi(cookie.sameSite) } : {},
          ...{ expiry: convertCookiesExpiryCdpToBiDi(cookie.expires) },
          // Chrome-specific properties.
          ...cdpSpecificCookiePropertiesFromPuppeteerToBidi(cookie, "sameParty", "sourceScheme", "priority", "url")
        };
        return await this.userContext.setCookie(bidiCookie, convertCookiesPartitionKeyFromPuppeteerToBiDi(cookie.partitionKey));
      }));
    }
  }, _trustedEmitter_accessor_storage = new WeakMap(), _browser = new WeakMap(), _defaultViewport = new WeakMap(), _pages = new WeakMap(), _targets = new WeakMap(), _overrides = new WeakMap(), _BidiBrowserContext_instances = new WeakSet(), initialize_fn = function() {
    for (const browsingContext of this.userContext.browsingContexts) {
      __privateMethod(this, _BidiBrowserContext_instances, createPage_fn).call(this, browsingContext);
    }
    this.userContext.on("browsingcontext", ({ browsingContext }) => {
      const page = __privateMethod(this, _BidiBrowserContext_instances, createPage_fn).call(this, browsingContext);
      if (browsingContext.originalOpener) {
        for (const context of this.userContext.browsingContexts) {
          if (context.id === browsingContext.originalOpener) {
            __privateGet(this, _pages).get(context).trustedEmitter.emit("popup", page);
          }
        }
      }
    });
    this.userContext.on("closed", () => {
      this.trustedEmitter.removeAllListeners();
    });
  }, createPage_fn = function(browsingContext) {
    const page = BidiPage.from(this, browsingContext);
    __privateGet(this, _pages).set(browsingContext, page);
    page.trustedEmitter.on("close", () => {
      __privateGet(this, _pages).delete(browsingContext);
    });
    const pageTarget = new BidiPageTarget(page);
    const pageTargets = /* @__PURE__ */ new Map();
    __privateGet(this, _targets).set(page, [pageTarget, pageTargets]);
    page.trustedEmitter.on("frameattached", (frame) => {
      const bidiFrame = frame;
      const target = new BidiFrameTarget(bidiFrame);
      pageTargets.set(bidiFrame, target);
      this.trustedEmitter.emit("targetcreated", target);
    });
    page.trustedEmitter.on("framenavigated", (frame) => {
      const bidiFrame = frame;
      const target = pageTargets.get(bidiFrame);
      if (target === void 0) {
        this.trustedEmitter.emit("targetchanged", pageTarget);
      } else {
        this.trustedEmitter.emit("targetchanged", target);
      }
    });
    page.trustedEmitter.on("framedetached", (frame) => {
      const bidiFrame = frame;
      const target = pageTargets.get(bidiFrame);
      if (target === void 0) {
        return;
      }
      pageTargets.delete(bidiFrame);
      this.trustedEmitter.emit("targetdestroyed", target);
    });
    page.trustedEmitter.on("workercreated", (worker) => {
      const bidiWorker = worker;
      const target = new BidiWorkerTarget(bidiWorker);
      pageTargets.set(bidiWorker, target);
      this.trustedEmitter.emit("targetcreated", target);
    });
    page.trustedEmitter.on("workerdestroyed", (worker) => {
      const bidiWorker = worker;
      const target = pageTargets.get(bidiWorker);
      if (target === void 0) {
        return;
      }
      pageTargets.delete(worker);
      this.trustedEmitter.emit("targetdestroyed", target);
    });
    page.trustedEmitter.on("close", () => {
      __privateGet(this, _targets).delete(page);
      this.trustedEmitter.emit("targetdestroyed", pageTarget);
    });
    this.trustedEmitter.emit("targetcreated", pageTarget);
    return page;
  }, (() => {
    const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
    _trustedEmitter_decorators = [main.bubble()];
    __esDecorate$3(_a2, null, _trustedEmitter_decorators, { kind: "accessor", name: "trustedEmitter", static: false, private: false, access: { has: (obj) => "trustedEmitter" in obj, get: (obj) => obj.trustedEmitter, set: (obj, value) => {
      obj.trustedEmitter = value;
    } }, metadata: _metadata }, _trustedEmitter_initializers, _trustedEmitter_extraInitializers);
    if (_metadata) Object.defineProperty(_a2, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
  })(), _a2;
})();
/**
 * @license
 * Copyright 2024 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
var __runInitializers$2 = function(thisArg, initializers, value) {
  var useValue = arguments.length > 2;
  for (var i = 0; i < initializers.length; i++) {
    value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
  }
  return useValue ? value : void 0;
};
var __esDecorate$2 = function(ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
  function accept(f) {
    if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected");
    return f;
  }
  var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
  var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
  var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
  var _, done = false;
  for (var i = decorators.length - 1; i >= 0; i--) {
    var context = {};
    for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
    for (var p in contextIn.access) context.access[p] = contextIn.access[p];
    context.addInitializer = function(f) {
      if (done) throw new TypeError("Cannot add initializers after decoration has completed");
      extraInitializers.push(accept(f || null));
    };
    var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
    if (kind === "accessor") {
      if (result === void 0) continue;
      if (result === null || typeof result !== "object") throw new TypeError("Object expected");
      if (_ = accept(result.get)) descriptor.get = _;
      if (_ = accept(result.set)) descriptor.set = _;
      if (_ = accept(result.init)) initializers.unshift(_);
    } else if (_ = accept(result)) {
      if (kind === "field") initializers.unshift(_);
      else descriptor[key] = _;
    }
  }
  if (target) Object.defineProperty(target, contextIn.name, descriptor);
  done = true;
};
var __addDisposableResource = function(env, value, async) {
  if (value !== null && value !== void 0) {
    if (typeof value !== "object" && typeof value !== "function") throw new TypeError("Object expected.");
    var dispose, inner;
    if (async) {
      if (!Symbol.asyncDispose) throw new TypeError("Symbol.asyncDispose is not defined.");
      dispose = value[Symbol.asyncDispose];
    }
    if (dispose === void 0) {
      if (!Symbol.dispose) throw new TypeError("Symbol.dispose is not defined.");
      dispose = value[Symbol.dispose];
      if (async) inner = dispose;
    }
    if (typeof dispose !== "function") throw new TypeError("Object not disposable.");
    if (inner) dispose = function() {
      try {
        inner.call(this);
      } catch (e) {
        return Promise.reject(e);
      }
    };
    env.stack.push({ value, dispose, async });
  } else if (async) {
    env.stack.push({ async: true });
  }
  return value;
};
var __disposeResources = /* @__PURE__ */ function(SuppressedError2) {
  return function(env) {
    function fail(e) {
      env.error = env.hasError ? new SuppressedError2(e, env.error, "An error was suppressed during disposal.") : e;
      env.hasError = true;
    }
    var r, s = 0;
    function next() {
      while (r = env.stack.pop()) {
        try {
          if (!r.async && s === 1) return s = 0, env.stack.push(r), Promise.resolve().then(next);
          if (r.dispose) {
            var result = r.dispose.call(r.value);
            if (r.async) return s |= 2, Promise.resolve(result).then(next, function(e) {
              fail(e);
              return next();
            });
          } else s |= 1;
        } catch (e) {
          fail(e);
        }
      }
      if (s === 1) return env.hasError ? Promise.reject(env.error) : Promise.resolve();
      if (env.hasError) throw env.error;
    }
    return next();
  };
}(typeof SuppressedError === "function" ? SuppressedError : function(error, suppressed, message) {
  var e = new Error(message);
  return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
});
let Browser = (() => {
  var _closed, _reason, _disposables, _userContexts, _sharedWorkers, _Browser_instances, initialize_fn, syncUserContexts_fn, syncBrowsingContexts_fn, createUserContext_fn, _a2;
  let _classSuper = main.EventEmitter;
  let _instanceExtraInitializers = [];
  let _dispose_decorators;
  let _close_decorators;
  let _addPreloadScript_decorators;
  let _removeIntercept_decorators;
  let _removePreloadScript_decorators;
  let _createUserContext_decorators;
  let _installExtension_decorators;
  let _uninstallExtension_decorators;
  return _a2 = class extends _classSuper {
    constructor(session) {
      super();
      __privateAdd(this, _Browser_instances);
      __privateAdd(this, _closed, (__runInitializers$2(this, _instanceExtraInitializers), false));
      __privateAdd(this, _reason);
      __privateAdd(this, _disposables, new main.DisposableStack());
      __privateAdd(this, _userContexts, /* @__PURE__ */ new Map());
      __publicField(this, "session");
      __privateAdd(this, _sharedWorkers, /* @__PURE__ */ new Map());
      this.session = session;
    }
    static async from(session) {
      var _a3;
      const browser = new _a2(session);
      await __privateMethod(_a3 = browser, _Browser_instances, initialize_fn).call(_a3);
      return browser;
    }
    get closed() {
      return __privateGet(this, _closed);
    }
    get defaultUserContext() {
      return __privateGet(this, _userContexts).get(UserContext.DEFAULT);
    }
    get disconnected() {
      return __privateGet(this, _reason) !== void 0;
    }
    get disposed() {
      return this.disconnected;
    }
    get userContexts() {
      return __privateGet(this, _userContexts).values();
    }
    dispose(reason, closed = false) {
      __privateSet(this, _closed, closed);
      __privateSet(this, _reason, reason);
      this[main.disposeSymbol]();
    }
    async close() {
      try {
        await this.session.send("browser.close", {});
      } finally {
        this.dispose("Browser already closed.", true);
      }
    }
    async addPreloadScript(functionDeclaration, options = {}) {
      const { result: { script } } = await this.session.send("script.addPreloadScript", {
        functionDeclaration,
        ...options,
        contexts: options.contexts?.map((context) => {
          return context.id;
        })
      });
      return script;
    }
    async removeIntercept(intercept) {
      await this.session.send("network.removeIntercept", {
        intercept
      });
    }
    async removePreloadScript(script) {
      await this.session.send("script.removePreloadScript", {
        script
      });
    }
    async createUserContext(options) {
      const proxyConfig = options.proxyServer === void 0 ? void 0 : {
        proxyType: "manual",
        httpProxy: options.proxyServer,
        sslProxy: options.proxyServer,
        noProxy: options.proxyBypassList
      };
      const { result: { userContext: context } } = await this.session.send("browser.createUserContext", {
        proxy: proxyConfig
      });
      return __privateMethod(this, _Browser_instances, createUserContext_fn).call(this, context);
    }
    async installExtension(path) {
      const { result: { extension } } = await this.session.send("webExtension.install", {
        extensionData: { type: "path", path }
      });
      return extension;
    }
    async uninstallExtension(id) {
      await this.session.send("webExtension.uninstall", { extension: id });
    }
    [(_dispose_decorators = [main.inertIfDisposed], _close_decorators = [main.throwIfDisposed((browser) => {
      return __privateGet(browser, _reason);
    })], _addPreloadScript_decorators = [main.throwIfDisposed((browser) => {
      return __privateGet(browser, _reason);
    })], _removeIntercept_decorators = [main.throwIfDisposed((browser) => {
      return __privateGet(browser, _reason);
    })], _removePreloadScript_decorators = [main.throwIfDisposed((browser) => {
      return __privateGet(browser, _reason);
    })], _createUserContext_decorators = [main.throwIfDisposed((browser) => {
      return __privateGet(browser, _reason);
    })], _installExtension_decorators = [main.throwIfDisposed((browser) => {
      return __privateGet(browser, _reason);
    })], _uninstallExtension_decorators = [main.throwIfDisposed((browser) => {
      return __privateGet(browser, _reason);
    })], main.disposeSymbol)]() {
      __privateGet(this, _reason) ?? __privateSet(this, _reason, "Browser was disconnected, probably because the session ended.");
      if (this.closed) {
        this.emit("closed", { reason: __privateGet(this, _reason) });
      }
      this.emit("disconnected", { reason: __privateGet(this, _reason) });
      __privateGet(this, _disposables).dispose();
      super[main.disposeSymbol]();
    }
  }, _closed = new WeakMap(), _reason = new WeakMap(), _disposables = new WeakMap(), _userContexts = new WeakMap(), _sharedWorkers = new WeakMap(), _Browser_instances = new WeakSet(), initialize_fn = async function() {
    const sessionEmitter = __privateGet(this, _disposables).use(new main.EventEmitter(this.session));
    sessionEmitter.once("ended", ({ reason }) => {
      this.dispose(reason);
    });
    sessionEmitter.on("script.realmCreated", (info) => {
      if (info.type !== "shared-worker") {
        return;
      }
      __privateGet(this, _sharedWorkers).set(info.realm, SharedWorkerRealm.from(this, info.realm, info.origin));
    });
    await __privateMethod(this, _Browser_instances, syncUserContexts_fn).call(this);
    await __privateMethod(this, _Browser_instances, syncBrowsingContexts_fn).call(this);
  }, syncUserContexts_fn = async function() {
    const { result: { userContexts } } = await this.session.send("browser.getUserContexts", {});
    for (const context of userContexts) {
      __privateMethod(this, _Browser_instances, createUserContext_fn).call(this, context.userContext);
    }
  }, syncBrowsingContexts_fn = async function() {
    const contextIds = /* @__PURE__ */ new Set();
    let contexts;
    {
      const env_1 = { stack: [], error: void 0, hasError: false };
      try {
        const sessionEmitter = __addDisposableResource(env_1, new main.EventEmitter(this.session), false);
        sessionEmitter.on("browsingContext.contextCreated", (info) => {
          contextIds.add(info.context);
        });
        const { result } = await this.session.send("browsingContext.getTree", {});
        contexts = result.contexts;
      } catch (e_1) {
        env_1.error = e_1;
        env_1.hasError = true;
      } finally {
        __disposeResources(env_1);
      }
    }
    for (const info of contexts) {
      if (!contextIds.has(info.context)) {
        this.session.emit("browsingContext.contextCreated", info);
      }
      if (info.children) {
        contexts.push(...info.children);
      }
    }
  }, createUserContext_fn = function(id) {
    const userContext = UserContext.create(this, id);
    __privateGet(this, _userContexts).set(userContext.id, userContext);
    const userContextEmitter = __privateGet(this, _disposables).use(new main.EventEmitter(userContext));
    userContextEmitter.once("closed", () => {
      userContextEmitter.removeAllListeners();
      __privateGet(this, _userContexts).delete(userContext.id);
    });
    return userContext;
  }, (() => {
    const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
    __esDecorate$2(_a2, null, _dispose_decorators, { kind: "method", name: "dispose", static: false, private: false, access: { has: (obj) => "dispose" in obj, get: (obj) => obj.dispose }, metadata: _metadata }, null, _instanceExtraInitializers);
    __esDecorate$2(_a2, null, _close_decorators, { kind: "method", name: "close", static: false, private: false, access: { has: (obj) => "close" in obj, get: (obj) => obj.close }, metadata: _metadata }, null, _instanceExtraInitializers);
    __esDecorate$2(_a2, null, _addPreloadScript_decorators, { kind: "method", name: "addPreloadScript", static: false, private: false, access: { has: (obj) => "addPreloadScript" in obj, get: (obj) => obj.addPreloadScript }, metadata: _metadata }, null, _instanceExtraInitializers);
    __esDecorate$2(_a2, null, _removeIntercept_decorators, { kind: "method", name: "removeIntercept", static: false, private: false, access: { has: (obj) => "removeIntercept" in obj, get: (obj) => obj.removeIntercept }, metadata: _metadata }, null, _instanceExtraInitializers);
    __esDecorate$2(_a2, null, _removePreloadScript_decorators, { kind: "method", name: "removePreloadScript", static: false, private: false, access: { has: (obj) => "removePreloadScript" in obj, get: (obj) => obj.removePreloadScript }, metadata: _metadata }, null, _instanceExtraInitializers);
    __esDecorate$2(_a2, null, _createUserContext_decorators, { kind: "method", name: "createUserContext", static: false, private: false, access: { has: (obj) => "createUserContext" in obj, get: (obj) => obj.createUserContext }, metadata: _metadata }, null, _instanceExtraInitializers);
    __esDecorate$2(_a2, null, _installExtension_decorators, { kind: "method", name: "installExtension", static: false, private: false, access: { has: (obj) => "installExtension" in obj, get: (obj) => obj.installExtension }, metadata: _metadata }, null, _instanceExtraInitializers);
    __esDecorate$2(_a2, null, _uninstallExtension_decorators, { kind: "method", name: "uninstallExtension", static: false, private: false, access: { has: (obj) => "uninstallExtension" in obj, get: (obj) => obj.uninstallExtension }, metadata: _metadata }, null, _instanceExtraInitializers);
    if (_metadata) Object.defineProperty(_a2, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
  })(), _a2;
})();
/**
 * @license
 * Copyright 2024 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
var __runInitializers$1 = function(thisArg, initializers, value) {
  var useValue = arguments.length > 2;
  for (var i = 0; i < initializers.length; i++) {
    value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
  }
  return useValue ? value : void 0;
};
var __esDecorate$1 = function(ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
  function accept(f) {
    if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected");
    return f;
  }
  var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
  var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
  var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
  var _, done = false;
  for (var i = decorators.length - 1; i >= 0; i--) {
    var context = {};
    for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
    for (var p in contextIn.access) context.access[p] = contextIn.access[p];
    context.addInitializer = function(f) {
      if (done) throw new TypeError("Cannot add initializers after decoration has completed");
      extraInitializers.push(accept(f || null));
    };
    var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
    if (kind === "accessor") {
      if (result === void 0) continue;
      if (result === null || typeof result !== "object") throw new TypeError("Object expected");
      if (_ = accept(result.get)) descriptor.get = _;
      if (_ = accept(result.set)) descriptor.set = _;
      if (_ = accept(result.init)) initializers.unshift(_);
    } else if (_ = accept(result)) {
      if (kind === "field") initializers.unshift(_);
      else descriptor[key] = _;
    }
  }
  if (target) Object.defineProperty(target, contextIn.name, descriptor);
  done = true;
};
let Session = (() => {
  var _reason, _disposables, _info, _connection_accessor_storage, _Session_instances, initialize_fn, _a2;
  let _classSuper = main.EventEmitter;
  let _instanceExtraInitializers = [];
  let _connection_decorators;
  let _connection_initializers = [];
  let _connection_extraInitializers = [];
  let _dispose_decorators;
  let _send_decorators;
  let _subscribe_decorators;
  let _addIntercepts_decorators;
  let _end_decorators;
  return _a2 = class extends _classSuper {
    constructor(connection, info) {
      super();
      __privateAdd(this, _Session_instances);
      __privateAdd(this, _reason, __runInitializers$1(this, _instanceExtraInitializers));
      __privateAdd(this, _disposables, new main.DisposableStack());
      __privateAdd(this, _info);
      __publicField(this, "browser");
      __privateAdd(this, _connection_accessor_storage, __runInitializers$1(this, _connection_initializers, void 0));
      __runInitializers$1(this, _connection_extraInitializers);
      __privateSet(this, _info, info);
      this.connection = connection;
    }
    static async from(connection, capabilities) {
      var _a3;
      const { result } = await connection.send("session.new", {
        capabilities
      });
      const session = new _a2(connection, result);
      await __privateMethod(_a3 = session, _Session_instances, initialize_fn).call(_a3);
      return session;
    }
    get connection() {
      return __privateGet(this, _connection_accessor_storage);
    }
    set connection(value) {
      __privateSet(this, _connection_accessor_storage, value);
    }
    get capabilities() {
      return __privateGet(this, _info).capabilities;
    }
    get disposed() {
      return this.ended;
    }
    get ended() {
      return __privateGet(this, _reason) !== void 0;
    }
    get id() {
      return __privateGet(this, _info).sessionId;
    }
    dispose(reason) {
      __privateSet(this, _reason, reason);
      this[main.disposeSymbol]();
    }
    /**
     * Currently, there is a 1:1 relationship between the session and the
     * session. In the future, we might support multiple sessions and in that
     * case we always needs to make sure that the session for the right session
     * object is used, so we implement this method here, although it's not defined
     * in the spec.
     */
    async send(method, params) {
      return await this.connection.send(method, params);
    }
    async subscribe(events2, contexts) {
      await this.send("session.subscribe", {
        events: events2,
        contexts
      });
    }
    async addIntercepts(events2, contexts) {
      await this.send("session.subscribe", {
        events: events2,
        contexts
      });
    }
    async end() {
      try {
        await this.send("session.end", {});
      } finally {
        this.dispose(`Session already ended.`);
      }
    }
    [(_connection_decorators = [main.bubble()], _dispose_decorators = [main.inertIfDisposed], _send_decorators = [main.throwIfDisposed((session) => {
      return __privateGet(session, _reason);
    })], _subscribe_decorators = [main.throwIfDisposed((session) => {
      return __privateGet(session, _reason);
    })], _addIntercepts_decorators = [main.throwIfDisposed((session) => {
      return __privateGet(session, _reason);
    })], _end_decorators = [main.throwIfDisposed((session) => {
      return __privateGet(session, _reason);
    })], main.disposeSymbol)]() {
      __privateGet(this, _reason) ?? __privateSet(this, _reason, "Session already destroyed, probably because the connection broke.");
      this.emit("ended", { reason: __privateGet(this, _reason) });
      __privateGet(this, _disposables).dispose();
      super[main.disposeSymbol]();
    }
  }, _reason = new WeakMap(), _disposables = new WeakMap(), _info = new WeakMap(), _connection_accessor_storage = new WeakMap(), _Session_instances = new WeakSet(), initialize_fn = async function() {
    this.browser = await Browser.from(this);
    const browserEmitter = __privateGet(this, _disposables).use(this.browser);
    browserEmitter.once("closed", ({ reason }) => {
      this.dispose(reason);
    });
    const seen = /* @__PURE__ */ new WeakSet();
    this.on("browsingContext.fragmentNavigated", (info) => {
      if (seen.has(info)) {
        return;
      }
      seen.add(info);
      this.emit("browsingContext.navigationStarted", info);
      this.emit("browsingContext.fragmentNavigated", info);
    });
  }, (() => {
    const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
    __esDecorate$1(_a2, null, _connection_decorators, { kind: "accessor", name: "connection", static: false, private: false, access: { has: (obj) => "connection" in obj, get: (obj) => obj.connection, set: (obj, value) => {
      obj.connection = value;
    } }, metadata: _metadata }, _connection_initializers, _connection_extraInitializers);
    __esDecorate$1(_a2, null, _dispose_decorators, { kind: "method", name: "dispose", static: false, private: false, access: { has: (obj) => "dispose" in obj, get: (obj) => obj.dispose }, metadata: _metadata }, null, _instanceExtraInitializers);
    __esDecorate$1(_a2, null, _send_decorators, { kind: "method", name: "send", static: false, private: false, access: { has: (obj) => "send" in obj, get: (obj) => obj.send }, metadata: _metadata }, null, _instanceExtraInitializers);
    __esDecorate$1(_a2, null, _subscribe_decorators, { kind: "method", name: "subscribe", static: false, private: false, access: { has: (obj) => "subscribe" in obj, get: (obj) => obj.subscribe }, metadata: _metadata }, null, _instanceExtraInitializers);
    __esDecorate$1(_a2, null, _addIntercepts_decorators, { kind: "method", name: "addIntercepts", static: false, private: false, access: { has: (obj) => "addIntercepts" in obj, get: (obj) => obj.addIntercepts }, metadata: _metadata }, null, _instanceExtraInitializers);
    __esDecorate$1(_a2, null, _end_decorators, { kind: "method", name: "end", static: false, private: false, access: { has: (obj) => "end" in obj, get: (obj) => obj.end }, metadata: _metadata }, null, _instanceExtraInitializers);
    if (_metadata) Object.defineProperty(_a2, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
  })(), _a2;
})();
/**
 * @license
 * Copyright 2022 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
var __esDecorate = function(ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
  function accept(f) {
    if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected");
    return f;
  }
  var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
  var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
  var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
  var _, done = false;
  for (var i = decorators.length - 1; i >= 0; i--) {
    var context = {};
    for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
    for (var p in contextIn.access) context.access[p] = contextIn.access[p];
    context.addInitializer = function(f) {
      if (done) throw new TypeError("Cannot add initializers after decoration has completed");
      extraInitializers.push(accept(f || null));
    };
    var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
    if (kind === "accessor") {
      if (result === void 0) continue;
      if (result === null || typeof result !== "object") throw new TypeError("Object expected");
      if (_ = accept(result.get)) descriptor.get = _;
      if (_ = accept(result.set)) descriptor.set = _;
      if (_ = accept(result.init)) initializers.unshift(_);
    } else if (_ = accept(result)) {
      if (kind === "field") initializers.unshift(_);
      else descriptor[key] = _;
    }
  }
  if (target) Object.defineProperty(target, contextIn.name, descriptor);
  done = true;
};
var __runInitializers = function(thisArg, initializers, value) {
  var useValue = arguments.length > 2;
  for (var i = 0; i < initializers.length; i++) {
    value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
  }
  return useValue ? value : void 0;
};
var __setFunctionName = function(f, name, prefix) {
  if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
  return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
let BidiBrowser = (() => {
  var _a2, _trustedEmitter_accessor_storage, _BidiBrowser_instances, trustedEmitter_get, trustedEmitter_set, _process, _closeCallback, _browserCore, _defaultViewport, _browserContexts, _target, _cdpConnection, _networkEnabled, initialize_fn, browserName_get, browserVersion_get, createBrowserContext_fn;
  let _classSuper = main.Browser;
  let _private_trustedEmitter_decorators;
  let _private_trustedEmitter_initializers = [];
  let _private_trustedEmitter_extraInitializers = [];
  let _private_trustedEmitter_descriptor;
  return _a2 = class extends _classSuper {
    constructor(browserCore, opts) {
      super();
      __privateAdd(this, _BidiBrowser_instances);
      __publicField(this, "protocol", "webDriverBiDi");
      __privateAdd(this, _trustedEmitter_accessor_storage, __runInitializers(this, _private_trustedEmitter_initializers, new main.EventEmitter()));
      __privateAdd(this, _process, __runInitializers(this, _private_trustedEmitter_extraInitializers));
      __privateAdd(this, _closeCallback);
      __privateAdd(this, _browserCore);
      __privateAdd(this, _defaultViewport);
      __privateAdd(this, _browserContexts, /* @__PURE__ */ new WeakMap());
      __privateAdd(this, _target, new BidiBrowserTarget(this));
      __privateAdd(this, _cdpConnection);
      __privateAdd(this, _networkEnabled);
      __privateSet(this, _process, opts.process);
      __privateSet(this, _closeCallback, opts.closeCallback);
      __privateSet(this, _browserCore, browserCore);
      __privateSet(this, _defaultViewport, opts.defaultViewport);
      __privateSet(this, _cdpConnection, opts.cdpConnection);
      __privateSet(this, _networkEnabled, opts.networkEnabled);
    }
    static async create(opts) {
      var _a3;
      const session = await Session.from(opts.connection, {
        firstMatch: opts.capabilities?.firstMatch,
        alwaysMatch: {
          ...opts.capabilities?.alwaysMatch,
          // Capabilities that come from Puppeteer's API take precedence.
          acceptInsecureCerts: opts.acceptInsecureCerts,
          unhandledPromptBehavior: {
            default: "ignore"
          },
          webSocketUrl: true,
          // Puppeteer with WebDriver BiDi does not support prerendering
          // yet because WebDriver BiDi behavior is not specified. See
          // https://github.com/w3c/webdriver-bidi/issues/321.
          "goog:prerenderingDisabled": true
        }
      });
      await session.subscribe((session.capabilities.browserName.toLocaleLowerCase().includes("firefox") ? _a2.subscribeModules : [..._a2.subscribeModules, ..._a2.subscribeCdpEvents]).filter((module2) => {
        if (!opts.networkEnabled) {
          return module2 !== "network" && module2 !== "goog:cdp.Network.requestWillBeSent";
        }
        return true;
      }));
      try {
        await session.send("network.addDataCollector", {
          dataTypes: [
            "response"
            /* Bidi.Network.DataType.Response */
          ],
          // Buffer size of 20 MB is equivalent to the CDP:
          maxEncodedDataSize: 20 * 1e3 * 1e3
          // 20 MB
        });
      } catch (err) {
        if (err instanceof main.ProtocolError) {
          main.debugError(err);
        } else {
          throw err;
        }
      }
      const browser = new _a2(session.browser, opts);
      __privateMethod(_a3 = browser, _BidiBrowser_instances, initialize_fn).call(_a3);
      return browser;
    }
    get cdpSupported() {
      return __privateGet(this, _cdpConnection) !== void 0;
    }
    get cdpConnection() {
      return __privateGet(this, _cdpConnection);
    }
    async userAgent() {
      return __privateGet(this, _browserCore).session.capabilities.userAgent;
    }
    get connection() {
      return __privateGet(this, _browserCore).session.connection;
    }
    wsEndpoint() {
      return this.connection.url;
    }
    async close() {
      if (this.connection.closed) {
        return;
      }
      try {
        await __privateGet(this, _browserCore).close();
        await __privateGet(this, _closeCallback)?.call(null);
      } catch (error) {
        main.debugError(error);
      } finally {
        this.connection.dispose();
      }
    }
    get connected() {
      return !__privateGet(this, _browserCore).disconnected;
    }
    process() {
      return __privateGet(this, _process) ?? null;
    }
    async createBrowserContext(options = {}) {
      const userContext = await __privateGet(this, _browserCore).createUserContext(options);
      return __privateMethod(this, _BidiBrowser_instances, createBrowserContext_fn).call(this, userContext);
    }
    async version() {
      return `${__privateGet(this, _BidiBrowser_instances, browserName_get)}/${__privateGet(this, _BidiBrowser_instances, browserVersion_get)}`;
    }
    browserContexts() {
      return [...__privateGet(this, _browserCore).userContexts].map((context) => {
        return __privateGet(this, _browserContexts).get(context);
      });
    }
    defaultBrowserContext() {
      return __privateGet(this, _browserContexts).get(__privateGet(this, _browserCore).defaultUserContext);
    }
    newPage() {
      return this.defaultBrowserContext().newPage();
    }
    installExtension(path) {
      return __privateGet(this, _browserCore).installExtension(path);
    }
    async uninstallExtension(id) {
      await __privateGet(this, _browserCore).uninstallExtension(id);
    }
    targets() {
      return [
        __privateGet(this, _target),
        ...this.browserContexts().flatMap((context) => {
          return context.targets();
        })
      ];
    }
    target() {
      return __privateGet(this, _target);
    }
    async disconnect() {
      try {
        await __privateGet(this, _browserCore).session.end();
      } catch (error) {
        main.debugError(error);
      } finally {
        this.connection.dispose();
      }
    }
    get debugInfo() {
      return {
        pendingProtocolErrors: this.connection.getPendingProtocolErrors()
      };
    }
    isNetworkEnabled() {
      return __privateGet(this, _networkEnabled);
    }
  }, _trustedEmitter_accessor_storage = new WeakMap(), _BidiBrowser_instances = new WeakSet(), trustedEmitter_get = function() {
    return _private_trustedEmitter_descriptor.get.call(this);
  }, trustedEmitter_set = function(value) {
    return _private_trustedEmitter_descriptor.set.call(this, value);
  }, _process = new WeakMap(), _closeCallback = new WeakMap(), _browserCore = new WeakMap(), _defaultViewport = new WeakMap(), _browserContexts = new WeakMap(), _target = new WeakMap(), _cdpConnection = new WeakMap(), _networkEnabled = new WeakMap(), initialize_fn = function() {
    for (const userContext of __privateGet(this, _browserCore).userContexts) {
      __privateMethod(this, _BidiBrowser_instances, createBrowserContext_fn).call(this, userContext);
    }
    __privateGet(this, _browserCore).once("disconnected", () => {
      __privateGet(this, _BidiBrowser_instances, trustedEmitter_get).emit("disconnected", void 0);
      __privateGet(this, _BidiBrowser_instances, trustedEmitter_get).removeAllListeners();
    });
    __privateGet(this, _process)?.once("close", () => {
      __privateGet(this, _browserCore).dispose("Browser process exited.", true);
      this.connection.dispose();
    });
  }, browserName_get = function() {
    return __privateGet(this, _browserCore).session.capabilities.browserName;
  }, browserVersion_get = function() {
    return __privateGet(this, _browserCore).session.capabilities.browserVersion;
  }, createBrowserContext_fn = function(userContext) {
    const browserContext = BidiBrowserContext.from(this, userContext, {
      defaultViewport: __privateGet(this, _defaultViewport)
    });
    __privateGet(this, _browserContexts).set(userContext, browserContext);
    browserContext.trustedEmitter.on("targetcreated", (target) => {
      __privateGet(this, _BidiBrowser_instances, trustedEmitter_get).emit("targetcreated", target);
    });
    browserContext.trustedEmitter.on("targetchanged", (target) => {
      __privateGet(this, _BidiBrowser_instances, trustedEmitter_get).emit("targetchanged", target);
    });
    browserContext.trustedEmitter.on("targetdestroyed", (target) => {
      __privateGet(this, _BidiBrowser_instances, trustedEmitter_get).emit("targetdestroyed", target);
    });
    return browserContext;
  }, (() => {
    const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
    _private_trustedEmitter_decorators = [main.bubble()];
    __esDecorate(_a2, _private_trustedEmitter_descriptor = { get: __setFunctionName(function() {
      return __privateGet(this, _trustedEmitter_accessor_storage);
    }, "#trustedEmitter", "get"), set: __setFunctionName(function(value) {
      __privateSet(this, _trustedEmitter_accessor_storage, value);
    }, "#trustedEmitter", "set") }, _private_trustedEmitter_decorators, { kind: "accessor", name: "#trustedEmitter", static: false, private: true, access: { has: (obj) => __privateIn(_BidiBrowser_instances, obj), get: (obj) => __privateGet(obj, _BidiBrowser_instances, trustedEmitter_get), set: (obj, value) => {
      __privateSet(obj, _BidiBrowser_instances, value, trustedEmitter_set);
    } }, metadata: _metadata }, _private_trustedEmitter_initializers, _private_trustedEmitter_extraInitializers);
    if (_metadata) Object.defineProperty(_a2, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
  })(), __publicField(_a2, "subscribeModules", [
    "browsingContext",
    "network",
    "log",
    "script",
    "input"
  ]), __publicField(_a2, "subscribeCdpEvents", [
    // Coverage
    "goog:cdp.Debugger.scriptParsed",
    "goog:cdp.CSS.styleSheetAdded",
    "goog:cdp.Runtime.executionContextsCleared",
    // Tracing
    "goog:cdp.Tracing.tracingComplete",
    // TODO: subscribe to all CDP events in the future.
    "goog:cdp.Network.requestWillBeSent",
    "goog:cdp.Debugger.scriptParsed",
    "goog:cdp.Page.screencastFrame"
  ]), _a2;
})();
exports.BidiBrowser = BidiBrowser;
exports.BidiBrowserContext = BidiBrowserContext;
exports.BidiConnection = BidiConnection;
exports.BidiElementHandle = BidiElementHandle;
exports.BidiFrame = BidiFrame;
exports.BidiFrameRealm = BidiFrameRealm;
exports.BidiHTTPRequest = BidiHTTPRequest;
exports.BidiHTTPResponse = BidiHTTPResponse;
exports.BidiJSHandle = BidiJSHandle;
exports.BidiKeyboard = BidiKeyboard;
exports.BidiMouse = BidiMouse;
exports.BidiPage = BidiPage;
exports.BidiRealm = BidiRealm;
exports.BidiTouchscreen = BidiTouchscreen;
exports.BidiWorkerRealm = BidiWorkerRealm;
exports.bidiToPuppeteerCookie = bidiToPuppeteerCookie;
exports.cdpSpecificCookiePropertiesFromPuppeteerToBidi = cdpSpecificCookiePropertiesFromPuppeteerToBidi;
exports.connectBidiOverCdp = connectBidiOverCdp;
exports.convertCookiesExpiryCdpToBiDi = convertCookiesExpiryCdpToBiDi;
exports.convertCookiesPartitionKeyFromPuppeteerToBiDi = convertCookiesPartitionKeyFromPuppeteerToBiDi;
exports.convertCookiesSameSiteCdpToBiDi = convertCookiesSameSiteCdpToBiDi;
exports.requests = requests;
//# sourceMappingURL=bidi-CS11U2XU.js.map
