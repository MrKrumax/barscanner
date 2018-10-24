"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var barcodescanner_common_1 = require("./barcodescanner-common");
var utils = require("tns-core-modules/utils/utils");
var frame = require("tns-core-modules/ui/frame");
var BarcodeScannerView = /** @class */ (function (_super) {
    __extends(BarcodeScannerView, _super);
    function BarcodeScannerView() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    BarcodeScannerView.prototype.createNativeView = function () {
        var v = _super.prototype.createNativeView.call(this);
        this.initView();
        return v;
    };
    BarcodeScannerView.prototype.initView = function () {
        var types = getBarcodeTypes(this.formats);
        this._reader = QRCodeReader.readerWithMetadataObjectTypes(types);
        var torch = false;
        var flip = false;
        var closeButtonLabel = null;
        var cancelLabelBackgroundColor = null;
        if (this.preferFrontCamera) {
            this._reader.switchDeviceInput();
        }
        this._scanner = QRCodeReaderViewController.readerWithCancelButtonTitleCodeReaderStartScanningAtLoadShowSwitchCameraButtonShowTorchButtonCancelButtonBackgroundColor(closeButtonLabel, this._reader, true, flip, torch, cancelLabelBackgroundColor);
        this._scanner.modalPresentationStyle = 3 /* CurrentContext */;
        var that = this;
        var delegate = QRCodeReaderDelegateImpl.initWithOwner(new WeakRef(this));
        delegate.setCallback(this.beepOnScan, true, this.reportDuplicates, function (text, format) {
            that.notify({
                eventName: barcodescanner_common_1.BarcodeScannerView.scanResultEvent,
                object: that,
                format: format,
                text: text
            });
        });
        this._scanner.delegate = delegate;
        if (this.ios) {
            this.ios.layer.insertSublayerAtIndex(this._reader.previewLayer, 0);
            this._reader.startScanning();
        }
    };
    BarcodeScannerView.prototype.onLayout = function (left, top, right, bottom) {
        _super.prototype.onLayout.call(this, left, top, right, bottom);
        if (this.ios) {
            this._reader.previewLayer.frame = this.ios.layer.bounds;
        }
    };
    return BarcodeScannerView;
}(barcodescanner_common_1.BarcodeScannerView));
exports.BarcodeScannerView = BarcodeScannerView;
var BarcodeScanner = /** @class */ (function () {
    function BarcodeScanner() {
        this._device = AVCaptureDevice.defaultDeviceWithMediaType(AVMediaTypeVideo);
        if (this._device && this._device.hasTorch && this._device.hasFlash) {
            this._observer = VolumeObserverClass.alloc();
            this._observer["_owner"] = this;
        }
    }
    BarcodeScanner.prototype._hasCameraPermission = function () {
        var authStatus = AVCaptureDevice.authorizationStatusForMediaType(AVMediaTypeVideo);
        return authStatus === 3 /* Authorized */;
    };
    BarcodeScanner.prototype._hasDeniedCameraPermission = function () {
        var authStatus = AVCaptureDevice.authorizationStatusForMediaType(AVMediaTypeVideo);
        return authStatus === 2 /* Denied */ || authStatus === 1 /* Restricted */;
    };
    BarcodeScanner.prototype._addVolumeObserver = function () {
        if (!this._observer) {
            return;
        }
        this._audioSession = utils.ios.getter(AVAudioSession, AVAudioSession.sharedInstance);
        this._audioSession.setActiveError(true);
        this._currentVolume = this._audioSession.outputVolume;
        if (!this._observerActive) {
            this._audioSession.addObserverForKeyPathOptionsContext(this._observer, "outputVolume", 0, null);
            this._observerActive = true;
        }
    };
    BarcodeScanner.prototype._removeVolumeObserver = function () {
        try {
            if (this._observerActive) {
                this._observerActive = false;
                this._audioSession.removeObserverForKeyPath(this._observer, "outputVolume");
            }
        }
        catch (ignore) {
        }
    };
    BarcodeScanner.prototype._enableTorch = function () {
        this._device.lockForConfiguration();
        this._device.setTorchModeOnWithLevelError(AVCaptureMaxAvailableTorchLevel);
        this._device.flashMode = 1 /* On */;
        this._device.unlockForConfiguration();
    };
    BarcodeScanner.prototype._disableTorch = function () {
        this._device.lockForConfiguration();
        this._device.torchMode = 0 /* Off */;
        this._device.flashMode = 0 /* Off */;
        this._device.unlockForConfiguration();
    };
    BarcodeScanner.prototype.available = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            resolve(!!_this._device);
        });
    };
    BarcodeScanner.prototype.hasCameraPermission = function () {
        var _this = this;
        return new Promise(function (resolve) {
            resolve(_this._hasCameraPermission());
        });
    };
    BarcodeScanner.prototype.requestCameraPermission = function () {
        return new Promise(function (resolve) {
            // this will trigger the prompt on iOS 10+
            QRCodeReader.isAvailable();
            resolve();
        });
    };
    BarcodeScanner.prototype.stop = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            try {
                var app_1 = utils.ios.getter(UIApplication, UIApplication.sharedApplication);
                app_1.keyWindow.rootViewController.dismissViewControllerAnimatedCompletion(true, null);
                _this._removeVolumeObserver();
                _this._closeCallback && _this._closeCallback();
                resolve();
            }
            catch (ex) {
                reject(ex);
            }
        });
    };
    BarcodeScanner.prototype.scan = function (arg) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            try {
                // only need for denied permission as conveniently, this method will auto-request permission upon scan
                if (_this._hasDeniedCameraPermission()) {
                    if (arg.openSettingsIfPermissionWasPreviouslyDenied) {
                        utils.ios.getter(UIApplication, UIApplication.sharedApplication).openURL(NSURL.URLWithString(UIApplicationOpenSettingsURLString));
                    }
                    reject("The user previously denied permission to access the camera.");
                    return;
                }
                _this._addVolumeObserver();
                arg = arg || {};
                var closeButtonLabel = arg.cancelLabel || "Close";
                var isContinuous_1 = typeof arg.continuousScanCallback === "function";
                _this._closeCallback = arg.closeCallback;
                var types = getBarcodeTypes(arg.formats);
                var reader = QRCodeReader.readerWithMetadataObjectTypes(types);
                if (arg.preferFrontCamera && reader.hasFrontDevice()) {
                    reader.switchDeviceInput();
                }
                var torch = arg.showTorchButton;
                var flip = arg.showFlipCameraButton;
                var startScanningAtLoad = true;
                _this._scanner = QRCodeReaderViewController.readerWithCancelButtonTitleCodeReaderStartScanningAtLoadShowSwitchCameraButtonShowTorchButtonCancelButtonBackgroundColor(closeButtonLabel, reader, startScanningAtLoad, flip, torch, arg.cancelLabelBackgroundColor);
                _this._scanner.modalPresentationStyle = 2 /* FormSheet */;
                _this._scanDelegate = QRCodeReaderDelegateImpl.initWithOwner(new WeakRef(_this));
                _this._scanner.delegate = _this._scanDelegate;
                _this._scanDelegate.setCallback(arg.beepOnScan !== false, isContinuous_1, arg.reportDuplicates, function (text, format) {
                    // invoke the callback / promise
                    if (text === undefined) {
                        _this._removeVolumeObserver();
                        _this._closeCallback && _this._closeCallback();
                        reject("Scan aborted");
                    }
                    else {
                        var result = {
                            format: format,
                            text: text
                        };
                        if (isContinuous_1) {
                            arg.continuousScanCallback(result);
                        }
                        else {
                            _this._removeVolumeObserver();
                            _this._closeCallback && _this._closeCallback();
                            resolve(result);
                        }
                    }
                });
                if (_this._device && _this._device.autoFocusRangeRestrictionSupported) {
                    _this._device.lockForConfiguration();
                    _this._device.autoFocusRangeRestriction = 1 /* Near */;
                    if (_this._device.smoothAutoFocusSupported) {
                        _this._device.smoothAutoFocusEnabled = true;
                    }
                    _this._device.unlockForConfiguration();
                }
                var topMostFrame = frame.topmost();
                if (topMostFrame) {
                    var vc = topMostFrame.currentPage && topMostFrame.currentPage.ios;
                    if (vc) {
                        vc.presentViewControllerAnimatedCompletion(_this._scanner, true, function () {
                            if (arg.torchOn) {
                                _this._enableTorch();
                            }
                        });
                    }
                }
            }
            catch (ex) {
                console.log("Error in barcodescanner.scan: " + ex);
                reject(ex);
            }
        });
    };
    return BarcodeScanner;
}());
exports.BarcodeScanner = BarcodeScanner;
var getBarcodeTypes = function (formatsString) {
    var types = [];
    if (formatsString) {
        var formats = formatsString.split(",");
        for (var _i = 0, formats_1 = formats; _i < formats_1.length; _i++) {
            var format = formats_1[_i];
            format = format.trim();
            if (format === "QR_CODE")
                types.push(AVMetadataObjectTypeQRCode);
            else if (format === "PDF_417")
                types.push(AVMetadataObjectTypePDF417Code);
            else if (format === "AZTEC")
                types.push(AVMetadataObjectTypeAztecCode);
            else if (format === "UPC_E")
                types.push(AVMetadataObjectTypeUPCECode);
            else if (format === "CODE_39")
                types.push(AVMetadataObjectTypeCode39Code);
            else if (format === "CODE_39_MOD_43")
                types.push(AVMetadataObjectTypeCode39Mod43Code);
            else if (format === "CODE_93")
                types.push(AVMetadataObjectTypeCode93Code);
            else if (format === "CODE_128")
                types.push(AVMetadataObjectTypeCode128Code);
            else if (format === "DATA_MATRIX")
                types.push(AVMetadataObjectTypeDataMatrixCode);
            else if (format === "EAN_8")
                types.push(AVMetadataObjectTypeEAN8Code);
            else if (format === "EAN_13")
                types.push(AVMetadataObjectTypeEAN13Code);
            else if (format === "ITF")
                types.push(AVMetadataObjectTypeITF14Code);
        }
    }
    else {
        types.push(AVMetadataObjectTypeUPCECode, AVMetadataObjectTypeCode39Code, AVMetadataObjectTypeCode39Mod43Code, AVMetadataObjectTypeEAN13Code, AVMetadataObjectTypeEAN8Code, AVMetadataObjectTypeCode93Code, AVMetadataObjectTypeCode128Code, AVMetadataObjectTypeDataMatrixCode, AVMetadataObjectTypeITF14Code, AVMetadataObjectTypePDF417Code, AVMetadataObjectTypeQRCode, AVMetadataObjectTypeAztecCode);
    }
    return types;
};
var QRCodeReaderDelegateImpl = /** @class */ (function (_super) {
    __extends(QRCodeReaderDelegateImpl, _super);
    function QRCodeReaderDelegateImpl() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        // initializing this value may prevent recognizing too quickly
        _this._lastScanResultTs = new Date().getTime();
        return _this;
    }
    QRCodeReaderDelegateImpl.initWithOwner = function (owner) {
        var delegate = QRCodeReaderDelegateImpl.new();
        delegate._owner = owner;
        return delegate;
    };
    QRCodeReaderDelegateImpl.prototype.setCallback = function (beepOnScan, isContinuous, reportDuplicates, callback) {
        this._isContinuous = isContinuous;
        this._reportDuplicates = reportDuplicates;
        this._callback = callback;
        this._beepOnScan = beepOnScan;
        if (this._beepOnScan) {
            var barcodeBundlePath = NSBundle.bundleWithIdentifier("com.telerik.BarcodeScannerFramework").bundlePath;
            this._player = new AVAudioPlayer({ contentsOfURL: NSURL.fileURLWithPath(barcodeBundlePath + "/beep.caf") });
            this._player.numberOfLoops = 1;
            this._player.volume = 0.7; // this is not the actual volume, as that really depends on the device volume
            this._player.prepareToPlay();
        }
    };
    QRCodeReaderDelegateImpl.prototype.readerDidCancel = function (reader) {
        var app = utils.ios.getter(UIApplication, UIApplication.sharedApplication);
        app.keyWindow.rootViewController.dismissViewControllerAnimatedCompletion(true, null);
        this._callback();
    };
    QRCodeReaderDelegateImpl.prototype.readerDidScanResultForType = function (reader, result, type) {
        var validResult = false;
        if (this._isContinuous) {
            if (!this._scannedArray) {
                this._scannedArray = Array();
            }
            // don't report duplicates unless explicitly requested
            var newResult = this._scannedArray.indexOf("[" + result + "][" + type + "]") === -1;
            if (newResult || this._reportDuplicates) {
                var now = new Date().getTime();
                // prevent flooding the callback
                if (now - this._lastScanResultTs < 1700) {
                    return;
                }
                this._lastScanResultTs = now;
                validResult = true;
                this._scannedArray.push("[" + result + "][" + type + "]");
                this._callback(result, type);
            }
        }
        else {
            validResult = true;
            var app_2 = utils.ios.getter(UIApplication, UIApplication.sharedApplication);
            app_2.keyWindow.rootViewController.dismissViewControllerAnimatedCompletion(true, null);
            this._callback(result, type);
        }
        if (validResult && this._player) {
            this._player.play();
        }
    };
    QRCodeReaderDelegateImpl.ObjCProtocols = [QRCodeReaderDelegate];
    return QRCodeReaderDelegateImpl;
}(NSObject));
var VolumeObserverClass = /** @class */ (function (_super) {
    __extends(VolumeObserverClass, _super);
    function VolumeObserverClass() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    VolumeObserverClass.prototype.observeValueForKeyPathOfObjectChangeContext = function (path, obj, change, context) {
        if (path === "outputVolume") {
            var volumeLevel = utils.ios.getter(MPMusicPlayerController, MPMusicPlayerController.applicationMusicPlayer).volume;
            if (volumeLevel > this["_owner"]._currentVolume) {
                // volume up button pressed, so enable torch
                this["_owner"]._enableTorch();
            }
            else {
                // volume down button pressed, so disable torch
                this["_owner"]._disableTorch();
            }
            this["_owner"]._currentVolume = volumeLevel;
        }
    };
    return VolumeObserverClass;
}(NSObject));
