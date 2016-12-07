function information(){
  $(".save_info").click(function(){
    var id = this.id;
    var mock_name = $("#mockName"+id).val();
    var valid_date = $("#validDate"+id).val();
    var url = id+"/info-save";
    var data = {mock_name:mock_name,valid_date:valid_date};
    saveData(url,data,$("#inf_"+id));
  });
}

//Save data
function saveData(url,data,context){
  var request = $.ajax({
    url: url,
    method: "POST",
    data: data
  });
  request.done(function( msg ) {
    context.html( msg );
  });
  request.fail(function( jqXHR, textStatus ) {
    alert( "Request failed: " + textStatus );
  });
}
