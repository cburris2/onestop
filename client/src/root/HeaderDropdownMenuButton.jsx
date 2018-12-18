import React from 'react'
import {SvgIcon, times, bars} from '../common/SvgIcon'
import FocusManager from '../common/FocusManager'

const styleWrapper = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
}

const styleButtonDefault = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  color: '#d7d7d7',
  background: 'none',
  borderRadius: '0.309em',
  border: 'transparent',
  textAlign: 'center',
  margin: 0,
  padding: '0.309em',
}

const styleButtonHoverDefault = {}

const styleButtonPressDefault = {}

const styleButtonFocusDefault = {
  outline: '2px dashed white',
}

const styleIconDefault = {
  width: '2em',
  height: '2em',
  objectFit: 'contain',
  fill: '#d7d7d7',
}

const styleIconHoverDefault = {
  fill: '#277cb2',
}

const styleIconPressDefault = {}

const styleIconFocusDefault = {}

export default class HeaderDropdownMenuButton extends React.Component {
  componentWillMount() {
    this.setState({
      hovering: false,
      pressing: false,
      pressingGlobal: false,
      focusing: false,
    })
  }

  componentDidMount() {
    document.addEventListener('mouseup', this.handleGlobalMouseUp, false)
    document.addEventListener('mousedown', this.handleGlobalMouseDown, false)
  }

  componentWillUnmount() {
    document.removeEventListener('mouseup', this.handleGlobalMouseUp, false)
    document.removeEventListener('mousedown', this.handleGlobalMouseDown, false)
  }

  handleMouseOver = event => {
    this.setState(prevState => {
      return {
        ...prevState,
        hovering: true,
        pressing: prevState.pressingGlobal,
      }
    })
  }

  handleMouseOut = event => {
    this.setState(prevState => {
      return {
        ...prevState,
        hovering: false,
        pressing: false,
      }
    })
  }

  handleGlobalMouseUp = event => {
    this.setState(prevState => {
      return {
        ...prevState,
        pressingGlobal: false,
      }
    })
  }

  handleGlobalMouseDown = event => {
    this.setState(prevState => {
      return {
        ...prevState,
        pressingGlobal: true,
      }
    })
  }

  handleMouseDown = event => {
    this.setState(prevState => {
      return {
        ...prevState,
        pressing: true,
      }
    })
  }

  handleMouseUp = event => {
    this.setState(prevState => {
      return {
        ...prevState,
        pressing: false,
      }
    })
  }

  handleFocus = event => {
    const {onFocus} = this.props
    if (onFocus) {
      onFocus(event)
    }
    this.setState(prevState => {
      return {
        ...prevState,
        focusing: true,
      }
    })
  }

  handleBlur = event => {
    event.stopPropagation()
    const {onBlur} = this.props
    if (onBlur) {
      onBlur(event)
    }
    this.setState(prevState => {
      return {
        ...prevState,
        focusing: false,
      }
    })
  }

  handleTotalBlur = e => {
    const {setOpen} = this.props
    if (setOpen) {
      setOpen(false)
    }
  }

  render() {
    const {
      open,
      setOpen,
      styleButton,
      styleButtonHover,
      styleButtonPress,
      styleButtonFocus,
      styleIcon,
      styleIconHover,
      styleIconPress,
      styleIconFocus,
    } = this.props

    const stylesButtonMerged = {
      ...styleButtonDefault,
      ...styleButton,
      ...(this.state.hovering
        ? {...styleButtonHoverDefault, ...styleButtonHover}
        : {}),
      ...(this.state.pressing
        ? {...styleButtonPressDefault, ...styleButtonPress}
        : {}),
      ...(this.state.focusing
        ? {...styleButtonFocusDefault, ...styleButtonFocus}
        : {}),
    }

    const stylesIconMerged = {
      ...styleIconDefault,
      ...styleIcon,
      ...(this.state.hovering
        ? {...styleIconHoverDefault, ...styleIconHover}
        : {}),
      ...(this.state.pressing
        ? {...styleIconPressDefault, ...styleIconPress}
        : {}),
      ...(this.state.focusing
        ? {...styleIconFocusDefault, ...styleIconFocus}
        : {}),
    }

    const icon = (
      <SvgIcon
        size="2em"
        verticalAlign={true}
        style={stylesIconMerged}
        path={open ? times : bars}
      />
    )

    return (
      <FocusManager
        onBlur={this.handleTotalBlur}
        blurOnEscape={true}
        blurOnShiftTab={true}
        style={styleWrapper}
      >
        <button
          id="headerDropdownMenuButton"
          onClick={() => setOpen(!open)}
          onMouseOver={this.handleMouseOver}
          onMouseOut={this.handleMouseOut}
          onMouseDown={this.handleMouseDown}
          onMouseUp={this.handleMouseUp}
          onFocus={this.handleFocus}
          onBlur={this.handleBlur}
          style={stylesButtonMerged}
          title="Extra Menu"
        >
          {icon}
        </button>
      </FocusManager>
    )
  }
}
