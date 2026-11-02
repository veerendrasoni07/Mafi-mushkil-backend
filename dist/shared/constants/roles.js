"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ALL_ROLES = exports.UserRole = void 0;
exports.isAdminRole = isAdminRole;
var UserRole;
(function (UserRole) {
    UserRole["CUSTOMER"] = "CUSTOMER";
    UserRole["ENGINEER"] = "ENGINEER";
    UserRole["ADMIN"] = "ADMIN";
    // Backward-compatible alias for existing records and tokens
    UserRole["OWNER"] = "OWNER";
})(UserRole || (exports.UserRole = UserRole = {}));
exports.ALL_ROLES = [
    UserRole.CUSTOMER,
    UserRole.ENGINEER,
    UserRole.ADMIN,
    UserRole.OWNER,
];
function isAdminRole(role) {
    return role === UserRole.ADMIN || role === UserRole.OWNER;
}
