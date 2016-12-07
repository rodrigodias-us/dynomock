function call_another_page(url,context,rules){
  $.ajax({
    url: url
  }).done(function(html) {
    context.innerHTML = html;
    eval(rules)();
  });
}

//Information
$(document).ready(function(){
  $(".inf").click(function(){
    var context = document.getElementById("inf_"+this.id);
    if(context.innerHTML.length>20){
      context.innerHTML = "";
    } else {
      call_another_page(this.id+"/info",context,"information");
    }
  });
});

//Code Mirror
var editor = CodeMirror.fromTextArea(document.getElementById("editor"), {
  lineNumbers: true,
  matchBrackets: true,
  continueComments: "Enter",
  extraKeys: {"Ctrl-Q": "toggleComment"}
});
