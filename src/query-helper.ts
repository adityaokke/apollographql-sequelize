import { GraphqlOutput } from './resolver-helper';
import { ModelDefined, ModelCtor, Model, IncludeOptions, AssociationOptions, FindAttributeOptions, ThroughOptions } from 'sequelize';

export function validateAttribute(
  model: ModelDefined<any, any>,
  attributes: [(string | undefined)?],
): FindAttributeOptions {
  const tableAttr = model.getAttributes();
  const returnAttr: FindAttributeOptions = [];
  attributes.forEach((attr) => {
    if (attr !== undefined) {
      let field = tableAttr[attr].field;
      if (field) {
        returnAttr.push(field);
      }
    }
  });
  return returnAttr;
}

export function associationToInclude(
  model: ModelDefined<any, any>,
  outputAssociation: {
    [key: string]: GraphqlOutput;
  },
): IncludeOptions[] {
  const include: IncludeOptions[] = [];
  let includeItem: IncludeOptions;
  Object.keys(outputAssociation).forEach((associationEntity) => {
    // if selected association exists on associations
    const associationAssociate = model.associations[associationEntity];
    if (associationAssociate) {
      const associationModel = associationAssociate.target;
      includeItem = {
        model: associationModel,
      };
      if (associationAssociate.isAliased) {
        includeItem.as = associationAssociate.as;
      }
      includeItem.include = associationToInclude(associationModel, outputAssociation[associationEntity].associations);
      if (outputAssociation[associationEntity].attributes.length) {
        includeItem.attributes = validateAttribute(associationModel, outputAssociation[associationEntity].attributes);
      }
      // apply "args" alias for arguments
      const { where, required, through, separate } = outputAssociation[associationEntity];
      // only apply "eq" condition on table attribute
      if (where) {
        includeItem.where = where
      }
      if (typeof required === 'boolean') {
        includeItem.required = required;
      }
      if (through) {
        const throughOpt: unknown = through as unknown
        includeItem.through = throughOpt as ThroughOptions;
      }
      if (typeof separate === 'boolean' && !separate) {
        include.push(includeItem);
      }
    }
  });
  return include;
}
