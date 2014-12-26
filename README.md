## Simple ping-pong browser game (using canvas and socket.io on the client side). Node.js used as a back-end server.

To start the game you should install nodejs and npm:
(http://nodejs.org/#download and http://npmjs.org/)

Then clone the game from github and install socket.io dependency:

```sh
$ git clone git://github.com/german/pong.git
$ cd pong
$ npm install
```

OR

```sh
$ sudo npm install
```

Then simply start the server with:

```sh
$ node server.js
```

Finally open two browser windows and point both to http://localhost:8081

Use 'Up' or 'Down' arrows to move your racket. Press Spacebar to start the round (only if two players are connected to the same room)

Demo version: http://germaninthetown.com/pong

**NB:** since the site with demo is hosted in the US user could experience a little lag while playing if one or both players are from Europe or Asia

Tested and works in Google Chrome 8-15 and Firefox 4-8
