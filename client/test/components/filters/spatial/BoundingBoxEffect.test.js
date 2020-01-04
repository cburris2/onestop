import React from 'react'
import {renderHook, act} from '@testing-library/react-hooks'

import {useBoundingBox} from '../../../../src/components/filters/spatial/BoundingBoxEffect'

const initHook = (hookFunction, ...hookArgs) => {
  // generic init hook function
  let hook = null
  act(() => {
    const {result} = renderHook(() => hookFunction(...hookArgs)) // TODO test ...hookArgs with hook that has more than one param
    hook = result
  })

  return hook
}

const init = bbox => {
  return initHook(useBoundingBox, bbox)
}

const getBounds = hook => {
  let [ bounds ] = hook.current
  return bounds
}

describe('The BoundingBoxEffect hook', () => {
  describe('initial conditions', () => {
    it('default - no bbox provided', () => {
      const hook = init(null)
      const bounds = getBounds(hook)
      expect(bounds.east.value).toEqual('')
      expect(bounds.north.value).toEqual('')
      expect(bounds.south.value).toEqual('')
      expect(bounds.west.value).toEqual('')
    })

    it('with a bbox', () => {
      const hook = init({north: 34, south: -20, west: 17, east: -123})
      const bounds = getBounds(hook)
      expect(bounds.east.value).toEqual('-123')
      expect(bounds.north.value).toEqual('34')
      expect(bounds.south.value).toEqual('-20')
      expect(bounds.west.value).toEqual('17')
    })
  })

  describe('flow between states', () => {
    it('simple interaction - update value with basic side effects', () => {
      const hook = init(null)
      // before interacting
      let bounds = getBounds(hook)
      expect(bounds.west.isSet()).toBeFalsy()

      act(() => {
        // this is currently how a component is expected to update values based on user interaction events:
        bounds.west.set('111')
      })

      bounds = getBounds(hook) // get updated bounds
      // primary effect: value is set
      expect(bounds.west.value).toEqual('111')
      // secondary effects:
      expect(bounds.west.number).toEqual(111)
      expect(bounds.west.isSet()).toBeTruthy()
    })

    it('clear validation errors with change in values', () => {
      const hook = init(null)

      act(() => {
        const bounds = getBounds(hook)
        bounds.west.set('-')
      })

      let bounds = getBounds(hook)

      expect(bounds.west.valid).toBeFalsy()

      act(() => {
        bounds.west.set('-1')
      })

      bounds = getBounds(hook)
      expect(bounds.west.valid).toBeTruthy()
    })
  })

  describe('validation - field level', () => {
    // let hook = null // TODO this didn't work correctly...
    // beforeAll(async () => {
    //   // init hook with defaults
    //   hook = init(null)
    // })

    const testCases = {
      NaN: [
        {
          field: 'west',
          value: 'foo',
          error: 'West: Invalid coordinates entered.',
        },
        {
          field: 'east',
          value: '1-2',
          error: 'East: Invalid coordinates entered.',
        },
        {
          field: 'south',
          value: 'hi',
          error: 'South: Invalid coordinates entered.',
        },
        {
          field: 'north',
          value: '...',
          error: 'North: Invalid coordinates entered.',
        },
      ],
      validCoordLimit: [
        {field: 'west', value: '-180'},
        {field: 'west', value: '180'},
        {field: 'west', value: '0'},
        {field: 'east', value: '-180'},
        {field: 'east', value: '180'},
        {field: 'east', value: '0'},
        {field: 'north', value: '-90'},
        {field: 'north', value: '90'},
        {field: 'north', value: '0'},
        {field: 'south', value: '-90'},
        {field: 'south', value: '90'},
        {field: 'south', value: '0'},
      ],
      invalidCoordLimit: [
        {
          field: 'west',
          value: '-181',
          error:
            'West: Invalid coordinates entered. Valid longitude are between -180 and 180.',
        }, // TODO the phrasing 'valid longitude' should be 'valid latitude coordinates'
        {
          field: 'east',
          value: '181',
          error:
            'East: Invalid coordinates entered. Valid longitude are between -180 and 180.',
        },
        {
          field: 'north',
          value: '91',
          error:
            'North: Invalid coordinates entered. Valid latitude are between -90 and 90.',
        },
        {
          field: 'south',
          value: '-91',
          error:
            'South: Invalid coordinates entered. Valid latitude are between -90 and 90.',
        },
      ],
    }

    _.each(testCases.NaN, c => {
      it(`not a number - for ${c.field}='${c.value}'`, function(){
        const hook = init(null)
        act(() => {
          const bounds = getBounds(hook)
          bounds[c.field].set(c.value)
        })

        const bounds = getBounds(hook)

        // generic invalid expectations
        expect(bounds[c.field].valid).toBeFalsy()

        // NaN expectations
        expect(bounds[c.field].number).toBeNull()
        expect(bounds[c.field].isSet()).toBeFalsy()

        // specific invalid expectations
        expect(bounds[c.field].value).toEqual(c.value)
        expect(bounds[c.field].error).toEqual(c.error)
      })
    })

    _.each(testCases.invalidCoordLimit, c => {
      it(`invalid limits - for ${c.field}='${c.value}'`, function(){
        const hook = init(null)

        act(() => {
          const bounds = getBounds(hook)
          bounds[c.field].set(c.value)
        })

        const bounds = getBounds(hook)

        // generic invalid expectations
        expect(bounds[c.field].valid).toBeFalsy()

        // coord limitations expectations
        expect(Number.isFinite(bounds[c.field].number)).toBeTruthy()
        expect(bounds[c.field].isSet()).toBeTruthy()

        // specific invalid expectations
        expect(bounds[c.field].value).toEqual(c.value)
        expect(bounds[c.field].error).toEqual(c.error)
      })
    })

    _.each(testCases.validCoordLimit, c => {
      it(`valid limits - for ${c.field}='${c.value}'`, function(){
        const hook = init(null)

        act(() => {
          const bounds = getBounds(hook)
          bounds[c.field].set(c.value)
        })

        const bounds = getBounds(hook)

        // generic invalid expectations
        expect(bounds[c.field].valid).toBeTruthy()

        // coord limitations expectations
        expect(Number.isFinite(bounds[c.field].number)).toBeTruthy()
        expect(bounds[c.field].isSet()).toBeTruthy()

        // specific invalid expectations
        expect(bounds[c.field].value).toEqual(c.value)
        expect(bounds[c.field].error).toEqual('')
      })
    })
  })

  describe('validation - group level', () => {
    const testCases = {
      notAllSet: [
        {
          fields: [ 'north' ],
        },
        {
          fields: [ 'south' ],
        },
        {
          fields: [ 'east' ],
        },
        {
          fields: [ 'west' ],
        },
        {
          fields: [ 'north', 'west' ],
        },
        {
          fields: [ 'south', 'east', 'west' ],
        },
      ],
    }

    _.each(testCases.notAllSet, c => {
      it(`incomplete - unset ${c.fields}`, function(){
        const hook = init({west: 1, east: 2, south: 3, north: 4})

        let bounds = getBounds(hook)
        act(() => {
          // set field(s) to blank string
          c.fields.forEach(field => {
            bounds[field].set('')
          })
        })

        bounds = getBounds(hook)

        // no field level errors
        expect(bounds.reason.individual).toEqual('')
        // no current cumulative error
        expect(bounds.reason.cumulative).toEqual('')
        // all fields are valid
        expect(bounds.west.valid).toBeTruthy()
        expect(bounds.east.valid).toBeTruthy()
        expect(bounds.south.valid).toBeTruthy()
        expect(bounds.north.valid).toBeTruthy()

        act(() => {
          // group level validation only done on request (specifically prior to submitting)
          bounds.validate()
        })

        bounds = getBounds(hook)
        expect(bounds.reason.cumulative).toEqual(
          'Incomplete coordinates entered. Ensure all four fields are populated.'
        )

        c.fields.forEach(field => {
          expect(bounds[field].valid).toBeFalsy()
          // expect(bounds.north.required).toBeTruthy() // TODO add this
        })
      })
    })

    it(`north smaller than south`, function(){
      const hook = init({west: 1, east: 2, south: 3, north: 4})

      let bounds = getBounds(hook)
      act(() => {
        bounds.north.set('-30')
        bounds.south.set('30')
      })

      bounds = getBounds(hook)

      // no current cumulative error
      expect(bounds.reason.cumulative).toEqual('')
      // all fields are valid
      expect(bounds.south.valid).toBeTruthy()
      expect(bounds.north.valid).toBeTruthy()

      act(() => {
        // group level validation only done on request (specifically prior to submitting)
        bounds.validate()
      })

      bounds = getBounds(hook)
      expect(bounds.reason.cumulative).toEqual(
        'North is always greater than South.'
      )

      expect(bounds.north.valid).toBeFalsy()
      expect(bounds.south.valid).toBeFalsy()
    })

    it(`not a line - north != south`, function(){
      const hook = init({west: 1, east: 2, south: 3, north: 4})

      let bounds = getBounds(hook)
      act(() => {
        bounds.north.set('15')
        bounds.south.set('15')
      })

      bounds = getBounds(hook)

      // no current cumulative error
      expect(bounds.reason.cumulative).toEqual('')
      // all fields are valid
      expect(bounds.south.valid).toBeTruthy()
      expect(bounds.north.valid).toBeTruthy()

      act(() => {
        // group level validation only done on request (specifically prior to submitting)
        bounds.validate()
      })

      bounds = getBounds(hook)
      expect(bounds.reason.cumulative).toEqual(
        'North cannot be the same as South.'
      )

      expect(bounds.north.valid).toBeFalsy()
      expect(bounds.south.valid).toBeFalsy()
    })

    it(`not a line - east != west`, function(){
      const hook = init({west: 1, east: 2, south: 3, north: 4})

      let bounds = getBounds(hook)
      act(() => {
        bounds.east.set('20')
        bounds.west.set('20')
      })

      bounds = getBounds(hook)

      // no current cumulative error
      expect(bounds.reason.cumulative).toEqual('')
      // all fields are valid
      expect(bounds.east.valid).toBeTruthy()
      expect(bounds.west.valid).toBeTruthy()

      act(() => {
        // group level validation only done on request (specifically prior to submitting)
        bounds.validate()
      })

      bounds = getBounds(hook)
      expect(bounds.reason.cumulative).toEqual(
        'East cannot be the same as West.'
      )

      expect(bounds.east.valid).toBeFalsy()
      expect(bounds.west.valid).toBeFalsy()
    })

    it(`not a line - antimeridian confusion`, function(){
      const hook = init({west: 1, east: 2, south: 3, north: 4})

      let bounds = getBounds(hook)
      act(() => {
        bounds.east.set('-180')
        bounds.west.set('180')
      })

      bounds = getBounds(hook)

      // no current cumulative error
      expect(bounds.reason.cumulative).toEqual('')
      // all fields are valid
      expect(bounds.east.valid).toBeTruthy()
      expect(bounds.west.valid).toBeTruthy()

      act(() => {
        // group level validation only done on request (specifically prior to submitting)
        bounds.validate()
      })

      bounds = getBounds(hook)
      expect(bounds.reason.cumulative).toEqual(
        'East cannot be the same as West.'
      )

      expect(bounds.east.valid).toBeFalsy()
      expect(bounds.west.valid).toBeFalsy()
    })

    it(`not a line - antimeridian (valid 360 bbox)`, function(){
      const hook = init({west: 1, east: 2, south: 3, north: 4})

      let bounds = getBounds(hook)
      act(() => {
        bounds.east.set('180')
        bounds.west.set('-180')
      })

      bounds = getBounds(hook)

      // no current cumulative error
      expect(bounds.reason.cumulative).toEqual('')
      // all fields are valid
      expect(bounds.east.valid).toBeTruthy()
      expect(bounds.west.valid).toBeTruthy()

      act(() => {
        // group level validation only done on request (specifically prior to submitting)
        bounds.validate()
      })

      bounds = getBounds(hook)
      expect(bounds.reason.cumulative).toEqual('')

      expect(bounds.east.valid).toBeTruthy()
      expect(bounds.west.valid).toBeTruthy()
    })
  })
})
