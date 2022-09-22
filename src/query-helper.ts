import { GraphqlOutput } from './resolver-helper';
import { ModelDefined, IncludeOptions, FindAttributeOptions } from 'sequelize';

export function getValidAttributes(
  model: ModelDefined<any, any>,
  attributes: [(string | undefined)?],
): FindAttributeOptions {
  const tableAttr = model.getAttributes();
  const returnAttr: FindAttributeOptions = [];
  attributes.forEach((attr) => {
    if (attr !== undefined) {
      const field = tableAttr[attr].field;
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
      const outputAssocs = outputAssociation[associationEntity].associations;
      if (outputAssocs !== undefined) {
        includeItem.include = associationToInclude(associationModel, outputAssocs);
      }
      const outputAttrs = outputAssociation[associationEntity].attributes;
      if (outputAttrs !== undefined && outputAttrs.length) {
        includeItem.attributes = getValidAttributes(associationModel, outputAttrs);
      }
      // apply "args" alias for arguments
      const { where, required, separate } = outputAssociation[associationEntity];
      // only apply "eq" condition on table attribute
      if (where) {
        includeItem.where = where;
      }
      if (typeof required === 'boolean') {
        includeItem.required = required;
      }
      if ((typeof separate === 'boolean' && !separate) || separate === undefined) {
        include.push(includeItem);
      }
    }
  });
  return include;
}
