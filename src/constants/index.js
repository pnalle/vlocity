const DEV_NODE_ENV = 'development';
const LOCAL_PORT = '8000';
const LOCAL_IP = '0.0.0.0';
const STATUS_400_INVALID_JSON_ERROR = 'STATUS 400: Invalid JSON format.';
const STATUS_404_ENDPOINT_NOT_FOUND = 'STATUS 404: Endpoint doesn\'t exist.';
const STATUS_500_INTERNAL_SERVER_ERROR = 'STATUS 500: Internal server error';
const INVALID_SNAPSHOT_TYPE = 'Invalid Snapshot Type.';
const ERROR = 'Error';
const SUCCESS = 'Success';
const REQUIRED_FIELDS_ERROR = 'Not all required fields are provided.';
const METHOD_TYPE_GET_ATTACHMENTS = 'ATTACHMENT';
const METHOD_TYPE_GET_BRANCH_ATTACHMENTS = 'BRANCH_ATTACHMENT';
const METHOD_UPDATE_ATTACHMENT_LOG = 'UPDATE ATTACHMENT LOG';
const METHOD_UPDATE_LOG = 'UPDATE LOG';
const METHOD_NEXT_VLOCITY_STEP = 'VLOCITY NEXT STEP';
const METHOD_NEXT_VLOCITY_CONTINUE_DEPLOY_STEP = 'VLOCITY CONTINUE DEPLOY STEP';
const METHOD_BACKUP_LOG = 'BACKUP LOG';
const METHOD_BACKUP_LOG_ERROR = 'BACKUP LOG ERROR';
const METHOD_ADD_VLOCITY_TEMP = 'ADD VLOCITY TEMP';
const METHOD_VLOCITY_BACKUP = 'VLOCITY BACKUP';
const METHOD_ADD_DEPLOYMENT_STATUS_ATTACHMENTS = 'ADD DEPLOYMENT STATUS ATTACHMENTS';
const METHOD_TYPE_ADD_COMPONENTS_TO_SNAPSHOT = 'ADD COMPONENTS TO SNAPSHOT';
const START_BACKUP_BRANCH = 'Start Backup Branch';
const START_ROLLBACK_BRANCH = 'Start Rollback';
const START_RETRIEVE = 'Start Retrieve';
const START_CLEAN_ORG_DATA = 'Start Clean Org Data';
const START_PACK_RETRY = 'Start Pack Retry';
const START_LWC_OMNI_OUT = 'Start LWC OmniOut Retrieve';
const START_INSTALL_VLOCITY_INITIAL = 'Start Install Vlocity Initial';
const START_DEPLOYMENT_FROM_BRANCH = 'Start Deployment From a Branch';
const START_DEPLOYMENT_FROM_DEPLOYMENT = 'Start Deployment From a Deployment';
const ATTACHMENTS_DELETED = 'The definition of some of these components may have been removed';
const UNZIP_CATALOG_NAME = 'source_data';
const VLOCITY_TEMP_NAME = 'Vlocity Temp';
const VLOCITY_TEMP_PACK_RETRY_NAME = 'Vlocity Temp Pack Retry';
const JOB_FILE_NAME = 'job.yaml';
const APEX_FILE_NAME = 'apex.cls';
const TEMP_FOLDER = 'vlocity-temp';
const SOURCE_FOLDER = 'source_data';
const TEMP_FILE = 'currentJobInfo.json';
const NAME_LOGS_FILE = 'VlocityBuildLog.yaml';
const VLOCITY_TEMP_CATALOG = 'vlocity-temp';
const VLOCITY_JOB_INFO = 'currentJobInfo.json';
const VLOCITY_APEX_PATH = './node_modules/vlocity/apex/';
const VLOCITY_NAMESPACE_PREFIX_CODE = '_NAMESPACE_';
const MAX_SIZE_UNZIP_ATTACHMENT = 2100000;
const LWC_OMNI_OUT_QUERY = 'SELECT Id, vlocity_cmt__Type__c, vlocity_cmt__SubType__c, vlocity_cmt__Language__c FROM vlocity_cmt__OmniScript__c WHERE vlocity_cmt__IsActive__c = true AND vlocity_cmt__IsLwcEnabled__c = true'

