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

Finally open two browser windows and point both to http://localhost:8080

<img width="979" alt="Знімок екрана 2024-02-08 о 13 15 26" src="https://github.com/german/pong/assets/33149/905e5ece-7181-477c-8bf6-85e030c8b2b1">

Use 'Up' or 'Down' arrows to move your racket. Press Spacebar to start the round (only if two players are connected to the same room)

Tested and works in Google Chrome and Firefox
