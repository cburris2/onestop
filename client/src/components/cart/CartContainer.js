import {connect} from 'react-redux'
import {withRouter} from 'react-router'
import Cart from './Cart'
import {
  getSelectedGranulesFromStorage,
  removeAllSelectedGranulesFromLocalStorage,
  removeSelectedGranuleFromLocalStorage,
} from '../../utils/localStorageUtil'
import {
  removeAllSelectedGranule,
  removeSelectedGranule,
} from '../../actions/CartActions'
import {submitCollectionDetail} from '../../actions/routing/CollectionDetailRouteActions'

// import mockCartItems from '../../../test/cart/mockCartItems'

// const mapStateToProps = state => {
//   const numberOfGranulesSelected = Object.keys(
//     state.cart.granules.selectedGranules
//   ).length
//
//   return {
//     loading: state.search.loading ? 1 : 0,
//     selectedGranules: state.cart.granules.selectedGranules,
//     numberOfGranulesSelected: numberOfGranulesSelected,
//   }
// }

const mapStateToProps = state => {
  const selectedGranules = getSelectedGranulesFromStorage(state)
  const numberOfGranulesSelected = selectedGranules
    ? Object.keys(getSelectedGranulesFromStorage(state)).length
    : 0

  // - these lines are ONLY for testing the cart
  // const selectedGranules = mockCartItems
  // const numberOfGranulesSelected = Object.keys(selectedGranules).length

  return {
    featuresEnabled: state.config.featuresEnabled,
    selectedGranules: selectedGranules,
    numberOfGranulesSelected: numberOfGranulesSelected,
    collectionDetailFilter: state.search.collectionFilter, // just used to submit collection detail correctly
  }
}

const mapDispatchToProps = (dispatch, ownProps) => {
  return {
    deselectGranule: itemId => {
      removeSelectedGranuleFromLocalStorage(itemId)
      dispatch(removeSelectedGranule(itemId))
    },
    deselectAllGranules: () => {
      removeAllSelectedGranulesFromLocalStorage()
      dispatch(removeAllSelectedGranule())
    },
    selectCollection: (id, filterState) => {
      dispatch(submitCollectionDetail(ownProps.history, id, filterState))
    },
  }
}

const CartContainer = withRouter(
  connect(mapStateToProps, mapDispatchToProps)(Cart)
)

export default CartContainer
