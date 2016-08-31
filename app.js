/* Custom Autocomplete Snippets */
var mySnippets = [
  {
   name: "read.Alteryx",
   tabTrigger: "read",
   content: 'read.Alteryx(${1:"#1"}, mode = ${2: "data.frame"})'
 },
 {
   name: "write.Alteryx",
   tabTrigger: "write",
   content: 'write.Alteryx(${1:d}, ${2:1})'
 },
 {
   name: "AlteryxProgress",
   tabTrigger: "progress",
   content: 'AlteryxProgress(${1:"25%"})'
 },
 {
   name: "AlteryxGraph",
   tabTrigger: "graph",
   content: 'AlteryxGraph(${1:1}, width = ${2:576}, height = ${3:576})\n# insert code\ninvisible(dev.off())'
 }
]

Alteryx.Gui.BeforeLoad = function(manager, AlteryxDataItems){
  var dataItem = makeDataItem(manager, AlteryxDataItems)
  dataItem('aceTheme', {value: "monokai"})
}


Alteryx.Gui.AfterLoad = function(manager){
  var dataItem = makeDataItem(manager)
  $('[data-submenu]').submenupicker();
  var aceTheme = dataItem("aceTheme", {})
  var editor = initializeEditor(manager, {aceTheme: aceTheme})
  
    syncCode(manager, editor)
};

function initializeEditor(manager, options){
  var editor = ace.edit("editor");
  editor.setTheme("ace/theme/chrome");
  editor.getSession().setMode("ace/mode/r");
  editor.getSession().setUseWrapMode(true);
  editor.renderer.setShowGutter(false);
  editor.setOptions({
    enableBasicAutocompletion: true,
    enableSnippets: true,
    enableLiveAutocompletion: false
  });
  editor.setTheme("ace/theme/" + options.aceTheme.value)
  editor.$blockScrolling = Infinity
  
  /* Specify Click and Tab Triggers */
  $('a.insert').on('click', function() {
    editor.insert("read.Alteryx('#1', mode = 'data.frame')\n")
    editor.setAutoScrollEditorIntoView(true)
  })
  $('a.set-progress').on('click', function(){
    editor.insert("AlteryxProgress(" + $(this).data('pct') + ")\n")
    editor.setAutoScrollEditorIntoView(true)
  })
  $("a.theme").on('click', function(){
    editor.setTheme("ace/theme/" + $(this).data('theme'));
    options.aceTheme.setValue($(this).data('theme'))
  })
  ace.config.loadModule('ace/ext/language_tools', function() {
    editor.setOptions({
      enableBasicAutocompletion: true,
      enableSnippets: true
    })

    var snippetManager = ace.require("ace/snippets").snippetManager;
    var config = ace.require("ace/config");
    ace.config.loadModule("ace/snippets/r", function(m) {
      if (m) {
        snippetManager.files.r = m;
        m.snippets = snippetManager.parseSnippetFile(m.snippetText);
        mySnippets.map(d => m.snippets.push(d))
        snippetManager.register(m.snippets, m.scope);
      }
    });
  });
  return(editor)
}


function syncCode(manager, editor){
  var code = manager.GetDataItem("RScript")
  if (code.value != ""){
    console.log(code.getValue())
    editor.setValue(code.value, -1)
  }
  editor.getSession().on("change", function(){
    console.log('Changed..')
    code.setValue(editor.getSession().getValue())
  })
}
function createUIObject(x) {
  function a2ui(d) {
    return { uiobject: d, dataname: d };
  }
  function o2ui(d) {
    return { uiobject: x[d], dataname: d };
  }
  var f = x.constructor === Array ? a2ui : o2ui;
  var y = x.constructor === Array ? x : Object.keys(x);
  return y.map(f);
}

function makeDataItem(manager, AlteryxDataItems) {
  return function f(id, props) {
    var type = arguments.length <= 2 || arguments[2] === undefined 
      ? 'SimpleString' 
      : arguments[2];

    var value = void 0;
    var dtype = void 0;
    if (props.values) {
      dtype = props.values.constructor === Array 
        ? 'MultiStringSelector' 
        : 'StringSelector';
    } else {
      dtype = type;
    }
    var di = manager.GetDataItem(id);
    var newItem = di || new AlteryxDataItems[dtype]({ id: id, dataname: id });
    if (dtype === 'StringSelector' || dtype === 'MultiStringSelector') {
      var data = createUIObject(props.values);
      newItem.setStringList(data);
      value = props.value ? props.value : data[0].dataname;
    } else {
      value = props.value;
    }
    manager.AddDataItem(newItem);
    if (value) newItem.setValue(value);
    return newItem;
  };
}
