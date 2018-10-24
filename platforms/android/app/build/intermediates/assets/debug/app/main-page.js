var createViewModel = require("./main-view-model").createViewModel;

function onNavigatingTo(args) {

var http = require("http");


  http.getJSON("http://champion-opt.com/index.php?route=feed/api/categories").then(function (result) {

    return JSON.parse(result.toJSON().body);
    console.log(JSON.stringify(result));

  }, function (e) {

    console.log(e);
      //// Argument (e) is Error!
      //console.log(e);
  });


    var page = args.object;

    page.bindingContext = createViewModel();
}


exports.onNavigatingTo = onNavigatingTo;
