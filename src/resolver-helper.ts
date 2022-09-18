import { GraphQLResolveInfo, SelectionNode, Kind, ValueNode, ObjectValueNode } from 'graphql';
import { pluralize, singularize, capitalize } from 'inflection';
import { Op } from 'sequelize';

export interface GraphqlOutput {
  attributes: [string?];
  associations: {
    [key: string]: GraphqlOutput;
  };
  arguments: ObjectParsed;
  union: {
    [key: string]: GraphqlOutput;
  };
  through: GraphqlOutput | undefined;
  where: ObjectParsed;
  required: graphqlValue;
  separate: graphqlValue;
}

interface ThroughModels {
  [key: string | symbol]: GraphqlOutput;
}

interface ObjectParsed {
  [key: string | symbol]: graphqlValue;
}

type graphqlValue = number | string | boolean | graphqlValue[] | ObjectParsed | null | undefined;

function isPluralized(str: string) {
  return pluralize(str) === str;
}

function parseUnknownVariable(value: unknown): graphqlValue {
  if (typeof value === 'object' && value !== null) {
    const argObj: ObjectParsed = {};
    Object.keys(value).forEach((key) => {
      argObj[key] = parseUnknownVariable(value[key as keyof typeof value]);
    });
    return argObj;
  } else if (Array.isArray(value)) {
    const argList: graphqlValue[] = [];
    value.forEach((val) => {
      argList.push(parseUnknownVariable(val));
    });
  } else if (typeof value === undefined) {
    return undefined;
  } else if (typeof value === 'boolean') {
    return value;
  } else {
    return String(value);
  }
}

function parseArgumentNodeValue(value: ValueNode, info: GraphQLResolveInfo): graphqlValue {
  if (value.kind === Kind.OBJECT) {
    return parseArgumentNodeObject(value, info);
  } else if (value.kind === Kind.LIST) {
    return parseArgumentNodeList(value.values, info);
  } else if (value.kind === Kind.NULL) {
    return null;
  } else if (value.kind === Kind.VARIABLE) {
    // if user use variables in schema as value
    const varName = value.name.value;
    return parseUnknownVariable(info.variableValues[varName]);
  } else if (isNaN(Number(value.value))) {
    return Number(value.value);
  }
  // IntValueNode | FloatValueNode | StringValueNode | BooleanValueNode | EnumValueNode
  return value.value;
}

function parseArgumentNodeList(values: readonly ValueNode[], info: GraphQLResolveInfo): graphqlValue[] {
  const returnVal: graphqlValue[] = [];
  values.forEach((value) => {
    returnVal.push(parseArgumentNodeValue(value, info));
  });
  return returnVal;
}

function parseArgumentNodeObject(objectValue: ObjectValueNode, info: GraphQLResolveInfo): ObjectParsed {
  const { fields } = objectValue;
  const objectParsed: ObjectParsed = {};
  fields.forEach((field) => {
    let fieldName = field.name.value;
    const SeqOp = Op[fieldName as keyof typeof Op];
    if (SeqOp) {
      objectParsed[SeqOp] = parseArgumentNodeValue(field.value, info);
    } else {
      objectParsed[fieldName] = parseArgumentNodeValue(field.value, info);
    }
  });
  return objectParsed;
}

