package org.cedar.onestop.api.metadata.service

import groovy.json.JsonSlurper
import spock.lang.Specification
import spock.lang.Unroll

@Unroll
class ManipulateMetadtaServiceTest extends Specification {
  def inputMsg = ClassLoader.systemClassLoader.getResourceAsStream('parsed-iso.json').text
  def inputMap = [discovery: new JsonSlurper().parseText(inputMsg)] as Map
  def expectedResponsibleParties = [
      contacts  : [
          [
              individualName  : 'John Smith',
              organizationName: 'University of Boulder',
              positionName    : 'Chief Awesomeness Officer',
              role            : 'pointOfContact',
              email           : "NCEI.Info@noaa.gov",
              phone           : '555-555-5555'
          ]],
      creators  : [
          [
              individualName  : 'Edward M. Armstrong',
              organizationName: 'US NASA; Jet Propulsion Laboratory (JPL)',
              positionName    : null,
              role            : 'originator',
              email           : 'edward.m.armstrong@jpl.nasa.gov',
              phone           : '555-555-5559'
          ],
          [
              individualName  : 'Jarianna Whackositz',
              organizationName: 'Secret Underground Society',
              positionName    : 'Software Developer',
              role            : 'resourceProvider',
              email           : 'jw@mock-creator-email.org',
              phone           : '555-555-5558'
          ]],
      publishers: [
          [
              individualName  : null,
              organizationName: 'Super Important Organization',
              positionName    : null,
              role            : 'publisher',
              email           : 'email@sio.co',
              phone           : '555-123-4567'
          ]
      ]]
  
  def expectedKeywords = [
      keywords: [
          [
              "values" : [
                  "SIO > Super Important Organization",
                  "OSIO > Other Super Important Organization",
                  "SSIO > Super SIO (Super Important Organization)"
              ],
              type     : "dataCenter",
              namespace: "Global Change Master Directory (GCMD) Data Center Keywords"
          ], [
              "values"   : [
                  "EARTH SCIENCE > OCEANS > OCEAN TEMPERATURE > SEA SURFACE TEMPERATURE"
              ],
              "type"     : "theme",
              "namespace": "Global Change Master Directory (GCMD) Science and Services Keywords"
          ], [
              "values"   : [
                  "Atmosphere > Atmospheric Temperature > Surface Temperature > Dew Point Temperature",
                  "Oceans > Salinity/Density > Salinity",
                  "Volcanoes > This Keyword > Is Invalid",
                  "Spectral/Engineering > Microwave > Brightness Temperature",
                  "Spectral/Engineering > Microwave > Temperature Anomalies"
              ],
              "type"     : "theme",
              "namespace": "GCMD Keywords - Earth Science Keywords"
          ],
          [
              "values"   : [
                  "Geographic Region > Arctic",
                  "Ocean > Atlantic Ocean > North Atlantic Ocean > Gulf Of Mexico",
                  "Liquid Earth > This Keyword > Is Invalid"
              ],
              "type"     : "place",
              "namespace": "GCMD Keywords - Locations"
          ],
          [
              "values"   : [
                  "Seasonal"
              ],
              "type"     : "dataResolution",
              "namespace": "Global Change Master Directory Keywords - Temporal Data Resolution"
          ],
          [
              "values"   : [
                  "> 1 Km"
              ],
              "type"     : "dataResolution",
              "namespace": "GCMD Keywords - Vertical Data Resolution"
          ]
      ]]
  
