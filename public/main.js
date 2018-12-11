'use strict';

(function() {




  var socket = io();
  var canvas = document.getElementsByClassName('whiteboard')[0];
  var colors = document.getElementsByClassName('color');
  var context = canvas.getContext('2d');

  var addStickyBtn = document.getElementById('sticky');

  var current = {
    color: 'black'
  };
  var drawing = false;

  addStickyBtn.addEventListener('click', addSticky, false);

   canvas.addEventListener('mousedown', onMouseDown, false);
  canvas.addEventListener('mouseup', onMouseUp, false);
  canvas.addEventListener('mouseout', onMouseUp, false);
  canvas.addEventListener('mousemove', throttle(onMouseMove, 10), false);

  for (var i = 0; i < colors.length; i++){
    colors[i].addEventListener('click', onColorUpdate, false);
  }

  socket.on('sticky-input', stickyInput);
  socket.on('move-sticky', moveSticky);
  socket.on('add-sticky', drawSticky);
  socket.on('drawing', onDrawingEvent);

  window.addEventListener('resize', onResize, false);
  onResize();


  function drawLine(x0, y0, x1, y1, color, emit){
    context.beginPath();
    context.moveTo(x0, y0);
    context.lineTo(x1, y1);
    context.strokeStyle = color;
    context.lineWidth = 2;
    context.stroke();
    context.closePath();

    if (!emit) { return; }
    var w = canvas.width;
    var h = canvas.height;

    socket.emit('drawing', {
      x0: x0 / w,
      y0: y0 / h,
      x1: x1 / w,
      y1: y1 / h,
      color: color
    });
  }

  function onMouseDown(e){
    drawing = true;
    current.x = e.clientX;
    current.y = e.clientY; 
  }

  function onMouseUp(e){
    if (!drawing) { return; }
    drawing = false;
    drawLine(current.x, current.y, e.clientX, e.clientY, current.color, true);
  }

  function onMouseMove(e){
    if (!drawing) { return; }

    drawLine(current.x, current.y, e.clientX, e.clientY, current.color, true);
    current.x = e.clientX;
    current.y = e.clientY;
  }

  function onColorUpdate(e){
    current.color = e.target.className.split(' ')[1];
  }


  // limit the number of events per second
  function throttle(callback, delay) {

    var previousCall = new Date().getTime();
    return function() {
      var time = new Date().getTime();

      if ((time - previousCall) >= delay) {
        previousCall = time;
        callback.apply(null, arguments);
      }
    };
  }

  function onDrawingEvent(data){
    var w = canvas.width;
    var h = canvas.height;
    drawLine(data.x0 * w, data.y0 * h, data.x1 * w, data.y1 * h, data.color);
  }

  // make the canvas fill its parent
  function onResize() {
    canvas.width = window.innerWidth / 2;
    canvas.height = window.innerHeight;
  }

  function addSticky() {
    console.log('Add sticky clicked!');
    socket.emit('add-sticky', { });
  }

  function drawSticky(data) {

    var sticky = $('<div class="sticky" id="' + data.id + '"></div>');

    var input = $("<input />");

    sticky.append(input);

    input.on('input', function(e) {
      console.log('yes', input.val());
      socket.emit('sticky-input', { id: data.id, value: input.val() });
    });
    
    function emitPosition() {
      var left = Number(sticky.css('left').replace('px', ''));
      var top = Number(sticky.css('top').replace('px', ''));

      socket.emit('move-sticky', { id: data.id, left: left, top: top });
    }

    sticky.draggable({
      containment: 'parent',
      start: function() {
        
      },
      drag: emitPosition,
      stop: emitPosition
    });

    $("#sticky-container").append(sticky);
    
  }

  function stickyInput(data) {
    console.log(data);
    $("#" + data.id + " input").val(data.value);
  }

  function moveSticky(data) {
    $("#" + data.id).css({
      left: data.left + 'px',
      top: data.top +'px'
    })
  }

})();





