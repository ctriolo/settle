window.onload = function() {
  $(".path,.intersection,.hex").hover(
    function(){
      $(this).addClass("hover");
    },
    function(){
      $(this).removeClass("hover");
    }
  );
};