  def expectedGcmdKeywords = [
      gcmdScienceServices     : [],
      gcmdScience             : [
          'Atmosphere',
          'Atmosphere > Atmospheric Temperature',
          'Atmosphere > Atmospheric Temperature > Surface Temperature',
          'Atmosphere > Atmospheric Temperature > Surface Temperature > Dew Point Temperature',
          'Oceans',
          'Oceans > Salinity/Density',
          'Oceans > Salinity/Density > Salinity',
          'Spectral/Engineering',
          'Spectral/Engineering > Microwave',
          'Spectral/Engineering > Microwave > Brightness Temperature',
          'Spectral/Engineering > Microwave > Temperature Anomalies',
          'Volcanoes',
          'Volcanoes > This Keyword',
          'Volcanoes > This Keyword > Is Invalid'
      ],
      gcmdLocations           : [
          'Geographic Region',
          'Geographic Region > Arctic',
          'Ocean',
          'Ocean > Atlantic Ocean',
          'Ocean > Atlantic Ocean > North Atlantic Ocean',
          'Ocean > Atlantic Ocean > North Atlantic Ocean > Gulf Of Mexico',
          'Liquid Earth',
          'Liquid Earth > This Keyword',
          'Liquid Earth > This Keyword > Is Invalid'
      ],
      gcmdInstruments         : [],
      gcmdPlatforms           : [],
      gcmdProjects            : [],
      gcmdDataCenters         : [
          'SIO > Super Important Organization',
          'OSIO > Other Super Important Organization',
          'SSIO > Super SIO (Super Important Organization)'
      ],
      gcmdHorizontalResolution: [],
      gcmdVerticalResolution  : ['> 1 Km'],
      gcmdTemporalResolution  : ['Seasonal']
  ]
  
  def "Create GCMD keyword lists" () {
    given:
    def gcmdKeywordMap = inputMap.discovery as Map
  
    when:
    Map parsedKeywords = ManipulateMetadataService.createGcmdKeyword(gcmdKeywordMap)
    
    then:
    parsedKeywords.gcmdScienceServices == expectedGcmdKeywords.gcmdScienceServices as Set
    parsedKeywords.gcmdScience == expectedGcmdKeywords.gcmdScience as Set
    parsedKeywords.gcmdLocations == expectedGcmdKeywords.gcmdLocations  as Set
    parsedKeywords.gcmdInstruments == expectedGcmdKeywords.gcmdInstruments  as Set
    parsedKeywords.gcmdPlatforms == expectedGcmdKeywords.gcmdPlatforms  as Set
    parsedKeywords.gcmdProjects == expectedGcmdKeywords.gcmdProjects  as Set
    parsedKeywords.gcmdDataCenters == expectedGcmdKeywords.gcmdDataCenters  as Set
    parsedKeywords.gcmdHorizontalResolution == expectedGcmdKeywords.gcmdHorizontalResolution  as Set
    parsedKeywords.gcmdVerticalResolution == expectedGcmdKeywords.gcmdVerticalResolution  as Set
    parsedKeywords.gcmdTemporalResolution == expectedGcmdKeywords.gcmdTemporalResolution  as Set

    and: "should recreate keywords with out accession values"
    parsedKeywords.keywords.namespace != 'NCEI ACCESSION NUMBER'
    parsedKeywords.keywords == expectedKeywords.keywords as Map
  }
  
  def "Create contacts, publishers and creators from responsibleParties" () {
    given:
    def responsiblePartiesMap = inputMap.discovery.responsibleParties
    
    when:
    Map responsibleParties = ManipulateMetadataService.parseDataResponsibleParties(responsiblePartiesMap as Map)
    
    then:
    responsibleParties.contacts == expectedResponsibleParties.contacts as Set
    responsibleParties.creators == expectedResponsibleParties.creators as Set
    responsibleParties.publishers == expectedResponsibleParties.publishers as Set
  }
  
  def "new record is ready for onestop" () {
    given:
    def recordMap = inputMap.discovery as Map
    def expectedMap = inputMap.discovery as Map
    
    when:
    def metadata = ManipulateMetadataService.oneStopReady(recordMap)
    expectedMap.remove("keywords")
    expectedMap.remove("services")
    expectedMap.remove("responsibleParties")
    expectedMap << expectedResponsibleParties << expectedGcmdKeywords << expectedKeywords
  
    then:
    metadata == expectedMap
    
    and: "drop service and responsibleParties"
    metadata.services == null
    metadata.responsibleParties == null
  }
}
