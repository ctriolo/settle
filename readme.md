Settle
======

This repo contains the code to build Settle, a real-time muliplayer web board game. Find out more at our [project website](http://www.cs.princeton.edu/~ctriolo/333.html).

Set Up the Environment
----------------------

**Settle** requires _node_, _npm_, _express_, and _socket.io_.

From a completely fresh environment run these commands to install (use sudo where necessary):
```bash
brew install node
curl http://npmjs.org/install.sh |  sh
npm install -g express
npm install socket.io
```

After cloning the repository, run `npm install -d` from the application root to install the application dependencies.

Run the Server
--------------

Run with `node app` from the application root.