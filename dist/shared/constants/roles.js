"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ALL_ROLES = exports.UserRole = void 0;
var UserRole;
(function (UserRole) {
    UserRole["CUSTOMER"] = "CUSTOMER";
    UserRole["OWNER"] = "OWNER";
    UserRole["ENGINEER"] = "ENGINEER";
})(UserRole || (exports.UserRole = UserRole = {}));
exports.ALL_ROLES = [UserRole.CUSTOMER, UserRole.OWNER, UserRole.ENGINEER];
