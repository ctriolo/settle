Settle
======

This repo contains the code to build Settle, a real-time muliplayer web board game. Find out more at our [project website](http://www.cs.princeton.edu/~ctriolo/333.html).

Set Up the Environment
----------------------

**Settle** requires _node_, _npm_ and _mongoDB_.

From a completely fresh environment run these commands to install (use sudo where necessary):

``` bash
brew install mongodb
brew install node
curl http://npmjs.org/install.sh |  sh
```

After cloning the repository, run these commands in the application root:

``` bash
npm install -d
mkdir data && mkdir data/db
```

Run the Site
--------------

In the application root, run `mongod -dbpath data/db` to start the database and then `node app` to start the server.

Editing and Contributions
-------------------------

Code was written and edited with emacs with an init file containing:

``` lisp
;; Indentation
(setq-default indent-tabs-mode nil)
(setq-default tab-width 2)
(setq-default c-basic-offset 2)

;; Show trailing whitespace and delete on save
(setq-default show-trailing-whitespace t)
(add-hook 'before-save-hook 'delete-trailing-whitespace)

;; Newline at EOF
(setq require-final-newline t)
```