const FIELDS_TO_ENCRYPT = ['accessToken', 'flosumToken', 'vlocityToken'];

const REQUIRED_FIELDS_DEPLOYMENT_FROM_BRANCH = [
  'vlocityUrl',
  'vlocityToken',
  'flosumUrl',
  'flosumToken',
  'timestamp',
  'nameSpacePrefix',
  'logId',
  'branchId',
  'attachLogId',
];

const REQUIRED_FIELDS_DEPLOYMENT_FROM_DEPLOYMENT = [
  'snapshotType',
  'nameSpacePrefix',
  'logId',
  'deploymentId',
  'authVlosityOrg',
  'instanceUrl',
  'accessToken',
  'authFlosum',
  'instanceUrl',
  'accessToken',
  'attachLogId',
];

const REQUIRED_FIELDS_RETRIEVE = [
  'vlocityNameSpacePrefix',
  'snapshotType',
  'snapshotId',
  'selectedDataPackTypes',
  'nameSpacePrefix',
  'nameOfComponents',
  'logId',
  'isLikeSearch',
  'isNotIncludeDependencies',
  'authVlosityOrg',
  'instanceUrl',
  'accessToken',
  'authFlosum',
  'instanceUrl',
  'accessToken',
  'attachLogId',
];

const REQUIRED_FIELDS_BACKUP = [
  'flosumUrl',
  'flosumToken',
  'vlocityUrl',
  'vlocityToken',
  'logId',
  'nameSpacePrefix',
  'vlocityNameSpacePrefix',
  'componentsMap',
  'pipelineId',
];

const REQUIRED_FIELDS_ROLLBACK = [
  'flosumUrl',
  'flosumToken',
  'vlocityUrl',
  'vlocityToken',
  'logId',
  'nameSpacePrefix',
  'attachmentIdList',
];

const REQUIRED_FIELDS_CLEAN_ORG_DATA = [
  'vlocityUrl',
  'vlocityToken',
  'attachLogId',
  'timestamp',
  'flosumUrl',
  'flosumToken',
  'nameSpacePrefix',
];

const REQUIRED_FIELDS_PACK_RETRY = [
  'vlocityUrl',
  'vlocityToken',
  'attachLogId',
  'timestamp',
  'flosumUrl',
  'flosumToken',
  'nameSpacePrefix',
  'snapshotId',
  'vlocityTempAttachmentId'
];

const REQUIRED_FIELDS_LWC_OMNI_OUT = [
  'vlocityUrl',
  'vlocityToken',
  'flosumUrl',
  'flosumToken',
  'soqlWhereClause',
  'attachLogId',
  'snapshotType',
  'nameSpacePrefix',
  'snapshotId',
  'logId',
];

const REQUIRED_OBJECT_FIELDS_DEPLOYMENT_FROM_DEPLOYMENT = ['authFlosum', 'authVlosityOrg'];
const REQUIRED_OBJECT_FIELDS_RETRIEVE = ['authFlosum', 'authVlosityOrg'];

const UNSUPPORTED_BY_DEFAULT_LIST = ['ChargeMeasurement', 'OfferingProcedure'];

