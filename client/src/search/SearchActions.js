import fetch from 'isomorphic-fetch'
import _ from 'lodash'
import { showLoading, hideLoading } from '../loading/LoadingActions'
import { showErrors } from '../error/ErrorActions'
import { facetsReceived, clearFacets } from './facet/FacetActions'
import { assembleSearchRequest } from '../utils/queryUtils'

export const SEARCH = 'search'
export const SEARCH_COMPLETE = 'search_complete'
export const UPDATE_QUERY = 'update_query'
export const CLEAR_SEARCH = 'clear_search'
export const COUNT_HITS = 'count_hits'

export const updateQuery = (searchText) => {
  return {
    type: UPDATE_QUERY,
    searchText
  }
}

export const startSearch = () => {
  return {
    type: SEARCH
  }
}

export const completeSearch = (items) => {
  return {
    type: SEARCH_COMPLETE,
    view: 'collections',
    items
  }
}

export const clearSearch = () => {
  return {
    type: CLEAR_SEARCH
  }
}

export const countHits = (totalHits) => {
  return {
    type: COUNT_HITS,
    totalHits
  }
}


export const triggerSearch = (testing) => {
  return (dispatch, getState) => {
    // if a search is already in flight, let the calling code know there's nothing to wait for
    let state = getState()

    if (state.behavior.request.collectionInFlight) {
      return Promise.resolve()
    }

    const body = assembleSearchRequest(state)
    const hasQueries = body && body.queries && body.queries.length > 0
    const hasFilters = body && body.filters && body.filters.length > 0
    // To avoid returning all results when hitting search w/empty fields
    if (!hasQueries && !hasFilters) {
      return Promise.resolve()
    }
    dispatch(showLoading())
    dispatch(startSearch())

    let apiRoot = "/onestop/api/search"
    if(testing) { apiRoot = testing + apiRoot }
    const fetchParams = {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    }

    return fetch(apiRoot, fetchParams)
        .then(response => {
          if (response.status < 200 || response.status >= 400) {
            let error = new Error(response.statusText)
            error.response = response
            throw error
          } else {
            return response
          }
        })
        .then(response => response.json())
        .then(json => {
          dispatch(facetsReceived(json.meta))
          dispatch(countHits(json.meta.total))
          dispatch(completeSearch(assignResourcesToMap(json.data)))
          dispatch(hideLoading())
        })
        .catch(ajaxError => ajaxError.response.json().then(errorJson => handleErrors(dispatch, errorJson)))
        .catch(jsError => handleErrors(dispatch, jsError))
  }
}

const assignResourcesToMap = (resourceList) => {
  let map = new Map()
  _.forOwn(resourceList, resource => {
    map.set(resource.id, Object.assign({type: resource.type}, resource.attributes))
  })
  return map
}

const handleErrors = (dispatch, e) => {
  dispatch(hideLoading())
  dispatch(showErrors(e.errors || e))
  dispatch(clearFacets())
  dispatch(completeSearch(assignResourcesToMap([])))
}
