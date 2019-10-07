import React, {useState, useEffect} from 'react'
import _ from 'lodash'

import FlexColumn from '../../common/ui/FlexColumn'
import Button from '../../common/input/Button'
import {Key} from '../../../utils/keyboardUtils'
import {isValidDateRange, textToNumber} from '../../../utils/inputUtils'
import {
  FilterColors,
  FilterStyles,
  SiteColors,
} from '../../../style/defaultStyles'
import FilterFieldset from '../FilterFieldset'
import DateFieldset from './DateFieldset'
import GeologicFieldset from './GeologicFieldset'
import GeologicFormatFieldset from './GeologicFormatFieldset'
import YearField from './YearField'

const styleTimeFilter = {
  // TODO duplicate from DateTimeFilter
  ...FilterStyles.MEDIUM,
  ...{padding: '0.618em'},
}

const styleForm = {
  // TODO duplicate from DateTimeFilter
  display: 'flex',
  flexDirection: 'column',
}

const styleButtonRow = {
  // TODO duplicate from DateTimeFilter
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
}

const styleButton = {
  // TODO duplicate from DateTimeFilter
  width: '30.9%',
  padding: '0.309em',
  margin: '0 0.309em',
  fontSize: '1.05em',
}

// const styleDate = { // TODO duplicate from DateFieldset
//   display: 'flex',
//   flexDirection: 'row',
// }
const styleLayout = {
  // TODO duplicate from DateFieldset
  margin: '2px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'space-around',
  marginBottom: '0.25em',
}
//
const styleLabel = {
  // TODO duplicate from DateFieldset
  marginBottom: '0.25em',
}
//
const styleField = {
  width: '15em',
  margin: 0,
  padding: 0, // TODO only non-duplicate from DateFieldset // TODO sync up max length and width - they are just guesses for now
  color: FilterColors.TEXT,
  height: '2em',
  border: `1px solid ${FilterColors.LIGHT_SHADOW}`,
  borderRadius: '0.309em',
}

const warningStyle = warning => {
  if (_.isEmpty(warning)) {
    return {
      display: 'none',
    }
  }
  else {
    return {
      color: SiteColors.WARNING,
      textAlign: 'center',
      margin: '0.75em 0 0.5em',
      fontWeight: 'bold',
      fontSize: '1.15em',
    }
  }
}

