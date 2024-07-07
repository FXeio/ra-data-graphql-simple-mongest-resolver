"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DecorateIf = exports.NoopDecorator = void 0;
const NoopDecorator = (target, propertyKey, descriptor) => descriptor;
exports.NoopDecorator = NoopDecorator;
function DecorateIf(condition, decorator) {
    return condition ? decorator : exports.NoopDecorator;
}
exports.DecorateIf = DecorateIf;
//# sourceMappingURL=decorators.js.map