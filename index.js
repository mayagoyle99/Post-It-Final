
const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const port = process.env.PORT || 3000;

app.use(express.static(__dirname + '/public'));

let stickyCounter = 0;

function onConnection(socket){
  socket.on('drawing', (data) => socket.broadcast.emit('drawing', data));

  socket.on('add-sticky', data =>  {

  	data.id = 'sticky-' + (++stickyCounter);

  	io.emit('add-sticky', data);
  });

  socket.on('move-sticky', data => {
  	socket.broadcast.emit('move-sticky', data);
  });

   socket.on('sticky-input', data => {
   	console.log(data);
  	socket.broadcast.emit('sticky-input', data);
  });
}

io.on('connection', onConnection);

http.listen(port, () => console.log('listening on port ' + port));