const GeologicTimeFilter = props => {
  const [ start, setStart ] = useState({year: null, valid: true})
  const [ end, setEnd ] = useState({year: null, valid: true})
  const [ format, setFormat ] = useState('CE')
  const [ dateRangeValid, setDateRangeValid ] = useState(true)
  const [ warning, setWarning ] = useState('')

  const onChange = (field, year, valid) => {
    // TODO just make 2 separate functions instead of passing both through this, then change the args to not need to send 'field'
    console.log(field, year)
    if (field == 'start') {
      setStart({year: year, valid: valid})
      setWarning('')
      setDateRangeValid(isValidDateRange(year, end))
    }
    if (field == 'end') {
      setEnd({year: year, valid: valid})
      setWarning('')
      setDateRangeValid(isValidDateRange(start, year))
    }
  }

  const clearDates = () => {
    props.removeYearRange()
    props.submit()
    setStart({year: null, valid: true})
    setEnd({year: null, valid: true})
    setDateRangeValid(true)
    setWarning('')
  }

  const applyDates = () => {
    if (!start.valid || !end.valid || !dateRangeValid) {
      setWarning(createWarning(start.valid, end.valid, dateRangeValid))
    }
    else {
      // TODO convert into CE here!
      console.log('submitting', start.year, end.year)
      props.updateYearRange(textToNumber(start.year), textToNumber(end.year))
      props.submit()
    }
  }

  const createWarning = (startValueValid, endValueValid, dateRangeValid) => {
    if (!startValueValid && !endValueValid) return 'Invalid start and end date.'
    if (!startValueValid) return 'Invalid start date.'
    if (!endValueValid) return 'Invalid end date.'
    if (!dateRangeValid) return 'Invalid date range.'
    return 'Unknown error'
  }

  const handleKeyDown = event => {
    if (event.keyCode === Key.ENTER) {
      event.preventDefault()
      applyDates()
    }
  }

  // const [year, setYear] = useState(1993) // TODO bleh
  const geoFormat = 'CE' // TODO add to redux state!
  const onFormatChange = f => {
    console.log('Format changed to f')
    // TODO do stuff!
    // TODO ie: change placeholder value to -YYYYYYYYY vs YYYYYYYY ?
  }

  const legendText = 'Geologic'
  const form = (
    <div key="GeologicDateFilterInput::all">
      <form
        style={styleForm}
        onKeyDown={handleKeyDown}
        aria-describedby="geologicTimeFilterInstructions"
      >
        <GeologicFormatFieldset
          geologicFormat={geoFormat}
          onFormatChange={onFormatChange}
        />
        <GeologicFieldset
          startYear={props.startYear}
          endYear={props.endYear}
          onDateChange={onChange}
        />
      </form>
    </div>
  )

  // <label for="CE">CE</label>
  // <input type="radio" id="CE" name="format" value="CE" checked={true} onChange={()=>{}}/>
  // <label for="BP">BP (0 = 1950 CE)</label>
  // <input type="radio" id="BP" name="format" value="BP" checked={false} onChange={()=>{}}/>

  //   <FilterFieldset legendText={legendText}>
  //     <div style={styleDate}>
  //       <YearField
  //         name="start"
  //         label="Start"
  //         value={start.year}
  //         onChange={e => setYear(e.target.value)}
  //         maxLength={14}
  //         styleLayout={styleLayout}
  //         styleLabel={styleLabel}
  //         styleField={styleField}
  //       />
  //       <YearField
  //         name="end"
  //         label="End"
  //         value={end.year}
  //         onChange={e => setYear(e.target.value)}
  //         maxLength={14}
  //         styleLayout={styleLayout}
  //         styleLabel={styleLabel}
  //         styleField={styleField}
  //       />
  //   </div>
  // </FilterFieldset>

  const buttons = (
    <div key="GeologicDateFilter::InputColumn::Buttons" style={styleButtonRow}>
      <Button
        key="TimeFilter::apply"
        text="Apply"
        title="Apply time filters"
        onClick={applyDates}
        style={styleButton}
      />
      <Button
        key="TimeFilter::clear"
        text="Clear"
        title="Clear time filters"
        onClick={clearDates}
        style={styleButton}
      />
    </div>
  )

  const warningMessage = (
    <div
      key="GeologicDateFilter::InputColumn::Warning"
      style={warningStyle(warning)}
      role="alert"
    >
      {warning}
    </div>
  )

  const [ preset, setPreset ] = useState('') // TODO tons of stuff to do with this widget

  const presetValues = [
    {index: 0, label: 'Holocene', start: 1950 - 11700, end: null},
    {
      index: 1,
      label: 'Last Deglaciation',
      start: 1950 - 19000,
      end: 1950 - 11700,
    },
    {
      index: 2,
      label: 'Last Glacial Period',
      start: 1950 - 115000,
      end: 1950 - 11700,
    },
    {
      index: 3,
      label: 'Last Interglacial',
      start: 1950 - 130000,
      end: 1950 - 115000,
    },
    {index: 4, label: 'Pliocene', start: 1950 - 5300000, end: 1950 - 2600000},
    {
      index: 5,
      label: 'Paleocene-Eocene Thermal Maximum (PETM)',
      start: 1950 - 56000000,
      end: 1950 - 55000000,
    },
  ]

  useEffect(
    () => {
      let pv = presetValues[preset] // TODO clear form should also reset the presets to (none)
      console.log('found', pv, 'from', preset)
      if (pv) {
        // setStart({year: pv.start, valid: true})
        // setEnd({year: pv.end, valid: true})
        // setDateRangeValid(true)
        // // TODO try activating this widget with keyboard to see if we need a preventDefault in there anywhere
        // applyDates()
        props.updateYearRange(pv.start, pv.end)
        props.submit()
      }
    },
    [ preset ]
  )

  const options = [
    <option key="era::none" value="">
      (none)
    </option>,
  ]

  _.each(presetValues, (pv, k) => {
    options.push(
      <option key={`era::${pv.label}`} value={k}>
        {pv.label}
      </option>
    )
  })

  const presets = (
    <div key="GeologicDateFilter::InputColumn::Presets" style={styleLayout}>
      <label style={styleLabel} htmlFor="presets">
        Eras
      </label>
      <select
        id="presets"
        name="presets"
        value={preset}
        onChange={e => {
          setPreset(e.target.value)
        }}
        style={styleField}
        aria-label="Era Presets"
      >
        {options}
      </select>
    </div>
  )

  // TODO no enforcement of that 'future dates are not accepted' thing here
  return (
    <div style={styleTimeFilter}>
      <fieldset style={{padding: '0.618em'}}>
        <legend id="geologicTimeFilterInstructions">
          Provide a start date, end date, or both. Future dates are not
          accepted.
        </legend>
        <FlexColumn items={[ form, buttons, warningMessage, presets ]} />
      </fieldset>
    </div>
  )
}
export default GeologicTimeFilter
