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

  //modal

  $(".open_modal").click(function(){
    $(".modal").show();
    if(this.name.length>1){
      $(".message_modal").html(this.id);
      $(".modal_yes").attr("href",this.name);
    }
  });
  $(".close_modal").click(function(){
    $(".modal").hide();
  });
});

//Code Mirror
if(document.getElementById("editor")){
  var editor = CodeMirror.fromTextArea(document.getElementById("editor"), {
    lineNumbers: true,
    matchBrackets: true,
    mode: "application/json",
    gutters: ["CodeMirror-lint-markers"],
    continueComments: "Enter",
    extraKeys: {"Ctrl-Q": "toggleComment"}
  });

    //on load check if the textarea is empty and disable validation
    editor.setOption("lint", editor.getValue().trim() );

    //once changes happen, if the textarea gets filled up again re-enable the validation
    editor.on("change", function(cm, change) {
        editor.setOption("lint", editor.getValue().trim() );
    });

    ///sometimes you need to refresh the CodeMirror instance to fix alignment problems or some other glitch
    setTimeout(function(){
       editor.refresh();
    },0);
}
