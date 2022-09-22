const { GetOutput, AssociationToInclude, GetValidAttributes, ParseResolverArgsOrder, ParseResolverArgsWhere } = require('../../../lib/index');

module.exports = {
  getOptions(model, args, info) {
    const opt = {};
    if (args.where) {
      opt.where = ParseResolverArgsWhere(args.where);
    }
    if (args.order) {
      opt.order = ParseResolverArgsOrder(args.order);
    }
    const output = GetOutput(info);
    opt.attributes = GetValidAttributes(model, output.attributes);
    if (output.associations) {
      opt.include = AssociationToInclude(model, output.associations);
    }
    if (args.page && args.pageSize) {
      opt.offset = (args.page - 1) * args.pageSize;
      opt.limit = args.pageSize;
    }
    return opt
  },
};
