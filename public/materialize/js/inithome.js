(function($){
  $(function(){

    $('.sidenav').sidenav();

  }); // end of document ready
})(jQuery); // end of jQuery name space


$(document).scroll(function() {
  checkOffset();
});

function checkOffset() {
  if(window.innerWidth>=1150)
 { if($('.left_top_text_and_button').offset().top + $('.left_top_text_and_button').height() 
                                         >= $('.page-footer').offset().top+10)
      $('.left_top_text_and_button').css('position', 'absolute').css("margin-top","20%");
  if($(document).scrollTop() + window.innerHeight < $('.page-footer').offset().top)
      $('.left_top_text_and_button').css('position', 'fixed').css("margin-top","0%"); // restore when you scroll up
}
}