const DATA_PACK_TYPES_QUERIES_MAP = {
  Attachment: null,
  AttributeAssignmentRule: {
    objectName: 'AttributeAssignmentRule__c',
    query: '',
    fields: 'Id, Name',
  },
  AttributeCategory: {
    objectName: 'AttributeCategory__c',
    query: '',
    fields: `Id, Name, ${VLOCITY_NAMESPACE_PREFIX_CODE}Code__c`,
  },
  CalculationMatrix: {
    objectName: 'CalculationMatrix__c',
    query: '',
    fields: 'Id, Name',
  },
  CalculationMatrixVersion: {
    objectName: 'CalculationMatrixVersion__c',
    query: `${VLOCITY_NAMESPACE_PREFIX_CODE}IsEnabled__c = true`,
    fields: 'Id, Name',
  },
  CalculationProcedure: {
    objectName: 'CalculationProcedure__c',
    query: '',
    fields: 'Id, Name',
  },
  CalculationProcedureVersion: {
    objectName: 'CalculationProcedureVersion__c',
    query: `${VLOCITY_NAMESPACE_PREFIX_CODE}IsEnabled__c = true`,
    fields: 'Id, Name',
  },
  Catalog: {
    objectName: 'Catalog__c',
    query: '',
    fields: 'Id, Name',
  },
  ContextAction: {
    objectName: 'ContextAction__c',
    query: '',
    fields: `Id, Name, ${VLOCITY_NAMESPACE_PREFIX_CODE}GlobalKey__c`,
  },
  ChargeMeasurement: {
    objectName: 'ChargeMeasurement__c',
    query: '',
    fields: `Id, Name, ${VLOCITY_NAMESPACE_PREFIX_CODE}GlobalKey__c`,
  },
  ContextDimension: {
    objectName: 'ContextDimension__c',
    query: '',
    fields: `Id, Name, ${VLOCITY_NAMESPACE_PREFIX_CODE}GlobalKey__c`,
  },
  ContextScope: {
    objectName: 'ContextScope__c',
    query: '',
    fields: `Id, Name, ${VLOCITY_NAMESPACE_PREFIX_CODE}GlobalKey__c`,
  },
  ContentVersion: {
    objectName: 'ContentVersion',
    query: `${VLOCITY_NAMESPACE_PREFIX_CODE}GlobalKey__c != null`,
    fields: `Id, Name, ${VLOCITY_NAMESPACE_PREFIX_CODE}GlobalKey__c`,
  },
  ContractType: {
    objectName: 'ContractType__c',
    query: '',
    fields: 'Id, Name',
  },
  CpqConfigurationSetup: {
    objectName: 'CpqConfigurationSetup__c',
    query: '',
    fields: 'Id, Name',
  },
  CustomFieldMap: {
    objectName: 'CustomFieldMap__c',
    query: '',
    fields: 'Id, Name',
  },
  DataRaptor: {
    objectName: 'DRBundle__c',
    query: `${VLOCITY_NAMESPACE_PREFIX_CODE}Type__c != 'Migration'`,
    fields: 'Id, Name',
  },
  Document: {
    objectName: 'Document',
    query: '',
    fields: 'Id, DeveloperName',
  },
  DocumentClause: {
    objectName: 'DocumentClause__c',
    query: '',
    fields: 'Id, Name',
  },
  DocumentTemplate: {
    objectName: 'DocumentTemplate__c',
    query: `${VLOCITY_NAMESPACE_PREFIX_CODE}Status__c = 'Active'`,
    fields: 'Id, Name',
  },
  EntityFilter: {
    objectName: 'EntityFilter__c',
    query: '',
    fields: `Id, Name, ${VLOCITY_NAMESPACE_PREFIX_CODE}GlobalKey__c`,
  },
  GeneralSettings: {
    objectName: 'GeneralSettings__c',
    query: '',
    fields: 'Id, Name',
  },
  IntegrationProcedure: {
    objectName: 'OmniScript__c',
    query: `${VLOCITY_NAMESPACE_PREFIX_CODE}IsActive__c = true AND ${VLOCITY_NAMESPACE_PREFIX_CODE}IsProcedure__c = true`,
    fields: `Id, Name, ${VLOCITY_NAMESPACE_PREFIX_CODE}Type__c, ${VLOCITY_NAMESPACE_PREFIX_CODE}SubType__c`,
  },
  IntegrationProcedureVersion: {
    objectName: 'OmniScript__c',
    query: `${VLOCITY_NAMESPACE_PREFIX_CODE}IsProcedure__c = true`,
    fields: `Id, Name, ${VLOCITY_NAMESPACE_PREFIX_CODE}Type__c, ${VLOCITY_NAMESPACE_PREFIX_CODE}SubType__c, ${VLOCITY_NAMESPACE_PREFIX_CODE}Version__c`,
  },
  InterfaceImplementation: {
    objectName: 'InterfaceImplementation__c',
    query: '',
    fields: 'Id, Name',
  },
  ItemImplementation: {
    objectName: 'ItemImplementation__c',
    query: '',
    fields: 'Id, Name',
  },
  ManualQueue: {
    objectName: 'ManualQueue__c',
    query: '',
    fields: 'Id, Name',
  },
  ObjectClass: {
    objectName: 'ObjectClass__c',
    query: '',
    fields: `Id, Name, ${VLOCITY_NAMESPACE_PREFIX_CODE}GlobalKey__c`,
  },
  ObjectContextRule: {
    objectName: 'ObjectRuleAssignment__c',
    query: '',
    fields: 'Id, Name',
  },
  ObjectLayout: {
    objectName: 'ObjectLayout__c',
    query: '',
    fields: `Id, Name, ${VLOCITY_NAMESPACE_PREFIX_CODE}GlobalKey__c`,
  },
  OfferingProcedure: {
    objectName: 'OfferingProcedure__c',
    query: '',
    fields: `Id, Name`,
  },
  OfferMigrationPlan: {
    objectName: 'OfferMigrationPlan__c',
    query: '',
    fields: `Id, Name, ${VLOCITY_NAMESPACE_PREFIX_CODE}Code__c`,
  },
  OmniScript: {
    objectName: 'OmniScript__c',
    query: `${VLOCITY_NAMESPACE_PREFIX_CODE}IsActive__c = true AND ${VLOCITY_NAMESPACE_PREFIX_CODE}IsProcedure__c = false`,
    fields: `Id, ${VLOCITY_NAMESPACE_PREFIX_CODE}Type__c, ${VLOCITY_NAMESPACE_PREFIX_CODE}SubType__c, ${VLOCITY_NAMESPACE_PREFIX_CODE}Language__c, ${VLOCITY_NAMESPACE_PREFIX_CODE}IsLwcEnabled__c`,
  },
  OmniScriptVersion: {
    objectName: 'OmniScript__c',
    query: `${VLOCITY_NAMESPACE_PREFIX_CODE}IsProcedure__c = false`,
    fields: `Id, ${VLOCITY_NAMESPACE_PREFIX_CODE}Type__c, ${VLOCITY_NAMESPACE_PREFIX_CODE}SubType__c, ${VLOCITY_NAMESPACE_PREFIX_CODE}Language__c, ${VLOCITY_NAMESPACE_PREFIX_CODE}Version__c`,
  },
  OrchestrationDependencyDefinition: {
    objectName: 'OrchestrationDependencyDefinition__c',
    query: '',
    fields: `Id, Name, ${VLOCITY_NAMESPACE_PREFIX_CODE}GlobalKey__c`,
  },
  OrchestrationItemDefinition: {
    objectName: 'OrchestrationItemDefinition__c',
    query: '',
    fields: `Id, Name, ${VLOCITY_NAMESPACE_PREFIX_CODE}OrchestrationPlanDefinitionId__r.Name`,
  },
  OrchestrationPlanDefinition: {
    objectName: 'OrchestrationPlanDefinition__c',
    query: '',
    fields: `Id, Name, ${VLOCITY_NAMESPACE_PREFIX_CODE}GlobalKey__c`,
  },
  OrchestrationQueueAssignmentRule: {
    objectName: 'OrchestrationQueueAssignmentRule__c',
    query: '',
    fields: 'Id, Name',
  },
  PriceList: {
    objectName: 'PriceList__c',
    query: '',
    fields: `Id, Name, ${VLOCITY_NAMESPACE_PREFIX_CODE}Code__c`,
  },
  Pricebook2: {
    objectName: 'Pricebook2',
    query: '',
    fields: 'Id, Name',
  },
  PricingPlan: {
    objectName: 'PricingPlan__c',
    query: '',
    fields: 'Id, Name',
  },
  PricingVariable: {
    objectName: 'PricingVariable__c',
    query: '',
    fields: `Id, Name, ${VLOCITY_NAMESPACE_PREFIX_CODE}Code__c`,
  },
  Product2: {
    objectName: 'Product2',
    query: '',
    fields: `Id, Name, ProductCode, ${VLOCITY_NAMESPACE_PREFIX_CODE}GlobalKey__c`,
  },
  Project: {
    objectName: 'Project__c',
    query: '',
    fields: `Id, Name, ${VLOCITY_NAMESPACE_PREFIX_CODE}GlobalKey__c`,
  },
  Promotion: {
    objectName: 'Promotion__c',
    query: '',
    fields: `Id, Name, ${VLOCITY_NAMESPACE_PREFIX_CODE}GlobalKey__c`,
  },
  QueryBuilder: {
    objectName: 'QueryBuilder__c',
    query: '',
    fields: `Id, Name, ${VLOCITY_NAMESPACE_PREFIX_CODE}QueryBuilder__c`,
  },
  RateBand: {
    objectName: 'RateBand__c',
    query: '',
    fields: 'Id, Name',
  },
  RelationshipGraph: {
    objectName: 'RelationshipGraph__c',
    query: '',
    fields: 'Id',
  },
  Rule: {
    objectName: 'Rule__c',
    query: '',
    fields: `Id, Name, ${VLOCITY_NAMESPACE_PREFIX_CODE}GlobalKey__c`,
  },
  SpecTemplateMapping: {
    objectName: 'SpecTemplateMapping__c',
    query: '',
    fields: `Id, ${VLOCITY_NAMESPACE_PREFIX_CODE}GlobalKey__c`,
  },
  StoryObjectConfiguration: {
    objectName: 'StoryObjectConfiguration__c',
    query: '',
    fields: 'Id, Name',
  },
  String: {
    objectName: 'String__c',
    query: '',
    fields: 'Id, Name',
  },
  System: {
    objectName: 'System__c',
    query: '',
    fields: 'Id, Name',
  },
  ThorOrchestrationQueue: {
    objectName: 'ThorOrchestrationQueue__c',
    query: '',
    fields: `Id, Name, ${VLOCITY_NAMESPACE_PREFIX_CODE}GlobalKey__c`,
  },
  TimePlan: {
    objectName: 'TimePlan__c',
    query: '',
    fields: `Id, Name, ${VLOCITY_NAMESPACE_PREFIX_CODE}GlobalKey__c`,
  },
  TimePolicy: {
    objectName: 'TimePolicy__c',
    query: '',
    fields: `Id, Name, ${VLOCITY_NAMESPACE_PREFIX_CODE}GlobalKey__c`,
  },
  UIFacet: {
    objectName: 'UIFacet__c',
    query: '',
    fields: `Id, Name, ${VLOCITY_NAMESPACE_PREFIX_CODE}GlobalKey__c`,
  },
  UISection: {
    objectName: 'UISection__c',
    query: '',
    fields: `Id, Name, ${VLOCITY_NAMESPACE_PREFIX_CODE}GlobalKey__c`,
  },
  VlocityAction: {
    objectName: 'VlocityAction__c',
    query: `${VLOCITY_NAMESPACE_PREFIX_CODE}IsActive__c = true`,
    fields: 'Id, Name',
  },
  VlocityAttachment: {
    objectName: 'VlocityAttachment__c',
    query: '',
    fields: `Id, Name, ${VLOCITY_NAMESPACE_PREFIX_CODE}GlobalKey__c`,
  },
  VlocityCard: {
    objectName: 'VlocityCard__c',
    query: `${VLOCITY_NAMESPACE_PREFIX_CODE}Active__c = true`,
    fields: 'Id, Name',
  },
  VlocityDataStore: {
    objectName: 'Datastore__c',
    query: '',
    fields: 'Id, Name',
  },
  VlocityFunction: {
    objectName: 'VlocityFunction__c',
    query: '',
    fields: `Id, Name, ${VLOCITY_NAMESPACE_PREFIX_CODE}GlobalKey__c`,
  },
  VlocityPicklist: {
    objectName: 'Picklist__c',
    query: '',
    fields: `Id, Name, ${VLOCITY_NAMESPACE_PREFIX_CODE}GlobalKey__c`,
  },
  VlocitySearchWidgetSetup: {
    objectName: 'VlocitySearchWidgetSetup__c',
    query: '',
    fields: 'Id, Name',
  },
  VlocityScheduledJob: {
    objectName: 'VlocityScheduledJob__c',
    query: '',
    fields: `Id, Name, ${VLOCITY_NAMESPACE_PREFIX_CODE}GlobalKey__c`,
  },
  VlocityStateModel: {
    objectName: 'VlocityStateModel__c',
    query: '',
    fields: 'Id, Name',
  },
  VlocityTrackingGroup: {
    objectName: 'VlocityTrackingGroup__c',
    query: '',
    fields: `Id, ${VLOCITY_NAMESPACE_PREFIX_CODE}GlobalKey__c`,
  },
  VlocityUILayout: {
    objectName: 'VlocityUILayout__c',
    query: `${VLOCITY_NAMESPACE_PREFIX_CODE}Active__c = true`,
    fields: 'Id, Name',
  },
  VlocityUITemplate: {
    objectName: 'VlocityUITemplate__c',
    query: `${VLOCITY_NAMESPACE_PREFIX_CODE}Active__c = true`,
    fields: 'Id, Name',
  },
  VlocityWebTrackingConfiguration: {
    objectName: 'VlocityWebTrackingConfiguration__c',
    query: '',
    fields: `Id, ${VLOCITY_NAMESPACE_PREFIX_CODE}GlobalKey__c`,
  },
  VqMachine: {
    objectName: 'VqMachine__c',
    query: '',
    fields: 'Id, Name',
  },
  VqResource: {
    objectName: 'VqResource__c',
    query: '',
    fields: 'Id, Name',
  },
};

