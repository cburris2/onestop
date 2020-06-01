package org.cedar.onestop.indexer.util

import org.cedar.schemas.analyze.Analyzers
import org.cedar.schemas.analyze.Temporal
import org.cedar.schemas.avro.psi.Analysis
import org.cedar.schemas.avro.psi.TemporalBoundingAnalysis
import org.cedar.schemas.avro.psi.ValidDescriptor
import org.cedar.schemas.avro.psi.Discovery
import org.cedar.schemas.avro.psi.FileInformation
import org.cedar.schemas.avro.psi.ParsedRecord
import org.cedar.schemas.avro.psi.RecordType
import org.cedar.schemas.avro.psi.Relationship
import org.cedar.schemas.avro.psi.RelationshipType
import org.cedar.schemas.avro.psi.TemporalBounding
import java.time.temporal.ChronoUnit
import spock.lang.Specification
import spock.lang.Unroll

import groovy.json.JsonOutput

import static org.cedar.schemas.avro.util.TemporalTestData.getSituations

import org.cedar.onestop.kafka.common.util.DataUtils;

@Unroll
class TransformationUtilsSpec extends Specification {

  static Map<String, Map> collectionFields = TestUtils.esConfig.indexedProperties(TestUtils.esConfig.COLLECTION_SEARCH_INDEX_ALIAS)
  static Map<String, Map> granuleFields = TestUtils.esConfig.indexedProperties(TestUtils.esConfig.GRANULE_SEARCH_INDEX_ALIAS)
  static Map<String, Map> granuleAnalysisErrorFields = TestUtils.esConfig.indexedProperties(TestUtils.esConfig.GRANULE_ERROR_AND_ANALYSIS_INDEX_ALIAS)

  static expectedKeywords = [
      "SIO > Super Important Organization",
      "OSIO > Other Super Important Organization",
      "SSIO > Super SIO (Super Important Organization)",
      "EARTH SCIENCE > OCEANS > OCEAN TEMPERATURE > SEA SURFACE TEMPERATURE",
      "Atmosphere > Atmospheric Temperature > Surface Temperature > Dew Point Temperature",
      "Oceans > Salinity/Density > Salinity",
      "Volcanoes > This Keyword > Is Invalid",
      "Spectral/Engineering > Microwave > Brightness Temperature",
      "Spectral/Engineering > Microwave > Temperature Anomalies",
      "Geographic Region > Arctic",
      "Ocean > Atlantic Ocean > North Atlantic Ocean > Gulf Of Mexico",
      "Liquid Earth > This Keyword > Is Invalid",
      "Seasonal",
      "> 1 Km"
  ] as Set

