import { GraphQLResolveInfo, SelectionNode, Kind, ValueNode, ObjectValueNode } from 'graphql';
import { pluralize, singularize, capitalize } from 'inflection';
import { Op, Association, Model, ModelDefined } from 'sequelize';

export interface GraphqlOutput {
  attributes?: [string?];
  associations?: {
    [key: string]: GraphqlOutput;
  };
  arguments?: ObjectParsed;
  union?: {
    [key: string]: GraphqlOutput;
  };
  where?: ObjectParsed;
  required?: graphqlValue;
  separate?: graphqlValue;
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
      const SeqOp = Op[key as keyof typeof Op];
      if (SeqOp) {
        argObj[SeqOp] = parseUnknownVariable(value[key as keyof typeof value]);
      } else {
        argObj[key] = parseUnknownVariable(value[key as keyof typeof value]);
      }
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
  } else if (typeof value === 'number') {
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

export function getOutput(info: GraphQLResolveInfo): GraphqlOutput {
  const getSubOutput = (selectionNodes: ReadonlyArray<SelectionNode>, parentModelName = ''): GraphqlOutput => {
    const attr: GraphqlOutput = {};
    let dataSelections = null;
    selectionNodes.forEach((selectionNode) => {
      if (
        (selectionNode.kind == Kind.INLINE_FRAGMENT || selectionNode.kind == Kind.FIELD) &&
        selectionNode.selectionSet
      ) {
        let nameValue = '';
        if (selectionNode.kind == Kind.INLINE_FRAGMENT) {
          if (attr.union === undefined) {
            attr.union = {};
          }
          nameValue = selectionNode.typeCondition?.name.value || '';
          if (parentModelName && isPluralized(parentModelName)) {
            nameValue = pluralize(nameValue);
          }
          attr.union[nameValue] = getSubOutput(selectionNode.selectionSet.selections, nameValue);
        } else {
          let whereParsed: ObjectParsed = {};
          let required: graphqlValue, separate: graphqlValue;
          const args: ObjectParsed = {};
          nameValue = selectionNode.name.value;
          if (selectionNode.arguments?.length) {
            selectionNode.arguments.forEach((argumentNode) => {
              const nodeValue = parseArgumentNodeValue(argumentNode.value, info);
              if (argumentNode.name.value === 'where' && argumentNode.value.kind === Kind.OBJECT) {
                whereParsed = nodeValue as ObjectParsed;
              } else if (argumentNode.name.value === 'required') {
                required = nodeValue;
              } else if (argumentNode.name.value === 'separate') {
                separate = nodeValue;
              }else {
                args[argumentNode.name.value] = nodeValue;
              }
            });
          }
          if (selectionNode.name.value === 'rows') {
            dataSelections = selectionNode.selectionSet?.selections;
          }
          if (attr.associations === undefined) {
            attr.associations = {};
          }
          attr.associations[nameValue] = getSubOutput(selectionNode.selectionSet?.selections || [], nameValue);
          const { union } = attr.associations[nameValue];
          if (union !== undefined && Object.keys(union).length) {
            Object.keys(union).forEach((key) => {
              if (attr.associations === undefined) {
                attr.associations = {};
              }
              attr.associations[key] = union[key];
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
        }
      } else if (selectionNode.kind == Kind.FIELD) {
        if (attr.attributes === undefined) {
          attr.attributes = [];
        }
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

export function parseResolverArgsWhere(value: unknown): graphqlValue {
  return parseUnknownVariable(value);
}

function parseOrderAssoc(model: ModelDefined<any, any>, assoc: string[]): sequelizeOrder {
  let assocModels: sequelizeOrder = [model];
  Object.keys(model.associations).forEach((key) => {
    if (key.toUpperCase() === assoc[0]) {
      assocModels = [model.associations[key]];
      if (assoc.length > 1) {
        assoc.shift();
        let nextAssocs = parseOrderAssoc(model.associations[key].target, assoc);
        nextAssocs.forEach((nextAssoc) => {
          assocModels.push(nextAssoc);
        });
      }
    }
  });
  return assocModels;
}

function parseOrder(model: ModelDefined<any, any>, value: string): sequelizeOrder {
  let fields = value.split('_');
  const order = fields.pop();
  if (order === undefined) return [];
  if (!fields.length) return [];
  fields = fields.join('_').split('__');
  const field = fields.pop();
  if (field === undefined) return [];
  if (fields.length === 0) {
    return [field, order];
  }
  const assoc = fields;
  let assocModels = parseOrderAssoc(model, assoc);
  assocModels.push(field);
  assocModels.push(order);
  return [];
}

type sequelizeOrder = (string | Association<Model<any, any>, Model<any, any>> | ModelDefined<any, any>)[];
export function parseResolverArgsOrder(model: ModelDefined<any, any>, values: string | string[]): sequelizeOrder[] {
  const orderByReturn: sequelizeOrder[] = [];
  if (typeof values === 'string') {
    orderByReturn.push(parseOrder(model, values));
  } else {
    values.forEach((value) => {
      orderByReturn.push(parseOrder(model, value));
    });
  }
  return orderByReturn;
}
