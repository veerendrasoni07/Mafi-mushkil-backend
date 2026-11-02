"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComplaintStatus = exports.ALL_REQUEST_STATUSES = exports.RequestStatus = void 0;
var RequestStatus;
(function (RequestStatus) {
    RequestStatus["OPEN"] = "OPEN";
    RequestStatus["ASSIGNED"] = "ASSIGNED";
    RequestStatus["RESOLVED"] = "RESOLVED";
})(RequestStatus || (exports.RequestStatus = RequestStatus = {}));
exports.ALL_REQUEST_STATUSES = [
    RequestStatus.OPEN,
    RequestStatus.ASSIGNED,
    RequestStatus.RESOLVED,
];
var ComplaintStatus;
(function (ComplaintStatus) {
    ComplaintStatus["OPEN"] = "OPEN";
    ComplaintStatus["REVIEWED"] = "REVIEWED";
    ComplaintStatus["RESOLVED"] = "RESOLVED";
})(ComplaintStatus || (exports.ComplaintStatus = ComplaintStatus = {}));