const DATA_PACK_TYPES_ALL_MAP = {
  VqResource: [
    'VqResource__c',
    'Attachment',
    'AttributeAssignment__c',
  ],
  VqMachine: [
    'VqMachine__c',
    'VqMachineResource__c',
  ],
  VlocityUITemplate: [
    'VlocityUITemplate__c',
  ],
  VlocityUILayout: [
    'VlocityUILayout__c',
  ],
  VlocityStateModel: [
    'VlocityStateModel__c',
    'VlocityStateModelVersion__c',
    'VlocityState__c',
    'VlocityStateTransition__c',
  ],
  VlocitySearchWidgetSetup: [
    'VlocitySearchWidgetSetup__c',
    'VlocitySearchWidgetActionsSetup__c',
  ],
  VlocityPicklist: [
    'Picklist__c',
    'PicklistValue__c',
  ],
  VlocityFunction: [
    'VlocityFunction__c',
    'VlocityFunctionArgument__c',
  ],
  VlocityCard: [
    'VlocityCard__c',
  ],
  VlocityAttachment: [
    'VlocityAttachment__c',
  ],
  VlocityAction: [
    'VlocityAction__c',
  ],
  UISection: [
    'UISection__c',
  ],
  UIFacet: [
    'UIFacet__c',
  ],
  TimePolicy: [
    'TimePolicy__c',
  ],
  TimePlan: [
    'TimePlan__c',
  ],
  System: [
    'System__c',
    'SystemInterface__c',
  ],
  String: [
    'String__c',
    'StringTranslation__c',
  ],
  StoryObjectConfiguration: [
    'StoryObjectConfiguration__c',
  ],
  Rule: [
    'Rule__c',
    'RuleVariable__c',
    'RuleAction__c',
    'RuleFilter__c',
  ],
  QueryBuilder: [
    'QueryBuilder__c',
    'QueryBuilderDetail__c',
  ],
  Promotion: [
    'Promotion__c',
    'PromotionItem__c',
  ],
  Product2: [
    'Product2',
    'PricebookEntry',
    'AttributeAssignment__c',
    'ProductChildItem__c',
    'OverrideDefinition__c',
    'ProductConfigurationProcedure__c',
    'ProductRelationship__c',
    'ProductEligibility__c',
    'ProductAvailability__c',
    'RuleAssignment__c',
    'ProductRequirement__c',
    'ObjectFieldAttribute__c',
    'PricingElement__c',
    'PriceListEntry__c',
    'DecompositionRelationship__c',
    'OrchestrationScenario__c',
  ],
  PricingVariable: [
    'PricingVariable__c',
  ],
  PricingPlan: [
    'PricingPlan__c',
    'PricingPlanStep__c',
  ],
  PriceList: [
    'PriceList__c',
    'PricingElement__c',
    'PricingVariable__c',
    'PricingVariableBinding__c',
  ],
  Pricebook2: [
    'Pricebook2',
  ],
  OrchestrationPlanDefinition: [
    'OrchestrationPlanDefinition__c',
  ],
  OrchestrationItemDefinition: [
    'OrchestrationItemDefinition__c',
  ],
  OrchestrationDependencyDefinition: [
    'OrchestrationDependencyDefinition__c',
  ],
  OfferMigrationPlan: [
    'OfferMigrationPlan__c',
    'OfferMigrationComponentMapping__c',
  ],
  OmniScript: [
    'OmniScript__c',
    'Element__c',
  ],
  ObjectLayout: [
    'ObjectLayout__c',
    'ObjectFacet__c',
    'ObjectSection__c',
    'ObjectElement__c',
  ],
  ObjectContextRule: [
    'ObjectRuleAssignment__c',
  ],
  ObjectClass: [
    'ObjectClass__c',
    'ObjectFieldAttribute__c',
    'AttributeBinding__c',
    'AttributeAssignment__c',
  ],
  ManualQueue: [
    'ManualQueue__c',
  ],
  ItemImplementation: [
    'ItemImplementation__c',
  ],
  InterfaceImplementation: [
    'InterfaceImplementation__c',
    'InterfaceImplementationDetail__c',
  ],
  IntegrationProcedure: [
    'OmniScript__c',
    'Element__c',
  ],
  EntityFilter: [
    'EntityFilter__c',
    'EntityFilterCondition__c',
    'EntityFilterMember__c',
    'EntityFilterConditionArgument__c',
  ],
  DocumentTemplate: [
    'DocumentTemplate__c',
    'DocumentTemplateSection__c',
    'DocumentTemplateSectionCondition__c',
  ],
  DocumentClause: [
    'DocumentClause__c',
  ],
  Document: [
    'Document',
  ],
  DataRaptor: [
    'DRBundle__c',
  ],
  CpqConfigurationSetup: [
    'CpqConfigurationSetup__c',
  ],
  ContractType: [
    'ContractType__c',
    'ContractTypeSetting__c',
  ],
  ContextScope: [
    'ContextScope__c',
  ],
  ContextDimension: [
    'ContextDimension__c',
    'ContextMapping__c',
    'ContextMappingArgument__c',
  ],
  ContextAction: [
    'ContextAction__c',
  ],
  Catalog: [
    'Catalog__c',
    'CatalogRelationship__c',
    'CatalogProductRelationship__c',
  ],
  CalculationProcedure: [
    'CalculationProcedure__c',
    'CalculationProcedureVersion__c',
    'CalculationProcedureStep__c',
  ],
  CalculationMatrix: [
    'CalculationMatrix__c',
    'CalculationMatrixVersion__c',
    'CalculationMatrixRow__c',
  ],
  AttributeCategory: [
    'AttributeCategory__c',
    'Attribute__c',
  ],
  AttributeAssignmentRule: [
    'AttributeAssignmentRule__c',
  ],
  Attachment: [
    'Attachment',
  ],
};

