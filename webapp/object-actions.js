/* jshint node: true, esnext: true */

module.exports = (dispatch) => {

  function requestObject(store, type, hash) {
    dispatch({ action : 'OBJECT_LOAD_REQUESTED', hash });
    store.loadAs(type, hash).then(
        body => dispatch({ action : 'OBJECT_LOADED', hash, type, body }),
        error => dispatch({ action : 'OBJECT_FAILED_TO_LOAD', hash, type, error })
      );
  }

  function requestReference(store, ref) {
    dispatch({ action : 'REFERENCE_LOAD_REQUESTED', ref });
    store.readRef(ref).then(
        commitHash => dispatch({ action : 'REFERENCE_LOADED', ref, commitHash }),
        error => dispatch({ action : 'REFERENCE_FAILED_TO_LOAD', ref, error })
      );
  }

  return { requestObject, requestReference };
};
