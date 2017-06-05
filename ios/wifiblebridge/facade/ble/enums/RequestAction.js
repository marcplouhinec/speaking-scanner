/**
 * Supported request actions.
 *
 * @readonly
 * @enum {number}
 */
var RequestAction = {
    GET_NB_DOCUMENTS: 1,
    GET_DOCUMENT_NAMES_BY_INDEX_AND_COUNT: 2,
    GET_DOCUMENT_PREVIEW_BY_INDEX: 3,
	GET_COMPRESSED_DOCUMENT_BY_INDEX: 4
};

module.exports = RequestAction;