export default function getOutput(info: GraphQLResolveInfo): GraphqlOutput {
  const throughModels: ThroughModels = {};
  const getSubOutput = (selectionNodes: ReadonlyArray<SelectionNode>, parentModelName = ''): GraphqlOutput => {
    const attr: GraphqlOutput = {
      attributes: [],
      associations: {},
      arguments: {},
      union: {},
      through: undefined,
      where: {},
      required: undefined,
      separate: undefined,
    };
    let dataSelections = null;
    selectionNodes.forEach((selectionNode) => {
      if (
        (selectionNode.kind == Kind.INLINE_FRAGMENT || selectionNode.kind == Kind.FIELD) &&
        selectionNode.selectionSet
      ) {
        let nameValue = '';
        if (selectionNode.kind == Kind.INLINE_FRAGMENT) {
          nameValue = selectionNode.typeCondition?.name.value.toLowerCase() || '';
          if (parentModelName && isPluralized(parentModelName)) {
            nameValue = pluralize(nameValue);
          }
          attr.union[nameValue] = getSubOutput(selectionNode.selectionSet.selections, nameValue);
        } else {
          let whereParsed: ObjectParsed = {};
          let required: graphqlValue, separate: graphqlValue;
          const args: ObjectParsed = {};
          let isThroughModel = false;
          nameValue = selectionNode.name.value;
          if (selectionNode.arguments?.length) {
            selectionNode.arguments.forEach((argumentNode) => {
              if (argumentNode.name.value === 'where' && argumentNode.value.kind === Kind.OBJECT) {
                whereParsed = parseArgumentNodeObject(argumentNode.value, info);
              } else if (argumentNode.name.value === 'required') {
                required = parseArgumentNodeValue(argumentNode.value, info);
              } else if (argumentNode.name.value === 'separate') {
                separate = parseArgumentNodeValue(argumentNode.value, info);
              } else if (
                argumentNode.name.value === 'through' &&
                argumentNode.value.kind === Kind.BOOLEAN &&
                argumentNode.value.value
              ) {
                isThroughModel = true;
                throughModels[parentModelName] = getSubOutput(selectionNode.selectionSet?.selections || []);
              } else {
                args[argumentNode.name.value] = parseArgumentNodeValue(argumentNode.value, info);
              }
            });
          }
          if (selectionNode.name.value === 'rows') {
            dataSelections = selectionNode.selectionSet?.selections;
          }
          // disable association crawl on through
          if (!isThroughModel) {
            attr.associations[nameValue] = getSubOutput(selectionNode.selectionSet?.selections || [], nameValue);
            if (Object.keys(attr.associations[nameValue].union).length) {
              const { union } = attr.associations[nameValue];
              Object.keys(union).forEach((key) => {
                attr.associations[key] = union[key];
                if (throughModels[key] !== undefined) {
                  attr.associations[key].through = throughModels[key];
                }
                const typeName = singularize(capitalize(key));
                const argsUnion = args[typeName];
                if (argsUnion) {
                  if ((argsUnion as ObjectParsed).where) {
                    attr.associations[key].where = (argsUnion as ObjectParsed).where as ObjectParsed;
                  }
                  if (typeof (argsUnion as ObjectParsed).require === 'boolean') {
                    attr.associations[key].required = (argsUnion as ObjectParsed).required;
                  }
                }
                if (typeof separate === 'boolean') {
                  attr.associations[key].separate = separate;
                }
              });
            } else {
              if (Object.keys(whereParsed).length) {
                attr.associations[nameValue].where = whereParsed;
              }
              if (typeof required === 'boolean') {
                attr.associations[nameValue].required = required;
              }
              if (typeof separate === 'boolean') {
                attr.associations[nameValue].separate = separate;
              }
            }
          } else {
            if (Object.keys(whereParsed).length) {
              throughModels[parentModelName].where = whereParsed;
            }
          }
        }
        if (throughModels[nameValue] !== undefined) {
          if (attr.associations[nameValue]) {
            attr.associations[nameValue].through = throughModels[nameValue];
          } else if (attr.union[nameValue]) {
            attr.union[nameValue].through = throughModels[nameValue];
          }
        }
      } else if (selectionNode.kind == Kind.FIELD) {
        attr.attributes.push(selectionNode.name.value);
      }
    });
    if (dataSelections) {
      return getSubOutput(dataSelections);
    } else {
      return attr;
    }
  };
  const selectionSet = info.fieldNodes[0].selectionSet;
  return getSubOutput((selectionSet && selectionSet.selections) || []);
}
