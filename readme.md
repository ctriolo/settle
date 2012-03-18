Settle
======

This repo contains the code to build Settle, a real-time muliplayer web board game. Find out more at our [project website](http://www.cs.princeton.edu/~ctriolo/333.html).

Set Up the Environment
----------------------

**Settle** requires _node_ and _npm_.

From a completely fresh environment run these commands to install (use sudo where necessary):

``` bash
brew install node
curl http://npmjs.org/install.sh |  sh
```

After cloning the repository, run `npm install -d` from the application root to install the application dependencies.

Run the Server
--------------

Run with `node app` from the application root.

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
