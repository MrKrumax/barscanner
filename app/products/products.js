var frameModule = require('ui/frame');
function backToCategoryList () {
  const topmost = frameModule.topmost();
  topmost.goBack();
}
function onNavigatingToProducts (args) {
  var page = args.object;
  var context = page.navigationContext;
  // page.bindingContext = context;
  var http = require('http');
  console.log(JSON.stringify(context));
  http.getJSON('http://sportsvit.com/index.php?route=feed/api/products&category=' + context.category.category_id).then(function (result) {
    // return JSON.parse(result.toJSON().body);
    // console.log(JSON.stringify(result));
    context.products = result['products'];
    page.bindingContext = context;
  }, function (e) { console.log(e); });
}

// function onProductTap (args) {
//   var page = args.object;
// //  var context = page.navigationContext;
//   console.log(JSON.stringify(page));
//   imageView = page.getViewById(ctx.id + 'image');
//   frameModule.topmost().navigate({
//     moduleName: './detail/detail',
//     animated: false,
//     context: {
//       data: ctx,
//       srcImgSize: {
//         height: imageView.height,
//         width: imageView.width
//       },
//       srcImgLoc: imageView.getLocationOnScreen()
//     }
//   });
// }

var onProductTap = function (args) {
  // console.log(args.index);
  // console.log(JSON.stringify(args));
  var product = args.object.page.bindingContext.products;

  console.log(JSON.stringify(product[args.index]));

  var topmost = frameModule.topmost();

  const navigationEntry = {
    moduleName: 'detail/detail',
    context: { product: product[args.index] },
    animated: true
  };

  topmost.navigate(navigationEntry);
};

exports.onProductTap = onProductTap;
exports.onNavigatingToProducts = onNavigatingToProducts;
exports.backToCategoryList = backToCategoryList;