  static expectedGcmdKeywords = [
      gcmdScienceServices     : null,
      gcmdScience             : [
          'Oceans',
          'Oceans > Ocean Temperature',
          'Oceans > Ocean Temperature > Sea Surface Temperature'
      ] as Set,
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
      ] as Set,
      gcmdInstruments         : null,
      gcmdPlatforms           : null,
      gcmdProjects            : null,
      gcmdDataCenters         : [
          'SIO > Super Important Organization',
          'OSIO > Other Super Important Organization',
          'SSIO > Super SIO (Super Important Organization)'
      ] as Set,
      gcmdHorizontalResolution: null,
      gcmdVerticalResolution  : ['> 1 Km'] as Set,
      gcmdTemporalResolution  : ['Seasonal'] as Set
  ]

  ///////////////////////////////
  // Generic Indexed Fields    //
  ///////////////////////////////
  // def "only mapped #type fields are indexed"() {
  //   when:
  //   def result = TransformationUtils.reformatMessageForSearch(record, fields)
  //
  //   then:
  //   result.keySet().each({ assert fields.keySet().contains(it) }) // TODO this is a shallow only check!
  //
  //   where:
  //   type          | fields            | record
  //   'collection'  | collectionFields  | TestUtils.inputCollectionRecord
  //   'granule'     | granuleFields     | TestUtils.inputGranuleRecord
  // }

  def "clean up nested map before indexing strictly mapped fields"() { // TODO change to use reformatMessageFor method
    when:
    def parsed = [
      identification: null,
      titles: null,
      description: null,
      dataAccess: null,
      thumbnail: null,
      temporalBounding: [
        beginDescriptor: ValidDescriptor.VALID,
        beginPrecision: ChronoUnit.DAYS.toString(),
        beginIndexable: true,
        beginZoneSpecified: null,
        beginUtcDateTimeString: "2000-02-01",
        beginYear: 2000,
        beginDayOfYear: 32,
        beginDayOfMonth: 1,
        beginMonth: 2,
        endDescriptor: null,
        endPrecision: null,
        endIndexable: null,
        endZoneSpecified: null,
        endUtcDateTimeString: null,
        endYear: null,
        endDayOfYear: null,
        endDayOfMonth: null,
        endMonth: null,
        instantDescriptor: null,
        instantPrecision: null,
        instantIndexable: null,
        instantZoneSpecified: null,
        instantUtcDateTimeString: null,
        instantYear: null,
        instantDayOfYear: null,
        instantDayOfMonth: null,
        instantMonth: null,
        rangeDescriptor: null,
        fakeField: 123
      ],
      spatialBounding: null,
      internalParentIdentifier: null,
      errors: [
        [
          nonsense: "horrible",
          source: "valid field"
        ]
      ],
      garbage:"nuke meeee"
    ]



    // def knownUnmappedTemporalFields = new HashMap<String, Object>();
    // knownUnmappedTemporalFields.put("beginYear", new HashMap<String, Object>());
    // knownUnmappedTemporalFields.put("beginDayOfYear", new HashMap<String, Object>());
    // knownUnmappedTemporalFields.put("beginDayOfMonth", new HashMap<String, Object>());
    // knownUnmappedTemporalFields.put("beginMonth", new HashMap<String, Object>());
    // knownUnmappedTemporalFields.put("endYear", new HashMap<String, Object>());
    // knownUnmappedTemporalFields.put("endDayOfYear", new HashMap<String, Object>());
    // knownUnmappedTemporalFields.put("endDayOfMonth", new HashMap<String, Object>());
    // knownUnmappedTemporalFields.put("endMonth", new HashMap<String, Object>());
    // knownUnmappedTemporalFields.put("instantYear", new HashMap<String, Object>());
    // knownUnmappedTemporalFields.put("instantDayOfYear", new HashMap<String, Object>());
    // knownUnmappedTemporalFields.put("instantDayOfMonth", new HashMap<String, Object>());
    // knownUnmappedTemporalFields.put("instantMonth", new HashMap<String, Object>());
    // def knownUnmappedFields = new HashMap<String, Object>();
    // knownUnmappedFields.put("temporalBounding", knownUnmappedTemporalFields);

    // ParsedRecord record = ParsedRecord.newBuilder(TestUtils.inputAvroRecord)
    //     .setAnalysis(
    //       Analysis.newBuilder().setTemporalBounding(
    //       TemporalBoundingAnalysis.newBuilder()
    //           .setBeginDescriptor(ValidDescriptor.VALID)
    //           .setBeginIndexable(true)
    //           .setBeginPrecision(ChronoUnit.DAYS.toString())
    //           .setBeginZoneSpecified(null)
    //           .setBeginUtcDateTimeString("2000-02-01")
    //           .setBeginYear(2000)
    //           .setBeginMonth(2)
    //           .setBeginDayOfYear(32)
    //           .setBeginDayOfMonth(1)
    //           .build()
    //           ).build()).build()

            // def parsed = TransformationUtils.unfilteredAEMessage(record)

    println("parsed "+JsonOutput.toJson(parsed))
    def pruned = TransformationUtils.pruneKnownUnmappedFields(parsed, IndexingInput.getUnmappedAnalysisAndErrorsIndexFields())
    println("pruned unampped? "+JsonOutput.toJson(pruned))
    def minus = TransformationUtils.identifyUnmappedFields(pruned, TestUtils.esConfig.indexedProperties(TestUtils.esConfig.GRANULE_ERROR_AND_ANALYSIS_INDEX_ALIAS))
    println("creates minus: "+JsonOutput.toJson(minus))
    def indexedRecord = DataUtils.removeFromMap(pruned, minus)
    println("which results in indexing: "+ JsonOutput.toJson(indexedRecord))

    then:
    minus == [
      temporalBounding: [
        fakeField: 123
      ],
      errors: [
        [
          nonsense: "horrible",
        ]
      ],
      garbage:"nuke meeee"
    ]

    def expectedKeyset = ["identification", "titles", "description", "dataAccess", "thumbnail", "temporalBounding", "spatialBounding", "internalParentIdentifier", "errors" ]
    indexedRecord.keySet().size() == expectedKeyset.size()
    indexedRecord.keySet().each({ assert expectedKeyset.contains(it) })

    indexedRecord.temporalBounding == [
        beginDescriptor: ValidDescriptor.VALID,
        beginPrecision: ChronoUnit.DAYS.toString(),
        beginIndexable: true,
        beginZoneSpecified: null,
        beginUtcDateTimeString: "2000-02-01",
        endDescriptor: null,
        endPrecision: null,
        endIndexable: null,
        endZoneSpecified: null,
        endUtcDateTimeString: null,
        instantDescriptor: null,
        instantPrecision: null,
        instantIndexable: null,
        instantZoneSpecified: null,
        instantUtcDateTimeString: null,
        rangeDescriptor: null
      ]

    indexedRecord.errors.size() == 1
    indexedRecord.errors[0] == [nonsense:"horrible", // FIXME this is not actually desired
          source: "valid field"
        ]
  }

  ////////////////////////////////
  // Identifiers, "Names"       //
  ////////////////////////////////
  def "produces internalParentIdentifier for collection record correctly"() {
    expect:
    TransformationUtils.prepareInternalParentIdentifier(TestUtils.inputAvroRecord) == null
  }

  def "produces internalParentIdentifier for granule record correctly"() {
    def testId = "ABC"
    def record = ParsedRecord.newBuilder(TestUtils.inputAvroRecord)
        .setType(RecordType.granule)
        .setRelationships([
            Relationship.newBuilder().setType(RelationshipType.COLLECTION).setId(testId).build()
        ])
        .build()

    expect:
    TransformationUtils.prepareInternalParentIdentifier(record) == testId
  }

  def "produces filename for collection record correctly"() {
    expect:
    TransformationUtils.prepareFilename(TestUtils.inputAvroRecord) == null
  }

  def "produces filename for granule record correctly when record has data"() {
    def filename = "ABC"
    def record = ParsedRecord.newBuilder(TestUtils.inputAvroRecord)
        .setType(RecordType.granule)
        .setFileInformation(FileInformation.newBuilder().setName(filename).build())
        .build()

    expect:
    TransformationUtils.prepareFilename(record) == filename
  }

  def "produces filename for granule record correctly when record does not have data"() {
    def record = ParsedRecord.newBuilder(TestUtils.inputAvroRecord)
        .setType(RecordType.granule)
        .build()

    expect:
    TransformationUtils.prepareFilename(record) == null
  }

  ////////////////////////////////
  // Services, Links, Protocols //
  ////////////////////////////////
  def "prepares service links"() {
    when:
    def discovery = TestUtils.inputGranuleRecord.discovery
    def result = TransformationUtils.prepareServiceLinks(discovery)

    then:
    result.size() == 1
    result[0].title == "Multibeam Bathymetric Surveys ArcGIS Map Service"
    result[0].alternateTitle == "Alternate Title for Testing"
    result[0].description == "NOAA's National Centers for Environmental Information (NCEI) is the U.S. national archive for multibeam bathymetric data and presently holds over 2400 surveys received from sources worldwide, including the U.S. academic fleet via the Rolling Deck to Repository (R2R) program. In addition to deep-water data, the multibeam database also includes hydrographic multibeam survey data from the National Ocean Service (NOS). This map service shows navigation for multibeam bathymetric surveys in NCEI's archive. Older surveys are colored orange, and more recent recent surveys are green."
    result[0].links as Set == [
        [
            linkProtocol   : 'http',
            linkUrl        : 'https://maps.ngdc.noaa.gov/arcgis/services/web_mercator/multibeam_dynamic/MapServer/WMSServer?request=GetCapabilities&service=WMS',
            linkName       : 'Multibeam Bathymetric Surveys Web Map Service (WMS)',
            linkDescription: 'The Multibeam Bathymetric Surveys ArcGIS cached map service provides rapid display of ship tracks from global scales down to zoom level 9 (approx. 1:1,200,000 scale).',
            linkFunction   : 'search'
        ],
        [
            linkProtocol   : 'http',
            linkUrl        : 'https://maps.ngdc.noaa.gov/arcgis/rest/services/web_mercator/multibeam/MapServer',
            linkName       : 'Multibeam Bathymetric Surveys ArcGIS Cached Map Service',
            linkDescription: 'Capabilities document for Open Geospatial Consortium Web Map Service for Multibeam Bathymetric Surveys',
            linkFunction   : 'search'
        ]
    ] as Set
  }

  def "prepares service link protocols"() {
    Set protocols = ['HTTP']
    def discovery = TestUtils.inputGranuleRecord.discovery

    expect:
    TransformationUtils.prepareServiceLinkProtocols(discovery) == protocols
  }

  def "prepares link protocols"() {
    Set protocols = ['HTTP']
    def discovery = TestUtils.inputGranuleRecord.discovery

    expect:
    TransformationUtils.prepareLinkProtocols(discovery) == protocols
  }

  ////////////////////////////
  // Data Formats           //
  ////////////////////////////
  def "prepares data formats"() {
    def discovery = TestUtils.inputGranuleRecord.discovery

    expect:
    TransformationUtils.prepareDataFormats(discovery) == [
        "ASCII",
        "CSV",
        "NETCDF",
        "NETCDF > 4",
        "NETCDF > CLASSIC",
    ] as Set
  }

  ////////////////////////////
  // Responsible Parties    //
  ////////////////////////////
  def "prepares responsible party names"() {
    when:
    def record = TestUtils.inputCollectionRecord
    def result = TransformationUtils.prepareResponsibleParties(record)

    then:
    result.individualNames == [
        'John Smith',
        'Jane Doe',
        'Jarianna Whackositz',
        'Dr. Quinn McClojure Man',
        'Zebulon Pike',
        'Little Rhinoceros',
        'Skeletor McSkittles',
    ] as Set
    result.organizationNames == [
        'University of Awesome',
        'Secret Underground Society',
        'Soap Boxes Inc.',
        'Pikes Peak Inc.',
        'Alien Infested Spider Monkey Rescue',
        'The Underworld',
        'Super Important Organization',
    ] as Set
  }

  def "does not prepare responsible party names for granules"() {
    when:
    def record = TestUtils.inputGranuleRecord
    def result = TransformationUtils.prepareResponsibleParties(record)

    then:
    result.individualNames == [] as Set
    result.organizationNames == [] as Set
  }

  def "party names are not included in granule search info"() {
    when:
    def record = TestUtils.inputGranuleRecord // <-- granule!
    def result = TransformationUtils.reformatMessageForSearch(record, collectionFields) // <-- top level reformat method!

    then:
    result.individualNames == [] as Set
    result.organizationNames == [] as Set
  }

  ////////////////////////////
  // Dates                  //
  ////////////////////////////
  def "When #situation.description, expected temporal bounding generated"() {
    when:
    def newTimeMetadata = TransformationUtils.prepareDates(situation.bounding, situation.analysis)

    then:
    newTimeMetadata.sort() == expectedResult

    where:
    situation               | expectedResult
    situations.instantDay   | [beginDate: '1999-12-31T00:00:00Z', beginYear: 1999, beginDayOfYear: 365, beginDayOfMonth: 31, beginMonth: 12, endDate: '1999-12-31T23:59:59Z', endYear: 1999, endDayOfYear:365, endDayOfMonth:31, endMonth:12].sort()
    situations.instantYear  | [beginDate: '1999-01-01T00:00:00Z', beginYear: 1999, beginDayOfYear: 1, beginDayOfMonth:1, beginMonth: 1, endDate: '1999-12-31T23:59:59Z', endYear: 1999, endDayOfMonth:31, endDayOfYear:365, endMonth:12].sort()
    situations.instantPaleo | [beginDate: null, endDate: null, beginYear: -1000000000, endYear: -1000000000, beginDayOfYear: null, beginDayOfMonth:null, beginMonth: null, endDayOfYear: null, endDayOfMonth:null, endMonth:null].sort()
    situations.instantNano  | [beginDate: '2008-04-01T00:00:00Z', beginYear: 2008, beginDayOfYear: 92, beginDayOfMonth:1, beginMonth: 4, endDate: '2008-04-01T00:00:00Z', endYear: 2008,  endDayOfYear: 92, endDayOfMonth:1, endMonth:4].sort()
    situations.bounded      | [beginDate: '1900-01-01T00:00:00Z',  beginYear: 1900, beginDayOfYear: 1, beginDayOfMonth:1, beginMonth: 1, endDate: '2009-12-31T23:59:59Z', endYear: 2009, endDayOfYear:365, endDayOfMonth:31, endMonth:12].sort()
    situations.paleoBounded | [beginDate: null, endDate: null, beginYear: -2000000000, endYear: -1000000000, beginDayOfYear: null, beginDayOfMonth:null, beginMonth: null, endDayOfYear: null, endDayOfMonth:null, endMonth:null].sort()
    situations.ongoing      | [beginDate: "1975-06-15T12:30:00Z", beginDayOfMonth:15, beginDayOfYear:166, beginMonth:6, beginYear:1975, endDate:null, endYear:null, endDayOfYear: null, endDayOfMonth: null, endMonth: null].sort()
    situations.empty        | [beginDate: null, endDate: null, beginYear: null, endYear: null, beginDayOfYear: null, beginDayOfMonth:null, beginMonth: null, endDayOfYear: null, endDayOfMonth:null, endMonth:null].sort()
  }

  def "temporal bounding with #testCase dates is prepared correctly"() {
    given:
    def bounding = TemporalBounding.newBuilder().setBeginDate(begin).setEndDate(end).build()
    def analysis = Temporal.analyzeBounding(Discovery.newBuilder().setTemporalBounding(bounding).build())

    when:
    def result = TransformationUtils.prepareDates(bounding, analysis)

    then:
    expected.forEach({ k, v ->
      assert result.get(k) == v
    })

    where:
    testCase      | begin                  | end                     | expected
    'typical'     | '2005-05-09T00:00:00Z' | '2010-10-01'            | [beginDate: '2005-05-09T00:00:00Z', endDate: '2010-10-01T23:59:59.999Z', beginYear: 2005, endYear: 2010]
    'no timezone' | '2005-05-09T00:00:00'  | '2010-10-01T00:00:00'   | [beginDate: '2005-05-09T00:00:00Z', endDate: '2010-10-01T00:00:00Z', beginYear: 2005, endYear: 2010]
    'paleo'       | '-100000001'           | '-1601050'              | [beginDate: null, endDate: '-1601050-12-31T23:59:59.999Z', beginYear: -100000001, endYear: -1601050]
    'invalid'     | '1984-04-31'           | '1985-505-09T00:00:00Z' | [beginDate: null, endDate: null, beginYear: null, endYear: null]
  }

  ////////////////////////////
  // Keywords               //
  ////////////////////////////
  def "Create GCMD keyword lists"() {
    when:
    Map parsedKeywords = TransformationUtils.prepareGcmdKeyword(TestUtils.inputAvroRecord.discovery)

    then:
    parsedKeywords.gcmdScienceServices == expectedGcmdKeywords.gcmdScienceServices
    parsedKeywords.gcmdScience == expectedGcmdKeywords.gcmdScience
    parsedKeywords.gcmdLocations == expectedGcmdKeywords.gcmdLocations
    parsedKeywords.gcmdInstruments == expectedGcmdKeywords.gcmdInstruments
    parsedKeywords.gcmdPlatforms == expectedGcmdKeywords.gcmdPlatforms
    parsedKeywords.gcmdProjects == expectedGcmdKeywords.gcmdProjects
    parsedKeywords.gcmdDataCenters == expectedGcmdKeywords.gcmdDataCenters
    parsedKeywords.gcmdHorizontalResolution == expectedGcmdKeywords.gcmdHorizontalResolution
    parsedKeywords.gcmdVerticalResolution == expectedGcmdKeywords.gcmdVerticalResolution
    parsedKeywords.gcmdTemporalResolution == expectedGcmdKeywords.gcmdTemporalResolution

    and: "should recreate keywords without accession values"
    parsedKeywords.keywords.size() == expectedKeywords.size()
  }

  def "science keywords are parsed as expected from iso"() {
    def expectedKeywordsFromIso = [
        science       : [
            'Atmosphere > Atmospheric Pressure',
            'Atmosphere',
            'Atmosphere > Atmospheric Temperature',
            'Atmosphere > Atmospheric Water Vapor > Water Vapor Indicators > Humidity > Relative Humidity',
            'Atmosphere > Atmospheric Water Vapor > Water Vapor Indicators > Humidity',
            'Atmosphere > Atmospheric Water Vapor > Water Vapor Indicators',
            'Atmosphere > Atmospheric Water Vapor',
            'Atmosphere > Atmospheric Winds > Surface Winds > Wind Direction',
            'Atmosphere > Atmospheric Winds > Surface Winds',
            'Atmosphere > Atmospheric Winds',
            'Atmosphere > Atmospheric Winds > Surface Winds > Wind Speed',
            'Oceans > Bathymetry/Seafloor Topography > Seafloor Topography',
            'Oceans > Bathymetry/Seafloor Topography',
            'Oceans',
            'Oceans > Bathymetry/Seafloor Topography > Bathymetry',
            'Oceans > Bathymetry/Seafloor Topography > Water Depth',
            'Land Surface > Topography > Terrain Elevation',
            'Land Surface > Topography',
            'Land Surface',
            'Land Surface > Topography > Topographical Relief Maps',
            'Oceans > Coastal Processes > Coastal Elevation',
            'Oceans > Coastal Processes'
        ] as Set,
        scienceService: [
            'Data Analysis And Visualization > Calibration/Validation > Calibration',
            'Data Analysis And Visualization > Calibration/Validation',
            'Data Analysis And Visualization'
        ] as Set
    ]

    when:
    def discovery = TestUtils.inputCollectionRecord.discovery
    def parsedKeywords = TransformationUtils.prepareGcmdKeyword(discovery)

    then:
    parsedKeywords.gcmdScience == expectedKeywordsFromIso.science
    parsedKeywords.gcmdScienceServices == expectedKeywordsFromIso.scienceService
  }

  def "accession values are not included"() {
    when:
    def result = TransformationUtils.reformatMessageForSearch(TestUtils.inputAvroRecord, collectionFields)

    then:
    result.accessionValues == null
  }
}
