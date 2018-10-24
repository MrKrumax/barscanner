var frameModule = require('ui/frame');
var categoryItemTap = function (args) {
  // console.log(args.index);
  var category = args.object.page.bindingContext.myItems;
  // console.log(JSON.stringify(category[args.index]));
  var topmost = frameModule.topmost();

  const navigationEntry = {
    moduleName: 'products/products',
    context: { category: category[args.index] },
    animated: true
  };

  topmost.navigate(navigationEntry);
};
exports.categoryItemTap = categoryItemTap;
