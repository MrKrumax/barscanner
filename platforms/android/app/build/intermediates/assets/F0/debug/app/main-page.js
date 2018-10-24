// var createViewModel = require('./main-view-model').createViewModel;

function onNavigatingTo (args) {
  var page = args.object;
  var http = require('http');

  http.getJSON('http://sportsvit.com/index.php?route=feed/api/categories').then(function (result) {
    // return JSON.parse(result.toJSON().body);
    // console.log(JSON.stringify(result));
    page.bindingContext = {myItems: result['categories']};
    page.actionBarHidden = true;
  }, function (e) { console.log(e); });
  // page.bindingContext = createViewModel();
//  page.bindingContext = {myItems: [{title: 'Test'}, {title: 'Test2'}]};
}
exports.onNavigatingTo = onNavigatingTo;
