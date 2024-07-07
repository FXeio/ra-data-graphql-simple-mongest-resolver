"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProjectionFromGraphQlInfo = void 0;
const lodash_1 = require("lodash");
const getProjectionFromGraphQlInfo = (info, virtualFieldDeps, discriminatorRequiredFields) => {
    var _a;
    const fieldNodes = info.fieldNodes;
    if (fieldNodes.length !== 1) {
        console.warn(fieldNodes);
        throw Error(`Unexpected: fieldNodes.length === ${fieldNodes.length}`);
    }
    const selections = (_a = fieldNodes[0].selectionSet) === null || _a === void 0 ? void 0 : _a.selections;
    if (!selections) {
        console.warn(fieldNodes);
        throw Error(`Unexpected: no selections in selectionSet`);
    }
    const allFields = resolveSelectionsFields(selections, info.fragments);
    const allRealFields = (0, lodash_1.chain)(allFields)
        .map((fieldName) => virtualFieldDeps[fieldName] || fieldName)
        .flatten()
        .push(...discriminatorRequiredFields)
        .uniq()
        .value();
    return Object.assign({ _id: false }, (0, lodash_1.zipObject)(allRealFields, allRealFields.map(() => true)));
};
exports.getProjectionFromGraphQlInfo = getProjectionFromGraphQlInfo;
const resolveSelectionsFields = (selections, fragmentsByName) => {
    return (0, lodash_1.chain)(selections)
        .map((selection) => {
        switch (selection.kind) {
            case 'Field': {
                const fieldName = selection.name.value;
                return fieldName;
            }
            case 'FragmentSpread': {
                const fragmentName = selection.name.value;
                const fragment = fragmentsByName[fragmentName];
                if (!fragment) {
                    throw Error(`Could not resolve fragment ${fragmentName}`);
                }
                return resolveSelectionsFields(fragment.selectionSet.selections, fragmentsByName);
            }
            case 'InlineFragment': {
                return resolveSelectionsFields(selection.selectionSet.selections, fragmentsByName);
            }
            default:
                throw Error(`Unsupported selection.kind ${selection.kind}`);
        }
    })
        .flatten()
        .uniq()
        .value();
};
//# sourceMappingURL=getProjectionFromGraphQlInfo.js.map