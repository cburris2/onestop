import {connect} from 'react-redux'
import {granuleIncrementResultsOffset} from '../../../actions/search/GranuleRequestActions'
import {
  insertSelectedGranule,
  insertMultipleSelectedGranules,
  removeSelectedGranule,
  removeMultipleSelectedGranules,
} from '../../../actions/CartActions'
import {
  insertGranule,
  removeGranuleFromLocalStorage,
  getSelectedGranulesFromStorage,
} from '../../../utils/localStorageUtil'

import GranuleList from './GranuleList'

import {withRouter} from 'react-router'
import {asyncMoreGranuleResults} from '../../../actions/search/GranuleSearchActions'

const mapStateToProps = state => {
  const {
    granules,
    totalGranuleCount,
    loadedGranuleCount,
  } = state.search.granuleResult
  const focusedItem = state.search.collectionDetailResult.collectionDetail
  return {
    collectionTitle: focusedItem
      ? focusedItem.collection.attributes.title
      : null,
    results: granules,
    totalHits: totalGranuleCount,
    returnedHits: loadedGranuleCount,
    loading: state.search.loading ? 1 : 0, // TODO gets passed to ListView
    selectedGranules: getSelectedGranulesFromStorage(state),
    featuresEnabled: state.config.featuresEnabled,
  }
}

const mapDispatchToProps = dispatch => {
  return {
    fetchMoreResults: () => {
      dispatch(asyncMoreGranuleResults())
    },
    selectGranule: (item, itemId) => {
      insertGranule(itemId, item)
      dispatch(insertSelectedGranule(item, itemId))
    },
    selectVisibleGranules: (items, itemIds) => {
      dispatch(insertMultipleSelectedGranules(items, itemIds))
    },
    deselectGranule: itemId => {
      removeGranuleFromLocalStorage(itemId)
      dispatch(removeSelectedGranule(itemId))
    },
    deselectVisibleGranules: itemIds => {
      dispatch(removeMultipleSelectedGranules(itemIds))
    },
  }
}

const GranuleListContainer = withRouter(
  connect(mapStateToProps, mapDispatchToProps)(GranuleList)
)

export default GranuleListContainer
