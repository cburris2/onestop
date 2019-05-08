import _ from 'lodash'
import {buildSearchAction, buildGetAction} from './SearchActions'
import {showErrors} from '../ErrorActions'

import {assembleSearchRequest, encodeQueryString} from '../../utils/queryUtils'
import {collectionGetDetailStart,collectionGetDetailComplete, collectionGetDetailError} from '../get/CollectionDetailRequestActions'
import {
  collectionSearchStart,
  collectionSearchComplete,
  collectionSearchError,
} from './CollectionRequestActions'
import {
  collectionClearFacets,
  collectionClearSelectedIds,
  collectionToggleSelectedId,
  collectionUpdateFilters,
} from './CollectionFilterActions'
import {
  collectionMetadataReceived,
  collectionUpdateTotal,
} from './CollectionResultActions'

export const triggerCollectionSearch = (
  clearPreviousResults = false,
  retrieveFacets = true
) => {
  // TODO rename to collection something something
  const bodyBuilder = state => {
    const body = assembleSearchRequest(state, false, retrieveFacets)
    const inFlight =
      state.search.collectionRequest.collectionSearchRequestInFlight
    const hasQueries = body && body.queries && body.queries.length > 0
    const hasFilters = body && body.filters && body.filters.length > 0
    if (inFlight || !(hasQueries || hasFilters)) {
      return undefined
    }
    return body
  }
  const prefetchHandler = dispatch => {
    // dispatch(showLoading())
    // dispatch(collectionSearchRequest())
    dispatch(collectionSearchStart())
  }
  const successHandler = (dispatch, payload) => {
    const result = _.reduce(
      payload.data,
      (map, resource) => {
        return map.set(
          resource.id,
          _.assign({type: resource.type}, resource.attributes)
        )
      },
      new Map()
    )

    // if (retrieveFacets) {
    //   dispatch(collectionMetadataReceived(payload.meta))
    // }
    // dispatch(collectionUpdateTotal(payload.meta.total))
    // dispatch(collectionSearchSuccess(result))
    // dispatch(hideLoading())
    dispatch(
      collectionSearchComplete(
        clearPreviousResults,
        payload.meta.total,
        result,
        retrieveFacets ? payload.meta : null
      )
    )
  }
  const errorHandler = (dispatch, e) => {
    // dispatch(hideLoading())
    // dispatch(showErrors(e.errors || e))
    // dispatch(collectionClearFacets())
    // dispatch(collectionSearchSuccess(new Map()))

    // dispatch(showErrors(e.errors || e)) // TODO show errors
    dispatch(collectionSearchError(e.errors || e))
  }

  return buildSearchAction(
    'collection',
    bodyBuilder,
    prefetchHandler,
    successHandler,
    errorHandler
  )
}

export const getCollection = collectionId => {
  const prefetchHandler = dispatch => {
    // dispatch(showLoading())
    dispatch(collectionGetDetailStart(collectionId)) // TODO
  }

  const successHandler = (dispatch, payload) => {
    dispatch(collectionGetDetailComplete(payload.data[0], payload.meta))
    dispatch(hideLoading())
  }

  const errorHandler = (dispatch, e) => {
    // dispatch(hideLoading())
    dispatch(showErrors(e.errors || e))
    dispatch(collectionGetDetailError(e.errors || e)) // TODO
  }

  return buildGetAction(
    'collection',
    collectionId,
    prefetchHandler,
    successHandler,
    errorHandler
  )
}

export const showCollections = history => {
  return (dispatch, getState) => {
    dispatch(collectionClearSelectedIds())
    const query = encodeQueryString(getState())
    if (!_.isEmpty(query)) {
      const locationDescriptor = {
        pathname: '/collections',
        search: `?${query}`,
      }
      history.push(locationDescriptor)
    }
  }
}

export const showDetails = (history, id) => {
  if (!id) {
    return
  }
  return (dispatch, getState) => {
    const query = encodeQueryString(getState())
    const locationDescriptor = {
      pathname: `/collections/details/${id}`,
      search: _.isEmpty(query) ? null : `?${query}`,
    }
    history.push(locationDescriptor)
  }
}
