function information(){
  $(".save_info").click(function(){
    var id = this.id;
    $("#mockName"+id).value;
    $("#validDate"+id).value;
    alert("save inf ->"+$("#mockName"+id).attr("value"));
  });
}
