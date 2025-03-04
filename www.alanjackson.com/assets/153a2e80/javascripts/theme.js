//#########################################################################
// 
// THEME.JS
// 
//#########################################################################

$(function() {

  var $window = $(window);
  var $html = $('html');
  var $body = $('body');

  

//============================================================
//  Has Scrolled
//============================================================
  
  $window.scroll(function() {
    if ( $window.scrollTop() >= 1) {
      $html.addClass("has-scrolled");
    } else {
      $html.removeClass("has-scrolled");
    }
  }); 


//============================================================
//  Nav Toggle
//============================================================



  var $navToggle = $('.nav-toggle');

  function navToggleFunc()  { $html.toggleClass("nav-on"); }
  function navBackdropFunc() { $('.nav-backdrop').toggleClass('show'); }

  function navBackdropOn() {
    $body.append('<div class="nav-backdrop"></div>');
    setTimeout(function() {
      navBackdropFunc();
    }, 0);
    $('.nav-backdrop').on('touchstart click', function(e) {
      e.stopPropagation(); e.preventDefault();
      navToggleFunc();
      navBackdropOff();
    });
  }

  function navBackdropOff() {
    navBackdropFunc();
    setTimeout(function() {
      $('.nav-backdrop').remove();
    }, 350); //match to $transition-base-duration
  }

  $navToggle.on('touchstart click', function(e) {
    e.stopPropagation(); e.preventDefault();
    if ($html.hasClass('nav-on')) {
      $navToggle.attr('aria-expanded',"false");
      navToggleFunc();
      navBackdropOff();
    } else {
      $navToggle.attr('aria-expanded',"true");
      navToggleFunc();
      navBackdropOn();
    }
  });


  //Navigate to parent link on 2nd click
  /*
  $("#navigation .dropdown-toggle").on('click', function() {
    if($(this).parent().hasClass('show')) {
      location.assign($(this).attr('href'));
    }
  });
  */


//============================================================
//  Nav
//============================================================

  //active class
  $(".nav a").each(function() {
    if (this.href == window.location) {
      $(this).attr('aria-current','page').addClass('active').parents('li').addClass('active');
    };
  });


//============================================================
//  Smooth Scroll
//============================================================
  

  $('.skip-link')
  .click(function(event) {
    if (
      location.pathname.replace(/^\//, '') == this.pathname.replace(/^\//, '') 
      && 
      location.hostname == this.hostname
    ) {
      var target = $(this.hash);
      target = target.length ? target : $('[name=' + this.hash.slice(1) + ']');
      if (target.length) {
        event.preventDefault();
        $('html, body').animate({
          scrollTop: target.offset().top
        }, 'slow', function() {
          var $target = $(target);
          $target.focus();
          if ($target.is(":focus")) {
            return false;
          } else {
            $target.attr('tabindex','-1');
            $target.focus();
          };
        });
      }
    }
  });


//============================================================
//  Object Fit Fallback
//  Must include .image- styles from _images.scss partial
//============================================================

  if('objectFit' in document.documentElement.style === false) {
    $objectFitContainer = $('[class*=image-]');
    $objectFitContainer.each(function() {
      $this = $(this);
      $img = $this.find('img');
      if ($img.attr('data-src')) {
        $imgSrc = $img.attr('data-src');
      } else {
        $imgSrc = $img.attr('src');
      }
      $img.css('opacity','0');
      $this.css({'background-image': 'url(' + $imgSrc + ')' });
    });
  }


//============================================================
//  Load
//============================================================

  $window.scroll();
  $html.addClass('loaded');


});