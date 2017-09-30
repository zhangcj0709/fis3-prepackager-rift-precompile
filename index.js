'use strict';

var handlebars = require('handlebars');


var cwd = fis.processCWD || process.cwd();


function normalizePath(to, root) {
  if (to[0] === '.') {
    to = fis.util(cwd + '/' + to);
  } else if (/^output\b/.test(to)) {
    to = fis.util(root + '/' + to);
  } else if (to === 'preview') {
    to = serverRoot;
  } else {
    to = fis.util(to);
  }
  return to;
}

module.exports = function(ret, conf, settings, opt) {
  var compiledContent = '';
  compiledContent += '(function() {\n';
  compiledContent += 'var template = Handlebars.template, templates = Handlebars.templates = Handlebars.templates || {};\n';
  fis.util.map(ret.src, function(subpath, file) {
      if (file.precompileId) {
          //预编译handlebars模板
          if (file.filename.charAt(0) == "_") {
            compiledContent += ('Handlebars.registerPartial("' + file.precompileId + '", template(' + handlebars.precompile(file.getContent(), settings) + '));\n');
          } else {
            compiledContent += ('templates["' + file.precompileId + '"] = template(' + handlebars.precompile(file.getContent(), settings) + ');\n');
          }
      }
  });
  compiledContent += '})();';

  var to = normalizePath(settings.to || './templates.js',  fis.project.getProjectPath());
  var templateFile = fis.file(to);
  if (templateFile.isFile() && templateFile.getContent() == compiledContent) {
    return; //预编译结果无修改时直接return,防止覆盖文件被监听到导致无限执行
  }
  fis.util.write(to, compiledContent, 'utf8', false);
  fis.log.info("Precompiled handlebars templates to '" + to + "'!");
  templateFile = fis.file(to);
  templateFile.useCache = false;
  fis.compile(templateFile); //重编译templates.js文件
  var packTo = templateFile.packTo;
  if (packTo && templateFile.release) {
    conf[packTo] = conf[packTo] || [];
    if (conf[packTo].indexOf(templateFile.subpath) < 0) {
      conf[packTo].push(templateFile.subpath);
    }
  }
};


/*(function() {

var template = Handlebars.template, templates = Handlebars.templates = Handlebars.templates || {};

// 下面是模板打包：

templates["/组件1/templates/模板1"] = template(function(...)

templates["/组件1/templates/模板2"] = template(function(...)

templates["/组件2/templates/模板1"] = template(function(...)

})();*/