module.exports = {
  DEV_NODE_ENV,
  LOCAL_PORT,
  LOCAL_IP,
  STATUS_400_INVALID_JSON_ERROR,
  STATUS_404_ENDPOINT_NOT_FOUND,
  STATUS_500_INTERNAL_SERVER_ERROR,
  ERROR,
  SUCCESS,
  FIELDS_TO_ENCRYPT,
  START_RETRIEVE,
  START_CLEAN_ORG_DATA,
  START_PACK_RETRY,
  START_LWC_OMNI_OUT,
  START_INSTALL_VLOCITY_INITIAL,
  START_BACKUP_BRANCH,
  START_ROLLBACK_BRANCH,
  START_DEPLOYMENT_FROM_BRANCH,
  START_DEPLOYMENT_FROM_DEPLOYMENT,
  REQUIRED_FIELDS_DEPLOYMENT_FROM_BRANCH,
  REQUIRED_FIELDS_DEPLOYMENT_FROM_DEPLOYMENT,
  REQUIRED_OBJECT_FIELDS_DEPLOYMENT_FROM_DEPLOYMENT,
  REQUIRED_OBJECT_FIELDS_RETRIEVE,
  REQUIRED_FIELDS_CLEAN_ORG_DATA,
  REQUIRED_FIELDS_PACK_RETRY,
  REQUIRED_FIELDS_LWC_OMNI_OUT,
  REQUIRED_FIELDS_RETRIEVE,
  REQUIRED_FIELDS_BACKUP,
  REQUIRED_FIELDS_ROLLBACK,
  REQUIRED_FIELDS_ERROR,
  METHOD_TYPE_GET_ATTACHMENTS,
  METHOD_UPDATE_ATTACHMENT_LOG,
  ATTACHMENTS_DELETED,
  UNZIP_CATALOG_NAME,
  VLOCITY_TEMP_NAME,
  VLOCITY_TEMP_PACK_RETRY_NAME,
  JOB_FILE_NAME,
  NAME_LOGS_FILE,
  VLOCITY_TEMP_CATALOG,
  VLOCITY_JOB_INFO,
  METHOD_UPDATE_LOG,
  METHOD_BACKUP_LOG,
  METHOD_NEXT_VLOCITY_STEP,
  METHOD_NEXT_VLOCITY_CONTINUE_DEPLOY_STEP,
  METHOD_BACKUP_LOG_ERROR,
  METHOD_ADD_VLOCITY_TEMP,
  METHOD_TYPE_GET_BRANCH_ATTACHMENTS,
  METHOD_VLOCITY_BACKUP,
  METHOD_ADD_DEPLOYMENT_STATUS_ATTACHMENTS,
  METHOD_TYPE_ADD_COMPONENTS_TO_SNAPSHOT,
  INVALID_SNAPSHOT_TYPE,
  TEMP_FILE,
  TEMP_FOLDER,
  SOURCE_FOLDER,
  APEX_FILE_NAME,
  VLOCITY_APEX_PATH,
  VLOCITY_NAMESPACE_PREFIX_CODE,
  DATA_PACK_TYPES_ALL_MAP,
  DATA_PACK_TYPES_QUERIES_MAP,
  UNSUPPORTED_BY_DEFAULT_LIST,
  MAX_SIZE_UNZIP_ATTACHMENT,
  LWC_OMNI_OUT_QUERY,
};

